/**
 * NLP Types
 *
 * Type definitions for Natural Language Processing utilities
 *
 * Phase 3, Week 10
 */

// ================================================================
// SENTIMENT ANALYSIS
// ================================================================

export type SentimentLabel = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface SentimentScore {
  /** Overall sentiment label */
  label: SentimentLabel;
  /** Confidence score (0-1) */
  confidence: number;
  /** Positive score (0-1) */
  positive: number;
  /** Negative score (0-1) */
  negative: number;
  /** Neutral score (0-1) */
  neutral: number;
}

export interface AspectSentiment {
  /** The aspect/topic being discussed */
  aspect: string;
  /** Sentiment for this aspect */
  sentiment: SentimentLabel;
  /** Confidence score */
  confidence: number;
  /** Text snippet containing the aspect */
  snippet: string;
}

// ================================================================
// READABILITY
// ================================================================

export interface ReadabilityScore {
  /** Flesch Reading Ease (0-100, higher is easier) */
  fleschReadingEase: number;
  /** Flesch-Kincaid Grade Level (US grade) */
  fleschKincaidGrade: number;
  /** Gunning Fog Index (years of education) */
  gunningFog: number;
  /** SMOG Index (years of education) */
  smog: number;
  /** Automated Readability Index */
  automatedReadabilityIndex: number;
  /** Coleman-Liau Index */
  colemanLiau: number;
  /** Average of all grade-level metrics */
  averageGradeLevel: number;
  /** Reading difficulty label */
  difficulty: 'very_easy' | 'easy' | 'moderate' | 'difficult' | 'very_difficult';
}

export interface TextStatistics {
  /** Total character count */
  characterCount: number;
  /** Character count without spaces */
  characterCountNoSpaces: number;
  /** Total word count */
  wordCount: number;
  /** Total sentence count */
  sentenceCount: number;
  /** Total paragraph count */
  paragraphCount: number;
  /** Average word length */
  averageWordLength: number;
  /** Average sentence length (words) */
  averageSentenceLength: number;
  /** Average syllables per word */
  averageSyllablesPerWord: number;
  /** Percentage of complex words (3+ syllables) */
  complexWordPercentage: number;
}

// ================================================================
// KEYPHRASE EXTRACTION
// ================================================================

export interface Keyphrase {
  /** The keyphrase text */
  phrase: string;
  /** Relevance score (0-1) */
  score: number;
  /** Frequency in the text */
  frequency: number;
  /** Word count in phrase */
  wordCount: number;
}

export interface KeyphraseExtractionOptions {
  /** Maximum number of keyphrases to return */
  maxPhrases?: number;
  /** Minimum word count for phrases */
  minWords?: number;
  /** Maximum word count for phrases */
  maxWords?: number;
  /** Minimum frequency */
  minFrequency?: number;
  /** Include single words */
  includeSingleWords?: boolean;
}

// ================================================================
// NAMED ENTITY RECOGNITION
// ================================================================

export type EntityType =
  | 'PERSON'
  | 'ORGANIZATION'
  | 'LOCATION'
  | 'DATE'
  | 'TIME'
  | 'MONEY'
  | 'PERCENT'
  | 'PRODUCT'
  | 'EVENT'
  | 'URL'
  | 'EMAIL'
  | 'PHONE';

export interface NamedEntity {
  /** Entity text */
  text: string;
  /** Entity type */
  type: EntityType;
  /** Start position in text */
  start: number;
  /** End position in text */
  end: number;
  /** Confidence score */
  confidence: number;
}

// ================================================================
// NEGATION DETECTION
// ================================================================

export interface NegationSpan {
  /** Negation cue word */
  cue: string;
  /** Start position in original text */
  start: number;
  /** Text within negation scope */
  scope: string;
  /** Start position of negation scope */
  scopeStart: number;
  /** End position of negation scope */
  scopeEnd: number;
  /** Text within negation scope (alias for scope) */
  scopeText: string;
  /** Original text segment */
  originalText: string;
}

