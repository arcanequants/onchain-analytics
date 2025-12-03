/**
 * Cost Optimization Module
 *
 * Phase 4, Week 8, Day 1
 * Strategies and utilities for reducing AI API costs
 */

import { MODEL_COSTS, calculateCost } from './cost-tracking';

// ================================================================
// TYPES
// ================================================================

export type OptimizationStrategy =
  | 'model-downgrade'
  | 'prompt-compression'
  | 'caching'
  | 'batching'
  | 'provider-fallback'
  | 'request-dedup';

export interface OptimizationConfig {
  /** Enable automatic model downgrade under budget pressure */
  enableModelDowngrade: boolean;
  /** Enable prompt compression */
  enablePromptCompression: boolean;
  /** Minimum cache hit rate target */
  targetCacheHitRate: number;
  /** Enable request deduplication */
  enableRequestDedup: boolean;
  /** Max concurrent requests per provider */
  maxConcurrentPerProvider: number;
  /** Prefer cheaper models when budget is tight */
  budgetAwareModelSelection: boolean;
}

export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  enableModelDowngrade: true,
  enablePromptCompression: true,
  targetCacheHitRate: 0.8,
  enableRequestDedup: true,
  maxConcurrentPerProvider: 3,
  budgetAwareModelSelection: true,
};

export interface ModelOption {
  provider: string;
  model: string;
  tier: 'premium' | 'standard' | 'budget';
  costPer1kTokens: number;
  qualityScore: number; // 0-100
}

export interface OptimizationResult {
  originalModel: string;
  selectedModel: string;
  estimatedSavings: number;
  savingsPercent: number;
  strategy: OptimizationStrategy;
}

// ================================================================
// MODEL TIERS
// ================================================================

/**
 * Ranked models by cost-effectiveness
 */
export const MODEL_TIERS: ModelOption[] = [
  // Premium tier - best quality, highest cost
  {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
    tier: 'premium',
    costPer1kTokens: 0.045, // avg of input/output
    qualityScore: 98,
  },
  {
    provider: 'openai',
    model: 'gpt-4',
    tier: 'premium',
    costPer1kTokens: 0.045,
    qualityScore: 95,
  },
  {
    provider: 'openai',
    model: 'gpt-4-turbo',
    tier: 'premium',
    costPer1kTokens: 0.02,
    qualityScore: 94,
  },

  // Standard tier - good quality, moderate cost
  {
    provider: 'anthropic',
    model: 'claude-3-5-sonnet-20241022',
    tier: 'standard',
    costPer1kTokens: 0.009,
    qualityScore: 92,
  },
  {
    provider: 'openai',
    model: 'gpt-4o',
    tier: 'standard',
    costPer1kTokens: 0.01,
    qualityScore: 93,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-pro',
    tier: 'standard',
    costPer1kTokens: 0.003,
    qualityScore: 88,
  },

  // Budget tier - acceptable quality, lowest cost
  {
    provider: 'openai',
    model: 'gpt-4o-mini',
    tier: 'budget',
    costPer1kTokens: 0.000375,
    qualityScore: 82,
  },
  {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    tier: 'budget',
    costPer1kTokens: 0.000625,
    qualityScore: 80,
  },
  {
    provider: 'google',
    model: 'gemini-1.5-flash',
    tier: 'budget',
    costPer1kTokens: 0.000188,
    qualityScore: 78,
  },
];

// ================================================================
// MODEL SELECTION
// ================================================================

/**
 * Select optimal model based on budget pressure and quality requirements
 */
export function selectOptimalModel(options: {
  preferredProvider?: string;
  budgetPressure: number; // 0-1, where 1 = max pressure
  minQualityScore?: number;
  currentModel?: string;
}): ModelOption {
  const { preferredProvider, budgetPressure, minQualityScore = 75, currentModel } = options;

  // Filter by quality threshold
  let candidates = MODEL_TIERS.filter((m) => m.qualityScore >= minQualityScore);

  // Filter by provider if specified
  if (preferredProvider) {
    const providerCandidates = candidates.filter((m) => m.provider === preferredProvider);
    if (providerCandidates.length > 0) {
      candidates = providerCandidates;
    }
  }

  // Sort by cost-effectiveness (quality per dollar)
  candidates.sort((a, b) => {
    const aEfficiency = a.qualityScore / a.costPer1kTokens;
    const bEfficiency = b.qualityScore / b.costPer1kTokens;

    // Under budget pressure, prefer cheaper models
    if (budgetPressure > 0.7) {
      return a.costPer1kTokens - b.costPer1kTokens;
    }

    // Otherwise, prefer cost-effectiveness
    return bEfficiency - aEfficiency;
  });

  // Under high budget pressure, force budget tier
  if (budgetPressure > 0.9) {
    const budgetModels = candidates.filter((m) => m.tier === 'budget');
    if (budgetModels.length > 0) {
      return budgetModels[0];
    }
  }

  return candidates[0] || MODEL_TIERS[MODEL_TIERS.length - 1];
}

