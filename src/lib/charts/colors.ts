/**
 * Chart Color System
 *
 * Phase 4, Week 8 Extended - Data Visualization Checklist
 *
 * Features:
 * - 5 score semantic colors (Excellent, Good, Average, Poor, Critical)
 * - 4+ provider brand colors
 * - Colorblind-safe palette
 * - Dark mode support
 * - Consistent opacity variants
 */

// ============================================================================
// TYPES
// ============================================================================

export type ScoreLevel = 'excellent' | 'good' | 'average' | 'poor' | 'critical';
export type Provider = 'openai' | 'anthropic' | 'google' | 'perplexity';
export type ColorMode = 'light' | 'dark';

export interface ColorValue {
  hex: string;
  rgb: string;
  hsl: string;
}

export interface ColorVariants {
  base: ColorValue;
  light: ColorValue;
  dark: ColorValue;
  muted: ColorValue;
  foreground: ColorValue;
}

export interface ScoreColor extends ColorVariants {
  level: ScoreLevel;
  label: string;
  range: { min: number; max: number };
  pattern?: string; // For colorblind accessibility
}

export interface ProviderColor extends ColorVariants {
  provider: Provider;
  label: string;
  icon?: string;
}

// ============================================================================
// SCORE SEMANTIC COLORS (5 levels)
// ============================================================================

/**
 * Score color system using a diverging color scale
 * Colors are designed to be distinguishable for colorblind users
 */