// ================================================================
// HEDGE/CERTAINTY DETECTION
// ================================================================

export type CertaintyLevel = 'high' | 'medium' | 'low';

export interface HedgeDetection {
  /** The hedge phrase detected */
  hedge: string;
  /** The hedge phrase detected (alias for hedge) */
  phrase: string;
  /** Certainty level */
  certainty: CertaintyLevel;
  /** Position in text */
  position: number;
  /** Context around the hedge */
  context: string;
}

// ================================================================
// COMPARATIVE ANALYSIS
// ================================================================

export type ComparativeType =
  | 'superiority' // "better than", "best"
  | 'inferiority' // "worse than", "worst"
  | 'equality' // "same as", "equal to"
  | 'preference'; // "prefer", "rather than"

export interface ComparativePattern {
  /** Type of comparison */
  type: ComparativeType;
  /** The matched pattern text */
  pattern: string;
  /** Subject being compared */
  subject: string | null;
  /** Object of comparison */
  object: string | null;
  /** Comparative keyword */
  keyword: string;
  /** Full comparison text */
  fullText: string;
  /** Position in text */
  position: number;
}

// ================================================================
// DISCOURSE MARKERS
// ================================================================

export type DiscourseFunction =
  | 'contrast' // "however", "but", "although"
  | 'addition' // "also", "furthermore", "moreover"
  | 'cause' // "because", "therefore", "thus"
  | 'condition' // "if", "unless", "provided"
  | 'temporal' // "then", "next", "finally"
  | 'example' // "for example", "such as"
  | 'emphasis' // "indeed", "certainly", "definitely"
  | 'summary'; // "in conclusion", "overall", "to sum up"

export interface DiscourseMarker {
  /** The marker text */
  marker: string;
  /** Discourse function */
  function: DiscourseFunction;
  /** Position in text */
  position: number;
  /** Sentence containing the marker */
  sentence: string;
}

// ================================================================
// QUOTATION/ATTRIBUTION
// ================================================================

export interface Quotation {
  /** The quoted text */
  text: string;
  /** The quoted text (alias for text) */
  quote: string;
  /** Speaker/source if identified */
  speaker: string | null;
  /** Attribution verb (said, stated, claimed, etc.) */
  verb: string | null;
  /** Start position */
  start: number;
  /** End position */
  end: number;
}

// ================================================================
// TEMPORAL EXPRESSIONS
// ================================================================

export type TemporalType = 'absolute' | 'relative' | 'duration' | 'frequency';

export interface TemporalExpression {
  /** The temporal expression text */
  expression: string;
  /** The temporal expression text (alias for expression) */
  text: string;
  /** Type of temporal expression */
  type: TemporalType;
  /** Normalized value if possible (ISO date or duration) */
  normalizedValue: string | null;
  /** Position in text */
  position: number;
  /** Recency indicator */
  recency: 'past' | 'present' | 'future' | 'unknown';
}

// ================================================================
// TEXT SIMILARITY
// ================================================================

export interface SimilarityResult {
  /** Cosine similarity (0-1) */
  cosine: number;
  /** Jaccard similarity (0-1) */
  jaccard: number;
  /** Dice coefficient (0-1) */
  dice: number;
  /** Combined/average similarity */
  combined: number;
}

// ================================================================
// CONFIGURATION
// ================================================================

export interface NLPConfig {
  /** Language code (en, es, pt, etc.) */
  language: string;
  /** Use stemming */
  useStemming: boolean;
  /** Remove stopwords */
  removeStopwords: boolean;
  /** Custom stopwords to add */
  customStopwords: string[];
  /** Minimum word length */
  minWordLength: number;
}

export const DEFAULT_NLP_CONFIG: NLPConfig = {
  language: 'en',
  useStemming: true,
  removeStopwords: true,
  customStopwords: [],
  minWordLength: 2,
};
