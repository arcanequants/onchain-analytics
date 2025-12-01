/**
 * Industry Detection Service
 *
 * Phase 1, Week 1, Day 2
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5
 *
 * Uses AI to classify brands into industry categories based on
 * URL metadata and content analysis.
 */

import { z } from 'zod';
import { Result, Ok, Err } from '../result';
import { AppError, ValidationError, AIProviderError, InternalError } from '../errors';
import { apiLogger } from '../logger';
import {
  IndustryDetectionSchema,
  type IndustryDetection,
  type EntityType,
} from '../ai/schemas';
import { UrlAnalysisResult } from '../url-analyzer';

// ================================================================
// INDUSTRY TAXONOMY
// ================================================================

/**
 * Industry category definition
 */
export interface IndustryCategory {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
  parentSlug?: string;
  subIndustries?: string[];
}

/**
 * Complete industry taxonomy for classification
 * Based on standard industry classifications adapted for AI visibility analysis
 */
export const INDUSTRY_TAXONOMY: readonly IndustryCategory[] = [
  // Technology
  {
    slug: 'saas',
    name: 'SaaS & Cloud Software',
    description: 'Software as a Service and cloud-based applications',
    keywords: ['software', 'cloud', 'saas', 'platform', 'api', 'subscription', 'b2b', 'enterprise software'],
    subIndustries: ['crm', 'erp', 'hr-tech', 'martech', 'devtools', 'cybersecurity', 'analytics'],
  },
  {
    slug: 'fintech',
    name: 'Fintech & Financial Services',
    description: 'Financial technology and digital banking',
    keywords: ['finance', 'banking', 'payments', 'fintech', 'crypto', 'blockchain', 'trading', 'investment'],
    subIndustries: ['payments', 'lending', 'insurtech', 'wealthtech', 'crypto', 'neobank'],
  },
  {
    slug: 'healthtech',
    name: 'Healthcare & Healthtech',
    description: 'Healthcare technology and medical services',
    keywords: ['health', 'medical', 'healthcare', 'telemedicine', 'pharma', 'wellness', 'fitness', 'mental health'],
    subIndustries: ['telemedicine', 'pharma', 'medtech', 'wellness', 'mental-health', 'biotech'],
  },
  {
    slug: 'ecommerce',
    name: 'E-commerce & Retail',
    description: 'Online retail and e-commerce platforms',
    keywords: ['ecommerce', 'retail', 'shopping', 'store', 'marketplace', 'commerce', 'shop', 'buy'],
    subIndustries: ['marketplace', 'dtc', 'b2b-commerce', 'fashion', 'electronics', 'food-delivery'],
  },
  {
    slug: 'edtech',
    name: 'Education & Edtech',
    description: 'Educational technology and learning platforms',
    keywords: ['education', 'learning', 'courses', 'training', 'edtech', 'school', 'university', 'e-learning'],
    subIndustries: ['k12', 'higher-ed', 'corporate-training', 'language-learning', 'upskilling'],
  },
  {
    slug: 'media',
    name: 'Media & Entertainment',
    description: 'Media, entertainment, and content creation',
    keywords: ['media', 'entertainment', 'content', 'streaming', 'news', 'publishing', 'video', 'podcast'],
    subIndustries: ['streaming', 'gaming', 'publishing', 'podcasts', 'music', 'news'],
  },
  {
    slug: 'marketing',
    name: 'Marketing & Advertising',
    description: 'Marketing technology and advertising services',
    keywords: ['marketing', 'advertising', 'agency', 'seo', 'social media', 'branding', 'pr', 'content marketing'],
    subIndustries: ['digital-marketing', 'ad-tech', 'influencer', 'pr-agency', 'seo-agency', 'creative-agency'],
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    description: 'Consulting, legal, and professional services',
    keywords: ['consulting', 'legal', 'accounting', 'advisory', 'professional', 'law firm', 'cpa'],
    subIndustries: ['consulting', 'legal', 'accounting', 'hr-services', 'management-consulting'],
  },
  {
    slug: 'real-estate',
    name: 'Real Estate & Property',
    description: 'Real estate and property technology',
    keywords: ['real estate', 'property', 'proptech', 'housing', 'mortgage', 'rental', 'commercial real estate'],
    subIndustries: ['proptech', 'commercial', 'residential', 'property-management', 'construction'],
  },
  {
    slug: 'travel',
    name: 'Travel & Hospitality',
    description: 'Travel, hospitality, and tourism',
    keywords: ['travel', 'hotel', 'hospitality', 'tourism', 'booking', 'vacation', 'airline', 'restaurant'],
    subIndustries: ['hotels', 'airlines', 'experiences', 'restaurants', 'travel-tech'],
  },
  {
    slug: 'manufacturing',
    name: 'Manufacturing & Industrial',
    description: 'Manufacturing and industrial technology',
    keywords: ['manufacturing', 'industrial', 'supply chain', 'logistics', 'factory', 'b2b', 'industrial'],
    subIndustries: ['industrial-iot', 'supply-chain', 'logistics', 'automation', 'machinery'],
  },
  {
    slug: 'automotive',
    name: 'Automotive & Mobility',
    description: 'Automotive and mobility technology',
    keywords: ['automotive', 'car', 'vehicle', 'ev', 'electric vehicle', 'mobility', 'transportation'],
    subIndustries: ['ev', 'autonomous', 'car-sharing', 'auto-parts', 'dealerships'],
  },
  {
    slug: 'energy',
    name: 'Energy & Cleantech',
    description: 'Energy, utilities, and clean technology',
    keywords: ['energy', 'solar', 'renewable', 'cleantech', 'sustainability', 'utilities', 'oil', 'gas'],
    subIndustries: ['solar', 'wind', 'oil-gas', 'utilities', 'energy-storage', 'sustainability'],
  },
  {
    slug: 'food-beverage',
    name: 'Food & Beverage',
    description: 'Food, beverage, and consumer packaged goods',
    keywords: ['food', 'beverage', 'restaurant', 'cpg', 'grocery', 'drink', 'snack', 'organic'],
    subIndustries: ['restaurants', 'cpg', 'grocery', 'beverages', 'food-tech'],
  },
  {
    slug: 'nonprofit',
    name: 'Nonprofit & NGO',
    description: 'Nonprofit organizations and NGOs',
    keywords: ['nonprofit', 'charity', 'ngo', 'foundation', 'social impact', 'donate', 'volunteer'],
    subIndustries: ['charity', 'foundation', 'social-enterprise', 'environmental'],
  },
  {
    slug: 'government',
    name: 'Government & Public Sector',
    description: 'Government and public sector organizations',
    keywords: ['government', 'public', 'municipal', 'federal', 'state', 'civic', 'public sector'],
    subIndustries: ['federal', 'state-local', 'civic-tech', 'defense'],
  },
  {
    slug: 'telecom',
    name: 'Telecommunications',
    description: 'Telecommunications and connectivity',
    keywords: ['telecom', 'telecommunications', '5g', 'mobile', 'wireless', 'internet', 'isp', 'carrier'],
    subIndustries: ['mobile', 'isp', 'infrastructure', '5g'],
  },
  {
    slug: 'agriculture',
    name: 'Agriculture & AgTech',
    description: 'Agriculture and agricultural technology',
    keywords: ['agriculture', 'farming', 'agtech', 'crop', 'livestock', 'farm', 'agricultural'],
    subIndustries: ['agtech', 'farming', 'agri-fintech', 'precision-ag'],
  },
  {
    slug: 'beauty',
    name: 'Beauty & Personal Care',
    description: 'Beauty, cosmetics, and personal care',
    keywords: ['beauty', 'cosmetics', 'skincare', 'makeup', 'personal care', 'haircare', 'fragrance'],
    subIndustries: ['skincare', 'makeup', 'haircare', 'fragrance', 'wellness'],
  },
  {
    slug: 'sports',
    name: 'Sports & Fitness',
    description: 'Sports, fitness, and athletic brands',
    keywords: ['sports', 'fitness', 'athletic', 'gym', 'workout', 'training', 'equipment', 'apparel'],
    subIndustries: ['fitness', 'sports-tech', 'equipment', 'apparel', 'leagues'],
  },
] as const;

