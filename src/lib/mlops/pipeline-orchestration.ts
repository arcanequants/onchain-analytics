/**
 * Pipeline Orchestration
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - DAG-based pipeline definition
 * - Step dependencies and execution
 * - Parallel execution
 * - Error handling and recovery
 * - Pipeline versioning
 * - Execution history
 */

// ============================================================================
// TYPES
// ============================================================================

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';
export type PipelineStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface StepInput {
  [key: string]: unknown;
}

export interface StepOutput {
  [key: string]: unknown;
}

export interface StepConfig<TInput = StepInput, TOutput = StepOutput> {
  id: string;
  name: string;
  description?: string;
  dependencies?: string[];
  executor: (input: TInput, context: ExecutionContext) => Promise<TOutput>;
  inputMapper?: (outputs: Map<string, StepOutput>) => TInput;
  retryConfig?: {
    maxRetries: number;
    delayMs: number;
    backoffMultiplier: number;
  };
  timeoutMs?: number;
  condition?: (outputs: Map<string, StepOutput>) => boolean;
  onStart?: (context: ExecutionContext) => void;
  onComplete?: (output: TOutput, context: ExecutionContext) => void;
  onError?: (error: Error, context: ExecutionContext) => void;
}

export interface StepExecution {
  stepId: string;
  status: StepStatus;
  startedAt: Date | null;
  completedAt: Date | null;
  duration: number | null;
  input: StepInput | null;
  output: StepOutput | null;
  error: string | null;
  retryCount: number;
  logs: LogEntry[];
}

export interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ExecutionContext {
  pipelineId: string;
  runId: string;
  stepId: string;
  startTime: Date;
  parameters: Record<string, unknown>;
  outputs: Map<string, StepOutput>;
  log: (level: LogEntry['level'], message: string, metadata?: Record<string, unknown>) => void;
  getOutput: <T = StepOutput>(stepId: string) => T | undefined;
  setMetadata: (key: string, value: unknown) => void;
}

export interface PipelineConfig {
  id: string;
  name: string;
  version: string;
  description?: string;
  steps: StepConfig[];
  parameters?: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object';
    default?: unknown;
    required?: boolean;
    description?: string;
  }>;
  triggers?: PipelineTrigger[];
  notifications?: NotificationConfig[];
  maxParallelSteps?: number;
  timeoutMs?: number;
}

export interface PipelineTrigger {
  type: 'schedule' | 'webhook' | 'event' | 'manual';
  config: Record<string, unknown>;
}

export interface NotificationConfig {
  channel: 'email' | 'slack' | 'webhook';
  events: ('start' | 'complete' | 'fail')[];
  recipients?: string[];
  webhookUrl?: string;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  pipelineVersion: string;
  status: PipelineStatus;
  parameters: Record<string, unknown>;
  steps: Map<string, StepExecution>;
  startedAt: Date;
  completedAt: Date | null;
  duration: number | null;
  triggeredBy: string;
  metadata: Record<string, unknown>;
}

export interface PipelineStats {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  avgDurationMs: number;
  stepStats: Map<string, {
    totalExecutions: number;
    successRate: number;
    avgDurationMs: number;
  }>;
}

// ============================================================================
// DAG BUILDER
// ============================================================================

class DAG {
  private nodes: Map<string, StepConfig> = new Map();
  private edges: Map<string, Set<string>> = new Map(); // node -> dependents

  addNode(step: StepConfig): void {
    this.nodes.set(step.id, step);
    if (!this.edges.has(step.id)) {
      this.edges.set(step.id, new Set());
    }
  }

  addEdge(from: string, to: string): void {
    if (!this.edges.has(from)) {
      this.edges.set(from, new Set());
    }
    this.edges.get(from)!.add(to);
  }

  getNode(id: string): StepConfig | undefined {
    return this.nodes.get(id);
  }

  getDependencies(id: string): string[] {
    const step = this.nodes.get(id);
    return step?.dependencies || [];
  }

  getDependents(id: string): string[] {
    const dependents: string[] = [];
    for (const [nodeId, step] of this.nodes.entries()) {
      if (step.dependencies?.includes(id)) {
        dependents.push(nodeId);
      }
    }
    return dependents;
  }

  /**
   * Get nodes ready to execute (all dependencies completed)
   */
  getReadyNodes(completedNodes: Set<string>): StepConfig[] {
    const ready: StepConfig[] = [];

    for (const [id, step] of this.nodes.entries()) {
      if (completedNodes.has(id)) continue;

      const deps = step.dependencies || [];
      const allDepsCompleted = deps.every(dep => completedNodes.has(dep));

      if (allDepsCompleted) {
        ready.push(step);
      }
    }

    return ready;
  }

