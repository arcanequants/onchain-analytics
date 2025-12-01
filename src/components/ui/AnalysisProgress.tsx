/**
 * Analysis Progress Component
 *
 * Phase 1, Week 2, Day 4
 * Loading experience with progress storytelling and rotating facts.
 * Designed to keep users engaged during 30-45 second analysis wait.
 */

'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ProviderBadge, type AIProviderType } from './AIProviderCard';

// ================================================================
// TYPES
// ================================================================

export type AnalysisStage =
  | 'extracting_metadata'
  | 'detecting_industry'
  | 'querying_openai'
  | 'querying_anthropic'
  | 'querying_google'
  | 'querying_perplexity'
  | 'analyzing_responses'
  | 'calculating_score'
  | 'complete';

export interface AnalysisStep {
  id: AnalysisStage;
  label: string;
  description?: string;
  provider?: AIProviderType;
}

export interface AnalysisProgressProps {
  /** Current stage of analysis */
  currentStage: AnalysisStage;
  /** Progress percentage (0-100) */
  progress: number;
  /** Detected brand name */
  brandName?: string;
  /** Detected industry */
  industry?: string;
  /** Error message if any */
  error?: string;
  /** Additional status message */
  statusMessage?: string;
  /** Whether analysis is complete */
  isComplete?: boolean;
  /** CSS class name */
  className?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'extracting_metadata', label: 'Extracting website information...' },
  { id: 'detecting_industry', label: 'Detecting your industry...' },
  { id: 'querying_openai', label: 'Asking ChatGPT about your brand...', provider: 'openai' },
  { id: 'querying_anthropic', label: 'Asking Claude about your brand...', provider: 'anthropic' },
  { id: 'analyzing_responses', label: 'Analyzing AI responses...' },
  { id: 'calculating_score', label: 'Calculating your perception score...' },
  { id: 'complete', label: 'Analysis complete!' },
];

const ROTATING_FACTS = [
  {
    stat: '67%',
    text: 'of B2B buyers ask AI assistants for product recommendations before contacting sales.',
    icon: '💡',
  },
  {
    stat: '200M+',
    text: 'weekly active users on ChatGPT. That\'s a lot of potential customers asking about your industry.',
    icon: '📊',
  },
  {
    stat: '70%',
    text: 'of searches will start with AI by 2027. Is your brand ready to be found?',
    icon: '🔮',
  },
  {
    stat: '78%',
    text: 'of SMBs are not visible to AI assistants. This is your opportunity to stand out.',
    icon: '🎯',
  },
  {
    stat: '3x',
    text: 'more likely to be recommended. Brands with strong AI presence get 3x more mentions.',
    icon: '🚀',
  },
  {
    stat: '45%',
    text: 'of users trust AI recommendations. Make sure your brand is on the list.',
    icon: '✅',
  },
];

const FACT_ROTATION_INTERVAL = 8000; // 8 seconds

// ================================================================
// UTILITIES
// ================================================================

function getStageIndex(stage: AnalysisStage): number {
  return ANALYSIS_STEPS.findIndex((s) => s.id === stage);
}

function getStageProgress(stage: AnalysisStage): number {
  const progressMap: Record<AnalysisStage, number> = {
    extracting_metadata: 10,
    detecting_industry: 20,
    querying_openai: 40,
    querying_anthropic: 60,
    querying_google: 65,
    querying_perplexity: 70,
    analyzing_responses: 80,
    calculating_score: 95,
    complete: 100,
  };
  return progressMap[stage] || 0;
}

// ================================================================
// STEP INDICATOR COMPONENT
// ================================================================

interface StepIndicatorProps {
  step: AnalysisStep;
  status: 'completed' | 'in_progress' | 'pending';
  industry?: string;
}

