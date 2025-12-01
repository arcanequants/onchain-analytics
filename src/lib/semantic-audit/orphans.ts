/**
 * Orphan Detection
 *
 * Detect orphan records with broken foreign key references
 *
 * Phase 3, Week 10
 */

import type {
  OrphanRecord,
  ReferentialIntegrityCheck,
} from './types';

type RecordType = Record<string, unknown>;

// ================================================================
// ORPHAN DETECTION
// ================================================================

/**
 * Detect orphan records with missing references
 */
export function detectOrphans(
  sourceRecords: RecordType[],
  targetRecords: RecordType[],
  check: ReferentialIntegrityCheck
): OrphanRecord[] {
  if (!check.enabled) return [];

  const orphans: OrphanRecord[] = [];

  // Build set of valid target keys
  const validKeys = new Set<string>();
  for (const record of targetRecords) {
    const key = getNestedValue(record, check.targetPrimaryKey);
    if (key !== null && key !== undefined) {
      validKeys.add(String(key));
    }
  }

  // Check each source record
  for (let i = 0; i < sourceRecords.length; i++) {
    const record = sourceRecords[i];
    const fkValue = getNestedValue(record, check.foreignKeyField);

    // Skip null foreign keys (may be optional)
    if (fkValue === null || fkValue === undefined) continue;

    const fkString = String(fkValue);

    if (!validKeys.has(fkString)) {
      orphans.push({
        sourceTable: check.sourceTable,
        recordId: getRecordId(record, i),
        foreignKeyField: check.foreignKeyField,
        foreignKeyValue: fkValue,
        targetTable: check.targetTable,
        targetPrimaryKey: check.targetPrimaryKey,
        timestamp: new Date(),
      });
    }
  }

  return orphans;
}

/**
 * Detect orphans with multiple checks
 */
export function detectAllOrphans(
  tables: Map<string, RecordType[]>,
  checks: ReferentialIntegrityCheck[]
): OrphanRecord[] {
  const orphans: OrphanRecord[] = [];

  for (const check of checks) {
    if (!check.enabled) continue;

    const sourceRecords = tables.get(check.sourceTable);
    const targetRecords = tables.get(check.targetTable);

    if (!sourceRecords || !targetRecords) {
      console.warn(`Missing table data for check: ${check.sourceTable} -> ${check.targetTable}`);
      continue;
    }

    orphans.push(...detectOrphans(sourceRecords, targetRecords, check));
  }

  return orphans;
}

/**
 * Detect orphans in a single table using self-reference
 */
export function detectSelfReferenceOrphans(
  records: RecordType[],
  foreignKeyField: string,
  primaryKeyField: string = 'id'
): OrphanRecord[] {
  const orphans: OrphanRecord[] = [];

  // Build set of valid primary keys
  const validKeys = new Set<string>();
  for (const record of records) {
    const key = getNestedValue(record, primaryKeyField);
    if (key !== null && key !== undefined) {
      validKeys.add(String(key));
    }
  }

  // Check each record's foreign key
  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const fkValue = getNestedValue(record, foreignKeyField);

    if (fkValue === null || fkValue === undefined) continue;

    const fkString = String(fkValue);

    if (!validKeys.has(fkString)) {
      orphans.push({
        sourceTable: 'self',
        recordId: getRecordId(record, i),
        foreignKeyField,
        foreignKeyValue: fkValue,
        targetTable: 'self',
        targetPrimaryKey: primaryKeyField,
        timestamp: new Date(),
      });
    }
  }

  return orphans;
}

// ================================================================
// BIDIRECTIONAL RELATIONSHIP CHECK
// ================================================================

/**
 * Check bidirectional relationship consistency
 * (e.g., parent has child AND child references parent)
 */
