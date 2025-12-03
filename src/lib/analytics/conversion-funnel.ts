/**
 * Conversion Funnel Tracking
 *
 * Phase 2, Week 4, Day 5
 * Track and analyze user journey through conversion funnels
 */

import { getAnalytics } from './usage';

// ================================================================
// TYPES
// ================================================================

export type FunnelId = 'signup' | 'analysis' | 'upgrade' | 'onboarding';

export interface FunnelStep {
  id: string;
  name: string;
  order: number;
}

export interface FunnelProgress {
  funnelId: FunnelId;
  currentStep: string;
  completedSteps: string[];
  startedAt: Date;
  lastStepAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FunnelMetrics {
  funnelId: FunnelId;
  totalEntries: number;
  completions: number;
  conversionRate: number;
  stepMetrics: {
    stepId: string;
    entries: number;
    exits: number;
    dropOffRate: number;
    avgTimeSpent: number;
  }[];
}

// ================================================================
// FUNNEL DEFINITIONS
// ================================================================

export const FUNNELS: Record<FunnelId, FunnelStep[]> = {
  signup: [
    { id: 'landing', name: 'Landing Page', order: 0 },
    { id: 'signup_form', name: 'Signup Form', order: 1 },
    { id: 'email_verify', name: 'Email Verification', order: 2 },
    { id: 'profile_setup', name: 'Profile Setup', order: 3 },
    { id: 'first_action', name: 'First Action', order: 4 },
  ],
  analysis: [
    { id: 'enter_url', name: 'Enter URL', order: 0 },
    { id: 'analysis_started', name: 'Analysis Started', order: 1 },
    { id: 'analysis_processing', name: 'Processing', order: 2 },
    { id: 'results_viewed', name: 'Results Viewed', order: 3 },
    { id: 'action_taken', name: 'Action Taken', order: 4 },
  ],
  upgrade: [
    { id: 'limit_reached', name: 'Limit Reached', order: 0 },
    { id: 'pricing_viewed', name: 'Pricing Viewed', order: 1 },
    { id: 'plan_selected', name: 'Plan Selected', order: 2 },
    { id: 'checkout_started', name: 'Checkout Started', order: 3 },
    { id: 'payment_completed', name: 'Payment Completed', order: 4 },
  ],
  onboarding: [
    { id: 'welcome', name: 'Welcome Screen', order: 0 },
    { id: 'value_prop', name: 'Value Proposition', order: 1 },
    { id: 'first_analysis', name: 'First Analysis', order: 2 },
    { id: 'understand_score', name: 'Understand Score', order: 3 },
    { id: 'complete', name: 'Onboarding Complete', order: 4 },
  ],
};

// ================================================================
// FUNNEL TRACKER CLASS
// ================================================================

class FunnelTracker {
  private activeFunnels: Map<FunnelId, FunnelProgress> = new Map();
  private storageKey = 'ai-perception-funnels';

  constructor() {
    this.loadFromStorage();
  }

  // ================================================================
  // FUNNEL OPERATIONS
  // ================================================================

  startFunnel(funnelId: FunnelId, metadata?: Record<string, unknown>): void {
    const now = new Date();
    const firstStep = FUNNELS[funnelId][0];

    const progress: FunnelProgress = {
      funnelId,
      currentStep: firstStep.id,
      completedSteps: [firstStep.id],
      startedAt: now,
      lastStepAt: now,
      metadata,
    };

    this.activeFunnels.set(funnelId, progress);
    this.saveToStorage();

    // Track event
    getAnalytics().track('funnel_started' as any, {
      funnel_id: funnelId,
      step_id: firstStep.id,
      step_name: firstStep.name,
      ...metadata,
    });
  }

  advanceStep(funnelId: FunnelId, stepId: string): boolean {
    const progress = this.activeFunnels.get(funnelId);
    if (!progress) {
      // Start funnel if not started
      this.startFunnel(funnelId);
    }

    const funnel = FUNNELS[funnelId];
    const step = funnel.find((s) => s.id === stepId);
    if (!step) return false;

    const currentProgress = this.activeFunnels.get(funnelId)!;

    // Check if step is valid (can't skip steps)
    const currentStepOrder = funnel.find((s) => s.id === currentProgress.currentStep)?.order ?? -1;
    if (step.order > currentStepOrder + 1) {
      console.warn(`Cannot skip from ${currentProgress.currentStep} to ${stepId}`);
      return false;
    }

    // Update progress
    const now = new Date();
    const timeSpent = now.getTime() - currentProgress.lastStepAt.getTime();

    if (!currentProgress.completedSteps.includes(stepId)) {
      currentProgress.completedSteps.push(stepId);
    }
    currentProgress.currentStep = stepId;
    currentProgress.lastStepAt = now;

    this.saveToStorage();

    // Track event
    getAnalytics().track('funnel_step_completed' as any, {
      funnel_id: funnelId,
      step_id: stepId,
      step_name: step.name,
      step_order: step.order,
      time_spent_ms: timeSpent,
      is_final_step: step.order === funnel.length - 1,
    });

    // Check if funnel completed
    if (step.order === funnel.length - 1) {
      this.completeFunnel(funnelId);
    }

    return true;
  }

