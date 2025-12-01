/**
 * Cost Tracking & Budget Protection System
 *
 * Phase 1, Week 1, Day 4
 * Based on EXECUTIVE-ROADMAP-BCG.md Sections 2.20 & 2.21
 *
 * Features:
 * - Track API costs per provider
 * - Daily budget limits with auto-pause
 * - Tiered response at 70%, 90%, 95% thresholds
 * - Real-time cost monitoring
 * - Cache hit tracking for optimization
 */

import { z } from 'zod';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Default monthly budget in USD
 * Based on roadmap: $100/month max for pre-revenue
 */
export const DEFAULT_MONTHLY_BUDGET = 100;

/**
 * Daily budget (monthly / 30)
 */
export const DEFAULT_DAILY_BUDGET = DEFAULT_MONTHLY_BUDGET / 30;

/**
 * Budget thresholds for automated actions
 */
export const BUDGET_THRESHOLDS = {
  warning: 0.70,    // 70% - Increase cache TTL
  alert: 0.90,      // 90% - Email alert, queue free users
  critical: 0.95,   // 95% - Pause free tier
  pause: 1.0,       // 100% - Pause all analyses
} as const;

/**
 * Cost per 1000 tokens for each provider/model
 * Based on current pricing (2024)
 */
export const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  // OpenAI
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },

  // Anthropic
  'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
  'claude-3-5-haiku-20241022': { input: 0.001, output: 0.005 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },

  // Google
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },

  // Default for unknown models
  'default': { input: 0.005, output: 0.015 },
};

/**
 * Priority levels for request processing
 */
export type RequestPriority = 'paid' | 'free' | 'monitoring';

// ================================================================
// TYPES
// ================================================================

export const CostEntrySchema = z.object({
  id: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'perplexity']),
  model: z.string(),
  tokensInput: z.number().int().min(0),
  tokensOutput: z.number().int().min(0),
  costUsd: z.number().min(0),
  latencyMs: z.number().int().min(0),
  cached: z.boolean().default(false),
  timestamp: z.date().default(() => new Date()),
});

export type CostEntry = z.infer<typeof CostEntrySchema>;

export const DailySummarySchema = z.object({
  date: z.string(), // YYYY-MM-DD
  totalCostUsd: z.number().min(0),
  totalAnalyses: z.number().int().min(0),
  cacheHitRate: z.number().min(0).max(1),
  avgCostPerAnalysis: z.number().min(0),
  costByProvider: z.record(z.string(), z.number()),
  tokensByProvider: z.record(z.string(), z.object({
    input: z.number(),
    output: z.number(),
  })),
});

export type DailySummary = z.infer<typeof DailySummarySchema>;

export interface BudgetStatus {
  /** Current daily spending in USD */
  currentDailySpend: number;
  /** Daily budget limit in USD */
  dailyBudget: number;
  /** Percentage of daily budget used (0-1) */
  percentUsed: number;
  /** Current threshold level */
  thresholdLevel: 'normal' | 'warning' | 'alert' | 'critical' | 'paused';
  /** Whether free tier is paused */
  freeTierPaused: boolean;
  /** Whether all analyses are paused */
  allPaused: boolean;
  /** Estimated remaining analyses today */
  estimatedRemainingAnalyses: number;
  /** Current average cost per analysis */
  avgCostPerAnalysis: number;
}

export interface CostTracker {
  /** Add a cost entry */
  addCost(entry: Omit<CostEntry, 'id' | 'timestamp'>): Promise<void>;
  /** Get current budget status */
  getBudgetStatus(): Promise<BudgetStatus>;
  /** Check if request can proceed based on priority */
  canProceed(priority: RequestPriority): Promise<boolean>;
  /** Get daily summary */
  getDailySummary(date?: string): Promise<DailySummary | null>;
  /** Get cost history for a period */
  getCostHistory(days: number): Promise<DailySummary[]>;
  /** Reset daily counter (for testing) */
  resetDaily(): Promise<void>;
}

// ================================================================
// COST CALCULATION FUNCTIONS
// ================================================================

/**
 * Calculate cost for a specific API call
 */
export function calculateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  const costs = MODEL_COSTS[model] ?? MODEL_COSTS['default'];

  const inputCost = (tokensInput / 1000) * costs.input;
  const outputCost = (tokensOutput / 1000) * costs.output;

  return Math.round((inputCost + outputCost) * 1000000) / 1000000; // 6 decimal precision
}

/**
 * Get threshold level based on percentage used
 */
export function getThresholdLevel(
  percentUsed: number
): BudgetStatus['thresholdLevel'] {
  if (percentUsed >= BUDGET_THRESHOLDS.pause) return 'paused';
  if (percentUsed >= BUDGET_THRESHOLDS.critical) return 'critical';
  if (percentUsed >= BUDGET_THRESHOLDS.alert) return 'alert';
  if (percentUsed >= BUDGET_THRESHOLDS.warning) return 'warning';
  return 'normal';
}

