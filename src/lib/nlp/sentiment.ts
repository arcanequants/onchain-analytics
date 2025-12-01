/**
 * Sentiment Analysis
 *
 * Lexicon-based sentiment analysis utilities
 *
 * Phase 3, Week 10
 */

import type { SentimentScore, SentimentLabel, AspectSentiment } from './types';
import { tokenize, tokenizeSentences } from './tokenizer';

// ================================================================
// SENTIMENT LEXICONS
// ================================================================

// AFINN-like sentiment lexicon (subset for demonstration)
const SENTIMENT_LEXICON: Record<string, number> = {
  // Strong positive (3-5)
  'excellent': 5, 'outstanding': 5, 'amazing': 5, 'fantastic': 5, 'wonderful': 5,
  'exceptional': 5, 'superb': 5, 'perfect': 5, 'brilliant': 5, 'awesome': 4,
  'great': 4, 'love': 4, 'best': 4, 'recommend': 4, 'impressive': 4,
  'remarkable': 4, 'superior': 4, 'leading': 4, 'innovative': 4, 'revolutionary': 4,
  'top': 3, 'good': 3, 'nice': 3, 'helpful': 3, 'useful': 3,
  'effective': 3, 'reliable': 3, 'trusted': 3, 'quality': 3, 'professional': 3,
  'efficient': 3, 'valuable': 3, 'popular': 3, 'favorite': 3, 'preferred': 3,

  // Moderate positive (1-2)
  'like': 2, 'better': 2, 'improved': 2, 'well': 2, 'positive': 2,
  'benefits': 2, 'advantage': 2, 'success': 2, 'easy': 2, 'fast': 2,
  'simple': 2, 'convenient': 2, 'affordable': 2, 'free': 2, 'support': 2,
  'ok': 1, 'okay': 1, 'fine': 1, 'decent': 1, 'fair': 1,
  'acceptable': 1, 'adequate': 1, 'sufficient': 1, 'satisfactory': 1, 'reasonable': 1,

  // Strong negative (-3 to -5)
  'terrible': -5, 'horrible': -5, 'awful': -5, 'worst': -5, 'hate': -5,
  'disaster': -5, 'catastrophe': -5, 'scam': -5, 'fraud': -5, 'dangerous': -5,
  'bad': -4, 'poor': -4, 'fail': -4, 'failed': -4, 'failure': -4,
  'broken': -4, 'useless': -4, 'worthless': -4, 'disappointing': -4, 'frustrated': -4,
  'wrong': -3, 'problem': -3, 'issue': -3, 'bug': -3, 'error': -3,
  'slow': -3, 'expensive': -3, 'overpriced': -3, 'complicated': -3, 'confusing': -3,
  'unreliable': -3, 'unprofessional': -3, 'inferior': -3, 'outdated': -3, 'limited': -3,

  // Moderate negative (-1 to -2)
  'difficult': -2, 'hard': -2, 'annoying': -2, 'concern': -2, 'lacking': -2,
  'missing': -2, 'incomplete': -2, 'mediocre': -2, 'average': -1, 'basic': -1,
  'ordinary': -1, 'unclear': -1, 'doubt': -1, 'questionable': -1, 'uncertain': -1,
  'dislike': -2, 'worse': -2, 'decline': -2, 'decrease': -2, 'risk': -2,
  'warning': -2, 'caution': -2, 'avoid': -3, 'beware': -3, 'never': -2,

  // Intensifiers (multiply sentiment)
  'very': 1.5, 'really': 1.5, 'extremely': 2, 'incredibly': 2, 'highly': 1.5,
  'absolutely': 2, 'completely': 1.5, 'totally': 1.5, 'quite': 1.25, 'somewhat': 0.5,
  'slightly': 0.5, 'rather': 0.75, 'fairly': 0.75, 'pretty': 1.25, 'so': 1.5,
};

