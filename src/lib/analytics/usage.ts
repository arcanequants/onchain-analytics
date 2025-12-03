/**
 * Usage Analytics Module
 *
 * Phase 2, Week 4, Day 5
 * Track user behavior, feature usage, and conversion events
 */

// ================================================================
// TYPES
// ================================================================

export type EventCategory =
  | 'analysis'
  | 'dashboard'
  | 'onboarding'
  | 'upgrade'
  | 'feature'
  | 'error'
  | 'engagement';

export type AnalysisEvent =
  | 'analysis_started'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'analysis_shared'
  | 'analysis_exported'
  | 'analysis_rerun';

export type DashboardEvent =
  | 'dashboard_viewed'
  | 'history_viewed'
  | 'chart_interacted'
  | 'filter_applied'
  | 'sort_changed';

export type OnboardingEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped';

export type UpgradeEvent =
  | 'upgrade_prompt_shown'
  | 'upgrade_prompt_clicked'
  | 'pricing_page_viewed'
  | 'plan_selected'
  | 'checkout_started'
  | 'checkout_completed'
  | 'checkout_abandoned';

export type FeatureEvent =
  | 'feature_used'
  | 'feature_locked_clicked'
  | 'feature_discovered';

export type EventName =
  | AnalysisEvent
  | DashboardEvent
  | OnboardingEvent
  | UpgradeEvent
  | FeatureEvent
  | 'page_viewed'
  | 'error_occurred'
  | 'session_started'
  | 'session_ended';

export interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  plan?: string;
  analysisCount?: number;
  accountAge?: number;
  hasUpgraded?: boolean;
  industry?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  sampleRate: number;
  excludePaths?: string[];
  providers: {
    gtag?: boolean;
    posthog?: boolean;
    mixpanel?: boolean;
    custom?: boolean;
  };
}

// ================================================================
// DEFAULT CONFIG
// ================================================================

const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
  sampleRate: 1.0,
  excludePaths: ['/api/', '/admin/'],
  providers: {
    gtag: true,
    posthog: false,
    mixpanel: false,
    custom: true,
  },
};

// ================================================================
// ANALYTICS CLASS
// ================================================================

