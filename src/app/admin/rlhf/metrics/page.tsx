/**
 * RLHF Metrics Dashboard
 *
 * Phase 4, Week 8 Extended
 * Comprehensive RLHF feedback loop metrics and monitoring
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RLHF Metrics | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface FeedbackMetrics {
  totalFeedback: number;
  thumbsUp: number;
  thumbsDown: number;
  avgRating: number;
  feedbackRate: number; // % of analyses with feedback
  signalToNoise: number; // Quality ratio
}

interface PreferencePairMetrics {
  totalPairs: number;
  explicitPairs: number;
  implicitPairs: number;
  weeklyTarget: number;
  agreementRate: number; // Inter-annotator agreement
}

interface RewardModelMetrics {
  currentVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrainedAt: string;
  trainingDataSize: number;
}

interface ActiveLearningMetrics {
  uncertainCases: number;
  labeledThisWeek: number;
  labelingEfficiencyGain: number;
  strategicRequestsSent: number;
  responseRate: number;
}

interface LoopLatencyMetrics {
  feedbackToIngestion: number; // ms
  ingestionToProcessing: number;
  processingToModelUpdate: number;
  totalLatency: number;
  updateFrequency: string;
}

interface ExperimentMetrics {
  activeExperiments: number;
  completedExperiments: number;
  avgLift: number;
  significantWins: number;
}

// ================================================================
// DATA FETCHING - Uses real API
// ================================================================

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vectorialdata.com';

interface MetricsData {
  feedback: FeedbackMetrics;
  preferences: PreferencePairMetrics;
  rewardModel: RewardModelMetrics;
  activeLearning: ActiveLearningMetrics;
  loopLatency: LoopLatencyMetrics;
  experiments: ExperimentMetrics;
  feedbackTrend: { date: string; positive: number; negative: number }[];
  recentExperiments: { name: string; status: 'running' | 'completed' | 'paused'; lift: number | null; significance: number | null }[];
  hasData: boolean;
}

async function getMetricsData(): Promise<MetricsData> {
  // Default empty state
  const emptyState: MetricsData = {
    feedback: { totalFeedback: 0, thumbsUp: 0, thumbsDown: 0, avgRating: 0, feedbackRate: 0, signalToNoise: 0 },
    preferences: { totalPairs: 0, explicitPairs: 0, implicitPairs: 0, weeklyTarget: 1000, agreementRate: 0 },
    rewardModel: { currentVersion: 'N/A', accuracy: 0, precision: 0, recall: 0, f1Score: 0, lastTrainedAt: '', trainingDataSize: 0 },
    activeLearning: { uncertainCases: 0, labeledThisWeek: 0, labelingEfficiencyGain: 0, strategicRequestsSent: 0, responseRate: 0 },
    loopLatency: { feedbackToIngestion: 0, ingestionToProcessing: 0, processingToModelUpdate: 0, totalLatency: 0, updateFrequency: 'Not configured' },
    experiments: { activeExperiments: 0, completedExperiments: 0, avgLift: 0, significantWins: 0 },
    feedbackTrend: [],
    recentExperiments: [],
    hasData: false,
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/rlhf?type=metrics`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error('Failed to fetch RLHF metrics:', res.status);
      return emptyState;
    }

    const data = await res.json();

    // Check if we have real data
    if (data.overview?.totalFeedback > 0) {
      return {
        feedback: {
          totalFeedback: data.overview.totalFeedback || 0,
          thumbsUp: 0,
          thumbsDown: 0,
          avgRating: data.overview.averageRating || 0,
          feedbackRate: 0,
          signalToNoise: 0,
        },
        preferences: emptyState.preferences,
        rewardModel: {
          currentVersion: 'v1.0',
          accuracy: data.overview.modelAccuracy || 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          lastTrainedAt: data.overview.lastTraining || '',
          trainingDataSize: 0,
        },
        activeLearning: emptyState.activeLearning,
        loopLatency: emptyState.loopLatency,
        experiments: emptyState.experiments,
        feedbackTrend: data.trends || [],
        recentExperiments: [],
        hasData: true,
      };
    }

    return emptyState;
  } catch (error) {
    console.error('Error fetching RLHF metrics:', error);
    return emptyState;
  }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}

function getMetricColor(value: number, thresholds: { good: number; warning: number }): string {
  if (value >= thresholds.good) return 'text-green-400';
  if (value >= thresholds.warning) return 'text-yellow-400';
  return 'text-red-400';
}

// ================================================================
// COMPONENTS
// ================================================================

function StatCard({ label, value, subvalue, color, icon }: {
  label: string;
  value: string | number;
  subvalue?: string;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm text-gray-400">{label}</div>
        {icon && <div className="text-gray-500">{icon}</div>}
      </div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
      {subvalue && <div className="text-xs text-gray-500 mt-1">{subvalue}</div>}
    </div>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
      <div
        className={`h-full ${color} transition-all`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function MetricGauge({ value, label, thresholds }: {
  value: number;
  label: string;
  thresholds: { good: number; warning: number };
}) {
  const color = getMetricColor(value, thresholds);
  const percentage = Math.min(100, value * 100);

  return (
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-2">
        <svg className="w-24 h-24 transform -rotate-90">
          <circle
            className="text-gray-700"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r="40"
            cx="48"
            cy="48"
          />
          <circle
            className={color.replace('text-', 'stroke-').replace('-400', '-500')}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
            fill="transparent"
            r="40"
            cx="48"
            cy="48"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-xl font-bold ${color}`}>{(value * 100).toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}

function FeedbackTrendChart({ data }: { data: { date: string; positive: number; negative: number }[] }) {
  const maxValue = Math.max(...data.flatMap(d => [d.positive, d.negative]));

  return (
    <div className="h-40">
      <div className="flex items-end justify-between h-32 gap-2">
        {data.map((day, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-green-500 rounded-t"
                style={{ height: `${(day.positive / maxValue) * 100}px` }}
                title={`${day.positive} positive`}
              />
              <div
                className="w-full bg-red-500 rounded-b"
                style={{ height: `${(day.negative / maxValue) * 20}px` }}
                title={`${day.negative} negative`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2">
        {data.map((day, i) => (
          <span key={i} className="text-xs text-gray-500">{day.date}</span>
        ))}
      </div>
    </div>
  );
}

function ExperimentRow({ experiment }: {
  experiment: { name: string; status: string; lift: number | null; significance: number | null };
}) {
  const statusColors: Record<string, string> = {
    running: 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          experiment.status === 'running' ? 'bg-blue-500 animate-pulse' :
          experiment.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
        }`} />
        <span className="text-white text-sm">{experiment.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className={`px-2 py-0.5 text-xs rounded ${statusColors[experiment.status]}`}>
          {experiment.status}
        </span>
        {experiment.lift !== null && (
          <span className={`text-sm font-mono ${experiment.lift >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {experiment.lift >= 0 ? '+' : ''}{experiment.lift.toFixed(1)}%
          </span>
        )}
        {experiment.significance !== null && (
          <span className={`text-xs ${experiment.significance >= 0.95 ? 'text-green-400' : 'text-gray-500'}`}>
            p={experiment.significance.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function RLHFMetricsPage() {
  const {
    feedback,
    preferences,
    rewardModel,
    activeLearning,
    loopLatency,
    experiments,
    feedbackTrend,
    recentExperiments,
    hasData,
  } = await getMetricsData();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">RLHF Metrics Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Feedback loop performance and model quality</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Trigger Retrain
            </button>
          </div>
        </div>

        {/* No Data Notice */}
        {!hasData && (
          <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <div className="text-4xl mb-4">-</div>
            <h3 className="text-lg font-medium text-white mb-2">No RLHF Data Available</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              RLHF feedback tables are not configured yet. Once the RLHF pipeline is set up
              and users start providing feedback, metrics will appear here.
            </p>
          </div>
        )}

        {/* Key Metrics Row */}
        <section className="mb-8 grid grid-cols-6 gap-4">
          <StatCard
            label="Total Feedback"
            value={feedback.totalFeedback.toLocaleString()}
            subvalue={`${feedback.feedbackRate.toFixed(1)}% rate`}
          />
          <StatCard
            label="Positive Rate"
            value={`${((feedback.thumbsUp / feedback.totalFeedback) * 100).toFixed(1)}%`}
            color="text-green-400"
          />
          <StatCard
            label="Preference Pairs"
            value={preferences.totalPairs.toLocaleString()}
            subvalue={`Target: ${preferences.weeklyTarget}`}
            color={preferences.totalPairs >= preferences.weeklyTarget ? 'text-green-400' : 'text-yellow-400'}
          />
          <StatCard
            label="Model Accuracy"
            value={`${(rewardModel.accuracy * 100).toFixed(1)}%`}
            color={getMetricColor(rewardModel.accuracy, { good: 0.75, warning: 0.65 })}
          />
          <StatCard
            label="Loop Latency"
            value={formatLatency(loopLatency.totalLatency)}
            subvalue={loopLatency.updateFrequency}
          />
          <StatCard
            label="Active Experiments"
            value={experiments.activeExperiments}
            subvalue={`${experiments.significantWins} wins`}
          />
        </section>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Feedback & Preferences */}
          <div className="lg:col-span-2 space-y-8">
            {/* Feedback Trend */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Feedback Trend (7 days)</h2>
              <FeedbackTrendChart data={feedbackTrend} />
              <div className="flex items-center justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span className="text-sm text-gray-400">Positive</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span className="text-sm text-gray-400">Negative</span>
                </div>
              </div>
            </section>

            {/* Reward Model Performance */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Reward Model Performance</h2>
                <span className="text-sm text-gray-500">Version {rewardModel.currentVersion}</span>
              </div>

              <div className="grid grid-cols-4 gap-6">
                <MetricGauge value={rewardModel.accuracy} label="Accuracy" thresholds={{ good: 0.75, warning: 0.65 }} />
                <MetricGauge value={rewardModel.precision} label="Precision" thresholds={{ good: 0.75, warning: 0.65 }} />
                <MetricGauge value={rewardModel.recall} label="Recall" thresholds={{ good: 0.70, warning: 0.60 }} />
                <MetricGauge value={rewardModel.f1Score} label="F1 Score" thresholds={{ good: 0.75, warning: 0.65 }} />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between text-sm">
                <span className="text-gray-400">Training data: {rewardModel.trainingDataSize.toLocaleString()} samples</span>
                <span className="text-gray-400">Last trained: {formatDate(rewardModel.lastTrainedAt)}</span>
              </div>
            </section>

            {/* Experiments */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Prompt Experiments</h2>
                <button className="text-sm text-blue-400 hover:text-blue-300">View All</button>
              </div>
              <div className="space-y-3">
                {recentExperiments.map((exp, i) => (
                  <ExperimentRow key={i} experiment={exp} />
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-500">
                Average lift across {experiments.completedExperiments} completed experiments: +{experiments.avgLift.toFixed(1)}%
              </div>
            </section>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-8">
            {/* Preference Pairs Progress */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Preference Pairs</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Weekly Progress</span>
                    <span className="text-white">{preferences.totalPairs} / {preferences.weeklyTarget}</span>
                  </div>
                  <ProgressBar
                    value={preferences.totalPairs}
                    max={preferences.weeklyTarget}
                    color={preferences.totalPairs >= preferences.weeklyTarget ? 'bg-green-500' : 'bg-blue-500'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-white">{preferences.explicitPairs}</div>
                    <div className="text-xs text-gray-400">Explicit</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded">
                    <div className="text-xl font-bold text-white">{preferences.implicitPairs}</div>
                    <div className="text-xs text-gray-400">Implicit</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Agreement Rate</span>
                    <span className={getMetricColor(preferences.agreementRate, { good: 0.80, warning: 0.70 })}>
                      {(preferences.agreementRate * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Active Learning */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Active Learning</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Uncertain Cases</span>
                  <span className="text-yellow-400">{activeLearning.uncertainCases}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Labeled This Week</span>
                  <span className="text-white">{activeLearning.labeledThisWeek}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Efficiency Gain</span>
                  <span className="text-green-400">+{activeLearning.labelingEfficiencyGain}%</span>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Strategic Requests</span>
                    <span className="text-white">{activeLearning.strategicRequestsSent}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-2">
                    <span className="text-gray-400">Response Rate</span>
                    <span className="text-white">{(activeLearning.responseRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Loop Latency */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Loop Latency</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Feedback Ingestion</span>
                  <span className="text-white">{formatLatency(loopLatency.feedbackToIngestion)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Processing</span>
                  <span className="text-white">{formatLatency(loopLatency.ingestionToProcessing)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Model Update</span>
                  <span className="text-white">{formatLatency(loopLatency.processingToModelUpdate)}</span>
                </div>
                <div className="pt-3 border-t border-gray-700 flex justify-between font-medium">
                  <span className="text-gray-300">Total Latency</span>
                  <span className="text-white">{formatLatency(loopLatency.totalLatency)}</span>
                </div>
              </div>
            </section>

            {/* Signal Quality */}
            <section className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Signal Quality</h2>
              <div className="flex items-center justify-center py-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getMetricColor(feedback.signalToNoise, { good: 0.70, warning: 0.50 })}`}>
                    {(feedback.signalToNoise * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Signal-to-Noise Ratio</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-700/30 rounded text-xs text-gray-400 text-center">
                Measures the quality and usefulness of collected feedback
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>RLHF pipeline running on schedule</span>
            <span>RLHF Metrics v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
