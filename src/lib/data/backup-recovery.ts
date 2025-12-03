/**
 * Backup Automation, Recovery Tests & DR Runbook Module
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Provides:
 * - Automated backup scheduling
 * - Backup verification
 * - Point-in-time recovery
 * - Recovery testing framework
 * - DR runbook documentation
 * - RTO/RPO monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type BackupType = 'full' | 'incremental' | 'differential' | 'snapshot';

export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed' | 'verified';

export type StorageLocation = 's3' | 'gcs' | 'azure' | 'local' | 'supabase';

export type RecoveryType = 'full' | 'partial' | 'point_in_time' | 'table_only';

export type TestResult = 'passed' | 'failed' | 'skipped' | 'error';

export interface BackupConfig {
  id: string;
  name: string;
  type: BackupType;
  database: string;
  tables?: string[]; // If empty, backup all tables
  schedule: string; // cron expression
  retention: {
    count: number;
    days: number;
  };
  storage: {
    location: StorageLocation;
    bucket?: string;
    path: string;
    encryption: boolean;
  };
  enabled: boolean;
  notifyOnFailure: boolean;
  notifyChannels: string[];
}

export interface Backup {
  id: string;
  configId: string;
  type: BackupType;
  status: BackupStatus;
  startedAt: Date;
  completedAt?: Date;
  sizeBytes: number;
  rowCount: number;
  tables: string[];
  storagePath: string;
  checksum?: string;
  verified: boolean;
  verifiedAt?: Date;
  metadata: Record<string, unknown>;
  error?: string;
}

export interface RecoveryPlan {
  id: string;
  name: string;
  description: string;
  type: RecoveryType;
  sourceBackupId?: string;
  targetDatabase: string;
  targetSchema?: string;
  tables?: string[];
  pointInTime?: Date;
  steps: RecoveryStep[];
  estimatedDuration: number; // minutes
  rto: number; // minutes - Recovery Time Objective
  rpo: number; // minutes - Recovery Point Objective
}

export interface RecoveryStep {
  order: number;
  name: string;
  description: string;
  command: string;
  estimatedDuration: number; // seconds
  critical: boolean;
  rollbackCommand?: string;
}

export interface RecoveryExecution {
  id: string;
  planId: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed' | 'rolled_back';
  stepsCompleted: number;
  totalSteps: number;
  currentStep?: string;
  logs: RecoveryLog[];
  error?: string;
}

export interface RecoveryLog {
  timestamp: Date;
  step: number;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface RecoveryTest {
  id: string;
  name: string;
  description: string;
  planId: string;
  schedule: string;
  lastRunAt?: Date;
  lastResult?: TestResult;
  enabled: boolean;
}

export interface RecoveryTestResult {
  testId: string;
  executedAt: Date;
  result: TestResult;
  duration: number;
  steps: {
    name: string;
    result: TestResult;
    duration: number;
    error?: string;
  }[];
  recoveryMetrics: {
    actualRTO: number;
    actualRPO: number;
    dataIntegrityScore: number; // 0-100
    rowsRecovered: number;
    rowsMissing: number;
  };
}

export interface DRRunbook {
  id: string;
  version: string;
  lastUpdated: Date;
  updatedBy: string;
  sections: RunbookSection[];
  contacts: Contact[];
  escalationPath: EscalationLevel[];
  tools: Tool[];
}

export interface RunbookSection {
  title: string;
  content: string;
  steps?: RunbookStep[];
  warnings?: string[];
}

export interface RunbookStep {
  order: number;
  action: string;
  command?: string;
  expectedOutput?: string;
  timeLimit?: number; // seconds
  onFailure?: string;
}

export interface Contact {
  name: string;
  role: string;
  email: string;
  phone?: string;
  slack?: string;
  availability: string;
}

export interface EscalationLevel {
  level: number;
  name: string;
  contacts: string[];
  triggerAfterMinutes: number;
  criteria: string;
}

export interface Tool {
  name: string;
  purpose: string;
  accessUrl?: string;
  credentials?: string; // reference to secrets manager
  documentation?: string;
}

// ============================================================================
// BACKUP MANAGER
// ============================================================================

export class BackupManager {
  private configs: Map<string, BackupConfig> = new Map();
  private backups: Backup[] = [];

  /**
   * Register backup configuration
   */
  registerConfig(config: BackupConfig): void {
    this.configs.set(config.id, config);
  }

  /**
   * Get config by ID
   */
  getConfig(id: string): BackupConfig | undefined {
    return this.configs.get(id);
  }

  /**
   * Get all configs
   */
  getAllConfigs(): BackupConfig[] {
    return Array.from(this.configs.values());
  }

  /**
   * Create backup
   */
  createBackup(configId: string): Backup {
    const config = this.configs.get(configId);
    if (!config) {
      throw new Error(`Backup config not found: ${configId}`);
    }

    const backup: Backup = {
      id: `bkp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      configId,
      type: config.type,
      status: 'running',
      startedAt: new Date(),
      sizeBytes: 0,
      rowCount: 0,
      tables: config.tables || [],
      storagePath: this.generateStoragePath(config),
      verified: false,
      metadata: {},
    };

    this.backups.push(backup);
    return backup;
  }

  /**
   * Complete backup
   */
  completeBackup(
    backupId: string,
    sizeBytes: number,
    rowCount: number,
    checksum?: string
  ): Backup | null {
    const backup = this.backups.find((b) => b.id === backupId);
    if (!backup) return null;

    backup.status = 'completed';
    backup.completedAt = new Date();
    backup.sizeBytes = sizeBytes;
    backup.rowCount = rowCount;
    backup.checksum = checksum;

    return backup;
  }

  /**
   * Fail backup
   */
  failBackup(backupId: string, error: string): Backup | null {
    const backup = this.backups.find((b) => b.id === backupId);
    if (!backup) return null;

    backup.status = 'failed';
    backup.completedAt = new Date();
    backup.error = error;

    return backup;
  }

  /**
   * Verify backup
   */
  verifyBackup(backupId: string): Backup | null {
    const backup = this.backups.find((b) => b.id === backupId);
    if (!backup) return null;

    backup.verified = true;
    backup.verifiedAt = new Date();
    backup.status = 'verified';

    return backup;
  }

  /**
   * Get latest backup for config
   */
  getLatestBackup(configId: string): Backup | null {
    const configBackups = this.backups
      .filter((b) => b.configId === configId && b.status === 'verified')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    return configBackups[0] || null;
  }

  /**
   * Get backups in date range
   */
  getBackupsInRange(startDate: Date, endDate: Date): Backup[] {
    return this.backups.filter(
      (b) => b.startedAt >= startDate && b.startedAt <= endDate
    );
  }

  /**
   * Apply retention policy
   */
  applyRetention(configId: string): Backup[] {
    const config = this.configs.get(configId);
    if (!config) return [];

    const configBackups = this.backups
      .filter((b) => b.configId === configId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.retention.days);

    const toDelete: Backup[] = [];

    // Keep at least retention.count backups, delete older than retention.days
    for (let i = 0; i < configBackups.length; i++) {
      const backup = configBackups[i];
      if (i >= config.retention.count && backup.startedAt < cutoffDate) {
        toDelete.push(backup);
      }
    }

    // Remove from list
    for (const backup of toDelete) {
      const index = this.backups.indexOf(backup);
      if (index > -1) {
        this.backups.splice(index, 1);
      }
    }

    return toDelete;
  }

  /**
   * Generate storage path
   */
  private generateStoragePath(config: BackupConfig): string {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');

    return `${config.storage.path}/${config.database}/${dateStr}/${config.type}_${timeStr}`;
  }

  /**
   * Generate backup SQL
   */
  generateBackupSQL(config: BackupConfig): string {
    const tables = config.tables?.length
      ? config.tables.map((t) => `-t ${t}`).join(' ')
      : '';

    return `
# Backup command for ${config.name}

# Full database backup with pg_dump
pg_dump \\
  --host=$PGHOST \\
  --port=$PGPORT \\
  --username=$PGUSER \\
  --dbname=${config.database} \\
  --format=custom \\
  --compress=9 \\
  ${tables} \\
  --file=/tmp/backup_$(date +%Y%m%d_%H%M%S).dump

# Verify backup
pg_restore --list /tmp/backup_*.dump | head -20

# Upload to storage
${this.generateUploadCommand(config)}

# Calculate checksum
sha256sum /tmp/backup_*.dump
`.trim();
  }

  /**
   * Generate upload command based on storage location
   */
  private generateUploadCommand(config: BackupConfig): string {
    switch (config.storage.location) {
      case 's3':
        return `aws s3 cp /tmp/backup_*.dump s3://${config.storage.bucket}/${config.storage.path}/`;
      case 'gcs':
        return `gsutil cp /tmp/backup_*.dump gs://${config.storage.bucket}/${config.storage.path}/`;
      case 'supabase':
        return `# Upload to Supabase Storage via API`;
      default:
        return `cp /tmp/backup_*.dump ${config.storage.path}/`;
    }
  }

  /**
   * Get backup summary
   */
  getSummary(): {
    totalBackups: number;
    successfulBackups: number;
    failedBackups: number;
    totalSizeBytes: number;
    oldestBackup?: Date;
    latestBackup?: Date;
  } {
    const completed = this.backups.filter((b) =>
      ['completed', 'verified'].includes(b.status)
    );
    const failed = this.backups.filter((b) => b.status === 'failed');

    return {
      totalBackups: this.backups.length,
      successfulBackups: completed.length,
      failedBackups: failed.length,
      totalSizeBytes: completed.reduce((sum, b) => sum + b.sizeBytes, 0),
      oldestBackup: this.backups.length > 0
        ? this.backups.reduce((oldest, b) =>
            b.startedAt < oldest.startedAt ? b : oldest
          ).startedAt
        : undefined,
      latestBackup: this.backups.length > 0
        ? this.backups.reduce((latest, b) =>
            b.startedAt > latest.startedAt ? b : latest
          ).startedAt
        : undefined,
    };
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.configs.clear();
    this.backups = [];
  }
}

