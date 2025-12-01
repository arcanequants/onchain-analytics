/**
 * Readability Analysis
 *
 * Text readability scoring and statistics
 *
 * Phase 3, Week 10
 */

import type { ReadabilityScore, TextStatistics } from './types';
import { tokenize, tokenizeSentences, tokenizeParagraphs, countSyllables } from './tokenizer';

// ================================================================
// TEXT STATISTICS
// ================================================================

/**
 * Calculate comprehensive text statistics
 */
export function getTextStatistics(text: string): TextStatistics {
  const words = tokenize(text);
  const sentences = tokenizeSentences(text);
  const paragraphs = tokenizeParagraphs(text);

  const characterCount = text.length;
  const characterCountNoSpaces = text.replace(/\s/g, '').length;
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  const paragraphCount = paragraphs.length || 1;

  // Calculate averages
  const averageWordLength = wordCount > 0
    ? words.reduce((sum, w) => sum + w.length, 0) / wordCount
    : 0;

  const averageSentenceLength = wordCount / sentenceCount;

  // Calculate syllables
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const averageSyllablesPerWord = wordCount > 0 ? totalSyllables / wordCount : 0;

  // Calculate complex words (3+ syllables)
  const complexWords = words.filter((word) => countSyllables(word) >= 3);
  const complexWordPercentage = wordCount > 0 ? (complexWords.length / wordCount) * 100 : 0;

  return {
    characterCount,
    characterCountNoSpaces,
    wordCount,
    sentenceCount,
    paragraphCount,
    averageWordLength,
    averageSentenceLength,
    averageSyllablesPerWord,
    complexWordPercentage,
  };
}

// ================================================================
// READABILITY FORMULAS
// ================================================================

/**
 * Flesch Reading Ease Score
 * 0-30: Very difficult, 30-50: Difficult, 50-60: Fairly difficult
 * 60-70: Standard, 70-80: Fairly easy, 80-90: Easy, 90-100: Very easy
 */
export function fleschReadingEase(stats: TextStatistics): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0;

  const score =
    206.835 -
    1.015 * stats.averageSentenceLength -
    84.6 * stats.averageSyllablesPerWord;

  return Math.max(0, Math.min(100, score));
}

/**
 * Flesch-Kincaid Grade Level
 * Returns US grade level (e.g., 8 = 8th grade)
 */
export function fleschKincaidGrade(stats: TextStatistics): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0;

  const grade =
    0.39 * stats.averageSentenceLength +
    11.8 * stats.averageSyllablesPerWord -
    15.59;

  return Math.max(0, Math.round(grade * 10) / 10);
}

/**
 * Gunning Fog Index
 * Returns years of formal education needed
 */
export function gunningFog(stats: TextStatistics): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0;

  const index =
    0.4 * (stats.averageSentenceLength + stats.complexWordPercentage);

  return Math.max(0, Math.round(index * 10) / 10);
}

/**
 * SMOG Index (Simple Measure of Gobbledygook)
 * Returns years of education needed
 */
export function smogIndex(text: string): number {
  const sentences = tokenizeSentences(text);
  const sentenceCount = sentences.length;

  if (sentenceCount < 30) {
    // SMOG requires at least 30 sentences for accuracy
    // Use adjusted formula for shorter texts
    const words = tokenize(text);
    const polysyllables = words.filter((word) => countSyllables(word) >= 3).length;

    if (sentenceCount === 0) return 0;

    const index = 1.043 * Math.sqrt((polysyllables * 30) / sentenceCount) + 3.1291;
    return Math.max(0, Math.round(index * 10) / 10);
  }

  // Standard SMOG formula
  const words = tokenize(text);
  const polysyllables = words.filter((word) => countSyllables(word) >= 3).length;

  const index = 1.043 * Math.sqrt((polysyllables * 30) / sentenceCount) + 3.1291;
  return Math.max(0, Math.round(index * 10) / 10);
}

/**
 * Automated Readability Index (ARI)
 * Returns US grade level
 */
export function automatedReadabilityIndex(stats: TextStatistics): number {
  if (stats.wordCount === 0 || stats.sentenceCount === 0) return 0;

  const index =
    4.71 * (stats.characterCountNoSpaces / stats.wordCount) +
    0.5 * stats.averageSentenceLength -
    21.43;

  return Math.max(0, Math.round(index * 10) / 10);
}

/**
 * Coleman-Liau Index
 * Returns US grade level
 */
