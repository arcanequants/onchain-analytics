/**
 * Multi-lingual NLP Pipeline
 *
 * Phase 4, Week 8 Extended - Computational Linguistics Checklist
 *
 * Features:
 * - Support EN, ES, PT languages
 * - Language detection
 * - Unified tokenization
 * - Stopword removal per language
 * - Sentiment lexicons per language
 * - Named entity patterns per language
 */

// ============================================================================
// TYPES
// ============================================================================

export type SupportedLanguage = 'en' | 'es' | 'pt';

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number;
  alternatives: Array<{ language: SupportedLanguage; confidence: number }>;
}

export interface Token {
  text: string;
  normalized: string;
  isStopword: boolean;
  position: number;
  startOffset: number;
  endOffset: number;
}

export interface MultilingualAnalysis {
  language: LanguageDetectionResult;
  tokens: Token[];
  sentences: string[];
  wordCount: number;
  stopwordRatio: number;
  sentiment: {
    score: number;      // -1 to 1
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
  };
  entities: Array<{
    text: string;
    type: 'person' | 'organization' | 'location' | 'product' | 'brand';
    language: SupportedLanguage;
  }>;
}

// ============================================================================
// LANGUAGE DETECTION
// ============================================================================

// Common words per language for detection
const LANGUAGE_INDICATORS: Record<SupportedLanguage, string[]> = {
  en: [
    'the', 'is', 'are', 'was', 'were', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'might', 'must',
    'and', 'but', 'or', 'because', 'although', 'while',
    'with', 'without', 'about', 'against', 'between', 'through',
    'during', 'before', 'after', 'above', 'below', 'from',
  ],
  es: [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'es', 'son', 'está', 'están', 'fue', 'fueron', 'ser', 'estar',
    'tiene', 'tienen', 'tenía', 'había', 'haber',
    'que', 'qué', 'cual', 'cuál', 'quien', 'quién',
    'y', 'pero', 'o', 'porque', 'aunque', 'mientras',
    'con', 'sin', 'sobre', 'contra', 'entre', 'hacia',
    'durante', 'antes', 'después', 'desde', 'hasta', 'para',
    'muy', 'más', 'menos', 'mejor', 'peor',
  ],
  pt: [
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas',
    'é', 'são', 'está', 'estão', 'foi', 'foram', 'ser', 'estar',
    'tem', 'têm', 'tinha', 'havia', 'ter',
    'que', 'qual', 'quem', 'onde', 'quando', 'como',
    'e', 'mas', 'ou', 'porque', 'embora', 'enquanto',
    'com', 'sem', 'sobre', 'contra', 'entre', 'para',
    'durante', 'antes', 'depois', 'desde', 'até',
    'muito', 'mais', 'menos', 'melhor', 'pior',
    'não', 'sim', 'também', 'ainda', 'já',
  ],
};

// Unique character patterns
const LANGUAGE_PATTERNS: Record<SupportedLanguage, RegExp[]> = {
  en: [
    /\bth[aeiou]/gi,   // "the", "that", "this", "those"
    /\b\w+tion\b/gi,   // "-tion" endings
    /\b\w+ing\b/gi,    // "-ing" endings
    /\b\w+ed\b/gi,     // "-ed" endings
  ],
  es: [
    /[áéíóúñ]/gi,      // Spanish accents and ñ
    /\b\w+ción\b/gi,   // "-ción" endings
    /\b\w+mente\b/gi,  // "-mente" endings
    /\b(está|están|tengo|tiene)\b/gi,
    /¿|¡/g,            // Inverted punctuation
  ],
  pt: [
    /[ãõçâêô]/gi,      // Portuguese specific characters
    /\b\w+ção\b/gi,    // "-ção" endings
    /\bnão\b/gi,       // "não" (no/not)
    /\b(está|estão|tenho|tem)\b/gi,
  ],
};

/**
 * Detect language of text
 */
