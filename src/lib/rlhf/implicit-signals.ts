/**
 * RLHF Implicit Signal Collector
 *
 * Tracks implicit user behavior signals for Reinforcement Learning from Human Feedback:
 * - Dwell time (time spent viewing content)
 * - Scroll depth (how far users scroll)
 * - Click patterns
 * - Hover interactions
 * - Copy/share actions
 * - Tab switches and focus changes
 *
 * These signals complement explicit feedback (thumbs up/down, ratings) to understand
 * user engagement and content quality.
 *
 * @module lib/rlhf/implicit-signals
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Types of implicit events that can be tracked
 */
export type ImplicitEventType =
  | 'page_view'
  | 'scroll_depth'
  | 'dwell_time'
  | 'click'
  | 'hover'
  | 'copy'
  | 'share'
  | 'expand'
  | 'collapse'
  | 'tab_switch'
  | 'search'
  | 'filter';

/**
 * Page types for context
 */
export type PageType = 'results' | 'analysis' | 'recommendations' | 'dashboard' | 'settings' | 'other';

/**
 * Base event structure
 */
export interface ImplicitEvent {
  eventType: ImplicitEventType;
  sessionId: string;
  userId?: string;
  analysisId?: string;
  timestamp: number;
  pageUrl: string;
  pageType?: PageType;
  elementId?: string;
  elementType?: string;
  elementLabel?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  viewportWidth?: number;
  viewportHeight?: number;
}

/**
 * Scroll depth event with percentage
 */
export interface ScrollDepthEvent extends ImplicitEvent {
  eventType: 'scroll_depth';
  value: number; // 0-100 percentage
  metadata: {
    documentHeight: number;
    viewportHeight: number;
    scrollPosition: number;
  };
}

/**
 * Dwell time event with duration
 */
export interface DwellTimeEvent extends ImplicitEvent {
  eventType: 'dwell_time';
  value: number; // milliseconds
  metadata: {
    wasVisible: boolean;
    hadFocus: boolean;
  };
}

/**
 * Click event
 */
export interface ClickEvent extends ImplicitEvent {
  eventType: 'click';
  value: 1;
  metadata: {
    x: number;
    y: number;
    isDoubleClick?: boolean;
  };
}

/**
 * Hover event with duration
 */
export interface HoverEvent extends ImplicitEvent {
  eventType: 'hover';
  value: number; // milliseconds
}

/**
 * Configuration for the signal collector
 */
export interface SignalCollectorConfig {
  /** Endpoint to send events to */
  endpoint: string;
  /** Session ID (required) */
  sessionId: string;
  /** User ID (optional, for logged-in users) */
  userId?: string;
  /** Analysis ID (optional, for analysis pages) */
  analysisId?: string;
  /** Batch size before sending */
  batchSize: number;
  /** Flush interval in ms */
  flushIntervalMs: number;
  /** Enable debug logging */
  debug: boolean;
  /** Scroll depth thresholds to track (percentages) */
  scrollDepthThresholds: number[];
  /** Minimum hover duration to track (ms) */
  minHoverDurationMs: number;
  /** Dwell time checkpoint intervals (ms) */
  dwellTimeCheckpoints: number[];
  /** Sampling rate (0-1) */
  samplingRate: number;
}

/**
 * State for scroll tracking
 */
interface ScrollState {
  maxDepth: number;
  reportedThresholds: Set<number>;
}

/**
 * State for hover tracking
 */
interface HoverState {
  elementId: string | null;
  startTime: number;
}

/**
 * State for dwell time tracking
 */
interface DwellState {
  startTime: number;
  totalTime: number;
  isVisible: boolean;
  hasFocus: boolean;
  reportedCheckpoints: Set<number>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

export const DEFAULT_CONFIG: SignalCollectorConfig = {
  endpoint: '/api/feedback/implicit',
  sessionId: '',
  batchSize: 10,
  flushIntervalMs: 30000, // 30 seconds
  debug: false,
  scrollDepthThresholds: [25, 50, 75, 90, 100],
  minHoverDurationMs: 500,
  dwellTimeCheckpoints: [5000, 15000, 30000, 60000, 120000], // 5s, 15s, 30s, 1m, 2m
  samplingRate: 1.0, // Track everything by default
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `sess_${timestamp}_${randomPart}`;
}

/**
 * Get session ID from storage or generate new one
 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return generateSessionId();
  }

  const stored = sessionStorage.getItem('rlhf_session_id');
  if (stored) {
    return stored;
  }

  const newId = generateSessionId();
  sessionStorage.setItem('rlhf_session_id', newId);
  return newId;
}

/**
 * Detect page type from URL
 */
export function detectPageType(url: string): PageType {
  const path = new URL(url, 'http://localhost').pathname;

  if (path.includes('/results')) return 'results';
  if (path.includes('/analysis')) return 'analysis';
  if (path.includes('/recommendations')) return 'recommendations';
  if (path.includes('/dashboard')) return 'dashboard';
  if (path.includes('/settings')) return 'settings';
  return 'other';
}

/**
 * Get current viewport dimensions
 */
export function getViewportDimensions(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth || document.documentElement.clientWidth,
    height: window.innerHeight || document.documentElement.clientHeight,
  };
}

