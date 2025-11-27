/**
 * AI Output Schemas Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  IndustryDetectionSchema,
  PerceptionQuerySchema,
  BrandMentionSchema,
  BrandMentionsResponseSchema,
  RecommendationSchema,
  RecommendationsResponseSchema,
  SentimentAnalysisSchema,
  HallucinationCheckSchema,
  FullAnalysisResponseSchema,
  AnalysisRequestSchema,
  AnalysisStatusSchema,
  ConfidenceScoreSchema,
  PerceptionScoreSchema,
  EntityTypeSchema,
  AIProviderSchema,
} from './index';

describe('Common Schemas', () => {
  describe('ConfidenceScoreSchema', () => {
    it('should accept valid confidence scores', () => {
      expect(ConfidenceScoreSchema.safeParse(0).success).toBe(true);
      expect(ConfidenceScoreSchema.safeParse(0.5).success).toBe(true);
      expect(ConfidenceScoreSchema.safeParse(1).success).toBe(true);
    });

    it('should reject invalid confidence scores', () => {
      expect(ConfidenceScoreSchema.safeParse(-0.1).success).toBe(false);
      expect(ConfidenceScoreSchema.safeParse(1.1).success).toBe(false);
    });
  });

  describe('PerceptionScoreSchema', () => {
    it('should accept valid perception scores', () => {
      expect(PerceptionScoreSchema.safeParse(0).success).toBe(true);
      expect(PerceptionScoreSchema.safeParse(50).success).toBe(true);
      expect(PerceptionScoreSchema.safeParse(100).success).toBe(true);
    });

    it('should reject non-integer scores', () => {
      expect(PerceptionScoreSchema.safeParse(50.5).success).toBe(false);
    });

    it('should reject out of range scores', () => {
      expect(PerceptionScoreSchema.safeParse(-1).success).toBe(false);
      expect(PerceptionScoreSchema.safeParse(101).success).toBe(false);
    });
  });

  describe('EntityTypeSchema', () => {
    it('should accept valid entity types', () => {
      expect(EntityTypeSchema.safeParse('business').success).toBe(true);
      expect(EntityTypeSchema.safeParse('personal').success).toBe(true);
      expect(EntityTypeSchema.safeParse('product').success).toBe(true);
      expect(EntityTypeSchema.safeParse('service').success).toBe(true);
      expect(EntityTypeSchema.safeParse('organization').success).toBe(true);
    });

    it('should reject invalid entity types', () => {
      expect(EntityTypeSchema.safeParse('unknown').success).toBe(false);
    });
  });

  describe('AIProviderSchema', () => {
    it('should accept valid providers', () => {
      expect(AIProviderSchema.safeParse('openai').success).toBe(true);
      expect(AIProviderSchema.safeParse('anthropic').success).toBe(true);
      expect(AIProviderSchema.safeParse('google').success).toBe(true);
      expect(AIProviderSchema.safeParse('perplexity').success).toBe(true);
    });

    it('should reject invalid providers', () => {
      expect(AIProviderSchema.safeParse('chatgpt').success).toBe(false);
    });
  });
});

describe('IndustryDetectionSchema', () => {
  const validIndustry = {
    industry: 'saas',
    subIndustry: 'crm-sales-tools',
    country: 'US',
    entityType: 'business',
    competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
    confidence: 0.85,
    reasoning: 'Based on website metadata and content analysis',
  };

  it('should accept valid industry detection', () => {
    const result = IndustryDetectionSchema.safeParse(validIndustry);
    expect(result.success).toBe(true);
  });

  it('should accept null subIndustry and country', () => {
    const result = IndustryDetectionSchema.safeParse({
      ...validIndustry,
      subIndustry: null,
      country: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject more than 5 competitors', () => {
    const result = IndustryDetectionSchema.safeParse({
      ...validIndustry,
      competitors: ['A', 'B', 'C', 'D', 'E', 'F'],
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid country code length', () => {
    const result = IndustryDetectionSchema.safeParse({
      ...validIndustry,
      country: 'USA', // Should be 2 characters
    });
    expect(result.success).toBe(false);
  });

  it('should require industry field', () => {
    const result = IndustryDetectionSchema.safeParse({
      ...validIndustry,
      industry: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('PerceptionQuerySchema', () => {
  const validQuery = {
    brandMentioned: true,
    mentionPosition: 2,
    totalMentions: 5,
    mentionContext: 'Stripe was recommended as a leading payment processor',
    sentiment: 'positive',
    attributesMentioned: ['reliable', 'developer-friendly', 'well-documented'],
    competitorsMentioned: ['PayPal', 'Square'],
    query: 'What are the best payment processors for startups?',
    industryContext: 'fintech',
    confidence: 0.9,
  };

  it('should accept valid perception query', () => {
    const result = PerceptionQuerySchema.safeParse(validQuery);
    expect(result.success).toBe(true);
  });

  it('should accept null values for optional fields', () => {
    const result = PerceptionQuerySchema.safeParse({
      ...validQuery,
      mentionPosition: null,
      mentionContext: null,
      sentiment: null,
      industryContext: null,
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid sentiment values', () => {
    const result = PerceptionQuerySchema.safeParse({
      ...validQuery,
      sentiment: 'very_positive', // Invalid
    });
    expect(result.success).toBe(false);
  });
});

describe('BrandMentionSchema', () => {
  const validMention = {
    brandName: 'Stripe',
    normalizedName: 'stripe',
    position: 1,
    isTargetBrand: true,
    sentiment: 'positive',
    sentimentScore: 0.8,
    contextSnippet: 'Stripe is widely regarded as the best payment processor for developers...',
    attributes: ['developer-friendly', 'reliable'],
    isRecommended: true,
    recommendationReason: 'Best API documentation and developer experience',
  };

  it('should accept valid brand mention', () => {
    const result = BrandMentionSchema.safeParse(validMention);
    expect(result.success).toBe(true);
  });

  it('should reject sentiment score out of range', () => {
    const result = BrandMentionSchema.safeParse({
      ...validMention,
      sentimentScore: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('should enforce context snippet max length', () => {
    const result = BrandMentionSchema.safeParse({
      ...validMention,
      contextSnippet: 'a'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('RecommendationSchema', () => {
  const validRecommendation = {
    id: 'rec-001',
    title: 'Add Schema.org markup',
    description: 'Implement structured data to help AI systems understand your content better.',
    rationale: 'AI systems use structured data to extract entity information and relationships.',
    priority: 'high',
    category: 'structured-data',
    estimatedImpact: 25,
    estimatedEffortHours: 4,
    actionItems: [
      'Add Organization schema to homepage',
      'Add Product schema to product pages',
      'Validate with Google Rich Results Test',
    ],
    resources: [
      { name: 'Schema.org Documentation', url: 'https://schema.org', type: 'article' },
    ],
    example: '<script type="application/ld+json">...</script>',
    successMetrics: ['Rich snippets appearing in search', 'Improved entity recognition'],
  };

  it('should accept valid recommendation', () => {
    const result = RecommendationSchema.safeParse(validRecommendation);
    expect(result.success).toBe(true);
  });

  it('should require at least one action item', () => {
    const result = RecommendationSchema.safeParse({
      ...validRecommendation,
      actionItems: [],
    });
    expect(result.success).toBe(false);
  });

  it('should enforce max 10 action items', () => {
    const result = RecommendationSchema.safeParse({
      ...validRecommendation,
      actionItems: Array(11).fill('Action item'),
    });
    expect(result.success).toBe(false);
  });

  it('should accept all valid priority levels', () => {
    const priorities = ['critical', 'high', 'medium', 'low'];
    priorities.forEach((priority) => {
      const result = RecommendationSchema.safeParse({
        ...validRecommendation,
        priority,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept all valid categories', () => {
    const categories = [
      'content',
      'technical-seo',
      'authority',
      'entity-seo',
      'citations',
      'social-proof',
      'structured-data',
      'brand-mentions',
    ];
    categories.forEach((category) => {
      const result = RecommendationSchema.safeParse({
        ...validRecommendation,
        category,
      });
      expect(result.success).toBe(true);
    });
  });
});

describe('SentimentAnalysisSchema', () => {
  const validSentiment = {
    overallSentiment: 'positive',
    sentimentScore: 0.75,
    confidence: 0.9,
    aspectSentiments: [
      { aspect: 'pricing', sentiment: 'neutral', score: 0.1, mentions: 3 },
      { aspect: 'support', sentiment: 'positive', score: 0.8, mentions: 5 },
    ],
    positiveThemes: ['reliability', 'ease of use'],
    negativeThemes: ['expensive for small businesses'],
    sentimentIndicators: [
      { phrase: 'highly recommend', sentiment: 'positive', weight: 0.9 },
      { phrase: 'could be better', sentiment: 'negative', weight: 0.4 },
    ],
    competitorComparison: {
      betterThan: ['Competitor A'],
      worseThan: ['Competitor B'],
      similarTo: ['Competitor C'],
    },
  };

  it('should accept valid sentiment analysis', () => {
    const result = SentimentAnalysisSchema.safeParse(validSentiment);
    expect(result.success).toBe(true);
  });

  it('should accept mixed sentiment', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      overallSentiment: 'mixed',
    });
    expect(result.success).toBe(true);
  });

  it('should accept null competitor comparison', () => {
    const result = SentimentAnalysisSchema.safeParse({
      ...validSentiment,
      competitorComparison: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('HallucinationCheckSchema', () => {
  const validCheck = {
    claim: 'Stripe processes over $1 trillion annually',
    isVerifiable: true,
    verificationStatus: 'verified',
    confidence: 0.95,
    sources: [
      {
        url: 'https://stripe.com/newsroom',
        name: 'Stripe Newsroom',
        supports: true,
        relevance: 0.9,
      },
    ],
    correction: null,
    riskLevel: 'low',
  };

  it('should accept valid hallucination check', () => {
    const result = HallucinationCheckSchema.safeParse(validCheck);
    expect(result.success).toBe(true);
  });

  it('should accept all verification statuses', () => {
    const statuses = ['verified', 'false', 'unverifiable', 'partially_true', 'outdated'];
    statuses.forEach((status) => {
      const result = HallucinationCheckSchema.safeParse({
        ...validCheck,
        verificationStatus: status,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should accept correction when claim is false', () => {
    const result = HallucinationCheckSchema.safeParse({
      ...validCheck,
      verificationStatus: 'false',
      correction: 'Stripe processes approximately $800 billion annually',
    });
    expect(result.success).toBe(true);
  });
});

describe('AnalysisRequestSchema', () => {
  it('should accept valid analysis request', () => {
    const result = AnalysisRequestSchema.safeParse({
      url: 'https://example.com',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.forceRefresh).toBe(false);
      expect(result.data.includeCompetitors).toBe(true);
      expect(result.data.depth).toBe('standard');
    }
  });

  it('should accept all depth levels', () => {
    const depths = ['quick', 'standard', 'deep'];
    depths.forEach((depth) => {
      const result = AnalysisRequestSchema.safeParse({
        url: 'https://example.com',
        depth,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject invalid URL', () => {
    const result = AnalysisRequestSchema.safeParse({
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });
});

describe('AnalysisStatusSchema', () => {
  it('should accept valid status', () => {
    const result = AnalysisStatusSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'processing',
      progress: 45,
      currentStep: 'Analyzing brand mentions',
      estimatedTimeRemaining: 30,
    });
    expect(result.success).toBe(true);
  });

  it('should accept all status values', () => {
    const statuses = ['pending', 'processing', 'completed', 'failed'];
    statuses.forEach((status) => {
      const result = AnalysisStatusSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        status,
        progress: 0,
      });
      expect(result.success).toBe(true);
    });
  });

  it('should reject progress out of range', () => {
    const result = AnalysisStatusSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'processing',
      progress: 150,
    });
    expect(result.success).toBe(false);
  });
});

describe('RecommendationsResponseSchema', () => {
  const validResponse = {
    recommendations: [
      {
        id: 'rec-001',
        title: 'Add Schema.org markup',
        description: 'Implement structured data.',
        rationale: 'Helps AI understand content.',
        priority: 'high',
        category: 'structured-data',
        estimatedImpact: 25,
        estimatedEffortHours: 4,
        actionItems: ['Add Organization schema'],
      },
    ],
    summary: 'Focus on structured data and content optimization.',
    currentScore: 45,
    projectedScore: 70,
    strengths: ['Strong brand recognition', 'Good content quality'],
    weaknesses: ['Missing structured data', 'No knowledge graph presence'],
    quickWins: ['Add JSON-LD to homepage'],
  };

  it('should accept valid recommendations response', () => {
    const result = RecommendationsResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('should enforce max 5 strengths', () => {
    const result = RecommendationsResponseSchema.safeParse({
      ...validResponse,
      strengths: Array(6).fill('Strength'),
    });
    expect(result.success).toBe(false);
  });

  it('should enforce max 3 quick wins', () => {
    const result = RecommendationsResponseSchema.safeParse({
      ...validResponse,
      quickWins: Array(4).fill('Quick win'),
    });
    expect(result.success).toBe(false);
  });
});
