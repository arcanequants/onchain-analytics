/**
 * Perception Query Builder
 *
 * Phase 1, Week 1, Day 2
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5
 *
 * Builds and executes AI queries to measure brand perception.
 * Generates contextual queries based on industry and brand attributes.
 */

import { Result, Ok, Err } from '../result';
import { AppError, ValidationError, InternalError } from '../errors';
import { apiLogger } from '../logger';
import {
  PerceptionQuerySchema,
  type PerceptionQuery as PerceptionQueryResponse,
} from '../ai/schemas';
import {
  buildPrompt,
  getProviderParameters,
  type AIProvider,
  type PromptVariables,
} from '../ai/prompts';
import type { IndustryDetection } from '../ai/schemas';

// ================================================================
// QUERY TYPES
// ================================================================

/**
 * Types of perception queries we can generate
 */
export type QueryIntent =
  | 'recommendation'      // "What's the best X for Y?"
  | 'comparison'          // "X vs Y for Z use case"
  | 'evaluation'          // "Is X good for Y?"
  | 'alternatives'        // "Alternatives to X"
  | 'use_case'           // "Best X for [specific use case]"
  | 'ranking'            // "Top X in category Y"
  | 'review'             // "What do people say about X?"
  | 'feature';           // "Does X have feature Y?"

/**
 * Query priority for budget optimization
 */
export type QueryPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * A generated perception query
 */
export interface PerceptionQuery {
  /** Unique ID for this query */
  id: string;
  /** The natural language query to send to AI */
  query: string;
  /** Type of query */
  intent: QueryIntent;
  /** Priority for execution */
  priority: QueryPriority;
  /** Industry context */
  industry: string;
  /** Target brand being analyzed */
  targetBrand: string;
  /** Expected competitors that might be mentioned */
  expectedCompetitors: string[];
  /** Variables used to generate this query */
  variables: PromptVariables;
  /** Provider to use (optional, for A/B testing) */
  preferredProvider?: AIProvider;
}

/**
 * Result of executing a perception query
 */
export interface QueryResult {
  /** The query that was executed */
  query: PerceptionQuery;
  /** Provider that executed the query */
  provider: AIProvider;
  /** Raw response from AI */
  rawResponse: string;
  /** Parsed structured response */
  parsed: PerceptionQueryResponse;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Tokens used */
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  /** Cost estimate in USD */
  estimatedCostUsd: number;
  /** Whether response was from cache */
  cached: boolean;
}

// ================================================================
// QUERY TEMPLATES BY INDUSTRY
// ================================================================

/**
 * Industry-specific query templates
 */
