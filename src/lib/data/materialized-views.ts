/**
 * Materialized Views Manager
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Features:
 * - Materialized view definitions
 * - Refresh strategies (incremental, full)
 * - Dependency management
 * - Performance monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type RefreshStrategy = 'full' | 'incremental' | 'on_commit' | 'on_demand';
export type ViewStatus = 'fresh' | 'stale' | 'refreshing' | 'error' | 'disabled';

export interface MaterializedViewConfig {
  name: string;
  description: string;
  sourceQuery: string;
  refreshStrategy: RefreshStrategy;
  refreshInterval: number; // seconds, 0 = manual only
  dependencies: string[]; // other views or tables
  indexes: IndexConfig[];
  partitionKey?: string;
  retentionDays?: number;
  enabled: boolean;
}

export interface IndexConfig {
  name: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique?: boolean;
  where?: string; // partial index condition
}

export interface MaterializedView extends MaterializedViewConfig {
  id: string;
  status: ViewStatus;
  lastRefreshedAt: Date | null;
  nextRefreshAt: Date | null;
  rowCount: number;
  sizeBytes: number;
  refreshDurationMs: number;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshResult {
  viewName: string;
  success: boolean;
  strategy: RefreshStrategy;
  rowsAffected: number;
  durationMs: number;
  error?: string;
  startedAt: Date;
  completedAt: Date;
}

export interface RefreshSchedule {
  viewName: string;
  nextRefresh: Date;
  priority: number;
}

// ============================================================================
// VIEW DEFINITIONS
// ============================================================================

/**
 * Pre-defined materialized views for common analytics
 */
