/**
 * Share of Voice (SOV) Calculator Tests
 *
 * Phase 2, Week 3, Day 2
 */

import { describe, it, expect } from 'vitest';
import {
  detectMentions,
  calculateSOV,
  calculateAggregatedSOV,
  calculateSOVTrend,
  generateSOVSummary,
  formatSOV,
  getSOVRating,
  type SOVCalculationOptions,
  type SOVTrendPoint,
} from './index';

// ================================================================
// TEST DATA
// ================================================================

const defaultOptions: SOVCalculationOptions = {
  brand: 'Acme',
  brandAliases: ['ACME Corp', 'Acme Corporation'],
  competitors: [
    { name: 'TechCo', aliases: ['Tech Co', 'TechCorp'] },
    { name: 'DataInc', aliases: ['Data Inc', 'DataIncorp'] },
    { name: 'CloudPro', aliases: [] },
  ],
};

// ================================================================
// MENTION DETECTION TESTS
// ================================================================

describe('detectMentions', () => {
  it('should detect single brand mention', () => {
    const text = 'Acme is a leading technology company.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(1);
    expect(mentions[0].brand).toBe('Acme');
    expect(mentions[0].startIndex).toBe(0);
  });

  it('should detect multiple mentions', () => {
    const text = 'Acme offers great products. Many users prefer Acme for its reliability.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(2);
  });

  it('should detect mentions with aliases', () => {
    const text = 'ACME Corp is also known as Acme Corporation.';
    const mentions = detectMentions(text, 'Acme', ['ACME Corp', 'Acme Corporation']);

    expect(mentions.length).toBeGreaterThanOrEqual(2);
  });

  it('should respect word boundaries', () => {
    const text = 'The AcmeWidget is not the same as Acme.';
    const mentions = detectMentions(text, 'Acme');

    // Should only match standalone 'Acme', not 'AcmeWidget'
    expect(mentions.length).toBe(1);
    expect(mentions[0].startIndex).toBe(34); // Position of standalone 'Acme'
  });

  it('should extract context around mention', () => {
    const text = 'In the technology sector, Acme has established itself as a leader in cloud computing.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(1);
    expect(mentions[0].context).toContain('technology');
    expect(mentions[0].context).toContain('leader');
  });

  it('should analyze sentiment of mentions', () => {
    const positiveText = 'Acme is the best and most reliable solution.';
    const negativeText = 'Acme has issues and problems with reliability.';

    const positiveMentions = detectMentions(positiveText, 'Acme');
    const negativeMentions = detectMentions(negativeText, 'Acme');

    expect(positiveMentions[0].sentiment).toBeGreaterThan(0);
    expect(negativeMentions[0].sentiment).toBeLessThan(0);
  });

  it('should classify recommendation mentions', () => {
    const text = 'I recommend Acme for enterprise solutions.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions[0].mentionType).toBe('recommendation');
  });

  it('should classify comparison mentions', () => {
    const text = 'Acme compared to TechCo offers better pricing.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions[0].mentionType).toBe('comparison');
  });

  it('should classify example mentions', () => {
    const text = 'Companies such as Acme are leading the industry.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions[0].mentionType).toBe('example');
  });

  it('should classify factual mentions', () => {
    const text = 'Acme is a technology company founded in 2010.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions[0].mentionType).toBe('factual');
  });

  it('should detect primary mentions', () => {
    const text = 'Acme is the market leader. Other companies follow their approach.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions[0].isPrimary).toBe(true);
  });

  it('should return empty array for no mentions', () => {
    const text = 'This text does not mention any brands.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions).toEqual([]);
  });

  it('should handle case-insensitive detection', () => {
    const text = 'acme and ACME are the same brand.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(2);
  });

  it('should deduplicate overlapping mentions', () => {
    const text = 'Acme Acme Acme is mentioned multiple times.';
    const mentions = detectMentions(text, 'Acme');

    // Each distinct position should be counted once
    expect(mentions.length).toBe(3);
  });
});

// ================================================================
// SOV CALCULATION TESTS
// ================================================================

