import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client Configuration
 *
 * SRE AUDIT FIX: SRE-006, SRE-007
 * - Moved DSN to environment variable
 * - Reduced tracesSampleRate from 100% to 10% for production
 */

Sentry.init({
  // SRE-006: DSN from environment variable
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // SRE-007: Sample 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture Replay for 10% of all sessions,
  // plus 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Performance Monitoring
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;

      // Ignore specific errors
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Ignore network errors from RPC providers (they have fallbacks)
        if (message.includes('fetch failed') ||
            message.includes('Network request failed') ||
            message.includes('timeout')) {
          return null;
        }
      }
    }

    return event;
  },
});
