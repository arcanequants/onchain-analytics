/**
 * RFC 7807 Problem Details Error Format
 *
 * Phase 4, Week 8 Extended - Backend Engineering Checklist
 *
 * Features:
 * - Standard RFC 7807 Problem Details format
 * - Type URIs for error categorization
 * - Extension fields for additional context
 * - Serialization helpers
 * - NextResponse integration
 */

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

/**
 * RFC 7807 Problem Details object
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  /**
   * A URI reference that identifies the problem type.
   * When dereferenced, should provide human-readable documentation.
   */
  type: string;

  /**
   * A short, human-readable summary of the problem type.
   */
  title: string;

  /**
   * The HTTP status code for this occurrence of the problem.
   */
  status: number;

  /**
   * A human-readable explanation specific to this occurrence.
   */
  detail?: string;

  /**
   * A URI reference that identifies the specific occurrence.
   */
  instance?: string;

  /**
   * Extension fields (any additional properties)
   */
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
  value?: unknown;
}

export interface ProblemDetailsOptions {
  detail?: string;
  instance?: string;
  traceId?: string;
  requestId?: string;
  timestamp?: string;
  errors?: ValidationError[];
  retryAfter?: number;
  helpUrl?: string;
}

// ============================================================================
// PROBLEM TYPE URIs
// ============================================================================

const BASE_URI = 'https://aiperception.com/problems';

export const ProblemTypes = {
  // 4xx Client Errors
  BAD_REQUEST: `${BASE_URI}/bad-request`,
  VALIDATION_ERROR: `${BASE_URI}/validation-error`,
  UNAUTHORIZED: `${BASE_URI}/unauthorized`,
  FORBIDDEN: `${BASE_URI}/forbidden`,
  NOT_FOUND: `${BASE_URI}/not-found`,
  METHOD_NOT_ALLOWED: `${BASE_URI}/method-not-allowed`,
  CONFLICT: `${BASE_URI}/conflict`,
  GONE: `${BASE_URI}/gone`,
  PAYLOAD_TOO_LARGE: `${BASE_URI}/payload-too-large`,
  UNSUPPORTED_MEDIA_TYPE: `${BASE_URI}/unsupported-media-type`,
  UNPROCESSABLE_ENTITY: `${BASE_URI}/unprocessable-entity`,
  TOO_MANY_REQUESTS: `${BASE_URI}/too-many-requests`,

  // 5xx Server Errors
  INTERNAL_ERROR: `${BASE_URI}/internal-error`,
  NOT_IMPLEMENTED: `${BASE_URI}/not-implemented`,
  BAD_GATEWAY: `${BASE_URI}/bad-gateway`,
  SERVICE_UNAVAILABLE: `${BASE_URI}/service-unavailable`,
  GATEWAY_TIMEOUT: `${BASE_URI}/gateway-timeout`,

  // Domain-specific Errors
  ANALYSIS_FAILED: `${BASE_URI}/analysis-failed`,
  AI_PROVIDER_ERROR: `${BASE_URI}/ai-provider-error`,
  QUOTA_EXCEEDED: `${BASE_URI}/quota-exceeded`,
  SUBSCRIPTION_REQUIRED: `${BASE_URI}/subscription-required`,
  FEATURE_DISABLED: `${BASE_URI}/feature-disabled`,
  IDEMPOTENCY_CONFLICT: `${BASE_URI}/idempotency-conflict`,
} as const;

export type ProblemType = (typeof ProblemTypes)[keyof typeof ProblemTypes];

// ============================================================================
// PROBLEM TITLES
// ============================================================================

