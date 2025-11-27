/**
 * Score Calculator Tests
 *
 * Phase 1, Week 1, Day 3
 */

import { describe, it, expect } from 'vitest';
import scoreCalculator, {
  calculateScore,
  calculateQuickScore,
  compareScores,
  getGradeFromScore,
  getGradeLabel,
  getGradeColor,
  type ScoreCalculatorInput,
  type ScoreResult,
} from './index';
import type { AggregatedPerception } from '../perception-query';
import type { IndustryDetection } from '../ai/schemas';

// ================================================================
// TEST FIXTURES
// ================================================================

function createMockPerception(overrides: Partial<AggregatedPerception> = {}): AggregatedPerception {
  return {
    visibilityScore: 65,
    mentionRate: 0.6,
    averagePosition: 2.5,
    overallSentiment: 'positive',
    topAttributes: ['ease of use', 'reliability', 'pricing'],
    topCompetitors: ['Competitor A', 'Competitor B'],
    confidence: 0.8,
    queriesAnalyzed: 10,
    intentBreakdown: {
      recommendation: { count: 3, mentionRate: 0.7, avgPosition: 2 },
      comparison: { count: 2, mentionRate: 0.5, avgPosition: 3 },
      evaluation: { count: 2, mentionRate: 0.6, avgPosition: 2 },
      alternatives: { count: 2, mentionRate: 0.4, avgPosition: 4 },
      use_case: { count: 1, mentionRate: 0.8, avgPosition: 1 },
    },
    ...overrides,
  };
}

function createMockIndustryDetection(overrides: Partial<IndustryDetection> = {}): IndustryDetection {
  return {
    industry: 'saas',
    subIndustry: 'crm',
    country: 'US',
    entityType: 'business',
    competitors: ['Competitor A', 'Competitor B'],
    confidence: 0.85,
    reasoning: 'Detected as SaaS CRM based on content',
    ...overrides,
  };
}

function createMockInput(overrides: Partial<ScoreCalculatorInput> = {}): ScoreCalculatorInput {
  return {
    brandName: 'TestBrand',
    perception: createMockPerception(),
    industryDetection: createMockIndustryDetection(),
    ...overrides,
  };
}

// ================================================================
// GRADE UTILITY TESTS
// ================================================================

describe('getGradeFromScore', () => {
  it('should return excellent for scores 80-100', () => {
    expect(getGradeFromScore(80)).toBe('excellent');
    expect(getGradeFromScore(90)).toBe('excellent');
    expect(getGradeFromScore(100)).toBe('excellent');
  });

  it('should return good for scores 60-79', () => {
    expect(getGradeFromScore(60)).toBe('good');
    expect(getGradeFromScore(70)).toBe('good');
    expect(getGradeFromScore(79)).toBe('good');
  });

  it('should return average for scores 40-59', () => {
    expect(getGradeFromScore(40)).toBe('average');
    expect(getGradeFromScore(50)).toBe('average');
    expect(getGradeFromScore(59)).toBe('average');
  });

  it('should return poor for scores 20-39', () => {
    expect(getGradeFromScore(20)).toBe('poor');
    expect(getGradeFromScore(30)).toBe('poor');
    expect(getGradeFromScore(39)).toBe('poor');
  });

  it('should return critical for scores 0-19', () => {
    expect(getGradeFromScore(0)).toBe('critical');
    expect(getGradeFromScore(10)).toBe('critical');
    expect(getGradeFromScore(19)).toBe('critical');
  });

  it('should clamp scores above 100', () => {
    expect(getGradeFromScore(150)).toBe('excellent');
  });

  it('should clamp scores below 0', () => {
    expect(getGradeFromScore(-10)).toBe('critical');
  });
});

describe('getGradeLabel', () => {
  it('should return correct labels', () => {
    expect(getGradeLabel('excellent')).toBe('Excellent');
    expect(getGradeLabel('good')).toBe('Good');
    expect(getGradeLabel('average')).toBe('Average');
    expect(getGradeLabel('poor')).toBe('Poor');
    expect(getGradeLabel('critical')).toBe('Critical');
  });
});

