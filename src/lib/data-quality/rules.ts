/**
 * Data Quality Rules Engine
 *
 * Built-in validators and rule execution
 *
 * Phase 3, Week 10, Day 1
 */

import type {
  DataQualityRule,
  RuleConfig,
  RuleType,
  RuleCheckResult,
  FailingSample,
  CheckResult,
  RuleCategory,
  RuleSeverity,
  RuleStatus,
} from './types';

// ================================================================
// RULE BUILDER
// ================================================================

export interface RuleBuilder {
  id(id: string): RuleBuilder;
  name(name: string): RuleBuilder;
  description(description: string): RuleBuilder;
  category(category: RuleCategory): RuleBuilder;
  severity(severity: RuleSeverity): RuleBuilder;
  tables(...tables: string[]): RuleBuilder;
  columns(...columns: string[]): RuleBuilder;
  tags(...tags: string[]): RuleBuilder;
  config(config: RuleConfig): RuleBuilder;
  build(): DataQualityRule;
}

/**
 * Create a new rule builder
 */
export function createRule(): RuleBuilder {
  const rule: Partial<DataQualityRule> = {
    status: 'active' as RuleStatus,
    tags: [],
    columns: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const builder: RuleBuilder = {
    id(id: string) {
      rule.id = id;
      return builder;
    },
    name(name: string) {
      rule.name = name;
      return builder;
    },
    description(description: string) {
      rule.description = description;
      return builder;
    },
    category(category: RuleCategory) {
      rule.category = category;
      return builder;
    },
    severity(severity: RuleSeverity) {
      rule.severity = severity;
      return builder;
    },
    tables(...tables: string[]) {
      rule.tables = tables;
      return builder;
    },
    columns(...columns: string[]) {
      rule.columns = columns;
      return builder;
    },
    tags(...tags: string[]) {
      rule.tags = tags;
      return builder;
    },
    config(config: RuleConfig) {
      rule.config = config;
      return builder;
    },
    build(): DataQualityRule {
      if (!rule.id) throw new Error('Rule ID is required');
      if (!rule.name) throw new Error('Rule name is required');
      if (!rule.description) throw new Error('Rule description is required');
      if (!rule.category) throw new Error('Rule category is required');
      if (!rule.severity) throw new Error('Rule severity is required');
      if (!rule.tables || rule.tables.length === 0) throw new Error('At least one table is required');
      if (!rule.config) throw new Error('Rule config is required');

      return rule as DataQualityRule;
    },
  };

  return builder;
}

// ================================================================
// BUILT-IN VALIDATORS
// ================================================================

export type Validator<T = unknown> = (
  value: T,
  params: Record<string, unknown>
) => { valid: boolean; message?: string };

/**
 * Not null validator
 */
export const notNull: Validator = (value) => ({
  valid: value !== null && value !== undefined,
  message: value === null || value === undefined ? 'Value is null or undefined' : undefined,
});

/**
 * Not empty validator (for strings and arrays)
 */
export const notEmpty: Validator = (value) => {
  if (typeof value === 'string') {
    return {
      valid: value.trim().length > 0,
      message: value.trim().length === 0 ? 'String is empty' : undefined,
    };
  }
  if (Array.isArray(value)) {
    return {
      valid: value.length > 0,
      message: value.length === 0 ? 'Array is empty' : undefined,
    };
  }
  return notNull(value, {});
};

/**
 * Regex match validator
 */
export const regexMatch: Validator<string> = (value, params) => {
  const pattern = params.pattern as string;
  if (!pattern) {
    return { valid: false, message: 'No pattern specified' };
  }
  const regex = new RegExp(pattern, params.flags as string | undefined);
  const matches = regex.test(value);
  return {
    valid: matches,
    message: matches ? undefined : `Value does not match pattern: ${pattern}`,
  };
};

/**
 * Range check validator
 */
export const rangeCheck: Validator<number> = (value, params) => {
  const min = params.min as number | undefined;
  const max = params.max as number | undefined;
  const inclusive = params.inclusive !== false;

  if (min !== undefined) {
    const minCheck = inclusive ? value >= min : value > min;
    if (!minCheck) {
      return { valid: false, message: `Value ${value} is below minimum ${min}` };
    }
  }

  if (max !== undefined) {
    const maxCheck = inclusive ? value <= max : value < max;
    if (!maxCheck) {
      return { valid: false, message: `Value ${value} is above maximum ${max}` };
    }
  }

  return { valid: true };
};

/**
 * Enum check validator
 */
export const enumCheck: Validator = (value, params) => {
  const allowedValues = params.values as unknown[];
  if (!allowedValues || !Array.isArray(allowedValues)) {
    return { valid: false, message: 'No allowed values specified' };
  }
  const valid = allowedValues.includes(value);
  return {
    valid,
    message: valid ? undefined : `Value "${value}" is not in allowed values: ${allowedValues.join(', ')}`,
  };
};

/**
 * Type check validator
 */
export const typeCheck: Validator = (value, params) => {
  const expectedType = params.type as string;
  const actualType = typeof value;

  if (expectedType === 'array') {
    const valid = Array.isArray(value);
    return { valid, message: valid ? undefined : `Expected array, got ${actualType}` };
  }

  if (expectedType === 'date') {
    const valid = value instanceof Date && !isNaN(value.getTime());
    return { valid, message: valid ? undefined : `Expected valid Date` };
  }

  if (expectedType === 'integer') {
    const valid = Number.isInteger(value);
    return { valid, message: valid ? undefined : `Expected integer` };
  }

  const valid = actualType === expectedType;
  return {
    valid,
    message: valid ? undefined : `Expected ${expectedType}, got ${actualType}`,
  };
};

/**
 * Format check validator (email, url, uuid, etc.)
 */
export const formatCheck: Validator<string> = (value, params) => {
  const format = params.format as string;

  const formats: Record<string, RegExp> = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/.+/,
    uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    iso_date: /^\d{4}-\d{2}-\d{2}$/,
    iso_datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
    phone: /^\+?[\d\s\-()]+$/,
    slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    hex_color: /^#[0-9a-fA-F]{6}$/,
  };

  const pattern = formats[format];
  if (!pattern) {
    return { valid: false, message: `Unknown format: ${format}` };
  }

  const valid = pattern.test(value);
  return {
    valid,
    message: valid ? undefined : `Value is not a valid ${format}`,
  };
};

