/**
 * RLHF Corrections Workflow
 *
 * Phase 4, Week 8, Day 5 - Updated for Supabase Persistence
 * Human-AI correction workflow for brand corrections
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
// DATABASE ROW TYPES
// ================================================================

interface BrandCorrectionRow {
  id: string;
  brand_id: string;
  brand_name: string;
  brand_domain: string | null;
  original_score: number;
  original_sentiment: 'positive' | 'neutral' | 'negative';
  original_category: string | null;
  original_summary: string | null;
  corrected_score: number | null;
  corrected_sentiment: 'positive' | 'neutral' | 'negative' | null;
  corrected_category: string | null;
  corrected_summary: string | null;
  correction_reason: string;
  correction_type: CorrectionType;
  submitted_by: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: CorrectionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  evidence_urls: string[] | null;
  attachments: string[] | null;
  notes: string | null;
}

interface ScoreDisputeRow {
  id: string;
  analysis_id: string;
  user_id: string;
  user_email: string;
  disputed_score: number;
  expected_score: number;
  reason: string;
  category: DisputeCategory;
  evidence_description: string | null;
  evidence_urls: string[] | null;
  status: DisputeStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  final_score: number | null;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function rowToCorrection(row: BrandCorrectionRow): BrandCorrection {
  return {
    id: row.id,
    brandId: row.brand_id,
    brandName: row.brand_name,
    brandDomain: row.brand_domain || '',
    originalScore: row.original_score,
    originalSentiment: row.original_sentiment,
    originalCategory: row.original_category || '',
    originalSummary: row.original_summary || '',
    correctedScore: row.corrected_score ?? undefined,
    correctedSentiment: row.corrected_sentiment ?? undefined,
    correctedCategory: row.corrected_category ?? undefined,
    correctedSummary: row.corrected_summary ?? undefined,
    correctionReason: row.correction_reason,
    correctionType: row.correction_type,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at,
    reviewedBy: row.reviewed_by ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    status: row.status,
    priority: row.priority,
    evidenceUrls: row.evidence_urls ?? undefined,
    attachments: row.attachments ?? undefined,
    notes: row.notes ?? undefined,
  };
}

function rowToDispute(row: ScoreDisputeRow): ScoreDispute {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    userId: row.user_id,
    userEmail: row.user_email,
    disputedScore: row.disputed_score,
    expectedScore: row.expected_score,
    reason: row.reason,
    category: row.category,
    evidenceDescription: row.evidence_description ?? undefined,
    evidenceUrls: row.evidence_urls ?? undefined,
    status: row.status,
    resolution: row.resolution ?? undefined,
    resolvedBy: row.resolved_by ?? undefined,
    resolvedAt: row.resolved_at ?? undefined,
    finalScore: row.final_score ?? undefined,
    priority: row.priority,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ================================================================
// CORRECTION SERVICE
// ================================================================

export class CorrectionService {
  private supabase: SupabaseClient;

  constructor(supabaseUrl?: string, supabaseKey?: string) {
    const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured for CorrectionService');
    }

    this.supabase = createClient(url, key);
  }

  /**
   * Submit a brand correction
   */
  async submitCorrection(
    correction: Omit<BrandCorrection, 'id' | 'status' | 'submittedAt'>
  ): Promise<BrandCorrection> {
    const priority = correction.priority || this.calculatePriority(correction as BrandCorrection);

    const { data, error } = await this.supabase
      .from('brand_corrections')
      .insert({
        brand_id: correction.brandId,
        brand_name: correction.brandName,
        brand_domain: correction.brandDomain || null,
        original_score: correction.originalScore,
        original_sentiment: correction.originalSentiment,
        original_category: correction.originalCategory || null,
        original_summary: correction.originalSummary || null,
        corrected_score: correction.correctedScore ?? null,
        corrected_sentiment: correction.correctedSentiment ?? null,
        corrected_category: correction.correctedCategory ?? null,
        corrected_summary: correction.correctedSummary ?? null,
        correction_reason: correction.correctionReason,
        correction_type: correction.correctionType,
        submitted_by: correction.submittedBy,
        priority: priority,
        evidence_urls: correction.evidenceUrls ?? null,
        attachments: correction.attachments ?? null,
        notes: correction.notes ?? null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit correction: ${error.message}`);
    }

    return rowToCorrection(data as BrandCorrectionRow);
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
    let query = this.supabase
      .from('brand_corrections')
      .select('*')
      .order('priority', { ascending: true }) // critical=0, low=3
      .order('submitted_at', { ascending: true });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get correction queue: ${error.message}`);
    }

    const corrections = (data as BrandCorrectionRow[]).map(rowToCorrection);

    // Build queue items with position and similar count
    const queueItems: CorrectionQueueItem[] = [];
    for (let i = 0; i < corrections.length; i++) {
      const correction = corrections[i];
      const similarCount = await this.countSimilarCorrections(correction);

      queueItems.push({
        correction,
        queuePosition: i + 1,
        estimatedReviewTime: this.estimateReviewTime(correction),
        similarCorrections: similarCount,
      });
    }

    return queueItems;
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
  private async countSimilarCorrections(correction: BrandCorrection): Promise<number> {
    const { count, error } = await this.supabase
      .from('brand_corrections')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', correction.brandId)
      .neq('id', correction.id);

    if (error) {
      console.warn('Failed to count similar corrections:', error.message);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get a single correction by ID
   */
  async getCorrection(correctionId: string): Promise<BrandCorrection | null> {
    const { data, error } = await this.supabase
      .from('brand_corrections')
      .select('*')
      .eq('id', correctionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get correction: ${error.message}`);
    }

    return rowToCorrection(data as BrandCorrectionRow);
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
    const existing = await this.getCorrection(correctionId);
    if (!existing) {
      throw new Error(`Correction not found: ${correctionId}`);
    }

    const newNotes = review.notes
      ? (existing.notes || '') + '\n' + review.notes
      : existing.notes;

    const { data, error } = await this.supabase
      .from('brand_corrections')
      .update({
        status: review.status,
        reviewed_by: review.reviewedBy,
        reviewed_at: new Date().toISOString(),
        notes: newNotes,
      })
      .eq('id', correctionId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to review correction: ${error.message}`);
    }

    // Update user points if approved
    if (review.status === 'approved') {
      await this.updateUserPoints(existing.submittedBy, existing, true);
    }

    return rowToCorrection(data as BrandCorrectionRow);
  }

  /**
   * Apply an approved correction
   */
  async applyCorrection(correctionId: string): Promise<void> {
    const correction = await this.getCorrection(correctionId);
    if (!correction) {
      throw new Error(`Correction not found: ${correctionId}`);
    }

    if (correction.status !== 'approved') {
      throw new Error(`Correction must be approved before applying. Current status: ${correction.status}`);
    }

    const { error } = await this.supabase
      .from('brand_corrections')
      .update({ status: 'applied' })
      .eq('id', correctionId);

    if (error) {
      throw new Error(`Failed to apply correction: ${error.message}`);
    }

    // TODO: Trigger model retraining signal
  }

  /**
   * Update user incentive points
   */
  private async updateUserPoints(
    userId: string,
    correction: BrandCorrection,
    accepted: boolean
  ): Promise<void> {
    const points = calculatePoints(correction, accepted);

    try {
      await this.supabase.rpc('update_user_points', {
        p_user_id: userId,
        p_points_to_add: points,
        p_is_accepted: accepted,
      });
    } catch (error) {
      console.warn('Failed to update user points:', error);
    }
  }

  /**
   * Get correction statistics
   */
  async getStats(): Promise<CorrectionStats> {
    const { data, error } = await this.supabase.rpc('get_correction_stats');

    if (error) {
      throw new Error(`Failed to get correction stats: ${error.message}`);
    }

    const statsRow = data?.[0] || {
      total_corrections: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      applied: 0,
      avg_review_time_minutes: 0,
    };

    // Get top correction types
    const { data: typeData } = await this.supabase
      .from('brand_corrections')
      .select('correction_type')
      .limit(1000);

    const typeCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    for (const row of (typeData || [])) {
      const type = (row as { correction_type: string }).correction_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    // Get priority distribution
    const { data: priorityData } = await this.supabase
      .from('brand_corrections')
      .select('priority')
      .limit(1000);

    for (const row of (priorityData || [])) {
      const priority = (row as { priority: string }).priority;
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1;
    }

    const topCorrectionTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type: type as CorrectionType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalCorrections: statsRow.total_corrections,
      pending: statsRow.pending,
      approved: statsRow.approved,
      rejected: statsRow.rejected,
      applied: statsRow.applied,
      avgReviewTime: Math.round(statsRow.avg_review_time_minutes || 0),
      topCorrectionTypes,
      correctionsByPriority: priorityCounts,
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
    const { data, error } = await this.supabase
      .from('score_disputes')
      .insert({
        analysis_id: dispute.analysisId,
        user_id: dispute.userId,
        user_email: dispute.userEmail,
        disputed_score: dispute.disputedScore,
        expected_score: dispute.expectedScore,
        reason: dispute.reason,
        category: dispute.category,
        evidence_description: dispute.evidenceDescription ?? null,
        evidence_urls: dispute.evidenceUrls ?? null,
        priority: dispute.priority,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to submit dispute: ${error.message}`);
    }

    return rowToDispute(data as ScoreDisputeRow);
  }

  /**
   * Get disputes for review
   */
  async getDisputes(options?: {
    status?: DisputeStatus;
    userId?: string;
    limit?: number;
  }): Promise<ScoreDispute[]> {
    let query = this.supabase
      .from('score_disputes')
      .select('*')
      .order('priority', { ascending: true })
      .order('created_at', { ascending: true });

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get disputes: ${error.message}`);
    }

    return (data as ScoreDisputeRow[]).map(rowToDispute);
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
    const { data: existingData, error: fetchError } = await this.supabase
      .from('score_disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (fetchError || !existingData) {
      throw new Error(`Dispute not found: ${disputeId}`);
    }

    const existing = rowToDispute(existingData as ScoreDisputeRow);

    const { data, error } = await this.supabase
      .from('score_disputes')
      .update({
        status: resolution.status,
        resolution: resolution.resolution,
        resolved_by: resolution.resolvedBy,
        resolved_at: new Date().toISOString(),
        final_score: resolution.finalScore ?? null,
      })
      .eq('id', disputeId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to resolve dispute: ${error.message}`);
    }

    // If accepted, create a correction
    if (resolution.status === 'resolved_accepted' && resolution.finalScore !== undefined) {
      await this.submitCorrection({
        brandId: existing.analysisId,
        brandName: 'From Dispute',
        brandDomain: '',
        originalScore: existing.disputedScore,
        originalSentiment: 'neutral',
        originalCategory: '',
        originalSummary: '',
        correctedScore: resolution.finalScore,
        correctionReason: `Resolved from dispute: ${resolution.resolution}`,
        correctionType: existing.disputedScore > resolution.finalScore ? 'score_too_high' : 'score_too_low',
        submittedBy: resolution.resolvedBy,
        priority: 'high',
      });
    }

    return rowToDispute(data as ScoreDisputeRow);
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
