/**
 * Social Proof Component Tests
 *
 * Phase 2, Week 4, Day 4
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  SocialProof,
  InlineSocialProof,
  SocialProofBadge,
} from './SocialProof';
import type {
  IndustryBenchmark,
  CompetitorPreview,
} from './SocialProof';

// ================================================================
// TEST DATA
// ================================================================

const mockBenchmark: IndustryBenchmark = {
  industry: 'SaaS',
  averageScore: 65,
  topPerformerScore: 92,
  totalBrands: 1250,
  percentile: 78,
};

const mockCompetitors: CompetitorPreview[] = [
  { name: 'Competitor A', score: 85, trend: 'up' },
  { name: 'Competitor B', score: 72, trend: 'stable' },
  { name: 'Competitor C', score: 68, trend: 'down' },
];

// ================================================================
// SOCIAL PROOF MAIN COMPONENT TESTS
// ================================================================

describe('SocialProof', () => {
  describe('Rendering', () => {
    it('should render social proof container', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('social-proof')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
          className="custom-class"
        />
      );
      expect(screen.getByTestId('social-proof')).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('should show skeleton when loading', () => {
      render(<SocialProof userScore={75} isLoading={true} />);
      expect(screen.getByTestId('social-proof-skeleton')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no benchmark or competitors', () => {
      render(<SocialProof userScore={75} />);
      expect(screen.getByTestId('social-proof-empty')).toBeInTheDocument();
    });

    it('should show message to run more analyses', () => {
      render(<SocialProof userScore={75} />);
      expect(
        screen.getByText(/run more analyses to unlock/i)
      ).toBeInTheDocument();
    });
  });

  describe('Industry Comparison Card', () => {
    it('should render industry comparison card', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('industry-comparison-card')).toBeInTheDocument();
    });

    it('should display user score', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('user-score-display')).toHaveTextContent('75');
    });

    it('should display industry average', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('industry-avg-display')).toHaveTextContent('65');
    });

    it('should display total brands count', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('total-brands')).toHaveTextContent('1,250');
    });

    it('should display top performer score', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('top-performer-score')).toHaveTextContent('92');
    });

    it('should display percentile label when provided', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('percentile-label')).toHaveTextContent('Top 25%');
    });
  });

  describe('Score Comparison Labels', () => {
    it('should show "above average" when user score is higher', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('comparison-label')).toHaveTextContent(
        /above average/i
      );
    });

    it('should show "below average" when user score is lower', () => {
      render(
        <SocialProof
          userScore={45}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('comparison-label')).toHaveTextContent(
        /below average/i
      );
    });

    it('should show "at industry average" when scores are close', () => {
      render(
        <SocialProof
          userScore={65}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('comparison-label')).toHaveTextContent(
        /at industry average/i
      );
    });

    it('should show trophy emoji for high performers', () => {
      render(
        <SocialProof
          userScore={85}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('comparison-emoji')).toHaveTextContent('🏆');
    });
  });

  describe('Quick Stats Row', () => {
    it('should display industry name', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('industry-name')).toHaveTextContent('SaaS');
    });

    it('should display quick stats row', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
        />
      );
      expect(screen.getByTestId('quick-stats-row')).toBeInTheDocument();
    });
  });

  describe('Competitor Preview', () => {
    it('should render competitor preview card', () => {
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
        />
      );
      expect(screen.getByTestId('competitor-preview-card')).toBeInTheDocument();
    });

    it('should display competitor items', () => {
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
        />
      );
      expect(screen.getByTestId('competitor-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('competitor-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('competitor-item-2')).toBeInTheDocument();
    });

    it('should display competitor names', () => {
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
        />
      );
      expect(screen.getByText('Competitor A')).toBeInTheDocument();
      expect(screen.getByText('Competitor B')).toBeInTheDocument();
      expect(screen.getByText('Competitor C')).toBeInTheDocument();
    });

    it('should display competitor scores', () => {
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
        />
      );
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('68')).toBeInTheDocument();
    });

    it('should show upgrade prompt when enabled', () => {
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
          showUpgradePrompt={true}
        />
      );
      expect(
        screen.getByTestId('view-all-competitors-button')
      ).toBeInTheDocument();
    });

    it('should trigger upgrade callback on click', () => {
      const handleUpgrade = vi.fn();
      render(
        <SocialProof
          userScore={75}
          competitors={mockCompetitors}
          showUpgradePrompt={true}
          onUpgrade={handleUpgrade}
        />
      );

      fireEvent.click(screen.getByTestId('view-all-competitors-button'));
      expect(handleUpgrade).toHaveBeenCalled();
    });

    it('should limit displayed competitors to 3', () => {
      const manyCompetitors: CompetitorPreview[] = [
        { name: 'Comp 1', score: 90 },
        { name: 'Comp 2', score: 85 },
        { name: 'Comp 3', score: 80 },
        { name: 'Comp 4', score: 75 },
        { name: 'Comp 5', score: 70 },
      ];
      render(
        <SocialProof
          userScore={75}
          competitors={manyCompetitors}
        />
      );
      expect(screen.queryByText('Comp 4')).not.toBeInTheDocument();
      expect(screen.queryByText('Comp 5')).not.toBeInTheDocument();
    });
  });

  describe('Combined View', () => {
    it('should show both benchmark and competitors', () => {
      render(
        <SocialProof
          userScore={75}
          industry="SaaS"
          benchmark={mockBenchmark}
          competitors={mockCompetitors}
        />
      );
      expect(screen.getByTestId('industry-comparison-card')).toBeInTheDocument();
      expect(screen.getByTestId('competitor-preview-card')).toBeInTheDocument();
    });
  });
});

// ================================================================
// INLINE SOCIAL PROOF TESTS
// ================================================================

describe('InlineSocialProof', () => {
  it('should render inline social proof', () => {
    render(<InlineSocialProof userScore={75} industryAverage={65} />);
    expect(screen.getByTestId('inline-social-proof')).toBeInTheDocument();
  });

  it('should show points above average', () => {
    render(<InlineSocialProof userScore={75} industryAverage={65} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/above/i)).toBeInTheDocument();
  });

  it('should show points below average', () => {
    render(<InlineSocialProof userScore={55} industryAverage={65} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText(/below/i)).toBeInTheDocument();
  });

  it('should include industry name when provided', () => {
    render(
      <InlineSocialProof
        userScore={75}
        industryAverage={65}
        industry="SaaS"
      />
    );
    expect(screen.getByText(/SaaS average/i)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <InlineSocialProof
        userScore={75}
        industryAverage={65}
        className="custom-class"
      />
    );
    expect(screen.getByTestId('inline-social-proof')).toHaveClass('custom-class');
  });
});

// ================================================================
// SOCIAL PROOF BADGE TESTS
// ================================================================

describe('SocialProofBadge', () => {
  it('should render badge', () => {
    render(<SocialProofBadge percentile={78} />);
    expect(screen.getByTestId('social-proof-badge')).toBeInTheDocument();
  });

  it('should show "Top 10%" for 90+ percentile', () => {
    render(<SocialProofBadge percentile={95} />);
    expect(screen.getByText('Top 10%')).toBeInTheDocument();
  });

  it('should show "Top 25%" for 75-89 percentile', () => {
    render(<SocialProofBadge percentile={80} />);
    expect(screen.getByText('Top 25%')).toBeInTheDocument();
  });

  it('should show "Top 50%" for 50-74 percentile', () => {
    render(<SocialProofBadge percentile={60} />);
    expect(screen.getByText('Top 50%')).toBeInTheDocument();
  });

  it('should show "Bottom 50%" for 25-49 percentile', () => {
    render(<SocialProofBadge percentile={35} />);
    expect(screen.getByText('Bottom 50%')).toBeInTheDocument();
  });

  it('should show "Bottom 25%" for <25 percentile', () => {
    render(<SocialProofBadge percentile={15} />);
    expect(screen.getByText('Bottom 25%')).toBeInTheDocument();
  });

  it('should show trophy for top performers', () => {
    render(<SocialProofBadge percentile={80} />);
    expect(screen.getByText(/🏆/)).toBeInTheDocument();
  });

  it('should not show trophy for lower performers', () => {
    render(<SocialProofBadge percentile={50} />);
    expect(screen.queryByText(/🏆/)).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(<SocialProofBadge percentile={80} className="custom-class" />);
    expect(screen.getByTestId('social-proof-badge')).toHaveClass('custom-class');
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  it('should handle zero user score', () => {
    render(
      <SocialProof
        userScore={0}
        industry="SaaS"
        benchmark={mockBenchmark}
      />
    );
    expect(screen.getByTestId('user-score-display')).toHaveTextContent('0');
  });

  it('should handle 100 user score', () => {
    render(
      <SocialProof
        userScore={100}
        industry="SaaS"
        benchmark={mockBenchmark}
      />
    );
    expect(screen.getByTestId('user-score-display')).toHaveTextContent('100');
  });

  it('should handle benchmark without percentile', () => {
    const benchmarkNoPercentile = { ...mockBenchmark, percentile: undefined };
    render(
      <SocialProof
        userScore={75}
        industry="SaaS"
        benchmark={benchmarkNoPercentile}
      />
    );
    expect(screen.queryByTestId('percentile-label')).not.toBeInTheDocument();
  });

  it('should handle competitors without trends', () => {
    const competitorsNoTrend: CompetitorPreview[] = [
      { name: 'Comp A', score: 80 },
      { name: 'Comp B', score: 75 },
    ];
    render(
      <SocialProof
        userScore={75}
        competitors={competitorsNoTrend}
      />
    );
    expect(screen.getByText('Comp A')).toBeInTheDocument();
  });

  it('should handle empty competitors array', () => {
    render(
      <SocialProof
        userScore={75}
        industry="SaaS"
        benchmark={mockBenchmark}
        competitors={[]}
      />
    );
    expect(
      screen.queryByTestId('competitor-preview-card')
    ).not.toBeInTheDocument();
  });

  it('should handle exact average match', () => {
    render(
      <InlineSocialProof userScore={65} industryAverage={65} />
    );
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should handle large brand counts', () => {
    const largeBenchmark = { ...mockBenchmark, totalBrands: 1000000 };
    render(
      <SocialProof
        userScore={75}
        industry="SaaS"
        benchmark={largeBenchmark}
      />
    );
    expect(screen.getByTestId('total-brands')).toHaveTextContent('1,000,000');
  });
});
