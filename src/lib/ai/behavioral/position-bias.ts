/**
 * Position Bias Mitigation
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Randomized brand ordering in queries
 * - Position bias detection
 * - Debiasing strategies
 * - Statistical analysis of position effects
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BrandPosition {
  brandName: string;
  position: number;  // 1-indexed position in query
  mentioned: boolean;
  recommended: boolean;
  score: number;
}

export interface PositionBiasResult {
  queryId: string;
  provider: string;
  originalOrder: string[];
  shuffledOrder: string[];
  results: BrandPosition[];
  biasDetected: boolean;
  biasScore: number;  // 0-1, higher = more bias
  biasType: 'primacy' | 'recency' | 'none';
  confidence: number;
}

export interface PositionBiasAnalysis {
  totalQueries: number;
  queriesWithBias: number;
  averageBiasScore: number;
  primacyBiasRate: number;  // Rate of first-position preference
  recencyBiasRate: number;  // Rate of last-position preference
  byProvider: Record<string, {
    averageBiasScore: number;
    biasType: 'primacy' | 'recency' | 'none';
  }>;
  recommendations: string[];
}

export interface ShuffleConfig {
  seed?: number;           // For reproducibility
  preserveTarget?: boolean; // Keep target brand in random position
  minShuffles?: number;    // Minimum times to shuffle
}

// ============================================================================
// SHUFFLING & RANDOMIZATION
// ============================================================================

/**
 * Fisher-Yates shuffle with optional seed for reproducibility
 */
