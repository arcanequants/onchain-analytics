/**
 * Entity Extractor for Knowledge Graph
 *
 * Phase 1, Week 2, Day 5
 *
 * Extracts named entities from text and structured data
 * for building knowledge graph representations.
 *
 * Supported entity types:
 * - Organizations (companies, brands)
 * - Products
 * - People
 * - Locations
 * - Technologies
 * - Services
 */

// ================================================================
// TYPES
// ================================================================

export type EntityType =
  | 'organization'
  | 'product'
  | 'person'
  | 'location'
  | 'technology'
  | 'service'
  | 'industry'
  | 'concept'
  | 'monetary'
  | 'temporal'
  | 'url'
  | 'unknown';

export interface Entity {
  /** Unique ID for this entity instance */
  id: string;
  /** The entity type */
  type: EntityType;
  /** The raw text value */
  value: string;
  /** Normalized/canonical value */
  normalizedValue: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Start position in source text */
  startIndex?: number;
  /** End position in source text */
  endIndex?: number;
  /** Additional metadata */
  metadata?: EntityMetadata;
  /** Related entities */
  relations?: EntityRelation[];
}

export interface EntityMetadata {
  /** Source of extraction */
  source?: 'text' | 'schema' | 'meta' | 'inferred';
  /** Alternative names/aliases */
  aliases?: string[];
  /** External identifiers (Wikipedia ID, etc.) */
  externalIds?: Record<string, string>;
  /** Category/subcategory */
  category?: string;
  /** Sentiment associated with entity */
  sentiment?: number;
  /** Frequency count in source */
  frequency?: number;
  /** Is this the primary/main entity? */
  isPrimary?: boolean;
}

export interface EntityRelation {
  /** Related entity ID */
  targetId: string;
  /** Relationship type */
  relationType: RelationType;
  /** Confidence in the relation */
  confidence: number;
}

export type RelationType =
  | 'owns'
  | 'part_of'
  | 'located_in'
  | 'produces'
  | 'competes_with'
  | 'founded_by'
  | 'works_at'
  | 'uses'
  | 'similar_to'
  | 'related_to';

export interface ExtractionResult {
  /** All extracted entities */
  entities: Entity[];
  /** Primary/main entity if identified */
  primaryEntity?: Entity;
  /** Extraction metadata */
  metadata: {
    sourceLength: number;
    processingTimeMs: number;
    extractorVersion: string;
  };
}

export interface ExtractorConfig {
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Entity types to extract */
  entityTypes?: EntityType[];
  /** Maximum entities to return */
  maxEntities?: number;
  /** Enable relation extraction */
  extractRelations?: boolean;
  /** Enable sentiment per entity */
  extractSentiment?: boolean;
}

// ================================================================
// PATTERNS
// ================================================================

