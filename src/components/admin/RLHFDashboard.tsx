/**
 * RLHF Metrics Dashboard
 *
 * Admin dashboard for monitoring RLHF system health and performance:
 * - Feedback collection metrics
 * - Preference pair quality
 * - Experiment results
 * - Active learning progress
 * - Model improvement tracking
 *
 * @module components/admin/RLHFDashboard
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Time range for metrics
 */
type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

/**
 * Feedback metrics summary
 */
interface FeedbackMetrics {
  totalFeedback: number;
  positiveFeedback: number;
  negativeFeedback: number;
  thumbsUpRate: number;
  avgRating: number;
  feedbackByType: Record<string, number>;
  feedbackTrend: TrendData[];
}

/**
 * Preference pair metrics
 */
interface PreferencePairMetrics {
  totalPairs: number;
  highQualityPairs: number;
  avgConfidence: number;
  pairsBySource: Record<string, number>;
  pairsByOutcome: Record<string, number>;
  conversionToTraining: number;
}

/**
 * Experiment metrics
 */
interface ExperimentMetrics {
  activeExperiments: number;
  completedExperiments: number;
  avgLift: number;
  successRate: number;
  experimentsByType: Record<string, number>;
  recentResults: ExperimentResult[];
}

/**
 * Active learning metrics
 */
interface ActiveLearningMetrics {
  pendingBatches: number;
  totalLabels: number;
  avgLabelingTime: number;
  topLabelers: LabelerInfo[];
  labelQualityDistribution: Record<string, number>;
  trainingRuns: TrainingRunInfo[];
}

/**
 * Trend data point
 */
interface TrendData {
  date: string;
  value: number;
  label?: string;
}

/**
 * Experiment result summary
 */
interface ExperimentResult {
  id: string;
  name: string;
  promptType: string;
  winner: string | null;
  lift: number;
  confidence: number;
  concludedAt: string;
}

/**
 * Labeler information
 */
interface LabelerInfo {
  userId: string;
  email: string;
  totalLabels: number;
  accuracy: number;
  level: string;
}

/**
 * Training run information
 */
interface TrainingRunInfo {
  id: string;
  modelName: string;
  samples: number;
  improvement: number;
  completedAt: string;
}

/**
 * Dashboard props
 */
