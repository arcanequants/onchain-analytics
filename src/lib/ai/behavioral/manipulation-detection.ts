/**
 * Manipulation Detection
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Detect attempts to game AI perception scores
 * - Source credibility analysis
 * - Anomaly detection for suspicious patterns
 * - Gaming attempt classification
 */

// ============================================================================
// TYPES
// ============================================================================

export type ManipulationType =
  | 'astroturfing'           // Fake grassroots support
  | 'review_bombing'         // Coordinated negative reviews
  | 'keyword_stuffing'       // Excessive SEO manipulation
  | 'citation_manipulation'  // Fake or misleading citations
  | 'competitor_attack'      // Malicious competitor claims
  | 'self_promotion'         // Excessive self-references
  | 'temporal_gaming'        // Timing manipulation
  | 'volume_attack'          // Overwhelming with requests
  | 'semantic_injection';    // Hidden prompt injection

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ManipulationIndicator {
  type: ManipulationType;
  confidence: number;
  evidence: string[];
  affectedBrand?: string;
  sourceUrl?: string;
}

export interface SourceCredibility {
  url: string;
  domain: string;
  trustScore: number;        // 0-1
  domainAge: number;         // Days
  authorityScore: number;    // 0-1
  spamLikelihood: number;    // 0-1
  flags: string[];
}

export interface ManipulationDetectionResult {
  analysisId: string;
  timestamp: Date;
  brand: string;
  indicators: ManipulationIndicator[];
  sources: SourceCredibility[];
  threatLevel: ThreatLevel;
  overallManipulationScore: number;  // 0-1
  recommendations: string[];
  requiresReview: boolean;
}

export interface AnomalyPattern {
  patternId: string;
  type: 'score_spike' | 'volume_spike' | 'sentiment_shift' | 'source_cluster' | 'timing_pattern';
  description: string;
  severity: number;
  detectedAt: Date;
  relatedBrands: string[];
}

// ============================================================================
// TRUSTED DOMAINS
// ============================================================================

const TRUSTED_DOMAINS = new Set([
  'wikipedia.org', 'wikidata.org',
  'linkedin.com', 'crunchbase.com',
  'github.com', 'stackoverflow.com',
  'reuters.com', 'bloomberg.com', 'wsj.com', 'nytimes.com',
  'techcrunch.com', 'wired.com', 'theverge.com',
  'g2.com', 'capterra.com', 'trustpilot.com',
  'gartner.com', 'forrester.com',
]);

const SUSPICIOUS_DOMAINS = [
  /^pr-.*\.com$/,
  /press-release/,
  /seo-/,
  /backlink/,
  /free-press/,
  /spam/,
  /fake/,
];

const LOW_TRUST_TLDS = new Set([
  '.xyz', '.top', '.club', '.work', '.site', '.online',
  '.tk', '.ml', '.ga', '.cf', '.gq',
]);

// ============================================================================
// MANIPULATION PATTERNS
// ============================================================================

const KEYWORD_STUFFING_PATTERNS = [
  /best\s+\w+\s+best/gi,
  /top\s+\w+\s+top/gi,
  /#1\s+rated.*#1\s+rated/gi,
  /(\w+\s+){0,3}\1{3,}/gi,  // Repeated phrases
];

