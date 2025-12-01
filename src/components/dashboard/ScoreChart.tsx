/**
 * Score Chart Components
 *
 * Various charts for displaying score data in the dashboard
 *
 * Phase 2, Week 4, Day 3
 */

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface ProviderScore {
  provider: string;
  score: number;
  label?: string;
}

export interface CategoryScore {
  category: string;
  score: number;
  weight?: number;
}

// ================================================================
// CONSTANTS
// ================================================================

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97706',
  google: '#4285F4',
  perplexity: '#8B5CF6',
  default: '#6B7280',
};

const SCORE_COLORS = {
  excellent: '#10B981', // 80-100
  good: '#3B82F6', // 60-79
  fair: '#F59E0B', // 40-59
  poor: '#EF4444', // 0-39
};

function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.fair;
  return SCORE_COLORS.poor;
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Work';
}

// ================================================================
// PROVIDER BAR CHART
// ================================================================

export interface ProviderBarChartProps {
  data: ProviderScore[];
  title?: string;
  height?: number;
  showLabels?: boolean;
  className?: string;
}

export function ProviderBarChart({
  data,
  title,
  height = 200,
  showLabels = true,
  className,
}: ProviderBarChartProps) {
  const formattedData = useMemo(
    () =>
      data.map((d) => ({
        ...d,
        displayName: d.label || formatProviderName(d.provider),
        fill: PROVIDER_COLORS[d.provider.toLowerCase()] || PROVIDER_COLORS.default,
      })),
    [data]
  );

  if (data.length === 0) {
    return (
      <div
        data-testid="provider-chart-empty"
        className={cn(
          'flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600',
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">No provider data</p>
      </div>
    );
  }

  return (
    <div data-testid="provider-bar-chart" className={className}>
      {title && (
        <h3
          data-testid="provider-chart-title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4"
        >
          {title}
        </h3>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={formattedData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 11 }}
              stroke="currentColor"
              className="text-gray-400 dark:text-gray-500"
              axisLine={false}
              tickLine={false}
              width={80}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0].payload;
                return (
                  <div
                    data-testid="provider-tooltip"
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {data.displayName}
                    </p>
                    <p className="text-lg font-bold" style={{ color: data.fill }}>
                      Score: {data.score}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {getScoreLabel(data.score)}
                    </p>
                  </div>
                );
              }}
            />

            <Bar dataKey="score" radius={[0, 4, 4, 0]}>
              {formattedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {showLabels && (
        <div className="flex flex-wrap justify-center gap-3 mt-4" data-testid="provider-labels">
          {formattedData.map((d) => (
            <div key={d.provider} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded"
                style={{ backgroundColor: d.fill }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {d.displayName}: {d.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ================================================================
// SCORE GAUGE CHART
// ================================================================

export interface ScoreGaugeProps {
  score: number;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ScoreGauge({
  score,
  title,
  size = 'md',
  showLabel = true,
  className,
}: ScoreGaugeProps) {
  const sizeConfig = {
    sm: { width: 120, height: 120, innerRadius: 35, outerRadius: 50, fontSize: 20 },
    md: { width: 180, height: 180, innerRadius: 55, outerRadius: 75, fontSize: 28 },
    lg: { width: 240, height: 240, innerRadius: 75, outerRadius: 100, fontSize: 36 },
  };

  const config = sizeConfig[size];
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  const data = [
    { name: 'Score', value: score, fill: color },
    { name: 'Remaining', value: 100 - score, fill: 'transparent' },
  ];

  return (
    <div data-testid="score-gauge" className={cn('flex flex-col items-center', className)}>
      {title && (
        <h3
          data-testid="score-gauge-title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          {title}
        </h3>
      )}

      <div style={{ width: config.width, height: config.height }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            barSize={10}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background={{ fill: 'currentColor', className: 'text-gray-200 dark:text-gray-700' }}
              dataKey="value"
              cornerRadius={5}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            data-testid="score-gauge-value"
            className="font-bold text-gray-900 dark:text-white"
            style={{ fontSize: config.fontSize }}
          >
            {score}
          </span>
          {showLabel && (
            <span
              data-testid="score-gauge-label"
              className="text-xs font-medium"
              style={{ color }}
            >
              {label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// CATEGORY BREAKDOWN CHART
// ================================================================

export interface CategoryBreakdownChartProps {
  data: CategoryScore[];
  title?: string;
  height?: number;
  variant?: 'bar' | 'pie';
  className?: string;
}

const CATEGORY_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
];

export function CategoryBreakdownChart({
  data,
  title,
  height = 200,
  variant = 'bar',
  className,
}: CategoryBreakdownChartProps) {
  const formattedData = useMemo(
    () =>
      data.map((d, index) => ({
        ...d,
        fill: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
      })),
    [data]
  );

  if (data.length === 0) {
    return (
      <div
        data-testid="category-chart-empty"
        className={cn(
          'flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600',
          className
        )}
        style={{ height }}
      >
        <p className="text-sm text-gray-500 dark:text-gray-400">No category data</p>
      </div>
    );
  }

  return (
    <div data-testid="category-breakdown-chart" className={className}>
      {title && (
        <h3
          data-testid="category-chart-title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4"
        >
          {title}
        </h3>
      )}

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {variant === 'pie' ? (
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="score"
                nameKey="category"
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {data.category}
                      </p>
                      <p className="text-lg font-bold" style={{ color: data.fill }}>
                        {data.score}
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{value}</span>
                )}
              />
            </PieChart>
          ) : (
            <BarChart
              data={formattedData}
              margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
              />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 10 }}
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
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {data.category}
                      </p>
                      <p className="text-lg font-bold" style={{ color: data.fill }}>
                        Score: {data.score}
                      </p>
                      {data.weight && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Weight: {data.weight}%
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================================================================
// COMPARISON CHART
// ================================================================

export interface ComparisonData {
  name: string;
  yourScore: number;
  industryAvg: number;
  topPerformer?: number;
}

export interface ComparisonChartProps {
  data: ComparisonData[];
  title?: string;
  height?: number;
  className?: string;
}

export function ComparisonChart({
  data,
  title,
  height = 200,
  className,
}: ComparisonChartProps) {
  if (data.length === 0) {
    return (
      <div
        data-testid="comparison-chart-empty"
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
    <div data-testid="comparison-chart" className={className}>
      {title && (
        <h3
          data-testid="comparison-chart-title"
          className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4"
        >
          {title}
        </h3>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4" data-testid="comparison-legend">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Your Score</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded bg-gray-400" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Industry Avg</span>
        </div>
        {data.some((d) => d.topPerformer !== undefined) && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Top Performer</span>
          </div>
        )}
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
            />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10 }}
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
                    <p className="font-medium text-gray-900 dark:text-white mb-2">{label}</p>
                    {payload.map((p, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <div
                          className="w-2 h-2 rounded"
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
            <Bar dataKey="yourScore" name="Your Score" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="industryAvg" name="Industry Avg" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
            {data.some((d) => d.topPerformer !== undefined) && (
              <Bar dataKey="topPerformer" name="Top Performer" fill="#10B981" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ================================================================
// HELPERS
// ================================================================

function formatProviderName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI',
    anthropic: 'Claude',
    google: 'Gemini',
    perplexity: 'Perplexity',
  };
  return names[provider.toLowerCase()] || provider;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ProviderBarChart,
  ScoreGauge,
  CategoryBreakdownChart,
  ComparisonChart,
};
