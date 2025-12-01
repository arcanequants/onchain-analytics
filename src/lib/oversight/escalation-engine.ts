/**
 * Escalation Engine Module
 * Phase 1, Week 3, Day 5 - Governance Tasks
 *
 * Implements a trigger matrix for escalating decisions based on
 * risk level, confidence, and impact thresholds.
 */

// ================================================================
// TYPES
// ================================================================

export type EscalationLevel = 'auto' | 'review' | 'human' | 'executive';

export type RiskCategory =
  | 'financial'
  | 'reputational'
  | 'legal'
  | 'operational'
  | 'security'
  | 'compliance';

export type TriggerType =
  | 'threshold'
  | 'anomaly'
  | 'pattern'
  | 'time-based'
  | 'manual';

export interface EscalationTrigger {
  id: string;
  name: string;
  description: string;
  type: TriggerType;
  category: RiskCategory;
  conditions: TriggerCondition[];
  escalationLevel: EscalationLevel;
  priority: 'critical' | 'high' | 'medium' | 'low';
  cooldownMinutes: number;
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'contains' | 'between';
  value: number | string | boolean | [number, number];
  weight?: number;
}

export interface EscalationContext {
  source: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  analysisId?: string;
  industry?: string;
  country?: string;
  metadata?: Record<string, unknown>;
}

export interface EscalationEvent {
  id: string;
  triggerId: string;
  triggerName: string;
  level: EscalationLevel;
  category: RiskCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context: EscalationContext;
  matchedConditions: string[];
  score: number;
  status: 'pending' | 'acknowledged' | 'resolved' | 'escalated';
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
  resolution?: string;
}

export interface EscalationMatrix {
  triggers: EscalationTrigger[];
  thresholds: Record<EscalationLevel, number>;
  routes: EscalationRoute[];
}

export interface EscalationRoute {
  level: EscalationLevel;
  category: RiskCategory;
  notifyChannels: NotifyChannel[];
  responseTimeSLA: number; // minutes
  autoEscalateAfter?: number; // minutes
}

export interface NotifyChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'dashboard';
  target: string;
  template?: string;
}

export interface EvaluationResult {
  shouldEscalate: boolean;
  level: EscalationLevel;
  matchedTriggers: EscalationTrigger[];
  totalScore: number;
  events: EscalationEvent[];
}

// ================================================================
// DEFAULT TRIGGER MATRIX
// ================================================================

