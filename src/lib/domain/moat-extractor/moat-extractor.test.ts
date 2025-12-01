/**
 * Tests for Moat Extractor Module
 */

import { describe, it, expect } from 'vitest';
import {
  extractMoats,
  extractMoatsFromText,
  getMoatCategory,
  getAllMoatCategories,
  getRelevantMoatCategories,
  compareMoats,
  MOAT_CATEGORIES,
  MoatCategory,
  ExtractionInput
} from './index';

describe('Moat Extractor Module', () => {
  // ================================================================
  // MOAT CATEGORY TESTS
  // ================================================================

  describe('Moat Categories', () => {
    it('should have 10 moat categories defined', () => {
      const categories = getAllMoatCategories();
      expect(categories.length).toBe(10);
    });

    it('should have all expected categories', () => {
      const categories = getAllMoatCategories();
      const expected: MoatCategory[] = [
        'network-effects', 'switching-costs', 'cost-advantages',
        'intangible-assets', 'efficient-scale', 'data-moat',
        'technology', 'brand', 'regulatory', 'ecosystem'
      ];
      expected.forEach(cat => {
        expect(categories).toContain(cat);
      });
    });

    it('should have valid structure for each category', () => {
      const categories = getAllMoatCategories();
      categories.forEach(cat => {
        const data = getMoatCategory(cat);
        expect(data.name).toBeTruthy();
        expect(data.description).toBeTruthy();
        expect(data.examples.length).toBeGreaterThan(0);
        expect(Object.keys(data.industryRelevance).length).toBeGreaterThan(0);
      });
    });

    it('should have industry relevance scores between 0 and 1', () => {
      const categories = getAllMoatCategories();
      categories.forEach(cat => {
        const data = getMoatCategory(cat);
        Object.values(data.industryRelevance).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        });
      });
    });
  });

  // ================================================================
  // TEXT EXTRACTION TESTS
  // ================================================================

  describe('Text-Based Extraction', () => {
    it('should extract network effects moat', () => {
      const text = 'Our marketplace connects buyers and sellers, creating network effects';
      const moats = extractMoatsFromText(text, 'ecommerce');
      expect(moats.some(m => m.category === 'network-effects')).toBe(true);
    });

    it('should extract switching costs moat', () => {
      const text = 'Deep integration with existing workflows makes data migration difficult';
      const moats = extractMoatsFromText(text, 'saas');
      expect(moats.some(m => m.category === 'switching-costs')).toBe(true);
    });

    it('should extract data moat', () => {
      const text = 'Our AI and machine learning models are trained on proprietary data';
      const moats = extractMoatsFromText(text, 'saas');
      expect(moats.some(m => m.category === 'data-moat')).toBe(true);
    });

    it('should extract brand moat', () => {
      const text = 'As a trusted leader with an established reputation';
      const moats = extractMoatsFromText(text, 'fintech');
      expect(moats.some(m => m.category === 'brand')).toBe(true);
    });

    it('should extract regulatory moat', () => {
      const text = 'FDA approved and HIPAA compliant platform';
      const moats = extractMoatsFromText(text, 'healthcare');
      expect(moats.some(m => m.category === 'regulatory')).toBe(true);
    });

    it('should extract ecosystem moat', () => {
      const text = 'Our ecosystem includes an app store with partner integrations';
      const moats = extractMoatsFromText(text, 'saas');
      expect(moats.some(m => m.category === 'ecosystem')).toBe(true);
    });

    it('should return strength indicators', () => {
      const text = 'Our marketplace creates strong network effects with viral growth';
      const moats = extractMoatsFromText(text, 'ecommerce');
      const networkMoat = moats.find(m => m.category === 'network-effects');
      expect(networkMoat).toBeDefined();
      expect(['strong', 'moderate', 'weak', 'potential']).toContain(networkMoat?.strength);
    });

    it('should return empty for text without moat signals', () => {
      const text = 'We sell products online';
      const moats = extractMoatsFromText(text, 'ecommerce');
      expect(moats.length).toBe(0);
    });
  });

  // ================================================================
  // STRUCTURED EXTRACTION TESTS
  // ================================================================

  describe('Structured Extraction', () => {
    it('should extract moats from customer count', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 100000
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'network-effects')).toBe(true);
    });

    it('should extract moats from integrations', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        integrations: 200
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'switching-costs')).toBe(true);
    });

    it('should extract moats from API availability', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        apiAvailable: true
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'switching-costs')).toBe(true);
    });

    it('should extract moats from data advantage', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'marketing',
        dataAdvantage: true
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'data-moat')).toBe(true);
    });

    it('should extract moats from patents', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'healthcare',
        patents: 50
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'intangible-assets')).toBe(true);
    });

    it('should extract moats from brand recognition', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'fintech',
        brandRecognition: 'high'
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'brand')).toBe(true);
    });

    it('should extract moats from regulatory approvals', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'healthcare',
        regulatoryApprovals: ['HIPAA', 'SOC 2', 'HITRUST']
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'regulatory')).toBe(true);
    });

    it('should extract moats from market share', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        marketShare: 45
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'efficient-scale')).toBe(true);
    });

    it('should extract moats from years in business', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'legal',
        yearsInBusiness: 25
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.some(m => m.category === 'brand')).toBe(true);
    });
  });

  // ================================================================
  // ANALYSIS OUTPUT TESTS
  // ================================================================

  describe('Analysis Output', () => {
    it('should calculate overall moat score', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 100000,
        integrations: 200,
        dataAdvantage: true
      };
      const analysis = extractMoats(input);
      expect(analysis.overallMoatScore).toBeGreaterThan(0);
      expect(analysis.overallMoatScore).toBeLessThanOrEqual(100);
    });

    it('should identify weaknesses', () => {
      const input: ExtractionInput = {
        brandName: 'NewStartup',
        industrySlug: 'saas',
        yearsInBusiness: 1
      };
      const analysis = extractMoats(input);
      expect(analysis.weaknesses.length).toBeGreaterThan(0);
    });

    it('should determine competitive position', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 500000,
        integrations: 500,
        marketShare: 60,
        brandRecognition: 'high'
      };
      const analysis = extractMoats(input);
      expect(['dominant', 'strong', 'moderate', 'weak', 'vulnerable']).toContain(analysis.competitivePosition);
    });

    it('should provide sustainability outlook', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 100000
      };
      const analysis = extractMoats(input);
      expect(analysis.sustainabilityOutlook).toBeTruthy();
      expect(analysis.sustainabilityOutlook.length).toBeGreaterThan(20);
    });

    it('should provide recommendations', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas'
      };
      const analysis = extractMoats(input);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // INDUSTRY RELEVANCE TESTS
  // ================================================================

  describe('Industry Relevance', () => {
    it('should return relevant moat categories for SaaS', () => {
      const relevant = getRelevantMoatCategories('saas');
      expect(relevant).toContain('switching-costs');
      expect(relevant).toContain('technology');
      expect(relevant).toContain('ecosystem');
    });

    it('should return relevant moat categories for Fintech', () => {
      const relevant = getRelevantMoatCategories('fintech');
      expect(relevant).toContain('regulatory');
      expect(relevant).toContain('data-moat');
    });

    it('should return relevant moat categories for Healthcare', () => {
      const relevant = getRelevantMoatCategories('healthcare');
      expect(relevant).toContain('regulatory');
      expect(relevant).toContain('intangible-assets');
    });

    it('should return relevant moat categories for E-commerce', () => {
      const relevant = getRelevantMoatCategories('ecommerce');
      expect(relevant).toContain('network-effects');
      expect(relevant).toContain('cost-advantages');
    });

    it('should sort by relevance', () => {
      const relevant = getRelevantMoatCategories('saas');
      const relevanceScores = relevant.map(cat =>
        MOAT_CATEGORIES[cat].industryRelevance['saas'] || 0
      );
      for (let i = 1; i < relevanceScores.length; i++) {
        expect(relevanceScores[i - 1]).toBeGreaterThanOrEqual(relevanceScores[i]);
      }
    });
  });

  // ================================================================
  // MOAT COMPARISON TESTS
  // ================================================================

  describe('Moat Comparison', () => {
    it('should compare two brands', () => {
      const analysis1 = extractMoats({
        brandName: 'Brand A',
        industrySlug: 'saas',
        customerCount: 200000,
        integrations: 300,
        brandRecognition: 'high'
      });

      const analysis2 = extractMoats({
        brandName: 'Brand B',
        industrySlug: 'saas',
        customerCount: 50000,
        integrations: 100
      });

      const comparison = compareMoats(analysis1, analysis2);

      expect(comparison.leader).toBeTruthy();
      expect(comparison.comparison.length).toBeGreaterThan(0);
      expect(comparison.summary).toBeTruthy();
    });

    it('should identify the leader correctly', () => {
      const strongBrand = extractMoats({
        brandName: 'Strong Brand',
        industrySlug: 'saas',
        customerCount: 500000,
        integrations: 500,
        marketShare: 50,
        dataAdvantage: true,
        brandRecognition: 'high'
      });

      const weakBrand = extractMoats({
        brandName: 'Weak Brand',
        industrySlug: 'saas',
        yearsInBusiness: 2
      });

      const comparison = compareMoats(strongBrand, weakBrand);
      expect(comparison.leader).toBe('Strong Brand');
    });

    it('should provide category-by-category comparison', () => {
      const brand1 = extractMoats({
        brandName: 'Brand 1',
        industrySlug: 'saas',
        dataAdvantage: true
      });

      const brand2 = extractMoats({
        brandName: 'Brand 2',
        industrySlug: 'saas',
        integrations: 200
      });

      const comparison = compareMoats(brand1, brand2);

      const dataMoatComparison = comparison.comparison.find(c => c.category === 'data-moat');
      const switchingCostComparison = comparison.comparison.find(c => c.category === 'switching-costs');

      expect(dataMoatComparison?.brand1Strength).not.toBeNull();
      expect(switchingCostComparison?.brand2Strength).not.toBeNull();
    });
  });

  // ================================================================
  // MOAT STRENGTH TESTS
  // ================================================================

  describe('Moat Strength Classification', () => {
    it('should classify strong moats correctly', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 500000 // Very large
      };
      const analysis = extractMoats(input);
      const networkMoat = analysis.moats.find(m => m.category === 'network-effects');
      expect(networkMoat?.strength).toBe('strong');
    });

    it('should classify moderate moats correctly', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 60000 // Medium-large
      };
      const analysis = extractMoats(input);
      const networkMoat = analysis.moats.find(m => m.category === 'network-effects');
      expect(networkMoat?.strength).toBe('moderate');
    });

    it('should classify weak moats correctly', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 15000 // Smaller
      };
      const analysis = extractMoats(input);
      const networkMoat = analysis.moats.find(m => m.category === 'network-effects');
      expect(networkMoat?.strength).toBe('weak');
    });
  });

  // ================================================================
  // EDGE CASE TESTS
  // ================================================================

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas'
      };
      const analysis = extractMoats(input);
      expect(analysis.brandName).toBe('TestCo');
      expect(analysis.industrySlug).toBe('saas');
      expect(analysis.moats).toBeDefined();
    });

    it('should handle unknown industry', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'unknown-industry',
        customerCount: 100000
      };
      const analysis = extractMoats(input);
      expect(analysis.overallMoatScore).toBeGreaterThan(0);
    });

    it('should handle combined text and structured input', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        description: 'Our AI-powered platform creates network effects',
        customerCount: 100000,
        integrations: 200
      };
      const analysis = extractMoats(input);
      expect(analysis.moats.length).toBeGreaterThanOrEqual(2);
    });

    it('should not duplicate moat categories', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        description: 'Marketplace with strong network effects',
        customerCount: 100000
      };
      const analysis = extractMoats(input);
      const categories = analysis.moats.map(m => m.category);
      const uniqueCategories = new Set(categories);
      expect(categories.length).toBe(uniqueCategories.size);
    });
  });

  // ================================================================
  // DURABILITY TESTS
  // ================================================================

  describe('Moat Durability', () => {
    it('should assign long-term durability to strong moats', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 500000
      };
      const analysis = extractMoats(input);
      const strongMoat = analysis.moats.find(m => m.strength === 'strong');
      expect(strongMoat?.durability).toBe('long-term');
    });

    it('should include threats for each moat', () => {
      const input: ExtractionInput = {
        brandName: 'TestCo',
        industrySlug: 'saas',
        customerCount: 100000,
        integrations: 200
      };
      const analysis = extractMoats(input);
      analysis.moats.forEach(moat => {
        expect(moat.threats.length).toBeGreaterThan(0);
      });
    });
  });
});
