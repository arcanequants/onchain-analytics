/**
 * Error Display Component
 *
 * Phase 1, Week 2, Day 4
 * Displays user-friendly error messages with recovery actions.
 * Follows UX Writing Guide principles.
 */

'use client';

import React from 'react';
import {
  toUserFriendlyError,
  shouldShowRetry,
  shouldShowSupport,
  getRetryDelay,
  type UserFriendlyError,
} from '@/lib/errors/messages';
import { isAppError, type AppError } from '@/lib/errors';

// ================================================================
// TYPES
// ================================================================

export interface ErrorDisplayProps {
  /** The error to display */
  error: Error | AppError | unknown;
  /** Optional custom title override */
  title?: string;
  /** Optional custom description override */
  description?: string;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Custom retry button text */
  retryText?: string;
  /** Whether retry is currently in progress */
  isRetrying?: boolean;
  /** Callback when dismiss is clicked */
  onDismiss?: () => void;
  /** Whether to show as inline (compact) or full-page */
  variant?: 'inline' | 'card' | 'fullpage';
  /** Additional CSS classes */
  className?: string;
}

// ================================================================
// ICON COMPONENTS
// ================================================================

function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function WarningIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function NetworkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.93 4.93a10 10 0 1 0 14.14 14.14" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ClockIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

// ================================================================
// ICON MAPPER
// ================================================================

const ICON_MAP: Record<NonNullable<UserFriendlyError['icon']>, React.ComponentType<{ className?: string }>> = {
  error: ErrorIcon,
  warning: WarningIcon,
  info: InfoIcon,
  network: NetworkIcon,
  lock: LockIcon,
  clock: ClockIcon,
};

// ================================================================
// COLOR CONFIGS
// ================================================================

const COLOR_CONFIGS: Record<NonNullable<UserFriendlyError['icon']>, {
  bg: string;
  border: string;
  icon: string;
  text: string;
}> = {
  error: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: 'text-red-500',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: 'text-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    icon: 'text-blue-500',
    text: 'text-blue-600 dark:text-blue-400',
  },
  network: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    icon: 'text-orange-500',
    text: 'text-orange-600 dark:text-orange-400',
  },
  lock: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: 'text-purple-500',
    text: 'text-purple-600 dark:text-purple-400',
  },
  clock: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: 'text-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
};

// ================================================================
// COMPONENT
// ================================================================

