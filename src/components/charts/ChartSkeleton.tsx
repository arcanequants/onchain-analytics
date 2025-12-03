'use client';

/**
 * ChartSkeleton - Loading States for Charts
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Matching dimensions for each chart type
 * - Shimmer animation (1.5s infinite)
 * - Multiple skeleton variants
 * - Responsive sizing
 * - Reduced motion support
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type ChartSkeletonType =
  | 'gauge'
  | 'sparkline'
  | 'bar'
  | 'area'
  | 'radar'
  | 'comparison'
  | 'metric';

export interface ChartSkeletonProps {
  type: ChartSkeletonType;
  width?: number | string;
  height?: number | string;
  className?: string;
  animate?: boolean;
}

// ============================================================================
// SHIMMER ANIMATION COMPONENT
// ============================================================================

interface ShimmerProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

function Shimmer({ className = '', animate = true, style }: ShimmerProps) {
  return (
    <div
      className={`
        bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200
        ${animate ? 'animate-shimmer' : ''}
        motion-reduce:animate-none
        ${className}
      `}
      style={{
        backgroundSize: '200% 100%',
        ...style,
      }}
    />
  );
}

// ============================================================================
// SKELETON VARIANTS
// ============================================================================

interface SkeletonBaseProps {
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

function GaugeSkeleton({ width = 200, height = 200, animate }: SkeletonBaseProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width, height }}
    >
      {/* Circular gauge background */}
      <Shimmer
        animate={animate}
        className="absolute rounded-full"
        style={{
          width: '80%',
          height: '80%',
          clipPath: 'polygon(50% 50%, 0% 100%, 100% 100%)',
        }}
      />
      {/* Center circle */}
      <Shimmer
        animate={animate}
        className="absolute rounded-full w-1/2 h-1/2"
      />
      {/* Value placeholder */}
      <div className="absolute bottom-4 flex flex-col items-center gap-2">
        <Shimmer animate={animate} className="h-8 w-16 rounded" />
        <Shimmer animate={animate} className="h-4 w-12 rounded" />
      </div>
    </div>
  );
}

function SparklineSkeleton({ width = 100, height = 32, animate }: SkeletonBaseProps) {
  return (
    <div style={{ width, height }} className="flex items-end gap-0.5">
      {Array.from({ length: 12 }).map((_, i) => (
        <Shimmer
          key={i}
          animate={animate}
          className="flex-1 rounded-t"
          style={{
            height: `${30 + Math.random() * 70}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function BarSkeleton({ width = '100%', height = 300, animate }: SkeletonBaseProps) {
  return (
    <div style={{ width, height }} className="flex items-end gap-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Shimmer
            animate={animate}
            className="w-full rounded"
            style={{
              height: `${20 + Math.random() * 60}%`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
          <Shimmer animate={animate} className="h-4 w-12 rounded" />
        </div>
      ))}
    </div>
  );
}

function AreaSkeleton({ width = '100%', height = 200, animate }: SkeletonBaseProps) {
  return (
    <div style={{ width, height }} className="relative p-4">
      {/* Y-axis labels */}
      <div className="absolute left-2 top-4 bottom-8 flex flex-col justify-between">
        {Array.from({ length: 5 }).map((_, i) => (
          <Shimmer
            key={i}
            animate={animate}
            className="h-3 w-8 rounded"
          />
        ))}
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full flex flex-col">
        <div className="flex-1 relative">
          <Shimmer
            animate={animate}
            className="absolute inset-0 rounded-lg"
            style={{
              clipPath: 'polygon(0% 70%, 10% 60%, 20% 65%, 30% 45%, 40% 50%, 50% 30%, 60% 35%, 70% 20%, 80% 25%, 90% 15%, 100% 20%, 100% 100%, 0% 100%)',
            }}
          />
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer
              key={i}
              animate={animate}
              className="h-3 w-10 rounded"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RadarSkeleton({ width = 300, height = 300, animate }: SkeletonBaseProps) {
  return (
    <div
      style={{ width, height }}
      className="relative flex items-center justify-center"
    >
      {/* Concentric circles */}
      {[0.8, 0.6, 0.4].map((scale, i) => (
        <Shimmer
          key={i}
          animate={animate}
          className="absolute rounded-full border-2 border-gray-200"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            background: 'transparent',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}

      {/* Axis lines */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-1/3 bg-gray-200 origin-bottom"
          style={{
            transform: `rotate(${i * 60}deg)`,
          }}
        />
      ))}

      {/* Labels */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const radius = 48;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);

        return (
          <Shimmer
            key={i}
            animate={animate}
            className="absolute h-3 w-12 rounded"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function ComparisonSkeleton({ width = '100%', height = 300, animate }: SkeletonBaseProps) {
  return (
    <div style={{ width, height }} className="p-4 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          {/* Label */}
          <Shimmer
            animate={animate}
            className="h-4 w-24 rounded flex-shrink-0"
          />
          {/* Bar */}
          <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
            <Shimmer
              animate={animate}
              className="h-full rounded"
              style={{
                width: `${20 + Math.random() * 60}%`,
                animationDelay: `${i * 0.15}s`,
              }}
            />
          </div>
          {/* Value */}
          <Shimmer
            animate={animate}
            className="h-4 w-12 rounded flex-shrink-0"
          />
        </div>
      ))}
    </div>
  );
}

function MetricSkeleton({ width = '100%', height = 'auto', animate }: SkeletonBaseProps) {
  return (
    <div style={{ width, height }} className="p-4 space-y-3">
      {/* Title */}
      <Shimmer animate={animate} className="h-4 w-24 rounded" />
      {/* Value */}
      <Shimmer animate={animate} className="h-10 w-32 rounded" />
      {/* Trend */}
      <div className="flex items-center gap-2">
        <Shimmer animate={animate} className="h-4 w-16 rounded" />
        <Shimmer animate={animate} className="h-4 w-20 rounded" />
      </div>
      {/* Sparkline */}
      <Shimmer animate={animate} className="h-12 w-full rounded" />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChartSkeleton({
  type,
  width,
  height,
  className = '',
  animate = true,
}: ChartSkeletonProps) {
  const props: SkeletonBaseProps = { width, height, animate };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {type === 'gauge' && <GaugeSkeleton {...props} />}
      {type === 'sparkline' && <SparklineSkeleton {...props} />}
      {type === 'bar' && <BarSkeleton {...props} />}
      {type === 'area' && <AreaSkeleton {...props} />}
      {type === 'radar' && <RadarSkeleton {...props} />}
      {type === 'comparison' && <ComparisonSkeleton {...props} />}
      {type === 'metric' && <MetricSkeleton {...props} />}
    </div>
  );
}

// ============================================================================
// SHIMMER KEYFRAMES (add to global CSS or tailwind config)
// ============================================================================

// Add this to your tailwind.config.js:
// extend: {
//   animation: {
//     shimmer: 'shimmer 1.5s infinite',
//   },
//   keyframes: {
//     shimmer: {
//       '0%': { backgroundPosition: '200% 0' },
//       '100%': { backgroundPosition: '-200% 0' },
//     },
//   },
// }

// ============================================================================
// EXPORTS
// ============================================================================

export default ChartSkeleton;
