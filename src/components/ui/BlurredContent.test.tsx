/**
 * BlurredContent Component Tests
 *
 * Phase 2, Week 4, Day 1
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BlurredContent, BlurredList, BlurredCard } from './BlurredContent';

// ================================================================
// BLURRED CONTENT TESTS
// ================================================================

describe('BlurredContent', () => {
  describe('unlocked state', () => {
    it('should render children without blur when unlocked', () => {
      render(
        <BlurredContent isLocked={false}>
          <div data-testid="content">Visible content</div>
        </BlurredContent>
      );

      const content = screen.getByTestId('content');
      expect(content).toBeInTheDocument();
      expect(content).toHaveTextContent('Visible content');

      // Should not have lock overlay
      expect(screen.queryByTestId('lock-overlay')).not.toBeInTheDocument();
    });

    it('should not apply blur classes when unlocked', () => {
      render(
        <BlurredContent isLocked={false}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.queryByTestId('blurred-content-inner')).not.toBeInTheDocument();
    });
  });

  describe('locked state', () => {
    it('should render with blur when locked', () => {
      render(
        <BlurredContent isLocked={true}>
          <div data-testid="content">Secret content</div>
        </BlurredContent>
      );

      const wrapper = screen.getByTestId('blurred-content');
      expect(wrapper).toBeInTheDocument();

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('blur-[4px]'); // default md intensity
    });

    it('should show lock overlay when locked', () => {
      render(
        <BlurredContent isLocked={true}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('lock-overlay')).toBeInTheDocument();
    });

    it('should display lock title', () => {
      render(
        <BlurredContent isLocked={true} lockTitle="Premium Feature">
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('lock-title')).toHaveTextContent('Premium Feature');
    });

    it('should display lock description', () => {
      render(
        <BlurredContent
          isLocked={true}
          lockDescription="Upgrade to access this feature"
        >
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('lock-description')).toHaveTextContent(
        'Upgrade to access this feature'
      );
    });

    it('should show CTA button with onClick', () => {
      const handleClick = vi.fn();

      render(
        <BlurredContent
          isLocked={true}
          ctaText="Upgrade Now"
          onCtaClick={handleClick}
        >
          <div>Content</div>
        </BlurredContent>
      );

      const cta = screen.getByTestId('upgrade-cta');
      expect(cta).toHaveTextContent('Upgrade Now');

      fireEvent.click(cta);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should show CTA link when ctaHref is provided', () => {
      render(
        <BlurredContent
          isLocked={true}
          ctaText="Go to Pricing"
          ctaHref="/pricing"
        >
          <div>Content</div>
        </BlurredContent>
      );

      const cta = screen.getByTestId('upgrade-cta');
      expect(cta).toHaveAttribute('href', '/pricing');
    });

    it('should display badge when provided', () => {
      render(
        <BlurredContent isLocked={true} badge="PRO">
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('upgrade-badge')).toHaveTextContent('PRO');
    });

    it('should display preview count', () => {
      render(
        <BlurredContent isLocked={true} previewCount={5}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('preview-count')).toHaveTextContent('5 more items');
    });

    it('should use singular for preview count of 1', () => {
      render(
        <BlurredContent isLocked={true} previewCount={1}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('preview-count')).toHaveTextContent('1 more item');
    });
  });

  describe('blur intensity', () => {
    it('should apply small blur intensity', () => {
      render(
        <BlurredContent isLocked={true} blurIntensity="sm">
          <div>Content</div>
        </BlurredContent>
      );

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('blur-[2px]');
    });

    it('should apply medium blur intensity', () => {
      render(
        <BlurredContent isLocked={true} blurIntensity="md">
          <div>Content</div>
        </BlurredContent>
      );

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('blur-[4px]');
    });

    it('should apply large blur intensity', () => {
      render(
        <BlurredContent isLocked={true} blurIntensity="lg">
          <div>Content</div>
        </BlurredContent>
      );

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('blur-[8px]');
    });
  });

  describe('variants', () => {
    it('should apply default variant styles', () => {
      render(
        <BlurredContent isLocked={true} variant="default">
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('lock-overlay')).toBeInTheDocument();
    });

    it('should apply minimal variant styles', () => {
      render(
        <BlurredContent isLocked={true} variant="minimal">
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('lock-overlay')).toBeInTheDocument();
    });

    it('should apply prominent variant styles', () => {
      render(
        <BlurredContent isLocked={true} variant="prominent">
          <div>Content</div>
        </BlurredContent>
      );

      const overlay = screen.getByTestId('lock-overlay');
      expect(overlay).toHaveClass('bg-black/10');
    });
  });

  describe('gradient fade', () => {
    it('should show gradient fade by default', () => {
      render(
        <BlurredContent isLocked={true}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('blurred-gradient')).toBeInTheDocument();
    });

    it('should hide gradient fade when disabled', () => {
      render(
        <BlurredContent isLocked={true} showGradientFade={false}>
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.queryByTestId('blurred-gradient')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have aria-hidden when locked', () => {
      render(
        <BlurredContent isLocked={true}>
          <div>Content</div>
        </BlurredContent>
      );

      const wrapper = screen.getByTestId('blurred-content');
      expect(wrapper).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have pointer-events-none on blurred content', () => {
      render(
        <BlurredContent isLocked={true}>
          <div>Content</div>
        </BlurredContent>
      );

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('pointer-events-none');
    });

    it('should have select-none on blurred content', () => {
      render(
        <BlurredContent isLocked={true}>
          <div>Content</div>
        </BlurredContent>
      );

      const blurredContent = screen.getByTestId('blurred-content-inner');
      expect(blurredContent).toHaveClass('select-none');
    });
  });

  describe('custom icon', () => {
    it('should render custom icon when provided', () => {
      render(
        <BlurredContent
          isLocked={true}
          icon={<span data-testid="custom-icon">Custom</span>}
        >
          <div>Content</div>
        </BlurredContent>
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });
});

// ================================================================
// BLURRED LIST TESTS
// ================================================================

describe('BlurredList', () => {
  const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];

  it('should render visible items without blur', () => {
    render(<BlurredList items={items} visibleCount={3} />);

    expect(screen.getByTestId('visible-item-0')).toHaveTextContent('Item 1');
    expect(screen.getByTestId('visible-item-1')).toHaveTextContent('Item 2');
    expect(screen.getByTestId('visible-item-2')).toHaveTextContent('Item 3');
  });

  it('should blur locked items', () => {
    render(<BlurredList items={items} visibleCount={3} />);

    expect(screen.getByTestId('blurred-content')).toBeInTheDocument();
  });

  it('should show preview count for locked items', () => {
    render(<BlurredList items={items} visibleCount={3} />);

    expect(screen.getByTestId('preview-count')).toHaveTextContent('2 more items');
  });

  it('should not show blurred content when all items visible', () => {
    render(<BlurredList items={items} visibleCount={5} />);

    expect(screen.queryByTestId('blurred-content')).not.toBeInTheDocument();
  });

  it('should use custom renderItem function', () => {
    render(
      <BlurredList
        items={items}
        visibleCount={2}
        renderItem={(item, index) => (
          <div data-testid={`custom-item-${index}`}>Custom: {item}</div>
        )}
      />
    );

    expect(screen.getByTestId('custom-item-0')).toHaveTextContent('Custom: Item 1');
  });

  it('should apply gap classes', () => {
    render(<BlurredList items={items} visibleCount={2} gap="lg" />);

    const list = screen.getByTestId('blurred-list');
    expect(list).toHaveClass('gap-6');
  });

  it('should pass lockProps to BlurredContent', () => {
    const handleClick = vi.fn();

    render(
      <BlurredList
        items={items}
        visibleCount={2}
        lockProps={{
          lockTitle: 'Custom Title',
          ctaText: 'Custom CTA',
          onCtaClick: handleClick,
        }}
      />
    );

    expect(screen.getByTestId('lock-title')).toHaveTextContent('Custom Title');
    expect(screen.getByTestId('upgrade-cta')).toHaveTextContent('Custom CTA');
  });
});

// ================================================================
// BLURRED CARD TESTS
// ================================================================

describe('BlurredCard', () => {
  it('should render card content', () => {
    render(
      <BlurredCard
        isLocked={false}
        content={<div data-testid="card-content">Card content</div>}
      />
    );

    expect(screen.getByTestId('card-content')).toBeInTheDocument();
  });

  it('should render card header', () => {
    render(
      <BlurredCard
        isLocked={false}
        header={<div data-testid="test-header">Header</div>}
        content={<div>Content</div>}
      />
    );

    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('test-header')).toHaveTextContent('Header');
  });

  it('should render card footer when unlocked', () => {
    render(
      <BlurredCard
        isLocked={false}
        content={<div>Content</div>}
        footer={<div data-testid="test-footer">Footer</div>}
      />
    );

    expect(screen.getByTestId('card-footer')).toBeInTheDocument();
    expect(screen.getByTestId('test-footer')).toHaveTextContent('Footer');
  });

  it('should not render footer when locked', () => {
    render(
      <BlurredCard
        isLocked={true}
        content={<div>Content</div>}
        footer={<div>Footer</div>}
      />
    );

    expect(screen.queryByTestId('card-footer')).not.toBeInTheDocument();
  });

  it('should blur content when locked', () => {
    render(
      <BlurredCard
        isLocked={true}
        content={<div>Secret content</div>}
      />
    );

    expect(screen.getByTestId('blurred-content')).toBeInTheDocument();
    expect(screen.getByTestId('lock-overlay')).toBeInTheDocument();
  });

  it('should apply padding classes', () => {
    render(
      <BlurredCard
        isLocked={false}
        content={<div>Content</div>}
        padding="lg"
      />
    );

    const card = screen.getByTestId('blurred-card');
    expect(card).toHaveClass('p-6');
  });

  it('should pass blur props through', () => {
    render(
      <BlurredCard
        isLocked={true}
        content={<div>Content</div>}
        lockTitle="Card Locked"
        badge="PREMIUM"
      />
    );

    expect(screen.getByTestId('lock-title')).toHaveTextContent('Card Locked');
    expect(screen.getByTestId('upgrade-badge')).toHaveTextContent('PREMIUM');
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('BlurredContent integration', () => {
  it('should work in freemium gating scenario', () => {
    const handleUpgrade = vi.fn();

    render(
      <div data-testid="freemium-ui">
        {/* Visible recommendation */}
        <div data-testid="visible-rec">Recommendation 1: Update meta tags</div>

        {/* Locked recommendations */}
        <BlurredContent
          isLocked={true}
          lockTitle="2 more recommendations"
          lockDescription="Upgrade to Starter to unlock all insights"
          ctaText="Upgrade to Starter"
          onCtaClick={handleUpgrade}
          badge="STARTER"
          previewCount={2}
        >
          <div>
            <div>Recommendation 2: Add structured data</div>
            <div>Recommendation 3: Improve page speed</div>
          </div>
        </BlurredContent>
      </div>
    );

    // Visible content is accessible
    expect(screen.getByTestId('visible-rec')).toBeInTheDocument();

    // Locked content shows upgrade prompt
    expect(screen.getByTestId('lock-title')).toHaveTextContent('2 more recommendations');
    expect(screen.getByTestId('upgrade-badge')).toHaveTextContent('STARTER');
    expect(screen.getByTestId('preview-count')).toHaveTextContent('2 more items');

    // CTA works
    fireEvent.click(screen.getByTestId('upgrade-cta'));
    expect(handleUpgrade).toHaveBeenCalled();
  });

  it('should create FOMO with partial visibility', () => {
    const competitors = [
      'Competitor A: 75 score',
      'Competitor B: 68 score',
      'Competitor C: 82 score',
      'Competitor D: 71 score',
      'Competitor E: 88 score',
    ];

    render(
      <BlurredList
        items={competitors}
        visibleCount={0}
        lockProps={{
          lockTitle: 'Competitor Analysis Locked',
          lockDescription: 'See how you compare to 5 competitors',
          ctaText: 'Unlock Competitors',
          badge: 'PRO',
        }}
      />
    );

    // All items are locked
    expect(screen.queryByTestId('visible-item-0')).not.toBeInTheDocument();

    // FOMO-inducing message
    expect(screen.getByTestId('lock-title')).toHaveTextContent('Competitor Analysis Locked');
    expect(screen.getByTestId('lock-description')).toHaveTextContent('5 competitors');
  });
});
