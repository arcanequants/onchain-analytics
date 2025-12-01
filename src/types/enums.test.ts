/**
 * Enum Types Tests
 *
 * Tests for canonical enum types and helper functions
 * Phase 3, Week 10
 */

import { describe, it, expect } from 'vitest';
import {
  // Const arrays
  AI_PROVIDERS,
  AI_QUERY_TYPES,
  ANALYSIS_STATUSES,
  SENTIMENT_LABELS,
  SEVERITY_LEVELS,
  PRIORITY_LEVELS,
  EFFORT_LEVELS,
  SUBSCRIPTION_TIERS,
  SUBSCRIPTION_STATUSES,
  BILLING_INTERVALS,
  COMPANY_SIZES,
  COMPETITOR_TIERS,
  RECOMMENDATION_CATEGORIES,
  HALLUCINATION_TYPES,
  REVIEW_STATUSES,
  CERTAINTY_LEVELS,
  SCORE_GRADES,
  SCORE_CATEGORIES,
  ENTITY_TYPES,
  CHAINS,
  GAS_STATUSES,
  FEAR_GREED_CLASSIFICATIONS,
  EVENT_TYPES,
  EVENT_STATUSES,
  EVENT_IMPORTANCES,

  // Helper functions
  isValidEnumValue,
  getScoreGrade,
  getSentimentLabel,
  getCertaintyLevel,
  getCompanySize,

  // Display maps
  AI_PROVIDER_LABELS,
  SUBSCRIPTION_TIER_LABELS,
  SEVERITY_LEVEL_LABELS,
  SENTIMENT_LABEL_DISPLAY,
  COMPANY_SIZE_RANGES,
} from './enums';

import type {
  AIProvider,
  AnalysisStatus,
  SentimentLabel,
  SeverityLevel,
  SubscriptionTier,
  CompanySize,
  ScoreGrade,
  CertaintyLevel,
} from './enums';

