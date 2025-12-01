/**
 * Circuit Breaker Pattern for AI Providers
 *
 * Phase 1, Week 1, Day 4
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.12
 *
 * Features:
 * - Per-provider circuit breaker
 * - Automatic failure detection
 * - Half-open state for recovery testing
 * - Configurable thresholds
 * - Event-driven notifications
 */

import { z } from 'zod';

// ================================================================
// TYPES
// ================================================================

export type CircuitState = 'closed' | 'open' | 'half-open';

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting to close circuit */
  resetTimeout: number;
  /** Number of successful calls needed to close from half-open */
  successThreshold: number;
  /** Time window in ms for counting failures */
  monitoringWindow: number;
  /** Timeout for individual requests in ms */
  requestTimeout: number;
}

export interface CircuitStats {
  provider: AIProvider;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: Date | null;
  lastSuccess: Date | null;
  totalRequests: number;
  totalFailures: number;
  failureRate: number;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  stateChangedAt: Date;
}

export interface CircuitBreakerEvent {
  type: 'state-change' | 'failure' | 'success' | 'timeout' | 'rejected';
  provider: AIProvider;
  previousState?: CircuitState;
  currentState: CircuitState;
  timestamp: Date;
  error?: Error;
  latencyMs?: number;
}

export type CircuitBreakerEventHandler = (event: CircuitBreakerEvent) => void;

// ================================================================
// CONFIGURATION
// ================================================================

export const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,        // Open after 5 failures
  resetTimeout: 30000,        // 30 seconds before half-open
  successThreshold: 3,        // 3 successes to close from half-open
  monitoringWindow: 60000,    // 1 minute window for failures
  requestTimeout: 30000,      // 30 second request timeout
};

export const ConfigSchema = z.object({
  failureThreshold: z.number().int().min(1).max(100),
  resetTimeout: z.number().int().min(1000).max(300000),
  successThreshold: z.number().int().min(1).max(20),
  monitoringWindow: z.number().int().min(1000).max(600000),
  requestTimeout: z.number().int().min(1000).max(120000),
});

