/**
 * Mock Utilities
 *
 * Reusable mocks for testing
 *
 * Phase 3, Week 10, Day 1
 */

import { vi } from 'vitest';

// ================================================================
// HTTP MOCKS
// ================================================================

export interface MockResponse {
  status?: number;
  statusText?: string;
  ok?: boolean;
  headers?: Record<string, string>;
  body?: unknown;
  error?: Error;
}

/**
 * Create a mock fetch function
 */
export function createMockFetch(responses: MockResponse | MockResponse[] = {}) {
  const responseQueue = Array.isArray(responses) ? [...responses] : [responses];

  return vi.fn(async (_url: string, _options?: RequestInit): Promise<Response> => {
    const response = responseQueue.shift() || responseQueue[responseQueue.length - 1] || {};

    if (response.error) {
      throw response.error;
    }

    return {
      ok: response.ok ?? (response.status ? response.status < 400 : true),
      status: response.status ?? 200,
      statusText: response.statusText ?? 'OK',
      headers: new Headers(response.headers || {}),
      json: async () => response.body,
      text: async () => JSON.stringify(response.body),
      blob: async () => new Blob([JSON.stringify(response.body)]),
      arrayBuffer: async () => new ArrayBuffer(0),
      clone: function() { return this; },
      body: null,
      bodyUsed: false,
      formData: async () => new FormData(),
      redirected: false,
      type: 'basic' as ResponseType,
      url: '',
    } as Response;
  });
}

/**
 * Setup global fetch mock
 */
export function mockGlobalFetch(responses: MockResponse | MockResponse[]) {
  const mockFn = createMockFetch(responses);
  vi.stubGlobal('fetch', mockFn);
  return mockFn;
}

/**
 * Restore global fetch
 */
export function restoreGlobalFetch() {
  vi.unstubAllGlobals();
}

// ================================================================
// TIMER MOCKS
// ================================================================

/**
 * Create controllable timer utilities
 */
export function createTimerMocks() {
  vi.useFakeTimers();

  return {
    /**
     * Advance time by milliseconds
     */
    advanceTime: (ms: number) => {
      vi.advanceTimersByTime(ms);
    },

    /**
     * Run all pending timers
     */
    runAllTimers: () => {
      vi.runAllTimers();
    },

    /**
     * Run only pending timers (not new ones)
     */
    runOnlyPendingTimers: () => {
      vi.runOnlyPendingTimers();
    },

    /**
     * Set system time
     */
    setSystemTime: (date: Date | string | number) => {
      vi.setSystemTime(date);
    },

    /**
     * Restore real timers
     */
    restore: () => {
      vi.useRealTimers();
    },
  };
}

// ================================================================
// STORAGE MOCKS
// ================================================================

/**
 * Create a mock Storage (localStorage/sessionStorage)
 */
export function createMockStorage(): Storage {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
}

/**
 * Setup mock localStorage
 */
export function mockLocalStorage() {
  const storage = createMockStorage();
  vi.stubGlobal('localStorage', storage);
  return storage;
}

/**
 * Setup mock sessionStorage
 */
export function mockSessionStorage() {
  const storage = createMockStorage();
  vi.stubGlobal('sessionStorage', storage);
  return storage;
}

// ================================================================
// CONSOLE MOCKS
// ================================================================

export interface ConsoleMocks {
  log: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
  restore: () => void;
}

/**
 * Mock console methods
 */
export function mockConsole(): ConsoleMocks {
  const originalConsole = { ...console };

  const mocks: ConsoleMocks = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    restore: () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
    },
  };

  // Use type assertions to assign mock functions to console
  console.log = mocks.log as unknown as typeof console.log;
  console.warn = mocks.warn as unknown as typeof console.warn;
  console.error = mocks.error as unknown as typeof console.error;
  console.info = mocks.info as unknown as typeof console.info;
  console.debug = mocks.debug as unknown as typeof console.debug;

  return mocks;
}

// ================================================================
// EVENT MOCKS
// ================================================================

/**
 * Create a mock Event
 */
export function createMockEvent(type: string, options: Partial<Event> = {}): Event {
  return {
    type,
    target: null,
    currentTarget: null,
    bubbles: false,
    cancelable: false,
    defaultPrevented: false,
    composed: false,
    isTrusted: false,
    timeStamp: Date.now(),
    eventPhase: 0,
    srcElement: null,
    returnValue: true,
    cancelBubble: false,
    composedPath: () => [],
    initEvent: () => {},
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    NONE: 0,
    CAPTURING_PHASE: 1,
    AT_TARGET: 2,
    BUBBLING_PHASE: 3,
    ...options,
  };
}

/**
 * Create a mock keyboard event
 */
