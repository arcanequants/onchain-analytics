'use client';

import { useState, useMemo, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

interface DataQualityRule {
  id: string;
  rule_code: string;
  rule_name: string;
  description: string;
  rule_type: string;
  target_table: string;
  target_column: string | null;
  severity: 'critical' | 'error' | 'warning' | 'info';
  check_frequency: string;
  is_enabled: boolean;
  last_check_at: string | null;
  last_status: 'pass' | 'fail' | 'error' | null;
  consecutive_failures: number;
  category: string;
}

interface DataQualityResult {
  id: string;
  rule_code: string;
  rule_name?: string;
  status: 'pass' | 'fail' | 'error' | 'skipped';
  executed_at?: string;
  execution_duration_ms?: number;
  rows_violated?: number;
  rows_checked?: number;
  violation_percentage?: number | null;
  sample_violations?: unknown[] | null;
}

interface DataQualitySummary {
  total_rules: number;
  passing_rules: number;
  failing_rules: number;
  error_rules: number;
  pass_rate: number;
  critical_failures: number;
  last_check: string | null;
}

interface OrphanScan {
  id: string;
  scan_id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  orphan_count: number;
  scanned_at: string;
  resolution_action: string | null;
}

// ============================================================================
// Default Data (used as fallback)
// ============================================================================

const DEFAULT_SUMMARY: DataQualitySummary = {
  total_rules: 0,
  passing_rules: 0,
  failing_rules: 0,
  error_rules: 0,
  pass_rate: 0,
  critical_failures: 0,
  last_check: null,
};

// ============================================================================
// Helper Functions
// ============================================================================

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'error':
      return 'bg-orange-100 text-orange-800';
    case 'warning':
      return 'bg-yellow-100 text-yellow-800';
    case 'info':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'pass':
      return 'text-green-600';
    case 'fail':
      return 'text-red-600';
    case 'error':
      return 'text-orange-600';
    default:
      return 'text-gray-400';
  }
}

