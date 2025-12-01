/**
 * Upgrade Prompt Components
 *
 * Phase 2, Week 4, Day 1
 * Strategic CTAs for encouraging users to upgrade their plan.
 * Designed to appear at key moments in the user journey.
 */

'use client';

import { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type PlanTier,
  type UpgradeTrigger,
  PLAN_LIMITS,
  formatPrice,
  getAnnualSavings,
} from '@/lib/freemium';

// ================================================================
// TYPES
// ================================================================

export interface UpgradePromptProps {
  /** Upgrade trigger data */
  trigger?: UpgradeTrigger;
  /** Plan to recommend */
  recommendedPlan?: PlanTier;
  /** Custom title */
  title?: string;
  /** Custom description */
  description?: string;
  /** Custom CTA text */
  ctaText?: string;
  /** CTA click handler */
  onCtaClick?: () => void;
  /** CTA href (alternative to onClick) */
  ctaHref?: string;
  /** Secondary action text */
  secondaryText?: string;
  /** Secondary action handler */
  onSecondaryClick?: () => void;
  /** Whether to show dismiss button */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Variant style */
  variant?: 'inline' | 'banner' | 'modal' | 'toast' | 'card';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Position for banner variant */
  position?: 'top' | 'bottom';
  /** Icon to display */
  icon?: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Show pricing info */
  showPricing?: boolean;
  /** Show features list */
  showFeatures?: boolean;
  /** Highlight features */
  highlightFeatures?: string[];
}

// ================================================================
// ICONS
// ================================================================

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-4 h-4', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getDefaultIcon(trigger?: UpgradeTrigger): ReactNode {
  if (!trigger) return <SparklesIcon className="text-blue-500" />;

  switch (trigger.type) {
    case 'quota_reached':
      return <ChartIcon className="text-amber-500" />;
    case 'limit_approaching':
      return <ChartIcon className="text-amber-400" />;
    case 'feature_locked':
      return <RocketIcon className="text-purple-500" />;
    case 'value_shown':
      return <SparklesIcon className="text-blue-500" />;
    default:
      return <SparklesIcon className="text-blue-500" />;
  }
}

function getDefaultTitle(trigger?: UpgradeTrigger): string {
  if (!trigger) return 'Unlock more features';

  switch (trigger.type) {
    case 'quota_reached':
      return "You've reached your limit";
    case 'limit_approaching':
      return 'Running low on analyses';
    case 'feature_locked':
      return trigger.message || 'Unlock this feature';
    case 'value_shown':
      return 'Get even more value';
    default:
      return 'Upgrade your plan';
  }
}

