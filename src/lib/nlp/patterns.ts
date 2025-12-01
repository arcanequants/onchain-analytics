/**
 * Pattern Detection
 *
 * Detect linguistic patterns: negation, hedges, comparatives, discourse markers
 *
 * Phase 3, Week 10
 */

import type {
  NegationSpan,
  HedgeDetection,
  CertaintyLevel,
  ComparativePattern,
  ComparativeType,
  DiscourseMarker,
  DiscourseFunction,
  Quotation,
  TemporalExpression,
  TemporalType,
} from './types';
import { tokenizeSentences } from './tokenizer';

// ================================================================
// NEGATION DETECTION
// ================================================================

const NEGATION_CUES = [
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'none',
  "n't", "don't", "doesn't", "didn't", "won't", "wouldn't", "couldn't",
  "shouldn't", "can't", "cannot", "isn't", "aren't", "wasn't", "weren't",
  "hasn't", "haven't", "hadn't", 'without', 'lack', 'lacking', 'absent',
  'fail', 'failed', 'fails', 'unable', 'barely', 'hardly', 'scarcely',
];

const NEGATION_SCOPE_ENDERS = [
  '.', ',', ';', ':', 'but', 'however', 'although', 'though', 'yet',
  'and', 'or', 'because', 'since', 'while', 'whereas', 'if', 'unless',
];

/**
 * Detect negation spans in text
 */
export function detectNegation(text: string): NegationSpan[] {
  const results: NegationSpan[] = [];
  const sentences = tokenizeSentences(text);

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();

    for (const cue of NEGATION_CUES) {
      const cueIndex = lowerSentence.indexOf(cue);

      if (cueIndex !== -1) {
        // Find scope end
        let scopeEnd = sentence.length;
        for (const ender of NEGATION_SCOPE_ENDERS) {
          const enderIndex = lowerSentence.indexOf(ender, cueIndex + cue.length);
          if (enderIndex !== -1 && enderIndex < scopeEnd) {
            scopeEnd = enderIndex;
          }
        }

        // Limit scope to ~5-6 words after negation
        const words = sentence.slice(cueIndex).split(/\s+/);
        const maxWords = Math.min(words.length, 6);
        const scopeText = words.slice(0, maxWords).join(' ');

        results.push({
          cue,
          start: cueIndex,
          scope: scopeText,
          scopeStart: cueIndex,
          scopeEnd: cueIndex + scopeText.length,
          scopeText,
          originalText: sentence,
        });
      }
    }
  }

  return results;
}

/**
 * Check if a phrase is negated
 */
export function isNegated(text: string, phrase: string): boolean {
  const negations = detectNegation(text);
  const lowerPhrase = phrase.toLowerCase();

  return negations.some((neg) =>
    neg.scopeText.toLowerCase().includes(lowerPhrase)
  );
}

// ================================================================
// HEDGE/CERTAINTY DETECTION
// ================================================================

const HEDGE_PATTERNS: Array<{ pattern: RegExp | string; certainty: CertaintyLevel }> = [
  // Low certainty
  { pattern: /\b(might|may|could|possibly|perhaps|maybe)\b/i, certainty: 'low' },
  { pattern: /\b(seems? to|appears? to|tends? to)\b/i, certainty: 'low' },
  { pattern: /\b(somewhat|rather|fairly|quite|relatively)\b/i, certainty: 'low' },
  { pattern: /\b(in some cases|sometimes|occasionally)\b/i, certainty: 'low' },
  { pattern: /\b(suggest(s|ed)?|indicate(s|d)?|imply|implies)\b/i, certainty: 'low' },
  { pattern: /\b(uncertain|unclear|unsure|doubtful)\b/i, certainty: 'low' },
  { pattern: /\b(estimate(s|d)?|approximate(ly)?)\b/i, certainty: 'low' },

  // Medium certainty
  { pattern: /\b(probably|likely|generally|usually|typically)\b/i, certainty: 'medium' },
  { pattern: /\b(should|would|often|frequently)\b/i, certainty: 'medium' },
  { pattern: /\b(in most cases|for the most part|largely)\b/i, certainty: 'medium' },
  { pattern: /\b(believe(s|d)?|think(s)?|consider(s|ed)?)\b/i, certainty: 'medium' },
  { pattern: /\b(expected|anticipated|presumed)\b/i, certainty: 'medium' },

  // High certainty
  { pattern: /\b(certainly|definitely|absolutely|clearly|obviously)\b/i, certainty: 'high' },
  { pattern: /\b(always|never|must|will|undoubtedly)\b/i, certainty: 'high' },
  { pattern: /\b(proven|confirmed|established|demonstrated)\b/i, certainty: 'high' },
  { pattern: /\b(without doubt|no question|for certain)\b/i, certainty: 'high' },
  { pattern: /\b(is|are|was|were) (known|recognized|accepted)\b/i, certainty: 'high' },
];

