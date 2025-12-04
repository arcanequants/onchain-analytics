/**
 * Secure Error Handler
 *
 * RED TEAM AUDIT FIX: MEDIUM-003
 * Prevents verbose error messages from leaking to production
 *
 * Features:
 * - Stack trace sanitization
 * - Error code mapping
 * - Safe error messages for users
 * - Detailed logging for debugging
 */

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export interface SafeError {
  code: string;
  message: string;
  requestId?: string;
}

export interface DetailedError extends SafeError {
  stack?: string;
  cause?: unknown;
  context?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  timestamp: string;
  requestId: string;
  code: string;
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  ip?: string;
  path?: string;
}

// ============================================================================
// ERROR CODE MAPPING
// ============================================================================

const ERROR_CODES: Record<string, { status: number; publicMessage: string }> = {
  // Authentication errors
  UNAUTHORIZED: { status: 401, publicMessage: 'Authentication required' },
  INVALID_TOKEN: { status: 401, publicMessage: 'Invalid or expired token' },
  FORBIDDEN: { status: 403, publicMessage: 'Access denied' },
  ROLE_FORBIDDEN: { status: 403, publicMessage: 'Insufficient permissions' },

  // Validation errors
  VALIDATION_ERROR: { status: 400, publicMessage: 'Invalid request data' },
  INVALID_URL: { status: 400, publicMessage: 'Invalid URL provided' },
  MISSING_REQUIRED_FIELD: { status: 400, publicMessage: 'Required field missing' },

  // Rate limiting
  RATE_LIMITED: { status: 429, publicMessage: 'Too many requests. Please try again later.' },

  // Security errors
  SECURITY_BLOCK: { status: 403, publicMessage: 'Request blocked for security reasons' },
  INJECTION_DETECTED: { status: 403, publicMessage: 'Invalid input detected' },

  // Resource errors
  NOT_FOUND: { status: 404, publicMessage: 'Resource not found' },
  ALREADY_EXISTS: { status: 409, publicMessage: 'Resource already exists' },

  // External service errors
  PROVIDER_ERROR: { status: 502, publicMessage: 'External service unavailable' },
  TIMEOUT: { status: 504, publicMessage: 'Request timed out' },

  // Internal errors
  INTERNAL_ERROR: { status: 500, publicMessage: 'An unexpected error occurred' },
  DATABASE_ERROR: { status: 500, publicMessage: 'An unexpected error occurred' },
  CONFIGURATION_ERROR: { status: 500, publicMessage: 'Service temporarily unavailable' },
};

// ============================================================================
// ENVIRONMENT CHECK
// ============================================================================

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ============================================================================
// REQUEST ID GENERATION
// ============================================================================

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize an error for safe public display
 */
function sanitizeError(error: unknown, code: string, requestId: string): SafeError {
  const errorInfo = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;

  return {
    code,
    message: errorInfo.publicMessage,
    requestId,
  };
}

/**
 * Extract error details for logging (never expose to users)
 */
function extractErrorDetails(error: unknown): { message: string; stack?: string; cause?: unknown } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: String(error) };
}

// ============================================================================
// LOGGING
// ============================================================================

/**
 * Log error securely (full details, but not exposed to client)
 */
function logError(entry: ErrorLogEntry): void {
  // In production, send to logging service (Sentry, etc.)
  if (isProduction()) {
    // Remove stack traces from console in production
    console.error(JSON.stringify({
      timestamp: entry.timestamp,
      requestId: entry.requestId,
      code: entry.code,
      message: entry.message,
      path: entry.path,
    }));

    // TODO: Send to Sentry or other error tracking service
    // captureException(new Error(entry.message), { extra: entry });
  } else {
    // Full details in development
    console.error('[Error]', entry);
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Handle an error and return a safe response
 */
export function handleError(
  error: unknown,
  options: {
    code?: string;
    context?: Record<string, unknown>;
    path?: string;
    userAgent?: string;
    ip?: string;
  } = {}
): NextResponse {
  const requestId = generateRequestId();
  const timestamp = new Date().toISOString();
  const errorDetails = extractErrorDetails(error);

  // Determine error code
  let code = options.code || 'INTERNAL_ERROR';

  // Auto-detect some error types
  if (!options.code) {
    if (errorDetails.message.includes('timeout') || errorDetails.message.includes('ETIMEDOUT')) {
      code = 'TIMEOUT';
    } else if (errorDetails.message.includes('rate limit')) {
      code = 'RATE_LIMITED';
    } else if (errorDetails.message.includes('not found')) {
      code = 'NOT_FOUND';
    }
  }

  // Log full error details
  logError({
    timestamp,
    requestId,
    code,
    message: errorDetails.message,
    stack: errorDetails.stack,
    context: options.context,
    path: options.path,
    userAgent: options.userAgent,
    ip: options.ip,
  });

  // Create safe response
  const safeError = sanitizeError(error, code, requestId);
  const errorInfo = ERROR_CODES[code] || ERROR_CODES.INTERNAL_ERROR;

  // In development, include more details
  const responseBody = isDevelopment()
    ? {
        error: safeError,
        debug: {
          originalMessage: errorDetails.message,
          stack: errorDetails.stack?.split('\n').slice(0, 5),
        },
      }
    : { error: safeError };

  return NextResponse.json(responseBody, {
    status: errorInfo.status,
    headers: {
      'X-Request-ID': requestId,
    },
  });
}

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandler<T extends Request>(
  handler: (request: T) => Promise<NextResponse>
): (request: T) => Promise<NextResponse> {
  return async (request: T): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      return handleError(error, {
        path: new URL(request.url).pathname,
        userAgent: request.headers.get('user-agent') || undefined,
        ip: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
      });
    }
  };
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert a condition and throw a typed error if false
 */
export function assertOrThrow(
  condition: unknown,
  code: string,
  message?: string
): asserts condition {
  if (!condition) {
    const error = new Error(message || `Assertion failed: ${code}`);
    (error as Error & { code: string }).code = code;
    throw error;
  }
}

/**
 * Create a typed error for throwing
 */
export function createError(code: string, message?: string): Error & { code: string } {
  const errorInfo = ERROR_CODES[code];
  const error = new Error(message || errorInfo?.publicMessage || 'Unknown error') as Error & { code: string };
  error.code = code;
  return error;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  ERROR_CODES,
  generateRequestId,
  isProduction,
  isDevelopment,
};

export default {
  handleError,
  withErrorHandler,
  assertOrThrow,
  createError,
  ERROR_CODES,
};
