/**
 * Tests for Geographic Context Module
 */

import { describe, it, expect } from 'vitest';
import {
  GEOGRAPHIC_REGIONS,
  US_CONTEXT,
  EU_COUNTRIES,
  LATAM_COUNTRIES,
  getGeographicRegion,
  getCountryContext,
  getRegionForCountry,
  getSupportedCountryCodes,
  getSupportedRegions,
  isCountrySupported,
  getCountryRegulations,
  getCountryCulturalNotes,
  getBusinessCulture,
  buildGeographicContext,
  getLocalizedPromptAdjustments,
  GeographicPromptVariables
} from './index';

describe('Geographic Context Module', () => {
  // ================================================================
  // STRUCTURE TESTS
  // ================================================================

  describe('Region Structure', () => {
    it('should have exactly 3 regions (US, EU, LATAM)', () => {
      const regions = Object.keys(GEOGRAPHIC_REGIONS);
      expect(regions).toHaveLength(3);
      expect(regions).toContain('us');
      expect(regions).toContain('eu');
      expect(regions).toContain('latam');
    });

    it('should have valid structure for each region', () => {
      Object.entries(GEOGRAPHIC_REGIONS).forEach(([id, region]) => {
        expect(region.regionId).toBe(id);
        expect(region.regionName).toBeTruthy();
        expect(Array.isArray(region.countries)).toBe(true);
        expect(region.countries.length).toBeGreaterThan(0);
        expect(Array.isArray(region.commonRegulations)).toBe(true);
        expect(Array.isArray(region.culturalConsiderations)).toBe(true);
        expect(Array.isArray(region.languageConsiderations)).toBe(true);
      });
    });
  });

  describe('Country Structure', () => {
    const allCountries = [US_CONTEXT, ...EU_COUNTRIES, ...LATAM_COUNTRIES];

    it('should have valid structure for each country', () => {
      allCountries.forEach(country => {
        expect(country.countryCode).toMatch(/^[A-Z]{2}$/);
        expect(country.countryName).toBeTruthy();
        expect(country.primaryLanguage).toBeTruthy();
        expect(country.currency).toBeTruthy();
        expect(country.currencySymbol).toBeTruthy();
        expect(country.timezone).toBeTruthy();
        expect(Array.isArray(country.regulations)).toBe(true);
        expect(country.regulations.length).toBeGreaterThan(0);
        expect(Array.isArray(country.culturalNotes)).toBe(true);
        expect(country.culturalNotes.length).toBeGreaterThan(0);
        expect(country.businessCulture).toBeDefined();
        expect(['large', 'medium', 'small']).toContain(country.marketSize);
        expect(['mature', 'growing', 'emerging']).toContain(country.ecommerceMaturity);
      });
    });

    it('should have valid business culture for each country', () => {
      allCountries.forEach(country => {
        expect(['high', 'medium', 'low']).toContain(country.businessCulture.formalityLevel);
        expect(country.businessCulture.communicationStyle).toBeTruthy();
        expect(['fast', 'moderate', 'slow']).toContain(country.businessCulture.decisionMakingSpeed);
        expect(Array.isArray(country.businessCulture.importantFactors)).toBe(true);
        expect(country.businessCulture.importantFactors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('US Context', () => {
    it('should have correct US attributes', () => {
      expect(US_CONTEXT.countryCode).toBe('US');
      expect(US_CONTEXT.countryName).toBe('United States');
      expect(US_CONTEXT.primaryLanguage).toBe('English');
      expect(US_CONTEXT.currency).toBe('USD');
      expect(US_CONTEXT.marketSize).toBe('large');
      expect(US_CONTEXT.ecommerceMaturity).toBe('mature');
    });

    it('should include key US regulations', () => {
      expect(US_CONTEXT.regulations).toContain('FTC (Federal Trade Commission)');
      expect(US_CONTEXT.regulations).toContain('CCPA (California Consumer Privacy Act)');
      expect(US_CONTEXT.regulations).toContain('HIPAA (Healthcare)');
    });
  });

  describe('EU Countries', () => {
    it('should include major EU markets', () => {
      const countryCodes = EU_COUNTRIES.map(c => c.countryCode);
      expect(countryCodes).toContain('DE'); // Germany
      expect(countryCodes).toContain('FR'); // France
      expect(countryCodes).toContain('GB'); // UK
      expect(countryCodes).toContain('ES'); // Spain
      expect(countryCodes).toContain('IT'); // Italy
      expect(countryCodes).toContain('NL'); // Netherlands
    });

    it('should have GDPR in EU country regulations', () => {
      EU_COUNTRIES.forEach(country => {
        const hasGDPR = country.regulations.some(r =>
          r.includes('GDPR') || r.includes('UK GDPR')
        );
        expect(hasGDPR).toBe(true);
      });
    });

    it('should have EUR currency for Eurozone countries', () => {
      const eurozoneCountries = ['DE', 'FR', 'ES', 'IT', 'NL'];
      EU_COUNTRIES
        .filter(c => eurozoneCountries.includes(c.countryCode))
        .forEach(country => {
          expect(country.currency).toBe('EUR');
        });
    });

    it('should have GBP for UK', () => {
      const uk = EU_COUNTRIES.find(c => c.countryCode === 'GB');
      expect(uk?.currency).toBe('GBP');
    });
  });

  describe('LATAM Countries', () => {
    it('should include major LATAM markets', () => {
      const countryCodes = LATAM_COUNTRIES.map(c => c.countryCode);
      expect(countryCodes).toContain('MX'); // Mexico
      expect(countryCodes).toContain('BR'); // Brazil
      expect(countryCodes).toContain('AR'); // Argentina
      expect(countryCodes).toContain('CO'); // Colombia
      expect(countryCodes).toContain('CL'); // Chile
      expect(countryCodes).toContain('PE'); // Peru
    });

    it('should have Portuguese as primary language for Brazil', () => {
      const brazil = LATAM_COUNTRIES.find(c => c.countryCode === 'BR');
      expect(brazil?.primaryLanguage).toBe('Portuguese');
    });

    it('should have Spanish for other LATAM countries', () => {
      LATAM_COUNTRIES
        .filter(c => c.countryCode !== 'BR')
        .forEach(country => {
          expect(country.primaryLanguage).toBe('Spanish');
        });
    });
  });

  // ================================================================
  // FUNCTION TESTS
  // ================================================================

  describe('getGeographicRegion', () => {
    it('should return region for valid ID', () => {
      const us = getGeographicRegion('us');
      expect(us).not.toBeNull();
      expect(us?.regionId).toBe('us');

      const eu = getGeographicRegion('eu');
      expect(eu).not.toBeNull();
      expect(eu?.regionId).toBe('eu');

      const latam = getGeographicRegion('latam');
      expect(latam).not.toBeNull();
      expect(latam?.regionId).toBe('latam');
    });

    it('should be case-insensitive', () => {
      expect(getGeographicRegion('US')).not.toBeNull();
      expect(getGeographicRegion('EU')).not.toBeNull();
      expect(getGeographicRegion('LATAM')).not.toBeNull();
    });

    it('should return null for unknown region', () => {
      expect(getGeographicRegion('asia')).toBeNull();
      expect(getGeographicRegion('unknown')).toBeNull();
    });
  });

  describe('getCountryContext', () => {
    it('should return context for US', () => {
      const country = getCountryContext('US');
      expect(country).not.toBeNull();
      expect(country?.countryCode).toBe('US');
    });

    it('should return context for EU countries', () => {
      const germany = getCountryContext('DE');
      expect(germany).not.toBeNull();
      expect(germany?.countryName).toBe('Germany');

      const france = getCountryContext('FR');
      expect(france).not.toBeNull();
      expect(france?.countryName).toBe('France');
    });

    it('should return context for LATAM countries', () => {
      const mexico = getCountryContext('MX');
      expect(mexico).not.toBeNull();
      expect(mexico?.countryName).toBe('Mexico');

      const brazil = getCountryContext('BR');
      expect(brazil).not.toBeNull();
      expect(brazil?.countryName).toBe('Brazil');
    });

    it('should be case-insensitive', () => {
      expect(getCountryContext('us')).not.toBeNull();
      expect(getCountryContext('de')).not.toBeNull();
      expect(getCountryContext('mx')).not.toBeNull();
    });

    it('should return null for unknown country', () => {
      expect(getCountryContext('XX')).toBeNull();
      expect(getCountryContext('ZZ')).toBeNull();
    });
  });

  describe('getRegionForCountry', () => {
    it('should return us for United States', () => {
      expect(getRegionForCountry('US')).toBe('us');
    });

    it('should return eu for EU countries', () => {
      expect(getRegionForCountry('DE')).toBe('eu');
      expect(getRegionForCountry('FR')).toBe('eu');
      expect(getRegionForCountry('GB')).toBe('eu');
    });

    it('should return latam for LATAM countries', () => {
      expect(getRegionForCountry('MX')).toBe('latam');
      expect(getRegionForCountry('BR')).toBe('latam');
      expect(getRegionForCountry('AR')).toBe('latam');
    });

    it('should return null for unsupported country', () => {
      expect(getRegionForCountry('XX')).toBeNull();
    });
  });

  describe('getSupportedCountryCodes', () => {
    it('should return array of country codes', () => {
      const codes = getSupportedCountryCodes();
      expect(Array.isArray(codes)).toBe(true);
      expect(codes.length).toBeGreaterThan(10);
    });

    it('should include US, major EU, and LATAM countries', () => {
      const codes = getSupportedCountryCodes();
      expect(codes).toContain('US');
      expect(codes).toContain('DE');
      expect(codes).toContain('FR');
      expect(codes).toContain('MX');
      expect(codes).toContain('BR');
    });
  });

  describe('getSupportedRegions', () => {
    it('should return all 3 regions', () => {
      const regions = getSupportedRegions();
      expect(regions).toHaveLength(3);
      expect(regions).toContain('us');
      expect(regions).toContain('eu');
      expect(regions).toContain('latam');
    });
  });

  describe('isCountrySupported', () => {
    it('should return true for supported countries', () => {
      expect(isCountrySupported('US')).toBe(true);
      expect(isCountrySupported('DE')).toBe(true);
      expect(isCountrySupported('MX')).toBe(true);
    });

    it('should return false for unsupported countries', () => {
      expect(isCountrySupported('XX')).toBe(false);
      expect(isCountrySupported('JP')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isCountrySupported('us')).toBe(true);
      expect(isCountrySupported('Us')).toBe(true);
    });
  });

  describe('getCountryRegulations', () => {
    it('should return regulations for valid country', () => {
      const usRegs = getCountryRegulations('US');
      expect(usRegs.length).toBeGreaterThan(0);
      expect(usRegs).toContain('FTC (Federal Trade Commission)');
    });

    it('should return empty array for unknown country', () => {
      const regs = getCountryRegulations('XX');
      expect(regs).toEqual([]);
    });
  });

  describe('getCountryCulturalNotes', () => {
    it('should return cultural notes for valid country', () => {
      const notes = getCountryCulturalNotes('DE');
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.some(n => n.includes('quality'))).toBe(true);
    });

    it('should return empty array for unknown country', () => {
      const notes = getCountryCulturalNotes('XX');
      expect(notes).toEqual([]);
    });
  });

  describe('getBusinessCulture', () => {
    it('should return business culture for valid country', () => {
      const culture = getBusinessCulture('DE');
      expect(culture).not.toBeNull();
      expect(culture?.formalityLevel).toBe('high');
      expect(culture?.decisionMakingSpeed).toBe('slow');
    });

    it('should return null for unknown country', () => {
      expect(getBusinessCulture('XX')).toBeNull();
    });
  });

  // ================================================================
  // PROMPT BUILDING TESTS
  // ================================================================

  describe('buildGeographicContext', () => {
    it('should build context with country code', () => {
      const vars: GeographicPromptVariables = {
        countryCode: 'US'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('United States');
      expect(context).toContain('English');
      expect(context).toContain('USD');
    });

    it('should include regulations in context', () => {
      const vars: GeographicPromptVariables = {
        countryCode: 'DE'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Key Regulations');
      expect(context).toContain('GDPR');
    });

    it('should include business culture', () => {
      const vars: GeographicPromptVariables = {
        countryCode: 'FR'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Business Culture');
      expect(context).toContain('Decision Making');
    });

    it('should include cultural considerations', () => {
      const vars: GeographicPromptVariables = {
        countryCode: 'MX'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Cultural Considerations');
    });

    it('should add region context when provided', () => {
      const vars: GeographicPromptVariables = {
        region: 'eu'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Regional Context');
      expect(context).toContain('European Union');
    });

    it('should handle country name without code', () => {
      const vars: GeographicPromptVariables = {
        country: 'Japan'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Geographic Context:**');
      expect(context).toContain('Japan');
    });

    it('should handle language preference', () => {
      const vars: GeographicPromptVariables = {
        language: 'Spanish'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Language Preference:**');
      expect(context).toContain('Spanish');
    });

    it('should handle currency when no country code', () => {
      const vars: GeographicPromptVariables = {
        currency: 'EUR'
      };
      const context = buildGeographicContext(vars);
      expect(context).toContain('Currency:**');
      expect(context).toContain('EUR');
    });
  });

  describe('getLocalizedPromptAdjustments', () => {
    it('should return adjustments for high formality countries', () => {
      const adjustments = getLocalizedPromptAdjustments('DE');
      expect(adjustments.some(a => a.includes('formal'))).toBe(true);
    });

    it('should return adjustments for fast decision-making countries', () => {
      const adjustments = getLocalizedPromptAdjustments('US');
      expect(adjustments.some(a => a.includes('concise') || a.includes('actionable'))).toBe(true);
    });

    it('should return adjustments for slow decision-making countries', () => {
      const adjustments = getLocalizedPromptAdjustments('CL');
      expect(adjustments.some(a => a.includes('thorough') || a.includes('long-term'))).toBe(true);
    });

    it('should include language considerations for non-English countries', () => {
      const adjustments = getLocalizedPromptAdjustments('FR');
      expect(adjustments.some(a => a.includes('French'))).toBe(true);
    });

    it('should include important factors', () => {
      const adjustments = getLocalizedPromptAdjustments('BR');
      expect(adjustments.some(a => a.includes('Key factor'))).toBe(true);
    });

    it('should return empty array for unknown country', () => {
      const adjustments = getLocalizedPromptAdjustments('XX');
      expect(adjustments).toEqual([]);
    });
  });

  // ================================================================
  // CONTENT QUALITY TESTS
  // ================================================================

  describe('Content Quality', () => {
    it('should have detailed regulations for each country', () => {
      const allCountries = [US_CONTEXT, ...EU_COUNTRIES, ...LATAM_COUNTRIES];
      allCountries.forEach(country => {
        expect(country.regulations.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should have meaningful cultural notes', () => {
      const allCountries = [US_CONTEXT, ...EU_COUNTRIES, ...LATAM_COUNTRIES];
      allCountries.forEach(country => {
        expect(country.culturalNotes.length).toBeGreaterThanOrEqual(3);
        country.culturalNotes.forEach(note => {
          expect(note.length).toBeGreaterThan(10);
        });
      });
    });

    it('should have descriptive communication styles', () => {
      const allCountries = [US_CONTEXT, ...EU_COUNTRIES, ...LATAM_COUNTRIES];
      allCountries.forEach(country => {
        expect(country.businessCulture.communicationStyle.length).toBeGreaterThan(10);
      });
    });

    it('should have at least 3 important factors per country', () => {
      const allCountries = [US_CONTEXT, ...EU_COUNTRIES, ...LATAM_COUNTRIES];
      allCountries.forEach(country => {
        expect(country.businessCulture.importantFactors.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  // ================================================================
  // REGIONAL COVERAGE TESTS
  // ================================================================

  describe('Regional Coverage', () => {
    it('US region should have 1 country', () => {
      const us = getGeographicRegion('us');
      expect(us?.countries).toHaveLength(1);
    });

    it('EU region should have 6 countries', () => {
      const eu = getGeographicRegion('eu');
      expect(eu?.countries).toHaveLength(6);
    });

    it('LATAM region should have 6 countries', () => {
      const latam = getGeographicRegion('latam');
      expect(latam?.countries).toHaveLength(6);
    });

    it('total country coverage should be 13', () => {
      const total = getSupportedCountryCodes().length;
      expect(total).toBe(13);
    });
  });
});