export const SCORE_COLORS: Record<ScoreLevel, ScoreColor> = {
  excellent: {
    level: 'excellent',
    label: 'Excellent',
    range: { min: 90, max: 100 },
    pattern: 'solid',
    base: { hex: '#10B981', rgb: 'rgb(16, 185, 129)', hsl: 'hsl(160, 84%, 39%)' },
    light: { hex: '#D1FAE5', rgb: 'rgb(209, 250, 229)', hsl: 'hsl(152, 81%, 90%)' },
    dark: { hex: '#065F46', rgb: 'rgb(6, 95, 70)', hsl: 'hsl(160, 88%, 20%)' },
    muted: { hex: '#6EE7B7', rgb: 'rgb(110, 231, 183)', hsl: 'hsl(156, 72%, 67%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  good: {
    level: 'good',
    label: 'Good',
    range: { min: 70, max: 89 },
    pattern: 'diagonal',
    base: { hex: '#3B82F6', rgb: 'rgb(59, 130, 246)', hsl: 'hsl(217, 91%, 60%)' },
    light: { hex: '#DBEAFE', rgb: 'rgb(219, 234, 254)', hsl: 'hsl(214, 95%, 93%)' },
    dark: { hex: '#1E40AF', rgb: 'rgb(30, 64, 175)', hsl: 'hsl(226, 71%, 40%)' },
    muted: { hex: '#93C5FD', rgb: 'rgb(147, 197, 253)', hsl: 'hsl(213, 93%, 78%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  average: {
    level: 'average',
    label: 'Average',
    range: { min: 50, max: 69 },
    pattern: 'dots',
    base: { hex: '#F59E0B', rgb: 'rgb(245, 158, 11)', hsl: 'hsl(38, 92%, 50%)' },
    light: { hex: '#FEF3C7', rgb: 'rgb(254, 243, 199)', hsl: 'hsl(48, 96%, 89%)' },
    dark: { hex: '#B45309', rgb: 'rgb(180, 83, 9)', hsl: 'hsl(26, 91%, 37%)' },
    muted: { hex: '#FCD34D', rgb: 'rgb(252, 211, 77)', hsl: 'hsl(46, 96%, 65%)' },
    foreground: { hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)' },
  },
  poor: {
    level: 'poor',
    label: 'Poor',
    range: { min: 30, max: 49 },
    pattern: 'crosshatch',
    base: { hex: '#F97316', rgb: 'rgb(249, 115, 22)', hsl: 'hsl(25, 95%, 53%)' },
    light: { hex: '#FFEDD5', rgb: 'rgb(255, 237, 213)', hsl: 'hsl(34, 100%, 92%)' },
    dark: { hex: '#C2410C', rgb: 'rgb(194, 65, 12)', hsl: 'hsl(17, 88%, 40%)' },
    muted: { hex: '#FDBA74', rgb: 'rgb(253, 186, 116)', hsl: 'hsl(31, 97%, 72%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  critical: {
    level: 'critical',
    label: 'Critical',
    range: { min: 0, max: 29 },
    pattern: 'horizontal',
    base: { hex: '#EF4444', rgb: 'rgb(239, 68, 68)', hsl: 'hsl(0, 84%, 60%)' },
    light: { hex: '#FEE2E2', rgb: 'rgb(254, 226, 226)', hsl: 'hsl(0, 93%, 94%)' },
    dark: { hex: '#B91C1C', rgb: 'rgb(185, 28, 28)', hsl: 'hsl(0, 74%, 42%)' },
    muted: { hex: '#FCA5A5', rgb: 'rgb(252, 165, 165)', hsl: 'hsl(0, 94%, 82%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
};

// ============================================================================
// PROVIDER BRAND COLORS (4 providers)
// ============================================================================

export const PROVIDER_COLORS: Record<Provider, ProviderColor> = {
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    base: { hex: '#00A67E', rgb: 'rgb(0, 166, 126)', hsl: 'hsl(166, 100%, 33%)' },
    light: { hex: '#E6F7F3', rgb: 'rgb(230, 247, 243)', hsl: 'hsl(166, 55%, 94%)' },
    dark: { hex: '#006B52', rgb: 'rgb(0, 107, 82)', hsl: 'hsl(166, 100%, 21%)' },
    muted: { hex: '#4DD4AF', rgb: 'rgb(77, 212, 175)', hsl: 'hsl(164, 60%, 57%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic',
    base: { hex: '#D97706', rgb: 'rgb(217, 119, 6)', hsl: 'hsl(32, 95%, 44%)' },
    light: { hex: '#FEF3C7', rgb: 'rgb(254, 243, 199)', hsl: 'hsl(48, 96%, 89%)' },
    dark: { hex: '#92400E', rgb: 'rgb(146, 64, 14)', hsl: 'hsl(23, 82%, 31%)' },
    muted: { hex: '#FBBF24', rgb: 'rgb(251, 191, 36)', hsl: 'hsl(43, 96%, 56%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  google: {
    provider: 'google',
    label: 'Google Gemini',
    base: { hex: '#4285F4', rgb: 'rgb(66, 133, 244)', hsl: 'hsl(217, 89%, 61%)' },
    light: { hex: '#E8F0FE', rgb: 'rgb(232, 240, 254)', hsl: 'hsl(218, 85%, 95%)' },
    dark: { hex: '#1A73E8', rgb: 'rgb(26, 115, 232)', hsl: 'hsl(214, 82%, 51%)' },
    muted: { hex: '#8AB4F8', rgb: 'rgb(138, 180, 248)', hsl: 'hsl(217, 87%, 76%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
  perplexity: {
    provider: 'perplexity',
    label: 'Perplexity',
    base: { hex: '#7C3AED', rgb: 'rgb(124, 58, 237)', hsl: 'hsl(262, 83%, 58%)' },
    light: { hex: '#EDE9FE', rgb: 'rgb(237, 233, 254)', hsl: 'hsl(251, 91%, 95%)' },
    dark: { hex: '#5B21B6', rgb: 'rgb(91, 33, 182)', hsl: 'hsl(263, 70%, 42%)' },
    muted: { hex: '#A78BFA', rgb: 'rgb(167, 139, 250)', hsl: 'hsl(255, 92%, 76%)' },
    foreground: { hex: '#FFFFFF', rgb: 'rgb(255, 255, 255)', hsl: 'hsl(0, 0%, 100%)' },
  },
};

// ============================================================================
// COLORBLIND-SAFE PALETTE
// ============================================================================

/**
 * Wong color palette - optimized for all types of color blindness
 * Reference: https://www.nature.com/articles/nmeth.1618
 */
export const COLORBLIND_SAFE = {
  orange: { hex: '#E69F00', rgb: 'rgb(230, 159, 0)', hsl: 'hsl(42, 100%, 45%)' },
  skyBlue: { hex: '#56B4E9', rgb: 'rgb(86, 180, 233)', hsl: 'hsl(202, 75%, 63%)' },
  bluishGreen: { hex: '#009E73', rgb: 'rgb(0, 158, 115)', hsl: 'hsl(164, 100%, 31%)' },
  yellow: { hex: '#F0E442', rgb: 'rgb(240, 228, 66)', hsl: 'hsl(56, 85%, 60%)' },
  blue: { hex: '#0072B2', rgb: 'rgb(0, 114, 178)', hsl: 'hsl(202, 100%, 35%)' },
  vermillion: { hex: '#D55E00', rgb: 'rgb(213, 94, 0)', hsl: 'hsl(26, 100%, 42%)' },
  reddishPurple: { hex: '#CC79A7', rgb: 'rgb(204, 121, 167)', hsl: 'hsl(327, 45%, 64%)' },
  black: { hex: '#000000', rgb: 'rgb(0, 0, 0)', hsl: 'hsl(0, 0%, 0%)' },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get score color based on numeric value
 */
export function getScoreColor(score: number): ScoreColor {
  if (score >= 90) return SCORE_COLORS.excellent;
  if (score >= 70) return SCORE_COLORS.good;
  if (score >= 50) return SCORE_COLORS.average;
  if (score >= 30) return SCORE_COLORS.poor;
  return SCORE_COLORS.critical;
}

/**
 * Get score level from numeric value
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 90) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'average';
  if (score >= 30) return 'poor';
  return 'critical';
}

/**
 * Get score label from numeric value
 */
export function getScoreLabel(score: number): string {
  return getScoreColor(score).label;
}

/**
 * Get provider color
 */
export function getProviderColor(provider: Provider): ProviderColor {
  return PROVIDER_COLORS[provider];
}

/**
 * Get all provider colors as array (for charts)
 */
export function getProviderColorArray(): string[] {
  return Object.values(PROVIDER_COLORS).map(p => p.base.hex);
}

/**
 * Get all score colors as array (for gradients)
 */
export function getScoreColorArray(): string[] {
  return Object.values(SCORE_COLORS).map(s => s.base.hex);
}

/**
 * Apply opacity to hex color
 */
export function withOpacity(hexColor: string, opacity: number): string {
  const clampedOpacity = Math.max(0, Math.min(1, opacity));
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${clampedOpacity})`;
}

/**
 * Get contrasting text color for background
 */
export function getContrastingColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance (WCAG formula)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

/**
 * Generate gradient from score colors
 */
export function getScoreGradient(direction: 'horizontal' | 'vertical' = 'horizontal'): string {
  const colors = [
    SCORE_COLORS.critical.base.hex,
    SCORE_COLORS.poor.base.hex,
    SCORE_COLORS.average.base.hex,
    SCORE_COLORS.good.base.hex,
    SCORE_COLORS.excellent.base.hex,
  ];

  const angle = direction === 'horizontal' ? '90deg' : '180deg';
  return `linear-gradient(${angle}, ${colors.join(', ')})`;
}

/**
 * Get dark mode variant of a color
 */
export function getDarkModeColor(color: ColorVariants, mode: ColorMode): ColorValue {
  return mode === 'dark' ? color.dark : color.base;
}

// ============================================================================
// CHART THEME PRESETS
// ============================================================================

export const CHART_THEMES = {
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    gridLines: '#E5E7EB',
    axis: '#9CA3AF',
    tooltip: {
      background: '#FFFFFF',
      border: '#E5E7EB',
      text: '#1F2937',
    },
  },
  dark: {
    background: '#111827',
    text: '#F9FAFB',
    textMuted: '#9CA3AF',
    gridLines: '#374151',
    axis: '#6B7280',
    tooltip: {
      background: '#1F2937',
      border: '#374151',
      text: '#F9FAFB',
    },
  },
} as const;

// ============================================================================
// CSS VARIABLES GENERATOR
// ============================================================================

/**
 * Generate CSS variables for score colors
 */
export function generateScoreColorVars(): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [level, color] of Object.entries(SCORE_COLORS)) {
    vars[`--score-${level}`] = color.base.hex;
    vars[`--score-${level}-light`] = color.light.hex;
    vars[`--score-${level}-dark`] = color.dark.hex;
    vars[`--score-${level}-muted`] = color.muted.hex;
  }

  return vars;
}

/**
 * Generate CSS variables for provider colors
 */
export function generateProviderColorVars(): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [provider, color] of Object.entries(PROVIDER_COLORS)) {
    vars[`--provider-${provider}`] = color.base.hex;
    vars[`--provider-${provider}-light`] = color.light.hex;
    vars[`--provider-${provider}-dark`] = color.dark.hex;
    vars[`--provider-${provider}-muted`] = color.muted.hex;
  }

  return vars;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  SCORE_COLORS,
  PROVIDER_COLORS,
  COLORBLIND_SAFE,
  CHART_THEMES,
  getScoreColor,
  getScoreLevel,
  getScoreLabel,
  getProviderColor,
  getProviderColorArray,
  getScoreColorArray,
  withOpacity,
  getContrastingColor,
  getScoreGradient,
  getDarkModeColor,
  generateScoreColorVars,
  generateProviderColorVars,
};
