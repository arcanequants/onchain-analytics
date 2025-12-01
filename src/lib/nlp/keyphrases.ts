/**
 * Keyphrase Extraction
 *
 * RAKE-inspired keyphrase extraction algorithm
 *
 * Phase 3, Week 10
 */

import type { Keyphrase, KeyphraseExtractionOptions } from './types';
import { tokenize, getStopwords, generateNgrams } from './tokenizer';

// ================================================================
// DEFAULT OPTIONS
// ================================================================

const DEFAULT_OPTIONS: Required<KeyphraseExtractionOptions> = {
  maxPhrases: 10,
  minWords: 1,
  maxWords: 4,
  minFrequency: 1,
  includeSingleWords: true,
};

// ================================================================
// KEYPHRASE EXTRACTION (RAKE-like)
// ================================================================

/**
 * Extract keyphrases from text using RAKE-inspired algorithm
 */
export function extractKeyphrases(
  text: string,
  options: KeyphraseExtractionOptions = {}
): Keyphrase[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const stopwords = getStopwords('en');

  // Split text into candidate phrases (split on stopwords and punctuation)
  const candidatePhrases = extractCandidatePhrases(text, stopwords);

  // Calculate word scores
  const wordScores = calculateWordScores(candidatePhrases);

  // Score phrases
  const phraseScores = scorePhrases(candidatePhrases, wordScores);

  // Filter and rank
  const keyphrases = Array.from(phraseScores.entries())
    .map(([phrase, score]) => {
      const wordCount = phrase.split(/\s+/).length;
      const frequency = candidatePhrases.filter((p) => p === phrase).length;
      return { phrase, score, frequency, wordCount };
    })
    .filter((kp) => {
      if (kp.wordCount < opts.minWords || kp.wordCount > opts.maxWords) return false;
      if (kp.frequency < opts.minFrequency) return false;
      if (!opts.includeSingleWords && kp.wordCount === 1) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxPhrases);

  // Normalize scores to 0-1
  const maxScore = Math.max(...keyphrases.map((k) => k.score), 1);
  return keyphrases.map((kp) => ({
    ...kp,
    score: kp.score / maxScore,
  }));
}

/**
 * Extract candidate phrases by splitting on stopwords
 */
function extractCandidatePhrases(text: string, stopwords: Set<string>): string[] {
  // Normalize text
  const normalized = text.toLowerCase().replace(/[^\w\s-]/g, ' ');

  // Split into words
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  // Build phrases by grouping consecutive non-stopwords
  const phrases: string[] = [];
  let currentPhrase: string[] = [];

  for (const word of words) {
    if (stopwords.has(word) || word.length < 2) {
      if (currentPhrase.length > 0) {
        phrases.push(currentPhrase.join(' '));
        currentPhrase = [];
      }
    } else {
      currentPhrase.push(word);
    }
  }

  // Add final phrase
  if (currentPhrase.length > 0) {
    phrases.push(currentPhrase.join(' '));
  }

  return phrases;
}

/**
 * Calculate word scores based on degree/frequency ratio (RAKE formula)
 */
function calculateWordScores(phrases: string[]): Map<string, number> {
  const wordFrequency = new Map<string, number>();
  const wordDegree = new Map<string, number>();

  for (const phrase of phrases) {
    const words = phrase.split(/\s+/);
    const degree = words.length - 1;

    for (const word of words) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      wordDegree.set(word, (wordDegree.get(word) || 0) + degree);
    }
  }

  // Calculate score = degree / frequency
  const wordScores = new Map<string, number>();
  for (const [word, freq] of wordFrequency) {
    const degree = wordDegree.get(word) || 0;
    wordScores.set(word, (degree + freq) / freq);
  }

  return wordScores;
}

/**
 * Score phrases by summing word scores
 */
function scorePhrases(
  phrases: string[],
  wordScores: Map<string, number>
): Map<string, number> {
  const phraseScores = new Map<string, number>();

  for (const phrase of phrases) {
    const words = phrase.split(/\s+/);
    const score = words.reduce((sum, word) => sum + (wordScores.get(word) || 0), 0);
    phraseScores.set(phrase, Math.max(phraseScores.get(phrase) || 0, score));
  }

  return phraseScores;
}

// ================================================================
// TF-IDF BASED EXTRACTION
// ================================================================

/**
 * Calculate TF-IDF scores for terms in a document
 */