// ================================================================
// CIRCUIT BREAKER CLASS
// ================================================================

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures: number = 0;
  private successes: number = 0;
  private consecutiveSuccesses: number = 0;
  private consecutiveFailures: number = 0;
  private lastFailure: Date | null = null;
  private lastSuccess: Date | null = null;
  private stateChangedAt: Date = new Date();
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private failureTimestamps: Date[] = [];
  private eventHandlers: Set<CircuitBreakerEventHandler> = new Set();
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(
    public readonly provider: AIProvider,
    private config: CircuitBreakerConfig = DEFAULT_CONFIG
  ) {}

  // ================================================================
  // PUBLIC METHODS
  // ================================================================

  /**
   * Execute a function through the circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit allows execution
    if (!this.canExecute()) {
      this.emitEvent({
        type: 'rejected',
        provider: this.provider,
        currentState: this.state,
        timestamp: new Date(),
      });
      throw new CircuitBreakerError(
        `Circuit breaker is ${this.state} for provider ${this.provider}`,
        this.provider,
        this.state
      );
    }

    this.totalRequests++;
    const startTime = Date.now();

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);

      this.onSuccess(Date.now() - startTime);
      return result;
    } catch (error) {
      this.onFailure(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Check if circuit allows execution
   */
  canExecute(): boolean {
    this.cleanupOldFailures();

    switch (this.state) {
      case 'closed':
        return true;
      case 'open':
        // Check if reset timeout has passed
        if (this.shouldAttemptReset()) {
          this.transitionTo('half-open');
          return true;
        }
        return false;
      case 'half-open':
        return true;
    }
  }

  /**
   * Get current circuit stats
   */
  getStats(): CircuitStats {
    this.cleanupOldFailures();

    return {
      provider: this.provider,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailure: this.lastFailure,
      lastSuccess: this.lastSuccess,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      failureRate: this.totalRequests > 0 ? this.totalFailures / this.totalRequests : 0,
      consecutiveSuccesses: this.consecutiveSuccesses,
      consecutiveFailures: this.consecutiveFailures,
      stateChangedAt: this.stateChangedAt,
    };
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Force circuit to specific state (for testing/admin)
   */
  forceState(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.stateChangedAt = new Date();

    if (newState === 'closed') {
      this.failures = 0;
      this.consecutiveFailures = 0;
      this.failureTimestamps = [];
    }

    this.emitEvent({
      type: 'state-change',
      provider: this.provider,
      previousState,
      currentState: newState,
      timestamp: new Date(),
    });
  }

  /**
   * Reset circuit to initial state
   */
  reset(): void {
    this.forceState('closed');
    this.successes = 0;
    this.consecutiveSuccesses = 0;
    this.lastFailure = null;
    this.lastSuccess = null;
    this.clearResetTimer();
  }

  /**
   * Subscribe to circuit events
   */
  onEvent(handler: CircuitBreakerEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearResetTimer();
    this.eventHandlers.clear();
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new CircuitBreakerTimeoutError(
          `Request timeout after ${this.config.requestTimeout}ms`,
          this.provider
        ));
      }, this.config.requestTimeout);

      fn()
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  private onSuccess(latencyMs: number): void {
    this.successes++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;
    this.lastSuccess = new Date();

    this.emitEvent({
      type: 'success',
      provider: this.provider,
      currentState: this.state,
      timestamp: new Date(),
      latencyMs,
    });

    if (this.state === 'half-open') {
      if (this.consecutiveSuccesses >= this.config.successThreshold) {
        this.transitionTo('closed');
      }
    }
  }

  private onFailure(error: Error): void {
    const now = new Date();
    this.failures++;
    this.totalFailures++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailure = now;
    this.failureTimestamps.push(now);

    const isTimeout = error instanceof CircuitBreakerTimeoutError;

    this.emitEvent({
      type: isTimeout ? 'timeout' : 'failure',
      provider: this.provider,
      currentState: this.state,
      timestamp: now,
      error,
    });

    if (this.state === 'half-open') {
      // Single failure in half-open returns to open
      this.transitionTo('open');
    } else if (this.state === 'closed') {
      // Check if threshold reached
      this.cleanupOldFailures();
      if (this.failures >= this.config.failureThreshold) {
        this.transitionTo('open');
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;
    this.stateChangedAt = new Date();

    this.emitEvent({
      type: 'state-change',
      provider: this.provider,
      previousState,
      currentState: newState,
      timestamp: new Date(),
    });

    if (newState === 'open') {
      this.scheduleReset();
    } else if (newState === 'closed') {
      this.failures = 0;
      this.consecutiveFailures = 0;
      this.failureTimestamps = [];
      this.clearResetTimer();
    } else if (newState === 'half-open') {
      this.consecutiveSuccesses = 0;
      this.clearResetTimer();
    }
  }

  private shouldAttemptReset(): boolean {
    const timeSinceStateChange = Date.now() - this.stateChangedAt.getTime();
    return timeSinceStateChange >= this.config.resetTimeout;
  }

  private scheduleReset(): void {
    this.clearResetTimer();
    this.resetTimer = setTimeout(() => {
      if (this.state === 'open') {
        this.transitionTo('half-open');
      }
    }, this.config.resetTimeout);
  }

  private clearResetTimer(): void {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = null;
    }
  }

  private cleanupOldFailures(): void {
    const cutoff = Date.now() - this.config.monitoringWindow;
    this.failureTimestamps = this.failureTimestamps.filter(
      (ts) => ts.getTime() > cutoff
    );
    this.failures = this.failureTimestamps.length;
  }

  private emitEvent(event: CircuitBreakerEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}

// ================================================================
// CIRCUIT BREAKER REGISTRY
// ================================================================

export class CircuitBreakerRegistry {
  private breakers: Map<AIProvider, CircuitBreaker> = new Map();
  private globalHandlers: Set<CircuitBreakerEventHandler> = new Set();
  private defaultConfig: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig = DEFAULT_CONFIG) {
    this.defaultConfig = config;
  }

  /**
   * Get or create circuit breaker for provider
   */
  get(provider: AIProvider): CircuitBreaker {
    let breaker = this.breakers.get(provider);

    if (!breaker) {
      breaker = new CircuitBreaker(provider, this.defaultConfig);

      // Forward events to global handlers
      breaker.onEvent((event) => {
        for (const handler of this.globalHandlers) {
          try {
            handler(event);
          } catch {
            // Ignore
          }
        }
      });

      this.breakers.set(provider, breaker);
    }

    return breaker;
  }

  /**
   * Get stats for all providers
   */
  getAllStats(): Map<AIProvider, CircuitStats> {
    const stats = new Map<AIProvider, CircuitStats>();

    for (const [provider, breaker] of this.breakers) {
      stats.set(provider, breaker.getStats());
    }

    return stats;
  }

  /**
   * Get summary of all circuit states
   */
  getSummary(): {
    total: number;
    closed: number;
    open: number;
    halfOpen: number;
    providers: Record<AIProvider, CircuitState>;
  } {
    const providers: Record<string, CircuitState> = {};
    let closed = 0;
    let open = 0;
    let halfOpen = 0;

    for (const [provider, breaker] of this.breakers) {
      const state = breaker.getState();
      providers[provider] = state;

      switch (state) {
        case 'closed':
          closed++;
          break;
        case 'open':
          open++;
          break;
        case 'half-open':
          halfOpen++;
          break;
      }
    }

    return {
      total: this.breakers.size,
      closed,
      open,
      halfOpen,
      providers: providers as Record<AIProvider, CircuitState>,
    };
  }

  /**
   * Check if provider is available
   */
  isAvailable(provider: AIProvider): boolean {
    const breaker = this.breakers.get(provider);
    return breaker ? breaker.canExecute() : true;
  }

  /**
   * Get list of available providers
   */
  getAvailableProviders(): AIProvider[] {
    const available: AIProvider[] = [];

    for (const [provider, breaker] of this.breakers) {
      if (breaker.canExecute()) {
        available.push(provider);
      }
    }

    return available;
  }

  /**
   * Subscribe to events from all circuit breakers
   */
  onEvent(handler: CircuitBreakerEventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Update config for all breakers
   */
  updateConfig(config: Partial<CircuitBreakerConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };

    for (const breaker of this.breakers.values()) {
      breaker.updateConfig(config);
    }
  }

  /**
   * Cleanup all resources
   */
  destroy(): void {
    for (const breaker of this.breakers.values()) {
      breaker.destroy();
    }
    this.breakers.clear();
    this.globalHandlers.clear();
  }
}

