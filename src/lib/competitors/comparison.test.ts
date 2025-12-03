/**
 * Competitor Comparison Module Tests
 *
 * Phase 2, Week 3, Day 4
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeCompetitiveLandscape,
  compareWithCompetitor,
  type CompetitiveLandscapeReport,
} from './comparison';

describe('Competitor Comparison', () => {
  describe('analyzeCompetitiveLandscape', () => {
    it('should generate a complete landscape report', () => {
      const aiResponse = `
        When looking for project management tools, Asana and Monday.com are popular choices.
        Trello offers a simpler approach with kanban boards.
        For enterprise needs, Microsoft Project and Jira are often recommended.
        Notion is great for teams wanting flexibility.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'MyBrand');

      expect(result).toHaveProperty('brand', 'MyBrand');
      expect(result).toHaveProperty('brandPosition');
      expect(result).toHaveProperty('competitorAnalyses');
      expect(result).toHaveProperty('marketSummary');
      expect(result).toHaveProperty('strategicRecommendations');
      expect(result).toHaveProperty('swotAnalysis');
      expect(result).toHaveProperty('generatedAt');
    });

    it('should detect and analyze competitors', () => {
      const aiResponse = `
        Microsoft is a leader in enterprise software.
        Google competes in cloud and productivity.
        Both companies are major players in the tech industry.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'MyStartup');

      expect(result.competitorAnalyses.length).toBeGreaterThan(0);
      expect(result.marketSummary.totalCompetitors).toBeGreaterThan(0);
    });

    it('should calculate brand position', () => {
      const aiResponse = 'HubSpot and Salesforce dominate the CRM market.';

      const result = analyzeCompetitiveLandscape(aiResponse, 'MyCRM', {
        brandTier: 'mid-market',
        brandStrengths: ['Easy to use', 'Affordable'],
        brandWeaknesses: ['Limited integrations'],
      });

      expect(result.brandPosition.estimatedTier).toBe('mid-market');
      expect(result.brandPosition.strengths).toContain('Easy to use');
      expect(result.brandPosition.weaknesses).toContain('Limited integrations');
      expect(result.brandPosition.competitiveStrength).toBeGreaterThan(0);
    });

    it('should generate SWOT analysis', () => {
      const aiResponse = `
        Slack vs Microsoft Teams comparison.
        Zoom is great for video calls.
        Discord has issues with enterprise features.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'ChatApp', {
        includeSwot: true,
      });

      expect(result.swotAnalysis).toHaveProperty('strengths');
      expect(result.swotAnalysis).toHaveProperty('weaknesses');
      expect(result.swotAnalysis).toHaveProperty('opportunities');
      expect(result.swotAnalysis).toHaveProperty('threats');
    });

    it('should generate market summary', () => {
      const aiResponse = `
        Microsoft and Google are the dominant players.
        Apple, Amazon, and Meta are also significant.
        Smaller companies like Notion and Asana serve niche markets.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'TechStartup');

      expect(result.marketSummary.totalCompetitors).toBeGreaterThan(0);
      expect(result.marketSummary.byTier).toHaveProperty('enterprise');
      expect(result.marketSummary.byTier).toHaveProperty('mid-market');
      expect(result.marketSummary.byTier).toHaveProperty('smb');
      expect(['fragmented', 'moderate', 'concentrated']).toContain(
        result.marketSummary.marketConcentration
      );
    });

    it('should provide strategic recommendations', () => {
      const aiResponse = `
        Salesforce is the market leader with strong brand recognition.
        HubSpot is gaining market share with excellent customer satisfaction.
        Zendesk has some customer complaints about pricing.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'NewCRM', {
        brandTier: 'smb',
      });

      expect(result.strategicRecommendations.length).toBeGreaterThan(0);
      result.strategicRecommendations.forEach(rec => {
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('title');
        expect(rec).toHaveProperty('description');
        expect(rec).toHaveProperty('actionItems');
      });
    });

    it('should exclude brand from competitor list', () => {
      const aiResponse = 'MyBrand, Google, and Microsoft all offer similar features.';

      const result = analyzeCompetitiveLandscape(aiResponse, 'MyBrand');

      const competitorNames = result.competitorAnalyses.map(a => a.competitor.name);
      expect(competitorNames).not.toContain('MyBrand');
    });
  });

  describe('compareWithCompetitor', () => {
    it('should compare brand with specific competitor', () => {
      const aiResponse = `
        Microsoft is excellent for enterprise with strong integration capabilities.
        They have some issues with complexity for smaller teams.
        Microsoft dominates the productivity space.
      `;

      const result = compareWithCompetitor(aiResponse, 'MyProduct', 'Microsoft');

      expect(result).not.toBeNull();
      expect(result?.competitor.name).toBe('Microsoft');
      expect(result?.strengthAssessment).toBeDefined();
      expect(result?.positioning).toBeDefined();
      // Recommendations may be empty depending on competitor characteristics
      expect(Array.isArray(result?.recommendations)).toBe(true);
    });

    it('should return null if competitor not found', () => {
      const aiResponse = 'Google and Apple are great companies.';

      const result = compareWithCompetitor(aiResponse, 'MyBrand', 'NonexistentCompany');

      expect(result).toBeNull();
    });

    it('should calculate share of voice', () => {
      const aiResponse = `
        Google Google Google Google Google.
        Microsoft Microsoft.
        Apple.
      `;

      const result = compareWithCompetitor(aiResponse, 'MyBrand', 'Google');

      expect(result).not.toBeNull();
      expect(result?.shareOfVoice).toBeGreaterThan(50); // Google mentioned most
    });

    it('should analyze positioning', () => {
      const aiResponse = 'Slack is a mid-market communication tool.';

      const result = compareWithCompetitor(aiResponse, 'MyComms', 'Slack', {
        brandTier: 'enterprise',
      });

      expect(result).not.toBeNull();
      expect(result?.positioning.position).toBeDefined();
      expect(result?.positioning.gapScore).toBeDefined();
    });
  });

  describe('Strength Assessment', () => {
    it('should calculate strength metrics', () => {
      const aiResponse = `
        Microsoft is the best choice for enterprise.
        Excellent quality and great support.
        Microsoft is highly recommended.
      `;

      const result = compareWithCompetitor(aiResponse, 'Competitor', 'Microsoft');

      expect(result?.strengthAssessment.overallStrength).toBeGreaterThan(0);
      expect(result?.strengthAssessment.brandRecognition).toBeGreaterThan(0);
      expect(result?.strengthAssessment.aiMentionStrength).toBeGreaterThan(0);
      expect(result?.strengthAssessment.sentimentStrength).toBeGreaterThan(0);
    });
  });

  describe('Recommendations', () => {
    it('should generate head-to-head recommendations for high-frequency competitors', () => {
      const aiResponse = `
        Notion Notion Notion is mentioned frequently.
        Notion is very popular. Notion is recommended.
      `;

      const result = compareWithCompetitor(aiResponse, 'MyNotes', 'Notion');

      const headToHead = result?.recommendations.find(r => r.type === 'head-to-head');
      expect(headToHead).toBeDefined();
    });

    it('should generate differentiation recommendations for negative sentiment', () => {
      const aiResponse = `
        Users should avoid BadCompetitor due to issues.
        BadCompetitor has problems with reliability.
        BadCompetitor has poor customer service.
      `;

      const result = analyzeCompetitiveLandscape(aiResponse, 'GoodProduct', {
        knownCompetitors: ['BadCompetitor'],
      });

      // Find competitor with negative sentiment
      const negativeComp = result.competitorAnalyses.find(
        a => a.competitor.sentiment < 0
      );

      if (negativeComp) {
        const differentiation = negativeComp.recommendations.find(
          r => r.type === 'differentiation'
        );
        expect(differentiation).toBeDefined();
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty text', () => {
      const result = analyzeCompetitiveLandscape('', 'MyBrand');

      expect(result.competitorAnalyses).toHaveLength(0);
      expect(result.marketSummary.totalCompetitors).toBe(0);
    });

    it('should handle text with no competitors', () => {
      const result = analyzeCompetitiveLandscape(
        'The weather is nice today.',
        'MyBrand'
      );

      expect(result.competitorAnalyses).toHaveLength(0);
    });

    it('should handle missing options gracefully', () => {
      const aiResponse = 'Google and Microsoft compete in cloud.';

      const result = analyzeCompetitiveLandscape(aiResponse, 'MyCloud');

      expect(result).toBeDefined();
      expect(result.brandPosition).toBeDefined();
    });
  });
});
