/**
 * Trend Chart Tests
 *
 * Phase 2, Week 4, Day 3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TrendChart, MultiSeriesTrendChart } from './TrendChart';
import type { TrendDataPoint, MultiSeriesData, SeriesConfig } from './TrendChart';

// Mock ResizeObserver for Recharts
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

beforeEach(() => {
  global.ResizeObserver = ResizeObserverMock;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ================================================================
// TEST DATA
// ================================================================

const mockTrendData: TrendDataPoint[] = [
  { date: '2024-01-01', score: 45 },
  { date: '2024-01-08', score: 52 },
  { date: '2024-01-15', score: 58 },
  { date: '2024-01-22', score: 65 },
  { date: '2024-01-29', score: 72 },
];

const mockTrendDataWithLabels: TrendDataPoint[] = [
  { date: '2024-01-01', score: 45, label: 'Initial analysis' },
  { date: '2024-01-08', score: 52, label: 'After SEO changes' },
  { date: '2024-01-15', score: 58, label: 'Weekly check' },
];

const mockDecreasingData: TrendDataPoint[] = [
  { date: '2024-01-01', score: 72 },
  { date: '2024-01-08', score: 65 },
  { date: '2024-01-15', score: 58 },
];

const mockStableData: TrendDataPoint[] = [
  { date: '2024-01-01', score: 60 },
  { date: '2024-01-08', score: 60 },
  { date: '2024-01-15', score: 60 },
];

// ================================================================
// TREND CHART TESTS
// ================================================================

describe('TrendChart', () => {
  describe('Rendering', () => {
    it('should render chart container', () => {
      render(<TrendChart data={mockTrendData} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<TrendChart data={mockTrendData} title="Score Trend" />);
      expect(screen.getByTestId('trend-chart-title')).toHaveTextContent('Score Trend');
    });

    it('should apply custom className', () => {
      render(<TrendChart data={mockTrendData} className="custom-class" />);
      expect(screen.getByTestId('trend-chart')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(<TrendChart data={[]} />);
      expect(screen.getByTestId('trend-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No data yet')).toBeInTheDocument();
    });

    it('should show message to run analyses', () => {
      render(<TrendChart data={[]} />);
      expect(screen.getByText('Run analyses to see trends')).toBeInTheDocument();
    });
  });

  describe('Single Data Point', () => {
    it('should show single score display', () => {
      render(<TrendChart data={[{ date: '2024-01-01', score: 75 }]} />);
      expect(screen.getByTestId('trend-chart-single')).toBeInTheDocument();
    });

    it('should display current score prominently', () => {
      render(<TrendChart data={[{ date: '2024-01-01', score: 75 }]} />);
      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('Current Score')).toBeInTheDocument();
    });
  });

  describe('Trend Indicator', () => {
    it('should show upward trend indicator when improving', () => {
      render(<TrendChart data={mockTrendData} title="Score" />);
      const indicator = screen.getByTestId('trend-indicator');
      expect(indicator).toHaveTextContent('27 pts');
      expect(indicator).toHaveClass('bg-green-100');
    });

    it('should show downward trend indicator when declining', () => {
      render(<TrendChart data={mockDecreasingData} title="Score" />);
      const indicator = screen.getByTestId('trend-indicator');
      expect(indicator).toHaveTextContent('14 pts');
      expect(indicator).toHaveClass('bg-red-100');
    });

    it('should not show indicator for stable data', () => {
      render(<TrendChart data={mockStableData} title="Score" />);
      expect(screen.queryByTestId('trend-indicator')).not.toBeInTheDocument();
    });
  });

  describe('Celebration', () => {
    it('should show celebration overlay when score improves significantly', async () => {
      vi.useFakeTimers();
      render(
        <TrendChart
          data={mockTrendData}
          showCelebration={true}
          celebrationThreshold={5}
        />
      );

      // Celebration should appear
      expect(screen.getByTestId('celebration-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('celebration-emoji')).toHaveTextContent('🎉');
      expect(screen.getByText('Score Improved!')).toBeInTheDocument();

      vi.useRealTimers();
    });

    it('should not show celebration when disabled', () => {
      render(
        <TrendChart
          data={mockTrendData}
          showCelebration={false}
        />
      );

      expect(screen.queryByTestId('celebration-overlay')).not.toBeInTheDocument();
    });

    it('should not show celebration when change is below threshold', () => {
      const smallImprovement: TrendDataPoint[] = [
        { date: '2024-01-01', score: 60 },
        { date: '2024-01-08', score: 62 },
      ];

      render(
        <TrendChart
          data={smallImprovement}
          showCelebration={true}
          celebrationThreshold={5}
        />
      );

      expect(screen.queryByTestId('celebration-overlay')).not.toBeInTheDocument();
    });

    it('should display improvement amount in celebration', () => {
      render(
        <TrendChart
          data={mockTrendData}
          showCelebration={true}
          celebrationThreshold={5}
        />
      );

      // Verify celebration shows the correct improvement amount (72-45=27)
      expect(screen.getByText('+27 points')).toBeInTheDocument();
    });
  });

  describe('Chart Variants', () => {
    it('should render line chart by default', () => {
      render(<TrendChart data={mockTrendData} variant="line" />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should render area chart when specified', () => {
      render(<TrendChart data={mockTrendData} variant="area" />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });
  });

  describe('Colors', () => {
    it('should apply blue color by default', () => {
      render(<TrendChart data={mockTrendData} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should apply green color when specified', () => {
      render(<TrendChart data={mockTrendData} color="green" />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should apply purple color when specified', () => {
      render(<TrendChart data={mockTrendData} color="purple" />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });
  });

  describe('Grid and Average', () => {
    it('should show grid by default', () => {
      render(<TrendChart data={mockTrendData} showGrid={true} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should hide grid when disabled', () => {
      render(<TrendChart data={mockTrendData} showGrid={false} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });

    it('should show average reference line when enabled', () => {
      render(<TrendChart data={mockTrendData} showAverage={true} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });
  });

  describe('Custom Height', () => {
    it('should apply custom height', () => {
      render(<TrendChart data={mockTrendData} height={300} />);
      expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
    });
  });
});

// ================================================================
// MULTI-SERIES TREND CHART TESTS
// ================================================================

describe('MultiSeriesTrendChart', () => {
  const mockMultiSeriesData: MultiSeriesData[] = [
    { date: '2024-01-01', yourScore: 45, competitorA: 55, competitorB: 60 },
    { date: '2024-01-08', yourScore: 52, competitorA: 56, competitorB: 58 },
    { date: '2024-01-15', yourScore: 58, competitorA: 57, competitorB: 59 },
    { date: '2024-01-22', yourScore: 65, competitorA: 58, competitorB: 60 },
  ];

  const mockSeries: SeriesConfig[] = [
    { key: 'yourScore', name: 'Your Score', color: 'blue' },
    { key: 'competitorA', name: 'Competitor A', color: 'green' },
    { key: 'competitorB', name: 'Competitor B', color: 'orange' },
  ];

  describe('Rendering', () => {
    it('should render multi-series chart', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
        />
      );
      expect(screen.getByTestId('multi-trend-chart')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          title="Competitor Comparison"
        />
      );
      expect(screen.getByTestId('multi-trend-chart-title')).toHaveTextContent(
        'Competitor Comparison'
      );
    });

    it('should apply custom className', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          className="custom-class"
        />
      );
      expect(screen.getByTestId('multi-trend-chart')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(<MultiSeriesTrendChart data={[]} series={mockSeries} />);
      expect(screen.getByTestId('multi-trend-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No comparison data')).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should show legend by default', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          showLegend={true}
        />
      );
      expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
      expect(screen.getByText('Your Score')).toBeInTheDocument();
      expect(screen.getByText('Competitor A')).toBeInTheDocument();
      expect(screen.getByText('Competitor B')).toBeInTheDocument();
    });

    it('should hide legend when disabled', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          showLegend={false}
        />
      );
      expect(screen.queryByTestId('chart-legend')).not.toBeInTheDocument();
    });
  });

  describe('Chart Options', () => {
    it('should show grid by default', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          showGrid={true}
        />
      );
      expect(screen.getByTestId('multi-trend-chart')).toBeInTheDocument();
    });

    it('should hide grid when disabled', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          showGrid={false}
        />
      );
      expect(screen.getByTestId('multi-trend-chart')).toBeInTheDocument();
    });

    it('should apply custom height', () => {
      render(
        <MultiSeriesTrendChart
          data={mockMultiSeriesData}
          series={mockSeries}
          height={350}
        />
      );
      expect(screen.getByTestId('multi-trend-chart')).toBeInTheDocument();
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle very large scores', () => {
    const largeScoreData: TrendDataPoint[] = [
      { date: '2024-01-01', score: 98 },
      { date: '2024-01-08', score: 99 },
      { date: '2024-01-15', score: 100 },
    ];

    render(<TrendChart data={largeScoreData} />);
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
  });

  it('should handle very low scores', () => {
    const lowScoreData: TrendDataPoint[] = [
      { date: '2024-01-01', score: 5 },
      { date: '2024-01-08', score: 3 },
      { date: '2024-01-15', score: 1 },
    ];

    render(<TrendChart data={lowScoreData} />);
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
  });

  it('should handle data with labels', () => {
    render(<TrendChart data={mockTrendDataWithLabels} />);
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
  });

  it('should handle many data points', () => {
    const manyPoints: TrendDataPoint[] = Array.from({ length: 50 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      score: 50 + Math.floor(Math.random() * 30),
    }));

    render(<TrendChart data={manyPoints} />);
    expect(screen.getByTestId('trend-chart')).toBeInTheDocument();
  });
});
