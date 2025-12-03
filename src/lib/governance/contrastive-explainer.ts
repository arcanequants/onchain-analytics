/**
 * Contrastive Explainer
 *
 * Generates "Why X not Y?" explanations for AI decisions.
 * Helps users understand not just what the AI decided, but why
 * it chose one outcome over alternatives.
 *
 * @module governance/contrastive-explainer
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export type ExplanationType =
  | 'classification'
  | 'recommendation'
  | 'scoring'
  | 'threshold'
  | 'ranking'
  | 'selection'
  | 'prediction';

export type FactorInfluence =
  | 'strongly_supports'
  | 'moderately_supports'
  | 'weakly_supports'
  | 'neutral'
  | 'weakly_opposes'
  | 'moderately_opposes'
  | 'strongly_opposes';

export interface DifferentiatingFactor {
  name: string;
  actualValue: string | number;
  contrastValue: string | number;
  influence: FactorInfluence;
  weight: number; // 0-1, importance of this factor
  explanation: string;
}

export interface Outcome {
  label: string;
  value: unknown;
  confidence: number; // 0-1
}

export interface ContrastiveExplanation {
  id?: string;
  decisionId: string;
  decisionType: string;
  modelId?: string;
  actualOutcome: Outcome;
  contrastOutcome: Outcome;
  explanationType: ExplanationType;
  differentiatingFactors: DifferentiatingFactor[];
  summary: string;
  details?: string;
  counterfactuals?: Counterfactual[];
  createdAt?: Date;
}

export interface Counterfactual {
  id?: string;
  originalInput: Record<string, unknown>;
  modifiedInput: Record<string, unknown>;
  changesRequired: ChangeRequirement[];
  description: string;
  isActionable: boolean;
  feasibilityScore?: number; // 0-1, how easy to achieve
  predictedOutcome?: Outcome;
}

export interface ChangeRequirement {
  feature: string;
  from: string | number;
  to: string | number;
  changeDifficulty: 'trivial' | 'easy' | 'moderate' | 'difficult' | 'impossible';
}

export interface ExplanationRequest {
  decisionId: string;
  decisionType: string;
  modelId?: string;
  actualOutcome: Outcome;
  contrastOutcome?: Outcome; // If not provided, will use second-best alternative
  alternatives?: Outcome[]; // Other possible outcomes
  inputData: Record<string, unknown>;
  featureImportance?: Record<string, number>;
  userId?: string;
}

// =====================================================
// CONTRASTIVE EXPLAINER CLASS
// =====================================================

export class ContrastiveExplainer {
  private supabase: any;
  private explanationCache = new Map<string, ContrastiveExplanation>();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Generate a contrastive explanation for a decision
   */
  async explain(request: ExplanationRequest): Promise<ContrastiveExplanation> {
    // Determine contrast outcome
    const contrastOutcome = request.contrastOutcome ||
      this.selectBestContrast(request.actualOutcome, request.alternatives);

    if (!contrastOutcome) {
      throw new Error('No contrast outcome available for explanation');
    }

    // Analyze differentiating factors
    const factors = this.analyzeDifferentiatingFactors(
      request.inputData,
      request.actualOutcome,
      contrastOutcome,
      request.featureImportance
    );

    // Determine explanation type
    const explanationType = this.inferExplanationType(request.decisionType);

    // Generate summary
    const summary = this.generateSummary(
      request.actualOutcome,
      contrastOutcome,
      factors,
      explanationType
    );

    // Generate counterfactuals
    const counterfactuals = this.generateCounterfactuals(
      request.inputData,
      request.actualOutcome,
      contrastOutcome,
      factors
    );

    // Build explanation
    const explanation: ContrastiveExplanation = {
      decisionId: request.decisionId,
      decisionType: request.decisionType,
      modelId: request.modelId,
      actualOutcome: request.actualOutcome,
      contrastOutcome,
      explanationType,
      differentiatingFactors: factors,
      summary,
      counterfactuals,
      createdAt: new Date()
    };

    // Persist to database
    const saved = await this.saveExplanation(explanation, request.userId, request.inputData);
    explanation.id = saved.id;

    // Cache for quick retrieval
    this.explanationCache.set(request.decisionId, explanation);

    return explanation;
  }

  /**
   * Get explanation for a decision
   */
  async getExplanation(
    decisionId: string,
    contrastWith?: string
  ): Promise<ContrastiveExplanation | null> {
    // Check cache
    if (this.explanationCache.has(decisionId)) {
      const cached = this.explanationCache.get(decisionId)!;
      if (!contrastWith || cached.contrastOutcome.label === contrastWith) {
        return cached;
      }
    }

    // Query database
    const { data, error } = await this.supabase
      .rpc('get_contrastive_explanation', {
        p_decision_id: decisionId,
        p_contrast_with: contrastWith
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      id: row.explanation_id,
      decisionId,
      decisionType: '',
      actualOutcome: { label: row.actual_outcome_label, value: null, confidence: 0 },
      contrastOutcome: { label: row.contrast_outcome_label, value: null, confidence: 0 },
      explanationType: 'classification',
      differentiatingFactors: row.differentiating_factors,
      summary: row.explanation_summary,
      counterfactuals: row.counterfactuals,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Generate "Why not Y?" explanation for a specific alternative
   */
  async explainWhyNot(
    decisionId: string,
    alternativeLabel: string,
    inputData: Record<string, unknown>,
    featureImportance?: Record<string, number>
  ): Promise<string> {
    const existing = await this.getExplanation(decisionId, alternativeLabel);

    if (existing) {
      return existing.summary;
    }

    // Generate on-the-fly explanation
    const factors = Object.entries(featureImportance || {})
      .slice(0, 3)
      .map(([name, importance]) => ({
        name,
        value: inputData[name],
        importance
      }));

    let explanation = `The outcome was not "${alternativeLabel}" because:\n`;

    for (const factor of factors) {
      explanation += `\n- ${factor.name}: The value of ${factor.value} did not align with typical ${alternativeLabel} patterns.`;
    }

    return explanation;
  }

  /**
   * Record user feedback on an explanation
   */
  async recordFeedback(
    explanationId: string,
    helpful: boolean,
    feedback?: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .rpc('record_explanation_feedback', {
        p_explanation_id: explanationId,
        p_found_helpful: helpful,
        p_feedback: feedback
      });

    return !error;
  }

  /**
   * Get all explanations for a user
   */
  async getUserExplanations(
    userId: string,
    limit: number = 20
  ): Promise<ContrastiveExplanation[]> {
    const { data, error } = await this.supabase
      .from('contrastive_explanations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      decisionId: row.decision_id as string,
      decisionType: row.decision_type as string,
      modelId: row.model_id as string,
      actualOutcome: {
        label: row.actual_outcome_label as string,
        value: row.actual_outcome,
        confidence: row.actual_confidence as number
      },
      contrastOutcome: {
        label: row.contrast_outcome_label as string,
        value: row.contrast_outcome,
        confidence: row.contrast_confidence as number
      },
      explanationType: row.explanation_type as ExplanationType,
      differentiatingFactors: row.differentiating_factors as DifferentiatingFactor[],
      summary: row.explanation_summary as string,
      createdAt: new Date(row.created_at as string)
    }));
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private selectBestContrast(
    actual: Outcome,
    alternatives?: Outcome[]
  ): Outcome | null {
    if (!alternatives || alternatives.length === 0) {
      return null;
    }

    // Select the highest-confidence alternative that isn't the actual outcome
    return alternatives
      .filter(alt => alt.label !== actual.label)
      .sort((a, b) => b.confidence - a.confidence)[0] || null;
  }

  private analyzeDifferentiatingFactors(
    inputData: Record<string, unknown>,
    actual: Outcome,
    contrast: Outcome,
    featureImportance?: Record<string, number>
  ): DifferentiatingFactor[] {
    const factors: DifferentiatingFactor[] = [];
    const importance = featureImportance || {};

    // Sort features by importance
    const sortedFeatures = Object.entries(inputData)
      .map(([name, value]) => ({
        name,
        value,
        importance: importance[name] || 0.5
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5); // Top 5 factors

    for (const feature of sortedFeatures) {
      const influence = this.determineInfluence(
        feature.importance,
        actual.confidence,
        contrast.confidence
      );

      factors.push({
        name: feature.name,
        actualValue: String(feature.value),
        contrastValue: this.estimateContrastValue(feature.name, feature.value),
        influence,
        weight: feature.importance,
        explanation: this.generateFactorExplanation(
          feature.name,
          feature.value,
          influence,
          actual.label,
          contrast.label
        )
      });
    }

    return factors;
  }

  private determineInfluence(
    importance: number,
    actualConfidence: number,
    contrastConfidence: number
  ): FactorInfluence {
    const delta = actualConfidence - contrastConfidence;
    const impact = importance * delta;

    if (impact > 0.3) return 'strongly_supports';
    if (impact > 0.15) return 'moderately_supports';
    if (impact > 0.05) return 'weakly_supports';
    if (impact > -0.05) return 'neutral';
    if (impact > -0.15) return 'weakly_opposes';
    if (impact > -0.3) return 'moderately_opposes';
    return 'strongly_opposes';
  }

  private estimateContrastValue(
    featureName: string,
    actualValue: unknown
  ): string {
    // Generate a plausible contrast value
    if (typeof actualValue === 'number') {
      // For numbers, suggest opposite direction
      return actualValue > 0 ? 'lower values' : 'higher values';
    }

    if (typeof actualValue === 'boolean') {
      return (!actualValue).toString();
    }

    return 'different values';
  }

  private generateFactorExplanation(
    name: string,
    value: unknown,
    influence: FactorInfluence,
    actualLabel: string,
    contrastLabel: string
  ): string {
    const influenceText = influence.replace('_', ' ');

    return `The ${name} value of "${value}" ${influenceText} the "${actualLabel}" ` +
           `outcome over "${contrastLabel}".`;
  }

  private inferExplanationType(decisionType: string): ExplanationType {
    const typeMap: Record<string, ExplanationType> = {
      'risk_assessment': 'scoring',
      'wallet_classification': 'classification',
      'token_recommendation': 'recommendation',
      'alert_trigger': 'threshold',
      'protocol_ranking': 'ranking',
      'approval_decision': 'selection',
      'price_prediction': 'prediction'
    };

    return typeMap[decisionType] || 'classification';
  }

  private generateSummary(
    actual: Outcome,
    contrast: Outcome,
    factors: DifferentiatingFactor[],
    type: ExplanationType
  ): string {
    let summary = '';

    // Type-specific opening
    switch (type) {
      case 'classification':
        summary = `This was classified as "${actual.label}" rather than "${contrast.label}"`;
        break;
      case 'scoring':
        summary = `The score resulted in "${actual.label}" instead of "${contrast.label}"`;
        break;
      case 'recommendation':
        summary = `We recommended "${actual.label}" over "${contrast.label}"`;
        break;
      case 'threshold':
        summary = `The threshold was crossed resulting in "${actual.label}" not "${contrast.label}"`;
        break;
      case 'ranking':
        summary = `This ranked as "${actual.label}" rather than "${contrast.label}"`;
        break;
      case 'selection':
        summary = `The selection was "${actual.label}" instead of "${contrast.label}"`;
        break;
      case 'prediction':
        summary = `The prediction is "${actual.label}" rather than "${contrast.label}"`;
        break;
    }

    // Add confidence info
    summary += ` (${Math.round(actual.confidence * 100)}% vs ${Math.round(contrast.confidence * 100)}% confidence).`;

    // Add key factors
    if (factors.length > 0) {
      summary += '\n\nKey differentiating factors:';

      for (const factor of factors.slice(0, 3)) {
        const influenceWord = factor.influence.includes('supports')
          ? 'supported'
          : factor.influence.includes('opposes')
            ? 'opposed'
            : 'influenced';

        summary += `\n- ${factor.name}: Your value of ${factor.actualValue} ${influenceWord} this outcome.`;
      }
    }

    return summary;
  }

  private generateCounterfactuals(
    inputData: Record<string, unknown>,
    actual: Outcome,
    contrast: Outcome,
    factors: DifferentiatingFactor[]
  ): Counterfactual[] {
    const counterfactuals: Counterfactual[] = [];

    // Generate counterfactual for each significant factor
    for (const factor of factors.filter(f => f.weight > 0.3).slice(0, 3)) {
      const modifiedInput = { ...inputData };
      const contrastVal = this.generateCounterfactualValue(
        factor.name,
        inputData[factor.name]
      );
      modifiedInput[factor.name] = contrastVal;

      const changeDifficulty = this.assessChangeDifficulty(
        factor.name,
        inputData[factor.name],
        contrastVal
      );

      counterfactuals.push({
        originalInput: inputData,
        modifiedInput,
        changesRequired: [{
          feature: factor.name,
          from: String(inputData[factor.name]),
          to: String(contrastVal),
          changeDifficulty
        }],
        description: `If ${factor.name} were ${contrastVal} instead of ${inputData[factor.name]}, ` +
                     `the outcome would more likely be "${contrast.label}".`,
        isActionable: changeDifficulty !== 'impossible',
        feasibilityScore: this.calculateFeasibility(changeDifficulty)
      });
    }

    return counterfactuals;
  }

  private generateCounterfactualValue(
    featureName: string,
    actualValue: unknown
  ): unknown {
    if (typeof actualValue === 'number') {
      // Invert by 50%
      return actualValue > 0 ? actualValue * 0.5 : actualValue * 1.5;
    }

    if (typeof actualValue === 'boolean') {
      return !actualValue;
    }

    return 'alternative_value';
  }

  private assessChangeDifficulty(
    featureName: string,
    from: unknown,
    to: unknown
  ): ChangeRequirement['changeDifficulty'] {
    // Features that are hard or impossible to change
    const immutableFeatures = ['wallet_age', 'historical_transactions', 'first_transaction_date'];
    const difficultFeatures = ['total_volume', 'unique_protocols', 'chain_diversity'];

    if (immutableFeatures.includes(featureName)) {
      return 'impossible';
    }

    if (difficultFeatures.includes(featureName)) {
      return 'difficult';
    }

    // Assess based on magnitude of change for numbers
    if (typeof from === 'number' && typeof to === 'number') {
      const changeRatio = Math.abs(to - from) / Math.max(Math.abs(from), 1);
      if (changeRatio > 0.5) return 'moderate';
      if (changeRatio > 0.2) return 'easy';
      return 'trivial';
    }

    return 'moderate';
  }

  private calculateFeasibility(difficulty: ChangeRequirement['changeDifficulty']): number {
    const scores: Record<string, number> = {
      'trivial': 0.95,
      'easy': 0.8,
      'moderate': 0.5,
      'difficult': 0.2,
      'impossible': 0
    };
    return scores[difficulty] || 0.5;
  }

  private async saveExplanation(
    explanation: ContrastiveExplanation,
    userId?: string,
    inputSnapshot?: Record<string, unknown>
  ): Promise<{ id: string }> {
    const { data, error } = await this.supabase
      .rpc('generate_contrastive_explanation', {
        p_decision_id: explanation.decisionId,
        p_decision_type: explanation.decisionType,
        p_actual_outcome: explanation.actualOutcome.value,
        p_actual_label: explanation.actualOutcome.label,
        p_actual_confidence: explanation.actualOutcome.confidence,
        p_contrast_outcome: explanation.contrastOutcome.value,
        p_contrast_label: explanation.contrastOutcome.label,
        p_contrast_confidence: explanation.contrastOutcome.confidence,
        p_explanation_type: explanation.explanationType,
        p_differentiating_factors: explanation.differentiatingFactors,
        p_input_snapshot: inputSnapshot,
        p_user_id: userId,
        p_model_id: explanation.modelId
      });

    if (error) {
      throw new Error(`Failed to save explanation: ${error.message}`);
    }

    // Save counterfactuals
    if (explanation.counterfactuals && data) {
      for (const cf of explanation.counterfactuals) {
        await this.supabase.rpc('generate_counterfactual', {
          p_contrastive_id: data,
          p_original_input: cf.originalInput,
          p_modified_input: cf.modifiedInput,
          p_changes_required: cf.changesRequired,
          p_description: cf.description,
          p_is_actionable: cf.isActionable,
          p_feasibility_score: cf.feasibilityScore
        });
      }
    }

    return { id: data };
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

let explainerInstance: ContrastiveExplainer | null = null;

export function getContrastiveExplainer(): ContrastiveExplainer {
  if (!explainerInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    explainerInstance = new ContrastiveExplainer(supabaseUrl, supabaseKey);
  }

  return explainerInstance;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Quick contrastive explanation for simple cases
 */
export function quickContrastiveExplanation(
  actualLabel: string,
  contrastLabel: string,
  reasons: string[]
): string {
  let explanation = `The outcome was "${actualLabel}" rather than "${contrastLabel}" because:\n`;

  for (const reason of reasons) {
    explanation += `\n- ${reason}`;
  }

  return explanation;
}

/**
 * Format factors for display
 */
export function formatDifferentiatingFactors(
  factors: DifferentiatingFactor[]
): string[] {
  return factors.map(f => {
    const influenceEmoji = f.influence.includes('supports') ? '✅' :
                          f.influence.includes('opposes') ? '❌' : '➖';
    return `${influenceEmoji} ${f.name}: ${f.actualValue} (weight: ${Math.round(f.weight * 100)}%)`;
  });
}
