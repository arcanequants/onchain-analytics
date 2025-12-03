/**
 * GEO (Generative Engine Optimization) Module
 *
 * Phase 4, Week 8, Day 2
 * Strategies for optimizing content to be recommended by AI models
 */

// ================================================================
// TYPES
// ================================================================

export interface GEOScore {
  overall: number;
  categories: {
    structuredData: number;
    contentClarity: number;
    authoritySignals: number;
    freshness: number;
    citability: number;
  };
  recommendations: GEORecommendation[];
}

export interface GEORecommendation {
  category: keyof GEOScore['categories'];
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
}

export interface ContentAnalysis {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  readabilityScore: number;
  keyPhrases: string[];
  structuredDataPresent: boolean;
  authorAttributed: boolean;
  datePublished: boolean;
  sourcesCited: number;
}

// ================================================================
// GEO PRINCIPLES
// ================================================================

/**
 * Key principles for Generative Engine Optimization:
 *
 * 1. STRUCTURED DATA
 *    - JSON-LD markup for all content types
 *    - Schema.org compliance
 *    - Rich snippets optimization
 *
 * 2. CONTENT CLARITY
 *    - Clear, concise statements
 *    - Definition-style answers
 *    - Bullet points and lists
 *    - FAQ-style content
 *
 * 3. AUTHORITY SIGNALS
 *    - Author attribution
 *    - Expert credentials
 *    - Citations and sources
 *    - Trust badges
 *
 * 4. FRESHNESS
 *    - Publication dates
 *    - Update timestamps
 *    - Version information
 *    - Changelog for technical content
 *
 * 5. CITABILITY
 *    - Quotable statements
 *    - Unique data/statistics
 *    - Original research
 *    - Clear attribution
 */

// ================================================================
// CONTENT ANALYSIS
// ================================================================

/**
 * Analyze content for GEO optimization opportunities
 */
export function analyzeContent(content: string, html?: string): ContentAnalysis {
  // Word and sentence analysis
  const words = content.split(/\s+/).filter((w) => w.length > 0);
  const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  const wordCount = words.length;
  const sentenceCount = sentences.length;
  const avgSentenceLength = sentenceCount > 0 ? wordCount / sentenceCount : 0;

  // Simple readability score (Flesch-like)
  const syllableCount = words.reduce((acc, word) => acc + countSyllables(word), 0);
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0;
  const readabilityScore = Math.max(
    0,
    Math.min(100, 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord)
  );

  // Extract key phrases (simple noun phrase detection)
  const keyPhrases = extractKeyPhrases(content);

  // Check for structured elements (if HTML provided)
  const structuredDataPresent = html ? html.includes('application/ld+json') : false;
  const authorAttributed = html
    ? html.includes('author') || html.includes('byline') || html.includes('written-by')
    : false;
  const datePublished = html ? html.includes('datePublished') || html.includes('published') : false;

  // Count source citations
  const sourcesCited = (content.match(/\[source\]|\[citation\]|\baccording to\b|\bstudy shows\b/gi) || [])
    .length;

  return {
    wordCount,
    sentenceCount,
    avgSentenceLength,
    readabilityScore,
    keyPhrases,
    structuredDataPresent,
    authorAttributed,
    datePublished,
    sourcesCited,
  };
}

/**
 * Count syllables in a word (approximation)
 */