/**
 * Detect hedges and certainty markers in text
 */
export function detectHedges(text: string): HedgeDetection[] {
  const results: HedgeDetection[] = [];
  const sentences = tokenizeSentences(text);

  for (const sentence of sentences) {
    for (const { pattern, certainty } of HEDGE_PATTERNS) {
      // Ensure we have a global regex for matchAll
      const regex = pattern instanceof RegExp
        ? new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
        : new RegExp(pattern, 'gi');
      const matches = sentence.matchAll(regex);

      for (const match of matches) {
        results.push({
          hedge: match[0],
          phrase: match[0],
          certainty,
          position: match.index || 0,
          context: sentence,
        });
      }
    }
  }

  return results;
}

/**
 * Get overall certainty level of text
 */
export function getTextCertainty(text: string): {
  level: CertaintyLevel;
  hedgeCount: number;
  distribution: Record<CertaintyLevel, number>;
} {
  const hedges = detectHedges(text);

  const distribution: Record<CertaintyLevel, number> = {
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const hedge of hedges) {
    distribution[hedge.certainty]++;
  }

  // Determine overall level
  let level: CertaintyLevel;
  if (distribution.low > distribution.high + distribution.medium) {
    level = 'low';
  } else if (distribution.high > distribution.low + distribution.medium) {
    level = 'high';
  } else {
    level = 'medium';
  }

  return { level, hedgeCount: hedges.length, distribution };
}

// ================================================================
// COMPARATIVE PATTERN DETECTION
// ================================================================

const COMPARATIVE_PATTERNS: Array<{
  pattern: RegExp;
  type: ComparativeType;
}> = [
  // Superiority
  { pattern: /\b(\w+)\s+(?:is|are|was|were)\s+better\s+than\s+(\w+)/gi, type: 'superiority' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+the\s+best\b/gi, type: 'superiority' },
  { pattern: /\b(\w+)\s+outperforms?\s+(\w+)/gi, type: 'superiority' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+superior\s+to\s+(\w+)/gi, type: 'superiority' },
  { pattern: /\b(\w+)\s+leads?\s+(?:the|in)/gi, type: 'superiority' },
  { pattern: /\bmore\s+\w+\s+than\b/gi, type: 'superiority' },
  { pattern: /\b-er\s+than\b/gi, type: 'superiority' },
  { pattern: /\b(top|leading|premier|best|#1|number\s*one)\s+(\w+)/gi, type: 'superiority' },

  // Inferiority
  { pattern: /\b(\w+)\s+(?:is|are|was|were)\s+worse\s+than\s+(\w+)/gi, type: 'inferiority' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+the\s+worst\b/gi, type: 'inferiority' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+inferior\s+to\s+(\w+)/gi, type: 'inferiority' },
  { pattern: /\bless\s+\w+\s+than\b/gi, type: 'inferiority' },
  { pattern: /\blags?\s+behind\b/gi, type: 'inferiority' },

  // Equality
  { pattern: /\b(\w+)\s+(?:is|are)\s+(?:as|the\s+same\s+as)\s+(\w+)/gi, type: 'equality' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+equal\s+to\s+(\w+)/gi, type: 'equality' },
  { pattern: /\b(\w+)\s+(?:is|are)\s+comparable\s+to\s+(\w+)/gi, type: 'equality' },
  { pattern: /\bsimilar\s+to\b/gi, type: 'equality' },

  // Preference
  { pattern: /\bprefer\s+(\w+)\s+(?:to|over)\s+(\w+)/gi, type: 'preference' },
  { pattern: /\brather\s+(?:than|use)\b/gi, type: 'preference' },
  { pattern: /\binstead\s+of\b/gi, type: 'preference' },
  { pattern: /\brecommend\s+(\w+)\s+over\s+(\w+)/gi, type: 'preference' },
];

/**
 * Detect comparative patterns in text
 */
export function detectComparatives(text: string): ComparativePattern[] {
  const results: ComparativePattern[] = [];

  for (const { pattern, type } of COMPARATIVE_PATTERNS) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      results.push({
        type,
        pattern: match[0],
        subject: match[1] || null,
        object: match[2] || null,
        keyword: match[0].split(/\s+/)[0],
        fullText: match[0],
        position: match.index || 0,
      });
    }
  }

  return results;
}

