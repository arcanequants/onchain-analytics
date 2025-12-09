'use client';

/**
 * User Dashboard
 *
 * Phase 2, Week 4, Day 2
 * Main dashboard with analysis history, score trends, and quick actions
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TrendChart, TREND_PRESETS, generateMockTrendData } from '@/components/charts/TrendChart';
import { ProviderBreakdown, createProviderData } from '@/components/charts/ProviderBreakdown';
import {
  PlanTier,
  PLAN_LIMITS,
  canPerformAnalysis,
  getHistoryVisibility,
  getDaysUntilReset,
  type UsageData,
} from '@/lib/freemium';

// ================================================================
// TYPES
// ================================================================

interface Analysis {
  id: string;
  url: string;
  domain: string;
  score: number;
  status: 'completed' | 'processing' | 'failed';
  createdAt: Date;
  providers: {
    openai?: number;
    anthropic?: number;
    google?: number;
    perplexity?: number;
  };
}

interface DashboardData {
  analyses: Analysis[];
  totalAnalyses: number;
  avgScore: number;
  scoreTrend: number; // positive = improving
  usage: UsageData;
  plan: PlanTier;
}

// ================================================================
// API HELPER
// ================================================================

async function fetchUserDashboardData(): Promise<DashboardData | null> {
  try {
    const response = await fetch('/api/user/analyses?limit=10');

    if (!response.ok) {
      if (response.status === 401) {
        // User not logged in - show empty state
        return null;
      }
      throw new Error('Failed to fetch data');
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(json.error || 'Unknown error');
    }

    const { analyses, totalCount, avgScore, usage, plan } = json.data;

    // Transform dates from strings
    const transformedAnalyses: Analysis[] = analyses.map((a: Record<string, unknown>) => ({
      ...a,
      createdAt: new Date(a.createdAt as string),
    }));

    const transformedUsage: UsageData = {
      periodStart: new Date(usage.periodStart),
      periodEnd: new Date(usage.periodEnd),
      analysesUsed: usage.analysesUsed,
      lastAnalysisAt: usage.lastAnalysisAt ? new Date(usage.lastAnalysisAt) : undefined,
      monitoredUrls: usage.monitoredUrls,
      apiCallsUsed: usage.apiCallsUsed,
    };

    // Use scoreTrend from API (calculated from historical data)
    const scoreTrend = json.data.scoreTrend || 0;

    return {
      analyses: transformedAnalyses,
      totalAnalyses: totalCount,
      avgScore,
      scoreTrend,
      usage: transformedUsage,
      plan: plan as PlanTier,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

// ================================================================
// COMPONENTS
// ================================================================

function ScoreBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (score >= 40) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-semibold border ${getColor()}`}>
      {score}
    </span>
  );
}

function StatusBadge({ status }: { status: Analysis['status'] }) {
  const config = {
    completed: { color: 'bg-green-500/20 text-green-400', label: 'Completed' },
    processing: { color: 'bg-blue-500/20 text-blue-400', label: 'Processing' },
    failed: { color: 'bg-red-500/20 text-red-400', label: 'Failed' },
  };

  const { color, label } = config[status];

  return (
    <span className={`px-2 py-1 rounded text-xs ${color}`}>
      {label}
    </span>
  );
}

function EmptyState({ plan }: { plan: PlanTier }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
        <svg
          className="w-12 h-12 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        Welcome to AI Perception
      </h2>

      <p className="text-gray-400 max-w-md mx-auto mb-8">
        Discover how AI models perceive your brand. Run your first analysis to see
        your AI Perception Score across multiple AI providers.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Run Your First Analysis
      </Link>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-left">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-1">Analyze</h3>
          <p className="text-gray-400 text-sm">
            Enter any URL to see how AI models understand your brand
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-left">
          <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-1">Compare</h3>
          <p className="text-gray-400 text-sm">
            See scores across OpenAI, Claude, Gemini, and Perplexity
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-left">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="text-white font-medium mb-1">Improve</h3>
          <p className="text-gray-400 text-sm">
            Get actionable recommendations to boost your AI visibility
          </p>
        </div>
      </div>
    </div>
  );
}

function UsageCard({ usage, plan }: { usage: UsageData; plan: PlanTier }) {
  const limits = PLAN_LIMITS[plan];
  const access = canPerformAnalysis(plan, usage);
  const daysUntilReset = getDaysUntilReset(usage);

  const usagePercent = Math.min(100, (usage.analysesUsed / limits.analysesPerMonth) * 100);

  const getProgressColor = () => {
    if (usagePercent >= 90) return 'bg-red-500';
    if (usagePercent >= 70) return 'bg-yellow-500';
    return 'bg-indigo-500';
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Usage This Month</h3>
        <span className="text-xs text-gray-500 uppercase">{limits.name} Plan</span>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Analyses</span>
          <span className="text-white">
            {usage.analysesUsed} / {limits.analysesPerMonth === Infinity ? '∞' : limits.analysesPerMonth}
          </span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressColor()} transition-all`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Resets in {daysUntilReset} days</span>
        {!access.allowed && (
          <Link href="/pricing" className="text-indigo-400 hover:text-indigo-300">
            Upgrade
          </Link>
        )}
      </div>
    </div>
  );
}

function AnalysisRow({ analysis, isBlurred }: { analysis: Analysis; isBlurred: boolean }) {
  const timeAgo = getTimeAgo(analysis.createdAt);

  return (
    <div className={`flex items-center justify-between p-4 hover:bg-gray-800/50 transition-colors ${isBlurred ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex items-center gap-4">
        <ScoreBadge score={analysis.score} />
        <div>
          <p className="text-white font-medium">{analysis.domain}</p>
          <p className="text-gray-500 text-sm">{timeAgo}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <StatusBadge status={analysis.status} />
        {analysis.status === 'completed' && (
          <Link
            href={`/results/${analysis.id}`}
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            View Report
          </Link>
        )}
      </div>
    </div>
  );
}

function AnalysisHistory({
  analyses,
  plan,
  totalCount,
}: {
  analyses: Analysis[];
  plan: PlanTier;
  totalCount: number;
}) {
  const visibility = getHistoryVisibility(plan, totalCount);

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No analyses yet. Run your first analysis to see history.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-700">
      {analyses.map((analysis, index) => (
        <AnalysisRow
          key={analysis.id}
          analysis={analysis}
          isBlurred={index >= visibility.visibleCount}
        />
      ))}

      {visibility.showUpgradePrompt && (
        <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-t border-indigo-500/20">
          <div className="flex items-center justify-between">
            <p className="text-gray-300 text-sm">
              {visibility.lockMessage}
            </p>
            <Link
              href="/pricing"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded transition-colors"
            >
              Upgrade to {visibility.requiredPlan}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickActions({ canAnalyze }: { canAnalyze: boolean }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Link
        href="/"
        className={`p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-center ${!canAnalyze ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="w-10 h-10 mx-auto mb-2 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">New Analysis</span>
      </Link>

      <Link
        href="/pricing"
        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-center"
      >
        <div className="w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">Upgrade</span>
      </Link>

      <Link
        href="/help"
        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-center"
      >
        <div className="w-10 h-10 mx-auto mb-2 bg-purple-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">Help</span>
      </Link>

      <Link
        href="/faq"
        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-center"
      >
        <div className="w-10 h-10 mx-auto mb-2 bg-gray-500/20 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="text-white text-sm font-medium">FAQ</span>
      </Link>
    </div>
  );
}

function ScoreTrendCard() {
  const trendData = generateMockTrendData(30, 65, 15).map((point, i) => ({
    ...point,
    score: Math.round(point.value),
  }));

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-medium mb-4">Score Trend (30 Days)</h3>
      <TrendChart
        data={trendData}
        series={TREND_PRESETS.score.series}
        variant="area"
        height={200}
        showLegend={false}
        yAxisDomain={[0, 100]}
        annotations={TREND_PRESETS.score.annotations}
      />
    </div>
  );
}

function ProviderComparisonCard() {
  const providerData = [
    createProviderData('openai', 'OpenAI', {
      requests: 150,
      tokensUsed: 45000,
      cost: 12.50,
      avgLatency: 850,
      successRate: 99.2,
      cacheHitRate: 45,
    }),
    createProviderData('anthropic', 'Anthropic', {
      requests: 150,
      tokensUsed: 52000,
      cost: 15.60,
      avgLatency: 920,
      successRate: 98.8,
      cacheHitRate: 42,
    }),
    createProviderData('google', 'Google', {
      requests: 150,
      tokensUsed: 38000,
      cost: 8.20,
      avgLatency: 780,
      successRate: 97.5,
      cacheHitRate: 38,
    }),
    createProviderData('perplexity', 'Perplexity', {
      requests: 150,
      tokensUsed: 35000,
      cost: 7.80,
      avgLatency: 650,
      successRate: 96.5,
      cacheHitRate: 55,
    }),
  ];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <h3 className="text-white font-medium mb-4">Provider Performance</h3>
      <ProviderBreakdown
        data={providerData}
        variant="radar"
        height={250}
        showLegend={true}
      />
    </div>
  );
}

// ================================================================
// HELPERS
// ================================================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    // Fetch real data from API
    async function loadData() {
      const dashboardData = await fetchUserDashboardData();
      setData(dashboardData);
      setIsLoading(false);
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-red-400">Failed to load dashboard</p>
      </div>
    );
  }

  const { analyses, usage, plan } = data;
  const access = canPerformAnalysis(plan, usage);

  // Show empty state if no analyses
  if (analyses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <EmptyState plan={plan} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">
            Track your AI perception scores and manage analyses
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <QuickActions canAnalyze={access.allowed} />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Average Score</p>
            <p className="text-3xl font-bold text-white">{data.avgScore}</p>
            <p className={`text-sm ${data.scoreTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {data.scoreTrend >= 0 ? '+' : ''}{data.scoreTrend} this month
            </p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">Total Analyses</p>
            <p className="text-3xl font-bold text-white">{data.totalAnalyses}</p>
            <p className="text-gray-500 text-sm">Lifetime</p>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-1">URLs Monitored</p>
            <p className="text-3xl font-bold text-white">{usage.monitoredUrls}</p>
            <p className="text-gray-500 text-sm">Active</p>
          </div>

          <UsageCard usage={usage} plan={plan} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis History */}
          <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Recent Analyses</h2>
              <span className="text-gray-500 text-sm">
                {data.totalAnalyses} total
              </span>
            </div>
            <AnalysisHistory
              analyses={analyses}
              plan={plan}
              totalCount={data.totalAnalyses}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ScoreTrendCard />
            <ProviderComparisonCard />
          </div>
        </div>
      </div>
    </div>
  );
}
