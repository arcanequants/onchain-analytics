/**
 * Leaderboard Types
 *
 * Type definitions for industry rankings and leaderboards
 *
 * Phase 2, Week 7, Day 2
 */

// ================================================================
// INDUSTRY CATEGORIES
// ================================================================

export const INDUSTRY_CATEGORIES = [
  'saas',
  'fintech',
  'ecommerce',
  'healthcare',
  'ai-ml',
  'developer-tools',
  'marketing',
  'productivity',
  'security',
  'analytics',
  'education',
  'entertainment',
  'social',
  'other',
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];

export const INDUSTRY_LABELS: Record<IndustryCategory, string> = {
  'saas': 'SaaS',
  'fintech': 'FinTech',
  'ecommerce': 'E-Commerce',
  'healthcare': 'Healthcare',
  'ai-ml': 'AI & Machine Learning',
  'developer-tools': 'Developer Tools',
  'marketing': 'Marketing',
  'productivity': 'Productivity',
  'security': 'Security',
  'analytics': 'Analytics',
  'education': 'Education',
  'entertainment': 'Entertainment',
  'social': 'Social',
  'other': 'Other',
};

// ================================================================
// LEADERBOARD ENTRY
// ================================================================

export interface LeaderboardEntry {
  rank: number;
  previousRank: number | null;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  score: number;
  previousScore: number | null;
  scoreChange: number;
  trend: 'up' | 'down' | 'stable' | 'new';
  category: IndustryCategory;
  isVerified: boolean;
  lastUpdated: Date;
}

// ================================================================
// LEADERBOARD
// ================================================================

export interface Leaderboard {
  category: IndustryCategory | 'all';
  categoryLabel: string;
  entries: LeaderboardEntry[];
  totalEntries: number;
  lastUpdated: Date;
  period: LeaderboardPeriod;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

export const PERIOD_LABELS: Record<LeaderboardPeriod, string> = {
  'daily': 'Today',
  'weekly': 'This Week',
  'monthly': 'This Month',
  'all-time': 'All Time',
};

// ================================================================
// LEADERBOARD FILTERS
// ================================================================

export interface LeaderboardFilters {
  category?: IndustryCategory | 'all';
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
  search?: string;
  minScore?: number;
  verifiedOnly?: boolean;
}

export const DEFAULT_FILTERS: Required<LeaderboardFilters> = {
  category: 'all',
  period: 'weekly',
  limit: 50,
  offset: 0,
  search: '',
  minScore: 0,
  verifiedOnly: false,
};

// ================================================================
// LEADERBOARD STATS
// ================================================================

export interface LeaderboardStats {
  totalBrands: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  categoryCounts: Record<IndustryCategory, number>;
  trendsUp: number;
  trendsDown: number;
  trendsStable: number;
  newEntries: number;
}

// ================================================================
// BRAND RANKING
// ================================================================

export interface BrandRanking {
  brandId: string;
  overallRank: number;
  overallTotal: number;
  categoryRank: number;
  categoryTotal: number;
  category: IndustryCategory;
  percentile: number;
  score: number;
  trend: 'up' | 'down' | 'stable' | 'new';
  nearbyBrands: {
    above: LeaderboardEntry[];
    below: LeaderboardEntry[];
  };
}
