/**
 * Environment Validation with Zod Schema
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.113 (Backend Engineering)
 *
 * Validates all environment variables at startup with type safety.
 * Fails fast if required variables are missing.
 */

import { z } from 'zod';

// ================================================================
// CUSTOM TRANSFORMERS
// ================================================================

/**
 * Boolean transformer that properly handles string "false"
 * Environment variables are always strings, so we need to handle:
 * - "true", "1", "yes" => true
 * - "false", "0", "no", "" => false
 * - undefined => use default
 */
const envBoolean = z
  .union([z.boolean(), z.string()])
  .transform((val) => {
    if (typeof val === 'boolean') return val;
    if (val === undefined || val === null) return undefined;
    const lower = String(val).toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes';
  })
  .pipe(z.boolean().optional());

// ================================================================
// ENVIRONMENT SCHEMAS
// ================================================================

/**
 * Server-side only environment variables
 * Never exposed to the client
 */
const serverEnvSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // AI Provider API Keys (required for core functionality)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Optional AI providers (Phase 4)
  GOOGLE_AI_API_KEY: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().optional(),

  // Database (Supabase)
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL').optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Cache (Upstash Redis)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),

  // Payments (Stripe)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // Security
  CRON_SECRET: z.string().min(32).optional(),
  JWT_SECRET: z.string().min(32).optional(),

  // Feature flags
  ENABLE_AI_CACHE: envBoolean.default(true),
  ENABLE_RATE_LIMITING: envBoolean.default(true),

  // Budget controls
  MONTHLY_AI_BUDGET_USD: z.coerce.number().positive().default(100),
  MAX_ANALYSES_PER_DAY: z.coerce.number().int().positive().default(50),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

/**
 * Client-side environment variables
 * Exposed to the browser (NEXT_PUBLIC_ prefix)
 */
const clientEnvSchema = z.object({
  // Supabase client
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),

  // Feature flags
  NEXT_PUBLIC_ENABLE_DEMO_MODE: envBoolean.default(false),
  NEXT_PUBLIC_MAINTENANCE_MODE: envBoolean.default(false),

  // App info
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_VERSION: z.string().default('1.0.0'),
});

// ================================================================
// TYPE EXPORTS
// ================================================================

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

// ================================================================
// VALIDATION FUNCTIONS
// ================================================================

/**
 * Validate server environment variables
 * Call this at server startup or in API routes
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = formatValidationErrors(result.error);
    console.error('\n❌ Invalid environment variables:\n' + formatted);

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Check server logs.');
    }

    // In development, continue with partial validation
    console.warn('\n⚠️  Continuing with partial environment in development mode\n');
  }

  return result.success ? result.data : (result.data as unknown as ServerEnv);
}

/**
 * Validate client environment variables
 * Call this during build or at app initialization
 */
export function validateClientEnv(): ClientEnv {
  // Build client env from NEXT_PUBLIC_ prefixed vars
  const clientEnv: Record<string, unknown> = {};

  for (const key of Object.keys(clientEnvSchema.shape)) {
    clientEnv[key] = process.env[key];
  }

  const result = clientEnvSchema.safeParse(clientEnv);

  if (!result.success) {
    const formatted = formatValidationErrors(result.error);
    console.error('\n❌ Invalid client environment variables:\n' + formatted);
  }

  return result.success ? result.data : (result.data as unknown as ClientEnv);
}

/**
 * Format Zod validation errors for readable output
 */
function formatValidationErrors(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return `  • ${path}: ${issue.message}`;
    })
    .join('\n');
}

// ================================================================
// LAZY INITIALIZATION
// ================================================================

let _serverEnv: ServerEnv | null = null;
let _clientEnv: ClientEnv | null = null;

/**
 * Get validated server environment (cached)
 */
export function getServerEnv(): ServerEnv {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv();
  }
  return _serverEnv;
}

/**
 * Get validated client environment (cached)
 */
export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = validateClientEnv();
  }
  return _clientEnv;
}

// ================================================================
// CONVENIENCE EXPORTS
// ================================================================

