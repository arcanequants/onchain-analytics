/**
 * Shutdown Manager
 *
 * Manage graceful shutdown with handler registration
 *
 * Phase 3, Week 10
 */

import type {
  ShutdownSignal,
  ShutdownPhase,
  ShutdownHandler,
  ShutdownOptions,
  ShutdownLogger,
  ShutdownResult,
  HandlerResult,
  HandlerPriority,
} from './types';

// ================================================================
// DEFAULT OPTIONS
// ================================================================

const DEFAULT_OPTIONS: Required<ShutdownOptions> = {
  timeout: 30000,
  signals: ['SIGINT', 'SIGTERM'],
  exitProcess: true,
  exitCodeSuccess: 0,
  exitCodeFailure: 1,
  forceKillTimeout: 10000,
  logger: {
    info: (msg, ctx) => console.log(`[SHUTDOWN] ${msg}`, ctx || ''),
    warn: (msg, ctx) => console.warn(`[SHUTDOWN] ${msg}`, ctx || ''),
    error: (msg, ctx) => console.error(`[SHUTDOWN] ${msg}`, ctx || ''),
  },
  onShutdownStart: () => {},
  onShutdownComplete: () => {},
};

const PRIORITY_ORDER: Record<HandlerPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// ================================================================
// SHUTDOWN MANAGER CLASS
// ================================================================

/**
 * Graceful Shutdown Manager
 *
 * @example
 * ```typescript
 * const shutdown = new ShutdownManager({
 *   timeout: 30000,
 *   signals: ['SIGINT', 'SIGTERM'],
 * });
 *
 * // Register handlers
 * shutdown.register({
 *   name: 'database',
 *   handler: async () => {
 *     await db.close();
 *   },
 *   priority: 'high',
 * });
 *
 * shutdown.register({
 *   name: 'http-server',
 *   handler: async () => {
 *     await server.close();
 *   },
 *   priority: 'critical',
 * });
 *
 * // Start listening for signals
 * shutdown.listen();
 * ```
 */
export class ShutdownManager {
  private readonly options: Required<ShutdownOptions>;
  private readonly handlers: Map<string, ShutdownHandler> = new Map();
  private phase: ShutdownPhase = 'running';
  private isListening = false;
  private shutdownPromise: Promise<ShutdownResult> | null = null;

  constructor(options: ShutdownOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Register a shutdown handler
   */
  register(handler: ShutdownHandler): this {
    if (this.phase !== 'running') {
      this.options.logger.warn('Cannot register handler during shutdown', {
        name: handler.name,
      });
      return this;
    }

    this.handlers.set(handler.name, {
      ...handler,
      priority: handler.priority || 'normal',
      timeout: handler.timeout || this.options.timeout,
      required: handler.required ?? true,
    });

    this.options.logger.info(`Registered shutdown handler: ${handler.name}`, {
      priority: handler.priority || 'normal',
    });

    return this;
  }

  /**
   * Unregister a handler
   */
  unregister(name: string): boolean {
    return this.handlers.delete(name);
  }

  /**
   * Start listening for shutdown signals
   */
  listen(): this {
    if (this.isListening) return this;

    for (const signal of this.options.signals) {
      process.on(signal, () => this.initiateShutdown(signal));
    }

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      this.options.logger.error('Uncaught exception', { error: error.message });
      this.initiateShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      this.options.logger.error('Unhandled rejection', { reason: String(reason) });
      // Don't shutdown on unhandled rejection by default
    });

    this.isListening = true;
    this.options.logger.info('Listening for shutdown signals', {
      signals: this.options.signals,
    });

