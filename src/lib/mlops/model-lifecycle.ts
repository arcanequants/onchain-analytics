/**
 * Model Lifecycle Management
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Model version registry
 * - Deployment tracking
 * - A/B testing support
 * - Rollback capabilities
 */

// ============================================================================
// TYPES
// ============================================================================

export type ModelStage =
  | 'development'
  | 'staging'
  | 'production'
  | 'archived'
  | 'deprecated';

export type ModelStatus =
  | 'training'
  | 'validating'
  | 'ready'
  | 'deploying'
  | 'deployed'
  | 'failed'
  | 'retired';

export interface ModelVersion {
  id: string;
  modelName: string;
  version: string;
  stage: ModelStage;
  status: ModelStatus;
  provider: string;
  config: ModelConfig;
  metrics: ModelMetrics;
  artifacts: ModelArtifact[];
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    description?: string;
    tags: string[];
  };
}

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  customParams?: Record<string, unknown>;
}

export interface ModelMetrics {
  accuracy?: number;
  latencyP50Ms: number;
  latencyP95Ms: number;
  errorRate: number;
  costPer1kTokens: number;
  throughputRps: number;
  qualityScore?: number;
  driftScore?: number;
}

export interface ModelArtifact {
  name: string;
  type: 'prompt' | 'config' | 'evaluation' | 'weights' | 'other';
  path: string;
  size: number;
  checksum: string;
}

export interface Deployment {
  id: string;
  modelVersionId: string;
  environment: 'staging' | 'production';
  status: 'pending' | 'in_progress' | 'active' | 'failed' | 'rolled_back';
  trafficPercent: number;
  startedAt: Date;
  completedAt?: Date;
  rollbackFromId?: string;
  metadata?: Record<string, unknown>;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'completed' | 'cancelled';
  variants: ABVariant[];
  startDate: Date;
  endDate?: Date;
  metrics: {
    primary: string;
    secondary: string[];
  };
  results?: ABTestResults;
}

export interface ABVariant {
  id: string;
  name: string;
  modelVersionId: string;
  trafficPercent: number;
  isControl: boolean;
}

export interface ABTestResults {
  winner?: string;
  confidence: number;
  metrics: Record<string, {
    control: number;
    treatment: number;
    lift: number;
    pValue: number;
  }>;
  sampleSize: {
    control: number;
    treatment: number;
  };
}

// ============================================================================
// STORAGE (In-memory - would be database in production)
// ============================================================================

const modelVersions = new Map<string, ModelVersion>();
const deployments = new Map<string, Deployment>();
const abTests = new Map<string, ABTest>();

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

/**
 * Generate version ID
 */
function generateVersionId(modelName: string, version: string): string {
  return `${modelName}:${version}`;
}

/**
 * Register a new model version
 */
export function registerModelVersion(
  options: {
    modelName: string;
    version: string;
    provider: string;
    config: ModelConfig;
    createdBy: string;
    description?: string;
    tags?: string[];
  }
): ModelVersion {
  const id = generateVersionId(options.modelName, options.version);

  const modelVersion: ModelVersion = {
    id,
    modelName: options.modelName,
    version: options.version,
    stage: 'development',
    status: 'ready',
    provider: options.provider,
    config: options.config,
    metrics: {
      latencyP50Ms: 0,
      latencyP95Ms: 0,
      errorRate: 0,
      costPer1kTokens: 0,
      throughputRps: 0,
    },
    artifacts: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: options.createdBy,
      description: options.description,
      tags: options.tags || [],
    },
  };

  modelVersions.set(id, modelVersion);
  return modelVersion;
}

/**
 * Get model version by ID
 */
export function getModelVersion(id: string): ModelVersion | undefined {
  return modelVersions.get(id);
}

/**
 * Get all versions of a model
 */
export function getModelVersions(modelName: string): ModelVersion[] {
  return Array.from(modelVersions.values())
    .filter(v => v.modelName === modelName)
    .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
}

/**
 * Get latest version of a model
 */
export function getLatestVersion(modelName: string): ModelVersion | undefined {
  const versions = getModelVersions(modelName);
  return versions[0];
}

