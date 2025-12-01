/**
 * Referral System Types
 *
 * Type definitions for the referral and invite system
 *
 * Phase 2, Week 7, Day 2
 */

// ================================================================
// REFERRAL CODES
// ================================================================

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date | null;
  maxUses: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface ReferralCodeCreate {
  userId: string;
  expiresInDays?: number;
  maxUses?: number;
}

// ================================================================
// REFERRALS
// ================================================================

export interface Referral {
  id: string;
  referrerUserId: string;
  referredUserId: string;
  referralCode: string;
  status: ReferralStatus;
  createdAt: Date;
  convertedAt: Date | null;
  rewardsClaimed: boolean;
}

export type ReferralStatus =
  | 'pending'      // User signed up but hasn't completed action
  | 'converted'    // User completed required action
  | 'rewarded'     // Rewards distributed
  | 'expired'      // Referral expired without conversion
  | 'invalid';     // Invalid/fraudulent referral

// ================================================================
// REWARDS
// ================================================================

export interface ReferralReward {
  id: string;
  userId: string;
  referralId: string;
  type: RewardType;
  amount: number;
  status: RewardStatus;
  createdAt: Date;
  claimedAt: Date | null;
}

export type RewardType =
  | 'credits'          // API credits
  | 'premium_days'     // Premium subscription days
  | 'discount_percent' // Discount on subscription
  | 'badge';           // Special badge/achievement

export type RewardStatus =
  | 'pending'
  | 'available'
  | 'claimed'
  | 'expired';

// ================================================================
// REWARD TIERS
// ================================================================

export interface RewardTier {
  level: number;
  requiredReferrals: number;
  rewards: TierReward[];
  name: string;
  description: string;
}

export interface TierReward {
  type: RewardType;
  amount: number;
}

export const REWARD_TIERS: RewardTier[] = [
  {
    level: 1,
    requiredReferrals: 1,
    name: 'Starter',
    description: 'Invite your first friend',
    rewards: [
      { type: 'credits', amount: 100 },
    ],
  },
  {
    level: 2,
    requiredReferrals: 3,
    name: 'Connector',
    description: 'Build your network',
    rewards: [
      { type: 'credits', amount: 300 },
      { type: 'premium_days', amount: 7 },
    ],
  },
  {
    level: 3,
    requiredReferrals: 5,
    name: 'Influencer',
    description: 'Growing your influence',
    rewards: [
      { type: 'credits', amount: 500 },
      { type: 'premium_days', amount: 14 },
      { type: 'badge', amount: 1 },
    ],
  },
  {
    level: 4,
    requiredReferrals: 10,
    name: 'Ambassador',
    description: 'Become an ambassador',
    rewards: [
      { type: 'credits', amount: 1000 },
      { type: 'premium_days', amount: 30 },
      { type: 'discount_percent', amount: 20 },
    ],
  },
  {
    level: 5,
    requiredReferrals: 25,
    name: 'Champion',
    description: 'Elite referrer status',
    rewards: [
      { type: 'credits', amount: 2500 },
      { type: 'premium_days', amount: 90 },
      { type: 'discount_percent', amount: 50 },
      { type: 'badge', amount: 1 },
    ],
  },
];

// ================================================================
// USER REFERRAL STATS
// ================================================================

export interface UserReferralStats {
  userId: string;
  referralCode: string;
  totalReferrals: number;
  pendingReferrals: number;
  convertedReferrals: number;
  currentTier: RewardTier;
  nextTier: RewardTier | null;
  referralsToNextTier: number;
  totalCreditsEarned: number;
  totalPremiumDaysEarned: number;
  availableRewards: ReferralReward[];
}

// ================================================================
// INVITE
// ================================================================

export interface Invite {
  id: string;
  referrerUserId: string;
  email: string;
  referralCode: string;
  status: InviteStatus;
  sentAt: Date;
  openedAt: Date | null;
  signedUpAt: Date | null;
  message?: string;
}

export type InviteStatus =
  | 'sent'
  | 'opened'
  | 'signed_up'
  | 'expired'
  | 'bounced';

export interface InviteCreate {
  referrerUserId: string;
  email: string;
  message?: string;
}

// ================================================================
// REFERRAL LINK
// ================================================================

export interface ReferralLink {
  url: string;
  code: string;
  shortUrl?: string;
  qrCodeUrl?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

export const REFERRAL_CODE_LENGTH = 8;
export const DEFAULT_CODE_EXPIRY_DAYS = 365;
export const MAX_INVITES_PER_DAY = 10;
export const REFERRAL_CONVERSION_DAYS = 30; // Days to convert before expiring

// Reward amounts for referred users (they also get benefits)
export const REFERRED_USER_REWARDS = {
  credits: 50,
  premiumDays: 3,
};
