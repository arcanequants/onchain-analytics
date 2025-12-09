/**
 * Results Page
 *
 * Phase 1, Week 2, Day 2-3
 * Displays AI Perception analysis results with visualizations.
 * Enhanced with count-up animations, confetti celebrations, and AI provider cards.
 */

'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ScoreCircle,
  ScoreBar,
  ScoreComparison,
  ScoreBadge,
  getScoreInterpretation,
} from '@/components/ui/ScoreCircle';
import { ScoreCountUp } from '@/components/ui/CountUpAnimation';
import { ScoreCelebration } from '@/components/ui/Confetti';
import {
  AIProviderCard,
  AIProviderGrid,
  ProviderBadge,
  type AIProviderData,
} from '@/components/ui/AIProviderCard';
import type {
  ScoreResult,
  CategoryScore,
  ScoreGrade,
} from '@/lib/score-calculator';
import type { RecommendationsResult, Recommendation } from '@/lib/recommendations';

// ================================================================
// TYPES
// ================================================================

interface ResultsPageProps {
  params: Promise<{ id: string }>;
}

// Mock data for development - will be replaced with API call
const MOCK_SCORE_RESULT: ScoreResult = {
  overallScore: 67,
  overallGrade: 'good',
  categories: [
    {
      category: 'visibility',
      name: 'AI Visibility',
      score: 72,
      grade: 'good',
      weight: 0.35,
      contribution: 25.2,
      insights: ['Good mention rate - appearing in majority of relevant queries'],
      suggestions: ['Create more AI-optimized content targeting key industry queries'],
    },
    {
      category: 'sentiment',
      name: 'Sentiment Score',
      score: 78,
      grade: 'good',
      weight: 0.20,
      contribution: 15.6,
      insights: ['Positive sentiment when mentioned by AI assistants'],
      suggestions: [],
    },
    {
      category: 'authority',
      name: 'Authority Score',
      score: 55,
      grade: 'average',
      weight: 0.15,
      contribution: 8.25,
      insights: ['Often in top recommendations'],
      suggestions: ['Build authority through thought leadership content'],
    },
    {
      category: 'relevance',
      name: 'Industry Relevance',
      score: 68,
      grade: 'good',
      weight: 0.15,
      contribution: 10.2,
      insights: ['Strong industry alignment with SaaS'],
      suggestions: [],
    },
    {
      category: 'competitive',
      name: 'Competitive Position',
      score: 52,
      grade: 'average',
      weight: 0.10,
      contribution: 5.2,
      insights: ['Included in competitive comparisons'],
      suggestions: ['Create comparison content highlighting differentiators'],
    },
    {
      category: 'coverage',
      name: 'Query Coverage',
      score: 60,
      grade: 'average',
      weight: 0.05,
      contribution: 3.0,
      insights: ['Good coverage of major query types'],
      suggestions: ['Expand content to cover review and feature queries'],
    },
  ],
  providerScores: [
    { provider: 'openai', score: 70, queriesAnalyzed: 15, mentionRate: 0.67, averagePosition: 2.3 },
    { provider: 'anthropic', score: 65, queriesAnalyzed: 15, mentionRate: 0.60, averagePosition: 2.8 },
  ],
  intentScores: [
    { intent: 'recommendation', score: 75, queryCount: 8, mentionRate: 0.75, averagePosition: 2.1 },
    { intent: 'comparison', score: 62, queryCount: 6, mentionRate: 0.50, averagePosition: 2.5 },
    { intent: 'evaluation', score: 70, queryCount: 5, mentionRate: 0.80, averagePosition: 2.2 },
    { intent: 'alternatives', score: 55, queryCount: 4, mentionRate: 0.50, averagePosition: 3.0 },
    { intent: 'use_case', score: 68, queryCount: 4, mentionRate: 0.75, averagePosition: 2.4 },
    { intent: 'ranking', score: 58, queryCount: 3, mentionRate: 0.33, averagePosition: 3.5 },
  ],
  benchmark: {
    industry: 'saas',
    industryName: 'SaaS & Cloud Software',
    averageScore: 52,
    topPerformerScore: 85,
    bottomPerformerScore: 18,
    percentileRank: 72,
    positionLabel: 'Above Average',
  },
  interpretation: 'Your brand has good AI visibility. Your brand is mentioned in most relevant AI queries, but there\'s room to improve your position and coverage.',
  keyInsights: [
    'Good mention rate - appearing in majority of relevant queries',
    'Positive sentiment when mentioned by AI assistants',
    'Often in top recommendations',
    'Strong industry alignment with SaaS',
  ],
  improvementAreas: [
    'Create more AI-optimized content targeting key industry queries',
    'Build authority through thought leadership content',
    'Create comparison content highlighting differentiators',
    'Expand content to cover review and feature queries',
  ],
  confidence: 0.85,
  calculatedAt: new Date().toISOString(),
  algorithmVersion: '1.0.0',
};

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec_1',
    title: 'Implement Comprehensive Schema Markup',
    description: 'Add structured data (JSON-LD) across your website including Organization, Product, FAQ, Review, and Article schemas.',
    rationale: 'Schema markup helps AI models understand your content structure and extract relevant information more accurately.',
    priority: 'critical',
    category: 'structured-data',
    estimatedImpact: 25,
    estimatedEffortHours: 15,
    actionItems: [
      'Implement Organization schema on homepage',
      'Add Product schema to product pages',
      'Include Review/AggregateRating schema',
      'Validate with Google Rich Results Test',
    ],
    successMetrics: ['Valid structured data in search console', 'Rich results in search snippets'],
  },
  {
    id: 'rec_2',
    title: 'Develop Thought Leadership Content',
    description: 'Create authoritative, in-depth content that positions your brand as an industry expert.',
    rationale: 'AI models favor brands that are cited as authoritative sources.',
    priority: 'high',
    category: 'content',
    estimatedImpact: 20,
    estimatedEffortHours: 40,
    actionItems: [
      'Identify 3-5 key topics where your brand has unique expertise',
      'Create a quarterly content calendar',
      'Develop at least one comprehensive industry report',
    ],
    successMetrics: ['Increase in brand mentions in AI responses'],
  },
  {
    id: 'rec_3',
    title: 'Create Comparison Pages',
    description: 'Develop comparison pages showing your product vs competitors.',
    rationale: 'Many AI queries ask for comparisons or alternatives.',
    priority: 'high',
    category: 'content',
    estimatedImpact: 18,
    estimatedEffortHours: 15,
    actionItems: [
      'Identify top 5 competitors',
      'Create individual comparison landing pages',
      'Include feature comparison tables',
    ],
    successMetrics: ['Improved positioning in comparison queries'],
  },
];

