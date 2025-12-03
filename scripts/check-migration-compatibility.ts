#!/usr/bin/env npx ts-node

/**
 * Migration Backward Compatibility Checker
 *
 * Phase 4, Week 8 Extended - Semantic Audit Checklist
 *
 * This script checks SQL migrations for backward compatibility issues
 * that could break existing functionality.
 *
 * Checks performed:
 * 1. DROP TABLE/COLUMN without IF EXISTS
 * 2. Non-nullable columns added without DEFAULT
 * 3. Column type changes that may lose data
 * 4. Index/constraint drops without recreation
 * 5. Enum value removals
 * 6. RLS policy removals
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface CompatibilityIssue {
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  line: number;
  suggestion?: string;
}

interface CheckResult {
  file: string;
  issues: CompatibilityIssue[];
  hasErrors: boolean;
}

// ============================================================================
// COMPATIBILITY RULES
// ============================================================================

const rules: Array<{
  name: string;
  pattern: RegExp;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
  exclude?: RegExp;
}> = [
  // Critical: Data loss risks
  {
    name: 'DROP_TABLE_NO_IF_EXISTS',
    pattern: /\bDROP\s+TABLE\s+(?!IF\s+EXISTS)/gi,
    severity: 'error',
    message: 'DROP TABLE without IF EXISTS can fail if table doesn\'t exist',
    suggestion: 'Use "DROP TABLE IF EXISTS table_name"',
  },
  {
    name: 'DROP_COLUMN_NO_IF_EXISTS',
    pattern: /\bALTER\s+TABLE\s+\w+\s+DROP\s+COLUMN\s+(?!IF\s+EXISTS)/gi,
    severity: 'error',
    message: 'DROP COLUMN without IF EXISTS can fail and may lose data',
    suggestion: 'Use "DROP COLUMN IF EXISTS column_name" and ensure data backup',
  },
  {
    name: 'TRUNCATE_TABLE',
    pattern: /\bTRUNCATE\s+TABLE/gi,
    severity: 'error',
    message: 'TRUNCATE TABLE will delete all data - ensure this is intentional',
    suggestion: 'Use DELETE with WHERE clause for selective deletion',
  },

  // High: Breaking changes
  {
    name: 'NOT_NULL_WITHOUT_DEFAULT',
    pattern: /\bADD\s+COLUMN\s+\w+\s+\w+(?:\([^)]*\))?\s+NOT\s+NULL(?!\s+DEFAULT)/gi,
    severity: 'error',
    message: 'Adding NOT NULL column without DEFAULT will fail on existing rows',
    suggestion: 'Add DEFAULT value or make column nullable initially',
  },
  {
    name: 'ALTER_COLUMN_TYPE',
    pattern: /\bALTER\s+COLUMN\s+\w+\s+(?:SET\s+DATA\s+)?TYPE/gi,
    severity: 'warning',
    message: 'Column type change may cause data loss or conversion errors',
    suggestion: 'Test with production-like data before deployment',
  },
  {
    name: 'DROP_CONSTRAINT',
    pattern: /\bDROP\s+CONSTRAINT\s+(?!IF\s+EXISTS)/gi,
    severity: 'warning',
    message: 'Dropping constraint without IF EXISTS may fail',
    suggestion: 'Use "DROP CONSTRAINT IF EXISTS constraint_name"',
  },
  {
    name: 'DROP_INDEX',
    pattern: /\bDROP\s+INDEX\s+(?!IF\s+EXISTS|CONCURRENTLY)/gi,
    severity: 'warning',
    message: 'Dropping index may impact query performance',
    suggestion: 'Use "DROP INDEX IF EXISTS" and verify no dependent queries',
  },

  // Medium: Enum changes
  {
    name: 'DROP_ENUM_VALUE',
    pattern: /--\s*(?:remove|drop|delete)\s+enum\s+value/gi,
    severity: 'error',
    message: 'Removing enum values is not directly supported and requires migration',
    suggestion: 'Create new enum type, migrate data, then swap',
  },
  {
    name: 'ALTER_TYPE_DROP',
    pattern: /\bALTER\s+TYPE\s+\w+\s+DROP\s+VALUE/gi,
    severity: 'error',
    message: 'PostgreSQL does not support DROP VALUE on enum types',
    suggestion: 'Create new enum, update column, drop old enum',
  },

  // Medium: Security changes
  {
    name: 'DROP_POLICY',
    pattern: /\bDROP\s+POLICY\s+(?!IF\s+EXISTS)/gi,
    severity: 'warning',
    message: 'Dropping RLS policy may expose data',
    suggestion: 'Ensure replacement policy is created or disable RLS deliberately',
  },
  {
    name: 'DISABLE_RLS',
    pattern: /\bALTER\s+TABLE\s+\w+\s+DISABLE\s+ROW\s+LEVEL\s+SECURITY/gi,
    severity: 'warning',
    message: 'Disabling RLS removes all access controls on this table',
    suggestion: 'Verify this is intentional and document the reason',
  },
  {
    name: 'GRANT_ALL',
    pattern: /\bGRANT\s+ALL\s+(?:PRIVILEGES\s+)?ON/gi,
    severity: 'info',
    message: 'GRANT ALL gives full access - consider least privilege',
    suggestion: 'Grant only necessary privileges (SELECT, INSERT, UPDATE, DELETE)',
  },

  // Medium: Function changes
  {
    name: 'DROP_FUNCTION',
    pattern: /\bDROP\s+FUNCTION\s+(?!IF\s+EXISTS)/gi,
    severity: 'warning',
    message: 'Dropping function may break dependent views or triggers',
    suggestion: 'Use "DROP FUNCTION IF EXISTS" and check dependencies',
  },
  {
    name: 'CREATE_OR_REPLACE_FUNCTION_SIGNATURE',
    pattern: /\bCREATE\s+OR\s+REPLACE\s+FUNCTION\s+\w+\s*\([^)]*\)/gi,
    severity: 'info',
    message: 'Changing function signature requires DROP and CREATE',
    suggestion: 'If parameters changed, use DROP FUNCTION IF EXISTS first',
  },

  // Low: Best practices
  {
    name: 'RENAME_TABLE',
    pattern: /\bALTER\s+TABLE\s+\w+\s+RENAME\s+TO/gi,
    severity: 'warning',
    message: 'Table rename may break application code and foreign keys',
    suggestion: 'Update all references in application code',
  },
  {
    name: 'RENAME_COLUMN',
    pattern: /\bALTER\s+TABLE\s+\w+\s+RENAME\s+COLUMN/gi,
    severity: 'warning',
    message: 'Column rename may break application code',
    suggestion: 'Update all references in application code',
  },
  {
    name: 'CASCADE_DELETE',
    pattern: /\bON\s+DELETE\s+CASCADE/gi,
    severity: 'info',
    message: 'CASCADE DELETE will remove child records automatically',
    suggestion: 'Ensure this cascading behavior is intentional',
  },
  {
    name: 'NO_TRANSACTION',
    pattern: /^(?!.*\bBEGIN\b)(?!.*\bTRANSACTION\b)/is,
    severity: 'info',
    message: 'Migration should be wrapped in a transaction for atomicity',
    suggestion: 'Add BEGIN; at start and COMMIT; at end',
    exclude: /\bDO\s+\$\$/i, // PL/pgSQL blocks are implicit transactions
  },
];

// ============================================================================
// CHECKER FUNCTIONS
// ============================================================================

function checkMigration(filePath: string, content: string): CheckResult {
  const issues: CompatibilityIssue[] = [];
  const lines = content.split('\n');

  rules.forEach((rule) => {
    // Check exclusion pattern
    if (rule.exclude && rule.exclude.test(content)) {
      return;
    }

    // Find all matches
    let match;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);

    while ((match = regex.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = (beforeMatch.match(/\n/g) || []).length + 1;

      // Skip if in comment
      const line = lines[lineNumber - 1] || '';
      if (line.trim().startsWith('--')) {
        continue;
      }

      // Check if inside a multi-line comment
      const beforeContent = content.substring(0, match.index);
      const openComments = (beforeContent.match(/\/\*/g) || []).length;
      const closeComments = (beforeContent.match(/\*\//g) || []).length;
      if (openComments > closeComments) {
        continue;
      }

      issues.push({
        severity: rule.severity,
        rule: rule.name,
        message: rule.message,
        line: lineNumber,
        suggestion: rule.suggestion,
      });
    }
  });

  // Additional custom checks
  issues.push(...checkCustomRules(content, lines));

  return {
    file: path.basename(filePath),
    issues: issues.sort((a, b) => a.line - b.line),
    hasErrors: issues.some((i) => i.severity === 'error'),
  };
}

