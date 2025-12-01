/**
 * Geographic Context Module
 * Phase 1, Week 1, Day 5 - Domain Tasks
 *
 * Provides geographic-specific context for AI perception analysis.
 * Initial coverage: US, EU (major markets), and LATAM.
 */

// ================================================================
// TYPES
// ================================================================

export interface GeographicRegion {
  regionId: string;
  regionName: string;
  countries: CountryContext[];
  commonRegulations: string[];
  culturalConsiderations: string[];
  languageConsiderations: string[];
}

export interface CountryContext {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string;
  localName?: string; // Name in local language
  primaryLanguage: string;
  secondaryLanguages?: string[];
  currency: string;
  currencySymbol: string;
  timezone: string; // Primary timezone
  regulations: string[];
  culturalNotes: string[];
  businessCulture: BusinessCultureNotes;
  marketSize: 'large' | 'medium' | 'small';
  ecommerceMaturity: 'mature' | 'growing' | 'emerging';
}

export interface BusinessCultureNotes {
  formalityLevel: 'high' | 'medium' | 'low';
  communicationStyle: string;
  decisionMakingSpeed: 'fast' | 'moderate' | 'slow';
  importantFactors: string[];
}

export interface GeographicPromptVariables {
  country?: string;
  countryCode?: string;
  region?: string;
  language?: string;
  currency?: string;
}

// ================================================================
// UNITED STATES CONTEXT
// ================================================================

const US_CONTEXT: CountryContext = {
  countryCode: 'US',
  countryName: 'United States',
  primaryLanguage: 'English',
  secondaryLanguages: ['Spanish'],
  currency: 'USD',
  currencySymbol: '$',
  timezone: 'America/New_York',
  regulations: [
    'FTC (Federal Trade Commission)',
    'CCPA (California Consumer Privacy Act)',
    'HIPAA (Healthcare)',
    'SOX (Financial)',
    'ADA (Accessibility)',
    'CAN-SPAM (Email Marketing)',
    'COPPA (Children\'s Privacy)',
    'SEC (Securities)',
    'FDA (Food & Drug)',
    'FCC (Communications)'
  ],
  culturalNotes: [
    'Direct communication style preferred',
    'Value efficiency and time',
    'Reviews and ratings highly influential',
    'Strong emphasis on customer service',
    'Price transparency expected',
    'Mobile-first consumer behavior',
    'Subscription fatigue in some markets'
  ],
  businessCulture: {
    formalityLevel: 'medium',
    communicationStyle: 'Direct and results-oriented',
    decisionMakingSpeed: 'fast',
    importantFactors: [
      'ROI and value proposition',
      'Ease of implementation',
      'Customer references',
      'Integration capabilities',
      'Support quality'
    ]
  },
  marketSize: 'large',
  ecommerceMaturity: 'mature'
};

// ================================================================
// EUROPEAN UNION CONTEXT
// ================================================================

