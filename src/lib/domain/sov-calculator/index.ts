/**
 * Share of Voice (SOV) Calculator Module
 * Phase 1, Week 2, Day 6 - Domain Tasks
 *
 * Calculates and tracks share of voice metrics for competitors
 * across different channels and query types.
 */

// ================================================================
// TYPES
// ================================================================

export type Channel =
  | 'organic'
  | 'paid'
  | 'social'
  | 'pr'
  | 'reviews'
  | 'forums'
  | 'ai-responses';

export type QueryType =
  | 'brand'
  | 'category'
  | 'comparison'
  | 'reviews'
  | 'how-to'
  | 'alternatives';

export type PeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface MentionData {
  competitorId: string;
  competitorName: string;
  channel: Channel;
  queryType: QueryType;
  count: number;
  sentiment: number; // -1 to 1
  date: Date;
}

export interface SOVInput {
  mentions: MentionData[];
  periodStart: Date;
  periodEnd: Date;
  periodType: PeriodType;
}

export interface ChannelSOV {
  channel: Channel;
  sovPercent: number;
  mentions: number;
  avgSentiment: number;
}

export interface QueryTypeSOV {
  queryType: QueryType;
  sovPercent: number;
  mentions: number;
}

export interface CompetitorSOV {
  competitorId: string;
  competitorName: string;
  totalSOV: number;
  rank: number;
  totalMentions: number;
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  avgSentiment: number;
  channelBreakdown: ChannelSOV[];
  queryTypeBreakdown: QueryTypeSOV[];
  momentum: 'rising' | 'stable' | 'declining' | 'unknown';
}

export interface SOVAnalysis {
  periodStart: Date;
  periodEnd: Date;
  periodType: PeriodType;
  totalMentions: number;
  competitorCount: number;
  competitors: CompetitorSOV[];
  marketLeader: string;
  channelSummary: Record<Channel, { total: number; leader: string }>;
  insights: string[];
}

export interface SOVTrend {
  competitorId: string;
  competitorName: string;
  periods: {
    periodStart: Date;
    periodEnd: Date;
    sov: number;
    rank: number;
    change: number;
  }[];
  overallTrend: 'up' | 'down' | 'stable';
  avgSOV: number;
  volatility: number;
}

export interface SOVComparison {
  competitor1: { id: string; name: string; sov: number };
  competitor2: { id: string; name: string; sov: number };
  leader: string;
  difference: number;
  channelComparison: {
    channel: Channel;
    competitor1SOV: number;
    competitor2SOV: number;
    leader: string;
  }[];
  recommendation: string;
}

// ================================================================
// CHANNEL WEIGHTS
// ================================================================

const DEFAULT_CHANNEL_WEIGHTS: Record<Channel, number> = {
  'organic': 1.0,
  'paid': 0.7,
  'social': 0.8,
  'pr': 1.2,
  'reviews': 1.1,
  'forums': 0.9,
  'ai-responses': 1.3
};

const INDUSTRY_CHANNEL_WEIGHTS: Record<string, Partial<Record<Channel, number>>> = {
  saas: {
    'ai-responses': 1.4,
    'reviews': 1.3,
    'organic': 1.1
  },
  fintech: {
    'pr': 1.4,
    'reviews': 1.3,
    'organic': 1.0
  },
  healthcare: {
    'reviews': 1.4,
    'organic': 1.2,
    'social': 0.6
  },
  ecommerce: {
    'reviews': 1.5,
    'social': 1.2,
    'paid': 0.9
  },
  restaurant: {
    'reviews': 1.6,
    'social': 1.3,
    'organic': 0.8
  }
};

// ================================================================
// CORE SOV CALCULATION
// ================================================================

/**
 * Calculate Share of Voice from mention data
 */
