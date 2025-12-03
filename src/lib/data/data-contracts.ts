/**
 * Data Contracts Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Schema contract definitions (JSON Schema-based)
 * - Semantic contract rules
 * - SLA definitions
 * - Contract versioning
 * - Breaking change detection
 * - Contract validation
 * - Producer/consumer registry
 */

import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

export type DataType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'timestamp'
  | 'date'
  | 'uuid'
  | 'json';

export type ConstraintType =
  | 'not_null'
  | 'unique'
  | 'primary_key'
  | 'foreign_key'
  | 'check'
  | 'enum'
  | 'regex'
  | 'range'
  | 'length';

export type BreakingChangeType =
  | 'field_removed'
  | 'field_type_changed'
  | 'constraint_added'
  | 'enum_value_removed'
  | 'semantic_rule_added'
  | 'sla_tightened';

export type ContractStatus = 'draft' | 'active' | 'deprecated' | 'retired';

export type SeverityLevel = 'info' | 'warning' | 'error' | 'critical';

export interface FieldConstraint {
  type: ConstraintType;
  value?: unknown;
  message?: string;
}

export interface FieldDefinition {
  name: string;
  type: DataType;
  description?: string;
  required: boolean;
  constraints: FieldConstraint[];
  default?: unknown;
  examples?: unknown[];
  deprecated?: boolean;
  deprecationMessage?: string;
}

export interface SemanticRule {
  id: string;
  name: string;
  description: string;
  expression: string; // SQL-like expression
  severity: SeverityLevel;
  enabled: boolean;
}

export interface SLADefinition {
  metric: string;
  target: number;
  unit: string;
  window: string; // e.g., '24h', '7d'
  penalty?: string;
}

export interface DataContract {
  id: string;
  name: string;
  version: string;
  status: ContractStatus;
  description: string;
  owner: string;
  domain: string;
  schema: {
    fields: FieldDefinition[];
    primaryKey?: string[];
    partitionBy?: string;
  };
  semanticRules: SemanticRule[];
  slas: SLADefinition[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    changelog?: string;
  };
  tags: string[];
}

export interface ContractVersion {
  version: string;
  contract: DataContract;
  publishedAt: Date;
  publishedBy: string;
  changelog: string;
  breakingChanges: BreakingChange[];
}

export interface BreakingChange {
  type: BreakingChangeType;
  field?: string;
  description: string;
  migration?: string;
}

export interface Producer {
  id: string;
  name: string;
  contractId: string;
  version: string;
  endpoint?: string;
  contact: string;
  registeredAt: Date;
}

export interface Consumer {
  id: string;
  name: string;
  contractId: string;
  version: string;
  purpose: string;
  contact: string;
  registeredAt: Date;
  lastAccessedAt?: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    contractId: string;
    version: string;
    validatedAt: Date;
    recordCount: number;
    duration: number;
  };
}

