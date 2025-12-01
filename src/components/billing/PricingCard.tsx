/**
 * Pricing Card Component
 *
 * Displays plan pricing with features and actions
 *
 * Phase 2, Week 5, Day 4
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  type PlanConfig,
  formatPrice,
  getAnnualSavingsPercent,
} from '@/lib/stripe/config';

// ================================================================
// TYPES
// ================================================================

export interface PricingCardProps {
  plan: PlanConfig;
  isCurrentPlan?: boolean;
  isAnnual?: boolean;
  onSelect?: (planId: string, isAnnual: boolean) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

// ================================================================
// CHECK ICON COMPONENT
// ================================================================

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn('w-5 h-5', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function PricingCard({
  plan,
  isCurrentPlan = false,
  isAnnual = false,
  onSelect,
  isLoading = false,
  disabled = false,
  className,
}: PricingCardProps) {
  const price = isAnnual ? plan.priceAnnual / 12 : plan.price;
  const formattedPrice = formatPrice(price);
  const savingsPercent = getAnnualSavingsPercent(plan);
  const isFree = plan.price === 0;

  const handleSelect = () => {
    if (!disabled && !isLoading && onSelect) {
      onSelect(plan.id, isAnnual);
    }
  };

  return (
    <div
      data-testid={`pricing-card-${plan.id}`}
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white dark:bg-gray-900 transition-all',
        plan.popular
          ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02]'
          : 'border-gray-200 dark:border-gray-700',
        isCurrentPlan && 'ring-2 ring-green-500',
        className
      )}
    >
      {/* Popular Badge */}
      {plan.popular && (
        <div
          data-testid={`popular-badge-${plan.id}`}
          className="absolute -top-4 left-1/2 -translate-x-1/2"
        >
          <span className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-blue-500 text-white shadow-lg">
            Most Popular
          </span>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrentPlan && (
        <div
          data-testid={`current-plan-badge-${plan.id}`}
          className="absolute -top-4 right-4"
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white">
            Current Plan
          </span>
        </div>
      )}

      {/* Header */}
      <div className={cn('p-6 pb-0', plan.popular && 'pt-8')}>
        <h3
          data-testid={`plan-name-${plan.id}`}
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {plan.name}
        </h3>
        <p
          data-testid={`plan-description-${plan.id}`}
          className="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {plan.description}
        </p>
      </div>

      {/* Price */}
      <div className="p-6">
        <div className="flex items-baseline">
          <span
            data-testid={`plan-price-${plan.id}`}
            className="text-4xl font-bold text-gray-900 dark:text-white"
          >
            {formattedPrice}
          </span>
          {!isFree && (
            <span className="ml-1 text-gray-500 dark:text-gray-400">/month</span>
          )}
        </div>

        {/* Annual Savings */}
        {!isFree && isAnnual && savingsPercent > 0 && (
          <div
            data-testid={`annual-savings-${plan.id}`}
            className="mt-1 text-sm text-green-600 dark:text-green-400"
          >
            Save {savingsPercent}% with annual billing
          </div>
        )}

        {/* Billing Note */}
        {!isFree && (
          <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {isAnnual ? 'Billed annually' : 'Billed monthly'}
          </div>
        )}
      </div>

      {/* Features */}
      <div className="flex-1 p-6 pt-0">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li
              key={index}
              data-testid={`feature-${plan.id}-${index}`}
              className="flex items-start gap-3"
            >
              <CheckIcon className="flex-shrink-0 text-green-500 mt-0.5" />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div className="p-6 pt-0">
        <button
          data-testid={`select-plan-${plan.id}`}
          onClick={handleSelect}
          disabled={disabled || isLoading || isCurrentPlan}
          className={cn(
            'w-full py-3 px-4 rounded-lg font-medium transition-all',
            plan.popular
              ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
              : isFree
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
                : 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100',
            (disabled || isCurrentPlan) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
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
              Processing...
            </span>
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : isFree ? (
            'Get Started Free'
          ) : (
            `Upgrade to ${plan.name}`
          )}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// BILLING TOGGLE COMPONENT
// ================================================================

export interface BillingToggleProps {
  isAnnual: boolean;
  onChange: (isAnnual: boolean) => void;
  className?: string;
}

export function BillingToggle({
  isAnnual,
  onChange,
  className,
}: BillingToggleProps) {
  return (
    <div
      data-testid="billing-toggle"
      className={cn('flex items-center justify-center gap-4', className)}
    >
      <span
        className={cn(
          'text-sm font-medium transition-colors',
          !isAnnual
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        Monthly
      </span>

      <button
        data-testid="billing-toggle-button"
        onClick={() => onChange(!isAnnual)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          isAnnual ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
        )}
        role="switch"
        aria-checked={isAnnual}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            isAnnual ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      <span
        className={cn(
          'text-sm font-medium transition-colors',
          isAnnual
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400'
        )}
      >
        Annual
        <span className="ml-1 text-green-600 dark:text-green-400">(Save 17%)</span>
      </span>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default PricingCard;