const DEFAULT_TRIGGERS: EscalationTrigger[] = [
  // Financial Risk Triggers
  {
    id: 'fin-high-value',
    name: 'High Value Analysis',
    description: 'Analysis involves high-value client or competitor',
    type: 'threshold',
    category: 'financial',
    conditions: [
      { field: 'estimatedValue', operator: 'gt', value: 100000 }
    ],
    escalationLevel: 'review',
    priority: 'medium',
    cooldownMinutes: 60,
    enabled: true
  },
  {
    id: 'fin-enterprise',
    name: 'Enterprise Client',
    description: 'Request from enterprise tier client',
    type: 'threshold',
    category: 'financial',
    conditions: [
      { field: 'clientTier', operator: 'eq', value: 'enterprise' }
    ],
    escalationLevel: 'review',
    priority: 'medium',
    cooldownMinutes: 30,
    enabled: true
  },

  // Reputational Risk Triggers
  {
    id: 'rep-negative-sentiment',
    name: 'High Negative Sentiment',
    description: 'Analysis shows high negative sentiment about client',
    type: 'threshold',
    category: 'reputational',
    conditions: [
      { field: 'negativeSentiment', operator: 'gt', value: 0.7 }
    ],
    escalationLevel: 'human',
    priority: 'high',
    cooldownMinutes: 120,
    enabled: true
  },
  {
    id: 'rep-crisis-keywords',
    name: 'Crisis Keywords Detected',
    description: 'Analysis contains crisis-related keywords',
    type: 'pattern',
    category: 'reputational',
    conditions: [
      { field: 'keywords', operator: 'contains', value: 'lawsuit|scandal|fraud|breach' }
    ],
    escalationLevel: 'human',
    priority: 'critical',
    cooldownMinutes: 0,
    enabled: true
  },

  // Legal Risk Triggers
  {
    id: 'legal-regulated',
    name: 'Regulated Industry',
    description: 'Analysis in heavily regulated industry',
    type: 'threshold',
    category: 'legal',
    conditions: [
      { field: 'industry', operator: 'contains', value: 'healthcare|fintech|legal' }
    ],
    escalationLevel: 'review',
    priority: 'medium',
    cooldownMinutes: 60,
    enabled: true
  },
  {
    id: 'legal-gdpr-region',
    name: 'GDPR Region',
    description: 'Analysis involves EU data subjects',
    type: 'threshold',
    category: 'legal',
    conditions: [
      { field: 'region', operator: 'eq', value: 'EU' }
    ],
    escalationLevel: 'review',
    priority: 'medium',
    cooldownMinutes: 60,
    enabled: true
  },

  // Operational Risk Triggers
  {
    id: 'ops-low-confidence',
    name: 'Low Confidence Score',
    description: 'AI analysis has low confidence',
    type: 'threshold',
    category: 'operational',
    conditions: [
      { field: 'confidenceScore', operator: 'lt', value: 0.6 }
    ],
    escalationLevel: 'review',
    priority: 'medium',
    cooldownMinutes: 30,
    enabled: true
  },
  {
    id: 'ops-conflicting-sources',
    name: 'Conflicting Sources',
    description: 'Multiple data sources show conflicting information',
    type: 'anomaly',
    category: 'operational',
    conditions: [
      { field: 'sourceConflictScore', operator: 'gt', value: 0.5 }
    ],
    escalationLevel: 'review',
    priority: 'high',
    cooldownMinutes: 30,
    enabled: true
  },

  // Security Risk Triggers
  {
    id: 'sec-suspicious-pattern',
    name: 'Suspicious Access Pattern',
    description: 'Unusual access pattern detected',
    type: 'anomaly',
    category: 'security',
    conditions: [
      { field: 'requestsPerMinute', operator: 'gt', value: 10 },
      { field: 'uniqueIPCount', operator: 'gt', value: 5 }
    ],
    escalationLevel: 'human',
    priority: 'critical',
    cooldownMinutes: 5,
    enabled: true
  },
  {
    id: 'sec-pii-detected',
    name: 'PII Detected in Query',
    description: 'Personal identifiable information found in query',
    type: 'pattern',
    category: 'security',
    conditions: [
      { field: 'hasPII', operator: 'eq', value: true }
    ],
    escalationLevel: 'human',
    priority: 'critical',
    cooldownMinutes: 0,
    enabled: true
  },

  // Compliance Risk Triggers
  {
    id: 'comp-bias-threshold',
    name: 'Bias Threshold Exceeded',
    description: 'Analysis shows potential bias in results',
    type: 'threshold',
    category: 'compliance',
    conditions: [
      { field: 'biasScore', operator: 'gt', value: 0.3 }
    ],
    escalationLevel: 'human',
    priority: 'high',
    cooldownMinutes: 60,
    enabled: true
  },
  {
    id: 'comp-demographic-disparity',
    name: 'Demographic Disparity',
    description: 'Results show significant demographic disparity',
    type: 'threshold',
    category: 'compliance',
    conditions: [
      { field: 'disparityRatio', operator: 'gt', value: 1.5 }
    ],
    escalationLevel: 'executive',
    priority: 'critical',
    cooldownMinutes: 120,
    enabled: true
  }
];

// ================================================================
// DEFAULT ESCALATION ROUTES
// ================================================================

