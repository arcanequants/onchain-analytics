/**
 * Tokenizer
 *
 * Text tokenization utilities for NLP processing
 *
 * Phase 3, Week 10
 */

import type { NLPConfig } from './types';
import { DEFAULT_NLP_CONFIG } from './types';

// ================================================================
// STOPWORDS
// ================================================================

const ENGLISH_STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'our', 'their', 'mine', 'yours', 'hers', 'ours',
  'theirs', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
  'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
  'then', 'once', 'if', 'else', 'about', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'any', 'because', 'until', 'while', 'against', 'being',
  'having', 'doing', 'get', 'got', 'gets', 'getting', 'let', 'lets',
  'make', 'makes', 'making', 'made', 'say', 'says', 'saying', 'said',
  'go', 'goes', 'going', 'gone', 'went', 'come', 'comes', 'coming',
  'came', 'take', 'takes', 'taking', 'took', 'taken', 'see', 'sees',
  'seeing', 'saw', 'seen', 'know', 'knows', 'knowing', 'knew', 'known',
  'think', 'thinks', 'thinking', 'thought', 'want', 'wants', 'wanting',
  'wanted', 'give', 'gives', 'giving', 'gave', 'given', 'find', 'finds',
  'finding', 'found', 'tell', 'tells', 'telling', 'told', 'ask', 'asks',
  'asking', 'asked', 'seem', 'seems', 'seeming', 'seemed', 'leave',
  'leaves', 'leaving', 'left', 'call', 'calls', 'calling', 'called',
  'keep', 'keeps', 'keeping', 'kept', 'put', 'puts', 'putting',
]);

const SPANISH_STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del',
  'al', 'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'desde', 'en',
  'entre', 'hacia', 'hasta', 'para', 'por', 'segun', 'sin', 'so',
  'sobre', 'tras', 'y', 'e', 'ni', 'o', 'u', 'pero', 'mas', 'sino',
  'que', 'si', 'como', 'cuando', 'donde', 'porque', 'aunque', 'quien',
  'cual', 'cuyo', 'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros',
  'ellos', 'ellas', 'me', 'te', 'se', 'nos', 'os', 'mi', 'tu', 'su',
  'nuestro', 'vuestro', 'este', 'esta', 'estos', 'estas', 'ese', 'esa',
  'esos', 'esas', 'aquel', 'aquella', 'aquellos', 'aquellas', 'esto',
  'eso', 'aquello', 'ser', 'estar', 'haber', 'tener', 'hacer', 'poder',
  'decir', 'ir', 'ver', 'dar', 'saber', 'querer', 'llegar', 'pasar',
  'deber', 'poner', 'parecer', 'quedar', 'creer', 'hablar', 'llevar',
  'dejar', 'seguir', 'encontrar', 'llamar', 'venir', 'pensar', 'salir',
  'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar', 'mirar',
  'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar',
  'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender',
  'pedir', 'recibir', 'recordar', 'terminar', 'permitir', 'aparecer',
  'conseguir', 'comenzar', 'servir', 'sacar', 'necesitar', 'mantener',
  'resultar', 'leer', 'caer', 'cambiar', 'presentar', 'crear', 'abrir',
  'considerar', 'oir', 'acabar', 'convertir', 'ganar', 'formar',
]);

const PORTUGUESE_STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do',
  'das', 'dos', 'em', 'na', 'no', 'nas', 'nos', 'por', 'para', 'com',
  'sem', 'sob', 'sobre', 'entre', 'ate', 'desde', 'contra', 'perante',
  'e', 'ou', 'mas', 'porem', 'contudo', 'todavia', 'entretanto',
  'que', 'se', 'como', 'quando', 'onde', 'porque', 'embora', 'quem',
  'qual', 'cujo', 'eu', 'tu', 'ele', 'ela', 'nos', 'vos', 'eles',
  'elas', 'me', 'te', 'se', 'lhe', 'meu', 'teu', 'seu', 'nosso',
  'vosso', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses',
  'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso',
  'aquilo', 'ser', 'estar', 'ter', 'haver', 'fazer', 'poder', 'dizer',
  'ir', 'ver', 'dar', 'saber', 'querer', 'chegar', 'passar', 'dever',
  'ficar', 'parecer', 'crer', 'falar', 'deixar', 'seguir', 'encontrar',
  'chamar', 'vir', 'pensar', 'sair', 'voltar', 'tomar', 'conhecer',
  'viver', 'sentir', 'tratar', 'olhar', 'contar', 'comecar', 'esperar',
  'buscar', 'existir', 'entrar', 'trabalhar', 'escrever', 'perder',
]);

export function getStopwords(language: string, custom: string[] = []): Set<string> {
  let stopwords: Set<string>;

  switch (language) {
    case 'es':
      stopwords = new Set(SPANISH_STOPWORDS);
      break;
    case 'pt':
      stopwords = new Set(PORTUGUESE_STOPWORDS);
      break;
    case 'en':
    default:
      stopwords = new Set(ENGLISH_STOPWORDS);
  }

  // Add custom stopwords
  for (const word of custom) {
    stopwords.add(word.toLowerCase());
  }

  return stopwords;
}

// ================================================================
// STEMMING (Porter Stemmer - Simplified)
// ================================================================

/**
 * Simplified Porter Stemmer for English
 */
