/**
 * AI Output Schemas - Type-Safe AI Response Validation
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.16
 *
 * These schemas define the expected structure of AI responses
 * and are used with OpenAI function_calling / Anthropic tool_use
 * for structured, type-safe outputs.
 */

import { z } from 'zod';

// ================================================================
// COMMON TYPES
// ================================================================

/**
 * Confidence score (0-1) for AI predictions
 */
export const ConfidenceScoreSchema = z.number()
  .min(0, 'Confidence must be between 0 and 1')
  .max(1, 'Confidence must be between 0 and 1');

/**
 * Perception score (0-100) for brand visibility
 */
export const PerceptionScoreSchema = z.number()
  .int('Score must be an integer')
  .min(0, 'Score must be between 0 and 100')
  .max(100, 'Score must be between 0 and 100');

/**
 * Entity types for brand analysis
 */
export const EntityTypeSchema = z.enum([
  'business',
  'personal',
  'product',
  'service',
  'organization',
]);

export type EntityType = z.infer<typeof EntityTypeSchema>;

/**
 * AI Provider identifier
 */
export const AIProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'perplexity',
]);

export type AIProvider = z.infer<typeof AIProviderSchema>;

// ================================================================
// INDUSTRY DETECTION SCHEMA
// ================================================================

/**
 * Schema for industry detection from URL/brand metadata
 * Used to classify businesses into our taxonomy
 */
export const IndustryDetectionSchema = z.object({
  /** Primary industry category slug (e.g., 'saas', 'healthcare') */
  industry: z.string().min(1, 'Industry is required'),

  /** Sub-industry or niche (e.g., 'crm-sales-tools') */
  subIndustry: z.string().nullable(),

  /** Detected country/region (ISO 3166-1 alpha-2) */
  country: z.string().length(2, 'Country must be ISO 3166-1 alpha-2 code').nullable(),

  /** Type of entity being analyzed */
  entityType: EntityTypeSchema,

  /** Detected competitors in same space (max 5) */
  competitors: z.array(z.string()).max(5, 'Maximum 5 competitors'),

  /** Confidence in this classification (0-1) */
  confidence: ConfidenceScoreSchema,

  /** Key reasoning for this classification */
  reasoning: z.string().optional(),
});

export type IndustryDetection = z.infer<typeof IndustryDetectionSchema>;

// ================================================================
// PERCEPTION QUERY SCHEMA
// ================================================================

/**
 * Schema for AI perception query response
 * This is the main response when asking AI about brand recommendations
 */
export const PerceptionQuerySchema = z.object({
  /** Whether the brand was mentioned in the response */
  brandMentioned: z.boolean(),

  /** Position in list if mentioned (1 = first, null if not in list) */
  mentionPosition: z.number().int().min(1).nullable(),

  /** Total brands mentioned in response */
  totalMentions: z.number().int().min(0),

  /** Context around the brand mention */
  mentionContext: z.string().nullable(),

  /** Overall sentiment of the mention */
  sentiment: z.enum(['positive', 'neutral', 'negative']).nullable(),

  /** Specific attributes mentioned about the brand */
  attributesMentioned: z.array(z.string()),

  /** Competing brands mentioned in same context */
  competitorsMentioned: z.array(z.string()),

  /** The raw query that was asked */
  query: z.string(),

  /** The industry context of the query */
  industryContext: z.string().nullable(),

  /** Confidence in this analysis */
  confidence: ConfidenceScoreSchema,
});

export type PerceptionQuery = z.infer<typeof PerceptionQuerySchema>;

// ================================================================
// BRAND MENTION SCHEMA
// ================================================================

/**
 * Schema for extracted brand mentions from AI responses
 * Used to parse and structure brand references
 */
export const BrandMentionSchema = z.object({
  /** The brand name as mentioned */
  brandName: z.string().min(1),

  /** Normalized brand identifier (lowercase, no spaces) */
  normalizedName: z.string().min(1),

  /** Position in response (1-indexed) */
  position: z.number().int().min(1),

  /** Whether this is the target brand being analyzed */
  isTargetBrand: z.boolean(),

  /** Sentiment of this specific mention */
  sentiment: z.enum(['positive', 'neutral', 'negative']),

  /** Sentiment score (-1 to 1) */
  sentimentScore: z.number().min(-1).max(1),

  /** Context snippet around the mention */
  contextSnippet: z.string().max(500),

  /** Attributes or descriptors used with this brand */
  attributes: z.array(z.string()),

  /** Whether brand is recommended */
  isRecommended: z.boolean(),

  /** Reason for recommendation (if applicable) */
  recommendationReason: z.string().nullable(),
});

