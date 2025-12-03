/**
 * Database Seeding Scripts
 *
 * Usage:
 *   npx ts-node scripts/seed-database.ts --scenario=<scenario>
 *
 * Available scenarios:
 *   1. empty       - Clean database (development reset)
 *   2. minimal     - Basic data for quick testing
 *   3. realistic   - Production-like data for demo/staging
 *   4. stress-test - Large dataset for performance testing
 *   5. edge-cases  - Boundary conditions and edge cases
 */

import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

interface SeedScenario {
  name: string;
  description: string;
  seed: () => Promise<void>;
}

interface TokenPrice {
  coingecko_id: string;
  symbol: string;
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

interface ProtocolTVL {
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

interface TrackedWallet {
  address: string;
  label: string | null;
  chain: string;
  first_seen: string;
  last_activity: string;
  is_active: boolean;
  tags: string[];
}

interface WalletBalance {
  wallet_address: string;
  token_address: string;
  token_symbol: string;
  token_name: string;
  balance: string;
  balance_usd: number;
  chain: string;
  last_updated: string;
}

interface GasMetric {
  chain: string;
  block_number: number;
  base_fee_gwei: number;
  priority_fee_gwei: number;
  gas_used: number;
  gas_limit: number;
  utilization_percent: number;
  timestamp: string;
}

interface CronExecution {
  job_name: string;
  status: 'success' | 'error' | 'running';
  started_at: string;
  completed_at: string | null;
  execution_time: number | null;
  metadata: Record<string, unknown>;
  error_message: string | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

function randomAddress(): string {
  return '0x' + crypto.randomBytes(20).toString('hex');
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat(min, max));
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length)];
}

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toISOString();
}

function generatePriceHistory(
  basePrice: number,
  days: number,
  volatility: number = 0.05
): { date: string; price: number }[] {
  const history: { date: string; price: number }[] = [];
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.5) * 2 * volatility;
    currentPrice = currentPrice * (1 + change);

    history.push({
      date: date.toISOString().split('T')[0],
      price: currentPrice,
    });
  }

  return history;
}

async function clearTables(tables: string[]): Promise<void> {
  console.log('Clearing tables...');
  for (const table of tables) {
    try {
      await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      console.log(`  Cleared: ${table}`);
    } catch (error) {
      console.log(`  Skipped (may not exist): ${table}`);
    }
  }
}

async function insertBatch(
  table: string,
  data: unknown[],
  batchSize: number = 100
): Promise<void> {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`Error inserting into ${table}:`, error.message);
    } else {
      console.log(`  Inserted ${i + batch.length}/${data.length} rows into ${table}`);
    }
  }
}

// ============================================================================
// Data Generators
// ============================================================================

const TOKENS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', basePrice: 97500, marketCap: 1900000000000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', basePrice: 3650, marketCap: 440000000000 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', basePrice: 235, marketCap: 110000000000 },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', basePrice: 680, marketCap: 100000000000 },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', basePrice: 2.35, marketCap: 130000000000 },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', basePrice: 1.05, marketCap: 37000000000 },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', basePrice: 48, marketCap: 19000000000 },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', basePrice: 9.5, marketCap: 14000000000 },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', basePrice: 24, marketCap: 15000000000 },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', basePrice: 14.5, marketCap: 11000000000 },
  { id: 'arbitrum', symbol: 'ARB', name: 'Arbitrum', basePrice: 1.15, marketCap: 4500000000 },
  { id: 'optimism', symbol: 'OP', name: 'Optimism', basePrice: 2.8, marketCap: 3200000000 },
  { id: 'base', symbol: 'BASE', name: 'Base', basePrice: 0.85, marketCap: 850000000 },
  { id: 'polygon-ecosystem-token', symbol: 'POL', name: 'Polygon', basePrice: 0.65, marketCap: 6500000000 },
  { id: 'lido-dao', symbol: 'LDO', name: 'Lido DAO', basePrice: 2.1, marketCap: 1900000000 },
];

