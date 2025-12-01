/**
 * Environment Validation Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { serverEnvSchema, clientEnvSchema } from './index';

// ================================================================
// TEST UTILITIES
// ================================================================

// Store original env
const originalEnv = { ...process.env };

// Reset env before each test
function resetEnv() {
  // Clear cached values (module uses memoization)
  vi.resetModules();

  // Reset to original
  Object.keys(process.env).forEach((key) => {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  });
  Object.assign(process.env, originalEnv);
}

// ================================================================
// SERVER ENV SCHEMA TESTS
// ================================================================

describe('serverEnvSchema', () => {
  describe('NODE_ENV', () => {
    it('should accept "development"', () => {
      const result = serverEnvSchema.safeParse({
        NODE_ENV: 'development',
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });

    it('should accept "test"', () => {
      const result = serverEnvSchema.safeParse({
        NODE_ENV: 'test',
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
    });

    it('should accept "production"', () => {
      const result = serverEnvSchema.safeParse({
        NODE_ENV: 'production',
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid NODE_ENV', () => {
      const result = serverEnvSchema.safeParse({
        NODE_ENV: 'staging',
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(false);
    });

    it('should default to "development"', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NODE_ENV).toBe('development');
      }
    });
  });

  describe('AI Provider Keys', () => {
    it('should require OPENAI_API_KEY', () => {
      const result = serverEnvSchema.safeParse({
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(false);
    });

    it('should require ANTHROPIC_API_KEY', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty OPENAI_API_KEY', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: '',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional Google AI key', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        GOOGLE_AI_API_KEY: 'AI-google-key',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.GOOGLE_AI_API_KEY).toBe('AI-google-key');
      }
    });

    it('should accept optional Perplexity key', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        PERPLEXITY_API_KEY: 'pplx-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.PERPLEXITY_API_KEY).toBe('pplx-test');
      }
    });
  });

  describe('Database URLs', () => {
    it('should accept valid DATABASE_URL', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        DATABASE_URL: 'postgresql://user:pass@host:5432/db',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid DATABASE_URL', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        DATABASE_URL: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept undefined DATABASE_URL (optional)', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.DATABASE_URL).toBeUndefined();
      }
    });
  });

  describe('Feature Flags', () => {
    it('should default ENABLE_AI_CACHE to true', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ENABLE_AI_CACHE).toBe(true);
      }
    });

    it('should coerce "false" string to boolean', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        ENABLE_AI_CACHE: 'false',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ENABLE_AI_CACHE).toBe(false);
      }
    });

    it('should coerce "true" string to boolean', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        ENABLE_RATE_LIMITING: 'true',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.ENABLE_RATE_LIMITING).toBe(true);
      }
    });
  });

  describe('Budget Controls', () => {
    it('should default MONTHLY_AI_BUDGET_USD to 100', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.MONTHLY_AI_BUDGET_USD).toBe(100);
      }
    });

    it('should coerce string to number for budget', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        MONTHLY_AI_BUDGET_USD: '50',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.MONTHLY_AI_BUDGET_USD).toBe(50);
      }
    });

    it('should reject negative budget', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        MONTHLY_AI_BUDGET_USD: '-10',
      });
      expect(result.success).toBe(false);
    });

    it('should default MAX_ANALYSES_PER_DAY to 50', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.MAX_ANALYSES_PER_DAY).toBe(50);
      }
    });
  });

  describe('Logging', () => {
    it('should default LOG_LEVEL to "info"', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.LOG_LEVEL).toBe('info');
      }
    });

    it('should accept valid log levels', () => {
      const levels = ['debug', 'info', 'warn', 'error'];
      for (const level of levels) {
        const result = serverEnvSchema.safeParse({
          OPENAI_API_KEY: 'sk-test',
          ANTHROPIC_API_KEY: 'sk-ant-test',
          LOG_LEVEL: level,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid log level', () => {
      const result = serverEnvSchema.safeParse({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        LOG_LEVEL: 'verbose',
      });
      expect(result.success).toBe(false);
    });
  });
});

// ================================================================
// CLIENT ENV SCHEMA TESTS
// ================================================================

describe('clientEnvSchema', () => {
  describe('Supabase Client', () => {
    it('should accept valid Supabase URL', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid Supabase URL', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should allow undefined Supabase config', () => {
      const result = clientEnvSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should accept GA ID', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_GA_ID: 'G-XXXXXXXXXX',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_GA_ID).toBe('G-XXXXXXXXXX');
      }
    });

    it('should accept PostHog key', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_POSTHOG_KEY: 'phc_xxxxxx',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Feature Flags', () => {
    it('should default demo mode to false', () => {
      const result = clientEnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_ENABLE_DEMO_MODE).toBe(false);
      }
    });

    it('should default maintenance mode to false', () => {
      const result = clientEnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_MAINTENANCE_MODE).toBe(false);
      }
    });

    it('should coerce demo mode string to boolean', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_ENABLE_DEMO_MODE: 'true',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_ENABLE_DEMO_MODE).toBe(true);
      }
    });
  });

  describe('App Info', () => {
    it('should default app URL to localhost', () => {
      const result = clientEnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
      }
    });

    it('should accept custom app URL', () => {
      const result = clientEnvSchema.safeParse({
        NEXT_PUBLIC_APP_URL: 'https://myapp.com',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_APP_URL).toBe('https://myapp.com');
      }
    });

    it('should default app version to 1.0.0', () => {
      const result = clientEnvSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.NEXT_PUBLIC_APP_VERSION).toBe('1.0.0');
      }
    });
  });
});

// ================================================================
// VALIDATION FUNCTION TESTS
// ================================================================

describe('validateServerEnv', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    resetEnv();
  });

  it('should validate complete environment', async () => {
    // Set required env vars
    process.env.OPENAI_API_KEY = 'sk-test-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';

    // Re-import to get fresh validation
    const { validateServerEnv } = await import('./index');
    const result = validateServerEnv();

    expect(result.OPENAI_API_KEY).toBe('sk-test-key');
    expect(result.ANTHROPIC_API_KEY).toBe('sk-ant-test-key');
  });

  it('should use default values', async () => {
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';

    const { validateServerEnv } = await import('./index');
    const result = validateServerEnv();

    expect(result.NODE_ENV).toBe('test'); // Vitest sets this
    expect(result.ENABLE_AI_CACHE).toBe(true);
    expect(result.MONTHLY_AI_BUDGET_USD).toBe(100);
  });
});

describe('validateClientEnv', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    resetEnv();
  });

  it('should validate client environment', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';

    const { validateClientEnv } = await import('./index');
    const result = validateClientEnv();

    expect(result.NEXT_PUBLIC_SUPABASE_URL).toBe('https://test.supabase.co');
    expect(result.NEXT_PUBLIC_SUPABASE_ANON_KEY).toBe('anon-key');
  });

  it('should use defaults for missing client env', async () => {
    const { validateClientEnv } = await import('./index');
    const result = validateClientEnv();

    expect(result.NEXT_PUBLIC_ENABLE_DEMO_MODE).toBe(false);
    expect(result.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000');
  });
});

// ================================================================
// CONVENIENCE ACCESSOR TESTS
// ================================================================

describe('serverEnv accessor', () => {
  beforeEach(() => {
    resetEnv();
    process.env.OPENAI_API_KEY = 'sk-test';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  });

  afterEach(() => {
    resetEnv();
  });

  it('should provide isProduction helper', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'production';
    const { serverEnv } = await import('./index');
    expect(serverEnv.isProduction()).toBe(true);
  });

  it('should provide isDevelopment helper', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'development';
    const { serverEnv } = await import('./index');
    expect(serverEnv.isDevelopment()).toBe(true);
  });

  it('should provide isTest helper', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'test';
    const { serverEnv } = await import('./index');
    expect(serverEnv.isTest()).toBe(true);
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Environment Integration', () => {
  beforeEach(() => {
    resetEnv();
  });

  afterEach(() => {
    resetEnv();
  });

  it('should handle complete production-like config', async () => {
    // Set up production-like environment
    (process.env as Record<string, string>).NODE_ENV = 'production';
    process.env.OPENAI_API_KEY = 'sk-prod-openai-key';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-prod-key';
    process.env.DATABASE_URL = 'postgresql://prod:pass@db.example.com:5432/app';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'redis-token';
    process.env.STRIPE_SECRET_KEY = 'sk_live_xxx';
    process.env.CRON_SECRET = 'a'.repeat(32);
    process.env.JWT_SECRET = 'b'.repeat(32);
    process.env.MONTHLY_AI_BUDGET_USD = '200';
    process.env.LOG_LEVEL = 'warn';

    const { validateServerEnv } = await import('./index');
    const result = validateServerEnv();

    expect(result.NODE_ENV).toBe('production');
    expect(result.MONTHLY_AI_BUDGET_USD).toBe(200);
    expect(result.LOG_LEVEL).toBe('warn');
    expect(result.DATABASE_URL).toBe('postgresql://prod:pass@db.example.com:5432/app');
  });

  it('should handle minimal development config', async () => {
    (process.env as Record<string, string>).NODE_ENV = 'development';
    process.env.OPENAI_API_KEY = 'sk-dev';
    process.env.ANTHROPIC_API_KEY = 'sk-ant-dev';

    const { validateServerEnv } = await import('./index');
    const result = validateServerEnv();

    expect(result.NODE_ENV).toBe('development');
    expect(result.ENABLE_AI_CACHE).toBe(true);
    expect(result.MONTHLY_AI_BUDGET_USD).toBe(100);
    expect(result.MAX_ANALYSES_PER_DAY).toBe(50);
  });
});
