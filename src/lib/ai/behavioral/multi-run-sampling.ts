/**
 * Multi-Run Sampling with Confidence Intervals
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Run same query N times for statistical analysis
 * - Calculate response variance and consistency
 * - Compute confidence intervals (95%)
 * - Detect outlier responses
 * - Aggregate consensus scores
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SamplingConfig {
  numRuns: number;           // Number of times to run the query
  temperature?: number;      // LLM temperature (higher = more variance)
  provider?: string;         // Which provider to use
  timeout?: number;          // Timeout per run (ms)
  retryOnError?: boolean;    // Retry failed runs
  maxRetries?: number;       // Max retries per run
}

export interface RunResult {
  runId: string;
  responseText: string;
  score?: number;           // Extracted numeric score if applicable
  tokens: number;
  latencyMs: number;
  timestamp: Date;
  error?: string;
}

export interface StatisticalAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    level: number;  // e.g., 0.95 for 95%
  };
  outliers: number[];
  iqr: number;        // Interquartile range
  coefficientOfVariation: number;  // CV = stdDev / mean
}

export interface ConsistencyAnalysis {
  textSimilarityScore: number;     // How similar are the responses (0-1)
  sentimentConsistency: number;    // Sentiment variance across runs
  keyFactConsistency: number;      // Key facts mentioned consistently
  structureConsistency: number;    // Similar structure/format
  overallConsistency: 'high' | 'medium' | 'low';
}

export interface MultiRunResult {
  query: string;
  config: SamplingConfig;
  runs: RunResult[];
  successfulRuns: number;
  failedRuns: number;
  statistics?: StatisticalAnalysis;
  consistency: ConsistencyAnalysis;
  consensusScore?: number;         // If numeric, the "consensus" score
  consensusResponse?: string;      // Representative response
  recommendations: string[];
  executionTimeMs: number;
}

// ============================================================================
// STATISTICAL FUNCTIONS
// ============================================================================

/**
 * Calculate mean of array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[], meanValue?: number): number {
  if (values.length <= 1) return 0;
  const avg = meanValue ?? mean(values);
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (idx - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Detect outliers using IQR method
 */
function detectOutliers(values: number[]): { outliers: number[]; iqr: number } {
  if (values.length < 4) return { outliers: [], iqr: 0 };

  const q1 = percentile(values, 25);
  const q3 = percentile(values, 75);
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  const outliers = values.filter(v => v < lowerBound || v > upperBound);

  return { outliers, iqr };
}

/**
 * Calculate 95% confidence interval
 */
function confidenceInterval(
  values: number[],
  level: number = 0.95
): { lower: number; upper: number; level: number } {
  if (values.length < 2) {
    const v = values[0] || 0;
    return { lower: v, upper: v, level };
  }

  const avg = mean(values);
  const s = stdDev(values, avg);
  const n = values.length;

  // t-value for 95% CI (approximation for small samples)
  const tValues: Record<number, number> = {
    2: 12.706, 3: 4.303, 4: 3.182, 5: 2.776,
    6: 2.571, 7: 2.447, 8: 2.365, 9: 2.306, 10: 2.262,
    15: 2.145, 20: 2.093, 30: 2.045, 100: 1.984,
  };

  // Find appropriate t-value
  let t = 1.96; // Default for large samples
  for (const [df, tv] of Object.entries(tValues)) {
    if (n - 1 <= parseInt(df)) {
      t = tv;
      break;
    }
  }

  const marginOfError = t * (s / Math.sqrt(n));

  return {
    lower: avg - marginOfError,
    upper: avg + marginOfError,
    level,
  };
}

/**
 * Perform full statistical analysis
 */