// ================================================================
// DISCOURSE MARKERS
// ================================================================

const DISCOURSE_MARKERS: Array<{
  markers: string[];
  function: DiscourseFunction;
}> = [
  {
    markers: ['however', 'but', 'although', 'though', 'yet', 'nevertheless', 'nonetheless', 'on the other hand', 'in contrast', 'conversely', 'whereas', 'while'],
    function: 'contrast',
  },
  {
    markers: ['also', 'furthermore', 'moreover', 'additionally', 'in addition', 'besides', 'as well', 'too', 'likewise', 'similarly'],
    function: 'addition',
  },
  {
    markers: ['because', 'therefore', 'thus', 'hence', 'consequently', 'as a result', 'so', 'since', 'due to', 'owing to', 'for this reason'],
    function: 'cause',
  },
  {
    markers: ['if', 'unless', 'provided', 'assuming', 'in case', 'given that', 'on condition that', 'supposing'],
    function: 'condition',
  },
  {
    markers: ['then', 'next', 'finally', 'first', 'second', 'third', 'afterwards', 'subsequently', 'meanwhile', 'previously', 'before', 'after'],
    function: 'temporal',
  },
  {
    markers: ['for example', 'for instance', 'such as', 'including', 'namely', 'specifically', 'in particular', 'e.g.', 'i.e.'],
    function: 'example',
  },
  {
    markers: ['indeed', 'certainly', 'definitely', 'in fact', 'actually', 'of course', 'surely', 'clearly', 'obviously'],
    function: 'emphasis',
  },
  {
    markers: ['in conclusion', 'overall', 'to sum up', 'in summary', 'finally', 'ultimately', 'in short', 'to conclude', 'all in all'],
    function: 'summary',
  },
];

/**
 * Detect discourse markers in text
 */
export function detectDiscourseMarkers(text: string): DiscourseMarker[] {
  const results: DiscourseMarker[] = [];
  const sentences = tokenizeSentences(text);
  const lowerText = text.toLowerCase();

  for (const { markers, function: func } of DISCOURSE_MARKERS) {
    for (const marker of markers) {
      const lowerMarker = marker.toLowerCase();
      let position = 0;

      while ((position = lowerText.indexOf(lowerMarker, position)) !== -1) {
        // Find the sentence containing this marker
        const sentence = sentences.find((s) =>
          s.toLowerCase().includes(lowerMarker)
        ) || '';

        results.push({
          marker,
          function: func,
          position,
          sentence,
        });

        position += marker.length;
      }
    }
  }

  return results;
}

// ================================================================
// QUOTATION EXTRACTION
// ================================================================

/**
 * Extract quotations and attributions from text
 */
