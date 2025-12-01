/**
 * Trend Chart Component
 *
 * Displays score trends over time with celebration on improvement
 *
 * Phase 2, Week 4, Day 3
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface TrendDataPoint {
  date: string; // ISO date string
  score: number;
  label?: string;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
  showCelebration?: boolean;
  celebrationThreshold?: number; // Minimum improvement to trigger celebration
  variant?: 'line' | 'area';
  color?: 'blue' | 'green' | 'purple' | 'orange';
  showGrid?: boolean;
  showAverage?: boolean;
  className?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

const COLOR_MAP = {
  blue: {
    primary: '#3B82F6',
    gradient: ['#3B82F6', '#1D4ED8'],
    light: 'rgba(59, 130, 246, 0.1)',
  },
  green: {
    primary: '#10B981',
    gradient: ['#10B981', '#059669'],
    light: 'rgba(16, 185, 129, 0.1)',
  },
  purple: {
    primary: '#8B5CF6',
    gradient: ['#8B5CF6', '#6D28D9'],
    light: 'rgba(139, 92, 246, 0.1)',
  },
  orange: {
    primary: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    light: 'rgba(245, 158, 11, 0.1)',
  },
};

// ================================================================
// CELEBRATION COMPONENT
// ================================================================

interface CelebrationOverlayProps {
  improvement: number;
  onComplete: () => void;
}

function CelebrationOverlay({ improvement, onComplete }: CelebrationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      data-testid="celebration-overlay"
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg backdrop-blur-sm z-10 animate-fade-in"
    >
      <div className="text-center animate-bounce-in">
        <div className="text-4xl mb-2" data-testid="celebration-emoji">
          🎉
        </div>
        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
          Score Improved!
        </div>
        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
          +{improvement} points
        </div>
      </div>
    </div>
  );
}

// ================================================================
// CUSTOM TOOLTIP
// ================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: TrendDataPoint }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const score = data.value;
  const dataPoint = data.payload;

  return (
    <div
      data-testid="chart-tooltip"
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
        {formatDate(label || dataPoint.date)}
      </p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">
        Score: {score}
      </p>
      {dataPoint.label && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          {dataPoint.label}
        </p>
      )}
    </div>
  );
}

// ================================================================
// HELPERS
// ================================================================

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function calculateTrend(data: TrendDataPoint[]): {
  trend: 'up' | 'down' | 'stable';
  change: number;
  percentChange: number;
} {
  if (data.length < 2) {
    return { trend: 'stable', change: 0, percentChange: 0 };
  }

  const first = data[0].score;
  const last = data[data.length - 1].score;
  const change = last - first;
  const percentChange = first > 0 ? Math.round((change / first) * 100) : 0;

  if (change > 0) {
    return { trend: 'up', change, percentChange };
  } else if (change < 0) {
    return { trend: 'down', change, percentChange };
  }
  return { trend: 'stable', change: 0, percentChange: 0 };
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function TrendChart({
  data,
  title,
  height = 200,
  showCelebration = true,
  celebrationThreshold = 5,
  variant = 'line',
  color = 'blue',
  showGrid = true,
  showAverage = false,
  className,
}: TrendChartProps) {
  const [showCelebrationOverlay, setShowCelebrationOverlay] = useState(false);
  const [hasShownCelebration, setHasShownCelebration] = useState(false);

  const colors = COLOR_MAP[color];
  const { trend, change, percentChange } = useMemo(() => calculateTrend(data), [data]);

  const average = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, d) => sum + d.score, 0) / data.length);
  }, [data]);

  const { min, max } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 100 };
    const scores = data.map((d) => d.score);
    return {
      min: Math.max(0, Math.min(...scores) - 10),
      max: Math.min(100, Math.max(...scores) + 10),
    };
  }, [data]);

  // Trigger celebration on improvement
  useEffect(() => {
    if (
      showCelebration &&
      !hasShownCelebration &&
      trend === 'up' &&
      change >= celebrationThreshold
    ) {
      setShowCelebrationOverlay(true);
      setHasShownCelebration(true);
    }
  }, [showCelebration, hasShownCelebration, trend, change, celebrationThreshold]);

  const handleCelebrationComplete = () => {
    setShowCelebrationOverlay(false);
  };

  // Empty state
  if (data.length === 0) {
    return (
      <div
        data-testid="trend-chart-empty"
        className={cn(
          'flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600',
          className
        )}
        style={{ height }}
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-8 h-8 mx-auto mb-2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          <p className="text-sm">No data yet</p>
          <p className="text-xs mt-1">Run analyses to see trends</p>
        </div>
      </div>
    );
  }

  // Single data point
  if (data.length === 1) {
    return (
      <div
        data-testid="trend-chart-single"
        className={cn(
          'flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700',
          className
        )}
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Current Score
          </p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {data[0].score}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(data[0].date)}
          </p>
        </div>
      </div>
    );
  }

  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div data-testid="trend-chart" className={cn('relative', className)}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3
            data-testid="trend-chart-title"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {title}
          </h3>
          <div className="flex items-center space-x-2">
            {trend !== 'stable' && (
              <span
                data-testid="trend-indicator"
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  trend === 'up'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {trend === 'up' ? '↑' : '↓'} {Math.abs(change)} pts (
                {percentChange > 0 ? '+' : ''}
                {percentChange}%)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Celebration Overlay */}
      {showCelebrationOverlay && (
        <CelebrationOverlay
          improvement={change}
          onComplete={handleCelebrationComplete}
        />
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ChartComponent
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            {/* Gradient definition for area chart */}
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
              </linearGradient>
            </defs>

            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
            )}

            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[min, max]}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            {showAverage && (
              <ReferenceLine
                y={average}
                stroke={colors.primary}
                strokeDasharray="5 5"
                strokeOpacity={0.5}
                label={{
                  value: `Avg: ${average}`,
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: colors.primary,
                }}
              />
            )}

            {variant === 'area' ? (
              <Area
                type="monotone"
                dataKey="score"
                stroke={colors.primary}
                strokeWidth={2}
                fill={`url(#gradient-${color})`}
                dot={{ fill: colors.primary, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: colors.primary, strokeWidth: 2, fill: 'white' }}
              />
            ) : (
              <Line
                type="monotone"
                dataKey="score"
                stroke={colors.primary}
                strokeWidth={2}
                dot={{ fill: colors.primary, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: colors.primary, strokeWidth: 2, fill: 'white' }}
              />
            )}
          </ChartComponent>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================================================================