export type BrandMention = z.infer<typeof BrandMentionSchema>;

/**
 * Schema for multiple brand mentions in a response
 */
export const BrandMentionsResponseSchema = z.object({
  /** All brands mentioned in the response */
  mentions: z.array(BrandMentionSchema),

  /** Total number of unique brands */
  uniqueBrandCount: z.number().int().min(0),

  /** The query that was analyzed */
  analyzedQuery: z.string(),

  /** Whether the target brand was found */
  targetBrandFound: z.boolean(),

  /** Position of target brand (null if not found) */
  targetBrandPosition: z.number().int().min(1).nullable(),
});

export type BrandMentionsResponse = z.infer<typeof BrandMentionsResponseSchema>;

// ================================================================
// RECOMMENDATION SCHEMA
// ================================================================

/**
 * Priority levels for recommendations
 */
export const RecommendationPrioritySchema = z.enum([
  'critical',  // Must fix immediately
  'high',      // Should fix soon
  'medium',    // Nice to have
  'low',       // Optional improvement
]);

export type RecommendationPriority = z.infer<typeof RecommendationPrioritySchema>;

/**
 * Categories of recommendations
 */
export const RecommendationCategorySchema = z.enum([
  'content',           // Content improvements
  'technical-seo',     // Technical SEO fixes
  'authority',         // Authority building
  'entity-seo',        // Entity SEO (Knowledge Graph, schema)
  'citations',         // Getting cited in AI training data
  'social-proof',      // Reviews, testimonials, social mentions
  'structured-data',   // Schema.org, JSON-LD
  'brand-mentions',    // Increasing brand mentions online
]);

export type RecommendationCategory = z.infer<typeof RecommendationCategorySchema>;

/**
 * Schema for a single actionable recommendation
 */
