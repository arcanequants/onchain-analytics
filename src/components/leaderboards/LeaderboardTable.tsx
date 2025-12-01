/**
 * Leaderboard Table Component
 *
 * Display industry rankings with filtering and pagination
 *
 * Phase 2, Week 7, Day 2
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type LeaderboardEntry,
  type IndustryCategory,
  type LeaderboardPeriod,
  INDUSTRY_CATEGORIES,
  INDUSTRY_LABELS,
  PERIOD_LABELS,
} from '@/lib/leaderboards';

// ================================================================
// TYPES
// ================================================================

export interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  totalEntries: number;
  currentCategory: IndustryCategory | 'all';
  currentPeriod: LeaderboardPeriod;
  isLoading?: boolean;
  onCategoryChange?: (category: IndustryCategory | 'all') => void;
  onPeriodChange?: (period: LeaderboardPeriod) => void;
  onBrandClick?: (brandId: string) => void;
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
      <polyline points="17 18 23 18 23 12" />
    </svg>
  );
}

function TrendStableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function VerifiedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

function TrendIndicator({ trend, change }: { trend: LeaderboardEntry['trend']; change: number }) {
  if (trend === 'new') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
        <StarIcon className="w-3 h-3" />
        New
      </span>
    );
  }

  if (trend === 'stable') {
    return (
      <span className="inline-flex items-center text-gray-400">
        <TrendStableIcon className="w-4 h-4" />
      </span>
    );
  }

  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
        <TrendUpIcon className="w-4 h-4" />
        <span className="text-xs font-medium">+{change}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
      <TrendDownIcon className="w-4 h-4" />
      <span className="text-xs font-medium">{change}</span>
    </span>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 90) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (score >= 60) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <span className={cn('px-2.5 py-1 text-sm font-semibold rounded-full', getColor())}>
      {score}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
        <span className="text-lg">🥇</span>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full">
        <span className="text-lg">🥈</span>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 text-amber-600 bg-amber-100 dark:bg-amber-900/30 rounded-full">
        <span className="text-lg">🥉</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium text-gray-600 dark:text-gray-400">
      #{rank}
    </span>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function LeaderboardTable({
  entries,
  totalEntries,
  currentCategory,
  currentPeriod,
  isLoading = false,
  onCategoryChange,
  onPeriodChange,
  onBrandClick,
  className,
}: LeaderboardTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  return (
    <div className={cn('space-y-4', className)} data-testid="leaderboard-table">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Category:
          </label>
          <select
            id="category-filter"
            value={currentCategory}
            onChange={(e) => onCategoryChange?.(e.target.value as IndustryCategory | 'all')}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Industries</option>
            {INDUSTRY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {INDUSTRY_LABELS[cat]}
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          {(Object.keys(PERIOD_LABELS) as LeaderboardPeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange?.(period)}
              className={cn(
                'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                currentPeriod === period
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Showing {entries.length} of {totalEntries} brands
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Brand
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Score
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm text-gray-500">Loading leaderboard...</p>
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  No brands found for the selected filters.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.brandId}
                  onClick={() => onBrandClick?.(entry.brandId)}
                  onMouseEnter={() => setHoveredRow(entry.brandId)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={cn(
                    'transition-colors cursor-pointer',
                    hoveredRow === entry.brandId
                      ? 'bg-gray-50 dark:bg-gray-800/50'
                      : 'bg-white dark:bg-gray-900'
                  )}
                >
                  <td className="px-4 py-4">
                    <RankBadge rank={entry.rank} />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {entry.brandLogo ? (
                        <img
                          src={entry.brandLogo}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                          {entry.brandName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {entry.brandName}
                          </span>
                          {entry.isVerified && (
                            <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 rounded-full">
                              <VerifiedIcon className="w-3 h-3 text-white" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {INDUSTRY_LABELS[entry.category]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ScoreBadge score={entry.score} />
                  </td>
                  <td className="px-4 py-4 text-center">
                    <TrendIndicator trend={entry.trend} change={entry.scoreChange} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeaderboardTable;
