/**
 * Domain Glossary Module
 * Phase 1, Week 2, Day 5 - Domain Tasks
 *
 * Provides industry-specific terminology for AI context and disambiguation.
 */

import glossaryData from '../../../../data/glossary-seed.json';

// ================================================================
// TYPES
// ================================================================

export interface GlossaryTerm {
  term: string;
  acronym?: string;
  definition: string;
  shortDefinition?: string;
  category: TermCategory;
  industrySlug: string | null;
  importanceLevel: ImportanceLevel;
  aliases?: string[];
  relatedTerms?: string[];
  contextExamples?: string[];
  isIndustrySpecific?: boolean;
  isTechnical?: boolean;
}

export type TermCategory =
  | 'metric'
  | 'regulation'
  | 'technology'
  | 'process'
  | 'role'
  | 'document'
  | 'certification'
  | 'pricing'
  | 'feature'
  | 'general';

export type ImportanceLevel = 'critical' | 'high' | 'standard' | 'low';

export interface TermMatch {
  term: GlossaryTerm;
  confidence: number;
  matchType: 'exact' | 'alias' | 'acronym' | 'partial';
}

export interface GlossaryStats {
  totalTerms: number;
  byIndustry: Record<string, number>;
  byCategory: Record<string, number>;
  byImportance: Record<string, number>;
}

// ================================================================
// DATA LOADING
// ================================================================

const GLOSSARY_TERMS: GlossaryTerm[] = glossaryData.terms.map(term => ({
  term: term.term,
  acronym: term.acronym,
  definition: term.definition,
  shortDefinition: term.shortDefinition,
  category: term.category as TermCategory,
  industrySlug: term.industrySlug,
  importanceLevel: term.importanceLevel as ImportanceLevel,
  aliases: term.aliases,
  relatedTerms: term.relatedTerms,
  contextExamples: term.contextExamples,
  isIndustrySpecific: term.isIndustrySpecific ?? true,
  isTechnical: term.isTechnical ?? false
}));

// Create lookup maps for efficient access
const termsByIndustry = new Map<string, GlossaryTerm[]>();
const termsByCategory = new Map<string, GlossaryTerm[]>();
const termLookup = new Map<string, GlossaryTerm>();
const aliasLookup = new Map<string, GlossaryTerm>();

// Initialize maps
GLOSSARY_TERMS.forEach(term => {
  // Index by industry
  const industry = term.industrySlug || 'cross-industry';
  if (!termsByIndustry.has(industry)) {
    termsByIndustry.set(industry, []);
  }
  termsByIndustry.get(industry)!.push(term);

  // Index by category
  if (!termsByCategory.has(term.category)) {
    termsByCategory.set(term.category, []);
  }
  termsByCategory.get(term.category)!.push(term);

  // Index by normalized term
  const normalized = normalizeTerm(term.term);
  termLookup.set(normalized, term);

  // Index aliases
  if (term.aliases) {
    term.aliases.forEach(alias => {
      aliasLookup.set(normalizeTerm(alias), term);
    });
  }

  // Index acronym
  if (term.acronym) {
    aliasLookup.set(normalizeTerm(term.acronym), term);
  }
});

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Normalize a term for matching (lowercase, remove special chars)
 */
function normalizeTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

// ================================================================
// PUBLIC FUNCTIONS
// ================================================================

/**
 * Get all glossary terms
 */
export function getAllTerms(): GlossaryTerm[] {
  return [...GLOSSARY_TERMS];
}

/**
 * Get terms for a specific industry
 */
export function getTermsByIndustry(industrySlug: string): GlossaryTerm[] {
  const industryTerms = termsByIndustry.get(industrySlug) || [];
  const crossIndustryTerms = termsByIndustry.get('cross-industry') || [];
  return [...industryTerms, ...crossIndustryTerms];
}

/**
 * Get terms by category
 */
export function getTermsByCategory(category: TermCategory): GlossaryTerm[] {
  return termsByCategory.get(category) || [];
}

/**
 * Get terms by importance level
 */
export function getTermsByImportance(
  level: ImportanceLevel,
  industrySlug?: string
): GlossaryTerm[] {
  let terms = GLOSSARY_TERMS.filter(t => t.importanceLevel === level);

  if (industrySlug) {
    terms = terms.filter(
      t => t.industrySlug === industrySlug || t.industrySlug === null
    );
  }

  return terms;
}

/**
 * Get critical terms for an industry (for prompt context)
 */
export function getCriticalTerms(industrySlug: string): GlossaryTerm[] {
  return getTermsByIndustry(industrySlug).filter(
    t => t.importanceLevel === 'critical' || t.importanceLevel === 'high'
  );
}

/**
 * Resolve a term by exact match or alias
 */
