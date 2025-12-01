/**
 * Tests for SOV Calculator Module
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSOV,
  analyzeSOVTrend,
  compareCompetitorSOV,
  getAllChannels,
  getAllQueryTypes,
  getChannelWeights,
  calculateSOVChange,
  formatSOV,
  getSOVTier,
  MentionData,
  SOVInput,
  CompetitorSOV,
  Channel
} from './index';

describe('SOV Calculator Module', () => {
  // ================================================================
  // TEST DATA HELPERS
  // ================================================================

  const createMentionData = (
    competitorId: string,
    competitorName: string,
    channel: Channel,
    count: number,
    sentiment: number = 0.5
  ): MentionData => ({
    competitorId,
    competitorName,
    channel,
    queryType: 'brand',
    count,
    sentiment,
    date: new Date()
  });

  // ================================================================
  // BASIC SOV CALCULATION TESTS
  // ================================================================

  describe('Basic SOV Calculation', () => {
    it('should calculate SOV for single competitor', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Competitor 1', 'organic', 100)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors.length).toBe(1);
      expect(result.competitors[0].totalSOV).toBe(100);
      expect(result.competitors[0].rank).toBe(1);
    });

    it('should calculate SOV for multiple competitors', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Competitor 1', 'organic', 60),
        createMentionData('comp2', 'Competitor 2', 'organic', 40)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors.length).toBe(2);
      expect(result.competitors[0].totalSOV).toBe(60);
      expect(result.competitors[0].competitorName).toBe('Competitor 1');
      expect(result.competitors[1].totalSOV).toBe(40);
    });

    it('should rank competitors by SOV', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Small', 'organic', 10),
        createMentionData('comp2', 'Large', 'organic', 70),
        createMentionData('comp3', 'Medium', 'organic', 20)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors[0].rank).toBe(1);
      expect(result.competitors[0].competitorName).toBe('Large');
      expect(result.competitors[1].rank).toBe(2);
      expect(result.competitors[1].competitorName).toBe('Medium');
      expect(result.competitors[2].rank).toBe(3);
    });

    it('should identify market leader', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Leader Corp', 'organic', 100),
        createMentionData('comp2', 'Follower Inc', 'organic', 50)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.marketLeader).toBe('Leader Corp');
    });
  });

  // ================================================================
  // CHANNEL WEIGHTING TESTS
  // ================================================================

  describe('Channel Weighting', () => {
    it('should apply default channel weights', () => {
      const weights = getChannelWeights();
      expect(weights.organic).toBe(1.0);
      expect(weights.paid).toBe(0.7);
      expect(weights['ai-responses']).toBe(1.3);
    });

    it('should apply industry-specific weights', () => {
      const saasWeights = getChannelWeights('saas');
      expect(saasWeights['ai-responses']).toBe(1.4);

      const restaurantWeights = getChannelWeights('restaurant');
      expect(restaurantWeights.reviews).toBe(1.6);
    });

    it('should weight channels differently in SOV calculation', () => {
      // Same counts, different channels
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Comp 1', 'ai-responses', 50), // Higher weight
        createMentionData('comp2', 'Comp 2', 'paid', 50) // Lower weight
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      // Comp1 should have higher SOV due to channel weight
      expect(result.competitors[0].competitorName).toBe('Comp 1');
      expect(result.competitors[0].totalSOV).toBeGreaterThan(50);
    });
  });

  // ================================================================
  // CHANNEL BREAKDOWN TESTS
  // ================================================================

  describe('Channel Breakdown', () => {
    it('should calculate channel breakdown per competitor', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Comp 1', 'organic', 50),
        createMentionData('comp1', 'Comp 1', 'social', 30),
        createMentionData('comp1', 'Comp 1', 'reviews', 20)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      const breakdown = result.competitors[0].channelBreakdown;
      expect(breakdown.length).toBe(3);

      const organic = breakdown.find(c => c.channel === 'organic');
      expect(organic?.mentions).toBe(50);
      expect(organic?.sovPercent).toBe(50);
    });

    it('should calculate channel summary across all competitors', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Comp 1', 'organic', 60),
        createMentionData('comp2', 'Comp 2', 'organic', 40),
        createMentionData('comp1', 'Comp 1', 'social', 30),
        createMentionData('comp2', 'Comp 2', 'social', 70)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.channelSummary.organic.total).toBe(100);
      expect(result.channelSummary.organic.leader).toBe('Comp 1');
      expect(result.channelSummary.social.leader).toBe('Comp 2');
    });
  });

  // ================================================================
  // SENTIMENT ANALYSIS TESTS
  // ================================================================

  describe('Sentiment Analysis', () => {
    it('should classify positive mentions', () => {
      const mentions: MentionData[] = [
        { ...createMentionData('comp1', 'Comp 1', 'organic', 100), sentiment: 0.8 }
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors[0].positiveMentions).toBe(100);
      expect(result.competitors[0].negativeMentions).toBe(0);
    });

    it('should classify negative mentions', () => {
      const mentions: MentionData[] = [
        { ...createMentionData('comp1', 'Comp 1', 'organic', 100), sentiment: -0.5 }
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors[0].negativeMentions).toBe(100);
      expect(result.competitors[0].positiveMentions).toBe(0);
    });

    it('should classify neutral mentions', () => {
      const mentions: MentionData[] = [
        { ...createMentionData('comp1', 'Comp 1', 'organic', 100), sentiment: 0.1 }
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors[0].neutralMentions).toBe(100);
    });

    it('should calculate average sentiment', () => {
      const mentions: MentionData[] = [
        { ...createMentionData('comp1', 'Comp 1', 'organic', 50), sentiment: 0.8 },
        { ...createMentionData('comp1', 'Comp 1', 'social', 50), sentiment: 0.2 }
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors[0].avgSentiment).toBe(0.5);
    });
  });

  // ================================================================
  // MOMENTUM TESTS
  // ================================================================

  describe('Momentum Detection', () => {
    it('should detect rising momentum', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Rising Comp', 'organic', 50)
      ];

      const previousPeriod: CompetitorSOV[] = [{
        competitorId: 'comp1',
        competitorName: 'Rising Comp',
        totalSOV: 45, // Lower than current
        rank: 1,
        totalMentions: 45,
        positiveMentions: 30,
        negativeMentions: 5,
        neutralMentions: 10,
        avgSentiment: 0.5,
        channelBreakdown: [],
        queryTypeBreakdown: [],
        momentum: 'stable'
      }];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      }, undefined, previousPeriod);

      expect(result.competitors[0].momentum).toBe('rising');
    });

    it('should detect declining momentum', () => {
      // Need multiple competitors so SOV isn't always 100%
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Declining Comp', 'organic', 30),
        createMentionData('comp2', 'Rising Comp', 'organic', 70)
      ];

      const previousPeriod: CompetitorSOV[] = [{
        competitorId: 'comp1',
        competitorName: 'Declining Comp',
        totalSOV: 60, // Was 60%, now will be 30%
        rank: 1,
        totalMentions: 60,
        positiveMentions: 40,
        negativeMentions: 10,
        neutralMentions: 10,
        avgSentiment: 0.5,
        channelBreakdown: [],
        queryTypeBreakdown: [],
        momentum: 'stable'
      }];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      }, undefined, previousPeriod);

      // comp1 went from 60% to 30% = -30 change, which is < -2 = declining
      expect(result.competitors.find(c => c.competitorId === 'comp1')?.momentum).toBe('declining');
    });
  });

  // ================================================================
  // TREND ANALYSIS TESTS
  // ================================================================

  describe('Trend Analysis', () => {
    it('should analyze upward trend', () => {
      const historicalData = [
        { period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, sov: 20, rank: 3 },
        { period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, sov: 25, rank: 2 },
        { period: { start: new Date('2024-01-15'), end: new Date('2024-01-21') }, sov: 30, rank: 2 },
        { period: { start: new Date('2024-01-22'), end: new Date('2024-01-28') }, sov: 35, rank: 1 }
      ];

      const trend = analyzeSOVTrend(historicalData, 'comp1', 'Growing Comp');

      expect(trend.overallTrend).toBe('up');
      expect(trend.avgSOV).toBeGreaterThan(25);
    });

    it('should analyze downward trend', () => {
      const historicalData = [
        { period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, sov: 40, rank: 1 },
        { period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, sov: 35, rank: 1 },
        { period: { start: new Date('2024-01-15'), end: new Date('2024-01-21') }, sov: 28, rank: 2 },
        { period: { start: new Date('2024-01-22'), end: new Date('2024-01-28') }, sov: 20, rank: 3 }
      ];

      const trend = analyzeSOVTrend(historicalData, 'comp1', 'Declining Comp');

      expect(trend.overallTrend).toBe('down');
    });

    it('should calculate volatility', () => {
      const historicalData = [
        { period: { start: new Date('2024-01-01'), end: new Date('2024-01-07') }, sov: 30, rank: 2 },
        { period: { start: new Date('2024-01-08'), end: new Date('2024-01-14') }, sov: 32, rank: 2 },
        { period: { start: new Date('2024-01-15'), end: new Date('2024-01-21') }, sov: 28, rank: 2 },
        { period: { start: new Date('2024-01-22'), end: new Date('2024-01-28') }, sov: 30, rank: 2 }
      ];

      const trend = analyzeSOVTrend(historicalData, 'comp1', 'Stable Comp');

      expect(trend.volatility).toBeDefined();
      expect(trend.volatility).toBeLessThan(5); // Low volatility
    });

    it('should handle empty historical data', () => {
      const trend = analyzeSOVTrend([], 'comp1', 'New Comp');

      expect(trend.overallTrend).toBe('stable');
      expect(trend.avgSOV).toBe(0);
      expect(trend.periods.length).toBe(0);
    });
  });

  // ================================================================
  // COMPETITOR COMPARISON TESTS
  // ================================================================

  describe('Competitor Comparison', () => {
    const competitor1: CompetitorSOV = {
      competitorId: 'comp1',
      competitorName: 'Leader Inc',
      totalSOV: 45,
      rank: 1,
      totalMentions: 450,
      positiveMentions: 300,
      negativeMentions: 50,
      neutralMentions: 100,
      avgSentiment: 0.6,
      channelBreakdown: [
        { channel: 'organic', sovPercent: 50, mentions: 225, avgSentiment: 0.7 },
        { channel: 'social', sovPercent: 30, mentions: 135, avgSentiment: 0.5 }
      ],
      queryTypeBreakdown: [],
      momentum: 'stable'
    };

    const competitor2: CompetitorSOV = {
      competitorId: 'comp2',
      competitorName: 'Challenger Corp',
      totalSOV: 30,
      rank: 2,
      totalMentions: 300,
      positiveMentions: 180,
      negativeMentions: 60,
      neutralMentions: 60,
      avgSentiment: 0.4,
      channelBreakdown: [
        { channel: 'organic', sovPercent: 40, mentions: 120, avgSentiment: 0.5 },
        { channel: 'social', sovPercent: 60, mentions: 180, avgSentiment: 0.3 }
      ],
      queryTypeBreakdown: [],
      momentum: 'rising'
    };

    it('should identify the SOV leader', () => {
      const comparison = compareCompetitorSOV(competitor1, competitor2);
      expect(comparison.leader).toBe('Leader Inc');
    });

    it('should calculate SOV difference', () => {
      const comparison = compareCompetitorSOV(competitor1, competitor2);
      expect(comparison.difference).toBe(15);
    });

    it('should compare by channel', () => {
      const comparison = compareCompetitorSOV(competitor1, competitor2);

      const organicComparison = comparison.channelComparison.find(c => c.channel === 'organic');
      expect(organicComparison?.leader).toBe('Leader Inc');

      const socialComparison = comparison.channelComparison.find(c => c.channel === 'social');
      expect(socialComparison?.leader).toBe('Challenger Corp');
    });

    it('should provide recommendation', () => {
      const comparison = compareCompetitorSOV(competitor1, competitor2);
      expect(comparison.recommendation).toBeTruthy();
      expect(comparison.recommendation.length).toBeGreaterThan(20);
    });
  });

  // ================================================================
  // UTILITY FUNCTION TESTS
  // ================================================================

  describe('Utility Functions', () => {
    it('getAllChannels should return all channel types', () => {
      const channels = getAllChannels();
      expect(channels).toContain('organic');
      expect(channels).toContain('paid');
      expect(channels).toContain('social');
      expect(channels).toContain('ai-responses');
      expect(channels.length).toBe(7);
    });

    it('getAllQueryTypes should return all query types', () => {
      const queryTypes = getAllQueryTypes();
      expect(queryTypes).toContain('brand');
      expect(queryTypes).toContain('comparison');
      expect(queryTypes).toContain('alternatives');
      expect(queryTypes.length).toBe(6);
    });

    it('calculateSOVChange should calculate percentage change', () => {
      expect(calculateSOVChange(30, 25)).toBe(20); // 20% increase
      expect(calculateSOVChange(20, 25)).toBe(-20); // 20% decrease
      expect(calculateSOVChange(25, 25)).toBe(0); // No change
    });

    it('calculateSOVChange should handle zero previous', () => {
      expect(calculateSOVChange(30, 0)).toBe(100);
      expect(calculateSOVChange(0, 0)).toBe(0);
    });

    it('formatSOV should format percentage correctly', () => {
      expect(formatSOV(45.6789)).toBe('45.7%');
      expect(formatSOV(10)).toBe('10.0%');
      expect(formatSOV(0.5)).toBe('0.5%');
    });

    it('getSOVTier should classify correctly', () => {
      expect(getSOVTier(50)).toBe('leader');
      expect(getSOVTier(30)).toBe('leader');
      expect(getSOVTier(20)).toBe('challenger');
      expect(getSOVTier(10)).toBe('follower');
      expect(getSOVTier(3)).toBe('niche');
    });
  });

  // ================================================================
  // INSIGHTS GENERATION TESTS
  // ================================================================

  describe('Insights Generation', () => {
    it('should generate market leader insight', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Market Leader', 'organic', 70),
        createMentionData('comp2', 'Follower', 'organic', 30)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.insights.some(i => i.includes('Market Leader'))).toBe(true);
      expect(result.insights.some(i => i.includes('leads'))).toBe(true);
    });

    it('should generate concentration insight for concentrated market', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Giant', 'organic', 50),
        createMentionData('comp2', 'Big', 'organic', 30),
        createMentionData('comp3', 'Small', 'organic', 15),
        createMentionData('comp4', 'Tiny', 'organic', 5)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.insights.some(i => i.includes('concentrated'))).toBe(true);
    });
  });

  // ================================================================
  // EDGE CASE TESTS
  // ================================================================

  describe('Edge Cases', () => {
    it('should handle empty mentions array', () => {
      const result = calculateSOV({
        mentions: [],
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors.length).toBe(0);
      expect(result.totalMentions).toBe(0);
      expect(result.marketLeader).toBe('Unknown');
    });

    it('should handle single mention', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Only One', 'organic', 1)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors.length).toBe(1);
      expect(result.competitors[0].totalSOV).toBe(100);
    });

    it('should handle multiple mentions for same competitor', () => {
      const mentions: MentionData[] = [
        createMentionData('comp1', 'Same Comp', 'organic', 50),
        createMentionData('comp1', 'Same Comp', 'social', 30),
        createMentionData('comp1', 'Same Comp', 'reviews', 20)
      ];

      const result = calculateSOV({
        mentions,
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-07'),
        periodType: 'weekly'
      });

      expect(result.competitors.length).toBe(1);
      expect(result.competitors[0].totalMentions).toBe(100);
    });
  });
});
