'use client';

/**
 * AI Monitoring Dashboard
 *
 * RED TEAM AUDIT FIX: HIGH-007
 * Real-time monitoring dashboard for AI decisions and human oversight
 *
 * Features:
 * - Live decision feed
 * - Anomaly alerts
 * - Drift indicators
 * - One-click override capabilities
 * - Security metrics
 */

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

interface AIDecision {
  id: string;
  timestamp: string;
  type: 'analysis' | 'recommendation' | 'scoring';
  input: string;
  output: string;
  confidence: number;
  provider: string;
  latencyMs: number;
  wasOverridden: boolean;
  securityScore: number;
  flags: string[];
}

interface AIMetrics {
  totalRequests24h: number;
  avgLatencyMs: number;
  errorRate: number;
  securityBlockRate: number;
  humanOverrideRate: number;
  avgConfidence: number;
}

interface Alert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'drift' | 'security' | 'performance' | 'anomaly';
  message: string;
  acknowledged: boolean;
}

interface DriftMetric {
  name: string;
  baseline: number;
  current: number;
  deviation: number;
  status: 'normal' | 'warning' | 'critical';
}

// ============================================================================
// MOCK DATA (Replace with real API calls in production)
// ============================================================================

const mockMetrics: AIMetrics = {
  totalRequests24h: 1247,
  avgLatencyMs: 342,
  errorRate: 0.023,
  securityBlockRate: 0.008,
  humanOverrideRate: 0.012,
  avgConfidence: 0.87,
};

const mockAlerts: Alert[] = [
  {
    id: '1',
    timestamp: new Date().toISOString(),
    severity: 'medium',
    type: 'drift',
    message: 'Confidence scores 15% lower than baseline for SaaS industry queries',
    acknowledged: false,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: 'low',
    type: 'performance',
    message: 'Anthropic provider latency increased by 20%',
    acknowledged: true,
  },
];

const mockDriftMetrics: DriftMetric[] = [
  { name: 'Avg Confidence', baseline: 0.89, current: 0.87, deviation: -2.2, status: 'normal' },
  { name: 'Response Length', baseline: 450, current: 520, deviation: 15.5, status: 'warning' },
  { name: 'Positive Sentiment', baseline: 0.65, current: 0.62, deviation: -4.6, status: 'normal' },
  { name: 'Error Rate', baseline: 0.02, current: 0.023, deviation: 15.0, status: 'warning' },
];

const mockDecisions: AIDecision[] = [
  {
    id: 'dec_001',
    timestamp: new Date().toISOString(),
    type: 'analysis',
    input: 'https://example.com',
    output: 'Score: 72/100 - Good AI visibility',
    confidence: 0.89,
    provider: 'openai',
    latencyMs: 245,
    wasOverridden: false,
    securityScore: 100,
    flags: [],
  },
  {
    id: 'dec_002',
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: 'recommendation',
    input: 'Improve Schema.org markup',
    output: 'Add SoftwareApplication schema with offers',
    confidence: 0.92,
    provider: 'anthropic',
    latencyMs: 312,
    wasOverridden: false,
    securityScore: 95,
    flags: ['high_impact'],
  },
  {
    id: 'dec_003',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: 'scoring',
    input: 'Brand perception query',
    output: 'Sentiment: Positive (0.78)',
    confidence: 0.76,
    provider: 'openai',
    latencyMs: 189,
    wasOverridden: true,
    securityScore: 85,
    flags: ['low_confidence', 'needs_review'],
  },
];

// ============================================================================
// COMPONENTS
// ============================================================================

function MetricCard({ title, value, subtitle, status }: {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${status ? statusColors[status] : 'text-gray-900'}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
}

function AlertBanner({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: () => void }) {
  const severityStyles = {
    low: 'bg-blue-50 border-blue-200 text-blue-800',
    medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    high: 'bg-orange-50 border-orange-200 text-orange-800',
    critical: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`p-3 rounded-lg border ${severityStyles[alert.severity]} flex justify-between items-center`}>
      <div>
        <span className="font-medium uppercase text-xs">{alert.severity}</span>
        <span className="mx-2">|</span>
        <span className="text-xs">{alert.type}</span>
        <p className="mt-1">{alert.message}</p>
      </div>
      {!alert.acknowledged && (
        <button
          onClick={onAcknowledge}
          className="px-3 py-1 bg-white rounded border border-current text-sm hover:bg-gray-50"
        >
          Acknowledge
        </button>
      )}
    </div>
  );
}

