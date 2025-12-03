/**
 * Temporal Expression Extraction
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Extract temporal expressions from text
 * - Identify recency signals
 * - Normalize dates to ISO format
 * - Detect relative time references
 */

// ============================================================================
// TYPES
// ============================================================================

export type TemporalType =
  | 'absolute'      // "January 2024", "2023-12-15"
  | 'relative'      // "yesterday", "last week"
  | 'duration'      // "for 3 years", "since 2020"
  | 'frequency'     // "daily", "every month"
  | 'vague'         // "recently", "in the past"
  | 'future';       // "next year", "upcoming"

export type RecencyLevel = 'current' | 'recent' | 'moderate' | 'dated' | 'historical';

export interface TemporalExpression {
  text: string;
  type: TemporalType;
  normalizedDate?: string;  // ISO format if applicable
  recency: RecencyLevel;
  confidence: number;
  startOffset: number;
  endOffset: number;
}

export interface TemporalAnalysis {
  expressions: TemporalExpression[];
  overallRecency: RecencyLevel;
  recencyScore: number;  // 0-100, higher = more recent
  hasFutureReferences: boolean;
  temporalDensity: number;  // expressions per 100 words
}

// ============================================================================
// PATTERNS
// ============================================================================

const ABSOLUTE_PATTERNS = [
  // Full dates
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/gi,
  /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/gi,

  // Month Year
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi,
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\.?\s+(\d{4})\b/gi,

  // Year only
  /\b(19|20)\d{2}\b/g,

  // Quarter
  /\bQ[1-4]\s+(\d{4})\b/gi,
];

const RELATIVE_PATTERNS: Array<{ pattern: RegExp; daysAgo: number }> = [
  { pattern: /\btoday\b/gi, daysAgo: 0 },
  { pattern: /\byesterday\b/gi, daysAgo: 1 },
  { pattern: /\blast\s+week\b/gi, daysAgo: 7 },
  { pattern: /\bthis\s+week\b/gi, daysAgo: 3 },
  { pattern: /\blast\s+month\b/gi, daysAgo: 30 },
  { pattern: /\bthis\s+month\b/gi, daysAgo: 15 },
  { pattern: /\blast\s+year\b/gi, daysAgo: 365 },
  { pattern: /\bthis\s+year\b/gi, daysAgo: 180 },
  { pattern: /\b(\d+)\s+days?\s+ago\b/gi, daysAgo: -1 },  // Dynamic
  { pattern: /\b(\d+)\s+weeks?\s+ago\b/gi, daysAgo: -1 }, // Dynamic
  { pattern: /\b(\d+)\s+months?\s+ago\b/gi, daysAgo: -1 }, // Dynamic
  { pattern: /\b(\d+)\s+years?\s+ago\b/gi, daysAgo: -1 }, // Dynamic
];

const DURATION_PATTERNS = [
  /\bfor\s+(\d+)\s+(days?|weeks?|months?|years?)\b/gi,
  /\bsince\s+(\d{4})\b/gi,
  /\bsince\s+(January|February|March|April|May|June|July|August|September|October|November|December)/gi,
  /\bover\s+the\s+(past|last)\s+(\d+)\s+(days?|weeks?|months?|years?)\b/gi,
];

const FREQUENCY_PATTERNS = [
  /\b(daily|weekly|monthly|yearly|annually|quarterly)\b/gi,
  /\bevery\s+(day|week|month|year|quarter)\b/gi,
  /\b(\d+)\s+times?\s+(a|per)\s+(day|week|month|year)\b/gi,
];

const VAGUE_PATTERNS = [
  /\brecently\b/gi,
  /\bin\s+the\s+past\b/gi,
  /\bhistorically\b/gi,
  /\btraditionally\b/gi,
  /\bpreviously\b/gi,
  /\bformerly\b/gi,
  /\bcurrently\b/gi,
  /\bnowadays\b/gi,
  /\bthese\s+days\b/gi,
  /\bat\s+present\b/gi,
];

const FUTURE_PATTERNS = [
  /\bnext\s+(week|month|year|quarter)\b/gi,
  /\bupcoming\b/gi,
  /\bin\s+the\s+future\b/gi,
  /\bsoon\b/gi,
  /\bwill\s+be\b/gi,
  /\bgoing\s+to\b/gi,
  /\bexpected\s+to\b/gi,
  /\bplanned\s+for\b/gi,
];

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Calculate recency level from days ago
 */
function getRecencyLevel(daysAgo: number): RecencyLevel {
  if (daysAgo <= 7) return 'current';
  if (daysAgo <= 30) return 'recent';
  if (daysAgo <= 180) return 'moderate';
  if (daysAgo <= 730) return 'dated';
  return 'historical';
}

/**
 * Calculate recency score (0-100)
 */
function getRecencyScore(daysAgo: number): number {
  if (daysAgo <= 0) return 100;
  if (daysAgo <= 7) return 95;
  if (daysAgo <= 30) return 80;
  if (daysAgo <= 90) return 60;
  if (daysAgo <= 180) return 45;
  if (daysAgo <= 365) return 30;
  if (daysAgo <= 730) return 15;
  return 5;
}

/**
 * Parse year from text and calculate days ago
 */
function yearToDaysAgo(year: number): number {
  const currentYear = new Date().getFullYear();
  const diffYears = currentYear - year;
  return diffYears * 365;
}

/**
 * Extract absolute temporal expressions
 */
