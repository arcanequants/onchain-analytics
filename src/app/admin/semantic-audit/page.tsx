/**
 * Semantic Audit Dashboard
 *
 * Phase 4, Week 8 Extended
 * Schema health, data quality, and naming conventions monitoring
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semantic Audit | Admin',
  robots: 'noindex, nofollow',
};

// ================================================================
// TYPES
// ================================================================

interface HealthScore {
  overall: number;
  schema: number;
  dataQuality: number;
  namingConvention: number;
  referentialIntegrity: number;
}

interface EnumStatus {
  name: string;
  canonicalValues: number;
  legacyValues: number;
  totalUsage: number;
  migrationComplete: boolean;
}

interface DataQualityRule {
  id: string;
  name: string;
  table: string;
  type: 'null_check' | 'range_check' | 'format_check' | 'referential' | 'custom';
  status: 'passing' | 'warning' | 'failing';
  passRate: number;
  lastRun: string;
  affectedRows: number;
}

interface TableHealth {
  name: string;
  columns: number;
  rows: number;
  hasAuditColumns: boolean;
  namingScore: number;
  nullSemantics: 'documented' | 'partial' | 'missing';
  constraints: number;
  issues: number;
}

interface OrphanRecord {
  table: string;
  column: string;
  orphanCount: number;
  lastScan: string;
  trend: 'improving' | 'stable' | 'worsening';
}

interface MigrationAudit {
  id: string;
  name: string;
  appliedAt: string;
  hasRollback: boolean;
  breaking: boolean;
  status: 'success' | 'failed' | 'pending';
}

// ================================================================
// MOCK DATA
// ================================================================

async function getHealthScores(): Promise<HealthScore> {
  return {
    overall: 92,
    schema: 95,
    dataQuality: 98,
    namingConvention: 88,
    referentialIntegrity: 87,
  };
}

async function getEnumStatuses(): Promise<EnumStatus[]> {
  return [
    { name: 'ai_provider', canonicalValues: 4, legacyValues: 0, totalUsage: 15234, migrationComplete: true },
    { name: 'sentiment_type', canonicalValues: 5, legacyValues: 0, totalUsage: 45123, migrationComplete: true },
    { name: 'severity_level', canonicalValues: 4, legacyValues: 2, totalUsage: 8934, migrationComplete: false },
    { name: 'status_type', canonicalValues: 6, legacyValues: 0, totalUsage: 23456, migrationComplete: true },
    { name: 'plan_type', canonicalValues: 4, legacyValues: 1, totalUsage: 3421, migrationComplete: false },
  ];
}

async function getDataQualityRules(): Promise<DataQualityRule[]> {
  return [
    { id: 'dq_001', name: 'Score in valid range', table: 'analyses', type: 'range_check', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_002', name: 'Confidence between 0-1', table: 'ai_responses', type: 'range_check', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_003', name: 'Cost non-negative', table: 'ai_responses', type: 'range_check', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_004', name: 'Email format valid', table: 'users', type: 'format_check', status: 'passing', passRate: 99.8, lastRun: '2024-11-28T10:00:00Z', affectedRows: 3 },
    { id: 'dq_005', name: 'URL format valid', table: 'analyses', type: 'format_check', status: 'passing', passRate: 99.9, lastRun: '2024-11-28T10:00:00Z', affectedRows: 1 },
    { id: 'dq_006', name: 'User FK exists', table: 'analyses', type: 'referential', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_007', name: 'Completed >= Created', table: 'analyses', type: 'custom', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_008', name: 'Required fields present', table: 'recommendations', type: 'null_check', status: 'warning', passRate: 98.5, lastRun: '2024-11-28T10:00:00Z', affectedRows: 23 },
    { id: 'dq_009', name: 'Token count positive', table: 'ai_responses', type: 'range_check', status: 'passing', passRate: 100, lastRun: '2024-11-28T10:00:00Z', affectedRows: 0 },
    { id: 'dq_010', name: 'JSON structure valid', table: 'ai_responses', type: 'custom', status: 'passing', passRate: 99.7, lastRun: '2024-11-28T10:00:00Z', affectedRows: 5 },
  ];
}

async function getTableHealth(): Promise<TableHealth[]> {
  return [
    { name: 'users', columns: 12, rows: 3421, hasAuditColumns: true, namingScore: 100, nullSemantics: 'documented', constraints: 8, issues: 0 },
    { name: 'analyses', columns: 18, rows: 15234, hasAuditColumns: true, namingScore: 95, nullSemantics: 'documented', constraints: 12, issues: 1 },
    { name: 'ai_responses', columns: 22, rows: 45678, hasAuditColumns: true, namingScore: 90, nullSemantics: 'partial', constraints: 10, issues: 2 },
    { name: 'recommendations', columns: 15, rows: 89234, hasAuditColumns: true, namingScore: 88, nullSemantics: 'documented', constraints: 7, issues: 1 },
    { name: 'subscriptions', columns: 14, rows: 2890, hasAuditColumns: true, namingScore: 100, nullSemantics: 'documented', constraints: 9, issues: 0 },
    { name: 'feature_flags', columns: 10, rows: 24, hasAuditColumns: true, namingScore: 85, nullSemantics: 'partial', constraints: 5, issues: 1 },
    { name: 'cron_executions', columns: 8, rows: 4567, hasAuditColumns: false, namingScore: 80, nullSemantics: 'missing', constraints: 3, issues: 3 },
  ];
}

async function getOrphanRecords(): Promise<OrphanRecord[]> {
  return [
    { table: 'ai_responses', column: 'analysis_id', orphanCount: 0, lastScan: '2024-11-28T06:00:00Z', trend: 'stable' },
    { table: 'recommendations', column: 'analysis_id', orphanCount: 0, lastScan: '2024-11-28T06:00:00Z', trend: 'stable' },
    { table: 'feedback', column: 'user_id', orphanCount: 2, lastScan: '2024-11-28T06:00:00Z', trend: 'improving' },
    { table: 'api_keys', column: 'user_id', orphanCount: 0, lastScan: '2024-11-28T06:00:00Z', trend: 'stable' },
  ];
}

async function getMigrationAudit(): Promise<MigrationAudit[]> {
  return [
    { id: '20241128_001', name: 'Add calibration tables', appliedAt: '2024-11-28T04:00:00Z', hasRollback: true, breaking: false, status: 'success' },
    { id: '20241127_001', name: 'Add feature flags', appliedAt: '2024-11-27T04:00:00Z', hasRollback: true, breaking: false, status: 'success' },
    { id: '20241126_002', name: 'Migrate severity enum', appliedAt: '2024-11-26T16:30:00Z', hasRollback: true, breaking: false, status: 'success' },
    { id: '20241126_001', name: 'Add audit columns to cron', appliedAt: '2024-11-26T04:00:00Z', hasRollback: true, breaking: false, status: 'success' },
    { id: '20241125_001', name: 'Add RLHF tables', appliedAt: '2024-11-25T04:00:00Z', hasRollback: true, breaking: false, status: 'success' },
  ];
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

function getScoreColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-yellow-400';
  return 'text-red-400';
}

function getScoreBg(score: number): string {
  if (score >= 90) return 'bg-green-500';
  if (score >= 75) return 'bg-yellow-500';
  return 'bg-red-500';
}

// ================================================================
// COMPONENTS
// ================================================================

function HealthScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <div className="text-sm text-gray-400 mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-3xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-gray-500 text-sm mb-1">/100</span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${getScoreBg(score)}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function EnumStatusRow({ enumStatus }: { enumStatus: EnumStatus }) {
  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-3">
        <code className="text-sm text-white font-mono">{enumStatus.name}</code>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-green-400">{enumStatus.canonicalValues}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={enumStatus.legacyValues > 0 ? 'text-yellow-400' : 'text-gray-500'}>
          {enumStatus.legacyValues}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-gray-400">
        {enumStatus.totalUsage.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-center">
        {enumStatus.migrationComplete ? (
          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded">Complete</span>
        ) : (
          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">In Progress</span>
        )}
      </td>
    </tr>
  );
}

function DQRuleRow({ rule }: { rule: DataQualityRule }) {
  const statusColors = {
    passing: 'bg-green-500',
    warning: 'bg-yellow-500',
    failing: 'bg-red-500',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[rule.status]}`} />
          <span className="text-white text-sm">{rule.name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <code className="text-xs text-gray-400 font-mono">{rule.table}</code>
      </td>
      <td className="px-4 py-3">
        <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded">{rule.type}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className={getScoreColor(rule.passRate)}>{rule.passRate.toFixed(1)}%</span>
      </td>
      <td className="px-4 py-3 text-right text-gray-500 text-sm">
        {rule.affectedRows > 0 ? (
          <span className="text-yellow-400">{rule.affectedRows}</span>
        ) : (
          <span>0</span>
        )}
      </td>
    </tr>
  );
}

function TableHealthRow({ table }: { table: TableHealth }) {
  const semanticsColors = {
    documented: 'text-green-400',
    partial: 'text-yellow-400',
    missing: 'text-red-400',
  };

  return (
    <tr className="border-b border-gray-700/50 last:border-0">
      <td className="px-4 py-3">
        <code className="text-sm text-white font-mono">{table.name}</code>
      </td>
      <td className="px-4 py-3 text-center text-gray-400">{table.columns}</td>
      <td className="px-4 py-3 text-right text-gray-400">{table.rows.toLocaleString()}</td>
      <td className="px-4 py-3 text-center">
        {table.hasAuditColumns ? (
          <span className="text-green-400">Yes</span>
        ) : (
          <span className="text-red-400">No</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        <span className={getScoreColor(table.namingScore)}>{table.namingScore}</span>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={semanticsColors[table.nullSemantics]}>{table.nullSemantics}</span>
      </td>
      <td className="px-4 py-3 text-center text-gray-400">{table.constraints}</td>
      <td className="px-4 py-3 text-center">
        {table.issues > 0 ? (
          <span className="text-yellow-400">{table.issues}</span>
        ) : (
          <span className="text-green-400">0</span>
        )}
      </td>
    </tr>
  );
}

// ================================================================
// PAGE
// ================================================================

export default async function SemanticAuditPage() {
  const [health, enums, dqRules, tables, orphans, migrations] = await Promise.all([
    getHealthScores(),
    getEnumStatuses(),
    getDataQualityRules(),
    getTableHealth(),
    getOrphanRecords(),
    getMigrationAudit(),
  ]);

  const passingRules = dqRules.filter(r => r.status === 'passing').length;
  const totalOrphans = orphans.reduce((sum, o) => sum + o.orphanCount, 0);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Semantic Audit Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">Schema health, data quality, and naming conventions</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm border border-gray-700">
              Export Report
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Run Full Audit
            </button>
          </div>
        </div>

        {/* Health Scores */}
        <section className="mb-8 grid grid-cols-5 gap-4">
          <HealthScoreCard label="Overall Health" score={health.overall} />
          <HealthScoreCard label="Schema Health" score={health.schema} />
          <HealthScoreCard label="Data Quality" score={health.dataQuality} />
          <HealthScoreCard label="Naming Convention" score={health.namingConvention} />
          <HealthScoreCard label="Referential Integrity" score={health.referentialIntegrity} />
        </section>

        {/* Quick Stats */}
        <section className="mb-8 grid grid-cols-4 gap-4">
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">DQ Rules Passing</div>
            <div className="text-2xl font-bold text-green-400">{passingRules}/{dqRules.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Tables Audited</div>
            <div className="text-2xl font-bold text-white">{tables.length}</div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Orphan Records</div>
            <div className={`text-2xl font-bold ${totalOrphans === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalOrphans}
            </div>
          </div>
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-sm text-gray-400">Enums Migrated</div>
            <div className="text-2xl font-bold text-white">
              {enums.filter(e => e.migrationComplete).length}/{enums.length}
            </div>
          </div>
        </section>

        {/* Enum Status */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Canonical Enum Types</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Enum</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Canonical</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Legacy</th>
                  <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">Usage</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {enums.map(e => (
                  <EnumStatusRow key={e.name} enumStatus={e} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Data Quality Rules */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Data Quality Rules</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Rule</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Table</th>
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Type</th>
                  <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">Pass Rate</th>
                  <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">Affected</th>
                </tr>
              </thead>
              <tbody>
                {dqRules.map(rule => (
                  <DQRuleRow key={rule.id} rule={rule} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Table Health */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Table Health</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-sm font-medium text-gray-400 px-4 py-3">Table</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Cols</th>
                  <th className="text-right text-sm font-medium text-gray-400 px-4 py-3">Rows</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Audit</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Naming</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">NULL Docs</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Constraints</th>
                  <th className="text-center text-sm font-medium text-gray-400 px-4 py-3">Issues</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(table => (
                  <TableHealthRow key={table.name} table={table} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Orphan Records */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Referential Integrity</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="space-y-3">
                {orphans.map((orphan, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <code className="text-sm text-white font-mono">{orphan.table}.{orphan.column}</code>
                      <div className="text-xs text-gray-500 mt-1">Last scan: {formatDate(orphan.lastScan)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${orphan.orphanCount === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {orphan.orphanCount}
                      </div>
                      <div className={`text-xs ${
                        orphan.trend === 'improving' ? 'text-green-400' :
                        orphan.trend === 'worsening' ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {orphan.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Recent Migrations */}
          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Recent Migrations</h2>
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="space-y-3">
                {migrations.map(migration => (
                  <div key={migration.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-white">{migration.name}</span>
                        {migration.hasRollback && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-400 rounded">Rollback</span>
                        )}
                      </div>
                      <code className="text-xs text-gray-500 font-mono">{migration.id}</code>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 text-xs rounded ${
                        migration.status === 'success' ? 'bg-green-500/20 text-green-400' :
                        migration.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {migration.status}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">{formatDate(migration.appliedAt)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-800">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Weekly semantic audit runs every Sunday at 2 AM UTC</span>
            <span>Semantic Audit v1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
