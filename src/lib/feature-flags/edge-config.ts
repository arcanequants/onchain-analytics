/**
 * Vercel Edge Config Feature Flags
 *
 * Phase 4, Week 8 - Dev Checklist
 *
 * Provides feature flag management using Vercel Edge Config for:
 * - Low-latency flag reads at the edge
 * - Real-time flag updates without redeploy
 * - Centralized flag management
 * - Targeting rules and gradual rollouts
 *
 * @see https://vercel.com/docs/storage/edge-config
 */

import { createClient, EdgeConfigClient } from '@vercel/edge-config';

// ============================================================================
// TYPES
// ============================================================================

export type FlagEnvironment = 'development' | 'preview' | 'production';

export type TargetingOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'in_list'
  | 'not_in_list'
  | 'greater_than'
  | 'less_than'
  | 'regex';

export interface TargetingCondition {
  /** Attribute to evaluate (e.g., 'userId', 'email', 'plan', 'country') */
  attribute: string;
  /** Comparison operator */
  operator: TargetingOperator;
  /** Value to compare against */
  value: string | number | string[];
}

export interface TargetingRule {
  /** Rule identifier */
  id: string;
  /** Rule name for display */
  name: string;
  /** Conditions to evaluate (AND logic) */
  conditions: TargetingCondition[];
  /** Value to return if rule matches */
  value: boolean | string | number;
  /** Rollout percentage for this rule (0-100) */
  rolloutPercentage?: number;
  /** Priority (lower = higher priority) */
  priority: number;
}

export interface EdgeFeatureFlag {
  /** Flag key/identifier */
  key: string;
  /** Human-readable name */
  name: string;
  /** Description of the flag */
  description: string;
  /** Flag type */
  type: 'boolean' | 'string' | 'number' | 'json';
  /** Default value when no rules match */
  defaultValue: boolean | string | number | Record<string, unknown>;
  /** Targeting rules (evaluated in priority order) */
  rules: TargetingRule[];
  /** Environments where flag is active */
  environments: FlagEnvironment[];
  /** Global rollout percentage (0-100) */
  rolloutPercentage: number;
  /** Whether flag is enabled globally */
  enabled: boolean;
  /** Tags for organization */
  tags: string[];
  /** Owner/team responsible */
  owner: string;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
}

export interface FlagEvaluationContext {
  /** User identifier for consistent rollout */
  userId?: string;
  /** User email */
  email?: string;
  /** User's subscription plan */
  plan?: 'free' | 'starter' | 'pro' | 'enterprise';
  /** User's country code */
  country?: string;
  /** User's device type */
  device?: 'mobile' | 'tablet' | 'desktop';
  /** Custom attributes */
  attributes?: Record<string, string | number | boolean>;
}

export interface FlagEvaluationResult<T = boolean | string | number> {
  /** The evaluated value */
  value: T;
  /** Source of the value */
  source: 'rule' | 'rollout' | 'default' | 'disabled' | 'environment';
  /** Rule ID that matched (if any) */
  ruleId?: string;
  /** Whether user is in rollout */
  inRollout: boolean;
  /** Evaluation timestamp */
  evaluatedAt: string;
}

// ============================================================================
// EDGE CONFIG CLIENT
// ============================================================================

let edgeConfigClient: EdgeConfigClient | null = null;

/**
 * Get or create Edge Config client
 */
function getEdgeConfigClient(): EdgeConfigClient | null {
  if (edgeConfigClient) return edgeConfigClient;

  const connectionString = process.env.EDGE_CONFIG;
  if (!connectionString) {
    console.warn('[EdgeConfig] EDGE_CONFIG environment variable not set');
    return null;
  }

  try {
    edgeConfigClient = createClient(connectionString);
    return edgeConfigClient;
  } catch (error) {
    console.error('[EdgeConfig] Failed to create client:', error);
    return null;
  }
}

// ============================================================================
// HASH FUNCTION FOR ROLLOUT
// ============================================================================

/**
 * FNV-1a hash for consistent rollout bucketing
 * More uniform distribution than simple modulo
 */
function fnv1aHash(str: string): number {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619); // FNV prime
  }
  return hash >>> 0; // Convert to unsigned 32-bit
}

/**
 * Check if identifier is within rollout percentage
 */
function isInRollout(identifier: string, percentage: number, salt: string = ''): boolean {
  if (percentage >= 100) return true;
  if (percentage <= 0) return false;

  const hash = fnv1aHash(`${salt}:${identifier}`);
  const bucket = (hash % 10000) / 100; // 0-99.99
  return bucket < percentage;
}

