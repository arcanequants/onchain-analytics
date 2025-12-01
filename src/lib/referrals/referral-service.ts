/**
 * Referral Service
 *
 * Business logic for referral code generation, tracking, and rewards
 *
 * Phase 2, Week 7, Day 2
 */

import {
  type ReferralCode,
  type ReferralCodeCreate,
  type Referral,
  type ReferralStatus,
  type ReferralReward,
  type RewardType,
  type UserReferralStats,
  type Invite,
  type InviteCreate,
  type ReferralLink,
  type RewardTier,
  REWARD_TIERS,
  REFERRAL_CODE_LENGTH,
  DEFAULT_CODE_EXPIRY_DAYS,
  MAX_INVITES_PER_DAY,
  REFERRAL_CONVERSION_DAYS,
  REFERRED_USER_REWARDS,
} from './types';

// ================================================================
// CODE GENERATION
// ================================================================

/**
 * Generate a unique referral code
 */
export function generateReferralCode(length: number = REFERRAL_CODE_LENGTH): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (I, O, 0, 1)
  let code = '';
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Validate referral code format
 */
export function isValidCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const cleanCode = code.toUpperCase().trim();
  // Allow A-Z and 0-9, but codes are generated without confusing chars
  return /^[A-Z0-9]{6,12}$/.test(cleanCode);
}

/**
 * Normalize referral code (uppercase, trimmed)
 */
export function normalizeCode(code: string): string {
  return code.toUpperCase().trim();
}

// ================================================================
// MOCK DATA STORE (Replace with database in production)
// ================================================================

const mockReferralCodes: Map<string, ReferralCode> = new Map();
const mockReferrals: Referral[] = [];
const mockRewards: ReferralReward[] = [];
const mockInvites: Invite[] = [];

// Initialize some test data
function initMockData() {
  const testCode: ReferralCode = {
    code: 'TEST1234',
    userId: 'user-1',
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    maxUses: null,
    usageCount: 3,
    isActive: true,
  };
  mockReferralCodes.set('TEST1234', testCode);

  // Add some referrals
  mockReferrals.push(
    {
      id: 'ref-1',
      referrerUserId: 'user-1',
      referredUserId: 'user-2',
      referralCode: 'TEST1234',
      status: 'converted',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      convertedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rewardsClaimed: true,
    },
    {
      id: 'ref-2',
      referrerUserId: 'user-1',
      referredUserId: 'user-3',
      referralCode: 'TEST1234',
      status: 'converted',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      convertedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rewardsClaimed: true,
    },
    {
      id: 'ref-3',
      referrerUserId: 'user-1',
      referredUserId: 'user-4',
      referralCode: 'TEST1234',
      status: 'pending',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      convertedAt: null,
      rewardsClaimed: false,
    }
  );
}

initMockData();

// ================================================================
// REFERRAL CODE MANAGEMENT
// ================================================================

/**
 * Create a new referral code for a user
 */
export async function createReferralCode(
  data: ReferralCodeCreate
): Promise<ReferralCode> {
  const code = generateReferralCode();

  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + DEFAULT_CODE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const referralCode: ReferralCode = {
    code,
    userId: data.userId,
    createdAt: new Date(),
    expiresAt,
    maxUses: data.maxUses || null,
    usageCount: 0,
    isActive: true,
  };

  mockReferralCodes.set(code, referralCode);
  return referralCode;
}

/**
 * Get referral code by code string
 */
export async function getReferralCode(code: string): Promise<ReferralCode | null> {
  const normalized = normalizeCode(code);
  return mockReferralCodes.get(normalized) || null;
}

/**
 * Get user's active referral code
 */
export async function getUserReferralCode(userId: string): Promise<ReferralCode | null> {
  for (const [, code] of mockReferralCodes) {
    if (code.userId === userId && code.isActive) {
      return code;
    }
  }
  return null;
}

/**
 * Validate if a referral code can be used
 */
