'use client';

/**
 * Score Confidence Interval Component
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Display score with confidence interval (± range)
 * - Visual representation of uncertainty
 * - Support for different confidence levels
 * - Animated value transitions
 * - Accessible design with ARIA labels
 */

import React, { useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfidenceIntervalData {
  value: number;
  lower: number;
  upper: number;
  confidenceLevel: number; // e.g., 0.95 for 95%
  sampleSize?: number;
}

export interface ScoreConfidenceIntervalProps {
  data: ConfidenceIntervalData;
  label?: string;
  showRange?: boolean;
  showBar?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'default' | 'gradient' | 'semantic';
  minValue?: number;
  maxValue?: number;
  precision?: number;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-blue-600';
  if (score >= 40) return 'text-yellow-600';
  if (score >= 20) return 'text-orange-600';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  if (score >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

function getConfidenceBarColor(score: number): string {
  if (score >= 80) return 'bg-green-200';
  if (score >= 60) return 'bg-blue-200';
  if (score >= 40) return 'bg-yellow-200';
  if (score >= 20) return 'bg-orange-200';
  return 'bg-red-200';
}

function formatConfidenceLevel(level: number): string {
  return `${Math.round(level * 100)}%`;
}

// ============================================================================
// SIZE CONFIGURATIONS
// ============================================================================

const sizeConfig = {
  sm: {
    valueSize: 'text-lg',
    rangeSize: 'text-xs',
    labelSize: 'text-xs',
    barHeight: 'h-2',
    spacing: 'gap-1',
  },
  md: {
    valueSize: 'text-2xl',
    rangeSize: 'text-sm',
    labelSize: 'text-sm',
    barHeight: 'h-3',
    spacing: 'gap-2',
  },
  lg: {
    valueSize: 'text-4xl',
    rangeSize: 'text-base',
    labelSize: 'text-base',
    barHeight: 'h-4',
    spacing: 'gap-3',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ConfidenceBarProps {
  value: number;
  lower: number;
  upper: number;
  minValue: number;
  maxValue: number;
  barHeight: string;
  colorScheme: 'default' | 'gradient' | 'semantic';
}

function ConfidenceBar({
  value,
  lower,
  upper,
  minValue,
  maxValue,
  barHeight,
  colorScheme,
}: ConfidenceBarProps) {
  const range = maxValue - minValue;
  const valuePercent = ((value - minValue) / range) * 100;
  const lowerPercent = ((lower - minValue) / range) * 100;
  const upperPercent = ((upper - minValue) / range) * 100;

  const mainBarColor = colorScheme === 'semantic' ? getBarColor(value) : 'bg-blue-500';
  const confidenceBarColor = colorScheme === 'semantic' ? getConfidenceBarColor(value) : 'bg-blue-200';

  return (
    <div className={`relative w-full bg-gray-100 rounded-full ${barHeight}`}>
      {/* Confidence interval range */}
      <div
        className={`absolute ${barHeight} rounded-full ${confidenceBarColor} transition-all duration-300`}
        style={{
          left: `${Math.max(0, lowerPercent)}%`,
          width: `${Math.min(100, upperPercent - lowerPercent)}%`,
        }}
        aria-hidden="true"
      />

      {/* Main value indicator */}
      <div
        className={`absolute ${barHeight} rounded-full ${mainBarColor} transition-all duration-500`}
        style={{
          left: 0,
          width: `${Math.min(100, Math.max(0, valuePercent))}%`,
        }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
      />

      {/* Value marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-800 rounded-full shadow-sm transition-all duration-300"
        style={{ left: `calc(${valuePercent}% - 6px)` }}
        aria-hidden="true"
      />

      {/* Lower bound marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400 transition-all duration-300"
        style={{ left: `${lowerPercent}%` }}
        aria-hidden="true"
      />

      {/* Upper bound marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-gray-400 transition-all duration-300"
        style={{ left: `${upperPercent}%` }}
        aria-hidden="true"
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScoreConfidenceInterval({
  data,
  label,
  showRange = true,
  showBar = true,
  showPercentage = true,
  size = 'md',
  colorScheme = 'semantic',
  minValue = 0,
  maxValue = 100,
  precision = 1,
  className = '',
}: ScoreConfidenceIntervalProps) {
  const config = sizeConfig[size];

  const marginOfError = useMemo(() => {
    return (data.upper - data.lower) / 2;
  }, [data]);

  const valueColor = colorScheme === 'semantic' ? getScoreColor(data.value) : 'text-gray-900';

  const ariaLabel = useMemo(() => {
    const rangeText = `${data.value.toFixed(precision)} with ${formatConfidenceLevel(data.confidenceLevel)} confidence interval from ${data.lower.toFixed(precision)} to ${data.upper.toFixed(precision)}`;
    return label ? `${label}: ${rangeText}` : rangeText;
  }, [data, label, precision]);

  return (
    <div className={`flex flex-col ${config.spacing} ${className}`} role="group" aria-label={ariaLabel}>
      {/* Label */}
      {label && (
        <div className={`${config.labelSize} text-gray-600 font-medium`}>
          {label}
        </div>
      )}

      {/* Value with range */}
      <div className="flex items-baseline gap-2">
        <span className={`${config.valueSize} font-bold ${valueColor} tabular-nums`}>
          {data.value.toFixed(precision)}
          {showPercentage && <span className="text-gray-400 font-normal">%</span>}
        </span>

        {showRange && (
          <span className={`${config.rangeSize} text-gray-500`}>
            <span className="font-medium">±{marginOfError.toFixed(precision)}</span>
            <span className="text-gray-400 ml-1">
              ({formatConfidenceLevel(data.confidenceLevel)} CI)
            </span>
          </span>
        )}
      </div>

      {/* Confidence bar */}
      {showBar && (
        <ConfidenceBar
          value={data.value}
          lower={data.lower}
          upper={data.upper}
          minValue={minValue}
          maxValue={maxValue}
          barHeight={config.barHeight}
          colorScheme={colorScheme}
        />
      )}

      {/* Range labels below bar */}
      {showBar && showRange && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>{data.lower.toFixed(precision)}</span>
          <span>{data.upper.toFixed(precision)}</span>
        </div>
      )}

      {/* Sample size indicator */}
      {data.sampleSize !== undefined && (
        <div className={`${config.rangeSize} text-gray-400`}>
          Based on {data.sampleSize} sample{data.sampleSize !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPACT VERSION
// ============================================================================

export interface CompactScoreConfidenceProps {
  value: number;
  lower: number;
  upper: number;
  className?: string;
}

export function CompactScoreConfidence({
  value,
  lower,
  upper,
  className = '',
}: CompactScoreConfidenceProps) {
  const marginOfError = (upper - lower) / 2;

  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-gray-400 text-sm">±{marginOfError.toFixed(1)}</span>
    </span>
  );
}

// ============================================================================
// COMPARISON VERSION
// ============================================================================

export interface ScoreComparisonProps {
  scores: Array<{
    label: string;
    data: ConfidenceIntervalData;
  }>;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreConfidenceComparison({
  scores,
  size = 'md',
  className = '',
}: ScoreComparisonProps) {
  const config = sizeConfig[size];

  // Check for overlapping confidence intervals
  const hasOverlap = (a: ConfidenceIntervalData, b: ConfidenceIntervalData): boolean => {
    return a.lower <= b.upper && b.lower <= a.upper;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {scores.map((score, index) => {
        const isHighest = scores.every(
          (s, i) => i === index || score.data.value >= s.data.value
        );

        // Check if this score overlaps with any other
        const overlapsWithOthers = scores.some(
          (s, i) => i !== index && hasOverlap(score.data, s.data)
        );

        return (
          <div key={index} className="relative">
            <div className={`flex items-center justify-between ${config.spacing}`}>
              <span className={`${config.labelSize} text-gray-600 font-medium`}>
                {score.label}
                {isHighest && !overlapsWithOthers && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">
                    Best
                  </span>
                )}
              </span>
              <CompactScoreConfidence
                value={score.data.value}
                lower={score.data.lower}
                upper={score.data.upper}
              />
            </div>
            <div className="mt-1">
              <ConfidenceBar
                value={score.data.value}
                lower={score.data.lower}
                upper={score.data.upper}
                minValue={0}
                maxValue={100}
                barHeight={config.barHeight}
                colorScheme="semantic"
              />
            </div>
            {overlapsWithOthers && index > 0 && (
              <div className="mt-1 text-xs text-gray-400">
                Overlapping CI with {scores.find((s, i) => i !== index && hasOverlap(score.data, s.data))?.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ScoreConfidenceInterval;
