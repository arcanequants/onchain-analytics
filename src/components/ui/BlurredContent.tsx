/**
 * BlurredContent Component
 *
 * Phase 2, Week 4, Day 1
 * Displays locked/gated content with blur effect and upgrade CTA.
 * Creates FOMO by showing valuable content that requires upgrade to access.
 */

'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface BlurredContentProps {
  /** Content to display (will be blurred if locked) */
  children: ReactNode;
  /** Whether content is locked */
  isLocked: boolean;
  /** Title for the lock overlay */
  lockTitle?: string;
  /** Description for the lock overlay */
  lockDescription?: string;
  /** Call-to-action button text */
  ctaText?: string;
  /** Call-to-action click handler */
  onCtaClick?: () => void;
  /** CTA link (alternative to onClick) */
  ctaHref?: string;
  /** Blur intensity (sm, md, lg) */
  blurIntensity?: 'sm' | 'md' | 'lg';
  /** Show preview count (e.g., "3 more items") */
  previewCount?: number;
  /** Icon to show in lock overlay */
  icon?: ReactNode;
  /** Badge text (e.g., "PRO", "STARTER") */
  badge?: string;
  /** Additional CSS classes */
  className?: string;
  /** Overlay variant */
  variant?: 'default' | 'minimal' | 'prominent';
  /** Show gradient fade at bottom */
  showGradientFade?: boolean;
}

// ================================================================
// BLUR INTENSITIES
// ================================================================

const blurClasses = {
  sm: 'blur-[2px]',
  md: 'blur-[4px]',
  lg: 'blur-[8px]',
};

// ================================================================
// ICONS
// ================================================================

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-6 h-6', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function BlurredContent({
  children,
  isLocked,
  lockTitle = 'Upgrade to unlock',
  lockDescription,
  ctaText = 'Upgrade now',
  onCtaClick,
  ctaHref,
  blurIntensity = 'md',
  previewCount,
  icon,
  badge,
  className,
  variant = 'default',
  showGradientFade = true,
}: BlurredContentProps) {
  // If not locked, just render children
  if (!isLocked) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn('relative', className)}
      data-testid="blurred-content"
      aria-hidden={isLocked}
    >
      {/* Blurred content */}
      <div
        className={cn(
          'select-none pointer-events-none',
          blurClasses[blurIntensity]
        )}
        data-testid="blurred-content-inner"
      >
        {children}
      </div>

      {/* Gradient fade overlay */}
      {showGradientFade && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-900 dark:via-gray-900/80"
          data-testid="blurred-gradient"
        />
      )}

      {/* Lock overlay */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          variant === 'prominent' && 'bg-black/10 dark:bg-white/5'
        )}
        data-testid="lock-overlay"
      >
        <div
          className={cn(
            'text-center p-6 rounded-xl max-w-sm',
            variant === 'default' && 'bg-white/95 dark:bg-gray-800/95 shadow-lg border border-gray-200 dark:border-gray-700',
            variant === 'minimal' && 'bg-transparent',
            variant === 'prominent' && 'bg-white dark:bg-gray-800 shadow-2xl border-2 border-blue-500'
          )}
        >
          {/* Badge */}
          {badge && (
            <span
              className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 mb-3"
              data-testid="upgrade-badge"
            >
              {badge}
            </span>
          )}

          {/* Icon */}
          <div className="flex justify-center mb-3">
            {icon || <LockIcon className="text-gray-400 dark:text-gray-500" />}
          </div>

          {/* Title */}
          <h3
            className="text-lg font-semibold text-gray-900 dark:text-white mb-1"
            data-testid="lock-title"
          >
            {lockTitle}
          </h3>

          {/* Description */}
          {lockDescription && (
            <p
              className="text-sm text-gray-600 dark:text-gray-400 mb-4"
              data-testid="lock-description"
            >
              {lockDescription}
            </p>
          )}

          {/* Preview count */}
          {previewCount !== undefined && previewCount > 0 && (
            <p
              className="text-sm text-gray-500 dark:text-gray-400 mb-4"
              data-testid="preview-count"
            >
              <SparklesIcon className="inline-block mr-1 -mt-0.5" />
              {previewCount} more {previewCount === 1 ? 'item' : 'items'} available
            </p>
          )}

          {/* CTA Button */}
          {(onCtaClick || ctaHref) && (
            ctaHref ? (
              <a
                href={ctaHref}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
                data-testid="upgrade-cta"
              >
                {ctaText}
              </a>
            ) : (
              <button
                onClick={onCtaClick}
                className={cn(
                  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
                data-testid="upgrade-cta"
              >
                {ctaText}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// BLURRED LIST VARIANT
// ================================================================

export interface BlurredListProps {
  /** All items (visible + locked) */
  items: ReactNode[];
  /** Number of items to show */
  visibleCount: number;
  /** Render function for each item */
  renderItem?: (item: ReactNode, index: number) => ReactNode;
  /** Lock overlay props */
  lockProps?: Omit<BlurredContentProps, 'children' | 'isLocked'>;
  /** Gap between items */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

export function BlurredList({
  items,
  visibleCount,
  renderItem = (item) => item,
  lockProps = {},
  gap = 'md',
  className,
}: BlurredListProps) {
  const visibleItems = items.slice(0, visibleCount);
  const lockedItems = items.slice(visibleCount);
  const hasLockedItems = lockedItems.length > 0;

  return (
    <div className={cn('flex flex-col', gapClasses[gap], className)} data-testid="blurred-list">
      {/* Visible items */}
      {visibleItems.map((item, index) => (
        <div key={index} data-testid={`visible-item-${index}`}>
          {renderItem(item, index)}
        </div>
      ))}

      {/* Locked items preview */}
      {hasLockedItems && (
        <BlurredContent
          isLocked={true}
          previewCount={lockedItems.length}
          lockTitle={lockProps.lockTitle || 'More insights available'}
          lockDescription={lockProps.lockDescription || `Upgrade to see ${lockedItems.length} more items`}
          {...lockProps}
        >
          <div className={cn('flex flex-col', gapClasses[gap])}>
            {lockedItems.slice(0, 2).map((item, index) => (
              <div key={index} data-testid={`locked-item-${index}`}>
                {renderItem(item, visibleCount + index)}
              </div>
            ))}
          </div>
        </BlurredContent>
      )}
    </div>
  );
}

// ================================================================
// BLURRED CARD VARIANT
// ================================================================

export interface BlurredCardProps extends Omit<BlurredContentProps, 'children'> {
  /** Card content */
  content: ReactNode;
  /** Card header */
  header?: ReactNode;
  /** Card footer (shown when unlocked) */
  footer?: ReactNode;
  /** Card padding */
  padding?: 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function BlurredCard({
  content,
  header,
  footer,
  padding = 'md',
  isLocked,
  ...blurProps
}: BlurredCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
        paddingClasses[padding]
      )}
      data-testid="blurred-card"
    >
      {header && (
        <div className="mb-4" data-testid="card-header">
          {header}
        </div>
      )}

      <BlurredContent isLocked={isLocked} {...blurProps}>
        {content}
      </BlurredContent>

      {!isLocked && footer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700" data-testid="card-footer">
          {footer}
        </div>
      )}
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default BlurredContent;
