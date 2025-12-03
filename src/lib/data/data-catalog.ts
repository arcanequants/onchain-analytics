/**
 * Data Catalog
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Features:
 * - Table and column documentation
 * - Data lineage visualization
 * - Owner and steward tracking
 * - Usage statistics
 * - Search and discovery
 */

// ============================================================================
// TYPES
// ============================================================================

export type DataType = 'string' | 'number' | 'boolean' | 'date' | 'timestamp' | 'json' | 'array' | 'uuid';
export type TableType = 'dimension' | 'fact' | 'aggregate' | 'staging' | 'raw' | 'view';
export type SensitivityLevel = 'public' | 'internal' | 'confidential' | 'restricted';

export interface ColumnMetadata {
  name: string;
  dataType: DataType;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: {
    table: string;
    column: string;
  };
  description: string;
  businessName?: string;
  example?: string;
  validValues?: string[];
  sensitivity: SensitivityLevel;
  piiType?: 'email' | 'phone' | 'name' | 'address' | 'ip' | 'user_id' | 'other';
  tags: string[];
}

export interface TableMetadata {
  name: string;
  schema: string;
  type: TableType;
  description: string;
  businessName?: string;
  owner: string;
  steward?: string;
  team?: string;
  columns: ColumnMetadata[];
  primaryKey: string[];
  indexes: string[];
  partitionKey?: string;
  retentionDays?: number;
  refreshSchedule?: string;
  upstreamTables: string[];
  downstreamTables: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessedAt?: Date;
  rowCount?: number;
  sizeBytes?: number;
  qualityScore?: number;
}

export interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  tables: string[];
  owner: string;
  domain: string;
  tags: string[];
  documentation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchResult {
  type: 'table' | 'column' | 'dataset';
  name: string;
  tableName?: string;
  description: string;
  tags: string[];
  score: number;
}

export interface UsageStats {
  tableName: string;
  queryCount: number;
  uniqueUsers: number;
  avgQueryTimeMs: number;
  lastQueried: Date;
  topUsers: Array<{ userId: string; queryCount: number }>;
  topQueries: Array<{ query: string; count: number }>;
}

// ============================================================================
// CATALOG DATA
// ============================================================================

