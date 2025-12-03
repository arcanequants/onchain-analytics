'use client';

/**
 * Radar Chart for Multi-dimensional Brand Perception
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - Multi-dimensional data visualization
 * - Support for multiple series (brand comparison)
 * - Interactive tooltips
 * - Animated transitions
 * - Responsive design
 * - WCAG 2.1 AA compliant
 */

import React, { useState, useMemo, useId } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface RadarDimension {
  key: string;
  label: string;
  maxValue?: number;
  description?: string;
}

export interface RadarDataSeries {
  id: string;
  label: string;
  values: Record<string, number>;
  color?: string;
  fillOpacity?: number;
}

export interface RadarChartProps {
  dimensions: RadarDimension[];
  series: RadarDataSeries[];
  size?: number;
  showLabels?: boolean;
  showValues?: boolean;
  showGrid?: boolean;
  showLegend?: boolean;
  gridLevels?: number;
  fillOpacity?: number;
  strokeWidth?: number;
  animated?: boolean;
  className?: string;
  onDimensionClick?: (dimension: RadarDimension) => void;
  onSeriesClick?: (series: RadarDataSeries) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  dimension?: RadarDimension;
  values: Array<{ series: RadarDataSeries; value: number }>;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

const defaultColors = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#06b6d4', // cyan
];

function getSeriesColor(series: RadarDataSeries, index: number): string {
  return series.color || defaultColors[index % defaultColors.length];
}

// ============================================================================
// GEOMETRY HELPERS
// ============================================================================

interface Point {
  x: number;
  y: number;
}

/**
 * Convert polar coordinates to cartesian
 */
