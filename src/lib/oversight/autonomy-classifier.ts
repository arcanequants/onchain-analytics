/**
 * Autonomy Classifier Module
 * Phase 1, Week 3, Day 5 - Governance Tasks
 *
 * Classifies decisions into autonomy levels based on risk,
 * impact, and confidence thresholds.
 */

// ================================================================
// TYPES
// ================================================================

export type AutonomyLevel =
  | 'full'      // AI can act without human review
  | 'assisted'  // AI acts but human is notified
  | 'supervised' // AI proposes, human approves
  | 'manual';   // Human must make decision

export type DecisionDomain =
  | 'content-generation'
  | 'data-analysis'
  | 'recommendation'
  | 'classification'
  | 'scoring'
  | 'notification'
  | 'data-modification'
  | 'external-communication'
  | 'financial'
  | 'access-control';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface DecisionContext {
  domain: DecisionDomain;
  userId?: string;
  clientTier?: 'free' | 'starter' | 'pro' | 'enterprise';
  industry?: string;
  country?: string;
  dataSubjectCount?: number;
  financialImpact?: number;
  confidenceScore: number;
  isReversible: boolean;
  affectsExternalParties: boolean;
  metadata?: Record<string, unknown>;
}

export interface ClassificationResult {
  level: AutonomyLevel;
  riskLevel: RiskLevel;
  confidence: number;
  factors: ClassificationFactor[];
  requiredApprovers?: string[];
  maxResponseTime?: number; // minutes
  recommendations: string[];
}

export interface ClassificationFactor {
  name: string;
  weight: number;
  value: number;
  contribution: number;
  description: string;
}

export interface AutonomyPolicy {
  domain: DecisionDomain;
  defaultLevel: AutonomyLevel;
  overrides: PolicyOverride[];
  requiredConfidence: Record<AutonomyLevel, number>;
}

export interface PolicyOverride {
  condition: OverrideCondition;
  level: AutonomyLevel;
  reason: string;
}

export interface OverrideCondition {
  field: keyof DecisionContext | string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: unknown;
}

// ================================================================
// DEFAULT POLICIES
// ================================================================

const DEFAULT_POLICIES: AutonomyPolicy[] = [
  {
    domain: 'content-generation',
    defaultLevel: 'assisted',
    requiredConfidence: {
      full: 0.95,
      assisted: 0.8,
      supervised: 0.6,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'clientTier', operator: 'eq', value: 'enterprise' },
        level: 'supervised',
        reason: 'Enterprise clients require review for all content'
      },
      {
        condition: { field: 'affectsExternalParties', operator: 'eq', value: true },
        level: 'supervised',
        reason: 'External-facing content requires human review'
      }
    ]
  },
  {
    domain: 'data-analysis',
    defaultLevel: 'full',
    requiredConfidence: {
      full: 0.85,
      assisted: 0.7,
      supervised: 0.5,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'dataSubjectCount', operator: 'gt', value: 10000 },
        level: 'supervised',
        reason: 'Large-scale data analysis requires oversight'
      }
    ]
  },
  {
    domain: 'recommendation',
    defaultLevel: 'full',
    requiredConfidence: {
      full: 0.9,
      assisted: 0.75,
      supervised: 0.5,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'financialImpact', operator: 'gt', value: 50000 },
        level: 'supervised',
        reason: 'High-value recommendations require human approval'
      }
    ]
  },
  {
    domain: 'classification',
    defaultLevel: 'full',
    requiredConfidence: {
      full: 0.92,
      assisted: 0.8,
      supervised: 0.6,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'industry', operator: 'in', value: ['healthcare', 'fintech', 'legal'] },
        level: 'assisted',
        reason: 'Regulated industries require notification'
      }
    ]
  },
  {
    domain: 'scoring',
    defaultLevel: 'assisted',
    requiredConfidence: {
      full: 0.95,
      assisted: 0.85,
      supervised: 0.7,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'affectsExternalParties', operator: 'eq', value: true },
        level: 'supervised',
        reason: 'Scores affecting external parties need review'
      }
    ]
  },
  {
    domain: 'notification',
    defaultLevel: 'full',
    requiredConfidence: {
      full: 0.8,
      assisted: 0.6,
      supervised: 0.4,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'affectsExternalParties', operator: 'eq', value: true },
        level: 'assisted',
        reason: 'External notifications require confirmation'
      }
    ]
  },
  {
    domain: 'data-modification',
    defaultLevel: 'supervised',
    requiredConfidence: {
      full: 0.98,
      assisted: 0.9,
      supervised: 0.75,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'isReversible', operator: 'eq', value: false },
        level: 'manual',
        reason: 'Irreversible data changes require manual approval'
      }
    ]
  },
  {
    domain: 'external-communication',
    defaultLevel: 'supervised',
    requiredConfidence: {
      full: 0.98,
      assisted: 0.9,
      supervised: 0.8,
      manual: 0
    },
    overrides: []
  },
  {
    domain: 'financial',
    defaultLevel: 'manual',
    requiredConfidence: {
      full: 0.99,
      assisted: 0.95,
      supervised: 0.9,
      manual: 0
    },
    overrides: [
      {
        condition: { field: 'financialImpact', operator: 'lt', value: 100 },
        level: 'assisted',
        reason: 'Low-value financial operations can be automated with notification'
      }
    ]
  },
  {
    domain: 'access-control',
    defaultLevel: 'manual',
    requiredConfidence: {
      full: 0.99,
      assisted: 0.95,
      supervised: 0.9,
      manual: 0
    },
    overrides: []
  }
];

