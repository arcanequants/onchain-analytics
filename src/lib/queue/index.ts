/**
 * Queue and Backpressure Control Module
 *
 * Phase 2, Week 3, Day 5
 * Advanced queue management with backpressure handling
 */

// ================================================================
// TYPES
// ================================================================

export type QueuePriority = 'low' | 'normal' | 'high' | 'critical';
export type QueueState = 'running' | 'paused' | 'draining' | 'stopped';
export type BackpressureLevel = 'normal' | 'elevated' | 'high' | 'critical';

export interface QueueItem<T> {
  id: string;
  data: T;
  priority: QueuePriority;
  createdAt: Date;
  attempts: number;
  maxAttempts: number;
  timeout: number;
  deadline?: Date;
}

export interface QueueConfig {
  name: string;
  concurrency: number;
  maxSize: number;
  defaultTimeout: number;
  defaultMaxAttempts: number;
  retryDelay: number;
  backpressure: BackpressureConfig;
}

export interface BackpressureConfig {
  enabled: boolean;
  highWaterMark: number;
  lowWaterMark: number;
  checkInterval: number;
  pauseOnHigh: boolean;
  rejectOnCritical: boolean;
}

export interface QueueMetrics {
  name: string;
  state: QueueState;
  size: number;
  processing: number;
  completed: number;
  failed: number;
  retried: number;
  rejected: number;
  avgProcessingTime: number;
  backpressureLevel: BackpressureLevel;
  throughput: number; // items per second
}

export interface QueueEvents<T> {
  onEnqueue?: (item: QueueItem<T>) => void;
  onDequeue?: (item: QueueItem<T>) => void;
  onComplete?: (item: QueueItem<T>, result: unknown) => void;
  onError?: (item: QueueItem<T>, error: Error) => void;
  onRetry?: (item: QueueItem<T>, attempt: number) => void;
  onDrop?: (item: QueueItem<T>, reason: string) => void;
  onBackpressure?: (level: BackpressureLevel, metrics: QueueMetrics) => void;
  onStateChange?: (oldState: QueueState, newState: QueueState) => void;
}

// ================================================================
// PRIORITY QUEUE
// ================================================================

const PRIORITY_VALUES: Record<QueuePriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

class PriorityHeap<T> {
  private items: QueueItem<T>[] = [];

  push(item: QueueItem<T>): void {
    this.items.push(item);
    this.bubbleUp(this.items.length - 1);
  }

  pop(): QueueItem<T> | undefined {
    if (this.items.length === 0) return undefined;
    if (this.items.length === 1) return this.items.pop();

    const root = this.items[0];
    this.items[0] = this.items.pop()!;
    this.bubbleDown(0);
    return root;
  }

  peek(): QueueItem<T> | undefined {
    return this.items[0];
  }

  get size(): number {
    return this.items.length;
  }

  clear(): QueueItem<T>[] {
    const cleared = [...this.items];
    this.items = [];
    return cleared;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.compare(this.items[index], this.items[parentIndex]) <= 0) break;
      [this.items[index], this.items[parentIndex]] = [this.items[parentIndex], this.items[index]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let largest = index;

      if (leftChild < this.items.length && this.compare(this.items[leftChild], this.items[largest]) > 0) {
        largest = leftChild;
      }
      if (rightChild < this.items.length && this.compare(this.items[rightChild], this.items[largest]) > 0) {
        largest = rightChild;
      }

      if (largest === index) break;
      [this.items[index], this.items[largest]] = [this.items[largest], this.items[index]];
      index = largest;
    }
  }

  private compare(a: QueueItem<T>, b: QueueItem<T>): number {
    // Higher priority first
    const priorityDiff = PRIORITY_VALUES[a.priority] - PRIORITY_VALUES[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Earlier deadline first (if both have deadlines)
    if (a.deadline && b.deadline) {
      return b.deadline.getTime() - a.deadline.getTime();
    }
    if (a.deadline) return 1;
    if (b.deadline) return -1;

    // FIFO for same priority
    return b.createdAt.getTime() - a.createdAt.getTime();
  }
}

// ================================================================
// BACKPRESSURE CONTROLLER
// ================================================================

export class BackpressureController {
  private config: BackpressureConfig;
  private currentLevel: BackpressureLevel = 'normal';
  private metrics: { size: number; processing: number } = { size: 0, processing: 0 };
  private onLevelChange?: (level: BackpressureLevel) => void;

  constructor(config: BackpressureConfig, onLevelChange?: (level: BackpressureLevel) => void) {
    this.config = config;
    this.onLevelChange = onLevelChange;
  }

