/**
 * Coreference Resolution Module
 *
 * Basic coreference resolution for pronoun-entity linking
 * Phase 3, Week 10 - NLP Backlog
 *
 * Handles:
 * - Personal pronouns (he, she, they, it)
 * - Possessive pronouns (his, her, their, its)
 * - Reflexive pronouns (himself, herself, themselves, itself)
 * - Demonstrative pronouns (this, that, these, those)
 * - Relative pronouns (who, which, that)
 */

// ================================================================
// TYPES
// ================================================================

/**
 * Pronoun types for classification
 */
export type PronounType =
  | 'personal'
  | 'possessive'
  | 'reflexive'
  | 'demonstrative'
  | 'relative';

/**
 * Gender classification for pronouns
 */
export type PronounGender = 'masculine' | 'feminine' | 'neutral' | 'plural';

/**
 * Person classification (1st, 2nd, 3rd)
 */
export type PronounPerson = 'first' | 'second' | 'third';

/**
 * A detected pronoun with metadata
 */
export interface PronounMention {
  /** The pronoun text */
  pronoun: string;
  /** Type of pronoun */
  type: PronounType;
  /** Gender (for 3rd person) */
  gender: PronounGender;
  /** Person (1st, 2nd, 3rd) */
  person: PronounPerson;
  /** Position in text */
  position: number;
  /** Sentence index */
  sentenceIndex: number;
}

/**
 * An entity mention (potential antecedent)
 */
export interface EntityMention {
  /** The entity text */
  text: string;
  /** Entity type (person, organization, product, etc.) */
  type: EntityType;
  /** Position in text */
  position: number;
  /** Sentence index */
  sentenceIndex: number;
  /** Gender hint if available */
  gender?: PronounGender;
}

/**
 * Entity type classification
 */
export type EntityType =
  | 'person'
  | 'organization'
  | 'product'
  | 'location'
  | 'thing'
  | 'unknown';

/**
 * A coreference link between pronoun and entity
 */
export interface CoreferenceLink {
  /** The pronoun */
  pronoun: PronounMention;
  /** The antecedent entity */
  antecedent: EntityMention;
  /** Confidence score (0-1) */
  confidence: number;
  /** Distance in sentences */
  sentenceDistance: number;
}

/**
 * Coreference chain (cluster of coreferent mentions)
 */
export interface CoreferenceChain {
  /** Unique chain ID */
  id: number;
  /** Main entity (head) */
  headEntity: EntityMention;
  /** All mentions in the chain */
  mentions: Array<PronounMention | EntityMention>;
}

/**
 * Full coreference analysis result
 */
export interface CoreferenceResult {
  /** All detected pronouns */
  pronouns: PronounMention[];
  /** All detected entities */
  entities: EntityMention[];
  /** Resolved coreference links */
  links: CoreferenceLink[];
  /** Grouped coreference chains */
  chains: CoreferenceChain[];
  /** Unresolved pronouns */
  unresolvedPronouns: PronounMention[];
}

// ================================================================
// PRONOUN LEXICONS
// ================================================================

/**
 * Personal pronouns
 */
export const PERSONAL_PRONOUNS: Record<string, { gender: PronounGender; person: PronounPerson }> = {
  // First person
  i: { gender: 'neutral', person: 'first' },
  me: { gender: 'neutral', person: 'first' },
  we: { gender: 'plural', person: 'first' },
  us: { gender: 'plural', person: 'first' },

  // Second person
  you: { gender: 'neutral', person: 'second' },

  // Third person
  he: { gender: 'masculine', person: 'third' },
  him: { gender: 'masculine', person: 'third' },
  she: { gender: 'feminine', person: 'third' },
  her: { gender: 'feminine', person: 'third' },
  it: { gender: 'neutral', person: 'third' },
  they: { gender: 'plural', person: 'third' },
  them: { gender: 'plural', person: 'third' },
};

/**
 * Possessive pronouns
 */
export const POSSESSIVE_PRONOUNS: Record<
  string,
  { gender: PronounGender; person: PronounPerson }
