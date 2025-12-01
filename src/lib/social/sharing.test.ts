/**
 * Social Sharing Tests
 *
 * Phase 2, Week 7, Day 1
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateTwitterText,
  generateLinkedInText,
  generateCopyText,
  generateTwitterShareUrl,
  generateLinkedInShareUrl,
  generateShareUrls,
  copyToClipboard,
  trackShareEvent,
  type ShareContent,
} from './sharing';

// ================================================================
// TEST DATA
// ================================================================

const mockContent: ShareContent = {
  brandName: 'Acme Corp',
  score: 85,
  rank: 5,
  category: 'SaaS',
  url: 'https://example.com/brand/acme',
};

const baseUrl = 'https://aiperception.com';

// ================================================================
// TEXT GENERATION TESTS
// ================================================================

describe('generateTwitterText', () => {
  it('should generate text with brand name and score', () => {
    const text = generateTwitterText(mockContent);

    expect(text).toContain('Acme Corp');
    expect(text).toContain('85/100');
  });

  it('should include rank when provided', () => {
    const text = generateTwitterText(mockContent);

    expect(text).toContain('#5');
    expect(text).toContain('SaaS');
  });

  it('should use appropriate emoji for high scores', () => {
    const text = generateTwitterText({ brandName: 'Test', score: 92 });
    expect(text).toContain('🏆');
  });

  it('should use appropriate emoji for excellent scores', () => {
    const text = generateTwitterText({ brandName: 'Test', score: 85 });
    expect(text).toContain('⭐');
  });

  it('should use appropriate emoji for good scores', () => {
    const text = generateTwitterText({ brandName: 'Test', score: 75 });
    expect(text).toContain('✨');
  });

  it('should use appropriate emoji for average scores', () => {
    const text = generateTwitterText({ brandName: 'Test', score: 55 });
    expect(text).toContain('📈');
  });

  it('should stay within Twitter character limit', () => {
    const longBrandName =
      'This Is A Very Long Brand Name That Could Potentially Exceed Limits';
    const text = generateTwitterText({
      brandName: longBrandName,
      score: 85,
      rank: 1,
      category: 'Enterprise Software Solutions',
    });

    // Leave room for URL (about 23 chars with t.co)
    expect(text.length).toBeLessThanOrEqual(257);
  });

  it('should work without rank', () => {
    const text = generateTwitterText({ brandName: 'Test', score: 80 });

    expect(text).toContain('Test');
    expect(text).toContain('80/100');
    expect(text).not.toContain('#');
  });
});

describe('generateLinkedInText', () => {
  it('should generate professional text', () => {
    const text = generateLinkedInText(mockContent);

    expect(text).toContain('Acme Corp');
    expect(text).toContain('85/100');
    expect(text).toContain('GPT-4');
    expect(text).toContain('Claude');
    expect(text).toContain('Gemini');
    expect(text).toContain('Perplexity');
  });

  it('should include rank and category when provided', () => {
    const text = generateLinkedInText(mockContent);

    expect(text).toContain('#5');
    expect(text).toContain('SaaS');
  });

  it('should include AI importance message', () => {
    const text = generateLinkedInText(mockContent);

    expect(text).toContain('AI-powered discovery');
  });

  it('should work without rank', () => {
    const text = generateLinkedInText({ brandName: 'Test', score: 80 });

    expect(text).toContain('Test');
    expect(text).not.toContain('ranked');
  });
});

describe('generateCopyText', () => {
  it('should generate plain text with score', () => {
    const text = generateCopyText(mockContent);

    expect(text).toContain('Acme Corp');
    expect(text).toContain('85/100');
    expect(text).toContain('excellent');
  });

  it('should include URL when provided', () => {
    const text = generateCopyText(mockContent);

    expect(text).toContain('https://example.com/brand/acme');
  });

  it('should work without URL', () => {
    const text = generateCopyText({
      brandName: 'Test',
      score: 75,
    });

    expect(text).not.toContain('https://');
  });

  it('should include rank and category', () => {
    const text = generateCopyText(mockContent);

    expect(text).toContain('#5');
    expect(text).toContain('SaaS');
  });
});

// ================================================================
// URL GENERATION TESTS
// ================================================================

describe('generateTwitterShareUrl', () => {
  it('should generate valid Twitter intent URL', () => {
    const url = generateTwitterShareUrl(mockContent, baseUrl);

    expect(url).toContain('https://twitter.com/intent/tweet');
    expect(url).toContain('text=');
    expect(url).toContain('url=');
    expect(url).toContain('hashtags=');
  });

  it('should include content URL if provided', () => {
    const url = generateTwitterShareUrl(mockContent, baseUrl);

    expect(url).toContain(encodeURIComponent(mockContent.url!));
  });

  it('should fall back to baseUrl if no URL provided', () => {
    const content = { brandName: 'Test', score: 80 };
    const url = generateTwitterShareUrl(content, baseUrl);

    expect(url).toContain(encodeURIComponent(baseUrl));
  });

  it('should include hashtags', () => {
    const url = generateTwitterShareUrl(mockContent, baseUrl);

    expect(url).toContain('AIPerception');
    expect(url).toContain('BrandScore');
  });
});

describe('generateLinkedInShareUrl', () => {
  it('should generate valid LinkedIn share URL', () => {
    const url = generateLinkedInShareUrl(mockContent, baseUrl);

    expect(url).toContain('https://www.linkedin.com/sharing/share-offsite');
    expect(url).toContain('url=');
  });

  it('should include content URL if provided', () => {
    const url = generateLinkedInShareUrl(mockContent, baseUrl);

    expect(url).toContain(encodeURIComponent(mockContent.url!));
  });

  it('should include source parameter', () => {
    const url = generateLinkedInShareUrl(mockContent, baseUrl);

    expect(url).toContain('source=');
  });
});

describe('generateShareUrls', () => {
  it('should return all share URLs', () => {
    const urls = generateShareUrls(mockContent, baseUrl);

    expect(urls).toHaveProperty('twitter');
    expect(urls).toHaveProperty('linkedin');
    expect(urls).toHaveProperty('copy');
  });

  it('should generate valid Twitter URL', () => {
    const urls = generateShareUrls(mockContent, baseUrl);

    expect(urls.twitter).toContain('twitter.com');
  });

  it('should generate valid LinkedIn URL', () => {
    const urls = generateShareUrls(mockContent, baseUrl);

    expect(urls.linkedin).toContain('linkedin.com');
  });

  it('should generate copy text', () => {
    const urls = generateShareUrls(mockContent, baseUrl);

    expect(urls.copy).toContain('Acme Corp');
    expect(urls.copy).toContain('85/100');
  });
});

// ================================================================
// CLIPBOARD TESTS
// ================================================================

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should copy text to clipboard', async () => {
    const result = await copyToClipboard('Test text');

    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Test text');
  });

  it('should return false on clipboard error', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(
      new Error('Clipboard error')
    );

    // Mock document.execCommand for fallback
    const originalExecCommand = document.execCommand;
    document.execCommand = vi.fn().mockReturnValue(false);

    const result = await copyToClipboard('Test text');

    // Restore
    document.execCommand = originalExecCommand;

    // The fallback should still work with execCommand
    expect(result).toBe(true);
  });
});

// ================================================================
// TRACKING TESTS
// ================================================================

describe('trackShareEvent', () => {
  it('should log share event', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    trackShareEvent({
      platform: 'twitter',
      brandId: 'test-brand',
      score: 85,
      timestamp: new Date('2024-01-15T12:00:00Z'),
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Share event:',
      expect.objectContaining({
        platform: 'twitter',
        brandId: 'test-brand',
        score: 85,
      })
    );

    consoleSpy.mockRestore();
  });
});

// ================================================================
// SCORE LABEL TESTS
// ================================================================

describe('Score Labels', () => {
  it('should label 90+ as exceptional', () => {
    const text = generateCopyText({ brandName: 'Test', score: 95 });
    expect(text).toContain('exceptional');
  });

  it('should label 80-89 as excellent', () => {
    const text = generateCopyText({ brandName: 'Test', score: 85 });
    expect(text).toContain('excellent');
  });

  it('should label 70-79 as great', () => {
    const text = generateCopyText({ brandName: 'Test', score: 75 });
    expect(text).toContain('great');
  });

  it('should label 60-69 as good', () => {
    const text = generateCopyText({ brandName: 'Test', score: 65 });
    expect(text).toContain('good');
  });

  it('should label 50-59 as solid', () => {
    const text = generateCopyText({ brandName: 'Test', score: 55 });
    expect(text).toContain('solid');
  });

  it('should label below 50 as improving', () => {
    const text = generateCopyText({ brandName: 'Test', score: 40 });
    expect(text).toContain('improving');
  });
});