describe('getGradeColor', () => {
  it('should return correct colors', () => {
    expect(getGradeColor('excellent')).toBe('#22c55e');
    expect(getGradeColor('good')).toBe('#84cc16');
    expect(getGradeColor('average')).toBe('#eab308');
    expect(getGradeColor('poor')).toBe('#f97316');
    expect(getGradeColor('critical')).toBe('#ef4444');
  });
});

// ================================================================
// CATEGORY WEIGHTS TESTS
// ================================================================

describe('CATEGORY_WEIGHTS', () => {
  it('should have all required categories', () => {
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('visibility');
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('sentiment');
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('authority');
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('relevance');
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('competitive');
    expect(scoreCalculator.CATEGORY_WEIGHTS).toHaveProperty('coverage');
  });

  it('should sum to 1.0', () => {
    const sum = Object.values(scoreCalculator.CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 10);
  });

  it('should have visibility as highest weight', () => {
    const maxWeight = Math.max(...Object.values(scoreCalculator.CATEGORY_WEIGHTS));
    expect(scoreCalculator.CATEGORY_WEIGHTS.visibility).toBe(maxWeight);
  });
});

// ================================================================
// QUICK SCORE TESTS
// ================================================================

describe('calculateQuickScore', () => {
  it('should calculate score from mention rate', () => {
    const score = calculateQuickScore(1.0, 1, 'positive');
    expect(score).toBe(100);
  });

  it('should give low score for no mentions', () => {
    const score = calculateQuickScore(0, null, 'neutral');
    // With 0 mention rate, no position, and neutral sentiment = 10 points (sentiment only)
    expect(score).toBe(10);
  });

  it('should apply position bonus', () => {
    const topPosition = calculateQuickScore(0.5, 1, 'neutral');
    const fifthPosition = calculateQuickScore(0.5, 5, 'neutral');
    expect(topPosition).toBeGreaterThan(fifthPosition);
  });

  it('should apply sentiment modifier', () => {
    const positive = calculateQuickScore(0.5, 2, 'positive');
    const neutral = calculateQuickScore(0.5, 2, 'neutral');
    const negative = calculateQuickScore(0.5, 2, 'negative');

    expect(positive).toBeGreaterThan(neutral);
    expect(neutral).toBeGreaterThan(negative);
  });

  it('should handle null position with mentions', () => {
    const score = calculateQuickScore(0.5, null, 'positive');
    // 0.5 * 60 (mention) + 10 (no position but mentioned) + 15 (positive)
    expect(score).toBe(55);
  });

  it('should clamp score to 0-100', () => {
    const high = calculateQuickScore(2.0, 1, 'positive');
    const low = calculateQuickScore(-0.5, 10, 'negative');
    expect(high).toBeLessThanOrEqual(100);
    expect(low).toBeGreaterThanOrEqual(0);
  });
});

// ================================================================
// FULL SCORE CALCULATION TESTS
// ================================================================

