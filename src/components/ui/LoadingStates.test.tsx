/**
 * Loading States Tests
 *
 * Phase 1, Week 1, Day 5
 * Tests for skeleton loading components and progress indicators.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonScoreCircle,
  SkeletonScoreBar,
  ProgressBar,
  CircularProgress,
  Spinner,
  PulsingDots,
  StepIndicator,
  CompactProgressIndicator,
  AnalysisLoadingScreen,
  ResultsPageSkeleton,
} from './LoadingStates';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('should render with default styles', () => {
      render(<Skeleton />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse');
    });

    it('should apply circle variant', () => {
      render(<Skeleton variant="circle" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-full');
    });

    it('should apply text variant', () => {
      render(<Skeleton variant="text" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('h-4');
    });

    it('should apply card variant', () => {
      render(<Skeleton variant="card" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('rounded-lg');
    });

    it('should apply custom width and height', () => {
      render(<Skeleton width={100} height={50} />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ width: '100px', height: '50px' });
    });

    it('should apply string width and height', () => {
      render(<Skeleton width="50%" height="auto" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveStyle({ width: '50%', height: 'auto' });
    });

    it('should apply custom className', () => {
      render(<Skeleton className="custom-class" />);

      const skeleton = screen.getByTestId('skeleton');
      expect(skeleton).toHaveClass('custom-class');
    });
  });

  describe('SkeletonText', () => {
    it('should render single line by default', () => {
      render(<SkeletonText />);

      const container = screen.getByTestId('skeleton-text');
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons).toHaveLength(1);
    });

    it('should render multiple lines', () => {
      render(<SkeletonText lines={3} />);

      const container = screen.getByTestId('skeleton-text');
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons).toHaveLength(3);
    });

    it('should apply custom last line width', () => {
      render(<SkeletonText lines={2} lastLineWidth="80%" />);

      const container = screen.getByTestId('skeleton-text');
      const skeletons = container.querySelectorAll('[data-testid="skeleton"]');
      expect(skeletons[1]).toHaveStyle({ width: '80%' });
    });
  });

  describe('SkeletonCard', () => {
    it('should render basic card', () => {
      render(<SkeletonCard />);

      const card = screen.getByTestId('skeleton-card');
      expect(card).toBeInTheDocument();
    });

    it('should render with image placeholder', () => {
      render(<SkeletonCard hasImage />);

      const card = screen.getByTestId('skeleton-card');
      const skeletons = card.querySelectorAll('[data-testid="skeleton"]');
      // Image skeleton + title + text lines
      expect(skeletons.length).toBeGreaterThan(2);
    });

    it('should render with footer', () => {
      render(<SkeletonCard hasFooter />);

      const card = screen.getByTestId('skeleton-card');
      // Should have border-t for footer separator
      expect(card.innerHTML).toContain('border-t');
    });
  });

  describe('SkeletonScoreCircle', () => {
    it('should render with default size', () => {
      render(<SkeletonScoreCircle />);

      const circle = screen.getByTestId('skeleton-score-circle');
      expect(circle).toHaveClass('w-20', 'h-20');
    });

    it('should render with small size', () => {
      render(<SkeletonScoreCircle size="sm" />);

      const circle = screen.getByTestId('skeleton-score-circle');
      expect(circle).toHaveClass('w-12', 'h-12');
    });

    it('should render with large size', () => {
      render(<SkeletonScoreCircle size="lg" />);

      const circle = screen.getByTestId('skeleton-score-circle');
      expect(circle).toHaveClass('w-28', 'h-28');
    });

    it('should render with xl size', () => {
      render(<SkeletonScoreCircle size="xl" />);

      const circle = screen.getByTestId('skeleton-score-circle');
      expect(circle).toHaveClass('w-40', 'h-40');
    });
  });

  describe('SkeletonScoreBar', () => {
    it('should render score bar skeleton', () => {
      render(<SkeletonScoreBar />);

      const bar = screen.getByTestId('skeleton-score-bar');
      expect(bar).toBeInTheDocument();
    });
  });
});

describe('Progress Components', () => {
  describe('ProgressBar', () => {
    it('should render progress bar', () => {
      render(<ProgressBar value={50} />);

      const bar = screen.getByTestId('progress-bar');
      expect(bar).toBeInTheDocument();
    });

    it('should display correct percentage', () => {
      render(<ProgressBar value={75} showValue />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should clamp value to 0-100', () => {
      render(<ProgressBar value={150} showValue />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle negative values', () => {
      render(<ProgressBar value={-10} showValue />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should apply size variants', () => {
      const { rerender } = render(<ProgressBar value={50} size="sm" />);
      expect(screen.getByTestId('progress-bar').querySelector('.h-1')).toBeInTheDocument();

      rerender(<ProgressBar value={50} size="lg" />);
      expect(screen.getByTestId('progress-bar').querySelector('.h-3')).toBeInTheDocument();
    });
  });

  describe('CircularProgress', () => {
    it('should render circular progress', () => {
      render(<CircularProgress value={50} />);

      const progress = screen.getByTestId('circular-progress');
      expect(progress).toBeInTheDocument();
    });

    it('should display value', () => {
      render(<CircularProgress value={75} showValue />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should hide value when showValue is false', () => {
      render(<CircularProgress value={75} showValue={false} />);

      expect(screen.queryByText('75%')).not.toBeInTheDocument();
    });

    it('should apply custom size', () => {
      render(<CircularProgress value={50} size={100} />);

      const progress = screen.getByTestId('circular-progress');
      expect(progress).toHaveStyle({ width: '100px', height: '100px' });
    });
  });

  describe('Spinner', () => {
    it('should render spinner', () => {
      render(<Spinner />);

      const spinner = screen.getByTestId('spinner');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('should have accessible role', () => {
      render(<Spinner />);

      const spinner = screen.getByRole('status');
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
    });

    it('should apply size variants', () => {
      const { rerender } = render(<Spinner size="sm" />);
      expect(screen.getByTestId('spinner')).toHaveClass('w-4', 'h-4');

      rerender(<Spinner size="lg" />);
      expect(screen.getByTestId('spinner')).toHaveClass('w-10', 'h-10');
    });
  });

  describe('PulsingDots', () => {
    it('should render 3 dots by default', () => {
      render(<PulsingDots />);

      const container = screen.getByTestId('pulsing-dots');
      expect(container.children).toHaveLength(3);
    });

    it('should render custom number of dots', () => {
      render(<PulsingDots count={5} />);

      const container = screen.getByTestId('pulsing-dots');
      expect(container.children).toHaveLength(5);
    });

    it('should apply animation delay to each dot', () => {
      render(<PulsingDots count={3} />);

      const container = screen.getByTestId('pulsing-dots');
      const dots = container.children;

      expect(dots[0]).toHaveStyle({ animationDelay: '0s' });
      expect(dots[1]).toHaveStyle({ animationDelay: '0.15s' });
      expect(dots[2]).toHaveStyle({ animationDelay: '0.3s' });
    });
  });
});

describe('Analysis Progress Components', () => {
  describe('StepIndicator', () => {
    it('should render all stages', () => {
      render(<StepIndicator currentStage="initializing" />);

      const indicator = screen.getByTestId('step-indicator');
      expect(indicator).toBeInTheDocument();
      expect(screen.getByText('Initializing')).toBeInTheDocument();
      expect(screen.getByText('Fetching URL')).toBeInTheDocument();
    });

    it('should mark previous stages as complete', () => {
      render(<StepIndicator currentStage="detecting_industry" />);

      // Check marks should be visible for completed stages
      const checkmarks = document.querySelectorAll('svg');
      expect(checkmarks.length).toBeGreaterThan(0);
    });

    it('should show spinner for current stage', () => {
      render(<StepIndicator currentStage="fetching_url" />);

      const spinners = screen.getAllByTestId('spinner');
      expect(spinners.length).toBe(1);
    });

    it('should show description for current stage', () => {
      render(<StepIndicator currentStage="querying_openai" />);

      expect(screen.getByText('Testing visibility with GPT models')).toBeInTheDocument();
    });
  });

  describe('CompactProgressIndicator', () => {
    it('should render with current stage info', () => {
      render(
        <CompactProgressIndicator
          currentStage="fetching_url"
          percentComplete={25}
          message="Loading website..."
        />
      );

      expect(screen.getByTestId('compact-progress')).toBeInTheDocument();
      expect(screen.getByText('Fetching URL')).toBeInTheDocument();
      expect(screen.getByText('Loading website...')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('should show spinner', () => {
      render(
        <CompactProgressIndicator
          currentStage="querying_openai"
          percentComplete={50}
          message="Querying..."
        />
      );

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('AnalysisLoadingScreen', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render loading screen', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="initializing"
          percentComplete={0}
          message="Starting..."
        />
      );

      expect(screen.getByTestId('analysis-loading-screen')).toBeInTheDocument();
    });

    it('should show current stage label', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="querying_openai"
          percentComplete={45}
          message="Testing AI visibility"
        />
      );

      expect(screen.getByText('Querying OpenAI')).toBeInTheDocument();
      expect(screen.getByText('Testing AI visibility')).toBeInTheDocument();
    });

    it('should show percentage', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="calculating_scores"
          percentComplete={80}
          message="Computing..."
        />
      );

      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    it('should update elapsed time', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="initializing"
          percentComplete={0}
          message="Starting..."
        />
      );

      expect(screen.getByText(/Elapsed: 0s/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByText(/Elapsed: 5s/)).toBeInTheDocument();
    });

    it('should show estimated time remaining', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="querying_openai"
          percentComplete={50}
          message="Testing..."
          estimatedTimeRemaining="15 seconds"
        />
      );

      expect(screen.getByText(/Est. remaining: 15 seconds/)).toBeInTheDocument();
    });

    it('should show cancel button when onCancel provided', () => {
      const onCancel = vi.fn();
      render(
        <AnalysisLoadingScreen
          currentStage="initializing"
          percentComplete={0}
          message="Starting..."
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel Analysis');
      expect(cancelButton).toBeInTheDocument();

      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not show cancel button when onCancel not provided', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="initializing"
          percentComplete={0}
          message="Starting..."
        />
      );

      expect(screen.queryByText('Cancel Analysis')).not.toBeInTheDocument();
    });

    it('should show stage dots', () => {
      render(
        <AnalysisLoadingScreen
          currentStage="detecting_industry"
          percentComplete={25}
          message="Analyzing..."
        />
      );

      // Should have 11 dots (all stages except 'complete')
      const dotsContainer = screen.getByTestId('analysis-loading-screen');
      const dots = dotsContainer.querySelectorAll('.w-3.h-3.rounded-full');
      expect(dots.length).toBe(11);
    });
  });

  describe('ResultsPageSkeleton', () => {
    it('should render full page skeleton', () => {
      render(<ResultsPageSkeleton />);

      expect(screen.getByTestId('results-page-skeleton')).toBeInTheDocument();
    });

    it('should have header skeleton', () => {
      render(<ResultsPageSkeleton />);

      // Should have header with skeletons
      const skeleton = screen.getByTestId('results-page-skeleton');
      const header = skeleton.querySelector('header');
      expect(header).toBeInTheDocument();
    });

    it('should have score circle skeleton', () => {
      render(<ResultsPageSkeleton />);

      const scoreCircles = screen.getAllByTestId('skeleton-score-circle');
      expect(scoreCircles.length).toBeGreaterThan(0);
    });

    it('should have multiple skeleton cards', () => {
      render(<ResultsPageSkeleton />);

      const cards = screen.getAllByTestId('skeleton-card');
      expect(cards.length).toBeGreaterThan(0);
    });
  });
});

describe('Accessibility', () => {
  it('should have proper loading role on spinner', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have aria-label on spinner', () => {
    render(<Spinner />);

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });
});
