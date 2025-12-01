/**
 * ReferralDashboard Component Tests
 *
 * Phase 2, Week 7, Day 2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReferralDashboard } from './ReferralDashboard';
import type { UserReferralStats, RewardTier, ReferralReward } from '@/lib/referrals';

// ================================================================
// TEST DATA
// ================================================================

const mockTier1: RewardTier = {
  level: 1,
  requiredReferrals: 1,
  name: 'Starter',
  description: 'Invite your first friend',
  rewards: [{ type: 'credits', amount: 100 }],
};

const mockTier2: RewardTier = {
  level: 2,
  requiredReferrals: 3,
  name: 'Connector',
  description: 'Build your network',
  rewards: [
    { type: 'credits', amount: 300 },
    { type: 'premium_days', amount: 7 },
  ],
};

const mockReward: ReferralReward = {
  id: 'reward-1',
  userId: 'user-1',
  referralId: 'ref-1',
  type: 'credits',
  amount: 100,
  status: 'available',
  createdAt: new Date(),
  claimedAt: null,
};

const mockStats: UserReferralStats = {
  userId: 'user-1',
  referralCode: 'TEST1234',
  totalReferrals: 5,
  pendingReferrals: 2,
  convertedReferrals: 3,
  currentTier: mockTier1,
  nextTier: mockTier2,
  referralsToNextTier: 0,
  totalCreditsEarned: 300,
  totalPremiumDaysEarned: 0,
  availableRewards: [mockReward],
};

const baseUrl = 'https://app.example.com';

// ================================================================
// RENDER TESTS
// ================================================================

describe('ReferralDashboard Rendering', () => {
  it('should render the dashboard', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByTestId('referral-dashboard')).toBeInTheDocument();
  });

  it('should display header', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('Invite Friends, Earn Rewards')).toBeInTheDocument();
  });

  it('should display referral code', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('TEST1234')).toBeInTheDocument();
  });

  it('should display referral link', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    const input = screen.getByDisplayValue('https://app.example.com/signup?ref=TEST1234');
    expect(input).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} className="custom-class" />);

    expect(screen.getByTestId('referral-dashboard')).toHaveClass('custom-class');
  });
});

// ================================================================
// LOADING STATE TESTS
// ================================================================

describe('ReferralDashboard Loading State', () => {
  it('should show loading spinner', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} isLoading={true} />);

    expect(screen.getByText('Loading referral data...')).toBeInTheDocument();
  });

  it('should show loading animation', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} isLoading={true} />);

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ================================================================
// TIER PROGRESS TESTS
// ================================================================

describe('ReferralDashboard Tier Progress', () => {
  it('should display current tier', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByText('Invite your first friend')).toBeInTheDocument();
  });

  it('should display tier level', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should display next tier info', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('Next: Connector')).toBeInTheDocument();
  });

  it('should not show next tier if at max', () => {
    const maxTierStats = {
      ...mockStats,
      nextTier: null,
    };
    render(<ReferralDashboard stats={maxTierStats} baseUrl={baseUrl} />);

    expect(screen.queryByText('Next:')).not.toBeInTheDocument();
  });
});

// ================================================================
// STATS GRID TESTS
// ================================================================

describe('ReferralDashboard Stats Grid', () => {
  it('should display total referrals', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
  });

  it('should display converted referrals', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Converted')).toBeInTheDocument();
  });

  it('should display pending referrals', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should display total credits', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('Credits')).toBeInTheDocument();
  });
});

// ================================================================
// REWARDS TESTS
// ================================================================

describe('ReferralDashboard Rewards', () => {
  it('should display available rewards', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('Available Rewards (1)')).toBeInTheDocument();
    expect(screen.getByText('100 Credits')).toBeInTheDocument();
  });

  it('should show empty state when no rewards', () => {
    const noRewardsStats = {
      ...mockStats,
      availableRewards: [],
    };
    render(<ReferralDashboard stats={noRewardsStats} baseUrl={baseUrl} />);

    expect(screen.getByText('No rewards available yet. Invite friends to earn rewards!')).toBeInTheDocument();
  });

  it('should have claim all button', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByRole('button', { name: /claim all/i })).toBeInTheDocument();
  });

  it('should call onClaimRewards when claim button clicked', async () => {
    const onClaimRewards = vi.fn().mockResolvedValue(undefined);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onClaimRewards={onClaimRewards}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /claim all/i }));

    await waitFor(() => {
      expect(onClaimRewards).toHaveBeenCalled();
    });
  });
});

// ================================================================
// COPY FUNCTIONALITY TESTS
// ================================================================

describe('ReferralDashboard Copy Functionality', () => {
  it('should have copy link button', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
  });

  it('should have copy code button', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });
});

// ================================================================
// INVITE FORM TESTS
// ================================================================

describe('ReferralDashboard Invite Form', () => {
  it('should render invite form', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByText('Invite a Friend')).toBeInTheDocument();
  });

  it('should have email input', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByLabelText(/friend's email/i)).toBeInTheDocument();
  });

  it('should have message textarea', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByLabelText(/personal message/i)).toBeInTheDocument();
  });

  it('should have send invite button', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByRole('button', { name: /send invite/i })).toBeInTheDocument();
  });

  it('should call onSendInvite when form submitted', async () => {
    const onSendInvite = vi.fn().mockResolvedValue(true);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onSendInvite={onSendInvite}
      />
    );

    const emailInput = screen.getByLabelText(/friend's email/i);
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send invite/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSendInvite).toHaveBeenCalledWith('friend@example.com', undefined);
    });
  });

  it('should include message when provided', async () => {
    const onSendInvite = vi.fn().mockResolvedValue(true);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onSendInvite={onSendInvite}
      />
    );

    const emailInput = screen.getByLabelText(/friend's email/i);
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const messageInput = screen.getByLabelText(/personal message/i);
    fireEvent.change(messageInput, { target: { value: 'Check this out!' } });

    const submitButton = screen.getByRole('button', { name: /send invite/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSendInvite).toHaveBeenCalledWith('friend@example.com', 'Check this out!');
    });
  });

  it('should show success state after invite sent', async () => {
    const onSendInvite = vi.fn().mockResolvedValue(true);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onSendInvite={onSendInvite}
      />
    );

    const emailInput = screen.getByLabelText(/friend's email/i);
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send invite/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Invite Sent!')).toBeInTheDocument();
    });
  });

  it('should show error state on failure', async () => {
    const onSendInvite = vi.fn().mockResolvedValue(false);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onSendInvite={onSendInvite}
      />
    );

    const emailInput = screen.getByLabelText(/friend's email/i);
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send invite/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to Send')).toBeInTheDocument();
    });
  });

  it('should clear form after successful invite', async () => {
    const onSendInvite = vi.fn().mockResolvedValue(true);
    render(
      <ReferralDashboard
        stats={mockStats}
        baseUrl={baseUrl}
        onSendInvite={onSendInvite}
      />
    );

    const emailInput = screen.getByLabelText(/friend's email/i) as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'friend@example.com' } });

    const submitButton = screen.getByRole('button', { name: /send invite/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });
});

// ================================================================
// ACCESSIBILITY TESTS
// ================================================================

describe('ReferralDashboard Accessibility', () => {
  it('should have labeled email input', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    const emailInput = screen.getByLabelText(/friend's email/i);
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('should have labeled message input', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    const messageInput = screen.getByLabelText(/personal message/i);
    expect(messageInput.tagName.toLowerCase()).toBe('textarea');
  });

  it('should have aria-label on copy code button', () => {
    render(<ReferralDashboard stats={mockStats} baseUrl={baseUrl} />);

    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });
});

// ================================================================
// DIFFERENT REWARD TYPES
// ================================================================

describe('ReferralDashboard Reward Types', () => {
  it('should display premium days reward', () => {
    const premiumRewardStats = {
      ...mockStats,
      availableRewards: [
        {
          ...mockReward,
          type: 'premium_days' as const,
          amount: 7,
        },
      ],
    };
    render(<ReferralDashboard stats={premiumRewardStats} baseUrl={baseUrl} />);

    expect(screen.getByText('7 Premium Days')).toBeInTheDocument();
  });

  it('should display discount reward', () => {
    const discountRewardStats = {
      ...mockStats,
      availableRewards: [
        {
          ...mockReward,
          type: 'discount_percent' as const,
          amount: 20,
        },
      ],
    };
    render(<ReferralDashboard stats={discountRewardStats} baseUrl={baseUrl} />);

    expect(screen.getByText('20 % Discount')).toBeInTheDocument();
  });

  it('should display badge reward', () => {
    const badgeRewardStats = {
      ...mockStats,
      availableRewards: [
        {
          ...mockReward,
          type: 'badge' as const,
          amount: 1,
        },
      ],
    };
    render(<ReferralDashboard stats={badgeRewardStats} baseUrl={baseUrl} />);

    expect(screen.getByText('1 Special Badge')).toBeInTheDocument();
  });
});