const EU_COUNTRIES: CountryContext[] = [
  {
    countryCode: 'DE',
    countryName: 'Germany',
    localName: 'Deutschland',
    primaryLanguage: 'German',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Berlin',
    regulations: [
      'GDPR',
      'German Data Protection Act (BDSG)',
      'Telemedia Act (TMG)',
      'German Commercial Code (HGB)',
      'Competition Law (GWB)'
    ],
    culturalNotes: [
      'High value on quality and engineering',
      'Thorough research before purchasing',
      'Privacy-conscious consumers',
      'Preference for local/EU companies',
      'Detailed product specifications expected',
      'Strong environmental awareness'
    ],
    businessCulture: {
      formalityLevel: 'high',
      communicationStyle: 'Formal, precise, and thorough',
      decisionMakingSpeed: 'slow',
      importantFactors: [
        'Quality and reliability',
        'Technical specifications',
        'Data privacy compliance',
        'Long-term partnerships',
        'Environmental certifications'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'mature'
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    localName: 'France',
    primaryLanguage: 'French',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Paris',
    regulations: [
      'GDPR',
      'French Data Protection Act (Loi Informatique et Libertés)',
      'Consumer Code',
      'Labor Code',
      'CNIL regulations'
    ],
    culturalNotes: [
      'Strong preference for French language content',
      'Brand prestige and aesthetics matter',
      'Work-life balance valued',
      'Consumer protection awareness',
      'Relationship-based business culture'
    ],
    businessCulture: {
      formalityLevel: 'high',
      communicationStyle: 'Formal, eloquent, relationship-focused',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Brand reputation',
        'Quality and craftsmanship',
        'Personal relationships',
        'Compliance with local regulations',
        'French language support'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'mature'
  },
  {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    localName: 'United Kingdom',
    primaryLanguage: 'English',
    currency: 'GBP',
    currencySymbol: '£',
    timezone: 'Europe/London',
    regulations: [
      'UK GDPR',
      'Data Protection Act 2018',
      'Consumer Rights Act 2015',
      'FCA (Financial Conduct Authority)',
      'Competition and Markets Authority'
    ],
    culturalNotes: [
      'Polite but direct communication',
      'Value tradition and reliability',
      'Strong consumer rights awareness',
      'Tea and understatement culture',
      'Class-conscious marketing considerations'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Polite, understated, pragmatic',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Track record and heritage',
        'Value for money',
        'Customer service quality',
        'Regulatory compliance',
        'References from known entities'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'mature'
  },
  {
    countryCode: 'ES',
    countryName: 'Spain',
    localName: 'España',
    primaryLanguage: 'Spanish',
    secondaryLanguages: ['Catalan', 'Basque', 'Galician'],
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Madrid',
    regulations: [
      'GDPR',
      'Spanish Data Protection Act (LOPDGDD)',
      'General Consumer Law',
      'E-commerce Law (LSSI)'
    ],
    culturalNotes: [
      'Relationship-focused business culture',
      'Flexible scheduling expectations',
      'Regional identity important',
      'Price sensitivity in some markets',
      'Mobile commerce growing rapidly'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Warm, relationship-oriented, expressive',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Personal relationships',
        'Trust and reputation',
        'Local presence or support',
        'Flexible terms',
        'Cultural fit'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'mature'
  },
  {
    countryCode: 'IT',
    countryName: 'Italy',
    localName: 'Italia',
    primaryLanguage: 'Italian',
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Rome',
    regulations: [
      'GDPR',
      'Italian Privacy Code',
      'Consumer Code',
      'E-commerce Directive implementation'
    ],
    culturalNotes: [
      'Design and aesthetics highly valued',
      'Family business culture prevalent',
      'Regional differences significant',
      'Relationship-based trust',
      'Quality over quantity mindset'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Expressive, relationship-focused, passionate',
      decisionMakingSpeed: 'slow',
      importantFactors: [
        'Design and presentation',
        'Personal relationships',
        'Quality and craftsmanship',
        'Family business heritage',
        'Local market understanding'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'growing'
  },
  {
    countryCode: 'NL',
    countryName: 'Netherlands',
    localName: 'Nederland',
    primaryLanguage: 'Dutch',
    secondaryLanguages: ['English'],
    currency: 'EUR',
    currencySymbol: '€',
    timezone: 'Europe/Amsterdam',
    regulations: [
      'GDPR',
      'Dutch Implementation Act GDPR (UAVG)',
      'Consumer Protection Authority (ACM)'
    ],
    culturalNotes: [
      'Direct and pragmatic communication',
      'High English proficiency',
      'Environmental consciousness',
      'Value transparency and honesty',
      'Cycling culture (logistics consideration)'
    ],
    businessCulture: {
      formalityLevel: 'low',
      communicationStyle: 'Direct, egalitarian, consensus-seeking',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Transparency and honesty',
        'Value for money',
        'Sustainability',
        'Efficiency',
        'Consensus building'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'mature'
  }
];

// ================================================================
// LATIN AMERICA CONTEXT
// ================================================================

const LATAM_COUNTRIES: CountryContext[] = [
  {
    countryCode: 'MX',
    countryName: 'Mexico',
    localName: 'México',
    primaryLanguage: 'Spanish',
    currency: 'MXN',
    currencySymbol: '$',
    timezone: 'America/Mexico_City',
    regulations: [
      'Ley Federal de Protección de Datos Personales (LFPDPPP)',
      'PROFECO (Consumer Protection)',
      'SAT (Tax Administration)',
      'COFEPRIS (Health Products)',
      'NOM Standards'
    ],
    culturalNotes: [
      'Relationship-focused business culture',
      'Hierarchical decision making',
      'Cash still important for transactions',
      'Growing e-commerce adoption',
      'US cultural influence significant',
      'Regional variation in preferences'
    ],
    businessCulture: {
      formalityLevel: 'high',
      communicationStyle: 'Warm, respectful, relationship-oriented',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Personal relationships',
        'Trust and reputation',
        'Respect for hierarchy',
        'Local market adaptation',
        'Payment flexibility (installments)'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'growing'
  },
  {
    countryCode: 'BR',
    countryName: 'Brazil',
    localName: 'Brasil',
    primaryLanguage: 'Portuguese',
    currency: 'BRL',
    currencySymbol: 'R$',
    timezone: 'America/Sao_Paulo',
    regulations: [
      'LGPD (Lei Geral de Proteção de Dados)',
      'Consumer Defense Code (CDC)',
      'PROCON',
      'ANVISA (Health)',
      'Central Bank regulations'
    ],
    culturalNotes: [
      'Largest market in Latin America',
      'Portuguese language essential',
      'Relationship and trust crucial',
      'Installment payments (parcelamento) expected',
      'Bureaucratic processes common',
      'Regional diversity significant'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Warm, personal, flexible',
      decisionMakingSpeed: 'slow',
      importantFactors: [
        'Personal connections (jeitinho)',
        'Trust building over time',
        'Local market adaptation',
        'Payment installment options',
        'Portuguese language support'
      ]
    },
    marketSize: 'large',
    ecommerceMaturity: 'growing'
  },
  {
    countryCode: 'AR',
    countryName: 'Argentina',
    localName: 'Argentina',
    primaryLanguage: 'Spanish',
    currency: 'ARS',
    currencySymbol: '$',
    timezone: 'America/Argentina/Buenos_Aires',
    regulations: [
      'Personal Data Protection Law (PDPL)',
      'Consumer Defense Law',
      'Central Bank currency regulations',
      'AFIP (Tax Administration)'
    ],
    culturalNotes: [
      'European cultural influences',
      'Sophisticated consumer base',
      'Currency volatility awareness',
      'Strong professional services sector',
      'Passionate about local brands'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Expressive, intellectual, debate-friendly',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Intellectual credibility',
        'Quality and sophistication',
        'Price-value relationship',
        'Currency considerations',
        'Personal relationships'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'growing'
  },
  {
    countryCode: 'CO',
    countryName: 'Colombia',
    localName: 'Colombia',
    primaryLanguage: 'Spanish',
    currency: 'COP',
    currencySymbol: '$',
    timezone: 'America/Bogota',
    regulations: [
      'Law 1581 (Data Protection)',
      'Consumer Protection Statute',
      'SIC (Superintendency of Industry and Commerce)',
      'Superintendency of Finance'
    ],
    culturalNotes: [
      'Growing middle class',
      'Warm and friendly culture',
      'Regional diversity (costeño vs. cachaco)',
      'Mobile-first internet users',
      'Strong entrepreneurship culture'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Friendly, respectful, indirect',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Personal relationships',
        'Trust and credibility',
        'Customer service quality',
        'Local references',
        'Flexible payment options'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'growing'
  },
  {
    countryCode: 'CL',
    countryName: 'Chile',
    localName: 'Chile',
    primaryLanguage: 'Spanish',
    currency: 'CLP',
    currencySymbol: '$',
    timezone: 'America/Santiago',
    regulations: [
      'Law 19.628 (Data Protection)',
      'Consumer Protection Law',
      'SERNAC',
      'CMF (Financial Market Commission)'
    ],
    culturalNotes: [
      'Most developed economy in LATAM',
      'Conservative business culture',
      'High digital adoption',
      'Strong banking sector',
      'European business influence'
    ],
    businessCulture: {
      formalityLevel: 'high',
      communicationStyle: 'Reserved, formal, methodical',
      decisionMakingSpeed: 'slow',
      importantFactors: [
        'Professionalism and formality',
        'Track record and stability',
        'Compliance and governance',
        'Quality over price',
        'Long-term relationships'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'mature'
  },
  {
    countryCode: 'PE',
    countryName: 'Peru',
    localName: 'Perú',
    primaryLanguage: 'Spanish',
    secondaryLanguages: ['Quechua', 'Aymara'],
    currency: 'PEN',
    currencySymbol: 'S/',
    timezone: 'America/Lima',
    regulations: [
      'Personal Data Protection Law (Law 29733)',
      'Consumer Protection Code',
      'INDECOPI'
    ],
    culturalNotes: [
      'Growing digital economy',
      'Lima-centric market',
      'Proud cultural heritage',
      'Rising middle class',
      'Mobile commerce growth'
    ],
    businessCulture: {
      formalityLevel: 'medium',
      communicationStyle: 'Polite, indirect, relationship-oriented',
      decisionMakingSpeed: 'moderate',
      importantFactors: [
        'Personal relationships',
        'Reputation and trust',
        'Local market understanding',
        'Flexible terms',
        'Customer service'
      ]
    },
    marketSize: 'medium',
    ecommerceMaturity: 'growing'
  }
];

// ================================================================
// GEOGRAPHIC REGIONS
// ================================================================

export const GEOGRAPHIC_REGIONS: Record<string, GeographicRegion> = {
  'us': {
    regionId: 'us',
    regionName: 'United States',
    countries: [US_CONTEXT],
    commonRegulations: [
      'FTC Guidelines',
      'State-specific consumer protection',
      'Industry-specific federal regulations'
    ],
    culturalConsiderations: [
      'Diverse regional preferences (East Coast, West Coast, Midwest, South)',
      'Multicultural consumer base',
      'Strong influence of reviews and ratings'
    ],
    languageConsiderations: [
      'English primary, Spanish growing importance',
      'Informal communication style acceptable',
      'Regional dialects and preferences'
    ]
  },
  'eu': {
    regionId: 'eu',
    regionName: 'European Union',
    countries: EU_COUNTRIES,
    commonRegulations: [
      'GDPR (General Data Protection Regulation)',
      'Consumer Rights Directive',
      'E-commerce Directive',
      'Digital Services Act',
      'Digital Markets Act'
    ],
    culturalConsiderations: [
      'Strong privacy consciousness',
      'Preference for local/EU companies',
      'Environmental awareness',
      'Work-life balance valued',
      'Multi-language requirements'
    ],
    languageConsiderations: [
      'Local language essential for most markets',
      'English widely understood but local preferred',
      'Cultural nuances in translation critical',
      'Formal vs informal address varies by country'
    ]
  },
  'latam': {
    regionId: 'latam',
    regionName: 'Latin America',
    countries: LATAM_COUNTRIES,
    commonRegulations: [
      'Data protection laws (varies by country)',
      'Consumer protection regulations',
      'Currency and payment regulations',
      'Import/customs considerations'
    ],
    culturalConsiderations: [
      'Relationship-based business culture',
      'Family and community importance',
      'Growing digital adoption',
      'Price sensitivity with quality expectations',
      'Installment payments expected'
    ],
    languageConsiderations: [
      'Spanish dominant (Portuguese for Brazil)',
      'Regional Spanish variations',
      'Warm and personal communication style',
      'Formal titles often expected'
    ]
  }
};

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get geographic region by ID
 */
export function getGeographicRegion(regionId: string): GeographicRegion | null {
  return GEOGRAPHIC_REGIONS[regionId.toLowerCase()] || null;
}

/**
 * Get country context by country code
 */
export function getCountryContext(countryCode: string): CountryContext | null {
  const code = countryCode.toUpperCase();

  // Check US
  if (code === 'US') {
    return US_CONTEXT;
  }

  // Check EU countries
  const euCountry = EU_COUNTRIES.find(c => c.countryCode === code);
  if (euCountry) {
    return euCountry;
  }

  // Check LATAM countries
  const latamCountry = LATAM_COUNTRIES.find(c => c.countryCode === code);
  if (latamCountry) {
    return latamCountry;
  }

  return null;
}

/**
 * Get region for a country code
 */
export function getRegionForCountry(countryCode: string): string | null {
  const code = countryCode.toUpperCase();

  if (code === 'US') return 'us';

  if (EU_COUNTRIES.some(c => c.countryCode === code)) return 'eu';

  if (LATAM_COUNTRIES.some(c => c.countryCode === code)) return 'latam';

  return null;
}

/**
 * Get all supported country codes
 */
export function getSupportedCountryCodes(): string[] {
  return [
    'US',
    ...EU_COUNTRIES.map(c => c.countryCode),
    ...LATAM_COUNTRIES.map(c => c.countryCode)
  ];
}

/**
 * Get all supported regions
 */
export function getSupportedRegions(): string[] {
  return Object.keys(GEOGRAPHIC_REGIONS);
}

/**
 * Check if a country code is supported
 */
export function isCountrySupported(countryCode: string): boolean {
  return getSupportedCountryCodes().includes(countryCode.toUpperCase());
}

/**
 * Get regulations for a country
 */
export function getCountryRegulations(countryCode: string): string[] {
  const country = getCountryContext(countryCode);
  return country?.regulations || [];
}

/**
 * Get cultural notes for a country
 */
export function getCountryCulturalNotes(countryCode: string): string[] {
  const country = getCountryContext(countryCode);
  return country?.culturalNotes || [];
}

/**
 * Get business culture notes for a country
 */
export function getBusinessCulture(countryCode: string): BusinessCultureNotes | null {
  const country = getCountryContext(countryCode);
  return country?.businessCulture || null;
}

/**
 * Build geographic context string for prompts
 */
export function buildGeographicContext(variables: GeographicPromptVariables): string {
  const parts: string[] = [];

  if (variables.country || variables.countryCode) {
    const country = variables.countryCode
      ? getCountryContext(variables.countryCode)
      : null;

    if (country) {
      parts.push(`**Geographic Market:** ${country.countryName}`);
      parts.push(`**Primary Language:** ${country.primaryLanguage}`);
      parts.push(`**Currency:** ${country.currency} (${country.currencySymbol})`);

      if (country.regulations.length > 0) {
        parts.push(`**Key Regulations:** ${country.regulations.slice(0, 5).join(', ')}`);
      }

      if (country.businessCulture) {
        parts.push(`**Business Culture:** ${country.businessCulture.communicationStyle}`);
        parts.push(`**Decision Making:** ${country.businessCulture.decisionMakingSpeed} pace`);
      }

      if (country.culturalNotes.length > 0) {
        parts.push('\n**Cultural Considerations:**');
        country.culturalNotes.slice(0, 4).forEach(note => {
          parts.push(`- ${note}`);
        });
      }
    } else if (variables.country) {
      parts.push(`**Geographic Context:** ${variables.country}`);
    }
  }

  if (variables.region) {
    const region = getGeographicRegion(variables.region);
    if (region) {
      parts.push(`\n**Regional Context:** ${region.regionName}`);
      if (region.commonRegulations.length > 0) {
        parts.push(`**Common Regulations:** ${region.commonRegulations.slice(0, 3).join(', ')}`);
      }
    }
  }

  if (variables.language) {
    parts.push(`**Language Preference:** ${variables.language}`);
  }

  if (variables.currency && !variables.countryCode) {
    parts.push(`**Currency:** ${variables.currency}`);
  }

  return parts.join('\n');
}

/**
 * Get localized prompt adjustments
 */
export function getLocalizedPromptAdjustments(countryCode: string): string[] {
  const country = getCountryContext(countryCode);
  if (!country) return [];

  const adjustments: string[] = [];

  // Formality level
  if (country.businessCulture.formalityLevel === 'high') {
    adjustments.push('Use formal language and professional tone');
    adjustments.push('Address with proper titles when relevant');
  } else if (country.businessCulture.formalityLevel === 'low') {
    adjustments.push('Casual, direct communication is acceptable');
  }

  // Decision making
  if (country.businessCulture.decisionMakingSpeed === 'slow') {
    adjustments.push('Emphasize thoroughness and detailed information');
    adjustments.push('Highlight long-term value over quick wins');
  } else if (country.businessCulture.decisionMakingSpeed === 'fast') {
    adjustments.push('Provide concise, actionable recommendations');
    adjustments.push('Focus on immediate ROI and quick implementation');
  }

  // E-commerce maturity
  if (country.ecommerceMaturity === 'emerging') {
    adjustments.push('Consider offline/hybrid purchasing behaviors');
    adjustments.push('Payment method diversity is important');
  }

  // Language
  if (country.primaryLanguage !== 'English') {
    adjustments.push(`Consider local language (${country.primaryLanguage}) capabilities`);
  }

  // Important factors
  country.businessCulture.importantFactors.forEach(factor => {
    adjustments.push(`Key factor: ${factor}`);
  });

  return adjustments;
}

// ================================================================
// EXPORTS
// ================================================================

export {
  US_CONTEXT,
  EU_COUNTRIES,
  LATAM_COUNTRIES
};
