/**
 * AI Perception Scoring Algorithm
 *
 * Phase 1, Week 1, Day 4
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.5
 *
 * Calculates a 0-100 score representing how well AI models
 * perceive and recommend a brand.
 *
 * Scoring components:
 * - Brand mention (is the brand mentioned at all?)
 * - Recommendation status (explicitly recommended?)
 * - Position in lists (1st place vs 5th place)
 * - Sentiment analysis (positive, neutral, negative)
 * - Multi-provider consistency (same across OpenAI, Anthropic, etc.)
 */

import { z } from 'zod';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Weights for each scoring component (must sum to 100)
 */
export const SCORING_WEIGHTS = {
  mentioned: 20,        // Brand is mentioned at all
  recommended: 30,      // Explicitly recommended
  position: 20,         // Position in list (1st = 20, 5th = 4)
  sentiment: 15,        // Positive sentiment bonus
  multiProvider: 15,    // Consistent across providers
} as const;

/**
 * Score thresholds for categorization
 */
export const SCORE_THRESHOLDS = {
  excellent: 80,  // 80-100: Green, brand is well-represented
  good: 60,       // 60-79: Lime, good presence but room to improve
  average: 40,    // 40-59: Yellow, moderate presence
  poor: 20,       // 20-39: Orange, weak presence
  critical: 0,    // 0-19: Red, brand not visible to AI
} as const;

/**
 * Position scoring: higher position = higher score
 * Position 1 = full points, Position 5+ = minimal points
 */
export const POSITION_SCORES: Record<number, number> = {
  1: 20,  // First position
  2: 16,  // Second position
  3: 12,  // Third position
  4: 8,   // Fourth position
  5: 4,   // Fifth or lower
};

/**
 * Sentiment multipliers for the sentiment component
 */
export const SENTIMENT_MULTIPLIERS = {
  positive: 1.0,   // Full points
  mixed: 0.6,      // 60% of points
  neutral: 0.4,    // 40% of points
  negative: 0.0,   // No points
} as const;

// ================================================================
// TYPES
// ================================================================

/**
 * Input from a single AI provider analysis
 */
export const ProviderResultSchema = z.object({
  provider: z.string(),
  brandMentioned: z.boolean(),
  brandRecommended: z.boolean(),
  position: z.number().nullable(),  // null if not in a list
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),
  confidence: z.number().min(0).max(1),
  competitorsMentioned: z.array(z.string()).default([]),
  context: z.string().optional(),
  rawResponse: z.string().optional(),
});

export type ProviderResult = z.infer<typeof ProviderResultSchema>;

/**
 * Combined analysis input from all providers
 */
export const AnalysisInputSchema = z.object({
  brandName: z.string(),
  url: z.string(),
  industry: z.string().optional(),
  providerResults: z.array(ProviderResultSchema).min(1),
});

export type AnalysisInput = z.infer<typeof AnalysisInputSchema>;

/**
 * Detailed score breakdown by component
 */
export interface ScoreBreakdown {
  mentioned: number;
  recommended: number;
  position: number;
  sentiment: number;
  multiProvider: number;
}

/**
 * Complete scoring result
 */
export interface ScoringResult {
  /** Final score 0-100 */
  overallScore: number;
  /** Score category */
  category: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  /** Breakdown by component */
  breakdown: ScoreBreakdown;
  /** Per-provider scores */
  providerScores: Record<string, number>;
  /** Confidence in the score (0-1) */
  confidence: number;
  /** Key insights */
  insights: ScoringInsight[];
  /** Metadata */
  metadata: {
    providersAnalyzed: number;
    providersWithMention: number;
    providersWithRecommendation: number;
    averagePosition: number | null;
    dominantSentiment: string;
  };
}

export interface ScoringInsight {
  type: 'strength' | 'weakness' | 'opportunity' | 'threat';
  message: string;
  impact: 'high' | 'medium' | 'low';
}

// ================================================================
// SCORING FUNCTIONS
// ================================================================

/**
 * Calculate the mention component score
 * Binary: mentioned = full points, not mentioned = 0
 */
function calculateMentionScore(results: ProviderResult[]): number {
  const mentionedCount = results.filter(r => r.brandMentioned).length;
  const mentionRate = mentionedCount / results.length;

  // Full points if mentioned in all, proportional otherwise
  return Math.round(SCORING_WEIGHTS.mentioned * mentionRate);
}

/**
 * Calculate the recommendation component score
 * Higher weight because explicit recommendation is valuable
 */
