/**
 * Model Registry with SEMVER Versioning
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Semantic versioning for all prompts and models
 * - Version comparison and compatibility checking
 * - Rollback capabilities
 * - Audit trail for all changes
 * - A/B testing support with version routing
 * - Deprecation management
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export interface SemanticVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

export type VersionStatus = 'draft' | 'active' | 'deprecated' | 'archived';

export type AssetType = 'prompt' | 'model_config' | 'schema' | 'pipeline' | 'feature_set';

export interface RegistryAsset {
  id: string;
  name: string;
  type: AssetType;
  version: SemanticVersion;
  versionString: string;
  status: VersionStatus;
  content: unknown;
  metadata: AssetMetadata;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  changelog?: string;
  parentVersion?: string;
  tags: string[];
}

export interface AssetMetadata {
  description?: string;
  author?: string;
  team?: string;
  category?: string;
  modelProvider?: string;
  modelName?: string;
  temperature?: number;
  maxTokens?: number;
  systemPromptHash?: string;
  dependencies?: AssetDependency[];
  metrics?: AssetMetrics;
  abTestConfig?: ABTestConfig;
}

export interface AssetDependency {
  assetId: string;
  assetName: string;
  versionConstraint: string; // e.g., "^1.0.0", ">=2.0.0", "~1.2.0"
}

export interface AssetMetrics {
  avgLatencyMs?: number;
  avgTokenUsage?: number;
  successRate?: number;
  qualityScore?: number;
  usageCount?: number;
  lastUsed?: string;
}

export interface ABTestConfig {
  enabled: boolean;
  experimentId: string;
  trafficPercentage: number;
  controlVersion?: string;
  startDate?: string;
  endDate?: string;
}

export interface VersionQuery {
  name?: string;
  type?: AssetType;
  status?: VersionStatus;
  tags?: string[];
  minVersion?: string;
  maxVersion?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface RegistryStats {
  totalAssets: number;
  byType: Record<AssetType, number>;
  byStatus: Record<VersionStatus, number>;
  recentChanges: RegistryChange[];
}

export interface RegistryChange {
  assetId: string;
  assetName: string;
  action: 'created' | 'updated' | 'deprecated' | 'archived' | 'rolled_back';
  fromVersion?: string;
  toVersion: string;
  timestamp: string;
  userId: string;
}

// ============================================================================
// SEMVER UTILITIES
// ============================================================================

/**
 * Parse a version string into components
 */
export function parseVersion(version: string): SemanticVersion | null {
  const regex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;
  const match = version.match(regex);

  if (!match) return null;

  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    prerelease: match[4],
    build: match[5],
  };
}

/**
 * Format version object to string
 */
export function formatVersion(version: SemanticVersion): string {
  let result = `${version.major}.${version.minor}.${version.patch}`;
  if (version.prerelease) result += `-${version.prerelease}`;
  if (version.build) result += `+${version.build}`;
  return result;
}

/**
 * Compare two versions
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compareVersions(a: SemanticVersion, b: SemanticVersion): -1 | 0 | 1 {
  // Compare major
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;

  // Compare minor
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;

  // Compare patch
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;

  // Compare prerelease (absence means higher precedence)
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease && b.prerelease) {
    if (a.prerelease < b.prerelease) return -1;
    if (a.prerelease > b.prerelease) return 1;
  }

  return 0;
}

/**
 * Check if version satisfies constraint
 */
export function satisfiesConstraint(version: SemanticVersion, constraint: string): boolean {
  const constraintRegex = /^([\^~>=<]*)(\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?(?:\+[a-zA-Z0-9.-]+)?)$/;
  const match = constraint.match(constraintRegex);

  if (!match) return false;

  const operator = match[1] || '=';
  const constraintVersion = parseVersion(match[2]);

  if (!constraintVersion) return false;

  const comparison = compareVersions(version, constraintVersion);

  switch (operator) {
    case '':
    case '=':
      return comparison === 0;
    case '>':
      return comparison === 1;
    case '>=':
      return comparison >= 0;
    case '<':
      return comparison === -1;
    case '<=':
      return comparison <= 0;
    case '^':
      // Compatible with major version
      return version.major === constraintVersion.major && comparison >= 0;
    case '~':
      // Compatible with minor version
      return (
        version.major === constraintVersion.major &&
        version.minor === constraintVersion.minor &&
        comparison >= 0
      );
    default:
      return false;
  }
}

