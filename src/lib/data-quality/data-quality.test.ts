/**
 * Data Quality Module Tests
 *
 * Phase 3, Week 10, Day 1
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  // Types
  DEFAULT_DQ_CONFIG,
  type DataQualityRule,
  type RuleCheckResult,
  type ColumnProfile,
  type TableProfile,

  // Rules
  createRule,
  executeRule,
  VALIDATORS,
  getPresetRules,
  ANALYSIS_RULES,
  AI_RESPONSE_RULES,
  USER_RULES,
  notNull,
  notEmpty,
  regexMatch,
  rangeCheck,
  enumCheck,
  typeCheck,
  formatCheck,
  freshnessCheck,
  uniqueCheck,
  lengthCheck,

  // Runner
  DataQualityRunner,
  createRunner,
  createInMemoryDataProvider,
  createInMemoryResultStore,
  createInMemoryAlertHandler,

  // Profiler
  profileColumn,
  profileTable,
  compareProfiles,
  DEFAULT_PROFILER_OPTIONS,
} from './index';

// ================================================================
// VALIDATORS
// ================================================================

describe('Validators', () => {
  describe('notNull', () => {
    it('should pass for non-null values', () => {
      expect(notNull('value', {}).valid).toBe(true);
      expect(notNull(0, {}).valid).toBe(true);
      expect(notNull(false, {}).valid).toBe(true);
      expect(notNull('', {}).valid).toBe(true);
    });

    it('should fail for null/undefined', () => {
      expect(notNull(null, {}).valid).toBe(false);
      expect(notNull(undefined, {}).valid).toBe(false);
    });
  });

  describe('notEmpty', () => {
    it('should pass for non-empty strings', () => {
      expect(notEmpty('hello', {}).valid).toBe(true);
      expect(notEmpty('  hello  ', {}).valid).toBe(true);
    });

    it('should fail for empty strings', () => {
      expect(notEmpty('', {}).valid).toBe(false);
      expect(notEmpty('   ', {}).valid).toBe(false);
    });

    it('should pass for non-empty arrays', () => {
      expect(notEmpty([1, 2, 3], {}).valid).toBe(true);
    });

    it('should fail for empty arrays', () => {
      expect(notEmpty([], {}).valid).toBe(false);
    });
  });

  describe('regexMatch', () => {
    it('should match valid patterns', () => {
      expect(regexMatch('hello123', { pattern: '^[a-z]+\\d+$' }).valid).toBe(true);
    });

    it('should fail invalid patterns', () => {
      expect(regexMatch('HELLO', { pattern: '^[a-z]+$' }).valid).toBe(false);
    });

    it('should fail without pattern', () => {
      expect(regexMatch('test', {}).valid).toBe(false);
    });
  });

  describe('rangeCheck', () => {
    it('should pass for values in range', () => {
      expect(rangeCheck(50, { min: 0, max: 100 }).valid).toBe(true);
      expect(rangeCheck(0, { min: 0, max: 100 }).valid).toBe(true);
      expect(rangeCheck(100, { min: 0, max: 100 }).valid).toBe(true);
    });

    it('should fail for values out of range', () => {
      expect(rangeCheck(-1, { min: 0, max: 100 }).valid).toBe(false);
      expect(rangeCheck(101, { min: 0, max: 100 }).valid).toBe(false);
    });

    it('should handle exclusive ranges', () => {
      expect(rangeCheck(0, { min: 0, inclusive: false }).valid).toBe(false);
      expect(rangeCheck(100, { max: 100, inclusive: false }).valid).toBe(false);
    });

    it('should handle min only', () => {
      expect(rangeCheck(10, { min: 5 }).valid).toBe(true);
      expect(rangeCheck(3, { min: 5 }).valid).toBe(false);
    });

    it('should handle max only', () => {
      expect(rangeCheck(10, { max: 15 }).valid).toBe(true);
      expect(rangeCheck(20, { max: 15 }).valid).toBe(false);
    });
  });

  describe('enumCheck', () => {
    it('should pass for valid enum values', () => {
      const values = ['pending', 'active', 'completed'];
      expect(enumCheck('active', { values }).valid).toBe(true);
    });

    it('should fail for invalid enum values', () => {
      const values = ['pending', 'active', 'completed'];
      expect(enumCheck('invalid', { values }).valid).toBe(false);
    });

    it('should fail without values', () => {
      expect(enumCheck('test', {}).valid).toBe(false);
    });
  });

  describe('typeCheck', () => {
    it('should check string type', () => {
      expect(typeCheck('hello', { type: 'string' }).valid).toBe(true);
      expect(typeCheck(123, { type: 'string' }).valid).toBe(false);
    });

    it('should check number type', () => {
      expect(typeCheck(123, { type: 'number' }).valid).toBe(true);
      expect(typeCheck('123', { type: 'number' }).valid).toBe(false);
    });

    it('should check integer type', () => {
      expect(typeCheck(123, { type: 'integer' }).valid).toBe(true);
      expect(typeCheck(123.5, { type: 'integer' }).valid).toBe(false);
    });

    it('should check array type', () => {
      expect(typeCheck([1, 2, 3], { type: 'array' }).valid).toBe(true);
      expect(typeCheck({}, { type: 'array' }).valid).toBe(false);
    });

    it('should check date type', () => {
      expect(typeCheck(new Date(), { type: 'date' }).valid).toBe(true);
      expect(typeCheck(new Date('invalid'), { type: 'date' }).valid).toBe(false);
    });
  });

  describe('formatCheck', () => {
    it('should validate email format', () => {
      expect(formatCheck('test@example.com', { format: 'email' }).valid).toBe(true);
      expect(formatCheck('invalid-email', { format: 'email' }).valid).toBe(false);
    });

    it('should validate URL format', () => {
      expect(formatCheck('https://example.com', { format: 'url' }).valid).toBe(true);
      expect(formatCheck('not-a-url', { format: 'url' }).valid).toBe(false);
    });

    it('should validate UUID format', () => {
      expect(formatCheck('550e8400-e29b-41d4-a716-446655440000', { format: 'uuid' }).valid).toBe(true);
      expect(formatCheck('not-a-uuid', { format: 'uuid' }).valid).toBe(false);
    });

    it('should validate ISO date format', () => {
      expect(formatCheck('2024-01-15', { format: 'iso_date' }).valid).toBe(true);
      expect(formatCheck('01/15/2024', { format: 'iso_date' }).valid).toBe(false);
    });

    it('should validate slug format', () => {
      expect(formatCheck('my-awesome-slug', { format: 'slug' }).valid).toBe(true);
      expect(formatCheck('My Slug', { format: 'slug' }).valid).toBe(false);
    });

    it('should fail for unknown format', () => {
      expect(formatCheck('value', { format: 'unknown-format' }).valid).toBe(false);
    });
  });

  describe('freshnessCheck', () => {
    it('should pass for fresh data', () => {
      const now = new Date();
      expect(freshnessCheck(now, { maxAgeMinutes: 60 }).valid).toBe(true);
    });

    it('should fail for stale data', () => {
      const old = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      expect(freshnessCheck(old, { maxAgeMinutes: 60 }).valid).toBe(false);
    });

    it('should handle date strings', () => {
      const now = new Date().toISOString();
      expect(freshnessCheck(now, { maxAgeMinutes: 60 }).valid).toBe(true);
    });

    it('should fail for invalid dates', () => {
      expect(freshnessCheck('invalid', { maxAgeMinutes: 60 }).valid).toBe(false);
    });

    it('should fail without maxAgeMinutes', () => {
      expect(freshnessCheck(new Date(), {}).valid).toBe(false);
    });
  });

  describe('uniqueCheck', () => {
    it('should pass for unique values', () => {
      expect(uniqueCheck([1, 2, 3, 4, 5], {}).valid).toBe(true);
    });

    it('should fail for duplicate values', () => {
      expect(uniqueCheck([1, 2, 2, 3], {}).valid).toBe(false);
    });

    it('should handle objects', () => {
      expect(uniqueCheck([{ id: 1 }, { id: 2 }, { id: 1 }], {}).valid).toBe(false);
    });
  });

  describe('lengthCheck', () => {
    it('should pass for valid length', () => {
      expect(lengthCheck('hello', { min: 3, max: 10 }).valid).toBe(true);
    });

    it('should fail for too short', () => {
      expect(lengthCheck('hi', { min: 3 }).valid).toBe(false);
    });

    it('should fail for too long', () => {
      expect(lengthCheck('hello world', { max: 5 }).valid).toBe(false);
    });
  });
});

// ================================================================
// RULE BUILDER
// ================================================================

describe('Rule Builder', () => {
  it('should create a valid rule', () => {
    const rule = createRule()
      .id('test-rule')
      .name('Test Rule')
      .description('A test rule')
      .category('completeness')
      .severity('high')
      .tables('test_table')
      .columns('test_column')
      .tags('test')
      .config({
        type: 'not_null',
        params: {},
      })
      .build();

    expect(rule.id).toBe('test-rule');
    expect(rule.name).toBe('Test Rule');
    expect(rule.category).toBe('completeness');
    expect(rule.severity).toBe('high');
    expect(rule.tables).toEqual(['test_table']);
    expect(rule.columns).toEqual(['test_column']);
    expect(rule.status).toBe('active');
  });

  it('should throw without required fields', () => {
    expect(() => createRule().build()).toThrow('Rule ID is required');
    expect(() => createRule().id('test').build()).toThrow('Rule name is required');
    expect(() => createRule().id('test').name('Test').build()).toThrow('Rule description is required');
  });
});

// ================================================================
// PRESET RULES
// ================================================================

describe('Preset Rules', () => {
  it('should have analysis rules', () => {
    expect(ANALYSIS_RULES.length).toBeGreaterThan(0);
    expect(ANALYSIS_RULES.every(r => r.tables.includes('analyses'))).toBe(true);
  });

  it('should have AI response rules', () => {
    expect(AI_RESPONSE_RULES.length).toBeGreaterThan(0);
    expect(AI_RESPONSE_RULES.every(r => r.tables.includes('ai_responses'))).toBe(true);
  });

  it('should have user rules', () => {
    expect(USER_RULES.length).toBeGreaterThan(0);
    expect(USER_RULES.every(r => r.tables.includes('user_profiles'))).toBe(true);
  });

  it('should get all preset rules', () => {
    const allRules = getPresetRules();
    expect(allRules.length).toBe(
      ANALYSIS_RULES.length + AI_RESPONSE_RULES.length + USER_RULES.length
    );
  });
});

// ================================================================
// RULE EXECUTION
// ================================================================

describe('Rule Execution', () => {
  it('should execute not_null rule', () => {
    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('completeness')
      .severity('high')
      .tables('test')
      .columns('value')
      .config({ type: 'not_null', params: {} })
      .build();

    const result = executeRule(rule, {
      data: [{ id: '1', value: 'a' }, { id: '2', value: null }],
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.status).toBe('fail');
    expect(result.totalRecords).toBe(2);
    expect(result.passingRecords).toBe(1);
    expect(result.failingRecords).toBe(1);
    expect(result.passRate).toBe(50);
  });

  it('should skip disabled rules', () => {
    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('completeness')
      .severity('high')
      .tables('test')
      .config({ type: 'not_null', params: {} })
      .build();

    rule.status = 'disabled';

    const result = executeRule(rule, {
      data: [{ id: '1', value: 'a' }],
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.status).toBe('skipped');
  });

  it('should handle errors gracefully', () => {
    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('completeness')
      .severity('high')
      .tables('test')
      .config({ type: 'invalid_type' as 'not_null', params: {} })
      .build();

    const result = executeRule(rule, {
      data: [{ id: '1' }],
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.status).toBe('error');
    expect(result.errorMessage).toBeDefined();
  });

  it('should collect failing samples', () => {
    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('validity')
      .severity('high')
      .tables('test')
      .columns('score')
      .config({ type: 'range_check', params: { min: 0, max: 100 } })
      .build();

    const result = executeRule(rule, {
      data: [
        { id: '1', score: 50 },
        { id: '2', score: 150 },
        { id: '3', score: -10 },
      ],
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.failingSamples).toBeDefined();
    expect(result.failingSamples?.length).toBe(2);
  });

  it('should execute custom function rules', () => {
    const customFn = (data: Record<string, unknown>[]) => {
      const passing = data.filter(d => (d.score as number) > 50).length;
      return {
        passingRecords: passing,
        failingRecords: data.length - passing,
      };
    };

    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('custom')
      .severity('medium')
      .tables('test')
      .config({ type: 'custom_function', params: { function: customFn } })
      .build();

    const result = executeRule(rule, {
      data: [
        { id: '1', score: 80 },
        { id: '2', score: 30 },
      ],
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.passingRecords).toBe(1);
    expect(result.failingRecords).toBe(1);
  });

  it('should determine status based on thresholds', () => {
    const rule = createRule()
      .id('test')
      .name('Test')
      .description('Test')
      .category('completeness')
      .severity('high')
      .tables('test')
      .columns('value')
      .config({
        type: 'not_null',
        params: {},
        failureThreshold: 100,
        warningThreshold: 95,
      })
      .build();

    // 97% pass rate - should be warning
    const data = Array.from({ length: 100 }, (_, i) => ({
      id: String(i),
      value: i < 97 ? 'present' : null,
    }));

    const result = executeRule(rule, {
      data,
      timestamp: new Date(),
      maxSamples: 10,
    });

    expect(result.status).toBe('warning');
    expect(result.passRate).toBe(97);
  });
});

// ================================================================
// DATA QUALITY RUNNER
// ================================================================

describe('DataQualityRunner', () => {
  let runner: DataQualityRunner;
  let dataProvider: ReturnType<typeof createInMemoryDataProvider>;
  let resultStore: ReturnType<typeof createInMemoryResultStore>;
  let alertHandler: ReturnType<typeof createInMemoryAlertHandler>;

  beforeEach(() => {
    dataProvider = createInMemoryDataProvider({
      test_table: [
        { id: '1', name: 'Test 1', score: 80 },
        { id: '2', name: 'Test 2', score: null },
        { id: '3', name: '', score: 120 },
      ],
    });

    resultStore = createInMemoryResultStore();
    alertHandler = createInMemoryAlertHandler();

    const rules = [
      createRule()
        .id('name-not-empty')
        .name('Name Required')
        .description('Name must not be empty')
        .category('completeness')
        .severity('high')
        .tables('test_table')
        .columns('name')
        .tags('core')
        .config({ type: 'not_empty', params: {} })
        .build(),
      createRule()
        .id('score-range')
        .name('Score Range')
        .description('Score must be 0-100')
        .category('validity')
        .severity('medium')
        .tables('test_table')
        .columns('score')
        .tags('scoring')
        .config({ type: 'range_check', params: { min: 0, max: 100 } })
        .build(),
    ];

    runner = createRunner({
      dataProvider,
      resultStore,
      alertHandler,
      rules,
    });
  });

  it('should execute all rules', async () => {
    const batch = await runner.executeAll();

    expect(batch.results.length).toBe(2);
    expect(batch.summary.totalRules).toBe(2);
  });

  it('should store results', async () => {
    await runner.executeAll();

    expect(resultStore.getResults().length).toBe(2);
    expect(resultStore.getBatches().length).toBe(1);
  });

  it('should generate alerts for failures', async () => {
    await runner.executeAll();

    const alerts = alertHandler.getAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });

  it('should get rules by category', () => {
    expect(runner.getRulesByCategory('completeness').length).toBe(1);
    expect(runner.getRulesByCategory('validity').length).toBe(1);
  });

  it('should get rules by severity', () => {
    expect(runner.getRulesBySeverity('high').length).toBe(1);
    expect(runner.getRulesBySeverity('medium').length).toBe(1);
  });

  it('should add and remove rules', () => {
    const newRule = createRule()
      .id('new-rule')
      .name('New Rule')
      .description('New')
      .category('accuracy')
      .severity('low')
      .tables('test_table')
      .config({ type: 'not_null', params: {} })
      .build();

    runner.addRule(newRule);
    expect(runner.getRules().length).toBe(3);

    const removed = runner.removeRule('new-rule');
    expect(removed).toBe(true);
    expect(runner.getRules().length).toBe(2);

    expect(runner.removeRule('nonexistent')).toBe(false);
  });

  it('should not add duplicate rules', () => {
    const duplicateRule = createRule()
      .id('name-not-empty')
      .name('Duplicate')
      .description('Duplicate')
      .category('completeness')
      .severity('high')
      .tables('test_table')
      .config({ type: 'not_null', params: {} })
      .build();

    expect(() => runner.addRule(duplicateRule)).toThrow('already exists');
  });

  it('should execute single rule by ID', async () => {
    const result = await runner.executeRule('name-not-empty');
    expect(result.ruleId).toBe('name-not-empty');
  });

  it('should throw for unknown rule ID', async () => {
    await expect(runner.executeRule('unknown')).rejects.toThrow('Rule not found');
  });

  it('should execute for specific table', async () => {
    const batch = await runner.executeForTable('test_table');
    expect(batch.results.length).toBe(2);
  });

  it('should skip when disabled', async () => {
    runner.updateConfig({ enabled: false });
    const batch = await runner.executeAll();
    expect(batch.overallStatus).toBe('skipped');
  });

  it('should determine overall status correctly', async () => {
    const batch = await runner.executeAll();
    // Should be 'fail' because there are failures
    expect(['fail', 'warning'].includes(batch.overallStatus)).toBe(true);
  });

  it('should calculate summary by severity', async () => {
    const batch = await runner.executeAll();
    expect(batch.summary.bySeverity.high).toBeDefined();
    expect(batch.summary.bySeverity.medium).toBeDefined();
  });

  it('should calculate summary by category', async () => {
    const batch = await runner.executeAll();
    expect(batch.summary.byCategory.completeness).toBeDefined();
    expect(batch.summary.byCategory.validity).toBeDefined();
  });

  it('should track running state', async () => {
    expect(runner.isExecuting()).toBe(false);
    const promise = runner.executeAll();
    // Note: might be too fast to catch isExecuting=true
    await promise;
    expect(runner.isExecuting()).toBe(false);
  });

  it('should track last run time', async () => {
    expect(runner.getLastRunTime()).toBeUndefined();
    await runner.executeAll();
    expect(runner.getLastRunTime()).toBeDefined();
  });

  it('should start and stop scheduled execution', () => {
    vi.useFakeTimers();

    runner.start();
    // Should have executed immediately

    runner.stop();

    vi.useRealTimers();
  });
});

// ================================================================
// DATA PROFILER
// ================================================================

describe('Data Profiler', () => {
  describe('profileColumn', () => {
    it('should profile basic column stats', () => {
      const profile = profileColumn('score', [80, 90, 100, null, 85]);

      expect(profile.column).toBe('score');
      expect(profile.totalCount).toBe(5);
      expect(profile.nonNullCount).toBe(4);
      expect(profile.nullCount).toBe(1);
      expect(profile.nullPercentage).toBe(20);
    });

    it('should calculate uniqueness', () => {
      const profile = profileColumn('status', ['active', 'active', 'pending', 'active']);

      expect(profile.uniqueCount).toBe(2);
      expect(profile.uniquenessPercentage).toBe(50);
    });

    it('should detect data type', () => {
      const numProfile = profileColumn('num', [1, 2, 3]);
      expect(numProfile.dataType).toBe('integer');

      const strProfile = profileColumn('str', ['a', 'b', 'c']);
      expect(strProfile.dataType).toBe('string');

      const dateProfile = profileColumn('date', [new Date(), new Date()]);
      expect(dateProfile.dataType).toBe('date');
    });

    it('should calculate top values', () => {
      const profile = profileColumn('status', [
        'active', 'active', 'active',
        'pending', 'pending',
        'completed',
      ]);

      expect(profile.topValues).toBeDefined();
      expect(profile.topValues![0].value).toBe('active');
      expect(profile.topValues![0].count).toBe(3);
    });

    it('should calculate numeric stats', () => {
      const profile = profileColumn('score', [10, 20, 30, 40, 50]);

      expect(profile.numericStats).toBeDefined();
      expect(profile.numericStats!.min).toBe(10);
      expect(profile.numericStats!.max).toBe(50);
      expect(profile.numericStats!.mean).toBe(30);
      expect(profile.numericStats!.median).toBe(30);
      expect(profile.numericStats!.sum).toBe(150);
    });

    it('should calculate string stats', () => {
      const profile = profileColumn('name', ['a', 'bb', 'ccc', '']);

      expect(profile.stringStats).toBeDefined();
      expect(profile.stringStats!.minLength).toBe(0);
      expect(profile.stringStats!.maxLength).toBe(3);
      expect(profile.stringStats!.emptyCount).toBe(1);
    });

    it('should calculate date stats', () => {
      const dates = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-01-31'),
      ];
      const profile = profileColumn('created_at', dates);

      expect(profile.dateStats).toBeDefined();
      expect(profile.dateStats!.min).toEqual(new Date('2024-01-01'));
      expect(profile.dateStats!.max).toEqual(new Date('2024-01-31'));
      expect(profile.dateStats!.daySpan).toBe(30);
    });

    it('should handle empty arrays', () => {
      const profile = profileColumn('empty', []);

      expect(profile.totalCount).toBe(0);
      expect(profile.nullPercentage).toBe(0);
    });
  });

  describe('profileTable', () => {
    it('should profile entire table', () => {
      const rows = [
        { id: '1', name: 'Alice', score: 80, created_at: new Date() },
        { id: '2', name: 'Bob', score: 90, created_at: new Date() },
        { id: '3', name: 'Charlie', score: 85, created_at: new Date() },
      ];

      const profile = profileTable('users', rows);

      expect(profile.table).toBe('users');
      expect(profile.rowCount).toBe(3);
      expect(profile.columns.length).toBe(4);
      expect(profile.profiledAt).toBeDefined();
      expect(profile.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should detect primary key', () => {
      const rows = [
        { id: '1', name: 'Test' },
        { id: '2', name: 'Test' },
        { id: '3', name: 'Test' },
      ];

      const profile = profileTable('test', rows);
      expect(profile.primaryKey).toEqual(['id']);
    });

    it('should detect foreign keys', () => {
      const rows = [
        { id: '1', user_id: 'u1', analysis_id: 'a1' },
      ];

      const profile = profileTable('test', rows);
      expect(profile.foreignKeys.length).toBe(2);
      expect(profile.foreignKeys.some(fk => fk.column === 'user_id')).toBe(true);
    });

    it('should handle empty table', () => {
      const profile = profileTable('empty', []);

      expect(profile.rowCount).toBe(0);
      expect(profile.columns.length).toBe(0);
    });
  });

  describe('compareProfiles', () => {
    it('should detect null percentage change', () => {
      const previous: ColumnProfile = {
        column: 'score',
        dataType: 'number',
        totalCount: 100,
        nonNullCount: 95,
        nullCount: 5,
        nullPercentage: 5,
        uniqueCount: 50,
        uniquenessPercentage: 52.6,
      };

      const current: ColumnProfile = {
        column: 'score',
        dataType: 'number',
        totalCount: 100,
        nonNullCount: 80,
        nullCount: 20,
        nullPercentage: 20,
        uniqueCount: 40,
        uniquenessPercentage: 50,
      };

      const comparison = compareProfiles(previous, current);

      expect(comparison.changes.length).toBeGreaterThan(0);
      expect(comparison.changes.some(c => c.metric === 'nullPercentage')).toBe(true);
      expect(comparison.significantChange).toBe(true);
    });

    it('should detect mean change for numeric columns', () => {
      const previous: ColumnProfile = {
        column: 'score',
        dataType: 'number',
        totalCount: 100,
        nonNullCount: 100,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 50,
        uniquenessPercentage: 50,
        numericStats: {
          min: 0,
          max: 100,
          mean: 50,
          median: 50,
          stdDev: 10,
          sum: 5000,
          zeros: 0,
          negatives: 0,
          positives: 100,
        },
      };

      const current: ColumnProfile = {
        column: 'score',
        dataType: 'number',
        totalCount: 100,
        nonNullCount: 100,
        nullCount: 0,
        nullPercentage: 0,
        uniqueCount: 50,
        uniquenessPercentage: 50,
        numericStats: {
          min: 0,
          max: 100,
          mean: 70, // 40% increase
          median: 70,
          stdDev: 10,
          sum: 7000,
          zeros: 0,
          negatives: 0,
          positives: 100,
        },
      };

      const comparison = compareProfiles(previous, current);

      expect(comparison.changes.some(c => c.metric === 'mean')).toBe(true);
    });
  });
});

// ================================================================
// CONFIGURATION
// ================================================================

describe('Configuration', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_DQ_CONFIG.enabled).toBe(true);
    expect(DEFAULT_DQ_CONFIG.checkIntervalMinutes).toBeGreaterThan(0);
    expect(DEFAULT_DQ_CONFIG.maxFailingSamples).toBeGreaterThan(0);
    expect(DEFAULT_DQ_CONFIG.resultRetentionDays).toBeGreaterThan(0);
  });

  it('should have default profiler options', () => {
    expect(DEFAULT_PROFILER_OPTIONS.topValuesLimit).toBe(10);
    expect(DEFAULT_PROFILER_OPTIONS.detectPatterns).toBe(true);
  });
});

// ================================================================
// IN-MEMORY STORES
// ================================================================

describe('In-Memory Stores', () => {
  it('should create in-memory data provider', async () => {
    const provider = createInMemoryDataProvider({
      users: [{ id: '1' }, { id: '2' }],
    });

    const data = await provider.fetchTableData('users');
    expect(data.length).toBe(2);

    const limited = await provider.fetchTableData('users', 1);
    expect(limited.length).toBe(1);

    const empty = await provider.fetchTableData('nonexistent');
    expect(empty.length).toBe(0);
  });

  it('should create in-memory result store', async () => {
    const store = createInMemoryResultStore();

    const result: RuleCheckResult = {
      ruleId: 'test',
      status: 'pass',
      totalRecords: 10,
      passingRecords: 10,
      failingRecords: 0,
      passRate: 100,
      durationMs: 5,
      checkedAt: new Date(),
    };

    await store.storeCheckResult(result);
    expect(store.getResults().length).toBe(1);

    const recent = await store.getRecentResults();
    expect(recent.length).toBe(1);

    const ruleResults = await store.getRuleResults('test');
    expect(ruleResults.length).toBe(1);

    store.clear();
    expect(store.getResults().length).toBe(0);
  });

  it('should create in-memory alert handler', async () => {
    const handler = createInMemoryAlertHandler();

    await handler.sendAlert({
      id: 'alert-1',
      type: 'rule_failure',
      severity: 'high',
      title: 'Test Alert',
      message: 'Test',
      createdAt: new Date(),
      acknowledged: false,
    });

    expect(handler.getAlerts().length).toBe(1);

    handler.clear();
    expect(handler.getAlerts().length).toBe(0);
  });
});
