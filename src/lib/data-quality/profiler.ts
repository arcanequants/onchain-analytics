/**
 * Data Profiler
 *
 * Statistical analysis and profiling of data columns
 *
 * Phase 3, Week 10, Day 1
 */

import type {
  ColumnProfile,
  TableProfile,
  NumericStats,
  StringStats,
  DateStats,
  ValueFrequency,
  ForeignKeyInfo,
  IndexInfo,
} from './types';

// ================================================================
// PROFILER TYPES
// ================================================================

export interface ProfilerOptions {
  /** Maximum number of top values to track */
  topValuesLimit?: number;
  /** Maximum number of pattern samples */
  patternSampleLimit?: number;
  /** Enable pattern detection */
  detectPatterns?: boolean;
  /** Sample size (0 = all data) */
  sampleSize?: number;
}

export const DEFAULT_PROFILER_OPTIONS: ProfilerOptions = {
  topValuesLimit: 10,
  patternSampleLimit: 100,
  detectPatterns: true,
  sampleSize: 0,
};

// ================================================================
// COLUMN PROFILER
// ================================================================

/**
 * Profile a single column of data
 */
export function profileColumn(
  columnName: string,
  values: unknown[],
  options: ProfilerOptions = DEFAULT_PROFILER_OPTIONS
): ColumnProfile {
  const { topValuesLimit = 10, detectPatterns = true } = options;

  // Sample data if needed
  const data = sampleData(values, options.sampleSize);
  const totalCount = data.length;

  // Basic null analysis
  const nonNullValues = data.filter((v) => v !== null && v !== undefined);
  const nonNullCount = nonNullValues.length;
  const nullCount = totalCount - nonNullCount;
  const nullPercentage = totalCount > 0 ? (nullCount / totalCount) * 100 : 0;

  // Unique value analysis
  const uniqueSet = new Set(nonNullValues.map((v) => JSON.stringify(v)));
  const uniqueCount = uniqueSet.size;
  const uniquenessPercentage = nonNullCount > 0 ? (uniqueCount / nonNullCount) * 100 : 0;

  // Detect data type
  const dataType = detectDataType(nonNullValues);

  // Calculate top values
  const topValues = calculateTopValues(nonNullValues, topValuesLimit);

  // Type-specific statistics
  let numericStats: NumericStats | undefined;
  let stringStats: StringStats | undefined;
  let dateStats: DateStats | undefined;

  if (dataType === 'number' || dataType === 'integer') {
    numericStats = calculateNumericStats(nonNullValues as number[]);
  } else if (dataType === 'string') {
    stringStats = calculateStringStats(nonNullValues as string[], detectPatterns);
  } else if (dataType === 'date') {
    dateStats = calculateDateStats(nonNullValues as Date[]);
  }

  return {
    column: columnName,
    dataType,
    totalCount,
    nonNullCount,
    nullCount,
    nullPercentage,
    uniqueCount,
    uniquenessPercentage,
    topValues: topValues.length > 0 ? topValues : undefined,
    numericStats,
    stringStats,
    dateStats,
  };
}

/**
 * Profile an entire table
 */