export function detectLanguage(text: string): LanguageDetectionResult {
  const normalizedText = text.toLowerCase();
  const words = normalizedText.split(/\s+/);

  const scores: Record<SupportedLanguage, number> = {
    en: 0,
    es: 0,
    pt: 0,
  };

  // Score based on indicator words
  for (const word of words) {
    for (const [lang, indicators] of Object.entries(LANGUAGE_INDICATORS) as [SupportedLanguage, string[]][]) {
      if (indicators.includes(word)) {
        scores[lang] += 1;
      }
    }
  }

  // Score based on character patterns
  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS) as [SupportedLanguage, RegExp[]][]) {
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        scores[lang] += matches.length * 2; // Weight patterns more heavily
      }
    }
  }

  // Calculate total and confidences
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

  const ranked = (Object.entries(scores) as [SupportedLanguage, number][])
    .map(([lang, score]) => ({
      language: lang,
      confidence: score / total,
    }))
    .sort((a, b) => b.confidence - a.confidence);

  // Default to English if no clear signal
  if (ranked[0].confidence < 0.1) {
    return {
      language: 'en',
      confidence: 0.5,
      alternatives: [
        { language: 'es', confidence: 0.25 },
        { language: 'pt', confidence: 0.25 },
      ],
    };
  }

  return {
    language: ranked[0].language,
    confidence: Math.min(ranked[0].confidence * 1.2, 0.99), // Slight boost
    alternatives: ranked.slice(1),
  };
}

// ============================================================================
// STOPWORDS
// ============================================================================

const STOPWORDS: Record<SupportedLanguage, Set<string>> = {
  en: new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when',
    'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than',
    'too', 'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once',
  ]),
  es: new Set([
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'pero',
    'en', 'de', 'a', 'por', 'para', 'con', 'sin', 'sobre', 'bajo', 'entre',
    'que', 'cual', 'quien', 'donde', 'cuando', 'como', 'porque', 'aunque',
    'es', 'son', 'está', 'están', 'fue', 'fueron', 'era', 'eran', 'ser',
    'estar', 'tiene', 'tienen', 'tenía', 'tenían', 'hay', 'había', 'haber',
    'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'esto', 'eso',
    'este', 'ese', 'esta', 'esa', 'estos', 'esos', 'estas', 'esas',
    'todo', 'todos', 'toda', 'todas', 'mucho', 'muchos', 'poco', 'pocos',
    'otro', 'otros', 'otra', 'otras', 'mismo', 'mismos', 'misma', 'mismas',
    'no', 'sí', 'muy', 'más', 'menos', 'ya', 'aún', 'todavía', 'siempre',
    'nunca', 'también', 'solo', 'sólo', 'así', 'bien', 'mal', 'aquí', 'allí',
  ]),
  pt: new Set([
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'e', 'ou', 'mas',
    'em', 'de', 'da', 'do', 'das', 'dos', 'para', 'por', 'com', 'sem',
    'que', 'qual', 'quem', 'onde', 'quando', 'como', 'porque', 'embora',
    'é', 'são', 'está', 'estão', 'foi', 'foram', 'era', 'eram', 'ser',
    'estar', 'tem', 'têm', 'tinha', 'tinham', 'há', 'havia', 'ter',
    'eu', 'tu', 'ele', 'ela', 'nós', 'eles', 'elas', 'isto', 'isso',
    'este', 'esse', 'esta', 'essa', 'estes', 'esses', 'estas', 'essas',
    'todo', 'todos', 'toda', 'todas', 'muito', 'muitos', 'pouco', 'poucos',
    'outro', 'outros', 'outra', 'outras', 'mesmo', 'mesmos', 'mesma', 'mesmas',
    'não', 'sim', 'muito', 'mais', 'menos', 'já', 'ainda', 'sempre',
    'nunca', 'também', 'só', 'assim', 'bem', 'mal', 'aqui', 'ali', 'lá',
  ]),
};

// ============================================================================
// SENTIMENT LEXICONS
// ============================================================================

interface SentimentWord {
  score: number;  // -1 to 1
  intensity: number;  // 0.5 to 1.5
}

