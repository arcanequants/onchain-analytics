/**
 * Referral Dashboard Component
 *
 * Display user's referral stats, code, and invite friends functionality
 *
 * Phase 2, Week 7, Day 2
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type {
  UserReferralStats,
  RewardTier,
  ReferralReward,
} from '@/lib/referrals';

// ================================================================
// TYPES
// ================================================================

export interface ReferralDashboardProps {
  stats: UserReferralStats;
  baseUrl: string;
  isLoading?: boolean;
  onSendInvite?: (email: string, message?: string) => Promise<boolean>;
  onClaimRewards?: () => Promise<void>;
  className?: string;
}

// ================================================================
// ICONS
// ================================================================

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// ================================================================
// SUB-COMPONENTS
// ================================================================

function TierProgress({
  currentTier,
  nextTier,
  convertedReferrals,
  referralsToNextTier,
}: {
  currentTier: RewardTier;
  nextTier: RewardTier | null;
  convertedReferrals: number;
  referralsToNextTier: number;
}) {
  const progress = nextTier
    ? ((convertedReferrals - currentTier.requiredReferrals) /
        (nextTier.requiredReferrals - currentTier.requiredReferrals)) *
      100
    : 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold">
            {currentTier.level}
          </span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">
              {currentTier.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentTier.description}
            </p>
          </div>
        </div>
        {nextTier && (
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Next: {nextTier.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {referralsToNextTier} more referral{referralsToNextTier !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {nextTier && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ReferralCodeCard({
  code,
  baseUrl,
}: {
  code: string;
  baseUrl: string;
}) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const referralLink = `${baseUrl}/signup?ref=${code}`;

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        Your Referral Code
      </p>
      <div className="flex items-center gap-3 mb-4">
        <code className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
          {code}
        </code>
        <button
          onClick={() => handleCopy(code, 'code')}
          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
          aria-label={copied === 'code' ? 'Copied!' : 'Copy code'}
        >
          {copied === 'code' ? (
            <CheckIcon className="w-5 h-5 text-green-600" />
          ) : (
            <CopyIcon className="w-5 h-5 text-gray-500" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={referralLink}
          readOnly
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg truncate"
        />
        <button
          onClick={() => handleCopy(referralLink, 'link')}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            copied === 'link'
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {copied === 'link' ? 'Copied!' : 'Copy Link'}
        </button>
      </div>
    </div>
  );
}

function StatsGrid({
  totalReferrals,
  convertedReferrals,
  pendingReferrals,
  totalCreditsEarned,
}: {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <UsersIcon className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {totalReferrals}
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <CheckIcon className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Converted</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {convertedReferrals}
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Pending</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {pendingReferrals}
        </p>
      </div>

      <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <StarIcon className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Credits</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {totalCreditsEarned}
        </p>
      </div>
    </div>
  );
}

function RewardsSection({
  availableRewards,
  onClaimRewards,
}: {
  availableRewards: ReferralReward[];
  onClaimRewards?: () => Promise<void>;
}) {
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaim = async () => {
    if (!onClaimRewards) return;
    setIsClaiming(true);
    try {
      await onClaimRewards();
    } finally {
      setIsClaiming(false);
    }
  };

  if (availableRewards.length === 0) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-center">
        <GiftIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 dark:text-gray-400">
          No rewards available yet. Invite friends to earn rewards!
        </p>
      </div>
    );
  }

  const rewardLabels: Record<string, string> = {
    credits: 'Credits',
    premium_days: 'Premium Days',
    discount_percent: '% Discount',
    badge: 'Special Badge',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Available Rewards ({availableRewards.length})
        </h3>
        <button
          onClick={handleClaim}
          disabled={isClaiming}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
        >
          {isClaiming ? 'Claiming...' : 'Claim All'}
        </button>
      </div>

      <div className="grid gap-3">
        {availableRewards.map((reward) => (
          <div
            key={reward.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <GiftIcon className="w-6 h-6 text-amber-500" />
              <span className="font-medium text-gray-900 dark:text-white">
                {reward.amount} {rewardLabels[reward.type]}
              </span>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">
              Ready to claim
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteForm({
  onSendInvite,
}: {
  onSendInvite?: (email: string, message?: string) => Promise<boolean>;
}) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSendInvite || !email) return;

    setIsSending(true);
    setStatus('idle');

    try {
      const success = await onSendInvite(email, message || undefined);
      if (success) {
        setStatus('success');
        setEmail('');
        setMessage('');
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Friend&apos;s Email
        </label>
        <input
          id="invite-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="friend@example.com"
          required
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400"
        />
      </div>

      <div>
        <label htmlFor="invite-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Personal Message (optional)
        </label>
        <textarea
          id="invite-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hey! Check out this awesome tool..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSending || !email}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-4 py-3 font-medium rounded-lg transition-all',
          status === 'success'
            ? 'bg-green-500 text-white'
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
        )}
      >
        <MailIcon className="w-5 h-5" />
        {isSending
          ? 'Sending...'
          : status === 'success'
          ? 'Invite Sent!'
          : status === 'error'
          ? 'Failed to Send'
          : 'Send Invite'}
      </button>
    </form>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function ReferralDashboard({
  stats,
  baseUrl,
  isLoading = false,
  onSendInvite,
  onClaimRewards,
  className,
}: ReferralDashboardProps) {
  if (isLoading) {
    return (
      <div className={cn('p-8 text-center', className)} data-testid="referral-dashboard">
        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-gray-500">Loading referral data...</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)} data-testid="referral-dashboard">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Invite Friends, Earn Rewards
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Share your referral link and earn credits for each friend who signs up
        </p>
      </div>

      {/* Tier Progress */}
      <TierProgress
        currentTier={stats.currentTier}
        nextTier={stats.nextTier}
        convertedReferrals={stats.convertedReferrals}
        referralsToNextTier={stats.referralsToNextTier}
      />

      {/* Referral Code */}
      <ReferralCodeCard code={stats.referralCode} baseUrl={baseUrl} />

      {/* Stats Grid */}
      <StatsGrid
        totalReferrals={stats.totalReferrals}
        convertedReferrals={stats.convertedReferrals}
        pendingReferrals={stats.pendingReferrals}
        totalCreditsEarned={stats.totalCreditsEarned}
      />

      {/* Rewards */}
      <RewardsSection
        availableRewards={stats.availableRewards}
        onClaimRewards={onClaimRewards}
      />

      {/* Invite Form */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invite a Friend
        </h3>
        <InviteForm onSendInvite={onSendInvite} />
      </div>
    </div>
  );
}

export default ReferralDashboard;