/**
 * Determine actions to take at current threshold
 */
export function getThresholdActions(level: BudgetStatus['thresholdLevel']): {
  increaseCacheTTL: boolean;
  emailAlert: boolean;
  queueFreeUsers: boolean;
  pauseFreeTier: boolean;
  pauseAll: boolean;
  message: string;
} {
  switch (level) {
    case 'paused':
      return {
        increaseCacheTTL: true,
        emailAlert: true,
        queueFreeUsers: true,
        pauseFreeTier: true,
        pauseAll: true,
        message: 'Daily budget exhausted. All analyses paused until midnight UTC.',
      };
    case 'critical':
      return {
        increaseCacheTTL: true,
        emailAlert: true,
        queueFreeUsers: true,
        pauseFreeTier: true,
        pauseAll: false,
        message: 'Free tier paused. Paid users continue normally.',
      };
    case 'alert':
      return {
        increaseCacheTTL: true,
        emailAlert: true,
        queueFreeUsers: true,
        pauseFreeTier: false,
        pauseAll: false,
        message: 'High usage. Free tier requests may be delayed.',
      };
    case 'warning':
      return {
        increaseCacheTTL: true,
        emailAlert: false,
        queueFreeUsers: false,
        pauseFreeTier: false,
        pauseAll: false,
        message: 'Approaching daily limit. Cache TTL increased.',
      };
    default:
      return {
        increaseCacheTTL: false,
        emailAlert: false,
        queueFreeUsers: false,
        pauseFreeTier: false,
        pauseAll: false,
        message: 'Operating normally.',
      };
  }
}

/**
 * Get cache TTL based on current threshold
 */
export function getCacheTTL(level: BudgetStatus['thresholdLevel']): number {
  // Base TTL in seconds
  const BASE_TTL = 60 * 60 * 24; // 24 hours

  switch (level) {
    case 'paused':
    case 'critical':
      return BASE_TTL * 3; // 72 hours
    case 'alert':
      return BASE_TTL * 2; // 48 hours
    case 'warning':
      return Math.round(BASE_TTL * 1.5); // 36 hours
    default:
      return BASE_TTL; // 24 hours
  }
}

// ================================================================
// IN-MEMORY COST TRACKER (for development/testing)
// ================================================================

/**
 * Simple in-memory cost tracker
 * Replace with Redis/Supabase implementation in production
 */