const PROTOCOLS = [
  { id: 'lido', name: 'Lido', chain: 'ethereum', category: 'Liquid Staking', baseTvl: 25000000000 },
  { id: 'aave', name: 'Aave', chain: 'multi-chain', category: 'Lending', baseTvl: 18000000000 },
  { id: 'uniswap', name: 'Uniswap', chain: 'multi-chain', category: 'DEX', baseTvl: 7500000000 },
  { id: 'makerdao', name: 'MakerDAO', chain: 'ethereum', category: 'CDP', baseTvl: 8200000000 },
  { id: 'eigenlayer', name: 'EigenLayer', chain: 'ethereum', category: 'Restaking', baseTvl: 15000000000 },
  { id: 'curve', name: 'Curve Finance', chain: 'multi-chain', category: 'DEX', baseTvl: 2500000000 },
  { id: 'compound', name: 'Compound', chain: 'ethereum', category: 'Lending', baseTvl: 2800000000 },
  { id: 'rocket-pool', name: 'Rocket Pool', chain: 'ethereum', category: 'Liquid Staking', baseTvl: 4200000000 },
  { id: 'gmx', name: 'GMX', chain: 'arbitrum', category: 'Derivatives', baseTvl: 620000000 },
  { id: 'pancakeswap', name: 'PancakeSwap', chain: 'bsc', category: 'DEX', baseTvl: 2100000000 },
];

const CHAINS = ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche', 'solana'];

const WALLET_LABELS = [
  'Whale 1', 'DeFi Degen', 'Yield Farmer', 'NFT Collector', 'DAO Treasury',
  'Market Maker', 'Arbitrageur', 'Long-term Holder', 'Active Trader', 'Smart Money',
];

function generateTokenPrices(count: number): TokenPrice[] {
  const tokens = TOKENS.slice(0, Math.min(count, TOKENS.length));
  return tokens.map((token, index) => ({
    coingecko_id: token.id,
    symbol: token.symbol,
    name: token.name,
    current_price: token.basePrice * randomFloat(0.95, 1.05),
    market_cap: token.marketCap * randomFloat(0.95, 1.05),
    market_cap_rank: index + 1,
    total_volume: token.marketCap * randomFloat(0.02, 0.1),
    price_change_24h: token.basePrice * randomFloat(-0.1, 0.1),
    price_change_percentage_24h: randomFloat(-10, 10),
    circulating_supply: token.marketCap / token.basePrice,
    total_supply: Math.random() > 0.3 ? token.marketCap / token.basePrice * 1.2 : null,
    ath: token.basePrice * randomFloat(1.5, 3),
    ath_date: randomDate(365),
    atl: token.basePrice * randomFloat(0.01, 0.3),
    atl_date: randomDate(1000),
    last_updated: new Date().toISOString(),
  }));
}

function generateProtocolTVL(count: number): ProtocolTVL[] {
  const protocols = PROTOCOLS.slice(0, Math.min(count, PROTOCOLS.length));
  return protocols.map(protocol => ({
    protocol_id: protocol.id,
    protocol_name: protocol.name,
    chain: protocol.chain,
    category: protocol.category,
    tvl: protocol.baseTvl * randomFloat(0.9, 1.1),
    tvl_change_1d: randomFloat(-5, 5),
    tvl_change_7d: randomFloat(-15, 15),
    chains_supported: protocol.chain === 'multi-chain'
      ? ['ethereum', 'arbitrum', 'optimism', 'polygon', 'base']
      : [protocol.chain],
    last_updated: new Date().toISOString(),
  }));
}

function generateWallets(count: number): TrackedWallet[] {
  return Array.from({ length: count }, (_, i) => ({
    address: randomAddress(),
    label: i < WALLET_LABELS.length ? WALLET_LABELS[i] : null,
    chain: randomChoice(CHAINS),
    first_seen: randomDate(365),
    last_activity: randomDate(30),
    is_active: Math.random() > 0.2,
    tags: Array.from({ length: randomInt(0, 4) }, () =>
      randomChoice(['whale', 'degen', 'trader', 'holder', 'bot', 'dao', 'protocol'])
    ),
  }));
}

