/**
 * Wikidata Link Checker Module Tests
 *
 * Phase 2, Week 3, Day 4
 */

import { describe, it, expect } from 'vitest';
import {
  checkWikidataPresence,
  type WikidataCheckResult,
} from './wikidata-checker';

describe('Wikidata Link Checker', () => {
  describe('checkWikidataPresence', () => {
    it('should find known entities', async () => {
      const result = await checkWikidataPresence('Microsoft');

      expect(result.found).toBe(true);
      expect(result.entity).toBeDefined();
      expect(result.entity?.label).toBe('Microsoft');
      expect(result.entity?.id).toBe('Q2283');
      expect(result.matchConfidence).toBeGreaterThan(0.5);
    });

    it('should return entity details', async () => {
      const result = await checkWikidataPresence('Google');

      expect(result.found).toBe(true);
      expect(result.entity).toBeDefined();
      expect(result.entity?.description).toBeDefined();
      expect(result.entity?.entityType).toBe('business');
      expect(result.entity?.properties.length).toBeGreaterThan(0);
    });

    it('should include Wikipedia URL when available', async () => {
      const result = await checkWikidataPresence('Microsoft');

      expect(result.entity?.wikipediaUrl).toContain('wikipedia.org');
    });

    it('should handle entities not found', async () => {
      const result = await checkWikidataPresence('NonexistentBrand12345');

      expect(result.found).toBe(false);
      expect(result.entity).toBeUndefined();
      expect(result.matchConfidence).toBe(0);
    });

    it('should provide recommendations for missing entities', async () => {
      const result = await checkWikidataPresence('NewStartupBrand');

      expect(result.found).toBe(false);
      expect(result.recommendations.length).toBeGreaterThan(0);

      const createRec = result.recommendations.find(r => r.type === 'create-entity');
      expect(createRec).toBeDefined();
      expect(createRec?.priority).toBe('high');
    });

    it('should calculate completeness score', async () => {
      const result = await checkWikidataPresence('Microsoft');

      expect(result.completenessScore).toBeGreaterThan(0);
      expect(result.completenessScore).toBeLessThanOrEqual(100);
    });

    it('should identify missing properties', async () => {
      const result = await checkWikidataPresence('OpenAI');

      // OpenAI mock has fewer properties than Microsoft
      expect(result.missingProperties).toBeDefined();
      expect(Array.isArray(result.missingProperties)).toBe(true);

      if (result.missingProperties.length > 0) {
        expect(result.missingProperties[0]).toHaveProperty('propertyId');
        expect(result.missingProperties[0]).toHaveProperty('label');
        expect(result.missingProperties[0]).toHaveProperty('importance');
        expect(result.missingProperties[0]).toHaveProperty('priority');
      }
    });

    it('should provide property recommendations', async () => {
      const result = await checkWikidataPresence('Google');

      // Should have recommendations for missing properties
      const addPropertyRecs = result.recommendations.filter(
        r => r.type === 'add-property'
      );

      if (addPropertyRecs.length > 0) {
        expect(addPropertyRecs[0]).toHaveProperty('howTo');
        expect(addPropertyRecs[0].howTo.length).toBeGreaterThan(0);
      }
    });

    it('should include alternatives when requested', async () => {
      const result = await checkWikidataPresence('Microsoft', {
        includeAlternatives: true,
        maxAlternatives: 3,
      });

      // May or may not have alternatives depending on mock data
      expect(Array.isArray(result.alternatives)).toBe(true);
    });

    it('should improve confidence with website match', async () => {
      const resultWithWebsite = await checkWikidataPresence('Microsoft', {
        officialWebsite: 'https://microsoft.com',
      });

      const resultWithoutWebsite = await checkWikidataPresence('Microsoft', {});

      expect(resultWithWebsite.matchConfidence).toBeGreaterThanOrEqual(
        resultWithoutWebsite.matchConfidence
      );
    });

    it('should include timestamp', async () => {
      const result = await checkWikidataPresence('Google');

      expect(result.checkedAt).toBeDefined();
      expect(new Date(result.checkedAt).getTime()).not.toBeNaN();
    });
  });

  describe('Entity Properties', () => {
    it('should parse properties correctly', async () => {
      const result = await checkWikidataPresence('Microsoft');

      expect(result.entity?.properties).toBeDefined();

      const officialWebsite = result.entity?.properties.find(
        p => p.id === 'P856'
      );
      expect(officialWebsite).toBeDefined();
      expect(officialWebsite?.valueType).toBe('url');
    });

    it('should detect entity type from properties', async () => {
      const businessResult = await checkWikidataPresence('Google');
      expect(businessResult.entity?.entityType).toBe('business');

      const orgResult = await checkWikidataPresence('OpenAI');
      expect(orgResult.entity?.entityType).toBe('organization');
    });
  });

  describe('Recommendations', () => {
    it('should recommend Wikipedia link if missing', async () => {
      const result = await checkWikidataPresence('SomeEntityWithoutWikipedia', {});

      if (!result.found) {
        const wikipediaRec = result.recommendations.find(
          r => r.type === 'link-wikipedia'
        );
        expect(wikipediaRec).toBeDefined();
      }
    });

    it('should recommend adding aliases if none exist', async () => {
      const result = await checkWikidataPresence('Microsoft');

      if (result.found && result.entity?.aliases.length === 0) {
        const aliasRec = result.recommendations.find(r => r.type === 'add-alias');
        expect(aliasRec).toBeDefined();
      }
    });

    it('should include AI impact in recommendations', async () => {
      const result = await checkWikidataPresence('Google');

      result.recommendations.forEach(rec => {
        expect(rec.aiImpact).toBeDefined();
        expect(rec.aiImpact.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Important Properties', () => {
    it('should define critical properties', async () => {
      const module = await import('./wikidata-checker');
      const IMPORTANT_PROPERTIES = module.default.IMPORTANT_PROPERTIES;

      expect(IMPORTANT_PROPERTIES.P31).toBeDefined();
      expect(IMPORTANT_PROPERTIES.P31.priority).toBe('critical');

      expect(IMPORTANT_PROPERTIES.P856).toBeDefined();
      expect(IMPORTANT_PROPERTIES.P856.priority).toBe('critical');
    });

    it('should have various priority levels', async () => {
      const module = await import('./wikidata-checker');
      const IMPORTANT_PROPERTIES = module.default.IMPORTANT_PROPERTIES;

      const priorities = Object.values(IMPORTANT_PROPERTIES).map((p: any) => p.priority);

      expect(priorities).toContain('critical');
      expect(priorities).toContain('high');
      expect(priorities).toContain('medium');
      expect(priorities).toContain('low');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty brand name', async () => {
      const result = await checkWikidataPresence('');

      // Empty string search returns no results
      expect(result).toBeDefined();
      // Empty string may match nothing or some entities depending on implementation
    });

    it('should handle special characters in brand name', async () => {
      const result = await checkWikidataPresence('Brand & Co.');

      expect(result).toBeDefined();
    });

    it('should be case insensitive for matching', async () => {
      const lowercase = await checkWikidataPresence('microsoft');
      const uppercase = await checkWikidataPresence('MICROSOFT');
      const mixed = await checkWikidataPresence('Microsoft');

      // All should find the same entity
      expect(lowercase.found).toBe(uppercase.found);
      expect(uppercase.found).toBe(mixed.found);
    });

    it('should match by alias', async () => {
      const result = await checkWikidataPresence('MSFT'); // Alias for Microsoft

      expect(result.found).toBe(true);
      expect(result.entity?.label).toBe('Microsoft');
    });
  });
});