export const QUERY_TEMPLATES: Record<string, Record<QueryIntent, string[]>> = {
  // Default templates for any industry
  default: {
    recommendation: [
      "What's the best {category} for {use_case}?",
      "What {category} would you recommend for {audience}?",
      "Which {category} should I use for {use_case}?",
    ],
    comparison: [
      "{brand} vs competitors for {use_case}",
      "How does {brand} compare to alternatives?",
      "Pros and cons of {brand} vs {competitor}",
    ],
    evaluation: [
      "Is {brand} good for {use_case}?",
      "Should I use {brand} for {audience}?",
      "What are the pros and cons of {brand}?",
    ],
    alternatives: [
      "What are the best alternatives to {brand}?",
      "Competitors to {brand} for {use_case}",
      "Similar products to {brand}",
    ],
    use_case: [
      "Best {category} for {specific_use_case}",
      "Which {category} is best for {specific_use_case}?",
      "{category} recommendations for {specific_use_case}",
    ],
    ranking: [
      "Top 5 {category} in {year}",
      "Best {category} ranked by {criterion}",
      "Leading {category} for {audience}",
    ],
    review: [
      "What do users say about {brand}?",
      "{brand} reviews and reputation",
      "Is {brand} reliable and trustworthy?",
    ],
    feature: [
      "Does {brand} have {feature}?",
      "{brand} features and capabilities",
      "What can {brand} do for {use_case}?",
    ],
  },

  // SaaS-specific templates
  saas: {
    recommendation: [
      "What's the best {category} software for {use_case}?",
      "Which SaaS tool would you recommend for {audience}?",
      "Best cloud-based {category} for {company_size} companies?",
    ],
    comparison: [
      "{brand} vs {competitor} - which is better for {use_case}?",
      "Comparing {brand} pricing and features to competitors",
      "{brand} or {competitor} for a {company_size} company?",
    ],
    evaluation: [
      "Is {brand} worth the price for {use_case}?",
      "How is {brand}'s customer support and reliability?",
      "Is {brand} secure and enterprise-ready?",
    ],
    alternatives: [
      "Free alternatives to {brand}",
      "Cheaper alternatives to {brand} with similar features",
      "Open source alternatives to {brand}",
    ],
    use_case: [
      "Best {category} for remote teams",
      "Best {category} for startups on a budget",
      "Enterprise-grade {category} for large organizations",
    ],
    ranking: [
      "Top {category} tools in {year}",
      "Best {category} software by G2 reviews",
      "Most innovative {category} platforms",
    ],
    review: [
      "{brand} G2 reviews summary",
      "What do developers think about {brand}?",
      "Common complaints about {brand}",
    ],
    feature: [
      "Does {brand} integrate with {integration}?",
      "{brand} API capabilities",
      "Does {brand} offer SSO and SOC 2 compliance?",
    ],
  },

  // Fintech-specific templates
  fintech: {
    recommendation: [
      "Best {category} for {use_case} in {country}?",
      "Which payment processor should I use for {business_type}?",
      "Recommended {category} for high-volume transactions?",
    ],
    comparison: [
      "{brand} fees compared to {competitor}",
      "{brand} vs {competitor} for international payments",
      "Which is safer: {brand} or {competitor}?",
    ],
    evaluation: [
      "Is {brand} secure for online payments?",
      "How reliable is {brand}'s fraud protection?",
      "Is {brand} compliant with PCI-DSS?",
    ],
    alternatives: [
      "Lower fee alternatives to {brand}",
      "{brand} alternatives for {country} businesses",
      "Fintech alternatives to traditional {category}",
    ],
    use_case: [
      "Best {category} for subscription businesses",
      "Best {category} for marketplace platforms",
      "Best {category} for international e-commerce",
    ],
    ranking: [
      "Top payment gateways in {year}",
      "Best-rated neobanks for businesses",
      "Fastest growing fintech companies",
    ],
    review: [
      "{brand} merchant reviews",
      "Is {brand} trustworthy?",
      "Customer service quality at {brand}",
    ],
    feature: [
      "Does {brand} support {payment_method}?",
      "{brand} developer API documentation quality",
      "Does {brand} offer instant payouts?",
    ],
  },

  // E-commerce-specific templates
  ecommerce: {
    recommendation: [
      "Best e-commerce platform for {business_type}?",
      "Which online store builder is best for {use_case}?",
      "Recommended {category} for selling {product_type}?",
    ],
    comparison: [
      "{brand} vs {competitor} for online stores",
      "Shopify vs {brand} - which is better?",
      "{brand} pricing compared to alternatives",
    ],
    evaluation: [
      "Is {brand} good for dropshipping?",
      "Can {brand} handle high traffic sales events?",
      "How is {brand}'s SEO for product pages?",
    ],
    alternatives: [
      "Shopify alternatives for small businesses",
      "Free e-commerce platforms like {brand}",
      "WooCommerce vs {brand}",
    ],
    use_case: [
      "Best platform for selling digital products",
      "Best e-commerce for fashion brands",
      "Best marketplace for handmade products",
    ],
    ranking: [
      "Top e-commerce platforms in {year}",
      "Best-rated online store builders",
      "Fastest e-commerce platforms by performance",
    ],
    review: [
      "{brand} seller reviews",
      "Common issues with {brand}",
      "Is {brand} easy to use for beginners?",
    ],
    feature: [
      "Does {brand} support multi-currency?",
      "{brand} shipping integration options",
      "Does {brand} have built-in email marketing?",
    ],
  },

  // Healthcare/Healthtech templates
  healthtech: {
    recommendation: [
      "Best telemedicine platform for {use_case}?",
      "Which EHR system is best for {practice_type}?",
      "Recommended health app for {condition}?",
    ],
    comparison: [
      "{brand} vs {competitor} for medical practices",
      "Comparing telehealth platforms: {brand} and others",
      "{brand} compliance vs competitors",
    ],
    evaluation: [
      "Is {brand} HIPAA compliant?",
      "How secure is {brand} for patient data?",
      "Is {brand} accepted by insurance providers?",
    ],
    alternatives: [
      "HIPAA-compliant alternatives to {brand}",
      "Affordable telemedicine alternatives",
      "EHR systems similar to {brand}",
    ],
    use_case: [
      "Best telehealth for mental health therapy",
      "Best patient portal for small clinics",
      "Best health tracking for chronic conditions",
    ],
    ranking: [
      "Top telemedicine platforms in {year}",
      "Best-rated EHR systems for hospitals",
      "Most innovative healthtech startups",
    ],
    review: [
      "Patient reviews of {brand}",
      "Healthcare provider opinions on {brand}",
      "Is {brand} reliable for medical consultations?",
    ],
    feature: [
      "Does {brand} integrate with Epic or Cerner?",
      "{brand} prescription capabilities",
      "Does {brand} offer lab test ordering?",
    ],
  },

  // Marketing-specific templates
  marketing: {
    recommendation: [
      "Best {category} tool for {use_case}?",
      "Which marketing automation platform is best?",
      "Recommended SEO tools for {business_type}?",
    ],
    comparison: [
      "{brand} vs {competitor} for email marketing",
      "HubSpot vs {brand} for marketing automation",
      "{brand} ROI compared to alternatives",
    ],
    evaluation: [
      "Is {brand} worth it for small businesses?",
      "How effective is {brand} for lead generation?",
      "Does {brand} deliver on its promises?",
    ],
    alternatives: [
      "Free alternatives to {brand}",
      "All-in-one marketing platforms like {brand}",
      "Agency alternatives to {brand}",
    ],
    use_case: [
      "Best marketing tools for content creators",
      "Best email platform for e-commerce",
      "Best analytics for B2B marketing",
    ],
    ranking: [
      "Top marketing tools in {year}",
      "Best marketing automation platforms ranked",
      "Most recommended SEO tools",
    ],
    review: [
      "{brand} marketing results and case studies",
      "What marketers say about {brand}",
      "Is {brand} overhyped?",
    ],
    feature: [
      "Does {brand} have A/B testing?",
      "{brand} CRM integration capabilities",
      "Does {brand} offer attribution modeling?",
    ],
  },
};

