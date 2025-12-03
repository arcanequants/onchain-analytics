/**
 * Internal Cost Dashboard
 *
 * Phase 2, Week 3, Day 5
 * Administrative dashboard for monitoring AI costs and usage
 */

'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// ================================================================
// TYPES
// ================================================================

interface CostMetrics {
  totalCostUsd: number;
  costByProvider: Record<string, number>;
  costByDay: Array<{ date: string; cost: number; requests: number }>;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
  requestsByProvider: Record<string, number>;
  averageCostPerRequest: number;
  budgetUsed: number;
  budgetLimit: number;
  projectedMonthlyCost: number;
}

interface PerformanceMetrics {
  averageLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  cacheHitRate: number;
  errorRate: number;
  totalRequests: number;
}

// ================================================================
// MOCK DATA (Replace with real API calls)
// ================================================================

const mockCostMetrics: CostMetrics = {
  totalCostUsd: 147.52,
  costByProvider: {
    openai: 89.30,
    anthropic: 42.15,
    google: 12.07,
    perplexity: 4.00,
  },
  costByDay: [
    { date: '2024-11-25', cost: 18.50, requests: 1250 },
    { date: '2024-11-26', cost: 22.30, requests: 1480 },
    { date: '2024-11-27', cost: 19.80, requests: 1320 },
    { date: '2024-11-28', cost: 25.40, requests: 1650 },
    { date: '2024-11-29', cost: 21.70, requests: 1420 },
    { date: '2024-11-30', cost: 23.10, requests: 1510 },
    { date: '2024-12-01', cost: 16.72, requests: 1180 },
  ],
  tokenUsage: {
    input: 2450000,
    output: 890000,
    total: 3340000,
  },
  requestsByProvider: {
    openai: 5200,
    anthropic: 2100,
    google: 1800,
    perplexity: 710,
  },
  averageCostPerRequest: 0.015,
  budgetUsed: 147.52,
  budgetLimit: 500,
  projectedMonthlyCost: 642.50,
};

const mockPerformanceMetrics: PerformanceMetrics = {
  averageLatencyMs: 1250,
  p50LatencyMs: 980,
  p95LatencyMs: 2450,
  p99LatencyMs: 4200,
  cacheHitRate: 0.32,
  errorRate: 0.02,
  totalRequests: 9810,
};

// ================================================================
// COMPONENTS
// ================================================================

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef'];

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
}: {
  title: string;
  value: string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
}) {
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400';
  const trendIcon = trend === 'up' ? '+' : trend === 'down' ? '-' : '';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      {trendLabel && (
        <p className={`text-xs mt-2 ${trendColor}`}>
          {trendIcon} {trendLabel}
        </p>
      )}
    </div>
  );
}