/**
 * Get industry by slug
 */
export function getIndustryBySlug(slug: string): IndustryCategory | undefined {
  return INDUSTRY_TAXONOMY.find(i => i.slug === slug);
}

/**
 * Get all industry slugs
 */
export function getAllIndustrySlugs(): string[] {
  return INDUSTRY_TAXONOMY.map(i => i.slug);
}

/**
 * Get industries as options for select
 */
export function getIndustryOptions(): Array<{ value: string; label: string }> {
  return INDUSTRY_TAXONOMY.map(i => ({
    value: i.slug,
    label: i.name,
  }));
}

// ================================================================
// DETECTION INPUT
// ================================================================

/**
 * Input for industry detection
 */
export interface IndustryDetectionInput {
  /** URL that was analyzed */
  url: string;
  /** Extracted brand name */
  brandName: string;
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Open Graph data */
  ogDescription?: string;
  ogType?: string;
  /** Schema.org organization type */
  schemaOrgType?: string;
  /** Schema.org industry */
  schemaOrgIndustry?: string;
  /** Main content keywords (from page) */
  contentKeywords?: string[];
  /** User-provided industry hint */
  userHint?: string;
}

/**
 * Create detection input from URL analysis result
 */
export function createDetectionInput(analysis: UrlAnalysisResult): IndustryDetectionInput {
  const { metadata } = analysis;
  return {
    url: metadata.url,
    brandName: metadata.brandName || 'Unknown',
    title: metadata.title,
    description: metadata.description,
    ogDescription: metadata.openGraph.description,
    ogType: metadata.openGraph.type,
    schemaOrgType: metadata.schemaOrg.types?.[0] || undefined,
    schemaOrgIndustry: undefined, // SchemaOrgData doesn't have industry field
  };
}