export function stem(word: string): string {
  if (word.length < 3) return word;

  let stemmed = word.toLowerCase();

  // Step 1a: Remove plurals and -ed/-ing
  if (stemmed.endsWith('sses')) {
    stemmed = stemmed.slice(0, -2);
  } else if (stemmed.endsWith('ies')) {
    stemmed = stemmed.slice(0, -2);
  } else if (stemmed.endsWith('ss')) {
    // Keep as is
  } else if (stemmed.endsWith('s')) {
    stemmed = stemmed.slice(0, -1);
  }

  // Step 1b: Remove -ed and -ing
  if (stemmed.endsWith('eed')) {
    stemmed = stemmed.slice(0, -1);
  } else if (stemmed.endsWith('ed') && hasVowel(stemmed.slice(0, -2))) {
    stemmed = stemmed.slice(0, -2);
    stemmed = step1bAdjust(stemmed);
  } else if (stemmed.endsWith('ing') && hasVowel(stemmed.slice(0, -3))) {
    stemmed = stemmed.slice(0, -3);
    stemmed = step1bAdjust(stemmed);
  }

  // Step 1c: Replace y with i
  if (stemmed.endsWith('y') && hasVowel(stemmed.slice(0, -1))) {
    stemmed = stemmed.slice(0, -1) + 'i';
  }

  // Step 2: Remove common suffixes
  const step2Suffixes: [string, string][] = [
    ['ational', 'ate'],
    ['tional', 'tion'],
    ['enci', 'ence'],
    ['anci', 'ance'],
    ['izer', 'ize'],
    ['abli', 'able'],
    ['alli', 'al'],
    ['entli', 'ent'],
    ['eli', 'e'],
    ['ousli', 'ous'],
    ['ization', 'ize'],
    ['ation', 'ate'],
    ['ator', 'ate'],
    ['alism', 'al'],
    ['iveness', 'ive'],
    ['fulness', 'ful'],
    ['ousness', 'ous'],
    ['aliti', 'al'],
    ['iviti', 'ive'],
    ['biliti', 'ble'],
  ];

  for (const [suffix, replacement] of step2Suffixes) {
    if (stemmed.endsWith(suffix)) {
      stemmed = stemmed.slice(0, -suffix.length) + replacement;
      break;
    }
  }

  // Step 3: Remove more suffixes
  const step3Suffixes: [string, string][] = [
    ['icate', 'ic'],
    ['ative', ''],
    ['alize', 'al'],
    ['iciti', 'ic'],
    ['ical', 'ic'],
    ['ful', ''],
    ['ness', ''],
  ];

  for (const [suffix, replacement] of step3Suffixes) {
    if (stemmed.endsWith(suffix)) {
      stemmed = stemmed.slice(0, -suffix.length) + replacement;
      break;
    }
  }

  return stemmed;
}

function hasVowel(str: string): boolean {
  return /[aeiou]/.test(str);
}

function step1bAdjust(word: string): string {
  if (word.endsWith('at') || word.endsWith('bl') || word.endsWith('iz')) {
    return word + 'e';
  }

  // Double consonant
  if (/([^aeiouslz])\1$/.test(word)) {
    return word.slice(0, -1);
  }

  // Short word
  if (word.length <= 3 && /^[^aeiou]+[aeiou][^aeiouwxy]$/.test(word)) {
    return word + 'e';
  }

  return word;
}

// ================================================================
// TOKENIZATION
// ================================================================

/**
 * Tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Tokenize text into sentences
 */
export function tokenizeSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or end
  const sentences = text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

/**
 * Tokenize text into paragraphs
 */
export function tokenizeParagraphs(text: string): string[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

/**
 * Process text with full pipeline
 */
export function processText(
  text: string,
  config: Partial<NLPConfig> = {}
): string[] {
  const cfg = { ...DEFAULT_NLP_CONFIG, ...config };
  const stopwords = getStopwords(cfg.language, cfg.customStopwords);

  let tokens = tokenize(text);

  // Filter by minimum length
  tokens = tokens.filter((t) => t.length >= cfg.minWordLength);

  // Remove stopwords
  if (cfg.removeStopwords) {
    tokens = tokens.filter((t) => !stopwords.has(t));
  }

  // Apply stemming
  if (cfg.useStemming) {
    tokens = tokens.map(stem);
  }

  return tokens;
}

// ================================================================
// N-GRAMS
// ================================================================

/**
 * Generate n-grams from tokens
 */
export function generateNgrams(tokens: string[], n: number): string[] {
  const ngrams: string[] = [];

  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Generate all n-grams up to maxN
 */
export function generateAllNgrams(
  tokens: string[],
  minN: number = 1,
  maxN: number = 3
): string[] {
  const ngrams: string[] = [];

  for (let n = minN; n <= maxN; n++) {
    ngrams.push(...generateNgrams(tokens, n));
  }

  return ngrams;
}

// ================================================================
// SYLLABLE COUNTING
// ================================================================

/**
 * Count syllables in a word (English approximation)
 */
export function countSyllables(word: string): number {
  word = word.toLowerCase().trim();

  if (word.length <= 3) {
    return 1;
  }

  // Remove trailing e
  word = word.replace(/e$/, '');

  // Count vowel groups
  const matches = word.match(/[aeiouy]+/g);
  let count = matches ? matches.length : 1;

  // Adjust for common patterns
  if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
    count++;
  }

  return Math.max(1, count);
}

/**
 * Count total syllables in text
 */
export function countTextSyllables(text: string): number {
  const words = tokenize(text);
  return words.reduce((sum, word) => sum + countSyllables(word), 0);
}

// ================================================================
// WORD FREQUENCY
// ================================================================

/**
 * Count word frequencies
 */
export function getWordFrequencies(tokens: string[]): Map<string, number> {
  const frequencies = new Map<string, number>();

  for (const token of tokens) {
    frequencies.set(token, (frequencies.get(token) || 0) + 1);
  }

  return frequencies;
}

/**
 * Get top N most frequent terms
 */
export function getTopTerms(
  tokens: string[],
  n: number = 10
): Array<{ term: string; count: number }> {
  const frequencies = getWordFrequencies(tokens);

  return Array.from(frequencies.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
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
};