// ================================================================
// USE CASES BY INDUSTRY
// ================================================================

/**
 * Common use cases by industry for query generation
 */
export const INDUSTRY_USE_CASES: Record<string, string[]> = {
  saas: [
    'small businesses',
    'enterprise companies',
    'remote teams',
    'startups',
    'agencies',
    'developers',
    'non-technical users',
    'project management',
    'customer support',
    'sales teams',
  ],
  fintech: [
    'online payments',
    'subscription billing',
    'marketplace payouts',
    'international transfers',
    'fraud prevention',
    'small business banking',
    'invoice management',
    'expense tracking',
    'payroll processing',
    'crypto transactions',
  ],
  ecommerce: [
    'dropshipping',
    'print on demand',
    'subscription boxes',
    'digital products',
    'B2B wholesale',
    'fashion retail',
    'food delivery',
    'multi-channel selling',
    'marketplace integration',
    'inventory management',
  ],
  healthtech: [
    'patient appointments',
    'telemedicine visits',
    'prescription management',
    'mental health therapy',
    'chronic condition monitoring',
    'fitness tracking',
    'medical billing',
    'clinical trials',
    'health records',
    'insurance claims',
  ],
  marketing: [
    'email campaigns',
    'social media management',
    'SEO optimization',
    'content creation',
    'lead generation',
    'marketing analytics',
    'brand awareness',
    'conversion optimization',
    'influencer marketing',
    'PPC advertising',
  ],
  default: [
    'small businesses',
    'enterprise',
    'beginners',
    'professionals',
    'teams',
    'individuals',
    'growing companies',
    'cost-conscious buyers',
    'quality-focused buyers',
    'tech-savvy users',
  ],
};

