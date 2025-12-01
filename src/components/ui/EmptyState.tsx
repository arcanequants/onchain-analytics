'use client';

/**
 * EmptyState Component
 *
 * Phase 1, Week 1, Day 4
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.11
 *
 * Features:
 * - Reusable empty state with illustration
 * - Primary and secondary actions
 * - Multiple variants for different contexts
 * - Responsive design
 * - Dark mode support
 */

import React from 'react';

// ================================================================
// TYPES
// ================================================================

export type EmptyStateVariant =
  | 'no-analyses'      // Dashboard: No analyses yet
  | 'no-mentions'      // Results: Brand not mentioned
  | 'no-history'       // History: No score history
  | 'no-results'       // Search: No search results
  | 'error'            // Error state
  | 'loading-failed'   // Loading failed
  | 'coming-soon'      // Feature coming soon
  | 'custom';          // Custom content

export interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'link';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Preset variant for common empty states */
  variant?: EmptyStateVariant;
  /** Custom title (overrides variant default) */
  title?: string;
  /** Custom description (overrides variant default) */
  description?: string;
  /** Custom icon/illustration (overrides variant default) */
  icon?: React.ReactNode;
  /** Primary action button */
  primaryAction?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional helper text or tip */
  tip?: string;
  /** Custom class name */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

// ================================================================
// VARIANT CONFIGURATIONS
// ================================================================

interface VariantConfig {
  title: string;
  description: string;
  icon: React.ReactNode;
  tip?: string;
}

const getVariantConfig = (variant: EmptyStateVariant): VariantConfig => {
  switch (variant) {
    case 'no-analyses':
      return {
        title: "You haven't analyzed any URLs yet",
        description: 'Discover how AI models perceive your brand in just 30 seconds.',
        icon: <SearchIcon className="w-16 h-16" />,
        tip: 'Start with your main website URL to get your AI Perception Score.',
      };

    case 'no-mentions':
      return {
        title: 'AI models are not mentioning your brand yet',
        description: "This is common - 78% of SMBs aren't visible to AI. The good news? You can improve.",
        icon: <InvisibleIcon className="w-16 h-16" />,
        tip: 'Check your recommendations below for actionable steps.',
      };

    case 'no-history':
      return {
        title: 'Track your progress over time',
        description: 'Your score history will appear here after your second analysis.',
        icon: <ChartIcon className="w-16 h-16" />,
        tip: 'Enable weekly monitoring to track changes automatically.',
      };

    case 'no-results':
      return {
        title: 'No results found',
        description: 'Try adjusting your search or filters to find what you are looking for.',
        icon: <SearchEmptyIcon className="w-16 h-16" />,
      };

    case 'error':
      return {
        title: 'Something went wrong',
        description: 'We encountered an error while processing your request. Please try again.',
        icon: <ErrorIcon className="w-16 h-16" />,
        tip: 'If this problem persists, please contact support.',
      };

    case 'loading-failed':
      return {
        title: 'Failed to load data',
        description: "We couldn't load this content. Please check your connection and try again.",
        icon: <RefreshIcon className="w-16 h-16" />,
      };

    case 'coming-soon':
      return {
        title: 'Coming Soon',
        description: "We're working on this feature. Check back soon!",
        icon: <RocketIcon className="w-16 h-16" />,
      };

    case 'custom':
    default:
      return {
        title: 'Nothing here yet',
        description: 'There is no content to display.',
        icon: <EmptyBoxIcon className="w-16 h-16" />,
      };
  }
};

// ================================================================
// ICONS
// ================================================================

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="28"
      cy="28"
      r="16"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
    />
    <path
      d="M40 40L52 52"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle
      cx="28"
      cy="28"
      r="8"
      className="fill-blue-100 dark:fill-blue-900/30"
    />
    <path
      d="M24 28L28 32L34 24"
      className="stroke-blue-500"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const InvisibleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="32"
      cy="32"
      r="20"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
      strokeDasharray="8 4"
    />
    <circle
      cx="32"
      cy="32"
      r="8"
      className="fill-yellow-100 dark:fill-yellow-900/30"
    />
    <text
      x="32"
      y="37"
      textAnchor="middle"
      className="fill-yellow-600 dark:fill-yellow-400 text-lg font-bold"
    >
      ?
    </text>
  </svg>
);

const ChartIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="8"
      y="48"
      width="8"
      height="8"
      rx="1"
      className="fill-gray-200 dark:fill-gray-700"
    />
    <rect
      x="20"
      y="36"
      width="8"
      height="20"
      rx="1"
      className="fill-gray-200 dark:fill-gray-700"
    />
    <rect
      x="32"
      y="24"
      width="8"
      height="32"
      rx="1"
      className="fill-gray-200 dark:fill-gray-700"
    />
    <rect
      x="44"
      y="16"
      width="8"
      height="40"
      rx="1"
      className="fill-gray-200 dark:fill-gray-700"
    />
    <path
      d="M12 44L24 32L36 20L48 12"
      className="stroke-blue-400 dark:stroke-blue-500"
      strokeWidth="2"
      strokeDasharray="4 2"
      strokeLinecap="round"
    />
  </svg>
);

const SearchEmptyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="26"
      cy="26"
      r="14"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
    />
    <path
      d="M36 36L48 48"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M20 26H32"
      className="stroke-gray-400 dark:stroke-gray-500"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle
      cx="32"
      cy="32"
      r="22"
      className="fill-red-100 dark:fill-red-900/30 stroke-red-300 dark:stroke-red-700"
      strokeWidth="4"
    />
    <path
      d="M32 20V36"
      className="stroke-red-500"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <circle
      cx="32"
      cy="44"
      r="2"
      className="fill-red-500"
    />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M32 12C20.954 12 12 20.954 12 32S20.954 52 32 52"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <path
      d="M32 52C43.046 52 52 43.046 52 32S43.046 12 32 12"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="8 4"
    />
    <path
      d="M52 24V12H40"
      className="stroke-blue-500"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RocketIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M32 8C24 16 20 28 20 36L28 44L36 52C44 44 52 40 52 32L32 8Z"
      className="fill-blue-100 dark:fill-blue-900/30 stroke-blue-400 dark:stroke-blue-500"
      strokeWidth="2"
    />
    <circle
      cx="36"
      cy="28"
      r="4"
      className="fill-blue-400 dark:fill-blue-500"
    />
    <path
      d="M12 48L20 36L28 44L16 52L12 48Z"
      className="fill-orange-200 dark:fill-orange-900/30 stroke-orange-400"
      strokeWidth="2"
    />
  </svg>
);

const EmptyBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M8 24L32 12L56 24V40L32 52L8 40V24Z"
      className="fill-gray-100 dark:fill-gray-800 stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="2"
    />
    <path
      d="M8 24L32 36L56 24"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="2"
    />
    <path
      d="M32 36V52"
      className="stroke-gray-300 dark:stroke-gray-600"
      strokeWidth="2"
    />
  </svg>
);

// ================================================================
// ACTION BUTTON COMPONENT
// ================================================================

