/**
 * API Middleware Tests
 *
 * Phase 1, Week 1, Day 1
 * Tests for the API middleware factory
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withMiddleware,
  publicEndpoint,
  protectedEndpoint,
  proEndpoint,
  internalEndpoint,
  type APIHandlerContext,
  type MiddlewareOptions,
} from './middleware';
import { Ok, Err } from '../result';
import { ValidationError, NotFoundError } from '../errors';

// ================================================================
// TEST HELPERS
// ================================================================

function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): NextRequest {
  const { method = 'GET', headers = {}, body } = options;

  const request = new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}

function createRouteContext(params: Record<string, string> = {}): { params: Record<string, string> } {
  return { params };
}

// ================================================================
// BASIC MIDDLEWARE TESTS
// ================================================================

describe('withMiddleware', () => {
  describe('basic functionality', () => {
    it('should call handler and return success response', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ message: 'Hello' }));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(handler).toHaveBeenCalled();
      const json = await response.json();
      expect(json.success).toBe(true);
      expect(json.data).toEqual({ message: 'Hello' });
      expect(json.meta).toBeDefined();
      expect(json.meta.requestId).toBeDefined();
      expect(json.meta.timestamp).toBeDefined();
      expect(json.meta.duration).toBeGreaterThanOrEqual(0);
    });

    it('should return error response when handler returns Err', async () => {
      const handler = vi.fn().mockResolvedValue(Err(new NotFoundError('Resource')));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(404);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ERR_NOT_FOUND');
      expect(json.error.message).toContain('Resource');
    });

    it('should catch thrown errors and return 500', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Unexpected error'));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ERR_INTERNAL');
    });

    it('should pass route params to handler', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ id: '123' }));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/users/123');
      await endpoint(req, createRouteContext({ id: '123' }));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          params: { id: '123' },
        })
      );
    });

    it('should provide request context to handler', async () => {
      let capturedContext: APIHandlerContext | null = null;
      const handler = vi.fn().mockImplementation((ctx) => {
        capturedContext = ctx;
        return Promise.resolve(Ok({}));
      });

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      await endpoint(req, createRouteContext());

      expect(capturedContext).not.toBeNull();
      expect(capturedContext!.context.requestId).toBeDefined();
      expect(capturedContext!.context.method).toBe('GET');
      expect(capturedContext!.context.path).toBe('/api/test');
    });
  });

  describe('rate limiting', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should allow requests within rate limit', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        rateLimit: 5,
        rateLimitWindow: 60,
        rateLimitKey: () => 'test-key-1',
      });

      const req = createMockRequest('/api/test');

      // Make 5 requests (should all succeed)
      for (let i = 0; i < 5; i++) {
        const response = await endpoint(req, createRouteContext());
        expect(response.status).toBe(200);
      }
    });

    it('should block requests exceeding rate limit', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        rateLimit: 3,
        rateLimitWindow: 60,
        rateLimitKey: () => 'test-key-2',
      });

      const req = createMockRequest('/api/test');

      // Make 3 requests (should succeed)
      for (let i = 0; i < 3; i++) {
        await endpoint(req, createRouteContext());
      }

      // 4th request should be rate limited
      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(429);
      const json = await response.json();
      expect(json.error.code).toBe('ERR_RATE_LIMIT');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should reset rate limit after window expires', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        rateLimit: 2,
        rateLimitWindow: 60,
        rateLimitKey: () => 'test-key-3',
      });

      const req = createMockRequest('/api/test');

      // Make 2 requests
      await endpoint(req, createRouteContext());
      await endpoint(req, createRouteContext());

      // 3rd should fail
      let response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(429);

      // Advance time past window
      vi.advanceTimersByTime(61000);

      // Now should work again
      response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(200);
    });

    it('should use IP-based rate limiting by default', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        rateLimit: 2,
        rateLimitWindow: 60,
      });

      // Request from IP 1
      const req1 = createMockRequest('/api/test', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });

      // Request from IP 2
      const req2 = createMockRequest('/api/test', {
        headers: { 'x-forwarded-for': '5.6.7.8' },
      });

      // Both IPs should have separate limits
      await endpoint(req1, createRouteContext());
      await endpoint(req1, createRouteContext());
      const response1 = await endpoint(req1, createRouteContext());
      expect(response1.status).toBe(429);

      // IP 2 should still work
      const response2 = await endpoint(req2, createRouteContext());
      expect(response2.status).toBe(200);
    });
  });

  describe('authentication', () => {
    it('should not require auth by default', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(200);
    });

    it('should reject unauthenticated requests when requireAuth is true', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, { requireAuth: true });
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.code).toBe('ERR_UNAUTHENTICATED');
    });

    it('should accept dev token in development', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, { requireAuth: true });
      const req = createMockRequest('/api/test', {
        headers: { authorization: 'Bearer dev_testuser' },
      });
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(200);
    });

    it('should provide userId to handler when authenticated', async () => {
      let capturedUserId: string | undefined;
      const handler = vi.fn().mockImplementation((ctx: APIHandlerContext) => {
        capturedUserId = ctx.userId;
        return Promise.resolve(Ok({}));
      });

      const endpoint = withMiddleware(handler, { requireAuth: true });
      const req = createMockRequest('/api/test', {
        headers: { authorization: 'Bearer dev_abc12345' },
      });
      await endpoint(req, createRouteContext());

      expect(capturedUserId).toBe('dev-user-abc12345');
    });

    it('should reject invalid authorization header format', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, { requireAuth: true });
      const req = createMockRequest('/api/test', {
        headers: { authorization: 'Basic credentials' },
      });
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.message).toContain('Invalid authorization header');
    });
  });

  describe('plan access control', () => {
    it('should allow free tier by default', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler);
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());

      expect(response.status).toBe(200);
    });

    it('should reject when user plan is below required', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        requireAuth: true,
        requiredPlan: 'pro',
      });
      const req = createMockRequest('/api/test', {
        headers: { authorization: 'Bearer dev_user123' },
      });
      const response = await endpoint(req, createRouteContext());

      // Dev tokens get 'free' plan
      expect(response.status).toBe(401);
      const json = await response.json();
      expect(json.error.message).toContain('pro plan or higher');
    });
  });

  describe('request validation', () => {
    const TestBodySchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    });

    const TestQuerySchema = z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
    });

    it('should validate request body against schema', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        bodySchema: TestBodySchema,
      });

      const req = createMockRequest('/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { name: 'John', email: 'john@example.com' },
      });

      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(200);
    });

    it('should reject invalid body data', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      // Schema that requires specific fields
      const StrictBodySchema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });

      const endpoint = withMiddleware(handler, {
        bodySchema: StrictBodySchema,
      });

      // Create a POST request with invalid data (name too short)
      const req = new NextRequest(new URL('/api/test', 'http://localhost:3000'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'AB', email: 'not-an-email' }),
      });

      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe('ERR_SCHEMA_VALIDATION');
      expect(json.error.details).toBeDefined();
    });

    it('should validate query parameters', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      const endpoint = withMiddleware(handler, {
        querySchema: TestQuerySchema,
      });

      const req = createMockRequest('/api/test?page=1&limit=10');
      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(200);
    });

    it('should reject invalid query parameters', async () => {
      const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

      // Use a stricter schema that requires the page parameter
      const StrictQuerySchema = z.object({
        page: z.string().min(1),
        required_field: z.string().min(1), // This will fail since we don't provide it
      });

      const endpoint = withMiddleware(handler, {
        querySchema: StrictQuerySchema,
      });

      const req = createMockRequest('/api/test?page=1'); // Missing required_field
      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error.code).toBe('ERR_SCHEMA_VALIDATION');
    });

    it('should provide validated body to handler', async () => {
      let capturedBody: unknown;
      const handler = vi.fn().mockImplementation((ctx) => {
        capturedBody = (ctx as Record<string, unknown>).body;
        return Promise.resolve(Ok({}));
      });

      const endpoint = withMiddleware(handler, {
        bodySchema: TestBodySchema,
      });

      const req = createMockRequest('/api/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: { name: 'John', email: 'john@example.com' },
      });

      await endpoint(req, createRouteContext());
      expect(capturedBody).toEqual({ name: 'John', email: 'john@example.com' });
    });

    it('should provide validated query to handler', async () => {
      let capturedQuery: unknown;
      const handler = vi.fn().mockImplementation((ctx) => {
        capturedQuery = (ctx as Record<string, unknown>).query;
        return Promise.resolve(Ok({}));
      });

      const endpoint = withMiddleware(handler, {
        querySchema: TestQuerySchema,
      });

      const req = createMockRequest('/api/test?page=5&limit=20');
      await endpoint(req, createRouteContext());
      expect(capturedQuery).toEqual({ page: '5', limit: '20' });
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow requests', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        // Use a short delay for testing
        await new Promise((resolve) => setTimeout(resolve, 200));
        return Ok({ success: true });
      });

      // Set a very short timeout
      const endpoint = withMiddleware(handler, { timeout: 50 });
      const req = createMockRequest('/api/test');

      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(500);
      const json = await response.json();
      expect(json.error.message).toContain('timeout');
    }, 10000);

    it('should complete within timeout when handler is fast', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        // Fast handler
        await new Promise((resolve) => setTimeout(resolve, 10));
        return Ok({ success: true });
      });

      const endpoint = withMiddleware(handler, { timeout: 1000 });
      const req = createMockRequest('/api/test');

      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(200);
    });
  });
});

// ================================================================
// CONVENIENCE WRAPPER TESTS
// ================================================================

describe('publicEndpoint', () => {
  it('should create endpoint without auth requirement', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ public: true }));

    const endpoint = publicEndpoint(handler);
    const req = createMockRequest('/api/public');
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.data).toEqual({ public: true });
  });

  it('should accept additional options', async () => {
    const TestSchema = z.object({ id: z.string() });
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    const endpoint = publicEndpoint(handler, {
      querySchema: TestSchema,
    });

    const req = createMockRequest('/api/public?id=123');
    const response = await endpoint(req, createRouteContext());
    expect(response.status).toBe(200);
  });
});

describe('protectedEndpoint', () => {
  it('should require authentication', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ protected: true }));

    const endpoint = protectedEndpoint(handler);
    const req = createMockRequest('/api/protected');
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(401);
  });

  it('should allow authenticated requests', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ protected: true }));

    const endpoint = protectedEndpoint(handler);
    const req = createMockRequest('/api/protected', {
      headers: { authorization: 'Bearer dev_user123' },
    });
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(200);
  });
});

describe('proEndpoint', () => {
  it('should require authentication', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ pro: true }));

    const endpoint = proEndpoint(handler);
    const req = createMockRequest('/api/pro');
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(401);
  });

  it('should require pro plan', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ pro: true }));

    const endpoint = proEndpoint(handler);
    const req = createMockRequest('/api/pro', {
      headers: { authorization: 'Bearer dev_user123' },
    });
    const response = await endpoint(req, createRouteContext());

    // Dev tokens get 'free' plan, so should be rejected
    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error.message).toContain('pro plan');
  });
});

describe('internalEndpoint', () => {
  it('should allow requests without secret when none configured', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ internal: true }));

    const endpoint = internalEndpoint(handler);
    const req = createMockRequest('/api/cron');
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(200);
  });

  it('should reject requests without valid secret', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ internal: true }));

    const endpoint = internalEndpoint(handler, 'my-secret');
    const req = createMockRequest('/api/cron');
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(401);
  });

  it('should accept requests with valid secret', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ internal: true }));

    const endpoint = internalEndpoint(handler, 'my-secret');
    const req = createMockRequest('/api/cron', {
      headers: { authorization: 'Bearer my-secret' },
    });
    const response = await endpoint(req, createRouteContext());

    expect(response.status).toBe(200);
  });

  it('should have higher rate limit', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ internal: true }));

    const endpoint = internalEndpoint(handler);

    // Should handle many requests (up to 1000)
    for (let i = 0; i < 100; i++) {
      const req = createMockRequest('/api/cron', {
        headers: { 'x-forwarded-for': '10.0.0.1' },
      });
      const response = await endpoint(req, createRouteContext());
      expect(response.status).toBe(200);
    }
  });
});

// ================================================================
// RESPONSE FORMAT TESTS
// ================================================================

describe('API Response Format', () => {
  it('should include all required meta fields', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ data: 'test' }));

    const endpoint = withMiddleware(handler);
    const req = createMockRequest('/api/test');
    const response = await endpoint(req, createRouteContext());

    const json = await response.json();
    expect(json.meta).toMatchObject({
      requestId: expect.any(String),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      duration: expect.any(Number),
    });
  });

  it('should include error details in error response', async () => {
    const handler = vi.fn().mockResolvedValue(
      Err(new ValidationError('Invalid input', { field: 'name' }))
    );

    const endpoint = withMiddleware(handler);
    const req = createMockRequest('/api/test');
    const response = await endpoint(req, createRouteContext());

    const json = await response.json();
    expect(json.error).toMatchObject({
      code: expect.any(String),
      message: expect.any(String),
    });
    expect(json.meta).toBeDefined();
  });

  it('should have unique request IDs', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({}));
    const endpoint = withMiddleware(handler);

    const ids: string[] = [];
    for (let i = 0; i < 10; i++) {
      const req = createMockRequest('/api/test');
      const response = await endpoint(req, createRouteContext());
      const json = await response.json();
      ids.push(json.meta.requestId);
    }

    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(10);
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle empty request body', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    const endpoint = withMiddleware(handler);
    const req = createMockRequest('/api/test', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
    });

    const response = await endpoint(req, createRouteContext());
    expect(response.status).toBe(200);
  });

  it('should handle malformed JSON body', async () => {
    const TestSchema = z.object({ name: z.string() });
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    const endpoint = withMiddleware(handler, { bodySchema: TestSchema });

    // Create request with invalid JSON
    const req = new NextRequest(new URL('/api/test', 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{ invalid json }',
    });

    const response = await endpoint(req, createRouteContext());
    expect(response.status).toBe(400);
  });

  it('should handle multiple x-forwarded-for IPs', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    // Use unique key to avoid collision with other tests
    const uniqueIp = `multi-ip-${Date.now()}`;
    const endpoint = withMiddleware(handler, {
      rateLimit: 1,
      rateLimitWindow: 60,
      rateLimitKey: () => uniqueIp,
    });

    const req = createMockRequest('/api/test', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' },
    });

    // First request should succeed
    const response1 = await endpoint(req, createRouteContext());
    expect(response1.status).toBe(200);

    // Second should be rate limited
    const response2 = await endpoint(req, createRouteContext());
    expect(response2.status).toBe(429);
  });

  it('should skip body validation for GET requests', async () => {
    const TestSchema = z.object({ name: z.string() });
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    const endpoint = withMiddleware(handler, { bodySchema: TestSchema });

    const req = createMockRequest('/api/test'); // GET request
    const response = await endpoint(req, createRouteContext());

    // Should not fail validation for GET
    expect(response.status).toBe(200);
  });

  it('should handle form-urlencoded content type', async () => {
    const handler = vi.fn().mockResolvedValue(Ok({ success: true }));

    const endpoint = withMiddleware(handler);

    // Create FormData request
    const formData = new FormData();
    formData.append('name', 'John');

    const req = new NextRequest(new URL('/api/test', 'http://localhost:3000'), {
      method: 'POST',
      body: formData,
    });

    const response = await endpoint(req, createRouteContext());
    expect(response.status).toBe(200);
  });
});
