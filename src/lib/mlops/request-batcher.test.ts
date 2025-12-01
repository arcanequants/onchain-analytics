/**
 * Request Batcher Tests
 * Phase 4, Week 8 - MLOps Engineer Checklist
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  RequestBatcher,
  AIModelBatcher,
  MonitoringBatcher,
  MetricsCollector,
  createAIBatcher,
  createMetricsCollector,
  type BatchMetrics,
} from './request-batcher';

describe('RequestBatcher', () => {
  let batcher: RequestBatcher<number, number>;
  let processorFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    processorFn = vi.fn().mockImplementation(async (batch: number[]) => {
      return batch.map((n) => n * 2);
    });
    batcher = new RequestBatcher(processorFn, {
      maxBatchSize: 5,
      maxWaitMs: 100,
      maxRetries: 2,
      retryDelayMs: 50,
      enableMetrics: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Batching', () => {
    it('should batch multiple requests', async () => {
      const promises = [batcher.add(1), batcher.add(2), batcher.add(3)];

      // Fast forward to trigger batch
      await vi.advanceTimersByTimeAsync(100);

      const results = await Promise.all(promises);
      expect(results).toEqual([2, 4, 6]);
      expect(processorFn).toHaveBeenCalledTimes(1);
      expect(processorFn).toHaveBeenCalledWith([1, 2, 3]);
    });

    it('should process immediately when batch size reached', async () => {
      const promises = [
        batcher.add(1),
        batcher.add(2),
        batcher.add(3),
        batcher.add(4),
        batcher.add(5),
      ];

      // Should process immediately without waiting
      await vi.advanceTimersByTimeAsync(1);

      const results = await Promise.all(promises);
      expect(results).toEqual([2, 4, 6, 8, 10]);
      expect(processorFn).toHaveBeenCalledTimes(1);
    });

    it('should handle empty batch', async () => {
      await batcher.flush();
      expect(processorFn).not.toHaveBeenCalled();
    });
  });

  describe('Priority Handling', () => {
    it('should process high priority requests first', async () => {
      let processedOrder: number[] = [];
      processorFn.mockImplementation(async (batch: number[]) => {
        processedOrder = batch;
        return batch.map((n) => n * 2);
      });

      batcher.add(1, 'low');
      batcher.add(2, 'normal');
      batcher.add(3, 'high');

      await vi.advanceTimersByTimeAsync(100);

      // High priority should be first
      expect(processedOrder[0]).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should retry failed requests', async () => {
      let attempts = 0;
      processorFn.mockImplementation(async (batch: number[]) => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return batch.map((n) => n * 2);
      });

      const promise = batcher.add(5);

      await vi.advanceTimersByTimeAsync(200);

      const result = await promise;
      expect(result).toBe(10);
      expect(attempts).toBe(2);
    });

    it('should reject after max retries', async () => {
      processorFn.mockRejectedValue(new Error('Persistent failure'));

      const promise = batcher.add(5);

      // Advance through all retries
      await vi.advanceTimersByTimeAsync(1000);

      await expect(promise).rejects.toThrow('Max retries exceeded');
    });
  });

  describe('Metrics', () => {
    it('should track batch metrics', async () => {
      await batcher.add(1);
      await batcher.add(2);
      await batcher.flush();

      const metrics = batcher.getMetrics();
      expect(metrics.length).toBe(1);
      expect(metrics[0].size).toBe(2);
      expect(metrics[0].successCount).toBe(2);
      expect(metrics[0].errorCount).toBe(0);
    });

    it('should calculate aggregate metrics', async () => {
      await batcher.add(1);
      await batcher.flush();

      await batcher.add(2);
      await batcher.add(3);
      await batcher.flush();

      const aggregate = batcher.getAggregateMetrics();
      expect(aggregate.totalBatches).toBe(2);
      expect(aggregate.totalRequests).toBe(3);
      expect(aggregate.successRate).toBe(100);
    });

    it('should clear metrics', async () => {
      await batcher.add(1);
      await batcher.flush();

      batcher.clearMetrics();
      expect(batcher.getMetrics().length).toBe(0);
    });
  });

  describe('Queue Management', () => {
    it('should report queue size', () => {
      batcher.add(1);
      batcher.add(2);
      expect(batcher.getQueueSize()).toBe(2);
    });

    it('should report processing status', async () => {
      let resolveProcessor: () => void;
      processorFn.mockImplementation(
        () =>
          new Promise<number[]>((resolve) => {
            resolveProcessor = () => resolve([2]);
          })
      );

      batcher.add(1);
      batcher.flush();

      // Wait a tick for processing to start
      await vi.advanceTimersByTimeAsync(1);

      expect(batcher.isProcessing()).toBe(true);

      resolveProcessor!();
      await vi.advanceTimersByTimeAsync(1);

      expect(batcher.isProcessing()).toBe(false);
    });
  });

  describe('Callback', () => {
    it('should call onBatchComplete callback', async () => {
      const onComplete = vi.fn();
      const batcherWithCallback = new RequestBatcher(processorFn, {
        maxBatchSize: 5,
        maxWaitMs: 100,
        maxRetries: 2,
        retryDelayMs: 50,
        enableMetrics: true,
        onBatchComplete: onComplete,
      });

      await batcherWithCallback.add(1);
      await batcherWithCallback.flush();

      expect(onComplete).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          size: 1,
          successCount: 1,
        })
      );
    });
  });
});

describe('AIModelBatcher', () => {
  it('should use AI-optimized defaults', async () => {
    vi.useFakeTimers();

    const processor = vi.fn().mockResolvedValue([{ result: 'ok' }]);
    const batcher = new AIModelBatcher(processor);

    await batcher.add({ prompt: 'test' });
    await vi.advanceTimersByTimeAsync(50);

    expect(processor).toHaveBeenCalled();

    vi.useRealTimers();
  });
});

describe('MonitoringBatcher', () => {
  it('should use monitoring-optimized defaults', async () => {
    vi.useFakeTimers();

    const processor = vi.fn().mockResolvedValue([undefined, undefined]);
    const batcher = new MonitoringBatcher(processor);

    batcher.track({ event: 'test1' });
    batcher.track({ event: 'test2' });

    // Should wait longer before flushing
    await vi.advanceTimersByTimeAsync(100);
    expect(processor).not.toHaveBeenCalled();

    // Flush explicitly
    await batcher.flush();
    expect(processor).toHaveBeenCalledWith([{ event: 'test1' }, { event: 'test2' }]);

    vi.useRealTimers();
  });
});

describe('MetricsCollector', () => {
  let collector: MetricsCollector;
  let sinkFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    sinkFn = vi.fn().mockResolvedValue(undefined);
    collector = createMetricsCollector(sinkFn, {
      batchSize: 10,
      flushIntervalMs: 1000,
    });
  });

  afterEach(() => {
    collector.stop();
    vi.useRealTimers();
  });

  it('should track events', async () => {
    collector.track('test_event', { value: 42 });
    collector.track('test_event', { value: 43 });

    await collector.flush();

    expect(sinkFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'test_event', data: { value: 42 } }),
        expect.objectContaining({ type: 'test_event', data: { value: 43 } }),
      ])
    );
  });

  it('should track AI requests', async () => {
    collector.trackAIRequest('openai', 'gpt-4', 500, 100, true);

    await collector.flush();

    expect(sinkFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'ai_request',
          data: {
            provider: 'openai',
            model: 'gpt-4',
            latencyMs: 500,
            tokensUsed: 100,
            success: true,
          },
        }),
      ])
    );
  });

  it('should track batch metrics', async () => {
    const metrics: BatchMetrics = {
      batchId: 'test_batch',
      size: 5,
      startTime: new Date(),
      endTime: new Date(),
      totalLatencyMs: 100,
      avgLatencyMs: 20,
      successCount: 4,
      errorCount: 1,
      retryCount: 1,
    };

    collector.trackBatch(metrics);

    await collector.flush();

    expect(sinkFn).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'batch_processed',
          data: expect.objectContaining({
            batchId: 'test_batch',
            size: 5,
          }),
        }),
      ])
    );
  });

  it('should auto-flush on interval', async () => {
    collector.track('test', { value: 1 });

    await vi.advanceTimersByTimeAsync(1000);

    expect(sinkFn).toHaveBeenCalled();
  });

  it('should stop interval on stop()', () => {
    collector.stop();

    collector.track('test', { value: 1 });

    vi.advanceTimersByTime(2000);

    // Should not have auto-flushed
    expect(sinkFn).not.toHaveBeenCalled();
  });
});

describe('Factory Functions', () => {
  it('should create AI batcher', () => {
    const batcher = createAIBatcher(async (inputs: string[]) => {
      return inputs.map((i) => ({ result: i }));
    });

    expect(batcher).toBeInstanceOf(AIModelBatcher);
  });

  it('should create metrics collector', () => {
    const collector = createMetricsCollector(async () => {});

    expect(collector).toBeInstanceOf(MetricsCollector);

    collector.stop();
  });
});