  update(size: number, processing: number): BackpressureLevel {
    if (!this.config.enabled) return 'normal';

    this.metrics = { size, processing };
    const totalLoad = size + processing;

    let newLevel: BackpressureLevel;

    if (totalLoad >= this.config.highWaterMark * 1.5) {
      newLevel = 'critical';
    } else if (totalLoad >= this.config.highWaterMark) {
      newLevel = 'high';
    } else if (totalLoad >= this.config.lowWaterMark) {
      newLevel = 'elevated';
    } else {
      newLevel = 'normal';
    }

    if (newLevel !== this.currentLevel) {
      this.currentLevel = newLevel;
      this.onLevelChange?.(newLevel);
    }

    return this.currentLevel;
  }

  get level(): BackpressureLevel {
    return this.currentLevel;
  }

  shouldPause(): boolean {
    return this.config.pauseOnHigh && (this.currentLevel === 'high' || this.currentLevel === 'critical');
  }

  shouldReject(): boolean {
    return this.config.rejectOnCritical && this.currentLevel === 'critical';
  }

  getMetrics(): { level: BackpressureLevel; size: number; processing: number } {
    return { level: this.currentLevel, ...this.metrics };
  }
}

// ================================================================
// MANAGED QUEUE
// ================================================================

export class ManagedQueue<T> {
  private config: QueueConfig;
  private events: QueueEvents<T>;
  private heap: PriorityHeap<T>;
  private backpressure: BackpressureController;
  private state: QueueState = 'paused';
  private processing: Map<string, QueueItem<T>> = new Map();
  private processor?: (data: T) => Promise<unknown>;

  // Metrics
  private completed = 0;
  private failed = 0;
  private retried = 0;
  private rejected = 0;
  private processingTimes: number[] = [];
  private lastThroughputCheck = Date.now();
  private lastThroughputCount = 0;

  constructor(
    config: Partial<QueueConfig> & { name: string },
    events: QueueEvents<T> = {}
  ) {
    this.config = {
      concurrency: config.concurrency ?? 5,
      maxSize: config.maxSize ?? 1000,
      defaultTimeout: config.defaultTimeout ?? 30000,
      defaultMaxAttempts: config.defaultMaxAttempts ?? 3,
      retryDelay: config.retryDelay ?? 1000,
      backpressure: {
        enabled: true,
        highWaterMark: config.maxSize ?? 1000,
        lowWaterMark: Math.floor((config.maxSize ?? 1000) * 0.5),
        checkInterval: 1000,
        pauseOnHigh: true,
        rejectOnCritical: true,
        ...config.backpressure,
      },
      ...config,
    };

    this.events = events;
    this.heap = new PriorityHeap<T>();
    this.backpressure = new BackpressureController(
      this.config.backpressure,
      (level) => this.events.onBackpressure?.(level, this.getMetrics())
    );
  }

  // ================================================================
  // QUEUE OPERATIONS
  // ================================================================