function calculateRecommendationScore(results: ProviderResult[]): number {
  const recommendedCount = results.filter(r => r.brandRecommended).length;
  const recommendRate = recommendedCount / results.length;

  return Math.round(SCORING_WEIGHTS.recommended * recommendRate);
}

/**
 * Calculate the position component score
 * Based on average position across providers
 */
function calculatePositionScore(results: ProviderResult[]): number {
  const positionedResults = results.filter(r => r.position !== null);

  if (positionedResults.length === 0) {
    // If not in any lists, give partial credit if mentioned
    const mentionedCount = results.filter(r => r.brandMentioned).length;
    return mentionedCount > 0 ? Math.round(SCORING_WEIGHTS.position * 0.3) : 0;
  }

  // Calculate average position score
  const positionScores = positionedResults.map(r => {
    const pos = r.position!;
    return POSITION_SCORES[Math.min(pos, 5)] ?? POSITION_SCORES[5];
  });

  const avgPositionScore = positionScores.reduce((a, b) => a + b, 0) / positionScores.length;

  return Math.round(avgPositionScore);
}

/**
 * Calculate the sentiment component score
 */
function calculateSentimentScore(results: ProviderResult[]): number {
  // Weight by confidence
  let weightedSum = 0;
  let totalWeight = 0;

  for (const result of results) {
    if (result.brandMentioned) {
      const multiplier = SENTIMENT_MULTIPLIERS[result.sentiment];
      weightedSum += multiplier * result.confidence;
      totalWeight += result.confidence;
    }
  }

  if (totalWeight === 0) {
    return 0;
  }

  const avgSentiment = weightedSum / totalWeight;
  return Math.round(SCORING_WEIGHTS.sentiment * avgSentiment);
}

/**
 * Calculate the multi-provider consistency score
 * Higher score if brand is consistently perceived across providers
 */
function calculateMultiProviderScore(results: ProviderResult[]): number {
  if (results.length <= 1) {
    // Can't calculate consistency with only 1 provider
    // Give partial credit based on confidence
    return results[0]?.brandMentioned
      ? Math.round(SCORING_WEIGHTS.multiProvider * results[0].confidence * 0.5)
      : 0;
  }

  // Check consistency factors
  const mentionedStates = results.map(r => r.brandMentioned);
  const recommendedStates = results.map(r => r.brandRecommended);
  const sentiments = results.map(r => r.sentiment);

  // Calculate consistency (0-1) for each factor
  const mentionConsistency = calculateConsistency(mentionedStates);
  const recommendConsistency = calculateConsistency(recommendedStates);
  const sentimentConsistency = calculateSentimentConsistency(sentiments);

  // Weight consistency factors
  const avgConsistency = (
    mentionConsistency * 0.4 +
    recommendConsistency * 0.4 +
    sentimentConsistency * 0.2
  );

  return Math.round(SCORING_WEIGHTS.multiProvider * avgConsistency);
}

/**
 * Calculate consistency (0-1) for boolean values
 */
function calculateConsistency(values: boolean[]): number {
  const trueCount = values.filter(v => v).length;
  const majority = trueCount > values.length / 2;
  const consistentCount = values.filter(v => v === majority).length;
  return consistentCount / values.length;
}

/**
 * Calculate consistency for sentiment values
 */
function calculateSentimentConsistency(sentiments: string[]): number {
  // Group similar sentiments
  const positive = sentiments.filter(s => s === 'positive').length;
  const neutral = sentiments.filter(s => s === 'neutral' || s === 'mixed').length;
  const negative = sentiments.filter(s => s === 'negative').length;

  const maxGroup = Math.max(positive, neutral, negative);
  return maxGroup / sentiments.length;
}

/**
 * Determine score category based on thresholds
 */
function getScoreCategory(score: number): ScoringResult['category'] {
  if (score >= SCORE_THRESHOLDS.excellent) return 'excellent';
  if (score >= SCORE_THRESHOLDS.good) return 'good';
  if (score >= SCORE_THRESHOLDS.average) return 'average';
  if (score >= SCORE_THRESHOLDS.poor) return 'poor';
  return 'critical';
}

/**
 * Generate insights based on the analysis
 */
