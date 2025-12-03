/**
 * Cross-Model Verification Service
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Compare claims across different AI providers (GPT vs Claude vs Gemini)
 * - Calculate inter-model agreement metrics (Fleiss' Kappa)
 * - Detect contradictions and inconsistencies
 * - Flag claims that need human review
 * - Track model behavioral differences
 */

// ============================================================================
// TYPES
// ============================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface ModelClaim {
  id: string;
  provider: AIProvider;
  modelVersion: string;
  claim: string;
  confidence: number;
  category: ClaimCategory;
  entities: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
  timestamp: string;
}

export type ClaimCategory =
  | 'brand_perception'
  | 'market_position'
  | 'competitor_mention'
  | 'feature_description'
  | 'recommendation'
  | 'factual_statement'
  | 'opinion'
  | 'other';

export interface VerificationResult {
  claimId: string;
  originalClaim: ModelClaim;
  comparisons: ClaimComparison[];
  agreement: AgreementLevel;
  agreementScore: number;
  contradictions: Contradiction[];
  consensusClaim?: string;
  needsHumanReview: boolean;
  reviewReasons: string[];
}

export interface ClaimComparison {
  provider: AIProvider;
  modelVersion: string;
  matchedClaim?: ModelClaim;
  similarity: number;
  matchType: 'exact' | 'similar' | 'partial' | 'different' | 'contradicting' | 'not_found';
  details?: string;
}

export interface Contradiction {
  claimA: ModelClaim;
  claimB: ModelClaim;
  type: ContradictionType;
  severity: 'minor' | 'moderate' | 'major';
  description: string;
}

export type ContradictionType =
  | 'factual_disagreement'
  | 'sentiment_mismatch'
  | 'entity_confusion'
  | 'temporal_inconsistency'
  | 'quantitative_difference'
  | 'opinion_divergence';

export type AgreementLevel = 'full' | 'substantial' | 'moderate' | 'fair' | 'slight' | 'none';

export interface CrossModelReport {
  brandId: string;
  brandName: string;
  analysisId: string;
  providers: AIProvider[];
  totalClaims: number;
  verifiedClaims: number;
  contradictions: number;
  agreementMetrics: AgreementMetrics;
  claimsByCategory: Map<ClaimCategory, CategoryReport>;
  needsReviewCount: number;
  timestamp: string;
}

export interface AgreementMetrics {
  fleissKappa: number;
  interpretation: string;
  pairwiseAgreement: Map<string, number>;
  overallConsensus: number;
}

export interface CategoryReport {
  category: ClaimCategory;
  claimCount: number;
  agreementScore: number;
  contradictionCount: number;
}

// ============================================================================
// FLEISS' KAPPA CALCULATION
// ============================================================================

/**
 * Calculate Fleiss' Kappa for inter-rater agreement
 *
 * @param ratings - Matrix where rows are subjects and columns are categories
 *                  Each cell contains the number of raters who assigned that category
 * @returns Fleiss' Kappa coefficient (-1 to 1)
 */
export function calculateFleissKappa(ratings: number[][]): number {
  const n = ratings.length; // Number of subjects
  if (n === 0) return 0;

  const k = ratings[0].length; // Number of categories
  if (k === 0) return 0;

  // Total number of ratings per subject
  const N = ratings[0].reduce((sum, val) => sum + val, 0);
  if (N <= 1) return 0;

  // Calculate P_i for each subject (proportion of agreeing pairs)
  const P_i = ratings.map(row => {
    const sumSquared = row.reduce((sum, val) => sum + val * val, 0);
    return (sumSquared - N) / (N * (N - 1));
  });

  // Calculate P_bar (mean of P_i)
  const P_bar = P_i.reduce((sum, p) => sum + p, 0) / n;

  // Calculate p_j for each category (proportion of all ratings in category j)
  const p_j = Array(k).fill(0);
  for (let j = 0; j < k; j++) {
    for (let i = 0; i < n; i++) {
      p_j[j] += ratings[i][j];
    }
    p_j[j] /= (n * N);
  }

  // Calculate P_e (expected agreement by chance)
  const P_e = p_j.reduce((sum, p) => sum + p * p, 0);

  // Calculate Kappa
  if (P_e === 1) return 1; // Perfect agreement expected by chance

  const kappa = (P_bar - P_e) / (1 - P_e);
  return Math.max(-1, Math.min(1, kappa)); // Clamp to [-1, 1]
}

