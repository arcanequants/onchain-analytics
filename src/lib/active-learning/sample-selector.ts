/**
 * Active Learning Sample Selector
 *
 * Implements strategies for selecting the most informative samples
 * for human labeling to maximize model improvement.
 *
 * Strategies:
 * - Uncertainty Sampling: Select samples where model is least confident
 * - Diversity Sampling: Select samples that cover different regions
 * - Error-Based: Select samples similar to previous errors
 * - Hybrid: Combine multiple strategies
 *
 * @module lib/active-learning/sample-selector
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Selection strategy type
 */
export type SelectionStrategy =
  | 'uncertainty'
  | 'diversity'
  | 'error_based'
  | 'hybrid'
  | 'random';

/**
 * Sample candidate for labeling
 */
export interface SampleCandidate {
  /** Unique identifier */
  id: string;
  /** Type of sample (analysis, recommendation, etc.) */
  type: string;
  /** Reference to source entity */
  sourceId: string;
  /** The content/prompt to be labeled */
  content: string;
  /** AI-generated output */
  aiOutput: unknown;
  /** Model confidence score (0-1) */
  confidence: number;
  /** Computed priority score for selection */
  priorityScore: number;
  /** Features used for diversity calculation */
  features: Record<string, number | string>;
  /** Metadata */
  metadata: Record<string, unknown>;
  /** When the sample was created */
  createdAt: string;
}

/**
 * Labeled sample (feedback provided)
 */
export interface LabeledSample extends SampleCandidate {
  /** Human-provided label */
  label: unknown;
  /** Label quality score */
  labelQuality: number;
  /** Labeler information */
  labeledBy: string;
  /** When labeled */
  labeledAt: string;
  /** Time spent labeling (ms) */
  labelingDurationMs: number;
}

/**
 * Selection batch result
 */
export interface SelectionBatch {
  /** Batch identifier */
  batchId: string;
  /** Strategy used */
  strategy: SelectionStrategy;
  /** Selected samples */
  samples: SampleCandidate[];
  /** Statistics about selection */
  stats: {
    totalCandidates: number;
    selectedCount: number;
    avgConfidence: number;
    avgPriorityScore: number;
    diversityScore: number;
  };
  /** When batch was created */
  createdAt: string;
}

/**
 * Configuration for sample selector
 */
export interface SampleSelectorConfig {
  supabaseUrl: string;
  supabaseKey: string;
  /** Default batch size */
  defaultBatchSize?: number;
  /** Minimum confidence threshold for uncertainty sampling */
  uncertaintyThreshold?: number;
  /** Weight for uncertainty in hybrid strategy */
  uncertaintyWeight?: number;
  /** Weight for diversity in hybrid strategy */
  diversityWeight?: number;
  /** Weight for error similarity in hybrid strategy */
  errorWeight?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Query parameters for selection
 */
export interface SelectionQuery {
  /** Sample type filter */
  type?: string;
  /** Maximum samples to select */
  limit?: number;
  /** Selection strategy */
  strategy?: SelectionStrategy;
  /** Minimum creation date */
  minDate?: string;
  /** Maximum creation date */
  maxDate?: string;
  /** Industry filter */
  industry?: string;
  /** Exclude already labeled */
  excludeLabeled?: boolean;
  /** Custom filters */
  filters?: Record<string, unknown>;
}

/**
 * Diversity cluster
 */
interface DiversityCluster {
  centroid: number[];
  samples: SampleCandidate[];
  avgConfidence: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default batch size */
export const DEFAULT_BATCH_SIZE = 20;

/** Default uncertainty threshold */
export const DEFAULT_UNCERTAINTY_THRESHOLD = 0.7;

/** Default strategy weights */
export const DEFAULT_WEIGHTS = {
  uncertainty: 0.4,
  diversity: 0.3,
  error: 0.3,
};

/** Feature types for diversity */
export const DIVERSITY_FEATURES = [
  'industry',
  'company_size',
  'score_range',
  'recommendation_type',
  'analysis_depth',
] as const;

// ============================================================================
// SAMPLE SELECTOR CLASS
// ============================================================================

/**
 * Active Learning Sample Selector
 */
export class SampleSelector {
  private supabase: SupabaseClient;
  private config: Required<
    Omit<SampleSelectorConfig, 'supabaseUrl' | 'supabaseKey'>
  >;

  constructor(config: SampleSelectorConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);