/**
 * Shorthand for accessing server environment
 * Throws if validation fails in production
 */
export const serverEnv = {
  get NODE_ENV() {
    return getServerEnv().NODE_ENV;
  },
  get OPENAI_API_KEY() {
    return getServerEnv().OPENAI_API_KEY;
  },
  get ANTHROPIC_API_KEY() {
    return getServerEnv().ANTHROPIC_API_KEY;
  },
  get GOOGLE_AI_API_KEY() {
    return getServerEnv().GOOGLE_AI_API_KEY;
  },
  get PERPLEXITY_API_KEY() {
    return getServerEnv().PERPLEXITY_API_KEY;
  },
  get DATABASE_URL() {
    return getServerEnv().DATABASE_URL;
  },
  get SUPABASE_SERVICE_ROLE_KEY() {
    return getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  },
  get UPSTASH_REDIS_REST_URL() {
    return getServerEnv().UPSTASH_REDIS_REST_URL;
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return getServerEnv().UPSTASH_REDIS_REST_TOKEN;
  },
  get RESEND_API_KEY() {
    return getServerEnv().RESEND_API_KEY;
  },
  get STRIPE_SECRET_KEY() {
    return getServerEnv().STRIPE_SECRET_KEY;
  },
  get STRIPE_WEBHOOK_SECRET() {
    return getServerEnv().STRIPE_WEBHOOK_SECRET;
  },
  get CRON_SECRET() {
    return getServerEnv().CRON_SECRET;
  },
  get JWT_SECRET() {
    return getServerEnv().JWT_SECRET;
  },
  get ENABLE_AI_CACHE() {
    return getServerEnv().ENABLE_AI_CACHE;
  },
  get ENABLE_RATE_LIMITING() {
    return getServerEnv().ENABLE_RATE_LIMITING;
  },
  get MONTHLY_AI_BUDGET_USD() {
    return getServerEnv().MONTHLY_AI_BUDGET_USD;
  },
  get MAX_ANALYSES_PER_DAY() {
    return getServerEnv().MAX_ANALYSES_PER_DAY;
  },
  get LOG_LEVEL() {
    return getServerEnv().LOG_LEVEL;
  },

  // Helper methods
  isProduction: () => getServerEnv().NODE_ENV === 'production',
  isDevelopment: () => getServerEnv().NODE_ENV === 'development',
  isTest: () => getServerEnv().NODE_ENV === 'test',
};

/**
 * Shorthand for accessing client environment
 */
export const clientEnv = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getClientEnv().NEXT_PUBLIC_SUPABASE_URL;
  },
  get NEXT_PUBLIC_SUPABASE_ANON_KEY() {
    return getClientEnv().NEXT_PUBLIC_SUPABASE_ANON_KEY;
  },
  get NEXT_PUBLIC_GA_ID() {
    return getClientEnv().NEXT_PUBLIC_GA_ID;
  },
  get NEXT_PUBLIC_POSTHOG_KEY() {
    return getClientEnv().NEXT_PUBLIC_POSTHOG_KEY;
  },
  get NEXT_PUBLIC_ENABLE_DEMO_MODE() {
    return getClientEnv().NEXT_PUBLIC_ENABLE_DEMO_MODE;
  },
  get NEXT_PUBLIC_MAINTENANCE_MODE() {
    return getClientEnv().NEXT_PUBLIC_MAINTENANCE_MODE;
  },
  get NEXT_PUBLIC_APP_URL() {
    return getClientEnv().NEXT_PUBLIC_APP_URL;
  },
  get NEXT_PUBLIC_APP_VERSION() {
    return getClientEnv().NEXT_PUBLIC_APP_VERSION;
  },
};

// ================================================================
// SCHEMA EXPORTS (for testing and documentation)
// ================================================================

export { serverEnvSchema, clientEnvSchema };

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  server: serverEnv,
  client: clientEnv,
  validate: {
    server: validateServerEnv,
    client: validateClientEnv,
  },
  schemas: {
    server: serverEnvSchema,
    client: clientEnvSchema,
  },
};
