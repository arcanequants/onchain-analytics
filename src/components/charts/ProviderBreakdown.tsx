'use client';

/**
 * ProviderBreakdown Chart Component
 *
 * Phase 2, Week 3, Day 5
 * Visualizes AI provider performance and cost breakdown
 */

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

// ================================================================
// TYPES
// ================================================================

export interface ProviderData {
  provider: string;
  displayName: string;
  color: string;
  metrics: {
    requests: number;
    tokensUsed: number;
    cost: number;
    avgLatency: number;
    successRate: number;
    cacheHitRate: number;
  };
}

export interface ProviderBreakdownProps {
  data: ProviderData[];
  variant?: 'pie' | 'bar' | 'radar' | 'summary';
  metric?: 'requests' | 'tokens' | 'cost' | 'latency';
  height?: number;
  showLegend?: boolean;
  className?: string;
}

// ================================================================
// PROVIDER COLORS
// ================================================================

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10A37F',
  anthropic: '#D97757',
  google: '#4285F4',
  perplexity: '#9333EA',
  default: '#6B7280',
};

// ================================================================
// CHART COMPONENTS
// ================================================================

function PieBreakdown({
  data,
  metric,
  height,
  showLegend,
}: {
  data: ProviderData[];
  metric: 'requests' | 'tokens' | 'cost' | 'latency';
  height: number;
  showLegend: boolean;
}) {
  const chartData = data.map((d) => ({
    name: d.displayName,
    value: metric === 'requests'
      ? d.metrics.requests
      : metric === 'tokens'
        ? d.metrics.tokensUsed
        : metric === 'cost'
          ? d.metrics.cost
          : d.metrics.avgLatency,
    color: d.color,
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  const formatValue = (value: number) => {
    if (metric === 'cost') return `$${value.toFixed(2)}`;
    if (metric === 'tokens') return `${(value / 1000).toFixed(1)}K`;
    if (metric === 'latency') return `${value.toFixed(0)}ms`;
    return value.toLocaleString();
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) =>
            `${name}: ${formatValue(value)} (${((value / total) * 100).toFixed(0)}%)`
          }
          labelLine={true}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatValue(value), metric]}
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

function BarBreakdown({
  data,
  height,
  showLegend,
}: {
  data: ProviderData[];
  height: number;
  showLegend: boolean;
}) {
  const chartData = data.map((d) => ({
    name: d.displayName,
    requests: d.metrics.requests,
    tokens: Math.round(d.metrics.tokensUsed / 1000),
    cost: d.metrics.cost,
    color: d.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9CA3AF" />
        <YAxis type="category" dataKey="name" stroke="#9CA3AF" width={80} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {showLegend && <Legend />}
        <Bar dataKey="requests" fill="#60A5FA" name="Requests" />
        <Bar dataKey="tokens" fill="#34D399" name="Tokens (K)" />
        <Bar dataKey="cost" fill="#FBBF24" name="Cost ($)" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function RadarBreakdown({
  data,
  height,
  showLegend,
}: {
  data: ProviderData[];
  height: number;
  showLegend: boolean;
}) {
  // Normalize metrics to 0-100 scale
  const maxValues = {
    successRate: 100,
    cacheHitRate: 100,
    latency: Math.max(...data.map((d) => d.metrics.avgLatency)),
    cost: Math.max(...data.map((d) => d.metrics.cost)),
  };

  const chartData = [
    { metric: 'Success Rate', fullMark: 100 },
    { metric: 'Cache Hits', fullMark: 100 },
    { metric: 'Speed', fullMark: 100 },
    { metric: 'Cost Efficiency', fullMark: 100 },
  ];

  // Add provider data
  data.forEach((provider) => {
    const speedScore = 100 - (provider.metrics.avgLatency / maxValues.latency) * 100;
    const costScore = 100 - (provider.metrics.cost / maxValues.cost) * 100;

    chartData[0] = { ...chartData[0], [provider.displayName]: provider.metrics.successRate };
    chartData[1] = { ...chartData[1], [provider.displayName]: provider.metrics.cacheHitRate };
    chartData[2] = { ...chartData[2], [provider.displayName]: speedScore };
    chartData[3] = { ...chartData[3], [provider.displayName]: costScore };
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={chartData}>
        <PolarGrid stroke="#374151" />
        <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
        {data.map((provider) => (
          <Radar
            key={provider.provider}
            name={provider.displayName}
            dataKey={provider.displayName}
            stroke={provider.color}
            fill={provider.color}
            fillOpacity={0.3}
          />
        ))}
        <Tooltip
          contentStyle={{
            backgroundColor: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '0.5rem',
          }}
          labelStyle={{ color: '#F9FAFB' }}
        />
        {showLegend && <Legend />}
      </RadarChart>
    </ResponsiveContainer>
  );
}

function SummaryBreakdown({
  data,
  height,
}: {
  data: ProviderData[];
  height: number;
}) {
  const totals = data.reduce(
    (acc, d) => ({
      requests: acc.requests + d.metrics.requests,
      tokens: acc.tokens + d.metrics.tokensUsed,
      cost: acc.cost + d.metrics.cost,
    }),
    { requests: 0, tokens: 0, cost: 0 }
  );

  return (
    <div className="h-full" style={{ height }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {data.map((provider) => (
          <div
            key={provider.provider}
            className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: provider.color }}
              />
              <h4 className="text-white font-medium">{provider.displayName}</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Requests</p>
                <p className="text-white font-semibold">
                  {provider.metrics.requests.toLocaleString()}
                  <span className="text-gray-500 text-xs ml-1">
                    ({((provider.metrics.requests / totals.requests) * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Tokens</p>
                <p className="text-white font-semibold">
                  {(provider.metrics.tokensUsed / 1000).toFixed(1)}K
                  <span className="text-gray-500 text-xs ml-1">
                    ({((provider.metrics.tokensUsed / totals.tokens) * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Cost</p>
                <p className="text-white font-semibold">
                  ${provider.metrics.cost.toFixed(2)}
                  <span className="text-gray-500 text-xs ml-1">
                    ({((provider.metrics.cost / totals.cost) * 100).toFixed(0)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-gray-400">Avg Latency</p>
                <p className="text-white font-semibold">
                  {provider.metrics.avgLatency.toFixed(0)}ms
                </p>
              </div>
              <div>
                <p className="text-gray-400">Success Rate</p>
                <p className="text-white font-semibold">
                  {provider.metrics.successRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Cache Hits</p>
                <p className="text-white font-semibold">
                  {provider.metrics.cacheHitRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function ProviderBreakdown({
  data,
  variant = 'pie',
  metric = 'cost',
  height = 300,
  showLegend = true,
  className = '',
}: ProviderBreakdownProps) {
  // Add colors if not provided
  const dataWithColors = data.map((d) => ({
    ...d,
    color: d.color || PROVIDER_COLORS[d.provider] || PROVIDER_COLORS.default,
  }));

  return (
    <div className={className}>
      {variant === 'pie' && (
        <PieBreakdown
          data={dataWithColors}
          metric={metric}
          height={height}
          showLegend={showLegend}
        />
      )}
      {variant === 'bar' && (
        <BarBreakdown
          data={dataWithColors}
          height={height}
          showLegend={showLegend}
        />
      )}
      {variant === 'radar' && (
        <RadarBreakdown
          data={dataWithColors}
          height={height}
          showLegend={showLegend}
        />
      )}
      {variant === 'summary' && (
        <SummaryBreakdown data={dataWithColors} height={height} />
      )}
    </div>
  );
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

export function createProviderData(
  provider: string,
  displayName: string,
  metrics: ProviderData['metrics']
): ProviderData {
  return {
    provider,
    displayName,
    color: PROVIDER_COLORS[provider] || PROVIDER_COLORS.default,
    metrics,
  };
}

export { PROVIDER_COLORS };
