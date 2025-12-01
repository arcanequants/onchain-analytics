/**
 * Dashboard Empty States Tests
 *
 * Phase 2, Week 4, Day 2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EmptyState,
  NoAnalyses,
  NoHistory,
  NoSearchResults,
  NoCompetitors,
  NoSavedUrls,
  NoMonitoring,
  NoReports,
  ErrorState,
} from './EmptyStates';

// ================================================================
// BASE EMPTY STATE TESTS
// ================================================================

describe('EmptyState', () => {
  it('should render empty state container', () => {
    render(<EmptyState title="Test title" />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('should render title', () => {
    render(<EmptyState title="Test title" />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Test title');
  });

  it('should render description', () => {
    render(<EmptyState title="Title" description="Test description" />);

    expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
      'Test description'
    );
  });

  it('should render icon when provided', () => {
    render(
      <EmptyState
        title="Title"
        icon={<span data-testid="custom-icon">Icon</span>}
      />
    );

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-icon')).toBeInTheDocument();
  });

  it('should render primary action button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Title"
        action={{ label: 'Click me', onClick: handleClick }}
      />
    );

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Click me');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render secondary action button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyState
        title="Title"
        action={{ label: 'Primary', onClick: () => {} }}
        secondaryAction={{ label: 'Secondary', onClick: handleClick }}
      />
    );

    const button = screen.getByTestId('empty-state-secondary-action');
    expect(button).toHaveTextContent('Secondary');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render children', () => {
    render(
      <EmptyState title="Title">
        <div data-testid="custom-content">Custom content</div>
      </EmptyState>
    );

    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-children')).toBeInTheDocument();
  });

  describe('sizes', () => {
    it('should apply small size classes', () => {
      render(<EmptyState title="Title" size="sm" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('py-6');
    });

    it('should apply medium size classes', () => {
      render(<EmptyState title="Title" size="md" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('py-12');
    });

    it('should apply large size classes', () => {
      render(<EmptyState title="Title" size="lg" />);

      const container = screen.getByTestId('empty-state');
      expect(container).toHaveClass('py-16');
    });
  });

  describe('button variants', () => {
    it('should apply primary variant by default', () => {
      render(
        <EmptyState
          title="Title"
          action={{ label: 'Button', onClick: () => {} }}
        />
      );

      const button = screen.getByTestId('empty-state-action');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('should apply secondary variant', () => {
      render(
        <EmptyState
          title="Title"
          action={{ label: 'Button', onClick: () => {}, variant: 'secondary' }}
        />
      );

      const button = screen.getByTestId('empty-state-action');
      expect(button).toHaveClass('bg-gray-100');
    });
  });
});

// ================================================================
// PRESET EMPTY STATE TESTS
// ================================================================

describe('NoAnalyses', () => {
  it('should render empty analyses state', () => {
    render(<NoAnalyses />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No analyses yet');
  });

  it('should show action button when callback provided', () => {
    const handleRun = vi.fn();
    render(<NoAnalyses onRunAnalysis={handleRun} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Run Analysis');

    fireEvent.click(button);
    expect(handleRun).toHaveBeenCalled();
  });
});

describe('NoHistory', () => {
  it('should render empty history state', () => {
    render(<NoHistory />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No history yet');
  });

  it('should render locked history state', () => {
    render(<NoHistory reason="locked" />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('History locked');
  });

  it('should show upgrade button when locked', () => {
    const handleUpgrade = vi.fn();
    render(<NoHistory reason="locked" onUpgrade={handleUpgrade} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Upgrade to Unlock');

    fireEvent.click(button);
    expect(handleUpgrade).toHaveBeenCalled();
  });

  it('should show run analysis button when empty', () => {
    const handleRun = vi.fn();
    render(<NoHistory reason="empty" onRunAnalysis={handleRun} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Run Analysis');

    fireEvent.click(button);
    expect(handleRun).toHaveBeenCalled();
  });
});

describe('NoSearchResults', () => {
  it('should render no search results state', () => {
    render(<NoSearchResults />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No results found');
  });

  it('should include query in description', () => {
    render(<NoSearchResults query="test query" />);

    expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
      'test query'
    );
  });

  it('should show clear search button', () => {
    const handleClear = vi.fn();
    render(<NoSearchResults onClearSearch={handleClear} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Clear Search');

    fireEvent.click(button);
    expect(handleClear).toHaveBeenCalled();
  });
});

describe('NoCompetitors', () => {
  it('should render no competitors state', () => {
    render(<NoCompetitors />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
      'No competitors added'
    );
  });

  it('should render locked competitors state', () => {
    render(<NoCompetitors reason="locked" />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
      'Competitor analysis locked'
    );
  });

  it('should show add competitor button when empty', () => {
    const handleAdd = vi.fn();
    render(<NoCompetitors onAddCompetitor={handleAdd} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Add Competitor');

    fireEvent.click(button);
    expect(handleAdd).toHaveBeenCalled();
  });

  it('should show upgrade button when locked', () => {
    const handleUpgrade = vi.fn();
    render(<NoCompetitors reason="locked" onUpgrade={handleUpgrade} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Upgrade to Unlock');

    fireEvent.click(button);
    expect(handleUpgrade).toHaveBeenCalled();
  });
});

describe('NoSavedUrls', () => {
  it('should render no saved URLs state', () => {
    render(<NoSavedUrls />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No saved URLs');
  });

  it('should show save URL button', () => {
    const handleAdd = vi.fn();
    render(<NoSavedUrls onAddUrl={handleAdd} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Save URL');

    fireEvent.click(button);
    expect(handleAdd).toHaveBeenCalled();
  });
});

describe('NoMonitoring', () => {
  it('should render no monitoring state', () => {
    render(<NoMonitoring />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
      'No monitoring set up'
    );
  });

  it('should render locked monitoring state', () => {
    render(<NoMonitoring reason="locked" />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
      'Monitoring locked'
    );
  });

  it('should show setup button when empty', () => {
    const handleSetup = vi.fn();
    render(<NoMonitoring onSetupMonitoring={handleSetup} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Set Up Monitoring');

    fireEvent.click(button);
    expect(handleSetup).toHaveBeenCalled();
  });

  it('should show upgrade button when locked', () => {
    const handleUpgrade = vi.fn();
    render(<NoMonitoring reason="locked" onUpgrade={handleUpgrade} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Upgrade to Unlock');

    fireEvent.click(button);
    expect(handleUpgrade).toHaveBeenCalled();
  });
});

describe('NoReports', () => {
  it('should render no reports state', () => {
    render(<NoReports />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No reports yet');
  });

  it('should render locked reports state', () => {
    render(<NoReports reason="locked" />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Reports locked');
  });

  it('should show create report button when empty', () => {
    const handleCreate = vi.fn();
    render(<NoReports onCreateReport={handleCreate} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Create Report');

    fireEvent.click(button);
    expect(handleCreate).toHaveBeenCalled();
  });

  it('should show upgrade button when locked', () => {
    const handleUpgrade = vi.fn();
    render(<NoReports reason="locked" onUpgrade={handleUpgrade} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Upgrade to Unlock');

    fireEvent.click(button);
    expect(handleUpgrade).toHaveBeenCalled();
  });
});

describe('ErrorState', () => {
  it('should render error state with defaults', () => {
    render(<ErrorState />);

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent(
      'Something went wrong'
    );
    expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
      'We encountered an error'
    );
  });

  it('should render custom error title and message', () => {
    render(
      <ErrorState title="Custom error" message="Custom error message" />
    );

    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Custom error');
    expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
      'Custom error message'
    );
  });

  it('should show retry button', () => {
    const handleRetry = vi.fn();
    render(<ErrorState onRetry={handleRetry} />);

    const button = screen.getByTestId('empty-state-action');
    expect(button).toHaveTextContent('Try Again');

    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalled();
  });
});

// ================================================================
// INTEGRATION TESTS
// ================================================================

describe('EmptyStates integration', () => {
  it('should work with freemium gating', () => {
    const handleUpgrade = vi.fn();

    render(
      <div>
        <NoHistory reason="locked" onUpgrade={handleUpgrade} />
        <NoCompetitors reason="locked" onUpgrade={handleUpgrade} />
        <NoMonitoring reason="locked" onUpgrade={handleUpgrade} />
      </div>
    );

    // All locked states should show upgrade buttons
    const buttons = screen.getAllByTestId('empty-state-action');
    expect(buttons).toHaveLength(3);
    buttons.forEach((button) => {
      expect(button).toHaveTextContent('Upgrade to Unlock');
    });
  });

  it('should support different sizes in context', () => {
    render(
      <div>
        <div data-testid="sidebar">
          <NoAnalyses size="sm" />
        </div>
        <div data-testid="main">
          <NoAnalyses size="lg" />
        </div>
      </div>
    );

    const states = screen.getAllByTestId('empty-state');
    expect(states[0]).toHaveClass('py-6'); // sm
    expect(states[1]).toHaveClass('py-16'); // lg
  });
});
