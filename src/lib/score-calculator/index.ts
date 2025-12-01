/**
 * Score Calculator - AI Visibility Score Calculation
 *
 * Phase 1, Week 1, Day 3
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5
 *
 * Combines perception signals from multiple sources into
 * a comprehensive AI visibility score with category breakdowns.
 */

import { Result, Ok, Err } from '../result';
import { AppError, ValidationError } from '../errors';
import { apiLogger } from '../logger';
import type { AggregatedPerception, QueryResult, QueryIntent } from '../perception-query';
import type { IndustryDetection } from '../ai/schemas';

// ================================================================
// TYPES
// ================================================================

/**
 * Score categories for breakdown analysis
 */
export type ScoreCategory =
  | 'visibility'      // Overall AI visibility (mentions, position)
  | 'sentiment'       // Sentiment of mentions
  | 'authority'       // Perceived authority/expertise
  | 'relevance'       // Relevance to industry queries
  | 'competitive'     // Competitive positioning
  | 'coverage';       // Breadth of query coverage

/**
 * Score grade based on numeric score
 */
export type ScoreGrade = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

/**
 * Category score with breakdown
 */
export interface CategoryScore {
  /** Category identifier */
  category: ScoreCategory;
  /** Category display name */
  name: string;
  /** Score (0-100) */
  score: number;
  /** Grade based on score */
  grade: ScoreGrade;
  /** Weight used in overall calculation */
  weight: number;
  /** Contribution to overall score */
  contribution: number;
  /** Insights about this category */
  insights: string[];
  /** Improvement suggestions */
  suggestions: string[];
}

/**
 * Provider-specific score
 */
export interface ProviderScore {
  /** Provider name */
  provider: string;
  /** Score from this provider (0-100) */
  score: number;
  /** Number of queries analyzed */
  queriesAnalyzed: number;
  /** Mention rate for this provider */
  mentionRate: number;
  /** Average position when mentioned */
  averagePosition: number | null;
}

/**
 * Intent-specific score breakdown
 */
export interface IntentScore {
  /** Query intent type */
  intent: QueryIntent;
  /** Score for this intent (0-100) */
  score: number;
  /** Number of queries */
  queryCount: number;
  /** Mention rate */
  mentionRate: number;
  /** Average position */
  averagePosition: number | null;
}

/**
 * Industry benchmark data
 */
export interface IndustryBenchmark {
  /** Industry identifier */
  industry: string;
  /** Industry display name */
  industryName: string;
  /** Average visibility score in industry */
  averageScore: number;
  /** Top performer score */
  topPerformerScore: number;
  /** Bottom performer score */
  bottomPerformerScore: number;
  /** Percentile rank (0-100) */
  percentileRank: number;
  /** Position label */
  positionLabel: string;
}

/**
 * Complete score result
 */
export interface ScoreResult {
  /** Overall visibility score (0-100) */
  overallScore: number;
  /** Overall grade */
  overallGrade: ScoreGrade;
  /** Category breakdown */
  categories: CategoryScore[];
  /** Provider-specific scores */
  providerScores: ProviderScore[];
  /** Intent breakdown */
  intentScores: IntentScore[];
  /** Industry benchmark comparison */
  benchmark: IndustryBenchmark | null;
  /** Score interpretation text */
  interpretation: string;
  /** Key insights */
  keyInsights: string[];
  /** Top improvement areas */
  improvementAreas: string[];
  /** Confidence in score (0-1) */
  confidence: number;
  /** Timestamp of calculation */
  calculatedAt: string;
  /** Version of scoring algorithm */
  algorithmVersion: string;
}

/**
 * Input for score calculation
 */
export interface ScoreCalculatorInput {
  /** Brand name being analyzed */
  brandName: string;
  /** Aggregated perception data */
  perception: AggregatedPerception;
  /** Industry detection result */
  industryDetection: IndustryDetection;
  /** Raw query results (for detailed analysis) */
  queryResults?: QueryResult[];
  /** Provider-level aggregations */
  providerAggregations?: Map<string, AggregatedPerception>;
}

// ================================================================
// CONSTANTS
// ================================================================

/** Current algorithm version */
const ALGORITHM_VERSION = '1.0.0';

/**
 * Category weights for overall score calculation
 * Weights must sum to 1.0
 */
