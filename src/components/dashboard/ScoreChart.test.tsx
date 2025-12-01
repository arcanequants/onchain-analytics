/**
 * Score Chart Tests
 *
 * Phase 2, Week 4, Day 3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProviderBarChart,
  ScoreGauge,
  CategoryBreakdownChart,
  ComparisonChart,
} from './ScoreChart';
import type { ProviderScore, CategoryScore, ComparisonData } from './ScoreChart';

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

const mockProviderScores: ProviderScore[] = [
  { provider: 'openai', score: 78 },
  { provider: 'anthropic', score: 82 },
  { provider: 'google', score: 65 },
  { provider: 'perplexity', score: 71 },
];

const mockCategoryScores: CategoryScore[] = [
  { category: 'Visibility', score: 75, weight: 30 },
  { category: 'Sentiment', score: 82, weight: 25 },
  { category: 'Accuracy', score: 68, weight: 25 },
  { category: 'Coverage', score: 90, weight: 20 },
];

const mockComparisonData: ComparisonData[] = [
  { name: 'Visibility', yourScore: 75, industryAvg: 65, topPerformer: 92 },
  { name: 'Sentiment', yourScore: 82, industryAvg: 70, topPerformer: 95 },
  { name: 'Accuracy', yourScore: 68, industryAvg: 72, topPerformer: 88 },
];

// ================================================================
// PROVIDER BAR CHART TESTS
// ================================================================

describe('ProviderBarChart', () => {
  describe('Rendering', () => {
    it('should render provider bar chart', () => {
      render(<ProviderBarChart data={mockProviderScores} />);
      expect(screen.getByTestId('provider-bar-chart')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(<ProviderBarChart data={mockProviderScores} title="AI Provider Scores" />);
      expect(screen.getByTestId('provider-chart-title')).toHaveTextContent(
        'AI Provider Scores'
      );
    });

    it('should apply custom className', () => {
      render(<ProviderBarChart data={mockProviderScores} className="custom-class" />);
      expect(screen.getByTestId('provider-bar-chart')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(<ProviderBarChart data={[]} />);
      expect(screen.getByTestId('provider-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No provider data')).toBeInTheDocument();
    });
  });

  describe('Labels', () => {
    it('should show provider labels by default', () => {
      render(<ProviderBarChart data={mockProviderScores} showLabels={true} />);
      expect(screen.getByTestId('provider-labels')).toBeInTheDocument();
    });

    it('should hide labels when disabled', () => {
      render(<ProviderBarChart data={mockProviderScores} showLabels={false} />);
      expect(screen.queryByTestId('provider-labels')).not.toBeInTheDocument();
    });

    it('should format provider names correctly', () => {
      render(<ProviderBarChart data={mockProviderScores} showLabels={true} />);
      expect(screen.getByText(/OpenAI:/)).toBeInTheDocument();
      expect(screen.getByText(/Claude:/)).toBeInTheDocument();
      expect(screen.getByText(/Gemini:/)).toBeInTheDocument();
    });
  });

  describe('Custom Labels', () => {
    it('should use custom label when provided', () => {
      const dataWithLabels: ProviderScore[] = [
        { provider: 'openai', score: 78, label: 'GPT-4o' },
        { provider: 'anthropic', score: 82, label: 'Claude 3' },
      ];
      render(<ProviderBarChart data={dataWithLabels} showLabels={true} />);
      expect(screen.getByText(/GPT-4o:/)).toBeInTheDocument();
      expect(screen.getByText(/Claude 3:/)).toBeInTheDocument();
    });
  });

  describe('Height', () => {
    it('should apply custom height', () => {
      render(<ProviderBarChart data={mockProviderScores} height={300} />);
      expect(screen.getByTestId('provider-bar-chart')).toBeInTheDocument();
    });
  });
});

// ================================================================
// SCORE GAUGE TESTS
// ================================================================

describe('ScoreGauge', () => {
  describe('Rendering', () => {
    it('should render score gauge', () => {
      render(<ScoreGauge score={75} />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });

    it('should display score value', () => {
      render(<ScoreGauge score={75} />);
      expect(screen.getByTestId('score-gauge-value')).toHaveTextContent('75');
    });

    it('should render title when provided', () => {
      render(<ScoreGauge score={75} title="Overall Score" />);
      expect(screen.getByTestId('score-gauge-title')).toHaveTextContent('Overall Score');
    });

    it('should apply custom className', () => {
      render(<ScoreGauge score={75} className="custom-class" />);
      expect(screen.getByTestId('score-gauge')).toHaveClass('custom-class');
    });
  });

  describe('Score Labels', () => {
    it('should show label by default', () => {
      render(<ScoreGauge score={85} showLabel={true} />);
      expect(screen.getByTestId('score-gauge-label')).toBeInTheDocument();
    });

    it('should hide label when disabled', () => {
      render(<ScoreGauge score={85} showLabel={false} />);
      expect(screen.queryByTestId('score-gauge-label')).not.toBeInTheDocument();
    });

    it('should show "Excellent" for scores 80+', () => {
      render(<ScoreGauge score={85} />);
      expect(screen.getByTestId('score-gauge-label')).toHaveTextContent('Excellent');
    });

    it('should show "Good" for scores 60-79', () => {
      render(<ScoreGauge score={70} />);
      expect(screen.getByTestId('score-gauge-label')).toHaveTextContent('Good');
    });

    it('should show "Fair" for scores 40-59', () => {
      render(<ScoreGauge score={50} />);
      expect(screen.getByTestId('score-gauge-label')).toHaveTextContent('Fair');
    });

    it('should show "Needs Work" for scores below 40', () => {
      render(<ScoreGauge score={25} />);
      expect(screen.getByTestId('score-gauge-label')).toHaveTextContent('Needs Work');
    });
  });

  describe('Sizes', () => {
    it('should apply small size', () => {
      render(<ScoreGauge score={75} size="sm" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });

    it('should apply medium size by default', () => {
      render(<ScoreGauge score={75} size="md" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });

    it('should apply large size', () => {
      render(<ScoreGauge score={75} size="lg" />);
      expect(screen.getByTestId('score-gauge')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle score of 0', () => {
      render(<ScoreGauge score={0} />);
      expect(screen.getByTestId('score-gauge-value')).toHaveTextContent('0');
    });

    it('should handle score of 100', () => {
      render(<ScoreGauge score={100} />);
      expect(screen.getByTestId('score-gauge-value')).toHaveTextContent('100');
    });
  });
});

// ================================================================
// CATEGORY BREAKDOWN CHART TESTS
// ================================================================

describe('CategoryBreakdownChart', () => {
  describe('Rendering', () => {
    it('should render category breakdown chart', () => {
      render(<CategoryBreakdownChart data={mockCategoryScores} />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <CategoryBreakdownChart data={mockCategoryScores} title="Score Breakdown" />
      );
      expect(screen.getByTestId('category-chart-title')).toHaveTextContent(
        'Score Breakdown'
      );
    });

    it('should apply custom className', () => {
      render(<CategoryBreakdownChart data={mockCategoryScores} className="custom-class" />);
      expect(screen.getByTestId('category-breakdown-chart')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(<CategoryBreakdownChart data={[]} />);
      expect(screen.getByTestId('category-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No category data')).toBeInTheDocument();
    });
  });

  describe('Chart Variants', () => {
    it('should render bar chart by default', () => {
      render(<CategoryBreakdownChart data={mockCategoryScores} variant="bar" />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });

    it('should render pie chart when specified', () => {
      render(<CategoryBreakdownChart data={mockCategoryScores} variant="pie" />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });
  });

  describe('Height', () => {
    it('should apply custom height', () => {
      render(<CategoryBreakdownChart data={mockCategoryScores} height={300} />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });
  });
});

// ================================================================
// COMPARISON CHART TESTS
// ================================================================

describe('ComparisonChart', () => {
  describe('Rendering', () => {
    it('should render comparison chart', () => {
      render(<ComparisonChart data={mockComparisonData} />);
      expect(screen.getByTestId('comparison-chart')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <ComparisonChart data={mockComparisonData} title="Industry Comparison" />
      );
      expect(screen.getByTestId('comparison-chart-title')).toHaveTextContent(
        'Industry Comparison'
      );
    });

    it('should apply custom className', () => {
      render(<ComparisonChart data={mockComparisonData} className="custom-class" />);
      expect(screen.getByTestId('comparison-chart')).toHaveClass('custom-class');
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no data', () => {
      render(<ComparisonChart data={[]} />);
      expect(screen.getByTestId('comparison-chart-empty')).toBeInTheDocument();
      expect(screen.getByText('No comparison data')).toBeInTheDocument();
    });
  });

  describe('Legend', () => {
    it('should show legend with all series', () => {
      render(<ComparisonChart data={mockComparisonData} />);
      expect(screen.getByTestId('comparison-legend')).toBeInTheDocument();
      expect(screen.getByText('Your Score')).toBeInTheDocument();
      expect(screen.getByText('Industry Avg')).toBeInTheDocument();
      expect(screen.getByText('Top Performer')).toBeInTheDocument();
    });

    it('should hide top performer legend when not in data', () => {
      const dataWithoutTop: ComparisonData[] = [
        { name: 'Visibility', yourScore: 75, industryAvg: 65 },
        { name: 'Sentiment', yourScore: 82, industryAvg: 70 },
      ];
      render(<ComparisonChart data={dataWithoutTop} />);
      expect(screen.queryByText('Top Performer')).not.toBeInTheDocument();
    });
  });

  describe('Height', () => {
    it('should apply custom height', () => {
      render(<ComparisonChart data={mockComparisonData} height={300} />);
      expect(screen.getByTestId('comparison-chart')).toBeInTheDocument();
    });
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  describe('ProviderBarChart', () => {
    it('should handle unknown provider', () => {
      const unknownProvider: ProviderScore[] = [{ provider: 'unknown', score: 50 }];
      render(<ProviderBarChart data={unknownProvider} showLabels={true} />);
      expect(screen.getByTestId('provider-bar-chart')).toBeInTheDocument();
    });

    it('should handle single provider', () => {
      const singleProvider: ProviderScore[] = [{ provider: 'openai', score: 85 }];
      render(<ProviderBarChart data={singleProvider} />);
      expect(screen.getByTestId('provider-bar-chart')).toBeInTheDocument();
    });
  });

  describe('CategoryBreakdownChart', () => {
    it('should handle many categories', () => {
      const manyCategories: CategoryScore[] = Array.from({ length: 10 }, (_, i) => ({
        category: `Category ${i + 1}`,
        score: 50 + i * 5,
      }));
      render(<CategoryBreakdownChart data={manyCategories} />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });

    it('should handle categories without weights', () => {
      const noWeights: CategoryScore[] = [
        { category: 'Test A', score: 70 },
        { category: 'Test B', score: 80 },
      ];
      render(<CategoryBreakdownChart data={noWeights} />);
      expect(screen.getByTestId('category-breakdown-chart')).toBeInTheDocument();
    });
  });

  describe('ComparisonChart', () => {
    it('should handle partial top performer data', () => {
      const partialData: ComparisonData[] = [
        { name: 'A', yourScore: 75, industryAvg: 65, topPerformer: 90 },
        { name: 'B', yourScore: 80, industryAvg: 70 }, // No top performer
      ];
      render(<ComparisonChart data={partialData} />);
      expect(screen.getByTestId('comparison-chart')).toBeInTheDocument();
    });
  });
});