export interface ValidationError {
  field: string;
  constraint: ConstraintType;
  message: string;
  value?: unknown;
  row?: number;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

export interface CompatibilityResult {
  compatible: boolean;
  breakingChanges: BreakingChange[];
  warnings: string[];
  migrationSteps?: string[];
}

// ============================================================================
// ZOD SCHEMA GENERATOR
// ============================================================================

/**
 * Generate Zod schema from field definition
 */
function fieldToZod(field: FieldDefinition): z.ZodTypeAny {
  // Build base type with constraints applied together
  let baseSchema: z.ZodTypeAny;

  // Get range constraint if any
  const rangeConstraint = field.constraints.find((c) => c.type === 'range');
  const lengthConstraint = field.constraints.find((c) => c.type === 'length');
  const regexConstraint = field.constraints.find((c) => c.type === 'regex');
  const enumConstraint = field.constraints.find((c) => c.type === 'enum');

  // Handle enum first - it overrides base type
  if (enumConstraint && Array.isArray(enumConstraint.value)) {
    baseSchema = z.enum(enumConstraint.value as [string, ...string[]]);
  } else {
    // Base type
    switch (field.type) {
      case 'string': {
        let strSchema = z.string();
        // Apply regex
        if (regexConstraint && typeof regexConstraint.value === 'string') {
          strSchema = strSchema.regex(new RegExp(regexConstraint.value));
        }
        // Apply length
        if (lengthConstraint) {
          const length = lengthConstraint.value as { min?: number; max?: number };
          if (length.min !== undefined) strSchema = strSchema.min(length.min);
          if (length.max !== undefined) strSchema = strSchema.max(length.max);
        }
        baseSchema = strSchema;
        break;
      }
      case 'integer': {
        let numSchema = z.number().int();
        if (rangeConstraint) {
          const range = rangeConstraint.value as { min?: number; max?: number };
          if (range.min !== undefined) numSchema = numSchema.min(range.min);
          if (range.max !== undefined) numSchema = numSchema.max(range.max);
        }
        baseSchema = numSchema;
        break;
      }
      case 'number': {
        let numSchema = z.number();
        if (rangeConstraint) {
          const range = rangeConstraint.value as { min?: number; max?: number };
          if (range.min !== undefined) numSchema = numSchema.min(range.min);
          if (range.max !== undefined) numSchema = numSchema.max(range.max);
        }
        baseSchema = numSchema;
        break;
      }
      case 'boolean':
        baseSchema = z.boolean();
        break;
      case 'array':
        baseSchema = z.array(z.unknown());
        break;
      case 'object':
      case 'json':
        baseSchema = z.record(z.string(), z.unknown());
        break;
      case 'timestamp':
      case 'date':
        baseSchema = z.coerce.date();
        break;
      case 'uuid':
        baseSchema = z.string().uuid();
        break;
      default:
        baseSchema = z.unknown();
    }
  }

  // Optional
  if (!field.required) {
    return baseSchema.optional();
  }

  return baseSchema;
}

/**
 * Generate Zod schema from contract
 */
export function contractToZodSchema(contract: DataContract): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of contract.schema.fields) {
    shape[field.name] = fieldToZod(field);
  }

  return z.object(shape);
}

// ============================================================================
// CONTRACT REGISTRY
// ============================================================================

export class ContractRegistry {
  private contracts: Map<string, ContractVersion[]> = new Map();
  private producers: Map<string, Producer[]> = new Map();
  private consumers: Map<string, Consumer[]> = new Map();

  /**
   * Register a new contract or version
   */
  registerContract(contract: DataContract, publishedBy: string, changelog: string = ''): ContractVersion {
    const versions = this.contracts.get(contract.id) || [];
    const previousVersion = versions[versions.length - 1]?.contract;

    // Check for breaking changes
    const breakingChanges = previousVersion
      ? this.detectBreakingChanges(previousVersion, contract)
      : [];

    const version: ContractVersion = {
      version: contract.version,
      contract: { ...contract, metadata: { ...contract.metadata, updatedAt: new Date() } },
      publishedAt: new Date(),
      publishedBy,
      changelog,
      breakingChanges,
    };

    versions.push(version);
    this.contracts.set(contract.id, versions);

    return version;
  }

  /**
   * Get contract by ID and optional version
   */
  getContract(contractId: string, version?: string): DataContract | null {
    const versions = this.contracts.get(contractId);
    if (!versions || versions.length === 0) return null;

    if (version) {
      const found = versions.find((v) => v.version === version);
      return found?.contract || null;
    }

    // Return latest active version
    for (let i = versions.length - 1; i >= 0; i--) {
      if (versions[i].contract.status === 'active') {
        return versions[i].contract;
      }
    }

    return versions[versions.length - 1].contract;
  }

  /**
   * Get all versions of a contract
   */
  getVersions(contractId: string): ContractVersion[] {
    return this.contracts.get(contractId) || [];
  }

  /**
   * Get all contracts
   */
  getAllContracts(): DataContract[] {
    const result: DataContract[] = [];
    for (const versions of this.contracts.values()) {
      if (versions.length > 0) {
        result.push(versions[versions.length - 1].contract);
      }
    }
    return result;
  }

