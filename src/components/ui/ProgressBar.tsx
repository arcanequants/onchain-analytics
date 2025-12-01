'use client';

/**
 * ProgressBar Component
 *
 * Phase 1, Week 1, Day 3
 * Based on EXECUTIVE-ROADMAP-BCG.md UX deliverables
 *
 * Features:
 * - Multi-step progress visualization
 * - Step labels and icons
 * - Animated progress
 * - Accessible (ARIA labels)
 * - Responsive design
 */

import React from 'react';

// ================================================================
// TYPES
// ================================================================

export interface ProgressStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

export type ProgressStatus = 'pending' | 'active' | 'completed' | 'error';

export interface StepStatus {
  stepId: string;
  status: ProgressStatus;
  progress?: number; // 0-100 for partial progress within a step
  message?: string;
}

export interface ProgressBarProps {
  /** Array of steps to display */
  steps: ProgressStep[];
  /** Current status of each step */
  stepStatuses: StepStatus[];
  /** Show step numbers instead of icons */
  showNumbers?: boolean;
  /** Compact mode (no labels) */
  compact?: boolean;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom class name */
  className?: string;
  /** Animated transitions */
  animated?: boolean;
}

// ================================================================
// STYLES
// ================================================================

const styles = {
  container: {
    horizontal: 'flex items-center justify-between w-full',
    vertical: 'flex flex-col space-y-4',
  },
  stepWrapper: {
    horizontal: 'flex flex-col items-center flex-1',
    vertical: 'flex items-start space-x-4',
  },
  stepIndicator: {
    base: `
      relative flex items-center justify-center
      w-10 h-10 rounded-full
      font-semibold text-sm
      transition-all duration-300 ease-in-out
      border-2
    `,
    pending: `
      bg-gray-100 dark:bg-gray-800
      border-gray-300 dark:border-gray-600
      text-gray-500 dark:text-gray-400
    `,
    active: `
      bg-blue-100 dark:bg-blue-900/30
      border-blue-500
      text-blue-600 dark:text-blue-400
      ring-4 ring-blue-100 dark:ring-blue-900/50
    `,
    completed: `
      bg-green-500 dark:bg-green-600
      border-green-500 dark:border-green-600
      text-white
    `,
    error: `
      bg-red-100 dark:bg-red-900/30
      border-red-500
      text-red-600 dark:text-red-400
    `,
  },
  connector: {
    horizontal: `
      flex-1 h-1 mx-2
      transition-all duration-500 ease-in-out
    `,
    vertical: `
      w-1 h-full min-h-[2rem] ml-5
      transition-all duration-500 ease-in-out
    `,
    pending: 'bg-gray-200 dark:bg-gray-700',
    completed: 'bg-green-500 dark:bg-green-600',
    active: 'bg-gradient-to-r from-green-500 to-blue-500',
  },
  label: {
    base: `
      mt-2 text-sm font-medium
      transition-colors duration-200
    `,
    pending: 'text-gray-500 dark:text-gray-400',
    active: 'text-blue-600 dark:text-blue-400',
    completed: 'text-green-600 dark:text-green-500',
    error: 'text-red-600 dark:text-red-400',
  },
  description: {
    base: 'text-xs text-gray-500 dark:text-gray-400 mt-1',
  },
  message: {
    base: `
      text-xs mt-1 max-w-[120px] text-center
      overflow-hidden text-ellipsis whitespace-nowrap
    `,
    active: 'text-blue-600 dark:text-blue-400',
    error: 'text-red-600 dark:text-red-400',
  },
};

// ================================================================
// ICONS
// ================================================================

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={`${className} animate-spin`}
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ================================================================
// STEP INDICATOR COMPONENT
// ================================================================

interface StepIndicatorProps {
  step: ProgressStep;
  status: ProgressStatus;
  index: number;
  showNumber: boolean;
  animated: boolean;
  progress?: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  step,
  status,
  index,
  showNumber,
  animated,
  progress,
}) => {
  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return styles.stepIndicator.completed;
      case 'active':
        return styles.stepIndicator.active;
      case 'error':
        return styles.stepIndicator.error;
      default:
        return styles.stepIndicator.pending;
    }
  };

  const getContent = () => {
    if (status === 'completed') {
      return <CheckIcon className="w-5 h-5" />;
    }
    if (status === 'error') {
      return <ErrorIcon className="w-5 h-5" />;
    }
    if (status === 'active' && animated) {
      return <SpinnerIcon className="w-5 h-5" />;
    }
    if (step.icon && !showNumber) {
      return step.icon;
    }
    return index + 1;
  };

  return (
    <div
      className={`${styles.stepIndicator.base} ${getStatusClass()}`}
      role="listitem"
      aria-current={status === 'active' ? 'step' : undefined}
      aria-label={`Step ${index + 1}: ${step.label} - ${status}`}
    >
      {/* Progress ring for active step */}
      {status === 'active' && progress !== undefined && progress > 0 && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 44 44"
        >
          <circle
            className="text-blue-500"
            strokeWidth="4"
            stroke="currentColor"
            fill="transparent"
            r="18"
            cx="22"
            cy="22"
            style={{
              strokeDasharray: `${2 * Math.PI * 18}`,
              strokeDashoffset: `${2 * Math.PI * 18 * (1 - progress / 100)}`,
              transition: 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>
      )}
      <span className="relative z-10">{getContent()}</span>
    </div>
  );
};

// ================================================================
// CONNECTOR COMPONENT
// ================================================================

interface ConnectorProps {
  status: 'pending' | 'completed' | 'active';
  orientation: 'horizontal' | 'vertical';
}

