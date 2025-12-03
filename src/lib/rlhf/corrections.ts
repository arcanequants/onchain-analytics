/**
 * RLHF Corrections Workflow
 *
 * Phase 4, Week 8, Day 5
 * Human-AI correction workflow for brand corrections
 */

// ================================================================
// TYPES
// ================================================================

export interface BrandCorrection {
  id: string;
  brandId: string;
  brandName: string;
  brandDomain: string;

  // Original AI assessment
  originalScore: number;
  originalSentiment: 'positive' | 'neutral' | 'negative';
  originalCategory: string;
  originalSummary: string;

  // Correction details
  correctedScore?: number;
  correctedSentiment?: 'positive' | 'neutral' | 'negative';
  correctedCategory?: string;
  correctedSummary?: string;
  correctionReason: string;
  correctionType: CorrectionType;

  // Metadata
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: CorrectionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Evidence
  evidenceUrls?: string[];
  attachments?: string[];
  notes?: string;
}

export type CorrectionType =
  | 'score_too_high'
  | 'score_too_low'
  | 'wrong_sentiment'
  | 'wrong_category'
  | 'factual_error'
  | 'hallucination'
  | 'outdated_info'
  | 'missing_info'
  | 'competitor_confusion'
  | 'other';

export type CorrectionStatus =
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'applied'
  | 'disputed';

export interface ScoreDispute {
  id: string;
  analysisId: string;
  userId: string;
  userEmail: string;

  // Dispute details
  disputedScore: number;
  expectedScore: number;
  reason: string;
  category: DisputeCategory;

  // Evidence
  evidenceDescription?: string;
  evidenceUrls?: string[];

  // Resolution
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  finalScore?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high';
}

export type DisputeCategory =
  | 'inaccurate_score'
  | 'missing_data'
  | 'competitor_bias'
  | 'outdated_info'
  | 'technical_error'
  | 'other';

export type DisputeStatus =
  | 'open'
  | 'investigating'
  | 'resolved_accepted'
  | 'resolved_rejected'
  | 'closed';

export interface CorrectionQueueItem {
  correction: BrandCorrection;
  queuePosition: number;
  estimatedReviewTime: number; // minutes
  similarCorrections: number;
}

export interface CorrectionStats {
  totalCorrections: number;
  pending: number;
  approved: number;
  rejected: number;
  applied: number;
  avgReviewTime: number; // minutes
  topCorrectionTypes: { type: CorrectionType; count: number }[];
  correctionsByPriority: Record<string, number>;
}

// ================================================================
// CORRECTION SERVICE
// ================================================================

export class CorrectionService {
  private corrections: Map<string, BrandCorrection> = new Map();
  private disputes: Map<string, ScoreDispute> = new Map();

