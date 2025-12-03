/**
 * CEO Dashboard Page
 *
 * Phase 4, Week 8, Day 5
 * Executive dashboard with key business metrics
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CEO Dashboard | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface KeyMetric {
  name: string;
  value: string | number;
  change: number;
  changeLabel: string;
  trend: 'up' | 'down' | 'stable';
  isGood: boolean;
}

interface OKR {
  objective: string;
  keyResults: {
    description: string;
    target: number;
    current: number;
    unit: string;
  }[];
  status: 'on_track' | 'at_risk' | 'behind';
}

interface RiskItem {
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  owner: string;
}

// ================================================================
// MOCK DATA (Replace with real data in production)
// ================================================================

async function getKeyMetrics(): Promise<KeyMetric[]> {
  return [
    {
      name: 'MRR',
      value: '$12,450',
      change: 23,
      changeLabel: 'vs last month',
      trend: 'up',
      isGood: true,
    },
    {
      name: 'Active Users',
      value: 847,
      change: 15,
      changeLabel: 'vs last week',
      trend: 'up',
      isGood: true,
    },
    {
      name: 'Analyses Run',
      value: '3,241',
      change: 8,
      changeLabel: 'vs last month',
      trend: 'up',
      isGood: true,
    },
    {
      name: 'NPS Score',
      value: 62,
      change: -3,
      changeLabel: 'vs last quarter',
      trend: 'down',
      isGood: false,
    },
    {
      name: 'Churn Rate',
      value: '2.1%',
      change: -0.3,
      changeLabel: 'vs last month',
      trend: 'down',
      isGood: true,
    },
    {
      name: 'LTV:CAC',
      value: '4.2x',
      change: 0.5,
      changeLabel: 'vs last quarter',
      trend: 'up',
      isGood: true,
    },
  ];
}

async function getOKRs(): Promise<OKR[]> {
  return [
    {
      objective: 'Achieve Product-Market Fit',
      keyResults: [
        { description: 'Reach 1,000 active users', target: 1000, current: 847, unit: 'users' },
        { description: 'Achieve 60+ NPS score', target: 60, current: 62, unit: 'score' },
        { description: '40% of users return weekly', target: 40, current: 35, unit: '%' },
      ],
      status: 'on_track',
    },
    {
      objective: 'Build Sustainable Revenue',
      keyResults: [
        { description: 'Reach $25K MRR', target: 25000, current: 12450, unit: '$' },
        { description: '< 3% monthly churn', target: 3, current: 2.1, unit: '%' },
        { description: 'LTV:CAC > 3x', target: 3, current: 4.2, unit: 'x' },
      ],
      status: 'at_risk',
    },
    {
      objective: 'Scale AI Infrastructure',
      keyResults: [
        { description: '99.9% uptime', target: 99.9, current: 99.95, unit: '%' },
        { description: '< 30s average analysis time', target: 30, current: 28, unit: 's' },
        { description: '< $0.50 cost per analysis', target: 0.5, current: 0.42, unit: '$' },
      ],
      status: 'on_track',
    },
  ];
}

async function getRisks(): Promise<RiskItem[]> {
  return [
    {
      category: 'Technical',
      description: 'AI provider rate limits during peak hours',
      severity: 'medium',
      mitigation: 'Implement request queuing and provider fallback',
      owner: 'Engineering',
    },
    {
      category: 'Financial',
      description: 'API costs exceeding budget at scale',
      severity: 'medium',
      mitigation: 'Cost optimization through caching and model selection',
      owner: 'Engineering',
    },
    {
      category: 'Market',
      description: 'Competitors launching similar products',
      severity: 'low',
      mitigation: 'Accelerate feature development, focus on differentiation',
      owner: 'Product',
    },
    {
      category: 'Operational',
      description: 'Single point of failure in key services',
      severity: 'high',
      mitigation: 'Implement redundancy and DR plan',
      owner: 'Engineering',
    },
  ];
}

async function getRecentActivity(): Promise<{ event: string; time: string; type: string }[]> {
  return [
    { event: 'New enterprise lead from Acme Corp', time: '2h ago', type: 'sales' },
    { event: 'Deployed v2.4.0 to production', time: '4h ago', type: 'engineering' },
    { event: 'NPS survey sent to 500 users', time: '1d ago', type: 'product' },
    { event: 'Stripe webhook issue resolved', time: '2d ago', type: 'ops' },
    { event: 'Published blog post: AI Perception Guide', time: '3d ago', type: 'marketing' },
  ];
}

// ================================================================
// COMPONENTS
// ================================================================

function MetricCard({ metric }: { metric: KeyMetric }) {
  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
      <div className="text-sm text-gray-400 mb-1">{metric.name}</div>
      <div className="text-3xl font-bold text-white mb-2">{metric.value}</div>
      <div className="flex items-center gap-1">
        <span
          className={`text-sm font-medium ${
            metric.isGood
              ? metric.trend === 'up'
                ? 'text-green-400'
                : 'text-green-400'
              : metric.trend === 'down'
                ? 'text-red-400'
                : 'text-red-400'
          }`}
        >
          {metric.change > 0 ? '+' : ''}
          {metric.change}
          {typeof metric.value === 'string' && metric.value.includes('%') ? 'pp' : '%'}
        </span>
        <span className="text-gray-500 text-sm">{metric.changeLabel}</span>
      </div>
    </div>
  );
}

function OKRCard({ okr }: { okr: OKR }) {
  const statusColors = {
    on_track: 'bg-green-500/20 text-green-400 border-green-500/30',
    at_risk: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    behind: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusLabels = {
    on_track: 'On Track',
    at_risk: 'At Risk',
    behind: 'Behind',
  };

  return (
    <div className="p-6 bg-gray-800 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{okr.objective}</h3>
        <span className={`px-2 py-0.5 text-xs rounded border ${statusColors[okr.status]}`}>
          {statusLabels[okr.status]}
        </span>
      </div>
      <div className="space-y-4">
        {okr.keyResults.map((kr, i) => {
          const progress = Math.min(100, (kr.current / kr.target) * 100);
          return (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{kr.description}</span>
                <span className="text-white">
                  {kr.current}
                  {kr.unit === '%' || kr.unit === 'x' ? kr.unit : ''} / {kr.target}
                  {kr.unit === '%' || kr.unit === 'x' ? kr.unit : ''}
                </span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress >= 100
                      ? 'bg-green-500'
                      : progress >= 70
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RiskRow({ risk }: { risk: RiskItem }) {
  const severityColors = {
    low: 'bg-blue-500/20 text-blue-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-3">
        <span className="text-gray-400 text-sm">{risk.category}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-white text-sm">{risk.description}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 text-xs rounded ${severityColors[risk.severity]}`}>
          {risk.severity}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-400 text-sm">{risk.mitigation}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-gray-400 text-sm">{risk.owner}</span>
      </td>
    </tr>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function CEODashboardPage() {
  const [metrics, okrs, risks, activity] = await Promise.all([
    getKeyMetrics(),
    getOKRs(),
    getRisks(),
    getRecentActivity(),
  ]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">CEO Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">{today}</p>
        </div>

        {/* Key Metrics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Key Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {metrics.map((metric, i) => (
              <MetricCard key={i} metric={metric} />
            ))}
          </div>
        </section>

        {/* OKRs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Q4 2025 OKRs</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {okrs.map((okr, i) => (
              <OKRCard key={i} okr={okr} />
            ))}
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Risk Register */}
          <div className="lg:col-span-2">
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Risk Register</h2>
              <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Category</th>
                      <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Risk</th>
                      <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Severity</th>
                      <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Mitigation</th>
                      <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((risk, i) => (
                      <RiskRow key={i} risk={risk} />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Recent Activity */}
          <div>
            <section>
              <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="space-y-4">
                  {activity.map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          item.type === 'sales'
                            ? 'bg-green-400'
                            : item.type === 'engineering'
                              ? 'bg-blue-400'
                              : item.type === 'product'
                                ? 'bg-purple-400'
                                : item.type === 'ops'
                                  ? 'bg-orange-400'
                                  : 'bg-pink-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-white text-sm">{item.event}</p>
                        <p className="text-gray-500 text-xs">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm text-left rounded-lg border border-gray-700 transition-colors">
                  View Investor Metrics
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm text-left rounded-lg border border-gray-700 transition-colors">
                  Export Monthly Report
                </button>
                <button className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm text-left rounded-lg border border-gray-700 transition-colors">
                  Schedule Board Update
                </button>
              </div>
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Data updated every 15 minutes</span>
            <span>AI Perception v2.4.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