const Connector: React.FC<ConnectorProps> = ({ status, orientation }) => {
  const getStatusClass = () => {
    switch (status) {
      case 'completed':
        return styles.connector.completed;
      case 'active':
        return styles.connector.active;
      default:
        return styles.connector.pending;
    }
  };

  return (
    <div
      className={`${styles.connector[orientation]} ${getStatusClass()}`}
      aria-hidden="true"
    />
  );
};

// ================================================================
// MAIN PROGRESS BAR COMPONENT
// ================================================================

export const ProgressBar: React.FC<ProgressBarProps> = ({
  steps,
  stepStatuses,
  showNumbers = false,
  compact = false,
  orientation = 'horizontal',
  className = '',
  animated = true,
}) => {
  // Create a map for quick status lookup
  const statusMap = new Map(stepStatuses.map(s => [s.stepId, s]));

  // Get status for a step
  const getStepStatus = (stepId: string): StepStatus => {
    return statusMap.get(stepId) || { stepId, status: 'pending' };
  };

  // Determine connector status based on adjacent steps
  const getConnectorStatus = (
    currentStatus: ProgressStatus,
    nextStatus: ProgressStatus
  ): 'pending' | 'completed' | 'active' => {
    if (currentStatus === 'completed' && nextStatus === 'completed') {
      return 'completed';
    }
    if (currentStatus === 'completed' && nextStatus === 'active') {
      return 'active';
    }
    if (currentStatus === 'completed') {
      return 'completed';
    }
    return 'pending';
  };

  // Calculate overall progress
  const completedSteps = steps.filter(
    step => getStepStatus(step.id).status === 'completed'
  ).length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  return (
    <div
      className={`${styles.container[orientation]} ${className}`}
      role="list"
      aria-label={`Progress: ${overallProgress}% complete`}
    >
      {steps.map((step, index) => {
        const stepStatus = getStepStatus(step.id);
        const isLast = index === steps.length - 1;
        const nextStepStatus = !isLast
          ? getStepStatus(steps[index + 1].id)
          : null;

        return (
          <React.Fragment key={step.id}>
            <div className={styles.stepWrapper[orientation]}>
              <StepIndicator
                step={step}
                status={stepStatus.status}
                index={index}
                showNumber={showNumbers}
                animated={animated}
                progress={stepStatus.progress}
              />

              {!compact && (
                <div className="flex flex-col items-center">
                  <span
                    className={`
                      ${styles.label.base}
                      ${styles.label[stepStatus.status]}
                    `}
                  >
                    {step.label}
                  </span>

                  {step.description && (
                    <span className={styles.description.base}>
                      {step.description}
                    </span>
                  )}

                  {stepStatus.message && (
                    <span
                      className={`
                        ${styles.message.base}
                        ${stepStatus.status === 'active' ? styles.message.active : ''}
                        ${stepStatus.status === 'error' ? styles.message.error : ''}
                      `}
                      title={stepStatus.message}
                    >
                      {stepStatus.message}
                    </span>
                  )}
                </div>
              )}
            </div>

            {!isLast && (
              <Connector
                status={getConnectorStatus(
                  stepStatus.status,
                  nextStepStatus?.status || 'pending'
                )}
                orientation={orientation}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ================================================================
// SIMPLE PROGRESS BAR (Linear)
// ================================================================

export interface SimpleProgressBarProps {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  color?: 'primary' | 'success' | 'warning' | 'error';
  /** Striped animation */
  striped?: boolean;
  /** Indeterminate state */
  indeterminate?: boolean;
  /** Custom class name */
  className?: string;
}

const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-4',
};

const colorClasses = {
  primary: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

export const SimpleProgressBar: React.FC<SimpleProgressBarProps> = ({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'md',
  color = 'primary',
  striped = false,
  indeterminate = false,
  className = '',
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div
        className={`
          w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden
          ${sizeClasses[size]}
        `}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || `${percentage}% complete`}
      >
        <div
          className={`
            h-full rounded-full transition-all duration-300 ease-out
            ${colorClasses[color]}
            ${striped ? 'progress-striped animate-progress-stripes' : ''}
            ${indeterminate ? 'animate-indeterminate' : ''}
          `}
          style={{
            width: indeterminate ? '50%' : `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
};

// ================================================================
// ANALYSIS PROGRESS (Specialized for analysis flow)
// ================================================================

export interface AnalysisStep {
  id: string;
  label: string;
  provider?: string;
}

export const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'url', label: 'Analyzing URL' },
  { id: 'industry', label: 'Detecting Industry' },
  { id: 'openai', label: 'Querying OpenAI', provider: 'openai' },
  { id: 'anthropic', label: 'Querying Anthropic', provider: 'anthropic' },
  { id: 'scoring', label: 'Calculating Score' },
  { id: 'recommendations', label: 'Generating Insights' },
];

export interface AnalysisProgressProps {
  currentStep: string;
  completedSteps: string[];
  error?: { step: string; message: string };
  className?: string;
}

export const AnalysisProgress: React.FC<AnalysisProgressProps> = ({
  currentStep,
  completedSteps,
  error,
  className = '',
}) => {
  const steps: ProgressStep[] = ANALYSIS_STEPS.map(s => ({
    id: s.id,
    label: s.label,
  }));

  const stepStatuses: StepStatus[] = ANALYSIS_STEPS.map(step => {
    if (error?.step === step.id) {
      return { stepId: step.id, status: 'error', message: error.message };
    }
    if (completedSteps.includes(step.id)) {
      return { stepId: step.id, status: 'completed' };
    }
    if (currentStep === step.id) {
      return { stepId: step.id, status: 'active' };
    }
    return { stepId: step.id, status: 'pending' };
  });

  return (
    <ProgressBar
      steps={steps}
      stepStatuses={stepStatuses}
      className={className}
      animated
    />
  );
};

// ================================================================
// EXPORTS
// ================================================================

export default ProgressBar;
