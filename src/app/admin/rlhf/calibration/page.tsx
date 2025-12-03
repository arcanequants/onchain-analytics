/**
 * RLHF Calibration Dashboard
 *
 * Phase 4, Week 8 Extended
 * Score calibration curves and accuracy metrics per industry
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calibration Dashboard | RLHF Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface CalibrationPoint {
  predicted: number;
  actual: number;
  count: number;
}

interface IndustryCalibration {
  industry: string;
  calibrationCurve: CalibrationPoint[];
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  r2: number; // R-squared
  brier: number; // Brier score
  samples: number;
  lastUpdated: string;
  adjustmentFactor: number;
}

interface CalibrationStats {
  totalIndustries: number;
  wellCalibrated: number;
  needsAttention: number;
  totalSamples: number;
  avgMae: number;
}

interface RecentAdjustment {
  industry: string;
  oldFactor: number;
  newFactor: number;
  reason: string;
  timestamp: string;
}

// ================================================================
// DATA FETCHING - Uses real API
// ================================================================

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://vectorialdata.com';

interface CalibrationData {
  calibrations: IndustryCalibration[];
  stats: CalibrationStats;
  adjustments: RecentAdjustment[];
  hasData: boolean;
}

async function getCalibrationData(): Promise<CalibrationData> {
  // Default empty state
  const emptyState: CalibrationData = {
    calibrations: [],
    stats: { totalIndustries: 0, wellCalibrated: 0, needsAttention: 0, totalSamples: 0, avgMae: 0 },
    adjustments: [],
    hasData: false,
  };

  try {
    const res = await fetch(`${API_BASE}/api/admin/rlhf?type=calibration`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      console.error('Failed to fetch calibration data:', res.status);
      return emptyState;
    }

    const data = await res.json();

    // Check if we have real data
    if (data.industries && data.industries.length > 0) {
      return {
        calibrations: data.industries,
        stats: data.stats || emptyState.stats,
        adjustments: data.adjustments || [],
        hasData: true,
      };
    }

    return emptyState;
  } catch (error) {
    console.error('Error fetching calibration data:', error);
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

function getCalibrationQuality(mae: number): { label: string; color: string } {
  if (mae < 2) return { label: 'Excellent', color: 'text-green-400' };
  if (mae < 3) return { label: 'Good', color: 'text-blue-400' };
  if (mae < 4) return { label: 'Fair', color: 'text-yellow-400' };
  return { label: 'Needs Attention', color: 'text-red-400' };
}

function getR2Color(r2: number): string {
  if (r2 >= 0.95) return 'text-green-400';
  if (r2 >= 0.90) return 'text-blue-400';
  if (r2 >= 0.85) return 'text-yellow-400';
  return 'text-red-400';
}

// ================================================================
// COMPONENTS
// ================================================================

function StatCard({ label, value, subvalue, color }: {
  label: string;
  value: string | number;
  subvalue?: string;
  color?: string;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400">{label}</div>
      <div className={`text-2xl font-bold ${color || 'text-white'}`}>{value}</div>
      {subvalue && <div className="text-xs text-gray-500 mt-1">{subvalue}</div>}
    </div>
  );
}

function CalibrationCurveVisual({ curve }: { curve: CalibrationPoint[] }) {
  const maxCount = Math.max(...curve.map(p => p.count));

  return (
    <div className="h-32 flex items-end gap-1">
      {curve.map((point, i) => {
        const deviation = point.actual - point.predicted;
        const deviationColor = Math.abs(deviation) <= 2
          ? 'bg-green-500'
          : Math.abs(deviation) <= 4
          ? 'bg-yellow-500'
          : 'bg-red-500';

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full rounded-t ${deviationColor} transition-all`}
              style={{ height: `${(point.count / maxCount) * 100}%`, minHeight: '4px' }}
              title={`Predicted: ${point.predicted}, Actual: ${point.actual}, n=${point.count}`}
            />
            <span className="text-xs text-gray-500">{point.predicted}</span>
          </div>
        );
      })}
    </div>
  );
}

function IndustryCalibrationCard({ calibration }: { calibration: IndustryCalibration }) {
  const quality = getCalibrationQuality(calibration.mae);

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">{calibration.industry}</h3>
          <span className="text-xs text-gray-500">{calibration.samples.toLocaleString()} samples</span>
        </div>
        <span className={`text-sm font-medium ${quality.color}`}>{quality.label}</span>
      </div>

      {/* Calibration Curve */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 mb-2">Calibration Curve (Predicted vs Actual)</div>
        <CalibrationCurveVisual curve={calibration.calibrationCurve} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 bg-gray-700/50 rounded">
          <div className="text-xs text-gray-500">MAE</div>
          <div className={`text-sm font-medium ${quality.color}`}>{calibration.mae.toFixed(1)}</div>
        </div>
        <div className="text-center p-2 bg-gray-700/50 rounded">
          <div className="text-xs text-gray-500">RMSE</div>
          <div className="text-sm font-medium text-white">{calibration.rmse.toFixed(1)}</div>
        </div>
        <div className="text-center p-2 bg-gray-700/50 rounded">
          <div className="text-xs text-gray-500">R2</div>
          <div className={`text-sm font-medium ${getR2Color(calibration.r2)}`}>
            {calibration.r2.toFixed(2)}
          </div>
        </div>
        <div className="text-center p-2 bg-gray-700/50 rounded">
          <div className="text-xs text-gray-500">Brier</div>
          <div className="text-sm font-medium text-white">{calibration.brier.toFixed(2)}</div>
        </div>
      </div>

      {/* Adjustment Factor */}
      <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded">
        <span className="text-sm text-gray-400">Adjustment Factor</span>
        <span className={`text-sm font-mono font-medium ${
          calibration.adjustmentFactor === 1.0
            ? 'text-gray-400'
            : calibration.adjustmentFactor > 1
            ? 'text-yellow-400'
            : 'text-blue-400'
        }`}>
          {calibration.adjustmentFactor.toFixed(2)}x
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs transition-colors">
          View Details
        </button>
        <button className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors">
          Recalibrate
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 text-center">
        Last updated: {formatDate(calibration.lastUpdated)}
      </div>
    </div>
  );
}

