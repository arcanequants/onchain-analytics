/**
 * Charts Module Exports
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * 7+ chart components for comprehensive data visualization
 */

// Core Charts
export { default as ComparisonChart, type ComparisonChartProps, type ComparisonItem } from './ComparisonChart';
export { default as RadarChart, type RadarChartProps, type RadarDimension, type RadarDataSeries, BRAND_PERCEPTION_DIMENSIONS } from './RadarChart';

// Support Components
export { default as ChartTooltip, useChartTooltip, type ChartTooltipProps, type TooltipItem, type TooltipState } from './ChartTooltip';
export { default as ChartSkeleton, type ChartSkeletonProps, type ChartSkeletonType } from './ChartSkeleton';
export { ChartError, ChartEmpty, ChartNoConnection, ChartTimeout, ChartNoPermission, ChartComingSoon, type ChartErrorProps, type ChartEmptyProps } from './ChartStates';

// Re-export existing charts if they exist
// export { default as ScoreGauge } from './ScoreGauge';
// export { default as ProviderBreakdown } from './ProviderBreakdown';
// export { default as TrendChart } from './TrendChart';
