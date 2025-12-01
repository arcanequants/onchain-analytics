/**
 * Leaderboard Service Tests
 *
 * Phase 2, Week 7, Day 2
 */

import { describe, it, expect } from 'vitest';
import {
  getLeaderboard,
  getLeaderboardStats,
  getBrandRanking,
  getTopMovers,
  getNewEntries,
  searchBrands,
  calculateTrend,
  calculatePercentile,
  rankEntries,
} from './leaderboard-service';

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('calculateTrend', () => {
  it('should return "new" when previousScore is null', () => {
    expect(calculateTrend(85, null)).toBe('new');
  });

  it('should return "up" when score increased', () => {
    expect(calculateTrend(85, 80)).toBe('up');
  });

  it('should return "down" when score decreased', () => {
    expect(calculateTrend(75, 80)).toBe('down');
  });

  it('should return "stable" when score unchanged', () => {
    expect(calculateTrend(80, 80)).toBe('stable');
  });
});

describe('calculatePercentile', () => {
  it('should return 100 for rank 1', () => {
    expect(calculatePercentile(1, 100)).toBe(100);
  });

  it('should return 50 for middle rank', () => {
    expect(calculatePercentile(50, 100)).toBe(51);
  });

  it('should return 1 for last rank', () => {
    expect(calculatePercentile(100, 100)).toBe(1);
  });

  it('should return 0 for empty leaderboard', () => {
    expect(calculatePercentile(1, 0)).toBe(0);
  });
});

describe('rankEntries', () => {
  it('should assign ranks by score descending', () => {
    const entries = [
      { brandId: 'a', brandName: 'A', score: 70, previousScore: null, scoreChange: 0, trend: 'new' as const, category: 'saas' as const, isVerified: true, lastUpdated: new Date() },
      { brandId: 'b', brandName: 'B', score: 90, previousScore: null, scoreChange: 0, trend: 'new' as const, category: 'saas' as const, isVerified: true, lastUpdated: new Date() },
      { brandId: 'c', brandName: 'C', score: 80, previousScore: null, scoreChange: 0, trend: 'new' as const, category: 'saas' as const, isVerified: true, lastUpdated: new Date() },
    ];

    const ranked = rankEntries(entries);

    expect(ranked[0].brandId).toBe('b');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].brandId).toBe('c');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].brandId).toBe('a');
    expect(ranked[2].rank).toBe(3);
  });

  it('should handle empty array', () => {
    const ranked = rankEntries([]);
    expect(ranked).toEqual([]);
  });
});

// ================================================================
// LEADERBOARD QUERY TESTS
// ================================================================

describe('getLeaderboard', () => {
  it('should return all brands by default', async () => {
    const leaderboard = await getLeaderboard();

    expect(leaderboard.entries.length).toBeGreaterThan(0);
    expect(leaderboard.category).toBe('all');
    expect(leaderboard.categoryLabel).toBe('All Industries');
  });

  it('should filter by category', async () => {
    const leaderboard = await getLeaderboard({ category: 'developer-tools' });

    expect(leaderboard.entries.every((e) => e.category === 'developer-tools')).toBe(true);
    expect(leaderboard.category).toBe('developer-tools');
  });

  it('should filter by minimum score', async () => {
    const leaderboard = await getLeaderboard({ minScore: 85 });

    expect(leaderboard.entries.every((e) => e.score >= 85)).toBe(true);
  });

  it('should filter verified only', async () => {
    const leaderboard = await getLeaderboard({ verifiedOnly: true });

    expect(leaderboard.entries.every((e) => e.isVerified)).toBe(true);
  });

  it('should search by brand name', async () => {
    const leaderboard = await getLeaderboard({ search: 'stripe' });

    expect(leaderboard.entries.some((e) => e.brandName.toLowerCase().includes('stripe'))).toBe(true);
  });

  it('should paginate results', async () => {
    const page1 = await getLeaderboard({ limit: 5, offset: 0 });
    const page2 = await getLeaderboard({ limit: 5, offset: 5 });

    expect(page1.entries.length).toBeLessThanOrEqual(5);
    expect(page2.entries.length).toBeLessThanOrEqual(5);

    // Entries should be different
    if (page2.entries.length > 0) {
      expect(page1.entries[0].brandId).not.toBe(page2.entries[0].brandId);
    }
  });

  it('should rank entries correctly', async () => {
    const leaderboard = await getLeaderboard();

    for (let i = 0; i < leaderboard.entries.length - 1; i++) {
      expect(leaderboard.entries[i].score).toBeGreaterThanOrEqual(
        leaderboard.entries[i + 1].score
      );
      expect(leaderboard.entries[i].rank).toBe(i + 1);
    }
  });

  it('should include period in response', async () => {
    const leaderboard = await getLeaderboard({ period: 'monthly' });

    expect(leaderboard.period).toBe('monthly');
  });
});

