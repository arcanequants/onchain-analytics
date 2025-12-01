/**
 * Test Data Factories
 *
 * Factory functions for generating test data
 *
 * Phase 3, Week 10, Day 1
 */

// ================================================================
// TYPES
// ================================================================

export interface FactoryOptions<T> {
  /** Override specific fields */
  overrides?: Partial<T>;
  /** Sequence number for unique values */
  sequence?: number;
  /** Custom traits to apply */
  traits?: string[];
}

export type FactoryDefinition<T> = {
  /** Default attribute generator */
  defaults: (sequence: number) => T;
  /** Named traits for variations */
  traits?: Record<string, Partial<T>>;
};

// ================================================================
// FACTORY BUILDER
// ================================================================

/**
 * Create a factory function for generating test data
 */
export function createFactory<T>(definition: FactoryDefinition<T>) {
  let globalSequence = 0;

  const factory = (options: FactoryOptions<T> = {}): T => {
    const { overrides = {}, sequence = ++globalSequence, traits = [] } = options;

    // Start with defaults
    let result = definition.defaults(sequence);

    // Apply traits
    for (const trait of traits) {
      if (definition.traits && definition.traits[trait]) {
        result = { ...result, ...definition.traits[trait] };
      }
    }

    // Apply overrides
    result = { ...result, ...overrides };

    return result;
  };

  // Helper to build multiple
  factory.buildList = (count: number, options: FactoryOptions<T> = {}): T[] => {
    return Array.from({ length: count }, (_, i) =>
      factory({ ...options, sequence: (options.sequence || 0) + i + 1 })
    );
  };

  // Reset sequence
  factory.resetSequence = () => {
    globalSequence = 0;
  };

  return factory;
}

// ================================================================
// COMMON FACTORIES
// ================================================================

/**
 * Generate a random UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * User profile factory
 */
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  plan: 'free' | 'starter' | 'pro';
  analyses_count: number;
  created_at: string;
  updated_at: string;
}

