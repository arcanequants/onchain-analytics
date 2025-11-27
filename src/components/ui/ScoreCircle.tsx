/**
 * ScoreCircle Component
 *
 * Phase 1, Week 1, Day 2
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5 (UX)
 *
 * A circular score visualization component that displays
 * AI perception scores with animated progress rings.
 */

'use client';

import React, { useMemo } from 'react';

// ================================================================
// TYPES
// ================================================================

export type ScoreGrade = 'excellent' | 'good' | 'average' | 'poor' | 'critical';

export interface ScoreCircleProps {
  /** Score value (0-100) */
  score: number;
  /** Size of the circle in pixels */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Label text below the score */
  label?: string;
  /** Show animated entrance */
  animate?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
  /** Show percentage symbol */
  showPercent?: boolean;
  /** Custom class name */
  className?: string;
  /** Thickness of the progress ring */
  strokeWidth?: number;
  /** Show grade label (Excellent, Good, etc.) */
  showGrade?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Callback when score changes */
  onScoreChange?: (score: number, grade: ScoreGrade) => void;
}

// ================================================================
// CONSTANTS
// ================================================================

const SIZE_CONFIGS = {
  sm: { diameter: 80, fontSize: 20, labelSize: 10, strokeWidth: 6 },
  md: { diameter: 120, fontSize: 28, labelSize: 12, strokeWidth: 8 },
  lg: { diameter: 160, fontSize: 36, labelSize: 14, strokeWidth: 10 },
  xl: { diameter: 200, fontSize: 44, labelSize: 16, strokeWidth: 12 },
} as const;

/**
 * Score grade thresholds and colors
 */
const SCORE_GRADES: Array<{
  min: number;
  max: number;
  grade: ScoreGrade;
  color: string;
  bgColor: string;
  label: string;
}> = [
  { min: 80, max: 100, grade: 'excellent', color: '#22c55e', bgColor: '#dcfce7', label: 'Excellent' },
  { min: 60, max: 79, grade: 'good', color: '#84cc16', bgColor: '#ecfccb', label: 'Good' },
  { min: 40, max: 59, grade: 'average', color: '#eab308', bgColor: '#fef9c3', label: 'Average' },
  { min: 20, max: 39, grade: 'poor', color: '#f97316', bgColor: '#ffedd5', label: 'Poor' },
  { min: 0, max: 19, grade: 'critical', color: '#ef4444', bgColor: '#fee2e2', label: 'Critical' },
];

// ================================================================
// UTILITIES
// ================================================================

/**
 * Get grade info based on score
 */
export function getScoreGrade(score: number): {
  grade: ScoreGrade;
  color: string;
  bgColor: string;
  label: string;
} {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const gradeInfo = SCORE_GRADES.find(
    (g) => normalizedScore >= g.min && normalizedScore <= g.max
  );
  return gradeInfo || SCORE_GRADES[SCORE_GRADES.length - 1];
}

/**
 * Get score interpretation text
 */
export function getScoreInterpretation(score: number): string {
  const { grade } = getScoreGrade(score);

  const interpretations: Record<ScoreGrade, string> = {
    excellent: 'Your brand has excellent AI visibility. You appear prominently in AI recommendations.',
    good: 'Your brand has good AI visibility. There is room for improvement in some areas.',
    average: 'Your brand has average AI visibility. Consider implementing our recommendations.',
    poor: 'Your brand has poor AI visibility. Significant improvements are needed.',
    critical: 'Your brand has critical AI visibility issues. Immediate action is recommended.',
  };

  return interpretations[grade];
}

/**
 * Calculate SVG arc path
 */