function checkCustomRules(content: string, lines: string[]): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // Check for missing rollback documentation
  if (!content.includes('-- ROLLBACK:') && !content.includes('-- Rollback:')) {
    issues.push({
      severity: 'info',
      rule: 'MISSING_ROLLBACK_DOC',
      message: 'Migration lacks rollback documentation',
      line: 1,
      suggestion: 'Add "-- ROLLBACK: <rollback SQL>" comments',
    });
  }

  // Check for missing description header
  if (!content.match(/^--\s*={10,}/m)) {
    issues.push({
      severity: 'info',
      rule: 'MISSING_HEADER',
      message: 'Migration lacks descriptive header',
      line: 1,
      suggestion: 'Add a header block describing the migration purpose',
    });
  }

  // Check for potential lock issues
  if (content.match(/\bALTER\s+TABLE\s+\w+\s+ADD\s+COLUMN/gi)) {
    const hasLockTimeout = content.includes('lock_timeout') || content.includes('statement_timeout');
    if (!hasLockTimeout) {
      issues.push({
        severity: 'info',
        rule: 'NO_LOCK_TIMEOUT',
        message: 'ALTER TABLE can acquire locks - consider setting lock_timeout',
        line: 1,
        suggestion: 'Add "SET lock_timeout = \'5s\';" to prevent long locks',
      });
    }
  }

  // Check for concurrent index creation
  const indexCreations = content.match(/\bCREATE\s+(?!UNIQUE\s+)?INDEX\s+(?!CONCURRENTLY)/gi);
  if (indexCreations && indexCreations.length > 0) {
    issues.push({
      severity: 'info',
      rule: 'NON_CONCURRENT_INDEX',
      message: 'Index creation without CONCURRENTLY will lock the table',
      line: 1,
      suggestion: 'Use "CREATE INDEX CONCURRENTLY" for large tables',
    });
  }

  return issues;
}

