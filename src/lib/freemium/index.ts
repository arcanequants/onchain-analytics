/**
 * Freemium Gating System
 *
 * Phase 2, Week 4, Day 1
 * Manages plan limits, feature gating, and usage tracking for freemium model.
 *
 * Features:
 * - Plan tier definitions with limits
 * - Usage tracking and quota checks
 * - Feature gating logic
 * - Upgrade triggers
 * - FOMO-inducing visibility rules
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Available subscription plans
 */
export type PlanTier = 'free' | 'starter' | 'pro' | 'enterprise';

/**
 * Monitoring frequency options
 */
export type MonitoringFrequency = false | 'weekly' | 'daily' | 'hourly';

/**
 * Plan configuration
 */
export interface PlanConfig {
  /** Plan display name */
  name: string;
  /** Monthly price in cents (0 for free) */
  priceMonthly: number;
  /** Annual price in cents (0 for free) */
  priceAnnual: number;
  /** Number of analyses allowed per month */
  analysesPerMonth: number;
  /** Number of AI providers visible in results */
  aiProvidersVisible: number;
  /** Number of recommendations visible ('all' or number) */
  recommendationsVisible: number | 'all';
  /** Number of competitors visible in comparison */
  competitorsVisible: number;
  /** Number of days of history visible */
  historyDays: number;
  /** Monitoring frequency allowed */
  monitoring: MonitoringFrequency;
  /** Whether export is allowed */
  exportEnabled: boolean;
  /** Whether API access is allowed */
  apiAccess: boolean;
  /** Priority support */
  prioritySupport: boolean;
  /** Custom branding */
  customBranding: boolean;
  /** White-label reports */
  whiteLabelReports: boolean;
}

/**
 * User's current usage
 */
export interface UsageData {
  /** Current billing period start */
  periodStart: Date;
  /** Current billing period end */
  periodEnd: Date;
  /** Analyses used this period */
  analysesUsed: number;
  /** Last analysis timestamp */
  lastAnalysisAt?: Date;
  /** Monitored URLs count */
  monitoredUrls: number;
  /** API calls this period */
  apiCallsUsed: number;
}

/**
 * Feature access result
 */
export interface FeatureAccess {
  /** Whether feature is accessible */
  allowed: boolean;
  /** Reason if not allowed */
  reason?: string;
  /** Upgrade tier needed to unlock */
  upgradeRequired?: PlanTier;
  /** Remaining quota (if applicable) */
  remaining?: number;
  /** Usage percentage (0-100) */
  usagePercent?: number;
}

/**
 * Gated content visibility rules
 */
export interface GatedVisibility {
  /** Number of items to show */
  visibleCount: number;
  /** Total items available */
  totalCount: number;
  /** Alias for visibleCount (for clarity in some contexts) */
  showCount?: number;
  /** Whether content is blurred */
  isBlurred: boolean;
  /** Whether upgrade prompt should show */
  showUpgradePrompt: boolean;
  /** Message to show for locked content */
  lockMessage: string;
}

/**
 * Upgrade trigger event
 */
export interface UpgradeTrigger {
  /** Trigger type */
  type: 'quota_reached' | 'feature_locked' | 'limit_approaching' | 'value_shown';
  /** Feature that triggered */
  feature: string;
  /** Recommended plan */
  recommendedPlan: PlanTier;
  /** Custom message */
  message: string;
  /** CTA text */
  ctaText: string;
  /** Urgency level */
  urgency: 'low' | 'medium' | 'high';
}

// ================================================================
// PLAN CONFIGURATIONS
// ================================================================

/**
 * Plan limits and features by tier
 */
export const PLAN_LIMITS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    priceMonthly: 0,
    priceAnnual: 0,
    analysesPerMonth: 5,
    aiProvidersVisible: 2,
    recommendationsVisible: 1,
    competitorsVisible: 0,
    historyDays: 0,
    monitoring: false,
    exportEnabled: false,
    apiAccess: false,
    prioritySupport: false,
    customBranding: false,
    whiteLabelReports: false,
  },
  starter: {
    name: 'Starter',
    priceMonthly: 2900, // $29
    priceAnnual: 29000, // $290 (2 months free)
    analysesPerMonth: 100,
    aiProvidersVisible: 4,
    recommendationsVisible: 'all',
    competitorsVisible: 3,
    historyDays: 30,
    monitoring: 'weekly',
    exportEnabled: true,
    apiAccess: false,
    prioritySupport: false,
    customBranding: false,
    whiteLabelReports: false,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 9900, // $99
    priceAnnual: 99000, // $990 (2 months free)
    analysesPerMonth: 500,
    aiProvidersVisible: 4,
    recommendationsVisible: 'all',
    competitorsVisible: 10,
    historyDays: 180,
    monitoring: 'daily',
    exportEnabled: true,
    apiAccess: true,
    prioritySupport: true,
    customBranding: false,
    whiteLabelReports: false,
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 0, // Custom
    priceAnnual: 0, // Custom
    analysesPerMonth: Infinity,
    aiProvidersVisible: 4,
    recommendationsVisible: 'all',
    competitorsVisible: Infinity,
    historyDays: 365,
    monitoring: 'hourly',
    exportEnabled: true,
    apiAccess: true,
    prioritySupport: true,
    customBranding: true,
    whiteLabelReports: true,
  },
};