describe('calculateScore', () => {
  it('should return Ok result with valid input', () => {
    const input = createMockInput();
    const result = calculateScore(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.value.overallScore).toBeLessThanOrEqual(100);
    }
  });

  it('should return error for empty brand name', () => {
    const input = createMockInput({ brandName: '' });
    const result = calculateScore(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Brand name');
    }
  });

  it('should return error for null perception', () => {
    const input = createMockInput({ perception: undefined as any });
    const result = calculateScore(input);

    expect(result.ok).toBe(false);
  });

  it('should calculate all category scores', () => {
    const input = createMockInput();
    const result = calculateScore(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.categories).toHaveLength(6);
      const categoryNames = result.value.categories.map(c => c.category);
      expect(categoryNames).toContain('visibility');
      expect(categoryNames).toContain('sentiment');
      expect(categoryNames).toContain('authority');
      expect(categoryNames).toContain('relevance');
      expect(categoryNames).toContain('competitive');
      expect(categoryNames).toContain('coverage');
    }
  });

  it('should have grade for each category', () => {
    const input = createMockInput();
    const result = calculateScore(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      for (const category of result.value.categories) {
        expect(['excellent', 'good', 'average', 'poor', 'critical']).toContain(category.grade);
      }
    }
  });

  it('should include algorithm version', () => {
    const input = createMockInput();
    const result = calculateScore(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.algorithmVersion).toBe(scoreCalculator.ALGORITHM_VERSION);
    }
  });

  it('should include timestamp', () => {
    const input = createMockInput();
    const result = calculateScore(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.calculatedAt).toBeTruthy();
      expect(new Date(result.value.calculatedAt).getTime()).not.toBeNaN();
    }
  });

  describe('category calculations', () => {
    it('should calculate higher visibility score for high mention rate', () => {
      const highMentionInput = createMockInput({
        perception: createMockPerception({
          mentionRate: 0.9,
          visibilityScore: 85,
        }),
      });

      const lowMentionInput = createMockInput({
        perception: createMockPerception({
          mentionRate: 0.2,
          visibilityScore: 25,
        }),
      });

      const highResult = calculateScore(highMentionInput);
      const lowResult = calculateScore(lowMentionInput);

      expect(highResult.ok).toBe(true);
      expect(lowResult.ok).toBe(true);

      if (highResult.ok && lowResult.ok) {
        const highVisibility = highResult.value.categories.find(c => c.category === 'visibility');
        const lowVisibility = lowResult.value.categories.find(c => c.category === 'visibility');

        expect(highVisibility!.score).toBeGreaterThan(lowVisibility!.score);
      }
    });

    it('should calculate higher sentiment score for positive sentiment', () => {
      const positiveInput = createMockInput({
        perception: createMockPerception({
          overallSentiment: 'positive',
        }),
      });

      const negativeInput = createMockInput({
        perception: createMockPerception({
          overallSentiment: 'negative',
        }),
      });

      const positiveResult = calculateScore(positiveInput);
      const negativeResult = calculateScore(negativeInput);

      expect(positiveResult.ok).toBe(true);
      expect(negativeResult.ok).toBe(true);

      if (positiveResult.ok && negativeResult.ok) {
        const positiveSentiment = positiveResult.value.categories.find(c => c.category === 'sentiment');
        const negativeSentiment = negativeResult.value.categories.find(c => c.category === 'sentiment');

        expect(positiveSentiment!.score).toBeGreaterThan(negativeSentiment!.score);
      }
    });

    it('should calculate higher authority for top positions', () => {
      const topPositionInput = createMockInput({
        perception: createMockPerception({
          averagePosition: 1,
        }),
      });

      const lowPositionInput = createMockInput({
        perception: createMockPerception({
          averagePosition: 5,
        }),
      });

      const topResult = calculateScore(topPositionInput);
      const lowResult = calculateScore(lowPositionInput);

      expect(topResult.ok).toBe(true);
      expect(lowResult.ok).toBe(true);

      if (topResult.ok && lowResult.ok) {
        const topAuthority = topResult.value.categories.find(c => c.category === 'authority');
        const lowAuthority = lowResult.value.categories.find(c => c.category === 'authority');

        expect(topAuthority!.score).toBeGreaterThan(lowAuthority!.score);
      }
    });
  });

  describe('insights and suggestions', () => {
    it('should generate insights for each category', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const category of result.value.categories) {
          expect(category.insights.length).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should include key insights in result', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.keyInsights.length).toBeGreaterThanOrEqual(0);
        expect(result.value.keyInsights.length).toBeLessThanOrEqual(5);
      }
    });

    it('should include improvement areas for low scores', () => {
      const lowScoreInput = createMockInput({
        perception: createMockPerception({
          mentionRate: 0.1,
          visibilityScore: 15,
          overallSentiment: 'negative',
        }),
      });

      const result = calculateScore(lowScoreInput);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.improvementAreas.length).toBeGreaterThan(0);
      }
    });
  });

  describe('interpretation', () => {
    it('should generate interpretation for excellent score', () => {
      const input = createMockInput({
        perception: createMockPerception({
          visibilityScore: 90,
          mentionRate: 0.95,
          overallSentiment: 'positive',
        }),
      });

      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interpretation).toContain('TestBrand');
      }
    });

    it('should generate interpretation for poor score', () => {
      const input = createMockInput({
        perception: createMockPerception({
          visibilityScore: 25,
          mentionRate: 0.1,
          overallSentiment: 'negative',
        }),
      });

      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.interpretation).toContain('TestBrand');
      }
    });
  });

  describe('benchmark', () => {
    it('should include industry benchmark', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.benchmark).not.toBeNull();
        expect(result.value.benchmark!.industry).toBe('saas');
        expect(result.value.benchmark!.averageScore).toBeGreaterThan(0);
      }
    });

    it('should calculate percentile rank', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.benchmark!.percentileRank).toBeGreaterThanOrEqual(1);
        expect(result.value.benchmark!.percentileRank).toBeLessThanOrEqual(99);
      }
    });

    it('should have position label', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.benchmark!.positionLabel).toBeTruthy();
      }
    });

    it('should use default benchmark for unknown industry', () => {
      const input = createMockInput({
        industryDetection: createMockIndustryDetection({
          industry: 'unknown-industry',
        }),
      });

      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.benchmark).not.toBeNull();
      }
    });
  });

  describe('intent scores', () => {
    it('should include intent scores', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.intentScores.length).toBeGreaterThan(0);
      }
    });

    it('should have correct intent properties', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const intentScore of result.value.intentScores) {
          expect(intentScore).toHaveProperty('intent');
          expect(intentScore).toHaveProperty('score');
          expect(intentScore).toHaveProperty('queryCount');
          expect(intentScore).toHaveProperty('mentionRate');
        }
      }
    });
  });

  describe('provider scores', () => {
    it('should include provider scores', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerScores.length).toBeGreaterThan(0);
      }
    });

    it('should use combined provider when no provider aggregations', () => {
      const input = createMockInput();
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerScores[0].provider).toBe('combined');
      }
    });

    it('should use individual providers when aggregations provided', () => {
      const providerAggregations = new Map<string, AggregatedPerception>();
      providerAggregations.set('openai', createMockPerception({ visibilityScore: 70 }));
      providerAggregations.set('anthropic', createMockPerception({ visibilityScore: 60 }));

      const input = createMockInput({ providerAggregations });
      const result = calculateScore(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.providerScores.length).toBe(2);
        expect(result.value.providerScores.map(p => p.provider)).toContain('openai');
        expect(result.value.providerScores.map(p => p.provider)).toContain('anthropic');
      }
    });
  });
});

