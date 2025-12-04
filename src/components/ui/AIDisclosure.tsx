'use client';

/**
 * AI Usage Disclosure Component
 *
 * RED TEAM AUDIT FIX: LOW-003
 * Transparent disclosure of AI-generated content
 *
 * Features:
 * - Clear AI content labeling
 * - Multiple display variants
 * - Accessibility support (ARIA)
 * - Hover/click for details
 * - Customizable messaging
 */

import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface AIDisclosureProps {
  variant?: 'badge' | 'banner' | 'inline' | 'tooltip';
  provider?: string;
  model?: string;
  confidence?: number;
  showDetails?: boolean;
  className?: string;
}

export interface AIContentWrapperProps {
  children: React.ReactNode;
  variant?: 'badge' | 'banner';
  provider?: string;
  model?: string;
  confidence?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_DISCLOSURE_TEXT = 'AI-Generated Content';
const DISCLOSURE_DETAIL_TEXT =
  'This content was generated using artificial intelligence. While we strive for accuracy, please verify important information independently.';

// ============================================================================
// DISCLOSURE BADGE COMPONENT
// ============================================================================

function DisclosureBadge({
  provider,
  model,
  confidence,
  showDetails = false,
  className = '',
}: Omit<AIDisclosureProps, 'variant'>) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
        aria-label="AI-generated content disclosure"
        aria-expanded={isExpanded}
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <span>AI Generated</span>
        {confidence !== undefined && (
          <span className="text-blue-600">
            ({Math.round(confidence * 100)}%)
          </span>
        )}
      </button>

      {(isExpanded || showDetails) && (
        <div
          className="mt-2 p-3 text-xs text-gray-600 bg-gray-50 rounded-lg border border-gray-200"
          role="region"
          aria-label="AI disclosure details"
        >
          <p className="mb-2">{DISCLOSURE_DETAIL_TEXT}</p>
          {(provider || model) && (
            <div className="text-gray-500">
              {provider && <span>Provider: {provider}</span>}
              {provider && model && <span className="mx-1">|</span>}
              {model && <span>Model: {model}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DISCLOSURE BANNER COMPONENT
// ============================================================================

function DisclosureBanner({
  provider,
  model,
  confidence,
  className = '',
}: Omit<AIDisclosureProps, 'variant'>) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}
      role="region"
      aria-label="AI-generated content notice"
    >
      <div className="flex-shrink-0">
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">
          {DEFAULT_DISCLOSURE_TEXT}
        </p>
        <p className="text-xs text-blue-600 mt-0.5">
          {DISCLOSURE_DETAIL_TEXT}
        </p>
      </div>
      {confidence !== undefined && (
        <div className="flex-shrink-0 px-2 py-1 bg-blue-100 rounded text-xs font-medium text-blue-800">
          {Math.round(confidence * 100)}% confidence
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INLINE DISCLOSURE COMPONENT
// ============================================================================

function InlineDisclosure({
  provider,
  confidence,
  className = '',
}: Omit<AIDisclosureProps, 'variant'>) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs text-gray-500 ${className}`}
      role="note"
      aria-label="AI-generated content"
    >
      <svg
        className="w-3 h-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span>AI-generated</span>
      {provider && <span>by {provider}</span>}
    </span>
  );
}

// ============================================================================
// TOOLTIP DISCLOSURE COMPONENT
// ============================================================================

function TooltipDisclosure({
  provider,
  model,
  confidence,
  className = '',
}: Omit<AIDisclosureProps, 'variant'>) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
        aria-label="AI-generated content - hover for details"
        aria-describedby="ai-tooltip"
      >
        <svg
          className="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>

      {showTooltip && (
        <div
          id="ai-tooltip"
          role="tooltip"
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg z-50"
        >
          <div className="font-medium mb-1">{DEFAULT_DISCLOSURE_TEXT}</div>
          <p className="text-gray-300 mb-2">{DISCLOSURE_DETAIL_TEXT}</p>
          {(provider || model || confidence !== undefined) && (
            <div className="pt-2 border-t border-gray-700 text-gray-400">
              {provider && <div>Provider: {provider}</div>}
              {model && <div>Model: {model}</div>}
              {confidence !== undefined && (
                <div>Confidence: {Math.round(confidence * 100)}%</div>
              )}
            </div>
          )}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
            <div className="w-2 h-2 bg-gray-900 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN DISCLOSURE COMPONENT
// ============================================================================

export function AIDisclosure({
  variant = 'badge',
  provider,
  model,
  confidence,
  showDetails = false,
  className = '',
}: AIDisclosureProps) {
  switch (variant) {
    case 'banner':
      return (
        <DisclosureBanner
          provider={provider}
          model={model}
          confidence={confidence}
          className={className}
        />
      );
    case 'inline':
      return (
        <InlineDisclosure
          provider={provider}
          confidence={confidence}
          className={className}
        />
      );
    case 'tooltip':
      return (
        <TooltipDisclosure
          provider={provider}
          model={model}
          confidence={confidence}
          className={className}
        />
      );
    case 'badge':
    default:
      return (
        <DisclosureBadge
          provider={provider}
          model={model}
          confidence={confidence}
          showDetails={showDetails}
          className={className}
        />
      );
  }
}

// ============================================================================
// CONTENT WRAPPER COMPONENT
// ============================================================================

/**
 * Wrapper component that adds AI disclosure to any content
 */
export function AIContentWrapper({
  children,
  variant = 'badge',
  provider,
  model,
  confidence,
  className = '',
}: AIContentWrapperProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <AIDisclosure
          variant={variant}
          provider={provider}
          model={model}
          confidence={confidence}
        />
      </div>
      <div
        className="ai-generated-content"
        role="region"
        aria-label="AI-generated content section"
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// FOOTER DISCLOSURE COMPONENT
// ============================================================================

/**
 * Footer-style disclosure for page-level AI transparency
 */
export function AIDisclosureFooter({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-3 text-xs text-gray-500 border-t border-gray-200 ${className}`}
      role="contentinfo"
      aria-label="AI usage disclosure"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
      <span>
        Some content on this page may be AI-generated. Always verify important
        information.
      </span>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIDisclosure;
