/**
 * Dashboard Empty States
 *
 * Phase 2, Week 4, Day 2
 * Reusable empty state components for various dashboard sections.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface EmptyStateProps {
  /** Icon to display */
  icon?: ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Additional content */
  children?: ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function CompetitorIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-12 h-12', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

// ================================================================
// SIZE CONFIGURATIONS
// ================================================================

const sizeConfig = {
  sm: {
    container: 'py-6',
    iconWrapper: 'w-12 h-12',
    title: 'text-base',
    description: 'text-sm',
    button: 'px-3 py-1.5 text-sm',
  },
  md: {
    container: 'py-12',
    iconWrapper: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-base',
    button: 'px-4 py-2 text-sm',
  },
  lg: {
    container: 'py-16',
    iconWrapper: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-base',
    button: 'px-5 py-2.5 text-base',
  },
};

// ================================================================
// BASE EMPTY STATE COMPONENT
// ================================================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  children,
  size = 'md',
  className,
}: EmptyStateProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={cn('text-center', config.container, className)}
      data-testid="empty-state"
    >
      {/* Icon */}
      {icon && (
        <div
          className={cn(
            'mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center',
            config.iconWrapper
          )}
          data-testid="empty-state-icon"
        >
          {icon}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'font-medium text-gray-900 dark:text-white mb-1',
          config.title
        )}
        data-testid="empty-state-title"
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto',
            config.description
          )}
          data-testid="empty-state-description"
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center justify-center gap-3" data-testid="empty-state-actions">
          {action && (
            <button
              onClick={action.onClick}
              className={cn(
                'rounded-lg font-medium transition-colors',
                config.button,
                action.variant === 'secondary'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              )}
              data-testid="empty-state-action"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className={cn(
                'rounded-lg font-medium transition-colors',
                config.button,
                'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              data-testid="empty-state-secondary-action"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Additional content */}
      {children && (
        <div className="mt-4" data-testid="empty-state-children">
          {children}
        </div>
      )}
    </div>
  );
}

// ================================================================
// PRESET EMPTY STATES
// ================================================================

/**
 * Empty state for when no analyses exist
 */
export interface NoAnalysesProps {
  onRunAnalysis?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoAnalyses({ onRunAnalysis, size = 'md', className }: NoAnalysesProps) {
  return (
    <EmptyState
      icon={<AnalysisIcon className="text-gray-400" />}
      title="No analyses yet"
      description="Run your first analysis to see how AI perceives your website and get actionable recommendations."
      action={
        onRunAnalysis
          ? { label: 'Run Analysis', onClick: onRunAnalysis }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no history (free users)
 */
export interface NoHistoryProps {
  reason?: 'empty' | 'locked';
  onUpgrade?: () => void;
  onRunAnalysis?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoHistory({
  reason = 'empty',
  onUpgrade,
  onRunAnalysis,
  size = 'md',
  className,
}: NoHistoryProps) {
  if (reason === 'locked') {
    return (
      <EmptyState
        icon={<LockIcon className="text-gray-400" />}
        title="History locked"
        description="Upgrade to access your analysis history and track your progress over time."
        action={
          onUpgrade
            ? { label: 'Upgrade to Unlock', onClick: onUpgrade }
            : undefined
        }
        size={size}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={<HistoryIcon className="text-gray-400" />}
      title="No history yet"
      description="Your analysis history will appear here once you run some analyses."
      action={
        onRunAnalysis
          ? { label: 'Run Analysis', onClick: onRunAnalysis }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no search results
 */
export interface NoSearchResultsProps {
  query?: string;
  onClearSearch?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoSearchResults({
  query,
  onClearSearch,
  size = 'md',
  className,
}: NoSearchResultsProps) {
  return (
    <EmptyState
      icon={<SearchIcon className="text-gray-400" />}
      title="No results found"
      description={
        query
          ? `No analyses match "${query}". Try adjusting your search.`
          : 'Try adjusting your filters or search terms.'
      }
      action={
        onClearSearch
          ? { label: 'Clear Search', onClick: onClearSearch, variant: 'secondary' }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no competitors
 */
export interface NoCompetitorsProps {
  reason?: 'empty' | 'locked';
  onAddCompetitor?: () => void;
  onUpgrade?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoCompetitors({
  reason = 'empty',
  onAddCompetitor,
  onUpgrade,
  size = 'md',
  className,
}: NoCompetitorsProps) {
  if (reason === 'locked') {
    return (
      <EmptyState
        icon={<LockIcon className="text-gray-400" />}
        title="Competitor analysis locked"
        description="Upgrade to compare your website against competitors and see how you stack up."
        action={
          onUpgrade
            ? { label: 'Upgrade to Unlock', onClick: onUpgrade }
            : undefined
        }
        size={size}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={<CompetitorIcon className="text-gray-400" />}
      title="No competitors added"
      description="Add competitor websites to compare your AI perception score and recommendations."
      action={
        onAddCompetitor
          ? { label: 'Add Competitor', onClick: onAddCompetitor }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no saved URLs
 */
export interface NoSavedUrlsProps {
  onAddUrl?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoSavedUrls({
  onAddUrl,
  size = 'md',
  className,
}: NoSavedUrlsProps) {
  return (
    <EmptyState
      icon={<BookmarkIcon className="text-gray-400" />}
      title="No saved URLs"
      description="Save URLs for quick access to re-run analyses or track changes over time."
      action={
        onAddUrl
          ? { label: 'Save URL', onClick: onAddUrl }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no monitoring
 */
export interface NoMonitoringProps {
  reason?: 'empty' | 'locked';
  onSetupMonitoring?: () => void;
  onUpgrade?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoMonitoring({
  reason = 'empty',
  onSetupMonitoring,
  onUpgrade,
  size = 'md',
  className,
}: NoMonitoringProps) {
  if (reason === 'locked') {
    return (
      <EmptyState
        icon={<LockIcon className="text-gray-400" />}
        title="Monitoring locked"
        description="Upgrade to enable automatic monitoring and get alerts when your AI perception changes."
        action={
          onUpgrade
            ? { label: 'Upgrade to Unlock', onClick: onUpgrade }
            : undefined
        }
        size={size}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={<MonitorIcon className="text-gray-400" />}
      title="No monitoring set up"
      description="Enable monitoring to automatically track your AI perception score over time."
      action={
        onSetupMonitoring
          ? { label: 'Set Up Monitoring', onClick: onSetupMonitoring }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Empty state for no reports
 */
export interface NoReportsProps {
  reason?: 'empty' | 'locked';
  onCreateReport?: () => void;
  onUpgrade?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function NoReports({
  reason = 'empty',
  onCreateReport,
  onUpgrade,
  size = 'md',
  className,
}: NoReportsProps) {
  if (reason === 'locked') {
    return (
      <EmptyState
        icon={<LockIcon className="text-gray-400" />}
        title="Reports locked"
        description="Upgrade to create and export detailed PDF reports of your analyses."
        action={
          onUpgrade
            ? { label: 'Upgrade to Unlock', onClick: onUpgrade }
            : undefined
        }
        size={size}
        className={className}
      />
    );
  }

  return (
    <EmptyState
      icon={<FileTextIcon className="text-gray-400" />}
      title="No reports yet"
      description="Create reports to share your analysis results with your team or clients."
      action={
        onCreateReport
          ? { label: 'Create Report', onClick: onCreateReport }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

/**
 * Generic error state
 */
export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  size?: EmptyStateProps['size'];
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  onRetry,
  size = 'md',
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={<AlertIcon className="text-red-400" />}
      title={title}
      description={message}
      action={
        onRetry
          ? { label: 'Try Again', onClick: onRetry }
          : undefined
      }
      size={size}
      className={className}
    />
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default EmptyState;
