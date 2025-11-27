/**
 * Recommendations Engine Tests
 *
 * Phase 1, Week 1, Day 3
 */

import { describe, it, expect } from 'vitest';
import recommendationsEngine, {
  generateRecommendations,
  getRecommendationTemplate,
  getRecommendationCategories,
  filterByCategory,
  filterByPriority,
  RECOMMENDATION_TEMPLATES,
  type RecommendationsInput,
} from './index';
import type { ScoreResult, CategoryScore } from '../score-calculator';
import type { IndustryDetection } from '../ai/schemas';
import type { RecommendationCategory, RecommendationPriority } from '../ai/schemas';

// ================================================================
// TEST FIXTURES
// ================================================================

function createMockCategoryScore(
  category: string,
  score: number
): CategoryScore {
  const gradeMap: Record<string, string> = {
    excellent: 'excellent',
    good: 'good',
    average: 'average',
    poor: 'poor',
    critical: 'critical',
  };

  let grade: 'excellent' | 'good' | 'average' | 'poor' | 'critical' = 'average';
  if (score >= 80) grade = 'excellent';
  else if (score >= 60) grade = 'good';
  else if (score >= 40) grade = 'average';
  else if (score >= 20) grade = 'poor';
  else grade = 'critical';

  return {
    category: category as any,
    name: category.charAt(0).toUpperCase() + category.slice(1),
    score,
    grade,
    weight: 0.15,
    contribution: score * 0.15,
    insights: [`${category} insight`],
    suggestions: score < 60 ? [`Improve ${category}`] : [],
  };
}

function createMockScoreResult(overrides: Partial<ScoreResult> = {}): ScoreResult {
  const defaultCategories: CategoryScore[] = [
    createMockCategoryScore('visibility', 55),
    createMockCategoryScore('sentiment', 70),
    createMockCategoryScore('authority', 45),
    createMockCategoryScore('relevance', 60),
    createMockCategoryScore('competitive', 40),
    createMockCategoryScore('coverage', 65),
  ];

  return {
    overallScore: 55,
    overallGrade: 'average',
    categories: defaultCategories,
    providerScores: [
      {
        provider: 'combined',
        score: 55,
        queriesAnalyzed: 10,
        mentionRate: 0.5,
        averagePosition: 3,
      },
    ],
    intentScores: [],
    benchmark: {
      industry: 'saas',
      industryName: 'SaaS & Cloud Software',
      averageScore: 52,
      topPerformerScore: 85,
      bottomPerformerScore: 18,
      percentileRank: 55,
      positionLabel: 'Average',
    },
    interpretation: 'Average visibility',
    keyInsights: ['Some visibility', 'Good sentiment'],
    improvementAreas: ['Improve authority', 'Increase coverage'],
    confidence: 0.8,
    calculatedAt: new Date().toISOString(),
    algorithmVersion: '1.0.0',
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
    ...overrides,
  };
}

function createMockInput(overrides: Partial<RecommendationsInput> = {}): RecommendationsInput {
  return {
    brandName: 'TestBrand',
    brandUrl: 'https://testbrand.com',
    scoreResult: createMockScoreResult(),
    industryDetection: createMockIndustryDetection(),
    ...overrides,
  };
}

// ================================================================
// TEMPLATE TESTS
// ================================================================