// MULTI-SERIES TREND CHART
// ================================================================

export interface MultiSeriesData {
  date: string;
  [key: string]: number | string;
}

export interface SeriesConfig {
  key: string;
  name: string;
  color: keyof typeof COLOR_MAP;
}

export interface MultiSeriesTrendChartProps {
  data: MultiSeriesData[];
  series: SeriesConfig[];
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function MultiSeriesTrendChart({
  data,
  series,
  title,
  height = 200,
  showGrid = true,
  showLegend = true,
  className,
}: MultiSeriesTrendChartProps) {
  if (data.length === 0) {
    return (
      <div
        data-testid="multi-trend-chart-empty"
        className={cn(
          'flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600',
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">No comparison data</p>
      </div>
    );
  }

  return (
    <div data-testid="multi-trend-chart" className={className}>
      {title && (
        <h3
          data-testid="multi-trend-chart-title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4"
        >
          {title}
        </h3>
      )}

      {showLegend && (
        <div className="flex flex-wrap gap-4 mb-4" data-testid="chart-legend">
          {series.map((s) => (
            <div key={s.key} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLOR_MAP[s.color].primary }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
            )}

            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      {formatDate(label)}
                    </p>
                    {payload.map((p, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {p.name}: {p.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }}
            />

            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={COLOR_MAP[s.color].primary}
                strokeWidth={2}
                dot={{ fill: COLOR_MAP[s.color].primary, strokeWidth: 0, r: 2 }}
                activeDot={{ r: 4, stroke: COLOR_MAP[s.color].primary, strokeWidth: 2, fill: 'white' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default TrendChart;
