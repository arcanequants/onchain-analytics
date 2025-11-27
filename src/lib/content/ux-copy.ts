/**
 * UX Copy - Centralized UI Text Content
 *
 * Phase 1, Week 1, Day 1
 * Based on docs/UX-WRITING-GUIDE.md
 *
 * All user-facing text should be defined here for consistency
 * and easy updates.
 */

// ================================================================
// SCORE LABELS & DESCRIPTIONS
// ================================================================

export type ScoreLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical' | 'unknown';

export interface ScoreCopy {
  label: string;
  description: string;
  shortDescription: string;
  encouragement: string;
}

export const SCORE_COPY: Record<ScoreLevel, ScoreCopy> = {
  excellent: {
    label: 'Excellent',
    description: 'Your brand has exceptional AI visibility',
    shortDescription: 'Exceptional visibility',
    encouragement: 'Keep up the great work! Focus on maintaining your position.',
  },
  good: {
    label: 'Good',
    description: 'Your brand has strong AI visibility with room for improvement',
    shortDescription: 'Strong visibility',
    encouragement: 'You\'re doing well! A few optimizations could take you to the next level.',
  },
  average: {
    label: 'Average',
    description: 'Your brand has moderate AI visibility',
    shortDescription: 'Moderate visibility',
    encouragement: 'There\'s potential here. Let\'s work on getting you recommended more.',
  },
  poor: {
    label: 'Needs Improvement',
    description: 'Your brand has limited AI visibility',
    shortDescription: 'Limited visibility',
    encouragement: 'Room to grow! Follow our recommendations to improve your score.',
  },
  critical: {
    label: 'Critical',
    description: 'Your brand has very low AI visibility',
    shortDescription: 'Very low visibility',
    encouragement: 'Let\'s change this. Start with the quick wins below.',
  },
  unknown: {
    label: 'Analyzing',
    description: 'Analysis in progress',
    shortDescription: 'Analyzing...',
    encouragement: 'We\'re working on your analysis.',
  },
};

// ================================================================
// LOADING STATES
// ================================================================

export const LOADING_STEPS = [
  'Analyzing your website...',
  'Asking ChatGPT about your industry...',
  'Checking Claude\'s recommendations...',
  'Analyzing how you compare to competitors...',
  'Calculating your AI Perception Score...',
] as const;

export const LOADING_TIPS = [
  'Did you know? Brands in Wikidata get recommended 40% more often.',
  'Tip: Adding Schema.org markup can improve your score by 10+ points.',
  'Fun fact: ChatGPT answers over 100M queries about product recommendations daily.',
  'Tip: Having a Wikipedia page significantly boosts AI trust in your brand.',
  'Did you know? Consistent NAP (Name, Address, Phone) across the web helps AI verify your business.',
  'Tip: FAQ pages with Schema.org markup are frequently cited by AI models.',
] as const;

export const LOADING_TIME_MESSAGES = {
  initial: 'This usually takes about 30 seconds',
  halfway: 'Almost there... finishing up the analysis',
  delayed: 'Taking longer than usual. Hang tight!',
} as const;

// ================================================================
// ERROR MESSAGES
// ================================================================

export interface ErrorMessage {
  title: string;
  description: string;
  action?: string;
}

export const ERROR_MESSAGES = {
  invalidUrl: {
    title: 'Couldn\'t analyze this URL',
    description: 'This doesn\'t look like a valid URL. Try entering a complete address like https://example.com',
    action: 'Check the URL',
  },
  unreachable: {
    title: 'Website not reachable',
    description: 'We couldn\'t reach this website. Check the URL and try again.',
    action: 'Try again',
  },
  rateLimited: {
    title: 'Analysis limit reached',
    description: 'You\'ve reached the free tier limit. Upgrade or try again in 1 hour.',
    action: 'View plans',
  },
  providerDown: {
    title: 'AI provider temporarily unavailable',
    description: 'One of the AI models is temporarily unavailable. Your score may be partial.',
    action: 'Continue anyway',
  },
  networkError: {
    title: 'Connection lost',
    description: 'Check your internet connection and try again.',
    action: 'Retry',
  },
  serverError: {
    title: 'Something went wrong',
    description: 'We\'re looking into it. Please try again in a few minutes.',
    action: 'Try again later',
  },
  timeout: {
    title: 'Analysis timed out',
    description: 'The analysis is taking too long. This might be a complex site. Try again or analyze a different page.',
    action: 'Try again',
  },
  blocked: {
    title: 'Site blocking analysis',
    description: 'This site may be blocking our analysis. Try your homepage instead.',
    action: 'Try homepage',
  },
} as const;

// ================================================================
// EMPTY STATES
// ================================================================

export interface EmptyState {
  headline: string;
  description: string;
  cta: string;
}

export const EMPTY_STATES = {
  noAnalyses: {
    headline: 'Your first analysis awaits',
    description: 'Enter a URL to see how AI models perceive any brand',
    cta: 'Analyze a brand',
  },
  noCompetitors: {
    headline: 'Track your competition',
    description: 'Add competitors to see how you compare',
    cta: 'Add competitors',
  },
  noHistory: {
    headline: 'History builds over time',
    description: 'Your past analyses will appear here',
    cta: 'Run an analysis',
  },
  noRecommendations: {
    headline: 'No recommendations yet',
    description: 'Run an analysis to get actionable recommendations',
    cta: 'Start analysis',
  },
} as const;

// ================================================================
// UPGRADE PROMPTS
// ================================================================

