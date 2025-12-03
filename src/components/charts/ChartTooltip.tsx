'use client';

/**
 * ChartTooltip - Shared Tooltip Component for Charts
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Consistent styling across all chart types
 * - Smart positioning (avoids viewport edges)
 * - Multiple content formats (single, list, table)
 * - Animation support
 * - Customizable appearance
 * - WCAG 2.1 AA compliant
 */

import React, { useEffect, useRef, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export type TooltipVariant = 'default' | 'compact' | 'detailed';

export interface TooltipItem {
  label: string;
  value: string | number;
  color?: string;
  secondary?: string;
}

export interface ChartTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  title?: string;
  items?: TooltipItem[];
  content?: React.ReactNode;
  position?: TooltipPosition;
  variant?: TooltipVariant;
  animated?: boolean;
  className?: string;
  containerRef?: React.RefObject<HTMLElement>;
  offset?: number;
}

// ============================================================================
// POSITIONING LOGIC
// ============================================================================

interface TooltipDimensions {
  width: number;
  height: number;
}

interface ViewportBounds {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

function calculatePosition(
  x: number,
  y: number,
  tooltipDimensions: TooltipDimensions,
  viewportBounds: ViewportBounds,
  preferredPosition: TooltipPosition,
  offset: number
): { x: number; y: number; position: TooltipPosition } {
  const { width, height } = tooltipDimensions;
  const { top, left, right, bottom } = viewportBounds;

  const fitsTop = y - height - offset >= top;
  const fitsBottom = y + height + offset <= bottom;
  const fitsLeft = x - width - offset >= left;
  const fitsRight = x + width + offset <= right;

  let finalPosition = preferredPosition;

  if (preferredPosition === 'auto') {
    // Prefer top, then bottom, then right, then left
    if (fitsTop) {
      finalPosition = 'top';
    } else if (fitsBottom) {
      finalPosition = 'bottom';
    } else if (fitsRight) {
      finalPosition = 'right';
    } else if (fitsLeft) {
      finalPosition = 'left';
    } else {
      finalPosition = 'top'; // Fallback
    }
  }

  let finalX = x;
  let finalY = y;

  switch (finalPosition) {
    case 'top':
      finalX = x - width / 2;
      finalY = y - height - offset;
      break;
    case 'bottom':
      finalX = x - width / 2;
      finalY = y + offset;
      break;
    case 'left':
      finalX = x - width - offset;
      finalY = y - height / 2;
      break;
    case 'right':
      finalX = x + offset;
      finalY = y - height / 2;
      break;
  }

  // Clamp to viewport
  finalX = Math.max(left, Math.min(right - width, finalX));
  finalY = Math.max(top, Math.min(bottom - height, finalY));

  return { x: finalX, y: finalY, position: finalPosition };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ColorDotProps {
  color: string;
}

function ColorDot({ color }: ColorDotProps) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

interface TooltipArrowProps {
  position: TooltipPosition;
}

function TooltipArrow({ position }: TooltipArrowProps) {
  const arrowClasses = {
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    auto: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
  };

  return (
    <span
      className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
    />
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChartTooltip({
  visible,
  x,
  y,
  title,
  items,
  content,
  position = 'auto',
  variant = 'default',
  animated = true,
  className = '',
  containerRef,
  offset = 12,
}: ChartTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [computedPosition, setComputedPosition] = useState<{
    x: number;
    y: number;
    position: TooltipPosition;
  }>({ x, y, position });

  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();

    let bounds: ViewportBounds;

    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      bounds = {
        top: containerRect.top,
        left: containerRect.left,
        right: containerRect.right,
        bottom: containerRect.bottom,
      };
    } else {
      bounds = {
        top: 0,
        left: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };
    }

    const newPosition = calculatePosition(
      x,
      y,
      { width: rect.width, height: rect.height },
      bounds,
      position,
      offset
    );

    setComputedPosition(newPosition);
  }, [visible, x, y, position, containerRef, offset]);

  if (!visible) return null;

  const variantClasses = {
    default: 'px-3 py-2',
    compact: 'px-2 py-1 text-xs',
    detailed: 'px-4 py-3',
  };

  const animationClasses = animated
    ? 'transition-opacity duration-150 ease-in-out'
    : '';

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={`
        fixed z-50 bg-gray-800 text-white rounded-lg shadow-lg
        ${variantClasses[variant]}
        ${animationClasses}
        ${className}
      `}
      style={{
        left: computedPosition.x,
        top: computedPosition.y,
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    >
      {/* Arrow */}
      <TooltipArrow position={computedPosition.position} />

      {/* Title */}
      {title && (
        <div className={`font-medium ${items && items.length > 0 ? 'mb-2 pb-2 border-b border-gray-700' : ''}`}>
          {title}
        </div>
      )}

      {/* Custom Content */}
      {content}

      {/* Items List */}
      {items && items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {item.color && <ColorDot color={item.color} />}
                <span className="text-gray-300">{item.label}</span>
              </div>
              <div className="text-right">
                <span className="font-medium">{item.value}</span>
                {item.secondary && (
                  <span className="text-gray-400 text-xs ml-1">
                    {item.secondary}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HOOK FOR TOOLTIP STATE
// ============================================================================

export interface UseChartTooltipOptions {
  delay?: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  title?: string;
  items?: TooltipItem[];
  content?: React.ReactNode;
}

export function useChartTooltip(options: UseChartTooltipOptions = {}) {
  const { delay = 0 } = options;
  const [state, setState] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = (
    x: number,
    y: number,
    options: { title?: string; items?: TooltipItem[]; content?: React.ReactNode } = {}
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setState({ visible: true, x, y, ...options });
      }, delay);
    } else {
      setState({ visible: true, x, y, ...options });
    }
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState(prev => ({ ...prev, visible: false }));
  };

  const update = (x: number, y: number) => {
    if (state.visible) {
      setState(prev => ({ ...prev, x, y }));
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    show,
    hide,
    update,
    props: state,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ChartTooltip;
