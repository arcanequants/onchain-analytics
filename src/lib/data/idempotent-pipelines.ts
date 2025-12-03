/**
 * Idempotent Pipelines Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Idempotent data ingestion patterns
 * - Upsert strategies (merge, replace, increment)
 * - Deduplication logic
 * - Checkpoint management
 * - Exactly-once semantics
 * - Watermark tracking
 * - Replay support
 */

// ============================================================================
// TYPES
// ============================================================================

export type UpsertStrategy =
  | 'merge' // Update existing, insert new
  | 'replace' // Replace entire partition/batch
  | 'increment' // Only insert new, skip duplicates
  | 'scd2'; // Slowly Changing Dimension Type 2

export type DeduplicationStrategy =
  | 'first' // Keep first occurrence
  | 'last' // Keep last occurrence
  | 'latest_timestamp' // Keep record with latest timestamp
  | 'max_version'; // Keep record with highest version

export type CheckpointState = 'pending' | 'processing' | 'completed' | 'failed';

export interface IdempotencyKey {
  columns: string[];
  hashAlgorithm?: 'md5' | 'sha256';
}

export interface UpsertConfig {
  strategy: UpsertStrategy;
  idempotencyKey: IdempotencyKey;
  conflictColumns: string[];
  updateColumns?: string[];
  timestampColumn?: string;
  versionColumn?: string;
  partitionColumn?: string;
}

export interface Checkpoint {
  id: string;
  pipelineId: string;
  runId: string;
  state: CheckpointState;
  position: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Watermark {
  pipelineId: string;
  sourceId: string;
  column: string;
  value: unknown;
  updatedAt: Date;
}

export interface DeduplicationResult {
  totalRecords: number;
  uniqueRecords: number;
  duplicatesRemoved: number;
  duplicateGroups: number;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  unchanged: number;
  errors: number;
  duration: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'retrying';
  checkpoint?: Checkpoint;
  watermarks: Watermark[];
  stats: {
    recordsProcessed: number;
    recordsInserted: number;
    recordsUpdated: number;
    recordsSkipped: number;
    errors: number;
  };
}

export interface ReplayRequest {
  pipelineId: string;
  fromCheckpoint?: string;
  fromWatermark?: Record<string, unknown>;
  dryRun: boolean;
}

export interface ReplayResult {
  success: boolean;
  recordsReprocessed: number;
  newCheckpoint?: Checkpoint;
  duration: number;
  dryRun: boolean;
}

// ============================================================================
// IDEMPOTENCY KEY GENERATOR
// ============================================================================

export class IdempotencyKeyGenerator {
  private config: IdempotencyKey;

  constructor(config: IdempotencyKey) {
    this.config = config;
  }

  /**
   * Generate idempotency key for a record
   */
  generate(record: Record<string, unknown>): string {
    const values = this.config.columns.map((col) => {
      const value = record[col];
      return value === null || value === undefined ? 'NULL' : String(value);
    });

    const key = values.join('|');

    // Simple hash (in production, use crypto module)
    if (this.config.hashAlgorithm) {
      return this.simpleHash(key);
    }

    return key;
  }