const CATEGORY_WEIGHTS: Record<ScoreCategory, number> = {
  visibility: 0.35,    // Most important - are you being mentioned?
  sentiment: 0.20,     // How positively are you mentioned?
  authority: 0.15,     // Are you seen as an authority?
  relevance: 0.15,     // Are you relevant to industry queries?
  competitive: 0.10,   // How do you compare to competitors?
  coverage: 0.05,      // Breadth of coverage across query types
};

/**
 * Category display names
 */
const CATEGORY_NAMES: Record<ScoreCategory, string> = {
  visibility: 'AI Visibility',
  sentiment: 'Sentiment Score',
  authority: 'Authority Score',
  relevance: 'Industry Relevance',
  competitive: 'Competitive Position',
  coverage: 'Query Coverage',
};

/**
 * Grade thresholds
 */
const GRADE_THRESHOLDS: Array<{ min: number; max: number; grade: ScoreGrade }> = [
  { min: 80, max: 100, grade: 'excellent' },
  { min: 60, max: 79, grade: 'good' },
  { min: 40, max: 59, grade: 'average' },
  { min: 20, max: 39, grade: 'poor' },
  { min: 0, max: 19, grade: 'critical' },
];

/**
 * Industry average benchmarks (placeholder - should come from DB)
 */
const INDUSTRY_BENCHMARKS: Record<string, { avg: number; top: number; bottom: number }> = {
  saas: { avg: 52, top: 85, bottom: 18 },
  fintech: { avg: 48, top: 82, bottom: 15 },
  ecommerce: { avg: 55, top: 88, bottom: 22 },
  healthtech: { avg: 45, top: 78, bottom: 12 },
  marketing: { avg: 58, top: 90, bottom: 25 },
  edtech: { avg: 50, top: 80, bottom: 20 },
  media: { avg: 54, top: 85, bottom: 22 },
  'real-estate': { avg: 42, top: 75, bottom: 10 },
  travel: { avg: 51, top: 83, bottom: 18 },
  'professional-services': { avg: 46, top: 76, bottom: 14 },
  default: { avg: 50, top: 80, bottom: 20 },
};

/**
 * Industry display names
 */
const INDUSTRY_NAMES: Record<string, string> = {
  saas: 'SaaS & Cloud Software',
  fintech: 'Fintech & Financial Services',
  ecommerce: 'E-commerce & Retail',
  healthtech: 'Healthcare & Healthtech',
  marketing: 'Marketing & Advertising',
  edtech: 'Education & Edtech',
  media: 'Media & Entertainment',
  'real-estate': 'Real Estate & Property',
  travel: 'Travel & Hospitality',
  'professional-services': 'Professional Services',
  default: 'General Business',
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get grade from numeric score
 */
export function getGradeFromScore(score: number): ScoreGrade {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const gradeInfo = GRADE_THRESHOLDS.find(
    g => normalizedScore >= g.min && normalizedScore <= g.max
  );
  return gradeInfo?.grade || 'critical';
}

/**
 * Get grade label for display
 */
export function getGradeLabel(grade: ScoreGrade): string {
  const labels: Record<ScoreGrade, string> = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    poor: 'Poor',
    critical: 'Critical',
  };
  return labels[grade];
}

/**
 * Get grade color (CSS color value)
 */
export function getGradeColor(grade: ScoreGrade): string {
  const colors: Record<ScoreGrade, string> = {
    excellent: '#22c55e',
    good: '#84cc16',
    average: '#eab308',
    poor: '#f97316',
    critical: '#ef4444',
  };
  return colors[grade];
}

/**
 * Generate interpretation text based on score
 */
function generateInterpretation(score: number, brandName: string): string {
  const grade = getGradeFromScore(score);

  const interpretations: Record<ScoreGrade, string> = {
    excellent: `${brandName} has excellent AI visibility. Your brand appears prominently in AI recommendations and is well-positioned to capture organic AI-driven traffic.`,
    good: `${brandName} has good AI visibility. Your brand is mentioned in most relevant AI queries, but there's room to improve your position and coverage.`,
    average: `${brandName} has average AI visibility. While you appear in some AI recommendations, competitors may be outperforming you. Consider implementing our suggestions.`,
    poor: `${brandName} has poor AI visibility. Your brand is rarely mentioned by AI assistants. Significant improvements are needed to compete effectively.`,
    critical: `${brandName} has critical AI visibility issues. Your brand is virtually invisible to AI assistants. Immediate action is recommended to establish presence.`,
  };

  return interpretations[grade];
}

