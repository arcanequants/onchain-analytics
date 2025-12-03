/**
 * Query Intent Classification
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Classify query intent (recommendation, comparison, factual, exploratory)
 * - Extract query components
 * - Identify target entities and constraints
 * - Support multi-intent detection
 */

// ============================================================================
// TYPES
// ============================================================================

export type QueryIntent =
  | 'recommendation'  // "What's the best CRM for small businesses?"
  | 'comparison'      // "How does Salesforce compare to HubSpot?"
  | 'factual'         // "What is Salesforce's market share?"
  | 'exploratory'     // "Tell me about CRM software"
  | 'evaluative'      // "Is Salesforce worth the price?"
  | 'procedural'      // "How do I integrate Salesforce with Gmail?"
  | 'definitional'    // "What is a CRM?"
  | 'navigational'    // "Salesforce login page"
  | 'transactional';  // "Buy Salesforce subscription"

export type QueryModifier =
  | 'superlative'     // best, worst, top, leading
  | 'comparative'     // better, cheaper, faster
  | 'temporal'        // latest, recent, 2024
  | 'geographic'      // in US, for Mexico, global
  | 'demographic'     // for startups, for enterprise
  | 'price'           // cheap, affordable, free
  | 'feature';        // with AI, cloud-based

export interface QueryEntity {
  text: string;
  type: 'brand' | 'product' | 'category' | 'feature' | 'location' | 'industry';
  startOffset: number;
  endOffset: number;
  confidence: number;
}

export interface IntentClassification {
  primaryIntent: QueryIntent;
  secondaryIntents: QueryIntent[];
  confidence: number;
  modifiers: QueryModifier[];
  entities: QueryEntity[];
  constraints: QueryConstraint[];
}

export interface QueryConstraint {
  type: 'price' | 'size' | 'location' | 'feature' | 'industry' | 'use_case';
  value: string;
  operator: 'equals' | 'less_than' | 'greater_than' | 'contains' | 'excludes';
}

// ============================================================================
// INTENT PATTERNS
// ============================================================================

interface IntentPattern {
  intent: QueryIntent;
  patterns: RegExp[];
  weight: number;
}

const INTENT_PATTERNS: IntentPattern[] = [
  // Recommendation
  {
    intent: 'recommendation',
    weight: 1.0,
    patterns: [
      /\b(what|which)\s+(is|are)\s+the\s+best\b/gi,
      /\brecommend\b/gi,
      /\bsuggest\b/gi,
      /\btop\s+\d*\s*(best|recommended)?\b/gi,
      /\bshould\s+i\s+(use|choose|pick|get)\b/gi,
      /\bwhat\s+(should|would)\s+you\s+recommend\b/gi,
      /\bbest\s+\w+\s+for\b/gi,
      /\blooking\s+for\s+(a|the|an)\s+\w+\b/gi,
    ],
  },

  // Comparison
  {
    intent: 'comparison',
    weight: 1.0,
    patterns: [
      /\bvs\.?\b/gi,
      /\bversus\b/gi,
      /\bcompare[ds]?\s+(to|with)?\b/gi,
      /\bcomparison\b/gi,
      /\bbetter\s+than\b/gi,
      /\bdifference\s+between\b/gi,
      /\b\w+\s+or\s+\w+\b/gi, // "X or Y"
      /\bwhich\s+is\s+(better|cheaper|faster)\b/gi,
      /\bhow\s+does\s+\w+\s+compare\b/gi,
    ],
  },

  // Factual
  {
    intent: 'factual',
    weight: 0.9,
    patterns: [
      /\bwhat\s+is\s+the\s+(price|cost|revenue|market\s+share)\b/gi,
      /\bhow\s+much\s+(does|is)\b/gi,
      /\bhow\s+many\b/gi,
      /\bwhen\s+(was|did|is)\b/gi,
      /\bwhere\s+(is|are|does)\b/gi,
      /\bwho\s+(is|are|founded|created)\b/gi,
      /\bhow\s+old\s+is\b/gi,
      /\bfacts\s+about\b/gi,
    ],
  },

  // Exploratory
  {
    intent: 'exploratory',
    weight: 0.8,
    patterns: [
      /\btell\s+me\s+about\b/gi,
      /\bwhat\s+do\s+you\s+know\s+about\b/gi,
      /\blearn\s+about\b/gi,
      /\bexplain\b/gi,
      /\bwhat\s+is\s+\w+\s*\?*$/gi, // "What is X?"
      /\boverview\s+of\b/gi,
      /\bintroduction\s+to\b/gi,
      /\bguide\s+to\b/gi,
    ],
  },

  // Evaluative
  {
    intent: 'evaluative',
    weight: 0.9,
    patterns: [
      /\bis\s+\w+\s+(good|bad|worth|reliable)\b/gi,
      /\breviews?\s+(of|for)\b/gi,
      /\bpros\s+and\s+cons\b/gi,
      /\badvantages\s+(and\s+disadvantages)?\b/gi,
      /\bshould\s+i\s+(trust|believe)\b/gi,
      /\bis\s+it\s+worth\b/gi,
      /\brating\s+(of|for)\b/gi,
      /\bopinion\s+(on|about)\b/gi,
    ],
  },

  // Procedural
  {
    intent: 'procedural',
    weight: 1.0,
    patterns: [
      /\bhow\s+(do|can|to)\s+(i|you|we)\b/gi,
      /\bsteps\s+to\b/gi,
      /\btutorial\b/gi,
      /\bguide\s+to\s+\w+ing\b/gi,
      /\bsetup\b/gi,
      /\binstall(ation)?\b/gi,
      /\bconfigure\b/gi,
      /\bintegrate\b/gi,
    ],
  },

  // Definitional
  {
    intent: 'definitional',
    weight: 0.85,
    patterns: [
      /\bwhat\s+is\s+(a|an)\s+\w+\b/gi,
      /\bdefine\b/gi,
      /\bdefinition\s+of\b/gi,
      /\bmeaning\s+of\b/gi,
      /\bwhat\s+does\s+\w+\s+mean\b/gi,
      /\bwhat\s+are\s+\w+s?\b/gi,
    ],
  },

  // Navigational
  {
    intent: 'navigational',
    weight: 0.9,
    patterns: [
      /\b(login|signin|sign\s+in)\b/gi,
      /\b(website|site|homepage|page)\b/gi,
      /\bofficial\b/gi,
      /\bgo\s+to\b/gi,
      /\bfind\s+\w+\s+(website|page)\b/gi,
      /\.com\b/gi,
    ],
  },

  // Transactional
  {
    intent: 'transactional',
    weight: 1.0,
    patterns: [
      /\b(buy|purchase|order|subscribe)\b/gi,
      /\b(pricing|price|cost)\s+(page|plans?)\b/gi,
      /\bget\s+(started|a\s+quote)\b/gi,
      /\bsign\s+up\b/gi,
      /\bfree\s+trial\b/gi,
      /\bdemo\b/gi,
      /\bdownload\b/gi,
    ],
  },
];

