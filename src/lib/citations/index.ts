/**
 * Citation Source Tracking Module
 *
 * Phase 2, Week 3, Day 4
 *
 * Extracts, validates, and tracks citations from AI responses and web content.
 * Helps understand what sources AI models use to form opinions about brands.
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Citation source type
 */
export type CitationSourceType =
  | 'wikipedia'
  | 'news'
  | 'academic'
  | 'blog'
  | 'official'
  | 'review-site'
  | 'social'
  | 'government'
  | 'directory'
  | 'forum'
  | 'unknown';

/**
 * Citation quality assessment
 */
export type CitationQuality = 'high' | 'medium' | 'low' | 'unknown';

/**
 * Extracted citation
 */
export interface Citation {
  /** Unique identifier */
  id: string;
  /** URL of the source */
  url?: string;
  /** Domain of the source */
  domain?: string;
  /** Source type */
  sourceType: CitationSourceType;
  /** Quality assessment */
  quality: CitationQuality;
  /** Citation text/title */
  text: string;
  /** Context where citation was found */
  context: string;
  /** Position in original text */
  position: number;
  /** Confidence that this is a valid citation */
  confidence: number;
  /** Whether the citation is about the brand */
  isBrandRelated: boolean;
  /** Sentiment of the citation context */
  sentiment: number;
  /** Date mentioned (if any) */
  dateReference?: string;
  /** Author mentioned (if any) */
  authorReference?: string;
}

/**
 * Citation tracking result
 */
export interface CitationTrackingResult {
  /** Brand being analyzed */
  brand: string;
  /** All extracted citations */
  citations: Citation[];
  /** Citations by source type */
  bySourceType: Record<CitationSourceType, Citation[]>;
  /** Citation quality distribution */
  qualityDistribution: Record<CitationQuality, number>;
  /** High-authority citations */
  highAuthorityCitations: Citation[];
  /** Brand-related citations */
  brandCitations: Citation[];
  /** Citation gaps (missing important sources) */
  citationGaps: CitationGap[];
  /** Summary statistics */
  stats: CitationStats;
  /** Recommendations for improving citations */
  recommendations: CitationRecommendation[];
  /** Analysis timestamp */
  analyzedAt: string;
}

/**
 * Citation gap
 */
export interface CitationGap {
  /** Source type missing */
  sourceType: CitationSourceType;
  /** Importance level */
  importance: 'critical' | 'high' | 'medium' | 'low';
  /** Description of the gap */
  description: string;
  /** How to address */
  actionItem: string;
}

/**
 * Citation statistics
 */
export interface CitationStats {
  /** Total citations found */
  total: number;
  /** Average quality score */
  averageQuality: number;
  /** Brand mention rate in citations */
  brandMentionRate: number;
  /** Unique domains */
  uniqueDomains: number;
  /** High authority ratio */
  highAuthorityRatio: number;
}

/**
 * Citation recommendation
 */
export interface CitationRecommendation {
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Expected impact */
  impact: string;
  /** Action items */
  actionItems: string[];
}

/**
 * Citation extraction options
 */
export interface CitationExtractionOptions {
  /** Brand to focus on */
  brand?: string;
  /** Include URL validation */
  validateUrls?: boolean;
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Maximum citations to extract */
  maxCitations?: number;
}

// ================================================================
// SOURCE TYPE DETECTION
// ================================================================

