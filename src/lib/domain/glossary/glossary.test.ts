/**
 * Tests for Domain Glossary Module
 */

import { describe, it, expect } from 'vitest';
import {
  getAllTerms,
  getTermsByIndustry,
  getTermsByCategory,
  getTermsByImportance,
  getCriticalTerms,
  resolveTerm,
  searchTerms,
  getRelatedTerms,
  buildTermContext,
  getGlossaryStats,
  hasTerm,
  getGlossaryIndustries,
  getCategories,
  GLOSSARY_TERMS,
  GlossaryTerm,
  TermCategory
} from './index';

describe('Domain Glossary Module', () => {
  // ================================================================
  // DATA STRUCTURE TESTS
  // ================================================================

  describe('Glossary Data Structure', () => {
    it('should have at least 100 terms', () => {
      const terms = getAllTerms();
      expect(terms.length).toBeGreaterThanOrEqual(100);
    });

    it('should have valid structure for each term', () => {
      const terms = getAllTerms();
      terms.forEach(term => {
        expect(term.term).toBeTruthy();
        expect(term.definition).toBeTruthy();
        expect(term.definition.length).toBeGreaterThan(20);
        expect(term.category).toBeTruthy();
        expect(term.importanceLevel).toBeTruthy();
      });
    });

    it('should have terms across all 10 priority industries', () => {
      const industries = getGlossaryIndustries();
      const expectedIndustries = [
        'saas', 'fintech', 'healthcare', 'ecommerce', 'marketing',
        'real-estate', 'legal', 'education', 'hospitality', 'restaurant'
      ];

      expectedIndustries.forEach(industry => {
        expect(industries).toContain(industry);
      });
    });

    it('should have at least 8 terms per industry', () => {
      const industries = getGlossaryIndustries();
      industries.forEach(industry => {
        const terms = getTermsByIndustry(industry).filter(
          t => t.industrySlug === industry
        );
        expect(terms.length).toBeGreaterThanOrEqual(8);
      });
    });

    it('should have cross-industry terms', () => {
      const terms = getAllTerms().filter(t => t.industrySlug === null);
      expect(terms.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // CATEGORY TESTS
  // ================================================================

  describe('Term Categories', () => {
    it('should have terms in all main categories', () => {
      const expectedCategories: TermCategory[] = [
        'metric', 'regulation', 'technology', 'process',
        'certification', 'pricing'
      ];

      expectedCategories.forEach(category => {
        const terms = getTermsByCategory(category);
        expect(terms.length).toBeGreaterThan(0);
      });
    });

    it('should return correct terms for metric category', () => {
      const metrics = getTermsByCategory('metric');
      expect(metrics.some(t => t.term === 'MRR')).toBe(true);
      expect(metrics.some(t => t.term === 'Conversion Rate')).toBe(true);
    });

    it('should return correct terms for regulation category', () => {
      const regulations = getTermsByCategory('regulation');
      expect(regulations.some(t => t.term === 'HIPAA')).toBe(true);
      expect(regulations.some(t => t.term === 'PCI-DSS')).toBe(true);
    });
  });

  // ================================================================
  // IMPORTANCE LEVEL TESTS
  // ================================================================

  describe('Importance Levels', () => {
    it('should have critical terms', () => {
      const critical = getTermsByImportance('critical');
      expect(critical.length).toBeGreaterThan(10);
    });

    it('should have high importance terms', () => {
      const high = getTermsByImportance('high');
      expect(high.length).toBeGreaterThan(10);
    });

    it('should filter by industry when specified', () => {
      const saasHigh = getTermsByImportance('high', 'saas');
      saasHigh.forEach(term => {
        expect(term.industrySlug === 'saas' || term.industrySlug === null).toBe(true);
      });
    });

    it('should get critical terms for industry', () => {
      const criticalSaas = getCriticalTerms('saas');
      expect(criticalSaas.length).toBeGreaterThan(0);
      criticalSaas.forEach(term => {
        expect(['critical', 'high']).toContain(term.importanceLevel);
      });
    });
  });

  // ================================================================
  // TERM RESOLUTION TESTS
  // ================================================================

  describe('Term Resolution', () => {
    it('should resolve exact term match', () => {
      const match = resolveTerm('MRR');
      expect(match).not.toBeNull();
      expect(match?.term.term).toBe('MRR');
      expect(match?.confidence).toBe(1.0);
      expect(match?.matchType).toBe('exact');
    });

    it('should resolve term case-insensitively', () => {
      const match = resolveTerm('mrr');
      expect(match).not.toBeNull();
      expect(match?.term.term).toBe('MRR');
    });

    it('should resolve by alias', () => {
      const match = resolveTerm('monthly recurring revenue');
      expect(match).not.toBeNull();
      expect(match?.term.term).toBe('MRR');
      // 'monthly recurring revenue' is the acronym expansion, so matchType could be 'acronym'
      expect(['alias', 'acronym']).toContain(match?.matchType);
    });

    it('should resolve by acronym expansion', () => {
      const match = resolveTerm('Monthly Recurring Revenue');
      expect(match).not.toBeNull();
      expect(match?.term.term).toBe('MRR');
    });

    it('should return null for unknown term', () => {
      const match = resolveTerm('xyznonexistent');
      expect(match).toBeNull();
    });

    it('should filter by industry when specified', () => {
      // HIPAA is healthcare-specific
      const match = resolveTerm('HIPAA', 'healthcare');
      expect(match).not.toBeNull();

      // When searching in wrong industry, should still find cross-industry or return null
      const matchWrongIndustry = resolveTerm('HIPAA', 'saas');
      // HIPAA is healthcare-specific, so should be null for saas
      expect(matchWrongIndustry).toBeNull();
    });
  });

  // ================================================================
  // SEARCH TESTS
  // ================================================================

  describe('Term Search', () => {
    it('should find terms by partial match', () => {
      const results = searchTerms('revenue');
      expect(results.length).toBeGreaterThan(0);
      // Should find terms containing 'revenue' in term name OR definition
      expect(results.some(r =>
        r.term.term.toLowerCase().includes('revenue') ||
        r.term.definition.toLowerCase().includes('revenue')
      )).toBe(true);
    });

    it('should rank exact matches higher', () => {
      const results = searchTerms('MRR');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].term.term).toBe('MRR');
      expect(results[0].confidence).toBe(1.0);
    });

    it('should filter by industry', () => {
      const results = searchTerms('rate', { industrySlug: 'fintech' });
      results.forEach(r => {
        expect(r.term.industrySlug === 'fintech' || r.term.industrySlug === null).toBe(true);
      });
    });

    it('should filter by category', () => {
      const results = searchTerms('cost', { category: 'metric' });
      results.forEach(r => {
        expect(r.term.category).toBe('metric');
      });
    });

    it('should respect limit', () => {
      const results = searchTerms('a', { limit: 5 });
      expect(results.length).toBeLessThanOrEqual(5);
    });
  });

  // ================================================================
  // RELATED TERMS TESTS
  // ================================================================

  describe('Related Terms', () => {
    it('should get related terms for MRR', () => {
      const related = getRelatedTerms('MRR');
      expect(related.length).toBeGreaterThan(0);
      expect(related.some(t => t.term === 'ARR')).toBe(true);
    });

    it('should return empty array for term without relations', () => {
      const related = getRelatedTerms('nonexistent');
      expect(related).toEqual([]);
    });
  });

  // ================================================================
  // CONTEXT BUILDING TESTS
  // ================================================================

  describe('Context Building', () => {
    it('should build term context for industry', () => {
      const context = buildTermContext('saas');
      expect(context).toContain('Key Industry Terms');
      expect(context).toContain('MRR');
    });

    it('should include definitions when specified', () => {
      const context = buildTermContext('healthcare', { includeDefinitions: true });
      expect(context).toContain('HIPAA');
      expect(context).toContain(':'); // Definition separator
    });

    it('should exclude definitions when specified', () => {
      const context = buildTermContext('fintech', { includeDefinitions: false });
      expect(context).toContain('- '); // Term without definition
    });

    it('should respect maxTerms limit', () => {
      const context = buildTermContext('marketing', { maxTerms: 3 });
      const termCount = (context.match(/^- /gm) || []).length;
      expect(termCount).toBeLessThanOrEqual(3);
    });

    it('should return empty string for unknown industry', () => {
      const context = buildTermContext('nonexistent');
      // Should return empty or minimal as no terms match
      expect(context.split('\n').filter(l => l.startsWith('- ')).length).toBeLessThanOrEqual(1);
    });
  });

  // ================================================================
  // STATISTICS TESTS
  // ================================================================

  describe('Glossary Statistics', () => {
    it('should return correct total terms', () => {
      const stats = getGlossaryStats();
      expect(stats.totalTerms).toBe(GLOSSARY_TERMS.length);
    });

    it('should have terms by industry', () => {
      const stats = getGlossaryStats();
      expect(Object.keys(stats.byIndustry).length).toBeGreaterThan(0);
      expect(stats.byIndustry['saas']).toBeGreaterThan(0);
    });

    it('should have terms by category', () => {
      const stats = getGlossaryStats();
      expect(Object.keys(stats.byCategory).length).toBeGreaterThan(0);
      expect(stats.byCategory['metric']).toBeGreaterThan(0);
    });

    it('should have terms by importance', () => {
      const stats = getGlossaryStats();
      expect(stats.byImportance['critical']).toBeGreaterThan(0);
      expect(stats.byImportance['high']).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // UTILITY FUNCTION TESTS
  // ================================================================

  describe('Utility Functions', () => {
    it('hasTerm should return true for existing term', () => {
      expect(hasTerm('MRR')).toBe(true);
      expect(hasTerm('HIPAA')).toBe(true);
      expect(hasTerm('conversion rate')).toBe(true);
    });

    it('hasTerm should return false for non-existing term', () => {
      expect(hasTerm('xyznonexistent')).toBe(false);
    });

    it('getGlossaryIndustries should return industry list', () => {
      const industries = getGlossaryIndustries();
      expect(industries.length).toBeGreaterThanOrEqual(10);
      expect(industries).not.toContain('cross-industry');
    });

    it('getCategories should return category list', () => {
      const categories = getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories).toContain('metric');
      expect(categories).toContain('regulation');
    });
  });

  // ================================================================
  // CONTENT QUALITY TESTS
  // ================================================================

  describe('Content Quality', () => {
    it('should have meaningful definitions', () => {
      const terms = getAllTerms();
      terms.forEach(term => {
        expect(term.definition.length).toBeGreaterThan(50);
      });
    });

    it('should have short definitions for most terms', () => {
      const terms = getAllTerms();
      const withShortDef = terms.filter(t => t.shortDefinition);
      expect(withShortDef.length / terms.length).toBeGreaterThan(0.9);
    });

    it('should have aliases for acronym terms', () => {
      const acronymTerms = getAllTerms().filter(t => t.acronym);
      acronymTerms.forEach(term => {
        expect(term.aliases?.length).toBeGreaterThan(0);
      });
    });

    it('should have related terms for critical metrics', () => {
      const criticalMetrics = getTermsByCategory('metric')
        .filter(t => t.importanceLevel === 'critical');

      criticalMetrics.forEach(term => {
        expect(term.relatedTerms?.length).toBeGreaterThan(0);
      });
    });
  });

  // ================================================================
  // INDUSTRY-SPECIFIC TESTS
  // ================================================================

  describe('Industry-Specific Content', () => {
    it('SaaS terms should include key metrics', () => {
      const saasTerms = getTermsByIndustry('saas');
      const termNames = saasTerms.map(t => t.term);
      expect(termNames).toContain('MRR');
      expect(termNames).toContain('ARR');
      expect(termNames).toContain('Churn Rate');
    });

    it('Fintech terms should include compliance terms', () => {
      const fintechTerms = getTermsByIndustry('fintech');
      const termNames = fintechTerms.map(t => t.term);
      expect(termNames).toContain('KYC');
      expect(termNames).toContain('AML');
      expect(termNames).toContain('PCI-DSS');
    });

    it('Healthcare terms should include HIPAA-related', () => {
      const healthcareTerms = getTermsByIndustry('healthcare');
      const termNames = healthcareTerms.map(t => t.term);
      expect(termNames).toContain('HIPAA');
      expect(termNames).toContain('PHI');
      expect(termNames).toContain('EHR');
    });

    it('Real Estate terms should include property metrics', () => {
      const realEstateTerms = getTermsByIndustry('real-estate');
      const termNames = realEstateTerms.map(t => t.term);
      expect(termNames).toContain('Cap Rate');
      expect(termNames).toContain('NOI');
      expect(termNames).toContain('MLS');
    });

    it('Restaurant terms should include operational metrics', () => {
      const restaurantTerms = getTermsByIndustry('restaurant');
      const termNames = restaurantTerms.map(t => t.term);
      expect(termNames).toContain('Food Cost Percentage');
      expect(termNames).toContain('Table Turnover');
    });
  });
});
