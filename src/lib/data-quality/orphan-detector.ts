/**
 * Orphan Record Detector
 *
 * Detects and manages orphaned records across the database.
 * Orphans are child records that reference non-existent parent records.
 *
 * Features:
 * - Configurable FK relationship definitions
 * - Batch detection with pagination
 * - Automatic cleanup options
 * - Audit logging
 *
 * @module lib/data-quality/orphan-detector
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Foreign key relationship definition
 */
export interface FKRelationship {
  /** Child table name */
  childTable: string;
  /** Child column (foreign key) */
  childColumn: string;
  /** Parent table name */
  parentTable: string;
  /** Parent column (usually 'id') */
  parentColumn: string;
  /** Expected ON DELETE behavior */
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  /** Description of the relationship */
  description?: string;
  /** Criticality level */
  criticality: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Orphan record found
 */
export interface OrphanRecord {
  /** Orphan record ID */
  id: string;
  /** Child table */
  table: string;
  /** FK column */
  column: string;
  /** Missing parent ID */
  missingParentId: string;
  /** Parent table */
  parentTable: string;
  /** When the orphan was created */
  createdAt: string;
}

/**
 * Detection run result
 */
export interface DetectionResult {
  /** Unique run ID */
  runId: string;
  /** When the run started */
  startedAt: string;
  /** When the run completed */
  completedAt: string;
  /** Total relationships checked */
  relationshipsChecked: number;
  /** Total orphans found */
  orphansFound: number;
  /** Orphans by relationship */
  byRelationship: {
    relationship: FKRelationship;
    orphanCount: number;
    orphanIds: string[];
  }[];
  /** Whether any critical orphans were found */
  hasCriticalOrphans: boolean;
  /** Actions taken */
  actionsTaken: string[];
}

/**
 * Cleanup action
 */
export type CleanupAction = 'report' | 'archive' | 'delete';

/**
 * Detector configuration
 */
export interface OrphanDetectorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Max orphans to return per relationship */
  maxOrphansPerRelationship?: number;
  /** Enable audit logging */
  enableAuditLog?: boolean;
  /** Debug mode */
  debug?: boolean;
}

// ============================================================================
// CONSTANTS: FK RELATIONSHIPS
// ============================================================================

/**
 * Known FK relationships in the database
 */
export const FK_RELATIONSHIPS: FKRelationship[] = [
  // User-owned entities
  {
    childTable: 'analyses',
    childColumn: 'user_id',
    parentTable: 'user_profiles',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Analyses owned by users',
    criticality: 'high',
  },
  {
    childTable: 'subscriptions',
    childColumn: 'user_id',
    parentTable: 'user_profiles',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'User subscriptions',
    criticality: 'critical',
  },
  {
    childTable: 'api_keys',
    childColumn: 'user_id',
    parentTable: 'user_profiles',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'User API keys',
    criticality: 'high',
  },

  // Analysis-owned entities
  {
    childTable: 'ai_responses',
    childColumn: 'analysis_id',
    parentTable: 'analyses',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'AI responses for analyses',
    criticality: 'high',
  },
  {
    childTable: 'recommendations',
    childColumn: 'analysis_id',
    parentTable: 'analyses',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Recommendations from analyses',
    criticality: 'high',
  },
  {
    childTable: 'competitors',
    childColumn: 'analysis_id',
    parentTable: 'analyses',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Competitors detected in analyses',
    criticality: 'medium',
  },

  // Feedback & RLHF
  {
    childTable: 'user_feedback',
    childColumn: 'user_id',
    parentTable: 'user_profiles',
    parentColumn: 'id',
    onDelete: 'SET NULL',
    description: 'User feedback (preserve after user deletion)',
    criticality: 'medium',
  },
  {
    childTable: 'preference_pairs',
    childColumn: 'user_id',
    parentTable: 'user_profiles',
    parentColumn: 'id',
    onDelete: 'SET NULL',
    description: 'Preference pairs for RLHF',
    criticality: 'medium',
  },
  {
    childTable: 'recommendation_outcomes',
    childColumn: 'recommendation_id',
    parentTable: 'recommendations',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Recommendation outcome tracking',
    criticality: 'medium',
  },

  // Experiments
  {
    childTable: 'experiment_assignments',
    childColumn: 'experiment_id',
    parentTable: 'prompt_experiments',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Experiment assignments',
    criticality: 'low',
  },
  {
    childTable: 'experiment_events',
    childColumn: 'assignment_id',
    parentTable: 'experiment_assignments',
    parentColumn: 'id',
    onDelete: 'CASCADE',
    description: 'Experiment events',
    criticality: 'low',
  },

  // Active Learning
  {
    childTable: 'active_learning_labels',
    childColumn: 'batch_id',
    parentTable: 'active_learning_batches',
    parentColumn: 'id',
    onDelete: 'SET NULL',
    description: 'Active learning labels',
    criticality: 'low',
  },
];

