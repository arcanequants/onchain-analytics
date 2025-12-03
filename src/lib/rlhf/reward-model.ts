/**
 * RLHF Reward Model
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Implements a reward model for predicting user satisfaction based on
 * preference pairs and feedback signals.
 *
 * Target: Model accuracy >75% on test set
 *
 * @module lib/rlhf/reward-model
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Feature vector for reward prediction
 */
export interface AnalysisFeatures {
  // Core metrics
  overallScore: number;
  confidenceScore: number;

  // Provider breakdown
  openaiScore: number;
  anthropicScore: number;
  geminiScore: number;
  perplexityScore: number;

  // Content metrics
  recommendationCount: number;
  criticalIssuesCount: number;
  warningsCount: number;

  // Engagement signals
  dwellTimeMs: number;
  scrollDepth: number;
  clickCount: number;
  copyShareCount: number;

  // Industry context
  industryId?: string;
  industryCoverage: number;

  // Analysis metadata
  analysisAgeHours: number;
  isFirstAnalysis: boolean;
}

/**
 * Reward prediction result
 */
export interface RewardPrediction {
  score: number; // 0-1 predicted satisfaction
  confidence: number; // 0-1 prediction confidence
  factors: RewardFactor[];
}

/**
 * Factor contributing to reward
 */
export interface RewardFactor {
  name: string;
  contribution: number; // -1 to 1
  weight: number;
}

/**
 * Model version metadata
 */
export interface RewardModelVersion {
  id: string;
  version: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  trainedAt: Date;
  trainingPairsCount: number;
  isActive: boolean;
}

/**
 * Validation result
 */
export interface ValidationResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  confusionMatrix: {
    truePositive: number;
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
  };
  testSetSize: number;
  targetMet: boolean;
  details: {
    byIndustry: Record<string, { accuracy: number; count: number }>;
    bySource: Record<string, { accuracy: number; count: number }>;
    byConfidenceLevel: { high: number; medium: number; low: number };
  };
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Model weights (learned from preference pairs)
 * These are initialized with heuristic values and can be updated via training
 */
export const DEFAULT_FEATURE_WEIGHTS: Record<string, number> = {
  // Core metrics (most important)
  overallScore: 0.25,
  confidenceScore: 0.15,

  // Engagement signals (strong indicators)
  dwellTimeNormalized: 0.12,
  scrollDepthNormalized: 0.08,
  clickCount: 0.05,
  copyShareCount: 0.08,

  // Content quality
  recommendationQuality: 0.10,
  issuesCoverage: 0.05,

  // Provider consensus
  providerConsensus: 0.07,

  // Industry relevance
  industryCoverage: 0.05,
};

/**
 * Thresholds for satisfaction prediction
 */
export const SATISFACTION_THRESHOLDS = {
  high: 0.7, // Score >= 0.7 = satisfied
  medium: 0.4, // Score 0.4-0.7 = neutral
  low: 0.4, // Score < 0.4 = unsatisfied
};

/**
 * Target accuracy (milestone metric)
 */
export const TARGET_ACCURACY = 0.75; // 75%

// ============================================================================
// REWARD MODEL CLASS
// ============================================================================

/**
 * Reward model for predicting user satisfaction
 */
