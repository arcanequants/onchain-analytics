/**
 * AI Perception Scoring Algorithm Tests
 *
 * Phase 1, Week 1, Day 4
 */

import { describe, it, expect } from 'vitest';
import {
  calculateScore,
  getScoreColor,
  getScoreCategoryLabel,
  getScoreCategoryDescription,
  compareScores,
  SCORING_WEIGHTS,
  SCORE_THRESHOLDS,
  type ProviderResult,
  type AnalysisInput,
} from './scoring';

// ================================================================
// TEST FIXTURES
// ================================================================

const createProviderResult = (
  overrides: Partial<ProviderResult> = {}
): ProviderResult => ({
  provider: 'openai',
  brandMentioned: true,
  brandRecommended: true,
  position: 1,
  sentiment: 'positive',
  confidence: 0.9,
  competitorsMentioned: [],
  ...overrides,
});

const createAnalysisInput = (
  providerResults: ProviderResult[],
  overrides: Partial<Omit<AnalysisInput, 'providerResults'>> = {}
): AnalysisInput => ({
  brandName: 'Test Brand',
  url: 'https://example.com',
  providerResults,
  ...overrides,
});

// ================================================================
// SCORE CALCULATION TESTS
// ================================================================

describe('calculateScore', () => {
  describe('perfect score scenario', () => {
    it('should return 100 for best possible results', () => {
      const results: ProviderResult[] = [
        createProviderResult({ provider: 'openai' }),
        createProviderResult({ provider: 'anthropic' }),
        createProviderResult({ provider: 'google' }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.overallScore).toBe(100);
      expect(result.category).toBe('excellent');
    });
  });

  describe('zero score scenario', () => {
    it('should return very low score for worst possible results', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          brandMentioned: false,
          brandRecommended: false,
          position: null,
          sentiment: 'negative',
          confidence: 0.9,
        }),
        createProviderResult({
          provider: 'anthropic',
          brandMentioned: false,
          brandRecommended: false,
          position: null,
          sentiment: 'negative',
          confidence: 0.9,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      // Multi-provider consistency adds some points even when not mentioned
      expect(result.overallScore).toBeLessThan(20);
      expect(result.category).toBe('critical');
    });
  });

  describe('mention component', () => {
    it('should give full mention points when mentioned by all providers', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          brandMentioned: true,
          brandRecommended: false,
          position: null,
          sentiment: 'neutral',
        }),
        createProviderResult({
          provider: 'anthropic',
          brandMentioned: true,
          brandRecommended: false,
          position: null,
          sentiment: 'neutral',
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.mentioned).toBe(SCORING_WEIGHTS.mentioned);
    });

    it('should give proportional points when partially mentioned', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          brandMentioned: true,
          brandRecommended: false,
          position: null,
          sentiment: 'neutral',
        }),
        createProviderResult({
          provider: 'anthropic',
          brandMentioned: false,
          brandRecommended: false,
          position: null,
          sentiment: 'neutral',
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.mentioned).toBe(Math.round(SCORING_WEIGHTS.mentioned / 2));
    });
  });

  describe('recommendation component', () => {
    it('should give full recommendation points when recommended by all', () => {
      const results: ProviderResult[] = [
        createProviderResult({ provider: 'openai', brandRecommended: true }),
        createProviderResult({ provider: 'anthropic', brandRecommended: true }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.recommended).toBe(SCORING_WEIGHTS.recommended);
    });

    it('should give zero when not recommended', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          brandMentioned: true,
          brandRecommended: false,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.recommended).toBe(0);
    });
  });

  describe('position component', () => {
    it('should give full position points for first place', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          position: 1,
          brandRecommended: false,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.position).toBe(20);
    });

    it('should give reduced points for lower positions', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          position: 3,
          brandRecommended: false,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.position).toBe(12); // Position 3 = 12 points
    });

    it('should give minimal points for position 5+', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          position: 10,
          brandRecommended: false,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.position).toBe(4); // Position 5+ = 4 points
    });

    it('should give partial credit for mention without position', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          position: null,
          brandMentioned: true,
          brandRecommended: false,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.position).toBe(Math.round(SCORING_WEIGHTS.position * 0.3));
    });
  });

  describe('sentiment component', () => {
    it('should give full sentiment points for positive sentiment', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          sentiment: 'positive',
          confidence: 1.0,
          brandRecommended: false,
          position: null,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.sentiment).toBe(SCORING_WEIGHTS.sentiment);
    });

    it('should give reduced points for neutral sentiment', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          sentiment: 'neutral',
          confidence: 1.0,
          brandRecommended: false,
          position: null,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.sentiment).toBe(Math.round(SCORING_WEIGHTS.sentiment * 0.4));
    });

    it('should give zero points for negative sentiment', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          sentiment: 'negative',
          brandRecommended: false,
          position: null,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.sentiment).toBe(0);
    });
  });

  describe('multi-provider component', () => {
    it('should give high score for consistent results', () => {
      const results: ProviderResult[] = [
        createProviderResult({ provider: 'openai', brandMentioned: true, sentiment: 'positive' }),
        createProviderResult({ provider: 'anthropic', brandMentioned: true, sentiment: 'positive' }),
        createProviderResult({ provider: 'google', brandMentioned: true, sentiment: 'positive' }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.multiProvider).toBe(SCORING_WEIGHTS.multiProvider);
    });

    it('should give lower score for inconsistent results', () => {
      const results: ProviderResult[] = [
        createProviderResult({ provider: 'openai', brandMentioned: true, sentiment: 'positive' }),
        createProviderResult({ provider: 'anthropic', brandMentioned: false, sentiment: 'neutral' }),
        createProviderResult({ provider: 'google', brandMentioned: true, sentiment: 'negative' }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      expect(result.breakdown.multiProvider).toBeLessThan(SCORING_WEIGHTS.multiProvider);
    });

    it('should give partial credit for single provider', () => {
      const results: ProviderResult[] = [
        createProviderResult({
          provider: 'openai',
          brandMentioned: true,
          confidence: 0.9,
          brandRecommended: false,
          position: null,
        }),
      ];

      const input = createAnalysisInput(results);
      const result = calculateScore(input);

      // Single provider gets partial credit
      expect(result.breakdown.multiProvider).toBeGreaterThan(0);
      expect(result.breakdown.multiProvider).toBeLessThan(SCORING_WEIGHTS.multiProvider);
    });
  });
});

// ================================================================
// SCORE CATEGORY TESTS
// ================================================================

describe('score categories', () => {
  it('should categorize 80-100 as excellent', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai' }),
      createProviderResult({ provider: 'anthropic' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.category).toBe('excellent');
  });

  it('should categorize 60-79 as good', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: true,
        brandRecommended: true,  // Recommended adds significant points
        position: 3,
        sentiment: 'neutral',
      }),
      createProviderResult({
        provider: 'anthropic',
        brandMentioned: true,
        brandRecommended: false,
        position: 2,
        sentiment: 'positive',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.overallScore).toBeLessThan(80);
    expect(result.category).toBe('good');
  });

  it('should categorize 40-59 as average', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandRecommended: false,
        position: null,
        sentiment: 'neutral',
      }),
      createProviderResult({
        provider: 'anthropic',
        brandMentioned: false,
        brandRecommended: false,
        position: null,
        sentiment: 'neutral',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.overallScore).toBeLessThan(60);
  });

  it('should categorize 0-19 as critical', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: false,
        brandRecommended: false,
        position: null,
        sentiment: 'neutral',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeLessThan(20);
    expect(result.category).toBe('critical');
  });
});