// ============================================================================
// ORPHAN DETECTOR CLASS
// ============================================================================

/**
 * Orphan Record Detector
 */
export class OrphanDetector {
  private supabase: SupabaseClient;
  private config: Required<
    Omit<OrphanDetectorConfig, 'supabaseUrl' | 'supabaseKey'>
  >;

  constructor(config: OrphanDetectorConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.config = {
      maxOrphansPerRelationship:
        config.maxOrphansPerRelationship ?? 1000,
      enableAuditLog: config.enableAuditLog ?? true,
      debug: config.debug ?? false,
    };
  }

  // --------------------------------------------------------------------------
  // DETECTION
  // --------------------------------------------------------------------------

  /**
   * Run full orphan detection across all relationships
   */
  async detectAll(
    relationships: FKRelationship[] = FK_RELATIONSHIPS
  ): Promise<DetectionResult> {
    const runId = crypto.randomUUID();
    const startedAt = new Date().toISOString();
    const byRelationship: DetectionResult['byRelationship'] = [];
    let totalOrphans = 0;
    let hasCriticalOrphans = false;

    this.log(`Starting orphan detection run: ${runId}`);

    for (const rel of relationships) {
      try {
        const orphans = await this.detectOrphans(rel);

        byRelationship.push({
          relationship: rel,
          orphanCount: orphans.length,
          orphanIds: orphans.map((o) => o.id),
        });

        totalOrphans += orphans.length;

        if (orphans.length > 0 && rel.criticality === 'critical') {
          hasCriticalOrphans = true;
        }

        this.log(
          `${rel.childTable}.${rel.childColumn} -> ${rel.parentTable}: ${orphans.length} orphans`
        );
      } catch (error) {
        this.log(`Error checking ${rel.childTable}.${rel.childColumn}:`, error);
      }
    }

    const result: DetectionResult = {
      runId,
      startedAt,
      completedAt: new Date().toISOString(),
      relationshipsChecked: relationships.length,
      orphansFound: totalOrphans,
      byRelationship,
      hasCriticalOrphans,
      actionsTaken: [],
    };

    // Log to audit table if enabled
    if (this.config.enableAuditLog) {
      await this.logDetectionRun(result);
    }

    return result;
  }

  /**
   * Detect orphans for a specific relationship
   */
  async detectOrphans(relationship: FKRelationship): Promise<OrphanRecord[]> {
    const { childTable, childColumn, parentTable, parentColumn } = relationship;

    // Use raw SQL for the LEFT JOIN orphan detection
    const { data, error } = await this.supabase.rpc('fn_find_orphan_records', {
      p_child_table: childTable,
      p_child_column: childColumn,
      p_parent_table: parentTable,
      p_parent_column: parentColumn,
      p_limit: this.config.maxOrphansPerRelationship,
    });

    if (error) {
      // If function doesn't exist, fall back to manual query
      return this.detectOrphansFallback(relationship);
    }

    return (data ?? []).map((row: Record<string, unknown>) => ({
      id: row.orphan_id as string,
      table: childTable,
      column: childColumn,
      missingParentId: row.missing_parent_id as string,
      parentTable,
      createdAt: row.created_at as string,
    }));
  }

  /**
   * Fallback detection using application-level logic
   */
  private async detectOrphansFallback(
    relationship: FKRelationship
  ): Promise<OrphanRecord[]> {
    const { childTable, childColumn, parentTable, parentColumn } = relationship;

    // Get all unique FK values from child table
    // Use '*' to avoid Supabase parser issues with dynamic column names
    const { data: childRows, error: childError } = await this.supabase
      .from(childTable)
      .select('*')
      .not(childColumn, 'is', null)
      .limit(this.config.maxOrphansPerRelationship * 10);

    if (childError || !childRows) return [];

    // Cast to array of records for dynamic property access
    const rows = childRows as unknown as Record<string, unknown>[];

    // Get unique FK values
    const fkValues = [
      ...new Set(
        rows
          .map((r) => r[childColumn])
          .filter((v) => v !== null && v !== undefined)
      ),
    ];

    if (fkValues.length === 0) return [];

    // Check which parents exist
    const { data: parentRows, error: parentError } = await this.supabase
      .from(parentTable)
      .select('*')
      .in(parentColumn, fkValues as string[]);

    if (parentError) return [];

    const parentRecords = parentRows as unknown as Record<string, unknown>[];
    const existingParents = new Set(
      parentRecords.map((r) => r[parentColumn])
    );

    // Find orphans
    const orphans: OrphanRecord[] = [];
    for (const row of rows) {
      const fkValue = row[childColumn];
      if (fkValue && !existingParents.has(fkValue)) {
        orphans.push({
          id: row.id as string,
          table: childTable,
          column: childColumn,
          missingParentId: fkValue as string,
          parentTable,
          createdAt: row.created_at as string,
        });

        if (orphans.length >= this.config.maxOrphansPerRelationship) {
          break;
        }
      }
    }

    return orphans;
  }

