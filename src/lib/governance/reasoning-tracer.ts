/**
 * Reasoning Tracer
 *
 * Generates and manages human-readable reasoning traces for AI decisions.
 * Provides transparency into HOW the AI arrived at its conclusions.
 *
 * @module governance/reasoning-tracer
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';

// =====================================================
// TYPES
// =====================================================

export type ReasoningStepType =
  | 'observation'
  | 'inference'
  | 'rule_application'
  | 'comparison'
  | 'calculation'
  | 'pattern_match'
  | 'external_lookup'
  | 'assumption'
  | 'conclusion'
  | 'uncertainty';

export type ConfidenceLevel =
  | 'very_high'
  | 'high'
  | 'moderate'
  | 'low'
  | 'very_low';

export type DetailLevel = 'summary' | 'standard' | 'verbose' | 'debug';

export interface ReasoningStep {
  stepNumber: number;
  type: ReasoningStepType;
  title: string;
  description: string;
  inputSummary?: string;
  outputSummary?: string;
  confidence?: ConfidenceLevel;
  confidenceScore?: number;
  alternatives?: AlternativeConsidered[];
  parentStepId?: string;
  durationMs?: number;
}

export interface AlternativeConsidered {
  option: string;
  score?: number;
  whyNot: string;
}

export interface ReasoningTrace {
  id?: string;
  decisionId: string;
  decisionType: string;
  modelId?: string;
  finalOutcome: string;
  finalConfidence: ConfidenceLevel;
  finalConfidenceScore: number;
  summaryText: string;
  summaryPoints?: string[];
  steps: ReasoningStep[];
  detailLevel: DetailLevel;
  totalDurationMs?: number;
  createdAt?: Date;
}

export interface TraceBuilder {
  addObservation(title: string, description: string, inputSummary?: string): TraceBuilder;
  addInference(title: string, description: string, confidence?: ConfidenceLevel): TraceBuilder;
  addRuleApplication(rule: string, result: string): TraceBuilder;
  addComparison(title: string, items: string[], result: string, alternatives?: AlternativeConsidered[]): TraceBuilder;
  addCalculation(title: string, formula: string, result: string): TraceBuilder;
  addPatternMatch(pattern: string, matchScore: number, description: string): TraceBuilder;
  addExternalLookup(source: string, data: string): TraceBuilder;
  addAssumption(assumption: string, basis: string): TraceBuilder;
  addUncertainty(area: string, reason: string): TraceBuilder;
  addConclusion(conclusion: string, confidence: ConfidenceLevel): TraceBuilder;
  build(): ReasoningTrace;
}

// =====================================================
// REASONING TRACER CLASS
// =====================================================

export class ReasoningTracer {
  private supabase: ReturnType<typeof createClient>;
  private activeTraces = new Map<string, TraceBuilderImpl>();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Start building a new reasoning trace
   */
  startTrace(
    decisionId: string,
    decisionType: string,
    options?: {
      modelId?: string;
      detailLevel?: DetailLevel;
      userId?: string;
    }
  ): TraceBuilder {
    const builder = new TraceBuilderImpl(
      decisionId,
      decisionType,
      options?.modelId,
      options?.detailLevel || 'standard'
    );

    this.activeTraces.set(decisionId, builder);
    return builder;
  }

  /**
   * Complete and save a reasoning trace
   */
  async completeTrace(
    decisionId: string,
    finalOutcome: string,
    finalConfidenceScore: number,
    summaryText: string,
    summaryPoints?: string[],
    userId?: string
  ): Promise<ReasoningTrace> {
    const builder = this.activeTraces.get(decisionId);

    if (!builder) {
      throw new Error(`No active trace found for decision ${decisionId}`);
    }

    // Finalize the trace
    builder.setOutcome(finalOutcome, finalConfidenceScore);
    builder.setSummary(summaryText, summaryPoints);

    const trace = builder.build();

    // Save to database
    const savedTrace = await this.saveTrace(trace, userId);
    trace.id = savedTrace.id;

    // Cleanup
    this.activeTraces.delete(decisionId);

    return trace;
  }

  /**
   * Get a reasoning trace by decision ID
   */
  async getTrace(
    decisionId: string,
    detailLevel: DetailLevel = 'standard'
  ): Promise<ReasoningTrace | null> {
    const { data, error } = await this.supabase
      .rpc('get_reasoning_trace', {
        p_decision_id: decisionId,
        p_detail_level: detailLevel
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0];
    return {
      id: row.trace_id,
      decisionId,
      decisionType: '',
      finalOutcome: row.final_outcome,
      finalConfidence: row.confidence,
      finalConfidenceScore: 0,
      summaryText: row.summary_text,
      summaryPoints: row.summary_points,
      steps: (row.steps || []).map((s: Record<string, unknown>) => ({
        stepNumber: s.step_number as number,
        type: s.type as ReasoningStepType,
        title: s.title as string,
        description: s.description as string,
        inputSummary: s.input as string,
        outputSummary: s.output as string,
        confidence: s.confidence as ConfidenceLevel,
        alternatives: s.alternatives as AlternativeConsidered[]
      })),
      detailLevel,
      createdAt: new Date(row.created_at)
    };
  }

  /**
   * Get traces for a user
   */
  async getUserTraces(
    userId: string,
    limit: number = 20
  ): Promise<ReasoningTrace[]> {
    const { data, error } = await this.supabase
      .from('reasoning_traces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) {
      return [];
    }

    return data.map(row => ({
      id: row.id,
      decisionId: row.decision_id,
      decisionType: row.decision_type,
      modelId: row.model_id,
      finalOutcome: row.final_outcome,
      finalConfidence: row.final_confidence,
      finalConfidenceScore: row.final_confidence_score,
      summaryText: row.summary_text,
      summaryPoints: row.summary_bullet_points,
      steps: [],
      detailLevel: row.detail_level,
      totalDurationMs: row.total_reasoning_ms,
      createdAt: new Date(row.created_at)
    }));
  }

  /**
   * Record that a user viewed a trace
   */
  async recordView(traceId: string, durationSeconds?: number): Promise<boolean> {
    const { error } = await this.supabase
      .rpc('record_trace_view', {
        p_trace_id: traceId,
        p_view_duration_seconds: durationSeconds
      });

    return !error;
  }

  /**
   * Generate human-readable trace text
   */
  formatTrace(trace: ReasoningTrace): string {
    let output = '';

    // Header
    output += `## Reasoning Trace\n\n`;
    output += `**Decision:** ${trace.decisionType}\n`;
    output += `**Outcome:** ${trace.finalOutcome}\n`;
    output += `**Confidence:** ${this.formatConfidence(trace.finalConfidence)} (${Math.round(trace.finalConfidenceScore * 100)}%)\n\n`;

    // Summary
    output += `### Summary\n\n${trace.summaryText}\n\n`;

    if (trace.summaryPoints && trace.summaryPoints.length > 0) {
      output += `**Key Points:**\n`;
      for (const point of trace.summaryPoints) {
        output += `- ${point}\n`;
      }
      output += '\n';
    }

    // Steps
    if (trace.steps.length > 0) {
      output += `### Reasoning Steps\n\n`;

      for (const step of trace.steps) {
        const icon = this.getStepIcon(step.type);
        output += `${step.stepNumber}. ${icon} **${step.title}**\n`;
        output += `   ${step.description}\n`;

        if (step.inputSummary) {
          output += `   *Input:* ${step.inputSummary}\n`;
        }
        if (step.outputSummary) {
          output += `   *Output:* ${step.outputSummary}\n`;
        }
        if (step.confidence) {
          output += `   *Confidence:* ${this.formatConfidence(step.confidence)}\n`;
        }
        if (step.alternatives && step.alternatives.length > 0) {
          output += `   *Alternatives considered:*\n`;
          for (const alt of step.alternatives) {
            output += `   - ${alt.option}: ${alt.whyNot}\n`;
          }
        }
        output += '\n';
      }
    }

    // Footer
    if (trace.totalDurationMs) {
      output += `---\n*Reasoning completed in ${trace.totalDurationMs}ms*\n`;
    }

    return output;
  }

  // =====================================================
  // PRIVATE METHODS
  // =====================================================

  private async saveTrace(trace: ReasoningTrace, userId?: string): Promise<{ id: string }> {
    // Create trace
    const { data: traceId, error: traceError } = await this.supabase
      .rpc('create_reasoning_trace', {
        p_decision_id: trace.decisionId,
        p_decision_type: trace.decisionType,
        p_final_outcome: trace.finalOutcome,
        p_final_confidence: trace.finalConfidence,
        p_final_confidence_score: trace.finalConfidenceScore,
        p_summary_text: trace.summaryText,
        p_summary_points: trace.summaryPoints,
        p_user_id: userId,
        p_model_id: trace.modelId,
        p_detail_level: trace.detailLevel
      });

    if (traceError) {
      throw new Error(`Failed to create trace: ${traceError.message}`);
    }

    // Add steps
    for (const step of trace.steps) {
      await this.supabase.rpc('add_reasoning_step', {
        p_trace_id: traceId,
        p_step_number: step.stepNumber,
        p_step_type: step.type,
        p_title: step.title,
        p_description: step.description,
        p_input_summary: step.inputSummary,
        p_output_summary: step.outputSummary,
        p_confidence: step.confidence,
        p_alternatives: step.alternatives,
        p_parent_step_id: step.parentStepId
      });
    }

    // Finalize
    await this.supabase.rpc('finalize_reasoning_trace', {
      p_trace_id: traceId,
      p_total_duration_ms: trace.totalDurationMs
    });

    return { id: traceId };
  }

  private formatConfidence(level: ConfidenceLevel): string {
    const labels: Record<ConfidenceLevel, string> = {
      'very_high': 'Very High',
      'high': 'High',
      'moderate': 'Moderate',
      'low': 'Low',
      'very_low': 'Very Low'
    };
    return labels[level];
  }

  private getStepIcon(type: ReasoningStepType): string {
    const icons: Record<ReasoningStepType, string> = {
      'observation': '👁️',
      'inference': '🧠',
      'rule_application': '📋',
      'comparison': '⚖️',
      'calculation': '🔢',
      'pattern_match': '🔍',
      'external_lookup': '🌐',
      'assumption': '💭',
      'conclusion': '✅',
      'uncertainty': '❓'
    };
    return icons[type] || '•';
  }
}

