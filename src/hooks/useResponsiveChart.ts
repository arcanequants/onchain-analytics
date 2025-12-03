/**
 * useResponsiveChart Hook
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - ResizeObserver for container size detection
 * - Breakpoint-based chart adaptations
 * - Debounced resize handling
 * - SSR-safe implementation
 * - Mobile-first responsive transformations
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ChartDimensions {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export interface ResponsiveChartConfig {
  minWidth?: number;
  minHeight?: number;
  aspectRatio?: number;
  debounceMs?: number;
  onResize?: (dimensions: ChartDimensions) => void;
}

export interface ChartAdaptations {
  // Layout transformations
  shouldUseHorizontalLayout: boolean;
  shouldUseCompactLayout: boolean;
  shouldHideLabels: boolean;
  shouldUseSparkline: boolean;

  // Size adjustments
  fontSize: number;
  strokeWidth: number;
  dotRadius: number;
  padding: number;

  // Grid configuration
  gridColumns: number;
  showLegend: boolean;
  legendPosition: 'top' | 'bottom' | 'right' | 'none';

  // Animation
  enableAnimations: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const BREAKPOINTS = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

const DEFAULT_CONFIG: ResponsiveChartConfig = {
  minWidth: 200,
  minHeight: 150,
  aspectRatio: 16 / 9,
  debounceMs: 100,
};

// ============================================================================
// UTILITIES
// ============================================================================

function getBreakpoint(width: number): Breakpoint {
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function calculateAdaptations(dimensions: ChartDimensions): ChartAdaptations {
  const { breakpoint, isMobile, isTablet, width } = dimensions;

  // Base values that scale with breakpoint
  const sizeMultiplier = {
    xs: 0.6,
    sm: 0.75,
    md: 0.9,
    lg: 1,
    xl: 1.1,
  }[breakpoint];

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  return {
    // Layout transformations
    shouldUseHorizontalLayout: isMobile,
    shouldUseCompactLayout: width < 400,
    shouldHideLabels: width < 300,
    shouldUseSparkline: width < 200,

    // Size adjustments
    fontSize: Math.round(12 * sizeMultiplier),
    strokeWidth: Math.max(1, Math.round(2 * sizeMultiplier)),
    dotRadius: Math.max(2, Math.round(4 * sizeMultiplier)),
    padding: Math.round(16 * sizeMultiplier),

    // Grid configuration
    gridColumns: isMobile ? 4 : isTablet ? 8 : 12,
    showLegend: !isMobile,
    legendPosition: isMobile ? 'none' : isTablet ? 'bottom' : 'right',

    // Animation
    enableAnimations: !prefersReducedMotion && !isMobile,
  };
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useResponsiveChart(
  config: ResponsiveChartConfig = {}
): {
  ref: React.RefObject<HTMLDivElement | null>;
  dimensions: ChartDimensions;
  adaptations: ChartAdaptations;
  isReady: boolean;
} {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: mergedConfig.minWidth!,
    height: mergedConfig.minHeight!,
    breakpoint: 'md',
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  });

  const [isReady, setIsReady] = useState(false);

  const updateDimensions = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let width = Math.max(rect.width, mergedConfig.minWidth!);
    let height: number;

    if (mergedConfig.aspectRatio) {
      height = Math.max(width / mergedConfig.aspectRatio, mergedConfig.minHeight!);
    } else {
      height = Math.max(rect.height, mergedConfig.minHeight!);
    }

    const breakpoint = getBreakpoint(width);
    const newDimensions: ChartDimensions = {
      width,
      height,
      breakpoint,
      isMobile: breakpoint === 'xs' || breakpoint === 'sm',
      isTablet: breakpoint === 'md',
      isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    };

    setDimensions(newDimensions);
    setIsReady(true);

    if (mergedConfig.onResize) {
      mergedConfig.onResize(newDimensions);
    }
  }, [mergedConfig]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initial measurement
    updateDimensions();

    // Set up ResizeObserver with debounce
    const debouncedUpdate = debounce(updateDimensions, mergedConfig.debounceMs!);

    const resizeObserver = new ResizeObserver(() => {
      debouncedUpdate();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions, mergedConfig.debounceMs]);

  const adaptations = calculateAdaptations(dimensions);

  return {
    ref: containerRef,
    dimensions,
    adaptations,
    isReady,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for radar chart responsive behavior
 * Transforms radar to list view on mobile
 */
export function useResponsiveRadar() {
  const { ref, dimensions, adaptations, isReady } = useResponsiveChart({
    aspectRatio: 1, // Square for radar
    minWidth: 200,
    minHeight: 200,
  });

  const radarConfig = {
    ...adaptations,
    shouldTransformToList: dimensions.width < 300,
    labelOffset: adaptations.fontSize * 1.5,
    levels: dimensions.width < 400 ? 3 : 5,
  };

  return { ref, dimensions, config: radarConfig, isReady };
}

/**
 * Hook for gauge chart responsive behavior
 * Adjusts gauge thickness and label visibility
 */
export function useResponsiveGauge() {
  const { ref, dimensions, adaptations, isReady } = useResponsiveChart({
    aspectRatio: 1.5, // Wider than tall
    minWidth: 150,
    minHeight: 100,
  });

  const gaugeConfig = {
    ...adaptations,
    arcThickness: Math.max(8, Math.round(dimensions.width * 0.08)),
    showValue: dimensions.width >= 200,
    showLabel: dimensions.width >= 250,
    showTicks: dimensions.width >= 300,
  };

  return { ref, dimensions, config: gaugeConfig, isReady };
}

/**
 * Hook for area/line chart responsive behavior
 * Adjusts data points and axis labels
 */
export function useResponsiveAreaChart() {
  const { ref, dimensions, adaptations, isReady } = useResponsiveChart({
    aspectRatio: 16 / 9,
    minWidth: 200,
    minHeight: 120,
  });

  const areaConfig = {
    ...adaptations,
    maxDataPoints: dimensions.width < 400 ? 10 : dimensions.width < 600 ? 20 : 50,
    showXAxis: dimensions.width >= 300,
    showYAxis: dimensions.width >= 250,
    showGrid: dimensions.width >= 400,
    showTooltip: dimensions.width >= 200,
    tickCount: {
      x: dimensions.width < 400 ? 3 : dimensions.width < 600 ? 5 : 7,
      y: dimensions.height < 200 ? 3 : 5,
    },
  };

  return { ref, dimensions, config: areaConfig, isReady };
}

/**
 * Hook for bar chart responsive behavior
 * Switches between horizontal and vertical orientations
 */
export function useResponsiveBarChart() {
  const { ref, dimensions, adaptations, isReady } = useResponsiveChart({
    minWidth: 200,
    minHeight: 150,
  });

  const barConfig = {
    ...adaptations,
    orientation: dimensions.width < 400 ? 'horizontal' : 'vertical',
    maxBars: dimensions.width < 300 ? 5 : dimensions.width < 500 ? 8 : 12,
    showBarLabels: dimensions.width >= 300,
    showBarValues: dimensions.width >= 350,
    barSpacing: Math.max(2, Math.round(dimensions.width * 0.02)),
  };

  return { ref, dimensions, config: barConfig, isReady };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  BREAKPOINTS,
  getBreakpoint,
  calculateAdaptations,
};

export default useResponsiveChart;