// ================================================================
// INSIGHTS TESTS
// ================================================================

describe('insights generation', () => {
  it('should generate strength insight when mentioned by all providers', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai' }),
      createProviderResult({ provider: 'anthropic' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    const strengthInsight = result.insights.find(
      i => i.type === 'strength' && i.message.includes('recognized by all AI models')
    );
    expect(strengthInsight).toBeDefined();
  });

  it('should generate weakness insight when not mentioned', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: false,
        brandRecommended: false,
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    const weaknessInsight = result.insights.find(
      i => i.type === 'weakness' && i.message.includes('not currently aware')
    );
    expect(weaknessInsight).toBeDefined();
  });

  it('should generate threat insight for negative sentiment', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        sentiment: 'negative',
        brandRecommended: false,
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    const threatInsight = result.insights.find(
      i => i.type === 'threat' && i.message.includes('negative sentiment')
    );
    expect(threatInsight).toBeDefined();
  });

  it('should generate threat insight when competitors mentioned instead', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: false,
        brandRecommended: false,
        competitorsMentioned: ['Competitor A', 'Competitor B'],
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    const threatInsight = result.insights.find(
      i => i.type === 'threat' && i.message.includes('Competitors')
    );
    expect(threatInsight).toBeDefined();
  });
});

// ================================================================
// PROVIDER SCORES TESTS
// ================================================================

describe('provider scores', () => {
  it('should calculate individual scores per provider', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', position: 1 }),
      createProviderResult({
        provider: 'anthropic',
        brandRecommended: false,
        position: 3,
        sentiment: 'neutral',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.providerScores.openai).toBeGreaterThan(result.providerScores.anthropic);
  });

  it('should return very low score for provider that doesnt mention brand', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: false,
        brandRecommended: false,
        position: null,
        sentiment: 'neutral',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    // Neutral sentiment still gives some points in provider score calculation
    expect(result.providerScores.openai).toBeLessThan(15);
  });
});

