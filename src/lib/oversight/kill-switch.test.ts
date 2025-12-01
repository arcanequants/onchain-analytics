/**
 * Kill Switch Tests
 * Phase 1, Week 3, Day 5 - Governance Tasks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  KillSwitch,
  KillSwitchEvent,
  ActivationRequest,
  createKillSwitch,
  getKillSwitchScopes,
  getKillSwitchReasons,
  isEmergencyReason,
  getReasonPriority,
  formatKillSwitchEvent,
  getTimeRemaining,
  formatDuration
} from './kill-switch';

// ================================================================
// TEST HELPERS
// ================================================================

function createRequest(
  overrides: Partial<ActivationRequest> = {}
): ActivationRequest {
  return {
    scope: 'agent',
    scopeTarget: 'agent-001',
    reason: 'safety_concern',
    description: 'Test kill switch activation',
    requestedBy: 'admin',
    ...overrides
  };
}

// ================================================================
// BASIC TESTS
// ================================================================

describe('KillSwitch', () => {
  let killSwitch: KillSwitch;

  beforeEach(() => {
    killSwitch = new KillSwitch();
  });

  describe('activate()', () => {
    it('should activate kill switch for agent scope', () => {
      const request = createRequest({
        scope: 'agent',
        scopeTarget: 'agent-001'
      });

      const result = killSwitch.activate(request);

      expect(result.success).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event!.status).toBe('active');
      expect(result.event!.scope).toBe('agent');
      expect(result.event!.scopeTarget).toBe('agent-001');
    });

    it('should require approval for global scope', () => {
      const request = createRequest({
        scope: 'global',
        description: 'Emergency global shutdown'
      });

      const result = killSwitch.activate(request);

      expect(result.success).toBe(false);
      expect(result.requiresApproval).toBe(true);
      expect(result.approvalId).toBeDefined();
      expect(result.event!.status).toBe('pending');
    });

    it('should require approval for client scope', () => {
      const request = createRequest({
        scope: 'client',
        scopeTarget: 'client-123'
      });

      const result = killSwitch.activate(request);

      expect(result.success).toBe(false);
      expect(result.requiresApproval).toBe(true);
    });

    it('should set expiration based on duration', () => {
      const request = createRequest({
        durationMinutes: 30
      });

      const result = killSwitch.activate(request);

      expect(result.event!.expiresAt).toBeDefined();

      const expectedExpiry = Date.now() + 30 * 60 * 1000;
      const actualExpiry = result.event!.expiresAt!.getTime();

      // Allow 1 second tolerance
      expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(1000);
    });

    it('should use default max duration if not specified', () => {
      const request = createRequest({
        scope: 'feature', // 1 hour max
        scopeTarget: 'feature-x'
      });

      const result = killSwitch.activate(request);

      expect(result.event!.expiresAt).toBeDefined();
    });

    it('should generate unique event IDs', () => {
      const request1 = createRequest();
      const request2 = createRequest();

      const result1 = killSwitch.activate(request1);
      const result2 = killSwitch.activate(request2);

      expect(result1.event!.id).not.toBe(result2.event!.id);
    });

    it('should record activated by and timestamp', () => {
      const request = createRequest({
        requestedBy: 'security_team'
      });

      const result = killSwitch.activate(request);

      expect(result.event!.activatedBy).toBe('security_team');
      expect(result.event!.activatedAt).toBeInstanceOf(Date);
    });

    it('should determine affected operations', () => {
      const request = createRequest({
        scope: 'domain',
        scopeTarget: 'financial'
      });

      const result = killSwitch.activate(request);

      expect(result.event!.affectedOperations).toContain('domain:financial');
    });
  });

  // ================================================================
  // APPROVAL TESTS
  // ================================================================

  describe('approve()', () => {
    it('should approve pending global kill switch', () => {
      const request = createRequest({ scope: 'global' });
      const activation = killSwitch.activate(request);

      const result = killSwitch.approve(activation.approvalId!, 'cto');

      expect(result.success).toBe(true);
      expect(result.event!.status).toBe('active');
    });

    it('should reject non-authorized approver', () => {
      const request = createRequest({ scope: 'global' });
      const activation = killSwitch.activate(request);

      const result = killSwitch.approve(activation.approvalId!, 'random_user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not authorized');
    });

    it('should fail for non-existent event', () => {
      const result = killSwitch.approve('non-existent', 'cto');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should fail for already active event', () => {
      const request = createRequest({ scope: 'agent' });
      const activation = killSwitch.activate(request);

      // Event is already active (agent scope doesn't require approval)
      const result = killSwitch.approve(activation.event!.id, 'cto');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event is not pending approval');
    });

    it('should record approval metadata', () => {
      const request = createRequest({ scope: 'global' });
      const activation = killSwitch.activate(request);

      const result = killSwitch.approve(activation.approvalId!, 'head_of_ai');

      expect(result.event!.metadata).toBeDefined();
      expect(result.event!.metadata!.approvedBy).toBe('head_of_ai');
    });
  });

  describe('reject()', () => {
    it('should reject pending kill switch', () => {
      const request = createRequest({ scope: 'global' });
      const activation = killSwitch.activate(request);

      const result = killSwitch.reject(
        activation.approvalId!,
        'cto',
        'Not a valid emergency'
      );

      expect(result.success).toBe(true);
      expect(result.event!.status).toBe('inactive');
      expect(result.event!.metadata!.rejected).toBe(true);
    });

    it('should fail for already active event', () => {
      const request = createRequest({ scope: 'agent' });
      const activation = killSwitch.activate(request);

      const result = killSwitch.reject(
        activation.event!.id,
        'admin',
        'Test rejection'
      );

      expect(result.success).toBe(false);
    });
  });

  // ================================================================
  // DEACTIVATION TESTS
  // ================================================================

  describe('deactivate()', () => {
    it('should deactivate active kill switch', () => {
      const request = createRequest();
      const activation = killSwitch.activate(request);

      const result = killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Issue resolved'
      });

      expect(result.success).toBe(true);
      expect(result.event!.status).toBe('inactive');
      expect(result.event!.deactivatedBy).toBe('admin');
      expect(result.event!.deactivatedAt).toBeInstanceOf(Date);
    });

    it('should fail for non-existent event', () => {
      const result = killSwitch.deactivate({
        eventId: 'non-existent',
        requestedBy: 'admin',
        reason: 'Test'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event not found');
    });

    it('should fail for already inactive event', () => {
      const request = createRequest();
      const activation = killSwitch.activate(request);

      // Deactivate once
      killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'First deactivation'
      });

      // Try to deactivate again
      const result = killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Second deactivation'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Event is not active');
    });

    it('should record deactivation reason', () => {
      const request = createRequest();
      const activation = killSwitch.activate(request);

      const result = killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Performance restored'
      });

      expect(result.event!.metadata!.deactivationReason).toBe('Performance restored');
    });
  });

  // ================================================================
  // OPERATION CHECK TESTS
  // ================================================================

  describe('checkOperation()', () => {
    it('should allow operation when no kill switch active', () => {
      const result = killSwitch.checkOperation('generate_content');

      expect(result.allowed).toBe(true);
      expect(result.blockedBy).toBeUndefined();
    });

    it('should block operation when global kill switch active', () => {
      const request = createRequest({ scope: 'global' });
      killSwitch.activate(request);

      // Approve it
      const state = killSwitch.getState();
      killSwitch.approve(state.pendingApprovals[0].id, 'cto');

      const result = killSwitch.checkOperation('any_operation');

      expect(result.allowed).toBe(false);
      expect(result.blockedBy).toHaveLength(1);
      expect(result.blockedBy![0].scope).toBe('global');
    });

    it('should block matching agent operation', () => {
      killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'content-agent'
      }));

      const blocked = killSwitch.checkOperation('generate', {
        agentId: 'content-agent'
      });
      const allowed = killSwitch.checkOperation('generate', {
        agentId: 'other-agent'
      });

      expect(blocked.allowed).toBe(false);
      expect(allowed.allowed).toBe(true);
    });

    it('should block matching domain operation', () => {
      killSwitch.activate(createRequest({
        scope: 'domain',
        scopeTarget: 'financial'
      }));

      const blocked = killSwitch.checkOperation('calculate', {
        domain: 'financial'
      });
      const allowed = killSwitch.checkOperation('calculate', {
        domain: 'content'
      });

      expect(blocked.allowed).toBe(false);
      expect(allowed.allowed).toBe(true);
    });

    it('should block wildcard scope target', () => {
      killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: '*'
      }));

      const result = killSwitch.checkOperation('any', {
        agentId: 'any-agent'
      });

      expect(result.allowed).toBe(false);
    });

    it('should warn about pending global kill switch', () => {
      killSwitch.activate(createRequest({ scope: 'global' }));

      const result = killSwitch.checkOperation('test');

      // Operation is allowed (pending doesn't block), but should have warning
      expect(result.allowed).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings).toContain('Global kill switch pending approval');
    });

    it('should allow when context does not match', () => {
      killSwitch.activate(createRequest({
        scope: 'feature',
        scopeTarget: 'dark-mode'
      }));

      const result = killSwitch.checkOperation('generate', {
        feature: 'light-mode'
      });

      expect(result.allowed).toBe(true);
    });
  });

  // ================================================================
  // EXPIRATION TESTS
  // ================================================================

  describe('Event expiration', () => {
    it('should expire events after duration', () => {
      vi.useFakeTimers();

      killSwitch.activate(createRequest({
        durationMinutes: 1
      }));

      expect(killSwitch.getActiveEvents()).toHaveLength(1);

      // Advance time by 2 minutes
      vi.advanceTimersByTime(2 * 60 * 1000);

      expect(killSwitch.getActiveEvents()).toHaveLength(0);

      vi.useRealTimers();
    });

    it('should mark expired events with status', () => {
      vi.useFakeTimers();

      const result = killSwitch.activate(createRequest({
        durationMinutes: 1
      }));

      vi.advanceTimersByTime(2 * 60 * 1000);

      // Trigger expiration check
      killSwitch.getState();

      const event = killSwitch.getEvent(result.event!.id);

      expect(event!.status).toBe('expired');
      expect(event!.metadata!.expiredAutomatically).toBe(true);

      vi.useRealTimers();
    });
  });

  // ================================================================
  // STATE TESTS
  // ================================================================

  describe('getState()', () => {
    it('should return correct state with no events', () => {
      const state = killSwitch.getState();

      expect(state.isGlobalActive).toBe(false);
      expect(state.activeEvents).toHaveLength(0);
      expect(state.pendingApprovals).toHaveLength(0);
    });

    it('should track active events', () => {
      killSwitch.activate(createRequest({ scope: 'agent' }));
      killSwitch.activate(createRequest({ scope: 'domain' }));

      const state = killSwitch.getState();

      expect(state.activeEvents).toHaveLength(2);
    });

    it('should track pending approvals', () => {
      killSwitch.activate(createRequest({ scope: 'global' }));
      killSwitch.activate(createRequest({ scope: 'client', scopeTarget: 'c1' }));

      const state = killSwitch.getState();

      expect(state.pendingApprovals).toHaveLength(2);
    });

    it('should track recent deactivations', () => {
      const activation = killSwitch.activate(createRequest());

      killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Done'
      });

      const state = killSwitch.getState();

      expect(state.recentDeactivations).toHaveLength(1);
    });

    it('should report global active correctly', () => {
      killSwitch.activate(createRequest({ scope: 'global' }));

      let state = killSwitch.getState();
      expect(state.isGlobalActive).toBe(false); // Still pending

      killSwitch.approve(state.pendingApprovals[0].id, 'cto');

      state = killSwitch.getState();
      expect(state.isGlobalActive).toBe(true);
    });
  });

  // ================================================================
  // HELPER METHOD TESTS
  // ================================================================

  describe('Helper methods', () => {
    it('isGloballyHalted() should return correct status', () => {
      expect(killSwitch.isGloballyHalted()).toBe(false);

      const activation = killSwitch.activate(createRequest({ scope: 'global' }));
      expect(killSwitch.isGloballyHalted()).toBe(false); // Pending

      killSwitch.approve(activation.approvalId!, 'cto');
      expect(killSwitch.isGloballyHalted()).toBe(true);
    });

    it('isHalted() should check specific scope', () => {
      killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'agent-1'
      }));

      expect(killSwitch.isHalted('agent', 'agent-1')).toBe(true);
      expect(killSwitch.isHalted('agent', 'agent-2')).toBe(false);
      expect(killSwitch.isHalted('domain', 'any')).toBe(false);
    });

    it('isHalted() should return true for global halt', () => {
      const activation = killSwitch.activate(createRequest({ scope: 'global' }));
      killSwitch.approve(activation.approvalId!, 'head_of_ai');

      expect(killSwitch.isHalted('agent', 'any')).toBe(true);
      expect(killSwitch.isHalted('domain', 'any')).toBe(true);
    });

    it('getEventsByScope() should filter correctly', () => {
      killSwitch.activate(createRequest({ scope: 'agent', scopeTarget: 'a1' }));
      killSwitch.activate(createRequest({ scope: 'agent', scopeTarget: 'a2' }));
      killSwitch.activate(createRequest({ scope: 'domain', scopeTarget: 'd1' }));

      const agentEvents = killSwitch.getEventsByScope('agent');
      const domainEvents = killSwitch.getEventsByScope('domain');

      expect(agentEvents).toHaveLength(2);
      expect(domainEvents).toHaveLength(1);
    });

    it('getConfigForScope() should return scope configuration', () => {
      const globalConfig = killSwitch.getConfigForScope('global');
      const agentConfig = killSwitch.getConfigForScope('agent');

      expect(globalConfig.requireApproval).toBe(true);
      expect(agentConfig.requireApproval).toBe(false);
    });
  });

  // ================================================================
  // COOLDOWN TESTS
  // ================================================================

  describe('Cooldown', () => {
    it('should enforce cooldown after deactivation', () => {
      vi.useFakeTimers();

      // Activate and deactivate
      const activation = killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'agent-x'
      }));

      killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Done'
      });

      // Try to reactivate immediately
      const reactivation = killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'agent-x'
      }));

      expect(reactivation.success).toBe(false);
      expect(reactivation.error).toContain('Cooldown active');

      vi.useRealTimers();
    });

    it('should allow activation after cooldown expires', () => {
      vi.useFakeTimers();

      const activation = killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'agent-y'
      }));

      killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Done'
      });

      // Advance past cooldown (5 minutes default)
      vi.advanceTimersByTime(6 * 60 * 1000);

      const reactivation = killSwitch.activate(createRequest({
        scope: 'agent',
        scopeTarget: 'agent-y'
      }));

      expect(reactivation.success).toBe(true);

      vi.useRealTimers();
    });
  });

  // ================================================================
  // LISTENER TESTS
  // ================================================================

  describe('Event listeners', () => {
    it('should call activation listeners', () => {
      const listener = vi.fn();
      killSwitch.onActivation(listener);

      killSwitch.activate(createRequest());

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0][0].status).toBe('active');
    });

    it('should call deactivation listeners', () => {
      const listener = vi.fn();
      killSwitch.onDeactivation(listener);

      const activation = killSwitch.activate(createRequest());
      killSwitch.deactivate({
        eventId: activation.event!.id,
        requestedBy: 'admin',
        reason: 'Done'
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow removing listeners', () => {
      const listener = vi.fn();
      const unsubscribe = killSwitch.onActivation(listener);

      killSwitch.activate(createRequest());
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      killSwitch.activate(createRequest());
      expect(listener).toHaveBeenCalledTimes(1); // No additional call
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      killSwitch.onActivation(errorListener);
      killSwitch.onActivation(normalListener);

      // Should not throw
      expect(() => killSwitch.activate(createRequest())).not.toThrow();

      // Both listeners should be called
      expect(errorListener).toHaveBeenCalled();
      expect(normalListener).toHaveBeenCalled();
    });
  });

  // ================================================================
  // CLEAR TESTS
  // ================================================================

  describe('clearEvents()', () => {
    it('should clear all events', () => {
      killSwitch.activate(createRequest());
      killSwitch.activate(createRequest());
      killSwitch.activate(createRequest({ scope: 'global' }));

      killSwitch.clearEvents();

      const state = killSwitch.getState();

      expect(state.activeEvents).toHaveLength(0);
      expect(state.pendingApprovals).toHaveLength(0);
    });
  });
});

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('Utility functions', () => {
  describe('createKillSwitch()', () => {
    it('should create default kill switch', () => {
      const ks = createKillSwitch();

      expect(ks).toBeInstanceOf(KillSwitch);
    });
  });

  describe('getKillSwitchScopes()', () => {
    it('should return all scopes', () => {
      const scopes = getKillSwitchScopes();

      expect(scopes).toEqual(['global', 'agent', 'domain', 'client', 'feature']);
    });
  });

  describe('getKillSwitchReasons()', () => {
    it('should return all reasons', () => {
      const reasons = getKillSwitchReasons();

      expect(reasons).toHaveLength(9);
      expect(reasons).toContain('safety_concern');
      expect(reasons).toContain('security_incident');
    });
  });

  describe('isEmergencyReason()', () => {
    it('should identify emergency reasons', () => {
      expect(isEmergencyReason('safety_concern')).toBe(true);
      expect(isEmergencyReason('security_incident')).toBe(true);
      expect(isEmergencyReason('anomaly_detected')).toBe(true);
    });

    it('should identify non-emergency reasons', () => {
      expect(isEmergencyReason('scheduled_maintenance')).toBe(false);
      expect(isEmergencyReason('test_mode')).toBe(false);
    });
  });

  describe('getReasonPriority()', () => {
    it('should return priority order', () => {
      expect(getReasonPriority('safety_concern')).toBe(1);
      expect(getReasonPriority('security_incident')).toBe(2);
      expect(getReasonPriority('test_mode')).toBe(9);
    });

    it('should order emergency reasons higher', () => {
      expect(getReasonPriority('safety_concern')).toBeLessThan(
        getReasonPriority('scheduled_maintenance')
      );
    });
  });

  describe('formatKillSwitchEvent()', () => {
    it('should format event for display', () => {
      const event: KillSwitchEvent = {
        id: 'ks-123',
        scope: 'agent',
        scopeTarget: 'agent-001',
        reason: 'safety_concern',
        status: 'active',
        activatedBy: 'admin',
        activatedAt: new Date('2025-01-15T10:00:00Z'),
        expiresAt: new Date('2025-01-15T11:00:00Z'),
        description: 'Test event',
        affectedOperations: ['agent:agent-001']
      };

      const formatted = formatKillSwitchEvent(event);

      expect(formatted).toContain('ID: ks-123');
      expect(formatted).toContain('Status: ACTIVE');
      expect(formatted).toContain('Scope: agent (agent-001)');
      expect(formatted).toContain('Reason: safety concern');
      expect(formatted).toContain('Activated by: admin');
    });

    it('should include deactivation info when present', () => {
      const event: KillSwitchEvent = {
        id: 'ks-456',
        scope: 'domain',
        reason: 'performance_degradation',
        status: 'inactive',
        activatedBy: 'system',
        activatedAt: new Date('2025-01-15T10:00:00Z'),
        deactivatedBy: 'admin',
        deactivatedAt: new Date('2025-01-15T10:30:00Z'),
        description: 'Performance issue resolved',
        affectedOperations: ['domain:*']
      };

      const formatted = formatKillSwitchEvent(event);

      expect(formatted).toContain('Deactivated by: admin');
    });
  });

  describe('getTimeRemaining()', () => {
    it('should return time remaining for active event', () => {
      const event: KillSwitchEvent = {
        id: 'ks-789',
        scope: 'feature',
        reason: 'test_mode',
        status: 'active',
        activatedBy: 'dev',
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        description: 'Test',
        affectedOperations: ['feature:*']
      };

      const remaining = getTimeRemaining(event);

      expect(remaining).toBeGreaterThan(29 * 60 * 1000);
      expect(remaining).toBeLessThanOrEqual(30 * 60 * 1000);
    });

    it('should return undefined for inactive event', () => {
      const event: KillSwitchEvent = {
        id: 'ks-000',
        scope: 'agent',
        reason: 'test_mode',
        status: 'inactive',
        activatedBy: 'dev',
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() + 60000),
        description: 'Test',
        affectedOperations: []
      };

      expect(getTimeRemaining(event)).toBeUndefined();
    });

    it('should return 0 for expired event still marked active', () => {
      const event: KillSwitchEvent = {
        id: 'ks-111',
        scope: 'agent',
        reason: 'test_mode',
        status: 'active',
        activatedBy: 'dev',
        activatedAt: new Date(),
        expiresAt: new Date(Date.now() - 1000), // Already expired
        description: 'Test',
        affectedOperations: []
      };

      expect(getTimeRemaining(event)).toBe(0);
    });
  });

  describe('formatDuration()', () => {
    it('should format seconds', () => {
      expect(formatDuration(30000)).toBe('30 seconds');
      expect(formatDuration(5000)).toBe('5 seconds');
    });

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1 minutes');
      expect(formatDuration(300000)).toBe('5 minutes');
    });

    it('should format hours', () => {
      expect(formatDuration(3600000)).toBe('1.0 hours');
      expect(formatDuration(7200000)).toBe('2.0 hours');
      expect(formatDuration(5400000)).toBe('1.5 hours');
    });
  });
});
