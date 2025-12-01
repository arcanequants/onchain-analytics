/**
 * Tests for RLHF Implicit Signal Collector
 *
 * @module lib/rlhf/implicit-signals.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateSessionId,
  getOrCreateSessionId,
  detectPageType,
  getViewportDimensions,
  calculateScrollDepth,
  getElementIdentifier,
  shouldSample,
  ImplicitSignalCollector,
  DEFAULT_CONFIG,
} from './implicit-signals';

// ============================================================================
// MOCKS
// ============================================================================

// Mock sessionStorage
const mockSessionStorage: Record<string, string> = {};
const sessionStorageMock = {
  getItem: vi.fn((key: string) => mockSessionStorage[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    mockSessionStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockSessionStorage[key];
  }),
  clear: vi.fn(() => {
    Object.keys(mockSessionStorage).forEach((key) => delete mockSessionStorage[key]);
  }),
};

// Mock fetch
const fetchMock = vi.fn();

// ============================================================================
// SETUP
// ============================================================================

describe('Implicit Signals Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageMock.clear();

    // Setup window mocks
    Object.defineProperty(global, 'window', {
      value: {
        location: { href: 'http://localhost/analysis/123' },
        innerWidth: 1920,
        innerHeight: 1080,
        scrollY: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getSelection: vi.fn(() => ({ toString: () => '' })),
      },
      writable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        documentElement: {
          scrollTop: 0,
          scrollHeight: 2000,
          clientWidth: 1920,
          clientHeight: 1080,
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        hidden: false,
      },
      writable: true,
    });

    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });

    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // UTILITY FUNCTION TESTS
  // ============================================================================

  describe('generateSessionId', () => {
    it('should generate a unique session ID', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();

      expect(id1).toMatch(/^sess_[a-z0-9]+_[a-z0-9]+$/);
      expect(id2).toMatch(/^sess_[a-z0-9]+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format', () => {
      const id = generateSessionId();
      const parts = id.split('_');

      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('sess');
      expect(parts[1].length).toBeGreaterThan(0);
      expect(parts[2].length).toBeGreaterThan(0);
    });
  });

  describe('getOrCreateSessionId', () => {
    it('should return stored session ID if exists', () => {
      const storedId = 'sess_existing_123';
      sessionStorageMock.getItem.mockReturnValue(storedId);

      const id = getOrCreateSessionId();

      expect(id).toBe(storedId);
    });

    it('should create and store new ID if none exists', () => {
      sessionStorageMock.getItem.mockReturnValue(null);

      const id = getOrCreateSessionId();

      expect(id).toMatch(/^sess_/);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('rlhf_session_id', id);
    });
  });

  describe('detectPageType', () => {
    it('should detect results page', () => {
      expect(detectPageType('http://example.com/results')).toBe('results');
      expect(detectPageType('http://example.com/results/123')).toBe('results');
    });

    it('should detect analysis page', () => {
      expect(detectPageType('http://example.com/analysis')).toBe('analysis');
      expect(detectPageType('http://example.com/analysis/abc')).toBe('analysis');
    });

    it('should detect recommendations page', () => {
      expect(detectPageType('http://example.com/recommendations')).toBe('recommendations');
    });

    it('should detect dashboard page', () => {
      expect(detectPageType('http://example.com/dashboard')).toBe('dashboard');
    });

    it('should detect settings page', () => {
      expect(detectPageType('http://example.com/settings')).toBe('settings');
      expect(detectPageType('http://example.com/settings/profile')).toBe('settings');
    });

    it('should return other for unknown pages', () => {
      expect(detectPageType('http://example.com/')).toBe('other');
      expect(detectPageType('http://example.com/about')).toBe('other');
      expect(detectPageType('http://example.com/contact')).toBe('other');
    });
  });

  describe('getViewportDimensions', () => {
    it('should return window dimensions', () => {
      const dims = getViewportDimensions();

      expect(dims.width).toBe(1920);
      expect(dims.height).toBe(1080);
    });

    it('should return zeros in SSR environment', () => {
      // @ts-ignore - Testing SSR
      delete global.window;

      const dims = getViewportDimensions();

      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);
    });
  });

  describe('calculateScrollDepth', () => {
    it('should calculate scroll depth correctly', () => {
      // Document: 2000px, Viewport: 1080px, Scrollable: 920px
      // scrollY: 0 = 0%
      global.window.scrollY = 0;
      expect(calculateScrollDepth()).toBe(0);

      // scrollY: 460 = 50%
      global.window.scrollY = 460;
      expect(calculateScrollDepth()).toBe(50);

      // scrollY: 920 = 100%
      global.window.scrollY = 920;
      expect(calculateScrollDepth()).toBe(100);
    });

    it('should return 100 for non-scrollable pages', () => {
      // Recreate document mock with smaller scrollHeight
      Object.defineProperty(global, 'document', {
        value: {
          documentElement: {
            scrollTop: 0,
            scrollHeight: 500, // Less than viewport
            clientWidth: 1920,
            clientHeight: 1080,
          },
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          hidden: false,
        },
        writable: true,
      });
      global.window.innerHeight = 1080;

      expect(calculateScrollDepth()).toBe(100);
    });

    it('should cap at 100%', () => {
      global.window.scrollY = 2000; // More than scrollable height
      expect(calculateScrollDepth()).toBeLessThanOrEqual(100);
    });
  });

  describe('getElementIdentifier', () => {
    it('should extract element ID', () => {
      const element = {
        id: 'test-element',
        tagName: 'BUTTON',
        getAttribute: vi.fn((attr) => {
          if (attr === 'data-testid') return null;
          if (attr === 'aria-label') return 'Click me';
          return null;
        }),
        textContent: 'Click me',
      } as unknown as HTMLElement;

      const result = getElementIdentifier(element);

      expect(result.id).toBe('test-element');
      expect(result.type).toBe('button');
      expect(result.label).toBe('Click me');
    });

    it('should fall back to data-testid', () => {
      const element = {
        id: '',
        tagName: 'DIV',
        getAttribute: vi.fn((attr) => {
          if (attr === 'data-testid') return 'test-div';
          return null;
        }),
        textContent: '',
      } as unknown as HTMLElement;

      const result = getElementIdentifier(element);

      expect(result.id).toBe('test-div');
    });

    it('should truncate long text content', () => {
      const longText = 'A'.repeat(100);
      const element = {
        id: 'elem',
        tagName: 'P',
        getAttribute: vi.fn(() => null),
        textContent: longText,
      } as unknown as HTMLElement;

      const result = getElementIdentifier(element);

      expect(result.label?.length).toBeLessThanOrEqual(50);
    });
  });

  describe('shouldSample', () => {
    it('should always sample when rate is 1', () => {
      // Run multiple times to ensure consistency
      for (let i = 0; i < 100; i++) {
        expect(shouldSample(1)).toBe(true);
      }
    });

    it('should never sample when rate is 0', () => {
      for (let i = 0; i < 100; i++) {
        expect(shouldSample(0)).toBe(false);
      }
    });

    it('should sample approximately at given rate', () => {
      const rate = 0.5;
      let sampled = 0;
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        if (shouldSample(rate)) sampled++;
      }

      // Allow 10% variance
      expect(sampled).toBeGreaterThan(iterations * 0.4);
      expect(sampled).toBeLessThan(iterations * 0.6);
    });
  });

  // ============================================================================
  // DEFAULT CONFIG TESTS
  // ============================================================================

  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.endpoint).toBe('/api/feedback/implicit');
      expect(DEFAULT_CONFIG.batchSize).toBe(10);
      expect(DEFAULT_CONFIG.flushIntervalMs).toBe(30000);
      expect(DEFAULT_CONFIG.debug).toBe(false);
      expect(DEFAULT_CONFIG.scrollDepthThresholds).toEqual([25, 50, 75, 90, 100]);
      expect(DEFAULT_CONFIG.minHoverDurationMs).toBe(500);
      expect(DEFAULT_CONFIG.dwellTimeCheckpoints).toEqual([5000, 15000, 30000, 60000, 120000]);
      expect(DEFAULT_CONFIG.samplingRate).toBe(1.0);
    });
  });

  // ============================================================================
  // COLLECTOR CLASS TESTS
  // ============================================================================

  describe('ImplicitSignalCollector', () => {
    let collector: ImplicitSignalCollector;

    beforeEach(() => {
      collector = new ImplicitSignalCollector({
        sessionId: 'test-session',
        debug: false,
        batchSize: 5,
        flushIntervalMs: 60000,
      });
    });

    afterEach(() => {
      collector.destroy();
    });

    describe('constructor', () => {
      it('should accept custom configuration', () => {
        const customCollector = new ImplicitSignalCollector({
          sessionId: 'custom-session',
          userId: 'user-123',
          analysisId: 'analysis-456',
        });

        expect(customCollector.getSessionId()).toBe('custom-session');
        customCollector.destroy();
      });

      it('should generate session ID if not provided', () => {
        sessionStorageMock.getItem.mockReturnValue(null);

        const autoCollector = new ImplicitSignalCollector();
        expect(autoCollector.getSessionId()).toMatch(/^sess_/);
        autoCollector.destroy();
      });
    });

    describe('getSessionId', () => {
      it('should return the session ID', () => {
        expect(collector.getSessionId()).toBe('test-session');
      });
    });

    describe('getQueuedEventCount', () => {
      it('should return 0 initially', () => {
        expect(collector.getQueuedEventCount()).toBe(0);
      });

      it('should increment when events are tracked', () => {
        collector.trackEvent('click', { elementId: 'btn-1' });
        expect(collector.getQueuedEventCount()).toBe(1);

        collector.trackEvent('click', { elementId: 'btn-2' });
        expect(collector.getQueuedEventCount()).toBe(2);
      });
    });

    describe('trackEvent', () => {
      it('should queue events', () => {
        collector.trackEvent('click', {
          elementId: 'test-btn',
          value: 1,
        });

        expect(collector.getQueuedEventCount()).toBe(1);
      });

      it('should include timestamp and page info', () => {
        collector.trackEvent('page_view');
        // Event is queued, verified by count
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('trackExpand', () => {
      it('should track expand events', () => {
        collector.trackExpand('section-1', 'Details Section');
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('trackCollapse', () => {
      it('should track collapse events', () => {
        collector.trackCollapse('section-1', 'Details Section');
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('trackShare', () => {
      it('should track share events', () => {
        collector.trackShare('share-btn', 'twitter');
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('trackSearch', () => {
      it('should track search events', () => {
        collector.trackSearch('test query', 10);
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('trackFilter', () => {
      it('should track filter events', () => {
        collector.trackFilter('category', 'technology');
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('setAnalysisId', () => {
      it('should update analysis ID', () => {
        collector.setAnalysisId('new-analysis');
        collector.trackEvent('click');
        // Verify event was queued (actual analysis ID verification would need internal access)
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('setUserId', () => {
      it('should update user ID', () => {
        collector.setUserId('new-user');
        collector.trackEvent('click');
        expect(collector.getQueuedEventCount()).toBe(1);
      });
    });

    describe('updateConfig', () => {
      it('should update configuration', () => {
        collector.updateConfig({ debug: true });
        // Config updated - no direct way to verify, but should not throw
      });
    });

    describe('flush', () => {
      it('should send queued events', async () => {
        fetchMock.mockResolvedValueOnce({ ok: true });

        collector.trackEvent('click', { elementId: 'btn-1' });
        collector.trackEvent('click', { elementId: 'btn-2' });

        const result = await collector.flush();

        expect(result).toBe(true);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(
          '/api/feedback/implicit',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            keepalive: true,
          })
        );
        expect(collector.getQueuedEventCount()).toBe(0);
      });

      it('should re-queue events on failure', async () => {
        fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });

        collector.trackEvent('click');

        const result = await collector.flush();

        expect(result).toBe(false);
        expect(collector.getQueuedEventCount()).toBe(1); // Re-queued
      });

      it('should re-queue events on network error', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));

        collector.trackEvent('click');

        const result = await collector.flush();

        expect(result).toBe(false);
        expect(collector.getQueuedEventCount()).toBe(1); // Re-queued
      });

      it('should return true when queue is empty', async () => {
        const result = await collector.flush();
        expect(result).toBe(true);
        expect(fetchMock).not.toHaveBeenCalled();
      });

      it('should auto-flush when batch size is reached', () => {
        fetchMock.mockResolvedValue({ ok: true });

        // Batch size is 5
        for (let i = 0; i < 5; i++) {
          collector.trackEvent('click', { elementId: `btn-${i}` });
        }

        // Should have auto-flushed
        expect(fetchMock).toHaveBeenCalled();
      });
    });

    describe('init and destroy', () => {
      it('should not initialize twice', () => {
        collector.init();
        collector.init(); // Should log "Already initialized" but not error
      });

      it('should clean up on destroy', () => {
        collector.init();
        collector.destroy();
        // Should not throw and should be properly destroyed
      });
    });
  });

  // ============================================================================
  // SAMPLING TESTS
  // ============================================================================

  describe('Sampling', () => {
    it('should not track events when sampling rate is 0', () => {
      const collector = new ImplicitSignalCollector({
        sessionId: 'test',
        samplingRate: 0,
      });

      for (let i = 0; i < 10; i++) {
        collector.trackEvent('click');
      }

      expect(collector.getQueuedEventCount()).toBe(0);
      collector.destroy();
    });

    it('should track all events when sampling rate is 1', () => {
      const collector = new ImplicitSignalCollector({
        sessionId: 'test',
        samplingRate: 1,
        batchSize: 100, // Prevent auto-flush
      });

      for (let i = 0; i < 10; i++) {
        collector.trackEvent('click');
      }

      expect(collector.getQueuedEventCount()).toBe(10);
      collector.destroy();
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration', () => {
  it('should work end-to-end', async () => {
    // Setup mocks
    Object.defineProperty(global, 'window', {
      value: {
        location: { href: 'http://localhost/analysis/123' },
        innerWidth: 1920,
        innerHeight: 1080,
        scrollY: 0,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getSelection: vi.fn(() => ({ toString: () => '' })),
      },
      writable: true,
    });

    Object.defineProperty(global, 'document', {
      value: {
        documentElement: {
          scrollTop: 0,
          scrollHeight: 2000,
          clientHeight: 1080,
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        hidden: false,
      },
      writable: true,
    });

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchMock;

    // Create collector
    const collector = new ImplicitSignalCollector({
      sessionId: 'integration-test',
      userId: 'user-123',
      analysisId: 'analysis-456',
      batchSize: 100,
    });

    // Track various events
    collector.trackEvent('page_view');
    collector.trackExpand('section-1', 'Details');
    collector.trackShare('share-btn', 'twitter');
    collector.trackSearch('test query', 5);
    collector.trackFilter('category', 'tech');

    expect(collector.getQueuedEventCount()).toBe(5);

    // Flush
    await collector.flush();

    expect(fetchMock).toHaveBeenCalled();
    expect(collector.getQueuedEventCount()).toBe(0);

    // Cleanup
    collector.destroy();
  });
});