function generateInsights(
  results: ProviderResult[],
  breakdown: ScoreBreakdown,
  overallScore: number
): ScoringInsight[] {
  const insights: ScoringInsight[] = [];

  // Mention insights
  const mentionedCount = results.filter(r => r.brandMentioned).length;
  if (mentionedCount === results.length) {
    insights.push({
      type: 'strength',
      message: 'Your brand is recognized by all AI models analyzed',
      impact: 'high',
    });
  } else if (mentionedCount === 0) {
    insights.push({
      type: 'weakness',
      message: 'AI models are not currently aware of your brand',
      impact: 'high',
    });
  } else {
    insights.push({
      type: 'opportunity',
      message: `Your brand is mentioned by ${mentionedCount} of ${results.length} AI models`,
      impact: 'medium',
    });
  }

  // Recommendation insights
  const recommendedCount = results.filter(r => r.brandRecommended).length;
  if (recommendedCount > 0) {
    insights.push({
      type: 'strength',
      message: `${recommendedCount} AI model(s) actively recommend your brand`,
      impact: 'high',
    });
  } else if (mentionedCount > 0) {
    insights.push({
      type: 'opportunity',
      message: 'Your brand is mentioned but not explicitly recommended',
      impact: 'medium',
    });
  }

  // Position insights
  const positionedResults = results.filter(r => r.position !== null);
  if (positionedResults.length > 0) {
    const positions = positionedResults.map(r => r.position!);
    const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length;

    if (avgPosition <= 2) {
      insights.push({
        type: 'strength',
        message: 'Your brand ranks in top positions in AI recommendations',
        impact: 'high',
      });
    } else if (avgPosition >= 4) {
      insights.push({
        type: 'opportunity',
        message: 'Your brand appears in lists but not in top positions',
        impact: 'medium',
      });
    }
  }

  // Sentiment insights
  const negativeSentiments = results.filter(r => r.sentiment === 'negative').length;
  const positiveSentiments = results.filter(r => r.sentiment === 'positive').length;

  if (negativeSentiments > 0) {
    insights.push({
      type: 'threat',
      message: `${negativeSentiments} AI model(s) have negative sentiment about your brand`,
      impact: 'high',
    });
  }

  if (positiveSentiments === results.length) {
    insights.push({
      type: 'strength',
      message: 'All AI models have positive sentiment toward your brand',
      impact: 'medium',
    });
  }

  // Competitor insights
  const allCompetitors = results.flatMap(r => r.competitorsMentioned);
  const uniqueCompetitors = [...new Set(allCompetitors)];

  if (uniqueCompetitors.length > 0 && mentionedCount === 0) {
    insights.push({
      type: 'threat',
      message: `Competitors (${uniqueCompetitors.slice(0, 3).join(', ')}) are mentioned instead of your brand`,
      impact: 'high',
    });
  }

  // Consistency insights
  if (breakdown.multiProvider < SCORING_WEIGHTS.multiProvider * 0.5) {
    insights.push({
      type: 'weakness',
      message: 'AI models have inconsistent perceptions of your brand',
      impact: 'medium',
    });
  }

  return insights;
}

/**
 * Calculate individual provider scores
 */
function calculateProviderScores(results: ProviderResult[]): Record<string, number> {
  const scores: Record<string, number> = {};

  for (const result of results) {
    let score = 0;

    // Mention: 20 points
    if (result.brandMentioned) {
      score += 20;
    }

    // Recommendation: 30 points
    if (result.brandRecommended) {
      score += 30;
    }

    // Position: up to 20 points
    if (result.position !== null) {
      score += POSITION_SCORES[Math.min(result.position, 5)] ?? POSITION_SCORES[5];
    } else if (result.brandMentioned) {
      score += 6; // Partial credit for mention without list
    }

    // Sentiment: up to 15 points
    const sentimentMultiplier = SENTIMENT_MULTIPLIERS[result.sentiment];
    score += Math.round(15 * sentimentMultiplier);

    // No multi-provider for individual scores (would need other providers)

    // Scale to 0-100 (max individual score is 85 without multi-provider)
    scores[result.provider] = Math.round((score / 85) * 100);
  }

  return scores;
}

/**
 * Calculate overall confidence in the score
 */
function calculateOverallConfidence(results: ProviderResult[]): number {
  if (results.length === 0) return 0;

  // Base confidence on:
  // 1. Number of providers analyzed
  // 2. Average confidence per provider
  // 3. Consistency of results

  const providerCountFactor = Math.min(results.length / 3, 1); // Optimal at 3+ providers
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  // Check consistency
  const mentionedStates = results.map(r => r.brandMentioned);
  const consistency = calculateConsistency(mentionedStates);

  return (providerCountFactor * 0.3 + avgConfidence * 0.4 + consistency * 0.3);
}

/**
 * Get dominant sentiment across providers
 */
