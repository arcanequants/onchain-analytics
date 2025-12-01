/**
 * Pricing Card Component Tests
 *
 * Phase 2, Week 5, Day 4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingCard, BillingToggle } from './PricingCard';
import { PLANS } from '@/lib/stripe/config';

// ================================================================
// PRICING CARD TESTS
// ================================================================

describe('PricingCard', () => {
  describe('Rendering', () => {
    it('should render pricing card', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByTestId('pricing-card-starter')).toBeInTheDocument();
    });

    it('should display plan name', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByTestId('plan-name-starter')).toHaveTextContent('Starter');
    });

    it('should display plan description', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByTestId('plan-description-starter')).toHaveTextContent(
        'For growing businesses'
      );
    });

    it('should display plan price', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByTestId('plan-price-starter')).toHaveTextContent('$29');
    });

    it('should apply custom className', () => {
      render(<PricingCard plan={PLANS.starter} className="custom-class" />);
      expect(screen.getByTestId('pricing-card-starter')).toHaveClass('custom-class');
    });
  });

  describe('Free Plan', () => {
    it('should render free plan with $0 price', () => {
      render(<PricingCard plan={PLANS.free} />);
      expect(screen.getByTestId('plan-price-free')).toHaveTextContent('$0');
    });

    it('should show "Get Started Free" button text', () => {
      render(<PricingCard plan={PLANS.free} />);
      expect(screen.getByTestId('select-plan-free')).toHaveTextContent(
        'Get Started Free'
      );
    });
  });

  describe('Popular Badge', () => {
    it('should show popular badge for pro plan', () => {
      render(<PricingCard plan={PLANS.pro} />);
      expect(screen.getByTestId('popular-badge-pro')).toBeInTheDocument();
      expect(screen.getByText('Most Popular')).toBeInTheDocument();
    });

    it('should not show popular badge for non-popular plans', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.queryByTestId('popular-badge-starter')).not.toBeInTheDocument();
    });
  });

  describe('Current Plan Badge', () => {
    it('should show current plan badge when isCurrentPlan is true', () => {
      render(<PricingCard plan={PLANS.starter} isCurrentPlan={true} />);
      expect(screen.getByTestId('current-plan-badge-starter')).toBeInTheDocument();
      // Multiple elements have "Current Plan" text (badge and button)
      expect(screen.getAllByText('Current Plan')).toHaveLength(2);
    });

    it('should not show current plan badge when isCurrentPlan is false', () => {
      render(<PricingCard plan={PLANS.starter} isCurrentPlan={false} />);
      expect(
        screen.queryByTestId('current-plan-badge-starter')
      ).not.toBeInTheDocument();
    });

    it('should show "Current Plan" in button when is current plan', () => {
      render(<PricingCard plan={PLANS.starter} isCurrentPlan={true} />);
      expect(screen.getByTestId('select-plan-starter')).toHaveTextContent(
        'Current Plan'
      );
    });
  });

  describe('Features', () => {
    it('should display all plan features', () => {
      render(<PricingCard plan={PLANS.starter} />);

      PLANS.starter.features.forEach((_, index) => {
        expect(
          screen.getByTestId(`feature-starter-${index}`)
        ).toBeInTheDocument();
      });
    });

    it('should show feature text correctly', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByText('100 analyses per month')).toBeInTheDocument();
    });
  });

  describe('Annual Billing', () => {
    it('should show monthly price when isAnnual is false', () => {
      render(<PricingCard plan={PLANS.starter} isAnnual={false} />);
      expect(screen.getByTestId('plan-price-starter')).toHaveTextContent('$29');
    });

    it('should show annual price per month when isAnnual is true', () => {
      render(<PricingCard plan={PLANS.starter} isAnnual={true} />);
      // $290/12 = $24.17, which should round to $24
      expect(screen.getByTestId('plan-price-starter')).toHaveTextContent('$24');
    });

    it('should show savings message for annual billing', () => {
      render(<PricingCard plan={PLANS.starter} isAnnual={true} />);
      expect(screen.getByTestId('annual-savings-starter')).toBeInTheDocument();
      expect(screen.getByText(/Save.*%/)).toBeInTheDocument();
    });

    it('should not show savings for free plan', () => {
      render(<PricingCard plan={PLANS.free} isAnnual={true} />);
      expect(
        screen.queryByTestId('annual-savings-free')
      ).not.toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should call onSelect when button is clicked', () => {
      const handleSelect = vi.fn();
      render(<PricingCard plan={PLANS.starter} onSelect={handleSelect} />);

      fireEvent.click(screen.getByTestId('select-plan-starter'));
      expect(handleSelect).toHaveBeenCalledWith('starter', false);
    });

    it('should pass isAnnual to onSelect', () => {
      const handleSelect = vi.fn();
      render(
        <PricingCard plan={PLANS.starter} onSelect={handleSelect} isAnnual={true} />
      );

      fireEvent.click(screen.getByTestId('select-plan-starter'));
      expect(handleSelect).toHaveBeenCalledWith('starter', true);
    });

    it('should not call onSelect when disabled', () => {
      const handleSelect = vi.fn();
      render(
        <PricingCard plan={PLANS.starter} onSelect={handleSelect} disabled={true} />
      );

      fireEvent.click(screen.getByTestId('select-plan-starter'));
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('should not call onSelect when loading', () => {
      const handleSelect = vi.fn();
      render(
        <PricingCard plan={PLANS.starter} onSelect={handleSelect} isLoading={true} />
      );

      fireEvent.click(screen.getByTestId('select-plan-starter'));
      expect(handleSelect).not.toHaveBeenCalled();
    });

    it('should not call onSelect when is current plan', () => {
      const handleSelect = vi.fn();
      render(
        <PricingCard
          plan={PLANS.starter}
          onSelect={handleSelect}
          isCurrentPlan={true}
        />
      );

      fireEvent.click(screen.getByTestId('select-plan-starter'));
      expect(handleSelect).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<PricingCard plan={PLANS.starter} isLoading={true} />);
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<PricingCard plan={PLANS.starter} isLoading={true} />);
      expect(screen.getByTestId('select-plan-starter')).toBeDisabled();
    });
  });

  describe('Button Text', () => {
    it('should show "Upgrade to X" for paid plans', () => {
      render(<PricingCard plan={PLANS.starter} />);
      expect(screen.getByTestId('select-plan-starter')).toHaveTextContent(
        'Upgrade to Starter'
      );
    });

    it('should show "Upgrade to Pro" for pro plan', () => {
      render(<PricingCard plan={PLANS.pro} />);
      expect(screen.getByTestId('select-plan-pro')).toHaveTextContent(
        'Upgrade to Pro'
      );
    });
  });
});

// ================================================================
// BILLING TOGGLE TESTS
// ================================================================

describe('BillingToggle', () => {
  it('should render billing toggle', () => {
    render(<BillingToggle isAnnual={false} onChange={() => {}} />);
    expect(screen.getByTestId('billing-toggle')).toBeInTheDocument();
  });

  it('should show Monthly and Annual labels', () => {
    render(<BillingToggle isAnnual={false} onChange={() => {}} />);
    expect(screen.getByText('Monthly')).toBeInTheDocument();
    expect(screen.getByText('Annual')).toBeInTheDocument();
  });

  it('should show savings message', () => {
    render(<BillingToggle isAnnual={false} onChange={() => {}} />);
    expect(screen.getByText('(Save 17%)')).toBeInTheDocument();
  });

  it('should call onChange when toggle is clicked', () => {
    const handleChange = vi.fn();
    render(<BillingToggle isAnnual={false} onChange={handleChange} />);

    fireEvent.click(screen.getByTestId('billing-toggle-button'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('should toggle from annual to monthly', () => {
    const handleChange = vi.fn();
    render(<BillingToggle isAnnual={true} onChange={handleChange} />);

    fireEvent.click(screen.getByTestId('billing-toggle-button'));
    expect(handleChange).toHaveBeenCalledWith(false);
  });

  it('should apply custom className', () => {
    render(
      <BillingToggle
        isAnnual={false}
        onChange={() => {}}
        className="custom-class"
      />
    );
    expect(screen.getByTestId('billing-toggle')).toHaveClass('custom-class');
  });

  it('should have correct aria-checked value', () => {
    const { rerender } = render(
      <BillingToggle isAnnual={false} onChange={() => {}} />
    );
    expect(screen.getByTestId('billing-toggle-button')).toHaveAttribute(
      'aria-checked',
      'false'
    );

    rerender(<BillingToggle isAnnual={true} onChange={() => {}} />);
    expect(screen.getByTestId('billing-toggle-button')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle all plan types', () => {
    Object.values(PLANS).forEach((plan) => {
      const { unmount } = render(<PricingCard plan={plan} />);
      expect(screen.getByTestId(`pricing-card-${plan.id}`)).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle rapid toggle clicks', () => {
    const handleChange = vi.fn();
    render(<BillingToggle isAnnual={false} onChange={handleChange} />);

    const button = screen.getByTestId('billing-toggle-button');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(handleChange).toHaveBeenCalledTimes(3);
  });
});