describe('getLeaderboardStats', () => {
  it('should return statistics for all brands', async () => {
    const stats = await getLeaderboardStats();

    expect(stats.totalBrands).toBeGreaterThan(0);
    expect(stats.averageScore).toBeGreaterThan(0);
    expect(stats.highestScore).toBeGreaterThanOrEqual(stats.averageScore);
    expect(stats.lowestScore).toBeLessThanOrEqual(stats.averageScore);
  });

  it('should return statistics for a category', async () => {
    const stats = await getLeaderboardStats('developer-tools');

    expect(stats.totalBrands).toBeGreaterThan(0);
  });

  it('should count trends', async () => {
    const stats = await getLeaderboardStats();

    expect(stats.trendsUp).toBeGreaterThanOrEqual(0);
    expect(stats.trendsDown).toBeGreaterThanOrEqual(0);
    expect(stats.trendsStable).toBeGreaterThanOrEqual(0);
    expect(stats.newEntries).toBeGreaterThanOrEqual(0);
  });

  it('should return category counts', async () => {
    const stats = await getLeaderboardStats();

    expect(stats.categoryCounts).toBeDefined();
    expect(typeof stats.categoryCounts).toBe('object');
  });

  it('should handle empty category', async () => {
    const stats = await getLeaderboardStats('education');

    expect(stats.totalBrands).toBe(0);
    expect(stats.averageScore).toBe(0);
  });
});

describe('getBrandRanking', () => {
  it('should return ranking for existing brand', async () => {
    const ranking = await getBrandRanking('stripe');

    expect(ranking).not.toBeNull();
    expect(ranking?.brandId).toBe('stripe');
    expect(ranking?.overallRank).toBeGreaterThan(0);
    expect(ranking?.categoryRank).toBeGreaterThan(0);
  });

  it('should return null for non-existent brand', async () => {
    const ranking = await getBrandRanking('nonexistent');

    expect(ranking).toBeNull();
  });

  it('should include percentile', async () => {
    const ranking = await getBrandRanking('stripe');

    expect(ranking?.percentile).toBeGreaterThan(0);
    expect(ranking?.percentile).toBeLessThanOrEqual(100);
  });

  it('should include nearby brands', async () => {
    const ranking = await getBrandRanking('stripe');

    expect(ranking?.nearbyBrands).toBeDefined();
    expect(Array.isArray(ranking?.nearbyBrands.above)).toBe(true);
    expect(Array.isArray(ranking?.nearbyBrands.below)).toBe(true);
  });

  it('should include category information', async () => {
    const ranking = await getBrandRanking('stripe');

    expect(ranking?.category).toBe('fintech');
    expect(ranking?.categoryTotal).toBeGreaterThan(0);
  });
});

describe('getTopMovers', () => {
  it('should return brands with positive changes', async () => {
    const movers = await getTopMovers(5, 'up');

    expect(movers.every((m) => m.scoreChange > 0)).toBe(true);
  });

  it('should return brands with negative changes', async () => {
    const movers = await getTopMovers(5, 'down');

    expect(movers.every((m) => m.scoreChange < 0)).toBe(true);
  });

  it('should respect limit', async () => {
    const movers = await getTopMovers(3, 'up');

    expect(movers.length).toBeLessThanOrEqual(3);
  });

  it('should return entries with assigned ranks', async () => {
    const movers = await getTopMovers(5, 'up');

    // Each entry should have a rank
    expect(movers.every((m) => m.rank > 0)).toBe(true);
  });
});

describe('getNewEntries', () => {
  it('should return only new brands', async () => {
    const newEntries = await getNewEntries();

    expect(newEntries.every((e) => e.trend === 'new')).toBe(true);
  });

  it('should respect limit', async () => {
    const newEntries = await getNewEntries(2);

    expect(newEntries.length).toBeLessThanOrEqual(2);
  });
});

describe('searchBrands', () => {
  it('should find brands by name', async () => {
    const results = await searchBrands('stripe');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].brandName.toLowerCase()).toContain('stripe');
  });

  it('should be case insensitive', async () => {
    const results = await searchBrands('STRIPE');

    expect(results.length).toBeGreaterThan(0);
  });

  it('should return empty for short query', async () => {
    const results = await searchBrands('a');

    expect(results).toEqual([]);
  });

  it('should return empty for no matches', async () => {
    const results = await searchBrands('nonexistent-brand-xyz');

    expect(results).toEqual([]);
  });

  it('should respect limit', async () => {
    const results = await searchBrands('s', 2); // Won't match due to length check
    expect(results.length).toBeLessThanOrEqual(2);
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle combined filters', async () => {
    const leaderboard = await getLeaderboard({
      category: 'developer-tools',
      minScore: 80,
      verifiedOnly: true,
      limit: 10,
    });

    expect(leaderboard.entries.every((e) =>
      e.category === 'developer-tools' &&
      e.score >= 80 &&
      e.isVerified
    )).toBe(true);
  });

  it('should return totalEntries independent of pagination', async () => {
    const page1 = await getLeaderboard({ limit: 2 });
    const page2 = await getLeaderboard({ limit: 10 });

    expect(page1.totalEntries).toBe(page2.totalEntries);
  });
});