const SELF_PROMOTION_PATTERNS = [
  /we are the (best|leading|top|#1)/gi,
  /our (amazing|incredible|revolutionary)/gi,
  /unlike our competitors/gi,
  /we invented/gi,
  /we pioneered/gi,
];

const COMPETITOR_ATTACK_PATTERNS = [
  /\b(avoid|don't use|stay away from)\s+\w+/gi,
  /\b\w+\s+(is|are)\s+(terrible|awful|scam|fraud)/gi,
  /competitor\s+(lies|fraud|scam)/gi,
];

const FAKE_CITATION_PATTERNS = [
  /according to (an unnamed|anonymous) source/gi,
  /studies show.*no citation/gi,
  /experts agree.*unnamed/gi,
  /research proves.*no link/gi,
];

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Analyze source credibility
 */
export function analyzeSourceCredibility(url: string): SourceCredibility {
  let domain: string;
  try {
    domain = new URL(url).hostname.replace('www.', '');
  } catch {
    domain = url;
  }

  const flags: string[] = [];
  let trustScore = 0.5;  // Default neutral

  // Check trusted domains
  if (TRUSTED_DOMAINS.has(domain)) {
    trustScore = 0.9;
  }

  // Check suspicious patterns
  if (SUSPICIOUS_DOMAINS.some(p => p.test(domain))) {
    trustScore = 0.2;
    flags.push('Suspicious domain pattern');
  }

  // Check TLD
  const tld = '.' + domain.split('.').pop();
  if (LOW_TRUST_TLDS.has(tld)) {
    trustScore -= 0.2;
    flags.push('Low-trust TLD');
  }

  // Check for IP-based URL
  if (/^\d+\.\d+\.\d+\.\d+/.test(domain)) {
    trustScore = 0.1;
    flags.push('IP-based URL');
  }

  // Authority indicators
  const authorityScore = TRUSTED_DOMAINS.has(domain) ? 0.9 : 0.4;

  // Spam likelihood (inverse of trust)
  const spamLikelihood = 1 - trustScore;

  return {
    url,
    domain,
    trustScore: Math.max(0, Math.min(1, trustScore)),
    domainAge: 0,  // Would need external lookup
    authorityScore,
    spamLikelihood,
    flags,
  };
}

/**
 * Detect manipulation in text
 */
export function detectTextManipulation(text: string, brand: string): ManipulationIndicator[] {
  const indicators: ManipulationIndicator[] = [];
  const lower = text.toLowerCase();

  // Keyword stuffing
  for (const pattern of KEYWORD_STUFFING_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      indicators.push({
        type: 'keyword_stuffing',
        confidence: Math.min(0.3 * matches.length, 0.9),
        evidence: matches.slice(0, 3),
      });
      break;
    }
  }

  // Self-promotion
  const selfPromoMatches: string[] = [];
  for (const pattern of SELF_PROMOTION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      selfPromoMatches.push(...matches);
    }
  }
  if (selfPromoMatches.length > 0) {
    indicators.push({
      type: 'self_promotion',
      confidence: Math.min(0.25 * selfPromoMatches.length, 0.85),
      evidence: selfPromoMatches.slice(0, 3),
    });
  }

  // Competitor attacks
  for (const pattern of COMPETITOR_ATTACK_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      indicators.push({
        type: 'competitor_attack',
        confidence: 0.7,
        evidence: matches.slice(0, 3),
      });
      break;
    }
  }

  // Fake citations
  for (const pattern of FAKE_CITATION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      indicators.push({
        type: 'citation_manipulation',
        confidence: 0.6,
        evidence: matches.slice(0, 3),
      });
      break;
    }
  }

  // Brand mention density (possible astroturfing)
  const brandPattern = new RegExp(brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const brandMentions = (text.match(brandPattern) || []).length;
  const wordCount = text.split(/\s+/).length;
  const mentionDensity = brandMentions / wordCount;

  if (mentionDensity > 0.05 && brandMentions > 5) {  // >5% and >5 mentions
    indicators.push({
      type: 'astroturfing',
      confidence: Math.min(mentionDensity * 10, 0.8),
      evidence: [`Brand mentioned ${brandMentions} times in ${wordCount} words (${(mentionDensity * 100).toFixed(1)}%)`],
      affectedBrand: brand,
    });
  }

  return indicators;
}

/**
 * Detect semantic injection attempts
 */
export function detectSemanticInjection(text: string): ManipulationIndicator | null {
  const injectionPatterns = [
    /ignore (previous|all|above) instructions/gi,
    /you are now/gi,
    /pretend you are/gi,
    /act as if/gi,
    /system:\s*\[/gi,
    /\[hidden\]/gi,
    /<!--.*-->/gi,
    /\u200b|\u200c|\u200d|\ufeff/g,  // Zero-width characters
  ];

  for (const pattern of injectionPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      return {
        type: 'semantic_injection',
        confidence: 0.9,
        evidence: matches.slice(0, 3),
      };
    }
  }

  return null;
}

/**
 * Detect temporal gaming patterns
 */
export function detectTemporalGaming(
  timestamps: Date[],
  windowMinutes: number = 60
): ManipulationIndicator | null {
  if (timestamps.length < 5) return null;

  // Sort timestamps
  const sorted = [...timestamps].sort((a, b) => a.getTime() - b.getTime());

  // Check for bursts
  const windowMs = windowMinutes * 60 * 1000;

  for (let i = 0; i < sorted.length - 4; i++) {
    const windowEnd = sorted[i].getTime() + windowMs;
    const inWindow = sorted.filter(t => t.getTime() >= sorted[i].getTime() && t.getTime() <= windowEnd);

    if (inWindow.length >= 5) {
      return {
        type: 'temporal_gaming',
        confidence: 0.7,
        evidence: [`${inWindow.length} requests within ${windowMinutes} minutes`],
      };
    }
  }

  // Check for regular intervals (bot-like)
  const intervals = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i].getTime() - sorted[i - 1].getTime());
  }

  if (intervals.length >= 3) {
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Very regular intervals suggest automation
    if (stdDev / avgInterval < 0.1 && avgInterval < 60000) {  // <10% variance, <1min interval
      return {
        type: 'volume_attack',
        confidence: 0.8,
        evidence: [`Highly regular request pattern (${(stdDev / avgInterval * 100).toFixed(1)}% variance)`],
      };
    }
  }

  return null;
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

interface ScoreHistory {
  score: number;
  timestamp: Date;
}

/**
 * Detect score anomalies
 */