export function checkBidirectionalRelationship(
  parentRecords: RecordType[],
  childRecords: RecordType[],
  parentIdField: string,
  childrenField: string,
  childParentField: string
): {
  missingFromParent: Array<{ parentId: unknown; childId: unknown }>;
  missingFromChild: Array<{ parentId: unknown; childId: unknown }>;
} {
  const missingFromParent: Array<{ parentId: unknown; childId: unknown }> = [];
  const missingFromChild: Array<{ parentId: unknown; childId: unknown }> = [];

  // Build child-parent map
  const childParentMap = new Map<string, unknown>();
  for (const child of childRecords) {
    const childId = getNestedValue(child, 'id');
    const parentId = getNestedValue(child, childParentField);
    if (childId !== undefined) {
      childParentMap.set(String(childId), parentId);
    }
  }

  // Build parent-children map
  const parentChildrenMap = new Map<string, Set<string>>();
  for (const parent of parentRecords) {
    const parentId = getNestedValue(parent, parentIdField);
    const children = getNestedValue(parent, childrenField) as unknown[];

    if (parentId !== undefined && Array.isArray(children)) {
      parentChildrenMap.set(
        String(parentId),
        new Set(children.map((c) => String(c)))
      );
    }
  }

  // Check: child's parent reference matches parent's children list
  for (const child of childRecords) {
    const childId = getNestedValue(child, 'id');
    const parentId = getNestedValue(child, childParentField);

    if (childId === undefined || parentId === undefined) continue;

    const parentIdStr = String(parentId);
    const childIdStr = String(childId);

    const parentChildren = parentChildrenMap.get(parentIdStr);
    if (!parentChildren || !parentChildren.has(childIdStr)) {
      missingFromParent.push({ parentId, childId });
    }
  }

  // Check: parent's children list references valid children
  for (const parent of parentRecords) {
    const parentId = getNestedValue(parent, parentIdField);
    const children = getNestedValue(parent, childrenField) as unknown[];

    if (parentId === undefined || !Array.isArray(children)) continue;

    for (const childId of children) {
      const childIdStr = String(childId);
      const childParent = childParentMap.get(childIdStr);

      if (childParent === undefined || String(childParent) !== String(parentId)) {
        missingFromChild.push({ parentId, childId });
      }
    }
  }

  return { missingFromParent, missingFromChild };
}

// ================================================================
// CASCADE CHECK
// ================================================================

/**
 * Find records that would be orphaned by deleting a record
 */
export function findCascadeImpact(
  recordToDelete: RecordType,
  dependentRecords: RecordType[],
  foreignKeyField: string,
  primaryKeyField: string = 'id'
): RecordType[] {
  const primaryKey = getNestedValue(recordToDelete, primaryKeyField);

  if (primaryKey === undefined) return [];

  return dependentRecords.filter((record) => {
    const fkValue = getNestedValue(record, foreignKeyField);
    return String(fkValue) === String(primaryKey);
  });
}

/**
 * Calculate cascade impact for multiple tables
 */
export function calculateCascadeImpact(
  recordToDelete: RecordType,
  dependentTables: Map<string, { records: RecordType[]; foreignKeyField: string }>,
  primaryKeyField: string = 'id'
): Map<string, RecordType[]> {
  const impact = new Map<string, RecordType[]>();

  for (const [tableName, { records, foreignKeyField }] of dependentTables) {
    const affected = findCascadeImpact(recordToDelete, records, foreignKeyField, primaryKeyField);
    if (affected.length > 0) {
      impact.set(tableName, affected);
    }
  }

  return impact;
}

// ================================================================
// INTEGRITY STATISTICS
// ================================================================

export interface IntegrityStats {
  /** Total relationships checked */
  totalRelationships: number;
  /** Valid relationships */
  validRelationships: number;
  /** Orphan relationships */
  orphanRelationships: number;
  /** Orphan rate (0-1) */
  orphanRate: number;
  /** Tables with orphans */
  tablesWithOrphans: string[];
}

/**
 * Calculate referential integrity statistics
 */
export function getIntegrityStats(orphans: OrphanRecord[]): IntegrityStats {
  const tablesWithOrphans = [...new Set(orphans.map((o) => o.sourceTable))];

  return {
    totalRelationships: orphans.length,
    validRelationships: 0, // Would need additional context
    orphanRelationships: orphans.length,
    orphanRate: orphans.length > 0 ? 1 : 0,
    tablesWithOrphans,
  };
}

/**
 * Group orphans by source table
 */
export function groupOrphansByTable(
  orphans: OrphanRecord[]
): Map<string, OrphanRecord[]> {
  const grouped = new Map<string, OrphanRecord[]>();

  for (const orphan of orphans) {
    const existing = grouped.get(orphan.sourceTable) || [];
    existing.push(orphan);
    grouped.set(orphan.sourceTable, existing);
  }

  return grouped;
}

/**
 * Group orphans by target table
 */
export function groupOrphansByTarget(
  orphans: OrphanRecord[]
): Map<string, OrphanRecord[]> {
  const grouped = new Map<string, OrphanRecord[]>();

  for (const orphan of orphans) {
    const existing = grouped.get(orphan.targetTable) || [];
    existing.push(orphan);
    grouped.set(orphan.targetTable, existing);
  }

  return grouped;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getNestedValue(obj: RecordType, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as RecordType)[key];
  }, obj);
}

function getRecordId(record: RecordType, index: number): string | number {
  return (record.id as string | number) ||
    (record._id as string | number) ||
    (record.uuid as string | number) ||
    index;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectOrphans,
  detectAllOrphans,
  detectSelfReferenceOrphans,
  checkBidirectionalRelationship,
  findCascadeImpact,
  calculateCascadeImpact,
  getIntegrityStats,
  groupOrphansByTable,
  groupOrphansByTarget,
};
