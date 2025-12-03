'use client';

/**
 * Comparison Chart Component
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Multiple chart variants: dot, bar, bullet
 * - Support for comparing multiple items
 * - Confidence interval visualization
 * - Target/benchmark lines
 * - Responsive design
 * - Accessible with ARIA labels
 */

import React, { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ComparisonItem {
  id: string;
  label: string;
  value: number;
  target?: number;
  benchmark?: number;
  confidenceInterval?: {
    lower: number;
    upper: number;
  };
  color?: string;
  metadata?: Record<string, unknown>;
}

export type ChartVariant = 'dot' | 'bar' | 'bullet' | 'lollipop';

export interface ComparisonChartProps {
  items: ComparisonItem[];
  variant?: ChartVariant;
  title?: string;
  subtitle?: string;
  minValue?: number;
  maxValue?: number;
  showTarget?: boolean;
  showBenchmark?: boolean;
  showConfidenceInterval?: boolean;
  showValues?: boolean;
  showDelta?: boolean;
  orientation?: 'horizontal' | 'vertical';
  sortBy?: 'value' | 'label' | 'none';
  sortOrder?: 'asc' | 'desc';
  colorScheme?: 'default' | 'semantic' | 'monochrome';
  height?: number;
  className?: string;
  onItemClick?: (item: ComparisonItem) => void;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

function getSemanticColor(value: number, max: number = 100): string {
  const percentage = (value / max) * 100;
  if (percentage >= 80) return '#10b981'; // green
  if (percentage >= 60) return '#3b82f6'; // blue
  if (percentage >= 40) return '#f59e0b'; // amber
  if (percentage >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getItemColor(
  item: ComparisonItem,
  index: number,
  colorScheme: 'default' | 'semantic' | 'monochrome',
  maxValue: number
): string {
  if (item.color) return item.color;

  switch (colorScheme) {
    case 'semantic':
      return getSemanticColor(item.value, maxValue);
    case 'monochrome':
      return '#6b7280';
    default:
      return defaultColors[index % defaultColors.length];
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DotChartRowProps {
  item: ComparisonItem;
  minValue: number;
  maxValue: number;
  color: string;
  showTarget: boolean;
  showBenchmark: boolean;
  showConfidenceInterval: boolean;
  showValues: boolean;
  showDelta: boolean;
  onClick?: () => void;
}

function DotChartRow({
  item,
  minValue,
  maxValue,
  color,
  showTarget,
  showBenchmark,
  showConfidenceInterval,
  showValues,
  showDelta,
  onClick,
}: DotChartRowProps) {
  const range = maxValue - minValue;
  const valuePosition = ((item.value - minValue) / range) * 100;

  const targetPosition = item.target !== undefined
    ? ((item.target - minValue) / range) * 100
    : null;

  const benchmarkPosition = item.benchmark !== undefined
    ? ((item.benchmark - minValue) / range) * 100
    : null;

  const delta = item.target !== undefined ? item.value - item.target : null;

  return (
    <div
      className={`flex items-center gap-3 py-2 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Label */}
      <div className="w-28 flex-shrink-0 text-sm text-gray-700 truncate">
        {item.label}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative h-8">
        {/* Background track */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="w-full h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Confidence interval */}
        {showConfidenceInterval && item.confidenceInterval && (
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-gray-300 rounded-full opacity-50"
            style={{
              left: `${((item.confidenceInterval.lower - minValue) / range) * 100}%`,
              width: `${((item.confidenceInterval.upper - item.confidenceInterval.lower) / range) * 100}%`,
            }}
          />
        )}

        {/* Target marker */}
        {showTarget && targetPosition !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400"
            style={{ left: `${targetPosition}%` }}
            title={`Target: ${item.target}`}
          />
        )}

        {/* Benchmark marker */}
        {showBenchmark && benchmarkPosition !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-400 border-l border-dashed"
            style={{ left: `${benchmarkPosition}%` }}
            title={`Benchmark: ${item.benchmark}`}
          />
        )}

        {/* Value dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-sm transition-all duration-300"
          style={{
            left: `calc(${valuePosition}% - 8px)`,
            backgroundColor: color,
          }}
          title={`${item.label}: ${item.value}`}
        />
      </div>

      {/* Value display */}
      {showValues && (
        <div className="w-16 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-gray-900">
            {item.value.toFixed(1)}
          </span>
        </div>
      )}

      {/* Delta display */}
      {showDelta && delta !== null && (
        <div className="w-16 flex-shrink-0 text-right">
          <span
            className={`text-xs font-medium ${
              delta >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

interface BarChartRowProps {
  item: ComparisonItem;
  minValue: number;
  maxValue: number;
  color: string;
  showTarget: boolean;
  showConfidenceInterval: boolean;
  showValues: boolean;
  onClick?: () => void;
}

function BarChartRow({
  item,
  minValue,
  maxValue,
  color,
  showTarget,
  showConfidenceInterval,
  showValues,
  onClick,
}: BarChartRowProps) {
  const range = maxValue - minValue;
  const valueWidth = ((item.value - minValue) / range) * 100;

  const targetPosition = item.target !== undefined
    ? ((item.target - minValue) / range) * 100
    : null;

  return (
    <div
      className={`flex items-center gap-3 py-2 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Label */}
      <div className="w-28 flex-shrink-0 text-sm text-gray-700 truncate">
        {item.label}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative h-6">
        {/* Background */}
        <div className="absolute inset-0 bg-gray-100 rounded" />

        {/* Confidence interval */}
        {showConfidenceInterval && item.confidenceInterval && (
          <div
            className="absolute inset-y-0 rounded opacity-30"
            style={{
              left: `${((item.confidenceInterval.lower - minValue) / range) * 100}%`,
              width: `${((item.confidenceInterval.upper - item.confidenceInterval.lower) / range) * 100}%`,
              backgroundColor: color,
            }}
          />
        )}

        {/* Value bar */}
        <div
          className="absolute inset-y-0 left-0 rounded transition-all duration-500"
          style={{
            width: `${valueWidth}%`,
            backgroundColor: color,
          }}
        />

        {/* Target marker */}
        {showTarget && targetPosition !== null && (
          <div
            className="absolute inset-y-0 w-0.5 bg-gray-800"
            style={{ left: `${targetPosition}%` }}
          />
        )}
      </div>

      {/* Value display */}
      {showValues && (
        <div className="w-12 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-gray-900">
            {item.value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

interface BulletChartRowProps {
  item: ComparisonItem;
  minValue: number;
  maxValue: number;
  color: string;
  showValues: boolean;
  onClick?: () => void;
}

function BulletChartRow({
  item,
  minValue,
  maxValue,
  color,
  showValues,
  onClick,
}: BulletChartRowProps) {
  const range = maxValue - minValue;
  const valueWidth = ((item.value - minValue) / range) * 100;

  const targetPosition = item.target !== undefined
    ? ((item.target - minValue) / range) * 100
    : null;

  // Qualitative ranges (poor, satisfactory, good)
  const ranges = [
    { width: 33.33, color: 'bg-gray-300' },
    { width: 33.33, color: 'bg-gray-200' },
    { width: 33.34, color: 'bg-gray-100' },
  ];

  return (
    <div
      className={`flex items-center gap-3 py-2 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Label */}
      <div className="w-28 flex-shrink-0 text-sm text-gray-700 truncate">
        {item.label}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative h-6">
        {/* Qualitative ranges */}
        <div className="absolute inset-0 flex rounded overflow-hidden">
          {ranges.map((r, i) => (
            <div
              key={i}
              className={`h-full ${r.color}`}
              style={{ width: `${r.width}%` }}
            />
          ))}
        </div>

        {/* Value bar (thinner) */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-2 left-0 rounded transition-all duration-500"
          style={{
            width: `${valueWidth}%`,
            backgroundColor: color,
          }}
        />

        {/* Target marker */}
        {targetPosition !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-4 bg-gray-800 rounded"
            style={{ left: `calc(${targetPosition}% - 2px)` }}
          />
        )}
      </div>

      {/* Value display */}
      {showValues && (
        <div className="w-12 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-gray-900">
            {item.value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

interface LollipopChartRowProps {
  item: ComparisonItem;
  minValue: number;
  maxValue: number;
  color: string;
  showValues: boolean;
  onClick?: () => void;
}

function LollipopChartRow({
  item,
  minValue,
  maxValue,
  color,
  showValues,
  onClick,
}: LollipopChartRowProps) {
  const range = maxValue - minValue;
  const valuePosition = ((item.value - minValue) / range) * 100;

  return (
    <div
      className={`flex items-center gap-3 py-2 ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Label */}
      <div className="w-28 flex-shrink-0 text-sm text-gray-700 truncate">
        {item.label}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative h-6">
        {/* Stem */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-0.5 left-0 transition-all duration-500"
          style={{
            width: `${valuePosition}%`,
            backgroundColor: color,
          }}
        />

        {/* Circle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-sm transition-all duration-300"
          style={{
            left: `calc(${valuePosition}% - 8px)`,
            backgroundColor: color,
          }}
        />
      </div>

      {/* Value display */}
      {showValues && (
        <div className="w-12 flex-shrink-0 text-right">
          <span className="text-sm font-medium text-gray-900">
            {item.value.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComparisonChart({
  items,
  variant = 'bar',
  title,
  subtitle,
  minValue = 0,
  maxValue: propMaxValue,
  showTarget = true,
  showBenchmark = true,
  showConfidenceInterval = true,
  showValues = true,
  showDelta = false,
  sortBy = 'none',
  sortOrder = 'desc',
  colorScheme = 'default',
  className = '',
  onItemClick,
}: ComparisonChartProps) {
  // Calculate max value if not provided
  const maxValue = useMemo(() => {
    if (propMaxValue !== undefined) return propMaxValue;

    const values = items.flatMap(item => {
      const vals = [item.value];
      if (item.target !== undefined) vals.push(item.target);
      if (item.benchmark !== undefined) vals.push(item.benchmark);
      if (item.confidenceInterval) {
        vals.push(item.confidenceInterval.upper);
      }
      return vals;
    });

    return Math.max(...values, 100) * 1.1; // Add 10% padding
  }, [items, propMaxValue]);

  // Sort items
  const sortedItems = useMemo(() => {
    if (sortBy === 'none') return items;

    return [...items].sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'value') {
        comparison = a.value - b.value;
      } else if (sortBy === 'label') {
        comparison = a.label.localeCompare(b.label);
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [items, sortBy, sortOrder]);

  // Render chart row based on variant
  const renderRow = (item: ComparisonItem, index: number) => {
    const color = getItemColor(item, index, colorScheme, maxValue);
    const handleClick = onItemClick ? () => onItemClick(item) : undefined;

    const commonProps = {
      item,
      minValue,
      maxValue,
      color,
      showValues,
      onClick: handleClick,
    };

    switch (variant) {
      case 'dot':
        return (
          <DotChartRow
            key={item.id}
            {...commonProps}
            showTarget={showTarget}
            showBenchmark={showBenchmark}
            showConfidenceInterval={showConfidenceInterval}
            showDelta={showDelta}
          />
        );

      case 'bullet':
        return <BulletChartRow key={item.id} {...commonProps} />;

      case 'lollipop':
        return <LollipopChartRow key={item.id} {...commonProps} />;

      case 'bar':
      default:
        return (
          <BarChartRow
            key={item.id}
            {...commonProps}
            showTarget={showTarget}
            showConfidenceInterval={showConfidenceInterval}
          />
        );
    }
  };

  return (
    <div className={`${className}`} role="figure" aria-label={title || 'Comparison chart'}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="space-y-1">
        {sortedItems.map(renderRow)}
      </div>

      {/* Scale labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-2 pl-28 pr-12">
        <span>{minValue}</span>
        <span>{maxValue.toFixed(0)}</span>
      </div>

      {/* Legend */}
      {(showTarget || showBenchmark) && (
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
          {showTarget && (
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 bg-gray-400" />
              <span>Target</span>
            </div>
          )}
          {showBenchmark && (
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 bg-purple-400 border-l border-dashed" />
              <span>Benchmark</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComparisonChart;
