/**
 * Request Tracing Module
 *
 * Phase 1, Week 2
 * X-Request-ID header propagation for debugging and log correlation.
 *
 * Usage:
 *   import { withRequestId, getRequestId, generateRequestId } from '@/lib/request-tracing';
 *
 * In middleware:
 *   const requestId = getRequestId(request) || generateRequestId();
 *   response.headers.set('X-Request-ID', requestId);
 *
 * In logging:
 *   logger.info('Processing request', { requestId });
 */

import { nanoid } from 'nanoid';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Header name for request ID
 */
export const REQUEST_ID_HEADER = 'X-Request-ID';

/**
 * Alternative header names that may be used by proxies
 */
export const ALTERNATIVE_HEADERS = [
  'x-request-id',
  'X-Correlation-ID',
  'x-correlation-id',
  'X-Trace-ID',
  'x-trace-id',
];

/**
 * Request ID prefix for this service
 */
export const REQUEST_ID_PREFIX = 'aip';

// ================================================================
// TYPES
// ================================================================

/**
 * Request-like object with headers
 */
interface RequestLike {
  headers: {
    get(name: string): string | null;
  };
}

/**
 * Response-like object with headers
 */
interface ResponseLike {
  headers: {
    set(name: string, value: string): void;
    get(name: string): string | null;
  };
}

// ================================================================
// CORE FUNCTIONS
// ================================================================

/**
 * Generate a new request ID
 *
 * Format: {prefix}_{timestamp}_{random}
 * Example: aip_1701234567890_a1b2c3d4e5
 *
 * @returns Unique request ID
 */
export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = nanoid(10);
  return `${REQUEST_ID_PREFIX}_${timestamp}_${random}`;
}

/**
 * Validate a request ID format
 *
 * @param requestId - Request ID to validate
 * @returns boolean indicating if valid
 */
export function isValidRequestId(requestId: string): boolean {
  if (!requestId || typeof requestId !== 'string') {
    return false;
  }

  // Must be reasonable length (not too long to prevent header injection)
  if (requestId.length > 100) {
    return false;
  }

  // Must contain only safe characters
  if (!/^[a-zA-Z0-9_-]+$/.test(requestId)) {
    return false;
  }

  return true;
}

/**
 * Extract request ID from incoming request headers
 *
 * Checks multiple header names for compatibility with various proxies.
 *
 * @param request - Request object with headers
 * @returns Request ID or null if not present
 */
export function getRequestId(request: RequestLike): string | null {
  // Check primary header first
  let requestId = request.headers.get(REQUEST_ID_HEADER);

  if (requestId && isValidRequestId(requestId)) {
    return requestId;
  }

  // Check alternative headers
  for (const header of ALTERNATIVE_HEADERS) {
    requestId = request.headers.get(header);
    if (requestId && isValidRequestId(requestId)) {
      return requestId;
    }
  }

  return null;
}

/**
 * Get or generate a request ID
 *
 * @param request - Request object with headers
 * @returns Existing request ID or newly generated one
 */
export function getOrGenerateRequestId(request: RequestLike): string {
  return getRequestId(request) || generateRequestId();
}

/**
 * Add request ID header to response
 *
 * @param response - Response object with headers
 * @param requestId - Request ID to add
 */
export function setRequestIdHeader(
  response: ResponseLike,
  requestId: string
): void {
  if (isValidRequestId(requestId)) {
    response.headers.set(REQUEST_ID_HEADER, requestId);
  }
}

/**
 * Check if response has request ID header
 *
 * @param response - Response object with headers
 * @returns boolean indicating if header is present
 */
export function hasRequestIdHeader(response: ResponseLike): boolean {
  return response.headers.get(REQUEST_ID_HEADER) !== null;
}

// ================================================================
// NEXT.JS MIDDLEWARE HELPER
// ================================================================

/**
 * Create request context with tracing information
 *
 * @param request - Request object
 * @returns Context object with requestId and other trace data
 */
export function createRequestContext(request: RequestLike): {
  requestId: string;
  traceParent: string | null;
  spanId: string;
} {
  const requestId = getOrGenerateRequestId(request);
  const traceParent = request.headers.get('traceparent');
  const spanId = nanoid(8);

  return {
    requestId,
    traceParent,
    spanId,
  };
}

// ================================================================
// LOGGING HELPERS
// ================================================================

/**
 * Create a log context object with request tracing info
 *
 * @param requestId - Request ID
 * @param additionalContext - Additional context fields
 * @returns Log context object
 */
export function createLogContext(
  requestId: string,
  additionalContext?: Record<string, unknown>
): Record<string, unknown> {
  return {
    requestId,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  };
}

/**
 * Parse trace parent header (W3C Trace Context format)
 *
 * Format: version-trace_id-parent_id-trace_flags
 * Example: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
 *
 * @param traceParent - Trace parent header value
 * @returns Parsed components or null if invalid
 */
export function parseTraceParent(
  traceParent: string | null
): {
  version: string;
  traceId: string;
  parentId: string;
  flags: string;
} | null {
  if (!traceParent) return null;

  const parts = traceParent.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, parentId, flags] = parts;

  // Validate format
  if (version.length !== 2) return null;
  if (traceId.length !== 32) return null;
  if (parentId.length !== 16) return null;
  if (flags.length !== 2) return null;

  return { version, traceId, parentId, flags };
}

/**
 * Generate a new trace parent header
 *
 * @param parentTraceParent - Optional parent trace to extend
 * @returns New trace parent header value
 */
export function generateTraceParent(parentTraceParent?: string | null): string {
  const parsed = parseTraceParent(parentTraceParent ?? null);

  const version = '00';
  const traceId = parsed?.traceId || nanoid(32).replace(/[^a-f0-9]/gi, '0').slice(0, 32);
  const parentId = nanoid(16).replace(/[^a-f0-9]/gi, '0').slice(0, 16);
  const flags = '01'; // Sampled

  return `${version}-${traceId}-${parentId}-${flags}`;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateRequestId,
  isValidRequestId,
  getRequestId,
  getOrGenerateRequestId,
  setRequestIdHeader,
  hasRequestIdHeader,
  createRequestContext,
  createLogContext,
  parseTraceParent,
  generateTraceParent,
  REQUEST_ID_HEADER,
  ALTERNATIVE_HEADERS,
  REQUEST_ID_PREFIX,
};
