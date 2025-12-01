/**
 * Constraint Validator
 *
 * TypeScript-side validation that mirrors database CHECK constraints.
 * Provides pre-validation before database operations.
 *
 * Features:
 * - Score range validation (0-100, 0-1)
 * - Format validation (email, URL, wallet address)
 * - Cross-field consistency checks
 * - Custom validation rules
 *
 * @module lib/data-quality/constraint-validator
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Validation rule definition
 */
export interface ValidationRule<T = unknown> {
  /** Rule name (matches constraint name in DB) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Fields this rule applies to */
  fields: string[];
  /** Validation function */
  validate: (value: T, record?: Record<string, unknown>) => boolean;
  /** Error message template */
  errorMessage: string;
  /** Severity level */
  severity: 'error' | 'warning';
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of violations */
  violations: ValidationViolation[];
  /** Count by severity */
  errorCount: number;
  warningCount: number;
}

/**
 * Single validation violation
 */
export interface ValidationViolation {
  /** Rule that failed */
  rule: string;
  /** Field(s) involved */
  fields: string[];
  /** Error message */
  message: string;
  /** Actual value that failed */
  value: unknown;
  /** Severity */
  severity: 'error' | 'warning';
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Score range validators (0-100)
 */
export const scoreRangeRules: ValidationRule<number | null>[] = [
  {
    name: 'chk_overall_score_range',
    description: 'Overall score must be 0-100',
    fields: ['overall_score', 'overallScore'],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 100),
    errorMessage: 'Score must be between 0 and 100',
    severity: 'error',
  },
  {
    name: 'chk_sentiment_score_range',
    description: 'Sentiment score must be 0-100',
    fields: ['sentiment_score', 'sentimentScore'],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 100),
    errorMessage: 'Sentiment score must be between 0 and 100',
    severity: 'error',
  },
  {
    name: 'chk_credibility_score_range',
    description: 'Credibility score must be 0-100',
    fields: ['credibility_score', 'credibilityScore'],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 100),
    errorMessage: 'Credibility score must be between 0 and 100',
    severity: 'error',
  },
];

/**
 * Confidence/probability validators (0-1)
 */
export const confidenceRules: ValidationRule<number | null>[] = [
  {
    name: 'chk_confidence_score_range',
    description: 'Confidence must be 0-1',
    fields: ['confidence_score', 'confidenceScore', 'confidence'],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 1),
    errorMessage: 'Confidence must be between 0 and 1',
    severity: 'error',
  },
  {
    name: 'chk_probability_range',
    description: 'Probability must be 0-1',
    fields: ['probability', 'win_probability', 'winProbability'],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 1),
    errorMessage: 'Probability must be between 0 and 1',
    severity: 'error',
  },
];

/**
 * Rating validators
 */
export const ratingRules: ValidationRule<number | null>[] = [
  {
    name: 'chk_rating_range',
    description: 'Rating must be 1-5',
    fields: ['rating'],
    validate: (v) => v === null || v === undefined || (v >= 1 && v <= 5),
    errorMessage: 'Rating must be between 1 and 5',
    severity: 'error',
  },
];

/**
 * Positive value validators
 */
export const positiveValueRules: ValidationRule<number | null>[] = [
  {
    name: 'chk_tokens_positive',
    description: 'Token counts must be non-negative',
    fields: [
      'input_tokens',
      'output_tokens',
      'total_tokens',
      'inputTokens',
      'outputTokens',
      'totalTokens',
    ],
    validate: (v) => v === null || v === undefined || v >= 0,
    errorMessage: 'Token count cannot be negative',
    severity: 'error',
  },
  {
    name: 'chk_cost_positive',
    description: 'Cost must be non-negative',
    fields: ['cost_usd', 'costUsd', 'cost', 'price'],
    validate: (v) => v === null || v === undefined || v >= 0,
    errorMessage: 'Cost/price cannot be negative',
    severity: 'error',
  },
  {
    name: 'chk_duration_positive',
    description: 'Duration must be non-negative',
    fields: [
      'duration_ms',
      'durationMs',
      'labeling_duration_ms',
      'labelingDurationMs',
    ],
    validate: (v) => v === null || v === undefined || v >= 0,
    errorMessage: 'Duration cannot be negative',
    severity: 'error',
  },
];

/**
 * Format validators
 */
