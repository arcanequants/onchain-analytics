/**
 * Design Tokens - TypeScript Utilities
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.8
 *
 * TypeScript utilities for working with design tokens
 */

// ================================================================
// SCORE UTILITIES
// ================================================================

export type ScoreLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical' | 'unknown';

export interface ScoreConfig {
  level: ScoreLevel;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  shadowClass: string;
  className: string;
}

/**
 * Get score level from numeric score
 */
export function getScoreLevel(score: number | null | undefined): ScoreLevel {
  if (score === null || score === undefined) return 'unknown';
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'average';
  if (score >= 20) return 'poor';
  return 'critical';
}

/**
 * Get full score configuration for a given score
 */
export function getScoreConfig(score: number | null | undefined): ScoreConfig {
  const level = getScoreLevel(score);

  const configs: Record<ScoreLevel, ScoreConfig> = {
    excellent: {
      level: 'excellent',
      label: 'Excellent',
      description: 'Your brand has exceptional AI visibility',
      color: 'var(--score-excellent)',
      bgColor: 'var(--score-excellent-bg)',
      borderColor: 'var(--score-excellent-border)',
      shadowClass: 'shadow-score-excellent',
      className: 'score-excellent',
    },
    good: {
      level: 'good',
      label: 'Good',
      description: 'Your brand has strong AI visibility with room for improvement',
      color: 'var(--score-good)',
      bgColor: 'var(--score-good-bg)',
      borderColor: 'var(--score-good-border)',
      shadowClass: 'shadow-score-good',
      className: 'score-good',
    },
    average: {
      level: 'average',
      label: 'Average',
      description: 'Your brand has moderate AI visibility',
      color: 'var(--score-average)',
      bgColor: 'var(--score-average-bg)',
      borderColor: 'var(--score-average-border)',
      shadowClass: 'shadow-score-average',
      className: 'score-average',
    },
    poor: {
      level: 'poor',
      label: 'Needs Improvement',
      description: 'Your brand has limited AI visibility',
      color: 'var(--score-poor)',
      bgColor: 'var(--score-poor-bg)',
      borderColor: 'var(--score-poor-border)',
      shadowClass: 'shadow-score-poor',
      className: 'score-poor',
    },
    critical: {
      level: 'critical',
      label: 'Critical',
      description: 'Your brand has very low AI visibility',
      color: 'var(--score-critical)',
      bgColor: 'var(--score-critical-bg)',
      borderColor: 'var(--score-critical-border)',
      shadowClass: 'shadow-score-critical',
      className: 'score-critical',
    },
    unknown: {
      level: 'unknown',
      label: 'Analyzing',
      description: 'Analysis in progress',
      color: 'var(--score-unknown)',
      bgColor: 'var(--score-unknown-bg)',
      borderColor: 'var(--score-unknown-border)',
      shadowClass: '',
      className: 'score-unknown',
    },
  };

  return configs[level];
}

// ================================================================
// PROVIDER UTILITIES
// ================================================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  displayName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  className: string;
  icon: string; // Icon identifier
}

/**
 * Get configuration for an AI provider
 */
export function getProviderConfig(provider: AIProvider): ProviderConfig {
  const configs: Record<AIProvider, ProviderConfig> = {
    openai: {
      id: 'openai',
      name: 'OpenAI',
      displayName: 'ChatGPT',
      color: 'var(--provider-openai)',
      bgColor: 'var(--provider-openai-bg)',
      borderColor: 'var(--provider-openai-border)',
      className: 'provider-openai',
      icon: 'openai',
    },
    anthropic: {
      id: 'anthropic',
      name: 'Anthropic',
      displayName: 'Claude',
      color: 'var(--provider-anthropic)',
      bgColor: 'var(--provider-anthropic-bg)',
      borderColor: 'var(--provider-anthropic-border)',
      className: 'provider-anthropic',
      icon: 'anthropic',
    },
    google: {
      id: 'google',
      name: 'Google',
      displayName: 'Gemini',
      color: 'var(--provider-google)',
      bgColor: 'var(--provider-google-bg)',
      borderColor: 'var(--provider-google-border)',
      className: 'provider-google',
      icon: 'google',
    },
    perplexity: {
      id: 'perplexity',
      name: 'Perplexity',
      displayName: 'Perplexity',
      color: 'var(--provider-perplexity)',
      bgColor: 'var(--provider-perplexity-bg)',
      borderColor: 'var(--provider-perplexity-border)',
      className: 'provider-perplexity',
      icon: 'perplexity',
    },
  };

  return configs[provider];
}

/**
 * Get all provider configurations
 */
export function getAllProviders(): ProviderConfig[] {
  return [
    getProviderConfig('openai'),
    getProviderConfig('anthropic'),
    getProviderConfig('google'),
    getProviderConfig('perplexity'),
  ];
}

// ================================================================
// SENTIMENT UTILITIES
// ================================================================

export type Sentiment = 'positive' | 'neutral' | 'negative';

export interface SentimentConfig {
  sentiment: Sentiment;
  label: string;
  color: string;
  bgColor: string;
  className: string;
}

/**
 * Get sentiment level from numeric score (-1 to 1)
 */
export function getSentimentLevel(score: number): Sentiment {
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

/**
 * Get sentiment configuration
 */
export function getSentimentConfig(sentiment: Sentiment): SentimentConfig {
  const configs: Record<Sentiment, SentimentConfig> = {
    positive: {
      sentiment: 'positive',
      label: 'Positive',
      color: 'var(--sentiment-positive)',
      bgColor: 'var(--sentiment-positive-bg)',
      className: 'sentiment-positive',
    },
    neutral: {
      sentiment: 'neutral',
      label: 'Neutral',
      color: 'var(--sentiment-neutral)',
      bgColor: 'var(--sentiment-neutral-bg)',
      className: 'sentiment-neutral',
    },
    negative: {
      sentiment: 'negative',
      label: 'Negative',
      color: 'var(--sentiment-negative)',
      bgColor: 'var(--sentiment-negative-bg)',
      className: 'sentiment-negative',
    },
  };

  return configs[sentiment];
}

// ================================================================
// CHART COLORS
// ================================================================

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
];

/**
 * Get a chart color by index (cycles through available colors)
 */
export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

// ================================================================
// ANIMATION UTILITIES
// ================================================================

export const ANIMATION_DURATIONS = {
  fast: 150,
  normal: 300,
  slow: 500,
  scoreReveal: 1500,
  scoreCount: 2000,
} as const;

export const ANIMATION_EASINGS = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// ================================================================
// EXPORTS
// ================================================================

export default {
  getScoreLevel,
  getScoreConfig,
  getProviderConfig,
  getAllProviders,
  getSentimentLevel,
  getSentimentConfig,
  getChartColor,
  CHART_COLORS,
  ANIMATION_DURATIONS,
  ANIMATION_EASINGS,
};