    this.config = {
      defaultBatchSize: config.defaultBatchSize ?? DEFAULT_BATCH_SIZE,
      uncertaintyThreshold:
        config.uncertaintyThreshold ?? DEFAULT_UNCERTAINTY_THRESHOLD,
      uncertaintyWeight: config.uncertaintyWeight ?? DEFAULT_WEIGHTS.uncertainty,
      diversityWeight: config.diversityWeight ?? DEFAULT_WEIGHTS.diversity,
      errorWeight: config.errorWeight ?? DEFAULT_WEIGHTS.error,
      debug: config.debug ?? false,
    };
  }

  // --------------------------------------------------------------------------
  // SELECTION METHODS
  // --------------------------------------------------------------------------

  /**
   * Select samples for labeling using specified strategy
   */
  async selectSamples(query: SelectionQuery = {}): Promise<SelectionBatch> {
    const strategy = query.strategy ?? 'hybrid';
    const limit = query.limit ?? this.config.defaultBatchSize;

    this.log(`Selecting ${limit} samples using ${strategy} strategy`);

    // Get candidate samples
    const candidates = await this.getCandidates(query);

    if (candidates.length === 0) {
      return this.createEmptyBatch(strategy);
    }

    // Apply selection strategy
    let selected: SampleCandidate[];

    switch (strategy) {
      case 'uncertainty':
        selected = this.selectByUncertainty(candidates, limit);
        break;
      case 'diversity':
        selected = this.selectByDiversity(candidates, limit);
        break;
      case 'error_based':
        selected = await this.selectByErrorSimilarity(candidates, limit);
        break;
      case 'hybrid':
        selected = await this.selectHybrid(candidates, limit);
        break;
      case 'random':
        selected = this.selectRandom(candidates, limit);
        break;
      default:
        selected = this.selectRandom(candidates, limit);
    }

    // Create batch
    return this.createBatch(strategy, selected, candidates.length);
  }

  /**
   * Select samples with highest uncertainty
   */
  selectByUncertainty(
    candidates: SampleCandidate[],
    limit: number
  ): SampleCandidate[] {
    // Sort by confidence ascending (lowest confidence = highest uncertainty)
    const sorted = [...candidates].sort(
      (a, b) => a.confidence - b.confidence
    );

    // Filter by threshold and take top N
    const filtered = sorted.filter(
      (s) => s.confidence <= this.config.uncertaintyThreshold
    );

    return filtered.slice(0, limit);
  }

  /**
   * Select diverse samples using clustering
   */
  selectByDiversity(
    candidates: SampleCandidate[],
    limit: number
  ): SampleCandidate[] {
    if (candidates.length <= limit) {
      return candidates;
    }

    // Convert features to numeric vectors
    const vectors = candidates.map((c) => this.featuresToVector(c.features));

    // Simple k-means-like clustering
    const k = Math.min(limit, Math.ceil(candidates.length / 3));
    const clusters = this.kMeansCluster(vectors, k);

    // Select one sample from each cluster, prioritizing low confidence
    const selected: SampleCandidate[] = [];
    const usedClusters = new Set<number>();

    // First pass: one sample per cluster
    for (let i = 0; i < limit && usedClusters.size < clusters.length; i++) {
      let bestCluster = -1;
      let bestScore = Infinity;

      for (let j = 0; j < clusters.length; j++) {
        if (usedClusters.has(j)) continue;

        const clusterSamples = clusters[j];
        if (clusterSamples.length === 0) continue;

        // Find sample with lowest confidence in this cluster
        const minConfidence = Math.min(
          ...clusterSamples.map((idx) => candidates[idx].confidence)
        );

        if (minConfidence < bestScore) {
          bestScore = minConfidence;
          bestCluster = j;
        }
      }

      if (bestCluster >= 0) {
        const clusterSamples = clusters[bestCluster];
        const bestIdx = clusterSamples.reduce((best, idx) =>
          candidates[idx].confidence < candidates[best].confidence ? idx : best
        );

        selected.push(candidates[bestIdx]);
        usedClusters.add(bestCluster);
        clusters[bestCluster] = clusterSamples.filter((idx) => idx !== bestIdx);
      }
    }

    // Fill remaining slots if needed
    while (selected.length < limit) {
      const remaining = candidates.filter((c) => !selected.includes(c));
      if (remaining.length === 0) break;

      remaining.sort((a, b) => a.confidence - b.confidence);
      selected.push(remaining[0]);
    }

    return selected.slice(0, limit);
  }

