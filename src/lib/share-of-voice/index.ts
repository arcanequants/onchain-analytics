/**
 * Share of Voice (SOV) Calculator
 *
 * Phase 2, Week 3, Day 2
 * Calculates the percentage of times a brand is mentioned vs competitors
 * when AI discusses the industry.
 *
 * Features:
 * - Brand mention detection in AI responses
 * - Competitor mention tracking
 * - SOV percentage calculation
 * - Trend tracking over time
 * - Weighted mention scoring by context
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Brand mention detected in text
 */
export interface BrandMention {
  /** The brand name that was mentioned */
  brand: string;
  /** Start position in text */
  startIndex: number;
  /** End position in text */
  endIndex: number;
  /** The context around the mention (surrounding text) */
  context: string;
  /** Sentiment of the mention (-1 to 1) */
  sentiment: number;
  /** Whether this is the primary subject of the sentence */
  isPrimary: boolean;
  /** Type of mention */
  mentionType: MentionType;
}

/**
 * Types of brand mentions
 */
export type MentionType =
  | 'recommendation' // AI recommends the brand
  | 'comparison'     // Brand mentioned in comparison
  | 'example'        // Used as an example
  | 'factual'        // Factual statement about the brand
  | 'question'       // Mentioned in a question
  | 'negative'       // Negative mention
  | 'neutral';       // Neutral mention

/**
 * Competitor configuration
 */
export interface Competitor {
  /** Competitor name */
  name: string;
  /** Alternative names/variations */
  aliases?: string[];
  /** Tier/level (1 = direct, 2 = adjacent, 3 = aspirational) */
  tier?: number;
}

/**
 * SOV calculation options
 */
export interface SOVCalculationOptions {
  /** The brand to calculate SOV for */
  brand: string;
  /** Brand aliases/variations */
  brandAliases?: string[];
  /** Competitors to track */
  competitors: Competitor[];
  /** Weight recommendations higher */
  weightRecommendations?: boolean;
  /** Minimum context length to consider */
  minContextLength?: number;
  /** Include sentiment analysis */
  includeSentiment?: boolean;
}

/**
 * SOV result for a single response
 */
export interface SOVResult {
  /** Brand mentions */
  brandMentions: BrandMention[];
  /** Competitor mentions keyed by competitor name */
  competitorMentions: Record<string, BrandMention[]>;
  /** Total mentions in the response */
  totalMentions: number;
  /** Brand's share of voice (0-100%) */
  shareOfVoice: number;
  /** Weighted SOV (recommendations count more) */
  weightedSOV: number;
  /** Average sentiment for brand mentions */
  brandSentiment: number;
  /** Position score (earlier mentions = higher) */
  positionScore: number;
}

/**
 * Aggregated SOV across multiple responses
 */
export interface AggregatedSOV {
  /** Average SOV across all responses */
  averageSOV: number;
  /** Weighted average SOV */
  weightedAverageSOV: number;
  /** Total brand mentions */
  totalBrandMentions: number;
  /** Total competitor mentions */
  totalCompetitorMentions: number;
  /** Total mentions */
  totalMentions: number;
  /** Average brand sentiment */
  averageSentiment: number;
  /** SOV by competitor */
  competitorSOV: Record<string, number>;
  /** Mention breakdown by type */
  mentionsByType: Record<MentionType, number>;
  /** Confidence score (based on sample size) */
  confidence: number;
  /** Results from individual responses */
  results: SOVResult[];
  /** Timestamp of calculation */
  calculatedAt: string;
}

/**
 * SOV trend data point
 */
export interface SOVTrendPoint {
  /** Timestamp */
  timestamp: string;
  /** SOV value */
  sov: number;
  /** Weighted SOV */
  weightedSov: number;
  /** Number of responses analyzed */
  responseCount: number;
}

/**
 * SOV trend analysis
 */
export interface SOVTrend {
  /** Current SOV */
  currentSOV: number;
  /** Previous period SOV */
  previousSOV: number;
  /** Change in percentage points */
  change: number;
  /** Change percentage */
  changePercent: number;
  /** Trend direction */
  direction: 'up' | 'down' | 'stable';
  /** Momentum score (-1 to 1) */
  momentum: number;
  /** Historical data points */
  history: SOVTrendPoint[];
}

// ================================================================
// MENTION DETECTION
// ================================================================

/**
 * Detect mentions of a brand in text
 */
