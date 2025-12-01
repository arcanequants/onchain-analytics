/**
 * Aspect-Based Sentiment Analysis (ABSA)
 *
 * Analyzes sentiment at the aspect/attribute level rather than document level
 * Phase 3, Week 10 - NLP Backlog
 *
 * Features:
 * - Aspect extraction
 * - Aspect-specific sentiment scoring
 * - Opinion term detection
 * - Aspect category classification
 */

import { analyzeSentiment } from './sentiment';
import { extractKeyphrases } from './keyphrases';

// ================================================================
// TYPES
// ================================================================

/**
 * An aspect mentioned in text
 */
export interface Aspect {
  /** The aspect term */
  term: string;
  /** Normalized/canonical form */
  normalized: string;
  /** Category this aspect belongs to */
  category: AspectCategory;
  /** Position in text */
  position: number;
  /** The sentence containing this aspect */
  sentence: string;
  /** Sentence index */
  sentenceIndex: number;
}

/**
 * Aspect categories for classification
 */
export type AspectCategory =
  | 'quality'
  | 'price'
  | 'service'
  | 'usability'
  | 'performance'
  | 'reliability'
  | 'design'
  | 'features'
  | 'support'
  | 'value'
  | 'general';

/**
 * Sentiment polarity for aspects
 */
export type SentimentPolarity = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * Opinion expression linked to an aspect
 */
export interface OpinionExpression {
  /** The opinion term/phrase */
  term: string;
  /** Polarity of the opinion */
  polarity: SentimentPolarity;
  /** Intensity (0-1) */
  intensity: number;
  /** Position in text */
  position: number;
}

/**
 * Aspect-sentiment pair
 */