export function createInMemoryCostTracker(
  dailyBudget: number = DEFAULT_DAILY_BUDGET
): CostTracker {
  const entries: CostEntry[] = [];
  let lastResetDate = new Date().toISOString().split('T')[0];

  const getTodayEntries = (): CostEntry[] => {
    const today = new Date().toISOString().split('T')[0];

    // Auto-reset if new day
    if (today !== lastResetDate) {
      entries.length = 0;
      lastResetDate = today;
    }

    return entries.filter(e =>
      e.timestamp.toISOString().startsWith(today)
    );
  };

  return {
    async addCost(entry) {
      entries.push({
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      });
    },

    async getBudgetStatus(): Promise<BudgetStatus> {
      const todayEntries = getTodayEntries();
      const currentDailySpend = todayEntries.reduce((sum, e) => sum + e.costUsd, 0);
      const percentUsed = currentDailySpend / dailyBudget;
      const thresholdLevel = getThresholdLevel(percentUsed);
      const actions = getThresholdActions(thresholdLevel);

      // Calculate average cost per analysis
      const analysisIds = new Set(todayEntries.map(e => e.analysisId).filter(Boolean));
      const analysisCount = analysisIds.size || 1;
      const avgCostPerAnalysis = currentDailySpend / analysisCount;

      // Estimate remaining analyses
      const remainingBudget = dailyBudget - currentDailySpend;
      const estimatedRemainingAnalyses = avgCostPerAnalysis > 0
        ? Math.floor(remainingBudget / avgCostPerAnalysis)
        : 0;

      return {
        currentDailySpend,
        dailyBudget,
        percentUsed: Math.min(1, percentUsed),
        thresholdLevel,
        freeTierPaused: actions.pauseFreeTier,
        allPaused: actions.pauseAll,
        estimatedRemainingAnalyses: Math.max(0, estimatedRemainingAnalyses),
        avgCostPerAnalysis,
      };
    },

    async canProceed(priority: RequestPriority): Promise<boolean> {
      const status = await this.getBudgetStatus();

      if (status.allPaused) {
        return false;
      }

      if (status.freeTierPaused && priority === 'free') {
        return false;
      }

      // Paid and monitoring requests always proceed unless fully paused
      return true;
    },

    async getDailySummary(date?: string): Promise<DailySummary | null> {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const dayEntries = entries.filter(e =>
        e.timestamp.toISOString().startsWith(targetDate)
      );

      if (dayEntries.length === 0) {
        return null;
      }

      const totalCostUsd = dayEntries.reduce((sum, e) => sum + e.costUsd, 0);
      const analysisIds = new Set(dayEntries.map(e => e.analysisId).filter(Boolean));
      const cachedCount = dayEntries.filter(e => e.cached).length;

      const costByProvider: Record<string, number> = {};
      const tokensByProvider: Record<string, { input: number; output: number }> = {};

      for (const entry of dayEntries) {
        costByProvider[entry.provider] = (costByProvider[entry.provider] || 0) + entry.costUsd;

        if (!tokensByProvider[entry.provider]) {
          tokensByProvider[entry.provider] = { input: 0, output: 0 };
        }
        tokensByProvider[entry.provider].input += entry.tokensInput;
        tokensByProvider[entry.provider].output += entry.tokensOutput;
      }

      return {
        date: targetDate,
        totalCostUsd,
        totalAnalyses: analysisIds.size,
        cacheHitRate: dayEntries.length > 0 ? cachedCount / dayEntries.length : 0,
        avgCostPerAnalysis: analysisIds.size > 0 ? totalCostUsd / analysisIds.size : 0,
        costByProvider,
        tokensByProvider,
      };
    },

    async getCostHistory(days: number): Promise<DailySummary[]> {
      const summaries: DailySummary[] = [];
      const today = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const summary = await this.getDailySummary(dateStr);
        if (summary) {
          summaries.push(summary);
        }
      }

      return summaries.reverse();
    },

    async resetDaily() {
      const today = new Date().toISOString().split('T')[0];
      const indicesToRemove: number[] = [];

      entries.forEach((e, i) => {
        if (e.timestamp.toISOString().startsWith(today)) {
          indicesToRemove.push(i);
        }
      });

      // Remove in reverse order to maintain indices
      indicesToRemove.reverse().forEach(i => entries.splice(i, 1));
    },
  };
}

// ================================================================
// BUDGET GUARD UTILITY
// ================================================================

export interface BudgetGuardResult {
  allowed: boolean;
  status: BudgetStatus;
  actions: ReturnType<typeof getThresholdActions>;
  cacheTTL: number;
  delayMs: number;
  message: string;
}

/**
 * Check budget before making an API call
 * Returns whether to proceed and any actions to take
 */
export async function checkBudget(
  tracker: CostTracker,
  priority: RequestPriority
): Promise<BudgetGuardResult> {
  const status = await tracker.getBudgetStatus();
  const actions = getThresholdActions(status.thresholdLevel);
  const cacheTTL = getCacheTTL(status.thresholdLevel);
  const allowed = await tracker.canProceed(priority);

  // Calculate delay for queued requests
  let delayMs = 0;
  if (actions.queueFreeUsers && priority === 'free') {
    // Delay free users by 1-5 seconds based on usage
    delayMs = Math.min(5000, Math.floor(status.percentUsed * 5000));
  }

  return {
    allowed,
    status,
    actions,
    cacheTTL,
    delayMs,
    message: allowed
      ? actions.message
      : `Request blocked: ${actions.message}`,
  };
}

// ================================================================
// COST ESTIMATION
// ================================================================

export interface CostEstimate {
  minCost: number;
  maxCost: number;
  avgCost: number;
  providers: Array<{
    provider: string;
    model: string;
    estimatedCost: number;
  }>;
}

/**
 * Estimate cost for an analysis before running it
 */
export function estimateAnalysisCost(
  providers: Array<{ provider: string; model: string }>,
  estimatedTokensPerProvider: number = 1500 // avg tokens per query
): CostEstimate {
  const providerEstimates = providers.map(({ provider, model }) => {
    const cost = calculateCost(model, estimatedTokensPerProvider, estimatedTokensPerProvider);
    return {
      provider,
      model,
      estimatedCost: cost,
    };
  });

  const costs = providerEstimates.map(p => p.estimatedCost);

  return {
    minCost: Math.min(...costs),
    maxCost: Math.max(...costs),
    avgCost: costs.reduce((a, b) => a + b, 0) / costs.length,
    providers: providerEstimates,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  calculateCost,
  getThresholdLevel,
  getThresholdActions,
  getCacheTTL,
  createInMemoryCostTracker,
  checkBudget,
  estimateAnalysisCost,
  DEFAULT_MONTHLY_BUDGET,
  DEFAULT_DAILY_BUDGET,
  BUDGET_THRESHOLDS,
  MODEL_COSTS,
};