const DOMAIN_TYPE_MAP: Record<string, CitationSourceType> = {
  // Wikipedia
  'wikipedia.org': 'wikipedia',
  'en.wikipedia.org': 'wikipedia',
  'wikidata.org': 'wikipedia',

  // News
  'nytimes.com': 'news',
  'wsj.com': 'news',
  'reuters.com': 'news',
  'bloomberg.com': 'news',
  'forbes.com': 'news',
  'techcrunch.com': 'news',
  'bbc.com': 'news',
  'cnn.com': 'news',
  'theguardian.com': 'news',
  'businessinsider.com': 'news',
  'venturebeat.com': 'news',
  'wired.com': 'news',

  // Academic
  'arxiv.org': 'academic',
  'scholar.google.com': 'academic',
  'researchgate.net': 'academic',
  'jstor.org': 'academic',
  'pubmed.ncbi.nlm.nih.gov': 'academic',
  'nature.com': 'academic',
  'sciencedirect.com': 'academic',

  // Review sites
  'g2.com': 'review-site',
  'capterra.com': 'review-site',
  'trustpilot.com': 'review-site',
  'yelp.com': 'review-site',
  'glassdoor.com': 'review-site',
  'softwareadvice.com': 'review-site',
  'getapp.com': 'review-site',

  // Social
  'twitter.com': 'social',
  'x.com': 'social',
  'linkedin.com': 'social',
  'facebook.com': 'social',
  'reddit.com': 'forum',
  'youtube.com': 'social',

  // Forums
  'stackoverflow.com': 'forum',
  'quora.com': 'forum',
  'hackernews.com': 'forum',
  'news.ycombinator.com': 'forum',

  // Directories
  'crunchbase.com': 'directory',
  'pitchbook.com': 'directory',
  'producthunt.com': 'directory',
  'angel.co': 'directory',
};

const TLD_TYPE_MAP: Record<string, CitationSourceType> = {
  '.gov': 'government',
  '.edu': 'academic',
  '.org': 'unknown', // Could be many things
};

// ================================================================
// CITATION PATTERNS
// ================================================================

const CITATION_PATTERNS = [
  // URL patterns
  /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi,

  // "According to [source]" patterns
  /according to\s+([^,.\n]+)/gi,
  /as reported by\s+([^,.\n]+)/gi,
  /as stated by\s+([^,.\n]+)/gi,

  // Research/study citations
  /(?:a |the )?(?:study|research|report|survey) (?:by|from)\s+([^,.\n]+)/gi,
  /(?:published|released) (?:by|in)\s+([^,.\n]+)/gi,

  // Quote attributions
  /[""]([^""]+)[""]\s*[-–—]\s*([^,.\n]+)/gi,

  // Source mentions
  /source:\s*([^,.\n]+)/gi,
  /reference:\s*([^,.\n]+)/gi,
  /via\s+([^,.\n]+)/gi,

  // Named publications
  /(?:in|on|from)\s+(?:the\s+)?(New York Times|Wall Street Journal|Forbes|Bloomberg|Reuters|TechCrunch|Wired)/gi,
];

// ================================================================
// EXTRACTION FUNCTIONS
// ================================================================

/**
 * Extract citations from text
 */
