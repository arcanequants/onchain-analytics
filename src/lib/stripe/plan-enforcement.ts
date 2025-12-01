/**
 * Plan Enforcement
 *
 * Utilities for checking and enforcing plan limits
 *
 * Phase 2, Week 5, Day 3
 */

import {
  PLANS,
  getPlanById,
  canAccessFeature,
  getFeatureLimit,
  getUpgradeReason,
  type PlanId,
  type PlanLimits,
} from './config';

// ================================================================
// TYPES
// ================================================================

export interface PlanCheckResult {
  allowed: boolean;
  reason?: string;
  upgradeRequired?: boolean;
  upgradeReason?: {
    feature: string;
    currentLimit: string;
    upgradeLimit: string;
    recommendedPlan: PlanId;
  };
}

export interface UsageCheckResult {
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  warningThreshold: boolean;
  upgradeRequired: boolean;
}

// ================================================================
// FEATURE CHECKS
// ================================================================

/**
 * Check if user can access a specific feature based on their plan
 */
export function checkFeatureAccess(
  planId: PlanId,
  feature: keyof PlanLimits
): PlanCheckResult {
  const hasAccess = canAccessFeature(planId, feature);

  if (hasAccess) {
    return { allowed: true };
  }

  const upgradeReason = getUpgradeReason(planId, feature);

  return {
    allowed: false,
    reason: `This feature requires a ${upgradeReason?.recommendedPlan || 'paid'} plan`,
    upgradeRequired: true,
    upgradeReason: upgradeReason || undefined,
  };
}

/**
 * Check if user can perform an analysis based on their usage
 */
export function checkAnalysisLimit(
  planId: PlanId,
  currentUsage: number
): UsageCheckResult {
  const limit = getPlanById(planId).limits.analysesPerMonth;
  const remaining = Math.max(0, limit - currentUsage);
  const percentUsed = limit > 0 ? Math.round((currentUsage / limit) * 100) : 0;

  return {
    allowed: currentUsage < limit,
    used: currentUsage,
    limit,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    warningThreshold: percentUsed >= 80,
    upgradeRequired: currentUsage >= limit,
  };
}

/**
 * Check if user can add more competitors
 */
export function checkCompetitorLimit(
  planId: PlanId,
  currentCompetitors: number
): UsageCheckResult {
  const limit = getPlanById(planId).limits.competitors;
  const remaining = Math.max(0, limit - currentCompetitors);
  const percentUsed = limit > 0 ? Math.round((currentCompetitors / limit) * 100) : 0;

  return {
    allowed: currentCompetitors < limit,
    used: currentCompetitors,
    limit,
    remaining,
    percentUsed: Math.min(percentUsed, 100),
    warningThreshold: percentUsed >= 80,
    upgradeRequired: currentCompetitors >= limit,
  };
}

// ================================================================
// MONITORING CHECKS
// ================================================================

/**
 * Check if user can set up monitoring based on their plan
 */
export function checkMonitoringAccess(planId: PlanId): {
  allowed: boolean;
  frequency: 'none' | 'weekly' | 'daily';
  reason?: string;
} {
  const frequency = getPlanById(planId).limits.monitoringFrequency;

  if (frequency === 'none') {
    return {
      allowed: false,
      frequency,
      reason: 'Monitoring is available on Starter and Pro plans',
    };
  }

  return {
    allowed: true,
    frequency,
  };
}

/**
 * Check if daily monitoring is available
 */
export function checkDailyMonitoringAccess(planId: PlanId): boolean {
  return getPlanById(planId).limits.monitoringFrequency === 'daily';
}

// ================================================================
// EXPORT CHECKS
// ================================================================

/**
 * Check if user can export in a specific format
 */
export function checkExportAccess(
  planId: PlanId,
  format: 'pdf' | 'csv' | 'json'
): PlanCheckResult {
  const allowedFormats = getPlanById(planId).limits.exportFormats;

  if (allowedFormats.includes(format)) {
    return { allowed: true };
  }

  const upgradeReason = getUpgradeReason(planId, 'exportFormats');

  return {
    allowed: false,
    reason: `${format.toUpperCase()} export requires a higher plan`,
    upgradeRequired: true,
    upgradeReason: upgradeReason || undefined,
  };
}

/**
 * Get all available export formats for a plan
 */