// ================================================================
// CLASSIFICATION WEIGHTS
// ================================================================

interface FactorWeight {
  name: string;
  baseWeight: number;
  calculate: (context: DecisionContext) => number;
  description: string;
}

const CLASSIFICATION_FACTORS: FactorWeight[] = [
  {
    name: 'confidence',
    baseWeight: 0.3,
    calculate: (ctx) => ctx.confidenceScore,
    description: 'AI confidence in the decision'
  },
  {
    name: 'reversibility',
    baseWeight: 0.2,
    calculate: (ctx) => ctx.isReversible ? 1 : 0,
    description: 'Whether the action can be undone'
  },
  {
    name: 'external_impact',
    baseWeight: 0.2,
    calculate: (ctx) => ctx.affectsExternalParties ? 0 : 1,
    description: 'Impact on external parties (inverted - external = lower score)'
  },
  {
    name: 'data_scale',
    baseWeight: 0.15,
    calculate: (ctx) => {
      const count = ctx.dataSubjectCount || 0;
      if (count === 0) return 1;
      if (count < 100) return 0.9;
      if (count < 1000) return 0.7;
      if (count < 10000) return 0.4;
      return 0.2;
    },
    description: 'Scale of data subjects affected'
  },
  {
    name: 'financial_risk',
    baseWeight: 0.15,
    calculate: (ctx) => {
      const impact = ctx.financialImpact || 0;
      if (impact === 0) return 1;
      if (impact < 1000) return 0.9;
      if (impact < 10000) return 0.7;
      if (impact < 100000) return 0.4;
      return 0.1;
    },
    description: 'Financial risk exposure'
  }
];

// ================================================================
// AUTONOMY CLASSIFIER CLASS
// ================================================================

export class AutonomyClassifier {
  private policies: AutonomyPolicy[];
  private factors: FactorWeight[];

  constructor(customPolicies?: AutonomyPolicy[]) {
    this.policies = customPolicies || [...DEFAULT_POLICIES];
    this.factors = [...CLASSIFICATION_FACTORS];
  }

  /**
   * Classify a decision context to determine autonomy level
   */
  classify(context: DecisionContext): ClassificationResult {
    // Get policy for domain
    const policy = this.getPolicy(context.domain);
    if (!policy) {
      return this.manualFallback(context, 'Unknown domain');
    }

    // Check for policy overrides
    const override = this.checkOverrides(policy, context);
    if (override) {
      return this.buildResult(override.level, context, policy, override.reason);
    }

    // Calculate classification score
    const { score, factors } = this.calculateScore(context);

    // Determine level based on confidence requirements
    const level = this.determineLevel(score, context.confidenceScore, policy);

    return this.buildResult(level, context, policy, undefined, factors, score);
  }

  /**
   * Get policy for domain
   */
  private getPolicy(domain: DecisionDomain): AutonomyPolicy | undefined {
    return this.policies.find(p => p.domain === domain);
  }

  /**
   * Check if any policy overrides apply
   */
  private checkOverrides(
    policy: AutonomyPolicy,
    context: DecisionContext
  ): PolicyOverride | undefined {
    for (const override of policy.overrides) {
      if (this.evaluateCondition(override.condition, context)) {
        return override;
      }
    }
    return undefined;
  }

