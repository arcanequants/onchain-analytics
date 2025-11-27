/**
 * Structured Error Handling - AppError Hierarchy
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.113
 *
 * Implements a Rust-inspired error hierarchy for type-safe error handling.
 */

// ================================================================
// BASE ERROR
// ================================================================

/**
 * Base interface for all application errors
 */
export interface AppErrorData {
  code: string;
  message: string;
  httpStatus: number;
  isRetriable: boolean;
  isOperational: boolean;
  context?: Record<string, unknown>;
  cause?: Error;
}

/**
 * Base AppError class - all errors extend this
 */
export class AppError extends Error implements AppErrorData {
  readonly code: string;
  readonly httpStatus: number;
  readonly isRetriable: boolean;
  readonly isOperational: boolean;
  readonly context?: Record<string, unknown>;
  readonly cause?: Error;

  constructor(data: AppErrorData) {
    super(data.message);
    this.name = this.constructor.name;
    this.code = data.code;
    this.httpStatus = data.httpStatus;
    this.isRetriable = data.isRetriable;
    this.isOperational = data.isOperational;
    this.context = data.context;
    this.cause = data.cause;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }

  /**
   * Serialize error for API response
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      ...(this.context && { details: this.context }),
    };
  }
}

// ================================================================
// VALIDATION ERRORS
// ================================================================

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: 'ERR_VALIDATION',
      message,
      httpStatus: 400,
      isRetriable: false,
      isOperational: true,
      context,
    });
  }
}

export class UrlValidationError extends ValidationError {
  constructor(message: string, url?: string) {
    super(message, { url });
    this.name = 'UrlValidationError';
  }
}

export class SchemaValidationError extends AppError {
  constructor(message: string, errors?: unknown[]) {
    super({
      code: 'ERR_SCHEMA_VALIDATION',
      message,
      httpStatus: 400,
      isRetriable: false,
      isOperational: true,
      context: { validationErrors: errors },
    });
    this.name = 'SchemaValidationError';
  }
}

export class PayloadTooLargeError extends ValidationError {
  constructor(maxSize: number, actualSize: number) {
    super(`Payload too large. Max: ${maxSize} bytes, received: ${actualSize} bytes`, {
      maxSize,
      actualSize,
    });
    this.name = 'PayloadTooLargeError';
  }
}

// ================================================================
// AUTHENTICATION ERRORS
// ================================================================

export class AuthError extends AppError {
  constructor(message: string, code: string = 'ERR_AUTH', httpStatus: number = 401) {
    super({
      code,
      message,
      httpStatus,
      isRetriable: false,
      isOperational: true,
    });
  }
}

export class UnauthenticatedError extends AuthError {
  constructor(message: string = 'Authentication required') {
    super(message, 'ERR_UNAUTHENTICATED', 401);
    this.name = 'UnauthenticatedError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Access denied') {
    super(message, 'ERR_UNAUTHORIZED', 403);
    this.name = 'UnauthorizedError';
  }
}

export class TokenExpiredError extends AuthError {
  constructor() {
    super('Token has expired', 'ERR_TOKEN_EXPIRED', 401);
    this.name = 'TokenExpiredError';
  }
}

// ================================================================
// RATE LIMIT ERRORS
// ================================================================

export class RateLimitError extends AppError {
  readonly retryAfter: number;

  constructor(retryAfter: number, message?: string) {
    super({
      code: 'ERR_RATE_LIMIT',
      message: message || `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
      httpStatus: 429,
      isRetriable: true,
      isOperational: true,
      context: { retryAfter },
    });
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

// ================================================================
// EXTERNAL SERVICE ERRORS
// ================================================================

export class ExternalServiceError extends AppError {
  readonly service: string;

  constructor(
    service: string,
    message: string,
    isRetriable: boolean = true,
    cause?: Error
  ) {
    super({
      code: 'ERR_EXTERNAL_SERVICE',
      message,
      httpStatus: 502,
      isRetriable,
      isOperational: true,
      context: { service },
      cause,
    });
    this.service = service;
  }
}

export class AIProviderError extends ExternalServiceError {
  readonly provider: string;

  constructor(
    provider: string,
    message: string,
    isRetriable: boolean = true,
    cause?: Error
  ) {
    super(`ai-${provider}`, message, isRetriable, cause);
    this.name = 'AIProviderError';
    this.provider = provider;
  }
}

export class DatabaseError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super('database', message, true, cause);
    this.name = 'DatabaseError';
  }
}

export class CacheError extends ExternalServiceError {
  constructor(message: string, cause?: Error) {
    super('cache', message, true, cause);
    this.name = 'CacheError';
  }
}

// ================================================================
// BUSINESS LOGIC ERRORS
// ================================================================

export class BusinessLogicError extends AppError {
  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super({
      code,
      message,
      httpStatus: 422,
      isRetriable: false,
      isOperational: true,
      context,
    });
  }
}

export class QuotaExceededError extends BusinessLogicError {
  constructor(resource: string, limit: number, current: number) {
    super('ERR_QUOTA_EXCEEDED', `Quota exceeded for ${resource}. Limit: ${limit}, used: ${current}`, {
      resource,
      limit,
      current,
    });
    this.name = 'QuotaExceededError';
  }
}

export class DuplicateAnalysisError extends BusinessLogicError {
  constructor(url: string, existingId: string) {
    super('ERR_DUPLICATE_ANALYSIS', 'Analysis for this URL already in progress', {
      url,
      existingId,
    });
    this.name = 'DuplicateAnalysisError';
  }
}

export class InvalidStateTransitionError extends BusinessLogicError {
  constructor(from: string, to: string, entity: string) {
    super('ERR_INVALID_STATE', `Cannot transition ${entity} from ${from} to ${to}`, {
      from,
      to,
      entity,
    });
    this.name = 'InvalidStateTransitionError';
  }
}

// ================================================================
// NOT FOUND ERRORS
// ================================================================

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super({
      code: 'ERR_NOT_FOUND',
      message: id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      httpStatus: 404,
      isRetriable: false,
      isOperational: true,
      context: { resource, id },
    });
  }
}

// ================================================================
// INTERNAL ERRORS (Bugs)
// ================================================================

export class InternalError extends AppError {
  constructor(message: string, cause?: Error) {
    super({
      code: 'ERR_INTERNAL',
      message,
      httpStatus: 500,
      isRetriable: false,
      isOperational: false, // This is a bug!
      cause,
    });
  }
}

export class AssertionError extends InternalError {
  constructor(condition: string) {
    super(`Assertion failed: ${condition}`);
    this.name = 'AssertionError';
  }
}

export class UnreachableCodeError extends InternalError {
  constructor(context?: string) {
    super(context ? `Unreachable code reached: ${context}` : 'Unreachable code reached');
    this.name = 'UnreachableCodeError';
  }
}

// ================================================================
// ERROR UTILITIES
// ================================================================

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Wrap any error into an AppError
 */
export function wrapError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return new InternalError(error.message, error);
  }

  return new InternalError(String(error));
}

/**
 * Create error from HTTP status code
 */
export function errorFromStatus(status: number, message?: string): AppError {
  switch (status) {
    case 400:
      return new ValidationError(message || 'Bad request');
    case 401:
      return new UnauthenticatedError(message);
    case 403:
      return new UnauthorizedError(message);
    case 404:
      return new NotFoundError('Resource', undefined);
    case 429:
      return new RateLimitError(60, message);
    case 502:
    case 503:
    case 504:
      return new ExternalServiceError('external', message || 'Service unavailable');
    default:
      return new InternalError(message || 'An unexpected error occurred');
  }
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  AppError,
  ValidationError,
  UrlValidationError,
  SchemaValidationError,
  PayloadTooLargeError,
  AuthError,
  UnauthenticatedError,
  UnauthorizedError,
  TokenExpiredError,
  RateLimitError,
  ExternalServiceError,
  AIProviderError,
  DatabaseError,
  CacheError,
  BusinessLogicError,
  QuotaExceededError,
  DuplicateAnalysisError,
  InvalidStateTransitionError,
  NotFoundError,
  InternalError,
  AssertionError,
  UnreachableCodeError,
  isAppError,
  wrapError,
  errorFromStatus,
};
