/**
 * Leaderboard Service
 *
 * Business logic for computing and retrieving leaderboard rankings
 *
 * Phase 2, Week 7, Day 2
 */

import {
  type LeaderboardEntry,
  type Leaderboard,
  type LeaderboardFilters,
  type LeaderboardStats,
  type BrandRanking,
  type IndustryCategory,
  type LeaderboardPeriod,
  INDUSTRY_LABELS,
  PERIOD_LABELS,
  DEFAULT_FILTERS,
} from './types';

// ================================================================
// MOCK DATA (Replace with database queries in production)
// ================================================================

const MOCK_BRANDS: Omit<LeaderboardEntry, 'rank' | 'previousRank'>[] = [
  { brandId: 'stripe', brandName: 'Stripe', score: 92, previousScore: 90, scoreChange: 2, trend: 'up', category: 'fintech', isVerified: true, lastUpdated: new Date() },
  { brandId: 'openai', brandName: 'OpenAI', score: 95, previousScore: 94, scoreChange: 1, trend: 'up', category: 'ai-ml', isVerified: true, lastUpdated: new Date() },
  { brandId: 'anthropic', brandName: 'Anthropic', score: 91, previousScore: 89, scoreChange: 2, trend: 'up', category: 'ai-ml', isVerified: true, lastUpdated: new Date() },
  { brandId: 'vercel', brandName: 'Vercel', score: 88, previousScore: 88, scoreChange: 0, trend: 'stable', category: 'developer-tools', isVerified: true, lastUpdated: new Date() },
  { brandId: 'figma', brandName: 'Figma', score: 87, previousScore: 89, scoreChange: -2, trend: 'down', category: 'productivity', isVerified: true, lastUpdated: new Date() },
  { brandId: 'notion', brandName: 'Notion', score: 85, previousScore: 84, scoreChange: 1, trend: 'up', category: 'productivity', isVerified: true, lastUpdated: new Date() },
  { brandId: 'linear', brandName: 'Linear', score: 84, previousScore: 82, scoreChange: 2, trend: 'up', category: 'developer-tools', isVerified: true, lastUpdated: new Date() },
  { brandId: 'supabase', brandName: 'Supabase', score: 83, previousScore: 80, scoreChange: 3, trend: 'up', category: 'developer-tools', isVerified: true, lastUpdated: new Date() },
  { brandId: 'planetscale', brandName: 'PlanetScale', score: 82, previousScore: null, scoreChange: 0, trend: 'new', category: 'developer-tools', isVerified: false, lastUpdated: new Date() },
  { brandId: 'datadog', brandName: 'Datadog', score: 81, previousScore: 83, scoreChange: -2, trend: 'down', category: 'analytics', isVerified: true, lastUpdated: new Date() },
  { brandId: 'shopify', brandName: 'Shopify', score: 86, previousScore: 85, scoreChange: 1, trend: 'up', category: 'ecommerce', isVerified: true, lastUpdated: new Date() },
  { brandId: 'twilio', brandName: 'Twilio', score: 79, previousScore: 80, scoreChange: -1, trend: 'down', category: 'developer-tools', isVerified: true, lastUpdated: new Date() },
  { brandId: 'plaid', brandName: 'Plaid', score: 80, previousScore: 78, scoreChange: 2, trend: 'up', category: 'fintech', isVerified: true, lastUpdated: new Date() },
  { brandId: 'hubspot', brandName: 'HubSpot', score: 78, previousScore: 79, scoreChange: -1, trend: 'down', category: 'marketing', isVerified: true, lastUpdated: new Date() },
  { brandId: 'segment', brandName: 'Segment', score: 77, previousScore: 75, scoreChange: 2, trend: 'up', category: 'analytics', isVerified: true, lastUpdated: new Date() },
];

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Calculate trend from score change
 */
export function calculateTrend(
  currentScore: number,
  previousScore: number | null
): 'up' | 'down' | 'stable' | 'new' {
  if (previousScore === null) return 'new';
  const change = currentScore - previousScore;
  if (change > 0) return 'up';
  if (change < 0) return 'down';
  return 'stable';
}

/**
 * Calculate percentile from rank
 */
export function calculatePercentile(rank: number, total: number): number {
  if (total === 0) return 0;
  return Math.round(((total - rank + 1) / total) * 100);
}

/**
 * Sort entries by score (descending) and assign ranks
 */
export function rankEntries(
  entries: Omit<LeaderboardEntry, 'rank' | 'previousRank'>[]
): LeaderboardEntry[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    previousRank: null, // Would be computed from historical data
  }));
}

// ================================================================
// LEADERBOARD QUERIES
// ================================================================

/**
 * Get leaderboard with filters
 */
