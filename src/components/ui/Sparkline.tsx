/**
 * Sparkline Component
 *
 * Phase 1, Week 2, Day 5
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5 (UX)
 *
 * A minimal line chart component for displaying trend data
 * in a compact space without axes or labels.
 */

'use client';

import React, { useMemo } from 'react';

// ================================================================
// TYPES
// ================================================================

export interface SparklineProps {
  /** Array of data points (y values) */
  data: number[];
  /** Width of the sparkline */
  width?: number;
  /** Height of the sparkline */
  height?: number;
  /** Line color (auto = gradient based on trend) */
  color?: string | 'auto';
  /** Fill color under the line (transparent by default) */
  fillColor?: string;
  /** Fill opacity (0-1) */
  fillOpacity?: number;
  /** Line thickness */
  strokeWidth?: number;
  /** Show end point dot */
  showEndDot?: boolean;
  /** End dot radius */
  dotRadius?: number;
  /** Enable smooth curves (bezier) */
  smooth?: boolean;
  /** Animate on mount */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Custom class name */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
  /** Show value on hover tooltip */
  showTooltip?: boolean;
}

export interface SparkBarProps {
  /** Array of data points */
  data: number[];
  /** Width of the component */
  width?: number;
  /** Height of the component */
  height?: number;
  /** Bar color or function to determine color per value */
  color?: string | ((value: number, index: number) => string);
  /** Gap between bars */
  gap?: number;
  /** Animate on mount */
  animate?: boolean;
  /** Custom class name */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export interface SparkAreaProps extends Omit<SparklineProps, 'fillColor' | 'fillOpacity'> {
  /** Gradient start color */
  gradientStart?: string;
  /** Gradient end color */
  gradientEnd?: string;
}

// ================================================================
// UTILITIES
// ================================================================

/**
 * Normalize data to fit within the SVG viewport
 */
function normalizeData(
  data: number[],
  width: number,
  height: number,
  padding: number = 2
): { x: number; y: number; value: number }[] {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero

  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;

  return data.map((value, index) => ({
    x: padding + (index / Math.max(data.length - 1, 1)) * effectiveWidth,
    y: padding + effectiveHeight - ((value - min) / range) * effectiveHeight,
    value,
  }));
}

/**
 * Create SVG path from points (straight lines)
 */
function createLinePath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
}

