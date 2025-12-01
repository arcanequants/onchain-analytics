/**
 * API Key Middleware
 *
 * Middleware for authenticating and authorizing API key requests
 *
 * Phase 2, Week 8, Day 1
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import {
  validateApiKey,
  hasPermission,
  recordUsage,
  parseAuthorizationHeader,
  type ApiKeyPermission,
} from '../api-keys/api-key-service';

// ================================================================
// TYPES
// ================================================================

export interface ApiKeyContext {
  keyId: string;
  userId: string;
  permissions: ApiKeyPermission[];
  rateLimit: {
    limit: number;
    remaining: number;
    reset: Date;
  };
}

export interface PublicApiRequest {
  req: NextRequest;
  params: Record<string, string>;
  apiKey: ApiKeyContext;
  body?: unknown;
  query?: Record<string, string>;
}

export type PublicApiHandler<T = unknown> = (
  ctx: PublicApiRequest
) => Promise<PublicApiResult<T>>;

export type PublicApiResult<T> =
  | { success: true; data: T; status?: number }
  | { success: false; error: string; code: string; status?: number };

export interface PublicApiOptions {
  /** Required permission for this endpoint */
  requiredPermission?: ApiKeyPermission;
  /** Request body schema */
  bodySchema?: ZodSchema;
  /** Query params schema */
  querySchema?: ZodSchema;
}

export interface PublicApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ================================================================
// HELPERS
// ================================================================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function parseQueryParams(req: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

async function parseBody(req: NextRequest): Promise<unknown> {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const text = await req.text();
      if (!text) return {};
      return JSON.parse(text);
    }
    return {};
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function validateWithSchema<T>(
  data: unknown,
  schema: ZodSchema<T>,
  source: 'body' | 'query'
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Invalid ${source}: ${issues.join(', ')}`);
    }
    throw new Error(`${source} validation failed`);
  }
}

// ================================================================
// RESPONSE BUILDERS
// ================================================================

function successResponse<T>(
  data: T,
  requestId: string,
  rateLimit: ApiKeyContext['rateLimit'],
  status: number = 200
): NextResponse<PublicApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    {
      status,
      headers: {
        'X-Request-ID': requestId,
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-RateLimit-Reset': rateLimit.reset.toISOString(),
      },
    }
  );
}

function errorResponse(
  code: string,
  message: string,
  requestId: string,
  status: number = 400,
  rateLimit?: ApiKeyContext['rateLimit']
): NextResponse<PublicApiResponse> {
  const headers: Record<string, string> = {
    'X-Request-ID': requestId,
  };

  if (rateLimit) {
    headers['X-RateLimit-Limit'] = String(rateLimit.limit);
    headers['X-RateLimit-Remaining'] = String(rateLimit.remaining);
    headers['X-RateLimit-Reset'] = rateLimit.reset.toISOString();
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    },
    { status, headers }
  );
}

// ================================================================
// MIDDLEWARE
// ================================================================

/**
 * Create a public API endpoint handler with API key authentication
 *
 * @example
 * ```ts
 * export const GET = withApiKey(
 *   async (ctx) => {
 *     const scores = await getScores(ctx.apiKey.userId);
 *     return { success: true, data: scores };
 *   },
 *   { requiredPermission: 'read:scores' }
 * );
 * ```
 */
export function withApiKey<T>(
  handler: PublicApiHandler<T>,
  options: PublicApiOptions = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  const { requiredPermission, bodySchema, querySchema } = options;

  return async (req: NextRequest, routeContext: { params: Record<string, string> }) => {
    const requestId = generateRequestId();
    const startTime = Date.now();
    const endpoint = req.nextUrl.pathname;
    const method = req.method;

    try {
      // 1. Extract API key from header
      const authHeader = req.headers.get('authorization') || req.headers.get('x-api-key');
      const apiKey = parseAuthorizationHeader(authHeader);

      if (!apiKey) {
        return errorResponse(
          'MISSING_API_KEY',
          'API key is required. Provide via Authorization header (Bearer) or X-API-Key header.',
          requestId,
          401
        );
      }

      // 2. Validate API key
      const validation = await validateApiKey(apiKey, requiredPermission);

      if (!validation.valid) {
        const statusCode = validation.error?.includes('Rate limit') ? 429 : 401;
        return errorResponse(
          'INVALID_API_KEY',
          validation.error || 'Invalid API key',
          requestId,
          statusCode,
          validation.rateLimit
            ? {
                limit: validation.rateLimit.limit,
                remaining: validation.rateLimit.remaining,
                reset: validation.rateLimit.reset,
              }
            : undefined
        );
      }

      // 3. Build API key context
      const apiKeyContext: ApiKeyContext = {
        keyId: validation.keyId!,
        userId: validation.userId!,
        permissions: validation.permissions!,
        rateLimit: {
          limit: validation.rateLimit!.limit,
          remaining: validation.rateLimit!.remaining,
          reset: validation.rateLimit!.reset,
        },
      };

      // 4. Parse and validate query params
      let query: Record<string, string> = {};
      if (querySchema) {
        const rawQuery = parseQueryParams(req);
        query = validateWithSchema(rawQuery, querySchema, 'query');
      } else {
        query = parseQueryParams(req);
      }

      // 5. Parse and validate body
      let body: unknown = {};
      if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const rawBody = await parseBody(req);
        body = validateWithSchema(rawBody, bodySchema, 'body');
      }

      // 6. Execute handler
      const result = await handler({
        req,
        params: routeContext.params,
        apiKey: apiKeyContext,
        body,
        query,
      });

      // 7. Record usage
      await recordUsage(apiKeyContext.keyId, endpoint, method, result.success);

      // 8. Return response
      if (result.success) {
        return successResponse(
          result.data,
          requestId,
          apiKeyContext.rateLimit,
          result.status || 200
        );
      } else {
        return errorResponse(
          result.code,
          result.error,
          requestId,
          result.status || 400,
          apiKeyContext.rateLimit
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';

      // Determine error code and status
      let code = 'INTERNAL_ERROR';
      let status = 500;

      if (message.includes('Invalid JSON')) {
        code = 'INVALID_JSON';
        status = 400;
      } else if (message.includes('Invalid body') || message.includes('Invalid query')) {
        code = 'VALIDATION_ERROR';
        status = 400;
      }

      return errorResponse(code, message, requestId, status);
    }
  };
}

/**
 * Create a read-only endpoint (requires read permission)
 */
export function readEndpoint<T>(
  resource: string,
  handler: PublicApiHandler<T>,
  options: Omit<PublicApiOptions, 'requiredPermission'> = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return withApiKey(handler, {
    ...options,
    requiredPermission: `read:${resource}` as ApiKeyPermission,
  });
}

/**
 * Create a write endpoint (requires write permission)
 */
export function writeEndpoint<T>(
  resource: string,
  handler: PublicApiHandler<T>,
  options: Omit<PublicApiOptions, 'requiredPermission'> = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return withApiKey(handler, {
    ...options,
    requiredPermission: `write:${resource}` as ApiKeyPermission,
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  withApiKey,
  readEndpoint,
  writeEndpoint,
};
