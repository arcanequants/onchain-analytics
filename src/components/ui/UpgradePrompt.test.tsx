/**
 * UpgradePrompt Component Tests
 *
 * Phase 2, Week 4, Day 1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradePrompt, UsageProgress } from './UpgradePrompt';
import type { UpgradeTrigger } from '@/lib/freemium';

// ================================================================
// TEST DATA
// ================================================================

const mockTrigger: UpgradeTrigger = {
  type: 'quota_reached',
  feature: 'analyses',
  recommendedPlan: 'starter',
  message: "You've used all your monthly analyses",
  ctaText: 'Upgrade for unlimited analyses',
  urgency: 'high',
};

// ================================================================
// UPGRADE PROMPT TESTS
// ================================================================

describe('UpgradePrompt', () => {
  describe('inline variant (default)', () => {
    it('should render inline prompt', () => {
      render(<UpgradePrompt title="Upgrade now" onCtaClick={() => {}} />);

      expect(screen.getByTestId('upgrade-inline')).toBeInTheDocument();
      expect(screen.getByText('Upgrade now')).toBeInTheDocument();
    });

    it('should display title and description', () => {
      render(
        <UpgradePrompt
          title="Get more features"
          description="Unlock all AI providers"
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByText('Get more features')).toBeInTheDocument();
      expect(screen.getByText('Unlock all AI providers')).toBeInTheDocument();
    });

    it('should trigger CTA click handler', () => {
      const handleClick = vi.fn();
      render(<UpgradePrompt title="Upgrade" onCtaClick={handleClick} />);

      fireEvent.click(screen.getByTestId('upgrade-cta'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render CTA as link when ctaHref provided', () => {
      render(<UpgradePrompt title="Upgrade" ctaHref="/pricing" />);

      const cta = screen.getByTestId('upgrade-cta');
      expect(cta).toHaveAttribute('href', '/pricing');
    });

    it('should be dismissible when enabled', () => {
      const handleDismiss = vi.fn();
      render(
        <UpgradePrompt
          title="Upgrade"
          onCtaClick={() => {}}
          dismissible
          onDismiss={handleDismiss}
        />
      );

      const dismissBtn = screen.getByTestId('dismiss-button');
      fireEvent.click(dismissBtn);

      expect(handleDismiss).toHaveBeenCalled();
      expect(screen.queryByTestId('upgrade-inline')).not.toBeInTheDocument();
    });
  });

  describe('banner variant', () => {
    it('should render banner prompt', () => {
      render(
        <UpgradePrompt
          variant="banner"
          title="Special offer"
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('upgrade-banner')).toBeInTheDocument();
    });

    it('should position at top when specified', () => {
      render(
        <UpgradePrompt
          variant="banner"
          position="top"
          title="Upgrade"
          onCtaClick={() => {}}
        />
      );

      const banner = screen.getByTestId('upgrade-banner');
      expect(banner).toHaveClass('sticky');
      expect(banner).toHaveClass('top-0');
    });

    it('should position at bottom when specified', () => {
      render(
        <UpgradePrompt
          variant="banner"
          position="bottom"
          title="Upgrade"
          onCtaClick={() => {}}
        />
      );

      const banner = screen.getByTestId('upgrade-banner');
      expect(banner).toHaveClass('fixed');
      expect(banner).toHaveClass('bottom-0');
    });
  });

  describe('toast variant', () => {
    it('should render toast prompt', () => {
      render(
        <UpgradePrompt
          variant="toast"
          title="Limited time offer"
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('upgrade-toast')).toBeInTheDocument();
    });

    it('should show secondary action', () => {
      const handleSecondary = vi.fn();
      render(
        <UpgradePrompt
          variant="toast"
          title="Upgrade"
          onCtaClick={() => {}}
          secondaryText="Maybe later"
          onSecondaryClick={handleSecondary}
        />
      );

      const secondaryBtn = screen.getByTestId('secondary-action');
      expect(secondaryBtn).toHaveTextContent('Maybe later');

      fireEvent.click(secondaryBtn);
      expect(handleSecondary).toHaveBeenCalled();
    });
  });

  describe('card variant', () => {
    it('should render card prompt', () => {
      render(
        <UpgradePrompt
          variant="card"
          title="Upgrade to Pro"
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('upgrade-card')).toBeInTheDocument();
    });

    it('should show pricing when enabled', () => {
      render(
        <UpgradePrompt
          variant="card"
          title="Upgrade"
          recommendedPlan="starter"
          showPricing
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('pricing-section')).toBeInTheDocument();
      expect(screen.getByText('$29/month')).toBeInTheDocument();
    });

    it('should show features list when enabled', () => {
      render(
        <UpgradePrompt
          variant="card"
          title="Upgrade"
          recommendedPlan="starter"
          showFeatures
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('features-list')).toBeInTheDocument();
      expect(screen.getByText('100 analyses/month')).toBeInTheDocument();
    });

    it('should highlight specified features', () => {
      render(
        <UpgradePrompt
          variant="card"
          title="Upgrade"
          recommendedPlan="starter"
          showFeatures
          highlightFeatures={['Export reports']}
          onCtaClick={() => {}}
        />
      );

      const exportFeature = screen.getByText('Export reports');
      expect(exportFeature).toHaveClass('text-blue-600');
    });
  });

  describe('modal variant', () => {
    it('should render modal prompt', () => {
      render(
        <UpgradePrompt
          variant="modal"
          title="Upgrade Required"
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });

    it('should have overlay background', () => {
      render(
        <UpgradePrompt
          variant="modal"
          title="Upgrade"
          onCtaClick={() => {}}
        />
      );

      const modal = screen.getByTestId('upgrade-modal');
      expect(modal).toHaveClass('bg-black/50');
    });
  });

  describe('with trigger data', () => {
    it('should use trigger message as title', () => {
      render(
        <UpgradePrompt trigger={mockTrigger} onCtaClick={() => {}} />
      );

      expect(
        screen.getByText("You've used all your monthly analyses")
      ).toBeInTheDocument();
    });

    it('should use trigger ctaText', () => {
      render(
        <UpgradePrompt trigger={mockTrigger} onCtaClick={() => {}} />
      );

      expect(screen.getByTestId('upgrade-cta')).toHaveTextContent(
        'Upgrade for unlimited analyses'
      );
    });

    it('should use trigger recommendedPlan', () => {
      render(
        <UpgradePrompt
          trigger={mockTrigger}
          variant="card"
          showPricing
          onCtaClick={() => {}}
        />
      );

      // Should show Starter pricing
      expect(screen.getByText('$29/month')).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('should apply small size', () => {
      render(
        <UpgradePrompt
          title="Upgrade"
          size="sm"
          onCtaClick={() => {}}
        />
      );

      const prompt = screen.getByTestId('upgrade-inline');
      expect(prompt).toHaveClass('text-sm');
      expect(prompt).toHaveClass('p-3');
    });

    it('should apply medium size', () => {
      render(
        <UpgradePrompt
          title="Upgrade"
          size="md"
          onCtaClick={() => {}}
        />
      );

      const prompt = screen.getByTestId('upgrade-inline');
      expect(prompt).toHaveClass('text-base');
      expect(prompt).toHaveClass('p-4');
    });

    it('should apply large size', () => {
      render(
        <UpgradePrompt
          title="Upgrade"
          size="lg"
          onCtaClick={() => {}}
        />
      );

      const prompt = screen.getByTestId('upgrade-inline');
      expect(prompt).toHaveClass('text-lg');
      expect(prompt).toHaveClass('p-6');
    });
  });

  describe('custom icon', () => {
    it('should render custom icon', () => {
      render(
        <UpgradePrompt
          title="Upgrade"
          icon={<span data-testid="custom-icon">Icon</span>}
          onCtaClick={() => {}}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});

// ================================================================
// USAGE PROGRESS TESTS
// ================================================================

describe('UsageProgress', () => {
  it('should render progress bar', () => {
    render(<UsageProgress used={50} limit={100} />);

    expect(screen.getByTestId('usage-progress')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();
  });

  it('should display usage numbers', () => {
    render(<UsageProgress used={25} limit={100} label="Analyses" />);

    expect(screen.getByText('Analyses')).toBeInTheDocument();
    expect(screen.getByText(/25 \/ 100/)).toBeInTheDocument();
  });

  it('should show percentage when enabled', () => {
    render(<UsageProgress used={50} limit={100} showPercent />);

    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('should hide percentage when disabled', () => {
    render(<UsageProgress used={50} limit={100} showPercent={false} />);

    expect(screen.queryByText(/50%/)).not.toBeInTheDocument();
  });

  it('should show warning color at threshold', () => {
    render(<UsageProgress used={75} limit={100} warningThreshold={70} />);

    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveClass('bg-amber-500');
  });

  it('should show danger color at threshold', () => {
    render(<UsageProgress used={95} limit={100} dangerThreshold={90} />);

    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveClass('bg-red-500');
  });

  it('should show normal color under threshold', () => {
    render(<UsageProgress used={50} limit={100} />);

    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveClass('bg-blue-500');
  });

  it('should show upgrade CTA when at danger level', () => {
    const handleUpgrade = vi.fn();
    render(
      <UsageProgress
        used={95}
        limit={100}
        showUpgradeCta
        onUpgradeClick={handleUpgrade}
      />
    );

    const cta = screen.getByTestId('usage-upgrade-cta');
    expect(cta).toBeInTheDocument();

    fireEvent.click(cta);
    expect(handleUpgrade).toHaveBeenCalled();
  });

  it('should not show upgrade CTA under danger level', () => {
    render(
      <UsageProgress
        used={50}
        limit={100}
        showUpgradeCta
        onUpgradeClick={() => {}}
      />
    );

    expect(screen.queryByTestId('usage-upgrade-cta')).not.toBeInTheDocument();
  });

  it('should handle unlimited limit', () => {
    render(<UsageProgress used={1000} limit={Infinity} />);

    expect(screen.getByText(/1000 \/ Unlimited/)).toBeInTheDocument();
  });

  it('should cap percentage at 100%', () => {
    render(<UsageProgress used={150} limit={100} />);

    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveStyle({ width: '100%' });
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('UpgradePrompt integration', () => {
  it('should work in freemium quota scenario', () => {
    const handleUpgrade = vi.fn();

    render(
      <div>
        <UsageProgress
          used={5}
          limit={5}
          label="Monthly analyses"
          onUpgradeClick={handleUpgrade}
        />
        <UpgradePrompt
          trigger={{
            type: 'quota_reached',
            feature: 'analyses',
            recommendedPlan: 'starter',
            message: 'You have used all 5 free analyses',
            ctaText: 'Upgrade to Starter',
            urgency: 'high',
          }}
          variant="inline"
          onCtaClick={handleUpgrade}
        />
      </div>
    );

    // Progress bar shows limit reached
    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveClass('bg-red-500');

    // Upgrade CTA is visible
    expect(screen.getByTestId('usage-upgrade-cta')).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-cta')).toHaveTextContent('Upgrade to Starter');

    // Clicking upgrade works
    fireEvent.click(screen.getByTestId('upgrade-cta'));
    expect(handleUpgrade).toHaveBeenCalled();
  });

  it('should work in feature-locked scenario', () => {
    const handleUpgrade = vi.fn();

    render(
      <UpgradePrompt
        trigger={{
          type: 'feature_locked',
          feature: 'competitors',
          recommendedPlan: 'starter',
          message: 'Unlock competitor analysis',
          ctaText: 'Upgrade to compare',
          urgency: 'medium',
        }}
        variant="card"
        showFeatures
        highlightFeatures={['3 competitor comparisons']}
        onCtaClick={handleUpgrade}
      />
    );

    expect(screen.getByText('Unlock competitor analysis')).toBeInTheDocument();
    expect(screen.getByTestId('features-list')).toBeInTheDocument();

    // Feature is highlighted
    const highlightedFeature = screen.getByText('3 competitor comparisons');
    expect(highlightedFeature).toHaveClass('text-blue-600');
  });

  it('should work in approaching limit scenario', () => {
    render(
      <div>
        <UsageProgress
          used={80}
          limit={100}
          label="API calls"
          warningThreshold={70}
        />
        <UpgradePrompt
          trigger={{
            type: 'limit_approaching',
            feature: 'analyses',
            recommendedPlan: 'pro',
            message: 'Only 20 analyses remaining',
            ctaText: 'Upgrade to Pro',
            urgency: 'medium',
          }}
          variant="toast"
          dismissible
          onCtaClick={() => {}}
        />
      </div>
    );

    // Warning color on progress
    const bar = screen.getByTestId('progress-bar');
    expect(bar).toHaveClass('bg-amber-500');

    // Toast is visible and dismissible
    expect(screen.getByTestId('upgrade-toast')).toBeInTheDocument();
    expect(screen.getByTestId('dismiss-button')).toBeInTheDocument();
  });
});
