/**
 * Request Context - AsyncLocalStorage for Trace Propagation
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.114
 *
 * Provides request-scoped context that propagates through async operations.
 */

import { AsyncLocalStorage } from 'async_hooks';

// ================================================================
// TYPES
// ================================================================

export type UserPlan = 'free' | 'starter' | 'pro' | 'enterprise';

export interface RequestContext {
  // Identification
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;

  // Timing
  startTime: number;
  deadline?: number;

  // User context
  userId?: string;
  userPlan?: UserPlan;
  userIp: string;

  // Request metadata
  method: string;
  path: string;
  userAgent?: string;

  // Custom attributes
  attributes: Map<string, unknown>;
}

export interface SpanOptions {
  name: string;
  attributes?: Record<string, unknown>;
}

// ================================================================
// CONTEXT STORAGE
// ================================================================

const contextStorage = new AsyncLocalStorage<RequestContext>();

// ================================================================
// CONTEXT MANAGEMENT
// ================================================================

/**
 * Run a function with a specific request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return contextStorage.run(context, fn);
}

/**
 * Run an async function with a specific request context
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return contextStorage.run(context, fn);
}

/**
 * Get the current request context (undefined if outside context)
 */
export function getContext(): RequestContext | undefined {
  return contextStorage.getStore();
}

/**
 * Get the current request context or throw if not available
 */
export function requireContext(): RequestContext {
  const context = getContext();
  if (!context) {
    throw new Error('Request context required but not available');
  }
  return context;
}

// ================================================================
// CONTEXT ACCESSORS
// ================================================================

/**
 * Get the current request ID
 */
export function getRequestId(): string {
  return getContext()?.requestId ?? 'no-context';
}

/**
 * Get the current trace ID
 */
export function getTraceId(): string {
  return getContext()?.traceId ?? 'no-trace';
}

/**
 * Get the current span ID
 */
export function getSpanId(): string {
  return getContext()?.spanId ?? 'no-span';
}

/**
 * Get the current user ID
 */
export function getUserId(): string | undefined {
  return getContext()?.userId;
}

/**
 * Get the current user plan
 */
export function getUserPlan(): UserPlan {
  return getContext()?.userPlan ?? 'free';
}

/**
 * Get remaining time budget (ms) before deadline
 */
export function getRemainingBudget(): number {
  const ctx = getContext();
  if (!ctx?.deadline) return Infinity;
  return Math.max(0, ctx.deadline - Date.now());
}

/**
 * Check if the request has exceeded its deadline
 */
export function isDeadlineExceeded(): boolean {
  const ctx = getContext();
  if (!ctx?.deadline) return false;
  return Date.now() > ctx.deadline;
}

/**
 * Get elapsed time since request start (ms)
 */
export function getElapsedTime(): number {
  const ctx = getContext();
  if (!ctx) return 0;
  return Date.now() - ctx.startTime;
}

// ================================================================
// CONTEXT ATTRIBUTES
// ================================================================

/**
 * Set a context attribute
 */
export function setAttribute(key: string, value: unknown): void {
  const ctx = getContext();
  if (ctx) {
    ctx.attributes.set(key, value);
  }
}

/**
 * Get a context attribute
 */
export function getAttribute<T>(key: string): T | undefined {
  const ctx = getContext();
  return ctx?.attributes.get(key) as T | undefined;
}

/**
 * Get all context attributes as an object
 */
export function getAttributes(): Record<string, unknown> {
  const ctx = getContext();
  if (!ctx) return {};
  return Object.fromEntries(ctx.attributes);
}

// ================================================================
// SPAN MANAGEMENT
// ================================================================

/**
 * Generate a new span ID
 */
function generateSpanId(): string {
  return crypto.randomUUID().slice(0, 16);
}

/**
 * Create a child span and run a function within it
 */
