/**
 * Kill Switch Module
 * Phase 1, Week 3, Day 5 - Governance Tasks
 *
 * Emergency shutdown mechanism for AI operations.
 * Allows immediate halt of AI activities with audit trail.
 */

// ================================================================
// TYPES
// ================================================================

export type KillSwitchScope =
  | 'global'        // Entire system
  | 'agent'         // Specific AI agent
  | 'domain'        // Decision domain
  | 'client'        // Client-specific
  | 'feature';      // Feature-specific

export type KillSwitchReason =
  | 'safety_concern'
  | 'performance_degradation'
  | 'security_incident'
  | 'regulatory_compliance'
  | 'user_request'
  | 'scheduled_maintenance'
  | 'anomaly_detected'
  | 'manual_override'
  | 'test_mode';

export type KillSwitchStatus =
  | 'active'        // Kill switch is engaged
  | 'inactive'      // Kill switch is disengaged
  | 'pending'       // Activation pending approval
  | 'expired';      // Time-based kill switch expired

export interface KillSwitchEvent {
  id: string;
  scope: KillSwitchScope;
  scopeTarget?: string;      // Agent ID, domain name, client ID, etc.
  reason: KillSwitchReason;
  status: KillSwitchStatus;
  activatedBy: string;
  activatedAt: Date;
  deactivatedBy?: string;
  deactivatedAt?: Date;
  expiresAt?: Date;
  description: string;
  metadata?: Record<string, unknown>;
  affectedOperations: string[];
}

export interface KillSwitchConfig {
  requireApproval: boolean;
  approvers?: string[];
  maxDurationMinutes?: number;
  notificationChannels: string[];
  autoReactivationAllowed: boolean;
  cooldownMinutes: number;
}

export interface ActivationRequest {
  scope: KillSwitchScope;
  scopeTarget?: string;
  reason: KillSwitchReason;
  description: string;
  requestedBy: string;
  durationMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface ActivationResult {
  success: boolean;
  event?: KillSwitchEvent;
  error?: string;
  requiresApproval?: boolean;
  approvalId?: string;
}

export interface DeactivationRequest {
  eventId: string;
  requestedBy: string;
  reason: string;
}

export interface DeactivationResult {
  success: boolean;
  event?: KillSwitchEvent;
  error?: string;
}

export interface KillSwitchState {
  isGlobalActive: boolean;
  activeEvents: KillSwitchEvent[];
  pendingApprovals: KillSwitchEvent[];
  recentDeactivations: KillSwitchEvent[];
}

export interface OperationCheckResult {
  allowed: boolean;
  blockedBy?: KillSwitchEvent[];
  warnings?: string[];
}

// ================================================================
// DEFAULT CONFIGURATION
// ================================================================

const DEFAULT_CONFIG: KillSwitchConfig = {
  requireApproval: false,
  maxDurationMinutes: 1440, // 24 hours
  notificationChannels: ['email', 'slack', 'pagerduty'],
  autoReactivationAllowed: false,
  cooldownMinutes: 5
};

const SCOPE_CONFIGS: Record<KillSwitchScope, Partial<KillSwitchConfig>> = {
  global: {
    requireApproval: true,
    approvers: ['cto', 'head_of_ai'],
    notificationChannels: ['email', 'slack', 'pagerduty', 'sms']
  },
  agent: {
    requireApproval: false,
    maxDurationMinutes: 480 // 8 hours
  },
  domain: {
    requireApproval: false,
    maxDurationMinutes: 240 // 4 hours
  },
  client: {
    requireApproval: true,
    approvers: ['account_manager', 'support_lead']
  },
  feature: {
    requireApproval: false,
    maxDurationMinutes: 60 // 1 hour
  }
};

// ================================================================
// KILL SWITCH CLASS
// ================================================================

export class KillSwitch {
  private events: Map<string, KillSwitchEvent> = new Map();
  private config: KillSwitchConfig;
  private scopeConfigs: Record<KillSwitchScope, KillSwitchConfig>;
  private eventCounter: number = 0;
  private listeners: Set<(event: KillSwitchEvent) => void> = new Set();
  private deactivationListeners: Set<(event: KillSwitchEvent) => void> = new Set();

  constructor(customConfig?: Partial<KillSwitchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    this.scopeConfigs = this.buildScopeConfigs();
  }

