/**
 * Hedge and Certainty Detector
 *
 * Detects hedging language and scores text certainty
 *
 * Phase 3, Week 10
 */

import type { HedgeDetection, CertaintyLevel } from './types';

// ================================================================
// HEDGE CATEGORIES
// ================================================================

/**
 * Hedge phrases organized by category and certainty impact
 */
export const HEDGE_LEXICON = {
  /** Modal verbs indicating possibility */
  modals: {
    high: ['will', 'must', 'shall', 'have to', 'need to'],
    medium: ['should', 'would', 'could', 'can', 'ought to'],
    low: ['may', 'might', 'could possibly', 'could potentially'],
  },

  /** Epistemic verbs (belief/knowledge) */
  epistemic: {
    high: ['know', 'confirm', 'verify', 'prove', 'demonstrate', 'establish'],
    medium: [
      'believe',
      'think',
      'consider',
      'understand',
      'expect',
      'anticipate',
    ],
    low: [
      'guess',
      'suppose',
      'assume',
      'suspect',
      'speculate',
      'wonder',
      'imagine',
    ],
  },

  /** Approximators */
  approximators: {
    high: ['exactly', 'precisely', 'definitely', 'certainly', 'absolutely'],
    medium: ['approximately', 'roughly', 'around', 'about', 'nearly', 'almost'],
    low: ['somewhat', 'sort of', 'kind of', 'more or less', 'in a way'],
  },

  /** Probability markers */
  probability: {
    high: [
      'always',
      'never',
      'certainly',
      'definitely',
      'undoubtedly',
      'clearly',
      'obviously',
    ],
    medium: [
      'usually',
      'typically',
      'generally',
      'normally',
      'often',
      'frequently',
    ],
    low: [
      'sometimes',
      'occasionally',
      'rarely',
      'possibly',
      'perhaps',
      'maybe',
      'potentially',
      'presumably',
    ],
  },

  /** Evidential markers (source of information) */
  evidential: {
    high: ['according to research', 'studies show', 'data indicates', 'evidence suggests'],
    medium: ['reportedly', 'allegedly', 'apparently', 'seemingly'],
    low: ['rumor has it', 'supposedly', 'ostensibly', "it's said that"],
  },

  /** Downtoners and minimizers */
  downtoners: {
    high: [],
    medium: ['fairly', 'rather', 'quite', 'relatively', 'comparatively'],
    low: [
      'slightly',
      'a bit',
      'a little',
      'somewhat',
      'to some extent',
      'to a degree',
      'in part',
    ],
  },

  /** Conditional markers */
  conditional: {
    high: ['when', 'once', 'as soon as'],
    medium: ['if', 'unless', 'provided that', 'assuming that', 'given that'],
    low: [
      'in case',
      'supposing',
      'hypothetically',
      'in the event that',
      'should it happen',
    ],
  },

  /** Impersonal constructions */
  impersonal: {
    high: ['it is clear that', 'it is evident that', 'it is certain that'],
    medium: [
      'it seems that',
      'it appears that',
      'it is likely that',
      'it is probable that',
    ],
    low: [
      'it is possible that',
      'it might be that',
      'it could be that',
      'there is a chance that',
    ],
  },

  /** Tentativeness markers */
  tentative: {
    high: [],
    medium: ['tend to', 'inclined to', 'leaning toward'],
    low: [
      'not sure',
      'uncertain',
      'unclear',
      'doubtful',
      'questionable',
      'debatable',
      'arguable',
    ],
  },
};

/**
 * Boosters (confidence enhancers)
 */
export const BOOSTERS = [
  'absolutely',
  'actually',
  'always',
  'certainly',
  'clearly',
  'completely',
  'conclusively',
  'definitely',
  'doubtless',
  'entirely',
  'essentially',
  'evidently',
  'extremely',
  'fundamentally',
  'genuinely',
  'highly',
  'indeed',
  'inevitably',
  'invariably',
  'manifestly',
  'necessarily',
  'never',
  'no doubt',
  'obviously',
  'of course',
  'particularly',
  'plainly',
  'positively',
  'precisely',
  'really',
  'strongly',
  'surely',
  'thoroughly',
  'truly',
  'undeniably',
  'undoubtedly',
  'unquestionably',
  'utterly',
  'very',
  'without doubt',
];

/**
 * Get all hedges as a flat map with certainty levels
 */
