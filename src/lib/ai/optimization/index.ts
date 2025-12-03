/**
 * Token Optimization Module
 *
 * Phase 2, Week 3, Day 5
 * Optimizes prompts for token efficiency and cost reduction
 */

// ================================================================
// TYPES
// ================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface TokenStats {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
  provider: AIProvider;
  model: string;
}

export interface OptimizationResult {
  originalText: string;
  optimizedText: string;
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  savingsPercent: number;
  techniques: string[];
}

export interface PromptOptimizationConfig {
  maxTokens?: number;
  preserveSemantics?: boolean;
  aggressiveness?: 'low' | 'medium' | 'high';
  preservePatterns?: RegExp[];
  targetReduction?: number; // 0-1 percentage
}

export interface TokenPricing {
  inputPer1K: number;
  outputPer1K: number;
}

// ================================================================
// TOKEN PRICING (as of Dec 2024)
// ================================================================

const PRICING: Record<string, TokenPricing> = {
  // OpenAI
  'gpt-4-turbo': { inputPer1K: 0.01, outputPer1K: 0.03 },
  'gpt-4': { inputPer1K: 0.03, outputPer1K: 0.06 },
  'gpt-4o': { inputPer1K: 0.005, outputPer1K: 0.015 },
  'gpt-4o-mini': { inputPer1K: 0.00015, outputPer1K: 0.0006 },
  'gpt-3.5-turbo': { inputPer1K: 0.0005, outputPer1K: 0.0015 },

  // Anthropic
  'claude-3-opus': { inputPer1K: 0.015, outputPer1K: 0.075 },
  'claude-3-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015 },
  'claude-3-haiku': { inputPer1K: 0.00025, outputPer1K: 0.00125 },
  'claude-3.5-sonnet': { inputPer1K: 0.003, outputPer1K: 0.015 },

  // Google
  'gemini-1.5-pro': { inputPer1K: 0.00125, outputPer1K: 0.005 },
  'gemini-1.5-flash': { inputPer1K: 0.000075, outputPer1K: 0.0003 },

  // Perplexity
  'sonar-small': { inputPer1K: 0.0002, outputPer1K: 0.0002 },
  'sonar-medium': { inputPer1K: 0.0006, outputPer1K: 0.0006 },
  'sonar-large': { inputPer1K: 0.001, outputPer1K: 0.001 },
};

// Default pricing for unknown models
const DEFAULT_PRICING: TokenPricing = { inputPer1K: 0.002, outputPer1K: 0.006 };

// ================================================================
// TOKEN ESTIMATOR
// ================================================================

export class TokenEstimator {
  // Characters per token approximations by provider
  private static readonly CHARS_PER_TOKEN: Record<AIProvider, number> = {
    openai: 4,
    anthropic: 3.5,
    google: 4,
    perplexity: 4,
  };

  /**
   * Estimate token count for text
   */
  static estimate(text: string, provider: AIProvider = 'openai'): number {
    const charsPerToken = this.CHARS_PER_TOKEN[provider];
    return Math.ceil(text.length / charsPerToken);
  }

  /**
   * Estimate token count with better accuracy for code
   */
  static estimateAccurate(text: string, provider: AIProvider = 'openai'): number {
    // Base estimation
    let tokens = this.estimate(text, provider);

    // Adjust for code blocks (more tokens per character)
    const codeBlocks = text.match(/```[\s\S]*?```/g) || [];
    for (const block of codeBlocks) {
      tokens += Math.ceil(block.length / 3); // Code is denser
    }

    // Adjust for numbers (each digit often = 1 token)
    const numbers = text.match(/\d+/g) || [];
    for (const num of numbers) {
      if (num.length > 4) {
        tokens += Math.ceil(num.length / 2);
      }
    }

    // Adjust for special characters
    const specialChars = (text.match(/[^\w\s]/g) || []).length;
    tokens += Math.ceil(specialChars / 3);

    return tokens;
  }

  /**
   * Calculate estimated cost
   */
  static estimateCost(
    inputText: string,
    outputTokens: number,
    model: string,
    provider: AIProvider = 'openai'
  ): number {
    const inputTokens = this.estimateAccurate(inputText, provider);
    const pricing = PRICING[model] || DEFAULT_PRICING;

    return (
      (inputTokens / 1000) * pricing.inputPer1K +
      (outputTokens / 1000) * pricing.outputPer1K
    );
  }