const PATTERNS = {
  // Organization patterns
  organization: [
    /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:Inc\.?|Corp\.?|LLC|Ltd\.?|Company|Co\.?|Group|Holdings?)\b/g,
    /\b(?:Google|Microsoft|Apple|Amazon|Meta|Facebook|Netflix|Tesla|OpenAI|Anthropic|Salesforce|Adobe|IBM|Intel|AMD|NVIDIA|Oracle|SAP|Cisco|HP|Dell|Samsung|Sony|Nintendo|Uber|Lyft|Airbnb|Stripe|Square|Shopify|Twilio|Zoom|Slack|Atlassian|GitHub|GitLab|Docker|Kubernetes|MongoDB|Redis|Elastic|Snowflake|Databricks|Palantir|SpaceX|Blue Origin)\b/gi,
  ],
  // Product patterns
  product: [
    /\b([A-Z][a-zA-Z0-9]*)\s+(?:Pro|Plus|Premium|Enterprise|Basic|Lite|Mini|Max|Ultra)\b/g,
    /\b(?:iPhone|iPad|MacBook|iMac|Apple Watch|AirPods|Windows|Office|Azure|AWS|GCP|Android|Chrome|Firefox|Safari|VS Code|Visual Studio|ChatGPT|GPT-4|Claude|Gemini|Copilot|GitHub Copilot|Notion|Figma|Sketch|Photoshop|Illustrator|Premiere|Final Cut|Logic Pro|Ableton|Unity|Unreal Engine)\b/gi,
  ],
  // Technology patterns
  technology: [
    /\b(?:JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|Go|Rust|Swift|Kotlin|PHP|Perl|R|Scala|Elixir|Clojure|Haskell|SQL|NoSQL|GraphQL|REST|gRPC|WebSocket|HTTP|HTTPS|TLS|SSL|OAuth|JWT|API|SDK|CLI|GUI|AI|ML|NLP|LLM|GPT|Transformer|Neural Network|Deep Learning|Machine Learning|Blockchain|Cryptocurrency|Cloud|SaaS|PaaS|IaaS|DevOps|CI\/CD|Kubernetes|Docker|Terraform|Ansible|Jenkins|Git|SVN)\b/gi,
  ],
  // Location patterns
  location: [
    /\b(?:San Francisco|New York|Los Angeles|Seattle|Austin|Boston|Chicago|Denver|Miami|Atlanta|Toronto|Vancouver|London|Paris|Berlin|Amsterdam|Stockholm|Singapore|Hong Kong|Tokyo|Sydney|Melbourne|Tel Aviv|Bangalore|Mumbai|Beijing|Shanghai|Seoul)\b/gi,
    /\b(?:California|Texas|Washington|Massachusetts|Colorado|Florida|Georgia|Ontario|Quebec|England|Germany|France|Netherlands|Sweden|Japan|Australia|India|China|South Korea|Israel)\b/gi,
    /\b(?:United States|USA|US|UK|United Kingdom|Canada|European Union|EU)\b/gi,
  ],
  // Person name patterns (basic)
  person: [
    /\b(?:Elon Musk|Jeff Bezos|Bill Gates|Mark Zuckerberg|Tim Cook|Satya Nadella|Sundar Pichai|Sam Altman|Dario Amodei|Jensen Huang)\b/gi,
    /\b(?:CEO|CTO|CFO|COO|Founder|Co-founder)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
  ],
  // Monetary values
  monetary: [
    /\$\s*[\d,]+(?:\.\d{2})?\s*(?:million|billion|trillion|M|B|K)?/gi,
    /(?:USD|EUR|GBP|JPY|CAD|AUD)\s*[\d,]+(?:\.\d{2})?/gi,
  ],
  // Temporal patterns
  temporal: [
    /\b(?:Q[1-4]\s+20\d{2}|20\d{2}|FY\s*20\d{2})\b/gi,
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2}\b/gi,
  ],
  // URL patterns
  url: [
    /https?:\/\/(?:www\.)?[\w.-]+\.[a-z]{2,}(?:\/[\w.-]*)*\/?/gi,
  ],
  // Industry patterns
  industry: [
    /\b(?:fintech|healthtech|edtech|proptech|insurtech|regtech|foodtech|agritech|cleantech|biotech|medtech|martech|adtech|legaltech|hrtech|cybersecurity|e-commerce|ecommerce|social media|cloud computing|artificial intelligence|machine learning|blockchain|cryptocurrency|saas|enterprise software|consumer electronics|automotive|aerospace|telecommunications|healthcare|pharmaceuticals|banking|insurance|retail|manufacturing|logistics|transportation|entertainment|media|gaming|hospitality|real estate)\b/gi,
  ],
};

// ================================================================
// ENTITY EXTRACTOR CLASS
// ================================================================

export class EntityExtractor {
  private config: Required<ExtractorConfig>;
  private entityCounter = 0;

