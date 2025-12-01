/**
 * Quick Re-analysis Component
 *
 * One-click re-run for monitored URLs
 *
 * Phase 2, Week 4, Day 3
 */

'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { PlanTier } from '@/lib/freemium';

// ================================================================
// TYPES
// ================================================================

export interface MonitoredUrl {
  id: string;
  url: string;
  brandName: string;
  lastScore: number;
  lastAnalyzedAt: string;
  scoreChange?: number; // Difference from previous analysis
  status: 'idle' | 'analyzing' | 'completed' | 'error';
  frequency?: 'daily' | 'weekly' | 'monthly';
}

export interface QuickReanalysisProps {
  urls: MonitoredUrl[];
  plan: PlanTier;
  remainingAnalyses: number;
  onReanalyze: (urlId: string) => Promise<void>;
  onReanalyzeAll?: () => Promise<void>;
  onViewDetails?: (urlId: string) => void;
  onRemoveUrl?: (urlId: string) => void;
  onUpgrade?: () => void;
  className?: string;
}

// ================================================================
// HELPER COMPONENTS
// ================================================================

interface ScoreChangeIndicatorProps {
  change: number;
}

function ScoreChangeIndicator({ change }: ScoreChangeIndicatorProps) {
  if (change === 0) {
    return (
      <span
        data-testid="score-change-stable"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        No change
      </span>
    );
  }

  const isPositive = change > 0;
  return (
    <span
      data-testid={isPositive ? 'score-change-up' : 'score-change-down'}
      className={cn(
        'inline-flex items-center text-xs font-medium',
        isPositive
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400'
      )}
    >
      {isPositive ? '↑' : '↓'} {Math.abs(change)} pts
    </span>
  );
}

interface StatusBadgeProps {
  status: MonitoredUrl['status'];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    idle: {
      label: 'Ready',
      className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    },
    analyzing: {
      label: 'Analyzing...',
      className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    },
    completed: {
      label: 'Updated',
      className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    error: {
      label: 'Error',
      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };

  const { label, className } = config[status];

  return (
    <span
      data-testid={`status-badge-${status}`}
      className={cn('px-2 py-0.5 rounded-full text-xs font-medium', className)}
    >
      {label}
    </span>
  );
}

interface FrequencyBadgeProps {
  frequency: MonitoredUrl['frequency'];
}

function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  if (!frequency) return null;

  const labels = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
  };

  return (
    <span
      data-testid={`frequency-badge-${frequency}`}
      className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    >
      {labels[frequency]}
    </span>
  );
}

// ================================================================
// URL ITEM COMPONENT
// ================================================================

interface UrlItemProps {
  url: MonitoredUrl;
  onReanalyze: (urlId: string) => Promise<void>;
  onViewDetails?: (urlId: string) => void;
  onRemove?: (urlId: string) => void;
  disabled: boolean;
}