/**
 * Create smooth SVG path using quadratic bezier curves
 */
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return createLinePath(points);

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Calculate control point
    const cpX = (prev.x + curr.x) / 2;

    // Use quadratic bezier for smooth curves
    path += ` Q ${cpX} ${prev.y} ${cpX} ${(prev.y + curr.y) / 2}`;
    if (i === points.length - 1) {
      path += ` Q ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }
  }

  return path;
}

/**
 * Create area path (closed shape)
 */
function createAreaPath(
  points: { x: number; y: number }[],
  height: number,
  smooth: boolean = false
): string {
  if (points.length === 0) return '';

  const linePath = smooth ? createSmoothPath(points) : createLinePath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  return `${linePath} L ${lastPoint.x} ${height} L ${firstPoint.x} ${height} Z`;
}

/**
 * Calculate trend direction
 */
function getTrend(data: number[]): 'up' | 'down' | 'neutral' {
  if (data.length < 2) return 'neutral';

  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;

  if (Math.abs(diff) < 0.01) return 'neutral';
  return diff > 0 ? 'up' : 'down';
}

/**
 * Get color based on trend
 */
function getTrendColor(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return '#22c55e'; // green
    case 'down':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
}

// ================================================================
// SPARKLINE COMPONENT
// ================================================================

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = 'auto',
  fillColor,
  fillOpacity = 0.1,
  strokeWidth = 1.5,
  showEndDot = false,
  dotRadius = 3,
  smooth = true,
  animate = true,
  animationDuration = 500,
  className = '',
  ariaLabel,
}: SparklineProps): React.ReactElement {
  const points = useMemo(() => normalizeData(data, width, height), [data, width, height]);

  const trend = useMemo(() => getTrend(data), [data]);
  const lineColor = color === 'auto' ? getTrendColor(trend) : color;

  const linePath = useMemo(
    () => (smooth ? createSmoothPath(points) : createLinePath(points)),
    [points, smooth]
  );

  const areaPath = useMemo(
    () => (fillColor ? createAreaPath(points, height, smooth) : ''),
    [points, height, smooth, fillColor]
  );

  const lastPoint = points[points.length - 1];

  // Animation styles
  const pathLength = useMemo(() => {
    // Approximate path length for animation
    return points.reduce((acc, point, i) => {
      if (i === 0) return 0;
      const prev = points[i - 1];
      return acc + Math.hypot(point.x - prev.x, point.y - prev.y);
    }, 0);
  }, [points]);

  if (data.length === 0) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width, height }}
        data-testid="sparkline-empty"
        role="img"
        aria-label={ariaLabel || 'No data available'}
      >
        <span className="text-gray-400 text-xs">--</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-testid="sparkline"
      role="img"
      aria-label={ariaLabel || `Sparkline chart showing ${data.length} data points, trend: ${trend}`}
    >
      {/* Gradient definition for fill */}
      {fillColor && (
        <defs>
          <linearGradient id={`fill-gradient-${data.join('')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={fillOpacity} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>
      )}

      {/* Area fill */}
      {fillColor && areaPath && (
        <path
          d={areaPath}
          fill={`url(#fill-gradient-${data.join('')})`}
          data-testid="sparkline-area"
        />
      )}

      {/* Main line */}
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-testid="sparkline-line"
        style={
          animate
            ? {
                strokeDasharray: pathLength,
                strokeDashoffset: pathLength,
                animation: `sparkline-draw ${animationDuration}ms ease-out forwards`,
              }
            : undefined
        }
      />

      {/* End dot */}
      {showEndDot && lastPoint && (
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r={dotRadius}
          fill={lineColor}
          data-testid="sparkline-dot"
          style={
            animate
              ? {
                  opacity: 0,
                  animation: `sparkline-dot-appear ${animationDuration * 0.2}ms ease-out ${animationDuration}ms forwards`,
                }
              : undefined
          }
        />
      )}

      {/* Animation keyframes */}
      {animate && (
        <style>
          {`
            @keyframes sparkline-draw {
              to {
                stroke-dashoffset: 0;
              }
            }
            @keyframes sparkline-dot-appear {
              to {
                opacity: 1;
              }
            }
          `}
        </style>
      )}
    </svg>
  );
}

// ================================================================
// SPARKBAR COMPONENT
// ================================================================

export function SparkBar({
  data,
  width = 100,
  height = 30,
  color = '#6b7280',
  gap = 1,
  animate = true,
  className = '',
  ariaLabel,
}: SparkBarProps): React.ReactElement {
  const bars = useMemo(() => {
    if (data.length === 0) return [];

    const min = Math.min(...data, 0);
    const max = Math.max(...data);
    const range = max - min || 1;

    const barWidth = (width - gap * (data.length - 1)) / data.length;

    return data.map((value, index) => ({
      x: index * (barWidth + gap),
      y: height - ((value - min) / range) * height,
      width: barWidth,
      height: ((value - min) / range) * height,
      value,
    }));
  }, [data, width, height, gap]);

  if (data.length === 0) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width, height }}
        data-testid="sparkbar-empty"
        role="img"
        aria-label={ariaLabel || 'No data available'}
      >
        <span className="text-gray-400 text-xs">--</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-testid="sparkbar"
      role="img"
      aria-label={ariaLabel || `Bar chart showing ${data.length} data points`}
    >
      {bars.map((bar, index) => {
        const barColor =
          typeof color === 'function' ? color(bar.value, index) : color;

        return (
          <rect
            key={index}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            fill={barColor}
            rx={1}
            data-testid={`sparkbar-bar-${index}`}
            style={
              animate
                ? {
                    transform: 'scaleY(0)',
                    transformOrigin: 'bottom',
                    animation: `sparkbar-grow 300ms ease-out ${index * 30}ms forwards`,
                  }
                : undefined
            }
          />
        );
      })}

      {/* Animation keyframes */}
      {animate && (
        <style>
          {`
            @keyframes sparkbar-grow {
              to {
                transform: scaleY(1);
              }
            }
          `}
        </style>
      )}
    </svg>
  );
}