  /**
   * Get token stats
   */
  static getStats(
    inputText: string,
    outputTokens: number,
    model: string,
    provider: AIProvider = 'openai'
  ): TokenStats {
    const inputTokens = this.estimateAccurate(inputText, provider);
    const pricing = PRICING[model] || DEFAULT_PRICING;
    const estimatedCost =
      (inputTokens / 1000) * pricing.inputPer1K +
      (outputTokens / 1000) * pricing.outputPer1K;

    return {
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      estimatedCost,
      provider,
      model,
    };
  }
}

// ================================================================
// PROMPT OPTIMIZER
// ================================================================

export class PromptOptimizer {
  private config: Required<PromptOptimizationConfig>;

  constructor(config: PromptOptimizationConfig = {}) {
    this.config = {
      maxTokens: config.maxTokens ?? 4000,
      preserveSemantics: config.preserveSemantics ?? true,
      aggressiveness: config.aggressiveness ?? 'medium',
      preservePatterns: config.preservePatterns ?? [],
      targetReduction: config.targetReduction ?? 0.2,
    };
  }

  // ================================================================
  // MAIN OPTIMIZATION
  // ================================================================

  optimize(text: string, provider: AIProvider = 'openai'): OptimizationResult {
    const originalTokens = TokenEstimator.estimateAccurate(text, provider);
    const techniques: string[] = [];

    let optimized = text;

    // Apply optimization techniques based on aggressiveness
    if (this.config.aggressiveness === 'low' || this.config.aggressiveness === 'medium' || this.config.aggressiveness === 'high') {
      optimized = this.removeExtraWhitespace(optimized);
      techniques.push('whitespace_normalization');
    }

    if (this.config.aggressiveness === 'medium' || this.config.aggressiveness === 'high') {
      optimized = this.abbreviateCommonPhrases(optimized);
      techniques.push('phrase_abbreviation');

      optimized = this.removeFillerWords(optimized);
      techniques.push('filler_removal');

      optimized = this.compressRepetition(optimized);
      techniques.push('repetition_compression');
    }

    if (this.config.aggressiveness === 'high') {
      optimized = this.aggressiveShortening(optimized);
      techniques.push('aggressive_shortening');

      optimized = this.removeRedundantInstructions(optimized);
      techniques.push('redundant_instruction_removal');
    }

    // Preserve specified patterns
    for (const pattern of this.config.preservePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        for (const match of matches) {
          if (!optimized.includes(match)) {
            // Pattern was removed, restore it
            optimized = optimized + '\n' + match;
          }
        }
      }
    }

    // Truncate if still over max tokens
    const currentTokens = TokenEstimator.estimateAccurate(optimized, provider);
    if (currentTokens > this.config.maxTokens) {
      optimized = this.truncateToTokenLimit(optimized, this.config.maxTokens, provider);
      techniques.push('truncation');
    }

    const optimizedTokens = TokenEstimator.estimateAccurate(optimized, provider);
    const tokensSaved = originalTokens - optimizedTokens;
    const savingsPercent = (tokensSaved / originalTokens) * 100;