function UrlItem({
  url,
  onReanalyze,
  onViewDetails,
  onRemove,
  disabled,
}: UrlItemProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleReanalyze = useCallback(async () => {
    if (isLoading || disabled || url.status === 'analyzing') return;
    setIsLoading(true);
    try {
      await onReanalyze(url.id);
    } finally {
      setIsLoading(false);
    }
  }, [url.id, isLoading, disabled, url.status, onReanalyze]);

  const formattedDate = new Date(url.lastAnalyzedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      data-testid={`url-item-${url.id}`}
      className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    >
      {/* Left section: URL info */}
      <div className="flex-1 min-w-0 mr-4">
        <div className="flex items-center space-x-2 mb-1">
          <h4
            data-testid="url-brand-name"
            className="font-medium text-gray-900 dark:text-white truncate"
          >
            {url.brandName}
          </h4>
          <StatusBadge status={url.status} />
          <FrequencyBadge frequency={url.frequency} />
        </div>

        <p
          data-testid="url-value"
          className="text-sm text-gray-500 dark:text-gray-400 truncate"
        >
          {url.url}
        </p>

        <div className="flex items-center space-x-4 mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Last: {formattedDate}
          </span>
          {url.scoreChange !== undefined && (
            <ScoreChangeIndicator change={url.scoreChange} />
          )}
        </div>
      </div>

      {/* Center section: Score */}
      <div className="flex flex-col items-center mr-4">
        <span
          data-testid="url-score"
          className={cn(
            'text-2xl font-bold',
            url.lastScore >= 80
              ? 'text-green-600 dark:text-green-400'
              : url.lastScore >= 60
                ? 'text-blue-600 dark:text-blue-400'
                : url.lastScore >= 40
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
          )}
        >
          {url.lastScore}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Score</span>
      </div>

      {/* Right section: Actions */}
      <div className="flex items-center space-x-2">
        {onViewDetails && (
          <button
            data-testid="view-details-button"
            onClick={() => onViewDetails(url.id)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="View details"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </button>
        )}

        <button
          data-testid="reanalyze-button"
          onClick={handleReanalyze}
          disabled={disabled || isLoading || url.status === 'analyzing'}
          className={cn(
            'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            disabled || isLoading || url.status === 'analyzing'
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
              : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
          )}
        >
          {isLoading || url.status === 'analyzing' ? (
            <>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Analyzing</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
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
              <span>Re-analyze</span>
            </>
          )}
        </button>

        {onRemove && (
          <button
            data-testid="remove-url-button"
            onClick={() => onRemove(url.id)}
            className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Remove from monitoring"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function QuickReanalysis({
  urls,
  plan,
  remainingAnalyses,
  onReanalyze,
  onReanalyzeAll,
  onViewDetails,
  onRemoveUrl,
  onUpgrade,
  className,
}: QuickReanalysisProps) {
  const [isReanalyzingAll, setIsReanalyzingAll] = useState(false);

  const canReanalyze = remainingAnalyses > 0;
  const canReanalyzeAll = remainingAnalyses >= urls.length && urls.length > 0;

  const handleReanalyzeAll = useCallback(async () => {
    if (!onReanalyzeAll || isReanalyzingAll || !canReanalyzeAll) return;
    setIsReanalyzingAll(true);
    try {
      await onReanalyzeAll();
    } finally {
      setIsReanalyzingAll(false);
    }
  }, [onReanalyzeAll, isReanalyzingAll, canReanalyzeAll]);

  // Empty state
  if (urls.length === 0) {
    return (
      <div
        data-testid="quick-reanalysis-empty"
        className={cn(
          'flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600',
          className
        )}
      >
        <svg
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          No URLs to monitor
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
          Add URLs to your monitoring list to enable quick re-analysis
        </p>

        {plan === 'free' && onUpgrade && (
          <button
            data-testid="upgrade-for-monitoring"
            onClick={onUpgrade}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Upgrade to Enable Monitoring
          </button>
        )}
      </div>
    );
  }

  // Locked state for free users
  if (plan === 'free') {
    return (
      <div
        data-testid="quick-reanalysis-locked"
        className={cn(
          'relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700',
          className
        )}
      >
        {/* Blurred preview */}
        <div className="opacity-50 blur-sm pointer-events-none p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Quick Re-analysis
            </h3>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg"
              />
            ))}
          </div>
        </div>

        {/* Upgrade overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Monitoring is a Pro feature
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Upgrade to track score changes over time
            </p>
            {onUpgrade && (
              <button
                data-testid="upgrade-button"
                onClick={onUpgrade}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                Upgrade Now
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="quick-reanalysis" className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Quick Re-analysis
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {remainingAnalyses} analyses remaining this month
          </p>
        </div>

        {onReanalyzeAll && urls.length > 1 && (
          <button
            data-testid="reanalyze-all-button"
            onClick={handleReanalyzeAll}
            disabled={!canReanalyzeAll || isReanalyzingAll}
            className={cn(
              'flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              !canReanalyzeAll || isReanalyzingAll
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-500'
                : 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
            )}
          >
            {isReanalyzingAll ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Analyzing All...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
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
                <span>Re-analyze All ({urls.length})</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Low quota warning */}
      {remainingAnalyses <= 3 && remainingAnalyses > 0 && (
        <div
          data-testid="low-quota-warning"
          className="flex items-center space-x-2 p-3 mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <svg
            className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0"
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
          <span className="text-sm text-yellow-800 dark:text-yellow-200">
            Running low on analyses. {onUpgrade && (
              <button
                onClick={onUpgrade}
                className="underline font-medium hover:no-underline"
              >
                Upgrade for more
              </button>
            )}
          </span>
        </div>
      )}

      {/* No quota state */}
      {remainingAnalyses === 0 && (
        <div
          data-testid="no-quota-message"
          className="flex items-center justify-between p-4 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
        >
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
            <span className="text-sm text-red-800 dark:text-red-200">
              You&apos;ve used all your analyses for this month
            </span>
          </div>
          {onUpgrade && (
            <button
              onClick={onUpgrade}
              className="px-4 py-1.5 bg-red-600 text-white rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Upgrade
            </button>
          )}
        </div>
      )}

      {/* URL List */}
      <div className="space-y-3" data-testid="url-list">
        {urls.map((url) => (
          <UrlItem
            key={url.id}
            url={url}
            onReanalyze={onReanalyze}
            onViewDetails={onViewDetails}
            onRemove={onRemoveUrl}
            disabled={!canReanalyze}
          />
        ))}
      </div>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default QuickReanalysis;
