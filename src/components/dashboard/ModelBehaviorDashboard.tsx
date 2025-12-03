'use client';

/**
 * Model Behavior Dashboard
 *
 * Phase 4, Week 8 Extended - RLHF & Feedback Loop Checklist
 *
 * Features:
 * - Model performance metrics visualization
 * - Response quality tracking
 * - Latency monitoring
 * - Error rate analysis
 * - Token usage statistics
 * - Model comparison view
 * - Drift detection alerts
 */

import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface ModelMetrics {
  modelId: string;
  modelName: string;
  version: string;
  metrics: {
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    errorRate: number;
    successRate: number;
    totalRequests: number;
    avgTokensInput: number;
    avgTokensOutput: number;
    avgCostPerRequest: number;
    avgConfidence: number;
  };
  qualityMetrics: {
    avgUserRating: number;
    thumbsUp: number;
    thumbsDown: number;
    corrections: number;
    ratingCount: number;
  };
  driftIndicators: {
    confidenceTrend: 'stable' | 'increasing' | 'decreasing';
    latencyTrend: 'stable' | 'increasing' | 'decreasing';
    errorTrend: 'stable' | 'increasing' | 'decreasing';
    driftScore: number;
  };
}

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

interface ModelBehaviorData {
  models: ModelMetrics[];
  timeRange: '1h' | '24h' | '7d' | '30d';
  latencyTimeSeries: TimeSeriesPoint[];
  errorTimeSeries: TimeSeriesPoint[];
  requestTimeSeries: TimeSeriesPoint[];
  lastUpdated: string;
}

