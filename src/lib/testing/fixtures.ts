/**
 * Test Fixtures
 *
 * Pre-defined test data fixtures for common scenarios
 *
 * Phase 3, Week 10, Day 1
 */

import {
  userFactory,
  analysisFactory,
  aiResponseFactory,
  subscriptionFactory,
  recommendationFactory,
  apiKeyFactory,
  webhookFactory,
  type UserProfile,
  type Analysis,
  type AIResponse,
  type Subscription,
  type Recommendation,
  type ApiKey,
  type Webhook,
} from './factories';

// ================================================================
// USER FIXTURES
// ================================================================

export const fixtures = {
  users: {
    /** Free tier user with no analyses */
    freeUser: (): UserProfile => userFactory({
      overrides: {
        id: 'user-free-001',
        email: 'free@example.com',
        display_name: 'Free User',
        plan: 'free',
        analyses_count: 0,
      },
    }),

    /** Starter tier user with some analyses */
    starterUser: (): UserProfile => userFactory({
      overrides: {
        id: 'user-starter-001',
        email: 'starter@example.com',
        display_name: 'Starter User',
        plan: 'starter',
        analyses_count: 15,
      },
    }),

    /** Pro tier power user */
    proUser: (): UserProfile => userFactory({
      overrides: {
        id: 'user-pro-001',
        email: 'pro@example.com',
        display_name: 'Pro User',
        plan: 'pro',
        analyses_count: 100,
      },
    }),

    /** Admin user */
    adminUser: (): UserProfile => userFactory({
      overrides: {
        id: 'user-admin-001',
        email: 'admin@example.com',
        display_name: 'Admin User',
        plan: 'pro',
        analyses_count: 50,
      },
    }),
  },

  // ================================================================
  // ANALYSIS FIXTURES
  // ================================================================

  analyses: {
    /** Completed analysis with high score */
    highScore: (): Analysis => analysisFactory({
      overrides: {
        id: 'analysis-high-001',
        url: 'https://successful-brand.com',
        brand_name: 'Successful Brand',
        industry: 'SaaS',
        status: 'completed',
        overall_score: 85,
      },
    }),

    /** Completed analysis with low score */
    lowScore: (): Analysis => analysisFactory({
      overrides: {
        id: 'analysis-low-001',
        url: 'https://struggling-brand.com',
        brand_name: 'Struggling Brand',
        industry: 'E-commerce',
        status: 'completed',
        overall_score: 25,
      },
    }),

    /** Analysis still in progress */
    inProgress: (): Analysis => analysisFactory({
      overrides: {
        id: 'analysis-progress-001',
        url: 'https://processing-brand.com',
        brand_name: 'Processing Brand',
        status: 'processing',
        overall_score: null,
        completed_at: null,
      },
    }),

    /** Failed analysis */
    failed: (): Analysis => analysisFactory({
      overrides: {
        id: 'analysis-failed-001',
        url: 'https://failed-analysis.com',
        brand_name: 'Failed Brand',
        status: 'failed',
        overall_score: null,
      },
    }),

    /** Anonymous analysis (no user) */
    anonymous: (): Analysis => analysisFactory({
      overrides: {
        id: 'analysis-anon-001',
        user_id: null,
        url: 'https://anonymous-analysis.com',
        brand_name: 'Anonymous Brand',
        status: 'completed',
        overall_score: 60,
      },
    }),
  },

  // ================================================================
  // AI RESPONSE FIXTURES
  // ================================================================

  aiResponses: {
    /** Positive OpenAI response */
    openaiPositive: (): AIResponse => aiResponseFactory({
      overrides: {
        id: 'ai-openai-pos-001',
        provider: 'openai',
        model: 'gpt-4o-mini',
        mentions_brand: true,
        recommends: true,
        sentiment: 'positive',
        position: 1,
        score: 90,
      },
    }),

    /** Negative Anthropic response */
    anthropicNegative: (): AIResponse => aiResponseFactory({
      overrides: {
        id: 'ai-anthropic-neg-001',
        provider: 'anthropic',
        model: 'claude-3-5-haiku-latest',
        mentions_brand: true,
        recommends: false,
        sentiment: 'negative',
        position: 8,
        score: 30,
      },
    }),

    /** Brand not mentioned */
    notMentioned: (): AIResponse => aiResponseFactory({
      overrides: {
        id: 'ai-not-mentioned-001',
        mentions_brand: false,
        recommends: false,
        sentiment: 'neutral',
        position: null,
        context: null,
        score: 0,
      },
    }),

    /** Slow response */
    slowResponse: (): AIResponse => aiResponseFactory({
      overrides: {
        id: 'ai-slow-001',
        latency_ms: 15000,
        tokens_used: 2000,
      },
    }),
  },

  // ================================================================
  // SUBSCRIPTION FIXTURES
  // ================================================================

  subscriptions: {
    /** Active starter subscription */
    activeStarter: (): Subscription => subscriptionFactory({
      overrides: {
        id: 'sub-starter-001',
        plan: 'starter',
        status: 'active',
      },
    }),

    /** Active pro subscription */
    activePro: (): Subscription => subscriptionFactory({
      overrides: {
        id: 'sub-pro-001',
        plan: 'pro',
        status: 'active',
      },
    }),

    /** Canceled subscription */
    canceled: (): Subscription => subscriptionFactory({
      overrides: {
        id: 'sub-canceled-001',
        status: 'canceled',
      },
    }),

    /** Past due subscription */
    pastDue: (): Subscription => subscriptionFactory({
      overrides: {
        id: 'sub-past-due-001',
        status: 'past_due',
      },
    }),
  },

  // ================================================================
  // RECOMMENDATION FIXTURES
  // ================================================================

  recommendations: {
    /** High-impact quick win */
    quickWin: (): Recommendation => recommendationFactory({
      overrides: {
        id: 'rec-quickwin-001',
        category: 'content',
        priority: 1,
        title: 'Add Schema.org markup',
        description: 'Implement Organization and Product schema to improve AI understanding.',
        impact_score: 9,
        effort_score: 2,
      },
    }),

    /** Technical improvement */
    technical: (): Recommendation => recommendationFactory({
      overrides: {
        id: 'rec-tech-001',
        category: 'technical',
        priority: 2,
        title: 'Improve page load speed',
        description: 'Optimize images and enable caching to improve AI crawlability.',
        impact_score: 7,
        effort_score: 5,
      },
    }),

    /** Long-term authority building */
    authority: (): Recommendation => recommendationFactory({
      overrides: {
        id: 'rec-auth-001',
        category: 'authority',
        priority: 3,
        title: 'Build Wikipedia presence',
        description: 'Create or improve Wikipedia article for better AI knowledge graph presence.',
        impact_score: 8,
        effort_score: 8,
      },
    }),
  },

  // ================================================================
  // API KEY FIXTURES
  // ================================================================

  apiKeys: {
    /** Valid active key */
    validKey: (): ApiKey => apiKeyFactory({
      overrides: {
        id: 'key-valid-001',
        name: 'Production Key',
        scopes: ['analyze:read', 'analyze:write'],
        usage_count: 500,
      },
    }),

    /** Read-only key */
    readOnlyKey: (): ApiKey => apiKeyFactory({
      overrides: {
        id: 'key-readonly-001',
        name: 'Read Only Key',
        scopes: ['analyze:read'],
      },
    }),

    /** Expired key */
    expiredKey: (): ApiKey => apiKeyFactory({
      overrides: {
        id: 'key-expired-001',
        name: 'Expired Key',
        expires_at: new Date(Date.now() - 86400000).toISOString(),
      },
    }),

    /** Rate limited key */
    rateLimitedKey: (): ApiKey => apiKeyFactory({
      overrides: {
        id: 'key-limited-001',
        name: 'Limited Key',
        rate_limit: 10,
        usage_count: 10,
      },
    }),
  },

  // ================================================================
  // WEBHOOK FIXTURES
  // ================================================================

  webhooks: {
    /** Active webhook */
    activeWebhook: (): Webhook => webhookFactory({
      overrides: {
        id: 'webhook-active-001',
        url: 'https://api.example.com/webhooks/aip',
        events: ['analysis.completed'],
        active: true,
        failure_count: 0,
      },
    }),

    /** Failing webhook */
    failingWebhook: (): Webhook => webhookFactory({
      overrides: {
        id: 'webhook-failing-001',
        url: 'https://broken.example.com/webhook',
        active: true,
        failure_count: 5,
      },
    }),

    /** Disabled webhook */
    disabledWebhook: (): Webhook => webhookFactory({
      overrides: {
        id: 'webhook-disabled-001',
        url: 'https://disabled.example.com/webhook',
        active: false,
      },
    }),
  },
};