  /**
   * Select samples similar to previous errors
   */
  async selectByErrorSimilarity(
    candidates: SampleCandidate[],
    limit: number
  ): Promise<SampleCandidate[]> {
    // Get recent errors (negative feedback)
    const { data: errors } = await this.supabase
      .from('user_feedback')
      .select('target_id, metadata, rating')
      .eq('is_positive', false)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!errors || errors.length === 0) {
      // Fall back to uncertainty if no errors
      return this.selectByUncertainty(candidates, limit);
    }

    // Extract error features
    const errorFeatures = errors.map((e) => e.metadata?.features ?? {});

    // Score candidates by similarity to errors
    const scored = candidates.map((candidate) => {
      const similarity = this.computeErrorSimilarity(
        candidate.features,
        errorFeatures
      );

      return {
        sample: candidate,
        errorSimilarity: similarity,
        score: similarity * (1 - candidate.confidence), // Combine with uncertainty
      };
    });

    // Sort by combined score
    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((s) => s.sample);
  }

  /**
   * Hybrid selection combining all strategies
   */
  async selectHybrid(
    candidates: SampleCandidate[],
    limit: number
  ): Promise<SampleCandidate[]> {
    // Get error features for similarity scoring
    const { data: errors } = await this.supabase
      .from('user_feedback')
      .select('metadata')
      .eq('is_positive', false)
      .order('created_at', { ascending: false })
      .limit(100);

    const errorFeatures = (errors ?? []).map(
      (e) => e.metadata?.features ?? {}
    );

    // Score each candidate
    const scored = candidates.map((candidate) => {
      // Uncertainty score (higher = more uncertain)
      const uncertaintyScore = 1 - candidate.confidence;

      // Diversity score (computed later based on selection)
      const diversityScore = 0.5; // Placeholder, adjusted during selection

      // Error similarity score
      const errorScore =
        errorFeatures.length > 0
          ? this.computeErrorSimilarity(candidate.features, errorFeatures)
          : 0.5;

      // Combined score
      const combinedScore =
        this.config.uncertaintyWeight * uncertaintyScore +
        this.config.diversityWeight * diversityScore +
        this.config.errorWeight * errorScore;

      return {
        sample: candidate,
        uncertaintyScore,
        diversityScore,
        errorScore,
        combinedScore,
      };
    });

    // Sort by combined score
    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    // Greedily select while maintaining diversity
    const selected: SampleCandidate[] = [];
    const selectedVectors: number[][] = [];

    for (const item of scored) {
      if (selected.length >= limit) break;

      const vector = this.featuresToVector(item.sample.features);

      // Check diversity against already selected
      if (selectedVectors.length > 0) {
        const minDistance = Math.min(
          ...selectedVectors.map((v) => this.euclideanDistance(vector, v))
        );

        // Skip if too similar to already selected
        if (minDistance < 0.3) continue;
      }

      selected.push(item.sample);
      selectedVectors.push(vector);
    }

    // Fill remaining slots if needed (relax diversity constraint)
    if (selected.length < limit) {
      const remaining = scored.filter((s) => !selected.includes(s.sample));
      for (const item of remaining) {
        if (selected.length >= limit) break;
        selected.push(item.sample);
      }
    }

    return selected;
  }

