/**
 * Behavioral Fingerprints per Provider
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Unique behavioral signatures for each AI provider
 * - Response style analysis
 * - Bias patterns
 * - Consistency metrics
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResponseStyle {
  averageLength: number;           // Average response length in chars
  lengthVariance: number;          // How consistent is length
  sentenceComplexity: number;      // Average words per sentence
  vocabularyRichness: number;      // Unique words / total words
  formalityScore: number;          // 0-1, formal vs casual
  hedgingFrequency: number;        // Rate of hedge words
  confidenceLevel: number;         // Average stated confidence
  listUsageRate: number;           // Rate of bullet/numbered lists
  codeUsageRate: number;           // Rate of code blocks
}

export interface BiasProfile {
  positionBias: 'primacy' | 'recency' | 'none';
  positionBiasStrength: number;
  brandFavoritism: string[];       // Brands mentioned more often
  industryBias: Record<string, number>;  // Industry mention rates
  sentimentBias: 'positive' | 'negative' | 'neutral';
  sentimentBiasStrength: number;
  lengthBiasTowardComplex: boolean;
}

export interface ConsistencyMetrics {
  scoreStability: number;          // How stable are scores for same query
  semanticConsistency: number;     // Similarity of repeated responses
  factualConsistency: number;      // Rate of contradictions
  temporalStability: number;       // Consistency over time
  crossQueryConsistency: number;   // Similar answers for similar queries
}

export interface ProviderBehavioralFingerprint {
  providerId: string;
  providerName: string;
  model: string;
  sampleSize: number;
  lastUpdated: Date;
  responseStyle: ResponseStyle;
  biasProfile: BiasProfile;
  consistency: ConsistencyMetrics;
  uniqueTraits: string[];
  comparisonToBaseline: {
    moreConcise: boolean;
    moreConfident: boolean;
    moreFormal: boolean;
    moreConsistent: boolean;
  };
}

export interface FingerprintComparison {
  provider1: string;
  provider2: string;
  similarities: string[];
  differences: string[];
  overallSimilarity: number;  // 0-1
  recommendedUseCase: {
    provider1: string[];
    provider2: string[];
  };
}

// ============================================================================
// STORAGE
// ============================================================================

const fingerprintRegistry = new Map<string, ProviderBehavioralFingerprint>();
const responseHistory = new Map<string, Array<{
  response: string;
  score: number;
  timestamp: Date;
  queryType: string;
}>>();

// ============================================================================
// FINGERPRINT GENERATION
// ============================================================================

/**
 * Record a response for fingerprint analysis
 */
export function recordResponse(
  provider: string,
  response: string,
  score: number,
  queryType: string
): void {
  if (!responseHistory.has(provider)) {
    responseHistory.set(provider, []);
  }

  responseHistory.get(provider)!.push({
    response,
    score,
    timestamp: new Date(),
    queryType,
  });

  // Keep last 1000 responses per provider
  const history = responseHistory.get(provider)!;
  if (history.length > 1000) {
    history.shift();
  }
}

/**
 * Analyze response style from text samples
 */
