/**
 * Time-Based Partitioning & Retention Policies Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Time-based table partitioning (daily, weekly, monthly)
 * - Automatic partition creation
 * - Partition pruning queries
 * - Retention policy definitions
 * - Automated data cleanup
 * - Archive strategies
 * - Partition maintenance jobs
 */

// ============================================================================
// TYPES
// ============================================================================

export type PartitionInterval = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type RetentionAction = 'delete' | 'archive' | 'compress' | 'move_to_cold';

export type PartitionState = 'active' | 'archived' | 'scheduled_for_deletion' | 'deleted';

export interface PartitionConfig {
  tableName: string;
  partitionColumn: string;
  interval: PartitionInterval;
  retentionPeriod: number; // in intervals
  archiveAfter?: number; // archive after N intervals
  compressAfter?: number; // compress after N intervals
  enabled: boolean;
}

export interface Partition {
  name: string;
  tableName: string;
  startDate: Date;
  endDate: Date;
  state: PartitionState;
  rowCount?: number;
  sizeBytes?: number;
  createdAt: Date;
  archivedAt?: Date;
  deletedAt?: Date;
}

export interface RetentionPolicy {
  id: string;
  tableName: string;
  condition: string; // SQL WHERE condition
  action: RetentionAction;
  retentionDays: number;
  archiveTable?: string;
  enabled: boolean;
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  schedule: string; // cron expression
}

export interface RetentionExecution {
  id: string;
  policyId: string;
  executedAt: Date;
  rowsAffected: number;
  bytesFreed?: number;
  duration: number;
  success: boolean;
  error?: string;
}

export interface PartitionMaintenanceResult {
  partitionsCreated: string[];
  partitionsArchived: string[];
  partitionsDeleted: string[];
  errors: string[];
  duration: number;
}

export interface CleanupResult {
  tableName: string;
  rowsDeleted: number;
  rowsArchived: number;
  bytesFreed: number;
  duration: number;
  success: boolean;
  error?: string;
}

// ============================================================================
// PARTITION MANAGER
// ============================================================================

export class PartitionManager {
  private configs: Map<string, PartitionConfig> = new Map();
  private partitions: Map<string, Partition[]> = new Map();

  /**
   * Register partition configuration
   */
  registerConfig(config: PartitionConfig): void {
    this.configs.set(config.tableName, config);
  }

  /**
   * Get partition configuration
   */
  getConfig(tableName: string): PartitionConfig | undefined {
    return this.configs.get(tableName);
  }

  /**
   * Get all configurations
   */
  getAllConfigs(): PartitionConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Generate partition name
   */
  generatePartitionName(tableName: string, date: Date, interval: PartitionInterval): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const week = this.getWeekNumber(date);

