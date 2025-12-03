/**
 * Wikidata Link Checker Module
 *
 * Phase 2, Week 3, Day 4
 *
 * Checks and validates brand presence in Wikidata, the structured data
 * backbone of Wikipedia that AI models heavily rely on.
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Wikidata entity types relevant for brands
 */
export type WikidataEntityType =
  | 'business'
  | 'organization'
  | 'product'
  | 'software'
  | 'website'
  | 'brand'
  | 'person'
  | 'unknown';

/**
 * Wikidata property
 */
export interface WikidataProperty {
  /** Property ID (e.g., P31) */
  id: string;
  /** Property label */
  label: string;
  /** Property value */
  value: string;
  /** Value type */
  valueType: 'entity' | 'string' | 'quantity' | 'time' | 'url';
  /** Linked entity ID (if valueType is entity) */
  linkedEntityId?: string;
}

/**
 * Wikidata entity representation
 */
export interface WikidataEntity {
  /** Entity ID (Q-number) */
  id: string;
  /** Entity label */
  label: string;
  /** Entity description */
  description?: string;
  /** Aliases */
  aliases: string[];
  /** Entity type */
  entityType: WikidataEntityType;
  /** Key properties */
  properties: WikidataProperty[];
  /** Wikipedia URL */
  wikipediaUrl?: string;
  /** Official website */
  officialWebsite?: string;
  /** Image URL */
  imageUrl?: string;
  /** Last modified */
  lastModified?: string;
}

/**
 * Wikidata check result
 */
export interface WikidataCheckResult {
  /** Brand name searched */
  brandName: string;
  /** Whether entity was found */
  found: boolean;
  /** Matched entity */
  entity?: WikidataEntity;
  /** Confidence in match (0-1) */
  matchConfidence: number;
  /** Alternative matches */
  alternatives: WikidataEntity[];
  /** Completeness score (0-100) */
  completenessScore: number;
  /** Missing properties */
  missingProperties: MissingProperty[];
  /** Recommendations */
  recommendations: WikidataRecommendation[];
  /** Check timestamp */
  checkedAt: string;
}

/**
 * Missing property
 */
