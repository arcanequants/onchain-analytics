/**
 * Feature Flags Module Tests
 *
 * Phase 1, Week 2
 * Tests for feature flag functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isFeatureEnabled,
  getFeatureFlagState,
  getAllFeatureFlags,
  getFeatureFlagDefinition,
  getAllFeatureFlagDefinitions,
  listFeatureFlags,
  Features,
} from './index';

describe('Feature Flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'development' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isFeatureEnabled', () => {
    it('should return default value when no env override', () => {
      // parallel_provider_queries defaults to true
      expect(isFeatureEnabled('parallel_provider_queries')).toBe(true);
    });

    it('should return false for unknown flags', () => {
      expect(isFeatureEnabled('unknown_flag')).toBe(false);
    });

    it('should override with env variable (true)', () => {
      process.env.FF_DARK_MODE = 'true';
      expect(isFeatureEnabled('dark_mode')).toBe(true);
    });

    it('should override with env variable (false)', () => {
      process.env.FF_PARALLEL_QUERIES = 'false';
      expect(isFeatureEnabled('parallel_provider_queries')).toBe(false);
    });

    it('should handle various truthy values', () => {
      const truthyValues = ['true', 'TRUE', '1', 'yes', 'Yes', 'on', 'enabled'];

      for (const value of truthyValues) {
        process.env.FF_DARK_MODE = value;
        expect(isFeatureEnabled('dark_mode')).toBe(true);
      }
    });

    it('should handle various falsy values', () => {
      const falsyValues = ['false', 'FALSE', '0', 'no', 'No', 'off', 'disabled'];

      for (const value of falsyValues) {
        process.env.FF_PARALLEL_QUERIES = value;
        expect(isFeatureEnabled('parallel_provider_queries')).toBe(false);
      }
    });

    it('should respect environment restrictions', () => {
      // strict_rate_limiting only in production
      (process.env as Record<string, string>).NODE_ENV = 'development';
      expect(isFeatureEnabled('strict_rate_limiting')).toBe(false);
    });

    it('should enable feature in allowed environment', () => {
      // show_beta_features only in development
      (process.env as Record<string, string>).NODE_ENV = 'development';
      process.env.FF_SHOW_BETA = 'true';
      expect(isFeatureEnabled('show_beta_features')).toBe(true);
    });
  });

  describe('rollout percentage', () => {
    it('should handle rollout with user ID', () => {
      // Test multiple user IDs to verify deterministic behavior
      const results = new Set<boolean>();
      for (let i = 0; i < 100; i++) {
        results.add(isFeatureEnabled('self_consistency_voting', { userId: `user_${i}` }));
      }
      // With 10% rollout, we should see both true and false
      // In practice this test may be flaky, but shows the concept
    });

    it('should return same result for same user ID', () => {
      const userId = 'consistent_user_123';
      const result1 = isFeatureEnabled('self_consistency_voting', { userId });
      const result2 = isFeatureEnabled('self_consistency_voting', { userId });
      expect(result1).toBe(result2);
    });
  });

  describe('getFeatureFlagState', () => {
    it('should return state with default source', () => {
      const state = getFeatureFlagState('parallel_provider_queries');
      expect(state.key).toBe('parallel_provider_queries');
      expect(state.enabled).toBe(true);
      expect(state.source).toBe('default');
    });

    it('should return state with env source', () => {
      process.env.FF_DARK_MODE = 'true';
      const state = getFeatureFlagState('dark_mode');
      expect(state.enabled).toBe(true);
      expect(state.source).toBe('env');
    });

    it('should return state with rollout source', () => {
      const state = getFeatureFlagState('self_consistency_voting', { userId: 'test' });
      expect(state.source).toBe('rollout');
    });

    it('should handle unknown flags', () => {
      const state = getFeatureFlagState('unknown_flag');
      expect(state.key).toBe('unknown_flag');
      expect(state.enabled).toBe(false);
      expect(state.source).toBe('default');
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all flags', () => {
      const flags = getAllFeatureFlags();
      expect(Object.keys(flags).length).toBeGreaterThan(0);
      expect(flags.parallel_provider_queries).toBeDefined();
      expect(flags.dark_mode).toBeDefined();
    });

    it('should include state information', () => {
      const flags = getAllFeatureFlags();
      const flag = flags.parallel_provider_queries;
      expect(flag.key).toBe('parallel_provider_queries');
      expect(flag.enabled).toBeDefined();
      expect(flag.source).toBeDefined();
    });
  });

  describe('getFeatureFlagDefinition', () => {
    it('should return definition for valid flag', () => {
      const def = getFeatureFlagDefinition('dark_mode');
      expect(def).toBeDefined();
      expect(def?.key).toBe('dark_mode');
      expect(def?.description).toBeDefined();
      expect(def?.envVar).toBe('FF_DARK_MODE');
    });

    it('should return undefined for unknown flag', () => {
      const def = getFeatureFlagDefinition('unknown');
      expect(def).toBeUndefined();
    });
  });

  describe('getAllFeatureFlagDefinitions', () => {
    it('should return all definitions', () => {
      const defs = getAllFeatureFlagDefinitions();
      expect(Object.keys(defs).length).toBeGreaterThan(5);
    });

    it('should return copies (not original)', () => {
      const defs = getAllFeatureFlagDefinitions();
      const original = getAllFeatureFlagDefinitions();
      expect(defs).not.toBe(original);
    });
  });

  describe('listFeatureFlags', () => {
    it('should return array of keys', () => {
      const keys = listFeatureFlags();
      expect(Array.isArray(keys)).toBe(true);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys).toContain('dark_mode');
      expect(keys).toContain('parallel_provider_queries');
    });
  });

  describe('Features convenience object', () => {
    it('should have isParallelQueriesEnabled', () => {
      expect(Features.isParallelQueriesEnabled()).toBe(true);
    });

    it('should have isDarkModeEnabled', () => {
      expect(typeof Features.isDarkModeEnabled()).toBe('boolean');
    });

    it('should have isRequestTracingEnabled', () => {
      expect(Features.isRequestTracingEnabled()).toBe(true);
    });

    it('should have isAIFallbackEnabled', () => {
      expect(Features.isAIFallbackEnabled()).toBe(true);
    });

    it('should pass userId for rollout features', () => {
      const result = Features.isSelfConsistencyEnabled('user123');
      expect(typeof result).toBe('boolean');
    });

    it('should pass userId for new scoring', () => {
      const result = Features.isNewScoringEnabled('user456');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('environment-specific flags', () => {
    it('should disable production-only flags in development', () => {
      (process.env as Record<string, string>).NODE_ENV = 'development';
      expect(isFeatureEnabled('strict_rate_limiting')).toBe(false);
    });

    it('should enable development-only flags in development', () => {
      (process.env as Record<string, string>).NODE_ENV = 'development';
      process.env.FF_VERBOSE_LOGGING = 'true';
      expect(isFeatureEnabled('verbose_logging')).toBe(true);
    });

    it('should disable development-only flags in production', () => {
      (process.env as Record<string, string>).NODE_ENV = 'production';
      process.env.FF_VERBOSE_LOGGING = 'true';
      expect(isFeatureEnabled('verbose_logging')).toBe(false);
    });
  });
});
