/**
 * Mock Data Factories
 *
 * Factories for generating realistic test data for all main entities.
 * Used in unit tests, integration tests, and development seeding.
 *
 * Usage:
 *   import { UserFactory, AnalysisFactory } from '@/lib/dev/factories';
 *
 *   // Create a single entity
 *   const user = UserFactory.build();
 *
 *   // Create with overrides
 *   const premiumUser = UserFactory.build({ plan: 'professional' });
 *
 *   // Create multiple entities
 *   const users = UserFactory.buildList(10);
 *
 *   // Create with associated entities
 *   const userWithAnalyses = UserFactory.build({}, { withAnalyses: 5 });
 */

import * as crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export interface FactoryBuildOptions {
  withAnalyses?: number;
  withFeedback?: number;
  withSubscription?: boolean;
  withApiKey?: boolean;
}

export interface Factory<T> {
  build(overrides?: Partial<T>, options?: FactoryBuildOptions): T;
  buildList(count: number, overrides?: Partial<T>, options?: FactoryBuildOptions): T[];
  sequence: number;
  reset(): void;
}

// ============================================================================
// Utility Functions
// ============================================================================

function uuid(): string {
  return crypto.randomUUID();
}

function randomAddress(): string {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max));
}

function randomChoice<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length)];
}

function randomDate(daysBack: number = 30): Date {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date;
}

function randomDateString(daysBack: number = 30): string {
  return randomDate(daysBack).toISOString();
}

function createFactory<T>(defaults: (seq: number) => T): Factory<T> {
  let sequence = 1;

  return {
    get sequence() {
      return sequence;
    },
    build(overrides?: Partial<T>, _options?: FactoryBuildOptions): T {
      const result = { ...defaults(sequence), ...overrides };
      sequence++;
      return result;
    },
    buildList(count: number, overrides?: Partial<T>, options?: FactoryBuildOptions): T[] {
      return Array.from({ length: count }, () => this.build(overrides, options));
    },
    reset() {
      sequence = 1;
    },
  };
}

// ============================================================================
// Domain Constants
// ============================================================================

const PLANS = ['free', 'starter', 'professional', 'enterprise'] as const;
const BILLING_CYCLES = ['monthly', 'annual'] as const;
const ANALYSIS_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
const AI_PROVIDERS = ['openai', 'anthropic', 'google', 'perplexity'] as const;
const INDUSTRIES = [
  'technology', 'finance', 'healthcare', 'retail', 'manufacturing',
  'education', 'media', 'travel', 'automotive', 'real_estate',
] as const;
const CHAINS = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc'] as const;
const TOKEN_SYMBOLS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'LINK', 'UNI'] as const;
const FEEDBACK_TYPES = ['thumbs_up', 'thumbs_down', 'rating', 'correction'] as const;
const SEVERITY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;
const ALERT_STATUSES = ['open', 'acknowledged', 'resolved', 'dismissed'] as const;

// ============================================================================
// User Factory
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  plan: typeof PLANS[number];
  billing_cycle: typeof BILLING_CYCLES[number];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  analysis_count: number;
  analysis_limit: number;
  referral_code: string;
  referred_by: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
  metadata: Record<string, unknown>;
}

export const UserFactory = createFactory<User>((seq) => {
  const id = uuid();
  const plan = randomChoice(PLANS);

  return {
    id,
    email: `user${seq}@example.com`,
    name: `Test User ${seq}`,
    avatar_url: Math.random() > 0.3 ? `https://i.pravatar.cc/150?u=${id}` : null,
    plan,
    billing_cycle: randomChoice(BILLING_CYCLES),
    stripe_customer_id: plan !== 'free' ? `cus_test${seq}` : null,
    stripe_subscription_id: plan !== 'free' ? `sub_test${seq}` : null,
    analysis_count: randomInt(0, 50),
    analysis_limit: plan === 'free' ? 5 : plan === 'starter' ? 50 : plan === 'professional' ? 500 : 10000,
    referral_code: `REF${id.slice(0, 8).toUpperCase()}`,
    referred_by: Math.random() > 0.8 ? uuid() : null,
    email_verified: Math.random() > 0.1,
    created_at: randomDateString(365),
    updated_at: randomDateString(30),
    last_login_at: Math.random() > 0.2 ? randomDateString(7) : null,
    metadata: {},
  };
});