// ================================================================
// ERROR CLASSES
// ================================================================

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public readonly provider: AIProvider,
    public readonly state: CircuitState
  ) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

export class CircuitBreakerTimeoutError extends CircuitBreakerError {
  constructor(message: string, provider: AIProvider) {
    super(message, provider, 'closed');
    this.name = 'CircuitBreakerTimeoutError';
  }
}

// ================================================================
// FACTORY FUNCTIONS
// ================================================================

/**
 * Create a circuit breaker registry with default settings
 */
export function createCircuitBreakerRegistry(
  config?: Partial<CircuitBreakerConfig>
): CircuitBreakerRegistry {
  return new CircuitBreakerRegistry({
    ...DEFAULT_CONFIG,
    ...config,
  });
}

/**
 * Create a single circuit breaker
 */
export function createCircuitBreaker(
  provider: AIProvider,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  return new CircuitBreaker(provider, {
    ...DEFAULT_CONFIG,
    ...config,
  });
}

// ================================================================
// HIGHER-ORDER FUNCTION
// ================================================================

/**
 * Wrap an async function with circuit breaker protection
 */
export function withCircuitBreaker<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  breaker: CircuitBreaker
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    return breaker.execute(() => fn(...args));
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  CircuitBreaker,
  CircuitBreakerRegistry,
  CircuitBreakerError,
  CircuitBreakerTimeoutError,
  createCircuitBreakerRegistry,
  createCircuitBreaker,
  withCircuitBreaker,
  DEFAULT_CONFIG,
};