const SENTIMENT_LEXICONS: Record<SupportedLanguage, Record<string, SentimentWord>> = {
  en: {
    // Positive
    'excellent': { score: 1, intensity: 1.3 },
    'amazing': { score: 0.9, intensity: 1.2 },
    'great': { score: 0.8, intensity: 1.1 },
    'good': { score: 0.6, intensity: 1 },
    'best': { score: 0.9, intensity: 1.2 },
    'love': { score: 0.8, intensity: 1.1 },
    'fantastic': { score: 0.9, intensity: 1.2 },
    'wonderful': { score: 0.85, intensity: 1.15 },
    'reliable': { score: 0.6, intensity: 1 },
    'innovative': { score: 0.7, intensity: 1.05 },
    'efficient': { score: 0.6, intensity: 1 },
    'recommended': { score: 0.7, intensity: 1.1 },
    // Negative
    'terrible': { score: -1, intensity: 1.3 },
    'awful': { score: -0.9, intensity: 1.2 },
    'bad': { score: -0.6, intensity: 1 },
    'worst': { score: -0.9, intensity: 1.2 },
    'hate': { score: -0.8, intensity: 1.1 },
    'poor': { score: -0.5, intensity: 1 },
    'disappointing': { score: -0.6, intensity: 1.05 },
    'unreliable': { score: -0.6, intensity: 1 },
    'expensive': { score: -0.3, intensity: 0.9 },
    'slow': { score: -0.4, intensity: 0.9 },
    'buggy': { score: -0.7, intensity: 1.1 },
    'avoid': { score: -0.7, intensity: 1.1 },
  },
  es: {
    // Positive
    'excelente': { score: 1, intensity: 1.3 },
    'increíble': { score: 0.9, intensity: 1.2 },
    'genial': { score: 0.8, intensity: 1.1 },
    'bueno': { score: 0.6, intensity: 1 },
    'mejor': { score: 0.9, intensity: 1.2 },
    'maravilloso': { score: 0.85, intensity: 1.15 },
    'fantástico': { score: 0.9, intensity: 1.2 },
    'confiable': { score: 0.6, intensity: 1 },
    'innovador': { score: 0.7, intensity: 1.05 },
    'eficiente': { score: 0.6, intensity: 1 },
    'recomendado': { score: 0.7, intensity: 1.1 },
    'encanta': { score: 0.8, intensity: 1.1 },
    // Negative
    'terrible': { score: -1, intensity: 1.3 },
    'horrible': { score: -0.9, intensity: 1.2 },
    'malo': { score: -0.6, intensity: 1 },
    'peor': { score: -0.9, intensity: 1.2 },
    'odio': { score: -0.8, intensity: 1.1 },
    'pobre': { score: -0.5, intensity: 1 },
    'decepcionante': { score: -0.6, intensity: 1.05 },
    'caro': { score: -0.3, intensity: 0.9 },
    'lento': { score: -0.4, intensity: 0.9 },
    'evitar': { score: -0.7, intensity: 1.1 },
  },
  pt: {
    // Positive
    'excelente': { score: 1, intensity: 1.3 },
    'incrível': { score: 0.9, intensity: 1.2 },
    'ótimo': { score: 0.8, intensity: 1.1 },
    'bom': { score: 0.6, intensity: 1 },
    'melhor': { score: 0.9, intensity: 1.2 },
    'maravilhoso': { score: 0.85, intensity: 1.15 },
    'fantástico': { score: 0.9, intensity: 1.2 },
    'confiável': { score: 0.6, intensity: 1 },
    'inovador': { score: 0.7, intensity: 1.05 },
    'eficiente': { score: 0.6, intensity: 1 },
    'recomendado': { score: 0.7, intensity: 1.1 },
    'adoro': { score: 0.8, intensity: 1.1 },
    // Negative
    'terrível': { score: -1, intensity: 1.3 },
    'horrível': { score: -0.9, intensity: 1.2 },
    'mau': { score: -0.6, intensity: 1 },
    'ruim': { score: -0.6, intensity: 1 },
    'pior': { score: -0.9, intensity: 1.2 },
    'odeio': { score: -0.8, intensity: 1.1 },
    'fraco': { score: -0.5, intensity: 1 },
    'decepcionante': { score: -0.6, intensity: 1.05 },
    'caro': { score: -0.3, intensity: 0.9 },
    'lento': { score: -0.4, intensity: 0.9 },
    'evitar': { score: -0.7, intensity: 1.1 },
  },
};

// ============================================================================
// TOKENIZATION
// ============================================================================

/**
 * Tokenize text with language awareness
 */
export function tokenize(text: string, language: SupportedLanguage): Token[] {
  const stopwords = STOPWORDS[language];
  const tokens: Token[] = [];

  // Simple whitespace and punctuation tokenization
  const regex = /\b\w+\b/g;
  let match;
  let position = 0;

  while ((match = regex.exec(text)) !== null) {
    const word = match[0];
    const normalized = word.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics for matching

    tokens.push({
      text: word,
      normalized,
      isStopword: stopwords.has(word.toLowerCase()),
      position: position++,
      startOffset: match.index,
      endOffset: match.index + word.length,
    });
  }

  return tokens;
}

/**
 * Split text into sentences
 */
export function splitSentences(text: string, language: SupportedLanguage): string[] {
  // Handle inverted punctuation in Spanish
  let normalizedText = text;
  if (language === 'es') {
    normalizedText = text.replace(/[¿¡]/g, '');
  }

  // Split on sentence boundaries
  const sentences = normalizedText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}

