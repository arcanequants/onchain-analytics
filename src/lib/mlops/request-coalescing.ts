/**
 * Model Serving with Request Coalescing
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Request coalescing (batch similar requests)
 * - Request deduplication
 * - Load balancing across model replicas
 * - Circuit breaker pattern
 * - Retry with exponential backoff
 * - Request prioritization
 */

// ============================================================================
// TYPES
// ============================================================================

export type Priority = 'critical' | 'high' | 'normal' | 'low' | 'background';
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface ModelEndpoint {
  id: string;
  url: string;
  model: string;
  weight: number;  // For weighted load balancing
  maxConcurrent: number;
  currentLoad: number;
  healthy: boolean;
  lastHealthCheck: Date;
  errorCount: number;
  successCount: number;
}

export interface Request<TInput = unknown> {
  id: string;
  input: TInput;
  priority: Priority;
  createdAt: Date;
  timeoutMs: number;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, unknown>;
}

export interface Response<TOutput = unknown> {
  requestId: string;
  output: TOutput;
  endpointId: string;
  latencyMs: number;
  cached: boolean;
  coalescedWith?: string[];
}

export interface CoalescingConfig {
  maxBatchSize: number;
  maxWaitMs: number;
  coalescingKey?: (input: unknown) => string;
  inputMerger?: (inputs: unknown[]) => unknown;
  outputSplitter?: (output: unknown, count: number) => unknown[];
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeoutMs: number;
  halfOpenMaxRequests: number;
}

export interface ServingConfig {
  endpoints: Omit<ModelEndpoint, 'currentLoad' | 'healthy' | 'lastHealthCheck' | 'errorCount' | 'successCount'>[];
  coalescing: CoalescingConfig;
  circuitBreaker: CircuitBreakerConfig;
  retryConfig: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    jitterFactor: number;
  };
  healthCheck: {
    intervalMs: number;
    timeoutMs: number;
  };
}

// ============================================================================
// REQUEST QUEUE
// ============================================================================

class PriorityQueue<T extends { priority: Priority; createdAt: Date }> {
  private items: T[] = [];

  private getPriorityValue(priority: Priority): number {
    const values: Record<Priority, number> = {
      critical: 5,
      high: 4,
      normal: 3,
      low: 2,
      background: 1,
    };
    return values[priority];
  }

  enqueue(item: T): void {
    this.items.push(item);
    this.items.sort((a, b) => {
      const priorityDiff = this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime(); // FIFO within priority
    });
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    return this.items[0];
  }

  dequeueMany(count: number): T[] {
    return this.items.splice(0, Math.min(count, this.items.length));
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  getAll(): T[] {
    return [...this.items];
  }
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: Date | null = null;
  private halfOpenRequests = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      throw new Error('Circuit breaker is open');
    }

    if (this.state === 'half-open') {
      this.halfOpenRequests++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true;

      case 'open':
        if (this.lastFailureTime &&
            Date.now() - this.lastFailureTime.getTime() > this.config.timeoutMs) {
          this.state = 'half-open';
          this.halfOpenRequests = 0;
          return true;
        }
        return false;

      case 'half-open':
        return this.halfOpenRequests < this.config.halfOpenMaxRequests;
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'half-open' || this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
      this.successCount = 0;
    }
  }

  getState(): CircuitState {
    // Check if should transition from open to half-open
    if (this.state === 'open' &&
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime.getTime() > this.config.timeoutMs) {
      return 'half-open';
    }
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenRequests = 0;
  }
}

// ============================================================================
// REQUEST COALESCER
// ============================================================================

interface PendingRequest<TInput, TOutput> {
  request: Request<TInput>;
  resolve: (value: Response<TOutput>) => void;
  reject: (error: Error) => void;
}

