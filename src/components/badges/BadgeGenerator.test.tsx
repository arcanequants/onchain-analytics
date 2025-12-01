/**
 * Badge Generator Component Tests
 *
 * Phase 2, Week 7, Day 1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BadgeGenerator } from './BadgeGenerator';

describe('BadgeGenerator', () => {
  const defaultProps = {
    brandId: 'test-brand',
    brandName: 'Test Brand',
    score: 85,
    baseUrl: 'https://example.com',
  };

  describe('Rendering', () => {
    it('should render preview image', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const img = screen.getByRole('img');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src');
      expect(img).toHaveAttribute('alt', 'Test Brand AI Score: 85/100');
    });

    it('should render style selector', () => {
      render(<BadgeGenerator {...defaultProps} />);

      expect(screen.getByRole('combobox', { name: /style/i })).toBeInTheDocument();
    });

    it('should render size buttons', () => {
      render(<BadgeGenerator {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Small' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Medium' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Large' })).toBeInTheDocument();
    });

    it('should render label input', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const input = screen.getByPlaceholderText('AI Score');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('AI Score');
    });

    it('should render embed code sections', () => {
      render(<BadgeGenerator {...defaultProps} />);

      expect(screen.getByText('HTML Embed Code')).toBeInTheDocument();
      expect(screen.getByText('Markdown Embed Code')).toBeInTheDocument();
      expect(screen.getByText('Direct Image URL')).toBeInTheDocument();
    });
  });

  describe('Configuration', () => {
    it('should update style when changed', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const select = screen.getByRole('combobox', { name: /style/i });
      fireEvent.change(select, { target: { value: 'plastic' } });

      expect(select).toHaveValue('plastic');
    });

    it('should update size when button clicked', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const largeButton = screen.getByRole('button', { name: 'Large' });
      fireEvent.click(largeButton);

      // Check that large button has active styling
      expect(largeButton).toHaveClass('bg-blue-600');
    });

    it('should update label when input changes', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const input = screen.getByPlaceholderText('AI Score');
      fireEvent.change(input, { target: { value: 'Brand Score' } });

      expect(input).toHaveValue('Brand Score');
    });
  });

  describe('Embed Codes', () => {
    it('should generate correct badge URL', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const codes = screen.getAllByRole('code');
      const urlCode = codes.find((code) => code.textContent?.includes('/api/badge/test-brand'));
      expect(urlCode).toBeTruthy();
    });

    it('should include brand ID in URL', () => {
      render(<BadgeGenerator {...defaultProps} />);

      // Find the pre element containing the direct URL
      const codes = screen.getAllByRole('code');
      const urlCode = codes.find((code) => code.textContent?.includes('/api/badge/test-brand'));
      expect(urlCode).toBeTruthy();
    });

    it('should generate HTML embed with link', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const codes = screen.getAllByRole('code');
      const htmlCode = codes.find((code) => code.textContent?.includes('<a href'));
      expect(htmlCode).toBeTruthy();
      expect(htmlCode?.textContent).toContain('target="_blank"');
    });

    it('should generate Markdown embed', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const codes = screen.getAllByRole('code');
      const mdCode = codes.find((code) => code.textContent?.includes('[!['));
      expect(mdCode).toBeTruthy();
    });
  });

  describe('Copy Buttons', () => {
    it('should render copy buttons', () => {
      render(<BadgeGenerator {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Copy HTML' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy Markdown' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Copy URL' })).toBeInTheDocument();
    });

    it('should show "Copied!" after clicking copy', async () => {
      // Mock clipboard
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });

      render(<BadgeGenerator {...defaultProps} />);

      const copyButton = screen.getByRole('button', { name: 'Copy HTML' });
      fireEvent.click(copyButton);

      // Wait for state update
      await vi.waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('Tips Section', () => {
    it('should render tips section', () => {
      render(<BadgeGenerator {...defaultProps} />);

      expect(screen.getByText('Tips for using your badge')).toBeInTheDocument();
      expect(screen.getByText(/Add the badge to your website/)).toBeInTheDocument();
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <BadgeGenerator {...defaultProps} className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('URL Generation', () => {
    it('should update URL when style changes', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const select = screen.getByRole('combobox', { name: /style/i });
      fireEvent.change(select, { target: { value: 'for-the-badge' } });

      const codes = screen.getAllByRole('code');
      const urlCode = codes.find((code) => code.textContent?.includes('style=for-the-badge'));
      expect(urlCode).toBeTruthy();
    });

    it('should update URL when size changes', () => {
      render(<BadgeGenerator {...defaultProps} />);

      fireEvent.click(screen.getByRole('button', { name: 'Large' }));

      const codes = screen.getAllByRole('code');
      const urlCode = codes.find((code) => code.textContent?.includes('size=large'));
      expect(urlCode).toBeTruthy();
    });

    it('should update URL when label changes', () => {
      render(<BadgeGenerator {...defaultProps} />);

      const input = screen.getByPlaceholderText('AI Score');
      fireEvent.change(input, { target: { value: 'My Score' } });

      const codes = screen.getAllByRole('code');
      const urlCode = codes.find((code) => code.textContent?.includes('label=My+Score'));
      expect(urlCode).toBeTruthy();
    });
  });
});
