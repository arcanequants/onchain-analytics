/**
 * Database Connection Pool Manager
 *
 * RED TEAM AUDIT FIX: CRITICAL-004
 * Implements connection pooling to prevent connection exhaustion
 *
 * Features:
 * - Connection pooling via Supabase pooler
 * - Connection health monitoring
 * - Automatic reconnection
 * - Pool size management
 * - Connection timeout handling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// TYPES
// ============================================================================

export interface PoolConfig {
  maxConnections?: number;
  minConnections?: number;
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
  healthCheckIntervalMs?: number;
  usePooler?: boolean;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  connectionErrors: number;
  averageAcquireTime: number;
}

export interface PooledConnection {
  client: SupabaseClient;
  createdAt: number;
  lastUsedAt: number;
  isHealthy: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<PoolConfig> = {
  maxConnections: 20,
  minConnections: 5,
  connectionTimeoutMs: 30000, // 30 seconds
  idleTimeoutMs: 300000, // 5 minutes
  healthCheckIntervalMs: 60000, // 1 minute
  usePooler: true, // Use Supabase connection pooler
};

// ============================================================================
// SINGLETON POOL MANAGER
// ============================================================================

class ConnectionPoolManager {
  private static instance: ConnectionPoolManager;
  private config: Required<PoolConfig>;
  private connections: Map<string, PooledConnection> = new Map();
  private waitQueue: Array<{
    resolve: (client: SupabaseClient) => void;
    reject: (error: Error) => void;
    timestamp: number;
  }> = [];
  private stats = {
    connectionErrors: 0,
    acquireTimes: [] as number[],
  };
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  private constructor(config: PoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startHealthCheck();
  }

  static getInstance(config?: PoolConfig): ConnectionPoolManager {
    if (!ConnectionPoolManager.instance) {
      ConnectionPoolManager.instance = new ConnectionPoolManager(config);
    }
    return ConnectionPoolManager.instance;
  }

  // ==========================================================================
  // CLIENT CREATION
  // ==========================================================================

  private createClient(): SupabaseClient {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }

    // Use pooler URL if configured
    let connectionUrl = url;
    if (this.config.usePooler && process.env.SUPABASE_POOLER_URL) {
      connectionUrl = process.env.SUPABASE_POOLER_URL;
    }

    return createClient(connectionUrl, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-connection-pool': 'true',
          'x-pool-size': String(this.config.maxConnections),
        },
      },
    });
  }

  // ==========================================================================
  // CONNECTION MANAGEMENT
  // ==========================================================================

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  private async createPooledConnection(): Promise<PooledConnection> {
    const client = this.createClient();
    const now = Date.now();

    const connection: PooledConnection = {
      client,
      createdAt: now,
      lastUsedAt: now,
      isHealthy: true,
    };

    // Test connection health
    try {
      await this.testConnection(client);
    } catch (error) {
      this.stats.connectionErrors++;
      throw new Error(`Failed to create healthy connection: ${error}`);
    }

    return connection;
  }

  private async testConnection(client: SupabaseClient): Promise<boolean> {
    try {
      // Simple query to test connection
      const { error } = await client.from('_health_check').select('1').limit(1);
      // If table doesn't exist, try a simple RPC
      if (error && error.code === 'PGRST116') {
        // Table not found is ok, connection works
        return true;
      }
      return !error;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // ACQUIRE / RELEASE
  // ==========================================================================

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<SupabaseClient> {
    if (this.isShuttingDown) {
      throw new Error('Pool is shutting down');
    }

    const startTime = Date.now();

    // Try to find an available healthy connection
    for (const [id, conn] of this.connections) {
      if (conn.isHealthy) {
        conn.lastUsedAt = Date.now();
        this.recordAcquireTime(Date.now() - startTime);
        return conn.client;
      }
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      try {
        const connection = await this.createPooledConnection();
        const id = this.generateConnectionId();
        this.connections.set(id, connection);
        this.recordAcquireTime(Date.now() - startTime);
        return connection.client;
      } catch (error) {
        this.stats.connectionErrors++;
        throw error;
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex(
          (w) => w.resolve === resolve
        );
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.config.connectionTimeoutMs);

      this.waitQueue.push({
        resolve: (client) => {
          clearTimeout(timeout);
          this.recordAcquireTime(Date.now() - startTime);
          resolve(client);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(client: SupabaseClient): void {
    // Find the connection in the pool
    for (const [id, conn] of this.connections) {
      if (conn.client === client) {
        conn.lastUsedAt = Date.now();

        // If there are waiting requests, serve them
        if (this.waitQueue.length > 0) {
          const waiter = this.waitQueue.shift();
          if (waiter) {
            waiter.resolve(client);
            return;
          }
        }
        return;
      }
    }
  }

  // ==========================================================================
  // HEALTH MONITORING
  // ==========================================================================

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckIntervalMs);
  }

  private async performHealthCheck(): Promise<void> {
    const unhealthyConnections: string[] = [];

    for (const [id, conn] of this.connections) {
      // Check for idle timeout
      if (Date.now() - conn.lastUsedAt > this.config.idleTimeoutMs) {
        if (this.connections.size > this.config.minConnections) {
          unhealthyConnections.push(id);
          continue;
        }
      }

      // Test connection health
      try {
        const isHealthy = await this.testConnection(conn.client);
        conn.isHealthy = isHealthy;
        if (!isHealthy) {
          unhealthyConnections.push(id);
        }
      } catch {
        conn.isHealthy = false;
        unhealthyConnections.push(id);
      }
    }

    // Remove unhealthy connections
    for (const id of unhealthyConnections) {
      this.connections.delete(id);
    }

    // Ensure minimum connections
    while (this.connections.size < this.config.minConnections) {
      try {
        const connection = await this.createPooledConnection();
        this.connections.set(this.generateConnectionId(), connection);
      } catch {
        break; // Stop if we can't create connections
      }
    }
  }

  private recordAcquireTime(ms: number): void {
    this.stats.acquireTimes.push(ms);
    // Keep only last 100 measurements
    if (this.stats.acquireTimes.length > 100) {
      this.stats.acquireTimes.shift();
    }
  }

  // ==========================================================================
  // STATISTICS
  // ==========================================================================

  getStats(): PoolStats {
    const acquireTimes = this.stats.acquireTimes;
    const avgAcquireTime =
      acquireTimes.length > 0
        ? acquireTimes.reduce((a, b) => a + b, 0) / acquireTimes.length
        : 0;

    let activeCount = 0;
    let idleCount = 0;
    const now = Date.now();

    for (const conn of this.connections.values()) {
      if (now - conn.lastUsedAt < 5000) {
        activeCount++;
      } else {
        idleCount++;
      }
    }

    return {
      totalConnections: this.connections.size,
      activeConnections: activeCount,
      idleConnections: idleCount,
      waitingRequests: this.waitQueue.length,
      connectionErrors: this.stats.connectionErrors,
      averageAcquireTime: avgAcquireTime,
    };
  }

  // ==========================================================================
  // SHUTDOWN
  // ==========================================================================

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      waiter.reject(new Error('Pool is shutting down'));
    }
    this.waitQueue = [];

    // Clear all connections
    this.connections.clear();
  }
}

// ============================================================================
// EXPORTED FUNCTIONS
// ============================================================================

let poolManager: ConnectionPoolManager | null = null;

/**
 * Initialize the connection pool
 */