export function calculateSOV(
  input: SOVInput,
  industrySlug?: string,
  previousPeriod?: CompetitorSOV[]
): SOVAnalysis {
  const { mentions, periodStart, periodEnd, periodType } = input;

  // Get channel weights
  const channelWeights = {
    ...DEFAULT_CHANNEL_WEIGHTS,
    ...(industrySlug ? INDUSTRY_CHANNEL_WEIGHTS[industrySlug] || {} : {})
  };

  // Group mentions by competitor
  const competitorMentions = groupMentionsByCompetitor(mentions);

  // Calculate total weighted mentions
  let totalWeightedMentions = 0;
  for (const mention of mentions) {
    totalWeightedMentions += (channelWeights[mention.channel] || 1) * mention.count;
  }

  // Calculate SOV for each competitor
  const competitorSOVs: CompetitorSOV[] = [];

  for (const [competitorId, data] of Object.entries(competitorMentions)) {
    const weightedMentions = data.mentions.reduce((sum, m) =>
      sum + (channelWeights[m.channel] || 1) * m.count, 0
    );

    const totalSOV = totalWeightedMentions > 0
      ? (weightedMentions / totalWeightedMentions) * 100
      : 0;

    // Calculate channel breakdown
    const channelBreakdown = calculateChannelBreakdown(data.mentions, channelWeights);

    // Calculate query type breakdown
    const queryTypeBreakdown = calculateQueryTypeBreakdown(data.mentions);

    // Calculate sentiment breakdown
    const sentimentBreakdown = calculateSentimentBreakdown(data.mentions);

    // Determine momentum
    const previousSOV = previousPeriod?.find(p => p.competitorId === competitorId);
    const momentum = determineMomentum(totalSOV, previousSOV?.totalSOV);

    competitorSOVs.push({
      competitorId,
      competitorName: data.name,
      totalSOV: Math.round(totalSOV * 100) / 100,
      rank: 0, // Will be set after sorting
      totalMentions: data.totalMentions,
      ...sentimentBreakdown,
      channelBreakdown,
      queryTypeBreakdown,
      momentum
    });
  }

  // Sort by SOV and assign ranks
  competitorSOVs.sort((a, b) => b.totalSOV - a.totalSOV);
  competitorSOVs.forEach((c, i) => {
    c.rank = i + 1;
  });

  // Calculate channel summary
  const channelSummary = calculateChannelSummary(mentions, competitorMentions);

  // Generate insights
  const insights = generateSOVInsights(competitorSOVs, channelSummary, previousPeriod);

  return {
    periodStart,
    periodEnd,
    periodType,
    totalMentions: mentions.reduce((sum, m) => sum + m.count, 0),
    competitorCount: competitorSOVs.length,
    competitors: competitorSOVs,
    marketLeader: competitorSOVs[0]?.competitorName || 'Unknown',
    channelSummary,
    insights
  };
}

/**
 * Group mentions by competitor
 */
function groupMentionsByCompetitor(mentions: MentionData[]): Record<string, {
  name: string;
  mentions: MentionData[];
  totalMentions: number;
}> {
  const result: Record<string, { name: string; mentions: MentionData[]; totalMentions: number }> = {};

  for (const mention of mentions) {
    if (!result[mention.competitorId]) {
      result[mention.competitorId] = {
        name: mention.competitorName,
        mentions: [],
        totalMentions: 0
      };
    }
    result[mention.competitorId].mentions.push(mention);
    result[mention.competitorId].totalMentions += mention.count;
  }

  return result;
}

/**
 * Calculate channel breakdown for a competitor
 */
function calculateChannelBreakdown(
  mentions: MentionData[],
  weights: Record<Channel, number>
): ChannelSOV[] {
  const channelData: Record<Channel, { mentions: number; sentimentSum: number }> = {} as any;

  for (const mention of mentions) {
    if (!channelData[mention.channel]) {
      channelData[mention.channel] = { mentions: 0, sentimentSum: 0 };
    }
    channelData[mention.channel].mentions += mention.count;
    channelData[mention.channel].sentimentSum += mention.sentiment * mention.count;
  }

  const totalMentions = mentions.reduce((sum, m) => sum + m.count, 0);

  return Object.entries(channelData).map(([channel, data]) => ({
    channel: channel as Channel,
    sovPercent: totalMentions > 0 ? Math.round((data.mentions / totalMentions) * 10000) / 100 : 0,
    mentions: data.mentions,
    avgSentiment: data.mentions > 0
      ? Math.round((data.sentimentSum / data.mentions) * 1000) / 1000
      : 0
  }));
}

