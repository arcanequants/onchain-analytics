/**
 * Circuit Breaker Tests
 *
 * Phase 1, Week 1, Day 4
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitBreakerError,
  CircuitBreakerTimeoutError,
  createCircuitBreaker,
  createCircuitBreakerRegistry,
  withCircuitBreaker,
  DEFAULT_CONFIG,
  type CircuitState,
  type AIProvider,
  type CircuitBreakerEvent,
} from './circuit-breaker';

// ================================================================
// HELPER FUNCTIONS
// ================================================================

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const createSuccessfulCall = <T>(result: T, delayMs: number = 0) => async () => {
  if (delayMs > 0) await delay(delayMs);
  return result;
};

const createFailingCall = (error: Error, delayMs: number = 0) => async () => {
  if (delayMs > 0) await delay(delayMs);
  throw error;
};

// ================================================================
// CIRCUIT BREAKER TESTS
// ================================================================

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = createCircuitBreaker('openai', {
      failureThreshold: 3,
      resetTimeout: 5000,
      successThreshold: 2,
      monitoringWindow: 10000,
      requestTimeout: 1000,
    });
  });

  afterEach(() => {
    breaker.destroy();
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should allow execution in closed state', () => {
      expect(breaker.canExecute()).toBe(true);
    });

    it('should have correct initial stats', () => {
      const stats = breaker.getStats();

      expect(stats.provider).toBe('openai');
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.totalRequests).toBe(0);
      expect(stats.totalFailures).toBe(0);
      expect(stats.failureRate).toBe(0);
    });
  });

  describe('successful execution', () => {
    it('should execute successful call', async () => {
      const result = await breaker.execute(createSuccessfulCall('success'));

      expect(result).toBe('success');
    });

    it('should track successful calls', async () => {
      await breaker.execute(createSuccessfulCall('test'));

      const stats = breaker.getStats();
      expect(stats.successes).toBe(1);
      expect(stats.totalRequests).toBe(1);
      expect(stats.consecutiveSuccesses).toBe(1);
    });

    it('should update lastSuccess timestamp', async () => {
      await breaker.execute(createSuccessfulCall('test'));

      const stats = breaker.getStats();
      expect(stats.lastSuccess).toBeInstanceOf(Date);
    });

    it('should remain closed after success', async () => {
      await breaker.execute(createSuccessfulCall('test'));

      expect(breaker.getState()).toBe('closed');
    });
  });

  describe('failed execution', () => {
    it('should throw error on failed call', async () => {
      const error = new Error('Test error');

      await expect(breaker.execute(createFailingCall(error))).rejects.toThrow('Test error');
    });

    it('should track failed calls', async () => {
      try {
        await breaker.execute(createFailingCall(new Error('Test')));
      } catch {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.failures).toBe(1);
      expect(stats.totalFailures).toBe(1);
      expect(stats.consecutiveFailures).toBe(1);
    });

    it('should update lastFailure timestamp', async () => {
      try {
        await breaker.execute(createFailingCall(new Error('Test')));
      } catch {
        // Expected
      }

      const stats = breaker.getStats();
      expect(stats.lastFailure).toBeInstanceOf(Date);
    });
  });

  describe('state transitions', () => {
    it('should open after reaching failure threshold', async () => {
      const error = new Error('Test error');

      // Cause 3 failures (threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(createFailingCall(error));
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('open');
    });

    it('should reject calls when open', async () => {
      // Open the circuit
      breaker.forceState('open');

      await expect(
        breaker.execute(createSuccessfulCall('test'))
      ).rejects.toThrow(CircuitBreakerError);
    });

    it('should transition to half-open after reset timeout', async () => {
      breaker.forceState('open');

      // Advance time past reset timeout
      vi.advanceTimersByTime(6000);

      // Check if can execute (which triggers transition)
      expect(breaker.canExecute()).toBe(true);
      expect(breaker.getState()).toBe('half-open');
    });

    it('should close from half-open after success threshold', async () => {
      breaker.forceState('half-open');

      // Need 2 successes to close
      await breaker.execute(createSuccessfulCall('test1'));
      expect(breaker.getState()).toBe('half-open');

      await breaker.execute(createSuccessfulCall('test2'));
      expect(breaker.getState()).toBe('closed');
    });

    it('should return to open from half-open on failure', async () => {
      breaker.forceState('half-open');

      try {
        await breaker.execute(createFailingCall(new Error('Test')));
      } catch {
        // Expected
      }

      expect(breaker.getState()).toBe('open');
    });
  });

  describe('timeout handling', () => {
    it('should timeout slow requests', async () => {
      const slowCall = async () => {
        await delay(2000); // Longer than 1000ms timeout
        return 'result';
      };

      // Need to run real timers for this test
      vi.useRealTimers();

      const timeoutBreaker = createCircuitBreaker('openai', {
        ...DEFAULT_CONFIG,
        requestTimeout: 100,
      });

      await expect(timeoutBreaker.execute(slowCall)).rejects.toThrow(CircuitBreakerTimeoutError);

      timeoutBreaker.destroy();
    });
  });

  describe('monitoring window', () => {
    it('should clear old failures outside monitoring window', async () => {
      const error = new Error('Test');

      // Cause 2 failures
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(createFailingCall(error));
        } catch {
          // Expected
        }
      }

      expect(breaker.getStats().failures).toBe(2);

      // Advance time past monitoring window
      vi.advanceTimersByTime(11000);

      // Failures should be cleared
      expect(breaker.getStats().failures).toBe(0);
    });
  });

  describe('event handling', () => {
    it('should emit success event', async () => {
      const handler = vi.fn();
      breaker.onEvent(handler);

      await breaker.execute(createSuccessfulCall('test'));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          provider: 'openai',
          currentState: 'closed',
        })
      );
    });

    it('should emit failure event', async () => {
      const handler = vi.fn();
      breaker.onEvent(handler);

      try {
        await breaker.execute(createFailingCall(new Error('Test')));
      } catch {
        // Expected
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'failure',
          provider: 'openai',
        })
      );
    });

    it('should emit state-change event', async () => {
      const handler = vi.fn();
      breaker.onEvent(handler);

      breaker.forceState('open');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state-change',
          provider: 'openai',
          previousState: 'closed',
          currentState: 'open',
        })
      );
    });

    it('should emit rejected event when circuit is open', async () => {
      const handler = vi.fn();
      breaker.onEvent(handler);

      breaker.forceState('open');

      try {
        await breaker.execute(createSuccessfulCall('test'));
      } catch {
        // Expected
      }

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'rejected',
          provider: 'openai',
        })
      );
    });

    it('should allow unsubscribing from events', async () => {
      const handler = vi.fn();
      const unsubscribe = breaker.onEvent(handler);

      unsubscribe();

      await breaker.execute(createSuccessfulCall('test'));

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all state', async () => {
      // Cause some failures
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(createFailingCall(new Error('Test')));
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('open');

      breaker.reset();

      const stats = breaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
    });
  });

  describe('config update', () => {
    it('should allow updating config', async () => {
      breaker.updateConfig({ failureThreshold: 10 });

      // Should not open after 3 failures anymore
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(createFailingCall(new Error('Test')));
        } catch {
          // Expected
        }
      }

      expect(breaker.getState()).toBe('closed');
    });
  });
});

// ================================================================
// CIRCUIT BREAKER REGISTRY TESTS
// ================================================================

describe('CircuitBreakerRegistry', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    vi.useFakeTimers();
    registry = createCircuitBreakerRegistry({
      failureThreshold: 3,
      resetTimeout: 5000,
      successThreshold: 2,
      monitoringWindow: 10000,
      requestTimeout: 1000,
    });
  });

  afterEach(() => {
    registry.destroy();
    vi.useRealTimers();
  });

  describe('get', () => {
    it('should create new breaker for unknown provider', () => {
      const breaker = registry.get('openai');

      expect(breaker).toBeInstanceOf(CircuitBreaker);
      expect(breaker.provider).toBe('openai');
    });

    it('should return same breaker for same provider', () => {
      const breaker1 = registry.get('openai');
      const breaker2 = registry.get('openai');

      expect(breaker1).toBe(breaker2);
    });

    it('should create different breakers for different providers', () => {
      const openai = registry.get('openai');
      const anthropic = registry.get('anthropic');

      expect(openai).not.toBe(anthropic);
    });
  });

  describe('getAllStats', () => {
    it('should return stats for all registered providers', async () => {
      const openai = registry.get('openai');
      const anthropic = registry.get('anthropic');

      await openai.execute(createSuccessfulCall('test'));

      const allStats = registry.getAllStats();

      expect(allStats.size).toBe(2);
      expect(allStats.get('openai')?.successes).toBe(1);
      expect(allStats.get('anthropic')?.successes).toBe(0);
    });
  });

  describe('getSummary', () => {
    it('should return summary of all circuit states', () => {
      registry.get('openai');
      registry.get('anthropic');
      registry.get('google');

      registry.get('openai').forceState('open');

      const summary = registry.getSummary();

      expect(summary.total).toBe(3);
      expect(summary.closed).toBe(2);
      expect(summary.open).toBe(1);
      expect(summary.halfOpen).toBe(0);
      expect(summary.providers.openai).toBe('open');
      expect(summary.providers.anthropic).toBe('closed');
    });
  });

  describe('isAvailable', () => {
    it('should return true for available provider', () => {
      registry.get('openai');

      expect(registry.isAvailable('openai')).toBe(true);
    });

    it('should return false for unavailable provider', () => {
      const breaker = registry.get('openai');
      breaker.forceState('open');

      expect(registry.isAvailable('openai')).toBe(false);
    });

    it('should return true for unknown provider', () => {
      expect(registry.isAvailable('perplexity')).toBe(true);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return list of available providers', () => {
      registry.get('openai');
      registry.get('anthropic');
      registry.get('google');

      registry.get('openai').forceState('open');

      const available = registry.getAvailableProviders();

      expect(available).toContain('anthropic');
      expect(available).toContain('google');
      expect(available).not.toContain('openai');
    });
  });

  describe('global event handling', () => {
    it('should forward events from all breakers', async () => {
      const handler = vi.fn();
      registry.onEvent(handler);

      const openai = registry.get('openai');
      const anthropic = registry.get('anthropic');

      await openai.execute(createSuccessfulCall('test1'));
      await anthropic.execute(createSuccessfulCall('test2'));

      expect(handler).toHaveBeenCalledTimes(2);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'openai' })
      );
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'anthropic' })
      );
    });
  });

  describe('resetAll', () => {
    it('should reset all breakers', async () => {
      const openai = registry.get('openai');
      const anthropic = registry.get('anthropic');

      openai.forceState('open');
      anthropic.forceState('open');

      registry.resetAll();

      expect(openai.getState()).toBe('closed');
      expect(anthropic.getState()).toBe('closed');
    });
  });

  describe('updateConfig', () => {
    it('should update config for all breakers', async () => {
      const openai = registry.get('openai');

      registry.updateConfig({ failureThreshold: 10 });

      // Should not open after 3 failures
      for (let i = 0; i < 3; i++) {
        try {
          await openai.execute(createFailingCall(new Error('Test')));
        } catch {
          // Expected
        }
      }

      expect(openai.getState()).toBe('closed');
    });
  });
});

// ================================================================
// HIGHER-ORDER FUNCTION TESTS
// ================================================================

describe('withCircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = createCircuitBreaker('openai', {
      failureThreshold: 3,
      resetTimeout: 5000,
      successThreshold: 2,
      monitoringWindow: 10000,
      requestTimeout: 1000,
    });
  });

  afterEach(() => {
    breaker.destroy();
    vi.useRealTimers();
  });

  it('should wrap function with circuit breaker', async () => {
    const fn = async (x: number) => x * 2;
    const wrapped = withCircuitBreaker(fn, breaker);

    const result = await wrapped(5);

    expect(result).toBe(10);
    expect(breaker.getStats().successes).toBe(1);
  });

  it('should propagate errors through wrapped function', async () => {
    const fn = async () => {
      throw new Error('Original error');
    };
    const wrapped = withCircuitBreaker(fn, breaker);

    await expect(wrapped()).rejects.toThrow('Original error');
    expect(breaker.getStats().failures).toBe(1);
  });

  it('should open circuit on repeated failures', async () => {
    const fn = async () => {
      throw new Error('Failure');
    };
    const wrapped = withCircuitBreaker(fn, breaker);

    for (let i = 0; i < 3; i++) {
      try {
        await wrapped();
      } catch {
        // Expected
      }
    }

    expect(breaker.getState()).toBe('open');
    await expect(wrapped()).rejects.toThrow(CircuitBreakerError);
  });
});

// ================================================================
// ERROR CLASS TESTS
// ================================================================

describe('CircuitBreakerError', () => {
  it('should have correct properties', () => {
    const error = new CircuitBreakerError('Test message', 'openai', 'open');

    expect(error.message).toBe('Test message');
    expect(error.name).toBe('CircuitBreakerError');
    expect(error.provider).toBe('openai');
    expect(error.state).toBe('open');
  });
});

describe('CircuitBreakerTimeoutError', () => {
  it('should have correct properties', () => {
    const error = new CircuitBreakerTimeoutError('Timeout', 'anthropic');

    expect(error.message).toBe('Timeout');
    expect(error.name).toBe('CircuitBreakerTimeoutError');
    expect(error.provider).toBe('anthropic');
  });

  it('should extend CircuitBreakerError', () => {
    const error = new CircuitBreakerTimeoutError('Timeout', 'google');

    expect(error).toBeInstanceOf(CircuitBreakerError);
  });
});

// ================================================================
// FACTORY FUNCTION TESTS
// ================================================================

describe('Factory Functions', () => {
  describe('createCircuitBreaker', () => {
    it('should create breaker with default config', () => {
      const breaker = createCircuitBreaker('openai');

      expect(breaker).toBeInstanceOf(CircuitBreaker);
      expect(breaker.provider).toBe('openai');

      breaker.destroy();
    });

    it('should create breaker with custom config', () => {
      const breaker = createCircuitBreaker('anthropic', {
        failureThreshold: 10,
      });

      expect(breaker).toBeInstanceOf(CircuitBreaker);

      breaker.destroy();
    });
  });

  describe('createCircuitBreakerRegistry', () => {
    it('should create registry with default config', () => {
      const registry = createCircuitBreakerRegistry();

      expect(registry).toBeInstanceOf(CircuitBreakerRegistry);

      registry.destroy();
    });

    it('should create registry with custom config', () => {
      const registry = createCircuitBreakerRegistry({
        failureThreshold: 10,
      });

      expect(registry).toBeInstanceOf(CircuitBreakerRegistry);

      registry.destroy();
    });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('Integration Scenarios', () => {
  let registry: CircuitBreakerRegistry;

  beforeEach(() => {
    vi.useFakeTimers();
    registry = createCircuitBreakerRegistry({
      failureThreshold: 2,
      resetTimeout: 5000,
      successThreshold: 1,
      monitoringWindow: 10000,
      requestTimeout: 1000,
    });
  });

  afterEach(() => {
    registry.destroy();
    vi.useRealTimers();
  });

  it('should handle cascading failures across providers', async () => {
    const openai = registry.get('openai');
    const anthropic = registry.get('anthropic');
    const error = new Error('Provider down');

    // Fail both providers
    for (let i = 0; i < 2; i++) {
      try {
        await openai.execute(createFailingCall(error));
      } catch {}
      try {
        await anthropic.execute(createFailingCall(error));
      } catch {}
    }

    expect(openai.getState()).toBe('open');
    expect(anthropic.getState()).toBe('open');
    expect(registry.getAvailableProviders()).toHaveLength(0);
  });

  it('should recover providers independently', async () => {
    const openai = registry.get('openai');
    const anthropic = registry.get('anthropic');
    const error = new Error('Provider down');

    // Open both circuits
    for (let i = 0; i < 2; i++) {
      try {
        await openai.execute(createFailingCall(error));
      } catch {}
      try {
        await anthropic.execute(createFailingCall(error));
      } catch {}
    }

    // Wait for reset timeout
    vi.advanceTimersByTime(6000);

    // Only recover openai
    await openai.execute(createSuccessfulCall('test'));

    expect(openai.getState()).toBe('closed');
    expect(anthropic.getState()).toBe('half-open');
  });

  it('should track failure rate correctly', async () => {
    const breaker = registry.get('openai');

    // 3 successes, 2 failures = 40% failure rate
    await breaker.execute(createSuccessfulCall('test'));
    await breaker.execute(createSuccessfulCall('test'));
    await breaker.execute(createSuccessfulCall('test'));

    try {
      await breaker.execute(createFailingCall(new Error('Fail')));
    } catch {}
    try {
      await breaker.execute(createFailingCall(new Error('Fail')));
    } catch {}

    const stats = breaker.getStats();
    expect(stats.totalRequests).toBe(5);
    expect(stats.totalFailures).toBe(2);
    expect(stats.failureRate).toBe(0.4);
  });
});