// =====================================================
// TRACE BUILDER IMPLEMENTATION
// =====================================================

class TraceBuilderImpl implements TraceBuilder {
  private decisionId: string;
  private decisionType: string;
  private modelId?: string;
  private detailLevel: DetailLevel;
  private steps: ReasoningStep[] = [];
  private stepCounter = 0;
  private startTime: number;
  private outcome?: { label: string; score: number };
  private summary?: { text: string; points?: string[] };

  constructor(
    decisionId: string,
    decisionType: string,
    modelId?: string,
    detailLevel: DetailLevel = 'standard'
  ) {
    this.decisionId = decisionId;
    this.decisionType = decisionType;
    this.modelId = modelId;
    this.detailLevel = detailLevel;
    this.startTime = Date.now();
  }

  addObservation(title: string, description: string, inputSummary?: string): TraceBuilder {
    this.addStep('observation', title, description, { inputSummary });
    return this;
  }

  addInference(title: string, description: string, confidence?: ConfidenceLevel): TraceBuilder {
    this.addStep('inference', title, description, { confidence });
    return this;
  }

  addRuleApplication(rule: string, result: string): TraceBuilder {
    this.addStep('rule_application', `Apply Rule: ${rule}`, result);
    return this;
  }

  addComparison(
    title: string,
    items: string[],
    result: string,
    alternatives?: AlternativeConsidered[]
  ): TraceBuilder {
    const description = `Compared ${items.join(', ')}. Result: ${result}`;
    this.addStep('comparison', title, description, { alternatives });
    return this;
  }

