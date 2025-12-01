/**
 * Social Share Buttons Component
 *
 * Buttons for sharing brand scores on Twitter/X and LinkedIn
 *
 * Phase 2, Week 7, Day 1
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  generateShareUrls,
  openShareWindow,
  copyToClipboard,
  trackShareEvent,
  type ShareContent,
} from '@/lib/social';

// ================================================================
// TYPES
// ================================================================

export interface ShareButtonsProps {
  content: ShareContent;
  baseUrl?: string;
  brandId: string;
  className?: string;
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

// ================================================================
// ICONS
// ================================================================

function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================

export function ShareButtons({
  content,
  baseUrl = '',
  brandId,
  className,
  variant = 'horizontal',
  showLabels = true,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const urls = generateShareUrls(content, baseUrl);

  const handleTwitterShare = () => {
    openShareWindow(urls.twitter);
    trackShareEvent({
      platform: 'twitter',
      brandId,
      score: content.score,
      timestamp: new Date(),
    });
  };

  const handleLinkedInShare = () => {
    openShareWindow(urls.linkedin);
    trackShareEvent({
      platform: 'linkedin',
      brandId,
      score: content.score,
      timestamp: new Date(),
    });
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(urls.copy);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      trackShareEvent({
        platform: 'copy',
        brandId,
        score: content.score,
        timestamp: new Date(),
      });
    }
  };

  const buttonBaseClass = cn(
    'flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
    'focus:outline-none focus:ring-2 focus:ring-offset-2'
  );

  return (
    <div
      data-testid="share-buttons"
      className={cn(
        'flex gap-3',
        variant === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {/* Twitter/X Button */}
      <button
        onClick={handleTwitterShare}
        className={cn(
          buttonBaseClass,
          'bg-black text-white hover:bg-gray-800 focus:ring-gray-500'
        )}
        aria-label="Share on X (Twitter)"
      >
        <TwitterIcon className="w-5 h-5" />
        {showLabels && <span>Share on X</span>}
      </button>

      {/* LinkedIn Button */}
      <button
        onClick={handleLinkedInShare}
        className={cn(
          buttonBaseClass,
          'bg-[#0A66C2] text-white hover:bg-[#004182] focus:ring-blue-500'
        )}
        aria-label="Share on LinkedIn"
      >
        <LinkedInIcon className="w-5 h-5" />
        {showLabels && <span>Share on LinkedIn</span>}
      </button>

      {/* Copy Button */}
      <button
        onClick={handleCopy}
        className={cn(
          buttonBaseClass,
          copied
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-400'
        )}
        aria-label={copied ? 'Copied!' : 'Copy share text'}
      >
        {copied ? (
          <>
            <CheckIcon className="w-5 h-5" />
            {showLabels && <span>Copied!</span>}
          </>
        ) : (
          <>
            <CopyIcon className="w-5 h-5" />
            {showLabels && <span>Copy</span>}
          </>
        )}
      </button>
    </div>
  );
}

export default ShareButtons;
