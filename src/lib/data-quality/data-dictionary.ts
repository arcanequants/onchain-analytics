/**
 * Data Dictionary Service
 *
 * Provides access to semantic documentation for database columns.
 * Used for:
 * - Column documentation lookup
 * - PII inventory for compliance
 * - Semantic type validation
 * - Data quality reporting
 *
 * @module lib/data-quality/data-dictionary
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * PII classification levels
 */
export type PIIClassification =
  | 'none'
  | 'internal'
  | 'confidential'
  | 'sensitive'
  | 'public';

/**
 * Update frequency types
 */
export type UpdateFrequency =
  | 'real_time'
  | 'near_real_time'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'on_demand'
  | 'static';

/**
 * Data dictionary entry
 */
export interface DataDictionaryEntry {
  id: string;
  schemaName: string;
  tableName: string;
  columnName: string;
  dataType: string;
  semanticType?: string;
  definition: string;
  businessContext?: string;
  exampleValues?: string[];
  allowedValues?: string[];
  unit?: string;
  minValue?: number;
  maxValue?: number;
  isNullable: boolean;
  nullableSemantics?: string;
  defaultValue?: string;
  businessOwner?: string;
  technicalOwner?: string;
  dataStew?: string;
  piiClassification: PIIClassification;
  retentionPolicy?: string;
  sourceSystem?: string;
  updateFrequency: UpdateFrequency;
  isDerived: boolean;
  derivationFormula?: string;
  referencesTable?: string;
  referencesColumn?: string;
  qualityRules?: string[];
  qualityScore?: number;
  isDeprecated: boolean;
  deprecationDate?: string;
  replacementColumn?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Semantic type definition
 */
export interface SemanticType {
  id: string;
  typeName: string;
  displayName: string;
  description: string;
  baseDataType: string;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  allowedValues?: string[];
  formatTemplate?: string;
  unit?: string;
  precision?: number;
  exampleValues?: string[];
  usageCount: number;
  tablesUsing?: string[];
}

/**
 * Table documentation summary
 */
export interface TableDocSummary {
  tableName: string;
  documentedColumns: number;
  withDefinition: number;
  withSemanticType: number;
  piiColumns: number;
  deprecatedColumns: number;
  documentationPct: number;
  lastUpdated: string;
}

/**
 * PII inventory entry
 */
export interface PIIEntry {
  schemaName: string;
  tableName: string;
  columnName: string;
  dataType: string;
  piiClassification: PIIClassification;
  retentionPolicy?: string;
  businessOwner?: string;
  definition: string;
}

/**
 * Search result
 */
export interface SearchResult {
  tableName: string;
  columnName: string;
  definition: string;
  semanticType?: string;
  matchLocation: string;
}

/**
 * Service configuration
 */
export interface DataDictionaryConfig {
  supabaseUrl: string;
  supabaseKey: string;
  cacheEnabled?: boolean;
  cacheTtlMs?: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * Data Dictionary Service
 */
export class DataDictionaryService {
  private supabase: SupabaseClient;
  private cacheEnabled: boolean;
  private cacheTtlMs: number;
  private cache: Map<string, { data: unknown; cachedAt: number }> = new Map();

  constructor(config: DataDictionaryConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.cacheEnabled = config.cacheEnabled ?? true;
    this.cacheTtlMs = config.cacheTtlMs ?? 5 * 60 * 1000; // 5 minutes
  }

  // --------------------------------------------------------------------------
  // DICTIONARY ENTRIES
  // --------------------------------------------------------------------------

  /**
   * Get dictionary entry for a specific column
   */
  async getColumnEntry(
    tableName: string,
    columnName: string,
    schemaName: string = 'public'
  ): Promise<DataDictionaryEntry | null> {
    const cacheKey = `entry:${schemaName}.${tableName}.${columnName}`;
    const cached = this.getFromCache<DataDictionaryEntry>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('data_dictionary')
      .select('*')
      .eq('schema_name', schemaName)
      .eq('table_name', tableName)
      .eq('column_name', columnName)
      .single();

    if (error || !data) return null;

    const entry = this.transformEntry(data);
    this.setCache(cacheKey, entry);
    return entry;
  }

