/**
 * Competitor Detection Module
 *
 * Phase 2, Week 3, Day 3
 *
 * Detects and analyzes competitors from AI responses and website content.
 * Integrates with competitor-tiers for classification.
 */

import {
  classifyCompetitor,
  type CompetitorTier,
  type CompetitorProfile,
  type TierClassificationResult,
} from '../domain/competitor-tiers';

// ================================================================
// TYPES
// ================================================================

/**
 * Detected competitor from text
 */
export interface DetectedCompetitor {
  /** Competitor name */
  name: string;
  /** Normalized name for deduplication */
  normalizedName: string;
  /** Frequency in the text */
  frequency: number;
  /** Contexts where mentioned */
  contexts: CompetitorContext[];
  /** Classification tier */
  tier?: CompetitorTier;
  /** Classification confidence */
  tierConfidence?: number;
  /** Whether this is a direct competitor */
  isDirect: boolean;
  /** Sentiment of mentions (-1 to 1) */
  sentiment: number;
  /** Detected industry */
  industry?: string;
  /** Domain if detected */
  domain?: string;
}

/**
 * Context of competitor mention
 */
export interface CompetitorContext {
  /** Surrounding text */
  text: string;
  /** Type of mention */
  type: ContextType;
  /** Position in original text */
  position: number;
  /** Sentiment of this specific mention */
  sentiment: number;
}

export type ContextType =
  | 'comparison'     // Direct comparison
  | 'recommendation' // Recommended by AI
  | 'alternative'    // Mentioned as alternative
  | 'example'        // Used as example
  | 'factual'        // Factual mention
  | 'negative'       // Negative context
  | 'positive';      // Positive context

/**
 * Competitor detection result
 */
export interface CompetitorDetectionResult {
  /** Brand being analyzed */
  brand: string;
  /** Detected competitors */
  competitors: DetectedCompetitor[];
  /** Direct competitors (most relevant) */
  directCompetitors: DetectedCompetitor[];
  /** Industry detected */
  industry?: string;
  /** Total competitor mentions */
  totalMentions: number;
  /** Analysis timestamp */
  analyzedAt: string;
}

/**
 * Detection options
 */
export interface DetectionOptions {
  /** Brand to exclude from competitors */
  excludeBrand?: string;
  /** Known competitors to prioritize */
  knownCompetitors?: string[];
  /** Industry for context */
  industry?: string;
  /** Minimum mentions to include */
  minFrequency?: number;
  /** Include tier classification */
  classifyTiers?: boolean;
  /** Maximum competitors to return */
  maxCompetitors?: number;
}

// ================================================================
// KNOWN COMPANIES DATABASE
// ================================================================