export function colemanLiauIndex(stats: TextStatistics): number {
  if (stats.wordCount === 0) return 0;

  const L = (stats.characterCountNoSpaces / stats.wordCount) * 100; // Letters per 100 words
  const S = (stats.sentenceCount / stats.wordCount) * 100; // Sentences per 100 words

  const index = 0.0588 * L - 0.296 * S - 15.8;
  return Math.max(0, Math.round(index * 10) / 10);
}

// ================================================================
// COMBINED READABILITY SCORE
// ================================================================

/**
 * Get difficulty label from Flesch Reading Ease score
 */
function getDifficultyLabel(
  fleschScore: number
): ReadabilityScore['difficulty'] {
  if (fleschScore >= 80) return 'very_easy';
  if (fleschScore >= 60) return 'easy';
  if (fleschScore >= 40) return 'moderate';
  if (fleschScore >= 20) return 'difficult';
  return 'very_difficult';
}

/**
 * Calculate comprehensive readability score
 */
export function analyzeReadability(text: string): ReadabilityScore {
  const stats = getTextStatistics(text);

  const fre = fleschReadingEase(stats);
  const fkGrade = fleschKincaidGrade(stats);
  const fog = gunningFog(stats);
  const smog = smogIndex(text);
  const ari = automatedReadabilityIndex(stats);
  const cli = colemanLiauIndex(stats);

  // Average of grade-level metrics
  const gradeLevelMetrics = [fkGrade, fog, smog, ari, cli].filter((g) => g > 0);
  const averageGradeLevel = gradeLevelMetrics.length > 0
    ? gradeLevelMetrics.reduce((a, b) => a + b, 0) / gradeLevelMetrics.length
    : 0;

  return {
    fleschReadingEase: Math.round(fre * 10) / 10,
    fleschKincaidGrade: fkGrade,
    gunningFog: fog,
    smog: smog,
    automatedReadabilityIndex: ari,
    colemanLiau: cli,
    averageGradeLevel: Math.round(averageGradeLevel * 10) / 10,
    difficulty: getDifficultyLabel(fre),
  };
}

/**
 * Get readability summary with recommendations
 */
export function getReadabilitySummary(text: string): {
  score: ReadabilityScore;
  statistics: TextStatistics;
  recommendations: string[];
  audience: string;
} {
  const score = analyzeReadability(text);
  const statistics = getTextStatistics(text);
  const recommendations: string[] = [];

  // Generate recommendations
  if (statistics.averageSentenceLength > 25) {
    recommendations.push('Consider breaking up long sentences for better readability.');
  }

  if (statistics.averageSyllablesPerWord > 1.8) {
    recommendations.push('Use simpler words where possible to improve accessibility.');
  }

  if (statistics.complexWordPercentage > 20) {
    recommendations.push('Reduce the use of complex words (3+ syllables) to make text clearer.');
  }

  if (score.fleschReadingEase < 50) {
    recommendations.push('Text may be difficult for general audiences. Consider simplifying.');
  }

  if (statistics.averageSentenceLength < 10) {
    recommendations.push('Sentences are very short. Consider varying sentence length for better flow.');
  }

  // Determine target audience
  let audience: string;
  if (score.averageGradeLevel <= 6) {
    audience = 'General public, elementary school students';
  } else if (score.averageGradeLevel <= 9) {
    audience = 'General public, middle school students';
  } else if (score.averageGradeLevel <= 12) {
    audience = 'High school students, general adults';
  } else if (score.averageGradeLevel <= 16) {
    audience = 'College students, educated adults';
  } else {
    audience = 'Graduate students, professionals, specialists';
  }

  return { score, statistics, recommendations, audience };
}

/**
 * Compare readability between two texts
 */
export function compareReadability(
  text1: string,
  text2: string
): {
  text1: ReadabilityScore;
  text2: ReadabilityScore;
  comparison: {
    easierText: 1 | 2 | 'equal';
    gradeLevelDifference: number;
    fleschDifference: number;
  };
} {
  const score1 = analyzeReadability(text1);
  const score2 = analyzeReadability(text2);

  const gradeLevelDiff = score2.averageGradeLevel - score1.averageGradeLevel;
  const fleschDiff = score2.fleschReadingEase - score1.fleschReadingEase;

  let easierText: 1 | 2 | 'equal';
  if (fleschDiff > 5) {
    easierText = 2;
  } else if (fleschDiff < -5) {
    easierText = 1;
  } else {
    easierText = 'equal';
  }

  return {
    text1: score1,
    text2: score2,
    comparison: {
      easierText,
      gradeLevelDifference: Math.round(gradeLevelDiff * 10) / 10,
      fleschDifference: Math.round(fleschDiff * 10) / 10,
    },
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
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
};
