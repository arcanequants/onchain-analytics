/**
 * LeaderboardTable Component Tests
 *
 * Phase 2, Week 7, Day 2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeaderboardTable } from './LeaderboardTable';
import type { LeaderboardEntry } from '@/lib/leaderboards';

// ================================================================
// TEST DATA
// ================================================================

const mockEntries: LeaderboardEntry[] = [
  {
    rank: 1,
    previousRank: 2,
    brandId: 'openai',
    brandName: 'OpenAI',
    brandLogo: 'https://example.com/openai.png',
    score: 95,
    previousScore: 94,
    scoreChange: 1,
    trend: 'up',
    category: 'ai-ml',
    isVerified: true,
    lastUpdated: new Date(),
  },
  {
    rank: 2,
    previousRank: 1,
    brandId: 'anthropic',
    brandName: 'Anthropic',
    score: 91,
    previousScore: 89,
    scoreChange: 2,
    trend: 'up',
    category: 'ai-ml',
    isVerified: true,
    lastUpdated: new Date(),
  },
  {
    rank: 3,
    previousRank: 3,
    brandId: 'stripe',
    brandName: 'Stripe',
    score: 92,
    previousScore: 92,
    scoreChange: 0,
    trend: 'stable',
    category: 'fintech',
    isVerified: true,
    lastUpdated: new Date(),
  },
  {
    rank: 4,
    previousRank: null,
    brandId: 'newbrand',
    brandName: 'NewBrand',
    score: 85,
    previousScore: null,
    scoreChange: 0,
    trend: 'new',
    category: 'developer-tools',
    isVerified: false,
    lastUpdated: new Date(),
  },
  {
    rank: 5,
    previousRank: 4,
    brandId: 'declining',
    brandName: 'Declining Corp',
    score: 75,
    previousScore: 80,
    scoreChange: -5,
    trend: 'down',
    category: 'marketing',
    isVerified: true,
    lastUpdated: new Date(),
  },
];

// ================================================================
// RENDER TESTS
// ================================================================

describe('LeaderboardTable Rendering', () => {
  it('should render the leaderboard table', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
  });

  it('should display all entries', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();
    expect(screen.getByText('NewBrand')).toBeInTheDocument();
    expect(screen.getByText('Declining Corp')).toBeInTheDocument();
  });

  it('should show entry count', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('Showing 5 of 15 brands')).toBeInTheDocument();
  });

  it('should display table headers', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('Rank')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Trend')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
        className="custom-class"
      />
    );

    expect(screen.getByTestId('leaderboard-table')).toHaveClass('custom-class');
  });
});

// ================================================================
// RANK DISPLAY TESTS
// ================================================================

describe('LeaderboardTable Rank Display', () => {
  it('should show gold medal for rank 1', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('🥇')).toBeInTheDocument();
  });

  it('should show silver medal for rank 2', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('🥈')).toBeInTheDocument();
  });

  it('should show bronze medal for rank 3', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('🥉')).toBeInTheDocument();
  });

  it('should show numeric rank for positions 4+', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('#4')).toBeInTheDocument();
    expect(screen.getByText('#5')).toBeInTheDocument();
  });
});

// ================================================================
// TREND INDICATOR TESTS
// ================================================================

describe('LeaderboardTable Trend Indicators', () => {
  it('should show up trend with positive change', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    // OpenAI has +1 change
    expect(screen.getByText('+1')).toBeInTheDocument();
    // Anthropic has +2 change
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('should show down trend with negative change', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    // Declining Corp has -5 change
    expect(screen.getByText('-5')).toBeInTheDocument();
  });

  it('should show new badge for new entries', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('New')).toBeInTheDocument();
  });
});

// ================================================================
// SCORE BADGE TESTS
// ================================================================

describe('LeaderboardTable Score Badges', () => {
  it('should display scores for all entries', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('95')).toBeInTheDocument();
    expect(screen.getByText('91')).toBeInTheDocument();
    expect(screen.getByText('92')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });
});

// ================================================================
// CATEGORY DISPLAY TESTS
// ================================================================

describe('LeaderboardTable Categories', () => {
  it('should display category labels in table rows', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    // Categories appear in both filter dropdown and table rows
    // Check that they exist (at least one instance)
    expect(screen.getAllByText('AI & Machine Learning').length).toBeGreaterThan(0);
    expect(screen.getAllByText('FinTech').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Developer Tools').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Marketing').length).toBeGreaterThan(0);
  });
});

// ================================================================
// VERIFIED BADGE TESTS
// ================================================================

describe('LeaderboardTable Verified Badges', () => {
  it('should show verified badge for verified brands', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    // Verified brands: OpenAI, Anthropic, Stripe, Declining Corp (4 total)
    // NewBrand is not verified
    const verifiedIcons = document.querySelectorAll('.bg-blue-500.rounded-full');
    expect(verifiedIcons.length).toBe(4);
  });
});

// ================================================================
// FILTER TESTS
// ================================================================

describe('LeaderboardTable Filters', () => {
  it('should render category filter', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
  });

  it('should call onCategoryChange when category is selected', () => {
    const onCategoryChange = vi.fn();
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
        onCategoryChange={onCategoryChange}
      />
    );

    const select = screen.getByLabelText(/category/i);
    fireEvent.change(select, { target: { value: 'fintech' } });

    expect(onCategoryChange).toHaveBeenCalledWith('fintech');
  });

  it('should render period filter buttons', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('This Week')).toBeInTheDocument();
    expect(screen.getByText('This Month')).toBeInTheDocument();
    expect(screen.getByText('All Time')).toBeInTheDocument();
  });

  it('should call onPeriodChange when period button is clicked', () => {
    const onPeriodChange = vi.fn();
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
        onPeriodChange={onPeriodChange}
      />
    );

    fireEvent.click(screen.getByText('This Month'));

    expect(onPeriodChange).toHaveBeenCalledWith('monthly');
  });

  it('should highlight current period', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    const weeklyButton = screen.getByText('This Week');
    expect(weeklyButton).toHaveClass('bg-white');
  });
});

// ================================================================
// INTERACTION TESTS
// ================================================================

describe('LeaderboardTable Interactions', () => {
  it('should call onBrandClick when row is clicked', () => {
    const onBrandClick = vi.fn();
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
        onBrandClick={onBrandClick}
      />
    );

    fireEvent.click(screen.getByText('OpenAI'));

    expect(onBrandClick).toHaveBeenCalledWith('openai');
  });

  it('should highlight row on hover', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    const row = screen.getByText('OpenAI').closest('tr');
    fireEvent.mouseEnter(row!);

    expect(row).toHaveClass('bg-gray-50');
  });

  it('should remove highlight on mouse leave', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    const row = screen.getByText('OpenAI').closest('tr');
    fireEvent.mouseEnter(row!);
    fireEvent.mouseLeave(row!);

    expect(row).toHaveClass('bg-white');
  });
});

// ================================================================
// LOADING STATE TESTS
// ================================================================

describe('LeaderboardTable Loading State', () => {
  it('should show loading spinner when loading', () => {
    render(
      <LeaderboardTable
        entries={[]}
        totalEntries={0}
        currentCategory="all"
        currentPeriod="weekly"
        isLoading={true}
      />
    );

    expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
  });

  it('should show loading animation', () => {
    render(
      <LeaderboardTable
        entries={[]}
        totalEntries={0}
        currentCategory="all"
        currentPeriod="weekly"
        isLoading={true}
      />
    );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});

// ================================================================
// EMPTY STATE TESTS
// ================================================================

describe('LeaderboardTable Empty State', () => {
  it('should show empty message when no entries', () => {
    render(
      <LeaderboardTable
        entries={[]}
        totalEntries={0}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByText('No brands found for the selected filters.')).toBeInTheDocument();
  });
});

// ================================================================
// BRAND LOGO TESTS
// ================================================================

describe('LeaderboardTable Brand Logos', () => {
  it('should display brand logo when provided', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    const logo = document.querySelector('img[src="https://example.com/openai.png"]');
    expect(logo).toBeInTheDocument();
  });

  it('should display initial when logo not provided', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    // Anthropic has no logo, should show 'A'
    const initialDivs = document.querySelectorAll('.rounded-full.bg-gray-200');
    expect(initialDivs.length).toBeGreaterThan(0);
  });
});

// ================================================================
// ACCESSIBILITY TESTS
// ================================================================

describe('LeaderboardTable Accessibility', () => {
  it('should have accessible table structure', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('columnheader').length).toBe(5);
  });

  it('should have labeled category filter', () => {
    render(
      <LeaderboardTable
        entries={mockEntries}
        totalEntries={15}
        currentCategory="all"
        currentPeriod="weekly"
      />
    );

    const select = screen.getByRole('combobox');
    expect(select).toHaveAttribute('id', 'category-filter');
  });
});
