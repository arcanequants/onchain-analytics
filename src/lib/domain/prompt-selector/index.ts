/**
 * Vertical Prompt Selector Module
 * Phase 1, Week 2, Day 6 - Domain Tasks
 *
 * Routes queries to appropriate vertical-specific prompts based on
 * industry detection, context signals, and user preferences.
 */

import {
  getVerticalPrompt,
  buildVerticalSystemPrompt,
  getSupportedIndustries as getVerticalIndustries,
  VerticalPrompt,
  VerticalPromptVariables
} from '@/lib/prompts/verticals';
import { getIndustryRegulations, buildRegulatoryContext } from '@/lib/domain/regulatory';
import { buildTermContext } from '@/lib/domain/glossary';

// ================================================================
// TYPES
// ================================================================

export type QueryIntent =
  | 'comparison'
  | 'recommendation'
  | 'evaluation'
  | 'research'
  | 'discovery'
  | 'validation';

export interface QueryContext {
  query: string;
  brand?: string;
  industryHint?: string;
  country?: string;
  competitors?: string[];
  userPreferences?: UserPreferences;
}

export interface UserPreferences {
  priorityFactors?: string[];
  budget?: 'low' | 'medium' | 'high' | 'enterprise';
  companySize?: 'startup' | 'smb' | 'mid-market' | 'enterprise';
  decisionUrgency?: 'immediate' | 'short-term' | 'long-term';
}

export interface PromptSelectionResult {
  industryId: string;
  industryName: string;
  confidence: number;
  systemPrompt: string;
  queryIntent: QueryIntent;
  contextEnhancements: ContextEnhancement[];
  fallbackUsed: boolean;
}

export interface ContextEnhancement {
  type: 'regulatory' | 'glossary' | 'geographic' | 'competitive';
  content: string;
}

export interface IndustryDetectionResult {
  industryId: string;
  confidence: number;
  matchedSignals: string[];
  alternativeIndustries?: { id: string; confidence: number }[];
}

// ================================================================
// INDUSTRY DETECTION SIGNALS
// ================================================================

