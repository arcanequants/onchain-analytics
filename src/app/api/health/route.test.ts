/**
 * Health Check Endpoint Tests
 *
 * Phase 1, Week 2
 * Tests for GET /api/health endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET, HEAD } from './route';

describe('GET /api/health', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('basic response', () => {
    it('should return 200 status for healthy check', async () => {
      const response = await GET();
      expect(response.status).toBe(200);
    });

    it('should return JSON content', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });

    it('should include required fields', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.status).toBeDefined();
      expect(data.timestamp).toBeDefined();
      expect(data.uptime).toBeDefined();
      expect(data.checks).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.environment).toBeDefined();
    });

    it('should have valid status values', async () => {
      const response = await GET();
      const data = await response.json();

      expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
    });

    it('should have ISO timestamp', async () => {
      const response = await GET();
      const data = await response.json();

      expect(() => new Date(data.timestamp)).not.toThrow();
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should have non-negative uptime', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('checks structure', () => {
    it('should include api check', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.checks.api).toBeDefined();
      expect(data.checks.api.status).toBe('pass');
      expect(typeof data.checks.api.responseTimeMs).toBe('number');
    });

    it('should include aiProviders check', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.checks.aiProviders).toBeDefined();
      expect(['pass', 'fail', 'warn']).toContain(data.checks.aiProviders.status);
      expect(typeof data.checks.aiProviders.openai).toBe('boolean');
      expect(typeof data.checks.aiProviders.anthropic).toBe('boolean');
    });

    it('should include environment check', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.checks.environment).toBeDefined();
      expect(['pass', 'fail']).toContain(data.checks.environment.status);
    });
  });

  describe('AI providers check', () => {
    it('should report pass when both providers configured', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const response = await GET();
      const data = await response.json();

      expect(data.checks.aiProviders.status).toBe('pass');
      expect(data.checks.aiProviders.openai).toBe(true);
      expect(data.checks.aiProviders.anthropic).toBe(true);
      expect(data.checks.aiProviders.message).toBe('Both providers configured');
    });

    it('should report warn when only OpenAI configured', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      delete process.env.ANTHROPIC_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(data.checks.aiProviders.status).toBe('warn');
      expect(data.checks.aiProviders.openai).toBe(true);
      expect(data.checks.aiProviders.anthropic).toBe(false);
      expect(data.status).toBe('degraded');
    });

    it('should report warn when only Anthropic configured', async () => {
      delete process.env.OPENAI_API_KEY;
      process.env.ANTHROPIC_API_KEY = 'test-key';

      const response = await GET();
      const data = await response.json();

      expect(data.checks.aiProviders.status).toBe('warn');
      expect(data.checks.aiProviders.openai).toBe(false);
      expect(data.checks.aiProviders.anthropic).toBe(true);
      expect(data.status).toBe('degraded');
    });

    it('should report warn when no providers configured', async () => {
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const response = await GET();
      const data = await response.json();

      expect(data.checks.aiProviders.status).toBe('warn');
      expect(data.checks.aiProviders.openai).toBe(false);
      expect(data.checks.aiProviders.anthropic).toBe(false);
      // Should not be unhealthy, just degraded
      expect(data.status).not.toBe('unhealthy');
    });
  });

  describe('response headers', () => {
    it('should include no-cache header', async () => {
      const response = await GET();

      expect(response.headers.get('Cache-Control')).toContain('no-cache');
    });

    it('should include health status header', async () => {
      const response = await GET();

      const statusHeader = response.headers.get('X-Health-Status');
      expect(statusHeader).toBeDefined();
      expect(['healthy', 'degraded', 'unhealthy']).toContain(statusHeader);
    });
  });

  describe('environment info', () => {
    it('should report version', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.version).toBeDefined();
      expect(typeof data.version).toBe('string');
    });

    it('should report environment', async () => {
      const response = await GET();
      const data = await response.json();

      expect(data.environment).toBeDefined();
      expect(typeof data.environment).toBe('string');
    });
  });

  describe('memory check', () => {
    it('should include memory info when available', async () => {
      const response = await GET();
      const data = await response.json();

      // Memory might not be available in all test environments
      if (data.checks.memory) {
        expect(data.checks.memory.heapUsedMB).toBeGreaterThan(0);
        expect(data.checks.memory.heapTotalMB).toBeGreaterThan(0);
        expect(data.checks.memory.percentUsed).toBeGreaterThanOrEqual(0);
        expect(data.checks.memory.percentUsed).toBeLessThanOrEqual(100);
        expect(['pass', 'warn']).toContain(data.checks.memory.status);
      }
    });
  });
});

describe('HEAD /api/health', () => {
  it('should return 200 status', async () => {
    const response = await HEAD();
    expect(response.status).toBe(200);
  });

  it('should have empty body', async () => {
    const response = await HEAD();
    const body = await response.text();
    expect(body).toBe('');
  });

  it('should include health status header', async () => {
    const response = await HEAD();
    expect(response.headers.get('X-Health-Status')).toBe('responding');
  });
});
