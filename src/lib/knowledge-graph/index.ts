/**
 * Knowledge Graph Module
 * Schema.org extraction and structured data utilities
 *
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

// Main extractor
export {
  SchemaExtractor,
  createSchemaExtractor,
  extractSchemas,
  extractSchemasFromHtml,
} from './schema-extractor';

// Types
export type {
  // Base Schema.org types
  SchemaThing,
  SchemaOrganization,
  SchemaPerson,
  SchemaProduct,
  SchemaService,
  SchemaWebPage,
  SchemaBreadcrumbList,
  SchemaListItem,
  SchemaOffer,
  SchemaReview,
  SchemaAggregateRating,
  SchemaEvent,
  SchemaPlace,
  SchemaPostalAddress,
  SchemaContactPoint,
  SchemaBrand,
  SchemaImageObject,
  // Extraction result types
  SchemaExtractionResult,
  ExtractedSchema,
  SchemaSource,
  SchemaValidationError,
  ExtractionSummary,
  SchemaExtractorConfig,
} from './types';

// Default config
export { DEFAULT_EXTRACTOR_CONFIG } from './types';

// Utilities
export { SchemaAnalyzer, analyzeSchemaQuality } from './schema-analyzer';

// Entity Extraction (Phase 1, Week 2, Day 5)
export {
  EntityExtractor,
  extractEntities,
  extractOrganizations,
  extractWithRelations,
} from './entity-extractor';

export type {
  Entity,
  EntityType,
  EntityMetadata,
  EntityRelation,
  RelationType,
  ExtractionResult,
  ExtractorConfig,
} from './entity-extractor';
