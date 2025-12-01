/**
 * Negation Scope Detector
 *
 * Detects negation cues and their scope in text
 *
 * Phase 3, Week 10
 */

import type { NegationSpan } from './types';

// ================================================================
// NEGATION CUES
// ================================================================

/**
 * Negation cue categories
 */
export const NEGATION_CUES = {
  /** Standard negation words */
  standard: [
    'not',
    'no',
    'never',
    'neither',
    'nobody',
    'nothing',
    'nowhere',
    'none',
  ],

  /** Contracted negations */
  contractions: [
    "n't",
    "don't",
    "doesn't",
    "didn't",
    "won't",
    "wouldn't",
    "couldn't",
    "shouldn't",
    "can't",
    "cannot",
    "isn't",
    "aren't",
    "wasn't",
    "weren't",
    "hasn't",
    "haven't",
    "hadn't",
  ],

  /** Prefix negations */
  prefixes: [
    'un',
    'in',
    'im',
    'il',
    'ir',
    'dis',
    'non',
    'anti',
    'de',
  ],

  /** Negative adverbs */
  adverbs: [
    'hardly',
    'barely',
    'scarcely',
    'seldom',
    'rarely',
  ],

  /** Negative determiners */
  determiners: [
    'few',
    'little',
  ],

  /** Negative prepositions */
  prepositions: [
    'without',
    'except',
    'lacking',
  ],

  /** Negative verbs */
  verbs: [
    'lack',
    'lacks',
    'lacked',
    'lacking',
    'fail',
    'fails',
    'failed',
    'failing',
    'deny',
    'denies',
    'denied',
    'denying',
    'refuse',
    'refuses',
    'refused',
    'refusing',
    'reject',
    'rejects',
    'rejected',
    'rejecting',
    'prevent',
    'prevents',
    'prevented',
    'preventing',
    'avoid',
    'avoids',
    'avoided',
    'avoiding',
    'exclude',
    'excludes',
    'excluded',
    'excluding',
  ],
};

/**
 * All negation cues as a flat array
 */
export const ALL_NEGATION_CUES = [
  ...NEGATION_CUES.standard,
  ...NEGATION_CUES.contractions,
  ...NEGATION_CUES.adverbs,
  ...NEGATION_CUES.determiners,
  ...NEGATION_CUES.prepositions,
  ...NEGATION_CUES.verbs,
];

// ================================================================
// SCOPE BOUNDARIES
// ================================================================

/**
 * Words/punctuation that typically end a negation scope
 */
const SCOPE_ENDERS = [
  // Punctuation
  '.',
  '!',
  '?',
  ';',
  ':',
  ',',
  // Conjunctions
  'but',
  'however',
  'although',
  'though',
  'yet',
  'still',
  'nevertheless',
  'nonetheless',
  // Contrast markers
  'instead',
  'rather',
  'on the contrary',
  // Additives (sometimes end scope)
  'and',
  'or',
];

/**
 * Words that extend negation scope
 */
const SCOPE_EXTENDERS = [
  'any',
  'anyone',
  'anything',
  'anywhere',
  'ever',
  'either',
  'at all',
  'whatsoever',
  'in any way',
];

// ================================================================
// NEGATION DETECTION
// ================================================================

/**
 * Tokenize text into words with positions
 */