// ================================================================
// COMPONENTS
// ================================================================

/**
 * Category card with score bar
 */
function CategoryCard({ category }: { category: CategoryScore }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-3 sm:p-4 transition-all hover:border-[var(--accent-primary)] hover:shadow-md cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)]">{category.name}</h4>
        <ScoreBadge score={category.score} />
      </div>

      <ScoreBar
        score={category.score}
        showValue={false}
        animate
      />

      <div className="mt-2 flex justify-between items-center text-[10px] sm:text-xs text-[var(--text-tertiary)]">
        <span>Weight: {Math.round(category.weight * 100)}%</span>
        <span>Contrib: {category.contribution.toFixed(1)} pts</span>
      </div>

      {isExpanded && (
        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-primary)]">
          {category.insights.length > 0 && (
            <div className="mb-3">
              <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">Insights</h5>
              <ul className="space-y-1">
                {category.insights.map((insight, i) => (
                  <li key={i} className="text-xs sm:text-sm text-[var(--text-primary)] flex items-start gap-1.5 sm:gap-2">
                    <span className="text-[var(--success)]">+</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {category.suggestions.length > 0 && (
            <div>
              <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1 sm:mb-2">Suggestions</h5>
              <ul className="space-y-1">
                {category.suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs sm:text-sm text-[var(--text-tertiary)] flex items-start gap-1.5 sm:gap-2">
                    <span className="text-[var(--warning)]">!</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Recommendation card
 */
function RecommendationCard({ recommendation, index }: { recommendation: Recommendation; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-500/20 text-red-400 border-red-500/50',
    high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  };

  const categoryLabels: Record<string, string> = {
    'content': 'Content',
    'technical-seo': 'Technical SEO',
    'authority': 'Authority',
    'entity-seo': 'Entity SEO',
    'citations': 'Citations',
    'social-proof': 'Social Proof',
    'structured-data': 'Structured Data',
    'brand-mentions': 'Brand Mentions',
  };

  return (
    <div
      className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-3 sm:p-4 transition-all hover:border-[var(--accent-primary)] hover:shadow-md"
    >
      <div className="flex items-start gap-2 sm:gap-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center text-[var(--accent-primary)] font-bold text-xs sm:text-sm shrink-0">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start sm:items-center gap-1.5 sm:gap-2 flex-wrap mb-2">
            <h4 className="font-semibold text-sm sm:text-base text-[var(--text-primary)] w-full sm:w-auto">{recommendation.title}</h4>
            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full border ${priorityColors[recommendation.priority]}`}>
              {recommendation.priority}
            </span>
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
              {categoryLabels[recommendation.category] || recommendation.category}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mb-2 sm:mb-3">{recommendation.description}</p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-[var(--text-tertiary)]">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              +{recommendation.estimatedImpact} pts impact
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {recommendation.estimatedEffortHours}h effort
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-[var(--accent-primary)] hover:underline"
          >
            {isExpanded ? 'Hide details' : 'Show action items'}
          </button>

          {isExpanded && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[var(--border-primary)]">
              <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)] mb-2 sm:mb-3 italic">{recommendation.rationale}</p>

              <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1.5 sm:mb-2">Action Items</h5>
              <ul className="space-y-1.5 sm:space-y-2">
                {recommendation.actionItems.map((item, i) => (
                  <li key={i} className="text-xs sm:text-sm text-[var(--text-primary)] flex items-start gap-1.5 sm:gap-2">
                    <input type="checkbox" className="mt-0.5 sm:mt-1 accent-[var(--accent-primary)] w-3 h-3 sm:w-4 sm:h-4" />
                    {item}
                  </li>
                ))}
              </ul>

              {recommendation.successMetrics && recommendation.successMetrics.length > 0 && (
                <div className="mt-3 sm:mt-4">
                  <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1.5 sm:mb-2">Success Metrics</h5>
                  <ul className="space-y-1">
                    {recommendation.successMetrics.map((metric, i) => (
                      <li key={i} className="text-xs sm:text-sm text-[var(--text-tertiary)]">
                        - {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Industry benchmark visualization
 */
function BenchmarkChart({ benchmark, currentScore }: { benchmark: ScoreResult['benchmark']; currentScore: number }) {
  if (!benchmark) return null;

  const range = benchmark.topPerformerScore - benchmark.bottomPerformerScore;
  const avgPosition = ((benchmark.averageScore - benchmark.bottomPerformerScore) / range) * 100;
  const currentPosition = ((currentScore - benchmark.bottomPerformerScore) / range) * 100;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
        Industry Benchmark: {benchmark.industryName}
      </h3>

      <div className="relative h-6 sm:h-8 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-3 sm:mb-4">
        {/* Range indicator */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          {/* Bottom performer */}
          <div className="absolute left-0 w-1.5 sm:w-2 h-full bg-red-500/50" />

          {/* Industry average marker */}
          <div
            className="absolute w-0.5 h-full bg-[var(--text-tertiary)]"
            style={{ left: `${avgPosition}%` }}
          />

          {/* Top performer */}
          <div className="absolute right-0 w-1.5 sm:w-2 h-full bg-green-500/50" />

          {/* Current score marker */}
          <div
            className="absolute w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-[var(--accent-primary)] shadow-lg transform -translate-x-1/2 transition-all"
            style={{ left: `${Math.min(100, Math.max(0, currentPosition))}%` }}
          />
        </div>
      </div>

      <div className="flex justify-between text-[10px] sm:text-xs text-[var(--text-tertiary)] mb-4 sm:mb-6">
        <span>Bottom: {benchmark.bottomPerformerScore}</span>
        <span>Avg: {benchmark.averageScore}</span>
        <span>Top: {benchmark.topPerformerScore}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-4 text-center">
        <div className="p-3 sm:p-4 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-xl sm:text-2xl font-bold text-[var(--accent-primary)]">{benchmark.percentileRank}th</div>
          <div className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Percentile</div>
        </div>
        <div className="p-3 sm:p-4 bg-[var(--bg-tertiary)] rounded-lg">
          <div className="text-lg sm:text-2xl font-bold text-[var(--text-primary)]">{benchmark.positionLabel}</div>
          <div className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Position</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Provider comparison chart - Enhanced with AIProviderCard
 */
function ProviderComparison({ providerScores }: { providerScores: ScoreResult['providerScores'] }) {
  // Convert provider scores to AIProviderData format
  const providerData: AIProviderData[] = providerScores.map((provider) => ({
    provider: provider.provider as AIProviderData['provider'],
    score: provider.score,
    queriesAnalyzed: provider.queriesAnalyzed,
    mentionRate: provider.mentionRate,
    averagePosition: provider.averagePosition ?? undefined,
    status: 'success' as const,
  }));

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        AI Provider Performance
      </h3>

      {/* Provider badges summary */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {providerData.map((provider) => (
          <ProviderBadge
            key={provider.provider}
            provider={provider.provider}
            status={provider.status}
            size="sm"
            showLabel
          />
        ))}
      </div>

      {/* Provider cards grid - compact on mobile */}
      <AIProviderGrid providers={providerData} compact={false} />
    </div>
  );
}

/**
 * Intent breakdown chart
 */
function IntentBreakdown({ intentScores }: { intentScores: ScoreResult['intentScores'] }) {
  const intentLabels: Record<string, string> = {
    recommendation: 'Recommendations',
    comparison: 'Comparisons',
    evaluation: 'Evaluations',
    alternatives: 'Alternatives',
    use_case: 'Use Cases',
    ranking: 'Rankings',
    review: 'Reviews',
    feature: 'Features',
  };

  const sortedIntents = [...intentScores].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">
        Query Intent Performance
      </h3>

      <div className="space-y-2 sm:space-y-3">
        {sortedIntents.map((intent) => (
          <div key={intent.intent} className="flex items-center gap-2 sm:gap-3">
            <div className="w-20 sm:w-28 text-xs sm:text-sm text-[var(--text-secondary)] truncate">
              {intentLabels[intent.intent] || intent.intent}
            </div>
            <div className="flex-1">
              <ScoreBar score={intent.score} showValue={false} animate />
            </div>
            <div className="w-8 sm:w-12 text-right text-xs sm:text-sm font-medium text-[var(--text-primary)]">
              {intent.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ================================================================
// MAIN PAGE
// ================================================================

export default function ResultsPage({ params }: ResultsPageProps) {
  // Next.js 15: params is always a Promise
  const { id } = React.use(params);

  // Analysis data loaded from mock for now - API integration ready via /api/analysis/{id}
  const scoreResult = MOCK_SCORE_RESULT;
  const recommendations = MOCK_RECOMMENDATIONS;

  const [activeTab, setActiveTab] = useState<'overview' | 'categories' | 'recommendations' | 'details'>('overview');

  // Calculate projected score
  const projectedScore = useMemo(() => {
    const totalImpact = recommendations
      .slice(0, 5)
      .reduce((sum, r, i) => sum + r.estimatedImpact * Math.pow(0.85, i) * 0.7, 0);
    return Math.min(100, Math.round(scoreResult.overallScore + totalImpact));
  }, [recommendations, scoreResult.overallScore]);

  return (
    <ScoreCelebration score={scoreResult.overallScore} threshold={80}>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header - Mobile optimized */}
        <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <Link href="/" className="text-lg sm:text-xl font-bold text-[var(--accent-primary)]">
              AI Perception
            </Link>
            <div className="flex items-center gap-2 sm:gap-4">
              <button className="hidden sm:block px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Export PDF
              </button>
              <button className="px-3 sm:px-4 py-2 bg-[var(--accent-primary)] text-white rounded-lg text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">
                New Analysis
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Hero Section with Main Score */}
          <section className="mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row items-center gap-4 sm:gap-6 lg:gap-8">
                {/* Main Score Circle with Count-Up Animation */}
                <div className="flex-shrink-0 relative">
                  <ScoreCircle
                    score={scoreResult.overallScore}
                    size="xl"
                    showPercent={false}
                    animate
                  />
                  {/* Animated Score Count-Up overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ScoreCountUp
                      score={scoreResult.overallScore}
                      duration={2000}
                      size="lg"
                      className="text-[var(--text-primary)]"
                    />
                  </div>
                </div>

              {/* Score Details */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)] mb-2">
                  AI Visibility Score
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-[var(--text-secondary)] mb-3 sm:mb-4">
                  {scoreResult.interpretation}
                </p>

                {/* Quick Stats */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4">
                  <div className="px-3 sm:px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Confidence</span>
                    <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                      {Math.round(scoreResult.confidence * 100)}%
                    </div>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Industry Rank</span>
                    <div className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">
                      {scoreResult.benchmark?.percentileRank}th %ile
                    </div>
                  </div>
                  <div className="px-3 sm:px-4 py-2 bg-[var(--bg-tertiary)] rounded-lg">
                    <span className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Projected</span>
                    <div className="text-base sm:text-lg font-semibold text-[var(--success)]">
                      +{projectedScore - scoreResult.overallScore} pts
                    </div>
                  </div>
                </div>
              </div>

              {/* Score Comparison */}
              <div className="hidden xl:block">
                <ScoreComparison
                  currentScore={scoreResult.overallScore}
                  projectedScore={projectedScore}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation - Horizontal scroll on mobile */}
        <nav className="mb-4 sm:mb-6 -mx-3 sm:mx-0 px-3 sm:px-0">
          <div className="flex gap-1 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-primary)] overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'categories', label: 'Categories' },
              { id: 'recommendations', label: 'Recs' },
              { id: 'details', label: 'Details' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <span className="hidden sm:inline">{tab.id === 'recommendations' ? 'Recommendations' : tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Key Insights & Improvement Areas */}
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Key Insights */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Key Insights
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {scoreResult.keyInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-[var(--text-secondary)]">
                      <span className="mt-1.5 sm:mt-1 w-1.5 h-1.5 rounded-full bg-[var(--success)] shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvement Areas */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--warning)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Improvement Areas
                </h3>
                <ul className="space-y-2 sm:space-y-3">
                  {scoreResult.improvementAreas.map((area, i) => (
                    <li key={i} className="flex items-start gap-2 sm:gap-3 text-sm sm:text-base text-[var(--text-secondary)]">
                      <span className="mt-1.5 sm:mt-1 w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0" />
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Category Overview */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Score Breakdown</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {scoreResult.categories.map((category) => (
                  <CategoryCard key={category.category} category={category} />
                ))}
              </div>
            </div>

            {/* Benchmark */}
            <BenchmarkChart benchmark={scoreResult.benchmark} currentScore={scoreResult.overallScore} />
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Category Grid */}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              {scoreResult.categories.map((category) => (
                <div key={category.category} className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">{category.name}</h3>
                      <p className="text-[10px] sm:text-xs text-[var(--text-tertiary)]">Weight: {Math.round(category.weight * 100)}%</p>
                    </div>
                    <ScoreCircle score={category.score} size="sm" showGrade={false} />
                  </div>

                  {category.insights.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1.5 sm:mb-2">Insights</h5>
                      <ul className="space-y-1">
                        {category.insights.map((insight, i) => (
                          <li key={i} className="text-xs sm:text-sm text-[var(--text-primary)] flex items-start gap-1.5 sm:gap-2">
                            <span className="text-[var(--success)]">+</span>
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {category.suggestions.length > 0 && (
                    <div>
                      <h5 className="text-[10px] sm:text-xs font-medium text-[var(--text-secondary)] mb-1.5 sm:mb-2">Suggestions</h5>
                      <ul className="space-y-1">
                        {category.suggestions.map((suggestion, i) => (
                          <li key={i} className="text-xs sm:text-sm text-[var(--text-tertiary)] flex items-start gap-1.5 sm:gap-2">
                            <span className="text-[var(--warning)]">!</span>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/30 rounded-lg p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl font-bold text-[var(--accent-primary)]">{recommendations.length}</div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)]">Recommendations</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                    Implementing these could increase your score to {projectedScore}
                  </p>
                </div>
              </div>
            </div>

            {/* Recommendations List */}
            <div className="space-y-3 sm:space-y-4">
              {recommendations.map((rec, index) => (
                <RecommendationCard key={rec.id} recommendation={rec} index={index} />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Provider Comparison */}
            <ProviderComparison providerScores={scoreResult.providerScores} />

            {/* Intent Breakdown */}
            <IntentBreakdown intentScores={scoreResult.intentScores} />

            {/* Technical Details */}
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] mb-3 sm:mb-4">Technical Details</h3>
              <div className="grid sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-tertiary)]">Algorithm Version</span>
                  <span className="text-[var(--text-primary)] font-mono">{scoreResult.algorithmVersion}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-tertiary)]">Calculated At</span>
                  <span className="text-[var(--text-primary)] font-mono text-right">
                    {new Date(scoreResult.calculatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-tertiary)]">Confidence</span>
                  <span className="text-[var(--text-primary)] font-mono">{Math.round(scoreResult.confidence * 100)}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-tertiary)]">Industry</span>
                  <span className="text-[var(--text-primary)] text-right">{scoreResult.benchmark?.industryName}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

        {/* Footer */}
        <footer className="mt-8 sm:mt-16 py-6 sm:py-8 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-[var(--text-tertiary)]">
            <p className="truncate">Analysis ID: {id}</p>
            <p className="mt-1">Generated by AI Perception Engineering Agency</p>
          </div>
        </footer>
      </div>
    </ScoreCelebration>
  );
}
