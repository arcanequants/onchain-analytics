/**
 * Social Sharing Utilities
 *
 * Generate share URLs and content for Twitter/X and LinkedIn
 *
 * Phase 2, Week 7, Day 1
 */

// ================================================================
// TYPES
// ================================================================

export interface ShareContent {
  brandName: string;
  score: number;
  rank?: number;
  category?: string;
  url?: string;
}

export interface ShareUrls {
  twitter: string;
  linkedin: string;
  copy: string;
}

// ================================================================
// SCORE LABELS & EMOJIS
// ================================================================

function getScoreEmoji(score: number): string {
  if (score >= 90) return '🏆';
  if (score >= 80) return '⭐';
  if (score >= 70) return '✨';
  if (score >= 60) return '👍';
  if (score >= 50) return '📈';
  return '🎯';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'exceptional';
  if (score >= 80) return 'excellent';
  if (score >= 70) return 'great';
  if (score >= 60) return 'good';
  if (score >= 50) return 'solid';
  return 'improving';
}

// ================================================================
// SHARE TEXT GENERATORS
// ================================================================

/**
 * Generate Twitter/X share text
 */
export function generateTwitterText(content: ShareContent): string {
  const emoji = getScoreEmoji(content.score);
  const label = getScoreLabel(content.score);

  let text = `${emoji} ${content.brandName} has a ${label} AI Perception Score of ${content.score}/100!`;

  if (content.rank) {
    text += ` Ranked #${content.rank}${content.category ? ` in ${content.category}` : ''}.`;
  }

  text += '\n\nSee how AI models perceive your brand:';

  // Twitter has 280 char limit, leave room for URL
  if (text.length > 220) {
    text = `${emoji} ${content.brandName}: ${content.score}/100 AI Perception Score!`;
    if (content.rank) {
      text += ` #${content.rank}${content.category ? ` in ${content.category}` : ''}`;
    }
  }

  return text;
}

/**
 * Generate LinkedIn share text
 */
export function generateLinkedInText(content: ShareContent): string {
  const emoji = getScoreEmoji(content.score);
  const label = getScoreLabel(content.score);

  let text = `${emoji} Proud to share that ${content.brandName} has achieved a ${label} AI Perception Score of ${content.score}/100!\n\n`;

  text += `This score measures how leading AI models (GPT-4, Claude, Gemini, and Perplexity) perceive and recommend our brand.\n\n`;

  if (content.rank && content.category) {
    text += `We're currently ranked #${content.rank} in the ${content.category} category.\n\n`;
  } else if (content.rank) {
    text += `We're currently ranked #${content.rank} overall.\n\n`;
  }

  text += `In the age of AI-powered discovery, brand perception by AI models is becoming as important as SEO.\n\n`;
  text += `Check your brand's AI perception score:`;

  return text;
}

/**
 * Generate plain text for clipboard copy
 */
export function generateCopyText(content: ShareContent): string {
  const label = getScoreLabel(content.score);

  let text = `${content.brandName} - AI Perception Score: ${content.score}/100 (${label})\n\n`;

  if (content.rank && content.category) {
    text += `Rank: #${content.rank} in ${content.category}\n\n`;
  }

  text += `Discover how AI models perceive your brand.`;

  if (content.url) {
    text += `\n\n${content.url}`;
  }

  return text;
}

// ================================================================
// URL GENERATORS
// ================================================================

/**
 * Generate Twitter Web Intent URL
 */
export function generateTwitterShareUrl(content: ShareContent, baseUrl: string): string {
  const text = generateTwitterText(content);
  const url = content.url || baseUrl;

  const params = new URLSearchParams({
    text,
    url,
    hashtags: 'AIPerception,BrandScore',
  });

  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * Generate LinkedIn Share URL
 */
export function generateLinkedInShareUrl(content: ShareContent, baseUrl: string): string {
  const url = content.url || baseUrl;

  const params = new URLSearchParams({
    url,
    source: 'AI Perception',
  });

  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate all share URLs
 */
export function generateShareUrls(content: ShareContent, baseUrl: string): ShareUrls {
  return {
    twitter: generateTwitterShareUrl(content, baseUrl),
    linkedin: generateLinkedInShareUrl(content, baseUrl),
    copy: generateCopyText(content),
  };
}

// ================================================================
// SHARE ACTIONS
// ================================================================

/**
 * Open share dialog in a new window
 */
export function openShareWindow(url: string, width = 600, height = 400): void {
  const left = window.screenX + (window.outerWidth - width) / 2;
  const top = window.screenY + (window.outerHeight - height) / 2;

  window.open(
    url,
    'share',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
  );
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);

    // Fallback for older browsers
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}

// ================================================================
// SHARE TRACKING
// ================================================================

export interface ShareEvent {
  platform: 'twitter' | 'linkedin' | 'copy';
  brandId: string;
  score: number;
  timestamp: Date;
}

/**
 * Track share event (for analytics)
 */
export function trackShareEvent(event: ShareEvent): void {
  // In production, send to analytics
  console.log('Share event:', {
    platform: event.platform,
    brandId: event.brandId,
    score: event.score,
    timestamp: event.timestamp.toISOString(),
  });

  // Could also send to:
  // - PostHog
  // - Google Analytics
  // - Custom analytics endpoint
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateTwitterText,
  generateLinkedInText,
  generateCopyText,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
  generateShareUrls,
  openShareWindow,
  copyToClipboard,
  trackShareEvent,
};