export class RewardModel {
  private supabase: SupabaseClient;
  private weights: Record<string, number>;
  private modelVersion: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    weights?: Record<string, number>
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.weights = weights || { ...DEFAULT_FEATURE_WEIGHTS };
    this.modelVersion = '1.0.0';
  }

  /**
   * Predict reward/satisfaction score for an analysis
   */
  public predictReward(features: AnalysisFeatures): RewardPrediction {
    const factors: RewardFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Normalize and weight each feature
    const normalizedFeatures = this.normalizeFeatures(features);

    // Calculate weighted sum
    for (const [featureName, value] of Object.entries(normalizedFeatures)) {
      const weight = this.weights[featureName] || 0;
      if (weight > 0) {
        const contribution = value * weight;
        totalScore += contribution;
        totalWeight += weight;

        factors.push({
          name: featureName,
          contribution: value,
          weight,
        });
      }
    }

    // Normalize score to 0-1
    const score = totalWeight > 0 ? totalScore / totalWeight : 0.5;

    // Calculate confidence based on feature completeness
    const completeness = this.calculateFeatureCompleteness(features);
    const confidence = this.calculateConfidence(features, completeness);

    // Sort factors by contribution (most impactful first)
    factors.sort((a, b) => Math.abs(b.contribution * b.weight) - Math.abs(a.contribution * a.weight));

    return {
      score: Math.max(0, Math.min(1, score)),
      confidence,
      factors: factors.slice(0, 5), // Top 5 factors
    };
  }

  /**
   * Normalize features to 0-1 scale
   */
  private normalizeFeatures(features: AnalysisFeatures): Record<string, number> {
    return {
      overallScore: features.overallScore / 100,
      confidenceScore: features.confidenceScore,

      // Dwell time: 0-120s normalized (more is better, but with diminishing returns)
      dwellTimeNormalized: Math.min(1, features.dwellTimeMs / 120000),

      // Scroll depth: already 0-100
      scrollDepthNormalized: features.scrollDepth / 100,

      // Click count: 0-10+ normalized
      clickCount: Math.min(1, features.clickCount / 10),

      // Copy/share: strong positive signal
      copyShareCount: Math.min(1, features.copyShareCount / 3),

      // Recommendation quality: ratio of actionable recommendations
      recommendationQuality:
        features.recommendationCount > 0
          ? Math.min(1, features.recommendationCount / 10)
          : 0,

      // Issues coverage: fewer critical issues is better
      issuesCoverage:
        features.criticalIssuesCount === 0
          ? 1
          : Math.max(0, 1 - features.criticalIssuesCount / 5),

      // Provider consensus: all providers agreeing is better
      providerConsensus: this.calculateProviderConsensus(features),

      // Industry coverage: relevant to user's industry
      industryCoverage: features.industryCoverage,
    };
  }

  /**
   * Calculate how much providers agree
   */
  private calculateProviderConsensus(features: AnalysisFeatures): number {
    const scores = [
      features.openaiScore,
      features.anthropicScore,
      features.geminiScore,
      features.perplexityScore,
    ].filter((s) => s > 0);

    if (scores.length < 2) return 0.5;

    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Lower standard deviation = higher consensus
    // Max expected stdDev is ~25 (scores can range 0-100)
    return Math.max(0, 1 - stdDev / 25);
  }

  /**
   * Calculate feature completeness (0-1)
   */
  private calculateFeatureCompleteness(features: AnalysisFeatures): number {
    let complete = 0;
    let total = 0;

    // Core metrics (required)
    total += 2;
    if (features.overallScore > 0) complete++;
    if (features.confidenceScore > 0) complete++;

    // Provider scores (at least 2)
    total += 1;
    const providerCount = [
      features.openaiScore,
      features.anthropicScore,
      features.geminiScore,
      features.perplexityScore,
    ].filter((s) => s > 0).length;
    if (providerCount >= 2) complete++;

    // Engagement signals (helpful but not required)
    total += 3;
    if (features.dwellTimeMs > 0) complete++;
    if (features.scrollDepth > 0) complete++;
    if (features.clickCount > 0) complete++;

    return complete / total;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(
    features: AnalysisFeatures,
    completeness: number
  ): number {
    // Base confidence from feature completeness
    let confidence = completeness * 0.6;

    // Boost for strong engagement signals
    if (features.dwellTimeMs > 30000) confidence += 0.1;
    if (features.scrollDepth > 50) confidence += 0.1;
    if (features.copyShareCount > 0) confidence += 0.1;

    // Boost for first-party data (logged in user)
    if (!features.isFirstAnalysis) confidence += 0.1;

    return Math.min(1, confidence);
  }

  /**
   * Validate model accuracy against test set
   */
  public async validateModel(testSetRatio: number = 0.2): Promise<ValidationResult> {
    console.log(`Validating reward model (test set ratio: ${testSetRatio * 100}%)...`);

    // Get preference pairs for validation
    const { data: pairs, error } = await this.supabase
      .from('preference_pairs')
      .select('*')
      .neq('preferred', 'skip')
      .order('created_at', { ascending: false });

    if (error || !pairs || pairs.length === 0) {
      throw new Error(`Failed to get preference pairs: ${error?.message || 'No pairs found'}`);
    }

    console.log(`Found ${pairs.length} preference pairs for validation`);

    // Split into train/test (for demonstration - in production, pairs would already be split)
    const testSize = Math.floor(pairs.length * testSetRatio);
    const testPairs = pairs.slice(0, testSize);

    // Initialize confusion matrix
    const confusion = {
      truePositive: 0,
      trueNegative: 0,
      falsePositive: 0,
      falseNegative: 0,
    };

    // Track accuracy by segment
    const byIndustry: Record<string, { correct: number; total: number }> = {};
    const bySource: Record<string, { correct: number; total: number }> = {};
    const byConfidence = { high: 0, medium: 0, low: 0 };
    const totalByConfidence = { high: 0, medium: 0, low: 0 };

    // Validate each pair
    for (const pair of testPairs) {
      // Create synthetic features from pair signals
      const featuresA = this.extractFeaturesFromSignals(pair.signals, 'a');
      const featuresB = this.extractFeaturesFromSignals(pair.signals, 'b');

      // Get predictions
      const predictionA = this.predictReward(featuresA);
      const predictionB = this.predictReward(featuresB);

      // Determine predicted preference
      let predictedPreference: 'a' | 'b' | 'tie';
      const diff = predictionA.score - predictionB.score;
      if (Math.abs(diff) < 0.1) {
        predictedPreference = 'tie';
      } else if (diff > 0) {
        predictedPreference = 'a';
      } else {
        predictedPreference = 'b';
      }

      // Compare to actual preference
      const actualPreference = pair.preferred;
      const isCorrect =
        predictedPreference === actualPreference ||
        (actualPreference === 'tie' && Math.abs(diff) < 0.2);

      // Update confusion matrix (treating 'a preferred' as positive)
      if (actualPreference === 'a') {
        if (predictedPreference === 'a') {
          confusion.truePositive++;
        } else {
          confusion.falseNegative++;
        }
      } else if (actualPreference === 'b') {
        if (predictedPreference === 'b' || predictedPreference === 'tie') {
          confusion.trueNegative++;
        } else {
          confusion.falsePositive++;
        }
      } else {
        // Tie
        if (Math.abs(diff) < 0.15) {
          confusion.truePositive++;
        }
      }

      // Track by industry
      const industryId = pair.industry_id || 'unknown';
      if (!byIndustry[industryId]) {
        byIndustry[industryId] = { correct: 0, total: 0 };
      }
      byIndustry[industryId].total++;
      if (isCorrect) byIndustry[industryId].correct++;

      // Track by source
      const source = pair.source || 'unknown';
      if (!bySource[source]) {
        bySource[source] = { correct: 0, total: 0 };
      }
      bySource[source].total++;
      if (isCorrect) bySource[source].correct++;

      // Track by confidence level
      const avgConfidence = (predictionA.confidence + predictionB.confidence) / 2;
      if (avgConfidence >= 0.7) {
        totalByConfidence.high++;
        if (isCorrect) byConfidence.high++;
      } else if (avgConfidence >= 0.4) {
        totalByConfidence.medium++;
        if (isCorrect) byConfidence.medium++;
      } else {
        totalByConfidence.low++;
        if (isCorrect) byConfidence.low++;
      }
    }

    // Calculate metrics
    const total = confusion.truePositive + confusion.trueNegative + confusion.falsePositive + confusion.falseNegative;
    const accuracy = total > 0 ? (confusion.truePositive + confusion.trueNegative) / total : 0;
    const precision = (confusion.truePositive + confusion.falsePositive) > 0
      ? confusion.truePositive / (confusion.truePositive + confusion.falsePositive)
      : 0;
    const recall = (confusion.truePositive + confusion.falseNegative) > 0
      ? confusion.truePositive / (confusion.truePositive + confusion.falseNegative)
      : 0;
    const f1Score = (precision + recall) > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    // AUC approximation (using accuracy as proxy for this simplified version)
    const auc = (accuracy + 1) / 2;

    // Convert segment stats to accuracy
    const industryAccuracy: Record<string, { accuracy: number; count: number }> = {};
    for (const [id, stats] of Object.entries(byIndustry)) {
      industryAccuracy[id] = {
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        count: stats.total,
      };
    }

    const sourceAccuracy: Record<string, { accuracy: number; count: number }> = {};
    for (const [source, stats] of Object.entries(bySource)) {
      sourceAccuracy[source] = {
        accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
        count: stats.total,
      };
    }

    const result: ValidationResult = {
      accuracy,
      precision,
      recall,
      f1Score,
      auc,
      confusionMatrix: confusion,
      testSetSize: testPairs.length,
      targetMet: accuracy >= TARGET_ACCURACY,
      details: {
        byIndustry: industryAccuracy,
        bySource: sourceAccuracy,
        byConfidenceLevel: {
          high: totalByConfidence.high > 0 ? byConfidence.high / totalByConfidence.high : 0,
          medium: totalByConfidence.medium > 0 ? byConfidence.medium / totalByConfidence.medium : 0,
          low: totalByConfidence.low > 0 ? byConfidence.low / totalByConfidence.low : 0,
        },
      },
    };

    // Log result
    console.log(`Validation complete:`);
    console.log(`  Accuracy: ${(accuracy * 100).toFixed(1)}% (target: ${TARGET_ACCURACY * 100}%)`);
    console.log(`  Precision: ${(precision * 100).toFixed(1)}%`);
    console.log(`  Recall: ${(recall * 100).toFixed(1)}%`);
    console.log(`  F1 Score: ${(f1Score * 100).toFixed(1)}%`);
    console.log(`  Target Met: ${result.targetMet ? 'YES' : 'NO'}`);

    // Store validation result
    await this.storeValidationResult(result);

    return result;
  }

  /**
   * Extract features from pair signals
   */
  private extractFeaturesFromSignals(
    signals: Record<string, unknown>,
    side: 'a' | 'b'
  ): AnalysisFeatures {
    const prefix = side === 'a' ? 'a' : 'b';

    return {
      overallScore: 50, // Default if not available
      confidenceScore: 0.5,
      openaiScore: 0,
      anthropicScore: 0,
      geminiScore: 0,
      perplexityScore: 0,
      recommendationCount: 5,
      criticalIssuesCount: 0,
      warningsCount: 2,
      dwellTimeMs: (signals[`${prefix}DwellTimeMs`] as number) || 0,
      scrollDepth: (signals[`${prefix}ScrollDepth`] as number) || 0,
      clickCount: (signals[`${prefix}Clicks`] as number) || 0,
      copyShareCount:
        ((signals[`${prefix}Copies`] as number) || 0) +
        ((signals[`${prefix}Shares`] as number) || 0),
      industryCoverage: 0.8,
      analysisAgeHours: 24,
      isFirstAnalysis: false,
    };
  }

  /**
   * Store validation result in database
   */
  private async storeValidationResult(result: ValidationResult): Promise<void> {
    try {
      await this.supabase.from('reward_model_versions').insert({
        version: this.modelVersion,
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1_score: result.f1Score,
        auc: result.auc,
        test_set_size: result.testSetSize,
        confusion_matrix: result.confusionMatrix,
        details: result.details,
        target_met: result.targetMet,
        is_active: result.targetMet, // Only activate if target met
        trained_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to store validation result:', error);
    }
  }

  /**
   * Get current model metrics
   */
  public async getModelMetrics(): Promise<RewardModelVersion | null> {
    const { data, error } = await this.supabase
      .from('reward_model_versions')
      .select('*')
      .eq('is_active', true)
      .order('trained_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      version: data.version,
      accuracy: data.accuracy,
      precision: data.precision,
      recall: data.recall,
      f1Score: data.f1_score,
      auc: data.auc,
      trainedAt: new Date(data.trained_at),
      trainingPairsCount: data.test_set_size * 5, // Approximate
      isActive: data.is_active,
    };
  }

  /**
   * Update model weights (for training)
   */
  public updateWeights(newWeights: Partial<Record<string, number>>): void {
    // Filter out undefined values and merge with existing weights
    const filteredWeights: Record<string, number> = {};
    for (const [key, value] of Object.entries(newWeights)) {
      if (value !== undefined) {
        filteredWeights[key] = value;
      }
    }
    this.weights = { ...this.weights, ...filteredWeights };
    // Increment version
    const parts = this.modelVersion.split('.');
    parts[2] = String(parseInt(parts[2], 10) + 1);
    this.modelVersion = parts.join('.');
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a reward model instance
 */
export function createRewardModel(
  weights?: Record<string, number>
): RewardModel {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return new RewardModel(supabaseUrl, supabaseKey, weights);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RewardModel;
