/**
 * Data Export Service - CSV/JSON Export for Pro Users
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - CSV export with proper escaping
 * - JSON export with formatting options
 * - Streaming for large datasets
 * - Subscription tier validation
 * - Rate limiting per user
 * - Export history tracking
 */

import { NextResponse } from 'next/server';

// ============================================================================
// TYPES
// ============================================================================

export type ExportFormat = 'csv' | 'json' | 'xlsx';
export type ExportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  columns?: string[];
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, unknown>;
  includeMetadata?: boolean;
  prettyPrint?: boolean;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  format: ExportFormat;
  size: number;
  rowCount: number;
  exportedAt: string;
  downloadUrl?: string;
  error?: string;
}

export interface ExportJob {
  id: string;
  userId: string;
  status: ExportStatus;
  format: ExportFormat;
  options: ExportOptions;
  result?: ExportResult;
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: (value: unknown) => string;
}

export interface ExportableData {
  data: Record<string, unknown>[];
  columns: ColumnDefinition[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SUBSCRIPTION TIERS
// ============================================================================

export const EXPORT_LIMITS = {
  free: {
    maxRows: 0,
    formats: [] as ExportFormat[],
    dailyExports: 0,
  },
  basic: {
    maxRows: 100,
    formats: ['csv'] as ExportFormat[],
    dailyExports: 3,
  },
  pro: {
    maxRows: 10000,
    formats: ['csv', 'json'] as ExportFormat[],
    dailyExports: 50,
  },
  enterprise: {
    maxRows: 100000,
    formats: ['csv', 'json', 'xlsx'] as ExportFormat[],
    dailyExports: -1, // unlimited
  },
} as const;

export type SubscriptionTier = keyof typeof EXPORT_LIMITS;

// ============================================================================
// CSV EXPORT
// ============================================================================

/**
 * Escape CSV field value
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if escaping is needed
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Convert data to CSV format
 */
export function toCSV(
  data: Record<string, unknown>[],
  columns: ColumnDefinition[],
  options: { includeHeader?: boolean; delimiter?: string } = {}
): string {
  const { includeHeader = true, delimiter = ',' } = options;
  const lines: string[] = [];

  // Header row
  if (includeHeader) {
    const headerRow = columns.map(col => escapeCSVField(col.label)).join(delimiter);
    lines.push(headerRow);
  }

  // Data rows
  for (const row of data) {
    const values = columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : value;
      return escapeCSVField(formatted);
    });
    lines.push(values.join(delimiter));
  }

  return lines.join('\n');
}

/**
 * Stream CSV for large datasets
 */
export async function* streamCSV(
  dataIterator: AsyncIterable<Record<string, unknown>>,
  columns: ColumnDefinition[]
): AsyncGenerator<string> {
  // Yield header
  const headerRow = columns.map(col => escapeCSVField(col.label)).join(',');
  yield headerRow + '\n';

  // Yield data rows
  for await (const row of dataIterator) {
    const values = columns.map(col => {
      const value = row[col.key];
      const formatted = col.format ? col.format(value) : value;
      return escapeCSVField(formatted);
    });
    yield values.join(',') + '\n';
  }
}

// ============================================================================
// JSON EXPORT
// ============================================================================

/**
 * Convert data to JSON format
 */
export function toJSON(
  data: Record<string, unknown>[],
  options: {
    columns?: ColumnDefinition[];
    includeMetadata?: boolean;
    metadata?: Record<string, unknown>;
    prettyPrint?: boolean;
  } = {}
): string {
  const { columns, includeMetadata = false, metadata = {}, prettyPrint = false } = options;

  // Filter columns if specified
  let filteredData = data;
  if (columns && columns.length > 0) {
    const columnKeys = new Set(columns.map(c => c.key));
    filteredData = data.map(row => {
      const filtered: Record<string, unknown> = {};
      for (const key of columnKeys) {
        if (key in row) {
          const col = columns.find(c => c.key === key);
          filtered[key] = col?.format ? col.format(row[key]) : row[key];
        }
      }
      return filtered;
    });
  }

  const output = includeMetadata
    ? {
        metadata: {
          exportedAt: new Date().toISOString(),
          rowCount: filteredData.length,
          ...metadata,
        },
        data: filteredData,
      }
    : filteredData;

  return JSON.stringify(output, null, prettyPrint ? 2 : 0);
}