  constructor(config: ExtractorConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence ?? 0.5,
      entityTypes: config.entityTypes ?? [
        'organization',
        'product',
        'person',
        'location',
        'technology',
        'service',
        'industry',
        'monetary',
        'temporal',
        'url',
      ],
      maxEntities: config.maxEntities ?? 100,
      extractRelations: config.extractRelations ?? false,
      extractSentiment: config.extractSentiment ?? false,
    };
  }

  /**
   * Extract entities from text
   */
  extract(text: string): ExtractionResult {
    const startTime = performance.now();
    const entities: Entity[] = [];
    const seen = new Set<string>();

    // Extract each entity type
    for (const entityType of this.config.entityTypes) {
      const patterns = PATTERNS[entityType as keyof typeof PATTERNS];
      if (!patterns) continue;

      for (const pattern of patterns) {
        // Reset regex state
        pattern.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.exec(text)) !== null) {
          const value = match[1] || match[0];
          const normalizedValue = this.normalize(value);
          const key = `${entityType}:${normalizedValue}`;

          if (seen.has(key)) {
            // Update frequency for existing entity
            const existing = entities.find(
              e => e.type === entityType && e.normalizedValue === normalizedValue
            );
            if (existing?.metadata) {
              existing.metadata.frequency = (existing.metadata.frequency || 1) + 1;
            }
            continue;
          }

          seen.add(key);

          const confidence = this.calculateConfidence(value, entityType);
          if (confidence < this.config.minConfidence) continue;

          entities.push({
            id: this.generateId(),
            type: entityType,
            value: value.trim(),
            normalizedValue,
            confidence,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            metadata: {
              source: 'text',
              frequency: 1,
            },
          });

          if (entities.length >= this.config.maxEntities) break;
        }

        if (entities.length >= this.config.maxEntities) break;
      }

      if (entities.length >= this.config.maxEntities) break;
    }

    // Sort by confidence and frequency
    entities.sort((a, b) => {
      const scoreA = a.confidence * (a.metadata?.frequency || 1);
      const scoreB = b.confidence * (b.metadata?.frequency || 1);
      return scoreB - scoreA;
    });

    // Identify primary entity
    const primaryEntity = this.identifyPrimaryEntity(entities, text);
    if (primaryEntity) {
      primaryEntity.metadata = {
        ...primaryEntity.metadata,
        isPrimary: true,
      };
    }

    // Extract relations if enabled
    if (this.config.extractRelations) {
      this.extractRelations(entities);
    }

    const endTime = performance.now();

    return {
      entities: entities.slice(0, this.config.maxEntities),
      primaryEntity,
      metadata: {
        sourceLength: text.length,
        processingTimeMs: Math.round(endTime - startTime),
        extractorVersion: '1.0.0',
      },
    };
  }

  /**
   * Extract entities from Schema.org data
   */
  extractFromSchema(schema: Record<string, unknown>): Entity[] {
    const entities: Entity[] = [];
    const type = schema['@type'] as string | undefined;

    if (!type) return entities;

    // Organization
    if (type === 'Organization' || type === 'Corporation' || type === 'LocalBusiness') {
      const name = schema.name as string;
      if (name) {
        entities.push({
          id: this.generateId(),
          type: 'organization',
          value: name,
          normalizedValue: this.normalize(name),
          confidence: 0.95,
          metadata: {
            source: 'schema',
            isPrimary: true,
            externalIds: schema.sameAs
              ? { sameAs: Array.isArray(schema.sameAs) ? schema.sameAs[0] : schema.sameAs as string }
              : undefined,
          },
        });
      }

      // Location from address
      const address = schema.address as Record<string, unknown> | undefined;
      if (address?.addressLocality) {
        entities.push({
          id: this.generateId(),
          type: 'location',
          value: address.addressLocality as string,
          normalizedValue: this.normalize(address.addressLocality as string),
          confidence: 0.9,
          metadata: { source: 'schema' },
        });
      }
    }

    // Product
    if (type === 'Product' || type === 'SoftwareApplication') {
      const name = schema.name as string;
      if (name) {
        entities.push({
          id: this.generateId(),
          type: 'product',
          value: name,
          normalizedValue: this.normalize(name),
          confidence: 0.95,
          metadata: { source: 'schema' },
        });
      }

      // Brand as organization
      const brand = schema.brand as Record<string, unknown> | undefined;
      if (brand?.name) {
        entities.push({
          id: this.generateId(),
          type: 'organization',
          value: brand.name as string,
          normalizedValue: this.normalize(brand.name as string),
          confidence: 0.9,
          metadata: { source: 'schema' },
        });
      }
    }

    // Person
    if (type === 'Person') {
      const name = schema.name as string;
      if (name) {
        entities.push({
          id: this.generateId(),
          type: 'person',
          value: name,
          normalizedValue: this.normalize(name),
          confidence: 0.95,
          metadata: {
            source: 'schema',
            category: schema.jobTitle as string | undefined,
          },
        });
      }
    }

    // Article - extract mentions
    if (type === 'Article' || type === 'NewsArticle' || type === 'BlogPosting') {
      const author = schema.author as Record<string, unknown> | undefined;
      if (author?.name) {
        entities.push({
          id: this.generateId(),
          type: 'person',
          value: author.name as string,
          normalizedValue: this.normalize(author.name as string),
          confidence: 0.85,
          metadata: { source: 'schema', category: 'author' },
        });
      }

      const publisher = schema.publisher as Record<string, unknown> | undefined;
      if (publisher?.name) {
        entities.push({
          id: this.generateId(),
          type: 'organization',
          value: publisher.name as string,
          normalizedValue: this.normalize(publisher.name as string),
          confidence: 0.85,
          metadata: { source: 'schema', category: 'publisher' },
        });
      }
    }

    return entities;
  }

  /**
   * Merge entities from multiple sources
   */
  mergeEntities(entitySets: Entity[][]): Entity[] {
    const merged = new Map<string, Entity>();

    for (const entities of entitySets) {
      for (const entity of entities) {
        const key = `${entity.type}:${entity.normalizedValue}`;

        if (merged.has(key)) {
          const existing = merged.get(key)!;
          // Merge: take higher confidence, combine metadata
          existing.confidence = Math.max(existing.confidence, entity.confidence);
          existing.metadata = {
            ...existing.metadata,
            ...entity.metadata,
            frequency: (existing.metadata?.frequency || 1) + (entity.metadata?.frequency || 1),
            aliases: [
              ...(existing.metadata?.aliases || []),
              ...(entity.metadata?.aliases || []),
            ].filter((v, i, a) => a.indexOf(v) === i),
          };
          if (entity.metadata?.isPrimary) {
            existing.metadata.isPrimary = true;
          }
        } else {
          merged.set(key, { ...entity });
        }
      }
    }

    return Array.from(merged.values()).sort((a, b) => b.confidence - a.confidence);
  }

  // ================================================================
  // PRIVATE METHODS
  // ================================================================

  private generateId(): string {
    return `entity_${++this.entityCounter}_${Date.now()}`;
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '_')
      .trim();
  }

  private calculateConfidence(value: string, type: EntityType): number {
    let confidence = 0.6; // Base confidence

    // Longer values tend to be more reliable
    if (value.length > 3) confidence += 0.1;
    if (value.length > 10) confidence += 0.1;

    // Proper capitalization indicates entity
    if (/^[A-Z]/.test(value)) confidence += 0.1;

    // Multiple words
    if (value.includes(' ')) confidence += 0.05;

    // Type-specific adjustments
    if (type === 'organization' && /(?:Inc|Corp|LLC|Ltd|Company)/i.test(value)) {
      confidence += 0.15;
    }
    if (type === 'url') {
      confidence = 0.95; // URLs are very reliable
    }
    if (type === 'monetary') {
      confidence = 0.9;
    }

    return Math.min(1, confidence);
  }

  private identifyPrimaryEntity(entities: Entity[], text: string): Entity | undefined {
    // Primary entity is usually the most frequently mentioned organization
    // or appears in the first sentence/paragraph
    const firstParagraph = text.slice(0, 500);
    const organizations = entities.filter(e => e.type === 'organization');

    // Check for entity in first paragraph with high frequency
    for (const org of organizations) {
      const inFirstPara = firstParagraph.toLowerCase().includes(org.normalizedValue.replace(/_/g, ' '));
      if (inFirstPara && (org.metadata?.frequency || 1) >= 2) {
        return org;
      }
    }

    // Fall back to highest confidence organization
    return organizations[0];
  }

  private extractRelations(entities: Entity[]): void {
    // Simple co-occurrence based relation extraction
    const organizations = entities.filter(e => e.type === 'organization');
    const products = entities.filter(e => e.type === 'product');
    const locations = entities.filter(e => e.type === 'location');
    const people = entities.filter(e => e.type === 'person');

    // Organization produces Product
    for (const org of organizations) {
      for (const product of products) {
        org.relations = org.relations || [];
        org.relations.push({
          targetId: product.id,
          relationType: 'produces',
          confidence: 0.7,
        });
      }
    }

    // Organization located_in Location
    for (const org of organizations) {
      for (const location of locations) {
        org.relations = org.relations || [];
        org.relations.push({
          targetId: location.id,
          relationType: 'located_in',
          confidence: 0.6,
        });
      }
    }

    // Person works_at Organization
    for (const person of people) {
      for (const org of organizations) {
        person.relations = person.relations || [];
        person.relations.push({
          targetId: org.id,
          relationType: 'works_at',
          confidence: 0.5,
        });
      }
    }
  }
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

/**
 * Quick extraction with default settings
 */
export function extractEntities(text: string): Entity[] {
  const extractor = new EntityExtractor();
  return extractor.extract(text).entities;
}

/**
 * Extract only organizations
 */
export function extractOrganizations(text: string): Entity[] {
  const extractor = new EntityExtractor({ entityTypes: ['organization'] });
  return extractor.extract(text).entities;
}

/**
 * Extract with relations
 */
export function extractWithRelations(text: string): ExtractionResult {
  const extractor = new EntityExtractor({ extractRelations: true });
  return extractor.extract(text);
}

// ================================================================
// EXPORTS
// ================================================================

export default EntityExtractor;
