/**
 * A/B Testing Service for Prompt Experiments
 *
 * Provides functionality for:
 * - Managing experiment lifecycle
 * - Assigning users to variants
 * - Recording experiment events
 * - Computing statistical significance
 *
 * @module lib/experiments/ab-test
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Experiment status enum matching database
 */
export type ExperimentStatus =
  | 'draft'
  | 'running'
  | 'paused'
  | 'concluded'
  | 'cancelled';

/**
 * Configuration for a single variant
 */
export interface VariantConfig {
  /** Unique identifier for the variant */
  id: string;
  /** Human-readable name */
  name: string;
  /** Prompt version string (e.g., "v1.0", "v2.0-beta") */
  prompt_version: string;
  /** Percentage of traffic (0-100) */
  traffic_pct: number;
  /** Optional variant-specific configuration */
  config?: Record<string, unknown>;
}

/**
 * Guardrail metric configuration
 */
export interface GuardrailMetric {
  /** Maximum allowed value */
  max?: number;
  /** Minimum allowed value */
  min?: number;
}

/**
 * Targeting rules for experiment eligibility
 */
export interface TargetingRules {
  /** Allowed industries */
  industries?: string[];
  /** Allowed subscription tiers */
  tiers?: string[];
  /** Allowed user segments */
  segments?: string[];
  /** Minimum number of analyses */
  min_analyses?: number;
  /** Geographic regions */
  regions?: string[];
}

/**
 * Full experiment configuration
 */
export interface Experiment {
  id: string;
  name: string;
  description?: string;
  hypothesis?: string;
  status: ExperimentStatus;
  prompt_type: string;
  variants: VariantConfig[];
  primary_metric: string;
  secondary_metrics: string[];
  guardrail_metrics: Record<string, GuardrailMetric>;
  min_sample_size: number;
  significance_threshold: number;
  min_detectable_effect?: number;
  traffic_percentage: number;
  targeting_rules: TargetingRules;
  started_at?: string;
  concluded_at?: string;
  scheduled_end_at?: string;
  result?: ExperimentResult;
  conclusion_notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Experiment result data
 */
export interface ExperimentResult {
  /** Winning variant ID */
  winner?: string;
  /** Lift in primary metric */
  lift?: number;
  /** Confidence level (0-1) */
  confidence?: number;
  /** Metrics per variant */
  metrics?: Record<string, VariantMetrics>;
  /** Whether guardrails were violated */
  guardrail_violations?: string[];
}

/**
 * Metrics for a single variant
 */
export interface VariantMetrics {
  assignments: number;
  impressions: number;
  clicks: number;
  thumbs_up: number;
  thumbs_down: number;
  conversions: number;
  avg_satisfaction?: number;
  avg_latency?: number;
  thumbs_up_rate?: number;
  click_rate?: number;
}

/**
 * Assignment record
 */
export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  user_id?: string;
  analysis_id?: string;
  session_id?: string;
  variant_id: string;
  assigned_at: string;
  context: Record<string, unknown>;
}

/**
 * Event record
 */