const KNOWN_COMPANIES: Record<string, { industry: string; tier: CompetitorTier; aliases?: string[] }> = {
  // Enterprise Tech
  'microsoft': { industry: 'technology', tier: 'enterprise', aliases: ['ms', 'msft'] },
  'google': { industry: 'technology', tier: 'enterprise', aliases: ['alphabet', 'googl'] },
  'amazon': { industry: 'technology', tier: 'enterprise', aliases: ['aws', 'amzn'] },
  'apple': { industry: 'technology', tier: 'enterprise', aliases: ['aapl'] },
  'meta': { industry: 'technology', tier: 'enterprise', aliases: ['facebook', 'fb'] },
  'salesforce': { industry: 'crm', tier: 'enterprise', aliases: ['sfdc'] },
  'oracle': { industry: 'enterprise-software', tier: 'enterprise' },
  'sap': { industry: 'enterprise-software', tier: 'enterprise' },
  'ibm': { industry: 'technology', tier: 'enterprise' },

  // Mid-Market SaaS
  'hubspot': { industry: 'marketing', tier: 'mid-market' },
  'zendesk': { industry: 'customer-service', tier: 'mid-market' },
  'asana': { industry: 'project-management', tier: 'mid-market' },
  'monday.com': { industry: 'project-management', tier: 'mid-market', aliases: ['monday'] },
  'mailchimp': { industry: 'email-marketing', tier: 'mid-market' },
  'slack': { industry: 'communication', tier: 'mid-market' },
  'zoom': { industry: 'video-conferencing', tier: 'mid-market' },
  'shopify': { industry: 'e-commerce', tier: 'mid-market' },
  'stripe': { industry: 'payments', tier: 'mid-market' },
  'twilio': { industry: 'communication-api', tier: 'mid-market' },

  // SMB Tools
  'notion': { industry: 'productivity', tier: 'smb' },
  'calendly': { industry: 'scheduling', tier: 'smb' },
  'loom': { industry: 'video', tier: 'smb' },
  'airtable': { industry: 'database', tier: 'smb' },
  'zapier': { industry: 'automation', tier: 'smb' },
  'canva': { industry: 'design', tier: 'smb' },
  'figma': { industry: 'design', tier: 'smb' },
  'trello': { industry: 'project-management', tier: 'smb' },
  'dropbox': { industry: 'storage', tier: 'smb' },

  // AI Companies
  'openai': { industry: 'ai', tier: 'mid-market', aliases: ['chatgpt', 'gpt'] },
  'anthropic': { industry: 'ai', tier: 'mid-market', aliases: ['claude'] },
  'cohere': { industry: 'ai', tier: 'smb' },
  'hugging face': { industry: 'ai', tier: 'smb', aliases: ['huggingface'] },
};

// ================================================================
// DETECTION PATTERNS
// ================================================================

const COMPARISON_PATTERNS = [
  /\b(vs|versus|compared to|unlike|similar to|better than|worse than|alternative to)\s+(\w+(?:\s+\w+)?)/gi,
  /(\w+(?:\s+\w+)?)\s+(vs|versus|compared to)\s+(\w+(?:\s+\w+)?)/gi,
  /\b(instead of|rather than|over)\s+(\w+(?:\s+\w+)?)/gi,
];

const RECOMMENDATION_PATTERNS = [
  /\b(recommend|suggest|try|consider|use)\s+(\w+(?:\s+\w+)?)/gi,
  /(\w+(?:\s+\w+)?)\s+is\s+(recommended|suggested|a good choice)/gi,
];

const ALTERNATIVE_PATTERNS = [
  /\b(alternatives?|options?|competitors?)\s+(?:include|like|such as)\s+([^.]+)/gi,
  /\b(popular|common|top)\s+(?:alternatives?|options?)\s+(?:are|include)\s+([^.]+)/gi,
];

// ================================================================
// COMPETITOR DETECTION
// ================================================================

/**
 * Detect competitors from text
 */