    return {
      originalText: text,
      optimizedText: optimized,
      originalTokens,
      optimizedTokens,
      tokensSaved,
      savingsPercent,
      techniques,
    };
  }

  // ================================================================
  // OPTIMIZATION TECHNIQUES
  // ================================================================

  private removeExtraWhitespace(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n') // Multiple newlines to double
      .replace(/[ \t]+/g, ' ') // Multiple spaces to single
      .replace(/\n +/g, '\n') // Remove leading spaces after newlines
      .replace(/ +\n/g, '\n') // Remove trailing spaces before newlines
      .trim();
  }

  private abbreviateCommonPhrases(text: string): string {
    const abbreviations: [RegExp, string][] = [
      [/\bfor example\b/gi, 'e.g.'],
      [/\bthat is to say\b/gi, 'i.e.'],
      [/\bin other words\b/gi, 'i.e.'],
      [/\band so on\b/gi, 'etc.'],
      [/\band so forth\b/gi, 'etc.'],
      [/\bplease note that\b/gi, 'Note:'],
      [/\bit is important to note that\b/gi, 'Note:'],
      [/\bin order to\b/gi, 'to'],
      [/\bdue to the fact that\b/gi, 'because'],
      [/\bfor the purpose of\b/gi, 'to'],
      [/\bwith respect to\b/gi, 'regarding'],
      [/\bin the event that\b/gi, 'if'],
      [/\bat this point in time\b/gi, 'now'],
      [/\bat the present time\b/gi, 'now'],
      [/\bprior to\b/gi, 'before'],
      [/\bsubsequent to\b/gi, 'after'],
      [/\bin spite of the fact that\b/gi, 'although'],
      [/\bas a result of\b/gi, 'because of'],
    ];

    let result = text;
    for (const [pattern, replacement] of abbreviations) {
      result = result.replace(pattern, replacement);
    }
    return result;
  }

  private removeFillerWords(text: string): string {
    if (this.config.preserveSemantics) {
      // Conservative removal - only clearly unnecessary words
      const fillers = [
        /\bvery\s+/gi,
        /\breally\s+/gi,
        /\bactually\s+/gi,
        /\bbasically\s+/gi,
        /\bessentially\s+/gi,
        /\bpretty much\s+/gi,
        /\bkind of\s+/gi,
        /\bsort of\s+/gi,
        /\bjust\s+/gi, // Be careful with this one
      ];
      let result = text;
      for (const pattern of fillers) {
        result = result.replace(pattern, '');
      }
      return result;
    }

    // More aggressive removal
    const aggressiveFillers = [
      /\bI think\s+/gi,
      /\bI believe\s+/gi,
      /\bIt seems like\s+/gi,
      /\bAs you can see,?\s*/gi,
      /\bObviously,?\s*/gi,
      /\bClearly,?\s*/gi,
      /\bOf course,?\s*/gi,
      /\bNeedless to say,?\s*/gi,
    ];

    let result = text;
    for (const pattern of aggressiveFillers) {
      result = result.replace(pattern, '');
    }
    return result;
  }

  private compressRepetition(text: string): string {
    // Remove repeated sentences
    const sentences = text.split(/(?<=[.!?])\s+/);
    const unique = [...new Set(sentences)];
    return unique.join(' ');
  }

  private aggressiveShortening(text: string): string {
    // Remove common but verbose phrases
    const shortenings: [RegExp, string][] = [
      [/\bYou should\b/gi, ''],
      [/\bYou can\b/gi, ''],
      [/\bYou need to\b/gi, ''],
      [/\bMake sure to\b/gi, ''],
      [/\bBe sure to\b/gi, ''],
      [/\bDon't forget to\b/gi, ''],
      [/\bRemember to\b/gi, ''],
      [/\bPlease\b/gi, ''],
      [/\bKindly\b/gi, ''],
    ];

    let result = text;
    for (const [pattern, replacement] of shortenings) {
      result = result.replace(pattern, replacement);
    }

    // Clean up any resulting issues
    result = result.replace(/^\s+/gm, ''); // Remove leading whitespace
    result = result.replace(/\s{2,}/g, ' '); // Collapse multiple spaces

    return result;
  }

  private removeRedundantInstructions(text: string): string {
    const redundant = [
      /\bRespond in JSON format\.\s*Return only valid JSON\./gi,
      /\bProvide a detailed response\.\s*Be thorough\./gi,
      /\bAnswer the following question\.\s*Question:/gi,
      /\bHere is the context:\s*Context:/gi,
    ];

    let result = text;
    for (const pattern of redundant) {
      const match = text.match(pattern);
      if (match) {
        // Keep only the first part
        const simplified = match[0].split('.')[0] + '.';
        result = result.replace(pattern, simplified);
      }
    }

    return result;
  }

  private truncateToTokenLimit(
    text: string,
    maxTokens: number,
    provider: AIProvider
  ): string {
    let result = text;
    let currentTokens = TokenEstimator.estimateAccurate(result, provider);

    while (currentTokens > maxTokens && result.length > 0) {
      // Remove last sentence/paragraph
      const lastNewline = result.lastIndexOf('\n');
      const lastPeriod = result.lastIndexOf('. ');

      if (lastNewline > result.length * 0.5) {
        result = result.substring(0, lastNewline);
      } else if (lastPeriod > result.length * 0.5) {
        result = result.substring(0, lastPeriod + 1);
      } else {
        // Fall back to character truncation
        const charsToRemove = Math.ceil((currentTokens - maxTokens) * 4);
        result = result.substring(0, result.length - charsToRemove) + '...';
      }

      currentTokens = TokenEstimator.estimateAccurate(result, provider);
    }

    return result;
  }
}

// ================================================================
// PROMPT CHUNKING
// ================================================================

