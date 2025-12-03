/**
 * Schema Change Detection Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Schema snapshot management
 * - Change detection (additions, removals, modifications)
 * - Breaking change identification
 * - Schema version history
 * - Automated alerts on changes
 * - Migration suggestions
 */

// ============================================================================
// TYPES
// ============================================================================

export type ColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'decimal'
  | 'float'
  | 'boolean'
  | 'timestamp'
  | 'timestamptz'
  | 'date'
  | 'time'
  | 'json'
  | 'jsonb'
  | 'uuid'
  | 'array'
  | 'unknown';

export type ChangeType =
  | 'column_added'
  | 'column_removed'
  | 'column_type_changed'
  | 'column_nullable_changed'
  | 'column_default_changed'
  | 'constraint_added'
  | 'constraint_removed'
  | 'index_added'
  | 'index_removed'
  | 'table_added'
  | 'table_removed';

export type ChangeImpact = 'none' | 'low' | 'medium' | 'high' | 'breaking';

export interface ColumnDefinition {
  name: string;
  type: ColumnType;
  nullable: boolean;
  defaultValue?: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
  comment?: string;
}

export interface ConstraintDefinition {
  name: string;
  type: 'primary_key' | 'foreign_key' | 'unique' | 'check' | 'not_null';
  columns: string[];
  definition?: string;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
  partial?: string; // WHERE clause for partial index
}

export interface TableSchema {
  name: string;
  columns: ColumnDefinition[];
  constraints: ConstraintDefinition[];
  indexes: IndexDefinition[];
  rowCount?: number;
  sizeBytes?: number;
  comment?: string;
}

export interface SchemaSnapshot {
  id: string;
  databaseName: string;
  schemaName: string;
  tables: TableSchema[];
  capturedAt: Date;
  capturedBy: string;
  version: number;
  metadata?: Record<string, unknown>;
}

export interface SchemaChange {
  id: string;
  type: ChangeType;
  tableName: string;
  columnName?: string;
  constraintName?: string;
  indexName?: string;
  oldValue?: unknown;
  newValue?: unknown;
  impact: ChangeImpact;
  isBreaking: boolean;
  description: string;
  migrationHint?: string;
}

export interface SchemaComparisonResult {
  fromVersion: number;
  toVersion: number;
  fromSnapshot: string;
  toSnapshot: string;
  comparedAt: Date;
  changes: SchemaChange[];
  summary: {
    totalChanges: number;
    breakingChanges: number;
    tablesAdded: number;
    tablesRemoved: number;
    columnsAdded: number;
    columnsRemoved: number;
    columnsModified: number;
  };
}

export interface SchemaAlert {
  id: string;
  snapshotId: string;
  changeId: string;
  change: SchemaChange;
  createdAt: Date;
  acknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

// ============================================================================
// SCHEMA COMPARATOR
// ============================================================================

export class SchemaComparator {
  /**
   * Compare two table schemas
   */
  compareTables(oldTable: TableSchema, newTable: TableSchema): SchemaChange[] {
    const changes: SchemaChange[] = [];

    // Compare columns
    const oldColumns = new Map(oldTable.columns.map((c) => [c.name, c]));
    const newColumns = new Map(newTable.columns.map((c) => [c.name, c]));

    // Check for added columns
    for (const [name, newCol] of newColumns) {
      if (!oldColumns.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'column_added',
          tableName: newTable.name,
          columnName: name,
          newValue: newCol,
          impact: newCol.nullable ? 'low' : 'medium',
          isBreaking: !newCol.nullable && !newCol.defaultValue,
          description: `Column '${name}' added to table '${newTable.name}'`,
          migrationHint: `ALTER TABLE ${newTable.name} ADD COLUMN ${name} ${newCol.type}${newCol.nullable ? '' : ' NOT NULL'}${newCol.defaultValue ? ` DEFAULT ${newCol.defaultValue}` : ''};`,
        });
      }
    }

