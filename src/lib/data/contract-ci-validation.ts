/**
 * Contract CI/CD Validation Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Schema migration validation
 * - Breaking change detection
 * - Backward compatibility checks
 * - CI pipeline integration
 * - GitHub Actions support
 * - Pre-commit hooks
 * - Automated contract testing
 */

import {
  DataContract,
  BreakingChange,
  CompatibilityResult,
  ValidationResult,
  getDefaultRegistry,
  getDefaultValidator,
  checkCompatibility,
} from './data-contracts';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export type CIProvider = 'github' | 'gitlab' | 'jenkins' | 'circleci' | 'local';

export interface CIConfig {
  provider: CIProvider;
  failOnBreakingChanges: boolean;
  failOnWarnings: boolean;
  notifyOnDeprecations: boolean;
  slackWebhook?: string;
  githubToken?: string;
  prComment: boolean;
  checkName: string;
}

export interface MigrationFile {
  filename: string;
  content: string;
  type: 'up' | 'down';
  version: string;
  appliedAt?: Date;
}

export interface SchemaChange {
  type: 'add_column' | 'drop_column' | 'modify_column' | 'add_constraint' | 'drop_constraint' | 'add_table' | 'drop_table';
  table: string;
  column?: string;
  details: Record<string, unknown>;
  breaking: boolean;
}

export interface MigrationValidationResult {
  valid: boolean;
  migrations: MigrationFile[];
  schemaChanges: SchemaChange[];
  breakingChanges: BreakingChange[];
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export interface CICheckResult {
  passed: boolean;
  summary: string;
  details: string;
  annotations: CIAnnotation[];
  stats: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export interface CIAnnotation {
  file: string;
  line?: number;
  severity: ValidationSeverity;
  message: string;
  title: string;
}

export interface PreCommitResult {
  allowed: boolean;
  message: string;
  fixSuggestions: string[];
}

export interface ContractTestCase {
  name: string;
  description: string;
  contractId: string;
  testData: unknown[];
  expectedValid: boolean;
  expectedErrors?: string[];
}

export interface TestSuiteResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
  results: TestCaseResult[];
}

export interface TestCaseResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  validationResult?: ValidationResult;
}

// ============================================================================
// MIGRATION PARSER
// ============================================================================

export class MigrationParser {
  /**
   * Parse SQL migration file
   */
  parseMigration(content: string): SchemaChange[] {
    const changes: SchemaChange[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim().toUpperCase();

      // ADD COLUMN
      const addColumnMatch = line.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+(?:COLUMN\s+)?(\w+)/i);
      if (addColumnMatch) {
        changes.push({
          type: 'add_column',
          table: addColumnMatch[1],
          column: addColumnMatch[2],
          details: { sql: line },
          breaking: false, // Adding is never breaking
        });
        continue;
      }

      // DROP COLUMN
      const dropColumnMatch = line.match(/ALTER\s+TABLE\s+(\w+)\s+DROP\s+(?:COLUMN\s+)?(\w+)/i);
      if (dropColumnMatch) {
        changes.push({
          type: 'drop_column',
          table: dropColumnMatch[1],
          column: dropColumnMatch[2],
          details: { sql: line },
          breaking: true, // Dropping is always breaking
        });
        continue;
      }

      // MODIFY/ALTER COLUMN
      const modifyMatch = line.match(/ALTER\s+TABLE\s+(\w+)\s+(?:ALTER|MODIFY)\s+(?:COLUMN\s+)?(\w+)/i);
      if (modifyMatch) {
        // Check if it's just adding a default (non-breaking)
        const isDefaultOnly = /SET\s+DEFAULT/i.test(line);
        changes.push({
          type: 'modify_column',
          table: modifyMatch[1],
          column: modifyMatch[2],
          details: { sql: line },
          breaking: !isDefaultOnly,
        });
        continue;
      }

      // ADD CONSTRAINT
      const addConstraintMatch = line.match(/ALTER\s+TABLE\s+(\w+)\s+ADD\s+CONSTRAINT/i);
      if (addConstraintMatch) {
        const isNotNull = /NOT\s+NULL/i.test(line);
        changes.push({
          type: 'add_constraint',
          table: addConstraintMatch[1],
          details: { sql: line },
          breaking: isNotNull, // Adding NOT NULL is breaking
        });
        continue;
      }

      // CREATE TABLE
      const createTableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i);
      if (createTableMatch) {
        changes.push({
          type: 'add_table',
          table: createTableMatch[1],
          details: { sql: line },
          breaking: false,
        });
        continue;
      }