/**
 * Freshness check validator (for timestamps)
 */
export const freshnessCheck: Validator<Date | string> = (value, params) => {
  const maxAgeMinutes = params.maxAgeMinutes as number;
  if (maxAgeMinutes === undefined) {
    return { valid: false, message: 'maxAgeMinutes not specified' };
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, message: 'Invalid date value' };
  }

  const ageMs = Date.now() - date.getTime();
  const ageMinutes = ageMs / (1000 * 60);

  const valid = ageMinutes <= maxAgeMinutes;
  return {
    valid,
    message: valid ? undefined : `Data is ${Math.round(ageMinutes)} minutes old (max: ${maxAgeMinutes})`,
  };
};

/**
 * Unique check (requires array of all values)
 */
export const uniqueCheck: Validator<unknown[]> = (values) => {
  const uniqueSet = new Set(values.map((v) => JSON.stringify(v)));
  const hasDuplicates = uniqueSet.size !== values.length;

  return {
    valid: !hasDuplicates,
    message: hasDuplicates
      ? `Found ${values.length - uniqueSet.size} duplicate values`
      : undefined,
  };
};

/**
 * Length check for strings
 */
export const lengthCheck: Validator<string> = (value, params) => {
  const min = params.min as number | undefined;
  const max = params.max as number | undefined;

  if (min !== undefined && value.length < min) {
    return { valid: false, message: `Length ${value.length} is below minimum ${min}` };
  }

  if (max !== undefined && value.length > max) {
    return { valid: false, message: `Length ${value.length} is above maximum ${max}` };
  }

  return { valid: true };
};

/**
 * Registry of validators by rule type
 */
export const VALIDATORS: Partial<Record<RuleType, Validator>> = {
  not_null: notNull,
  not_empty: notEmpty,
  regex_match: regexMatch as Validator,
  range_check: rangeCheck as Validator,
  enum_check: enumCheck,
  type_check: typeCheck,
  format_check: formatCheck as Validator,
  freshness: freshnessCheck as Validator,
  unique: uniqueCheck as Validator,
};

// ================================================================
// RULE EXECUTOR
// ================================================================

export interface RuleExecutionContext {
  /** Data to validate */
  data: Record<string, unknown>[];
  /** Current timestamp */
  timestamp: Date;
  /** Maximum failing samples to collect */
  maxSamples: number;
  /** Identifier column for records */
  idColumn?: string;
}

/**
 * Execute a single rule against data
 */
