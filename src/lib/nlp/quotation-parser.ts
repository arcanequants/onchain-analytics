/**
 * Quotation and Attribution Parser
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Extract direct quotes from text
 * - Identify quote attribution/sources
 * - Detect paraphrased content
 * - Track citation patterns
 */

// ============================================================================
// TYPES
// ============================================================================

export type QuotationType =
  | 'direct'       // "text in quotes"
  | 'indirect'     // according to X, reportedly
  | 'block'        // multi-line/extended quote
  | 'title'        // title of work in quotes
  | 'scare'        // "so-called" usage
  | 'paraphrase';  // X said that...

export interface Quote {
  id: string;
  text: string;
  type: QuotationType;
  attribution?: Attribution;
  startOffset: number;
  endOffset: number;
  confidence: number;
  metadata?: {
    isNested?: boolean;
    language?: 'en' | 'es' | 'pt';
    punctuationStyle?: 'american' | 'british' | 'continental';
  };
}

export interface Attribution {
  source: string;
  sourceType: 'person' | 'organization' | 'publication' | 'unknown';
  verb?: string;           // "said", "stated", "claimed"
  verbTense?: 'past' | 'present';
  position: 'before' | 'after' | 'embedded';
  confidence: number;
}

export interface QuotationAnalysis {
  quotes: Quote[];
  attributedQuotes: number;
  unattributedQuotes: number;
  quoteDensity: number;     // Quotes per 100 words
  topSources: Array<{ source: string; count: number }>;
  dominantType: QuotationType;
  averageQuoteLength: number;
}

// ============================================================================
// QUOTE PATTERNS
// ============================================================================

// Direct quote patterns (various quotation mark styles)
const DIRECT_QUOTE_PATTERNS: RegExp[] = [
  // American/British double quotes
  /"([^"]+)"/g,
  /\u201C([^\u201D]+)\u201D/g,  // Smart quotes " "

  // Single quotes (often for nested or British)
  /'([^']+)'/g,
  /\u2018([^\u2019]+)\u2019/g,  // Smart quotes ' '

  // Guillemets (European style)
  /«([^»]+)»/g,    // French/Spanish
  /»([^«]+)«/g,    // German (reversed)
];

// Attribution verbs
const ATTRIBUTION_VERBS: Record<string, { tense: 'past' | 'present'; strength: number }> = {
  // Past tense
  'said': { tense: 'past', strength: 1.0 },
  'stated': { tense: 'past', strength: 0.95 },
  'claimed': { tense: 'past', strength: 0.8 },
  'argued': { tense: 'past', strength: 0.85 },
  'explained': { tense: 'past', strength: 0.9 },
  'noted': { tense: 'past', strength: 0.9 },
  'mentioned': { tense: 'past', strength: 0.85 },
  'added': { tense: 'past', strength: 0.8 },
  'replied': { tense: 'past', strength: 0.9 },
  'responded': { tense: 'past', strength: 0.9 },
  'announced': { tense: 'past', strength: 0.95 },
  'declared': { tense: 'past', strength: 0.95 },
  'admitted': { tense: 'past', strength: 0.85 },
  'confirmed': { tense: 'past', strength: 0.95 },
  'denied': { tense: 'past', strength: 0.85 },
  'warned': { tense: 'past', strength: 0.9 },
  'suggested': { tense: 'past', strength: 0.8 },
  'wrote': { tense: 'past', strength: 0.95 },
  'reported': { tense: 'past', strength: 0.9 },
  'observed': { tense: 'past', strength: 0.85 },
  'commented': { tense: 'past', strength: 0.85 },
  'remarked': { tense: 'past', strength: 0.85 },
  'testified': { tense: 'past', strength: 0.95 },

  // Present tense
  'says': { tense: 'present', strength: 1.0 },
  'states': { tense: 'present', strength: 0.95 },
  'claims': { tense: 'present', strength: 0.8 },
  'argues': { tense: 'present', strength: 0.85 },
  'explains': { tense: 'present', strength: 0.9 },
  'notes': { tense: 'present', strength: 0.9 },
  'adds': { tense: 'present', strength: 0.8 },
  'believes': { tense: 'present', strength: 0.85 },
  'thinks': { tense: 'present', strength: 0.8 },
  'maintains': { tense: 'present', strength: 0.9 },
  'contends': { tense: 'present', strength: 0.85 },
  'asserts': { tense: 'present', strength: 0.9 },
  'insists': { tense: 'present', strength: 0.9 },
  'emphasizes': { tense: 'present', strength: 0.9 },
  'stresses': { tense: 'present', strength: 0.9 },
  'acknowledges': { tense: 'present', strength: 0.9 },
  'concedes': { tense: 'present', strength: 0.85 },
  'suggests': { tense: 'present', strength: 0.8 },
  'writes': { tense: 'present', strength: 0.95 },
  'reports': { tense: 'present', strength: 0.9 },
};

