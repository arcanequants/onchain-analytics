/**
 * Cost Tracking & Budget Protection Tests
 *
 * Phase 1, Week 1, Day 4
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCost,
  getThresholdLevel,
  getThresholdActions,
  getCacheTTL,
  createInMemoryCostTracker,
  checkBudget,
  estimateAnalysisCost,
  BUDGET_THRESHOLDS,
  MODEL_COSTS,
  DEFAULT_DAILY_BUDGET,
  type CostTracker,
  type CostEntry,
} from './cost-tracking';

// ================================================================
// COST CALCULATION TESTS
// ================================================================

describe('calculateCost', () => {
  it('should calculate cost for gpt-3.5-turbo correctly', () => {
    // 1000 input tokens + 1000 output tokens
    // Input: (1000/1000) * 0.0005 = 0.0005
    // Output: (1000/1000) * 0.0015 = 0.0015
    // Total: 0.002
    const cost = calculateCost('gpt-3.5-turbo', 1000, 1000);
    expect(cost).toBeCloseTo(0.002, 6);
  });

  it('should calculate cost for claude-3-haiku correctly', () => {
    // Input: (1000/1000) * 0.00025 = 0.00025
    // Output: (1000/1000) * 0.00125 = 0.00125
    // Total: 0.0015
    const cost = calculateCost('claude-3-haiku-20240307', 1000, 1000);
    expect(cost).toBeCloseTo(0.0015, 6);
  });

  it('should use default costs for unknown models', () => {
    const cost = calculateCost('unknown-model', 1000, 1000);
    // Default costs are same as gpt-4o: 0.005 input, 0.015 output
    expect(cost).toBeCloseTo(0.02, 6);
  });

  it('should handle zero tokens', () => {
    const cost = calculateCost('gpt-3.5-turbo', 0, 0);
    expect(cost).toBe(0);
  });

  it('should handle large token counts', () => {
    // 100k tokens each
    const cost = calculateCost('gpt-3.5-turbo', 100000, 100000);
    // Input: 100 * 0.0005 = 0.05
    // Output: 100 * 0.0015 = 0.15
    // Total: 0.20
    expect(cost).toBeCloseTo(0.2, 6);
  });
});

// ================================================================
// THRESHOLD LEVEL TESTS
// ================================================================

describe('getThresholdLevel', () => {
  it('should return normal for usage below 70%', () => {
    expect(getThresholdLevel(0.5)).toBe('normal');
    expect(getThresholdLevel(0.69)).toBe('normal');
  });

  it('should return warning for usage 70-89%', () => {
    expect(getThresholdLevel(0.70)).toBe('warning');
    expect(getThresholdLevel(0.85)).toBe('warning');
    expect(getThresholdLevel(0.89)).toBe('warning');
  });

  it('should return alert for usage 90-94%', () => {
    expect(getThresholdLevel(0.90)).toBe('alert');
    expect(getThresholdLevel(0.94)).toBe('alert');
  });

  it('should return critical for usage 95-99%', () => {
    expect(getThresholdLevel(0.95)).toBe('critical');
    expect(getThresholdLevel(0.99)).toBe('critical');
  });

  it('should return paused for usage 100%+', () => {
    expect(getThresholdLevel(1.0)).toBe('paused');
    expect(getThresholdLevel(1.1)).toBe('paused');
  });
});

// ================================================================
// THRESHOLD ACTIONS TESTS
// ================================================================

describe('getThresholdActions', () => {
  it('should return no actions for normal level', () => {
    const actions = getThresholdActions('normal');
    expect(actions.increaseCacheTTL).toBe(false);
    expect(actions.emailAlert).toBe(false);
    expect(actions.queueFreeUsers).toBe(false);
    expect(actions.pauseFreeTier).toBe(false);
    expect(actions.pauseAll).toBe(false);
  });

  it('should increase cache TTL at warning level', () => {
    const actions = getThresholdActions('warning');
    expect(actions.increaseCacheTTL).toBe(true);
    expect(actions.emailAlert).toBe(false);
    expect(actions.pauseFreeTier).toBe(false);
  });

  it('should send email alert at alert level', () => {
    const actions = getThresholdActions('alert');
    expect(actions.increaseCacheTTL).toBe(true);
    expect(actions.emailAlert).toBe(true);
    expect(actions.queueFreeUsers).toBe(true);
    expect(actions.pauseFreeTier).toBe(false);
  });

  it('should pause free tier at critical level', () => {
    const actions = getThresholdActions('critical');
    expect(actions.pauseFreeTier).toBe(true);
    expect(actions.pauseAll).toBe(false);
  });

  it('should pause all at paused level', () => {
    const actions = getThresholdActions('paused');
    expect(actions.pauseFreeTier).toBe(true);
    expect(actions.pauseAll).toBe(true);
  });
});

// ================================================================
// CACHE TTL TESTS
// ================================================================

describe('getCacheTTL', () => {
  const BASE_TTL = 60 * 60 * 24; // 24 hours in seconds

  it('should return base TTL for normal level', () => {
    expect(getCacheTTL('normal')).toBe(BASE_TTL);
  });

  it('should increase TTL at warning level', () => {
    const ttl = getCacheTTL('warning');
    expect(ttl).toBeGreaterThan(BASE_TTL);
    expect(ttl).toBe(Math.round(BASE_TTL * 1.5));
  });

  it('should double TTL at alert level', () => {
    expect(getCacheTTL('alert')).toBe(BASE_TTL * 2);
  });

  it('should triple TTL at critical/paused levels', () => {
    expect(getCacheTTL('critical')).toBe(BASE_TTL * 3);
    expect(getCacheTTL('paused')).toBe(BASE_TTL * 3);
  });
});

// ================================================================
// IN-MEMORY COST TRACKER TESTS
// ================================================================

describe('createInMemoryCostTracker', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = createInMemoryCostTracker(DEFAULT_DAILY_BUDGET);
  });

  describe('addCost', () => {
    it('should add cost entries', async () => {
      await tracker.addCost({
        analysisId: 'test-analysis-1',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.001,
        latencyMs: 500,
        cached: false,
      });

      const status = await tracker.getBudgetStatus();
      expect(status.currentDailySpend).toBe(0.001);
    });

    it('should accumulate multiple costs', async () => {
      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.001,
        latencyMs: 500,
        cached: false,
      });

      await tracker.addCost({
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.002,
        latencyMs: 600,
        cached: false,
      });

      const status = await tracker.getBudgetStatus();
      expect(status.currentDailySpend).toBeCloseTo(0.003, 6);
    });
  });

  describe('getBudgetStatus', () => {
    it('should return correct status for zero spending', async () => {
      const status = await tracker.getBudgetStatus();

      expect(status.currentDailySpend).toBe(0);
      expect(status.percentUsed).toBe(0);
      expect(status.thresholdLevel).toBe('normal');
      expect(status.freeTierPaused).toBe(false);
      expect(status.allPaused).toBe(false);
    });

    it('should calculate percent used correctly', async () => {
      // Add cost equal to 50% of daily budget
      const halfBudget = DEFAULT_DAILY_BUDGET / 2;

      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: halfBudget,
        latencyMs: 500,
        cached: false,
      });

      const status = await tracker.getBudgetStatus();
      expect(status.percentUsed).toBeCloseTo(0.5, 2);
    });

    it('should return warning at 70% usage', async () => {
      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: DEFAULT_DAILY_BUDGET * 0.75,
        latencyMs: 500,
        cached: false,
      });

      const status = await tracker.getBudgetStatus();
      expect(status.thresholdLevel).toBe('warning');
    });

    it('should estimate remaining analyses', async () => {
      // Add cost for 1 analysis at $0.01
      await tracker.addCost({
        analysisId: 'analysis-1',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.01,
        latencyMs: 500,
        cached: false,
      });

      const status = await tracker.getBudgetStatus();
      expect(status.avgCostPerAnalysis).toBe(0.01);
      expect(status.estimatedRemainingAnalyses).toBeGreaterThan(0);
    });
  });

  describe('canProceed', () => {
    it('should allow all requests when under budget', async () => {
      expect(await tracker.canProceed('free')).toBe(true);
      expect(await tracker.canProceed('paid')).toBe(true);
      expect(await tracker.canProceed('monitoring')).toBe(true);
    });

    it('should block free tier at critical threshold', async () => {
      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: DEFAULT_DAILY_BUDGET * 0.96,
        latencyMs: 500,
        cached: false,
      });

      expect(await tracker.canProceed('free')).toBe(false);
      expect(await tracker.canProceed('paid')).toBe(true);
    });

    it('should block all at paused threshold', async () => {
      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: DEFAULT_DAILY_BUDGET * 1.01,
        latencyMs: 500,
        cached: false,
      });

      expect(await tracker.canProceed('free')).toBe(false);
      expect(await tracker.canProceed('paid')).toBe(false);
    });
  });

  describe('getDailySummary', () => {
    it('should return null for days with no data', async () => {
      const summary = await tracker.getDailySummary('2020-01-01');
      expect(summary).toBeNull();
    });

    it('should calculate daily summary correctly', async () => {
      await tracker.addCost({
        analysisId: 'analysis-1',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.01,
        latencyMs: 500,
        cached: false,
      });

      await tracker.addCost({
        analysisId: 'analysis-1',
        provider: 'anthropic',
        model: 'claude-3-haiku-20240307',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.005,
        latencyMs: 600,
        cached: true,
      });

      const summary = await tracker.getDailySummary();

      expect(summary).not.toBeNull();
      expect(summary!.totalCostUsd).toBeCloseTo(0.015, 6);
      expect(summary!.totalAnalyses).toBe(1); // Same analysis ID
      expect(summary!.cacheHitRate).toBe(0.5); // 1 of 2 cached
      expect(summary!.costByProvider['openai']).toBeCloseTo(0.01, 6);
      expect(summary!.costByProvider['anthropic']).toBeCloseTo(0.005, 6);
    });
  });

  describe('resetDaily', () => {
    it('should clear daily entries', async () => {
      await tracker.addCost({
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        tokensInput: 1000,
        tokensOutput: 500,
        costUsd: 0.01,
        latencyMs: 500,
        cached: false,
      });

      const statusBefore = await tracker.getBudgetStatus();
      expect(statusBefore.currentDailySpend).toBe(0.01);

      await tracker.resetDaily();

      const statusAfter = await tracker.getBudgetStatus();
      expect(statusAfter.currentDailySpend).toBe(0);
    });
  });
});

// ================================================================
// CHECK BUDGET TESTS
// ================================================================

describe('checkBudget', () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = createInMemoryCostTracker();
  });

  it('should allow requests under budget', async () => {
    const result = await checkBudget(tracker, 'free');

    expect(result.allowed).toBe(true);
    expect(result.delayMs).toBe(0);
  });

  it('should add delay for free users at alert level', async () => {
    await tracker.addCost({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      tokensInput: 1000,
      tokensOutput: 500,
      costUsd: DEFAULT_DAILY_BUDGET * 0.91,
      latencyMs: 500,
      cached: false,
    });

    const result = await checkBudget(tracker, 'free');

    expect(result.allowed).toBe(true);
    expect(result.delayMs).toBeGreaterThan(0);
  });

  it('should block free users at critical level', async () => {
    await tracker.addCost({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      tokensInput: 1000,
      tokensOutput: 500,
      costUsd: DEFAULT_DAILY_BUDGET * 0.96,
      latencyMs: 500,
      cached: false,
    });

    const result = await checkBudget(tracker, 'free');

    expect(result.allowed).toBe(false);
    expect(result.message).toContain('blocked');
  });

  it('should allow paid users at critical level', async () => {
    await tracker.addCost({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      tokensInput: 1000,
      tokensOutput: 500,
      costUsd: DEFAULT_DAILY_BUDGET * 0.96,
      latencyMs: 500,
      cached: false,
    });

    const result = await checkBudget(tracker, 'paid');

    expect(result.allowed).toBe(true);
  });

  it('should increase cache TTL at warning level', async () => {
    await tracker.addCost({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      tokensInput: 1000,
      tokensOutput: 500,
      costUsd: DEFAULT_DAILY_BUDGET * 0.75,
      latencyMs: 500,
      cached: false,
    });

    const result = await checkBudget(tracker, 'free');

    expect(result.cacheTTL).toBeGreaterThan(60 * 60 * 24);
    expect(result.actions.increaseCacheTTL).toBe(true);
  });
});

// ================================================================
// COST ESTIMATION TESTS
// ================================================================

describe('estimateAnalysisCost', () => {
  it('should estimate cost for single provider', () => {
    const estimate = estimateAnalysisCost([
      { provider: 'openai', model: 'gpt-3.5-turbo' },
    ], 1500);

    expect(estimate.minCost).toBeGreaterThan(0);
    expect(estimate.maxCost).toBe(estimate.minCost); // Same for single provider
    expect(estimate.avgCost).toBe(estimate.minCost);
    expect(estimate.providers).toHaveLength(1);
  });

  it('should estimate cost for multiple providers', () => {
    const estimate = estimateAnalysisCost([
      { provider: 'openai', model: 'gpt-3.5-turbo' },
      { provider: 'anthropic', model: 'claude-3-haiku-20240307' },
    ], 1500);

    expect(estimate.providers).toHaveLength(2);
    expect(estimate.minCost).toBeLessThanOrEqual(estimate.avgCost);
    expect(estimate.maxCost).toBeGreaterThanOrEqual(estimate.avgCost);
  });

  it('should return higher costs for larger token estimates', () => {
    const smallEstimate = estimateAnalysisCost([
      { provider: 'openai', model: 'gpt-3.5-turbo' },
    ], 500);

    const largeEstimate = estimateAnalysisCost([
      { provider: 'openai', model: 'gpt-3.5-turbo' },
    ], 5000);

    expect(largeEstimate.avgCost).toBeGreaterThan(smallEstimate.avgCost);
  });
});

// ================================================================
// CONSTANTS TESTS
// ================================================================

describe('constants', () => {
  it('should have budget thresholds in correct order', () => {
    expect(BUDGET_THRESHOLDS.warning).toBeLessThan(BUDGET_THRESHOLDS.alert);
    expect(BUDGET_THRESHOLDS.alert).toBeLessThan(BUDGET_THRESHOLDS.critical);
    expect(BUDGET_THRESHOLDS.critical).toBeLessThan(BUDGET_THRESHOLDS.pause);
  });

  it('should have model costs for main providers', () => {
    expect(MODEL_COSTS['gpt-3.5-turbo']).toBeDefined();
    expect(MODEL_COSTS['gpt-4o']).toBeDefined();
    expect(MODEL_COSTS['claude-3-haiku-20240307']).toBeDefined();
    expect(MODEL_COSTS['gemini-1.5-flash']).toBeDefined();
  });

  it('should have daily budget less than monthly', () => {
    expect(DEFAULT_DAILY_BUDGET).toBeLessThan(100);
  });
});