  addCalculation(title: string, formula: string, result: string): TraceBuilder {
    this.addStep('calculation', title, `${formula} = ${result}`, { outputSummary: result });
    return this;
  }

  addPatternMatch(pattern: string, matchScore: number, description: string): TraceBuilder {
    this.addStep('pattern_match', `Pattern: ${pattern}`, description, {
      outputSummary: `Match score: ${Math.round(matchScore * 100)}%`
    });
    return this;
  }

  addExternalLookup(source: string, data: string): TraceBuilder {
    this.addStep('external_lookup', `Lookup: ${source}`, data);
    return this;
  }

  addAssumption(assumption: string, basis: string): TraceBuilder {
    this.addStep('assumption', `Assumption: ${assumption}`, `Based on: ${basis}`);
    return this;
  }

  addUncertainty(area: string, reason: string): TraceBuilder {
    this.addStep('uncertainty', `Uncertainty: ${area}`, reason);
    return this;
  }

  addConclusion(conclusion: string, confidence: ConfidenceLevel): TraceBuilder {
    this.addStep('conclusion', 'Conclusion', conclusion, { confidence });
    return this;
  }

  setOutcome(label: string, score: number): void {
    this.outcome = { label, score };
  }

  setSummary(text: string, points?: string[]): void {
    this.summary = { text, points };
  }

