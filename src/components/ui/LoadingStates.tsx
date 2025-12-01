/**
 * Loading States Components
 *
 * Phase 1, Week 1, Day 5
 * Skeleton loading components and progress indicators.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { STAGE_METADATA, type AnalysisStage, type ProgressEvent } from '@/lib/sse';

// ================================================================
// SKELETON COMPONENTS
// ================================================================

/**
 * Base skeleton with shimmer animation
 */
export function Skeleton({
  className = '',
  variant = 'default',
  width,
  height,
}: {
  className?: string;
  variant?: 'default' | 'circle' | 'text' | 'card';
  width?: string | number;
  height?: string | number;
}) {
  const baseClasses = 'animate-pulse bg-[var(--bg-tertiary)]';

  const variantClasses = {
    default: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
    card: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      data-testid="skeleton"
    />
  );
}

/**
 * Skeleton for text lines
 */
export function SkeletonText({
  lines = 1,
  className = '',
  lastLineWidth = '60%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`} data-testid="skeleton-text">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for cards
 */
export function SkeletonCard({
  className = '',
  hasImage = false,
  hasFooter = false,
}: {
  className?: string;
  hasImage?: boolean;
  hasFooter?: boolean;
}) {
  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 ${className}`}
      data-testid="skeleton-card"
    >
      {hasImage && (
        <Skeleton className="w-full h-32 mb-4" variant="card" />
      )}
      <Skeleton className="h-6 w-3/4 mb-2" />
      <SkeletonText lines={2} className="mb-4" />
      {hasFooter && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-[var(--border-primary)]">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      )}
    </div>
  );
}

/**
 * Skeleton for score circle
 */
export function SkeletonScoreCircle({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-40 h-40',
  };

  return (
    <div
      className={`animate-pulse bg-[var(--bg-tertiary)] rounded-full ${sizes[size]} ${className}`}
      data-testid="skeleton-score-circle"
    />
  );
}

/**
 * Skeleton for score bar
 */
export function SkeletonScoreBar({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} data-testid="skeleton-score-bar">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
}

// ================================================================
// PROGRESS COMPONENTS
// ================================================================

/**
 * Linear progress bar
 */
export function ProgressBar({
  value,
  max = 100,
  showValue = false,
  className = '',
  size = 'md',
  animated = true,
}: {
  value: number;
  max?: number;
  showValue?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));

  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={className} data-testid="progress-bar">
      {showValue && (
        <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-1">
          <span>Progress</span>
          <span>{Math.round(percent)}%</span>
        </div>
      )}
      <div className={`w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500 ${
            animated ? 'animate-progress-shine' : ''
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Circular progress indicator
 */
export function CircularProgress({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  showValue = true,
  className = '',
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      data-testid="circular-progress"
    >
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-tertiary)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--accent-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--text-primary)]">
          {Math.round(percent)}%
        </div>
      )}
    </div>
  );
}

/**
 * Spinner indicator
 */
export function Spinner({
  size = 'md',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div
      className={`${sizes[size]} border-[var(--bg-tertiary)] border-t-[var(--accent-primary)] rounded-full animate-spin ${className}`}
      data-testid="spinner"
      role="status"
      aria-label="Loading"
    />
  );
}

/**
 * Pulsing dots indicator
 */