export const formatRules: ValidationRule<string | null>[] = [
  {
    name: 'chk_email_format',
    description: 'Email must be valid format',
    fields: ['email'],
    validate: (v) => {
      if (v === null || v === undefined || v === '') return true;
      return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(v);
    },
    errorMessage: 'Invalid email format',
    severity: 'error',
  },
  {
    name: 'chk_url_format',
    description: 'URL must be valid format',
    fields: ['url', 'website', 'link'],
    validate: (v) => {
      if (v === null || v === undefined || v === '') return true;
      return /^https?:\/\/[^\s]+$/.test(v);
    },
    errorMessage: 'Invalid URL format',
    severity: 'error',
  },
  {
    name: 'chk_wallet_address_format',
    description: 'Wallet address must be valid Ethereum format',
    fields: ['address', 'wallet_address', 'walletAddress'],
    validate: (v) => {
      if (v === null || v === undefined || v === '') return true;
      return /^0x[a-fA-F0-9]{40}$/.test(v);
    },
    errorMessage: 'Invalid Ethereum wallet address format',
    severity: 'error',
  },
];

/**
 * Percentage validators
 */
export const percentageRules: ValidationRule<number | null>[] = [
  {
    name: 'chk_percentage_range',
    description: 'Percentage must be 0-100',
    fields: [
      'traffic_allocation',
      'trafficAllocation',
      'percentage',
      'pct',
    ],
    validate: (v) => v === null || v === undefined || (v >= 0 && v <= 100),
    errorMessage: 'Percentage must be between 0 and 100',
    severity: 'error',
  },
];

// ============================================================================
// ALL RULES
// ============================================================================

export const ALL_VALIDATION_RULES: ValidationRule[] = [
  ...scoreRangeRules,
  ...confidenceRules,
  ...ratingRules,
  ...positiveValueRules,
  ...formatRules,
  ...percentageRules,
] as ValidationRule[];

// ============================================================================
// VALIDATOR CLASS
// ============================================================================

/**
 * Constraint Validator
 */
export class ConstraintValidator {
  private rules: Map<string, ValidationRule[]> = new Map();

  constructor(customRules: ValidationRule[] = []) {
    // Index rules by field
    for (const rule of [...ALL_VALIDATION_RULES, ...customRules]) {
      for (const field of rule.fields) {
        const existing = this.rules.get(field) || [];
        existing.push(rule);
        this.rules.set(field, existing);
      }
    }
  }

  /**
   * Validate a single field value
   */
  validateField(
    field: string,
    value: unknown,
    record?: Record<string, unknown>
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const rules = this.rules.get(field);

    if (!rules) return violations;

    for (const rule of rules) {
      if (!rule.validate(value as never, record)) {
        violations.push({
          rule: rule.name,
          fields: rule.fields,
          message: rule.errorMessage,
          value,
          severity: rule.severity,
        });
      }
    }

    return violations;
  }

  /**
   * Validate an entire record
   */
  validateRecord(record: Record<string, unknown>): ValidationResult {
    const violations: ValidationViolation[] = [];

    for (const [field, value] of Object.entries(record)) {
      violations.push(...this.validateField(field, value, record));
    }

    // Run cross-field validations
    violations.push(...this.validateCrossField(record));

    return {
      valid: violations.filter((v) => v.severity === 'error').length === 0,
      violations,
      errorCount: violations.filter((v) => v.severity === 'error').length,
      warningCount: violations.filter((v) => v.severity === 'warning').length,
    };
  }

  /**
   * Cross-field validations
   */
  private validateCrossField(
    record: Record<string, unknown>
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // Token sum consistency
    const inputTokens = record.input_tokens ?? record.inputTokens;
    const outputTokens = record.output_tokens ?? record.outputTokens;
    const totalTokens = record.total_tokens ?? record.totalTokens;

    if (
      inputTokens !== null &&
      inputTokens !== undefined &&
      outputTokens !== null &&
      outputTokens !== undefined &&
      totalTokens !== null &&
      totalTokens !== undefined
    ) {
      if (totalTokens !== (inputTokens as number) + (outputTokens as number)) {
        violations.push({
          rule: 'chk_tokens_sum_consistent',
          fields: ['input_tokens', 'output_tokens', 'total_tokens'],
          message: 'Total tokens must equal input + output tokens',
          value: { inputTokens, outputTokens, totalTokens },
          severity: 'error',
        });
      }
    }

    // Date range validity
    const startDate = record.current_period_start ?? record.startDate;
    const endDate = record.current_period_end ?? record.endDate;

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      if (end <= start) {
        violations.push({
          rule: 'chk_date_range_valid',
          fields: ['current_period_start', 'current_period_end'],
          message: 'End date must be after start date',
          value: { startDate, endDate },
          severity: 'error',
        });
      }
    }