// ================================================================
// SCENARIO FIXTURES
// ================================================================

/**
 * Complete scenario fixtures for integration testing
 */
export const scenarios = {
  /**
   * New free user with first analysis
   */
  newUserFirstAnalysis: () => {
    const user = fixtures.users.freeUser();
    const analysis = analysisFactory({
      overrides: {
        user_id: user.id,
        status: 'pending',
        overall_score: null,
      },
    });

    return { user, analysis };
  },

  /**
   * Completed analysis with full data
   */
  completedAnalysisWithResponses: () => {
    const user = fixtures.users.starterUser();
    const analysis = fixtures.analyses.highScore();
    const responses = [
      aiResponseFactory({
        overrides: {
          analysis_id: analysis.id,
          provider: 'openai',
          score: 85,
        },
      }),
      aiResponseFactory({
        overrides: {
          analysis_id: analysis.id,
          provider: 'anthropic',
          score: 88,
        },
      }),
    ];
    const recommendations = recommendationFactory.buildList(3, {
      overrides: { analysis_id: analysis.id },
    });

    return { user, analysis, responses, recommendations };
  },

  /**
   * Pro user with subscription and API key
   */
  proUserWithSubscription: () => {
    const user = fixtures.users.proUser();
    const subscription = subscriptionFactory({
      overrides: {
        user_id: user.id,
        plan: 'pro',
        status: 'active',
      },
    });
    const apiKey = apiKeyFactory({
      overrides: {
        user_id: user.id,
        scopes: ['analyze:read', 'analyze:write', 'webhooks:manage'],
      },
    });
    const webhook = webhookFactory({
      overrides: {
        user_id: user.id,
        active: true,
      },
    });

    return { user, subscription, apiKey, webhook };
  },

  /**
   * User hitting rate limits
   */
  userAtRateLimit: () => {
    const user = fixtures.users.freeUser();
    const analyses = analysisFactory.buildList(5, {
      overrides: { user_id: user.id },
    });

    return { user, analyses, limitReached: true };
  },

  /**
   * Analysis comparison scenario
   */
  analysisComparison: () => {
    const user = fixtures.users.proUser();
    const before = analysisFactory({
      overrides: {
        user_id: user.id,
        overall_score: 45,
        created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
    });
    const after = analysisFactory({
      overrides: {
        user_id: user.id,
        url: before.url,
        overall_score: 72,
      },
    });

    return { user, before, after, improvement: 27 };
  },
};

// ================================================================
// EXPORTS
// ================================================================

export default {
  fixtures,
  scenarios,
};