export function analyzeScores(scores: number[]): StatisticalAnalysis {
  if (scores.length === 0) {
    return {
      mean: 0, median: 0, stdDev: 0, variance: 0,
      min: 0, max: 0, range: 0,
      confidenceInterval: { lower: 0, upper: 0, level: 0.95 },
      outliers: [], iqr: 0, coefficientOfVariation: 0,
    };
  }

  const avg = mean(scores);
  const med = median(scores);
  const sd = stdDev(scores, avg);
  const { outliers, iqr } = detectOutliers(scores);
  const ci = confidenceInterval(scores);

  return {
    mean: Math.round(avg * 100) / 100,
    median: Math.round(med * 100) / 100,
    stdDev: Math.round(sd * 100) / 100,
    variance: Math.round(sd * sd * 100) / 100,
    min: Math.min(...scores),
    max: Math.max(...scores),
    range: Math.max(...scores) - Math.min(...scores),
    confidenceInterval: {
      lower: Math.round(ci.lower * 100) / 100,
      upper: Math.round(ci.upper * 100) / 100,
      level: 0.95,
    },
    outliers,
    iqr: Math.round(iqr * 100) / 100,
    coefficientOfVariation: avg !== 0 ? Math.round((sd / avg) * 100) / 100 : 0,
  };
}

// ============================================================================
// CONSISTENCY ANALYSIS
// ============================================================================

/**
 * Calculate Jaccard similarity between two sets of words
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 1;
}

/**
 * Extract key facts/entities from text (simplified)
 */
function extractKeyFacts(text: string): Set<string> {
  const facts = new Set<string>();

  // Extract capitalized words (likely entities)
  const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  let match;
  while ((match = entityPattern.exec(text)) !== null) {
    facts.add(match[1].toLowerCase());
  }

  // Extract numbers with context
  const numberPattern = /\b(\d+(?:\.\d+)?%?)\b/g;
  while ((match = numberPattern.exec(text)) !== null) {
    facts.add(match[1]);
  }

  // Extract quoted text
  const quotePattern = /"([^"]+)"/g;
  while ((match = quotePattern.exec(text)) !== null) {
    facts.add(match[1].toLowerCase());
  }

  return facts;
}

/**
 * Simple sentiment score (-1 to 1)
 */
