/**
 * SSE Progress Streaming
 *
 * Phase 1, Week 1, Day 5
 * Server-Sent Events for real-time analysis progress updates.
 */

import { z } from 'zod';

// ================================================================
// TYPES & SCHEMAS
// ================================================================

/**
 * Analysis stages in order
 */
export const ANALYSIS_STAGES = [
  'initializing',
  'fetching_url',
  'extracting_metadata',
  'detecting_industry',
  'generating_queries',
  'querying_openai',
  'querying_anthropic',
  'aggregating_results',
  'calculating_scores',
  'generating_recommendations',
  'finalizing',
  'complete',
] as const;

export type AnalysisStage = typeof ANALYSIS_STAGES[number];

/**
 * Progress event schema
 */
export const ProgressEventSchema = z.object({
  type: z.enum(['progress', 'error', 'complete']),
  stage: z.enum(ANALYSIS_STAGES),
  stageIndex: z.number().int().min(0),
  totalStages: z.number().int().min(1),
  percentComplete: z.number().min(0).max(100),
  message: z.string(),
  details: z.record(z.string(), z.any()).optional(),
  timestamp: z.string().datetime(),
  analysisId: z.string(),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/**
 * Error event schema
 */
export const ErrorEventSchema = z.object({
  type: z.literal('error'),
  stage: z.enum(ANALYSIS_STAGES),
  message: z.string(),
  code: z.string().optional(),
  retryable: z.boolean(),
  timestamp: z.string().datetime(),
  analysisId: z.string(),
});

export type ErrorEvent = z.infer<typeof ErrorEventSchema>;

/**
 * Complete event schema
 */
export const CompleteEventSchema = z.object({
  type: z.literal('complete'),
  stage: z.literal('complete'),
  percentComplete: z.literal(100),
  message: z.string(),
  resultId: z.string(),
  redirectUrl: z.string(),
  timestamp: z.string().datetime(),
  analysisId: z.string(),
});

export type CompleteEvent = z.infer<typeof CompleteEventSchema>;

/**
 * Stage metadata with human-readable labels and durations
 */
export interface StageMetadata {
  stage: AnalysisStage;
  label: string;
  description: string;
  estimatedDurationMs: number;
  icon: string;
}

export const STAGE_METADATA: Record<AnalysisStage, StageMetadata> = {
  initializing: {
    stage: 'initializing',
    label: 'Initializing',
    description: 'Setting up analysis environment',
    estimatedDurationMs: 500,
    icon: 'loader',
  },
  fetching_url: {
    stage: 'fetching_url',
    label: 'Fetching URL',
    description: 'Retrieving website content',
    estimatedDurationMs: 2000,
    icon: 'globe',
  },
  extracting_metadata: {
    stage: 'extracting_metadata',
    label: 'Extracting Metadata',
    description: 'Analyzing page structure and content',
    estimatedDurationMs: 1000,
    icon: 'search',
  },
  detecting_industry: {
    stage: 'detecting_industry',
    label: 'Detecting Industry',
    description: 'Identifying business category and competitors',
    estimatedDurationMs: 500,
    icon: 'building',
  },
  generating_queries: {
    stage: 'generating_queries',
    label: 'Generating Queries',
    description: 'Creating AI perception test queries',
    estimatedDurationMs: 500,
    icon: 'sparkles',
  },
  querying_openai: {
    stage: 'querying_openai',
    label: 'Querying OpenAI',
    description: 'Testing visibility with GPT models',
    estimatedDurationMs: 8000,
    icon: 'brain',
  },
  querying_anthropic: {
    stage: 'querying_anthropic',
    label: 'Querying Anthropic',
    description: 'Testing visibility with Claude models',
    estimatedDurationMs: 8000,
    icon: 'brain',
  },
  aggregating_results: {
    stage: 'aggregating_results',
    label: 'Aggregating Results',
    description: 'Combining responses from all providers',
    estimatedDurationMs: 500,
    icon: 'layers',
  },
  calculating_scores: {
    stage: 'calculating_scores',
    label: 'Calculating Scores',
    description: 'Computing visibility metrics',
    estimatedDurationMs: 500,
    icon: 'calculator',
  },
  generating_recommendations: {
    stage: 'generating_recommendations',
    label: 'Generating Recommendations',
    description: 'Creating actionable improvement suggestions',
    estimatedDurationMs: 1000,
    icon: 'lightbulb',
  },
  finalizing: {
    stage: 'finalizing',
    label: 'Finalizing',
    description: 'Saving results and preparing report',
    estimatedDurationMs: 500,
    icon: 'check',
  },
  complete: {
    stage: 'complete',
    label: 'Complete',
    description: 'Analysis finished successfully',
    estimatedDurationMs: 0,
    icon: 'check-circle',
  },
};

// ================================================================
// SSE ENCODER
// ================================================================

/**
 * Encodes an event to SSE format
 */
export function encodeSSEEvent(event: ProgressEvent | ErrorEvent | CompleteEvent): string {
  const data = JSON.stringify(event);
  return `event: ${event.type}\ndata: ${data}\n\n`;
}

/**
 * Encodes a heartbeat/ping event
 */
export function encodeSSEHeartbeat(): string {
  return `: heartbeat\n\n`;
}

/**
 * Encodes a retry directive
 */
export function encodeSSERetry(ms: number): string {
  return `retry: ${ms}\n\n`;
}

// ================================================================
// PROGRESS TRACKER
// ================================================================

/**
 * Tracks and emits progress events
 */
export class ProgressTracker {
  private analysisId: string;
  private currentStageIndex: number = 0;
  private listeners: ((event: ProgressEvent | ErrorEvent | CompleteEvent) => void)[] = [];
  private aborted: boolean = false;

  constructor(analysisId: string) {
    this.analysisId = analysisId;
  }

  /**
   * Get current stage
   */
  get currentStage(): AnalysisStage {
    return ANALYSIS_STAGES[this.currentStageIndex];
  }

  /**
   * Get total number of stages
   */
  get totalStages(): number {
    return ANALYSIS_STAGES.length;
  }

  /**
   * Get percent complete
   */
  get percentComplete(): number {
    return Math.round((this.currentStageIndex / (this.totalStages - 1)) * 100);
  }

  /**
   * Subscribe to progress events
   */
  subscribe(listener: (event: ProgressEvent | ErrorEvent | CompleteEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: ProgressEvent | ErrorEvent | CompleteEvent): void {
    if (this.aborted) return;
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch {
        // Ignore listener errors
      }
    });
  }

  /**
   * Advance to a specific stage
   */
  advanceTo(stage: AnalysisStage, details?: Record<string, unknown>): void {
    const stageIndex = ANALYSIS_STAGES.indexOf(stage);
    if (stageIndex === -1) {
      throw new Error(`Invalid stage: ${stage}`);
    }

    this.currentStageIndex = stageIndex;
    const metadata = STAGE_METADATA[stage];

    const event: ProgressEvent = {
      type: 'progress',
      stage,
      stageIndex,
      totalStages: this.totalStages,
      percentComplete: this.percentComplete,
      message: metadata.description,
      details,
      timestamp: new Date().toISOString(),
      analysisId: this.analysisId,
    };

    this.emit(event);
  }

  /**
   * Advance to next stage
   */
  advanceToNext(details?: Record<string, unknown>): void {
    if (this.currentStageIndex < this.totalStages - 1) {
      this.currentStageIndex++;
      this.advanceTo(this.currentStage, details);
    }
  }

  /**
   * Report an error
   */
  reportError(message: string, code?: string, retryable: boolean = false): void {
    const event: ErrorEvent = {
      type: 'error',
      stage: this.currentStage,
      message,
      code,
      retryable,
      timestamp: new Date().toISOString(),
      analysisId: this.analysisId,
    };

    this.emit(event);
  }

  /**
   * Mark as complete
   */
  complete(resultId: string, redirectUrl: string): void {
    this.currentStageIndex = this.totalStages - 1;

    const event: CompleteEvent = {
      type: 'complete',
      stage: 'complete',
      percentComplete: 100,
      message: 'Analysis complete! Redirecting to results...',
      resultId,
      redirectUrl,
      timestamp: new Date().toISOString(),
      analysisId: this.analysisId,
    };

    this.emit(event);
  }

  /**
   * Abort tracking
   */
  abort(): void {
    this.aborted = true;
    this.listeners = [];
  }

  /**
   * Check if aborted
   */
  isAborted(): boolean {
    return this.aborted;
  }
}

// ================================================================
// SSE STREAM CREATOR
// ================================================================

/**
 * Creates a ReadableStream for SSE
 */
export function createSSEStream(
  analysisId: string,
  signal?: AbortSignal
): { stream: ReadableStream<Uint8Array>; tracker: ProgressTracker } {
  const tracker = new ProgressTracker(analysisId);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send initial retry directive
      controller.enqueue(encoder.encode(encodeSSERetry(3000)));

      // Subscribe to tracker events
      const unsubscribe = tracker.subscribe((event) => {
        try {
          const encoded = encodeSSEEvent(event);
          controller.enqueue(encoder.encode(encoded));

          // Close stream on complete or error
          if (event.type === 'complete' || event.type === 'error') {
            controller.close();
          }
        } catch {
          // Stream already closed
        }
      });

      // Heartbeat interval
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(encodeSSEHeartbeat()));
        } catch {
          clearInterval(heartbeatInterval);
        }
      }, 15000);

      // Handle abort
      signal?.addEventListener('abort', () => {
        tracker.abort();
        clearInterval(heartbeatInterval);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });

      // Send initializing event
      tracker.advanceTo('initializing');
    },
  });

  return { stream, tracker };
}

