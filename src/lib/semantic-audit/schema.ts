/**
 * Schema Validation
 *
 * Validate data against schema definitions
 *
 * Phase 3, Week 10
 */

import type {
  FieldSchema,
  FieldType,
  SchemaValidationResult,
  SchemaValidationError,
} from './types';

type RecordType = Record<string, unknown>;

// ================================================================
// SCHEMA VALIDATION
// ================================================================

/**
 * Validate a record against a schema
 */
export function validateSchema(
  record: RecordType,
  schema: Record<string, FieldSchema>
): SchemaValidationResult {
  const errors: SchemaValidationError[] = [];
  const warnings: SchemaValidationError[] = [];
  const validatedFields: string[] = [];
  const recordKeys = new Set(Object.keys(record));
  const schemaKeys = new Set(Object.keys(schema));

  // Find extra and missing fields
  const extraFields = [...recordKeys].filter((k) => !schemaKeys.has(k));
  const missingFields: string[] = [];

  // Validate each schema field
  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    validatedFields.push(fieldName);
    const value = record[fieldName];

    // Check required
    if (fieldSchema.required && (value === undefined || value === null)) {
      missingFields.push(fieldName);
      errors.push({
        field: fieldName,
        message: `Required field "${fieldName}" is missing`,
        expected: fieldSchema.type,
        actual: undefined,
        code: 'REQUIRED_FIELD_MISSING',
      });
      continue;
    }

    // Skip validation if value is null/undefined and not required
    if (value === undefined || value === null) continue;

    // Validate type
    const typeErrors = validateFieldType(fieldName, value, fieldSchema);
    errors.push(...typeErrors);

    // Validate constraints
    const constraintErrors = validateConstraints(fieldName, value, fieldSchema);
    errors.push(...constraintErrors);

    // Validate nested schema
    if (fieldSchema.type === 'object' && fieldSchema.properties) {
      const nestedResult = validateSchema(value as RecordType, fieldSchema.properties);
      errors.push(...nestedResult.errors.map((e) => ({
        ...e,
        field: `${fieldName}.${e.field}`,
      })));
      warnings.push(...nestedResult.warnings.map((w) => ({
        ...w,
        field: `${fieldName}.${w.field}`,
      })));
    }

    // Validate array items
    if (fieldSchema.type === 'array' && fieldSchema.items && Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const itemErrors = validateFieldType(`${fieldName}[${i}]`, value[i], fieldSchema.items);
        errors.push(...itemErrors);
      }
    }
  }

  // Add warnings for extra fields
  for (const field of extraFields) {
    warnings.push({
      field,
      message: `Unexpected field "${field}" not in schema`,
      code: 'EXTRA_FIELD',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    validatedFields,
    extraFields,
    missingFields,
  };
}

/**
 * Validate field type
 */
function validateFieldType(
  fieldName: string,
  value: unknown,
  schema: FieldSchema
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];
  const actualType = getActualType(value);

  if (!isTypeValid(value, schema.type)) {
    errors.push({
      field: fieldName,
      message: `Expected type "${schema.type}", got "${actualType}"`,
      expected: schema.type,
      actual: actualType,
      code: 'TYPE_MISMATCH',
    });
  }

  return errors;
}

/**
 * Validate field constraints
 */
