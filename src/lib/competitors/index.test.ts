/**
 * Competitor Detection Module Tests
 *
 * Phase 2, Week 3, Day 3
 */

import { describe, it, expect } from 'vitest';
import {
  detectCompetitors,
  generateCompetitorComparison,
  type DetectionOptions,
  type DetectedCompetitor,
  type CompetitorDetectionResult,
} from './index';

describe('Competitor Detection', () => {
  describe('detectCompetitors', () => {
    it('should detect known companies in text', () => {
      const text = `
        When comparing project management tools, Asana and Monday.com are popular choices.
        Trello offers a more visual approach, while Notion combines notes with task management.
      `;

      const result = detectCompetitors(text);

      expect(result.competitors.length).toBeGreaterThan(0);

      const competitorNames = result.competitors.map(c => c.normalizedName);
      expect(competitorNames).toContain('asana');
      expect(competitorNames).toContain('monday.com');
      expect(competitorNames).toContain('trello');
      expect(competitorNames).toContain('notion');
    });

    it('should detect company aliases', () => {
      const text = 'I recommend using ChatGPT for writing and Claude for analysis.';

      const result = detectCompetitors(text);

      const competitorNames = result.competitors.map(c => c.normalizedName);
      // ChatGPT is an alias for OpenAI, Claude is an alias for Anthropic
      expect(competitorNames).toContain('openai');
      expect(competitorNames).toContain('anthropic');
    });

    it('should exclude the brand being analyzed', () => {
      const text = 'Salesforce competes with HubSpot and Zendesk in the CRM market.';

      const result = detectCompetitors(text, { excludeBrand: 'Salesforce' });

      const competitorNames = result.competitors.map(c => c.normalizedName);
      expect(competitorNames).not.toContain('salesforce');
      expect(competitorNames).toContain('hubspot');
      expect(competitorNames).toContain('zendesk');
    });

    it('should count frequency of mentions', () => {
      const text = `
        Google is a leader in search. Google also dominates advertising.
        Google Cloud competes with AWS. Many prefer Google for its simplicity.
      `;

      const result = detectCompetitors(text);

      const google = result.competitors.find(c => c.normalizedName === 'google');
      expect(google).toBeDefined();
      expect(google!.frequency).toBeGreaterThanOrEqual(4);
    });

    it('should detect competitors in comparison patterns', () => {
      const text = 'Zoom is better than Microsoft Teams for video calls. Consider Slack vs Discord.';

      const result = detectCompetitors(text);

      const competitorNames = result.competitors.map(c => c.normalizedName);
      expect(competitorNames).toContain('zoom');
      expect(competitorNames).toContain('microsoft');
      expect(competitorNames).toContain('slack');
    });

    it('should prioritize known competitors from options', () => {
      const text = 'Try our product which is similar to Acme Corp and Widget Inc.';

      const result = detectCompetitors(text, {
        knownCompetitors: ['Acme Corp', 'Widget Inc'],
      });

      const competitorNames = result.competitors.map(c => c.name);
      expect(competitorNames).toContain('Acme Corp');
      expect(competitorNames).toContain('Widget Inc');
    });

    it('should respect minFrequency option', () => {
      const text = 'Microsoft is great. Microsoft is innovative. Apple is also good.';

      const result = detectCompetitors(text, { minFrequency: 2 });

      const competitorNames = result.competitors.map(c => c.normalizedName);
      expect(competitorNames).toContain('microsoft');
      expect(competitorNames).not.toContain('apple'); // Only mentioned once
    });

    it('should respect maxCompetitors option', () => {
      const text = `
        Microsoft, Google, Amazon, Apple, Meta, Salesforce, Oracle, SAP, IBM,
        HubSpot, Zendesk, Asana, Monday, Slack, Zoom, Shopify, Stripe, Twilio all compete.
      `;

      const result = detectCompetitors(text, { maxCompetitors: 5 });

      expect(result.competitors.length).toBeLessThanOrEqual(5);
    });

    it('should classify tiers when enabled', () => {
      const text = 'Microsoft and Notion are both great productivity tools.';

      const result = detectCompetitors(text, { classifyTiers: true });

      const microsoft = result.competitors.find(c => c.normalizedName === 'microsoft');
      const notion = result.competitors.find(c => c.normalizedName === 'notion');

      expect(microsoft?.tier).toBe('enterprise');
      expect(notion?.tier).toBe('smb');
    });

    it('should extract context around mentions', () => {
      const text = 'I highly recommend Figma for design work. It has excellent collaboration features.';

      const result = detectCompetitors(text);

      const figma = result.competitors.find(c => c.normalizedName === 'figma');
      expect(figma).toBeDefined();
      expect(figma!.contexts.length).toBeGreaterThan(0);
      expect(figma!.contexts[0].text).toContain('recommend');
    });

    it('should classify context types', () => {
      const text = `
        Slack vs Microsoft comparison: both are great.
        Notion is recommended as a top choice.
        Trello is an example of a kanban tool.
      `;

      const result = detectCompetitors(text);

      // Find competitors with specific context types
      const hasComparison = result.competitors.some(c =>
        c.contexts.some(ctx => ctx.type === 'comparison')
      );
      const hasRecommendation = result.competitors.some(c =>
        c.contexts.some(ctx => ctx.type === 'recommendation')
      );
      const hasExample = result.competitors.some(c =>
        c.contexts.some(ctx => ctx.type === 'example')
      );

      // At least one context type should be detected
      const hasAnyContextType = hasComparison || hasRecommendation || hasExample;
      expect(hasAnyContextType).toBe(true);
      // Comparison specifically should work with "vs"
      expect(hasComparison).toBe(true);
    });

    it('should calculate sentiment for mentions', () => {
      const positiveText = 'Notion is excellent, a great choice with top quality features.';
      const negativeText = 'Avoid using that tool, it has issues and problems.';

      const positiveResult = detectCompetitors(positiveText);
      const negativeResult = detectCompetitors(negativeText);

      const notion = positiveResult.competitors.find(c => c.normalizedName === 'notion');
      expect(notion).toBeDefined();
      expect(notion!.sentiment).toBeGreaterThan(0);

      // For negative text, competitors detected might have negative sentiment
      negativeResult.competitors.forEach(c => {
        expect(c.sentiment).toBeLessThanOrEqual(0.5);
      });
    });

    it('should identify direct competitors based on industry', () => {
      const text = 'HubSpot and Mailchimp both offer email marketing solutions.';

      const result = detectCompetitors(text, { industry: 'marketing' });

      const directCompetitors = result.directCompetitors;
      const hubspot = directCompetitors.find(c => c.normalizedName === 'hubspot');
      expect(hubspot?.isDirect).toBe(true);
    });

    it('should return total mentions count', () => {
      const text = 'Google Google Google. Microsoft Microsoft. Apple.';

      const result = detectCompetitors(text);

      expect(result.totalMentions).toBeGreaterThanOrEqual(6);
    });

    it('should include timestamp', () => {
      const result = detectCompetitors('Test with Microsoft');

      expect(result.analyzedAt).toBeDefined();
      expect(new Date(result.analyzedAt).getTime()).not.toBeNaN();
    });
  });

  describe('generateCompetitorComparison', () => {
    it('should generate comparison summary', () => {
      const competitors: DetectedCompetitor[] = [
        {
          name: 'Google',
          normalizedName: 'google',
          frequency: 5,
          contexts: [],
          tier: 'enterprise',
          tierConfidence: 0.9,
          isDirect: true,
          sentiment: 0.3,
          industry: 'technology',
        },
        {
          name: 'Microsoft',
          normalizedName: 'microsoft',
          frequency: 3,
          contexts: [],
          tier: 'enterprise',
          tierConfidence: 0.9,
          isDirect: true,
          sentiment: 0.1,
          industry: 'technology',
        },
        {
          name: 'BadCompetitor',
          normalizedName: 'badcompetitor',
          frequency: 2,
          contexts: [],
          isDirect: false,
          sentiment: -0.5,
        },
      ];

      const result = generateCompetitorComparison('MyBrand', competitors);

      expect(result.brandName).toBe('MyBrand');
      expect(result.competitorCount).toBe(3);
      expect(result.directThreats.length).toBeGreaterThan(0);
      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
    });

    it('should identify direct threats', () => {
      const competitors: DetectedCompetitor[] = [
        {
          name: 'DirectCompetitor',
          normalizedName: 'directcompetitor',
          frequency: 5,
          contexts: [],
          isDirect: true,
          sentiment: 0.2,
        },
        {
          name: 'IndirectCompetitor',
          normalizedName: 'indirectcompetitor',
          frequency: 2,
          contexts: [],
          isDirect: false,
          sentiment: 0.1,
        },
      ];

      const result = generateCompetitorComparison('MyBrand', competitors);

      expect(result.directThreats.length).toBeGreaterThanOrEqual(1);
      expect(result.directThreats.some(c => c.name === 'DirectCompetitor')).toBe(true);
    });

    it('should identify opportunities from negative sentiment', () => {
      const competitors: DetectedCompetitor[] = [
        {
          name: 'WeakCompetitor',
          normalizedName: 'weakcompetitor',
          frequency: 3,
          contexts: [],
          isDirect: true,
          sentiment: -0.5,
        },
      ];

      const result = generateCompetitorComparison('MyBrand', competitors);

      expect(result.opportunities.length).toBeGreaterThan(0);
      expect(result.opportunities[0].name).toBe('WeakCompetitor');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = detectCompetitors('');

      expect(result.competitors).toHaveLength(0);
      expect(result.totalMentions).toBe(0);
    });

    it('should handle text with no competitors', () => {
      const text = 'The weather today is sunny and warm.';

      const result = detectCompetitors(text);

      expect(result.competitors.length).toBe(0);
    });

    it('should handle case insensitivity', () => {
      const text = 'GOOGLE, Google, google, GoOgLe are all the same.';

      const result = detectCompetitors(text);

      const google = result.competitors.find(c => c.normalizedName === 'google');
      expect(google).toBeDefined();
      expect(google!.frequency).toBeGreaterThanOrEqual(4);
    });

    it('should not match partial words', () => {
      const text = 'The applecart rolled down the hill. Googled something.';

      const result = detectCompetitors(text);

      // Should not match "apple" in "applecart" or "google" in "googled"
      const apple = result.competitors.find(c => c.normalizedName === 'apple');
      const google = result.competitors.find(c => c.normalizedName === 'google');

      expect(apple).toBeUndefined();
      expect(google).toBeUndefined();
    });

    it('should handle special characters around company names', () => {
      const text = '(Microsoft) [Google] "Apple" \'Slack\'';

      const result = detectCompetitors(text);

      const competitorNames = result.competitors.map(c => c.normalizedName);
      expect(competitorNames).toContain('microsoft');
      expect(competitorNames).toContain('google');
      expect(competitorNames).toContain('apple');
      expect(competitorNames).toContain('slack');
    });

    it('should handle very long text efficiently', () => {
      const baseText = 'Microsoft and Google compete in cloud computing. ';
      const longText = baseText.repeat(500);

      const startTime = Date.now();
      const result = detectCompetitors(longText);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.competitors.length).toBeGreaterThan(0);
    });
  });

  describe('Industry Classification', () => {
    it('should assign correct industries to known companies', () => {
      const text = 'Stripe for payments, Shopify for e-commerce, Figma for design.';

      const result = detectCompetitors(text);

      const stripe = result.competitors.find(c => c.normalizedName === 'stripe');
      const shopify = result.competitors.find(c => c.normalizedName === 'shopify');
      const figma = result.competitors.find(c => c.normalizedName === 'figma');

      expect(stripe?.industry).toBe('payments');
      expect(shopify?.industry).toBe('e-commerce');
      expect(figma?.industry).toBe('design');
    });

    it('should assign correct tiers to known companies', () => {
      const text = 'Oracle for enterprise, HubSpot for mid-market, Calendly for SMB.';

      const result = detectCompetitors(text);

      const oracle = result.competitors.find(c => c.normalizedName === 'oracle');
      const hubspot = result.competitors.find(c => c.normalizedName === 'hubspot');
      const calendly = result.competitors.find(c => c.normalizedName === 'calendly');

      expect(oracle?.tier).toBe('enterprise');
      expect(hubspot?.tier).toBe('mid-market');
      expect(calendly?.tier).toBe('smb');
    });
  });
});