function calculateArc(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ].join(' ');
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): { x: number; y: number } {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// ================================================================
// COMPONENT
// ================================================================

export function ScoreCircle({
  score,
  size = 'md',
  label,
  animate = true,
  animationDuration = 1000,
  showPercent = false,
  className = '',
  strokeWidth: customStrokeWidth,
  showGrade = true,
  loading = false,
  onScoreChange,
}: ScoreCircleProps): JSX.Element {
  const config = SIZE_CONFIGS[size];
  const strokeWidth = customStrokeWidth ?? config.strokeWidth;

  // Clamp score to 0-100
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const gradeInfo = getScoreGrade(normalizedScore);

  // Call onScoreChange when score changes
  React.useEffect(() => {
    onScoreChange?.(normalizedScore, gradeInfo.grade);
  }, [normalizedScore, gradeInfo.grade, onScoreChange]);

  // SVG calculations
  const svgSize = config.diameter + strokeWidth * 2;
  const center = svgSize / 2;
  const radius = config.diameter / 2;

  // Progress calculations
  const circumference = 2 * Math.PI * radius;
  const progressPercent = normalizedScore / 100;
  const progressDegrees = progressPercent * 360;

  // Animation styles
  const animationStyle = useMemo(() => {
    if (!animate) return {};
    return {
      transition: `stroke-dashoffset ${animationDuration}ms ease-out`,
    };
  }, [animate, animationDuration]);

  // Loading pulse animation
  if (loading) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${className}`}
        data-testid="score-circle-loading"
      >
        <div
          style={{
            width: svgSize,
            height: svgSize,
          }}
          className="relative"
        >
          <svg width={svgSize} height={svgSize}>
            {/* Background circle */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
              className="animate-pulse"
            />
          </svg>
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: config.fontSize }}
          >
            <span className="text-gray-300 animate-pulse">--</span>
          </div>
        </div>
        {label && (
          <span
            className="mt-2 text-gray-400 animate-pulse"
            style={{ fontSize: config.labelSize }}
          >
            {label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      data-testid="score-circle"
      role="img"
      aria-label={`Score: ${normalizedScore}${showPercent ? '%' : ''} - ${gradeInfo.label}`}
    >
      <div
        style={{
          width: svgSize,
          height: svgSize,
        }}
        className="relative"
      >
        <svg
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress arc */}
          {normalizedScore > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={gradeInfo.color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progressPercent)}
              transform={`rotate(-90 ${center} ${center})`}
              style={animationStyle}
              data-testid="score-progress-ring"
            />
          )}
        </svg>

        {/* Center content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
        >
          <span
            className="font-bold"
            style={{
              fontSize: config.fontSize,
              color: gradeInfo.color,
            }}
            data-testid="score-value"
          >
            {normalizedScore}
            {showPercent && <span className="text-[0.6em]">%</span>}
          </span>

          {showGrade && (
            <span
              className="font-medium"
              style={{
                fontSize: config.labelSize,
                color: gradeInfo.color,
              }}
              data-testid="score-grade"
            >
              {gradeInfo.label}
            </span>
          )}
        </div>
      </div>

      {/* Label below */}
      {label && (
        <span
          className="mt-2 text-gray-600 font-medium text-center"
          style={{ fontSize: config.labelSize }}
          data-testid="score-label"
        >
          {label}
        </span>
      )}
    </div>
  );
}

// ================================================================
// VARIANT: MINI SCORE BADGE
// ================================================================

export interface ScoreBadgeProps {
  score: number;
  className?: string;
}

export function ScoreBadge({ score, className = '' }: ScoreBadgeProps): JSX.Element {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const gradeInfo = getScoreGrade(normalizedScore);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{
        backgroundColor: gradeInfo.bgColor,
        color: gradeInfo.color,
      }}
      data-testid="score-badge"
    >
      {normalizedScore}
    </span>
  );
}

// ================================================================
// VARIANT: SCORE BAR
// ================================================================

export interface ScoreBarProps {
  score: number;
  label?: string;
  showValue?: boolean;
  animate?: boolean;
  className?: string;
}

export function ScoreBar({
  score,
  label,
  showValue = true,
  animate = true,
  className = '',
}: ScoreBarProps): JSX.Element {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const gradeInfo = getScoreGrade(normalizedScore);

  return (
    <div className={`w-full ${className}`} data-testid="score-bar">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-sm text-gray-600">{label}</span>}
          {showValue && (
            <span
              className="text-sm font-medium"
              style={{ color: gradeInfo.color }}
            >
              {normalizedScore}
            </span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${animate ? 'transition-all duration-500 ease-out' : ''}`}
          style={{
            width: `${normalizedScore}%`,
            backgroundColor: gradeInfo.color,
          }}
          data-testid="score-bar-fill"
        />
      </div>
    </div>
  );
}

// ================================================================
// VARIANT: SCORE COMPARISON
// ================================================================

export interface ScoreComparisonProps {
  currentScore: number;
  previousScore?: number;
  projectedScore?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ScoreComparison({
  currentScore,
  previousScore,
  projectedScore,
  size = 'md',
  className = '',
}: ScoreComparisonProps): JSX.Element {
  const current = Math.max(0, Math.min(100, Math.round(currentScore)));
  const previous = previousScore !== undefined
    ? Math.max(0, Math.min(100, Math.round(previousScore)))
    : undefined;
  const projected = projectedScore !== undefined
    ? Math.max(0, Math.min(100, Math.round(projectedScore)))
    : undefined;

  const change = previous !== undefined ? current - previous : 0;
  const projectedChange = projected !== undefined ? projected - current : 0;

  return (
    <div className={`flex items-end gap-4 ${className}`} data-testid="score-comparison">
      {/* Previous score (if available) */}
      {previous !== undefined && (
        <div className="flex flex-col items-center opacity-50">
          <ScoreCircle score={previous} size={size} animate={false} showGrade={false} />
          <span className="text-xs text-gray-500 mt-1">Previous</span>
        </div>
      )}

      {/* Arrow if there's a change */}
      {previous !== undefined && (
        <div className="flex flex-col items-center">
          <span
            className={`text-lg font-bold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}
          >
            {change >= 0 ? '+' : ''}{change}
          </span>
          <span className="text-2xl">{change >= 0 ? '→' : '→'}</span>
        </div>
      )}

      {/* Current score */}
      <div className="flex flex-col items-center">
        <ScoreCircle score={current} size={size} />
        <span className="text-xs text-gray-600 mt-1 font-medium">Current</span>
      </div>

      {/* Projected score (if available) */}
      {projected !== undefined && (
        <>
          <div className="flex flex-col items-center">
            <span
              className={`text-lg font-bold ${projectedChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {projectedChange >= 0 ? '+' : ''}{projectedChange}
            </span>
            <span className="text-2xl">→</span>
          </div>
          <div className="flex flex-col items-center opacity-70">
            <ScoreCircle score={projected} size={size} animate={false} showGrade={false} />
            <span className="text-xs text-gray-500 mt-1">Projected</span>
          </div>
        </>
      )}
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default ScoreCircle;