/**
 * Calculate next version based on change type
 */
export function bumpVersion(
  current: SemanticVersion,
  type: 'major' | 'minor' | 'patch'
): SemanticVersion {
  switch (type) {
    case 'major':
      return { major: current.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: current.major, minor: current.minor + 1, patch: 0 };
    case 'patch':
      return { major: current.major, minor: current.minor, patch: current.patch + 1 };
  }
}

// ============================================================================
// MODEL REGISTRY CLASS
// ============================================================================

export class ModelRegistry {
  private assets: Map<string, RegistryAsset> = new Map();
  private assetsByName: Map<string, Set<string>> = new Map();
  private changeLog: RegistryChange[] = [];

  constructor(initialAssets: RegistryAsset[] = []) {
    for (const asset of initialAssets) {
      this.addAsset(asset);
    }
  }

  /**
   * Add an asset to the registry (internal use)
   */
  private addAsset(asset: RegistryAsset): void {
    this.assets.set(asset.id, asset);

    if (!this.assetsByName.has(asset.name)) {
      this.assetsByName.set(asset.name, new Set());
    }
    this.assetsByName.get(asset.name)!.add(asset.id);
  }

  /**
   * Register a new asset or new version
   */
  register(
    name: string,
    type: AssetType,
    content: unknown,
    options: {
      version?: string;
      bumpType?: 'major' | 'minor' | 'patch';
      metadata?: Partial<AssetMetadata>;
      changelog?: string;
      tags?: string[];
      userId?: string;
    } = {}
  ): RegistryAsset {
    const existingVersions = this.getVersions(name);
    const latestVersion = existingVersions.length > 0
      ? existingVersions[0]
      : null;

    let version: SemanticVersion;
    let parentVersion: string | undefined;

    if (options.version) {
      // Explicit version provided
      const parsed = parseVersion(options.version);
      if (!parsed) throw new Error(`Invalid version format: ${options.version}`);
      version = parsed;
    } else if (latestVersion && options.bumpType) {
      // Bump from latest
      version = bumpVersion(latestVersion.version, options.bumpType);
      parentVersion = latestVersion.versionString;
    } else if (latestVersion) {
      // Default to patch bump
      version = bumpVersion(latestVersion.version, 'patch');
      parentVersion = latestVersion.versionString;
    } else {
      // First version
      version = { major: 1, minor: 0, patch: 0 };
    }

    const now = new Date().toISOString();
    const asset: RegistryAsset = {
      id: uuidv4(),
      name,
      type,
      version,
      versionString: formatVersion(version),
      status: 'draft',
      content,
      metadata: {
        ...options.metadata,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: options.userId || 'system',
      changelog: options.changelog,
      parentVersion,
      tags: options.tags || [],
    };

    this.addAsset(asset);
    this.recordChange(asset, 'created', options.userId || 'system');

    return asset;
  }

  /**
   * Activate a version (make it the primary active version)
   */
  activate(assetId: string, userId: string = 'system'): RegistryAsset {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    // Deprecate other active versions of the same asset name
    const otherVersions = this.getVersions(asset.name);
    for (const other of otherVersions) {
      if (other.id !== assetId && other.status === 'active') {
        other.status = 'deprecated';
        other.updatedAt = new Date().toISOString();
        this.assets.set(other.id, other);
        this.recordChange(other, 'deprecated', userId, asset.versionString);
      }
    }

    asset.status = 'active';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);
    this.recordChange(asset, 'updated', userId);

    return asset;
  }

  /**
   * Deprecate a version
   */
  deprecate(assetId: string, userId: string = 'system'): RegistryAsset {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    asset.status = 'deprecated';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);
    this.recordChange(asset, 'deprecated', userId);

