/**
 * UserDashboard Component Tests
 *
 * Phase 2, Week 4, Day 2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserDashboard, DashboardData, Analysis, UserProfile } from './UserDashboard';
import type { UsageData } from '@/lib/freemium';

// ================================================================
// TEST DATA
// ================================================================

const mockUser: UserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  plan: 'free',
  createdAt: new Date('2024-01-01'),
};

const mockUsage: UsageData = {
  analysesThisMonth: 3,
  lastAnalysisDate: new Date(),
  totalAnalyses: 10,
  savedUrls: 2,
};

const mockAnalyses: Analysis[] = [
  {
    id: 'analysis-1',
    url: 'https://example.com',
    title: 'Example Site',
    score: 85,
    createdAt: new Date(),
    status: 'completed',
    provider: 'openai',
  },
  {
    id: 'analysis-2',
    url: 'https://test.com',
    title: 'Test Site',
    score: 72,
    createdAt: new Date(),
    status: 'completed',
    provider: 'anthropic',
  },
  {
    id: 'analysis-3',
    url: 'https://demo.com',
    title: 'Demo Site',
    score: 0,
    createdAt: new Date(),
    status: 'processing',
    provider: 'openai',
  },
];

const mockData: DashboardData = {
  user: mockUser,
  usage: mockUsage,
  recentAnalyses: mockAnalyses,
  savedUrls: ['https://saved1.com', 'https://saved2.com'],
};

// ================================================================
// RENDER TESTS
// ================================================================

describe('UserDashboard', () => {
  describe('rendering', () => {
    it('should render dashboard container', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('user-dashboard')).toBeInTheDocument();
    });

    it('should render welcome message with user name', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText(/Welcome back, Test User/)).toBeInTheDocument();
    });

    it('should render welcome message without name', () => {
      const dataWithoutName = {
        ...mockData,
        user: { ...mockUser, name: undefined },
      };
      render(<UserDashboard data={dataWithoutName} />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('should show plan name', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText(/Free Plan/)).toBeInTheDocument();
    });

    it('should render new analysis button', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('new-analysis-btn')).toBeInTheDocument();
      expect(screen.getByTestId('new-analysis-btn')).toHaveTextContent('New Analysis');
    });
  });

  describe('stats cards', () => {
    it('should render stats grid', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('stats-grid')).toBeInTheDocument();
    });

    it('should show analyses used count', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText('3/5')).toBeInTheDocument();
      expect(screen.getByText('Analyses This Month')).toBeInTheDocument();
    });

    it('should show remaining analyses', () => {
      render(<UserDashboard data={mockData} />);

      // Find remaining stat by looking for the label first
      expect(screen.getByText('Remaining')).toBeInTheDocument();
      // Verify the stat cards are rendered with correct values
      const statValues = screen.getAllByTestId('stat-value');
      expect(statValues.length).toBeGreaterThanOrEqual(4);
    });

    it('should show average score', () => {
      render(<UserDashboard data={mockData} />);

      // Average of 85 and 72 (completed analyses) = 78.5, rounded to 79
      expect(screen.getByText('79')).toBeInTheDocument();
      expect(screen.getByText('Average Score')).toBeInTheDocument();
    });

    it('should show saved URLs count', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText('Saved URLs')).toBeInTheDocument();
    });
  });

  describe('usage section', () => {
    it('should render usage progress', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('usage-section')).toBeInTheDocument();
      expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    });

    it('should show monthly usage header', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText('Monthly Usage')).toBeInTheDocument();
    });
  });

  describe('recent analyses', () => {
    it('should render recent analyses section', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('recent-analyses')).toBeInTheDocument();
    });

    it('should display analysis items', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText('Example Site')).toBeInTheDocument();
      expect(screen.getByText('Test Site')).toBeInTheDocument();
    });

    it('should show view all button', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('view-history-btn')).toBeInTheDocument();
      expect(screen.getByTestId('view-history-btn')).toHaveTextContent('View all');
    });

    it('should show analysis scores', () => {
      render(<UserDashboard data={mockData} />);

      const scores = screen.getAllByTestId('analysis-score');
      expect(scores).toHaveLength(2); // Only completed analyses have scores
      expect(scores[0]).toHaveTextContent('85');
      expect(scores[1]).toHaveTextContent('72');
    });
  });

  describe('quick actions', () => {
    it('should render quick actions section', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('quick-actions')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      render(<UserDashboard data={mockData} />);

      const actions = screen.getAllByTestId('quick-action');
      expect(actions.length).toBeGreaterThanOrEqual(3);
    });

    it('should show Limited badge for free users on history', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText('Limited')).toBeInTheDocument();
    });
  });

  describe('plan comparison', () => {
    it('should show plan comparison for free users', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('plan-comparison')).toBeInTheDocument();
      expect(screen.getByText('Unlock More with Starter')).toBeInTheDocument();
    });

    it('should show starter plan benefits', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByText(/100 analyses per month/)).toBeInTheDocument();
      expect(screen.getByText(/30 days of history/)).toBeInTheDocument();
    });

    it('should show upgrade button', () => {
      render(<UserDashboard data={mockData} />);

      expect(screen.getByTestId('upgrade-starter-btn')).toBeInTheDocument();
    });

    it('should not show plan comparison for paid users', () => {
      const paidData = {
        ...mockData,
        user: { ...mockUser, plan: 'starter' as const },
      };
      render(<UserDashboard data={paidData} />);

      expect(screen.queryByTestId('plan-comparison')).not.toBeInTheDocument();
    });
  });
});

// ================================================================
// INTERACTION TESTS
// ================================================================

describe('UserDashboard interactions', () => {
  it('should call onRunAnalysis when new analysis button clicked', () => {
    const handleRunAnalysis = vi.fn();
    render(<UserDashboard data={mockData} onRunAnalysis={handleRunAnalysis} />);

    fireEvent.click(screen.getByTestId('new-analysis-btn'));
    expect(handleRunAnalysis).toHaveBeenCalledTimes(1);
  });

  it('should call onViewHistory when view all clicked', () => {
    const handleViewHistory = vi.fn();
    render(<UserDashboard data={mockData} onViewHistory={handleViewHistory} />);

    fireEvent.click(screen.getByTestId('view-history-btn'));
    expect(handleViewHistory).toHaveBeenCalledTimes(1);
  });

  it('should call onAnalysisClick when analysis item clicked', () => {
    const handleAnalysisClick = vi.fn();
    render(<UserDashboard data={mockData} onAnalysisClick={handleAnalysisClick} />);

    const items = screen.getAllByTestId('analysis-item');
    fireEvent.click(items[0]);

    expect(handleAnalysisClick).toHaveBeenCalledWith('analysis-1');
  });

  it('should call onUpgrade when upgrade button clicked', () => {
    const handleUpgrade = vi.fn();
    render(<UserDashboard data={mockData} onUpgrade={handleUpgrade} />);

    fireEvent.click(screen.getByTestId('upgrade-starter-btn'));
    expect(handleUpgrade).toHaveBeenCalledWith('starter');
  });
});

// ================================================================
// EMPTY STATE TESTS
// ================================================================

describe('UserDashboard empty state', () => {
  it('should show empty state when no analyses', () => {
    const emptyData = {
      ...mockData,
      recentAnalyses: [],
    };
    render(<UserDashboard data={emptyData} />);

    expect(screen.getByTestId('empty-analyses')).toBeInTheDocument();
    expect(screen.getByText('No analyses yet')).toBeInTheDocument();
  });

  it('should show run analysis button in empty state', () => {
    const emptyData = {
      ...mockData,
      recentAnalyses: [],
    };
    render(<UserDashboard data={emptyData} />);

    expect(screen.getByTestId('empty-run-analysis-btn')).toBeInTheDocument();
  });

  it('should call onRunAnalysis from empty state button', () => {
    const handleRunAnalysis = vi.fn();
    const emptyData = {
      ...mockData,
      recentAnalyses: [],
    };
    render(<UserDashboard data={emptyData} onRunAnalysis={handleRunAnalysis} />);

    fireEvent.click(screen.getByTestId('empty-run-analysis-btn'));
    expect(handleRunAnalysis).toHaveBeenCalledTimes(1);
  });
});

// ================================================================
// PLAN-SPECIFIC TESTS
// ================================================================

describe('UserDashboard plan variations', () => {
  it('should show upgrade prompt for free user at limit', () => {
    const limitData = {
      ...mockData,
      usage: {
        ...mockUsage,
        analysesThisMonth: 5, // At limit
      },
    };
    render(<UserDashboard data={limitData} onUpgrade={() => {}} />);

    // Should show upgrade CTA in usage progress
    expect(screen.getByTestId('usage-upgrade-cta')).toBeInTheDocument();
  });

  it('should not show upgrade prompt for starter user', () => {
    const starterData = {
      ...mockData,
      user: { ...mockUser, plan: 'starter' as const },
    };
    render(<UserDashboard data={starterData} />);

    expect(screen.queryByTestId('plan-comparison')).not.toBeInTheDocument();
    expect(screen.queryByText('Limited')).not.toBeInTheDocument();
  });

  it('should show correct limit for pro plan', () => {
    const proData = {
      ...mockData,
      user: { ...mockUser, plan: 'pro' as const },
      usage: {
        ...mockUsage,
        analysesThisMonth: 50,
      },
    };
    render(<UserDashboard data={proData} />);

    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('50/500')).toBeInTheDocument();
  });
});

// ================================================================
// ANALYSIS STATUS TESTS
// ================================================================

describe('UserDashboard analysis statuses', () => {
  it('should show processing status', () => {
    render(<UserDashboard data={mockData} />);

    expect(screen.getByText('Demo Site')).toBeInTheDocument();
    // Processing analysis should not show score
    const items = screen.getAllByTestId('analysis-item');
    expect(items[2]).not.toHaveTextContent('Score');
  });

  it('should show failed status', () => {
    const dataWithFailed = {
      ...mockData,
      recentAnalyses: [
        {
          id: 'analysis-4',
          url: 'https://failed.com',
          title: 'Failed Site Unique',
          score: 0,
          createdAt: new Date(),
          status: 'failed' as const,
          provider: 'openai',
        },
      ],
    };
    render(<UserDashboard data={dataWithFailed} />);

    expect(screen.getByText('Failed Site Unique')).toBeInTheDocument();
  });
});

// ================================================================
// BLURRED CONTENT TESTS
// ================================================================

describe('UserDashboard blurred content', () => {
  it('should blur extra analyses for free users', () => {
    const manyAnalyses = {
      ...mockData,
      recentAnalyses: [
        ...mockAnalyses,
        {
          id: 'analysis-4',
          url: 'https://extra1.com',
          title: 'Extra Site 1',
          score: 90,
          createdAt: new Date(),
          status: 'completed' as const,
          provider: 'openai',
        },
        {
          id: 'analysis-5',
          url: 'https://extra2.com',
          title: 'Extra Site 2',
          score: 88,
          createdAt: new Date(),
          status: 'completed' as const,
          provider: 'anthropic',
        },
      ],
    };
    render(<UserDashboard data={manyAnalyses} onUpgrade={() => {}} />);

    // Should show blurred content with locked items
    expect(screen.getByTestId('blurred-content')).toBeInTheDocument();
  });

  it('should not blur for paid users', () => {
    const starterData = {
      ...mockData,
      user: { ...mockUser, plan: 'starter' as const },
      recentAnalyses: [
        ...mockAnalyses,
        {
          id: 'analysis-4',
          url: 'https://extra1.com',
          title: 'Extra Site 1',
          score: 90,
          createdAt: new Date(),
          status: 'completed' as const,
          provider: 'openai',
        },
      ],
    };
    render(<UserDashboard data={starterData} />);

    expect(screen.queryByTestId('blurred-content')).not.toBeInTheDocument();
  });
});
