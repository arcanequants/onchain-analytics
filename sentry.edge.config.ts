import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bc6e1a96e8cef9873aa7ab8f4196a26e@o4510379533860864.ingest.us.sentry.io/4510379538710528",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  tracesSampleRate: 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Edge-specific configuration (for middleware, edge functions)
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Ignore network errors
        if (message.includes('fetch failed') ||
            message.includes('Network request failed')) {
          return null;
        }
      }
    }

    return event;
  },
});
