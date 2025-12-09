/**
 * Health Check
 *
 * Health check management for readiness and liveness probes
 *
 * Phase 3, Week 10
 */

import type {
  HealthStatus,
  HealthCheck,
  HealthResult,
} from './types';

// ================================================================
// HEALTH CHECK MANAGER
// ================================================================

/**
 * Health Check Manager
 *
 * @example
 * ```typescript
 * const health = new HealthCheckManager();
 *
 * health.register({
 *   name: 'database',
 *   check: async () => {
 *     await db.ping();
 *     return true;
 *   },
 *   critical: true,
 * });
 *
 * health.register({
 *   name: 'redis',
 *   check: async () => {
 *     await redis.ping();
 *     return true;
 *   },
 * });
 *
 * // Get health status
 * const result = await health.check();
 * console.log(result.status); // 'healthy' | 'unhealthy' | 'degraded'
 * ```
 */
export class HealthCheckManager {
  private readonly checks: Map<string, HealthCheck> = new Map();
  private status: HealthStatus = 'healthy';
  private isShuttingDown = false;
  private lastCheck: HealthResult | null = null;

  /**
   * Register a health check
   */
  register(check: HealthCheck): this {
    this.checks.set(check.name, {
      ...check,
      timeout: check.timeout ?? 5000,
      critical: check.critical ?? false,
    });
    return this;
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): boolean {
    return this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async check(): Promise<HealthResult> {
    if (this.isShuttingDown) {
      return {
        status: 'shutting_down',
        checks: [],
        ready: false,
        live: true,
        timestamp: new Date(),
      };
    }

    const results: HealthResult['checks'] = [];
    let hasUnhealthy = false;
    let hasCriticalUnhealthy = false;

    for (const [name, check] of this.checks) {
      const startTime = Date.now();
      let healthy = false;
      let error: string | undefined;

      try {
        // Run check with timeout
        const result = await this.runWithTimeout(
          () => check.check(),
          check.timeout!
        );
        healthy = result;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        healthy = false;
      }

      results.push({
        name,
        healthy,
        duration: Date.now() - startTime,
        error,
      });

      if (!healthy) {
        hasUnhealthy = true;
        if (check.critical) {
          hasCriticalUnhealthy = true;
        }
      }
    }

    // Determine overall status
    let status: HealthStatus;
    if (hasCriticalUnhealthy) {
      status = 'unhealthy';
    } else if (hasUnhealthy) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    this.status = status;

    this.lastCheck = {
      status,
      checks: results,
      ready: status !== 'unhealthy',
      live: true,
      timestamp: new Date(),
    };

    return this.lastCheck;
  }

  /**
   * Run a function with timeout
   */
  private async runWithTimeout<T>(
    fn: () => Promise<T> | T,
    timeout: number
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Health check timeout')), timeout);
      }),
    ]);
  }

  /**
   * Get readiness status (can receive traffic)
   */
  async isReady(): Promise<boolean> {
    if (this.isShuttingDown) return false;

    const result = await this.check();
    return result.ready;
  }

  /**
   * Get liveness status (process is alive)
   */
  isLive(): boolean {
    return !this.isShuttingDown;
  }

  /**
   * Mark as shutting down
   */
  setShuttingDown(): void {
    this.isShuttingDown = true;
    this.status = 'shutting_down';
  }

  /**
   * Get current status without running checks
   */
  getStatus(): HealthStatus {
    return this.status;
  }

  /**
   * Get last check result
   */
  getLastCheck(): HealthResult | null {
    return this.lastCheck;
  }

  /**
   * Get registered check names
   */
  getCheckNames(): string[] {
    return [...this.checks.keys()];
  }
}

// ================================================================
// EXPRESS MIDDLEWARE
// ================================================================

/**
 * Create Express health check endpoints
 *
 * @example
 * ```typescript
 * const { healthEndpoint, readinessEndpoint, livenessEndpoint } = createHealthEndpoints(healthManager);
 *
 * app.get('/health', healthEndpoint);
 * app.get('/ready', readinessEndpoint);
 * app.get('/live', livenessEndpoint);
 * ```
 */
