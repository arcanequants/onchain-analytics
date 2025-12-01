/**
 * AI Provider Card Component
 *
 * Phase 1, Week 2, Day 3
 * Displays AI provider information with brand colors and status.
 */

'use client';

import React from 'react';
import { ScoreBar, ScoreBadge } from './ScoreCircle';

// ================================================================
// TYPES
// ================================================================

export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'perplexity';

export interface AIProviderData {
  provider: AIProviderType;
  score: number;
  queriesAnalyzed: number;
  mentionRate: number;
  averagePosition?: number;
  responseTime?: number;
  status?: 'success' | 'partial' | 'failed' | 'pending';
  error?: string;
}

export interface AIProviderCardProps {
  data: AIProviderData;
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
}

// ================================================================
// PROVIDER CONFIGURATIONS
// ================================================================

interface ProviderConfig {
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  description: string;
}

const PROVIDER_CONFIGS: Record<AIProviderType, ProviderConfig> = {
  openai: {
    name: 'OpenAI',
    shortName: 'GPT',
    color: '#10a37f',
    bgColor: 'rgba(16, 163, 127, 0.1)',
    borderColor: 'rgba(16, 163, 127, 0.3)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.5056-2.6067-1.4998z" />
      </svg>
    ),
    description: 'ChatGPT / GPT-4',
  },
  anthropic: {
    name: 'Anthropic',
    shortName: 'Claude',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.1)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M17.304 4.027L12 19.973 6.696 4.027h3.6L12 9.493l1.703-5.466h3.6zM6.696 4.027H3.5L8.5 19.973h3.5L6.696 4.027zm10.608 0H20.5L15.5 19.973H12l5.304-15.946z" />
      </svg>
    ),
    description: 'Claude AI Assistant',
  },
  google: {
    name: 'Google AI',
    shortName: 'Gemini',
    color: '#4285f4',
    bgColor: 'rgba(66, 133, 244, 0.1)',
    borderColor: 'rgba(66, 133, 244, 0.3)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 11h8.533c.044.385.067.78.067 1.184 0 2.734-.98 5.036-2.678 6.6-1.485 1.371-3.518 2.175-5.922 2.175A8.976 8.976 0 0 1 3.041 12 8.976 8.976 0 0 1 12 3.041c2.467 0 4.502.824 6.07 2.18l-2.46 2.46C14.587 6.758 13.368 6.3 12 6.3a5.7 5.7 0 0 0-5.7 5.7 5.7 5.7 0 0 0 5.7 5.7c2.755 0 4.606-1.577 5.003-3.7H12V11z" />
      </svg>
    ),
    description: 'Google Gemini',
  },
  perplexity: {
    name: 'Perplexity',
    shortName: 'PPLX',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    description: 'Perplexity AI Search',
  },
};

// ================================================================
// STATUS BADGE
// ================================================================

interface StatusBadgeProps {
  status: NonNullable<AIProviderData['status']>;
}