    // Check for removed columns
    for (const [name, oldCol] of oldColumns) {
      if (!newColumns.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'column_removed',
          tableName: oldTable.name,
          columnName: name,
          oldValue: oldCol,
          impact: 'breaking',
          isBreaking: true,
          description: `Column '${name}' removed from table '${oldTable.name}'`,
          migrationHint: `-- BREAKING: Column removed\n-- Ensure no dependencies before: ALTER TABLE ${oldTable.name} DROP COLUMN ${name};`,
        });
      }
    }

    // Check for modified columns
    for (const [name, oldCol] of oldColumns) {
      const newCol = newColumns.get(name);
      if (!newCol) continue;

      // Type change
      if (oldCol.type !== newCol.type) {
        const isBreaking = !this.isCompatibleTypeChange(oldCol.type, newCol.type);
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'column_type_changed',
          tableName: oldTable.name,
          columnName: name,
          oldValue: oldCol.type,
          newValue: newCol.type,
          impact: isBreaking ? 'breaking' : 'medium',
          isBreaking,
          description: `Column '${name}' type changed from '${oldCol.type}' to '${newCol.type}'`,
          migrationHint: `ALTER TABLE ${oldTable.name} ALTER COLUMN ${name} TYPE ${newCol.type};`,
        });
      }

      // Nullable change
      if (oldCol.nullable !== newCol.nullable) {
        const isBreaking = oldCol.nullable && !newCol.nullable; // Making non-nullable is breaking
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'column_nullable_changed',
          tableName: oldTable.name,
          columnName: name,
          oldValue: oldCol.nullable,
          newValue: newCol.nullable,
          impact: isBreaking ? 'breaking' : 'low',
          isBreaking,
          description: `Column '${name}' nullable changed from ${oldCol.nullable} to ${newCol.nullable}`,
          migrationHint: newCol.nullable
            ? `ALTER TABLE ${oldTable.name} ALTER COLUMN ${name} DROP NOT NULL;`
            : `ALTER TABLE ${oldTable.name} ALTER COLUMN ${name} SET NOT NULL;`,
        });
      }

      // Default change
      if (oldCol.defaultValue !== newCol.defaultValue) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'column_default_changed',
          tableName: oldTable.name,
          columnName: name,
          oldValue: oldCol.defaultValue,
          newValue: newCol.defaultValue,
          impact: 'low',
          isBreaking: false,
          description: `Column '${name}' default changed from '${oldCol.defaultValue}' to '${newCol.defaultValue}'`,
          migrationHint: newCol.defaultValue
            ? `ALTER TABLE ${oldTable.name} ALTER COLUMN ${name} SET DEFAULT ${newCol.defaultValue};`
            : `ALTER TABLE ${oldTable.name} ALTER COLUMN ${name} DROP DEFAULT;`,
        });
      }
    }

    // Compare constraints
    const oldConstraints = new Map(oldTable.constraints.map((c) => [c.name, c]));
    const newConstraints = new Map(newTable.constraints.map((c) => [c.name, c]));

    for (const [name, newCon] of newConstraints) {
      if (!oldConstraints.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'constraint_added',
          tableName: newTable.name,
          constraintName: name,
          newValue: newCon,
          impact: newCon.type === 'not_null' ? 'high' : 'medium',
          isBreaking: newCon.type === 'not_null',
          description: `Constraint '${name}' (${newCon.type}) added to table '${newTable.name}'`,
        });
      }
    }

    for (const [name, oldCon] of oldConstraints) {
      if (!newConstraints.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'constraint_removed',
          tableName: oldTable.name,
          constraintName: name,
          oldValue: oldCon,
          impact: 'low',
          isBreaking: false,
          description: `Constraint '${name}' (${oldCon.type}) removed from table '${oldTable.name}'`,
        });
      }
    }

    // Compare indexes
    const oldIndexes = new Map(oldTable.indexes.map((i) => [i.name, i]));
    const newIndexes = new Map(newTable.indexes.map((i) => [i.name, i]));

    for (const [name, newIdx] of newIndexes) {
      if (!oldIndexes.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'index_added',
          tableName: newTable.name,
          indexName: name,
          newValue: newIdx,
          impact: 'none',
          isBreaking: false,
          description: `Index '${name}' added to table '${newTable.name}'`,
        });
      }
    }

    for (const [name, oldIdx] of oldIndexes) {
      if (!newIndexes.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'index_removed',
          tableName: oldTable.name,
          indexName: name,
          oldValue: oldIdx,
          impact: 'low',
          isBreaking: false,
          description: `Index '${name}' removed from table '${oldTable.name}'`,
        });
      }
    }

    return changes;
  }

  /**
   * Compare two snapshots
   */
  compareSnapshots(
    oldSnapshot: SchemaSnapshot,
    newSnapshot: SchemaSnapshot
  ): SchemaComparisonResult {
    const changes: SchemaChange[] = [];

    const oldTables = new Map(oldSnapshot.tables.map((t) => [t.name, t]));
    const newTables = new Map(newSnapshot.tables.map((t) => [t.name, t]));

    // Check for added tables
    for (const [name, newTable] of newTables) {
      if (!oldTables.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'table_added',
          tableName: name,
          newValue: newTable,
          impact: 'none',
          isBreaking: false,
          description: `Table '${name}' added`,
        });
      }
    }

    // Check for removed tables
    for (const [name, oldTable] of oldTables) {
      if (!newTables.has(name)) {
        changes.push({
          id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'table_removed',
          tableName: name,
          oldValue: oldTable,
          impact: 'breaking',
          isBreaking: true,
          description: `Table '${name}' removed`,
          migrationHint: `-- BREAKING: Table removed\n-- Ensure no dependencies before: DROP TABLE ${name};`,
        });
      }
    }

    // Compare existing tables
    for (const [name, oldTable] of oldTables) {
      const newTable = newTables.get(name);
      if (newTable) {
        const tableChanges = this.compareTables(oldTable, newTable);
        changes.push(...tableChanges);
      }
    }

    // Calculate summary
    const summary = {
      totalChanges: changes.length,
      breakingChanges: changes.filter((c) => c.isBreaking).length,
      tablesAdded: changes.filter((c) => c.type === 'table_added').length,
      tablesRemoved: changes.filter((c) => c.type === 'table_removed').length,
      columnsAdded: changes.filter((c) => c.type === 'column_added').length,
      columnsRemoved: changes.filter((c) => c.type === 'column_removed').length,
      columnsModified: changes.filter((c) =>
        ['column_type_changed', 'column_nullable_changed', 'column_default_changed'].includes(
          c.type
        )
      ).length,
    };

    return {
      fromVersion: oldSnapshot.version,
      toVersion: newSnapshot.version,
      fromSnapshot: oldSnapshot.id,
      toSnapshot: newSnapshot.id,
      comparedAt: new Date(),
      changes,
      summary,
    };
  }

  /**
   * Check if type change is compatible (non-breaking)
   */
  private isCompatibleTypeChange(oldType: ColumnType, newType: ColumnType): boolean {
    const compatibleChanges: Record<ColumnType, ColumnType[]> = {
      string: ['text'],
      text: [],
      integer: ['bigint', 'decimal', 'float'],
      bigint: ['decimal', 'float'],
      decimal: ['float'],
      float: ['decimal'],
      boolean: [],
      timestamp: ['timestamptz'],
      timestamptz: [],
      date: ['timestamp', 'timestamptz'],
      time: [],
      json: ['jsonb'],
      jsonb: [],
      uuid: [],
      array: [],
      unknown: [],
    };

    return compatibleChanges[oldType]?.includes(newType) || false;
  }
}

