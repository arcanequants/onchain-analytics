/**
 * Comparative and Superlative Pattern Detection
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Detect comparative patterns (better than, more X than)
 * - Detect superlative patterns (best, most, leading)
 * - Extract comparison targets and subjects
 * - Score comparison strength and direction
 */

// ============================================================================
// TYPES
// ============================================================================

export type ComparisonType =
  | 'comparative'     // "better than", "more expensive than"
  | 'superlative'     // "the best", "most popular"
  | 'equality'        // "as good as", "same as"
  | 'inequality';     // "different from", "not as good as"

export type ComparisonDirection =
  | 'positive'        // Subject is better/higher
  | 'negative'        // Subject is worse/lower
  | 'neutral';        // Neutral comparison

export type ComparisonDimension =
  | 'quality'         // good, bad, excellent
  | 'price'           // expensive, cheap, affordable
  | 'speed'           // fast, slow, quick
  | 'ease'            // easy, difficult, simple
  | 'popularity'      // popular, common, rare
  | 'size'            // big, small, large
  | 'reliability'     // reliable, stable, trustworthy
  | 'innovation'      // innovative, modern, cutting-edge
  | 'support'         // supportive, helpful, responsive
  | 'general';        // unspecified dimension

export interface ComparisonPattern {
  text: string;
  type: ComparisonType;
  direction: ComparisonDirection;
  dimension: ComparisonDimension;
  subject?: string;           // Entity being compared (if detected)
  target?: string;            // Entity compared against (if detected)
  modifier?: string;          // Intensifier (much, slightly, far)
  strength: number;           // 0-1, how strong the comparison is
  startOffset: number;
  endOffset: number;
  confidence: number;
}

export interface ComparisonAnalysis {
  patterns: ComparisonPattern[];
  dominantDirection: ComparisonDirection;
  dominantDimension: ComparisonDimension;
  comparisonDensity: number;  // Comparisons per 100 words
  hasSuperlatives: boolean;
  hasComparatives: boolean;
  subjectMentions: string[];
  targetMentions: string[];
}

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

interface PatternDefinition {
  pattern: RegExp;
  type: ComparisonType;
  direction: ComparisonDirection;
  dimension: ComparisonDimension;
  strengthBase: number;
}

// Comparative patterns
const COMPARATIVE_PATTERNS: PatternDefinition[] = [
  // Quality - Positive
  {
    pattern: /\b(better|superior|greater)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'quality', strengthBase: 0.8
  },
  {
    pattern: /\bmore\s+(reliable|trustworthy|accurate|effective|powerful)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'quality', strengthBase: 0.7
  },

  // Quality - Negative
  {
    pattern: /\b(worse|inferior|poorer)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'negative', dimension: 'quality', strengthBase: 0.8
  },
  {
    pattern: /\bless\s+(reliable|trustworthy|accurate|effective|powerful)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'negative', dimension: 'quality', strengthBase: 0.7
  },

  // Price
  {
    pattern: /\b(cheaper|more\s+affordable|less\s+expensive)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'price', strengthBase: 0.7
  },
  {
    pattern: /\b(more\s+expensive|pricier|costlier)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'negative', dimension: 'price', strengthBase: 0.7
  },

  // Speed
  {
    pattern: /\b(faster|quicker|speedier)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'speed', strengthBase: 0.7
  },
  {
    pattern: /\b(slower|more\s+sluggish)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'negative', dimension: 'speed', strengthBase: 0.7
  },

  // Ease
  {
    pattern: /\b(easier|simpler|more\s+intuitive)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'ease', strengthBase: 0.7
  },
  {
    pattern: /\b(harder|more\s+difficult|more\s+complex)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'negative', dimension: 'ease', strengthBase: 0.7
  },

  // Popularity
  {
    pattern: /\b(more\s+popular|more\s+widely\s+used|more\s+common)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'positive', dimension: 'popularity', strengthBase: 0.6
  },

  // General comparative
  {
    pattern: /\bmore\s+(\w+)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'neutral', dimension: 'general', strengthBase: 0.5
  },
  {
    pattern: /\bless\s+(\w+)\s+(than|compared\s+to)\b/gi,
    type: 'comparative', direction: 'neutral', dimension: 'general', strengthBase: 0.5
  },
];