describe('Enum Types', () => {
  describe('Const Arrays', () => {
    it('should have correct AI providers', () => {
      expect(AI_PROVIDERS).toContain('openai');
      expect(AI_PROVIDERS).toContain('anthropic');
      expect(AI_PROVIDERS).toContain('google');
      expect(AI_PROVIDERS).toContain('perplexity');
      expect(AI_PROVIDERS).toHaveLength(4);
    });

    it('should have correct AI query types', () => {
      expect(AI_QUERY_TYPES).toContain('recommendation');
      expect(AI_QUERY_TYPES).toContain('sentiment');
      expect(AI_QUERY_TYPES).toContain('comparison');
      expect(AI_QUERY_TYPES.length).toBeGreaterThanOrEqual(5);
    });

    it('should have correct analysis statuses', () => {
      expect(ANALYSIS_STATUSES).toContain('pending');
      expect(ANALYSIS_STATUSES).toContain('completed');
      expect(ANALYSIS_STATUSES).toContain('failed');
      expect(ANALYSIS_STATUSES).toContain('processing');
    });

    it('should have correct sentiment labels', () => {
      expect(SENTIMENT_LABELS).toContain('positive');
      expect(SENTIMENT_LABELS).toContain('negative');
      expect(SENTIMENT_LABELS).toContain('neutral');
      expect(SENTIMENT_LABELS).toContain('mixed');
    });

    it('should have correct severity levels', () => {
      expect(SEVERITY_LEVELS).toEqual(['critical', 'high', 'medium', 'low', 'info']);
    });

    it('should have correct priority levels', () => {
      expect(PRIORITY_LEVELS).toEqual(['urgent', 'high', 'medium', 'low']);
    });

    it('should have correct effort levels', () => {
      expect(EFFORT_LEVELS).toEqual(['quick_win', 'moderate', 'significant', 'major']);
    });

    it('should have correct subscription tiers', () => {
      expect(SUBSCRIPTION_TIERS).toEqual(['free', 'starter', 'pro', 'enterprise']);
    });

    it('should have correct subscription statuses', () => {
      expect(SUBSCRIPTION_STATUSES).toContain('active');
      expect(SUBSCRIPTION_STATUSES).toContain('cancelled');
      expect(SUBSCRIPTION_STATUSES).toContain('trialing');
    });

    it('should have correct billing intervals', () => {
      expect(BILLING_INTERVALS).toEqual(['month', 'year']);
    });

    it('should have correct company sizes', () => {
      expect(COMPANY_SIZES).toEqual([
        'solo',
        'small',
        'medium',
        'large',
        'enterprise',
        'corporate',
      ]);
    });

    it('should have correct competitor tiers', () => {
      expect(COMPETITOR_TIERS).toContain('enterprise');
      expect(COMPETITOR_TIERS).toContain('mid_market');
      expect(COMPETITOR_TIERS).toContain('smb');
    });

    it('should have correct recommendation categories', () => {
      expect(RECOMMENDATION_CATEGORIES).toContain('content');
      expect(RECOMMENDATION_CATEGORIES).toContain('technical_seo');
      expect(RECOMMENDATION_CATEGORIES).toContain('authority');
    });

    it('should have correct hallucination types', () => {
      expect(HALLUCINATION_TYPES).toContain('factual_error');
      expect(HALLUCINATION_TYPES).toContain('outdated_info');
      expect(HALLUCINATION_TYPES).toContain('fabricated_entity');
    });

    it('should have correct review statuses', () => {
      expect(REVIEW_STATUSES).toContain('pending');
      expect(REVIEW_STATUSES).toContain('confirmed');
      expect(REVIEW_STATUSES).toContain('rejected');
    });

    it('should have correct certainty levels', () => {
      expect(CERTAINTY_LEVELS).toEqual([
        'very_high',
        'high',
        'medium',
        'low',
        'very_low',
        'uncertain',
      ]);
    });

    it('should have correct score grades', () => {
      expect(SCORE_GRADES).toEqual(['excellent', 'good', 'average', 'poor', 'critical']);
    });

    it('should have correct score categories', () => {
      expect(SCORE_CATEGORIES).toContain('visibility');
      expect(SCORE_CATEGORIES).toContain('sentiment');
      expect(SCORE_CATEGORIES).toContain('authority');
    });

    it('should have correct entity types', () => {
      expect(ENTITY_TYPES).toContain('organization');
      expect(ENTITY_TYPES).toContain('product');
      expect(ENTITY_TYPES).toContain('person');
      expect(ENTITY_TYPES).toContain('brand');
    });

    it('should have correct blockchain chains', () => {
      expect(CHAINS).toContain('ethereum');
      expect(CHAINS).toContain('base');
      expect(CHAINS).toContain('arbitrum');
    });

    it('should have correct gas statuses', () => {
      expect(GAS_STATUSES).toEqual(['low', 'medium', 'high']);
    });

    it('should have correct fear/greed classifications', () => {
      expect(FEAR_GREED_CLASSIFICATIONS).toContain('extreme_fear');
      expect(FEAR_GREED_CLASSIFICATIONS).toContain('greed');
      expect(FEAR_GREED_CLASSIFICATIONS).toContain('neutral');
    });

    it('should have correct event types', () => {
      expect(EVENT_TYPES).toContain('unlock');
      expect(EVENT_TYPES).toContain('airdrop');
      expect(EVENT_TYPES).toContain('mainnet');
    });

    it('should have correct event statuses', () => {
      expect(EVENT_STATUSES).toEqual(['upcoming', 'ongoing', 'completed', 'cancelled']);
    });

    it('should have correct event importances', () => {
      expect(EVENT_IMPORTANCES).toEqual(['low', 'medium', 'high', 'critical']);
    });
  });

  describe('isValidEnumValue', () => {
    it('should return true for valid values', () => {
      expect(isValidEnumValue(AI_PROVIDERS, 'openai')).toBe(true);
      expect(isValidEnumValue(SEVERITY_LEVELS, 'high')).toBe(true);
      expect(isValidEnumValue(SUBSCRIPTION_TIERS, 'pro')).toBe(true);
    });

    it('should return false for invalid values', () => {
      expect(isValidEnumValue(AI_PROVIDERS, 'invalid')).toBe(false);
      expect(isValidEnumValue(SEVERITY_LEVELS, 'super_high')).toBe(false);
      expect(isValidEnumValue(SUBSCRIPTION_TIERS, 'premium')).toBe(false);
    });

    it('should return false for non-string values', () => {
      expect(isValidEnumValue(AI_PROVIDERS, 123)).toBe(false);
      expect(isValidEnumValue(AI_PROVIDERS, null)).toBe(false);
      expect(isValidEnumValue(AI_PROVIDERS, undefined)).toBe(false);
    });
  });

  describe('getScoreGrade', () => {
    it('should return excellent for scores >= 80', () => {
      expect(getScoreGrade(80)).toBe('excellent');
      expect(getScoreGrade(95)).toBe('excellent');
      expect(getScoreGrade(100)).toBe('excellent');
    });

    it('should return good for scores 60-79', () => {
      expect(getScoreGrade(60)).toBe('good');
      expect(getScoreGrade(70)).toBe('good');
      expect(getScoreGrade(79)).toBe('good');
    });

    it('should return average for scores 40-59', () => {
      expect(getScoreGrade(40)).toBe('average');
      expect(getScoreGrade(50)).toBe('average');
      expect(getScoreGrade(59)).toBe('average');
    });

    it('should return poor for scores 20-39', () => {
      expect(getScoreGrade(20)).toBe('poor');
      expect(getScoreGrade(30)).toBe('poor');
      expect(getScoreGrade(39)).toBe('poor');
    });

    it('should return critical for scores < 20', () => {
      expect(getScoreGrade(0)).toBe('critical');
      expect(getScoreGrade(10)).toBe('critical');
      expect(getScoreGrade(19)).toBe('critical');
    });
  });

  describe('getSentimentLabel', () => {
    it('should return very_positive for scores >= 0.6', () => {
      expect(getSentimentLabel(0.6)).toBe('very_positive');
      expect(getSentimentLabel(0.8)).toBe('very_positive');
      expect(getSentimentLabel(1.0)).toBe('very_positive');
    });

    it('should return positive for scores 0.2 to 0.6', () => {
      expect(getSentimentLabel(0.2)).toBe('positive');
      expect(getSentimentLabel(0.4)).toBe('positive');
      expect(getSentimentLabel(0.59)).toBe('positive');
    });

    it('should return neutral for scores -0.2 to 0.2', () => {
      expect(getSentimentLabel(0)).toBe('neutral');
      expect(getSentimentLabel(0.1)).toBe('neutral');
      expect(getSentimentLabel(-0.1)).toBe('neutral');
    });

    it('should return negative for scores -0.6 to -0.2', () => {
      expect(getSentimentLabel(-0.3)).toBe('negative');
      expect(getSentimentLabel(-0.5)).toBe('negative');
    });

    it('should return very_negative for scores < -0.6', () => {
      expect(getSentimentLabel(-0.7)).toBe('very_negative');
      expect(getSentimentLabel(-1.0)).toBe('very_negative');
    });
  });

  describe('getCertaintyLevel', () => {
    it('should return very_high for scores >= 0.9', () => {
      expect(getCertaintyLevel(0.9)).toBe('very_high');
      expect(getCertaintyLevel(1.0)).toBe('very_high');
    });

    it('should return high for scores 0.7 to 0.9', () => {
      expect(getCertaintyLevel(0.7)).toBe('high');
      expect(getCertaintyLevel(0.8)).toBe('high');
    });

    it('should return medium for scores 0.5 to 0.7', () => {
      expect(getCertaintyLevel(0.5)).toBe('medium');
      expect(getCertaintyLevel(0.6)).toBe('medium');
    });

    it('should return low for scores 0.3 to 0.5', () => {
      expect(getCertaintyLevel(0.3)).toBe('low');
      expect(getCertaintyLevel(0.4)).toBe('low');
    });

    it('should return very_low for scores 0.1 to 0.3', () => {
      expect(getCertaintyLevel(0.1)).toBe('very_low');
      expect(getCertaintyLevel(0.2)).toBe('very_low');
    });

    it('should return uncertain for scores < 0.1', () => {
      expect(getCertaintyLevel(0)).toBe('uncertain');
      expect(getCertaintyLevel(0.05)).toBe('uncertain');
    });
  });

  describe('getCompanySize', () => {
    it('should return solo for 1 employee', () => {
      expect(getCompanySize(1)).toBe('solo');
    });

    it('should return small for 2-10 employees', () => {
      expect(getCompanySize(2)).toBe('small');
      expect(getCompanySize(10)).toBe('small');
    });

    it('should return medium for 11-50 employees', () => {
      expect(getCompanySize(11)).toBe('medium');
      expect(getCompanySize(50)).toBe('medium');
    });

    it('should return large for 51-200 employees', () => {
      expect(getCompanySize(51)).toBe('large');
      expect(getCompanySize(200)).toBe('large');
    });

    it('should return enterprise for 201-1000 employees', () => {
      expect(getCompanySize(201)).toBe('enterprise');
      expect(getCompanySize(1000)).toBe('enterprise');
    });

    it('should return corporate for 1000+ employees', () => {
      expect(getCompanySize(1001)).toBe('corporate');
      expect(getCompanySize(10000)).toBe('corporate');
    });
  });

  describe('Display Labels', () => {
    it('should have labels for all AI providers', () => {
      for (const provider of AI_PROVIDERS) {
        expect(AI_PROVIDER_LABELS[provider]).toBeDefined();
        expect(typeof AI_PROVIDER_LABELS[provider]).toBe('string');
      }
    });

    it('should have labels for all subscription tiers', () => {
      for (const tier of SUBSCRIPTION_TIERS) {
        expect(SUBSCRIPTION_TIER_LABELS[tier]).toBeDefined();
        expect(typeof SUBSCRIPTION_TIER_LABELS[tier]).toBe('string');
      }
    });

    it('should have labels for all severity levels', () => {
      for (const level of SEVERITY_LEVELS) {
        expect(SEVERITY_LEVEL_LABELS[level]).toBeDefined();
        expect(typeof SEVERITY_LEVEL_LABELS[level]).toBe('string');
      }
    });

    it('should have labels for all sentiment labels', () => {
      for (const label of SENTIMENT_LABELS) {
        expect(SENTIMENT_LABEL_DISPLAY[label]).toBeDefined();
        expect(typeof SENTIMENT_LABEL_DISPLAY[label]).toBe('string');
      }
    });
  });

  describe('Company Size Ranges', () => {
    it('should have ranges for all company sizes', () => {
      for (const size of COMPANY_SIZES) {
        expect(COMPANY_SIZE_RANGES[size]).toBeDefined();
        expect(typeof COMPANY_SIZE_RANGES[size].min).toBe('number');
      }
    });

    it('should have correct range values', () => {
      expect(COMPANY_SIZE_RANGES.solo).toEqual({ min: 1, max: 1 });
      expect(COMPANY_SIZE_RANGES.small).toEqual({ min: 2, max: 10 });
      expect(COMPANY_SIZE_RANGES.medium).toEqual({ min: 11, max: 50 });
      expect(COMPANY_SIZE_RANGES.large).toEqual({ min: 51, max: 200 });
      expect(COMPANY_SIZE_RANGES.enterprise).toEqual({ min: 201, max: 1000 });
      expect(COMPANY_SIZE_RANGES.corporate).toEqual({ min: 1001, max: null });
    });
  });

  describe('Type Safety', () => {
    it('should type-check enum values correctly', () => {
      // These should compile without errors
      const provider: AIProvider = 'openai';
      const status: AnalysisStatus = 'pending';
      const sentiment: SentimentLabel = 'positive';
      const severity: SeverityLevel = 'high';
      const tier: SubscriptionTier = 'pro';
      const size: CompanySize = 'medium';
      const grade: ScoreGrade = 'excellent';
      const certainty: CertaintyLevel = 'high';

      expect(provider).toBe('openai');
      expect(status).toBe('pending');
      expect(sentiment).toBe('positive');
      expect(severity).toBe('high');
      expect(tier).toBe('pro');
      expect(size).toBe('medium');
      expect(grade).toBe('excellent');
      expect(certainty).toBe('high');
    });
  });
});

describe('Index Re-exports', () => {
  it('should re-export enums from types/index', async () => {
    const indexModule = await import('./index');

    // Verify const arrays are exported
    expect(indexModule.AI_PROVIDERS).toBeDefined();
    expect(indexModule.SEVERITY_LEVELS).toBeDefined();
    expect(indexModule.SUBSCRIPTION_TIERS).toBeDefined();

    // Verify helper functions are exported
    expect(indexModule.isValidEnumValue).toBeDefined();
    expect(indexModule.getScoreGrade).toBeDefined();
    expect(indexModule.getSentimentLabel).toBeDefined();

    // Verify display maps are exported
    expect(indexModule.AI_PROVIDER_LABELS).toBeDefined();
    expect(indexModule.SEVERITY_COLORS).toBeDefined();
  });
});