export function detectCompetitors(
  text: string,
  options: DetectionOptions = {}
): CompetitorDetectionResult {
  const {
    excludeBrand,
    knownCompetitors = [],
    industry,
    minFrequency = 1,
    classifyTiers = true,
    maxCompetitors = 20,
  } = options;

  const detectedMap = new Map<string, DetectedCompetitor>();
  const textLower = text.toLowerCase();

  // 1. Check for known companies
  for (const [company, info] of Object.entries(KNOWN_COMPANIES)) {
    const allNames = [company, ...(info.aliases || [])];

    for (const name of allNames) {
      const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'gi');
      const matches = [...textLower.matchAll(regex)];

      if (matches.length > 0) {
        const normalizedName = company;
        const existing = detectedMap.get(normalizedName);

        const contexts = matches.map(match => extractContext(text, match.index || 0, name));
        const frequency = matches.length;
        const sentiment = calculateAverageSentiment(contexts);

        if (existing) {
          existing.frequency += frequency;
          existing.contexts.push(...contexts);
          existing.sentiment = (existing.sentiment + sentiment) / 2;
        } else {
          detectedMap.set(normalizedName, {
            name: capitalize(company),
            normalizedName,
            frequency,
            contexts,
            tier: info.tier,
            tierConfidence: 0.9, // High confidence for known companies
            isDirect: industry ? info.industry === industry : false,
            sentiment,
            industry: info.industry,
          });
        }
      }
    }
  }

  // 2. Check known competitors passed in options
  for (const competitor of knownCompetitors) {
    const regex = new RegExp(`\\b${escapeRegex(competitor)}\\b`, 'gi');
    const matches = [...textLower.matchAll(regex)];

    if (matches.length > 0) {
      const normalizedName = competitor.toLowerCase();
      if (!detectedMap.has(normalizedName)) {
        const contexts = matches.map(match => extractContext(text, match.index || 0, competitor));

        detectedMap.set(normalizedName, {
          name: competitor,
          normalizedName,
          frequency: matches.length,
          contexts,
          isDirect: true,
          sentiment: calculateAverageSentiment(contexts),
        });
      }
    }
  }

  // 3. Extract from comparison patterns
  for (const pattern of [...COMPARISON_PATTERNS, ...RECOMMENDATION_PATTERNS, ...ALTERNATIVE_PATTERNS]) {
    const matches = [...text.matchAll(pattern)];

    for (const match of matches) {
      // Extract potential company name (simplified)
      const potentialName = match[2] || match[1];
      if (!potentialName) continue;

      const cleaned = cleanCompanyName(potentialName);
      if (cleaned.length < 2) continue;

      const normalizedName = cleaned.toLowerCase();

      // Skip if it's the brand being analyzed
      if (excludeBrand && normalizedName === excludeBrand.toLowerCase()) continue;

      const existing = detectedMap.get(normalizedName);
      const context = extractContext(text, match.index || 0, cleaned);

      if (existing) {
        existing.frequency++;
        existing.contexts.push(context);
      } else {
        // Check if it looks like a company name
        if (isLikelyCompanyName(cleaned)) {
          detectedMap.set(normalizedName, {
            name: cleaned,
            normalizedName,
            frequency: 1,
            contexts: [context],
            isDirect: false,
            sentiment: context.sentiment,
          });
        }
      }
    }
  }

  // 4. Filter and sort
  let competitors = Array.from(detectedMap.values())
    .filter(c => c.frequency >= minFrequency)
    .filter(c => !excludeBrand || c.normalizedName !== excludeBrand.toLowerCase());

  // 5. Classify tiers if not already classified
  if (classifyTiers) {
    competitors = competitors.map(comp => {
      if (!comp.tier) {
        const classification = classifyFromContext(comp);
        comp.tier = classification.tier;
        comp.tierConfidence = classification.confidence;
      }
      return comp;
    });
  }

  // 6. Sort by relevance (frequency * direct score)
  competitors.sort((a, b) => {
    const aScore = a.frequency * (a.isDirect ? 2 : 1);
    const bScore = b.frequency * (b.isDirect ? 2 : 1);
    return bScore - aScore;
  });

  // 7. Limit results
  competitors = competitors.slice(0, maxCompetitors);

  // Identify direct competitors
  const directCompetitors = competitors.filter(c => c.isDirect || c.frequency >= 3);

  return {
    brand: excludeBrand || '',
    competitors,
    directCompetitors,
    industry,
    totalMentions: competitors.reduce((sum, c) => sum + c.frequency, 0),
    analyzedAt: new Date().toISOString(),
  };
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function capitalize(str: string): string {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

function cleanCompanyName(name: string): string {
  return name
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isLikelyCompanyName(name: string): boolean {
  // Simple heuristics for company names
  if (name.length < 2 || name.length > 50) return false;

  // Starts with capital letter
  if (!/^[A-Z]/.test(name)) return false;

  // Not common words
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'with', 'for', 'from', 'that', 'this',
    'they', 'their', 'there', 'what', 'which', 'where', 'when', 'how',
  ]);
  if (commonWords.has(name.toLowerCase())) return false;

  return true;
}