function generateWalletBalances(wallets: TrackedWallet[], tokensPerWallet: number): WalletBalance[] {
  const balances: WalletBalance[] = [];

  for (const wallet of wallets) {
    const tokenCount = randomInt(1, tokensPerWallet + 1);
    const selectedTokens = TOKENS.slice(0, tokenCount);

    for (const token of selectedTokens) {
      const balance = randomFloat(0.01, 1000);
      balances.push({
        wallet_address: wallet.address,
        token_address: randomAddress(),
        token_symbol: token.symbol,
        token_name: token.name,
        balance: balance.toFixed(8),
        balance_usd: balance * token.basePrice,
        chain: wallet.chain,
        last_updated: new Date().toISOString(),
      });
    }
  }

  return balances;
}

function generateGasMetrics(chains: string[], dataPointsPerChain: number): GasMetric[] {
  const metrics: GasMetric[] = [];

  for (const chain of chains) {
    const isL2 = ['base', 'arbitrum', 'optimism'].includes(chain);
    const baseGas = isL2 ? 0.001 : 15;

    for (let i = 0; i < dataPointsPerChain; i++) {
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - i * 5);

      metrics.push({
        chain,
        block_number: 20000000 - i,
        base_fee_gwei: baseGas * randomFloat(0.5, 2),
        priority_fee_gwei: baseGas * randomFloat(0.1, 0.5),
        gas_used: randomInt(8000000, 15000000),
        gas_limit: 15000000,
        utilization_percent: randomFloat(50, 95),
        timestamp: timestamp.toISOString(),
      });
    }
  }

  return metrics;
}

function generateCronExecutions(count: number): CronExecution[] {
  const jobNames = [
    'collect-prices', 'collect-tvl', 'collect-gas',
    'sync-wallets', 'cleanup-old-data', 'generate-reports'
  ];

  return Array.from({ length: count }, () => {
    const startTime = new Date(randomDate(7));
    const duration = randomInt(500, 30000);
    const status = Math.random() > 0.1 ? 'success' : 'error';

    return {
      job_name: randomChoice(jobNames),
      status,
      started_at: startTime.toISOString(),
      completed_at: new Date(startTime.getTime() + duration).toISOString(),
      execution_time: duration,
      metadata: {
        records_processed: randomInt(10, 1000),
        api_calls: randomInt(1, 50),
      },
      error_message: status === 'error' ? 'API rate limit exceeded' : null,
    };
  });
}

// ============================================================================
// Seed Scenarios
// ============================================================================

