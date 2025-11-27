/**
 * Industry Detector Tests
 *
 * Phase 1, Week 1, Day 2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  INDUSTRY_TAXONOMY,
  getIndustryBySlug,
  getAllIndustrySlugs,
  getIndustryOptions,
  detectIndustryHeuristic,
  detectIndustry,
  createDetectionInput,
  createIndustryDetectionPrompt,
  parseAIDetectionResponse,
  type IndustryDetectionInput,
} from './index';

// ================================================================
// TAXONOMY TESTS
// ================================================================

describe('INDUSTRY_TAXONOMY', () => {
  it('should have at least 15 industries', () => {
    expect(INDUSTRY_TAXONOMY.length).toBeGreaterThanOrEqual(15);
  });

  it('should have unique slugs', () => {
    const slugs = INDUSTRY_TAXONOMY.map(i => i.slug);
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
  });

  it('should have required fields for each industry', () => {
    for (const industry of INDUSTRY_TAXONOMY) {
      expect(industry.slug).toBeTruthy();
      expect(industry.name).toBeTruthy();
      expect(industry.description).toBeTruthy();
      expect(industry.keywords).toBeInstanceOf(Array);
      expect(industry.keywords.length).toBeGreaterThan(0);
    }
  });

  it('should include major industries', () => {
    const slugs = INDUSTRY_TAXONOMY.map(i => i.slug);
    expect(slugs).toContain('saas');
    expect(slugs).toContain('fintech');
    expect(slugs).toContain('healthtech');
    expect(slugs).toContain('ecommerce');
    expect(slugs).toContain('marketing');
  });
});

describe('getIndustryBySlug', () => {
  it('should return industry for valid slug', () => {
    const industry = getIndustryBySlug('saas');
    expect(industry).toBeDefined();
    expect(industry?.name).toBe('SaaS & Cloud Software');
  });

  it('should return undefined for invalid slug', () => {
    const industry = getIndustryBySlug('invalid-slug');
    expect(industry).toBeUndefined();
  });

  it('should be case-sensitive', () => {
    const industry = getIndustryBySlug('SAAS');
    expect(industry).toBeUndefined();
  });
});

describe('getAllIndustrySlugs', () => {
  it('should return array of slugs', () => {
    const slugs = getAllIndustrySlugs();
    expect(slugs).toBeInstanceOf(Array);
    expect(slugs.length).toBe(INDUSTRY_TAXONOMY.length);
  });

  it('should include all industry slugs', () => {
    const slugs = getAllIndustrySlugs();
    for (const industry of INDUSTRY_TAXONOMY) {
      expect(slugs).toContain(industry.slug);
    }
  });
});

describe('getIndustryOptions', () => {
  it('should return options with value and label', () => {
    const options = getIndustryOptions();
    expect(options.length).toBe(INDUSTRY_TAXONOMY.length);

    for (const option of options) {
      expect(option).toHaveProperty('value');
      expect(option).toHaveProperty('label');
      expect(typeof option.value).toBe('string');
      expect(typeof option.label).toBe('string');
    }
  });

  it('should have slug as value and name as label', () => {
    const options = getIndustryOptions();
    const saasOption = options.find(o => o.value === 'saas');

    expect(saasOption).toBeDefined();
    expect(saasOption?.label).toBe('SaaS & Cloud Software');
  });
});

// ================================================================
// HEURISTIC DETECTION TESTS
// ================================================================

describe('detectIndustryHeuristic', () => {
  describe('SaaS detection', () => {
    it('should detect SaaS from software keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example-saas.com',
        brandName: 'ExampleSaaS',
        title: 'Cloud CRM Software for Teams',
        description: 'B2B SaaS platform for sales teams',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('saas');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect SaaS from Schema.org type', () => {
      const input: IndustryDetectionInput = {
        url: 'https://app.example.com',
        brandName: 'Example',
        schemaOrgType: 'SoftwareApplication',
        description: 'Enterprise software platform',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('saas');
    });
  });

  describe('Fintech detection', () => {
    it('should detect fintech from finance keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://payments.example.com',
        brandName: 'PayExample',
        title: 'Modern Payment Solutions',
        description: 'Digital banking and payment processing',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('fintech');
    });

    it('should detect fintech from crypto keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://crypto.example.com',
        brandName: 'CryptoEx',
        description: 'Cryptocurrency trading platform',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('fintech');
    });
  });

  describe('E-commerce detection', () => {
    it('should detect ecommerce from shopping keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://shop.example.com',
        brandName: 'ExampleStore',
        title: 'Online Shopping',
        description: 'Shop the best products online',
        ogType: 'website',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('ecommerce');
    });

    it('should detect ecommerce from marketplace keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://marketplace.example.com',
        brandName: 'ExampleMarket',
        description: 'B2B marketplace for commerce',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('ecommerce');
    });
  });

  describe('Healthcare detection', () => {
    it('should detect healthtech from medical keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://health.example.com',
        brandName: 'HealthEx',
        description: 'Telemedicine platform for healthcare providers',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('healthtech');
    });
  });

  describe('Entity type detection', () => {
    it('should detect business entity from Organization schema', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.com',
        brandName: 'Example Corp',
        schemaOrgType: 'Organization',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.entityType).toBe('business');
    });

    it('should detect personal entity from Person schema', () => {
      const input: IndustryDetectionInput = {
        url: 'https://johndoe.com',
        brandName: 'John Doe',
        schemaOrgType: 'Person',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.entityType).toBe('personal');
    });

    it('should detect personal entity from blog keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://johndoe.com',
        brandName: 'John Doe',
        title: 'My Personal Blog and Portfolio',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.entityType).toBe('personal');
    });

    it('should detect product entity from shopping keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://product.example.com',
        brandName: 'Widget Pro',
        title: 'Buy Widget Pro - Best Price',
        description: 'Add to cart and order now',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.entityType).toBe('product');
    });

    it('should detect service entity from service keywords', () => {
      const input: IndustryDetectionInput = {
        url: 'https://agency.example.com',
        brandName: 'Example Agency',
        description: 'Consulting and professional services',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.entityType).toBe('service');
    });
  });

  describe('Country detection', () => {
    it('should detect Mexico from .mx TLD', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.com.mx',
        brandName: 'Example MX',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.country).toBe('MX');
    });

    it('should detect UK from .uk TLD', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.co.uk',
        brandName: 'Example UK',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.country).toBe('GB');
    });

    it('should default to US for .com', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.com',
        brandName: 'Example',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.country).toBe('US');
    });

    it('should return null for unknown TLD', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.xyz',
        brandName: 'Example',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.country).toBeNull();
    });
  });

  describe('User hint handling', () => {
    it('should prioritize user hint when provided', () => {
      const input: IndustryDetectionInput = {
        url: 'https://example.com',
        brandName: 'Example',
        title: 'Software Solutions',
        userHint: 'marketing',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('marketing');
    });
  });

  describe('Default behavior', () => {
    it('should default to professional-services when no keywords match', () => {
      const input: IndustryDetectionInput = {
        url: 'https://unknown.com',
        brandName: 'Unknown Brand',
        title: 'Welcome',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.industry).toBe('professional-services');
    });

    it('should provide reasoning for classification', () => {
      const input: IndustryDetectionInput = {
        url: 'https://saas.example.com',
        brandName: 'SaaS Example',
        description: 'Cloud software platform',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.reasoning).toBeTruthy();
    });
  });

  describe('Confidence scoring', () => {
    it('should have higher confidence with more keyword matches', () => {
      const lowMatch: IndustryDetectionInput = {
        url: 'https://example.com',
        brandName: 'Example',
        description: 'cloud',
      };

      const highMatch: IndustryDetectionInput = {
        url: 'https://example.com',
        brandName: 'Example SaaS',
        title: 'Cloud Software Platform',
        description: 'Enterprise SaaS solution with API integration',
      };

      const lowResult = detectIndustryHeuristic(lowMatch);
      const highResult = detectIndustryHeuristic(highMatch);

      expect(highResult.confidence).toBeGreaterThan(lowResult.confidence);
    });

    it('should cap confidence at 0.85 for heuristic', () => {
      const input: IndustryDetectionInput = {
        url: 'https://mega-saas.com',
        brandName: 'MegaSaaS',
        title: 'Cloud SaaS Platform Software',
        description: 'Enterprise B2B SaaS cloud software platform API subscription',
        schemaOrgIndustry: 'Technology, Software',
        userHint: 'saas',
      };

      const result = detectIndustryHeuristic(input);
      expect(result.confidence).toBeLessThanOrEqual(0.85);
    });
  });
});

// ================================================================
// URL ANALYSIS INTEGRATION TESTS
// ================================================================

describe('createDetectionInput', () => {
  it('should create input from URL analysis result', () => {
    const analysisResult = {
      metadata: {
        url: 'https://example.com/',
        brandName: 'Example',
        title: 'Example Company',
        description: 'We do things',
        openGraph: {
          description: 'OG Description',
          type: 'website',
        },
        schemaOrg: {
          type: 'Organization',
          industry: 'Technology',
        },
      },
      warnings: [],
    };

    // @ts-expect-error - Simplified test mock
    const input = createDetectionInput(analysisResult);

    expect(input.url).toBe('https://example.com/');
    expect(input.brandName).toBe('Example');
    expect(input.title).toBe('Example Company');
    expect(input.description).toBe('We do things');
    expect(input.ogDescription).toBe('OG Description');
    expect(input.ogType).toBe('website');
    expect(input.schemaOrgType).toBe('Organization');
    expect(input.schemaOrgIndustry).toBe('Technology');
  });

  it('should handle missing brand name', () => {
    const analysisResult = {
      metadata: {
        url: 'https://example.com/',
        brandName: undefined,
        openGraph: {},
        schemaOrg: {},
      },
      warnings: [],
    };

    // @ts-expect-error - Simplified test mock
    const input = createDetectionInput(analysisResult);

    expect(input.brandName).toBe('Unknown');
  });
});

// ================================================================
// AI DETECTION TESTS
// ================================================================

describe('createIndustryDetectionPrompt', () => {
  it('should include brand information', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example Corp',
      title: 'Example Company',
    };

    const prompt = createIndustryDetectionPrompt(input);

    expect(prompt).toContain('Example Corp');
    expect(prompt).toContain('https://example.com');
    expect(prompt).toContain('Example Company');
  });

  it('should include all industry options', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
    };

    const prompt = createIndustryDetectionPrompt(input);

    for (const industry of INDUSTRY_TAXONOMY) {
      expect(prompt).toContain(industry.slug);
      expect(prompt).toContain(industry.name);
    }
  });

  it('should request JSON response', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
    };

    const prompt = createIndustryDetectionPrompt(input);

    expect(prompt).toContain('JSON');
    expect(prompt).toContain('"industry"');
    expect(prompt).toContain('"confidence"');
  });
});

describe('parseAIDetectionResponse', () => {
  it('should parse valid JSON response', () => {
    const response = JSON.stringify({
      industry: 'saas',
      subIndustry: 'crm',
      country: 'US',
      entityType: 'business',
      competitors: ['Salesforce', 'HubSpot'],
      confidence: 0.85,
      reasoning: 'Strong SaaS indicators',
    });

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.industry).toBe('saas');
      expect(result.value.subIndustry).toBe('crm');
      expect(result.value.competitors).toEqual(['Salesforce', 'HubSpot']);
    }
  });

  it('should extract JSON from text with extra content', () => {
    const response = `Based on my analysis, here is the classification:

    {"industry": "fintech", "subIndustry": "payments", "country": "US", "entityType": "business", "competitors": ["Stripe", "Square"], "confidence": 0.9, "reasoning": "Payment platform"}

    Let me know if you need more details.`;

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.industry).toBe('fintech');
    }
  });

  it('should handle null subIndustry', () => {
    const response = JSON.stringify({
      industry: 'professional-services',
      subIndustry: null,
      country: null,
      entityType: 'business',
      competitors: [],
      confidence: 0.6,
    });

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.subIndustry).toBeNull();
    }
  });

  it('should reject response without JSON', () => {
    const response = 'I think this is a SaaS company but I cannot provide JSON.';

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(false);
  });

  it('should reject invalid JSON structure', () => {
    const response = JSON.stringify({
      industry: 'saas',
      // Missing required fields
    });

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(false);
  });

  it('should reject invalid confidence value', () => {
    const response = JSON.stringify({
      industry: 'saas',
      subIndustry: null,
      country: 'US',
      entityType: 'business',
      competitors: [],
      confidence: 1.5, // Invalid: must be 0-1
    });

    const result = parseAIDetectionResponse(response);

    expect(result.ok).toBe(false);
  });
});

// ================================================================
// MAIN DETECTION FUNCTION TESTS
// ================================================================

describe('detectIndustry', () => {
  it('should return heuristic result for high confidence', async () => {
    const input: IndustryDetectionInput = {
      url: 'https://saas.example.com',
      brandName: 'SaaS Example',
      title: 'Cloud SaaS Platform',
      description: 'Enterprise B2B software as a service',
    };

    const result = await detectIndustry(input, { heuristicThreshold: 0.5 });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.source).toBe('heuristic');
      expect(result.value.detection.industry).toBe('saas');
      expect(result.value.processingTimeMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('should fall back to heuristic when AI not available', async () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
    };

    const result = await detectIndustry(input, { forceAI: true });

    expect(result.ok).toBe(true);
    if (result.ok) {
      // Falls back to heuristic since AI is not configured
      expect(result.value.source).toBe('heuristic');
    }
  });

  it('should handle errors gracefully', async () => {
    const input: IndustryDetectionInput = {
      url: '', // Invalid but won't crash
      brandName: '',
    };

    const result = await detectIndustry(input);

    // Should still work, just with low confidence
    expect(result.ok).toBe(true);
  });
});

// ================================================================
// COMPETITOR EXTRACTION TESTS
// ================================================================

describe('competitor extraction', () => {
  it('should extract competitors from comparison text', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
      description: 'Better than Salesforce, compared to HubSpot, alternative to Pipedrive',
    };

    const result = detectIndustryHeuristic(input);

    // Competitors extracted from patterns
    expect(result.competitors.length).toBeGreaterThan(0);
  });

  it('should limit competitors to 5', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
      description: `
        vs Salesforce vs HubSpot vs Pipedrive vs Monday vs Notion
        compared to Asana compared to ClickUp compared to Trello
      `,
    };

    const result = detectIndustryHeuristic(input);

    expect(result.competitors.length).toBeLessThanOrEqual(5);
  });

  it('should not include the brand itself as competitor', () => {
    const input: IndustryDetectionInput = {
      url: 'https://example.com',
      brandName: 'Example',
      description: 'Example is better than Example and compared to Example',
    };

    const result = detectIndustryHeuristic(input);

    expect(result.competitors).not.toContain('Example');
  });
});
