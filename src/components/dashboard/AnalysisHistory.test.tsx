/**
 * AnalysisHistory Component Tests
 *
 * Phase 2, Week 4, Day 2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisHistory, HistoryAnalysis } from './AnalysisHistory';

// ================================================================
// TEST DATA
// ================================================================

const mockAnalyses: HistoryAnalysis[] = [
  {
    id: 'analysis-1',
    url: 'https://example.com/page1',
    title: 'Example Page 1',
    score: 85,
    createdAt: new Date('2024-01-15'),
    status: 'completed',
    provider: 'openai',
    domain: 'example.com',
    tags: ['SEO', 'Performance'],
  },
  {
    id: 'analysis-2',
    url: 'https://test.com/about',
    title: 'Test About Page',
    score: 72,
    createdAt: new Date('2024-01-14'),
    status: 'completed',
    provider: 'anthropic',
    domain: 'test.com',
  },
  {
    id: 'analysis-3',
    url: 'https://demo.com/home',
    title: 'Demo Homepage',
    score: 0,
    createdAt: new Date('2024-01-13'),
    status: 'processing',
    provider: 'openai',
    domain: 'demo.com',
  },
  {
    id: 'analysis-4',
    url: 'https://failed.com/test',
    title: 'Failed Analysis',
    score: 0,
    createdAt: new Date('2024-01-12'),
    status: 'failed',
    provider: 'anthropic',
    domain: 'failed.com',
  },
];

// ================================================================
// RENDER TESTS
// ================================================================

describe('AnalysisHistory', () => {
  describe('rendering', () => {
    it('should render history container', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('analysis-history')).toBeInTheDocument();
    });

    it('should render header', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('history-header')).toBeInTheDocument();
      expect(screen.getByText('Analysis History')).toBeInTheDocument();
    });

    it('should show history days limit for starter plan', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByText(/Access to last 30 days/)).toBeInTheDocument();
    });

    it('should show no access message for free plan', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="free" />);

      // Header shows upgrade message
      expect(screen.getByTestId('history-header')).toHaveTextContent('Upgrade to access');
    });

    it('should render filter bar', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('filter-bar')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should render history list', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('history-list')).toBeInTheDocument();
    });

    it('should display analysis items', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const items = screen.getAllByTestId('history-item');
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('empty state', () => {
    it('should show empty state when no analyses', () => {
      render(<AnalysisHistory analyses={[]} plan="starter" />);

      expect(screen.getByTestId('empty-history')).toBeInTheDocument();
      expect(screen.getByText('No analysis history')).toBeInTheDocument();
    });
  });

  describe('no results state', () => {
    it('should show no results when search has no matches', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByTestId('no-results')).toBeInTheDocument();
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should have clear filters button', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByTestId('clear-search')).toBeInTheDocument();
    });
  });
});

// ================================================================
// FILTER TESTS
// ================================================================

describe('AnalysisHistory filters', () => {
  describe('search', () => {
    it('should filter by title', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Example' } });

      expect(screen.getByText('Example Page 1')).toBeInTheDocument();
      expect(screen.queryByText('Test About Page')).not.toBeInTheDocument();
    });

    it('should filter by URL', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'test.com' } });

      expect(screen.getByText('Test About Page')).toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'EXAMPLE' } });

      expect(screen.getByText('Example Page 1')).toBeInTheDocument();
    });
  });

  describe('status filter', () => {
    it('should show filter toggle button', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('filter-toggle')).toBeInTheDocument();
    });

    it('should expand filters when clicked', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      fireEvent.click(screen.getByTestId('filter-toggle'));

      expect(screen.getByTestId('expanded-filters')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
    });

    it('should filter by completed status', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      fireEvent.click(screen.getByTestId('filter-toggle'));
      const statusSelect = screen.getByTestId('status-filter');
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      // Only completed analyses should show scores
      const scores = screen.getAllByTestId('history-score');
      expect(scores).toHaveLength(2);
    });
  });

  describe('sorting', () => {
    it('should show sort select', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('sort-select')).toBeInTheDocument();
    });

    it('should sort by date by default (newest first)', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const titles = screen.getAllByTestId('history-title');
      // First item should be most recent
      expect(titles[0]).toHaveTextContent('Example Page 1');
    });

    it('should sort by score when selected', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const sortSelect = screen.getByTestId('sort-select');
      fireEvent.change(sortSelect, { target: { value: 'score-desc' } });

      const scores = screen.getAllByTestId('history-score');
      // Highest score should be first
      expect(scores[0]).toHaveTextContent('85');
    });
  });

  describe('clear filters', () => {
    it('should clear all filters', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      // Apply search filter
      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Example' } });

      // Expand and clear
      fireEvent.click(screen.getByTestId('filter-toggle'));
      fireEvent.click(screen.getByTestId('clear-filters'));

      // All items should be visible again
      expect(screen.getByText('Test About Page')).toBeInTheDocument();
    });
  });

  describe('results count', () => {
    it('should show total and filtered count', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      expect(screen.getByTestId('results-count')).toHaveTextContent('Showing 4 of 4 analyses');
    });

    it('should update count when filtered', () => {
      render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

      const searchInput = screen.getByTestId('search-input');
      fireEvent.change(searchInput, { target: { value: 'Example' } });

      expect(screen.getByTestId('results-count')).toHaveTextContent('Showing 1 of 4 analyses');
    });
  });
});

// ================================================================
// ITEM INTERACTION TESTS
// ================================================================

describe('AnalysisHistory item interactions', () => {
  it('should call onAnalysisClick when item clicked', () => {
    const handleClick = vi.fn();
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="starter"
        onAnalysisClick={handleClick}
      />
    );

    // Click on the clickable area within the item (the left side with content)
    const items = screen.getAllByTestId('history-item');
    const clickableArea = items[0].querySelector('[role="button"]');
    if (clickableArea) {
      fireEvent.click(clickableArea);
    }

    expect(handleClick).toHaveBeenCalledWith('analysis-1');
  });

  it('should call onDeleteAnalysis when delete clicked', () => {
    const handleDelete = vi.fn();
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="starter"
        onDeleteAnalysis={handleDelete}
      />
    );

    // Hover to show actions
    const items = screen.getAllByTestId('history-item');
    fireEvent.mouseEnter(items[0]);

    const deleteBtn = screen.getAllByTestId('delete-btn')[0];
    fireEvent.click(deleteBtn);

    expect(handleDelete).toHaveBeenCalledWith('analysis-1');
  });

  it('should call onExportAnalysis for completed items with export enabled', () => {
    const handleExport = vi.fn();
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="starter"
        onExportAnalysis={handleExport}
      />
    );

    const items = screen.getAllByTestId('history-item');
    fireEvent.mouseEnter(items[0]);

    const exportBtns = screen.getAllByTestId('export-btn');
    fireEvent.click(exportBtns[0]);

    expect(handleExport).toHaveBeenCalledWith('analysis-1');
  });

  it('should call onRerunAnalysis for failed items', () => {
    const handleRerun = vi.fn();
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="starter"
        onRerunAnalysis={handleRerun}
      />
    );

    // Find failed item and click rerun
    const rerunBtns = screen.getAllByTestId('rerun-btn');
    fireEvent.click(rerunBtns[0]);

    expect(handleRerun).toHaveBeenCalledWith('analysis-4');
  });
});

// ================================================================
// PLAN-BASED GATING TESTS
// ================================================================

describe('AnalysisHistory plan gating', () => {
  it('should show all items for pro users', () => {
    render(<AnalysisHistory analyses={mockAnalyses} plan="pro" />);

    // All items visible, no blurred content
    expect(screen.queryByTestId('blurred-content')).not.toBeInTheDocument();
  });

  it('should limit visible items for free users', () => {
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="free"
        onUpgrade={() => {}}
      />
    );

    // Free plan should show blurred content for locked items
    expect(screen.getByTestId('blurred-content')).toBeInTheDocument();
  });

  it('should show upgrade CTA for free users', () => {
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="free"
        onUpgrade={() => {}}
      />
    );

    expect(screen.getByTestId('history-limit-notice')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Starter/)).toBeInTheDocument();
  });

  it('should call onUpgrade when upgrade clicked', () => {
    const handleUpgrade = vi.fn();
    render(
      <AnalysisHistory
        analyses={mockAnalyses}
        plan="free"
        onUpgrade={handleUpgrade}
      />
    );

    const upgradeLink = screen.getByText('Upgrade to Starter');
    fireEvent.click(upgradeLink);

    expect(handleUpgrade).toHaveBeenCalledWith('starter');
  });

  it('should not show export button for free users', () => {
    render(<AnalysisHistory analyses={mockAnalyses} plan="free" />);

    // Free plan doesn't have export
    expect(screen.queryByTestId('export-btn')).not.toBeInTheDocument();
  });

  it('should show export button for starter users', () => {
    render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

    // Starter plan has export
    expect(screen.getAllByTestId('export-btn').length).toBeGreaterThan(0);
  });
});

// ================================================================
// PAGINATION TESTS
// ================================================================

describe('AnalysisHistory pagination', () => {
  const manyAnalyses: HistoryAnalysis[] = Array.from({ length: 25 }, (_, i) => ({
    id: `analysis-${i + 1}`,
    url: `https://example.com/page${i + 1}`,
    title: `Page ${i + 1}`,
    score: 70 + (i % 30),
    createdAt: new Date(2024, 0, 25 - i),
    status: 'completed' as const,
    provider: 'openai',
    domain: 'example.com',
  }));

  it('should show pagination when more than 10 items', () => {
    render(<AnalysisHistory analyses={manyAnalyses} plan="pro" />);

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });

  it('should not show pagination when 10 or fewer items', () => {
    render(<AnalysisHistory analyses={mockAnalyses} plan="pro" />);

    expect(screen.queryByTestId('pagination')).not.toBeInTheDocument();
  });

  it('should navigate to next page', () => {
    render(<AnalysisHistory analyses={manyAnalyses} plan="pro" />);

    // First page should show Page 1
    expect(screen.getByText('Page 1')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('next-page'));

    // After clicking next, first item should be different
    expect(screen.getByText('Page 11')).toBeInTheDocument();
  });

  it('should navigate to previous page', () => {
    render(<AnalysisHistory analyses={manyAnalyses} plan="pro" />);

    // Go to page 2
    fireEvent.click(screen.getByTestId('next-page'));
    expect(screen.getByText('Page 11')).toBeInTheDocument();

    // Go back to page 1
    fireEvent.click(screen.getByTestId('prev-page'));
    expect(screen.getByText('Page 1')).toBeInTheDocument();
  });

  it('should disable prev button on first page', () => {
    render(<AnalysisHistory analyses={manyAnalyses} plan="pro" />);

    const prevBtn = screen.getByTestId('prev-page');
    expect(prevBtn).toBeDisabled();
  });

  it('should disable next button on last page', () => {
    render(<AnalysisHistory analyses={manyAnalyses} plan="pro" />);

    // Navigate to last page
    fireEvent.click(screen.getByTestId('next-page'));
    fireEvent.click(screen.getByTestId('next-page'));

    const nextBtn = screen.getByTestId('next-page');
    expect(nextBtn).toBeDisabled();
  });
});

// ================================================================
// SCORE DISPLAY TESTS
// ================================================================

describe('AnalysisHistory score display', () => {
  it('should show score for completed analyses', () => {
    render(<AnalysisHistory analyses={mockAnalyses} plan="starter" />);

    const scores = screen.getAllByTestId('history-score');
    expect(scores[0]).toHaveTextContent('85');
    expect(scores[1]).toHaveTextContent('72');
  });

  it('should not show score for processing analyses', () => {
    const processingOnly: HistoryAnalysis[] = [
      {
        id: 'processing-1',
        url: 'https://processing.com',
        title: 'Processing Analysis',
        score: 0,
        createdAt: new Date(),
        status: 'processing',
        provider: 'openai',
        domain: 'processing.com',
      },
    ];
    render(<AnalysisHistory analyses={processingOnly} plan="starter" />);

    expect(screen.queryByTestId('history-score')).not.toBeInTheDocument();
  });

  it('should not show score for failed analyses', () => {
    const failedOnly: HistoryAnalysis[] = [
      {
        id: 'failed-1',
        url: 'https://failed.com',
        title: 'Failed Analysis',
        score: 0,
        createdAt: new Date(),
        status: 'failed',
        provider: 'openai',
        domain: 'failed.com',
      },
    ];
    render(<AnalysisHistory analyses={failedOnly} plan="starter" />);

    expect(screen.queryByTestId('history-score')).not.toBeInTheDocument();
  });
});
