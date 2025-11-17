import * as Sentry from '@sentry/nextjs';

/**
 * Capture an error in Sentry with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) {
  Sentry.captureException(error, {
    level: context?.level || 'error',
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Capture a message in Sentry
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
) {
  Sentry.captureMessage(message, {
    level,
    tags: context?.tags,
    extra: context?.extra,
  });
}

/**
 * Wrap CRON job execution with Sentry monitoring
 */
export async function withSentryMonitoring<T>(
  jobName: string,
  fn: () => Promise<T>
): Promise<T> {
  return Sentry.startSpan(
    {
      name: `cron.${jobName}`,
      op: 'cron.job',
    },
    async () => {
      try {
        const result = await fn();

        // Log success
        Sentry.addBreadcrumb({
          category: 'cron',
          message: `CRON job ${jobName} completed successfully`,
          level: 'info',
        });

        return result;
      } catch (error) {
        // Capture error with context
        Sentry.captureException(error, {
          tags: {
            job_name: jobName,
            job_type: 'cron',
          },
          level: 'error',
        });

        throw error;
      }
    }
  );
}

/**
 * Set user context for Sentry
 */
export function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}
