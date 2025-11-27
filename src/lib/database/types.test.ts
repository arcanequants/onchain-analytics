/**
 * Database Types Tests
 * Phase 1, Week 1, Day 1
 *
 * These tests verify that the TypeScript types match the database schema
 * and can be used correctly with type guards and assertions.
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  // Enums
  SubscriptionTier,
  SubscriptionStatus,
  AnalysisStatus,
  AIProvider,
  QueryType,
  RecommendationCategory,
  RecommendationPriority,
  EffortLevel,
  HallucinationType,
  // Tables
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
  Industry,
  Analysis,
  AnalysisInsert,
  AnalysisUpdate,
  AIResponse,
  AIResponseInsert,
  Competitor,
  Recommendation,
  RecommendationInsert,
  RecommendationUpdate,
  AISubscription,
  UsageTracking,
  HallucinationReport,
  APICostTracking,
  DailyCostSummary,
  // Utilities
  Database,
  TableRow,
  TableInsert,
  TableUpdate,
  AnalysisWithRelations,
  UserWithSubscription,
  ScoreBreakdown,
} from './types';

// ================================================================
// ENUM TYPE TESTS
// ================================================================

describe('Enum Types', () => {
  describe('SubscriptionTier', () => {
    it('should accept valid tiers', () => {
      const tiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'enterprise'];
      expect(tiers).toHaveLength(4);
    });

    it('should type check correctly', () => {
      expectTypeOf<SubscriptionTier>().toEqualTypeOf<'free' | 'starter' | 'pro' | 'enterprise'>();
    });
  });

  describe('AnalysisStatus', () => {
    it('should include all valid statuses', () => {
      const statuses: AnalysisStatus[] = ['pending', 'processing', 'completed', 'failed', 'expired'];
      expect(statuses).toHaveLength(5);
    });
  });

  describe('AIProvider', () => {
    it('should include all AI providers', () => {
      const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];
      expect(providers).toHaveLength(4);
    });
  });

  describe('QueryType', () => {
    it('should include all query types', () => {
      const types: QueryType[] = ['recommendation', 'comparison', 'sentiment', 'authority', 'features'];
      expect(types).toHaveLength(5);
    });
  });

  describe('RecommendationCategory', () => {
    it('should include all categories', () => {
      const categories: RecommendationCategory[] = [
        'content',
        'technical',
        'authority',
        'visibility',
        'competitive',
      ];
      expect(categories).toHaveLength(5);
    });
  });

  describe('HallucinationType', () => {
    it('should include all hallucination types', () => {
      const types: HallucinationType[] = [
        'factual_error',
        'outdated_info',
        'fabricated_entity',
        'wrong_attribution',
        'contradictory',
        'other',
      ];
      expect(types).toHaveLength(6);
    });
  });
});

// ================================================================
// TABLE TYPE TESTS
// ================================================================

describe('UserProfile Types', () => {
  it('should have required fields in Row type', () => {
    const user: UserProfile = {
      id: 'uuid-123',
      email: 'test@example.com',
      full_name: 'Test User',
      company_name: null,
      company_url: null,
      industry: null,
      company_size: null,
      subscription_tier: 'free',
      subscription_status: 'active',
      stripe_customer_id: null,
      analyses_used_this_month: 0,
      analyses_limit: 3,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    expect(user.id).toBe('uuid-123');
    expect(user.subscription_tier).toBe('free');
  });

  it('should allow minimal insert', () => {
    const insert: UserProfileInsert = {
      id: 'uuid-123',
      email: 'test@example.com',
    };

    expect(insert.id).toBeDefined();
    expect(insert.subscription_tier).toBeUndefined(); // Uses DB default
  });

  it('should allow partial update', () => {
    const update: UserProfileUpdate = {
      full_name: 'Updated Name',
      company_name: 'ACME Corp',
    };

    expect(update.full_name).toBe('Updated Name');
    expect(update.email).toBeUndefined(); // Not being updated
  });
});

describe('Analysis Types', () => {
  it('should have correct score breakdown type', () => {
    const breakdown: ScoreBreakdown = {
      visibility: 80,
      sentiment: 75,
      authority: 70,
      recency: 85,
    };

    expect(breakdown.visibility).toBe(80);
    expectTypeOf(breakdown).toEqualTypeOf<ScoreBreakdown>();
  });

  it('should have required fields in Row type', () => {
    const analysis: Analysis = {
      id: 'uuid-456',
      user_id: 'uuid-123',
      url: 'https://example.com',
      brand_name: 'Example',
      industry_id: null,
      status: 'pending',
      overall_score: null,
      score_breakdown: null,
      confidence_score: null,
      providers_queried: [],
      total_tokens_used: 0,
      total_cost_usd: 0,
      processing_time_ms: null,
      share_token: null,
      is_public: false,
      created_at: '2025-01-01T00:00:00Z',
      completed_at: null,
      expires_at: null,
    };

    expect(analysis.status).toBe('pending');
    expect(analysis.providers_queried).toEqual([]);
  });

  it('should allow minimal insert', () => {
    const insert: AnalysisInsert = {
      url: 'https://example.com',
      brand_name: 'Example',
    };

    expect(insert.url).toBe('https://example.com');
    expect(insert.status).toBeUndefined(); // Uses DB default 'pending'
  });

  it('should allow partial update', () => {
    const update: AnalysisUpdate = {
      status: 'completed',
      overall_score: 85,
      completed_at: '2025-01-01T00:00:00Z',
    };

    expect(update.status).toBe('completed');
    expect(update.overall_score).toBe(85);
  });

  it('should type providers_queried as AIProvider array', () => {
    const analysis: Analysis = {
      id: 'uuid',
      user_id: null,
      url: 'https://test.com',
      brand_name: 'Test',
      industry_id: null,
      status: 'completed',
      overall_score: 75,
      score_breakdown: { visibility: 80, sentiment: 75, authority: 70, recency: 75 },
      confidence_score: 0.85,
      providers_queried: ['openai', 'anthropic'],
      total_tokens_used: 1000,
      total_cost_usd: 0.003,
      processing_time_ms: 2500,
      share_token: null,
      is_public: false,
      created_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T00:00:05Z',
      expires_at: null,
    };

    expect(analysis.providers_queried).toContain('openai');
    expectTypeOf(analysis.providers_queried).toEqualTypeOf<AIProvider[]>();
  });
});

describe('AIResponse Types', () => {
  it('should have all required fields', () => {
    const response: AIResponse = {
      id: 'uuid-789',
      analysis_id: 'uuid-456',
      provider: 'openai',
      model: 'gpt-4o-mini',
      model_version: null,
      prompt_template: 'perception_query',
      prompt_variables: { brand: 'Example' },
      query_type: 'recommendation',
      raw_response: 'I recommend...',
      parsed_response: { recommendations: [] },
      mentions_brand: true,
      sentiment_score: 0.7,
      position_in_list: 2,
      competitors_mentioned: ['Competitor A'],
      tokens_input: 100,
      tokens_output: 50,
      cost_usd: 0.001,
      latency_ms: 500,
      was_cached: false,
      cache_key: null,
      retry_count: 0,
      error_message: null,
      created_at: '2025-01-01T00:00:00Z',
    };

    expect(response.provider).toBe('openai');
    expect(response.mentions_brand).toBe(true);
  });

  it('should require essential fields in insert', () => {
    const insert: AIResponseInsert = {
      analysis_id: 'uuid-456',
      provider: 'anthropic',
      model: 'claude-3-5-haiku-20241022',
      prompt_template: 'perception_query',
      query_type: 'recommendation',
      raw_response: 'Response text',
      parsed_response: { brands: [] },
    };

    expect(insert.provider).toBe('anthropic');
  });
});

describe('Recommendation Types', () => {
  it('should have correct structure', () => {
    const rec: Recommendation = {
      id: 'uuid-rec',
      analysis_id: 'uuid-456',
      category: 'content',
      priority: 'high',
      title: 'Add structured data',
      description: 'Implement JSON-LD schema',
      estimated_score_impact: 10,
      effort_level: 'quick-win',
      is_dismissed: false,
      is_completed: false,
      completed_at: null,
      created_at: '2025-01-01T00:00:00Z',
    };

    expect(rec.category).toBe('content');
    expect(rec.priority).toBe('high');
  });

  it('should allow update to completion status', () => {
    const update: RecommendationUpdate = {
      is_completed: true,
      completed_at: '2025-01-02T00:00:00Z',
    };

    expect(update.is_completed).toBe(true);
  });
});

// ================================================================
// DATABASE TYPE TESTS
// ================================================================

describe('Database Type', () => {
  it('should have all tables defined', () => {
    type Tables = keyof Database['public']['Tables'];
    const tables: Tables[] = [
      'user_profiles',
      'industries',
      'analyses',
      'ai_responses',
      'competitors',
      'recommendations',
      'ai_subscriptions',
      'usage_tracking',
      'hallucination_reports',
      'api_cost_tracking',
      'daily_cost_summary',
    ];

    expect(tables).toHaveLength(11);
  });

  it('should have increment_usage function defined', () => {
    type FunctionName = keyof Database['public']['Functions'];
    expectTypeOf<FunctionName>().toEqualTypeOf<'increment_usage'>();
  });
});

// ================================================================
// TYPE UTILITY TESTS
// ================================================================

describe('Type Utilities', () => {
  it('should extract row type correctly', () => {
    type UserRow = TableRow<'user_profiles'>;
    expectTypeOf<UserRow>().toEqualTypeOf<UserProfile>();
  });

  it('should extract insert type correctly', () => {
    type AnalysisIns = TableInsert<'analyses'>;
    expectTypeOf<AnalysisIns>().toEqualTypeOf<AnalysisInsert>();
  });

  it('should extract update type correctly', () => {
    type RecUpdate = TableUpdate<'recommendations'>;
    expectTypeOf<RecUpdate>().toEqualTypeOf<RecommendationUpdate>();
  });
});

// ================================================================
// RELATION TYPE TESTS
// ================================================================

describe('Relation Types', () => {
  it('should define AnalysisWithRelations correctly', () => {
    const analysisWithRelations: AnalysisWithRelations = {
      // Base Analysis fields
      id: 'uuid-456',
      user_id: 'uuid-123',
      url: 'https://example.com',
      brand_name: 'Example',
      industry_id: 'uuid-ind',
      status: 'completed',
      overall_score: 85,
      score_breakdown: { visibility: 90, sentiment: 80, authority: 85, recency: 85 },
      confidence_score: 0.92,
      providers_queried: ['openai', 'anthropic'],
      total_tokens_used: 500,
      total_cost_usd: 0.002,
      processing_time_ms: 3000,
      share_token: 'share-123',
      is_public: false,
      created_at: '2025-01-01T00:00:00Z',
      completed_at: '2025-01-01T00:00:03Z',
      expires_at: null,
      // Relations
      industry: {
        id: 'uuid-ind',
        slug: 'saas',
        name: 'SaaS / Software',
        parent_id: null,
        description: 'Software as a Service',
        keywords: ['software', 'app'],
        regulatory_context: null,
        seasonality_factors: null,
        is_active: true,
        display_order: 1,
        created_at: '2025-01-01T00:00:00Z',
      },
      ai_responses: [],
      competitors: [],
      recommendations: [],
    };

    expect(analysisWithRelations.industry?.slug).toBe('saas');
    expect(analysisWithRelations.ai_responses).toEqual([]);
  });

  it('should define UserWithSubscription correctly', () => {
    const userWithSub: UserWithSubscription = {
      id: 'uuid-123',
      email: 'test@example.com',
      full_name: 'Test User',
      company_name: 'ACME',
      company_url: 'https://acme.com',
      industry: 'saas',
      company_size: '11-50',
      subscription_tier: 'pro',
      subscription_status: 'active',
      stripe_customer_id: 'cus_xxx',
      analyses_used_this_month: 10,
      analyses_limit: 100,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      subscription: null,
      current_usage: null,
    };

    expect(userWithSub.subscription_tier).toBe('pro');
    expect(userWithSub.subscription).toBeNull();
  });
});

// ================================================================
// VALIDATION HELPERS
// ================================================================

describe('Type Guards and Validators', () => {
  // These are examples of runtime type guards that could be used
  const isValidAnalysisStatus = (status: string): status is AnalysisStatus => {
    return ['pending', 'processing', 'completed', 'failed', 'expired'].includes(status);
  };

  const isValidAIProvider = (provider: string): provider is AIProvider => {
    return ['openai', 'anthropic', 'google', 'perplexity'].includes(provider);
  };

  it('should validate analysis status', () => {
    expect(isValidAnalysisStatus('pending')).toBe(true);
    expect(isValidAnalysisStatus('completed')).toBe(true);
    expect(isValidAnalysisStatus('invalid')).toBe(false);
  });

  it('should validate AI provider', () => {
    expect(isValidAIProvider('openai')).toBe(true);
    expect(isValidAIProvider('anthropic')).toBe(true);
    expect(isValidAIProvider('unknown')).toBe(false);
  });
});