// Negation words that flip sentiment
const NEGATION_WORDS = new Set([
  'not', 'no', 'never', 'neither', 'nobody', 'nothing', 'nowhere', 'none',
  'dont', "don't", 'doesnt', "doesn't", 'didnt', "didn't", 'wont', "won't",
  'wouldnt', "wouldn't", 'couldnt', "couldn't", 'shouldnt', "shouldn't",
  'cant', "can't", 'cannot', 'isnt', "isn't", 'arent', "aren't", 'wasnt',
  "wasn't", 'werent', "weren't", 'hasnt', "hasn't", 'havent', "haven't",
  'hadnt', "hadn't", 'hardly', 'barely', 'scarcely', 'rarely', 'seldom',
]);

// Aspect categories for aspect-based sentiment
const ASPECT_KEYWORDS: Record<string, string[]> = {
  'quality': ['quality', 'reliable', 'durable', 'sturdy', 'build', 'construction'],
  'price': ['price', 'cost', 'expensive', 'cheap', 'affordable', 'value', 'worth', 'money'],
  'service': ['service', 'support', 'customer', 'help', 'response', 'staff', 'team'],
  'usability': ['easy', 'simple', 'intuitive', 'user-friendly', 'interface', 'design', 'ux'],
  'performance': ['fast', 'slow', 'speed', 'performance', 'efficient', 'quick', 'responsive'],
  'features': ['feature', 'functionality', 'capability', 'option', 'tool', 'function'],
  'reliability': ['reliable', 'stable', 'consistent', 'uptime', 'availability', 'dependable'],
};

// ================================================================
// SENTIMENT ANALYSIS
// ================================================================

/**
 * Analyze sentiment of text
 */
export function analyzeSentiment(text: string): SentimentScore {
  const words = tokenize(text);
  let totalScore = 0;
  let wordCount = 0;
  let positiveScore = 0;
  let negativeScore = 0;
  let isNegated = false;
  let intensifier = 1;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check for negation
    if (NEGATION_WORDS.has(word)) {
      isNegated = true;
      continue;
    }

    // Check for intensifier
    const intensifierValue = SENTIMENT_LEXICON[word];
    if (intensifierValue !== undefined && intensifierValue >= 0.5 && intensifierValue <= 2) {
      intensifier = intensifierValue;
      continue;
    }

    // Get word sentiment
    const sentiment = SENTIMENT_LEXICON[word];
    if (sentiment !== undefined) {
      let adjustedSentiment = sentiment * intensifier;

      // Apply negation
      if (isNegated) {
        adjustedSentiment = -adjustedSentiment * 0.5; // Negation flips and reduces magnitude
        isNegated = false;
      }

      totalScore += adjustedSentiment;
      wordCount++;

      if (adjustedSentiment > 0) {
        positiveScore += adjustedSentiment;
      } else {
        negativeScore += Math.abs(adjustedSentiment);
      }

      // Reset intensifier after use
      intensifier = 1;
    }

    // Reset negation after 3 words
    if (i > 0 && NEGATION_WORDS.has(words[i - 3])) {
      isNegated = false;
    }
  }

  // Normalize scores
  const maxPossibleScore = wordCount * 5 || 1;
  const normalizedPositive = Math.min(1, positiveScore / maxPossibleScore);
  const normalizedNegative = Math.min(1, negativeScore / maxPossibleScore);
  const normalizedNeutral = Math.max(0, 1 - normalizedPositive - normalizedNegative);

  // Determine label and confidence
  const label = determineSentimentLabel(normalizedPositive, normalizedNegative);
  const confidence = calculateConfidence(normalizedPositive, normalizedNegative, normalizedNeutral);

  return {
    label,
    confidence,
    positive: normalizedPositive,
    negative: normalizedNegative,
    neutral: normalizedNeutral,
  };
}

/**
 * Determine sentiment label from scores
 */