export function ErrorDisplay({
  error,
  title,
  description,
  onRetry,
  retryText = 'Try again',
  isRetrying = false,
  onDismiss,
  variant = 'card',
  className = '',
}: ErrorDisplayProps): React.ReactElement {
  // Get user-friendly error message
  const friendlyError = toUserFriendlyError(error);
  const displayTitle = title || friendlyError.title;
  const displayDescription = description || friendlyError.description;
  const displayAction = friendlyError.action;
  const iconType = friendlyError.icon || 'error';
  const showRetry = onRetry && (shouldShowRetry(error) || friendlyError.showRetry);
  const showSupport = shouldShowSupport(error) || friendlyError.showSupport;
  const retryDelay = getRetryDelay(error);

  const IconComponent = ICON_MAP[iconType];
  const colors = COLOR_CONFIGS[iconType];

  // Auto-retry countdown state
  const [countdown, setCountdown] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Only start countdown if retriable and we have a retry callback
    if (!showRetry || !onRetry || retryDelay < 5000) {
      setCountdown(null);
      return;
    }

    // For rate limits, show countdown
    if (isAppError(error) && error.code === 'ERR_RATE_LIMIT') {
      const seconds = Math.ceil(retryDelay / 1000);
      setCountdown(seconds);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [error, retryDelay, showRetry, onRetry]);

  // Inline variant
  if (variant === 'inline') {
    return (
      <div
        className={`flex items-center gap-2 text-sm ${colors.text} ${className}`}
        role="alert"
        data-testid="error-display-inline"
      >
        <IconComponent className="w-4 h-4 flex-shrink-0" />
        <span>{displayTitle}</span>
        {showRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying || countdown !== null}
            className="underline hover:no-underline disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : retryText}
          </button>
        )}
      </div>
    );
  }

  // Full-page variant
  if (variant === 'fullpage') {
    return (
      <div
        className={`min-h-[60vh] flex items-center justify-center p-8 ${className}`}
        role="alert"
        data-testid="error-display-fullpage"
      >
        <div className="max-w-md w-full text-center">
          <div
            className={`w-16 h-16 mx-auto mb-6 rounded-full ${colors.bg} flex items-center justify-center`}
          >
            <IconComponent className={`w-8 h-8 ${colors.icon}`} />
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
            {displayTitle}
          </h1>

          <p className="text-[var(--text-secondary)] mb-2">
            {displayDescription}
          </p>

          {displayAction && (
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              {displayAction}
            </p>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {showRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying || countdown !== null}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-all
                  ${
                    isRetrying || countdown !== null
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:opacity-90'
                  }`}
              >
                <RefreshIcon className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {countdown !== null ? `Retry in ${countdown}s` : isRetrying ? 'Retrying...' : retryText}
              </button>
            )}

            {showSupport && (
              <a
                href="mailto:support@vectorialdata.com"
                className="px-6 py-2.5 rounded-lg font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-all"
              >
                Contact Support
              </a>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div
      className={`rounded-xl border p-6 ${colors.bg} ${colors.border} ${className}`}
      role="alert"
      data-testid="error-display-card"
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colors.bg}`}
        >
          <IconComponent className={`w-5 h-5 ${colors.icon}`} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            {displayTitle}
          </h3>

          <p className="text-sm text-[var(--text-secondary)] mb-1">
            {displayDescription}
          </p>

          {displayAction && (
            <p className="text-xs text-[var(--text-tertiary)]">
              {displayAction}
            </p>
          )}

          <div className="flex items-center gap-3 mt-4">
            {showRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying || countdown !== null}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                  ${
                    isRetrying || countdown !== null
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-[var(--accent)] text-white hover:opacity-90'
                  }`}
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                {countdown !== null ? `${countdown}s` : isRetrying ? 'Retrying...' : retryText}
              </button>
            )}

            {showSupport && (
              <a
                href="mailto:support@vectorialdata.com"
                className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline"
              >
                Get help
              </a>
            )}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] p-1 -m-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// PARTIAL ERROR (for when some providers failed)
// ================================================================

export interface PartialErrorProps {
  /** Which providers failed */
  failedProviders: Array<{
    provider: 'openai' | 'anthropic' | 'google' | 'perplexity';
    error?: string;
  }>;
  /** Which providers succeeded */
  successfulProviders: Array<'openai' | 'anthropic' | 'google' | 'perplexity'>;
  /** Whether to show compact version */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function PartialError({
  failedProviders,
  successfulProviders,
  compact = false,
  className = '',
}: PartialErrorProps): React.ReactElement | null {
  if (failedProviders.length === 0) return null;

  const providerNames: Record<string, string> = {
    openai: 'ChatGPT',
    anthropic: 'Claude',
    google: 'Gemini',
    perplexity: 'Perplexity',
  };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 ${className}`}
        role="status"
        data-testid="partial-error-compact"
      >
        <WarningIcon className="w-4 h-4" />
        <span>
          Partial results: {failedProviders.map((p) => providerNames[p.provider]).join(', ')} unavailable
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 ${className}`}
      role="status"
      data-testid="partial-error"
    >
      <div className="flex items-start gap-3">
        <WarningIcon className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-medium text-[var(--text-primary)] mb-1">
            Partial Results
          </h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Some AI providers were unavailable. Your score is based on{' '}
            {successfulProviders.length} provider{successfulProviders.length !== 1 ? 's' : ''}.
          </p>
          <div className="mt-2 text-xs text-[var(--text-tertiary)]">
            <span className="font-medium">Available:</span>{' '}
            {successfulProviders.map((p) => providerNames[p]).join(', ')}
            {failedProviders.length > 0 && (
              <>
                <span className="mx-2">|</span>
                <span className="font-medium">Unavailable:</span>{' '}
                {failedProviders.map((p) => providerNames[p.provider]).join(', ')}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// ERROR BOUNDARY FALLBACK
// ================================================================

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
}

export function ErrorBoundaryFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps): React.ReactElement {
  return (
    <ErrorDisplay
      error={error}
      variant="fullpage"
      onRetry={resetErrorBoundary}
      retryText="Reload"
    />
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default ErrorDisplay;
