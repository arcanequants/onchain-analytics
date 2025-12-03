/**
 * Finance Dashboard Page (CFO)
 *
 * Phase 4, Week 8, Day 5 Extended
 * SaaS metrics, cohort analysis, and NRR calculator
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finance Dashboard | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface SaaSMetrics {
  mrr: number;
  arr: number;
  nrr: number; // Net Revenue Retention
  grr: number; // Gross Revenue Retention
  arpu: number; // Average Revenue Per User
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  paybackMonths: number;
  churnRate: number;
  expansionRate: number;
  contractionRate: number;
  quickRatio: number;
}

interface CohortData {
  cohort: string; // e.g., "2025-01", "2025-02"
  customersStarted: number;
  retentionByMonth: number[]; // percentages for month 0, 1, 2, etc.
  revenueByMonth: number[];
  avgLtv: number;
}

interface RevenueBreakdown {
  source: string;
  amount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface ChurnAnalysis {
  reason: string;
  count: number;
  percentage: number;
  revenue: number;
}

// ================================================================
// MOCK DATA (Replace with real data in production)
// ================================================================

async function getSaaSMetrics(): Promise<SaaSMetrics> {
  return {
    mrr: 12450,
    arr: 149400,
    nrr: 108.5, // > 100% means net expansion
    grr: 95.2, // Gross retention (without expansion)
    arpu: 49,
    ltv: 1470, // 30 months avg lifetime * ARPU
    cac: 350,
    ltvCacRatio: 4.2,
    paybackMonths: 7.1,
    churnRate: 2.1,
    expansionRate: 5.2,
    contractionRate: 1.1,
    quickRatio: 4.1, // (New + Expansion) / (Churn + Contraction)
  };
}

async function getCohortData(): Promise<CohortData[]> {
  return [
    {
      cohort: '2025-06',
      customersStarted: 45,
      retentionByMonth: [100, 89, 82, 78, 75, 73],
      revenueByMonth: [2205, 2117, 1984, 1891, 1856, 1845],
      avgLtv: 1280,
    },
    {
      cohort: '2025-07',
      customersStarted: 62,
      retentionByMonth: [100, 92, 85, 81, 79],
      revenueByMonth: [3038, 2875, 2711, 2620, 2558],
      avgLtv: 1350,
    },
    {
      cohort: '2025-08',
      customersStarted: 78,
      retentionByMonth: [100, 94, 88, 84],
      revenueByMonth: [3822, 3712, 3523, 3410],
      avgLtv: 1420,
    },
    {
      cohort: '2025-09',
      customersStarted: 95,
      retentionByMonth: [100, 93, 87],
      revenueByMonth: [4655, 4438, 4189],
      avgLtv: 1380,
    },
    {
      cohort: '2025-10',
      customersStarted: 112,
      retentionByMonth: [100, 95],
      revenueByMonth: [5488, 5320],
      avgLtv: null as unknown as number,
    },
    {
      cohort: '2025-11',
      customersStarted: 134,
      retentionByMonth: [100],
      revenueByMonth: [6566],
      avgLtv: null as unknown as number,
    },
  ];
}

async function getRevenueBreakdown(): Promise<RevenueBreakdown[]> {
  return [
    { source: 'New MRR', amount: 3200, percentage: 25.7, trend: 'up', change: 18 },
    { source: 'Expansion MRR', amount: 1850, percentage: 14.9, trend: 'up', change: 12 },
    { source: 'Existing MRR', amount: 7400, percentage: 59.4, trend: 'stable', change: 0 },
    { source: 'Contraction MRR', amount: -450, percentage: -3.6, trend: 'down', change: -5 },
    { source: 'Churned MRR', amount: -550, percentage: -4.4, trend: 'up', change: 8 },
  ];
}

async function getChurnAnalysis(): Promise<ChurnAnalysis[]> {
  return [
    { reason: 'Too expensive', count: 12, percentage: 28.5, revenue: 588 },
    { reason: 'Not using it enough', count: 10, percentage: 23.8, revenue: 490 },
    { reason: 'Switched to competitor', count: 8, percentage: 19.0, revenue: 392 },
    { reason: 'Business closed', count: 6, percentage: 14.3, revenue: 294 },
    { reason: 'Missing features', count: 4, percentage: 9.5, revenue: 196 },
    { reason: 'Other', count: 2, percentage: 4.9, revenue: 98 },
  ];
}

async function getMonthlyTrend(): Promise<{ month: string; mrr: number; customers: number }[]> {
  return [
    { month: '2025-06', mrr: 5200, customers: 106 },
    { month: '2025-07', mrr: 6100, customers: 124 },
    { month: '2025-08', mrr: 7350, customers: 150 },
    { month: '2025-09', mrr: 8900, customers: 181 },
    { month: '2025-10', mrr: 10500, customers: 214 },
    { month: '2025-11', mrr: 12450, customers: 254 },
  ];
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getRetentionColor(value: number): string {
  if (value >= 90) return 'bg-green-500';
  if (value >= 80) return 'bg-lime-500';
  if (value >= 70) return 'bg-yellow-500';
  if (value >= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

// ================================================================
// COMPONENTS
// ================================================================

function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  good = true,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  good?: boolean;
}) {
  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{title}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      {trend && trendValue && (
        <div className="flex items-center gap-1 mt-2">
          <span
            className={`text-sm ${
              good
                ? trend === 'up'
                  ? 'text-green-400'
                  : trend === 'down'
                    ? 'text-red-400'
                    : 'text-gray-400'
                : trend === 'up'
                  ? 'text-red-400'
                  : trend === 'down'
                    ? 'text-green-400'
                    : 'text-gray-400'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}

function CohortHeatmap({ cohorts }: { cohorts: CohortData[] }) {
  const maxMonths = Math.max(...cohorts.map((c) => c.retentionByMonth.length));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-gray-400 px-2 py-2 font-medium">Cohort</th>
            <th className="text-center text-gray-400 px-2 py-2 font-medium">Customers</th>
            {Array.from({ length: maxMonths }, (_, i) => (
              <th key={i} className="text-center text-gray-400 px-2 py-2 font-medium">
                M{i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => (
            <tr key={cohort.cohort} className="border-t border-gray-700/50">
              <td className="px-2 py-2 text-white font-mono">{cohort.cohort}</td>
              <td className="px-2 py-2 text-center text-gray-300">{cohort.customersStarted}</td>
              {Array.from({ length: maxMonths }, (_, i) => {
                const retention = cohort.retentionByMonth[i];
                return (
                  <td key={i} className="px-1 py-1">
                    {retention !== undefined ? (
                      <div
                        className={`${getRetentionColor(retention)} rounded px-2 py-1 text-center text-white font-medium`}
                        style={{ opacity: 0.6 + retention / 250 }}
                      >
                        {retention}%
                      </div>
                    ) : (
                      <div className="text-gray-600 text-center">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RevenueWaterfall({ breakdown }: { breakdown: RevenueBreakdown[] }) {
  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-3">
      {breakdown.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-32 text-sm text-gray-400">{item.source}</div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  item.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.abs(item.percentage)}%` }}
              />
            </div>
          </div>
          <div
            className={`w-24 text-right font-medium ${
              item.amount >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {item.amount >= 0 ? '+' : ''}
            {formatCurrency(item.amount)}
          </div>
          <div
            className={`w-16 text-right text-sm ${
              item.change >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {item.change >= 0 ? '+' : ''}
            {item.change}%
          </div>
        </div>
      ))}
      <div className="border-t border-gray-600 pt-3 flex items-center gap-4">
        <div className="w-32 text-sm font-medium text-white">Net MRR Change</div>
        <div className="flex-1" />
        <div className="w-24 text-right font-bold text-white">{formatCurrency(total)}</div>
        <div className="w-16" />
      </div>
    </div>
  );
}

function NRRCalculator() {
  // NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100
  const startingMRR = 10000;
  const expansion = 1200;
  const contraction = 300;
  const churn = 400;
  const endingMRR = startingMRR + expansion - contraction - churn;
  const nrr = (endingMRR / startingMRR) * 100;

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">NRR Calculator</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Starting MRR</span>
          <span className="text-white font-medium">{formatCurrency(startingMRR)}</span>
        </div>

        <div className="flex justify-between items-center text-green-400">
          <span>+ Expansion</span>
          <span className="font-medium">+{formatCurrency(expansion)}</span>
        </div>

        <div className="flex justify-between items-center text-yellow-400">
          <span>- Contraction</span>
          <span className="font-medium">-{formatCurrency(contraction)}</span>
        </div>

        <div className="flex justify-between items-center text-red-400">
          <span>- Churn</span>
          <span className="font-medium">-{formatCurrency(churn)}</span>
        </div>

        <div className="border-t border-gray-600 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Ending MRR</span>
            <span className="text-white font-bold">{formatCurrency(endingMRR)}</span>
          </div>
        </div>

        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Net Revenue Retention</div>
          <div className={`text-3xl font-bold ${nrr >= 100 ? 'text-green-400' : 'text-red-400'}`}>
            {nrr.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {nrr >= 100 ? 'Net expansion - great!' : 'Net contraction - needs attention'}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-2">
          Formula: (Starting MRR + Expansion - Contraction - Churn) / Starting MRR * 100
        </div>
      </div>
    </div>
  );
}

function ChurnTable({ analysis }: { analysis: ChurnAnalysis[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-700">
          <th className="text-left text-gray-400 px-4 py-2 font-medium">Reason</th>
          <th className="text-center text-gray-400 px-4 py-2 font-medium">Count</th>
          <th className="text-center text-gray-400 px-4 py-2 font-medium">%</th>
          <th className="text-right text-gray-400 px-4 py-2 font-medium">Revenue Lost</th>
        </tr>
      </thead>
      <tbody>
        {analysis.map((item, i) => (
          <tr key={i} className="border-b border-gray-700/50 last:border-0">
            <td className="px-4 py-2 text-white">{item.reason}</td>
            <td className="px-4 py-2 text-center text-gray-300">{item.count}</td>
            <td className="px-4 py-2 text-center text-gray-300">{item.percentage.toFixed(1)}%</td>
            <td className="px-4 py-2 text-right text-red-400">{formatCurrency(item.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MRRTrendChart({ data }: { data: { month: string; mrr: number; customers: number }[] }) {
  const maxMRR = Math.max(...data.map((d) => d.mrr));

  return (
    <div className="h-48">
      <div className="flex items-end justify-between h-full gap-2">
        {data.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="text-xs text-green-400 font-medium">{formatCurrency(item.mrr)}</div>
            <div
              className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t transition-all"
              style={{ height: `${(item.mrr / maxMRR) * 100}%` }}
            />
            <div className="text-xs text-gray-500">{item.month.slice(5)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function FinanceDashboardPage() {
  const [metrics, cohorts, breakdown, churn, trend] = await Promise.all([
    getSaaSMetrics(),
    getCohortData(),
    getRevenueBreakdown(),
    getChurnAnalysis(),
    getMonthlyTrend(),
  ]);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">SaaS metrics and revenue analytics</p>
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm">
              <option>Last 6 months</option>
              <option>Last 12 months</option>
              <option>Year to date</option>
              <option>All time</option>
            </select>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors">
              Export Report
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <MetricCard
              title="MRR"
              value={formatCurrency(metrics.mrr)}
              trend="up"
              trendValue="+18.5%"
            />
            <MetricCard title="ARR" value={formatCurrency(metrics.arr)} trend="up" trendValue="+18.5%" />
            <MetricCard
              title="NRR"
              value={formatPercent(metrics.nrr)}
              subtitle="Net Revenue Retention"
              trend={metrics.nrr >= 100 ? 'up' : 'down'}
              trendValue={metrics.nrr >= 100 ? 'Expanding' : 'Contracting'}
            />
            <MetricCard
              title="GRR"
              value={formatPercent(metrics.grr)}
              subtitle="Gross Revenue Retention"
            />
            <MetricCard
              title="ARPU"
              value={formatCurrency(metrics.arpu)}
              subtitle="Avg Revenue Per User"
            />
            <MetricCard
              title="Quick Ratio"
              value={metrics.quickRatio.toFixed(1)}
              subtitle="Growth efficiency"
              trend={metrics.quickRatio >= 4 ? 'up' : 'stable'}
              trendValue={metrics.quickRatio >= 4 ? 'Excellent' : 'Good'}
            />
          </div>
        </section>

        {/* Unit Economics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Unit Economics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="LTV"
              value={formatCurrency(metrics.ltv)}
              subtitle="Customer Lifetime Value"
            />
            <MetricCard
              title="CAC"
              value={formatCurrency(metrics.cac)}
              subtitle="Customer Acquisition Cost"
            />
            <MetricCard
              title="LTV:CAC"
              value={`${metrics.ltvCacRatio.toFixed(1)}x`}
              subtitle={metrics.ltvCacRatio >= 3 ? 'Healthy ratio' : 'Needs improvement'}
              trend={metrics.ltvCacRatio >= 3 ? 'up' : 'down'}
              trendValue={metrics.ltvCacRatio >= 3 ? 'Above 3x target' : 'Below 3x target'}
            />
            <MetricCard
              title="Payback"
              value={`${metrics.paybackMonths.toFixed(1)} mo`}
              subtitle="CAC Payback Period"
              trend={metrics.paybackMonths <= 12 ? 'up' : 'down'}
              trendValue={metrics.paybackMonths <= 12 ? 'Under 12mo' : 'Over 12mo'}
            />
          </div>
        </section>

        {/* MRR Trend */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">MRR Trend</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <MRRTrendChart data={trend} />
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Breakdown */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">MRR Breakdown</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <RevenueWaterfall breakdown={breakdown} />
            </div>
          </section>

          {/* NRR Calculator */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">NRR Analysis</h2>
            <NRRCalculator />
          </section>
        </div>

        {/* Cohort Analysis */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Cohort Retention Heatmap</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <CohortHeatmap cohorts={cohorts} />
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>Retention:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-green-500"></span> &gt;90%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-lime-500"></span> 80-90%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-yellow-500"></span> 70-80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-orange-500"></span> 60-70%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-red-500"></span> &lt;60%
              </span>
            </div>
          </div>
        </section>

        {/* Churn Analysis */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Churn Analysis</h2>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h3 className="font-medium text-white">Churn by Reason</h3>
              </div>
              <ChurnTable analysis={churn} />
            </div>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="font-medium text-white mb-4">Churn Metrics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Monthly Churn Rate</span>
                  <span className="text-red-400 font-medium">{formatPercent(metrics.churnRate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expansion Rate</span>
                  <span className="text-green-400 font-medium">
                    {formatPercent(metrics.expansionRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Contraction Rate</span>
                  <span className="text-yellow-400 font-medium">
                    {formatPercent(metrics.contractionRate)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Net Churn</span>
                    <span
                      className={`font-medium ${
                        metrics.churnRate - metrics.expansionRate < 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {formatPercent(
                        Math.abs(metrics.churnRate + metrics.contractionRate - metrics.expansionRate)
                      )}
                      {metrics.churnRate + metrics.contractionRate - metrics.expansionRate < 0
                        ? ' (Net Expansion)'
                        : ' (Net Churn)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Data refreshed hourly from Stripe + Supabase</span>
            <span>AI Perception Finance v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