export interface ExperimentEvent {
  id: string;
  experiment_id: string;
  assignment_id: string;
  analysis_id?: string;
  event_type: string;
  event_value?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Context for experiment assignment
 */
export interface AssignmentContext {
  industry?: string;
  tier?: string;
  user_segment?: string;
  region?: string;
  analysis_count?: number;
  [key: string]: unknown;
}

/**
 * Options for creating an experiment
 */
export interface CreateExperimentOptions {
  name: string;
  description?: string;
  hypothesis?: string;
  prompt_type: string;
  variants: VariantConfig[];
  primary_metric: string;
  secondary_metrics?: string[];
  guardrail_metrics?: Record<string, GuardrailMetric>;
  min_sample_size?: number;
  significance_threshold?: number;
  min_detectable_effect?: number;
  traffic_percentage?: number;
  targeting_rules?: TargetingRules;
  scheduled_end_at?: string;
  created_by?: string;
}

/**
 * Configuration for the AB test service
 */
export interface ABTestServiceConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default minimum sample size per variant */
export const DEFAULT_MIN_SAMPLE_SIZE = 100;

/** Default significance threshold (95%) */
export const DEFAULT_SIGNIFICANCE_THRESHOLD = 0.95;

/** Default traffic percentage */
export const DEFAULT_TRAFFIC_PERCENTAGE = 100;

/** Cache TTL (5 minutes) */
export const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

/** Standard event types */
export const EVENT_TYPES = {
  IMPRESSION: 'impression',
  CLICK: 'click',
  THUMBS_UP: 'thumbs_up',
  THUMBS_DOWN: 'thumbs_down',
  CONVERSION: 'conversion',
  SATISFACTION: 'satisfaction',
  LATENCY: 'latency',
  ERROR: 'error',
} as const;

/** Standard prompt types */
export const PROMPT_TYPES = {
  RECOMMENDATION: 'recommendation',
  ANALYSIS: 'analysis',
  COMPETITOR: 'competitor',
  PERCEPTION: 'perception',
  SUMMARY: 'summary',
} as const;

// ============================================================================
// SERVICE CLASS
// ============================================================================

/**
 * A/B Testing Service
 *
 * Handles experiment management, variant assignment, and event tracking.
 */
export class ABTestService {
  private supabase: SupabaseClient;
  private debug: boolean;
  private cacheTtlMs: number;

  // In-memory cache for running experiments
  private experimentCache: Map<
    string,
    { experiment: Experiment; cachedAt: number }
  > = new Map();

  // Assignment cache to prevent re-assignment
  private assignmentCache: Map<string, string> = new Map();

  constructor(config: ABTestServiceConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.debug = config.debug ?? false;
    this.cacheTtlMs = config.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  // --------------------------------------------------------------------------
  // EXPERIMENT MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Create a new experiment
   */
  async createExperiment(
    options: CreateExperimentOptions
  ): Promise<Experiment> {
    this.log('Creating experiment:', options.name);

    // Validate variants
    this.validateVariants(options.variants);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .insert({
        name: options.name,
        description: options.description,
        hypothesis: options.hypothesis,
        status: 'draft' as ExperimentStatus,
        prompt_type: options.prompt_type,
        variants: options.variants,
        primary_metric: options.primary_metric,
        secondary_metrics: options.secondary_metrics ?? [],
        guardrail_metrics: options.guardrail_metrics ?? {},
        min_sample_size: options.min_sample_size ?? DEFAULT_MIN_SAMPLE_SIZE,
        significance_threshold:
          options.significance_threshold ?? DEFAULT_SIGNIFICANCE_THRESHOLD,
        min_detectable_effect: options.min_detectable_effect,
        traffic_percentage:
          options.traffic_percentage ?? DEFAULT_TRAFFIC_PERCENTAGE,
        targeting_rules: options.targeting_rules ?? {},
        scheduled_end_at: options.scheduled_end_at,
        created_by: options.created_by,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create experiment: ${error.message}`);
    }

    return data as Experiment;
  }

  /**
   * Start an experiment (change status to running)
   */
  async startExperiment(experimentId: string): Promise<Experiment> {
    this.log('Starting experiment:', experimentId);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .update({
        status: 'running' as ExperimentStatus,
        started_at: new Date().toISOString(),
      })
      .eq('id', experimentId)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to start experiment: ${error.message}`);
    }

    // Invalidate cache
    this.experimentCache.delete(experimentId);

    return data as Experiment;
  }

  /**
   * Pause an experiment
   */
  async pauseExperiment(experimentId: string): Promise<Experiment> {
    this.log('Pausing experiment:', experimentId);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .update({ status: 'paused' as ExperimentStatus })
      .eq('id', experimentId)
      .eq('status', 'running')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to pause experiment: ${error.message}`);
    }

    this.experimentCache.delete(experimentId);
    return data as Experiment;
  }

  /**
   * Resume a paused experiment
   */
  async resumeExperiment(experimentId: string): Promise<Experiment> {
    this.log('Resuming experiment:', experimentId);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .update({ status: 'running' as ExperimentStatus })
      .eq('id', experimentId)
      .eq('status', 'paused')
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resume experiment: ${error.message}`);
    }