function validateConstraints(
  fieldName: string,
  value: unknown,
  schema: FieldSchema
): SchemaValidationError[] {
  const errors: SchemaValidationError[] = [];

  // Enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({
      field: fieldName,
      message: `Value must be one of: ${schema.enum.join(', ')}`,
      expected: schema.enum,
      actual: value,
      code: 'ENUM_VIOLATION',
    });
  }

  // String constraints
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        field: fieldName,
        message: `String length ${value.length} is less than minimum ${schema.minLength}`,
        expected: schema.minLength,
        actual: value.length,
        code: 'MIN_LENGTH_VIOLATION',
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        field: fieldName,
        message: `String length ${value.length} exceeds maximum ${schema.maxLength}`,
        expected: schema.maxLength,
        actual: value.length,
        code: 'MAX_LENGTH_VIOLATION',
      });
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push({
          field: fieldName,
          message: `Value does not match pattern: ${schema.pattern}`,
          expected: schema.pattern,
          actual: value,
          code: 'PATTERN_VIOLATION',
        });
      }
    }
  }

  // Number constraints
  if (typeof value === 'number') {
    if (schema.min !== undefined && value < schema.min) {
      errors.push({
        field: fieldName,
        message: `Value ${value} is less than minimum ${schema.min}`,
        expected: schema.min,
        actual: value,
        code: 'MIN_VIOLATION',
      });
    }

    if (schema.max !== undefined && value > schema.max) {
      errors.push({
        field: fieldName,
        message: `Value ${value} exceeds maximum ${schema.max}`,
        expected: schema.max,
        actual: value,
        code: 'MAX_VIOLATION',
      });
    }
  }

  // Array constraints
  if (Array.isArray(value)) {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({
        field: fieldName,
        message: `Array length ${value.length} is less than minimum ${schema.minLength}`,
        expected: schema.minLength,
        actual: value.length,
        code: 'MIN_LENGTH_VIOLATION',
      });
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({
        field: fieldName,
        message: `Array length ${value.length} exceeds maximum ${schema.maxLength}`,
        expected: schema.maxLength,
        actual: value.length,
        code: 'MAX_LENGTH_VIOLATION',
      });
    }
  }

  return errors;
}

/**
 * Check if value matches expected type
 */
function isTypeValid(value: unknown, expectedType: FieldType): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';

    case 'number':
      return typeof value === 'number' && !isNaN(value);

    case 'integer':
      return typeof value === 'number' && Number.isInteger(value);

    case 'boolean':
      return typeof value === 'boolean';

    case 'date':
      return value instanceof Date ||
        (typeof value === 'string' && !isNaN(Date.parse(value)));

    case 'datetime':
      return value instanceof Date ||
        (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value));

    case 'email':
      return typeof value === 'string' &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

    case 'url':
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }

    case 'uuid':
      return typeof value === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    case 'json':
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
          return true;
        } catch {
          return false;
        }
      }
      return typeof value === 'object';

    case 'array':
      return Array.isArray(value);

    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);

    case 'any':
      return true;

    default:
      return true;
  }
}

/**
 * Get actual type of value
 */
function getActualType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  if (value instanceof Date) return 'date';
  return typeof value;
}

// ================================================================
// SCHEMA BUILDING
// ================================================================

/**
 * Create a string field schema
 */
export function stringField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'string',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a number field schema
 */
export function numberField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'number',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create an integer field schema
 */
export function integerField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'integer',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a boolean field schema
 */
export function booleanField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'boolean',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create an email field schema
 */
export function emailField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'email',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a URL field schema
 */
export function urlField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'url',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a UUID field schema
 */
export function uuidField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'uuid',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a date field schema
 */
export function dateField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'date',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create a datetime field schema
 */
export function datetimeField(options: Partial<Omit<FieldSchema, 'type' | 'name'>> = {}): Omit<FieldSchema, 'name'> {
  return {
    type: 'datetime',
    required: false,
    unique: false,
    ...options,
  };
}

/**
 * Create an array field schema
 */
export function arrayField(
  items: FieldSchema,
  options: Partial<Omit<FieldSchema, 'type' | 'name' | 'items'>> = {}
): Omit<FieldSchema, 'name'> {
  return {
    type: 'array',
    required: false,
    unique: false,
    items,
    ...options,
  };
}

/**
 * Create an object field schema
 */
export function objectField(
  properties: Record<string, FieldSchema>,
  options: Partial<Omit<FieldSchema, 'type' | 'name' | 'properties'>> = {}
): Omit<FieldSchema, 'name'> {
  return {
    type: 'object',
    required: false,
    unique: false,
    properties,
    ...options,
  };
}

/**
 * Create an enum field schema
 */
export function enumField<T>(
  values: T[],
  options: Partial<Omit<FieldSchema, 'type' | 'name' | 'enum'>> = {}
): Omit<FieldSchema, 'name'> {
  return {
    type: 'string',
    required: false,
    unique: false,
    enum: values as unknown[],
    ...options,
  };
}

// ================================================================
// SCHEMA INFERENCE
// ================================================================

/**
 * Infer schema from sample records
 */
export function inferSchema(records: RecordType[]): Record<string, FieldSchema> {
  if (records.length === 0) return {};

  const schema: Record<string, FieldSchema> = {};
  const fieldStats = new Map<string, FieldStats>();

  // Collect stats from all records
  for (const record of records) {
    collectFieldStats(record, fieldStats, '');
  }

  // Build schema from stats
  for (const [fieldPath, stats] of fieldStats) {
    const fieldName = fieldPath.replace(/^\.|\.$/g, '');
    schema[fieldName] = inferFieldSchema(fieldName, stats, records.length);
  }

  return schema;
}

