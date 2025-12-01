/**
 * Billing Success Page Tests
 *
 * Phase 2, Week 5, Day 5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
const mockGet = vi.fn();

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Import after mocking
import BillingSuccessPage from './page';

// ================================================================
// TESTS
// ================================================================

describe('BillingSuccessPage', () => {
  beforeEach(() => {
    mockGet.mockReturnValue(null);
    mockPush.mockClear();
  });

  describe('Rendering', () => {
    it('should render success message for starter plan', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText('Welcome to Starter!')).toBeInTheDocument();
    });

    it('should render success message for pro plan', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'pro';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText('Welcome to Pro!')).toBeInTheDocument();
    });

    it('should display subscription active message', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(
        screen.getByText(/Your subscription is now active/)
      ).toBeInTheDocument();
    });

    it('should default to starter when no plan specified', () => {
      mockGet.mockReturnValue(null);
      render(<BillingSuccessPage />);

      expect(screen.getByText('Welcome to Starter!')).toBeInTheDocument();
    });
  });

  describe('Features Display', () => {
    it('should display starter plan features', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText(/100 analyses per month/)).toBeInTheDocument();
    });

    it('should display pro plan features', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'pro';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText(/500 analyses per month/)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should have dashboard link', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      const dashboardLink = screen.getByRole('link', {
        name: /Go to Dashboard/,
      });
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
    });

    it('should have analyze link', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      const analyzeLink = screen.getByRole('link', {
        name: /Start New Analysis/,
      });
      expect(analyzeLink).toHaveAttribute('href', '/analyze');
    });

    it('should show redirect notice', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText(/Redirecting to dashboard/)).toBeInTheDocument();
    });
  });

  describe('Session ID', () => {
    it('should display session ID when provided', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'session_id') return 'cs_test_123456789abcdefghijk';
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText(/Session:/)).toBeInTheDocument();
    });

    it('should not display session section when no session_id', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'starter';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.queryByText(/Session:/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid plan ID gracefully', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'invalid_plan';
        return null;
      });
      render(<BillingSuccessPage />);

      // Should fall back to starter
      expect(screen.getByText('Welcome to Starter!')).toBeInTheDocument();
    });

    it('should handle free plan in URL', () => {
      mockGet.mockImplementation((key: string) => {
        if (key === 'plan') return 'free';
        return null;
      });
      render(<BillingSuccessPage />);

      expect(screen.getByText('Welcome to Free!')).toBeInTheDocument();
    });
  });
});