describe('calculateSOV', () => {
  it('should calculate 100% SOV when only brand is mentioned', () => {
    const response = 'Acme is the best solution. Acme offers great features.';
    const result = calculateSOV(response, defaultOptions);

    expect(result.shareOfVoice).toBe(100);
    expect(result.brandMentions.length).toBe(2);
    expect(result.totalMentions).toBe(2);
  });

  it('should calculate 0% SOV when only competitors are mentioned', () => {
    const response = 'TechCo and DataInc are leading the market.';
    const result = calculateSOV(response, defaultOptions);

    expect(result.shareOfVoice).toBe(0);
    expect(result.brandMentions.length).toBe(0);
  });

  it('should calculate proportional SOV', () => {
    const response = 'Acme, TechCo, and DataInc are competitors.';
    const result = calculateSOV(response, defaultOptions);

    // 1 brand mention, 2 competitor mentions = 33.33% SOV
    expect(result.shareOfVoice).toBeCloseTo(33.33, 0);
    expect(result.totalMentions).toBe(3);
  });

  it('should calculate weighted SOV for recommendations', () => {
    const response = 'I recommend Acme over TechCo.';
    const result = calculateSOV(response, defaultOptions);

    // Recommendation should boost weighted SOV
    expect(result.weightedSOV).toBeGreaterThan(result.shareOfVoice);
  });

  it('should track competitor mentions separately', () => {
    const response = 'Acme competes with TechCo and DataInc.';
    const result = calculateSOV(response, defaultOptions);

    expect(result.competitorMentions['TechCo'].length).toBe(1);
    expect(result.competitorMentions['DataInc'].length).toBe(1);
    expect(result.competitorMentions['CloudPro'].length).toBe(0);
  });

  it('should calculate brand sentiment', () => {
    const positiveResponse = 'Acme is excellent and reliable.';
    const negativeResponse = 'Acme has problems and issues.';

    const positiveResult = calculateSOV(positiveResponse, defaultOptions);
    const negativeResult = calculateSOV(negativeResponse, defaultOptions);

    expect(positiveResult.brandSentiment).toBeGreaterThan(0);
    expect(negativeResult.brandSentiment).toBeLessThan(0);
  });

  it('should calculate position score', () => {
    const earlyMention = 'Acme is great. Other text follows.';
    const lateMention = 'Other text first. Then Acme appears.';

    const earlyResult = calculateSOV(earlyMention, defaultOptions);
    const lateResult = calculateSOV(lateMention, defaultOptions);

    expect(earlyResult.positionScore).toBeGreaterThan(lateResult.positionScore);
  });

  it('should handle empty response', () => {
    const result = calculateSOV('', defaultOptions);

    expect(result.shareOfVoice).toBe(0);
    expect(result.totalMentions).toBe(0);
  });

  it('should handle response with no brand mentions', () => {
    const response = 'This is a general technology discussion.';
    const result = calculateSOV(response, defaultOptions);

    expect(result.shareOfVoice).toBe(0);
    expect(result.brandMentions.length).toBe(0);
  });

  it('should handle brand aliases', () => {
    const response = 'ACME Corp and Acme Corporation are mentioned.';
    const result = calculateSOV(response, defaultOptions);

    expect(result.brandMentions.length).toBeGreaterThanOrEqual(2);
    expect(result.shareOfVoice).toBe(100);
  });
});

// ================================================================
// AGGREGATED SOV TESTS
// ================================================================