// ============================================================================
// Analysis Factory
// ============================================================================

export interface Analysis {
  id: string;
  user_id: string;
  url: string;
  domain: string;
  status: typeof ANALYSIS_STATUSES[number];
  overall_score: number | null;
  industry: typeof INDUSTRIES[number];
  created_at: string;
  completed_at: string | null;
  processing_time_ms: number | null;
  error_message: string | null;
  metadata: {
    user_agent?: string;
    ip_country?: string;
    referrer?: string;
  };
}

export const AnalysisFactory = createFactory<Analysis>((seq) => {
  const id = uuid();
  const status = randomChoice(ANALYSIS_STATUSES);
  const domain = `example${seq}.com`;

  return {
    id,
    user_id: uuid(),
    url: `https://${domain}`,
    domain,
    status,
    overall_score: status === 'completed' ? randomInt(30, 95) : null,
    industry: randomChoice(INDUSTRIES),
    created_at: randomDateString(30),
    completed_at: status === 'completed' ? randomDateString(7) : null,
    processing_time_ms: status === 'completed' ? randomInt(5000, 45000) : null,
    error_message: status === 'failed' ? 'Analysis failed due to timeout' : null,
    metadata: {
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      ip_country: 'US',
    },
  };
});

// ============================================================================
// AI Response Factory
// ============================================================================