> = {
  my: { gender: 'neutral', person: 'first' },
  mine: { gender: 'neutral', person: 'first' },
  our: { gender: 'plural', person: 'first' },
  ours: { gender: 'plural', person: 'first' },
  your: { gender: 'neutral', person: 'second' },
  yours: { gender: 'neutral', person: 'second' },
  his: { gender: 'masculine', person: 'third' },
  her: { gender: 'feminine', person: 'third' },
  hers: { gender: 'feminine', person: 'third' },
  its: { gender: 'neutral', person: 'third' },
  their: { gender: 'plural', person: 'third' },
  theirs: { gender: 'plural', person: 'third' },
};

/**
 * Reflexive pronouns
 */
export const REFLEXIVE_PRONOUNS: Record<
  string,
  { gender: PronounGender; person: PronounPerson }
> = {
  myself: { gender: 'neutral', person: 'first' },
  ourselves: { gender: 'plural', person: 'first' },
  yourself: { gender: 'neutral', person: 'second' },
  yourselves: { gender: 'plural', person: 'second' },
  himself: { gender: 'masculine', person: 'third' },
  herself: { gender: 'feminine', person: 'third' },
  itself: { gender: 'neutral', person: 'third' },
  themselves: { gender: 'plural', person: 'third' },
};

/**
 * Demonstrative pronouns
 */
export const DEMONSTRATIVE_PRONOUNS: Record<
  string,
  { gender: PronounGender; person: PronounPerson }
> = {
  this: { gender: 'neutral', person: 'third' },
  that: { gender: 'neutral', person: 'third' },
  these: { gender: 'plural', person: 'third' },
  those: { gender: 'plural', person: 'third' },
};

/**
 * Relative pronouns
 */
export const RELATIVE_PRONOUNS: Record<
  string,
  { gender: PronounGender; person: PronounPerson }
> = {
  who: { gender: 'neutral', person: 'third' },
  whom: { gender: 'neutral', person: 'third' },
  whose: { gender: 'neutral', person: 'third' },
  which: { gender: 'neutral', person: 'third' },
  that: { gender: 'neutral', person: 'third' },
};

/**
 * Common male names for gender detection
 */
const MALE_NAMES = new Set([
  'james',
  'john',
  'robert',
  'michael',
  'william',
  'david',
  'richard',
  'joseph',
  'thomas',
  'charles',
  'daniel',
  'matthew',
  'anthony',
  'mark',
  'donald',
  'steven',
  'paul',
  'andrew',
  'joshua',
  'kenneth',
]);

/**
 * Common female names for gender detection
 */
const FEMALE_NAMES = new Set([
  'mary',
  'patricia',
  'jennifer',
  'linda',
  'elizabeth',
  'barbara',
  'susan',
  'jessica',
  'sarah',
  'karen',
  'nancy',
  'lisa',
  'betty',
  'helen',
  'sandra',
  'donna',
  'carol',
  'ruth',
  'sharon',
  'michelle',
]);

/**
 * Title patterns for gender detection
 */
const MALE_TITLES = ['mr', 'mr.', 'mister', 'sir', 'king', 'prince', 'lord'];
const FEMALE_TITLES = ['ms', 'ms.', 'mrs', 'mrs.', 'miss', 'madam', 'queen', 'princess', 'lady'];

// ================================================================
// DETECTION FUNCTIONS
// ================================================================

/**
 * Check if a word is a pronoun
 */
export function isPronoun(word: string): boolean {
  const lower = word.toLowerCase();
  return (
    lower in PERSONAL_PRONOUNS ||
    lower in POSSESSIVE_PRONOUNS ||
    lower in REFLEXIVE_PRONOUNS ||
    lower in DEMONSTRATIVE_PRONOUNS ||
    lower in RELATIVE_PRONOUNS
  );
}

/**
 * Get pronoun type
 */
