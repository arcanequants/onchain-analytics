/**
 * Plan Enforcement Tests
 *
 * Phase 2, Week 5, Day 3
 */

import { describe, it, expect } from 'vitest';
import {
  checkFeatureAccess,
  checkAnalysisLimit,
  checkCompetitorLimit,
  checkMonitoringAccess,
  checkDailyMonitoringAccess,
  checkExportAccess,
  getAvailableExportFormats,
  getHistoryRetentionDays,
  isWithinHistoryRetention,
  checkApiAccess,
  hasPrioritySupport,
  getUpgradeFeatures,
  shouldSuggestUpgrade,
} from './plan-enforcement';

// ================================================================
// FEATURE ACCESS TESTS
// ================================================================

describe('checkFeatureAccess', () => {
  describe('analysesPerMonth', () => {
    it('should allow for all plans', () => {
      expect(checkFeatureAccess('free', 'analysesPerMonth').allowed).toBe(true);
      expect(checkFeatureAccess('starter', 'analysesPerMonth').allowed).toBe(true);
      expect(checkFeatureAccess('pro', 'analysesPerMonth').allowed).toBe(true);
    });
  });

  describe('competitors', () => {
    it('should not allow for free plan', () => {
      const result = checkFeatureAccess('free', 'competitors');
      expect(result.allowed).toBe(false);
      expect(result.upgradeRequired).toBe(true);
      expect(result.upgradeReason?.recommendedPlan).toBe('starter');
    });

    it('should allow for paid plans', () => {
      expect(checkFeatureAccess('starter', 'competitors').allowed).toBe(true);
      expect(checkFeatureAccess('pro', 'competitors').allowed).toBe(true);
    });
  });

  describe('apiAccess', () => {
    it('should only allow for pro plan', () => {
      expect(checkFeatureAccess('free', 'apiAccess').allowed).toBe(false);
      expect(checkFeatureAccess('starter', 'apiAccess').allowed).toBe(false);
      expect(checkFeatureAccess('pro', 'apiAccess').allowed).toBe(true);
    });
  });
});

// ================================================================
// ANALYSIS LIMIT TESTS
// ================================================================

describe('checkAnalysisLimit', () => {
  it('should allow when under limit', () => {
    const result = checkAnalysisLimit('free', 1);
    expect(result.allowed).toBe(true);
    expect(result.used).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.remaining).toBe(2);
  });

  it('should not allow when at limit', () => {
    const result = checkAnalysisLimit('free', 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.upgradeRequired).toBe(true);
  });

  it('should not allow when over limit', () => {
    const result = checkAnalysisLimit('free', 5);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.percentUsed).toBe(100);
  });

  it('should show warning at 80% usage', () => {
    const result = checkAnalysisLimit('starter', 80);
    expect(result.warningThreshold).toBe(true);
  });

  it('should not show warning below 80% usage', () => {
    const result = checkAnalysisLimit('starter', 50);
    expect(result.warningThreshold).toBe(false);
  });

  it('should calculate percent correctly', () => {
    const result = checkAnalysisLimit('starter', 50);
    expect(result.percentUsed).toBe(50);
  });
});

// ================================================================
// COMPETITOR LIMIT TESTS
// ================================================================