function StepIndicator({ step, status, industry }: StepIndicatorProps): React.ReactElement {
  // Customize label with industry if available
  let label = step.label;
  if (industry && step.id === 'detecting_industry' && status === 'completed') {
    label = `Detected industry: "${industry}"`;
  }

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Status icon */}
      <div className="w-5 h-5 flex items-center justify-center">
        {status === 'completed' && (
          <svg
            className="w-5 h-5 text-[var(--success)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {status === 'in_progress' && (
          <div className="w-4 h-4 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
        )}
        {status === 'pending' && (
          <div className="w-3 h-3 rounded-full border-2 border-[var(--text-tertiary)]" />
        )}
      </div>

      {/* Provider badge if applicable */}
      {step.provider && (
        <ProviderBadge
          provider={step.provider}
          status={status === 'completed' ? 'success' : status === 'in_progress' ? 'pending' : undefined}
          size="sm"
          showLabel={false}
        />
      )}

      {/* Label */}
      <span
        className={`text-sm ${
          status === 'completed'
            ? 'text-[var(--text-primary)]'
            : status === 'in_progress'
            ? 'text-[var(--text-primary)] font-medium'
            : 'text-[var(--text-tertiary)]'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ================================================================
// ROTATING FACT COMPONENT
// ================================================================

interface RotatingFactProps {
  className?: string;
}

function RotatingFact({ className = '' }: RotatingFactProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % ROTATING_FACTS.length);
        setIsVisible(true);
      }, 300);
    }, FACT_ROTATION_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const fact = ROTATING_FACTS[currentIndex];

  return (
    <div
      className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      <div className="flex items-start gap-3 p-4 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
        <span className="text-2xl">{fact.icon}</span>
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-lg font-bold text-[var(--accent-primary)]">{fact.stat}</span>
            <span className="text-xs text-[var(--text-tertiary)]">Did you know?</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{fact.text}</p>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// PROGRESS BAR COMPONENT
// ================================================================

interface ProgressBarProps {
  progress: number;
  animate?: boolean;
}

function ProgressBar({ progress, animate = true }: ProgressBarProps): React.ReactElement {
  return (
    <div className="relative h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
      <div
        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-500 ${
          animate ? 'ease-out' : ''
        }`}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      >
        {/* Animated shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function AnalysisProgress({
  currentStage,
  progress,
  brandName,
  industry,
  error,
  statusMessage,
  isComplete = false,
  className = '',
}: AnalysisProgressProps): React.ReactElement {
  // Calculate which steps are completed/in-progress/pending
  const currentIndex = getStageIndex(currentStage);
  const calculatedProgress = progress || getStageProgress(currentStage);

  // Filter steps to show only main ones (not all providers)
  const visibleSteps = ANALYSIS_STEPS.filter(
    (step) => !['querying_google', 'querying_perplexity'].includes(step.id)
  );

  return (
    <div
      className={`bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 ${className}`}
      data-testid="analysis-progress"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          {isComplete ? 'Analysis Complete!' : 'Analyzing your AI perception...'}
        </h2>
        {brandName && !isComplete && (
          <p className="text-sm text-[var(--text-secondary)]">
            Checking how AI models perceive <span className="font-medium">{brandName}</span>
          </p>
        )}
        {statusMessage && (
          <p className="text-sm text-[var(--text-tertiary)] mt-1">{statusMessage}</p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-[var(--text-tertiary)]">Progress</span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {Math.round(calculatedProgress)}%
          </span>
        </div>
        <ProgressBar progress={calculatedProgress} />
      </div>

      {/* Steps */}
      <div className="mb-6 space-y-1">
        {visibleSteps.map((step, index) => {
          const stepIndex = ANALYSIS_STEPS.findIndex((s) => s.id === step.id);
          let status: 'completed' | 'in_progress' | 'pending' = 'pending';

          if (stepIndex < currentIndex) {
            status = 'completed';
          } else if (stepIndex === currentIndex) {
            status = 'in_progress';
          }

          // Mark complete stage as completed
          if (isComplete || currentStage === 'complete') {
            status = 'completed';
          }

          return (
            <StepIndicator
              key={step.id}
              step={step}
              status={status}
              industry={industry}
            />
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-500">Something went wrong</p>
              <p className="text-sm text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Rotating Facts - only show during analysis */}
      {!isComplete && !error && <RotatingFact />}

      {/* Completion celebration */}
      {isComplete && (
        <div className="text-center p-6 bg-gradient-to-r from-[var(--success)]/10 to-[var(--success)]/5 rounded-lg border border-[var(--success)]/30">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Your analysis is ready!
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            Discover how AI models perceive your brand and get actionable recommendations.
          </p>
        </div>
      )}
    </div>
  );
}

// ================================================================
// HOOK: useAnalysisProgress
// ================================================================

export interface UseAnalysisProgressOptions {
  /** Initial stage */
  initialStage?: AnalysisStage;
  /** Callback when analysis completes */
  onComplete?: () => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
}

export interface UseAnalysisProgressReturn {
  stage: AnalysisStage;
  progress: number;
  error: string | null;
  isComplete: boolean;
  updateStage: (stage: AnalysisStage) => void;
  updateProgress: (progress: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export function useAnalysisProgress(
  options: UseAnalysisProgressOptions = {}
): UseAnalysisProgressReturn {
  const { initialStage = 'extracting_metadata', onComplete, onError } = options;

  const [stage, setStage] = useState<AnalysisStage>(initialStage);
  const [progress, setProgress] = useState(0);
  const [error, setErrorState] = useState<string | null>(null);

  const updateStage = useCallback((newStage: AnalysisStage) => {
    setStage(newStage);
    setProgress(getStageProgress(newStage));
    if (newStage === 'complete') {
      onComplete?.();
    }
  }, [onComplete]);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const setError = useCallback((errorMsg: string) => {
    setErrorState(errorMsg);
    onError?.(errorMsg);
  }, [onError]);

  const reset = useCallback(() => {
    setStage(initialStage);
    setProgress(0);
    setErrorState(null);
  }, [initialStage]);

  return {
    stage,
    progress,
    error,
    isComplete: stage === 'complete',
    updateStage,
    updateProgress,
    setError,
    reset,
  };
}

// ================================================================
// SKELETON LOADING COMPONENT
// ================================================================

export function AnalysisProgressSkeleton(): React.ReactElement {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center mb-6">
        <div className="h-6 w-64 bg-[var(--bg-tertiary)] rounded mx-auto mb-2" />
        <div className="h-4 w-48 bg-[var(--bg-tertiary)] rounded mx-auto" />
      </div>

      {/* Progress bar skeleton */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="h-3 w-16 bg-[var(--bg-tertiary)] rounded" />
          <div className="h-4 w-8 bg-[var(--bg-tertiary)] rounded" />
        </div>
        <div className="h-3 bg-[var(--bg-tertiary)] rounded-full" />
      </div>

      {/* Steps skeleton */}
      <div className="mb-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-5 h-5 bg-[var(--bg-tertiary)] rounded-full" />
            <div className="h-4 flex-1 bg-[var(--bg-tertiary)] rounded" />
          </div>
        ))}
      </div>

      {/* Fact skeleton */}
      <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-[var(--bg-secondary)] rounded" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-[var(--bg-secondary)] rounded mb-2" />
            <div className="h-3 w-full bg-[var(--bg-secondary)] rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// CSS FOR SHIMMER ANIMATION (add to globals.css)
// ================================================================

// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }

// ================================================================
// EXPORTS
// ================================================================

export default AnalysisProgress;