const DEFAULT_ROUTES: EscalationRoute[] = [
  // Auto level - no human intervention
  {
    level: 'auto',
    category: 'operational',
    notifyChannels: [
      { type: 'dashboard', target: 'ops-monitor' }
    ],
    responseTimeSLA: 0
  },

  // Review level - async review within SLA
  {
    level: 'review',
    category: 'financial',
    notifyChannels: [
      { type: 'email', target: 'finance-team@company.com' },
      { type: 'dashboard', target: 'finance-review' }
    ],
    responseTimeSLA: 240,
    autoEscalateAfter: 480
  },
  {
    level: 'review',
    category: 'legal',
    notifyChannels: [
      { type: 'email', target: 'legal-team@company.com' },
      { type: 'dashboard', target: 'legal-review' }
    ],
    responseTimeSLA: 120,
    autoEscalateAfter: 240
  },
  {
    level: 'review',
    category: 'operational',
    notifyChannels: [
      { type: 'slack', target: '#ops-alerts' },
      { type: 'dashboard', target: 'ops-review' }
    ],
    responseTimeSLA: 60,
    autoEscalateAfter: 120
  },

  // Human level - immediate human attention
  {
    level: 'human',
    category: 'reputational',
    notifyChannels: [
      { type: 'slack', target: '#critical-alerts' },
      { type: 'email', target: 'pr-team@company.com' },
      { type: 'sms', target: 'on-call-pr' }
    ],
    responseTimeSLA: 30,
    autoEscalateAfter: 60
  },
  {
    level: 'human',
    category: 'security',
    notifyChannels: [
      { type: 'slack', target: '#security-alerts' },
      { type: 'email', target: 'security-team@company.com' },
      { type: 'sms', target: 'on-call-security' }
    ],
    responseTimeSLA: 15,
    autoEscalateAfter: 30
  },
  {
    level: 'human',
    category: 'compliance',
    notifyChannels: [
      { type: 'email', target: 'compliance@company.com' },
      { type: 'dashboard', target: 'compliance-urgent' }
    ],
    responseTimeSLA: 60,
    autoEscalateAfter: 120
  },

  // Executive level - C-suite notification
  {
    level: 'executive',
    category: 'compliance',
    notifyChannels: [
      { type: 'email', target: 'executives@company.com' },
      { type: 'sms', target: 'ceo' },
      { type: 'slack', target: '#exec-alerts' }
    ],
    responseTimeSLA: 15,
    autoEscalateAfter: 30
  },
  {
    level: 'executive',
    category: 'reputational',
    notifyChannels: [
      { type: 'email', target: 'executives@company.com' },
      { type: 'sms', target: 'ceo' }
    ],
    responseTimeSLA: 15
  }
];

// ================================================================
// ESCALATION THRESHOLDS
// ================================================================

const DEFAULT_THRESHOLDS: Record<EscalationLevel, number> = {
  auto: 0,
  review: 30,
  human: 60,
  executive: 85
};

// ================================================================
// ESCALATION ENGINE CLASS
// ================================================================

export class EscalationEngine {
  private triggers: EscalationTrigger[];
  private routes: EscalationRoute[];
  private thresholds: Record<EscalationLevel, number>;
  private recentEvents: Map<string, Date> = new Map();

  constructor(matrix?: Partial<EscalationMatrix>) {
    // Deep copy triggers to prevent mutation of defaults
    this.triggers = (matrix?.triggers || DEFAULT_TRIGGERS).map(t => ({
      ...t,
      conditions: [...t.conditions]
    }));
    this.routes = matrix?.routes || [...DEFAULT_ROUTES];
    this.thresholds = matrix?.thresholds || { ...DEFAULT_THRESHOLDS };
  }

