'use client';

/**
 * ScoreGauge Component
 *
 * Phase 2, Week 4, Day 3
 * Animated gauge chart for score visualization
 */

import React, { useState, useEffect } from 'react';

// ================================================================
// TYPES
// ================================================================

export interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  label?: string;
  showPercentage?: boolean;
  animate?: boolean;
  className?: string;
}

interface ScoreLevel {
  label: string;
  color: string;
  min: number;
  max: number;
}

// ================================================================
// CONSTANTS
// ================================================================

const SCORE_LEVELS: ScoreLevel[] = [
  { label: 'Critical', color: '#EF4444', min: 0, max: 20 },
  { label: 'Poor', color: '#F97316', min: 20, max: 40 },
  { label: 'Fair', color: '#EAB308', min: 40, max: 60 },
  { label: 'Good', color: '#22C55E', min: 60, max: 80 },
  { label: 'Excellent', color: '#10B981', min: 80, max: 100 },
];

const SIZE_CONFIG = {
  sm: { width: 120, strokeWidth: 8, fontSize: 24, labelSize: 10 },
  md: { width: 160, strokeWidth: 10, fontSize: 32, labelSize: 12 },
  lg: { width: 200, strokeWidth: 12, fontSize: 40, labelSize: 14 },
  xl: { width: 280, strokeWidth: 16, fontSize: 56, labelSize: 16 },
};

// ================================================================
// HELPERS
// ================================================================

function getScoreLevel(score: number): ScoreLevel {
  return SCORE_LEVELS.find((level) => score >= level.min && score < level.max) || SCORE_LEVELS[0];
}

function getGradientId(score: number): string {
  return `gauge-gradient-${Math.floor(score)}`;
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function ScoreGauge({
  score,
  maxScore = 100,
  size = 'md',
  showLabel = true,
  label,
  showPercentage = false,
  animate = true,
  className = '',
}: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const config = SIZE_CONFIG[size];
  const level = getScoreLevel(score);

  // Animation
  useEffect(() => {
    if (!animate) {
      setDisplayScore(score);
      return;
    }

    const duration = 1000;
    const startTime = Date.now();
    const startScore = displayScore;

    const animateScore = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startScore + (score - startScore) * eased;

      setDisplayScore(current);

      if (progress < 1) {
        requestAnimationFrame(animateScore);
      }
    };

    requestAnimationFrame(animateScore);
  }, [score, animate]);

  // SVG calculations
  const center = config.width / 2;
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const offset = arcLength * (1 - displayScore / maxScore);

  // Arc path
  const startAngle = 135;
  const endAngle = 405;
  const angle = startAngle + ((displayScore / maxScore) * (endAngle - startAngle));

  const gradientId = getGradientId(score);

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="transform rotate-[135deg]"
      >
        {/* Gradient definition */}
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={level.color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={level.color} />
          </linearGradient>
        </defs>

        {/* Background arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />

        {/* Foreground arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength - offset} ${circumference}`}
          className="transition-all duration-300"
        />

        {/* Score markers */}
        {[0, 25, 50, 75, 100].map((mark) => {
          const markAngle = ((mark / 100) * 270 + 135) * (Math.PI / 180);
          const innerRadius = radius - config.strokeWidth / 2 - 4;
          const outerRadius = radius - config.strokeWidth / 2 - 8;

          const x1 = center + innerRadius * Math.cos(markAngle);
          const y1 = center + innerRadius * Math.sin(markAngle);
          const x2 = center + outerRadius * Math.cos(markAngle);
          const y2 = center + outerRadius * Math.sin(markAngle);

          return (
            <line
              key={mark}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#6B7280"
              strokeWidth={1}
              className="transform -rotate-[135deg]"
              style={{ transformOrigin: `${center}px ${center}px` }}
            />
          );
        })}
      </svg>

      {/* Score display */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          width: config.width,
          height: config.width,
          marginTop: -config.width,
        }}
      >
        <span
          className="font-bold text-white"
          style={{ fontSize: config.fontSize }}
        >
          {Math.round(displayScore)}
        </span>
        {showPercentage && (
          <span
            className="text-gray-400"
            style={{ fontSize: config.labelSize }}
          >
            / {maxScore}
          </span>
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <div className="mt-2 text-center">
          <p
            className="font-medium"
            style={{ color: level.color, fontSize: config.labelSize + 2 }}
          >
            {label || level.label}
          </p>
        </div>
      )}
    </div>
  );
}

// ================================================================
// MINI GAUGE
// ================================================================

export function MiniGauge({
  score,
  size = 40,
  className = '',
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const level = getScoreLevel(score);
  const strokeWidth = size / 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const offset = arcLength * (1 - score / 100);

  return (
    <div className={`relative inline-flex ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform rotate-[135deg]"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#374151"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={level.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arcLength - offset} ${circumference}`}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-white font-bold"
        style={{ fontSize: size / 3 }}
      >
        {Math.round(score)}
      </span>
    </div>
  );
}

// ================================================================
// COMPARISON GAUGE
// ================================================================

export interface ComparisonGaugeProps {
  current: number;
  previous: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ComparisonGauge({
  current,
  previous,
  label,
  size = 'md',
  className = '',
}: ComparisonGaugeProps) {
  const change = current - previous;
  const changePercent = previous !== 0 ? ((change / previous) * 100) : 0;
  const isImproving = change > 0;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <ScoreGauge
          score={current}
          size={size}
          showLabel={false}
        />

        {/* Previous score indicator */}
        <div
          className="absolute bottom-2 right-2 bg-gray-800 border border-gray-600 rounded px-2 py-1"
        >
          <span className="text-gray-400 text-xs">was </span>
          <span className="text-white text-xs font-medium">{previous}</span>
        </div>
      </div>

      {/* Change indicator */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded ${
            isImproving
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {isImproving ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          )}
          <span className="text-sm font-medium">
            {isImproving ? '+' : ''}{change} ({changePercent.toFixed(1)}%)
          </span>
        </div>
      </div>

      {label && (
        <p className="mt-2 text-gray-400 text-sm">{label}</p>
      )}
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export { SCORE_LEVELS, getScoreLevel };
