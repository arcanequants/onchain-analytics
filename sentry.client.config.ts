import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bc6e1a96e8cef9873aa7ab8f4196a26e@o4510379533860864.ingest.us.sentry.io/4510379538710528",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

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