function tokenizeWithPositions(text: string): Array<{ word: string; start: number; end: number }> {
  const tokens: Array<{ word: string; start: number; end: number }> = [];
  const regex = /\b[\w']+\b|[.,!?;:]/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[0].toLowerCase(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return tokens;
}

/**
 * Check if a word is a negation cue
 */
export function isNegationCue(word: string): boolean {
  const lower = word.toLowerCase();
  return ALL_NEGATION_CUES.includes(lower);
}

/**
 * Check if a word has a negation prefix
 */
export function hasNegationPrefix(word: string): { hasPrefix: boolean; prefix: string | null; stem: string | null } {
  const lower = word.toLowerCase();

  for (const prefix of NEGATION_CUES.prefixes) {
    if (lower.startsWith(prefix) && lower.length > prefix.length + 2) {
      // Check if the stem is a valid word (basic heuristic)
      const stem = lower.slice(prefix.length);
      // Common patterns
      const validStems = [
        'able',
        'happy',
        'fair',
        'known',
        'expected',
        'likely',
        'usual',
        'clear',
        'certain',
        'possible',
        'perfect',
        'complete',
        'correct',
        'proper',
        'regular',
        'legal',
        'valid',
        'logical',
        'rational',
        'relevant',
        'mature',
        'aware',
        'willing',
        'intentional',
        'acceptable',
        'approved',
        'authorized',
        'connect',
        'agree',
        'honest',
        'loyal',
        'trust',
        'like',
        'respect',
        'obey',
        'appear',
        'continue',
        'arm',
        'cover',
        'activate',
        'infect',
        'crease',
        'flate',
        'flame',
        'form',
        'fuse',
        'vest',
        'clude',
        'duce',
        'hibit',
        'vert',
      ];

      // Check for exact or partial stem match
      for (const validStem of validStems) {
        if (stem === validStem || stem.startsWith(validStem)) {
          return { hasPrefix: true, prefix, stem };
        }
      }
    }
  }

  return { hasPrefix: false, prefix: null, stem: null };
}

/**
 * Find the scope of a negation
 */
function findNegationScope(
  tokens: Array<{ word: string; start: number; end: number }>,
  cueIndex: number,
  originalText: string
): { scopeStart: number; scopeEnd: number; scopeText: string } {
  const cueToken = tokens[cueIndex];
  let scopeStart = cueToken.end;
  let scopeEnd = cueToken.end;

  // Look ahead for scope boundary
  for (let i = cueIndex + 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for scope enders
    if (SCOPE_ENDERS.includes(token.word)) {
      // Comma might extend scope if followed by scope extender
      if (token.word === ',' && i + 1 < tokens.length) {
        const nextWord = tokens[i + 1].word;
        if (SCOPE_EXTENDERS.some((ext) => ext.split(' ')[0] === nextWord)) {
          continue;
        }
      }
      scopeEnd = token.start;
      break;
    }

    // Update scope end
    scopeEnd = token.end;

    // Limit scope to reasonable length (typically clause-level)
    if (i - cueIndex > 10) {
      break;
    }
  }

  // Extract scope text
  const scopeText = originalText.slice(scopeStart, scopeEnd).trim();

  return { scopeStart, scopeEnd, scopeText };
}

/**
 * Detect negation spans in text
 *
 * @param text - Text to analyze
 * @returns Array of negation spans with cue and scope
 *
 * @example
 * ```typescript
 * const spans = detectNegation("I do not like this product");
 * // [{ cue: "not", scope: "like this product", ... }]
 * ```
 */
export function detectNegation(text: string): NegationSpan[] {
  const spans: NegationSpan[] = [];
  const tokens = tokenizeWithPositions(text);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    // Check for standard negation cues
    if (isNegationCue(token.word)) {
      const { scopeStart, scopeEnd, scopeText } = findNegationScope(tokens, i, text);

      if (scopeText.length > 0) {
        spans.push({
          cue: token.word,
          start: token.start,
          scope: scopeText,
          scopeStart,
          scopeEnd,
          scopeText,
          originalText: text.slice(token.start, scopeEnd),
        });
      }
    }

    // Check for prefix negations
    const prefixCheck = hasNegationPrefix(token.word);
    if (prefixCheck.hasPrefix) {
      spans.push({
        cue: prefixCheck.prefix!,
        start: token.start,
        scope: prefixCheck.stem!,
        scopeStart: token.start + prefixCheck.prefix!.length,
        scopeEnd: token.end,
        scopeText: prefixCheck.stem!,
        originalText: token.word,
      });
    }
  }

  return spans;
}

/**
 * Check if a phrase is negated
 *
 * @param text - Full text
 * @param phrase - Phrase to check
 * @returns Whether the phrase is in a negation scope
 */
export function isNegated(text: string, phrase: string): boolean {
  const spans = detectNegation(text);
  const phraseLower = phrase.toLowerCase();

  for (const span of spans) {
    if (span.scopeText.toLowerCase().includes(phraseLower)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the negation context for a phrase
 *
 * @param text - Full text
 * @param phrase - Phrase to check
 * @returns Negation span if negated, null otherwise
 */
export function getNegationContext(text: string, phrase: string): NegationSpan | null {
  const spans = detectNegation(text);
  const phraseLower = phrase.toLowerCase();

  for (const span of spans) {
    if (span.scopeText.toLowerCase().includes(phraseLower)) {
      return span;
    }
  }

  return null;
}

/**
 * Analyze negation intensity
 *
 * Returns a score from 0 (no negation) to 1 (strong negation)
 */
export function analyzeNegationIntensity(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;

  if (totalWords === 0) return 0;

  const spans = detectNegation(text);

  // Count negated words
  let negatedWordCount = 0;
  for (const span of spans) {
    const scopeWords = span.scopeText.split(/\s+/).length;
    negatedWordCount += scopeWords;
  }

  // Also count double negations (intensifiers)
  const doubleNegations = spans.filter((span, idx) =>
    spans.some(
      (other, otherIdx) =>
        idx !== otherIdx &&
        span.scopeStart <= other.start &&
        span.scopeEnd >= other.start
    )
  ).length;

  // Calculate intensity
  const baseIntensity = Math.min(negatedWordCount / totalWords, 1);
  const doubleNegationBonus = doubleNegations * 0.1;

  return Math.min(baseIntensity + doubleNegationBonus, 1);
}

/**
 * Extract non-negated and negated portions of text
 */
export function segmentByNegation(text: string): {
  affirmative: string[];
  negated: string[];
} {
  const spans = detectNegation(text);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const affirmative: string[] = [];
  const negated: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    const sentenceSpans = spans.filter(
      (span) =>
        text.indexOf(trimmed) <= span.start &&
        text.indexOf(trimmed) + trimmed.length >= span.scopeEnd
    );

    if (sentenceSpans.length > 0) {
      negated.push(trimmed);
    } else {
      affirmative.push(trimmed);
    }
  }

  return { affirmative, negated };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectNegation,
  isNegationCue,
  hasNegationPrefix,
  isNegated,
  getNegationContext,
  analyzeNegationIntensity,
  segmentByNegation,
  NEGATION_CUES,
  ALL_NEGATION_CUES,
};