  /**
   * Generate keys for multiple records
   */
  generateBatch(records: Record<string, unknown>[]): Map<string, Record<string, unknown>> {
    const keyMap = new Map<string, Record<string, unknown>>();

    for (const record of records) {
      const key = this.generate(record);
      keyMap.set(key, record);
    }

    return keyMap;
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

// ============================================================================
// DEDUPLICATOR
// ============================================================================

export class Deduplicator {
  private strategy: DeduplicationStrategy;
  private keyGenerator: IdempotencyKeyGenerator;
  private timestampColumn?: string;
  private versionColumn?: string;

  constructor(
    keyConfig: IdempotencyKey,
    strategy: DeduplicationStrategy = 'last',
    timestampColumn?: string,
    versionColumn?: string
  ) {
    this.strategy = strategy;
    this.keyGenerator = new IdempotencyKeyGenerator(keyConfig);
    this.timestampColumn = timestampColumn;
    this.versionColumn = versionColumn;
  }

  /**
   * Deduplicate records
   */
  deduplicate(records: Record<string, unknown>[]): {
    records: Record<string, unknown>[];
    result: DeduplicationResult;
  } {
    const groups = new Map<string, Record<string, unknown>[]>();

    // Group by idempotency key
    for (const record of records) {
      const key = this.keyGenerator.generate(record);
      const group = groups.get(key) || [];
      group.push(record);
      groups.set(key, group);
    }

    // Select winner from each group
    const deduped: Record<string, unknown>[] = [];
    let duplicatesRemoved = 0;

    for (const [, group] of groups) {
      const winner = this.selectWinner(group);
      deduped.push(winner);
      duplicatesRemoved += group.length - 1;
    }

    return {
      records: deduped,
      result: {
        totalRecords: records.length,
        uniqueRecords: deduped.length,
        duplicatesRemoved,
        duplicateGroups: Array.from(groups.values()).filter((g) => g.length > 1).length,
      },
    };
  }

  private selectWinner(group: Record<string, unknown>[]): Record<string, unknown> {
    if (group.length === 1) return group[0];

    switch (this.strategy) {
      case 'first':
        return group[0];

      case 'last':
        return group[group.length - 1];

      case 'latest_timestamp':
        if (!this.timestampColumn) return group[group.length - 1];
        return group.reduce((latest, current) => {
          const latestTs = new Date(latest[this.timestampColumn!] as string).getTime();
          const currentTs = new Date(current[this.timestampColumn!] as string).getTime();
          return currentTs > latestTs ? current : latest;
        });

      case 'max_version':
        if (!this.versionColumn) return group[group.length - 1];
        return group.reduce((max, current) => {
          const maxVersion = Number(max[this.versionColumn!]) || 0;
          const currentVersion = Number(current[this.versionColumn!]) || 0;
          return currentVersion > maxVersion ? current : max;
        });

      default:
        return group[group.length - 1];
    }
  }
}

// ============================================================================
// UPSERT GENERATOR
// ============================================================================

export class UpsertGenerator {
  private config: UpsertConfig;

  constructor(config: UpsertConfig) {
    this.config = config;
  }

  /**
   * Generate UPSERT SQL
   */
  generateSQL(tableName: string, columns: string[]): string {
    switch (this.config.strategy) {
      case 'merge':
        return this.generateMergeSQL(tableName, columns);
      case 'replace':
        return this.generateReplaceSQL(tableName, columns);
      case 'increment':
        return this.generateIncrementSQL(tableName, columns);
      case 'scd2':
        return this.generateSCD2SQL(tableName, columns);
      default:
        return this.generateMergeSQL(tableName, columns);
    }
  }

  private generateMergeSQL(tableName: string, columns: string[]): string {
    const conflictCols = this.config.conflictColumns.join(', ');
    const updateCols =
      this.config.updateColumns ||
      columns.filter((c) => !this.config.conflictColumns.includes(c));

    const updateSet = updateCols.map((c) => `${c} = EXCLUDED.${c}`).join(',\n      ');

    return `
-- Merge (Upsert) strategy
INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ($1, $2, ...)
ON CONFLICT (${conflictCols})
DO UPDATE SET
      ${updateSet},
      updated_at = NOW();
`.trim();
  }

  private generateReplaceSQL(tableName: string, columns: string[]): string {
    const partitionCol = this.config.partitionColumn || 'partition_date';

    return `
-- Replace partition strategy
-- Step 1: Delete existing partition data
DELETE FROM ${tableName}
WHERE ${partitionCol} = $partition_value;

-- Step 2: Insert new data
INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ($1, $2, ...);
`.trim();
  }

  private generateIncrementSQL(tableName: string, columns: string[]): string {
    const conflictCols = this.config.conflictColumns.join(', ');

    return `
-- Increment (insert only) strategy
INSERT INTO ${tableName} (${columns.join(', ')})
VALUES ($1, $2, ...)
ON CONFLICT (${conflictCols})
DO NOTHING;
`.trim();
  }

  private generateSCD2SQL(tableName: string, columns: string[]): string {
    const keyCol = this.config.conflictColumns[0];
    const nonKeyCols = columns.filter((c) => !this.config.conflictColumns.includes(c));

    return `
-- SCD Type 2 strategy

-- Step 1: Expire current records that are changing
UPDATE ${tableName}
SET
    is_current = false,
    valid_to = NOW()
WHERE ${keyCol} IN (
    SELECT s.${keyCol}
    FROM staging s
    JOIN ${tableName} t ON s.${keyCol} = t.${keyCol}
    WHERE t.is_current = true
      AND (${nonKeyCols.map((c) => `s.${c} != t.${c}`).join(' OR ')})
);

-- Step 2: Insert new versions
INSERT INTO ${tableName} (${columns.join(', ')}, is_current, valid_from, valid_to)
SELECT
    ${columns.map((c) => `s.${c}`).join(', ')},
    true,
    NOW(),
    '9999-12-31'::timestamp
FROM staging s
LEFT JOIN ${tableName} t
    ON s.${keyCol} = t.${keyCol}
    AND t.is_current = true
WHERE t.${keyCol} IS NULL
   OR (${nonKeyCols.map((c) => `s.${c} != t.${c}`).join(' OR ')});
`.trim();
  }

  /**
   * Generate idempotent batch insert
   */
  generateBatchInsertSQL(
    tableName: string,
    columns: string[],
    batchSize: number = 1000
  ): string {
    const conflictCols = this.config.conflictColumns.join(', ');
    const valuePlaceholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    return `
-- Idempotent batch insert
-- Use with parameterized queries in batches of ${batchSize}

WITH input_data AS (
    SELECT * FROM UNNEST(
        $1::text[],  -- column1 values
        $2::numeric[], -- column2 values
        ...
    ) AS t(${columns.join(', ')})
),
deduplicated AS (
    SELECT DISTINCT ON (${conflictCols}) *
    FROM input_data
    ORDER BY ${conflictCols}, ${this.config.timestampColumn || 'created_at'} DESC
)
INSERT INTO ${tableName} (${columns.join(', ')})
SELECT ${columns.join(', ')}
FROM deduplicated
ON CONFLICT (${conflictCols})
DO UPDATE SET
    ${(this.config.updateColumns || columns.filter((c) => !this.config.conflictColumns.includes(c))).map((c) => `${c} = EXCLUDED.${c}`).join(',\n    ')},
    updated_at = NOW()
WHERE ${tableName}.updated_at < EXCLUDED.updated_at
   OR ${tableName}.updated_at IS NULL;
`.trim();
  }
}

// ============================================================================
// CHECKPOINT MANAGER
// ============================================================================

export class CheckpointManager {
  private checkpoints: Map<string, Checkpoint> = new Map();

  /**
   * Create checkpoint
   */
  createCheckpoint(
    pipelineId: string,
    runId: string,
    position: Record<string, unknown>,
    metadata: Record<string, unknown> = {}
  ): Checkpoint {
    const checkpoint: Checkpoint = {
      id: `cp_${pipelineId}_${runId}_${Date.now()}`,
      pipelineId,
      runId,
      state: 'pending',
      position,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  /**
   * Update checkpoint state
   */
  updateCheckpoint(
    checkpointId: string,
    state: CheckpointState,
    position?: Record<string, unknown>
  ): Checkpoint | null {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;

    checkpoint.state = state;
    checkpoint.updatedAt = new Date();

    if (position) {
      checkpoint.position = { ...checkpoint.position, ...position };
    }

    if (state === 'completed') {
      checkpoint.completedAt = new Date();
    }

    return checkpoint;
  }

  /**
   * Get latest checkpoint for pipeline
   */
  getLatestCheckpoint(pipelineId: string): Checkpoint | null {
    const pipelineCheckpoints = Array.from(this.checkpoints.values())
      .filter((cp) => cp.pipelineId === pipelineId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return pipelineCheckpoints[0] || null;
  }

  /**
   * Get completed checkpoints
   */
  getCompletedCheckpoints(pipelineId: string): Checkpoint[] {
    return Array.from(this.checkpoints.values())
      .filter((cp) => cp.pipelineId === pipelineId && cp.state === 'completed')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Generate checkpoint SQL
   */
  generateCheckpointSQL(): string {
    return `
-- Checkpoint table
CREATE TABLE IF NOT EXISTS pipeline_checkpoints (
    id VARCHAR(100) PRIMARY KEY,
    pipeline_id VARCHAR(100) NOT NULL,
    run_id VARCHAR(100) NOT NULL,
    state VARCHAR(20) NOT NULL,
    position JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    INDEX idx_checkpoints_pipeline (pipeline_id, created_at DESC),
    INDEX idx_checkpoints_state (state)
);

-- Upsert checkpoint
INSERT INTO pipeline_checkpoints (id, pipeline_id, run_id, state, position, metadata)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (id)
DO UPDATE SET
    state = EXCLUDED.state,
    position = EXCLUDED.position,
    metadata = EXCLUDED.metadata,
    updated_at = NOW(),
    completed_at = CASE
        WHEN EXCLUDED.state = 'completed' THEN NOW()
        ELSE pipeline_checkpoints.completed_at
    END;
`.trim();
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.checkpoints.clear();
  }
}

// ============================================================================
// WATERMARK MANAGER
// ============================================================================

export class WatermarkManager {
  private watermarks: Map<string, Watermark> = new Map();

  private key(pipelineId: string, sourceId: string, column: string): string {
    return `${pipelineId}:${sourceId}:${column}`;
  }

  /**
   * Update watermark
   */
  updateWatermark(
    pipelineId: string,
    sourceId: string,
    column: string,
    value: unknown
  ): Watermark {
    const k = this.key(pipelineId, sourceId, column);

    const watermark: Watermark = {
      pipelineId,
      sourceId,
      column,
      value,
      updatedAt: new Date(),
    };

    this.watermarks.set(k, watermark);
    return watermark;
  }

  /**
   * Get watermark
   */
  getWatermark(pipelineId: string, sourceId: string, column: string): Watermark | null {
    return this.watermarks.get(this.key(pipelineId, sourceId, column)) || null;
  }

  /**
   * Get all watermarks for pipeline
   */
  getPipelineWatermarks(pipelineId: string): Watermark[] {
    return Array.from(this.watermarks.values()).filter(
      (w) => w.pipelineId === pipelineId
    );
  }

  /**
   * Generate incremental query with watermark
   */
  generateIncrementalQuery(
    tableName: string,
    pipelineId: string,
    sourceId: string,
    column: string
  ): string {
    const watermark = this.getWatermark(pipelineId, sourceId, column);

    if (!watermark) {
      return `
-- Initial load (no watermark)
SELECT * FROM ${tableName}
ORDER BY ${column};
`.trim();
    }

    const value =
      watermark.value instanceof Date
        ? `'${watermark.value.toISOString()}'`
        : typeof watermark.value === 'string'
          ? `'${watermark.value}'`
          : watermark.value;

    return `
-- Incremental load from watermark
SELECT * FROM ${tableName}
WHERE ${column} > ${value}
ORDER BY ${column};
`.trim();
  }

  /**
   * Generate watermark SQL
   */
  generateWatermarkSQL(): string {
    return `
-- Watermark table
CREATE TABLE IF NOT EXISTS pipeline_watermarks (
    pipeline_id VARCHAR(100) NOT NULL,
    source_id VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    watermark_value JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),

    PRIMARY KEY (pipeline_id, source_id, column_name),
    INDEX idx_watermarks_updated (updated_at)
);

-- Upsert watermark
INSERT INTO pipeline_watermarks (pipeline_id, source_id, column_name, watermark_value)
VALUES ($1, $2, $3, $4)
ON CONFLICT (pipeline_id, source_id, column_name)
DO UPDATE SET
    watermark_value = EXCLUDED.watermark_value,
    updated_at = NOW();
`.trim();
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.watermarks.clear();
  }
}

// ============================================================================
// IDEMPOTENT PIPELINE
// ============================================================================

export class IdempotentPipeline {
  private id: string;
  private upsertConfig: UpsertConfig;
  private deduplicator: Deduplicator;
  private upsertGenerator: UpsertGenerator;
  private checkpointManager: CheckpointManager;
  private watermarkManager: WatermarkManager;
  private runs: Map<string, PipelineRun> = new Map();

  constructor(
    id: string,
    upsertConfig: UpsertConfig,
    checkpointManager?: CheckpointManager,
    watermarkManager?: WatermarkManager
  ) {
    this.id = id;
    this.upsertConfig = upsertConfig;
    this.deduplicator = new Deduplicator(
      upsertConfig.idempotencyKey,
      'latest_timestamp',
      upsertConfig.timestampColumn,
      upsertConfig.versionColumn
    );
    this.upsertGenerator = new UpsertGenerator(upsertConfig);
    this.checkpointManager = checkpointManager || new CheckpointManager();
    this.watermarkManager = watermarkManager || new WatermarkManager();
  }

  /**
   * Start a new pipeline run
   */
  startRun(): PipelineRun {
    const runId = `run_${this.id}_${Date.now()}`;

    const run: PipelineRun = {
      id: runId,
      pipelineId: this.id,
      startedAt: new Date(),
      status: 'running',
      watermarks: [],
      stats: {
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsSkipped: 0,
        errors: 0,
      },
    };

    this.runs.set(runId, run);
    return run;
  }

  /**
   * Process batch of records
   */
  processBatch(
    runId: string,
    records: Record<string, unknown>[],
    sourceId: string = 'default'
  ): {
    processedRecords: Record<string, unknown>[];
    deduplicationResult: DeduplicationResult;
    checkpoint: Checkpoint;
  } {
    const run = this.runs.get(runId);
    if (!run) {
      throw new Error(`Run not found: ${runId}`);
    }

    // Deduplicate
    const { records: dedupedRecords, result: deduplicationResult } =
      this.deduplicator.deduplicate(records);

    // Update stats
    run.stats.recordsProcessed += records.length;
    run.stats.recordsSkipped += deduplicationResult.duplicatesRemoved;

    // Create checkpoint
    const lastRecord = dedupedRecords[dedupedRecords.length - 1];
    const checkpoint = this.checkpointManager.createCheckpoint(this.id, runId, {
      lastRecordId: lastRecord
        ? this.getIdempotencyKey(lastRecord)
        : null,
      recordsProcessed: run.stats.recordsProcessed,
      batchTimestamp: new Date().toISOString(),
    });

    // Update watermark if timestamp column exists
    if (this.upsertConfig.timestampColumn && lastRecord) {
      const watermarkValue = lastRecord[this.upsertConfig.timestampColumn];
      if (watermarkValue) {
        const watermark = this.watermarkManager.updateWatermark(
          this.id,
          sourceId,
          this.upsertConfig.timestampColumn,
          watermarkValue
        );
        run.watermarks.push(watermark);
      }
    }

    return {
      processedRecords: dedupedRecords,
      deduplicationResult,
      checkpoint,
    };
  }

  /**
   * Complete run
   */
  completeRun(runId: string): PipelineRun | null {
    const run = this.runs.get(runId);
    if (!run) return null;

    run.status = 'completed';
    run.completedAt = new Date();

    // Mark checkpoint as completed
    if (run.checkpoint) {
      this.checkpointManager.updateCheckpoint(run.checkpoint.id, 'completed');
    }

    return run;
  }

  /**
   * Fail run
   */
  failRun(runId: string, error: string): PipelineRun | null {
    const run = this.runs.get(runId);
    if (!run) return null;

    run.status = 'failed';
    run.completedAt = new Date();

    // Mark checkpoint as failed
    if (run.checkpoint) {
      this.checkpointManager.updateCheckpoint(run.checkpoint.id, 'failed');
    }

    return run;
  }

  /**
   * Replay from checkpoint
   */
  replay(request: ReplayRequest): ReplayResult {
    const startTime = Date.now();

    // Get checkpoint to replay from
    let checkpoint: Checkpoint | null = null;
    if (request.fromCheckpoint) {
      const checkpoints = this.checkpointManager.getCompletedCheckpoints(this.id);
      checkpoint = checkpoints.find((cp) => cp.id === request.fromCheckpoint) || null;
    }

    if (request.dryRun) {
      return {
        success: true,
        recordsReprocessed: 0,
        duration: Date.now() - startTime,
        dryRun: true,
      };
    }

    // Start new run from checkpoint
    const run = this.startRun();
    run.checkpoint = checkpoint || undefined;

    return {
      success: true,
      recordsReprocessed: 0,
      newCheckpoint: checkpoint || undefined,
      duration: Date.now() - startTime,
      dryRun: false,
    };
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): PipelineRun | null {
    return this.runs.get(runId) || null;
  }

  /**
   * Get all runs
   */
  getRuns(): PipelineRun[] {
    return Array.from(this.runs.values()).sort(
      (a, b) => b.startedAt.getTime() - a.startedAt.getTime()
    );
  }

  /**
   * Generate SQL for pipeline
   */
  generateSQL(tableName: string, columns: string[]): string {
    return this.upsertGenerator.generateSQL(tableName, columns);
  }

  private getIdempotencyKey(record: Record<string, unknown>): string {
    const keyGen = new IdempotencyKeyGenerator(this.upsertConfig.idempotencyKey);
    return keyGen.generate(record);
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let defaultCheckpointManager: CheckpointManager | null = null;
let defaultWatermarkManager: WatermarkManager | null = null;

export function getDefaultCheckpointManager(): CheckpointManager {
  if (!defaultCheckpointManager) {
    defaultCheckpointManager = new CheckpointManager();
  }
  return defaultCheckpointManager;
}

export function getDefaultWatermarkManager(): WatermarkManager {
  if (!defaultWatermarkManager) {
    defaultWatermarkManager = new WatermarkManager();
  }
  return defaultWatermarkManager;
}

export function resetManagers(): void {
  defaultCheckpointManager?.reset();
  defaultWatermarkManager?.reset();
  defaultCheckpointManager = null;
  defaultWatermarkManager = null;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create idempotent pipeline for token prices
 */
export function createTokenPricesPipeline(): IdempotentPipeline {
  return new IdempotentPipeline(
    'token_prices_ingest',
    {
      strategy: 'merge',
      idempotencyKey: {
        columns: ['coingecko_id'],
        hashAlgorithm: 'md5',
      },
      conflictColumns: ['coingecko_id'],
      updateColumns: [
        'current_price',
        'market_cap',
        'volume_24h',
        'price_change_24h',
        'last_updated',
      ],
      timestampColumn: 'last_updated',
    },
    getDefaultCheckpointManager(),
    getDefaultWatermarkManager()
  );
}

/**
 * Create idempotent pipeline for TVL data
 */
export function createTVLPipeline(): IdempotentPipeline {
  return new IdempotentPipeline(
    'protocol_tvl_ingest',
    {
      strategy: 'increment',
      idempotencyKey: {
        columns: ['protocol_id', 'chain', 'collected_at'],
      },
      conflictColumns: ['protocol_id', 'chain', 'collected_at'],
      timestampColumn: 'collected_at',
    },
    getDefaultCheckpointManager(),
    getDefaultWatermarkManager()
  );
}

/**
 * Create idempotent pipeline for gas metrics
 */
export function createGasMetricsPipeline(): IdempotentPipeline {
  return new IdempotentPipeline(
    'gas_metrics_ingest',
    {
      strategy: 'replace',
      idempotencyKey: {
        columns: ['chain', 'block_number'],
      },
      conflictColumns: ['chain', 'block_number'],
      partitionColumn: 'collected_at',
      timestampColumn: 'collected_at',
    },
    getDefaultCheckpointManager(),
    getDefaultWatermarkManager()
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Classes
  IdempotencyKeyGenerator,
  Deduplicator,
  UpsertGenerator,
  CheckpointManager,
  WatermarkManager,
  IdempotentPipeline,

  // Singletons
  getDefaultCheckpointManager,
  getDefaultWatermarkManager,
  resetManagers,

  // Factory functions
  createTokenPricesPipeline,
  createTVLPipeline,
  createGasMetricsPipeline,
};