export async function validateReferralCode(
  code: string,
  referredUserId: string
): Promise<{ valid: boolean; error?: string }> {
  const referralCode = await getReferralCode(code);

  if (!referralCode) {
    return { valid: false, error: 'Invalid referral code' };
  }

  if (!referralCode.isActive) {
    return { valid: false, error: 'Referral code is no longer active' };
  }

  if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
    return { valid: false, error: 'Referral code has expired' };
  }

  if (referralCode.maxUses && referralCode.usageCount >= referralCode.maxUses) {
    return { valid: false, error: 'Referral code has reached maximum uses' };
  }

  // Check if user is trying to use their own code
  if (referralCode.userId === referredUserId) {
    return { valid: false, error: 'Cannot use your own referral code' };
  }

  // Check if user has already been referred
  const existingReferral = mockReferrals.find(
    (r) => r.referredUserId === referredUserId
  );
  if (existingReferral) {
    return { valid: false, error: 'User has already been referred' };
  }

  return { valid: true };
}

/**
 * Deactivate a referral code
 */
export async function deactivateReferralCode(code: string): Promise<boolean> {
  const referralCode = await getReferralCode(code);
  if (!referralCode) return false;

  referralCode.isActive = false;
  mockReferralCodes.set(referralCode.code, referralCode);
  return true;
}

// ================================================================
// REFERRAL TRACKING
// ================================================================

/**
 * Record a new referral when a user signs up with a code
 */
export async function recordReferral(
  code: string,
  referredUserId: string
): Promise<Referral | null> {
  const validation = await validateReferralCode(code, referredUserId);
  if (!validation.valid) return null;

  const referralCode = await getReferralCode(code);
  if (!referralCode) return null;

  const referral: Referral = {
    id: `ref-${Date.now()}`,
    referrerUserId: referralCode.userId,
    referredUserId,
    referralCode: referralCode.code,
    status: 'pending',
    createdAt: new Date(),
    convertedAt: null,
    rewardsClaimed: false,
  };

  mockReferrals.push(referral);

  // Increment usage count
  referralCode.usageCount++;
  mockReferralCodes.set(referralCode.code, referralCode);

  return referral;
}

/**
 * Convert a referral (user completed required action)
 */
export async function convertReferral(referralId: string): Promise<Referral | null> {
  const referral = mockReferrals.find((r) => r.id === referralId);
  if (!referral || referral.status !== 'pending') return null;

  referral.status = 'converted';
  referral.convertedAt = new Date();

  // Create rewards for both referrer and referred
  await createReferralRewards(referral);

  return referral;
}

/**
 * Get referral by ID
 */
export async function getReferral(referralId: string): Promise<Referral | null> {
  return mockReferrals.find((r) => r.id === referralId) || null;
}

/**
 * Get user's referrals (as referrer)
 */
export async function getUserReferrals(userId: string): Promise<Referral[]> {
  return mockReferrals.filter((r) => r.referrerUserId === userId);
}

/**
 * Check if user was referred
 */
export async function getUserReferrer(userId: string): Promise<Referral | null> {
  return mockReferrals.find((r) => r.referredUserId === userId) || null;
}

// ================================================================
// REWARDS
// ================================================================

/**
 * Create rewards for a converted referral
 */
