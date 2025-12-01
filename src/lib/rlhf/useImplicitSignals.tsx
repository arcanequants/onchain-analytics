/**
 * React Hook for Implicit Signal Collection
 *
 * Provides a React-friendly interface for tracking user behavior signals.
 * Handles initialization, cleanup, and context updates automatically.
 *
 * @module lib/rlhf/useImplicitSignals
 * @version 1.0.0
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  ImplicitSignalCollector,
  getSignalCollector,
  initSignalCollector,
  destroySignalCollector,
  type SignalCollectorConfig,
  type ImplicitEventType,
} from './implicit-signals';

// ============================================================================
// TYPES
// ============================================================================

export interface UseImplicitSignalsOptions {
  /** Analysis ID for the current page */
  analysisId?: string;
  /** User ID (if logged in) */
  userId?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Auto-initialize on mount */
  autoInit?: boolean;
  /** Custom configuration overrides */
  config?: Partial<SignalCollectorConfig>;
}

export interface UseImplicitSignalsReturn {
  /** The collector instance */
  collector: ImplicitSignalCollector | null;
  /** Session ID */
  sessionId: string | null;
  /** Track a custom event */
  trackEvent: (
    eventType: ImplicitEventType,
    options?: {
      elementId?: string;
      elementType?: string;
      elementLabel?: string;
      value?: number;
      metadata?: Record<string, unknown>;
    }
  ) => void;
  /** Track an expand action */
  trackExpand: (elementId: string, elementLabel?: string) => void;
  /** Track a collapse action */
  trackCollapse: (elementId: string, elementLabel?: string) => void;
  /** Track a share action */
  trackShare: (elementId: string, shareMethod?: string) => void;
  /** Track a search action */
  trackSearch: (query: string, resultCount?: number) => void;
  /** Track a filter action */
  trackFilter: (filterName: string, filterValue: unknown) => void;
  /** Track tab switch */
  trackTabSwitch: (tabId: string, tabLabel?: string) => void;
  /** Manually flush events */
  flush: () => Promise<boolean>;
  /** Get queued event count */
  queuedCount: number;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * React hook for implicit signal collection
 *
 * @example
 * ```tsx
 * function AnalysisPage({ analysisId }: { analysisId: string }) {
 *   const { trackExpand, trackShare } = useImplicitSignals({
 *     analysisId,
 *     userId: user?.id,
 *   });
 *
 *   return (
 *     <div>
 *       <Accordion onExpand={() => trackExpand('section-1', 'Details')}>
 *         ...
 *       </Accordion>
 *       <ShareButton onClick={() => trackShare('share-btn', 'twitter')} />
 *     </div>
 *   );
 * }
 * ```
 */
export function useImplicitSignals(
  options: UseImplicitSignalsOptions = {}
): UseImplicitSignalsReturn {
  const { analysisId, userId, debug = false, autoInit = true, config = {} } = options;

  const collectorRef = useRef<ImplicitSignalCollector | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize collector on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (autoInit && !isInitializedRef.current) {
      collectorRef.current = initSignalCollector({
        debug,
        analysisId,
        userId,
        ...config,
      });
      isInitializedRef.current = true;
    } else {
      collectorRef.current = getSignalCollector({
        debug,
        analysisId,
        userId,
        ...config,
      });
    }

    // Cleanup on unmount (only if this component initialized it)
    return () => {
      // Don't destroy on unmount - the collector is a singleton
      // and may be used by other components
    };
  }, [autoInit, debug]); // Only re-run if these change

  // Update analysis ID when it changes
  useEffect(() => {
    if (collectorRef.current && analysisId !== undefined) {
      collectorRef.current.setAnalysisId(analysisId);
    }
  }, [analysisId]);

  // Update user ID when it changes
  useEffect(() => {
    if (collectorRef.current && userId !== undefined) {
      collectorRef.current.setUserId(userId);
    }
  }, [userId]);

  // Track event wrapper
  const trackEvent = useCallback(
    (
      eventType: ImplicitEventType,
      eventOptions?: {
        elementId?: string;
        elementType?: string;
        elementLabel?: string;
        value?: number;
        metadata?: Record<string, unknown>;
      }
    ) => {
      collectorRef.current?.trackEvent(eventType, eventOptions);
    },
    []
  );

  // Track expand action
  const trackExpand = useCallback((elementId: string, elementLabel?: string) => {
    collectorRef.current?.trackExpand(elementId, elementLabel);
  }, []);

  // Track collapse action
  const trackCollapse = useCallback((elementId: string, elementLabel?: string) => {
    collectorRef.current?.trackCollapse(elementId, elementLabel);
  }, []);

  // Track share action
  const trackShare = useCallback((elementId: string, shareMethod?: string) => {
    collectorRef.current?.trackShare(elementId, shareMethod);
  }, []);

  // Track search action
  const trackSearch = useCallback((query: string, resultCount?: number) => {
    collectorRef.current?.trackSearch(query, resultCount);
  }, []);

  // Track filter action
  const trackFilter = useCallback((filterName: string, filterValue: unknown) => {
    collectorRef.current?.trackFilter(filterName, filterValue);
  }, []);

  // Track tab switch
  const trackTabSwitch = useCallback((tabId: string, tabLabel?: string) => {
    collectorRef.current?.trackEvent('tab_switch', {
      elementId: tabId,
      elementLabel: tabLabel,
      value: 1,
    });
  }, []);

  // Flush events
  const flush = useCallback(async (): Promise<boolean> => {
    if (collectorRef.current) {
      return collectorRef.current.flush();
    }
    return true;
  }, []);

  return {
    collector: collectorRef.current,
    sessionId: collectorRef.current?.getSessionId() || null,
    trackEvent,
    trackExpand,
    trackCollapse,
    trackShare,
    trackSearch,
    trackFilter,
    trackTabSwitch,
    flush,
    queuedCount: collectorRef.current?.getQueuedEventCount() || 0,
  };
}

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

