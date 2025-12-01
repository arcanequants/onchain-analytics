/**
 * Social Proof Component
 *
 * Displays industry comparison and benchmarking data
 * "Others in your industry score X avg"
 *
 * Phase 2, Week 4, Day 4
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface IndustryBenchmark {
  industry: string;
  averageScore: number;
  topPerformerScore: number;
  totalBrands: number;
  percentile?: number; // User's percentile in the industry
}

export interface CompetitorPreview {
  name: string;
  score: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface SocialProofProps {
  userScore: number;
  industry?: string;
  benchmark?: IndustryBenchmark;
  competitors?: CompetitorPreview[];
  isLoading?: boolean;
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
  className?: string;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getScoreComparison(
  userScore: number,
  industryAvg: number
): { label: string; color: string; emoji: string } {
  const diff = userScore - industryAvg;
  const percent = Math.abs(Math.round((diff / industryAvg) * 100));

  if (diff > 15) {
    return {
      label: `${percent}% above average`,
      color: 'text-green-600 dark:text-green-400',
      emoji: '🏆',
    };
  } else if (diff > 5) {
    return {
      label: `${percent}% above average`,
      color: 'text-green-600 dark:text-green-400',
      emoji: '✨',
    };
  } else if (diff >= -5) {
    return {
      label: 'At industry average',
      color: 'text-blue-600 dark:text-blue-400',
      emoji: '📊',
    };
  } else if (diff >= -15) {
    return {
      label: `${percent}% below average`,
      color: 'text-yellow-600 dark:text-yellow-400',
      emoji: '📈',
    };
  } else {
    return {
      label: `${percent}% below average`,
      color: 'text-red-600 dark:text-red-400',
      emoji: '⚠️',
    };
  }
}

function getPercentileLabel(percentile: number): string {
  if (percentile >= 90) return 'Top 10%';
  if (percentile >= 75) return 'Top 25%';
  if (percentile >= 50) return 'Top 50%';
  if (percentile >= 25) return 'Bottom 50%';
  return 'Bottom 25%';
}

// ================================================================
// LOADING SKELETON
// ================================================================

function SocialProofSkeleton() {
  return (
    <div
      data-testid="social-proof-skeleton"
      className="animate-pulse space-y-4"
    >
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
    </div>
  );
}

// ================================================================
// INDUSTRY COMPARISON CARD
// ================================================================

interface IndustryComparisonCardProps {
  userScore: number;
  benchmark: IndustryBenchmark;
}

function IndustryComparisonCard({
  userScore,
  benchmark,
}: IndustryComparisonCardProps) {
  const comparison = useMemo(
    () => getScoreComparison(userScore, benchmark.averageScore),
    [userScore, benchmark.averageScore]
  );

  const percentileLabel = useMemo(
    () => (benchmark.percentile ? getPercentileLabel(benchmark.percentile) : null),
    [benchmark.percentile]
  );

  return (
    <div
      data-testid="industry-comparison-card"
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-100 dark:border-blue-800"
    >
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg" data-testid="comparison-emoji">
          {comparison.emoji}
        </span>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Industry Comparison
        </h4>
      </div>

      <div className="flex items-baseline justify-between mb-3">
        <div>
          <span
            data-testid="user-score-display"
            className="text-3xl font-bold text-gray-900 dark:text-white"
          >
            {userScore}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            your score
          </span>
        </div>
        <div className="text-right">
          <span
            data-testid="industry-avg-display"
            className="text-xl font-semibold text-gray-600 dark:text-gray-300"
          >
            {benchmark.averageScore}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
            avg
          </span>
        </div>
      </div>

      {/* Visual comparison bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
        <div
          data-testid="industry-avg-marker"
          className="absolute top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-500"
          style={{ left: `${Math.min(benchmark.averageScore, 100)}%` }}
        />
        <div
          data-testid="user-score-bar"
          className={cn(
            'h-full rounded-full transition-all',
            userScore >= benchmark.averageScore
              ? 'bg-green-500'
              : 'bg-yellow-500'
          )}
          style={{ width: `${Math.min(userScore, 100)}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span data-testid="comparison-label" className={comparison.color}>
          {comparison.label}
        </span>
        {percentileLabel && (
          <span
            data-testid="percentile-label"
            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
          >
            {percentileLabel}
          </span>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            Based on{' '}
            <strong data-testid="total-brands">
              {benchmark.totalBrands.toLocaleString()}
            </strong>{' '}
            brands in {benchmark.industry}
          </span>
          <span>
            Top performer:{' '}
            <strong data-testid="top-performer-score">
              {benchmark.topPerformerScore}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// COMPETITOR PREVIEW CARD
// ================================================================

interface CompetitorPreviewCardProps {
  competitors: CompetitorPreview[];
  showUpgradePrompt?: boolean;
  onUpgrade?: () => void;
}

function CompetitorPreviewCard({
  competitors,
  showUpgradePrompt,
  onUpgrade,
}: CompetitorPreviewCardProps) {
  const displayCompetitors = competitors.slice(0, 3);

  return (
    <div
      data-testid="competitor-preview-card"
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Competitors
        </h4>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {displayCompetitors.map((competitor, index) => (
          <div
            key={competitor.name}
            data-testid={`competitor-item-${index}`}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                {index + 1}
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {competitor.name}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={cn(
                  'text-sm font-semibold',
                  competitor.score >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : competitor.score >= 60
                      ? 'text-blue-600 dark:text-blue-400'
                      : competitor.score >= 40
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                )}
              >
                {competitor.score}
              </span>
              {competitor.trend && (
                <span
                  className={cn(
                    'text-xs',
                    competitor.trend === 'up'
                      ? 'text-green-500'
                      : competitor.trend === 'down'
                        ? 'text-red-500'
                        : 'text-gray-400'
                  )}
                >
                  {competitor.trend === 'up'
                    ? '↑'
                    : competitor.trend === 'down'
                      ? '↓'
                      : '–'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showUpgradePrompt && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <button
            data-testid="view-all-competitors-button"
            onClick={onUpgrade}
            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Upgrade to see all competitors →
          </button>
        </div>
      )}
    </div>
  );
}

// ================================================================
// QUICK STATS ROW
// ================================================================

interface QuickStatsRowProps {
  industry: string;
  benchmark: IndustryBenchmark;
}

function QuickStatsRow({ industry, benchmark }: QuickStatsRowProps) {
  return (
    <div
      data-testid="quick-stats-row"
      className="flex items-center justify-center space-x-6 py-3 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm"
    >
      <div className="text-center">
        <span className="text-gray-500 dark:text-gray-400">Industry</span>
        <p
          data-testid="industry-name"
          className="font-medium text-gray-900 dark:text-white"
        >
          {industry}
        </p>
      </div>
      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
      <div className="text-center">
        <span className="text-gray-500 dark:text-gray-400">Avg Score</span>
        <p className="font-medium text-gray-900 dark:text-white">
          {benchmark.averageScore}
        </p>
      </div>
      <div className="w-px h-8 bg-gray-300 dark:bg-gray-600" />
      <div className="text-center">
        <span className="text-gray-500 dark:text-gray-400">Brands</span>
        <p className="font-medium text-gray-900 dark:text-white">
          {benchmark.totalBrands.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function SocialProof({
  userScore,
  industry,
  benchmark,
  competitors,
  isLoading = false,
  showUpgradePrompt = false,
  onUpgrade,
  className,
}: SocialProofProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className={className}>
        <SocialProofSkeleton />
      </div>
    );
  }

  // No data state
  if (!benchmark && !competitors?.length) {
    return (
      <div
        data-testid="social-proof-empty"
        className={cn(
          'flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center',
          className
        )}
      >
        <span className="text-2xl mb-2">📊</span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Run more analyses to unlock industry comparisons
        </p>
      </div>
    );
  }

  return (
    <div data-testid="social-proof" className={cn('space-y-4', className)}>
      {/* Industry Quick Stats */}
      {industry && benchmark && (
        <QuickStatsRow industry={industry} benchmark={benchmark} />
      )}

      {/* Industry Comparison Card */}
      {benchmark && (
        <IndustryComparisonCard userScore={userScore} benchmark={benchmark} />
      )}

      {/* Competitor Preview */}
      {competitors && competitors.length > 0 && (
        <CompetitorPreviewCard
          competitors={competitors}
          showUpgradePrompt={showUpgradePrompt}
          onUpgrade={onUpgrade}
        />
      )}
    </div>
  );
}