describe('calculateAggregatedSOV', () => {
  it('should calculate average SOV across responses', () => {
    const responses = [
      'Acme is great.', // 100% SOV
      'TechCo is better.', // 0% SOV
      'Acme and TechCo compete.', // 50% SOV
    ];

    const result = calculateAggregatedSOV(responses, defaultOptions);

    expect(result.averageSOV).toBeCloseTo(50, 0);
    expect(result.results.length).toBe(3);
  });

  it('should track total mentions', () => {
    const responses = [
      'Acme Acme Acme.',
      'Acme TechCo DataInc.',
    ];

    const result = calculateAggregatedSOV(responses, defaultOptions);

    expect(result.totalBrandMentions).toBe(4);
    expect(result.totalCompetitorMentions).toBe(2);
    expect(result.totalMentions).toBe(6);
  });

  it('should calculate competitor-specific SOV', () => {
    const responses = [
      'TechCo TechCo TechCo is mentioned.',
      'DataInc is also here.',
    ];

    const result = calculateAggregatedSOV(responses, defaultOptions);

    expect(result.competitorSOV['TechCo']).toBeGreaterThan(result.competitorSOV['DataInc']);
  });

  it('should track mentions by type', () => {
    const responses = [
      'I recommend Acme.',
      'Acme is a technology company.',
      'Such as Acme for example.',
    ];

    const result = calculateAggregatedSOV(responses, defaultOptions);

    expect(result.mentionsByType.recommendation).toBeGreaterThanOrEqual(1);
    expect(result.mentionsByType.factual).toBeGreaterThanOrEqual(1);
    expect(result.mentionsByType.example).toBeGreaterThanOrEqual(1);
  });

  it('should calculate confidence based on sample size', () => {
    const fewResponses = ['Acme.'];
    const manyResponses = Array(10).fill('Acme is great and mentioned multiple times.');

    const lowConfidence = calculateAggregatedSOV(fewResponses, defaultOptions);
    const highConfidence = calculateAggregatedSOV(manyResponses, defaultOptions);

    expect(highConfidence.confidence).toBeGreaterThan(lowConfidence.confidence);
  });

  it('should include timestamp', () => {
    const result = calculateAggregatedSOV(['Acme'], defaultOptions);

    expect(result.calculatedAt).toBeDefined();
    expect(() => new Date(result.calculatedAt)).not.toThrow();
  });

  it('should handle empty responses array', () => {
    const result = calculateAggregatedSOV([], defaultOptions);

    expect(result.averageSOV).toBe(0);
    expect(result.totalMentions).toBe(0);
    expect(result.results.length).toBe(0);
  });

  it('should calculate weighted average SOV', () => {
    const responses = [
      'I recommend Acme over TechCo.', // High weighted
      'Acme and TechCo exist.', // Normal weighted
    ];

    const result = calculateAggregatedSOV(responses, defaultOptions);

    expect(result.weightedAverageSOV).toBeGreaterThanOrEqual(result.averageSOV);
  });
});

// ================================================================
// SOV TREND TESTS
// ================================================================