class RequestCoalescer<TInput = unknown, TOutput = unknown> {
  private pending: Map<string, PendingRequest<TInput, TOutput>[]> = new Map();
  private processing = false;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private config: CoalescingConfig,
    private executor: (inputs: TInput[]) => Promise<TOutput[]>
  ) {}

  async submit(request: Request<TInput>): Promise<Response<TOutput>> {
    return new Promise((resolve, reject) => {
      const key = this.config.coalescingKey
        ? this.config.coalescingKey(request.input)
        : 'default';

      if (!this.pending.has(key)) {
        this.pending.set(key, []);
      }

      this.pending.get(key)!.push({ request, resolve, reject });

      // Check if we should flush immediately
      if (this.pending.get(key)!.length >= this.config.maxBatchSize) {
        this.flush(key);
      } else if (!this.flushTimer) {
        // Set timer for delayed flush
        this.flushTimer = setTimeout(() => {
          this.flushAll();
        }, this.config.maxWaitMs);
      }
    });
  }

  private async flush(key: string): Promise<void> {
    const pendingRequests = this.pending.get(key);
    if (!pendingRequests || pendingRequests.length === 0) return;

    this.pending.delete(key);
    const batch = pendingRequests.splice(0, this.config.maxBatchSize);

    const startTime = Date.now();

    try {
      // Merge inputs if merger provided
      const inputs = batch.map(p => p.request.input);
      const mergedInput = this.config.inputMerger
        ? [this.config.inputMerger(inputs) as TInput]
        : inputs;

      // Execute batch
      const outputs = await this.executor(mergedInput);

      // Split outputs if splitter provided
      const splitOutputs = this.config.outputSplitter && this.config.inputMerger
        ? this.config.outputSplitter(outputs[0], batch.length) as TOutput[]
        : outputs;

      // Resolve all promises
      const latencyMs = Date.now() - startTime;
      const coalescedIds = batch.length > 1
        ? batch.map(p => p.request.id)
        : undefined;

      batch.forEach((pending, index) => {
        pending.resolve({
          requestId: pending.request.id,
          output: splitOutputs[index],
          endpointId: 'coalesced',
          latencyMs,
          cached: false,
          coalescedWith: coalescedIds?.filter(id => id !== pending.request.id),
        });
      });
    } catch (error) {
      // Reject all promises
      batch.forEach(pending => {
        pending.reject(error instanceof Error ? error : new Error(String(error)));
      });
    }
  }

  private flushAll(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    for (const key of this.pending.keys()) {
      this.flush(key);
    }
  }

  getPendingCount(): number {
    let count = 0;
    for (const pending of this.pending.values()) {
      count += pending.length;
    }
    return count;
  }

  clear(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    for (const pending of this.pending.values()) {
      for (const p of pending) {
        p.reject(new Error('Coalescer cleared'));
      }
    }

    this.pending.clear();
  }
}

// ============================================================================
// LOAD BALANCER
// ============================================================================

type LoadBalancingStrategy = 'round-robin' | 'least-connections' | 'weighted' | 'random';

class LoadBalancer {
  private endpoints: ModelEndpoint[] = [];
  private currentIndex = 0;

  constructor(
    endpoints: Omit<ModelEndpoint, 'currentLoad' | 'healthy' | 'lastHealthCheck' | 'errorCount' | 'successCount'>[]
  ) {
    this.endpoints = endpoints.map(e => ({
      ...e,
      currentLoad: 0,
      healthy: true,
      lastHealthCheck: new Date(),
      errorCount: 0,
      successCount: 0,
    }));
  }

  selectEndpoint(strategy: LoadBalancingStrategy = 'least-connections'): ModelEndpoint | null {
    const healthyEndpoints = this.endpoints.filter(e => e.healthy);
    if (healthyEndpoints.length === 0) return null;

    switch (strategy) {
      case 'round-robin':
        return this.roundRobin(healthyEndpoints);

      case 'least-connections':
        return this.leastConnections(healthyEndpoints);

      case 'weighted':
        return this.weighted(healthyEndpoints);

      case 'random':
        return this.random(healthyEndpoints);

      default:
        return healthyEndpoints[0];
    }
  }

  private roundRobin(endpoints: ModelEndpoint[]): ModelEndpoint {
    const endpoint = endpoints[this.currentIndex % endpoints.length];
    this.currentIndex++;
    return endpoint;
  }

  private leastConnections(endpoints: ModelEndpoint[]): ModelEndpoint {
    return endpoints.reduce((min, e) =>
      e.currentLoad / e.maxConcurrent < min.currentLoad / min.maxConcurrent ? e : min
    );
  }