export interface RLHFDashboardProps {
  /** API endpoint for metrics */
  apiEndpoint?: string;
  /** Refresh interval in seconds */
  refreshInterval?: number;
  /** Show detailed breakdowns */
  showDetails?: boolean;
  /** Custom styles */
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RLHFDashboard({
  apiEndpoint = '/api/admin/rlhf-metrics',
  refreshInterval = 60,
  showDetails = true,
  className = '',
}: RLHFDashboardProps) {
  // State
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'feedback' | 'experiments' | 'learning'
  >('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Metrics state
  const [feedbackMetrics, setFeedbackMetrics] =
    useState<FeedbackMetrics | null>(null);
  const [pairMetrics, setPairMetrics] =
    useState<PreferencePairMetrics | null>(null);
  const [experimentMetrics, setExperimentMetrics] =
    useState<ExperimentMetrics | null>(null);
  const [learningMetrics, setLearningMetrics] =
    useState<ActiveLearningMetrics | null>(null);

  // Fetch metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${apiEndpoint}?range=${timeRange}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch metrics');
        }

        const data = await response.json();

        setFeedbackMetrics(data.feedback);
        setPairMetrics(data.pairs);
        setExperimentMetrics(data.experiments);
        setLearningMetrics(data.learning);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();

    // Set up auto-refresh
    const interval = setInterval(fetchMetrics, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [apiEndpoint, timeRange, refreshInterval]);

  // Computed values
  const overallHealth = useMemo(() => {
    if (!feedbackMetrics || !experimentMetrics || !learningMetrics) {
      return 'unknown';
    }

    const feedbackHealth = feedbackMetrics.thumbsUpRate >= 0.7;
    const experimentHealth = experimentMetrics.successRate >= 0.5;
    const labelingHealth = learningMetrics.pendingBatches < 10;

    if (feedbackHealth && experimentHealth && labelingHealth) return 'healthy';
    if (feedbackHealth || experimentHealth) return 'warning';
    return 'critical';
  }, [feedbackMetrics, experimentMetrics, learningMetrics]);

  return (
    <div className={`rlhf-dashboard ${className}`}>
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>RLHF Metrics Dashboard</h1>
          <span className={`health-indicator health-${overallHealth}`}>
            {overallHealth === 'healthy' && 'System Healthy'}
            {overallHealth === 'warning' && 'Attention Needed'}
            {overallHealth === 'critical' && 'Issues Detected'}
            {overallHealth === 'unknown' && 'Loading...'}
          </span>
        </div>

        <div className="header-right">
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
          />
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="error-banner">
          <span>Error loading metrics: {error}</span>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="tab-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'feedback' ? 'active' : ''}
          onClick={() => setActiveTab('feedback')}
        >
          Feedback
        </button>
        <button
          className={activeTab === 'experiments' ? 'active' : ''}
          onClick={() => setActiveTab('experiments')}
        >
          Experiments
        </button>
        <button
          className={activeTab === 'learning' ? 'active' : ''}
          onClick={() => setActiveTab('learning')}
        >
          Active Learning
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-content">
        {loading && !feedbackMetrics ? (
          <LoadingState />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                feedback={feedbackMetrics}
                pairs={pairMetrics}
                experiments={experimentMetrics}
                learning={learningMetrics}
              />
            )}
            {activeTab === 'feedback' && feedbackMetrics && (
              <FeedbackTab metrics={feedbackMetrics} showDetails={showDetails} />
            )}
            {activeTab === 'experiments' && experimentMetrics && (
              <ExperimentsTab
                metrics={experimentMetrics}
                showDetails={showDetails}
              />
            )}
            {activeTab === 'learning' && learningMetrics && (
              <ActiveLearningTab
                metrics={learningMetrics}
                showDetails={showDetails}
              />
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .rlhf-dashboard {
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .header-left h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .health-indicator {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }

        .health-healthy {
          background: #dcfce7;
          color: #166534;
        }

        .health-warning {
          background: #fef3c7;
          color: #92400e;
        }

        .health-critical {
          background: #fee2e2;
          color: #991b1b;
        }

        .health-unknown {
          background: #f1f5f9;
          color: #64748b;
        }

        .error-banner {
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #991b1b;
        }

        .error-banner button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          cursor: pointer;
        }

        .tab-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 8px;
        }

        .tab-nav button {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s;
        }

        .tab-nav button:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .tab-nav button.active {
          background: #3b82f6;
          color: white;
        }

        .dashboard-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Time range selector
 */
function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (v: TimeRange) => void;
}) {
  const options: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="time-range-selector">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}

      <style jsx>{`
        .time-range-selector {
          display: flex;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 4px;
        }

        button {
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          border-radius: 6px;
          font-size: 13px;
          transition: all 0.15s;
        }

        button:hover {
          color: #1e293b;
        }

        button.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="loading-state">
      <div className="spinner" />
      <p>Loading metrics...</p>

      <style jsx>{`
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
          color: #64748b;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Overview tab with key metrics
 */
function OverviewTab({
  feedback,
  pairs,
  experiments,
  learning,
}: {
  feedback: FeedbackMetrics | null;
  pairs: PreferencePairMetrics | null;
  experiments: ExperimentMetrics | null;
  learning: ActiveLearningMetrics | null;
}) {
  return (
    <div className="overview-tab">
      {/* Key metrics grid */}
      <div className="metrics-grid">
        <MetricCard
          title="Total Feedback"
          value={feedback?.totalFeedback ?? 0}
          format="number"
          trend={feedback?.thumbsUpRate ? feedback.thumbsUpRate * 100 : undefined}
          trendLabel="Positive Rate"
        />
        <MetricCard
          title="Preference Pairs"
          value={pairs?.totalPairs ?? 0}
          format="number"
          subtitle={`${pairs?.highQualityPairs ?? 0} high quality`}
        />
        <MetricCard
          title="Active Experiments"
          value={experiments?.activeExperiments ?? 0}
          format="number"
          subtitle={`${experiments?.completedExperiments ?? 0} completed`}
        />
        <MetricCard
          title="Labels Collected"
          value={learning?.totalLabels ?? 0}
          format="number"
          subtitle={`${learning?.pendingBatches ?? 0} pending batches`}
        />
      </div>

      {/* Performance summary */}
      <div className="performance-section">
        <h3>Performance Summary</h3>
        <div className="performance-grid">
          <div className="performance-item">
            <span className="label">Avg Feedback Rating</span>
            <span className="value">
              {feedback?.avgRating?.toFixed(1) ?? 'N/A'} / 5
            </span>
          </div>
          <div className="performance-item">
            <span className="label">Pair Confidence</span>
            <span className="value">
              {pairs?.avgConfidence
                ? `${(pairs.avgConfidence * 100).toFixed(0)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="performance-item">
            <span className="label">Experiment Success Rate</span>
            <span className="value">
              {experiments?.successRate
                ? `${(experiments.successRate * 100).toFixed(0)}%`
                : 'N/A'}
            </span>
          </div>
          <div className="performance-item">
            <span className="label">Avg Labeling Time</span>
            <span className="value">
              {learning?.avgLabelingTime
                ? `${(learning.avgLabelingTime / 1000).toFixed(1)}s`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent experiment results */}
      {experiments?.recentResults && experiments.recentResults.length > 0 && (
        <div className="recent-section">
          <h3>Recent Experiment Results</h3>
          <table className="results-table">
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Type</th>
                <th>Winner</th>
                <th>Lift</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              {experiments.recentResults.slice(0, 5).map((result) => (
                <tr key={result.id}>
                  <td>{result.name}</td>
                  <td>{result.promptType}</td>
                  <td>{result.winner ?? 'No winner'}</td>
                  <td
                    className={result.lift > 0 ? 'positive' : 'negative'}
                  >
                    {result.lift > 0 ? '+' : ''}
                    {(result.lift * 100).toFixed(1)}%
                  </td>
                  <td>{(result.confidence * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .overview-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        @media (max-width: 1024px) {
          .metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .performance-section h3,
        .recent-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .performance-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .performance-item {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
        }

        .performance-item .label {
          display: block;
          font-size: 13px;
          color: #64748b;
          margin-bottom: 4px;
        }

        .performance-item .value {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }

        .results-table {
          width: 100%;
          border-collapse: collapse;
        }

        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .results-table th {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .results-table td {
          font-size: 14px;
          color: #1e293b;
        }

        .results-table .positive {
          color: #16a34a;
        }

        .results-table .negative {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

/**
 * Metric card component
 */
function MetricCard({
  title,
  value,
  format = 'number',
  subtitle,
  trend,
  trendLabel,
}: {
  title: string;
  value: number;
  format?: 'number' | 'percent' | 'currency';
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
}) {
  const formattedValue = useMemo(() => {
    switch (format) {
      case 'percent':
        return `${value.toFixed(1)}%`;
      case 'currency':
        return `$${value.toLocaleString()}`;
      default:
        return value.toLocaleString();
    }
  }, [value, format]);

  return (
    <div className="metric-card">
      <span className="title">{title}</span>
      <span className="value">{formattedValue}</span>
      {subtitle && <span className="subtitle">{subtitle}</span>}
      {trend !== undefined && (
        <span className={`trend ${trend >= 50 ? 'positive' : 'warning'}`}>
          {trendLabel}: {trend.toFixed(0)}%
        </span>
      )}

      <style jsx>{`
        .metric-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .title {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 8px;
        }

        .value {
          font-size: 28px;
          font-weight: 600;
          color: #1e293b;
        }

        .subtitle {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .trend {
          font-size: 12px;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: 4px;
          display: inline-block;
          width: fit-content;
        }

        .trend.positive {
          background: #dcfce7;
          color: #166534;
        }

        .trend.warning {
          background: #fef3c7;
          color: #92400e;
        }
      `}</style>
    </div>
  );
}

/**
 * Feedback tab with detailed breakdown
 */
function FeedbackTab({
  metrics,
  showDetails,
}: {
  metrics: FeedbackMetrics;
  showDetails: boolean;
}) {
  return (
    <div className="feedback-tab">
      <div className="metrics-row">
        <MetricCard
          title="Total Feedback"
          value={metrics.totalFeedback}
          format="number"
        />
        <MetricCard
          title="Positive Feedback"
          value={metrics.positiveFeedback}
          format="number"
        />
        <MetricCard
          title="Negative Feedback"
          value={metrics.negativeFeedback}
          format="number"
        />
        <MetricCard
          title="Thumbs Up Rate"
          value={metrics.thumbsUpRate * 100}
          format="percent"
        />
      </div>

      {showDetails && (
        <>
          <div className="breakdown-section">
            <h3>Feedback by Type</h3>
            <div className="breakdown-grid">
              {Object.entries(metrics.feedbackByType).map(([type, count]) => (
                <div key={type} className="breakdown-item">
                  <span className="type">{type}</span>
                  <span className="count">{count.toLocaleString()}</span>
                  <div className="bar">
                    <div
                      className="fill"
                      style={{
                        width: `${(count / metrics.totalFeedback) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {metrics.feedbackTrend && metrics.feedbackTrend.length > 0 && (
            <div className="trend-section">
              <h3>Feedback Trend</h3>
              <SimpleTrendChart data={metrics.feedbackTrend} />
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .feedback-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .breakdown-section h3,
        .trend-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .breakdown-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .breakdown-item {
          display: grid;
          grid-template-columns: 150px 80px 1fr;
          gap: 16px;
          align-items: center;
        }

        .breakdown-item .type {
          font-size: 14px;
          color: #64748b;
          text-transform: capitalize;
        }

        .breakdown-item .count {
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
          text-align: right;
        }

        .breakdown-item .bar {
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }

        .breakdown-item .fill {
          height: 100%;
          background: #3b82f6;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}

/**
 * Experiments tab
 */
function ExperimentsTab({
  metrics,
  showDetails,
}: {
  metrics: ExperimentMetrics;
  showDetails: boolean;
}) {
  return (
    <div className="experiments-tab">
      <div className="metrics-row">
        <MetricCard
          title="Active Experiments"
          value={metrics.activeExperiments}
          format="number"
        />
        <MetricCard
          title="Completed"
          value={metrics.completedExperiments}
          format="number"
        />
        <MetricCard
          title="Average Lift"
          value={metrics.avgLift * 100}
          format="percent"
        />
        <MetricCard
          title="Success Rate"
          value={metrics.successRate * 100}
          format="percent"
        />
      </div>

      {showDetails && metrics.recentResults && (
        <div className="results-section">
          <h3>All Experiment Results</h3>
          <table className="experiments-table">
            <thead>
              <tr>
                <th>Experiment</th>
                <th>Type</th>
                <th>Winner</th>
                <th>Lift</th>
                <th>Confidence</th>
                <th>Concluded</th>
              </tr>
            </thead>
            <tbody>
              {metrics.recentResults.map((result) => (
                <tr key={result.id}>
                  <td className="name">{result.name}</td>
                  <td>{result.promptType}</td>
                  <td>{result.winner ?? 'None'}</td>
                  <td className={result.lift > 0 ? 'positive' : 'negative'}>
                    {result.lift > 0 ? '+' : ''}
                    {(result.lift * 100).toFixed(1)}%
                  </td>
                  <td>{(result.confidence * 100).toFixed(0)}%</td>
                  <td>
                    {new Date(result.concludedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .experiments-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .results-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .experiments-table {
          width: 100%;
          border-collapse: collapse;
        }

        .experiments-table th,
        .experiments-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .experiments-table th {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .experiments-table td {
          font-size: 14px;
          color: #1e293b;
        }

        .experiments-table td.name {
          font-weight: 500;
        }

        .experiments-table .positive {
          color: #16a34a;
        }

        .experiments-table .negative {
          color: #dc2626;
        }
      `}</style>
    </div>
  );
}

/**
 * Active learning tab
 */
function ActiveLearningTab({
  metrics,
  showDetails,
}: {
  metrics: ActiveLearningMetrics;
  showDetails: boolean;
}) {
  return (
    <div className="learning-tab">
      <div className="metrics-row">
        <MetricCard
          title="Pending Batches"
          value={metrics.pendingBatches}
          format="number"
        />
        <MetricCard
          title="Total Labels"
          value={metrics.totalLabels}
          format="number"
        />
        <MetricCard
          title="Avg Labeling Time"
          value={metrics.avgLabelingTime / 1000}
          format="number"
          subtitle="seconds"
        />
        <MetricCard
          title="Training Runs"
          value={metrics.trainingRuns?.length ?? 0}
          format="number"
        />
      </div>

      {showDetails && (
        <>
          {/* Top labelers */}
          {metrics.topLabelers && metrics.topLabelers.length > 0 && (
            <div className="labelers-section">
              <h3>Top Labelers</h3>
              <table className="labelers-table">
                <thead>
                  <tr>
                    <th>Labeler</th>
                    <th>Labels</th>
                    <th>Accuracy</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topLabelers.map((labeler) => (
                    <tr key={labeler.userId}>
                      <td>{labeler.email}</td>
                      <td>{labeler.totalLabels.toLocaleString()}</td>
                      <td>{(labeler.accuracy * 100).toFixed(0)}%</td>
                      <td>
                        <span className={`level level-${labeler.level}`}>
                          {labeler.level}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Training runs */}
          {metrics.trainingRuns && metrics.trainingRuns.length > 0 && (
            <div className="training-section">
              <h3>Recent Training Runs</h3>
              <table className="training-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Samples</th>
                    <th>Improvement</th>
                    <th>Completed</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.trainingRuns.map((run) => (
                    <tr key={run.id}>
                      <td>{run.modelName}</td>
                      <td>{run.samples.toLocaleString()}</td>
                      <td className="positive">
                        +{(run.improvement * 100).toFixed(1)}%
                      </td>
                      <td>
                        {new Date(run.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .learning-tab {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .metrics-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .labelers-section h3,
        .training-section h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }

        .labelers-table,
        .training-table {
          width: 100%;
          border-collapse: collapse;
        }

        .labelers-table th,
        .labelers-table td,
        .training-table th,
        .training-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }

        .labelers-table th,
        .training-table th {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
        }

        .labelers-table td,
        .training-table td {
          font-size: 14px;
          color: #1e293b;
        }

        .level {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          text-transform: capitalize;
        }

        .level-gold {
          background: #fef3c7;
          color: #92400e;
        }

        .level-silver {
          background: #f1f5f9;
          color: #475569;
        }

        .level-bronze {
          background: #fed7aa;
          color: #9a3412;
        }

        .positive {
          color: #16a34a;
        }
      `}</style>
    </div>
  );
}

/**
 * Simple trend chart
 */
function SimpleTrendChart({ data }: { data: TrendData[] }) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const range = maxValue - minValue || 1;

  return (
    <div className="trend-chart">
      <div className="chart-area">
        {data.map((point, i) => (
          <div
            key={i}
            className="bar"
            style={{
              height: `${((point.value - minValue) / range) * 80 + 20}%`,
            }}
            title={`${point.date}: ${point.value}`}
          />
        ))}
      </div>
      <div className="chart-labels">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>

      <style jsx>{`
        .trend-chart {
          height: 120px;
          display: flex;
          flex-direction: column;
        }

        .chart-area {
          flex: 1;
          display: flex;
          align-items: flex-end;
          gap: 4px;
        }

        .bar {
          flex: 1;
          background: #3b82f6;
          border-radius: 2px 2px 0 0;
          min-height: 4px;
        }

        .chart-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 8px;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default RLHFDashboard;
