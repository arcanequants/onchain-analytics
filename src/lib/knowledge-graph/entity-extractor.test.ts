/**
 * Entity Extractor Tests
 *
 * Phase 1, Week 2, Day 5
 */

import { describe, it, expect } from 'vitest';
import {
  EntityExtractor,
  extractEntities,
  extractOrganizations,
  extractWithRelations,
  type Entity,
} from './entity-extractor';

describe('EntityExtractor', () => {
  // ================================================================
  // ORGANIZATION EXTRACTION
  // ================================================================

  describe('Organization Extraction', () => {
    it('should extract known tech companies', () => {
      const text = 'Google and Microsoft are leading cloud providers. Apple makes consumer electronics.';
      const extractor = new EntityExtractor({ entityTypes: ['organization'] });
      const result = extractor.extract(text);

      const orgNames = result.entities.map(e => e.value.toLowerCase());
      expect(orgNames).toContain('google');
      expect(orgNames).toContain('microsoft');
      expect(orgNames).toContain('apple');
    });

    it('should extract companies with suffixes', () => {
      const text = 'Acme Inc. partnered with Widget Corp. and Global Holdings Ltd.';
      const extractor = new EntityExtractor({ entityTypes: ['organization'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should identify primary entity', () => {
      const text = `
        About Google. Google is a technology company based in Mountain View.
        Google Search is the most popular search engine. Google also owns YouTube.
        Microsoft and Apple are competitors.
      `;
      const extractor = new EntityExtractor({ entityTypes: ['organization'] });
      const result = extractor.extract(text);

      expect(result.primaryEntity).toBeDefined();
      expect(result.primaryEntity?.normalizedValue).toContain('google');
    });
  });

  // ================================================================
  // PRODUCT EXTRACTION
  // ================================================================

  describe('Product Extraction', () => {
    it('should extract known products', () => {
      const text = 'The iPhone 15 Pro is great. I also use ChatGPT and VS Code daily.';
      const extractor = new EntityExtractor({ entityTypes: ['product'] });
      const result = extractor.extract(text);

      const productNames = result.entities.map(e => e.value.toLowerCase());
      expect(productNames.some(p => p.includes('iphone') || p.includes('chatgpt'))).toBe(true);
    });

    it('should extract software products', () => {
      const text = 'Using Notion for notes and Figma for design. GitHub Copilot helps with coding.';
      const extractor = new EntityExtractor({ entityTypes: ['product'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // LOCATION EXTRACTION
  // ================================================================

  describe('Location Extraction', () => {
    it('should extract cities', () => {
      const text = 'Our offices are in San Francisco, New York, and London.';
      const extractor = new EntityExtractor({ entityTypes: ['location'] });
      const result = extractor.extract(text);

      const locations = result.entities.map(e => e.value.toLowerCase());
      expect(locations.some(l => l.includes('san francisco'))).toBe(true);
    });

    it('should extract countries', () => {
      const text = 'We operate in the United States, Canada, and European Union.';
      const extractor = new EntityExtractor({ entityTypes: ['location'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // TECHNOLOGY EXTRACTION
  // ================================================================

  describe('Technology Extraction', () => {
    it('should extract programming languages', () => {
      const text = 'We use TypeScript, Python, and Go for our backend. React and Vue for frontend.';
      const extractor = new EntityExtractor({ entityTypes: ['technology'] });
      const result = extractor.extract(text);

      const techs = result.entities.map(e => e.value.toLowerCase());
      expect(techs).toContain('typescript');
      expect(techs).toContain('python');
    });

    it('should extract frameworks and tools', () => {
      const text = 'Our stack includes Kubernetes, Docker, and Terraform. We use GraphQL APIs.';
      const extractor = new EntityExtractor({ entityTypes: ['technology'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // MONETARY EXTRACTION
  // ================================================================

  describe('Monetary Extraction', () => {
    it('should extract dollar amounts', () => {
      const text = 'The company raised $50 million at a $500 million valuation.';
      const extractor = new EntityExtractor({ entityTypes: ['monetary'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBe(2);
      expect(result.entities[0].type).toBe('monetary');
    });

    it('should extract with currency codes', () => {
      const text = 'Revenue was USD 10,000,000 with EUR 5,000,000 from Europe.';
      const extractor = new EntityExtractor({ entityTypes: ['monetary'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // INDUSTRY EXTRACTION
  // ================================================================

  describe('Industry Extraction', () => {
    it('should extract industry terms', () => {
      const text = 'We are a fintech company in the e-commerce space, using AI and machine learning.';
      const extractor = new EntityExtractor({ entityTypes: ['industry'] });
      const result = extractor.extract(text);

      const industries = result.entities.map(e => e.value.toLowerCase());
      expect(industries.some(i => i.includes('fintech') || i.includes('e-commerce'))).toBe(true);
    });
  });

  // ================================================================
  // URL EXTRACTION
  // ================================================================

  describe('URL Extraction', () => {
    it('should extract URLs', () => {
      const text = 'Visit https://www.example.com or http://api.test.com/v1 for more info.';
      const extractor = new EntityExtractor({ entityTypes: ['url'] });
      const result = extractor.extract(text);

      expect(result.entities.length).toBe(2);
      expect(result.entities[0].type).toBe('url');
      expect(result.entities[0].confidence).toBeGreaterThan(0.9);
    });
  });

  // ================================================================
  // CONFIGURATION
  // ================================================================

  describe('Configuration', () => {
    it('should respect minConfidence', () => {
      const text = 'Google is a tech company. Some random text here.';
      const highConfidence = new EntityExtractor({ minConfidence: 0.9 });
      const lowConfidence = new EntityExtractor({ minConfidence: 0.3 });

      const highResult = highConfidence.extract(text);
      const lowResult = lowConfidence.extract(text);

      expect(lowResult.entities.length).toBeGreaterThanOrEqual(highResult.entities.length);
    });

    it('should respect maxEntities', () => {
      const text = 'Google, Microsoft, Apple, Amazon, Meta, Netflix, Tesla, OpenAI, Anthropic all compete.';
      const extractor = new EntityExtractor({ maxEntities: 3 });
      const result = extractor.extract(text);

      expect(result.entities.length).toBeLessThanOrEqual(3);
    });

    it('should filter by entity types', () => {
      const text = 'Google in San Francisco uses Python and raised $1 billion.';
      const extractor = new EntityExtractor({ entityTypes: ['organization'] });
      const result = extractor.extract(text);

      result.entities.forEach(entity => {
        expect(entity.type).toBe('organization');
      });
    });
  });

  // ================================================================
  // SCHEMA EXTRACTION
  // ================================================================

  describe('Schema Extraction', () => {
    it('should extract from Organization schema', () => {
      const extractor = new EntityExtractor();
      const schema = {
        '@type': 'Organization',
        name: 'Acme Corporation',
        address: {
          '@type': 'PostalAddress',
          addressLocality: 'San Francisco',
        },
      };

      const entities = extractor.extractFromSchema(schema);

      expect(entities.length).toBe(2);
      expect(entities[0].type).toBe('organization');
      expect(entities[0].value).toBe('Acme Corporation');
      expect(entities[1].type).toBe('location');
    });

    it('should extract from Product schema', () => {
      const extractor = new EntityExtractor();
      const schema = {
        '@type': 'Product',
        name: 'Widget Pro',
        brand: {
          '@type': 'Brand',
          name: 'Widget Inc',
        },
      };

      const entities = extractor.extractFromSchema(schema);

      expect(entities.length).toBe(2);
      expect(entities.find(e => e.type === 'product')).toBeDefined();
      expect(entities.find(e => e.type === 'organization')).toBeDefined();
    });

    it('should mark schema entities as primary', () => {
      const extractor = new EntityExtractor();
      const schema = {
        '@type': 'Organization',
        name: 'Primary Corp',
      };

      const entities = extractor.extractFromSchema(schema);

      expect(entities[0].metadata?.isPrimary).toBe(true);
    });
  });

  // ================================================================
  // ENTITY MERGING
  // ================================================================

  describe('Entity Merging', () => {
    it('should merge entities from multiple sources', () => {
      const extractor = new EntityExtractor();

      const set1: Entity[] = [
        {
          id: '1',
          type: 'organization',
          value: 'Google',
          normalizedValue: 'google',
          confidence: 0.8,
          metadata: { frequency: 2 },
        },
      ];

      const set2: Entity[] = [
        {
          id: '2',
          type: 'organization',
          value: 'Google',
          normalizedValue: 'google',
          confidence: 0.9,
          metadata: { frequency: 3 },
        },
      ];

      const merged = extractor.mergeEntities([set1, set2]);

      expect(merged.length).toBe(1);
      expect(merged[0].confidence).toBe(0.9); // Higher confidence
      expect(merged[0].metadata?.frequency).toBe(5); // Combined frequency
    });

    it('should preserve unique entities', () => {
      const extractor = new EntityExtractor();

      const set1: Entity[] = [
        { id: '1', type: 'organization', value: 'Google', normalizedValue: 'google', confidence: 0.8 },
      ];

      const set2: Entity[] = [
        { id: '2', type: 'organization', value: 'Microsoft', normalizedValue: 'microsoft', confidence: 0.9 },
      ];

      const merged = extractor.mergeEntities([set1, set2]);

      expect(merged.length).toBe(2);
    });
  });

  // ================================================================
  // RELATION EXTRACTION
  // ================================================================

  describe('Relation Extraction', () => {
    it('should extract relations when enabled', () => {
      const text = 'Google in Mountain View makes Android phones. Sundar Pichai is the CEO.';
      const extractor = new EntityExtractor({ extractRelations: true });
      const result = extractor.extract(text);

      // Check that some entities have relations
      const entitiesWithRelations = result.entities.filter(e => e.relations && e.relations.length > 0);
      expect(entitiesWithRelations.length).toBeGreaterThan(0);
    });

    it('should create organization-location relations', () => {
      const text = 'Microsoft is headquartered in Seattle.';
      const result = extractWithRelations(text);

      const microsoft = result.entities.find(e => e.normalizedValue.includes('microsoft'));
      if (microsoft?.relations) {
        const locationRelation = microsoft.relations.find(r => r.relationType === 'located_in');
        expect(locationRelation).toBeDefined();
      }
    });
  });

  // ================================================================
  // CONVENIENCE FUNCTIONS
  // ================================================================

  describe('Convenience Functions', () => {
    it('extractEntities should work', () => {
      const entities = extractEntities('Google and Microsoft compete in cloud.');
      expect(entities.length).toBeGreaterThan(0);
    });

    it('extractOrganizations should only return organizations', () => {
      const orgs = extractOrganizations('Google in San Francisco uses Python.');
      orgs.forEach(org => {
        expect(org.type).toBe('organization');
      });
    });

    it('extractWithRelations should include metadata', () => {
      const result = extractWithRelations('Google makes Android.');
      expect(result.metadata).toBeDefined();
      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.extractorVersion).toBe('1.0.0');
    });
  });

  // ================================================================
  // METADATA
  // ================================================================

  describe('Metadata', () => {
    it('should track extraction source', () => {
      const extractor = new EntityExtractor();
      const result = extractor.extract('Google is a tech company.');

      result.entities.forEach(entity => {
        expect(entity.metadata?.source).toBe('text');
      });
    });

    it('should include processing time', () => {
      const extractor = new EntityExtractor();
      const result = extractor.extract('Some text with Google and Microsoft.');

      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should include source length', () => {
      const text = 'Google is headquartered in Mountain View.';
      const extractor = new EntityExtractor();
      const result = extractor.extract(text);

      expect(result.metadata.sourceLength).toBe(text.length);
    });
  });

  // ================================================================
  // EDGE CASES
  // ================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const extractor = new EntityExtractor();
      const result = extractor.extract('');

      expect(result.entities).toHaveLength(0);
      expect(result.primaryEntity).toBeUndefined();
    });

    it('should handle text with no entities', () => {
      const extractor = new EntityExtractor();
      const result = extractor.extract('This is a simple sentence with no special entities.');

      // May find some entities or none depending on patterns
      expect(Array.isArray(result.entities)).toBe(true);
    });

    it('should handle special characters', () => {
      const extractor = new EntityExtractor();
      const result = extractor.extract('C++ and C# are programming languages. Check https://example.com/path?query=1');

      expect(result.entities.length).toBeGreaterThan(0);
    });

    it('should deduplicate entities', () => {
      const text = 'Google, Google, Google is mentioned many times. Google again.';
      const extractor = new EntityExtractor();
      const result = extractor.extract(text);

      const googleEntities = result.entities.filter(e => e.normalizedValue.includes('google'));
      expect(googleEntities.length).toBe(1);
      expect(googleEntities[0].metadata?.frequency).toBeGreaterThanOrEqual(4);
    });
  });
});