// ================================================================
// QUERY BUILDER
// ================================================================

/**
 * Options for generating perception queries
 */
export interface QueryGeneratorOptions {
  /** Number of queries to generate per intent */
  queriesPerIntent?: number;
  /** Which intents to include */
  intents?: QueryIntent[];
  /** Minimum priority to include */
  minPriority?: QueryPriority;
  /** Known competitors to include in queries */
  competitors?: string[];
  /** Country context (ISO 3166-1 alpha-2) */
  country?: string;
  /** Year for temporal queries */
  year?: number;
  /** Custom use cases to include */
  customUseCases?: string[];
}

const DEFAULT_OPTIONS: Required<QueryGeneratorOptions> = {
  queriesPerIntent: 2,
  intents: ['recommendation', 'comparison', 'evaluation', 'alternatives'],
  minPriority: 'medium',
  competitors: [],
  country: 'US',
  year: new Date().getFullYear(),
  customUseCases: [],
};

/**
 * Priority weights for different intents
 */
const INTENT_PRIORITIES: Record<QueryIntent, QueryPriority> = {
  recommendation: 'critical',  // Core perception signal
  comparison: 'high',         // Direct competitive intel
  evaluation: 'high',         // Quality perception
  alternatives: 'medium',      // Competitive landscape
  use_case: 'medium',         // Specific fit signals
  ranking: 'medium',          // Market position
  review: 'low',              // Sentiment check
  feature: 'low',             // Feature awareness
};

/**
 * Generate a unique query ID
 */