  /**
   * Random selection (baseline)
   */
  selectRandom(
    candidates: SampleCandidate[],
    limit: number
  ): SampleCandidate[] {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // DATABASE OPERATIONS
  // --------------------------------------------------------------------------

  /**
   * Get candidate samples from database
   */
  private async getCandidates(
    query: SelectionQuery
  ): Promise<SampleCandidate[]> {
    // Query unlabeled analyses with AI outputs
    let dbQuery = this.supabase
      .from('analyses')
      .select(
        `
        id,
        url,
        industry,
        company_size,
        overall_score,
        analysis_result,
        confidence_score,
        created_at,
        user_id
      `
      )
      .order('created_at', { ascending: false });

    if (query.minDate) {
      dbQuery = dbQuery.gte('created_at', query.minDate);
    }

    if (query.maxDate) {
      dbQuery = dbQuery.lte('created_at', query.maxDate);
    }

    if (query.industry) {
      dbQuery = dbQuery.eq('industry', query.industry);
    }

    // Limit candidates pool
    dbQuery = dbQuery.limit(500);

    const { data: analyses, error } = await dbQuery;

    if (error) {
      this.log('Error fetching candidates:', error);
      return [];
    }

    // Filter out already labeled if requested
    let candidateIds = (analyses ?? []).map((a) => a.id);

    if (query.excludeLabeled !== false) {
      const { data: labeled } = await this.supabase
        .from('user_feedback')
        .select('target_id')
        .in('target_id', candidateIds);

      const labeledIds = new Set((labeled ?? []).map((l) => l.target_id));
      candidateIds = candidateIds.filter((id) => !labeledIds.has(id));
    }

    // Transform to SampleCandidate format
    return (analyses ?? [])
      .filter((a) => candidateIds.includes(a.id))
      .map((a) => this.toSampleCandidate(a));
  }

  /**
   * Transform database record to SampleCandidate
   */
  private toSampleCandidate(analysis: Record<string, unknown>): SampleCandidate {
    const confidence =
      typeof analysis.confidence_score === 'number'
        ? analysis.confidence_score
        : 0.5;

    // Extract features for diversity calculation
    const features: Record<string, number | string> = {
      industry: (analysis.industry as string) ?? 'unknown',
      company_size: (analysis.company_size as string) ?? 'unknown',
      score_range: this.scoreToRange(analysis.overall_score as number),
    };

    return {
      id: crypto.randomUUID(),
      type: 'analysis',
      sourceId: analysis.id as string,
      content: analysis.url as string,
      aiOutput: analysis.analysis_result,
      confidence,
      priorityScore: 1 - confidence, // Higher priority for lower confidence
      features,
      metadata: {
        overall_score: analysis.overall_score,
        user_id: analysis.user_id,
      },
      createdAt: analysis.created_at as string,
    };
  }

  /**
   * Save selection batch to database
   */
  async saveBatch(batch: SelectionBatch): Promise<void> {
    const { error } = await this.supabase
      .from('active_learning_batches')
      .insert({
        id: batch.batchId,
        strategy: batch.strategy,
        sample_ids: batch.samples.map((s) => s.sourceId),
        stats: batch.stats,
        created_at: batch.createdAt,
      });

    if (error) {
      this.log('Error saving batch:', error);
    }
  }

  /**
   * Record labeled sample
   */
  async recordLabel(
    sampleId: string,
    label: unknown,
    labeledBy: string,
    durationMs: number,
    quality: number = 1.0
  ): Promise<void> {
    const { error } = await this.supabase
      .from('active_learning_labels')
      .insert({
        sample_id: sampleId,
        label,
        labeled_by: labeledBy,
        labeling_duration_ms: durationMs,
        label_quality: quality,
        labeled_at: new Date().toISOString(),
      });

    if (error) {
      this.log('Error recording label:', error);
    }
  }

  // --------------------------------------------------------------------------
  // HELPER METHODS
  // --------------------------------------------------------------------------

  /**
   * Convert features to numeric vector for clustering
   */
  private featuresToVector(
    features: Record<string, number | string>
  ): number[] {
    const vector: number[] = [];

    // Industry encoding (simplified)
    const industries = [
      'technology',
      'finance',
      'healthcare',
      'retail',
      'manufacturing',
      'other',
    ];
    const industry = (features.industry as string) ?? 'other';
    const industryIdx = industries.indexOf(industry.toLowerCase());
    vector.push(industryIdx >= 0 ? industryIdx / industries.length : 0.5);

    // Company size encoding
    const sizes = ['small', 'medium', 'large', 'enterprise'];
    const size = (features.company_size as string) ?? 'medium';
    const sizeIdx = sizes.indexOf(size.toLowerCase());
    vector.push(sizeIdx >= 0 ? sizeIdx / sizes.length : 0.5);

    // Score range encoding
    const ranges = ['low', 'medium-low', 'medium', 'medium-high', 'high'];
    const range = (features.score_range as string) ?? 'medium';
    const rangeIdx = ranges.indexOf(range);
    vector.push(rangeIdx >= 0 ? rangeIdx / ranges.length : 0.5);

    return vector;
  }

  /**
   * Convert score to categorical range
   */
  private scoreToRange(score: number): string {
    if (score < 20) return 'low';
    if (score < 40) return 'medium-low';
    if (score < 60) return 'medium';
    if (score < 80) return 'medium-high';
    return 'high';
  }

  /**
   * Euclidean distance between vectors
   */
  private euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
  }

