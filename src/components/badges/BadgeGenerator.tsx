/**
 * Badge Generator Component
 *
 * Allows users to customize and get embed codes for their score badges
 *
 * Phase 2, Week 7, Day 1
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// ================================================================
// TYPES
// ================================================================

export interface BadgeGeneratorProps {
  brandId: string;
  brandName: string;
  score: number;
  baseUrl?: string;
  className?: string;
}

type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeConfig {
  style: BadgeStyle;
  size: BadgeSize;
  label: string;
}

// ================================================================
// STYLE OPTIONS
// ================================================================

const STYLE_OPTIONS: { value: BadgeStyle; label: string; description: string }[] = [
  { value: 'flat', label: 'Flat', description: 'Classic flat style with gradient' },
  { value: 'flat-square', label: 'Flat Square', description: 'Simple flat with square corners' },
  { value: 'plastic', label: 'Plastic', description: 'Rounded pill shape with shine' },
  { value: 'for-the-badge', label: 'For the Badge', description: 'Bold uppercase letters' },
];

const SIZE_OPTIONS: { value: BadgeSize; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

// ================================================================
// COPY BUTTON
// ================================================================

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
        copied
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      )}
    >
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function BadgeGenerator({
  brandId,
  brandName,
  score,
  baseUrl = '',
  className,
}: BadgeGeneratorProps) {
  const [config, setConfig] = useState<BadgeConfig>({
    style: 'flat',
    size: 'medium',
    label: 'AI Score',
  });

  // Generate badge URL
  const badgeUrl = useMemo(() => {
    const params = new URLSearchParams({
      style: config.style,
      size: config.size,
      label: config.label,
    });
    return `${baseUrl}/api/badge/${brandId}?${params.toString()}`;
  }, [brandId, config, baseUrl]);

  // Generate embed codes
  const htmlEmbed = useMemo(
    () => `<a href="${baseUrl}" target="_blank">
  <img src="${badgeUrl}" alt="${brandName} AI Perception Score: ${score}/100" />
</a>`,
    [badgeUrl, brandName, score, baseUrl]
  );

  const markdownEmbed = useMemo(
    () => `[![${brandName} AI Score](${badgeUrl})](${baseUrl})`,
    [badgeUrl, brandName, baseUrl]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Preview */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-8 flex items-center justify-center">
        <img
          src={badgeUrl}
          alt={`${brandName} AI Score: ${score}/100`}
          className="max-w-full h-auto"
        />
      </div>

      {/* Configuration */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Style Selector */}
        <div>
          <label
            htmlFor="badge-style"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Style
          </label>
          <select
            id="badge-style"
            value={config.style}
            onChange={(e) => setConfig((c) => ({ ...c, style: e.target.value as BadgeStyle }))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {STYLE_OPTIONS.find((o) => o.value === config.style)?.description}
          </p>
        </div>

        {/* Size Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Size
          </label>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setConfig((c) => ({ ...c, size: option.value }))}
                className={cn(
                  'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                  config.size === option.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Label Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Label
          </label>
          <input
            type="text"
            value={config.label}
            onChange={(e) => setConfig((c) => ({ ...c, label: e.target.value }))}
            placeholder="AI Score"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Embed Codes */}
      <div className="space-y-4">
        {/* HTML Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              HTML Embed Code
            </label>
            <CopyButton text={htmlEmbed} label="Copy HTML" />
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
            <code>{htmlEmbed}</code>
          </pre>
        </div>

        {/* Markdown Embed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Markdown Embed Code
            </label>
            <CopyButton text={markdownEmbed} label="Copy Markdown" />
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
            <code>{markdownEmbed}</code>
          </pre>
        </div>

        {/* Direct URL */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Direct Image URL
            </label>
            <CopyButton text={badgeUrl} label="Copy URL" />
          </div>
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm">
            <code>{badgeUrl}</code>
          </pre>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Tips for using your badge
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>Add the badge to your website footer or about page</li>
          <li>Include it in your GitHub README for open source projects</li>
          <li>Display it on your documentation site</li>
          <li>Badges update automatically as your score changes</li>
        </ul>
      </div>
    </div>
  );
}

export default BadgeGenerator;
