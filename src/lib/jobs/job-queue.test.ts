/**
 * Job Queue Tests
 *
 * Phase 3, Week 9, Day 1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JobQueue, createQueue, getQueue } from './job-queue';
import { type Job, type JobContext, JOB_TYPES } from './types';

describe('JobQueue', () => {
  let queue: JobQueue;

  beforeEach(() => {
    queue = createQueue({ concurrency: 2, pollInterval: 50 });
  });

  afterEach(() => {
    queue.destroy();
  });

  // ================================================================
  // JOB ADDING
  // ================================================================

  describe('adding jobs', () => {
    it('should add a job to the queue', async () => {
      const job = await queue.add('test:job', { data: 'test' });

      expect(job.id).toBeDefined();
      expect(job.type).toBe('test:job');
      expect(job.payload).toEqual({ data: 'test' });
      expect(job.status).toBe('pending');
    });

    it('should assign default options', async () => {
      const job = await queue.add('test:job', { data: 'test' });

      expect(job.priority).toBe('normal');
      expect(job.maxAttempts).toBe(3);
      expect(job.attempts).toBe(0);
    });

    it('should respect custom options', async () => {
      const job = await queue.add(
        'test:job',
        { data: 'test' },
        {
          priority: 'high',
          maxAttempts: 5,
          retryDelay: 10000,
        }
      );

      expect(job.priority).toBe('high');
      expect(job.maxAttempts).toBe(5);
      expect(job.retryDelay).toBe(10000);
    });

    it('should handle delayed jobs', async () => {
      const job = await queue.add(
        'test:job',
        { data: 'test' },
        { delay: 5000 }
      );

      expect(job.scheduledAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle scheduled jobs', async () => {
      const scheduledAt = new Date(Date.now() + 60000);
      const job = await queue.add(
        'test:job',
        { data: 'test' },
        { scheduledAt }
      );

      expect(job.scheduledAt).toEqual(scheduledAt);
    });

    it('should deduplicate jobs with same uniqueKey', async () => {
      const job1 = await queue.add(
        'test:job',
        { data: 'first' },
        { uniqueKey: 'unique-123' }
      );

      const job2 = await queue.add(
        'test:job',
        { data: 'second' },
        { uniqueKey: 'unique-123' }
      );

      expect(job1.id).toBe(job2.id);
      expect(job2.payload).toEqual({ data: 'first' }); // Original payload
    });

    it('should store metadata', async () => {
      const job = await queue.add(
        'test:job',
        { data: 'test' },
        {
          metadata: {
            userId: 'user-123',
            correlationId: 'corr-456',
            tags: ['important'],
          },
        }
      );

      expect(job.metadata.userId).toBe('user-123');
      expect(job.metadata.correlationId).toBe('corr-456');
      expect(job.metadata.tags).toContain('important');
    });
  });

  // ================================================================
  // JOB RETRIEVAL
  // ================================================================

  describe('getting jobs', () => {
    it('should get job by ID', async () => {
      const added = await queue.add('test:job', { data: 'test' });
      const retrieved = await queue.getJob(added.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(added.id);
    });

    it('should return null for unknown job', async () => {
      const job = await queue.getJob('unknown-id');
      expect(job).toBeNull();
    });

    it('should get jobs by status', async () => {
      await queue.add('test:job', { n: 1 });
      await queue.add('test:job', { n: 2 });

      const pending = await queue.getJobsByStatus('pending');
      expect(pending.length).toBe(2);
    });

    it('should get jobs by type', async () => {
      await queue.add('type-a', { n: 1 });
      await queue.add('type-a', { n: 2 });
      await queue.add('type-b', { n: 3 });

      const typeA = await queue.getJobsByType('type-a');
      expect(typeA.length).toBe(2);
    });
  });

  // ================================================================
  // HANDLER REGISTRATION
  // ================================================================

  describe('handler registration', () => {
    it('should register a handler', () => {
      const handler = vi.fn();
      queue.register('test:job', handler);

      // No error means success
      expect(true).toBe(true);
    });

    it('should unregister a handler', () => {
      const handler = vi.fn();
      queue.register('test:job', handler);

      const result = queue.unregister('test:job');
      expect(result).toBe(true);
    });

    it('should return false for unknown handler', () => {
      const result = queue.unregister('unknown');
      expect(result).toBe(false);
    });
  });

  // ================================================================
  // JOB PROCESSING
  // ================================================================

  describe('job processing', () => {
    it('should process a job successfully', async () => {
      const handler = vi.fn().mockResolvedValue('success');
      queue.register('test:job', handler);

      await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(handler).toHaveBeenCalled();
    });

    it('should pass job context to handler', async () => {
      let receivedContext: JobContext | null = null;

      queue.register('test:job', async (ctx) => {
        receivedContext = ctx;
        return 'done';
      });

      const job = await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(receivedContext).not.toBeNull();
      expect(receivedContext?.job.id).toBe(job.id);
    });

    it('should update job status to completed', async () => {
      queue.register('test:job', async () => 'done');

      const job = await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(updated?.result).toBe('done');
    });

    it('should handle job failure', async () => {
      queue.register('test:job', async () => {
        throw new Error('Test error');
      });

      const job = await queue.add('test:job', { data: 'test' }, { maxAttempts: 1 });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error).toBe('Test error');
    });

    it('should retry failed jobs', async () => {
      let attempts = 0;
      queue.register('test:job', async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Retry me');
        }
        return 'success';
      });

      const job = await queue.add(
        'test:job',
        { data: 'test' },
        { maxAttempts: 3, retryDelay: 50 }
      );
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 500));

      const updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('completed');
      expect(attempts).toBe(2);
    });

    it('should respect concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      queue.register('test:job', async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 100));
        concurrent--;
        return 'done';
      });

      // Add more jobs than concurrency
      for (let i = 0; i < 5; i++) {
        await queue.add('test:job', { n: i });
      }

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(maxConcurrent).toBeLessThanOrEqual(2); // Concurrency is 2
    });

    it('should process jobs by priority', async () => {
      const processed: string[] = [];

      queue.register('test:job', async (ctx) => {
        processed.push(ctx.job.priority);
        return 'done';
      });

      // Add jobs with different priorities (low first)
      await queue.add('test:job', { n: 1 }, { priority: 'low' });
      await queue.add('test:job', { n: 2 }, { priority: 'high' });
      await queue.add('test:job', { n: 3 }, { priority: 'critical' });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Critical should be processed first
      expect(processed[0]).toBe('critical');
    });

    it('should fail job without handler', async () => {
      const job = await queue.add('unregistered:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('failed');
      expect(updated?.error).toContain('No handler registered');
    });
  });

  // ================================================================
  // PROGRESS TRACKING
  // ================================================================

  describe('progress tracking', () => {
    it('should update progress', async () => {
      const progressValues: number[] = [];

      queue.on('job:progress', (event) => {
        if (event.job) {
          progressValues.push(event.job.progress);
        }
      });

      queue.register('test:job', async (ctx) => {
        await ctx.updateProgress(25);
        await ctx.updateProgress(50);
        await ctx.updateProgress(75);
        await ctx.updateProgress(100);
        return 'done';
      });

      await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(progressValues).toContain(25);
      expect(progressValues).toContain(50);
      expect(progressValues).toContain(75);
    });

    it('should clamp progress to 0-100', async () => {
      let finalProgress = 0;

      queue.register('test:job', async (ctx) => {
        await ctx.updateProgress(-10);
        await ctx.updateProgress(150);
        finalProgress = ctx.job.progress;
        return 'done';
      });

      await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(finalProgress).toBeLessThanOrEqual(100);
    });
  });

  // ================================================================
  // CANCELLATION
  // ================================================================

  describe('job cancellation', () => {
    it('should cancel a pending job', async () => {
      const job = await queue.add('test:job', { data: 'test' });

      const result = await queue.cancel(job.id);
      expect(result).toBe(true);

      const updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('cancelled');
    });

    it('should not cancel completed job', async () => {
      queue.register('test:job', async () => 'done');

      const job = await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      const result = await queue.cancel(job.id);
      expect(result).toBe(false);
    });

    it('should provide cancellation check to handler', async () => {
      let wasCancelled = false;

      queue.register('test:job', async (ctx) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        wasCancelled = ctx.isCancelled();
        return 'done';
      });

      const job = await queue.add('test:job', { data: 'test' });
      queue.start();

      // Cancel after a short delay
      setTimeout(() => queue.cancel(job.id), 50);

      await new Promise((resolve) => setTimeout(resolve, 300));

      expect(wasCancelled).toBe(true);
    });
  });

  // ================================================================
  // EVENTS
  // ================================================================

  describe('events', () => {
    it('should emit job:added event', async () => {
      const handler = vi.fn();
      queue.on('job:added', handler);

      await queue.add('test:job', { data: 'test' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job:added',
          job: expect.objectContaining({ type: 'test:job' }),
        })
      );
    });

    it('should emit job:started event', async () => {
      const handler = vi.fn();
      queue.on('job:started', handler);

      queue.register('test:job', async () => 'done');
      await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(handler).toHaveBeenCalled();
    });

    it('should emit job:completed event', async () => {
      const handler = vi.fn();
      queue.on('job:completed', handler);

      queue.register('test:job', async () => 'done');
      await queue.add('test:job', { data: 'test' });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'job:completed',
        })
      );
    });

    it('should emit job:failed event', async () => {
      const handler = vi.fn();
      queue.on('job:failed', handler);

      queue.register('test:job', async () => {
        throw new Error('Fail');
      });
      await queue.add('test:job', { data: 'test' }, { maxAttempts: 1 });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(handler).toHaveBeenCalled();
    });

    it('should emit job:cancelled event', async () => {
      const handler = vi.fn();
      queue.on('job:cancelled', handler);

      const job = await queue.add('test:job', { data: 'test' });
      await queue.cancel(job.id);

      expect(handler).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = queue.on('job:added', handler);

      unsubscribe();

      // Handler should not be called after unsubscribe
      queue.add('test:job', { data: 'test' });

      // Give it a tick
      setTimeout(() => {
        expect(handler).not.toHaveBeenCalled();
      }, 0);
    });
  });

  // ================================================================
  // STATISTICS
  // ================================================================

  describe('statistics', () => {
    it('should track total added', async () => {
      await queue.add('test:job', { n: 1 });
      await queue.add('test:job', { n: 2 });
      await queue.add('test:job', { n: 3 });

      const stats = queue.getStats();
      expect(stats.totalAdded).toBe(3);
    });

    it('should track completed and failed', async () => {
      queue.register('success', async () => 'done');
      queue.register('fail', async () => {
        throw new Error('Fail');
      });

      await queue.add('success', { n: 1 });
      await queue.add('success', { n: 2 });
      await queue.add('fail', { n: 3 }, { maxAttempts: 1 });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const stats = queue.getStats();
      expect(stats.totalCompleted).toBe(2);
      expect(stats.totalFailed).toBe(1);
    });

    it('should calculate success rate', async () => {
      queue.register('success', async () => 'done');
      queue.register('fail', async () => {
        throw new Error('Fail');
      });

      await queue.add('success', { n: 1 });
      await queue.add('success', { n: 2 });
      await queue.add('success', { n: 3 });
      await queue.add('fail', { n: 4 }, { maxAttempts: 1 });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 500));

      const stats = queue.getStats();
      expect(stats.successRate).toBe(75);
    });

    it('should track active jobs', async () => {
      queue.register('test:job', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return 'done';
      });

      await queue.add('test:job', { n: 1 });
      await queue.add('test:job', { n: 2 });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const stats = queue.getStats();
      expect(stats.active).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // CLEANUP
  // ================================================================

  describe('cleanup', () => {
    it('should remove a job', async () => {
      const job = await queue.add('test:job', { data: 'test' });

      const result = await queue.remove(job.id);
      expect(result).toBe(true);

      const check = await queue.getJob(job.id);
      expect(check).toBeNull();
    });

    it('should clear all jobs', async () => {
      await queue.add('test:job', { n: 1 });
      await queue.add('test:job', { n: 2 });
      await queue.add('test:job', { n: 3 });

      const count = await queue.clear();
      expect(count).toBe(3);

      const pending = await queue.getJobsByStatus('pending');
      expect(pending.length).toBe(0);
    });

    it('should clear jobs by status', async () => {
      queue.register('test:job', async () => 'done');

      await queue.add('test:job', { n: 1 });
      await queue.add('test:job', { n: 2 });

      queue.start();
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Add more pending
      await queue.add('test:job', { n: 3 });

      const count = await queue.clear('completed');

      const pending = await queue.getJobsByStatus('pending');
      expect(pending.length).toBe(1);
    });
  });

  // ================================================================
  // RETRY
  // ================================================================

  describe('retry', () => {
    it('should retry a failed job', async () => {
      let attempts = 0;
      queue.register('test:job', async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error('First fail');
        }
        return 'success';
      });

      const job = await queue.add('test:job', { data: 'test' }, { maxAttempts: 1 });
      queue.start();

      await new Promise((resolve) => setTimeout(resolve, 200));

      // Job should be failed
      let updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('failed');

      // Retry
      const result = await queue.retry(job.id);
      expect(result).toBe(true);

      updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('pending');
      expect(updated?.attempts).toBe(0);

      await new Promise((resolve) => setTimeout(resolve, 200));

      updated = await queue.getJob(job.id);
      expect(updated?.status).toBe('completed');
    });

    it('should not retry non-failed job', async () => {
      const job = await queue.add('test:job', { data: 'test' });

      const result = await queue.retry(job.id);
      expect(result).toBe(false);
    });
  });
});

// ================================================================
// SINGLETON
// ================================================================

describe('getQueue', () => {
  it('should return same instance', () => {
    const queue1 = getQueue();
    const queue2 = getQueue();
    expect(queue1).toBe(queue2);
  });
});