      // DROP TABLE
      const dropTableMatch = line.match(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(\w+)/i);
      if (dropTableMatch) {
        changes.push({
          type: 'drop_table',
          table: dropTableMatch[1],
          details: { sql: line },
          breaking: true,
        });
      }
    }

    return changes;
  }

  /**
   * Extract version from migration filename
   */
  extractVersion(filename: string): string {
    // Formats: 001_migration.sql, 20240101120000_migration.sql, V1__migration.sql
    const patterns = [
      /^(\d+)_/,
      /^V(\d+)__/i,
      /^(\d{14})_/,
    ];

    for (const pattern of patterns) {
      const match = filename.match(pattern);
      if (match) return match[1];
    }

    return filename;
  }

  /**
   * Determine migration direction
   */
  getMigrationType(filename: string): 'up' | 'down' {
    if (filename.includes('.down.') || filename.includes('_down.')) {
      return 'down';
    }
    return 'up';
  }

  /**
   * Parse multiple migration files
   */
  parseMigrations(files: { filename: string; content: string }[]): MigrationFile[] {
    return files.map((file) => ({
      filename: file.filename,
      content: file.content,
      type: this.getMigrationType(file.filename),
      version: this.extractVersion(file.filename),
    }));
  }
}

// ============================================================================
// CI VALIDATOR
// ============================================================================

export class CIContractValidator {
  private config: CIConfig;
  private parser: MigrationParser;

  constructor(config: Partial<CIConfig> = {}) {
    this.config = {
      provider: config.provider || 'github',
      failOnBreakingChanges: config.failOnBreakingChanges ?? true,
      failOnWarnings: config.failOnWarnings ?? false,
      notifyOnDeprecations: config.notifyOnDeprecations ?? true,
      slackWebhook: config.slackWebhook,
      githubToken: config.githubToken,
      prComment: config.prComment ?? true,
      checkName: config.checkName || 'Contract Validation',
    };
    this.parser = new MigrationParser();
  }

