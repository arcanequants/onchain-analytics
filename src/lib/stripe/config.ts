/**
 * Stripe Configuration
 *
 * Centralized Stripe configuration and constants
 *
 * Phase 2, Week 5, Day 1
 */

// ================================================================
// ENVIRONMENT VARIABLES
// ================================================================

export const STRIPE_CONFIG = {
  secretKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
} as const;

// ================================================================
// PLAN DEFINITIONS
// ================================================================

export type PlanId = 'free' | 'starter' | 'pro';

export interface PlanLimits {
  analysesPerMonth: number;
  aiProviders: number;
  competitors: number;
  monitoringFrequency: 'none' | 'weekly' | 'daily';
  historyDays: number;
  exportFormats: ('pdf' | 'csv' | 'json')[];
  prioritySupport: boolean;
  apiAccess: boolean;
}

export interface PlanConfig {
  id: PlanId;
  name: string;
  description: string;
  price: number; // in cents
  priceAnnual: number; // in cents (annual price)
  interval: 'month' | 'year';
  stripePriceId?: string; // Set after Stripe products are created
  stripePriceIdAnnual?: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Get started with AI perception analysis',
    price: 0,
    priceAnnual: 0,
    interval: 'month',
    limits: {
      analysesPerMonth: 3,
      aiProviders: 2,
      competitors: 0,
      monitoringFrequency: 'none',
      historyDays: 7,
      exportFormats: [],
      prioritySupport: false,
      apiAccess: false,
    },
    features: [
      '3 analyses per month',
      '2 AI providers (OpenAI, Anthropic)',
      'Basic score breakdown',
      '7-day history',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For growing businesses tracking AI presence',
    price: 2900, // $29.00
    priceAnnual: 29000, // $290.00 (2 months free)
    interval: 'month',
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
    limits: {
      analysesPerMonth: 100,
      aiProviders: 4,
      competitors: 3,
      monitoringFrequency: 'weekly',
      historyDays: 90,
      exportFormats: ['pdf', 'csv'],
      prioritySupport: false,
      apiAccess: false,
    },
    features: [
      '100 analyses per month',
      '4 AI providers',
      'Track 3 competitors',
      'Weekly monitoring alerts',
      '90-day history',
      'PDF & CSV exports',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For teams serious about AI visibility',
    price: 7900, // $79.00
    priceAnnual: 79000, // $790.00 (2 months free)
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    stripePriceIdAnnual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    popular: true,
    limits: {
      analysesPerMonth: 500,
      aiProviders: 4,
      competitors: 10,
      monitoringFrequency: 'daily',
      historyDays: 365,
      exportFormats: ['pdf', 'csv', 'json'],
      prioritySupport: true,
      apiAccess: true,
    },
    features: [
      '500 analyses per month',
      '4 AI providers',
      'Track 10 competitors',
      'Daily monitoring alerts',
      '1-year history',
      'All export formats',
      'Priority support',
      'API access',
    ],
  },
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export function getPlanById(planId: PlanId): PlanConfig {
  return PLANS[planId];
}

export function getPlanByPriceId(priceId: string): PlanConfig | undefined {
  return Object.values(PLANS).find(
    (plan) =>
      plan.stripePriceId === priceId || plan.stripePriceIdAnnual === priceId
  );
}

export function formatPrice(priceInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInCents / 100);
}

export function getAnnualSavings(plan: PlanConfig): number {
  const monthlyTotal = plan.price * 12;
  const annualPrice = plan.priceAnnual;
  return monthlyTotal - annualPrice;
}

export function getAnnualSavingsPercent(plan: PlanConfig): number {
  if (plan.price === 0) return 0;
  const monthlyTotal = plan.price * 12;
  const savings = getAnnualSavings(plan);
  return Math.round((savings / monthlyTotal) * 100);
}

// ================================================================
// USAGE TRACKING
// ================================================================

export interface UsageStatus {
  plan: PlanId;
  analysesUsed: number;
  analysesLimit: number;
  percentUsed: number;
  isAtLimit: boolean;
  resetDate: Date;
}

export function calculateUsageStatus(
  planId: PlanId,
  analysesUsed: number,
  periodStart: Date
): UsageStatus {
  const plan = getPlanById(planId);
  const percentUsed =
    plan.limits.analysesPerMonth > 0
      ? Math.round((analysesUsed / plan.limits.analysesPerMonth) * 100)
      : 0;

  // Reset date is first of next month
  const resetDate = new Date(periodStart);
  resetDate.setMonth(resetDate.getMonth() + 1);
  resetDate.setDate(1);
  resetDate.setHours(0, 0, 0, 0);

  return {
    plan: planId,
    analysesUsed,
    analysesLimit: plan.limits.analysesPerMonth,
    percentUsed: Math.min(percentUsed, 100),
    isAtLimit: analysesUsed >= plan.limits.analysesPerMonth,
    resetDate,
  };
}

// ================================================================
// FEATURE CHECKS
// ================================================================

export function canAccessFeature(
  planId: PlanId,
  feature: keyof PlanLimits
): boolean {
  const plan = getPlanById(planId);
  const value = plan.limits[feature];

  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value > 0;
  if (typeof value === 'string') return value !== 'none';
  if (Array.isArray(value)) return value.length > 0;

  return false;
}

export function getFeatureLimit(
  planId: PlanId,
  feature: keyof PlanLimits
): number | string | boolean | string[] {
  const plan = getPlanById(planId);
  return plan.limits[feature];
}

// ================================================================
// UPGRADE PROMPTS
// ================================================================

export interface UpgradeReason {
  feature: string;
  currentLimit: string;
  upgradeLimit: string;
  recommendedPlan: PlanId;
}

export function getUpgradeReason(
  currentPlan: PlanId,
  blockedFeature: keyof PlanLimits
): UpgradeReason | null {
  if (currentPlan === 'pro') return null;

  const current = getPlanById(currentPlan);
  const recommended = currentPlan === 'free' ? 'starter' : 'pro';
  const upgrade = getPlanById(recommended);

  const featureNames: Record<keyof PlanLimits, string> = {
    analysesPerMonth: 'Monthly analyses',
    aiProviders: 'AI providers',
    competitors: 'Competitor tracking',
    monitoringFrequency: 'Monitoring frequency',
    historyDays: 'History retention',
    exportFormats: 'Export formats',
    prioritySupport: 'Priority support',
    apiAccess: 'API access',
  };

  const formatLimit = (value: unknown): string => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ') || 'None';
    return 'Unknown';
  };

  return {
    feature: featureNames[blockedFeature],
    currentLimit: formatLimit(current.limits[blockedFeature]),
    upgradeLimit: formatLimit(upgrade.limits[blockedFeature]),
    recommendedPlan: recommended,
  };
}