function countSyllables(word: string): number {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Extract key phrases from content
 */
function extractKeyPhrases(content: string): string[] {
  // Simple approach: find capitalized multi-word phrases and common patterns
  const phrases: string[] = [];

  // Find quoted phrases
  const quoted = content.match(/"[^"]+"/g) || [];
  phrases.push(...quoted.map((q) => q.replace(/"/g, '')));

  // Find title case phrases (2-4 words)
  const titleCase = content.match(/\b([A-Z][a-z]+\s+){1,3}[A-Z][a-z]+\b/g) || [];
  phrases.push(...titleCase);

  // Deduplicate and limit
  return [...new Set(phrases)].slice(0, 10);
}

// ================================================================
// GEO SCORING
// ================================================================

/**
 * Calculate GEO score for content
 */
export function calculateGEOScore(analysis: ContentAnalysis): GEOScore {
  const categories = {
    structuredData: calculateStructuredDataScore(analysis),
    contentClarity: calculateContentClarityScore(analysis),
    authoritySignals: calculateAuthorityScore(analysis),
    freshness: calculateFreshnessScore(analysis),
    citability: calculateCitabilityScore(analysis),
  };

  const overall = Math.round(
    (categories.structuredData * 0.25 +
      categories.contentClarity * 0.25 +
      categories.authoritySignals * 0.2 +
      categories.freshness * 0.15 +
      categories.citability * 0.15) *
      100
  );

  const recommendations = generateRecommendations(categories, analysis);

  return { overall, categories, recommendations };
}

function calculateStructuredDataScore(analysis: ContentAnalysis): number {
  let score = 0;

  if (analysis.structuredDataPresent) score += 0.5;
  if (analysis.keyPhrases.length >= 5) score += 0.3;
  if (analysis.wordCount >= 500) score += 0.2;

  return Math.min(1, score);
}

function calculateContentClarityScore(analysis: ContentAnalysis): number {
  let score = 0;

  // Readability (60-70 is optimal for web content)
  if (analysis.readabilityScore >= 50 && analysis.readabilityScore <= 80) {
    score += 0.4;
  } else if (analysis.readabilityScore >= 40) {
    score += 0.2;
  }

  // Sentence length (15-20 words is optimal)
  if (analysis.avgSentenceLength >= 12 && analysis.avgSentenceLength <= 22) {
    score += 0.3;
  } else if (analysis.avgSentenceLength >= 8 && analysis.avgSentenceLength <= 30) {
    score += 0.15;
  }

  // Sufficient content
  if (analysis.wordCount >= 1000) {
    score += 0.3;
  } else if (analysis.wordCount >= 500) {
    score += 0.2;
  }

  return Math.min(1, score);
}

function calculateAuthorityScore(analysis: ContentAnalysis): number {
  let score = 0;

  if (analysis.authorAttributed) score += 0.4;
  if (analysis.sourcesCited >= 3) score += 0.4;
  else if (analysis.sourcesCited >= 1) score += 0.2;
  if (analysis.keyPhrases.length >= 3) score += 0.2;

  return Math.min(1, score);
}

function calculateFreshnessScore(analysis: ContentAnalysis): number {
  let score = 0;

  if (analysis.datePublished) score += 0.6;
  // In production, would check actual date recency
  score += 0.4; // Assume recent for now

  return Math.min(1, score);
}

function calculateCitabilityScore(analysis: ContentAnalysis): number {
  let score = 0;

  // Good word count for comprehensive coverage
  if (analysis.wordCount >= 1500) score += 0.3;
  else if (analysis.wordCount >= 800) score += 0.2;

  // Clear key phrases
  if (analysis.keyPhrases.length >= 5) score += 0.3;
  else if (analysis.keyPhrases.length >= 3) score += 0.15;

  // Sources increase citability
  if (analysis.sourcesCited >= 2) score += 0.2;

  // Good readability
  if (analysis.readabilityScore >= 50) score += 0.2;

  return Math.min(1, score);
}

// ================================================================
// RECOMMENDATIONS
// ================================================================

function generateRecommendations(
  categories: GEOScore['categories'],
  analysis: ContentAnalysis
): GEORecommendation[] {
  const recommendations: GEORecommendation[] = [];

  // Structured Data recommendations
  if (categories.structuredData < 0.5) {
    recommendations.push({
      category: 'structuredData',
      priority: 'high',
      title: 'Add JSON-LD Structured Data',
      description: 'AI models better understand content with proper Schema.org markup.',
      implementation:
        'Add <script type="application/ld+json"> with WebPage, Article, or Organization schema.',
    });
  }

  // Content Clarity recommendations
  if (categories.contentClarity < 0.6) {
    if (analysis.avgSentenceLength > 25) {
      recommendations.push({
        category: 'contentClarity',
        priority: 'high',
        title: 'Shorten Sentences',
        description: `Average sentence length is ${analysis.avgSentenceLength.toFixed(1)} words. Aim for 15-20.`,
        implementation: 'Break long sentences into shorter ones. Use bullet points for lists.',
      });
    }

    if (analysis.readabilityScore < 50) {
      recommendations.push({
        category: 'contentClarity',
        priority: 'medium',
        title: 'Improve Readability',
        description: 'Content may be too complex for AI to extract clear answers.',
        implementation: 'Use simpler words, shorter sentences, and define technical terms.',
      });
    }
  }

  // Authority recommendations
  if (categories.authoritySignals < 0.5) {
    if (!analysis.authorAttributed) {
      recommendations.push({
        category: 'authoritySignals',
        priority: 'high',
        title: 'Add Author Attribution',
        description: 'Content without clear authorship appears less trustworthy to AI.',
        implementation: 'Add author name, credentials, and link to author profile.',
      });
    }

    if (analysis.sourcesCited < 2) {
      recommendations.push({
        category: 'authoritySignals',
        priority: 'medium',
        title: 'Cite Sources',
        description: 'AI models favor content that references credible sources.',
        implementation: 'Add citations to studies, experts, or authoritative sources.',
      });
    }
  }

  // Freshness recommendations
  if (categories.freshness < 0.6) {
    recommendations.push({
      category: 'freshness',
      priority: 'medium',
      title: 'Add Publication/Update Dates',
      description: 'Dated content helps AI determine relevance and freshness.',
      implementation: 'Add visible "Published" and "Last Updated" dates.',
    });
  }

  // Citability recommendations
  if (categories.citability < 0.5) {
    recommendations.push({
      category: 'citability',
      priority: 'low',
      title: 'Add Quotable Statistics',
      description: 'Unique data and statistics increase chances of being cited by AI.',
      implementation:
        'Include original research, surveys, or unique data points that AI can quote.',
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// ================================================================
// CONTENT TEMPLATES
// ================================================================

/**
 * Templates optimized for AI citability
 */
export const GEO_TEMPLATES = {
  /**
   * FAQ format - highly citable by AI
   */
  faqItem: (question: string, answer: string): string => `
### ${question}

${answer}
`,

  /**
   * Definition format - easy for AI to extract
   */
  definition: (term: string, definition: string): string =>
    `**${term}** is ${definition}.`,

  /**
   * Statistic format - quotable data
   */
  statistic: (value: string, context: string, source?: string): string =>
    `${value} ${context}${source ? ` (Source: ${source})` : ''}.`,

  /**
   * Comparison format - structured data
   */
  comparison: (
    item1: string,
    item2: string,
    differences: { aspect: string; item1Value: string; item2Value: string }[]
  ): string => {
    let output = `## ${item1} vs ${item2}\n\n`;
    output += '| Aspect | ' + item1 + ' | ' + item2 + ' |\n';
    output += '|--------|' + '-'.repeat(item1.length + 2) + '|' + '-'.repeat(item2.length + 2) + '|\n';
    for (const diff of differences) {
      output += `| ${diff.aspect} | ${diff.item1Value} | ${diff.item2Value} |\n`;
    }
    return output;
  },

  /**
   * Step-by-step format - process documentation
   */
  stepByStep: (title: string, steps: string[]): string => {
    let output = `## ${title}\n\n`;
    steps.forEach((step, i) => {
      output += `${i + 1}. ${step}\n`;
    });
    return output;
  },
};

// ================================================================
// STRUCTURED DATA GENERATORS
// ================================================================

export interface ArticleSchemaData {
  title: string;
  description: string;
  author: string;
  authorUrl?: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  url: string;
}

export interface FAQSchemaData {
  questions: { question: string; answer: string }[];
}

export interface OrganizationSchemaData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
}

/**
 * Generate Article schema for blog posts
 */
export function generateArticleSchema(data: ArticleSchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title,
    description: data.description,
    author: {
      '@type': 'Person',
      name: data.author,
      url: data.authorUrl,
    },
    datePublished: data.datePublished,
    dateModified: data.dateModified || data.datePublished,
    image: data.image,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': data.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Perception',
      url: 'https://aiperception.io',
    },
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(data: FAQSchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: data.questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(data: OrganizationSchemaData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    logo: data.logo,
    description: data.description,
    sameAs: data.sameAs,
  };
}

// ================================================================
// AI BOT DETECTION
// ================================================================

/**
 * Known AI crawler user agents
 */
export const AI_BOT_USER_AGENTS = [
  'GPTBot', // OpenAI
  'ChatGPT-User', // ChatGPT browser
  'Claude-Web', // Anthropic
  'Anthropic-AI', // Anthropic
  'Google-Extended', // Google AI
  'PerplexityBot', // Perplexity
  'Amazonbot', // Amazon/Alexa
  'Meta-ExternalAgent', // Meta AI
  'Bytespider', // ByteDance AI
  'cohere-ai', // Cohere
];

/**
 * Check if request is from an AI bot
 */
export function isAIBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return AI_BOT_USER_AGENTS.some((bot) => ua.includes(bot.toLowerCase()));
}

/**
 * Get AI bot name from user agent
 */
export function getAIBotName(userAgent: string): string | null {
  const ua = userAgent.toLowerCase();
  for (const bot of AI_BOT_USER_AGENTS) {
    if (ua.includes(bot.toLowerCase())) {
      return bot;
    }
  }
  return null;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Analysis
  analyzeContent,
  calculateGEOScore,

  // Templates
  GEO_TEMPLATES,

  // Schema generators
  generateArticleSchema,
  generateFAQSchema,
  generateOrganizationSchema,

  // Bot detection
  AI_BOT_USER_AGENTS,
  isAIBot,
  getAIBotName,
};