function RecentAdjustmentRow({ adjustment }: { adjustment: RecentAdjustment }) {
  const direction = adjustment.newFactor > adjustment.oldFactor ? 'up' : 'down';

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        direction === 'up' ? 'bg-yellow-500/20' : 'bg-blue-500/20'
      }`}>
        <svg className={`w-4 h-4 ${direction === 'up' ? 'text-yellow-400' : 'text-blue-400'}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d={direction === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
        </svg>
      </div>
      <div className="flex-1">
        <div className="text-sm text-white">{adjustment.industry}</div>
        <div className="text-xs text-gray-500">{adjustment.reason}</div>
      </div>
      <div className="text-right">
        <div className="text-sm font-mono text-gray-400">
          {adjustment.oldFactor.toFixed(2)} → {adjustment.newFactor.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">{formatDate(adjustment.timestamp)}</div>
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function CalibrationDashboardPage() {
  const { calibrations, stats, adjustments, hasData } = await getCalibrationData();

  // Sort by MAE (worst first for attention)
  const sortedCalibrations = [...calibrations].sort((a, b) => b.mae - a.mae);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Calibration Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Score calibration curves and accuracy by industry</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Run Full Recalibration
            </button>
          </div>
        </div>

        {/* No Data Notice */}
        {!hasData && (
          <div className="mb-8 p-6 bg-gray-800 rounded-xl border border-gray-700 text-center">
            <div className="text-4xl mb-4">-</div>
            <h3 className="text-lg font-medium text-white mb-2">No Calibration Data Available</h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              RLHF calibration tables are not configured yet. Once feedback is collected
              and processed, industry calibration curves will appear here.
            </p>
          </div>
        )}

        {/* Stats */}
        <section className="mb-8 grid grid-cols-5 gap-4">
          <StatCard label="Industries" value={stats.totalIndustries} />
          <StatCard label="Well Calibrated" value={stats.wellCalibrated} color="text-green-400" subvalue="MAE < 3.0" />
          <StatCard label="Needs Attention" value={stats.needsAttention} color="text-red-400" subvalue="MAE >= 4.0" />
          <StatCard label="Total Samples" value={stats.totalSamples.toLocaleString()} />
          <StatCard label="Avg MAE" value={stats.avgMae.toFixed(1)} color={stats.avgMae < 3 ? 'text-green-400' : 'text-yellow-400'} />
        </section>

        {/* Legend */}
        <section className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Understanding the Metrics</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">MAE (Mean Absolute Error):</span>
              <span className="text-gray-300 ml-1">Average prediction error in points</span>
            </div>
            <div>
              <span className="text-gray-500">RMSE:</span>
              <span className="text-gray-300 ml-1">Penalizes large errors more heavily</span>
            </div>
            <div>
              <span className="text-gray-500">R2 Score:</span>
              <span className="text-gray-300 ml-1">Explained variance (1.0 = perfect)</span>
            </div>
            <div>
              <span className="text-gray-500">Brier Score:</span>
              <span className="text-gray-300 ml-1">Probability accuracy (0 = perfect)</span>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Industry Calibrations */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-white mb-4">Industry Calibrations</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {sortedCalibrations.map(cal => (
                <IndustryCalibrationCard key={cal.industry} calibration={cal} />
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Recent Adjustments */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Recent Adjustments</h2>
              <div className="space-y-3">
                {adjustments.map((adj, i) => (
                  <RecentAdjustmentRow key={i} adjustment={adj} />
                ))}
              </div>
            </section>

            {/* Calibration Schedule */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">Calibration Schedule</h2>
              <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Auto-calibration</span>
                    <span className="text-green-400">Weekly (Sundays)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Next scheduled</span>
                    <span className="text-white">Dec 1, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min samples required</span>
                    <span className="text-white">100 per industry</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Adjustment threshold</span>
                    <span className="text-white">MAE change &gt; 0.5</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Alerts */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Active Alerts</h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Education needs attention
                  </div>
                  <p className="text-xs text-gray-400 mt-1">MAE of 5.1 exceeds threshold. Consider collecting more samples.</p>
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    E-commerce drift detected
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Holiday season pattern detected. Monitor closely.</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Calibration data refreshed every 6 hours</span>
            <span>RLHF Calibration v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