/**
 * Interpret Fleiss' Kappa value
 */
export function interpretKappa(kappa: number): string {
  if (kappa < 0) return 'Less than chance agreement';
  if (kappa < 0.20) return 'Slight agreement';
  if (kappa < 0.40) return 'Fair agreement';
  if (kappa < 0.60) return 'Moderate agreement';
  if (kappa < 0.80) return 'Substantial agreement';
  return 'Almost perfect agreement';
}

/**
 * Map kappa to agreement level
 */
export function kappaToAgreementLevel(kappa: number): AgreementLevel {
  if (kappa >= 0.80) return 'full';
  if (kappa >= 0.60) return 'substantial';
  if (kappa >= 0.40) return 'moderate';
  if (kappa >= 0.20) return 'fair';
  if (kappa >= 0) return 'slight';
  return 'none';
}

// ============================================================================
// SIMILARITY CALCULATION
// ============================================================================

/**
 * Calculate Jaccard similarity between two sets of tokens
 */
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

/**
 * Tokenize text for comparison
 */
export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2)
  );
}

/**
 * Calculate semantic similarity between two claims
 * Uses token-based similarity as a simple approximation
 */
export function calculateClaimSimilarity(claimA: string, claimB: string): number {
  const tokensA = tokenize(claimA);
  const tokensB = tokenize(claimB);
  return jaccardSimilarity(tokensA, tokensB);
}

/**
 * Determine match type based on similarity score
 */
export function determineMatchType(
  similarity: number,
  sentimentMatch: boolean
): 'exact' | 'similar' | 'partial' | 'different' | 'contradicting' {
  if (similarity >= 0.9) return 'exact';
  if (similarity >= 0.7) return 'similar';
  if (similarity >= 0.4) return 'partial';
  if (!sentimentMatch && similarity < 0.3) return 'contradicting';
  return 'different';
}

// ============================================================================
// CROSS-MODEL VERIFICATION SERVICE
// ============================================================================

export interface VerificationServiceConfig {
  similarityThreshold: number;
  reviewThresholds: {
    minAgreement: number;
    maxContradictions: number;
    minConfidence: number;
  };
  providers: AIProvider[];
}

export const DEFAULT_VERIFICATION_CONFIG: VerificationServiceConfig = {
  similarityThreshold: 0.5,
  reviewThresholds: {
    minAgreement: 0.6,
    maxContradictions: 2,
    minConfidence: 0.7,
  },
  providers: ['openai', 'anthropic', 'google', 'perplexity'],
};

/**
 * Verify a claim against responses from other models
 */
export function verifyClaim(
  claim: ModelClaim,
  otherClaims: ModelClaim[],
  config: VerificationServiceConfig = DEFAULT_VERIFICATION_CONFIG
): VerificationResult {
  const comparisons: ClaimComparison[] = [];
  const contradictions: Contradiction[] = [];
  const reviewReasons: string[] = [];

  // Compare with claims from each other provider
  for (const provider of config.providers) {
    if (provider === claim.provider) continue;

    const providerClaims = otherClaims.filter(c => c.provider === provider);

    if (providerClaims.length === 0) {
      comparisons.push({
        provider,
        modelVersion: 'unknown',
        similarity: 0,
        matchType: 'not_found',
        details: 'No claims from this provider',
      });
      continue;
    }

    // Find best matching claim
    let bestMatch: ModelClaim | undefined;
    let bestSimilarity = 0;

    for (const otherClaim of providerClaims) {
      const similarity = calculateClaimSimilarity(claim.claim, otherClaim.claim);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = otherClaim;
      }
    }

    const sentimentMatch = bestMatch?.sentiment === claim.sentiment;
    const matchType = determineMatchType(bestSimilarity, sentimentMatch);

    comparisons.push({
      provider,
      modelVersion: bestMatch?.modelVersion || 'unknown',
      matchedClaim: bestMatch,
      similarity: bestSimilarity,
      matchType,
      details: matchType === 'contradicting'
        ? 'Potential contradiction detected'
        : undefined,
    });

    // Detect contradictions
    if (matchType === 'contradicting' && bestMatch) {
      const contradiction = detectContradiction(claim, bestMatch);
      if (contradiction) {
        contradictions.push(contradiction);
      }
    }
  }

  // Calculate agreement score
  const agreementScores: number[] = comparisons
    .filter(c => c.matchType !== 'not_found')
    .map(c => {
      switch (c.matchType) {
        case 'exact': return 1;
        case 'similar': return 0.8;
        case 'partial': return 0.5;
        case 'different': return 0.2;
        case 'contradicting': return 0;
        default: return 0;
      }
    });

  const agreementScore = agreementScores.length > 0
    ? agreementScores.reduce((a, b) => a + b, 0) / agreementScores.length
    : 0;

  const agreement = kappaToAgreementLevel(agreementScore);

  // Determine if human review is needed
  let needsHumanReview = false;

  if (agreementScore < config.reviewThresholds.minAgreement) {
    needsHumanReview = true;
    reviewReasons.push(`Low agreement score (${(agreementScore * 100).toFixed(1)}%)`);
  }

  if (contradictions.length > config.reviewThresholds.maxContradictions) {
    needsHumanReview = true;
    reviewReasons.push(`Multiple contradictions detected (${contradictions.length})`);
  }

  if (claim.confidence < config.reviewThresholds.minConfidence) {
    needsHumanReview = true;
    reviewReasons.push(`Low confidence claim (${(claim.confidence * 100).toFixed(1)}%)`);
  }

  // Generate consensus claim if agreement is substantial
  const consensusClaim = agreementScore >= 0.6 ? generateConsensusClaim(claim, comparisons) : undefined;

  return {
    claimId: claim.id,
    originalClaim: claim,
    comparisons,
    agreement,
    agreementScore,
    contradictions,
    consensusClaim,
    needsHumanReview,
    reviewReasons,
  };
}