export function withSpan<T>(name: string, fn: (span: Span) => T): T {
  const parentContext = getContext();
  if (!parentContext) {
    // No parent context, just run the function
    const noopSpan: Span = {
      name,
      spanId: 'no-context',
      setAttribute: () => {},
      setStatus: () => {},
      end: () => {},
    };
    return fn(noopSpan);
  }

  const spanId = generateSpanId();
  const span: Span = {
    name,
    spanId,
    setAttribute: (key, value) => {
      setAttribute(`span.${name}.${key}`, value);
    },
    setStatus: (status) => {
      setAttribute(`span.${name}.status`, status);
    },
    end: () => {
      setAttribute(`span.${name}.duration`, Date.now() - parentContext.startTime);
    },
  };

  const childContext: RequestContext = {
    ...parentContext,
    spanId,
    parentSpanId: parentContext.spanId,
    attributes: new Map(parentContext.attributes),
  };

  return contextStorage.run(childContext, () => {
    try {
      const result = fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create a child span and run an async function within it
 */
export async function withSpanAsync<T>(
  name: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  const parentContext = getContext();
  if (!parentContext) {
    const noopSpan: Span = {
      name,
      spanId: 'no-context',
      setAttribute: () => {},
      setStatus: () => {},
      end: () => {},
    };
    return fn(noopSpan);
  }

  const spanId = generateSpanId();
  const startTime = Date.now();
  const span: Span = {
    name,
    spanId,
    setAttribute: (key, value) => {
      setAttribute(`span.${name}.${key}`, value);
    },
    setStatus: (status) => {
      setAttribute(`span.${name}.status`, status);
    },
    end: () => {
      setAttribute(`span.${name}.duration`, Date.now() - startTime);
    },
  };

  const childContext: RequestContext = {
    ...parentContext,
    spanId,
    parentSpanId: parentContext.spanId,
    attributes: new Map(parentContext.attributes),
  };

  return contextStorage.run(childContext, async () => {
    try {
      const result = await fn(span);
      span.setStatus('ok');
      return result;
    } catch (error) {
      span.setStatus('error');
      throw error;
    } finally {
      span.end();
    }
  });
}

export interface Span {
  name: string;
  spanId: string;
  setAttribute: (key: string, value: unknown) => void;
  setStatus: (status: 'ok' | 'error') => void;
  end: () => void;
}

// ================================================================
// CONTEXT FACTORY
// ================================================================

/**
 * Create a new request context
 */
export function createContext(options: {
  requestId?: string;
  traceId?: string;
  method: string;
  path: string;
  userIp: string;
  userId?: string;
  userPlan?: UserPlan;
  userAgent?: string;
  timeoutMs?: number;
}): RequestContext {
  const now = Date.now();
  const requestId = options.requestId ?? crypto.randomUUID();

  return {
    requestId,
    traceId: options.traceId ?? requestId,
    spanId: generateSpanId(),
    startTime: now,
    deadline: options.timeoutMs ? now + options.timeoutMs : undefined,
    method: options.method,
    path: options.path,
    userIp: options.userIp,
    userId: options.userId,
    userPlan: options.userPlan,
    userAgent: options.userAgent,
    attributes: new Map(),
  };
}

// ================================================================
// CONTEXT FOR LOGGING
// ================================================================

/**
 * Get context fields for structured logging
 */
export function getLogContext(): Record<string, unknown> {
  const ctx = getContext();
  if (!ctx) {
    return { requestId: 'no-context' };
  }

  return {
    requestId: ctx.requestId,
    traceId: ctx.traceId,
    spanId: ctx.spanId,
    parentSpanId: ctx.parentSpanId,
    userId: ctx.userId,
    userPlan: ctx.userPlan,
    method: ctx.method,
    path: ctx.path,
    elapsedMs: Date.now() - ctx.startTime,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  runWithContext,
  runWithContextAsync,
  getContext,
  requireContext,
  getRequestId,
  getTraceId,
  getSpanId,
  getUserId,
  getUserPlan,
  getRemainingBudget,
  isDeadlineExceeded,
  getElapsedTime,
  setAttribute,
  getAttribute,
  getAttributes,
  withSpan,
  withSpanAsync,
  createContext,
  getLogContext,
};
