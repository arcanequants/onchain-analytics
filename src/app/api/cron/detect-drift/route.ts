/**
 * Infrastructure Drift Detection Cron Job
 * Phase 1, Week 3, Day 5 - DevSecOps Tasks
 *
 * Compares Terraform state with actual cloud resources to detect drift.
 * Runs daily to identify configuration changes made outside of IaC.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ================================================================
// TYPES
// ================================================================

type DriftSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type DriftAction = 'create' | 'update' | 'delete' | 'replace';
type DriftResourceType =
  | 'vercel_project'
  | 'vercel_env_var'
  | 'vercel_domain'
  | 'vercel_deployment'
  | 'supabase_project'
  | 'supabase_function'
  | 'supabase_storage'
  | 'supabase_auth'
  | 'github_repo'
  | 'github_secret'
  | 'dns_record'
  | 'other';

interface DriftItem {
  resourceType: DriftResourceType;
  resourceName: string;
  resourceAddress: string;
  driftAction: DriftAction;
  severity: DriftSeverity;
  attributeChanged?: string;
  expectedValue?: string;
  actualValue?: string;
  fullDiff?: Record<string, unknown>;
  securityImpact: boolean;
}

interface VercelProject {
  id: string;
  name: string;
  framework: string;
  buildCommand?: string;
  outputDirectory?: string;
  installCommand?: string;
}

interface VercelEnvVar {
  key: string;
  value?: string;
  target: string[];
  type: string;
}

interface VercelDomain {
  name: string;
  verified: boolean;
}

interface DriftDetectionResult {
  detectionId: string;
  timestamp: string;
  environment: string;
  driftsDetected: number;
  criticalCount: number;
  highCount: number;
  items: DriftItem[];
  errors: string[];
}

// ================================================================
// CONFIGURATION
// ================================================================

const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const PROJECT_ID = process.env.VERCEL_PROJECT_ID;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Expected configuration (from Terraform state or config)
const EXPECTED_CONFIG = {
  vercel: {
    project: {
      name: process.env.VERCEL_PROJECT_NAME || 'ai-perception',
      framework: 'nextjs',
      buildCommand: 'npm run build',
      outputDirectory: '.next',
      installCommand: 'npm ci',
    },
    requiredEnvVars: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
      'CRON_SECRET',
    ],
    domains: [
      process.env.DOMAIN || 'aiperception.agency',
    ],
  },
};

// Security-sensitive attributes that trigger high severity
const SECURITY_SENSITIVE_ATTRS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'CRON_SECRET',
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function generateDetectionId(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `DRIFT-${timestamp}-${random}`;
}

function isSecuritySensitive(attribute: string): boolean {
  return SECURITY_SENSITIVE_ATTRS.some(
    (sensitive) =>
      attribute.toUpperCase().includes(sensitive) ||
      sensitive.includes(attribute.toUpperCase())
  );
}

function determineSeverity(
  action: DriftAction,
  attribute: string | undefined,
  securityImpact: boolean
): DriftSeverity {
  // Security-impacting drift is always high or critical
  if (securityImpact) {
    return action === 'delete' ? 'critical' : 'high';
  }

  // Resource deletion is high severity
  if (action === 'delete') {
    return 'high';
  }

  // Resource creation or replacement is medium
  if (action === 'create' || action === 'replace') {
    return 'medium';
  }

  // Updates depend on the attribute
  if (attribute) {
    if (attribute.toLowerCase().includes('domain')) {
      return 'high';
    }
    if (attribute.toLowerCase().includes('command') || attribute.toLowerCase().includes('region')) {
      return 'medium';
    }
  }

  return 'low';
}

// ================================================================
// VERCEL API FUNCTIONS
// ================================================================

async function fetchVercelProject(): Promise<VercelProject | null> {
  if (!VERCEL_API_TOKEN || !PROJECT_ID) {
    return null;
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${PROJECT_ID}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Vercel project:', error);
    return null;
  }
}

async function fetchVercelEnvVars(): Promise<VercelEnvVar[]> {
  if (!VERCEL_API_TOKEN || !PROJECT_ID) {
    return [];
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${PROJECT_ID}/env${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const data = await response.json();
    return data.envs || [];
  } catch (error) {
    console.error('Error fetching Vercel env vars:', error);
    return [];
  }
}

async function fetchVercelDomains(): Promise<VercelDomain[]> {
  if (!VERCEL_API_TOKEN || !PROJECT_ID) {
    return [];
  }

  try {
    const url = `${VERCEL_API_URL}/v9/projects/${PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.status}`);
    }

    const data = await response.json();
    return data.domains || [];
  } catch (error) {
    console.error('Error fetching Vercel domains:', error);
    return [];
  }
}

// ================================================================
// DRIFT DETECTION
// ================================================================

async function detectVercelDrift(): Promise<{ drifts: DriftItem[]; errors: string[] }> {
  const drifts: DriftItem[] = [];
  const errors: string[] = [];

  // Check project configuration
  const project = await fetchVercelProject();
  if (!project) {
    errors.push('Could not fetch Vercel project configuration');
  } else {
    const expected = EXPECTED_CONFIG.vercel.project;

    // Check framework
    if (project.framework !== expected.framework) {
      drifts.push({
        resourceType: 'vercel_project',
        resourceName: project.name,
        resourceAddress: `vercel_project.${project.name}`,
        driftAction: 'update',
        severity: 'medium',
        attributeChanged: 'framework',
        expectedValue: expected.framework,
        actualValue: project.framework,
        securityImpact: false,
      });
    }

    // Check build command
    if (project.buildCommand && project.buildCommand !== expected.buildCommand) {
      drifts.push({
        resourceType: 'vercel_project',
        resourceName: project.name,
        resourceAddress: `vercel_project.${project.name}`,
        driftAction: 'update',
        severity: 'low',
        attributeChanged: 'build_command',
        expectedValue: expected.buildCommand,
        actualValue: project.buildCommand,
        securityImpact: false,
      });
    }
  }

  // Check environment variables
  const envVars = await fetchVercelEnvVars();
  const envVarKeys = new Set(envVars.map((v) => v.key));

  for (const requiredVar of EXPECTED_CONFIG.vercel.requiredEnvVars) {
    if (!envVarKeys.has(requiredVar)) {
      const securityImpact = isSecuritySensitive(requiredVar);
      drifts.push({
        resourceType: 'vercel_env_var',
        resourceName: requiredVar,
        resourceAddress: `vercel_project_environment_variable.${requiredVar}`,
        driftAction: 'create',
        severity: securityImpact ? 'critical' : 'high',
        attributeChanged: 'key',
        expectedValue: requiredVar,
        actualValue: undefined,
        securityImpact,
      });
    }
  }

  // Check domains
  const domains = await fetchVercelDomains();
  const domainNames = new Set(domains.map((d) => d.name));

  for (const expectedDomain of EXPECTED_CONFIG.vercel.domains) {
    if (!domainNames.has(expectedDomain)) {
      drifts.push({
        resourceType: 'vercel_domain',
        resourceName: expectedDomain,
        resourceAddress: `vercel_project_domain.${expectedDomain}`,
        driftAction: 'create',
        severity: 'high',
        attributeChanged: 'domain',
        expectedValue: expectedDomain,
        actualValue: undefined,
        securityImpact: false,
      });
    }
  }

  // Check for unverified domains
  for (const domain of domains) {
    if (!domain.verified) {
      drifts.push({
        resourceType: 'vercel_domain',
        resourceName: domain.name,
        resourceAddress: `vercel_project_domain.${domain.name}`,
        driftAction: 'update',
        severity: 'medium',
        attributeChanged: 'verified',
        expectedValue: 'true',
        actualValue: 'false',
        securityImpact: false,
      });
    }
  }

  return { drifts, errors };
}

// ================================================================
// DATABASE OPERATIONS
// ================================================================

async function saveDriftResults(
  supabase: ReturnType<typeof createClient>,
  result: DriftDetectionResult
): Promise<void> {
  // Record cron execution
  await supabase.from('cron_executions').insert({
    job_name: 'detect-drift',
    status: result.errors.length === 0 ? 'success' : 'partial',
    execution_time: new Date().toISOString(),
    metadata: {
      detection_id: result.detectionId,
      drifts_detected: result.driftsDetected,
      critical_count: result.criticalCount,
      high_count: result.highCount,
      errors: result.errors,
    },
  });

  // Insert drift items
  for (const item of result.items) {
    await supabase.rpc('record_drift', {
      p_detection_id: result.detectionId,
      p_resource_type: item.resourceType,
      p_resource_name: item.resourceName,
      p_resource_address: item.resourceAddress,
      p_drift_action: item.driftAction,
      p_severity: item.severity,
      p_attribute_changed: item.attributeChanged,
      p_expected_value: item.expectedValue,
      p_actual_value: item.actualValue,
      p_full_diff: item.fullDiff,
      p_environment: result.environment,
      p_security_impact: item.securityImpact,
      p_metadata: {},
    });
  }
}

// ================================================================
// MAIN HANDLER
// ================================================================

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const detectionId = generateDetectionId();
  const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';

  try {
    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
      auth: { persistSession: false },
    });

    // Detect Vercel drift
    const { drifts, errors } = await detectVercelDrift();

    // Count by severity
    const criticalCount = drifts.filter((d) => d.severity === 'critical').length;
    const highCount = drifts.filter((d) => d.severity === 'high').length;

    const result: DriftDetectionResult = {
      detectionId,
      timestamp: new Date().toISOString(),
      environment,
      driftsDetected: drifts.length,
      criticalCount,
      highCount,
      items: drifts,
      errors,
    };

    // Save to database
    await saveDriftResults(supabase, result);

    // Log summary
    console.log(`Drift detection ${detectionId} completed:`, {
      driftsDetected: drifts.length,
      critical: criticalCount,
      high: highCount,
      duration: Date.now() - startTime,
    });

    return NextResponse.json({
      success: true,
      detectionId,
      summary: {
        driftsDetected: drifts.length,
        criticalCount,
        highCount,
        environment,
        durationMs: Date.now() - startTime,
      },
      items: drifts,
      errors,
    });
  } catch (error) {
    console.error('Drift detection failed:', error);

    return NextResponse.json(
      {
        success: false,
        detectionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers with custom config
export async function POST(request: NextRequest) {
  return GET(request);
}