export async function getLeaderboard(
  filters: LeaderboardFilters = {}
): Promise<Leaderboard> {
  const mergedFilters = { ...DEFAULT_FILTERS, ...filters };
  const { category, period, limit, offset, search, minScore, verifiedOnly } = mergedFilters;

  // Filter brands
  let filtered = MOCK_BRANDS.filter((brand) => {
    if (category !== 'all' && brand.category !== category) return false;
    if (minScore && brand.score < minScore) return false;
    if (verifiedOnly && !brand.isVerified) return false;
    if (search && !brand.brandName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Rank and paginate
  const ranked = rankEntries(filtered);
  const paginated = ranked.slice(offset, offset + limit);

  return {
    category: category as IndustryCategory | 'all',
    categoryLabel: category === 'all' ? 'All Industries' : INDUSTRY_LABELS[category as IndustryCategory],
    entries: paginated,
    totalEntries: ranked.length,
    lastUpdated: new Date(),
    period: period as LeaderboardPeriod,
  };
}

/**
 * Get leaderboard statistics
 */
export async function getLeaderboardStats(
  category: IndustryCategory | 'all' = 'all'
): Promise<LeaderboardStats> {
  const filtered = category === 'all'
    ? MOCK_BRANDS
    : MOCK_BRANDS.filter((b) => b.category === category);

  if (filtered.length === 0) {
    return {
      totalBrands: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      medianScore: 0,
      categoryCounts: {} as Record<IndustryCategory, number>,
      trendsUp: 0,
      trendsDown: 0,
      trendsStable: 0,
      newEntries: 0,
    };
  }

  const scores = filtered.map((b) => b.score).sort((a, b) => a - b);
  const totalBrands = filtered.length;

  // Calculate category counts
  const categoryCounts = MOCK_BRANDS.reduce(
    (acc, brand) => {
      acc[brand.category] = (acc[brand.category] || 0) + 1;
      return acc;
    },
    {} as Record<IndustryCategory, number>
  );

  // Calculate trend counts
  const trendsUp = filtered.filter((b) => b.trend === 'up').length;
  const trendsDown = filtered.filter((b) => b.trend === 'down').length;
  const trendsStable = filtered.filter((b) => b.trend === 'stable').length;
  const newEntries = filtered.filter((b) => b.trend === 'new').length;

  return {
    totalBrands,
    averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / totalBrands),
    highestScore: scores[scores.length - 1],
    lowestScore: scores[0],
    medianScore: scores[Math.floor(scores.length / 2)],
    categoryCounts,
    trendsUp,
    trendsDown,
    trendsStable,
    newEntries,
  };
}

/**
 * Get brand's ranking details
 */
export async function getBrandRanking(brandId: string): Promise<BrandRanking | null> {
  const brand = MOCK_BRANDS.find((b) => b.brandId === brandId);
  if (!brand) return null;

  // Get overall ranking
  const allRanked = rankEntries(MOCK_BRANDS);
  const overallEntry = allRanked.find((e) => e.brandId === brandId);
  if (!overallEntry) return null;

  // Get category ranking
  const categoryBrands = MOCK_BRANDS.filter((b) => b.category === brand.category);
  const categoryRanked = rankEntries(categoryBrands);
  const categoryEntry = categoryRanked.find((e) => e.brandId === brandId);

  // Get nearby brands
  const overallIndex = allRanked.findIndex((e) => e.brandId === brandId);
  const above = allRanked.slice(Math.max(0, overallIndex - 3), overallIndex);
  const below = allRanked.slice(overallIndex + 1, overallIndex + 4);

  return {
    brandId,
    overallRank: overallEntry.rank,
    overallTotal: allRanked.length,
    categoryRank: categoryEntry?.rank || 0,
    categoryTotal: categoryRanked.length,
    category: brand.category,
    percentile: calculatePercentile(overallEntry.rank, allRanked.length),
    score: brand.score,
    trend: brand.trend,
    nearbyBrands: { above, below },
  };
}

/**
 * Get top movers (biggest score changes)
 */
export async function getTopMovers(
  limit: number = 5,
  direction: 'up' | 'down' = 'up'
): Promise<LeaderboardEntry[]> {
  const withChanges = MOCK_BRANDS.filter(
    (b) => b.previousScore !== null && b.scoreChange !== 0
  );

  const sorted = [...withChanges].sort((a, b) => {
    if (direction === 'up') {
      return b.scoreChange - a.scoreChange;
    }
    return a.scoreChange - b.scoreChange;
  });

  const filtered = sorted.filter((b) => {
    if (direction === 'up') return b.scoreChange > 0;
    return b.scoreChange < 0;
  });

  return rankEntries(filtered.slice(0, limit));
}

/**
 * Get new entries to the leaderboard
 */
export async function getNewEntries(limit: number = 10): Promise<LeaderboardEntry[]> {
  const newBrands = MOCK_BRANDS.filter((b) => b.trend === 'new');
  return rankEntries(newBrands.slice(0, limit));
}

/**
 * Search brands in leaderboard
 */
export async function searchBrands(
  query: string,
  limit: number = 10
): Promise<LeaderboardEntry[]> {
  if (!query || query.length < 2) return [];

  const matches = MOCK_BRANDS.filter((b) =>
    b.brandName.toLowerCase().includes(query.toLowerCase())
  );

  return rankEntries(matches.slice(0, limit));
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  getLeaderboard,
  getLeaderboardStats,
  getBrandRanking,
  getTopMovers,
  getNewEntries,
  searchBrands,
  calculateTrend,
  calculatePercentile,
  rankEntries,
};
