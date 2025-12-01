/**
 * Freemium Gating System Tests
 *
 * Phase 2, Week 4, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  PLAN_LIMITS,
  AI_PROVIDERS_BY_PLAN,
  canPerformAnalysis,
  canAccessFeature,
  canUseMonitoring,
  getAIProviderVisibility,
  getRecommendationVisibility,
  getCompetitorVisibility,
  getHistoryVisibility,
  getUpgradeTrigger,
  getAllUpgradeTriggers,
  getNextTier,
  getDaysUntilReset,
  isInTrialPeriod,
  getTrialDaysRemaining,
  formatPrice,
  getAnnualSavings,
  type UsageData,
  type PlanTier,
} from './index';

// ================================================================
// TEST DATA
// ================================================================

const createUsageData = (overrides: Partial<UsageData> = {}): UsageData => ({
  periodStart: new Date('2024-01-01'),
  periodEnd: new Date('2024-01-31'),
  analysesUsed: 0,
  monitoredUrls: 0,
  apiCallsUsed: 0,
  ...overrides,
});

// ================================================================
// PLAN LIMITS TESTS
// ================================================================

describe('PLAN_LIMITS', () => {
  it('should have correct free tier limits', () => {
    const free = PLAN_LIMITS.free;

    expect(free.analysesPerMonth).toBe(5);
    expect(free.aiProvidersVisible).toBe(2);
    expect(free.recommendationsVisible).toBe(1);
    expect(free.competitorsVisible).toBe(0);
    expect(free.historyDays).toBe(0);
    expect(free.monitoring).toBe(false);
    expect(free.exportEnabled).toBe(false);
    expect(free.apiAccess).toBe(false);
  });

  it('should have correct starter tier limits', () => {
    const starter = PLAN_LIMITS.starter;

    expect(starter.analysesPerMonth).toBe(100);
    expect(starter.aiProvidersVisible).toBe(4);
    expect(starter.recommendationsVisible).toBe('all');
    expect(starter.competitorsVisible).toBe(3);
    expect(starter.historyDays).toBe(30);
    expect(starter.monitoring).toBe('weekly');
    expect(starter.exportEnabled).toBe(true);
  });

  it('should have correct pro tier limits', () => {
    const pro = PLAN_LIMITS.pro;

    expect(pro.analysesPerMonth).toBe(500);
    expect(pro.competitorsVisible).toBe(10);
    expect(pro.historyDays).toBe(180);
    expect(pro.monitoring).toBe('daily');
    expect(pro.apiAccess).toBe(true);
    expect(pro.prioritySupport).toBe(true);
  });

  it('should have correct enterprise tier limits', () => {
    const enterprise = PLAN_LIMITS.enterprise;

    expect(enterprise.analysesPerMonth).toBe(Infinity);
    expect(enterprise.competitorsVisible).toBe(Infinity);
    expect(enterprise.historyDays).toBe(365);
    expect(enterprise.monitoring).toBe('hourly');
    expect(enterprise.customBranding).toBe(true);
    expect(enterprise.whiteLabelReports).toBe(true);
  });

  it('should have increasing prices', () => {
    expect(PLAN_LIMITS.free.priceMonthly).toBe(0);
    expect(PLAN_LIMITS.starter.priceMonthly).toBeGreaterThan(0);
    expect(PLAN_LIMITS.pro.priceMonthly).toBeGreaterThan(PLAN_LIMITS.starter.priceMonthly);
  });
});

describe('AI_PROVIDERS_BY_PLAN', () => {
  it('should show only 2 providers for free tier', () => {
    expect(AI_PROVIDERS_BY_PLAN.free).toHaveLength(2);
    expect(AI_PROVIDERS_BY_PLAN.free).toContain('openai');
    expect(AI_PROVIDERS_BY_PLAN.free).toContain('claude');
  });

  it('should show all 4 providers for paid tiers', () => {
    expect(AI_PROVIDERS_BY_PLAN.starter).toHaveLength(4);
    expect(AI_PROVIDERS_BY_PLAN.pro).toHaveLength(4);
    expect(AI_PROVIDERS_BY_PLAN.enterprise).toHaveLength(4);
  });
});

// ================================================================
// USAGE CHECKING TESTS
// ================================================================

describe('canPerformAnalysis', () => {
  it('should allow analysis when under limit', () => {
    const usage = createUsageData({ analysesUsed: 2 });
    const result = canPerformAnalysis('free', usage);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
    expect(result.usagePercent).toBe(40);
  });

  it('should deny analysis when at limit', () => {
    const usage = createUsageData({ analysesUsed: 5 });
    const result = canPerformAnalysis('free', usage);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.usagePercent).toBe(100);
    expect(result.upgradeRequired).toBe('starter');
  });

  it('should deny analysis when over limit', () => {
    const usage = createUsageData({ analysesUsed: 10 });
    const result = canPerformAnalysis('free', usage);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('limit reached');
  });

  it('should allow unlimited for enterprise', () => {
    const usage = createUsageData({ analysesUsed: 10000 });
    const result = canPerformAnalysis('enterprise', usage);

    expect(result.allowed).toBe(true);
  });
});

describe('canAccessFeature', () => {
  it('should deny export for free users', () => {
    const result = canAccessFeature('free', 'exportEnabled');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('starter');
  });

  it('should allow export for starter users', () => {
    const result = canAccessFeature('starter', 'exportEnabled');

    expect(result.allowed).toBe(true);
  });

  it('should deny API access for starter users', () => {
    const result = canAccessFeature('starter', 'apiAccess');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('pro');
  });

  it('should allow API access for pro users', () => {
    const result = canAccessFeature('pro', 'apiAccess');

    expect(result.allowed).toBe(true);
  });

  it('should deny priority support for non-pro users', () => {
    const result = canAccessFeature('starter', 'prioritySupport');

    expect(result.allowed).toBe(false);
  });
});

describe('canUseMonitoring', () => {
  it('should deny monitoring for free users', () => {
    const result = canUseMonitoring('free', 'weekly');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('starter');
  });

  it('should allow weekly monitoring for starter', () => {
    const result = canUseMonitoring('starter', 'weekly');

    expect(result.allowed).toBe(true);
  });

  it('should deny daily monitoring for starter', () => {
    const result = canUseMonitoring('starter', 'daily');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('pro');
  });

  it('should allow daily monitoring for pro', () => {
    const result = canUseMonitoring('pro', 'daily');

    expect(result.allowed).toBe(true);
  });

  it('should deny hourly monitoring for pro', () => {
    const result = canUseMonitoring('pro', 'hourly');

    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe('enterprise');
  });

  it('should allow hourly monitoring for enterprise', () => {
    const result = canUseMonitoring('enterprise', 'hourly');

    expect(result.allowed).toBe(true);
  });
});

// ================================================================
// GATED VISIBILITY TESTS
// ================================================================

describe('getAIProviderVisibility', () => {
  const allProviders = ['openai', 'claude', 'gemini', 'perplexity'];

  it('should show 2 providers for free tier', () => {
    const result = getAIProviderVisibility('free', allProviders);

    expect(result.visibleCount).toBe(2);
    expect(result.totalCount).toBe(4);
    expect(result.isBlurred).toBe(true);
    expect(result.showUpgradePrompt).toBe(true);
    expect(result.lockMessage).toContain('2 more');
  });

  it('should show all providers for paid tiers', () => {
    const result = getAIProviderVisibility('starter', allProviders);

    expect(result.visibleCount).toBe(4);
    expect(result.totalCount).toBe(4);
    expect(result.isBlurred).toBe(false);
    expect(result.showUpgradePrompt).toBe(false);
  });
});

describe('getRecommendationVisibility', () => {
  it('should show only 1 recommendation for free tier', () => {
    const result = getRecommendationVisibility('free', 5);

    expect(result.visibleCount).toBe(1);
    expect(result.totalCount).toBe(5);
    expect(result.isBlurred).toBe(true);
    expect(result.lockMessage).toContain('4 more');
  });

  it('should show all recommendations for starter tier', () => {
    const result = getRecommendationVisibility('starter', 5);

    expect(result.visibleCount).toBe(5);
    expect(result.totalCount).toBe(5);
    expect(result.isBlurred).toBe(false);
  });
});

describe('getCompetitorVisibility', () => {
  it('should show 0 competitors for free tier', () => {
    const result = getCompetitorVisibility('free', 5);

    expect(result.visibleCount).toBe(0);
    expect(result.isBlurred).toBe(true);
    expect(result.lockMessage).toContain('5 more');
  });

  it('should show up to 3 competitors for starter tier', () => {
    const result = getCompetitorVisibility('starter', 5);

    expect(result.visibleCount).toBe(3);
    expect(result.totalCount).toBe(5);
    expect(result.isBlurred).toBe(true);
  });

  it('should show up to 10 competitors for pro tier', () => {
    const result = getCompetitorVisibility('pro', 15);

    expect(result.visibleCount).toBe(10);
    expect(result.isBlurred).toBe(true);
  });

  it('should show all competitors for enterprise tier', () => {
    const result = getCompetitorVisibility('enterprise', 100);

    expect(result.visibleCount).toBe(100);
    expect(result.isBlurred).toBe(false);
  });
});

describe('getHistoryVisibility', () => {
  it('should show 0 days for free tier', () => {
    const result = getHistoryVisibility('free', 30);

    expect(result.visibleCount).toBe(0);
    expect(result.showCount).toBe(0);
    // Message should indicate history is not available or upgrade needed
    expect(result.lockMessage).toContain('history');
    expect(result.requiredPlan).toBe('starter');
  });

  it('should show all items for starter tier', () => {
    const result = getHistoryVisibility('starter', 30);

    expect(result.visibleCount).toBe(30);
    expect(result.showCount).toBe(30);
    expect(result.isBlurred).toBe(false);
  });

  it('should show all items for pro tier', () => {
    const result = getHistoryVisibility('pro', 100);

    expect(result.visibleCount).toBe(100);
    expect(result.isBlurred).toBe(false);
  });
});

// ================================================================
// UPGRADE TRIGGER TESTS
// ================================================================

describe('getUpgradeTrigger', () => {
  it('should return quota_reached trigger when limit hit', () => {
    const usage = createUsageData({ analysesUsed: 5 });
    const trigger = getUpgradeTrigger('free', usage);

    expect(trigger).not.toBeNull();
    expect(trigger?.type).toBe('quota_reached');
    expect(trigger?.urgency).toBe('high');
    expect(trigger?.recommendedPlan).toBe('starter');
  });

  it('should return limit_approaching when at 80%', () => {
    const usage = createUsageData({ analysesUsed: 4 }); // 80% of 5
    const trigger = getUpgradeTrigger('free', usage);

    expect(trigger?.type).toBe('limit_approaching');
    expect(trigger?.urgency).toBe('medium');
  });

  it('should return null when under 80%', () => {
    const usage = createUsageData({ analysesUsed: 2 });
    const trigger = getUpgradeTrigger('free', usage);

    expect(trigger).toBeNull();
  });

  it('should return feature_locked for competitors context', () => {
    const usage = createUsageData();
    const trigger = getUpgradeTrigger('free', usage, 'competitors');

    expect(trigger?.type).toBe('feature_locked');
    expect(trigger?.feature).toBe('competitors');
  });

  it('should return feature_locked for monitoring context', () => {
    const usage = createUsageData();
    const trigger = getUpgradeTrigger('free', usage, 'monitoring');

    expect(trigger?.type).toBe('feature_locked');
    expect(trigger?.feature).toBe('monitoring');
  });

  it('should return null for enterprise users', () => {
    const usage = createUsageData({ analysesUsed: 10000 });
    const trigger = getUpgradeTrigger('enterprise', usage);

    expect(trigger).toBeNull();
  });
});

describe('getAllUpgradeTriggers', () => {
  it('should return multiple triggers for free tier', () => {
    const usage = createUsageData({ analysesUsed: 5 });
    const triggers = getAllUpgradeTriggers('free', usage);

    expect(triggers.length).toBeGreaterThan(0);
    // Should be sorted by urgency
    expect(triggers[0].urgency).toBe('high');
  });

  it('should include feature-locked triggers', () => {
    const usage = createUsageData();
    const triggers = getAllUpgradeTriggers('free', usage);

    const features = triggers.map(t => t.feature);
    expect(features).toContain('competitors');
    expect(features).toContain('monitoring');
  });
});

// ================================================================
// HELPER FUNCTION TESTS
// ================================================================

describe('getNextTier', () => {
  it('should return starter for free', () => {
    expect(getNextTier('free')).toBe('starter');
  });

  it('should return pro for starter', () => {
    expect(getNextTier('starter')).toBe('pro');
  });

  it('should return enterprise for pro', () => {
    expect(getNextTier('pro')).toBe('enterprise');
  });

  it('should return enterprise for enterprise', () => {
    expect(getNextTier('enterprise')).toBe('enterprise');
  });
});

describe('getDaysUntilReset', () => {
  it('should calculate days until reset', () => {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
    const usage = createUsageData({ periodEnd });

    const days = getDaysUntilReset(usage);

    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('should return 0 for past period end', () => {
    const usage = createUsageData({ periodEnd: new Date('2020-01-01') });
    const days = getDaysUntilReset(usage);

    expect(days).toBe(0);
  });
});

describe('isInTrialPeriod', () => {
  it('should return true within trial period', () => {
    const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    expect(isInTrialPeriod(createdAt, 14)).toBe(true);
  });

  it('should return false after trial period', () => {
    const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    expect(isInTrialPeriod(createdAt, 14)).toBe(false);
  });
});

describe('getTrialDaysRemaining', () => {
  it('should calculate remaining trial days', () => {
    const createdAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const remaining = getTrialDaysRemaining(createdAt, 14);

    expect(remaining).toBeGreaterThanOrEqual(6);
    expect(remaining).toBeLessThanOrEqual(8);
  });

  it('should return 0 after trial ends', () => {
    const createdAt = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    expect(getTrialDaysRemaining(createdAt, 14)).toBe(0);
  });
});

describe('formatPrice', () => {
  it('should format free as "Free"', () => {
    expect(formatPrice(0)).toBe('Free');
  });

  it('should format monthly price correctly', () => {
    expect(formatPrice(2900)).toBe('$29/month');
  });

  it('should format annual price correctly', () => {
    expect(formatPrice(29000, true)).toBe('$290/year');
  });
});

describe('getAnnualSavings', () => {
  it('should return 0 for free tier', () => {
    expect(getAnnualSavings('free')).toBe(0);
  });

  it('should calculate savings for paid tiers', () => {
    // Starter: $29 * 12 = $348, annual = $290, savings = $58 = 17%
    const savings = getAnnualSavings('starter');
    expect(savings).toBeGreaterThan(0);
    expect(savings).toBeLessThanOrEqual(20);
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('freemium integration', () => {
  it('should correctly gate free user experience', () => {
    const plan: PlanTier = 'free';
    const usage = createUsageData({ analysesUsed: 3 });

    // Can still perform analyses
    expect(canPerformAnalysis(plan, usage).allowed).toBe(true);

    // But features are limited
    expect(canAccessFeature(plan, 'exportEnabled').allowed).toBe(false);
    expect(canUseMonitoring(plan, 'weekly').allowed).toBe(false);

    // Visibility is restricted
    const providers = getAIProviderVisibility(plan, ['openai', 'claude', 'gemini', 'perplexity']);
    expect(providers.visibleCount).toBe(2);
    expect(providers.isBlurred).toBe(true);

    const recommendations = getRecommendationVisibility(plan, 5);
    expect(recommendations.visibleCount).toBe(1);

    const competitors = getCompetitorVisibility(plan, 5);
    expect(competitors.visibleCount).toBe(0);
  });

  it('should correctly enable starter features', () => {
    const plan: PlanTier = 'starter';
    const usage = createUsageData({ analysesUsed: 50 });

    // More analyses available
    expect(canPerformAnalysis(plan, usage).allowed).toBe(true);
    expect(canPerformAnalysis(plan, usage).remaining).toBe(50);

    // More features available
    expect(canAccessFeature(plan, 'exportEnabled').allowed).toBe(true);
    expect(canUseMonitoring(plan, 'weekly').allowed).toBe(true);
    expect(canUseMonitoring(plan, 'daily').allowed).toBe(false);

    // Full visibility
    const providers = getAIProviderVisibility(plan, ['openai', 'claude', 'gemini', 'perplexity']);
    expect(providers.isBlurred).toBe(false);

    const recommendations = getRecommendationVisibility(plan, 5);
    expect(recommendations.visibleCount).toBe(5);
  });

  it('should create FOMO for free users', () => {
    const plan: PlanTier = 'free';
    const usage = createUsageData({ analysesUsed: 4 });

    // Approaching limit trigger
    const trigger = getUpgradeTrigger(plan, usage);
    expect(trigger).not.toBeNull();
    expect(trigger?.type).toBe('limit_approaching');

    // Blurred content creates FOMO
    const recommendations = getRecommendationVisibility(plan, 5);
    expect(recommendations.lockMessage).toContain('4 more');

    const competitors = getCompetitorVisibility(plan, 10);
    expect(competitors.lockMessage).toContain('10 more');
  });
});