interface ModelBehaviorDashboardProps {
  data?: ModelBehaviorData;
  onTimeRangeChange?: (range: '1h' | '24h' | '7d' | '30d') => void;
  onModelSelect?: (modelId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  selectedModelId?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

function getStatusColor(value: number, thresholds: { good: number; warning: number; reverse?: boolean }): string {
  const { good, warning, reverse } = thresholds;
  if (reverse) {
    if (value <= good) return 'text-green-600';
    if (value <= warning) return 'text-yellow-600';
    return 'text-red-600';
  }
  if (value >= good) return 'text-green-600';
  if (value >= warning) return 'text-yellow-600';
  return 'text-red-600';
}

function getTrendIcon(trend: 'stable' | 'increasing' | 'decreasing'): React.ReactNode {
  switch (trend) {
    case 'increasing':
      return (
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    case 'decreasing':
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      );
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'stable' | 'increasing' | 'decreasing';
  trendLabel?: string;
  colorClass?: string;
  icon?: React.ReactNode;
}

function MetricCard({ title, value, subtitle, trend, trendLabel, colorClass, icon }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className={`mt-1 text-2xl font-semibold ${colorClass || 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-gray-50 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center text-sm">
          {getTrendIcon(trend)}
          <span className="ml-1 text-gray-600">{trendLabel || trend}</span>
        </div>
      )}
    </div>
  );
}

interface LatencyChartProps {
  data: TimeSeriesPoint[];
  height?: number;
}

function LatencyChart({ data, height = 120 }: LatencyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded">
        <p className="text-sm text-gray-500">No latency data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="relative" style={{ height }}>
      <svg className="w-full h-full" viewBox={`0 0 ${data.length} ${height}`} preserveAspectRatio="none">
        {/* Grid lines */}
        <line x1="0" y1={height * 0.25} x2={data.length} y2={height * 0.25} stroke="#e5e7eb" strokeWidth="1" />
        <line x1="0" y1={height * 0.5} x2={data.length} y2={height * 0.5} stroke="#e5e7eb" strokeWidth="1" />
        <line x1="0" y1={height * 0.75} x2={data.length} y2={height * 0.75} stroke="#e5e7eb" strokeWidth="1" />

        {/* Line chart */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={data
            .map((point, i) => {
              const y = height - ((point.value - minValue) / range) * (height - 20) - 10;
              return `${i},${y}`;
            })
            .join(' ')}
        />

        {/* Area fill */}
        <polygon
          fill="url(#latencyGradient)"
          opacity="0.2"
          points={`0,${height} ${data
            .map((point, i) => {
              const y = height - ((point.value - minValue) / range) * (height - 20) - 10;
              return `${i},${y}`;
            })
            .join(' ')} ${data.length - 1},${height}`}
        />

        <defs>
          <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Y-axis labels */}
      <div className="absolute top-0 left-0 h-full flex flex-col justify-between text-xs text-gray-500 pointer-events-none">
        <span>{formatLatency(maxValue)}</span>
        <span>{formatLatency((maxValue + minValue) / 2)}</span>
        <span>{formatLatency(minValue)}</span>
      </div>
    </div>
  );
}

interface ModelCardProps {
  model: ModelMetrics;
  isSelected: boolean;
  onClick: () => void;
}

function ModelCard({ model, isSelected, onClick }: ModelCardProps) {
  const { metrics, qualityMetrics, driftIndicators } = model;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-lg border cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{model.modelName}</h4>
          <p className="text-xs text-gray-500">v{model.version}</p>
        </div>
        {driftIndicators.driftScore > 0.3 && (
          <span className="px-2 py-1 text-xs font-medium text-orange-700 bg-orange-100 rounded">
            Drift Alert
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-gray-500">Latency (p95)</p>
          <p className={`font-medium ${getStatusColor(metrics.p95Latency, { good: 1000, warning: 2000, reverse: true })}`}>
            {formatLatency(metrics.p95Latency)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Success Rate</p>
          <p className={`font-medium ${getStatusColor(metrics.successRate, { good: 99, warning: 95 })}`}>
            {metrics.successRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-gray-500">Avg Rating</p>
          <p className="font-medium text-gray-900">
            {qualityMetrics.avgUserRating.toFixed(1)}/5
          </p>
        </div>
        <div>
          <p className="text-gray-500">Requests</p>
          <p className="font-medium text-gray-900">
            {formatNumber(metrics.totalRequests)}
          </p>
        </div>
      </div>

      {/* Trend indicators */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span>Confidence:</span>
          {getTrendIcon(driftIndicators.confidenceTrend)}
        </div>
        <div className="flex items-center gap-1">
          <span>Latency:</span>
          {getTrendIcon(driftIndicators.latencyTrend)}
        </div>
        <div className="flex items-center gap-1">
          <span>Errors:</span>
          {getTrendIcon(driftIndicators.errorTrend)}
        </div>
      </div>
    </div>
  );
}

interface QualityMetricsPanelProps {
  metrics: ModelMetrics['qualityMetrics'];
}

function QualityMetricsPanel({ metrics }: QualityMetricsPanelProps) {
  const totalFeedback = metrics.thumbsUp + metrics.thumbsDown;
  const positiveRate = totalFeedback > 0 ? (metrics.thumbsUp / totalFeedback) * 100 : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h4 className="text-sm font-medium text-gray-900 mb-4">Quality Metrics</h4>

      <div className="space-y-4">
        {/* Rating */}
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">Average Rating</span>
            <span className="font-medium">{metrics.avgUserRating.toFixed(1)}/5</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${star <= Math.round(metrics.avgUserRating) ? 'text-yellow-400' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">{metrics.ratingCount} ratings</p>
        </div>

        {/* Thumbs feedback */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">User Feedback</span>
            <span className="text-gray-500">{totalFeedback} total</span>
          </div>
          <div className="flex gap-2 mb-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{ width: `${positiveRate}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center text-green-600">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {metrics.thumbsUp}
            </span>
            <span className="flex items-center text-red-600">
              <svg className="w-4 h-4 mr-1 transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              {metrics.thumbsDown}
            </span>
          </div>
        </div>

        {/* Corrections */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Corrections Made</span>
            <span className="font-medium text-orange-600">{metrics.corrections}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {totalFeedback > 0
              ? `${((metrics.corrections / totalFeedback) * 100).toFixed(1)}% correction rate`
              : 'No corrections yet'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MOCK DATA GENERATOR
// ============================================================================

function generateMockData(): ModelBehaviorData {
  const now = new Date();

  const generateTimeSeries = (count: number, baseValue: number, variance: number): TimeSeriesPoint[] => {
    return Array.from({ length: count }, (_, i) => ({
      timestamp: new Date(now.getTime() - (count - i) * 3600000).toISOString(),
      value: baseValue + (Math.random() - 0.5) * variance,
    }));
  };

  return {
    models: [
      {
        modelId: 'gpt-4-turbo',
        modelName: 'GPT-4 Turbo',
        version: '0125-preview',
        metrics: {
          avgLatency: 1250,
          p50Latency: 980,
          p95Latency: 2100,
          p99Latency: 3500,
          errorRate: 0.8,
          successRate: 99.2,
          totalRequests: 45230,
          avgTokensInput: 520,
          avgTokensOutput: 380,
          avgCostPerRequest: 0.0085,
          avgConfidence: 0.87,
        },
        qualityMetrics: {
          avgUserRating: 4.3,
          thumbsUp: 1245,
          thumbsDown: 89,
          corrections: 45,
          ratingCount: 890,
        },
        driftIndicators: {
          confidenceTrend: 'stable',
          latencyTrend: 'increasing',
          errorTrend: 'stable',
          driftScore: 0.15,
        },
      },
      {
        modelId: 'claude-3-opus',
        modelName: 'Claude 3 Opus',
        version: '20240229',
        metrics: {
          avgLatency: 1450,
          p50Latency: 1100,
          p95Latency: 2400,
          p99Latency: 4200,
          errorRate: 0.5,
          successRate: 99.5,
          totalRequests: 32150,
          avgTokensInput: 480,
          avgTokensOutput: 420,
          avgCostPerRequest: 0.0125,
          avgConfidence: 0.91,
        },
        qualityMetrics: {
          avgUserRating: 4.5,
          thumbsUp: 980,
          thumbsDown: 42,
          corrections: 28,
          ratingCount: 620,
        },
        driftIndicators: {
          confidenceTrend: 'increasing',
          latencyTrend: 'stable',
          errorTrend: 'decreasing',
          driftScore: 0.08,
        },
      },
      {
        modelId: 'gemini-pro',
        modelName: 'Gemini Pro',
        version: '1.0',
        metrics: {
          avgLatency: 890,
          p50Latency: 720,
          p95Latency: 1500,
          p99Latency: 2200,
          errorRate: 1.2,
          successRate: 98.8,
          totalRequests: 28900,
          avgTokensInput: 450,
          avgTokensOutput: 350,
          avgCostPerRequest: 0.0045,
          avgConfidence: 0.83,
        },
        qualityMetrics: {
          avgUserRating: 4.0,
          thumbsUp: 720,
          thumbsDown: 110,
          corrections: 65,
          ratingCount: 480,
        },
        driftIndicators: {
          confidenceTrend: 'decreasing',
          latencyTrend: 'stable',
          errorTrend: 'increasing',
          driftScore: 0.35,
        },
      },
    ],
    timeRange: '24h',
    latencyTimeSeries: generateTimeSeries(24, 1200, 400),
    errorTimeSeries: generateTimeSeries(24, 0.8, 0.5),
    requestTimeSeries: generateTimeSeries(24, 1800, 600),
    lastUpdated: now.toISOString(),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ModelBehaviorDashboard({
  data: propData,
  onTimeRangeChange,
  onModelSelect,
  onRefresh,
  isLoading = false,
  selectedModelId,
}: ModelBehaviorDashboardProps) {
  const [data, setData] = useState<ModelBehaviorData | null>(propData || null);
  const [internalSelectedModel, setInternalSelectedModel] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Use prop data or generate mock data
  useEffect(() => {
    if (propData) {
      setData(propData);
    } else {
      setData(generateMockData());
    }
  }, [propData]);

  const effectiveSelectedModel = selectedModelId || internalSelectedModel;

  const selectedModel = useMemo(() => {
    if (!data || !effectiveSelectedModel) return null;
    return data.models.find(m => m.modelId === effectiveSelectedModel) || null;
  }, [data, effectiveSelectedModel]);

  const handleModelClick = (modelId: string) => {
    setInternalSelectedModel(modelId);
    onModelSelect?.(modelId);
  };

  const handleTimeRangeChange = (range: '1h' | '24h' | '7d' | '30d') => {
    setTimeRange(range);
    onTimeRangeChange?.(range);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Calculate aggregate metrics
  const totalRequests = data.models.reduce((sum, m) => sum + m.metrics.totalRequests, 0);
  const avgSuccessRate = data.models.reduce((sum, m) => sum + m.metrics.successRate, 0) / data.models.length;
  const avgLatency = data.models.reduce((sum, m) => sum + m.metrics.avgLatency, 0) / data.models.length;
  const avgCost = data.models.reduce((sum, m) => sum + m.metrics.avgCostPerRequest, 0) / data.models.length;
  const driftAlerts = data.models.filter(m => m.driftIndicators.driftScore > 0.3).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Model Behavior Dashboard</h2>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(data.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['1h', '24h', '7d', '30d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => handleTimeRangeChange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total Requests"
          value={formatNumber(totalRequests)}
          subtitle={`${timeRange} period`}
          icon={
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg Success Rate"
          value={`${avgSuccessRate.toFixed(1)}%`}
          colorClass={getStatusColor(avgSuccessRate, { good: 99, warning: 95 })}
          icon={
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg Latency"
          value={formatLatency(avgLatency)}
          colorClass={getStatusColor(avgLatency, { good: 1000, warning: 2000, reverse: true })}
          icon={
            <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Avg Cost/Request"
          value={formatCost(avgCost)}
          icon={
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          title="Drift Alerts"
          value={driftAlerts}
          colorClass={driftAlerts > 0 ? 'text-orange-600' : 'text-green-600'}
          subtitle={driftAlerts > 0 ? 'Models need attention' : 'All models stable'}
          icon={
            <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Latency Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Latency Over Time</h3>
        <LatencyChart data={data.latencyTimeSeries} />
      </div>

      {/* Models Grid */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-4">Models</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.models.map((model) => (
            <ModelCard
              key={model.modelId}
              model={model}
              isSelected={effectiveSelectedModel === model.modelId}
              onClick={() => handleModelClick(model.modelId)}
            />
          ))}
        </div>
      </div>

      {/* Selected Model Details */}
      {selectedModel && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Performance Metrics */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-4">
              {selectedModel.modelName} - Performance
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Avg Latency</p>
                <p className="text-lg font-medium">{formatLatency(selectedModel.metrics.avgLatency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P50 Latency</p>
                <p className="text-lg font-medium">{formatLatency(selectedModel.metrics.p50Latency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P95 Latency</p>
                <p className="text-lg font-medium">{formatLatency(selectedModel.metrics.p95Latency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">P99 Latency</p>
                <p className="text-lg font-medium">{formatLatency(selectedModel.metrics.p99Latency)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Tokens In</p>
                <p className="text-lg font-medium">{selectedModel.metrics.avgTokensInput}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Tokens Out</p>
                <p className="text-lg font-medium">{selectedModel.metrics.avgTokensOutput}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Avg Confidence</p>
                <p className="text-lg font-medium">{(selectedModel.metrics.avgConfidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Cost/Request</p>
                <p className="text-lg font-medium">{formatCost(selectedModel.metrics.avgCostPerRequest)}</p>
              </div>
            </div>
          </div>

          {/* Quality Metrics */}
          <QualityMetricsPanel metrics={selectedModel.qualityMetrics} />
        </div>
      )}
    </div>
  );
}

export default ModelBehaviorDashboard;