export function calculateTfIdf(
  text: string,
  corpus: string[] = []
): Map<string, number> {
  const tokens = tokenize(text);
  const stopwords = getStopwords('en');
  const filteredTokens = tokens.filter((t) => !stopwords.has(t) && t.length > 2);

  // Term frequency in document
  const tf = new Map<string, number>();
  for (const token of filteredTokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }

  // Normalize TF
  const maxTf = Math.max(...tf.values(), 1);
  for (const [term, freq] of tf) {
    tf.set(term, freq / maxTf);
  }

  // If no corpus, use TF only
  if (corpus.length === 0) {
    return tf;
  }

  // Calculate IDF
  const N = corpus.length + 1; // +1 for current document
  const df = new Map<string, number>();

  for (const term of tf.keys()) {
    let docCount = 1; // Current document
    for (const doc of corpus) {
      if (doc.toLowerCase().includes(term)) {
        docCount++;
      }
    }
    df.set(term, docCount);
  }

  // Calculate TF-IDF
  const tfidf = new Map<string, number>();
  for (const [term, termFreq] of tf) {
    const docFreq = df.get(term) || 1;
    const idf = Math.log(N / docFreq);
    tfidf.set(term, termFreq * idf);
  }

  return tfidf;
}

/**
 * Extract keyphrases using TF-IDF
 */
export function extractKeyphrasesWithTfIdf(
  text: string,
  corpus: string[] = [],
  maxPhrases: number = 10
): Keyphrase[] {
  const tfidf = calculateTfIdf(text, corpus);

  // Get top terms
  const terms = Array.from(tfidf.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxPhrases * 2);

  // Calculate frequencies
  const tokens = tokenize(text);
  const frequencies = new Map<string, number>();
  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  }

  // Normalize scores
  const maxScore = Math.max(...terms.map(([, s]) => s), 1);

  return terms.slice(0, maxPhrases).map(([phrase, score]) => ({
    phrase,
    score: score / maxScore,
    frequency: frequencies.get(phrase) || 1,
    wordCount: 1,
  }));
}

// ================================================================
// N-GRAM BASED EXTRACTION
// ================================================================

/**
 * Extract significant n-grams from text
 */
export function extractSignificantNgrams(
  text: string,
  minN: number = 2,
  maxN: number = 3,
  minFrequency: number = 2
): Keyphrase[] {
  const tokens = tokenize(text);
  const stopwords = getStopwords('en');

  // Filter stopwords from tokens
  const filteredTokens = tokens.filter((t) => !stopwords.has(t) && t.length > 2);

  // Generate n-grams
  const ngrams: string[] = [];
  for (let n = minN; n <= maxN; n++) {
    ngrams.push(...generateNgrams(filteredTokens, n));
  }

  // Count frequencies
  const frequencies = new Map<string, number>();
  for (const ngram of ngrams) {
    frequencies.set(ngram, (frequencies.get(ngram) || 0) + 1);
  }

  // Filter by minimum frequency and score
  const results = Array.from(frequencies.entries())
    .filter(([, freq]) => freq >= minFrequency)
    .map(([phrase, frequency]) => ({
      phrase,
      frequency,
      wordCount: phrase.split(' ').length,
      score: frequency * phrase.split(' ').length, // Favor longer phrases
    }))
    .sort((a, b) => b.score - a.score);

  // Normalize scores
  const maxScore = Math.max(...results.map((r) => r.score), 1);
  return results.map((r) => ({
    ...r,
    score: r.score / maxScore,
  }));
}

// ================================================================
// COMBINED EXTRACTION
// ================================================================

/**
 * Extract keyphrases using multiple methods and combine results
 */
export function extractKeyPhrasesMultiMethod(
  text: string,
  options: KeyphraseExtractionOptions = {}
): Keyphrase[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get results from different methods
  const rakeResults = extractKeyphrases(text, opts);
  const tfidfResults = extractKeyphrasesWithTfIdf(text, [], opts.maxPhrases);
  const ngramResults = extractSignificantNgrams(text, 2, 3, 2);

  // Combine and deduplicate
  const combined = new Map<string, Keyphrase>();

  const addResult = (kp: Keyphrase, weight: number) => {
    const existing = combined.get(kp.phrase);
    if (existing) {
      existing.score = Math.max(existing.score, kp.score * weight);
      existing.frequency = Math.max(existing.frequency, kp.frequency);
    } else {
      combined.set(kp.phrase, {
        ...kp,
        score: kp.score * weight,
      });
    }
  };

  // Weight different methods
  rakeResults.forEach((kp) => addResult(kp, 1.0));
  tfidfResults.forEach((kp) => addResult(kp, 0.8));
  ngramResults.slice(0, opts.maxPhrases).forEach((kp) => addResult(kp, 0.6));

  // Sort and return top results
  return Array.from(combined.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxPhrases);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  extractKeyphrases,
  calculateTfIdf,
  extractKeyphrasesWithTfIdf,
  extractSignificantNgrams,
  extractKeyPhrasesMultiMethod,
};