function generateQueryId(): string {
  return `pq_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Get templates for an industry, falling back to defaults
 */
function getIndustryTemplates(industry: string): Record<QueryIntent, string[]> {
  const templates = QUERY_TEMPLATES[industry] || QUERY_TEMPLATES.default;

  // Merge with default to ensure all intents are covered
  const merged: Record<QueryIntent, string[]> = { ...QUERY_TEMPLATES.default };
  for (const [intent, intentTemplates] of Object.entries(templates)) {
    merged[intent as QueryIntent] = intentTemplates;
  }

  return merged;
}

/**
 * Get use cases for an industry
 */
function getIndustryUseCases(industry: string): string[] {
  return INDUSTRY_USE_CASES[industry] || INDUSTRY_USE_CASES.default;
}

/**
 * Interpolate a query template with variables
 */
function interpolateQuery(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Derive category from industry
 */
function getCategoryForIndustry(industry: string): string {
  const categoryMap: Record<string, string> = {
    saas: 'software',
    fintech: 'fintech solution',
    ecommerce: 'e-commerce platform',
    healthtech: 'healthcare platform',
    marketing: 'marketing tool',
    edtech: 'learning platform',
    media: 'media platform',
    'real-estate': 'real estate platform',
    travel: 'travel service',
    'professional-services': 'professional service',
  };
  return categoryMap[industry] || 'solution';
}

/**
 * Generate perception queries for a brand
 */
export function generateQueries(
  brandName: string,
  industryDetection: IndustryDetection,
  options: QueryGeneratorOptions = {}
): PerceptionQuery[] {
  const timer = apiLogger.time('perception-query.generate');

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { industry, competitors: detectedCompetitors } = industryDetection;

  const templates = getIndustryTemplates(industry);
  const useCases = [
    ...getIndustryUseCases(industry),
    ...opts.customUseCases,
  ];
  const competitors = [
    ...new Set([...detectedCompetitors, ...opts.competitors]),
  ].slice(0, 5);

  const queries: PerceptionQuery[] = [];
  const category = getCategoryForIndustry(industry);

  // Generate queries for each intent
  for (const intent of opts.intents) {
    const intentPriority = INTENT_PRIORITIES[intent];

    // Skip if below minimum priority
    if (shouldSkipPriority(intentPriority, opts.minPriority)) {
      continue;
    }

    const intentTemplates = templates[intent] || [];

    // Generate multiple queries per intent
    for (let i = 0; i < Math.min(opts.queriesPerIntent, intentTemplates.length); i++) {
      const template = intentTemplates[i];
      const useCase = useCases[i % useCases.length];
      const competitor = competitors[i % Math.max(competitors.length, 1)] || 'competitors';

      const variables: Record<string, string> = {
        brand: brandName,
        category,
        use_case: useCase,
        specific_use_case: useCase,
        audience: useCase,
        competitor,
        year: opts.year.toString(),
        country: opts.country,
        company_size: 'mid-sized',
        business_type: 'online business',
      };

      const queryText = interpolateQuery(template, variables);

      queries.push({
        id: generateQueryId(),
        query: queryText,
        intent,
        priority: intentPriority,
        industry,
        targetBrand: brandName,
        expectedCompetitors: competitors,
        variables: {
          brand: brandName,
          industry,
          query: queryText,
        },
      });
    }
  }

  timer.success({ queryCount: queries.length, industry });
  return queries;
}

/**
 * Check if a priority should be skipped
 */
function shouldSkipPriority(priority: QueryPriority, minPriority: QueryPriority): boolean {
  const priorityOrder: QueryPriority[] = ['critical', 'high', 'medium', 'low'];
  const priorityIndex = priorityOrder.indexOf(priority);
  const minIndex = priorityOrder.indexOf(minPriority);
  return priorityIndex > minIndex;
}

/**
 * Sort queries by priority and type for optimal execution
 */
export function sortQueriesByPriority(queries: PerceptionQuery[]): PerceptionQuery[] {
  const priorityOrder: QueryPriority[] = ['critical', 'high', 'medium', 'low'];

  return [...queries].sort((a, b) => {
    const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    // Secondary sort by intent type
    const intentOrder: QueryIntent[] = [
      'recommendation', 'comparison', 'evaluation', 'alternatives',
      'use_case', 'ranking', 'review', 'feature',
    ];
    return intentOrder.indexOf(a.intent) - intentOrder.indexOf(b.intent);
  });
}

/**
 * Filter queries by budget (limit count)
 */
export function filterByBudget(
  queries: PerceptionQuery[],
  maxQueries: number
): PerceptionQuery[] {
  // Sort by priority first
  const sorted = sortQueriesByPriority(queries);
  return sorted.slice(0, maxQueries);
}

/**
 * Build the full prompt for a perception query
 */
export function buildQueryPrompt(
  query: PerceptionQuery,
  options?: {
    includeCoT?: boolean;
    includeFewShot?: boolean;
  }
): string {
  return buildPrompt('perception_query', query.variables, options);
}

/**
 * Get recommended parameters for executing a query
 */
export function getQueryParameters(
  query: PerceptionQuery,
  provider: AIProvider
) {
  return getProviderParameters('perception_query', provider);
}

// ================================================================
// RESULT PARSING
// ================================================================

/**
 * Parse an AI response into a structured PerceptionQueryResponse
 */
export function parseQueryResponse(
  rawResponse: string,
  query: PerceptionQuery
): Result<PerceptionQueryResponse, AppError> {
  try {
    // Check if brand is mentioned in response
    const brandMentioned = rawResponse.toLowerCase().includes(query.targetBrand.toLowerCase());

    // Find position in response (simple heuristic)
    let mentionPosition: number | null = null;
    if (brandMentioned) {
      // Look for numbered list patterns
      const listPatterns = [
        new RegExp(`1[.\\)].*${query.targetBrand}`, 'i'),
        new RegExp(`2[.\\)].*${query.targetBrand}`, 'i'),
        new RegExp(`3[.\\)].*${query.targetBrand}`, 'i'),
        new RegExp(`4[.\\)].*${query.targetBrand}`, 'i'),
        new RegExp(`5[.\\)].*${query.targetBrand}`, 'i'),
      ];

      for (let i = 0; i < listPatterns.length; i++) {
        if (listPatterns[i].test(rawResponse)) {
          mentionPosition = i + 1;
          break;
        }
      }

      // If not in numbered list, check for bold/highlighted patterns
      if (mentionPosition === null) {
        const boldPattern = new RegExp(`\\*\\*${query.targetBrand}\\*\\*`, 'i');
        if (boldPattern.test(rawResponse)) {
          mentionPosition = 1; // Featured position
        }
      }
    }

    // Count total brand mentions in response
    const totalMentions = countBrandMentions(rawResponse);

    // Extract mention context
    const mentionContext = brandMentioned
      ? extractMentionContext(rawResponse, query.targetBrand)
      : null;

    // Detect sentiment
    const sentiment = brandMentioned
      ? detectSentiment(rawResponse, query.targetBrand)
      : null;

    // Extract attributes mentioned
    const attributesMentioned = extractAttributes(rawResponse, query.targetBrand);

    // Find competitors mentioned
    const competitorsMentioned = findCompetitorMentions(
      rawResponse,
      query.expectedCompetitors
    );

    const result: PerceptionQueryResponse = {
      brandMentioned,
      mentionPosition,
      totalMentions,
      mentionContext,
      sentiment,
      attributesMentioned,
      competitorsMentioned,
      query: query.query,
      industryContext: query.industry,
      confidence: brandMentioned ? 0.8 : 0.9, // Higher confidence when clear result
    };

    // Validate against schema
    const validated = PerceptionQuerySchema.parse(result);
    return Ok(validated);
  } catch (error) {
    return Err(
      new InternalError(
        `Failed to parse query response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