export function getPronounType(word: string): PronounType | null {
  const lower = word.toLowerCase();
  if (lower in PERSONAL_PRONOUNS) return 'personal';
  if (lower in POSSESSIVE_PRONOUNS) return 'possessive';
  if (lower in REFLEXIVE_PRONOUNS) return 'reflexive';
  if (lower in DEMONSTRATIVE_PRONOUNS) return 'demonstrative';
  if (lower in RELATIVE_PRONOUNS) return 'relative';
  return null;
}

/**
 * Get pronoun metadata
 */
export function getPronounMetadata(
  word: string
): { gender: PronounGender; person: PronounPerson } | null {
  const lower = word.toLowerCase();
  return (
    PERSONAL_PRONOUNS[lower] ||
    POSSESSIVE_PRONOUNS[lower] ||
    REFLEXIVE_PRONOUNS[lower] ||
    DEMONSTRATIVE_PRONOUNS[lower] ||
    RELATIVE_PRONOUNS[lower] ||
    null
  );
}

/**
 * Detect pronouns in text
 */
export function detectPronouns(text: string): PronounMention[] {
  const pronouns: PronounMention[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  let globalPosition = 0;

  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentence = sentences[sentenceIndex];
    const words = sentence.match(/\b\w+\b/g) || [];
    let localPosition = 0;

    for (const word of words) {
      const type = getPronounType(word);
      if (type) {
        const metadata = getPronounMetadata(word);
        if (metadata) {
          const position = text.indexOf(word, globalPosition + localPosition);
          pronouns.push({
            pronoun: word.toLowerCase(),
            type,
            gender: metadata.gender,
            person: metadata.person,
            position: position >= 0 ? position : globalPosition + localPosition,
            sentenceIndex,
          });
        }
      }
      localPosition += word.length + 1;
    }

    globalPosition += sentence.length + 1;
  }

  return pronouns;
}

/**
 * Detect gender from name
 */
export function detectGenderFromName(name: string): PronounGender {
  const lower = name.toLowerCase().split(/\s+/)[0]; // First name only

  if (MALE_NAMES.has(lower)) return 'masculine';
  if (FEMALE_NAMES.has(lower)) return 'feminine';

  // Check for title prefixes
  for (const title of MALE_TITLES) {
    if (name.toLowerCase().startsWith(title + ' ')) return 'masculine';
  }
  for (const title of FEMALE_TITLES) {
    if (name.toLowerCase().startsWith(title + ' ')) return 'feminine';
  }

  return 'neutral';
}

/**
 * Detect entity type from context
 */
export function detectEntityType(text: string): EntityType {
  const lower = text.toLowerCase();

  // Person indicators
  const personIndicators = ['ceo', 'founder', 'director', 'manager', 'president', 'chief'];
  if (personIndicators.some((p) => lower.includes(p))) return 'person';

  // Organization indicators
  const orgIndicators = ['inc', 'corp', 'llc', 'ltd', 'company', 'organization', 'foundation'];
  if (orgIndicators.some((o) => lower.includes(o))) return 'organization';

  // Check for capitalized words (proper nouns)
  if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/.test(text)) {
    // Could be person or organization
    const gender = detectGenderFromName(text);
    if (gender === 'masculine' || gender === 'feminine') return 'person';
    return 'unknown';
  }

  return 'thing';
}

/**
 * Extract entity mentions from text
 */
export function detectEntities(text: string): EntityMention[] {
  const entities: EntityMention[] = [];
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

  // Pattern for capitalized phrases (potential entities)
  const entityPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;

  let globalPosition = 0;

  for (let sentenceIndex = 0; sentenceIndex < sentences.length; sentenceIndex++) {
    const sentence = sentences[sentenceIndex];
    let match;

    while ((match = entityPattern.exec(sentence)) !== null) {
      const entityText = match[1];

      // Skip if it's at the start of a sentence (could be false positive)
      // unless it's multiple words
      if (match.index === 0 && !entityText.includes(' ')) {
        // Check if previous sentence ends without proper punctuation
        // For now, include it anyway
      }

      const position = text.indexOf(entityText, globalPosition);
      const type = detectEntityType(entityText);
      const gender =
        type === 'person' ? detectGenderFromName(entityText) : 'neutral';

      // Avoid duplicates at same position
      if (!entities.some((e) => e.position === position)) {
        entities.push({
          text: entityText,
          type,
          position: position >= 0 ? position : globalPosition + match.index,
          sentenceIndex,
          gender,
        });
      }
    }

    globalPosition += sentence.length + 1;
  }

  return entities;
}