/**
 * Get downgrade path for a model
 */
export function getModelDowngradePath(model: string): string[] {
  const downgradeMap: Record<string, string[]> = {
    // OpenAI path
    'gpt-4': ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    'gpt-4-turbo': ['gpt-4o', 'gpt-4o-mini'],
    'gpt-4o': ['gpt-4o-mini'],
    'gpt-4o-mini': [],

    // Anthropic path
    'claude-3-opus-20240229': ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
    'claude-3-5-sonnet-20241022': ['claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'],
    'claude-3-sonnet-20240229': ['claude-3-haiku-20240307'],
    'claude-3-haiku-20240307': [],

    // Google path
    'gemini-1.5-pro': ['gemini-1.5-flash'],
    'gemini-1.5-flash': [],
  };

  return downgradeMap[model] || [];
}

// ================================================================
// PROMPT OPTIMIZATION
// ================================================================

/**
 * Compress prompt to reduce tokens
 */
export function compressPrompt(prompt: string): {
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  savingsPercent: number;
} {
  // Estimate tokens (rough: 4 chars per token)
  const originalTokens = Math.ceil(prompt.length / 4);

  let compressed = prompt;

  // Remove excessive whitespace
  compressed = compressed.replace(/\s+/g, ' ').trim();

  // Remove redundant phrases
  const redundantPhrases = [
    /please\s+/gi,
    /could you\s+/gi,
    /I would like you to\s+/gi,
    /can you\s+/gi,
    /I want you to\s+/gi,
    /make sure to\s+/gi,
    /be sure to\s+/gi,
    /don't forget to\s+/gi,
  ];

  for (const phrase of redundantPhrases) {
    compressed = compressed.replace(phrase, '');
  }

  // Remove excessive examples (keep first 2)
  const examplePattern = /Example \d+:/gi;
  let exampleCount = 0;
  compressed = compressed.replace(examplePattern, (match) => {
    exampleCount++;
    return exampleCount <= 2 ? match : '';
  });

  // Compress lists
  compressed = compressed.replace(/^\s*[-•]\s*/gm, '- ');

  const compressedTokens = Math.ceil(compressed.length / 4);
  const savingsPercent = ((originalTokens - compressedTokens) / originalTokens) * 100;

  return {
    compressed,
    originalTokens,
    compressedTokens,
    savingsPercent: Math.max(0, savingsPercent),
  };
}

/**
 * Optimize system prompt for token efficiency
 */
export function optimizeSystemPrompt(systemPrompt: string): string {
  let optimized = systemPrompt;

  // Use abbreviations
  const abbreviations: [RegExp, string][] = [
    [/for example/gi, 'e.g.'],
    [/that is to say/gi, 'i.e.'],
    [/and so on/gi, 'etc.'],
    [/in other words/gi, 'i.e.'],
    [/such as/gi, 'e.g.'],
  ];

  for (const [pattern, replacement] of abbreviations) {
    optimized = optimized.replace(pattern, replacement);
  }

  // Remove verbose instructions
  optimized = optimized.replace(/Remember to always/gi, 'Always');
  optimized = optimized.replace(/You must make sure to/gi, 'Must');
  optimized = optimized.replace(/It is important that you/gi, '');

  return compressPrompt(optimized).compressed;
}

// ================================================================
// REQUEST DEDUPLICATION
// ================================================================

interface PendingRequest {
  hash: string;
  promise: Promise<unknown>;
  timestamp: number;
}

const pendingRequests = new Map<string, PendingRequest>();
const DEDUP_TTL_MS = 5000; // 5 seconds

/**
 * Create hash for request deduplication
 */