export interface AIResponse {
  id: string;
  analysis_id: string;
  provider: typeof AI_PROVIDERS[number];
  model: string;
  prompt_hash: string;
  response_text: string;
  score: number;
  confidence: number;
  tokens_input: number;
  tokens_output: number;
  cost_usd: number;
  latency_ms: number;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const AIResponseFactory = createFactory<AIResponse>((_seq) => {
  const provider = randomChoice(AI_PROVIDERS);
  const models: Record<typeof AI_PROVIDERS[number], string> = {
    openai: 'gpt-4-turbo',
    anthropic: 'claude-3-sonnet',
    google: 'gemini-pro',
    perplexity: 'pplx-70b-online',
  };

  return {
    id: uuid(),
    analysis_id: uuid(),
    provider,
    model: models[provider],
    prompt_hash: crypto.randomBytes(16).toString('hex'),
    response_text: JSON.stringify({
      score: randomInt(40, 90),
      reasoning: 'Analysis reasoning...',
      recommendations: ['Recommendation 1', 'Recommendation 2'],
    }),
    score: randomInt(40, 90),
    confidence: randomFloat(0.6, 0.95),
    tokens_input: randomInt(500, 2000),
    tokens_output: randomInt(200, 800),
    cost_usd: randomFloat(0.01, 0.15),
    latency_ms: randomInt(1000, 8000),
    created_at: randomDateString(30),
    metadata: {},
  };
});

// ============================================================================
// Recommendation Factory
// ============================================================================

export interface Recommendation {
  id: string;
  analysis_id: string;
  category: string;
  priority: number;
  title: string;
  description: string;
  impact_score: number;
  effort_score: number;
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
  completed_at: string | null;
}

export const RecommendationFactory = createFactory<Recommendation>((seq) => {
  const categories = ['content', 'technical', 'authority', 'engagement', 'trust'];
  const status = randomChoice(['pending', 'in_progress', 'completed', 'dismissed'] as const);

  return {
    id: uuid(),
    analysis_id: uuid(),
    category: randomChoice(categories),
    priority: randomInt(1, 5),
    title: `Recommendation ${seq}`,
    description: 'This is a detailed recommendation description with actionable steps.',
    impact_score: randomInt(1, 10),
    effort_score: randomInt(1, 10),
    status,
    created_at: randomDateString(30),
    completed_at: status === 'completed' ? randomDateString(7) : null,
  };
});

// ============================================================================
// Subscription Factory
// ============================================================================

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan: typeof PLANS[number];
  status: 'active' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const SubscriptionFactory = createFactory<Subscription>((_seq) => {
  const status = randomChoice(['active', 'past_due', 'canceled', 'incomplete'] as const);
  const periodStart = new Date();
  periodStart.setMonth(periodStart.getMonth() - 1);
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return {
    id: uuid(),
    user_id: uuid(),
    stripe_subscription_id: `sub_${crypto.randomBytes(12).toString('hex')}`,
    stripe_customer_id: `cus_${crypto.randomBytes(12).toString('hex')}`,
    plan: randomChoice(['starter', 'professional', 'enterprise'] as const),
    status,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd.toISOString(),
    cancel_at_period_end: Math.random() > 0.9,
    canceled_at: status === 'canceled' ? randomDateString(7) : null,
    created_at: randomDateString(180),
    metadata: {},
  };
});

// ============================================================================
// User Feedback Factory
// ============================================================================

export interface UserFeedback {
  id: string;
  user_id: string;
  analysis_id: string | null;
  recommendation_id: string | null;
  feedback_type: typeof FEEDBACK_TYPES[number];
  rating: number | null;
  comment: string | null;
  is_helpful: boolean | null;
  correction_data: Record<string, unknown> | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const UserFeedbackFactory = createFactory<UserFeedback>((_seq) => {
  const feedbackType = randomChoice(FEEDBACK_TYPES);

  return {
    id: uuid(),
    user_id: uuid(),
    analysis_id: Math.random() > 0.3 ? uuid() : null,
    recommendation_id: Math.random() > 0.5 ? uuid() : null,
    feedback_type: feedbackType,
    rating: feedbackType === 'rating' ? randomInt(1, 5) : null,
    comment: Math.random() > 0.5 ? 'This feedback is really helpful.' : null,
    is_helpful: feedbackType === 'thumbs_up' ? true : feedbackType === 'thumbs_down' ? false : null,
    correction_data: feedbackType === 'correction' ? { corrected_score: randomInt(50, 90) } : null,
    created_at: randomDateString(30),
    metadata: {},
  };
});

// ============================================================================
// API Key Factory
// ============================================================================

export interface ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_hash: string;
  key_prefix: string;
  scopes: string[];
  rate_limit: number;
  usage_count: number;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export const ApiKeyFactory = createFactory<ApiKey>((seq) => {
  const key = crypto.randomBytes(24).toString('base64url');

  return {
    id: uuid(),
    user_id: uuid(),
    name: `API Key ${seq}`,
    key_hash: crypto.createHash('sha256').update(key).digest('hex'),
    key_prefix: key.slice(0, 8),
    scopes: ['analysis:read', 'analysis:write'],
    rate_limit: 1000,
    usage_count: randomInt(0, 500),
    last_used_at: Math.random() > 0.3 ? randomDateString(7) : null,
    expires_at: Math.random() > 0.8 ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() : null,
    is_active: Math.random() > 0.1,
    created_at: randomDateString(90),
  };
});

// ============================================================================
// Token Price Factory
// ============================================================================

export interface TokenPrice {
  id: string;
  coingecko_id: string;
  symbol: typeof TOKEN_SYMBOLS[number];
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  last_updated: string;
}

export const TokenPriceFactory = createFactory<TokenPrice>((_seq) => {
  const symbol = randomChoice(TOKEN_SYMBOLS);
  const basePrices: Record<typeof TOKEN_SYMBOLS[number], number> = {
    BTC: 97500, ETH: 3650, SOL: 235, BNB: 680, XRP: 2.35,
    ADA: 1.05, AVAX: 48, DOT: 9.5, LINK: 24, UNI: 14.5,
  };
  const basePrice = basePrices[symbol];

  return {
    id: uuid(),
    coingecko_id: symbol.toLowerCase(),
    symbol,
    name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : `${symbol} Token`,
    current_price: basePrice * randomFloat(0.95, 1.05),
    market_cap: basePrice * randomFloat(1e9, 1e12),
    market_cap_rank: randomInt(1, 100),
    total_volume: basePrice * randomFloat(1e7, 1e10),
    price_change_24h: basePrice * randomFloat(-0.1, 0.1),
    price_change_percentage_24h: randomFloat(-10, 10),
    circulating_supply: randomFloat(1e6, 1e9),
    total_supply: Math.random() > 0.3 ? randomFloat(1e6, 1e10) : null,
    ath: basePrice * randomFloat(1.5, 3),
    ath_date: randomDateString(365),
    atl: basePrice * randomFloat(0.01, 0.3),
    atl_date: randomDateString(1000),
    last_updated: new Date().toISOString(),
  };
});

// ============================================================================
// Wallet Factory
// ============================================================================

export interface Wallet {
  id: string;
  address: string;
  label: string | null;
  chain: typeof CHAINS[number];
  first_seen: string;
  last_activity: string;
  is_active: boolean;
  tags: string[];
  total_value_usd: number;
  created_at: string;
  updated_at: string;
}

export const WalletFactory = createFactory<Wallet>((_seq) => {
  const labels = ['Whale', 'DeFi Degen', 'NFT Collector', 'DAO Treasury', 'Market Maker'];

  return {
    id: uuid(),
    address: randomAddress(),
    label: Math.random() > 0.4 ? randomChoice(labels) : null,
    chain: randomChoice(CHAINS),
    first_seen: randomDateString(365),
    last_activity: randomDateString(30),
    is_active: Math.random() > 0.2,
    tags: Array.from({ length: randomInt(0, 4) }, () =>
      randomChoice(['whale', 'degen', 'trader', 'holder', 'bot', 'dao'])
    ),
    total_value_usd: randomFloat(1000, 10000000),
    created_at: randomDateString(365),
    updated_at: randomDateString(7),
  };
});

// ============================================================================
// Wallet Balance Factory
// ============================================================================

export interface WalletBalance {
  id: string;
  wallet_id: string;
  wallet_address: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_usd: number;
  chain: typeof CHAINS[number];
  last_updated: string;
}

export const WalletBalanceFactory = createFactory<WalletBalance>((_seq) => {
  const symbol = randomChoice(TOKEN_SYMBOLS);

  return {
    id: uuid(),
    wallet_id: uuid(),
    wallet_address: randomAddress(),
    token_address: randomAddress(),
    token_symbol: symbol,
    token_name: `${symbol} Token`,
    balance: randomFloat(0.01, 1000).toFixed(8),
    balance_usd: randomFloat(100, 500000),
    chain: randomChoice(CHAINS),
    last_updated: new Date().toISOString(),
  };
});

// ============================================================================
// Protocol TVL Factory
// ============================================================================

export interface ProtocolTVL {
  id: string;
  protocol_id: string;
  protocol_name: string;
  chain: string;
  category: string;
  tvl: number;
  tvl_change_1d: number;
  tvl_change_7d: number;
  chains_supported: string[];
  last_updated: string;
}

export const ProtocolTVLFactory = createFactory<ProtocolTVL>((seq) => {
  const protocols = ['Aave', 'Uniswap', 'Lido', 'MakerDAO', 'Curve', 'Compound'];
  const categories = ['Lending', 'DEX', 'Liquid Staking', 'CDP', 'Yield'];

  return {
    id: uuid(),
    protocol_id: `protocol_${seq}`,
    protocol_name: randomChoice(protocols),
    chain: randomChoice([...CHAINS, 'multi-chain']),
    category: randomChoice(categories),
    tvl: randomFloat(1e8, 25e9),
    tvl_change_1d: randomFloat(-5, 5),
    tvl_change_7d: randomFloat(-15, 15),
    chains_supported: Array.from({ length: randomInt(1, 5) }, () => randomChoice(CHAINS)),
    last_updated: new Date().toISOString(),
  };
});

// ============================================================================
// Gas Metric Factory
// ============================================================================

export interface GasMetric {
  id: string;
  chain: typeof CHAINS[number];
  block_number: number;
  base_fee_gwei: number;
  priority_fee_gwei: number;
  gas_used: number;
  gas_limit: number;
  utilization_percent: number;
  timestamp: string;
}

export const GasMetricFactory = createFactory<GasMetric>((seq) => {
  const chain = randomChoice(CHAINS);
  const isL2 = ['base', 'arbitrum', 'optimism'].includes(chain);

  return {
    id: uuid(),
    chain,
    block_number: 20000000 + seq,
    base_fee_gwei: isL2 ? randomFloat(0.001, 0.01) : randomFloat(10, 50),
    priority_fee_gwei: isL2 ? randomFloat(0.0001, 0.005) : randomFloat(1, 10),
    gas_used: randomInt(8000000, 15000000),
    gas_limit: 15000000,
    utilization_percent: randomFloat(50, 95),
    timestamp: new Date().toISOString(),
  };
});

// ============================================================================
// Cron Execution Factory
// ============================================================================

export interface CronExecution {
  id: string;
  job_name: string;
  status: 'success' | 'error' | 'running';
  started_at: string;
  completed_at: string | null;
  execution_time: number | null;
  metadata: Record<string, unknown>;
  error_message: string | null;
}

export const CronExecutionFactory = createFactory<CronExecution>((_seq) => {
  const jobNames = ['collect-prices', 'collect-tvl', 'collect-gas', 'sync-wallets', 'cleanup-old-data'];
  const status = randomChoice(['success', 'error', 'running'] as const);
  const startTime = randomDate(7);

  return {
    id: uuid(),
    job_name: randomChoice(jobNames),
    status,
    started_at: startTime.toISOString(),
    completed_at: status !== 'running' ? new Date(startTime.getTime() + randomInt(1000, 30000)).toISOString() : null,
    execution_time: status !== 'running' ? randomInt(1000, 30000) : null,
    metadata: { records_processed: randomInt(10, 1000) },
    error_message: status === 'error' ? 'API rate limit exceeded' : null,
  };
});

// ============================================================================
// Alert Factory
// ============================================================================

export interface Alert {
  id: string;
  user_id: string | null;
  type: string;
  severity: typeof SEVERITY_LEVELS[number];
  title: string;
  message: string;
  status: typeof ALERT_STATUSES[number];
  source: string;
  entity_type: string | null;
  entity_id: string | null;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const AlertFactory = createFactory<Alert>((seq) => {
  const types = ['score_drop', 'api_error', 'rate_limit', 'payment_failed', 'security_warning'];
  const status = randomChoice(ALERT_STATUSES);
  const sources = ['monitoring', 'billing', 'security', 'api', 'cron'];

  return {
    id: uuid(),
    user_id: Math.random() > 0.3 ? uuid() : null,
    type: randomChoice(types),
    severity: randomChoice(SEVERITY_LEVELS),
    title: `Alert ${seq}`,
    message: 'This is an alert message with details about the issue.',
    status,
    source: randomChoice(sources),
    entity_type: Math.random() > 0.5 ? 'analysis' : null,
    entity_id: Math.random() > 0.5 ? uuid() : null,
    acknowledged_at: ['acknowledged', 'resolved'].includes(status) ? randomDateString(3) : null,
    acknowledged_by: ['acknowledged', 'resolved'].includes(status) ? uuid() : null,
    resolved_at: status === 'resolved' ? randomDateString(1) : null,
    resolved_by: status === 'resolved' ? uuid() : null,
    created_at: randomDateString(7),
    metadata: {},
  };
});

// ============================================================================
// Feature Flag Factory
// ============================================================================

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout_percentage: number;
  targeting_rules: Record<string, unknown>[];
  is_kill_switch: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export const FeatureFlagFactory = createFactory<FeatureFlag>((seq) => {
  const keys = ['new_dashboard', 'ai_v2', 'dark_mode', 'beta_features', 'advanced_analytics'];

  return {
    id: uuid(),
    key: randomChoice(keys) + '_' + seq,
    name: `Feature ${seq}`,
    description: 'A feature flag for testing purposes.',
    enabled: Math.random() > 0.3,
    rollout_percentage: randomChoice([0, 10, 25, 50, 75, 100]),
    targeting_rules: Math.random() > 0.5 ? [{ type: 'user_ids', values: [uuid()] }] : [],
    is_kill_switch: Math.random() > 0.9,
    created_at: randomDateString(90),
    updated_at: randomDateString(7),
    created_by: uuid(),
  };
});

// ============================================================================
// Preference Pair Factory (RLHF)
// ============================================================================

export interface PreferencePair {
  id: string;
  user_id: string;
  analysis_id: string;
  response_a_id: string;
  response_b_id: string;
  preferred: 'a' | 'b' | 'tie';
  confidence: number;
  reasoning: string | null;
  is_synthetic: boolean;
  created_at: string;
}

export const PreferencePairFactory = createFactory<PreferencePair>((_seq) => ({
  id: uuid(),
  user_id: uuid(),
  analysis_id: uuid(),
  response_a_id: uuid(),
  response_b_id: uuid(),
  preferred: randomChoice(['a', 'b', 'tie'] as const),
  confidence: randomFloat(0.5, 1.0),
  reasoning: Math.random() > 0.5 ? 'Response A was more helpful and accurate.' : null,
  is_synthetic: Math.random() > 0.8,
  created_at: randomDateString(30),
}));

// ============================================================================
// Exports
// ============================================================================

export const Factories = {
  User: UserFactory,
  Analysis: AnalysisFactory,
  AIResponse: AIResponseFactory,
  Recommendation: RecommendationFactory,
  Subscription: SubscriptionFactory,
  UserFeedback: UserFeedbackFactory,
  ApiKey: ApiKeyFactory,
  TokenPrice: TokenPriceFactory,
  Wallet: WalletFactory,
  WalletBalance: WalletBalanceFactory,
  ProtocolTVL: ProtocolTVLFactory,
  GasMetric: GasMetricFactory,
  CronExecution: CronExecutionFactory,
  Alert: AlertFactory,
  FeatureFlag: FeatureFlagFactory,
  PreferencePair: PreferencePairFactory,
};

export default Factories;

// ============================================================================
// Reset all factories
// ============================================================================

export function resetAllFactories(): void {
  Object.values(Factories).forEach((factory) => factory.reset());
}

// ============================================================================
// Batch creation helpers
// ============================================================================

export function createUserWithAnalyses(
  userOverrides?: Partial<User>,
  analysisCount: number = 5
): { user: User; analyses: Analysis[] } {
  const user = UserFactory.build(userOverrides);
  const analyses = AnalysisFactory.buildList(analysisCount, { user_id: user.id });
  return { user, analyses };
}

export function createAnalysisWithResponses(
  analysisOverrides?: Partial<Analysis>,
  responseCount: number = 4
): { analysis: Analysis; responses: AIResponse[] } {
  const analysis = AnalysisFactory.build(analysisOverrides);
  const responses = AIResponseFactory.buildList(responseCount, { analysis_id: analysis.id });
  return { analysis, responses };
}

export function createFullAnalysisScenario(): {
  user: User;
  analysis: Analysis;
  responses: AIResponse[];
  recommendations: Recommendation[];
  feedback: UserFeedback[];
} {
  const user = UserFactory.build({ plan: 'professional' });
  const analysis = AnalysisFactory.build({ user_id: user.id, status: 'completed' });
  const responses = AIResponseFactory.buildList(4, { analysis_id: analysis.id });
  const recommendations = RecommendationFactory.buildList(5, { analysis_id: analysis.id });
  const feedback = UserFeedbackFactory.buildList(2, { user_id: user.id, analysis_id: analysis.id });

  return { user, analysis, responses, recommendations, feedback };
}