export function extractQuotations(text: string): Quotation[] {
  const results: Quotation[] = [];

  // Pattern for quoted text with optional attribution
  const quotePatterns = [
    // "Quote" said/stated/etc. Person
    /"([^"]+)"\s*(?:,?\s*)(?:said|stated|claimed|noted|mentioned|explained|added|wrote|reported)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g,
    // Person said/stated/etc. "Quote"
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:said|stated|claimed|noted|mentioned|explained|added|wrote|reported)(?:\s+that)?\s*[,:]?\s*"([^"]+)"/g,
    // According to Person, "Quote"
    /[Aa]ccording to\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)[,:]?\s*"([^"]+)"/g,
    // Simple double quotes (with capture group)
    /"([^"]{10,})"/g,
    // Simple single quotes (with capture group)
    /'([^']{10,})'/g,
  ];

  for (const pattern of quotePatterns) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      let quote: string;
      let speaker: string | null = null;

      if (match.length >= 3 && match[1] && match[2]) {
        // Has attribution
        if (match[1].startsWith('"') || match[1].length > match[2].length) {
          quote = match[1].replace(/^["']|["']$/g, '');
          speaker = match[2];
        } else {
          speaker = match[1];
          quote = match[2].replace(/^["']|["']$/g, '');
        }
      } else if (match[1]) {
        // Simple quote with capture group
        quote = match[1].replace(/^["']|["']$/g, '');
      } else {
        // Fallback to full match
        quote = match[0].replace(/^["']|["']$/g, '');
      }

      // Detect attribution verb
      const verbMatch = match[0].match(/\b(said|stated|claimed|noted|mentioned|explained|added|wrote|reported)\b/i);
      const verb = verbMatch ? verbMatch[1] : null;

      results.push({
        text: quote,
        quote,
        speaker,
        verb,
        start: match.index || 0,
        end: (match.index || 0) + match[0].length,
      });
    }
  }

  return results;
}

// ================================================================
// TEMPORAL EXPRESSION DETECTION
// ================================================================

const TEMPORAL_PATTERNS: Array<{
  pattern: RegExp;
  type: TemporalType;
  recency: TemporalExpression['recency'];
}> = [
  // Absolute dates
  { pattern: /\b\d{4}-\d{2}-\d{2}\b/g, type: 'absolute', recency: 'unknown' },
  { pattern: /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi, type: 'absolute', recency: 'unknown' },
  { pattern: /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, type: 'absolute', recency: 'unknown' },

  // Relative - past
  { pattern: /\b(?:yesterday|last\s+(?:week|month|year)|(?:a|one)\s+(?:day|week|month|year)\s+ago|recently|previously|earlier|formerly|before)\b/gi, type: 'relative', recency: 'past' },
  { pattern: /\b(?:\d+)\s+(?:days?|weeks?|months?|years?)\s+ago\b/gi, type: 'relative', recency: 'past' },
  { pattern: /\bin the past\b/gi, type: 'relative', recency: 'past' },

  // Relative - present
  { pattern: /\b(?:today|now|currently|presently|at the moment|this\s+(?:week|month|year))\b/gi, type: 'relative', recency: 'present' },

  // Relative - future
  { pattern: /\b(?:tomorrow|next\s+(?:week|month|year)|in\s+\d+\s+(?:days?|weeks?|months?|years?)|soon|upcoming|forthcoming)\b/gi, type: 'relative', recency: 'future' },

  // Duration
  { pattern: /\b(?:for|over|during|within)\s+(?:\d+|a|an|several|many)\s+(?:days?|weeks?|months?|years?|hours?|minutes?)\b/gi, type: 'duration', recency: 'unknown' },

  // Frequency
  { pattern: /\b(?:always|never|sometimes|often|rarely|frequently|occasionally|daily|weekly|monthly|yearly|annually)\b/gi, type: 'frequency', recency: 'unknown' },
];

/**
 * Detect temporal expressions in text
 */
export function detectTemporalExpressions(text: string): TemporalExpression[] {
  const results: TemporalExpression[] = [];

  for (const { pattern, type, recency } of TEMPORAL_PATTERNS) {
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      // Try to normalize the value
      let normalizedValue: string | null = null;

      if (type === 'absolute') {
        // Try to parse as date
        const dateStr = match[0];
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          normalizedValue = date.toISOString().split('T')[0];
        }
      }

      results.push({
        expression: match[0],
        text: match[0],
        type,
        normalizedValue,
        position: match.index || 0,
        recency,
      });
    }
  }

  return results;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectNegation,
  isNegated,
  detectHedges,
  getTextCertainty,
  detectComparatives,
  detectDiscourseMarkers,
  extractQuotations,
  detectTemporalExpressions,
};