// ================================================================
// RESPONSE HELPERS
// ================================================================

/**
 * Creates SSE response headers
 */
export function getSSEHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  };
}

/**
 * Creates a Next.js SSE Response
 */
export function createSSEResponse(
  stream: ReadableStream<Uint8Array>,
  status: number = 200
): Response {
  return new Response(stream, {
    status,
    headers: getSSEHeaders(),
  });
}

// ================================================================
// ESTIMATED TIME CALCULATOR
// ================================================================

/**
 * Calculate estimated time remaining
 */
export function calculateEstimatedTimeRemaining(
  currentStage: AnalysisStage,
  startTime: Date
): {
  estimatedTotalMs: number;
  estimatedRemainingMs: number;
  elapsedMs: number;
} {
  const currentIndex = ANALYSIS_STAGES.indexOf(currentStage);
  const elapsedMs = Date.now() - startTime.getTime();

  // Sum up remaining stage durations
  let estimatedRemainingMs = 0;
  for (let i = currentIndex; i < ANALYSIS_STAGES.length; i++) {
    estimatedRemainingMs += STAGE_METADATA[ANALYSIS_STAGES[i]].estimatedDurationMs;
  }

  // Calculate total based on progress
  const completedStages = currentIndex;
  const totalStages = ANALYSIS_STAGES.length;
  const estimatedTotalMs = completedStages > 0
    ? (elapsedMs / completedStages) * totalStages
    : estimatedRemainingMs + elapsedMs;

  return {
    estimatedTotalMs: Math.round(estimatedTotalMs),
    estimatedRemainingMs: Math.round(estimatedRemainingMs),
    elapsedMs: Math.round(elapsedMs),
  };
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get stage by index
 */
export function getStageByIndex(index: number): AnalysisStage | undefined {
  return ANALYSIS_STAGES[index];
}

/**
 * Get stage index
 */
export function getStageIndex(stage: AnalysisStage): number {
  return ANALYSIS_STAGES.indexOf(stage);
}

/**
 * Check if stage is before another
 */
export function isStageBefore(stage: AnalysisStage, other: AnalysisStage): boolean {
  return getStageIndex(stage) < getStageIndex(other);
}

/**
 * Check if stage is after another
 */
export function isStageAfter(stage: AnalysisStage, other: AnalysisStage): boolean {
  return getStageIndex(stage) > getStageIndex(other);
}

/**
 * Get stages between two stages (inclusive)
 */
export function getStagesBetween(
  from: AnalysisStage,
  to: AnalysisStage
): AnalysisStage[] {
  const fromIndex = getStageIndex(from);
  const toIndex = getStageIndex(to);

  if (fromIndex > toIndex) {
    return [];
  }

  return ANALYSIS_STAGES.slice(fromIndex, toIndex + 1);
}

/**
 * Format duration for display
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return 'less than a second';
  }

  const seconds = Math.round(ms / 1000);

  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