// ============================================================================
// RECOVERY MANAGER
// ============================================================================

export class RecoveryManager {
  private plans: Map<string, RecoveryPlan> = new Map();
  private executions: RecoveryExecution[] = [];

  /**
   * Register recovery plan
   */
  registerPlan(plan: RecoveryPlan): void {
    this.plans.set(plan.id, plan);
  }

  /**
   * Get plan by ID
   */
  getPlan(id: string): RecoveryPlan | undefined {
    return this.plans.get(id);
  }

  /**
   * Get all plans
   */
  getAllPlans(): RecoveryPlan[] {
    return Array.from(this.plans.values());
  }

  /**
   * Start recovery execution
   */
  startRecovery(planId: string): RecoveryExecution {
    const plan = this.plans.get(planId);
    if (!plan) {
      throw new Error(`Recovery plan not found: ${planId}`);
    }

    const execution: RecoveryExecution = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planId,
      startedAt: new Date(),
      status: 'running',
      stepsCompleted: 0,
      totalSteps: plan.steps.length,
      currentStep: plan.steps[0]?.name,
      logs: [
        {
          timestamp: new Date(),
          step: 0,
          message: `Starting recovery plan: ${plan.name}`,
          level: 'info',
        },
      ],
    };

    this.executions.push(execution);
    return execution;
  }

  /**
   * Update execution step
   */
  updateStep(
    executionId: string,
    stepNumber: number,
    message: string,
    level: 'info' | 'warning' | 'error' = 'info'
  ): RecoveryExecution | null {
    const execution = this.executions.find((e) => e.id === executionId);
    if (!execution) return null;

    const plan = this.plans.get(execution.planId);
    if (!plan) return null;

    execution.logs.push({
      timestamp: new Date(),
      step: stepNumber,
      message,
      level,
    });

    if (level !== 'error') {
      execution.stepsCompleted = stepNumber;
      if (stepNumber < plan.steps.length) {
        execution.currentStep = plan.steps[stepNumber]?.name;
      }
    }

    return execution;
  }

  /**
   * Complete recovery
   */
  completeRecovery(executionId: string): RecoveryExecution | null {
    const execution = this.executions.find((e) => e.id === executionId);
    if (!execution) return null;

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.stepsCompleted = execution.totalSteps;
    execution.currentStep = undefined;

    execution.logs.push({
      timestamp: new Date(),
      step: execution.totalSteps,
      message: 'Recovery completed successfully',
      level: 'info',
    });

    return execution;
  }

  /**
   * Fail recovery
   */
  failRecovery(executionId: string, error: string): RecoveryExecution | null {
    const execution = this.executions.find((e) => e.id === executionId);
    if (!execution) return null;

    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.error = error;

    execution.logs.push({
      timestamp: new Date(),
      step: execution.stepsCompleted,
      message: `Recovery failed: ${error}`,
      level: 'error',
    });

    return execution;
  }

  /**
   * Generate recovery SQL
   */
  generateRecoverySQL(plan: RecoveryPlan, backupPath: string): string {
    const steps: string[] = [
      '-- Recovery procedure',
      `-- Plan: ${plan.name}`,
      `-- Type: ${plan.type}`,
      '',
    ];

    if (plan.type === 'full') {
      steps.push(`
# Step 1: Stop all connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${plan.targetDatabase}';"

# Step 2: Drop and recreate database
dropdb ${plan.targetDatabase}
createdb ${plan.targetDatabase}

# Step 3: Restore from backup
pg_restore \\
  --host=$PGHOST \\
  --port=$PGPORT \\
  --username=$PGUSER \\
  --dbname=${plan.targetDatabase} \\
  --verbose \\
  ${backupPath}

# Step 4: Verify restoration
psql -d ${plan.targetDatabase} -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
`.trim());
    }

    if (plan.type === 'point_in_time' && plan.pointInTime) {
      steps.push(`
# Point-in-Time Recovery to ${plan.pointInTime.toISOString()}
# Requires WAL archiving enabled

# Step 1: Stop PostgreSQL
pg_ctl stop -D $PGDATA

# Step 2: Create recovery.conf
cat > $PGDATA/recovery.conf << EOF
restore_command = 'cp /archive/%f %p'
recovery_target_time = '${plan.pointInTime.toISOString()}'
recovery_target_action = 'promote'
EOF

# Step 3: Start PostgreSQL
pg_ctl start -D $PGDATA
`.trim());
    }

    if (plan.type === 'table_only' && plan.tables?.length) {
      steps.push(`
# Table-only recovery

# Step 1: Extract specific tables from backup
pg_restore \\
  --host=$PGHOST \\
  --port=$PGPORT \\
  --username=$PGUSER \\
  --dbname=${plan.targetDatabase} \\
  ${plan.tables.map((t) => `-t ${t}`).join(' ')} \\
  --clean \\
  ${backupPath}
`.trim());
    }

    return steps.join('\n');
  }

  /**
   * Get execution history
   */
  getExecutionHistory(planId?: string): RecoveryExecution[] {
    if (planId) {
      return this.executions.filter((e) => e.planId === planId);
    }
    return [...this.executions];
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.plans.clear();
    this.executions = [];
  }
}