export const MATERIALIZED_VIEW_DEFINITIONS: MaterializedViewConfig[] = [
  // Daily brand perception summary
  {
    name: 'mv_daily_brand_perception',
    description: 'Daily aggregated brand perception scores across all providers',
    sourceQuery: `
      SELECT
        DATE_TRUNC('day', created_at) as date,
        brand_id,
        provider_id,
        COUNT(*) as analysis_count,
        AVG(overall_score) as avg_score,
        MIN(overall_score) as min_score,
        MAX(overall_score) as max_score,
        STDDEV(overall_score) as stddev_score,
        AVG(confidence) as avg_confidence,
        SUM(cost_usd) as total_cost,
        AVG(latency_ms) as avg_latency
      FROM fact_brand_perception
      WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY DATE_TRUNC('day', created_at), brand_id, provider_id
    `,
    refreshStrategy: 'incremental',
    refreshInterval: 3600, // hourly
    dependencies: ['fact_brand_perception'],
    indexes: [
      { name: 'idx_mv_dbp_date_brand', columns: ['date', 'brand_id'], type: 'btree' },
      { name: 'idx_mv_dbp_provider', columns: ['provider_id'], type: 'btree' },
    ],
    enabled: true,
  },

  // Provider performance metrics
  {
    name: 'mv_provider_performance',
    description: 'Rolling 7-day provider performance metrics',
    sourceQuery: `
      SELECT
        provider_id,
        COUNT(*) as total_requests,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_requests,
        SUM(CASE WHEN success THEN 1 ELSE 0 END)::float / COUNT(*) as success_rate,
        AVG(latency_ms) as avg_latency_ms,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms) as p50_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95_latency,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99_latency,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost_usd) as total_cost
      FROM fact_api_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY provider_id
    `,
    refreshStrategy: 'full',
    refreshInterval: 900, // 15 minutes
    dependencies: ['fact_api_usage'],
    indexes: [
      { name: 'idx_mv_pp_provider', columns: ['provider_id'], type: 'btree', unique: true },
    ],
    enabled: true,
  },

  // User engagement funnel
  {
    name: 'mv_user_engagement_funnel',
    description: 'User engagement funnel metrics by cohort',
    sourceQuery: `
      WITH user_cohorts AS (
        SELECT
          user_id,
          DATE_TRUNC('week', created_at) as cohort_week,
          MIN(created_at) as first_activity
        FROM fact_user_engagement
        GROUP BY user_id, DATE_TRUNC('week', created_at)
      )
      SELECT
        cohort_week,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT CASE WHEN event_type = 'analysis_started' THEN user_id END) as started_analysis,
        COUNT(DISTINCT CASE WHEN event_type = 'analysis_completed' THEN user_id END) as completed_analysis,
        COUNT(DISTINCT CASE WHEN event_type = 'upgrade_viewed' THEN user_id END) as viewed_upgrade,
        COUNT(DISTINCT CASE WHEN event_type = 'upgrade_completed' THEN user_id END) as upgraded
      FROM fact_user_engagement fue
      JOIN user_cohorts uc ON fue.user_id = uc.user_id
      WHERE fue.created_at >= CURRENT_DATE - INTERVAL '90 days'
      GROUP BY cohort_week
    `,
    refreshStrategy: 'full',
    refreshInterval: 86400, // daily
    dependencies: ['fact_user_engagement'],
    indexes: [
      { name: 'idx_mv_uef_cohort', columns: ['cohort_week'], type: 'btree' },
    ],
    enabled: true,
  },

  // Industry benchmarks
  {
    name: 'mv_industry_benchmarks',
    description: 'Industry-level perception benchmarks',
    sourceQuery: `
      SELECT
        b.industry,
        COUNT(DISTINCT b.id) as brand_count,
        AVG(f.overall_score) as avg_industry_score,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY f.overall_score) as p25_score,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY f.overall_score) as p50_score,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY f.overall_score) as p75_score,
        STDDEV(f.overall_score) as score_stddev
      FROM fact_brand_perception f
      JOIN dim_brand b ON f.brand_id = b.id
      WHERE f.created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND b.industry IS NOT NULL
      GROUP BY b.industry
      HAVING COUNT(DISTINCT b.id) >= 5
    `,
    refreshStrategy: 'full',
    refreshInterval: 86400, // daily
    dependencies: ['fact_brand_perception', 'dim_brand'],
    indexes: [
      { name: 'idx_mv_ib_industry', columns: ['industry'], type: 'btree', unique: true },
    ],
    enabled: true,
  },

  // Cost analytics
  {
    name: 'mv_cost_analytics',
    description: 'Cost breakdown by provider, model, and time',
    sourceQuery: `
      SELECT
        DATE_TRUNC('day', created_at) as date,
        provider_id,
        model_id,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(cost_usd) as total_cost,
        AVG(cost_usd) as avg_cost_per_request,
        SUM(cost_usd) / NULLIF(SUM(input_tokens + output_tokens), 0) * 1000 as cost_per_1k_tokens
      FROM fact_api_usage
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at), provider_id, model_id
    `,
    refreshStrategy: 'incremental',
    refreshInterval: 3600, // hourly
    dependencies: ['fact_api_usage'],
    indexes: [
      { name: 'idx_mv_ca_date', columns: ['date'], type: 'btree' },
      { name: 'idx_mv_ca_provider_model', columns: ['provider_id', 'model_id'], type: 'btree' },
    ],
    enabled: true,
  },

  // Score trends
  {
    name: 'mv_score_trends',
    description: 'Brand score trends over time with moving averages',
    sourceQuery: `
      WITH daily_scores AS (
        SELECT
          brand_id,
          DATE_TRUNC('day', created_at) as date,
          AVG(overall_score) as daily_avg_score
        FROM fact_brand_perception
        WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY brand_id, DATE_TRUNC('day', created_at)
      )
      SELECT
        brand_id,
        date,
        daily_avg_score,
        AVG(daily_avg_score) OVER (
          PARTITION BY brand_id
          ORDER BY date
          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as ma_7d,
        AVG(daily_avg_score) OVER (
          PARTITION BY brand_id
          ORDER BY date
          ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) as ma_30d,
        daily_avg_score - LAG(daily_avg_score, 1) OVER (
          PARTITION BY brand_id ORDER BY date
        ) as daily_change,
        daily_avg_score - LAG(daily_avg_score, 7) OVER (
          PARTITION BY brand_id ORDER BY date
        ) as weekly_change
      FROM daily_scores
    `,
    refreshStrategy: 'full',
    refreshInterval: 86400, // daily
    dependencies: ['fact_brand_perception'],
    indexes: [
      { name: 'idx_mv_st_brand_date', columns: ['brand_id', 'date'], type: 'btree' },
    ],
    enabled: true,
  },
];

// ============================================================================
// MATERIALIZED VIEW MANAGER
// ============================================================================

