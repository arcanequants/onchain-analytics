/**
 * Schema.org Extractor
 * Extracts structured data (JSON-LD, Microdata, RDFa) from web pages
 *
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

import { nanoid } from 'nanoid';
import {
  type SchemaExtractionResult,
  type ExtractedSchema,
  type SchemaSource,
  type SchemaValidationError,
  type ExtractionSummary,
  type SchemaExtractorConfig,
  type SchemaThing,
  DEFAULT_EXTRACTOR_CONFIG,
} from './types';

// ================================================================
// MAIN EXTRACTOR CLASS
// ================================================================

export class SchemaExtractor {
  private config: SchemaExtractorConfig;

  constructor(config: Partial<SchemaExtractorConfig> = {}) {
    this.config = { ...DEFAULT_EXTRACTOR_CONFIG, ...config };
  }

  /**
   * Extract schemas from a URL
   */
  async extractFromUrl(url: string): Promise<SchemaExtractionResult> {
    const extractedAt = new Date();

    try {
      const html = await this.fetchHtml(url);
      return this.extractFromHtml(html, url, extractedAt);
    } catch (error) {
      return {
        url,
        extractedAt,
        success: false,
        schemas: [],
        errors: [
          {
            schemaId: '',
            path: '',
            message: error instanceof Error ? error.message : 'Unknown fetch error',
            severity: 'error',
          },
        ],
        summary: this.createEmptySummary(),
      };
    }
  }

  /**
   * Extract schemas from HTML string
   */
  extractFromHtml(
    html: string,
    url: string,
    extractedAt: Date = new Date()
  ): SchemaExtractionResult {
    const schemas: ExtractedSchema[] = [];
    const errors: SchemaValidationError[] = [];

    // Check HTML size
    if (html.length > this.config.maxHtmlSize) {
      return {
        url,
        extractedAt,
        success: false,
        schemas: [],
        errors: [
          {
            schemaId: '',
            path: '',
            message: `HTML exceeds maximum size of ${this.config.maxHtmlSize} bytes`,
            severity: 'error',
          },
        ],
        summary: this.createEmptySummary(),
      };
    }

    // Extract JSON-LD (primary method)
    const jsonLdSchemas = this.extractJsonLd(html, errors);
    schemas.push(...jsonLdSchemas);

    // Extract Microdata (optional)
    if (this.config.extractMicrodata) {
      const microdataSchemas = this.extractMicrodata(html, errors);
      schemas.push(...microdataSchemas);
    }

    // Extract RDFa (optional)
    if (this.config.extractRdfa) {
      const rdfaSchemas = this.extractRdfa(html, errors);
      schemas.push(...rdfaSchemas);
    }

    // Validate schemas if enabled
    if (this.config.validateSchemas) {
      for (const schema of schemas) {
        const validationErrors = this.validateSchema(schema);
        errors.push(...validationErrors);
        schema.valid = validationErrors.filter((e) => e.severity === 'error').length === 0;
      }
    }

    // Generate summary
    const summary = this.generateSummary(schemas);

    return {
      url,
      extractedAt,
      success: schemas.length > 0,
      schemas,
      errors,
      summary,
    };
  }

  // ================================================================
  // JSON-LD EXTRACTION
  // ================================================================

  private extractJsonLd(
    html: string,
    errors: SchemaValidationError[]
  ): ExtractedSchema[] {
    const schemas: ExtractedSchema[] = [];

    // Match all script tags with type="application/ld+json"
    const jsonLdRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = jsonLdRegex.exec(html)) !== null) {
      const jsonContent = match[1].trim();
      if (!jsonContent) continue;

      try {
        const parsed = JSON.parse(jsonContent);
        const items = Array.isArray(parsed) ? parsed : [parsed];

        for (const item of items) {
          // Handle @graph containers
          if (item['@graph'] && Array.isArray(item['@graph'])) {
            for (const graphItem of item['@graph']) {
              schemas.push(this.createExtractedSchema(graphItem, 'json-ld'));
            }
          } else {
            schemas.push(this.createExtractedSchema(item, 'json-ld'));
          }
        }
      } catch (e) {
        const schemaId = nanoid(8);
        errors.push({
          schemaId,
          path: '',
          message: `Invalid JSON-LD: ${e instanceof Error ? e.message : 'Parse error'}`,
          severity: 'error',
        });
      }
    }

    return schemas;
  }

  // ================================================================
  // MICRODATA EXTRACTION (Basic implementation)
  // ================================================================

  private extractMicrodata(
    html: string,
    _errors: SchemaValidationError[]
  ): ExtractedSchema[] {
    const schemas: ExtractedSchema[] = [];

    // Match elements with itemscope and itemtype
    const itemscopeRegex = /<[^>]+itemscope[^>]*itemtype\s*=\s*["']([^"']+)["'][^>]*>/gi;
    let match;

    while ((match = itemscopeRegex.exec(html)) !== null) {
      const itemtype = match[1];

      // Extract the Schema.org type from the URL
      const typeMatch = itemtype.match(/schema\.org\/(\w+)/);
      if (typeMatch) {
        const type = typeMatch[1];

        // Basic extraction - just capture the type
        // Full microdata parsing would require DOM traversal
        schemas.push({
          id: nanoid(8),
          type,
          raw: { '@type': type, _source: 'microdata', _itemtype: itemtype },
          parsed: { '@type': type } as SchemaThing,
          source: 'microdata',
          valid: true,
          warnings: ['Microdata extraction is basic - properties not fully parsed'],
        });
      }
    }

    return schemas;
  }

  // ================================================================
  // RDFA EXTRACTION (Basic implementation)
  // ================================================================

  private extractRdfa(
    html: string,
    _errors: SchemaValidationError[]
  ): ExtractedSchema[] {
    const schemas: ExtractedSchema[] = [];

    // Match elements with typeof attribute pointing to schema.org
    const rdfaRegex = /<[^>]+typeof\s*=\s*["']([^"']*schema\.org[^"']*)["'][^>]*>/gi;
    let match;

    while ((match = rdfaRegex.exec(html)) !== null) {
      const typeofValue = match[1];

      // Extract types (can be multiple space-separated)
      const types = typeofValue.split(/\s+/).filter((t) => t.includes('schema.org'));

      for (const typeUrl of types) {
        const typeMatch = typeUrl.match(/schema\.org\/(\w+)/);
        if (typeMatch) {
          const type = typeMatch[1];

          schemas.push({
            id: nanoid(8),
            type,
            raw: { '@type': type, _source: 'rdfa', _typeof: typeofValue },
            parsed: { '@type': type } as SchemaThing,
            source: 'rdfa',
            valid: true,
            warnings: ['RDFa extraction is basic - properties not fully parsed'],
          });
        }
      }
    }

    return schemas;
  }

  // ================================================================
  // SCHEMA CREATION & VALIDATION
  // ================================================================

  private createExtractedSchema(
    data: Record<string, unknown>,
    source: SchemaSource
  ): ExtractedSchema {
    const type = data['@type'] as string | string[] || 'Thing';

    return {
      id: nanoid(8),
      type,
      raw: data,
      parsed: data as unknown as SchemaThing,
      source,
      valid: true,
      warnings: [],
    };
  }

  private validateSchema(schema: ExtractedSchema): SchemaValidationError[] {
    const errors: SchemaValidationError[] = [];
    const data = schema.raw;

    // Check for @type
    if (!data['@type']) {
      errors.push({
        schemaId: schema.id,
        path: '@type',
        message: 'Missing required @type property',
        severity: 'error',
      });
    }

    // Type-specific validations
    const type = this.normalizeType(schema.type);

    switch (type) {
      case 'Organization':
      case 'LocalBusiness':
        this.validateOrganization(schema, errors);
        break;
      case 'Product':
        this.validateProduct(schema, errors);
        break;
      case 'WebSite':
        this.validateWebSite(schema, errors);
        break;
      case 'WebPage':
        this.validateWebPage(schema, errors);
        break;
      case 'BreadcrumbList':
        this.validateBreadcrumbList(schema, errors);
        break;
      case 'FAQPage':
        this.validateFAQPage(schema, errors);
        break;
      case 'Article':
      case 'BlogPosting':
      case 'NewsArticle':
        this.validateArticle(schema, errors);
        break;
    }

    return errors;
  }

  private normalizeType(type: string | string[]): string {
    if (Array.isArray(type)) {
      return type[0];
    }
    return type;
  }

  private validateOrganization(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.name) {
      errors.push({
        schemaId: schema.id,
        path: 'name',
        message: 'Organization should have a name',
        severity: 'warning',
      });
    }

    if (!data.url) {
      errors.push({
        schemaId: schema.id,
        path: 'url',
        message: 'Organization should have a url',
        severity: 'warning',
      });
    }

    if (!data.logo) {
      schema.warnings.push('Organization should have a logo for rich results');
    }
  }

  private validateProduct(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.name) {
      errors.push({
        schemaId: schema.id,
        path: 'name',
        message: 'Product must have a name',
        severity: 'error',
      });
    }

    if (!data.image) {
      schema.warnings.push('Product should have an image for rich results');
    }

    if (!data.offers) {
      schema.warnings.push('Product should have offers with price information');
    }
  }

  private validateWebSite(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.name) {
      errors.push({
        schemaId: schema.id,
        path: 'name',
        message: 'WebSite should have a name',
        severity: 'warning',
      });
    }

    if (!data.url) {
      errors.push({
        schemaId: schema.id,
        path: 'url',
        message: 'WebSite should have a url',
        severity: 'warning',
      });
    }

    // Check for search action
    if (data.potentialAction) {
      schema.warnings.push('WebSite has SearchAction configured (good for sitelinks searchbox)');
    }
  }

  private validateWebPage(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.name && !data.headline) {
      errors.push({
        schemaId: schema.id,
        path: 'name',
        message: 'WebPage should have a name or headline',
        severity: 'warning',
      });
    }
  }

  private validateBreadcrumbList(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.itemListElement) {
      errors.push({
        schemaId: schema.id,
        path: 'itemListElement',
        message: 'BreadcrumbList must have itemListElement',
        severity: 'error',
      });
      return;
    }

    const items = data.itemListElement as Array<Record<string, unknown>>;
    if (!Array.isArray(items) || items.length === 0) {
      errors.push({
        schemaId: schema.id,
        path: 'itemListElement',
        message: 'BreadcrumbList must have at least one item',
        severity: 'error',
      });
      return;
    }

    // Validate each item has position
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.position === undefined) {
        errors.push({
          schemaId: schema.id,
          path: `itemListElement[${i}].position`,
          message: 'BreadcrumbList item must have position',
          severity: 'error',
        });
      }
    }
  }

  private validateFAQPage(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.mainEntity) {
      errors.push({
        schemaId: schema.id,
        path: 'mainEntity',
        message: 'FAQPage must have mainEntity with Question items',
        severity: 'error',
      });
    }
  }

  private validateArticle(
    schema: ExtractedSchema,
    errors: SchemaValidationError[]
  ): void {
    const data = schema.raw;

    if (!data.headline) {
      errors.push({
        schemaId: schema.id,
        path: 'headline',
        message: 'Article must have a headline',
        severity: 'error',
      });
    }

    if (!data.author) {
      schema.warnings.push('Article should have an author');
    }

    if (!data.datePublished) {
      schema.warnings.push('Article should have datePublished');
    }

    if (!data.image) {
      schema.warnings.push('Article should have an image for rich results');
    }
  }

  // ================================================================
  // SUMMARY GENERATION
  // ================================================================

  private generateSummary(schemas: ExtractedSchema[]): ExtractionSummary {
    const schemasByType: Record<string, number> = {};
    const sourcesFound = new Set<SchemaSource>();

    let hasOrganization = false;
    let hasWebSite = false;
    let hasWebPage = false;
    let hasProduct = false;
    let hasBreadcrumbs = false;
    let hasFAQ = false;
    let hasReviews = false;
    let hasLocalBusiness = false;
    let hasArticle = false;
    let hasEvent = false;

    for (const schema of schemas) {
      sourcesFound.add(schema.source);

      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      for (const type of types) {
        schemasByType[type] = (schemasByType[type] || 0) + 1;

        switch (type) {
          case 'Organization':
          case 'Corporation':
          case 'NGO':
          case 'GovernmentOrganization':
            hasOrganization = true;
            break;
          case 'LocalBusiness':
          case 'Restaurant':
          case 'Store':
          case 'Hotel':
          case 'MedicalBusiness':
            hasOrganization = true;
            hasLocalBusiness = true;
            break;
          case 'WebSite':
            hasWebSite = true;
            break;
          case 'WebPage':
          case 'ItemPage':
          case 'AboutPage':
          case 'ContactPage':
          case 'ProfilePage':
            hasWebPage = true;
            break;
          case 'Product':
            hasProduct = true;
            break;
          case 'BreadcrumbList':
            hasBreadcrumbs = true;
            break;
          case 'FAQPage':
            hasFAQ = true;
            break;
          case 'Review':
          case 'AggregateRating':
            hasReviews = true;
            break;
          case 'Article':
          case 'BlogPosting':
          case 'NewsArticle':
          case 'TechArticle':
          case 'ScholarlyArticle':
            hasArticle = true;
            break;
          case 'Event':
          case 'BusinessEvent':
          case 'SocialEvent':
          case 'MusicEvent':
            hasEvent = true;
            break;
        }
      }
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore({
      totalSchemas: schemas.length,
      hasOrganization,
      hasWebSite,
      hasWebPage,
      hasProduct,
      hasBreadcrumbs,
      hasFAQ,
      hasReviews,
      hasLocalBusiness,
      hasArticle,
      hasEvent,
      validSchemas: schemas.filter((s) => s.valid).length,
    });

    return {
      totalSchemas: schemas.length,
      schemasByType,
      sourcesFound: Array.from(sourcesFound),
      hasOrganization,
      hasWebSite,
      hasWebPage,
      hasProduct,
      hasBreadcrumbs,
      hasFAQ,
      hasReviews,
      hasLocalBusiness,
      hasArticle,
      hasEvent,
      qualityScore,
    };
  }

  private calculateQualityScore(factors: {
    totalSchemas: number;
    hasOrganization: boolean;
    hasWebSite: boolean;
    hasWebPage: boolean;
    hasProduct: boolean;
    hasBreadcrumbs: boolean;
    hasFAQ: boolean;
    hasReviews: boolean;
    hasLocalBusiness: boolean;
    hasArticle: boolean;
    hasEvent: boolean;
    validSchemas: number;
  }): number {
    let score = 0;

    // Base score for having any schemas
    if (factors.totalSchemas > 0) score += 10;

    // Core schema types (higher weight)
    if (factors.hasOrganization) score += 20;
    if (factors.hasWebSite) score += 15;
    if (factors.hasWebPage) score += 10;

    // Rich result eligible schemas
    if (factors.hasBreadcrumbs) score += 10;
    if (factors.hasFAQ) score += 10;
    if (factors.hasReviews) score += 10;
    if (factors.hasProduct) score += 10;
    if (factors.hasLocalBusiness) score += 5;
    if (factors.hasArticle) score += 5;
    if (factors.hasEvent) score += 5;

    // Validation bonus
    if (factors.totalSchemas > 0) {
      const validRatio = factors.validSchemas / factors.totalSchemas;
      score += Math.round(validRatio * 10);
    }

    // Cap at 100
    return Math.min(score, 100);
  }

  private createEmptySummary(): ExtractionSummary {
    return {
      totalSchemas: 0,
      schemasByType: {},
      sourcesFound: [],
      hasOrganization: false,
      hasWebSite: false,
      hasWebPage: false,
      hasProduct: false,
      hasBreadcrumbs: false,
      hasFAQ: false,
      hasReviews: false,
      hasLocalBusiness: false,
      hasArticle: false,
      hasEvent: false,
      qualityScore: 0,
    };
  }

  // ================================================================
  // HTTP FETCHING
  // ================================================================

  private async fetchHtml(url: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.fetchTimeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.config.userAgent,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal: controller.signal,
        redirect: this.config.followRedirects ? 'follow' : 'manual',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
        throw new Error(`Invalid content type: ${contentType}`);
      }

      return await response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Create a schema extractor with default configuration
 */
export function createSchemaExtractor(
  config?: Partial<SchemaExtractorConfig>
): SchemaExtractor {
  return new SchemaExtractor(config);
}

/**
 * Quick extraction from URL with default settings
 */
export async function extractSchemas(url: string): Promise<SchemaExtractionResult> {
  const extractor = new SchemaExtractor();
  return extractor.extractFromUrl(url);
}

/**
 * Quick extraction from HTML string
 */
export function extractSchemasFromHtml(
  html: string,
  url: string = 'unknown'
): SchemaExtractionResult {
  const extractor = new SchemaExtractor();
  return extractor.extractFromHtml(html, url);
}

// ================================================================
// EXPORTS
// ================================================================

export {
  type SchemaExtractionResult,
  type ExtractedSchema,
  type SchemaSource,
  type SchemaValidationError,
  type ExtractionSummary,
  type SchemaExtractorConfig,
  DEFAULT_EXTRACTOR_CONFIG,
} from './types';