describe('checkCompetitorLimit', () => {
  it('should not allow for free plan (limit is 0)', () => {
    const result = checkCompetitorLimit('free', 0);
    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(0);
  });

  it('should allow starter plan under limit', () => {
    const result = checkCompetitorLimit('starter', 2);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('should not allow starter at limit', () => {
    const result = checkCompetitorLimit('starter', 3);
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('should allow pro plan more competitors', () => {
    const result = checkCompetitorLimit('pro', 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});

// ================================================================
// MONITORING TESTS
// ================================================================

describe('checkMonitoringAccess', () => {
  it('should not allow for free plan', () => {
    const result = checkMonitoringAccess('free');
    expect(result.allowed).toBe(false);
    expect(result.frequency).toBe('none');
    expect(result.reason).toBeDefined();
  });

  it('should allow weekly for starter plan', () => {
    const result = checkMonitoringAccess('starter');
    expect(result.allowed).toBe(true);
    expect(result.frequency).toBe('weekly');
  });

  it('should allow daily for pro plan', () => {
    const result = checkMonitoringAccess('pro');
    expect(result.allowed).toBe(true);
    expect(result.frequency).toBe('daily');
  });
});

describe('checkDailyMonitoringAccess', () => {
  it('should return false for free and starter', () => {
    expect(checkDailyMonitoringAccess('free')).toBe(false);
    expect(checkDailyMonitoringAccess('starter')).toBe(false);
  });

  it('should return true for pro', () => {
    expect(checkDailyMonitoringAccess('pro')).toBe(true);
  });
});

// ================================================================
// EXPORT TESTS
// ================================================================

describe('checkExportAccess', () => {
  it('should not allow any exports for free plan', () => {
    expect(checkExportAccess('free', 'pdf').allowed).toBe(false);
    expect(checkExportAccess('free', 'csv').allowed).toBe(false);
    expect(checkExportAccess('free', 'json').allowed).toBe(false);
  });

  it('should allow pdf and csv for starter', () => {
    expect(checkExportAccess('starter', 'pdf').allowed).toBe(true);
    expect(checkExportAccess('starter', 'csv').allowed).toBe(true);
    expect(checkExportAccess('starter', 'json').allowed).toBe(false);
  });

  it('should allow all formats for pro', () => {
    expect(checkExportAccess('pro', 'pdf').allowed).toBe(true);
    expect(checkExportAccess('pro', 'csv').allowed).toBe(true);
    expect(checkExportAccess('pro', 'json').allowed).toBe(true);
  });
});

describe('getAvailableExportFormats', () => {
  it('should return empty array for free', () => {
    expect(getAvailableExportFormats('free')).toEqual([]);
  });

  it('should return pdf and csv for starter', () => {
    expect(getAvailableExportFormats('starter')).toEqual(['pdf', 'csv']);
  });

  it('should return all formats for pro', () => {
    expect(getAvailableExportFormats('pro')).toEqual(['pdf', 'csv', 'json']);
  });
});

// ================================================================
// HISTORY TESTS
// ================================================================

describe('getHistoryRetentionDays', () => {
  it('should return correct days for each plan', () => {
    expect(getHistoryRetentionDays('free')).toBe(7);
    expect(getHistoryRetentionDays('starter')).toBe(90);
    expect(getHistoryRetentionDays('pro')).toBe(365);
  });
});

describe('isWithinHistoryRetention', () => {
  it('should return true for recent dates', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isWithinHistoryRetention('free', yesterday)).toBe(true);
  });

  it('should return false for dates outside retention', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    expect(isWithinHistoryRetention('free', oldDate)).toBe(false);
  });

  it('should respect plan-specific retention', () => {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    expect(isWithinHistoryRetention('free', monthAgo)).toBe(false);
    expect(isWithinHistoryRetention('starter', monthAgo)).toBe(true);
  });
});

// ================================================================
// API ACCESS TESTS
// ================================================================

describe('checkApiAccess', () => {
  it('should not allow for free plan', () => {
    const result = checkApiAccess('free');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('should not allow for starter plan', () => {
    const result = checkApiAccess('starter');
    expect(result.allowed).toBe(false);
    expect(result.upgradeRequired).toBe(true);
  });

  it('should allow for pro plan', () => {
    const result = checkApiAccess('pro');
    expect(result.allowed).toBe(true);
    expect(result.upgradeRequired).toBeUndefined();
  });
});

// ================================================================
// PRIORITY SUPPORT TESTS
// ================================================================

describe('hasPrioritySupport', () => {
  it('should return false for free and starter', () => {
    expect(hasPrioritySupport('free')).toBe(false);
    expect(hasPrioritySupport('starter')).toBe(false);
  });

  it('should return true for pro', () => {
    expect(hasPrioritySupport('pro')).toBe(true);
  });
});

// ================================================================
// UPGRADE FEATURES TESTS
// ================================================================

describe('getUpgradeFeatures', () => {
  it('should list features from free to starter', () => {
    const features = getUpgradeFeatures('free', 'starter');
    expect(features.length).toBeGreaterThan(0);
    expect(features.some((f) => f.includes('analyses/month'))).toBe(true);
    expect(features.some((f) => f.includes('competitors'))).toBe(true);
    expect(features.some((f) => f.includes('monitoring'))).toBe(true);
  });

  it('should list features from starter to pro', () => {
    const features = getUpgradeFeatures('starter', 'pro');
    expect(features.length).toBeGreaterThan(0);
    expect(features.some((f) => f.includes('analyses/month'))).toBe(true);
    expect(features.some((f) => f.includes('daily'))).toBe(true);
    expect(features.some((f) => f.includes('Priority support'))).toBe(true);
  });

  it('should list features from free to pro', () => {
    const features = getUpgradeFeatures('free', 'pro');
    expect(features.length).toBeGreaterThan(0);
    expect(features.some((f) => f.includes('API access'))).toBe(true);
  });
});

// ================================================================
// UPGRADE SUGGESTION TESTS
// ================================================================

describe('shouldSuggestUpgrade', () => {
  it('should not suggest upgrade for pro users', () => {
    const result = shouldSuggestUpgrade('pro', 400, 8);
    expect(result.suggest).toBe(false);
  });

  it('should suggest upgrade when near analysis limit', () => {
    const result = shouldSuggestUpgrade('free', 3, 0);
    expect(result.suggest).toBe(true);
    expect(result.targetPlan).toBe('starter');
  });

  it('should suggest upgrade when near competitor limit', () => {
    const result = shouldSuggestUpgrade('starter', 50, 3);
    expect(result.suggest).toBe(true);
    expect(result.targetPlan).toBe('pro');
  });

  it('should suggest upgrade for active free users', () => {
    const result = shouldSuggestUpgrade('free', 2, 0);
    expect(result.suggest).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('should not suggest upgrade for new users', () => {
    const result = shouldSuggestUpgrade('starter', 0, 0);
    expect(result.suggest).toBe(false);
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle zero usage', () => {
    const result = checkAnalysisLimit('free', 0);
    expect(result.percentUsed).toBe(0);
    expect(result.remaining).toBe(3);
  });

  it('should handle exactly at 80% threshold', () => {
    const result = checkAnalysisLimit('starter', 80);
    expect(result.warningThreshold).toBe(true);
  });

  it('should handle exactly at limit', () => {
    const result = checkAnalysisLimit('starter', 100);
    expect(result.allowed).toBe(false);
    expect(result.percentUsed).toBe(100);
    expect(result.remaining).toBe(0);
  });
});
