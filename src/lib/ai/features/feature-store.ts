/**
 * Feature Store for ML Features
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 *
 * Features:
 * - Feature registry with metadata
 * - Brand, industry, and user feature groups
 * - Feature versioning and lineage
 * - Feature transformations
 * - Point-in-time correctness
 * - Feature freshness monitoring
 * - Batch and real-time serving
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

export type FeatureType = 'numeric' | 'categorical' | 'boolean' | 'vector' | 'timestamp' | 'text';

export type FeatureGroup = 'brand' | 'industry' | 'user' | 'market' | 'competitor' | 'sentiment';

export type FreshnessStatus = 'fresh' | 'stale' | 'expired';

export interface Feature {
  id: string;
  name: string;
  group: FeatureGroup;
  type: FeatureType;
  description: string;
  version: string;
  source: FeatureSource;
  transformation?: FeatureTransformation;
  metadata: FeatureMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureSource {
  type: 'database' | 'api' | 'computed' | 'manual';
  table?: string;
  column?: string;
  endpoint?: string;
  query?: string;
  dependencies?: string[]; // Other feature IDs
}

export interface FeatureTransformation {
  type: 'normalize' | 'standardize' | 'one_hot' | 'embedding' | 'bucket' | 'log' | 'custom';
  config: Record<string, unknown>;
  code?: string;
}

export interface FeatureMetadata {
  unit?: string;
  minValue?: number;
  maxValue?: number;
  categories?: string[];
  dimensions?: number; // For vector features
  refreshIntervalMinutes: number;
  slaMinutes: number;
  owner?: string;
  tags: string[];
}

export interface FeatureValue {
  featureId: string;
  entityId: string; // brand ID, user ID, etc.
  value: unknown;
  timestamp: string;
  version: string;
}

export interface FeatureVector {
  entityId: string;
  entityType: 'brand' | 'user' | 'industry' | 'market';
  features: Record<string, unknown>;
  timestamp: string;
  version: string;
}

export interface FeatureQuery {
  entityId: string;
  featureNames: string[];
  pointInTime?: Date;
  version?: string;
}

export interface FeatureStats {
  featureId: string;
  count: number;
  nullCount: number;
  mean?: number;
  stdDev?: number;
  min?: number;
  max?: number;
  uniqueValues?: number;
  topValues?: Array<{ value: unknown; count: number }>;
  lastUpdated: string;
}

export interface FreshnessReport {
  featureId: string;
  featureName: string;
  lastUpdated: string;
  expectedRefreshMinutes: number;
  actualMinutesSinceUpdate: number;
  status: FreshnessStatus;
  slaBreach: boolean;
}

// ============================================================================
// FEATURE TRANSFORMATIONS
// ============================================================================

/**
 * Apply normalization (min-max scaling to 0-1)
 */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}

/**
 * Apply standardization (z-score)
 */