export function detectScoreAnomalies(
  history: ScoreHistory[],
  currentScore: number
): AnomalyPattern | null {
  if (history.length < 5) return null;

  const scores = history.map(h => h.score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
  );

  // Z-score
  const zScore = stdDev > 0 ? (currentScore - mean) / stdDev : 0;

  // Significant spike
  if (Math.abs(zScore) > 2.5) {
    return {
      patternId: `anomaly_${Date.now()}`,
      type: 'score_spike',
      description: `Score ${currentScore} is ${zScore.toFixed(1)} standard deviations from mean (${mean.toFixed(1)})`,
      severity: Math.min(Math.abs(zScore) / 4, 1),
      detectedAt: new Date(),
      relatedBrands: [],
    };
  }

  // Sudden sentiment shift
  const recentScores = history.slice(-3).map(h => h.score);
  const recentMean = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
  const historicMean = scores.slice(0, -3).reduce((a, b) => a + b, 0) / (scores.length - 3);

  if (Math.abs(recentMean - historicMean) > 20) {
    return {
      patternId: `anomaly_${Date.now()}`,
      type: 'sentiment_shift',
      description: `Sudden shift from average ${historicMean.toFixed(1)} to ${recentMean.toFixed(1)}`,
      severity: Math.min(Math.abs(recentMean - historicMean) / 40, 1),
      detectedAt: new Date(),
      relatedBrands: [],
    };
  }

  return null;
}

// ============================================================================
// FULL ANALYSIS
// ============================================================================

/**
 * Run complete manipulation detection
 */
export function analyzeForManipulation(
  brand: string,
  content: string,
  sources: string[],
  timestamps: Date[] = [],
  scoreHistory: ScoreHistory[] = [],
  currentScore: number = 50
): ManipulationDetectionResult {
  const indicators: ManipulationIndicator[] = [];

  // Text manipulation
  indicators.push(...detectTextManipulation(content, brand));

  // Semantic injection
  const injectionIndicator = detectSemanticInjection(content);
  if (injectionIndicator) {
    indicators.push(injectionIndicator);
  }

  // Temporal gaming
  if (timestamps.length > 0) {
    const temporalIndicator = detectTemporalGaming(timestamps);
    if (temporalIndicator) {
      indicators.push(temporalIndicator);
    }
  }

  // Source credibility
  const sourceAnalysis = sources.map(s => analyzeSourceCredibility(s));
  const lowTrustSources = sourceAnalysis.filter(s => s.trustScore < 0.3);

  if (lowTrustSources.length > sources.length * 0.3 && sources.length > 2) {
    indicators.push({
      type: 'citation_manipulation',
      confidence: 0.6,
      evidence: [`${lowTrustSources.length}/${sources.length} sources have low trust scores`],
    });
  }

  // Score anomalies
  const anomaly = detectScoreAnomalies(scoreHistory, currentScore);
  if (anomaly && anomaly.severity > 0.5) {
    indicators.push({
      type: 'temporal_gaming',
      confidence: anomaly.severity,
      evidence: [anomaly.description],
      affectedBrand: brand,
    });
  }

  // Calculate overall manipulation score
  const overallScore = indicators.length > 0
    ? indicators.reduce((sum, i) => sum + i.confidence, 0) / indicators.length
    : 0;

  // Determine threat level
  let threatLevel: ThreatLevel = 'none';
  const hasHighConfidence = indicators.some(i => i.confidence > 0.8);
  const hasCriticalType = indicators.some(i =>
    i.type === 'semantic_injection' || i.type === 'volume_attack'
  );

  if (hasCriticalType || (hasHighConfidence && indicators.length >= 3)) {
    threatLevel = 'critical';
  } else if (hasHighConfidence || indicators.length >= 2) {
    threatLevel = 'high';
  } else if (indicators.some(i => i.confidence > 0.5)) {
    threatLevel = 'medium';
  } else if (indicators.length > 0) {
    threatLevel = 'low';
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (indicators.some(i => i.type === 'semantic_injection')) {
    recommendations.push('CRITICAL: Possible prompt injection detected - review content immediately');
  }

  if (indicators.some(i => i.type === 'keyword_stuffing')) {
    recommendations.push('Content shows SEO manipulation - reduce weight in scoring');
  }

  if (indicators.some(i => i.type === 'astroturfing')) {
    recommendations.push('Possible astroturfing - verify source authenticity');
  }

  if (lowTrustSources.length > 0) {
    recommendations.push(`${lowTrustSources.length} low-trust sources detected - prioritize authoritative sources`);
  }

  if (recommendations.length === 0) {
    recommendations.push('No significant manipulation detected');
  }

  return {
    analysisId: `manip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    brand,
    indicators,
    sources: sourceAnalysis,
    threatLevel,
    overallManipulationScore: overallScore,
    recommendations,
    requiresReview: threatLevel === 'high' || threatLevel === 'critical',
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Source analysis
  analyzeSourceCredibility,

  // Detection
  detectTextManipulation,
  detectSemanticInjection,
  detectTemporalGaming,
  detectScoreAnomalies,

  // Full analysis
  analyzeForManipulation,

  // Constants
  TRUSTED_DOMAINS,
};
