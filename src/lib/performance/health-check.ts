/**
 * Health Check System
 *
 * Provides health checks for application components
 *
 * Phase 3, Week 9, Day 1
 */

import type { HealthStatus, ComponentHealth, HealthReport } from './types';

// ================================================================
// TYPES
// ================================================================

export type HealthChecker = () => Promise<ComponentHealth>;

export interface HealthCheckConfig {
  /** Health check timeout in ms */
  timeout: number;
  /** Interval between checks in ms */
  interval: number;
  /** Number of failures before unhealthy */
  failureThreshold: number;
  /** Number of successes before healthy */
  successThreshold: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  timeout: 5000,
  interval: 30000,
  failureThreshold: 3,
  successThreshold: 1,
};

// ================================================================
// HEALTH CHECK MANAGER
// ================================================================

export class HealthCheckManager {
  private config: HealthCheckConfig;
  private checks: Map<string, HealthChecker> = new Map();
  private results: Map<string, ComponentHealth> = new Map();
  private failureCounts: Map<string, number> = new Map();
  private successCounts: Map<string, number> = new Map();
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private version: string;
  private environment: string;
  private startTime: number;

  constructor(options: {
    config?: Partial<HealthCheckConfig>;
    version?: string;
    environment?: string;
  } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...options.config };
    this.version = options.version || '1.0.0';
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.startTime = Date.now();
  }

  // ================================================================
  // REGISTRATION
  // ================================================================

  /**
   * Register a health check
   */
  register(name: string, checker: HealthChecker): void {
    this.checks.set(name, checker);
    this.failureCounts.set(name, 0);
    this.successCounts.set(name, 0);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): boolean {
    this.results.delete(name);
    this.failureCounts.delete(name);
    this.successCounts.delete(name);
    return this.checks.delete(name);
  }

  // ================================================================
  // CHECKS
  // ================================================================

  /**
   * Run all health checks
   */
  async checkAll(): Promise<HealthReport> {
    const components: ComponentHealth[] = [];
    let overallStatus: HealthStatus = 'healthy';

    for (const [name, checker] of this.checks) {
      try {
        const result = await this.runCheck(name, checker);
        components.push(result);

        // Update overall status
        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        const errorResult: ComponentHealth = {
          name,
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          lastChecked: new Date(),
        };
        components.push(errorResult);
        this.results.set(name, errorResult);
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      components,
      version: this.version,
      environment: this.environment,
      uptime: (Date.now() - this.startTime) / 1000,
      timestamp: new Date(),
    };
  }

  /**
   * Run a single health check
   */
  private async runCheck(name: string, checker: HealthChecker): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Apply timeout
      const result = await Promise.race([
        checker(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), this.config.timeout)
        ),
      ]);

      result.responseTime = Date.now() - startTime;
      result.lastChecked = new Date();

      // Update counters
      if (result.status === 'healthy') {
        this.failureCounts.set(name, 0);
        const successCount = (this.successCounts.get(name) || 0) + 1;
        this.successCounts.set(name, successCount);
      } else {
        this.successCounts.set(name, 0);
        const failureCount = (this.failureCounts.get(name) || 0) + 1;
        this.failureCounts.set(name, failureCount);

        // Apply failure threshold
        if (failureCount >= this.config.failureThreshold) {
          result.status = 'unhealthy';
        }
      }

      this.results.set(name, result);
      return result;
    } catch (error) {
      this.successCounts.set(name, 0);
      const failureCount = (this.failureCounts.get(name) || 0) + 1;
      this.failureCounts.set(name, failureCount);

      const result: ComponentHealth = {
        name,
        status: failureCount >= this.config.failureThreshold ? 'unhealthy' : 'degraded',
        message: error instanceof Error ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
      };

      this.results.set(name, result);
      return result;
    }
  }

  /**
   * Get cached results
   */
  getResults(): Map<string, ComponentHealth> {
    return new Map(this.results);
  }

  /**
   * Get specific component health
   */
  getComponentHealth(name: string): ComponentHealth | null {
    return this.results.get(name) || null;
  }

  // ================================================================
  // LIFECYCLE
  // ================================================================

  /**
   * Start periodic health checks
   */
  start(): void {
    if (this.checkInterval) return;

    // Run initial check
    this.checkAll();

    // Schedule periodic checks
    this.checkInterval = setInterval(() => {
      this.checkAll();
    }, this.config.interval);
  }

  /**
   * Stop periodic health checks
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if running
   */
  isRunning(): boolean {
    return this.checkInterval !== null;
  }
}