function getDominantSentiment(results: ProviderResult[]): string {
  const sentimentCounts: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
    mixed: 0,
  };

  for (const result of results) {
    if (result.brandMentioned) {
      sentimentCounts[result.sentiment]++;
    }
  }

  let dominant = 'neutral';
  let maxCount = 0;

  for (const [sentiment, count] of Object.entries(sentimentCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = sentiment;
    }
  }

  return dominant;
}

// ================================================================
// MAIN SCORING FUNCTION
// ================================================================

/**
 * Calculate the complete AI Perception score for a brand
 *
 * @param input - Analysis input with provider results
 * @returns Complete scoring result with breakdown and insights
 */
export function calculateScore(input: AnalysisInput): ScoringResult {
  const { providerResults } = input;

  // Calculate each component
  const breakdown: ScoreBreakdown = {
    mentioned: calculateMentionScore(providerResults),
    recommended: calculateRecommendationScore(providerResults),
    position: calculatePositionScore(providerResults),
    sentiment: calculateSentimentScore(providerResults),
    multiProvider: calculateMultiProviderScore(providerResults),
  };

  // Sum to get overall score
  const overallScore = Math.min(100, Math.max(0,
    breakdown.mentioned +
    breakdown.recommended +
    breakdown.position +
    breakdown.sentiment +
    breakdown.multiProvider
  ));

  // Get category
  const category = getScoreCategory(overallScore);

  // Calculate per-provider scores
  const providerScores = calculateProviderScores(providerResults);

  // Calculate confidence
  const confidence = calculateOverallConfidence(providerResults);

  // Generate insights
  const insights = generateInsights(providerResults, breakdown, overallScore);

  // Calculate metadata
  const mentionedCount = providerResults.filter(r => r.brandMentioned).length;
  const recommendedCount = providerResults.filter(r => r.brandRecommended).length;
  const positionedResults = providerResults.filter(r => r.position !== null);
  const avgPosition = positionedResults.length > 0
    ? positionedResults.reduce((sum, r) => sum + r.position!, 0) / positionedResults.length
    : null;

  return {
    overallScore,
    category,
    breakdown,
    providerScores,
    confidence,
    insights,
    metadata: {
      providersAnalyzed: providerResults.length,
      providersWithMention: mentionedCount,
      providersWithRecommendation: recommendedCount,
      averagePosition: avgPosition,
      dominantSentiment: getDominantSentiment(providerResults),
    },
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get color for a score value (for UI display)
 */
export function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.excellent) return 'var(--score-excellent, #22c55e)';
  if (score >= SCORE_THRESHOLDS.good) return 'var(--score-good, #84cc16)';
  if (score >= SCORE_THRESHOLDS.average) return 'var(--score-average, #eab308)';
  if (score >= SCORE_THRESHOLDS.poor) return 'var(--score-poor, #f97316)';
  return 'var(--score-critical, #ef4444)';
}

/**
 * Get human-readable label for a score category
 */
export function getScoreCategoryLabel(category: ScoringResult['category']): string {
  const labels: Record<ScoringResult['category'], string> = {
    excellent: 'Excellent AI Presence',
    good: 'Good AI Visibility',
    average: 'Average AI Recognition',
    poor: 'Weak AI Presence',
    critical: 'Not Visible to AI',
  };
  return labels[category];
}

/**
 * Get description for a score category
 */
export function getScoreCategoryDescription(category: ScoringResult['category']): string {
  const descriptions: Record<ScoringResult['category'], string> = {
    excellent: 'AI models consistently recognize and recommend your brand. You have a strong AI presence.',
    good: 'Your brand has good visibility in AI responses. Some optimization opportunities exist.',
    average: 'AI models are somewhat aware of your brand. There is significant room for improvement.',
    poor: 'Your brand has limited visibility in AI responses. Focused optimization is recommended.',
    critical: 'AI models are not currently aware of your brand. Immediate action is needed.',
  };
  return descriptions[category];
}

/**
 * Compare two scores and return change information
 */
export function compareScores(
  currentScore: number,
  previousScore: number
): { change: number; direction: 'up' | 'down' | 'stable'; percentage: number } {
  const change = currentScore - previousScore;
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  const percentage = previousScore > 0
    ? Math.abs(Math.round((change / previousScore) * 100))
    : 0;

  return { change, direction, percentage };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  calculateScore,
  getScoreColor,
  getScoreCategoryLabel,
  getScoreCategoryDescription,
  compareScores,
  SCORING_WEIGHTS,
  SCORE_THRESHOLDS,
  POSITION_SCORES,
  SENTIMENT_MULTIPLIERS,
};
