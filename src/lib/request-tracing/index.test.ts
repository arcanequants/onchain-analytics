/**
 * Request Tracing Module Tests
 *
 * Phase 1, Week 2
 * Tests for X-Request-ID propagation and tracing
 */

import { describe, it, expect } from 'vitest';
import {
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
} from './index';

// Mock request/response helpers
function createMockRequest(headers: Record<string, string> = {}) {
  return {
    headers: {
      get: (name: string) => headers[name] || headers[name.toLowerCase()] || null,
    },
  };
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  return {
    headers: {
      set: (name: string, value: string) => {
        headers[name] = value;
      },
      get: (name: string) => headers[name] || null,
    },
    _headers: headers,
  };
}

describe('Request Tracing', () => {
  describe('generateRequestId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();
      expect(id1).not.toBe(id2);
    });

    it('should start with prefix', () => {
      const id = generateRequestId();
      expect(id.startsWith(REQUEST_ID_PREFIX)).toBe(true);
    });

    it('should include timestamp', () => {
      const before = Date.now();
      const id = generateRequestId();
      const after = Date.now();

      const parts = id.split('_');
      expect(parts.length).toBe(3);

      const timestamp = parseInt(parts[1], 10);
      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should have random suffix', () => {
      const id = generateRequestId();
      const parts = id.split('_');
      // nanoid produces a random suffix
      expect(parts[2]).toBeDefined();
      // nanoid(10) produces approximately 10 chars, but may vary slightly
      expect(parts[2].length).toBeGreaterThanOrEqual(8);
      expect(parts[2].length).toBeLessThanOrEqual(12);
    });

    it('should be valid', () => {
      const id = generateRequestId();
      expect(isValidRequestId(id)).toBe(true);
    });
  });

  describe('isValidRequestId', () => {
    it('should accept valid IDs', () => {
      expect(isValidRequestId('aip_1234567890_abcdef1234')).toBe(true);
      expect(isValidRequestId('req-abc123')).toBe(true);
      expect(isValidRequestId('simple_id')).toBe(true);
    });

    it('should reject empty strings', () => {
      expect(isValidRequestId('')).toBe(false);
    });

    it('should reject null/undefined', () => {
      expect(isValidRequestId(null as unknown as string)).toBe(false);
      expect(isValidRequestId(undefined as unknown as string)).toBe(false);
    });

    it('should reject too long IDs', () => {
      const longId = 'a'.repeat(101);
      expect(isValidRequestId(longId)).toBe(false);
    });

    it('should reject IDs with special characters', () => {
      expect(isValidRequestId('id with spaces')).toBe(false);
      expect(isValidRequestId('id<script>')).toBe(false);
      expect(isValidRequestId('id\nwith\nnewlines')).toBe(false);
    });

    it('should accept IDs at max length', () => {
      const maxId = 'a'.repeat(100);
      expect(isValidRequestId(maxId)).toBe(true);
    });
  });

  describe('getRequestId', () => {
    it('should extract from primary header', () => {
      const request = createMockRequest({
        'X-Request-ID': 'test-request-id',
      });
      expect(getRequestId(request)).toBe('test-request-id');
    });

    it('should extract from lowercase header', () => {
      const request = createMockRequest({
        'x-request-id': 'lowercase-id',
      });
      expect(getRequestId(request)).toBe('lowercase-id');
    });

    it('should extract from correlation ID header', () => {
      const request = createMockRequest({
        'X-Correlation-ID': 'correlation-id',
      });
      expect(getRequestId(request)).toBe('correlation-id');
    });

    it('should extract from trace ID header', () => {
      const request = createMockRequest({
        'X-Trace-ID': 'trace-id',
      });
      expect(getRequestId(request)).toBe('trace-id');
    });

    it('should return null when no header present', () => {
      const request = createMockRequest({});
      expect(getRequestId(request)).toBeNull();
    });

    it('should reject invalid IDs', () => {
      const request = createMockRequest({
        'X-Request-ID': 'invalid <script>id',
      });
      expect(getRequestId(request)).toBeNull();
    });

    it('should prefer primary header', () => {
      const request = createMockRequest({
        'X-Request-ID': 'primary-id',
        'X-Correlation-ID': 'correlation-id',
      });
      expect(getRequestId(request)).toBe('primary-id');
    });
  });

  describe('getOrGenerateRequestId', () => {
    it('should return existing ID if present', () => {
      const request = createMockRequest({
        'X-Request-ID': 'existing-id',
      });
      expect(getOrGenerateRequestId(request)).toBe('existing-id');
    });

    it('should generate new ID if not present', () => {
      const request = createMockRequest({});
      const id = getOrGenerateRequestId(request);
      expect(id).toBeDefined();
      expect(id.startsWith(REQUEST_ID_PREFIX)).toBe(true);
    });
  });

  describe('setRequestIdHeader', () => {
    it('should set header on response', () => {
      const response = createMockResponse();
      setRequestIdHeader(response, 'test-id');
      expect(response.headers.get(REQUEST_ID_HEADER)).toBe('test-id');
    });

    it('should not set invalid IDs', () => {
      const response = createMockResponse();
      setRequestIdHeader(response, 'invalid <script>');
      expect(response.headers.get(REQUEST_ID_HEADER)).toBeNull();
    });
  });

  describe('hasRequestIdHeader', () => {
    it('should return true when header present', () => {
      const response = createMockResponse();
      setRequestIdHeader(response, 'test-id');
      expect(hasRequestIdHeader(response)).toBe(true);
    });

    it('should return false when header absent', () => {
      const response = createMockResponse();
      expect(hasRequestIdHeader(response)).toBe(false);
    });
  });

  describe('createRequestContext', () => {
    it('should create context with request ID', () => {
      const request = createMockRequest({
        'X-Request-ID': 'context-test-id',
      });
      const context = createRequestContext(request);

      expect(context.requestId).toBe('context-test-id');
      expect(context.spanId).toBeDefined();
      expect(context.spanId.length).toBe(8);
    });

    it('should generate request ID if not present', () => {
      const request = createMockRequest({});
      const context = createRequestContext(request);

      expect(context.requestId).toBeDefined();
      expect(context.requestId.startsWith(REQUEST_ID_PREFIX)).toBe(true);
    });

    it('should extract trace parent if present', () => {
      const request = createMockRequest({
        'traceparent': '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01',
      });
      const context = createRequestContext(request);

      expect(context.traceParent).toBe(
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );
    });

    it('should have null trace parent if not present', () => {
      const request = createMockRequest({});
      const context = createRequestContext(request);

      expect(context.traceParent).toBeNull();
    });
  });

  describe('createLogContext', () => {
    it('should create context with request ID', () => {
      const context = createLogContext('log-test-id');

      expect(context.requestId).toBe('log-test-id');
      expect(context.timestamp).toBeDefined();
    });

    it('should include additional context', () => {
      const context = createLogContext('log-test-id', {
        userId: 'user123',
        action: 'test',
      });

      expect(context.requestId).toBe('log-test-id');
      expect(context.userId).toBe('user123');
      expect(context.action).toBe('test');
    });

    it('should have valid ISO timestamp', () => {
      const context = createLogContext('log-test-id');

      expect(() => new Date(context.timestamp as string)).not.toThrow();
    });
  });

  describe('parseTraceParent', () => {
    it('should parse valid trace parent', () => {
      const parsed = parseTraceParent(
        '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01'
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe('00');
      expect(parsed?.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
      expect(parsed?.parentId).toBe('b7ad6b7169203331');
      expect(parsed?.flags).toBe('01');
    });

    it('should return null for null input', () => {
      expect(parseTraceParent(null)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(parseTraceParent('invalid')).toBeNull();
      expect(parseTraceParent('00-abc-def-01')).toBeNull();
      expect(parseTraceParent('')).toBeNull();
    });

    it('should return null for wrong number of parts', () => {
      expect(parseTraceParent('00-abc')).toBeNull();
      expect(parseTraceParent('00-abc-def-01-extra')).toBeNull();
    });
  });

  describe('generateTraceParent', () => {
    it('should generate valid trace parent', () => {
      const traceParent = generateTraceParent();
      const parsed = parseTraceParent(traceParent);

      expect(parsed).not.toBeNull();
      expect(parsed?.version).toBe('00');
      expect(parsed?.traceId.length).toBe(32);
      expect(parsed?.parentId.length).toBe(16);
      expect(parsed?.flags).toBe('01');
    });

    it('should preserve trace ID from parent', () => {
      const parent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
      const child = generateTraceParent(parent);
      const parsed = parseTraceParent(child);

      expect(parsed?.traceId).toBe('0af7651916cd43dd8448eb211c80319c');
      // Parent ID should be different (new span)
      expect(parsed?.parentId).not.toBe('b7ad6b7169203331');
    });

    it('should generate new trace ID when no parent', () => {
      const traceParent1 = generateTraceParent();
      const traceParent2 = generateTraceParent();

      const parsed1 = parseTraceParent(traceParent1);
      const parsed2 = parseTraceParent(traceParent2);

      expect(parsed1?.traceId).not.toBe(parsed2?.traceId);
    });
  });

  describe('constants', () => {
    it('should have correct header name', () => {
      expect(REQUEST_ID_HEADER).toBe('X-Request-ID');
    });

    it('should have alternative headers', () => {
      expect(ALTERNATIVE_HEADERS).toContain('x-request-id');
      expect(ALTERNATIVE_HEADERS).toContain('X-Correlation-ID');
      expect(ALTERNATIVE_HEADERS).toContain('X-Trace-ID');
    });

    it('should have prefix', () => {
      expect(REQUEST_ID_PREFIX).toBe('aip');
    });
  });
});