  /**
   * Evaluate data against trigger matrix
   */
  evaluate(data: Record<string, unknown>, context: EscalationContext): EvaluationResult {
    const matchedTriggers: EscalationTrigger[] = [];
    const events: EscalationEvent[] = [];
    let totalScore = 0;

    for (const trigger of this.triggers) {
      if (!trigger.enabled) continue;
      if (this.isInCooldown(trigger.id)) continue;

      const { matched, matchedConditions, score } = this.evaluateTrigger(trigger, data);

      if (matched) {
        matchedTriggers.push(trigger);
        totalScore += score;

        events.push(this.createEvent(trigger, context, matchedConditions, score));
        this.recordTriggerFire(trigger.id);
      }
    }

    const level = this.determineEscalationLevel(totalScore, matchedTriggers);
    const shouldEscalate = level !== 'auto' || matchedTriggers.length > 0;

    return {
      shouldEscalate,
      level,
      matchedTriggers,
      totalScore,
      events
    };
  }

  /**
   * Evaluate a single trigger against data
   */
  private evaluateTrigger(
    trigger: EscalationTrigger,
    data: Record<string, unknown>
  ): { matched: boolean; matchedConditions: string[]; score: number } {
    const matchedConditions: string[] = [];
    let score = 0;

    for (const condition of trigger.conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      const conditionMet = this.evaluateCondition(condition, fieldValue);

      if (conditionMet) {
        matchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
        score += condition.weight || 1;
      }
    }

    // All conditions must be met for AND logic
    const matched = matchedConditions.length === trigger.conditions.length;

    // Apply priority multiplier
    const priorityMultiplier = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1
    };