export function executeRule(
  rule: DataQualityRule,
  context: RuleExecutionContext
): RuleCheckResult {
  const startTime = Date.now();
  const { data, maxSamples, idColumn = 'id' } = context;

  // Handle disabled rules
  if (rule.status !== 'active') {
    return {
      ruleId: rule.id,
      status: 'skipped',
      totalRecords: data.length,
      passingRecords: 0,
      failingRecords: 0,
      passRate: 0,
      durationMs: Date.now() - startTime,
      checkedAt: new Date(),
      metadata: { reason: 'Rule is not active' },
    };
  }

  // Get the appropriate validator
  const validator = VALIDATORS[rule.config.type];

  // Handle custom rules
  if (rule.config.type === 'custom_function') {
    return executeCustomFunction(rule, context, startTime);
  }

  if (!validator) {
    return {
      ruleId: rule.id,
      status: 'error',
      totalRecords: data.length,
      passingRecords: 0,
      failingRecords: 0,
      passRate: 0,
      durationMs: Date.now() - startTime,
      errorMessage: `No validator found for rule type: ${rule.config.type}`,
      checkedAt: new Date(),
    };
  }

  try {
    let passingRecords = 0;
    let failingRecords = 0;
    const failingSamples: FailingSample[] = [];

    // Apply to each column
    const columns = rule.columns && rule.columns.length > 0 ? rule.columns : ['*'];

    for (const record of data) {
      let recordPasses = true;

      for (const column of columns) {
        const value = column === '*' ? record : record[column];
        const result = validator(value, rule.config.params);

        if (!result.valid) {
          recordPasses = false;

          if (failingSamples.length < maxSamples) {
            failingSamples.push({
              recordId: String(record[idColumn] || 'unknown'),
              table: rule.tables[0],
              column: column === '*' ? undefined : column,
              actualValue: value,
              expectedCondition: result.message || `Must satisfy ${rule.config.type}`,
            });
          }
        }
      }

      if (recordPasses) {
        passingRecords++;
      } else {
        failingRecords++;
      }
    }

    const passRate = data.length > 0 ? (passingRecords / data.length) * 100 : 100;
    const status = determineStatus(rule, passRate);

    return {
      ruleId: rule.id,
      status,
      totalRecords: data.length,
      passingRecords,
      failingRecords,
      passRate,
      durationMs: Date.now() - startTime,
      failingSamples: failingSamples.length > 0 ? failingSamples : undefined,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      ruleId: rule.id,
      status: 'error',
      totalRecords: data.length,
      passingRecords: 0,
      failingRecords: 0,
      passRate: 0,
      durationMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date(),
    };
  }
}

/**
 * Execute a custom function rule
 */
function executeCustomFunction(
  rule: DataQualityRule,
  context: RuleExecutionContext,
  startTime: number
): RuleCheckResult {
  const { data } = context;
  const customFn = rule.config.params.function as ((data: Record<string, unknown>[]) => {
    passingRecords: number;
    failingRecords: number;
    failingSamples?: FailingSample[];
  }) | undefined;

  if (!customFn || typeof customFn !== 'function') {
    return {
      ruleId: rule.id,
      status: 'error',
      totalRecords: data.length,
      passingRecords: 0,
      failingRecords: 0,
      passRate: 0,
      durationMs: Date.now() - startTime,
      errorMessage: 'Custom function not provided or invalid',
      checkedAt: new Date(),
    };
  }

  try {
    const result = customFn(data);
    const passRate = data.length > 0
      ? (result.passingRecords / data.length) * 100
      : 100;

    return {
      ruleId: rule.id,
      status: determineStatus(rule, passRate),
      totalRecords: data.length,
      passingRecords: result.passingRecords,
      failingRecords: result.failingRecords,
      passRate,
      durationMs: Date.now() - startTime,
      failingSamples: result.failingSamples,
      checkedAt: new Date(),
    };
  } catch (error) {
    return {
      ruleId: rule.id,
      status: 'error',
      totalRecords: data.length,
      passingRecords: 0,
      failingRecords: 0,
      passRate: 0,
      durationMs: Date.now() - startTime,
      errorMessage: error instanceof Error ? error.message : 'Custom function error',
      checkedAt: new Date(),
    };
  }
}

/**
 * Determine check status based on pass rate and thresholds
 */
function determineStatus(rule: DataQualityRule, passRate: number): CheckResult {
  const { failureThreshold = 100, warningThreshold = 95 } = rule.config;

  if (passRate >= failureThreshold) {
    return 'pass';
  }

  if (warningThreshold !== undefined && passRate >= warningThreshold) {
    return 'warning';
  }

  return 'fail';
}