/**
 * AI providers visible by plan
 */
export const AI_PROVIDERS_BY_PLAN: Record<PlanTier, string[]> = {
  free: ['openai', 'claude'],
  starter: ['openai', 'claude', 'gemini', 'perplexity'],
  pro: ['openai', 'claude', 'gemini', 'perplexity'],
  enterprise: ['openai', 'claude', 'gemini', 'perplexity'],
};

// ================================================================
// USAGE CHECKING
// ================================================================

/**
 * Check if user can perform an analysis
 */
export function canPerformAnalysis(
  plan: PlanTier,
  usage: UsageData
): FeatureAccess {
  const limits = PLAN_LIMITS[plan];
  const remaining = limits.analysesPerMonth - usage.analysesUsed;
  const usagePercent = (usage.analysesUsed / limits.analysesPerMonth) * 100;

  if (remaining <= 0) {
    return {
      allowed: false,
      reason: 'Monthly analysis limit reached',
      upgradeRequired: getNextTier(plan),
      remaining: 0,
      usagePercent: 100,
    };
  }

  return {
    allowed: true,
    remaining,
    usagePercent: Math.min(100, usagePercent),
  };
}

/**
 * Check if user can access a specific feature
 */
export function canAccessFeature(
  plan: PlanTier,
  feature: keyof PlanConfig
): FeatureAccess {
  const limits = PLAN_LIMITS[plan];
  const value = limits[feature];

  // Boolean features
  if (typeof value === 'boolean') {
    if (!value) {
      return {
        allowed: false,
        reason: `${formatFeatureName(feature)} is not available on ${limits.name} plan`,
        upgradeRequired: findTierWithFeature(feature),
      };
    }
    return { allowed: true };
  }

  // Numeric features (0 means not available)
  if (typeof value === 'number' && value === 0) {
    return {
      allowed: false,
      reason: `${formatFeatureName(feature)} is not available on ${limits.name} plan`,
      upgradeRequired: findTierWithFeature(feature),
    };
  }

  return { allowed: true };
}

/**
 * Check if monitoring is allowed at given frequency
 */
export function canUseMonitoring(
  plan: PlanTier,
  frequency: MonitoringFrequency
): FeatureAccess {
  const limits = PLAN_LIMITS[plan];

  if (limits.monitoring === false) {
    return {
      allowed: false,
      reason: 'Monitoring is not available on Free plan',
      upgradeRequired: 'starter',
    };
  }

  const frequencyRank: Record<MonitoringFrequency, number> = {
    false: 0,
    weekly: 1,
    daily: 2,
    hourly: 3,
  };

  const planRank = frequencyRank[limits.monitoring];
  const requestedRank = frequencyRank[frequency];

  if (requestedRank > planRank) {
    return {
      allowed: false,
      reason: `${frequency} monitoring requires a higher plan`,
      upgradeRequired: findTierWithMonitoring(frequency),
    };
  }

  return { allowed: true };
}

// ================================================================
// GATED VISIBILITY
// ================================================================

/**
 * Calculate visibility rules for AI providers
 */
export function getAIProviderVisibility(
  plan: PlanTier,
  allProviders: string[]
): GatedVisibility {
  const visibleProviders = AI_PROVIDERS_BY_PLAN[plan];
  const visibleCount = Math.min(visibleProviders.length, allProviders.length);
  const totalCount = allProviders.length;

  return {
    visibleCount,
    totalCount,
    isBlurred: visibleCount < totalCount,
    showUpgradePrompt: visibleCount < totalCount,
    lockMessage: `Upgrade to see results from ${totalCount - visibleCount} more AI providers`,
  };
}

/**
 * Calculate visibility rules for recommendations
 */