    return {
      matched,
      matchedConditions: matched ? matchedConditions : [],
      score: matched ? score * priorityMultiplier[trigger.priority] : 0
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: TriggerCondition,
    value: unknown
  ): boolean {
    if (value === undefined || value === null) return false;

    switch (condition.operator) {
      case 'gt':
        return typeof value === 'number' && value > (condition.value as number);
      case 'gte':
        return typeof value === 'number' && value >= (condition.value as number);
      case 'lt':
        return typeof value === 'number' && value < (condition.value as number);
      case 'lte':
        return typeof value === 'number' && value <= (condition.value as number);
      case 'eq':
        return value === condition.value;
      case 'neq':
        return value !== condition.value;
      case 'contains':
        if (typeof value === 'string' && typeof condition.value === 'string') {
          const pattern = new RegExp(condition.value, 'i');
          return pattern.test(value);
        }
        return false;
      case 'between':
        if (typeof value === 'number' && Array.isArray(condition.value)) {
          const [min, max] = condition.value as [number, number];
          return value >= min && value <= max;
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((acc: unknown, part: string) => {
      if (acc && typeof acc === 'object' && part in acc) {
        return (acc as Record<string, unknown>)[part];
      }
      return undefined;
    }, obj);
  }

  /**
   * Determine escalation level based on score and triggers
   */
  private determineEscalationLevel(
    score: number,
    matchedTriggers: EscalationTrigger[]
  ): EscalationLevel {
    // If any trigger explicitly requires executive level
    if (matchedTriggers.some(t => t.escalationLevel === 'executive')) {
      return 'executive';
    }

    // If any trigger explicitly requires human level
    if (matchedTriggers.some(t => t.escalationLevel === 'human')) {
      return 'human';
    }

    // If any trigger explicitly requires review level
    if (matchedTriggers.some(t => t.escalationLevel === 'review')) {
      return 'review';
    }

    // Score-based escalation (fallback)
    if (score >= this.thresholds.executive) return 'executive';
    if (score >= this.thresholds.human) return 'human';
    if (score >= this.thresholds.review) return 'review';

    return 'auto';
  }

  /**
   * Create escalation event
   */
  private createEvent(
    trigger: EscalationTrigger,
    context: EscalationContext,
    matchedConditions: string[],
    score: number
  ): EscalationEvent {
    return {
      id: `esc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      triggerId: trigger.id,
      triggerName: trigger.name,
      level: trigger.escalationLevel,
      category: trigger.category,
      priority: trigger.priority,
      context,
      matchedConditions,
      score,
      status: 'pending',
      createdAt: new Date()
    };
  }

  /**
   * Check if trigger is in cooldown period
   */
  private isInCooldown(triggerId: string): boolean {
    const lastFired = this.recentEvents.get(triggerId);
    if (!lastFired) return false;

    const trigger = this.triggers.find(t => t.id === triggerId);
    if (!trigger || trigger.cooldownMinutes === 0) return false;

    const cooldownMs = trigger.cooldownMinutes * 60 * 1000;
    return Date.now() - lastFired.getTime() < cooldownMs;
  }

  /**
   * Record trigger fire time
   */
  private recordTriggerFire(triggerId: string): void {
    this.recentEvents.set(triggerId, new Date());
  }

  /**
   * Get escalation route for level and category
   */
  getRoute(level: EscalationLevel, category: RiskCategory): EscalationRoute | undefined {
    return this.routes.find(r => r.level === level && r.category === category);
  }

  /**
   * Get all routes for a level
   */
  getRoutesForLevel(level: EscalationLevel): EscalationRoute[] {
    return this.routes.filter(r => r.level === level);
  }

  /**
   * Add custom trigger
   */
  addTrigger(trigger: EscalationTrigger): void {
    this.triggers.push(trigger);
  }

  /**
   * Remove trigger by ID
   */
  removeTrigger(triggerId: string): boolean {
    const index = this.triggers.findIndex(t => t.id === triggerId);
    if (index >= 0) {
      this.triggers.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Enable/disable trigger
   */
  setTriggerEnabled(triggerId: string, enabled: boolean): boolean {
    const trigger = this.triggers.find(t => t.id === triggerId);
    if (trigger) {
      trigger.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get all triggers
   */
  getTriggers(): EscalationTrigger[] {
    return [...this.triggers];
  }

  /**
   * Get triggers by category
   */
  getTriggersByCategory(category: RiskCategory): EscalationTrigger[] {
    return this.triggers.filter(t => t.category === category);
  }

  /**
   * Clear cooldown for testing
   */
  clearCooldowns(): void {
    this.recentEvents.clear();
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Create default escalation engine
 */
export function createEscalationEngine(): EscalationEngine {
  return new EscalationEngine();
}

/**
 * Get all risk categories
 */
export function getRiskCategories(): RiskCategory[] {
  return ['financial', 'reputational', 'legal', 'operational', 'security', 'compliance'];
}

/**
 * Get all escalation levels
 */
export function getEscalationLevels(): EscalationLevel[] {
  return ['auto', 'review', 'human', 'executive'];
}

/**
 * Get all trigger types
 */
export function getTriggerTypes(): TriggerType[] {
  return ['threshold', 'anomaly', 'pattern', 'time-based', 'manual'];
}

/**
 * Format escalation event for logging
 */
export function formatEscalationEvent(event: EscalationEvent): string {
  return `[${event.level.toUpperCase()}] ${event.triggerName} (${event.category}) - Score: ${event.score} - ${event.matchedConditions.join(', ')}`;
}

/**
 * Calculate response time remaining
 */
export function calculateSLARemaining(
  event: EscalationEvent,
  route: EscalationRoute
): number {
  const elapsedMs = Date.now() - event.createdAt.getTime();
  const slaMs = route.responseTimeSLA * 60 * 1000;
  return Math.max(0, slaMs - elapsedMs);
}

/**
 * Check if event should auto-escalate
 */
export function shouldAutoEscalate(
  event: EscalationEvent,
  route: EscalationRoute
): boolean {
  if (!route.autoEscalateAfter) return false;
  if (event.status !== 'pending') return false;

  const elapsedMs = Date.now() - event.createdAt.getTime();
  const autoEscalateMs = route.autoEscalateAfter * 60 * 1000;
  return elapsedMs >= autoEscalateMs;
}
