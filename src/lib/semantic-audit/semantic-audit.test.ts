/**
 * Semantic Audit Tests
 *
 * Comprehensive tests for data quality and validation
 *
 * Phase 3, Week 10
 */

import { describe, it, expect } from 'vitest';
import {
  // Rules
  createCompletenessRule,
  createUniquenessRule,
  createValidityRule,
  createConsistencyRule,
  createRangeRule,
  validateRule,
  validateRules,
  EMAIL_RULE,
  URL_RULE,
  UUID_RULE,
  // Anomaly Detection
  detectOutliers,
  detectOutliersIQR,
  detectMissingValues,
  detectDuplicates,
  detectFormatAnomalies,
  detectAutoFormat,
  detectTemporalAnomalies,
  detectOutOfRange,
  detectAllAnomalies,
  // Orphans
  detectOrphans,
  detectAllOrphans,
  detectSelfReferenceOrphans,
  checkBidirectionalRelationship,
  findCascadeImpact,
  getIntegrityStats,
  groupOrphansByTable,
  // Schema
  validateSchema,
  stringField,
  numberField,
  integerField,
  booleanField,
  emailField,
  urlField,
  uuidField,
  dateField,
  arrayField,
  objectField,
  enumField,
  inferSchema,
  // Report
  generateAuditReport,
  quickAudit,
  DEFAULT_AUDIT_CONFIG,
} from './index';

// ================================================================
// TEST DATA
// ================================================================

const sampleRecords = [
  { id: 1, name: 'John', email: 'john@example.com', age: 30, score: 85 },
  { id: 2, name: 'Jane', email: 'jane@example.com', age: 25, score: 92 },
  { id: 3, name: 'Bob', email: 'bob@example.com', age: 35, score: 78 },
  { id: 4, name: 'Alice', email: 'alice@example.com', age: 28, score: 88 },
  { id: 5, name: 'Charlie', email: 'charlie@example.com', age: 45, score: 95 },
];

const recordsWithIssues = [
  { id: 1, name: 'John', email: 'john@example.com', age: 30 },
  { id: 2, name: '', email: 'invalid-email', age: -5 },
  { id: 3, name: null, email: 'bob@example.com', age: 200 },
  { id: 2, name: 'Duplicate', email: 'dup@example.com', age: 25 }, // Duplicate id
  { id: 4, name: 'Alice', email: null, age: 28 },
];

// ================================================================
// RULES TESTS
// ================================================================

describe('Semantic Audit: Rules', () => {
  describe('createCompletenessRule', () => {
    it('should create a completeness rule', () => {
      const rule = createCompletenessRule('test', 'Test Rule', ['name', 'email']);
      expect(rule.id).toBe('test');
      expect(rule.category).toBe('completeness');
      expect(rule.fields).toEqual(['name', 'email']);
      expect(rule.enabled).toBe(true);
    });
  });

  describe('createUniquenessRule', () => {
    it('should create a uniqueness rule', () => {
      const rule = createUniquenessRule('unique-id', 'Unique ID', ['id']);
      expect(rule.id).toBe('unique-id');
      expect(rule.category).toBe('uniqueness');
    });
  });

  describe('createValidityRule', () => {
    it('should create a validity rule with pattern', () => {
      const rule = createValidityRule('email-pattern', 'Email Pattern', ['email'], {
        pattern: '^[^@]+@[^@]+$',
      });
      expect(rule.id).toBe('email-pattern');
      expect(rule.category).toBe('validity');
      expect(rule.params?.pattern).toBeDefined();
    });
  });

  describe('createRangeRule', () => {
    it('should create a range rule', () => {
      const rule = createRangeRule('age-range', 'Valid Age', 'age', 0, 150);
      expect(rule.params?.min).toBe(0);
      expect(rule.params?.max).toBe(150);
    });
  });

  describe('validateRule', () => {
    it('should validate completeness rule', () => {
      const rule = createCompletenessRule('name-required', 'Name Required', ['name']);
      const result = validateRule(rule, sampleRecords);
      expect(result.passed).toBe(true);
      expect(result.recordsChecked).toBe(5);
    });

    it('should fail completeness for missing values', () => {
      const rule = createCompletenessRule('name-required', 'Name Required', ['name']);
      const result = validateRule(rule, recordsWithIssues);
      expect(result.passed).toBe(false);
      expect(result.recordsFailed).toBeGreaterThan(0);
    });

    it('should validate uniqueness rule', () => {
      const rule = createUniquenessRule('unique-id', 'Unique ID', ['id']);
      const result = validateRule(rule, sampleRecords);
      expect(result.passed).toBe(true);
    });

    it('should fail uniqueness for duplicates', () => {
      const rule = createUniquenessRule('unique-id', 'Unique ID', ['id']);
      const result = validateRule(rule, recordsWithIssues);
      expect(result.passed).toBe(false);
    });

    it('should validate range rule', () => {
      const rule = createRangeRule('valid-age', 'Valid Age', 'age', 0, 150);
      const result = validateRule(rule, sampleRecords);
      expect(result.passed).toBe(true);
    });

    it('should fail range for out of bounds', () => {
      const rule = createRangeRule('valid-age', 'Valid Age', 'age', 0, 150);
      const result = validateRule(rule, recordsWithIssues);
      expect(result.passed).toBe(false);
    });
  });

  describe('validateRules', () => {
    it('should validate multiple rules', () => {
      const rules = [
        createCompletenessRule('name', 'Name', ['name']),
        createUniquenessRule('id', 'ID', ['id']),
      ];
      const results = validateRules(rules, sampleRecords);
      expect(results.length).toBe(2);
      expect(results.every((r) => r.passed)).toBe(true);
    });
  });

  describe('Preset Rules', () => {
    it('should have EMAIL_RULE', () => {
      expect(EMAIL_RULE.id).toBe('valid-email');
      expect(EMAIL_RULE.params?.type).toBe('email');
    });

    it('should have URL_RULE', () => {
      expect(URL_RULE.id).toBe('valid-url');
    });

    it('should have UUID_RULE', () => {
      expect(UUID_RULE.id).toBe('valid-uuid');
    });
  });
});

