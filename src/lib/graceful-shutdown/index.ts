/**
 * Graceful Shutdown Module
 *
 * Graceful shutdown handling, health checks, and connection draining
 *
 * Phase 3, Week 10
 */

// Types
export type {
  ShutdownSignal,
  ShutdownPhase,
  HandlerPriority,
  ShutdownHandler,
  ShutdownOptions,
  ShutdownLogger,
  HandlerResult,
  ShutdownResult,
  HealthStatus,
  HealthCheck,
  HealthResult,
  ConnectionDrainerOptions,
  KeepAliveOptions,
} from './types';

// Shutdown Manager
export {
  ShutdownManager,
  getShutdownManager,
  onShutdown,
  shutdown,
} from './shutdown-manager';

import {
  ShutdownManager as _ShutdownManager,
  getShutdownManager as _getShutdownManager,
  onShutdown as _onShutdown,
  shutdown as _shutdown,
} from './shutdown-manager';

// Health Check
export {
  HealthCheckManager,
  createHealthEndpoints,
  createDatabaseCheck,
  createRedisCheck,
  createMemoryCheck,
  createEventLoopCheck,
  createDiskCheck,
} from './health-check';

import {
  HealthCheckManager as _HealthCheckManager,
  createHealthEndpoints as _createHealthEndpoints,
  createDatabaseCheck as _createDatabaseCheck,
  createRedisCheck as _createRedisCheck,
  createMemoryCheck as _createMemoryCheck,
  createEventLoopCheck as _createEventLoopCheck,
  createDiskCheck as _createDiskCheck,
} from './health-check';

// Connection Drainer
export {
  ConnectionDrainer,
  HttpConnectionDrainer,
  WebSocketDrainer,
} from './connection-drainer';

import {
  ConnectionDrainer as _ConnectionDrainer,
  HttpConnectionDrainer as _HttpConnectionDrainer,
  WebSocketDrainer as _WebSocketDrainer,
} from './connection-drainer';

// ================================================================
// KEEP-ALIVE MONITOR
// ================================================================

import type { KeepAliveOptions } from './types';

/**
 * Keep-Alive Monitor
 *
 * Monitor process health with heartbeats
 *
 * @example
 * ```typescript
 * const keepAlive = new KeepAliveMonitor({
 *   interval: 30000,
 *   onMissedHeartbeat: (count) => {
 *     console.warn(`Missed ${count} heartbeats`);
 *   },
 * });
 *
 * keepAlive.start();
 *
 * // Record heartbeat on activity
 * app.use((req, res, next) => {
 *   keepAlive.heartbeat();
 *   next();
 * });
 * ```
 */
export class KeepAliveMonitor {
  private readonly interval: number;
  private readonly maxMissed: number;
  private readonly onHeartbeat?: () => void;
  private readonly onMissedHeartbeat?: (missedCount: number) => void;

  private timer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = Date.now();
  private missedCount = 0;
  private isRunning = false;

  constructor(options: KeepAliveOptions = {}) {
    this.interval = options.interval ?? 30000;
    this.maxMissed = options.maxMissed ?? 3;
    this.onHeartbeat = options.onHeartbeat;
    this.onMissedHeartbeat = options.onMissedHeartbeat;
  }

  /**
   * Start monitoring
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastHeartbeat = Date.now();
    this.missedCount = 0;

    this.timer = setInterval(() => {
      this.check();
    }, this.interval);
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Record a heartbeat
   */
  heartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.missedCount = 0;
    this.onHeartbeat?.();
  }

  /**
   * Check for missed heartbeats
   */
  private check(): void {
    const elapsed = Date.now() - this.lastHeartbeat;

    if (elapsed > this.interval) {
      this.missedCount++;
      this.onMissedHeartbeat?.(this.missedCount);
    }
  }

  /**
   * Check if healthy
   */
  isHealthy(): boolean {
    return this.missedCount < this.maxMissed;
  }

  /**
   * Get missed heartbeat count
   */
  getMissedCount(): number {
    return this.missedCount;
  }

  /**
   * Get time since last heartbeat
   */
  getTimeSinceHeartbeat(): number {
    return Date.now() - this.lastHeartbeat;
  }
}

// ================================================================
// GRACEFUL SHUTDOWN SETUP
// ================================================================

import { ShutdownManager } from './shutdown-manager';
import { HealthCheckManager } from './health-check';
import type { ShutdownOptions } from './types';

interface GracefulSetupOptions extends ShutdownOptions {
  /** Enable health checks */
  healthChecks?: boolean;
  /** Memory check threshold in MB */
  memoryThreshold?: number;
}

/**
 * Quick setup for graceful shutdown with defaults
 *
 * @example
 * ```typescript
 * const { shutdown, health } = setupGracefulShutdown({
 *   timeout: 30000,
 *   healthChecks: true,
 * });
 *
 * // Register shutdown handlers
 * shutdown.register({
 *   name: 'database',
 *   handler: () => db.close(),
 * });
 *
 * // Start listening
 * shutdown.listen();
 * ```
 */
export function setupGracefulShutdown(options: GracefulSetupOptions = {}): {
  shutdown: ShutdownManager;
  health: HealthCheckManager;
} {
  const shutdownManager = new ShutdownManager(options);
  const healthManager = new HealthCheckManager();

  // Register health checks if enabled
  if (options.healthChecks !== false) {
    healthManager.register(_createMemoryCheck(options.memoryThreshold || 1024));
    healthManager.register(_createEventLoopCheck(100));
  }

  // Connect health check to shutdown
  shutdownManager.register({
    name: 'health-check-shutdown',
    handler: () => {
      healthManager.setShuttingDown();
    },
    priority: 'critical',
  });

  return {
    shutdown: shutdownManager,
    health: healthManager,
  };
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  ShutdownManager: _ShutdownManager,
  getShutdownManager: _getShutdownManager,
  onShutdown: _onShutdown,
  shutdown: _shutdown,
  HealthCheckManager: _HealthCheckManager,
  createHealthEndpoints: _createHealthEndpoints,
  createDatabaseCheck: _createDatabaseCheck,
  createRedisCheck: _createRedisCheck,
  createMemoryCheck: _createMemoryCheck,
  createEventLoopCheck: _createEventLoopCheck,
  createDiskCheck: _createDiskCheck,
  ConnectionDrainer: _ConnectionDrainer,
  HttpConnectionDrainer: _HttpConnectionDrainer,
  WebSocketDrainer: _WebSocketDrainer,
  KeepAliveMonitor,
  setupGracefulShutdown,
};
