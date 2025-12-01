/**
 * Share Buttons Component Tests
 *
 * Phase 2, Week 7, Day 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ShareButtons } from './ShareButtons';
import type { ShareContent } from '@/lib/social';

// ================================================================
// MOCK DATA
// ================================================================

const mockContent: ShareContent = {
  brandName: 'Test Brand',
  score: 85,
  rank: 3,
  category: 'Technology',
  url: 'https://example.com/brand/test',
};

const defaultProps = {
  content: mockContent,
  baseUrl: 'https://aiperception.com',
  brandId: 'test-brand',
};

// ================================================================
// MOCKS
// ================================================================

beforeEach(() => {
  // Mock window.open
  vi.spyOn(window, 'open').mockImplementation(() => null);

  // Mock clipboard
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });

  // Mock console.log for share tracking
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ================================================================
// TESTS
// ================================================================

describe('ShareButtons', () => {
  describe('Rendering', () => {
    it('should render all share buttons', () => {
      render(<ShareButtons {...defaultProps} />);

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    it('should render with testid', () => {
      render(<ShareButtons {...defaultProps} />);

      expect(screen.getByTestId('share-buttons')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<ShareButtons {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('share-buttons')).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should render horizontal by default', () => {
      render(<ShareButtons {...defaultProps} />);

      expect(screen.getByTestId('share-buttons')).toHaveClass('flex-row');
    });

    it('should render vertical when specified', () => {
      render(<ShareButtons {...defaultProps} variant="vertical" />);

      expect(screen.getByTestId('share-buttons')).toHaveClass('flex-col');
    });
  });

  describe('Labels', () => {
    it('should show labels by default', () => {
      render(<ShareButtons {...defaultProps} />);

      expect(screen.getByText('Share on X')).toBeInTheDocument();
      expect(screen.getByText('Share on LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Copy')).toBeInTheDocument();
    });

    it('should hide labels when showLabels is false', () => {
      render(<ShareButtons {...defaultProps} showLabels={false} />);

      expect(screen.queryByText('Share on X')).not.toBeInTheDocument();
      expect(screen.queryByText('Share on LinkedIn')).not.toBeInTheDocument();
      expect(screen.queryByText('Copy')).not.toBeInTheDocument();
    });
  });

  describe('Twitter/X Share', () => {
    it('should open Twitter share window on click', () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share on x/i }));

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com'),
        'share',
        expect.any(String)
      );
    });

    it('should track Twitter share event', () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share on x/i }));

      expect(console.log).toHaveBeenCalledWith(
        'Share event:',
        expect.objectContaining({
          platform: 'twitter',
          brandId: 'test-brand',
          score: 85,
        })
      );
    });
  });

  describe('LinkedIn Share', () => {
    it('should open LinkedIn share window on click', () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share on linkedin/i }));

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('linkedin.com'),
        'share',
        expect.any(String)
      );
    });

    it('should track LinkedIn share event', () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /share on linkedin/i }));

      expect(console.log).toHaveBeenCalledWith(
        'Share event:',
        expect.objectContaining({
          platform: 'linkedin',
          brandId: 'test-brand',
          score: 85,
        })
      );
    });
  });

  describe('Copy Functionality', () => {
    it('should copy text to clipboard on click', async () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
    });

    it('should show "Copied!" after successful copy', async () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('should track copy event', async () => {
      render(<ShareButtons {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(console.log).toHaveBeenCalledWith(
          'Share event:',
          expect.objectContaining({
            platform: 'copy',
            brandId: 'test-brand',
            score: 85,
          })
        );
      });
    });

  });

  describe('Accessibility', () => {
    it('should have accessible labels on all buttons', () => {
      render(<ShareButtons {...defaultProps} showLabels={false} />);

      expect(screen.getByRole('button', { name: /share on x/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share on linkedin/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });
  });
});