  /**
   * Simple k-means clustering
   */
  private kMeansCluster(
    vectors: number[][],
    k: number,
    maxIterations: number = 10
  ): number[][] {
    if (vectors.length <= k) {
      return vectors.map((_, i) => [i]);
    }

    // Initialize centroids randomly
    const shuffled = [...vectors.keys()].sort(() => Math.random() - 0.5);
    const centroids = shuffled.slice(0, k).map((i) => [...vectors[i]]);

    let clusters: number[][] = [];

    for (let iter = 0; iter < maxIterations; iter++) {
      // Assign points to nearest centroid
      clusters = Array.from({ length: k }, () => []);

      for (let i = 0; i < vectors.length; i++) {
        let nearestCluster = 0;
        let nearestDistance = Infinity;

        for (let j = 0; j < k; j++) {
          const distance = this.euclideanDistance(vectors[i], centroids[j]);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestCluster = j;
          }
        }

        clusters[nearestCluster].push(i);
      }

      // Update centroids
      for (let j = 0; j < k; j++) {
        if (clusters[j].length === 0) continue;

        const dims = vectors[0].length;
        for (let d = 0; d < dims; d++) {
          centroids[j][d] =
            clusters[j].reduce((sum, i) => sum + vectors[i][d], 0) /
            clusters[j].length;
        }
      }
    }

    return clusters;
  }

  /**
   * Compute similarity to error samples
   */
  private computeErrorSimilarity(
    features: Record<string, number | string>,
    errorFeatures: Record<string, unknown>[]
  ): number {
    if (errorFeatures.length === 0) return 0;

    const targetVector = this.featuresToVector(features);

    let maxSimilarity = 0;

    for (const errorFeature of errorFeatures) {
      const errorVector = this.featuresToVector(
        errorFeature as Record<string, number | string>
      );
      const distance = this.euclideanDistance(targetVector, errorVector);
      const similarity = 1 / (1 + distance); // Convert distance to similarity

      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Create empty batch result
   */
  private createEmptyBatch(strategy: SelectionStrategy): SelectionBatch {
    return {
      batchId: crypto.randomUUID(),
      strategy,
      samples: [],
      stats: {
        totalCandidates: 0,
        selectedCount: 0,
        avgConfidence: 0,
        avgPriorityScore: 0,
        diversityScore: 0,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Create batch with statistics
   */
  private createBatch(
    strategy: SelectionStrategy,
    samples: SampleCandidate[],
    totalCandidates: number
  ): SelectionBatch {
    const avgConfidence =
      samples.length > 0
        ? samples.reduce((sum, s) => sum + s.confidence, 0) / samples.length
        : 0;

    const avgPriorityScore =
      samples.length > 0
        ? samples.reduce((sum, s) => sum + s.priorityScore, 0) / samples.length
        : 0;

    // Compute diversity score based on feature variance
    const diversityScore = this.computeDiversityScore(samples);

    return {
      batchId: crypto.randomUUID(),
      strategy,
      samples,
      stats: {
        totalCandidates,
        selectedCount: samples.length,
        avgConfidence,
        avgPriorityScore,
        diversityScore,
      },
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Compute diversity score for a set of samples
   */
  private computeDiversityScore(samples: SampleCandidate[]): number {
    if (samples.length < 2) return 0;

    const vectors = samples.map((s) => this.featuresToVector(s.features));

    // Average pairwise distance
    let totalDistance = 0;
    let pairs = 0;

    for (let i = 0; i < vectors.length; i++) {
      for (let j = i + 1; j < vectors.length; j++) {
        totalDistance += this.euclideanDistance(vectors[i], vectors[j]);
        pairs++;
      }
    }

    // Normalize to 0-1 (assuming max distance is sqrt(dimensions))
    const avgDistance = totalDistance / pairs;
    const maxDistance = Math.sqrt(vectors[0].length);

    return Math.min(avgDistance / maxDistance, 1);
  }

  /**
   * Debug logging
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[SampleSelector]', ...args);
    }
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

let selectorInstance: SampleSelector | null = null;

/**
 * Get or create sample selector instance
 */
export function getSampleSelector(
  config?: SampleSelectorConfig
): SampleSelector {
  if (!selectorInstance && config) {
    selectorInstance = new SampleSelector(config);
  }

  if (!selectorInstance) {
    throw new Error('SampleSelector not initialized. Call with config first.');
  }

  return selectorInstance;
}

/**
 * Initialize sample selector
 */
export function initSampleSelector(
  config: SampleSelectorConfig
): SampleSelector {
  selectorInstance = new SampleSelector(config);
  return selectorInstance;
}

/**
 * Destroy sample selector instance
 */
export function destroySampleSelector(): void {
  selectorInstance = null;
}
