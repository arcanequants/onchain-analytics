/**
 * API Middleware Factory
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.113 (Backend Engineering)
 *
 * Provides reusable middleware for:
 * - Authentication validation
 * - Rate limiting
 * - Request validation (Zod)
 * - Error handling
 * - Request context
 * - Logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';
import {
  createContext,
  runWithContextAsync,
  type RequestContext,
  type UserPlan,
} from '../context';
import { apiLogger } from '../logger';
import {
  AppError,
  ValidationError,
  UnauthenticatedError,
  RateLimitError,
  InternalError,
  SchemaValidationError,
} from '../errors';
import { Result, Ok, Err } from '../result';

// ================================================================
// TYPES
// ================================================================

export interface APIHandlerContext {
  req: NextRequest;
  params: Record<string, string>;
  context: RequestContext;
  userId?: string;
  userPlan: UserPlan;
}

export type APIHandler<T = unknown> = (
  ctx: APIHandlerContext
) => Promise<Result<T, AppError>>;

export interface MiddlewareOptions {
  /** Require authentication */
  requireAuth?: boolean;
  /** Required user plan (minimum) */
  requiredPlan?: UserPlan;
  /** Rate limit key generator */
  rateLimitKey?: (req: NextRequest) => string;
  /** Rate limit (requests per window) */
  rateLimit?: number;
  /** Rate limit window in seconds */
  rateLimitWindow?: number;
  /** Request body schema validation */
  bodySchema?: ZodSchema;
  /** Query params schema validation */
  querySchema?: ZodSchema;
  /** Request timeout in ms */
  timeout?: number;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    duration?: number;
  };
}

// ================================================================
// RATE LIMITING (In-Memory - Replace with Upstash in production)
// ================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Result<void, RateLimitError> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return Ok(undefined);
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return Err(new RateLimitError(retryAfter));
  }

  entry.count++;
  return Ok(undefined);
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Every minute

// ================================================================
// AUTH HELPERS
// ================================================================

interface AuthResult {
  userId: string;
  userPlan: UserPlan;
}

async function extractAuth(req: NextRequest): Promise<Result<AuthResult | null, AppError>> {
  // Check Authorization header
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return Ok(null); // No auth provided
  }

  if (!authHeader.startsWith('Bearer ')) {
    return Err(new ValidationError('Invalid authorization header format'));
  }

  const token = authHeader.slice(7);

  // TODO: Implement actual JWT validation with Supabase
  // For now, this is a placeholder that should be replaced
  // with actual Supabase auth verification

  try {
    // Placeholder: In production, verify JWT and fetch user data
    // const { data: { user }, error } = await supabase.auth.getUser(token);

    // For development, return mock auth if token matches pattern
    if (token.startsWith('dev_')) {
      return Ok({
        userId: 'dev-user-' + token.slice(4, 12),
        userPlan: 'free' as UserPlan,
      });
    }

    // In production, this would verify the actual token
    return Ok(null);
  } catch (error) {
    apiLogger.warn('Auth token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return Ok(null);
  }
}

function checkPlanAccess(userPlan: UserPlan, requiredPlan: UserPlan): boolean {
  const planHierarchy: Record<UserPlan, number> = {
    free: 0,
    starter: 1,
    pro: 2,
    enterprise: 3,
  };

  return planHierarchy[userPlan] >= planHierarchy[requiredPlan];
}

// ================================================================
// REQUEST HELPERS
// ================================================================

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