    switch (interval) {
      case 'hourly':
        return `${tableName}_${year}${month}${day}_${hour}`;
      case 'daily':
        return `${tableName}_${year}${month}${day}`;
      case 'weekly':
        return `${tableName}_${year}_w${String(week).padStart(2, '0')}`;
      case 'monthly':
        return `${tableName}_${year}${month}`;
      case 'yearly':
        return `${tableName}_${year}`;
    }
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  /**
   * Calculate partition boundaries
   */
  getPartitionBoundaries(
    date: Date,
    interval: PartitionInterval
  ): { start: Date; end: Date } {
    const start = new Date(date);
    const end = new Date(date);

    switch (interval) {
      case 'hourly':
        start.setMinutes(0, 0, 0);
        end.setMinutes(0, 0, 0);
        end.setHours(end.getHours() + 1);
        break;
      case 'daily':
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        end.setDate(end.getDate() + 1);
        break;
      case 'weekly':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 7);
        end.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(1);
        end.setHours(0, 0, 0, 0);
        break;
      case 'yearly':
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        end.setFullYear(end.getFullYear() + 1);
        end.setMonth(0, 1);
        end.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end };
  }

  /**
   * Create partition
   */
  createPartition(tableName: string, date: Date): Partition {
    const config = this.configs.get(tableName);
    if (!config) {
      throw new Error(`No partition config for table: ${tableName}`);
    }

    const boundaries = this.getPartitionBoundaries(date, config.interval);
    const name = this.generatePartitionName(tableName, date, config.interval);

    const partition: Partition = {
      name,
      tableName,
      startDate: boundaries.start,
      endDate: boundaries.end,
      state: 'active',
      createdAt: new Date(),
    };

    const tablePartitions = this.partitions.get(tableName) || [];

    // Check if already exists
    if (!tablePartitions.find((p) => p.name === name)) {
      tablePartitions.push(partition);
      this.partitions.set(tableName, tablePartitions);
    }

    return partition;
  }

  /**
   * Get partitions for a table
   */
  getPartitions(tableName: string): Partition[] {
    return this.partitions.get(tableName) || [];
  }

  /**
   * Get active partitions
   */
  getActivePartitions(tableName: string): Partition[] {
    return this.getPartitions(tableName).filter((p) => p.state === 'active');
  }

  /**
   * Get partitions in date range
   */
  getPartitionsInRange(tableName: string, startDate: Date, endDate: Date): Partition[] {
    return this.getPartitions(tableName).filter(
      (p) =>
        (p.startDate >= startDate && p.startDate < endDate) ||
        (p.endDate > startDate && p.endDate <= endDate) ||
        (p.startDate <= startDate && p.endDate >= endDate)
    );
  }

  /**
   * Generate CREATE TABLE SQL with partitioning
   */
  generateCreateTableSQL(
    tableName: string,
    columns: { name: string; type: string }[],
    partitionColumn: string
  ): string {
    const columnDefs = columns.map((c) => `  ${c.name} ${c.type}`).join(',\n');

    return `
-- Create partitioned table
CREATE TABLE IF NOT EXISTS ${tableName} (
${columnDefs}
) PARTITION BY RANGE (${partitionColumn});

-- Create index on partition column for efficient pruning
CREATE INDEX IF NOT EXISTS idx_${tableName}_${partitionColumn}
  ON ${tableName} (${partitionColumn});
`.trim();
  }

  /**
   * Generate CREATE PARTITION SQL
   */
  generateCreatePartitionSQL(partition: Partition, partitionColumn: string): string {
    const startStr = partition.startDate.toISOString();
    const endStr = partition.endDate.toISOString();

    return `
-- Create partition: ${partition.name}
CREATE TABLE IF NOT EXISTS ${partition.name}
  PARTITION OF ${partition.tableName}
  FOR VALUES FROM ('${startStr}') TO ('${endStr}');
`.trim();
  }

  /**
   * Generate partition pruning query
   */
  generatePruningQuery(
    tableName: string,
    startDate: Date,
    endDate: Date,
    additionalConditions?: string
  ): string {
    const config = this.configs.get(tableName);
    if (!config) {
      throw new Error(`No partition config for table: ${tableName}`);
    }

    const conditions = [
      `${config.partitionColumn} >= '${startDate.toISOString()}'`,
      `${config.partitionColumn} < '${endDate.toISOString()}'`,
    ];

    if (additionalConditions) {
      conditions.push(additionalConditions);
    }

    return `
SELECT * FROM ${tableName}
WHERE ${conditions.join('\n  AND ')};
`.trim();
  }

  /**
   * Run maintenance - create new partitions, archive/delete old ones
   */
  runMaintenance(tableName: string): PartitionMaintenanceResult {
    const startTime = Date.now();
    const config = this.configs.get(tableName);
    const result: PartitionMaintenanceResult = {
      partitionsCreated: [],
      partitionsArchived: [],
      partitionsDeleted: [],
      errors: [],
      duration: 0,
    };

    if (!config || !config.enabled) {
      result.duration = Date.now() - startTime;
      return result;
    }

    const now = new Date();

    // Create future partitions (next 2 intervals)
    for (let i = 0; i <= 2; i++) {
      const futureDate = this.addInterval(now, config.interval, i);
      try {
        const partition = this.createPartition(tableName, futureDate);
        const existingPartitions = this.getPartitions(tableName);
        const isNew = !existingPartitions.find(
          (p) => p.name === partition.name && p.createdAt < partition.createdAt
        );
        if (isNew) {
          result.partitionsCreated.push(partition.name);
        }
      } catch (error) {
        result.errors.push(
          `Failed to create partition for ${futureDate.toISOString()}: ${error}`
        );
      }
    }

    // Archive old partitions
    if (config.archiveAfter) {
      const archiveThreshold = this.addInterval(now, config.interval, -config.archiveAfter);
      const partitions = this.getPartitions(tableName);

      for (const partition of partitions) {
        if (partition.endDate < archiveThreshold && partition.state === 'active') {
          partition.state = 'archived';
          partition.archivedAt = new Date();
          result.partitionsArchived.push(partition.name);
        }
      }
    }

    // Delete expired partitions
    const deleteThreshold = this.addInterval(now, config.interval, -config.retentionPeriod);
    const partitions = this.getPartitions(tableName);

    for (const partition of partitions) {
      if (partition.endDate < deleteThreshold && partition.state !== 'deleted') {
        partition.state = 'scheduled_for_deletion';
        result.partitionsDeleted.push(partition.name);
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  private addInterval(date: Date, interval: PartitionInterval, count: number): Date {
    const result = new Date(date);

    switch (interval) {
      case 'hourly':
        result.setHours(result.getHours() + count);
        break;
      case 'daily':
        result.setDate(result.getDate() + count);
        break;
      case 'weekly':
        result.setDate(result.getDate() + count * 7);
        break;
      case 'monthly':
        result.setMonth(result.getMonth() + count);
        break;
      case 'yearly':
        result.setFullYear(result.getFullYear() + count);
        break;
    }

    return result;
  }

  /**
   * Get partition stats
   */
  getStats(tableName: string): {
    totalPartitions: number;
    activePartitions: number;
    archivedPartitions: number;
    scheduledForDeletion: number;
    oldestPartition?: Date;
    newestPartition?: Date;
  } {
    const partitions = this.getPartitions(tableName);

    const stats = {
      totalPartitions: partitions.length,
      activePartitions: partitions.filter((p) => p.state === 'active').length,
      archivedPartitions: partitions.filter((p) => p.state === 'archived').length,
      scheduledForDeletion: partitions.filter((p) => p.state === 'scheduled_for_deletion')
        .length,
      oldestPartition: undefined as Date | undefined,
      newestPartition: undefined as Date | undefined,
    };

    if (partitions.length > 0) {
      const sorted = [...partitions].sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime()
      );
      stats.oldestPartition = sorted[0].startDate;
      stats.newestPartition = sorted[sorted.length - 1].startDate;
    }

    return stats;
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.configs.clear();
    this.partitions.clear();
  }
}

// ============================================================================
// RETENTION POLICY MANAGER
// ============================================================================

export class RetentionPolicyManager {
  private policies: Map<string, RetentionPolicy> = new Map();
  private executions: RetentionExecution[] = [];

  /**
   * Register retention policy
   */
  registerPolicy(policy: RetentionPolicy): void {
    this.policies.set(policy.id, policy);
  }

  /**
   * Get policy by ID
   */
  getPolicy(id: string): RetentionPolicy | undefined {
    return this.policies.get(id);
  }

  /**
   * Get all policies
   */
  getAllPolicies(): RetentionPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policies for a table
   */
  getPoliciesForTable(tableName: string): RetentionPolicy[] {
    return this.getAllPolicies().filter((p) => p.tableName === tableName);
  }

  /**
   * Generate cleanup SQL
   */
  generateCleanupSQL(policy: RetentionPolicy): string {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

    switch (policy.action) {
      case 'delete':
        return `
-- Retention cleanup: ${policy.id}
-- Deleting data older than ${policy.retentionDays} days
DELETE FROM ${policy.tableName}
WHERE ${policy.condition}
  AND created_at < '${cutoffDate.toISOString()}';
`.trim();

      case 'archive':
        if (!policy.archiveTable) {
          throw new Error('Archive table not specified for archive action');
        }
        return `
-- Retention cleanup: ${policy.id}
-- Archiving data older than ${policy.retentionDays} days

-- Step 1: Insert into archive
INSERT INTO ${policy.archiveTable}
SELECT *, NOW() as archived_at
FROM ${policy.tableName}
WHERE ${policy.condition}
  AND created_at < '${cutoffDate.toISOString()}';

-- Step 2: Delete from source
DELETE FROM ${policy.tableName}
WHERE ${policy.condition}
  AND created_at < '${cutoffDate.toISOString()}';
`.trim();

      case 'compress':
        return `
-- Retention cleanup: ${policy.id}
-- Note: Compression requires table rewrite
-- This is a placeholder - actual implementation depends on DB

-- For PostgreSQL with TOAST:
-- Data is automatically compressed when stored

-- For TimescaleDB:
SELECT compress_chunk(chunk)
FROM timescaledb_information.chunks
WHERE hypertable_name = '${policy.tableName}'
  AND range_end < '${cutoffDate.toISOString()}';
`.trim();

      case 'move_to_cold':
        return `
-- Retention cleanup: ${policy.id}
-- Moving data to cold storage

-- Step 1: Export to S3/cold storage
-- COPY (
--   SELECT * FROM ${policy.tableName}
--   WHERE ${policy.condition}
--     AND created_at < '${cutoffDate.toISOString()}'
-- ) TO 's3://bucket/archive/${policy.tableName}/'
-- WITH (FORMAT parquet);

-- Step 2: Delete from hot storage
DELETE FROM ${policy.tableName}
WHERE ${policy.condition}
  AND created_at < '${cutoffDate.toISOString()}';
`.trim();
    }
  }

  /**
   * Execute cleanup (simulation)
   */
  executeCleanup(policyId: string, rowsAffected: number = 0): CleanupResult {
    const startTime = Date.now();
    const policy = this.policies.get(policyId);

    if (!policy) {
      return {
        tableName: 'unknown',
        rowsDeleted: 0,
        rowsArchived: 0,
        bytesFreed: 0,
        duration: Date.now() - startTime,
        success: false,
        error: `Policy not found: ${policyId}`,
      };
    }

    if (!policy.enabled) {
      return {
        tableName: policy.tableName,
        rowsDeleted: 0,
        rowsArchived: 0,
        bytesFreed: 0,
        duration: Date.now() - startTime,
        success: false,
        error: 'Policy is disabled',
      };
    }

    // Record execution
    const execution: RetentionExecution = {
      id: `exec_${Date.now()}`,
      policyId,
      executedAt: new Date(),
      rowsAffected,
      duration: Date.now() - startTime,
      success: true,
    };
    this.executions.push(execution);

    // Update policy timestamps
    policy.lastExecutedAt = new Date();
    policy.nextExecutionAt = this.calculateNextExecution(policy.schedule);

    return {
      tableName: policy.tableName,
      rowsDeleted: policy.action === 'delete' ? rowsAffected : 0,
      rowsArchived: policy.action === 'archive' ? rowsAffected : 0,
      bytesFreed: rowsAffected * 100, // Estimate
      duration: Date.now() - startTime,
      success: true,
    };
  }

  private calculateNextExecution(schedule: string): Date {
    // Simple cron-like parsing (just for demonstration)
    // Format: "0 2 * * *" = 2 AM daily
    const next = new Date();
    next.setDate(next.getDate() + 1);
    next.setHours(2, 0, 0, 0);
    return next;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(policyId?: string): RetentionExecution[] {
    if (policyId) {
      return this.executions.filter((e) => e.policyId === policyId);
    }
    return [...this.executions];
  }

  /**
   * Get pending policies (due for execution)
   */
  getPendingPolicies(): RetentionPolicy[] {
    const now = new Date();
    return this.getAllPolicies().filter(
      (p) => p.enabled && (!p.nextExecutionAt || p.nextExecutionAt <= now)
    );
  }

  /**
   * Generate retention report
   */
  generateReport(): string {
    const policies = this.getAllPolicies();
    const lines: string[] = [
      '# Retention Policy Report',
      '',
      `**Total Policies:** ${policies.length}`,
      `**Enabled:** ${policies.filter((p) => p.enabled).length}`,
      `**Pending Execution:** ${this.getPendingPolicies().length}`,
      '',
      '## Policies',
      '',
    ];

    for (const policy of policies) {
      lines.push(`### ${policy.id}`);
      lines.push(`- **Table:** ${policy.tableName}`);
      lines.push(`- **Action:** ${policy.action}`);
      lines.push(`- **Retention:** ${policy.retentionDays} days`);
      lines.push(`- **Status:** ${policy.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      lines.push(`- **Last Run:** ${policy.lastExecutedAt?.toISOString() || 'Never'}`);
      lines.push(`- **Next Run:** ${policy.nextExecutionAt?.toISOString() || 'N/A'}`);
      lines.push('');

      const history = this.getExecutionHistory(policy.id).slice(-5);
      if (history.length > 0) {
        lines.push('**Recent Executions:**');
        for (const exec of history) {
          const status = exec.success ? '✅' : '❌';
          lines.push(
            `- ${status} ${exec.executedAt.toISOString()}: ${exec.rowsAffected} rows (${exec.duration}ms)`
          );
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.policies.clear();
    this.executions = [];
  }
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_PARTITION_CONFIGS: PartitionConfig[] = [
  {
    tableName: 'token_price_history',
    partitionColumn: 'collected_at',
    interval: 'daily',
    retentionPeriod: 90, // 90 days
    archiveAfter: 30, // Archive after 30 days
    compressAfter: 7, // Compress after 7 days
    enabled: true,
  },
  {
    tableName: 'gas_metrics',
    partitionColumn: 'collected_at',
    interval: 'hourly',
    retentionPeriod: 168, // 7 days in hours
    archiveAfter: 24, // Archive after 1 day
    enabled: true,
  },
  {
    tableName: 'protocol_tvl',
    partitionColumn: 'collected_at',
    interval: 'daily',
    retentionPeriod: 365, // 1 year
    archiveAfter: 90, // Archive after 90 days
    enabled: true,
  },
  {
    tableName: 'dex_volume',
    partitionColumn: 'collected_at',
    interval: 'daily',
    retentionPeriod: 180, // 6 months
    archiveAfter: 30,
    enabled: true,
  },
  {
    tableName: 'cron_executions',
    partitionColumn: 'created_at',
    interval: 'daily',
    retentionPeriod: 30, // 30 days
    enabled: true,
  },
];

export const DEFAULT_RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: 'cleanup_old_prices',
    tableName: 'token_price_history',
    condition: '1=1',
    action: 'archive',
    retentionDays: 90,
    archiveTable: 'token_price_history_archive',
    enabled: true,
    schedule: '0 3 * * *', // 3 AM daily
  },
  {
    id: 'cleanup_gas_metrics',
    tableName: 'gas_metrics',
    condition: '1=1',
    action: 'delete',
    retentionDays: 7,
    enabled: true,
    schedule: '0 4 * * *', // 4 AM daily
  },
  {
    id: 'cleanup_cron_logs',
    tableName: 'cron_executions',
    condition: "status = 'success'",
    action: 'delete',
    retentionDays: 30,
    enabled: true,
    schedule: '0 5 * * 0', // 5 AM every Sunday
  },
  {
    id: 'archive_old_tvl',
    tableName: 'protocol_tvl',
    condition: '1=1',
    action: 'archive',
    retentionDays: 365,
    archiveTable: 'protocol_tvl_archive',
    enabled: true,
    schedule: '0 2 1 * *', // 2 AM on 1st of each month
  },
  {
    id: 'compress_dex_volume',
    tableName: 'dex_volume',
    condition: '1=1',
    action: 'compress',
    retentionDays: 30,
    enabled: true,
    schedule: '0 6 * * 0', // 6 AM every Sunday
  },
];

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let defaultPartitionManager: PartitionManager | null = null;
let defaultRetentionManager: RetentionPolicyManager | null = null;

export function getDefaultPartitionManager(): PartitionManager {
  if (!defaultPartitionManager) {
    defaultPartitionManager = new PartitionManager();

    // Register default configs
    for (const config of DEFAULT_PARTITION_CONFIGS) {
      defaultPartitionManager.registerConfig(config);
    }
  }
  return defaultPartitionManager;
}

export function getDefaultRetentionManager(): RetentionPolicyManager {
  if (!defaultRetentionManager) {
    defaultRetentionManager = new RetentionPolicyManager();

    // Register default policies
    for (const policy of DEFAULT_RETENTION_POLICIES) {
      defaultRetentionManager.registerPolicy(policy);
    }
  }
  return defaultRetentionManager;
}

export function resetManagers(): void {
  defaultPartitionManager = null;
  defaultRetentionManager = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Create partitions for a date range
 */
export function createPartitionsForRange(
  tableName: string,
  startDate: Date,
  endDate: Date
): Partition[] {
  const manager = getDefaultPartitionManager();
  const config = manager.getConfig(tableName);
  if (!config) {
    throw new Error(`No partition config for table: ${tableName}`);
  }

  const partitions: Partition[] = [];
  const current = new Date(startDate);

  while (current < endDate) {
    const partition = manager.createPartition(tableName, current);
    partitions.push(partition);

    // Advance to next interval
    switch (config.interval) {
      case 'hourly':
        current.setHours(current.getHours() + 1);
        break;
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'yearly':
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return partitions;
}

/**
 * Run all maintenance tasks
 */
export function runAllMaintenance(): {
  partitions: PartitionMaintenanceResult[];
  cleanup: CleanupResult[];
} {
  const partitionManager = getDefaultPartitionManager();
  const retentionManager = getDefaultRetentionManager();

  const partitionResults: PartitionMaintenanceResult[] = [];
  const cleanupResults: CleanupResult[] = [];

  // Run partition maintenance
  for (const config of partitionManager.getAllConfigs()) {
    const result = partitionManager.runMaintenance(config.tableName);
    partitionResults.push(result);
  }

  // Run retention cleanup
  for (const policy of retentionManager.getPendingPolicies()) {
    const result = retentionManager.executeCleanup(policy.id);
    cleanupResults.push(result);
  }

  return {
    partitions: partitionResults,
    cleanup: cleanupResults,
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Managers
  PartitionManager,
  RetentionPolicyManager,

  // Singletons
  getDefaultPartitionManager,
  getDefaultRetentionManager,
  resetManagers,

  // Convenience
  createPartitionsForRange,
  runAllMaintenance,

  // Defaults
  DEFAULT_PARTITION_CONFIGS,
  DEFAULT_RETENTION_POLICIES,
};
