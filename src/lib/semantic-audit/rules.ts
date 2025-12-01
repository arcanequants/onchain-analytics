/**
 * Data Quality Rules
 *
 * Rule definitions and validation functions
 *
 * Phase 3, Week 10
 */

import type {
  DataQualityRule,
  RuleValidationResult,
  RuleSeverity,
  RuleCategory,
} from './types';

// ================================================================
// BUILT-IN RULES
// ================================================================

/**
 * Create a completeness rule (check for missing values)
 */
export function createCompletenessRule(
  id: string,
  name: string,
  fields: string[],
  severity: RuleSeverity = 'error'
): DataQualityRule {
  return {
    id,
    name,
    description: `Check that ${fields.join(', ')} are not null or empty`,
    category: 'completeness',
    severity,
    fields,
    enabled: true,
  };
}

/**
 * Create a uniqueness rule (check for duplicates)
 */
export function createUniquenessRule(
  id: string,
  name: string,
  fields: string[],
  severity: RuleSeverity = 'error'
): DataQualityRule {
  return {
    id,
    name,
    description: `Check that ${fields.join(', ')} combination is unique`,
    category: 'uniqueness',
    severity,
    fields,
    enabled: true,
  };
}

/**
 * Create a validity rule (check format/type)
 */
export function createValidityRule(
  id: string,
  name: string,
  fields: string[],
  params: { pattern?: string; type?: string; min?: number; max?: number },
  severity: RuleSeverity = 'error'
): DataQualityRule {
  return {
    id,
    name,
    description: `Validate format/type of ${fields.join(', ')}`,
    category: 'validity',
    severity,
    fields,
    enabled: true,
    params,
  };
}

/**
 * Create a consistency rule (check relationships)
 */
export function createConsistencyRule(
  id: string,
  name: string,
  fields: string[],
  params: { condition: string },
  severity: RuleSeverity = 'warning'
): DataQualityRule {
  return {
    id,
    name,
    description: `Check consistency between ${fields.join(', ')}`,
    category: 'consistency',
    severity,
    fields,
    enabled: true,
    params,
  };
}

/**
 * Create a range rule (check numeric bounds)
 */
export function createRangeRule(
  id: string,
  name: string,
  field: string,
  min: number,
  max: number,
  severity: RuleSeverity = 'error'
): DataQualityRule {
  return {
    id,
    name,
    description: `Check that ${field} is between ${min} and ${max}`,
    category: 'validity',
    severity,
    fields: [field],
    enabled: true,
    params: { min, max },
  };
}

// ================================================================
// RULE VALIDATION
// ================================================================

type RecordType = Record<string, unknown>;

/**
 * Validate completeness rule
 */
export function validateCompleteness(
  rule: DataQualityRule,
  records: RecordType[]
): RuleValidationResult {
  const startTime = Date.now();
  const failedRecords: RuleValidationResult['failedRecords'] = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    for (const field of rule.fields) {
      const value = getNestedValue(record, field);

      if (isNullOrEmpty(value)) {
        failedRecords.push({
          recordId: getRecordId(record, i),
          field,
          value,
          reason: `${field} is null or empty`,
        });
      }
    }
  }

  return createValidationResult(rule.id, records.length, failedRecords, startTime);
}

/**
 * Validate uniqueness rule
 */
export function validateUniqueness(
  rule: DataQualityRule,
  records: RecordType[]
): RuleValidationResult {
  const startTime = Date.now();
  const failedRecords: RuleValidationResult['failedRecords'] = [];
  const seen = new Map<string, number>();

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const keyValues = rule.fields.map((f) => getNestedValue(record, f));
    const key = JSON.stringify(keyValues);

    if (seen.has(key)) {
      failedRecords.push({
        recordId: getRecordId(record, i),
        field: rule.fields.join('+'),
        value: keyValues,
        reason: `Duplicate found at index ${seen.get(key)}`,
      });
    } else {
      seen.set(key, i);
    }
  }

  return createValidationResult(rule.id, records.length, failedRecords, startTime);
}

/**
 * Validate validity rule (format/type)
 */
export function validateValidity(
  rule: DataQualityRule,
  records: RecordType[]
): RuleValidationResult {
  const startTime = Date.now();
  const failedRecords: RuleValidationResult['failedRecords'] = [];
  const params = rule.params || {};

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    for (const field of rule.fields) {
      const value = getNestedValue(record, field);

      if (value === null || value === undefined) continue;

      // Check pattern
      if (params.pattern && typeof value === 'string') {
        const regex = new RegExp(params.pattern as string);
        if (!regex.test(value)) {
          failedRecords.push({
            recordId: getRecordId(record, i),
            field,
            value,
            reason: `Value does not match pattern: ${params.pattern}`,
          });
        }
      }

      // Check type
      if (params.type) {
        if (!validateType(value, params.type as string)) {
          failedRecords.push({
            recordId: getRecordId(record, i),
            field,
            value,
            reason: `Expected type ${params.type}, got ${typeof value}`,
          });
        }
      }

      // Check range
      if (typeof value === 'number') {
        if (params.min !== undefined && value < (params.min as number)) {
          failedRecords.push({
            recordId: getRecordId(record, i),
            field,
            value,
            reason: `Value ${value} is less than minimum ${params.min}`,
          });
        }
        if (params.max !== undefined && value > (params.max as number)) {
          failedRecords.push({
            recordId: getRecordId(record, i),
            field,
            value,
            reason: `Value ${value} is greater than maximum ${params.max}`,
          });
        }
      }
    }
  }

  return createValidationResult(rule.id, records.length, failedRecords, startTime);
}

