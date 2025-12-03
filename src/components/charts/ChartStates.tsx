'use client';

/**
 * ChartStates - Error and Empty States for Charts
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - ChartError with retry action
 * - ChartEmpty with customizable messages
 * - Consistent styling across chart types
 * - Recovery actions
 * - Accessible design
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ChartStateSize = 'sm' | 'md' | 'lg';

export interface ChartErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  size?: ChartStateSize;
  className?: string;
}

export interface ChartEmptyProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  size?: ChartStateSize;
  className?: string;
}

// ============================================================================
// ICONS
// ============================================================================

function ErrorIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-red-500"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function EmptyIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  );
}

function RefreshIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

function ChartIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-gray-400"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const sizeConfig = {
  sm: {
    iconSize: 32,
    padding: 'p-4',
    titleSize: 'text-sm',
    messageSize: 'text-xs',
    buttonSize: 'text-xs px-2 py-1',
  },
  md: {
    iconSize: 48,
    padding: 'p-6',
    titleSize: 'text-base',
    messageSize: 'text-sm',
    buttonSize: 'text-sm px-3 py-1.5',
  },
  lg: {
    iconSize: 64,
    padding: 'p-8',
    titleSize: 'text-lg',
    messageSize: 'text-base',
    buttonSize: 'text-base px-4 py-2',
  },
};

// ============================================================================
// CHART ERROR COMPONENT
// ============================================================================

export function ChartError({
  title = 'Failed to load chart',
  message = 'There was an error loading the chart data. Please try again.',
  onRetry,
  retryLabel = 'Retry',
  size = 'md',
  className = '',
}: ChartErrorProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        bg-red-50 border border-red-200 rounded-lg
        ${config.padding}
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <ErrorIcon size={config.iconSize} />

      <h3 className={`mt-3 font-medium text-red-800 ${config.titleSize}`}>
        {title}
      </h3>

      <p className={`mt-1 text-red-600 max-w-xs ${config.messageSize}`}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className={`
            mt-4 inline-flex items-center gap-1.5
            bg-red-100 text-red-700 rounded-md
            hover:bg-red-200 transition-colors
            focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
            ${config.buttonSize}
          `}
        >
          <RefreshIcon size={size === 'sm' ? 12 : 16} />
          {retryLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// CHART EMPTY COMPONENT
// ============================================================================

export function ChartEmpty({
  title = 'No data available',
  message = 'There is no data to display in this chart yet.',
  icon,
  action,
  size = 'md',
  className = '',
}: ChartEmptyProps) {
  const config = sizeConfig[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        bg-gray-50 border border-gray-200 border-dashed rounded-lg
        ${config.padding}
        ${className}
      `}
      role="status"
      aria-label={title}
    >
      {icon || <ChartIcon size={config.iconSize} />}

      <h3 className={`mt-3 font-medium text-gray-700 ${config.titleSize}`}>
        {title}
      </h3>

      <p className={`mt-1 text-gray-500 max-w-xs ${config.messageSize}`}>
        {message}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className={`
            mt-4 inline-flex items-center gap-1.5
            bg-blue-600 text-white rounded-md
            hover:bg-blue-700 transition-colors
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            ${config.buttonSize}
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// NO DATA VARIANTS
// ============================================================================

export function ChartNoConnection({
  onRetry,
  size = 'md',
  className = '',
}: {
  onRetry?: () => void;
  size?: ChartStateSize;
  className?: string;
}) {
  return (
    <ChartError
      title="Connection error"
      message="Unable to connect to the data source. Check your internet connection and try again."
      onRetry={onRetry}
      retryLabel="Try again"
      size={size}
      className={className}
    />
  );
}

export function ChartTimeout({
  onRetry,
  size = 'md',
  className = '',
}: {
  onRetry?: () => void;
  size?: ChartStateSize;
  className?: string;
}) {
  return (
    <ChartError
      title="Request timed out"
      message="The request took too long to complete. Please try again."
      onRetry={onRetry}
      retryLabel="Retry"
      size={size}
      className={className}
    />
  );
}

export function ChartNoPermission({
  size = 'md',
  className = '',
}: {
  size?: ChartStateSize;
  className?: string;
}) {
  return (
    <ChartEmpty
      title="Access denied"
      message="You don't have permission to view this data. Contact your administrator for access."
      icon={
        <svg
          width={sizeConfig[size].iconSize}
          height={sizeConfig[size].iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-yellow-500"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      }
      size={size}
      className={className}
    />
  );
}

export function ChartComingSoon({
  size = 'md',
  className = '',
}: {
  size?: ChartStateSize;
  className?: string;
}) {
  return (
    <ChartEmpty
      title="Coming soon"
      message="This visualization is currently under development and will be available soon."
      icon={
        <svg
          width={sizeConfig[size].iconSize}
          height={sizeConfig[size].iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-blue-400"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      }
      size={size}
      className={className}
    />
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default { ChartError, ChartEmpty };