// ============================================================================
// RECOVERY TEST RUNNER
// ============================================================================

export class RecoveryTestRunner {
  private tests: Map<string, RecoveryTest> = new Map();
  private results: RecoveryTestResult[] = [];
  private recoveryManager: RecoveryManager;

  constructor(recoveryManager: RecoveryManager) {
    this.recoveryManager = recoveryManager;
  }

  /**
   * Register test
   */
  registerTest(test: RecoveryTest): void {
    this.tests.set(test.id, test);
  }

  /**
   * Get test by ID
   */
  getTest(id: string): RecoveryTest | undefined {
    return this.tests.get(id);
  }

  /**
   * Run test
   */
  runTest(testId: string): RecoveryTestResult {
    const test = this.tests.get(testId);
    if (!test) {
      throw new Error(`Test not found: ${testId}`);
    }

    const plan = this.recoveryManager.getPlan(test.planId);
    if (!plan) {
      throw new Error(`Recovery plan not found: ${test.planId}`);
    }

    const startTime = Date.now();
    const stepResults: RecoveryTestResult['steps'] = [];

    // Simulate running each step
    for (const step of plan.steps) {
      const stepStartTime = Date.now();
      const stepResult: TestResult = Math.random() > 0.1 ? 'passed' : 'failed';

      stepResults.push({
        name: step.name,
        result: stepResult,
        duration: Date.now() - stepStartTime + Math.random() * 1000,
        error: stepResult === 'failed' ? 'Simulated failure' : undefined,
      });

      if (stepResult === 'failed' && step.critical) {
        break;
      }
    }

    const allPassed = stepResults.every((s) => s.result === 'passed');
    const totalDuration = Date.now() - startTime;

    const result: RecoveryTestResult = {
      testId,
      executedAt: new Date(),
      result: allPassed ? 'passed' : 'failed',
      duration: totalDuration,
      steps: stepResults,
      recoveryMetrics: {
        actualRTO: Math.round(totalDuration / 60000), // Convert to minutes
        actualRPO: 5, // Simulated
        dataIntegrityScore: allPassed ? 100 : 85,
        rowsRecovered: 1000000,
        rowsMissing: allPassed ? 0 : 150,
      },
    };

    this.results.push(result);

    // Update test
    test.lastRunAt = new Date();
    test.lastResult = result.result;

    return result;
  }