/**
 * Calculate percentile rank
 */
function calculatePercentileRank(score: number, avg: number, top: number, bottom: number): number {
  // Linear interpolation based on position in range
  if (score >= top) return 99;
  if (score <= bottom) return 1;

  if (score >= avg) {
    // Above average: 50-99 percentile
    const ratio = (score - avg) / (top - avg);
    return Math.round(50 + ratio * 49);
  } else {
    // Below average: 1-50 percentile
    const ratio = (score - bottom) / (avg - bottom);
    return Math.round(1 + ratio * 49);
  }
}

/**
 * Get position label based on percentile
 */
function getPositionLabel(percentile: number): string {
  if (percentile >= 90) return 'Industry Leader';
  if (percentile >= 75) return 'Above Average';
  if (percentile >= 50) return 'Average';
  if (percentile >= 25) return 'Below Average';
  return 'Needs Improvement';
}

// ================================================================
// CATEGORY CALCULATORS
// ================================================================

/**
 * Calculate visibility category score
 * Based on: mention rate, position in responses, frequency
 */
function calculateVisibilityScore(perception: AggregatedPerception): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { mentionRate, averagePosition, visibilityScore } = perception;
  const insights: string[] = [];
  const suggestions: string[] = [];

  // Start with the pre-calculated visibility score
  let score = visibilityScore;

  // Generate insights
  if (mentionRate >= 0.8) {
    insights.push('Excellent mention rate - you appear in most relevant queries');
  } else if (mentionRate >= 0.5) {
    insights.push('Good mention rate - appearing in majority of relevant queries');
  } else if (mentionRate >= 0.3) {
    insights.push('Moderate mention rate - some visibility gaps exist');
    suggestions.push('Create more AI-optimized content targeting key industry queries');
  } else {
    insights.push('Low mention rate - significant visibility gaps');
    suggestions.push('Develop comprehensive content strategy for AI discovery');
    suggestions.push('Focus on building topical authority in your niche');
  }

  if (averagePosition !== null) {
    if (averagePosition <= 2) {
      insights.push(`Strong positioning - averaging position ${averagePosition.toFixed(1)} in recommendations`);
    } else if (averagePosition <= 3) {
      insights.push(`Good positioning - averaging position ${averagePosition.toFixed(1)}`);
    } else {
      insights.push(`Room for improvement - averaging position ${averagePosition.toFixed(1)}`);
      suggestions.push('Strengthen content depth and authority signals');
    }
  }

  return { score, insights, suggestions };
}

/**
 * Calculate sentiment category score
 * Based on: overall sentiment, positive/negative ratio
 */
function calculateSentimentScore(perception: AggregatedPerception): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { overallSentiment, mentionRate } = perception;
  const insights: string[] = [];
  const suggestions: string[] = [];

  // Sentiment scoring
  const sentimentScores: Record<string, number> = {
    positive: 90,
    neutral: 60,
    mixed: 45,
    negative: 20,
  };

  let score = sentimentScores[overallSentiment] || 50;

  // Adjust if not being mentioned (can't have sentiment without mentions)
  if (mentionRate < 0.1) {
    score = 50; // Neutral when not mentioned
    insights.push('Limited sentiment data due to low mention rate');
    suggestions.push('Increase brand visibility to establish positive sentiment');
  } else {
    switch (overallSentiment) {
      case 'positive':
        insights.push('Positive sentiment when mentioned by AI assistants');
        break;
      case 'neutral':
        insights.push('Neutral sentiment - neither strongly positive nor negative');
        suggestions.push('Create more differentiated, value-focused content');
        break;
      case 'mixed':
        insights.push('Mixed sentiment - both positive and negative signals detected');
        suggestions.push('Address negative perception areas through content and PR');
        break;
      case 'negative':
        insights.push('Negative sentiment detected in AI mentions');
        suggestions.push('Conduct reputation analysis to identify issues');
        suggestions.push('Develop content addressing common concerns');
        break;
    }
  }

  return { score, insights, suggestions };
}

