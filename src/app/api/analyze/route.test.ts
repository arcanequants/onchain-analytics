/**
 * Analysis API Route Integration Tests
 *
 * Phase 1, Week 2
 * Integration tests for POST /api/analyze endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, OPTIONS, getAnalysis } from './route';

// Helper to create mock NextRequest
function createMockRequest(body: unknown): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return request;
}

describe('POST /api/analyze', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful requests', () => {
    it('should accept a valid URL and return analysis ID', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);
      expect(data.analysisId).toMatch(/^ana_/);
      expect(data.progressUrl).toMatch(/^\/api\/analyze\/progress\//);
      expect(data.message).toContain('Analysis started');
    });

    it('should accept URL with www prefix', async () => {
      const request = createMockRequest({
        url: 'https://www.example.com/page',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);

      // Verify the stored analysis has normalized URL
      const analysis = getAnalysis(data.analysisId);
      expect(analysis?.url).toBe('https://www.example.com/page');
    });

    it('should accept custom options', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
        options: {
          providers: ['openai'],
          queryBudget: 10,
          includeCompetitors: false,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(202);
      expect(data.success).toBe(true);

      // Verify options are stored
      const analysis = getAnalysis(data.analysisId);
      expect(analysis?.options.providers).toEqual(['openai']);
      expect(analysis?.options.queryBudget).toBe(10);
      expect(analysis?.options.includeCompetitors).toBe(false);
    });

    it('should use default options when not provided', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const analysis = getAnalysis(data.analysisId);
      expect(analysis?.options.providers).toEqual(['openai', 'anthropic']);
      expect(analysis?.options.queryBudget).toBe(20);
      expect(analysis?.options.includeCompetitors).toBe(true);
    });

    it('should store analysis with pending status', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      const analysis = getAnalysis(data.analysisId);
      expect(analysis?.status).toBe('pending');
      expect(analysis?.createdAt).toBeDefined();
      expect(analysis?.updatedAt).toBeDefined();
    });
  });

  describe('validation errors', () => {
    it('should reject empty body', async () => {
      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing URL', async () => {
      const request = createMockRequest({
        options: { providers: ['openai'] },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject invalid URL format', async () => {
      const request = createMockRequest({
        url: 'not-a-valid-url',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject invalid provider', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
        options: {
          providers: ['invalid-provider'],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject query budget below minimum', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
        options: {
          queryBudget: 2,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should reject query budget above maximum', async () => {
      const request = createMockRequest({
        url: 'https://example.com',
        options: {
          queryBudget: 100,
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('SSRF protection', () => {
    it('should reject localhost URLs', async () => {
      const request = createMockRequest({
        url: 'http://localhost:3000',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_URL');
    });

    it('should reject internal IP addresses', async () => {
      const request = createMockRequest({
        url: 'http://192.168.1.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_URL');
    });

    it('should reject 10.x.x.x addresses', async () => {
      const request = createMockRequest({
        url: 'http://10.0.0.1',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_URL');
    });

    it('should reject AWS metadata endpoint', async () => {
      const request = createMockRequest({
        url: 'http://169.254.169.254/latest/meta-data/',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_URL');
    });

    it('should reject .local domains', async () => {
      const request = createMockRequest({
        url: 'http://server.local',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.code).toBe('INVALID_URL');
    });
  });

  describe('malformed requests', () => {
    it('should handle non-JSON body gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'not valid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });
});

describe('OPTIONS /api/analyze', () => {
  it('should return CORS headers', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });

  it('should include max age header', async () => {
    const response = await OPTIONS();

    expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
  });
});

describe('getAnalysis', () => {
  it('should return undefined for non-existent analysis', () => {
    const analysis = getAnalysis('ana_nonexistent');
    expect(analysis).toBeUndefined();
  });

  it('should return analysis after creation', async () => {
    const request = createMockRequest({
      url: 'https://test-getanalysis.com',
    });

    const response = await POST(request);
    const data = await response.json();

    const analysis = getAnalysis(data.analysisId);
    expect(analysis).toBeDefined();
    expect(analysis?.url).toBe('https://test-getanalysis.com/');
  });
});
