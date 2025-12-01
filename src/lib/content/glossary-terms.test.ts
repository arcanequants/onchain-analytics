/**
 * Glossary Terms Tests
 *
 * Tests for glossary data and helper functions
 * Phase 3, Week 10
 */

import { describe, it, expect } from 'vitest';
import {
  GLOSSARY_TERMS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  getTermsByCategory,
  getTermById,
  searchTerms,
  getRelatedTerms,
  getCategorizedTerms,
  getTermCountByCategory,
} from './glossary-terms';

import type { GlossaryCategory, GlossaryTerm } from './glossary-terms';

describe('Glossary Terms', () => {
  describe('Term Data', () => {
    it('should have at least 30 terms', () => {
      expect(GLOSSARY_TERMS.length).toBeGreaterThanOrEqual(30);
    });

    it('should have 6 core terms', () => {
      const coreTerms = GLOSSARY_TERMS.filter((t) => t.category === 'core');
      expect(coreTerms.length).toBe(6);
    });

    it('should have 8 metrics terms', () => {
      const metricsTerms = GLOSSARY_TERMS.filter((t) => t.category === 'metrics');
      expect(metricsTerms.length).toBe(8);
    });

    it('should have 6 technical terms', () => {
      const technicalTerms = GLOSSARY_TERMS.filter((t) => t.category === 'technical');
      expect(technicalTerms.length).toBe(6);
    });

    it('should have 8 AI/NLP terms', () => {
      const aiNlpTerms = GLOSSARY_TERMS.filter((t) => t.category === 'ai-nlp');
      expect(aiNlpTerms.length).toBe(8);
    });

    it('should have 6 business terms', () => {
      const businessTerms = GLOSSARY_TERMS.filter((t) => t.category === 'business');
      expect(businessTerms.length).toBe(6);
    });

    it('should have unique IDs', () => {
      const ids = GLOSSARY_TERMS.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields for all terms', () => {
      for (const term of GLOSSARY_TERMS) {
        expect(term.id).toBeTruthy();
        expect(term.term).toBeTruthy();
        expect(term.shortDefinition).toBeTruthy();
        expect(term.fullDefinition).toBeTruthy();
        expect(term.icon).toBeTruthy();
        expect(term.category).toBeTruthy();
      }
    });

    it('should have icons that are emoji characters', () => {
      for (const term of GLOSSARY_TERMS) {
        // Icons should be short (emoji)
        expect(term.icon.length).toBeLessThanOrEqual(4);
      }
    });
  });

  describe('Category Labels', () => {
    it('should have labels for all categories', () => {
      const categories: GlossaryCategory[] = ['core', 'metrics', 'technical', 'ai-nlp', 'business'];
      for (const category of categories) {
        expect(CATEGORY_LABELS[category]).toBeTruthy();
        expect(CATEGORY_DESCRIPTIONS[category]).toBeTruthy();
      }
    });
  });

  describe('getTermsByCategory', () => {
    it('should return terms for core category', () => {
      const terms = getTermsByCategory('core');
      expect(terms.length).toBe(6);
      expect(terms.every((t) => t.category === 'core')).toBe(true);
    });

    it('should return terms for metrics category', () => {
      const terms = getTermsByCategory('metrics');
      expect(terms.length).toBe(8);
      expect(terms.every((t) => t.category === 'metrics')).toBe(true);
    });

    it('should return terms for technical category', () => {
      const terms = getTermsByCategory('technical');
      expect(terms.length).toBe(6);
      expect(terms.every((t) => t.category === 'technical')).toBe(true);
    });

    it('should return terms for ai-nlp category', () => {
      const terms = getTermsByCategory('ai-nlp');
      expect(terms.length).toBe(8);
      expect(terms.every((t) => t.category === 'ai-nlp')).toBe(true);
    });

    it('should return terms for business category', () => {
      const terms = getTermsByCategory('business');
      expect(terms.length).toBe(6);
      expect(terms.every((t) => t.category === 'business')).toBe(true);
    });
  });

  describe('getTermById', () => {
    it('should return correct term by ID', () => {
      const term = getTermById('ai-perception-score');
      expect(term).toBeDefined();
      expect(term?.term).toBe('AI Perception Score');
    });

    it('should return undefined for non-existent ID', () => {
      const term = getTermById('non-existent-term');
      expect(term).toBeUndefined();
    });

    it('should find GEO term', () => {
      const term = getTermById('geo');
      expect(term).toBeDefined();
      expect(term?.term).toContain('GEO');
    });

    it('should find hallucination term', () => {
      const term = getTermById('hallucination');
      expect(term).toBeDefined();
      expect(term?.term).toBe('Hallucination');
    });
  });

  describe('searchTerms', () => {
    it('should find terms by term name', () => {
      const results = searchTerms('perception');
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((t) => t.id === 'ai-perception-score')).toBe(true);
    });

    it('should find terms by short definition', () => {
      const results = searchTerms('AI models');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should find terms by full definition', () => {
      const results = searchTerms('ChatGPT');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should be case insensitive', () => {
      const results1 = searchTerms('GEO');
      const results2 = searchTerms('geo');
      expect(results1.length).toBe(results2.length);
    });

    it('should return empty array for no matches', () => {
      const results = searchTerms('xyznonexistent123');
      expect(results).toEqual([]);
    });
  });

  describe('getRelatedTerms', () => {
    it('should return related terms for AI Perception Score', () => {
      const related = getRelatedTerms('ai-perception-score');
      expect(related.length).toBeGreaterThanOrEqual(2);
    });

    it('should return related terms for GEO', () => {
      const related = getRelatedTerms('geo');
      expect(related.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array for non-existent term', () => {
      const related = getRelatedTerms('non-existent');
      expect(related).toEqual([]);
    });

    it('should return only valid terms', () => {
      const related = getRelatedTerms('ai-perception-score');
      for (const term of related) {
        expect(term).toBeDefined();
        expect(term.id).toBeTruthy();
      }
    });
  });

  describe('getCategorizedTerms', () => {
    it('should return all categories', () => {
      const categorized = getCategorizedTerms();
      expect(Object.keys(categorized)).toContain('core');
      expect(Object.keys(categorized)).toContain('metrics');
      expect(Object.keys(categorized)).toContain('technical');
      expect(Object.keys(categorized)).toContain('ai-nlp');
      expect(Object.keys(categorized)).toContain('business');
    });

    it('should have correct term counts', () => {
      const categorized = getCategorizedTerms();
      expect(categorized.core.length).toBe(6);
      expect(categorized.metrics.length).toBe(8);
      expect(categorized.technical.length).toBe(6);
      expect(categorized['ai-nlp'].length).toBe(8);
      expect(categorized.business.length).toBe(6);
    });
  });

  describe('getTermCountByCategory', () => {
    it('should return correct counts', () => {
      const counts = getTermCountByCategory();
      expect(counts.core).toBe(6);
      expect(counts.metrics).toBe(8);
      expect(counts.technical).toBe(6);
      expect(counts['ai-nlp']).toBe(8);
      expect(counts.business).toBe(6);
    });

    it('should sum to total terms', () => {
      const counts = getTermCountByCategory();
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      expect(total).toBe(GLOSSARY_TERMS.length);
    });
  });

  describe('Term Content Quality', () => {
    it('should have short definitions under 100 characters', () => {
      for (const term of GLOSSARY_TERMS) {
        expect(term.shortDefinition.length).toBeLessThanOrEqual(100);
      }
    });

    it('should have full definitions over 100 characters', () => {
      for (const term of GLOSSARY_TERMS) {
        expect(term.fullDefinition.length).toBeGreaterThan(100);
      }
    });

    it('should have at least 2 related terms for core terms', () => {
      const coreTerms = getTermsByCategory('core');
      for (const term of coreTerms) {
        expect(term.relatedTerms?.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should have examples for core terms', () => {
      const coreTerms = getTermsByCategory('core');
      for (const term of coreTerms) {
        expect(term.examples?.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Key Terms Validation', () => {
    it('should have AI Perception Score as first term', () => {
      const coreTerms = getTermsByCategory('core');
      expect(coreTerms[0].id).toBe('ai-perception-score');
    });

    it('should have GEO term', () => {
      const term = getTermById('geo');
      expect(term?.term).toContain('GEO');
      expect(term?.term).toContain('Generative Engine Optimization');
    });

    it('should have Share of Voice term', () => {
      const term = getTermById('share-of-voice');
      expect(term?.term).toContain('Share of Voice');
      expect(term?.shortDefinition).toContain('competitor');
    });

    it('should have E-E-A-T term', () => {
      const term = getTermById('eeat');
      expect(term?.term).toContain('E-E-A-T');
      expect(term?.fullDefinition).toContain('Experience');
      expect(term?.fullDefinition).toContain('Expertise');
      expect(term?.fullDefinition).toContain('Authoritativeness');
      expect(term?.fullDefinition).toContain('Trust');
    });

    it('should have Hallucination term', () => {
      const term = getTermById('hallucination');
      expect(term?.term).toBe('Hallucination');
      expect(term?.shortDefinition).toContain('incorrect');
    });

    it('should have Knowledge Graph term', () => {
      const term = getTermById('knowledge-graph');
      expect(term?.term).toContain('Knowledge Graph');
      expect(term?.fullDefinition).toContain('Wikidata');
    });
  });
});
