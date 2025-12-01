/**
 * ProgressBar Component Tests
 *
 * Phase 1, Week 1, Day 3
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProgressBar,
  SimpleProgressBar,
  AnalysisProgress,
  ANALYSIS_STEPS,
  type ProgressStep,
  type StepStatus,
} from './ProgressBar';

// ================================================================
// PROGRESS BAR TESTS
// ================================================================

describe('ProgressBar', () => {
  const defaultSteps: ProgressStep[] = [
    { id: 'step1', label: 'Step 1' },
    { id: 'step2', label: 'Step 2' },
    { id: 'step3', label: 'Step 3' },
  ];

  describe('rendering', () => {
    it('should render all steps', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'active' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Step 3')).toBeInTheDocument();
    });

    it('should render step numbers when showNumbers is true', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'pending' },
        { stepId: 'step2', status: 'pending' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(
        <ProgressBar
          steps={defaultSteps}
          stepStatuses={statuses}
          showNumbers
        />
      );

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should hide labels in compact mode', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'pending' },
        { stepId: 'step2', status: 'pending' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(
        <ProgressBar
          steps={defaultSteps}
          stepStatuses={statuses}
          compact
        />
      );

      expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
    });
  });

  describe('status display', () => {
    it('should show checkmark for completed steps', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'pending' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      // Check for aria label indicating completed status
      expect(screen.getByLabelText(/Step 1.*completed/i)).toBeInTheDocument();
    });

    it('should show active indicator for current step', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'active' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      // Check for aria-current on active step
      expect(screen.getByLabelText(/Step 2.*active/i)).toHaveAttribute(
        'aria-current',
        'step'
      );
    });

    it('should show error indicator for failed steps', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'error', message: 'Failed' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      expect(screen.getByLabelText(/Step 2.*error/i)).toBeInTheDocument();
    });

    it('should display step messages', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'active', message: 'Processing...' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have correct role', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'pending' },
      ];

      render(
        <ProgressBar
          steps={[{ id: 'step1', label: 'Step 1' }]}
          stepStatuses={statuses}
        />
      );

      expect(screen.getByRole('list')).toBeInTheDocument();
    });

    it('should show overall progress in aria-label', () => {
      const statuses: StepStatus[] = [
        { stepId: 'step1', status: 'completed' },
        { stepId: 'step2', status: 'active' },
        { stepId: 'step3', status: 'pending' },
      ];

      render(<ProgressBar steps={defaultSteps} stepStatuses={statuses} />);

      expect(screen.getByLabelText(/33% complete/i)).toBeInTheDocument();
    });
  });

  describe('step descriptions', () => {
    it('should show step descriptions when provided', () => {
      const stepsWithDesc: ProgressStep[] = [
        { id: 'step1', label: 'Step 1', description: 'First step description' },
      ];
      const statuses: StepStatus[] = [{ stepId: 'step1', status: 'pending' }];

      render(<ProgressBar steps={stepsWithDesc} stepStatuses={statuses} />);

      expect(screen.getByText('First step description')).toBeInTheDocument();
    });
  });
});

// ================================================================
// SIMPLE PROGRESS BAR TESTS
// ================================================================

describe('SimpleProgressBar', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<SimpleProgressBar value={50} />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show correct percentage', () => {
      render(<SimpleProgressBar value={75} showLabel />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should show custom label', () => {
      render(<SimpleProgressBar value={50} label="Uploading" showLabel />);

      expect(screen.getByText('Uploading')).toBeInTheDocument();
    });

    it('should cap value at 100%', () => {
      render(<SimpleProgressBar value={150} showLabel />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should not go below 0%', () => {
      render(<SimpleProgressBar value={-10} showLabel />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have correct aria attributes', () => {
      render(<SimpleProgressBar value={50} max={100} label="Progress" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-valuenow', '50');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-label', () => {
      render(<SimpleProgressBar value={50} label="Loading" />);

      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toHaveAttribute('aria-label', 'Loading');
    });
  });

  describe('custom max value', () => {
    it('should calculate percentage based on max', () => {
      render(<SimpleProgressBar value={25} max={50} showLabel />);

      expect(screen.getByText('50%')).toBeInTheDocument();
    });
  });
});

// ================================================================
// ANALYSIS PROGRESS TESTS
// ================================================================

describe('AnalysisProgress', () => {
  it('should render all analysis steps', () => {
    render(
      <AnalysisProgress
        currentStep="url"
        completedSteps={[]}
      />
    );

    expect(screen.getByText('Analyzing URL')).toBeInTheDocument();
    expect(screen.getByText('Detecting Industry')).toBeInTheDocument();
    expect(screen.getByText('Querying OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Querying Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Calculating Score')).toBeInTheDocument();
    expect(screen.getByText('Generating Insights')).toBeInTheDocument();
  });

  it('should mark completed steps', () => {
    render(
      <AnalysisProgress
        currentStep="openai"
        completedSteps={['url', 'industry']}
      />
    );

    expect(screen.getByLabelText(/Analyzing URL.*completed/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Detecting Industry.*completed/i)).toBeInTheDocument();
  });

  it('should mark current step as active', () => {
    render(
      <AnalysisProgress
        currentStep="scoring"
        completedSteps={['url', 'industry', 'openai', 'anthropic']}
      />
    );

    expect(screen.getByLabelText(/Calculating Score.*active/i)).toHaveAttribute(
      'aria-current',
      'step'
    );
  });

  it('should show error state', () => {
    render(
      <AnalysisProgress
        currentStep="openai"
        completedSteps={['url', 'industry']}
        error={{ step: 'openai', message: 'API error' }}
      />
    );

    expect(screen.getByLabelText(/Querying OpenAI.*error/i)).toBeInTheDocument();
    expect(screen.getByText('API error')).toBeInTheDocument();
  });

  it('should have correct number of steps', () => {
    expect(ANALYSIS_STEPS).toHaveLength(6);
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('edge cases', () => {
  it('should handle empty steps array', () => {
    render(<ProgressBar steps={[]} stepStatuses={[]} />);

    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('should handle missing step statuses', () => {
    const steps: ProgressStep[] = [
      { id: 'step1', label: 'Step 1' },
      { id: 'step2', label: 'Step 2' },
    ];

    // Only provide status for one step
    const statuses: StepStatus[] = [
      { stepId: 'step1', status: 'completed' },
    ];

    render(<ProgressBar steps={steps} stepStatuses={statuses} />);

    // Step 2 should default to pending
    expect(screen.getByLabelText(/Step 2.*pending/i)).toBeInTheDocument();
  });

  it('should handle single step', () => {
    const steps: ProgressStep[] = [{ id: 'only', label: 'Only Step' }];
    const statuses: StepStatus[] = [{ stepId: 'only', status: 'active' }];

    render(<ProgressBar steps={steps} stepStatuses={statuses} />);

    expect(screen.getByText('Only Step')).toBeInTheDocument();
    // Should show 0% progress (0 completed out of 1)
    expect(screen.getByLabelText(/0% complete/i)).toBeInTheDocument();
  });

  it('should handle all steps completed', () => {
    const steps: ProgressStep[] = [
      { id: 'step1', label: 'Step 1' },
      { id: 'step2', label: 'Step 2' },
    ];
    const statuses: StepStatus[] = [
      { stepId: 'step1', status: 'completed' },
      { stepId: 'step2', status: 'completed' },
    ];

    render(<ProgressBar steps={steps} stepStatuses={statuses} />);

    expect(screen.getByLabelText(/100% complete/i)).toBeInTheDocument();
  });
});