function extractContext(text: string, position: number, name: string): CompetitorContext {
  const contextRadius = 150;
  const start = Math.max(0, position - contextRadius);
  const end = Math.min(text.length, position + name.length + contextRadius);

  let contextText = text.substring(start, end);
  if (start > 0) contextText = '...' + contextText;
  if (end < text.length) contextText = contextText + '...';

  const type = classifyContextType(contextText, name);
  const sentiment = analyzeSentiment(contextText);

  return {
    text: contextText.trim(),
    type,
    position,
    sentiment,
  };
}

function classifyContextType(context: string, _name: string): ContextType {
  const contextLower = context.toLowerCase();

  if (/\b(vs|versus|compared|comparison|compete|against)\b/i.test(contextLower)) {
    return 'comparison';
  }
  if (/\b(recommend|suggest|try|consider|best|top)\b/i.test(contextLower)) {
    return 'recommendation';
  }
  if (/\b(alternative|instead|rather|option)\b/i.test(contextLower)) {
    return 'alternative';
  }
  if (/\b(example|such as|like|including)\b/i.test(contextLower)) {
    return 'example';
  }
  if (/\b(avoid|don't|issue|problem|bad|poor|worse)\b/i.test(contextLower)) {
    return 'negative';
  }
  if (/\b(great|excellent|best|leading|top|quality)\b/i.test(contextLower)) {
    return 'positive';
  }

  return 'factual';
}

function analyzeSentiment(text: string): number {
  const textLower = text.toLowerCase();
  let score = 0;

  const positiveTerms = ['great', 'excellent', 'best', 'recommend', 'quality', 'leading', 'popular', 'trusted'];
  const negativeTerms = ['avoid', 'issue', 'problem', 'bad', 'poor', 'worse', 'expensive', 'limited'];

  for (const term of positiveTerms) {
    if (textLower.includes(term)) score += 0.15;
  }
  for (const term of negativeTerms) {
    if (textLower.includes(term)) score -= 0.15;
  }

  return Math.max(-1, Math.min(1, score));
}

function calculateAverageSentiment(contexts: CompetitorContext[]): number {
  if (contexts.length === 0) return 0;
  return contexts.reduce((sum, c) => sum + c.sentiment, 0) / contexts.length;
}

function classifyFromContext(competitor: DetectedCompetitor): TierClassificationResult {
  // Use context signals to classify
  const signals: Parameters<typeof classifyCompetitor>[0] = {
    websiteSignals: competitor.contexts.map(c => c.text).slice(0, 5),
  };

  // Look for tier indicators in context
  for (const context of competitor.contexts) {
    const text = context.text.toLowerCase();

    if (text.includes('enterprise') || text.includes('fortune 500')) {
      signals.hasEnterpriseFeatures = true;
    }
    if (text.includes('free trial') || text.includes('freemium')) {
      signals.hasFreeTriad = true;
      signals.hasPublicPricing = true;
    }
    if (text.includes('local') || text.includes('small business')) {
      signals.isLocal = true;
    }
  }

  return classifyCompetitor(signals);
}

// ================================================================
// COMPARISON FUNCTIONS
// ================================================================

/**
 * Compare brand with detected competitors
 */
export function generateCompetitorComparison(
  brandName: string,
  competitors: DetectedCompetitor[]
): CompetitorComparison {
  const directThreats = competitors.filter(c =>
    c.isDirect && c.sentiment > -0.3
  );

  const opportunities = competitors.filter(c =>
    c.sentiment < -0.2
  );

  const summary = `Found ${competitors.length} competitor mentions. ` +
    `${directThreats.length} direct competitors. ` +
    `${opportunities.length} with negative sentiment (potential opportunities).`;

  return {
    brandName,
    competitorCount: competitors.length,
    directThreats,
    opportunities,
    summary,
  };
}

export interface CompetitorComparison {
  brandName: string;
  competitorCount: number;
  directThreats: DetectedCompetitor[];
  opportunities: DetectedCompetitor[];
  summary: string;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  detectCompetitors,
  generateCompetitorComparison,
};
