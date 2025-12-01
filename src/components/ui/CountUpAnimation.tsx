/**
 * Count-Up Animation Component
 *
 * Phase 1, Week 2, Day 2
 * Animated number counter with configurable easing and duration.
 */

'use client';

import React, { useEffect, useState, useRef } from 'react';

// ================================================================
// TYPES
// ================================================================

export interface CountUpAnimationProps {
  /** Target value to count up to */
  value: number;
  /** Starting value (default: 0) */
  from?: number;
  /** Animation duration in ms */
  duration?: number;
  /** Easing function */
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'bounce';
  /** Number of decimal places */
  decimals?: number;
  /** Prefix string (e.g., "$") */
  prefix?: string;
  /** Suffix string (e.g., "%") */
  suffix?: string;
  /** Separator for thousands */
  separator?: string;
  /** CSS class name */
  className?: string;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Whether to start animation immediately */
  autoStart?: boolean;
  /** Delay before starting animation */
  delay?: number;
}

// ================================================================
// EASING FUNCTIONS
// ================================================================

type EasingFunction = (t: number) => number;

const easingFunctions: Record<string, EasingFunction> = {
  linear: (t) => t,
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  bounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
};

// ================================================================
// UTILITIES
// ================================================================

/**
 * Format number with separators and decimals
 */
function formatNumber(
  value: number,
  decimals: number,
  separator: string
): string {
  const fixed = value.toFixed(decimals);
  const [intPart, decPart] = fixed.split('.');

  const formattedInt = separator
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    : intPart;

  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

// ================================================================
// HOOK: useCountUp
// ================================================================

export interface UseCountUpOptions {
  from?: number;
  to: number;
  duration?: number;
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'bounce';
  autoStart?: boolean;
  delay?: number;
  onComplete?: () => void;
}

export interface UseCountUpReturn {
  value: number;
  isAnimating: boolean;
  start: () => void;
  reset: () => void;
  pause: () => void;
}

export function useCountUp({
  from = 0,
  to,
  duration = 1000,
  easing = 'easeOut',
  autoStart = true,
  delay = 0,
  onComplete,
}: UseCountUpOptions): UseCountUpReturn {
  const [value, setValue] = useState(from);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedAtRef = useRef<number | null>(null);

  const easingFn = easingFunctions[easing] || easingFunctions.easeOut;

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easingFn(progress);
    const currentValue = from + (to - from) * easedProgress;

    setValue(currentValue);

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      setValue(to);
      setIsAnimating(false);
      onComplete?.();
    }
  };

  const start = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;
    pausedAtRef.current = null;
    setIsAnimating(true);
    animationRef.current = requestAnimationFrame(animate);
  };

  const reset = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    startTimeRef.current = null;
    pausedAtRef.current = null;
    setIsAnimating(false);
    setValue(from);
  };

  const pause = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setIsAnimating(false);
  };

  useEffect(() => {
    if (autoStart) {
      const timeoutId = setTimeout(() => {
        start();
      }, delay);
      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart, delay, to]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { value, isAnimating, start, reset, pause };
}

// ================================================================
// COMPONENT
// ================================================================

export function CountUpAnimation({
  value: targetValue,
  from = 0,
  duration = 1000,
  easing = 'easeOut',
  decimals = 0,
  prefix = '',
  suffix = '',
  separator = '',
  className = '',
  onComplete,
  autoStart = true,
  delay = 0,
}: CountUpAnimationProps): React.ReactElement {
  const { value, isAnimating } = useCountUp({
    from,
    to: targetValue,
    duration,
    easing,
    autoStart,
    delay,
    onComplete,
  });

  const formattedValue = formatNumber(value, decimals, separator);

  return (
    <span
      className={className}
      data-testid="count-up-animation"
      data-animating={isAnimating}
    >
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

// ================================================================
// VARIANT: SCORE COUNT UP
// ================================================================

export interface ScoreCountUpProps {
  score: number;
  duration?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPercent?: boolean;
  className?: string;
  onComplete?: () => void;
}

const SIZE_STYLES = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-6xl',
  xl: 'text-8xl',
};

export function ScoreCountUp({
  score,
  duration = 1500,
  size = 'lg',
  showPercent = false,
  className = '',
  onComplete,
}: ScoreCountUpProps): React.ReactElement {
  return (
    <div className={`font-bold ${SIZE_STYLES[size]} ${className}`}>
      <CountUpAnimation
        value={score}
        duration={duration}
        easing="easeOut"
        suffix={showPercent ? '%' : ''}
        onComplete={onComplete}
      />
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default CountUpAnimation;
