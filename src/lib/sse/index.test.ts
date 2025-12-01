/**
 * SSE Progress Streaming Tests
 *
 * Phase 1, Week 1, Day 5
 * Tests for Server-Sent Events streaming functionality.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ANALYSIS_STAGES,
  STAGE_METADATA,
  ProgressEventSchema,
  ErrorEventSchema,
  CompleteEventSchema,
  encodeSSEEvent,
  encodeSSEHeartbeat,
  encodeSSERetry,
  ProgressTracker,
  createSSEStream,
  getSSEHeaders,
  createSSEResponse,
  calculateEstimatedTimeRemaining,
  getStageByIndex,
  getStageIndex,
  isStageBefore,
  isStageAfter,
  getStagesBetween,
  formatDuration,
  type AnalysisStage,
  type ProgressEvent,
  type ErrorEvent,
  type CompleteEvent,
} from './index';

describe('SSE Module', () => {
  describe('ANALYSIS_STAGES', () => {
    it('should have all expected stages', () => {
      expect(ANALYSIS_STAGES).toContain('initializing');
      expect(ANALYSIS_STAGES).toContain('fetching_url');
      expect(ANALYSIS_STAGES).toContain('extracting_metadata');
      expect(ANALYSIS_STAGES).toContain('detecting_industry');
      expect(ANALYSIS_STAGES).toContain('generating_queries');
      expect(ANALYSIS_STAGES).toContain('querying_openai');
      expect(ANALYSIS_STAGES).toContain('querying_anthropic');
      expect(ANALYSIS_STAGES).toContain('aggregating_results');
      expect(ANALYSIS_STAGES).toContain('calculating_scores');
      expect(ANALYSIS_STAGES).toContain('generating_recommendations');
      expect(ANALYSIS_STAGES).toContain('finalizing');
      expect(ANALYSIS_STAGES).toContain('complete');
    });

    it('should have correct order', () => {
      expect(ANALYSIS_STAGES[0]).toBe('initializing');
      expect(ANALYSIS_STAGES[ANALYSIS_STAGES.length - 1]).toBe('complete');
    });

    it('should have 12 stages', () => {
      expect(ANALYSIS_STAGES.length).toBe(12);
    });
  });

  describe('STAGE_METADATA', () => {
    it('should have metadata for all stages', () => {
      for (const stage of ANALYSIS_STAGES) {
        expect(STAGE_METADATA[stage]).toBeDefined();
        expect(STAGE_METADATA[stage].stage).toBe(stage);
        expect(STAGE_METADATA[stage].label).toBeTruthy();
        expect(STAGE_METADATA[stage].description).toBeTruthy();
        expect(typeof STAGE_METADATA[stage].estimatedDurationMs).toBe('number');
        expect(STAGE_METADATA[stage].icon).toBeTruthy();
      }
    });

    it('should have reasonable duration estimates', () => {
      // Most stages should be under 10 seconds
      for (const stage of ANALYSIS_STAGES) {
        expect(STAGE_METADATA[stage].estimatedDurationMs).toBeLessThanOrEqual(10000);
      }
    });

    it('should have zero duration for complete stage', () => {
      expect(STAGE_METADATA.complete.estimatedDurationMs).toBe(0);
    });
  });

  describe('Schema Validation', () => {
    describe('ProgressEventSchema', () => {
      it('should validate valid progress event', () => {
        const event: ProgressEvent = {
          type: 'progress',
          stage: 'fetching_url',
          stageIndex: 1,
          totalStages: 12,
          percentComplete: 8,
          message: 'Fetching website content',
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => ProgressEventSchema.parse(event)).not.toThrow();
      });

      it('should accept optional details', () => {
        const event = {
          type: 'progress' as const,
          stage: 'querying_openai' as const,
          stageIndex: 5,
          totalStages: 12,
          percentComplete: 42,
          message: 'Querying OpenAI',
          details: { queriesCompleted: 5, queriesTotal: 10 },
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        const result = ProgressEventSchema.safeParse(event);
        expect(result.success).toBe(true);
      });

      it('should reject invalid stage', () => {
        const event = {
          type: 'progress',
          stage: 'invalid_stage',
          stageIndex: 1,
          totalStages: 12,
          percentComplete: 8,
          message: 'Test',
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => ProgressEventSchema.parse(event)).toThrow();
      });

      it('should reject percent over 100', () => {
        const event = {
          type: 'progress',
          stage: 'fetching_url',
          stageIndex: 1,
          totalStages: 12,
          percentComplete: 150,
          message: 'Test',
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => ProgressEventSchema.parse(event)).toThrow();
      });
    });

    describe('ErrorEventSchema', () => {
      it('should validate valid error event', () => {
        const event: ErrorEvent = {
          type: 'error',
          stage: 'fetching_url',
          message: 'Failed to fetch URL',
          code: 'FETCH_ERROR',
          retryable: true,
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => ErrorEventSchema.parse(event)).not.toThrow();
      });

      it('should accept error without code', () => {
        const event: ErrorEvent = {
          type: 'error',
          stage: 'querying_openai',
          message: 'Rate limited',
          retryable: true,
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => ErrorEventSchema.parse(event)).not.toThrow();
      });
    });

    describe('CompleteEventSchema', () => {
      it('should validate valid complete event', () => {
        const event: CompleteEvent = {
          type: 'complete',
          stage: 'complete',
          percentComplete: 100,
          message: 'Analysis complete!',
          resultId: 'result-456',
          redirectUrl: '/results/result-456',
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => CompleteEventSchema.parse(event)).not.toThrow();
      });

      it('should reject non-100 percent', () => {
        const event = {
          type: 'complete',
          stage: 'complete',
          percentComplete: 99,
          message: 'Done',
          resultId: 'result-456',
          redirectUrl: '/results/result-456',
          timestamp: new Date().toISOString(),
          analysisId: 'test-123',
        };

        expect(() => CompleteEventSchema.parse(event)).toThrow();
      });
    });
  });

  describe('SSE Encoding', () => {
    describe('encodeSSEEvent', () => {
      it('should encode progress event correctly', () => {
        const event: ProgressEvent = {
          type: 'progress',
          stage: 'initializing',
          stageIndex: 0,
          totalStages: 12,
          percentComplete: 0,
          message: 'Starting...',
          timestamp: '2025-01-01T00:00:00.000Z',
          analysisId: 'test-123',
        };

        const encoded = encodeSSEEvent(event);

        expect(encoded).toContain('event: progress');
        expect(encoded).toContain('data: ');
        expect(encoded).toContain('"type":"progress"');
        expect(encoded).toContain('"stage":"initializing"');
        expect(encoded.endsWith('\n\n')).toBe(true);
      });

      it('should encode error event correctly', () => {
        const event: ErrorEvent = {
          type: 'error',
          stage: 'fetching_url',
          message: 'Timeout',
          retryable: true,
          timestamp: '2025-01-01T00:00:00.000Z',
          analysisId: 'test-123',
        };

        const encoded = encodeSSEEvent(event);

        expect(encoded).toContain('event: error');
        expect(encoded).toContain('"type":"error"');
      });

      it('should encode complete event correctly', () => {
        const event: CompleteEvent = {
          type: 'complete',
          stage: 'complete',
          percentComplete: 100,
          message: 'Done!',
          resultId: 'r-123',
          redirectUrl: '/results/r-123',
          timestamp: '2025-01-01T00:00:00.000Z',
          analysisId: 'test-123',
        };

        const encoded = encodeSSEEvent(event);

        expect(encoded).toContain('event: complete');
        expect(encoded).toContain('"resultId":"r-123"');
      });
    });

    describe('encodeSSEHeartbeat', () => {
      it('should encode heartbeat as comment', () => {
        const heartbeat = encodeSSEHeartbeat();

        expect(heartbeat).toBe(': heartbeat\n\n');
      });
    });

    describe('encodeSSERetry', () => {
      it('should encode retry directive', () => {
        const retry = encodeSSERetry(3000);

        expect(retry).toBe('retry: 3000\n\n');
      });
    });
  });

  describe('ProgressTracker', () => {
    let tracker: ProgressTracker;

    beforeEach(() => {
      tracker = new ProgressTracker('test-analysis-123');
    });

    describe('initialization', () => {
      it('should start at stage 0', () => {
        expect(tracker.currentStage).toBe('initializing');
      });

      it('should have correct total stages', () => {
        expect(tracker.totalStages).toBe(12);
      });

      it('should start at 0% complete', () => {
        expect(tracker.percentComplete).toBe(0);
      });

      it('should not be aborted initially', () => {
        expect(tracker.isAborted()).toBe(false);
      });
    });

    describe('subscribe', () => {
      it('should call listener on events', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.advanceTo('fetching_url');

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'progress',
            stage: 'fetching_url',
          })
        );
      });

      it('should allow multiple listeners', () => {
        const listener1 = vi.fn();
        const listener2 = vi.fn();

        tracker.subscribe(listener1);
        tracker.subscribe(listener2);

        tracker.advanceTo('fetching_url');

        expect(listener1).toHaveBeenCalledTimes(1);
        expect(listener2).toHaveBeenCalledTimes(1);
      });

      it('should return unsubscribe function', () => {
        const listener = vi.fn();
        const unsubscribe = tracker.subscribe(listener);

        unsubscribe();
        tracker.advanceTo('fetching_url');

        expect(listener).not.toHaveBeenCalled();
      });
    });

    describe('advanceTo', () => {
      it('should update current stage', () => {
        tracker.advanceTo('extracting_metadata');

        expect(tracker.currentStage).toBe('extracting_metadata');
      });

      it('should update percent complete', () => {
        tracker.advanceTo('querying_openai');

        // Stage 5 of 12 (0-indexed), so 5/11 = ~45%
        expect(tracker.percentComplete).toBe(45);
      });

      it('should emit progress event with correct data', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.advanceTo('detecting_industry', { detected: 'saas' });

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'progress',
            stage: 'detecting_industry',
            stageIndex: 3,
            totalStages: 12,
            details: { detected: 'saas' },
            analysisId: 'test-analysis-123',
          })
        );
      });

      it('should throw for invalid stage', () => {
        expect(() => tracker.advanceTo('invalid' as AnalysisStage)).toThrow();
      });
    });

    describe('advanceToNext', () => {
      it('should move to next stage', () => {
        tracker.advanceToNext();

        expect(tracker.currentStage).toBe('fetching_url');
      });

      it('should not advance past final stage', () => {
        // Move to complete
        for (let i = 0; i < 15; i++) {
          tracker.advanceToNext();
        }

        expect(tracker.currentStage).toBe('complete');
      });
    });

    describe('reportError', () => {
      it('should emit error event', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.advanceTo('fetching_url');
        tracker.reportError('Connection timeout', 'TIMEOUT', true);

        expect(listener).toHaveBeenLastCalledWith(
          expect.objectContaining({
            type: 'error',
            stage: 'fetching_url',
            message: 'Connection timeout',
            code: 'TIMEOUT',
            retryable: true,
          })
        );
      });
    });

    describe('complete', () => {
      it('should emit complete event', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.complete('result-123', '/results/result-123');

        expect(listener).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'complete',
            stage: 'complete',
            percentComplete: 100,
            resultId: 'result-123',
            redirectUrl: '/results/result-123',
          })
        );
      });

      it('should set stage to complete', () => {
        tracker.complete('result-123', '/results/result-123');

        expect(tracker.currentStage).toBe('complete');
        expect(tracker.percentComplete).toBe(100);
      });
    });

    describe('abort', () => {
      it('should set aborted flag', () => {
        tracker.abort();

        expect(tracker.isAborted()).toBe(true);
      });

      it('should stop emitting events', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.abort();
        tracker.advanceTo('fetching_url');

        expect(listener).not.toHaveBeenCalled();
      });

      it('should clear listeners', () => {
        const listener = vi.fn();
        tracker.subscribe(listener);

        tracker.abort();

        // Even if we try to emit, nothing happens
        tracker.advanceTo('fetching_url');
        expect(listener).not.toHaveBeenCalled();
      });
    });
  });

  describe('createSSEStream', () => {
    it('should return stream and tracker', () => {
      const { stream, tracker } = createSSEStream('test-123');

      expect(stream).toBeInstanceOf(ReadableStream);
      expect(tracker).toBeInstanceOf(ProgressTracker);
    });

    it('should emit initializing event on start', async () => {
      const { stream } = createSSEStream('test-123');
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      // Read first chunk (retry directive)
      const chunk1 = await reader.read();
      expect(decoder.decode(chunk1.value)).toContain('retry:');

      // Read second chunk (initializing event)
      const chunk2 = await reader.read();
      const text = decoder.decode(chunk2.value);
      expect(text).toContain('event: progress');
      expect(text).toContain('"stage":"initializing"');

      reader.cancel();
    });

    it('should handle abort signal', async () => {
      const controller = new AbortController();
      const { stream, tracker } = createSSEStream('test-123', controller.signal);

      const reader = stream.getReader();

      // Read initial events first
      await reader.read(); // retry directive
      await reader.read(); // initializing event

      // Abort
      controller.abort();

      // Wait a bit for abort to propagate
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(tracker.isAborted()).toBe(true);

      // Tracker should not emit new events after abort
      const listener = vi.fn();
      tracker.subscribe(listener);
      tracker.advanceTo('fetching_url');
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('getSSEHeaders', () => {
    it('should return correct content type', () => {
      const headers = getSSEHeaders() as Record<string, string>;

      expect(headers['Content-Type']).toBe('text/event-stream');
    });

    it('should disable caching', () => {
      const headers = getSSEHeaders() as Record<string, string>;

      expect(headers['Cache-Control']).toBe('no-cache, no-transform');
    });

    it('should keep connection alive', () => {
      const headers = getSSEHeaders() as Record<string, string>;

      expect(headers['Connection']).toBe('keep-alive');
    });

    it('should disable nginx buffering', () => {
      const headers = getSSEHeaders() as Record<string, string>;

      expect(headers['X-Accel-Buffering']).toBe('no');
    });
  });

  describe('createSSEResponse', () => {
    it('should create response with stream', () => {
      const { stream } = createSSEStream('test-123');
      const response = createSSEResponse(stream);

      expect(response).toBeInstanceOf(Response);
      expect(response.status).toBe(200);
    });

    it('should use SSE headers', () => {
      const { stream } = createSSEStream('test-123');
      const response = createSSEResponse(stream);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });

    it('should allow custom status', () => {
      const { stream } = createSSEStream('test-123');
      const response = createSSEResponse(stream, 202);

      expect(response.status).toBe(202);
    });
  });

  describe('calculateEstimatedTimeRemaining', () => {
    it('should calculate remaining time', () => {
      const startTime = new Date(Date.now() - 5000); // 5 seconds ago
      const result = calculateEstimatedTimeRemaining('detecting_industry', startTime);

      expect(result.elapsedMs).toBeGreaterThanOrEqual(5000);
      expect(result.estimatedRemainingMs).toBeGreaterThan(0);
      expect(result.estimatedTotalMs).toBeGreaterThan(result.elapsedMs);
    });

    it('should return 0 remaining for complete', () => {
      const startTime = new Date(Date.now() - 10000);
      const result = calculateEstimatedTimeRemaining('complete', startTime);

      expect(result.estimatedRemainingMs).toBe(0);
    });
  });

  describe('Stage Utility Functions', () => {
    describe('getStageByIndex', () => {
      it('should return correct stage', () => {
        expect(getStageByIndex(0)).toBe('initializing');
        expect(getStageByIndex(5)).toBe('querying_openai');
        expect(getStageByIndex(11)).toBe('complete');
      });

      it('should return undefined for out of bounds', () => {
        expect(getStageByIndex(-1)).toBeUndefined();
        expect(getStageByIndex(100)).toBeUndefined();
      });
    });

    describe('getStageIndex', () => {
      it('should return correct index', () => {
        expect(getStageIndex('initializing')).toBe(0);
        expect(getStageIndex('querying_openai')).toBe(5);
        expect(getStageIndex('complete')).toBe(11);
      });
    });

    describe('isStageBefore', () => {
      it('should return true when stage is before', () => {
        expect(isStageBefore('initializing', 'fetching_url')).toBe(true);
        expect(isStageBefore('fetching_url', 'complete')).toBe(true);
      });

      it('should return false when stage is after or equal', () => {
        expect(isStageBefore('complete', 'initializing')).toBe(false);
        expect(isStageBefore('fetching_url', 'fetching_url')).toBe(false);
      });
    });

    describe('isStageAfter', () => {
      it('should return true when stage is after', () => {
        expect(isStageAfter('complete', 'initializing')).toBe(true);
        expect(isStageAfter('fetching_url', 'initializing')).toBe(true);
      });

      it('should return false when stage is before or equal', () => {
        expect(isStageAfter('initializing', 'complete')).toBe(false);
        expect(isStageAfter('fetching_url', 'fetching_url')).toBe(false);
      });
    });

    describe('getStagesBetween', () => {
      it('should return stages between (inclusive)', () => {
        const stages = getStagesBetween('fetching_url', 'detecting_industry');

        expect(stages).toEqual([
          'fetching_url',
          'extracting_metadata',
          'detecting_industry',
        ]);
      });

      it('should return single stage if same', () => {
        const stages = getStagesBetween('fetching_url', 'fetching_url');

        expect(stages).toEqual(['fetching_url']);
      });

      it('should return empty array if from is after to', () => {
        const stages = getStagesBetween('complete', 'initializing');

        expect(stages).toEqual([]);
      });

      it('should return all stages from start to end', () => {
        const stages = getStagesBetween('initializing', 'complete');

        expect(stages.length).toBe(12);
        expect(stages[0]).toBe('initializing');
        expect(stages[11]).toBe('complete');
      });
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds under 1 second', () => {
      expect(formatDuration(500)).toBe('less than a second');
      expect(formatDuration(999)).toBe('less than a second');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1 second');
      expect(formatDuration(2000)).toBe('2 seconds');
      expect(formatDuration(30000)).toBe('30 seconds');
      expect(formatDuration(59000)).toBe('59 seconds');
    });

    it('should format minutes', () => {
      expect(formatDuration(60000)).toBe('1 minute');
      expect(formatDuration(120000)).toBe('2 minutes');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1:30');
      expect(formatDuration(125000)).toBe('2:05');
    });
  });
});

describe('SSE Integration', () => {
  it('should handle full analysis flow', async () => {
    const { stream, tracker } = createSSEStream('integration-test');
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const events: string[] = [];

    // Collect events in background
    const collectEvents = async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        events.push(decoder.decode(value));
      }
    };

    const collecting = collectEvents();

    // Simulate analysis flow
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.advanceTo('fetching_url');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.advanceTo('extracting_metadata');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.complete('result-123', '/results/result-123');

    await collecting;

    // Verify events were collected
    const allEvents = events.join('');
    expect(allEvents).toContain('"stage":"initializing"');
    expect(allEvents).toContain('"stage":"fetching_url"');
    expect(allEvents).toContain('"stage":"extracting_metadata"');
    expect(allEvents).toContain('"stage":"complete"');
    expect(allEvents).toContain('"resultId":"result-123"');
  });

  it('should handle error during analysis', async () => {
    const { stream, tracker } = createSSEStream('error-test');
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    const events: string[] = [];

    const collectEvents = async () => {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        events.push(decoder.decode(value));
      }
    };

    const collecting = collectEvents();

    // Simulate error
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.advanceTo('fetching_url');
    await new Promise(resolve => setTimeout(resolve, 10));
    tracker.reportError('Network timeout', 'NETWORK_ERROR', true);

    await collecting;

    const allEvents = events.join('');
    expect(allEvents).toContain('event: error');
    expect(allEvents).toContain('"message":"Network timeout"');
    expect(allEvents).toContain('"retryable":true');
  });
});
