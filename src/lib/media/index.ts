/**
 * Media Mentions Tracking Module
 *
 * Phase 2, Week 3, Day 5
 * Tracks and analyzes media mentions from AI responses
 */

// ================================================================
// TYPES
// ================================================================

export type MediaType = 'news' | 'blog' | 'press_release' | 'social' | 'forum' | 'review' | 'academic' | 'unknown';
export type MentionSentiment = 'positive' | 'neutral' | 'negative';
export type MentionContext = 'recommendation' | 'comparison' | 'news' | 'review' | 'tutorial' | 'controversy' | 'general';

export interface MediaMention {
  id: string;
  brandName: string;
  analysisId: string;
  provider: string;

  // Source info
  source: string;
  sourceUrl?: string;
  sourceType: MediaType;
  sourceDomain?: string;

  // Mention details
  context: MentionContext;
  excerpt: string;
  sentiment: MentionSentiment;
  sentimentScore: number; // -1 to 1

  // Position and prominence
  position: number | null;
  totalMentions: number;
  prominence: number; // 0-100

  // Competitors
  competitorsMentioned: string[];

  // Dates
  mentionDate?: Date;
  detectedAt: Date;
}

export interface MediaMentionSummary {
  brandName: string;
  analysisId: string;
  totalMentions: number;

  // By provider
  mentionsByProvider: Record<string, number>;

  // By sentiment
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  averageSentiment: number;

  // By source type
  sourceTypeBreakdown: Record<MediaType, number>;

  // By context
  contextBreakdown: Record<MentionContext, number>;

  // Top sources
  topSources: Array<{
    source: string;
    count: number;
    sentiment: number;
  }>;

  // Prominence
  averageProminence: number;
  prominenceByProvider: Record<string, number>;

  // Trends
  sentimentTrend?: 'improving' | 'stable' | 'declining';
  visibilityTrend?: 'increasing' | 'stable' | 'decreasing';
}

export interface MediaTrackingConfig {
  /** Minimum prominence score to track (0-100) */
  minProminence: number;
  /** Maximum mentions to store per analysis */
  maxMentionsPerAnalysis: number;
  /** Source types to prioritize */
  prioritySourceTypes: MediaType[];
  /** Sentiment thresholds */
  sentimentThresholds: {
    positive: number;
    negative: number;
  };
}

export interface AIResponseData {
  provider: string;
  rawResponse: string;
  parsedResponse: {
    brandMentioned: boolean;
    mentionPosition: number | null;
    competitors: string[];
    sentiment: number;
    sources?: string[];
  };
}

// ================================================================
// CONSTANTS
// ================================================================

const DEFAULT_CONFIG: MediaTrackingConfig = {
  minProminence: 10,
  maxMentionsPerAnalysis: 100,
  prioritySourceTypes: ['news', 'review', 'press_release'],
  sentimentThresholds: {
    positive: 0.3,
    negative: -0.3,
  },
};

// Source type patterns
const SOURCE_TYPE_PATTERNS: Record<MediaType, RegExp[]> = {
  news: [
    /news\./i,
    /\.com\/news/i,
    /reuters|bloomberg|wsj|nytimes|bbc|cnn|forbes|techcrunch/i,
  ],
  blog: [
    /blog\./i,
    /\.com\/blog/i,
    /medium\.com/i,
    /substack\.com/i,
    /wordpress\.com/i,
  ],
  press_release: [
    /prnewswire|businesswire|globenewswire/i,
    /press-release/i,
    /\/press\//i,
  ],
  social: [
    /twitter\.com|x\.com|linkedin\.com|facebook\.com|instagram\.com/i,
  ],
  forum: [
    /reddit\.com|quora\.com|stackoverflow\.com|hackernews/i,
  ],
  review: [
    /g2\.com|capterra|trustpilot|yelp|tripadvisor/i,
    /review/i,
  ],
  academic: [
    /\.edu|arxiv|scholar\.google|pubmed|nature\.com|science\.org/i,
  ],
  unknown: [],
};

// Context patterns in AI responses
const CONTEXT_PATTERNS: Record<MentionContext, RegExp[]> = {
  recommendation: [
    /recommend|suggest|best|top|leading|consider|try/i,
  ],
  comparison: [
    /compar|versus|vs\.|alternative|instead of|better than|worse than/i,
  ],
  news: [
    /announc|launch|release|update|report|said|according to/i,
  ],
  review: [
    /review|rating|score|pros and cons|experience with/i,
  ],
  tutorial: [
    /how to|guide|tutorial|step|learn|use.*to/i,
  ],
  controversy: [
    /controversy|scandal|issue|problem|lawsuit|accused|criticized/i,
  ],
  general: [],
};

// ================================================================
// MEDIA MENTION TRACKER
// ================================================================

export class MediaMentionTracker {
  private config: MediaTrackingConfig;
  private mentions: Map<string, MediaMention[]> = new Map();

