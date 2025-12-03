/**
 * Schema Analyzer
 * Analyzes extracted schemas for quality and AI perception readiness
 *
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

import {
  type SchemaExtractionResult,
  type ExtractedSchema,
  type ExtractionSummary,
} from './types';

// ================================================================
// ANALYSIS RESULT TYPES
// ================================================================

/**
 * Detailed quality analysis of schemas
 */
export interface SchemaQualityAnalysis {
  /** Overall score (0-100) */
  overallScore: number;
  /** Category scores */
  categories: QualityCategory[];
  /** Specific recommendations */
  recommendations: SchemaRecommendation[];
  /** Rich result eligibility */
  richResults: RichResultEligibility[];
  /** AI perception specific metrics */
  aiPerception: AIPerceptionMetrics;
}

/**
 * Quality category breakdown
 */
export interface QualityCategory {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  details: string[];
}

/**
 * Schema recommendation
 */
export interface SchemaRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: string;
  message: string;
  action: string;
  impact: string;
}

/**
 * Rich result eligibility check
 */
export interface RichResultEligibility {
  type: string;
  eligible: boolean;
  requirements: RequirementCheck[];
  googleDocsUrl?: string;
}

/**
 * Individual requirement check
 */
export interface RequirementCheck {
  property: string;
  required: boolean;
  present: boolean;
  valid: boolean;
}

/**
 * AI Perception specific metrics
 */
export interface AIPerceptionMetrics {
  /** How well the brand identity is communicated */
  brandIdentityScore: number;
  /** How complete the business information is */
  businessInfoScore: number;
  /** How rich the content context is */
  contentContextScore: number;
  /** Social proof signals present */
  socialProofScore: number;
  /** Overall AI-readiness score */
  aiReadinessScore: number;
  /** Specific findings for AI perception */
  findings: string[];
}

// ================================================================
// SCHEMA ANALYZER CLASS
// ================================================================

export class SchemaAnalyzer {
  /**
   * Analyze schema extraction results
   */
  analyze(result: SchemaExtractionResult): SchemaQualityAnalysis {
    const categories = this.analyzeCategories(result);
    const recommendations = this.generateRecommendations(result);
    const richResults = this.checkRichResultEligibility(result);
    const aiPerception = this.analyzeAIPerception(result);

    // Calculate overall score from categories
    const overallScore = Math.round(
      categories.reduce((sum, cat) => sum + cat.score, 0) /
        Math.max(categories.reduce((sum, cat) => sum + cat.maxScore, 0), 1) *
        100
    );

    return {
      overallScore,
      categories,
      recommendations,
      richResults,
      aiPerception,
    };
  }

  // ================================================================
  // CATEGORY ANALYSIS
  // ================================================================

  private analyzeCategories(result: SchemaExtractionResult): QualityCategory[] {
    const categories: QualityCategory[] = [];

    // Presence category
    categories.push(this.analyzePresence(result));

    // Completeness category
    categories.push(this.analyzeCompleteness(result));

    // Validity category
    categories.push(this.analyzeValidity(result));

    // Rich Results Potential
    categories.push(this.analyzeRichResultsPotential(result));

    return categories;
  }

  private analyzePresence(result: SchemaExtractionResult): QualityCategory {
    const { summary } = result;
    let score = 0;
    const maxScore = 25;
    const details: string[] = [];

    if (summary.totalSchemas > 0) {
      score += 5;
      details.push(`Found ${summary.totalSchemas} schema(s)`);
    } else {
      details.push('No schemas found');
    }

    if (summary.hasOrganization) {
      score += 5;
      details.push('Organization schema present');
    }

    if (summary.hasWebSite) {
      score += 5;
      details.push('WebSite schema present');
    }

    if (summary.hasWebPage) {
      score += 5;
      details.push('WebPage schema present');
    }

    if (summary.sourcesFound.includes('json-ld')) {
      score += 5;
      details.push('Using JSON-LD format (recommended)');
    }

    return {
      name: 'Schema Presence',
      score,
      maxScore,
      description: 'Measures the presence of essential schema types',
      details,
    };
  }