  build(): ReasoningTrace {
    if (!this.outcome) {
      throw new Error('Outcome not set. Call setOutcome() before build().');
    }

    if (!this.summary) {
      throw new Error('Summary not set. Call setSummary() before build().');
    }

    const confidence = this.scoreToConfidence(this.outcome.score);

    return {
      decisionId: this.decisionId,
      decisionType: this.decisionType,
      modelId: this.modelId,
      finalOutcome: this.outcome.label,
      finalConfidence: confidence,
      finalConfidenceScore: this.outcome.score,
      summaryText: this.summary.text,
      summaryPoints: this.summary.points,
      steps: this.steps,
      detailLevel: this.detailLevel,
      totalDurationMs: Date.now() - this.startTime,
      createdAt: new Date()
    };
  }

  private addStep(
    type: ReasoningStepType,
    title: string,
    description: string,
    options?: {
      inputSummary?: string;
      outputSummary?: string;
      confidence?: ConfidenceLevel;
      alternatives?: AlternativeConsidered[];
    }
  ): void {
    this.stepCounter++;
    this.steps.push({
      stepNumber: this.stepCounter,
      type,
      title,
      description,
      inputSummary: options?.inputSummary,
      outputSummary: options?.outputSummary,
      confidence: options?.confidence,
      alternatives: options?.alternatives
    });
  }

  private scoreToConfidence(score: number): ConfidenceLevel {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.75) return 'high';
    if (score >= 0.5) return 'moderate';
    if (score >= 0.25) return 'low';
    return 'very_low';
  }
}

// =====================================================
// SINGLETON INSTANCE
// =====================================================

let tracerInstance: ReasoningTracer | null = null;

export function getReasoningTracer(): ReasoningTracer {
  if (!tracerInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    tracerInstance = new ReasoningTracer(supabaseUrl, supabaseKey);
  }

  return tracerInstance;
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Quick trace for simple decisions
 */
export function quickReasoningTrace(
  decisionType: string,
  outcome: string,
  reasons: string[],
  confidence: ConfidenceLevel = 'high'
): ReasoningTrace {
  const steps: ReasoningStep[] = reasons.map((reason, index) => ({
    stepNumber: index + 1,
    type: 'inference' as ReasoningStepType,
    title: `Reason ${index + 1}`,
    description: reason
  }));

  steps.push({
    stepNumber: steps.length + 1,
    type: 'conclusion',
    title: 'Conclusion',
    description: `Determined outcome: ${outcome}`,
    confidence
  });

  return {
    decisionId: `quick-${Date.now()}`,
    decisionType,
    finalOutcome: outcome,
    finalConfidence: confidence,
    finalConfidenceScore: confidence === 'very_high' ? 0.95 :
                         confidence === 'high' ? 0.85 :
                         confidence === 'moderate' ? 0.65 :
                         confidence === 'low' ? 0.35 : 0.15,
    summaryText: `Decision: ${outcome}. Based on ${reasons.length} factors.`,
    steps,
    detailLevel: 'summary',
    createdAt: new Date()
  };
}

/**
 * Format trace steps as bullet points
 */
export function formatStepsAsBullets(trace: ReasoningTrace): string[] {
  return trace.steps.map(step => {
    let bullet = `${step.title}: ${step.description}`;
    if (step.confidence) {
      bullet += ` (${step.confidence} confidence)`;
    }
    return bullet;
  });
}
