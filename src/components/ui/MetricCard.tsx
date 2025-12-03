'use client';

/**
 * MetricCard Component
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Multiple layout variants (standard, compact, detailed, minimal)
 * - Trend indicators with directional arrows
 * - Sparkline integration
 * - Loading and error states
 * - Color schemes based on performance
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

import React, { useMemo } from 'react';
import { Sparkline } from './Sparkline';

// ============================================================================
// TYPES
// ============================================================================

export type MetricCardVariant = 'standard' | 'compact' | 'detailed' | 'minimal';

export type TrendDirection = 'up' | 'down' | 'neutral';

export type PerformanceLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export interface MetricTrend {
  direction: TrendDirection;
  value: number;
  label?: string;
  period?: string;
}

export interface MetricThreshold {
  excellent?: number;
  good?: number;
  average?: number;
  poor?: number;
}

export interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: MetricTrend;
  sparklineData?: number[];
  description?: string;
  icon?: React.ReactNode;
  variant?: MetricCardVariant;
  thresholds?: MetricThreshold;
  loading?: boolean;
  error?: string;
  onClick?: () => void;
  className?: string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  showPerformanceBadge?: boolean;
  compareValue?: number;
  compareLabel?: string;
  subMetrics?: Array<{ label: string; value: string | number }>;
}

// ============================================================================
// UTILITIES
// ============================================================================

function getPerformanceLevel(
  value: number,
  thresholds: MetricThreshold,
  higherIsBetter: boolean = true
): PerformanceLevel {
  const { excellent, good, average, poor } = thresholds;

  if (higherIsBetter) {
    if (excellent !== undefined && value >= excellent) return 'excellent';
    if (good !== undefined && value >= good) return 'good';
    if (average !== undefined && value >= average) return 'average';
    if (poor !== undefined && value >= poor) return 'poor';
    return 'critical';
  } else {
    if (excellent !== undefined && value <= excellent) return 'excellent';
    if (good !== undefined && value <= good) return 'good';
    if (average !== undefined && value <= average) return 'average';
    if (poor !== undefined && value <= poor) return 'poor';
    return 'critical';
  }
}

const performanceColors: Record<PerformanceLevel, { bg: string; text: string; border: string }> = {
  excellent: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  average: { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  poor: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

const trendColors: Record<TrendDirection, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-500',
};

const trendIcons: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

function formatValue(
  value: number | string,
  precision: number = 0,
  prefix?: string,
  suffix?: string
): string {
  let formatted: string;

  if (typeof value === 'number') {
    if (value >= 1000000) {
      formatted = `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      formatted = `${(value / 1000).toFixed(1)}K`;
    } else {
      formatted = value.toFixed(precision);
    }
  } else {
    formatted = value;
  }

  return `${prefix || ''}${formatted}${suffix || ''}`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TrendIndicatorProps {
  trend: MetricTrend;
  size?: 'sm' | 'md' | 'lg';
}

function TrendIndicator({ trend, size = 'md' }: TrendIndicatorProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-1 ${trendColors[trend.direction]} ${sizeClasses[size]}`}>
      <span>{trendIcons[trend.direction]}</span>
      <span className="font-medium">
        {trend.direction === 'neutral' ? '0' : `${Math.abs(trend.value).toFixed(1)}%`}
      </span>
      {trend.period && (
        <span className="text-gray-500 font-normal">vs {trend.period}</span>
      )}
    </div>
  );
}

interface PerformanceBadgeProps {
  level: PerformanceLevel;
}

function PerformanceBadge({ level }: PerformanceBadgeProps) {
  const colors = performanceColors[level];
  const labels: Record<PerformanceLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    average: 'Average',
    poor: 'Poor',
    critical: 'Critical',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {labels[level]}
    </span>
  );
}

interface LoadingSkeletonProps {
  variant: MetricCardVariant;
}

function LoadingSkeleton({ variant }: LoadingSkeletonProps) {
  if (variant === 'compact' || variant === 'minimal') {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-20 mb-2" />
        <div className="h-6 bg-gray-200 rounded w-16" />
      </div>
    );
  }

  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-16" />
    </div>
  );
}

// ============================================================================
// VARIANT COMPONENTS
// ============================================================================

function StandardVariant({
  title,
  value,
  unit,
  trend,
  sparklineData,
  description,
  icon,
  performanceLevel,
  showPerformanceBadge,
  prefix,
  suffix,
  precision,
  compareValue,
  compareLabel,
}: Omit<MetricCardProps, 'variant' | 'thresholds' | 'loading' | 'error' | 'onClick' | 'className'> & {
  performanceLevel?: PerformanceLevel;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        {showPerformanceBadge && performanceLevel && (
          <PerformanceBadge level={performanceLevel} />
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900">
          {formatValue(value, precision, prefix, suffix)}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>

      {trend && (
        <div className="mt-2">
          <TrendIndicator trend={trend} />
        </div>
      )}

      {compareValue !== undefined && (
        <div className="mt-2 text-sm text-gray-500">
          {compareLabel || 'vs'}: {formatValue(compareValue, precision, prefix, suffix)}
        </div>
      )}

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-12">
          <Sparkline
            data={sparklineData}
            height={48}
            color={performanceLevel ? performanceColors[performanceLevel].text.replace('text-', '#').replace('-700', '') : '#3b82f6'}
            fillColor={performanceLevel ? performanceColors[performanceLevel].text.replace('text-', '#').replace('-700', '') : '#3b82f6'}
            fillOpacity={0.1}
          />
        </div>
      )}

      {description && (
        <p className="mt-3 text-sm text-gray-500">{description}</p>
      )}
    </>
  );
}

function CompactVariant({
  title,
  value,
  trend,
  icon,
  prefix,
  suffix,
  precision,
}: Omit<MetricCardProps, 'variant' | 'thresholds' | 'loading' | 'error' | 'onClick' | 'className'>) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-400 text-sm">{icon}</span>}
        <span className="text-sm text-gray-600">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold text-gray-900">
          {formatValue(value, precision, prefix, suffix)}
        </span>
        {trend && <TrendIndicator trend={trend} size="sm" />}
      </div>
    </div>
  );
}

function DetailedVariant({
  title,
  value,
  unit,
  trend,
  sparklineData,
  description,
  icon,
  performanceLevel,
  showPerformanceBadge,
  prefix,
  suffix,
  precision,
  compareValue,
  compareLabel,
  subMetrics,
}: Omit<MetricCardProps, 'variant' | 'thresholds' | 'loading' | 'error' | 'onClick' | 'className'> & {
  performanceLevel?: PerformanceLevel;
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-400">{icon}</span>}
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          </div>
          {description && (
            <p className="mt-1 text-xs text-gray-400">{description}</p>
          )}
        </div>
        {showPerformanceBadge && performanceLevel && (
          <PerformanceBadge level={performanceLevel} />
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold text-gray-900">
          {formatValue(value, precision, prefix, suffix)}
        </span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>

      <div className="flex items-center gap-4 mt-3">
        {trend && <TrendIndicator trend={trend} size="lg" />}
        {compareValue !== undefined && (
          <span className="text-sm text-gray-500">
            {compareLabel || 'Benchmark'}: {formatValue(compareValue, precision, prefix, suffix)}
          </span>
        )}
      </div>

      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4 h-16">
          <Sparkline
            data={sparklineData}
            height={64}
            fillColor="#3b82f6"
            fillOpacity={0.15}
          />
        </div>
      )}

      {subMetrics && subMetrics.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
          {subMetrics.map((sub, index) => (
            <div key={index}>
              <div className="text-xs text-gray-500">{sub.label}</div>
              <div className="text-sm font-medium text-gray-700">{sub.value}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function MinimalVariant({
  title,
  value,
  trend,
  prefix,
  suffix,
  precision,
}: Omit<MetricCardProps, 'variant' | 'thresholds' | 'loading' | 'error' | 'onClick' | 'className'>) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold text-gray-900">
        {formatValue(value, precision, prefix, suffix)}
      </div>
      <div className="text-xs text-gray-500 mt-1">{title}</div>
      {trend && (
        <div className="mt-1">
          <TrendIndicator trend={trend} size="sm" />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetricCard({
  title,
  value,
  unit,
  trend,
  sparklineData,
  description,
  icon,
  variant = 'standard',
  thresholds,
  loading = false,
  error,
  onClick,
  className = '',
  prefix,
  suffix,
  precision = 0,
  showPerformanceBadge = false,
  compareValue,
  compareLabel,
  subMetrics,
}: MetricCardProps) {
  const performanceLevel = useMemo(() => {
    if (!thresholds || typeof value !== 'number') return undefined;
    return getPerformanceLevel(value, thresholds);
  }, [value, thresholds]);

  const borderColor = performanceLevel
    ? performanceColors[performanceLevel].border
    : 'border-gray-200';

  const baseClasses = `bg-white rounded-lg border ${borderColor} ${
    onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
  } ${className}`;

  const paddingClasses = {
    standard: 'p-5',
    compact: 'p-3',
    detailed: 'p-6',
    minimal: 'p-4',
  };

  if (loading) {
    return (
      <div className={`${baseClasses} ${paddingClasses[variant]}`}>
        <LoadingSkeleton variant={variant} />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${baseClasses} ${paddingClasses[variant]}`}>
        <div className="text-center py-4">
          <div className="text-red-500 text-sm">{error}</div>
        </div>
      </div>
    );
  }

  const commonProps = {
    title,
    value,
    unit,
    trend,
    sparklineData,
    description,
    icon,
    prefix,
    suffix,
    precision,
    compareValue,
    compareLabel,
    subMetrics,
    performanceLevel,
    showPerformanceBadge,
  };

  return (
    <div
      className={`${baseClasses} ${paddingClasses[variant]}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={`${title}: ${formatValue(value, precision, prefix, suffix)}${unit ? ` ${unit}` : ''}`}
    >
      {variant === 'standard' && <StandardVariant {...commonProps} />}
      {variant === 'compact' && <CompactVariant {...commonProps} />}
      {variant === 'detailed' && <DetailedVariant {...commonProps} />}
      {variant === 'minimal' && <MinimalVariant {...commonProps} />}
    </div>
  );
}

// ============================================================================
// METRIC CARD GRID
// ============================================================================

interface MetricCardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricCardGrid({
  children,
  columns = 3,
  gap = 'md',
  className = '',
}: MetricCardGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getPerformanceLevel, formatValue };
export default MetricCard;
