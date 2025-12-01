#!/usr/bin/env node

/**
 * Generate TypeScript Types from SQL Schema
 *
 * This script parses SQL schema files and generates TypeScript types.
 * Used as a fallback when Supabase CLI is not available.
 *
 * Phase 1, Week 1, Day 5
 */

const fs = require('fs');
const path = require('path');

// SQL to TypeScript type mapping
const sqlToTsType = {
  'uuid': 'string',
  'text': 'string',
  'varchar': 'string',
  'character varying': 'string',
  'char': 'string',
  'integer': 'number',
  'int': 'number',
  'bigint': 'number',
  'smallint': 'number',
  'serial': 'number',
  'bigserial': 'number',
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',
  'float': 'number',
  'boolean': 'boolean',
  'bool': 'boolean',
  'date': 'string',
  'timestamp': 'string',
  'timestamptz': 'string',
  'timestamp with time zone': 'string',
  'timestamp without time zone': 'string',
  'time': 'string',
  'timetz': 'string',
  'json': 'Json',
  'jsonb': 'Json',
  'text[]': 'string[]',
  'integer[]': 'number[]',
  'uuid[]': 'string[]',
};

/**
 * Parse a single column definition from SQL
 */
function parseColumn(line) {
  // Remove leading/trailing whitespace
  line = line.trim();

  // Skip constraint lines
  if (line.match(/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT|CREATE|DROP|ALTER|--)/i)) {
    return null;
  }

  // Parse column definition: column_name TYPE [constraints]
  const match = line.match(/^(\w+)\s+(\w+(?:\s+\w+)?(?:\([^)]+\))?(?:\[\])?)/i);
  if (!match) return null;

  const [, name, rawType] = match;

  // Skip reserved words that might be captured
  if (['IF', 'NOT', 'EXISTS', 'REFERENCES', 'ON', 'DEFAULT', 'CHECK'].includes(name.toUpperCase())) {
    return null;
  }

  // Clean up type
  let sqlType = rawType.toLowerCase().replace(/\([^)]+\)/, '');

  // Handle arrays
  const isArray = line.includes('[]') || line.includes('ARRAY');

  // Get TypeScript type
  let tsType = sqlToTsType[sqlType] || 'unknown';

  // Check if nullable (default is nullable unless NOT NULL is specified)
  const isNullable = !line.toUpperCase().includes('NOT NULL');

  // Check for default values
  const hasDefault = line.toUpperCase().includes('DEFAULT');

  if (isArray && !tsType.endsWith('[]')) {
    tsType += '[]';
  }

  return {
    name,
    type: tsType,
    nullable: isNullable,
    hasDefault,
  };
}

/**
 * Parse CREATE TABLE statement
 */
function parseCreateTable(sql) {
  const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*\(/is);
  if (!tableMatch) return null;

  const tableName = tableMatch[1];

  // Extract column definitions
  const columnsStart = sql.indexOf('(') + 1;
  let depth = 1;
  let columnsEnd = columnsStart;

  for (let i = columnsStart; i < sql.length; i++) {
    if (sql[i] === '(') depth++;
    if (sql[i] === ')') depth--;
    if (depth === 0) {
      columnsEnd = i;
      break;
    }
  }

  const columnsSection = sql.slice(columnsStart, columnsEnd);
  const lines = columnsSection.split(',');

  const columns = [];
  for (const line of lines) {
    const column = parseColumn(line);
    if (column) {
      columns.push(column);
    }
  }

  return { name: tableName, columns };
}

/**
 * Parse all SQL files and extract table definitions
 */
function parseSchemaFiles() {
  const schemaDir = path.join(__dirname, '..', 'supabase');
  const migrationsDir = path.join(schemaDir, 'migrations');

  const tables = new Map();

  // Parse main schema.sql first
  const schemaPath = path.join(schemaDir, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const sql = fs.readFileSync(schemaPath, 'utf-8');
    const tableBlocks = sql.split(/(?=CREATE\s+TABLE)/gi);

    for (const block of tableBlocks) {
      const table = parseCreateTable(block);
      if (table) {
        tables.set(table.name, table);
      }
    }
  }

  // Parse migration files
  if (fs.existsSync(migrationsDir)) {
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const tableBlocks = sql.split(/(?=CREATE\s+TABLE)/gi);

      for (const block of tableBlocks) {
        const table = parseCreateTable(block);
        if (table) {
          tables.set(table.name, table);
        }
      }
    }
  }

  return Array.from(tables.values());
}

/**
 * Convert table name to PascalCase
 */
function toPascalCase(str) {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

/**
 * Generate TypeScript types from parsed tables
 */
function generateTypes(tables) {
  const lines = [
    '/**',
    ' * Supabase Database Types',
    ' *',
    ' * Auto-generated from SQL schema files',
    ` * Generated: ${new Date().toISOString()}`,
    ' *',
    ' * DO NOT EDIT MANUALLY - Run: npm run generate:types',
    ' */',
    '',
    'export type Json =',
    '  | string',
    '  | number',
    '  | boolean',
    '  | null',
    '  | { [key: string]: Json | undefined }',
    '  | Json[];',
    '',
    'export type Database = {',
    '  public: {',
    '    Tables: {',
  ];

  for (const table of tables) {
    const pascalName = toPascalCase(table.name);

    lines.push(`      ${table.name}: {`);

    // Row type
    lines.push('        Row: {');
    for (const col of table.columns) {
      const optional = col.nullable ? ' | null' : '';
      lines.push(`          ${col.name}: ${col.type}${optional};`);
    }
    lines.push('        };');

    // Insert type
    lines.push('        Insert: {');
    for (const col of table.columns) {
      const optional = (col.hasDefault || col.nullable) ? '?' : '';
      const nullUnion = col.nullable ? ' | null' : '';
      lines.push(`          ${col.name}${optional}: ${col.type}${nullUnion};`);
    }
    lines.push('        };');

    // Update type
    lines.push('        Update: {');
    for (const col of table.columns) {
      const nullUnion = col.nullable ? ' | null' : '';
      lines.push(`          ${col.name}?: ${col.type}${nullUnion};`);
    }
    lines.push('        };');

    lines.push('        Relationships: [];');
    lines.push('      };');
  }

  lines.push('    };');
  lines.push('    Views: {};');
  lines.push('    Functions: {};');
  lines.push('    Enums: {};');
  lines.push('    CompositeTypes: {};');
  lines.push('  };');
  lines.push('};');
  lines.push('');

  // Add helper types
  lines.push('// Helper types for easier usage');
  lines.push('export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];');
  lines.push('export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];');
  lines.push('');

  return lines.join('\n');
}

/**
 * Main execution
 */
function main() {
  console.log('Parsing SQL schema files...');

  const tables = parseSchemaFiles();
  console.log(`Found ${tables.length} tables`);

  for (const table of tables) {
    console.log(`  - ${table.name} (${table.columns.length} columns)`);
  }

  console.log('');
  console.log('Generating TypeScript types...');

  const typesContent = generateTypes(tables);

  const outputPath = path.join(__dirname, '..', 'src', 'types', 'database.types.ts');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, typesContent);

  console.log(`Types written to: ${outputPath}`);
}

main();
