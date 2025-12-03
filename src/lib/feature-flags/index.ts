/**
 * Feature Flags Module
 *
 * Phase 1, Week 2 + Phase 4, Week 8 (Edge Config)
 *
 * Provides two modes:
 * 1. Environment-based flags (default, no external deps)
 * 2. Vercel Edge Config flags (low-latency, real-time updates)
 *
 * Usage (environment-based):
 *   import { isFeatureEnabled, getFeatureValue } from '@/lib/feature-flags';
 *   if (isFeatureEnabled('new_scoring_algorithm')) { ... }
 *
 * Usage (Edge Config):
 *   import { isEdgeFlagEnabled, evaluateEdgeFlag } from '@/lib/feature-flags';
 *   if (await isEdgeFlagEnabled('new_scoring_algorithm', { userId })) { ... }
 */

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

/**
 * Feature flag definition
 */
interface FeatureFlag {
  /** Flag identifier */
  key: string;
  /** Human-readable description */
  description: string;
  /** Default value when not set */
  defaultValue: boolean;
  /** Environment variable name */
  envVar: string;
  /** Whether flag requires user authentication */
  requiresAuth?: boolean;
  /** Rollout percentage (0-100) */
  rolloutPercentage?: number;
  /** Allowed environments */
  environments?: ('development' | 'staging' | 'production')[];
}

/**
 * Feature flag state
 */
interface FeatureFlagState {
  key: string;
  enabled: boolean;
  source: 'env' | 'default' | 'rollout';
  value?: string | number | boolean;
}

// ================================================================
// FLAG DEFINITIONS
// ================================================================

/**
 * All feature flags with their configurations
 */
const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // Analysis features
  new_scoring_algorithm: {
    key: 'new_scoring_algorithm',
    description: 'Use v2 scoring algorithm with improved accuracy',
    defaultValue: false,
    envVar: 'FF_NEW_SCORING_ALGORITHM',
    environments: ['development', 'staging'],
  },
  parallel_provider_queries: {
    key: 'parallel_provider_queries',
    description: 'Query AI providers in parallel instead of sequentially',
    defaultValue: true,
    envVar: 'FF_PARALLEL_QUERIES',
  },
  // UI features
  show_beta_features: {
    key: 'show_beta_features',
    description: 'Show beta features in the UI',
    defaultValue: false,
    envVar: 'FF_SHOW_BETA',
    environments: ['development'],
  },
  dark_mode: {
    key: 'dark_mode',
    description: 'Enable dark mode theme',
    defaultValue: false,
    envVar: 'FF_DARK_MODE',
  },
  // Performance features
  aggressive_caching: {
    key: 'aggressive_caching',
    description: 'Enable aggressive caching for API responses',
    defaultValue: false,
    envVar: 'FF_AGGRESSIVE_CACHE',
  },
  request_tracing: {
    key: 'request_tracing',
    description: 'Enable X-Request-ID propagation for debugging',
    defaultValue: true,
    envVar: 'FF_REQUEST_TRACING',
  },
  // Security features
  strict_rate_limiting: {
    key: 'strict_rate_limiting',
    description: 'Enable stricter rate limiting for abuse prevention',
    defaultValue: false,
    envVar: 'FF_STRICT_RATE_LIMIT',
    environments: ['production'],
  },
  // Monitoring features
  verbose_logging: {
    key: 'verbose_logging',
    description: 'Enable verbose logging for debugging',
    defaultValue: false,
    envVar: 'FF_VERBOSE_LOGGING',
    environments: ['development'],
  },
  // Experimental features
  ai_fallback_chain: {
    key: 'ai_fallback_chain',
    description: 'Enable fallback chain when primary AI provider fails',
    defaultValue: true,
    envVar: 'FF_AI_FALLBACK',
  },
  self_consistency_voting: {
    key: 'self_consistency_voting',
    description: 'Enable 3-sample majority voting for critical queries',
    defaultValue: false,
    envVar: 'FF_SELF_CONSISTENCY',
    rolloutPercentage: 10,
  },
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get current environment
 */
function getCurrentEnvironment(): 'development' | 'staging' | 'production' {
  const env = process.env.NODE_ENV;
  if (env === 'development') return 'development';
  if (env === 'test') return 'development';
  if (process.env.VERCEL_ENV === 'preview') return 'staging';
  return 'production';
}

/**
 * Parse boolean from environment variable
 */
function parseEnvBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  const normalized = value.toLowerCase().trim();
  if (['true', '1', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off', 'disabled'].includes(normalized)) return false;
  return undefined;
}

/**
 * Simple hash function for rollout
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Check if user is in rollout percentage
 */
function isInRollout(userId: string | undefined, percentage: number): boolean {
  if (!userId || percentage === 100) return true;
  if (percentage === 0) return false;
  const hash = simpleHash(userId);
  return (hash % 100) < percentage;
}

// ================================================================
// MAIN API
// ================================================================

/**
 * Check if a feature flag is enabled
 *
 * @param key - Feature flag key
 * @param options - Optional context (userId for rollout checks)
 * @returns boolean indicating if feature is enabled
 */
export function isFeatureEnabled(
  key: string,
  options?: { userId?: string }
): boolean {
  const flag = FEATURE_FLAGS[key];
  if (!flag) {
    console.warn(`Unknown feature flag: ${key}`);
    return false;
  }

  // Check environment restriction
  if (flag.environments) {
    const currentEnv = getCurrentEnvironment();
    if (!flag.environments.includes(currentEnv)) {
      return false;
    }
  }

  // Check environment variable override
  const envValue = parseEnvBoolean(process.env[flag.envVar]);
  if (envValue !== undefined) {
    return envValue;
  }

  // Check rollout percentage
  if (flag.rolloutPercentage !== undefined) {
    return isInRollout(options?.userId, flag.rolloutPercentage);
  }

  return flag.defaultValue;
}

/**
 * Get feature flag state with metadata
 *
 * @param key - Feature flag key
 * @param options - Optional context
 * @returns Feature flag state
 */
export function getFeatureFlagState(
  key: string,
  options?: { userId?: string }
): FeatureFlagState {
  const flag = FEATURE_FLAGS[key];
  if (!flag) {
    return {
      key,
      enabled: false,
      source: 'default',
    };
  }

  const envValue = parseEnvBoolean(process.env[flag.envVar]);
  if (envValue !== undefined) {
    return {
      key,
      enabled: envValue,
      source: 'env',
    };
  }

  if (flag.rolloutPercentage !== undefined) {
    const enabled = isInRollout(options?.userId, flag.rolloutPercentage);
    return {
      key,
      enabled,
      source: 'rollout',
    };
  }

  return {
    key,
    enabled: flag.defaultValue,
    source: 'default',
  };
}

/**
 * Get all feature flags with their current states
 *
 * @param options - Optional context
 * @returns Record of all flags and their states
 */
export function getAllFeatureFlags(
  options?: { userId?: string }
): Record<string, FeatureFlagState> {
  const result: Record<string, FeatureFlagState> = {};

  for (const key of Object.keys(FEATURE_FLAGS)) {
    result[key] = getFeatureFlagState(key, options);
  }

  return result;
}

/**
 * Get feature flag definition
 *
 * @param key - Feature flag key
 * @returns Feature flag definition or undefined
 */
export function getFeatureFlagDefinition(key: string): FeatureFlag | undefined {
  return FEATURE_FLAGS[key];
}

/**
 * Get all feature flag definitions
 *
 * @returns All feature flag definitions
 */
export function getAllFeatureFlagDefinitions(): Record<string, FeatureFlag> {
  return { ...FEATURE_FLAGS };
}

/**
 * List all feature flag keys
 *
 * @returns Array of feature flag keys
 */
export function listFeatureFlags(): string[] {
  return Object.keys(FEATURE_FLAGS);
}

// ================================================================
// CONVENIENCE EXPORTS
// ================================================================

/**
 * Named feature flag checks for type safety
 */
export const Features = {
  isNewScoringEnabled: (userId?: string) =>
    isFeatureEnabled('new_scoring_algorithm', { userId }),
  isParallelQueriesEnabled: () =>
    isFeatureEnabled('parallel_provider_queries'),
  isBetaFeaturesEnabled: () =>
    isFeatureEnabled('show_beta_features'),
  isDarkModeEnabled: () =>
    isFeatureEnabled('dark_mode'),
  isAggressiveCachingEnabled: () =>
    isFeatureEnabled('aggressive_caching'),
  isRequestTracingEnabled: () =>
    isFeatureEnabled('request_tracing'),
  isStrictRateLimitEnabled: () =>
    isFeatureEnabled('strict_rate_limiting'),
  isVerboseLoggingEnabled: () =>
    isFeatureEnabled('verbose_logging'),
  isAIFallbackEnabled: () =>
    isFeatureEnabled('ai_fallback_chain'),
  isSelfConsistencyEnabled: (userId?: string) =>
    isFeatureEnabled('self_consistency_voting', { userId }),
};

// ================================================================
// SERVICE INTERFACE IMPLEMENTATION
// ================================================================

/**
 * Feature Flags class that implements the IFeatureFlags interface
 * for use with the service factory.
 */
export const FeatureFlags = {
  /**
   * Check if a boolean flag is enabled
   */
  isEnabled(flag: string, options?: { userId?: string }): boolean {
    return isFeatureEnabled(flag, options);
  },

  /**
   * Get the value of a flag (for non-boolean flags or when you need the raw value)
   */
  getValue<T>(flag: string, defaultValue: T): T {
    const flagDef = FEATURE_FLAGS[flag];
    if (!flagDef) return defaultValue;

    // Check environment variable
    const envValue = process.env[flagDef.envVar];
    if (envValue !== undefined) {
      // Try to parse as the same type as defaultValue
      if (typeof defaultValue === 'boolean') {
        const parsed = parseEnvBoolean(envValue);
        if (parsed !== undefined) return parsed as T;
      }
      if (typeof defaultValue === 'number') {
        const parsed = parseFloat(envValue);
        if (!isNaN(parsed)) return parsed as T;
      }
      if (typeof defaultValue === 'string') {
        return envValue as T;
      }
    }

    return (flagDef.defaultValue as T) ?? defaultValue;
  },

  /**
   * Get all flags as a record
   */
  getAllFlags(): Record<string, boolean | string | number> {
    const result: Record<string, boolean | string | number> = {};

    for (const key of Object.keys(FEATURE_FLAGS)) {
      const state = getFeatureFlagState(key);
      result[key] = state.enabled;
    }

    return result;
  },
};

// ================================================================
// EXPORTS
// ================================================================

export type { FeatureFlag, FeatureFlagState };

// ================================================================
// EDGE CONFIG EXPORTS (Phase 4, Week 8)
// ================================================================

export {
  // Main API
  EdgeFeatureFlags,
  getEdgeFlags,
  resetEdgeFlags,
  isEdgeFlagEnabled,
  evaluateEdgeFlag,
  // Utilities
  generateEdgeConfigItems,
  validateEdgeConfigConnection,
  // Default flags
  DEFAULT_EDGE_FLAGS,
} from './edge-config';

export type {
  // Types
  FlagEnvironment,
  TargetingOperator,
  TargetingCondition,
  TargetingRule,
  EdgeFeatureFlag,
  FlagEvaluationContext,
  FlagEvaluationResult,
} from './edge-config';
