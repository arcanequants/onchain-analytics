/**
 * EmptyState Component Tests
 *
 * Phase 1, Week 1, Day 4
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EmptyState,
  NoAnalysesEmptyState,
  NoHistoryEmptyState,
  ErrorEmptyState,
  type EmptyStateVariant,
} from './EmptyState';

// ================================================================
// BASIC RENDERING TESTS
// ================================================================

describe('EmptyState Component', () => {
  describe('rendering', () => {
    it('should render with default variant', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
      expect(screen.getByText('There is no content to display.')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(
        <EmptyState
          title="Custom Title"
          description="Custom description text"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom description text')).toBeInTheDocument();
    });

    it('should render with custom icon', () => {
      render(
        <EmptyState
          icon={<div data-testid="custom-icon">Custom Icon</div>}
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should have correct aria-label', () => {
      render(<EmptyState title="Test Title" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Test Title');
    });
  });

  // ================================================================
  // VARIANT TESTS
  // ================================================================

  describe('variants', () => {
    const variants: EmptyStateVariant[] = [
      'no-analyses',
      'no-mentions',
      'no-history',
      'no-results',
      'error',
      'loading-failed',
      'coming-soon',
      'custom',
    ];

    it.each(variants)('should render %s variant correctly', (variant) => {
      render(<EmptyState variant={variant} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      // Each variant should have a title
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should show correct title for no-analyses variant', () => {
      render(<EmptyState variant="no-analyses" />);

      expect(screen.getByText("You haven't analyzed any URLs yet")).toBeInTheDocument();
    });

    it('should show correct title for no-mentions variant', () => {
      render(<EmptyState variant="no-mentions" />);

      expect(screen.getByText('AI models are not mentioning your brand yet')).toBeInTheDocument();
    });

    it('should show correct title for no-history variant', () => {
      render(<EmptyState variant="no-history" />);

      expect(screen.getByText('Track your progress over time')).toBeInTheDocument();
    });

    it('should show correct title for no-results variant', () => {
      render(<EmptyState variant="no-results" />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('should show correct title for error variant', () => {
      render(<EmptyState variant="error" />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('should show correct title for loading-failed variant', () => {
      render(<EmptyState variant="loading-failed" />);

      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });

    it('should show correct title for coming-soon variant', () => {
      render(<EmptyState variant="coming-soon" />);

      expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    });
  });

  // ================================================================
  // ACTION BUTTON TESTS
  // ================================================================

  describe('actions', () => {
    it('should render primary action button', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          primaryAction={{
            label: 'Primary Action',
            onClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Primary Action' });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render secondary action button', () => {
      const onClick = vi.fn();
      render(
        <EmptyState
          secondaryAction={{
            label: 'Secondary Action',
            onClick,
            variant: 'secondary',
          }}
        />
      );

      const button = screen.getByRole('button', { name: 'Secondary Action' });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should render both primary and secondary actions', () => {
      render(
        <EmptyState
          primaryAction={{ label: 'Primary' }}
          secondaryAction={{ label: 'Secondary' }}
        />
      );

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('should render action as link when href is provided', () => {
      render(
        <EmptyState
          primaryAction={{
            label: 'Go to page',
            href: '/some-page',
          }}
        />
      );

      const link = screen.getByRole('link', { name: 'Go to page' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/some-page');
    });

    it('should render action with icon', () => {
      render(
        <EmptyState
          primaryAction={{
            label: 'With Icon',
            icon: <span data-testid="action-icon">+</span>,
          }}
        />
      );

      expect(screen.getByTestId('action-icon')).toBeInTheDocument();
    });
  });

  // ================================================================
  // TIP TESTS
  // ================================================================

  describe('tip', () => {
    it('should render custom tip', () => {
      render(<EmptyState tip="This is a helpful tip" />);

      expect(screen.getByText('Tip:')).toBeInTheDocument();
      expect(screen.getByText('This is a helpful tip')).toBeInTheDocument();
    });

    it('should show variant tip when no custom tip provided', () => {
      render(<EmptyState variant="no-analyses" />);

      expect(screen.getByText('Start with your main website URL to get your AI Perception Score.')).toBeInTheDocument();
    });

    it('should override variant tip with custom tip', () => {
      render(
        <EmptyState
          variant="no-analyses"
          tip="Custom tip override"
        />
      );

      expect(screen.getByText('Custom tip override')).toBeInTheDocument();
      expect(screen.queryByText('Start with your main website URL')).not.toBeInTheDocument();
    });
  });

  // ================================================================
  // SIZE TESTS
  // ================================================================

  describe('sizes', () => {
    it('should render small size', () => {
      const { container } = render(<EmptyState size="sm" />);

      // Check for sm-specific classes
      expect(container.firstChild).toHaveClass('py-8');
    });

    it('should render medium size (default)', () => {
      const { container } = render(<EmptyState size="md" />);

      expect(container.firstChild).toHaveClass('py-12');
    });

    it('should render large size', () => {
      const { container } = render(<EmptyState size="lg" />);

      expect(container.firstChild).toHaveClass('py-16');
    });

    it('should default to medium size when not specified', () => {
      const { container } = render(<EmptyState />);

      expect(container.firstChild).toHaveClass('py-12');
    });
  });

  // ================================================================
  // CUSTOM CLASS TESTS
  // ================================================================

  describe('className', () => {
    it('should apply custom className', () => {
      const { container } = render(<EmptyState className="custom-class" />);

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should merge with default classes', () => {
      const { container } = render(<EmptyState className="test-class" />);

      expect(container.firstChild).toHaveClass('flex');
      expect(container.firstChild).toHaveClass('test-class');
    });
  });
});

// ================================================================
// SPECIALIZED COMPONENT TESTS
// ================================================================

describe('NoAnalysesEmptyState', () => {
  it('should render with correct variant', () => {
    render(<NoAnalysesEmptyState />);

    expect(screen.getByText("You haven't analyzed any URLs yet")).toBeInTheDocument();
  });

  it('should render analyze button with onClick', () => {
    const onAnalyzeClick = vi.fn();
    render(<NoAnalysesEmptyState onAnalyzeClick={onAnalyzeClick} />);

    const button = screen.getByRole('button', { name: 'Analyze Your First URL' });
    fireEvent.click(button);

    expect(onAnalyzeClick).toHaveBeenCalledTimes(1);
  });

  it('should render analyze button as link with href', () => {
    render(<NoAnalysesEmptyState analyzeHref="/analyze" />);

    const link = screen.getByRole('link', { name: 'Analyze Your First URL' });
    expect(link).toHaveAttribute('href', '/analyze');
  });

  it('should render "Learn how it works" link', () => {
    render(<NoAnalysesEmptyState />);

    const link = screen.getByRole('link', { name: 'Learn how it works' });
    expect(link).toHaveAttribute('href', '/how-it-works');
  });
});

describe('NoHistoryEmptyState', () => {
  it('should render with correct variant', () => {
    render(<NoHistoryEmptyState />);

    expect(screen.getByText('Track your progress over time')).toBeInTheDocument();
  });

  it('should render monitoring button when callback provided', () => {
    const onEnableMonitoring = vi.fn();
    render(<NoHistoryEmptyState onEnableMonitoring={onEnableMonitoring} />);

    const button = screen.getByRole('button', { name: 'Enable Weekly Monitoring' });
    fireEvent.click(button);

    expect(onEnableMonitoring).toHaveBeenCalledTimes(1);
  });

  it('should not render button when no callback provided', () => {
    render(<NoHistoryEmptyState />);

    expect(screen.queryByRole('button', { name: 'Enable Weekly Monitoring' })).not.toBeInTheDocument();
  });
});

describe('ErrorEmptyState', () => {
  it('should render with correct variant', () => {
    render(<ErrorEmptyState />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should show default error message', () => {
    render(<ErrorEmptyState />);

    expect(screen.getByText(/We encountered an error/)).toBeInTheDocument();
  });

  it('should show custom error message', () => {
    render(<ErrorEmptyState errorMessage="Custom error occurred" />);

    expect(screen.getByText('Custom error occurred')).toBeInTheDocument();
  });

  it('should render retry button when callback provided', () => {
    const onRetry = vi.fn();
    render(<ErrorEmptyState onRetry={onRetry} />);

    const button = screen.getByRole('button', { name: 'Try Again' });
    fireEvent.click(button);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render retry button when no callback provided', () => {
    render(<ErrorEmptyState />);

    expect(screen.queryByRole('button', { name: 'Try Again' })).not.toBeInTheDocument();
  });

  it('should always show contact support link', () => {
    render(<ErrorEmptyState />);

    const link = screen.getByRole('link', { name: 'Contact Support' });
    expect(link).toHaveAttribute('href', '/support');
  });
});

// ================================================================
// ACCESSIBILITY TESTS
// ================================================================

describe('Accessibility', () => {
  it('should have status role', () => {
    render(<EmptyState />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have heading with correct level', () => {
    render(<EmptyState title="Test Heading" />);

    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Test Heading');
  });

  it('should be keyboard navigable for actions', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        primaryAction={{ label: 'Click me', onClick }}
      />
    );

    const button = screen.getByRole('button');
    button.focus();
    expect(document.activeElement).toBe(button);
  });

  it('should have focus ring on buttons', () => {
    render(
      <EmptyState
        primaryAction={{ label: 'Click me' }}
      />
    );

    const button = screen.getByRole('button');
    // Check for focus-related classes
    expect(button.className).toContain('focus:outline-none');
    expect(button.className).toContain('focus:ring-2');
  });
});