// ================================================================
// SPARKAREA COMPONENT
// ================================================================

export function SparkArea({
  data,
  width = 100,
  height = 30,
  color = 'auto',
  gradientStart,
  gradientEnd,
  strokeWidth = 1.5,
  smooth = true,
  animate = true,
  animationDuration = 500,
  className = '',
  ariaLabel,
}: SparkAreaProps): React.ReactElement {
  const points = useMemo(() => normalizeData(data, width, height), [data, width, height]);

  const trend = useMemo(() => getTrend(data), [data]);
  const lineColor = color === 'auto' ? getTrendColor(trend) : color;

  const startColor = gradientStart || lineColor;
  const endColor = gradientEnd || 'transparent';

  const linePath = useMemo(
    () => (smooth ? createSmoothPath(points) : createLinePath(points)),
    [points, smooth]
  );

  const areaPath = useMemo(
    () => createAreaPath(points, height, smooth),
    [points, height, smooth]
  );

  // Generate unique gradient ID
  const gradientId = useMemo(
    () => `sparkarea-gradient-${Math.random().toString(36).substr(2, 9)}`,
    []
  );

  if (data.length === 0) {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width, height }}
        data-testid="sparkarea-empty"
        role="img"
        aria-label={ariaLabel || 'No data available'}
      >
        <span className="text-gray-400 text-xs">--</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      data-testid="sparkarea"
      role="img"
      aria-label={ariaLabel || `Area chart showing ${data.length} data points, trend: ${trend}`}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={startColor} stopOpacity={0.3} />
          <stop offset="100%" stopColor={endColor} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      <path
        d={areaPath}
        fill={`url(#${gradientId})`}
        data-testid="sparkarea-fill"
        style={
          animate
            ? {
                opacity: 0,
                animation: `sparkarea-fade ${animationDuration}ms ease-out forwards`,
              }
            : undefined
        }
      />

      {/* Top line */}
      <path
        d={linePath}
        fill="none"
        stroke={lineColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        data-testid="sparkarea-line"
      />

      {/* Animation keyframes */}
      {animate && (
        <style>
          {`
            @keyframes sparkarea-fade {
              to {
                opacity: 1;
              }
            }
          `}
        </style>
      )}
    </svg>
  );
}

// ================================================================
// TREND INDICATOR COMPONENT
// ================================================================

export interface TrendIndicatorProps {
  /** Current value */
  value: number;
  /** Previous value for comparison */
  previousValue?: number;
  /** Percentage change (alternative to previousValue) */
  change?: number;
  /** Show trend arrow */
  showArrow?: boolean;
  /** Number of decimal places for percentage */
  decimals?: number;
  /** Reverse colors (green for down, red for up) */
  invertColors?: boolean;
  /** Custom class name */
  className?: string;
}

export function TrendIndicator({
  value,
  previousValue,
  change: externalChange,
  showArrow = true,
  decimals = 1,
  invertColors = false,
  className = '',
}: TrendIndicatorProps): React.ReactElement {
  const change = useMemo(() => {
    if (externalChange !== undefined) return externalChange;
    if (previousValue === undefined || previousValue === 0) return 0;
    return ((value - previousValue) / previousValue) * 100;
  }, [value, previousValue, externalChange]);

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  let colorClass = 'text-gray-500';
  if (isPositive) {
    colorClass = invertColors ? 'text-red-500' : 'text-green-500';
  } else if (isNegative) {
    colorClass = invertColors ? 'text-green-500' : 'text-red-500';
  }

  const formattedChange = `${isPositive ? '+' : ''}${change.toFixed(decimals)}%`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-sm font-medium ${colorClass} ${className}`}
      data-testid="trend-indicator"
    >
      {showArrow && !isNeutral && (
        <span data-testid="trend-arrow">
          {isPositive ? '↑' : '↓'}
        </span>
      )}
      <span data-testid="trend-value">{formattedChange}</span>
    </span>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default Sparkline;