    return asset;
  }

  /**
   * Archive a version (soft delete)
   */
  archive(assetId: string, userId: string = 'system'): RegistryAsset {
    const asset = this.assets.get(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    asset.status = 'archived';
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);
    this.recordChange(asset, 'archived', userId);

    return asset;
  }

  /**
   * Rollback to a previous version
   */
  rollback(name: string, targetVersion: string, userId: string = 'system'): RegistryAsset {
    const versions = this.getVersions(name);
    const target = versions.find(v => v.versionString === targetVersion);

    if (!target) {
      throw new Error(`Version ${targetVersion} not found for ${name}`);
    }

    // Create a new version from the target
    const newAsset = this.register(name, target.type, target.content, {
      bumpType: 'patch',
      metadata: target.metadata,
      changelog: `Rollback to version ${targetVersion}`,
      tags: [...target.tags, 'rollback'],
      userId,
    });

    // Activate the new version
    this.activate(newAsset.id, userId);
    this.recordChange(newAsset, 'rolled_back', userId, targetVersion);

    return newAsset;
  }

  /**
   * Get a specific asset by ID
   */
  get(assetId: string): RegistryAsset | undefined {
    return this.assets.get(assetId);
  }

  /**
   * Get the active version of an asset by name
   */
  getActive(name: string): RegistryAsset | undefined {
    const versions = this.getVersions(name);
    return versions.find(v => v.status === 'active');
  }

  /**
   * Get a specific version by name and version string
   */
  getVersion(name: string, version: string): RegistryAsset | undefined {
    const versions = this.getVersions(name);
    return versions.find(v => v.versionString === version);
  }

  /**
   * Get all versions of an asset (sorted by version, newest first)
   */
  getVersions(name: string): RegistryAsset[] {
    const assetIds = this.assetsByName.get(name);
    if (!assetIds) return [];

    const versions = Array.from(assetIds)
      .map(id => this.assets.get(id)!)
      .filter(Boolean);

    return versions.sort((a, b) => compareVersions(b.version, a.version));
  }

  /**
   * Query assets with filters
   */
  query(filters: VersionQuery): RegistryAsset[] {
    let results = Array.from(this.assets.values());

    if (filters.name) {
      results = results.filter(a => a.name === filters.name);
    }

    if (filters.type) {
      results = results.filter(a => a.type === filters.type);
    }

    if (filters.status) {
      results = results.filter(a => a.status === filters.status);
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(a =>
        filters.tags!.every(tag => a.tags.includes(tag))
      );
    }

    if (filters.minVersion) {
      const min = parseVersion(filters.minVersion);
      if (min) {
        results = results.filter(a => compareVersions(a.version, min) >= 0);
      }
    }

    if (filters.maxVersion) {
      const max = parseVersion(filters.maxVersion);
      if (max) {
        results = results.filter(a => compareVersions(a.version, max) <= 0);
      }
    }

    if (filters.createdAfter) {
      results = results.filter(a => new Date(a.createdAt) >= filters.createdAfter!);
    }

    if (filters.createdBefore) {
      results = results.filter(a => new Date(a.createdAt) <= filters.createdBefore!);
    }

    return results.sort((a, b) => compareVersions(b.version, a.version));
  }

  /**
   * Resolve version for A/B testing
   */
  resolveForABTest(
    name: string,
    experimentId: string,
    userId: string
  ): RegistryAsset | undefined {
    const versions = this.getVersions(name);
    const abTestVersions = versions.filter(
      v => v.metadata.abTestConfig?.enabled &&
           v.metadata.abTestConfig.experimentId === experimentId
    );

    if (abTestVersions.length === 0) {
      return this.getActive(name);
    }

    // Simple hash-based routing
    const hash = this.hashString(userId + experimentId);
    const percentage = (hash % 100) + 1;

    // Find the version this user should get
    let cumulative = 0;
    for (const version of abTestVersions) {
      cumulative += version.metadata.abTestConfig!.trafficPercentage;
      if (percentage <= cumulative) {
        return version;
      }
    }

    // Fallback to control or active
    const control = abTestVersions.find(
      v => v.metadata.abTestConfig?.controlVersion === v.versionString
    );
    return control || this.getActive(name);
  }

  /**
   * Simple string hash function
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Check dependency compatibility
   */
  checkDependencies(assetId: string): { valid: boolean; issues: string[] } {
    const asset = this.assets.get(assetId);
    if (!asset) return { valid: false, issues: ['Asset not found'] };

    const issues: string[] = [];
    const deps = asset.metadata.dependencies || [];

    for (const dep of deps) {
      const depVersions = this.getVersions(dep.assetName);
      const activeVersion = depVersions.find(v => v.status === 'active');

      if (!activeVersion) {
        issues.push(`Dependency ${dep.assetName} has no active version`);
        continue;
      }

      if (!satisfiesConstraint(activeVersion.version, dep.versionConstraint)) {
        issues.push(
          `Dependency ${dep.assetName}@${activeVersion.versionString} ` +
          `does not satisfy ${dep.versionConstraint}`
        );
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Update asset metrics
   */
  updateMetrics(assetId: string, metrics: Partial<AssetMetrics>): void {
    const asset = this.assets.get(assetId);
    if (!asset) return;

    asset.metadata.metrics = {
      ...asset.metadata.metrics,
      ...metrics,
      lastUsed: new Date().toISOString(),
    };
    asset.updatedAt = new Date().toISOString();
    this.assets.set(assetId, asset);
  }

  /**
   * Record a change in the changelog
   */
  private recordChange(
    asset: RegistryAsset,
    action: RegistryChange['action'],
    userId: string,
    fromVersion?: string
  ): void {
    this.changeLog.push({
      assetId: asset.id,
      assetName: asset.name,
      action,
      fromVersion,
      toVersion: asset.versionString,
      timestamp: new Date().toISOString(),
      userId,
    });

    // Keep only last 1000 changes
    if (this.changeLog.length > 1000) {
      this.changeLog = this.changeLog.slice(-1000);
    }
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const byType: Record<AssetType, number> = {
      prompt: 0,
      model_config: 0,
      schema: 0,
      pipeline: 0,
      feature_set: 0,
    };

    const byStatus: Record<VersionStatus, number> = {
      draft: 0,
      active: 0,
      deprecated: 0,
      archived: 0,
    };

    for (const asset of this.assets.values()) {
      byType[asset.type]++;
      byStatus[asset.status]++;
    }

    return {
      totalAssets: this.assets.size,
      byType,
      byStatus,
      recentChanges: this.changeLog.slice(-20),
    };
  }

  /**
   * Export all assets (for backup)
   */
  export(): RegistryAsset[] {
    return Array.from(this.assets.values());
  }

  /**
   * Import assets (for restore)
   */
  import(assets: RegistryAsset[]): void {
    for (const asset of assets) {
      this.addAsset(asset);
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultRegistry: ModelRegistry | null = null;

export function getModelRegistry(): ModelRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new ModelRegistry();
  }
  return defaultRegistry;
}

// ============================================================================
// PROMPT TEMPLATES HELPERS
// ============================================================================

export interface PromptTemplate {
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  modelConfig: {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

/**
 * Register a prompt template
 */
export function registerPromptTemplate(
  template: PromptTemplate,
  options: {
    bumpType?: 'major' | 'minor' | 'patch';
    changelog?: string;
    userId?: string;
  } = {}
): RegistryAsset {
  const registry = getModelRegistry();

  return registry.register(template.name, 'prompt', template, {
    bumpType: options.bumpType || 'patch',
    changelog: options.changelog,
    userId: options.userId,
    metadata: {
      modelProvider: template.modelConfig.provider,
      modelName: template.modelConfig.model,
      temperature: template.modelConfig.temperature,
      maxTokens: template.modelConfig.maxTokens,
    },
  });
}

/**
 * Get active prompt template
 */
export function getActivePromptTemplate(name: string): PromptTemplate | null {
  const registry = getModelRegistry();
  const asset = registry.getActive(name);
  return asset ? (asset.content as PromptTemplate) : null;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ModelRegistry;