describe('RECOMMENDATION_TEMPLATES', () => {
  it('should have multiple templates', () => {
    expect(RECOMMENDATION_TEMPLATES.length).toBeGreaterThan(10);
  });

  it('should have unique IDs', () => {
    const ids = RECOMMENDATION_TEMPLATES.map(t => t.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('should have required fields for each template', () => {
    for (const template of RECOMMENDATION_TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(template.title).toBeTruthy();
      expect(template.description).toBeTruthy();
      expect(template.rationale).toBeTruthy();
      expect(template.category).toBeTruthy();
      expect(template.basePriority).toBeTruthy();
      expect(template.baseImpact).toBeGreaterThan(0);
      expect(template.baseEffortHours).toBeGreaterThanOrEqual(0);
      expect(template.actionItems.length).toBeGreaterThan(0);
      expect(template.triggers.length).toBeGreaterThan(0);
    }
  });

  it('should cover all recommendation categories', () => {
    const categories = new Set(RECOMMENDATION_TEMPLATES.map(t => t.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
  });
});

// ================================================================
// CATEGORY TESTS
// ================================================================

describe('getRecommendationCategories', () => {
  it('should return all categories', () => {
    const categories = getRecommendationCategories();
    expect(categories).toContain('content');
    expect(categories).toContain('technical-seo');
    expect(categories).toContain('authority');
    expect(categories).toContain('entity-seo');
    expect(categories).toContain('citations');
    expect(categories).toContain('social-proof');
    expect(categories).toContain('structured-data');
    expect(categories).toContain('brand-mentions');
  });

  it('should return exactly 8 categories', () => {
    const categories = getRecommendationCategories();
    expect(categories.length).toBe(8);
  });
});

describe('getRecommendationTemplate', () => {
  it('should return template by ID', () => {
    const template = getRecommendationTemplate('content-thought-leadership');
    expect(template).toBeDefined();
    expect(template?.id).toBe('content-thought-leadership');
  });

  it('should return undefined for unknown ID', () => {
    const template = getRecommendationTemplate('unknown-id');
    expect(template).toBeUndefined();
  });
});

// ================================================================
// GENERATION TESTS
// ================================================================

describe('generateRecommendations', () => {
  it('should return Ok result with valid input', () => {
    const input = createMockInput();
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recommendations.length).toBeGreaterThan(0);
    }
  });

  it('should return error for empty brand name', () => {
    const input = createMockInput({ brandName: '' });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain('Brand name');
    }
  });

  it('should return error for null score result', () => {
    const input = createMockInput({ scoreResult: undefined as any });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(false);
  });

  it('should respect maxRecommendations limit', () => {
    const input = createMockInput({ maxRecommendations: 5 });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.recommendations.length).toBeLessThanOrEqual(5);
    }
  });

  describe('result structure', () => {
    it('should include all required fields', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toHaveProperty('recommendations');
        expect(result.value).toHaveProperty('quickWins');
        expect(result.value).toHaveProperty('summary');
        expect(result.value).toHaveProperty('currentScore');
        expect(result.value).toHaveProperty('projectedScore');
        expect(result.value).toHaveProperty('strengths');
        expect(result.value).toHaveProperty('weaknesses');
        expect(result.value).toHaveProperty('totalEstimatedEffort');
        expect(result.value).toHaveProperty('byCategory');
        expect(result.value).toHaveProperty('generatedAt');
      }
    });

    it('should include current score from input', () => {
      const input = createMockInput({
        scoreResult: createMockScoreResult({ overallScore: 65 }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.currentScore).toBe(65);
      }
    });

    it('should calculate projected score higher than current', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.projectedScore).toBeGreaterThan(result.value.currentScore);
        expect(result.value.projectedScore).toBeLessThanOrEqual(100);
      }
    });

    it('should include timestamp', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.generatedAt).toBeTruthy();
        expect(new Date(result.value.generatedAt).getTime()).not.toBeNaN();
      }
    });
  });

  describe('recommendation structure', () => {
    it('should have valid recommendation structure', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const rec of result.value.recommendations) {
          expect(rec.id).toBeTruthy();
          expect(rec.title).toBeTruthy();
          expect(rec.description).toBeTruthy();
          expect(rec.rationale).toBeTruthy();
          expect(rec.priority).toBeTruthy();
          expect(rec.category).toBeTruthy();
          expect(rec.estimatedImpact).toBeGreaterThan(0);
          expect(rec.actionItems.length).toBeGreaterThan(0);
        }
      }
    });

    it('should sort recommendations by priority', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const priorityOrder = ['critical', 'high', 'medium', 'low'];
        let lastPriorityIndex = 0;

        for (const rec of result.value.recommendations) {
          const currentIndex = priorityOrder.indexOf(rec.priority);
          expect(currentIndex).toBeGreaterThanOrEqual(lastPriorityIndex);
          lastPriorityIndex = currentIndex;
        }
      }
    });
  });

  describe('quick wins', () => {
    it('should identify quick wins', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.quickWins.length).toBeLessThanOrEqual(3);
      }
    });

    it('should have quick wins with high impact and low effort', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const quickWin of result.value.quickWins) {
          expect(quickWin.estimatedImpact).toBeGreaterThanOrEqual(15);
          expect(quickWin.estimatedEffortHours).toBeLessThanOrEqual(20);
        }
      }
    });
  });

  describe('category grouping', () => {
    it('should group recommendations by category', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const totalInCategories = Object.values(result.value.byCategory)
          .reduce((sum, recs) => sum + recs.length, 0);
        expect(totalInCategories).toBe(result.value.recommendations.length);
      }
    });
  });

  describe('strengths and weaknesses', () => {
    it('should extract strengths from high scoring categories', () => {
      const input = createMockInput({
        scoreResult: createMockScoreResult({
          categories: [
            createMockCategoryScore('visibility', 85),
            createMockCategoryScore('sentiment', 80),
            createMockCategoryScore('authority', 30),
            createMockCategoryScore('relevance', 75),
            createMockCategoryScore('competitive', 25),
            createMockCategoryScore('coverage', 70),
          ],
        }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.strengths.length).toBeGreaterThan(0);
      }
    });

    it('should extract weaknesses from low scoring categories', () => {
      const input = createMockInput({
        scoreResult: createMockScoreResult({
          categories: [
            createMockCategoryScore('visibility', 85),
            createMockCategoryScore('sentiment', 80),
            createMockCategoryScore('authority', 15),
            createMockCategoryScore('relevance', 75),
            createMockCategoryScore('competitive', 20),
            createMockCategoryScore('coverage', 70),
          ],
        }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.weaknesses.length).toBeGreaterThan(0);
      }
    });
  });

  describe('summary generation', () => {
    it('should generate summary for excellent score', () => {
      const input = createMockInput({
        scoreResult: createMockScoreResult({ overallScore: 85, overallGrade: 'excellent' }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary).toContain('TestBrand');
        expect(result.value.summary).toContain('excellent');
      }
    });

    it('should generate summary for poor score', () => {
      const input = createMockInput({
        scoreResult: createMockScoreResult({ overallScore: 25, overallGrade: 'poor' }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.summary).toContain('TestBrand');
      }
    });
  });

  describe('industry-specific behavior', () => {
    it('should adjust recommendations for SaaS industry', () => {
      const input = createMockInput({
        industryDetection: createMockIndustryDetection({ industry: 'saas' }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
    });

    it('should adjust recommendations for Fintech industry', () => {
      const input = createMockInput({
        industryDetection: createMockIndustryDetection({ industry: 'fintech' }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
    });

    it('should handle unknown industry', () => {
      const input = createMockInput({
        industryDetection: createMockIndustryDetection({ industry: 'unknown' }),
      });
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
    });
  });

  describe('effort estimates', () => {
    it('should include effort estimates by default', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        for (const rec of result.value.recommendations) {
          expect(rec.estimatedEffortHours).toBeGreaterThan(0);
        }
      }
    });

    it('should calculate total estimated effort', () => {
      const input = createMockInput();
      const result = generateRecommendations(input);

      expect(result.ok).toBe(true);
      if (result.ok) {
        const manualTotal = result.value.recommendations.reduce(
          (sum, r) => sum + r.estimatedEffortHours, 0
        );
        expect(result.value.totalEstimatedEffort).toBe(manualTotal);
      }
    });
  });
});

// ================================================================
// FILTER TESTS
// ================================================================

describe('filterByCategory', () => {
  it('should filter recommendations by category', () => {
    const input = createMockInput();
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const contentRecs = filterByCategory(result.value.recommendations, 'content');
      for (const rec of contentRecs) {
        expect(rec.category).toBe('content');
      }
    }
  });

  it('should return empty array if no matches', () => {
    const recommendations = [
      { category: 'content' as RecommendationCategory },
    ] as any[];

    const filtered = filterByCategory(recommendations, 'authority');
    expect(filtered.length).toBe(0);
  });
});

describe('filterByPriority', () => {
  it('should filter recommendations by minimum priority', () => {
    const input = createMockInput();
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const highPriorityRecs = filterByPriority(result.value.recommendations, 'high');
      for (const rec of highPriorityRecs) {
        expect(['critical', 'high']).toContain(rec.priority);
      }
    }
  });

  it('should include all priorities when filtering by low', () => {
    const input = createMockInput();
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const allRecs = filterByPriority(result.value.recommendations, 'low');
      expect(allRecs.length).toBe(result.value.recommendations.length);
    }
  });

  it('should filter only critical when filtering by critical', () => {
    const recommendations = [
      { priority: 'critical' as RecommendationPriority },
      { priority: 'high' as RecommendationPriority },
      { priority: 'medium' as RecommendationPriority },
    ] as any[];

    const filtered = filterByPriority(recommendations, 'critical');
    expect(filtered.length).toBe(1);
    expect(filtered[0].priority).toBe('critical');
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('edge cases', () => {
  it('should handle very low score', () => {
    const input = createMockInput({
      scoreResult: createMockScoreResult({
        overallScore: 10,
        overallGrade: 'critical',
        categories: [
          createMockCategoryScore('visibility', 10),
          createMockCategoryScore('sentiment', 15),
          createMockCategoryScore('authority', 5),
          createMockCategoryScore('relevance', 12),
          createMockCategoryScore('competitive', 8),
          createMockCategoryScore('coverage', 10),
        ],
      }),
    });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Should have many recommendations for low score
      expect(result.value.recommendations.length).toBeGreaterThan(0);
      // Projected score should be significantly higher
      expect(result.value.projectedScore).toBeGreaterThan(input.scoreResult.overallScore);
    }
  });

  it('should handle very high score', () => {
    const input = createMockInput({
      scoreResult: createMockScoreResult({
        overallScore: 95,
        overallGrade: 'excellent',
        categories: [
          createMockCategoryScore('visibility', 95),
          createMockCategoryScore('sentiment', 92),
          createMockCategoryScore('authority', 88),
          createMockCategoryScore('relevance', 90),
          createMockCategoryScore('competitive', 85),
          createMockCategoryScore('coverage', 90),
        ],
      }),
    });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
    if (result.ok) {
      // May have fewer recommendations for high score
      expect(result.value.projectedScore).toBeLessThanOrEqual(100);
    }
  });

  it('should handle empty categories', () => {
    const input = createMockInput({
      scoreResult: createMockScoreResult({
        categories: [],
      }),
    });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
  });

  it('should handle whitespace brand name', () => {
    const input = createMockInput({ brandName: '   ' });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(false);
  });

  it('should handle empty provider scores', () => {
    const input = createMockInput({
      scoreResult: createMockScoreResult({
        providerScores: [],
      }),
    });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
  });

  it('should handle zero mention rate', () => {
    const input = createMockInput({
      scoreResult: createMockScoreResult({
        providerScores: [{
          provider: 'combined',
          score: 20,
          queriesAnalyzed: 10,
          mentionRate: 0,
          averagePosition: null,
        }],
      }),
    });
    const result = generateRecommendations(input);

    expect(result.ok).toBe(true);
  });
});