  completeFunnel(funnelId: FunnelId): void {
    const progress = this.activeFunnels.get(funnelId);
    if (!progress) return;

    const totalTime = new Date().getTime() - progress.startedAt.getTime();

    // Track completion
    getAnalytics().track('funnel_completed' as any, {
      funnel_id: funnelId,
      total_time_ms: totalTime,
      steps_completed: progress.completedSteps.length,
      ...progress.metadata,
    });

    // Remove from active
    this.activeFunnels.delete(funnelId);
    this.saveToStorage();
  }

  abandonFunnel(funnelId: FunnelId, reason?: string): void {
    const progress = this.activeFunnels.get(funnelId);
    if (!progress) return;

    const totalTime = new Date().getTime() - progress.startedAt.getTime();

    // Track abandonment
    getAnalytics().track('funnel_abandoned' as any, {
      funnel_id: funnelId,
      last_step: progress.currentStep,
      steps_completed: progress.completedSteps.length,
      total_time_ms: totalTime,
      abandon_reason: reason,
    });

    // Remove from active
    this.activeFunnels.delete(funnelId);
    this.saveToStorage();
  }

  // ================================================================
  // QUERY METHODS
  // ================================================================

  getProgress(funnelId: FunnelId): FunnelProgress | undefined {
    return this.activeFunnels.get(funnelId);
  }

  isInFunnel(funnelId: FunnelId): boolean {
    return this.activeFunnels.has(funnelId);
  }

  getCurrentStep(funnelId: FunnelId): FunnelStep | undefined {
    const progress = this.activeFunnels.get(funnelId);
    if (!progress) return undefined;

    return FUNNELS[funnelId].find((s) => s.id === progress.currentStep);
  }

  getNextStep(funnelId: FunnelId): FunnelStep | undefined {
    const currentStep = this.getCurrentStep(funnelId);
    if (!currentStep) return undefined;

    return FUNNELS[funnelId].find((s) => s.order === currentStep.order + 1);
  }

  getCompletionPercentage(funnelId: FunnelId): number {
    const progress = this.activeFunnels.get(funnelId);
    if (!progress) return 0;

    const totalSteps = FUNNELS[funnelId].length;
    return (progress.completedSteps.length / totalSteps) * 100;
  }

  // ================================================================
  // STORAGE
  // ================================================================

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        for (const [funnelId, progress] of Object.entries(parsed)) {
          const p = progress as FunnelProgress;
          this.activeFunnels.set(funnelId as FunnelId, {
            ...p,
            startedAt: new Date(p.startedAt),
            lastStepAt: new Date(p.lastStepAt),
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: Record<string, FunnelProgress> = {};
      this.activeFunnels.forEach((progress, funnelId) => {
        data[funnelId] = progress;
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {
      // Ignore storage errors
    }
  }

  // ================================================================
  // CLEANUP
  // ================================================================

  cleanupStaleFunnels(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const now = new Date().getTime();

    this.activeFunnels.forEach((progress, funnelId) => {
      const age = now - progress.lastStepAt.getTime();
      if (age > maxAgeMs) {
        this.abandonFunnel(funnelId, 'stale');
      }
    });
  }
}

// ================================================================
// SINGLETON
// ================================================================

let funnelTrackerInstance: FunnelTracker | null = null;

export function getFunnelTracker(): FunnelTracker {
  if (!funnelTrackerInstance) {
    funnelTrackerInstance = new FunnelTracker();
  }
  return funnelTrackerInstance;
}

// ================================================================
// REACT HOOK
// ================================================================

export function useFunnel(funnelId: FunnelId) {
  const tracker = getFunnelTracker();

  return {
    start: (metadata?: Record<string, unknown>) => tracker.startFunnel(funnelId, metadata),
    advance: (stepId: string) => tracker.advanceStep(funnelId, stepId),
    complete: () => tracker.completeFunnel(funnelId),
    abandon: (reason?: string) => tracker.abandonFunnel(funnelId, reason),
    progress: tracker.getProgress(funnelId),
    currentStep: tracker.getCurrentStep(funnelId),
    nextStep: tracker.getNextStep(funnelId),
    completionPercentage: tracker.getCompletionPercentage(funnelId),
    isActive: tracker.isInFunnel(funnelId),
  };
}

// ================================================================
// EXPORTS
// ================================================================

export { FunnelTracker };
export default getFunnelTracker;