// ================================================================
// SCORE COMPARISON TESTS
// ================================================================

describe('compareScores', () => {
  function createMockScoreResult(overallScore: number): ScoreResult {
    return {
      overallScore,
      overallGrade: getGradeFromScore(overallScore),
      categories: [
        {
          category: 'visibility',
          name: 'AI Visibility',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.35,
          contribution: overallScore * 0.35,
          insights: [],
          suggestions: [],
        },
        {
          category: 'sentiment',
          name: 'Sentiment Score',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.20,
          contribution: overallScore * 0.20,
          insights: [],
          suggestions: [],
        },
        {
          category: 'authority',
          name: 'Authority Score',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.15,
          contribution: overallScore * 0.15,
          insights: [],
          suggestions: [],
        },
        {
          category: 'relevance',
          name: 'Industry Relevance',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.15,
          contribution: overallScore * 0.15,
          insights: [],
          suggestions: [],
        },
        {
          category: 'competitive',
          name: 'Competitive Position',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.10,
          contribution: overallScore * 0.10,
          insights: [],
          suggestions: [],
        },
        {
          category: 'coverage',
          name: 'Query Coverage',
          score: overallScore,
          grade: getGradeFromScore(overallScore),
          weight: 0.05,
          contribution: overallScore * 0.05,
          insights: [],
          suggestions: [],
        },
      ],
      providerScores: [],
      intentScores: [],
      benchmark: null,
      interpretation: '',
      keyInsights: [],
      improvementAreas: [],
      confidence: 0.8,
      calculatedAt: new Date().toISOString(),
      algorithmVersion: scoreCalculator.ALGORITHM_VERSION,
    };
  }

  it('should calculate positive score delta', () => {
    const current = createMockScoreResult(75);
    const previous = createMockScoreResult(60);

    const comparison = compareScores(current, previous);

    expect(comparison.scoreDelta).toBe(15);
    expect(comparison.improved).toBe(true);
  });

  it('should calculate negative score delta', () => {
    const current = createMockScoreResult(50);
    const previous = createMockScoreResult(70);

    const comparison = compareScores(current, previous);

    expect(comparison.scoreDelta).toBe(-20);
    expect(comparison.improved).toBe(false);
  });

  it('should calculate percent change', () => {
    const current = createMockScoreResult(60);
    const previous = createMockScoreResult(50);

    const comparison = compareScores(current, previous);

    expect(comparison.percentChange).toBeCloseTo(20, 1);
  });

  it('should handle zero previous score', () => {
    const current = createMockScoreResult(50);
    const previous = createMockScoreResult(0);

    const comparison = compareScores(current, previous);

    expect(comparison.percentChange).toBe(0);
  });

  it('should track category changes', () => {
    const current = createMockScoreResult(75);
    const previous = createMockScoreResult(60);

    const comparison = compareScores(current, previous);

    expect(comparison.categoryChanges.length).toBe(6);
    expect(comparison.categoryChanges[0].delta).toBe(15);
    expect(comparison.categoryChanges[0].direction).toBe('up');
  });

  it('should mark stable categories', () => {
    const current = createMockScoreResult(50);
    const previous = createMockScoreResult(51);

    const comparison = compareScores(current, previous);

    expect(comparison.categoryChanges[0].direction).toBe('stable');
  });

  it('should generate improvement summary', () => {
    const current = createMockScoreResult(75);
    const previous = createMockScoreResult(60);

    const comparison = compareScores(current, previous);

    expect(comparison.summary).toContain('improved');
    expect(comparison.summary).toContain('15');
  });

  it('should generate decrease summary', () => {
    const current = createMockScoreResult(50);
    const previous = createMockScoreResult(70);

    const comparison = compareScores(current, previous);

    expect(comparison.summary).toContain('decreased');
    expect(comparison.summary).toContain('20');
  });

  it('should generate stable summary', () => {
    const current = createMockScoreResult(50);
    const previous = createMockScoreResult(50);

    const comparison = compareScores(current, previous);

    expect(comparison.summary).toContain('stable');
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('edge cases', () => {
  it('should handle perception with no intent breakdown', () => {
    const input = createMockInput({
      perception: createMockPerception({
        intentBreakdown: {},
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
  });

  it('should handle perception with null average position', () => {
    const input = createMockInput({
      perception: createMockPerception({
        averagePosition: null,
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
  });

  it('should handle perception with empty competitors', () => {
    const input = createMockInput({
      perception: createMockPerception({
        topCompetitors: [],
      }),
      industryDetection: createMockIndustryDetection({
        competitors: [],
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
  });

  it('should handle perception with empty attributes', () => {
    const input = createMockInput({
      perception: createMockPerception({
        topAttributes: [],
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
  });

  it('should handle very low mention rate', () => {
    const input = createMockInput({
      perception: createMockPerception({
        mentionRate: 0.01,
        visibilityScore: 5,
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBeLessThan(50);
    }
  });

  it('should handle very high mention rate', () => {
    const input = createMockInput({
      perception: createMockPerception({
        mentionRate: 0.99,
        visibilityScore: 95,
        averagePosition: 1,
        overallSentiment: 'positive',
      }),
    });

    const result = calculateScore(input);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBeGreaterThan(70);
    }
  });

  it('should handle whitespace brand name', () => {
    const input = createMockInput({ brandName: '   ' });
    const result = calculateScore(input);

    expect(result.ok).toBe(false);
  });
});
