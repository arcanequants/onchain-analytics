/**
 * Stripe Configuration Tests
 *
 * Phase 2, Week 5, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  PLANS,
  getPlanById,
  getPlanByPriceId,
  formatPrice,
  getAnnualSavings,
  getAnnualSavingsPercent,
  calculateUsageStatus,
  canAccessFeature,
  getFeatureLimit,
  getUpgradeReason,
  type PlanId,
} from './config';

// ================================================================
// PLAN CONFIGURATION TESTS
// ================================================================

describe('PLANS', () => {
  it('should have three plans defined', () => {
    expect(Object.keys(PLANS)).toHaveLength(3);
    expect(PLANS.free).toBeDefined();
    expect(PLANS.starter).toBeDefined();
    expect(PLANS.pro).toBeDefined();
  });

  it('should have free plan with zero price', () => {
    expect(PLANS.free.price).toBe(0);
    expect(PLANS.free.priceAnnual).toBe(0);
  });

  it('should have starter plan with correct price', () => {
    expect(PLANS.starter.price).toBe(2900); // $29.00
    expect(PLANS.starter.priceAnnual).toBe(29000); // $290.00
  });

  it('should have pro plan with correct price', () => {
    expect(PLANS.pro.price).toBe(7900); // $79.00
    expect(PLANS.pro.priceAnnual).toBe(79000); // $790.00
  });

  it('should have pro plan marked as popular', () => {
    expect(PLANS.pro.popular).toBe(true);
    expect(PLANS.free.popular).toBeUndefined();
    expect(PLANS.starter.popular).toBeUndefined();
  });

  it('should have increasing limits per tier', () => {
    expect(PLANS.free.limits.analysesPerMonth).toBeLessThan(
      PLANS.starter.limits.analysesPerMonth
    );
    expect(PLANS.starter.limits.analysesPerMonth).toBeLessThan(
      PLANS.pro.limits.analysesPerMonth
    );
  });
});

// ================================================================
// GET PLAN BY ID TESTS
// ================================================================

describe('getPlanById', () => {
  it('should return correct plan for free', () => {
    const plan = getPlanById('free');
    expect(plan.id).toBe('free');
    expect(plan.name).toBe('Free');
  });

  it('should return correct plan for starter', () => {
    const plan = getPlanById('starter');
    expect(plan.id).toBe('starter');
    expect(plan.name).toBe('Starter');
  });

  it('should return correct plan for pro', () => {
    const plan = getPlanById('pro');
    expect(plan.id).toBe('pro');
    expect(plan.name).toBe('Pro');
  });
});

// ================================================================
// FORMAT PRICE TESTS
// ================================================================

describe('formatPrice', () => {
  it('should format zero correctly', () => {
    expect(formatPrice(0)).toBe('$0');
  });

  it('should format whole dollars correctly', () => {
    expect(formatPrice(2900)).toBe('$29');
    expect(formatPrice(7900)).toBe('$79');
  });

  it('should format large amounts correctly', () => {
    expect(formatPrice(29000)).toBe('$290');
    expect(formatPrice(79000)).toBe('$790');
  });
});

// ================================================================
// ANNUAL SAVINGS TESTS
// ================================================================

describe('getAnnualSavings', () => {
  it('should return 0 for free plan', () => {
    expect(getAnnualSavings(PLANS.free)).toBe(0);
  });

  it('should calculate savings for starter plan', () => {
    // Monthly: $29 * 12 = $348
    // Annual: $290
    // Savings: $58
    expect(getAnnualSavings(PLANS.starter)).toBe(5800);
  });

  it('should calculate savings for pro plan', () => {
    // Monthly: $79 * 12 = $948
    // Annual: $790
    // Savings: $158
    expect(getAnnualSavings(PLANS.pro)).toBe(15800);
  });
});

describe('getAnnualSavingsPercent', () => {
  it('should return 0 for free plan', () => {
    expect(getAnnualSavingsPercent(PLANS.free)).toBe(0);
  });

  it('should calculate percentage for starter plan', () => {
    // Savings: $58 / $348 = ~17%
    const percent = getAnnualSavingsPercent(PLANS.starter);
    expect(percent).toBeGreaterThan(15);
    expect(percent).toBeLessThan(20);
  });

  it('should calculate percentage for pro plan', () => {
    // Savings: $158 / $948 = ~17%
    const percent = getAnnualSavingsPercent(PLANS.pro);
    expect(percent).toBeGreaterThan(15);
    expect(percent).toBeLessThan(20);
  });
});

// ================================================================
// USAGE STATUS TESTS
// ================================================================

describe('calculateUsageStatus', () => {
  const periodStart = new Date('2024-01-15');

  it('should calculate usage for free plan', () => {
    const status = calculateUsageStatus('free', 2, periodStart);

    expect(status.plan).toBe('free');
    expect(status.analysesUsed).toBe(2);
    expect(status.analysesLimit).toBe(3);
    expect(status.percentUsed).toBe(67);
    expect(status.isAtLimit).toBe(false);
  });

  it('should show at limit when usage equals limit', () => {
    const status = calculateUsageStatus('free', 3, periodStart);

    expect(status.isAtLimit).toBe(true);
    expect(status.percentUsed).toBe(100);
  });

  it('should cap percent at 100', () => {
    const status = calculateUsageStatus('free', 5, periodStart);

    expect(status.percentUsed).toBe(100);
    expect(status.isAtLimit).toBe(true);
  });

  it('should calculate reset date as first of next month', () => {
    const status = calculateUsageStatus('starter', 50, periodStart);

    expect(status.resetDate.getMonth()).toBe(1); // February
    expect(status.resetDate.getDate()).toBe(1);
  });

  it('should handle starter plan correctly', () => {
    const status = calculateUsageStatus('starter', 50, periodStart);

    expect(status.analysesLimit).toBe(100);
    expect(status.percentUsed).toBe(50);
    expect(status.isAtLimit).toBe(false);
  });

  it('should handle pro plan correctly', () => {
    const status = calculateUsageStatus('pro', 250, periodStart);

    expect(status.analysesLimit).toBe(500);
    expect(status.percentUsed).toBe(50);
    expect(status.isAtLimit).toBe(false);
  });
});

// ================================================================
// FEATURE ACCESS TESTS
// ================================================================

describe('canAccessFeature', () => {
  describe('analysesPerMonth', () => {
    it('should return true for all plans', () => {
      expect(canAccessFeature('free', 'analysesPerMonth')).toBe(true);
      expect(canAccessFeature('starter', 'analysesPerMonth')).toBe(true);
      expect(canAccessFeature('pro', 'analysesPerMonth')).toBe(true);
    });
  });

  describe('competitors', () => {
    it('should return false for free plan', () => {
      expect(canAccessFeature('free', 'competitors')).toBe(false);
    });

    it('should return true for paid plans', () => {
      expect(canAccessFeature('starter', 'competitors')).toBe(true);
      expect(canAccessFeature('pro', 'competitors')).toBe(true);
    });
  });

  describe('monitoringFrequency', () => {
    it('should return false for free plan (none)', () => {
      expect(canAccessFeature('free', 'monitoringFrequency')).toBe(false);
    });

    it('should return true for paid plans', () => {
      expect(canAccessFeature('starter', 'monitoringFrequency')).toBe(true);
      expect(canAccessFeature('pro', 'monitoringFrequency')).toBe(true);
    });
  });

  describe('prioritySupport', () => {
    it('should return false for free and starter', () => {
      expect(canAccessFeature('free', 'prioritySupport')).toBe(false);
      expect(canAccessFeature('starter', 'prioritySupport')).toBe(false);
    });

    it('should return true for pro', () => {
      expect(canAccessFeature('pro', 'prioritySupport')).toBe(true);
    });
  });

  describe('apiAccess', () => {
    it('should return false for free and starter', () => {
      expect(canAccessFeature('free', 'apiAccess')).toBe(false);
      expect(canAccessFeature('starter', 'apiAccess')).toBe(false);
    });

    it('should return true for pro', () => {
      expect(canAccessFeature('pro', 'apiAccess')).toBe(true);
    });
  });

  describe('exportFormats', () => {
    it('should return false for free plan (empty array)', () => {
      expect(canAccessFeature('free', 'exportFormats')).toBe(false);
    });

    it('should return true for paid plans', () => {
      expect(canAccessFeature('starter', 'exportFormats')).toBe(true);
      expect(canAccessFeature('pro', 'exportFormats')).toBe(true);
    });
  });
});

describe('getFeatureLimit', () => {
  it('should return correct analyses limit', () => {
    expect(getFeatureLimit('free', 'analysesPerMonth')).toBe(3);
    expect(getFeatureLimit('starter', 'analysesPerMonth')).toBe(100);
    expect(getFeatureLimit('pro', 'analysesPerMonth')).toBe(500);
  });

  it('should return correct competitors limit', () => {
    expect(getFeatureLimit('free', 'competitors')).toBe(0);
    expect(getFeatureLimit('starter', 'competitors')).toBe(3);
    expect(getFeatureLimit('pro', 'competitors')).toBe(10);
  });

  it('should return correct monitoring frequency', () => {
    expect(getFeatureLimit('free', 'monitoringFrequency')).toBe('none');
    expect(getFeatureLimit('starter', 'monitoringFrequency')).toBe('weekly');
    expect(getFeatureLimit('pro', 'monitoringFrequency')).toBe('daily');
  });

  it('should return correct history days', () => {
    expect(getFeatureLimit('free', 'historyDays')).toBe(7);
    expect(getFeatureLimit('starter', 'historyDays')).toBe(90);
    expect(getFeatureLimit('pro', 'historyDays')).toBe(365);
  });

  it('should return correct export formats', () => {
    expect(getFeatureLimit('free', 'exportFormats')).toEqual([]);
    expect(getFeatureLimit('starter', 'exportFormats')).toEqual(['pdf', 'csv']);
    expect(getFeatureLimit('pro', 'exportFormats')).toEqual(['pdf', 'csv', 'json']);
  });
});

// ================================================================
// UPGRADE REASON TESTS
// ================================================================

describe('getUpgradeReason', () => {
  it('should return null for pro plan', () => {
    expect(getUpgradeReason('pro', 'competitors')).toBeNull();
  });

  it('should recommend starter for free users', () => {
    const reason = getUpgradeReason('free', 'competitors');

    expect(reason).not.toBeNull();
    expect(reason!.recommendedPlan).toBe('starter');
    expect(reason!.feature).toBe('Competitor tracking');
    expect(reason!.currentLimit).toBe('0');
    expect(reason!.upgradeLimit).toBe('3');
  });

  it('should recommend pro for starter users', () => {
    const reason = getUpgradeReason('starter', 'competitors');

    expect(reason).not.toBeNull();
    expect(reason!.recommendedPlan).toBe('pro');
    expect(reason!.currentLimit).toBe('3');
    expect(reason!.upgradeLimit).toBe('10');
  });

  it('should format boolean features correctly', () => {
    const reason = getUpgradeReason('free', 'prioritySupport');

    expect(reason).not.toBeNull();
    expect(reason!.currentLimit).toBe('No');
  });

  it('should format array features correctly', () => {
    const reason = getUpgradeReason('free', 'exportFormats');

    expect(reason).not.toBeNull();
    expect(reason!.currentLimit).toBe('None');
    expect(reason!.upgradeLimit).toBe('pdf, csv');
  });

  it('should format monitoring frequency correctly', () => {
    const reason = getUpgradeReason('free', 'monitoringFrequency');

    expect(reason).not.toBeNull();
    expect(reason!.currentLimit).toBe('none');
    expect(reason!.upgradeLimit).toBe('weekly');
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle all plan features', () => {
    const planIds: PlanId[] = ['free', 'starter', 'pro'];

    planIds.forEach((planId) => {
      const plan = getPlanById(planId);
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.description.length).toBeGreaterThan(0);
    });
  });

  it('should have consistent limit types', () => {
    const planIds: PlanId[] = ['free', 'starter', 'pro'];

    planIds.forEach((planId) => {
      const plan = getPlanById(planId);

      expect(typeof plan.limits.analysesPerMonth).toBe('number');
      expect(typeof plan.limits.aiProviders).toBe('number');
      expect(typeof plan.limits.competitors).toBe('number');
      expect(typeof plan.limits.historyDays).toBe('number');
      expect(typeof plan.limits.prioritySupport).toBe('boolean');
      expect(typeof plan.limits.apiAccess).toBe('boolean');
      expect(Array.isArray(plan.limits.exportFormats)).toBe(true);
    });
  });
});