  /**
   * Get all entries for a table
   */
  async getTableEntries(
    tableName: string,
    schemaName: string = 'public'
  ): Promise<DataDictionaryEntry[]> {
    const cacheKey = `table:${schemaName}.${tableName}`;
    const cached = this.getFromCache<DataDictionaryEntry[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('data_dictionary')
      .select('*')
      .eq('schema_name', schemaName)
      .eq('table_name', tableName)
      .order('column_name');

    if (error) return [];

    const entries = (data ?? []).map((d) => this.transformEntry(d));
    this.setCache(cacheKey, entries);
    return entries;
  }

  /**
   * Get entries by semantic type
   */
  async getEntriesBySemanticType(
    semanticType: string
  ): Promise<DataDictionaryEntry[]> {
    const { data, error } = await this.supabase
      .from('data_dictionary')
      .select('*')
      .eq('semantic_type', semanticType)
      .order('table_name, column_name');

    if (error) return [];

    return (data ?? []).map((d) => this.transformEntry(d));
  }

  /**
   * Create or update a dictionary entry
   */
  async upsertEntry(
    entry: Omit<DataDictionaryEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<DataDictionaryEntry | null> {
    const { data, error } = await this.supabase
      .from('data_dictionary')
      .upsert(
        {
          schema_name: entry.schemaName,
          table_name: entry.tableName,
          column_name: entry.columnName,
          data_type: entry.dataType,
          semantic_type: entry.semanticType,
          definition: entry.definition,
          business_context: entry.businessContext,
          example_values: entry.exampleValues,
          allowed_values: entry.allowedValues,
          unit: entry.unit,
          min_value: entry.minValue,
          max_value: entry.maxValue,
          is_nullable: entry.isNullable,
          nullable_semantics: entry.nullableSemantics,
          default_value: entry.defaultValue,
          business_owner: entry.businessOwner,
          technical_owner: entry.technicalOwner,
          data_steward: entry.dataStew,
          pii_classification: entry.piiClassification,
          retention_policy: entry.retentionPolicy,
          source_system: entry.sourceSystem,
          update_frequency: entry.updateFrequency,
          is_derived: entry.isDerived,
          derivation_formula: entry.derivationFormula,
          references_table: entry.referencesTable,
          references_column: entry.referencesColumn,
          quality_rules: entry.qualityRules,
          is_deprecated: entry.isDeprecated,
          deprecation_date: entry.deprecationDate,
          replacement_column: entry.replacementColumn,
        },
        { onConflict: 'schema_name,table_name,column_name' }
      )
      .select()
      .single();

    if (error || !data) return null;

    // Invalidate cache
    this.invalidateTableCache(entry.schemaName, entry.tableName);

    return this.transformEntry(data);
  }

  // --------------------------------------------------------------------------
  // SEMANTIC TYPES
  // --------------------------------------------------------------------------

  /**
   * Get all semantic types
   */
  async getSemanticTypes(): Promise<SemanticType[]> {
    const cacheKey = 'semantic_types';
    const cached = this.getFromCache<SemanticType[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.supabase
      .from('semantic_types')
      .select('*')
      .order('type_name');

    if (error) return [];

    const types = (data ?? []).map((d) => this.transformSemanticType(d));
    this.setCache(cacheKey, types);
    return types;
  }

  /**
   * Get a specific semantic type
   */
  async getSemanticType(typeName: string): Promise<SemanticType | null> {
    const { data, error } = await this.supabase
      .from('semantic_types')
      .select('*')
      .eq('type_name', typeName)
      .single();

    if (error || !data) return null;

    return this.transformSemanticType(data);
  }

  /**
   * Validate a value against a semantic type
   */
  async validateValue(
    value: number,
    semanticTypeName: string
  ): Promise<{ valid: boolean; message?: string }> {
    const type = await this.getSemanticType(semanticTypeName);

    if (!type) {
      return { valid: true }; // Unknown type, pass
    }

    if (type.minValue !== undefined && value < type.minValue) {
      return {
        valid: false,
        message: `Value ${value} is below minimum ${type.minValue} for type ${type.displayName}`,
      };
    }

    if (type.maxValue !== undefined && value > type.maxValue) {
      return {
        valid: false,
        message: `Value ${value} exceeds maximum ${type.maxValue} for type ${type.displayName}`,
      };
    }

    return { valid: true };
  }

  // --------------------------------------------------------------------------
  // DOCUMENTATION SUMMARIES
  // --------------------------------------------------------------------------

  /**
   * Get documentation summary for all tables
   */
  async getDocumentationSummary(): Promise<TableDocSummary[]> {
    const { data, error } = await this.supabase
      .from('vw_data_dictionary_summary')
      .select('*')
      .order('table_name');

    if (error) return [];

    return (data ?? []).map((d) => ({
      tableName: d.table_name,
      documentedColumns: d.documented_columns ?? 0,
      withDefinition: d.with_definition ?? 0,
      withSemanticType: d.with_semantic_type ?? 0,
      piiColumns: d.pii_columns ?? 0,
      deprecatedColumns: d.deprecated_columns ?? 0,
      documentationPct: d.documentation_pct ?? 0,
      lastUpdated: d.last_updated,
    }));
  }

  /**
   * Get PII inventory for compliance
   */
  async getPIIInventory(): Promise<PIIEntry[]> {
    const { data, error } = await this.supabase
      .from('vw_pii_inventory')
      .select('*');

    if (error) return [];

    return (data ?? []).map((d) => ({
      schemaName: d.schema_name,
      tableName: d.table_name,
      columnName: d.column_name,
      dataType: d.data_type,
      piiClassification: d.pii_classification as PIIClassification,
      retentionPolicy: d.retention_policy,
      businessOwner: d.business_owner,
      definition: d.definition,
    }));
  }

  /**
   * Get deprecated columns
   */
  async getDeprecatedColumns(): Promise<
    {
      tableName: string;
      columnName: string;
      deprecationDate?: string;
      replacementColumn?: string;
      migrationNotes?: string;
    }[]
  > {
    const { data, error } = await this.supabase
      .from('vw_deprecated_columns')
      .select('*');

    if (error) return [];

    return (data ?? []).map((d) => ({
      tableName: d.table_name,
      columnName: d.column_name,
      deprecationDate: d.deprecation_date,
      replacementColumn: d.replacement_column,
      migrationNotes: d.migration_notes,
    }));
  }

  // --------------------------------------------------------------------------
  // SEARCH
  // --------------------------------------------------------------------------

  /**
   * Search the data dictionary
   */
  async search(
    term: string,
    searchInDefinitions: boolean = true
  ): Promise<SearchResult[]> {
    const { data, error } = await this.supabase.rpc(
      'fn_search_data_dictionary',
      {
        search_term: term,
        search_in_definitions: searchInDefinitions,
      }
    );

    if (error) return [];

    return (data ?? []).map((d: Record<string, unknown>) => ({
      tableName: d.table_name as string,
      columnName: d.column_name as string,
      definition: d.definition as string,
      semanticType: d.semantic_type as string | undefined,
      matchLocation: d.match_location as string,
    }));
  }

  // --------------------------------------------------------------------------
  // STATISTICS
  // --------------------------------------------------------------------------

  /**
   * Get overall documentation statistics
   */
  async getStatistics(): Promise<{
    totalTables: number;
    totalColumns: number;
    documentedColumns: number;
    documentationPct: number;
    piiColumns: number;
    deprecatedColumns: number;
    semanticTypesUsed: number;
  }> {
    const summary = await this.getDocumentationSummary();

    const totalTables = summary.length;
    const totalColumns = summary.reduce(
      (sum, t) => sum + t.documentedColumns,
      0
    );
    const documentedColumns = summary.reduce(
      (sum, t) => sum + t.withDefinition,
      0
    );
    const piiColumns = summary.reduce((sum, t) => sum + t.piiColumns, 0);
    const deprecatedColumns = summary.reduce(
      (sum, t) => sum + t.deprecatedColumns,
      0
    );

    const { count: semanticTypesUsed } = await this.supabase
      .from('data_dictionary')
      .select('semantic_type', { count: 'exact', head: true })
      .not('semantic_type', 'is', null);

    return {
      totalTables,
      totalColumns,
      documentedColumns,
      documentationPct:
        totalColumns > 0 ? (documentedColumns / totalColumns) * 100 : 0,
      piiColumns,
      deprecatedColumns,
      semanticTypesUsed: semanticTypesUsed ?? 0,
    };
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  private transformEntry(data: Record<string, unknown>): DataDictionaryEntry {
    return {
      id: data.id as string,
      schemaName: data.schema_name as string,
      tableName: data.table_name as string,
      columnName: data.column_name as string,
      dataType: data.data_type as string,
      semanticType: data.semantic_type as string | undefined,
      definition: data.definition as string,
      businessContext: data.business_context as string | undefined,
      exampleValues: data.example_values as string[] | undefined,
      allowedValues: data.allowed_values as string[] | undefined,
      unit: data.unit as string | undefined,
      minValue: data.min_value as number | undefined,
      maxValue: data.max_value as number | undefined,
      isNullable: data.is_nullable as boolean,
      nullableSemantics: data.nullable_semantics as string | undefined,
      defaultValue: data.default_value as string | undefined,
      businessOwner: data.business_owner as string | undefined,
      technicalOwner: data.technical_owner as string | undefined,
      dataStew: data.data_steward as string | undefined,
      piiClassification: data.pii_classification as PIIClassification,
      retentionPolicy: data.retention_policy as string | undefined,
      sourceSystem: data.source_system as string | undefined,
      updateFrequency: data.update_frequency as UpdateFrequency,
      isDerived: data.is_derived as boolean,
      derivationFormula: data.derivation_formula as string | undefined,
      referencesTable: data.references_table as string | undefined,
      referencesColumn: data.references_column as string | undefined,
      qualityRules: data.quality_rules as string[] | undefined,
      qualityScore: data.quality_score as number | undefined,
      isDeprecated: data.is_deprecated as boolean,
      deprecationDate: data.deprecation_date as string | undefined,
      replacementColumn: data.replacement_column as string | undefined,
      createdAt: data.created_at as string,
      updatedAt: data.updated_at as string,
    };
  }

  private transformSemanticType(data: Record<string, unknown>): SemanticType {
    return {
      id: data.id as string,
      typeName: data.type_name as string,
      displayName: data.display_name as string,
      description: data.description as string,
      baseDataType: data.base_data_type as string,
      minValue: data.min_value as number | undefined,
      maxValue: data.max_value as number | undefined,
      pattern: data.pattern as string | undefined,
      allowedValues: data.allowed_values as string[] | undefined,
      formatTemplate: data.format_template as string | undefined,
      unit: data.unit as string | undefined,
      precision: data.precision as number | undefined,
      exampleValues: data.example_values as string[] | undefined,
      usageCount: data.usage_count as number,
      tablesUsing: data.tables_using as string[] | undefined,
    };
  }

  private getFromCache<T>(key: string): T | null {
    if (!this.cacheEnabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.cachedAt > this.cacheTtlMs) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  private setCache(key: string, data: unknown): void {
    if (!this.cacheEnabled) return;
    this.cache.set(key, { data, cachedAt: Date.now() });
  }

  private invalidateTableCache(schemaName: string, tableName: string): void {
    const prefix = `table:${schemaName}.${tableName}`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.startsWith(`entry:${schemaName}.${tableName}`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let serviceInstance: DataDictionaryService | null = null;

export function getDataDictionaryService(
  config?: DataDictionaryConfig
): DataDictionaryService {
  if (!serviceInstance && config) {
    serviceInstance = new DataDictionaryService(config);
  }

  if (!serviceInstance) {
    throw new Error('DataDictionaryService not initialized');
  }

  return serviceInstance;
}

export function initDataDictionaryService(
  config: DataDictionaryConfig
): DataDictionaryService {
  serviceInstance = new DataDictionaryService(config);
  return serviceInstance;
}

export function destroyDataDictionaryService(): void {
  if (serviceInstance) {
    serviceInstance.clearCache();
    serviceInstance = null;
  }
}
