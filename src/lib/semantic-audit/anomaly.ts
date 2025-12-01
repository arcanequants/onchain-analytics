/**
 * Anomaly Detection
 *
 * Statistical anomaly detection for data quality
 *
 * Phase 3, Week 10
 */

import type {
  Anomaly,
  AnomalyType,
  AnomalyDetectionConfig,
} from './types';

// ================================================================
// DEFAULT CONFIG
// ================================================================

export const DEFAULT_ANOMALY_CONFIG: AnomalyDetectionConfig = {
  detectOutliers: true,
  outlierThreshold: 3,
  detectMissing: true,
  detectDuplicates: true,
  validateFormats: true,
  detectTemporalAnomalies: true,
  maxAnomalies: 100,
};

type RecordType = Record<string, unknown>;

// ================================================================
// OUTLIER DETECTION
// ================================================================

/**
 * Detect statistical outliers using Z-score
 */
export function detectOutliers(
  records: RecordType[],
  field: string,
  threshold: number = 3
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const values: number[] = [];
  const indices: number[] = [];

  // Extract numeric values
  for (let i = 0; i < records.length; i++) {
    const value = getNestedValue(records[i], field);
    if (typeof value === 'number' && !isNaN(value)) {
      values.push(value);
      indices.push(i);
    }
  }

  if (values.length < 3) return anomalies;

  // Calculate mean and standard deviation
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return anomalies;

  // Detect outliers using Z-score
  for (let i = 0; i < values.length; i++) {
    const zScore = Math.abs((values[i] - mean) / stdDev);
    if (zScore > threshold) {
      const recordIndex = indices[i];
      anomalies.push({
        type: 'outlier',
        field,
        recordId: getRecordId(records[recordIndex], recordIndex),
        value: values[i],
        expected: mean,
        score: Math.min(1, zScore / 10),
        method: 'z-score',
        context: {
          mean,
          stdDev,
          zScore,
        },
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(
  records: RecordType[],
  field: string,
  multiplier: number = 1.5
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const values: number[] = [];
  const indices: number[] = [];

  // Extract numeric values
  for (let i = 0; i < records.length; i++) {
    const value = getNestedValue(records[i], field);
    if (typeof value === 'number' && !isNaN(value)) {
      values.push(value);
      indices.push(i);
    }
  }

  if (values.length < 4) return anomalies;

  // Sort values and calculate quartiles
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;

  // Detect outliers
  for (let i = 0; i < values.length; i++) {
    if (values[i] < lowerBound || values[i] > upperBound) {
      const recordIndex = indices[i];
      const distance = values[i] < lowerBound
        ? lowerBound - values[i]
        : values[i] - upperBound;

      anomalies.push({
        type: 'outlier',
        field,
        recordId: getRecordId(records[recordIndex], recordIndex),
        value: values[i],
        expected: { lowerBound, upperBound },
        score: Math.min(1, distance / iqr),
        method: 'iqr',
        context: { q1, q3, iqr, lowerBound, upperBound },
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
}

// ================================================================
// MISSING VALUE DETECTION
// ================================================================

/**
 * Detect missing values
 */
export function detectMissingValues(
  records: RecordType[],
  fields: string[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const totalRecords = records.length;

  for (const field of fields) {
    let missingCount = 0;

    for (let i = 0; i < records.length; i++) {
      const value = getNestedValue(records[i], field);

      if (isNullOrEmpty(value)) {
        missingCount++;
        anomalies.push({
          type: 'missing_value',
          field,
          recordId: getRecordId(records[i], i),
          value: null,
          score: 1,
          method: 'null-check',
          timestamp: new Date(),
        });
      }
    }

    // Add summary if significant missing
    if (missingCount > 0 && missingCount / totalRecords > 0.01) {
      anomalies.push({
        type: 'missing_value',
        field,
        recordId: 'summary',
        value: null,
        score: missingCount / totalRecords,
        method: 'aggregate',
        context: {
          missingCount,
          totalRecords,
          missingRate: missingCount / totalRecords,
        },
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
}

// ================================================================
// DUPLICATE DETECTION
// ================================================================

/**
 * Detect duplicate records
 */
export function detectDuplicates(
  records: RecordType[],
  keyFields: string[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const seen = new Map<string, number[]>();

  for (let i = 0; i < records.length; i++) {
    const keyValues = keyFields.map((f) => getNestedValue(records[i], f));
    const key = JSON.stringify(keyValues);

    if (seen.has(key)) {
      seen.get(key)!.push(i);
    } else {
      seen.set(key, [i]);
    }
  }

  // Report duplicates
  for (const [key, indices] of seen) {
    if (indices.length > 1) {
      for (let i = 1; i < indices.length; i++) {
        const recordIndex = indices[i];
        anomalies.push({
          type: 'duplicate',
          field: keyFields.join('+'),
          recordId: getRecordId(records[recordIndex], recordIndex),
          value: JSON.parse(key),
          expected: 'unique',
          score: 1,
          method: 'key-comparison',
          context: {
            originalIndex: indices[0],
            duplicateCount: indices.length - 1,
            allIndices: indices,
          },
          timestamp: new Date(),
        });
      }
    }
  }

  return anomalies;
}

// ================================================================
// FORMAT VALIDATION
// ================================================================

interface FormatPattern {
  name: string;
  pattern: RegExp;
}

const FORMAT_PATTERNS: Record<string, FormatPattern> = {
  email: {
    name: 'Email',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  url: {
    name: 'URL',
    pattern: /^https?:\/\/[^\s]+$/,
  },
  date_iso: {
    name: 'ISO Date',
    pattern: /^\d{4}-\d{2}-\d{2}$/,
  },
  datetime_iso: {
    name: 'ISO DateTime',
    pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
  },
  uuid: {
    name: 'UUID',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },
  phone: {
    name: 'Phone',
    pattern: /^[\d\s\-\+\(\)]{10,}$/,
  },
  ipv4: {
    name: 'IPv4',
    pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
  },
  hex_color: {
    name: 'Hex Color',
    pattern: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/,
  },
};

/**
 * Detect format anomalies
 */
export function detectFormatAnomalies(
  records: RecordType[],
  field: string,
  formatType: keyof typeof FORMAT_PATTERNS
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const format = FORMAT_PATTERNS[formatType];

  if (!format) return anomalies;

  for (let i = 0; i < records.length; i++) {
    const value = getNestedValue(records[i], field);

    if (typeof value === 'string' && value.trim() !== '') {
      if (!format.pattern.test(value)) {
        anomalies.push({
          type: 'invalid_format',
          field,
          recordId: getRecordId(records[i], i),
          value,
          expected: format.name,
          score: 1,
          method: 'regex-validation',
          context: { format: formatType },
          timestamp: new Date(),
        });
      }
    }
  }

  return anomalies;
}

/**
 * Auto-detect format and validate
 */
export function detectAutoFormat(
  records: RecordType[],
  field: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const values: string[] = [];

  // Collect string values
  for (const record of records) {
    const value = getNestedValue(record, field);
    if (typeof value === 'string' && value.trim() !== '') {
      values.push(value);
    }
  }

  if (values.length < 10) return anomalies;

  // Try to detect format from majority
  for (const [formatType, format] of Object.entries(FORMAT_PATTERNS)) {
    const matching = values.filter((v) => format.pattern.test(v));
    const matchRate = matching.length / values.length;

    // If most values match, report non-matching as anomalies
    if (matchRate > 0.9) {
      for (let i = 0; i < records.length; i++) {
        const value = getNestedValue(records[i], field);
        if (typeof value === 'string' && value.trim() !== '' && !format.pattern.test(value)) {
          anomalies.push({
            type: 'invalid_format',
            field,
            recordId: getRecordId(records[i], i),
            value,
            expected: format.name,
            score: matchRate,
            method: 'auto-detect',
            context: { detectedFormat: formatType, matchRate },
            timestamp: new Date(),
          });
        }
      }
      break;
    }
  }

  return anomalies;
}

// ================================================================
// TEMPORAL ANOMALY DETECTION
// ================================================================

/**
 * Detect temporal anomalies (gaps, future dates, etc.)
 */
export function detectTemporalAnomalies(
  records: RecordType[],
  field: string
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const dates: { date: Date; index: number }[] = [];
  const now = new Date();

  // Extract dates
  for (let i = 0; i < records.length; i++) {
    const value = getNestedValue(records[i], field);
    const date = parseDate(value);

    if (date) {
      dates.push({ date, index: i });
    }
  }

  if (dates.length < 2) return anomalies;

  // Sort by date
  dates.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Detect future dates
  for (const { date, index } of dates) {
    if (date > now) {
      anomalies.push({
        type: 'temporal_anomaly',
        field,
        recordId: getRecordId(records[index], index),
        value: date.toISOString(),
        expected: 'date in past or present',
        score: Math.min(1, (date.getTime() - now.getTime()) / (365 * 24 * 60 * 60 * 1000)),
        method: 'future-check',
        context: { type: 'future_date' },
        timestamp: new Date(),
      });
    }
  }

  // Calculate typical gap
  const gaps: number[] = [];
  for (let i = 1; i < dates.length; i++) {
    const gap = dates[i].date.getTime() - dates[i - 1].date.getTime();
    if (gap > 0) gaps.push(gap);
  }

  if (gaps.length < 2) return anomalies;

  const medianGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)];
  const gapThreshold = medianGap * 10;

  // Detect unusual gaps
  for (let i = 1; i < dates.length; i++) {
    const gap = dates[i].date.getTime() - dates[i - 1].date.getTime();
    if (gap > gapThreshold) {
      anomalies.push({
        type: 'temporal_anomaly',
        field,
        recordId: getRecordId(records[dates[i].index], dates[i].index),
        value: dates[i].date.toISOString(),
        expected: `gap <= ${formatDuration(medianGap)}`,
        score: Math.min(1, gap / gapThreshold),
        method: 'gap-detection',
        context: {
          type: 'large_gap',
          gap: formatDuration(gap),
          medianGap: formatDuration(medianGap),
          previousDate: dates[i - 1].date.toISOString(),
        },
        timestamp: new Date(),
      });
    }
  }

  return anomalies;
}

// ================================================================
// RANGE ANOMALY DETECTION
// ================================================================

/**
 * Detect out-of-range values
 */
export function detectOutOfRange(
  records: RecordType[],
  field: string,
  min: number,
  max: number
): Anomaly[] {
  const anomalies: Anomaly[] = [];

  for (let i = 0; i < records.length; i++) {
    const value = getNestedValue(records[i], field);

    if (typeof value === 'number' && !isNaN(value)) {
      if (value < min || value > max) {
        anomalies.push({
          type: 'out_of_range',
          field,
          recordId: getRecordId(records[i], i),
          value,
          expected: { min, max },
          score: value < min
            ? Math.min(1, (min - value) / Math.abs(min))
            : Math.min(1, (value - max) / Math.abs(max)),
          method: 'range-check',
          timestamp: new Date(),
        });
      }
    }
  }

  return anomalies;
}

// ================================================================
// COMBINED DETECTION
// ================================================================

/**
 * Run all anomaly detection methods
 */
export function detectAllAnomalies(
  records: RecordType[],
  fields: string[],
  config: Partial<AnomalyDetectionConfig> = {}
): Anomaly[] {
  const cfg = { ...DEFAULT_ANOMALY_CONFIG, ...config };
  const anomalies: Anomaly[] = [];

  for (const field of fields) {
    // Outliers
    if (cfg.detectOutliers) {
      anomalies.push(...detectOutliers(records, field, cfg.outlierThreshold));
    }

    // Missing values
    if (cfg.detectMissing) {
      anomalies.push(...detectMissingValues(records, [field]));
    }

    // Auto-format detection
    if (cfg.validateFormats) {
      anomalies.push(...detectAutoFormat(records, field));
    }

    // Temporal anomalies
    if (cfg.detectTemporalAnomalies) {
      anomalies.push(...detectTemporalAnomalies(records, field));
    }
  }

  // Duplicates
  if (cfg.detectDuplicates && cfg.duplicateKeyFields) {
    anomalies.push(...detectDuplicates(records, cfg.duplicateKeyFields));
  }

  // Limit results
  return anomalies.slice(0, cfg.maxAnomalies);
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

function isNullOrEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  return null;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectOutliers,
  detectOutliersIQR,
  detectMissingValues,
  detectDuplicates,
  detectFormatAnomalies,
  detectAutoFormat,
  detectTemporalAnomalies,
  detectOutOfRange,
  detectAllAnomalies,
};