/**
 * Count unique brand mentions in text
 */
function countBrandMentions(text: string): number {
  // Common brand patterns - capitalized words, proper nouns
  const brandPattern = /\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?\b/g;
  const matches = text.match(brandPattern) || [];
  return new Set(matches).size;
}

/**
 * Extract context around a brand mention
 */
function extractMentionContext(text: string, brand: string): string {
  const brandIndex = text.toLowerCase().indexOf(brand.toLowerCase());
  if (brandIndex === -1) return '';

  const start = Math.max(0, brandIndex - 100);
  const end = Math.min(text.length, brandIndex + brand.length + 100);

  let context = text.slice(start, end);

  // Clean up partial words at edges
  if (start > 0) {
    context = '...' + context.slice(context.indexOf(' ') + 1);
  }
  if (end < text.length) {
    context = context.slice(0, context.lastIndexOf(' ')) + '...';
  }

  return context.trim();
}

/**
 * Detect sentiment of brand mention
 */
function detectSentiment(
  text: string,
  brand: string
): 'positive' | 'neutral' | 'negative' {
  const context = extractMentionContext(text, brand).toLowerCase();

  const positiveWords = [
    'best', 'excellent', 'great', 'recommend', 'top', 'leading',
    'powerful', 'amazing', 'fantastic', 'superior', 'outstanding',
    'ideal', 'perfect', 'popular', 'trusted', 'reliable',
  ];

  const negativeWords = [
    'avoid', 'bad', 'poor', 'expensive', 'difficult', 'complex',
    'limited', 'lacking', 'worse', 'disappointing', 'overpriced',
    'outdated', 'unreliable', 'problems', 'issues', 'complaints',
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  for (const word of positiveWords) {
    if (context.includes(word)) positiveScore++;
  }

  for (const word of negativeWords) {
    if (context.includes(word)) negativeScore++;
  }

  if (positiveScore > negativeScore) return 'positive';
  if (negativeScore > positiveScore) return 'negative';
  return 'neutral';
}

/**
 * Extract attributes mentioned with a brand
 */
function extractAttributes(text: string, brand: string): string[] {
  const context = extractMentionContext(text, brand).toLowerCase();
  const attributes: string[] = [];

  const attributePatterns = [
    { pattern: /easy to use/i, attr: 'ease of use' },
    { pattern: /user[- ]friendly/i, attr: 'user-friendly' },
    { pattern: /affordable|cheap|free/i, attr: 'pricing' },
    { pattern: /fast|quick|speedy/i, attr: 'speed' },
    { pattern: /reliable|stable/i, attr: 'reliability' },
    { pattern: /secure|security/i, attr: 'security' },
    { pattern: /support|customer service/i, attr: 'customer support' },
    { pattern: /integrat/i, attr: 'integrations' },
    { pattern: /featur/i, attr: 'features' },
    { pattern: /api|developer/i, attr: 'developer experience' },
    { pattern: /scalab/i, attr: 'scalability' },
    { pattern: /customiz/i, attr: 'customization' },
  ];

  for (const { pattern, attr } of attributePatterns) {
    if (pattern.test(context)) {
      attributes.push(attr);
    }
  }

  return [...new Set(attributes)];
}

/**
 * Find which competitors are mentioned
 */
function findCompetitorMentions(
  text: string,
  expectedCompetitors: string[]
): string[] {
  const textLower = text.toLowerCase();
  return expectedCompetitors.filter(
    comp => textLower.includes(comp.toLowerCase())
  );
}

// ================================================================
// AGGREGATE RESULTS
// ================================================================

/**
 * Aggregate multiple query results into an overall perception
 */
export interface AggregatedPerception {
  /** Overall visibility score (0-100) */
  visibilityScore: number;
  /** Mention rate across queries (0-1) */
  mentionRate: number;
  /** Average position when mentioned */
  averagePosition: number | null;
  /** Overall sentiment */
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  /** Most common attributes mentioned */
  topAttributes: string[];
  /** Competitors most frequently mentioned together */
  topCompetitors: string[];
  /** Confidence in this aggregation */
  confidence: number;
  /** Number of queries included */
  queriesAnalyzed: number;
  /** Breakdown by query intent */
  intentBreakdown: Record<QueryIntent, {
    count: number;
    mentionRate: number;
    avgPosition: number | null;
  }>;
}

/**
 * Aggregate multiple perception query results
 */
export function aggregateResults(
  results: QueryResult[]
): Result<AggregatedPerception, AppError> {
  if (results.length === 0) {
    return Err(new ValidationError('No results to aggregate'));
  }

  const timer = apiLogger.time('perception-query.aggregate');

  // Calculate mention rate
  const mentionedCount = results.filter(r => r.parsed.brandMentioned).length;
  const mentionRate = mentionedCount / results.length;

  // Calculate average position
  const positionedResults = results.filter(
    r => r.parsed.mentionPosition !== null
  );
  const averagePosition = positionedResults.length > 0
    ? positionedResults.reduce(
        (sum, r) => sum + (r.parsed.mentionPosition || 0),
        0
      ) / positionedResults.length
    : null;

  // Aggregate sentiments
  const sentiments = results
    .filter(r => r.parsed.sentiment !== null)
    .map(r => r.parsed.sentiment as string);

  const sentimentCounts: Record<string, number> = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  for (const sentiment of sentiments) {
    sentimentCounts[sentiment]++;
  }

  let overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  if (sentiments.length === 0) {
    overallSentiment = 'neutral';
  } else if (sentimentCounts.positive > sentimentCounts.negative * 2) {
    overallSentiment = 'positive';
  } else if (sentimentCounts.negative > sentimentCounts.positive * 2) {
    overallSentiment = 'negative';
  } else if (sentimentCounts.positive > 0 && sentimentCounts.negative > 0) {
    overallSentiment = 'mixed';
  } else {
    overallSentiment = 'neutral';
  }

  // Aggregate attributes
  const allAttributes = results.flatMap(r => r.parsed.attributesMentioned);
  const attributeCounts = new Map<string, number>();
  for (const attr of allAttributes) {
    attributeCounts.set(attr, (attributeCounts.get(attr) || 0) + 1);
  }
  const topAttributes = [...attributeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([attr]) => attr);

  // Aggregate competitors
  const allCompetitors = results.flatMap(r => r.parsed.competitorsMentioned);
  const competitorCounts = new Map<string, number>();
  for (const comp of allCompetitors) {
    competitorCounts.set(comp, (competitorCounts.get(comp) || 0) + 1);
  }
  const topCompetitors = [...competitorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([comp]) => comp);

  // Calculate visibility score (0-100)
  const visibilityScore = calculateVisibilityScore(
    mentionRate,
    averagePosition,
    overallSentiment
  );

  // Calculate confidence
  const confidence = Math.min(0.95, 0.5 + (results.length * 0.05));

  // Breakdown by intent
  const intentBreakdown: Record<QueryIntent, { count: number; mentionRate: number; avgPosition: number | null }> = {} as any;

  const intentGroups = new Map<QueryIntent, QueryResult[]>();
  for (const result of results) {
    const intent = result.query.intent;
    if (!intentGroups.has(intent)) {
      intentGroups.set(intent, []);
    }
    intentGroups.get(intent)!.push(result);
  }

  for (const [intent, group] of intentGroups) {
    const mentioned = group.filter(r => r.parsed.brandMentioned);
    const positioned = group.filter(r => r.parsed.mentionPosition !== null);

    intentBreakdown[intent] = {
      count: group.length,
      mentionRate: mentioned.length / group.length,
      avgPosition: positioned.length > 0
        ? positioned.reduce((sum, r) => sum + (r.parsed.mentionPosition || 0), 0) / positioned.length
        : null,
    };
  }

  const aggregation: AggregatedPerception = {
    visibilityScore,
    mentionRate,
    averagePosition,
    overallSentiment,
    topAttributes,
    topCompetitors,
    confidence,
    queriesAnalyzed: results.length,
    intentBreakdown,
  };

  timer.success({ visibilityScore, mentionRate });
  return Ok(aggregation);
}

/**
 * Calculate visibility score from perception metrics
 */
function calculateVisibilityScore(
  mentionRate: number,
  averagePosition: number | null,
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed'
): number {
  // Base score from mention rate (0-60 points)
  let score = mentionRate * 60;

  // Position bonus (0-25 points)
  if (averagePosition !== null) {
    // Top position = 25 points, decreases by 5 per position
    const positionScore = Math.max(0, 25 - (averagePosition - 1) * 5);
    score += positionScore;
  } else if (mentionRate > 0) {
    // Mentioned but no clear position = 10 points
    score += 10;
  }

  // Sentiment modifier (0-15 points)
  const sentimentModifiers: Record<string, number> = {
    positive: 15,
    neutral: 10,
    mixed: 5,
    negative: 0,
  };
  score += sentimentModifiers[sentiment] || 0;

  return Math.round(Math.min(100, Math.max(0, score)));
}

// ================================================================
// EXPORTS
// ================================================================

export type { PerceptionQueryResponse };

export default {
  // Query generation
  generateQueries,
  sortQueriesByPriority,
  filterByBudget,

  // Prompt building
  buildQueryPrompt,
  getQueryParameters,

  // Result processing
  parseQueryResponse,
  aggregateResults,

  // Templates
  QUERY_TEMPLATES,
  INDUSTRY_USE_CASES,
};