  enqueue(
    data: T,
    options: {
      priority?: QueuePriority;
      timeout?: number;
      maxAttempts?: number;
      deadline?: Date;
    } = {}
  ): string | null {
    // Check backpressure
    this.backpressure.update(this.heap.size, this.processing.size);

    if (this.backpressure.shouldReject()) {
      this.rejected++;
      return null;
    }

    if (this.heap.size >= this.config.maxSize) {
      this.rejected++;
      return null;
    }

    const item: QueueItem<T> = {
      id: `${this.config.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      priority: options.priority ?? 'normal',
      createdAt: new Date(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.config.defaultMaxAttempts,
      timeout: options.timeout ?? this.config.defaultTimeout,
      deadline: options.deadline,
    };

    this.heap.push(item);
    this.events.onEnqueue?.(item);

    // Start processing if running
    if (this.state === 'running') {
      this.processNext();
    }

    return item.id;
  }

  async process(processor: (data: T) => Promise<unknown>): Promise<void> {
    this.processor = processor;
    this.start();

    // Wait until drained
    return new Promise((resolve) => {
      const check = () => {
        if (this.heap.size === 0 && this.processing.size === 0) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  // ================================================================
  // STATE MANAGEMENT
  // ================================================================

  start(): void {
    if (this.state === 'running') return;
    this.changeState('running');
    this.processNext();
  }

  pause(): void {
    if (this.state === 'paused') return;
    this.changeState('paused');
  }

  async drain(): Promise<void> {
    this.changeState('draining');

    return new Promise((resolve) => {
      const check = () => {
        if (this.processing.size === 0) {
          this.changeState('stopped');
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }

  stop(): void {
    this.changeState('stopped');
    const dropped = this.heap.clear();
    for (const item of dropped) {
      this.events.onDrop?.(item, 'Queue stopped');
    }
  }

  private changeState(newState: QueueState): void {
    const oldState = this.state;
    this.state = newState;
    this.events.onStateChange?.(oldState, newState);
  }

  // ================================================================
  // PROCESSING
  // ================================================================

  private async processNext(): Promise<void> {
    if (this.state !== 'running') return;
    if (!this.processor) return;

    // Check backpressure
    const level = this.backpressure.update(this.heap.size, this.processing.size);
    if (this.backpressure.shouldPause()) {
      // Wait and retry
      setTimeout(() => this.processNext(), this.config.backpressure.checkInterval);
      return;
    }

    // Check concurrency
    while (this.processing.size < this.config.concurrency && this.heap.size > 0) {
      const item = this.heap.pop();
      if (!item) break;

      // Check deadline
      if (item.deadline && new Date() > item.deadline) {
        this.events.onDrop?.(item, 'Deadline exceeded');
        continue;
      }

      this.events.onDequeue?.(item);
      this.processing.set(item.id, item);

      // Process async
      this.processItem(item);
    }
  }

  private async processItem(item: QueueItem<T>): Promise<void> {
    const startTime = Date.now();
    item.attempts++;

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Processing timeout')), item.timeout);
      });

      // Race processing vs timeout
      const result = await Promise.race([
        this.processor!(item.data),
        timeoutPromise,
      ]);

      // Success
      this.processingTimes.push(Date.now() - startTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.completed++;
      this.processing.delete(item.id);
      this.events.onComplete?.(item, result);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      if (item.attempts < item.maxAttempts) {
        // Retry
        this.retried++;
        this.events.onRetry?.(item, item.attempts);

        // Re-enqueue with delay
        setTimeout(() => {
          if (this.state === 'running') {
            this.heap.push(item);
            this.processing.delete(item.id);
            this.processNext();
          }
        }, this.config.retryDelay * item.attempts);
      } else {
        // Failed permanently
        this.failed++;
        this.processing.delete(item.id);
        this.events.onError?.(item, err);
      }
    }

    // Continue processing
    if (this.state === 'running') {
      this.processNext();
    }
  }

  // ================================================================
  // METRICS
  // ================================================================

  getMetrics(): QueueMetrics {
    const now = Date.now();
    const elapsed = (now - this.lastThroughputCheck) / 1000;
    const throughput = elapsed > 0 ? (this.completed - this.lastThroughputCount) / elapsed : 0;

    this.lastThroughputCheck = now;
    this.lastThroughputCount = this.completed;

    const avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    return {
      name: this.config.name,
      state: this.state,
      size: this.heap.size,
      processing: this.processing.size,
      completed: this.completed,
      failed: this.failed,
      retried: this.retried,
      rejected: this.rejected,
      avgProcessingTime,
      backpressureLevel: this.backpressure.level,
      throughput,
    };
  }

  get size(): number {
    return this.heap.size;
  }

  get processingCount(): number {
    return this.processing.size;
  }

  get currentState(): QueueState {
    return this.state;
  }
}

// ================================================================
// QUEUE REGISTRY
// ================================================================

class QueueRegistry {
  private queues: Map<string, ManagedQueue<unknown>> = new Map();

  register<T>(queue: ManagedQueue<T>): void {
    const metrics = queue.getMetrics();
    this.queues.set(metrics.name, queue as ManagedQueue<unknown>);
  }

  unregister(name: string): void {
    this.queues.delete(name);
  }

  get(name: string): ManagedQueue<unknown> | undefined {
    return this.queues.get(name);
  }

  getAllMetrics(): QueueMetrics[] {
    return Array.from(this.queues.values()).map((q) => q.getMetrics());
  }

  getTotalBackpressure(): BackpressureLevel {
    const levels = this.getAllMetrics().map((m) => m.backpressureLevel);

    if (levels.includes('critical')) return 'critical';
    if (levels.includes('high')) return 'high';
    if (levels.includes('elevated')) return 'elevated';
    return 'normal';
  }
}

// ================================================================
// SINGLETON
// ================================================================

let registry: QueueRegistry | null = null;

export function getQueueRegistry(): QueueRegistry {
  if (!registry) {
    registry = new QueueRegistry();
  }
  return registry;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

export function createQueue<T>(
  name: string,
  config: Partial<Omit<QueueConfig, 'name'>> = {},
  events: QueueEvents<T> = {}
): ManagedQueue<T> {
  const queue = new ManagedQueue<T>({ name, ...config }, events);
  getQueueRegistry().register(queue);
  return queue;
}

export function getQueueMetrics(): QueueMetrics[] {
  return getQueueRegistry().getAllMetrics();
}

export function getSystemBackpressure(): BackpressureLevel {
  return getQueueRegistry().getTotalBackpressure();
}