export function createMockKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  options: Partial<KeyboardEvent> = {}
): KeyboardEvent {
  return {
    ...createMockEvent(type),
    key,
    code: options.code || key,
    altKey: options.altKey || false,
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    shiftKey: options.shiftKey || false,
    repeat: options.repeat || false,
    location: 0,
    charCode: 0,
    keyCode: 0,
    which: 0,
    isComposing: false,
    getModifierState: () => false,
    initKeyboardEvent: () => {},
    DOM_KEY_LOCATION_LEFT: 1,
    DOM_KEY_LOCATION_NUMPAD: 3,
    DOM_KEY_LOCATION_RIGHT: 2,
    DOM_KEY_LOCATION_STANDARD: 0,
    detail: 0,
    view: null,
    initUIEvent: () => {},
    ...options,
  } as KeyboardEvent;
}

/**
 * Create a mock mouse event
 */
export function createMockMouseEvent(
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove',
  options: Partial<MouseEvent> = {}
): MouseEvent {
  return {
    ...createMockEvent(type),
    clientX: options.clientX || 0,
    clientY: options.clientY || 0,
    screenX: options.screenX || 0,
    screenY: options.screenY || 0,
    pageX: options.pageX || 0,
    pageY: options.pageY || 0,
    button: options.button || 0,
    buttons: options.buttons || 0,
    altKey: options.altKey || false,
    ctrlKey: options.ctrlKey || false,
    metaKey: options.metaKey || false,
    shiftKey: options.shiftKey || false,
    movementX: 0,
    movementY: 0,
    offsetX: 0,
    offsetY: 0,
    relatedTarget: null,
    x: 0,
    y: 0,
    getModifierState: () => false,
    initMouseEvent: () => {},
    detail: 0,
    view: null,
    initUIEvent: () => {},
    ...options,
  } as MouseEvent;
}

// ================================================================
// DATABASE MOCKS
// ================================================================

export interface MockDatabase {
  query: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  transaction: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock database client
 */
export function createMockDatabase(): MockDatabase {
  return {
    query: vi.fn().mockResolvedValue({ rows: [], count: 0 }),
    insert: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    update: vi.fn().mockResolvedValue({ affected: 1 }),
    delete: vi.fn().mockResolvedValue({ affected: 1 }),
    transaction: vi.fn(async (fn) => {
      return await fn({
        query: vi.fn().mockResolvedValue({ rows: [] }),
        insert: vi.fn().mockResolvedValue({ id: 'mock-id' }),
        update: vi.fn().mockResolvedValue({ affected: 1 }),
        delete: vi.fn().mockResolvedValue({ affected: 1 }),
      });
    }),
  };
}

// ================================================================
// AI PROVIDER MOCKS
// ================================================================

export interface MockAIProvider {
  complete: ReturnType<typeof vi.fn>;
  chat: ReturnType<typeof vi.fn>;
  embed: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock AI provider
 */
export function createMockAIProvider(defaultResponse = 'Mock AI response'): MockAIProvider {
  return {
    complete: vi.fn().mockResolvedValue({
      text: defaultResponse,
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
    chat: vi.fn().mockResolvedValue({
      message: { role: 'assistant', content: defaultResponse },
      usage: { promptTokens: 15, completionTokens: 25 },
    }),
    embed: vi.fn().mockResolvedValue({
      embedding: new Array(1536).fill(0),
      usage: { totalTokens: 5 },
    }),
  };
}

// ================================================================
// REQUEST/RESPONSE MOCKS
// ================================================================

/**
 * Create a mock Next.js Request object
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: unknown;
  } = {}
): Request {
  const { method = 'GET', headers = {}, body } = options;

  return new Request(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create mock NextResponse utilities
 */
export function createMockNextResponse() {
  return {
    json: vi.fn((data: unknown, init?: ResponseInit) => {
      return new Response(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(init?.headers as Record<string, string>),
        },
      });
    }),
    redirect: vi.fn((url: string, status = 307) => {
      return new Response(null, {
        status,
        headers: { Location: url },
      });
    }),
    next: vi.fn(() => {
      return new Response(null, { status: 200 });
    }),
  };
}

// ================================================================
// SUPABASE MOCKS
// ================================================================

export interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>;
  auth: {
    getUser: ReturnType<typeof vi.fn>;
    getSession: ReturnType<typeof vi.fn>;
    signIn: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
  rpc: ReturnType<typeof vi.fn>;
}

/**
 * Create a mock Supabase client
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  const chainableMethods = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn((resolve) => resolve({ data: [], error: null })),
  };

  return {
    from: vi.fn(() => chainableMethods),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  createMockFetch,
  mockGlobalFetch,
  restoreGlobalFetch,
  createTimerMocks,
  createMockStorage,
  mockLocalStorage,
  mockSessionStorage,
  mockConsole,
  createMockEvent,
  createMockKeyboardEvent,
  createMockMouseEvent,
  createMockDatabase,
  createMockAIProvider,
  createMockRequest,
  createMockNextResponse,
  createMockSupabaseClient,
};