export interface UpgradePrompt {
  headline: string;
  description: string;
  cta: string;
}

export const UPGRADE_PROMPTS = {
  limitReached: {
    headline: 'You\'ve analyzed 3 brands this month',
    description: 'Upgrade for unlimited analyses and more features',
    cta: 'View plans',
  },
  competitorTracking: {
    headline: 'See how you compare',
    description: 'Track competitors and benchmark your progress over time',
    cta: 'Unlock with Pro',
  },
  historicalData: {
    headline: 'Track your progress',
    description: 'See how your score changes over time with historical tracking',
    cta: 'Get Pro',
  },
  exportPdf: {
    headline: 'Download your report',
    description: 'Export this analysis as a PDF to share with your team',
    cta: 'Upgrade to export',
  },
  weeklyReports: {
    headline: 'Get weekly updates',
    description: 'Receive automated weekly reports on your AI visibility',
    cta: 'Enable with Pro',
  },
} as const;

// ================================================================
// PROVIDER LABELS
// ================================================================

export const PROVIDER_LABELS = {
  openai: {
    name: 'OpenAI',
    displayName: 'ChatGPT',
    description: 'The most widely used AI assistant',
  },
  anthropic: {
    name: 'Anthropic',
    displayName: 'Claude',
    description: 'Known for thoughtful, nuanced responses',
  },
  google: {
    name: 'Google',
    displayName: 'Gemini',
    description: 'Google\'s multimodal AI assistant',
  },
  perplexity: {
    name: 'Perplexity',
    displayName: 'Perplexity',
    description: 'AI-powered search engine',
  },
} as const;

// ================================================================
// GLOSSARY TERMS
// ================================================================

export interface GlossaryTerm {
  term: string;
  definition: string;
  tooltip: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'AI Perception Score',
    definition:
      'A measurement (0-100) of how likely AI assistants like ChatGPT and Claude are to recommend your brand when users ask about your industry.',
    tooltip: 'Based on mentions, recommendations, and sentiment across multiple AI models.',
  },
  {
    term: 'GEO',
    definition:
      'Generative Engine Optimization. The practice of optimizing your brand\'s presence for AI models, similar to SEO for search engines.',
    tooltip: 'Like SEO, but for ChatGPT instead of Google.',
  },
  {
    term: 'Share of Voice',
    definition:
      'The percentage of times your brand is mentioned vs competitors when AI discusses your industry.',
    tooltip: "If AI mentions your industry 10 times and you're mentioned 3 times, your SOV is 30%.",
  },
  {
    term: 'E-E-A-T',
    definition:
      "Experience, Expertise, Authoritativeness, Trust. Google's quality framework that AI models also use to evaluate content.",
    tooltip: 'Signals that tell AI your brand is trustworthy.',
  },
  {
    term: 'Hallucination',
    definition:
      'When an AI model states something incorrect about your brand (wrong products, location, founding date, etc.).',
    tooltip: "AI 'made up' information about you.",
  },
  {
    term: 'Knowledge Graph',
    definition:
      'Structured databases like Wikidata that AI models use as trusted sources of entity information.',
    tooltip: 'Being in Wikidata = AI trusts you more.',
  },
];

// ================================================================
// CTA BUTTONS
// ================================================================

export const CTA_LABELS = {
  analyze: 'Analyze brand',
  analyzeNow: 'Analyze now',
  viewResults: 'View results',
  viewFullReport: 'View full report',
  getRecommendations: 'Get recommendations',
  trackCompetitors: 'Track competitors',
  upgrade: 'Upgrade',
  upgradeToPro: 'Upgrade to Pro',
  signUp: 'Sign up free',
  signIn: 'Sign in',
  tryAgain: 'Try again',
  learnMore: 'Learn more',
  contactUs: 'Contact us',
  exportPdf: 'Export PDF',
  shareResults: 'Share results',
  copyLink: 'Copy link',
} as const;

// ================================================================
// PAGE TITLES & META
// ================================================================

export const PAGE_META = {
  home: {
    title: 'AI Perception - See How AI Models Perceive Your Brand',
    description:
      'Discover how ChatGPT, Claude, and Gemini see your brand. Get your free AI Perception Score and actionable recommendations.',
  },
  analyze: {
    title: 'Analyze Your Brand | AI Perception',
    description:
      'Enter any URL to see how AI models perceive and recommend that brand. Free analysis in 30 seconds.',
  },
  results: {
    title: (brandName: string, score: number) =>
      `${brandName} - AI Perception Score: ${score}/100`,
    description: (brandName: string) =>
      `See how AI models like ChatGPT and Claude perceive ${brandName}. View recommendations to improve AI visibility.`,
  },
  glossary: {
    title: 'Glossary - AI Perception Terms Explained',
    description:
      'Learn about AI Perception Score, GEO, Share of Voice, E-E-A-T, and other key terms in AI visibility optimization.',
  },
  pricing: {
    title: 'Pricing - AI Perception Plans',
    description:
      'Compare AI Perception plans. Start free, upgrade for competitor tracking, historical data, and more.',
  },
} as const;

// ================================================================
// EXPORTS
// ================================================================

export default {
  SCORE_COPY,
  LOADING_STEPS,
  LOADING_TIPS,
  LOADING_TIME_MESSAGES,
  ERROR_MESSAGES,
  EMPTY_STATES,
  UPGRADE_PROMPTS,
  PROVIDER_LABELS,
  GLOSSARY_TERMS,
  CTA_LABELS,
  PAGE_META,
};