// ================================================================
// INLINE SOCIAL PROOF (for embedding in other components)
// ================================================================

export interface InlineSocialProofProps {
  userScore: number;
  industryAverage: number;
  industry?: string;
  className?: string;
}

export function InlineSocialProof({
  userScore,
  industryAverage,
  industry,
  className,
}: InlineSocialProofProps) {
  const comparison = useMemo(
    () => getScoreComparison(userScore, industryAverage),
    [userScore, industryAverage]
  );

  const diff = userScore - industryAverage;

  return (
    <div
      data-testid="inline-social-proof"
      className={cn(
        'flex items-center space-x-2 text-sm',
        comparison.color,
        className
      )}
    >
      <span>{comparison.emoji}</span>
      <span>
        {diff >= 0 ? (
          <>
            <strong>{Math.abs(diff)}</strong> points above
          </>
        ) : (
          <>
            <strong>{Math.abs(diff)}</strong> points below
          </>
        )}{' '}
        {industry ? `${industry} average` : 'industry average'}
      </span>
    </div>
  );
}

// ================================================================
// SOCIAL PROOF BADGE (compact version)
// ================================================================

export interface SocialProofBadgeProps {
  percentile: number;
  className?: string;
}

export function SocialProofBadge({ percentile, className }: SocialProofBadgeProps) {
  const label = getPercentileLabel(percentile);
  const isTop = percentile >= 75;

  return (
    <span
      data-testid="social-proof-badge"
      className={cn(
        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
        isTop
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
        className
      )}
    >
      {isTop && <span className="mr-1">🏆</span>}
      {label}
    </span>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default SocialProof;