function getStatusIcon(status: string | null): React.ReactNode {
  switch (status) {
    case 'pass':
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'fail':
      return (
        <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'error':
      return (
        <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

function getRuleTypeColor(type: string): string {
  const colors: Record<string, string> = {
    completeness: 'bg-purple-100 text-purple-800',
    validity: 'bg-blue-100 text-blue-800',
    consistency: 'bg-green-100 text-green-800',
    uniqueness: 'bg-pink-100 text-pink-800',
    timeliness: 'bg-yellow-100 text-yellow-800',
    integrity: 'bg-red-100 text-red-800',
    accuracy: 'bg-indigo-100 text-indigo-800',
    conformity: 'bg-teal-100 text-teal-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

// ============================================================================
// Components
// ============================================================================

function SummaryCard({
  title,
  value,
  subtitle,
  color = 'gray',
  icon,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'gray';
  icon: React.ReactNode;
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    blue: 'bg-blue-50 text-blue-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value, size = 120 }: { value: number; size?: number }) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (val: number) => {
    if (val >= 95) return '#22c55e';
    if (val >= 80) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor(value)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold">{value.toFixed(1)}%</span>
          <p className="text-xs text-gray-500">Pass Rate</p>
        </div>
      </div>
    </div>
  );
}

function RuleRow({
  rule,
  onToggle,
  onRunNow,
}: {
  rule: DataQualityRule;
  onToggle: () => void;
  onRunNow: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <button
          onClick={onToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            rule.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              rule.is_enabled ? 'translate-x-4' : 'translate-x-1'
            }`}
          />
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(rule.last_status)}
          <div>
            <p className="font-medium text-gray-900">{rule.rule_code}</p>
            <p className="text-sm text-gray-500 truncate max-w-xs">{rule.description}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRuleTypeColor(rule.rule_type)}`}>
          {rule.rule_type}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(rule.severity)}`}>
          {rule.severity}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <code className="bg-gray-100 px-1 rounded">{rule.target_table}</code>
        {rule.target_column && (
          <span className="text-gray-400">.{rule.target_column}</span>
        )}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{rule.check_frequency}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{formatRelativeTime(rule.last_check_at)}</td>
      <td className="px-4 py-3">
        {rule.consecutive_failures > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
            {rule.consecutive_failures} failures
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={onRunNow}
          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
        >
          Run Now
        </button>
      </td>
    </tr>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function DataQualityPage() {
  const [rules, setRules] = useState<DataQualityRule[]>([]);
  const [results, setResults] = useState<DataQualityResult[]>([]);
  const [summary, setSummary] = useState<DataQualitySummary>(DEFAULT_SUMMARY);
  const [orphanScans, setOrphanScans] = useState<OrphanScan[]>([]);
  const [selectedTab, setSelectedTab] = useState<'rules' | 'results' | 'orphans'>('rules');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from API
  useEffect(() => {
    async function fetchDataQuality() {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch('/api/admin/data-quality');

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const data = await res.json();

        setRules(data.rules || []);
        setResults(data.results?.map((r: DataQualityResult, idx: number) => ({
          id: String(idx),
          rule_code: r.rule_code,
          rule_name: r.rule_code,
          status: r.status,
          executed_at: new Date().toISOString(),
          execution_duration_ms: 0,
          rows_violated: 0,
          rows_checked: r.rows_checked || 0,
          violation_percentage: null,
          sample_violations: null,
        })) || []);
        setSummary(data.summary || DEFAULT_SUMMARY);
        setOrphanScans(data.orphan_scans || []);
      } catch (err) {
        console.error('Error fetching data quality:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDataQuality();
  }, []);

  const ruleTypes = useMemo(() => {
    const types = new Set(rules.map((r) => r.rule_type));
    return ['all', ...Array.from(types)];
  }, [rules]);

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (filterType !== 'all' && rule.rule_type !== filterType) return false;
      if (filterSeverity !== 'all' && rule.severity !== filterSeverity) return false;
      return true;
    });
  }, [rules, filterType, filterSeverity]);

  const handleToggleRule = (ruleId: string) => {
    console.log('Toggle rule:', ruleId);
  };

  const handleRunRule = (ruleCode: string) => {
    console.log('Running rule:', ruleCode);
    alert(`Running rule ${ruleCode}...`);
  };

  const handleRunAllRules = () => {
    console.log('Running all rules...');
    alert('Running all data quality checks...');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-8"></div>
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Quality Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and manage data quality rules</p>
        </div>
        <button
          onClick={handleRunAllRules}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Run All Checks
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="col-span-1 flex items-center justify-center bg-white rounded-lg border border-gray-200 p-4">
          <ProgressRing value={summary.pass_rate} />
        </div>
        <SummaryCard
          title="Total Rules"
          value={summary.total_rules}
          color="blue"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          }
        />
        <SummaryCard
          title="Passing"
          value={summary.passing_rules}
          color="green"
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <SummaryCard
          title="Failing"
          value={summary.failing_rules}
          color={summary.failing_rules > 0 ? 'red' : 'gray'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          }
        />
        <SummaryCard
          title="Critical Failures"
          value={summary.critical_failures}
          subtitle={summary.last_check ? `Last check: ${formatRelativeTime(summary.last_check)}` : undefined}
          color={summary.critical_failures > 0 ? 'red' : 'green'}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          }
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex gap-4">
          {[
            { key: 'rules', label: 'Rules', count: rules.length },
            { key: 'results', label: 'Recent Results', count: results.length },
            { key: 'orphans', label: 'Orphan Scans', count: orphanScans.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as typeof selectedTab)}
              className={`pb-3 px-1 border-b-2 transition-colors ${
                selectedTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Rules Tab */}
      {selectedTab === 'rules' && (
        <>
          {/* Filters */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Type:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                {ruleTypes.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Severity:</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {/* Rules Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                    Active
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Severity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Frequency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Check
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Failures
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRules.map((rule) => (
                  <RuleRow
                    key={rule.id}
                    rule={rule}
                    onToggle={() => handleToggleRule(rule.id)}
                    onRunNow={() => handleRunRule(rule.rule_code)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Results Tab */}
      {selectedTab === 'results' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rule</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Violations
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        result.status === 'pass'
                          ? 'bg-green-100 text-green-800'
                          : result.status === 'fail'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {result.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{result.rule_code}</p>
                    <p className="text-sm text-gray-500">{result.rule_name}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatRelativeTime(result.executed_at ?? null)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{result.execution_duration_ms ?? 0}ms</td>
                  <td className="px-4 py-3 text-sm">
                    {(result.rows_violated ?? 0) > 0 ? (
                      <span className="text-red-600 font-medium">{result.rows_violated} rows</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {result.sample_violations && result.sample_violations.length > 0 ? (
                      <button className="text-blue-600 hover:text-blue-800 text-sm">View samples</button>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Orphans Tab */}
      {selectedTab === 'orphans' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Relationship
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Orphan Count
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scanned</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Resolution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orphanScans.map((scan) => (
                <tr key={scan.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <code className="text-sm">
                      {scan.source_table}.{scan.source_column}
                    </code>
                    <span className="mx-2 text-gray-400">-&gt;</span>
                    <code className="text-sm">
                      {scan.target_table}.{scan.target_column}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {scan.orphan_count > 0 ? (
                      <span className="text-red-600 font-medium">{scan.orphan_count}</span>
                    ) : (
                      <span className="text-green-600">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatRelativeTime(scan.scanned_at)}</td>
                  <td className="px-4 py-3 text-sm">
                    {scan.resolution_action ? (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {scan.resolution_action}
                      </span>
                    ) : scan.orphan_count > 0 ? (
                      <span className="text-yellow-600">Pending</span>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