// ================================================================
// HEURISTIC DETECTION
// ================================================================

/**
 * Heuristic industry detection based on keywords
 * Used as fallback when AI is not available or for cost savings
 */
export function detectIndustryHeuristic(input: IndustryDetectionInput): IndustryDetection {
  const timer = apiLogger.time('industry-detector.heuristic');

  // Combine all text for keyword matching
  const textToAnalyze = [
    input.brandName,
    input.title,
    input.description,
    input.ogDescription,
    input.schemaOrgIndustry,
    input.schemaOrgType,
    ...(input.contentKeywords || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Score each industry based on keyword matches
  const scores: Array<{ industry: IndustryCategory; score: number; matches: string[] }> = [];

  for (const industry of INDUSTRY_TAXONOMY) {
    let score = 0;
    const matches: string[] = [];

    for (const keyword of industry.keywords) {
      const keywordLower = keyword.toLowerCase();
      if (textToAnalyze.includes(keywordLower)) {
        score += keywordLower.length; // Longer keywords = more specific
        matches.push(keyword);
      }
    }

    // Boost if user provided hint matches
    if (input.userHint && industry.slug === input.userHint.toLowerCase()) {
      score += 100;
      matches.push('user_hint');
    }

    // Boost for Schema.org industry match
    if (input.schemaOrgIndustry) {
      const schemaLower = input.schemaOrgIndustry.toLowerCase();
      if (industry.keywords.some(k => schemaLower.includes(k.toLowerCase()))) {
        score += 50;
        matches.push('schema_org');
      }
    }

    if (score > 0) {
      scores.push({ industry, score, matches });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Default to generic business if no match
  const topMatch = scores[0];

  // Detect entity type
  const entityType = detectEntityType(input);

  // Detect country from URL
  const country = detectCountryFromUrl(input.url);

  // Extract potential competitors from content
  const competitors = extractPotentialCompetitors(textToAnalyze, input.brandName);

  const result: IndustryDetection = {
    industry: topMatch?.industry.slug || 'professional-services',
    subIndustry: topMatch?.industry.subIndustries?.[0] || null,
    country,
    entityType,
    competitors: competitors.slice(0, 5),
    confidence: calculateConfidence(topMatch?.score || 0, topMatch?.matches.length || 0),
    reasoning: topMatch
      ? `Matched keywords: ${topMatch.matches.join(', ')}`
      : 'No strong keyword matches found, defaulted to professional services',
  };

  timer.success({ industry: result.industry, confidence: result.confidence });
  return result;
}

/**
 * Detect entity type from metadata
 */
function detectEntityType(input: IndustryDetectionInput): EntityType {
  const text = [input.title, input.description, input.ogType, input.schemaOrgType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (input.schemaOrgType) {
    const schemaType = input.schemaOrgType.toLowerCase();
    if (schemaType.includes('organization') || schemaType.includes('corporation')) {
      return 'business';
    }
    if (schemaType.includes('person')) {
      return 'personal';
    }
    if (schemaType.includes('product')) {
      return 'product';
    }
    if (schemaType.includes('service')) {
      return 'service';
    }
  }

  // Check for personal indicators
  const personalIndicators = ['blog', 'portfolio', 'personal', 'resume', 'cv', 'about me'];
  if (personalIndicators.some(i => text.includes(i))) {
    return 'personal';
  }

  // Check for product indicators
  const productIndicators = ['buy', 'price', 'cart', 'shop', 'order', 'product'];
  const productCount = productIndicators.filter(i => text.includes(i)).length;
  if (productCount >= 2) {
    return 'product';
  }

  // Check for service indicators
  const serviceIndicators = ['service', 'consulting', 'agency', 'solutions', 'hire us'];
  if (serviceIndicators.some(i => text.includes(i))) {
    return 'service';
  }

  // Default to business
  return 'business';
}

/**
 * Detect country from URL TLD or patterns
 */
function detectCountryFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname;

    // Check for country code TLDs
    const ccTLDs: Record<string, string> = {
      '.mx': 'MX', '.es': 'ES', '.uk': 'GB', '.de': 'DE', '.fr': 'FR',
      '.jp': 'JP', '.cn': 'CN', '.br': 'BR', '.in': 'IN', '.au': 'AU',
      '.ca': 'CA', '.it': 'IT', '.nl': 'NL', '.se': 'SE', '.no': 'NO',
      '.dk': 'DK', '.fi': 'FI', '.pl': 'PL', '.ru': 'RU', '.ar': 'AR',
      '.cl': 'CL', '.co': 'CO', '.pe': 'PE', '.kr': 'KR', '.sg': 'SG',
      '.nz': 'NZ', '.ie': 'IE', '.be': 'BE', '.ch': 'CH', '.at': 'AT',
    };

    for (const [tld, country] of Object.entries(ccTLDs)) {
      if (hostname.endsWith(tld)) {
        return country;
      }
    }

    // .com, .org, .io, etc. - default to US (can be refined with other signals)
    const genericTLDs = ['.com', '.org', '.io', '.co', '.net', '.app', '.ai'];
    if (genericTLDs.some(tld => hostname.endsWith(tld))) {
      return 'US'; // Assumption for generic TLDs
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract potential competitors from content
 * Basic implementation - AI version should be more sophisticated
 */
function extractPotentialCompetitors(text: string, brandName: string): string[] {
  // Common patterns: "compared to X", "vs X", "alternative to X", "like X"
  const patterns = [
    /compared to\s+([A-Z][a-zA-Z]+)/gi,
    /vs\.?\s+([A-Z][a-zA-Z]+)/gi,
    /alternative to\s+([A-Z][a-zA-Z]+)/gi,
    /like\s+([A-Z][a-zA-Z]+)/gi,
    /better than\s+([A-Z][a-zA-Z]+)/gi,
  ];

  const competitors = new Set<string>();
  const brandLower = brandName.toLowerCase();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const competitor = match[1];
      // Exclude the brand itself and common words
      if (
        competitor.toLowerCase() !== brandLower &&
        competitor.length > 2 &&
        !['The', 'This', 'That', 'These', 'Those', 'Your', 'Our'].includes(competitor)
      ) {
        competitors.add(competitor);
      }
    }
  }

  return Array.from(competitors);
}

/**
 * Calculate confidence score based on match quality
 */
function calculateConfidence(score: number, matchCount: number): number {
  // Base confidence
  let confidence = 0.3;

  // Boost for each match
  confidence += Math.min(matchCount * 0.1, 0.3);

  // Boost for high score
  if (score > 100) confidence += 0.2;
  else if (score > 50) confidence += 0.1;

  // Boost if schema.org data was available
  // This would be passed in the matches array

  return Math.min(confidence, 0.85); // Max 0.85 for heuristic (AI can be higher)
}

// ================================================================
// AI-POWERED DETECTION
// ================================================================

/**
 * Options for AI-powered detection
 */
export interface AIDetectionOptions {
  /** AI provider to use */
  provider?: 'openai' | 'anthropic';
  /** Force AI even if heuristic has high confidence */
  forceAI?: boolean;
  /** Minimum confidence to skip AI */
  heuristicThreshold?: number;
}

/**
 * Detection result with source information
 */
export interface IndustryDetectionResult {
  detection: IndustryDetection;
  source: 'heuristic' | 'ai' | 'hybrid';
  processingTimeMs: number;
  tokensCost?: number;
}

/**
 * Prompt template for AI industry detection
 */
export function createIndustryDetectionPrompt(input: IndustryDetectionInput): string {
  const industries = INDUSTRY_TAXONOMY.map(i => `- ${i.slug}: ${i.name}`).join('\n');

  return `Analyze this brand/website and classify it into an industry category.

Brand/Website Information:
- URL: ${input.url}
- Brand Name: ${input.brandName}
- Title: ${input.title || 'N/A'}
- Description: ${input.description || 'N/A'}
- OG Type: ${input.ogType || 'N/A'}
- Schema.org Type: ${input.schemaOrgType || 'N/A'}
- Schema.org Industry: ${input.schemaOrgIndustry || 'N/A'}

Available Industry Categories:
${industries}

Instructions:
1. Select the most appropriate industry slug from the list above
2. If applicable, suggest a sub-industry (e.g., "crm" for saas, "payments" for fintech)
3. Detect the country (ISO 3166-1 alpha-2 code) based on TLD or content
4. Classify the entity type (business, personal, product, service, organization)
5. List up to 5 likely competitors in the same space
6. Provide your confidence (0-1) and brief reasoning

Respond in JSON format matching this schema:
{
  "industry": "slug",
  "subIndustry": "sub-slug or null",
  "country": "XX or null",
  "entityType": "business|personal|product|service|organization",
  "competitors": ["Competitor1", "Competitor2"],
  "confidence": 0.85,
  "reasoning": "Brief explanation"
}`;
}

/**
 * Parse AI response into IndustryDetection
 */
export function parseAIDetectionResponse(
  response: string
): Result<IndustryDetection, AppError> {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Err(new ValidationError('No JSON found in AI response'));
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const validated = IndustryDetectionSchema.parse(parsed);

    return Ok(validated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Err(
        new ValidationError('Invalid AI response format', {
          errors: error.issues,
        })
      );
    }
    return Err(
      new InternalError(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}

// ================================================================
// MAIN DETECTION FUNCTION
// ================================================================

/**
 * Detect industry for a brand/URL
 *
 * @example
 * ```ts
 * const input = createDetectionInput(urlAnalysisResult);
 * const result = await detectIndustry(input);
 *
 * if (result.ok) {
 *   console.log(result.value.detection.industry); // 'saas'
 *   console.log(result.value.detection.confidence); // 0.85
 * }
 * ```
 */
export async function detectIndustry(
  input: IndustryDetectionInput,
  options: AIDetectionOptions = {}
): Promise<Result<IndustryDetectionResult, AppError>> {
  const startTime = Date.now();
  const timer = apiLogger.time('industry-detector.detect');

  const { forceAI = false, heuristicThreshold = 0.75 } = options;

  try {
    // Step 1: Run heuristic detection
    const heuristicResult = detectIndustryHeuristic(input);

    // Step 2: If heuristic confidence is high enough and not forcing AI, use heuristic
    if (!forceAI && heuristicResult.confidence >= heuristicThreshold) {
      const result: IndustryDetectionResult = {
        detection: heuristicResult,
        source: 'heuristic',
        processingTimeMs: Date.now() - startTime,
      };
      timer.success({ source: 'heuristic', industry: result.detection.industry });
      return Ok(result);
    }

    // Step 3: For now, fall back to heuristic since AI providers require setup
    // In production, this would call the AI provider
    // TODO: Integrate with AI providers when they're configured

    apiLogger.info('AI detection not available, using heuristic fallback', {
      operation: 'detectIndustry',
      confidence: heuristicResult.confidence,
    });

    const result: IndustryDetectionResult = {
      detection: heuristicResult,
      source: 'heuristic',
      processingTimeMs: Date.now() - startTime,
    };

    timer.success({ source: 'heuristic', industry: result.detection.industry });
    return Ok(result);
  } catch (error) {
    timer.failure(error instanceof Error ? error : new Error(String(error)));

    return Err(
      error instanceof AppError
        ? error
        : new InternalError(
            `Industry detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
    );
  }
}

// ================================================================
// EXPORTS
// ================================================================

export type { IndustryDetection };

export default {
  // Taxonomy
  INDUSTRY_TAXONOMY,
  getIndustryBySlug,
  getAllIndustrySlugs,
  getIndustryOptions,

  // Detection
  detectIndustry,
  detectIndustryHeuristic,
  createDetectionInput,

  // AI helpers
  createIndustryDetectionPrompt,
  parseAIDetectionResponse,
};