/**
 * Calculate authority category score
 * Based on: being recommended first, attributes mentioned, depth of coverage
 */
function calculateAuthorityScore(
  perception: AggregatedPerception,
  industryDetection: IndustryDetection
): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { averagePosition, topAttributes, intentBreakdown } = perception;
  const insights: string[] = [];
  const suggestions: string[] = [];

  let score = 50; // Base score

  // Position-based authority
  if (averagePosition !== null) {
    if (averagePosition <= 1.5) {
      score += 30;
      insights.push('Frequently recommended as a top choice');
    } else if (averagePosition <= 2.5) {
      score += 20;
      insights.push('Often in top recommendations');
    } else if (averagePosition <= 3.5) {
      score += 10;
      insights.push('Included in recommendations but not top position');
    } else {
      suggestions.push('Build authority through thought leadership content');
    }
  }

  // Attribute-based authority
  const authorityAttributes = ['reliability', 'security', 'customer support', 'scalability'];
  const matchedAttributes = topAttributes.filter(attr =>
    authorityAttributes.some(authAttr => attr.toLowerCase().includes(authAttr))
  );

  if (matchedAttributes.length >= 2) {
    score += 15;
    insights.push('Strong authority signals in key attributes');
  } else if (matchedAttributes.length >= 1) {
    score += 8;
    insights.push('Some authority signals detected');
  } else {
    suggestions.push('Highlight expertise, reliability, and security credentials');
  }

  // Evaluation query performance (people asking "is X good")
  const evaluationBreakdown = intentBreakdown['evaluation'];
  if (evaluationBreakdown && evaluationBreakdown.mentionRate >= 0.7) {
    score += 5;
    insights.push('Positively evaluated in assessment queries');
  }

  return { score: Math.min(100, Math.max(0, score)), insights, suggestions };
}

/**
 * Calculate relevance category score
 * Based on: industry match, use case coverage, query intent coverage
 */
function calculateRelevanceScore(
  perception: AggregatedPerception,
  industryDetection: IndustryDetection
): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { intentBreakdown, topAttributes, queriesAnalyzed } = perception;
  const insights: string[] = [];
  const suggestions: string[] = [];

  let score = 50; // Base score

  // Industry confidence boost
  if (industryDetection.confidence >= 0.8) {
    score += 10;
    insights.push(`Strong industry alignment with ${industryDetection.industry}`);
  } else if (industryDetection.confidence >= 0.6) {
    score += 5;
    insights.push('Moderate industry alignment detected');
  } else {
    suggestions.push('Clarify industry positioning in content and metadata');
  }

  // Use case coverage (recommendation + use_case intents)
  const useCaseIntents: QueryIntent[] = ['recommendation', 'use_case'];
  let useCaseCoverage = 0;
  let useCaseMentionRate = 0;

  for (const intent of useCaseIntents) {
    const breakdown = intentBreakdown[intent];
    if (breakdown) {
      useCaseCoverage += breakdown.count;
      useCaseMentionRate += breakdown.mentionRate * breakdown.count;
    }
  }

  if (useCaseCoverage > 0) {
    useCaseMentionRate = useCaseMentionRate / useCaseCoverage;
    if (useCaseMentionRate >= 0.7) {
      score += 25;
      insights.push('Highly relevant for use case queries');
    } else if (useCaseMentionRate >= 0.4) {
      score += 15;
      insights.push('Relevant for some use case queries');
    } else {
      score += 5;
      suggestions.push('Create content targeting specific use cases');
    }
  }

  // Query breadth bonus
  const intentsCovered = Object.keys(intentBreakdown).length;
  if (intentsCovered >= 6) {
    score += 15;
    insights.push('Broad coverage across query types');
  } else if (intentsCovered >= 4) {
    score += 10;
  } else {
    suggestions.push('Expand content to cover more query intents');
  }

  return { score: Math.min(100, Math.max(0, score)), insights, suggestions };
}

/**
 * Calculate competitive category score
 * Based on: competitor mentions, relative positioning, differentiation
 */