export function hashRequest(provider: string, model: string, prompt: string): string {
  // Simple hash - in production use a proper hash function
  const content = `${provider}:${model}:${prompt}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

/**
 * Check if request is a duplicate and return existing promise if so
 */
export function checkDuplicate<T>(hash: string): Promise<T> | null {
  const pending = pendingRequests.get(hash);

  if (pending && Date.now() - pending.timestamp < DEDUP_TTL_MS) {
    return pending.promise as Promise<T>;
  }

  return null;
}

/**
 * Register a pending request for deduplication
 */
export function registerRequest<T>(hash: string, promise: Promise<T>): void {
  pendingRequests.set(hash, {
    hash,
    promise,
    timestamp: Date.now(),
  });

  // Cleanup on completion
  promise.finally(() => {
    setTimeout(() => {
      pendingRequests.delete(hash);
    }, DEDUP_TTL_MS);
  });
}

/**
 * Cleanup old pending requests
 */
export function cleanupPendingRequests(): void {
  const now = Date.now();
  for (const [hash, request] of pendingRequests) {
    if (now - request.timestamp > DEDUP_TTL_MS * 2) {
      pendingRequests.delete(hash);
    }
  }
}

// Run cleanup every minute
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupPendingRequests, 60000);
}

// ================================================================
// BATCHING
// ================================================================

interface BatchConfig {
  maxBatchSize: number;
  maxWaitMs: number;
  minBatchSize: number;
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
  maxBatchSize: 10,
  maxWaitMs: 100,
  minBatchSize: 2,
};

/**
 * Create a batcher for AI requests
 */
export function createRequestBatcher<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  config: Partial<BatchConfig> = {}
): {
  add: (item: T) => Promise<R>;
  flush: () => Promise<void>;
} {
  const { maxBatchSize, maxWaitMs, minBatchSize } = { ...DEFAULT_BATCH_CONFIG, ...config };

  const queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];

  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = async (): Promise<void> => {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }

    if (queue.length === 0) return;

    const batch = queue.splice(0, maxBatchSize);
    const items = batch.map((b) => b.item);

    try {
      const results = await processor(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach((b) => b.reject(error as Error));
    }
  };

  return {
    add(item: T): Promise<R> {
      return new Promise((resolve, reject) => {
        queue.push({ item, resolve, reject });

        if (queue.length >= maxBatchSize) {
          flush();
        } else if (!flushTimer) {
          flushTimer = setTimeout(() => {
            if (queue.length >= minBatchSize) {
              flush();
            }
          }, maxWaitMs);
        }
      });
    },

    flush,
  };
}

// ================================================================
// COST SAVINGS CALCULATOR
// ================================================================

export interface SavingsReport {
  period: string;
  originalCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercent: number;
  strategies: Array<{
    strategy: OptimizationStrategy;
    savings: number;
    description: string;
  }>;
}

/**
 * Calculate potential savings from optimization strategies
 */
export function calculatePotentialSavings(options: {
  currentMonthlySpend: number;
  cacheHitRate: number;
  averageTokensPerRequest: number;
  requestsPerMonth: number;
  currentModel: string;
}): SavingsReport {
  const { currentMonthlySpend, cacheHitRate, averageTokensPerRequest, requestsPerMonth, currentModel } =
    options;

  const strategies: SavingsReport['strategies'] = [];
  let totalSavings = 0;

  // 1. Caching improvement
  const targetCacheHitRate = 0.8;
  if (cacheHitRate < targetCacheHitRate) {
    const cacheImprovement = targetCacheHitRate - cacheHitRate;
    const cacheSavings = currentMonthlySpend * cacheImprovement;
    strategies.push({
      strategy: 'caching',
      savings: cacheSavings,
      description: `Improve cache hit rate from ${(cacheHitRate * 100).toFixed(0)}% to ${(targetCacheHitRate * 100).toFixed(0)}%`,
    });
    totalSavings += cacheSavings;
  }

  // 2. Model downgrade (if using premium)
  const currentModelInfo = MODEL_TIERS.find((m) => m.model === currentModel);
  if (currentModelInfo && currentModelInfo.tier === 'premium') {
    const standardOption = selectOptimalModel({
      preferredProvider: currentModelInfo.provider,
      budgetPressure: 0.5,
      minQualityScore: 85,
    });

    if (standardOption.tier !== 'premium') {
      const costReduction = 1 - standardOption.costPer1kTokens / currentModelInfo.costPer1kTokens;
      const modelSavings = currentMonthlySpend * (1 - cacheHitRate) * costReduction;
      strategies.push({
        strategy: 'model-downgrade',
        savings: modelSavings,
        description: `Switch from ${currentModel} to ${standardOption.model}`,
      });
      totalSavings += modelSavings;
    }
  }

  // 3. Prompt compression (estimate 15% reduction)
  const compressionSavings = currentMonthlySpend * 0.15 * (1 - cacheHitRate);
  strategies.push({
    strategy: 'prompt-compression',
    savings: compressionSavings,
    description: 'Compress prompts to reduce token usage by ~15%',
  });
  totalSavings += compressionSavings;

  // 4. Request deduplication (estimate 5% duplicate requests)
  const dedupSavings = currentMonthlySpend * 0.05;
  strategies.push({
    strategy: 'request-dedup',
    savings: dedupSavings,
    description: 'Deduplicate concurrent identical requests',
  });
  totalSavings += dedupSavings;

  return {
    period: 'monthly',
    originalCost: currentMonthlySpend,
    optimizedCost: currentMonthlySpend - totalSavings,
    savings: totalSavings,
    savingsPercent: (totalSavings / currentMonthlySpend) * 100,
    strategies,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Config
  DEFAULT_OPTIMIZATION_CONFIG,
  MODEL_TIERS,

  // Model selection
  selectOptimalModel,
  getModelDowngradePath,

  // Prompt optimization
  compressPrompt,
  optimizeSystemPrompt,

  // Request deduplication
  hashRequest,
  checkDuplicate,
  registerRequest,
  cleanupPendingRequests,

  // Batching
  createRequestBatcher,

  // Savings calculation
  calculatePotentialSavings,
};