  private weighted(endpoints: ModelEndpoint[]): ModelEndpoint {
    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) return endpoint;
    }

    return endpoints[endpoints.length - 1];
  }

  private random(endpoints: ModelEndpoint[]): ModelEndpoint {
    return endpoints[Math.floor(Math.random() * endpoints.length)];
  }

  incrementLoad(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint) endpoint.currentLoad++;
  }

  decrementLoad(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint && endpoint.currentLoad > 0) endpoint.currentLoad--;
  }

  recordSuccess(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.successCount++;
      endpoint.errorCount = 0;
    }
  }

  recordError(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.errorCount++;
      if (endpoint.errorCount >= 3) {
        endpoint.healthy = false;
      }
    }
  }

  markHealthy(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.healthy = true;
      endpoint.errorCount = 0;
      endpoint.lastHealthCheck = new Date();
    }
  }

  markUnhealthy(endpointId: string): void {
    const endpoint = this.endpoints.find(e => e.id === endpointId);
    if (endpoint) {
      endpoint.healthy = false;
      endpoint.lastHealthCheck = new Date();
    }
  }

  getEndpoints(): ModelEndpoint[] {
    return [...this.endpoints];
  }

  getStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    totalLoad: number;
    totalCapacity: number;
  } {
    const healthy = this.endpoints.filter(e => e.healthy);
    return {
      total: this.endpoints.length,
      healthy: healthy.length,
      unhealthy: this.endpoints.length - healthy.length,
      totalLoad: this.endpoints.reduce((sum, e) => sum + e.currentLoad, 0),
      totalCapacity: this.endpoints.reduce((sum, e) => sum + e.maxConcurrent, 0),
    };
  }
}

// ============================================================================
// MODEL SERVER
// ============================================================================

export interface ModelServerStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  coalescedRequests: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  endpointStats: ReturnType<LoadBalancer['getStats']>;
  queueDepth: number;
  circuitState: CircuitState;
}