/**
 * Calculate query type breakdown for a competitor
 */
function calculateQueryTypeBreakdown(mentions: MentionData[]): QueryTypeSOV[] {
  const queryData: Record<QueryType, number> = {} as any;

  for (const mention of mentions) {
    if (!queryData[mention.queryType]) {
      queryData[mention.queryType] = 0;
    }
    queryData[mention.queryType] += mention.count;
  }

  const totalMentions = mentions.reduce((sum, m) => sum + m.count, 0);

  return Object.entries(queryData).map(([queryType, count]) => ({
    queryType: queryType as QueryType,
    sovPercent: totalMentions > 0 ? Math.round((count / totalMentions) * 10000) / 100 : 0,
    mentions: count
  }));
}

/**
 * Calculate sentiment breakdown
 */
function calculateSentimentBreakdown(mentions: MentionData[]): {
  positiveMentions: number;
  negativeMentions: number;
  neutralMentions: number;
  avgSentiment: number;
} {
  let positive = 0;
  let negative = 0;
  let neutral = 0;
  let sentimentSum = 0;
  let totalCount = 0;

  for (const mention of mentions) {
    if (mention.sentiment > 0.2) {
      positive += mention.count;
    } else if (mention.sentiment < -0.2) {
      negative += mention.count;
    } else {
      neutral += mention.count;
    }
    sentimentSum += mention.sentiment * mention.count;
    totalCount += mention.count;
  }

  return {
    positiveMentions: positive,
    negativeMentions: negative,
    neutralMentions: neutral,
    avgSentiment: totalCount > 0 ? Math.round((sentimentSum / totalCount) * 1000) / 1000 : 0
  };
}

/**
 * Determine momentum based on SOV change
 */
function determineMomentum(
  currentSOV: number,
  previousSOV?: number
): 'rising' | 'stable' | 'declining' | 'unknown' {
  if (previousSOV === undefined) return 'unknown';

  const change = currentSOV - previousSOV;
  if (change > 2) return 'rising';
  if (change < -2) return 'declining';
  return 'stable';
}

/**
 * Calculate channel summary across all competitors
 */
function calculateChannelSummary(
  mentions: MentionData[],
  competitorMentions: Record<string, { name: string; mentions: MentionData[]; totalMentions: number }>
): Record<Channel, { total: number; leader: string }> {
  const channels: Channel[] = ['organic', 'paid', 'social', 'pr', 'reviews', 'forums', 'ai-responses'];
  const result: Record<Channel, { total: number; leader: string }> = {} as any;

  for (const channel of channels) {
    const channelMentions = mentions.filter(m => m.channel === channel);
    const total = channelMentions.reduce((sum, m) => sum + m.count, 0);

    // Find leader for this channel
    let maxMentions = 0;
    let leader = 'None';

    for (const [_, data] of Object.entries(competitorMentions)) {
      const competitorChannelMentions = data.mentions
        .filter(m => m.channel === channel)
        .reduce((sum, m) => sum + m.count, 0);

      if (competitorChannelMentions > maxMentions) {
        maxMentions = competitorChannelMentions;
        leader = data.name;
      }
    }

    result[channel] = { total, leader };
  }

  return result;
}

/**
 * Generate SOV insights
 */