/**
 * Detect specific type of contradiction between two claims
 */
function detectContradiction(claimA: ModelClaim, claimB: ModelClaim): Contradiction | null {
  // Sentiment mismatch
  if (claimA.sentiment && claimB.sentiment && claimA.sentiment !== claimB.sentiment) {
    const isOpposite =
      (claimA.sentiment === 'positive' && claimB.sentiment === 'negative') ||
      (claimA.sentiment === 'negative' && claimB.sentiment === 'positive');

    return {
      claimA,
      claimB,
      type: 'sentiment_mismatch',
      severity: isOpposite ? 'major' : 'moderate',
      description: `${claimA.provider} says "${claimA.sentiment}" while ${claimB.provider} says "${claimB.sentiment}"`,
    };
  }

  // Entity confusion (different entities mentioned)
  const entitiesA = new Set(claimA.entities);
  const entitiesB = new Set(claimB.entities);
  const commonEntities = new Set([...entitiesA].filter(e => entitiesB.has(e)));

  if (commonEntities.size === 0 && (entitiesA.size > 0 || entitiesB.size > 0)) {
    return {
      claimA,
      claimB,
      type: 'entity_confusion',
      severity: 'moderate',
      description: 'Claims reference different entities',
    };
  }

  // Default factual disagreement
  return {
    claimA,
    claimB,
    type: 'factual_disagreement',
    severity: 'moderate',
    description: 'Models provide conflicting information',
  };
}

/**
 * Generate a consensus claim from matching claims
 */
function generateConsensusClaim(originalClaim: ModelClaim, comparisons: ClaimComparison[]): string {
  const matchingClaims = comparisons
    .filter(c => c.matchType === 'exact' || c.matchType === 'similar')
    .map(c => c.matchedClaim?.claim)
    .filter((c): c is string => c !== undefined);

  if (matchingClaims.length === 0) {
    return originalClaim.claim;
  }

  // For now, return the original claim if there's agreement
  // In production, this could use more sophisticated merging
  return originalClaim.claim;
}

// ============================================================================
// CROSS-MODEL REPORT GENERATION
// ============================================================================

/**
 * Generate a comprehensive cross-model verification report
 */
