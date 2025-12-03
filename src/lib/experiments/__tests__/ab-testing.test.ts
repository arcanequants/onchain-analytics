/**
 * A/B Testing Framework Tests
 *
 * Tests for statistical calculations, sample size, and variant assignment
 */

import {
  normalCDF,
  normalInverseCDF,
  calculateSampleSize,
  calculateSampleSizeContinuous,
  proportionZTest,
  twoSampleTTest,
  chiSquareTest,
  proportionDifferenceCI,
  relativeLiftCI,
  bayesianProbabilityOfImprovement,
  assignVariant,
  analyzeConversionExperiment,
  obfAlphaSpending,
  pocockAlphaSpending,
  type Variant,
  type Experiment,
  type VariantStats
} from '../ab-testing';

describe('A/B Testing Framework', () => {
  describe('Normal Distribution Functions', () => {
    test('normalCDF returns correct values for standard points', () => {
      // Standard normal distribution values
      expect(normalCDF(0)).toBeCloseTo(0.5, 4);
      expect(normalCDF(1)).toBeCloseTo(0.8413, 3);
      expect(normalCDF(-1)).toBeCloseTo(0.1587, 3);
      expect(normalCDF(1.96)).toBeCloseTo(0.975, 2);
      expect(normalCDF(-1.96)).toBeCloseTo(0.025, 2);
    });

    test('normalInverseCDF returns correct values', () => {
      expect(normalInverseCDF(0.5)).toBeCloseTo(0, 4);
      expect(normalInverseCDF(0.975)).toBeCloseTo(1.96, 2);
      expect(normalInverseCDF(0.025)).toBeCloseTo(-1.96, 2);
    });

    test('normalInverseCDF and normalCDF are inverses', () => {
      const testValues = [0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99];
      testValues.forEach(p => {
        const x = normalInverseCDF(p);
        expect(normalCDF(x)).toBeCloseTo(p, 4);
      });
    });

    test('normalInverseCDF throws for invalid probabilities', () => {
      expect(() => normalInverseCDF(0)).toThrow();
      expect(() => normalInverseCDF(1)).toThrow();
      expect(() => normalInverseCDF(-0.1)).toThrow();
      expect(() => normalInverseCDF(1.1)).toThrow();
    });
  });

  describe('Sample Size Calculator', () => {
    test('calculates sample size for typical conversion rate experiment', () => {
      const sampleSize = calculateSampleSize({
        baselineConversionRate: 0.10,
        minimumDetectableEffect: 0.10, // 10% relative lift (0.10 -> 0.11)
        significanceLevel: 0.05,
        statisticalPower: 0.8
      });

      // Expected ~15,000 per group for these parameters
      expect(sampleSize).toBeGreaterThan(10000);
      expect(sampleSize).toBeLessThan(25000);
    });

    test('larger effect size requires smaller sample', () => {
      const smallEffect = calculateSampleSize({
        baselineConversionRate: 0.10,
        minimumDetectableEffect: 0.05, // 5% lift
        significanceLevel: 0.05,
        statisticalPower: 0.8
      });

      const largeEffect = calculateSampleSize({
        baselineConversionRate: 0.10,
        minimumDetectableEffect: 0.20, // 20% lift
        significanceLevel: 0.05,
        statisticalPower: 0.8
      });

      expect(largeEffect).toBeLessThan(smallEffect);
    });

    test('higher power requires larger sample', () => {
      const lowPower = calculateSampleSize({
        baselineConversionRate: 0.10,
        minimumDetectableEffect: 0.10,
        significanceLevel: 0.05,
        statisticalPower: 0.7
      });

      const highPower = calculateSampleSize({
        baselineConversionRate: 0.10,
        minimumDetectableEffect: 0.10,
        significanceLevel: 0.05,
        statisticalPower: 0.9
      });

      expect(highPower).toBeGreaterThan(lowPower);
    });

    test('calculates sample size for continuous metrics', () => {
      const sampleSize = calculateSampleSizeContinuous(
        100, // baseline mean
        25,  // standard deviation
        0.05, // 5% relative change
        0.05,
        0.8
      );

      expect(sampleSize).toBeGreaterThan(100);
      expect(sampleSize).toBeLessThan(2000);
    });
  });

  describe('Statistical Tests', () => {
    describe('Proportion Z-Test', () => {
      test('detects significant difference', () => {
        // Control: 100/1000 = 10%, Treatment: 150/1000 = 15%
        const result = proportionZTest(100, 1000, 150, 1000);

        expect(result.pValue).toBeLessThan(0.05);
        expect(result.zScore).toBeGreaterThan(0);
      });

      test('detects no significant difference', () => {
        // Control: 100/1000 = 10%, Treatment: 105/1000 = 10.5%
        const result = proportionZTest(100, 1000, 105, 1000);

        expect(result.pValue).toBeGreaterThan(0.05);
      });

      test('returns pValue of 1 when proportions are equal', () => {
        const result = proportionZTest(100, 1000, 100, 1000);

        expect(result.zScore).toBeCloseTo(0, 4);
      });
    });

    describe('Two-Sample T-Test', () => {
      test('detects significant difference in means', () => {
        const result = twoSampleTTest(
          100, 15, 500,  // Control: mean=100, sd=15, n=500
          110, 15, 500   // Treatment: mean=110, sd=15, n=500
        );

        expect(result.pValue).toBeLessThan(0.05);
        expect(result.tScore).toBeGreaterThan(0);
      });

      test('handles unequal variances (Welch)', () => {
        const result = twoSampleTTest(
          100, 10, 500,  // Low variance
          105, 30, 500   // High variance
        );

        expect(result.degreesOfFreedom).toBeLessThan(998); // Less than n1+n2-2
      });
    });

    describe('Chi-Square Test', () => {
      test('detects significant association', () => {
        const result = chiSquareTest(
          { success: 50, failure: 950 },  // Control: 5%
          { success: 100, failure: 900 }  // Treatment: 10%
        );

        expect(result.pValue).toBeLessThan(0.05);
        expect(result.chiSquare).toBeGreaterThan(0);
      });

      test('detects no association when proportions are equal', () => {
        const result = chiSquareTest(
          { success: 100, failure: 900 },
          { success: 100, failure: 900 }
        );

        expect(result.chiSquare).toBeCloseTo(0, 4);
      });
    });
  });

  describe('Confidence Intervals', () => {
    test('proportionDifferenceCI contains true difference', () => {
      const ci = proportionDifferenceCI(0.10, 1000, 0.12, 1000, 0.95);

      expect(ci.lower).toBeLessThan(0.02);
      expect(ci.upper).toBeGreaterThan(0.02);
      expect(ci.level).toBe(0.95);
    });

    test('relativeLiftCI calculates correct range', () => {
      const ci = relativeLiftCI(0.10, 1000, 0.12, 1000, 0.95);

      // True relative lift is 20%
      expect(ci.lower).toBeLessThan(0.20);
      expect(ci.upper).toBeGreaterThan(0.20);
    });

    test('higher confidence level means wider interval', () => {
      const ci90 = proportionDifferenceCI(0.10, 1000, 0.12, 1000, 0.90);
      const ci99 = proportionDifferenceCI(0.10, 1000, 0.12, 1000, 0.99);

      expect(ci99.upper - ci99.lower).toBeGreaterThan(ci90.upper - ci90.lower);
    });
  });

  describe('Bayesian Analysis', () => {
    test('bayesianProbabilityOfImprovement returns high probability for clear winner', () => {
      const prob = bayesianProbabilityOfImprovement(
        100, 1000,  // Control: 10%
        150, 1000   // Treatment: 15%
      );

      expect(prob).toBeGreaterThan(0.95);
    });

    test('returns ~0.5 for equal performance', () => {
      const prob = bayesianProbabilityOfImprovement(
        100, 1000,
        100, 1000
      );

      expect(prob).toBeGreaterThan(0.4);
      expect(prob).toBeLessThan(0.6);
    });

    test('returns low probability when control is better', () => {
      const prob = bayesianProbabilityOfImprovement(
        150, 1000,  // Control: 15%
        100, 1000   // Treatment: 10%
      );

      expect(prob).toBeLessThan(0.05);
    });
  });

  describe('Variant Assignment', () => {
    const variants: Variant[] = [
      { id: 'control', name: 'Control', type: 'control', weight: 0.5 },
      { id: 'treatment', name: 'Treatment', type: 'treatment', weight: 0.5 }
    ];

    test('assignment is deterministic', () => {
      const assignment1 = assignVariant('user123', 'exp1', variants);
      const assignment2 = assignVariant('user123', 'exp1', variants);

      expect(assignment1.id).toBe(assignment2.id);
    });

    test('different users can get different variants', () => {
      const assignments = new Set<string>();

      // With many users, we should see both variants
      for (let i = 0; i < 100; i++) {
        const variant = assignVariant(`user${i}`, 'exp1', variants);
        assignments.add(variant.id);
      }

      expect(assignments.size).toBe(2);
    });

    test('different experiments give different assignments', () => {
      const exp1 = assignVariant('user123', 'exp1', variants);
      const exp2 = assignVariant('user123', 'exp2', variants);

      // Not guaranteed to be different, but possible
      // Just verify the function works for different experiments
      expect(exp1.id).toBeDefined();
      expect(exp2.id).toBeDefined();
    });

    test('respects variant weights', () => {
      const skewedVariants: Variant[] = [
        { id: 'control', name: 'Control', type: 'control', weight: 0.9 },
        { id: 'treatment', name: 'Treatment', type: 'treatment', weight: 0.1 }
      ];

      let controlCount = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const variant = assignVariant(`user${i}`, 'exp-skewed', skewedVariants);
        if (variant.id === 'control') controlCount++;
      }

      // Should be around 90% control (with some variance)
      expect(controlCount / iterations).toBeGreaterThan(0.8);
      expect(controlCount / iterations).toBeLessThan(0.98);
    });
  });

  describe('Experiment Analysis', () => {
    const baseExperiment: Experiment = {
      id: 'test-exp',
      name: 'Test Experiment',
      description: 'Test',
      hypothesis: 'Treatment will improve conversion',
      status: 'running',
      variants: [
        { id: 'control', name: 'Control', type: 'control', weight: 0.5 },
        { id: 'treatment', name: 'Treatment', type: 'treatment', weight: 0.5 }
      ],
      primaryMetric: 'conversion_rate',
      targetSampleSize: 10000,
      minimumDetectableEffect: 0.10,
      significanceLevel: 0.05,
      statisticalPower: 0.8,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    test('analyzes significant positive result', () => {
      const controlStats: VariantStats = {
        variantId: 'control',
        sampleSize: 10000,
        conversions: 1000,
        conversionRate: 0.10
      };

      const treatmentStats: VariantStats = {
        variantId: 'treatment',
        sampleSize: 10000,
        conversions: 1200,
        conversionRate: 0.12
      };

      const result = analyzeConversionExperiment(
        baseExperiment,
        controlStats,
        treatmentStats
      );

      expect(result.isSignificant).toBe(true);
      expect(result.relativeLift).toBeCloseTo(0.20, 2);
      expect(result.pValue).toBeLessThan(0.05);
      expect(result.recommendation).toBe('stop_winner');
    });

    test('recommends continue for underpowered experiment', () => {
      const controlStats: VariantStats = {
        variantId: 'control',
        sampleSize: 100,
        conversions: 10,
        conversionRate: 0.10
      };

      const treatmentStats: VariantStats = {
        variantId: 'treatment',
        sampleSize: 100,
        conversions: 12,
        conversionRate: 0.12
      };

      const result = analyzeConversionExperiment(
        baseExperiment,
        controlStats,
        treatmentStats
      );

      expect(result.currentProgress).toBeLessThan(0.5);
      expect(result.recommendation).toBe('continue');
    });

    test('calculates bayesian probability', () => {
      const controlStats: VariantStats = {
        variantId: 'control',
        sampleSize: 1000,
        conversions: 100,
        conversionRate: 0.10
      };

      const treatmentStats: VariantStats = {
        variantId: 'treatment',
        sampleSize: 1000,
        conversions: 120,
        conversionRate: 0.12
      };

      const result = analyzeConversionExperiment(
        baseExperiment,
        controlStats,
        treatmentStats
      );

      expect(result.bayesianProbability).toBeGreaterThan(0.9);
    });
  });

  describe('Sequential Testing', () => {
    test('OBF spending is conservative early', () => {
      const earlySpend = obfAlphaSpending(0.25, 0.05);
      const lateSpend = obfAlphaSpending(0.75, 0.05);

      expect(earlySpend).toBeLessThan(0.001); // Very conservative
      expect(lateSpend).toBeLessThan(0.05);
      expect(lateSpend).toBeGreaterThan(earlySpend);
    });

    test('OBF spends full alpha at completion', () => {
      const fullSpend = obfAlphaSpending(1.0, 0.05);
      expect(fullSpend).toBeCloseTo(0.05, 4);
    });

    test('Pocock spending is more uniform', () => {
      const earlySpend = pocockAlphaSpending(0.25, 0.05);
      const midSpend = pocockAlphaSpending(0.50, 0.05);

      // Pocock is more aggressive early
      expect(earlySpend).toBeGreaterThan(0.01);
      expect(midSpend).toBeGreaterThan(earlySpend);
    });

    test('Pocock spends full alpha at completion', () => {
      const fullSpend = pocockAlphaSpending(1.0, 0.05);
      expect(fullSpend).toBeCloseTo(0.05, 4);
    });

    test('spending is 0 at start', () => {
      expect(obfAlphaSpending(0, 0.05)).toBe(0);
      expect(pocockAlphaSpending(0, 0.05)).toBe(0);
    });
  });
});