// ============================================================================
// SCHEMA DETECTOR
// ============================================================================

export class SchemaChangeDetector {
  private snapshots: Map<string, SchemaSnapshot[]> = new Map();
  private alerts: SchemaAlert[] = [];
  private comparator: SchemaComparator;

  constructor() {
    this.comparator = new SchemaComparator();
  }

  /**
   * Capture schema snapshot
   */
  captureSnapshot(
    databaseName: string,
    schemaName: string,
    tables: TableSchema[],
    capturedBy: string = 'system'
  ): SchemaSnapshot {
    const key = `${databaseName}:${schemaName}`;
    const existing = this.snapshots.get(key) || [];
    const version = existing.length + 1;

    const snapshot: SchemaSnapshot = {
      id: `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      databaseName,
      schemaName,
      tables,
      capturedAt: new Date(),
      capturedBy,
      version,
    };

    existing.push(snapshot);
    this.snapshots.set(key, existing);

    // Compare with previous snapshot if exists
    if (existing.length > 1) {
      const previousSnapshot = existing[existing.length - 2];
      const comparison = this.comparator.compareSnapshots(previousSnapshot, snapshot);

      // Create alerts for breaking changes
      for (const change of comparison.changes.filter((c) => c.isBreaking)) {
        this.alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          snapshotId: snapshot.id,
          changeId: change.id,
          change,
          createdAt: new Date(),
          acknowledged: false,
        });
      }
    }

    return snapshot;
  }

  /**
   * Get latest snapshot
   */
  getLatestSnapshot(databaseName: string, schemaName: string): SchemaSnapshot | null {
    const key = `${databaseName}:${schemaName}`;
    const snapshots = this.snapshots.get(key);
    return snapshots && snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  }

  /**
   * Get snapshot history
   */
  getSnapshotHistory(
    databaseName: string,
    schemaName: string,
    limit: number = 10
  ): SchemaSnapshot[] {
    const key = `${databaseName}:${schemaName}`;
    const snapshots = this.snapshots.get(key) || [];
    return snapshots.slice(-limit).reverse();
  }

  /**
   * Compare versions
   */
  compareVersions(
    databaseName: string,
    schemaName: string,
    fromVersion: number,
    toVersion: number
  ): SchemaComparisonResult | null {
    const key = `${databaseName}:${schemaName}`;
    const snapshots = this.snapshots.get(key) || [];

    const fromSnapshot = snapshots.find((s) => s.version === fromVersion);
    const toSnapshot = snapshots.find((s) => s.version === toVersion);

    if (!fromSnapshot || !toSnapshot) return null;

    return this.comparator.compareSnapshots(fromSnapshot, toSnapshot);
  }

  /**
   * Get unacknowledged alerts
   */
  getUnacknowledgedAlerts(): SchemaAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;
    return true;
  }

  /**
   * Generate SQL to capture current schema
   */
  generateCaptureSchemSQL(schemaName: string = 'public'): string {
    return `
-- Capture schema information from PostgreSQL

-- Get tables
SELECT
    t.table_name,
    obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass) as comment
FROM information_schema.tables t
WHERE t.table_schema = '${schemaName}'
  AND t.table_type = 'BASE TABLE';

-- Get columns
SELECT
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable = 'YES' as nullable,
    c.column_default as default_value,
    col_description(('"' || c.table_schema || '"."' || c.table_name || '"')::regclass, c.ordinal_position) as comment
FROM information_schema.columns c
WHERE c.table_schema = '${schemaName}'
ORDER BY c.table_name, c.ordinal_position;

-- Get constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = '${schemaName}'
GROUP BY tc.table_name, tc.constraint_name, tc.constraint_type;

-- Get indexes
SELECT
    t.relname as table_name,
    i.relname as index_name,
    ix.indisunique as is_unique,
    am.amname as index_type,
    array_agg(a.attname ORDER BY array_position(ix.indkey, a.attnum)) as columns
FROM pg_index ix
JOIN pg_class i ON ix.indexrelid = i.oid
JOIN pg_class t ON ix.indrelid = t.oid
JOIN pg_am am ON i.relam = am.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE n.nspname = '${schemaName}'
  AND NOT ix.indisprimary
GROUP BY t.relname, i.relname, ix.indisunique, am.amname;
`.trim();
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(comparison: SchemaComparisonResult): string {
    const lines: string[] = [
      '# Schema Change Report',
      '',
      `**From Version:** ${comparison.fromVersion}`,
      `**To Version:** ${comparison.toVersion}`,
      `**Compared At:** ${comparison.comparedAt.toISOString()}`,
      '',
      '## Summary',
      '',
      `| Metric | Count |`,
      `|--------|-------|`,
      `| Total Changes | ${comparison.summary.totalChanges} |`,
      `| Breaking Changes | ${comparison.summary.breakingChanges} |`,
      `| Tables Added | ${comparison.summary.tablesAdded} |`,
      `| Tables Removed | ${comparison.summary.tablesRemoved} |`,
      `| Columns Added | ${comparison.summary.columnsAdded} |`,
      `| Columns Removed | ${comparison.summary.columnsRemoved} |`,
      `| Columns Modified | ${comparison.summary.columnsModified} |`,
      '',
    ];

    if (comparison.summary.breakingChanges > 0) {
      lines.push('## Breaking Changes', '');

      for (const change of comparison.changes.filter((c) => c.isBreaking)) {
        lines.push(`### ${change.type}: ${change.tableName}`);
        lines.push(`- **Description:** ${change.description}`);
        lines.push(`- **Impact:** ${change.impact}`);
        if (change.migrationHint) {
          lines.push('- **Migration:**');
          lines.push('```sql');
          lines.push(change.migrationHint);
          lines.push('```');
        }
        lines.push('');
      }
    }

    if (comparison.changes.filter((c) => !c.isBreaking).length > 0) {
      lines.push('## Non-Breaking Changes', '');

      for (const change of comparison.changes.filter((c) => !c.isBreaking)) {
        lines.push(`- **${change.type}:** ${change.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.snapshots.clear();
    this.alerts = [];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultDetector: SchemaChangeDetector | null = null;

export function getDefaultDetector(): SchemaChangeDetector {
  if (!defaultDetector) {
    defaultDetector = new SchemaChangeDetector();
  }
  return defaultDetector;
}

export function resetDetector(): void {
  defaultDetector?.reset();
  defaultDetector = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick schema capture
 */
export function captureSchema(
  tables: TableSchema[],
  databaseName: string = 'onchain_analytics',
  schemaName: string = 'public'
): SchemaSnapshot {
  return getDefaultDetector().captureSnapshot(databaseName, schemaName, tables);
}

/**
 * Quick comparison
 */
export function compareSchemas(
  oldSnapshot: SchemaSnapshot,
  newSnapshot: SchemaSnapshot
): SchemaComparisonResult {
  const comparator = new SchemaComparator();
  return comparator.compareSnapshots(oldSnapshot, newSnapshot);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Classes
  SchemaComparator,
  SchemaChangeDetector,

  // Singleton
  getDefaultDetector,
  resetDetector,

  // Convenience
  captureSchema,
  compareSchemas,
};