// ================================================================
// RESOLUTION FUNCTIONS
// ================================================================

/**
 * Check if pronoun and entity are compatible
 */
export function areCompatible(
  pronoun: PronounMention,
  entity: EntityMention
): boolean {
  // Check gender compatibility
  if (pronoun.gender === 'masculine') {
    if (entity.gender && entity.gender !== 'masculine' && entity.gender !== 'neutral') {
      return false;
    }
  }

  if (pronoun.gender === 'feminine') {
    if (entity.gender && entity.gender !== 'feminine' && entity.gender !== 'neutral') {
      return false;
    }
  }

  // "it" typically refers to things, not people
  if (pronoun.pronoun === 'it' && entity.type === 'person') {
    return false;
  }

  // "they" can refer to organizations or groups
  if (pronoun.gender === 'plural') {
    // Allow for organizations or general references
    return true;
  }

  return true;
}

/**
 * Calculate confidence score for a coreference link
 */
export function calculateConfidence(
  pronoun: PronounMention,
  entity: EntityMention,
  sentenceDistance: number
): number {
  let confidence = 1.0;

  // Distance penalty
  confidence -= sentenceDistance * 0.15;

  // Gender match bonus
  if (entity.gender && pronoun.gender === entity.gender) {
    confidence += 0.1;
  }

  // Entity type match bonus
  if (pronoun.pronoun === 'it' && entity.type === 'thing') {
    confidence += 0.1;
  }
  if (['he', 'she', 'him', 'her'].includes(pronoun.pronoun) && entity.type === 'person') {
    confidence += 0.1;
  }
  if (pronoun.gender === 'plural' && entity.type === 'organization') {
    confidence += 0.1;
  }

  // Relative pronoun immediately follows antecedent bonus
  if (pronoun.type === 'relative' && sentenceDistance === 0) {
    confidence += 0.2;
  }

  return Math.max(0, Math.min(1, confidence));
}

/**
 * Find the best antecedent for a pronoun
 */
export function findAntecedent(
  pronoun: PronounMention,
  entities: EntityMention[],
  maxSentenceDistance: number = 3
): CoreferenceLink | null {
  // Filter entities that appear before the pronoun
  const candidates = entities.filter(
    (e) =>
      e.position < pronoun.position &&
      pronoun.sentenceIndex - e.sentenceIndex <= maxSentenceDistance
  );

  if (candidates.length === 0) return null;

  // Find compatible candidates
  const compatible = candidates.filter((e) => areCompatible(pronoun, e));

  if (compatible.length === 0) return null;

  // Sort by recency (closest first)
  compatible.sort((a, b) => b.position - a.position);

  // Get the most recent compatible entity
  const best = compatible[0];
  const sentenceDistance = pronoun.sentenceIndex - best.sentenceIndex;
  const confidence = calculateConfidence(pronoun, best, sentenceDistance);

  return {
    pronoun,
    antecedent: best,
    confidence,
    sentenceDistance,
  };
}

/**
 * Resolve all coreferences in text
 */
export function resolveCoreferences(text: string): CoreferenceResult {
  const pronouns = detectPronouns(text);
  const entities = detectEntities(text);
  const links: CoreferenceLink[] = [];
  const unresolvedPronouns: PronounMention[] = [];

  // Only resolve third-person pronouns
  const thirdPersonPronouns = pronouns.filter((p) => p.person === 'third');

  for (const pronoun of thirdPersonPronouns) {
    const link = findAntecedent(pronoun, entities);
    if (link && link.confidence >= 0.5) {
      links.push(link);
    } else {
      unresolvedPronouns.push(pronoun);
    }
  }

  // Build coreference chains
  const chains = buildCoreferenceChains(entities, links);

  return {
    pronouns,
    entities,
    links,
    chains,
    unresolvedPronouns,
  };
}

