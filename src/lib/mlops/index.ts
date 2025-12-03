/**
 * MLOps Module Index
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Provides:
 * - Model lifecycle management
 * - SLO dashboard and monitoring
 * - Embedding store (pgvector)
 * - Semantic cache
 * - Request coalescing
 * - Pipeline orchestration
 * - Dead letter queue
 * - ML observability dashboard
 */

// ============================================================================
// MODEL LIFECYCLE
// ============================================================================

export {
  registerModelVersion,
  getModelVersion,
  getModelVersions,
  getLatestVersion,
  getProductionVersion,
  promoteVersion,
  updateModelMetrics,
  addArtifact,
  createDeployment,
  updateDeploymentStatus,
  getActiveDeployment,
  rollbackDeployment,
  createABTest,
  startABTest,
  completeABTest,
  getABVariant,
  getModelLifecycleSummary,
} from './model-lifecycle';

export type {
  ModelStage,
  ModelStatus,
  ModelVersion,
  ModelConfig,
  ModelMetrics,
  ModelArtifact,
  Deployment,
  ABTest,
  ABVariant,
  ABTestResults,
} from './model-lifecycle';

// ============================================================================
// SLO DASHBOARD
// ============================================================================

export {
  recordSLI,
  recordEvent,
  calculateSLOStatus,
  generateSLOReport,
  getDashboardSummary,
  getActiveAlerts as getSLOAlerts,
  acknowledgeAlert as acknowledgeSLOAlert,
  resolveAlert as resolveSLOAlert,
  upsertSLO,
  getAllSLOs,
  getSLO,
  DEFAULT_SLOS,
} from './slo-dashboard';

export type {
  SLOType,
  SLOWindow,
  SLODefinition,
  SLI,
  SLOStatus,
  SLOAlert,
  SLOReport,
} from './slo-dashboard';

// ============================================================================
// EMBEDDING STORE
// ============================================================================

export {
  createEmbeddingStore,
  getDefaultStore,
  resetDefaultStore,
  pgvectorSQL,
  normalizeVector,
  calculateCentroid,
  randomProjection,
  quantizeVector,
  dequantizeVector,
} from './embedding-store';

export type {
  DistanceMetric,
  IndexType,
  EmbeddingVector,
  EmbeddingInput,
  SearchResult,
  SearchOptions,
  MetadataFilter,
  StoreConfig,
  IndexStats,
  EmbeddingStore,
} from './embedding-store';

// ============================================================================
// SEMANTIC CACHE
// ============================================================================

export {
  SemanticCache,
  PromptCache,
  createCachedFunction,
  getDefaultCache,
  getDefaultPromptCache,
  resetCaches,
} from './semantic-cache';

export type {
  CacheEntry,
  CacheMetadata,
  CacheConfig,
  CacheStats,
  CacheHit,
  CacheMiss,
  CacheLookupResult,
  PromptCacheEntry,
  CachedFunction,
} from './semantic-cache';

// ============================================================================
// REQUEST COALESCING
// ============================================================================

export {
  ModelServer,
  createModelServer,
  PriorityQueue,
  CircuitBreaker,
  RequestCoalescer,
  LoadBalancer,
} from './request-coalescing';

export type {
  Priority,
  CircuitState,
  ModelEndpoint,
  Request,
  Response,
  CoalescingConfig,
  CircuitBreakerConfig,
  ServingConfig,
  ModelServerStats,
} from './request-coalescing';

// ============================================================================
// PIPELINE ORCHESTRATION
// ============================================================================

export {
  PipelineExecutor,
  PipelineBuilder,
  createPipeline,
  getDefaultExecutor,
  resetExecutor,
} from './pipeline-orchestration';

export type {
  StepStatus,
  PipelineStatus,
  StepInput,
  StepOutput,
  StepConfig,
  StepExecution,
  LogEntry,
  ExecutionContext,
  PipelineConfig,
  PipelineTrigger,
  NotificationConfig,
  PipelineRun,
  PipelineStats,
} from './pipeline-orchestration';

// ============================================================================
// DEAD LETTER QUEUE
// ============================================================================

export {
  DeadLetterQueue,
  RetryProcessor,
  createDLQ,
  getDefaultDLQ,
  resetDLQ,
} from './dead-letter-queue';