function simpleSentiment(text: string): number {
  const positive = ['good', 'great', 'excellent', 'best', 'recommend', 'love', 'amazing', 'wonderful'];
  const negative = ['bad', 'poor', 'worst', 'terrible', 'avoid', 'hate', 'awful', 'disappointing'];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (positive.some(p => word.includes(p))) score += 0.1;
    if (negative.some(n => word.includes(n))) score -= 0.1;
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Analyze response consistency across runs
 */
export function analyzeConsistency(responses: string[]): ConsistencyAnalysis {
  if (responses.length === 0) {
    return {
      textSimilarityScore: 0,
      sentimentConsistency: 0,
      keyFactConsistency: 0,
      structureConsistency: 0,
      overallConsistency: 'low',
    };
  }

  if (responses.length === 1) {
    return {
      textSimilarityScore: 1,
      sentimentConsistency: 1,
      keyFactConsistency: 1,
      structureConsistency: 1,
      overallConsistency: 'high',
    };
  }

  // Text similarity (pairwise Jaccard on word sets)
  const wordSets = responses.map(r => new Set(r.toLowerCase().split(/\s+/)));
  let totalSimilarity = 0;
  let pairs = 0;

  for (let i = 0; i < wordSets.length - 1; i++) {
    for (let j = i + 1; j < wordSets.length; j++) {
      totalSimilarity += jaccardSimilarity(wordSets[i], wordSets[j]);
      pairs++;
    }
  }

  const textSimilarityScore = pairs > 0 ? totalSimilarity / pairs : 1;

  // Sentiment consistency
  const sentiments = responses.map(simpleSentiment);
  const sentimentStdDev = stdDev(sentiments);
  const sentimentConsistency = Math.max(0, 1 - sentimentStdDev);

  // Key fact consistency
  const factSets = responses.map(extractKeyFacts);
  const commonFacts = factSets.reduce((acc, set) => {
    if (acc.size === 0) return new Set(set);
    return new Set([...acc].filter(x => set.has(x)));
  }, new Set<string>());

  const allFacts = factSets.reduce((acc, set) => {
    return new Set([...acc, ...set]);
  }, new Set<string>());

  const keyFactConsistency = allFacts.size > 0 ? commonFacts.size / allFacts.size : 1;

  // Structure consistency (length variance)
  const lengths = responses.map(r => r.length);
  const avgLength = mean(lengths);
  const lengthCV = avgLength > 0 ? stdDev(lengths) / avgLength : 0;
  const structureConsistency = Math.max(0, 1 - lengthCV);

  // Overall consistency
  const avgConsistency = (textSimilarityScore + sentimentConsistency + keyFactConsistency + structureConsistency) / 4;
  let overallConsistency: 'high' | 'medium' | 'low';
  if (avgConsistency >= 0.7) overallConsistency = 'high';
  else if (avgConsistency >= 0.4) overallConsistency = 'medium';
  else overallConsistency = 'low';

  return {
    textSimilarityScore: Math.round(textSimilarityScore * 100) / 100,
    sentimentConsistency: Math.round(sentimentConsistency * 100) / 100,
    keyFactConsistency: Math.round(keyFactConsistency * 100) / 100,
    structureConsistency: Math.round(structureConsistency * 100) / 100,
    overallConsistency,
  };
}

// ============================================================================
// CONSENSUS FUNCTIONS
// ============================================================================

/**
 * Find the most representative response (closest to centroid)
 */
export function findConsensusResponse(responses: string[]): string | undefined {
  if (responses.length === 0) return undefined;
  if (responses.length === 1) return responses[0];

  // Find response with highest average similarity to others
  const wordSets = responses.map(r => new Set(r.toLowerCase().split(/\s+/)));

  let bestIdx = 0;
  let bestAvgSimilarity = 0;

  for (let i = 0; i < responses.length; i++) {
    let totalSim = 0;
    for (let j = 0; j < responses.length; j++) {
      if (i !== j) {
        totalSim += jaccardSimilarity(wordSets[i], wordSets[j]);
      }
    }
    const avgSim = totalSim / (responses.length - 1);
    if (avgSim > bestAvgSimilarity) {
      bestAvgSimilarity = avgSim;
      bestIdx = i;
    }
  }

  return responses[bestIdx];
}

/**
 * Extract score from response text (if present)
 */
export function extractScoreFromResponse(response: string): number | undefined {
  // Look for common score patterns
  const patterns = [
    /\bscore[:\s]+(\d+(?:\.\d+)?)/i,
    /\b(\d+(?:\.\d+)?)\s*(?:out of|\/)\s*(?:10|100)/i,
    /\brating[:\s]+(\d+(?:\.\d+)?)/i,
    /\b(\d+(?:\.\d+)?)\s*(?:points?|stars?)/i,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      const score = parseFloat(match[1]);
      // Normalize to 0-100 if appears to be out of 10
      if (score <= 10 && !response.includes('/100')) {
        return score * 10;
      }
      return score;
    }
  }

  return undefined;
}

// ============================================================================
// MAIN SAMPLING FUNCTION
// ============================================================================

// Mock LLM call - in production would call actual provider
async function mockLLMCall(
  query: string,
  config: SamplingConfig
): Promise<{ text: string; tokens: number; latencyMs: number }> {
  const startTime = Date.now();

  // Simulate varying responses based on temperature
  const baseScore = 75;
  const variance = (config.temperature || 0.7) * 20;
  const score = Math.round(baseScore + (Math.random() - 0.5) * 2 * variance);

  const responses = [
    `Based on my analysis, the brand has a visibility score of ${score}/100. Key factors include strong market presence and positive customer sentiment.`,
    `The brand scores ${score} out of 100 in terms of AI visibility. Notable strengths are brand recognition and consistent messaging.`,
    `After evaluating multiple factors, I would rate this brand at ${score}/100 for AI perception. The brand maintains good online presence.`,
    `Score: ${score}/100. The brand demonstrates solid visibility across AI platforms with room for improvement in certain areas.`,
    `My assessment gives this brand a ${score}/100 visibility score. Strong brand identity and customer engagement contribute to this rating.`,
  ];

  const text = responses[Math.floor(Math.random() * responses.length)];
  const tokens = text.split(/\s+/).length;

  // Simulate latency
  await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  return {
    text,
    tokens,
    latencyMs: Date.now() - startTime,
  };
}

