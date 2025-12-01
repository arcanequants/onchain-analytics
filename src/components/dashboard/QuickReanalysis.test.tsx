/**
 * Quick Re-analysis Tests
 *
 * Phase 2, Week 4, Day 3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuickReanalysis } from './QuickReanalysis';
import type { MonitoredUrl, QuickReanalysisProps } from './QuickReanalysis';

// ================================================================
// TEST DATA
// ================================================================

const mockUrls: MonitoredUrl[] = [
  {
    id: 'url-1',
    url: 'https://example.com',
    brandName: 'Example Brand',
    lastScore: 75,
    lastAnalyzedAt: '2024-01-15T10:30:00Z',
    scoreChange: 5,
    status: 'idle',
    frequency: 'weekly',
  },
  {
    id: 'url-2',
    url: 'https://another.com',
    brandName: 'Another Brand',
    lastScore: 62,
    lastAnalyzedAt: '2024-01-14T08:00:00Z',
    scoreChange: -3,
    status: 'idle',
    frequency: 'daily',
  },
  {
    id: 'url-3',
    url: 'https://third.com',
    brandName: 'Third Brand',
    lastScore: 88,
    lastAnalyzedAt: '2024-01-13T14:00:00Z',
    scoreChange: 0,
    status: 'completed',
  },
];

const defaultProps: QuickReanalysisProps = {
  urls: mockUrls,
  plan: 'pro',
  remainingAnalyses: 50,
  onReanalyze: vi.fn().mockResolvedValue(undefined),
};

// ================================================================
// RENDERING TESTS
// ================================================================

describe('QuickReanalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render quick reanalysis container', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('quick-reanalysis')).toBeInTheDocument();
    });

    it('should show remaining analyses count', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByText('50 analyses remaining this month')).toBeInTheDocument();
    });

    it('should render all URL items', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('url-item-url-1')).toBeInTheDocument();
      expect(screen.getByTestId('url-item-url-2')).toBeInTheDocument();
      expect(screen.getByTestId('url-item-url-3')).toBeInTheDocument();
    });

    it('should display brand names', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByText('Example Brand')).toBeInTheDocument();
      expect(screen.getByText('Another Brand')).toBeInTheDocument();
      expect(screen.getByText('Third Brand')).toBeInTheDocument();
    });

    it('should display scores', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('62')).toBeInTheDocument();
      expect(screen.getByText('88')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<QuickReanalysis {...defaultProps} className="custom-class" />);
      expect(screen.getByTestId('quick-reanalysis')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no URLs', () => {
      render(<QuickReanalysis {...defaultProps} urls={[]} />);
      expect(screen.getByTestId('quick-reanalysis-empty')).toBeInTheDocument();
      expect(screen.getByText('No URLs to monitor')).toBeInTheDocument();
    });

    it('should show upgrade button for free users with empty list', () => {
      const handleUpgrade = vi.fn();
      render(
        <QuickReanalysis
          {...defaultProps}
          urls={[]}
          plan="free"
          onUpgrade={handleUpgrade}
        />
      );
      expect(screen.getByTestId('upgrade-for-monitoring')).toBeInTheDocument();
    });
  });

  describe('Locked State (Free Plan)', () => {
    it('should show locked state for free users', () => {
      render(<QuickReanalysis {...defaultProps} plan="free" />);
      expect(screen.getByTestId('quick-reanalysis-locked')).toBeInTheDocument();
    });

    it('should show upgrade button in locked state', () => {
      const handleUpgrade = vi.fn();
      render(
        <QuickReanalysis {...defaultProps} plan="free" onUpgrade={handleUpgrade} />
      );
      expect(screen.getByTestId('upgrade-button')).toBeInTheDocument();
    });

    it('should trigger upgrade callback when clicked', () => {
      const handleUpgrade = vi.fn();
      render(
        <QuickReanalysis {...defaultProps} plan="free" onUpgrade={handleUpgrade} />
      );
      fireEvent.click(screen.getByTestId('upgrade-button'));
      expect(handleUpgrade).toHaveBeenCalled();
    });
  });

  describe('Score Changes', () => {
    it('should show positive score change', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('score-change-up')).toHaveTextContent('5 pts');
    });

    it('should show negative score change', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('score-change-down')).toHaveTextContent('3 pts');
    });

    it('should show stable for no change', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('score-change-stable')).toHaveTextContent('No change');
    });
  });

  describe('Status Badges', () => {
    it('should show idle status badge', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getAllByTestId('status-badge-idle')).toHaveLength(2);
    });

    it('should show completed status badge', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('status-badge-completed')).toBeInTheDocument();
    });

    it('should show analyzing status badge', () => {
      const analyzingUrls: MonitoredUrl[] = [
        { ...mockUrls[0], status: 'analyzing' },
      ];
      render(<QuickReanalysis {...defaultProps} urls={analyzingUrls} />);
      expect(screen.getByTestId('status-badge-analyzing')).toBeInTheDocument();
    });

    it('should show error status badge', () => {
      const errorUrls: MonitoredUrl[] = [{ ...mockUrls[0], status: 'error' }];
      render(<QuickReanalysis {...defaultProps} urls={errorUrls} />);
      expect(screen.getByTestId('status-badge-error')).toBeInTheDocument();
    });
  });

  describe('Frequency Badges', () => {
    it('should show weekly frequency badge', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('frequency-badge-weekly')).toBeInTheDocument();
    });

    it('should show daily frequency badge', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getByTestId('frequency-badge-daily')).toBeInTheDocument();
    });
  });

  describe('Re-analyze Actions', () => {
    it('should show reanalyze button for each URL', () => {
      render(<QuickReanalysis {...defaultProps} />);
      expect(screen.getAllByTestId('reanalyze-button')).toHaveLength(3);
    });

    it('should trigger reanalyze callback when clicked', async () => {
      const handleReanalyze = vi.fn().mockResolvedValue(undefined);
      render(<QuickReanalysis {...defaultProps} onReanalyze={handleReanalyze} />);

      const buttons = screen.getAllByTestId('reanalyze-button');
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(handleReanalyze).toHaveBeenCalledWith('url-1');
      });
    });

    it('should disable reanalyze button during analysis', () => {
      const analyzingUrls: MonitoredUrl[] = [
        { ...mockUrls[0], status: 'analyzing' },
      ];
      render(<QuickReanalysis {...defaultProps} urls={analyzingUrls} />);

      const button = screen.getByTestId('reanalyze-button');
      expect(button).toBeDisabled();
    });

    it('should disable all reanalyze buttons when no quota', () => {
      render(<QuickReanalysis {...defaultProps} remainingAnalyses={0} />);

      const buttons = screen.getAllByTestId('reanalyze-button');
      buttons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Re-analyze All', () => {
    it('should show reanalyze all button when callback provided', () => {
      const handleReanalyzeAll = vi.fn().mockResolvedValue(undefined);
      render(
        <QuickReanalysis {...defaultProps} onReanalyzeAll={handleReanalyzeAll} />
      );
      expect(screen.getByTestId('reanalyze-all-button')).toBeInTheDocument();
    });

    it('should not show reanalyze all for single URL', () => {
      const handleReanalyzeAll = vi.fn();
      render(
        <QuickReanalysis
          {...defaultProps}
          urls={[mockUrls[0]]}
          onReanalyzeAll={handleReanalyzeAll}
        />
      );
      expect(screen.queryByTestId('reanalyze-all-button')).not.toBeInTheDocument();
    });

    it('should trigger reanalyze all callback when clicked', async () => {
      const handleReanalyzeAll = vi.fn().mockResolvedValue(undefined);
      render(
        <QuickReanalysis {...defaultProps} onReanalyzeAll={handleReanalyzeAll} />
      );

      fireEvent.click(screen.getByTestId('reanalyze-all-button'));

      await waitFor(() => {
        expect(handleReanalyzeAll).toHaveBeenCalled();
      });
    });

    it('should disable reanalyze all when insufficient quota', () => {
      const handleReanalyzeAll = vi.fn();
      render(
        <QuickReanalysis
          {...defaultProps}
          remainingAnalyses={2}
          onReanalyzeAll={handleReanalyzeAll}
        />
      );

      const button = screen.getByTestId('reanalyze-all-button');
      expect(button).toBeDisabled();
    });

    it('should show URL count in reanalyze all button', () => {
      const handleReanalyzeAll = vi.fn();
      render(
        <QuickReanalysis {...defaultProps} onReanalyzeAll={handleReanalyzeAll} />
      );

      expect(screen.getByTestId('reanalyze-all-button')).toHaveTextContent(
        'Re-analyze All (3)'
      );
    });
  });

  describe('View Details', () => {
    it('should show view details button when callback provided', () => {
      const handleViewDetails = vi.fn();
      render(
        <QuickReanalysis {...defaultProps} onViewDetails={handleViewDetails} />
      );
      expect(screen.getAllByTestId('view-details-button')).toHaveLength(3);
    });

    it('should trigger view details callback when clicked', () => {
      const handleViewDetails = vi.fn();
      render(
        <QuickReanalysis {...defaultProps} onViewDetails={handleViewDetails} />
      );

      const buttons = screen.getAllByTestId('view-details-button');
      fireEvent.click(buttons[0]);

      expect(handleViewDetails).toHaveBeenCalledWith('url-1');
    });
  });

  describe('Remove URL', () => {
    it('should show remove button when callback provided', () => {
      const handleRemove = vi.fn();
      render(<QuickReanalysis {...defaultProps} onRemoveUrl={handleRemove} />);
      expect(screen.getAllByTestId('remove-url-button')).toHaveLength(3);
    });

    it('should trigger remove callback when clicked', () => {
      const handleRemove = vi.fn();
      render(<QuickReanalysis {...defaultProps} onRemoveUrl={handleRemove} />);

      const buttons = screen.getAllByTestId('remove-url-button');
      fireEvent.click(buttons[0]);

      expect(handleRemove).toHaveBeenCalledWith('url-1');
    });
  });

  describe('Low Quota Warning', () => {
    it('should show warning when quota is low', () => {
      render(<QuickReanalysis {...defaultProps} remainingAnalyses={3} />);
      expect(screen.getByTestId('low-quota-warning')).toBeInTheDocument();
    });

    it('should not show warning when quota is sufficient', () => {
      render(<QuickReanalysis {...defaultProps} remainingAnalyses={10} />);
      expect(screen.queryByTestId('low-quota-warning')).not.toBeInTheDocument();
    });

    it('should show upgrade link in warning', () => {
      const handleUpgrade = vi.fn();
      render(
        <QuickReanalysis
          {...defaultProps}
          remainingAnalyses={2}
          onUpgrade={handleUpgrade}
        />
      );
      expect(screen.getByText('Upgrade for more')).toBeInTheDocument();
    });
  });

  describe('No Quota State', () => {
    it('should show no quota message when exhausted', () => {
      render(<QuickReanalysis {...defaultProps} remainingAnalyses={0} />);
      expect(screen.getByTestId('no-quota-message')).toBeInTheDocument();
    });

    it('should show upgrade button in no quota state', () => {
      const handleUpgrade = vi.fn();
      render(
        <QuickReanalysis
          {...defaultProps}
          remainingAnalyses={0}
          onUpgrade={handleUpgrade}
        />
      );
      expect(
        screen.getByRole('button', { name: 'Upgrade' })
      ).toBeInTheDocument();
    });
  });

  describe('Plan Variations', () => {
    it('should work for starter plan', () => {
      render(<QuickReanalysis {...defaultProps} plan="starter" />);
      expect(screen.getByTestId('quick-reanalysis')).toBeInTheDocument();
    });

    it('should work for enterprise plan', () => {
      render(<QuickReanalysis {...defaultProps} plan="enterprise" />);
      expect(screen.getByTestId('quick-reanalysis')).toBeInTheDocument();
    });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('QuickReanalysis Integration', () => {
  it('should handle complete reanalysis flow', async () => {
    const handleReanalyze = vi.fn().mockResolvedValue(undefined);
    const handleViewDetails = vi.fn();

    render(
      <QuickReanalysis
        {...defaultProps}
        onReanalyze={handleReanalyze}
        onViewDetails={handleViewDetails}
      />
    );

    // Click reanalyze on first URL
    const reanalyzeButtons = screen.getAllByTestId('reanalyze-button');
    fireEvent.click(reanalyzeButtons[0]);

    await waitFor(() => {
      expect(handleReanalyze).toHaveBeenCalledWith('url-1');
    });

    // Click view details
    const viewButtons = screen.getAllByTestId('view-details-button');
    fireEvent.click(viewButtons[0]);

    expect(handleViewDetails).toHaveBeenCalledWith('url-1');
  });

  it('should handle multiple URL management', async () => {
    const handleReanalyze = vi.fn().mockResolvedValue(undefined);
    const handleRemove = vi.fn();

    render(
      <QuickReanalysis
        {...defaultProps}
        onReanalyze={handleReanalyze}
        onRemoveUrl={handleRemove}
      />
    );

    // Reanalyze first
    const reanalyzeButtons = screen.getAllByTestId('reanalyze-button');
    fireEvent.click(reanalyzeButtons[1]);

    await waitFor(() => {
      expect(handleReanalyze).toHaveBeenCalledWith('url-2');
    });

    // Remove second
    const removeButtons = screen.getAllByTestId('remove-url-button');
    fireEvent.click(removeButtons[2]);

    expect(handleRemove).toHaveBeenCalledWith('url-3');
  });
});