export const userFactory = createFactory<UserProfile>({
  defaults: (seq) => ({
    id: generateUUID(),
    email: `user${seq}@example.com`,
    display_name: `User ${seq}`,
    plan: 'free',
    analyses_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  traits: {
    starter: { plan: 'starter' },
    pro: { plan: 'pro' },
    active: { analyses_count: 10 },
    power: { plan: 'pro', analyses_count: 50 },
  },
});

/**
 * Analysis factory
 */
export interface Analysis {
  id: string;
  user_id: string | null;
  url: string;
  brand_name: string | null;
  industry: string | null;
  country: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  overall_score: number | null;
  created_at: string;
  completed_at: string | null;
}

export const analysisFactory = createFactory<Analysis>({
  defaults: (seq) => ({
    id: generateUUID(),
    user_id: generateUUID(),
    url: `https://example${seq}.com`,
    brand_name: `Brand ${seq}`,
    industry: 'Technology',
    country: 'US',
    status: 'completed',
    overall_score: 50 + (seq % 50),
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  }),
  traits: {
    pending: { status: 'pending', overall_score: null, completed_at: null },
    processing: { status: 'processing', overall_score: null, completed_at: null },
    failed: { status: 'failed', overall_score: null },
    excellent: { overall_score: 90 },
    poor: { overall_score: 25 },
    anonymous: { user_id: null },
  },
});

/**
 * AI Response factory
 */
export interface AIResponse {
  id: string;
  analysis_id: string;
  provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
  model: string;
  prompt_used: string;
  raw_response: string;
  mentions_brand: boolean;
  recommends: boolean;
  sentiment: 'positive' | 'neutral' | 'negative';
  position: number | null;
  context: string | null;
  score: number;
  tokens_used: number;
  latency_ms: number;
  created_at: string;
}

export const aiResponseFactory = createFactory<AIResponse>({
  defaults: (seq) => ({
    id: generateUUID(),
    analysis_id: generateUUID(),
    provider: seq % 2 === 0 ? 'openai' : 'anthropic',
    model: seq % 2 === 0 ? 'gpt-4o-mini' : 'claude-3-5-haiku-latest',
    prompt_used: `What are the best ${seq} tools?`,
    raw_response: `Here are some recommendations...`,
    mentions_brand: true,
    recommends: true,
    sentiment: 'positive',
    position: (seq % 5) + 1,
    context: 'Brand was mentioned as a top choice',
    score: 70 + (seq % 30),
    tokens_used: 500 + seq * 10,
    latency_ms: 1000 + seq * 100,
    created_at: new Date().toISOString(),
  }),
  traits: {
    openai: { provider: 'openai', model: 'gpt-4o-mini' },
    anthropic: { provider: 'anthropic', model: 'claude-3-5-haiku-latest' },
    google: { provider: 'google', model: 'gemini-1.5-flash' },
    notMentioned: { mentions_brand: false, recommends: false, position: null },
    negative: { sentiment: 'negative', recommends: false },
    slow: { latency_ms: 10000 },
  },
});

/**
 * Subscription factory
 */
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan: 'free' | 'starter' | 'pro';
  status: 'active' | 'canceled' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

export const subscriptionFactory = createFactory<Subscription>({
  defaults: (seq) => {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);

    return {
      id: generateUUID(),
      user_id: generateUUID(),
      stripe_customer_id: `cus_test${seq}`,
      stripe_subscription_id: `sub_test${seq}`,
      plan: 'starter',
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: end.toISOString(),
      created_at: now.toISOString(),
    };
  },
  traits: {
    pro: { plan: 'pro' },
    canceled: { status: 'canceled' },
    pastDue: { status: 'past_due' },
  },
});

/**
 * Recommendation factory
 */
export interface Recommendation {
  id: string;
  analysis_id: string;
  category: string;
  priority: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  impact_score: number;
  effort_score: number;
}

export const recommendationFactory = createFactory<Recommendation>({
  defaults: (seq) => ({
    id: generateUUID(),
    analysis_id: generateUUID(),
    category: ['content', 'technical', 'authority', 'social'][seq % 4],
    priority: Math.min(5, (seq % 5) + 1) as 1 | 2 | 3 | 4 | 5,
    title: `Recommendation ${seq}`,
    description: `This is recommendation ${seq} to improve your AI visibility.`,
    impact_score: 5 + (seq % 5),
    effort_score: 3 + (seq % 7),
  }),
  traits: {
    highImpact: { impact_score: 9, priority: 1 },
    lowEffort: { effort_score: 2, priority: 2 },
    quickWin: { impact_score: 8, effort_score: 2, priority: 1 },
  },
});

/**
 * API Key factory
 */
export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  rate_limit: number;
  usage_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export const apiKeyFactory = createFactory<ApiKey>({
  defaults: (seq) => ({
    id: generateUUID(),
    user_id: generateUUID(),
    name: `API Key ${seq}`,
    key_prefix: `aip_${seq.toString().padStart(4, '0')}`,
    key_hash: `hash_${generateUUID()}`,
    scopes: ['analyze:read', 'analyze:write'],
    rate_limit: 1000,
    usage_count: seq * 10,
    last_used_at: null,
    expires_at: null,
    created_at: new Date().toISOString(),
  }),
  traits: {
    expired: {
      expires_at: new Date(Date.now() - 86400000).toISOString()
    },
    readOnly: {
      scopes: ['analyze:read']
    },
    unlimited: {
      rate_limit: 0
    },
  },
});

/**
 * Webhook factory
 */
export interface Webhook {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  created_at: string;
}

export const webhookFactory = createFactory<Webhook>({
  defaults: (seq) => ({
    id: generateUUID(),
    user_id: generateUUID(),
    url: `https://webhook${seq}.example.com/hook`,
    secret: `whsec_${generateUUID()}`,
    events: ['analysis.completed'],
    active: true,
    failure_count: 0,
    last_triggered_at: null,
    created_at: new Date().toISOString(),
  }),
  traits: {
    inactive: { active: false },
    failing: { failure_count: 5 },
    allEvents: { events: ['analysis.completed', 'analysis.failed', 'score.changed'] },
  },
});

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Generate a random email
 */
export function randomEmail(domain = 'example.com'): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let name = '';
  for (let i = 0; i < 8; i++) {
    name += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${name}@${domain}`;
}

/**
 * Generate a random URL
 */
export function randomUrl(): string {
  const domains = ['example', 'test', 'demo', 'sample'];
  const tlds = ['com', 'io', 'co', 'dev'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const tld = tlds[Math.floor(Math.random() * tlds.length)];
  return `https://${domain}.${tld}`;
}

/**
 * Generate random score
 */
export function randomScore(min = 0, max = 100): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate ISO date string offset from now
 */
export function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

/**
 * Pick a random item from array
 */
export function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  createFactory,
  generateUUID,
  userFactory,
  analysisFactory,
  aiResponseFactory,
  subscriptionFactory,
  recommendationFactory,
  apiKeyFactory,
  webhookFactory,
  randomEmail,
  randomUrl,
  randomScore,
  dateOffset,
  randomPick,
};