  /**
   * Validate migrations against contracts
   */
  validateMigrations(
    migrations: { filename: string; content: string }[],
    contractId: string
  ): MigrationValidationResult {
    const parsed = this.parser.parseMigrations(migrations);
    const allChanges: SchemaChange[] = [];
    const breakingChanges: BreakingChange[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    for (const migration of parsed) {
      if (migration.type === 'down') continue; // Skip rollback scripts

      const changes = this.parser.parseMigration(migration.content);
      allChanges.push(...changes);

      for (const change of changes) {
        if (change.breaking) {
          breakingChanges.push({
            type: this.schemaChangeToBreakingType(change.type),
            field: change.column,
            description: `${change.type} on ${change.table}${change.column ? '.' + change.column : ''}`,
            migration: String(change.details.sql),
          });

          errors.push(
            `Breaking change in ${migration.filename}: ${change.type} on ${change.table}`
          );

          // Add suggestions
          if (change.type === 'drop_column') {
            suggestions.push(
              `Consider deprecating ${change.column} first before dropping`
            );
          }
        }
      }

      // Check for missing rollback
      const hasRollback = migrations.some(
        (m) => m.filename.includes('.down.') && m.filename.includes(migration.version)
      );
      if (!hasRollback) {
        warnings.push(`Missing rollback script for ${migration.filename}`);
      }
    }

    // Validate against contract if exists
    const contract = getDefaultRegistry().getContract(contractId);
    if (contract) {
      const compatibility = checkCompatibility(contractId, contract);
      breakingChanges.push(...compatibility.breakingChanges);
    }

    return {
      valid: errors.length === 0,
      migrations: parsed,
      schemaChanges: allChanges,
      breakingChanges,
      warnings,
      errors,
      suggestions,
    };
  }

  private schemaChangeToBreakingType(
    changeType: SchemaChange['type']
  ): BreakingChange['type'] {
    switch (changeType) {
      case 'drop_column':
        return 'field_removed';
      case 'modify_column':
        return 'field_type_changed';
      case 'add_constraint':
        return 'constraint_added';
      default:
        return 'field_removed';
    }
  }

  /**
   * Run full CI check
   */
  runCICheck(
    contracts: DataContract[],
    migrations: { filename: string; content: string }[] = []
  ): CICheckResult {
    const annotations: CIAnnotation[] = [];
    let totalChecks = 0;
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Validate each contract
    for (const contract of contracts) {
      totalChecks++;

      // Check for breaking changes
      const existing = getDefaultRegistry().getContract(contract.id);
      if (existing) {
        const compatibility = checkCompatibility(contract.id, contract);

        if (compatibility.breakingChanges.length > 0) {
          if (this.config.failOnBreakingChanges) {
            failed++;
            for (const change of compatibility.breakingChanges) {
              annotations.push({
                file: `contracts/${contract.id}.json`,
                severity: 'error',
                message: change.description,
                title: `Breaking Change: ${change.type}`,
              });
            }
          } else {
            warnings++;
          }
        } else {
          passed++;
        }
      } else {
        passed++; // New contract is always valid
      }

      // Check SLAs
      for (const sla of contract.slas) {
        totalChecks++;
        if (sla.target <= 0) {
          failed++;
          annotations.push({
            file: `contracts/${contract.id}.json`,
            severity: 'error',
            message: `Invalid SLA target for ${sla.metric}: ${sla.target}`,
            title: 'Invalid SLA',
          });
        } else {
          passed++;
        }
      }
    }

    // Validate migrations
    for (const contract of contracts) {
      const migrationResult = this.validateMigrations(migrations, contract.id);
      totalChecks++;

      if (!migrationResult.valid) {
        failed++;
        for (const error of migrationResult.errors) {
          annotations.push({
            file: 'migrations/',
            severity: 'error',
            message: error,
            title: 'Migration Error',
          });
        }
      } else {
        passed++;
      }

      for (const warning of migrationResult.warnings) {
        warnings++;
        annotations.push({
          file: 'migrations/',
          severity: 'warning',
          message: warning,
          title: 'Migration Warning',
        });
      }
    }

    const allPassed = failed === 0 && (warnings === 0 || !this.config.failOnWarnings);

    return {
      passed: allPassed,
      summary: allPassed
        ? `✅ All ${totalChecks} contract checks passed`
        : `❌ ${failed} check(s) failed, ${warnings} warning(s)`,
      details: this.generateDetails(annotations),
      annotations,
      stats: { totalChecks, passed, failed, warnings },
    };
  }

  private generateDetails(annotations: CIAnnotation[]): string {
    const lines: string[] = ['## Contract Validation Results', ''];

    const errors = annotations.filter((a) => a.severity === 'error');
    const warns = annotations.filter((a) => a.severity === 'warning');

    if (errors.length > 0) {
      lines.push('### Errors', '');
      for (const error of errors) {
        lines.push(`- **${error.title}** (${error.file})`);
        lines.push(`  ${error.message}`);
      }
      lines.push('');
    }

    if (warns.length > 0) {
      lines.push('### Warnings', '');
      for (const warn of warns) {
        lines.push(`- **${warn.title}** (${warn.file})`);
        lines.push(`  ${warn.message}`);
      }
      lines.push('');
    }

    if (errors.length === 0 && warns.length === 0) {
      lines.push('All checks passed successfully! ✅');
    }

    return lines.join('\n');
  }

  /**
   * Generate GitHub Actions workflow
   */
  generateGitHubActionsWorkflow(): string {
    return `name: Contract Validation

on:
  pull_request:
    paths:
      - 'contracts/**'
      - 'migrations/**'
      - 'src/lib/data/**'

jobs:
  validate-contracts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Validate contracts
        id: validate
        run: |
          npm run contracts:validate 2>&1 | tee validation-output.txt
          echo "result=$(cat validation-output.txt | base64 -w 0)" >> $GITHUB_OUTPUT

      - name: Check for breaking changes
        run: npm run contracts:check-breaking

      - name: Post PR comment
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const output = Buffer.from(process.env.VALIDATION_OUTPUT, 'base64').toString();
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '## Contract Validation Report\\n\\n\`\`\`\\n' + output + '\\n\`\`\`'
            });
        env:
          VALIDATION_OUTPUT: \${{ steps.validate.outputs.result }}

      - name: Fail on breaking changes
        if: failure()
        run: |
          echo "Breaking changes detected! Please review the contract changes."
          exit 1
`;
  }

  /**
   * Generate pre-commit hook script
   */
  generatePreCommitHook(): string {
    return `#!/bin/bash
# Contract validation pre-commit hook

set -e

echo "🔍 Validating data contracts..."

# Check for contract file changes
CONTRACT_FILES=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^contracts/|^src/lib/data/' || true)

if [ -z "$CONTRACT_FILES" ]; then
  echo "✅ No contract changes detected"
  exit 0
fi

echo "📋 Changed files:"
echo "$CONTRACT_FILES"

# Run contract validation
npm run contracts:validate --silent

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Contract validation failed!"
  echo ""
  echo "Please fix the issues above before committing."
  echo "If you need to make breaking changes, use:"
  echo "  git commit --no-verify -m 'BREAKING: your message'"
  exit 1
fi

# Check for breaking changes
npm run contracts:check-breaking --silent

if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Breaking changes detected!"
  echo ""
  echo "Breaking changes require explicit acknowledgment."
  echo "Use: git commit --no-verify -m 'BREAKING: your message'"
  exit 1
fi

echo "✅ Contract validation passed"
exit 0
`;
  }
}

// ============================================================================
// CONTRACT TEST RUNNER
// ============================================================================

export class ContractTestRunner {
  private validator = getDefaultValidator();