/**
 * Get production version of a model
 */
export function getProductionVersion(modelName: string): ModelVersion | undefined {
  return Array.from(modelVersions.values())
    .find(v => v.modelName === modelName && v.stage === 'production');
}

/**
 * Promote model version to new stage
 */
export function promoteVersion(
  versionId: string,
  targetStage: ModelStage,
  promotedBy: string
): ModelVersion | null {
  const version = modelVersions.get(versionId);
  if (!version) return null;

  // Demote current production version if promoting to production
  if (targetStage === 'production') {
    const currentProd = getProductionVersion(version.modelName);
    if (currentProd && currentProd.id !== versionId) {
      currentProd.stage = 'archived';
      currentProd.metadata.updatedAt = new Date();
    }
  }

  version.stage = targetStage;
  version.metadata.updatedAt = new Date();

  return version;
}

/**
 * Update model metrics
 */
export function updateModelMetrics(
  versionId: string,
  metrics: Partial<ModelMetrics>
): ModelVersion | null {
  const version = modelVersions.get(versionId);
  if (!version) return null;

  version.metrics = { ...version.metrics, ...metrics };
  version.metadata.updatedAt = new Date();

  return version;
}

/**
 * Add artifact to model version
 */
export function addArtifact(
  versionId: string,
  artifact: ModelArtifact
): ModelVersion | null {
  const version = modelVersions.get(versionId);
  if (!version) return null;

  version.artifacts.push(artifact);
  version.metadata.updatedAt = new Date();

  return version;
}

// ============================================================================
// DEPLOYMENT MANAGEMENT
// ============================================================================

/**
 * Create a deployment
 */
export function createDeployment(
  modelVersionId: string,
  environment: 'staging' | 'production',
  trafficPercent: number = 100
): Deployment {
  const version = modelVersions.get(modelVersionId);
  if (!version) {
    throw new Error(`Model version ${modelVersionId} not found`);
  }

  const deployment: Deployment = {
    id: `deploy_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    modelVersionId,
    environment,
    status: 'pending',
    trafficPercent,
    startedAt: new Date(),
  };

  deployments.set(deployment.id, deployment);

  // Update model status
  version.status = 'deploying';

  return deployment;
}

/**
 * Update deployment status
 */
export function updateDeploymentStatus(
  deploymentId: string,
  status: Deployment['status']
): Deployment | null {
  const deployment = deployments.get(deploymentId);
  if (!deployment) return null;

  deployment.status = status;

  if (status === 'active' || status === 'failed' || status === 'rolled_back') {
    deployment.completedAt = new Date();
  }

  // Update model status
  const version = modelVersions.get(deployment.modelVersionId);
  if (version) {
    if (status === 'active') {
      version.status = 'deployed';
      version.stage = deployment.environment;
    } else if (status === 'failed') {
      version.status = 'failed';
    }
  }

  return deployment;
}

/**
 * Get active deployment for environment
 */
export function getActiveDeployment(
  modelName: string,
  environment: 'staging' | 'production'
): Deployment | undefined {
  const modelVersionIds = new Set(
    Array.from(modelVersions.values())
      .filter(v => v.modelName === modelName)
      .map(v => v.id)
  );

  return Array.from(deployments.values())
    .filter(d =>
      modelVersionIds.has(d.modelVersionId) &&
      d.environment === environment &&
      d.status === 'active'
    )[0];
}

/**
 * Rollback deployment
 */
export function rollbackDeployment(
  deploymentId: string,
  targetVersionId: string
): { oldDeployment: Deployment; newDeployment: Deployment } | null {
  const currentDeployment = deployments.get(deploymentId);
  if (!currentDeployment || currentDeployment.status !== 'active') {
    return null;
  }

  // Mark current as rolled back
  currentDeployment.status = 'rolled_back';
  currentDeployment.completedAt = new Date();

  // Create new deployment with previous version
  const newDeployment = createDeployment(
    targetVersionId,
    currentDeployment.environment,
    100
  );
  newDeployment.rollbackFromId = deploymentId;

  // Auto-activate
  updateDeploymentStatus(newDeployment.id, 'active');

  return {
    oldDeployment: currentDeployment,
    newDeployment,
  };
}

// ============================================================================
// A/B TESTING
// ============================================================================

/**
 * Create an A/B test
 */
export function createABTest(
  options: {
    name: string;
    description: string;
    controlVersionId: string;
    treatmentVersionId: string;
    trafficSplit: number;  // Percent for treatment (0-100)
    primaryMetric: string;
    secondaryMetrics?: string[];
  }
): ABTest {
  const test: ABTest = {
    id: `ab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: options.name,
    description: options.description,
    status: 'draft',
    variants: [
      {
        id: 'control',
        name: 'Control',
        modelVersionId: options.controlVersionId,
        trafficPercent: 100 - options.trafficSplit,
        isControl: true,
      },
      {
        id: 'treatment',
        name: 'Treatment',
        modelVersionId: options.treatmentVersionId,
        trafficPercent: options.trafficSplit,
        isControl: false,
      },
    ],
    startDate: new Date(),
    metrics: {
      primary: options.primaryMetric,
      secondary: options.secondaryMetrics || [],
    },
  };

  abTests.set(test.id, test);
  return test;
}