// Indirect quote patterns
const INDIRECT_PATTERNS: Array<{ pattern: RegExp; type: 'indirect' | 'paraphrase' }> = [
  { pattern: /according\s+to\s+([^,]+)/gi, type: 'indirect' },
  { pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+reportedly/gi, type: 'indirect' },
  { pattern: /as\s+([^,]+)\s+(?:said|stated|noted)/gi, type: 'indirect' },
  { pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:said|stated)\s+that/gi, type: 'paraphrase' },
  { pattern: /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:believes|thinks|argues)\s+that/gi, type: 'paraphrase' },
];

// Source type patterns
const SOURCE_PATTERNS: Array<{ pattern: RegExp; type: Attribution['sourceType'] }> = [
  { pattern: /(?:Dr\.|Prof\.|Mr\.|Mrs\.|Ms\.)\s*[A-Z][a-z]+/g, type: 'person' },
  { pattern: /CEO|President|Director|Manager|Spokesperson|Representative/gi, type: 'person' },
  { pattern: /Inc\.|Corp\.|LLC|Ltd\.|Company|Corporation/gi, type: 'organization' },
  { pattern: /(?:The\s+)?(?:New York Times|Wall Street Journal|Washington Post|Reuters|Bloomberg|Associated Press)/gi, type: 'publication' },
  { pattern: /(?:report|study|research|survey|analysis)\s+by/gi, type: 'publication' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique ID for quote
 */
function generateQuoteId(): string {
  return `quote_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Detect quotation mark style
 */
function detectPunctuationStyle(text: string): 'american' | 'british' | 'continental' {
  if (text.includes('«') || text.includes('»')) {
    return 'continental';
  }
  if (text.includes('\u201C') || text.includes('\u201D')) {
    return 'american';
  }
  // Check quote-comma/period placement for American vs British
  if (/[,.]"/.test(text)) {
    return 'british';
  }
  if (/"[,.]/.test(text)) {
    return 'american';
  }
  return 'american'; // Default
}

/**
 * Determine source type from source text
 */
function determineSourceType(source: string): Attribution['sourceType'] {
  for (const { pattern, type } of SOURCE_PATTERNS) {
    if (pattern.test(source)) {
      return type;
    }
  }
  return 'unknown';
}

/**
 * Extract attribution from context around quote
 */
function extractAttribution(text: string, quoteStart: number, quoteEnd: number): Attribution | undefined {
  // Look at context before and after the quote
  const contextBefore = text.substring(Math.max(0, quoteStart - 100), quoteStart);
  const contextAfter = text.substring(quoteEnd, Math.min(text.length, quoteEnd + 100));

  // Try to find attribution verb and source

  // Pattern: Source + verb + quote
  for (const [verb, { tense, strength }] of Object.entries(ATTRIBUTION_VERBS)) {
    const beforePattern = new RegExp(`([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)\\s+${verb}[,:]?\\s*$`, 'i');
    const beforeMatch = contextBefore.match(beforePattern);

    if (beforeMatch) {
      return {
        source: beforeMatch[1].trim(),
        sourceType: determineSourceType(beforeMatch[1]),
        verb,
        verbTense: tense,
        position: 'before',
        confidence: strength,
      };
    }

    // Pattern: quote + verb + Source
    const afterPattern = new RegExp(`^[,]?\\s*${verb}\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)`, 'i');
    const afterMatch = contextAfter.match(afterPattern);

    if (afterMatch) {
      return {
        source: afterMatch[1].trim(),
        sourceType: determineSourceType(afterMatch[1]),
        verb,
        verbTense: tense,
        position: 'after',
        confidence: strength,
      };
    }
  }

  // Try "according to" pattern
  const accordingToMatch = contextBefore.match(/according\s+to\s+([^,]+?)\s*,?\s*$/i);
  if (accordingToMatch) {
    return {
      source: accordingToMatch[1].trim(),
      sourceType: determineSourceType(accordingToMatch[1]),
      verb: 'according to',
      verbTense: 'present',
      position: 'before',
      confidence: 0.85,
    };
  }

  return undefined;
}

/**
 * Determine if quote is likely a title or scare quote
 */
function determineQuoteType(
  quoteText: string,
  contextBefore: string,
  contextAfter: string
): QuotationType {
  // Title patterns (often preceded by title-related words)
  const titleIndicators = /(?:titled?|called|named|entitled|book|article|paper|report|movie|film|song)\s*$/i;
  if (titleIndicators.test(contextBefore)) {
    return 'title';
  }

  // Scare quote patterns (so-called, allegedly, quotation marks around single words)
  const scareIndicators = /(?:so-called|alleged|supposed|apparent)\s*$/i;
  if (scareIndicators.test(contextBefore)) {
    return 'scare';
  }

  // Single word or very short phrase in quotes often = scare quotes
  if (quoteText.split(/\s+/).length <= 2 && !/[.!?]/.test(quoteText)) {
    return 'scare';
  }

  // Block quote (very long, often multiple sentences)
  if (quoteText.length > 200 || (quoteText.match(/[.!?]/g) || []).length >= 3) {
    return 'block';
  }

  return 'direct';
}

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract direct quotes from text
 */
function extractDirectQuotes(text: string): Quote[] {
  const quotes: Quote[] = [];
  const punctuationStyle = detectPunctuationStyle(text);

  for (const pattern of DIRECT_QUOTE_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      const quoteText = match[1];
      const startOffset = match.index;
      const endOffset = match.index + match[0].length;

      // Skip very short quotes (likely not real quotes)
      if (quoteText.length < 3) continue;

      // Context for type determination
      const contextBefore = text.substring(Math.max(0, startOffset - 50), startOffset);
      const contextAfter = text.substring(endOffset, Math.min(text.length, endOffset + 50));

      // Determine quote type
      const type = determineQuoteType(quoteText, contextBefore, contextAfter);

      // Extract attribution
      const attribution = extractAttribution(text, startOffset, endOffset);

      quotes.push({
        id: generateQuoteId(),
        text: quoteText,
        type,
        attribution,
        startOffset,
        endOffset,
        confidence: attribution ? 0.9 : 0.7,
        metadata: {
          punctuationStyle,
        },
      });
    }
  }

  // Remove duplicates (overlapping matches from different patterns)
  const uniqueQuotes: Quote[] = [];
  for (const quote of quotes) {
    const isDuplicate = uniqueQuotes.some(
      q => Math.abs(q.startOffset - quote.startOffset) < 5 &&
           Math.abs(q.endOffset - quote.endOffset) < 5
    );
    if (!isDuplicate) {
      uniqueQuotes.push(quote);
    }
  }

  return uniqueQuotes;
}

/**
 * Extract indirect quotes and paraphrases
 */
function extractIndirectQuotes(text: string): Quote[] {
  const quotes: Quote[] = [];

  for (const { pattern, type } of INDIRECT_PATTERNS) {
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    while ((match = regex.exec(text)) !== null) {
      // Find the extent of the indirect quote (until period or clause break)
      const startOffset = match.index;
      let endOffset = startOffset;

      // Look for end of clause/sentence
      const remaining = text.substring(startOffset);
      const endMatch = remaining.match(/[.!?]|\,\s+(?:and|but|however|although|while)/);
      if (endMatch && endMatch.index) {
        endOffset = startOffset + endMatch.index + 1;
      } else {
        endOffset = Math.min(text.length, startOffset + 200);
      }

      const quoteText = text.substring(startOffset, endOffset).trim();

      quotes.push({
        id: generateQuoteId(),
        text: quoteText,
        type,
        attribution: {
          source: match[1]?.trim() || 'Unknown',
          sourceType: determineSourceType(match[1] || ''),
          position: 'embedded',
          confidence: 0.75,
        },
        startOffset,
        endOffset,
        confidence: 0.7,
      });
    }
  }

  return quotes;
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Parse and analyze all quotations in text
 */
export function parseQuotations(text: string): QuotationAnalysis {
  // Extract all quote types
  const directQuotes = extractDirectQuotes(text);
  const indirectQuotes = extractIndirectQuotes(text);

  // Combine and sort by position
  const allQuotes = [...directQuotes, ...indirectQuotes]
    .sort((a, b) => a.startOffset - b.startOffset);

  // Remove overlapping quotes (prefer direct over indirect)
  const quotes: Quote[] = [];
  for (const quote of allQuotes) {
    const overlapping = quotes.find(
      q => (quote.startOffset >= q.startOffset && quote.startOffset < q.endOffset) ||
           (quote.endOffset > q.startOffset && quote.endOffset <= q.endOffset)
    );

    if (!overlapping) {
      quotes.push(quote);
    } else if (quote.type === 'direct' && overlapping.type !== 'direct') {
      // Replace indirect with direct if they overlap
      const idx = quotes.indexOf(overlapping);
      quotes[idx] = quote;
    }
  }

  // Calculate statistics
  const attributedQuotes = quotes.filter(q => q.attribution).length;
  const unattributedQuotes = quotes.length - attributedQuotes;

  const wordCount = text.split(/\s+/).length;
  const quoteDensity = (quotes.length / wordCount) * 100;

  // Top sources
  const sourceCounts = new Map<string, number>();
  for (const quote of quotes) {
    if (quote.attribution?.source) {
      const source = quote.attribution.source;
      sourceCounts.set(source, (sourceCounts.get(source) || 0) + 1);
    }
  }

  const topSources = [...sourceCounts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Dominant type
  const typeCounts = new Map<QuotationType, number>();
  for (const quote of quotes) {
    typeCounts.set(quote.type, (typeCounts.get(quote.type) || 0) + 1);
  }

  const dominantType = [...typeCounts.entries()]
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'direct';

  // Average quote length
  const averageQuoteLength = quotes.length > 0
    ? quotes.reduce((sum, q) => sum + q.text.length, 0) / quotes.length
    : 0;

  return {
    quotes,
    attributedQuotes,
    unattributedQuotes,
    quoteDensity: Math.round(quoteDensity * 100) / 100,
    topSources,
    dominantType,
    averageQuoteLength: Math.round(averageQuoteLength),
  };
}

/**
 * Get quotation summary for display
 */
export function getQuotationSummary(analysis: QuotationAnalysis): string {
  const parts: string[] = [];

  parts.push(`${analysis.quotes.length} quotes found`);
  parts.push(`${analysis.attributedQuotes} attributed`);
  parts.push(`${analysis.unattributedQuotes} unattributed`);

  if (analysis.topSources.length > 0) {
    parts.push(`Top source: ${analysis.topSources[0].source}`);
  }

  return parts.join(' | ');
}

/**
 * Extract all unique sources from quotes
 */
export function extractSources(analysis: QuotationAnalysis): Array<{
  source: string;
  type: Attribution['sourceType'];
  quoteCount: number;
  quotes: string[];
}> {
  const sourceMap = new Map<string, {
    type: Attribution['sourceType'];
    quotes: string[];
  }>();

  for (const quote of analysis.quotes) {
    if (quote.attribution?.source) {
      const source = quote.attribution.source;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, {
          type: quote.attribution.sourceType,
          quotes: [],
        });
      }
      sourceMap.get(source)!.quotes.push(quote.text);
    }
  }

  return [...sourceMap.entries()]
    .map(([source, data]) => ({
      source,
      type: data.type,
      quoteCount: data.quotes.length,
      quotes: data.quotes,
    }))
    .sort((a, b) => b.quoteCount - a.quoteCount);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  parseQuotations,
  getQuotationSummary,
  extractSources,
};
