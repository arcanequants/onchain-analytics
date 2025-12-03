'use client';

/**
 * TrendChart Component
 *
 * Phase 2, Week 3, Day 5
 * Multi-purpose trend visualization component
 */

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';

// ================================================================
// TYPES
// ================================================================

export interface TrendDataPoint {
  timestamp: string | Date;
  value: number;
  [key: string]: unknown;
}

export interface TrendSeries {
  name: string;
  dataKey: string;
  color: string;
  type?: 'line' | 'area';
  dashed?: boolean;
  hidden?: boolean;
}

export interface TrendAnnotation {
  type: 'line' | 'area';
  value?: number;
  y1?: number;
  y2?: number;
  x1?: string;
  x2?: string;
  label?: string;
  color?: string;
  dashed?: boolean;
}

export interface TrendChartProps {
  data: TrendDataPoint[];
  series: TrendSeries[];
  variant?: 'line' | 'area' | 'mixed';
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  annotations?: TrendAnnotation[];
  xAxisFormat?: (value: string | Date) => string;
  yAxisFormat?: (value: number) => string;
  yAxisDomain?: [number | 'auto', number | 'auto'];
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

// ================================================================
// DEFAULT FORMATTERS
// ================================================================

const defaultXAxisFormat = (value: string | Date): string => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const defaultYAxisFormat = (value: number): string => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

// ================================================================
// CUSTOM TOOLTIP
// ================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  yAxisFormat: (value: number) => string;
}