export type {
  MessageStatus,
  FailureReason,
  DeadLetterMessage,
  FailureHistory,
  DLQConfig,
  DLQStats,
  ReplayOptions,
  ReplayResult,
} from './dead-letter-queue';

// ============================================================================
// ML OBSERVABILITY DASHBOARD
// ============================================================================

export {
  MLObservabilityDashboard,
  MetricsCollector,
  DriftDetector,
  AlertManager,
  createDashboard,
  getDefaultDashboard,
  resetDashboard,
} from './ml-observability-dashboard';

export type {
  MetricType,
  AlertSeverity,
  AlertStatus,
  Metric,
  HistogramBucket,
  HistogramMetric,
  ModelMetrics as ObservabilityModelMetrics,
  FeatureDistribution,
  DriftResult,
  PredictionDistribution,
  Alert,
  AlertRule,
  DashboardConfig,
} from './ml-observability-dashboard';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

import {
  registerModelVersion,
  getProductionVersion,
  createDeployment,
  updateDeploymentStatus,
  getModelLifecycleSummary,
} from './model-lifecycle';

import {
  recordEvent,
  generateSLOReport,
  getDashboardSummary,
} from './slo-dashboard';

import { getDefaultStore } from './embedding-store';
import { getDefaultCache, getDefaultPromptCache } from './semantic-cache';
import { createModelServer } from './request-coalescing';
import { getDefaultExecutor, createPipeline } from './pipeline-orchestration';
import { getDefaultDLQ } from './dead-letter-queue';
import { getDefaultDashboard } from './ml-observability-dashboard';

/**
 * Quick model deployment
 */
export async function quickDeploy(
  modelName: string,
  version: string,
  provider: string,
  environment: 'staging' | 'production' = 'staging'
): Promise<{ versionId: string; deploymentId: string }> {
  const modelVersion = registerModelVersion({
    modelName,
    version,
    provider,
    config: { temperature: 0.7, maxTokens: 2048 },
    createdBy: 'system',
  });

  const deployment = createDeployment(modelVersion.id, environment);
  updateDeploymentStatus(deployment.id, 'active');

  return {
    versionId: modelVersion.id,
    deploymentId: deployment.id,
  };
}

/**
 * Get overall MLOps health
 */
export function getMLOpsHealth(): {
  models: { total: number; inProduction: number };
  slos: { healthy: number; atRisk: number; violated: number };
  alerts: number;
  cache: { entries: number; hitRate: number };
  dlq: { pending: number; exhausted: number };
} {
  const sloSummary = getDashboardSummary();
  const cacheStats = getDefaultCache().getStats();
  const dlqStats = getDefaultDLQ().getStats();

  return {
    models: {
      total: 0, // Would query model registry
      inProduction: 0,
    },
    slos: {
      healthy: sloSummary.healthySLOs,
      atRisk: sloSummary.atRiskSLOs,
      violated: sloSummary.violatedSLOs,
    },
    alerts: sloSummary.activeAlerts,
    cache: {
      entries: cacheStats.totalEntries,
      hitRate: cacheStats.hitRate,
    },
    dlq: {
      pending: dlqStats.pendingMessages,
      exhausted: dlqStats.exhaustedMessages,
    },
  };
}

/**
 * Create ML pipeline with defaults
 */
export function createMLPipeline(id: string, name: string) {
  return createPipeline(id, name)
    .parameter('model', 'string', { required: true })
    .parameter('version', 'string', { default: 'latest' })
    .maxParallel(4)
    .timeout(3600000); // 1 hour
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Model lifecycle
  registerModelVersion,
  getProductionVersion,
  createDeployment,
  getModelLifecycleSummary,

  // SLO
  recordEvent,
  generateSLOReport,
  getDashboardSummary,

  // Embedding store
  getDefaultStore,

  // Semantic cache
  getDefaultCache,
  getDefaultPromptCache,

  // Request coalescing
  createModelServer,

  // Pipeline orchestration
  getDefaultExecutor,
  createPipeline,
  createMLPipeline,

  // Dead letter queue
  getDefaultDLQ,

  // ML observability
  getDefaultDashboard,

  // Convenience
  quickDeploy,
  getMLOpsHealth,
};