export function profileTable(
  tableName: string,
  rows: Record<string, unknown>[],
  options: ProfilerOptions = DEFAULT_PROFILER_OPTIONS
): TableProfile {
  const startTime = Date.now();

  if (rows.length === 0) {
    return {
      table: tableName,
      rowCount: 0,
      columns: [],
      primaryKey: [],
      foreignKeys: [],
      indexes: [],
      profiledAt: new Date(),
      durationMs: Date.now() - startTime,
    };
  }

  // Get all column names
  const columnNames = Object.keys(rows[0]);

  // Profile each column
  const columns: ColumnProfile[] = columnNames.map((columnName) => {
    const values = rows.map((row) => row[columnName]);
    return profileColumn(columnName, values, options);
  });

  // Detect primary key (heuristic: column named 'id' or ending with '_id' that's unique)
  const primaryKey = detectPrimaryKey(columns, columnNames);

  // Detect foreign keys (heuristic: columns ending with '_id')
  const foreignKeys = detectForeignKeys(columnNames, rows);

  return {
    table: tableName,
    rowCount: rows.length,
    columns,
    primaryKey,
    foreignKeys,
    indexes: [], // Would need schema info for real indexes
    profiledAt: new Date(),
    durationMs: Date.now() - startTime,
  };
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Sample data if sample size is specified
 */
function sampleData<T>(data: T[], sampleSize?: number): T[] {
  if (!sampleSize || sampleSize <= 0 || sampleSize >= data.length) {
    return data;
  }

  // Random sampling
  const sampled: T[] = [];
  const indices = new Set<number>();

  while (sampled.length < sampleSize && indices.size < data.length) {
    const index = Math.floor(Math.random() * data.length);
    if (!indices.has(index)) {
      indices.add(index);
      sampled.push(data[index]);
    }
  }

  return sampled;
}

/**
 * Detect the predominant data type in values
 */
function detectDataType(values: unknown[]): string {
  if (values.length === 0) return 'unknown';

  const typeCounts: Record<string, number> = {};

  for (const value of values) {
    let type: string;

    if (value === null || value === undefined) {
      continue;
    } else if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'integer' : 'number';
    } else if (typeof value === 'boolean') {
      type = 'boolean';
    } else if (typeof value === 'string') {
      // Check if it's a date string
      const date = new Date(value);
      if (!isNaN(date.getTime()) && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        type = 'date';
      } else {
        type = 'string';
      }
    } else if (value instanceof Date) {
      type = 'date';
    } else if (Array.isArray(value)) {
      type = 'array';
    } else if (typeof value === 'object') {
      type = 'object';
    } else {
      type = 'unknown';
    }

    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Return the most common type
  let maxType = 'unknown';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      maxType = type;
      maxCount = count;
    }
  }

  return maxType;
}

/**
 * Calculate top N most frequent values
 */
function calculateTopValues(values: unknown[], limit: number): ValueFrequency[] {
  const counts = new Map<string, { value: unknown; count: number }>();

  for (const value of values) {
    const key = JSON.stringify(value);
    const entry = counts.get(key);
    if (entry) {
      entry.count++;
    } else {
      counts.set(key, { value, count: 1 });
    }
  }

  // Sort by count descending
  const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count);

  // Take top N
  const total = values.length;
  return sorted.slice(0, limit).map((entry) => ({
    value: entry.value,
    count: entry.count,
    percentage: total > 0 ? (entry.count / total) * 100 : 0,
  }));
}

/**
 * Calculate numeric statistics
 */
function calculateNumericStats(values: number[]): NumericStats {
  if (values.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      sum: 0,
      zeros: 0,
      negatives: 0,
      positives: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / values.length;

  // Standard deviation
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);

  // Median
  const midIndex = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[midIndex - 1] + sorted[midIndex]) / 2
      : sorted[midIndex];

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    stdDev,
    sum,
    zeros: values.filter((v) => v === 0).length,
    negatives: values.filter((v) => v < 0).length,
    positives: values.filter((v) => v > 0).length,
  };
}

/**
 * Calculate string statistics
 */
function calculateStringStats(values: string[], detectPatterns: boolean): StringStats {
  if (values.length === 0) {
    return {
      minLength: 0,
      maxLength: 0,
      avgLength: 0,
      emptyCount: 0,
    };
  }

  const lengths = values.map((s) => s.length);
  const emptyCount = values.filter((s) => s.trim() === '').length;

  const stats: StringStats = {
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length,
    emptyCount,
  };

  if (detectPatterns) {
    stats.patterns = detectStringPatterns(values);
  }

  return stats;
}

/**
 * Detect common string patterns
 */
function detectStringPatterns(values: string[]): { pattern: string; count: number; percentage: number }[] {
  const patterns: Record<string, number> = {};

  for (const value of values) {
    const pattern = getStringPattern(value);
    patterns[pattern] = (patterns[pattern] || 0) + 1;
  }

  const total = values.length;
  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([pattern, count]) => ({
      pattern,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    }));
}

/**
 * Get a pattern representation of a string
 */
function getStringPattern(value: string): string {
  return value
    .replace(/[A-Z]/g, 'A')
    .replace(/[a-z]/g, 'a')
    .replace(/[0-9]/g, '9')
    .replace(/\s+/g, ' ');
}

/**
 * Calculate date statistics
 */