    return this;
  }

  /**
   * Stop listening for signals
   */
  stopListening(): this {
    if (!this.isListening) return this;

    for (const signal of this.options.signals) {
      process.removeAllListeners(signal);
    }

    this.isListening = false;
    return this;
  }

  /**
   * Initiate shutdown
   */
  async initiateShutdown(signal: string = 'manual'): Promise<ShutdownResult> {
    // Only run once
    if (this.shutdownPromise) {
      return this.shutdownPromise;
    }

    this.shutdownPromise = this.performShutdown(signal);
    return this.shutdownPromise;
  }

  /**
   * Perform the shutdown sequence
   */
  private async performShutdown(signal: string): Promise<ShutdownResult> {
    const startTime = Date.now();
    this.phase = 'draining';

    this.options.logger.info('Shutdown initiated', { signal });
    this.options.onShutdownStart(signal);

    const handlerResults: HandlerResult[] = [];
    let timedOut = false;

    // Sort handlers by priority
    const sortedHandlers = [...this.handlers.values()].sort(
      (a, b) => PRIORITY_ORDER[a.priority!] - PRIORITY_ORDER[b.priority!]
    );

    this.phase = 'closing';

    // Create timeout promise
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error('Shutdown timeout'));
      }, this.options.timeout);
    });

    // Execute handlers
    try {
      await Promise.race([
        this.executeHandlers(sortedHandlers, handlerResults),
        timeoutPromise,
      ]);
    } catch (error) {
      this.options.logger.warn('Shutdown timeout reached', {
        completed: handlerResults.length,
        total: sortedHandlers.length,
      });
    }

    this.phase = 'closed';

    const result: ShutdownResult = {
      success: !timedOut && handlerResults.every((r) => r.success),
      signal,
      handlers: handlerResults,
      duration: Date.now() - startTime,
      timedOut,
      failedCount: handlerResults.filter((r) => !r.success).length,
    };

    this.options.logger.info('Shutdown complete', {
      success: result.success,
      duration: result.duration,
      failedCount: result.failedCount,
    });

    this.options.onShutdownComplete(result);

    // Exit process if configured
    if (this.options.exitProcess) {
      const exitCode = result.success
        ? this.options.exitCodeSuccess
        : this.options.exitCodeFailure;

      // Give time for logs to flush
      setTimeout(() => {
        process.exit(exitCode);
      }, 100);
    }

    return result;
  }

  /**
   * Execute all handlers
   */
  private async executeHandlers(
    handlers: ShutdownHandler[],
    results: HandlerResult[]
  ): Promise<void> {
    for (const handler of handlers) {
      const result = await this.executeHandler(handler);
      results.push(result);

      if (!result.success && handler.required) {
        this.options.logger.error(`Required handler failed: ${handler.name}`, {
          error: result.error?.message,
        });
      }
    }
  }

  /**
   * Execute a single handler with timeout
   */
  private async executeHandler(handler: ShutdownHandler): Promise<HandlerResult> {
    const startTime = Date.now();
    let timedOut = false;

    try {
      this.options.logger.info(`Executing handler: ${handler.name}`);

      // Create timeout
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          timedOut = true;
          reject(new Error(`Handler timeout: ${handler.name}`));
        }, handler.timeout);
      });

      // Execute handler
      await Promise.race([
        Promise.resolve(handler.handler()),
        timeoutPromise,
      ]);

      const duration = Date.now() - startTime;
      this.options.logger.info(`Handler completed: ${handler.name}`, { duration });

      return {
        name: handler.name,
        success: true,
        duration,
        timedOut: false,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      this.options.logger.error(`Handler failed: ${handler.name}`, {
        error: errorObj.message,
        timedOut,
        duration,
      });

      return {
        name: handler.name,
        success: false,
        error: errorObj,
        duration,
        timedOut,
      };
    }
  }

  /**
   * Get current phase
   */
  getPhase(): ShutdownPhase {
    return this.phase;
  }

  /**
   * Check if shutdown is in progress
   */
  isShuttingDown(): boolean {
    return this.phase !== 'running';
  }

  /**
   * Get registered handler names
   */
  getHandlerNames(): string[] {
    return [...this.handlers.keys()];
  }

  /**
   * Get handler count
   */
  get handlerCount(): number {
    return this.handlers.size;
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let defaultManager: ShutdownManager | null = null;

/**
 * Get or create the default shutdown manager
 */
export function getShutdownManager(options?: ShutdownOptions): ShutdownManager {
  if (!defaultManager) {
    defaultManager = new ShutdownManager(options);
  }
  return defaultManager;
}

/**
 * Register a handler with the default manager
 */
export function onShutdown(handler: ShutdownHandler): void {
  getShutdownManager().register(handler);
}

/**
 * Initiate shutdown on the default manager
 */
export async function shutdown(signal?: string): Promise<ShutdownResult> {
  return getShutdownManager().initiateShutdown(signal);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ShutdownManager,
  getShutdownManager,
  onShutdown,
  shutdown,
};