export class PromptChunker {
  /**
   * Split text into chunks that fit within token limits
   */
  static chunk(
    text: string,
    maxTokensPerChunk: number,
    provider: AIProvider = 'openai',
    overlap: number = 100
  ): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';
    let currentTokens = 0;

    for (const paragraph of paragraphs) {
      const paragraphTokens = TokenEstimator.estimate(paragraph, provider);

      if (currentTokens + paragraphTokens <= maxTokensPerChunk) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        currentTokens += paragraphTokens;
      } else {
        // Save current chunk
        if (currentChunk) {
          chunks.push(currentChunk);
        }

        // Start new chunk with overlap
        if (overlap > 0 && currentChunk) {
          const overlapText = this.getOverlapText(currentChunk, overlap, provider);
          currentChunk = overlapText + '\n\n' + paragraph;
          currentTokens = TokenEstimator.estimate(currentChunk, provider);
        } else {
          currentChunk = paragraph;
          currentTokens = paragraphTokens;
        }
      }
    }

    // Don't forget last chunk
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Get overlap text from end of chunk
   */
  private static getOverlapText(
    text: string,
    targetTokens: number,
    provider: AIProvider
  ): string {
    const sentences = text.split(/(?<=[.!?])\s+/);
    let overlap = '';
    let tokens = 0;

    // Work backwards through sentences
    for (let i = sentences.length - 1; i >= 0; i--) {
      const sentenceTokens = TokenEstimator.estimate(sentences[i], provider);
      if (tokens + sentenceTokens <= targetTokens) {
        overlap = sentences[i] + (overlap ? ' ' + overlap : '');
        tokens += sentenceTokens;
      } else {
        break;
      }
    }

    return overlap;
  }
}

// ================================================================
// CONTEXT COMPRESSION
// ================================================================

export class ContextCompressor {
  /**
   * Compress context by extracting key information
   */
  static compress(context: string, maxTokens: number, provider: AIProvider = 'openai'): string {
    const currentTokens = TokenEstimator.estimateAccurate(context, provider);

    if (currentTokens <= maxTokens) {
      return context;
    }

    // Extract key sentences
    const sentences = context.split(/(?<=[.!?])\s+/);
    const scored = sentences.map((sentence) => ({
      sentence,
      score: this.scoreSentence(sentence),
    }));

    // Sort by importance
    scored.sort((a, b) => b.score - a.score);

    // Build compressed context
    let compressed = '';
    let tokens = 0;

    for (const { sentence } of scored) {
      const sentenceTokens = TokenEstimator.estimate(sentence, provider);
      if (tokens + sentenceTokens <= maxTokens) {
        compressed += (compressed ? ' ' : '') + sentence;
        tokens += sentenceTokens;
      }
    }

    return compressed;
  }

  private static scoreSentence(sentence: string): number {
    let score = 0;

    // Length preference (medium length sentences)
    const words = sentence.split(/\s+/).length;
    if (words >= 10 && words <= 30) score += 2;

    // Contains important keywords
    const importantKeywords = ['important', 'key', 'main', 'primary', 'essential', 'critical', 'must', 'should', 'note'];
    for (const keyword of importantKeywords) {
      if (sentence.toLowerCase().includes(keyword)) score += 1;
    }

    // Contains numbers (often factual)
    if (/\d/.test(sentence)) score += 1;

    // Contains proper nouns (capitalized words)
    if (/[A-Z][a-z]+/.test(sentence)) score += 0.5;

    // First sentence of paragraph (more likely important)
    // This would require paragraph context, skip for now

    return score;
  }
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

export function estimateTokens(text: string, provider: AIProvider = 'openai'): number {
  return TokenEstimator.estimateAccurate(text, provider);
}

export function estimateCost(
  inputText: string,
  outputTokens: number,
  model: string,
  provider: AIProvider = 'openai'
): number {
  return TokenEstimator.estimateCost(inputText, outputTokens, model, provider);
}

export function optimizePrompt(
  text: string,
  config?: PromptOptimizationConfig,
  provider: AIProvider = 'openai'
): OptimizationResult {
  const optimizer = new PromptOptimizer(config);
  return optimizer.optimize(text, provider);
}

export function chunkText(
  text: string,
  maxTokensPerChunk: number,
  provider: AIProvider = 'openai'
): string[] {
  return PromptChunker.chunk(text, maxTokensPerChunk, provider);
}

export function compressContext(
  context: string,
  maxTokens: number,
  provider: AIProvider = 'openai'
): string {
  return ContextCompressor.compress(context, maxTokens, provider);
}