function generateSOVInsights(
  competitors: CompetitorSOV[],
  channelSummary: Record<Channel, { total: number; leader: string }>,
  previousPeriod?: CompetitorSOV[]
): string[] {
  const insights: string[] = [];

  if (competitors.length === 0) {
    return ['No competitor data available for analysis'];
  }

  // Market leader insight
  const leader = competitors[0];
  insights.push(
    `${leader.competitorName} leads share of voice with ${leader.totalSOV.toFixed(1)}% SOV`
  );

  // SOV concentration
  const top3SOV = competitors.slice(0, 3).reduce((sum, c) => sum + c.totalSOV, 0);
  if (top3SOV > 70) {
    insights.push(`Market is highly concentrated - top 3 competitors hold ${top3SOV.toFixed(1)}% of voice`);
  } else if (top3SOV < 50) {
    insights.push(`Market is fragmented - top 3 competitors hold only ${top3SOV.toFixed(1)}% of voice`);
  }

  // Rising competitors
  const rising = competitors.filter(c => c.momentum === 'rising');
  if (rising.length > 0) {
    insights.push(`Rising competitors: ${rising.map(c => c.competitorName).join(', ')}`);
  }

  // Channel dominance
  const channelLeaders = new Map<string, string[]>();
  for (const [channel, data] of Object.entries(channelSummary)) {
    if (data.total > 0) {
      const existing = channelLeaders.get(data.leader) || [];
      existing.push(channel);
      channelLeaders.set(data.leader, existing);
    }
  }

  for (const [leaderName, channels] of channelLeaders) {
    if (channels.length >= 3) {
      insights.push(`${leaderName} dominates ${channels.length} channels: ${channels.join(', ')}`);
    }
  }

  // AI responses insight
  if (channelSummary['ai-responses']?.total > 0) {
    insights.push(
      `AI responses channel is active with ${channelSummary['ai-responses'].leader} leading`
    );
  }

  // Sentiment insight
  const avgSentiment = competitors.reduce((sum, c) => sum + c.avgSentiment, 0) / competitors.length;
  if (avgSentiment > 0.3) {
    insights.push('Overall market sentiment is positive');
  } else if (avgSentiment < -0.1) {
    insights.push('Market sentiment shows concerning negative trends');
  }

  return insights.slice(0, 5);
}

// ================================================================
// TREND ANALYSIS
// ================================================================

/**
 * Analyze SOV trend over multiple periods
 */
