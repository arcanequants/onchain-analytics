/**
 * Graceful Shutdown Types
 *
 * Type definitions for graceful shutdown handling
 *
 * Phase 3, Week 10
 */

// ================================================================
// SHUTDOWN TYPES
// ================================================================

export type ShutdownSignal = 'SIGINT' | 'SIGTERM' | 'SIGQUIT' | 'SIGHUP';

export type ShutdownPhase = 'running' | 'draining' | 'closing' | 'closed';

export type HandlerPriority = 'critical' | 'high' | 'normal' | 'low';

export interface ShutdownHandler {
  /** Handler name for logging */
  name: string;
  /** Handler function */
  handler: () => Promise<void> | void;
  /** Priority (critical handlers run first) */
  priority?: HandlerPriority;
  /** Timeout for this handler (ms) */
  timeout?: number;
  /** Whether handler is required for clean shutdown */
  required?: boolean;
}

export interface ShutdownOptions {
  /** Timeout for all handlers (ms) */
  timeout?: number;
  /** Signals to listen for */
  signals?: ShutdownSignal[];
  /** Exit process after shutdown */
  exitProcess?: boolean;
  /** Exit code on success */
  exitCodeSuccess?: number;
  /** Exit code on failure */
  exitCodeFailure?: number;
  /** Logger function */
  logger?: ShutdownLogger;
  /** Called before shutdown starts */
  onShutdownStart?: (signal: string) => void;
  /** Called after shutdown completes */
  onShutdownComplete?: (result: ShutdownResult) => void;
  /** Force kill timeout (ms) after normal shutdown fails */
  forceKillTimeout?: number;
}

export interface ShutdownLogger {
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

export interface HandlerResult {
  /** Handler name */
  name: string;
  /** Whether handler succeeded */
  success: boolean;
  /** Error if failed */
  error?: Error;
  /** Duration in ms */
  duration: number;
  /** Whether handler timed out */
  timedOut: boolean;
}

export interface ShutdownResult {
  /** Whether shutdown was clean */
  success: boolean;
  /** Signal that triggered shutdown */
  signal: string;
  /** Handler results */
  handlers: HandlerResult[];
  /** Total duration in ms */
  duration: number;
  /** Whether shutdown timed out */
  timedOut: boolean;
  /** Number of failed handlers */
  failedCount: number;
}

// ================================================================
// HEALTH CHECK TYPES
// ================================================================

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded' | 'shutting_down';

export interface HealthCheck {
  /** Check name */
  name: string;
  /** Check function */
  check: () => Promise<boolean> | boolean;
  /** Timeout for check (ms) */
  timeout?: number;
  /** Whether check is critical */
  critical?: boolean;
}

export interface HealthResult {
  /** Overall status */
  status: HealthStatus;
  /** Individual check results */
  checks: Array<{
    name: string;
    healthy: boolean;
    duration: number;
    error?: string;
  }>;
  /** Whether system is accepting traffic */
  ready: boolean;
  /** Whether system is live */
  live: boolean;
  /** Timestamp */
  timestamp: Date;
}

// ================================================================
// CONNECTION DRAINING TYPES
// ================================================================

export interface ConnectionDrainerOptions {
  /** Time to wait for connections to drain (ms) */
  drainTimeout?: number;
  /** Interval to check connection count (ms) */
  checkInterval?: number;
  /** Callback when draining starts */
  onDrainStart?: () => void;
  /** Callback when draining completes */
  onDrainComplete?: (remainingConnections: number) => void;
}

// ================================================================
// KEEP-ALIVE TYPES
// ================================================================

export interface KeepAliveOptions {
  /** Interval between heartbeats (ms) */
  interval?: number;
  /** Callback on heartbeat */
  onHeartbeat?: () => void;
  /** Callback on missed heartbeat */
  onMissedHeartbeat?: (missedCount: number) => void;
  /** Max missed heartbeats before unhealthy */
  maxMissed?: number;
}
