/**
 * Analysis Progress SSE Endpoint Integration Tests
 *
 * Phase 1, Week 2
 * Integration tests for GET /api/analyze/progress/[id] endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, OPTIONS } from './route';
import { POST as createAnalysis } from '../../route';
import { updateAnalysisSync as updateAnalysis, getAnalysisSync as getAnalysis } from '@/lib/analysis/store';

// Helper to create mock NextRequest for progress endpoint
function createProgressRequest(analysisId: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/analyze/progress/${analysisId}`, {
    method: 'GET',
  });
}

// Helper to create an analysis and return its ID
async function createTestAnalysis(): Promise<string> {
  const request = new NextRequest('http://localhost:3000/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: 'https://example.com' }),
  });

  const response = await createAnalysis(request);
  const data = await response.json();
  return data.analysisId;
}

// Mock params wrapper
function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('GET /api/analyze/progress/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analysis not found', () => {
    it('should return 404 for non-existent analysis', async () => {
      const request = createProgressRequest('ana_nonexistent');
      const response = await GET(request, createParams('ana_nonexistent'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.code).toBe('NOT_FOUND');
      expect(data.error).toBe('Analysis not found');
    });

    it('should return 404 for invalid analysis ID format', async () => {
      const request = createProgressRequest('invalid-id');
      const response = await GET(request, createParams('invalid-id'));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('completed analysis', () => {
    it('should return completed status with redirect URL', async () => {
      const analysisId = await createTestAnalysis();

      // Manually mark as completed
      updateAnalysis(analysisId, {
        status: 'completed',
        resultId: 'res_test123',
      });

      const request = createProgressRequest(analysisId);
      const response = await GET(request, createParams(analysisId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe('completed');
      expect(data.resultId).toBe('res_test123');
      expect(data.redirectUrl).toBe('/results/res_test123');
    });
  });

  describe('failed analysis', () => {
    it('should return failed status with error message', async () => {
      const analysisId = await createTestAnalysis();

      // Manually mark as failed
      updateAnalysis(analysisId, {
        status: 'failed',
        error: 'AI provider timeout',
      });

      const request = createProgressRequest(analysisId);
      const response = await GET(request, createParams(analysisId));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.status).toBe('failed');
      expect(data.error).toBe('AI provider timeout');
      expect(data.code).toBe('ANALYSIS_FAILED');
    });

    it('should return default error message when none provided', async () => {
      const analysisId = await createTestAnalysis();

      updateAnalysis(analysisId, {
        status: 'failed',
      });

      const request = createProgressRequest(analysisId);
      const response = await GET(request, createParams(analysisId));
      const data = await response.json();

      expect(data.error).toBe('Analysis failed');
    });
  });

  describe('pending/processing analysis (SSE stream)', () => {
    it('should return SSE response for pending analysis', async () => {
      const analysisId = await createTestAnalysis();

      const request = createProgressRequest(analysisId);
      const response = await GET(request, createParams(analysisId));

      // SSE responses should be streaming
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toContain('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');

      // Verify analysis status was updated
      const analysis = getAnalysis(analysisId);
      expect(analysis?.status).toBe('processing');
    });

    it('should include X-Accel-Buffering header for nginx', async () => {
      const analysisId = await createTestAnalysis();

      const request = createProgressRequest(analysisId);
      const response = await GET(request, createParams(analysisId));

      expect(response.headers.get('X-Accel-Buffering')).toBe('no');
    });
  });
});

describe('OPTIONS /api/analyze/progress/[id]', () => {
  it('should return CORS headers', async () => {
    const response = await OPTIONS();

    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });

  it('should include OPTIONS in allowed methods', async () => {
    const response = await OPTIONS();

    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
  });
});

describe('updateAnalysis', () => {
  it('should update analysis record', async () => {
    const analysisId = await createTestAnalysis();

    updateAnalysis(analysisId, {
      status: 'processing',
    });

    const analysis = getAnalysis(analysisId);
    expect(analysis?.status).toBe('processing');
  });

  it('should update updatedAt timestamp', async () => {
    const analysisId = await createTestAnalysis();
    const beforeUpdate = getAnalysis(analysisId)?.updatedAt;

    // Small delay to ensure different timestamp
    await new Promise((resolve) => setTimeout(resolve, 10));

    updateAnalysis(analysisId, {
      status: 'processing',
    });

    const afterUpdate = getAnalysis(analysisId)?.updatedAt;
    expect(afterUpdate).not.toBe(beforeUpdate);
  });

  it('should not fail for non-existent analysis', () => {
    // Should not throw
    expect(() => {
      updateAnalysis('ana_nonexistent', { status: 'processing' });
    }).not.toThrow();
  });

  it('should preserve other fields when updating', async () => {
    const analysisId = await createTestAnalysis();
    const original = getAnalysis(analysisId);

    updateAnalysis(analysisId, {
      status: 'processing',
    });

    const updated = getAnalysis(analysisId);
    expect(updated?.url).toBe(original?.url);
    expect(updated?.options).toEqual(original?.options);
    expect(updated?.createdAt).toBe(original?.createdAt);
  });
});

describe('SSE stream content', () => {
  it('should stream SSE formatted data', async () => {
    const analysisId = await createTestAnalysis();

    const request = createProgressRequest(analysisId);
    const response = await GET(request, createParams(analysisId));

    // Get the reader from the response body
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      // Read first chunk - may be retry directive or event
      const { value, done } = await reader.read();
      expect(done).toBe(false);
      expect(value).toBeDefined();

      // Decode and verify it's SSE format (retry directive or event)
      const text = new TextDecoder().decode(value);
      // SSE can start with retry: or event:
      expect(text).toMatch(/^(retry:|event:)/);

      // Cancel the reader to stop the stream
      await reader.cancel();
    }
  });
});

describe('analysis lifecycle', () => {
  it('should transition through states correctly', async () => {
    const analysisId = await createTestAnalysis();

    // Initial state
    let analysis = getAnalysis(analysisId);
    expect(analysis?.status).toBe('pending');

    // Start processing
    updateAnalysis(analysisId, { status: 'processing' });
    analysis = getAnalysis(analysisId);
    expect(analysis?.status).toBe('processing');

    // Complete
    updateAnalysis(analysisId, {
      status: 'completed',
      resultId: 'res_lifecycle',
    });
    analysis = getAnalysis(analysisId);
    expect(analysis?.status).toBe('completed');
    expect(analysis?.resultId).toBe('res_lifecycle');
  });

  it('should handle failure transition', async () => {
    const analysisId = await createTestAnalysis();

    updateAnalysis(analysisId, { status: 'processing' });
    updateAnalysis(analysisId, {
      status: 'failed',
      error: 'Network error',
    });

    const analysis = getAnalysis(analysisId);
    expect(analysis?.status).toBe('failed');
    expect(analysis?.error).toBe('Network error');
  });
});