  /**
   * Register a producer
   */
  registerProducer(producer: Omit<Producer, 'registeredAt'>): Producer {
    const fullProducer: Producer = {
      ...producer,
      registeredAt: new Date(),
    };

    const producers = this.producers.get(producer.contractId) || [];
    producers.push(fullProducer);
    this.producers.set(producer.contractId, producers);

    return fullProducer;
  }

  /**
   * Register a consumer
   */
  registerConsumer(consumer: Omit<Consumer, 'registeredAt'>): Consumer {
    const fullConsumer: Consumer = {
      ...consumer,
      registeredAt: new Date(),
    };

    const consumers = this.consumers.get(consumer.contractId) || [];
    consumers.push(fullConsumer);
    this.consumers.set(consumer.contractId, consumers);

    return fullConsumer;
  }

  /**
   * Get producers for a contract
   */
  getProducers(contractId: string): Producer[] {
    return this.producers.get(contractId) || [];
  }

  /**
   * Get consumers for a contract
   */
  getConsumers(contractId: string): Consumer[] {
    return this.consumers.get(contractId) || [];
  }

  /**
   * Detect breaking changes between versions
   */
  detectBreakingChanges(oldContract: DataContract, newContract: DataContract): BreakingChange[] {
    const changes: BreakingChange[] = [];
    const oldFields = new Map(oldContract.schema.fields.map((f) => [f.name, f]));
    const newFields = new Map(newContract.schema.fields.map((f) => [f.name, f]));

    // Check for removed fields
    for (const [name, oldField] of oldFields) {
      const newField = newFields.get(name);

      if (!newField) {
        changes.push({
          type: 'field_removed',
          field: name,
          description: `Field '${name}' was removed`,
          migration: `ALTER TABLE DROP COLUMN ${name}`,
        });
        continue;
      }

      // Check type changes
      if (oldField.type !== newField.type) {
        changes.push({
          type: 'field_type_changed',
          field: name,
          description: `Field '${name}' type changed from '${oldField.type}' to '${newField.type}'`,
          migration: `ALTER TABLE ALTER COLUMN ${name} TYPE ${newField.type}`,
        });
      }

      // Check new constraints
      const oldConstraints = new Set(oldField.constraints.map((c) => c.type));
      for (const constraint of newField.constraints) {
        if (!oldConstraints.has(constraint.type)) {
          changes.push({
            type: 'constraint_added',
            field: name,
            description: `New constraint '${constraint.type}' added to field '${name}'`,
          });
        }
      }

      // Check enum value removal
      const oldEnum = oldField.constraints.find((c) => c.type === 'enum');
      const newEnum = newField.constraints.find((c) => c.type === 'enum');
      if (oldEnum && newEnum && Array.isArray(oldEnum.value) && Array.isArray(newEnum.value)) {
        const oldValues = oldEnum.value as unknown[];
        const newValues = newEnum.value as unknown[];
        const removedValues = oldValues.filter((v) => !newValues.includes(v));
        for (const value of removedValues) {
          changes.push({
            type: 'enum_value_removed',
            field: name,
            description: `Enum value '${value}' removed from field '${name}'`,
          });
        }
      }
    }

    // Check for new required fields (breaking for consumers)
    for (const [name, newField] of newFields) {
      if (!oldFields.has(name) && newField.required) {
        changes.push({
          type: 'constraint_added',
          field: name,
          description: `New required field '${name}' added`,
        });
      }
    }

    // Check SLA tightening
    for (const newSla of newContract.slas) {
      const oldSla = oldContract.slas.find((s) => s.metric === newSla.metric);
      if (oldSla && newSla.target < oldSla.target) {
        changes.push({
          type: 'sla_tightened',
          description: `SLA '${newSla.metric}' target tightened from ${oldSla.target} to ${newSla.target}`,
        });
      }
    }

    return changes;
  }

