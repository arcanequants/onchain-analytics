'use client';

/**
 * Global Error Boundary
 *
 * Phase 4, Week 8 Extended - Dev Checklist
 *
 * Features:
 * - Catches all React errors
 * - Reports to Sentry (if configured)
 * - Provides recovery options
 * - Shows user-friendly error messages
 * - Logs error context for debugging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  resetOnNavigation?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class GlobalErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('GlobalErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // Report to Sentry if available
    this.reportToSentry(error, errorInfo);

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to analytics
    this.logErrorAnalytics(error, errorInfo);
  }

  private reportToSentry(error: Error, errorInfo: ErrorInfo): void {
    // Dynamic import to avoid issues if Sentry is not configured
    import('@sentry/nextjs')
      .then((Sentry) => {
        Sentry.withScope((scope) => {
          scope.setTag('error_boundary', 'global');
          scope.setExtra('componentStack', errorInfo.componentStack);
          scope.setExtra('errorId', this.state.errorId);
          Sentry.captureException(error);
        });
      })
      .catch(() => {
        // Sentry not available, log to console
        console.warn('Sentry not available for error reporting');
      });
  }

  private logErrorAnalytics(error: Error, errorInfo: ErrorInfo): void {
    // Send to analytics endpoint
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    // Fire and forget to analytics endpoint
    fetch('/api/analytics/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // Silently fail if analytics endpoint is unavailable
    });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleGoHome = (): void => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleReset);
        }
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          showDetails={this.props.showDetails}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// DEFAULT ERROR FALLBACK UI
// ============================================================================

interface DefaultErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  showDetails?: boolean;
  onReset: () => void;
  onReload: () => void;
  onGoHome: () => void;
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  showDetails = false,
  onReset,
  onReload,
  onGoHome,
}: DefaultErrorFallbackProps) {
  const [showStack, setShowStack] = React.useState(false);
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-600">
            We apologize for the inconvenience. Our team has been notified.
          </p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {/* Error Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Error Message
            </label>
            <p className="text-sm text-gray-900 font-mono bg-gray-50 p-3 rounded">
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          {/* Error ID */}
          {errorId && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Error ID
              </label>
              <p className="text-sm text-gray-600 font-mono">{errorId}</p>
            </div>
          )}

          {/* Stack Trace (Dev only or showDetails) */}
          {(isDev || showDetails) && error.stack && (
            <div className="mb-4">
              <button
                onClick={() => setShowStack(!showStack)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <svg
                  className={`w-4 h-4 mr-1 transition-transform ${
                    showStack ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                {showStack ? 'Hide' : 'Show'} Stack Trace
              </button>

              {showStack && (
                <pre className="mt-2 text-xs text-gray-700 bg-gray-100 p-3 rounded overflow-auto max-h-48">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          {/* Component Stack (Dev only) */}
          {isDev && errorInfo?.componentStack && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Component Stack
              </label>
              <pre className="text-xs text-gray-700 bg-gray-100 p-3 rounded overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReset}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </button>

          <button
            onClick={onReload}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Reload Page
          </button>

          <button
            onClick={onGoHome}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go Home
          </button>
        </div>

        {/* Support Info */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            If this problem persists, please{' '}
            <a
              href="/help"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              contact support
            </a>
            {errorId && (
              <>
                {' '}
                with error ID: <code className="font-mono">{errorId}</code>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HOOK FOR FUNCTIONAL COMPONENTS
// ============================================================================

/**
 * Hook to manually report errors to the error boundary
 */
export function useErrorHandler() {
  const [, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);

  return handleError;
}

// ============================================================================
// ERROR BOUNDARY FOR SPECIFIC SECTIONS
// ============================================================================

interface SectionErrorBoundaryProps {
  children: ReactNode;
  sectionName: string;
  fallback?: ReactNode;
}

export function SectionErrorBoundary({
  children,
  sectionName,
  fallback,
}: SectionErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      fallback={
        fallback || (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-700">
                Error loading {sectionName}
              </span>
            </div>
          </div>
        )
      }
      onError={(error, errorInfo) => {
        console.error(`Error in section "${sectionName}":`, error);
        console.error('Component stack:', errorInfo.componentStack);
      }}
    >
      {children}
    </GlobalErrorBoundary>
  );
}

// ============================================================================
// ASYNC ERROR BOUNDARY (for Suspense)
// ============================================================================

interface AsyncBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
}

export function AsyncBoundary({
  children,
  fallback,
  loadingFallback,
}: AsyncBoundaryProps) {
  return (
    <GlobalErrorBoundary fallback={fallback}>
      <React.Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </React.Suspense>
    </GlobalErrorBoundary>
  );
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );
}

export default GlobalErrorBoundary;