const ActionButton: React.FC<EmptyStateAction & { isSecondary?: boolean }> = ({
  label,
  onClick,
  href,
  variant = 'primary',
  icon,
  isSecondary,
}) => {
  const baseClasses = `
    inline-flex items-center justify-center gap-2
    px-4 py-2 rounded-lg font-medium text-sm
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variantClasses = {
    primary: `
      bg-blue-600 text-white
      hover:bg-blue-700
      focus:ring-blue-500
      shadow-sm
    `,
    secondary: `
      bg-gray-100 text-gray-700
      hover:bg-gray-200
      focus:ring-gray-400
      dark:bg-gray-800 dark:text-gray-300
      dark:hover:bg-gray-700
    `,
    link: `
      text-blue-600 hover:text-blue-700
      dark:text-blue-400 dark:hover:text-blue-300
      underline-offset-2 hover:underline
    `,
  };

  const className = `${baseClasses} ${variantClasses[variant]}`;

  const content = (
    <>
      {icon && <span className="w-4 h-4">{icon}</span>}
      {label}
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};

// ================================================================
// MAIN EMPTY STATE COMPONENT
// ================================================================

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'custom',
  title: customTitle,
  description: customDescription,
  icon: customIcon,
  primaryAction,
  secondaryAction,
  tip,
  className = '',
  size = 'md',
}) => {
  const config = getVariantConfig(variant);

  const title = customTitle ?? config.title;
  const description = customDescription ?? config.description;
  const icon = customIcon ?? config.icon;
  const displayTip = tip ?? config.tip;

  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      icon: 'w-12 h-12',
      title: 'text-base',
      description: 'text-sm',
    },
    md: {
      container: 'py-12 px-6',
      icon: 'w-16 h-16',
      title: 'text-lg',
      description: 'text-sm',
    },
    lg: {
      container: 'py-16 px-8',
      icon: 'w-20 h-20',
      title: 'text-xl',
      description: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        ${sizes.container}
        ${className}
      `}
      role="status"
      aria-label={title}
    >
      {/* Icon/Illustration */}
      <div className={`mb-4 text-gray-400 dark:text-gray-500 ${sizes.icon}`}>
        {icon}
      </div>

      {/* Title */}
      <h3
        className={`
          font-semibold text-gray-900 dark:text-gray-100
          ${sizes.title}
          mb-2
        `}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        className={`
          text-gray-500 dark:text-gray-400
          ${sizes.description}
          max-w-md mb-6
        `}
      >
        {description}
      </p>

      {/* Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {primaryAction && <ActionButton {...primaryAction} />}
          {secondaryAction && <ActionButton {...secondaryAction} isSecondary />}
        </div>
      )}

      {/* Tip */}
      {displayTip && (
        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
          <span className="text-blue-500">Tip:</span>
          {displayTip}
        </p>
      )}
    </div>
  );
};

// ================================================================
// SPECIALIZED VARIANTS
// ================================================================

export interface NoAnalysesEmptyStateProps {
  onAnalyzeClick?: () => void;
  analyzeHref?: string;
}

export const NoAnalysesEmptyState: React.FC<NoAnalysesEmptyStateProps> = ({
  onAnalyzeClick,
  analyzeHref,
}) => (
  <EmptyState
    variant="no-analyses"
    primaryAction={{
      label: 'Analyze Your First URL',
      onClick: onAnalyzeClick,
      href: analyzeHref,
    }}
    secondaryAction={{
      label: 'Learn how it works',
      href: '/how-it-works',
      variant: 'link',
    }}
  />
);

export interface NoHistoryEmptyStateProps {
  onEnableMonitoring?: () => void;
}

export const NoHistoryEmptyState: React.FC<NoHistoryEmptyStateProps> = ({
  onEnableMonitoring,
}) => (
  <EmptyState
    variant="no-history"
    primaryAction={
      onEnableMonitoring
        ? {
            label: 'Enable Weekly Monitoring',
            onClick: onEnableMonitoring,
          }
        : undefined
    }
  />
);

export interface ErrorEmptyStateProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export const ErrorEmptyState: React.FC<ErrorEmptyStateProps> = ({
  onRetry,
  errorMessage,
}) => (
  <EmptyState
    variant="error"
    description={errorMessage || 'We encountered an error while processing your request. Please try again.'}
    primaryAction={
      onRetry
        ? {
            label: 'Try Again',
            onClick: onRetry,
          }
        : undefined
    }
    secondaryAction={{
      label: 'Contact Support',
      href: '/support',
      variant: 'link',
    }}
  />
);

// ================================================================
// EXPORTS
// ================================================================

export default EmptyState;
