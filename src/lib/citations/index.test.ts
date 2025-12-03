/**
 * Citation Source Tracking Module Tests
 *
 * Phase 2, Week 3, Day 4
 */

import { describe, it, expect } from 'vitest';
import {
  extractCitations,
  compareCitationResults,
  type CitationTrackingResult,
} from './index';

describe('Citation Source Tracking', () => {
  describe('extractCitations', () => {
    it('should extract URL citations', () => {
      const text = `
        According to https://en.wikipedia.org/wiki/Example, this is true.
        For more info, see https://www.nytimes.com/article.
        Visit https://example.com for details.
      `;

      const result = extractCitations(text);

      expect(result.citations.length).toBeGreaterThan(0);
      expect(result.citations.some(c => c.url?.includes('wikipedia'))).toBe(true);
      expect(result.citations.some(c => c.url?.includes('nytimes'))).toBe(true);
    });

    it('should classify source types correctly', () => {
      const text = `
        Wikipedia: https://en.wikipedia.org/wiki/Test
        News: https://www.reuters.com/article
        Academic: https://arxiv.org/paper
        Review: https://www.g2.com/products/test
      `;

      const result = extractCitations(text);

      expect(result.bySourceType.wikipedia.length).toBeGreaterThan(0);
      expect(result.bySourceType.news.length).toBeGreaterThan(0);
      expect(result.bySourceType.academic.length).toBeGreaterThan(0);
      expect(result.bySourceType['review-site'].length).toBeGreaterThan(0);
    });

    it('should extract textual citations', () => {
      const text = `
        According to Forbes magazine, the market is growing.
        As reported by TechCrunch, the company raised funding.
        A study by Harvard Business Review shows the trend.
      `;

      const result = extractCitations(text);

      expect(result.citations.length).toBeGreaterThan(0);
      const texts = result.citations.map(c => c.text.toLowerCase());
      expect(texts.some(t => t.includes('forbes') || t.includes('techcrunch'))).toBe(true);
    });

    it('should assess citation quality', () => {
      const text = `
        Source 1: https://en.wikipedia.org/wiki/High_Quality
        Source 2: https://random-blog.com/post
        Source 3: https://www.nature.com/article
      `;

      const result = extractCitations(text);

      expect(result.qualityDistribution.high).toBeGreaterThan(0);
      expect(result.highAuthorityCitations.length).toBeGreaterThan(0);
    });

    it('should identify brand-related citations', () => {
      const text = `
        According to https://forbes.com/mybrand-review, MyBrand is excellent.
        https://techcrunch.com/article mentions other companies.
      `;

      const result = extractCitations(text, { brand: 'MyBrand' });

      expect(result.brandCitations.length).toBeGreaterThan(0);
      expect(result.stats.brandMentionRate).toBeGreaterThan(0);
    });

    it('should identify citation gaps', () => {
      const text = `
        Just a random blog: https://myblog.com/post
        And another: https://medium.com/article
      `;

      const result = extractCitations(text, { brand: 'TestBrand' });

      expect(result.citationGaps.length).toBeGreaterThan(0);

      // Should identify missing high-authority sources
      const wikipediaGap = result.citationGaps.find(g => g.sourceType === 'wikipedia');
      expect(wikipediaGap).toBeDefined();
    });

    it('should calculate statistics', () => {
      const text = `
        https://wikipedia.org/wiki/Test
        https://nytimes.com/article
        https://blog.example.com/post
      `;

      const result = extractCitations(text);

      expect(result.stats.total).toBeGreaterThan(0);
      expect(result.stats.averageQuality).toBeGreaterThanOrEqual(0);
      expect(result.stats.uniqueDomains).toBeGreaterThan(0);
    });

    it('should generate recommendations', () => {
      const text = 'Just a simple text without many citations.';

      const result = extractCitations(text, { brand: 'MyBrand' });

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach(rec => {
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('actionItems');
      });
    });

    it('should respect minConfidence option', () => {
      const text = 'According to some source, this is true.';

      const highConfidence = extractCitations(text, { minConfidence: 0.9 });
      const lowConfidence = extractCitations(text, { minConfidence: 0.1 });

      expect(lowConfidence.citations.length).toBeGreaterThanOrEqual(
        highConfidence.citations.length
      );
    });

    it('should respect maxCitations option', () => {
      const text = `
        https://a.com https://b.com https://c.com
        https://d.com https://e.com https://f.com
        https://g.com https://h.com https://i.com
      `;

      const result = extractCitations(text, { maxCitations: 3 });

      expect(result.citations.length).toBeLessThanOrEqual(3);
    });

    it('should extract context around citations', () => {
      const text = `
        This is excellent! Check https://example.com for the great review.
        The product is highly recommended.
      `;

      const result = extractCitations(text);

      expect(result.citations[0].context).toBeDefined();
      expect(result.citations[0].context.length).toBeGreaterThan(0);
    });

    it('should analyze sentiment in citation context', () => {
      const positiveText = 'Excellent product! https://review.com/great - highly recommended.';
      const negativeText = 'Avoid this! https://review.com/bad - has issues and problems.';

      const positiveResult = extractCitations(positiveText);
      const negativeResult = extractCitations(negativeText);

      if (positiveResult.citations.length > 0) {
        expect(positiveResult.citations[0].sentiment).toBeGreaterThanOrEqual(0);
      }
      if (negativeResult.citations.length > 0) {
        expect(negativeResult.citations[0].sentiment).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('compareCitationResults', () => {
    it('should identify new citations', () => {
      const previous: CitationTrackingResult = {
        brand: 'Test',
        citations: [
          {
            id: '1',
            url: 'https://old.com',
            sourceType: 'blog',
            quality: 'low',
            text: 'old',
            context: '',
            position: 0,
            confidence: 0.8,
            isBrandRelated: false,
            sentiment: 0,
          },
        ],
        bySourceType: { wikipedia: [], news: [], academic: [], blog: [], official: [], 'review-site': [], social: [], government: [], directory: [], forum: [], unknown: [] },
        qualityDistribution: { high: 0, medium: 0, low: 1, unknown: 0 },
        highAuthorityCitations: [],
        brandCitations: [],
        citationGaps: [],
        stats: { total: 1, averageQuality: 0.3, brandMentionRate: 0, uniqueDomains: 1, highAuthorityRatio: 0 },
        recommendations: [],
        analyzedAt: '2024-01-01',
      };

      const current: CitationTrackingResult = {
        brand: 'Test',
        citations: [
          {
            id: '1',
            url: 'https://old.com',
            sourceType: 'blog',
            quality: 'low',
            text: 'old',
            context: '',
            position: 0,
            confidence: 0.8,
            isBrandRelated: false,
            sentiment: 0,
          },
          {
            id: '2',
            url: 'https://new.com',
            sourceType: 'news',
            quality: 'high',
            text: 'new',
            context: '',
            position: 0,
            confidence: 0.9,
            isBrandRelated: true,
            sentiment: 0.5,
          },
        ],
        bySourceType: { wikipedia: [], news: [], academic: [], blog: [], official: [], 'review-site': [], social: [], government: [], directory: [], forum: [], unknown: [] },
        qualityDistribution: { high: 1, medium: 0, low: 1, unknown: 0 },
        highAuthorityCitations: [],
        brandCitations: [],
        citationGaps: [],
        stats: { total: 2, averageQuality: 0.65, brandMentionRate: 0.5, uniqueDomains: 2, highAuthorityRatio: 0.5 },
        recommendations: [],
        analyzedAt: '2024-01-02',
      };

      const comparison = compareCitationResults(previous, current);

      expect(comparison.newCitations.length).toBe(1);
      expect(comparison.newCitations[0].url).toBe('https://new.com');
      expect(comparison.countChange).toBe(1);
      expect(comparison.trend).toBe('improving');
    });

    it('should identify lost citations', () => {
      const previous: CitationTrackingResult = {
        brand: 'Test',
        citations: [
          { id: '1', url: 'https://lost.com', sourceType: 'news', quality: 'high', text: 'lost', context: '', position: 0, confidence: 0.9, isBrandRelated: false, sentiment: 0 },
          { id: '2', url: 'https://kept.com', sourceType: 'news', quality: 'high', text: 'kept', context: '', position: 0, confidence: 0.9, isBrandRelated: false, sentiment: 0 },
        ],
        bySourceType: { wikipedia: [], news: [], academic: [], blog: [], official: [], 'review-site': [], social: [], government: [], directory: [], forum: [], unknown: [] },
        qualityDistribution: { high: 2, medium: 0, low: 0, unknown: 0 },
        highAuthorityCitations: [],
        brandCitations: [],
        citationGaps: [],
        stats: { total: 2, averageQuality: 1, brandMentionRate: 0, uniqueDomains: 2, highAuthorityRatio: 1 },
        recommendations: [],
        analyzedAt: '2024-01-01',
      };

      const current: CitationTrackingResult = {
        brand: 'Test',
        citations: [
          { id: '2', url: 'https://kept.com', sourceType: 'news', quality: 'high', text: 'kept', context: '', position: 0, confidence: 0.9, isBrandRelated: false, sentiment: 0 },
        ],
        bySourceType: { wikipedia: [], news: [], academic: [], blog: [], official: [], 'review-site': [], social: [], government: [], directory: [], forum: [], unknown: [] },
        qualityDistribution: { high: 1, medium: 0, low: 0, unknown: 0 },
        highAuthorityCitations: [],
        brandCitations: [],
        citationGaps: [],
        stats: { total: 1, averageQuality: 1, brandMentionRate: 0, uniqueDomains: 1, highAuthorityRatio: 1 },
        recommendations: [],
        analyzedAt: '2024-01-02',
      };

      const comparison = compareCitationResults(previous, current);

      expect(comparison.lostCitations.length).toBe(1);
      expect(comparison.lostCitations[0].url).toBe('https://lost.com');
      expect(comparison.countChange).toBe(-1);
      expect(comparison.trend).toBe('declining');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = extractCitations('');

      expect(result.citations).toHaveLength(0);
      expect(result.stats.total).toBe(0);
    });

    it('should handle text with no citations', () => {
      const result = extractCitations('Just some plain text without any links.');

      expect(result.citations.length).toBe(0);
    });

    it('should handle malformed URLs gracefully', () => {
      const text = 'Check http:// and https:// and http://. for info.';

      const result = extractCitations(text);

      // Should not crash, may or may not extract these
      expect(result).toBeDefined();
    });

    it('should deduplicate citations', () => {
      const text = `
        https://example.com/page
        https://example.com/page
        https://example.com/page
      `;

      const result = extractCitations(text);

      const uniqueUrls = new Set(result.citations.map(c => c.url));
      expect(result.citations.length).toBe(uniqueUrls.size);
    });
  });
});