export function detectMentions(
  text: string,
  brandName: string,
  aliases: string[] = []
): BrandMention[] {
  const mentions: BrandMention[] = [];
  const searchTerms = [brandName, ...aliases];
  const textLower = text.toLowerCase();

  for (const term of searchTerms) {
    const termLower = term.toLowerCase();
    let searchStart = 0;

    while (true) {
      const index = textLower.indexOf(termLower, searchStart);
      if (index === -1) break;

      // Check word boundaries
      const beforeChar = index > 0 ? text[index - 1] : ' ';
      const afterChar = index + term.length < text.length ? text[index + term.length] : ' ';

      if (isWordBoundary(beforeChar) && isWordBoundary(afterChar)) {
        const context = extractContext(text, index, term.length);
        const sentiment = analyzeMentionSentiment(context);
        const mentionType = classifyMention(context, index, text);
        const isPrimary = checkIfPrimary(context, term);

        mentions.push({
          brand: brandName, // Use canonical name
          startIndex: index,
          endIndex: index + term.length,
          context,
          sentiment,
          isPrimary,
          mentionType,
        });
      }

      searchStart = index + 1;
    }
  }

  // Deduplicate overlapping mentions
  return deduplicateMentions(mentions);
}

/**
 * Check if character is a word boundary
 */