const ProblemTitles: Record<string, string> = {
  [ProblemTypes.BAD_REQUEST]: 'Bad Request',
  [ProblemTypes.VALIDATION_ERROR]: 'Validation Error',
  [ProblemTypes.UNAUTHORIZED]: 'Unauthorized',
  [ProblemTypes.FORBIDDEN]: 'Forbidden',
  [ProblemTypes.NOT_FOUND]: 'Not Found',
  [ProblemTypes.METHOD_NOT_ALLOWED]: 'Method Not Allowed',
  [ProblemTypes.CONFLICT]: 'Conflict',
  [ProblemTypes.GONE]: 'Gone',
  [ProblemTypes.PAYLOAD_TOO_LARGE]: 'Payload Too Large',
  [ProblemTypes.UNSUPPORTED_MEDIA_TYPE]: 'Unsupported Media Type',
  [ProblemTypes.UNPROCESSABLE_ENTITY]: 'Unprocessable Entity',
  [ProblemTypes.TOO_MANY_REQUESTS]: 'Too Many Requests',
  [ProblemTypes.INTERNAL_ERROR]: 'Internal Server Error',
  [ProblemTypes.NOT_IMPLEMENTED]: 'Not Implemented',
  [ProblemTypes.BAD_GATEWAY]: 'Bad Gateway',
  [ProblemTypes.SERVICE_UNAVAILABLE]: 'Service Unavailable',
  [ProblemTypes.GATEWAY_TIMEOUT]: 'Gateway Timeout',
  [ProblemTypes.ANALYSIS_FAILED]: 'Analysis Failed',
  [ProblemTypes.AI_PROVIDER_ERROR]: 'AI Provider Error',
  [ProblemTypes.QUOTA_EXCEEDED]: 'Quota Exceeded',
  [ProblemTypes.SUBSCRIPTION_REQUIRED]: 'Subscription Required',
  [ProblemTypes.FEATURE_DISABLED]: 'Feature Disabled',
  [ProblemTypes.IDEMPOTENCY_CONFLICT]: 'Idempotency Conflict',
};

// ============================================================================
// PROBLEM DETAILS BUILDER
// ============================================================================

export class ProblemDetailsBuilder {
  private problem: ProblemDetails;

  constructor(type: ProblemType, status: number) {
    this.problem = {
      type,
      title: ProblemTitles[type] || 'Error',
      status,
      timestamp: new Date().toISOString(),
    };
  }

  detail(detail: string): this {
    this.problem.detail = detail;
    return this;
  }

  instance(instance: string): this {
    this.problem.instance = instance;
    return this;
  }

  traceId(traceId: string): this {
    this.problem.traceId = traceId;
    return this;
  }

  requestId(requestId: string): this {
    this.problem.requestId = requestId;
    return this;
  }

  errors(errors: ValidationError[]): this {
    this.problem.errors = errors;
    return this;
  }

  retryAfter(seconds: number): this {
    this.problem.retryAfter = seconds;
    return this;
  }

  helpUrl(url: string): this {
    this.problem.helpUrl = url;
    return this;
  }

  extend(fields: Record<string, unknown>): this {
    Object.assign(this.problem, fields);
    return this;
  }

  build(): ProblemDetails {
    return { ...this.problem };
  }

  toResponse(): NextResponse {
    return problemDetailsResponse(this.problem);
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createProblemDetails(
  type: ProblemType,
  status: number,
  options: ProblemDetailsOptions = {}
): ProblemDetails {
  const problem: ProblemDetails = {
    type,
    title: ProblemTitles[type] || 'Error',
    status,
    timestamp: options.timestamp || new Date().toISOString(),
  };

  if (options.detail) problem.detail = options.detail;
  if (options.instance) problem.instance = options.instance;
  if (options.traceId) problem.traceId = options.traceId;
  if (options.requestId) problem.requestId = options.requestId;
  if (options.errors) problem.errors = options.errors;
  if (options.retryAfter) problem.retryAfter = options.retryAfter;
  if (options.helpUrl) problem.helpUrl = options.helpUrl;

  return problem;
}

// ============================================================================
// COMMON ERROR FACTORIES
// ============================================================================

export function badRequest(detail: string, options?: Omit<ProblemDetailsOptions, 'detail'>): ProblemDetails {
  return createProblemDetails(ProblemTypes.BAD_REQUEST, 400, { detail, ...options });
}

export function validationError(errors: ValidationError[], options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.VALIDATION_ERROR, 400, {
    detail: `Validation failed with ${errors.length} error(s)`,
    errors,
    ...options,
  });
}

export function unauthorized(detail?: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.UNAUTHORIZED, 401, {
    detail: detail || 'Authentication required',
    ...options,
  });
}