// Superlative patterns
const SUPERLATIVE_PATTERNS: PatternDefinition[] = [
  // Quality - Positive
  {
    pattern: /\b(the\s+)?(best|greatest|finest|top|leading|premier)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'quality', strengthBase: 0.9
  },
  {
    pattern: /\b(the\s+)?most\s+(reliable|trustworthy|accurate|effective|powerful|popular)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'quality', strengthBase: 0.85
  },
  {
    pattern: /\bnumber\s+(one|1|#1)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'quality', strengthBase: 0.95
  },
  {
    pattern: /\bworld[- ]class\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'quality', strengthBase: 0.8
  },
  {
    pattern: /\bindustry[- ]leading\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'quality', strengthBase: 0.85
  },

  // Quality - Negative
  {
    pattern: /\b(the\s+)?(worst|poorest|lowest)\b/gi,
    type: 'superlative', direction: 'negative', dimension: 'quality', strengthBase: 0.9
  },
  {
    pattern: /\b(the\s+)?least\s+(reliable|trustworthy|accurate|effective)\b/gi,
    type: 'superlative', direction: 'negative', dimension: 'quality', strengthBase: 0.85
  },

  // Price
  {
    pattern: /\b(the\s+)?(cheapest|most\s+affordable|least\s+expensive)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'price', strengthBase: 0.8
  },
  {
    pattern: /\b(the\s+)?(most\s+expensive|priciest|costliest)\b/gi,
    type: 'superlative', direction: 'negative', dimension: 'price', strengthBase: 0.8
  },

  // Speed
  {
    pattern: /\b(the\s+)?(fastest|quickest|speediest)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'speed', strengthBase: 0.8
  },
  {
    pattern: /\b(the\s+)?(slowest|most\s+sluggish)\b/gi,
    type: 'superlative', direction: 'negative', dimension: 'speed', strengthBase: 0.8
  },

  // Ease
  {
    pattern: /\b(the\s+)?(easiest|simplest|most\s+intuitive)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'ease', strengthBase: 0.8
  },

  // Innovation
  {
    pattern: /\b(the\s+)?most\s+(innovative|advanced|cutting[- ]edge|modern)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'innovation', strengthBase: 0.8
  },

  // Popularity
  {
    pattern: /\b(the\s+)?most\s+(popular|widely\s+used|common)\b/gi,
    type: 'superlative', direction: 'positive', dimension: 'popularity', strengthBase: 0.7
  },
];

// Equality patterns
const EQUALITY_PATTERNS: PatternDefinition[] = [
  {
    pattern: /\bas\s+(\w+)\s+as\b/gi,
    type: 'equality', direction: 'neutral', dimension: 'general', strengthBase: 0.6
  },
  {
    pattern: /\b(same|similar|equivalent|comparable)\s+(as|to)\b/gi,
    type: 'equality', direction: 'neutral', dimension: 'general', strengthBase: 0.6
  },
  {
    pattern: /\bon\s+par\s+with\b/gi,
    type: 'equality', direction: 'neutral', dimension: 'general', strengthBase: 0.7
  },
  {
    pattern: /\bjust\s+like\b/gi,
    type: 'equality', direction: 'neutral', dimension: 'general', strengthBase: 0.5
  },
];

// Inequality patterns
const INEQUALITY_PATTERNS: PatternDefinition[] = [
  {
    pattern: /\bnot\s+as\s+(\w+)\s+as\b/gi,
    type: 'inequality', direction: 'negative', dimension: 'general', strengthBase: 0.6
  },
  {
    pattern: /\bdifferent\s+(from|than)\b/gi,
    type: 'inequality', direction: 'neutral', dimension: 'general', strengthBase: 0.5
  },
  {
    pattern: /\bunlike\b/gi,
    type: 'inequality', direction: 'neutral', dimension: 'general', strengthBase: 0.4
  },
];

// Intensifiers that modify strength
const INTENSIFIERS: Record<string, number> = {
  'much': 0.15,
  'far': 0.15,
  'way': 0.15,
  'significantly': 0.2,
  'considerably': 0.15,
  'substantially': 0.15,
  'vastly': 0.2,
  'dramatically': 0.2,
  'slightly': -0.1,
  'somewhat': -0.05,
  'marginally': -0.1,
  'a bit': -0.1,
  'a little': -0.1,
};

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Detect intensifier in context
 */
function detectIntensifier(text: string, matchIndex: number): { modifier: string | undefined; strengthMod: number } {
  // Look for intensifier in the 20 characters before the match
  const beforeText = text.substring(Math.max(0, matchIndex - 25), matchIndex).toLowerCase();

  for (const [intensifier, mod] of Object.entries(INTENSIFIERS)) {
    if (beforeText.includes(intensifier)) {
      return { modifier: intensifier, strengthMod: mod };
    }
  }

  return { modifier: undefined, strengthMod: 0 };
}

/**
 * Extract subject and target from comparison context
 */
function extractComparisonEntities(text: string, matchIndex: number, matchText: string): { subject?: string; target?: string } {
  // Simple heuristic: look for capitalized words/phrases nearby
  const contextBefore = text.substring(Math.max(0, matchIndex - 50), matchIndex);
  const contextAfter = text.substring(matchIndex + matchText.length, Math.min(text.length, matchIndex + matchText.length + 50));

  // Pattern for potential entity names (capitalized words, possibly with spaces)
  const entityPattern = /\b([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)\b/g;

  let subject: string | undefined;
  let target: string | undefined;

  // Subject is typically before the comparison
  const beforeMatches = [...contextBefore.matchAll(entityPattern)];
  if (beforeMatches.length > 0) {
    subject = beforeMatches[beforeMatches.length - 1][1]; // Take the closest one
  }

  // Target is typically after "than" or "compared to"
  const afterMatches = [...contextAfter.matchAll(entityPattern)];
  if (afterMatches.length > 0) {
    target = afterMatches[0][1]; // Take the first one after
  }

  return { subject, target };
}

/**
 * Extract patterns of a specific type
 */
function extractPatterns(text: string, patterns: PatternDefinition[]): ComparisonPattern[] {
  const results: ComparisonPattern[] = [];

  for (const { pattern, type, direction, dimension, strengthBase } of patterns) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const { modifier, strengthMod } = detectIntensifier(text, match.index);
      const { subject, target } = extractComparisonEntities(text, match.index, match[0]);

      results.push({
        text: match[0],
        type,
        direction,
        dimension,
        subject,
        target,
        modifier,
        strength: Math.min(1, Math.max(0, strengthBase + strengthMod)),
        startOffset: match.index,
        endOffset: match.index + match[0].length,
        confidence: 0.8,
      });
    }
  }

  return results;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Analyze text for comparative and superlative patterns
 */
export function analyzeComparativePatterns(text: string): ComparisonAnalysis {
  // Extract all pattern types
  const comparatives = extractPatterns(text, COMPARATIVE_PATTERNS);
  const superlatives = extractPatterns(text, SUPERLATIVE_PATTERNS);
  const equalities = extractPatterns(text, EQUALITY_PATTERNS);
  const inequalities = extractPatterns(text, INEQUALITY_PATTERNS);

  // Combine all patterns
  const allPatterns = [...comparatives, ...superlatives, ...equalities, ...inequalities];

  // Sort by offset
  allPatterns.sort((a, b) => a.startOffset - b.startOffset);

  // Remove overlapping patterns (keep higher confidence/strength)
  const patterns: ComparisonPattern[] = [];
  for (const pattern of allPatterns) {
    const overlapping = patterns.find(
      p => (pattern.startOffset >= p.startOffset && pattern.startOffset < p.endOffset) ||
           (pattern.endOffset > p.startOffset && pattern.endOffset <= p.endOffset)
    );

    if (!overlapping) {
      patterns.push(pattern);
    } else if (pattern.strength > overlapping.strength) {
      const idx = patterns.indexOf(overlapping);
      patterns[idx] = pattern;
    }
  }

  // Calculate dominant direction
  const directionCounts: Record<ComparisonDirection, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };
  for (const p of patterns) {
    directionCounts[p.direction]++;
  }
  const dominantDirection = (Object.entries(directionCounts) as [ComparisonDirection, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  // Calculate dominant dimension
  const dimensionCounts: Record<ComparisonDimension, number> = {
    quality: 0, price: 0, speed: 0, ease: 0, popularity: 0,
    size: 0, reliability: 0, innovation: 0, support: 0, general: 0,
  };
  for (const p of patterns) {
    dimensionCounts[p.dimension]++;
  }
  const dominantDimension = (Object.entries(dimensionCounts) as [ComparisonDimension, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'general';

  // Calculate density
  const wordCount = text.split(/\s+/).length;
  const comparisonDensity = (patterns.length / wordCount) * 100;

  // Collect unique subjects and targets
  const subjectMentions = [...new Set(patterns.map(p => p.subject).filter(Boolean) as string[])];
  const targetMentions = [...new Set(patterns.map(p => p.target).filter(Boolean) as string[])];

  return {
    patterns,
    dominantDirection,
    dominantDimension,
    comparisonDensity: Math.round(comparisonDensity * 100) / 100,
    hasSuperlatives: superlatives.length > 0,
    hasComparatives: comparatives.length > 0,
    subjectMentions,
    targetMentions,
  };
}

/**
 * Get comparison summary for display
 */
export function getComparisonSummary(analysis: ComparisonAnalysis): string {
  const parts: string[] = [];

  if (analysis.hasSuperlatives && analysis.hasComparatives) {
    parts.push('Contains both superlative and comparative language');
  } else if (analysis.hasSuperlatives) {
    parts.push('Contains superlative claims');
  } else if (analysis.hasComparatives) {
    parts.push('Contains direct comparisons');
  }

  if (analysis.dominantDirection !== 'neutral') {
    parts.push(`predominantly ${analysis.dominantDirection} framing`);
  }

  if (analysis.dominantDimension !== 'general') {
    parts.push(`focused on ${analysis.dominantDimension}`);
  }

  if (analysis.subjectMentions.length > 0) {
    parts.push(`mentions: ${analysis.subjectMentions.slice(0, 3).join(', ')}`);
  }

  return parts.join('; ') || 'No comparative patterns detected';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  analyzeComparativePatterns,
  getComparisonSummary,
};