// ================================================================
// ANOMALY DETECTION TESTS
// ================================================================

describe('Semantic Audit: Anomaly Detection', () => {
  describe('detectOutliers', () => {
    it('should detect statistical outliers', () => {
      // Need more records with clear outlier to get z-score > 2
      const records = [
        { value: 10 },
        { value: 11 },
        { value: 10 },
        { value: 11 },
        { value: 10 },
        { value: 11 },
        { value: 10 },
        { value: 11 },
        { value: 100 }, // Clear outlier - z-score will be > 3
      ];
      const anomalies = detectOutliers(records, 'value', 2);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('outlier');
    });

    it('should not find outliers in uniform data', () => {
      const records = Array(10).fill(null).map((_, i) => ({ value: 50 + i }));
      const anomalies = detectOutliers(records, 'value', 3);
      expect(anomalies.length).toBe(0);
    });
  });

  describe('detectOutliersIQR', () => {
    it('should detect outliers using IQR', () => {
      const records = [
        { value: 10 },
        { value: 12 },
        { value: 11 },
        { value: 13 },
        { value: 10 },
        { value: 100 }, // Outlier
      ];
      const anomalies = detectOutliersIQR(records, 'value', 1.5);
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('detectMissingValues', () => {
    it('should detect null values', () => {
      const records = [
        { name: 'John' },
        { name: null },
        { name: 'Bob' },
      ];
      const anomalies = detectMissingValues(records, ['name']);
      expect(anomalies.some((a) => a.type === 'missing_value')).toBe(true);
    });

    it('should detect empty strings', () => {
      const records = [
        { name: 'John' },
        { name: '' },
        { name: 'Bob' },
      ];
      const anomalies = detectMissingValues(records, ['name']);
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect duplicate records', () => {
      const records = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' }, // Duplicate
      ];
      const anomalies = detectDuplicates(records, ['id']);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].type).toBe('duplicate');
    });

    it('should not find duplicates in unique data', () => {
      const anomalies = detectDuplicates(sampleRecords, ['id']);
      expect(anomalies.length).toBe(0);
    });
  });

  describe('detectFormatAnomalies', () => {
    it('should detect invalid emails', () => {
      const records = [
        { email: 'valid@example.com' },
        { email: 'invalid-email' },
        { email: 'also@valid.com' },
      ];
      const anomalies = detectFormatAnomalies(records, 'email', 'email');
      expect(anomalies.length).toBe(1);
      expect(anomalies[0].type).toBe('invalid_format');
    });

    it('should detect invalid UUIDs', () => {
      const records = [
        { id: '550e8400-e29b-41d4-a716-446655440000' },
        { id: 'not-a-uuid' },
      ];
      const anomalies = detectFormatAnomalies(records, 'id', 'uuid');
      expect(anomalies.length).toBe(1);
    });
  });

  describe('detectAutoFormat', () => {
    it('should auto-detect and validate format', () => {
      // Need > 90% valid to trigger auto-detection (at least 19/20 = 95%)
      const records = Array(20).fill(null).map((_, i) => ({
        email: i < 19 ? `user${i}@example.com` : 'invalid',
      }));
      const anomalies = detectAutoFormat(records, 'email');
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('detectTemporalAnomalies', () => {
    it('should detect future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 5);

      const records = [
        { date: new Date('2023-01-01') },
        { date: new Date('2023-06-15') },
        { date: futureDate },
      ];
      const anomalies = detectTemporalAnomalies(records, 'date');
      expect(anomalies.some((a) => a.context?.type === 'future_date')).toBe(true);
    });
  });

  describe('detectOutOfRange', () => {
    it('should detect out of range values', () => {
      const records = [
        { age: 25 },
        { age: 30 },
        { age: -5 }, // Invalid
        { age: 200 }, // Invalid
      ];
      const anomalies = detectOutOfRange(records, 'age', 0, 150);
      expect(anomalies.length).toBe(2);
      expect(anomalies[0].type).toBe('out_of_range');
    });
  });

  describe('detectAllAnomalies', () => {
    it('should run all detection methods', () => {
      const anomalies = detectAllAnomalies(recordsWithIssues, ['name', 'email', 'age']);
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// ORPHAN DETECTION TESTS
// ================================================================

describe('Semantic Audit: Orphan Detection', () => {
  const users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
    { id: 3, name: 'Bob' },
  ];

  const orders = [
    { id: 101, userId: 1 },
    { id: 102, userId: 2 },
    { id: 103, userId: 99 }, // Orphan - user doesn't exist
  ];

  describe('detectOrphans', () => {
    it('should detect orphan records', () => {
      const check = {
        sourceTable: 'orders',
        foreignKeyField: 'userId',
        targetTable: 'users',
        targetPrimaryKey: 'id',
        enabled: true,
      };
      const orphans = detectOrphans(orders, users, check);
      expect(orphans.length).toBe(1);
      expect(orphans[0].foreignKeyValue).toBe(99);
    });

    it('should not find orphans when all references are valid', () => {
      const validOrders = [
        { id: 101, userId: 1 },
        { id: 102, userId: 2 },
      ];
      const check = {
        sourceTable: 'orders',
        foreignKeyField: 'userId',
        targetTable: 'users',
        targetPrimaryKey: 'id',
        enabled: true,
      };
      const orphans = detectOrphans(validOrders, users, check);
      expect(orphans.length).toBe(0);
    });
  });

  describe('detectAllOrphans', () => {
    it('should check multiple relationships', () => {
      const tables = new Map([
        ['users', users],
        ['orders', orders],
      ]);
      const checks = [
        {
          sourceTable: 'orders',
          foreignKeyField: 'userId',
          targetTable: 'users',
          targetPrimaryKey: 'id',
          enabled: true,
        },
      ];
      const orphans = detectAllOrphans(tables, checks);
      expect(orphans.length).toBe(1);
    });
  });

  describe('detectSelfReferenceOrphans', () => {
    it('should detect self-reference orphans', () => {
      const categories = [
        { id: 1, parentId: null },
        { id: 2, parentId: 1 },
        { id: 3, parentId: 99 }, // Orphan
      ];
      const orphans = detectSelfReferenceOrphans(categories, 'parentId', 'id');
      expect(orphans.length).toBe(1);
    });
  });

  describe('checkBidirectionalRelationship', () => {
    it('should detect bidirectional inconsistencies', () => {
      const parents = [
        { id: 1, children: [10, 20] },
        { id: 2, children: [30] },
      ];
      const children = [
        { id: 10, parentId: 1 },
        { id: 20, parentId: 1 },
        { id: 30, parentId: 99 }, // Wrong parent
      ];
      const result = checkBidirectionalRelationship(
        parents, children, 'id', 'children', 'parentId'
      );
      expect(result.missingFromChild.length).toBeGreaterThan(0);
    });
  });

  describe('findCascadeImpact', () => {
    it('should find dependent records', () => {
      const userToDelete = { id: 1, name: 'John' };
      const affected = findCascadeImpact(userToDelete, orders, 'userId', 'id');
      expect(affected.length).toBe(1);
    });
  });

  describe('getIntegrityStats', () => {
    it('should calculate integrity statistics', () => {
      const orphans = [
        { sourceTable: 'orders', recordId: 1, foreignKeyField: 'userId', foreignKeyValue: 99, targetTable: 'users', targetPrimaryKey: 'id', timestamp: new Date() },
      ];
      const stats = getIntegrityStats(orphans);
      expect(stats.orphanRelationships).toBe(1);
      expect(stats.tablesWithOrphans).toContain('orders');
    });
  });

  describe('groupOrphansByTable', () => {
    it('should group orphans by source table', () => {
      const orphans = [
        { sourceTable: 'orders', recordId: 1, foreignKeyField: 'userId', foreignKeyValue: 99, targetTable: 'users', targetPrimaryKey: 'id', timestamp: new Date() },
        { sourceTable: 'orders', recordId: 2, foreignKeyField: 'userId', foreignKeyValue: 98, targetTable: 'users', targetPrimaryKey: 'id', timestamp: new Date() },
      ];
      const grouped = groupOrphansByTable(orphans);
      expect(grouped.get('orders')?.length).toBe(2);
    });
  });
});

// ================================================================
// SCHEMA VALIDATION TESTS
// ================================================================

describe('Semantic Audit: Schema Validation', () => {
  describe('validateSchema', () => {
    const schema = {
      name: { name: 'name', type: 'string' as const, required: true, unique: false },
      age: { name: 'age', type: 'integer' as const, required: true, unique: false, min: 0, max: 150 },
      email: { name: 'email', type: 'email' as const, required: false, unique: true },
    };

    it('should validate a valid record', () => {
      const record = { name: 'John', age: 30, email: 'john@example.com' };
      const result = validateSchema(record, schema);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should detect missing required fields', () => {
      const record = { age: 30 };
      const result = validateSchema(record, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'REQUIRED_FIELD_MISSING')).toBe(true);
    });

    it('should detect type mismatches', () => {
      const record = { name: 'John', age: 'thirty' };
      const result = validateSchema(record, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TYPE_MISMATCH')).toBe(true);
    });

    it('should detect out of range values', () => {
      const record = { name: 'John', age: 200 };
      const result = validateSchema(record, schema);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'MAX_VIOLATION')).toBe(true);
    });

    it('should detect extra fields', () => {
      const record = { name: 'John', age: 30, extraField: 'value' };
      const result = validateSchema(record, schema);
      expect(result.extraFields).toContain('extraField');
    });
  });

  describe('Schema Field Builders', () => {
    it('should create string field', () => {
      const field = stringField({ required: true });
      expect(field.type).toBe('string');
      expect(field.required).toBe(true);
    });

    it('should create number field', () => {
      const field = numberField({ min: 0, max: 100 });
      expect(field.type).toBe('number');
      expect(field.min).toBe(0);
      expect(field.max).toBe(100);
    });

    it('should create integer field', () => {
      const field = integerField();
      expect(field.type).toBe('integer');
    });

    it('should create boolean field', () => {
      const field = booleanField();
      expect(field.type).toBe('boolean');
    });

    it('should create email field', () => {
      const field = emailField();
      expect(field.type).toBe('email');
    });

    it('should create url field', () => {
      const field = urlField();
      expect(field.type).toBe('url');
    });

    it('should create uuid field', () => {
      const field = uuidField();
      expect(field.type).toBe('uuid');
    });

    it('should create date field', () => {
      const field = dateField();
      expect(field.type).toBe('date');
    });

    it('should create array field', () => {
      const field = arrayField({ name: 'item', type: 'string', required: false, unique: false });
      expect(field.type).toBe('array');
      expect(field.items).toBeDefined();
    });

    it('should create object field', () => {
      const field = objectField({
        name: { name: 'name', type: 'string', required: true, unique: false },
      });
      expect(field.type).toBe('object');
      expect(field.properties).toBeDefined();
    });

    it('should create enum field', () => {
      const field = enumField(['a', 'b', 'c']);
      expect(field.enum).toEqual(['a', 'b', 'c']);
    });
  });

  describe('inferSchema', () => {
    it('should infer schema from records', () => {
      const schema = inferSchema(sampleRecords);
      expect(schema.id).toBeDefined();
      expect(schema.name).toBeDefined();
      expect(schema.email).toBeDefined();
    });

    it('should detect email type', () => {
      const records = [
        { email: 'a@example.com' },
        { email: 'b@example.com' },
        { email: 'c@example.com' },
      ];
      const schema = inferSchema(records);
      expect(schema.email.type).toBe('email');
    });

    it('should detect integer type', () => {
      const records = [
        { count: 1 },
        { count: 2 },
        { count: 3 },
      ];
      const schema = inferSchema(records);
      expect(schema.count.type).toBe('integer');
    });

    it('should return empty for empty records', () => {
      const schema = inferSchema([]);
      expect(Object.keys(schema).length).toBe(0);
    });
  });
});

// ================================================================
// AUDIT REPORT TESTS
// ================================================================

describe('Semantic Audit: Report Generation', () => {
  describe('generateAuditReport', () => {
    it('should generate an audit report', () => {
      const report = generateAuditReport('test-data', sampleRecords);
      expect(report.id).toBeDefined();
      expect(report.dataset).toBe('test-data');
      expect(report.totalRecords).toBe(5);
      expect(report.qualityScore).toBeDefined();
      expect(report.summary).toBeDefined();
    });

    it('should include rule results when rules provided', () => {
      const rules = [
        createCompletenessRule('name', 'Name Required', ['name']),
      ];
      const report = generateAuditReport('test-data', sampleRecords, { rules });
      expect(report.ruleResults.length).toBe(1);
    });

    it('should detect anomalies', () => {
      const report = generateAuditReport('test-data', recordsWithIssues);
      expect(report.anomalies.length).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      const report = generateAuditReport('test-data', recordsWithIssues);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate quality score', () => {
      const goodReport = generateAuditReport('good-data', sampleRecords);
      const badReport = generateAuditReport('bad-data', recordsWithIssues);
      expect(goodReport.qualityScore).toBeGreaterThan(badReport.qualityScore);
    });
  });

  describe('quickAudit', () => {
    it('should return score and issues', () => {
      const result = quickAudit(sampleRecords);
      expect(result.score).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
    });

    it('should detect issues in bad data', () => {
      const result = quickAudit(recordsWithIssues);
      expect(result.score).toBeLessThan(100);
    });
  });
});

// ================================================================
// CONFIGURATION TESTS
// ================================================================

describe('Semantic Audit: Configuration', () => {
  describe('DEFAULT_AUDIT_CONFIG', () => {
    it('should have default values', () => {
      expect(DEFAULT_AUDIT_CONFIG.enableRules).toBe(true);
      expect(DEFAULT_AUDIT_CONFIG.enableAnomalyDetection).toBe(true);
      expect(DEFAULT_AUDIT_CONFIG.maxSampleSize).toBeDefined();
    });

    it('should have anomaly config', () => {
      expect(DEFAULT_AUDIT_CONFIG.anomalyConfig).toBeDefined();
      expect(DEFAULT_AUDIT_CONFIG.anomalyConfig.detectOutliers).toBe(true);
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Semantic Audit: Edge Cases', () => {
  describe('Empty Data', () => {
    it('should handle empty records array', () => {
      const report = generateAuditReport('empty', []);
      expect(report.totalRecords).toBe(0);
      expect(report.qualityScore).toBe(0);
    });

    it('should handle empty fields in detectAllAnomalies', () => {
      const anomalies = detectAllAnomalies([], ['field1']);
      expect(anomalies.length).toBe(0);
    });
  });

  describe('Nested Fields', () => {
    it('should validate nested object fields', () => {
      const schema = {
        user: objectField({
          name: { name: 'name', type: 'string', required: true, unique: false },
        }),
      };
      const record = { user: { name: 'John' } };
      const result = validateSchema(record, {
        user: { ...schema.user, name: 'user' },
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Special Values', () => {
    it('should handle NaN in numeric fields', () => {
      const records = [{ value: NaN }];
      const anomalies = detectOutOfRange(records, 'value', 0, 100);
      expect(anomalies.length).toBe(0); // NaN is skipped
    });

    it('should handle undefined values', () => {
      const records = [{ name: undefined }];
      const anomalies = detectMissingValues(records, ['name']);
      expect(anomalies.length).toBeGreaterThan(0);
    });
  });
});
