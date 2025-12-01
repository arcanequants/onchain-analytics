/**
 * Tests for Regulatory Context Module
 */

import { describe, it, expect } from 'vitest';
import {
  REGULATIONS,
  INDUSTRY_REGULATIONS,
  getRegulation,
  getAllRegulations,
  getRegulationsByCategory,
  getIndustryRegulations,
  getMandatoryRegulations,
  regulationApplies,
  getComplianceLevel,
  buildRegulatoryContext,
  getComplianceIndicators,
  getSupportedIndustries,
  isValidRegulation,
  RegulationId,
  RegulationCategory
} from './index';

describe('Regulatory Context Module', () => {
  // ================================================================
  // REGULATION DATA TESTS
  // ================================================================

  describe('Regulation Data Structure', () => {
    it('should have at least 15 regulations defined', () => {
      const regulations = getAllRegulations();
      expect(regulations.length).toBeGreaterThanOrEqual(15);
    });

    it('should have valid structure for each regulation', () => {
      const regulations = getAllRegulations();
      regulations.forEach(reg => {
        expect(reg.id).toBeTruthy();
        expect(reg.name).toBeTruthy();
        expect(reg.fullName).toBeTruthy();
        expect(reg.description).toBeTruthy();
        expect(reg.description.length).toBeGreaterThan(20);
        expect(reg.category).toBeTruthy();
        expect(reg.jurisdiction.length).toBeGreaterThan(0);
        expect(reg.enforcementBody).toBeTruthy();
        expect(reg.penalties).toBeTruthy();
        expect(reg.keyRequirements.length).toBeGreaterThan(0);
        expect(reg.complianceIndicators.length).toBeGreaterThan(0);
      });
    });

    it('should have regulations across multiple categories', () => {
      const categories = new Set(getAllRegulations().map(r => r.category));
      expect(categories.size).toBeGreaterThanOrEqual(5);
    });
  });

  // ================================================================
  // SPECIFIC REGULATION TESTS
  // ================================================================

  describe('Key Regulations', () => {
    it('should have HIPAA correctly defined', () => {
      const hipaa = getRegulation('hipaa');
      expect(hipaa.name).toBe('HIPAA');
      expect(hipaa.fullName).toContain('Health Insurance');
      expect(hipaa.category).toBe('healthcare');
      expect(hipaa.jurisdiction).toContain('US');
      expect(hipaa.keyRequirements).toContain('Business Associate Agreements (BAAs)');
    });

    it('should have PCI-DSS correctly defined', () => {
      const pci = getRegulation('pci-dss');
      expect(pci.name).toBe('PCI-DSS');
      expect(pci.fullName).toContain('Payment Card');
      expect(pci.category).toBe('financial');
      expect(pci.jurisdiction).toContain('Global');
    });

    it('should have SOC 2 correctly defined', () => {
      const soc2 = getRegulation('soc2');
      expect(soc2.name).toBe('SOC 2');
      expect(soc2.category).toBe('security');
      expect(soc2.keyRequirements).toContain('Security controls');
    });

    it('should have GDPR correctly defined', () => {
      const gdpr = getRegulation('gdpr');
      expect(gdpr.name).toBe('GDPR');
      expect(gdpr.category).toBe('data-privacy');
      expect(gdpr.jurisdiction).toContain('EU');
      expect(gdpr.penalties).toContain('4%');
    });

    it('should have CCPA correctly defined', () => {
      const ccpa = getRegulation('ccpa');
      expect(ccpa.name).toBe('CCPA');
      expect(ccpa.category).toBe('data-privacy');
      expect(ccpa.jurisdiction).toContain('US - California');
    });

    it('should have AML/KYC correctly defined', () => {
      const aml = getRegulation('aml-kyc');
      expect(aml.name).toBe('AML/KYC');
      expect(aml.category).toBe('financial');
      expect(aml.keyRequirements).toContain('Customer identification program');
    });
  });

  // ================================================================
  // CATEGORY TESTS
  // ================================================================

  describe('Regulation Categories', () => {
    const expectedCategories: RegulationCategory[] = [
      'data-privacy',
      'financial',
      'healthcare',
      'consumer-protection',
      'industry-specific',
      'accessibility',
      'security'
    ];

    it('should have regulations for each category', () => {
      expectedCategories.forEach(category => {
        const regs = getRegulationsByCategory(category);
        expect(regs.length).toBeGreaterThan(0);
      });
    });

    it('should return correct regulations for data-privacy', () => {
      const privacy = getRegulationsByCategory('data-privacy');
      const ids = privacy.map(r => r.id);
      expect(ids).toContain('gdpr');
      expect(ids).toContain('ccpa');
    });

    it('should return correct regulations for financial', () => {
      const financial = getRegulationsByCategory('financial');
      const ids = financial.map(r => r.id);
      expect(ids).toContain('pci-dss');
      expect(ids).toContain('aml-kyc');
      expect(ids).toContain('sox');
    });

    it('should return correct regulations for security', () => {
      const security = getRegulationsByCategory('security');
      const ids = security.map(r => r.id);
      expect(ids).toContain('soc2');
      expect(ids).toContain('iso-27001');
    });
  });

  // ================================================================
  // INDUSTRY REGULATORY CONTEXT TESTS
  // ================================================================

  describe('Industry Regulatory Context', () => {
    it('should have context for all 10 priority industries', () => {
      const expectedIndustries = [
        'saas', 'fintech', 'healthcare', 'ecommerce', 'marketing',
        'real-estate', 'legal', 'education', 'hospitality', 'restaurant'
      ];

      expectedIndustries.forEach(industry => {
        const context = getIndustryRegulations(industry);
        expect(context).not.toBeNull();
        expect(context?.industrySlug).toBe(industry);
      });
    });

    it('should have regulations for each industry', () => {
      const industries = getSupportedIndustries();
      industries.forEach(industry => {
        const context = getIndustryRegulations(industry);
        expect(context?.regulations.length).toBeGreaterThan(0);
      });
    });

    it('should have prompt context for each industry', () => {
      const industries = getSupportedIndustries();
      industries.forEach(industry => {
        const context = getIndustryRegulations(industry);
        expect(context?.promptContext).toBeTruthy();
        expect(context?.promptContext.length).toBeGreaterThan(50);
      });
    });

    it('should return null for unknown industry', () => {
      const context = getIndustryRegulations('nonexistent');
      expect(context).toBeNull();
    });
  });

  // ================================================================
  // INDUSTRY-SPECIFIC TESTS
  // ================================================================

  describe('SaaS Industry Regulations', () => {
    it('should have SOC 2 as mandatory', () => {
      const level = getComplianceLevel('saas', 'soc2');
      expect(level).toBe('mandatory');
    });

    it('should have GDPR applicable', () => {
      expect(regulationApplies('saas', 'gdpr')).toBe(true);
    });

    it('should have HIPAA as optional', () => {
      const level = getComplianceLevel('saas', 'hipaa');
      expect(level).toBe('optional');
    });
  });

  describe('Fintech Industry Regulations', () => {
    it('should have PCI-DSS as mandatory', () => {
      const level = getComplianceLevel('fintech', 'pci-dss');
      expect(level).toBe('mandatory');
    });

    it('should have AML/KYC as mandatory', () => {
      const level = getComplianceLevel('fintech', 'aml-kyc');
      expect(level).toBe('mandatory');
    });

    it('should have multiple mandatory regulations', () => {
      const mandatory = getMandatoryRegulations('fintech');
      expect(mandatory.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Healthcare Industry Regulations', () => {
    it('should have HIPAA as mandatory', () => {
      const level = getComplianceLevel('healthcare', 'hipaa');
      expect(level).toBe('mandatory');
    });

    it('should include FDA regulations', () => {
      expect(regulationApplies('healthcare', 'fda')).toBe(true);
    });
  });

  describe('E-commerce Industry Regulations', () => {
    it('should have PCI-DSS as mandatory', () => {
      const level = getComplianceLevel('ecommerce', 'pci-dss');
      expect(level).toBe('mandatory');
    });

    it('should have FTC as mandatory', () => {
      const level = getComplianceLevel('ecommerce', 'ftc');
      expect(level).toBe('mandatory');
    });
  });

  describe('Education Industry Regulations', () => {
    it('should have FERPA as mandatory', () => {
      const level = getComplianceLevel('education', 'ferpa');
      expect(level).toBe('mandatory');
    });

    it('should have COPPA applicable', () => {
      expect(regulationApplies('education', 'coppa')).toBe(true);
    });
  });

  describe('Real Estate Industry Regulations', () => {
    it('should have Fair Housing as mandatory', () => {
      const level = getComplianceLevel('real-estate', 'fair-housing');
      expect(level).toBe('mandatory');
    });
  });

  describe('Legal Industry Regulations', () => {
    it('should have State Bar as mandatory', () => {
      const level = getComplianceLevel('legal', 'state-bar');
      expect(level).toBe('mandatory');
    });
  });

  // ================================================================
  // MANDATORY REGULATIONS TESTS
  // ================================================================

  describe('Mandatory Regulations', () => {
    it('should return mandatory regulations for SaaS', () => {
      const mandatory = getMandatoryRegulations('saas');
      expect(mandatory.length).toBeGreaterThan(0);
      expect(mandatory.some(r => r.id === 'soc2')).toBe(true);
    });

    it('should return mandatory regulations for Fintech', () => {
      const mandatory = getMandatoryRegulations('fintech');
      expect(mandatory.some(r => r.id === 'pci-dss')).toBe(true);
      expect(mandatory.some(r => r.id === 'aml-kyc')).toBe(true);
    });

    it('should return empty array for unknown industry', () => {
      const mandatory = getMandatoryRegulations('nonexistent');
      expect(mandatory).toEqual([]);
    });
  });

  // ================================================================
  // REGULATION APPLICABILITY TESTS
  // ================================================================

  describe('Regulation Applicability', () => {
    it('should return true when regulation applies', () => {
      expect(regulationApplies('healthcare', 'hipaa')).toBe(true);
      expect(regulationApplies('fintech', 'pci-dss')).toBe(true);
    });

    it('should return false when regulation does not apply', () => {
      expect(regulationApplies('restaurant', 'hipaa')).toBe(false);
      expect(regulationApplies('real-estate', 'ferpa')).toBe(false);
    });

    it('should return false for unknown industry', () => {
      expect(regulationApplies('nonexistent', 'hipaa')).toBe(false);
    });
  });

  // ================================================================
  // COMPLIANCE LEVEL TESTS
  // ================================================================

  describe('Compliance Level', () => {
    it('should return correct compliance levels', () => {
      expect(getComplianceLevel('saas', 'soc2')).toBe('mandatory');
      expect(getComplianceLevel('saas', 'hipaa')).toBe('optional');
      expect(getComplianceLevel('saas', 'iso-27001')).toBe('recommended');
    });

    it('should return null for non-applicable regulation', () => {
      expect(getComplianceLevel('restaurant', 'hipaa')).toBeNull();
    });

    it('should return null for unknown industry', () => {
      expect(getComplianceLevel('nonexistent', 'hipaa')).toBeNull();
    });
  });

  // ================================================================
  // CONTEXT BUILDING TESTS
  // ================================================================

  describe('Regulatory Context Building', () => {
    it('should build context for SaaS', () => {
      const context = buildRegulatoryContext('saas');
      expect(context).toContain('Regulatory Context');
      expect(context).toContain('SaaS');
      expect(context).toContain('Mandatory Compliance');
      expect(context).toContain('SOC 2');
    });

    it('should build context for Fintech', () => {
      const context = buildRegulatoryContext('fintech');
      expect(context).toContain('Fintech');
      expect(context).toContain('PCI-DSS');
      expect(context).toContain('AML/KYC');
    });

    it('should build context for Healthcare', () => {
      const context = buildRegulatoryContext('healthcare');
      expect(context).toContain('Healthcare');
      expect(context).toContain('HIPAA');
    });

    it('should include notes when available', () => {
      const context = buildRegulatoryContext('saas');
      expect(context).toContain('enterprise sales');
    });

    it('should include applicableWhen conditions', () => {
      const context = buildRegulatoryContext('saas');
      expect(context).toContain('when');
    });

    it('should return empty string for unknown industry', () => {
      const context = buildRegulatoryContext('nonexistent');
      expect(context).toBe('');
    });
  });

  // ================================================================
  // COMPLIANCE INDICATORS TESTS
  // ================================================================

  describe('Compliance Indicators', () => {
    it('should return indicators for HIPAA', () => {
      const indicators = getComplianceIndicators('hipaa');
      expect(indicators.length).toBeGreaterThan(0);
      expect(indicators).toContain('BAA offered/signed');
    });

    it('should return indicators for PCI-DSS', () => {
      const indicators = getComplianceIndicators('pci-dss');
      expect(indicators.length).toBeGreaterThan(0);
      expect(indicators.some(i => i.includes('certification'))).toBe(true);
    });

    it('should return indicators for SOC 2', () => {
      const indicators = getComplianceIndicators('soc2');
      expect(indicators).toContain('SOC 2 Type II report');
    });

    it('should return indicators for GDPR', () => {
      const indicators = getComplianceIndicators('gdpr');
      expect(indicators.some(i => i.toLowerCase().includes('privacy policy'))).toBe(true);
    });
  });

  // ================================================================
  // SUPPORTED INDUSTRIES TESTS
  // ================================================================

  describe('Supported Industries', () => {
    it('should return list of supported industries', () => {
      const industries = getSupportedIndustries();
      expect(industries.length).toBeGreaterThanOrEqual(10);
    });

    it('should include all priority industries', () => {
      const industries = getSupportedIndustries();
      const expected = [
        'saas', 'fintech', 'healthcare', 'ecommerce', 'marketing',
        'real-estate', 'legal', 'education', 'hospitality', 'restaurant'
      ];
      expected.forEach(ind => {
        expect(industries).toContain(ind);
      });
    });
  });

  // ================================================================
  // VALIDATION TESTS
  // ================================================================

  describe('Regulation Validation', () => {
    it('should validate known regulation IDs', () => {
      expect(isValidRegulation('hipaa')).toBe(true);
      expect(isValidRegulation('pci-dss')).toBe(true);
      expect(isValidRegulation('gdpr')).toBe(true);
      expect(isValidRegulation('soc2')).toBe(true);
    });

    it('should reject unknown regulation IDs', () => {
      expect(isValidRegulation('unknown')).toBe(false);
      expect(isValidRegulation('')).toBe(false);
      expect(isValidRegulation('HIPAA')).toBe(false); // Case-sensitive
    });
  });

  // ================================================================
  // CONTENT QUALITY TESTS
  // ================================================================

  describe('Content Quality', () => {
    it('should have meaningful descriptions', () => {
      const regulations = getAllRegulations();
      regulations.forEach(reg => {
        expect(reg.description.length).toBeGreaterThan(30);
      });
    });

    it('should have specific penalties information', () => {
      const regulations = getAllRegulations();
      regulations.forEach(reg => {
        expect(reg.penalties.length).toBeGreaterThan(10);
      });
    });

    it('should have multiple key requirements per regulation', () => {
      const regulations = getAllRegulations();
      regulations.forEach(reg => {
        expect(reg.keyRequirements.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should have multiple compliance indicators per regulation', () => {
      const regulations = getAllRegulations();
      regulations.forEach(reg => {
        expect(reg.complianceIndicators.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should have industry compliance considerations', () => {
      const industries = getSupportedIndustries();
      industries.forEach(industry => {
        const context = getIndustryRegulations(industry);
        expect(context?.complianceConsiderations.length).toBeGreaterThan(0);
      });
    });
  });
});