  /**
   * Build scope-specific configurations
   */
  private buildScopeConfigs(): Record<KillSwitchScope, KillSwitchConfig> {
    const configs: Record<KillSwitchScope, KillSwitchConfig> = {} as Record<KillSwitchScope, KillSwitchConfig>;
    const scopes: KillSwitchScope[] = ['global', 'agent', 'domain', 'client', 'feature'];

    for (const scope of scopes) {
      configs[scope] = {
        ...this.config,
        ...(SCOPE_CONFIGS[scope] || {})
      };
    }

    return configs;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    this.eventCounter++;
    const timestamp = Date.now().toString(36);
    const counter = this.eventCounter.toString(36).padStart(4, '0');
    return `ks-${timestamp}-${counter}`;
  }

  /**
   * Activate kill switch
   */
  activate(request: ActivationRequest): ActivationResult {
    const config = this.scopeConfigs[request.scope];

    // Check if approval is required
    if (config.requireApproval) {
      const pendingEvent = this.createEvent(request, 'pending');
      this.events.set(pendingEvent.id, pendingEvent);

      return {
        success: false,
        requiresApproval: true,
        approvalId: pendingEvent.id,
        event: pendingEvent
      };
    }

    // Check for cooldown
    const cooldownCheck = this.checkCooldown(request.scope, request.scopeTarget);
    if (!cooldownCheck.allowed) {
      return {
        success: false,
        error: `Cooldown active. Wait ${cooldownCheck.remainingMinutes} minutes.`
      };
    }

    // Create active event
    const event = this.createEvent(request, 'active');
    this.events.set(event.id, event);

    // Notify listeners
    this.notifyActivation(event);

    return {
      success: true,
      event
    };
  }

  /**
   * Create kill switch event
   */
  private createEvent(
    request: ActivationRequest,
    status: KillSwitchStatus
  ): KillSwitchEvent {
    const config = this.scopeConfigs[request.scope];
    const now = new Date();

    let expiresAt: Date | undefined;
    if (request.durationMinutes) {
      expiresAt = new Date(now.getTime() + request.durationMinutes * 60 * 1000);
    } else if (config.maxDurationMinutes) {
      expiresAt = new Date(now.getTime() + config.maxDurationMinutes * 60 * 1000);
    }

    return {
      id: this.generateEventId(),
      scope: request.scope,
      scopeTarget: request.scopeTarget,
      reason: request.reason,
      status,
      activatedBy: request.requestedBy,
      activatedAt: now,
      expiresAt,
      description: request.description,
      metadata: request.metadata,
      affectedOperations: this.determineAffectedOperations(request.scope, request.scopeTarget)
    };
  }

  /**
   * Determine which operations are affected
   */
  private determineAffectedOperations(
    scope: KillSwitchScope,
    target?: string
  ): string[] {
    switch (scope) {
      case 'global':
        return ['*'];
      case 'agent':
        return [`agent:${target || '*'}`];
      case 'domain':
        return [`domain:${target || '*'}`];
      case 'client':
        return [`client:${target || '*'}`];
      case 'feature':
        return [`feature:${target || '*'}`];
      default:
        return [];
    }
  }