  /**
   * Check compatibility with consumers
   */
  checkCompatibility(contractId: string, newVersion: DataContract): CompatibilityResult {
    const currentContract = this.getContract(contractId);
    if (!currentContract) {
      return { compatible: true, breakingChanges: [], warnings: [] };
    }

    const breakingChanges = this.detectBreakingChanges(currentContract, newVersion);
    const consumers = this.getConsumers(contractId);

    const warnings: string[] = [];
    if (breakingChanges.length > 0 && consumers.length > 0) {
      warnings.push(
        `${consumers.length} consumers may be affected by breaking changes`
      );
      for (const consumer of consumers) {
        warnings.push(`  - ${consumer.name} (${consumer.contact})`);
      }
    }

    const migrationSteps = breakingChanges
      .filter((c) => c.migration)
      .map((c) => c.migration!);

    return {
      compatible: breakingChanges.length === 0,
      breakingChanges,
      warnings,
      migrationSteps: migrationSteps.length > 0 ? migrationSteps : undefined,
    };
  }

  /**
   * Deprecate a contract version
   */
  deprecateContract(contractId: string, version: string, message: string): boolean {
    const versions = this.contracts.get(contractId);
    if (!versions) return false;

    const found = versions.find((v) => v.version === version);
    if (!found) return false;

    found.contract.status = 'deprecated';
    found.changelog = message;

    return true;
  }

  /**
   * Get contract summary
   */
  getSummary(): {
    totalContracts: number;
    activeContracts: number;
    deprecatedContracts: number;
    totalProducers: number;
    totalConsumers: number;
    byDomain: Record<string, number>;
  } {
    const contracts = this.getAllContracts();

    const byDomain: Record<string, number> = {};
    let active = 0;
    let deprecated = 0;

    for (const contract of contracts) {
      if (contract.status === 'active') active++;
      if (contract.status === 'deprecated') deprecated++;

      byDomain[contract.domain] = (byDomain[contract.domain] || 0) + 1;
    }

    let totalProducers = 0;
    let totalConsumers = 0;
    for (const producers of this.producers.values()) {
      totalProducers += producers.length;
    }
    for (const consumers of this.consumers.values()) {
      totalConsumers += consumers.length;
    }

    return {
      totalContracts: contracts.length,
      activeContracts: active,
      deprecatedContracts: deprecated,
      totalProducers,
      totalConsumers,
      byDomain,
    };
  }

  /**
   * Reset registry (for testing)
   */
  reset(): void {
    this.contracts.clear();
    this.producers.clear();
    this.consumers.clear();
  }
}

// ============================================================================
// CONTRACT VALIDATOR
// ============================================================================

export class ContractValidator {
  private registry: ContractRegistry;

  constructor(registry: ContractRegistry) {
    this.registry = registry;
  }