function buildHedgeMap(): Map<string, CertaintyLevel> {
  const map = new Map<string, CertaintyLevel>();

  for (const category of Object.values(HEDGE_LEXICON)) {
    for (const [level, phrases] of Object.entries(category)) {
      for (const phrase of phrases) {
        map.set(phrase.toLowerCase(), level as CertaintyLevel);
      }
    }
  }

  return map;
}

const HEDGE_MAP = buildHedgeMap();

// ================================================================
// DETECTION FUNCTIONS
// ================================================================

/**
 * Detect hedges in text
 *
 * @param text - Text to analyze
 * @returns Array of hedge detections
 *
 * @example
 * ```typescript
 * const hedges = detectHedges("I think this might possibly work");
 * // [{ hedge: "think", certainty: "medium", ... }, { hedge: "might", certainty: "low", ... }]
 * ```
 */
export function detectHedges(text: string): HedgeDetection[] {
  const detections: HedgeDetection[] = [];
  const lowerText = text.toLowerCase();

  // Sort by phrase length (longer first) to avoid partial matches
  const sortedHedges = [...HEDGE_MAP.entries()].sort(
    (a, b) => b[0].length - a[0].length
  );

  const foundRanges: Array<{ start: number; end: number }> = [];

  for (const [phrase, certainty] of sortedHedges) {
    let searchStart = 0;
    let position = lowerText.indexOf(phrase, searchStart);

    while (position !== -1) {
      // Check for word boundaries
      const beforeOk =
        position === 0 || /\W/.test(lowerText[position - 1]);
      const afterOk =
        position + phrase.length === lowerText.length ||
        /\W/.test(lowerText[position + phrase.length]);

      // Check if this range overlaps with already found hedges
      const overlaps = foundRanges.some(
        (range) =>
          (position >= range.start && position < range.end) ||
          (position + phrase.length > range.start &&
            position + phrase.length <= range.end)
      );

      if (beforeOk && afterOk && !overlaps) {
        // Extract context (surrounding sentence or clause)
        const contextStart = Math.max(
          0,
          lowerText.lastIndexOf('.', position) + 1
        );
        const contextEnd = lowerText.indexOf('.', position + phrase.length);
        const context = text
          .slice(contextStart, contextEnd === -1 ? undefined : contextEnd + 1)
          .trim();

        detections.push({
          hedge: phrase,
          phrase,
          certainty,
          position,
          context,
        });

        foundRanges.push({ start: position, end: position + phrase.length });
      }

      searchStart = position + 1;
      position = lowerText.indexOf(phrase, searchStart);
    }
  }

  // Sort by position
  return detections.sort((a, b) => a.position - b.position);
}

/**
 * Count boosters in text
 */
export function countBoosters(text: string): number {
  const lowerText = text.toLowerCase();
  let count = 0;

  for (const booster of BOOSTERS) {
    let searchStart = 0;
    let position = lowerText.indexOf(booster, searchStart);

    while (position !== -1) {
      const beforeOk =
        position === 0 || /\W/.test(lowerText[position - 1]);
      const afterOk =
        position + booster.length === lowerText.length ||
        /\W/.test(lowerText[position + booster.length]);

      if (beforeOk && afterOk) {
        count++;
      }

      searchStart = position + 1;
      position = lowerText.indexOf(booster, searchStart);
    }
  }

  return count;
}

/**
 * Calculate overall certainty score for text
 *
 * Returns a score from 0 (very uncertain) to 1 (very certain)
 *
 * @example
 * ```typescript
 * scoreCertainty("I definitely know this will work")
 * // 0.85 (high certainty)
 *
 * scoreCertainty("I think this might possibly work")
 * // 0.35 (low certainty)
 * ```
 */
export function scoreCertainty(text: string): number {
  const hedges = detectHedges(text);
  const boosterCount = countBoosters(text);
  const wordCount = text.split(/\s+/).length;

  if (wordCount === 0) return 0.5;

  // Base certainty starts at neutral
  let certainty = 0.5;

  // Adjust for hedges
  for (const hedge of hedges) {
    switch (hedge.certainty) {
      case 'low':
        certainty -= 0.15;
        break;
      case 'medium':
        certainty -= 0.05;
        break;
      case 'high':
        certainty += 0.1;
        break;
    }
  }

  // Adjust for boosters
  certainty += boosterCount * 0.1;

  // Normalize hedge impact by text length
  const hedgeDensity = hedges.length / wordCount;
  if (hedgeDensity > 0.1) {
    certainty -= 0.1;
  }

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, certainty));
}

/**
 * Get certainty level from score
 */
export function getCertaintyLevel(score: number): CertaintyLevel {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}

