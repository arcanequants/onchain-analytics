/**
 * Referral Service Tests
 *
 * Phase 2, Week 7, Day 2
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
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
} from './referral-service';
import { REWARD_TIERS } from './types';

// ================================================================
// CODE GENERATION TESTS
// ================================================================

describe('generateReferralCode', () => {
  it('should generate a code with default length', () => {
    const code = generateReferralCode();
    expect(code.length).toBe(8);
  });

  it('should generate a code with custom length', () => {
    const code = generateReferralCode(12);
    expect(code.length).toBe(12);
  });

  it('should only use valid characters', () => {
    const code = generateReferralCode();
    expect(/^[A-Z2-9]+$/.test(code)).toBe(true);
  });

  it('should not include confusing characters', () => {
    // Generate multiple codes to increase chance of catching issues
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode();
      expect(code).not.toContain('I');
      expect(code).not.toContain('O');
      expect(code).not.toContain('0');
      expect(code).not.toContain('1');
    }
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateReferralCode());
    }
    expect(codes.size).toBe(100);
  });
});

describe('isValidCodeFormat', () => {
  it('should accept valid codes', () => {
    expect(isValidCodeFormat('ABCD1234')).toBe(true);
    expect(isValidCodeFormat('TEST5678')).toBe(true);
    expect(isValidCodeFormat('ABCDEF')).toBe(true);
  });

  it('should reject short codes', () => {
    expect(isValidCodeFormat('ABC')).toBe(false);
    expect(isValidCodeFormat('AB')).toBe(false);
  });

  it('should reject codes with invalid characters', () => {
    expect(isValidCodeFormat('ABC-123')).toBe(false);
    expect(isValidCodeFormat('ABC_123')).toBe(false);
    expect(isValidCodeFormat('ABC 123')).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(isValidCodeFormat('abcd1234')).toBe(true);
    expect(isValidCodeFormat('AbCd1234')).toBe(true);
  });

  it('should reject null/undefined', () => {
    expect(isValidCodeFormat(null as unknown as string)).toBe(false);
    expect(isValidCodeFormat(undefined as unknown as string)).toBe(false);
    expect(isValidCodeFormat('')).toBe(false);
  });
});

describe('normalizeCode', () => {
  it('should convert to uppercase', () => {
    expect(normalizeCode('abcd1234')).toBe('ABCD1234');
  });

  it('should trim whitespace', () => {
    expect(normalizeCode('  ABCD1234  ')).toBe('ABCD1234');
  });

  it('should handle mixed case with whitespace', () => {
    expect(normalizeCode(' AbCd1234 ')).toBe('ABCD1234');
  });
});

// ================================================================
// REFERRAL CODE MANAGEMENT TESTS
// ================================================================

describe('createReferralCode', () => {
  it('should create a referral code for a user', async () => {
    const code = await createReferralCode({ userId: 'new-user-1' });

    expect(code.userId).toBe('new-user-1');
    expect(code.code.length).toBe(8);
    expect(code.isActive).toBe(true);
    expect(code.usageCount).toBe(0);
  });

  it('should set expiry date', async () => {
    const code = await createReferralCode({
      userId: 'new-user-2',
      expiresInDays: 30,
    });

    const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    // Allow 1 second difference for test timing
    expect(code.expiresAt!.getTime()).toBeCloseTo(expectedExpiry.getTime(), -4);
  });

  it('should set max uses', async () => {
    const code = await createReferralCode({
      userId: 'new-user-3',
      maxUses: 5,
    });

    expect(code.maxUses).toBe(5);
  });
});

describe('getReferralCode', () => {
  it('should return existing code', async () => {
    const code = await getReferralCode('TEST1234');

    expect(code).not.toBeNull();
    expect(code?.code).toBe('TEST1234');
  });

  it('should return null for non-existent code', async () => {
    const code = await getReferralCode('NONEXISTENT');

    expect(code).toBeNull();
  });

  it('should be case insensitive', async () => {
    const code = await getReferralCode('test1234');

    expect(code).not.toBeNull();
    expect(code?.code).toBe('TEST1234');
  });
});

describe('getUserReferralCode', () => {
  it('should return user active code', async () => {
    const code = await getUserReferralCode('user-1');

    expect(code).not.toBeNull();
    expect(code?.userId).toBe('user-1');
  });

  it('should return null for user without code', async () => {
    const code = await getUserReferralCode('user-without-code');

    expect(code).toBeNull();
  });
});

describe('validateReferralCode', () => {
  it('should validate active code', async () => {
    const result = await validateReferralCode('TEST1234', 'new-referred-user');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid code', async () => {
    const result = await validateReferralCode('INVALID', 'new-referred-user');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid referral code');
  });

  it('should reject self-referral', async () => {
    const result = await validateReferralCode('TEST1234', 'user-1');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Cannot use your own referral code');
  });

  it('should reject already referred users', async () => {
    const result = await validateReferralCode('TEST1234', 'user-2');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('User has already been referred');
  });
});

describe('deactivateReferralCode', () => {
  it('should deactivate an active code', async () => {
    const code = await createReferralCode({ userId: 'deactivate-test-user' });
    const result = await deactivateReferralCode(code.code);

    expect(result).toBe(true);

    const deactivated = await getReferralCode(code.code);
    expect(deactivated?.isActive).toBe(false);
  });

  it('should return false for non-existent code', async () => {
    const result = await deactivateReferralCode('NONEXISTENT');

    expect(result).toBe(false);
  });
});

// ================================================================
// REFERRAL TRACKING TESTS
// ================================================================

describe('recordReferral', () => {
  it('should record a valid referral', async () => {
    const referral = await recordReferral('TEST1234', 'brand-new-user-1');

    expect(referral).not.toBeNull();
    expect(referral?.referrerUserId).toBe('user-1');
    expect(referral?.referredUserId).toBe('brand-new-user-1');
    expect(referral?.status).toBe('pending');
  });

  it('should return null for invalid code', async () => {
    const referral = await recordReferral('INVALID', 'brand-new-user-2');

    expect(referral).toBeNull();
  });

  it('should increment usage count', async () => {
    const beforeCode = await getReferralCode('TEST1234');
    const beforeCount = beforeCode!.usageCount;

    await recordReferral('TEST1234', 'brand-new-user-3');

    const afterCode = await getReferralCode('TEST1234');
    expect(afterCode!.usageCount).toBe(beforeCount + 1);
  });
});

describe('convertReferral', () => {
  it('should convert a pending referral', async () => {
    const referral = await recordReferral('TEST1234', 'convert-test-user');
    const converted = await convertReferral(referral!.id);

    expect(converted).not.toBeNull();
    expect(converted?.status).toBe('converted');
    expect(converted?.convertedAt).not.toBeNull();
  });

  it('should return null for non-existent referral', async () => {
    const converted = await convertReferral('non-existent-id');

    expect(converted).toBeNull();
  });
});

describe('getReferral', () => {
  it('should return existing referral', async () => {
    const referral = await getReferral('ref-1');

    expect(referral).not.toBeNull();
    expect(referral?.id).toBe('ref-1');
  });

  it('should return null for non-existent referral', async () => {
    const referral = await getReferral('non-existent');

    expect(referral).toBeNull();
  });
});

describe('getUserReferrals', () => {
  it('should return user referrals', async () => {
    const referrals = await getUserReferrals('user-1');

    expect(referrals.length).toBeGreaterThan(0);
    expect(referrals.every((r) => r.referrerUserId === 'user-1')).toBe(true);
  });

  it('should return empty array for user with no referrals', async () => {
    const referrals = await getUserReferrals('user-with-no-referrals');

    expect(referrals).toEqual([]);
  });
});

describe('getUserReferrer', () => {
  it('should return referrer for referred user', async () => {
    const referral = await getUserReferrer('user-2');

    expect(referral).not.toBeNull();
    expect(referral?.referrerUserId).toBe('user-1');
  });

  it('should return null for non-referred user', async () => {
    const referral = await getUserReferrer('user-1');

    expect(referral).toBeNull();
  });
});

// ================================================================
// TIER TESTS
// ================================================================

describe('getCurrentTier', () => {
  it('should return tier 1 for 1 referral', () => {
    const tier = getCurrentTier(1);
    expect(tier.level).toBe(1);
    expect(tier.name).toBe('Starter');
  });

  it('should return tier 2 for 3 referrals', () => {
    const tier = getCurrentTier(3);
    expect(tier.level).toBe(2);
    expect(tier.name).toBe('Connector');
  });

  it('should return tier 3 for 5 referrals', () => {
    const tier = getCurrentTier(5);
    expect(tier.level).toBe(3);
    expect(tier.name).toBe('Influencer');
  });

  it('should return tier 4 for 10 referrals', () => {
    const tier = getCurrentTier(10);
    expect(tier.level).toBe(4);
    expect(tier.name).toBe('Ambassador');
  });

  it('should return tier 5 for 25+ referrals', () => {
    const tier = getCurrentTier(25);
    expect(tier.level).toBe(5);
    expect(tier.name).toBe('Champion');
  });

  it('should return first tier for 0 referrals', () => {
    const tier = getCurrentTier(0);
    expect(tier.level).toBe(1);
  });
});

describe('getNextTier', () => {
  it('should return tier 2 for 1 referral', () => {
    const tier = getNextTier(1);
    expect(tier?.level).toBe(2);
  });

  it('should return tier 3 for 3 referrals', () => {
    const tier = getNextTier(3);
    expect(tier?.level).toBe(3);
  });

  it('should return null for max tier', () => {
    const tier = getNextTier(25);
    expect(tier).toBeNull();
  });

  it('should return tier 1 for 0 referrals', () => {
    const tier = getNextTier(0);
    expect(tier?.level).toBe(1);
  });
});

// ================================================================
// REWARDS TESTS
// ================================================================

describe('getUserRewards', () => {
  it('should return available rewards', async () => {
    // Convert a referral to generate rewards
    const referral = await recordReferral('TEST1234', 'reward-test-user');
    await convertReferral(referral!.id);

    const rewards = await getUserRewards('user-1');

    expect(Array.isArray(rewards)).toBe(true);
  });
});

describe('claimReward', () => {
  it('should claim an available reward', async () => {
    // Convert a referral to generate rewards
    const referral = await recordReferral('TEST1234', 'claim-test-user');
    await convertReferral(referral!.id);

    const rewards = await getUserRewards('user-1');
    if (rewards.length > 0) {
      const claimed = await claimReward(rewards[0].id, 'user-1');

      expect(claimed).not.toBeNull();
      expect(claimed?.status).toBe('claimed');
      expect(claimed?.claimedAt).not.toBeNull();
    }
  });

  it('should return null for non-existent reward', async () => {
    const claimed = await claimReward('non-existent', 'user-1');

    expect(claimed).toBeNull();
  });
});

describe('claimAllRewards', () => {
  it('should claim all available rewards', async () => {
    // Convert a referral to generate rewards
    const referral = await recordReferral('TEST1234', 'claim-all-test-user');
    await convertReferral(referral!.id);

    const claimed = await claimAllRewards('user-1');

    expect(Array.isArray(claimed)).toBe(true);
    expect(claimed.every((r) => r.status === 'claimed')).toBe(true);
  });
});

// ================================================================
// USER STATS TESTS
// ================================================================

describe('getUserReferralStats', () => {
  it('should return stats for user with referrals', async () => {
    const stats = await getUserReferralStats('user-1');

    expect(stats.userId).toBe('user-1');
    expect(stats.referralCode).toBe('TEST1234');
    expect(stats.totalReferrals).toBeGreaterThan(0);
    expect(stats.currentTier).toBeDefined();
    expect(stats.totalCreditsEarned).toBeGreaterThanOrEqual(0);
  });

  it('should create code for new user', async () => {
    const stats = await getUserReferralStats('brand-new-stats-user');

    expect(stats.referralCode).toBeDefined();
    expect(stats.referralCode.length).toBe(8);
    expect(stats.totalReferrals).toBe(0);
  });

  it('should calculate referrals to next tier', async () => {
    const stats = await getUserReferralStats('user-1');

    if (stats.nextTier) {
      expect(stats.referralsToNextTier).toBe(
        stats.nextTier.requiredReferrals - stats.convertedReferrals
      );
    } else {
      expect(stats.referralsToNextTier).toBe(0);
    }
  });
});

// ================================================================
// INVITE TESTS
// ================================================================

describe('sendInvite', () => {
  it('should send an invite', async () => {
    const invite = await sendInvite({
      referrerUserId: 'user-1',
      email: 'new-invite@example.com',
    });

    expect(invite).not.toBeNull();
    expect(invite?.email).toBe('new-invite@example.com');
    expect(invite?.status).toBe('sent');
  });

  it('should include custom message', async () => {
    const invite = await sendInvite({
      referrerUserId: 'user-1',
      email: 'message-invite@example.com',
      message: 'Check this out!',
    });

    expect(invite?.message).toBe('Check this out!');
  });

  it('should reject duplicate invites', async () => {
    await sendInvite({
      referrerUserId: 'user-1',
      email: 'duplicate@example.com',
    });

    const duplicate = await sendInvite({
      referrerUserId: 'user-1',
      email: 'duplicate@example.com',
    });

    expect(duplicate).toBeNull();
  });
});

describe('getUserInvites', () => {
  it('should return user invites', async () => {
    const invites = await getUserInvites('user-1');

    expect(Array.isArray(invites)).toBe(true);
  });
});

describe('markInviteOpened', () => {
  it('should mark invite as opened', async () => {
    const invite = await sendInvite({
      referrerUserId: 'user-1',
      email: 'open-test@example.com',
    });

    const opened = await markInviteOpened(invite!.id);

    expect(opened?.status).toBe('opened');
    expect(opened?.openedAt).not.toBeNull();
  });
});

describe('markInviteSignedUp', () => {
  it('should mark invite as signed up', async () => {
    const invite = await sendInvite({
      referrerUserId: 'user-1',
      email: 'signup-test@example.com',
    });

    const signedUp = await markInviteSignedUp(invite!.id);

    expect(signedUp?.status).toBe('signed_up');
    expect(signedUp?.signedUpAt).not.toBeNull();
  });
});

// ================================================================
// REFERRAL LINK TESTS
// ================================================================

describe('generateReferralLink', () => {
  it('should generate a referral link', async () => {
    const link = await generateReferralLink('user-1');

    expect(link.url).toContain('ref=TEST1234');
    expect(link.code).toBe('TEST1234');
  });

  it('should use custom base URL', async () => {
    const link = await generateReferralLink('user-1', 'https://custom.com');

    expect(link.url).toContain('https://custom.com');
  });

  it('should create code for user without one', async () => {
    const link = await generateReferralLink('link-new-user');

    expect(link.code).toBeDefined();
    expect(link.url).toContain(`ref=${link.code}`);
  });
});

describe('parseReferralCodeFromUrl', () => {
  it('should parse referral code from URL', () => {
    const code = parseReferralCodeFromUrl(
      'https://app.example.com/signup?ref=ABCD1234'
    );

    expect(code).toBe('ABCD1234');
  });

  it('should return null for URL without ref param', () => {
    const code = parseReferralCodeFromUrl('https://app.example.com/signup');

    expect(code).toBeNull();
  });

  it('should return null for invalid URL', () => {
    const code = parseReferralCodeFromUrl('not-a-url');

    expect(code).toBeNull();
  });
});

// ================================================================
// CLEANUP TESTS
// ================================================================

describe('expireOldReferrals', () => {
  it('should return count of expired referrals', async () => {
    const count = await expireOldReferrals();

    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// ================================================================
// REWARD TIERS CONSTANT TESTS
// ================================================================

describe('REWARD_TIERS', () => {
  it('should have 5 tiers', () => {
    expect(REWARD_TIERS.length).toBe(5);
  });

  it('should have increasing required referrals', () => {
    for (let i = 1; i < REWARD_TIERS.length; i++) {
      expect(REWARD_TIERS[i].requiredReferrals).toBeGreaterThan(
        REWARD_TIERS[i - 1].requiredReferrals
      );
    }
  });

  it('should have increasing levels', () => {
    for (let i = 0; i < REWARD_TIERS.length; i++) {
      expect(REWARD_TIERS[i].level).toBe(i + 1);
    }
  });

  it('should have rewards for each tier', () => {
    for (const tier of REWARD_TIERS) {
      expect(tier.rewards.length).toBeGreaterThan(0);
    }
  });
});