/**
 * Validate consistency rule
 */
export function validateConsistency(
  rule: DataQualityRule,
  records: RecordType[]
): RuleValidationResult {
  const startTime = Date.now();
  const failedRecords: RuleValidationResult['failedRecords'] = [];
  const condition = rule.params?.condition as string | undefined;

  if (!condition) {
    return createValidationResult(rule.id, records.length, failedRecords, startTime);
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      const result = evaluateCondition(condition, record);
      if (!result) {
        const values = rule.fields.map((f) => getNestedValue(record, f));
        failedRecords.push({
          recordId: getRecordId(record, i),
          field: rule.fields.join(', '),
          value: values,
          reason: `Consistency check failed: ${condition}`,
        });
      }
    } catch {
      // Skip records that cause evaluation errors
    }
  }

  return createValidationResult(rule.id, records.length, failedRecords, startTime);
}

/**
 * Validate a rule against records
 */
export function validateRule(
  rule: DataQualityRule,
  records: RecordType[]
): RuleValidationResult {
  if (!rule.enabled) {
    return {
      ruleId: rule.id,
      passed: true,
      recordsChecked: 0,
      recordsFailed: 0,
      failureRate: 0,
      timestamp: new Date(),
      durationMs: 0,
    };
  }

  switch (rule.category) {
    case 'completeness':
      return validateCompleteness(rule, records);
    case 'uniqueness':
      return validateUniqueness(rule, records);
    case 'validity':
    case 'accuracy':
      return validateValidity(rule, records);
    case 'consistency':
      return validateConsistency(rule, records);
    default:
      return validateCompleteness(rule, records);
  }
}

/**
 * Validate multiple rules
 */
export function validateRules(
  rules: DataQualityRule[],
  records: RecordType[]
): RuleValidationResult[] {
  return rules.map((rule) => validateRule(rule, records));
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: RecordType, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as RecordType)[key];
  }, obj);
}

/**
 * Check if value is null or empty
 */
function isNullOrEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Get record ID from record or use index
 */
function getRecordId(record: RecordType, index: number): string | number {
  return (record.id as string | number) ||
    (record._id as string | number) ||
    (record.uuid as string | number) ||
    index;
}

/**
 * Validate value type
 */
function validateType(value: unknown, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'date':
      return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
    case 'email':
      return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case 'url':
      try {
        new URL(value as string);
        return true;
      } catch {
        return false;
      }
    case 'uuid':
      return typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    default:
      return true;
  }
}

/**
 * Evaluate simple condition expression
 */
function evaluateCondition(condition: string, record: RecordType): boolean {
  // Replace field references with actual values
  let expr = condition;
  const fieldRegex = /\$(\w+(?:\.\w+)*)/g;
  let match;

  while ((match = fieldRegex.exec(condition)) !== null) {
    const fieldPath = match[1];
    const value = getNestedValue(record, fieldPath);
    const replacement = JSON.stringify(value);
    expr = expr.replace(match[0], replacement);
  }

  // Evaluate the expression (simple comparisons only)
  // eslint-disable-next-line no-new-func
  try {
    return Function(`"use strict"; return (${expr})`)() as boolean;
  } catch {
    return false;
  }
}

/**
 * Create validation result
 */
function createValidationResult(
  ruleId: string,
  recordsChecked: number,
  failedRecords: RuleValidationResult['failedRecords'],
  startTime: number
): RuleValidationResult {
  const recordsFailed = failedRecords?.length || 0;
  return {
    ruleId,
    passed: recordsFailed === 0,
    recordsChecked,
    recordsFailed,
    failureRate: recordsChecked > 0 ? recordsFailed / recordsChecked : 0,
    failedRecords: failedRecords?.slice(0, 10),
    timestamp: new Date(),
    durationMs: Date.now() - startTime,
  };
}

// ================================================================
// RULE PRESETS
// ================================================================

/**
 * Common email validation rule
 */
export const EMAIL_RULE = createValidityRule(
  'valid-email',
  'Valid Email Format',
  ['email'],
  { type: 'email' },
  'error'
);

/**
 * Common URL validation rule
 */
export const URL_RULE = createValidityRule(
  'valid-url',
  'Valid URL Format',
  ['url'],
  { type: 'url' },
  'error'
);

/**
 * Common UUID validation rule
 */
export const UUID_RULE = createValidityRule(
  'valid-uuid',
  'Valid UUID Format',
  ['id', 'uuid'],
  { type: 'uuid' },
  'error'
);

/**
 * Positive number rule
 */
export const POSITIVE_NUMBER_RULE = createRangeRule(
  'positive-number',
  'Positive Number',
  'value',
  0,
  Number.MAX_SAFE_INTEGER,
  'error'
);

/**
 * Percentage rule (0-100)
 */
export const PERCENTAGE_RULE = createRangeRule(
  'valid-percentage',
  'Valid Percentage',
  'percentage',
  0,
  100,
  'error'
);

// ================================================================
// EXPORTS
// ================================================================

export default {
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
  POSITIVE_NUMBER_RULE,
  PERCENTAGE_RULE,
};