// ============================================================================
// TARGETING EVALUATION
// ============================================================================

/**
 * Evaluate a single targeting condition
 */
function evaluateCondition(
  condition: TargetingCondition,
  context: FlagEvaluationContext
): boolean {
  // Get the attribute value from context
  let attributeValue: string | number | boolean | undefined;

  if (condition.attribute in context) {
    attributeValue = context[condition.attribute as keyof FlagEvaluationContext] as string | number | boolean;
  } else if (context.attributes && condition.attribute in context.attributes) {
    attributeValue = context.attributes[condition.attribute];
  }

  // Handle undefined attribute
  if (attributeValue === undefined) {
    return condition.operator === 'not_equals' || condition.operator === 'not_contains';
  }

  const attrStr = String(attributeValue);
  const valueStr = Array.isArray(condition.value) ? '' : String(condition.value);

  switch (condition.operator) {
    case 'equals':
      return attrStr === valueStr;
    case 'not_equals':
      return attrStr !== valueStr;
    case 'contains':
      return attrStr.includes(valueStr);
    case 'not_contains':
      return !attrStr.includes(valueStr);
    case 'starts_with':
      return attrStr.startsWith(valueStr);
    case 'ends_with':
      return attrStr.endsWith(valueStr);
    case 'in_list':
      return Array.isArray(condition.value) && condition.value.includes(attrStr);
    case 'not_in_list':
      return !Array.isArray(condition.value) || !condition.value.includes(attrStr);
    case 'greater_than':
      return Number(attributeValue) > Number(condition.value);
    case 'less_than':
      return Number(attributeValue) < Number(condition.value);
    case 'regex':
      try {
        return new RegExp(valueStr).test(attrStr);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Evaluate targeting rules and return matching rule
 */
function evaluateRules(
  rules: TargetingRule[],
  context: FlagEvaluationContext
): { rule: TargetingRule; inRollout: boolean } | null {
  // Sort by priority
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of sortedRules) {
    // Check if all conditions match (AND logic)
    const allConditionsMatch = rule.conditions.every(cond =>
      evaluateCondition(cond, context)
    );

    if (allConditionsMatch) {
      // Check rollout percentage for this rule
      const rolloutPct = rule.rolloutPercentage ?? 100;
      const identifier = context.userId || context.email || 'anonymous';
      const inRollout = isInRollout(identifier, rolloutPct, rule.id);

      if (inRollout) {
        return { rule, inRollout: true };
      }
    }
  }

  return null;
}

// ============================================================================
// MAIN API
// ============================================================================

/**
 * Edge Feature Flags service
 */
export class EdgeFeatureFlags {
  private cache: Map<string, { flag: EdgeFeatureFlag; expiresAt: number }> = new Map();
  private cacheTTL: number = 30000; // 30 seconds cache

  /**
   * Get a feature flag from Edge Config
   */
  async getFlag(key: string): Promise<EdgeFeatureFlag | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.flag;
    }

    const client = getEdgeConfigClient();
    if (!client) {
      return null;
    }

    try {
      const flag = await client.get<EdgeFeatureFlag>(`feature_flag:${key}`);

      if (flag) {
        this.cache.set(key, {
          flag,
          expiresAt: Date.now() + this.cacheTTL,
        });
      }

      return flag || null;
    } catch (error) {
      console.error(`[EdgeConfig] Failed to get flag ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all feature flags
   */
  async getAllFlags(): Promise<EdgeFeatureFlag[]> {
    const client = getEdgeConfigClient();
    if (!client) {
      return [];
    }

    try {
      const allItems = await client.getAll<Record<string, EdgeFeatureFlag>>();
      const flags: EdgeFeatureFlag[] = [];

      for (const [key, value] of Object.entries(allItems || {})) {
        if (key.startsWith('feature_flag:') && value) {
          flags.push(value);
        }
      }

      return flags;
    } catch (error) {
      console.error('[EdgeConfig] Failed to get all flags:', error);
      return [];
    }
  }

  /**
   * Evaluate a feature flag for a given context
   */
  async evaluate<T extends boolean | string | number = boolean>(
    key: string,
    context: FlagEvaluationContext = {}
  ): Promise<FlagEvaluationResult<T>> {
    const now = new Date().toISOString();

    // Get the flag
    const flag = await this.getFlag(key);

    // Flag not found - return false
    if (!flag) {
      return {
        value: false as T,
        source: 'disabled',
        inRollout: false,
        evaluatedAt: now,
      };
    }

    // Check if flag is globally disabled
    if (!flag.enabled) {
      return {
        value: flag.defaultValue as T,
        source: 'disabled',
        inRollout: false,
        evaluatedAt: now,
      };
    }

    // Check environment
    const currentEnv = this.getCurrentEnvironment();
    if (!flag.environments.includes(currentEnv)) {
      return {
        value: flag.defaultValue as T,
        source: 'environment',
        inRollout: false,
        evaluatedAt: now,
      };
    }

    // Evaluate targeting rules
    const ruleMatch = evaluateRules(flag.rules, context);
    if (ruleMatch) {
      return {
        value: ruleMatch.rule.value as T,
        source: 'rule',
        ruleId: ruleMatch.rule.id,
        inRollout: ruleMatch.inRollout,
        evaluatedAt: now,
      };
    }

    // Check global rollout
    const identifier = context.userId || context.email || 'anonymous';
    const inRollout = isInRollout(identifier, flag.rolloutPercentage, key);

    if (!inRollout) {
      return {
        value: flag.defaultValue as T,
        source: 'rollout',
        inRollout: false,
        evaluatedAt: now,
      };
    }

    // Return default value for users in rollout
    return {
      value: flag.defaultValue as T,
      source: 'default',
      inRollout: true,
      evaluatedAt: now,
    };
  }

  /**
   * Simple boolean check
   */
  async isEnabled(key: string, context?: FlagEvaluationContext): Promise<boolean> {
    const result = await this.evaluate<boolean>(key, context);
    return result.value === true;
  }

  /**
   * Get current environment
   */
  private getCurrentEnvironment(): FlagEnvironment {
    const vercelEnv = process.env.VERCEL_ENV;
    if (vercelEnv === 'production') return 'production';
    if (vercelEnv === 'preview') return 'preview';
    return 'development';
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set cache TTL
   */
  setCacheTTL(ms: number): void {
    this.cacheTTL = ms;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let edgeFlagsInstance: EdgeFeatureFlags | null = null;

/**
 * Get the default Edge Feature Flags instance
 */
export function getEdgeFlags(): EdgeFeatureFlags {
  if (!edgeFlagsInstance) {
    edgeFlagsInstance = new EdgeFeatureFlags();
  }
  return edgeFlagsInstance;
}

/**
 * Reset the Edge Feature Flags instance (for testing)
 */
export function resetEdgeFlags(): void {
  edgeFlagsInstance = null;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Check if a feature flag is enabled
 */
export async function isEdgeFlagEnabled(
  key: string,
  context?: FlagEvaluationContext
): Promise<boolean> {
  return getEdgeFlags().isEnabled(key, context);
}

/**
 * Evaluate a feature flag
 */
export async function evaluateEdgeFlag<T extends boolean | string | number = boolean>(
  key: string,
  context?: FlagEvaluationContext
): Promise<FlagEvaluationResult<T>> {
  return getEdgeFlags().evaluate<T>(key, context);
}

// ============================================================================
// DEFAULT FLAG DEFINITIONS (for initialization)
// ============================================================================

/**
 * Default feature flags for the application
 * These should be synced to Edge Config during deployment
 */
export const DEFAULT_EDGE_FLAGS: Omit<EdgeFeatureFlag, 'createdAt' | 'updatedAt'>[] = [
  {
    key: 'new_scoring_algorithm',
    name: 'New Scoring Algorithm',
    description: 'Use v2 scoring algorithm with improved accuracy',
    type: 'boolean',
    defaultValue: false,
    rules: [
      {
        id: 'internal-users',
        name: 'Internal Users',
        conditions: [
          { attribute: 'email', operator: 'ends_with', value: '@aiperception.com' }
        ],
        value: true,
        priority: 1,
      },
    ],
    environments: ['development', 'preview'],
    rolloutPercentage: 0,
    enabled: true,
    tags: ['analysis', 'scoring'],
    owner: 'engineering',
  },
  {
    key: 'parallel_provider_queries',
    name: 'Parallel Provider Queries',
    description: 'Query AI providers in parallel instead of sequentially',
    type: 'boolean',
    defaultValue: true,
    rules: [],
    environments: ['development', 'preview', 'production'],
    rolloutPercentage: 100,
    enabled: true,
    tags: ['performance'],
    owner: 'engineering',
  },
  {
    key: 'show_beta_features',
    name: 'Beta Features',
    description: 'Show beta features in the UI',
    type: 'boolean',
    defaultValue: false,
    rules: [
      {
        id: 'pro-users',
        name: 'Pro Users',
        conditions: [
          { attribute: 'plan', operator: 'in_list', value: ['pro', 'enterprise'] }
        ],
        value: true,
        rolloutPercentage: 50,
        priority: 1,
      },
    ],
    environments: ['development', 'preview'],
    rolloutPercentage: 0,
    enabled: true,
    tags: ['ui', 'beta'],
    owner: 'product',
  },
  {
    key: 'aggressive_caching',
    name: 'Aggressive Caching',
    description: 'Enable aggressive caching for API responses',
    type: 'boolean',
    defaultValue: false,
    rules: [],
    environments: ['production'],
    rolloutPercentage: 25,
    enabled: true,
    tags: ['performance', 'caching'],
    owner: 'engineering',
  },
  {
    key: 'strict_rate_limiting',
    name: 'Strict Rate Limiting',
    description: 'Enable stricter rate limiting for abuse prevention',
    type: 'boolean',
    defaultValue: false,
    rules: [
      {
        id: 'free-users',
        name: 'Free Users',
        conditions: [
          { attribute: 'plan', operator: 'equals', value: 'free' }
        ],
        value: true,
        priority: 1,
      },
    ],
    environments: ['production'],
    rolloutPercentage: 100,
    enabled: true,
    tags: ['security', 'rate-limiting'],
    owner: 'security',
  },
  {
    key: 'ai_fallback_chain',
    name: 'AI Fallback Chain',
    description: 'Enable fallback chain when primary AI provider fails',
    type: 'boolean',
    defaultValue: true,
    rules: [],
    environments: ['development', 'preview', 'production'],
    rolloutPercentage: 100,
    enabled: true,
    tags: ['reliability', 'ai'],
    owner: 'engineering',
  },
  {
    key: 'self_consistency_voting',
    name: 'Self-Consistency Voting',
    description: 'Enable 3-sample majority voting for critical queries',
    type: 'boolean',
    defaultValue: false,
    rules: [
      {
        id: 'enterprise-users',
        name: 'Enterprise Users',
        conditions: [
          { attribute: 'plan', operator: 'equals', value: 'enterprise' }
        ],
        value: true,
        priority: 1,
      },
    ],
    environments: ['production'],
    rolloutPercentage: 10,
    enabled: true,
    tags: ['quality', 'ai'],
    owner: 'engineering',
  },
  {
    key: 'multi_run_sampling',
    name: 'Multi-Run Sampling',
    description: 'Run analysis multiple times and aggregate results',
    type: 'boolean',
    defaultValue: false,
    rules: [],
    environments: ['development', 'preview', 'production'],
    rolloutPercentage: 5,
    enabled: true,
    tags: ['quality', 'ai'],
    owner: 'engineering',
  },
  {
    key: 'dark_mode',
    name: 'Dark Mode',
    description: 'Enable dark mode theme option',
    type: 'boolean',
    defaultValue: false,
    rules: [],
    environments: ['development', 'preview', 'production'],
    rolloutPercentage: 100,
    enabled: true,
    tags: ['ui', 'theme'],
    owner: 'product',
  },
  {
    key: 'kill_switch_analysis',
    name: 'Analysis Kill Switch',
    description: 'Emergency kill switch for analysis endpoint',
    type: 'boolean',
    defaultValue: true, // true = analysis enabled
    rules: [],
    environments: ['development', 'preview', 'production'],
    rolloutPercentage: 100,
    enabled: true,
    tags: ['emergency', 'kill-switch'],
    owner: 'engineering',
  },
];

// ============================================================================
// EDGE CONFIG SYNC UTILITIES
// ============================================================================

/**
 * Generate Edge Config items for deployment
 * This can be used to sync flags to Edge Config via API
 */
export function generateEdgeConfigItems(): Record<string, EdgeFeatureFlag> {
  const now = new Date().toISOString();
  const items: Record<string, EdgeFeatureFlag> = {};

  for (const flag of DEFAULT_EDGE_FLAGS) {
    items[`feature_flag:${flag.key}`] = {
      ...flag,
      createdAt: now,
      updatedAt: now,
    };
  }

  return items;
}

/**
 * Validate Edge Config connection
 */
export async function validateEdgeConfigConnection(): Promise<{
  connected: boolean;
  error?: string;
  flagCount?: number;
}> {
  const client = getEdgeConfigClient();
  if (!client) {
    return {
      connected: false,
      error: 'EDGE_CONFIG environment variable not set',
    };
  }

  try {
    const flags = await getEdgeFlags().getAllFlags();
    return {
      connected: true,
      flagCount: flags.length,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
