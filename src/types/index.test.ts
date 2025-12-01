/**
 * Type System Tests
 *
 * Phase 1, Week 1, Day 5
 * Tests for generated types and type utilities
 */

import { describe, it, expect } from 'vitest';
import type {
  Database,
  TableRow,
  TableInsert,
  TableUpdate,
  Analysis,
  AnalysisInsert,
  UserProfile,
  Industry,
  AIResponse,
  Competitor,
  Recommendation,
  GasPrice,
  TokenPrice,
  AnalysisStatus,
  AIProvider,
  Chain,
  GasStatus,
  SubscriptionTier,
  ScoreBreakdown,
  ApiResponse,
  PaginatedResponse,
  AnalysisResult,
  GasTrackerData,
} from './index';

// ================================================================
// TYPE EXISTENCE TESTS
// ================================================================

describe('Type System', () => {
  describe('Database types', () => {
    it('should have Database type defined', () => {
      // This is a compile-time test - if it compiles, it passes
      const db: Database = {} as Database;
      expect(db).toBeDefined();
    });

    it('should have public schema with Tables', () => {
      type Tables = Database['public']['Tables'];
      const tables: Tables = {} as Tables;
      expect(tables).toBeDefined();
    });
  });

  describe('Entity types', () => {
    it('should have Analysis type with correct fields', () => {
      const analysis: Analysis = {
        id: 'test-id',
        user_id: 'user-id',
        url: 'https://example.com',
        brand_name: 'Test Brand',
        industry_id: 'industry-id',
        status: 'pending',
        overall_score: 75,
        score_breakdown: { visibility: 80, sentiment: 70 },
        confidence_score: 0.85,
        providers_queried: ['openai', 'anthropic'],
        total_tokens_used: 1000,
        total_cost_usd: 0.05,
        processing_time_ms: 5000,
        share_token: null,
        is_public: false,
        created_at: new Date().toISOString(),
        completed_at: null,
        expires_at: null,
      };

      expect(analysis.id).toBe('test-id');
      expect(analysis.status).toBe('pending');
    });

    it('should have UserProfile type with correct fields', () => {
      const profile: UserProfile = {
        id: 'user-id',
        email: 'test@example.com',
        full_name: 'Test User',
        company_name: 'Test Corp',
        company_url: 'https://test.com',
        industry: 'saas',
        company_size: '11-50',
        subscription_tier: 'free',
        subscription_status: 'active',
        stripe_customer_id: null,
        analyses_used_this_month: 0,
        analyses_limit: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(profile.email).toBe('test@example.com');
      expect(profile.subscription_tier).toBe('free');
    });

    it('should have AIResponse type', () => {
      const response: AIResponse = {
        id: 'response-id',
        analysis_id: 'analysis-id',
        provider: 'openai',
        model: 'gpt-4',
        model_version: null,
        prompt_template: 'test template',
        prompt_variables: {},
        query_type: 'recommendation',
        raw_response: 'Test response',
        parsed_response: {},
        mentions_brand: true,
        sentiment_score: 0.8,
        position_in_list: 1,
        competitors_mentioned: ['Competitor A'],
        tokens_input: 500,
        tokens_output: 200,
        cost_usd: 0.02,
        latency_ms: 1500,
        was_cached: false,
        cache_key: null,
        retry_count: 0,
        error_message: null,
        created_at: new Date().toISOString(),
      };

      expect(response.provider).toBe('openai');
      expect(response.mentions_brand).toBe(true);
    });

    it('should have GasPrice type', () => {
      const gasPrice: GasPrice = {
        id: 'gas-id',
        chain: 'ethereum',
        gas_price: 25.5,
        block_number: 12345678,
        base_fee: 20.0,
        priority_fee: 2.0,
        status: 'medium',
        created_at: new Date().toISOString(),
      };

      expect(gasPrice.chain).toBe('ethereum');
      expect(gasPrice.status).toBe('medium');
    });
  });

  describe('Utility types', () => {
    it('should have TableRow utility type', () => {
      type AnalysisRow = TableRow<'analyses'>;
      const row: AnalysisRow = {} as AnalysisRow;
      expect(row).toBeDefined();
    });

    it('should have TableInsert utility type', () => {
      const insert: AnalysisInsert = {
        url: 'https://example.com',
        brand_name: 'Test',
        // Other required fields...
      } as AnalysisInsert;

      expect(insert.url).toBe('https://example.com');
    });

    it('should have TableUpdate utility type', () => {
      type AnalysisUpdateType = TableUpdate<'analyses'>;
      const update: AnalysisUpdateType = {
        status: 'completed',
        overall_score: 85,
      };

      expect(update.status).toBe('completed');
    });
  });

  describe('Enum types', () => {
    it('should have AnalysisStatus enum', () => {
      const statuses: AnalysisStatus[] = [
        'pending',
        'processing',
        'completed',
        'failed',
        'expired',
      ];

      expect(statuses).toHaveLength(5);
    });

    it('should have AIProvider enum', () => {
      const providers: AIProvider[] = ['openai', 'anthropic', 'google', 'perplexity'];
      expect(providers).toHaveLength(4);
    });

    it('should have Chain enum', () => {
      const chains: Chain[] = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'];
      expect(chains).toHaveLength(5);
    });

    it('should have GasStatus enum', () => {
      const statuses: GasStatus[] = ['low', 'medium', 'high'];
      expect(statuses).toHaveLength(3);
    });

    it('should have SubscriptionTier enum', () => {
      const tiers: SubscriptionTier[] = ['free', 'starter', 'pro', 'enterprise'];
      expect(tiers).toHaveLength(4);
    });
  });

  describe('Composite types', () => {
    it('should have ScoreBreakdown type', () => {
      const breakdown: ScoreBreakdown = {
        visibility: 80,
        sentiment: 75,
        authority: 70,
        recency: 85,
      };

      expect(breakdown.visibility).toBe(80);
      expect(Object.keys(breakdown)).toHaveLength(4);
    });
  });

  describe('API response types', () => {
    it('should have ApiResponse type', () => {
      const response: ApiResponse<Analysis> = {
        success: true,
        data: {} as Analysis,
        meta: {
          requestId: 'aip_123',
          timestamp: new Date().toISOString(),
        },
      };

      expect(response.success).toBe(true);
    });

    it('should have ApiResponse error type', () => {
      const errorResponse: ApiResponse<never> = {
        success: false,
        error: {
          code: 'ERR_VALIDATION',
          message: 'Invalid input',
          details: { field: 'url' },
        },
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.code).toBe('ERR_VALIDATION');
    });

    it('should have PaginatedResponse type', () => {
      const response: PaginatedResponse<Analysis> = {
        success: true,
        data: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 100,
          totalPages: 10,
        },
      };

      expect(response.pagination.page).toBe(1);
      expect(response.pagination.totalPages).toBe(10);
    });

    it('should have AnalysisResult type', () => {
      const result: AnalysisResult = {
        id: 'analysis-id',
        url: 'https://example.com',
        brandName: 'Test Brand',
        overallScore: 85,
        scoreBreakdown: {
          visibility: 90,
          sentiment: 80,
          authority: 85,
          recency: 85,
        },
        confidenceScore: 0.92,
        competitors: [],
        recommendations: [],
        providers: ['openai', 'anthropic'],
        processingTimeMs: 3500,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      expect(result.overallScore).toBe(85);
      expect(result.providers).toContain('openai');
    });

    it('should have GasTrackerData type', () => {
      const data: GasTrackerData = {
        chain: 'ethereum',
        gasPrice: 25,
        baseFee: 20,
        priorityFee: 5,
        status: 'medium',
        blockNumber: 12345678,
        updatedAt: new Date().toISOString(),
      };

      expect(data.chain).toBe('ethereum');
      expect(data.status).toBe('medium');
    });
  });
});

// ================================================================
// TYPE SAFETY TESTS
// ================================================================

describe('Type Safety', () => {
  it('should enforce correct AnalysisStatus values', () => {
    // This would cause a TypeScript error if uncommented:
    // const invalid: AnalysisStatus = 'invalid';

    const valid: AnalysisStatus = 'completed';
    expect(valid).toBe('completed');
  });

  it('should enforce correct Chain values', () => {
    // This would cause a TypeScript error if uncommented:
    // const invalid: Chain = 'bitcoin';

    const valid: Chain = 'ethereum';
    expect(valid).toBe('ethereum');
  });

  it('should enforce ApiResponse structure', () => {
    // Success response must have data
    const success: ApiResponse<{ id: string }> = {
      success: true,
      data: { id: 'test' },
    };

    // Error response must have error
    const error: ApiResponse<never> = {
      success: false,
      error: {
        code: 'ERR_TEST',
        message: 'Test error',
      },
    };

    expect(success.data?.id).toBe('test');
    expect(error.error?.code).toBe('ERR_TEST');
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Type Integration', () => {
  it('should work with real-world analysis flow', () => {
    // Create analysis insert
    const insert: AnalysisInsert = {
      url: 'https://example.com',
      brand_name: 'Example Corp',
    } as AnalysisInsert;

    // Simulate database response
    const result: Analysis = {
      id: 'uuid-here',
      user_id: 'user-uuid',
      url: insert.url,
      brand_name: insert.brand_name,
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
      created_at: new Date().toISOString(),
      completed_at: null,
      expires_at: null,
    };

    // Convert to API response
    const response: ApiResponse<Analysis> = {
      success: true,
      data: result,
      meta: {
        requestId: 'aip_1234567890_abcdef',
        timestamp: new Date().toISOString(),
      },
    };

    expect(response.success).toBe(true);
    expect(response.data?.status).toBe('pending');
  });

  it('should work with gas tracker data flow', () => {
    // Create gas price insert
    const insert: TableInsert<'gas_prices'> = {
      chain: 'ethereum',
      gas_price: 25.5,
      block_number: 12345678,
      status: 'medium',
    };

    // Simulate database response
    const result: GasPrice = {
      id: 'uuid-here',
      chain: insert.chain,
      gas_price: insert.gas_price,
      block_number: insert.block_number,
      base_fee: 20,
      priority_fee: 5.5,
      status: insert.status,
      created_at: new Date().toISOString(),
    };

    // Convert to tracker data
    const trackerData: GasTrackerData = {
      chain: result.chain as Chain,
      gasPrice: Number(result.gas_price),
      baseFee: Number(result.base_fee),
      priorityFee: Number(result.priority_fee),
      status: result.status as GasStatus,
      blockNumber: result.block_number,
      updatedAt: result.created_at,
    };

    expect(trackerData.chain).toBe('ethereum');
    expect(trackerData.gasPrice).toBe(25.5);
  });
});