function calculateCompetitiveScore(
  perception: AggregatedPerception,
  industryDetection: IndustryDetection
): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { topCompetitors, averagePosition, mentionRate, intentBreakdown } = perception;
  const { competitors: knownCompetitors } = industryDetection;
  const insights: string[] = [];
  const suggestions: string[] = [];

  let score = 50; // Base score

  // Competitive presence check
  if (mentionRate >= 0.6 && topCompetitors.length > 0) {
    // We're mentioned alongside competitors - good sign
    score += 15;
    insights.push('Included in competitive comparisons');
  } else if (mentionRate < 0.3 && topCompetitors.length > 0) {
    // Competitors mentioned but not us
    score -= 10;
    insights.push('Competitors mentioned more frequently');
    suggestions.push('Analyze competitor content strategies');
  }

  // Position vs competitors (from comparison queries)
  const comparisonBreakdown = intentBreakdown['comparison'];
  if (comparisonBreakdown) {
    if (comparisonBreakdown.mentionRate >= 0.7 && comparisonBreakdown.avgPosition && comparisonBreakdown.avgPosition <= 2) {
      score += 20;
      insights.push('Favorably positioned in competitive comparisons');
    } else if (comparisonBreakdown.mentionRate >= 0.5) {
      score += 10;
      insights.push('Present in competitive comparisons');
    } else {
      suggestions.push('Create comparison content highlighting differentiators');
    }
  }

  // Alternatives query performance
  const alternativesBreakdown = intentBreakdown['alternatives'];
  if (alternativesBreakdown) {
    if (alternativesBreakdown.mentionRate >= 0.5) {
      score += 15;
      insights.push('Recognized as a viable alternative');
    }
  }

  // Known competitor tracking
  if (knownCompetitors.length > 0) {
    const competitorsInTop = topCompetitors.filter(c =>
      knownCompetitors.some(kc => kc.toLowerCase() === c.toLowerCase())
    );
    if (competitorsInTop.length > 0) {
      insights.push(`Competing with: ${competitorsInTop.slice(0, 3).join(', ')}`);
    }
  }

  return { score: Math.min(100, Math.max(0, score)), insights, suggestions };
}

/**
 * Calculate coverage category score
 * Based on: query type diversity, depth of responses
 */
function calculateCoverageScore(perception: AggregatedPerception): {
  score: number;
  insights: string[];
  suggestions: string[];
} {
  const { intentBreakdown, queriesAnalyzed, topAttributes } = perception;
  const insights: string[] = [];
  const suggestions: string[] = [];

  let score = 50; // Base score

  // Intent coverage
  const totalIntents = 8; // All possible intents
  const coveredIntents = Object.keys(intentBreakdown).length;
  const coverageRatio = coveredIntents / totalIntents;

  score += Math.round(coverageRatio * 30);

  if (coverageRatio >= 0.75) {
    insights.push('Excellent coverage across query types');
  } else if (coverageRatio >= 0.5) {
    insights.push('Good coverage of major query types');
    suggestions.push('Expand content to cover review and feature queries');
  } else {
    insights.push('Limited query type coverage');
    suggestions.push('Create content targeting recommendation and comparison queries');
  }

  // Query volume bonus
  if (queriesAnalyzed >= 20) {
    score += 15;
    insights.push('Comprehensive analysis with high query volume');
  } else if (queriesAnalyzed >= 10) {
    score += 10;
  } else if (queriesAnalyzed < 5) {
    insights.push('Limited query sample - consider deeper analysis');
  }

  // Attribute diversity
  if (topAttributes.length >= 5) {
    score += 5;
    insights.push('Diverse attribute mentions');
  }

  return { score: Math.min(100, Math.max(0, score)), insights, suggestions };
}

// ================================================================
// MAIN CALCULATOR
// ================================================================

/**
 * Calculate comprehensive AI visibility score
 */