  /**
   * Run test suite
   */
  async runTestSuite(testCases: ContractTestCase[]): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestCaseResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTestCase(testCase);
      results.push(result);
    }

    const passedTests = results.filter((r) => r.passed).length;

    return {
      passed: passedTests === results.length,
      totalTests: results.length,
      passedTests,
      failedTests: results.length - passedTests,
      duration: Date.now() - startTime,
      results,
    };
  }

  /**
   * Run single test case
   */
  async runTestCase(testCase: ContractTestCase): Promise<TestCaseResult> {
    const startTime = Date.now();

    try {
      const validationResult = this.validator.validate(
        testCase.contractId,
        testCase.testData
      );

      const passed = validationResult.valid === testCase.expectedValid;

      // Check expected errors if specified
      if (testCase.expectedErrors && !passed) {
        const actualErrorMessages = validationResult.errors.map((e) => e.message);
        const allErrorsFound = testCase.expectedErrors.every((expected) =>
          actualErrorMessages.some((actual) => actual.includes(expected))
        );
        if (!allErrorsFound) {
          return {
            name: testCase.name,
            passed: false,
            duration: Date.now() - startTime,
            error: `Expected errors not found. Expected: ${testCase.expectedErrors.join(', ')}. Actual: ${actualErrorMessages.join(', ')}`,
            validationResult,
          };
        }
      }

      return {
        name: testCase.name,
        passed,
        duration: Date.now() - startTime,
        validationResult,
        error: passed
          ? undefined
          : `Expected valid=${testCase.expectedValid}, got valid=${validationResult.valid}`,
      };
    } catch (error) {
      return {
        name: testCase.name,
        passed: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate test report
   */
  generateReport(result: TestSuiteResult): string {
    const lines: string[] = [
      '# Contract Test Report',
      '',
      `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}`,
      `**Tests:** ${result.passedTests}/${result.totalTests} passed`,
      `**Duration:** ${result.duration}ms`,
      '',
      '## Test Results',
      '',
    ];

    for (const testResult of result.results) {
      const icon = testResult.passed ? '✅' : '❌';
      lines.push(`### ${icon} ${testResult.name}`);
      lines.push(`- Duration: ${testResult.duration}ms`);

      if (testResult.error) {
        lines.push(`- Error: ${testResult.error}`);
      }

      if (testResult.validationResult && !testResult.passed) {
        lines.push(`- Validation errors: ${testResult.validationResult.errors.length}`);
        for (const error of testResult.validationResult.errors.slice(0, 5)) {
          lines.push(`  - ${error.field}: ${error.message}`);
        }
      }

      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// SAMPLE TEST CASES
// ============================================================================

export const SAMPLE_TEST_CASES: ContractTestCase[] = [
  {
    name: 'Valid token price data',
    description: 'Should validate correct token price data',
    contractId: 'token_prices',
    testData: [
      {
        coingecko_id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        current_price: 45000,
        market_cap: 850000000000,
        market_cap_rank: 1,
        last_updated: new Date().toISOString(),
      },
    ],
    expectedValid: true,
  },
  {
    name: 'Invalid token price - negative price',
    description: 'Should reject negative prices',
    contractId: 'token_prices',
    testData: [
      {
        coingecko_id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        current_price: -100,
        last_updated: new Date().toISOString(),
      },
    ],
    expectedValid: false,
  },
  {
    name: 'Missing required fields',
    description: 'Should reject data missing required fields',
    contractId: 'token_prices',
    testData: [
      {
        symbol: 'BTC',
        current_price: 45000,
      },
    ],
    expectedValid: false,
  },
  {
    name: 'Valid protocol TVL data',
    description: 'Should validate correct TVL data',
    contractId: 'protocol_tvl',
    testData: [
      {
        protocol_id: 'aave-v3',
        protocol_name: 'Aave V3',
        chain: 'ethereum',
        tvl: 10000000000,
        category: 'lending',
        collected_at: new Date().toISOString(),
      },
    ],
    expectedValid: true,
  },
  {
    name: 'Invalid chain enum',
    description: 'Should reject invalid chain values',
    contractId: 'protocol_tvl',
    testData: [
      {
        protocol_id: 'aave-v3',
        protocol_name: 'Aave V3',
        chain: 'invalid_chain',
        tvl: 10000000000,
        category: 'lending',
        collected_at: new Date().toISOString(),
      },
    ],
    expectedValid: false,
  },
];

// ============================================================================
// SINGLETON & CONVENIENCE
// ============================================================================

let defaultCIValidator: CIContractValidator | null = null;
let defaultTestRunner: ContractTestRunner | null = null;

export function getDefaultCIValidator(): CIContractValidator {
  if (!defaultCIValidator) {
    defaultCIValidator = new CIContractValidator();
  }
  return defaultCIValidator;
}

export function getDefaultTestRunner(): ContractTestRunner {
  if (!defaultTestRunner) {
    defaultTestRunner = new ContractTestRunner();
  }
  return defaultTestRunner;
}

export function resetCIValidation(): void {
  defaultCIValidator = null;
  defaultTestRunner = null;
}

/**
 * Quick CI check
 */
export function runQuickCICheck(contracts: DataContract[]): CICheckResult {
  return getDefaultCIValidator().runCICheck(contracts);
}

/**
 * Run contract tests
 */
export async function runContractTests(
  testCases: ContractTestCase[] = SAMPLE_TEST_CASES
): Promise<TestSuiteResult> {
  return getDefaultTestRunner().runTestSuite(testCases);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Classes
  MigrationParser,
  CIContractValidator,
  ContractTestRunner,

  // Singletons
  getDefaultCIValidator,
  getDefaultTestRunner,
  resetCIValidation,

  // Convenience
  runQuickCICheck,
  runContractTests,

  // Sample data
  SAMPLE_TEST_CASES,
};