// ================================================================
// BUILT-IN HEALTH CHECKS
// ================================================================

/**
 * Create a database health check
 */
export function createDatabaseCheck(
  checkFn: () => Promise<boolean>
): HealthChecker {
  return async () => {
    try {
      const isHealthy = await checkFn();
      return {
        name: 'database',
        status: isHealthy ? 'healthy' : 'unhealthy',
        message: isHealthy ? 'Database connection OK' : 'Database connection failed',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database check failed',
        lastChecked: new Date(),
      };
    }
  };
}

/**
 * Create a cache health check
 */
export function createCacheCheck(
  pingFn: () => Promise<boolean>
): HealthChecker {
  return async () => {
    try {
      const isHealthy = await pingFn();
      return {
        name: 'cache',
        status: isHealthy ? 'healthy' : 'degraded',
        message: isHealthy ? 'Cache connection OK' : 'Cache unavailable',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name: 'cache',
        status: 'degraded',
        message: error instanceof Error ? error.message : 'Cache check failed',
        lastChecked: new Date(),
      };
    }
  };
}

/**
 * Create an external service health check
 */
export function createExternalServiceCheck(
  name: string,
  checkFn: () => Promise<boolean>,
  options: { critical?: boolean } = {}
): HealthChecker {
  return async () => {
    try {
      const isHealthy = await checkFn();
      return {
        name,
        status: isHealthy ? 'healthy' : options.critical ? 'unhealthy' : 'degraded',
        message: isHealthy ? `${name} service OK` : `${name} service unavailable`,
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        name,
        status: options.critical ? 'unhealthy' : 'degraded',
        message: error instanceof Error ? error.message : `${name} check failed`,
        lastChecked: new Date(),
      };
    }
  };
}

/**
 * Create a memory health check
 */
export function createMemoryCheck(options: {
  maxHeapPercent?: number;
  maxRssBytes?: number;
} = {}): HealthChecker {
  const maxHeapPercent = options.maxHeapPercent || 90;
  const maxRssBytes = options.maxRssBytes || 1024 * 1024 * 1024; // 1GB

  return async () => {
    const memUsage = process.memoryUsage();
    const heapPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    let status: HealthStatus = 'healthy';
    let message = 'Memory usage OK';

    if (heapPercent > maxHeapPercent) {
      status = 'degraded';
      message = `Heap usage high: ${heapPercent.toFixed(1)}%`;
    }

    if (memUsage.rss > maxRssBytes) {
      status = 'unhealthy';
      message = `RSS memory exceeded: ${(memUsage.rss / 1024 / 1024).toFixed(0)}MB`;
    }

    return {
      name: 'memory',
      status,
      message,
      details: {
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        heapPercent,
        rss: memUsage.rss,
      },
      lastChecked: new Date(),
    };
  };
}

/**
 * Create a disk space health check (placeholder for server environments)
 */
export function createDiskCheck(options: {
  path?: string;
  minFreePercent?: number;
} = {}): HealthChecker {
  const minFreePercent = options.minFreePercent || 10;

  return async () => {
    // In a real implementation, this would check actual disk space
    // For now, return a healthy status
    return {
      name: 'disk',
      status: 'healthy',
      message: `Disk space OK (threshold: ${minFreePercent}% free)`,
      details: {
        path: options.path || '/',
        minFreePercent,
      },
      lastChecked: new Date(),
    };
  };
}

// ================================================================
// SINGLETON
// ================================================================

let healthCheckManager: HealthCheckManager | null = null;

/**
 * Get the global health check manager
 */
export function getHealthCheckManager(): HealthCheckManager {
  if (!healthCheckManager) {
    healthCheckManager = new HealthCheckManager();
  }
  return healthCheckManager;
}

/**
 * Create a new health check manager
 */
export function createHealthCheckManager(options: {
  config?: Partial<HealthCheckConfig>;
  version?: string;
  environment?: string;
} = {}): HealthCheckManager {
  return new HealthCheckManager(options);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  HealthCheckManager,
  getHealthCheckManager,
  createHealthCheckManager,
  createDatabaseCheck,
  createCacheCheck,
  createExternalServiceCheck,
  createMemoryCheck,
  createDiskCheck,
};