/**
 * Calculate scroll depth percentage
 */
export function calculateScrollDepth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 0;
  }

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const documentHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;
  const scrollableHeight = documentHeight - viewportHeight;

  if (scrollableHeight <= 0) return 100;

  return Math.min(100, Math.round((scrollTop / scrollableHeight) * 100));
}

/**
 * Get element identifier for tracking
 */
export function getElementIdentifier(element: HTMLElement): {
  id: string | null;
  type: string;
  label: string | null;
} {
  const id = element.id || element.getAttribute('data-testid') || null;
  const type = element.tagName.toLowerCase();
  const label =
    element.getAttribute('aria-label') ||
    element.getAttribute('title') ||
    (element.textContent?.slice(0, 50).trim() || null);

  return { id, type, label };
}

/**
 * Check if we should track based on sampling rate
 */
export function shouldSample(rate: number): boolean {
  return Math.random() < rate;
}

// ============================================================================
// SIGNAL COLLECTOR CLASS
// ============================================================================

/**
 * Main class for collecting implicit signals
 */
export class ImplicitSignalCollector {
  private config: SignalCollectorConfig;
  private eventQueue: ImplicitEvent[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private scrollState: ScrollState;
  private hoverState: HoverState;
  private dwellState: DwellState;
  private isInitialized = false;
  private boundHandlers: {
    scroll?: () => void;
    visibilityChange?: () => void;
    focus?: () => void;
    blur?: () => void;
    beforeUnload?: () => void;
    click?: (e: MouseEvent) => void;
    mouseover?: (e: MouseEvent) => void;
    mouseout?: (e: MouseEvent) => void;
    copy?: () => void;
  } = {};

  constructor(config: Partial<SignalCollectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!this.config.sessionId) {
      this.config.sessionId = getOrCreateSessionId();
    }

    this.scrollState = {
      maxDepth: 0,
      reportedThresholds: new Set(),
    };

    this.hoverState = {
      elementId: null,
      startTime: 0,
    };

    this.dwellState = {
      startTime: Date.now(),
      totalTime: 0,
      isVisible: true,
      hasFocus: true,
      reportedCheckpoints: new Set(),
    };
  }

  /**
   * Initialize the collector and start tracking
   */
  public init(): void {
    if (typeof window === 'undefined') {
      this.log('Cannot initialize: window is undefined (SSR)');
      return;
    }

    if (this.isInitialized) {
      this.log('Already initialized');
      return;
    }

    this.isInitialized = true;
    this.log('Initializing signal collector');

    // Track page view
    this.trackPageView();

    // Set up scroll tracking
    this.setupScrollTracking();

    // Set up dwell time tracking
    this.setupDwellTimeTracking();

    // Set up click tracking
    this.setupClickTracking();

    // Set up hover tracking
    this.setupHoverTracking();

    // Set up copy tracking
    this.setupCopyTracking();

    // Set up flush timer
    this.startFlushTimer();

    // Flush on page unload
    this.setupBeforeUnload();
  }