export function resolveTerm(
  searchTerm: string,
  industrySlug?: string
): TermMatch | null {
  const normalized = normalizeTerm(searchTerm);

  // Try exact match
  let term = termLookup.get(normalized);
  if (term) {
    if (!industrySlug || term.industrySlug === industrySlug || term.industrySlug === null) {
      return { term, confidence: 1.0, matchType: 'exact' };
    }
  }

  // Try alias match
  term = aliasLookup.get(normalized);
  if (term) {
    if (!industrySlug || term.industrySlug === industrySlug || term.industrySlug === null) {
      // Check if it was an acronym match
      const isAcronym = term.acronym && normalizeTerm(term.acronym) === normalized;
      return {
        term,
        confidence: isAcronym ? 0.95 : 0.90,
        matchType: isAcronym ? 'acronym' : 'alias'
      };
    }
  }

  return null;
}

/**
 * Search terms (fuzzy matching)
 */
export function searchTerms(
  query: string,
  options?: {
    industrySlug?: string;
    category?: TermCategory;
    limit?: number;
  }
): TermMatch[] {
  const normalized = normalizeTerm(query);
  const limit = options?.limit || 10;
  const results: TermMatch[] = [];

  for (const term of GLOSSARY_TERMS) {
    // Filter by industry if specified
    if (options?.industrySlug &&
        term.industrySlug !== options.industrySlug &&
        term.industrySlug !== null) {
      continue;
    }

    // Filter by category if specified
    if (options?.category && term.category !== options.category) {
      continue;
    }

    // Check for matches
    const termNormalized = normalizeTerm(term.term);
    const definitionNormalized = normalizeTerm(term.definition);

    let confidence = 0;
    let matchType: TermMatch['matchType'] = 'partial';

    if (termNormalized === normalized) {
      confidence = 1.0;
      matchType = 'exact';
    } else if (termNormalized.includes(normalized) || normalized.includes(termNormalized)) {
      confidence = 0.8;
      matchType = 'partial';
    } else if (definitionNormalized.includes(normalized)) {
      confidence = 0.6;
      matchType = 'partial';
    } else if (term.aliases?.some(a => normalizeTerm(a).includes(normalized))) {
      confidence = 0.7;
      matchType = 'alias';
    }

    if (confidence > 0) {
      results.push({ term, confidence, matchType });
    }
  }

  // Sort by confidence and limit
  return results
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}

/**
 * Get related terms for a given term
 */
export function getRelatedTerms(termName: string): GlossaryTerm[] {
  const match = resolveTerm(termName);
  if (!match || !match.term.relatedTerms) {
    return [];
  }

  return match.term.relatedTerms
    .map(related => resolveTerm(related)?.term)
    .filter((t): t is GlossaryTerm => t !== undefined);
}

/**
 * Build context string for prompt injection
 */
export function buildTermContext(
  industrySlug: string,
  options?: {
    maxTerms?: number;
    includeDefinitions?: boolean;
    importanceLevel?: ImportanceLevel;
  }
): string {
  const maxTerms = options?.maxTerms || 15;
  const includeDefinitions = options?.includeDefinitions ?? true;

  let terms = getCriticalTerms(industrySlug);

  // Filter by importance level if specified
  if (options?.importanceLevel) {
    const levels: ImportanceLevel[] = ['critical'];
    if (options.importanceLevel !== 'critical') levels.push('high');
    if (options.importanceLevel === 'standard') levels.push('standard');
    if (options.importanceLevel === 'low') levels.push('low');

    terms = terms.filter(t => levels.includes(t.importanceLevel));
  }

  // Limit terms
  terms = terms.slice(0, maxTerms);

  if (terms.length === 0) {
    return '';
  }

  const lines = ['**Key Industry Terms:**'];

  terms.forEach(term => {
    if (includeDefinitions && term.shortDefinition) {
      lines.push(`- **${term.term}**: ${term.shortDefinition}`);
    } else {
      lines.push(`- ${term.term}`);
    }
  });

  return lines.join('\n');
}

/**
 * Get glossary statistics
 */
export function getGlossaryStats(): GlossaryStats {
  const byIndustry: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const byImportance: Record<string, number> = {};

  GLOSSARY_TERMS.forEach(term => {
    const industry = term.industrySlug || 'cross-industry';
    byIndustry[industry] = (byIndustry[industry] || 0) + 1;
    byCategory[term.category] = (byCategory[term.category] || 0) + 1;
    byImportance[term.importanceLevel] = (byImportance[term.importanceLevel] || 0) + 1;
  });

  return {
    totalTerms: GLOSSARY_TERMS.length,
    byIndustry,
    byCategory,
    byImportance
  };
}

/**
 * Check if a term exists in the glossary
 */
export function hasTerm(termName: string): boolean {
  return resolveTerm(termName) !== null;
}

/**
 * Get all supported industries in the glossary
 */
export function getGlossaryIndustries(): string[] {
  return Array.from(termsByIndustry.keys()).filter(k => k !== 'cross-industry');
}

/**
 * Get all categories
 */
export function getCategories(): TermCategory[] {
  return Array.from(termsByCategory.keys()) as TermCategory[];
}

// ================================================================
// EXPORTS
// ================================================================

export { GLOSSARY_TERMS };
