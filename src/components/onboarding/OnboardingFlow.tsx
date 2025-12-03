'use client';

/**
 * Onboarding Flow Component
 *
 * Phase 2, Week 4, Day 5
 * Guided onboarding experience for new users
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ================================================================
// TYPES
// ================================================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  isComplete?: boolean;
}

export interface OnboardingFlowProps {
  steps: OnboardingStep[];
  currentStep: number;
  onStepComplete: (stepId: string) => void;
  onSkip: () => void;
  onComplete: () => void;
  className?: string;
}

// ================================================================
// DEFAULT STEPS
// ================================================================

export const DEFAULT_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to AI Perception',
    description: 'Discover how AI models see your brand. We analyze how ChatGPT, Claude, Gemini, and Perplexity understand and represent your business.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'first-analysis',
    title: 'Run Your First Analysis',
    description: 'Enter any URL to see how AI models perceive that brand. You\'ll get a comprehensive score across multiple AI providers.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    action: {
      label: 'Analyze a URL',
      href: '/',
    },
  },
  {
    id: 'understand-score',
    title: 'Understand Your Score',
    description: 'Your AI Perception Score (0-100) indicates how well AI models understand and represent your brand. Higher scores mean better visibility in AI-powered search and assistants.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'recommendations',
    title: 'Get Actionable Recommendations',
    description: 'Each analysis includes specific recommendations to improve your AI perception. Implement these to boost your visibility in AI-powered search.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    title: 'Track Your Progress',
    description: 'Use your dashboard to monitor score changes over time, compare against competitors, and track the impact of your improvements.',
    icon: (
      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    action: {
      label: 'Go to Dashboard',
      href: '/dashboard',
    },
  },
];

// ================================================================
// STEP INDICATOR
// ================================================================

function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: OnboardingStep[];
  currentStep: number;
  onStepClick: (index: number) => void;
}) {
  return (
    <div className="flex items-center justify-center space-x-2">
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => onStepClick(index)}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            index === currentStep
              ? 'bg-indigo-500 w-8'
              : index < currentStep
                ? 'bg-indigo-400'
                : 'bg-gray-600 hover:bg-gray-500'
          }`}
          aria-label={`Go to step ${index + 1}: ${step.title}`}
        />
      ))}
    </div>
  );
}

// ================================================================
// STEP CONTENT
// ================================================================

function StepContent({
  step,
  isLast,
  onNext,
  onAction,
}: {
  step: OnboardingStep;
  isLast: boolean;
  onNext: () => void;
  onAction: () => void;
}) {
  return (
    <div className="text-center px-8 py-12">
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
        {step.icon}
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">{step.title}</h2>

      <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
        {step.description}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {step.action && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
          >
            {step.action.label}
          </button>
        )}

        <button
          onClick={onNext}
          className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
            step.action
              ? 'text-gray-400 hover:text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
          }`}
        >
          {isLast ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function OnboardingFlow({
  steps = DEFAULT_ONBOARDING_STEPS,
  currentStep: initialStep = 0,
  onStepComplete,
  onSkip,
  onComplete,
  className = '',
}: OnboardingFlowProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    onStepComplete(step.id);

    setTimeout(() => {
      if (isLast) {
        onComplete();
      } else {
        setCurrentStep((prev) => prev + 1);
      }
      setIsAnimating(false);
    }, 200);
  }, [currentStep, isLast, step.id, onStepComplete, onComplete, isAnimating]);

  const handleAction = useCallback(() => {
    if (step.action?.onClick) {
      step.action.onClick();
    } else if (step.action?.href) {
      router.push(step.action.href);
    }
  }, [step.action, router]);

  const handleStepClick = useCallback((index: number) => {
    if (index <= currentStep) {
      setCurrentStep(index);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' && currentStep > 0) {
        setCurrentStep((prev) => prev - 1);
      } else if (e.key === 'Escape') {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, currentStep, onSkip]);

  return (
    <div className={`fixed inset-0 z-50 bg-gray-900/95 backdrop-blur-sm flex items-center justify-center ${className}`}>
      <div className="relative w-full max-w-2xl mx-4">
        {/* Skip button */}
        <button
          onClick={onSkip}
          className="absolute -top-12 right-0 text-gray-500 hover:text-white text-sm transition-colors"
        >
          Skip onboarding
        </button>

        {/* Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Content */}
          <div
            className={`transition-opacity duration-200 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}
          >
            <StepContent
              step={step}
              isLast={isLast}
              onNext={handleNext}
              onAction={handleAction}
            />
          </div>

          {/* Step indicator */}
          <div className="pb-6">
            <StepIndicator
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />
          </div>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-gray-600 text-xs mt-4">
          Use arrow keys to navigate, Enter to continue, Esc to skip
        </p>
      </div>
    </div>
  );
}

// ================================================================
// ONBOARDING PROVIDER
// ================================================================

interface OnboardingContextValue {
  isOnboarding: boolean;
  startOnboarding: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = React.createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = React.useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({
  children,
  storageKey = 'ai-perception-onboarding',
}: {
  children: React.ReactNode;
  storageKey?: string;
}) {
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setIsOnboarding(true);
    }
    setHasChecked(true);
  }, [storageKey]);

  const startOnboarding = useCallback(() => {
    setIsOnboarding(true);
  }, []);

  const completeOnboarding = useCallback(() => {
    localStorage.setItem(storageKey, 'true');
    setIsOnboarding(false);
  }, [storageKey]);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(storageKey, 'skipped');
    setIsOnboarding(false);
  }, [storageKey]);

  const handleStepComplete = useCallback((stepId: string) => {
    // Track step completion for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'onboarding_step_complete', {
        step_id: stepId,
      });
    }
  }, []);

  if (!hasChecked) {
    return null; // Prevent flash
  }

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding,
        startOnboarding,
        completeOnboarding,
        skipOnboarding,
      }}
    >
      {children}
      {isOnboarding && (
        <OnboardingFlow
          steps={DEFAULT_ONBOARDING_STEPS}
          currentStep={0}
          onStepComplete={handleStepComplete}
          onSkip={skipOnboarding}
          onComplete={completeOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}

// ================================================================
// TOOLTIP ONBOARDING (for in-app guidance)
// ================================================================

export interface TooltipStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

export function OnboardingTooltip({
  step,
  onNext,
  onSkip,
  currentIndex,
  totalSteps,
}: {
  step: TooltipStep;
  onNext: () => void;
  onSkip: () => void;
  currentIndex: number;
  totalSteps: number;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const target = document.querySelector(step.target);
    if (target) {
      const rect = target.getBoundingClientRect();
      const placement = step.placement || 'bottom';

      let top = 0;
      let left = 0;

      switch (placement) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setPosition({ top, left });

      // Highlight target
      target.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-gray-900');

      return () => {
        target.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-gray-900');
      };
    }
  }, [step]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onSkip} />

      {/* Tooltip */}
      <div
        className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl max-w-xs transform -translate-x-1/2"
        style={{ top: position.top, left: position.left }}
      >
        <h4 className="text-white font-semibold mb-2">{step.title}</h4>
        <p className="text-gray-400 text-sm mb-4">{step.content}</p>

        <div className="flex items-center justify-between">
          <span className="text-gray-500 text-xs">
            {currentIndex + 1} of {totalSteps}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white text-sm"
            >
              Skip
            </button>
            <button
              onClick={onNext}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded"
            >
              {currentIndex === totalSteps - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