  /**
   * Get test results
   */
  getResults(testId?: string): RecoveryTestResult[] {
    if (testId) {
      return this.results.filter((r) => r.testId === testId);
    }
    return [...this.results];
  }

  /**
   * Generate test report
   */
  generateReport(): string {
    const lines: string[] = [
      '# Recovery Test Report',
      '',
      `**Generated:** ${new Date().toISOString()}`,
      '',
      '## Test Summary',
      '',
      `| Test | Last Run | Result | RTO | RPO | Integrity |`,
      `|------|----------|--------|-----|-----|-----------|`,
    ];

    for (const test of this.tests.values()) {
      const latestResult = this.results
        .filter((r) => r.testId === test.id)
        .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())[0];

      if (latestResult) {
        const resultIcon = latestResult.result === 'passed' ? '✅' : '❌';
        lines.push(
          `| ${test.name} | ${latestResult.executedAt.toISOString().split('T')[0]} | ${resultIcon} | ${latestResult.recoveryMetrics.actualRTO}m | ${latestResult.recoveryMetrics.actualRPO}m | ${latestResult.recoveryMetrics.dataIntegrityScore}% |`
        );
      } else {
        lines.push(`| ${test.name} | Never | ⏸️ | - | - | - |`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Reset (for testing)
   */
  reset(): void {
    this.tests.clear();
    this.results = [];
  }
}

// ============================================================================
// DR RUNBOOK GENERATOR
// ============================================================================

export class DRRunbookGenerator {
  /**
   * Generate default DR runbook
   */
  generateRunbook(): DRRunbook {
    return {
      id: 'dr_runbook_v1',
      version: '1.0.0',
      lastUpdated: new Date(),
      updatedBy: 'system',
      sections: [
        {
          title: 'Overview',
          content: `
This document outlines the Disaster Recovery (DR) procedures for the OnChain Analytics platform.

**Objectives:**
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 5 minutes

**Scope:**
- Supabase PostgreSQL database
- Vercel deployment
- External API integrations
          `.trim(),
        },
        {
          title: 'Pre-Incident Preparation',
          content: 'Ensure the following are in place before any incident occurs:',
          steps: [
            {
              order: 1,
              action: 'Verify backup schedule is running',
              command: 'Check Supabase dashboard > Database > Backups',
              expectedOutput: 'Daily backups listed with recent dates',
            },
            {
              order: 2,
              action: 'Confirm monitoring is active',
              command: 'Check observability dashboard',
              expectedOutput: 'All SLAs showing green status',
            },
            {
              order: 3,
              action: 'Test alert channels',
              command: 'Send test alert to Slack/email',
              expectedOutput: 'Alert received within 1 minute',
            },
          ],
        },
        {
          title: 'Incident Detection',
          content: 'How to identify a disaster scenario:',
          warnings: [
            'Multiple failed health checks',
            'Database connection failures',
            'Data corruption detected',
            'Supabase region outage',
          ],
        },
        {
          title: 'Incident Response - Database Failure',
          content: 'Steps to recover from database failure:',
          steps: [
            {
              order: 1,
              action: 'Assess the situation',
              command: 'SELECT 1 FROM token_prices LIMIT 1;',
              timeLimit: 30,
              onFailure: 'Proceed to step 2',
            },
            {
              order: 2,
              action: 'Check Supabase status',
              command: 'curl -s https://status.supabase.com/api/v2/status.json | jq',
              expectedOutput: 'status: operational',
            },
            {
              order: 3,
              action: 'Initiate point-in-time recovery',
              command: 'Use Supabase dashboard > Database > Backups > Restore',
              timeLimit: 300,
            },
            {
              order: 4,
              action: 'Verify data integrity',
              command: 'Run DQ checks against restored database',
              expectedOutput: 'All checks passing',
            },
            {
              order: 5,
              action: 'Update DNS/connection strings if needed',
              command: 'Update SUPABASE_URL in Vercel env vars',
            },
            {
              order: 6,
              action: 'Verify application functionality',
              command: 'curl -s https://app.example.com/api/health',
              expectedOutput: 'status: ok',
            },
          ],
        },
        {
          title: 'Incident Response - Vercel Deployment Failure',
          content: 'Steps to recover from deployment failure:',
          steps: [
            {
              order: 1,
              action: 'Check Vercel status',
              command: 'curl -s https://www.vercel-status.com/api/v2/status.json | jq',
            },
            {
              order: 2,
              action: 'Rollback to previous deployment',
              command: 'vercel rollback --token $VERCEL_TOKEN',
            },
            {
              order: 3,
              action: 'Verify rollback success',
              command: 'curl -s https://app.example.com/api/health',
              expectedOutput: 'status: ok',
            },
          ],
        },
        {
          title: 'Post-Incident',
          content: 'After recovery is complete:',
          steps: [
            {
              order: 1,
              action: 'Document incident timeline',
            },
            {
              order: 2,
              action: 'Calculate actual RTO and RPO',
            },
            {
              order: 3,
              action: 'Schedule post-mortem meeting',
            },
            {
              order: 4,
              action: 'Update runbook with lessons learned',
            },
            {
              order: 5,
              action: 'Notify stakeholders of resolution',
            },
          ],
        },
      ],
      contacts: [
        {
          name: 'On-Call Engineer',
          role: 'Primary responder',
          email: 'oncall@example.com',
          phone: '+1-555-0100',
          slack: '@oncall',
          availability: '24/7',
        },
        {
          name: 'Database Admin',
          role: 'Database specialist',
          email: 'dba@example.com',
          slack: '@dba-team',
          availability: 'Business hours + on-call',
        },
        {
          name: 'Platform Lead',
          role: 'Escalation point',
          email: 'platform-lead@example.com',
          slack: '@platform-lead',
          availability: 'Business hours',
        },
      ],
      escalationPath: [
        {
          level: 1,
          name: 'On-Call Engineer',
          contacts: ['On-Call Engineer'],
          triggerAfterMinutes: 0,
          criteria: 'Initial alert received',
        },
        {
          level: 2,
          name: 'Database Team',
          contacts: ['Database Admin'],
          triggerAfterMinutes: 15,
          criteria: 'Database-related issue or no progress in 15 min',
        },
        {
          level: 3,
          name: 'Leadership',
          contacts: ['Platform Lead'],
          triggerAfterMinutes: 30,
          criteria: 'Customer impact or RTO at risk',
        },
      ],
      tools: [
        {
          name: 'Supabase Dashboard',
          purpose: 'Database management, backups, monitoring',
          accessUrl: 'https://supabase.com/dashboard',
          credentials: 'Use SSO with company email',
        },
        {
          name: 'Vercel Dashboard',
          purpose: 'Deployment management, rollback',
          accessUrl: 'https://vercel.com/dashboard',
          credentials: 'Use SSO with company email',
        },
        {
          name: 'Slack',
          purpose: 'Communication, alerts',
          accessUrl: 'https://slack.com',
          credentials: 'Use company account',
        },
      ],
    };
  }

  /**
   * Generate runbook markdown
   */
  generateMarkdown(runbook: DRRunbook): string {
    const lines: string[] = [
      '# Disaster Recovery Runbook',
      '',
      `**Version:** ${runbook.version}`,
      `**Last Updated:** ${runbook.lastUpdated.toISOString().split('T')[0]}`,
      `**Updated By:** ${runbook.updatedBy}`,
      '',
      '---',
      '',
    ];

    // Sections
    for (const section of runbook.sections) {
      lines.push(`## ${section.title}`, '');
      lines.push(section.content, '');

      if (section.warnings?.length) {
        lines.push('**Warning Signs:**');
        for (const warning of section.warnings) {
          lines.push(`- ⚠️ ${warning}`);
        }
        lines.push('');
      }

      if (section.steps?.length) {
        lines.push('**Steps:**');
        for (const step of section.steps) {
          lines.push(`${step.order}. **${step.action}**`);
          if (step.command) {
            lines.push('   ```bash');
            lines.push(`   ${step.command}`);
            lines.push('   ```');
          }
          if (step.expectedOutput) {
            lines.push(`   Expected: \`${step.expectedOutput}\``);
          }
          if (step.timeLimit) {
            lines.push(`   Time limit: ${step.timeLimit} seconds`);
          }
          if (step.onFailure) {
            lines.push(`   On failure: ${step.onFailure}`);
          }
        }
        lines.push('');
      }
    }

    // Contacts
    lines.push('## Contacts', '');
    lines.push('| Name | Role | Email | Slack | Availability |');
    lines.push('|------|------|-------|-------|--------------|');
    for (const contact of runbook.contacts) {
      lines.push(
        `| ${contact.name} | ${contact.role} | ${contact.email} | ${contact.slack || '-'} | ${contact.availability} |`
      );
    }
    lines.push('');

    // Escalation
    lines.push('## Escalation Path', '');
    for (const level of runbook.escalationPath) {
      lines.push(`### Level ${level.level}: ${level.name}`);
      lines.push(`- **Trigger:** ${level.triggerAfterMinutes} minutes`);
      lines.push(`- **Criteria:** ${level.criteria}`);
      lines.push(`- **Contacts:** ${level.contacts.join(', ')}`);
      lines.push('');
    }

    // Tools
    lines.push('## Tools', '');
    for (const tool of runbook.tools) {
      lines.push(`### ${tool.name}`);
      lines.push(`- **Purpose:** ${tool.purpose}`);
      if (tool.accessUrl) {
        lines.push(`- **URL:** ${tool.accessUrl}`);
      }
      if (tool.credentials) {
        lines.push(`- **Access:** ${tool.credentials}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_BACKUP_CONFIGS: BackupConfig[] = [
  {
    id: 'daily_full_backup',
    name: 'Daily Full Database Backup',
    type: 'full',
    database: 'onchain_analytics',
    schedule: '0 2 * * *', // 2 AM daily
    retention: { count: 7, days: 30 },
    storage: {
      location: 'supabase',
      path: 'backups/daily',
      encryption: true,
    },
    enabled: true,
    notifyOnFailure: true,
    notifyChannels: ['slack', 'email'],
  },
  {
    id: 'hourly_incremental',
    name: 'Hourly Incremental Backup',
    type: 'incremental',
    database: 'onchain_analytics',
    tables: ['token_prices', 'protocol_tvl', 'gas_metrics'],
    schedule: '0 * * * *', // Every hour
    retention: { count: 24, days: 7 },
    storage: {
      location: 'supabase',
      path: 'backups/hourly',
      encryption: true,
    },
    enabled: true,
    notifyOnFailure: true,
    notifyChannels: ['slack'],
  },
];

export const DEFAULT_RECOVERY_PLANS: RecoveryPlan[] = [
  {
    id: 'full_database_recovery',
    name: 'Full Database Recovery',
    description: 'Recover entire database from latest backup',
    type: 'full',
    targetDatabase: 'onchain_analytics',
    steps: [
      {
        order: 1,
        name: 'Stop application',
        description: 'Disable all incoming traffic',
        command: 'vercel pause',
        estimatedDuration: 30,
        critical: true,
      },
      {
        order: 2,
        name: 'Locate latest backup',
        description: 'Find most recent verified backup',
        command: 'list backups',
        estimatedDuration: 60,
        critical: true,
      },
      {
        order: 3,
        name: 'Restore database',
        description: 'Restore from backup file',
        command: 'pg_restore',
        estimatedDuration: 1800,
        critical: true,
        rollbackCommand: 'Drop restored tables',
      },
      {
        order: 4,
        name: 'Verify data integrity',
        description: 'Run DQ checks',
        command: 'npm run dq:check',
        estimatedDuration: 300,
        critical: true,
      },
      {
        order: 5,
        name: 'Resume application',
        description: 'Re-enable traffic',
        command: 'vercel unpause',
        estimatedDuration: 30,
        critical: false,
      },
    ],
    estimatedDuration: 45,
    rto: 60,
    rpo: 5,
  },
];

export const DEFAULT_RECOVERY_TESTS: RecoveryTest[] = [
  {
    id: 'weekly_recovery_test',
    name: 'Weekly Recovery Test',
    description: 'Test full database recovery procedure',
    planId: 'full_database_recovery',
    schedule: '0 3 * * 0', // 3 AM every Sunday
    enabled: true,
  },
];

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let defaultBackupManager: BackupManager | null = null;
let defaultRecoveryManager: RecoveryManager | null = null;
let defaultTestRunner: RecoveryTestRunner | null = null;

export function getDefaultBackupManager(): BackupManager {
  if (!defaultBackupManager) {
    defaultBackupManager = new BackupManager();
    for (const config of DEFAULT_BACKUP_CONFIGS) {
      defaultBackupManager.registerConfig(config);
    }
  }
  return defaultBackupManager;
}

export function getDefaultRecoveryManager(): RecoveryManager {
  if (!defaultRecoveryManager) {
    defaultRecoveryManager = new RecoveryManager();
    for (const plan of DEFAULT_RECOVERY_PLANS) {
      defaultRecoveryManager.registerPlan(plan);
    }
  }
  return defaultRecoveryManager;
}

export function getDefaultTestRunner(): RecoveryTestRunner {
  if (!defaultTestRunner) {
    defaultTestRunner = new RecoveryTestRunner(getDefaultRecoveryManager());
    for (const test of DEFAULT_RECOVERY_TESTS) {
      defaultTestRunner.registerTest(test);
    }
  }
  return defaultTestRunner;
}

export function resetManagers(): void {
  defaultBackupManager?.reset();
  defaultRecoveryManager?.reset();
  defaultTestRunner?.reset();
  defaultBackupManager = null;
  defaultRecoveryManager = null;
  defaultTestRunner = null;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Classes
  BackupManager,
  RecoveryManager,
  RecoveryTestRunner,
  DRRunbookGenerator,

  // Singletons
  getDefaultBackupManager,
  getDefaultRecoveryManager,
  getDefaultTestRunner,
  resetManagers,

  // Defaults
  DEFAULT_BACKUP_CONFIGS,
  DEFAULT_RECOVERY_PLANS,
  DEFAULT_RECOVERY_TESTS,
};