function BudgetGauge({ used, limit }: { used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);
  const color =
    percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm text-gray-400">Budget Usage</p>
        <p className="text-sm text-gray-300">{percentage.toFixed(1)}%</p>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
        <div
          className={`h-3 rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>${used.toFixed(2)} used</span>
        <span>${limit.toFixed(2)} limit</span>
      </div>
    </div>
  );
}

function AlertBanner({
  type,
  message,
}: {
  type: 'warning' | 'error' | 'info';
  message: string;
}) {
  const colors = {
    warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-400',
    error: 'bg-red-500/10 border-red-500/50 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/50 text-blue-400',
  };

  return (
    <div className={`border rounded-lg px-4 py-3 ${colors[type]}`}>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function CostDashboardPage() {
  const [costMetrics, setCostMetrics] = useState<CostMetrics>(mockCostMetrics);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(mockPerformanceMetrics);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [isLoading, setIsLoading] = useState(false);

  // Format currency
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  // Format number with K/M suffix
  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Calculate provider percentages for pie chart
  const providerData = Object.entries(costMetrics.costByProvider).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  // Alerts
  const alerts: Array<{ type: 'warning' | 'error' | 'info'; message: string }> = [];

  if (costMetrics.budgetUsed / costMetrics.budgetLimit > 0.8) {
    alerts.push({
      type: 'warning',
      message: `Budget usage at ${((costMetrics.budgetUsed / costMetrics.budgetLimit) * 100).toFixed(0)}%. Consider reviewing high-cost operations.`,
    });
  }

  if (performanceMetrics.errorRate > 0.05) {
    alerts.push({
      type: 'error',
      message: `Error rate elevated at ${(performanceMetrics.errorRate * 100).toFixed(1)}%. Check provider status.`,
    });
  }

  if (costMetrics.projectedMonthlyCost > costMetrics.budgetLimit * 1.2) {
    alerts.push({
      type: 'warning',
      message: `Projected monthly cost ($${costMetrics.projectedMonthlyCost.toFixed(2)}) exceeds budget by ${(((costMetrics.projectedMonthlyCost / costMetrics.budgetLimit) - 1) * 100).toFixed(0)}%.`,
    });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Cost Dashboard</h1>
            <p className="text-gray-400 text-sm">Monitor usage, costs, and performance</p>
          </div>
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded text-sm ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2 mb-6">
            {alerts.map((alert, i) => (
              <AlertBanner key={i} type={alert.type} message={alert.message} />
            ))}
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total Cost (Period)"
            value={formatCurrency(costMetrics.totalCostUsd)}
            trend="up"
            trendLabel="12% vs last period"
          />
          <MetricCard
            title="Total Requests"
            value={formatNumber(performanceMetrics.totalRequests)}
            trend="up"
            trendLabel="8% vs last period"
          />
          <MetricCard
            title="Avg Cost/Request"
            value={formatCurrency(costMetrics.averageCostPerRequest)}
            trend="down"
            trendLabel="5% improvement"
          />
          <MetricCard
            title="Cache Hit Rate"
            value={`${(performanceMetrics.cacheHitRate * 100).toFixed(1)}%`}
            trend="up"
            trendLabel="3% improvement"
          />
        </div>

        {/* Budget Gauge */}
        <div className="mb-6">
          <BudgetGauge used={costMetrics.budgetUsed} limit={costMetrics.budgetLimit} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Cost Over Time */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Cost Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={costMetrics.costByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost by Provider */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Cost by Provider</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={providerData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {providerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Requests by Provider */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Requests by Provider</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={Object.entries(costMetrics.requestsByProvider).map(([name, value]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                requests: value,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              />
              <Bar dataKey="requests" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Token Usage & Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Token Usage */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Token Usage</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Input Tokens</span>
                <span className="text-white font-medium">{formatNumber(costMetrics.tokenUsage.input)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Output Tokens</span>
                <span className="text-white font-medium">{formatNumber(costMetrics.tokenUsage.output)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="text-gray-400">Total Tokens</span>
                <span className="text-white font-bold">{formatNumber(costMetrics.tokenUsage.total)}</span>
              </div>
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1">Input/Output Ratio</div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{
                      width: `${(costMetrics.tokenUsage.input / costMetrics.tokenUsage.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Latency Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Average</span>
                <span className="text-white font-medium">{performanceMetrics.averageLatencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P50</span>
                <span className="text-white font-medium">{performanceMetrics.p50LatencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P95</span>
                <span className="text-yellow-400 font-medium">{performanceMetrics.p95LatencyMs}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">P99</span>
                <span className="text-red-400 font-medium">{performanceMetrics.p99LatencyMs}ms</span>
              </div>
              <div className="flex justify-between border-t border-gray-700 pt-2">
                <span className="text-gray-400">Error Rate</span>
                <span className={`font-medium ${performanceMetrics.errorRate > 0.03 ? 'text-red-400' : 'text-green-400'}`}>
                  {(performanceMetrics.errorRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Projected Costs */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-4">Cost Projections</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatCurrency(costMetrics.projectedMonthlyCost)}
              </p>
              <p className="text-xs text-gray-500">Projected Monthly</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatCurrency(costMetrics.projectedMonthlyCost * 12)}
              </p>
              <p className="text-xs text-gray-500">Projected Yearly</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {formatCurrency((costMetrics.budgetLimit - costMetrics.budgetUsed))}
              </p>
              <p className="text-xs text-gray-500">Budget Remaining</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500">
          <p>Last updated: {new Date().toLocaleString()}</p>
          <p className="mt-1">Internal use only - AI Perception Engineering</p>
        </div>
      </div>
    </div>
  );
}
