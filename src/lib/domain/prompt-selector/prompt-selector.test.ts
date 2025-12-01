/**
 * Tests for Vertical Prompt Selector Module
 */

import { describe, it, expect } from 'vitest';
import {
  detectIndustry,
  detectQueryIntent,
  selectPrompt,
  buildContextEnhancements,
  getSupportedIndustries,
  isIndustrySupported,
  getIndustrySignals,
  getIntentTypes,
  QueryContext,
  QueryIntent
} from './index';

describe('Vertical Prompt Selector Module', () => {
  // ================================================================
  // INDUSTRY DETECTION TESTS
  // ================================================================

  describe('Industry Detection', () => {
    it('should detect SaaS industry from query', () => {
      const result = detectIndustry({
        query: 'What is the best project management software for teams?'
      });
      expect(result.industryId).toBe('saas');
      expect(result.confidence).toBeGreaterThan(0.3);
    });

    it('should detect Fintech industry from query', () => {
      const result = detectIndustry({
        query: 'Best payment processor for e-commerce'
      });
      expect(result.industryId).toBe('fintech');
    });

    it('should detect Healthcare industry from query', () => {
      const result = detectIndustry({
        query: 'Best telehealth platform for therapy'
      });
      expect(result.industryId).toBe('healthcare');
    });

    it('should detect E-commerce industry from query', () => {
      const result = detectIndustry({
        query: 'Best Shopify alternatives for online store'
      });
      expect(result.industryId).toBe('ecommerce');
    });

    it('should detect Marketing industry from query', () => {
      const result = detectIndustry({
        query: 'Best SEO tools for small business'
      });
      expect(result.industryId).toBe('marketing');
    });

    it('should detect Real Estate industry from query', () => {
      const result = detectIndustry({
        query: 'Best real estate agent to sell my house'
      });
      expect(result.industryId).toBe('real-estate');
    });

    it('should detect Legal industry from query', () => {
      const result = detectIndustry({
        query: 'Best lawyer for startup formation'
      });
      expect(result.industryId).toBe('legal');
    });

    it('should detect Education industry from query', () => {
      const result = detectIndustry({
        query: 'Best coding bootcamp for career change'
      });
      expect(result.industryId).toBe('education');
    });

    it('should detect Hospitality industry from query', () => {
      const result = detectIndustry({
        query: 'Best hotel in Paris for vacation'
      });
      expect(result.industryId).toBe('hospitality');
    });

    it('should detect Restaurant industry from query', () => {
      const result = detectIndustry({
        query: 'Best Italian restaurant for dinner'
      });
      expect(result.industryId).toBe('restaurant');
    });

    it('should use industry hint when provided', () => {
      const result = detectIndustry({
        query: 'Best options for my business',
        industryHint: 'fintech'
      });
      expect(result.industryId).toBe('fintech');
      expect(result.matchedSignals).toContain('Industry hint provided');
    });

    it('should return general for undetectable queries', () => {
      const result = detectIndustry({
        query: 'What time is it in Tokyo?'
      });
      expect(result.industryId).toBe('general');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should provide alternative industries when close', () => {
      const result = detectIndustry({
        query: 'Best software for managing payments and invoicing'
      });
      // This could match both saas and fintech
      expect(result.alternativeIndustries).toBeDefined();
    });

    it('should include matched signals', () => {
      const result = detectIndustry({
        query: 'Compare HubSpot CRM vs Salesforce'
      });
      expect(result.matchedSignals.length).toBeGreaterThan(0);
    });
  });

  // ================================================================
  // QUERY INTENT DETECTION TESTS
  // ================================================================

  describe('Query Intent Detection', () => {
    it('should detect comparison intent', () => {
      const queries = [
        'Compare Slack vs Microsoft Teams',
        'What is the difference between Stripe and Square?',
        'Which is better: Notion or Coda?'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('comparison');
      });
    });

    it('should detect recommendation intent', () => {
      const queries = [
        'What is the best CRM for startups?',
        'Top project management tools',
        'Should I use Shopify for my store?'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('recommendation');
      });
    });

    it('should detect evaluation intent', () => {
      const queries = [
        'Is Stripe reliable for payments?',
        'Reviews of Monday.com',
        'Pros and cons of using Webflow'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('evaluation');
      });
    });

    it('should detect research intent', () => {
      const queries = [
        'What is a CRM?',
        'How does Stripe work?',
        'Tell me about project management'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('research');
      });
    });

    it('should detect discovery intent', () => {
      const queries = [
        'Find me alternatives to Mailchimp',
        'Looking for email marketing tools',
        'Show me options for website builders'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('discovery');
      });
    });

    it('should detect validation intent', () => {
      const queries = [
        'Is this company legitimate?',
        'Is it true that Salesforce is expensive?',
        'Can I trust this platform with my data?'
      ];
      queries.forEach(query => {
        expect(detectQueryIntent(query)).toBe('validation');
      });
    });

    it('should default to recommendation for unclear intent', () => {
      const result = detectQueryIntent('Tell me about project management');
      // Should be research or recommendation
      expect(['recommendation', 'research']).toContain(result);
    });
  });

  // ================================================================
  // PROMPT SELECTION TESTS
  // ================================================================

  describe('Prompt Selection', () => {
    it('should select appropriate prompt for SaaS query', () => {
      const result = selectPrompt({
        query: 'Best CRM software for small business',
        brand: 'HubSpot'
      });
      expect(result.industryId).toBe('saas');
      expect(result.industryName).toBe('SaaS / Software');
      expect(result.systemPrompt).toContain('SaaS');
      expect(result.fallbackUsed).toBe(false);
    });

    it('should include brand in system prompt', () => {
      const result = selectPrompt({
        query: 'Is Stripe good for payments?',
        brand: 'Stripe'
      });
      expect(result.systemPrompt).toContain('Stripe');
    });

    it('should include country context when provided', () => {
      const result = selectPrompt({
        query: 'Best payment processor',
        country: 'US'
      });
      expect(result.systemPrompt).toContain('United States');
    });

    it('should detect correct query intent', () => {
      const result = selectPrompt({
        query: 'Compare Stripe vs Square'
      });
      expect(result.queryIntent).toBe('comparison');
    });

    it('should use fallback for unknown industries', () => {
      const result = selectPrompt({
        query: 'Random unrelated query about astronomy'
      });
      expect(result.fallbackUsed).toBe(true);
      expect(result.industryId).toBe('general');
    });

    it('should include context enhancements', () => {
      const result = selectPrompt({
        query: 'Best HIPAA compliant telehealth platform',
        country: 'US'
      });
      expect(result.contextEnhancements.length).toBeGreaterThan(0);
    });

    it('should include intent-specific guidance', () => {
      const result = selectPrompt({
        query: 'Compare HubSpot vs Salesforce'
      });
      expect(result.systemPrompt).toContain('comparing');
    });
  });

  // ================================================================
  // CONTEXT ENHANCEMENT TESTS
  // ================================================================

  describe('Context Enhancements', () => {
    it('should build regulatory context for healthcare', () => {
      const enhancements = buildContextEnhancements('healthcare', 'US');
      const regulatory = enhancements.find(e => e.type === 'regulatory');
      expect(regulatory).toBeDefined();
      expect(regulatory?.content).toContain('HIPAA');
    });

    it('should build glossary context for SaaS', () => {
      const enhancements = buildContextEnhancements('saas');
      const glossary = enhancements.find(e => e.type === 'glossary');
      expect(glossary).toBeDefined();
    });

    it('should build geographic context when country provided', () => {
      const enhancements = buildContextEnhancements('fintech', 'EU');
      const geographic = enhancements.find(e => e.type === 'geographic');
      expect(geographic).toBeDefined();
      expect(geographic?.content).toContain('GDPR');
    });

    it('should handle unknown industry gracefully', () => {
      const enhancements = buildContextEnhancements('unknown');
      // Should not throw, may return empty or minimal enhancements
      expect(Array.isArray(enhancements)).toBe(true);
    });
  });

  // ================================================================
  // UTILITY FUNCTION TESTS
  // ================================================================

  describe('Utility Functions', () => {
    it('getSupportedIndustries should return all industries', () => {
      const industries = getSupportedIndustries();
      expect(industries.length).toBe(10);
      expect(industries).toContain('saas');
      expect(industries).toContain('fintech');
      expect(industries).toContain('healthcare');
    });

    it('isIndustrySupported should validate industries', () => {
      expect(isIndustrySupported('saas')).toBe(true);
      expect(isIndustrySupported('fintech')).toBe(true);
      expect(isIndustrySupported('invalid')).toBe(false);
    });

    it('getIndustrySignals should return signals for valid industry', () => {
      const signals = getIndustrySignals('saas');
      expect(signals).not.toBeNull();
      expect(signals?.keywords.length).toBeGreaterThan(0);
      expect(signals?.patterns.length).toBeGreaterThan(0);
    });

    it('getIndustrySignals should return null for invalid industry', () => {
      const signals = getIndustrySignals('invalid');
      expect(signals).toBeNull();
    });

    it('getIntentTypes should return all intent types', () => {
      const intents = getIntentTypes();
      expect(intents).toContain('comparison');
      expect(intents).toContain('recommendation');
      expect(intents).toContain('evaluation');
      expect(intents).toContain('research');
      expect(intents).toContain('discovery');
      expect(intents).toContain('validation');
    });
  });

  // ================================================================
  // EDGE CASE TESTS
  // ================================================================

  describe('Edge Cases', () => {
    it('should handle empty query', () => {
      const result = selectPrompt({ query: '' });
      expect(result.industryId).toBe('general');
      expect(result.fallbackUsed).toBe(true);
    });

    it('should handle very long queries', () => {
      const longQuery = 'What is the best ' + 'software '.repeat(100) + 'for my business?';
      const result = detectIndustry({ query: longQuery });
      expect(result.industryId).toBe('saas');
    });

    it('should handle special characters in query', () => {
      const result = detectIndustry({
        query: 'Best CRM!!! @$% software??? for "small" business'
      });
      expect(result.industryId).toBe('saas');
    });

    it('should handle mixed case queries', () => {
      const result = detectIndustry({
        query: 'BEST PAYMENT PROCESSOR FOR E-COMMERCE'
      });
      expect(result.industryId).toBe('fintech');
    });

    it('should handle ambiguous queries with multiple industries', () => {
      const result = detectIndustry({
        query: 'Best software for healthcare payment processing'
      });
      // Should detect something, possibly with alternatives
      expect(result.industryId).toBeTruthy();
    });
  });

  // ================================================================
  // CONFIDENCE SCORING TESTS
  // ================================================================

  describe('Confidence Scoring', () => {
    it('should have high confidence for clear industry match', () => {
      const result = detectIndustry({
        query: 'Best CRM software for SaaS companies with API integration'
      });
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should have lower confidence for ambiguous queries', () => {
      const result = detectIndustry({
        query: 'Best options for business'
      });
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should have very high confidence with industry hint', () => {
      const result = detectIndustry({
        query: 'Best solutions',
        industryHint: 'healthcare'
      });
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  // ================================================================
  // INDUSTRY-SPECIFIC TESTS
  // ================================================================

  describe('Industry-Specific Detection', () => {
    const testCases: { query: string; expectedIndustry: string }[] = [
      { query: 'Salesforce vs HubSpot CRM comparison', expectedIndustry: 'saas' },
      { query: 'Best neobank for small business', expectedIndustry: 'fintech' },
      { query: 'HIPAA compliant video conferencing', expectedIndustry: 'healthcare' },
      { query: 'Dropshipping fulfillment services', expectedIndustry: 'ecommerce' },
      { query: 'Best email marketing platform for newsletters', expectedIndustry: 'marketing' },
      { query: 'Finding a realtor to sell my condo', expectedIndustry: 'real-estate' },
      { query: 'Best attorney for contract review', expectedIndustry: 'legal' },
      { query: 'Online MBA programs with good outcomes', expectedIndustry: 'education' },
      { query: 'Airbnb alternatives for vacation rental', expectedIndustry: 'hospitality' },
      { query: 'Best food delivery app for restaurants', expectedIndustry: 'restaurant' }
    ];

    testCases.forEach(({ query, expectedIndustry }) => {
      it(`should detect ${expectedIndustry} for: "${query.substring(0, 40)}..."`, () => {
        const result = detectIndustry({ query });
        expect(result.industryId).toBe(expectedIndustry);
      });
    });
  });
});