/**
 * Stream JSON for large datasets (JSON Lines format)
 */
export async function* streamJSONLines(
  dataIterator: AsyncIterable<Record<string, unknown>>,
  columns?: ColumnDefinition[]
): AsyncGenerator<string> {
  const columnKeys = columns ? new Set(columns.map(c => c.key)) : null;

  for await (const row of dataIterator) {
    let outputRow = row;

    if (columnKeys) {
      outputRow = {};
      for (const key of columnKeys) {
        if (key in row) {
          const col = columns!.find(c => c.key === key);
          (outputRow as Record<string, unknown>)[key] = col?.format ? col.format(row[key]) : row[key];
        }
      }
    }

    yield JSON.stringify(outputRow) + '\n';
  }
}

// ============================================================================
// EXPORT SERVICE CLASS
// ============================================================================

export class DataExportService {
  private exportHistory: Map<string, ExportJob[]> = new Map();

  /**
   * Check if user can export based on subscription tier
   */
  canExport(tier: SubscriptionTier, format: ExportFormat, rowCount: number): {
    allowed: boolean;
    reason?: string;
  } {
    const limits = EXPORT_LIMITS[tier];

    if (!limits.formats.includes(format)) {
      return {
        allowed: false,
        reason: `${format.toUpperCase()} export is not available in the ${tier} tier`,
      };
    }

    if (limits.maxRows > 0 && rowCount > limits.maxRows) {
      return {
        allowed: false,
        reason: `Export exceeds maximum row limit of ${limits.maxRows} for ${tier} tier`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check daily export limit
   */
  async checkDailyLimit(userId: string, tier: SubscriptionTier): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: string;
  }> {
    const limits = EXPORT_LIMITS[tier];
    if (limits.dailyExports === -1) {
      return { allowed: true, remaining: -1, resetAt: '' };
    }

    const today = new Date().toISOString().split('T')[0];
    const userHistory = this.exportHistory.get(userId) || [];
    const todayExports = userHistory.filter(
      job => job.createdAt.startsWith(today) && job.status === 'completed'
    ).length;

    const remaining = Math.max(0, limits.dailyExports - todayExports);
    const resetAt = new Date(new Date().setHours(24, 0, 0, 0)).toISOString();

    return {
      allowed: todayExports < limits.dailyExports,
      remaining,
      resetAt,
    };
  }

  /**
   * Export data to specified format
   */
  async export(
    exportable: ExportableData,
    options: ExportOptions,
    userId: string,
    tier: SubscriptionTier
  ): Promise<ExportResult> {
    const { data, columns, metadata } = exportable;
    const { format, filename, includeMetadata = false, prettyPrint = false } = options;

    // Validate permissions
    const canExportResult = this.canExport(tier, format, data.length);
    if (!canExportResult.allowed) {
      return {
        success: false,
        filename: '',
        format,
        size: 0,
        rowCount: 0,
        exportedAt: new Date().toISOString(),
        error: canExportResult.reason,
      };
    }

    // Check daily limit
    const dailyLimit = await this.checkDailyLimit(userId, tier);
    if (!dailyLimit.allowed) {
      return {
        success: false,
        filename: '',
        format,
        size: 0,
        rowCount: 0,
        exportedAt: new Date().toISOString(),
        error: `Daily export limit reached. Resets at ${dailyLimit.resetAt}`,
      };
    }

    // Filter columns if specified
    const exportColumns = options.columns
      ? columns.filter(c => options.columns!.includes(c.key))
      : columns;

    // Generate export content
    let content: string;
    let mimeType: string;
    let extension: string;

    switch (format) {
      case 'csv':
        content = toCSV(data, exportColumns);
        mimeType = 'text/csv';
        extension = 'csv';
        break;

      case 'json':
        content = toJSON(data, {
          columns: exportColumns,
          includeMetadata,
          metadata,
          prettyPrint,
        });
        mimeType = 'application/json';
        extension = 'json';
        break;

      case 'xlsx':
        // XLSX would require a library like exceljs
        return {
          success: false,
          filename: '',
          format,
          size: 0,
          rowCount: 0,
          exportedAt: new Date().toISOString(),
          error: 'XLSX export not yet implemented',
        };

      default:
        return {
          success: false,
          filename: '',
          format,
          size: 0,
          rowCount: 0,
          exportedAt: new Date().toISOString(),
          error: `Unsupported format: ${format}`,
        };
    }

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFilename = filename || `export-${timestamp}.${extension}`;

    // Track export
    const job: ExportJob = {
      id: crypto.randomUUID(),
      userId,
      status: 'completed',
      format,
      options,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const userHistory = this.exportHistory.get(userId) || [];
    userHistory.push(job);
    this.exportHistory.set(userId, userHistory);

    return {
      success: true,
      filename: exportFilename,
      format,
      size: new Blob([content]).size,
      rowCount: data.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Create export response for download
   */
  createExportResponse(
    content: string,
    filename: string,
    format: ExportFormat
  ): NextResponse {
    const mimeTypes: Record<ExportFormat, string> = {
      csv: 'text/csv',
      json: 'application/json',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return new NextResponse(content, {
      headers: {
        'Content-Type': `${mimeTypes[format]}; charset=utf-8`,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  /**
   * Get export history for user
   */
  getExportHistory(userId: string, limit: number = 10): ExportJob[] {
    const history = this.exportHistory.get(userId) || [];
    return history
      .filter(job => new Date(job.expiresAt) > new Date())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

// ============================================================================
// COMMON COLUMN DEFINITIONS
// ============================================================================

export const BRAND_ANALYSIS_COLUMNS: ColumnDefinition[] = [
  { key: 'brandName', label: 'Brand Name', type: 'string' },
  { key: 'industry', label: 'Industry', type: 'string' },
  { key: 'overallScore', label: 'Overall Score', type: 'number' },
  { key: 'sentimentScore', label: 'Sentiment Score', type: 'number' },
  { key: 'visibilityScore', label: 'Visibility Score', type: 'number' },
  { key: 'recommendationScore', label: 'Recommendation Score', type: 'number' },
  {
    key: 'analyzedAt',
    label: 'Analyzed At',
    type: 'date',
    format: (v) => v ? new Date(v as string).toISOString() : '',
  },
  { key: 'primaryProvider', label: 'Primary Provider', type: 'string' },
];

export const COMPETITOR_COLUMNS: ColumnDefinition[] = [
  { key: 'competitorName', label: 'Competitor', type: 'string' },
  { key: 'mentionCount', label: 'Mentions', type: 'number' },
  { key: 'sentimentScore', label: 'Sentiment', type: 'number' },
  { key: 'marketShare', label: 'Market Share %', type: 'number' },
];

export const TREND_COLUMNS: ColumnDefinition[] = [
  {
    key: 'date',
    label: 'Date',
    type: 'date',
    format: (v) => v ? new Date(v as string).toISOString().split('T')[0] : '',
  },
  { key: 'score', label: 'Score', type: 'number' },
  { key: 'changePercent', label: 'Change %', type: 'number' },
  { key: 'volume', label: 'Volume', type: 'number' },
];

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dataExportService = new DataExportService();

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DataExportService,
  dataExportService,
  toCSV,
  toJSON,
  streamCSV,
  streamJSONLines,
  EXPORT_LIMITS,
  BRAND_ANALYSIS_COLUMNS,
  COMPETITOR_COLUMNS,
  TREND_COLUMNS,
};
