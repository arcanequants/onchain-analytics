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
// WIKIDATA API IMPLEMENTATION
// ================================================================

const WIKIDATA_API_BASE = 'https://www.wikidata.org/w/api.php';
const WIKIDATA_TIMEOUT_MS = 10000;

/**
 * Wikidata API search response types
 */
interface WikidataSearchResult {
  id: string;
  label: string;
  description?: string;
  aliases?: string[];
}

interface WikidataSearchResponse {
  search: WikidataSearchResult[];
  success: number;
}

interface WikidataEntityData {
  type: string;
  id: string;
  labels?: Record<string, { language: string; value: string }>;
  descriptions?: Record<string, { language: string; value: string }>;
  aliases?: Record<string, Array<{ language: string; value: string }>>;
  claims?: Record<string, WikidataClaim[]>;
  sitelinks?: Record<string, { site: string; title: string; url?: string }>;
}

interface WikidataClaim {
  mainsnak: {
    snaktype: string;
    property: string;
    datavalue?: {
      value: unknown;
      type: string;
    };
  };
}

interface WikidataEntitiesResponse {
  entities: Record<string, WikidataEntityData>;
  success: number;
}

/**
 * Search Wikidata for entities matching the query
 */
async function searchWikidata(
  query: string,
  options: WikidataCheckOptions
): Promise<WikidataEntity[]> {
  const language = options.language || 'en';

  try {
    // Step 1: Search for entities
    const searchUrl = new URL(WIKIDATA_API_BASE);
    searchUrl.searchParams.set('action', 'wbsearchentities');
    searchUrl.searchParams.set('search', query);
    searchUrl.searchParams.set('language', language);
    searchUrl.searchParams.set('limit', '10');
    searchUrl.searchParams.set('format', 'json');
    searchUrl.searchParams.set('origin', '*');

    const searchResponse = await fetch(searchUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(WIKIDATA_TIMEOUT_MS),
    });

    if (!searchResponse.ok) {
      console.error('[Wikidata] Search failed:', searchResponse.status);
      return [];
    }

    const searchData: WikidataSearchResponse = await searchResponse.json();

    if (!searchData.search || searchData.search.length === 0) {
      return [];
    }

    // Step 2: Get full entity data for top results
    const entityIds = searchData.search.slice(0, 5).map(r => r.id);
    const entities = await fetchEntityDetails(entityIds, language);

    return entities;
  } catch (error) {
    console.error('[Wikidata] Search error:', error);
    return [];
  }
}

/**
 * Fetch detailed entity data from Wikidata
 */
async function fetchEntityDetails(
  entityIds: string[],
  language: string
): Promise<WikidataEntity[]> {
  if (entityIds.length === 0) return [];

  try {
    const entitiesUrl = new URL(WIKIDATA_API_BASE);
    entitiesUrl.searchParams.set('action', 'wbgetentities');
    entitiesUrl.searchParams.set('ids', entityIds.join('|'));
    entitiesUrl.searchParams.set('languages', language);
    entitiesUrl.searchParams.set('props', 'labels|descriptions|aliases|claims|sitelinks');
    entitiesUrl.searchParams.set('format', 'json');
    entitiesUrl.searchParams.set('origin', '*');

    const response = await fetch(entitiesUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(WIKIDATA_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error('[Wikidata] Entity fetch failed:', response.status);
      return [];
    }

    const data: WikidataEntitiesResponse = await response.json();

    if (!data.entities) return [];

    return Object.values(data.entities)
      .filter(e => e.type === 'item')
      .map(e => transformToWikidataEntity(e, language));
  } catch (error) {
    console.error('[Wikidata] Entity fetch error:', error);
    return [];
  }
}

/**
 * Transform Wikidata API response to our entity format
 */
function transformToWikidataEntity(
  data: WikidataEntityData,
  language: string
): WikidataEntity {
  const label = data.labels?.[language]?.value || data.id;
  const description = data.descriptions?.[language]?.value;
  const aliases = data.aliases?.[language]?.map(a => a.value) || [];

  // Extract properties from claims
  const properties: WikidataProperty[] = [];

  if (data.claims) {
    for (const [propId, claims] of Object.entries(data.claims)) {
      const claim = claims[0]; // Take first claim for each property
      if (claim?.mainsnak?.datavalue) {
        const prop = extractPropertyValue(propId, claim.mainsnak.datavalue);
        if (prop) {
          properties.push(prop);
        }
      }
    }
  }

  // Extract Wikipedia URL from sitelinks
  let wikipediaUrl: string | undefined;
  const wikiSitelink = data.sitelinks?.[`${language}wiki`];
  if (wikiSitelink?.title) {
    wikipediaUrl = `https://${language}.wikipedia.org/wiki/${encodeURIComponent(wikiSitelink.title.replace(/ /g, '_'))}`;
  }

  // Extract official website from claims
  const websiteClaim = properties.find(p => p.id === 'P856');
  const officialWebsite = websiteClaim?.value;

  return {
    id: data.id,
    label,
    description,
    aliases,
    entityType: detectEntityType(properties),
    properties,
    wikipediaUrl,
    officialWebsite,
  };
}

/**
 * Extract property value from Wikidata claim
 */
function extractPropertyValue(
  propId: string,
  datavalue: { value: unknown; type: string }
): WikidataProperty | null {
  const propInfo = IMPORTANT_PROPERTIES[propId];
  const label = propInfo?.label || propId;

  try {
    switch (datavalue.type) {
      case 'string':
        return {
          id: propId,
          label,
          value: datavalue.value as string,
          valueType: 'string',
        };

      case 'wikibase-entityid': {
        const entityValue = datavalue.value as { id: string; 'numeric-id': number };
        return {
          id: propId,
          label,
          value: entityValue.id,
          valueType: 'entity',
          linkedEntityId: entityValue.id,
        };
      }

      case 'time': {
        const timeValue = datavalue.value as { time: string };
        // Extract year from time string like "+1975-04-04T00:00:00Z"
        const year = timeValue.time?.match(/[+-]?(\d{4})/)?.[1] || timeValue.time;
        return {
          id: propId,
          label,
          value: year,
          valueType: 'time',
        };
      }

      case 'quantity': {
        const quantityValue = datavalue.value as { amount: string };
        return {
          id: propId,
          label,
          value: quantityValue.amount,
          valueType: 'quantity',
        };
      }

      case 'monolingualtext': {
        const textValue = datavalue.value as { text: string };
        return {
          id: propId,
          label,
          value: textValue.text,
          valueType: 'string',
        };
      }

      default:
        return null;
    }
  } catch {
    return null;
  }
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
 * Validate existing Wikidata entity by ID
 */
export async function validateWikidataEntity(
  entityId: string
): Promise<WikidataEntity | null> {
  return getWikidataEntity(entityId);
}

/**
 * Get Wikidata entity by Q-number
 */
export async function getWikidataEntity(
  qNumber: string,
  language: string = 'en'
): Promise<WikidataEntity | null> {
  // Validate Q-number format
  if (!qNumber.match(/^Q\d+$/)) {
    console.error('[Wikidata] Invalid Q-number format:', qNumber);
    return null;
  }

  try {
    const entities = await fetchEntityDetails([qNumber], language);
    return entities.length > 0 ? entities[0] : null;
  } catch (error) {
    console.error('[Wikidata] Failed to fetch entity:', error);
    return null;
  }
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