export class ModelServer<TInput = unknown, TOutput = unknown> {
  private queue: PriorityQueue<Request<TInput>>;
  private loadBalancer: LoadBalancer;
  private circuitBreaker: CircuitBreaker;
  private coalescer: RequestCoalescer<TInput, TOutput>;
  private dedupMap: Map<string, Promise<Response<TOutput>>> = new Map();
  private latencies: number[] = [];
  private stats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    coalescedRequests: 0,
  };

  constructor(
    private config: ServingConfig,
    private requestHandler: (endpoint: ModelEndpoint, input: TInput) => Promise<TOutput>
  ) {
    this.queue = new PriorityQueue();
    this.loadBalancer = new LoadBalancer(config.endpoints);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);

    this.coalescer = new RequestCoalescer(
      config.coalescing,
      async (inputs: TInput[]) => {
        const endpoint = this.loadBalancer.selectEndpoint();
        if (!endpoint) throw new Error('No healthy endpoints');

        const results: TOutput[] = [];
        for (const input of inputs) {
          const result = await this.requestHandler(endpoint, input);
          results.push(result);
        }
        return results;
      }
    );

    // Start health check loop
    this.startHealthChecks();
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Generate dedup key
   */
  private generateDedupKey(input: TInput): string {
    return JSON.stringify(input);
  }

  /**
   * Submit request for processing
   */
  async submit(
    input: TInput,
    options?: {
      priority?: Priority;
      timeoutMs?: number;
      maxRetries?: number;
      deduplicate?: boolean;
      metadata?: Record<string, unknown>;
    }
  ): Promise<Response<TOutput>> {
    this.stats.totalRequests++;

    const request: Request<TInput> = {
      id: this.generateRequestId(),
      input,
      priority: options?.priority ?? 'normal',
      createdAt: new Date(),
      timeoutMs: options?.timeoutMs ?? 30000,
      retryCount: 0,
      maxRetries: options?.maxRetries ?? this.config.retryConfig.maxRetries,
      metadata: options?.metadata,
    };

    // Check for deduplication
    if (options?.deduplicate !== false) {
      const dedupKey = this.generateDedupKey(input);
      const existing = this.dedupMap.get(dedupKey);
      if (existing) {
        this.stats.coalescedRequests++;
        return existing;
      }

      const promise = this.processRequest(request);
      this.dedupMap.set(dedupKey, promise);

      try {
        const result = await promise;
        return result;
      } finally {
        this.dedupMap.delete(dedupKey);
      }
    }

    return this.processRequest(request);
  }

  /**
   * Process a single request
   */
  private async processRequest(request: Request<TInput>): Promise<Response<TOutput>> {
    const startTime = Date.now();

    try {
      const response = await this.circuitBreaker.execute(async () => {
        return this.executeWithRetry(request);
      });

      const latencyMs = Date.now() - startTime;
      this.recordLatency(latencyMs);
      this.stats.successfulRequests++;

      return response;
    } catch (error) {
      this.stats.failedRequests++;
      throw error;
    }
  }

  /**
   * Execute request with retry logic
   */
  private async executeWithRetry(request: Request<TInput>): Promise<Response<TOutput>> {
    const startTime = Date.now();

    while (request.retryCount <= request.maxRetries) {
      const endpoint = this.loadBalancer.selectEndpoint();

      if (!endpoint) {
        throw new Error('No healthy endpoints available');
      }

      this.loadBalancer.incrementLoad(endpoint.id);

      try {
        const output = await Promise.race([
          this.requestHandler(endpoint, request.input),
          this.timeout(request.timeoutMs),
        ]);

        this.loadBalancer.decrementLoad(endpoint.id);
        this.loadBalancer.recordSuccess(endpoint.id);

        return {
          requestId: request.id,
          output: output as TOutput,
          endpointId: endpoint.id,
          latencyMs: Date.now() - startTime,
          cached: false,
        };
      } catch (error) {
        this.loadBalancer.decrementLoad(endpoint.id);
        this.loadBalancer.recordError(endpoint.id);

        request.retryCount++;

        if (request.retryCount > request.maxRetries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = this.calculateBackoff(request.retryCount);
        await this.sleep(delay);
      }
    }

    throw new Error('Max retries exceeded');
  }

  /**
   * Calculate backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const { baseDelayMs, maxDelayMs, jitterFactor } = this.config.retryConfig;
    const exponentialDelay = baseDelayMs * Math.pow(2, retryCount - 1);
    const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
    const jitter = cappedDelay * jitterFactor * (Math.random() * 2 - 1);
    return Math.max(0, cappedDelay + jitter);
  }

  /**
   * Timeout promise
   */
  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), ms);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Record latency for percentile calculations
   */
  private recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    // Keep last 1000 latencies
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
  }

  /**
   * Calculate latency percentile
   */
  private getPercentile(p: number): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Start health check loop
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      for (const endpoint of this.loadBalancer.getEndpoints()) {
        try {
          // In production, would make actual health check request
          this.loadBalancer.markHealthy(endpoint.id);
        } catch {
          this.loadBalancer.markUnhealthy(endpoint.id);
        }
      }
    }, this.config.healthCheck.intervalMs);
  }

  /**
   * Get server statistics
   */
  getStats(): ModelServerStats {
    const avgLatency = this.latencies.length > 0
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length
      : 0;

    return {
      totalRequests: this.stats.totalRequests,
      successfulRequests: this.stats.successfulRequests,
      failedRequests: this.stats.failedRequests,
      coalescedRequests: this.stats.coalescedRequests,
      averageLatencyMs: avgLatency,
      p95LatencyMs: this.getPercentile(95),
      p99LatencyMs: this.getPercentile(99),
      endpointStats: this.loadBalancer.getStats(),
      queueDepth: this.queue.size(),
      circuitState: this.circuitBreaker.getState(),
    };
  }

  /**
   * Shutdown server
   */
  async shutdown(): Promise<void> {
    this.queue.clear();
    this.coalescer.clear();
    this.dedupMap.clear();
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create model server with default configuration
 */
export function createModelServer<TInput, TOutput>(
  endpoints: Array<{
    id: string;
    url: string;
    model: string;
    weight?: number;
    maxConcurrent?: number;
  }>,
  handler: (endpoint: ModelEndpoint, input: TInput) => Promise<TOutput>,
  options?: Partial<ServingConfig>
): ModelServer<TInput, TOutput> {
  const config: ServingConfig = {
    endpoints: endpoints.map(e => ({
      id: e.id,
      url: e.url,
      model: e.model,
      weight: e.weight ?? 1,
      maxConcurrent: e.maxConcurrent ?? 10,
    })),
    coalescing: options?.coalescing ?? {
      maxBatchSize: 8,
      maxWaitMs: 50,
    },
    circuitBreaker: options?.circuitBreaker ?? {
      failureThreshold: 5,
      successThreshold: 3,
      timeoutMs: 30000,
      halfOpenMaxRequests: 3,
    },
    retryConfig: options?.retryConfig ?? {
      maxRetries: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      jitterFactor: 0.1,
    },
    healthCheck: options?.healthCheck ?? {
      intervalMs: 30000,
      timeoutMs: 5000,
    },
  };

  return new ModelServer(config, handler);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  PriorityQueue,
  CircuitBreaker,
  RequestCoalescer,
  LoadBalancer,
};

export default {
  ModelServer,
  createModelServer,
  PriorityQueue,
  CircuitBreaker,
  RequestCoalescer,
  LoadBalancer,
};