describe('calculateSOVTrend', () => {
  const sampleHistory: SOVTrendPoint[] = [
    { timestamp: '2024-01-01', sov: 20, weightedSov: 22, responseCount: 5 },
    { timestamp: '2024-01-08', sov: 22, weightedSov: 24, responseCount: 5 },
    { timestamp: '2024-01-15', sov: 25, weightedSov: 27, responseCount: 5 },
    { timestamp: '2024-01-22', sov: 28, weightedSov: 30, responseCount: 5 },
  ];

  it('should calculate change from previous period', () => {
    const trend = calculateSOVTrend(sampleHistory, 30);

    expect(trend.previousSOV).toBe(28);
    expect(trend.change).toBe(2);
  });

  it('should determine upward direction', () => {
    const trend = calculateSOVTrend(sampleHistory, 32);

    expect(trend.direction).toBe('up');
  });

  it('should determine downward direction', () => {
    const trend = calculateSOVTrend(sampleHistory, 20);

    expect(trend.direction).toBe('down');
  });

  it('should determine stable direction for small changes', () => {
    const trend = calculateSOVTrend(sampleHistory, 28.5);

    expect(trend.direction).toBe('stable');
  });

  it('should calculate change percent', () => {
    const trend = calculateSOVTrend(sampleHistory, 35);

    expect(trend.changePercent).toBeCloseTo(25, 0); // (35-28)/28 * 100 = 25%
  });

  it('should calculate positive momentum for upward trend', () => {
    const trend = calculateSOVTrend(sampleHistory, 35);

    expect(trend.momentum).toBeGreaterThan(0);
  });

  it('should include sorted history', () => {
    const unsortedHistory: SOVTrendPoint[] = [
      { timestamp: '2024-01-15', sov: 25, weightedSov: 27, responseCount: 5 },
      { timestamp: '2024-01-01', sov: 20, weightedSov: 22, responseCount: 5 },
      { timestamp: '2024-01-08', sov: 22, weightedSov: 24, responseCount: 5 },
    ];

    const trend = calculateSOVTrend(unsortedHistory, 30);

    expect(trend.history[0].timestamp).toBe('2024-01-01');
    expect(trend.history[trend.history.length - 1].timestamp).toBe('2024-01-15');
  });

  it('should handle empty history', () => {
    const trend = calculateSOVTrend([], 30);

    expect(trend.previousSOV).toBe(0);
    expect(trend.change).toBe(0);
    expect(trend.direction).toBe('stable');
    expect(trend.momentum).toBe(0);
  });

  it('should handle single data point history', () => {
    const singlePoint: SOVTrendPoint[] = [
      { timestamp: '2024-01-01', sov: 25, weightedSov: 27, responseCount: 5 },
    ];

    const trend = calculateSOVTrend(singlePoint, 30);

    expect(trend.previousSOV).toBe(25);
    expect(trend.change).toBe(5);
  });

  it('should bound momentum between -1 and 1', () => {
    const volatileHistory: SOVTrendPoint[] = [
      { timestamp: '2024-01-01', sov: 10, weightedSov: 12, responseCount: 5 },
      { timestamp: '2024-01-08', sov: 50, weightedSov: 55, responseCount: 5 },
    ];

    const upTrend = calculateSOVTrend(volatileHistory, 90);
    const downTrend = calculateSOVTrend(volatileHistory, 5);

    expect(upTrend.momentum).toBeLessThanOrEqual(1);
    expect(downTrend.momentum).toBeGreaterThanOrEqual(-1);
  });
});

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('generateSOVSummary', () => {
  it('should generate readable summary', () => {
    const aggregated = calculateAggregatedSOV(
      ['Acme is great. TechCo is also here.'],
      defaultOptions
    );

    const summary = generateSOVSummary(aggregated);

    expect(summary).toContain('Share of Voice');
    expect(summary).toContain('%');
  });

  it('should mention top competitor if leading', () => {
    const aggregated = calculateAggregatedSOV(
      ['TechCo TechCo TechCo. Acme once.'],
      defaultOptions
    );

    const summary = generateSOVSummary(aggregated);

    expect(summary).toContain('TechCo');
  });

  it('should indicate low confidence', () => {
    const aggregated = calculateAggregatedSOV(['Acme'], defaultOptions);

    const summary = generateSOVSummary(aggregated);

    expect(summary.toLowerCase()).toContain('confidence');
  });
});

describe('formatSOV', () => {
  it('should format as percentage', () => {
    expect(formatSOV(25.5)).toBe('25.5%');
    expect(formatSOV(100)).toBe('100.0%');
    expect(formatSOV(0)).toBe('0.0%');
  });

  it('should respect decimal precision', () => {
    expect(formatSOV(25.567, 2)).toBe('25.57%');
    expect(formatSOV(25.567, 0)).toBe('26%');
  });
});

