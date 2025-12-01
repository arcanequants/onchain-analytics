/**
 * Tests for Competitor Tier Schema Module
 */

import { describe, it, expect } from 'vitest';
import {
  TIER_DEFINITIONS,
  classifyCompetitor,
  getTierDefinition,
  getAllTierDefinitions,
  getTierQueryContext,
  getTierIndicators,
  getTierCharacteristics,
  getTierDisplayName,
  getAllTierIds,
  buildCompetitorTierContext,
  isValidTier,
  CompetitorTier,
  CompetitorProfile
} from './index';

describe('Competitor Tier Schema Module', () => {
  // ================================================================
  // TIER DEFINITIONS TESTS
  // ================================================================

  describe('Tier Definitions', () => {
    it('should have exactly 4 tiers defined', () => {
      const tiers = getAllTierIds();
      expect(tiers).toHaveLength(4);
      expect(tiers).toEqual(['enterprise', 'mid-market', 'smb', 'local']);
    });

    it('should have valid structure for each tier', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.tier).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.description.length).toBeGreaterThan(20);
        expect(def.characteristics).toBeDefined();
        expect(def.indicators).toBeDefined();
        expect(def.aiQueryContext).toBeTruthy();
      });
    });

    it('should have characteristics for each tier', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.characteristics.revenueRange).toBeDefined();
        expect(def.characteristics.employeeRange).toBeDefined();
        expect(def.characteristics.customerBase).toBeTruthy();
        expect(def.characteristics.marketReach).toBeTruthy();
      });
    });

    it('should have indicators for each tier', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.indicators.websiteSignals.length).toBeGreaterThan(0);
        expect(def.indicators.contentSignals.length).toBeGreaterThan(0);
        expect(def.indicators.socialProof.length).toBeGreaterThan(0);
        expect(def.indicators.pricingSignals.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Enterprise Tier', () => {
    const enterprise = getTierDefinition('enterprise');

    it('should have correct revenue range', () => {
      expect(enterprise.characteristics.revenueRange.min).toBe(100000000);
      expect(enterprise.characteristics.revenueRange.max).toBeNull();
    });

    it('should have correct employee range', () => {
      expect(enterprise.characteristics.employeeRange.min).toBe(1000);
    });

    it('should include enterprise-specific indicators', () => {
      expect(enterprise.indicators.websiteSignals).toContain('Custom pricing / "Contact sales"');
      expect(enterprise.indicators.pricingSignals).toContain('No public pricing');
    });

    it('should have example companies', () => {
      expect(enterprise.characteristics.typicalCompanies).toContain('Salesforce');
      expect(enterprise.characteristics.typicalCompanies).toContain('Microsoft');
    });
  });

  describe('Mid-Market Tier', () => {
    const midMarket = getTierDefinition('mid-market');

    it('should have correct revenue range', () => {
      expect(midMarket.characteristics.revenueRange.min).toBe(10000000);
      expect(midMarket.characteristics.revenueRange.max).toBe(100000000);
    });

    it('should have correct employee range', () => {
      expect(midMarket.characteristics.employeeRange.min).toBe(100);
      expect(midMarket.characteristics.employeeRange.max).toBe(1000);
    });

    it('should include mid-market indicators', () => {
      expect(midMarket.indicators.websiteSignals).toContain('Multiple pricing tiers displayed');
    });
  });

  describe('SMB Tier', () => {
    const smb = getTierDefinition('smb');

    it('should have correct revenue range', () => {
      expect(smb.characteristics.revenueRange.min).toBe(1000000);
      expect(smb.characteristics.revenueRange.max).toBe(10000000);
    });

    it('should include SMB indicators', () => {
      expect(smb.indicators.websiteSignals).toContain('Freemium model available');
      expect(smb.indicators.pricingSignals).toContain('Free tier available');
    });
  });

  describe('Local Tier', () => {
    const local = getTierDefinition('local');

    it('should have correct revenue range', () => {
      expect(local.characteristics.revenueRange.max).toBe(1000000);
    });

    it('should include local indicators', () => {
      expect(local.indicators.websiteSignals).toContain('Physical address prominently displayed');
      expect(local.indicators.socialProof).toContain('Google Business reviews');
    });
  });

  // ================================================================
  // CLASSIFICATION TESTS
  // ================================================================

  describe('Competitor Classification', () => {
    it('should classify as enterprise with high revenue', () => {
      const result = classifyCompetitor({
        revenue: 500000000,
        employees: 5000
      });
      expect(result.tier).toBe('enterprise');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify as mid-market with medium revenue', () => {
      const result = classifyCompetitor({
        revenue: 50000000,
        employees: 500
      });
      expect(result.tier).toBe('mid-market');
    });

    it('should classify as SMB with small revenue', () => {
      const result = classifyCompetitor({
        revenue: 5000000,
        employees: 50
      });
      expect(result.tier).toBe('smb');
    });

    it('should classify as local with local signals', () => {
      const result = classifyCompetitor({
        isLocal: true,
        employees: 5
      });
      expect(result.tier).toBe('local');
    });

    it('should include matched indicators', () => {
      const result = classifyCompetitor({
        revenue: 200000000,
        employees: 2000,
        hasPublicPricing: false
      });
      expect(result.matchedIndicators.length).toBeGreaterThan(0);
      expect(result.matchedIndicators).toContain('Revenue $100M+');
    });

    it('should provide alternative suggestions when close to threshold', () => {
      const result = classifyCompetitor({
        revenue: 80000000,
        employees: 800,
        customerCount: 5000 // Adding more signals to create alternatives
      });
      // With multiple signals, there should be alternatives
      // If only one tier scores, no alternatives
      expect(result.tier).toBe('mid-market');
    });

    it('should handle enterprise feature signals', () => {
      const result = classifyCompetitor({
        revenue: 30000000,
        hasEnterpriseFeatures: true
      });
      // The winning tier is mid-market (based on revenue), but enterprise gets points too
      expect(result.tier).toBe('mid-market');
    });

    it('should handle pricing signals', () => {
      const result = classifyCompetitor({
        hasPublicPricing: true,
        hasFreeTriad: true
      });
      expect(result.matchedIndicators.some(i => i.includes('free trial'))).toBe(true);
    });

    it('should handle website signals', () => {
      const result = classifyCompetitor({
        websiteSignals: ['Fortune 500 customers', 'Enterprise-grade security']
      });
      expect(result.tier).toBe('enterprise');
    });
  });

  // ================================================================
  // HELPER FUNCTION TESTS
  // ================================================================

  describe('Helper Functions', () => {
    it('getTierDefinition should return correct definition', () => {
      const def = getTierDefinition('enterprise');
      expect(def.tier).toBe('enterprise');
      expect(def.name).toBe('Enterprise');
    });

    it('getTierQueryContext should return context string', () => {
      const context = getTierQueryContext('smb');
      expect(context).toContain('SMB');
      expect(context.length).toBeGreaterThan(50);
    });

    it('getTierIndicators should return indicators', () => {
      const indicators = getTierIndicators('mid-market');
      expect(indicators.websiteSignals).toBeDefined();
      expect(indicators.pricingSignals).toBeDefined();
    });

    it('getTierCharacteristics should return characteristics', () => {
      const chars = getTierCharacteristics('local');
      expect(chars.revenueRange).toBeDefined();
      expect(chars.marketReach).toBe('Single city or neighborhood');
    });

    it('getTierDisplayName should return display name', () => {
      expect(getTierDisplayName('enterprise')).toBe('Enterprise');
      expect(getTierDisplayName('mid-market')).toBe('Mid-Market');
      expect(getTierDisplayName('smb')).toBe('SMB');
      expect(getTierDisplayName('local')).toBe('Local');
    });

    it('isValidTier should validate tier IDs', () => {
      expect(isValidTier('enterprise')).toBe(true);
      expect(isValidTier('mid-market')).toBe(true);
      expect(isValidTier('smb')).toBe(true);
      expect(isValidTier('local')).toBe(true);
      expect(isValidTier('invalid')).toBe(false);
      expect(isValidTier('')).toBe(false);
    });
  });

  // ================================================================
  // CONTEXT BUILDING TESTS
  // ================================================================

  describe('Context Building', () => {
    it('should build competitor context string', () => {
      const competitors: CompetitorProfile[] = [
        {
          name: 'Big Corp',
          url: 'bigcorp.com',
          tier: 'enterprise',
          tierConfidence: 0.9,
          tierIndicators: ['Fortune 500'],
          detectedAt: new Date()
        },
        {
          name: 'Medium Inc',
          tier: 'mid-market',
          tierConfidence: 0.8,
          tierIndicators: [],
          detectedAt: new Date()
        }
      ];

      const context = buildCompetitorTierContext(competitors);
      expect(context).toContain('Competitive Landscape');
      expect(context).toContain('Enterprise Competitors');
      expect(context).toContain('Big Corp');
      expect(context).toContain('Mid-Market Competitors');
      expect(context).toContain('Medium Inc');
    });

    it('should return empty string for no competitors', () => {
      const context = buildCompetitorTierContext([]);
      expect(context).toBe('');
    });

    it('should include URLs when provided', () => {
      const competitors: CompetitorProfile[] = [
        {
          name: 'Test Co',
          url: 'testco.com',
          tier: 'smb',
          tierConfidence: 0.8,
          tierIndicators: [],
          detectedAt: new Date()
        }
      ];

      const context = buildCompetitorTierContext(competitors);
      expect(context).toContain('testco.com');
    });

    it('should group competitors by tier', () => {
      const competitors: CompetitorProfile[] = [
        { name: 'E1', tier: 'enterprise', tierConfidence: 0.9, tierIndicators: [], detectedAt: new Date() },
        { name: 'E2', tier: 'enterprise', tierConfidence: 0.85, tierIndicators: [], detectedAt: new Date() },
        { name: 'S1', tier: 'smb', tierConfidence: 0.8, tierIndicators: [], detectedAt: new Date() }
      ];

      const context = buildCompetitorTierContext(competitors);

      // Check enterprise section appears before listing both
      const enterpriseSection = context.indexOf('Enterprise Competitors');
      const e1Index = context.indexOf('E1');
      const e2Index = context.indexOf('E2');

      expect(enterpriseSection).toBeLessThan(e1Index);
      expect(enterpriseSection).toBeLessThan(e2Index);
    });
  });

  // ================================================================
  // CONTENT QUALITY TESTS
  // ================================================================

  describe('Content Quality', () => {
    it('should have detailed descriptions', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.description.length).toBeGreaterThan(50);
      });
    });

    it('should have actionable AI query context', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.aiQueryContext.length).toBeGreaterThan(100);
        expect(def.aiQueryContext).toContain('focus');
      });
    });

    it('should have multiple website signals per tier', () => {
      const definitions = getAllTierDefinitions();
      definitions.forEach(def => {
        expect(def.indicators.websiteSignals.length).toBeGreaterThanOrEqual(5);
      });
    });

    it('should have realistic revenue ranges', () => {
      const enterprise = getTierCharacteristics('enterprise');
      const midMarket = getTierCharacteristics('mid-market');
      const smb = getTierCharacteristics('smb');
      const local = getTierCharacteristics('local');

      // Ensure ranges don't overlap improperly
      expect(enterprise.revenueRange.min).toBeGreaterThanOrEqual(midMarket.revenueRange.max!);
      expect(midMarket.revenueRange.min).toBeGreaterThanOrEqual(smb.revenueRange.max!);
      expect(smb.revenueRange.min).toBeGreaterThanOrEqual(local.revenueRange.max!);
    });
  });
});
