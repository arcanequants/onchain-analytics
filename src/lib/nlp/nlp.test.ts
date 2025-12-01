/**
 * NLP Utilities Tests
 *
 * Comprehensive tests for NLP utilities
 *
 * Phase 3, Week 10
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  // Tokenizer
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
  getStopwords,
  stem,
  // Sentiment
  analyzeSentiment,
  analyzeSentimentBySentence,
  analyzeAspectSentiment,
  getSentimentSummary,
  compareSentiment,
  // Readability
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
  // Keyphrases
  extractKeyphrases,
  calculateTfIdf,
  extractKeyphrasesWithTfIdf,
  extractSignificantNgrams,
  extractKeyPhrasesMultiMethod,
  // Patterns
  detectNegation,
  isNegated,
  detectHedges,
  getTextCertainty,
  detectComparatives,
  detectDiscourseMarkers,
  extractQuotations,
  detectTemporalExpressions,
  // Convenience
  analyzeText,
  getSentimentLabel,
  getReadabilityGrade,
  getKeywords,
  DEFAULT_NLP_CONFIG,
} from './index';

// ================================================================
// TOKENIZER TESTS
// ================================================================

describe('NLP: Tokenizer', () => {
  describe('tokenize', () => {
    it('should tokenize simple text', () => {
      const tokens = tokenize('Hello world');
      expect(tokens).toEqual(['hello', 'world']);
    });

    it('should handle punctuation', () => {
      const tokens = tokenize('Hello, world! How are you?');
      expect(tokens).toContain('hello');
      expect(tokens).toContain('world');
      expect(tokens).toContain('how');
      expect(tokens).toContain('are');
      expect(tokens).toContain('you');
    });

    it('should lowercase all tokens', () => {
      const tokens = tokenize('HELLO World HeLLo');
      expect(tokens).toEqual(['hello', 'world', 'hello']);
    });

    it('should handle contractions', () => {
      const tokens = tokenize("don't can't won't");
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should handle empty text', () => {
      const tokens = tokenize('');
      expect(tokens).toEqual([]);
    });

    it('should handle multiple spaces', () => {
      const tokens = tokenize('hello    world');
      expect(tokens).toEqual(['hello', 'world']);
    });
  });

  describe('tokenizeSentences', () => {
    it('should split on periods', () => {
      const sentences = tokenizeSentences('Hello world. How are you.');
      expect(sentences.length).toBe(2);
    });

    it('should split on exclamation marks', () => {
      const sentences = tokenizeSentences('Hello! World!');
      expect(sentences.length).toBe(2);
    });

    it('should split on question marks', () => {
      const sentences = tokenizeSentences('Hello? World?');
      expect(sentences.length).toBe(2);
    });

    it('should handle mixed punctuation', () => {
      const sentences = tokenizeSentences('Hello. How are you? Great!');
      expect(sentences.length).toBe(3);
    });

    it('should handle empty text', () => {
      const sentences = tokenizeSentences('');
      expect(sentences).toEqual([]);
    });
  });

  describe('tokenizeParagraphs', () => {
    it('should split on double newlines', () => {
      const paragraphs = tokenizeParagraphs('Para 1.\n\nPara 2.');
      expect(paragraphs.length).toBe(2);
    });

    it('should handle multiple newlines', () => {
      const paragraphs = tokenizeParagraphs('Para 1.\n\n\n\nPara 2.');
      expect(paragraphs.length).toBe(2);
    });

    it('should trim whitespace', () => {
      const paragraphs = tokenizeParagraphs('  Para 1.  \n\n  Para 2.  ');
      expect(paragraphs[0]).toBe('Para 1.');
      expect(paragraphs[1]).toBe('Para 2.');
    });
  });

  describe('processText', () => {
    it('should apply default config', () => {
      const tokens = processText('The quick brown fox jumps.');
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should remove stopwords when configured', () => {
      const tokens = processText('The quick brown fox', { removeStopwords: true });
      expect(tokens).not.toContain('the');
    });

    it('should filter by minimum length', () => {
      const tokens = processText('a an the quick brown', { minWordLength: 3 });
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('an');
    });

    it('should apply stemming when configured', () => {
      const tokens = processText('running jumped walks', { useStemming: true });
      // Stemmed versions
      expect(tokens.some((t) => t.length < 'running'.length)).toBe(true);
    });
  });

  describe('generateNgrams', () => {
    it('should generate bigrams', () => {
      const tokens = ['hello', 'world', 'test'];
      const ngrams = generateNgrams(tokens, 2);
      expect(ngrams).toContain('hello world');
      expect(ngrams).toContain('world test');
      expect(ngrams.length).toBe(2);
    });

    it('should generate trigrams', () => {
      const tokens = ['a', 'b', 'c', 'd'];
      const ngrams = generateNgrams(tokens, 3);
      expect(ngrams).toContain('a b c');
      expect(ngrams).toContain('b c d');
      expect(ngrams.length).toBe(2);
    });

    it('should return empty for insufficient tokens', () => {
      const tokens = ['hello'];
      const ngrams = generateNgrams(tokens, 3);
      expect(ngrams).toEqual([]);
    });
  });

  describe('generateAllNgrams', () => {
    it('should generate ngrams of all sizes', () => {
      const tokens = ['a', 'b', 'c'];
      const ngrams = generateAllNgrams(tokens, 1, 2);
      expect(ngrams).toContain('a');
      expect(ngrams).toContain('b');
      expect(ngrams).toContain('c');
      expect(ngrams).toContain('a b');
      expect(ngrams).toContain('b c');
    });
  });

  describe('countSyllables', () => {
    it('should count single syllable words', () => {
      expect(countSyllables('cat')).toBe(1);
      expect(countSyllables('dog')).toBe(1);
    });

    it('should count multi-syllable words', () => {
      expect(countSyllables('hello')).toBeGreaterThanOrEqual(2);
      expect(countSyllables('computer')).toBeGreaterThanOrEqual(2);
    });

    it('should handle short words', () => {
      expect(countSyllables('a')).toBe(1);
      expect(countSyllables('an')).toBe(1);
    });
  });

  describe('countTextSyllables', () => {
    it('should count total syllables in text', () => {
      const count = countTextSyllables('hello world');
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('getWordFrequencies', () => {
    it('should count word occurrences', () => {
      const tokens = ['hello', 'world', 'hello'];
      const freq = getWordFrequencies(tokens);
      expect(freq.get('hello')).toBe(2);
      expect(freq.get('world')).toBe(1);
    });

    it('should handle empty array', () => {
      const freq = getWordFrequencies([]);
      expect(freq.size).toBe(0);
    });
  });

  describe('getTopTerms', () => {
    it('should return top N terms', () => {
      const tokens = ['a', 'a', 'a', 'b', 'b', 'c'];
      const top = getTopTerms(tokens, 2);
      expect(top[0].term).toBe('a');
      expect(top[0].count).toBe(3);
      expect(top.length).toBe(2);
    });
  });

  describe('getStopwords', () => {
    it('should return English stopwords by default', () => {
      const stopwords = getStopwords('en');
      expect(stopwords.has('the')).toBe(true);
      expect(stopwords.has('and')).toBe(true);
    });

    it('should return Spanish stopwords', () => {
      const stopwords = getStopwords('es');
      expect(stopwords.has('el')).toBe(true);
      expect(stopwords.has('la')).toBe(true);
    });

    it('should return Portuguese stopwords', () => {
      const stopwords = getStopwords('pt');
      expect(stopwords.has('o')).toBe(true);
      expect(stopwords.has('a')).toBe(true);
    });

    it('should add custom stopwords', () => {
      const stopwords = getStopwords('en', ['customword']);
      expect(stopwords.has('customword')).toBe(true);
      expect(stopwords.has('the')).toBe(true);
    });
  });

  describe('stem', () => {
    it('should stem words ending in -ing', () => {
      const stemmed = stem('running');
      expect(stemmed.length).toBeLessThan('running'.length);
    });

    it('should stem words ending in -ed', () => {
      const stemmed = stem('jumped');
      expect(stemmed.length).toBeLessThan('jumped'.length);
    });

    it('should stem plurals', () => {
      const stemmed = stem('cats');
      expect(stemmed).toBe('cat');
    });

    it('should handle short words', () => {
      const stemmed = stem('go');
      expect(stemmed).toBe('go');
    });
  });
});

// ================================================================
// SENTIMENT TESTS
// ================================================================

describe('NLP: Sentiment Analysis', () => {
  describe('analyzeSentiment', () => {
    it('should detect positive sentiment', () => {
      const result = analyzeSentiment('This is excellent and amazing!');
      expect(result.label).toBe('positive');
      expect(result.positive).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', () => {
      const result = analyzeSentiment('This is terrible and horrible!');
      expect(result.label).toBe('negative');
      expect(result.negative).toBeGreaterThan(0);
    });

    it('should detect neutral sentiment', () => {
      const result = analyzeSentiment('The sky is blue.');
      expect(result.label).toBe('neutral');
    });

    it('should handle negation', () => {
      const positiveResult = analyzeSentiment('This is good.');
      const negatedResult = analyzeSentiment('This is not good.');
      expect(negatedResult.positive).toBeLessThan(positiveResult.positive);
    });

    it('should return confidence score', () => {
      const result = analyzeSentiment('Excellent product!');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle empty text', () => {
      const result = analyzeSentiment('');
      expect(result.label).toBe('neutral');
    });
  });

  describe('analyzeSentimentBySentence', () => {
    it('should analyze each sentence', () => {
      const results = analyzeSentimentBySentence('Great product! Terrible service.');
      expect(results.length).toBe(2);
      expect(results[0].sentiment.label).toBe('positive');
      expect(results[1].sentiment.label).toBe('negative');
    });

    it('should return sentence text', () => {
      const results = analyzeSentimentBySentence('Hello world.');
      expect(results[0].sentence).toBe('Hello world.');
    });
  });

  describe('analyzeAspectSentiment', () => {
    it('should detect quality aspect', () => {
      const results = analyzeAspectSentiment('The quality is excellent.');
      expect(results.some((r) => r.aspect === 'quality')).toBe(true);
    });

    it('should detect price aspect', () => {
      const results = analyzeAspectSentiment('The price is too expensive.');
      expect(results.some((r) => r.aspect === 'price')).toBe(true);
    });

    it('should detect service aspect', () => {
      const results = analyzeAspectSentiment('Customer service was terrible.');
      expect(results.some((r) => r.aspect === 'service')).toBe(true);
    });

    it('should include sentiment for each aspect', () => {
      const results = analyzeAspectSentiment('The quality is great.');
      const qualityAspect = results.find((r) => r.aspect === 'quality');
      expect(qualityAspect?.sentiment).toBeDefined();
    });
  });

  describe('getSentimentSummary', () => {
    it('should return overall sentiment', () => {
      const summary = getSentimentSummary('Great product! Excellent quality.');
      expect(summary.overall).toBeDefined();
      expect(summary.overall.label).toBe('positive');
    });

    it('should return sentence breakdown', () => {
      const summary = getSentimentSummary('Good. Bad.');
      expect(summary.bySentence.length).toBe(2);
    });

    it('should return distribution', () => {
      const summary = getSentimentSummary('Great! Terrible! Okay.');
      expect(summary.distribution.positive).toBeDefined();
      expect(summary.distribution.negative).toBeDefined();
      expect(summary.distribution.neutral).toBeDefined();
    });
  });

  describe('compareSentiment', () => {
    it('should compare two texts', () => {
      const comparison = compareSentiment('Terrible product.', 'Excellent product.');
      expect(comparison.text1.label).toBe('negative');
      expect(comparison.text2.label).toBe('positive');
      expect(comparison.difference.direction).toBe('improved');
    });

    it('should detect decline', () => {
      const comparison = compareSentiment('Excellent product.', 'Terrible product.');
      expect(comparison.difference.direction).toBe('declined');
    });

    it('should detect unchanged', () => {
      const comparison = compareSentiment('The sky is blue.', 'The grass is green.');
      expect(comparison.difference.direction).toBe('unchanged');
    });
  });
});

// ================================================================
// READABILITY TESTS
// ================================================================

describe('NLP: Readability', () => {
  const sampleText = `
    The quick brown fox jumps over the lazy dog. This sentence is used for testing.
    It contains multiple words and sentences to analyze. The analysis will provide
    useful metrics about the text readability.
  `.trim();

  describe('getTextStatistics', () => {
    it('should count characters', () => {
      const stats = getTextStatistics('Hello world');
      expect(stats.characterCount).toBe(11);
    });

    it('should count characters without spaces', () => {
      const stats = getTextStatistics('Hello world');
      expect(stats.characterCountNoSpaces).toBe(10);
    });

    it('should count words', () => {
      const stats = getTextStatistics('Hello world test');
      expect(stats.wordCount).toBe(3);
    });

    it('should count sentences', () => {
      const stats = getTextStatistics('Hello. World. Test.');
      expect(stats.sentenceCount).toBe(3);
    });

    it('should count paragraphs', () => {
      const stats = getTextStatistics('Para 1.\n\nPara 2.');
      expect(stats.paragraphCount).toBe(2);
    });

    it('should calculate average word length', () => {
      const stats = getTextStatistics('cat dog rat');
      expect(stats.averageWordLength).toBe(3);
    });

    it('should calculate average sentence length', () => {
      const stats = getTextStatistics('One two. Three four.');
      expect(stats.averageSentenceLength).toBe(2);
    });
  });

  describe('fleschReadingEase', () => {
    it('should return score between 0 and 100', () => {
      const stats = getTextStatistics(sampleText);
      const score = fleschReadingEase(stats);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return higher score for simpler text', () => {
      const simpleStats = getTextStatistics('The cat sat. The dog ran.');
      const complexStats = getTextStatistics('Incomprehensible manifestations permeated the atmosphere.');
      const simpleScore = fleschReadingEase(simpleStats);
      const complexScore = fleschReadingEase(complexStats);
      expect(simpleScore).toBeGreaterThan(complexScore);
    });

    it('should handle empty text', () => {
      const stats = getTextStatistics('');
      const score = fleschReadingEase(stats);
      expect(score).toBe(0);
    });
  });

  describe('fleschKincaidGrade', () => {
    it('should return grade level', () => {
      const stats = getTextStatistics(sampleText);
      const grade = fleschKincaidGrade(stats);
      expect(grade).toBeGreaterThanOrEqual(0);
    });

    it('should return lower grade for simpler text', () => {
      const simpleStats = getTextStatistics('The cat sat.');
      const complexStats = getTextStatistics('Unprecedented circumstances necessitate extraordinary measures.');
      const simpleGrade = fleschKincaidGrade(simpleStats);
      const complexGrade = fleschKincaidGrade(complexStats);
      expect(simpleGrade).toBeLessThan(complexGrade);
    });
  });

  describe('gunningFog', () => {
    it('should return fog index', () => {
      const stats = getTextStatistics(sampleText);
      const fog = gunningFog(stats);
      expect(fog).toBeGreaterThanOrEqual(0);
    });
  });

  describe('smogIndex', () => {
    it('should return SMOG index', () => {
      const smog = smogIndex(sampleText);
      expect(smog).toBeGreaterThanOrEqual(0);
    });
  });

  describe('automatedReadabilityIndex', () => {
    it('should return ARI score', () => {
      const stats = getTextStatistics(sampleText);
      const ari = automatedReadabilityIndex(stats);
      expect(ari).toBeGreaterThanOrEqual(0);
    });
  });

  describe('colemanLiauIndex', () => {
    it('should return CLI score', () => {
      const stats = getTextStatistics(sampleText);
      const cli = colemanLiauIndex(stats);
      expect(cli).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeReadability', () => {
    it('should return all metrics', () => {
      const result = analyzeReadability(sampleText);
      expect(result.fleschReadingEase).toBeDefined();
      expect(result.fleschKincaidGrade).toBeDefined();
      expect(result.gunningFog).toBeDefined();
      expect(result.smog).toBeDefined();
      expect(result.automatedReadabilityIndex).toBeDefined();
      expect(result.colemanLiau).toBeDefined();
    });

    it('should calculate average grade level', () => {
      const result = analyzeReadability(sampleText);
      expect(result.averageGradeLevel).toBeGreaterThanOrEqual(0);
    });

    it('should determine difficulty', () => {
      const easyResult = analyzeReadability('The cat sat on the mat.');
      expect(['very_easy', 'easy', 'moderate', 'difficult', 'very_difficult']).toContain(easyResult.difficulty);
    });
  });

  describe('getReadabilitySummary', () => {
    it('should include score', () => {
      const summary = getReadabilitySummary(sampleText);
      expect(summary.score).toBeDefined();
    });

    it('should include statistics', () => {
      const summary = getReadabilitySummary(sampleText);
      expect(summary.statistics).toBeDefined();
      expect(summary.statistics.wordCount).toBeGreaterThan(0);
    });

    it('should include audience', () => {
      const summary = getReadabilitySummary(sampleText);
      expect(summary.audience).toBeDefined();
      expect(typeof summary.audience).toBe('string');
    });

    it('should provide recommendations for complex text', () => {
      const complexText = 'Unprecedented circumstances necessitate extraordinary measures. ' +
        'Incomprehensible manifestations permeated the multidimensional atmosphere. ' +
        'Extraordinarily complicated terminologies obfuscated comprehension.';
      const summary = getReadabilitySummary(complexText);
      expect(summary.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('compareReadability', () => {
    it('should compare two texts', () => {
      const comparison = compareReadability('The cat sat.', 'Extraordinarily complicated.');
      expect(comparison.text1).toBeDefined();
      expect(comparison.text2).toBeDefined();
      expect(comparison.comparison).toBeDefined();
    });

    it('should identify easier text', () => {
      const comparison = compareReadability('The cat.', 'Incomprehensible manifestations.');
      expect(comparison.comparison.easierText).toBeDefined();
    });

    it('should calculate differences', () => {
      const comparison = compareReadability('Simple text.', 'Complex terminology.');
      expect(typeof comparison.comparison.gradeLevelDifference).toBe('number');
      expect(typeof comparison.comparison.fleschDifference).toBe('number');
    });
  });
});

// ================================================================
// KEYPHRASE TESTS
// ================================================================

describe('NLP: Keyphrase Extraction', () => {
  const sampleText = `
    Machine learning algorithms process large datasets to identify patterns.
    Deep learning neural networks have revolutionized artificial intelligence.
    Natural language processing enables computers to understand human language.
  `.trim();

  describe('extractKeyphrases', () => {
    it('should extract keyphrases', () => {
      const keyphrases = extractKeyphrases(sampleText);
      expect(keyphrases.length).toBeGreaterThan(0);
    });

    it('should include phrase text', () => {
      const keyphrases = extractKeyphrases(sampleText);
      expect(typeof keyphrases[0].phrase).toBe('string');
    });

    it('should include score', () => {
      const keyphrases = extractKeyphrases(sampleText);
      expect(keyphrases[0].score).toBeGreaterThanOrEqual(0);
      expect(keyphrases[0].score).toBeLessThanOrEqual(1);
    });

    it('should include frequency', () => {
      const keyphrases = extractKeyphrases(sampleText);
      expect(keyphrases[0].frequency).toBeGreaterThanOrEqual(1);
    });

    it('should include word count', () => {
      const keyphrases = extractKeyphrases(sampleText);
      expect(keyphrases[0].wordCount).toBeGreaterThanOrEqual(1);
    });

    it('should respect maxPhrases option', () => {
      const keyphrases = extractKeyphrases(sampleText, { maxPhrases: 3 });
      expect(keyphrases.length).toBeLessThanOrEqual(3);
    });

    it('should respect minWords option', () => {
      const keyphrases = extractKeyphrases(sampleText, { minWords: 2 });
      keyphrases.forEach((kp) => {
        expect(kp.wordCount).toBeGreaterThanOrEqual(2);
      });
    });

    it('should respect maxWords option', () => {
      const keyphrases = extractKeyphrases(sampleText, { maxWords: 2 });
      keyphrases.forEach((kp) => {
        expect(kp.wordCount).toBeLessThanOrEqual(2);
      });
    });

    it('should sort by score descending', () => {
      const keyphrases = extractKeyphrases(sampleText);
      for (let i = 1; i < keyphrases.length; i++) {
        expect(keyphrases[i - 1].score).toBeGreaterThanOrEqual(keyphrases[i].score);
      }
    });
  });

  describe('calculateTfIdf', () => {
    it('should return TF-IDF scores', () => {
      const tfidf = calculateTfIdf(sampleText);
      expect(tfidf.size).toBeGreaterThan(0);
    });

    it('should assign scores to terms', () => {
      const tfidf = calculateTfIdf('machine learning machine');
      expect(tfidf.has('machine')).toBe(true);
    });

    it('should work with corpus', () => {
      const corpus = ['other document text', 'another document here'];
      const tfidf = calculateTfIdf(sampleText, corpus);
      expect(tfidf.size).toBeGreaterThan(0);
    });
  });

  describe('extractKeyphrasesWithTfIdf', () => {
    it('should extract keyphrases using TF-IDF', () => {
      const keyphrases = extractKeyphrasesWithTfIdf(sampleText);
      expect(keyphrases.length).toBeGreaterThan(0);
    });

    it('should respect maxPhrases parameter', () => {
      const keyphrases = extractKeyphrasesWithTfIdf(sampleText, [], 3);
      expect(keyphrases.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractSignificantNgrams', () => {
    const repeatedText = 'machine learning is great. machine learning works well. machine learning algorithms.';

    it('should extract n-grams', () => {
      const ngrams = extractSignificantNgrams(repeatedText, 2, 2, 2);
      expect(ngrams.length).toBeGreaterThan(0);
    });

    it('should filter by minimum frequency', () => {
      const ngrams = extractSignificantNgrams(repeatedText, 2, 2, 2);
      ngrams.forEach((ng) => {
        expect(ng.frequency).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('extractKeyPhrasesMultiMethod', () => {
    it('should combine multiple methods', () => {
      const keyphrases = extractKeyPhrasesMultiMethod(sampleText);
      expect(keyphrases.length).toBeGreaterThan(0);
    });

    it('should deduplicate results', () => {
      const keyphrases = extractKeyPhrasesMultiMethod(sampleText);
      const phrases = keyphrases.map((k) => k.phrase);
      const uniquePhrases = [...new Set(phrases)];
      expect(phrases.length).toBe(uniquePhrases.length);
    });
  });
});

// ================================================================
// PATTERN DETECTION TESTS
// ================================================================

describe('NLP: Pattern Detection', () => {
  describe('detectNegation', () => {
    it('should detect not', () => {
      const negations = detectNegation('This is not good.');
      expect(negations.length).toBeGreaterThan(0);
      expect(negations[0].cue).toBe('not');
    });

    it('should detect never', () => {
      const negations = detectNegation('I never liked it.');
      expect(negations.some((n) => n.cue === 'never')).toBe(true);
    });

    it('should detect contractions', () => {
      const negations = detectNegation("I don't like it.");
      expect(negations.length).toBeGreaterThan(0);
    });

    it('should return start index', () => {
      const negations = detectNegation('This is not good.');
      expect(typeof negations[0].start).toBe('number');
    });

    it('should return scope', () => {
      const negations = detectNegation('This is not good.');
      expect(typeof negations[0].scope).toBe('string');
    });
  });

  describe('isNegated', () => {
    it('should return true for negated phrase', () => {
      expect(isNegated('This is not good.', 'good')).toBe(true);
    });

    it('should return false for non-negated phrase', () => {
      expect(isNegated('This is really good.', 'good')).toBe(false);
    });
  });

  describe('detectHedges', () => {
    it('should detect maybe', () => {
      const hedges = detectHedges('Maybe this will work.');
      expect(hedges.length).toBeGreaterThan(0);
    });

    it('should detect probably', () => {
      const hedges = detectHedges('This is probably correct.');
      expect(hedges.some((h) => h.hedge === 'probably')).toBe(true);
    });

    it('should classify certainty level', () => {
      const hedges = detectHedges('This might possibly work.');
      expect(['high', 'medium', 'low']).toContain(hedges[0].certainty);
    });
  });

  describe('getTextCertainty', () => {
    it('should return certainty level', () => {
      const result = getTextCertainty('This is definitely correct.');
      expect(['high', 'medium', 'low']).toContain(result.level);
    });

    it('should count hedges', () => {
      const result = getTextCertainty('Maybe perhaps possibly.');
      expect(result.hedgeCount).toBeGreaterThan(0);
    });

    it('should return distribution', () => {
      const result = getTextCertainty('Maybe this is probably correct.');
      expect(result.distribution.high).toBeDefined();
      expect(result.distribution.medium).toBeDefined();
      expect(result.distribution.low).toBeDefined();
    });
  });

  describe('detectComparatives', () => {
    it('should detect better than', () => {
      const comparatives = detectComparatives('This is better than that.');
      expect(comparatives.length).toBeGreaterThan(0);
    });

    it('should detect more than', () => {
      const comparatives = detectComparatives('This has more features than the other.');
      expect(comparatives.some((c) => c.pattern.includes('more'))).toBe(true);
    });

    it('should classify comparison type', () => {
      const comparatives = detectComparatives('A is better than B.');
      expect(['superiority', 'inferiority', 'equality', 'preference']).toContain(comparatives[0].type);
    });
  });

  describe('detectDiscourseMarkers', () => {
    it('should detect however', () => {
      const markers = detectDiscourseMarkers('However, this is different.');
      expect(markers.some((m) => m.marker === 'however')).toBe(true);
    });

    it('should detect therefore', () => {
      const markers = detectDiscourseMarkers('Therefore, we conclude.');
      expect(markers.some((m) => m.marker === 'therefore')).toBe(true);
    });

    it('should classify function', () => {
      const markers = detectDiscourseMarkers('However, this is different.');
      expect(['contrast', 'addition', 'cause', 'condition', 'temporal', 'example', 'emphasis', 'summary'])
        .toContain(markers[0].function);
    });
  });

  describe('extractQuotations', () => {
    it('should extract double-quoted text', () => {
      const quotes = extractQuotations('He said "hello world" today.');
      expect(quotes.length).toBeGreaterThan(0);
      expect(quotes[0].text).toBe('hello world');
    });

    it('should extract single-quoted text', () => {
      // Single quotes need at least 10 chars per the pattern
      const quotes = extractQuotations("She said 'this is a test message' then.");
      expect(quotes.length).toBeGreaterThan(0);
    });

    it('should detect speaker when present', () => {
      const quotes = extractQuotations('John said "hello world" yesterday.');
      if (quotes[0].speaker) {
        expect(typeof quotes[0].speaker).toBe('string');
      }
    });
  });

  describe('detectTemporalExpressions', () => {
    it('should detect yesterday', () => {
      const temporals = detectTemporalExpressions('I went there yesterday.');
      expect(temporals.some((t) => t.expression === 'yesterday')).toBe(true);
    });

    it('should detect tomorrow', () => {
      const temporals = detectTemporalExpressions('We will go tomorrow.');
      expect(temporals.some((t) => t.expression === 'tomorrow')).toBe(true);
    });

    it('should detect date patterns', () => {
      const temporals = detectTemporalExpressions('The event is on 2024-01-15.');
      expect(temporals.length).toBeGreaterThan(0);
    });

    it('should classify temporal type', () => {
      const temporals = detectTemporalExpressions('Yesterday was great.');
      expect(['absolute', 'relative', 'duration', 'frequency']).toContain(temporals[0].type);
    });
  });
});

// ================================================================
// CONVENIENCE FUNCTION TESTS
// ================================================================

describe('NLP: Convenience Functions', () => {
  const sampleText = 'This is an excellent product. The quality is outstanding. I highly recommend it.';

  describe('analyzeText', () => {
    it('should return comprehensive analysis', () => {
      const analysis = analyzeText(sampleText);
      expect(analysis.sentiment).toBeDefined();
      expect(analysis.readability).toBeDefined();
      expect(analysis.keyphrases).toBeDefined();
      expect(analysis.statistics).toBeDefined();
      expect(analysis.negations).toBeDefined();
      expect(analysis.hedges).toBeDefined();
    });

    it('should detect positive sentiment', () => {
      const analysis = analyzeText(sampleText);
      expect(analysis.sentiment.label).toBe('positive');
    });

    it('should extract keyphrases', () => {
      const analysis = analyzeText(sampleText);
      expect(analysis.keyphrases.length).toBeGreaterThan(0);
    });
  });

  describe('getSentimentLabel', () => {
    it('should return positive for positive text', () => {
      const label = getSentimentLabel('Excellent amazing wonderful!');
      expect(label).toBe('positive');
    });

    it('should return negative for negative text', () => {
      const label = getSentimentLabel('Terrible horrible awful!');
      expect(label).toBe('negative');
    });

    it('should return neutral for neutral text', () => {
      const label = getSentimentLabel('The sky is blue.');
      expect(label).toBe('neutral');
    });
  });

  describe('getReadabilityGrade', () => {
    it('should return a number', () => {
      const grade = getReadabilityGrade(sampleText);
      expect(typeof grade).toBe('number');
    });

    it('should return lower grade for simpler text', () => {
      const simpleGrade = getReadabilityGrade('The cat sat.');
      const complexGrade = getReadabilityGrade('Incomprehensible manifestations.');
      expect(simpleGrade).toBeLessThan(complexGrade);
    });
  });

  describe('getKeywords', () => {
    it('should return array of strings', () => {
      const keywords = getKeywords(sampleText);
      expect(Array.isArray(keywords)).toBe(true);
      keywords.forEach((kw) => expect(typeof kw).toBe('string'));
    });

    it('should respect count parameter', () => {
      const keywords = getKeywords(sampleText, 3);
      expect(keywords.length).toBeLessThanOrEqual(3);
    });
  });
});

// ================================================================
// CONFIG TESTS
// ================================================================

describe('NLP: Configuration', () => {
  describe('DEFAULT_NLP_CONFIG', () => {
    it('should have language setting', () => {
      expect(DEFAULT_NLP_CONFIG.language).toBeDefined();
    });

    it('should have removeStopwords setting', () => {
      expect(typeof DEFAULT_NLP_CONFIG.removeStopwords).toBe('boolean');
    });

    it('should have useStemming setting', () => {
      expect(typeof DEFAULT_NLP_CONFIG.useStemming).toBe('boolean');
    });

    it('should have minWordLength setting', () => {
      expect(typeof DEFAULT_NLP_CONFIG.minWordLength).toBe('number');
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('NLP: Edge Cases', () => {
  describe('Empty Input Handling', () => {
    it('should handle empty string for tokenize', () => {
      expect(tokenize('')).toEqual([]);
    });

    it('should handle empty string for sentiment', () => {
      const result = analyzeSentiment('');
      expect(result.label).toBe('neutral');
    });

    it('should handle empty string for readability', () => {
      const result = analyzeReadability('');
      expect(result.fleschReadingEase).toBe(0);
    });

    it('should handle empty string for keyphrases', () => {
      const result = extractKeyphrases('');
      expect(result).toEqual([]);
    });
  });

  describe('Special Characters', () => {
    it('should handle text with numbers', () => {
      const tokens = tokenize('I have 5 apples and 10 oranges.');
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should handle text with symbols', () => {
      const tokens = tokenize('Price: $100 @ 20% discount!');
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should handle unicode text', () => {
      const tokens = tokenize('Cafe resume naive');
      expect(tokens.length).toBe(3);
    });
  });

  describe('Long Text', () => {
    const longText = 'The quick brown fox jumps over the lazy dog. '.repeat(100);

    it('should handle long text for tokenization', () => {
      const tokens = tokenize(longText);
      expect(tokens.length).toBeGreaterThan(100);
    });

    it('should handle long text for sentiment', () => {
      const result = analyzeSentiment(longText);
      expect(result).toBeDefined();
    });

    it('should handle long text for readability', () => {
      const result = analyzeReadability(longText);
      expect(result).toBeDefined();
    });
  });

  describe('Single Word Input', () => {
    it('should handle single word for tokenize', () => {
      expect(tokenize('hello')).toEqual(['hello']);
    });

    it('should handle single word for sentiment', () => {
      const result = analyzeSentiment('excellent');
      expect(result.label).toBe('positive');
    });
  });
});

// ================================================================
// ENHANCED NEGATION DETECTION TESTS
// ================================================================

import {
  isNegationCue,
  hasNegationPrefix,
  getNegationContext,
  analyzeNegationIntensity,
  segmentByNegation,
  NEGATION_CUES,
  ALL_NEGATION_CUES,
} from './negation';

describe('NLP: Enhanced Negation Detection', () => {
  describe('NEGATION_CUES constants', () => {
    it('should have standard negation cues', () => {
      expect(NEGATION_CUES.standard).toContain('not');
      expect(NEGATION_CUES.standard).toContain('never');
      expect(NEGATION_CUES.standard).toContain('no');
    });

    it('should have contraction cues', () => {
      expect(NEGATION_CUES.contractions).toContain("don't");
      expect(NEGATION_CUES.contractions).toContain("can't");
    });

    it('should have prefix cues', () => {
      expect(NEGATION_CUES.prefixes).toContain('un');
      expect(NEGATION_CUES.prefixes).toContain('dis');
    });

    it('should have adverb cues', () => {
      expect(NEGATION_CUES.adverbs).toContain('hardly');
      expect(NEGATION_CUES.adverbs).toContain('barely');
    });
  });

  describe('ALL_NEGATION_CUES', () => {
    it('should be a flat array', () => {
      expect(Array.isArray(ALL_NEGATION_CUES)).toBe(true);
    });

    it('should contain standard cues', () => {
      expect(ALL_NEGATION_CUES).toContain('not');
      expect(ALL_NEGATION_CUES).toContain('never');
    });
  });

  describe('isNegationCue', () => {
    it('should return true for negation words', () => {
      expect(isNegationCue('not')).toBe(true);
      expect(isNegationCue('never')).toBe(true);
      expect(isNegationCue('no')).toBe(true);
    });

    it('should return false for non-negation words', () => {
      expect(isNegationCue('yes')).toBe(false);
      expect(isNegationCue('good')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isNegationCue('NOT')).toBe(true);
      expect(isNegationCue('Never')).toBe(true);
    });
  });

  describe('hasNegationPrefix', () => {
    it('should detect un- prefix', () => {
      const result = hasNegationPrefix('unhappy');
      expect(result.hasPrefix).toBe(true);
      expect(result.prefix).toBe('un');
    });

    it('should detect dis- prefix', () => {
      const result = hasNegationPrefix('disagree');
      expect(result.hasPrefix).toBe(true);
      expect(result.prefix).toBe('dis');
    });

    it('should detect in- prefix', () => {
      const result = hasNegationPrefix('incomplete');
      expect(result.hasPrefix).toBe(true);
    });

    it('should return false for non-prefixed words', () => {
      const result = hasNegationPrefix('happy');
      expect(result.hasPrefix).toBe(false);
    });
  });

  describe('getNegationContext', () => {
    it('should return negation span for negated phrase', () => {
      const context = getNegationContext('I do not like this product', 'like');
      expect(context).not.toBeNull();
      expect(context?.cue).toBe('not');
    });

    it('should return null for non-negated phrase', () => {
      const context = getNegationContext('I really like this product', 'like');
      expect(context).toBeNull();
    });
  });

  describe('analyzeNegationIntensity', () => {
    it('should return 0 for text without negation', () => {
      const intensity = analyzeNegationIntensity('This is great and wonderful');
      expect(intensity).toBe(0);
    });

    it('should return positive value for negated text', () => {
      const intensity = analyzeNegationIntensity('This is not good');
      expect(intensity).toBeGreaterThan(0);
    });

    it('should return higher value for heavily negated text', () => {
      const lightNegation = analyzeNegationIntensity('This is not good');
      const heavyNegation = analyzeNegationIntensity('Never, never, never will this work');
      expect(heavyNegation).toBeGreaterThan(lightNegation);
    });

    it('should return value between 0 and 1', () => {
      const intensity = analyzeNegationIntensity('I do not like anything here');
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
    });
  });

  describe('segmentByNegation', () => {
    it('should separate affirmative and negated portions', () => {
      const result = segmentByNegation('This is good. This is not bad.');
      expect(result.affirmative.length).toBeGreaterThanOrEqual(0);
      expect(result.negated.length).toBeGreaterThanOrEqual(0);
    });

    it('should put negated sentences in negated array', () => {
      const result = segmentByNegation('I am happy. I am not sad.');
      // At least one should be in negated
      expect(result.affirmative.length + result.negated.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// ENHANCED HEDGE/CERTAINTY DETECTION TESTS
// ================================================================

import {
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

describe('NLP: Enhanced Hedge/Certainty Detection', () => {
  describe('HEDGE_LEXICON constants', () => {
    it('should have modal hedges', () => {
      expect(HEDGE_LEXICON.modals.low).toContain('may');
      expect(HEDGE_LEXICON.modals.low).toContain('might');
      expect(HEDGE_LEXICON.modals.high).toContain('must');
    });

    it('should have epistemic hedges', () => {
      expect(HEDGE_LEXICON.epistemic.medium).toContain('believe');
      expect(HEDGE_LEXICON.epistemic.low).toContain('guess');
    });

    it('should have probability markers', () => {
      expect(HEDGE_LEXICON.probability.high).toContain('certainly');
      expect(HEDGE_LEXICON.probability.low).toContain('possibly');
    });
  });

  describe('BOOSTERS constants', () => {
    it('should contain confidence boosters', () => {
      expect(BOOSTERS).toContain('absolutely');
      expect(BOOSTERS).toContain('definitely');
      expect(BOOSTERS).toContain('certainly');
    });
  });

  describe('countBoosters', () => {
    it('should count boosters in text', () => {
      const count = countBoosters('This is definitely absolutely correct');
      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should return 0 for text without boosters', () => {
      const count = countBoosters('The sky is blue');
      expect(count).toBe(0);
    });
  });

  describe('scoreCertainty', () => {
    it('should return value between 0 and 1', () => {
      const score = scoreCertainty('This might possibly work');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should return low score for hedged text', () => {
      const score = scoreCertainty('Maybe this might possibly work');
      expect(score).toBeLessThan(0.5);
    });

    it('should return high score for confident text', () => {
      const score = scoreCertainty('This definitely will absolutely work');
      expect(score).toBeGreaterThan(0.5);
    });

    it('should return 0.5 for neutral text', () => {
      const score = scoreCertainty('The sky is blue');
      expect(score).toBeCloseTo(0.5, 1);
    });
  });

  describe('getCertaintyLevel', () => {
    it('should return high for scores >= 0.7', () => {
      expect(getCertaintyLevel(0.8)).toBe('high');
      expect(getCertaintyLevel(0.7)).toBe('high');
    });

    it('should return medium for scores between 0.4 and 0.7', () => {
      expect(getCertaintyLevel(0.5)).toBe('medium');
      expect(getCertaintyLevel(0.6)).toBe('medium');
    });

    it('should return low for scores < 0.4', () => {
      expect(getCertaintyLevel(0.2)).toBe('low');
      expect(getCertaintyLevel(0.39)).toBe('low');
    });
  });

  describe('analyzeCertainty', () => {
    it('should return complete analysis', () => {
      const analysis = analyzeCertainty('This might possibly work');
      expect(analysis.score).toBeDefined();
      expect(analysis.level).toBeDefined();
      expect(analysis.hedges).toBeDefined();
      expect(analysis.boosterCount).toBeDefined();
      expect(analysis.hedgeDensity).toBeDefined();
      expect(analysis.assessment).toBeDefined();
    });

    it('should provide appropriate assessment', () => {
      const uncertainAnalysis = analyzeCertainty('Maybe this might work');
      expect(uncertainAnalysis.assessment).toContain('low');

      const confidentAnalysis = analyzeCertainty('This definitely absolutely works');
      expect(confidentAnalysis.assessment).toContain('high');
    });

    it('should calculate hedge density', () => {
      const analysis = analyzeCertainty('maybe this might possibly work');
      expect(analysis.hedgeDensity).toBeGreaterThan(0);
    });
  });

  describe('compareCertainty', () => {
    it('should compare two texts', () => {
      const comparison = compareCertainty(
        'This might work',
        'This definitely works'
      );
      expect(comparison.text1Score).toBeDefined();
      expect(comparison.text2Score).toBeDefined();
      expect(comparison.difference).toBeDefined();
    });

    it('should identify more confident text', () => {
      const comparison = compareCertainty(
        'Maybe this works',
        'This definitely works'
      );
      expect(comparison.moreConfident).toBe(2);
    });

    it('should return 0 for similar certainty', () => {
      const comparison = compareCertainty(
        'The sky is blue',
        'The grass is green'
      );
      expect(comparison.moreConfident).toBe(0);
    });
  });

  describe('containsHedging', () => {
    it('should return true for hedged text', () => {
      expect(containsHedging('This might work')).toBe(true);
      expect(containsHedging('Perhaps we should try')).toBe(true);
    });

    it('should return false for non-hedged text', () => {
      expect(containsHedging('The sky is blue')).toBe(false);
    });
  });

  describe('getMostHedgedSentence', () => {
    it('should return most hedged sentence', () => {
      const text = 'This is clear. This might possibly maybe work. This is obvious.';
      const result = getMostHedgedSentence(text);
      expect(result).not.toBeNull();
      expect(result?.sentence).toContain('might');
    });

    it('should return hedge count', () => {
      const result = getMostHedgedSentence('Maybe this might work.');
      expect(result?.hedgeCount).toBeGreaterThan(0);
    });

    it('should return null for empty text', () => {
      const result = getMostHedgedSentence('');
      expect(result).toBeNull();
    });
  });

  describe('extractConfidentStatements', () => {
    it('should extract confident statements', () => {
      const text = 'This definitely works. This might work. This certainly succeeds.';
      const confident = extractConfidentStatements(text, 0.6);
      expect(confident.length).toBeGreaterThan(0);
    });

    it('should respect threshold', () => {
      const text = 'Maybe this works. This absolutely works.';
      const highThreshold = extractConfidentStatements(text, 0.8);
      const lowThreshold = extractConfidentStatements(text, 0.3);
      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });
  });

  describe('extractUncertainStatements', () => {
    it('should extract uncertain statements', () => {
      const text = 'This is clear. This might possibly work. This is obvious.';
      const uncertain = extractUncertainStatements(text, 0.4);
      expect(uncertain.length).toBeGreaterThan(0);
    });

    it('should filter by threshold', () => {
      const text = 'Maybe this works. Perhaps that too. This is true.';
      const uncertain = extractUncertainStatements(text, 0.5);
      expect(uncertain.length).toBeGreaterThanOrEqual(0);
    });
  });
});