export function generateCrossModelReport(
  brandId: string,
  brandName: string,
  analysisId: string,
  claimsByProvider: Map<AIProvider, ModelClaim[]>,
  config: VerificationServiceConfig = DEFAULT_VERIFICATION_CONFIG
): CrossModelReport {
  const allClaims: ModelClaim[] = [];
  const providers: AIProvider[] = [];

  claimsByProvider.forEach((claims, provider) => {
    allClaims.push(...claims);
    providers.push(provider);
  });

  const verificationResults: VerificationResult[] = [];
  const processedClaimIds = new Set<string>();

  // Verify each claim
  for (const claim of allClaims) {
    if (processedClaimIds.has(claim.id)) continue;
    processedClaimIds.add(claim.id);

    const otherClaims = allClaims.filter(c => c.id !== claim.id);
    const result = verifyClaim(claim, otherClaims, config);
    verificationResults.push(result);
  }

  // Calculate agreement metrics
  const agreementMetrics = calculateAgreementMetrics(verificationResults, providers);

  // Group by category
  const claimsByCategory = new Map<ClaimCategory, CategoryReport>();
  const categories: ClaimCategory[] = [
    'brand_perception',
    'market_position',
    'competitor_mention',
    'feature_description',
    'recommendation',
    'factual_statement',
    'opinion',
    'other',
  ];

  for (const category of categories) {
    const categoryClaims = verificationResults.filter(
      r => r.originalClaim.category === category
    );

    if (categoryClaims.length > 0) {
      const avgAgreement = categoryClaims.reduce((sum, r) => sum + r.agreementScore, 0) / categoryClaims.length;
      const contradictionCount = categoryClaims.reduce((sum, r) => sum + r.contradictions.length, 0);

      claimsByCategory.set(category, {
        category,
        claimCount: categoryClaims.length,
        agreementScore: avgAgreement,
        contradictionCount,
      });
    }
  }

  const totalContradictions = verificationResults.reduce(
    (sum, r) => sum + r.contradictions.length,
    0
  );

  const needsReviewCount = verificationResults.filter(r => r.needsHumanReview).length;

  return {
    brandId,
    brandName,
    analysisId,
    providers,
    totalClaims: allClaims.length,
    verifiedClaims: verificationResults.length,
    contradictions: totalContradictions,
    agreementMetrics,
    claimsByCategory,
    needsReviewCount,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Calculate comprehensive agreement metrics
 */
function calculateAgreementMetrics(
  results: VerificationResult[],
  providers: AIProvider[]
): AgreementMetrics {
  if (results.length === 0 || providers.length < 2) {
    return {
      fleissKappa: 0,
      interpretation: 'Insufficient data',
      pairwiseAgreement: new Map(),
      overallConsensus: 0,
    };
  }

  // Build ratings matrix for Fleiss' Kappa
  // Each claim is rated by providers as: agree (1) or disagree (0)
  const ratingMatrix: number[][] = results.map(result => {
    const ratings = [0, 0]; // [disagree, agree]

    // Original claim counts as agree
    ratings[1]++;

    // Count matches from other providers
    result.comparisons.forEach(comparison => {
      if (comparison.matchType === 'exact' || comparison.matchType === 'similar') {
        ratings[1]++;
      } else if (comparison.matchType !== 'not_found') {
        ratings[0]++;
      }
    });

    return ratings;
  });

  const fleissKappa = calculateFleissKappa(ratingMatrix);

  // Calculate pairwise agreement
  const pairwiseAgreement = new Map<string, number>();
  for (let i = 0; i < providers.length; i++) {
    for (let j = i + 1; j < providers.length; j++) {
      const providerA = providers[i];
      const providerB = providers[j];
      const key = `${providerA}-${providerB}`;

      const pairResults = results.map(r => {
        const compA = r.originalClaim.provider === providerA;
        const compB = r.comparisons.find(c => c.provider === providerB);

        if (compA && compB) {
          return compB.matchType === 'exact' || compB.matchType === 'similar' ? 1 : 0;
        }
        return null;
      }).filter(v => v !== null) as number[];

      if (pairResults.length > 0) {
        const agreement = pairResults.reduce((a, b) => a + b, 0) / pairResults.length;
        pairwiseAgreement.set(key, agreement);
      }
    }
  }

  const overallConsensus = results.reduce((sum, r) => sum + r.agreementScore, 0) / results.length;

  return {
    fleissKappa,
    interpretation: interpretKappa(fleissKappa),
    pairwiseAgreement,
    overallConsensus,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  verifyClaim,
  generateCrossModelReport,
  calculateFleissKappa,
  interpretKappa,
  kappaToAgreementLevel,
  calculateClaimSimilarity,
  jaccardSimilarity,
  tokenize,
  DEFAULT_VERIFICATION_CONFIG,
};