/**
 * Analyze text for hedging and certainty
 */
export interface CertaintyAnalysis {
  /** Overall certainty score (0-1) */
  score: number;
  /** Certainty level */
  level: CertaintyLevel;
  /** Detected hedges */
  hedges: HedgeDetection[];
  /** Number of boosters found */
  boosterCount: number;
  /** Hedge density (hedges per 100 words) */
  hedgeDensity: number;
  /** Categories of hedges found */
  hedgeCategories: string[];
  /** Summary assessment */
  assessment: string;
}

/**
 * Comprehensive certainty analysis
 *
 * @example
 * ```typescript
 * const analysis = analyzeCertainty("This product might potentially help somewhat");
 * // {
 * //   score: 0.25,
 * //   level: "low",
 * //   hedges: [...],
 * //   assessment: "Text shows low confidence with frequent hedging"
 * // }
 * ```
 */
export function analyzeCertainty(text: string): CertaintyAnalysis {
  const hedges = detectHedges(text);
  const boosterCount = countBoosters(text);
  const score = scoreCertainty(text);
  const level = getCertaintyLevel(score);
  const wordCount = text.split(/\s+/).length;
  const hedgeDensity = wordCount > 0 ? (hedges.length / wordCount) * 100 : 0;

  // Identify categories of hedges found
  const categories = new Set<string>();
  for (const category of Object.keys(HEDGE_LEXICON)) {
    const categoryPhrases = Object.values(
      HEDGE_LEXICON[category as keyof typeof HEDGE_LEXICON]
    ).flat();
    for (const hedge of hedges) {
      if (categoryPhrases.includes(hedge.hedge)) {
        categories.add(category);
      }
    }
  }

  // Generate assessment
  let assessment: string;
  if (score >= 0.8) {
    assessment = 'Text expresses high confidence with strong assertions';
  } else if (score >= 0.6) {
    assessment = 'Text shows moderate-to-high confidence with some qualifications';
  } else if (score >= 0.4) {
    assessment = 'Text shows moderate confidence with balanced hedging';
  } else if (score >= 0.2) {
    assessment = 'Text shows low confidence with frequent hedging';
  } else {
    assessment = 'Text shows very low confidence with extensive hedging';
  }

  return {
    score,
    level,
    hedges,
    boosterCount,
    hedgeDensity: Math.round(hedgeDensity * 100) / 100,
    hedgeCategories: [...categories],
    assessment,
  };
}

/**
 * Compare certainty between two texts
 */
export function compareCertainty(
  text1: string,
  text2: string
): {
  text1Score: number;
  text2Score: number;
  difference: number;
  moreConfident: 1 | 2 | 0;
} {
  const score1 = scoreCertainty(text1);
  const score2 = scoreCertainty(text2);
  const difference = Math.abs(score1 - score2);

  let moreConfident: 1 | 2 | 0 = 0;
  if (difference > 0.1) {
    moreConfident = score1 > score2 ? 1 : 2;
  }

  return {
    text1Score: score1,
    text2Score: score2,
    difference,
    moreConfident,
  };
}

/**
 * Check if text contains hedging
 */
export function containsHedging(text: string): boolean {
  return detectHedges(text).length > 0;
}

/**
 * Get most hedged sentence
 */
export function getMostHedgedSentence(
  text: string
): { sentence: string; hedgeCount: number } | null {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) return null;

  let maxHedges = 0;
  let mostHedged = sentences[0].trim();

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const hedges = detectHedges(trimmed);

    if (hedges.length > maxHedges) {
      maxHedges = hedges.length;
      mostHedged = trimmed;
    }
  }

  return { sentence: mostHedged, hedgeCount: maxHedges };
}

/**
 * Extract confident statements from text
 */
export function extractConfidentStatements(
  text: string,
  threshold: number = 0.6
): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const confident: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (scoreCertainty(trimmed) >= threshold) {
      confident.push(trimmed);
    }
  }

  return confident;
}

/**
 * Extract uncertain statements from text
 */
export function extractUncertainStatements(
  text: string,
  threshold: number = 0.4
): string[] {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const uncertain: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (scoreCertainty(trimmed) < threshold) {
      uncertain.push(trimmed);
    }
  }

  return uncertain;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectHedges,
  scoreCertainty,
  getCertaintyLevel,
  analyzeCertainty,
  compareCertainty,
  containsHedging,
  countBoosters,
  getMostHedgedSentence,
  extractConfidentStatements,
  extractUncertainStatements,
  HEDGE_LEXICON,
  BOOSTERS,
};