export function extractCitations(
  text: string,
  options: CitationExtractionOptions = {}
): CitationTrackingResult {
  const {
    brand = '',
    minConfidence = 0.3,
    maxCitations = 50,
  } = options;

  const citations: Citation[] = [];
  const seenUrls = new Set<string>();
  const seenTexts = new Set<string>();

  // Extract URLs
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;
  let match;

  while ((match = urlPattern.exec(text)) !== null) {
    const url = cleanUrl(match[0]);
    if (seenUrls.has(url)) continue;
    seenUrls.add(url);

    const citation = createCitationFromUrl(url, text, match.index, brand);
    if (citation.confidence >= minConfidence) {
      citations.push(citation);
    }
  }

  // Extract textual citations
  for (const pattern of CITATION_PATTERNS.slice(1)) { // Skip URL pattern
    pattern.lastIndex = 0; // Reset regex
    while ((match = pattern.exec(text)) !== null) {
      const citationText = match[1] || match[0];
      const normalized = citationText.toLowerCase().trim();

      if (seenTexts.has(normalized)) continue;
      if (normalized.length < 3 || normalized.length > 200) continue;

      seenTexts.add(normalized);

      const citation = createCitationFromText(citationText, text, match.index, brand);
      if (citation.confidence >= minConfidence) {
        citations.push(citation);
      }
    }
  }

  // Sort by confidence and limit
  citations.sort((a, b) => b.confidence - a.confidence);
  const limitedCitations = citations.slice(0, maxCitations);

  // Group by source type
  const bySourceType: Record<CitationSourceType, Citation[]> = {
    wikipedia: [],
    news: [],
    academic: [],
    blog: [],
    official: [],
    'review-site': [],
    social: [],
    government: [],
    directory: [],
    forum: [],
    unknown: [],
  };

  for (const citation of limitedCitations) {
    bySourceType[citation.sourceType].push(citation);
  }

  // Calculate quality distribution
  const qualityDistribution: Record<CitationQuality, number> = {
    high: 0,
    medium: 0,
    low: 0,
    unknown: 0,
  };

  for (const citation of limitedCitations) {
    qualityDistribution[citation.quality]++;
  }

  // Extract high authority and brand citations
  const highAuthorityCitations = limitedCitations.filter(c => c.quality === 'high');
  const brandCitations = limitedCitations.filter(c => c.isBrandRelated);

  // Identify citation gaps
  const citationGaps = identifyCitationGaps(bySourceType, brand);

  // Calculate stats
  const stats = calculateCitationStats(limitedCitations, brand);

  // Generate recommendations
  const recommendations = generateCitationRecommendations(
    bySourceType,
    citationGaps,
    stats,
    brand
  );

  return {
    brand,
    citations: limitedCitations,
    bySourceType,
    qualityDistribution,
    highAuthorityCitations,
    brandCitations,
    citationGaps,
    stats,
    recommendations,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Track citation over time
 */
export function compareCitationResults(
  previous: CitationTrackingResult,
  current: CitationTrackingResult
): CitationComparison {
  const newCitations = current.citations.filter(
    c => !previous.citations.some(p => p.url === c.url && p.text === c.text)
  );

  const lostCitations = previous.citations.filter(
    p => !current.citations.some(c => c.url === p.url && c.text === p.text)
  );

  const qualityChange = current.stats.averageQuality - previous.stats.averageQuality;
  const countChange = current.stats.total - previous.stats.total;

  return {
    newCitations,
    lostCitations,
    qualityChange,
    countChange,
    previousStats: previous.stats,
    currentStats: current.stats,
    trend: countChange > 0 ? 'improving' : countChange < 0 ? 'declining' : 'stable',
  };
}

export interface CitationComparison {
  newCitations: Citation[];
  lostCitations: Citation[];
  qualityChange: number;
  countChange: number;
  previousStats: CitationStats;
  currentStats: CitationStats;
  trend: 'improving' | 'declining' | 'stable';
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function generateCitationId(): string {
  return `cit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function cleanUrl(url: string): string {
  // Remove trailing punctuation
  return url.replace(/[.,;:!?)]+$/, '');
}

function extractDomain(url: string): string | undefined {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

function detectSourceType(url?: string, text?: string): CitationSourceType {
  if (url) {
    const domain = extractDomain(url);
    if (domain) {
      // Check exact domain match
      if (DOMAIN_TYPE_MAP[domain]) {
        return DOMAIN_TYPE_MAP[domain];
      }

      // Check TLD
      for (const [tld, type] of Object.entries(TLD_TYPE_MAP)) {
        if (domain.endsWith(tld)) {
          return type;
        }
      }

      // Check if it's a company's official domain
      if (text && text.toLowerCase().includes('official')) {
        return 'official';
      }

      // Check for blog indicators
      if (domain.includes('blog') || domain.includes('medium.com') || domain.includes('substack')) {
        return 'blog';
      }
    }
  }

  if (text) {
    const textLower = text.toLowerCase();

    if (textLower.includes('wikipedia')) return 'wikipedia';
    if (textLower.includes('study') || textLower.includes('research') || textLower.includes('journal')) return 'academic';
    if (textLower.includes('review') || textLower.includes('rating')) return 'review-site';
    if (textLower.includes('news') || textLower.includes('times') || textLower.includes('post')) return 'news';
    if (textLower.includes('blog') || textLower.includes('article')) return 'blog';
  }

  return 'unknown';
}

function assessCitationQuality(sourceType: CitationSourceType, domain?: string): CitationQuality {
  // High quality sources
  const highQualityTypes: CitationSourceType[] = ['wikipedia', 'academic', 'government', 'news'];
  if (highQualityTypes.includes(sourceType)) {
    return 'high';
  }

  // Medium quality
  const mediumQualityTypes: CitationSourceType[] = ['official', 'review-site', 'directory'];
  if (mediumQualityTypes.includes(sourceType)) {
    return 'medium';
  }

  // Check domain for additional quality signals
  if (domain) {
    const premiumDomains = ['nytimes.com', 'wsj.com', 'reuters.com', 'forbes.com', 'bloomberg.com'];
    if (premiumDomains.some(d => domain.includes(d))) {
      return 'high';
    }
  }

  // Low quality
  const lowQualityTypes: CitationSourceType[] = ['social', 'forum', 'blog'];
  if (lowQualityTypes.includes(sourceType)) {
    return 'low';
  }

  return 'unknown';
}

function extractContext(text: string, position: number, length: number = 150): string {
  const start = Math.max(0, position - length);
  const end = Math.min(text.length, position + length);
  let context = text.substring(start, end);

  if (start > 0) context = '...' + context;
  if (end < text.length) context = context + '...';

  return context.trim();
}

function analyzeSentiment(text: string): number {
  const textLower = text.toLowerCase();
  let score = 0;

  const positive = ['excellent', 'great', 'best', 'leading', 'trusted', 'recommended', 'award'];
  const negative = ['poor', 'bad', 'worst', 'avoid', 'issue', 'problem', 'criticism'];

  for (const word of positive) {
    if (textLower.includes(word)) score += 0.15;
  }
  for (const word of negative) {
    if (textLower.includes(word)) score -= 0.15;
  }

  return Math.max(-1, Math.min(1, score));
}

function createCitationFromUrl(
  url: string,
  fullText: string,
  position: number,
  brand: string
): Citation {
  const domain = extractDomain(url);
  const sourceType = detectSourceType(url);
  const quality = assessCitationQuality(sourceType, domain);
  const context = extractContext(fullText, position);
  const isBrandRelated = brand ? context.toLowerCase().includes(brand.toLowerCase()) : false;

  return {
    id: generateCitationId(),
    url,
    domain,
    sourceType,
    quality,
    text: url,
    context,
    position,
    confidence: 0.9, // High confidence for URLs
    isBrandRelated,
    sentiment: analyzeSentiment(context),
  };
}

function createCitationFromText(
  citationText: string,
  fullText: string,
  position: number,
  brand: string
): Citation {
  const sourceType = detectSourceType(undefined, citationText);
  const quality = assessCitationQuality(sourceType);
  const context = extractContext(fullText, position);
  const isBrandRelated = brand ? context.toLowerCase().includes(brand.toLowerCase()) : false;

  // Lower confidence for text-based citations
  let confidence = 0.5;
  if (citationText.length > 20) confidence += 0.1;
  if (/\d{4}/.test(citationText)) confidence += 0.1; // Has year
  if (sourceType !== 'unknown') confidence += 0.2;

  return {
    id: generateCitationId(),
    sourceType,
    quality,
    text: citationText.trim(),
    context,
    position,
    confidence: Math.min(1, confidence),
    isBrandRelated,
    sentiment: analyzeSentiment(context),
  };
}

function identifyCitationGaps(
  bySourceType: Record<CitationSourceType, Citation[]>,
  brand: string
): CitationGap[] {
  const gaps: CitationGap[] = [];

  // Wikipedia gap
  if (bySourceType.wikipedia.length === 0) {
    gaps.push({
      sourceType: 'wikipedia',
      importance: 'critical',
      description: 'No Wikipedia citations found. Wikipedia is a primary source for AI training.',
      actionItem: brand
        ? `Work towards establishing a Wikipedia presence for ${brand}`
        : 'Establish Wikipedia presence for your brand',
    });
  }

  // News gap
  if (bySourceType.news.length < 2) {
    gaps.push({
      sourceType: 'news',
      importance: 'high',
      description: 'Limited news citations. Press coverage improves AI recognition.',
      actionItem: 'Increase PR activities to generate news coverage',
    });
  }

  // Academic gap
  if (bySourceType.academic.length === 0) {
    gaps.push({
      sourceType: 'academic',
      importance: 'medium',
      description: 'No academic citations. Research citations boost authority.',
      actionItem: 'Publish original research or partner with academic institutions',
    });
  }

  // Review site gap
  if (bySourceType['review-site'].length === 0) {
    gaps.push({
      sourceType: 'review-site',
      importance: 'high',
      description: 'No review site citations. Reviews are key for AI recommendations.',
      actionItem: 'Build presence on G2, Capterra, Trustpilot, and other review platforms',
    });
  }

  return gaps;
}

function calculateCitationStats(citations: Citation[], brand: string): CitationStats {
  const total = citations.length;
  if (total === 0) {
    return {
      total: 0,
      averageQuality: 0,
      brandMentionRate: 0,
      uniqueDomains: 0,
      highAuthorityRatio: 0,
    };
  }

  const qualityScores: Record<CitationQuality, number> = {
    high: 1,
    medium: 0.6,
    low: 0.3,
    unknown: 0.5,
  };

  const averageQuality = citations.reduce(
    (sum, c) => sum + qualityScores[c.quality],
    0
  ) / total;

  const brandCitations = citations.filter(c => c.isBrandRelated).length;
  const brandMentionRate = brandCitations / total;

  const domains = new Set(citations.map(c => c.domain).filter(Boolean));
  const uniqueDomains = domains.size;

  const highAuthority = citations.filter(c => c.quality === 'high').length;
  const highAuthorityRatio = highAuthority / total;

  return {
    total,
    averageQuality: Math.round(averageQuality * 100) / 100,
    brandMentionRate: Math.round(brandMentionRate * 100) / 100,
    uniqueDomains,
    highAuthorityRatio: Math.round(highAuthorityRatio * 100) / 100,
  };
}

function generateCitationRecommendations(
  bySourceType: Record<CitationSourceType, Citation[]>,
  gaps: CitationGap[],
  stats: CitationStats,
  brand: string
): CitationRecommendation[] {
  const recommendations: CitationRecommendation[] = [];

  // Recommendations based on gaps
  for (const gap of gaps.filter(g => g.importance === 'critical' || g.importance === 'high')) {
    recommendations.push({
      priority: gap.importance === 'critical' ? 'high' : 'medium',
      title: `Address ${gap.sourceType} Citation Gap`,
      description: gap.description,
      impact: `Improved AI recognition and authority in ${gap.sourceType} sources`,
      actionItems: [gap.actionItem],
    });
  }

  // Low quality ratio
  if (stats.highAuthorityRatio < 0.3) {
    recommendations.push({
      priority: 'high',
      title: 'Improve Citation Quality',
      description: 'Most citations come from low-authority sources.',
      impact: 'Higher quality citations lead to more favorable AI representation',
      actionItems: [
        'Focus on earning coverage from premium news outlets',
        'Publish original research for academic citations',
        'Strengthen Wikipedia presence',
      ],
    });
  }

  // Low brand mention rate
  if (stats.brandMentionRate < 0.2 && brand) {
    recommendations.push({
      priority: 'medium',
      title: 'Increase Brand-Related Citations',
      description: `Only ${Math.round(stats.brandMentionRate * 100)}% of citations mention ${brand}.`,
      impact: 'More brand mentions in authoritative sources',
      actionItems: [
        'Create newsworthy announcements',
        'Develop thought leadership content',
        'Build case studies with customer success stories',
      ],
    });
  }

  return recommendations.slice(0, 5);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  extractCitations,
  compareCitationResults,
};
