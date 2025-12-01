/**
 * NLP Utilities
 *
 * Natural Language Processing utilities for text analysis
 *
 * Phase 3, Week 10
 */

// Types
export type {
  SentimentScore,
  SentimentLabel,
  AspectSentiment,
  ReadabilityScore,
  TextStatistics,
  Keyphrase,
  KeyphraseExtractionOptions,
  NamedEntity,
  EntityType,
  NegationSpan,
  HedgeDetection,
  CertaintyLevel,
  ComparativePattern,
  ComparativeType,
  DiscourseMarker,
  DiscourseFunction,
  Quotation,
  TemporalExpression,
  TemporalType,
  SimilarityResult,
  NLPConfig,
} from './types';

export { DEFAULT_NLP_CONFIG } from './types';

// Tokenizer
export {
  getStopwords,
  stem,
  tokenize,
  tokenizeSentences,
  tokenizeParagraphs,
  processText,
  generateNgrams,
  generateAllNgrams,
  countSyllables,
  countTextSyllables,
  getWordFrequencies,
  getTopTerms,
} from './tokenizer';

// Sentiment Analysis
export {
  analyzeSentiment,
  analyzeSentimentBySentence,
  analyzeAspectSentiment,
  getSentimentSummary,
  compareSentiment,
} from './sentiment';

// Readability
export {
  getTextStatistics,
  fleschReadingEase,
  fleschKincaidGrade,
  gunningFog,
  smogIndex,
  automatedReadabilityIndex,
  colemanLiauIndex,
  analyzeReadability,
  getReadabilitySummary,
  compareReadability,
} from './readability';

// Keyphrase Extraction
export {
  extractKeyphrases,
  calculateTfIdf,
  extractKeyphrasesWithTfIdf,
  extractSignificantNgrams,
  extractKeyPhrasesMultiMethod,
} from './keyphrases';

// Linguistic Patterns (original implementations - for backwards compatibility)
export {
  detectNegation,
  isNegated,
  detectHedges,
  getTextCertainty,
  detectComparatives,
  detectDiscourseMarkers,
  extractQuotations,
  detectTemporalExpressions,
} from './patterns';

// Negation Detection (enhanced module)
export {
  isNegationCue,
  hasNegationPrefix,
  getNegationContext,
  analyzeNegationIntensity,
  segmentByNegation,
  NEGATION_CUES,
  ALL_NEGATION_CUES,
} from './negation';

// Hedge/Certainty Detection (enhanced module)
export {
  countBoosters,
  scoreCertainty,
  getCertaintyLevel,
  analyzeCertainty,
  compareCertainty,
  containsHedging,
  getMostHedgedSentence,
  extractConfidentStatements,
  extractUncertainStatements,
  HEDGE_LEXICON,
  BOOSTERS,
} from './hedge';

export type { CertaintyAnalysis } from './hedge';

// Coreference Resolution
export {
  isPronoun,
  getPronounType,
  getPronounMetadata,
  detectPronouns,
  detectEntities,
  detectGenderFromName,
  detectEntityType,
  areCompatible,
  calculateConfidence,
  findAntecedent,
  resolveCoreferences,
  expandPronouns,
  getMentionsForEntity,
  countEntityReferences,
  getCoreferenceStats,
  PERSONAL_PRONOUNS,
  POSSESSIVE_PRONOUNS,
  REFLEXIVE_PRONOUNS,
  DEMONSTRATIVE_PRONOUNS,
  RELATIVE_PRONOUNS,
} from './coreference';

export type {
  PronounType,
  PronounGender,
  PronounPerson,
  PronounMention,
  EntityMention,
  EntityType as CoreferenceEntityType,
  CoreferenceLink,
  CoreferenceChain,
  CoreferenceResult,
} from './coreference';

// Aspect-Based Sentiment Analysis (ABSA)
export {
  analyzeABSA,
  detectAspects,
  extractAspectsFromKeyphrases,
  detectOpinions,
  linkAspectsWithOpinions,
  normalizeAspect,
  getAspectCategory,
  getAspectsByPolarity,
  getAspectsByCategory,
  getMostPositiveAspects,
  getMostNegativeAspects,
  generateABSASummary,
  compareABSA,
  ASPECT_LEXICON,
  POSITIVE_OPINIONS,
  NEGATIVE_OPINIONS,
  INTENSIFIERS,
} from './absa';

export type {
  Aspect,
  AspectCategory,
  SentimentPolarity,
  OpinionExpression,
  AspectSentiment as ABSAAspectSentiment,
  ABSAResult,
  CategorySentiment,
  ABSAStats,
} from './absa';

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

import { analyzeSentiment as _analyzeSentiment } from './sentiment';
import { analyzeReadability as _analyzeReadability } from './readability';
import { extractKeyphrases as _extractKeyphrases } from './keyphrases';
import { getTextStatistics as _getTextStatistics } from './readability';
import { detectNegation as _detectNegation, detectHedges as _detectHedges } from './patterns';

import type {
  SentimentScore,
  ReadabilityScore,
  Keyphrase,
  TextStatistics,
  NegationSpan,
  HedgeDetection,
} from './types';

/**
 * Comprehensive text analysis
 */
export interface TextAnalysis {
  sentiment: SentimentScore;
  readability: ReadabilityScore;
  keyphrases: Keyphrase[];
  statistics: TextStatistics;
  negations: NegationSpan[];
  hedges: HedgeDetection[];
}

/**
 * Perform comprehensive analysis on text
 */
export function analyzeText(text: string): TextAnalysis {
  return {
    sentiment: _analyzeSentiment(text),
    readability: _analyzeReadability(text),
    keyphrases: _extractKeyphrases(text),
    statistics: _getTextStatistics(text),
    negations: _detectNegation(text),
    hedges: _detectHedges(text),
  };
}

/**
 * Quick sentiment check (returns just the label)
 */
export function getSentimentLabel(text: string): string {
  return _analyzeSentiment(text).label;
}

/**
 * Quick readability check (returns grade level)
 */
export function getReadabilityGrade(text: string): number {
  return _analyzeReadability(text).averageGradeLevel;
}

/**
 * Get top keywords from text
 */
export function getKeywords(text: string, count: number = 5): string[] {
  return _extractKeyphrases(text, { maxPhrases: count }).map((k) => k.phrase);
}

// ================================================================
// DEFAULT EXPORT
// ================================================================

export default {
  // Analysis functions
  analyzeText,
  getSentimentLabel,
  getReadabilityGrade,
  getKeywords,
};