  /**
   * Check cooldown period
   */
  private checkCooldown(
    scope: KillSwitchScope,
    scopeTarget?: string
  ): { allowed: boolean; remainingMinutes?: number } {
    const config = this.scopeConfigs[scope];
    const now = new Date();

    // Find recent deactivations for same scope/target
    const recentDeactivations = Array.from(this.events.values()).filter(
      e =>
        e.scope === scope &&
        e.scopeTarget === scopeTarget &&
        e.status === 'inactive' &&
        e.deactivatedAt
    );

    for (const event of recentDeactivations) {
      const cooldownEnd = new Date(
        event.deactivatedAt!.getTime() + config.cooldownMinutes * 60 * 1000
      );

      if (now < cooldownEnd) {
        const remainingMs = cooldownEnd.getTime() - now.getTime();
        return {
          allowed: false,
          remainingMinutes: Math.ceil(remainingMs / 60000)
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Approve pending kill switch
   */
  approve(
    eventId: string,
    approver: string
  ): ActivationResult {
    const event = this.events.get(eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.status !== 'pending') {
      return { success: false, error: 'Event is not pending approval' };
    }

    const config = this.scopeConfigs[event.scope];

    // Check if approver is authorized
    if (config.approvers && !config.approvers.includes(approver)) {
      return {
        success: false,
        error: `Approver ${approver} is not authorized for ${event.scope} scope`
      };
    }

    // Activate the event
    event.status = 'active';
    event.activatedAt = new Date();
    event.metadata = {
      ...event.metadata,
      approvedBy: approver,
      approvedAt: new Date().toISOString()
    };

    // Update expiration if set
    if (config.maxDurationMinutes) {
      event.expiresAt = new Date(
        event.activatedAt.getTime() + config.maxDurationMinutes * 60 * 1000
      );
    }

    this.notifyActivation(event);

    return { success: true, event };
  }

  /**
   * Reject pending kill switch
   */
  reject(
    eventId: string,
    rejector: string,
    reason: string
  ): DeactivationResult {
    const event = this.events.get(eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.status !== 'pending') {
      return { success: false, error: 'Event is not pending approval' };
    }

    event.status = 'inactive';
    event.deactivatedBy = rejector;
    event.deactivatedAt = new Date();
    event.metadata = {
      ...event.metadata,
      rejected: true,
      rejectedBy: rejector,
      rejectionReason: reason
    };

    return { success: true, event };
  }

  /**
   * Deactivate kill switch
   */
  deactivate(request: DeactivationRequest): DeactivationResult {
    const event = this.events.get(request.eventId);

    if (!event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.status !== 'active') {
      return { success: false, error: 'Event is not active' };
    }

    event.status = 'inactive';
    event.deactivatedBy = request.requestedBy;
    event.deactivatedAt = new Date();
    event.metadata = {
      ...event.metadata,
      deactivationReason: request.reason
    };

    this.notifyDeactivation(event);

    return { success: true, event };
  }

  /**
   * Check if operation is allowed
   */
  checkOperation(
    operationType: string,
    context?: {
      agentId?: string;
      domain?: string;
      clientId?: string;
      feature?: string;
    }
  ): OperationCheckResult {
    // Check for expired events first
    this.expireOldEvents();

    const activeEvents = this.getActiveEvents();
    const blockingEvents: KillSwitchEvent[] = [];
    const warnings: string[] = [];

    // Check for pending global kill switch first
    const pendingGlobal = Array.from(this.events.values()).find(
      e => e.scope === 'global' && e.status === 'pending'
    );

    if (pendingGlobal) {
      warnings.push('Global kill switch pending approval');
    }

    // If no active events, return early (but include any warnings)
    if (activeEvents.length === 0) {
      return {
        allowed: true,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }

    for (const event of activeEvents) {
      if (this.eventBlocksOperation(event, operationType, context)) {
        blockingEvents.push(event);
      }
    }

    return {
      allowed: blockingEvents.length === 0,
      blockedBy: blockingEvents.length > 0 ? blockingEvents : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Check if event blocks operation
   */
  private eventBlocksOperation(
    event: KillSwitchEvent,
    operationType: string,
    context?: {
      agentId?: string;
      domain?: string;
      clientId?: string;
      feature?: string;
    }
  ): boolean {
    // Global blocks everything
    if (event.scope === 'global') {
      return true;
    }

    if (!context) {
      return false;
    }

    switch (event.scope) {
      case 'agent':
        return event.scopeTarget === context.agentId ||
               event.scopeTarget === '*';
      case 'domain':
        return event.scopeTarget === context.domain ||
               event.scopeTarget === '*';
      case 'client':
        return event.scopeTarget === context.clientId ||
               event.scopeTarget === '*';
      case 'feature':
        return event.scopeTarget === context.feature ||
               event.scopeTarget === '*';
      default:
        return false;
    }
  }

  /**
   * Expire old events
   */
  private expireOldEvents(): void {
    const now = new Date();

    for (const event of this.events.values()) {
      if (
        event.status === 'active' &&
        event.expiresAt &&
        event.expiresAt <= now
      ) {
        event.status = 'expired';
        event.deactivatedAt = now;
        event.metadata = {
          ...event.metadata,
          expiredAutomatically: true
        };

        this.notifyDeactivation(event);
      }
    }
  }

  /**
   * Get current state
   */
  getState(): KillSwitchState {
    this.expireOldEvents();

    const allEvents = Array.from(this.events.values());

    return {
      isGlobalActive: allEvents.some(
        e => e.scope === 'global' && e.status === 'active'
      ),
      activeEvents: allEvents.filter(e => e.status === 'active'),
      pendingApprovals: allEvents.filter(e => e.status === 'pending'),
      recentDeactivations: allEvents
        .filter(e => e.status === 'inactive' || e.status === 'expired')
        .sort((a, b) =>
          (b.deactivatedAt?.getTime() || 0) - (a.deactivatedAt?.getTime() || 0)
        )
        .slice(0, 10)
    };
  }

  /**
   * Get active events
   */
  getActiveEvents(): KillSwitchEvent[] {
    this.expireOldEvents();
    return Array.from(this.events.values()).filter(e => e.status === 'active');
  }

  /**
   * Get event by ID
   */
  getEvent(eventId: string): KillSwitchEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Get events by scope
   */
  getEventsByScope(scope: KillSwitchScope): KillSwitchEvent[] {
    return Array.from(this.events.values()).filter(e => e.scope === scope);
  }

  /**
   * Check if system is globally halted
   */
  isGloballyHalted(): boolean {
    return this.getActiveEvents().some(e => e.scope === 'global');
  }

  /**
   * Check if specific scope/target is halted
   */
  isHalted(
    scope: KillSwitchScope,
    scopeTarget?: string
  ): boolean {
    // Global halt affects everything
    if (this.isGloballyHalted()) {
      return true;
    }

    return this.getActiveEvents().some(
      e =>
        e.scope === scope &&
        (e.scopeTarget === scopeTarget || e.scopeTarget === '*')
    );
  }

  /**
   * Add activation listener
   */
  onActivation(listener: (event: KillSwitchEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Add deactivation listener
   */
  onDeactivation(listener: (event: KillSwitchEvent) => void): () => void {
    this.deactivationListeners.add(listener);
    return () => this.deactivationListeners.delete(listener);
  }

  /**
   * Notify activation listeners
   */
  private notifyActivation(event: KillSwitchEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Kill switch activation listener error:', error);
      }
    }
  }

  /**
   * Notify deactivation listeners
   */
  private notifyDeactivation(event: KillSwitchEvent): void {
    for (const listener of this.deactivationListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Kill switch deactivation listener error:', error);
      }
    }
  }

  /**
   * Get configuration for scope
   */
  getConfigForScope(scope: KillSwitchScope): KillSwitchConfig {
    return { ...this.scopeConfigs[scope] };
  }

  /**
   * Clear all events (for testing)
   */
  clearEvents(): void {
    this.events.clear();
    this.eventCounter = 0;
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Create default kill switch instance
 */
export function createKillSwitch(): KillSwitch {
  return new KillSwitch();
}

/**
 * Get all kill switch scopes
 */
export function getKillSwitchScopes(): KillSwitchScope[] {
  return ['global', 'agent', 'domain', 'client', 'feature'];
}

/**
 * Get all kill switch reasons
 */
export function getKillSwitchReasons(): KillSwitchReason[] {
  return [
    'safety_concern',
    'performance_degradation',
    'security_incident',
    'regulatory_compliance',
    'user_request',
    'scheduled_maintenance',
    'anomaly_detected',
    'manual_override',
    'test_mode'
  ];
}

/**
 * Check if reason is emergency
 */
export function isEmergencyReason(reason: KillSwitchReason): boolean {
  return [
    'safety_concern',
    'security_incident',
    'anomaly_detected'
  ].includes(reason);
}

/**
 * Get priority for reason
 */
export function getReasonPriority(reason: KillSwitchReason): number {
  const priorities: Record<KillSwitchReason, number> = {
    safety_concern: 1,
    security_incident: 2,
    anomaly_detected: 3,
    regulatory_compliance: 4,
    performance_degradation: 5,
    user_request: 6,
    manual_override: 7,
    scheduled_maintenance: 8,
    test_mode: 9
  };
  return priorities[reason];
}

/**
 * Format kill switch event for display
 */
export function formatKillSwitchEvent(event: KillSwitchEvent): string {
  const lines = [
    `ID: ${event.id}`,
    `Status: ${event.status.toUpperCase()}`,
    `Scope: ${event.scope}${event.scopeTarget ? ` (${event.scopeTarget})` : ''}`,
    `Reason: ${event.reason.replace(/_/g, ' ')}`,
    `Activated by: ${event.activatedBy}`,
    `Activated at: ${event.activatedAt.toISOString()}`
  ];

  if (event.expiresAt) {
    lines.push(`Expires at: ${event.expiresAt.toISOString()}`);
  }

  if (event.deactivatedBy) {
    lines.push(`Deactivated by: ${event.deactivatedBy}`);
  }

  if (event.deactivatedAt) {
    lines.push(`Deactivated at: ${event.deactivatedAt.toISOString()}`);
  }

  return lines.join('\n');
}

/**
 * Calculate time remaining for event
 */
export function getTimeRemaining(event: KillSwitchEvent): number | undefined {
  if (!event.expiresAt || event.status !== 'active') {
    return undefined;
  }

  const remaining = event.expiresAt.getTime() - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 60000) {
    return `${Math.ceil(milliseconds / 1000)} seconds`;
  }

  if (milliseconds < 3600000) {
    return `${Math.ceil(milliseconds / 60000)} minutes`;
  }

  return `${(milliseconds / 3600000).toFixed(1)} hours`;
}