  /**
   * Clean up and destroy the collector
   */
  public destroy(): void {
    if (!this.isInitialized) return;

    this.log('Destroying signal collector');

    // Flush remaining events
    this.flush();

    // Clear timer
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Remove event listeners
    if (typeof window !== 'undefined') {
      if (this.boundHandlers.scroll) {
        window.removeEventListener('scroll', this.boundHandlers.scroll);
      }
      if (this.boundHandlers.visibilityChange) {
        document.removeEventListener('visibilitychange', this.boundHandlers.visibilityChange);
      }
      if (this.boundHandlers.focus) {
        window.removeEventListener('focus', this.boundHandlers.focus);
      }
      if (this.boundHandlers.blur) {
        window.removeEventListener('blur', this.boundHandlers.blur);
      }
      if (this.boundHandlers.beforeUnload) {
        window.removeEventListener('beforeunload', this.boundHandlers.beforeUnload);
      }
      if (this.boundHandlers.click) {
        document.removeEventListener('click', this.boundHandlers.click);
      }
      if (this.boundHandlers.mouseover) {
        document.removeEventListener('mouseover', this.boundHandlers.mouseover);
      }
      if (this.boundHandlers.mouseout) {
        document.removeEventListener('mouseout', this.boundHandlers.mouseout);
      }
      if (this.boundHandlers.copy) {
        document.removeEventListener('copy', this.boundHandlers.copy);
      }
    }

    this.isInitialized = false;
  }

  /**
   * Update configuration
   */
  public updateConfig(updates: Partial<SignalCollectorConfig>): void {
    this.config = { ...this.config, ...updates };
    this.log('Config updated', updates);
  }

  /**
   * Set the current analysis ID
   */
  public setAnalysisId(analysisId: string | undefined): void {
    this.config.analysisId = analysisId;
  }

  /**
   * Set the current user ID
   */
  public setUserId(userId: string | undefined): void {
    this.config.userId = userId;
  }

  /**
   * Track a custom event
   */
  public trackEvent(
    eventType: ImplicitEventType,
    options: {
      elementId?: string;
      elementType?: string;
      elementLabel?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    } = {}
  ): void {
    if (!shouldSample(this.config.samplingRate)) {
      return;
    }

    const viewport = getViewportDimensions();

    const event: ImplicitEvent = {
      eventType,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      analysisId: this.config.analysisId,
      timestamp: Date.now(),
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
      pageType: typeof window !== 'undefined' ? detectPageType(window.location.href) : 'other',
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      ...options,
    };

    this.queueEvent(event);
  }

  /**
   * Manually track an expand action
   */
  public trackExpand(elementId: string, elementLabel?: string): void {
    this.trackEvent('expand', {
      elementId,
      elementLabel,
      value: 1,
    });
  }

  /**
   * Manually track a collapse action
   */
  public trackCollapse(elementId: string, elementLabel?: string): void {
    this.trackEvent('collapse', {
      elementId,
      elementLabel,
      value: 1,
    });
  }

  /**
   * Manually track a share action
   */
  public trackShare(elementId: string, shareMethod?: string): void {
    this.trackEvent('share', {
      elementId,
      value: 1,
      metadata: { shareMethod },
    });
  }

  /**
   * Manually track a search action
   */
  public trackSearch(query: string, resultCount?: number): void {
    this.trackEvent('search', {
      value: resultCount,
      metadata: {
        queryLength: query.length,
        hasResults: resultCount !== undefined && resultCount > 0,
      },
    });
  }

  /**
   * Manually track a filter action
   */
  public trackFilter(filterName: string, filterValue: unknown): void {
    this.trackEvent('filter', {
      elementId: filterName,
      value: 1,
      metadata: { filterValue },
    });
  }

  /**
   * Get current session ID
   */
  public getSessionId(): string {
    return this.config.sessionId;
  }

  /**
   * Get queued event count
   */
  public getQueuedEventCount(): number {
    return this.eventQueue.length;
  }

  /**
   * Force flush all queued events
   */
  public async flush(): Promise<boolean> {
    if (this.eventQueue.length === 0) {
      return true;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.log(`Flushing ${events.length} events`);

    try {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
        keepalive: true, // Ensure request completes even on page unload
      });

      if (!response.ok) {
        // Re-queue events on failure
        this.eventQueue = [...events, ...this.eventQueue];
        this.log('Flush failed, events re-queued');
        return false;
      }

      this.log('Flush successful');
      return true;
    } catch (error) {
      // Re-queue events on error
      this.eventQueue = [...events, ...this.eventQueue];
      this.log('Flush error, events re-queued', error);
      return false;
    }
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private log(message: string, ...args: unknown[]): void {
    if (this.config.debug) {
      console.log(`[ImplicitSignals] ${message}`, ...args);
    }
  }