export function initializePool(config?: PoolConfig): ConnectionPoolManager {
  poolManager = ConnectionPoolManager.getInstance(config);
  return poolManager;
}

/**
 * Get a pooled Supabase client
 */
export async function getPooledClient(): Promise<SupabaseClient> {
  if (!poolManager) {
    poolManager = initializePool();
  }
  return poolManager.acquire();
}

/**
 * Release a client back to the pool
 */
export function releaseClient(client: SupabaseClient): void {
  if (poolManager) {
    poolManager.release(client);
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats(): PoolStats {
  if (!poolManager) {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      connectionErrors: 0,
      averageAcquireTime: 0,
    };
  }
  return poolManager.getStats();
}

/**
 * Shutdown the connection pool
 */
export async function shutdownPool(): Promise<void> {
  if (poolManager) {
    await poolManager.shutdown();
    poolManager = null;
  }
}

/**
 * Execute a function with a pooled connection
 * Automatically acquires and releases the connection
 */
export async function withPooledConnection<T>(
  fn: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await getPooledClient();
  try {
    return await fn(client);
  } finally {
    releaseClient(client);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ConnectionPoolManager };

export default {
  initializePool,
  getPooledClient,
  releaseClient,
  getPoolStats,
  shutdownPool,
  withPooledConnection,
};
