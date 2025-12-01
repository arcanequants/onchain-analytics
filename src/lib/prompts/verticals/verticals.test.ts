/**
 * Tests for Vertical-Specific Prompt Library
 */

import { describe, it, expect } from 'vitest';
import {
  VERTICAL_PROMPTS,
  getVerticalPrompt,
  buildVerticalSystemPrompt,
  getIndustryKeyTerms,
  getEvaluationCriteria,
  getRegulatoryContext,
  getExampleQueries,
  getFewShotExamples,
  hasVerticalPrompt,
  getSupportedIndustries,
  VerticalPrompt,
  VerticalPromptVariables
} from './index';

describe('Vertical-Specific Prompt Library', () => {
  // ================================================================
  // STRUCTURE TESTS
  // ================================================================

  describe('VERTICAL_PROMPTS structure', () => {
    it('should have exactly 10 priority industries', () => {
      const industries = Object.keys(VERTICAL_PROMPTS);
      expect(industries).toHaveLength(10);
    });

    it('should include all priority industries', () => {
      const expectedIndustries = [
        'saas',
        'fintech',
        'healthcare',
        'ecommerce',
        'marketing',
        'real-estate',
        'legal',
        'education',
        'hospitality',
        'restaurant'
      ];

      expectedIndustries.forEach(industry => {
        expect(VERTICAL_PROMPTS).toHaveProperty(industry);
      });
    });

    it('should have valid structure for each vertical', () => {
      Object.entries(VERTICAL_PROMPTS).forEach(([id, vertical]) => {
        expect(vertical.industryId).toBe(id);
        expect(vertical.industryName).toBeTruthy();
        expect(vertical.systemContext).toBeTruthy();
        expect(vertical.systemContext.length).toBeGreaterThan(100);
        expect(Array.isArray(vertical.keyTerms)).toBe(true);
        expect(vertical.keyTerms.length).toBeGreaterThan(5);
        expect(typeof vertical.evaluationCriteria).toBe('object');
        expect(Array.isArray(vertical.regulatoryContext)).toBe(true);
        expect(Array.isArray(vertical.exampleQueries)).toBe(true);
        expect(Array.isArray(vertical.fewShotExamples)).toBe(true);
      });
    });

    it('should have evaluation criteria that sum to 1.0', () => {
      Object.entries(VERTICAL_PROMPTS).forEach(([id, vertical]) => {
        const sum = Object.values(vertical.evaluationCriteria).reduce((a, b) => a + b, 0);
        expect(sum).toBeCloseTo(1.0, 2);
      });
    });

    it('should have at least one few-shot example per vertical', () => {
      Object.entries(VERTICAL_PROMPTS).forEach(([id, vertical]) => {
        expect(vertical.fewShotExamples.length).toBeGreaterThanOrEqual(1);
        vertical.fewShotExamples.forEach(example => {
          expect(example.query).toBeTruthy();
          expect(example.context).toBeTruthy();
          expect(example.response).toBeTruthy();
          expect(example.response.length).toBeGreaterThan(100);
        });
      });
    });

    it('should have {brand} placeholder in system context', () => {
      Object.entries(VERTICAL_PROMPTS).forEach(([id, vertical]) => {
        expect(vertical.systemContext).toContain('{brand}');
      });
    });
  });

  // ================================================================
  // FUNCTION TESTS
  // ================================================================

  describe('getVerticalPrompt', () => {
    it('should return vertical prompt for valid industry', () => {
      const prompt = getVerticalPrompt('saas');
      expect(prompt).not.toBeNull();
      expect(prompt?.industryId).toBe('saas');
    });

    it('should return null for unknown industry', () => {
      const prompt = getVerticalPrompt('unknown-industry');
      expect(prompt).toBeNull();
    });

    it('should normalize industry ID (lowercase)', () => {
      const prompt = getVerticalPrompt('SaaS');
      expect(prompt).not.toBeNull();
      expect(prompt?.industryId).toBe('saas');
    });

    it('should handle real-estate with hyphen', () => {
      const prompt = getVerticalPrompt('real-estate');
      expect(prompt).not.toBeNull();
      expect(prompt?.industryId).toBe('real-estate');
    });
  });

  describe('buildVerticalSystemPrompt', () => {
    it('should replace {brand} placeholder', () => {
      const variables: VerticalPromptVariables = {
        brand: 'Acme Corp'
      };
      const prompt = buildVerticalSystemPrompt('saas', variables);
      expect(prompt).toContain('Acme Corp');
      expect(prompt).not.toContain('{brand}');
    });

    it('should add geographic context when provided', () => {
      const variables: VerticalPromptVariables = {
        brand: 'Acme Corp',
        country: 'United States'
      };
      const prompt = buildVerticalSystemPrompt('fintech', variables);
      expect(prompt).toContain('Geographic context: United States');
    });

    it('should add competitors when provided', () => {
      const variables: VerticalPromptVariables = {
        brand: 'Acme Corp',
        competitors: ['Competitor A', 'Competitor B']
      };
      const prompt = buildVerticalSystemPrompt('ecommerce', variables);
      expect(prompt).toContain('Key competitors to consider:');
      expect(prompt).toContain('Competitor A');
      expect(prompt).toContain('Competitor B');
    });

    it('should return generic prompt for unknown industry', () => {
      const variables: VerticalPromptVariables = {
        brand: 'Acme Corp'
      };
      const prompt = buildVerticalSystemPrompt('unknown', variables);
      expect(prompt).toContain('knowledgeable advisor');
      expect(prompt).toContain('unknown');
    });
  });

  describe('getIndustryKeyTerms', () => {
    it('should return key terms for valid industry', () => {
      const terms = getIndustryKeyTerms('saas');
      expect(Array.isArray(terms)).toBe(true);
      expect(terms.length).toBeGreaterThan(0);
      expect(terms).toContain('MRR');
      expect(terms).toContain('churn rate');
    });

    it('should return empty array for unknown industry', () => {
      const terms = getIndustryKeyTerms('unknown');
      expect(terms).toEqual([]);
    });

    it('should include industry-specific terms', () => {
      const healthcareTerms = getIndustryKeyTerms('healthcare');
      expect(healthcareTerms).toContain('HIPAA');
      expect(healthcareTerms).toContain('board certified');

      const fintechTerms = getIndustryKeyTerms('fintech');
      expect(fintechTerms).toContain('PCI-DSS');
      expect(fintechTerms).toContain('KYC');

      const legalTerms = getIndustryKeyTerms('legal');
      expect(legalTerms).toContain('litigation');
      expect(legalTerms).toContain('retainer');
    });
  });

  describe('getEvaluationCriteria', () => {
    it('should return evaluation criteria for valid industry', () => {
      const criteria = getEvaluationCriteria('saas');
      expect(typeof criteria).toBe('object');
      expect(criteria).toHaveProperty('features');
      expect(criteria).toHaveProperty('reliability');
    });

    it('should return default criteria for unknown industry', () => {
      const criteria = getEvaluationCriteria('unknown');
      expect(criteria).toHaveProperty('quality');
      expect(criteria).toHaveProperty('price');
      expect(criteria).toHaveProperty('service');
      expect(criteria).toHaveProperty('reliability');
    });

    it('should have industry-specific weights', () => {
      const healthcare = getEvaluationCriteria('healthcare');
      expect(healthcare.trust).toBe(0.35); // Trust is highest in healthcare
      expect(healthcare.outcomes).toBe(0.30);

      const legal = getEvaluationCriteria('legal');
      expect(legal.expertise).toBe(0.40); // Expertise is highest in legal

      const ecommerce = getEvaluationCriteria('ecommerce');
      expect(ecommerce.product_quality).toBe(0.30);
    });
  });

  describe('getRegulatoryContext', () => {
    it('should return regulatory context for valid industry', () => {
      const regulations = getRegulatoryContext('healthcare');
      expect(Array.isArray(regulations)).toBe(true);
      expect(regulations).toContain('HIPAA');
      expect(regulations).toContain('FDA');
    });

    it('should return empty array for unknown industry', () => {
      const regulations = getRegulatoryContext('unknown');
      expect(regulations).toEqual([]);
    });

    it('should have industry-specific regulations', () => {
      expect(getRegulatoryContext('fintech')).toContain('PCI-DSS');
      expect(getRegulatoryContext('fintech')).toContain('FINRA');

      expect(getRegulatoryContext('education')).toContain('FERPA');

      expect(getRegulatoryContext('hospitality')).toContain('ADA');
    });
  });

  describe('getExampleQueries', () => {
    it('should return example queries for valid industry', () => {
      const queries = getExampleQueries('saas');
      expect(Array.isArray(queries)).toBe(true);
      expect(queries.length).toBeGreaterThanOrEqual(4);
    });

    it('should return empty array for unknown industry', () => {
      const queries = getExampleQueries('unknown');
      expect(queries).toEqual([]);
    });

    it('should have industry-relevant queries', () => {
      const saasQueries = getExampleQueries('saas');
      expect(saasQueries.some(q => q.toLowerCase().includes('software') || q.toLowerCase().includes('crm'))).toBe(true);

      const restaurantQueries = getExampleQueries('restaurant');
      expect(restaurantQueries.some(q => q.toLowerCase().includes('restaurant') || q.toLowerCase().includes('brunch'))).toBe(true);
    });
  });

  describe('getFewShotExamples', () => {
    it('should return few-shot examples for valid industry', () => {
      const examples = getFewShotExamples('saas');
      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for unknown industry', () => {
      const examples = getFewShotExamples('unknown');
      expect(examples).toEqual([]);
    });

    it('should have complete example structure', () => {
      const examples = getFewShotExamples('fintech');
      examples.forEach(example => {
        expect(example).toHaveProperty('query');
        expect(example).toHaveProperty('context');
        expect(example).toHaveProperty('response');
      });
    });
  });

  describe('hasVerticalPrompt', () => {
    it('should return true for supported industries', () => {
      expect(hasVerticalPrompt('saas')).toBe(true);
      expect(hasVerticalPrompt('fintech')).toBe(true);
      expect(hasVerticalPrompt('healthcare')).toBe(true);
    });

    it('should return false for unsupported industries', () => {
      expect(hasVerticalPrompt('unknown')).toBe(false);
      expect(hasVerticalPrompt('mining')).toBe(false);
    });
  });

  describe('getSupportedIndustries', () => {
    it('should return all 10 supported industries', () => {
      const industries = getSupportedIndustries();
      expect(industries).toHaveLength(10);
    });

    it('should return industry IDs', () => {
      const industries = getSupportedIndustries();
      expect(industries).toContain('saas');
      expect(industries).toContain('healthcare');
      expect(industries).toContain('real-estate');
    });
  });

  // ================================================================
  // CONTENT QUALITY TESTS
  // ================================================================

  describe('Content Quality', () => {
    it('should have substantial system context for each vertical', () => {
      Object.values(VERTICAL_PROMPTS).forEach(vertical => {
        // System context should be at least 500 characters
        expect(vertical.systemContext.length).toBeGreaterThan(500);
        // Should include numbered considerations
        expect(vertical.systemContext).toMatch(/\d\./);
      });
    });

    it('should have diverse key terms', () => {
      Object.values(VERTICAL_PROMPTS).forEach(vertical => {
        // At least 10 key terms
        expect(vertical.keyTerms.length).toBeGreaterThanOrEqual(10);
        // No duplicate terms
        const uniqueTerms = new Set(vertical.keyTerms.map(t => t.toLowerCase()));
        expect(uniqueTerms.size).toBe(vertical.keyTerms.length);
      });
    });

    it('should have detailed few-shot responses', () => {
      Object.values(VERTICAL_PROMPTS).forEach(vertical => {
        vertical.fewShotExamples.forEach(example => {
          // Response should be substantial
          expect(example.response.length).toBeGreaterThan(300);
          // Response should include recommendations (numbered or bulleted)
          expect(example.response).toMatch(/(\d\.|•|\*\*)/);
        });
      });
    });

    it('should have at least 4 example queries per vertical', () => {
      Object.values(VERTICAL_PROMPTS).forEach(vertical => {
        expect(vertical.exampleQueries.length).toBeGreaterThanOrEqual(4);
      });
    });
  });

  // ================================================================
  // INDUSTRY-SPECIFIC TESTS
  // ================================================================

  describe('Industry-Specific Content', () => {
    it('SaaS should focus on metrics and integrations', () => {
      const saas = VERTICAL_PROMPTS.saas;
      expect(saas.systemContext).toContain('MRR');
      expect(saas.systemContext).toContain('integration');
      expect(saas.keyTerms).toContain('API');
      expect(saas.keyTerms).toContain('SOC 2');
    });

    it('Healthcare should emphasize compliance and outcomes', () => {
      const healthcare = VERTICAL_PROMPTS.healthcare;
      expect(healthcare.systemContext).toContain('HIPAA');
      expect(healthcare.systemContext.toLowerCase()).toContain('patient outcomes');
      expect(healthcare.evaluationCriteria.trust).toBeGreaterThan(0.3);
      expect(healthcare.evaluationCriteria.compliance).toBeGreaterThan(0.2);
    });

    it('Fintech should prioritize security and trust', () => {
      const fintech = VERTICAL_PROMPTS.fintech;
      expect(fintech.systemContext).toContain('security');
      expect(fintech.systemContext).toContain('compliance');
      expect(fintech.evaluationCriteria.trust).toBeGreaterThan(0.3);
      expect(fintech.evaluationCriteria.security).toBeGreaterThan(0.2);
    });

    it('Legal should emphasize expertise and credentials', () => {
      const legal = VERTICAL_PROMPTS.legal;
      expect(legal.systemContext).toContain('Bar association');
      expect(legal.systemContext).toContain('credentials');
      expect(legal.evaluationCriteria.expertise).toBeGreaterThan(0.35);
    });

    it('Real Estate should focus on local expertise', () => {
      const realEstate = VERTICAL_PROMPTS['real-estate'];
      expect(realEstate.systemContext).toContain('local');
      expect(realEstate.systemContext).toContain('market');
      expect(realEstate.evaluationCriteria.market_knowledge).toBeGreaterThan(0.25);
    });

    it('Restaurant should prioritize food quality', () => {
      const restaurant = VERTICAL_PROMPTS.restaurant;
      expect(restaurant.systemContext.toLowerCase()).toContain('food quality');
      expect(restaurant.systemContext.toLowerCase()).toContain('health inspection');
      expect(restaurant.evaluationCriteria.food_quality).toBeGreaterThan(0.3);
    });
  });
});