/**
 * Build coreference chains from links
 */
function buildCoreferenceChains(
  entities: EntityMention[],
  links: CoreferenceLink[]
): CoreferenceChain[] {
  const chains: CoreferenceChain[] = [];
  const entityToChain = new Map<EntityMention, number>();

  let chainId = 0;

  for (const entity of entities) {
    // Find all pronouns that refer to this entity
    const pronounsForEntity = links
      .filter((l) => l.antecedent === entity)
      .map((l) => l.pronoun);

    if (pronounsForEntity.length > 0) {
      chains.push({
        id: chainId++,
        headEntity: entity,
        mentions: [entity, ...pronounsForEntity],
      });
      entityToChain.set(entity, chains.length - 1);
    }
  }

  return chains;
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Replace pronouns with their antecedents in text
 */
export function expandPronouns(text: string): string {
  const result = resolveCoreferences(text);
  let expandedText = text;

  // Sort links by position (reverse order to maintain positions)
  const sortedLinks = [...result.links].sort(
    (a, b) => b.pronoun.position - a.pronoun.position
  );

  for (const link of sortedLinks) {
    const before = expandedText.slice(0, link.pronoun.position);
    const after = expandedText.slice(link.pronoun.position + link.pronoun.pronoun.length);

    // For possessives, add 's if needed
    let replacement = link.antecedent.text;
    if (link.pronoun.type === 'possessive') {
      replacement = link.antecedent.text + "'s";
    }

    expandedText = before + replacement + after;
  }

  return expandedText;
}

/**
 * Get all mentions for a specific entity
 */
export function getMentionsForEntity(
  entityText: string,
  result: CoreferenceResult
): Array<PronounMention | EntityMention> {
  const chain = result.chains.find(
    (c) => c.headEntity.text.toLowerCase() === entityText.toLowerCase()
  );
  return chain?.mentions || [];
}

/**
 * Count how many times an entity is referenced (including pronouns)
 */
export function countEntityReferences(
  entityText: string,
  result: CoreferenceResult
): number {
  return getMentionsForEntity(entityText, result).length;
}

/**
 * Get summary statistics for coreference result
 */
export function getCoreferenceStats(result: CoreferenceResult): {
  totalPronouns: number;
  resolvedPronouns: number;
  unresolvedPronouns: number;
  resolutionRate: number;
  totalEntities: number;
  totalChains: number;
  avgChainLength: number;
  avgConfidence: number;
} {
  const resolvedCount = result.links.length;
  const avgChainLength =
    result.chains.length > 0
      ? result.chains.reduce((sum, c) => sum + c.mentions.length, 0) / result.chains.length
      : 0;
  const avgConfidence =
    result.links.length > 0
      ? result.links.reduce((sum, l) => sum + l.confidence, 0) / result.links.length
      : 0;

  return {
    totalPronouns: result.pronouns.length,
    resolvedPronouns: resolvedCount,
    unresolvedPronouns: result.unresolvedPronouns.length,
    resolutionRate:
      result.pronouns.length > 0
        ? resolvedCount / result.pronouns.filter((p) => p.person === 'third').length
        : 0,
    totalEntities: result.entities.length,
    totalChains: result.chains.length,
    avgChainLength: Math.round(avgChainLength * 100) / 100,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Detection
  isPronoun,
  getPronounType,
  getPronounMetadata,
  detectPronouns,
  detectEntities,
  detectGenderFromName,
  detectEntityType,

  // Resolution
  areCompatible,
  calculateConfidence,
  findAntecedent,
  resolveCoreferences,

  // Utilities
  expandPronouns,
  getMentionsForEntity,
  countEntityReferences,
  getCoreferenceStats,

  // Constants
  PERSONAL_PRONOUNS,
  POSSESSIVE_PRONOUNS,
  REFLEXIVE_PRONOUNS,
  DEMONSTRATIVE_PRONOUNS,
  RELATIVE_PRONOUNS,
};