class UsageAnalytics {
  private config: AnalyticsConfig;
  private userId: string | null = null;
  private sessionId: string;
  private userProperties: UserProperties = {};
  private eventQueue: Array<{ name: EventName; properties: EventProperties }> = [];
  private isInitialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.sessionId = this.generateSessionId();
  }

  // ================================================================
  // INITIALIZATION
  // ================================================================

  init(userId?: string, userProps?: UserProperties): void {
    if (this.isInitialized) return;

    this.userId = userId || null;
    this.userProperties = userProps || {};
    this.isInitialized = true;

    // Flush queued events
    this.flushQueue();

    // Track session start
    this.track('session_started', {
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });

    this.log('Analytics initialized', { userId, sessionId: this.sessionId });
  }

  identify(userId: string, properties?: UserProperties): void {
    this.userId = userId;
    if (properties) {
      this.userProperties = { ...this.userProperties, ...properties };
    }

    // Send to providers
    if (this.config.providers.gtag && typeof window !== 'undefined') {
      (window as any).gtag?.('set', 'user_properties', this.userProperties);
    }

    this.log('User identified', { userId, properties: this.userProperties });
  }

  // ================================================================
  // EVENT TRACKING
  // ================================================================

  track(eventName: EventName, properties: EventProperties = {}): void {
    if (!this.shouldTrack()) {
      if (!this.isInitialized) {
        // Queue event for later
        this.eventQueue.push({ name: eventName, properties });
      }
      return;
    }

    const enrichedProperties = this.enrichProperties(properties);

    // Send to providers
    this.sendToProviders(eventName, enrichedProperties);

    this.log('Event tracked', { eventName, properties: enrichedProperties });
  }

  // ================================================================
  // SPECIFIC EVENT HELPERS
  // ================================================================

  trackAnalysis(event: AnalysisEvent, properties: EventProperties = {}): void {
    this.track(event, {
      category: 'analysis',
      ...properties,
    });
  }

  trackDashboard(event: DashboardEvent, properties: EventProperties = {}): void {
    this.track(event, {
      category: 'dashboard',
      ...properties,
    });
  }

  trackOnboarding(event: OnboardingEvent, properties: EventProperties = {}): void {
    this.track(event, {
      category: 'onboarding',
      ...properties,
    });
  }

  trackUpgrade(event: UpgradeEvent, properties: EventProperties = {}): void {
    this.track(event, {
      category: 'upgrade',
      ...properties,
    });
  }

  trackFeature(featureName: string, action: 'used' | 'locked_clicked' | 'discovered'): void {
    this.track(`feature_${action}` as FeatureEvent, {
      category: 'feature',
      feature_name: featureName,
    });
  }

  trackPageView(path: string, title?: string): void {
    if (this.config.excludePaths?.some((p) => path.startsWith(p))) {
      return;
    }

    this.track('page_viewed', {
      page_path: path,
      page_title: title,
    });
  }

  trackError(error: Error, context?: EventProperties): void {
    this.track('error_occurred', {
      category: 'error',
      error_name: error.name,
      error_message: error.message,
      ...context,
    });
  }

  // ================================================================
  // CONVERSION TRACKING
  // ================================================================

  trackConversion(
    conversionType: 'signup' | 'upgrade' | 'first_analysis' | 'referral',
    value?: number,
    properties: EventProperties = {}
  ): void {
    const eventName = `conversion_${conversionType}`;

    this.track(eventName as EventName, {
      category: 'conversion',
      conversion_type: conversionType,
      conversion_value: value,
      ...properties,
    });

    // Also send to Google Ads if configured
    if (this.config.providers.gtag && typeof window !== 'undefined') {
      (window as any).gtag?.('event', 'conversion', {
        send_to: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
        value,
        currency: 'USD',
        transaction_id: this.generateTransactionId(),
      });
    }
  }

  // ================================================================
  // TIMING
  // ================================================================

  startTiming(label: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = Math.round(performance.now() - startTime);
      this.track('timing_recorded' as EventName, {
        timing_label: label,
        timing_value: duration,
      });
    };
  }

  // ================================================================
  // A/B TESTING
  // ================================================================

  getVariant(experimentId: string, variants: string[]): string {
    // Deterministic variant based on user/session ID
    const seed = this.userId || this.sessionId;
    const hash = this.simpleHash(seed + experimentId);
    const index = hash % variants.length;
    const variant = variants[index];

    this.track('experiment_viewed' as EventName, {
      experiment_id: experimentId,
      variant,
    });

    return variant;
  }

  // ================================================================
  // INTERNAL METHODS
  // ================================================================

  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    if (typeof window === 'undefined') return false;
    if (Math.random() > this.config.sampleRate) return false;
    return true;
  }

  private enrichProperties(properties: EventProperties): EventProperties {
    return {
      ...properties,
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      user_id: this.userId || undefined,
      plan: this.userProperties.plan,
      page_url: typeof window !== 'undefined' ? window.location.href : undefined,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      screen_width: typeof window !== 'undefined' ? window.innerWidth : undefined,
      screen_height: typeof window !== 'undefined' ? window.innerHeight : undefined,
    };
  }

  private sendToProviders(eventName: string, properties: EventProperties): void {
    // Google Analytics
    if (this.config.providers.gtag && typeof window !== 'undefined') {
      (window as any).gtag?.('event', eventName, properties);
    }

    // PostHog
    if (this.config.providers.posthog && typeof window !== 'undefined') {
      (window as any).posthog?.capture(eventName, properties);
    }

    // Mixpanel
    if (this.config.providers.mixpanel && typeof window !== 'undefined') {
      (window as any).mixpanel?.track(eventName, properties);
    }

    // Custom endpoint
    if (this.config.providers.custom) {
      this.sendToCustomEndpoint(eventName, properties);
    }
  }

  private async sendToCustomEndpoint(
    eventName: string,
    properties: EventProperties
  ): Promise<void> {
    try {
      // Use sendBeacon for reliability
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics',
          JSON.stringify({ event: eventName, properties })
        );
      } else {
        // Fallback to fetch
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: eventName, properties }),
          keepalive: true,
        }).catch(() => {
          // Silently fail
        });
      }
    } catch {
      // Silently fail
    }
  }

  private flushQueue(): void {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.track(event.name, event.properties);
      }
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTransactionId(): string {
    return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private log(message: string, data?: unknown): void {
    if (this.config.debug) {
      console.log(`[Analytics] ${message}`, data);
    }
  }
}

// ================================================================
// SINGLETON INSTANCE
// ================================================================

let analyticsInstance: UsageAnalytics | null = null;

export function getAnalytics(): UsageAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new UsageAnalytics();
  }
  return analyticsInstance;
}

export function initAnalytics(
  userId?: string,
  userProps?: UserProperties,
  config?: Partial<AnalyticsConfig>
): UsageAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new UsageAnalytics(config);
  }
  analyticsInstance.init(userId, userProps);
  return analyticsInstance;
}

// ================================================================
// REACT HOOK
// ================================================================

export function useAnalytics() {
  const analytics = getAnalytics();

  return {
    track: analytics.track.bind(analytics),
    trackAnalysis: analytics.trackAnalysis.bind(analytics),
    trackDashboard: analytics.trackDashboard.bind(analytics),
    trackOnboarding: analytics.trackOnboarding.bind(analytics),
    trackUpgrade: analytics.trackUpgrade.bind(analytics),
    trackFeature: analytics.trackFeature.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackConversion: analytics.trackConversion.bind(analytics),
    startTiming: analytics.startTiming.bind(analytics),
    getVariant: analytics.getVariant.bind(analytics),
    identify: analytics.identify.bind(analytics),
  };
}

// ================================================================
// EXPORTS
// ================================================================

export { UsageAnalytics };
export default getAnalytics;