export function getAvailableExportFormats(
  planId: PlanId
): ('pdf' | 'csv' | 'json')[] {
  return getPlanById(planId).limits.exportFormats;
}

// ================================================================
// HISTORY CHECKS
// ================================================================

/**
 * Get the history retention period for a plan
 */
export function getHistoryRetentionDays(planId: PlanId): number {
  return getPlanById(planId).limits.historyDays;
}

/**
 * Check if a date is within the history retention period
 */
export function isWithinHistoryRetention(
  planId: PlanId,
  date: Date
): boolean {
  const retentionDays = getHistoryRetentionDays(planId);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  return date >= cutoffDate;
}

// ================================================================
// API ACCESS CHECKS
// ================================================================

/**
 * Check if user has API access
 */
export function checkApiAccess(planId: PlanId): PlanCheckResult {
  const hasAccess = getPlanById(planId).limits.apiAccess;

  if (hasAccess) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: 'API access is only available on the Pro plan',
    upgradeRequired: true,
    upgradeReason: getUpgradeReason(planId, 'apiAccess') || undefined,
  };
}

// ================================================================
// PRIORITY SUPPORT CHECKS
// ================================================================

/**
 * Check if user has priority support
 */
export function hasPrioritySupport(planId: PlanId): boolean {
  return getPlanById(planId).limits.prioritySupport;
}

// ================================================================
// PLAN COMPARISON
// ================================================================

/**
 * Get features that would be unlocked by upgrading
 */
export function getUpgradeFeatures(
  currentPlan: PlanId,
  targetPlan: PlanId
): string[] {
  const current = getPlanById(currentPlan);
  const target = getPlanById(targetPlan);

  const features: string[] = [];

  if (target.limits.analysesPerMonth > current.limits.analysesPerMonth) {
    features.push(
      `${target.limits.analysesPerMonth} analyses/month (currently ${current.limits.analysesPerMonth})`
    );
  }

  if (target.limits.competitors > current.limits.competitors) {
    features.push(
      `Track ${target.limits.competitors} competitors (currently ${current.limits.competitors})`
    );
  }

  if (
    target.limits.monitoringFrequency !== 'none' &&
    (current.limits.monitoringFrequency === 'none' ||
      target.limits.monitoringFrequency === 'daily')
  ) {
    features.push(`${target.limits.monitoringFrequency} monitoring`);
  }

  if (target.limits.historyDays > current.limits.historyDays) {
    features.push(`${target.limits.historyDays}-day history`);
  }

  if (target.limits.exportFormats.length > current.limits.exportFormats.length) {
    const newFormats = target.limits.exportFormats.filter(
      (f) => !current.limits.exportFormats.includes(f)
    );
    if (newFormats.length > 0) {
      features.push(`${newFormats.join(', ').toUpperCase()} exports`);
    }
  }

  if (target.limits.prioritySupport && !current.limits.prioritySupport) {
    features.push('Priority support');
  }

  if (target.limits.apiAccess && !current.limits.apiAccess) {
    features.push('API access');
  }

  return features;
}

/**
 * Check if an upgrade is worthwhile based on user's usage
 */
export function shouldSuggestUpgrade(
  planId: PlanId,
  analysesUsed: number,
  competitorsTracked: number
): { suggest: boolean; reason?: string; targetPlan?: PlanId } {
  if (planId === 'pro') {
    return { suggest: false };
  }

  const plan = getPlanById(planId);
  const analysisPercent = (analysesUsed / plan.limits.analysesPerMonth) * 100;
  const competitorPercent =
    plan.limits.competitors > 0
      ? (competitorsTracked / plan.limits.competitors) * 100
      : 0;

  // Suggest upgrade if at 80%+ of any limit
  if (analysisPercent >= 80) {
    return {
      suggest: true,
      reason: 'You are running low on analyses this month',
      targetPlan: planId === 'free' ? 'starter' : 'pro',
    };
  }

  if (competitorPercent >= 80) {
    return {
      suggest: true,
      reason: 'You are near your competitor tracking limit',
      targetPlan: planId === 'free' ? 'starter' : 'pro',
    };
  }

  // Suggest starter if free user has used 2+ analyses
  if (planId === 'free' && analysesUsed >= 2) {
    return {
      suggest: true,
      reason: 'Upgrade to unlock more analyses and features',
      targetPlan: 'starter',
    };
  }

  return { suggest: false };
}