export function createHealthEndpoints(manager: HealthCheckManager): {
  healthEndpoint: (req: unknown, res: { status: (code: number) => { json: (data: unknown) => void } }) => Promise<void>;
  readinessEndpoint: (req: unknown, res: { status: (code: number) => { send: (text: string) => void } }) => Promise<void>;
  livenessEndpoint: (req: unknown, res: { status: (code: number) => { send: (text: string) => void } }) => void;
} {
  return {
    async healthEndpoint(req, res) {
      const result = await manager.check();
      const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 200 : 503;
      res.status(statusCode).json(result);
    },

    async readinessEndpoint(req, res) {
      const ready = await manager.isReady();
      res.status(ready ? 200 : 503).send(ready ? 'OK' : 'Not Ready');
    },

    livenessEndpoint(req, res) {
      const live = manager.isLive();
      res.status(live ? 200 : 503).send(live ? 'OK' : 'Not Live');
    },
  };
}

// ================================================================
// COMMON HEALTH CHECKS
// ================================================================

/**
 * Create a database health check
 */
export function createDatabaseCheck(
  name: string,
  pingFn: () => Promise<void>
): HealthCheck {
  return {
    name,
    check: async () => {
      await pingFn();
      return true;
    },
    critical: true,
    timeout: 5000,
  };
}

/**
 * Create a Redis health check
 */
export function createRedisCheck(
  name: string,
  pingFn: () => Promise<string>
): HealthCheck {
  return {
    name,
    check: async () => {
      const result = await pingFn();
      return result === 'PONG';
    },
    critical: false,
    timeout: 3000,
  };
}

/**
 * Create a memory usage check
 */
export function createMemoryCheck(
  maxUsageMB: number = 1024
): HealthCheck {
  return {
    name: 'memory',
    check: () => {
      const used = process.memoryUsage().heapUsed / 1024 / 1024;
      return used < maxUsageMB;
    },
    critical: false,
    timeout: 1000,
  };
}

/**
 * Create an event loop lag check
 */
export function createEventLoopCheck(
  maxLagMs: number = 100
): HealthCheck {
  return {
    name: 'event-loop',
    check: async () => {
      const start = Date.now();
      await new Promise((resolve) => setImmediate(resolve));
      const lag = Date.now() - start;
      return lag < maxLagMs;
    },
    critical: false,
    timeout: 1000,
  };
}

/**
 * Create a disk space check
 *
 * Uses Node.js fs.statfs to check actual disk space on the filesystem.
 * Works in Vercel/serverless environments where the temp filesystem
 * is the relevant storage to monitor.
 */
export function createDiskCheck(
  minFreePercent: number = 10
): HealthCheck {
  return {
    name: 'disk',
    check: async () => {
      try {
        // Dynamic import for fs/promises to avoid issues in edge runtime
        const fs = await import('fs/promises');

        // Check the tmp directory (most relevant for serverless)
        const path = process.platform === 'win32' ? 'C:\\' : '/tmp';

        // Node.js 18.15+ has fs.statfs
        if (typeof fs.statfs === 'function') {
          const stats = await fs.statfs(path);
          const totalBytes = stats.blocks * stats.bsize;
          const freeBytes = stats.bfree * stats.bsize;
          const freePercent = (freeBytes / totalBytes) * 100;

          return freePercent >= minFreePercent;
        }

        // Fallback: Check if we can write to tmp (basic health check)
        const testFile = `${path}/.health-check-${Date.now()}`;
        await fs.writeFile(testFile, 'health-check');
        await fs.unlink(testFile);

        return true;
      } catch (error) {
        // Log but don't fail hard - disk checks may not work in all environments
        console.warn('[Health Check] Disk check failed:', error);
        // Return true to avoid false negatives in environments without disk access
        return true;
      }
    },
    critical: false,
    timeout: 5000,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  HealthCheckManager,
  createHealthEndpoints,
  createDatabaseCheck,
  createRedisCheck,
  createMemoryCheck,
  createEventLoopCheck,
  createDiskCheck,
};
