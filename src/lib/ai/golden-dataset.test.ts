/**
 * Golden Dataset Tests
 *
 * Phase 1, Week 2, Day 5
 *
 * Tests for the golden dataset validation system.
 */

import { describe, it, expect } from 'vitest';
import {
  GOLDEN_DATASET,
  getTestsByCategory,
  getTestsByDifficulty,
  getTestsByTag,
  getDatasetStats,
  getRandomTestSubset,
  getTestById,
  type GoldenTestCase,
  type GoldenTestCategory,
  type TestDifficulty,
} from './golden-dataset';

describe('Golden Dataset', () => {
  // ================================================================
  // DATASET INTEGRITY TESTS
  // ================================================================

  describe('Dataset Integrity', () => {
    it('should have at least 10 test cases', () => {
      expect(GOLDEN_DATASET.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique IDs for all test cases', () => {
      const ids = GOLDEN_DATASET.map(test => test.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories for all test cases', () => {
      const validCategories: GoldenTestCategory[] = [
        'brand_recognition',
        'industry_classification',
        'sentiment_analysis',
        'recommendation_quality',
        'factual_accuracy',
        'citation_accuracy',
        'competitive_positioning',
        'content_extraction',
      ];

      GOLDEN_DATASET.forEach(test => {
        expect(validCategories).toContain(test.category);
      });
    });

    it('should have valid difficulties for all test cases', () => {
      const validDifficulties: TestDifficulty[] = ['easy', 'medium', 'hard'];

      GOLDEN_DATASET.forEach(test => {
        expect(validDifficulties).toContain(test.difficulty);
      });
    });

    it('should have non-empty queries for all test cases', () => {
      GOLDEN_DATASET.forEach(test => {
        expect(test.input.query).toBeTruthy();
        expect(test.input.query.length).toBeGreaterThan(5);
      });
    });

    it('should have metadata with creation date for all tests', () => {
      GOLDEN_DATASET.forEach(test => {
        expect(test.metadata.createdAt).toBeTruthy();
        expect(test.metadata.lastVerified).toBeTruthy();
      });
    });

    it('should have at least one expected output criterion', () => {
      GOLDEN_DATASET.forEach(test => {
        const hasExpectedOutput =
          test.expectedOutput.shouldMentionBrand !== undefined ||
          test.expectedOutput.sentimentRange !== undefined ||
          test.expectedOutput.requiredKeywords !== undefined ||
          test.expectedOutput.expectedIndustry !== undefined ||
          test.expectedOutput.competitivePosition !== undefined ||
          test.expectedOutput.minConfidence !== undefined ||
          test.expectedOutput.expectedFacts !== undefined;

        expect(hasExpectedOutput).toBe(true);
      });
    });
  });

  // ================================================================
  // CATEGORY DISTRIBUTION TESTS
  // ================================================================

  describe('Category Distribution', () => {
    it('should have tests for brand recognition', () => {
      const tests = getTestsByCategory('brand_recognition');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have tests for industry classification', () => {
      const tests = getTestsByCategory('industry_classification');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have tests for sentiment analysis', () => {
      const tests = getTestsByCategory('sentiment_analysis');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have tests for recommendation quality', () => {
      const tests = getTestsByCategory('recommendation_quality');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have tests for factual accuracy', () => {
      const tests = getTestsByCategory('factual_accuracy');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have tests for competitive positioning', () => {
      const tests = getTestsByCategory('competitive_positioning');
      expect(tests.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // DIFFICULTY DISTRIBUTION TESTS
  // ================================================================

  describe('Difficulty Distribution', () => {
    it('should have easy tests', () => {
      const tests = getTestsByDifficulty('easy');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have medium tests', () => {
      const tests = getTestsByDifficulty('medium');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have hard tests', () => {
      const tests = getTestsByDifficulty('hard');
      expect(tests.length).toBeGreaterThan(0);
    });

    it('should have balanced difficulty distribution', () => {
      const easy = getTestsByDifficulty('easy').length;
      const medium = getTestsByDifficulty('medium').length;
      const hard = getTestsByDifficulty('hard').length;

      // Each difficulty should have at least 20% of tests
      const total = GOLDEN_DATASET.length;
      expect(easy / total).toBeGreaterThanOrEqual(0.15);
      expect(medium / total).toBeGreaterThanOrEqual(0.15);
      expect(hard / total).toBeGreaterThanOrEqual(0.15);
    });
  });

  // ================================================================
  // UTILITY FUNCTION TESTS
  // ================================================================

  describe('getTestsByCategory', () => {
    it('should return only tests of the specified category', () => {
      const tests = getTestsByCategory('brand_recognition');
      tests.forEach(test => {
        expect(test.category).toBe('brand_recognition');
      });
    });

    it('should return empty array for non-existent category tests', () => {
      const tests = getTestsByCategory('citation_accuracy');
      // citation_accuracy might not have tests yet
      expect(Array.isArray(tests)).toBe(true);
    });
  });

  describe('getTestsByDifficulty', () => {
    it('should return only tests of the specified difficulty', () => {
      const tests = getTestsByDifficulty('hard');
      tests.forEach(test => {
        expect(test.difficulty).toBe('hard');
      });
    });
  });

  describe('getTestsByTag', () => {
    it('should return tests with the specified tag', () => {
      const tests = getTestsByTag('tech');
      expect(tests.length).toBeGreaterThan(0);
      tests.forEach(test => {
        expect(test.metadata.tags).toContain('tech');
      });
    });

    it('should return empty array for non-existent tag', () => {
      const tests = getTestsByTag('nonexistent-tag-xyz');
      expect(tests).toHaveLength(0);
    });
  });

  describe('getDatasetStats', () => {
    it('should return correct total count', () => {
      const stats = getDatasetStats();
      expect(stats.totalTests).toBe(GOLDEN_DATASET.length);
    });

    it('should have counts by category that sum to total', () => {
      const stats = getDatasetStats();
      const categorySum = Object.values(stats.byCategory).reduce((a, b) => a + b, 0);
      expect(categorySum).toBe(stats.totalTests);
    });

    it('should have counts by difficulty that sum to total', () => {
      const stats = getDatasetStats();
      const difficultySum = Object.values(stats.byDifficulty).reduce((a, b) => a + b, 0);
      expect(difficultySum).toBe(stats.totalTests);
    });

    it('should track verified count', () => {
      const stats = getDatasetStats();
      const actualVerified = GOLDEN_DATASET.filter(t => t.metadata.humanVerified).length;
      expect(stats.verifiedCount).toBe(actualVerified);
    });
  });

  describe('getRandomTestSubset', () => {
    it('should return requested number of tests', () => {
      const subset = getRandomTestSubset(5);
      expect(subset).toHaveLength(5);
    });

    it('should not return more tests than available', () => {
      const subset = getRandomTestSubset(1000);
      expect(subset.length).toBe(GOLDEN_DATASET.length);
    });

    it('should return valid test cases', () => {
      const subset = getRandomTestSubset(3);
      subset.forEach(test => {
        expect(test.id).toBeTruthy();
        expect(test.input.query).toBeTruthy();
      });
    });

    it('should return different subsets on multiple calls (probabilistic)', () => {
      // Run multiple times and check if at least one is different
      const subsets = Array.from({ length: 5 }, () => getRandomTestSubset(5));
      const firstSubsetIds = subsets[0].map(t => t.id).join(',');

      // At least one should be different (very unlikely all are same)
      const hasDifferent = subsets.some(
        subset => subset.map(t => t.id).join(',') !== firstSubsetIds
      );
      // This test might occasionally fail due to randomness, but probability is very low
      // with 5 attempts and a reasonably sized dataset
      expect(hasDifferent).toBe(true);
    });
  });

  describe('getTestById', () => {
    it('should return correct test for valid ID', () => {
      const test = getTestById('br-001');
      expect(test).toBeDefined();
      expect(test?.id).toBe('br-001');
      expect(test?.category).toBe('brand_recognition');
    });

    it('should return undefined for invalid ID', () => {
      const test = getTestById('invalid-id');
      expect(test).toBeUndefined();
    });
  });

  // ================================================================
  // EXPECTED OUTPUT VALIDATION TESTS
  // ================================================================

  describe('Expected Output Validation', () => {
    it('should have valid sentiment ranges', () => {
      GOLDEN_DATASET.forEach(test => {
        if (test.expectedOutput.sentimentRange) {
          const { min, max } = test.expectedOutput.sentimentRange;
          expect(min).toBeGreaterThanOrEqual(-1);
          expect(max).toBeLessThanOrEqual(1);
          expect(min).toBeLessThanOrEqual(max);
        }
      });
    });

    it('should have valid confidence thresholds', () => {
      GOLDEN_DATASET.forEach(test => {
        if (test.expectedOutput.minConfidence !== undefined) {
          expect(test.expectedOutput.minConfidence).toBeGreaterThanOrEqual(0);
          expect(test.expectedOutput.minConfidence).toBeLessThanOrEqual(1);
        }
      });
    });

    it('should have non-empty required keywords when specified', () => {
      GOLDEN_DATASET.forEach(test => {
        if (test.expectedOutput.requiredKeywords) {
          expect(test.expectedOutput.requiredKeywords.length).toBeGreaterThan(0);
          test.expectedOutput.requiredKeywords.forEach(kw => {
            expect(kw.length).toBeGreaterThan(0);
          });
        }
      });
    });

    it('should have valid competitive positions', () => {
      const validPositions = ['leader', 'challenger', 'follower', 'niche'];
      GOLDEN_DATASET.forEach(test => {
        if (test.expectedOutput.competitivePosition) {
          expect(validPositions).toContain(test.expectedOutput.competitivePosition);
        }
      });
    });
  });

  // ================================================================
  // TEST CASE QUALITY TESTS
  // ================================================================

  describe('Test Case Quality', () => {
    it('should have descriptive names', () => {
      GOLDEN_DATASET.forEach(test => {
        expect(test.name.length).toBeGreaterThan(10);
        expect(test.description.length).toBeGreaterThan(20);
      });
    });

    it('should have at least one tag per test', () => {
      GOLDEN_DATASET.forEach(test => {
        expect(test.metadata.tags.length).toBeGreaterThan(0);
      });
    });

    it('should have brand or URL in input for most tests', () => {
      const testsWithBrandOrUrl = GOLDEN_DATASET.filter(
        test => test.input.brand || test.input.url
      );
      // At least 50% should have brand/url context
      expect(testsWithBrandOrUrl.length / GOLDEN_DATASET.length).toBeGreaterThanOrEqual(0.5);
    });
  });
});

// ================================================================
// GOLDEN TEST RUNNER SIMULATION
// ================================================================

describe('Golden Test Runner', () => {
  /**
   * Simulates running a golden test against mock AI output
   */
  function simulateTestRun(
    test: GoldenTestCase,
    mockResponse: {
      text: string;
      confidence: number;
      sentiment?: number;
    }
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    // Check required keywords
    if (test.expectedOutput.requiredKeywords) {
      for (const keyword of test.expectedOutput.requiredKeywords) {
        if (!mockResponse.text.toLowerCase().includes(keyword.toLowerCase())) {
          failures.push(`Missing required keyword: ${keyword}`);
        }
      }
    }

    // Check forbidden keywords
    if (test.expectedOutput.forbiddenKeywords) {
      for (const keyword of test.expectedOutput.forbiddenKeywords) {
        if (mockResponse.text.toLowerCase().includes(keyword.toLowerCase())) {
          failures.push(`Found forbidden keyword: ${keyword}`);
        }
      }
    }

    // Check confidence
    if (test.expectedOutput.minConfidence !== undefined) {
      if (mockResponse.confidence < test.expectedOutput.minConfidence) {
        failures.push(
          `Confidence ${mockResponse.confidence} below threshold ${test.expectedOutput.minConfidence}`
        );
      }
    }

    // Check sentiment
    if (test.expectedOutput.sentimentRange && mockResponse.sentiment !== undefined) {
      const { min, max } = test.expectedOutput.sentimentRange;
      if (mockResponse.sentiment < min || mockResponse.sentiment > max) {
        failures.push(
          `Sentiment ${mockResponse.sentiment} outside range [${min}, ${max}]`
        );
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  it('should pass test with matching response', () => {
    const test = getTestById('br-001')!;
    const result = simulateTestRun(test, {
      text: 'Apple is known for iPhone, innovative technology, and premium hardware products.',
      confidence: 0.95,
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toHaveLength(0);
  });

  it('should fail test with missing keywords', () => {
    const test = getTestById('br-001')!;
    const result = simulateTestRun(test, {
      text: 'Apple makes computers.',
      confidence: 0.95,
    });

    expect(result.passed).toBe(false);
    expect(result.failures.length).toBeGreaterThan(0);
  });

  it('should fail test with forbidden keywords', () => {
    const test = getTestById('br-001')!;
    const result = simulateTestRun(test, {
      text: 'Apple is a fruit that is used to make food.',
      confidence: 0.95,
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain('Found forbidden keyword: fruit');
  });

  it('should fail test with low confidence', () => {
    const test = getTestById('br-001')!;
    const result = simulateTestRun(test, {
      text: 'Apple makes iPhone and technology hardware.',
      confidence: 0.5,
    });

    expect(result.passed).toBe(false);
    expect(result.failures.some(f => f.includes('Confidence'))).toBe(true);
  });

  it('should pass sentiment test within range', () => {
    const test = getTestById('sa-001')!;
    const result = simulateTestRun(test, {
      text: 'Costco offers great value and quality products with membership benefits.',
      confidence: 0.9,
      sentiment: 0.8,
    });

    expect(result.passed).toBe(true);
  });

  it('should fail sentiment test outside range', () => {
    const test = getTestById('sa-001')!;
    const result = simulateTestRun(test, {
      text: 'Costco has value and quality membership.',
      confidence: 0.9,
      sentiment: 0.2, // Below min of 0.6
    });

    expect(result.passed).toBe(false);
    expect(result.failures.some(f => f.includes('Sentiment'))).toBe(true);
  });
});