  private analyzeCompleteness(result: SchemaExtractionResult): QualityCategory {
    let score = 0;
    const maxScore = 25;
    const details: string[] = [];

    // Check Organization completeness
    const orgSchema = this.findSchemaByType(result.schemas, ['Organization', 'LocalBusiness', 'Corporation']);
    if (orgSchema) {
      const orgFields = this.checkOrganizationFields(orgSchema);
      score += Math.min(orgFields.score, 10);
      details.push(...orgFields.details);
    }

    // Check WebSite completeness
    const webSiteSchema = this.findSchemaByType(result.schemas, ['WebSite']);
    if (webSiteSchema) {
      const wsFields = this.checkWebSiteFields(webSiteSchema);
      score += Math.min(wsFields.score, 8);
      details.push(...wsFields.details);
    }

    // Check for additional valuable schemas
    if (result.summary.hasBreadcrumbs) {
      score += 3;
      details.push('Breadcrumbs implemented');
    }

    if (result.summary.hasReviews) {
      score += 2;
      details.push('Reviews/Ratings present');
    }

    if (result.summary.hasFAQ) {
      score += 2;
      details.push('FAQ schema present');
    }

    return {
      name: 'Schema Completeness',
      score: Math.min(score, maxScore),
      maxScore,
      description: 'Measures how complete the schema properties are',
      details,
    };
  }

  private analyzeValidity(result: SchemaExtractionResult): QualityCategory {
    let score = 25; // Start with full score
    const maxScore = 25;
    const details: string[] = [];

    const totalSchemas = result.schemas.length;
    const validSchemas = result.schemas.filter((s) => s.valid).length;
    const errorCount = result.errors.filter((e) => e.severity === 'error').length;
    const warningCount = result.errors.filter((e) => e.severity === 'warning').length;

    if (totalSchemas > 0) {
      const validRatio = validSchemas / totalSchemas;
      score = Math.round(validRatio * 20);
      details.push(`${validSchemas}/${totalSchemas} schemas valid`);
    }

    // Deduct for errors
    score -= Math.min(errorCount * 3, 10);
    if (errorCount > 0) {
      details.push(`${errorCount} validation error(s)`);
    }

    // Minor deduction for warnings
    score -= Math.min(warningCount, 5);
    if (warningCount > 0) {
      details.push(`${warningCount} warning(s)`);
    }

    if (errorCount === 0 && warningCount === 0 && totalSchemas > 0) {
      score = maxScore;
      details.push('All schemas pass validation');
    }

    return {
      name: 'Schema Validity',
      score: Math.max(0, Math.min(score, maxScore)),
      maxScore,
      description: 'Measures schema syntax and semantic validity',
      details,
    };
  }

  private analyzeRichResultsPotential(result: SchemaExtractionResult): QualityCategory {
    let score = 0;
    const maxScore = 25;
    const details: string[] = [];

    const { summary } = result;

    // Check for rich result eligible schemas
    if (summary.hasBreadcrumbs) {
      score += 5;
      details.push('Breadcrumbs rich result eligible');
    }

    if (summary.hasFAQ) {
      score += 5;
      details.push('FAQ rich result eligible');
    }

    if (summary.hasReviews) {
      score += 5;
      details.push('Review/Rating rich result eligible');
    }

    if (summary.hasProduct) {
      score += 4;
      details.push('Product rich result potential');
    }

    if (summary.hasLocalBusiness) {
      score += 3;
      details.push('Local Business rich result potential');
    }

    if (summary.hasArticle) {
      score += 3;
      details.push('Article rich result potential');
    }

    if (summary.hasEvent) {
      score += 3;
      details.push('Event rich result potential');
    }

    // Check for SearchAction
    const webSite = this.findSchemaByType(result.schemas, ['WebSite']);
    if (webSite && webSite.raw.potentialAction) {
      score += 3;
      details.push('Sitelinks searchbox potential');
    }

    return {
      name: 'Rich Results Potential',
      score: Math.min(score, maxScore),
      maxScore,
      description: 'Measures eligibility for Google rich results',
      details,
    };
  }

  // ================================================================
  // RECOMMENDATIONS
  // ================================================================