  /**
   * Topological sort
   */
  topologicalSort(): StepConfig[] {
    const visited = new Set<string>();
    const result: StepConfig[] = [];

    const visit = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const step = this.nodes.get(id);
      if (step) {
        for (const dep of step.dependencies || []) {
          visit(dep);
        }
        result.push(step);
      }
    };

    for (const id of this.nodes.keys()) {
      visit(id);
    }

    return result;
  }

  /**
   * Validate DAG (check for cycles)
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for missing dependencies
    for (const [id, step] of this.nodes.entries()) {
      for (const dep of step.dependencies || []) {
        if (!this.nodes.has(dep)) {
          errors.push(`Step "${id}" depends on non-existent step "${dep}"`);
        }
      }
    }

    // Check for cycles using DFS
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const colors = new Map<string, number>();

    for (const id of this.nodes.keys()) {
      colors.set(id, WHITE);
    }

    const hasCycle = (id: string): boolean => {
      colors.set(id, GRAY);

      const step = this.nodes.get(id);
      for (const dep of step?.dependencies || []) {
        if (colors.get(dep) === GRAY) {
          errors.push(`Cycle detected involving steps "${id}" and "${dep}"`);
          return true;
        }
        if (colors.get(dep) === WHITE && hasCycle(dep)) {
          return true;
        }
      }

      colors.set(id, BLACK);
      return false;
    };

    for (const id of this.nodes.keys()) {
      if (colors.get(id) === WHITE) {
        if (hasCycle(id)) break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getNodes(): StepConfig[] {
    return [...this.nodes.values()];
  }
}

// ============================================================================
// PIPELINE EXECUTOR
// ============================================================================

export class PipelineExecutor {
  private pipelines: Map<string, PipelineConfig> = new Map();
  private runs: Map<string, PipelineRun> = new Map();
  private activeRuns: Set<string> = new Set();

  /**
   * Generate run ID
   */
  private generateRunId(): string {
    return `run_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Register a pipeline
   */
  registerPipeline(config: PipelineConfig): void {
    // Validate pipeline
    const dag = new DAG();
    for (const step of config.steps) {
      dag.addNode(step);
    }
    const validation = dag.validate();
    if (!validation.valid) {
      throw new Error(`Invalid pipeline: ${validation.errors.join(', ')}`);
    }

    this.pipelines.set(config.id, config);
  }

  /**
   * Get pipeline by ID
   */
  getPipeline(id: string): PipelineConfig | undefined {
    return this.pipelines.get(id);
  }

  /**
   * Start pipeline execution
   */
  async execute(
    pipelineId: string,
    parameters?: Record<string, unknown>,
    triggeredBy: string = 'manual'
  ): Promise<PipelineRun> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    // Validate and apply default parameters
    const resolvedParams = this.resolveParameters(pipeline, parameters || {});

    // Create run
    const runId = this.generateRunId();
    const run: PipelineRun = {
      id: runId,
      pipelineId,
      pipelineVersion: pipeline.version,
      status: 'running',
      parameters: resolvedParams,
      steps: new Map(),
      startedAt: new Date(),
      completedAt: null,
      duration: null,
      triggeredBy,
      metadata: {},
    };

    // Initialize step executions
    for (const step of pipeline.steps) {
      run.steps.set(step.id, {
        stepId: step.id,
        status: 'pending',
        startedAt: null,
        completedAt: null,
        duration: null,
        input: null,
        output: null,
        error: null,
        retryCount: 0,
        logs: [],
      });
    }

    this.runs.set(runId, run);
    this.activeRuns.add(runId);

    // Execute pipeline
    try {
      await this.executePipeline(pipeline, run);
      run.status = 'completed';
    } catch (error) {
      run.status = 'failed';
      throw error;
    } finally {
      run.completedAt = new Date();
      run.duration = run.completedAt.getTime() - run.startedAt.getTime();
      this.activeRuns.delete(runId);
    }

    return run;
  }

  /**
   * Execute pipeline steps
   */
  private async executePipeline(
    pipeline: PipelineConfig,
    run: PipelineRun
  ): Promise<void> {
    const dag = new DAG();
    for (const step of pipeline.steps) {
      dag.addNode(step);
    }

    const completedSteps = new Set<string>();
    const failedSteps = new Set<string>();
    const outputs = new Map<string, StepOutput>();
    const maxParallel = pipeline.maxParallelSteps ?? 4;

    while (completedSteps.size + failedSteps.size < pipeline.steps.length) {
      const readySteps = dag.getReadyNodes(new Set([...completedSteps, ...failedSteps]))
        .filter(step => {
          const execution = run.steps.get(step.id);
          return execution?.status === 'pending';
        });

      if (readySteps.length === 0) {
        // Check if we're stuck due to failed dependencies
        const pendingSteps = [...run.steps.values()].filter(s => s.status === 'pending');
        if (pendingSteps.length > 0) {
          for (const pending of pendingSteps) {
            const step = dag.getNode(pending.stepId);
            const hasFailed = step?.dependencies?.some(d => failedSteps.has(d));
            if (hasFailed) {
              pending.status = 'skipped';
              failedSteps.add(pending.stepId);
            }
          }
        }
        break;
      }

      // Execute ready steps in parallel (up to max)
      const batch = readySteps.slice(0, maxParallel);
      const promises = batch.map(step =>
        this.executeStep(step, run, outputs).then(result => {
          if (result.success) {
            completedSteps.add(step.id);
            if (result.output) {
              outputs.set(step.id, result.output);
            }
          } else {
            failedSteps.add(step.id);
          }
        })
      );

      await Promise.all(promises);

      // Check for pipeline-level failure
      if (failedSteps.size > 0) {
        const criticalFailure = [...failedSteps].some(stepId => {
          const step = dag.getNode(stepId);
          return dag.getDependents(stepId).length > 0;
        });
        if (criticalFailure) {
          throw new Error(`Pipeline failed due to step failures: ${[...failedSteps].join(', ')}`);
        }
      }
    }
  }

  /**
   * Execute single step
   */
  private async executeStep(
    step: StepConfig,
    run: PipelineRun,
    outputs: Map<string, StepOutput>
  ): Promise<{ success: boolean; output?: StepOutput }> {
    const execution = run.steps.get(step.id)!;
    execution.status = 'running';
    execution.startedAt = new Date();

    // Create context
    const context: ExecutionContext = {
      pipelineId: run.pipelineId,
      runId: run.id,
      stepId: step.id,
      startTime: execution.startedAt,
      parameters: run.parameters,
      outputs,
      log: (level, message, metadata) => {
        execution.logs.push({
          timestamp: new Date(),
          level,
          message,
          metadata,
        });
      },
      getOutput: <T>(stepId: string) => outputs.get(stepId) as T | undefined,
      setMetadata: (key, value) => {
        run.metadata[`${step.id}.${key}`] = value;
      },
    };

    // Check condition
    if (step.condition && !step.condition(outputs)) {
      execution.status = 'skipped';
      execution.completedAt = new Date();
      execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();
      return { success: true };
    }

    // Map input
    const input = step.inputMapper
      ? step.inputMapper(outputs)
      : { ...run.parameters } as StepInput;

    execution.input = input;

    // Execute with retries
    const maxRetries = step.retryConfig?.maxRetries ?? 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      execution.retryCount = attempt;

      try {
        step.onStart?.(context);

        // Execute with timeout
        const output = await this.executeWithTimeout(
          () => step.executor(input, context),
          step.timeoutMs ?? 300000 // 5 minutes default
        );

        execution.status = 'completed';
        execution.output = output;
        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

        step.onComplete?.(output, context);

        return { success: true, output };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        execution.error = lastError.message;

        step.onError?.(lastError, context);

        if (attempt < maxRetries) {
          const delay = (step.retryConfig?.delayMs ?? 1000) *
            Math.pow(step.retryConfig?.backoffMultiplier ?? 2, attempt);
          await this.sleep(delay);
        }
      }
    }

    execution.status = 'failed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

    return { success: false };
  }

  /**
   * Execute with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Step timeout')), timeoutMs)
      ),
    ]);
  }

  /**
   * Resolve parameters with defaults
   */
  private resolveParameters(
    pipeline: PipelineConfig,
    provided: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [name, config] of Object.entries(pipeline.parameters ?? {})) {
      if (provided[name] !== undefined) {
        resolved[name] = provided[name];
      } else if (config.default !== undefined) {
        resolved[name] = config.default;
      } else if (config.required) {
        throw new Error(`Required parameter missing: ${name}`);
      }
    }

    // Include any extra parameters
    for (const [name, value] of Object.entries(provided)) {
      if (!(name in resolved)) {
        resolved[name] = value;
      }
    }

    return resolved;
  }

  /**
   * Cancel running pipeline
   */
  async cancel(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    if (run.status === 'running') {
      run.status = 'cancelled';
      run.completedAt = new Date();
      run.duration = run.completedAt.getTime() - run.startedAt.getTime();

      for (const execution of run.steps.values()) {
        if (execution.status === 'running' || execution.status === 'pending') {
          execution.status = 'cancelled';
          execution.completedAt = new Date();
        }
      }

      this.activeRuns.delete(runId);
    }
  }

  /**
   * Get run by ID
   */
  getRun(runId: string): PipelineRun | undefined {
    return this.runs.get(runId);
  }

  /**
   * Get runs for pipeline
   */
  getRunsForPipeline(pipelineId: string, limit: number = 10): PipelineRun[] {
    return [...this.runs.values()]
      .filter(r => r.pipelineId === pipelineId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get pipeline statistics
   */
  getStats(pipelineId: string): PipelineStats {
    const runs = this.getRunsForPipeline(pipelineId, 100);

    const stepStats = new Map<string, {
      totalExecutions: number;
      successCount: number;
      totalDuration: number;
    }>();

    let totalDuration = 0;
    let successfulRuns = 0;

    for (const run of runs) {
      if (run.duration) {
        totalDuration += run.duration;
      }
      if (run.status === 'completed') {
        successfulRuns++;
      }

      for (const [stepId, execution] of run.steps.entries()) {
        if (!stepStats.has(stepId)) {
          stepStats.set(stepId, {
            totalExecutions: 0,
            successCount: 0,
            totalDuration: 0,
          });
        }
        const stats = stepStats.get(stepId)!;
        stats.totalExecutions++;
        if (execution.status === 'completed') {
          stats.successCount++;
        }
        if (execution.duration) {
          stats.totalDuration += execution.duration;
        }
      }
    }

    const stepStatsResult = new Map<string, {
      totalExecutions: number;
      successRate: number;
      avgDurationMs: number;
    }>();

    for (const [stepId, stats] of stepStats.entries()) {
      stepStatsResult.set(stepId, {
        totalExecutions: stats.totalExecutions,
        successRate: stats.totalExecutions > 0
          ? stats.successCount / stats.totalExecutions
          : 0,
        avgDurationMs: stats.totalExecutions > 0
          ? stats.totalDuration / stats.totalExecutions
          : 0,
      });
    }

    return {
      totalRuns: runs.length,
      successfulRuns,
      failedRuns: runs.length - successfulRuns,
      avgDurationMs: runs.length > 0 ? totalDuration / runs.length : 0,
      stepStats: stepStatsResult,
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// PIPELINE BUILDER (Fluent API)
// ============================================================================

export class PipelineBuilder {
  private config: Partial<PipelineConfig> = {
    steps: [],
    parameters: {},
  };

  constructor(id: string, name: string) {
    this.config.id = id;
    this.config.name = name;
    this.config.version = '1.0.0';
  }

  version(v: string): this {
    this.config.version = v;
    return this;
  }

  description(desc: string): this {
    this.config.description = desc;
    return this;
  }

  parameter(
    name: string,
    type: 'string' | 'number' | 'boolean' | 'object',
    options?: { default?: unknown; required?: boolean; description?: string }
  ): this {
    this.config.parameters![name] = {
      type,
      ...options,
    };
    return this;
  }

  step<TInput = StepInput, TOutput = StepOutput>(
    id: string,
    name: string,
    executor: StepConfig<TInput, TOutput>['executor'],
    options?: Partial<StepConfig<TInput, TOutput>>
  ): this {
    this.config.steps!.push({
      id,
      name,
      executor: executor as unknown as StepConfig['executor'],
      ...options,
    } as StepConfig);
    return this;
  }

  maxParallel(n: number): this {
    this.config.maxParallelSteps = n;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeoutMs = ms;
    return this;
  }

  build(): PipelineConfig {
    if (!this.config.id || !this.config.name) {
      throw new Error('Pipeline must have id and name');
    }
    return this.config as PipelineConfig;
  }
}

// ============================================================================
// FACTORY
// ============================================================================

let defaultExecutor: PipelineExecutor | null = null;

/**
 * Get default executor
 */
export function getDefaultExecutor(): PipelineExecutor {
  if (!defaultExecutor) {
    defaultExecutor = new PipelineExecutor();
  }
  return defaultExecutor;
}

/**
 * Reset executor (for testing)
 */
export function resetExecutor(): void {
  defaultExecutor = null;
}

/**
 * Create pipeline builder
 */
export function createPipeline(id: string, name: string): PipelineBuilder {
  return new PipelineBuilder(id, name);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  PipelineExecutor,
  PipelineBuilder,
  DAG,
  createPipeline,
  getDefaultExecutor,
  resetExecutor,
};