  // --------------------------------------------------------------------------
  // CLEANUP
  // --------------------------------------------------------------------------

  /**
   * Clean up orphans for a relationship
   */
  async cleanupOrphans(
    relationship: FKRelationship,
    action: CleanupAction,
    orphanIds?: string[]
  ): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    const { childTable } = relationship;

    // Get orphan IDs if not provided
    if (!orphanIds) {
      const orphans = await this.detectOrphans(relationship);
      orphanIds = orphans.map((o) => o.id);
    }

    if (orphanIds.length === 0) {
      return { success: true, affectedCount: 0 };
    }

    this.log(`Cleaning up ${orphanIds.length} orphans from ${childTable}`);

    switch (action) {
      case 'report':
        // Just log, no action
        return { success: true, affectedCount: orphanIds.length };

      case 'archive':
        // Move to archive table
        return this.archiveOrphans(childTable, orphanIds);

      case 'delete':
        // Delete orphans
        return this.deleteOrphans(childTable, orphanIds);

      default:
        return { success: false, affectedCount: 0, error: 'Unknown action' };
    }
  }

  /**
   * Archive orphan records
   */
  private async archiveOrphans(
    table: string,
    ids: string[]
  ): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    // Archive table name
    const archiveTable = `${table}_orphan_archive`;

    try {
      // Get records to archive
      const { data: records, error: selectError } = await this.supabase
        .from(table)
        .select('*')
        .in('id', ids);

      if (selectError) throw selectError;

      if (!records || records.length === 0) {
        return { success: true, affectedCount: 0 };
      }

      // Insert into archive with metadata
      const archiveRecords = records.map((r) => ({
        original_id: r.id,
        original_data: r,
        archived_at: new Date().toISOString(),
        archive_reason: 'orphan_cleanup',
      }));

      const { error: insertError } = await this.supabase
        .from(archiveTable)
        .insert(archiveRecords);

      // If archive table doesn't exist, just log
      if (insertError && insertError.code === '42P01') {
        this.log(`Archive table ${archiveTable} does not exist`);
        // Fall through to delete anyway
      } else if (insertError) {
        throw insertError;
      }

      // Delete from original table
      const { error: deleteError, count } = await this.supabase
        .from(table)
        .delete()
        .in('id', ids);

      if (deleteError) throw deleteError;

      return { success: true, affectedCount: count ?? ids.length };
    } catch (error) {
      return {
        success: false,
        affectedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete orphan records
   */
  private async deleteOrphans(
    table: string,
    ids: string[]
  ): Promise<{ success: boolean; affectedCount: number; error?: string }> {
    try {
      const { error, count } = await this.supabase
        .from(table)
        .delete()
        .in('id', ids);

      if (error) throw error;

      return { success: true, affectedCount: count ?? ids.length };
    } catch (error) {
      return {
        success: false,
        affectedCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGGING
  // --------------------------------------------------------------------------

  /**
   * Log detection run to database
   */
  private async logDetectionRun(result: DetectionResult): Promise<void> {
    try {
      await this.supabase.from('orphan_detection_runs').insert({
        id: result.runId,
        started_at: result.startedAt,
        completed_at: result.completedAt,
        relationships_checked: result.relationshipsChecked,
        orphans_found: result.orphansFound,
        has_critical_orphans: result.hasCriticalOrphans,
        details: result.byRelationship.map((r) => ({
          child_table: r.relationship.childTable,
          child_column: r.relationship.childColumn,
          parent_table: r.relationship.parentTable,
          orphan_count: r.orphanCount,
          criticality: r.relationship.criticality,
        })),
      });
    } catch (error) {
      this.log('Failed to log detection run:', error);
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[OrphanDetector]', ...args);
    }
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let detectorInstance: OrphanDetector | null = null;

export function getOrphanDetector(
  config?: OrphanDetectorConfig
): OrphanDetector {
  if (!detectorInstance && config) {
    detectorInstance = new OrphanDetector(config);
  }

  if (!detectorInstance) {
    throw new Error('OrphanDetector not initialized');
  }

  return detectorInstance;
}

export function initOrphanDetector(
  config: OrphanDetectorConfig
): OrphanDetector {
  detectorInstance = new OrphanDetector(config);
  return detectorInstance;
}

export function destroyOrphanDetector(): void {
  detectorInstance = null;
}