export function shuffleArray<T>(array: T[], seed?: number): T[] {
  const result = [...array];
  let random = seed !== undefined ? seededRandom(seed) : Math.random;

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

/**
 * Seeded random number generator (LCG)
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generate multiple shuffled orderings for bias testing
 */
export function generateShuffledOrderings(
  brands: string[],
  count: number = 5,
  config: ShuffleConfig = {}
): string[][] {
  const orderings: string[][] = [];
  const baseSeed = config.seed ?? Date.now();

  for (let i = 0; i < count; i++) {
    orderings.push(shuffleArray(brands, baseSeed + i));
  }

  return orderings;
}

/**
 * Create a query with randomized brand order
 */
export function createDebiasedQuery(
  baseQuery: string,
  brands: string[],
  config: ShuffleConfig = {}
): { query: string; order: string[] } {
  const shuffled = shuffleArray(brands, config.seed);

  // Replace brand mentions in query with shuffled order
  let query = baseQuery;

  // If query doesn't contain specific brands, append them
  const hasBrands = brands.some(b => baseQuery.toLowerCase().includes(b.toLowerCase()));

  if (!hasBrands) {
    query = `${baseQuery} Consider these options: ${shuffled.join(', ')}.`;
  }

  return { query, order: shuffled };
}

// ============================================================================
// BIAS DETECTION
// ============================================================================

/**
 * Analyze position bias from multiple query results
 */
export function detectPositionBias(
  results: PositionBiasResult[]
): PositionBiasAnalysis {
  if (results.length === 0) {
    return {
      totalQueries: 0,
      queriesWithBias: 0,
      averageBiasScore: 0,
      primacyBiasRate: 0,
      recencyBiasRate: 0,
      byProvider: {},
      recommendations: ['No data available for analysis'],
    };
  }

  const queriesWithBias = results.filter(r => r.biasDetected);
  const primacyBias = results.filter(r => r.biasType === 'primacy');
  const recencyBias = results.filter(r => r.biasType === 'recency');

  // Group by provider
  const byProvider: Record<string, PositionBiasResult[]> = {};
  for (const result of results) {
    if (!byProvider[result.provider]) {
      byProvider[result.provider] = [];
    }
    byProvider[result.provider].push(result);
  }

  const providerAnalysis: Record<string, { averageBiasScore: number; biasType: 'primacy' | 'recency' | 'none' }> = {};

  for (const [provider, providerResults] of Object.entries(byProvider)) {
    const avgScore = providerResults.reduce((sum, r) => sum + r.biasScore, 0) / providerResults.length;
    const primacy = providerResults.filter(r => r.biasType === 'primacy').length;
    const recency = providerResults.filter(r => r.biasType === 'recency').length;

    let biasType: 'primacy' | 'recency' | 'none' = 'none';
    if (primacy > recency && primacy > providerResults.length * 0.3) {
      biasType = 'primacy';
    } else if (recency > primacy && recency > providerResults.length * 0.3) {
      biasType = 'recency';
    }

    providerAnalysis[provider] = { averageBiasScore: avgScore, biasType };
  }

  // Generate recommendations
  const recommendations: string[] = [];
  const avgBias = results.reduce((sum, r) => sum + r.biasScore, 0) / results.length;

  if (avgBias > 0.5) {
    recommendations.push('High position bias detected - implement query shuffling for all analyses');
  }

  if (primacyBias.length > results.length * 0.4) {
    recommendations.push('Primacy bias detected - avoid placing target brand first in queries');
  }

  if (recencyBias.length > results.length * 0.4) {
    recommendations.push('Recency bias detected - avoid placing target brand last in queries');
  }

  for (const [provider, analysis] of Object.entries(providerAnalysis)) {
    if (analysis.averageBiasScore > 0.6) {
      recommendations.push(`${provider} shows significant position bias (${(analysis.averageBiasScore * 100).toFixed(0)}%) - consider weighted averaging`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Position bias is within acceptable limits');
  }

  return {
    totalQueries: results.length,
    queriesWithBias: queriesWithBias.length,
    averageBiasScore: avgBias,
    primacyBiasRate: primacyBias.length / results.length,
    recencyBiasRate: recencyBias.length / results.length,
    byProvider: providerAnalysis,
    recommendations,
  };
}

/**
 * Calculate bias score from brand positions
 */
export function calculateBiasScore(positions: BrandPosition[]): {
  score: number;
  type: 'primacy' | 'recency' | 'none';
} {
  if (positions.length < 2) {
    return { score: 0, type: 'none' };
  }

  // Calculate correlation between position and recommendation/score
  const recommended = positions.filter(p => p.recommended);

  if (recommended.length === 0) {
    return { score: 0, type: 'none' };
  }

  // Check primacy bias (first positions favored)
  const firstHalf = positions.slice(0, Math.ceil(positions.length / 2));
  const secondHalf = positions.slice(Math.ceil(positions.length / 2));

  const firstHalfRecommended = firstHalf.filter(p => p.recommended).length / firstHalf.length;
  const secondHalfRecommended = secondHalf.filter(p => p.recommended).length / secondHalf.length;

  const positionDiff = firstHalfRecommended - secondHalfRecommended;

  if (Math.abs(positionDiff) < 0.2) {
    return { score: Math.abs(positionDiff), type: 'none' };
  }

  if (positionDiff > 0) {
    return { score: positionDiff, type: 'primacy' };
  }

  return { score: Math.abs(positionDiff), type: 'recency' };
}

/**
 * Run position bias test with multiple orderings
 */
export async function runPositionBiasTest(
  brands: string[],
  queryTemplate: string,
  provider: string,
  queryFn: (query: string) => Promise<{ mentioned: boolean; recommended: boolean; score: number }[]>,
  numTrials: number = 5
): Promise<PositionBiasResult[]> {
  const results: PositionBiasResult[] = [];
  const orderings = generateShuffledOrderings(brands, numTrials);

  for (let i = 0; i < numTrials; i++) {
    const order = orderings[i];
    const { query } = createDebiasedQuery(queryTemplate, order);

    try {
      const responses = await queryFn(query);

      const positions: BrandPosition[] = order.map((brand, idx) => ({
        brandName: brand,
        position: idx + 1,
        mentioned: responses[idx]?.mentioned ?? false,
        recommended: responses[idx]?.recommended ?? false,
        score: responses[idx]?.score ?? 0,
      }));

      const { score, type } = calculateBiasScore(positions);

      results.push({
        queryId: `bias_test_${i}_${Date.now()}`,
        provider,
        originalOrder: brands,
        shuffledOrder: order,
        results: positions,
        biasDetected: score > 0.3,
        biasScore: score,
        biasType: type,
        confidence: 0.8,  // Would be calculated from variance
      });
    } catch (error) {
      console.error(`Position bias test ${i} failed:`, error);
    }
  }

  return results;
}

// ============================================================================
// DEBIASING STRATEGIES
// ============================================================================

export type DebiasStrategy =
  | 'shuffle'           // Randomize order each time
  | 'round_robin'       // Rotate starting position
  | 'weighted_average'  // Average across multiple orderings
  | 'position_normalize'; // Adjust scores based on position

export interface DebiasConfig {
  strategy: DebiasStrategy;
  numSamples?: number;
  weights?: Record<number, number>;  // Position -> weight multiplier
}

/**
 * Apply debiasing strategy to query
 */
export function applyDebiasStrategy(
  brands: string[],
  queryTemplate: string,
  config: DebiasConfig
): { queries: string[]; orders: string[][] } {
  switch (config.strategy) {
    case 'shuffle':
      return applyShuffle(brands, queryTemplate, config.numSamples ?? 3);

    case 'round_robin':
      return applyRoundRobin(brands, queryTemplate);

    case 'weighted_average':
      return applyShuffle(brands, queryTemplate, config.numSamples ?? 5);

    case 'position_normalize':
      return applyShuffle(brands, queryTemplate, config.numSamples ?? 3);

    default:
      return { queries: [queryTemplate], orders: [brands] };
  }
}

function applyShuffle(
  brands: string[],
  queryTemplate: string,
  numSamples: number
): { queries: string[]; orders: string[][] } {
  const orders = generateShuffledOrderings(brands, numSamples);
  const queries = orders.map(order => createDebiasedQuery(queryTemplate, order).query);
  return { queries, orders };
}

function applyRoundRobin(
  brands: string[],
  queryTemplate: string
): { queries: string[]; orders: string[][] } {
  const orders: string[][] = [];

  for (let i = 0; i < brands.length; i++) {
    const rotated = [...brands.slice(i), ...brands.slice(0, i)];
    orders.push(rotated);
  }

  const queries = orders.map(order => createDebiasedQuery(queryTemplate, order).query);
  return { queries, orders };
}

/**
 * Aggregate scores from multiple debiased queries
 */
export function aggregateDebiasedScores(
  results: Array<{ brand: string; position: number; score: number }[]>,
  strategy: DebiasStrategy,
  positionWeights?: Record<number, number>
): Record<string, number> {
  const brandScores: Record<string, number[]> = {};

  for (const result of results) {
    for (const item of result) {
      if (!brandScores[item.brand]) {
        brandScores[item.brand] = [];
      }

      let score = item.score;

      // Apply position normalization if configured
      if (strategy === 'position_normalize' && positionWeights) {
        const weight = positionWeights[item.position] ?? 1;
        score = score * weight;
      }

      brandScores[item.brand].push(score);
    }
  }

  // Calculate final scores (mean)
  const finalScores: Record<string, number> = {};

  for (const [brand, scores] of Object.entries(brandScores)) {
    if (scores.length === 0) continue;
    finalScores[brand] = scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  return finalScores;
}

// ============================================================================
// POSITION NORMALIZATION WEIGHTS
// ============================================================================

/**
 * Default position weights to normalize for primacy/recency bias
 * Higher weight for middle positions, lower for first/last
 */
export const DEFAULT_POSITION_WEIGHTS: Record<number, number> = {
  1: 0.85,   // First position slightly penalized (primacy bias)
  2: 0.95,
  3: 1.0,
  4: 1.0,
  5: 0.95,
  6: 0.9,    // Last positions slightly penalized (recency can favor)
  7: 0.85,
  8: 0.8,
  9: 0.75,
  10: 0.7,
};

/**
 * Get position weight for normalization
 */
export function getPositionWeight(position: number, totalPositions: number): number {
  // Middle positions get weight 1.0
  // First and last positions get lower weights
  const midPoint = (totalPositions + 1) / 2;
  const distanceFromMid = Math.abs(position - midPoint);
  const maxDistance = midPoint - 1;

  if (maxDistance === 0) return 1.0;

  // Linear decay from center
  const decay = 0.15;  // Max 15% reduction at edges
  return 1.0 - (decay * (distanceFromMid / maxDistance));
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Shuffling
  shuffleArray,
  generateShuffledOrderings,
  createDebiasedQuery,

  // Bias detection
  detectPositionBias,
  calculateBiasScore,
  runPositionBiasTest,

  // Debiasing
  applyDebiasStrategy,
  aggregateDebiasedScores,
  getPositionWeight,

  // Constants
  DEFAULT_POSITION_WEIGHTS,
};