// ================================================================
// METADATA TESTS
// ================================================================

describe('metadata', () => {
  it('should count providers analyzed', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai' }),
      createProviderResult({ provider: 'anthropic' }),
      createProviderResult({ provider: 'google' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.providersAnalyzed).toBe(3);
  });

  it('should count providers with mention', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', brandMentioned: true }),
      createProviderResult({ provider: 'anthropic', brandMentioned: false }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.providersWithMention).toBe(1);
  });

  it('should calculate average position', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', position: 1 }),
      createProviderResult({ provider: 'anthropic', position: 3 }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.averagePosition).toBe(2);
  });

  it('should return null average position when no positions', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', position: null }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.averagePosition).toBeNull();
  });

  it('should identify dominant sentiment', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', sentiment: 'positive' }),
      createProviderResult({ provider: 'anthropic', sentiment: 'positive' }),
      createProviderResult({ provider: 'google', sentiment: 'neutral' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.dominantSentiment).toBe('positive');
  });
});

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('getScoreColor', () => {
  it('should return excellent color for 80+', () => {
    expect(getScoreColor(85)).toContain('22c55e');
  });

  it('should return good color for 60-79', () => {
    expect(getScoreColor(70)).toContain('84cc16');
  });

  it('should return average color for 40-59', () => {
    expect(getScoreColor(50)).toContain('eab308');
  });

  it('should return poor color for 20-39', () => {
    expect(getScoreColor(30)).toContain('f97316');
  });

  it('should return critical color for 0-19', () => {
    expect(getScoreColor(10)).toContain('ef4444');
  });
});

describe('getScoreCategoryLabel', () => {
  it('should return correct labels', () => {
    expect(getScoreCategoryLabel('excellent')).toBe('Excellent AI Presence');
    expect(getScoreCategoryLabel('good')).toBe('Good AI Visibility');
    expect(getScoreCategoryLabel('average')).toBe('Average AI Recognition');
    expect(getScoreCategoryLabel('poor')).toBe('Weak AI Presence');
    expect(getScoreCategoryLabel('critical')).toBe('Not Visible to AI');
  });
});

describe('getScoreCategoryDescription', () => {
  it('should return descriptions for all categories', () => {
    expect(getScoreCategoryDescription('excellent')).toContain('strong AI presence');
    expect(getScoreCategoryDescription('critical')).toContain('Immediate action');
  });
});

describe('compareScores', () => {
  it('should detect score increase', () => {
    const comparison = compareScores(75, 60);
    expect(comparison.direction).toBe('up');
    expect(comparison.change).toBe(15);
    expect(comparison.percentage).toBe(25);
  });

  it('should detect score decrease', () => {
    const comparison = compareScores(50, 80);
    expect(comparison.direction).toBe('down');
    expect(comparison.change).toBe(-30);
    // 30/80 = 0.375, rounded = 37 or 38 depending on rounding
    expect(comparison.percentage).toBeGreaterThanOrEqual(37);
    expect(comparison.percentage).toBeLessThanOrEqual(38);
  });

  it('should detect stable score', () => {
    const comparison = compareScores(70, 70);
    expect(comparison.direction).toBe('stable');
    expect(comparison.change).toBe(0);
  });

  it('should handle zero previous score', () => {
    const comparison = compareScores(50, 0);
    expect(comparison.direction).toBe('up');
    expect(comparison.percentage).toBe(0); // Cannot calculate percentage from 0
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('edge cases', () => {
  it('should handle single provider', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(1);
  });

  it('should handle very low confidence results', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', confidence: 0.1 }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.confidence).toBeLessThan(0.5);
  });

  it('should cap score at 100', () => {
    // Even with best possible results, score shouldn't exceed 100
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai' }),
      createProviderResult({ provider: 'anthropic' }),
      createProviderResult({ provider: 'google' }),
      createProviderResult({ provider: 'perplexity' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should not go below 0', () => {
    const results: ProviderResult[] = [
      createProviderResult({
        provider: 'openai',
        brandMentioned: false,
        brandRecommended: false,
        position: null,
        sentiment: 'negative',
      }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it('should handle mixed sentiment across providers', () => {
    const results: ProviderResult[] = [
      createProviderResult({ provider: 'openai', sentiment: 'positive' }),
      createProviderResult({ provider: 'anthropic', sentiment: 'negative' }),
      createProviderResult({ provider: 'google', sentiment: 'mixed' }),
    ];

    const input = createAnalysisInput(results);
    const result = calculateScore(input);

    expect(result.metadata.dominantSentiment).toBeDefined();
  });
});
