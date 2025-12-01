/**
 * ABSA (Aspect-Based Sentiment Analysis) Tests
 *
 * Phase 3, Week 10 - NLP Backlog
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeABSA,
  detectAspects,
  extractAspectsFromKeyphrases,
  detectOpinions,
  linkAspectsWithOpinions,
  normalizeAspect,
  getAspectCategory,
  getAspectsByPolarity,
  getAspectsByCategory,
  getMostPositiveAspects,
  getMostNegativeAspects,
  generateABSASummary,
  compareABSA,
  ASPECT_LEXICON,
  POSITIVE_OPINIONS,
  NEGATIVE_OPINIONS,
  INTENSIFIERS,
} from './absa';
import type {
  Aspect,
  AspectCategory,
  OpinionExpression,
  AspectSentiment,
  ABSAResult,
} from './absa';

// ================================================================
// LEXICON TESTS
// ================================================================

describe('ABSA Lexicons', () => {
  describe('ASPECT_LEXICON', () => {
    it('should have all required categories', () => {
      const expectedCategories: AspectCategory[] = [
        'quality',
        'price',
        'service',
        'usability',
        'performance',
        'reliability',
        'design',
        'features',
        'support',
        'value',
        'general',
      ];

      for (const category of expectedCategories) {
        expect(ASPECT_LEXICON[category]).toBeDefined();
        expect(ASPECT_LEXICON[category].length).toBeGreaterThan(0);
      }
    });

    it('should have lowercase terms', () => {
      for (const terms of Object.values(ASPECT_LEXICON)) {
        for (const term of terms) {
          expect(term).toBe(term.toLowerCase());
        }
      }
    });
  });

  describe('POSITIVE_OPINIONS', () => {
    it('should have intensity values between 0 and 1', () => {
      for (const intensity of Object.values(POSITIVE_OPINIONS)) {
        expect(intensity).toBeGreaterThanOrEqual(0);
        expect(intensity).toBeLessThanOrEqual(1);
      }
    });

    it('should contain common positive terms', () => {
      expect(POSITIVE_OPINIONS['excellent']).toBeDefined();
      expect(POSITIVE_OPINIONS['good']).toBeDefined();
      expect(POSITIVE_OPINIONS['great']).toBeDefined();
      expect(POSITIVE_OPINIONS['love']).toBeDefined();
    });
  });

  describe('NEGATIVE_OPINIONS', () => {
    it('should have intensity values between 0 and 1', () => {
      for (const intensity of Object.values(NEGATIVE_OPINIONS)) {
        expect(intensity).toBeGreaterThanOrEqual(0);
        expect(intensity).toBeLessThanOrEqual(1);
      }
    });

    it('should contain common negative terms', () => {
      expect(NEGATIVE_OPINIONS['terrible']).toBeDefined();
      expect(NEGATIVE_OPINIONS['bad']).toBeDefined();
      expect(NEGATIVE_OPINIONS['poor']).toBeDefined();
      expect(NEGATIVE_OPINIONS['hate']).toBeDefined();
    });
  });

  describe('INTENSIFIERS', () => {
    it('should have various modifier values', () => {
      // Positive intensifiers
      expect(INTENSIFIERS['very']).toBeGreaterThan(1);
      expect(INTENSIFIERS['extremely']).toBeGreaterThan(1);

      // Diminishers
      expect(INTENSIFIERS['somewhat']).toBeLessThan(1);
      expect(INTENSIFIERS['slightly']).toBeLessThan(1);

      // Negators
      expect(INTENSIFIERS['not']).toBe(-1);
      expect(INTENSIFIERS['never']).toBe(-1);
    });
  });
});

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('Utility Functions', () => {
  describe('normalizeAspect', () => {
    it('should lowercase and trim', () => {
      expect(normalizeAspect('Quality')).toBe('quality');
      expect(normalizeAspect('  Price  ')).toBe('price');
      expect(normalizeAspect('USER EXPERIENCE')).toBe('user experience');
    });
  });

  describe('getAspectCategory', () => {
    it('should return correct category for exact matches', () => {
      expect(getAspectCategory('quality')).toBe('quality');
      expect(getAspectCategory('price')).toBe('price');
      expect(getAspectCategory('speed')).toBe('performance');
      expect(getAspectCategory('interface')).toBe('usability');
    });

    it('should return general for unknown terms', () => {
      expect(getAspectCategory('xyz123')).toBe('general');
      expect(getAspectCategory('unknown term')).toBe('general');
    });

    it('should handle partial matches', () => {
      expect(getAspectCategory('pricing model')).toBe('price');
      expect(getAspectCategory('build quality')).toBe('quality');
    });
  });
});

// ================================================================
// ASPECT DETECTION TESTS
// ================================================================

describe('Aspect Detection', () => {
  describe('detectAspects', () => {
    it('should detect single aspect', () => {
      const aspects = detectAspects('The quality is excellent.');
      expect(aspects.length).toBeGreaterThanOrEqual(1);

      const qualityAspect = aspects.find((a) => a.normalized === 'quality');
      expect(qualityAspect).toBeDefined();
      expect(qualityAspect!.category).toBe('quality');
    });

    it('should detect multiple aspects', () => {
      const text = 'The price is good and the service is excellent.';
      const aspects = detectAspects(text);

      const priceAspect = aspects.find((a) => a.normalized === 'price');
      const serviceAspect = aspects.find((a) => a.normalized === 'service');

      expect(priceAspect).toBeDefined();
      expect(serviceAspect).toBeDefined();
    });

    it('should include sentence information', () => {
      const text = 'The performance is great. The design is modern.';
      const aspects = detectAspects(text);

      const perfAspect = aspects.find((a) => a.normalized === 'performance');
      expect(perfAspect).toBeDefined();
      expect(perfAspect!.sentenceIndex).toBe(0);

      const designAspect = aspects.find((a) => a.normalized === 'design');
      expect(designAspect).toBeDefined();
      expect(designAspect!.sentenceIndex).toBe(1);
    });

    it('should handle empty text', () => {
      const aspects = detectAspects('');
      expect(aspects).toEqual([]);
    });

    it('should detect aspects in different categories', () => {
      const text = 'The speed is fast and reliability is crucial.';
      const aspects = detectAspects(text);

      const speedAspect = aspects.find((a) => a.normalized === 'speed' || a.normalized === 'fast');
      const reliabilityAspect = aspects.find((a) => a.normalized === 'reliability');

      expect(speedAspect).toBeDefined();
      expect(reliabilityAspect).toBeDefined();
    });
  });

  describe('extractAspectsFromKeyphrases', () => {
    it('should extract aspects from longer text', () => {
      const text =
        'The user interface is intuitive. The customer service team was helpful. Overall product quality exceeds expectations.';
      const aspects = extractAspectsFromKeyphrases(text);

      expect(aspects.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// OPINION DETECTION TESTS
// ================================================================

describe('Opinion Detection', () => {
  describe('detectOpinions', () => {
    it('should detect positive opinions', () => {
      const opinions = detectOpinions('The product is excellent and amazing.');

      expect(opinions.length).toBeGreaterThanOrEqual(2);
      expect(opinions.some((o) => o.term === 'excellent')).toBe(true);
      expect(opinions.some((o) => o.term === 'amazing')).toBe(true);
      expect(opinions.every((o) => o.polarity === 'positive')).toBe(true);
    });

    it('should detect negative opinions', () => {
      const opinions = detectOpinions('The service was terrible and disappointing.');

      expect(opinions.length).toBeGreaterThanOrEqual(2);
      expect(opinions.some((o) => o.term === 'terrible')).toBe(true);
      expect(opinions.some((o) => o.term === 'disappointing')).toBe(true);
      expect(opinions.every((o) => o.polarity === 'negative')).toBe(true);
    });

    it('should detect mixed opinions', () => {
      const opinions = detectOpinions('The quality is good but the price is terrible.');

      const goodOpinion = opinions.find((o) => o.term === 'good');
      const terribleOpinion = opinions.find((o) => o.term === 'terrible');

      expect(goodOpinion).toBeDefined();
      expect(goodOpinion!.polarity).toBe('positive');
      expect(terribleOpinion).toBeDefined();
      expect(terribleOpinion!.polarity).toBe('negative');
    });

    it('should handle negation', () => {
      const opinions = detectOpinions('The product is not good.');

      const goodOpinion = opinions.find((o) => o.term === 'good');
      expect(goodOpinion).toBeDefined();
      expect(goodOpinion!.polarity).toBe('negative'); // Negated positive = negative
    });

    it('should handle intensifiers', () => {
      const regularOpinions = detectOpinions('The product is good.');
      const intensifiedOpinions = detectOpinions('The product is very good.');

      const regularGood = regularOpinions.find((o) => o.term === 'good');
      const intensifiedGood = intensifiedOpinions.find((o) => o.term === 'good');

      expect(regularGood).toBeDefined();
      expect(intensifiedGood).toBeDefined();
      expect(intensifiedGood!.intensity).toBeGreaterThan(regularGood!.intensity);
    });

    it('should return empty for neutral text', () => {
      const opinions = detectOpinions('The product exists.');
      expect(opinions).toEqual([]);
    });
  });
});

// ================================================================
// ASPECT-SENTIMENT LINKING TESTS
// ================================================================

describe('Aspect-Sentiment Linking', () => {
  describe('linkAspectsWithOpinions', () => {
    it('should link aspect with opinion in same sentence', () => {
      const text = 'The quality is excellent.';
      const aspects = detectAspects(text);
      const linkedAspects = linkAspectsWithOpinions(aspects, text);

      const qualityLink = linkedAspects.find((as) => as.aspect.normalized === 'quality');
      expect(qualityLink).toBeDefined();
      expect(qualityLink!.sentiment.polarity).toBe('positive');
      expect(qualityLink!.opinions.length).toBeGreaterThan(0);
    });

    it('should handle multiple aspects with different sentiments', () => {
      const text = 'The quality is excellent but the price is terrible.';
      const aspects = detectAspects(text);
      const linkedAspects = linkAspectsWithOpinions(aspects, text);

      const qualityLink = linkedAspects.find((as) => as.aspect.normalized === 'quality');
      const priceLink = linkedAspects.find((as) => as.aspect.normalized === 'price');

      expect(qualityLink).toBeDefined();
      expect(priceLink).toBeDefined();
      expect(qualityLink!.sentiment.score).toBeGreaterThan(0);
      expect(priceLink!.sentiment.score).toBeLessThan(0);
    });

    it('should calculate confidence based on opinion count', () => {
      const text = 'The service is excellent, amazing, and wonderful.';
      const aspects = detectAspects(text);
      const linkedAspects = linkAspectsWithOpinions(aspects, text);

      const serviceLink = linkedAspects.find((as) => as.aspect.normalized === 'service');
      expect(serviceLink).toBeDefined();
      expect(serviceLink!.sentiment.confidence).toBeGreaterThan(0.3);
    });
  });
});

// ================================================================
// MAIN ANALYSIS TESTS
// ================================================================

describe('analyzeABSA', () => {
  it('should perform comprehensive analysis', () => {
    const text =
      'The product quality is excellent. The price is reasonable. However, customer service was disappointing.';
    const result = analyzeABSA(text);

    expect(result.aspects.length).toBeGreaterThan(0);
    expect(result.aspectSentiments.length).toBeGreaterThan(0);
    expect(result.categorySentiments).toBeDefined();
    expect(result.overallSentiment).toBeDefined();
    expect(result.stats).toBeDefined();
  });

  it('should calculate stats correctly', () => {
    const text = 'The quality is excellent. The design is beautiful. The price is terrible.';
    const result = analyzeABSA(text);

    expect(result.stats.totalAspects).toBeGreaterThanOrEqual(3);
    expect(result.stats.positiveAspects).toBeGreaterThanOrEqual(2);
    expect(result.stats.negativeAspects).toBeGreaterThanOrEqual(1);
  });

  it('should aggregate category sentiments', () => {
    const text = 'The build quality is excellent. The material quality is great.';
    const result = analyzeABSA(text);

    expect(result.categorySentiments.quality).toBeDefined();
    expect(result.categorySentiments.quality.aspectCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle text with no aspects', () => {
    const text = 'The weather is nice today.';
    const result = analyzeABSA(text);

    // May detect some aspects from keyphrases, but should have neutral sentiment
    expect(result.overallSentiment).toBeDefined();
  });
});

// ================================================================
// FILTER AND UTILITY FUNCTION TESTS
// ================================================================

describe('Filter Functions', () => {
  const sampleText = `
    The product quality is excellent and the design is beautiful.
    However, the price is terrible and customer service was disappointing.
    The performance is good overall.
  `;
  const sampleResult = analyzeABSA(sampleText);

  describe('getAspectsByPolarity', () => {
    it('should filter positive aspects', () => {
      const positiveAspects = getAspectsByPolarity(sampleResult, 'positive');
      expect(positiveAspects.every((as) => as.sentiment.polarity === 'positive')).toBe(true);
    });

    it('should filter negative aspects', () => {
      const negativeAspects = getAspectsByPolarity(sampleResult, 'negative');
      expect(negativeAspects.every((as) => as.sentiment.polarity === 'negative')).toBe(true);
    });
  });

  describe('getAspectsByCategory', () => {
    it('should filter by category', () => {
      const qualityAspects = getAspectsByCategory(sampleResult, 'quality');
      expect(qualityAspects.every((as) => as.aspect.category === 'quality')).toBe(true);
    });
  });

  describe('getMostPositiveAspects', () => {
    it('should return aspects sorted by score descending', () => {
      const mostPositive = getMostPositiveAspects(sampleResult, 3);
      for (let i = 1; i < mostPositive.length; i++) {
        expect(mostPositive[i - 1].sentiment.score).toBeGreaterThanOrEqual(
          mostPositive[i].sentiment.score
        );
      }
    });

    it('should respect limit parameter', () => {
      const mostPositive = getMostPositiveAspects(sampleResult, 2);
      expect(mostPositive.length).toBeLessThanOrEqual(2);
    });
  });

  describe('getMostNegativeAspects', () => {
    it('should return aspects sorted by score ascending', () => {
      const mostNegative = getMostNegativeAspects(sampleResult, 3);
      for (let i = 1; i < mostNegative.length; i++) {
        expect(mostNegative[i - 1].sentiment.score).toBeLessThanOrEqual(
          mostNegative[i].sentiment.score
        );
      }
    });
  });
});

// ================================================================
// SUMMARY AND COMPARISON TESTS
// ================================================================

describe('Summary and Comparison', () => {
  describe('generateABSASummary', () => {
    it('should generate summary for text with aspects', () => {
      const text = 'The quality is excellent. The price is reasonable.';
      const result = analyzeABSA(text);
      const summary = generateABSASummary(result);

      expect(summary).toContain('aspects');
      expect(summary.length).toBeGreaterThan(0);
    });

    it('should handle text with minimal content', () => {
      // Use very minimal text to test edge case handling
      const text = '.';
      const result = analyzeABSA(text);
      const summary = generateABSASummary(result);

      // Either no aspects or neutral sentiment
      if (result.stats.totalAspects === 0) {
        expect(summary).toContain('No specific aspects detected');
      } else {
        expect(summary).toContain('aspects');
      }
    });

    it('should include overall sentiment', () => {
      const text = 'The quality is excellent and the design is beautiful.';
      const result = analyzeABSA(text);
      const summary = generateABSASummary(result);

      expect(summary).toContain('Overall sentiment');
    });
  });

  describe('compareABSA', () => {
    it('should compare two ABSA results', () => {
      const text1 = 'The quality is excellent. The price is great.';
      const text2 = 'The quality is poor. The service is terrible.';

      const result1 = analyzeABSA(text1);
      const result2 = analyzeABSA(text2);
      const comparison = compareABSA(result1, result2);

      expect(comparison.overallDifference).toBeDefined();
      expect(comparison.categoryDifferences).toBeDefined();
      expect(comparison.sharedAspects).toBeDefined();
      expect(comparison.uniqueToFirst).toBeDefined();
      expect(comparison.uniqueToSecond).toBeDefined();
    });

    it('should identify shared aspects', () => {
      const text1 = 'The quality is excellent.';
      const text2 = 'The quality is poor.';

      const result1 = analyzeABSA(text1);
      const result2 = analyzeABSA(text2);
      const comparison = compareABSA(result1, result2);

      expect(comparison.sharedAspects).toContain('quality');
    });

    it('should identify unique aspects', () => {
      const text1 = 'The quality is excellent.';
      const text2 = 'The service is poor.';

      const result1 = analyzeABSA(text1);
      const result2 = analyzeABSA(text2);
      const comparison = compareABSA(result1, result2);

      expect(comparison.uniqueToFirst).toContain('quality');
      expect(comparison.uniqueToSecond).toContain('service');
    });

    it('should calculate category differences', () => {
      const text1 = 'The quality is excellent.';
      const text2 = 'The quality is terrible.';

      const result1 = analyzeABSA(text1);
      const result2 = analyzeABSA(text2);
      const comparison = compareABSA(result1, result2);

      expect(comparison.categoryDifferences.quality).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle very short text', () => {
    const result = analyzeABSA('Good.');
    expect(result).toBeDefined();
    expect(result.overallSentiment).toBeDefined();
  });

  it('should handle text with only punctuation', () => {
    const result = analyzeABSA('...');
    expect(result).toBeDefined();
    expect(result.stats.totalAspects).toBe(0);
  });

  it('should handle text with multiple sentences about same aspect', () => {
    const text =
      'The quality is good. The quality could be better. Overall quality meets expectations.';
    const result = analyzeABSA(text);

    expect(result.categorySentiments.quality.aspectCount).toBeGreaterThanOrEqual(2);
  });

  it('should handle complex multi-aspect sentences', () => {
    const text =
      'While the quality and design are excellent, the price and customer service leave much to be desired.';
    const result = analyzeABSA(text);

    expect(result.stats.totalAspects).toBeGreaterThanOrEqual(2);
  });

  it('should preserve aspect position information', () => {
    const text = 'Quality first, then service second.';
    const aspects = detectAspects(text);

    const qualityAspect = aspects.find((a) => a.normalized === 'quality');
    const serviceAspect = aspects.find((a) => a.normalized === 'service');

    if (qualityAspect && serviceAspect) {
      expect(qualityAspect.position).toBeLessThan(serviceAspect.position);
    }
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Integration', () => {
  it('should handle real product review', () => {
    const review = `
      I've been using this software for three months now. The user interface is incredibly
      intuitive and the performance is blazing fast. Customer support has been excellent,
      always responding within hours. However, the pricing could be more competitive -
      it's quite expensive compared to alternatives. The documentation is comprehensive
      but could use more examples. Overall, excellent product with room for improvement
      on value proposition.
    `;

    const result = analyzeABSA(review);

    expect(result.stats.totalAspects).toBeGreaterThan(3);
    expect(result.stats.categoryCoverage).toBeGreaterThan(0);

    // Should detect multiple categories
    const categoriesWithAspects = Object.values(result.categorySentiments).filter(
      (cs) => cs.aspectCount > 0
    );
    expect(categoriesWithAspects.length).toBeGreaterThan(2);
  });

  it('should handle financial/crypto review context', () => {
    const review = `
      The platform's trading performance is outstanding - extremely fast execution
      and reliable uptime. The interface design is modern and intuitive. However,
      the fee structure is confusing and support documentation is lacking.
      API integration options are excellent for developers.
    `;

    const result = analyzeABSA(review);

    expect(result.stats.totalAspects).toBeGreaterThan(0);
    expect(result.categorySentiments.performance).toBeDefined();
    expect(result.categorySentiments.design).toBeDefined();
  });
});