// ================================================================
// PRESET RULES
// ================================================================

/**
 * Common preset rules for analyses table
 */
export const ANALYSIS_RULES: DataQualityRule[] = [
  createRule()
    .id('analysis-url-not-null')
    .name('Analysis URL Required')
    .description('Every analysis must have a URL')
    .category('completeness')
    .severity('critical')
    .tables('analyses')
    .columns('url')
    .tags('core', 'completeness')
    .config({
      type: 'not_null',
      params: {},
      failureThreshold: 100,
    })
    .build(),

  createRule()
    .id('analysis-url-format')
    .name('Analysis URL Format')
    .description('URLs must be valid HTTP/HTTPS URLs')
    .category('validity')
    .severity('high')
    .tables('analyses')
    .columns('url')
    .tags('core', 'format')
    .config({
      type: 'format_check',
      params: { format: 'url' },
      failureThreshold: 100,
    })
    .build(),

  createRule()
    .id('analysis-score-range')
    .name('Analysis Score Range')
    .description('Overall score must be between 0 and 100')
    .category('validity')
    .severity('high')
    .tables('analyses')
    .columns('overall_score')
    .tags('core', 'scoring')
    .config({
      type: 'range_check',
      params: { min: 0, max: 100 },
      failureThreshold: 100,
    })
    .build(),

  createRule()
    .id('analysis-status-enum')
    .name('Analysis Status Valid')
    .description('Status must be a valid enum value')
    .category('validity')
    .severity('high')
    .tables('analyses')
    .columns('status')
    .tags('core', 'enum')
    .config({
      type: 'enum_check',
      params: { values: ['pending', 'processing', 'completed', 'failed'] },
      failureThreshold: 100,
    })
    .build(),
];

/**
 * Common preset rules for AI responses
 */
export const AI_RESPONSE_RULES: DataQualityRule[] = [
  createRule()
    .id('ai-response-provider-enum')
    .name('AI Provider Valid')
    .description('Provider must be a known AI provider')
    .category('validity')
    .severity('high')
    .tables('ai_responses')
    .columns('provider')
    .tags('ai', 'enum')
    .config({
      type: 'enum_check',
      params: { values: ['openai', 'anthropic', 'google', 'perplexity'] },
      failureThreshold: 100,
    })
    .build(),

  createRule()
    .id('ai-response-sentiment-enum')
    .name('AI Sentiment Valid')
    .description('Sentiment must be positive, neutral, or negative')
    .category('validity')
    .severity('medium')
    .tables('ai_responses')
    .columns('sentiment')
    .tags('ai', 'enum')
    .config({
      type: 'enum_check',
      params: { values: ['positive', 'neutral', 'negative'] },
      failureThreshold: 95,
      warningThreshold: 99,
    })
    .build(),

  createRule()
    .id('ai-response-tokens-positive')
    .name('AI Tokens Positive')
    .description('Token usage must be positive when present')
    .category('validity')
    .severity('medium')
    .tables('ai_responses')
    .columns('tokens_used')
    .tags('ai', 'metrics')
    .config({
      type: 'range_check',
      params: { min: 0 },
      failureThreshold: 100,
    })
    .build(),
];

/**
 * Common preset rules for user profiles
 */
export const USER_RULES: DataQualityRule[] = [
  createRule()
    .id('user-email-format')
    .name('User Email Format')
    .description('User emails must be valid email format')
    .category('validity')
    .severity('critical')
    .tables('user_profiles')
    .columns('email')
    .tags('user', 'format')
    .config({
      type: 'format_check',
      params: { format: 'email' },
      failureThreshold: 100,
    })
    .build(),

  createRule()
    .id('user-id-uuid')
    .name('User ID Format')
    .description('User IDs must be valid UUIDs')
    .category('validity')
    .severity('critical')
    .tables('user_profiles')
    .columns('id')
    .tags('user', 'format')
    .config({
      type: 'format_check',
      params: { format: 'uuid' },
      failureThreshold: 100,
    })
    .build(),
];

/**
 * Get all preset rules
 */
export function getPresetRules(): DataQualityRule[] {
  return [...ANALYSIS_RULES, ...AI_RESPONSE_RULES, ...USER_RULES];
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  createRule,
  executeRule,
  VALIDATORS,
  getPresetRules,
  ANALYSIS_RULES,
  AI_RESPONSE_RULES,
  USER_RULES,
};