    // Rating/positive consistency
    const isPositive = record.is_positive ?? record.isPositive;
    const rating = record.rating;

    if (isPositive !== null && isPositive !== undefined && rating !== null && rating !== undefined) {
      const ratingNum = rating as number;
      if (isPositive === true && ratingNum < 4 && ratingNum !== 3) {
        violations.push({
          rule: 'chk_positive_rating_consistent',
          fields: ['is_positive', 'rating'],
          message:
            'Positive feedback should have rating >= 4 (or neutral 3)',
          value: { isPositive, rating },
          severity: 'warning',
        });
      }
      if (isPositive === false && ratingNum > 2 && ratingNum !== 3) {
        violations.push({
          rule: 'chk_positive_rating_consistent',
          fields: ['is_positive', 'rating'],
          message:
            'Negative feedback should have rating <= 2 (or neutral 3)',
          value: { isPositive, rating },
          severity: 'warning',
        });
      }
    }

    return violations;
  }

  /**
   * Validate multiple records
   */
  validateBatch(
    records: Record<string, unknown>[]
  ): { results: ValidationResult[]; summary: BatchValidationSummary } {
    const results = records.map((r) => this.validateRecord(r));

    const summary: BatchValidationSummary = {
      totalRecords: records.length,
      validRecords: results.filter((r) => r.valid).length,
      invalidRecords: results.filter((r) => !r.valid).length,
      totalErrors: results.reduce((sum, r) => sum + r.errorCount, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warningCount, 0),
      violationsByRule: {},
    };

    // Count violations by rule
    for (const result of results) {
      for (const violation of result.violations) {
        summary.violationsByRule[violation.rule] =
          (summary.violationsByRule[violation.rule] || 0) + 1;
      }
    }

    return { results, summary };
  }
}

/**
 * Batch validation summary
 */
export interface BatchValidationSummary {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  totalErrors: number;
  totalWarnings: number;
  violationsByRule: Record<string, number>;
}

// ============================================================================
// FACTORY
// ============================================================================

let validatorInstance: ConstraintValidator | null = null;

export function getConstraintValidator(
  customRules?: ValidationRule[]
): ConstraintValidator {
  if (!validatorInstance) {
    validatorInstance = new ConstraintValidator(customRules);
  }
  return validatorInstance;
}

export function initConstraintValidator(
  customRules: ValidationRule[] = []
): ConstraintValidator {
  validatorInstance = new ConstraintValidator(customRules);
  return validatorInstance;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Quick validation helpers
 */
export const validators = {
  isScoreValid: (score: number | null | undefined): boolean =>
    score === null || score === undefined || (score >= 0 && score <= 100),

  isConfidenceValid: (confidence: number | null | undefined): boolean =>
    confidence === null ||
    confidence === undefined ||
    (confidence >= 0 && confidence <= 1),

  isRatingValid: (rating: number | null | undefined): boolean =>
    rating === null || rating === undefined || (rating >= 1 && rating <= 5),

  isPositive: (value: number | null | undefined): boolean =>
    value === null || value === undefined || value >= 0,

  isEmailValid: (email: string | null | undefined): boolean =>
    !email || /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email),

  isUrlValid: (url: string | null | undefined): boolean =>
    !url || /^https?:\/\/[^\s]+$/.test(url),

  isWalletAddressValid: (address: string | null | undefined): boolean =>
    !address || /^0x[a-fA-F0-9]{40}$/.test(address),

  isPercentageValid: (pct: number | null | undefined): boolean =>
    pct === null || pct === undefined || (pct >= 0 && pct <= 100),
};

/**
 * Create a validation middleware for API routes
 */
export function createValidationMiddleware(customRules?: ValidationRule[]) {
  const validator = new ConstraintValidator(customRules);

  return function validateRequest(
    body: Record<string, unknown>
  ): ValidationResult {
    return validator.validateRecord(body);
  };
}
