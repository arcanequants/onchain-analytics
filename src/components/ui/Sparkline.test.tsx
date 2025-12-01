/**
 * Sparkline Component Tests
 *
 * Phase 1, Week 2, Day 5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Sparkline,
  SparkBar,
  SparkArea,
  TrendIndicator,
} from './Sparkline';

// ================================================================
// SPARKLINE COMPONENT TESTS
// ================================================================

describe('Sparkline', () => {
  const sampleData = [10, 20, 15, 25, 30, 28, 35];

  it('should render with data', () => {
    render(<Sparkline data={sampleData} />);

    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toBeInTheDocument();
  });

  it('should render line path', () => {
    render(<Sparkline data={sampleData} />);

    const line = screen.getByTestId('sparkline-line');
    expect(line).toBeInTheDocument();
    expect(line.getAttribute('d')).toBeTruthy();
  });

  it('should render empty state for empty data', () => {
    render(<Sparkline data={[]} />);

    const empty = screen.getByTestId('sparkline-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('--');
  });

  it('should show end dot when showEndDot is true', () => {
    render(<Sparkline data={sampleData} showEndDot />);

    const dot = screen.getByTestId('sparkline-dot');
    expect(dot).toBeInTheDocument();
  });

  it('should not show end dot by default', () => {
    render(<Sparkline data={sampleData} />);

    expect(screen.queryByTestId('sparkline-dot')).not.toBeInTheDocument();
  });

  it('should render area fill when fillColor is provided', () => {
    render(<Sparkline data={sampleData} fillColor="#22c55e" />);

    const area = screen.getByTestId('sparkline-area');
    expect(area).toBeInTheDocument();
  });

  it('should use green color for upward trend with auto color', () => {
    const upwardData = [10, 15, 20, 25, 30];
    render(<Sparkline data={upwardData} color="auto" />);

    const line = screen.getByTestId('sparkline-line');
    expect(line.getAttribute('stroke')).toBe('#22c55e');
  });

  it('should use red color for downward trend with auto color', () => {
    const downwardData = [30, 25, 20, 15, 10];
    render(<Sparkline data={downwardData} color="auto" />);

    const line = screen.getByTestId('sparkline-line');
    expect(line.getAttribute('stroke')).toBe('#ef4444');
  });

  it('should use custom color when provided', () => {
    render(<Sparkline data={sampleData} color="#3b82f6" />);

    const line = screen.getByTestId('sparkline-line');
    expect(line.getAttribute('stroke')).toBe('#3b82f6');
  });

  it('should have accessible aria-label', () => {
    render(<Sparkline data={sampleData} ariaLabel="Custom label" />);

    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toHaveAttribute('aria-label', 'Custom label');
  });

  it('should apply custom className', () => {
    render(<Sparkline data={sampleData} className="custom-sparkline" />);

    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toHaveClass('custom-sparkline');
  });

  it('should handle single data point', () => {
    render(<Sparkline data={[50]} />);

    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toBeInTheDocument();
  });

  it('should handle two data points', () => {
    render(<Sparkline data={[20, 30]} />);

    const line = screen.getByTestId('sparkline-line');
    expect(line.getAttribute('d')).toBeTruthy();
  });

  it('should respect custom dimensions', () => {
    render(<Sparkline data={sampleData} width={200} height={50} />);

    const sparkline = screen.getByTestId('sparkline');
    expect(sparkline).toHaveAttribute('width', '200');
    expect(sparkline).toHaveAttribute('height', '50');
  });
});

// ================================================================
// SPARKBAR COMPONENT TESTS
// ================================================================

describe('SparkBar', () => {
  const sampleData = [10, 20, 15, 25, 30, 28, 35];

  it('should render with data', () => {
    render(<SparkBar data={sampleData} />);

    const sparkbar = screen.getByTestId('sparkbar');
    expect(sparkbar).toBeInTheDocument();
  });

  it('should render correct number of bars', () => {
    render(<SparkBar data={sampleData} />);

    sampleData.forEach((_, index) => {
      const bar = screen.getByTestId(`sparkbar-bar-${index}`);
      expect(bar).toBeInTheDocument();
    });
  });

  it('should render empty state for empty data', () => {
    render(<SparkBar data={[]} />);

    const empty = screen.getByTestId('sparkbar-empty');
    expect(empty).toBeInTheDocument();
    expect(empty).toHaveTextContent('--');
  });

  it('should use custom color string', () => {
    render(<SparkBar data={[10, 20]} color="#3b82f6" />);

    const bar = screen.getByTestId('sparkbar-bar-0');
    expect(bar.getAttribute('fill')).toBe('#3b82f6');
  });

  it('should use color function for dynamic colors', () => {
    const colorFn = (value: number) => (value > 15 ? '#22c55e' : '#ef4444');
    render(<SparkBar data={[10, 20]} color={colorFn} />);

    expect(screen.getByTestId('sparkbar-bar-0').getAttribute('fill')).toBe('#ef4444');
    expect(screen.getByTestId('sparkbar-bar-1').getAttribute('fill')).toBe('#22c55e');
  });

  it('should have accessible aria-label', () => {
    render(<SparkBar data={sampleData} ariaLabel="Custom bar label" />);

    const sparkbar = screen.getByTestId('sparkbar');
    expect(sparkbar).toHaveAttribute('aria-label', 'Custom bar label');
  });

  it('should apply custom className', () => {
    render(<SparkBar data={sampleData} className="custom-sparkbar" />);

    const sparkbar = screen.getByTestId('sparkbar');
    expect(sparkbar).toHaveClass('custom-sparkbar');
  });

  it('should respect custom dimensions', () => {
    render(<SparkBar data={sampleData} width={150} height={40} />);

    const sparkbar = screen.getByTestId('sparkbar');
    expect(sparkbar).toHaveAttribute('width', '150');
    expect(sparkbar).toHaveAttribute('height', '40');
  });
});

// ================================================================
// SPARKAREA COMPONENT TESTS
// ================================================================

describe('SparkArea', () => {
  const sampleData = [10, 20, 15, 25, 30, 28, 35];

  it('should render with data', () => {
    render(<SparkArea data={sampleData} />);

    const sparkarea = screen.getByTestId('sparkarea');
    expect(sparkarea).toBeInTheDocument();
  });

  it('should render area fill', () => {
    render(<SparkArea data={sampleData} />);

    const fill = screen.getByTestId('sparkarea-fill');
    expect(fill).toBeInTheDocument();
  });

  it('should render line', () => {
    render(<SparkArea data={sampleData} />);

    const line = screen.getByTestId('sparkarea-line');
    expect(line).toBeInTheDocument();
  });

  it('should render empty state for empty data', () => {
    render(<SparkArea data={[]} />);

    const empty = screen.getByTestId('sparkarea-empty');
    expect(empty).toBeInTheDocument();
  });

  it('should use auto color based on trend', () => {
    const upwardData = [10, 15, 20, 25];
    render(<SparkArea data={upwardData} color="auto" />);

    const line = screen.getByTestId('sparkarea-line');
    expect(line.getAttribute('stroke')).toBe('#22c55e');
  });

  it('should have accessible aria-label', () => {
    render(<SparkArea data={sampleData} ariaLabel="Custom area label" />);

    const sparkarea = screen.getByTestId('sparkarea');
    expect(sparkarea).toHaveAttribute('aria-label', 'Custom area label');
  });

  it('should apply custom className', () => {
    render(<SparkArea data={sampleData} className="custom-sparkarea" />);

    const sparkarea = screen.getByTestId('sparkarea');
    expect(sparkarea).toHaveClass('custom-sparkarea');
  });
});

// ================================================================
// TREND INDICATOR TESTS
// ================================================================

describe('TrendIndicator', () => {
  it('should render positive change', () => {
    render(<TrendIndicator value={110} previousValue={100} />);

    const indicator = screen.getByTestId('trend-indicator');
    expect(indicator).toBeInTheDocument();

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('+10.0%');
  });

  it('should render negative change', () => {
    render(<TrendIndicator value={90} previousValue={100} />);

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('-10.0%');
  });

  it('should render neutral change', () => {
    render(<TrendIndicator value={100} previousValue={100} />);

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('0.0%');
  });

  it('should use external change when provided', () => {
    render(<TrendIndicator value={100} change={25} />);

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('+25.0%');
  });

  it('should show up arrow for positive change', () => {
    render(<TrendIndicator value={110} previousValue={100} />);

    const arrow = screen.getByTestId('trend-arrow');
    expect(arrow).toHaveTextContent('↑');
  });

  it('should show down arrow for negative change', () => {
    render(<TrendIndicator value={90} previousValue={100} />);

    const arrow = screen.getByTestId('trend-arrow');
    expect(arrow).toHaveTextContent('↓');
  });

  it('should hide arrow when showArrow is false', () => {
    render(<TrendIndicator value={110} previousValue={100} showArrow={false} />);

    expect(screen.queryByTestId('trend-arrow')).not.toBeInTheDocument();
  });

  it('should respect decimals parameter', () => {
    render(<TrendIndicator value={110} previousValue={100} decimals={2} />);

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('+10.00%');
  });

  it('should invert colors when invertColors is true', () => {
    const { container: positiveContainer } = render(
      <TrendIndicator value={110} previousValue={100} invertColors />
    );
    // When inverted, positive change should be red (text-red-500)
    expect(positiveContainer.querySelector('.text-red-500')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<TrendIndicator value={100} previousValue={100} className="custom-trend" />);

    const indicator = screen.getByTestId('trend-indicator');
    expect(indicator).toHaveClass('custom-trend');
  });

  it('should handle zero previousValue gracefully', () => {
    render(<TrendIndicator value={100} previousValue={0} />);

    const value = screen.getByTestId('trend-value');
    expect(value).toHaveTextContent('0.0%');
  });
});