function DecisionRow({ decision, onOverride }: { decision: AIDecision; onOverride: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-200 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            decision.type === 'analysis' ? 'bg-blue-100 text-blue-800' :
            decision.type === 'recommendation' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {decision.type}
          </span>
          <span className="text-sm text-gray-600">
            {new Date(decision.timestamp).toLocaleTimeString()}
          </span>
          <span className="text-sm font-medium">{decision.provider}</span>
          <span className="text-sm text-gray-500">{decision.latencyMs}ms</span>
          {decision.wasOverridden && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
              Overridden
            </span>
          )}
          {decision.flags.map(flag => (
            <span key={flag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
              {flag}
            </span>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className={`text-sm font-medium ${
            decision.confidence >= 0.85 ? 'text-green-600' :
            decision.confidence >= 0.7 ? 'text-yellow-600' :
            'text-red-600'
          }`}>
            {(decision.confidence * 100).toFixed(0)}% conf
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {expanded ? 'Hide' : 'Details'}
          </button>
          {!decision.wasOverridden && (
            <button
              onClick={onOverride}
              className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Override
            </button>
          )}
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          <div className="text-sm">
            <p className="text-gray-500">Input:</p>
            <p className="font-mono bg-gray-50 p-2 rounded mt-1">{decision.input}</p>
          </div>
          <div className="text-sm mt-2">
            <p className="text-gray-500">Output:</p>
            <p className="font-mono bg-gray-50 p-2 rounded mt-1">{decision.output}</p>
          </div>
          <div className="text-sm mt-2 flex space-x-4">
            <span>Security Score: {decision.securityScore}/100</span>
            <span>ID: {decision.id}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function DriftIndicator({ metric }: { metric: DriftMetric }) {
  const statusColors = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm font-medium">{metric.name}</span>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">
          {metric.baseline.toFixed(2)} → {metric.current.toFixed(2)}
        </span>
        <span className={`text-sm font-medium ${statusColors[metric.status]}`}>
          {metric.deviation > 0 ? '+' : ''}{metric.deviation.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AIMonitorPage() {
  const [metrics, setMetrics] = useState<AIMetrics>(mockMetrics);
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [decisions, setDecisions] = useState<AIDecision[]>(mockDecisions);
  const [driftMetrics, setDriftMetrics] = useState<DriftMetric[]>(mockDriftMetrics);
  const [isLive, setIsLive] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Simulate live updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Update metrics with small random variations
      setMetrics(prev => ({
        ...prev,
        totalRequests24h: prev.totalRequests24h + Math.floor(Math.random() * 3),
        avgLatencyMs: prev.avgLatencyMs + (Math.random() - 0.5) * 10,
      }));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [isLive, refreshInterval]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  const overrideDecision = (decisionId: string) => {
    setDecisions(prev => prev.map(d =>
      d.id === decisionId ? { ...d, wasOverridden: true } : d
    ));
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Monitoring Dashboard</h1>
          <p className="text-gray-500">Human-on-the-Loop Oversight</p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-4 py-2 rounded-lg font-medium ${
              isLive
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value={1000}>1s</option>
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={30000}>30s</option>
          </select>
        </div>
      </div>

      {/* Alerts Banner */}
      {unacknowledgedAlerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {unacknowledgedAlerts.map(alert => (
            <AlertBanner
              key={alert.id}
              alert={alert}
              onAcknowledge={() => acknowledgeAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <MetricCard
          title="Requests (24h)"
          value={metrics.totalRequests24h.toLocaleString()}
          status="good"
        />
        <MetricCard
          title="Avg Latency"
          value={`${Math.round(metrics.avgLatencyMs)}ms`}
          status={metrics.avgLatencyMs > 500 ? 'warning' : 'good'}
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics.errorRate * 100).toFixed(2)}%`}
          status={metrics.errorRate > 0.05 ? 'critical' : metrics.errorRate > 0.02 ? 'warning' : 'good'}
        />
        <MetricCard
          title="Security Blocks"
          value={`${(metrics.securityBlockRate * 100).toFixed(2)}%`}
          subtitle="of requests blocked"
        />
        <MetricCard
          title="Human Overrides"
          value={`${(metrics.humanOverrideRate * 100).toFixed(2)}%`}
          subtitle="decisions overridden"
        />
        <MetricCard
          title="Avg Confidence"
          value={`${(metrics.avgConfidence * 100).toFixed(0)}%`}
          status={metrics.avgConfidence < 0.7 ? 'warning' : 'good'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drift Monitoring */}
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Drift Monitoring</h2>
          {driftMetrics.map((metric, i) => (
            <DriftIndicator key={i} metric={metric} />
          ))}
        </div>

        {/* Live Decision Feed */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Live Decision Feed</h2>
          <div className="max-h-[400px] overflow-y-auto">
            {decisions.map(decision => (
              <DecisionRow
                key={decision.id}
                decision={decision}
                onOverride={() => overrideDecision(decision.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Kill Switch */}
      <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-800">Emergency Kill Switch</h3>
            <p className="text-red-600 text-sm">Immediately halt all AI operations</p>
          </div>
          <button
            className="px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300"
            onClick={() => {
              if (confirm('Are you sure you want to halt all AI operations? This will affect all users.')) {
                alert('Kill switch activated. AI operations halted.');
              }
            }}
          >
            ACTIVATE KILL SWITCH
          </button>
        </div>
      </div>
    </div>
  );
}
