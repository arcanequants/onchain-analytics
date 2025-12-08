import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server Configuration
 *
 * SRE AUDIT FIX: SRE-006, SRE-007
 * - Moved DSN to environment variable
 * - Reduced tracesSampleRate from 100% to 10% for production
 */

Sentry.init({
  // SRE-006: DSN from environment variable
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // SRE-007: Sample 10% of transactions in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Server-specific configuration
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.exception) {
      const error = hint.originalException;

      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);

        // Ignore RPC provider fallback errors (expected behavior)
        if (message.includes('fetch failed') ||
            message.includes('Network request failed') ||
            message.includes('timeout') ||
            message.includes('ECONNREFUSED')) {
          return null;
        }

        // Ignore Supabase connection timeouts (we have retry logic)
        if (message.includes('ETIMEDOUT') && message.includes('supabase')) {
          return null;
        }
      }
    }

    return event;
  },

  // Capture errors from CRON jobs
  integrations: [
    // Add breadcrumbs for better debugging
    Sentry.httpIntegration(),
  ],
});