  private generateRecommendations(result: SchemaExtractionResult): SchemaRecommendation[] {
    const recommendations: SchemaRecommendation[] = [];
    const { summary } = result;

    // Missing essential schemas
    if (!summary.hasOrganization) {
      recommendations.push({
        priority: 'high',
        type: 'missing-schema',
        message: 'No Organization schema found',
        action: 'Add Organization JSON-LD with name, url, logo, description, and contactPoint',
        impact: 'Essential for brand identity in search and AI systems',
      });
    }

    if (!summary.hasWebSite) {
      recommendations.push({
        priority: 'high',
        type: 'missing-schema',
        message: 'No WebSite schema found',
        action: 'Add WebSite JSON-LD with name, url, and potentialAction for sitelinks searchbox',
        impact: 'Improves site representation and enables sitelinks searchbox',
      });
    }

    if (!summary.hasBreadcrumbs) {
      recommendations.push({
        priority: 'medium',
        type: 'missing-schema',
        message: 'No BreadcrumbList schema found',
        action: 'Add BreadcrumbList JSON-LD on all pages with navigation hierarchy',
        impact: 'Enables breadcrumb rich results in search',
      });
    }

    // Check Organization completeness
    const orgSchema = this.findSchemaByType(result.schemas, ['Organization', 'LocalBusiness']);
    if (orgSchema) {
      if (!orgSchema.raw.logo) {
        recommendations.push({
          priority: 'medium',
          type: 'incomplete-schema',
          message: 'Organization missing logo',
          action: 'Add logo property with ImageObject or URL',
          impact: 'Logo may appear in knowledge panel',
        });
      }

      if (!orgSchema.raw.contactPoint) {
        recommendations.push({
          priority: 'medium',
          type: 'incomplete-schema',
          message: 'Organization missing contactPoint',
          action: 'Add contactPoint with telephone, email, and contactType',
          impact: 'Helps users and AI systems contact your business',
        });
      }

      if (!orgSchema.raw.sameAs) {
        recommendations.push({
          priority: 'low',
          type: 'incomplete-schema',
          message: 'Organization missing sameAs (social profiles)',
          action: 'Add sameAs array with links to social media profiles',
          impact: 'Connects your brand identity across platforms',
        });
      }
    }

    // Validation errors
    const criticalErrors = result.errors.filter((e) => e.severity === 'error');
    if (criticalErrors.length > 0) {
      recommendations.push({
        priority: 'high',
        type: 'validation-error',
        message: `${criticalErrors.length} schema validation error(s)`,
        action: 'Fix JSON-LD syntax and required property errors',
        impact: 'Invalid schemas may be ignored by search engines',
      });
    }

    return recommendations;
  }

  // ================================================================
  // RICH RESULT ELIGIBILITY
  // ================================================================

  private checkRichResultEligibility(result: SchemaExtractionResult): RichResultEligibility[] {
    const eligibility: RichResultEligibility[] = [];

    // Breadcrumbs
    eligibility.push(this.checkBreadcrumbEligibility(result));

    // FAQ
    eligibility.push(this.checkFAQEligibility(result));

    // Product
    eligibility.push(this.checkProductEligibility(result));

    // Organization/Logo
    eligibility.push(this.checkOrganizationEligibility(result));

    // Article
    eligibility.push(this.checkArticleEligibility(result));

    // Sitelinks Searchbox
    eligibility.push(this.checkSitelinksSearchboxEligibility(result));

    return eligibility;
  }

  private checkBreadcrumbEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const breadcrumb = this.findSchemaByType(result.schemas, ['BreadcrumbList']);

    const requirements: RequirementCheck[] = [
      {
        property: 'itemListElement',
        required: true,
        present: !!breadcrumb?.raw.itemListElement,
        valid: Array.isArray(breadcrumb?.raw.itemListElement),
      },
    ];

    if (breadcrumb?.raw.itemListElement) {
      const items = breadcrumb.raw.itemListElement as Array<Record<string, unknown>>;
      requirements.push({
        property: 'position (each item)',
        required: true,
        present: items.every((i) => i.position !== undefined),
        valid: items.every((i) => typeof i.position === 'number'),
      });
    }