export function forbidden(detail?: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.FORBIDDEN, 403, {
    detail: detail || 'Access denied',
    ...options,
  });
}

export function notFound(resource?: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.NOT_FOUND, 404, {
    detail: resource ? `${resource} not found` : 'Resource not found',
    ...options,
  });
}

export function conflict(detail: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.CONFLICT, 409, { detail, ...options });
}

export function tooManyRequests(retryAfter: number, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.TOO_MANY_REQUESTS, 429, {
    detail: `Rate limit exceeded. Retry after ${retryAfter} seconds`,
    retryAfter,
    ...options,
  });
}

export function internalError(detail?: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.INTERNAL_ERROR, 500, {
    detail: detail || 'An unexpected error occurred',
    ...options,
  });
}

export function serviceUnavailable(detail?: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.SERVICE_UNAVAILABLE, 503, {
    detail: detail || 'Service temporarily unavailable',
    ...options,
  });
}

// Domain-specific errors
export function analysisFailed(detail: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.ANALYSIS_FAILED, 500, { detail, ...options });
}

export function aiProviderError(provider: string, detail: string, options?: ProblemDetailsOptions): ProblemDetails {
  const problem = createProblemDetails(ProblemTypes.AI_PROVIDER_ERROR, 502, {
    detail,
    ...options,
  });
  problem.provider = provider;
  return problem;
}

export function quotaExceeded(resource: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.QUOTA_EXCEEDED, 429, {
    detail: `${resource} quota exceeded`,
    ...options,
  });
}

export function subscriptionRequired(feature: string, options?: ProblemDetailsOptions): ProblemDetails {
  return createProblemDetails(ProblemTypes.SUBSCRIPTION_REQUIRED, 402, {
    detail: `A subscription is required to access ${feature}`,
    helpUrl: '/pricing',
    ...options,
  });
}

export function idempotencyConflict(idempotencyKey: string, options?: ProblemDetailsOptions): ProblemDetails {
  const problem = createProblemDetails(ProblemTypes.IDEMPOTENCY_CONFLICT, 409, {
    detail: `Request with idempotency key "${idempotencyKey}" is already being processed or has completed`,
    ...options,
  });
  problem.idempotencyKey = idempotencyKey;
  return problem;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function problemDetailsResponse(problem: ProblemDetails): NextResponse {
  const headers: Record<string, string> = {
    'Content-Type': 'application/problem+json',
  };

  if (problem.retryAfter) {
    headers['Retry-After'] = String(problem.retryAfter);
  }

  return NextResponse.json(problem, {
    status: problem.status,
    headers,
  });
}

export function respondWithError(
  type: ProblemType,
  status: number,
  options?: ProblemDetailsOptions
): NextResponse {
  const problem = createProblemDetails(type, status, options);
  return problemDetailsResponse(problem);
}

// ============================================================================
// ERROR CONVERSION
// ============================================================================

export function fromError(error: unknown, options?: ProblemDetailsOptions): ProblemDetails {
  if (error instanceof Error) {
    // Check for known error types
    if (error.name === 'ValidationError') {
      return validationError([], { detail: error.message, ...options });
    }

    if (error.name === 'UnauthorizedError') {
      return unauthorized(error.message, options);
    }

    if (error.name === 'NotFoundError') {
      return notFound(error.message, options);
    }

    return internalError(error.message, options);
  }

  return internalError('An unexpected error occurred', options);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  ProblemTypes,
  ProblemDetailsBuilder,
  createProblemDetails,
  problemDetailsResponse,
  respondWithError,
  fromError,
  // Error factories
  badRequest,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  tooManyRequests,
  internalError,
  serviceUnavailable,
  analysisFailed,
  aiProviderError,
  quotaExceeded,
  subscriptionRequired,
  idempotencyConflict,
};