  private queueEvent(event: ImplicitEvent): void {
    this.eventQueue.push(event);
    this.log('Event queued', event.eventType, event);

    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushIntervalMs);
  }

  private trackPageView(): void {
    this.trackEvent('page_view', { value: 1 });
  }

  private setupScrollTracking(): void {
    this.boundHandlers.scroll = () => {
      const depth = calculateScrollDepth();

      if (depth > this.scrollState.maxDepth) {
        this.scrollState.maxDepth = depth;
      }

      // Check thresholds
      for (const threshold of this.config.scrollDepthThresholds) {
        if (depth >= threshold && !this.scrollState.reportedThresholds.has(threshold)) {
          this.scrollState.reportedThresholds.add(threshold);

          const viewport = getViewportDimensions();
          const event: ScrollDepthEvent = {
            eventType: 'scroll_depth',
            sessionId: this.config.sessionId,
            userId: this.config.userId,
            analysisId: this.config.analysisId,
            timestamp: Date.now(),
            pageUrl: window.location.href,
            pageType: detectPageType(window.location.href),
            value: threshold,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
            metadata: {
              documentHeight: document.documentElement.scrollHeight,
              viewportHeight: window.innerHeight,
              scrollPosition: window.scrollY,
            },
          };

          this.queueEvent(event);
        }
      }
    };

    window.addEventListener('scroll', this.boundHandlers.scroll, { passive: true });
  }

  private setupDwellTimeTracking(): void {
    // Track visibility changes
    this.boundHandlers.visibilityChange = () => {
      if (document.hidden) {
        this.dwellState.isVisible = false;
      } else {
        this.dwellState.isVisible = true;
      }
      this.updateDwellTime();
    };

    this.boundHandlers.focus = () => {
      this.dwellState.hasFocus = true;
      this.updateDwellTime();
    };

    this.boundHandlers.blur = () => {
      this.dwellState.hasFocus = false;
      this.updateDwellTime();
    };

    document.addEventListener('visibilitychange', this.boundHandlers.visibilityChange);
    window.addEventListener('focus', this.boundHandlers.focus);
    window.addEventListener('blur', this.boundHandlers.blur);

    // Check dwell time periodically
    setInterval(() => {
      this.checkDwellTimeCheckpoints();
    }, 1000);
  }

  private updateDwellTime(): void {
    const now = Date.now();
    const elapsed = now - this.dwellState.startTime;

    if (this.dwellState.isVisible && this.dwellState.hasFocus) {
      this.dwellState.totalTime += elapsed;
    }

    this.dwellState.startTime = now;
  }

  private checkDwellTimeCheckpoints(): void {
    this.updateDwellTime();

    for (const checkpoint of this.config.dwellTimeCheckpoints) {
      if (
        this.dwellState.totalTime >= checkpoint &&
        !this.dwellState.reportedCheckpoints.has(checkpoint)
      ) {
        this.dwellState.reportedCheckpoints.add(checkpoint);

        const viewport = getViewportDimensions();
        const event: DwellTimeEvent = {
          eventType: 'dwell_time',
          sessionId: this.config.sessionId,
          userId: this.config.userId,
          analysisId: this.config.analysisId,
          timestamp: Date.now(),
          pageUrl: window.location.href,
          pageType: detectPageType(window.location.href),
          value: checkpoint,
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          metadata: {
            wasVisible: this.dwellState.isVisible,
            hadFocus: this.dwellState.hasFocus,
          },
        };

        this.queueEvent(event);
      }
    }
  }

  private setupClickTracking(): void {
    this.boundHandlers.click = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const { id, type, label } = getElementIdentifier(target);

      // Only track meaningful clicks (buttons, links, interactive elements)
      const isInteractive =
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.closest('button') ||
        target.closest('a') ||
        target.getAttribute('role') === 'button' ||
        target.hasAttribute('onclick') ||
        target.hasAttribute('data-track-click');

      if (!isInteractive) return;

      const viewport = getViewportDimensions();
      const event: ClickEvent = {
        eventType: 'click',
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        analysisId: this.config.analysisId,
        timestamp: Date.now(),
        pageUrl: window.location.href,
        pageType: detectPageType(window.location.href),
        elementId: id || undefined,
        elementType: type,
        elementLabel: label || undefined,
        value: 1,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        metadata: {
          x: e.clientX,
          y: e.clientY,
          isDoubleClick: e.detail === 2,
        },
      };

      this.queueEvent(event);
    };

    document.addEventListener('click', this.boundHandlers.click);
  }

  private setupHoverTracking(): void {
    this.boundHandlers.mouseover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Only track hovers on meaningful elements
      const isTrackable =
        target.hasAttribute('data-track-hover') ||
        target.closest('[data-track-hover]') ||
        target.tagName === 'BUTTON' ||
        target.closest('.score-card') ||
        target.closest('.recommendation-card');

      if (!isTrackable) return;

      const { id } = getElementIdentifier(target);
      if (!id) return;

      this.hoverState = {
        elementId: id,
        startTime: Date.now(),
      };
    };

    this.boundHandlers.mouseout = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const { id } = getElementIdentifier(target);
      if (id && id === this.hoverState.elementId) {
        const duration = Date.now() - this.hoverState.startTime;

        if (duration >= this.config.minHoverDurationMs) {
          const viewport = getViewportDimensions();
          const event: HoverEvent = {
            eventType: 'hover',
            sessionId: this.config.sessionId,
            userId: this.config.userId,
            analysisId: this.config.analysisId,
            timestamp: Date.now(),
            pageUrl: window.location.href,
            pageType: detectPageType(window.location.href),
            elementId: id,
            value: duration,
            viewportWidth: viewport.width,
            viewportHeight: viewport.height,
          };

          this.queueEvent(event);
        }

        this.hoverState = { elementId: null, startTime: 0 };
      }
    };

    document.addEventListener('mouseover', this.boundHandlers.mouseover);
    document.addEventListener('mouseout', this.boundHandlers.mouseout);
  }

  private setupCopyTracking(): void {
    this.boundHandlers.copy = () => {
      const selection = window.getSelection();
      const text = selection?.toString() || '';

      if (text.length > 0) {
        this.trackEvent('copy', {
          value: text.length,
          metadata: {
            textLength: text.length,
            hasAnalysisContent: !!this.config.analysisId,
          },
        });
      }
    };

    document.addEventListener('copy', this.boundHandlers.copy);
  }

  private setupBeforeUnload(): void {
    this.boundHandlers.beforeUnload = () => {
      // Track final dwell time
      this.updateDwellTime();

      const viewport = getViewportDimensions();
      const event: DwellTimeEvent = {
        eventType: 'dwell_time',
        sessionId: this.config.sessionId,
        userId: this.config.userId,
        analysisId: this.config.analysisId,
        timestamp: Date.now(),
        pageUrl: window.location.href,
        pageType: detectPageType(window.location.href),
        value: this.dwellState.totalTime,
        viewportWidth: viewport.width,
        viewportHeight: viewport.height,
        metadata: {
          wasVisible: this.dwellState.isVisible,
          hadFocus: this.dwellState.hasFocus,
        },
      };

      this.queueEvent(event);
      this.flush();
    };

    window.addEventListener('beforeunload', this.boundHandlers.beforeUnload);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let collectorInstance: ImplicitSignalCollector | null = null;

/**
 * Get or create the global signal collector instance
 */
export function getSignalCollector(config?: Partial<SignalCollectorConfig>): ImplicitSignalCollector {
  if (!collectorInstance) {
    collectorInstance = new ImplicitSignalCollector(config);
  } else if (config) {
    collectorInstance.updateConfig(config);
  }
  return collectorInstance;
}

/**
 * Initialize the global signal collector
 */
export function initSignalCollector(config?: Partial<SignalCollectorConfig>): ImplicitSignalCollector {
  const collector = getSignalCollector(config);
  collector.init();
  return collector;
}

/**
 * Destroy the global signal collector
 */
export function destroySignalCollector(): void {
  if (collectorInstance) {
    collectorInstance.destroy();
    collectorInstance = null;
  }
}

// ============================================================================
// REACT HOOK (for Next.js)
// ============================================================================

/**
 * React hook for using the signal collector
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const collector = useSignalCollector({ analysisId: '123' });
 *
 *   const handleExpand = () => {
 *     collector?.trackExpand('section-1', 'Technical Analysis');
 *   };
 * }
 * ```
 */
export function useSignalCollector(options?: {
  analysisId?: string;
  userId?: string;
  debug?: boolean;
}): ImplicitSignalCollector | null {
  // This will be implemented in a separate hook file for React
  // to avoid importing React in this core module
  if (typeof window === 'undefined') {
    return null;
  }

  const collector = getSignalCollector({
    analysisId: options?.analysisId,
    userId: options?.userId,
    debug: options?.debug,
  });

  if (options?.analysisId) {
    collector.setAnalysisId(options.analysisId);
  }

  if (options?.userId) {
    collector.setUserId(options.userId);
  }

  return collector;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ImplicitSignalCollector;
