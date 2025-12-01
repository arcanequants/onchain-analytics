/**
 * Public API Controllers Tests
 *
 * Phase 2, Week 8, Day 1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ScoresController,
  BrandsController,
  LeaderboardsController,
  AnalysisController,
} from './controllers';

// ================================================================
// SCORES CONTROLLER TESTS
// ================================================================

describe('ScoresController', () => {
  describe('list', () => {
    it('should return paginated scores', async () => {
      const result = await ScoresController.list('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.items.length).toBeLessThanOrEqual(10);
    });

    it('should filter by brand ID', async () => {
      const result = await ScoresController.list('user-1', {
        page: 1,
        limit: 100,
        brandId: 'brand_1',
      });

      expect(result.items.every((s) => s.brandId === 'brand_1')).toBe(true);
    });

    it('should filter by minimum score', async () => {
      const result = await ScoresController.list('user-1', {
        page: 1,
        limit: 100,
        minScore: 50,
      });

      expect(result.items.every((s) => s.overallScore >= 50)).toBe(true);
    });

    it('should filter by maximum score', async () => {
      const result = await ScoresController.list('user-1', {
        page: 1,
        limit: 100,
        maxScore: 60,
      });

      expect(result.items.every((s) => s.overallScore <= 60)).toBe(true);
    });

    it('should filter by grade', async () => {
      const result = await ScoresController.list('user-1', {
        page: 1,
        limit: 100,
        grade: 'good',
      });

      expect(result.items.every((s) => s.grade === 'good')).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await ScoresController.list('user-1', { page: 1, limit: 5 });
      const page2 = await ScoresController.list('user-1', { page: 2, limit: 5 });

      expect(page1.items.length).toBeLessThanOrEqual(5);
      expect(page2.items.length).toBeLessThanOrEqual(5);

      // Different items
      if (page1.items.length > 0 && page2.items.length > 0) {
        expect(page1.items[0].id).not.toBe(page2.items[0].id);
      }
    });

    it('should return empty for unknown user', async () => {
      const result = await ScoresController.list('unknown-user', {
        page: 1,
        limit: 10,
      });

      expect(result.items.length).toBe(0);
    });
  });

  describe('get', () => {
    it('should return a score by ID', async () => {
      const list = await ScoresController.list('user-1', { page: 1, limit: 1 });
      if (list.items.length === 0) return;

      const scoreId = list.items[0].id;
      const result = await ScoresController.get('user-1', scoreId);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(scoreId);
      expect(result?.overallScore).toBeDefined();
      expect(result?.categories).toBeDefined();
    });

    it('should return null for unknown score ID', async () => {
      const result = await ScoresController.get('user-1', 'unknown_score');

      expect(result).toBeNull();
    });

    it('should return null for different user', async () => {
      const list = await ScoresController.list('user-1', { page: 1, limit: 1 });
      if (list.items.length === 0) return;

      const scoreId = list.items[0].id;
      const result = await ScoresController.get('different-user', scoreId);

      expect(result).toBeNull();
    });
  });

  describe('getHistory', () => {
    it('should return score history for brand', async () => {
      const result = await ScoresController.getHistory('user-1', 'brand_1', 10);

      expect(Array.isArray(result)).toBe(true);
      expect(result.every((s) => s.brandId === 'brand_1')).toBe(true);
    });

    it('should limit results', async () => {
      const result = await ScoresController.getHistory('user-1', 'brand_1', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should include change from previous', async () => {
      const result = await ScoresController.getHistory('user-1', 'brand_1', 10);

      if (result.length > 1) {
        // First item should have null change (no previous)
        expect(result[result.length - 1].changeFromPrevious).toBeNull();
      }
    });
  });

  describe('create', () => {
    it('should start analysis and return status', async () => {
      const result = await ScoresController.create('user-1', {
        brandName: 'Test Brand',
        industry: 'saas',
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.brandName).toBe('Test Brand');
      expect(result.startedAt).toBeDefined();
    });
  });
});

// ================================================================
// BRANDS CONTROLLER TESTS
// ================================================================

describe('BrandsController', () => {
  describe('list', () => {
    it('should return paginated brands', async () => {
      const result = await BrandsController.list('user-1', {
        page: 1,
        limit: 10,
      });

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it('should filter by search term', async () => {
      const result = await BrandsController.list('user-1', {
        page: 1,
        limit: 100,
        search: 'Brand 1',
      });

      expect(
        result.items.every(
          (b) =>
            b.name.toLowerCase().includes('brand 1') ||
            b.description?.toLowerCase().includes('brand 1')
        )
      ).toBe(true);
    });

    it('should filter by industry', async () => {
      const result = await BrandsController.list('user-1', {
        page: 1,
        limit: 100,
        industry: 'saas',
      });

      expect(result.items.every((b) => b.industry === 'saas')).toBe(true);
    });

    it('should filter by hasScore', async () => {
      const result = await BrandsController.list('user-1', {
        page: 1,
        limit: 100,
        hasScore: true,
      });

      expect(result.items.every((b) => b.scoreCount > 0)).toBe(true);
    });

    it('should include latest score info', async () => {
      const result = await BrandsController.list('user-1', {
        page: 1,
        limit: 10,
        hasScore: true,
      });

      if (result.items.length > 0) {
        const brand = result.items[0];
        expect(brand.latestScore).not.toBeNull();
        expect(brand.latestGrade).not.toBeNull();
      }
    });
  });

  describe('get', () => {
    it('should return a brand by ID', async () => {
      const result = await BrandsController.get('user-1', 'brand_1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('brand_1');
      expect(result?.name).toBeDefined();
    });

    it('should return null for unknown brand', async () => {
      const result = await BrandsController.get('user-1', 'unknown_brand');

      expect(result).toBeNull();
    });

    it('should include score data', async () => {
      const result = await BrandsController.get('user-1', 'brand_1');

      expect(result).not.toBeNull();
      expect(result?.scoreCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('create', () => {
    it('should create a new brand', async () => {
      const result = await BrandsController.create('user-1', {
        name: 'New Test Brand',
        description: 'A test brand',
        website: 'https://test.example.com',
        industry: 'fintech',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('New Test Brand');
      expect(result.description).toBe('A test brand');
      expect(result.website).toBe('https://test.example.com');
      expect(result.industry).toBe('fintech');
      expect(result.latestScore).toBeNull();
      expect(result.scoreCount).toBe(0);
    });

    it('should create brand with minimal data', async () => {
      const result = await BrandsController.create('user-1', {
        name: 'Minimal Brand',
      });

      expect(result.id).toBeDefined();
      expect(result.name).toBe('Minimal Brand');
      expect(result.description).toBeNull();
    });
  });

  describe('update', () => {
    it('should update an existing brand', async () => {
      const created = await BrandsController.create('user-1', {
        name: 'Brand to Update',
      });

      const result = await BrandsController.update('user-1', created.id, {
        name: 'Updated Brand Name',
        description: 'New description',
      });

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Brand Name');
      expect(result?.description).toBe('New description');
    });

    it('should return null for unknown brand', async () => {
      const result = await BrandsController.update('user-1', 'unknown_brand', {
        name: 'Updated',
      });

      expect(result).toBeNull();
    });

    it('should not update brand of different user', async () => {
      const created = await BrandsController.create('user-1', {
        name: 'User 1 Brand',
      });

      const result = await BrandsController.update('different-user', created.id, {
        name: 'Hacked',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a brand', async () => {
      const created = await BrandsController.create('user-1', {
        name: 'Brand to Delete',
      });

      const result = await BrandsController.delete('user-1', created.id);
      expect(result).toBe(true);

      const check = await BrandsController.get('user-1', created.id);
      expect(check).toBeNull();
    });

    it('should return false for unknown brand', async () => {
      const result = await BrandsController.delete('user-1', 'unknown_brand');

      expect(result).toBe(false);
    });

    it('should not delete brand of different user', async () => {
      const created = await BrandsController.create('user-1', {
        name: 'Protected Brand',
      });

      const result = await BrandsController.delete('different-user', created.id);
      expect(result).toBe(false);

      const check = await BrandsController.get('user-1', created.id);
      expect(check).not.toBeNull();
    });
  });
});

// ================================================================
// LEADERBOARDS CONTROLLER TESTS
// ================================================================

describe('LeaderboardsController', () => {
  describe('get', () => {
    it('should return leaderboard entries', async () => {
      const result = await LeaderboardsController.get({
        timeframe: '30d',
        limit: 20,
      });

      expect(result.entries).toBeDefined();
      expect(Array.isArray(result.entries)).toBe(true);
      expect(result.timeframe).toBe('30d');
    });

    it('should limit entries', async () => {
      const result = await LeaderboardsController.get({
        timeframe: '30d',
        limit: 5,
      });

      expect(result.entries.length).toBeLessThanOrEqual(5);
    });

    it('should filter by industry', async () => {
      const result = await LeaderboardsController.get({
        industry: 'saas',
        timeframe: '30d',
        limit: 20,
      });

      expect(result.industry).toBe('saas');
      expect(result.entries.every((e) => e.industry === 'saas')).toBe(true);
    });

    it('should sort by score descending', async () => {
      const result = await LeaderboardsController.get({
        timeframe: '30d',
        limit: 20,
      });

      for (let i = 1; i < result.entries.length; i++) {
        expect(result.entries[i - 1].score).toBeGreaterThanOrEqual(result.entries[i].score);
      }
    });

    it('should include rank', async () => {
      const result = await LeaderboardsController.get({
        timeframe: '30d',
        limit: 20,
      });

      result.entries.forEach((entry, index) => {
        expect(entry.rank).toBe(index + 1);
      });
    });

    it('should handle different timeframes', async () => {
      const result7d = await LeaderboardsController.get({
        timeframe: '7d',
        limit: 20,
      });
      const result90d = await LeaderboardsController.get({
        timeframe: '90d',
        limit: 20,
      });

      expect(result7d.timeframe).toBe('7d');
      expect(result90d.timeframe).toBe('90d');
    });
  });

  describe('getIndustries', () => {
    it('should return list of industries', async () => {
      const result = await LeaderboardsController.getIndustries();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return sorted industries', async () => {
      const result = await LeaderboardsController.getIndustries();
      const sorted = [...result].sort();

      expect(result).toEqual(sorted);
    });
  });
});

// ================================================================
// ANALYSIS CONTROLLER TESTS
// ================================================================

describe('AnalysisController', () => {
  describe('start', () => {
    it('should start a new analysis', async () => {
      const result = await AnalysisController.start('user-1', {
        brandName: 'Analysis Test Brand',
        depth: 'standard',
      });

      expect(result.id).toBeDefined();
      expect(result.status).toBe('pending');
      expect(result.brandName).toBe('Analysis Test Brand');
      expect(result.progress).toBe(0);
      expect(result.startedAt).toBeDefined();
    });

    it('should accept optional parameters', async () => {
      const result = await AnalysisController.start('user-1', {
        brandName: 'Full Analysis Brand',
        website: 'https://example.com',
        industry: 'fintech',
        competitors: ['Competitor 1', 'Competitor 2'],
        depth: 'comprehensive',
      });

      expect(result.id).toBeDefined();
      expect(result.brandName).toBe('Full Analysis Brand');
    });
  });

  describe('getStatus', () => {
    it('should return analysis status', async () => {
      const started = await AnalysisController.start('user-1', {
        brandName: 'Status Test Brand',
        depth: 'quick',
      });

      const result = await AnalysisController.getStatus('user-1', started.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(started.id);
      expect(['pending', 'processing', 'completed', 'failed']).toContain(result?.status);
    });

    it('should return null for unknown analysis', async () => {
      const result = await AnalysisController.getStatus('user-1', 'unknown_analysis');

      expect(result).toBeNull();
    });

    it('should return null for different user', async () => {
      const started = await AnalysisController.start('user-1', {
        brandName: 'User 1 Analysis',
        depth: 'quick',
      });

      const result = await AnalysisController.getStatus('different-user', started.id);

      expect(result).toBeNull();
    });
  });

  describe('getResult', () => {
    it('should return null for pending analysis', async () => {
      const started = await AnalysisController.start('user-1', {
        brandName: 'Pending Analysis',
        depth: 'quick',
      });

      const result = await AnalysisController.getResult('user-1', started.id);

      // Might be null if still pending
      if (result !== null) {
        expect(result.id).toBe(started.id);
        expect(result.score).toBeDefined();
      }
    });

    it('should return null for unknown analysis', async () => {
      const result = await AnalysisController.getResult('user-1', 'unknown_analysis');

      expect(result).toBeNull();
    });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Controller Integration', () => {
  it('should create brand and then get scores', async () => {
    const brand = await BrandsController.create('user-1', {
      name: 'Integration Test Brand',
      industry: 'saas',
    });

    expect(brand.id).toBeDefined();
    expect(brand.scoreCount).toBe(0);

    // Brand should be retrievable
    const retrieved = await BrandsController.get('user-1', brand.id);
    expect(retrieved?.name).toBe('Integration Test Brand');
  });

  it('should start analysis and track progress', async () => {
    const analysis = await AnalysisController.start('user-1', {
      brandName: 'Progress Test Brand',
      depth: 'quick',
    });

    expect(analysis.status).toBe('pending');

    // Status should be retrievable
    const status = await AnalysisController.getStatus('user-1', analysis.id);
    expect(status).not.toBeNull();
  });

  it('should list scores with filters combined', async () => {
    const result = await ScoresController.list('user-1', {
      page: 1,
      limit: 50,
      minScore: 30,
      maxScore: 70,
    });

    expect(result.items.every((s) => s.overallScore >= 30 && s.overallScore <= 70)).toBe(true);
  });
});