  constructor(config: Partial<MediaTrackingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ================================================================
  // EXTRACTION
  // ================================================================

  extractMentions(
    brandName: string,
    analysisId: string,
    responses: AIResponseData[]
  ): MediaMention[] {
    const mentions: MediaMention[] = [];

    for (const response of responses) {
      if (!response.parsedResponse.brandMentioned) continue;

      const extractedMentions = this.extractFromResponse(
        brandName,
        analysisId,
        response
      );
      mentions.push(...extractedMentions);
    }

    // Sort by prominence
    mentions.sort((a, b) => b.prominence - a.prominence);

    // Limit to max
    const limitedMentions = mentions.slice(0, this.config.maxMentionsPerAnalysis);

    // Store
    this.mentions.set(analysisId, limitedMentions);

    return limitedMentions;
  }

  private extractFromResponse(
    brandName: string,
    analysisId: string,
    response: AIResponseData
  ): MediaMention[] {
    const mentions: MediaMention[] = [];
    const { provider, rawResponse, parsedResponse } = response;

    // Extract sources mentioned in response
    const sources = parsedResponse.sources || this.extractSourcesFromText(rawResponse);

    // Create primary mention
    const primaryMention = this.createMention(
      brandName,
      analysisId,
      provider,
      rawResponse,
      parsedResponse,
      sources[0] || provider
    );
    mentions.push(primaryMention);

    // Create additional mentions for each unique source
    for (const source of sources.slice(1)) {
      const additionalMention = this.createMention(
        brandName,
        analysisId,
        provider,
        rawResponse,
        parsedResponse,
        source
      );
      mentions.push(additionalMention);
    }

    return mentions;
  }

  private createMention(
    brandName: string,
    analysisId: string,
    provider: string,
    rawResponse: string,
    parsedResponse: AIResponseData['parsedResponse'],
    source: string
  ): MediaMention {
    const sourceType = this.detectSourceType(source);
    const context = this.detectContext(rawResponse);
    const excerpt = this.extractExcerpt(rawResponse, brandName);
    const sentiment = this.scoreSentiment(parsedResponse.sentiment);
    const prominence = this.calculateProminence(parsedResponse, rawResponse);

    return {
      id: `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brandName,
      analysisId,
      provider,
      source,
      sourceUrl: this.extractUrl(source),
      sourceType,
      sourceDomain: this.extractDomain(source),
      context,
      excerpt,
      sentiment,
      sentimentScore: parsedResponse.sentiment,
      position: parsedResponse.mentionPosition,
      totalMentions: 1,
      prominence,
      competitorsMentioned: parsedResponse.competitors,
      detectedAt: new Date(),
    };
  }

  // ================================================================
  // DETECTION HELPERS
  // ================================================================

  private extractSourcesFromText(text: string): string[] {
    const sources: string[] = [];

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    const urls = text.match(urlPattern) || [];
    sources.push(...urls);

    // Extract source mentions
    const sourcePatterns = [
      /according to ([A-Z][a-zA-Z\s]+)/gi,
      /as reported by ([A-Z][a-zA-Z\s]+)/gi,
      /from ([A-Z][a-zA-Z\s]+) reports/gi,
      /([A-Z][a-zA-Z\s]+) states that/gi,
    ];

    for (const pattern of sourcePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) sources.push(match[1].trim());
      }
    }

    return [...new Set(sources)];
  }

  private detectSourceType(source: string): MediaType {
    for (const [type, patterns] of Object.entries(SOURCE_TYPE_PATTERNS)) {
      if (type === 'unknown') continue;
      for (const pattern of patterns) {
        if (pattern.test(source)) {
          return type as MediaType;
        }
      }
    }
    return 'unknown';
  }

  private detectContext(text: string): MentionContext {
    for (const [context, patterns] of Object.entries(CONTEXT_PATTERNS)) {
      if (context === 'general') continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return context as MentionContext;
        }
      }
    }
    return 'general';
  }

  private extractExcerpt(text: string, brandName: string): string {
    const brandIndex = text.toLowerCase().indexOf(brandName.toLowerCase());
    if (brandIndex === -1) {
      return text.substring(0, 200) + (text.length > 200 ? '...' : '');
    }

    const start = Math.max(0, brandIndex - 100);
    const end = Math.min(text.length, brandIndex + brandName.length + 100);
    const excerpt = text.substring(start, end);

    return (start > 0 ? '...' : '') + excerpt + (end < text.length ? '...' : '');
  }

  private scoreSentiment(score: number): MentionSentiment {
    if (score >= this.config.sentimentThresholds.positive) return 'positive';
    if (score <= this.config.sentimentThresholds.negative) return 'negative';
    return 'neutral';
  }

  private calculateProminence(
    parsedResponse: AIResponseData['parsedResponse'],
    rawResponse: string
  ): number {
    let prominence = 50; // Base score

    // Position boost (earlier = more prominent)
    if (parsedResponse.mentionPosition !== null) {
      prominence += Math.max(0, (5 - parsedResponse.mentionPosition) * 10);
    }

    // Multiple mentions boost
    const mentionCount = (rawResponse.match(/\b[A-Z][a-z]+\b/g) || []).length;
    prominence += Math.min(mentionCount * 2, 20);

    // Sentiment impact (strong sentiment = more prominent)
    prominence += Math.abs(parsedResponse.sentiment) * 15;

    // Fewer competitors = more prominent
    prominence -= parsedResponse.competitors.length * 3;

    return Math.max(0, Math.min(100, prominence));
  }

  private extractUrl(source: string): string | undefined {
    const urlMatch = source.match(/https?:\/\/[^\s]+/i);
    return urlMatch ? urlMatch[0] : undefined;
  }

  private extractDomain(source: string): string | undefined {
    try {
      const url = new URL(source);
      return url.hostname;
    } catch {
      // Try to extract domain pattern
      const domainMatch = source.match(/([a-z0-9-]+\.[a-z]{2,})/i);
      return domainMatch ? domainMatch[1] : undefined;
    }
  }

  // ================================================================
  // SUMMARIZATION
  // ================================================================

  summarize(analysisId: string): MediaMentionSummary | null {
    const mentions = this.mentions.get(analysisId);
    if (!mentions || mentions.length === 0) return null;

    const brandName = mentions[0].brandName;

    // Calculate breakdowns
    const mentionsByProvider: Record<string, number> = {};
    const sentimentBreakdown = { positive: 0, neutral: 0, negative: 0 };
    const sourceTypeBreakdown: Record<MediaType, number> = {
      news: 0, blog: 0, press_release: 0, social: 0, forum: 0, review: 0, academic: 0, unknown: 0,
    };
    const contextBreakdown: Record<MentionContext, number> = {
      recommendation: 0, comparison: 0, news: 0, review: 0, tutorial: 0, controversy: 0, general: 0,
    };
    const sourceCount: Record<string, { count: number; sentiment: number }> = {};
    const prominenceByProvider: Record<string, number[]> = {};
    let totalSentiment = 0;
    let totalProminence = 0;

    for (const mention of mentions) {
      // By provider
      mentionsByProvider[mention.provider] = (mentionsByProvider[mention.provider] || 0) + 1;

      // By sentiment
      sentimentBreakdown[mention.sentiment]++;
      totalSentiment += mention.sentimentScore;

      // By source type
      sourceTypeBreakdown[mention.sourceType]++;

      // By context
      contextBreakdown[mention.context]++;

      // Source tracking
      if (!sourceCount[mention.source]) {
        sourceCount[mention.source] = { count: 0, sentiment: 0 };
      }
      sourceCount[mention.source].count++;
      sourceCount[mention.source].sentiment += mention.sentimentScore;

      // Prominence
      if (!prominenceByProvider[mention.provider]) {
        prominenceByProvider[mention.provider] = [];
      }
      prominenceByProvider[mention.provider].push(mention.prominence);
      totalProminence += mention.prominence;
    }

    // Top sources
    const topSources = Object.entries(sourceCount)
      .map(([source, data]) => ({
        source,
        count: data.count,
        sentiment: data.sentiment / data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Average prominence by provider
    const avgProminenceByProvider: Record<string, number> = {};
    for (const [provider, prominences] of Object.entries(prominenceByProvider)) {
      avgProminenceByProvider[provider] =
        prominences.reduce((a, b) => a + b, 0) / prominences.length;
    }

    return {
      brandName,
      analysisId,
      totalMentions: mentions.length,
      mentionsByProvider,
      sentimentBreakdown,
      averageSentiment: totalSentiment / mentions.length,
      sourceTypeBreakdown,
      contextBreakdown,
      topSources,
      averageProminence: totalProminence / mentions.length,
      prominenceByProvider: avgProminenceByProvider,
    };
  }

  // ================================================================
  // RETRIEVAL
  // ================================================================

  getMentions(analysisId: string): MediaMention[] {
    return this.mentions.get(analysisId) || [];
  }

  getMentionsByProvider(analysisId: string, provider: string): MediaMention[] {
    const mentions = this.mentions.get(analysisId) || [];
    return mentions.filter((m) => m.provider === provider);
  }

  getMentionsBySentiment(analysisId: string, sentiment: MentionSentiment): MediaMention[] {
    const mentions = this.mentions.get(analysisId) || [];
    return mentions.filter((m) => m.sentiment === sentiment);
  }

  getTopMentions(analysisId: string, limit: number = 10): MediaMention[] {
    const mentions = this.mentions.get(analysisId) || [];
    return mentions.slice(0, limit);
  }
}

// ================================================================
// SINGLETON
// ================================================================

let tracker: MediaMentionTracker | null = null;

export function getMediaMentionTracker(
  config?: Partial<MediaTrackingConfig>
): MediaMentionTracker {
  if (!tracker) {
    tracker = new MediaMentionTracker(config);
  }
  return tracker;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

export function trackMediaMentions(
  brandName: string,
  analysisId: string,
  responses: AIResponseData[]
): MediaMention[] {
  return getMediaMentionTracker().extractMentions(brandName, analysisId, responses);
}

export function getMediaSummary(analysisId: string): MediaMentionSummary | null {
  return getMediaMentionTracker().summarize(analysisId);
}
