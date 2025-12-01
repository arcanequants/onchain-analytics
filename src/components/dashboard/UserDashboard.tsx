/**
 * UserDashboard Component
 *
 * Phase 2, Week 4, Day 2
 * Main dashboard for authenticated users showing usage, history, and quick actions.
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  PlanTier,
  PLAN_LIMITS,
  UsageData,
  getUpgradeTrigger,
  formatPrice,
} from '@/lib/freemium';
import { UsageProgress, UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { BlurredContent } from '@/components/ui/BlurredContent';

// ================================================================
// TYPES
// ================================================================

export interface Analysis {
  id: string;
  url: string;
  title: string;
  score: number;
  createdAt: Date;
  status: 'completed' | 'processing' | 'failed';
  provider: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  plan: PlanTier;
  createdAt: Date;
  trialEndsAt?: Date;
}

export interface DashboardData {
  user: UserProfile;
  usage: UsageData;
  recentAnalyses: Analysis[];
  savedUrls: string[];
}

export interface UserDashboardProps {
  data: DashboardData;
  onRunAnalysis?: () => void;
  onViewHistory?: () => void;
  onUpgrade?: (plan: PlanTier) => void;
  onAnalysisClick?: (analysisId: string) => void;
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function AnalysisIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RocketIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function LoaderIcon({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5 animate-spin', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0110 10" opacity="0.75" />
    </svg>
  );
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4',
        className
      )}
      data-testid="stat-card"
    >
      <div className="flex items-center justify-between">
        <div className="text-gray-500 dark:text-gray-400">{icon}</div>
        {trend && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              trend.isPositive
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            )}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="stat-value">
          {value}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400" data-testid="stat-label">
          {label}
        </p>
      </div>
    </div>
  );
}

interface AnalysisItemProps {
  analysis: Analysis;
  onClick?: () => void;
  isLocked?: boolean;
}

function AnalysisItem({ analysis, onClick, isLocked = false }: AnalysisItemProps) {
  const statusConfig = {
    completed: {
      icon: <CheckCircleIcon className="text-green-500" />,
      label: 'Completed',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    processing: {
      icon: <LoaderIcon className="text-blue-500" />,
      label: 'Processing',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    failed: {
      icon: <AlertCircleIcon className="text-red-500" />,
      label: 'Failed',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  };

  const status = statusConfig[analysis.status];

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700',
        'hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer',
        isLocked && 'opacity-50'
      )}
      onClick={isLocked ? undefined : onClick}
      data-testid="analysis-item"
      role="button"
      tabIndex={isLocked ? -1 : 0}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('p-2 rounded-lg', status.bgColor)}>
          {status.icon}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white truncate" data-testid="analysis-title">
            {analysis.title || analysis.url}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
            {analysis.url}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4 ml-4">
        {analysis.status === 'completed' && (
          <div className="text-right">
            <p className="text-lg font-bold text-gray-900 dark:text-white" data-testid="analysis-score">
              {analysis.score}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Score</p>
          </div>
        )}
        <ExternalLinkIcon className="text-gray-400" />
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
}

function QuickAction({ icon, label, description, onClick, disabled, badge }: QuickActionProps) {
  return (
    <button
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700',
        'text-left transition-all w-full',
        disabled
          ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50'
          : 'hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      data-testid="quick-action"
    >
      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          {badge && (
            <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
              {badge}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </button>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function UserDashboard({
  data,
  onRunAnalysis,
  onViewHistory,
  onUpgrade,
  onAnalysisClick,
  className,
}: UserDashboardProps) {
  const { user, usage, recentAnalyses, savedUrls } = data;
  const planConfig = PLAN_LIMITS[user.plan];

  // Calculate usage stats
  const analysesUsed = usage.analysesThisMonth;
  const analysesLimit = planConfig.analysesPerMonth;
  const analysesRemaining = analysesLimit - analysesUsed;

  // Get upgrade trigger if applicable
  const upgradeTrigger = useMemo(
    () => getUpgradeTrigger(user.plan, usage, 'dashboard'),
    [user.plan, usage]
  );

  // Check if user is on free plan
  const isFreePlan = user.plan === 'free';

  // Calculate average score
  const completedAnalyses = recentAnalyses.filter(a => a.status === 'completed');
  const avgScore = completedAnalyses.length > 0
    ? Math.round(completedAnalyses.reduce((sum, a) => sum + a.score, 0) / completedAnalyses.length)
    : 0;

  return (
    <div className={cn('space-y-6', className)} data-testid="user-dashboard">
      {/* Welcome Header */}
      <div className="flex items-center justify-between" data-testid="dashboard-header">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back{user.name ? `, ${user.name}` : ''}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {planConfig.name} Plan
            {isFreePlan && ' - Upgrade for more features'}
          </p>
        </div>
        <button
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            'bg-blue-600 hover:bg-blue-700 text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
          onClick={onRunAnalysis}
          data-testid="new-analysis-btn"
        >
          <PlusIcon className="w-4 h-4" />
          New Analysis
        </button>
      </div>

      {/* Upgrade Banner (for free users approaching limit) */}
      {upgradeTrigger && upgradeTrigger.urgency === 'high' && (
        <UpgradePrompt
          trigger={upgradeTrigger}
          variant="banner"
          position="top"
          onCtaClick={() => onUpgrade?.(upgradeTrigger.recommendedPlan)}
          dismissible
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="stats-grid">
        <StatCard
          label="Analyses This Month"
          value={`${analysesUsed}/${analysesLimit}`}
          icon={<AnalysisIcon />}
        />
        <StatCard
          label="Remaining"
          value={analysesRemaining}
          icon={<RocketIcon />}
          trend={analysesRemaining <= 2 ? { value: -Math.round((analysesUsed / analysesLimit) * 100), isPositive: false } : undefined}
        />
        <StatCard
          label="Average Score"
          value={avgScore || '-'}
          icon={<CheckCircleIcon />}
          trend={avgScore >= 70 ? { value: avgScore - 50, isPositive: true } : undefined}
        />
        <StatCard
          label="Saved URLs"
          value={savedUrls.length}
          icon={<ExternalLinkIcon className="w-5 h-5" />}
        />
      </div>

      {/* Usage Progress */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="usage-section">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Usage
        </h2>
        <UsageProgress
          used={analysesUsed}
          limit={analysesLimit}
          label="Analyses"
          showPercent
          warningThreshold={70}
          dangerThreshold={90}
          showUpgradeCta={isFreePlan}
          onUpgradeClick={() => onUpgrade?.('starter')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="recent-analyses">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Analyses
            </h2>
            <button
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={onViewHistory}
              data-testid="view-history-btn"
            >
              View all
            </button>
          </div>

          {recentAnalyses.length === 0 ? (
            <EmptyAnalyses onRunAnalysis={onRunAnalysis} />
          ) : (
            <div className="space-y-3">
              {recentAnalyses.slice(0, 5).map((analysis, index) => (
                <AnalysisItem
                  key={analysis.id}
                  analysis={analysis}
                  onClick={() => onAnalysisClick?.(analysis.id)}
                  isLocked={isFreePlan && index >= 3}
                />
              ))}

              {/* Show locked preview for free users */}
              {isFreePlan && recentAnalyses.length > 3 && (
                <BlurredContent
                  isLocked={true}
                  lockTitle={`${recentAnalyses.length - 3} more analyses`}
                  lockDescription="Upgrade to access your full history"
                  ctaText="Upgrade to Starter"
                  onCtaClick={() => onUpgrade?.('starter')}
                  blurIntensity="sm"
                >
                  <div className="space-y-3">
                    {recentAnalyses.slice(3, 5).map(analysis => (
                      <AnalysisItem
                        key={analysis.id}
                        analysis={analysis}
                        isLocked
                      />
                    ))}
                  </div>
                </BlurredContent>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="quick-actions">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <QuickAction
              icon={<PlusIcon />}
              label="New Analysis"
              description="Analyze any URL for SEO"
              onClick={onRunAnalysis}
            />
            <QuickAction
              icon={<ClockIcon />}
              label="View History"
              description="See all past analyses"
              onClick={onViewHistory}
              badge={isFreePlan ? 'Limited' : undefined}
            />
            <QuickAction
              icon={<RocketIcon />}
              label={isFreePlan ? 'Upgrade Plan' : 'Manage Plan'}
              description={isFreePlan ? `Get ${PLAN_LIMITS.starter.analysesPerMonth} analyses/month` : 'View billing and usage'}
              onClick={() => onUpgrade?.(isFreePlan ? 'starter' : user.plan)}
            />
          </div>
        </div>
      </div>

      {/* Plan Comparison (for free users) */}
      {isFreePlan && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6" data-testid="plan-comparison">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Unlock More with Starter
              </h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {PLAN_LIMITS.starter.analysesPerMonth} analyses per month
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  {PLAN_LIMITS.starter.historyDays} days of history
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  Compare {PLAN_LIMITS.starter.competitorsVisible} competitors
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  Export reports
                </li>
              </ul>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatPrice(PLAN_LIMITS.starter.priceMonthly)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">/month</p>
              <button
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors',
                  'bg-blue-600 hover:bg-blue-700 text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
                onClick={() => onUpgrade?.('starter')}
                data-testid="upgrade-starter-btn"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ================================================================
// EMPTY STATE
// ================================================================

interface EmptyAnalysesProps {
  onRunAnalysis?: () => void;
}

function EmptyAnalyses({ onRunAnalysis }: EmptyAnalysesProps) {
  return (
    <div className="text-center py-8" data-testid="empty-analyses">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
        <AnalysisIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        No analyses yet
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        Run your first analysis to see results here
      </p>
      <button
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
          'bg-blue-600 hover:bg-blue-700 text-white',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        )}
        onClick={onRunAnalysis}
        data-testid="empty-run-analysis-btn"
      >
        <PlusIcon className="w-4 h-4" />
        Run Analysis
      </button>
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default UserDashboard;