export function PulsingDots({
  count = 3,
  size = 'md',
  className = '',
}: {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="pulsing-dots">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${sizes[size]} bg-[var(--accent-primary)] rounded-full animate-pulse`}
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

// ================================================================
// ANALYSIS PROGRESS COMPONENTS
// ================================================================

/**
 * Step indicator for analysis stages
 */
export function StepIndicator({
  currentStage,
  className = '',
}: {
  currentStage: AnalysisStage;
  className?: string;
}) {
  const stages = Object.values(STAGE_METADATA);
  const currentIndex = stages.findIndex(s => s.stage === currentStage);

  return (
    <div className={`space-y-2 ${className}`} data-testid="step-indicator">
      {stages.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div
            key={stage.stage}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
              isCurrent
                ? 'bg-[var(--accent-primary)]/10'
                : ''
            }`}
          >
            {/* Status indicator */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                isComplete
                  ? 'bg-[var(--success)] text-white'
                  : isCurrent
                  ? 'bg-[var(--accent-primary)] text-white animate-pulse'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
              }`}
            >
              {isComplete ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                index + 1
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-medium truncate ${
                  isComplete || isCurrent
                    ? 'text-[var(--text-primary)]'
                    : 'text-[var(--text-tertiary)]'
                }`}
              >
                {stage.label}
              </div>
              {isCurrent && (
                <div className="text-xs text-[var(--text-tertiary)]">
                  {stage.description}
                </div>
              )}
            </div>

            {/* Spinner for current */}
            {isCurrent && <Spinner size="sm" />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Compact progress indicator
 */
export function CompactProgressIndicator({
  currentStage,
  percentComplete,
  message,
  className = '',
}: {
  currentStage: AnalysisStage;
  percentComplete: number;
  message: string;
  className?: string;
}) {
  const stageMetadata = STAGE_METADATA[currentStage];

  return (
    <div className={`space-y-3 ${className}`} data-testid="compact-progress">
      <div className="flex items-center gap-3">
        <Spinner size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {stageMetadata.label}
          </div>
          <div className="text-xs text-[var(--text-tertiary)] truncate">
            {message}
          </div>
        </div>
        <div className="text-sm font-medium text-[var(--accent-primary)]">
          {Math.round(percentComplete)}%
        </div>
      </div>
      <ProgressBar value={percentComplete} />
    </div>
  );
}

/**
 * Full analysis loading screen
 */
export function AnalysisLoadingScreen({
  currentStage,
  percentComplete,
  message,
  estimatedTimeRemaining,
  onCancel,
  className = '',
}: {
  currentStage: AnalysisStage;
  percentComplete: number;
  message: string;
  estimatedTimeRemaining?: string;
  onCancel?: () => void;
  className?: string;
}) {
  const stageMetadata = STAGE_METADATA[currentStage];
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-[var(--bg-primary)] ${className}`}
      data-testid="analysis-loading-screen"
    >
      <div className="max-w-md w-full mx-auto p-8">
        {/* Animated logo/icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <CircularProgress
              value={percentComplete}
              size={120}
              strokeWidth={6}
              showValue={false}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl font-bold text-[var(--accent-primary)]">
                {Math.round(percentComplete)}%
              </div>
            </div>
          </div>
        </div>

        {/* Current stage */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {stageMetadata.label}
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {message}
          </p>
        </div>

        {/* Progress bar */}
        <ProgressBar value={percentComplete} size="lg" className="mb-6" />

        {/* Time info */}
        <div className="flex justify-between text-xs text-[var(--text-tertiary)] mb-6">
          <span>Elapsed: {formatTime(elapsedTime)}</span>
          {estimatedTimeRemaining && (
            <span>Est. remaining: {estimatedTimeRemaining}</span>
          )}
        </div>

        {/* Stage list (collapsed) */}
        <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.values(STAGE_METADATA).slice(0, -1).map((stage, index) => {
              const currentIndex = Object.values(STAGE_METADATA).findIndex(
                s => s.stage === currentStage
              );
              const isComplete = index < currentIndex;
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={stage.stage}
                  className={`w-3 h-3 rounded-full transition-all ${
                    isComplete
                      ? 'bg-[var(--success)]'
                      : isCurrent
                      ? 'bg-[var(--accent-primary)] animate-pulse'
                      : 'bg-[var(--bg-tertiary)]'
                  }`}
                  title={stage.label}
                />
              );
            })}
          </div>
        </div>

        {/* Cancel button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="w-full py-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel Analysis
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// RESULTS PAGE LOADING SKELETON
// ================================================================

/**
 * Full results page skeleton
 */
export function ResultsPageSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] ${className}`} data-testid="results-page-skeleton">
      {/* Header skeleton */}
      <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero skeleton */}
        <section className="mb-8">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-2xl p-8">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <SkeletonScoreCircle size="xl" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-64" />
                <SkeletonText lines={2} />
                <div className="flex gap-4">
                  <Skeleton className="h-16 w-24" />
                  <Skeleton className="h-16 w-24" />
                  <Skeleton className="h-16 w-24" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab navigation skeleton */}
        <div className="mb-6">
          <Skeleton className="h-12 w-96" />
        </div>

        {/* Content skeleton */}
        <div className="grid md:grid-cols-2 gap-6">
          <SkeletonCard hasFooter />
          <SkeletonCard hasFooter />
        </div>

        <div className="mt-6">
          <SkeletonCard className="h-48" />
        </div>

        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-5 w-24" />
                <SkeletonScoreCircle size="sm" />
              </div>
              <SkeletonScoreBar />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ================================================================
// HOOK FOR SSE PROGRESS
// ================================================================

/**
 * Hook to use SSE progress events
 */
export function useAnalysisProgress(analysisId: string | null) {
  const [currentStage, setCurrentStage] = useState<AnalysisStage>('initializing');
  const [percentComplete, setPercentComplete] = useState(0);
  const [message, setMessage] = useState('Starting analysis...');
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;

    const eventSource = new EventSource(`/api/analyze/progress/${analysisId}`);

    eventSource.addEventListener('progress', (event) => {
      const data: ProgressEvent = JSON.parse(event.data);
      setCurrentStage(data.stage);
      setPercentComplete(data.percentComplete);
      setMessage(data.message);
    });

    eventSource.addEventListener('error', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setError(data.message);
      } catch {
        setError('Connection lost');
      }
      eventSource.close();
    });

    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse((event as MessageEvent).data);
      setIsComplete(true);
      setResultUrl(data.redirectUrl);
      setPercentComplete(100);
      setCurrentStage('complete');
      eventSource.close();
    });

    eventSource.onerror = () => {
      setError('Connection lost. Please refresh.');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [analysisId]);

  return {
    currentStage,
    percentComplete,
    message,
    error,
    isComplete,
    resultUrl,
  };
}
