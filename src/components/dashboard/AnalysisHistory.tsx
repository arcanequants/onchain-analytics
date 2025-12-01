/**
 * AnalysisHistory Component
 *
 * Phase 2, Week 4, Day 2
 * Displays and manages analysis history with filtering, sorting, and pagination.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { PlanTier, PLAN_LIMITS, getHistoryVisibility } from '@/lib/freemium';
import { BlurredContent, BlurredList } from '@/components/ui/BlurredContent';

// ================================================================
// TYPES
// ================================================================

export interface HistoryAnalysis {
  id: string;
  url: string;
  title: string;
  score: number;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed';
  provider: string;
  domain: string;
  tags?: string[];
}

export interface HistoryFilters {
  search?: string;
  status?: 'all' | 'completed' | 'processing' | 'failed';
  dateRange?: 'all' | 'today' | 'week' | 'month';
  sortBy?: 'date' | 'score' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface AnalysisHistoryProps {
  analyses: HistoryAnalysis[];
  plan: PlanTier;
  onAnalysisClick?: (analysisId: string) => void;
  onDeleteAnalysis?: (analysisId: string) => void;
  onExportAnalysis?: (analysisId: string) => void;
  onRerunAnalysis?: (analysisId: string) => void;
  onUpgrade?: (plan: PlanTier) => void;
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function FilterIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function SortIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 6h18M3 12h12M3 18h6" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5 animate-spin', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" opacity="0.75" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return formatDate(date);
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 60) return 'bg-amber-100 dark:bg-amber-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

interface HistoryItemProps {
  analysis: HistoryAnalysis;
  onClick?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  onRerun?: () => void;
  canExport: boolean;
  isLocked?: boolean;
}

function HistoryItem({
  analysis,
  onClick,
  onDelete,
  onExport,
  onRerun,
  canExport,
  isLocked = false,
}: HistoryItemProps) {
  const statusConfig = {
    completed: {
      icon: <CheckCircleIcon className="text-green-500" />,
      label: 'Completed',
    },
    processing: {
      icon: <LoaderIcon className="text-blue-500" />,
      label: 'Processing',
    },
    failed: {
      icon: <AlertCircleIcon className="text-red-500" />,
      label: 'Failed',
    },
  };

  const status = statusConfig[analysis.status];

  return (
    <div
      className={cn(
        'group flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700',
        'bg-white dark:bg-gray-800',
        !isLocked && 'hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all',
        isLocked && 'opacity-50'
      )}
      data-testid="history-item"
    >
      {/* Left side - Analysis info */}
      <div
        className={cn(
          'flex items-center gap-4 min-w-0 flex-1 cursor-pointer',
          isLocked && 'pointer-events-none'
        )}
        onClick={isLocked ? undefined : onClick}
        role="button"
        tabIndex={isLocked ? -1 : 0}
      >
        {/* Score badge */}
        {analysis.status === 'completed' ? (
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg',
              getScoreBgColor(analysis.score),
              getScoreColor(analysis.score)
            )}
            data-testid="history-score"
          >
            {analysis.score}
          </div>
        ) : (
          <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-gray-700">
            {status.icon}
          </div>
        )}

        {/* Content */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className="font-medium text-gray-900 dark:text-white truncate"
              data-testid="history-title"
            >
              {analysis.title || analysis.domain}
            </h3>
            {analysis.tags?.map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            <span className="truncate">{analysis.url}</span>
            <span className="flex items-center gap-1">
              <ClockIcon className="w-3.5 h-3.5" />
              {formatRelativeDate(analysis.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div
        className={cn(
          'flex items-center gap-2 ml-4',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          isLocked && 'hidden'
        )}
        data-testid="history-actions"
      >
        {analysis.status === 'completed' && canExport && (
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onExport?.();
            }}
            title="Export"
            data-testid="export-btn"
          >
            <DownloadIcon />
          </button>
        )}
        {analysis.status === 'failed' && (
          <button
            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onRerun?.();
            }}
            title="Rerun"
            data-testid="rerun-btn"
          >
            <RefreshIcon />
          </button>
        )}
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          title="Delete"
          data-testid="delete-btn"
        >
          <TrashIcon />
        </button>
        <ExternalLinkIcon className="text-gray-400" />
      </div>
    </div>
  );
}

interface FilterBarProps {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  totalCount: number;
  filteredCount: number;
}