function calculateDateStats(values: Date[]): DateStats {
  if (values.length === 0) {
    const now = new Date();
    return {
      min: now,
      max: now,
      daySpan: 0,
      futureCount: 0,
      nullDateCount: 0,
    };
  }

  const validDates = values.filter((d) => d instanceof Date && !isNaN(d.getTime()));
  const now = new Date();

  if (validDates.length === 0) {
    return {
      min: now,
      max: now,
      daySpan: 0,
      futureCount: 0,
      nullDateCount: values.length,
    };
  }

  const sorted = validDates.sort((a, b) => a.getTime() - b.getTime());
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const daySpan = Math.floor((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
  const futureCount = validDates.filter((d) => d > now).length;

  return {
    min,
    max,
    daySpan,
    futureCount,
    nullDateCount: values.length - validDates.length,
  };
}

/**
 * Detect primary key column (heuristic)
 */
function detectPrimaryKey(columns: ColumnProfile[], columnNames: string[]): string[] {
  // Look for 'id' column with 100% uniqueness
  const idColumn = columns.find(
    (c) => c.column === 'id' && c.uniquenessPercentage === 100
  );
  if (idColumn) return ['id'];

  // Look for columns ending with '_id' with 100% uniqueness
  for (const column of columns) {
    if (
      column.column.endsWith('_id') &&
      column.uniquenessPercentage === 100 &&
      column.nullPercentage === 0
    ) {
      return [column.column];
    }
  }

  return [];
}

/**
 * Detect foreign key columns (heuristic)
 */
function detectForeignKeys(
  columnNames: string[],
  _rows: Record<string, unknown>[]
): ForeignKeyInfo[] {
  const foreignKeys: ForeignKeyInfo[] = [];

  for (const column of columnNames) {
    // Skip primary key candidates
    if (column === 'id') continue;

    // Look for pattern: {table_name}_id
    if (column.endsWith('_id')) {
      const referencedTable = column.slice(0, -3); // Remove '_id'
      foreignKeys.push({
        column,
        referencesTable: referencedTable,
        referencesColumn: 'id',
        orphanCount: 0, // Would need actual lookup
      });
    }
  }

  return foreignKeys;
}

// ================================================================
// COMPARISON
// ================================================================

export interface ProfileComparison {
  column: string;
  changes: ProfileChange[];
  significantChange: boolean;
}

export interface ProfileChange {
  metric: string;
  previousValue: unknown;
  currentValue: unknown;
  changePercent?: number;
  significance: 'low' | 'medium' | 'high';
}

/**
 * Compare two column profiles
 */
export function compareProfiles(
  previous: ColumnProfile,
  current: ColumnProfile
): ProfileComparison {
  const changes: ProfileChange[] = [];

  // Compare null percentage
  const nullChange = Math.abs(current.nullPercentage - previous.nullPercentage);
  if (nullChange > 0.1) {
    changes.push({
      metric: 'nullPercentage',
      previousValue: previous.nullPercentage,
      currentValue: current.nullPercentage,
      changePercent: nullChange,
      significance: nullChange > 10 ? 'high' : nullChange > 5 ? 'medium' : 'low',
    });
  }

  // Compare uniqueness
  const uniqueChange = Math.abs(
    current.uniquenessPercentage - previous.uniquenessPercentage
  );
  if (uniqueChange > 0.1) {
    changes.push({
      metric: 'uniquenessPercentage',
      previousValue: previous.uniquenessPercentage,
      currentValue: current.uniquenessPercentage,
      changePercent: uniqueChange,
      significance: uniqueChange > 10 ? 'high' : uniqueChange > 5 ? 'medium' : 'low',
    });
  }

  // Compare numeric stats
  if (previous.numericStats && current.numericStats) {
    const prev = previous.numericStats;
    const curr = current.numericStats;

    if (prev.mean !== 0) {
      const meanChange = Math.abs((curr.mean - prev.mean) / prev.mean) * 100;
      if (meanChange > 5) {
        changes.push({
          metric: 'mean',
          previousValue: prev.mean,
          currentValue: curr.mean,
          changePercent: meanChange,
          significance: meanChange > 20 ? 'high' : meanChange > 10 ? 'medium' : 'low',
        });
      }
    }
  }

  const significantChange = changes.some((c) => c.significance === 'high');

  return {
    column: current.column,
    changes,
    significantChange,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  profileColumn,
  profileTable,
  compareProfiles,
  DEFAULT_PROFILER_OPTIONS,
};
