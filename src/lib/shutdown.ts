/**
 * Graceful Shutdown Module
 *
 * Phase 2, Week 3, Day 5
 * Handles clean shutdown of services and connections
 */

// ================================================================
// TYPES
// ================================================================

export type ShutdownHandler = () => Promise<void> | void;

export interface ShutdownOptions {
  /** Maximum time to wait for handlers in ms (default: 30000) */
  timeout?: number;
  /** Log function (default: console.log) */
  logger?: (message: string) => void;
  /** Exit process after shutdown (default: true in production) */
  exitProcess?: boolean;
  /** Force exit on timeout (default: true) */
  forceOnTimeout?: boolean;
}

export interface ShutdownState {
  isShuttingDown: boolean;
  shutdownStartedAt: Date | null;
  handlersCompleted: number;
  totalHandlers: number;
  errors: Error[];
}

export interface RegisteredHandler {
  name: string;
  handler: ShutdownHandler;
  priority: number;
  timeout?: number;
}

// ================================================================
// SHUTDOWN MANAGER
// ================================================================

class ShutdownManager {
  private handlers: RegisteredHandler[] = [];
  private state: ShutdownState = {
    isShuttingDown: false,
    shutdownStartedAt: null,
    handlersCompleted: 0,
    totalHandlers: 0,
    errors: [],
  };
  private options: ShutdownOptions;
  private shutdownPromise: Promise<void> | null = null;

  constructor(options: ShutdownOptions = {}) {
    this.options = {
      timeout: 30000,
      logger: console.log,
      exitProcess: process.env.NODE_ENV === 'production',
      forceOnTimeout: true,
      ...options,
    };

    // Register signal handlers
    this.registerSignalHandlers();
  }

  // ================================================================
  // PUBLIC API
  // ================================================================

  /**
   * Register a shutdown handler
   */
  register(
    name: string,
    handler: ShutdownHandler,
    options: { priority?: number; timeout?: number } = {}
  ): () => void {
    const registeredHandler: RegisteredHandler = {
      name,
      handler,
      priority: options.priority ?? 10,
      timeout: options.timeout,
    };

    this.handlers.push(registeredHandler);
    this.handlers.sort((a, b) => a.priority - b.priority);

    this.log(`Registered shutdown handler: ${name} (priority: ${registeredHandler.priority})`);

    // Return unregister function
    return () => {
      const index = this.handlers.findIndex((h) => h === registeredHandler);
      if (index !== -1) {
        this.handlers.splice(index, 1);
        this.log(`Unregistered shutdown handler: ${name}`);
      }
    };
  }

  /**
   * Check if shutdown is in progress
   */
  get isShuttingDown(): boolean {
    return this.state.isShuttingDown;
  }

  /**
   * Get current shutdown state
   */
  getState(): Readonly<ShutdownState> {
    return { ...this.state };
  }

  /**
   * Trigger graceful shutdown
   */
  async shutdown(signal?: string): Promise<void> {
    // Prevent multiple shutdowns
    if (this.shutdownPromise) {
      this.log('Shutdown already in progress, waiting...');
      return this.shutdownPromise;
    }

    this.shutdownPromise = this.performShutdown(signal);
    return this.shutdownPromise;
  }