// ============================================================================
// MODIFIER PATTERNS
// ============================================================================

const MODIFIER_PATTERNS: Record<QueryModifier, RegExp[]> = {
  superlative: [
    /\bbest\b/gi,
    /\bworst\b/gi,
    /\btop\b/gi,
    /\bleading\b/gi,
    /\bmost\s+\w+\b/gi,
    /\bfastest\b/gi,
    /\bcheapest\b/gi,
    /\bbiggest\b/gi,
  ],
  comparative: [
    /\bbetter\b/gi,
    /\bcheaper\b/gi,
    /\bfaster\b/gi,
    /\bmore\s+\w+\b/gi,
    /\bless\s+\w+\b/gi,
    /\beasier\b/gi,
  ],
  temporal: [
    /\b(2023|2024|2025)\b/g,
    /\blatest\b/gi,
    /\brecent\b/gi,
    /\bnew\b/gi,
    /\bupdated\b/gi,
    /\bcurrent\b/gi,
  ],
  geographic: [
    /\bin\s+(the\s+)?(US|USA|UK|Mexico|Canada|Europe|Asia)\b/gi,
    /\bfor\s+(the\s+)?(US|USA|UK|Mexico|Canada|Europe|Asia)\b/gi,
    /\bglobal\b/gi,
    /\blocal\b/gi,
    /\binternational\b/gi,
  ],
  demographic: [
    /\bfor\s+(startups?|enterprises?|smb|small\s+business)\b/gi,
    /\bfor\s+(beginners?|experts?|professionals?)\b/gi,
    /\b(b2b|b2c|saas)\b/gi,
  ],
  price: [
    /\bfree\b/gi,
    /\bcheap\b/gi,
    /\baffordable\b/gi,
    /\bbudget\b/gi,
    /\bpremium\b/gi,
    /\bexpensive\b/gi,
    /\bunder\s+\$?\d+\b/gi,
  ],
  feature: [
    /\bwith\s+(ai|ml|cloud|mobile|api)\b/gi,
    /\bcloud[- ]based\b/gi,
    /\bopen[- ]source\b/gi,
    /\bself[- ]hosted\b/gi,
    /\bintegrated\b/gi,
  ],
};

// ============================================================================
// ENTITY PATTERNS
// ============================================================================

const ENTITY_PATTERNS: Array<{ type: QueryEntity['type']; patterns: RegExp[] }> = [
  {
    type: 'category',
    patterns: [
      /\b(crm|erp|hrm|cms|lms)\b/gi,
      /\b(software|platform|tool|app|application|solution)\b/gi,
      /\b(service|provider|vendor)\b/gi,
    ],
  },
  {
    type: 'industry',
    patterns: [
      /\b(healthcare|finance|education|retail|technology)\b/gi,
      /\b(manufacturing|hospitality|real\s+estate|legal)\b/gi,
    ],
  },
  {
    type: 'feature',
    patterns: [
      /\b(analytics|reporting|automation|integration)\b/gi,
      /\b(dashboard|api|mobile\s+app|ai|machine\s+learning)\b/gi,
    ],
  },
  {
    type: 'location',
    patterns: [
      /\b(US|USA|UK|Mexico|Canada|Europe|Asia|India|China|Japan)\b/gi,
      /\b(New\s+York|San\s+Francisco|London|Berlin|Tokyo)\b/gi,
    ],
  },
];

// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Extract modifiers from query
 */
function extractModifiers(query: string): QueryModifier[] {
  const modifiers: QueryModifier[] = [];

  for (const [modifier, patterns] of Object.entries(MODIFIER_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(query)) {
        modifiers.push(modifier as QueryModifier);
        break;
      }
    }
  }

  return modifiers;
}

/**
 * Extract entities from query
 */
function extractEntities(query: string): QueryEntity[] {
  const entities: QueryEntity[] = [];

  for (const { type, patterns } of ENTITY_PATTERNS) {
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(query)) !== null) {
        // Check for duplicates
        const isDuplicate = entities.some(
          e => e.startOffset === match!.index && e.type === type
        );

        if (!isDuplicate) {
          entities.push({
            text: match[0],
            type,
            startOffset: match.index,
            endOffset: match.index + match[0].length,
            confidence: 0.8,
          });
        }
      }
    }
  }

  return entities;
}

/**
 * Extract constraints from query
 */
function extractConstraints(query: string): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  // Price constraints
  const priceMatch = query.match(/under\s+\$?(\d+)/i);
  if (priceMatch) {
    constraints.push({
      type: 'price',
      value: priceMatch[1],
      operator: 'less_than',
    });
  }

  const priceOverMatch = query.match(/over\s+\$?(\d+)/i);
  if (priceOverMatch) {
    constraints.push({
      type: 'price',
      value: priceOverMatch[1],
      operator: 'greater_than',
    });
  }

  // Size constraints
  const sizeMatch = query.match(/for\s+(small|medium|large|enterprise)\s+(business|companies)/i);
  if (sizeMatch) {
    constraints.push({
      type: 'size',
      value: sizeMatch[1].toLowerCase(),
      operator: 'equals',
    });
  }

  // Location constraints
  const locationMatch = query.match(/in\s+(the\s+)?(US|USA|UK|Mexico|Canada|Europe|Asia)/i);
  if (locationMatch) {
    constraints.push({
      type: 'location',
      value: locationMatch[2],
      operator: 'equals',
    });
  }

  // Feature constraints
  const featureMatch = query.match(/with\s+(ai|api|mobile|cloud|integration)/gi);
  if (featureMatch) {
    for (const match of featureMatch) {
      constraints.push({
        type: 'feature',
        value: match.replace(/^with\s+/i, ''),
        operator: 'contains',
      });
    }
  }

  return constraints;
}

/**
 * Calculate intent scores
 */
function calculateIntentScores(query: string): Map<QueryIntent, number> {
  const scores = new Map<QueryIntent, number>();

  for (const { intent, patterns, weight } of INTENT_PATTERNS) {
    let matchCount = 0;
    let totalPatterns = patterns.length;

    for (const pattern of patterns) {
      if (pattern.test(query)) {
        matchCount++;
      }
      // Reset regex lastIndex
      pattern.lastIndex = 0;
    }

    if (matchCount > 0) {
      const score = (matchCount / totalPatterns) * weight;
      const existing = scores.get(intent) || 0;
      scores.set(intent, Math.max(existing, score));
    }
  }

  return scores;
}

// ============================================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================================

/**
 * Classify query intent
 */
export function classifyQueryIntent(query: string): IntentClassification {
  const normalizedQuery = query.toLowerCase().trim();

  // Calculate intent scores
  const intentScores = calculateIntentScores(normalizedQuery);

  // Sort by score
  const sortedIntents = [...intentScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0.1);

  // Determine primary and secondary intents
  const primaryIntent: QueryIntent = sortedIntents.length > 0
    ? sortedIntents[0][0]
    : 'exploratory'; // Default

  const primaryConfidence = sortedIntents.length > 0 ? sortedIntents[0][1] : 0.3;

  const secondaryIntents = sortedIntents
    .slice(1, 3)
    .map(([intent]) => intent);

  // Extract components
  const modifiers = extractModifiers(normalizedQuery);
  const entities = extractEntities(normalizedQuery);
  const constraints = extractConstraints(normalizedQuery);

  return {
    primaryIntent,
    secondaryIntents,
    confidence: Math.min(primaryConfidence + 0.2, 1.0), // Boost confidence slightly
    modifiers,
    entities,
    constraints,
  };
}

/**
 * Get intent description for display
 */
export function getIntentDescription(intent: QueryIntent): string {
  const descriptions: Record<QueryIntent, string> = {
    recommendation: 'Looking for recommendations',
    comparison: 'Comparing options',
    factual: 'Seeking specific facts',
    exploratory: 'Exploring a topic',
    evaluative: 'Evaluating quality/value',
    procedural: 'How-to guidance',
    definitional: 'Seeking a definition',
    navigational: 'Finding a specific page',
    transactional: 'Ready to take action',
  };

  return descriptions[intent];
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  classifyQueryIntent,
  getIntentDescription,
};