export interface AspectSentiment {
  /** The aspect */
  aspect: Aspect;
  /** Opinion expressions for this aspect */
  opinions: OpinionExpression[];
  /** Overall sentiment for this aspect */
  sentiment: {
    polarity: SentimentPolarity;
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
}

/**
 * Full ABSA result
 */
export interface ABSAResult {
  /** All detected aspects */
  aspects: Aspect[];
  /** Aspect-sentiment pairs */
  aspectSentiments: AspectSentiment[];
  /** Aggregated sentiment by category */
  categorySentiments: Record<AspectCategory, CategorySentiment>;
  /** Overall document sentiment */
  overallSentiment: {
    polarity: SentimentPolarity;
    score: number;
  };
  /** Summary statistics */
  stats: ABSAStats;
}

/**
 * Sentiment summary for a category
 */
export interface CategorySentiment {
  category: AspectCategory;
  aspectCount: number;
  avgScore: number;
  polarity: SentimentPolarity;
  aspects: string[];
}

/**
 * ABSA statistics
 */
export interface ABSAStats {
  totalAspects: number;
  positiveAspects: number;
  negativeAspects: number;
  neutralAspects: number;
  mixedAspects: number;
  categoryCoverage: number;
}

// ================================================================
// ASPECT LEXICONS
// ================================================================

/**
 * Aspect terms by category
 */
export const ASPECT_LEXICON: Record<AspectCategory, string[]> = {
  quality: [
    'quality',
    'build',
    'construction',
    'material',
    'durability',
    'craftsmanship',
    'finish',
    'workmanship',
    'excellence',
    'standard',
  ],
  price: [
    'price',
    'cost',
    'value',
    'pricing',
    'expensive',
    'cheap',
    'affordable',
    'budget',
    'premium',
    'worth',
    'money',
    'fee',
    'charge',
  ],
  service: [
    'service',
    'customer service',
    'support team',
    'staff',
    'response',
    'assistance',
    'help',
    'representative',
    'agent',
  ],
  usability: [
    'usability',
    'ease of use',
    'user experience',
    'interface',
    'navigation',
    'intuitive',
    'simple',
    'complex',
    'learning curve',
    'workflow',
    'ux',
    'ui',
  ],
  performance: [
    'performance',
    'speed',
    'fast',
    'slow',
    'responsive',
    'efficiency',
    'quick',
    'lag',
    'latency',
    'throughput',
  ],
  reliability: [
    'reliability',
    'stable',
    'uptime',
    'downtime',
    'crash',
    'bug',
    'error',
    'consistent',
    'dependable',
    'trustworthy',
  ],
  design: [
    'design',
    'look',
    'appearance',
    'aesthetic',
    'style',
    'layout',
    'color',
    'visual',
    'beautiful',
    'ugly',
    'modern',
    'outdated',
  ],
  features: [
    'feature',
    'functionality',
    'capability',
    'function',
    'option',
    'tool',
    'integration',
    'api',
    'plugin',
    'extension',
  ],
  support: [
    'support',
    'documentation',
    'docs',
    'tutorial',
    'guide',
    'faq',
    'help center',
    'knowledge base',
    'training',
    'onboarding',
  ],
  value: [
    'value',
    'roi',
    'return',
    'investment',
    'benefit',
    'advantage',
    'worth it',
    'pays for itself',
  ],
  general: ['product', 'software', 'tool', 'platform', 'solution', 'system', 'app', 'application'],
};

/**
 * Positive opinion terms with intensity
 */
export const POSITIVE_OPINIONS: Record<string, number> = {
  // Strong positive (0.8-1.0)
  excellent: 1.0,
  outstanding: 1.0,
  amazing: 0.95,
  fantastic: 0.95,
  incredible: 0.9,
  exceptional: 0.9,
  superb: 0.9,
  perfect: 1.0,
  brilliant: 0.9,
  wonderful: 0.85,

  // Moderate positive (0.5-0.8)
  great: 0.8,
  good: 0.6,
  nice: 0.55,
  solid: 0.6,
  reliable: 0.65,
  impressive: 0.75,
  effective: 0.7,
  efficient: 0.7,
  useful: 0.65,
  helpful: 0.65,

  // Mild positive (0.3-0.5)
  decent: 0.4,
  okay: 0.35,
  fine: 0.35,
  adequate: 0.4,
  reasonable: 0.45,
  satisfactory: 0.45,
  acceptable: 0.4,

  // Action positives
  love: 0.9,
  like: 0.6,
  enjoy: 0.7,
  appreciate: 0.65,
  recommend: 0.75,
  prefer: 0.6,
};

/**
 * Negative opinion terms with intensity
 */
export const NEGATIVE_OPINIONS: Record<string, number> = {
  // Strong negative (0.8-1.0)
  terrible: 1.0,
  horrible: 1.0,
  awful: 0.95,
  dreadful: 0.9,
  abysmal: 0.95,
  atrocious: 0.95,
  pathetic: 0.85,
  useless: 0.85,
  worthless: 0.9,

  // Moderate negative (0.5-0.8)
  bad: 0.7,
  poor: 0.65,
  disappointing: 0.7,
  frustrating: 0.75,
  annoying: 0.65,
  mediocre: 0.55,
  lacking: 0.6,
  inadequate: 0.65,
  unsatisfactory: 0.7,

  // Mild negative (0.3-0.5)
  'below average': 0.45,
  subpar: 0.5,
  limited: 0.4,
  basic: 0.35,
  average: 0.3,
  ordinary: 0.3,

  // Action negatives
  hate: 0.9,
  dislike: 0.6,
  avoid: 0.7,
  regret: 0.75,
  disappointed: 0.7,
  struggled: 0.6,
};

/**
 * Intensifiers that modify sentiment
 */
export const INTENSIFIERS: Record<string, number> = {
  // Strong intensifiers
  very: 1.25,
  extremely: 1.5,
  incredibly: 1.4,
  absolutely: 1.5,
  completely: 1.4,
  totally: 1.3,
  really: 1.2,
  highly: 1.3,
  exceptionally: 1.4,

  // Mild intensifiers
  quite: 1.1,
  fairly: 0.9,
  rather: 1.05,
  somewhat: 0.8,
  slightly: 0.7,
  'a bit': 0.75,
  'a little': 0.75,
  pretty: 1.1,

  // Negators/diminishers
  not: -1,
  never: -1,
  hardly: 0.3,
  barely: 0.3,
  "n't": -1,
};

// ================================================================
// ASPECT DETECTION
// ================================================================

/**
 * Build aspect map for quick lookup
 */
function buildAspectMap(): Map<string, AspectCategory> {
  const map = new Map<string, AspectCategory>();
  for (const [category, terms] of Object.entries(ASPECT_LEXICON)) {
    for (const term of terms) {
      map.set(term.toLowerCase(), category as AspectCategory);
    }
  }
  return map;
}

const ASPECT_MAP = buildAspectMap();

/**
 * Normalize an aspect term
 */
export function normalizeAspect(term: string): string {
  return term.toLowerCase().trim();
}

/**
 * Get aspect category for a term
 */
export function getAspectCategory(term: string): AspectCategory {
  const normalized = normalizeAspect(term);

  // Direct lookup
  if (ASPECT_MAP.has(normalized)) {
    return ASPECT_MAP.get(normalized)!;
  }

  // Partial match
  for (const [key, category] of ASPECT_MAP.entries()) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return category;
    }
  }

  return 'general';
}