function CustomTooltip({ active, payload, label, yAxisFormat }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const date = new Date(label || '');
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-gray-400 text-sm mb-2">{formattedDate}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-300 text-sm">{entry.name}:</span>
          <span className="text-white font-semibold">
            {yAxisFormat(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ================================================================
// LOADING SKELETON
// ================================================================

function LoadingSkeleton({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-800/30 rounded-lg animate-pulse"
      style={{ height }}
    >
      <div className="text-gray-500">Loading chart...</div>
    </div>
  );
}

// ================================================================
// EMPTY STATE
// ================================================================

function EmptyState({ height, message }: { height: number; message: string }) {
  return (
    <div
      className="flex items-center justify-center bg-gray-800/30 rounded-lg border border-gray-700/50"
      style={{ height }}
    >
      <div className="text-center">
        <svg
          className="w-12 h-12 mx-auto text-gray-600 mb-2"
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
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function TrendChart({
  data,
  series,
  variant = 'line',
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  annotations = [],
  xAxisFormat = defaultXAxisFormat,
  yAxisFormat = defaultYAxisFormat,
  yAxisDomain = ['auto', 'auto'],
  className = '',
  loading = false,
  emptyMessage = 'No data available',
}: TrendChartProps) {
  // Handle loading state
  if (loading) {
    return <LoadingSkeleton height={height} />;
  }

  // Handle empty state
  if (!data || data.length === 0) {
    return <EmptyState height={height} message={emptyMessage} />;
  }

  // Format data for chart
  const chartData = data.map((point) => ({
    ...point,
    timestamp: typeof point.timestamp === 'string'
      ? point.timestamp
      : point.timestamp.toISOString(),
  }));

  // Filter visible series
  const visibleSeries = series.filter((s) => !s.hidden);

  // Determine chart type
  const ChartComponent = variant === 'area' ? AreaChart : LineChart;

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={chartData}>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="timestamp"
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={xAxisFormat}
            tickLine={false}
            axisLine={{ stroke: '#4B5563' }}
          />

          <YAxis
            stroke="#9CA3AF"
            fontSize={12}
            tickFormatter={yAxisFormat}
            tickLine={false}
            axisLine={{ stroke: '#4B5563' }}
            domain={yAxisDomain}
          />

          {showTooltip && (
            <Tooltip
              content={<CustomTooltip yAxisFormat={yAxisFormat} />}
              cursor={{ stroke: '#6B7280', strokeDasharray: '5 5' }}
            />
          )}

          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
          )}

          {/* Render annotations */}
          {annotations.map((annotation, index) => {
            if (annotation.type === 'line' && annotation.value !== undefined) {
              return (
                <ReferenceLine
                  key={`annotation-${index}`}
                  y={annotation.value}
                  stroke={annotation.color || '#EF4444'}
                  strokeDasharray={annotation.dashed ? '5 5' : undefined}
                  label={{
                    value: annotation.label || '',
                    position: 'right',
                    fill: annotation.color || '#EF4444',
                    fontSize: 12,
                  }}
                />
              );
            }

            if (annotation.type === 'area' && annotation.y1 !== undefined && annotation.y2 !== undefined) {
              return (
                <ReferenceArea
                  key={`annotation-${index}`}
                  y1={annotation.y1}
                  y2={annotation.y2}
                  x1={annotation.x1}
                  x2={annotation.x2}
                  fill={annotation.color || '#F59E0B'}
                  fillOpacity={0.1}
                  stroke={annotation.color || '#F59E0B'}
                  strokeOpacity={0.3}
                />
              );
            }

            return null;
          })}

          {/* Render series */}
          {visibleSeries.map((s) => {
            const isArea = s.type === 'area' || variant === 'area';

            if (isArea) {
              return (
                <Area
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  fill={s.color}
                  fillOpacity={0.1}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5 5' : undefined}
                  dot={false}
                  activeDot={{ r: 4, fill: s.color }}
                />
              );
            }

            return (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '5 5' : undefined}
                dot={false}
                activeDot={{ r: 4, fill: s.color }}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

// ================================================================
// PRESET CONFIGURATIONS
// ================================================================

export const TREND_PRESETS = {
  score: {
    series: [
      { name: 'Score', dataKey: 'score', color: '#6366F1', type: 'area' as const },
    ],
    yAxisDomain: [0, 100] as [number, number],
    annotations: [
      { type: 'line' as const, value: 70, label: 'Good', color: '#22C55E', dashed: true },
      { type: 'line' as const, value: 40, label: 'Needs Work', color: '#F59E0B', dashed: true },
    ],
  },
  cost: {
    series: [
      { name: 'Daily Cost', dataKey: 'cost', color: '#F59E0B', type: 'area' as const },
    ],
    yAxisFormat: (value: number) => `$${value.toFixed(2)}`,
  },
  tokens: {
    series: [
      { name: 'Input Tokens', dataKey: 'inputTokens', color: '#60A5FA', type: 'line' as const },
      { name: 'Output Tokens', dataKey: 'outputTokens', color: '#34D399', type: 'line' as const },
    ],
  },
  latency: {
    series: [
      { name: 'P50 Latency', dataKey: 'p50', color: '#22C55E', type: 'line' as const },
      { name: 'P95 Latency', dataKey: 'p95', color: '#F59E0B', type: 'line' as const },
      { name: 'P99 Latency', dataKey: 'p99', color: '#EF4444', type: 'line' as const },
    ],
    yAxisFormat: (value: number) => `${value}ms`,
  },
  multiProvider: {
    series: [
      { name: 'OpenAI', dataKey: 'openai', color: '#10A37F', type: 'line' as const },
      { name: 'Anthropic', dataKey: 'anthropic', color: '#D97757', type: 'line' as const },
      { name: 'Google', dataKey: 'google', color: '#4285F4', type: 'line' as const },
      { name: 'Perplexity', dataKey: 'perplexity', color: '#9333EA', type: 'line' as const },
    ],
  },
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export function generateMockTrendData(
  days: number = 30,
  baseValue: number = 50,
  variance: number = 10
): TrendDataPoint[] {
  const data: TrendDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    data.push({
      timestamp: date.toISOString(),
      value: baseValue + (Math.random() - 0.5) * 2 * variance,
    });
  }

  return data;
}