function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
): Point {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

/**
 * Generate points for a polygon
 */
function generatePolygonPoints(
  center: Point,
  radius: number,
  numSides: number,
  values?: number[]
): Point[] {
  const points: Point[] = [];
  const angleStep = 360 / numSides;

  for (let i = 0; i < numSides; i++) {
    const angle = angleStep * i;
    const r = values ? radius * (values[i] || 0) : radius;
    points.push(polarToCartesian(center.x, center.y, r, angle));
  }

  return points;
}

/**
 * Convert points array to SVG path string
 */
function pointsToPath(points: Point[], closed: boolean = true): string {
  if (points.length === 0) return '';

  const path = points.map((p, i) => {
    const command = i === 0 ? 'M' : 'L';
    return `${command} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  });

  if (closed) path.push('Z');

  return path.join(' ');
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface GridProps {
  center: Point;
  maxRadius: number;
  numSides: number;
  levels: number;
}

function Grid({ center, maxRadius, numSides, levels }: GridProps) {
  const grids = [];

  for (let level = 1; level <= levels; level++) {
    const radius = (maxRadius / levels) * level;
    const points = generatePolygonPoints(center, radius, numSides);
    const path = pointsToPath(points);

    grids.push(
      <path
        key={level}
        d={path}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="1"
        opacity={level === levels ? 1 : 0.5}
      />
    );
  }

  return <g className="radar-grid">{grids}</g>;
}

interface AxesProps {
  center: Point;
  maxRadius: number;
  dimensions: RadarDimension[];
}

function Axes({ center, maxRadius, dimensions }: AxesProps) {
  const numDimensions = dimensions.length;
  const angleStep = 360 / numDimensions;

  return (
    <g className="radar-axes">
      {dimensions.map((_, index) => {
        const angle = angleStep * index;
        const endPoint = polarToCartesian(center.x, center.y, maxRadius, angle);

        return (
          <line
            key={index}
            x1={center.x}
            y1={center.y}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#d1d5db"
            strokeWidth="1"
          />
        );
      })}
    </g>
  );
}

interface LabelsProps {
  center: Point;
  maxRadius: number;
  dimensions: RadarDimension[];
  showValues: boolean;
  onDimensionClick?: (dimension: RadarDimension) => void;
}

function Labels({
  center,
  maxRadius,
  dimensions,
  showValues,
  onDimensionClick,
}: LabelsProps) {
  const numDimensions = dimensions.length;
  const angleStep = 360 / numDimensions;
  const labelRadius = maxRadius + 20;

  return (
    <g className="radar-labels">
      {dimensions.map((dimension, index) => {
        const angle = angleStep * index;
        const point = polarToCartesian(center.x, center.y, labelRadius, angle);

        // Adjust text anchor based on position
        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
        if (angle > 45 && angle < 135) {
          textAnchor = 'start';
        } else if (angle > 225 && angle < 315) {
          textAnchor = 'end';
        }

        return (
          <g
            key={dimension.key}
            onClick={() => onDimensionClick?.(dimension)}
            style={{ cursor: onDimensionClick ? 'pointer' : 'default' }}
          >
            <text
              x={point.x}
              y={point.y}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              className="text-xs fill-gray-600 font-medium"
            >
              {dimension.label}
            </text>
            {showValues && dimension.maxValue && (
              <text
                x={point.x}
                y={point.y + 14}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-xs fill-gray-400"
              >
                (0-{dimension.maxValue})
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

interface DataSeriesProps {
  center: Point;
  maxRadius: number;
  dimensions: RadarDimension[];
  series: RadarDataSeries;
  color: string;
  fillOpacity: number;
  strokeWidth: number;
  animated: boolean;
  onPointHover: (dimension: RadarDimension, value: number, x: number, y: number) => void;
  onPointLeave: () => void;
}

function DataSeries({
  center,
  maxRadius,
  dimensions,
  series,
  color,
  fillOpacity,
  strokeWidth,
  animated,
  onPointHover,
  onPointLeave,
}: DataSeriesProps) {
  // Normalize values to 0-1 range
  const normalizedValues = dimensions.map(dim => {
    const value = series.values[dim.key] || 0;
    const maxValue = dim.maxValue || 100;
    return Math.min(1, Math.max(0, value / maxValue));
  });

  const points = generatePolygonPoints(center, maxRadius, dimensions.length, normalizedValues);
  const path = pointsToPath(points);

  return (
    <g className="radar-data-series">
      {/* Fill */}
      <path
        d={path}
        fill={color}
        fillOpacity={fillOpacity}
        stroke="none"
        className={animated ? 'transition-all duration-500' : ''}
      />

      {/* Stroke */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        className={animated ? 'transition-all duration-500' : ''}
      />

      {/* Data points */}
      {points.map((point, index) => {
        const dimension = dimensions[index];
        const value = series.values[dimension.key] || 0;

        return (
          <circle
            key={`${series.id}-${dimension.key}`}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={color}
            stroke="white"
            strokeWidth={2}
            className={`cursor-pointer ${animated ? 'transition-all duration-300' : ''}`}
            onMouseEnter={() => onPointHover(dimension, value, point.x, point.y)}
            onMouseLeave={onPointLeave}
          />
        );
      })}
    </g>
  );
}

interface TooltipProps {
  state: TooltipState;
}

function Tooltip({ state }: TooltipProps) {
  if (!state.visible || !state.dimension) return null;

  return (
    <div
      className="absolute bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 pointer-events-none"
      style={{
        left: state.x + 10,
        top: state.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="text-sm font-medium text-gray-900 mb-2">
        {state.dimension.label}
      </div>
      {state.values.map(({ series, value }) => (
        <div
          key={series.id}
          className="flex items-center gap-2 text-sm"
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: series.color }}
          />
          <span className="text-gray-600">{series.label}:</span>
          <span className="font-medium">{value.toFixed(1)}</span>
        </div>
      ))}
      {state.dimension.description && (
        <div className="mt-2 text-xs text-gray-500 max-w-xs">
          {state.dimension.description}
        </div>
      )}
    </div>
  );
}

interface LegendProps {
  series: RadarDataSeries[];
  colors: string[];
  onSeriesClick?: (series: RadarDataSeries) => void;
}

function Legend({ series, colors, onSeriesClick }: LegendProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
      {series.map((s, index) => (
        <button
          key={s.id}
          onClick={() => onSeriesClick?.(s)}
          className={`flex items-center gap-2 text-sm ${
            onSeriesClick ? 'cursor-pointer hover:opacity-75' : ''
          }`}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors[index] }}
          />
          <span className="text-gray-700">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RadarChart({
  dimensions,
  series,
  size = 300,
  showLabels = true,
  showValues = false,
  showGrid = true,
  showLegend = true,
  gridLevels = 5,
  fillOpacity = 0.2,
  strokeWidth = 2,
  animated = true,
  className = '',
  onDimensionClick,
  onSeriesClick,
}: RadarChartProps) {
  const chartId = useId();
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    values: [],
  });

  const padding = 60; // Space for labels
  const chartSize = size;
  const center: Point = {
    x: chartSize / 2 + padding,
    y: chartSize / 2 + padding,
  };
  const maxRadius = chartSize / 2;

  // Calculate colors for each series
  const seriesColors = useMemo(
    () => series.map((s, i) => getSeriesColor(s, i)),
    [series]
  );

  const handlePointHover = (
    dimension: RadarDimension,
    value: number,
    x: number,
    y: number,
    seriesIndex: number
  ) => {
    // Get values from all series for this dimension
    const values = series.map((s, i) => ({
      series: { ...s, color: seriesColors[i] },
      value: s.values[dimension.key] || 0,
    }));

    setTooltip({
      visible: true,
      x,
      y,
      dimension,
      values,
    });
  };

  const handlePointLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  if (dimensions.length < 3) {
    return (
      <div className={`flex items-center justify-center p-8 text-gray-500 ${className}`}>
        Radar chart requires at least 3 dimensions
      </div>
    );
  }

  return (
    <div
      className={`relative ${className}`}
      role="figure"
      aria-label="Radar chart showing multi-dimensional data"
    >
      <svg
        width={chartSize + padding * 2}
        height={chartSize + padding * 2}
        viewBox={`0 0 ${chartSize + padding * 2} ${chartSize + padding * 2}`}
      >
        <defs>
          {/* Gradient definitions for each series */}
          {series.map((s, index) => (
            <radialGradient
              key={`gradient-${s.id}`}
              id={`${chartId}-gradient-${index}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={seriesColors[index]} stopOpacity={0.8} />
              <stop offset="100%" stopColor={seriesColors[index]} stopOpacity={0.2} />
            </radialGradient>
          ))}
        </defs>

        {/* Grid */}
        {showGrid && (
          <Grid
            center={center}
            maxRadius={maxRadius}
            numSides={dimensions.length}
            levels={gridLevels}
          />
        )}

        {/* Axes */}
        <Axes
          center={center}
          maxRadius={maxRadius}
          dimensions={dimensions}
        />

        {/* Data series */}
        {series.map((s, index) => (
          <DataSeries
            key={s.id}
            center={center}
            maxRadius={maxRadius}
            dimensions={dimensions}
            series={s}
            color={seriesColors[index]}
            fillOpacity={s.fillOpacity ?? fillOpacity}
            strokeWidth={strokeWidth}
            animated={animated}
            onPointHover={(dim, val, x, y) => handlePointHover(dim, val, x, y, index)}
            onPointLeave={handlePointLeave}
          />
        ))}

        {/* Labels */}
        {showLabels && (
          <Labels
            center={center}
            maxRadius={maxRadius}
            dimensions={dimensions}
            showValues={showValues}
            onDimensionClick={onDimensionClick}
          />
        )}
      </svg>

      {/* Tooltip */}
      <Tooltip state={tooltip} />

      {/* Legend */}
      {showLegend && series.length > 1 && (
        <Legend
          series={series}
          colors={seriesColors}
          onSeriesClick={onSeriesClick}
        />
      )}

      {/* Accessible data table */}
      <table className="sr-only">
        <caption>Radar chart data</caption>
        <thead>
          <tr>
            <th>Dimension</th>
            {series.map(s => (
              <th key={s.id}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dimensions.map(dim => (
            <tr key={dim.key}>
              <td>{dim.label}</td>
              {series.map(s => (
                <td key={s.id}>{s.values[dim.key] || 0}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Brand perception radar chart preset
 */
export const BRAND_PERCEPTION_DIMENSIONS: RadarDimension[] = [
  { key: 'visibility', label: 'Visibility', maxValue: 100, description: 'How often the brand appears in AI responses' },
  { key: 'sentiment', label: 'Sentiment', maxValue: 100, description: 'Overall positive/negative perception' },
  { key: 'accuracy', label: 'Accuracy', maxValue: 100, description: 'Correctness of information about the brand' },
  { key: 'relevance', label: 'Relevance', maxValue: 100, description: 'How relevant the brand is to user queries' },
  { key: 'authority', label: 'Authority', maxValue: 100, description: 'Perceived expertise and trustworthiness' },
  { key: 'differentiation', label: 'Differentiation', maxValue: 100, description: 'Uniqueness compared to competitors' },
];

export default RadarChart;