const INDUSTRY_SIGNALS: Record<string, { keywords: string[]; patterns: RegExp[] }> = {
  saas: {
    keywords: [
      'software', 'saas', 'app', 'platform', 'tool', 'subscription',
      'crm', 'erp', 'api', 'integration', 'automation', 'dashboard',
      'project management', 'collaboration', 'productivity', 'analytics',
      'cloud', 'enterprise software', 'b2b software'
    ],
    patterns: [
      /\b(project management|task management)\b/i,
      /\b(crm|customer relationship)\b/i,
      /\b(marketing automation|email automation)\b/i,
      /\b(accounting software|invoicing software)\b/i,
      /\bsaas\b/i
    ]
  },
  fintech: {
    keywords: [
      'payment', 'banking', 'finance', 'investing', 'trading',
      'crypto', 'blockchain', 'lending', 'credit', 'insurance',
      'fintech', 'neobank', 'payment processor', 'merchant',
      'transaction', 'transfer', 'remittance', 'forex'
    ],
    patterns: [
      /\b(payment processor|payment gateway)\b/i,
      /\b(bank|banking|neobank)\b/i,
      /\b(invest|trading|broker)\b/i,
      /\b(crypto|bitcoin|ethereum)\b/i,
      /\b(credit card|debit card)\b/i
    ]
  },
  healthcare: {
    keywords: [
      'health', 'medical', 'doctor', 'hospital', 'clinic',
      'telehealth', 'telemedicine', 'therapy', 'mental health',
      'pharmacy', 'prescription', 'patient', 'diagnosis',
      'wellness', 'healthcare', 'clinical', 'treatment'
    ],
    patterns: [
      /\b(doctor|physician|specialist)\b/i,
      /\b(hospital|clinic|medical center)\b/i,
      /\b(therapy|therapist|counseling)\b/i,
      /\b(telehealth|telemedicine)\b/i,
      /\bhipaa\b/i
    ]
  },
  ecommerce: {
    keywords: [
      'ecommerce', 'e-commerce', 'online store', 'shop', 'retail',
      'marketplace', 'dropshipping', 'fulfillment', 'd2c', 'dtc',
      'shopify', 'woocommerce', 'product', 'inventory', 'shipping'
    ],
    patterns: [
      /\b(online store|online shop)\b/i,
      /\b(ecommerce|e-commerce)\b/i,
      /\b(shopify|woocommerce|bigcommerce)\b/i,
      /\b(d2c|dtc|direct to consumer)\b/i,
      /\b(dropship|fulfillment|3pl)\b/i
    ]
  },
  marketing: {
    keywords: [
      'marketing', 'advertising', 'seo', 'sem', 'ppc',
      'social media', 'content', 'email marketing', 'influencer',
      'brand', 'campaign', 'agency', 'creative', 'ads'
    ],
    patterns: [
      /\b(marketing agency|ad agency)\b/i,
      /\b(seo|search engine optimization)\b/i,
      /\b(social media marketing|smm)\b/i,
      /\b(email marketing|newsletter)\b/i,
      /\b(ppc|pay per click|google ads)\b/i
    ]
  },
  'real-estate': {
    keywords: [
      'real estate', 'property', 'house', 'apartment', 'condo',
      'mortgage', 'realtor', 'agent', 'broker', 'listing',
      'rent', 'lease', 'commercial property', 'residential'
    ],
    patterns: [
      /\b(real estate|realtor|realty)\b/i,
      /\b(property|properties)\b/i,
      /\b(mortgage|home loan)\b/i,
      /\b(buy|sell|rent).*(house|home|apartment|condo)\b/i,
      /\b(mls|zillow|redfin)\b/i
    ]
  },
  legal: {
    keywords: [
      'lawyer', 'attorney', 'legal', 'law firm', 'counsel',
      'litigation', 'contract', 'trademark', 'patent', 'ip',
      'lawsuit', 'court', 'settlement', 'legal advice'
    ],
    patterns: [
      /\b(lawyer|attorney|law firm)\b/i,
      /\b(legal services|legal advice)\b/i,
      /\b(contract|agreement).*(review|draft)\b/i,
      /\b(trademark|patent|copyright)\b/i,
      /\b(sue|lawsuit|litigation)\b/i
    ]
  },
  education: {
    keywords: [
      'education', 'learning', 'course', 'school', 'university',
      'bootcamp', 'training', 'certification', 'degree', 'tutor',
      'online learning', 'edtech', 'lms', 'mooc', 'curriculum',
      'mba', 'masters', 'phd', 'undergraduate', 'graduate program'
    ],
    patterns: [
      /\b(online course|online learning)\b/i,
      /\b(bootcamp|coding bootcamp)\b/i,
      /\b(university|college|school)\b/i,
      /\b(certification|certificate program)\b/i,
      /\b(coursera|udemy|linkedin learning)\b/i
    ]
  },
  hospitality: {
    keywords: [
      'hotel', 'resort', 'travel', 'vacation', 'booking',
      'airbnb', 'vrbo', 'flight', 'airline', 'cruise',
      'tourism', 'lodging', 'accommodation', 'trip'
    ],
    patterns: [
      /\b(hotel|resort|motel)\b/i,
      /\b(airbnb|vrbo|booking\.com)\b/i,
      /\b(flight|airline|travel)\b/i,
      /\b(vacation|trip|getaway)\b/i,
      /\b(cruise|tour|excursion)\b/i
    ]
  },
  restaurant: {
    keywords: [
      'restaurant', 'food', 'dining', 'cafe', 'bar',
      'delivery', 'takeout', 'catering', 'chef', 'cuisine',
      'menu', 'reservation', 'yelp', 'doordash', 'ubereats'
    ],
    patterns: [
      /\b(restaurant|cafe|bar|pub)\b/i,
      /\b(food delivery|takeout|doordash|ubereats)\b/i,
      /\b(best .*(restaurant|food|place to eat))\b/i,
      /\b(reservation|opentable|resy)\b/i,
      /\b(cuisine|menu|chef)\b/i
    ]
  }
};

