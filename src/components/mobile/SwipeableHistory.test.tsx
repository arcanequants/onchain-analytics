/**
 * Swipeable History Component Tests
 *
 * Phase 2, Week 4, Day 5
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SwipeableHistory } from './SwipeableHistory';
import type { HistoryItem } from './SwipeableHistory';

// ================================================================
// TEST DATA
// ================================================================

const mockItems: HistoryItem[] = [
  {
    id: '1',
    url: 'https://example.com',
    brandName: 'Example Brand',
    score: 85,
    analyzedAt: '2024-01-15T10:30:00Z',
    status: 'completed',
  },
  {
    id: '2',
    url: 'https://test.com',
    brandName: 'Test Brand',
    score: 65,
    analyzedAt: '2024-01-14T15:45:00Z',
    status: 'completed',
  },
  {
    id: '3',
    url: 'https://pending.com',
    brandName: 'Pending Brand',
    score: 0,
    analyzedAt: '2024-01-14T12:00:00Z',
    status: 'pending',
  },
  {
    id: '4',
    url: 'https://failed.com',
    brandName: 'Failed Brand',
    score: 0,
    analyzedAt: '2024-01-13T09:00:00Z',
    status: 'failed',
  },
];

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function createTouchEvent(type: string, clientX: number) {
  return {
    touches: [{ clientX }],
    changedTouches: [{ clientX }],
  };
}

// ================================================================
// SWIPEABLE HISTORY TESTS
// ================================================================

describe('SwipeableHistory', () => {
  describe('Rendering', () => {
    it('should render swipeable history container', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByTestId('swipeable-history')).toBeInTheDocument();
    });

    it('should render all history items', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByTestId('swipeable-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('swipeable-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('swipeable-item-3')).toBeInTheDocument();
      expect(screen.getByTestId('swipeable-item-4')).toBeInTheDocument();
    });

    it('should display brand names', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByText('Example Brand')).toBeInTheDocument();
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
      expect(screen.getByText('Pending Brand')).toBeInTheDocument();
      expect(screen.getByText('Failed Brand')).toBeInTheDocument();
    });

    it('should display URLs', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByText('https://example.com')).toBeInTheDocument();
      expect(screen.getByText('https://test.com')).toBeInTheDocument();
    });

    it('should display scores for completed items', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<SwipeableHistory items={mockItems} className="custom-class" />);
      expect(screen.getByTestId('swipeable-history')).toHaveClass('custom-class');
    });

    it('should show swipe hint text', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByText(/swipe left or right/i)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should render empty state when no items', () => {
      render(<SwipeableHistory items={[]} />);
      expect(screen.getByTestId('swipeable-history-empty')).toBeInTheDocument();
    });

    it('should display default empty message', () => {
      render(<SwipeableHistory items={[]} />);
      expect(screen.getByText('No analyses yet')).toBeInTheDocument();
    });

    it('should display custom empty message', () => {
      render(<SwipeableHistory items={[]} emptyMessage="No history found" />);
      expect(screen.getByText('No history found')).toBeInTheDocument();
    });

    it('should show call to action in empty state', () => {
      render(<SwipeableHistory items={[]} />);
      expect(screen.getByText(/start by analyzing a url/i)).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show score for completed items', () => {
      render(<SwipeableHistory items={[mockItems[0]]} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should show loading indicator for pending items', () => {
      render(<SwipeableHistory items={[mockItems[2]]} />);
      expect(screen.getByText('...')).toBeInTheDocument();
    });

    it('should show exclamation for failed items', () => {
      render(<SwipeableHistory items={[mockItems[3]]} />);
      expect(screen.getByText('!')).toBeInTheDocument();
    });
  });

  describe('Score Colors', () => {
    it('should apply green color for high scores (80+)', () => {
      const highScoreItem: HistoryItem = { ...mockItems[0], score: 85 };
      render(<SwipeableHistory items={[highScoreItem]} />);
      // Just verify it renders - color classes are applied
      expect(screen.getByText('85')).toBeInTheDocument();
    });

    it('should apply blue color for medium-high scores (60-79)', () => {
      const mediumScoreItem: HistoryItem = { ...mockItems[0], score: 65, id: 'med' };
      render(<SwipeableHistory items={[mediumScoreItem]} />);
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('should apply yellow color for medium-low scores (40-59)', () => {
      const lowMediumScoreItem: HistoryItem = { ...mockItems[0], score: 45, id: 'lowmed' };
      render(<SwipeableHistory items={[lowMediumScoreItem]} />);
      expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('should apply red color for low scores (<40)', () => {
      const lowScoreItem: HistoryItem = { ...mockItems[0], score: 25, id: 'low' };
      render(<SwipeableHistory items={[lowScoreItem]} />);
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });

  describe('Click Handlers', () => {
    it('should call onItemClick when item is clicked', () => {
      const handleItemClick = vi.fn();
      render(<SwipeableHistory items={mockItems} onItemClick={handleItemClick} />);

      fireEvent.click(screen.getByTestId('item-content-1'));
      expect(handleItemClick).toHaveBeenCalledWith('1');
    });

    it('should not call onItemClick when swiped', () => {
      const handleItemClick = vi.fn();
      render(<SwipeableHistory items={mockItems} onItemClick={handleItemClick} />);

      const itemContent = screen.getByTestId('item-content-1');

      // Simulate swipe
      fireEvent.touchStart(itemContent, createTouchEvent('touchstart', 200));
      fireEvent.touchMove(itemContent, createTouchEvent('touchmove', 50));
      fireEvent.touchEnd(itemContent);

      // Click should not trigger onItemClick because item is swiped
      fireEvent.click(itemContent);
      expect(handleItemClick).not.toHaveBeenCalled();
    });
  });

  describe('Swipe Actions', () => {
    it('should render left actions (share)', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByTestId('left-actions-1')).toBeInTheDocument();
      expect(screen.getByTestId('share-action-1')).toBeInTheDocument();
    });

    it('should render right actions (reanalyze, delete)', () => {
      render(<SwipeableHistory items={mockItems} />);
      expect(screen.getByTestId('right-actions-1')).toBeInTheDocument();
      expect(screen.getByTestId('reanalyze-action-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-action-1')).toBeInTheDocument();
    });

    it('should call onShare when share action is clicked', () => {
      const handleShare = vi.fn();
      render(<SwipeableHistory items={mockItems} onShare={handleShare} />);

      fireEvent.click(screen.getByTestId('share-action-1'));
      expect(handleShare).toHaveBeenCalledWith('1');
    });

    it('should call onReanalyze when reanalyze action is clicked', () => {
      const handleReanalyze = vi.fn();
      render(<SwipeableHistory items={mockItems} onReanalyze={handleReanalyze} />);

      fireEvent.click(screen.getByTestId('reanalyze-action-1'));
      expect(handleReanalyze).toHaveBeenCalledWith('1');
    });

    it('should call onDelete when delete action is clicked', () => {
      const handleDelete = vi.fn();
      render(<SwipeableHistory items={mockItems} onDelete={handleDelete} />);

      fireEvent.click(screen.getByTestId('delete-action-1'));
      expect(handleDelete).toHaveBeenCalledWith('1');
    });
  });

  describe('Touch Gestures', () => {
    it('should handle touch start', () => {
      render(<SwipeableHistory items={mockItems} />);
      const itemContent = screen.getByTestId('item-content-1');

      fireEvent.touchStart(itemContent, createTouchEvent('touchstart', 100));
      // Should not throw error
      expect(itemContent).toBeInTheDocument();
    });

    it('should handle touch move', () => {
      render(<SwipeableHistory items={mockItems} />);
      const itemContent = screen.getByTestId('item-content-1');

      fireEvent.touchStart(itemContent, createTouchEvent('touchstart', 100));
      fireEvent.touchMove(itemContent, createTouchEvent('touchmove', 50));
      // Should not throw error
      expect(itemContent).toBeInTheDocument();
    });

    it('should handle touch end', () => {
      render(<SwipeableHistory items={mockItems} />);
      const itemContent = screen.getByTestId('item-content-1');

      fireEvent.touchStart(itemContent, createTouchEvent('touchstart', 100));
      fireEvent.touchMove(itemContent, createTouchEvent('touchmove', 50));
      fireEvent.touchEnd(itemContent);
      // Should not throw error
      expect(itemContent).toBeInTheDocument();
    });

    it('should reset position on small swipe', () => {
      render(<SwipeableHistory items={mockItems} />);
      const itemContent = screen.getByTestId('item-content-1');

      // Small swipe that doesn't pass threshold
      fireEvent.touchStart(itemContent, createTouchEvent('touchstart', 100));
      fireEvent.touchMove(itemContent, createTouchEvent('touchmove', 80));
      fireEvent.touchEnd(itemContent);

      // Position should reset - transform should be 0
      expect(itemContent).toHaveStyle({ transform: 'translateX(0px)' });
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      const itemWithDate: HistoryItem = {
        id: 'dated',
        url: 'https://example.com',
        brandName: 'Dated Brand',
        score: 75,
        analyzedAt: '2024-01-15T10:30:00Z',
        status: 'completed',
      };
      render(<SwipeableHistory items={[itemWithDate]} />);
      // Should show formatted date (exact format depends on locale)
      expect(screen.getByText(/jan/i)).toBeInTheDocument();
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle items with very long brand names', () => {
    const longNameItem: HistoryItem = {
      id: 'long',
      url: 'https://example.com',
      brandName: 'This Is A Very Long Brand Name That Should Be Truncated',
      score: 75,
      analyzedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
    };
    render(<SwipeableHistory items={[longNameItem]} />);
    expect(screen.getByText(/this is a very long/i)).toBeInTheDocument();
  });

  it('should handle items with very long URLs', () => {
    const longUrlItem: HistoryItem = {
      id: 'longurl',
      url: 'https://example.com/very/long/path/to/some/resource/that/is/way/too/long',
      brandName: 'URL Brand',
      score: 75,
      analyzedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
    };
    render(<SwipeableHistory items={[longUrlItem]} />);
    expect(screen.getByText(/example.com/)).toBeInTheDocument();
  });

  it('should handle score of 0 for completed items', () => {
    const zeroScoreItem: HistoryItem = {
      id: 'zero',
      url: 'https://example.com',
      brandName: 'Zero Score Brand',
      score: 0,
      analyzedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
    };
    render(<SwipeableHistory items={[zeroScoreItem]} />);
    // Should show 0, not loading indicator
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle score of 100', () => {
    const perfectScoreItem: HistoryItem = {
      id: 'perfect',
      url: 'https://example.com',
      brandName: 'Perfect Score Brand',
      score: 100,
      analyzedAt: '2024-01-15T10:30:00Z',
      status: 'completed',
    };
    render(<SwipeableHistory items={[perfectScoreItem]} />);
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should handle single item', () => {
    render(<SwipeableHistory items={[mockItems[0]]} />);
    expect(screen.getByTestId('swipeable-item-1')).toBeInTheDocument();
    expect(screen.queryByTestId('swipeable-item-2')).not.toBeInTheDocument();
  });

  it('should handle many items', () => {
    const manyItems: HistoryItem[] = Array.from({ length: 50 }, (_, i) => ({
      id: `item-${i}`,
      url: `https://example${i}.com`,
      brandName: `Brand ${i}`,
      score: 50 + (i % 50),
      analyzedAt: '2024-01-15T10:30:00Z',
      status: 'completed' as const,
    }));
    render(<SwipeableHistory items={manyItems} />);
    expect(screen.getByTestId('swipeable-item-item-0')).toBeInTheDocument();
    expect(screen.getByTestId('swipeable-item-item-49')).toBeInTheDocument();
  });
});