export function standardizeValue(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Apply log transformation
 */
export function logTransform(value: number, base: number = Math.E): number {
  return Math.log(Math.max(value, 1e-10)) / Math.log(base);
}

/**
 * Apply bucketing
 */
export function bucketValue(
  value: number,
  buckets: number[]
): number {
  for (let i = 0; i < buckets.length; i++) {
    if (value <= buckets[i]) return i;
  }
  return buckets.length;
}

/**
 * One-hot encoding
 */
export function oneHotEncode(
  value: string,
  categories: string[]
): number[] {
  return categories.map(cat => (cat === value ? 1 : 0));
}

// ============================================================================
// FEATURE STORE CLASS
// ============================================================================

export class FeatureStore {
  private features: Map<string, Feature> = new Map();
  private featureValues: Map<string, Map<string, FeatureValue[]>> = new Map();
  private featureStats: Map<string, FeatureStats> = new Map();
  private latestValues: Map<string, Map<string, FeatureValue>> = new Map();

  constructor() {
    // Initialize with default features
    this.registerDefaultFeatures();
  }

  /**
   * Register a feature
   */
  registerFeature(feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Feature {
    const now = new Date().toISOString();
    const newFeature: Feature = {
      ...feature,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };

    this.features.set(newFeature.id, newFeature);
    this.featureValues.set(newFeature.id, new Map());
    this.latestValues.set(newFeature.id, new Map());

    return newFeature;
  }

  /**
   * Get a feature by ID or name
   */
  getFeature(idOrName: string): Feature | undefined {
    // Try by ID first
    let feature = this.features.get(idOrName);
    if (feature) return feature;

    // Try by name
    for (const f of this.features.values()) {
      if (f.name === idOrName) return f;
    }

    return undefined;
  }

  /**
   * Get all features in a group
   */
  getFeaturesByGroup(group: FeatureGroup): Feature[] {
    return Array.from(this.features.values()).filter(f => f.group === group);
  }

  /**
   * Store a feature value
   */
  setFeatureValue(
    featureIdOrName: string,
    entityId: string,
    value: unknown,
    timestamp: Date = new Date()
  ): FeatureValue {
    const feature = this.getFeature(featureIdOrName);
    if (!feature) {
      throw new Error(`Feature not found: ${featureIdOrName}`);
    }

    const featureValue: FeatureValue = {
      featureId: feature.id,
      entityId,
      value: this.applyTransformation(feature, value),
      timestamp: timestamp.toISOString(),
      version: feature.version,
    };

    // Store in history
    const entityValues = this.featureValues.get(feature.id)!;
    if (!entityValues.has(entityId)) {
      entityValues.set(entityId, []);
    }
    entityValues.get(entityId)!.push(featureValue);

    // Keep only last 100 values per entity
    const history = entityValues.get(entityId)!;
    if (history.length > 100) {
      entityValues.set(entityId, history.slice(-100));
    }

    // Update latest value
    this.latestValues.get(feature.id)!.set(entityId, featureValue);

    // Update stats
    this.updateStats(feature.id, value);

    return featureValue;
  }

  /**
   * Get the latest feature value
   */
  getFeatureValue(
    featureIdOrName: string,
    entityId: string
  ): FeatureValue | undefined {
    const feature = this.getFeature(featureIdOrName);
    if (!feature) return undefined;

    return this.latestValues.get(feature.id)?.get(entityId);
  }

  /**
   * Get feature value at a specific point in time
   */
  getFeatureValueAtTime(
    featureIdOrName: string,
    entityId: string,
    pointInTime: Date
  ): FeatureValue | undefined {
    const feature = this.getFeature(featureIdOrName);
    if (!feature) return undefined;

    const history = this.featureValues.get(feature.id)?.get(entityId);
    if (!history || history.length === 0) return undefined;

    // Find the latest value before or at the point in time
    const timestamp = pointInTime.getTime();
    let bestMatch: FeatureValue | undefined;

    for (const value of history) {
      const valueTime = new Date(value.timestamp).getTime();
      if (valueTime <= timestamp) {
        if (!bestMatch || new Date(bestMatch.timestamp).getTime() < valueTime) {
          bestMatch = value;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Get multiple features for an entity
   */
  getFeatureVector(query: FeatureQuery): FeatureVector {
    const features: Record<string, unknown> = {};

    for (const name of query.featureNames) {
      const value = query.pointInTime
        ? this.getFeatureValueAtTime(name, query.entityId, query.pointInTime)
        : this.getFeatureValue(name, query.entityId);

      features[name] = value?.value ?? null;
    }

    return {
      entityId: query.entityId,
      entityType: 'brand', // Default, could be inferred
      features,
      timestamp: new Date().toISOString(),
      version: query.version || '1.0.0',
    };
  }

  /**
   * Batch set feature values
   */
  setBatchFeatureValues(
    featureIdOrName: string,
    values: Array<{ entityId: string; value: unknown; timestamp?: Date }>
  ): FeatureValue[] {
    return values.map(v =>
      this.setFeatureValue(featureIdOrName, v.entityId, v.value, v.timestamp)
    );
  }

  /**
   * Apply transformation to value
   */
  private applyTransformation(feature: Feature, value: unknown): unknown {
    if (!feature.transformation) return value;

    const { type, config } = feature.transformation;

    switch (type) {
      case 'normalize':
        if (typeof value !== 'number') return value;
        return normalizeValue(
          value,
          config.min as number || 0,
          config.max as number || 1
        );

      case 'standardize':
        if (typeof value !== 'number') return value;
        return standardizeValue(
          value,
          config.mean as number || 0,
          config.stdDev as number || 1
        );

      case 'log':
        if (typeof value !== 'number') return value;
        return logTransform(value, config.base as number);

      case 'bucket':
        if (typeof value !== 'number') return value;
        return bucketValue(value, config.buckets as number[]);

      case 'one_hot':
        if (typeof value !== 'string') return value;
        return oneHotEncode(value, config.categories as string[]);

      default:
        return value;
    }
  }

  /**
   * Update feature statistics
   */
  private updateStats(featureId: string, value: unknown): void {
    let stats = this.featureStats.get(featureId);
    if (!stats) {
      stats = {
        featureId,
        count: 0,
        nullCount: 0,
        lastUpdated: new Date().toISOString(),
      };
    }

    stats.count++;
    stats.lastUpdated = new Date().toISOString();

    if (value === null || value === undefined) {
      stats.nullCount++;
    } else if (typeof value === 'number') {
      // Update numeric stats
      if (stats.min === undefined || value < stats.min) stats.min = value;
      if (stats.max === undefined || value > stats.max) stats.max = value;

      // Running mean (approximate)
      if (stats.mean === undefined) {
        stats.mean = value;
      } else {
        stats.mean = stats.mean + (value - stats.mean) / stats.count;
      }
    }

    this.featureStats.set(featureId, stats);
  }

  /**
   * Get feature statistics
   */
  getFeatureStats(featureIdOrName: string): FeatureStats | undefined {
    const feature = this.getFeature(featureIdOrName);
    if (!feature) return undefined;
    return this.featureStats.get(feature.id);
  }

  /**
   * Check feature freshness
   */
  checkFreshness(featureIdOrName: string, entityId?: string): FreshnessReport | undefined {
    const feature = this.getFeature(featureIdOrName);
    if (!feature) return undefined;

    let lastUpdated: string | undefined;

    if (entityId) {
      const value = this.getFeatureValue(feature.id, entityId);
      lastUpdated = value?.timestamp;
    } else {
      const stats = this.featureStats.get(feature.id);
      lastUpdated = stats?.lastUpdated;
    }

    if (!lastUpdated) {
      return {
        featureId: feature.id,
        featureName: feature.name,
        lastUpdated: 'never',
        expectedRefreshMinutes: feature.metadata.refreshIntervalMinutes,
        actualMinutesSinceUpdate: Infinity,
        status: 'expired',
        slaBreach: true,
      };
    }

    const minutesSinceUpdate = (Date.now() - new Date(lastUpdated).getTime()) / 60000;
    const { refreshIntervalMinutes, slaMinutes } = feature.metadata;

    let status: FreshnessStatus;
    if (minutesSinceUpdate <= refreshIntervalMinutes) {
      status = 'fresh';
    } else if (minutesSinceUpdate <= slaMinutes) {
      status = 'stale';
    } else {
      status = 'expired';
    }

    return {
      featureId: feature.id,
      featureName: feature.name,
      lastUpdated,
      expectedRefreshMinutes: refreshIntervalMinutes,
      actualMinutesSinceUpdate: Math.round(minutesSinceUpdate),
      status,
      slaBreach: minutesSinceUpdate > slaMinutes,
    };
  }

  /**
   * Get freshness report for all features
   */
  getAllFreshnessReports(): FreshnessReport[] {
    const reports: FreshnessReport[] = [];

    for (const feature of this.features.values()) {
      const report = this.checkFreshness(feature.id);
      if (report) reports.push(report);
    }

    return reports;
  }

  /**
   * Get stale or expired features
   */
  getStaleFeatures(): FreshnessReport[] {
    return this.getAllFreshnessReports().filter(r => r.status !== 'fresh');
  }

  /**
   * Register default brand features
   */
  private registerDefaultFeatures(): void {
    // Brand features
    this.registerFeature({
      name: 'brand_visibility_score',
      group: 'brand',
      type: 'numeric',
      description: 'Brand visibility in AI responses (0-100)',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      metadata: {
        unit: 'score',
        minValue: 0,
        maxValue: 100,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['core', 'visibility'],
      },
    });

    this.registerFeature({
      name: 'brand_sentiment_score',
      group: 'brand',
      type: 'numeric',
      description: 'Overall sentiment score (-1 to 1)',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      transformation: {
        type: 'normalize',
        config: { min: -1, max: 1 },
      },
      metadata: {
        unit: 'score',
        minValue: -1,
        maxValue: 1,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['core', 'sentiment'],
      },
    });

    this.registerFeature({
      name: 'brand_accuracy_rate',
      group: 'brand',
      type: 'numeric',
      description: 'Accuracy rate of brand information (0-1)',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      metadata: {
        unit: 'rate',
        minValue: 0,
        maxValue: 1,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['core', 'accuracy'],
      },
    });

    this.registerFeature({
      name: 'brand_mention_count',
      group: 'brand',
      type: 'numeric',
      description: 'Number of brand mentions',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      metadata: {
        unit: 'count',
        minValue: 0,
        refreshIntervalMinutes: 30,
        slaMinutes: 60,
        tags: ['core', 'mentions'],
      },
    });

    // Industry features
    this.registerFeature({
      name: 'industry_category',
      group: 'industry',
      type: 'categorical',
      description: 'Industry category',
      version: '1.0.0',
      source: { type: 'manual' },
      metadata: {
        categories: ['technology', 'finance', 'healthcare', 'retail', 'automotive', 'other'],
        refreshIntervalMinutes: 1440, // Daily
        slaMinutes: 2880,
        tags: ['industry', 'category'],
      },
    });

    this.registerFeature({
      name: 'industry_avg_visibility',
      group: 'industry',
      type: 'numeric',
      description: 'Average visibility score for industry',
      version: '1.0.0',
      source: { type: 'computed', dependencies: ['brand_visibility_score'] },
      metadata: {
        unit: 'score',
        minValue: 0,
        maxValue: 100,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['industry', 'benchmark'],
      },
    });

    // User features
    this.registerFeature({
      name: 'user_query_frequency',
      group: 'user',
      type: 'numeric',
      description: 'User query frequency per day',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      metadata: {
        unit: 'queries/day',
        minValue: 0,
        refreshIntervalMinutes: 1440,
        slaMinutes: 2880,
        tags: ['user', 'engagement'],
      },
    });

    this.registerFeature({
      name: 'user_brand_affinity',
      group: 'user',
      type: 'vector',
      description: 'User brand affinity vector',
      version: '1.0.0',
      source: { type: 'computed', dependencies: [] },
      metadata: {
        dimensions: 64,
        refreshIntervalMinutes: 1440,
        slaMinutes: 2880,
        tags: ['user', 'personalization'],
      },
    });

    // Market features
    this.registerFeature({
      name: 'market_trend_momentum',
      group: 'market',
      type: 'numeric',
      description: 'Market trend momentum indicator',
      version: '1.0.0',
      source: { type: 'api', endpoint: '/api/market/trends' },
      metadata: {
        unit: 'momentum',
        minValue: -100,
        maxValue: 100,
        refreshIntervalMinutes: 15,
        slaMinutes: 30,
        tags: ['market', 'trends'],
      },
    });

    // Competitor features
    this.registerFeature({
      name: 'competitor_visibility_gap',
      group: 'competitor',
      type: 'numeric',
      description: 'Visibility gap vs top competitor',
      version: '1.0.0',
      source: { type: 'computed', dependencies: ['brand_visibility_score'] },
      metadata: {
        unit: 'score',
        minValue: -100,
        maxValue: 100,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['competitor', 'analysis'],
      },
    });

    // Sentiment features
    this.registerFeature({
      name: 'sentiment_volatility',
      group: 'sentiment',
      type: 'numeric',
      description: 'Sentiment volatility over time',
      version: '1.0.0',
      source: { type: 'computed', dependencies: ['brand_sentiment_score'] },
      transformation: {
        type: 'log',
        config: { base: 10 },
      },
      metadata: {
        unit: 'volatility',
        minValue: 0,
        refreshIntervalMinutes: 60,
        slaMinutes: 120,
        tags: ['sentiment', 'volatility'],
      },
    });
  }

  /**
   * Get all registered features
   */
  getAllFeatures(): Feature[] {
    return Array.from(this.features.values());
  }

  /**
   * Export feature store state
   */
  export(): {
    features: Feature[];
    latestValues: Array<{ featureId: string; values: FeatureValue[] }>;
  } {
    const latestValues: Array<{ featureId: string; values: FeatureValue[] }> = [];

    for (const [featureId, entityMap] of this.latestValues) {
      latestValues.push({
        featureId,
        values: Array.from(entityMap.values()),
      });
    }

    return {
      features: this.getAllFeatures(),
      latestValues,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let defaultFeatureStore: FeatureStore | null = null;

export function getFeatureStore(): FeatureStore {
  if (!defaultFeatureStore) {
    defaultFeatureStore = new FeatureStore();
  }
  return defaultFeatureStore;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default FeatureStore;