export function getRecommendationVisibility(
  plan: PlanTier,
  totalRecommendations: number
): GatedVisibility {
  const limits = PLAN_LIMITS[plan];
  const visibleCount =
    limits.recommendationsVisible === 'all'
      ? totalRecommendations
      : Math.min(limits.recommendationsVisible, totalRecommendations);

  const hiddenCount = totalRecommendations - visibleCount;

  return {
    visibleCount,
    totalCount: totalRecommendations,
    isBlurred: hiddenCount > 0,
    showUpgradePrompt: hiddenCount > 0,
    lockMessage:
      hiddenCount > 0
        ? `Upgrade to unlock ${hiddenCount} more actionable recommendations`
        : '',
  };
}

/**
 * Calculate visibility rules for competitors
 */
export function getCompetitorVisibility(
  plan: PlanTier,
  totalCompetitors: number
): GatedVisibility {
  const limits = PLAN_LIMITS[plan];
  const visibleCount = Math.min(limits.competitorsVisible, totalCompetitors);
  const hiddenCount = totalCompetitors - visibleCount;

  return {
    visibleCount,
    totalCount: totalCompetitors,
    isBlurred: hiddenCount > 0,
    showUpgradePrompt: hiddenCount > 0,
    lockMessage:
      hiddenCount > 0
        ? `Upgrade to compare with ${hiddenCount} more competitors`
        : '',
  };
}

/**
 * History visibility result with upgrade info
 */
export interface HistoryVisibility extends GatedVisibility {
  /** Required plan to unlock */
  requiredPlan: PlanTier;
  /** Upgrade message */
  upgradeMessage: string;
}

/**
 * Calculate visibility rules for history (by count)
 */
export function getHistoryVisibility(
  plan: PlanTier,
  totalCount: number
): HistoryVisibility {
  const limits = PLAN_LIMITS[plan];

  // For free plan (historyDays = 0), show nothing
  if (limits.historyDays === 0) {
    return {
      visibleCount: 0,
      totalCount,
      showCount: 0,
      isBlurred: totalCount > 0,
      showUpgradePrompt: totalCount > 0,
      lockMessage: 'Upgrade to access analysis history',
      upgradeMessage: 'Upgrade to access your analysis history',
      requiredPlan: 'starter',
    };
  }

  // For paid plans, show all (they have history access)
  return {
    visibleCount: totalCount,
    totalCount,
    showCount: totalCount,
    isBlurred: false,
    showUpgradePrompt: false,
    lockMessage: '',
    upgradeMessage: '',
    requiredPlan: plan,
  };
}

/**
 * Calculate visibility rules for history (by date range)
 */