// ================================================================
// QUERY INTENT DETECTION
// ================================================================

const INTENT_SIGNALS: Record<QueryIntent, { keywords: string[]; patterns: RegExp[] }> = {
  comparison: {
    keywords: ['vs', 'versus', 'compare', 'comparison', 'difference', 'better', 'or'],
    patterns: [
      /\bvs\.?\b/i,
      /\b(compare|comparison|comparing)\b/i,
      /\b(difference|differences) between\b/i,
      /\bwhich is better\b/i,
      /\b(\w+) or (\w+)\b/i
    ]
  },
  recommendation: {
    keywords: ['best', 'top', 'recommend', 'suggestion', 'should i', 'what should'],
    patterns: [
      /\b(best|top|leading)\b/i,
      /\b(recommend|suggestion|advice)\b/i,
      /\bshould i (use|try|buy|choose)\b/i,
      /\bwhat .* (recommend|suggest)\b/i
    ]
  },
  evaluation: {
    keywords: ['review', 'rating', 'worth', 'good', 'reliable', 'trustworthy'],
    patterns: [
      /\b(review|reviews|rating|ratings)\b/i,
      /\bis .* (good|worth|reliable)\b/i,
      /\b(pros|cons|advantages|disadvantages)\b/i,
      /\bhow (good|reliable) is\b/i
    ]
  },
  research: {
    keywords: ['what is', 'how does', 'explain', 'learn', 'understand', 'about'],
    patterns: [
      /\bwhat is\b/i,
      /\bhow does .* work\b/i,
      /\b(explain|tell me about)\b/i,
      /\b(learn|understand) .* (about|more)\b/i
    ]
  },
  discovery: {
    keywords: ['find', 'search', 'looking for', 'where', 'options', 'alternatives'],
    patterns: [
      /\b(find|search|looking for)\b/i,
      /\bwhere (can i|to)\b/i,
      /\b(options|alternatives|choices)\b/i,
      /\bshow me\b/i
    ]
  },
  validation: {
    keywords: ['is it true', 'verify', 'check', 'confirm', 'legitimate', 'scam'],
    patterns: [
      /\bis it (true|real|legit)\b/i,
      /\b(verify|check|confirm)\b/i,
      /\b(legitimate|legit|scam|fake)\b/i,
      /\bcan i trust\b/i
    ]
  }
};

// ================================================================
// CORE FUNCTIONS
// ================================================================

/**
 * Detect industry from query and context
 */