describe('getSOVRating', () => {
  it('should return excellent for high SOV', () => {
    expect(getSOVRating(45)).toBe('excellent');
    expect(getSOVRating(40)).toBe('excellent');
  });

  it('should return good for medium-high SOV', () => {
    expect(getSOVRating(30)).toBe('good');
    expect(getSOVRating(25)).toBe('good');
  });

  it('should return moderate for medium SOV', () => {
    expect(getSOVRating(20)).toBe('moderate');
    expect(getSOVRating(15)).toBe('moderate');
  });

  it('should return low for low SOV', () => {
    expect(getSOVRating(10)).toBe('low');
    expect(getSOVRating(5)).toBe('low');
  });

  it('should return critical for very low SOV', () => {
    expect(getSOVRating(3)).toBe('critical');
    expect(getSOVRating(0)).toBe('critical');
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('edge cases', () => {
  it('should handle very long texts', () => {
    const longText = 'Acme ' + 'text '.repeat(10000) + ' Acme at the end.';

    const mentions = detectMentions(longText, 'Acme');

    expect(mentions.length).toBe(2);
  });

  it('should handle special characters in brand names', () => {
    const text = 'Tech-Co and Data.Inc are competitors.';
    const options: SOVCalculationOptions = {
      brand: 'Acme',
      competitors: [
        { name: 'Tech-Co' },
        { name: 'Data.Inc' },
      ],
    };

    const result = calculateSOV(text, options);

    expect(result.competitorMentions['Tech-Co'].length).toBe(1);
    expect(result.competitorMentions['Data.Inc'].length).toBe(1);
  });

  it('should handle unicode characters', () => {
    const text = 'Acme (アクメ) is a global company.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(1);
  });

  it('should handle punctuation around brand names', () => {
    const text = '"Acme" is great. [Acme] excels. (Acme) leads.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(3);
  });

  it('should handle newlines and multiple spaces', () => {
    const text = 'Acme\n\nis\n\ngreat.\n\nAcme   rules.';
    const mentions = detectMentions(text, 'Acme');

    expect(mentions.length).toBe(2);
  });

  it('should handle empty competitor list', () => {
    const options: SOVCalculationOptions = {
      brand: 'Acme',
      competitors: [],
    };

    const result = calculateSOV('Acme is alone in this text.', options);

    expect(result.shareOfVoice).toBe(100);
    expect(Object.keys(result.competitorMentions).length).toBe(0);
  });

  it('should handle many competitors', () => {
    const manyCompetitors = Array.from({ length: 50 }, (_, i) => ({
      name: `Competitor${i}`,
    }));

    const options: SOVCalculationOptions = {
      brand: 'Acme',
      competitors: manyCompetitors,
    };

    const response = 'Acme competes with Competitor0 and Competitor49.';
    const result = calculateSOV(response, options);

    expect(result.brandMentions.length).toBe(1);
    expect(result.competitorMentions['Competitor0'].length).toBe(1);
    expect(result.competitorMentions['Competitor49'].length).toBe(1);
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('integration', () => {
  it('should handle realistic AI response analysis', () => {
    const responses = [
      `When looking for cloud storage solutions, Acme stands out for its
       reliability and ease of use. I would recommend Acme for enterprise
       users who need robust features. TechCo is a viable alternative for
       smaller teams, while DataInc offers specialized solutions for data-heavy
       applications.`,

      `Compared to TechCo, Acme offers better pricing for large deployments.
       CloudPro is also worth considering if budget is a primary concern.
       Acme's customer support is excellent and their documentation is comprehensive.`,

      `For your specific needs, I suggest evaluating Acme and TechCo.
       Both offer solid features, but Acme has better integration options.
       DataInc is another option if you need specialized data handling.`,
    ];

    const aggregated = calculateAggregatedSOV(responses, defaultOptions);

    // Acme should have highest SOV due to recommendations
    expect(aggregated.averageSOV).toBeGreaterThan(20);
    expect(aggregated.averageSentiment).toBeGreaterThan(0);
    expect(aggregated.mentionsByType.recommendation).toBeGreaterThan(0);
    expect(aggregated.confidence).toBeGreaterThan(0.3);

    // All competitors should be tracked
    expect(Object.keys(aggregated.competitorSOV)).toContain('TechCo');
    expect(Object.keys(aggregated.competitorSOV)).toContain('DataInc');

    // Summary should be generated
    const summary = generateSOVSummary(aggregated);
    expect(summary.length).toBeGreaterThan(0);
  });

  it('should track SOV trends over time', () => {
    const historicalData: SOVTrendPoint[] = [
      { timestamp: '2024-01-01', sov: 15, weightedSov: 17, responseCount: 10 },
      { timestamp: '2024-02-01', sov: 18, weightedSov: 20, responseCount: 10 },
      { timestamp: '2024-03-01', sov: 22, weightedSov: 25, responseCount: 10 },
      { timestamp: '2024-04-01', sov: 25, weightedSov: 28, responseCount: 10 },
    ];

    // Current month shows improvement
    const currentSOV = 28;
    const trend = calculateSOVTrend(historicalData, currentSOV);

    expect(trend.direction).toBe('up');
    expect(trend.momentum).toBeGreaterThan(0);
    expect(trend.change).toBe(3);

    // Rating should improve
    const previousRating = getSOVRating(25);
    const currentRating = getSOVRating(28);

    expect(previousRating).toBe('good');
    expect(currentRating).toBe('good');
  });
});