export function analyzeSOVTrend(
  historicalData: { period: { start: Date; end: Date }; sov: number; rank: number }[],
  competitorId: string,
  competitorName: string
): SOVTrend {
  if (historicalData.length === 0) {
    return {
      competitorId,
      competitorName,
      periods: [],
      overallTrend: 'stable',
      avgSOV: 0,
      volatility: 0
    };
  }

  const periods = historicalData.map((data, index) => ({
    periodStart: data.period.start,
    periodEnd: data.period.end,
    sov: data.sov,
    rank: data.rank,
    change: index > 0 ? data.sov - historicalData[index - 1].sov : 0
  }));

  // Calculate average SOV
  const avgSOV = historicalData.reduce((sum, d) => sum + d.sov, 0) / historicalData.length;

  // Calculate volatility (standard deviation)
  const variance = historicalData.reduce((sum, d) =>
    sum + Math.pow(d.sov - avgSOV, 2), 0) / historicalData.length;
  const volatility = Math.sqrt(variance);

  // Determine overall trend using linear regression
  const n = historicalData.length;
  if (n < 2) {
    return {
      competitorId,
      competitorName,
      periods,
      overallTrend: 'stable',
      avgSOV: Math.round(avgSOV * 100) / 100,
      volatility: Math.round(volatility * 100) / 100
    };
  }

  // Simple linear regression for trend
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  historicalData.forEach((d, i) => {
    sumX += i;
    sumY += d.sov;
    sumXY += i * d.sov;
    sumX2 += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  let overallTrend: 'up' | 'down' | 'stable';
  if (slope > 0.5) overallTrend = 'up';
  else if (slope < -0.5) overallTrend = 'down';
  else overallTrend = 'stable';

  return {
    competitorId,
    competitorName,
    periods,
    overallTrend,
    avgSOV: Math.round(avgSOV * 100) / 100,
    volatility: Math.round(volatility * 100) / 100
  };
}

// ================================================================
// COMPETITOR COMPARISON
// ================================================================

/**
 * Compare SOV between two competitors
 */
export function compareCompetitorSOV(
  competitor1: CompetitorSOV,
  competitor2: CompetitorSOV
): SOVComparison {
  const leader = competitor1.totalSOV >= competitor2.totalSOV
    ? competitor1.competitorName
    : competitor2.competitorName;

  const difference = Math.abs(competitor1.totalSOV - competitor2.totalSOV);

  // Compare by channel
  const allChannels = new Set([
    ...competitor1.channelBreakdown.map(c => c.channel),
    ...competitor2.channelBreakdown.map(c => c.channel)
  ]);

  const channelComparison = Array.from(allChannels).map(channel => {
    const c1 = competitor1.channelBreakdown.find(c => c.channel === channel);
    const c2 = competitor2.channelBreakdown.find(c => c.channel === channel);

    const c1SOV = c1?.sovPercent || 0;
    const c2SOV = c2?.sovPercent || 0;

    return {
      channel,
      competitor1SOV: c1SOV,
      competitor2SOV: c2SOV,
      leader: c1SOV >= c2SOV ? competitor1.competitorName : competitor2.competitorName
    };
  });

  // Generate recommendation
  let recommendation: string;
  if (difference < 5) {
    recommendation = `${competitor1.competitorName} and ${competitor2.competitorName} have similar share of voice. Focus on differentiation in specific channels.`;
  } else if (competitor1.totalSOV > competitor2.totalSOV) {
    const weakChannels = channelComparison
      .filter(c => c.leader === competitor2.competitorName)
      .map(c => c.channel);

    if (weakChannels.length > 0) {
      recommendation = `${competitor1.competitorName} leads overall but trails in ${weakChannels.join(', ')}. Consider strengthening presence in these channels.`;
    } else {
      recommendation = `${competitor1.competitorName} dominates across all channels. ${competitor2.competitorName} needs a differentiated strategy.`;
    }
  } else {
    recommendation = `${competitor2.competitorName} has the SOV advantage. ${competitor1.competitorName} should focus on building presence.`;
  }

  return {
    competitor1: {
      id: competitor1.competitorId,
      name: competitor1.competitorName,
      sov: competitor1.totalSOV
    },
    competitor2: {
      id: competitor2.competitorId,
      name: competitor2.competitorName,
      sov: competitor2.totalSOV
    },
    leader,
    difference: Math.round(difference * 100) / 100,
    channelComparison,
    recommendation
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get all channels
 */
export function getAllChannels(): Channel[] {
  return ['organic', 'paid', 'social', 'pr', 'reviews', 'forums', 'ai-responses'];
}

/**
 * Get all query types
 */
export function getAllQueryTypes(): QueryType[] {
  return ['brand', 'category', 'comparison', 'reviews', 'how-to', 'alternatives'];
}

/**
 * Get channel weights for an industry
 */
export function getChannelWeights(industrySlug?: string): Record<Channel, number> {
  return {
    ...DEFAULT_CHANNEL_WEIGHTS,
    ...(industrySlug ? INDUSTRY_CHANNEL_WEIGHTS[industrySlug] || {} : {})
  };
}

/**
 * Calculate SOV change percentage
 */
export function calculateSOVChange(currentSOV: number, previousSOV: number): number {
  if (previousSOV === 0) return currentSOV > 0 ? 100 : 0;
  return Math.round(((currentSOV - previousSOV) / previousSOV) * 10000) / 100;
}

/**
 * Format SOV for display
 */
export function formatSOV(sov: number): string {
  return `${sov.toFixed(1)}%`;
}

/**
 * Get SOV tier based on percentage
 */
export function getSOVTier(sov: number): 'leader' | 'challenger' | 'follower' | 'niche' {
  if (sov >= 30) return 'leader';
  if (sov >= 15) return 'challenger';
  if (sov >= 5) return 'follower';
  return 'niche';
}