export function calculateScore(input: ScoreCalculatorInput): Result<ScoreResult, AppError> {
  const timer = apiLogger.time('score-calculator.calculate');

  try {
    const { brandName, perception, industryDetection, providerAggregations } = input;

    // Validate input
    if (!brandName || brandName.trim().length === 0) {
      return Err(new ValidationError('Brand name is required'));
    }

    if (!perception) {
      return Err(new ValidationError('Perception data is required'));
    }

    // Calculate category scores
    const visibilityCalc = calculateVisibilityScore(perception);
    const sentimentCalc = calculateSentimentScore(perception);
    const authorityCalc = calculateAuthorityScore(perception, industryDetection);
    const relevanceCalc = calculateRelevanceScore(perception, industryDetection);
    const competitiveCalc = calculateCompetitiveScore(perception, industryDetection);
    const coverageCalc = calculateCoverageScore(perception);

    // Build category scores array
    const categories: CategoryScore[] = [
      {
        category: 'visibility',
        name: CATEGORY_NAMES.visibility,
        score: Math.round(visibilityCalc.score),
        grade: getGradeFromScore(visibilityCalc.score),
        weight: CATEGORY_WEIGHTS.visibility,
        contribution: visibilityCalc.score * CATEGORY_WEIGHTS.visibility,
        insights: visibilityCalc.insights,
        suggestions: visibilityCalc.suggestions,
      },
      {
        category: 'sentiment',
        name: CATEGORY_NAMES.sentiment,
        score: Math.round(sentimentCalc.score),
        grade: getGradeFromScore(sentimentCalc.score),
        weight: CATEGORY_WEIGHTS.sentiment,
        contribution: sentimentCalc.score * CATEGORY_WEIGHTS.sentiment,
        insights: sentimentCalc.insights,
        suggestions: sentimentCalc.suggestions,
      },
      {
        category: 'authority',
        name: CATEGORY_NAMES.authority,
        score: Math.round(authorityCalc.score),
        grade: getGradeFromScore(authorityCalc.score),
        weight: CATEGORY_WEIGHTS.authority,
        contribution: authorityCalc.score * CATEGORY_WEIGHTS.authority,
        insights: authorityCalc.insights,
        suggestions: authorityCalc.suggestions,
      },
      {
        category: 'relevance',
        name: CATEGORY_NAMES.relevance,
        score: Math.round(relevanceCalc.score),
        grade: getGradeFromScore(relevanceCalc.score),
        weight: CATEGORY_WEIGHTS.relevance,
        contribution: relevanceCalc.score * CATEGORY_WEIGHTS.relevance,
        insights: relevanceCalc.insights,
        suggestions: relevanceCalc.suggestions,
      },
      {
        category: 'competitive',
        name: CATEGORY_NAMES.competitive,
        score: Math.round(competitiveCalc.score),
        grade: getGradeFromScore(competitiveCalc.score),
        weight: CATEGORY_WEIGHTS.competitive,
        contribution: competitiveCalc.score * CATEGORY_WEIGHTS.competitive,
        insights: competitiveCalc.insights,
        suggestions: competitiveCalc.suggestions,
      },
      {
        category: 'coverage',
        name: CATEGORY_NAMES.coverage,
        score: Math.round(coverageCalc.score),
        grade: getGradeFromScore(coverageCalc.score),
        weight: CATEGORY_WEIGHTS.coverage,
        contribution: coverageCalc.score * CATEGORY_WEIGHTS.coverage,
        insights: coverageCalc.insights,
        suggestions: coverageCalc.suggestions,
      },
    ];

    // Calculate overall score (weighted average)
    const overallScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.contribution, 0)
    );
    const overallGrade = getGradeFromScore(overallScore);

    // Build provider scores
    const providerScores: ProviderScore[] = [];
    if (providerAggregations) {
      for (const [provider, providerPerception] of providerAggregations) {
        providerScores.push({
          provider,
          score: providerPerception.visibilityScore,
          queriesAnalyzed: providerPerception.queriesAnalyzed,
          mentionRate: providerPerception.mentionRate,
          averagePosition: providerPerception.averagePosition,
        });
      }
    } else {
      // Default to single "combined" provider
      providerScores.push({
        provider: 'combined',
        score: perception.visibilityScore,
        queriesAnalyzed: perception.queriesAnalyzed,
        mentionRate: perception.mentionRate,
        averagePosition: perception.averagePosition,
      });
    }

    // Build intent scores
    const intentScores: IntentScore[] = [];
    for (const [intent, breakdown] of Object.entries(perception.intentBreakdown)) {
      intentScores.push({
        intent: intent as QueryIntent,
        score: Math.round(breakdown.mentionRate * 100 * (breakdown.avgPosition ? (6 - breakdown.avgPosition) / 5 : 0.5)),
        queryCount: breakdown.count,
        mentionRate: breakdown.mentionRate,
        averagePosition: breakdown.avgPosition,
      });
    }

    // Industry benchmark
    const benchmarkData = INDUSTRY_BENCHMARKS[industryDetection.industry] || INDUSTRY_BENCHMARKS.default;
    const percentileRank = calculatePercentileRank(
      overallScore,
      benchmarkData.avg,
      benchmarkData.top,
      benchmarkData.bottom
    );

    const benchmark: IndustryBenchmark = {
      industry: industryDetection.industry,
      industryName: INDUSTRY_NAMES[industryDetection.industry] || INDUSTRY_NAMES.default,
      averageScore: benchmarkData.avg,
      topPerformerScore: benchmarkData.top,
      bottomPerformerScore: benchmarkData.bottom,
      percentileRank,
      positionLabel: getPositionLabel(percentileRank),
    };

    // Collect key insights (top 5)
    const allInsights = categories.flatMap(cat => cat.insights);
    const keyInsights = allInsights.slice(0, 5);

    // Collect improvement areas (prioritized)
    const allSuggestions = categories
      .sort((a, b) => {
        // Prioritize by weight and low scores
        const aImpact = a.weight * (100 - a.score);
        const bImpact = b.weight * (100 - b.score);
        return bImpact - aImpact;
      })
      .flatMap(cat => cat.suggestions);
    const improvementAreas = [...new Set(allSuggestions)].slice(0, 5);

    const result: ScoreResult = {
      overallScore,
      overallGrade,
      categories,
      providerScores,
      intentScores,
      benchmark,
      interpretation: generateInterpretation(overallScore, brandName),
      keyInsights,
      improvementAreas,
      confidence: perception.confidence,
      calculatedAt: new Date().toISOString(),
      algorithmVersion: ALGORITHM_VERSION,
    };

    timer.success({
      overallScore,
      overallGrade,
      categoriesCalculated: categories.length,
    });

    return Ok(result);
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    timer.failure(err);

    return Err(new ValidationError(
      `Failed to calculate score: ${err.message}`
    ));
  }
}