import { createContext, useContext, type ReactNode } from 'react';

interface ImplicitSignalsContextValue extends UseImplicitSignalsReturn {}

const ImplicitSignalsContext = createContext<ImplicitSignalsContextValue | null>(null);

export interface ImplicitSignalsProviderProps {
  children: ReactNode;
  /** User ID (if logged in) */
  userId?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom configuration */
  config?: Partial<SignalCollectorConfig>;
}

/**
 * Provider component for implicit signal collection
 *
 * @example
 * ```tsx
 * // In _app.tsx or layout.tsx
 * function App({ children }) {
 *   const { user } = useAuth();
 *
 *   return (
 *     <ImplicitSignalsProvider userId={user?.id} debug={isDev}>
 *       {children}
 *     </ImplicitSignalsProvider>
 *   );
 * }
 * ```
 */
export function ImplicitSignalsProvider({
  children,
  userId,
  debug,
  config,
}: ImplicitSignalsProviderProps) {
  const signals = useImplicitSignals({
    userId,
    debug,
    config,
    autoInit: true,
  });

  return (
    <ImplicitSignalsContext.Provider value={signals}>
      {children}
    </ImplicitSignalsContext.Provider>
  );
}

/**
 * Hook to access the implicit signals context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { trackExpand } = useImplicitSignalsContext();
 *   // ...
 * }
 * ```
 */
export function useImplicitSignalsContext(): ImplicitSignalsContextValue {
  const context = useContext(ImplicitSignalsContext);
  if (!context) {
    throw new Error(
      'useImplicitSignalsContext must be used within an ImplicitSignalsProvider'
    );
  }
  return context;
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to track scroll depth on a specific container
 *
 * @example
 * ```tsx
 * function ScrollableContent() {
 *   const containerRef = useScrollDepthTracker('content-section');
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function useScrollDepthTracker(elementId: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const maxDepthRef = useRef(0);
  const { trackEvent } = useImplicitSignals();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight;
      const clientHeight = container.clientHeight;
      const scrollableHeight = scrollHeight - clientHeight;

      if (scrollableHeight <= 0) return;

      const depth = Math.min(100, Math.round((scrollTop / scrollableHeight) * 100));

      if (depth > maxDepthRef.current) {
        maxDepthRef.current = depth;

        // Track at thresholds
        const thresholds = [25, 50, 75, 100];
        for (const threshold of thresholds) {
          if (depth >= threshold && maxDepthRef.current < threshold + 5) {
            trackEvent('scroll_depth', {
              elementId,
              value: threshold,
              metadata: { containerScroll: true },
            });
            break;
          }
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [elementId, trackEvent]);

  return containerRef;
}

/**
 * Hook to track dwell time on a specific element
 *
 * @example
 * ```tsx
 * function ImportantSection() {
 *   const { ref, dwellTime } = useElementDwellTime('important-section');
 *   return <div ref={ref}>Dwell time: {dwellTime}ms</div>;
 * }
 * ```
 */
export function useElementDwellTime(elementId: string) {
  const ref = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const totalTimeRef = useRef(0);
  const { trackEvent } = useImplicitSignals();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Element entered viewport
            startTimeRef.current = Date.now();
          } else if (startTimeRef.current) {
            // Element left viewport
            const elapsed = Date.now() - startTimeRef.current;
            totalTimeRef.current += elapsed;
            startTimeRef.current = null;

            // Track if significant dwell time
            if (elapsed > 1000) {
              trackEvent('dwell_time', {
                elementId,
                value: elapsed,
                metadata: { elementLevel: true },
              });
            }
          }
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [elementId, trackEvent]);

  return {
    ref,
    dwellTime: totalTimeRef.current,
  };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default useImplicitSignals;