    return {
      type: 'Breadcrumbs',
      eligible: requirements.every((r) => !r.required || (r.present && r.valid)),
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/breadcrumb',
    };
  }

  private checkFAQEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const faq = this.findSchemaByType(result.schemas, ['FAQPage']);

    const requirements: RequirementCheck[] = [
      {
        property: 'mainEntity (Question items)',
        required: true,
        present: !!faq?.raw.mainEntity,
        valid: Array.isArray(faq?.raw.mainEntity),
      },
    ];

    return {
      type: 'FAQ',
      eligible: !!faq && requirements.every((r) => !r.required || (r.present && r.valid)),
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/faqpage',
    };
  }

  private checkProductEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const product = this.findSchemaByType(result.schemas, ['Product']);

    const requirements: RequirementCheck[] = [
      {
        property: 'name',
        required: true,
        present: !!product?.raw.name,
        valid: typeof product?.raw.name === 'string',
      },
      {
        property: 'image',
        required: true,
        present: !!product?.raw.image,
        valid: !!product?.raw.image,
      },
      {
        property: 'offers',
        required: false,
        present: !!product?.raw.offers,
        valid: !!product?.raw.offers,
      },
      {
        property: 'aggregateRating',
        required: false,
        present: !!product?.raw.aggregateRating,
        valid: !!product?.raw.aggregateRating,
      },
    ];

    return {
      type: 'Product',
      eligible: !!product && requirements.filter((r) => r.required).every((r) => r.present && r.valid),
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/product',
    };
  }

  private checkOrganizationEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const org = this.findSchemaByType(result.schemas, ['Organization', 'LocalBusiness', 'Corporation']);

    const requirements: RequirementCheck[] = [
      {
        property: 'name',
        required: true,
        present: !!org?.raw.name,
        valid: typeof org?.raw.name === 'string',
      },
      {
        property: 'url',
        required: true,
        present: !!org?.raw.url,
        valid: typeof org?.raw.url === 'string',
      },
      {
        property: 'logo',
        required: true,
        present: !!org?.raw.logo,
        valid: !!org?.raw.logo,
      },
    ];

    return {
      type: 'Organization/Logo',
      eligible: !!org && requirements.every((r) => !r.required || (r.present && r.valid)),
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/logo',
    };
  }

  private checkArticleEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const article = this.findSchemaByType(result.schemas, ['Article', 'BlogPosting', 'NewsArticle']);

    const requirements: RequirementCheck[] = [
      {
        property: 'headline',
        required: true,
        present: !!article?.raw.headline,
        valid: typeof article?.raw.headline === 'string',
      },
      {
        property: 'image',
        required: true,
        present: !!article?.raw.image,
        valid: !!article?.raw.image,
      },
      {
        property: 'datePublished',
        required: true,
        present: !!article?.raw.datePublished,
        valid: typeof article?.raw.datePublished === 'string',
      },
      {
        property: 'author',
        required: true,
        present: !!article?.raw.author,
        valid: !!article?.raw.author,
      },
    ];

    return {
      type: 'Article',
      eligible: !!article && requirements.every((r) => !r.required || (r.present && r.valid)),
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/article',
    };
  }

  private checkSitelinksSearchboxEligibility(result: SchemaExtractionResult): RichResultEligibility {
    const webSite = this.findSchemaByType(result.schemas, ['WebSite']);
    const hasSearchAction = webSite?.raw.potentialAction !== undefined;

    const requirements: RequirementCheck[] = [
      {
        property: 'WebSite schema',
        required: true,
        present: !!webSite,
        valid: !!webSite,
      },
      {
        property: 'potentialAction (SearchAction)',
        required: true,
        present: hasSearchAction,
        valid: hasSearchAction,
      },
      {
        property: 'url',
        required: true,
        present: !!webSite?.raw.url,
        valid: typeof webSite?.raw.url === 'string',
      },
    ];

    return {
      type: 'Sitelinks Searchbox',
      eligible: !!webSite && hasSearchAction,
      requirements,
      googleDocsUrl: 'https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox',
    };
  }

  // ================================================================
  // AI PERCEPTION ANALYSIS
  // ================================================================

  private analyzeAIPerception(result: SchemaExtractionResult): AIPerceptionMetrics {
    const findings: string[] = [];
    let brandIdentityScore = 0;
    let businessInfoScore = 0;
    let contentContextScore = 0;
    let socialProofScore = 0;

    // Brand Identity
    const org = this.findSchemaByType(result.schemas, ['Organization', 'LocalBusiness', 'Corporation']);
    if (org) {
      brandIdentityScore += 20;
      findings.push('Organization entity provides brand identity foundation');

      if (org.raw.name) brandIdentityScore += 10;
      if (org.raw.description) {
        brandIdentityScore += 15;
        findings.push('Brand description available for AI understanding');
      }
      if (org.raw.logo) brandIdentityScore += 10;
      if (org.raw.slogan) {
        brandIdentityScore += 5;
        findings.push('Brand slogan captured');
      }
      if (org.raw.sameAs) {
        brandIdentityScore += 10;
        findings.push('Social identity links connected');
      }
    }

    // Business Information
    if (org) {
      if (org.raw.address) {
        businessInfoScore += 15;
        findings.push('Physical/business address structured');
      }
      if (org.raw.telephone || org.raw.contactPoint) {
        businessInfoScore += 15;
        findings.push('Contact information structured');
      }
      if (org.raw.email) businessInfoScore += 10;
      if (org.raw.foundingDate) {
        businessInfoScore += 10;
        findings.push('Founding date provides historical context');
      }
      if (org.raw.numberOfEmployees) businessInfoScore += 10;
      if (org.raw.areaServed) {
        businessInfoScore += 10;
        findings.push('Service area defined');
      }
    }

    // Content Context
    if (result.summary.hasWebSite) {
      contentContextScore += 15;
    }
    if (result.summary.hasWebPage) {
      contentContextScore += 10;
    }
    if (result.summary.hasBreadcrumbs) {
      contentContextScore += 15;
      findings.push('Navigation context via breadcrumbs');
    }
    if (result.summary.hasArticle) {
      contentContextScore += 15;
      findings.push('Article content properly structured');
    }
    if (result.summary.hasFAQ) {
      contentContextScore += 20;
      findings.push('FAQ content easily parseable by AI');
    }

    // Social Proof
    if (result.summary.hasReviews) {
      socialProofScore += 40;
      findings.push('Reviews provide social proof signals');
    }
    const aggRating = this.findSchemaByType(result.schemas, ['AggregateRating']);
    if (aggRating) {
      socialProofScore += 30;
      findings.push('Aggregate rating summarizes customer sentiment');
    }

    // Calculate overall AI readiness
    const aiReadinessScore = Math.round(
      (brandIdentityScore * 0.35 +
        businessInfoScore * 0.25 +
        contentContextScore * 0.25 +
        socialProofScore * 0.15)
    );

    return {
      brandIdentityScore: Math.min(100, brandIdentityScore),
      businessInfoScore: Math.min(100, businessInfoScore),
      contentContextScore: Math.min(100, contentContextScore),
      socialProofScore: Math.min(100, socialProofScore),
      aiReadinessScore: Math.min(100, aiReadinessScore),
      findings,
    };
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  private findSchemaByType(
    schemas: ExtractedSchema[],
    types: string[]
  ): ExtractedSchema | undefined {
    return schemas.find((s) => {
      const schemaTypes = Array.isArray(s.type) ? s.type : [s.type];
      return schemaTypes.some((t) => types.includes(t));
    });
  }

  private checkOrganizationFields(schema: ExtractedSchema): { score: number; details: string[] } {
    let score = 0;
    const details: string[] = [];
    const raw = schema.raw;

    if (raw.name) { score += 2; details.push('Organization has name'); }
    if (raw.url) { score += 1; }
    if (raw.logo) { score += 2; details.push('Organization has logo'); }
    if (raw.description) { score += 2; details.push('Organization has description'); }
    if (raw.contactPoint) { score += 1; }
    if (raw.sameAs) { score += 1; details.push('Organization linked to social profiles'); }
    if (raw.address) { score += 1; }

    return { score, details };
  }

  private checkWebSiteFields(schema: ExtractedSchema): { score: number; details: string[] } {
    let score = 0;
    const details: string[] = [];
    const raw = schema.raw;

    if (raw.name) { score += 2; details.push('WebSite has name'); }
    if (raw.url) { score += 2; }
    if (raw.potentialAction) { score += 4; details.push('WebSite has SearchAction'); }

    return { score, details };
  }
}

// ================================================================
// CONVENIENCE FUNCTION
// ================================================================

/**
 * Analyze schema quality from extraction result
 */
export function analyzeSchemaQuality(result: SchemaExtractionResult): SchemaQualityAnalysis {
  const analyzer = new SchemaAnalyzer();
  return analyzer.analyze(result);
}