  /**
   * Force immediate shutdown
   */
  forceShutdown(exitCode: number = 1): never {
    this.log('Force shutdown initiated');
    process.exit(exitCode);
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private async performShutdown(signal?: string): Promise<void> {
    this.state.isShuttingDown = true;
    this.state.shutdownStartedAt = new Date();
    this.state.totalHandlers = this.handlers.length;
    this.state.handlersCompleted = 0;
    this.state.errors = [];

    this.log(`\n${'='.repeat(50)}`);
    this.log(`Graceful shutdown initiated${signal ? ` (${signal})` : ''}`);
    this.log(`${'='.repeat(50)}`);
    this.log(`Handlers to execute: ${this.handlers.length}`);

    const startTime = Date.now();

    // Create timeout promise
    const timeoutPromise = new Promise<'timeout'>((resolve) => {
      setTimeout(() => resolve('timeout'), this.options.timeout!);
    });

    // Execute handlers with timeout
    const shutdownPromise = this.executeHandlers();

    const result = await Promise.race([shutdownPromise, timeoutPromise]);

    const elapsed = Date.now() - startTime;

    if (result === 'timeout') {
      this.log(`\nShutdown timed out after ${this.options.timeout}ms`);
      this.log(`Completed ${this.state.handlersCompleted}/${this.state.totalHandlers} handlers`);

      if (this.options.forceOnTimeout && this.options.exitProcess) {
        this.log('Forcing exit due to timeout...');
        process.exit(1);
      }
    } else {
      this.log(`\n${'='.repeat(50)}`);
      this.log(`Shutdown complete in ${elapsed}ms`);

      if (this.state.errors.length > 0) {
        this.log(`Errors: ${this.state.errors.length}`);
        this.state.errors.forEach((err, i) => {
          this.log(`  ${i + 1}. ${err.message}`);
        });
      }

      this.log(`${'='.repeat(50)}\n`);
    }

    if (this.options.exitProcess) {
      process.exit(this.state.errors.length > 0 ? 1 : 0);
    }
  }

  private async executeHandlers(): Promise<void> {
    for (const registeredHandler of this.handlers) {
      try {
        this.log(`\n[${this.state.handlersCompleted + 1}/${this.state.totalHandlers}] Executing: ${registeredHandler.name}`);

        const handlerStartTime = Date.now();

        // Create handler timeout if specified
        if (registeredHandler.timeout) {
          await Promise.race([
            this.executeHandler(registeredHandler),
            new Promise<void>((_, reject) => {
              setTimeout(
                () => reject(new Error(`Handler timeout: ${registeredHandler.name}`)),
                registeredHandler.timeout
              );
            }),
          ]);
        } else {
          await this.executeHandler(registeredHandler);
        }

        const handlerElapsed = Date.now() - handlerStartTime;
        this.log(`  Completed in ${handlerElapsed}ms`);
        this.state.handlersCompleted++;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        this.state.errors.push(err);
        this.log(`  ERROR: ${err.message}`);
        this.state.handlersCompleted++;
      }
    }
  }

  private async executeHandler(registeredHandler: RegisteredHandler): Promise<void> {
    const result = registeredHandler.handler();
    if (result instanceof Promise) {
      await result;
    }
  }

  private registerSignalHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGHUP'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        this.shutdown(signal);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.log(`Uncaught exception: ${error.message}`);
      console.error(error);
      this.shutdown('uncaughtException');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason) => {
      this.log(`Unhandled rejection: ${reason}`);
      console.error(reason);
      this.shutdown('unhandledRejection');
    });
  }

  private log(message: string): void {
    if (this.options.logger) {
      this.options.logger(`[shutdown] ${message}`);
    }
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let shutdownManager: ShutdownManager | null = null;

/**
 * Get or create the shutdown manager singleton
 */
export function getShutdownManager(options?: ShutdownOptions): ShutdownManager {
  if (!shutdownManager) {
    shutdownManager = new ShutdownManager(options);
  }
  return shutdownManager;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Register a shutdown handler
 */
export function onShutdown(
  name: string,
  handler: ShutdownHandler,
  options?: { priority?: number; timeout?: number }
): () => void {
  return getShutdownManager().register(name, handler, options);
}

/**
 * Check if shutdown is in progress
 */
export function isShuttingDown(): boolean {
  return shutdownManager?.isShuttingDown ?? false;
}

/**
 * Trigger graceful shutdown
 */
export async function shutdown(signal?: string): Promise<void> {
  return getShutdownManager().shutdown(signal);
}

// ================================================================
// COMMON SHUTDOWN HANDLERS
// ================================================================

/**
 * Create a database connection shutdown handler
 */
export function createDatabaseShutdownHandler(
  closeConnection: () => Promise<void>,
  name: string = 'database'
): ShutdownHandler {
  return async () => {
    await closeConnection();
  };
}

/**
 * Create a Redis connection shutdown handler
 */
export function createRedisShutdownHandler(
  quit: () => Promise<void>,
  name: string = 'redis'
): ShutdownHandler {
  return async () => {
    await quit();
  };
}

/**
 * Create a HTTP server shutdown handler
 */
export function createServerShutdownHandler(
  close: () => Promise<void>,
  name: string = 'http-server'
): ShutdownHandler {
  return async () => {
    await close();
  };
}

/**
 * Create a queue processor shutdown handler
 */
export function createQueueShutdownHandler(
  drain: () => Promise<void>,
  name: string = 'queue'
): ShutdownHandler {
  return async () => {
    await drain();
  };
}

// ================================================================
// HEALTH CHECK INTEGRATION
// ================================================================

/**
 * Middleware to reject requests during shutdown
 */
export function rejectDuringShutdown(): (
  handler: () => Promise<Response>
) => Promise<Response> {
  return async (handler: () => Promise<Response>): Promise<Response> => {
    if (isShuttingDown()) {
      return new Response(
        JSON.stringify({
          error: 'Service is shutting down',
          code: 'SERVICE_UNAVAILABLE',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            Connection: 'close',
          },
        }
      );
    }

    return handler();
  };
}

// ================================================================
// EXPORTS
// ================================================================

export { ShutdownManager };

// Example usage:
//
// // Register handlers
// onShutdown('database', async () => {
//   await db.close();
// }, { priority: 1 });
//
// onShutdown('redis', async () => {
//   await redis.quit();
// }, { priority: 2 });
//
// onShutdown('background-jobs', async () => {
//   await jobQueue.drain();
// }, { priority: 3, timeout: 10000 });
//
// // In API route
// export async function GET(request: Request) {
//   return rejectDuringShutdown()(async () => {
//     // Normal handler
//     return new Response('OK');
//   });
// }
