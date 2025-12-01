/**
 * Query Optimizer Tests
 *
 * Phase 3, Week 9, Day 1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  QueryBuilder,
  QueryPatterns,
  QueryMetricsCollector,
  RECOMMENDED_INDEXES,
  generateIndexSQL,
  generateDropIndexSQL,
  analyzeQuery,
  generateBatchInsertSQL,
  getMetricsCollector,
  DEFAULT_POOL_CONFIG,
  PRODUCTION_POOL_CONFIG,
} from './query-optimizer';

// ================================================================
// QUERY BUILDER
// ================================================================

describe('QueryBuilder', () => {
  describe('basic queries', () => {
    it('should build simple select all query', () => {
      const { sql, params } = new QueryBuilder('users').build();

      expect(sql).toBe('SELECT * FROM users');
      expect(params).toEqual([]);
    });

    it('should build select with specific columns', () => {
      const { sql } = new QueryBuilder<{ id: string; name: string; email: string }>('users')
        .select('id', 'name')
        .build();

      expect(sql).toBe('SELECT id, name FROM users');
    });

    it('should build query with where clause', () => {
      const { sql, params } = new QueryBuilder<{ id: string; status: string }>('analyses')
        .where('status', '=', 'pending')
        .build();

      expect(sql).toBe('SELECT * FROM analyses WHERE status = $1');
      expect(params).toEqual(['pending']);
    });

    it('should build query with multiple where clauses', () => {
      const { sql, params } = new QueryBuilder<{ user_id: string; status: string }>('analyses')
        .where('user_id', '=', 'user123')
        .where('status', '=', 'completed')
        .build();

      expect(sql).toBe('SELECT * FROM analyses WHERE user_id = $1 AND status = $2');
      expect(params).toEqual(['user123', 'completed']);
    });
  });

  describe('where variations', () => {
    it('should build whereIn clause', () => {
      const { sql, params } = new QueryBuilder<{ id: string; status: string }>('analyses')
        .whereIn('status', ['pending', 'processing'])
        .build();

      expect(sql).toBe('SELECT * FROM analyses WHERE status IN ($1, $2)');
      expect(params).toEqual(['pending', 'processing']);
    });

    it('should build whereNull clause', () => {
      const { sql, params } = new QueryBuilder<{ deleted_at: Date }>('users')
        .whereNull('deleted_at')
        .build();

      expect(sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL');
      expect(params).toEqual([]);
    });

    it('should build whereNotNull clause', () => {
      const { sql, params } = new QueryBuilder<{ overall_score: number }>('analyses')
        .whereNotNull('overall_score')
        .build();

      expect(sql).toBe('SELECT * FROM analyses WHERE overall_score IS NOT NULL');
      expect(params).toEqual([]);
    });

    it('should build whereLike clause', () => {
      const { sql, params } = new QueryBuilder<{ brand_name: string }>('analyses')
        .whereLike('brand_name', 'Apple')
        .build();

      expect(sql).toBe('SELECT * FROM analyses WHERE brand_name ILIKE $1');
      expect(params).toEqual(['%Apple%']);
    });
  });

  describe('ordering', () => {
    it('should build query with order by', () => {
      const { sql } = new QueryBuilder<{ created_at: Date }>('analyses')
        .orderBy('created_at', 'desc')
        .build();

      expect(sql).toBe('SELECT * FROM analyses ORDER BY created_at DESC');
    });

    it('should build query with multiple order by', () => {
      const { sql } = new QueryBuilder<{ priority: string; created_at: Date }>('tasks')
        .orderBy('priority', 'asc')
        .orderBy('created_at', 'desc')
        .build();

      expect(sql).toBe('SELECT * FROM tasks ORDER BY priority ASC, created_at DESC');
    });
  });

  describe('pagination', () => {
    it('should build query with limit', () => {
      const { sql } = new QueryBuilder('analyses').limit(10).build();

      expect(sql).toBe('SELECT * FROM analyses LIMIT 10');
    });

    it('should build query with limit and offset', () => {
      const { sql } = new QueryBuilder('analyses').limit(10).offset(20).build();

      expect(sql).toBe('SELECT * FROM analyses LIMIT 10 OFFSET 20');
    });

    it('should build query with paginate helper', () => {
      const { sql } = new QueryBuilder('analyses').paginate(3, 10).build();

      expect(sql).toBe('SELECT * FROM analyses LIMIT 10 OFFSET 20');
    });

    it('should handle page 1 correctly', () => {
      const { sql } = new QueryBuilder('analyses').paginate(1, 25).build();

      expect(sql).toBe('SELECT * FROM analyses LIMIT 25 OFFSET 0');
    });
  });

  describe('complex queries', () => {
    it('should build complete query with all options', () => {
      const { sql, params } = new QueryBuilder<{
        id: string;
        brand_name: string;
        overall_score: number;
        user_id: string;
        created_at: Date;
      }>('analyses')
        .select('id', 'brand_name', 'overall_score')
        .where('user_id', '=', 'user123')
        .whereNotNull('overall_score')
        .orderBy('overall_score', 'desc')
        .paginate(1, 20)
        .build();

      expect(sql).toBe(
        'SELECT id, brand_name, overall_score FROM analyses ' +
          'WHERE user_id = $1 AND overall_score IS NOT NULL ' +
          'ORDER BY overall_score DESC LIMIT 20 OFFSET 0'
      );
      expect(params).toEqual(['user123']);
    });
  });

  describe('count query', () => {
    it('should build count query', () => {
      const { sql, params } = new QueryBuilder<{ status: string }>('analyses')
        .where('status', '=', 'completed')
        .buildCount();

      expect(sql).toBe('SELECT COUNT(*) as count FROM analyses WHERE status = $1');
      expect(params).toEqual(['completed']);
    });
  });
});

// ================================================================
// QUERY PATTERNS
// ================================================================

describe('QueryPatterns', () => {
  describe('userAnalysesPaginated', () => {
    it('should generate correct query', () => {
      const { sql, params } = QueryPatterns.userAnalysesPaginated('user123', 1, 20);

      expect(sql).toContain('SELECT id, brand_name, url, status, overall_score, created_at');
      expect(sql).toContain('FROM analyses');
      expect(sql).toContain('WHERE user_id = $1');
      expect(sql).toContain('ORDER BY created_at DESC');
      expect(sql).toContain('LIMIT 20');
      expect(sql).toContain('OFFSET 0');
      expect(params).toEqual(['user123']);
    });

    it('should calculate correct offset for page 2', () => {
      const { sql } = QueryPatterns.userAnalysesPaginated('user123', 2, 20);

      expect(sql).toContain('OFFSET 20');
    });
  });

  describe('pendingAnalyses', () => {
    it('should generate correct query', () => {
      const { sql, params } = QueryPatterns.pendingAnalyses(10);

      expect(sql).toContain("WHERE status = $1");
      expect(sql).toContain('ORDER BY created_at ASC');
      expect(sql).toContain('LIMIT 10');
      expect(params).toEqual(['pending']);
    });
  });

  describe('analysisByShareToken', () => {
    it('should generate correct query', () => {
      const { sql, params } = QueryPatterns.analysisByShareToken('abc123');

      expect(sql).toContain('WHERE share_token = $1 AND share_token IS NOT NULL');
      expect(sql).toContain('LIMIT 1');
      expect(params).toEqual(['abc123']);
    });
  });

  describe('publicLeaderboard', () => {
    it('should generate correct query', () => {
      const { sql, params } = QueryPatterns.publicLeaderboard(50);

      expect(sql).toContain('WHERE is_public = $1 AND overall_score IS NOT NULL');
      expect(sql).toContain('ORDER BY overall_score DESC');
      expect(sql).toContain('LIMIT 50');
      expect(params).toEqual([true]);
    });
  });

  describe('searchBrands', () => {
    it('should generate search query', () => {
      const { sql, params } = QueryPatterns.searchBrands('Apple', 20);

      expect(sql).toContain('WHERE brand_name ILIKE $1');
      expect(sql).toContain('ORDER BY overall_score DESC');
      expect(sql).toContain('LIMIT 20');
      expect(params).toEqual(['%Apple%']);
    });
  });

  describe('activeRecommendations', () => {
    it('should filter out dismissed and completed', () => {
      const { sql, params } = QueryPatterns.activeRecommendations('analysis123');

      expect(sql).toContain('WHERE analysis_id = $1');
      expect(sql).toContain('is_dismissed = $2');
      expect(sql).toContain('is_completed = $3');
      expect(params).toEqual(['analysis123', false, false]);
    });
  });
});

// ================================================================
// QUERY METRICS COLLECTOR
// ================================================================

describe('QueryMetricsCollector', () => {
  let collector: QueryMetricsCollector;

  beforeEach(() => {
    collector = new QueryMetricsCollector();
  });

  describe('record', () => {
    it('should record a metric', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });

      const metrics = collector.getRecentMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].table).toBe('analyses');
      expect(metrics[0].duration).toBe(50);
    });

    it('should assign queryId and timestamp', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });

      const metrics = collector.getRecentMetrics(1);
      expect(metrics[0].queryId).toMatch(/^qm_/);
      expect(metrics[0].timestamp).toBeInstanceOf(Date);
    });
  });

  describe('getSlowQueries', () => {
    it('should return queries above threshold', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });
      collector.record({
        table: 'users',
        operation: 'select',
        duration: 150,
        rowsAffected: 1,
        cacheHit: false,
      });
      collector.record({
        table: 'recommendations',
        operation: 'select',
        duration: 200,
        rowsAffected: 5,
        cacheHit: false,
      });

      const slowQueries = collector.getSlowQueries(100);
      expect(slowQueries).toHaveLength(2);
      expect(slowQueries.map((q) => q.table)).toContain('users');
      expect(slowQueries.map((q) => q.table)).toContain('recommendations');
    });

    it('should return empty array when no slow queries', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });

      const slowQueries = collector.getSlowQueries(100);
      expect(slowQueries).toHaveLength(0);
    });
  });

  describe('getStatsByTable', () => {
    it('should calculate stats per table', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 100,
        rowsAffected: 20,
        cacheHit: false,
      });
      collector.record({
        table: 'users',
        operation: 'select',
        duration: 30,
        rowsAffected: 1,
        cacheHit: true,
      });

      const stats = collector.getStatsByTable();

      expect(stats['analyses'].count).toBe(2);
      expect(stats['analyses'].totalDuration).toBe(150);
      expect(stats['analyses'].avgDuration).toBe(75);

      expect(stats['users'].count).toBe(1);
      expect(stats['users'].avgDuration).toBe(30);
    });
  });

  describe('getCacheHitRate', () => {
    it('should calculate cache hit rate', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: true,
      });
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: true,
      });
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });

      const hitRate = collector.getCacheHitRate();
      expect(hitRate).toBe(50);
    });

    it('should return 0 for empty metrics', () => {
      const hitRate = collector.getCacheHitRate();
      expect(hitRate).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all metrics', () => {
      collector.record({
        table: 'analyses',
        operation: 'select',
        duration: 50,
        rowsAffected: 10,
        cacheHit: false,
      });

      collector.clear();

      const metrics = collector.getRecentMetrics();
      expect(metrics).toHaveLength(0);
    });
  });
});

// ================================================================
// INDEX GENERATION
// ================================================================

describe('Index Generation', () => {
  describe('generateIndexSQL', () => {
    it('should generate basic index', () => {
      const indexes = [
        {
          name: 'idx_test',
          table: 'analyses' as const,
          columns: ['user_id'],
        },
      ];

      const sql = generateIndexSQL(indexes);

      expect(sql).toHaveLength(1);
      expect(sql[0]).toBe('CREATE INDEX IF NOT EXISTS idx_test ON analyses (user_id);');
    });

    it('should generate unique index', () => {
      const indexes = [
        {
          name: 'idx_email',
          table: 'user_profiles' as const,
          columns: ['email'],
          unique: true,
        },
      ];

      const sql = generateIndexSQL(indexes);

      expect(sql[0]).toBe('CREATE UNIQUE INDEX IF NOT EXISTS idx_email ON user_profiles (email);');
    });

    it('should generate composite index', () => {
      const indexes = [
        {
          name: 'idx_composite',
          table: 'analyses' as const,
          columns: ['user_id', 'created_at'],
        },
      ];

      const sql = generateIndexSQL(indexes);

      expect(sql[0]).toBe(
        'CREATE INDEX IF NOT EXISTS idx_composite ON analyses (user_id, created_at);'
      );
    });

    it('should generate partial index', () => {
      const indexes = [
        {
          name: 'idx_pending',
          table: 'analyses' as const,
          columns: ['status'],
          partial: "status = 'pending'",
        },
      ];

      const sql = generateIndexSQL(indexes);

      expect(sql[0]).toBe(
        "CREATE INDEX IF NOT EXISTS idx_pending ON analyses (status) WHERE status = 'pending';"
      );
    });

    it('should generate GIN index', () => {
      const indexes = [
        {
          name: 'idx_brand_gin',
          table: 'analyses' as const,
          columns: ['brand_name'],
          using: 'gin' as const,
        },
      ];

      const sql = generateIndexSQL(indexes);

      expect(sql[0]).toBe(
        'CREATE INDEX IF NOT EXISTS idx_brand_gin ON analyses USING gin (brand_name);'
      );
    });
  });

  describe('generateDropIndexSQL', () => {
    it('should generate drop index statements', () => {
      const indexes = [
        { name: 'idx_test1', table: 'analyses' as const, columns: ['id'] },
        { name: 'idx_test2', table: 'users' as const, columns: ['email'] },
      ];

      const sql = generateDropIndexSQL(indexes);

      expect(sql).toEqual([
        'DROP INDEX IF EXISTS idx_test1;',
        'DROP INDEX IF EXISTS idx_test2;',
      ]);
    });
  });

  describe('RECOMMENDED_INDEXES', () => {
    it('should have valid index definitions', () => {
      for (const idx of RECOMMENDED_INDEXES) {
        expect(idx.name).toMatch(/^idx_/);
        expect(idx.table).toBeTruthy();
        expect(idx.columns.length).toBeGreaterThan(0);
      }
    });

    it('should have indexes for critical tables', () => {
      const tables = RECOMMENDED_INDEXES.map((idx) => idx.table);

      expect(tables).toContain('analyses');
      expect(tables).toContain('user_profiles');
      expect(tables).toContain('ai_responses');
      expect(tables).toContain('recommendations');
    });
  });
});

// ================================================================
// QUERY ANALYZER
// ================================================================

describe('analyzeQuery', () => {
  it('should detect index coverage', () => {
    const analysis = analyzeQuery('analyses', ['id', 'brand_name'], [
      { column: 'user_id', operator: '=' },
      { column: 'created_at', operator: '>' },
    ]);

    expect(analysis.hasIndex).toBe(true);
    expect(analysis.usedIndexes).toContain('idx_analyses_user_created');
  });

  it('should suggest index for uncovered query', () => {
    const analysis = analyzeQuery('analyses', ['id'], [
      { column: 'nonexistent_column', operator: '=' },
    ]);

    expect(analysis.hasIndex).toBe(false);
    expect(analysis.suggestions.length).toBeGreaterThan(0);
    expect(analysis.estimatedCost).toBe('high');
  });

  it('should warn about LIKE operations', () => {
    const analysis = analyzeQuery('analyses', ['id'], [{ column: 'brand_name', operator: 'LIKE' }]);

    expect(analysis.suggestions.some((s) => s.includes('LIKE'))).toBe(true);
  });

  it('should warn about OR conditions', () => {
    const analysis = analyzeQuery('analyses', ['id'], [{ column: 'status', operator: 'OR' }]);

    expect(analysis.suggestions.some((s) => s.includes('OR'))).toBe(true);
  });
});

// ================================================================
// BATCH INSERT
// ================================================================

describe('generateBatchInsertSQL', () => {
  it('should generate batch insert statements', () => {
    const records = [
      { name: 'Test 1', value: 100 },
      { name: 'Test 2', value: 200 },
      { name: 'Test 3', value: 300 },
    ];

    const batches = generateBatchInsertSQL('items', records, { chunkSize: 2 });

    expect(batches).toHaveLength(2);
    expect(batches[0].sql).toContain('INSERT INTO items (name, value) VALUES');
    expect(batches[0].params).toEqual(['Test 1', 100, 'Test 2', 200]);
    expect(batches[1].params).toEqual(['Test 3', 300]);
  });

  it('should handle empty records', () => {
    const batches = generateBatchInsertSQL('items', []);
    expect(batches).toHaveLength(0);
  });

  it('should call progress callback', () => {
    const records = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const progress: number[] = [];

    generateBatchInsertSQL('items', records, {
      chunkSize: 3,
      onProgress: (completed) => progress.push(completed),
    });

    expect(progress).toEqual([3, 6, 9, 10]);
  });
});

// ================================================================
// POOL CONFIG
// ================================================================

describe('Pool Configuration', () => {
  it('should have valid default config', () => {
    expect(DEFAULT_POOL_CONFIG.min).toBeLessThan(DEFAULT_POOL_CONFIG.max);
    expect(DEFAULT_POOL_CONFIG.idleTimeout).toBeGreaterThan(0);
    expect(DEFAULT_POOL_CONFIG.connectionTimeout).toBeGreaterThan(0);
  });

  it('should have higher limits for production', () => {
    expect(PRODUCTION_POOL_CONFIG.max).toBeGreaterThan(DEFAULT_POOL_CONFIG.max);
    expect(PRODUCTION_POOL_CONFIG.min).toBeGreaterThan(DEFAULT_POOL_CONFIG.min);
  });
});

// ================================================================
// SINGLETON
// ================================================================

describe('getMetricsCollector', () => {
  it('should return same instance', () => {
    const collector1 = getMetricsCollector();
    const collector2 = getMetricsCollector();

    expect(collector1).toBe(collector2);
  });
});
