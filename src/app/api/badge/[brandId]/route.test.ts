/**
 * Public Score Badge API Tests
 *
 * Phase 2, Week 7, Day 1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// ================================================================
// TEST HELPERS
// ================================================================

function createRequest(
  brandId: string,
  searchParams: Record<string, string> = {}
): { request: NextRequest; params: Promise<{ brandId: string }> } {
  const url = new URL(`http://localhost:3000/api/badge/${brandId}`);
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    request: new NextRequest(url),
    params: Promise.resolve({ brandId }),
  };
}

// ================================================================
// TESTS
// ================================================================

describe('Badge API', () => {
  describe('GET /api/badge/:brandId', () => {
    describe('Valid Brands', () => {
      it('should return SVG badge for known brand', async () => {
        const { request, params } = createRequest('stripe');
        const response = await GET(request, { params });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('image/svg+xml');

        const svg = await response.text();
        expect(svg).toContain('<svg');
        expect(svg).toContain('87/100'); // Stripe's mock score
      });

      it('should return SVG with proper CORS headers', async () => {
        const { request, params } = createRequest('openai');
        const response = await GET(request, { params });

        expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      });

      it('should include caching headers', async () => {
        const { request, params } = createRequest('anthropic');
        const response = await GET(request, { params });

        expect(response.headers.get('Cache-Control')).toContain('max-age=3600');
      });
    });

    describe('Unknown Brands', () => {
      it('should return gray badge for unknown brand', async () => {
        const { request, params } = createRequest('unknown-brand');
        const response = await GET(request, { params });

        expect(response.status).toBe(200);
        const svg = await response.text();
        expect(svg).toContain('<svg');
        expect(svg).toContain('#999'); // Gray color for unknown
      });
    });

    describe('Badge Styles', () => {
      it('should generate flat style badge', async () => {
        const { request, params } = createRequest('stripe', { style: 'flat' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('linearGradient');
        expect(svg).toContain('rx="3"'); // Rounded corners for flat
      });

      it('should generate flat-square style badge', async () => {
        const { request, params } = createRequest('stripe', { style: 'flat-square' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).not.toContain('linearGradient');
      });

      it('should generate plastic style badge', async () => {
        const { request, params } = createRequest('stripe', { style: 'plastic' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('linearGradient');
      });

      it('should generate for-the-badge style', async () => {
        const { request, params } = createRequest('stripe', { style: 'for-the-badge' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('font-weight="bold"');
        expect(svg).toContain('EXCELLENT'); // Score label in uppercase
      });

      it('should return error for invalid style', async () => {
        const { request, params } = createRequest('stripe', { style: 'invalid' });
        const response = await GET(request, { params });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Invalid style');
      });
    });

    describe('Badge Sizes', () => {
      it('should generate small badge', async () => {
        const { request, params } = createRequest('stripe', { size: 'small' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('width="120"');
        expect(svg).toContain('height="20"');
      });

      it('should generate medium badge (default)', async () => {
        const { request, params } = createRequest('stripe');
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('width="150"');
        expect(svg).toContain('height="28"');
      });

      it('should generate large badge', async () => {
        const { request, params } = createRequest('stripe', { size: 'large' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('width="180"');
        expect(svg).toContain('height="36"');
      });

      it('should return error for invalid size', async () => {
        const { request, params } = createRequest('stripe', { size: 'xl' });
        const response = await GET(request, { params });

        expect(response.status).toBe(400);
        const json = await response.json();
        expect(json.error).toContain('Invalid size');
      });
    });

    describe('Custom Labels', () => {
      it('should use custom label', async () => {
        const { request, params } = createRequest('stripe', { label: 'Brand Score' });
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('Brand Score');
      });

      it('should default to "AI Score" label', async () => {
        const { request, params } = createRequest('stripe');
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('AI Score');
      });
    });

    describe('Score Colors', () => {
      it('should use green for scores >= 80', async () => {
        const { request, params } = createRequest('stripe'); // Score: 87
        const response = await GET(request, { params });

        const svg = await response.text();
        expect(svg).toContain('#22c55e'); // Green
      });

      it('should use yellow for scores >= 60', async () => {
        const { request, params } = createRequest('notion'); // Score: 78
        const response = await GET(request, { params });

        const svg = await response.text();
        // Notion has 78, which is < 80 so should be yellow
        expect(svg).toContain('#eab308');
      });
    });

    describe('JSON Format', () => {
      it('should return JSON when format=json', async () => {
        const { request, params } = createRequest('stripe', { format: 'json' });
        const response = await GET(request, { params });

        expect(response.headers.get('Content-Type')).toContain('application/json');

        const json = await response.json();
        expect(json).toMatchObject({
          brandId: 'stripe',
          brandName: 'Stripe',
          score: 87,
          trend: 'up',
          label: 'Excellent',
        });
        expect(json.badgeUrl).toContain('/api/badge/stripe');
        expect(json.embedCode).toContain('<img');
      });

      it('should include embed code in JSON response', async () => {
        const { request, params } = createRequest('openai', { format: 'json' });
        const response = await GET(request, { params });

        const json = await response.json();
        expect(json.embedCode).toContain('alt="AI Perception Score');
        expect(json.embedCode).toContain('92/100');
      });
    });

    describe('Case Insensitivity', () => {
      it('should handle uppercase brand ID', async () => {
        const { request, params } = createRequest('STRIPE');
        const response = await GET(request, { params });

        expect(response.status).toBe(200);
        const svg = await response.text();
        expect(svg).toContain('87/100');
      });

      it('should handle mixed case brand ID', async () => {
        const { request, params } = createRequest('OpenAI');
        const response = await GET(request, { params });

        expect(response.status).toBe(200);
        const svg = await response.text();
        expect(svg).toContain('92/100');
      });
    });
  });
});

describe('Score Labels', () => {
  it('should label score >= 80 as Excellent', async () => {
    const { request, params } = createRequest('stripe', { format: 'json' });
    const response = await GET(request, { params });

    const json = await response.json();
    expect(json.label).toBe('Excellent');
  });

  it('should label score 60-79 as Good', async () => {
    const { request, params } = createRequest('notion', { format: 'json' });
    const response = await GET(request, { params });

    const json = await response.json();
    expect(json.label).toBe('Good');
  });
});