// ============================================================================
// MAIN
// ============================================================================

function main(): void {
  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

  // Get migration files
  let files: string[];
  try {
    files = fs.readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
  } catch (error) {
    console.error('Error reading migrations directory:', error);
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('No migration files found.');
    process.exit(0);
  }

  // Check only new migrations (if in CI, check only changed files)
  const checkFiles = process.argv.slice(2);
  const filesToCheck = checkFiles.length > 0
    ? files.filter((f) => checkFiles.some((cf) => f.includes(cf)))
    : files;

  console.log(`\n🔍 Checking ${filesToCheck.length} migration(s) for compatibility issues...\n`);

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalInfo = 0;

  const results: CheckResult[] = [];

  filesToCheck.forEach((file) => {
    const filePath = path.join(migrationsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = checkMigration(filePath, content);

    results.push(result);

    if (result.issues.length > 0) {
      console.log(`📄 ${file}`);

      result.issues.forEach((issue) => {
        const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} Line ${issue.line}: [${issue.rule}] ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      💡 ${issue.suggestion}`);
        }
      });

      console.log('');

      totalErrors += result.issues.filter((i) => i.severity === 'error').length;
      totalWarnings += result.issues.filter((i) => i.severity === 'warning').length;
      totalInfo += result.issues.filter((i) => i.severity === 'info').length;
    }
  });

  // Summary
  console.log('─'.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Files checked: ${filesToCheck.length}`);
  console.log(`   Errors:        ${totalErrors}`);
  console.log(`   Warnings:      ${totalWarnings}`);
  console.log(`   Info:          ${totalInfo}`);
  console.log('');

  if (totalErrors > 0) {
    console.log('❌ Migration compatibility check FAILED');
    console.log('   Fix the errors above before proceeding.\n');
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log('⚠️  Migration compatibility check PASSED with warnings');
    console.log('   Review the warnings above.\n');
    process.exit(0);
  } else {
    console.log('✅ Migration compatibility check PASSED\n');
    process.exit(0);
  }
}

main();