function StatusBadge({ status }: StatusBadgeProps): React.ReactElement {
  const config = {
    success: { label: 'Success', color: 'text-green-500', bg: 'bg-green-500/20' },
    partial: { label: 'Partial', color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
    failed: { label: 'Failed', color: 'text-red-500', bg: 'bg-red-500/20' },
    pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-500/20' },
  }[status];

  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full ${config.color} ${config.bg}`}
      data-testid="provider-status"
    >
      {config.label}
    </span>
  );
}

// ================================================================
// COMPONENT
// ================================================================

export function AIProviderCard({
  data,
  showDetails = true,
  compact = false,
  className = '',
  onClick,
}: AIProviderCardProps): React.ReactElement {
  const config = PROVIDER_CONFIGS[data.provider];
  const isClickable = !!onClick;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
          isClickable ? 'cursor-pointer hover:shadow-md' : ''
        } ${className}`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        }}
        onClick={onClick}
        data-testid="ai-provider-card-compact"
      >
        <div style={{ color: config.color }}>{config.icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)]">{config.shortName}</span>
            <ScoreBadge score={data.score} />
          </div>
        </div>
        {data.status && <StatusBadge status={data.status} />}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isClickable ? 'cursor-pointer hover:shadow-lg' : ''
      } ${className}`}
      style={{ borderColor: config.borderColor }}
      onClick={onClick}
      data-testid="ai-provider-card"
    >
      {/* Header */}
      <div
        className="p-4 flex items-center gap-3"
        style={{ backgroundColor: config.bgColor }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: config.color, color: 'white' }}
        >
          {config.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-[var(--text-primary)]">{config.name}</h4>
            {data.status && <StatusBadge status={data.status} />}
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">{config.description}</p>
        </div>
        <div className="text-right">
          <div
            className="text-2xl font-bold"
            style={{ color: config.color }}
          >
            {data.score}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Score</div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 bg-[var(--bg-card)]">
        <ScoreBar score={data.score} showValue={false} animate />

        {showDetails && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="text-[var(--text-tertiary)] text-xs">Mention Rate</div>
              <div className="font-medium text-[var(--text-primary)]">
                {Math.round(data.mentionRate * 100)}%
              </div>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
              <div className="text-[var(--text-tertiary)] text-xs">Queries</div>
              <div className="font-medium text-[var(--text-primary)]">
                {data.queriesAnalyzed}
              </div>
            </div>
            {data.averagePosition && (
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                <div className="text-[var(--text-tertiary)] text-xs">Avg Position</div>
                <div className="font-medium text-[var(--text-primary)]">
                  #{data.averagePosition.toFixed(1)}
                </div>
              </div>
            )}
            {data.responseTime && (
              <div className="p-2 rounded-lg bg-[var(--bg-tertiary)]">
                <div className="text-[var(--text-tertiary)] text-xs">Response Time</div>
                <div className="font-medium text-[var(--text-primary)]">
                  {data.responseTime}ms
                </div>
              </div>
            )}
          </div>
        )}

        {data.error && (
          <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-500">{data.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================================
// PROVIDER BADGE (mini version)
// ================================================================

export interface ProviderBadgeProps {
  provider: AIProviderType;
  status?: 'success' | 'partial' | 'failed' | 'pending';
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function ProviderBadge({
  provider,
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: ProviderBadgeProps): React.ReactElement {
  const config = PROVIDER_CONFIGS[provider];

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
  };

  const statusIndicator = status && (
    <span
      className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
        status === 'success'
          ? 'bg-green-500'
          : status === 'partial'
          ? 'bg-yellow-500'
          : status === 'failed'
          ? 'bg-red-500'
          : 'bg-gray-400'
      }`}
    />
  );

  return (
    <div className={`flex items-center gap-1.5 ${className}`} data-testid="provider-badge">
      <div
        className={`relative ${sizeClasses[size]} rounded flex items-center justify-center`}
        style={{ backgroundColor: config.bgColor, color: config.color }}
      >
        <div className={size === 'sm' ? 'scale-75' : ''}>{config.icon}</div>
        {statusIndicator}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {config.shortName}
        </span>
      )}
    </div>
  );
}

// ================================================================
// PROVIDER CARDS GRID
// ================================================================

export interface AIProviderGridProps {
  providers: AIProviderData[];
  compact?: boolean;
  className?: string;
}

export function AIProviderGrid({
  providers,
  compact = false,
  className = '',
}: AIProviderGridProps): React.ReactElement {
  return (
    <div
      className={`grid gap-4 ${
        compact ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2'
      } ${className}`}
      data-testid="ai-provider-grid"
    >
      {providers.map((provider) => (
        <AIProviderCard
          key={provider.provider}
          data={provider}
          compact={compact}
        />
      ))}
    </div>
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default AIProviderCard;