    this.experimentCache.delete(experimentId);
    return data as Experiment;
  }

  /**
   * Conclude an experiment with results
   */
  async concludeExperiment(
    experimentId: string,
    result: ExperimentResult,
    notes?: string
  ): Promise<Experiment> {
    this.log('Concluding experiment:', experimentId, result);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .update({
        status: 'concluded' as ExperimentStatus,
        concluded_at: new Date().toISOString(),
        result,
        conclusion_notes: notes,
      })
      .eq('id', experimentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to conclude experiment: ${error.message}`);
    }

    this.experimentCache.delete(experimentId);
    return data as Experiment;
  }

  /**
   * Cancel an experiment
   */
  async cancelExperiment(
    experimentId: string,
    reason?: string
  ): Promise<Experiment> {
    this.log('Cancelling experiment:', experimentId);

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .update({
        status: 'cancelled' as ExperimentStatus,
        concluded_at: new Date().toISOString(),
        conclusion_notes: reason,
      })
      .eq('id', experimentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to cancel experiment: ${error.message}`);
    }

    this.experimentCache.delete(experimentId);
    return data as Experiment;
  }

  /**
   * Get an experiment by ID
   */
  async getExperiment(experimentId: string): Promise<Experiment | null> {
    // Check cache first
    const cached = this.experimentCache.get(experimentId);
    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      return cached.experiment;
    }

    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .select()
      .eq('id', experimentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get experiment: ${error.message}`);
    }

    const experiment = data as Experiment;

    // Cache if running
    if (experiment.status === 'running') {
      this.experimentCache.set(experimentId, {
        experiment,
        cachedAt: Date.now(),
      });
    }

    return experiment;
  }

  /**
   * Get running experiments for a prompt type
   */
  async getRunningExperiments(promptType: string): Promise<Experiment[]> {
    const { data, error } = await this.supabase
      .from('prompt_experiments')
      .select()
      .eq('status', 'running')
      .eq('prompt_type', promptType);

    if (error) {
      throw new Error(`Failed to get running experiments: ${error.message}`);
    }

    return (data ?? []) as Experiment[];
  }

  /**
   * List all experiments with optional filters
   */
  async listExperiments(filters?: {
    status?: ExperimentStatus;
    prompt_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Experiment[]> {
    let query = this.supabase
      .from('prompt_experiments')
      .select()
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.prompt_type) {
      query = query.eq('prompt_type', filters.prompt_type);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit ?? 10) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list experiments: ${error.message}`);
    }

    return (data ?? []) as Experiment[];
  }

  // --------------------------------------------------------------------------
  // VARIANT ASSIGNMENT
  // --------------------------------------------------------------------------

  /**
   * Get or create variant assignment for a user/session
   */
  async getOrCreateAssignment(
    experimentId: string,
    userId?: string,
    sessionId?: string,
    context: AssignmentContext = {}
  ): Promise<string | null> {
    if (!userId && !sessionId) {
      throw new Error('Either userId or sessionId must be provided');
    }

    // Check local cache first
    const cacheKey = `${experimentId}:${userId ?? sessionId}`;
    const cachedVariant = this.assignmentCache.get(cacheKey);
    if (cachedVariant) {
      return cachedVariant;
    }

    // Call database function
    const { data, error } = await this.supabase.rpc(
      'fn_get_or_create_experiment_assignment',
      {
        p_experiment_id: experimentId,
        p_user_id: userId ?? null,
        p_session_id: sessionId ?? null,
        p_context: context,
      }
    );

    if (error) {
      this.log('Assignment error:', error);
      return null;
    }

    const variantId = data as string | null;

    // Cache the assignment
    if (variantId) {
      this.assignmentCache.set(cacheKey, variantId);
    }

    return variantId;
  }

  /**
   * Get assignment for a specific prompt type
   * Automatically finds the running experiment and assigns variant
   */
  async getVariantForPromptType(
    promptType: string,
    userId?: string,
    sessionId?: string,
    context: AssignmentContext = {}
  ): Promise<{
    experimentId: string;
    variantId: string;
    promptVersion: string;
    config?: Record<string, unknown>;
  } | null> {
    // Get running experiments for this prompt type
    const experiments = await this.getRunningExperiments(promptType);

    if (experiments.length === 0) {
      return null;
    }

    // Use the first running experiment (in a real system, you might have priority rules)
    const experiment = experiments[0];

    // Check targeting rules
    if (!this.matchesTargeting(experiment.targeting_rules, context)) {
      return null;
    }

    // Get variant assignment
    const variantId = await this.getOrCreateAssignment(
      experiment.id,
      userId,
      sessionId,
      context
    );

    if (!variantId) {
      return null;
    }

    // Find variant config
    const variant = experiment.variants.find((v) => v.id === variantId);
    if (!variant) {
      return null;
    }

    return {
      experimentId: experiment.id,
      variantId: variant.id,
      promptVersion: variant.prompt_version,
      config: variant.config,
    };
  }

  /**
   * Get existing assignment for a user
   */
  async getAssignment(
    experimentId: string,
    userId: string
  ): Promise<ExperimentAssignment | null> {
    const { data, error } = await this.supabase
      .from('experiment_assignments')
      .select()
      .eq('experiment_id', experimentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get assignment: ${error.message}`);
    }

    return data as ExperimentAssignment;
  }

  // --------------------------------------------------------------------------
  // EVENT TRACKING
  // --------------------------------------------------------------------------

  /**
   * Record an experiment event
   */
  async recordEvent(
    experimentId: string,
    userId: string,
    eventType: string,
    eventValue?: number,
    analysisId?: string,
    metadata: Record<string, unknown> = {}
  ): Promise<string | null> {
    const { data, error } = await this.supabase.rpc(
      'fn_record_experiment_event',
      {
        p_experiment_id: experimentId,
        p_user_id: userId,
        p_event_type: eventType,
        p_event_value: eventValue ?? null,
        p_analysis_id: analysisId ?? null,
        p_metadata: metadata,
      }
    );

    if (error) {
      this.log('Event recording error:', error);
      return null;
    }

    return data as string | null;
  }

  /**
   * Record an impression event
   */
  async recordImpression(
    experimentId: string,
    userId: string,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.IMPRESSION,
      undefined,
      analysisId,
      metadata
    );
  }

  /**
   * Record a click event
   */
  async recordClick(
    experimentId: string,
    userId: string,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.CLICK,
      undefined,
      analysisId,
      metadata
    );
  }

  /**
   * Record a thumbs up event
   */
  async recordThumbsUp(
    experimentId: string,
    userId: string,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.THUMBS_UP,
      undefined,
      analysisId,
      metadata
    );
  }

  /**
   * Record a thumbs down event
   */
  async recordThumbsDown(
    experimentId: string,
    userId: string,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.THUMBS_DOWN,
      undefined,
      analysisId,
      metadata
    );
  }

  /**
   * Record a conversion event
   */
  async recordConversion(
    experimentId: string,
    userId: string,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.CONVERSION,
      undefined,
      analysisId,
      metadata
    );
  }

  /**
   * Record latency event
   */
  async recordLatency(
    experimentId: string,
    userId: string,
    latencyMs: number,
    analysisId?: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.recordEvent(
      experimentId,
      userId,
      EVENT_TYPES.LATENCY,
      latencyMs,
      analysisId,
      metadata
    );
  }

  // --------------------------------------------------------------------------
  // ANALYTICS
  // --------------------------------------------------------------------------

  /**
   * Get experiment summary with metrics
   */
  async getExperimentSummary(experimentId: string): Promise<{
    experiment: Experiment;
    totalAssignments: number;
    controlAssignments: number;
    treatmentAssignments: number;
    totalEvents: number;
  } | null> {
    const { data, error } = await this.supabase
      .from('vw_experiment_summary')
      .select()
      .eq('id', experimentId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get experiment summary: ${error.message}`);
    }

    return {
      experiment: data as Experiment,
      totalAssignments: data.total_assignments ?? 0,
      controlAssignments: data.control_assignments ?? 0,
      treatmentAssignments: data.treatment_assignments ?? 0,
      totalEvents: data.total_events ?? 0,
    };
  }

  /**
   * Get variant metrics for an experiment
   */
  async getVariantMetrics(
    experimentId: string
  ): Promise<Record<string, VariantMetrics>> {
    const { data, error } = await this.supabase
      .from('vw_variant_metrics')
      .select()
      .eq('experiment_id', experimentId);

    if (error) {
      throw new Error(`Failed to get variant metrics: ${error.message}`);
    }

    const result: Record<string, VariantMetrics> = {};

    for (const row of data ?? []) {
      result[row.variant_id] = {
        assignments: row.assignments ?? 0,
        impressions: row.impressions ?? 0,
        clicks: row.clicks ?? 0,
        thumbs_up: row.thumbs_up ?? 0,
        thumbs_down: row.thumbs_down ?? 0,
        conversions: row.conversions ?? 0,
        avg_satisfaction: row.avg_satisfaction,
        avg_latency: row.avg_latency,
        thumbs_up_rate: row.thumbs_up_rate,
        click_rate: row.click_rate,
      };
    }

    return result;
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------

  /**
   * Validate variant configuration
   */
  private validateVariants(variants: VariantConfig[]): void {
    if (variants.length < 2) {
      throw new Error('At least 2 variants are required');
    }

    const totalTraffic = variants.reduce((sum, v) => sum + v.traffic_pct, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error(`Variant traffic must sum to 100%, got ${totalTraffic}%`);
    }

    const ids = new Set<string>();
    for (const variant of variants) {
      if (ids.has(variant.id)) {
        throw new Error(`Duplicate variant ID: ${variant.id}`);
      }
      ids.add(variant.id);

      if (variant.traffic_pct < 0 || variant.traffic_pct > 100) {
        throw new Error(
          `Invalid traffic percentage for ${variant.id}: ${variant.traffic_pct}`
        );
      }
    }
  }

  /**
   * Check if context matches targeting rules
   */
  private matchesTargeting(
    rules: TargetingRules,
    context: AssignmentContext
  ): boolean {
    // If no rules, everyone matches
    if (!rules || Object.keys(rules).length === 0) {
      return true;
    }

    // Check industry
    if (
      rules.industries &&
      rules.industries.length > 0 &&
      context.industry &&
      !rules.industries.includes(context.industry)
    ) {
      return false;
    }

    // Check tier
    if (
      rules.tiers &&
      rules.tiers.length > 0 &&
      context.tier &&
      !rules.tiers.includes(context.tier)
    ) {
      return false;
    }

    // Check segment
    if (
      rules.segments &&
      rules.segments.length > 0 &&
      context.user_segment &&
      !rules.segments.includes(context.user_segment)
    ) {
      return false;
    }

    // Check region
    if (
      rules.regions &&
      rules.regions.length > 0 &&
      context.region &&
      !rules.regions.includes(context.region)
    ) {
      return false;
    }

    // Check minimum analyses
    if (
      rules.min_analyses !== undefined &&
      (context.analysis_count ?? 0) < rules.min_analyses
    ) {
      return false;
    }

    return true;
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[ABTestService]', ...args);
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.experimentCache.clear();
    this.assignmentCache.clear();
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

let serviceInstance: ABTestService | null = null;

/**
 * Create or get the AB test service instance
 */
export function getABTestService(
  config?: ABTestServiceConfig
): ABTestService {
  if (!serviceInstance && config) {
    serviceInstance = new ABTestService(config);
  }

  if (!serviceInstance) {
    throw new Error(
      'ABTestService not initialized. Call with config first.'
    );
  }

  return serviceInstance;
}

/**
 * Initialize the AB test service
 */
export function initABTestService(config: ABTestServiceConfig): ABTestService {
  serviceInstance = new ABTestService(config);
  return serviceInstance;
}

/**
 * Destroy the AB test service instance
 */
export function destroyABTestService(): void {
  if (serviceInstance) {
    serviceInstance.clearCache();
    serviceInstance = null;
  }
}
