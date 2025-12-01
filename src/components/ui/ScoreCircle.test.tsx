/**
 * ScoreCircle Component Tests
 *
 * Phase 1, Week 1, Day 2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ScoreCircle,
  ScoreBadge,
  ScoreBar,
  ScoreComparison,
  ScoreGauge,
  getScoreGrade,
  getScoreInterpretation,
} from './ScoreCircle';

// ================================================================
// UTILITY FUNCTION TESTS
// ================================================================

describe('getScoreGrade', () => {
  it('should return excellent for scores 80-100', () => {
    expect(getScoreGrade(80).grade).toBe('excellent');
    expect(getScoreGrade(90).grade).toBe('excellent');
    expect(getScoreGrade(100).grade).toBe('excellent');
  });

  it('should return good for scores 60-79', () => {
    expect(getScoreGrade(60).grade).toBe('good');
    expect(getScoreGrade(70).grade).toBe('good');
    expect(getScoreGrade(79).grade).toBe('good');
  });

  it('should return average for scores 40-59', () => {
    expect(getScoreGrade(40).grade).toBe('average');
    expect(getScoreGrade(50).grade).toBe('average');
    expect(getScoreGrade(59).grade).toBe('average');
  });

  it('should return poor for scores 20-39', () => {
    expect(getScoreGrade(20).grade).toBe('poor');
    expect(getScoreGrade(30).grade).toBe('poor');
    expect(getScoreGrade(39).grade).toBe('poor');
  });

  it('should return critical for scores 0-19', () => {
    expect(getScoreGrade(0).grade).toBe('critical');
    expect(getScoreGrade(10).grade).toBe('critical');
    expect(getScoreGrade(19).grade).toBe('critical');
  });

  it('should clamp scores above 100', () => {
    expect(getScoreGrade(150).grade).toBe('excellent');
  });

  it('should clamp scores below 0', () => {
    expect(getScoreGrade(-10).grade).toBe('critical');
  });

  it('should return color information', () => {
    const grade = getScoreGrade(85);
    expect(grade.color).toBeTruthy();
    expect(grade.bgColor).toBeTruthy();
    expect(grade.label).toBe('Excellent');
  });
});

describe('getScoreInterpretation', () => {
  it('should return interpretation for excellent score', () => {
    const interpretation = getScoreInterpretation(85);
    expect(interpretation).toContain('excellent');
    expect(interpretation).toContain('prominently');
  });

  it('should return interpretation for poor score', () => {
    const interpretation = getScoreInterpretation(25);
    expect(interpretation).toContain('poor');
    expect(interpretation).toContain('improvements');
  });

  it('should return interpretation for critical score', () => {
    const interpretation = getScoreInterpretation(10);
    expect(interpretation).toContain('critical');
    expect(interpretation).toContain('Immediate');
  });
});

// ================================================================
// SCORECIRCLE COMPONENT TESTS
// ================================================================

describe('ScoreCircle', () => {
  it('should render with score', () => {
    render(<ScoreCircle score={75} />);

    const scoreValue = screen.getByTestId('score-value');
    expect(scoreValue).toHaveTextContent('75');
  });

  it('should render with label', () => {
    render(<ScoreCircle score={75} label="AI Visibility" />);

    const label = screen.getByTestId('score-label');
    expect(label).toHaveTextContent('AI Visibility');
  });

  it('should render grade label by default', () => {
    render(<ScoreCircle score={85} />);

    const grade = screen.getByTestId('score-grade');
    expect(grade).toHaveTextContent('Excellent');
  });

  it('should hide grade label when showGrade is false', () => {
    render(<ScoreCircle score={85} showGrade={false} />);

    expect(screen.queryByTestId('score-grade')).not.toBeInTheDocument();
  });

  it('should show percent symbol when showPercent is true', () => {
    render(<ScoreCircle score={75} showPercent />);

    const scoreValue = screen.getByTestId('score-value');
    expect(scoreValue).toHaveTextContent('%');
  });

  it('should render loading state', () => {
    render(<ScoreCircle score={75} loading />);

    const loading = screen.getByTestId('score-circle-loading');
    expect(loading).toBeInTheDocument();
  });

  it('should clamp score to 0-100 range', () => {
    render(<ScoreCircle score={150} />);

    const scoreValue = screen.getByTestId('score-value');
    expect(scoreValue).toHaveTextContent('100');
  });

  it('should handle negative scores', () => {
    render(<ScoreCircle score={-20} />);

    const scoreValue = screen.getByTestId('score-value');
    expect(scoreValue).toHaveTextContent('0');
  });

  it('should render progress ring', () => {
    render(<ScoreCircle score={50} />);

    const progressRing = screen.getByTestId('score-progress-ring');
    expect(progressRing).toBeInTheDocument();
  });

  it('should not render progress ring for score 0', () => {
    render(<ScoreCircle score={0} />);

    expect(screen.queryByTestId('score-progress-ring')).not.toBeInTheDocument();
  });

  it('should have accessible aria-label', () => {
    render(<ScoreCircle score={75} />);

    const circle = screen.getByTestId('score-circle');
    expect(circle).toHaveAttribute('aria-label');
    expect(circle.getAttribute('aria-label')).toContain('75');
  });

  it('should call onScoreChange when score changes', () => {
    const onScoreChange = vi.fn();
    render(<ScoreCircle score={75} onScoreChange={onScoreChange} />);

    expect(onScoreChange).toHaveBeenCalledWith(75, 'good');
  });

  it('should apply custom className', () => {
    render(<ScoreCircle score={75} className="custom-class" />);

    const circle = screen.getByTestId('score-circle');
    expect(circle.className).toContain('custom-class');
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<ScoreCircle score={75} size="sm" />);
      expect(screen.getByTestId('score-circle')).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<ScoreCircle score={75} size="md" />);
      expect(screen.getByTestId('score-circle')).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<ScoreCircle score={75} size="lg" />);
      expect(screen.getByTestId('score-circle')).toBeInTheDocument();
    });

    it('should render extra large size', () => {
      render(<ScoreCircle score={75} size="xl" />);
      expect(screen.getByTestId('score-circle')).toBeInTheDocument();
    });
  });

  describe('colors by grade', () => {
    it('should show green for excellent score', () => {
      render(<ScoreCircle score={90} />);
      const progressRing = screen.getByTestId('score-progress-ring');
      expect(progressRing.getAttribute('stroke')).toBe('#22c55e');
    });

    it('should show yellow for average score', () => {
      render(<ScoreCircle score={50} />);
      const progressRing = screen.getByTestId('score-progress-ring');
      expect(progressRing.getAttribute('stroke')).toBe('#eab308');
    });

    it('should show red for critical score', () => {
      render(<ScoreCircle score={10} />);
      const progressRing = screen.getByTestId('score-progress-ring');
      expect(progressRing.getAttribute('stroke')).toBe('#ef4444');
    });
  });
});

// ================================================================
// SCOREBADGE COMPONENT TESTS
// ================================================================

describe('ScoreBadge', () => {
  it('should render score value', () => {
    render(<ScoreBadge score={75} />);

    const badge = screen.getByTestId('score-badge');
    expect(badge).toHaveTextContent('75');
  });

  it('should apply grade-based colors', () => {
    render(<ScoreBadge score={85} />);

    const badge = screen.getByTestId('score-badge');
    expect(badge.style.backgroundColor).toBeTruthy();
  });

  it('should clamp score to 0-100', () => {
    render(<ScoreBadge score={150} />);

    const badge = screen.getByTestId('score-badge');
    expect(badge).toHaveTextContent('100');
  });

  it('should apply custom className', () => {
    render(<ScoreBadge score={75} className="custom-badge" />);

    const badge = screen.getByTestId('score-badge');
    expect(badge.className).toContain('custom-badge');
  });
});

// ================================================================
// SCOREBAR COMPONENT TESTS
// ================================================================

describe('ScoreBar', () => {
  it('should render progress bar', () => {
    render(<ScoreBar score={75} />);

    const bar = screen.getByTestId('score-bar');
    expect(bar).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<ScoreBar score={75} label="Progress" />);

    expect(screen.getByText('Progress')).toBeInTheDocument();
  });

  it('should show value by default', () => {
    render(<ScoreBar score={75} />);

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should hide value when showValue is false', () => {
    render(<ScoreBar score={75} showValue={false} />);

    expect(screen.queryByText('75')).not.toBeInTheDocument();
  });

  it('should set fill width based on score', () => {
    render(<ScoreBar score={50} />);

    const fill = screen.getByTestId('score-bar-fill');
    expect(fill.style.width).toBe('50%');
  });

  it('should apply custom className', () => {
    render(<ScoreBar score={75} className="custom-bar" />);

    const bar = screen.getByTestId('score-bar');
    expect(bar.className).toContain('custom-bar');
  });
});

// ================================================================
// SCORECOMPARISON COMPONENT TESTS
// ================================================================

describe('ScoreComparison', () => {
  it('should render current score', () => {
    render(<ScoreComparison currentScore={75} />);

    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('should render previous score when provided', () => {
    render(<ScoreComparison currentScore={75} previousScore={60} />);

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('should render projected score when provided', () => {
    render(<ScoreComparison currentScore={75} projectedScore={90} />);

    expect(screen.getByText('Projected')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('should show positive change indicator', () => {
    render(<ScoreComparison currentScore={75} previousScore={60} />);

    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('should show negative change indicator', () => {
    render(<ScoreComparison currentScore={50} previousScore={75} />);

    expect(screen.getByText('-25')).toBeInTheDocument();
  });

  it('should show projected change', () => {
    render(<ScoreComparison currentScore={75} projectedScore={90} />);

    expect(screen.getByText('+15')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<ScoreComparison currentScore={75} className="custom-comparison" />);

    const comparison = screen.getByTestId('score-comparison');
    expect(comparison.className).toContain('custom-comparison');
  });
});

// ================================================================
// SCOREGAUGE COMPONENT TESTS
// ================================================================

describe('ScoreGauge', () => {
  it('should render with score', () => {
    render(<ScoreGauge score={75} />);

    const gauge = screen.getByTestId('score-gauge');
    expect(gauge).toBeInTheDocument();

    const value = screen.getByTestId('gauge-value');
    expect(value).toHaveTextContent('75');
  });

  it('should render with label', () => {
    render(<ScoreGauge score={75} label="AI Visibility" />);

    expect(screen.getByText('AI Visibility')).toBeInTheDocument();
  });

  it('should show grade label', () => {
    render(<ScoreGauge score={85} />);

    expect(screen.getByText('Excellent')).toBeInTheDocument();
  });

  it('should show min/max labels by default', () => {
    render(<ScoreGauge score={50} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('should hide min/max labels when showMinMax is false', () => {
    render(<ScoreGauge score={50} showMinMax={false} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.queryByText('100')).not.toBeInTheDocument();
  });

  it('should clamp score to 0-100 range', () => {
    render(<ScoreGauge score={150} />);

    const value = screen.getByTestId('gauge-value');
    expect(value).toHaveTextContent('100');
  });

  it('should handle negative scores', () => {
    render(<ScoreGauge score={-20} />);

    const value = screen.getByTestId('gauge-value');
    expect(value).toHaveTextContent('0');
  });

  it('should render progress arc for non-zero scores', () => {
    render(<ScoreGauge score={50} />);

    const progress = screen.getByTestId('gauge-progress');
    expect(progress).toBeInTheDocument();
  });

  it('should not render progress arc for score 0', () => {
    render(<ScoreGauge score={0} />);

    expect(screen.queryByTestId('gauge-progress')).not.toBeInTheDocument();
  });

  it('should have accessible aria-label', () => {
    render(<ScoreGauge score={75} />);

    const gauge = screen.getByTestId('score-gauge');
    expect(gauge).toHaveAttribute('aria-label');
    expect(gauge.getAttribute('aria-label')).toContain('75');
    expect(gauge.getAttribute('aria-label')).toContain('Good');
  });

  it('should apply custom className', () => {
    render(<ScoreGauge score={75} className="custom-gauge" />);

    const gauge = screen.getByTestId('score-gauge');
    expect(gauge.className).toContain('custom-gauge');
  });

  describe('sizes', () => {
    it('should render small size', () => {
      render(<ScoreGauge score={75} size="sm" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });

    it('should render medium size', () => {
      render(<ScoreGauge score={75} size="md" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });

    it('should render large size', () => {
      render(<ScoreGauge score={75} size="lg" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });
  });

  describe('colors by grade', () => {
    it('should show green for excellent score', () => {
      render(<ScoreGauge score={90} />);
      const progress = screen.getByTestId('gauge-progress');
      expect(progress.getAttribute('stroke')).toBe('#22c55e');
    });

    it('should show yellow for average score', () => {
      render(<ScoreGauge score={50} />);
      const progress = screen.getByTestId('gauge-progress');
      expect(progress.getAttribute('stroke')).toBe('#eab308');
    });

    it('should show red for critical score', () => {
      render(<ScoreGauge score={10} />);
      const progress = screen.getByTestId('gauge-progress');
      expect(progress.getAttribute('stroke')).toBe('#ef4444');
    });

    it('should show orange for poor score', () => {
      render(<ScoreGauge score={30} />);
      const progress = screen.getByTestId('gauge-progress');
      expect(progress.getAttribute('stroke')).toBe('#f97316');
    });

    it('should show lime for good score', () => {
      render(<ScoreGauge score={70} />);
      const progress = screen.getByTestId('gauge-progress');
      expect(progress.getAttribute('stroke')).toBe('#84cc16');
    });
  });
});