/**
 * Execute multi-run sampling
 */
export async function executeMultiRunSampling(
  query: string,
  config: SamplingConfig
): Promise<MultiRunResult> {
  const startTime = Date.now();
  const runs: RunResult[] = [];

  for (let i = 0; i < config.numRuns; i++) {
    const runId = `run_${i + 1}_${Date.now()}`;

    try {
      const result = await mockLLMCall(query, config);
      const score = extractScoreFromResponse(result.text);

      runs.push({
        runId,
        responseText: result.text,
        score,
        tokens: result.tokens,
        latencyMs: result.latencyMs,
        timestamp: new Date(),
      });
    } catch (error) {
      runs.push({
        runId,
        responseText: '',
        tokens: 0,
        latencyMs: 0,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const successfulRuns = runs.filter(r => !r.error);
  const failedRuns = runs.filter(r => r.error);

  // Statistical analysis on scores
  const scores = successfulRuns.map(r => r.score).filter((s): s is number => s !== undefined);
  const statistics = scores.length >= 2 ? analyzeScores(scores) : undefined;

  // Consistency analysis on responses
  const responses = successfulRuns.map(r => r.responseText);
  const consistency = analyzeConsistency(responses);

  // Find consensus
  const consensusScore = statistics ? statistics.median : scores[0];
  const consensusResponse = findConsensusResponse(responses);

  // Generate recommendations
  const recommendations: string[] = [];

  if (statistics) {
    if (statistics.coefficientOfVariation > 0.15) {
      recommendations.push('High score variance detected. Consider reducing temperature or refining prompt.');
    }
    if (statistics.outliers.length > 0) {
      recommendations.push(`${statistics.outliers.length} outlier response(s) detected. Review for prompt ambiguity.`);
    }
  }

  if (consistency.overallConsistency === 'low') {
    recommendations.push('Low response consistency. Consider adding more specific instructions to the prompt.');
  }

  if (failedRuns.length > 0) {
    recommendations.push(`${failedRuns.length} run(s) failed. Check provider status and rate limits.`);
  }

  if (recommendations.length === 0) {
    recommendations.push('Responses show good consistency and reliability.');
  }

  return {
    query,
    config,
    runs,
    successfulRuns: successfulRuns.length,
    failedRuns: failedRuns.length,
    statistics,
    consistency,
    consensusScore,
    consensusResponse,
    recommendations,
    executionTimeMs: Date.now() - startTime,
  };
}

/**
 * Get summary for display
 */
export function getMultiRunSummary(result: MultiRunResult): string {
  const parts: string[] = [
    `${result.successfulRuns}/${result.config.numRuns} runs successful`,
  ];

  if (result.statistics) {
    parts.push(`Score: ${result.consensusScore} (CI: ${result.statistics.confidenceInterval.lower}-${result.statistics.confidenceInterval.upper})`);
    parts.push(`CV: ${(result.statistics.coefficientOfVariation * 100).toFixed(1)}%`);
  }

  parts.push(`Consistency: ${result.consistency.overallConsistency}`);

  return parts.join(' | ');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  executeMultiRunSampling,
  analyzeScores,
  analyzeConsistency,
  findConsensusResponse,
  extractScoreFromResponse,
  getMultiRunSummary,
};