function FilterBar({ filters, onFiltersChange, totalCount, filteredCount }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="space-y-3" data-testid="filter-bar">
      {/* Search and quick actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search analyses..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            )}
            data-testid="search-input"
          />
        </div>

        {/* Filter toggle */}
        <button
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
            showFilters
              ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
          )}
          onClick={() => setShowFilters(!showFilters)}
          data-testid="filter-toggle"
        >
          <FilterIcon className="w-4 h-4" />
          Filters
        </button>

        {/* Sort */}
        <select
          value={`${filters.sortBy || 'date'}-${filters.sortOrder || 'desc'}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-');
            onFiltersChange({
              ...filters,
              sortBy: sortBy as HistoryFilters['sortBy'],
              sortOrder: sortOrder as HistoryFilters['sortOrder'],
            });
          }}
          className={cn(
            'px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700',
            'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500'
          )}
          data-testid="sort-select"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="score-desc">Highest score</option>
          <option value="score-asc">Lowest score</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
        </select>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg" data-testid="expanded-filters">
          {/* Status filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Status
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as HistoryFilters['status'] })}
              className={cn(
                'px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              data-testid="status-filter"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, dateRange: e.target.value as HistoryFilters['dateRange'] })}
              className={cn(
                'px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700',
                'bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm',
                'focus:outline-none focus:ring-2 focus:ring-blue-500'
              )}
              data-testid="date-filter"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
            </select>
          </div>

          {/* Clear filters */}
          <button
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => onFiltersChange({})}
            data-testid="clear-filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-gray-500 dark:text-gray-400" data-testid="results-count">
        Showing {filteredCount} of {totalCount} analyses
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2" data-testid="pagination">
      <button
        className={cn(
          'p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors',
          currentPage === 1
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        )}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        data-testid="prev-page"
      >
        <ChevronLeftIcon />
      </button>

      <span className="text-sm text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={cn(
          'p-2 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors',
          currentPage === totalPages
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
        )}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        data-testid="next-page"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

const ITEMS_PER_PAGE = 10;

export function AnalysisHistory({
  analyses,
  plan,
  onAnalysisClick,
  onDeleteAnalysis,
  onExportAnalysis,
  onRerunAnalysis,
  onUpgrade,
  className,
}: AnalysisHistoryProps) {
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Get plan limits
  const planConfig = PLAN_LIMITS[plan];
  const historyDaysLimit = planConfig.historyDays;
  const canExport = planConfig.exportEnabled;

  // Get history visibility
  const historyVisibility = getHistoryVisibility(plan, analyses.length);

  // Filter and sort analyses
  const filteredAnalyses = useMemo(() => {
    let result = [...analyses];

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        a =>
          a.title?.toLowerCase().includes(search) ||
          a.url.toLowerCase().includes(search) ||
          a.domain.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      result = result.filter(a => a.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      const cutoff = new Date();

      switch (filters.dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setDate(now.getDate() - 30);
          break;
      }

      result = result.filter(a => a.createdAt >= cutoff);
    }

    // Sorting
    const sortBy = filters.sortBy || 'date';
    const sortOrder = filters.sortOrder || 'desc';

    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'score':
          comparison = a.score - b.score;
          break;
        case 'title':
          comparison = (a.title || a.domain).localeCompare(b.title || b.domain);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return result;
  }, [analyses, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE);
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Split visible and locked analyses based on plan
  const visibleCount = historyVisibility.showCount;
  const visibleAnalyses = paginatedAnalyses.slice(0, visibleCount);
  const lockedAnalyses = paginatedAnalyses.slice(visibleCount);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: HistoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className={cn('space-y-6', className)} data-testid="analysis-history">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="history-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Analysis History
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {historyDaysLimit > 0
              ? `Access to last ${historyDaysLimit} days of analyses`
              : 'Upgrade to access analysis history'}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalCount={analyses.length}
        filteredCount={filteredAnalyses.length}
      />

      {/* Empty state */}
      {analyses.length === 0 ? (
        <EmptyHistory />
      ) : filteredAnalyses.length === 0 ? (
        <NoResultsState onClear={() => setFilters({})} />
      ) : (
        <>
          {/* Analysis list */}
          <div className="space-y-3" data-testid="history-list">
            {/* Visible analyses */}
            {visibleAnalyses.map(analysis => (
              <HistoryItem
                key={analysis.id}
                analysis={analysis}
                onClick={() => onAnalysisClick?.(analysis.id)}
                onDelete={() => onDeleteAnalysis?.(analysis.id)}
                onExport={() => onExportAnalysis?.(analysis.id)}
                onRerun={() => onRerunAnalysis?.(analysis.id)}
                canExport={canExport}
              />
            ))}

            {/* Locked analyses (blurred) */}
            {lockedAnalyses.length > 0 && (
              <BlurredContent
                isLocked={true}
                lockTitle={`${lockedAnalyses.length} more analyses`}
                lockDescription={historyVisibility.upgradeMessage}
                ctaText="Upgrade to View All"
                onCtaClick={() => onUpgrade?.(historyVisibility.requiredPlan)}
                badge={historyVisibility.requiredPlan.toUpperCase()}
                previewCount={lockedAnalyses.length}
                blurIntensity="md"
              >
                <div className="space-y-3">
                  {lockedAnalyses.slice(0, 2).map(analysis => (
                    <HistoryItem
                      key={analysis.id}
                      analysis={analysis}
                      canExport={false}
                      isLocked
                    />
                  ))}
                </div>
              </BlurredContent>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* History limit notice */}
      {plan === 'free' && analyses.length > 0 && (
        <div
          className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
          data-testid="history-limit-notice"
        >
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Free plan has no history access.{' '}
            <button
              className="font-medium underline hover:no-underline"
              onClick={() => onUpgrade?.('starter')}
            >
              Upgrade to Starter
            </button>{' '}
            for 30 days of history.
          </p>
        </div>
      )}
    </div>
  );
}

// ================================================================
// EMPTY STATES
// ================================================================

function EmptyHistory() {
  return (
    <div className="text-center py-12" data-testid="empty-history">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <ClockIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No analysis history
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        Your analysis history will appear here once you run some analyses.
      </p>
    </div>
  );
}

interface NoResultsStateProps {
  onClear: () => void;
}

function NoResultsState({ onClear }: NoResultsStateProps) {
  return (
    <div className="text-center py-12" data-testid="no-results">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <SearchIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No results found
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Try adjusting your filters or search terms.
      </p>
      <button
        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        onClick={onClear}
        data-testid="clear-search"
      >
        Clear all filters
      </button>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default AnalysisHistory;