function parseQueryParams(req: NextRequest): Record<string, string> {
  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

async function parseBody(req: NextRequest): Promise<Result<unknown, AppError>> {
  try {
    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const text = await req.text();
      if (!text) return Ok({});
      return Ok(JSON.parse(text));
    }

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData();
      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      return Ok(data);
    }

    return Ok({});
  } catch (error) {
    return Err(
      new ValidationError(
        `Failed to parse request body: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

function validateWithSchema<T>(
  data: unknown,
  schema: ZodSchema<T>,
  source: 'body' | 'query'
): Result<T, AppError> {
  try {
    const result = schema.parse(data);
    return Ok(result);
  } catch (error) {
    if (error instanceof ZodError) {
      // Zod v4+ uses .issues instead of .errors
      const issues = error.issues || error.errors || [];
      return Err(
        new SchemaValidationError(
          `Invalid ${source} parameters`,
          issues.map((e: { path: (string | number)[]; message: string }) => ({
            path: e.path.join('.'),
            message: e.message,
          }))
        )
      );
    }
    return Err(new ValidationError(`${source} validation failed`));
  }
}

// ================================================================
// RESPONSE HELPERS
// ================================================================

function createSuccessResponse<T>(
  data: T,
  requestId: string,
  startTime: number,
  status: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      },
    },
    { status }
  );
}

function createErrorResponse(
  error: AppError,
  requestId: string,
  startTime: number
): NextResponse<APIResponse> {
  const response: APIResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.context,
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };

  // Add rate limit header if applicable
  const headers: Record<string, string> = {};
  if (error instanceof RateLimitError) {
    headers['Retry-After'] = String(error.retryAfter);
  }

  return NextResponse.json(response, {
    status: error.httpStatus,
    headers,
  });
}

// ================================================================
// MIDDLEWARE FACTORY
// ================================================================

/**
 * Create an API route handler with middleware
 *
 * @example
 * ```ts
 * // app/api/analyze/route.ts
 * import { withMiddleware } from '@/lib/api/middleware';
 * import { AnalyzeRequestSchema } from './schema';
 *
 * export const POST = withMiddleware(
 *   async (ctx) => {
 *     const { body } = ctx;
 *     // Handle request...
 *     return Ok({ id: 'analysis-123' });
 *   },
 *   {
 *     requireAuth: true,
 *     bodySchema: AnalyzeRequestSchema,
 *     rateLimit: 10,
 *     rateLimitWindow: 60,
 *   }
 * );
 * ```
 */
export function withMiddleware<T>(
  handler: APIHandler<T>,
  options: MiddlewareOptions = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  const {
    requireAuth = false,
    requiredPlan = 'free',
    rateLimitKey = (req) => getClientIP(req),
    rateLimit = 100,
    rateLimitWindow = 60,
    bodySchema,
    querySchema,
    timeout = 30000,
  } = options;

  return async (req: NextRequest, routeContext: { params: Record<string, string> }) => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    // Create request context
    const context = createContext({
      requestId,
      method: req.method,
      path: req.nextUrl.pathname,
      userIp: getClientIP(req),
      userAgent: req.headers.get('user-agent') || undefined,
      timeoutMs: timeout,
    });

    return runWithContextAsync(context, async () => {
      const timer = apiLogger.time(`${req.method} ${req.nextUrl.pathname}`);

      try {
        // 1. Rate limiting
        const rateLimitResult = checkRateLimit(
          rateLimitKey(req),
          rateLimit,
          rateLimitWindow
        );
        if (!rateLimitResult.ok) {
          timer.failure(rateLimitResult.error);
          return createErrorResponse(rateLimitResult.error, requestId, startTime);
        }

        // 2. Authentication
        const authResult = await extractAuth(req);
        if (!authResult.ok) {
          timer.failure(authResult.error);
          return createErrorResponse(authResult.error, requestId, startTime);
        }

        const auth = authResult.value;
        const userId = auth?.userId;
        const userPlan = auth?.userPlan || 'free';

        // 3. Auth requirement check
        if (requireAuth && !userId) {
          const error = new UnauthenticatedError('Authentication required');
          timer.failure(error);
          return createErrorResponse(error, requestId, startTime);
        }

        // 4. Plan check
        if (requiredPlan !== 'free' && !checkPlanAccess(userPlan, requiredPlan)) {
          const error = new UnauthenticatedError(
            `This endpoint requires ${requiredPlan} plan or higher`
          );
          timer.failure(error);
          return createErrorResponse(error, requestId, startTime);
        }

        // 5. Query validation
        let validatedQuery: unknown = {};
        if (querySchema) {
          const queryParams = parseQueryParams(req);
          const queryResult = validateWithSchema(queryParams, querySchema, 'query');
          if (!queryResult.ok) {
            timer.failure(queryResult.error);
            return createErrorResponse(queryResult.error, requestId, startTime);
          }
          validatedQuery = queryResult.value;
        }

        // 6. Body validation
        let validatedBody: unknown = {};
        if (bodySchema && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
          const bodyResult = await parseBody(req);
          if (!bodyResult.ok) {
            timer.failure(bodyResult.error);
            return createErrorResponse(bodyResult.error, requestId, startTime);
          }

          const schemaResult = validateWithSchema(bodyResult.value, bodySchema, 'body');
          if (!schemaResult.ok) {
            timer.failure(schemaResult.error);
            return createErrorResponse(schemaResult.error, requestId, startTime);
          }
          validatedBody = schemaResult.value;
        }

        // 7. Execute handler with timeout
        const handlerContext: APIHandlerContext = {
          req,
          params: routeContext.params,
          context: {
            ...context,
            userId,
            userPlan,
          },
          userId,
          userPlan,
        };

        // Attach validated data to context
        (handlerContext as unknown as Record<string, unknown>).body = validatedBody;
        (handlerContext as unknown as Record<string, unknown>).query = validatedQuery;

        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new InternalError('Request timeout'));
          }, timeout);
        });

        const result = await Promise.race([
          handler(handlerContext),
          timeoutPromise,
        ]);

        // 8. Handle result
        if (!result.ok) {
          timer.failure(result.error);
          return createErrorResponse(result.error, requestId, startTime);
        }

        timer.success({ userId, userPlan });
        return createSuccessResponse(result.value, requestId, startTime);
      } catch (error) {
        // Unexpected error
        const appError =
          error instanceof AppError
            ? error
            : new InternalError(
                error instanceof Error ? error.message : 'Unknown error',
                error instanceof Error ? error : undefined
              );

        timer.failure(appError);

        // Log unexpected errors
        if (!appError.isOperational) {
          apiLogger.fatal('Unhandled error in API handler', appError, {
            path: req.nextUrl.pathname,
            method: req.method,
          });
        }

        return createErrorResponse(appError, requestId, startTime);
      }
    });
  };
}

// ================================================================
// CONVENIENCE WRAPPERS
// ================================================================

/**
 * Create a public API endpoint (no auth required)
 */
export function publicEndpoint<T>(
  handler: APIHandler<T>,
  options: Omit<MiddlewareOptions, 'requireAuth'> = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return withMiddleware(handler, { ...options, requireAuth: false });
}

/**
 * Create a protected API endpoint (auth required)
 */
export function protectedEndpoint<T>(
  handler: APIHandler<T>,
  options: Omit<MiddlewareOptions, 'requireAuth'> = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return withMiddleware(handler, { ...options, requireAuth: true });
}

/**
 * Create a pro-tier API endpoint
 */
export function proEndpoint<T>(
  handler: APIHandler<T>,
  options: Omit<MiddlewareOptions, 'requireAuth' | 'requiredPlan'> = {}
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return withMiddleware(handler, {
    ...options,
    requireAuth: true,
    requiredPlan: 'pro',
  });
}

/**
 * Create an internal API endpoint (for cron jobs, webhooks)
 */
export function internalEndpoint<T>(
  handler: APIHandler<T>,
  cronSecret?: string
): (req: NextRequest, context: { params: Record<string, string> }) => Promise<NextResponse> {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    // Verify cron secret
    const providedSecret = req.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && providedSecret !== cronSecret) {
      return NextResponse.json(
        { success: false, error: { code: 'ERR_UNAUTHORIZED', message: 'Invalid secret' } },
        { status: 401 }
      );
    }

    return withMiddleware(handler, {
      requireAuth: false,
      rateLimit: 1000, // Higher limit for internal endpoints
    })(req, context);
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  withMiddleware,
  publicEndpoint,
  protectedEndpoint,
  proEndpoint,
  internalEndpoint,
};