export interface MissingProperty {
  /** Property ID */
  propertyId: string;
  /** Property label */
  label: string;
  /** Why it's important */
  importance: string;
  /** Priority */
  priority: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Wikidata recommendation
 */
export interface WikidataRecommendation {
  /** Recommendation type */
  type: 'create-entity' | 'add-property' | 'update-property' | 'add-alias' | 'link-wikipedia';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Impact on AI visibility */
  aiImpact: string;
  /** How to implement */
  howTo: string[];
}

/**
 * Check options
 */
export interface WikidataCheckOptions {
  /** Include alternative matches */
  includeAlternatives?: boolean;
  /** Maximum alternatives */
  maxAlternatives?: number;
  /** Language for labels */
  language?: string;
  /** Brand's official website (for matching) */
  officialWebsite?: string;
  /** Industry for context */
  industry?: string;
}

// ================================================================
// IMPORTANT WIKIDATA PROPERTIES
// ================================================================

/**
 * Key properties for brand entities in Wikidata
 */
const IMPORTANT_PROPERTIES: Record<string, { label: string; importance: string; priority: 'critical' | 'high' | 'medium' | 'low' }> = {
  // Identity
  P31: { label: 'instance of', importance: 'Defines what type of entity this is', priority: 'critical' },
  P154: { label: 'logo image', importance: 'Visual brand recognition', priority: 'high' },
  P856: { label: 'official website', importance: 'Validates brand authenticity', priority: 'critical' },

  // Organization info
  P571: { label: 'inception', importance: 'When the organization was founded', priority: 'high' },
  P159: { label: 'headquarters location', importance: 'Physical location of headquarters', priority: 'medium' },
  P452: { label: 'industry', importance: 'What industry the company operates in', priority: 'high' },
  P112: { label: 'founded by', importance: 'Founders of the organization', priority: 'medium' },
  P169: { label: 'chief executive officer', importance: 'Current CEO', priority: 'medium' },

  // Business info
  P2139: { label: 'total revenue', importance: 'Company revenue', priority: 'low' },
  P1128: { label: 'employees', importance: 'Number of employees', priority: 'low' },
  P414: { label: 'stock exchange', importance: 'Where stock is traded', priority: 'low' },
  P249: { label: 'ticker symbol', importance: 'Stock ticker', priority: 'low' },

  // Online presence
  P2002: { label: 'Twitter username', importance: 'Twitter/X social presence', priority: 'medium' },
  P2003: { label: 'Instagram username', importance: 'Instagram social presence', priority: 'low' },
  P2013: { label: 'Facebook ID', importance: 'Facebook social presence', priority: 'low' },
  P2035: { label: 'LinkedIn company ID', importance: 'LinkedIn presence', priority: 'medium' },
  P4264: { label: 'LinkedIn personal profile ID', importance: 'Personal LinkedIn', priority: 'low' },

  // External IDs
  P3225: { label: 'Crunchbase organization ID', importance: 'Links to Crunchbase profile', priority: 'high' },
  P5531: { label: 'Glassdoor company ID', importance: 'Links to Glassdoor', priority: 'medium' },
  P6366: { label: 'Microsoft Academic ID', importance: 'Academic recognition', priority: 'low' },

  // Products & Services
  P1056: { label: 'product or material produced', importance: 'What the company produces', priority: 'high' },
  P366: { label: 'use', importance: 'What the product/service is used for', priority: 'medium' },
};

// ================================================================
// ENTITY TYPE DETECTION
// ================================================================

/**
 * Determine entity type from properties
 */
function detectEntityType(properties: WikidataProperty[]): WikidataEntityType {
  const instanceOf = properties.find(p => p.id === 'P31');

  if (!instanceOf) return 'unknown';

  const value = instanceOf.value.toLowerCase();

  if (value.includes('business') || value.includes('company') || value.includes('enterprise')) {
    return 'business';
  }
  if (value.includes('organization') || value.includes('nonprofit')) {
    return 'organization';
  }
  if (value.includes('software') || value.includes('application')) {
    return 'software';
  }
  if (value.includes('product')) {
    return 'product';
  }
  if (value.includes('website') || value.includes('web')) {
    return 'website';
  }
  if (value.includes('brand') || value.includes('trademark')) {
    return 'brand';
  }
  if (value.includes('human') || value.includes('person')) {
    return 'person';
  }

  return 'unknown';
}

// ================================================================
// MOCK WIKIDATA API
// ================================================================

/**
 * Mock Wikidata search (in production, this would call the actual API)
 *
 * Wikidata API endpoint: https://www.wikidata.org/w/api.php
 *
 * Example search:
 * ?action=wbsearchentities&search=Microsoft&language=en&format=json
 */
async function searchWikidata(
  query: string,
  _options: WikidataCheckOptions
): Promise<WikidataEntity[]> {
  // In production, this would make actual API calls
  // For now, return mock data for known companies

  const knownEntities: Record<string, WikidataEntity> = {
    microsoft: {
      id: 'Q2283',
      label: 'Microsoft',
      description: 'American multinational technology corporation',
      aliases: ['Microsoft Corporation', 'MSFT', 'MS'],
      entityType: 'business',
      properties: [
        { id: 'P31', label: 'instance of', value: 'business', valueType: 'entity' },
        { id: 'P856', label: 'official website', value: 'https://microsoft.com', valueType: 'url' },
        { id: 'P571', label: 'inception', value: '1975', valueType: 'time' },
        { id: 'P159', label: 'headquarters', value: 'Redmond, Washington', valueType: 'string' },
        { id: 'P452', label: 'industry', value: 'software industry', valueType: 'entity' },
        { id: 'P154', label: 'logo image', value: 'Microsoft logo (2012).svg', valueType: 'string' },
        { id: 'P2002', label: 'Twitter username', value: 'Microsoft', valueType: 'string' },
        { id: 'P3225', label: 'Crunchbase ID', value: 'microsoft', valueType: 'string' },
      ],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Microsoft',
      officialWebsite: 'https://microsoft.com',
    },
    google: {
      id: 'Q95',
      label: 'Google',
      description: 'American multinational technology company',
      aliases: ['Google LLC', 'Google Inc.', 'GOOGL'],
      entityType: 'business',
      properties: [
        { id: 'P31', label: 'instance of', value: 'business', valueType: 'entity' },
        { id: 'P856', label: 'official website', value: 'https://google.com', valueType: 'url' },
        { id: 'P571', label: 'inception', value: '1998', valueType: 'time' },
        { id: 'P452', label: 'industry', value: 'technology', valueType: 'entity' },
      ],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/Google',
      officialWebsite: 'https://google.com',
    },
    openai: {
      id: 'Q21063165',
      label: 'OpenAI',
      description: 'American artificial intelligence research laboratory',
      aliases: ['OpenAI LP', 'OpenAI Inc'],
      entityType: 'organization',
      properties: [
        { id: 'P31', label: 'instance of', value: 'organization', valueType: 'entity' },
        { id: 'P856', label: 'official website', value: 'https://openai.com', valueType: 'url' },
        { id: 'P571', label: 'inception', value: '2015', valueType: 'time' },
        { id: 'P452', label: 'industry', value: 'artificial intelligence', valueType: 'entity' },
      ],
      wikipediaUrl: 'https://en.wikipedia.org/wiki/OpenAI',
      officialWebsite: 'https://openai.com',
    },
  };

  const queryLower = query.toLowerCase();

  // Direct match
  if (knownEntities[queryLower]) {
    return [knownEntities[queryLower]];
  }

  // Partial match
  const matches: WikidataEntity[] = [];
  for (const [key, entity] of Object.entries(knownEntities)) {
    if (
      key.includes(queryLower) ||
      entity.label.toLowerCase().includes(queryLower) ||
      entity.aliases.some(a => a.toLowerCase().includes(queryLower))
    ) {
      matches.push(entity);
    }
  }

  return matches;
}

// ================================================================
// CHECK FUNCTIONS
// ================================================================

/**
 * Check brand presence in Wikidata
 */
export async function checkWikidataPresence(
  brandName: string,
  options: WikidataCheckOptions = {}
): Promise<WikidataCheckResult> {
  const {
    includeAlternatives = true,
    maxAlternatives = 5,
  } = options;

  // Search Wikidata
  const entities = await searchWikidata(brandName, options);

  if (entities.length === 0) {
    // No entity found
    return {
      brandName,
      found: false,
      matchConfidence: 0,
      alternatives: [],
      completenessScore: 0,
      missingProperties: [],
      recommendations: [
        {
          type: 'create-entity',
          priority: 'high',
          title: 'Create Wikidata Entity',
          description: `No Wikidata entity found for "${brandName}". Creating one is essential for AI visibility.`,
          aiImpact: 'Wikidata is a primary knowledge source for AI models. Without a Wikidata entry, AI systems may not recognize your brand.',
          howTo: [
            'Go to https://www.wikidata.org/wiki/Special:NewItem',
            'Add a label and description in English',
            'Set "instance of" (P31) to the appropriate type (e.g., business, software)',
            'Add your official website (P856)',
            'Add any Wikipedia article links if they exist',
          ],
        },
        {
          type: 'link-wikipedia',
          priority: 'high',
          title: 'Establish Wikipedia Notability',
          description: 'Consider building Wikipedia notability to support a Wikidata entry.',
          aiImpact: 'Wikipedia articles are often prerequisite for notable Wikidata entries.',
          howTo: [
            'Generate third-party press coverage',
            'Get cited in industry publications',
            'Build verifiable notability through awards, publications, or significant coverage',
          ],
        },
      ],
      checkedAt: new Date().toISOString(),
    };
  }

  // Found entity(ies)
  const primaryEntity = entities[0];
  const alternatives = includeAlternatives ? entities.slice(1, maxAlternatives + 1) : [];

  // Calculate match confidence
  const matchConfidence = calculateMatchConfidence(brandName, primaryEntity, options);

  // Calculate completeness
  const { completenessScore, missingProperties } = calculateCompleteness(primaryEntity);

  // Generate recommendations
  const recommendations = generateWikidataRecommendations(
    primaryEntity,
    missingProperties,
    completenessScore
  );

  return {
    brandName,
    found: true,
    entity: primaryEntity,
    matchConfidence,
    alternatives,
    completenessScore,
    missingProperties,
    recommendations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Validate existing Wikidata entity
 */
export async function validateWikidataEntity(
  entityId: string
): Promise<WikidataEntity | null> {
  // In production, fetch from Wikidata API
  // For now, return null (entity not found in mock)
  return null;
}

/**
 * Get Wikidata entity by Q-number
 */
export async function getWikidataEntity(
  qNumber: string
): Promise<WikidataEntity | null> {
  // In production, this would call:
  // https://www.wikidata.org/wiki/Special:EntityData/{qNumber}.json

  // For now, return null
  return null;
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function calculateMatchConfidence(
  brandName: string,
  entity: WikidataEntity,
  options: WikidataCheckOptions
): number {
  let confidence = 0.5; // Base confidence

  const brandLower = brandName.toLowerCase();
  const labelLower = entity.label.toLowerCase();

  // Exact label match
  if (labelLower === brandLower) {
    confidence += 0.3;
  } else if (labelLower.includes(brandLower) || brandLower.includes(labelLower)) {
    confidence += 0.15;
  }

  // Alias match
  if (entity.aliases.some(a => a.toLowerCase() === brandLower)) {
    confidence += 0.15;
  }

  // Website match
  if (options.officialWebsite && entity.officialWebsite) {
    const optionsDomain = extractDomain(options.officialWebsite);
    const entityDomain = extractDomain(entity.officialWebsite);
    if (optionsDomain && entityDomain && optionsDomain === entityDomain) {
      confidence += 0.2;
    }
  }

  // Has Wikipedia link
  if (entity.wikipediaUrl) {
    confidence += 0.1;
  }

  return Math.min(1, confidence);
}

function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function calculateCompleteness(entity: WikidataEntity): {
  completenessScore: number;
  missingProperties: MissingProperty[];
} {
  const missing: MissingProperty[] = [];
  let totalWeight = 0;
  let earnedWeight = 0;

  const priorityWeights: Record<string, number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  for (const [propId, propInfo] of Object.entries(IMPORTANT_PROPERTIES)) {
    const weight = priorityWeights[propInfo.priority];
    totalWeight += weight;

    const hasProperty = entity.properties.some(p => p.id === propId);
    if (hasProperty) {
      earnedWeight += weight;
    } else {
      missing.push({
        propertyId: propId,
        label: propInfo.label,
        importance: propInfo.importance,
        priority: propInfo.priority,
      });
    }
  }

  const completenessScore = totalWeight > 0
    ? Math.round((earnedWeight / totalWeight) * 100)
    : 0;

  // Sort missing by priority
  const priorityOrder = ['critical', 'high', 'medium', 'low'];
  missing.sort((a, b) =>
    priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority)
  );

  return { completenessScore, missingProperties: missing };
}

function generateWikidataRecommendations(
  entity: WikidataEntity,
  missingProperties: MissingProperty[],
  completenessScore: number
): WikidataRecommendation[] {
  const recommendations: WikidataRecommendation[] = [];

  // Critical missing properties
  const criticalMissing = missingProperties.filter(p => p.priority === 'critical');
  for (const prop of criticalMissing) {
    recommendations.push({
      type: 'add-property',
      priority: 'high',
      title: `Add ${prop.label} (${prop.propertyId})`,
      description: `${prop.importance}. This is a critical property.`,
      aiImpact: 'Critical properties are essential for AI systems to understand and represent your brand correctly.',
      howTo: [
        `Go to https://www.wikidata.org/wiki/${entity.id}`,
        `Click "add statement"`,
        `Search for property "${prop.label}" or enter ${prop.propertyId}`,
        'Add the appropriate value with references',
      ],
    });
  }

  // High priority missing
  const highMissing = missingProperties.filter(p => p.priority === 'high').slice(0, 3);
  for (const prop of highMissing) {
    recommendations.push({
      type: 'add-property',
      priority: 'medium',
      title: `Add ${prop.label} (${prop.propertyId})`,
      description: prop.importance,
      aiImpact: 'High-priority properties improve AI understanding of your brand context.',
      howTo: [
        `Edit Wikidata entity ${entity.id}`,
        `Add statement for ${prop.propertyId}`,
        'Include reliable references',
      ],
    });
  }

  // Low completeness
  if (completenessScore < 50) {
    recommendations.push({
      type: 'add-property',
      priority: 'high',
      title: 'Improve Wikidata Completeness',
      description: `Your Wikidata entry is only ${completenessScore}% complete. More data improves AI visibility.`,
      aiImpact: 'More complete entries are more likely to be referenced by AI systems.',
      howTo: [
        'Review the missing properties list',
        'Gather verifiable information for each',
        'Add statements with reliable references',
        'Consider adding social media links',
      ],
    });
  }

  // No aliases
  if (entity.aliases.length === 0) {
    recommendations.push({
      type: 'add-alias',
      priority: 'medium',
      title: 'Add Alternative Names (Aliases)',
      description: 'Add common variations of your brand name as aliases.',
      aiImpact: 'Aliases help AI systems recognize different ways users might refer to your brand.',
      howTo: [
        `Go to https://www.wikidata.org/wiki/${entity.id}`,
        'Click "add" next to "Also known as"',
        'Add common abbreviations, full names, and alternative spellings',
      ],
    });
  }

  // No Wikipedia link
  if (!entity.wikipediaUrl) {
    recommendations.push({
      type: 'link-wikipedia',
      priority: 'high',
      title: 'Link to Wikipedia Article',
      description: 'Connect your Wikidata entry to a Wikipedia article.',
      aiImpact: 'Wikipedia articles are heavily weighted by AI training. A linked article significantly boosts visibility.',
      howTo: [
        'First, ensure a Wikipedia article exists (create if notable)',
        'On the Wikipedia article, add a link to Wikidata',
        'Or on Wikidata, add sitelink to the Wikipedia article',
      ],
    });
  }

  return recommendations.slice(0, 7);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  checkWikidataPresence,
  validateWikidataEntity,
  getWikidataEntity,
  IMPORTANT_PROPERTIES,
};