export const DATA_CATALOG: TableMetadata[] = [
  // Dimension Tables
  {
    name: 'dim_brand',
    schema: 'public',
    type: 'dimension',
    description: 'Brand dimension table with SCD Type 2 for historical tracking',
    businessName: 'Brand Master',
    owner: 'data-team',
    steward: 'product-team',
    team: 'data-engineering',
    columns: [
      {
        name: 'id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        description: 'Unique identifier for the brand record',
        sensitivity: 'internal',
        tags: ['key'],
      },
      {
        name: 'brand_key',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Natural key for the brand (URL domain)',
        businessName: 'Brand Key',
        example: 'apple.com',
        sensitivity: 'public',
        tags: ['natural-key'],
      },
      {
        name: 'name',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Display name of the brand',
        businessName: 'Brand Name',
        example: 'Apple Inc.',
        sensitivity: 'public',
        tags: ['display'],
      },
      {
        name: 'domain',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Primary domain of the brand',
        example: 'apple.com',
        sensitivity: 'public',
        tags: [],
      },
      {
        name: 'industry',
        dataType: 'string',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Industry classification',
        businessName: 'Industry',
        example: 'Technology',
        sensitivity: 'public',
        tags: ['classification'],
      },
      {
        name: 'sub_industry',
        dataType: 'string',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Sub-industry classification',
        example: 'Consumer Electronics',
        sensitivity: 'public',
        tags: ['classification'],
      },
      {
        name: 'country',
        dataType: 'string',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Country of headquarters',
        example: 'US',
        sensitivity: 'public',
        tags: ['geography'],
      },
      {
        name: 'valid_from',
        dataType: 'timestamp',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'SCD2 valid from timestamp',
        sensitivity: 'internal',
        tags: ['scd2'],
      },
      {
        name: 'valid_to',
        dataType: 'timestamp',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'SCD2 valid to timestamp (null = current)',
        sensitivity: 'internal',
        tags: ['scd2'],
      },
      {
        name: 'is_current',
        dataType: 'boolean',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Flag indicating current record',
        sensitivity: 'internal',
        tags: ['scd2'],
      },
    ],
    primaryKey: ['id'],
    indexes: ['idx_dim_brand_key', 'idx_dim_brand_domain', 'idx_dim_brand_current'],
    upstreamTables: [],
    downstreamTables: ['fact_brand_perception', 'mv_daily_brand_perception'],
    tags: ['dimension', 'scd2', 'core'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
    rowCount: 50000,
    sizeBytes: 25000000,
    qualityScore: 0.98,
  },

  {
    name: 'dim_provider',
    schema: 'public',
    type: 'dimension',
    description: 'AI Provider dimension table',
    businessName: 'AI Provider Master',
    owner: 'data-team',
    team: 'data-engineering',
    columns: [
      {
        name: 'id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        description: 'Unique identifier for the provider',
        sensitivity: 'internal',
        tags: ['key'],
      },
      {
        name: 'name',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Provider name',
        example: 'openai',
        validValues: ['openai', 'anthropic', 'google', 'perplexity'],
        sensitivity: 'public',
        tags: ['display'],
      },
      {
        name: 'display_name',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Human-readable provider name',
        example: 'OpenAI',
        sensitivity: 'public',
        tags: ['display'],
      },
      {
        name: 'default_model',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Default model for the provider',
        example: 'gpt-4o',
        sensitivity: 'internal',
        tags: ['config'],
      },
      {
        name: 'cost_per_1k_input',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Cost per 1000 input tokens in USD',
        sensitivity: 'confidential',
        tags: ['pricing'],
      },
      {
        name: 'cost_per_1k_output',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Cost per 1000 output tokens in USD',
        sensitivity: 'confidential',
        tags: ['pricing'],
      },
    ],
    primaryKey: ['id'],
    indexes: ['idx_dim_provider_name'],
    upstreamTables: [],
    downstreamTables: ['fact_brand_perception', 'fact_api_usage'],
    tags: ['dimension', 'static', 'core'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
    rowCount: 10,
    sizeBytes: 5000,
    qualityScore: 1.0,
  },

  {
    name: 'dim_time',
    schema: 'public',
    type: 'dimension',
    description: 'Time dimension with fiscal and calendar attributes',
    businessName: 'Date Master',
    owner: 'data-team',
    team: 'data-engineering',
    columns: [
      {
        name: 'date_key',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        description: 'Surrogate key in YYYYMMDD format',
        example: '20241201',
        sensitivity: 'public',
        tags: ['key'],
      },
      {
        name: 'full_date',
        dataType: 'date',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Full date value',
        sensitivity: 'public',
        tags: [],
      },
      {
        name: 'year',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Calendar year',
        sensitivity: 'public',
        tags: ['calendar'],
      },
      {
        name: 'quarter',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Calendar quarter (1-4)',
        sensitivity: 'public',
        tags: ['calendar'],
      },
      {
        name: 'month',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Calendar month (1-12)',
        sensitivity: 'public',
        tags: ['calendar'],
      },
      {
        name: 'week_of_year',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'ISO week of year',
        sensitivity: 'public',
        tags: ['calendar'],
      },
      {
        name: 'day_of_week',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Day of week (1=Monday, 7=Sunday)',
        sensitivity: 'public',
        tags: ['calendar'],
      },
      {
        name: 'is_weekend',
        dataType: 'boolean',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Flag for weekend days',
        sensitivity: 'public',
        tags: ['flag'],
      },
      {
        name: 'is_holiday',
        dataType: 'boolean',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Flag for US holidays',
        sensitivity: 'public',
        tags: ['flag'],
      },
    ],
    primaryKey: ['date_key'],
    indexes: ['idx_dim_time_full_date'],
    upstreamTables: [],
    downstreamTables: ['fact_brand_perception', 'fact_api_usage', 'fact_user_engagement'],
    tags: ['dimension', 'static', 'calendar'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    rowCount: 3650, // 10 years
    sizeBytes: 100000,
    qualityScore: 1.0,
  },

  // Fact Tables
  {
    name: 'fact_brand_perception',
    schema: 'public',
    type: 'fact',
    description: 'Brand perception analysis results from AI providers',
    businessName: 'Brand Perception Analysis',
    owner: 'data-team',
    steward: 'product-team',
    team: 'data-engineering',
    columns: [
      {
        name: 'id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        description: 'Unique identifier for the analysis',
        sensitivity: 'internal',
        tags: ['key'],
      },
      {
        name: 'brand_id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyRef: { table: 'dim_brand', column: 'id' },
        description: 'Foreign key to brand dimension',
        sensitivity: 'internal',
        tags: ['fk'],
      },
      {
        name: 'provider_id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyRef: { table: 'dim_provider', column: 'id' },
        description: 'Foreign key to provider dimension',
        sensitivity: 'internal',
        tags: ['fk'],
      },
      {
        name: 'date_key',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyRef: { table: 'dim_time', column: 'date_key' },
        description: 'Foreign key to time dimension',
        sensitivity: 'internal',
        tags: ['fk'],
      },
      {
        name: 'overall_score',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Overall perception score (0-100)',
        businessName: 'Perception Score',
        sensitivity: 'internal',
        tags: ['measure', 'score'],
      },
      {
        name: 'confidence',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Confidence level (0-1)',
        sensitivity: 'internal',
        tags: ['measure'],
      },
      {
        name: 'latency_ms',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'API call latency in milliseconds',
        sensitivity: 'internal',
        tags: ['performance'],
      },
      {
        name: 'cost_usd',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Cost of analysis in USD',
        sensitivity: 'confidential',
        tags: ['cost'],
      },
      {
        name: 'created_at',
        dataType: 'timestamp',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Record creation timestamp',
        sensitivity: 'internal',
        tags: ['audit'],
      },
    ],
    primaryKey: ['id'],
    indexes: [
      'idx_fact_perception_brand',
      'idx_fact_perception_provider',
      'idx_fact_perception_date',
      'idx_fact_perception_created',
    ],
    partitionKey: 'date_key',
    retentionDays: 365,
    upstreamTables: ['dim_brand', 'dim_provider', 'dim_time'],
    downstreamTables: ['mv_daily_brand_perception', 'mv_score_trends'],
    tags: ['fact', 'core', 'transactional'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
    rowCount: 5000000,
    sizeBytes: 2500000000,
    qualityScore: 0.96,
  },

  {
    name: 'fact_api_usage',
    schema: 'public',
    type: 'fact',
    description: 'API usage and cost tracking',
    businessName: 'API Usage Log',
    owner: 'data-team',
    team: 'data-engineering',
    columns: [
      {
        name: 'id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
        description: 'Unique identifier',
        sensitivity: 'internal',
        tags: ['key'],
      },
      {
        name: 'provider_id',
        dataType: 'uuid',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyRef: { table: 'dim_provider', column: 'id' },
        description: 'Foreign key to provider dimension',
        sensitivity: 'internal',
        tags: ['fk'],
      },
      {
        name: 'model_id',
        dataType: 'string',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Model identifier',
        example: 'gpt-4o',
        sensitivity: 'internal',
        tags: [],
      },
      {
        name: 'input_tokens',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Number of input tokens',
        sensitivity: 'internal',
        tags: ['measure'],
      },
      {
        name: 'output_tokens',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Number of output tokens',
        sensitivity: 'internal',
        tags: ['measure'],
      },
      {
        name: 'cost_usd',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Total cost in USD',
        sensitivity: 'confidential',
        tags: ['cost'],
      },
      {
        name: 'latency_ms',
        dataType: 'number',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Request latency in milliseconds',
        sensitivity: 'internal',
        tags: ['performance'],
      },
      {
        name: 'success',
        dataType: 'boolean',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Request success flag',
        sensitivity: 'internal',
        tags: ['flag'],
      },
      {
        name: 'created_at',
        dataType: 'timestamp',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
        description: 'Record creation timestamp',
        sensitivity: 'internal',
        tags: ['audit'],
      },
    ],
    primaryKey: ['id'],
    indexes: ['idx_fact_api_provider', 'idx_fact_api_created'],
    partitionKey: 'created_at',
    retentionDays: 90,
    upstreamTables: ['dim_provider'],
    downstreamTables: ['mv_provider_performance', 'mv_cost_analytics'],
    tags: ['fact', 'core', 'operational'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-12-01'),
    rowCount: 10000000,
    sizeBytes: 3000000000,
    qualityScore: 0.99,
  },
];

// ============================================================================
// DATA CATALOG CLASS
// ============================================================================

export class DataCatalog {
  private tables: Map<string, TableMetadata> = new Map();
  private datasets: Map<string, DatasetMetadata> = new Map();
  private usageStats: Map<string, UsageStats> = new Map();

  constructor() {
    // Initialize with default catalog
    for (const table of DATA_CATALOG) {
      this.registerTable(table);
    }
  }

  /**
   * Register table metadata
   */
  registerTable(metadata: TableMetadata): void {
    this.tables.set(metadata.name, metadata);
  }

  /**
   * Get table metadata
   */
  getTable(name: string): TableMetadata | undefined {
    return this.tables.get(name);
  }

  /**
   * Get all tables
   */
  getAllTables(): TableMetadata[] {
    return [...this.tables.values()];
  }

  /**
   * Get tables by type
   */
  getTablesByType(type: TableType): TableMetadata[] {
    return [...this.tables.values()].filter(t => t.type === type);
  }

  /**
   * Get tables by owner
   */
  getTablesByOwner(owner: string): TableMetadata[] {
    return [...this.tables.values()].filter(t => t.owner === owner);
  }

  /**
   * Get tables by tag
   */
  getTablesByTag(tag: string): TableMetadata[] {
    return [...this.tables.values()].filter(t => t.tags.includes(tag));
  }

  /**
   * Get column metadata
   */
  getColumn(tableName: string, columnName: string): ColumnMetadata | undefined {
    const table = this.tables.get(tableName);
    return table?.columns.find(c => c.name === columnName);
  }

  /**
   * Get PII columns
   */
  getPIIColumns(): Array<{ table: string; column: ColumnMetadata }> {
    const piiColumns: Array<{ table: string; column: ColumnMetadata }> = [];

    for (const table of this.tables.values()) {
      for (const column of table.columns) {
        if (column.piiType) {
          piiColumns.push({ table: table.name, column });
        }
      }
    }

    return piiColumns;
  }

  /**
   * Get sensitive columns
   */
  getSensitiveColumns(minLevel: SensitivityLevel = 'confidential'): Array<{
    table: string;
    column: ColumnMetadata;
  }> {
    const levels: SensitivityLevel[] = ['public', 'internal', 'confidential', 'restricted'];
    const minIndex = levels.indexOf(minLevel);

    const sensitiveColumns: Array<{ table: string; column: ColumnMetadata }> = [];

    for (const table of this.tables.values()) {
      for (const column of table.columns) {
        if (levels.indexOf(column.sensitivity) >= minIndex) {
          sensitiveColumns.push({ table: table.name, column });
        }
      }
    }

    return sensitiveColumns;
  }

  /**
   * Search catalog
   */
  search(query: string, limit: number = 20): SearchResult[] {
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();

    // Search tables
    for (const table of this.tables.values()) {
      const nameMatch = table.name.toLowerCase().includes(lowerQuery);
      const descMatch = table.description.toLowerCase().includes(lowerQuery);
      const tagMatch = table.tags.some(t => t.toLowerCase().includes(lowerQuery));

      if (nameMatch || descMatch || tagMatch) {
        results.push({
          type: 'table',
          name: table.name,
          description: table.description,
          tags: table.tags,
          score: nameMatch ? 1 : descMatch ? 0.7 : 0.5,
        });
      }

      // Search columns
      for (const column of table.columns) {
        const colNameMatch = column.name.toLowerCase().includes(lowerQuery);
        const colDescMatch = column.description.toLowerCase().includes(lowerQuery);

        if (colNameMatch || colDescMatch) {
          results.push({
            type: 'column',
            name: column.name,
            tableName: table.name,
            description: column.description,
            tags: column.tags,
            score: colNameMatch ? 0.9 : 0.6,
          });
        }
      }
    }

    // Sort by score and limit
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Get lineage graph
   */
  getLineageGraph(): {
    nodes: Array<{ id: string; type: TableType; label: string }>;
    edges: Array<{ from: string; to: string }>;
  } {
    const nodes: Array<{ id: string; type: TableType; label: string }> = [];
    const edges: Array<{ from: string; to: string }> = [];

    for (const table of this.tables.values()) {
      nodes.push({
        id: table.name,
        type: table.type,
        label: table.businessName || table.name,
      });

      for (const upstream of table.upstreamTables) {
        edges.push({ from: upstream, to: table.name });
      }
    }

    return { nodes, edges };
  }

  /**
   * Get upstream tables
   */
  getUpstreamTables(tableName: string, depth: number = 3): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const traverse = (name: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(name)) return;
      visited.add(name);

      const table = this.tables.get(name);
      if (!table) return;

      for (const upstream of table.upstreamTables) {
        result.push(upstream);
        traverse(upstream, currentDepth + 1);
      }
    };

    traverse(tableName, 0);
    return [...new Set(result)];
  }

  /**
   * Get downstream tables
   */
  getDownstreamTables(tableName: string, depth: number = 3): string[] {
    const visited = new Set<string>();
    const result: string[] = [];

    const traverse = (name: string, currentDepth: number) => {
      if (currentDepth > depth || visited.has(name)) return;
      visited.add(name);

      const table = this.tables.get(name);
      if (!table) return;

      for (const downstream of table.downstreamTables) {
        result.push(downstream);
        traverse(downstream, currentDepth + 1);
      }
    };

    traverse(tableName, 0);
    return [...new Set(result)];
  }

  /**
   * Generate markdown documentation
   */
  generateMarkdown(tableName?: string): string {
    const tables = tableName
      ? [this.tables.get(tableName)].filter(Boolean) as TableMetadata[]
      : [...this.tables.values()];

    let md = '# Data Catalog\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    for (const table of tables) {
      md += `## ${table.name}\n\n`;
      md += `**Type:** ${table.type} | **Owner:** ${table.owner}\n\n`;
      md += `${table.description}\n\n`;

      if (table.businessName) {
        md += `**Business Name:** ${table.businessName}\n\n`;
      }

      md += '### Columns\n\n';
      md += '| Column | Type | Nullable | Description |\n';
      md += '|--------|------|----------|-------------|\n';

      for (const col of table.columns) {
        const pk = col.isPrimaryKey ? ' (PK)' : '';
        const fk = col.isForeignKey ? ' (FK)' : '';
        md += `| ${col.name}${pk}${fk} | ${col.dataType} | ${col.nullable ? 'Yes' : 'No'} | ${col.description} |\n`;
      }

      md += '\n';

      if (table.upstreamTables.length > 0) {
        md += `**Upstream:** ${table.upstreamTables.join(', ')}\n\n`;
      }

      if (table.downstreamTables.length > 0) {
        md += `**Downstream:** ${table.downstreamTables.join(', ')}\n\n`;
      }

      md += `**Tags:** ${table.tags.join(', ')}\n\n`;
      md += '---\n\n';
    }

    return md;
  }

  /**
   * Get catalog statistics
   */
  getStats(): {
    totalTables: number;
    totalColumns: number;
    byType: Record<TableType, number>;
    byOwner: Record<string, number>;
    piiColumnCount: number;
    avgQualityScore: number;
  } {
    const byType: Record<string, number> = {};
    const byOwner: Record<string, number> = {};
    let totalColumns = 0;
    let piiColumnCount = 0;
    let totalQuality = 0;
    let qualityCount = 0;

    for (const table of this.tables.values()) {
      byType[table.type] = (byType[table.type] || 0) + 1;
      byOwner[table.owner] = (byOwner[table.owner] || 0) + 1;
      totalColumns += table.columns.length;

      for (const col of table.columns) {
        if (col.piiType) piiColumnCount++;
      }

      if (table.qualityScore !== undefined) {
        totalQuality += table.qualityScore;
        qualityCount++;
      }
    }

    return {
      totalTables: this.tables.size,
      totalColumns,
      byType: byType as Record<TableType, number>,
      byOwner,
      piiColumnCount,
      avgQualityScore: qualityCount > 0 ? totalQuality / qualityCount : 0,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultCatalog: DataCatalog | null = null;

/**
 * Get default catalog
 */
export function getDefaultCatalog(): DataCatalog {
  if (!defaultCatalog) {
    defaultCatalog = new DataCatalog();
  }
  return defaultCatalog;
}

/**
 * Reset catalog (for testing)
 */
export function resetCatalog(): void {
  defaultCatalog = null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  DataCatalog,
  DATA_CATALOG,
  getDefaultCatalog,
  resetCatalog,
};