export const RecommendationSchema = z.object({
  /** Unique identifier for this recommendation */
  id: z.string().min(1),

  /** Short title of the recommendation */
  title: z.string().min(1).max(100),

  /** Detailed description of what to do */
  description: z.string().min(1).max(1000),

  /** Why this matters for AI visibility */
  rationale: z.string().min(1).max(500),

  /** Priority level */
  priority: RecommendationPrioritySchema,

  /** Category of recommendation */
  category: RecommendationCategorySchema,

  /** Estimated impact on AI visibility (0-100) */
  estimatedImpact: PerceptionScoreSchema,

  /** Estimated effort to implement (hours) */
  estimatedEffortHours: z.number().min(0).max(1000),

  /** Specific action items */
  actionItems: z.array(z.string()).min(1).max(10),

  /** Resources or tools that can help */
  resources: z.array(z.object({
    name: z.string(),
    url: z.string().url().optional(),
    type: z.enum(['tool', 'article', 'service', 'template']),
  })).optional(),

  /** Example of good implementation */
  example: z.string().optional(),

  /** Metrics to track success */
  successMetrics: z.array(z.string()).optional(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Schema for full recommendations response
 */
export const RecommendationsResponseSchema = z.object({
  /** List of recommendations ordered by priority */
  recommendations: z.array(RecommendationSchema),

  /** Overall summary of improvements needed */
  summary: z.string().max(500),

  /** Current estimated AI visibility score */
  currentScore: PerceptionScoreSchema,

  /** Projected score after implementing recommendations */
  projectedScore: PerceptionScoreSchema,

  /** Key strengths identified */
  strengths: z.array(z.string()).max(5),

  /** Key weaknesses identified */
  weaknesses: z.array(z.string()).max(5),

  /** Quick wins (high impact, low effort) */
  quickWins: z.array(z.string()).max(3),
});

export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;

// ================================================================
// SENTIMENT ANALYSIS SCHEMA
// ================================================================

/**
 * Schema for detailed sentiment analysis of brand mentions
 */
export const SentimentAnalysisSchema = z.object({
  /** Overall sentiment classification */
  overallSentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']),

  /** Sentiment score from -1 (very negative) to 1 (very positive) */
  sentimentScore: z.number().min(-1).max(1),

  /** Confidence in sentiment analysis */
  confidence: ConfidenceScoreSchema,

  /** Breakdown by aspect/attribute */
  aspectSentiments: z.array(z.object({
    aspect: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    score: z.number().min(-1).max(1),
    mentions: z.number().int().min(1),
  })),

  /** Positive themes/topics identified */
  positiveThemes: z.array(z.string()),

  /** Negative themes/topics identified */
  negativeThemes: z.array(z.string()),

  /** Key phrases that indicate sentiment */
  sentimentIndicators: z.array(z.object({
    phrase: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    weight: z.number().min(0).max(1),
  })),

  /** Comparison to competitors (if available) */
  competitorComparison: z.object({
    betterThan: z.array(z.string()),
    worseThan: z.array(z.string()),
    similarTo: z.array(z.string()),
  }).nullable(),
});

export type SentimentAnalysis = z.infer<typeof SentimentAnalysisSchema>;

// ================================================================
// HALLUCINATION CHECK SCHEMA
// ================================================================

/**
 * Schema for hallucination detection/verification
 */
export const HallucinationCheckSchema = z.object({
  /** The claim being verified */
  claim: z.string(),

  /** Whether the claim is verifiable */
  isVerifiable: z.boolean(),

  /** Verification status */
  verificationStatus: z.enum([
    'verified',      // Confirmed true
    'false',         // Confirmed false
    'unverifiable',  // Cannot be confirmed
    'partially_true', // Some aspects are true
    'outdated',      // Was true but no longer
  ]),

  /** Confidence in verification */
  confidence: ConfidenceScoreSchema,

  /** Sources that support or contradict */
  sources: z.array(z.object({
    url: z.string().url().optional(),
    name: z.string(),
    supports: z.boolean(),
    relevance: z.number().min(0).max(1),
  })),

  /** Corrected information if claim is false */
  correction: z.string().nullable(),

  /** Risk level of this hallucination */
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
});

export type HallucinationCheck = z.infer<typeof HallucinationCheckSchema>;

// ================================================================
// FULL ANALYSIS RESPONSE SCHEMA
// ================================================================

/**
 * Complete analysis response combining all components
 */
export const FullAnalysisResponseSchema = z.object({
  /** Analysis metadata */
  metadata: z.object({
    analysisId: z.string().uuid(),
    brandUrl: z.string().url(),
    brandName: z.string(),
    analyzedAt: z.string().datetime(),
    provider: AIProviderSchema,
    modelId: z.string(),
    promptVersion: z.string(),
    totalLatencyMs: z.number().int().min(0),
  }),

  /** Industry classification */
  industry: IndustryDetectionSchema,

  /** Overall perception score */
  perceptionScore: PerceptionScoreSchema,

  /** Score breakdown by provider */
  providerScores: z.array(z.object({
    provider: AIProviderSchema,
    score: PerceptionScoreSchema,
    queriesAnalyzed: z.number().int().min(0),
    mentionRate: z.number().min(0).max(1),
  })),

  /** Brand mentions analysis */
  mentions: BrandMentionsResponseSchema,

  /** Sentiment analysis */
  sentiment: SentimentAnalysisSchema,

  /** Recommendations */
  recommendations: RecommendationsResponseSchema,

  /** Confidence in overall analysis */
  overallConfidence: ConfidenceScoreSchema,

  /** Any warnings or caveats */
  warnings: z.array(z.string()),

  /** Data quality indicators */
  dataQuality: z.object({
    completeness: z.number().min(0).max(1),
    parseSuccess: z.boolean(),
    hasAnomalies: z.boolean(),
    anomalyDetails: z.array(z.string()),
  }),
});

export type FullAnalysisResponse = z.infer<typeof FullAnalysisResponseSchema>;

// ================================================================
// API REQUEST/RESPONSE SCHEMAS
// ================================================================

/**
 * Analysis request input
 */
export const AnalysisRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  industry: z.string().optional(),
  forceRefresh: z.boolean().default(false),
  includeCompetitors: z.boolean().default(true),
  depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
});

export type AnalysisRequest = z.infer<typeof AnalysisRequestSchema>;

/**
 * Analysis status response
 */
export const AnalysisStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  progress: z.number().min(0).max(100),
  currentStep: z.string().optional(),
  estimatedTimeRemaining: z.number().int().min(0).optional(),
  error: z.string().optional(),
});

export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Common
  ConfidenceScoreSchema,
  PerceptionScoreSchema,
  EntityTypeSchema,
  AIProviderSchema,

  // Core schemas
  IndustryDetectionSchema,
  PerceptionQuerySchema,
  BrandMentionSchema,
  BrandMentionsResponseSchema,
  RecommendationSchema,
  RecommendationsResponseSchema,
  SentimentAnalysisSchema,
  HallucinationCheckSchema,
  FullAnalysisResponseSchema,

  // API schemas
  AnalysisRequestSchema,
  AnalysisStatusSchema,
};