  /**
   * Evaluate override condition
   */
  private evaluateCondition(
    condition: OverrideCondition,
    context: DecisionContext
  ): boolean {
    const value = this.getContextValue(context, condition.field);
    if (value === undefined) return false;

    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'contains':
        return typeof value === 'string' &&
               typeof condition.value === 'string' &&
               value.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * Get value from context by field path
   */
  private getContextValue(
    context: DecisionContext,
    field: string
  ): unknown {
    if (field in context) {
      return context[field as keyof DecisionContext];
    }
    // Check metadata
    if (context.metadata && field in context.metadata) {
      return context.metadata[field];
    }
    return undefined;
  }

  /**
   * Calculate classification score
   */
  private calculateScore(
    context: DecisionContext
  ): { score: number; factors: ClassificationFactor[] } {
    const calculatedFactors: ClassificationFactor[] = [];
    let totalScore = 0;
    let totalWeight = 0;

    for (const factor of this.factors) {
      const value = factor.calculate(context);
      const contribution = value * factor.baseWeight;
      totalScore += contribution;
      totalWeight += factor.baseWeight;

      calculatedFactors.push({
        name: factor.name,
        weight: factor.baseWeight,
        value,
        contribution,
        description: factor.description
      });
    }

    return {
      score: totalWeight > 0 ? totalScore / totalWeight : 0,
      factors: calculatedFactors
    };
  }

  /**
   * Determine autonomy level based on score and policy
   */
  private determineLevel(
    score: number,
    confidence: number,
    policy: AutonomyPolicy
  ): AutonomyLevel {
    // Check from highest to lowest autonomy
    if (confidence >= policy.requiredConfidence.full && score >= 0.85) {
      return 'full';
    }
    if (confidence >= policy.requiredConfidence.assisted && score >= 0.65) {
      return 'assisted';
    }
    if (confidence >= policy.requiredConfidence.supervised && score >= 0.45) {
      return 'supervised';
    }
    return 'manual';
  }

  /**
   * Build classification result
   */
  private buildResult(
    level: AutonomyLevel,
    context: DecisionContext,
    policy: AutonomyPolicy,
    overrideReason?: string,
    factors?: ClassificationFactor[],
    score?: number
  ): ClassificationResult {
    const riskLevel = this.calculateRiskLevel(level, context);
    const recommendations = this.generateRecommendations(level, context, riskLevel);

    return {
      level,
      riskLevel,
      confidence: score ?? context.confidenceScore,
      factors: factors || [],
      requiredApprovers: this.getRequiredApprovers(level, context),
      maxResponseTime: this.getMaxResponseTime(level, riskLevel),
      recommendations: overrideReason
        ? [`Override applied: ${overrideReason}`, ...recommendations]
        : recommendations
    };
  }

  /**
   * Manual fallback result
   */
  private manualFallback(
    context: DecisionContext,
    reason: string
  ): ClassificationResult {
    return {
      level: 'manual',
      riskLevel: 'high',
      confidence: 0,
      factors: [],
      requiredApprovers: ['admin'],
      maxResponseTime: 60,
      recommendations: [
        `Manual review required: ${reason}`,
        'Contact administrator for guidance'
      ]
    };
  }

  /**
   * Calculate risk level
   */
  private calculateRiskLevel(
    level: AutonomyLevel,
    context: DecisionContext
  ): RiskLevel {
    // Base risk from autonomy level
    let riskScore = 0;
    switch (level) {
      case 'full': riskScore = 0.1; break;
      case 'assisted': riskScore = 0.3; break;
      case 'supervised': riskScore = 0.5; break;
      case 'manual': riskScore = 0.7; break;
    }

    // Adjust for context
    if (!context.isReversible) riskScore += 0.15;
    if (context.affectsExternalParties) riskScore += 0.1;
    if ((context.financialImpact || 0) > 10000) riskScore += 0.1;
    if ((context.dataSubjectCount || 0) > 1000) riskScore += 0.05;

    // Adjust for confidence (lower confidence = higher risk)
    riskScore += (1 - context.confidenceScore) * 0.1;

    // Clamp and categorize
    riskScore = Math.min(1, Math.max(0, riskScore));

    if (riskScore >= 0.7) return 'critical';
    if (riskScore >= 0.5) return 'high';
    if (riskScore >= 0.3) return 'medium';
    return 'low';
  }

  /**
   * Get required approvers based on level and context
   */
  private getRequiredApprovers(
    level: AutonomyLevel,
    context: DecisionContext
  ): string[] | undefined {
    if (level === 'full') return undefined;

    const approvers: string[] = [];

    if (level === 'manual' || context.domain === 'financial') {
      approvers.push('finance_admin');
    }
    if (level === 'manual' || context.domain === 'access-control') {
      approvers.push('security_admin');
    }
    if (context.clientTier === 'enterprise') {
      approvers.push('account_manager');
    }
    if (context.affectsExternalParties) {
      approvers.push('communications_lead');
    }

    // Default approver if none specified
    if (approvers.length === 0) {
      if (level === 'supervised') approvers.push('team_lead');
      if (level === 'manual') approvers.push('admin');
    }

    return approvers;
  }

  /**
   * Get max response time in minutes
   */
  private getMaxResponseTime(
    level: AutonomyLevel,
    riskLevel: RiskLevel
  ): number | undefined {
    if (level === 'full') return undefined;

    const baseTime = {
      assisted: 60,
      supervised: 30,
      manual: 15
    };

    const riskMultiplier = {
      low: 2,
      medium: 1,
      high: 0.5,
      critical: 0.25
    };

    const time = baseTime[level as keyof typeof baseTime];
    return time ? Math.round(time * riskMultiplier[riskLevel]) : undefined;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    level: AutonomyLevel,
    context: DecisionContext,
    riskLevel: RiskLevel
  ): string[] {
    const recommendations: string[] = [];

    // Level-specific recommendations
    switch (level) {
      case 'full':
        recommendations.push('Decision can proceed automatically');
        if (context.confidenceScore < 0.9) {
          recommendations.push('Consider monitoring results for quality assurance');
        }
        break;
      case 'assisted':
        recommendations.push('Human will be notified of decision');
        recommendations.push('Review within 24 hours recommended');
        break;
      case 'supervised':
        recommendations.push('Human approval required before proceeding');
        recommendations.push('Provide clear justification with request');
        break;
      case 'manual':
        recommendations.push('Full human decision required');
        recommendations.push('AI analysis provided for reference only');
        break;
    }

    // Risk-specific recommendations
    if (riskLevel === 'critical') {
      recommendations.push('Escalate to senior leadership if needed');
    }
    if (riskLevel === 'high') {
      recommendations.push('Document decision rationale thoroughly');
    }

    // Context-specific recommendations
    if (!context.isReversible) {
      recommendations.push('Action is irreversible - double-check before proceeding');
    }
    if (context.affectsExternalParties) {
      recommendations.push('Consider external stakeholder impact');
    }
    if (context.domain === 'financial' && (context.financialImpact || 0) > 10000) {
      recommendations.push('High-value transaction - verify all details');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Add custom policy
   */
  addPolicy(policy: AutonomyPolicy): void {
    // Remove existing policy for same domain
    this.policies = this.policies.filter(p => p.domain !== policy.domain);
    this.policies.push(policy);
  }

  /**
   * Get all policies
   */
  getPolicies(): AutonomyPolicy[] {
    return [...this.policies];
  }

  /**
   * Get policy for domain
   */
  getPolicyForDomain(domain: DecisionDomain): AutonomyPolicy | undefined {
    return this.policies.find(p => p.domain === domain);
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Create default autonomy classifier
 */
export function createAutonomyClassifier(): AutonomyClassifier {
  return new AutonomyClassifier();
}

/**
 * Get all autonomy levels
 */
export function getAutonomyLevels(): AutonomyLevel[] {
  return ['full', 'assisted', 'supervised', 'manual'];
}

/**
 * Get all decision domains
 */
export function getDecisionDomains(): DecisionDomain[] {
  return [
    'content-generation',
    'data-analysis',
    'recommendation',
    'classification',
    'scoring',
    'notification',
    'data-modification',
    'external-communication',
    'financial',
    'access-control'
  ];
}

/**
 * Get all risk levels
 */
export function getRiskLevels(): RiskLevel[] {
  return ['low', 'medium', 'high', 'critical'];
}

/**
 * Check if autonomy level allows automatic action
 */
export function canActAutomatically(level: AutonomyLevel): boolean {
  return level === 'full' || level === 'assisted';
}

/**
 * Check if autonomy level requires human approval
 */
export function requiresHumanApproval(level: AutonomyLevel): boolean {
  return level === 'supervised' || level === 'manual';
}

/**
 * Format classification result for display
 */
export function formatClassificationResult(result: ClassificationResult): string {
  const lines = [
    `Autonomy Level: ${result.level.toUpperCase()}`,
    `Risk Level: ${result.riskLevel}`,
    `Confidence: ${(result.confidence * 100).toFixed(1)}%`
  ];

  if (result.requiredApprovers?.length) {
    lines.push(`Approvers: ${result.requiredApprovers.join(', ')}`);
  }
  if (result.maxResponseTime) {
    lines.push(`Response Time: ${result.maxResponseTime} minutes`);
  }

  return lines.join('\n');
}

/**
 * Compare two autonomy levels (returns -1, 0, or 1)
 */
export function compareAutonomyLevels(a: AutonomyLevel, b: AutonomyLevel): number {
  const order: Record<AutonomyLevel, number> = {
    full: 0,
    assisted: 1,
    supervised: 2,
    manual: 3
  };
  return order[a] - order[b];
}
