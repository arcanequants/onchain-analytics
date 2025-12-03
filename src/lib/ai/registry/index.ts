/**
 * Model Registry Module Exports
 *
 * Phase 4, Week 8 Extended - MLOps Checklist
 */

export {
  // Main class
  ModelRegistry,
  getModelRegistry,

  // Types
  type SemanticVersion,
  type VersionStatus,
  type AssetType,
  type RegistryAsset,
  type AssetMetadata,
  type AssetDependency,
  type AssetMetrics,
  type ABTestConfig,
  type VersionQuery,
  type RegistryStats,
  type RegistryChange,
  type PromptTemplate,

  // SEMVER utilities
  parseVersion,
  formatVersion,
  compareVersions,
  satisfiesConstraint,
  bumpVersion,

  // Helpers
  registerPromptTemplate,
  getActivePromptTemplate,
} from './model-registry';