// ============================================================================
// SENTIMENT ANALYSIS
// ============================================================================

/**
 * Analyze sentiment with language-specific lexicon
 */
export function analyzeSentiment(
  tokens: Token[],
  language: SupportedLanguage
): { score: number; label: 'positive' | 'negative' | 'neutral'; confidence: number } {
  const lexicon = SENTIMENT_LEXICONS[language];
  let totalScore = 0;
  let totalIntensity = 0;
  let matchCount = 0;

  for (const token of tokens) {
    if (token.isStopword) continue;

    const entry = lexicon[token.normalized] || lexicon[token.text.toLowerCase()];
    if (entry) {
      totalScore += entry.score * entry.intensity;
      totalIntensity += entry.intensity;
      matchCount++;
    }
  }

  // Calculate average score
  const avgScore = matchCount > 0 ? totalScore / totalIntensity : 0;

  // Determine label
  let label: 'positive' | 'negative' | 'neutral';
  if (avgScore > 0.15) label = 'positive';
  else if (avgScore < -0.15) label = 'negative';
  else label = 'neutral';

  // Confidence based on coverage
  const nonStopwordCount = tokens.filter(t => !t.isStopword).length;
  const coverage = nonStopwordCount > 0 ? matchCount / nonStopwordCount : 0;
  const confidence = Math.min(0.5 + coverage * 0.5, 0.95);

  return {
    score: Math.round(avgScore * 100) / 100,
    label,
    confidence: Math.round(confidence * 100) / 100,
  };
}

// ============================================================================
// ENTITY EXTRACTION (BASIC)
// ============================================================================

// Common entity patterns per language
const ENTITY_PATTERNS: Record<SupportedLanguage, Array<{ pattern: RegExp; type: 'organization' | 'product' | 'brand' }>> = {
  en: [
    { pattern: /\b(?:Inc\.|Corp\.|LLC|Ltd\.?|Company|Corporation)\b/gi, type: 'organization' },
    { pattern: /\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|Salesforce|Oracle|SAP|IBM)\b/g, type: 'brand' },
  ],
  es: [
    { pattern: /\b(?:S\.A\.|S\.L\.|S\.A\. de C\.V\.|Empresa|Compañía|Corporación)\b/gi, type: 'organization' },
    { pattern: /\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|Salesforce|Oracle|SAP|IBM)\b/g, type: 'brand' },
  ],
  pt: [
    { pattern: /\b(?:S\.A\.|Ltda\.?|LTDA|Empresa|Companhia|Corporação)\b/gi, type: 'organization' },
    { pattern: /\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|Salesforce|Oracle|SAP|IBM)\b/g, type: 'brand' },
  ],
};

/**
 * Extract basic named entities
 */
export function extractEntities(
  text: string,
  language: SupportedLanguage
): Array<{ text: string; type: 'person' | 'organization' | 'location' | 'product' | 'brand'; language: SupportedLanguage }> {
  const entities: Array<{ text: string; type: 'person' | 'organization' | 'location' | 'product' | 'brand'; language: SupportedLanguage }> = [];
  const patterns = ENTITY_PATTERNS[language];

  for (const { pattern, type } of patterns) {
    const matches = text.matchAll(new RegExp(pattern.source, pattern.flags));
    for (const match of matches) {
      entities.push({
        text: match[0],
        type,
        language,
      });
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return entities.filter(e => {
    const key = `${e.text}:${e.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ============================================================================
// MAIN ANALYSIS FUNCTION
// ============================================================================

/**
 * Perform complete multilingual analysis
 */
export function analyzeMultilingual(text: string): MultilingualAnalysis {
  // Detect language
  const language = detectLanguage(text);

  // Tokenize
  const tokens = tokenize(text, language.language);

  // Split sentences
  const sentences = splitSentences(text, language.language);

  // Analyze sentiment
  const sentiment = analyzeSentiment(tokens, language.language);

  // Extract entities
  const entities = extractEntities(text, language.language);

  // Calculate metrics
  const wordCount = tokens.length;
  const stopwordCount = tokens.filter(t => t.isStopword).length;
  const stopwordRatio = wordCount > 0 ? stopwordCount / wordCount : 0;

  return {
    language,
    tokens,
    sentences,
    wordCount,
    stopwordRatio: Math.round(stopwordRatio * 100) / 100,
    sentiment,
    entities,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  detectLanguage,
  tokenize,
  splitSentences,
  analyzeSentiment,
  extractEntities,
  analyzeMultilingual,
};