interface FieldStats {
  types: Set<string>;
  nullCount: number;
  uniqueValues: Set<string>;
  minNumber?: number;
  maxNumber?: number;
  minLength?: number;
  maxLength?: number;
  sampleValues: unknown[];
}

function collectFieldStats(
  obj: RecordType,
  stats: Map<string, FieldStats>,
  prefix: string
): void {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    let fieldStats = stats.get(path);

    if (!fieldStats) {
      fieldStats = {
        types: new Set(),
        nullCount: 0,
        uniqueValues: new Set(),
        sampleValues: [],
      };
      stats.set(path, fieldStats);
    }

    if (value === null || value === undefined) {
      fieldStats.nullCount++;
      fieldStats.types.add('null');
    } else {
      const type = Array.isArray(value) ? 'array' : typeof value;
      fieldStats.types.add(type);

      if (fieldStats.sampleValues.length < 10) {
        fieldStats.sampleValues.push(value);
      }

      if (typeof value === 'string') {
        fieldStats.uniqueValues.add(value);
        const len = value.length;
        fieldStats.minLength = Math.min(fieldStats.minLength ?? len, len);
        fieldStats.maxLength = Math.max(fieldStats.maxLength ?? len, len);
      }

      if (typeof value === 'number') {
        fieldStats.minNumber = Math.min(fieldStats.minNumber ?? value, value);
        fieldStats.maxNumber = Math.max(fieldStats.maxNumber ?? value, value);
      }

      if (type === 'object' && !Array.isArray(value)) {
        collectFieldStats(value as RecordType, stats, path);
      }
    }
  }
}

function inferFieldSchema(
  name: string,
  stats: FieldStats,
  totalRecords: number
): FieldSchema {
  const types = [...stats.types].filter((t) => t !== 'null');
  const primaryType = types[0] || 'any';
  const nullRate = stats.nullCount / totalRecords;

  const schema: FieldSchema = {
    name,
    type: mapJsTypeToFieldType(primaryType, stats),
    required: nullRate < 0.01,
    unique: stats.uniqueValues.size === totalRecords - stats.nullCount,
  };

  // Add constraints for numbers
  if (schema.type === 'number' || schema.type === 'integer') {
    if (stats.minNumber !== undefined) schema.min = stats.minNumber;
    if (stats.maxNumber !== undefined) schema.max = stats.maxNumber;
  }

  // Add constraints for strings
  if (schema.type === 'string') {
    if (stats.minLength !== undefined) schema.minLength = stats.minLength;
    if (stats.maxLength !== undefined) schema.maxLength = stats.maxLength;
  }

  // Detect enum (if limited unique values)
  if (stats.uniqueValues.size <= 10 && stats.uniqueValues.size < totalRecords * 0.1) {
    schema.enum = [...stats.uniqueValues];
  }

  return schema;
}

function mapJsTypeToFieldType(jsType: string, stats: FieldStats): FieldType {
  switch (jsType) {
    case 'string':
      // Try to detect special types
      if (stats.sampleValues.every((v) => typeof v === 'string' && isEmail(v))) {
        return 'email';
      }
      if (stats.sampleValues.every((v) => typeof v === 'string' && isUrl(v))) {
        return 'url';
      }
      if (stats.sampleValues.every((v) => typeof v === 'string' && isUuid(v))) {
        return 'uuid';
      }
      if (stats.sampleValues.every((v) => typeof v === 'string' && isDatetime(v))) {
        return 'datetime';
      }
      return 'string';

    case 'number':
      if (stats.sampleValues.every((v) => typeof v === 'number' && Number.isInteger(v))) {
        return 'integer';
      }
      return 'number';

    case 'boolean':
      return 'boolean';

    case 'object':
      return 'object';

    case 'array':
      return 'array';

    default:
      return 'any';
  }
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isDatetime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(value);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  validateSchema,
  stringField,
  numberField,
  integerField,
  booleanField,
  emailField,
  urlField,
  uuidField,
  dateField,
  datetimeField,
  arrayField,
  objectField,
  enumField,
  inferSchema,
};