export function analyzeResponseStyle(responses: string[]): ResponseStyle {
  if (responses.length === 0) {
    return getDefaultResponseStyle();
  }

  const lengths = responses.map(r => r.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lengthVariance = calculateVariance(lengths);

  // Sentence complexity
  const sentenceCounts = responses.map(r => {
    const sentences = r.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = r.split(/\s+/).length;
    return sentences.length > 0 ? words / sentences.length : 0;
  });
  const sentenceComplexity = sentenceCounts.reduce((a, b) => a + b, 0) / sentenceCounts.length;

  // Vocabulary richness
  const allWords = responses.flatMap(r => r.toLowerCase().split(/\s+/));
  const uniqueWords = new Set(allWords);
  const vocabularyRichness = allWords.length > 0 ? uniqueWords.size / allWords.length : 0;

  // Formality (based on contractions, casual markers)
  const informalMarkers = ["'ll", "'re", "'ve", "'d", "gonna", "wanna", "kinda", "yeah", "yep", "nope"];
  const informalCount = responses.reduce((count, r) => {
    return count + informalMarkers.filter(m => r.toLowerCase().includes(m)).length;
  }, 0);
  const formalityScore = Math.max(0, 1 - (informalCount / responses.length) * 0.2);

  // Hedging frequency
  const hedgeWords = ['maybe', 'perhaps', 'might', 'could', 'possibly', 'likely', 'probably', 'seems', 'appears'];
  const hedgeCount = responses.reduce((count, r) => {
    return count + hedgeWords.filter(h => r.toLowerCase().includes(h)).length;
  }, 0);
  const hedgingFrequency = hedgeCount / responses.length;

  // Confidence level (inverse of hedging)
  const confidenceLevel = Math.max(0, 1 - hedgingFrequency * 0.2);

  // List usage
  const listPattern = /^[-•*]\s|^\d+\.\s/gm;
  const listUsage = responses.filter(r => listPattern.test(r)).length / responses.length;

  // Code usage
  const codePattern = /```[\s\S]*?```|`[^`]+`/g;
  const codeUsage = responses.filter(r => codePattern.test(r)).length / responses.length;

  return {
    averageLength: avgLength,
    lengthVariance: lengthVariance,
    sentenceComplexity,
    vocabularyRichness,
    formalityScore,
    hedgingFrequency,
    confidenceLevel,
    listUsageRate: listUsage,
    codeUsageRate: codeUsage,
  };
}

function getDefaultResponseStyle(): ResponseStyle {
  return {
    averageLength: 0,
    lengthVariance: 0,
    sentenceComplexity: 0,
    vocabularyRichness: 0,
    formalityScore: 0.5,
    hedgingFrequency: 0,
    confidenceLevel: 0.5,
    listUsageRate: 0,
    codeUsageRate: 0,
  };
}

/**
 * Analyze bias profile
 */
export function analyzeBiasProfile(
  responses: Array<{ response: string; score: number; queryType: string }>
): BiasProfile {
  // Sentiment analysis (simplified)
  const positiveWords = ['excellent', 'great', 'best', 'recommend', 'outstanding', 'superior'];
  const negativeWords = ['poor', 'avoid', 'worst', 'problematic', 'inferior', 'disappointing'];

  let positiveCount = 0;
  let negativeCount = 0;

  for (const { response } of responses) {
    const lower = response.toLowerCase();
    positiveCount += positiveWords.filter(w => lower.includes(w)).length;
    negativeCount += negativeWords.filter(w => lower.includes(w)).length;
  }

  const total = positiveCount + negativeCount;
  let sentimentBias: 'positive' | 'negative' | 'neutral' = 'neutral';
  let sentimentBiasStrength = 0;

  if (total > 0) {
    const positiveRatio = positiveCount / total;
    if (positiveRatio > 0.6) {
      sentimentBias = 'positive';
      sentimentBiasStrength = positiveRatio - 0.5;
    } else if (positiveRatio < 0.4) {
      sentimentBias = 'negative';
      sentimentBiasStrength = 0.5 - positiveRatio;
    }
  }

  // Industry bias (would need actual industry detection)
  const industryBias: Record<string, number> = {};

  // Brand favoritism (would need actual brand extraction)
  const brandFavoritism: string[] = [];

  return {
    positionBias: 'none',
    positionBiasStrength: 0,
    brandFavoritism,
    industryBias,
    sentimentBias,
    sentimentBiasStrength,
    lengthBiasTowardComplex: false,
  };
}

/**
 * Analyze consistency metrics
 */
export function analyzeConsistency(
  responses: Array<{ response: string; score: number; timestamp: Date }>
): ConsistencyMetrics {
  if (responses.length < 2) {
    return {
      scoreStability: 1,
      semanticConsistency: 1,
      factualConsistency: 1,
      temporalStability: 1,
      crossQueryConsistency: 1,
    };
  }

  const scores = responses.map(r => r.score);
  const scoreVariance = calculateVariance(scores);
  const scoreStability = Math.max(0, 1 - scoreVariance / 100);  // Normalize

  // Semantic consistency (simplified - would use embeddings)
  const lengths = responses.map(r => r.response.length);
  const lengthVariance = calculateVariance(lengths);
  const semanticConsistency = Math.max(0, 1 - lengthVariance / (lengths.reduce((a, b) => a + b, 0) / lengths.length));

  // Temporal stability (compare recent vs older)
  const sorted = [...responses].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  const recentScores = sorted.slice(0, Math.ceil(sorted.length / 2)).map(r => r.score);
  const olderScores = sorted.slice(Math.ceil(sorted.length / 2)).map(r => r.score);

  const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const olderAvg = olderScores.reduce((a, b) => a + b, 0) / olderScores.length;
  const temporalStability = Math.max(0, 1 - Math.abs(recentAvg - olderAvg) / 100);

  return {
    scoreStability,
    semanticConsistency,
    factualConsistency: 0.9,  // Would need fact verification
    temporalStability,
    crossQueryConsistency: 0.85,  // Would need query similarity
  };
}

/**
 * Generate behavioral fingerprint for provider
 */
export function generateFingerprint(provider: string, model: string = 'default'): ProviderBehavioralFingerprint {
  const history = responseHistory.get(provider) || [];

  const responseTexts = history.map(h => h.response);
  const responseStyle = analyzeResponseStyle(responseTexts);
  const biasProfile = analyzeBiasProfile(history);
  const consistency = analyzeConsistency(history);

  // Identify unique traits
  const uniqueTraits: string[] = [];

  if (responseStyle.listUsageRate > 0.5) uniqueTraits.push('Frequently uses lists');
  if (responseStyle.hedgingFrequency > 0.3) uniqueTraits.push('Tends to hedge statements');
  if (responseStyle.formalityScore > 0.8) uniqueTraits.push('Highly formal tone');
  if (responseStyle.formalityScore < 0.4) uniqueTraits.push('Casual/conversational tone');
  if (consistency.scoreStability > 0.9) uniqueTraits.push('Highly consistent scoring');
  if (biasProfile.sentimentBias === 'positive') uniqueTraits.push('Positive sentiment tendency');

  // Compare to baseline (average across all providers)
  const allFingerprints = Array.from(fingerprintRegistry.values());
  const baseline = calculateBaseline(allFingerprints);

  const fingerprint: ProviderBehavioralFingerprint = {
    providerId: provider,
    providerName: provider.charAt(0).toUpperCase() + provider.slice(1),
    model,
    sampleSize: history.length,
    lastUpdated: new Date(),
    responseStyle,
    biasProfile,
    consistency,
    uniqueTraits,
    comparisonToBaseline: {
      moreConcise: responseStyle.averageLength < baseline.averageLength,
      moreConfident: responseStyle.confidenceLevel > baseline.confidenceLevel,
      moreFormal: responseStyle.formalityScore > baseline.formalityScore,
      moreConsistent: consistency.scoreStability > baseline.scoreStability,
    },
  };

  fingerprintRegistry.set(provider, fingerprint);
  return fingerprint;
}

function calculateBaseline(fingerprints: ProviderBehavioralFingerprint[]): {
  averageLength: number;
  confidenceLevel: number;
  formalityScore: number;
  scoreStability: number;
} {
  if (fingerprints.length === 0) {
    return {
      averageLength: 500,
      confidenceLevel: 0.7,
      formalityScore: 0.6,
      scoreStability: 0.8,
    };
  }

  return {
    averageLength: fingerprints.reduce((s, f) => s + f.responseStyle.averageLength, 0) / fingerprints.length,
    confidenceLevel: fingerprints.reduce((s, f) => s + f.responseStyle.confidenceLevel, 0) / fingerprints.length,
    formalityScore: fingerprints.reduce((s, f) => s + f.responseStyle.formalityScore, 0) / fingerprints.length,
    scoreStability: fingerprints.reduce((s, f) => s + f.consistency.scoreStability, 0) / fingerprints.length,
  };
}

// ============================================================================
// FINGERPRINT COMPARISON
// ============================================================================

/**
 * Compare two provider fingerprints
 */
export function compareFingerprints(provider1: string, provider2: string): FingerprintComparison {
  const fp1 = fingerprintRegistry.get(provider1);
  const fp2 = fingerprintRegistry.get(provider2);

  if (!fp1 || !fp2) {
    return {
      provider1,
      provider2,
      similarities: [],
      differences: ['Insufficient data for comparison'],
      overallSimilarity: 0,
      recommendedUseCase: { provider1: [], provider2: [] },
    };
  }

  const similarities: string[] = [];
  const differences: string[] = [];

  // Compare response styles
  const lengthDiff = Math.abs(fp1.responseStyle.averageLength - fp2.responseStyle.averageLength);
  if (lengthDiff < 100) {
    similarities.push('Similar response length');
  } else {
    differences.push(fp1.responseStyle.averageLength > fp2.responseStyle.averageLength
      ? `${provider1} gives longer responses`
      : `${provider2} gives longer responses`);
  }

  const formalityDiff = Math.abs(fp1.responseStyle.formalityScore - fp2.responseStyle.formalityScore);
  if (formalityDiff < 0.15) {
    similarities.push('Similar formality level');
  } else {
    differences.push(fp1.responseStyle.formalityScore > fp2.responseStyle.formalityScore
      ? `${provider1} is more formal`
      : `${provider2} is more formal`);
  }

  const confidenceDiff = Math.abs(fp1.responseStyle.confidenceLevel - fp2.responseStyle.confidenceLevel);
  if (confidenceDiff < 0.1) {
    similarities.push('Similar confidence levels');
  } else {
    differences.push(fp1.responseStyle.confidenceLevel > fp2.responseStyle.confidenceLevel
      ? `${provider1} is more confident`
      : `${provider2} is more confident`);
  }

  // Compare consistency
  const stabilityDiff = Math.abs(fp1.consistency.scoreStability - fp2.consistency.scoreStability);
  if (stabilityDiff < 0.1) {
    similarities.push('Similar consistency');
  } else {
    differences.push(fp1.consistency.scoreStability > fp2.consistency.scoreStability
      ? `${provider1} is more consistent`
      : `${provider2} is more consistent`);
  }

  // Calculate overall similarity
  const overallSimilarity = 1 - (
    (lengthDiff / 500) +
    formalityDiff +
    confidenceDiff +
    stabilityDiff
  ) / 4;

  // Generate use case recommendations
  const recommendedUseCase = {
    provider1: [] as string[],
    provider2: [] as string[],
  };

  if (fp1.responseStyle.formalityScore > 0.7) {
    recommendedUseCase.provider1.push('Enterprise/formal use cases');
  }
  if (fp1.consistency.scoreStability > 0.85) {
    recommendedUseCase.provider1.push('Consistent scoring requirements');
  }
  if (fp1.responseStyle.hedgingFrequency < 0.2) {
    recommendedUseCase.provider1.push('Direct recommendations');
  }

  if (fp2.responseStyle.formalityScore > 0.7) {
    recommendedUseCase.provider2.push('Enterprise/formal use cases');
  }
  if (fp2.consistency.scoreStability > 0.85) {
    recommendedUseCase.provider2.push('Consistent scoring requirements');
  }
  if (fp2.responseStyle.hedgingFrequency < 0.2) {
    recommendedUseCase.provider2.push('Direct recommendations');
  }

  return {
    provider1,
    provider2,
    similarities,
    differences,
    overallSimilarity: Math.max(0, Math.min(1, overallSimilarity)),
    recommendedUseCase,
  };
}

/**
 * Get all fingerprints
 */
export function getAllFingerprints(): ProviderBehavioralFingerprint[] {
  return Array.from(fingerprintRegistry.values());
}

/**
 * Get fingerprint for provider
 */
export function getFingerprint(provider: string): ProviderBehavioralFingerprint | undefined {
  return fingerprintRegistry.get(provider);
}

// ============================================================================
// UTILITIES
// ============================================================================

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Recording
  recordResponse,

  // Analysis
  analyzeResponseStyle,
  analyzeBiasProfile,
  analyzeConsistency,

  // Fingerprinting
  generateFingerprint,
  getFingerprint,
  getAllFingerprints,

  // Comparison
  compareFingerprints,
};