/**
 * Detect aspects in text
 */
export function detectAspects(text: string): Aspect[] {
  const aspects: Aspect[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());
  const seenAspects = new Set<string>();

  let globalPosition = 0;

  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentence = sentences[sentenceIndex].trim();
    const lowerSentence = sentence.toLowerCase();

    // Check for aspect terms
    for (const [aspectTerm, category] of ASPECT_MAP.entries()) {
      const position = lowerSentence.indexOf(aspectTerm);
      if (position !== -1) {
        // Check word boundaries
        const before = position === 0 || /\W/.test(lowerSentence[position - 1]);
        const after =
          position + aspectTerm.length === lowerSentence.length ||
          /\W/.test(lowerSentence[position + aspectTerm.length]);

        if (before && after) {
          const key = `${aspectTerm}-${sentenceIndex}`;
          if (!seenAspects.has(key)) {
            seenAspects.add(key);
            aspects.push({
              term: sentence.substring(position, position + aspectTerm.length),
              normalized: aspectTerm,
              category,
              position: globalPosition + position,
              sentence,
              sentenceIndex,
            });
          }
        }
      }
    }

    globalPosition += sentence.length + 1;
  }

  return aspects;
}

/**
 * Extract aspects using keyphrases
 */
export function extractAspectsFromKeyphrases(text: string): Aspect[] {
  const keyphrases = extractKeyphrases(text, { maxPhrases: 20, minFrequency: 1 });
  const aspects: Aspect[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  for (const keyphrase of keyphrases) {
    const category = getAspectCategory(keyphrase.phrase);

    // Find the sentence containing this keyphrase
    let sentenceIndex = 0;
    let position = 0;
    let sentence = '';

    for (let i = 0; i < sentences.length; i++) {
      const idx = sentences[i].toLowerCase().indexOf(keyphrase.phrase.toLowerCase());
      if (idx !== -1) {
        sentenceIndex = i;
        sentence = sentences[i].trim();
        position = idx;
        break;
      }
    }

    aspects.push({
      term: keyphrase.phrase,
      normalized: normalizeAspect(keyphrase.phrase),
      category,
      position,
      sentence,
      sentenceIndex,
    });
  }

  return aspects;
}

// ================================================================
// OPINION DETECTION
// ================================================================

/**
 * Detect opinion expressions in a sentence
 */
export function detectOpinions(sentence: string): OpinionExpression[] {
  const opinions: OpinionExpression[] = [];
  const lowerSentence = sentence.toLowerCase();
  const words = lowerSentence.split(/\s+/);

  // Check for positive opinions
  for (const [term, intensity] of Object.entries(POSITIVE_OPINIONS)) {
    const position = lowerSentence.indexOf(term);
    if (position !== -1) {
      // Check for negation before the term
      const beforeText = lowerSentence.substring(0, position);
      const isNegated = /\b(not|never|no|n't)\s*$/.test(beforeText);

      // Check for intensifier before the term
      let finalIntensity = intensity;
      for (const [intensifier, modifier] of Object.entries(INTENSIFIERS)) {
        if (beforeText.includes(intensifier)) {
          finalIntensity *= modifier;
        }
      }

      opinions.push({
        term,
        polarity: isNegated ? 'negative' : 'positive',
        intensity: Math.min(1, Math.abs(finalIntensity)),
        position,
      });
    }
  }

  // Check for negative opinions
  for (const [term, intensity] of Object.entries(NEGATIVE_OPINIONS)) {
    const position = lowerSentence.indexOf(term);
    if (position !== -1) {
      // Check for negation before the term
      const beforeText = lowerSentence.substring(0, position);
      const isNegated = /\b(not|never|no|n't)\s*$/.test(beforeText);

      // Check for intensifier
      let finalIntensity = intensity;
      for (const [intensifier, modifier] of Object.entries(INTENSIFIERS)) {
        if (beforeText.includes(intensifier) && modifier > 0) {
          finalIntensity *= modifier;
        }
      }

      opinions.push({
        term,
        polarity: isNegated ? 'positive' : 'negative',
        intensity: Math.min(1, Math.abs(finalIntensity)),
        position,
      });
    }
  }

  return opinions;
}

// ================================================================
// ASPECT-SENTIMENT LINKING
// ================================================================

/**
 * Link aspects with opinions
 */
export function linkAspectsWithOpinions(
  aspects: Aspect[],
  text: string
): AspectSentiment[] {
  const aspectSentiments: AspectSentiment[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  for (const aspect of aspects) {
    // Get opinions from the same sentence
    const sentence = sentences[aspect.sentenceIndex] || aspect.sentence;
    const opinions = detectOpinions(sentence);

    // Calculate aggregate sentiment for this aspect
    let totalScore = 0;
    let totalWeight = 0;

    for (const opinion of opinions) {
      const score = opinion.polarity === 'positive' ? opinion.intensity : -opinion.intensity;
      const distance = Math.abs(opinion.position - aspect.position);
      const weight = 1 / (1 + distance / 50); // Distance decay
      totalScore += score * weight;
      totalWeight += weight;
    }

    const avgScore = totalWeight > 0 ? totalScore / totalWeight : 0;
    let polarity: SentimentPolarity = 'neutral';
    if (avgScore > 0.2) polarity = 'positive';
    else if (avgScore < -0.2) polarity = 'negative';
    else if (opinions.length > 1) polarity = 'mixed';

    aspectSentiments.push({
      aspect,
      opinions,
      sentiment: {
        polarity,
        score: Math.max(-1, Math.min(1, avgScore)),
        confidence: Math.min(1, opinions.length * 0.3 + 0.1),
      },
    });
  }

  return aspectSentiments;
}

// ================================================================
// MAIN ANALYSIS FUNCTIONS
// ================================================================

/**
 * Perform aspect-based sentiment analysis
 */
export function analyzeABSA(text: string): ABSAResult {
  // Detect aspects using both lexicon and keyphrase extraction
  const lexiconAspects = detectAspects(text);
  const keyphraseAspects = extractAspectsFromKeyphrases(text);

  // Merge and deduplicate aspects
  const seenPositions = new Set<number>();
  const allAspects: Aspect[] = [];

  for (const aspect of [...lexiconAspects, ...keyphraseAspects]) {
    if (!seenPositions.has(aspect.position)) {
      seenPositions.add(aspect.position);
      allAspects.push(aspect);
    }
  }

  // Link aspects with opinions
  const aspectSentiments = linkAspectsWithOpinions(allAspects, text);

  // Aggregate by category
  const categorySentiments: Record<AspectCategory, CategorySentiment> = {} as Record<
    AspectCategory,
    CategorySentiment
  >;

  const categories: AspectCategory[] = [
    'quality',
    'price',
    'service',
    'usability',
    'performance',
    'reliability',
    'design',
    'features',
    'support',
    'value',
    'general',
  ];

  for (const category of categories) {
    const categoryAspects = aspectSentiments.filter((as) => as.aspect.category === category);
    const aspectTerms = categoryAspects.map((as) => as.aspect.term);
    const avgScore =
      categoryAspects.length > 0
        ? categoryAspects.reduce((sum, as) => sum + as.sentiment.score, 0) / categoryAspects.length
        : 0;

    let polarity: SentimentPolarity = 'neutral';
    if (avgScore > 0.2) polarity = 'positive';
    else if (avgScore < -0.2) polarity = 'negative';

    categorySentiments[category] = {
      category,
      aspectCount: categoryAspects.length,
      avgScore,
      polarity,
      aspects: aspectTerms,
    };
  }

  // Calculate overall sentiment
  const overallScore =
    aspectSentiments.length > 0
      ? aspectSentiments.reduce((sum, as) => sum + as.sentiment.score, 0) /
        aspectSentiments.length
      : 0;

  let overallPolarity: SentimentPolarity = 'neutral';
  if (overallScore > 0.2) overallPolarity = 'positive';
  else if (overallScore < -0.2) overallPolarity = 'negative';
  else if (aspectSentiments.some((as) => as.sentiment.polarity !== 'neutral'))
    overallPolarity = 'mixed';

  // Calculate stats
  const stats: ABSAStats = {
    totalAspects: allAspects.length,
    positiveAspects: aspectSentiments.filter((as) => as.sentiment.polarity === 'positive').length,
    negativeAspects: aspectSentiments.filter((as) => as.sentiment.polarity === 'negative').length,
    neutralAspects: aspectSentiments.filter((as) => as.sentiment.polarity === 'neutral').length,
    mixedAspects: aspectSentiments.filter((as) => as.sentiment.polarity === 'mixed').length,
    categoryCoverage:
      Object.values(categorySentiments).filter((cs) => cs.aspectCount > 0).length /
      categories.length,
  };

  return {
    aspects: allAspects,
    aspectSentiments,
    categorySentiments,
    overallSentiment: {
      polarity: overallPolarity,
      score: overallScore,
    },
    stats,
  };
}

/**
 * Get aspects with a specific polarity
 */
export function getAspectsByPolarity(
  result: ABSAResult,
  polarity: SentimentPolarity
): AspectSentiment[] {
  return result.aspectSentiments.filter((as) => as.sentiment.polarity === polarity);
}

/**
 * Get aspects for a specific category
 */
export function getAspectsByCategory(
  result: ABSAResult,
  category: AspectCategory
): AspectSentiment[] {
  return result.aspectSentiments.filter((as) => as.aspect.category === category);
}

/**
 * Get the most positive aspects
 */
export function getMostPositiveAspects(result: ABSAResult, limit: number = 5): AspectSentiment[] {
  return [...result.aspectSentiments]
    .sort((a, b) => b.sentiment.score - a.sentiment.score)
    .slice(0, limit);
}

/**
 * Get the most negative aspects
 */
export function getMostNegativeAspects(result: ABSAResult, limit: number = 5): AspectSentiment[] {
  return [...result.aspectSentiments]
    .sort((a, b) => a.sentiment.score - b.sentiment.score)
    .slice(0, limit);
}

/**
 * Generate ABSA summary
 */
export function generateABSASummary(result: ABSAResult): string {
  const { stats, overallSentiment, categorySentiments } = result;

  if (stats.totalAspects === 0) {
    return 'No specific aspects detected in the text.';
  }

  const lines: string[] = [];

  // Overall summary
  lines.push(
    `Found ${stats.totalAspects} aspects: ${stats.positiveAspects} positive, ${stats.negativeAspects} negative, ${stats.neutralAspects} neutral.`
  );
  lines.push(`Overall sentiment: ${overallSentiment.polarity} (score: ${overallSentiment.score.toFixed(2)})`);

  // Category highlights
  const significantCategories = Object.values(categorySentiments)
    .filter((cs) => cs.aspectCount > 0)
    .sort((a, b) => b.aspectCount - a.aspectCount)
    .slice(0, 3);

  if (significantCategories.length > 0) {
    lines.push('\nTop categories:');
    for (const cat of significantCategories) {
      lines.push(
        `- ${cat.category}: ${cat.polarity} (${cat.aspectCount} aspects, avg score: ${cat.avgScore.toFixed(2)})`
      );
    }
  }

  return lines.join('\n');
}

/**
 * Compare ABSA results between two texts
 */
export function compareABSA(
  result1: ABSAResult,
  result2: ABSAResult
): {
  overallDifference: number;
  categoryDifferences: Record<AspectCategory, number>;
  sharedAspects: string[];
  uniqueToFirst: string[];
  uniqueToSecond: string[];
} {
  const aspects1 = new Set(result1.aspects.map((a) => a.normalized));
  const aspects2 = new Set(result2.aspects.map((a) => a.normalized));

  const sharedAspects = [...aspects1].filter((a) => aspects2.has(a));
  const uniqueToFirst = [...aspects1].filter((a) => !aspects2.has(a));
  const uniqueToSecond = [...aspects2].filter((a) => !aspects1.has(a));

  const categoryDifferences: Record<AspectCategory, number> = {} as Record<AspectCategory, number>;
  const categories: AspectCategory[] = [
    'quality',
    'price',
    'service',
    'usability',
    'performance',
    'reliability',
    'design',
    'features',
    'support',
    'value',
    'general',
  ];

  for (const category of categories) {
    categoryDifferences[category] =
      result1.categorySentiments[category].avgScore -
      result2.categorySentiments[category].avgScore;
  }

  return {
    overallDifference: result1.overallSentiment.score - result2.overallSentiment.score,
    categoryDifferences,
    sharedAspects,
    uniqueToFirst,
    uniqueToSecond,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Analysis
  analyzeABSA,
  detectAspects,
  extractAspectsFromKeyphrases,
  detectOpinions,
  linkAspectsWithOpinions,

  // Utilities
  normalizeAspect,
  getAspectCategory,
  getAspectsByPolarity,
  getAspectsByCategory,
  getMostPositiveAspects,
  getMostNegativeAspects,
  generateABSASummary,
  compareABSA,

  // Lexicons
  ASPECT_LEXICON,
  POSITIVE_OPINIONS,
  NEGATIVE_OPINIONS,
  INTENSIFIERS,
};