const scenarios: Record<string, SeedScenario> = {
  // Scenario 1: Empty Database
  empty: {
    name: 'Empty',
    description: 'Clean database for development reset',
    seed: async () => {
      const tables = [
        'wallet_balances', 'wallet_nfts', 'wallet_history', 'tracked_wallets',
        'token_prices', 'token_price_history', 'protocol_tvl', 'gas_metrics',
        'cron_executions', 'user_feedback', 'rlhf_preference_pairs',
      ];
      await clearTables(tables);
      console.log('Database cleared successfully');
    },
  },

  // Scenario 2: Minimal Data
  minimal: {
    name: 'Minimal',
    description: 'Basic data for quick testing',
    seed: async () => {
      console.log('Seeding minimal dataset...\n');

      // 5 tokens
      const tokens = generateTokenPrices(5);
      await insertBatch('token_prices', tokens);

      // 3 protocols
      const protocols = generateProtocolTVL(3);
      await insertBatch('protocol_tvl', protocols);

      // 5 wallets
      const wallets = generateWallets(5);
      await insertBatch('tracked_wallets', wallets);

      // 10 wallet balances
      const balances = generateWalletBalances(wallets, 3);
      await insertBatch('wallet_balances', balances);

      // 10 gas metrics
      const gasMetrics = generateGasMetrics(['ethereum', 'base'], 5);
      await insertBatch('gas_metrics', gasMetrics);

      // 10 cron executions
      const cronExecs = generateCronExecutions(10);
      await insertBatch('cron_executions', cronExecs);

      console.log('\nMinimal seed complete!');
    },
  },

  // Scenario 3: Realistic Data
  realistic: {
    name: 'Realistic',
    description: 'Production-like data for demo/staging',
    seed: async () => {
      console.log('Seeding realistic dataset...\n');

      // 15 tokens
      const tokens = generateTokenPrices(15);
      await insertBatch('token_prices', tokens);

      // 10 protocols
      const protocols = generateProtocolTVL(10);
      await insertBatch('protocol_tvl', protocols);

      // 50 wallets
      const wallets = generateWallets(50);
      await insertBatch('tracked_wallets', wallets);

      // ~250 wallet balances
      const balances = generateWalletBalances(wallets, 5);
      await insertBatch('wallet_balances', balances);

      // 500 gas metrics (5 chains x 100 points)
      const gasMetrics = generateGasMetrics(
        ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon'],
        100
      );
      await insertBatch('gas_metrics', gasMetrics);

      // 100 cron executions
      const cronExecs = generateCronExecutions(100);
      await insertBatch('cron_executions', cronExecs);

      console.log('\nRealistic seed complete!');
    },
  },

  // Scenario 4: Stress Test
  'stress-test': {
    name: 'Stress Test',
    description: 'Large dataset for performance testing',
    seed: async () => {
      console.log('Seeding stress test dataset...\n');
      console.log('WARNING: This will generate a lot of data!\n');

      // All 15 tokens
      const tokens = generateTokenPrices(15);
      await insertBatch('token_prices', tokens);

      // All 10 protocols
      const protocols = generateProtocolTVL(10);
      await insertBatch('protocol_tvl', protocols);

      // 500 wallets
      const wallets = generateWallets(500);
      await insertBatch('tracked_wallets', wallets);

      // ~5000 wallet balances
      const balances = generateWalletBalances(wallets, 10);
      await insertBatch('wallet_balances', balances);

      // 8000 gas metrics (8 chains x 1000 points)
      const gasMetrics = generateGasMetrics(CHAINS, 1000);
      await insertBatch('gas_metrics', gasMetrics);

      // 1000 cron executions
      const cronExecs = generateCronExecutions(1000);
      await insertBatch('cron_executions', cronExecs);

      console.log('\nStress test seed complete!');
    },
  },

  // Scenario 5: Edge Cases
  'edge-cases': {
    name: 'Edge Cases',
    description: 'Boundary conditions and edge cases',
    seed: async () => {
      console.log('Seeding edge cases dataset...\n');

      // Token with extreme values
      const extremeTokens: TokenPrice[] = [
        {
          coingecko_id: 'extreme-high',
          symbol: 'HIGH',
          name: 'Extreme High Price Token',
          current_price: 999999999.99,
          market_cap: 9999999999999,
          market_cap_rank: 1,
          total_volume: 999999999,
          price_change_24h: 99999999,
          price_change_percentage_24h: 9999.99,
          circulating_supply: 1,
          total_supply: 1,
          ath: 999999999.99,
          ath_date: new Date().toISOString(),
          atl: 0.00000001,
          atl_date: randomDate(365),
          last_updated: new Date().toISOString(),
        },
        {
          coingecko_id: 'extreme-low',
          symbol: 'LOW',
          name: 'Extreme Low Price Token',
          current_price: 0.00000001,
          market_cap: 1,
          market_cap_rank: 9999,
          total_volume: 0,
          price_change_24h: -0.00000001,
          price_change_percentage_24h: -99.99,
          circulating_supply: 999999999999999,
          total_supply: null,
          ath: 1,
          ath_date: randomDate(1000),
          atl: 0.00000001,
          atl_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        },
        {
          coingecko_id: 'zero-volume',
          symbol: 'ZERO',
          name: 'Zero Volume Token',
          current_price: 1.0,
          market_cap: 1000000,
          market_cap_rank: 500,
          total_volume: 0,
          price_change_24h: 0,
          price_change_percentage_24h: 0,
          circulating_supply: 1000000,
          total_supply: 1000000,
          ath: 1.0,
          ath_date: new Date().toISOString(),
          atl: 1.0,
          atl_date: new Date().toISOString(),
          last_updated: new Date().toISOString(),
        },
      ];
      await insertBatch('token_prices', extremeTokens);

      // Wallet with special characters in label
      const edgeWallets: TrackedWallet[] = [
        {
          address: '0x0000000000000000000000000000000000000000',
          label: 'Zero Address (Burn)',
          chain: 'ethereum',
          first_seen: new Date(0).toISOString(),
          last_activity: new Date().toISOString(),
          is_active: false,
          tags: ['burn', 'special'],
        },
        {
          address: '0xffffffffffffffffffffffffffffffffffffffff',
          label: 'Max Address',
          chain: 'ethereum',
          first_seen: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true,
          tags: [],
        },
        {
          address: randomAddress(),
          label: "Label with 'quotes' and \"double quotes\"",
          chain: 'base',
          first_seen: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true,
          tags: ['test', 'edge-case'],
        },
        {
          address: randomAddress(),
          label: 'Very long label that exceeds typical display limits and contains lots of text to test truncation behavior in the UI components',
          chain: 'arbitrum',
          first_seen: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: true,
          tags: ['long-label'],
        },
        {
          address: randomAddress(),
          label: null, // No label
          chain: 'optimism',
          first_seen: new Date().toISOString(),
          last_activity: new Date().toISOString(),
          is_active: false,
          tags: [],
        },
      ];
      await insertBatch('tracked_wallets', edgeWallets);

      // Gas metrics with edge values
      const edgeGasMetrics: GasMetric[] = [
        {
          chain: 'ethereum',
          block_number: 0,
          base_fee_gwei: 0,
          priority_fee_gwei: 0,
          gas_used: 0,
          gas_limit: 30000000,
          utilization_percent: 0,
          timestamp: new Date().toISOString(),
        },
        {
          chain: 'ethereum',
          block_number: 99999999,
          base_fee_gwei: 9999,
          priority_fee_gwei: 999,
          gas_used: 30000000,
          gas_limit: 30000000,
          utilization_percent: 100,
          timestamp: new Date().toISOString(),
        },
      ];
      await insertBatch('gas_metrics', edgeGasMetrics);

      // Cron with error states
      const edgeCronExecs: CronExecution[] = [
        {
          job_name: 'failed-job',
          status: 'error',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          execution_time: 0,
          metadata: {},
          error_message: 'Connection refused: ECONNREFUSED 127.0.0.1:5432',
        },
        {
          job_name: 'timeout-job',
          status: 'error',
          started_at: new Date(Date.now() - 3600000).toISOString(),
          completed_at: new Date().toISOString(),
          execution_time: 3600000,
          metadata: { timeout: true },
          error_message: 'Execution timeout after 1 hour',
        },
        {
          job_name: 'still-running',
          status: 'running',
          started_at: new Date().toISOString(),
          completed_at: null,
          execution_time: null,
          metadata: { progress: 50 },
          error_message: null,
        },
      ];
      await insertBatch('cron_executions', edgeCronExecs);

      console.log('\nEdge cases seed complete!');
    },
  },
};

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const scenarioArg = args.find(a => a.startsWith('--scenario='));
  const scenarioName = scenarioArg?.split('=')[1] || 'minimal';

  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║           Onchain Analytics - Database Seeder             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing Supabase credentials');
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const scenario = scenarios[scenarioName];

  if (!scenario) {
    console.error(`Error: Unknown scenario "${scenarioName}"\n`);
    console.log('Available scenarios:');
    Object.entries(scenarios).forEach(([key, s]) => {
      console.log(`  --scenario=${key.padEnd(15)} ${s.description}`);
    });
    process.exit(1);
  }

  console.log(`Scenario: ${scenario.name}`);
  console.log(`Description: ${scenario.description}\n`);
  console.log('─'.repeat(60) + '\n');

  try {
    await scenario.seed();
    console.log('\n' + '─'.repeat(60));
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