export class MaterializedViewManager {
  private views: Map<string, MaterializedView> = new Map();
  private refreshHistory: RefreshResult[] = [];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Initialize with default view definitions
    for (const config of MATERIALIZED_VIEW_DEFINITIONS) {
      this.registerView(config);
    }
  }

  /**
   * Generate view ID
   */
  private generateId(): string {
    return `mv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Register a new materialized view
   */
  registerView(config: MaterializedViewConfig): MaterializedView {
    const view: MaterializedView = {
      ...config,
      id: this.generateId(),
      status: 'stale',
      lastRefreshedAt: null,
      nextRefreshAt: config.refreshInterval > 0
        ? new Date(Date.now() + config.refreshInterval * 1000)
        : null,
      rowCount: 0,
      sizeBytes: 0,
      refreshDurationMs: 0,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.views.set(config.name, view);
    return view;
  }

  /**
   * Get view by name
   */
  getView(name: string): MaterializedView | undefined {
    return this.views.get(name);
  }

  /**
   * Get all views
   */
  getAllViews(): MaterializedView[] {
    return [...this.views.values()];
  }

  /**
   * Get views by status
   */
  getViewsByStatus(status: ViewStatus): MaterializedView[] {
    return [...this.views.values()].filter(v => v.status === status);
  }

  /**
   * Generate CREATE MATERIALIZED VIEW SQL
   */
  generateCreateSQL(viewName: string): string {
    const view = this.views.get(viewName);
    if (!view) throw new Error(`View not found: ${viewName}`);

    let sql = `-- Materialized View: ${view.name}\n`;
    sql += `-- ${view.description}\n`;
    sql += `-- Refresh Strategy: ${view.refreshStrategy}\n\n`;

    sql += `DROP MATERIALIZED VIEW IF EXISTS ${view.name} CASCADE;\n\n`;

    sql += `CREATE MATERIALIZED VIEW ${view.name} AS\n`;
    sql += view.sourceQuery.trim();
    sql += ';\n\n';

    // Create indexes
    for (const index of view.indexes) {
      sql += `CREATE ${index.unique ? 'UNIQUE ' : ''}INDEX ${index.name}\n`;
      sql += `  ON ${view.name} USING ${index.type} (${index.columns.join(', ')})`;
      if (index.where) {
        sql += `\n  WHERE ${index.where}`;
      }
      sql += ';\n';
    }

    return sql;
  }

  /**
   * Generate REFRESH SQL
   */
  generateRefreshSQL(viewName: string): string {
    const view = this.views.get(viewName);
    if (!view) throw new Error(`View not found: ${viewName}`);

    if (view.refreshStrategy === 'incremental') {
      // For incremental, we'd need to track changes
      // This is a simplified version
      return `REFRESH MATERIALIZED VIEW CONCURRENTLY ${view.name};`;
    }

    return `REFRESH MATERIALIZED VIEW ${view.name};`;
  }

  /**
   * Simulate view refresh (in production would execute SQL)
   */
  async refreshView(viewName: string): Promise<RefreshResult> {
    const view = this.views.get(viewName);
    if (!view) {
      return {
        viewName,
        success: false,
        strategy: 'full',
        rowsAffected: 0,
        durationMs: 0,
        error: 'View not found',
        startedAt: new Date(),
        completedAt: new Date(),
      };
    }

    const startedAt = new Date();
    view.status = 'refreshing';

    try {
      // Simulate refresh duration based on complexity
      const simulatedDuration = Math.random() * 2000 + 500;
      await new Promise(resolve => setTimeout(resolve, simulatedDuration));

      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

      // Update view metadata
      view.status = 'fresh';
      view.lastRefreshedAt = completedAt;
      view.nextRefreshAt = view.refreshInterval > 0
        ? new Date(completedAt.getTime() + view.refreshInterval * 1000)
        : null;
      view.refreshDurationMs = durationMs;
      view.rowCount = Math.floor(Math.random() * 10000) + 100;
      view.sizeBytes = view.rowCount * 200;
      view.errorMessage = null;
      view.updatedAt = completedAt;

      const result: RefreshResult = {
        viewName,
        success: true,
        strategy: view.refreshStrategy,
        rowsAffected: view.rowCount,
        durationMs,
        startedAt,
        completedAt,
      };

      this.refreshHistory.push(result);
      return result;
    } catch (error) {
      const completedAt = new Date();
      const errorMessage = error instanceof Error ? error.message : String(error);

      view.status = 'error';
      view.errorMessage = errorMessage;
      view.updatedAt = completedAt;

      const result: RefreshResult = {
        viewName,
        success: false,
        strategy: view.refreshStrategy,
        rowsAffected: 0,
        durationMs: completedAt.getTime() - startedAt.getTime(),
        error: errorMessage,
        startedAt,
        completedAt,
      };

      this.refreshHistory.push(result);
      return result;
    }
  }

  /**
   * Refresh all stale views
   */
  async refreshStaleViews(): Promise<RefreshResult[]> {
    const staleViews = this.getViewsByStatus('stale').filter(v => v.enabled);
    const results: RefreshResult[] = [];

    for (const view of staleViews) {
      const result = await this.refreshView(view.name);
      results.push(result);
    }

    return results;
  }

  /**
   * Refresh views due for refresh
   */
  async refreshDueViews(): Promise<RefreshResult[]> {
    const now = new Date();
    const dueViews = [...this.views.values()].filter(v =>
      v.enabled &&
      v.nextRefreshAt !== null &&
      v.nextRefreshAt <= now &&
      v.status !== 'refreshing'
    );

    const results: RefreshResult[] = [];
    for (const view of dueViews) {
      const result = await this.refreshView(view.name);
      results.push(result);
    }

    return results;
  }

  /**
   * Get refresh schedule
   */
  getRefreshSchedule(): RefreshSchedule[] {
    return [...this.views.values()]
      .filter(v => v.enabled && v.nextRefreshAt !== null)
      .map(v => ({
        viewName: v.name,
        nextRefresh: v.nextRefreshAt!,
        priority: v.refreshInterval > 0 ? 1 / v.refreshInterval : 0,
      }))
      .sort((a, b) => a.nextRefresh.getTime() - b.nextRefresh.getTime());
  }

  /**
   * Get refresh history
   */
  getRefreshHistory(limit: number = 50): RefreshResult[] {
    return this.refreshHistory.slice(-limit);
  }

  /**
   * Get view dependencies
   */
  getViewDependencies(viewName: string): string[] {
    const view = this.views.get(viewName);
    if (!view) return [];
    return view.dependencies;
  }

  /**
   * Get views that depend on a table/view
   */
  getDependentViews(tableName: string): MaterializedView[] {
    return [...this.views.values()].filter(v =>
      v.dependencies.includes(tableName)
    );
  }

  /**
   * Get refresh order based on dependencies
   */
  getRefreshOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();

    const visit = (viewName: string) => {
      if (visited.has(viewName)) return;
      visited.add(viewName);

      const view = this.views.get(viewName);
      if (!view) return;

      // Visit dependencies first
      for (const dep of view.dependencies) {
        if (this.views.has(dep)) {
          visit(dep);
        }
      }

      order.push(viewName);
    };

    for (const viewName of this.views.keys()) {
      visit(viewName);
    }

    return order;
  }

  /**
   * Enable/disable view
   */
  setViewEnabled(viewName: string, enabled: boolean): void {
    const view = this.views.get(viewName);
    if (view) {
      view.enabled = enabled;
      if (!enabled) {
        view.status = 'disabled';
      } else if (view.status === 'disabled') {
        view.status = 'stale';
      }
      view.updatedAt = new Date();
    }
  }

  /**
   * Start automatic refresh scheduler
   */
  startScheduler(intervalMs: number = 60000): void {
    if (this.refreshInterval) return;

    this.refreshInterval = setInterval(async () => {
      await this.refreshDueViews();
    }, intervalMs);
  }

  /**
   * Stop automatic refresh scheduler
   */
  stopScheduler(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Get view statistics
   */
  getStats(): {
    totalViews: number;
    enabledViews: number;
    freshViews: number;
    staleViews: number;
    errorViews: number;
    totalSizeBytes: number;
    avgRefreshDurationMs: number;
    lastRefresh: Date | null;
  } {
    const views = [...this.views.values()];
    const enabledViews = views.filter(v => v.enabled);

    const lastRefreshTimes = views
      .filter(v => v.lastRefreshedAt !== null)
      .map(v => v.lastRefreshedAt!.getTime());

    return {
      totalViews: views.length,
      enabledViews: enabledViews.length,
      freshViews: views.filter(v => v.status === 'fresh').length,
      staleViews: views.filter(v => v.status === 'stale').length,
      errorViews: views.filter(v => v.status === 'error').length,
      totalSizeBytes: views.reduce((sum, v) => sum + v.sizeBytes, 0),
      avgRefreshDurationMs: views.length > 0
        ? views.reduce((sum, v) => sum + v.refreshDurationMs, 0) / views.length
        : 0,
      lastRefresh: lastRefreshTimes.length > 0
        ? new Date(Math.max(...lastRefreshTimes))
        : null,
    };
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultManager: MaterializedViewManager | null = null;

/**
 * Get default manager
 */
export function getDefaultManager(): MaterializedViewManager {
  if (!defaultManager) {
    defaultManager = new MaterializedViewManager();
  }
  return defaultManager;
}

/**
 * Reset manager (for testing)
 */
export function resetManager(): void {
  if (defaultManager) {
    defaultManager.stopScheduler();
    defaultManager = null;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  MaterializedViewManager,
  MATERIALIZED_VIEW_DEFINITIONS,
  getDefaultManager,
  resetManager,
};