export function getHistoryVisibilityByDates(
  plan: PlanTier,
  oldestDate: Date,
  newestDate: Date
): GatedVisibility {
  const limits = PLAN_LIMITS[plan];
  const totalDays = Math.ceil(
    (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const visibleDays = Math.min(limits.historyDays, totalDays);
  const hiddenDays = totalDays - visibleDays;

  return {
    visibleCount: visibleDays,
    totalCount: totalDays,
    isBlurred: hiddenDays > 0 && limits.historyDays > 0,
    showUpgradePrompt: hiddenDays > 0,
    lockMessage:
      hiddenDays > 0
        ? `Upgrade to access ${hiddenDays} more days of history`
        : limits.historyDays === 0
          ? 'Upgrade to access analysis history'
          : '',
  };
}

// ================================================================
// UPGRADE TRIGGERS
// ================================================================

/**
 * Generate upgrade trigger based on usage
 */
export function getUpgradeTrigger(
  plan: PlanTier,
  usage: UsageData,
  context?: string
): UpgradeTrigger | null {
  const limits = PLAN_LIMITS[plan];

  // Don't show triggers for enterprise
  if (plan === 'enterprise') return null;

  // Check if quota is reached
  if (usage.analysesUsed >= limits.analysesPerMonth) {
    return {
      type: 'quota_reached',
      feature: 'analyses',
      recommendedPlan: getNextTier(plan),
      message: "You've used all your monthly analyses",
      ctaText: 'Upgrade for unlimited analyses',
      urgency: 'high',
    };
  }

  // Check if approaching limit (80%)
  const usagePercent = (usage.analysesUsed / limits.analysesPerMonth) * 100;
  if (usagePercent >= 80) {
    const remaining = limits.analysesPerMonth - usage.analysesUsed;
    return {
      type: 'limit_approaching',
      feature: 'analyses',
      recommendedPlan: getNextTier(plan),
      message: `Only ${remaining} analyses remaining this month`,
      ctaText: 'Upgrade for more analyses',
      urgency: 'medium',
    };
  }

  // Feature-based triggers
  if (context === 'competitors' && limits.competitorsVisible === 0) {
    return {
      type: 'feature_locked',
      feature: 'competitors',
      recommendedPlan: 'starter',
      message: 'See how you compare to your competitors',
      ctaText: 'Unlock competitor analysis',
      urgency: 'medium',
    };
  }

  if (context === 'monitoring' && limits.monitoring === false) {
    return {
      type: 'feature_locked',
      feature: 'monitoring',
      recommendedPlan: 'starter',
      message: 'Track your AI perception score over time',
      ctaText: 'Enable monitoring',
      urgency: 'low',
    };
  }

  if (context === 'export' && !limits.exportEnabled) {
    return {
      type: 'feature_locked',
      feature: 'export',
      recommendedPlan: 'starter',
      message: 'Export your results to share with your team',
      ctaText: 'Unlock exports',
      urgency: 'low',
    };
  }

  return null;
}

/**
 * Get all applicable upgrade triggers for current state
 */
export function getAllUpgradeTriggers(
  plan: PlanTier,
  usage: UsageData
): UpgradeTrigger[] {
  const triggers: UpgradeTrigger[] = [];
  const contexts = ['analyses', 'competitors', 'monitoring', 'export', 'api'];

  for (const context of contexts) {
    const trigger = getUpgradeTrigger(plan, usage, context);
    if (trigger) {
      triggers.push(trigger);
    }
  }

  // Sort by urgency
  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return triggers.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get the next tier up from current
 */
export function getNextTier(current: PlanTier): PlanTier {
  const order: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];
  const currentIndex = order.indexOf(current);
  return order[Math.min(currentIndex + 1, order.length - 1)];
}

/**
 * Find the minimum tier that has a specific feature
 */
function findTierWithFeature(feature: keyof PlanConfig): PlanTier {
  const tiers: PlanTier[] = ['starter', 'pro', 'enterprise'];

  for (const tier of tiers) {
    const value = PLAN_LIMITS[tier][feature];
    if (typeof value === 'boolean' && value) return tier;
    if (typeof value === 'number' && value > 0) return tier;
    if (value === 'all') return tier;
  }

  return 'enterprise';
}

/**
 * Find the minimum tier that has specific monitoring frequency
 */
function findTierWithMonitoring(frequency: MonitoringFrequency): PlanTier {
  const frequencyTiers: Record<MonitoringFrequency, PlanTier> = {
    false: 'free',
    weekly: 'starter',
    daily: 'pro',
    hourly: 'enterprise',
  };

  return frequencyTiers[frequency] || 'enterprise';
}

/**
 * Format feature name for display
 */
function formatFeatureName(feature: keyof PlanConfig): string {
  const names: Partial<Record<keyof PlanConfig, string>> = {
    analysesPerMonth: 'Monthly analyses',
    aiProvidersVisible: 'AI providers',
    recommendationsVisible: 'Recommendations',
    competitorsVisible: 'Competitor comparison',
    historyDays: 'Analysis history',
    monitoring: 'Monitoring',
    exportEnabled: 'Export',
    apiAccess: 'API access',
    prioritySupport: 'Priority support',
    customBranding: 'Custom branding',
    whiteLabelReports: 'White-label reports',
  };

  return names[feature] || feature;
}

/**
 * Calculate days until period reset
 */
export function getDaysUntilReset(usage: UsageData): number {
  const now = new Date();
  const diff = usage.periodEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Check if user is in trial period
 */
export function isInTrialPeriod(
  createdAt: Date,
  trialDays: number = 14
): boolean {
  const now = new Date();
  const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
  return now < trialEnd;
}

/**
 * Get trial days remaining
 */
export function getTrialDaysRemaining(
  createdAt: Date,
  trialDays: number = 14
): number {
  const now = new Date();
  const trialEnd = new Date(createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
  const diff = trialEnd.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number, annual: boolean = false): string {
  if (priceInCents === 0) return 'Free';

  const dollars = priceInCents / 100;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);

  return annual ? `${formatted}/year` : `${formatted}/month`;
}

/**
 * Get savings percentage for annual billing
 */
export function getAnnualSavings(plan: PlanTier): number {
  const limits = PLAN_LIMITS[plan];
  if (limits.priceMonthly === 0) return 0;

  const monthlyTotal = limits.priceMonthly * 12;
  const savings = monthlyTotal - limits.priceAnnual;
  return Math.round((savings / monthlyTotal) * 100);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  PLAN_LIMITS,
  AI_PROVIDERS_BY_PLAN,
  canPerformAnalysis,
  canAccessFeature,
  canUseMonitoring,
  getAIProviderVisibility,
  getRecommendationVisibility,
  getCompetitorVisibility,
  getHistoryVisibility,
  getUpgradeTrigger,
  getAllUpgradeTriggers,
  getNextTier,
  getDaysUntilReset,
  isInTrialPeriod,
  getTrialDaysRemaining,
  formatPrice,
  getAnnualSavings,
};