export function detectIndustry(context: QueryContext): IndustryDetectionResult {
  const { query, industryHint } = context;
  const queryLower = query.toLowerCase();

  const scores: Record<string, { score: number; signals: string[] }> = {};

  // Initialize scores
  for (const industryId of Object.keys(INDUSTRY_SIGNALS)) {
    scores[industryId] = { score: 0, signals: [] };
  }

  // If hint provided, give it significant weight
  if (industryHint && scores[industryHint]) {
    scores[industryHint].score += 50;
    scores[industryHint].signals.push('Industry hint provided');
  }

  // Score each industry based on signals
  for (const [industryId, signals] of Object.entries(INDUSTRY_SIGNALS)) {
    // Check keywords
    for (const keyword of signals.keywords) {
      if (queryLower.includes(keyword)) {
        scores[industryId].score += 10;
        scores[industryId].signals.push(`Keyword: ${keyword}`);
      }
    }

    // Check patterns (higher weight)
    for (const pattern of signals.patterns) {
      if (pattern.test(query)) {
        scores[industryId].score += 15;
        scores[industryId].signals.push(`Pattern match: ${pattern.source}`);
      }
    }
  }

  // Sort by score
  const sorted = Object.entries(scores)
    .map(([id, data]) => ({ id, ...data }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0) {
    return {
      industryId: 'general',
      confidence: 0.3,
      matchedSignals: ['No specific industry detected']
    };
  }

  const winner = sorted[0];
  const totalScore = sorted.reduce((sum, item) => sum + item.score, 0);
  const confidence = Math.min(winner.score / Math.max(totalScore, 1), 0.99);

  const alternatives = sorted.slice(1, 4).map(item => ({
    id: item.id,
    confidence: item.score / Math.max(totalScore, 1)
  }));

  return {
    industryId: winner.id,
    confidence: Math.round(confidence * 100) / 100,
    matchedSignals: winner.signals,
    alternativeIndustries: alternatives.length > 0 ? alternatives : undefined
  };
}

/**
 * Detect query intent
 */
export function detectQueryIntent(query: string): QueryIntent {
  const intentScores: Record<QueryIntent, number> = {
    comparison: 0,
    recommendation: 0,
    evaluation: 0,
    research: 0,
    discovery: 0,
    validation: 0
  };

  const queryLower = query.toLowerCase();

  for (const [intent, signals] of Object.entries(INTENT_SIGNALS)) {
    for (const keyword of signals.keywords) {
      if (queryLower.includes(keyword)) {
        intentScores[intent as QueryIntent] += 5;
      }
    }

    for (const pattern of signals.patterns) {
      if (pattern.test(query)) {
        intentScores[intent as QueryIntent] += 10;
      }
    }
  }

  // Find highest scoring intent
  const sorted = Object.entries(intentScores)
    .sort(([, a], [, b]) => b - a);

  return sorted[0][1] > 0 ? sorted[0][0] as QueryIntent : 'recommendation';
}

/**
 * Build context enhancements for the prompt
 */
export function buildContextEnhancements(
  industryId: string,
  country?: string
): ContextEnhancement[] {
  const enhancements: ContextEnhancement[] = [];

  // Add regulatory context
  const regulatoryContext = buildRegulatoryContext(industryId);
  if (regulatoryContext) {
    enhancements.push({
      type: 'regulatory',
      content: regulatoryContext
    });
  }

  // Add glossary context
  const glossaryContext = buildTermContext(industryId, {
    maxTerms: 10,
    includeDefinitions: false
  });
  if (glossaryContext) {
    enhancements.push({
      type: 'glossary',
      content: glossaryContext
    });
  }

  // Add geographic context if specified
  if (country) {
    const geoContext = buildGeographicContext(country, industryId);
    if (geoContext) {
      enhancements.push({
        type: 'geographic',
        content: geoContext
      });
    }
  }

  return enhancements;
}

/**
 * Build geographic context string
 */
function buildGeographicContext(country: string, industryId: string): string {
  const countryContexts: Record<string, string> = {
    US: 'Operating in the United States market. Consider US-specific regulations, consumer preferences, and market dynamics.',
    UK: 'Operating in the United Kingdom market. Consider UK-specific regulations (FCA, ICO), GDPR compliance, and British market preferences.',
    EU: 'Operating in the European Union market. GDPR compliance is mandatory. Consider multi-country logistics and localization.',
    CA: 'Operating in the Canadian market. Consider PIPEDA for privacy, bilingual requirements, and cross-border US considerations.',
    AU: 'Operating in the Australian market. Consider ACCC consumer protections, APRA for financial services, and timezone challenges.',
    MX: 'Operating in the Mexican market. Consider LFPDPPP for privacy, local payment preferences, and Spanish language requirements.',
    BR: 'Operating in the Brazilian market. LGPD compliance required. Consider PIX for payments and Portuguese localization.'
  };

  return countryContexts[country] || `Operating in ${country}. Consider local regulations and market preferences.`;
}

/**
 * Main prompt selection function
 */
export function selectPrompt(context: QueryContext): PromptSelectionResult {
  // Detect industry
  const industryDetection = detectIndustry(context);

  // Detect intent
  const queryIntent = detectQueryIntent(context.query);

  // Get vertical prompt
  const verticalPrompt = getVerticalPrompt(industryDetection.industryId);
  const fallbackUsed = !verticalPrompt;

  // Build system prompt
  const variables: VerticalPromptVariables = {
    brand: context.brand || 'the company',
    industry: industryDetection.industryId,
    country: context.country,
    competitors: context.competitors,
    query: context.query
  };

  let systemPrompt: string;
  let industryName: string;

  if (verticalPrompt) {
    systemPrompt = buildVerticalSystemPrompt(industryDetection.industryId, variables);
    industryName = verticalPrompt.industryName;
  } else {
    systemPrompt = buildGenericPrompt(context, queryIntent);
    industryName = 'General';
  }

  // Build context enhancements
  const contextEnhancements = buildContextEnhancements(
    industryDetection.industryId,
    context.country
  );

  // Append enhancements to system prompt
  if (contextEnhancements.length > 0) {
    systemPrompt += '\n\n--- Additional Context ---\n';
    for (const enhancement of contextEnhancements) {
      systemPrompt += `\n${enhancement.content}\n`;
    }
  }

  // Add intent-specific guidance
  systemPrompt += buildIntentGuidance(queryIntent);

  return {
    industryId: industryDetection.industryId,
    industryName,
    confidence: industryDetection.confidence,
    systemPrompt,
    queryIntent,
    contextEnhancements,
    fallbackUsed
  };
}

/**
 * Build generic prompt for unmatched industries
 */
function buildGenericPrompt(context: QueryContext, intent: QueryIntent): string {
  const { brand, query } = context;

  return `You are a knowledgeable advisor helping users make informed decisions.

When evaluating ${brand || 'options'}, consider:
1. Quality and reliability
2. Value for money
3. Customer reviews and reputation
4. Feature set and capabilities
5. Customer support quality
6. Long-term viability

Provide balanced, helpful recommendations based on the user's needs.`;
}

/**
 * Build intent-specific guidance
 */
function buildIntentGuidance(intent: QueryIntent): string {
  const guidance: Record<QueryIntent, string> = {
    comparison: `
--- Response Format ---
When comparing options:
- Create a clear side-by-side comparison
- Highlight key differentiators
- Recommend based on specific use cases
- Be objective about trade-offs`,

    recommendation: `
--- Response Format ---
When making recommendations:
- Lead with your top pick and why
- Provide 2-3 alternatives for different needs
- Explain the reasoning behind each recommendation
- Consider the user's specific context`,

    evaluation: `
--- Response Format ---
When evaluating:
- Address both strengths and weaknesses
- Use specific examples and data where available
- Compare to alternatives for context
- Provide an overall assessment`,

    research: `
--- Response Format ---
When explaining:
- Start with a clear, concise answer
- Provide relevant context and background
- Use examples to illustrate concepts
- Link to related topics when helpful`,

    discovery: `
--- Response Format ---
When helping discover options:
- Present a curated list of relevant options
- Organize by category or use case
- Include brief descriptions of each
- Suggest how to narrow down choices`,

    validation: `
--- Response Format ---
When validating claims:
- Be factual and evidence-based
- Cite sources or reasoning for conclusions
- Address potential concerns directly
- Recommend verification steps if needed`
  };

  return guidance[intent] || '';
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get all supported industries for prompt selection
 */
export function getSupportedIndustries(): string[] {
  return Object.keys(INDUSTRY_SIGNALS);
}

/**
 * Check if an industry is supported
 */
export function isIndustrySupported(industryId: string): boolean {
  return industryId in INDUSTRY_SIGNALS;
}

/**
 * Get industry signals for testing/debugging
 */
export function getIndustrySignals(industryId: string): { keywords: string[]; patterns: RegExp[] } | null {
  return INDUSTRY_SIGNALS[industryId] || null;
}

/**
 * Get all intent types
 */
export function getIntentTypes(): QueryIntent[] {
  return ['comparison', 'recommendation', 'evaluation', 'research', 'discovery', 'validation'];
}