function isWordBoundary(char: string): boolean {
  return /[\s,.!?;:()\[\]{}'"<>\/\\-]/.test(char);
}

/**
 * Extract context around a mention
 */
function extractContext(text: string, index: number, termLength: number): string {
  const contextRadius = 100;
  const start = Math.max(0, index - contextRadius);
  const end = Math.min(text.length, index + termLength + contextRadius);

  let context = text.substring(start, end);

  // Clean up context
  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context.trim();
}

/**
 * Analyze sentiment of a mention based on context
 */
function analyzeMentionSentiment(context: string): number {
  const contextLower = context.toLowerCase();

  // Positive indicators
  const positiveTerms = [
    'recommend', 'best', 'great', 'excellent', 'leading', 'top',
    'popular', 'trusted', 'reliable', 'quality', 'innovative',
    'effective', 'efficient', 'preferred', 'outstanding', 'superior',
  ];

  // Negative indicators
  const negativeTerms = [
    'avoid', 'worst', 'bad', 'poor', 'issues', 'problems',
    'expensive', 'slow', 'unreliable', 'outdated', 'lacking',
    'limited', 'disappointing', 'weak', 'inferior', 'controversy',
  ];

  let score = 0;
  let matches = 0;

  for (const term of positiveTerms) {
    if (contextLower.includes(term)) {
      score += 0.2;
      matches++;
    }
  }

  for (const term of negativeTerms) {
    if (contextLower.includes(term)) {
      score -= 0.2;
      matches++;
    }
  }

  // Normalize to -1 to 1 range
  return Math.max(-1, Math.min(1, matches > 0 ? score : 0));
}

/**
 * Classify the type of mention
 */
function classifyMention(context: string, index: number, fullText: string): MentionType {
  const contextLower = context.toLowerCase();

  // Check for recommendation patterns
  if (/\b(recommend|suggest|try|consider|choose|go with|opt for)\b/i.test(contextLower)) {
    return 'recommendation';
  }

  // Check for comparison patterns
  if (/\b(vs|versus|compared to|unlike|similar to|better than|worse than|alternative to)\b/i.test(contextLower)) {
    return 'comparison';
  }

  // Check for example patterns
  if (/\b(such as|for example|like|including|e\.g\.|example of)\b/i.test(contextLower)) {
    return 'example';
  }

  // Check for question patterns
  if (/\?/.test(context) || /\b(what|which|how|why|when|where|is|are|does|do)\b.*\?/i.test(contextLower)) {
    return 'question';
  }

  // Check for negative patterns
  if (/\b(don't|avoid|not recommend|issues with|problems with|concerns about)\b/i.test(contextLower)) {
    return 'negative';
  }

  // Check for factual statements
  if (/\b(is a|are|was|were|founded|offers|provides|headquartered|based in)\b/i.test(contextLower)) {
    return 'factual';
  }

  return 'neutral';
}

/**
 * Check if the mention is the primary subject
 */
function checkIfPrimary(context: string, term: string): boolean {
  const termLower = term.toLowerCase();
  const contextLower = context.toLowerCase();

  // Check if term appears at the start of a sentence
  const sentences = context.split(/[.!?]+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim().toLowerCase();
    if (trimmed.startsWith(termLower)) {
      return true;
    }
  }

  // Check for subject patterns
  const subjectPatterns = [
    new RegExp(`\\b${termLower}\\s+(is|are|was|were|has|have|offers|provides)\\b`, 'i'),
    new RegExp(`^${termLower}\\b`, 'i'),
  ];

  return subjectPatterns.some(pattern => pattern.test(contextLower));
}

/**
 * Remove duplicate/overlapping mentions
 */
function deduplicateMentions(mentions: BrandMention[]): BrandMention[] {
  if (mentions.length <= 1) return mentions;

  // Sort by start index
  const sorted = [...mentions].sort((a, b) => a.startIndex - b.startIndex);
  const result: BrandMention[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = result[result.length - 1];

    // Skip if overlapping
    if (current.startIndex < previous.endIndex) {
      continue;
    }

    result.push(current);
  }

  return result;
}

// ================================================================
// SOV CALCULATION
// ================================================================

/**
 * Calculate Share of Voice for a single AI response
 */
export function calculateSOV(
  response: string,
  options: SOVCalculationOptions
): SOVResult {
  // Detect brand mentions
  const brandMentions = detectMentions(
    response,
    options.brand,
    options.brandAliases || []
  );

  // Detect competitor mentions
  const competitorMentions: Record<string, BrandMention[]> = {};
  let totalCompetitorMentions = 0;

  for (const competitor of options.competitors) {
    const mentions = detectMentions(
      response,
      competitor.name,
      competitor.aliases || []
    );
    competitorMentions[competitor.name] = mentions;
    totalCompetitorMentions += mentions.length;
  }

  // Calculate totals
  const totalMentions = brandMentions.length + totalCompetitorMentions;

  // Calculate basic SOV
  const shareOfVoice = totalMentions > 0
    ? (brandMentions.length / totalMentions) * 100
    : 0;

  // Calculate weighted SOV (recommendations count 2x, primary mentions 1.5x)
  const weightedBrandScore = brandMentions.reduce((sum, m) => {
    let weight = 1;
    if (m.mentionType === 'recommendation') weight *= 2;
    if (m.isPrimary) weight *= 1.5;
    if (m.sentiment > 0) weight *= 1.2;
    return sum + weight;
  }, 0);

  const totalWeightedScore = weightedBrandScore + totalCompetitorMentions;
  const weightedSOV = totalWeightedScore > 0
    ? (weightedBrandScore / totalWeightedScore) * 100
    : 0;

  // Calculate average brand sentiment
  const brandSentiment = brandMentions.length > 0
    ? brandMentions.reduce((sum, m) => sum + m.sentiment, 0) / brandMentions.length
    : 0;

  // Calculate position score (earlier = better)
  const positionScore = calculatePositionScore(brandMentions, response.length);

  return {
    brandMentions,
    competitorMentions,
    totalMentions,
    shareOfVoice,
    weightedSOV,
    brandSentiment,
    positionScore,
  };
}

/**
 * Calculate position score based on where mentions appear
 * Earlier mentions score higher
 */
function calculatePositionScore(mentions: BrandMention[], textLength: number): number {
  if (mentions.length === 0 || textLength === 0) return 0;

  const scores = mentions.map(m => {
    // Position from 0 to 1 (0 = start, 1 = end)
    const position = m.startIndex / textLength;
    // Invert so earlier = higher score
    return 1 - position;
  });

  return scores.reduce((sum, s) => sum + s, 0) / scores.length;
}

/**
 * Calculate aggregated SOV across multiple responses
 */
export function calculateAggregatedSOV(
  responses: string[],
  options: SOVCalculationOptions
): AggregatedSOV {
  const results: SOVResult[] = responses.map(r => calculateSOV(r, options));

  // Aggregate totals
  const totalBrandMentions = results.reduce((sum, r) => sum + r.brandMentions.length, 0);
  const totalCompetitorMentions = results.reduce((sum, r) => {
    return sum + Object.values(r.competitorMentions).reduce((s, m) => s + m.length, 0);
  }, 0);
  const totalMentions = totalBrandMentions + totalCompetitorMentions;

  // Calculate average SOV
  const averageSOV = results.length > 0
    ? results.reduce((sum, r) => sum + r.shareOfVoice, 0) / results.length
    : 0;

  const weightedAverageSOV = results.length > 0
    ? results.reduce((sum, r) => sum + r.weightedSOV, 0) / results.length
    : 0;

  // Calculate average sentiment
  const averageSentiment = results.length > 0
    ? results.reduce((sum, r) => sum + r.brandSentiment, 0) / results.length
    : 0;

  // Calculate competitor-specific SOV
  const competitorSOV: Record<string, number> = {};
  for (const competitor of options.competitors) {
    const competitorTotal = results.reduce((sum, r) => {
      return sum + (r.competitorMentions[competitor.name]?.length || 0);
    }, 0);
    competitorSOV[competitor.name] = totalMentions > 0
      ? (competitorTotal / totalMentions) * 100
      : 0;
  }

  // Calculate mention breakdown by type
  const mentionsByType: Record<MentionType, number> = {
    recommendation: 0,
    comparison: 0,
    example: 0,
    factual: 0,
    question: 0,
    negative: 0,
    neutral: 0,
  };

  for (const result of results) {
    for (const mention of result.brandMentions) {
      mentionsByType[mention.mentionType]++;
    }
  }

  // Calculate confidence based on sample size
  const confidence = calculateConfidence(results.length, totalMentions);

  return {
    averageSOV,
    weightedAverageSOV,
    totalBrandMentions,
    totalCompetitorMentions,
    totalMentions,
    averageSentiment,
    competitorSOV,
    mentionsByType,
    confidence,
    results,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate confidence score based on sample size
 */
function calculateConfidence(responseCount: number, mentionCount: number): number {
  // More responses and mentions = higher confidence
  const responseScore = Math.min(1, responseCount / 10); // Cap at 10 responses
  const mentionScore = Math.min(1, mentionCount / 20);    // Cap at 20 mentions

  return (responseScore * 0.6) + (mentionScore * 0.4);
}

// ================================================================
// TREND ANALYSIS
// ================================================================

/**
 * Calculate SOV trend from historical data
 */
export function calculateSOVTrend(
  history: SOVTrendPoint[],
  currentSOV: number
): SOVTrend {
  if (history.length === 0) {
    return {
      currentSOV,
      previousSOV: 0,
      change: 0,
      changePercent: 0,
      direction: 'stable',
      momentum: 0,
      history: [],
    };
  }

  // Sort by timestamp
  const sorted = [...history].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get previous SOV (last in sorted history)
  const previousSOV = sorted[sorted.length - 1].sov;

  // Calculate change
  const change = currentSOV - previousSOV;
  const changePercent = previousSOV > 0 ? (change / previousSOV) * 100 : 0;

  // Determine direction
  let direction: SOVTrend['direction'];
  if (Math.abs(change) < 1) {
    direction = 'stable';
  } else if (change > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  // Calculate momentum (recent trend strength)
  const momentum = calculateMomentum(sorted, currentSOV);

  return {
    currentSOV,
    previousSOV,
    change,
    changePercent,
    direction,
    momentum,
    history: sorted,
  };
}

/**
 * Calculate momentum score from historical data
 */
function calculateMomentum(history: SOVTrendPoint[], currentSOV: number): number {
  if (history.length < 2) return 0;

  // Use last 5 data points for momentum
  const recentHistory = history.slice(-5);

  // Calculate trend line slope
  const n = recentHistory.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += recentHistory[i].sov;
    sumXY += i * recentHistory[i].sov;
    sumX2 += i * i;
  }

  // Include current value
  const totalN = n + 1;
  sumX += n;
  sumY += currentSOV;
  sumXY += n * currentSOV;
  sumX2 += n * n;

  // Calculate slope
  const slope = (totalN * sumXY - sumX * sumY) / (totalN * sumX2 - sumX * sumX);

  // Normalize to -1 to 1 range (assuming typical SOV changes of ±10pp per period)
  return Math.max(-1, Math.min(1, slope / 10));
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Generate SOV comparison summary
 */
export function generateSOVSummary(aggregated: AggregatedSOV): string {
  const { averageSOV, competitorSOV, mentionsByType, confidence } = aggregated;

  // Find top competitor
  const sortedCompetitors = Object.entries(competitorSOV)
    .sort((a, b) => b[1] - a[1]);

  const topCompetitor = sortedCompetitors[0];
  const leadingCategory = Object.entries(mentionsByType)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)[0];

  let summary = `Share of Voice: ${averageSOV.toFixed(1)}%. `;

  if (topCompetitor && topCompetitor[1] > averageSOV) {
    summary += `${topCompetitor[0]} leads with ${topCompetitor[1].toFixed(1)}%. `;
  } else if (topCompetitor) {
    summary += `Leading vs ${topCompetitor[0]} (${topCompetitor[1].toFixed(1)}%). `;
  }

  if (leadingCategory) {
    summary += `Most mentions: ${leadingCategory[0]} (${leadingCategory[1]}). `;
  }

  if (confidence < 0.5) {
    summary += 'Low confidence - more data needed.';
  } else if (confidence >= 0.8) {
    summary += 'High confidence result.';
  }

  return summary.trim();
}

/**
 * Format SOV as percentage string
 */
export function formatSOV(sov: number, decimals: number = 1): string {
  return `${sov.toFixed(decimals)}%`;
}

/**
 * Get SOV rating based on value
 */
export function getSOVRating(sov: number): 'excellent' | 'good' | 'moderate' | 'low' | 'critical' {
  if (sov >= 40) return 'excellent';
  if (sov >= 25) return 'good';
  if (sov >= 15) return 'moderate';
  if (sov >= 5) return 'low';
  return 'critical';
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectMentions,
  calculateSOV,
  calculateAggregatedSOV,
  calculateSOVTrend,
  generateSOVSummary,
  formatSOV,
  getSOVRating,
};