async function createReferralRewards(referral: Referral): Promise<void> {
  const referrerReferrals = await getUserReferrals(referral.referrerUserId);
  const convertedCount = referrerReferrals.filter(
    (r) => r.status === 'converted' || r.status === 'rewarded'
  ).length;

  // Find applicable tier
  const tier = getCurrentTier(convertedCount);

  // Reward for referrer based on tier
  for (const reward of tier.rewards) {
    const referrerReward: ReferralReward = {
      id: `reward-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      userId: referral.referrerUserId,
      referralId: referral.id,
      type: reward.type,
      amount: reward.amount,
      status: 'available',
      createdAt: new Date(),
      claimedAt: null,
    };
    mockRewards.push(referrerReward);
  }

  // Reward for referred user
  const referredCreditsReward: ReferralReward = {
    id: `reward-${Date.now()}-referred-credits`,
    userId: referral.referredUserId,
    referralId: referral.id,
    type: 'credits',
    amount: REFERRED_USER_REWARDS.credits,
    status: 'available',
    createdAt: new Date(),
    claimedAt: null,
  };
  mockRewards.push(referredCreditsReward);

  const referredPremiumReward: ReferralReward = {
    id: `reward-${Date.now()}-referred-premium`,
    userId: referral.referredUserId,
    referralId: referral.id,
    type: 'premium_days',
    amount: REFERRED_USER_REWARDS.premiumDays,
    status: 'available',
    createdAt: new Date(),
    claimedAt: null,
  };
  mockRewards.push(referredPremiumReward);
}

/**
 * Get current tier based on referral count
 */
export function getCurrentTier(convertedReferrals: number): RewardTier {
  // Find the highest tier the user has reached
  let currentTier = REWARD_TIERS[0];
  for (const tier of REWARD_TIERS) {
    if (convertedReferrals >= tier.requiredReferrals) {
      currentTier = tier;
    }
  }
  return currentTier;
}

/**
 * Get next tier
 */
export function getNextTier(convertedReferrals: number): RewardTier | null {
  for (const tier of REWARD_TIERS) {
    if (convertedReferrals < tier.requiredReferrals) {
      return tier;
    }
  }
  return null;
}

/**
 * Get user's available rewards
 */
export async function getUserRewards(userId: string): Promise<ReferralReward[]> {
  return mockRewards.filter(
    (r) => r.userId === userId && r.status === 'available'
  );
}

/**
 * Claim a reward
 */
export async function claimReward(rewardId: string, userId: string): Promise<ReferralReward | null> {
  const reward = mockRewards.find(
    (r) => r.id === rewardId && r.userId === userId
  );
  if (!reward || reward.status !== 'available') return null;

  reward.status = 'claimed';
  reward.claimedAt = new Date();

  return reward;
}

/**
 * Claim all available rewards for a user
 */
export async function claimAllRewards(userId: string): Promise<ReferralReward[]> {
  const available = await getUserRewards(userId);
  const claimed: ReferralReward[] = [];

  for (const reward of available) {
    const claimedReward = await claimReward(reward.id, userId);
    if (claimedReward) {
      claimed.push(claimedReward);
    }
  }

  return claimed;
}

// ================================================================
// USER STATS
// ================================================================

/**
 * Get user's referral statistics
 */
export async function getUserReferralStats(userId: string): Promise<UserReferralStats> {
  let referralCode = await getUserReferralCode(userId);

  // Create a code if user doesn't have one
  if (!referralCode) {
    referralCode = await createReferralCode({ userId });
  }

  const referrals = await getUserReferrals(userId);
  const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
  const convertedReferrals = referrals.filter(
    (r) => r.status === 'converted' || r.status === 'rewarded'
  ).length;

  const currentTier = getCurrentTier(convertedReferrals);
  const nextTier = getNextTier(convertedReferrals);
  const referralsToNextTier = nextTier
    ? nextTier.requiredReferrals - convertedReferrals
    : 0;

  // Calculate total rewards earned
  const userRewards = mockRewards.filter((r) => r.userId === userId);
  const totalCreditsEarned = userRewards
    .filter((r) => r.type === 'credits')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalPremiumDaysEarned = userRewards
    .filter((r) => r.type === 'premium_days')
    .reduce((sum, r) => sum + r.amount, 0);

  const availableRewards = await getUserRewards(userId);

  return {
    userId,
    referralCode: referralCode.code,
    totalReferrals: referrals.length,
    pendingReferrals,
    convertedReferrals,
    currentTier,
    nextTier,
    referralsToNextTier,
    totalCreditsEarned,
    totalPremiumDaysEarned,
    availableRewards,
  };
}

// ================================================================
// INVITES
// ================================================================

/**
 * Send an invite email
 */
export async function sendInvite(data: InviteCreate): Promise<Invite | null> {
  // Check daily limit
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayInvites = mockInvites.filter(
    (i) => i.referrerUserId === data.referrerUserId && i.sentAt >= today
  );

  if (todayInvites.length >= MAX_INVITES_PER_DAY) {
    return null;
  }

  // Check if email already invited by this user
  const existingInvite = mockInvites.find(
    (i) => i.referrerUserId === data.referrerUserId && i.email === data.email
  );
  if (existingInvite) {
    return null;
  }

  // Get user's referral code
  let referralCode = await getUserReferralCode(data.referrerUserId);
  if (!referralCode) {
    referralCode = await createReferralCode({ userId: data.referrerUserId });
  }

  const invite: Invite = {
    id: `invite-${Date.now()}`,
    referrerUserId: data.referrerUserId,
    email: data.email,
    referralCode: referralCode.code,
    status: 'sent',
    sentAt: new Date(),
    openedAt: null,
    signedUpAt: null,
    message: data.message,
  };

  mockInvites.push(invite);

  // In production, send actual email here
  // await sendInviteEmail(invite);

  return invite;
}

/**
 * Get user's sent invites
 */
export async function getUserInvites(userId: string): Promise<Invite[]> {
  return mockInvites.filter((i) => i.referrerUserId === userId);
}

/**
 * Mark invite as opened
 */
export async function markInviteOpened(inviteId: string): Promise<Invite | null> {
  const invite = mockInvites.find((i) => i.id === inviteId);
  if (!invite) return null;

  invite.status = 'opened';
  invite.openedAt = new Date();
  return invite;
}

/**
 * Mark invite as signed up
 */
export async function markInviteSignedUp(inviteId: string): Promise<Invite | null> {
  const invite = mockInvites.find((i) => i.id === inviteId);
  if (!invite) return null;

  invite.status = 'signed_up';
  invite.signedUpAt = new Date();
  return invite;
}

// ================================================================
// REFERRAL LINKS
// ================================================================

/**
 * Generate referral link for a user
 */
export async function generateReferralLink(
  userId: string,
  baseUrl: string = 'https://app.example.com'
): Promise<ReferralLink> {
  let referralCode = await getUserReferralCode(userId);

  if (!referralCode) {
    referralCode = await createReferralCode({ userId });
  }

  const url = `${baseUrl}/signup?ref=${referralCode.code}`;

  return {
    url,
    code: referralCode.code,
    // In production, generate actual short URL and QR code
    shortUrl: undefined,
    qrCodeUrl: undefined,
  };
}

/**
 * Parse referral code from URL
 */
export function parseReferralCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('ref');
  } catch {
    return null;
  }
}

// ================================================================
// CLEANUP
// ================================================================

/**
 * Expire old pending referrals
 */
export async function expireOldReferrals(): Promise<number> {
  const expiryDate = new Date(
    Date.now() - REFERRAL_CONVERSION_DAYS * 24 * 60 * 60 * 1000
  );

  let expiredCount = 0;
  for (const referral of mockReferrals) {
    if (
      referral.status === 'pending' &&
      referral.createdAt < expiryDate
    ) {
      referral.status = 'expired';
      expiredCount++;
    }
  }

  return expiredCount;
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateReferralCode,
  isValidCodeFormat,
  normalizeCode,
  createReferralCode,
  getReferralCode,
  getUserReferralCode,
  validateReferralCode,
  deactivateReferralCode,
  recordReferral,
  convertReferral,
  getReferral,
  getUserReferrals,
  getUserReferrer,
  getCurrentTier,
  getNextTier,
  getUserRewards,
  claimReward,
  claimAllRewards,
  getUserReferralStats,
  sendInvite,
  getUserInvites,
  markInviteOpened,
  markInviteSignedUp,
  generateReferralLink,
  parseReferralCodeFromUrl,
  expireOldReferrals,
};