  /**
   * Validate data against contract
   */
  validate(contractId: string, data: unknown[], version?: string): ValidationResult {
    const startTime = Date.now();
    const contract = this.registry.getContract(contractId, version);

    if (!contract) {
      return {
        valid: false,
        errors: [
          {
            field: '_contract',
            constraint: 'check',
            message: `Contract '${contractId}' not found`,
          },
        ],
        warnings: [],
        metadata: {
          contractId,
          version: version || 'unknown',
          validatedAt: new Date(),
          recordCount: data.length,
          duration: Date.now() - startTime,
        },
      };
    }

    const schema = contractToZodSchema(contract);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate each record
    for (let i = 0; i < data.length; i++) {
      const record = data[i];
      const result = schema.safeParse(record);

      if (!result.success) {
        for (const issue of result.error.issues) {
          errors.push({
            field: issue.path.join('.'),
            constraint: 'check',
            message: issue.message,
            value: (record as Record<string, unknown>)?.[issue.path[0] as string],
            row: i,
          });
        }
      }
    }

    // Check deprecated fields usage
    for (const field of contract.schema.fields) {
      if (field.deprecated) {
        const hasUsage = data.some(
          (record) =>
            record &&
            typeof record === 'object' &&
            (record as Record<string, unknown>)[field.name] !== undefined
        );

        if (hasUsage) {
          warnings.push({
            field: field.name,
            message: `Field '${field.name}' is deprecated: ${field.deprecationMessage || 'Please migrate to alternative'}`,
            suggestion: field.deprecationMessage,
          });
        }
      }
    }

    // Validate semantic rules
    for (const rule of contract.semanticRules.filter((r) => r.enabled)) {
      const ruleErrors = this.evaluateSemanticRule(rule, data);
      errors.push(...ruleErrors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata: {
        contractId,
        version: contract.version,
        validatedAt: new Date(),
        recordCount: data.length,
        duration: Date.now() - startTime,
      },
    };
  }

  /**
   * Evaluate semantic rule (simplified - real implementation would use SQL)
   */
  private evaluateSemanticRule(rule: SemanticRule, data: unknown[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Parse simple expressions like "field_a > field_b"
    const comparisonMatch = rule.expression.match(/(\w+)\s*(>|<|>=|<=|==|!=)\s*(\w+)/);
    if (!comparisonMatch) return errors;

    const [, leftField, operator, rightField] = comparisonMatch;
    if (!leftField || !operator || !rightField) return errors;

    for (let i = 0; i < data.length; i++) {
      const record = data[i] as Record<string, unknown>;
      if (!record) continue;

      const leftValue = record[leftField];
      const rightValue = record[rightField];

      if (leftValue === undefined || leftValue === null) continue;
      if (rightValue === undefined || rightValue === null) continue;

      // Cast to number for comparison
      const left = Number(leftValue);
      const right = Number(rightValue);

      if (isNaN(left) || isNaN(right)) continue;

      let valid = true;
      switch (operator) {
        case '>':
          valid = left > right;
          break;
        case '<':
          valid = left < right;
          break;
        case '>=':
          valid = left >= right;
          break;
        case '<=':
          valid = left <= right;
          break;
        case '==':
          valid = left === right;
          break;
        case '!=':
          valid = left !== right;
          break;
      }

      if (!valid) {
        errors.push({
          field: `${leftField}, ${rightField}`,
          constraint: 'check',
          message: `Semantic rule '${rule.name}' violated: ${rule.expression}`,
          row: i,
        });
      }
    }

    return errors;
  }

  /**
   * Generate validation report
   */
  generateReport(result: ValidationResult): string {
    const lines: string[] = [
      '# Contract Validation Report',
      '',
      `**Contract:** ${result.metadata.contractId} v${result.metadata.version}`,
      `**Status:** ${result.valid ? '✅ VALID' : '❌ INVALID'}`,
      `**Records Validated:** ${result.metadata.recordCount}`,
      `**Duration:** ${result.metadata.duration}ms`,
      `**Timestamp:** ${result.metadata.validatedAt.toISOString()}`,
      '',
    ];

    if (result.errors.length > 0) {
      lines.push('## Errors', '');
      const groupedErrors = new Map<string, ValidationError[]>();
      for (const error of result.errors) {
        const key = `${error.field}:${error.constraint}`;
        const group = groupedErrors.get(key) || [];
        group.push(error);
        groupedErrors.set(key, group);
      }

      for (const [key, errors] of groupedErrors) {
        lines.push(`### ${key} (${errors.length} occurrences)`);
        lines.push(`- ${errors[0].message}`);
        if (errors.length > 3) {
          lines.push(`- First rows: ${errors.slice(0, 3).map((e) => e.row).join(', ')}`);
        }
        lines.push('');
      }
    }

    if (result.warnings.length > 0) {
      lines.push('## Warnings', '');
      for (const warning of result.warnings) {
        lines.push(`- **${warning.field}:** ${warning.message}`);
        if (warning.suggestion) {
          lines.push(`  - Suggestion: ${warning.suggestion}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// PREDEFINED CONTRACTS
// ============================================================================

export const TOKEN_PRICES_CONTRACT: DataContract = {
  id: 'token_prices',
  name: 'Token Prices Contract',
  version: '1.0.0',
  status: 'active',
  description: 'Cryptocurrency token price data from CoinGecko',
  owner: 'data-platform',
  domain: 'market-data',
  schema: {
    fields: [
      {
        name: 'coingecko_id',
        type: 'string',
        description: 'CoinGecko token identifier',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'length', value: { min: 1, max: 100 } },
        ],
      },
      {
        name: 'symbol',
        type: 'string',
        description: 'Token symbol (e.g., BTC, ETH)',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'length', value: { min: 1, max: 20 } },
        ],
      },
      {
        name: 'name',
        type: 'string',
        description: 'Token name',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
      {
        name: 'current_price',
        type: 'number',
        description: 'Current price in USD',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'range', value: { min: 0 } },
        ],
      },
      {
        name: 'market_cap',
        type: 'number',
        description: 'Market capitalization in USD',
        required: false,
        constraints: [{ type: 'range', value: { min: 0 } }],
      },
      {
        name: 'market_cap_rank',
        type: 'integer',
        description: 'Market cap ranking',
        required: false,
        constraints: [{ type: 'range', value: { min: 1 } }],
      },
      {
        name: 'price_change_24h',
        type: 'number',
        description: '24-hour price change percentage',
        required: false,
        constraints: [],
      },
      {
        name: 'last_updated',
        type: 'timestamp',
        description: 'Last update timestamp',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
    ],
    primaryKey: ['coingecko_id'],
  },
  semanticRules: [
    {
      id: 'price_positive',
      name: 'Price must be positive',
      description: 'Current price should always be greater than 0',
      expression: 'current_price > 0',
      severity: 'error',
      enabled: true,
    },
  ],
  slas: [
    {
      metric: 'freshness',
      target: 300, // 5 minutes
      unit: 'seconds',
      window: '24h',
    },
    {
      metric: 'completeness',
      target: 99.5,
      unit: 'percent',
      window: '24h',
    },
  ],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    createdBy: 'data-platform',
  },
  tags: ['market-data', 'prices', 'coingecko'],
};

export const PROTOCOL_TVL_CONTRACT: DataContract = {
  id: 'protocol_tvl',
  name: 'Protocol TVL Contract',
  version: '1.0.0',
  status: 'active',
  description: 'DeFi protocol Total Value Locked data from DeFiLlama',
  owner: 'data-platform',
  domain: 'defi',
  schema: {
    fields: [
      {
        name: 'protocol_id',
        type: 'string',
        description: 'DeFiLlama protocol identifier',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
      {
        name: 'protocol_name',
        type: 'string',
        description: 'Protocol display name',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
      {
        name: 'chain',
        type: 'string',
        description: 'Blockchain network',
        required: true,
        constraints: [
          { type: 'not_null' },
          {
            type: 'enum',
            value: [
              'ethereum',
              'bsc',
              'polygon',
              'arbitrum',
              'optimism',
              'avalanche',
              'solana',
              'base',
              'multi-chain',
            ],
          },
        ],
      },
      {
        name: 'tvl',
        type: 'number',
        description: 'Total Value Locked in USD',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'range', value: { min: 0 } },
        ],
      },
      {
        name: 'category',
        type: 'string',
        description: 'Protocol category',
        required: true,
        constraints: [
          {
            type: 'enum',
            value: [
              'dexes',
              'lending',
              'bridge',
              'cdp',
              'yield',
              'derivatives',
              'liquid-staking',
              'insurance',
              'other',
            ],
          },
        ],
      },
      {
        name: 'collected_at',
        type: 'timestamp',
        description: 'Data collection timestamp',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
    ],
    primaryKey: ['protocol_id', 'chain', 'collected_at'],
  },
  semanticRules: [
    {
      id: 'tvl_positive',
      name: 'TVL must be non-negative',
      description: 'TVL should never be negative',
      expression: 'tvl >= 0',
      severity: 'error',
      enabled: true,
    },
  ],
  slas: [
    {
      metric: 'freshness',
      target: 3600, // 1 hour
      unit: 'seconds',
      window: '24h',
    },
    {
      metric: 'completeness',
      target: 99,
      unit: 'percent',
      window: '24h',
    },
  ],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    createdBy: 'data-platform',
  },
  tags: ['defi', 'tvl', 'defillama'],
};

export const GAS_METRICS_CONTRACT: DataContract = {
  id: 'gas_metrics',
  name: 'Gas Metrics Contract',
  version: '1.0.0',
  status: 'active',
  description: 'Blockchain gas prices and transaction metrics',
  owner: 'data-platform',
  domain: 'blockchain',
  schema: {
    fields: [
      {
        name: 'chain',
        type: 'string',
        description: 'Blockchain network',
        required: true,
        constraints: [
          { type: 'not_null' },
          {
            type: 'enum',
            value: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
          },
        ],
      },
      {
        name: 'block_number',
        type: 'integer',
        description: 'Block number',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'range', value: { min: 0 } },
        ],
      },
      {
        name: 'gas_price_gwei',
        type: 'number',
        description: 'Gas price in Gwei',
        required: true,
        constraints: [
          { type: 'not_null' },
          { type: 'range', value: { min: 0 } },
        ],
      },
      {
        name: 'base_fee_gwei',
        type: 'number',
        description: 'Base fee in Gwei (EIP-1559)',
        required: false,
        constraints: [{ type: 'range', value: { min: 0 } }],
      },
      {
        name: 'priority_fee_gwei',
        type: 'number',
        description: 'Priority fee in Gwei',
        required: false,
        constraints: [{ type: 'range', value: { min: 0 } }],
      },
      {
        name: 'block_utilization',
        type: 'number',
        description: 'Block utilization percentage',
        required: false,
        constraints: [{ type: 'range', value: { min: 0, max: 100 } }],
      },
      {
        name: 'collected_at',
        type: 'timestamp',
        description: 'Data collection timestamp',
        required: true,
        constraints: [{ type: 'not_null' }],
      },
    ],
    primaryKey: ['chain', 'block_number'],
  },
  semanticRules: [
    {
      id: 'base_fee_less_than_total',
      name: 'Base fee should be less than total gas price',
      description: 'Base fee component should not exceed total gas price',
      expression: 'base_fee_gwei <= gas_price_gwei',
      severity: 'warning',
      enabled: true,
    },
  ],
  slas: [
    {
      metric: 'freshness',
      target: 60, // 1 minute
      unit: 'seconds',
      window: '1h',
    },
    {
      metric: 'completeness',
      target: 99.9,
      unit: 'percent',
      window: '24h',
    },
  ],
  metadata: {
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
    createdBy: 'data-platform',
  },
  tags: ['blockchain', 'gas', 'transactions'],
};

export const DEFAULT_CONTRACTS: DataContract[] = [
  TOKEN_PRICES_CONTRACT,
  PROTOCOL_TVL_CONTRACT,
  GAS_METRICS_CONTRACT,
];

// ============================================================================
// SINGLETON REGISTRY
// ============================================================================

let defaultRegistry: ContractRegistry | null = null;
let defaultValidator: ContractValidator | null = null;

export function getDefaultRegistry(): ContractRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new ContractRegistry();

    // Register default contracts
    for (const contract of DEFAULT_CONTRACTS) {
      defaultRegistry.registerContract(contract, 'system', 'Initial registration');
    }
  }
  return defaultRegistry;
}

export function getDefaultValidator(): ContractValidator {
  if (!defaultValidator) {
    defaultValidator = new ContractValidator(getDefaultRegistry());
  }
  return defaultValidator;
}

export function resetRegistry(): void {
  defaultRegistry = null;
  defaultValidator = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick contract validation
 */
export function validateAgainstContract(
  contractId: string,
  data: unknown[],
  version?: string
): ValidationResult {
  return getDefaultValidator().validate(contractId, data, version);
}

/**
 * Register a new contract
 */
export function registerContract(
  contract: DataContract,
  publishedBy: string = 'system'
): ContractVersion {
  return getDefaultRegistry().registerContract(contract, publishedBy);
}

/**
 * Get contract
 */
export function getContract(contractId: string, version?: string): DataContract | null {
  return getDefaultRegistry().getContract(contractId, version);
}

/**
 * Check if new version is compatible
 */
export function checkCompatibility(
  contractId: string,
  newVersion: DataContract
): CompatibilityResult {
  return getDefaultRegistry().checkCompatibility(contractId, newVersion);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Registry
  getDefaultRegistry,
  getDefaultValidator,
  resetRegistry,

  // Contract operations
  registerContract,
  getContract,
  validateAgainstContract,
  checkCompatibility,
  contractToZodSchema,

  // Default contracts
  DEFAULT_CONTRACTS,
  TOKEN_PRICES_CONTRACT,
  PROTOCOL_TVL_CONTRACT,
  GAS_METRICS_CONTRACT,
};
