/**
 * API Key Middleware Tests
 *
 * Phase 2, Week 8, Day 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  withApiKey,
  readEndpoint,
  writeEndpoint,
  type PublicApiHandler,
  type PublicApiRequest,
} from './api-key-middleware';
import { createApiKey } from '../api-keys/api-key-service';

// ================================================================
// HELPERS
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

  const requestInit: RequestInit = {
    method,
    headers: new Headers(headers),
  };

  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestInit.body = JSON.stringify(body);
    (requestInit.headers as Headers).set('content-type', 'application/json');
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), requestInit);
}

// ================================================================
// BASIC AUTHENTICATION TESTS
// ================================================================

describe('withApiKey', () => {
  describe('authentication', () => {
    it('should reject request without API key', async () => {
      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test');
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('MISSING_API_KEY');
    });

    it('should reject invalid API key', async () => {
      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: 'Bearer invalid_key_12345678901234567890',
        },
      });
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_API_KEY');
    });

    it('should accept valid API key via Authorization header', async () => {
      const created = await createApiKey({
        userId: 'test-user-auth',
        name: 'Test Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toBe('ok');
    });

    it('should accept valid API key via X-API-Key header', async () => {
      const created = await createApiKey({
        userId: 'test-user-xapikey',
        name: 'X-API-Key Test',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          'X-API-Key': created.key,
        },
      });
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('permissions', () => {
    it('should check required permission', async () => {
      const created = await createApiKey({
        userId: 'test-user-perms',
        name: 'Limited Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler, {
        requiredPermission: 'write:scores',
      });

      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.success).toBe(false);
    });

    it('should allow admin permission for any operation', async () => {
      const created = await createApiKey({
        userId: 'test-user-admin',
        name: 'Admin Key',
        permissions: ['admin'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'admin access',
      });

      const endpoint = withApiKey(handler, {
        requiredPermission: 'write:scores',
      });

      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });
      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
    });
  });

  describe('request validation', () => {
    it('should validate body schema', async () => {
      const created = await createApiKey({
        userId: 'test-user-body',
        name: 'Body Validation Key',
        permissions: ['write:scores'],
      });

      const handler: PublicApiHandler<unknown> = async (ctx) => ({
        success: true,
        data: ctx.body,
      });

      const bodySchema = z.object({
        name: z.string().min(1),
        value: z.number(),
      });

      const endpoint = withApiKey(handler, { bodySchema });

      // Invalid body
      const invalidReq = createMockRequest('/api/v1/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${created.key}`,
          'Content-Type': 'application/json',
        },
        body: { name: '', value: 'not-a-number' },
      });

      const invalidResponse = await endpoint(invalidReq, { params: {} });
      const invalidJson = await invalidResponse.json();

      expect(invalidResponse.status).toBe(400);
      expect(invalidJson.success).toBe(false);
      expect(invalidJson.error.code).toBe('VALIDATION_ERROR');
    });

    it('should pass validated body to handler', async () => {
      const created = await createApiKey({
        userId: 'test-user-valid-body',
        name: 'Valid Body Key',
        permissions: ['write:scores'],
      });

      const handler: PublicApiHandler<unknown> = async (ctx) => ({
        success: true,
        data: ctx.body,
      });

      const bodySchema = z.object({
        name: z.string().min(1),
        value: z.number(),
      });

      const endpoint = withApiKey(handler, { bodySchema });

      const validReq = createMockRequest('/api/v1/test', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${created.key}`,
          'Content-Type': 'application/json',
        },
        body: { name: 'Test', value: 42 },
      });

      const validResponse = await endpoint(validReq, { params: {} });
      const validJson = await validResponse.json();

      expect(validResponse.status).toBe(200);
      expect(validJson.success).toBe(true);
      expect(validJson.data).toEqual({ name: 'Test', value: 42 });
    });

    it('should validate query schema', async () => {
      const created = await createApiKey({
        userId: 'test-user-query',
        name: 'Query Validation Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<unknown> = async (ctx) => ({
        success: true,
        data: ctx.query,
      });

      const querySchema = z.object({
        page: z.coerce.number().int().positive(),
        limit: z.coerce.number().int().positive().max(100),
      });

      const endpoint = withApiKey(handler, { querySchema });

      // Invalid query
      const invalidReq = createMockRequest('/api/v1/test?page=-1&limit=abc', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      const invalidResponse = await endpoint(invalidReq, { params: {} });
      const invalidJson = await invalidResponse.json();

      expect(invalidResponse.status).toBe(400);
      expect(invalidJson.success).toBe(false);
    });
  });

  describe('response format', () => {
    it('should include request ID in response', async () => {
      const created = await createApiKey({
        userId: 'test-user-reqid',
        name: 'Request ID Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(json.meta.requestId).toBeDefined();
      expect(json.meta.requestId).toMatch(/^req_/);
      expect(response.headers.get('X-Request-ID')).toBe(json.meta.requestId);
    });

    it('should include rate limit headers', async () => {
      const created = await createApiKey({
        userId: 'test-user-ratelimit',
        name: 'Rate Limit Key',
        permissions: ['read:scores'],
        rateLimit: 100,
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      const response = await endpoint(req, { params: {} });

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should include timestamp in meta', async () => {
      const created = await createApiKey({
        userId: 'test-user-timestamp',
        name: 'Timestamp Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(json.meta.timestamp).toBeDefined();
      expect(new Date(json.meta.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('handler context', () => {
    it('should provide API key context to handler', async () => {
      const created = await createApiKey({
        userId: 'test-user-context',
        name: 'Context Key',
        permissions: ['read:scores', 'read:brands'],
      });

      let receivedContext: PublicApiRequest['apiKey'] | null = null;

      const handler: PublicApiHandler<string> = async (ctx) => {
        receivedContext = ctx.apiKey;
        return { success: true, data: 'ok' };
      };

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      await endpoint(req, { params: {} });

      expect(receivedContext).not.toBeNull();
      expect(receivedContext?.keyId).toBe(created.id);
      expect(receivedContext?.userId).toBe('test-user-context');
      expect(receivedContext?.permissions).toContain('read:scores');
      expect(receivedContext?.permissions).toContain('read:brands');
    });

    it('should provide params to handler', async () => {
      const created = await createApiKey({
        userId: 'test-user-params',
        name: 'Params Key',
        permissions: ['read:scores'],
      });

      let receivedParams: Record<string, string> | null = null;

      const handler: PublicApiHandler<string> = async (ctx) => {
        receivedParams = ctx.params;
        return { success: true, data: 'ok' };
      };

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      await endpoint(req, { params: { id: '123', type: 'test' } });

      expect(receivedParams).toEqual({ id: '123', type: 'test' });
    });
  });

  describe('error handling', () => {
    it('should handle handler errors gracefully', async () => {
      const created = await createApiKey({
        userId: 'test-user-error',
        name: 'Error Key',
        permissions: ['read:scores'],
      });

      const handler: PublicApiHandler<string> = async () => {
        throw new Error('Something went wrong');
      };

      const endpoint = withApiKey(handler);
      const req = createMockRequest('/api/v1/test', {
        headers: {
          Authorization: `Bearer ${created.key}`,
        },
      });

      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INTERNAL_ERROR');
    });

    it('should handle invalid JSON body', async () => {
      const created = await createApiKey({
        userId: 'test-user-json',
        name: 'JSON Key',
        permissions: ['write:scores'],
      });

      const handler: PublicApiHandler<string> = async () => ({
        success: true,
        data: 'ok',
      });

      const bodySchema = z.object({ name: z.string() });
      const endpoint = withApiKey(handler, { bodySchema });

      // Create request with invalid JSON
      const req = new NextRequest(new URL('/api/v1/test', 'http://localhost:3000'), {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${created.key}`,
          'Content-Type': 'application/json',
        }),
        body: 'not valid json',
      });

      const response = await endpoint(req, { params: {} });
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error.code).toBe('INVALID_JSON');
    });
  });
});

// ================================================================
// CONVENIENCE WRAPPER TESTS
// ================================================================

describe('readEndpoint', () => {
  it('should require read permission for resource', async () => {
    const created = await createApiKey({
      userId: 'test-user-read',
      name: 'Read Key',
      permissions: ['read:scores'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: true,
      data: 'read data',
    });

    const endpoint = readEndpoint('scores', handler);

    const req = createMockRequest('/api/v1/scores', {
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toBe('read data');
  });

  it('should reject without read permission', async () => {
    const created = await createApiKey({
      userId: 'test-user-no-read',
      name: 'No Read Key',
      permissions: ['write:scores'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: true,
      data: 'read data',
    });

    const endpoint = readEndpoint('brands', handler);

    const req = createMockRequest('/api/v1/brands', {
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });

    expect(response.status).toBe(401);
  });
});

describe('writeEndpoint', () => {
  it('should require write permission for resource', async () => {
    const created = await createApiKey({
      userId: 'test-user-write',
      name: 'Write Key',
      permissions: ['write:brands'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: true,
      data: 'created',
    });

    const endpoint = writeEndpoint('brands', handler);

    const req = createMockRequest('/api/v1/brands', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.data).toBe('created');
  });

  it('should reject with only read permission', async () => {
    const created = await createApiKey({
      userId: 'test-user-only-read',
      name: 'Only Read Key',
      permissions: ['read:brands'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: true,
      data: 'created',
    });

    const endpoint = writeEndpoint('brands', handler);

    const req = createMockRequest('/api/v1/brands', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });

    expect(response.status).toBe(401);
  });
});

// ================================================================
// HANDLER RESPONSE TESTS
// ================================================================

describe('handler responses', () => {
  it('should handle custom status codes', async () => {
    const created = await createApiKey({
      userId: 'test-user-status',
      name: 'Status Key',
      permissions: ['write:scores'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: true,
      data: 'created',
      status: 201,
    });

    const endpoint = withApiKey(handler);
    const req = createMockRequest('/api/v1/test', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });

    expect(response.status).toBe(201);
  });

  it('should handle error responses from handler', async () => {
    const created = await createApiKey({
      userId: 'test-user-handler-error',
      name: 'Handler Error Key',
      permissions: ['read:scores'],
    });

    const handler: PublicApiHandler<string> = async () => ({
      success: false,
      error: 'Resource not found',
      code: 'NOT_FOUND',
      status: 404,
    });

    const endpoint = withApiKey(handler);
    const req = createMockRequest('/api/v1/test', {
      headers: {
        Authorization: `Bearer ${created.key}`,
      },
    });

    const response = await endpoint(req, { params: {} });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('NOT_FOUND');
    expect(json.error.message).toBe('Resource not found');
  });
});