/**
 * Calculate quick score without full breakdown
 * Useful for previews and lists
 */
export function calculateQuickScore(
  mentionRate: number,
  averagePosition: number | null,
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
): number {
  // Base score from mention rate (0-60 points)
  let score = mentionRate * 60;

  // Position bonus (0-25 points)
  if (averagePosition !== null) {
    const positionScore = Math.max(0, 25 - (averagePosition - 1) * 5);
    score += positionScore;
  } else if (mentionRate > 0) {
    score += 10;
  }

  // Sentiment modifier (0-15 points)
  const sentimentModifiers: Record<string, number> = {
    positive: 15,
    neutral: 10,
    mixed: 5,
    negative: 0,
  };
  score += sentimentModifiers[sentiment] || 0;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Compare two scores and generate comparison insights
 */
export function compareScores(
  current: ScoreResult,
  previous: ScoreResult
): {
  scoreDelta: number;
  percentChange: number;
  improved: boolean;
  categoryChanges: Array<{
    category: ScoreCategory;
    delta: number;
    direction: 'up' | 'down' | 'stable';
  }>;
  summary: string;
} {
  const scoreDelta = current.overallScore - previous.overallScore;
  const percentChange = previous.overallScore > 0
    ? (scoreDelta / previous.overallScore) * 100
    : 0;

  const categoryChanges = current.categories.map(currentCat => {
    const previousCat = previous.categories.find(p => p.category === currentCat.category);
    const delta = previousCat ? currentCat.score - previousCat.score : 0;

    return {
      category: currentCat.category,
      delta,
      direction: delta > 2 ? 'up' as const : delta < -2 ? 'down' as const : 'stable' as const,
    };
  });

  const improved = scoreDelta > 0;
  const summary = improved
    ? `Score improved by ${scoreDelta} points (${percentChange.toFixed(1)}%)`
    : scoreDelta < 0
      ? `Score decreased by ${Math.abs(scoreDelta)} points (${Math.abs(percentChange).toFixed(1)}%)`
      : 'Score remained stable';

  return {
    scoreDelta,
    percentChange,
    improved,
    categoryChanges,
    summary,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  calculateScore,
  calculateQuickScore,
  compareScores,
  getGradeFromScore,
  getGradeLabel,
  getGradeColor,
  CATEGORY_WEIGHTS,
  CATEGORY_NAMES,
  ALGORITHM_VERSION,
};