function extractAbsolute(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  // Year patterns
  const yearRegex = /\b(19|20)\d{2}\b/g;
  let match;

  while ((match = yearRegex.exec(text)) !== null) {
    const year = parseInt(match[0]);
    const daysAgo = yearToDaysAgo(year);

    expressions.push({
      text: match[0],
      type: 'absolute',
      normalizedDate: `${year}-01-01`,
      recency: getRecencyLevel(daysAgo),
      confidence: 0.9,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    });
  }

  // Month Year patterns
  const monthYearRegex = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi;

  while ((match = monthYearRegex.exec(text)) !== null) {
    const months: Record<string, string> = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12',
    };

    const month = months[match[1].toLowerCase()];
    const year = match[2];
    const normalizedDate = `${year}-${month}-01`;
    const targetDate = new Date(normalizedDate);
    const daysAgo = Math.floor((Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24));

    expressions.push({
      text: match[0],
      type: 'absolute',
      normalizedDate,
      recency: getRecencyLevel(daysAgo),
      confidence: 0.95,
      startOffset: match.index,
      endOffset: match.index + match[0].length,
    });
  }

  return expressions;
}

/**
 * Extract relative temporal expressions
 */
function extractRelative(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  for (const { pattern, daysAgo: baseDays } of RELATIVE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      let daysAgo = baseDays;

      // Handle dynamic patterns like "X days ago"
      if (baseDays === -1 && match[1]) {
        const num = parseInt(match[1]);
        if (pattern.source.includes('days')) daysAgo = num;
        else if (pattern.source.includes('weeks')) daysAgo = num * 7;
        else if (pattern.source.includes('months')) daysAgo = num * 30;
        else if (pattern.source.includes('years')) daysAgo = num * 365;
      }

      const normalizedDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      expressions.push({
        text: match[0],
        type: 'relative',
        normalizedDate,
        recency: getRecencyLevel(daysAgo),
        confidence: 0.85,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
  }

  return expressions;
}

/**
 * Extract duration expressions
 */
function extractDuration(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  for (const pattern of DURATION_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      expressions.push({
        text: match[0],
        type: 'duration',
        recency: 'moderate',
        confidence: 0.8,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
  }

  return expressions;
}

/**
 * Extract frequency expressions
 */
function extractFrequency(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  for (const pattern of FREQUENCY_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      expressions.push({
        text: match[0],
        type: 'frequency',
        recency: 'current',
        confidence: 0.9,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
  }

  return expressions;
}

/**
 * Extract vague temporal expressions
 */
function extractVague(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  for (const pattern of VAGUE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const isRecent = /recently|currently|nowadays|these\s+days|at\s+present/i.test(match[0]);

      expressions.push({
        text: match[0],
        type: 'vague',
        recency: isRecent ? 'recent' : 'moderate',
        confidence: 0.6,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
  }

  return expressions;
}

/**
 * Extract future references
 */
function extractFuture(text: string): TemporalExpression[] {
  const expressions: TemporalExpression[] = [];

  for (const pattern of FUTURE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      expressions.push({
        text: match[0],
        type: 'future',
        recency: 'current',
        confidence: 0.85,
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
  }

  return expressions;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Extract and analyze all temporal expressions from text
 */
export function extractTemporalExpressions(text: string): TemporalAnalysis {
  // Extract all types
  const absolute = extractAbsolute(text);
  const relative = extractRelative(text);
  const duration = extractDuration(text);
  const frequency = extractFrequency(text);
  const vague = extractVague(text);
  const future = extractFuture(text);

  // Combine and deduplicate (by offset)
  const allExpressions = [...absolute, ...relative, ...duration, ...frequency, ...vague, ...future];

  // Sort by start offset
  allExpressions.sort((a, b) => a.startOffset - b.startOffset);

  // Remove overlapping expressions (keep higher confidence)
  const expressions: TemporalExpression[] = [];
  for (const expr of allExpressions) {
    const overlapping = expressions.find(
      e => (expr.startOffset >= e.startOffset && expr.startOffset < e.endOffset) ||
           (expr.endOffset > e.startOffset && expr.endOffset <= e.endOffset)
    );

    if (!overlapping) {
      expressions.push(expr);
    } else if (expr.confidence > overlapping.confidence) {
      const idx = expressions.indexOf(overlapping);
      expressions[idx] = expr;
    }
  }

  // Calculate overall recency
  const recencyScores = expressions
    .filter(e => e.type !== 'future')
    .map(e => {
      if (e.normalizedDate) {
        const daysAgo = Math.floor((Date.now() - new Date(e.normalizedDate).getTime()) / (1000 * 60 * 60 * 24));
        return getRecencyScore(daysAgo);
      }
      // Default scores for vague terms
      if (e.recency === 'current') return 90;
      if (e.recency === 'recent') return 70;
      if (e.recency === 'moderate') return 45;
      if (e.recency === 'dated') return 20;
      return 10;
    });

  const avgRecencyScore = recencyScores.length > 0
    ? recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length
    : 50; // Default neutral

  // Determine overall recency level
  let overallRecency: RecencyLevel;
  if (avgRecencyScore >= 85) overallRecency = 'current';
  else if (avgRecencyScore >= 60) overallRecency = 'recent';
  else if (avgRecencyScore >= 35) overallRecency = 'moderate';
  else if (avgRecencyScore >= 15) overallRecency = 'dated';
  else overallRecency = 'historical';

  // Calculate temporal density
  const wordCount = text.split(/\s+/).length;
  const temporalDensity = (expressions.length / wordCount) * 100;

  return {
    expressions,
    overallRecency,
    recencyScore: Math.round(avgRecencyScore),
    hasFutureReferences: future.length > 0,
    temporalDensity: Math.round(temporalDensity * 100) / 100,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  extractTemporalExpressions,
  getRecencyLevel,
  getRecencyScore,
};