  /**
   * Submit a brand correction
   */
  async submitCorrection(
    correction: Omit<BrandCorrection, 'id' | 'status' | 'submittedAt'>
  ): Promise<BrandCorrection> {
    const id = `corr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newCorrection: BrandCorrection = {
      ...correction,
      id,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    // Auto-set priority based on correction type
    if (!newCorrection.priority) {
      newCorrection.priority = this.calculatePriority(newCorrection);
    }

    this.corrections.set(id, newCorrection);

    // In production: Insert to database
    // await supabase.from('brand_corrections').insert(newCorrection);

    return newCorrection;
  }

  /**
   * Calculate priority based on correction type and score difference
   */
  private calculatePriority(correction: BrandCorrection): BrandCorrection['priority'] {
    // Hallucinations and factual errors are critical
    if (correction.correctionType === 'hallucination' || correction.correctionType === 'factual_error') {
      return 'critical';
    }

    // Large score differences are high priority
    if (correction.correctedScore !== undefined) {
      const diff = Math.abs(correction.originalScore - correction.correctedScore);
      if (diff >= 30) return 'high';
      if (diff >= 15) return 'medium';
    }

    // Competitor confusion is high priority
    if (correction.correctionType === 'competitor_confusion') {
      return 'high';
    }

    return 'low';
  }

  /**
   * Get correction queue
   */
  async getCorrectionQueue(options?: {
    status?: CorrectionStatus;
    priority?: BrandCorrection['priority'];
    limit?: number;
  }): Promise<CorrectionQueueItem[]> {
    let corrections = Array.from(this.corrections.values());

    // Filter by status
    if (options?.status) {
      corrections = corrections.filter((c) => c.status === options.status);
    }

    // Filter by priority
    if (options?.priority) {
      corrections = corrections.filter((c) => c.priority === options.priority);
    }

    // Sort by priority then by date
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    corrections.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    });

    // Apply limit
    if (options?.limit) {
      corrections = corrections.slice(0, options.limit);
    }

    // Build queue items
    return corrections.map((correction, index) => ({
      correction,
      queuePosition: index + 1,
      estimatedReviewTime: this.estimateReviewTime(correction),
      similarCorrections: this.countSimilarCorrections(correction),
    }));
  }

  /**
   * Estimate review time based on correction complexity
   */
  private estimateReviewTime(correction: BrandCorrection): number {
    let baseTime = 5; // 5 minutes base

    // Complex types take longer
    if (['hallucination', 'factual_error', 'competitor_confusion'].includes(correction.correctionType)) {
      baseTime += 10;
    }

    // With evidence takes longer
    if (correction.evidenceUrls && correction.evidenceUrls.length > 0) {
      baseTime += correction.evidenceUrls.length * 2;
    }

    // High priority should be faster (more resources)
    if (correction.priority === 'critical') baseTime *= 0.5;
    if (correction.priority === 'high') baseTime *= 0.75;

    return Math.round(baseTime);
  }

  /**
   * Count similar corrections for the same brand
   */
  private countSimilarCorrections(correction: BrandCorrection): number {
    return Array.from(this.corrections.values()).filter(
      (c) => c.brandId === correction.brandId && c.id !== correction.id
    ).length;
  }

  /**
   * Review and update correction status
   */
  async reviewCorrection(
    correctionId: string,
    review: {
      status: 'approved' | 'rejected';
      reviewedBy: string;
      notes?: string;
    }
  ): Promise<BrandCorrection> {
    const correction = this.corrections.get(correctionId);
    if (!correction) {
      throw new Error(`Correction not found: ${correctionId}`);
    }

    correction.status = review.status;
    correction.reviewedBy = review.reviewedBy;
    correction.reviewedAt = new Date().toISOString();
    if (review.notes) {
      correction.notes = (correction.notes || '') + '\n' + review.notes;
    }

    this.corrections.set(correctionId, correction);

    return correction;
  }

  /**
   * Apply an approved correction
   */
  async applyCorrection(correctionId: string): Promise<void> {
    const correction = this.corrections.get(correctionId);
    if (!correction) {
      throw new Error(`Correction not found: ${correctionId}`);
    }

    if (correction.status !== 'approved') {
      throw new Error(`Correction must be approved before applying. Current status: ${correction.status}`);
    }

    // In production: Update the brand data and trigger re-training
    // await this.updateBrandData(correction);
    // await this.triggerModelRetraining(correction);

    correction.status = 'applied';
    this.corrections.set(correctionId, correction);
  }

  /**
   * Get correction statistics
   */
  async getStats(): Promise<CorrectionStats> {
    const corrections = Array.from(this.corrections.values());

    const byStatus: Record<CorrectionStatus, number> = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      applied: 0,
      disputed: 0,
    };

    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    let totalReviewTime = 0;
    let reviewedCount = 0;

    for (const c of corrections) {
      byStatus[c.status]++;
      byType[c.correctionType] = (byType[c.correctionType] || 0) + 1;
      byPriority[c.priority] = (byPriority[c.priority] || 0) + 1;

      if (c.reviewedAt && c.submittedAt) {
        totalReviewTime += new Date(c.reviewedAt).getTime() - new Date(c.submittedAt).getTime();
        reviewedCount++;
      }
    }

    const topCorrectionTypes = Object.entries(byType)
      .map(([type, count]) => ({ type: type as CorrectionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCorrections: corrections.length,
      pending: byStatus.pending,
      approved: byStatus.approved,
      rejected: byStatus.rejected,
      applied: byStatus.applied,
      avgReviewTime: reviewedCount > 0 ? Math.round(totalReviewTime / reviewedCount / 60000) : 0,
      topCorrectionTypes,
      correctionsByPriority: byPriority,
    };
  }

  // ================================================================
  // DISPUTE HANDLING
  // ================================================================

  /**
   * Submit a score dispute
   */
  async submitDispute(
    dispute: Omit<ScoreDispute, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<ScoreDispute> {
    const id = `disp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const newDispute: ScoreDispute = {
      ...dispute,
      id,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.disputes.set(id, newDispute);

    return newDispute;
  }

  /**
   * Get disputes for review
   */
  async getDisputes(options?: {
    status?: DisputeStatus;
    userId?: string;
    limit?: number;
  }): Promise<ScoreDispute[]> {
    let disputes = Array.from(this.disputes.values());

    if (options?.status) {
      disputes = disputes.filter((d) => d.status === options.status);
    }

    if (options?.userId) {
      disputes = disputes.filter((d) => d.userId === options.userId);
    }

    // Sort by priority then by date
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    disputes.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    if (options?.limit) {
      disputes = disputes.slice(0, options.limit);
    }

    return disputes;
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(
    disputeId: string,
    resolution: {
      status: 'resolved_accepted' | 'resolved_rejected';
      resolution: string;
      resolvedBy: string;
      finalScore?: number;
    }
  ): Promise<ScoreDispute> {
    const dispute = this.disputes.get(disputeId);
    if (!dispute) {
      throw new Error(`Dispute not found: ${disputeId}`);
    }

    dispute.status = resolution.status;
    dispute.resolution = resolution.resolution;
    dispute.resolvedBy = resolution.resolvedBy;
    dispute.resolvedAt = new Date().toISOString();
    dispute.updatedAt = new Date().toISOString();

    if (resolution.finalScore !== undefined) {
      dispute.finalScore = resolution.finalScore;
    }

    this.disputes.set(disputeId, dispute);

    // If accepted, create a correction
    if (resolution.status === 'resolved_accepted' && resolution.finalScore !== undefined) {
      await this.submitCorrection({
        brandId: dispute.analysisId,
        brandName: 'From Dispute',
        brandDomain: '',
        originalScore: dispute.disputedScore,
        originalSentiment: 'neutral',
        originalCategory: '',
        originalSummary: '',
        correctedScore: resolution.finalScore,
        correctionReason: `Resolved from dispute: ${resolution.resolution}`,
        correctionType: 'score_too_high', // or calculate based on difference
        submittedBy: resolution.resolvedBy,
        priority: 'high',
      });
    }

    return dispute;
  }
}

// ================================================================
// FEEDBACK INCENTIVE SYSTEM
// ================================================================

export interface FeedbackIncentive {
  userId: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  points: number;
  badges: Badge[];
  streakDays: number;
  totalContributions: number;
  acceptedCorrections: number;
  accuracy: number; // percentage
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
  icon: string;
}

export const BADGES: Record<string, Omit<Badge, 'earnedAt'>> = {
  first_correction: {
    id: 'first_correction',
    name: 'First Correction',
    description: 'Submitted your first brand correction',
    icon: 'star',
  },
  accuracy_80: {
    id: 'accuracy_80',
    name: 'Sharp Eye',
    description: 'Achieved 80% correction acceptance rate',
    icon: 'eye',
  },
  ten_corrections: {
    id: 'ten_corrections',
    name: 'Contributor',
    description: 'Submitted 10 approved corrections',
    icon: 'award',
  },
  streak_7: {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Contributed 7 days in a row',
    icon: 'flame',
  },
  hallucination_hunter: {
    id: 'hallucination_hunter',
    name: 'Hallucination Hunter',
    description: 'Caught 5 AI hallucinations',
    icon: 'search',
  },
};

export function calculateTier(points: number): FeedbackIncentive['tier'] {
  if (points >= 1000) return 'platinum';
  if (points >= 500) return 'gold';
  if (points >= 100) return 'silver';
  return 'bronze';
}

export function calculatePoints(correction: BrandCorrection, accepted: boolean): number {
  if (!accepted) return 0;

  let points = 10; // base points

  // Bonus for priority
  if (correction.priority === 'critical') points += 20;
  if (correction.priority === 'high') points += 10;

  // Bonus for type
  if (correction.correctionType === 'hallucination') points += 15;
  if (correction.correctionType === 'factual_error') points += 10;

  // Bonus for evidence
  if (correction.evidenceUrls && correction.evidenceUrls.length > 0) {
    points += Math.min(correction.evidenceUrls.length * 5, 25);
  }

  return points;
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let correctionServiceInstance: CorrectionService | null = null;

export function getCorrectionService(): CorrectionService {
  if (!correctionServiceInstance) {
    correctionServiceInstance = new CorrectionService();
  }
  return correctionServiceInstance;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  CorrectionService,
  getCorrectionService,
  BADGES,
  calculateTier,
  calculatePoints,
};