function determineSentimentLabel(positive: number, negative: number): SentimentLabel {
  const diff = positive - negative;
  const threshold = 0.1;

  if (positive > threshold && negative > threshold) {
    return 'mixed';
  }
  if (diff > threshold) {
    return 'positive';
  }
  if (diff < -threshold) {
    return 'negative';
  }
  return 'neutral';
}

/**
 * Calculate confidence score
 */
function calculateConfidence(positive: number, negative: number, neutral: number): number {
  const scores = [positive, negative, neutral];
  const max = Math.max(...scores);
  const secondMax = Math.max(...scores.filter((s) => s !== max));

  // Confidence is higher when dominant score is much larger than others
  return Math.min(1, max - secondMax + 0.5);
}

/**
 * Analyze sentiment by sentence
 */
export function analyzeSentimentBySentence(
  text: string
): Array<{ sentence: string; sentiment: SentimentScore }> {
  const sentences = tokenizeSentences(text);

  return sentences.map((sentence) => ({
    sentence,
    sentiment: analyzeSentiment(sentence),
  }));
}

/**
 * Analyze aspect-based sentiment
 */
export function analyzeAspectSentiment(text: string): AspectSentiment[] {
  const sentences = tokenizeSentences(text);
  const results: AspectSentiment[] = [];

  for (const sentence of sentences) {
    const lowerSentence = sentence.toLowerCase();

    for (const [aspect, keywords] of Object.entries(ASPECT_KEYWORDS)) {
      const foundKeyword = keywords.find((kw) => lowerSentence.includes(kw));

      if (foundKeyword) {
        const sentiment = analyzeSentiment(sentence);
        results.push({
          aspect,
          sentiment: sentiment.label,
          confidence: sentiment.confidence,
          snippet: sentence,
        });
        break; // Only one aspect per sentence
      }
    }
  }

  return results;
}

/**
 * Get overall sentiment summary
 */
export function getSentimentSummary(text: string): {
  overall: SentimentScore;
  bySentence: Array<{ sentence: string; sentiment: SentimentScore }>;
  aspects: AspectSentiment[];
  distribution: { positive: number; negative: number; neutral: number; mixed: number };
} {
  const overall = analyzeSentiment(text);
  const bySentence = analyzeSentimentBySentence(text);
  const aspects = analyzeAspectSentiment(text);

  // Calculate distribution
  const distribution = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  for (const { sentiment } of bySentence) {
    distribution[sentiment.label]++;
  }

  // Normalize to percentages
  const total = bySentence.length || 1;
  distribution.positive = distribution.positive / total;
  distribution.negative = distribution.negative / total;
  distribution.neutral = distribution.neutral / total;
  distribution.mixed = distribution.mixed / total;

  return { overall, bySentence, aspects, distribution };
}

/**
 * Compare sentiment between two texts
 */
export function compareSentiment(
  text1: string,
  text2: string
): {
  text1: SentimentScore;
  text2: SentimentScore;
  difference: {
    positive: number;
    negative: number;
    direction: 'improved' | 'declined' | 'unchanged';
  };
} {
  const sentiment1 = analyzeSentiment(text1);
  const sentiment2 = analyzeSentiment(text2);

  const positiveDiff = sentiment2.positive - sentiment1.positive;
  const negativeDiff = sentiment2.negative - sentiment1.negative;

  let direction: 'improved' | 'declined' | 'unchanged';
  if (positiveDiff > 0.1 || negativeDiff < -0.1) {
    direction = 'improved';
  } else if (positiveDiff < -0.1 || negativeDiff > 0.1) {
    direction = 'declined';
  } else {
    direction = 'unchanged';
  }

  return {
    text1: sentiment1,
    text2: sentiment2,
    difference: {
      positive: positiveDiff,
      negative: negativeDiff,
      direction,
    },
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  analyzeSentiment,
  analyzeSentimentBySentence,
  analyzeAspectSentiment,
  getSentimentSummary,
  compareSentiment,
};
