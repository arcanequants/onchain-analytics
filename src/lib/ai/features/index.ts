/**
 * Feature Store Module Exports
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 */

export {
  // Main class
  FeatureStore,
  getFeatureStore,

  // Types
  type FeatureType,
  type FeatureGroup,
  type FreshnessStatus,
  type Feature,
  type FeatureSource,
  type FeatureTransformation,
  type FeatureMetadata,
  type FeatureValue,
  type FeatureVector,
  type FeatureQuery,
  type FeatureStats,
  type FreshnessReport,

  // Transformation utilities
  normalizeValue,
  standardizeValue,
  logTransform,
  bucketValue,
  oneHotEncode,
} from './feature-store';