function getPlanFeatures(plan: PlanTier): string[] {
  const features: Record<PlanTier, string[]> = {
    free: ['5 analyses/month', '2 AI providers', 'Basic insights'],
    starter: [
      '100 analyses/month',
      'All 4 AI providers',
      'All recommendations',
      '3 competitor comparisons',
      'Weekly monitoring',
      'Export reports',
    ],
    pro: [
      '500 analyses/month',
      'All 4 AI providers',
      'All recommendations',
      '10 competitor comparisons',
      'Daily monitoring',
      'API access',
      'Priority support',
    ],
    enterprise: [
      'Unlimited analyses',
      'All features',
      'Hourly monitoring',
      'Custom branding',
      'White-label reports',
      'Dedicated support',
    ],
  };

  return features[plan] || features.starter;
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function UpgradePrompt({
  trigger,
  recommendedPlan,
  title,
  description,
  ctaText,
  onCtaClick,
  ctaHref,
  secondaryText,
  onSecondaryClick,
  dismissible = false,
  onDismiss,
  variant = 'inline',
  size = 'md',
  position = 'bottom',
  icon,
  className,
  showPricing = false,
  showFeatures = false,
  highlightFeatures = [],
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const plan = recommendedPlan || trigger?.recommendedPlan || 'starter';
  const planConfig = PLAN_LIMITS[plan];
  const displayTitle = title || trigger?.message || getDefaultTitle(trigger);
  const displayCta = ctaText || trigger?.ctaText || `Upgrade to ${planConfig.name}`;
  const displayIcon = icon || getDefaultIcon(trigger);

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6',
  };

  // Render based on variant
  switch (variant) {
    case 'banner':
      return (
        <div
          className={cn(
            'w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white',
            position === 'top' ? 'sticky top-0 z-50' : 'fixed bottom-0 left-0 right-0 z-50',
            sizeClasses[size],
            className
          )}
          data-testid="upgrade-banner"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {displayIcon}
              <span className="font-medium">{displayTitle}</span>
              {description && (
                <span className="hidden md:inline text-white/80">- {description}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {(onCtaClick || ctaHref) && (
                ctaHref ? (
                  <a
                    href={ctaHref}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    data-testid="upgrade-cta"
                  >
                    {displayCta}
                  </a>
                ) : (
                  <button
                    onClick={onCtaClick}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    data-testid="upgrade-cta"
                  >
                    {displayCta}
                  </button>
                )
              )}
              {dismissible && (
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                  aria-label="Dismiss"
                  data-testid="dismiss-button"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      );

    case 'toast':
      return (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
            sizeClasses[size],
            className
          )}
          data-testid="upgrade-toast"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">{displayIcon}</div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white">{displayTitle}</p>
              {description && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
              )}
              <div className="mt-3 flex gap-2">
                {(onCtaClick || ctaHref) && (
                  ctaHref ? (
                    <a
                      href={ctaHref}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                      data-testid="upgrade-cta"
                    >
                      {displayCta}
                    </a>
                  ) : (
                    <button
                      onClick={onCtaClick}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors"
                      data-testid="upgrade-cta"
                    >
                      {displayCta}
                    </button>
                  )
                )}
                {secondaryText && onSecondaryClick && (
                  <button
                    onClick={onSecondaryClick}
                    className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                    data-testid="secondary-action"
                  >
                    {secondaryText}
                  </button>
                )}
              </div>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Dismiss"
                data-testid="dismiss-button"
              >
                <CloseIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      );

    case 'card':
      return (
        <div
          className={cn(
            'bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden',
            sizeClasses[size],
            className
          )}
          data-testid="upgrade-card"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {displayIcon}
              <h3 className="font-semibold text-gray-900 dark:text-white">{displayTitle}</h3>
            </div>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Dismiss"
                data-testid="dismiss-button"
              >
                <CloseIcon className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
          )}

          {/* Pricing */}
          {showPricing && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg" data-testid="pricing-section">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(planConfig.priceMonthly)}
                </span>
                {planConfig.priceMonthly > 0 && (
                  <>
                    <span className="text-gray-500">or</span>
                    <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      {formatPrice(planConfig.priceAnnual, true)}
                    </span>
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                      Save {getAnnualSavings(plan)}%
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Features */}
          {showFeatures && (
            <ul className="space-y-2 mb-4" data-testid="features-list">
              {getPlanFeatures(plan).map((feature, index) => (
                <li
                  key={index}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    highlightFeatures.includes(feature)
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400'
                  )}
                >
                  <CheckIcon
                    className={cn(
                      highlightFeatures.includes(feature)
                        ? 'text-blue-500'
                        : 'text-green-500'
                    )}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {(onCtaClick || ctaHref) && (
              ctaHref ? (
                <a
                  href={ctaHref}
                  className="flex-1 text-center px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  data-testid="upgrade-cta"
                >
                  {displayCta}
                </a>
              ) : (
                <button
                  onClick={onCtaClick}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  data-testid="upgrade-cta"
                >
                  {displayCta}
                </button>
              )
            )}
            {secondaryText && onSecondaryClick && (
              <button
                onClick={onSecondaryClick}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                data-testid="secondary-action"
              >
                {secondaryText}
              </button>
            )}
          </div>
        </div>
      );

    case 'modal':
      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          data-testid="upgrade-modal"
        >
          <div
            className={cn(
              'bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full mx-4',
              sizeClasses[size],
              className
            )}
          >
            <UpgradePrompt
              {...{
                trigger,
                recommendedPlan,
                title,
                description,
                ctaText,
                onCtaClick,
                ctaHref,
                secondaryText,
                onSecondaryClick,
                dismissible: true,
                onDismiss: handleDismiss,
                icon,
                showPricing,
                showFeatures,
                highlightFeatures,
              }}
              variant="card"
              className="border-0 shadow-none"
            />
          </div>
        </div>
      );

    case 'inline':
    default:
      return (
        <div
          className={cn(
            'flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg',
            sizeClasses[size],
            className
          )}
          data-testid="upgrade-inline"
        >
          <div className="flex-shrink-0">{displayIcon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-blue-900 dark:text-blue-100">{displayTitle}</p>
            {description && (
              <p className="text-sm text-blue-700 dark:text-blue-300">{description}</p>
            )}
          </div>
          {(onCtaClick || ctaHref) && (
            ctaHref ? (
              <a
                href={ctaHref}
                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                data-testid="upgrade-cta"
              >
                {displayCta}
              </a>
            ) : (
              <button
                onClick={onCtaClick}
                className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                data-testid="upgrade-cta"
              >
                {displayCta}
              </button>
            )
          )}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
              aria-label="Dismiss"
              data-testid="dismiss-button"
            >
              <CloseIcon className="w-4 h-4 text-blue-500" />
            </button>
          )}
        </div>
      );
  }
}

// ================================================================
// USAGE PROGRESS BAR
// ================================================================

export interface UsageProgressProps {
  /** Current usage */
  used: number;
  /** Total limit */
  limit: number;
  /** Label */
  label?: string;
  /** Show percentage */
  showPercent?: boolean;
  /** Show upgrade CTA when near limit */
  showUpgradeCta?: boolean;
  /** Upgrade CTA click handler */
  onUpgradeClick?: () => void;
  /** Warning threshold percentage */
  warningThreshold?: number;
  /** Danger threshold percentage */
  dangerThreshold?: number;
  /** Additional CSS classes */
  className?: string;
}

export function UsageProgress({
  used,
  limit,
  label = 'Usage',
  showPercent = true,
  showUpgradeCta = true,
  onUpgradeClick,
  warningThreshold = 70,
  dangerThreshold = 90,
  className,
}: UsageProgressProps) {
  const percent = Math.min(100, (used / limit) * 100);
  const isWarning = percent >= warningThreshold;
  const isDanger = percent >= dangerThreshold;

  return (
    <div className={cn('space-y-2', className)} data-testid="usage-progress">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span
          className={cn(
            'font-medium',
            isDanger
              ? 'text-red-600 dark:text-red-400'
              : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-white'
          )}
        >
          {used} / {limit === Infinity ? 'Unlimited' : limit}
          {showPercent && limit !== Infinity && (
            <span className="ml-1 text-gray-500">({Math.round(percent)}%)</span>
          )}
        </span>
      </div>

      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300',
            isDanger
              ? 'bg-red-500'
              : isWarning
                ? 'bg-amber-500'
                : 'bg-blue-500'
          )}
          style={{ width: `${percent}%` }}
          data-testid="progress-bar"
        />
      </div>

      {showUpgradeCta && isDanger && onUpgradeClick && (
        <button
          onClick={onUpgradeClick}
          className="w-full mt-2 px-3 py-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
          data-testid="usage-upgrade-cta"
        >
          Upgrade for more analyses
        </button>
      )}
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default UpgradePrompt;