/**
 * Start an A/B test
 */
export function startABTest(testId: string): ABTest | null {
  const test = abTests.get(testId);
  if (!test || test.status !== 'draft') return null;

  test.status = 'running';
  test.startDate = new Date();

  return test;
}

/**
 * Complete an A/B test with results
 */
export function completeABTest(
  testId: string,
  results: ABTestResults
): ABTest | null {
  const test = abTests.get(testId);
  if (!test || test.status !== 'running') return null;

  test.status = 'completed';
  test.endDate = new Date();
  test.results = results;

  return test;
}

/**
 * Get variant for request (based on user hash)
 */
export function getABVariant(testId: string, userId: string): ABVariant | null {
  const test = abTests.get(testId);
  if (!test || test.status !== 'running') return null;

  // Simple hash-based assignment
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }

  const bucket = Math.abs(hash) % 100;
  let cumulative = 0;

  for (const variant of test.variants) {
    cumulative += variant.trafficPercent;
    if (bucket < cumulative) {
      return variant;
    }
  }

  return test.variants[0]; // Fallback to control
}

// ============================================================================
// LIFECYCLE SUMMARY
// ============================================================================

/**
 * Get model lifecycle summary
 */
export function getModelLifecycleSummary(modelName: string): {
  versions: number;
  stages: Record<ModelStage, number>;
  latestVersion?: ModelVersion;
  productionVersion?: ModelVersion;
  activeDeployments: number;
  runningTests: number;
} {
  const versions = getModelVersions(modelName);

  const stages: Record<ModelStage, number> = {
    development: 0,
    staging: 0,
    production: 0,
    archived: 0,
    deprecated: 0,
  };

  for (const v of versions) {
    stages[v.stage]++;
  }

  const versionIds = new Set(versions.map(v => v.id));

  const activeDeployments = Array.from(deployments.values())
    .filter(d => versionIds.has(d.modelVersionId) && d.status === 'active')
    .length;

  const runningTests = Array.from(abTests.values())
    .filter(t =>
      t.status === 'running' &&
      t.variants.some(v => versionIds.has(v.modelVersionId))
    )
    .length;

  return {
    versions: versions.length,
    stages,
    latestVersion: versions[0],
    productionVersion: getProductionVersion(modelName),
    activeDeployments,
    runningTests,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Version management
  registerModelVersion,
  getModelVersion,
  getModelVersions,
  getLatestVersion,
  getProductionVersion,
  promoteVersion,
  updateModelMetrics,
  addArtifact,

  // Deployment management
  createDeployment,
  updateDeploymentStatus,
  getActiveDeployment,
  rollbackDeployment,

  // A/B testing
  createABTest,
  startABTest,
  completeABTest,
  getABVariant,

  // Summary
  getModelLifecycleSummary,
};
