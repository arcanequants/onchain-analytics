/**
 * Competitor Tier Schema Module
 * Phase 1, Week 2, Day 5 - Domain Tasks
 *
 * Provides competitor classification into tiers: Enterprise, Mid-Market, SMB, Local
 */

// ================================================================
// TYPES
// ================================================================

export type CompetitorTier = 'enterprise' | 'mid-market' | 'smb' | 'local';

export interface TierDefinition {
  tier: CompetitorTier;
  name: string;
  description: string;
  characteristics: TierCharacteristics;
  indicators: TierIndicators;
  aiQueryContext: string;
}

export interface TierCharacteristics {
  revenueRange: { min: number | null; max: number | null; currency: string };
  employeeRange: { min: number | null; max: number | null };
  customerBase: string;
  marketReach: string;
  fundingStage?: string[];
  typicalCompanies: string[];
}

export interface TierIndicators {
  websiteSignals: string[];
  contentSignals: string[];
  socialProof: string[];
  pricingSignals: string[];
}

export interface CompetitorProfile {
  name: string;
  url?: string;
  tier: CompetitorTier;
  tierConfidence: number;
  tierIndicators: string[];
  industrySlug?: string;
  detectedAt: Date;
}

export interface TierClassificationResult {
  tier: CompetitorTier;
  confidence: number;
  matchedIndicators: string[];
  suggestedAlternatives?: { tier: CompetitorTier; confidence: number }[];
}

// ================================================================
// TIER DEFINITIONS
// ================================================================

export const TIER_DEFINITIONS: Record<CompetitorTier, TierDefinition> = {
  enterprise: {
    tier: 'enterprise',
    name: 'Enterprise',
    description: 'Large-scale organizations with significant market presence, extensive resources, and global reach.',
    characteristics: {
      revenueRange: { min: 100000000, max: null, currency: 'USD' },
      employeeRange: { min: 1000, max: null },
      customerBase: 'Fortune 500, large corporations, government agencies',
      marketReach: 'Global or multi-national',
      fundingStage: ['Series D+', 'Public', 'PE-backed'],
      typicalCompanies: ['Salesforce', 'Microsoft', 'Oracle', 'SAP', 'IBM']
    },
    indicators: {
      websiteSignals: [
        'Enterprise-specific landing pages',
        'Custom pricing / "Contact sales"',
        'Case studies with Fortune 500 companies',
        'SOC 2, ISO 27001, HIPAA certifications prominently displayed',
        'Global office locations',
        'Security and compliance center',
        'Professional services offerings'
      ],
      contentSignals: [
        'Enterprise whitepapers and reports',
        'Industry analyst coverage (Gartner, Forrester)',
        'Large conference sponsorships',
        'C-suite executive content',
        'Multi-year digital transformation messaging'
      ],
      socialProof: [
        'Logos of Fortune 500 companies',
        'Testimonials from C-suite executives',
        'Awards from enterprise-focused publications',
        'Government contracts mentioned',
        'Public company filings (if applicable)'
      ],
      pricingSignals: [
        'No public pricing',
        '"Enterprise" tier prominently featured',
        'Annual contracts required',
        'Custom implementation mentioned',
        'Professional services fees'
      ]
    },
    aiQueryContext: 'When comparing against enterprise competitors, focus on scalability, security certifications, implementation support, SLAs, and enterprise integration capabilities. Enterprise buyers prioritize stability, vendor reputation, and comprehensive support.'
  },

  'mid-market': {
    tier: 'mid-market',
    name: 'Mid-Market',
    description: 'Growing companies with established market presence, professional operations, and regional or national reach.',
    characteristics: {
      revenueRange: { min: 10000000, max: 100000000, currency: 'USD' },
      employeeRange: { min: 100, max: 1000 },
      customerBase: 'Mid-size businesses, growing startups, regional enterprises',
      marketReach: 'National or multi-regional',
      fundingStage: ['Series B', 'Series C', 'Growth equity'],
      typicalCompanies: ['HubSpot', 'Zendesk', 'Asana', 'Monday.com', 'Mailchimp']
    },
    indicators: {
      websiteSignals: [
        'Multiple pricing tiers displayed',
        'Self-serve and sales-assisted options',
        'Customer success team mentioned',
        'Integration marketplace',
        'Multiple use case pages',
        'ROI calculators'
      ],
      contentSignals: [
        'Industry-specific content',
        'Webinars and virtual events',
        'Customer community forums',
        'Educational blog content',
        'Template libraries'
      ],
      socialProof: [
        'Customer count displayed (1,000-50,000)',
        'Industry-specific case studies',
        'G2, Capterra, TrustRadius reviews',
        'Customer testimonials with titles',
        'Funding announcements'
      ],
      pricingSignals: [
        'Tiered pricing (Basic/Pro/Business)',
        'Monthly and annual options',
        'Per-user or per-seat pricing',
        'Free trial prominently offered',
        'Some enterprise features gated'
      ]
    },
    aiQueryContext: 'When comparing against mid-market competitors, focus on ease of implementation, time-to-value, growth scalability, integration ecosystem, and customer success support. Mid-market buyers balance functionality with cost efficiency.'
  },

  smb: {
    tier: 'smb',
    name: 'SMB',
    description: 'Small and medium businesses offering focused solutions with streamlined operations and accessible pricing.',
    characteristics: {
      revenueRange: { min: 1000000, max: 10000000, currency: 'USD' },
      employeeRange: { min: 10, max: 100 },
      customerBase: 'Small businesses, startups, freelancers, small teams',
      marketReach: 'Regional or niche-focused',
      fundingStage: ['Seed', 'Series A', 'Bootstrapped'],
      typicalCompanies: ['Calendly', 'Notion', 'Loom', 'Airtable', 'Zapier']
    },
    indicators: {
      websiteSignals: [
        'Simple, straightforward pricing',
        'Freemium model available',
        'Quick signup / no demo required',
        'Product-led growth focus',
        'Self-service onboarding',
        'Template-first approach'
      ],
      contentSignals: [
        'How-to guides and tutorials',
        'YouTube presence',
        'Social media marketing focus',
        'User-generated content',
        'Community-driven development'
      ],
      socialProof: [
        'User count prominently displayed',
        'Product Hunt presence',
        'App store ratings',
        'Twitter/social following',
        'Individual user testimonials'
      ],
      pricingSignals: [
        'Free tier available',
        'Low starting price (<$50/month)',
        'Credit card signup',
        'No sales call required',
        'Monthly billing default'
      ]
    },
    aiQueryContext: 'When comparing against SMB competitors, focus on ease of use, quick setup, affordable pricing, and specific feature comparisons. SMB buyers prioritize simplicity, immediate value, and low commitment.'
  },

  local: {
    tier: 'local',
    name: 'Local',
    description: 'Local businesses serving specific geographic areas with personalized service and community presence.',
    characteristics: {
      revenueRange: { min: null, max: 1000000, currency: 'USD' },
      employeeRange: { min: 1, max: 10 },
      customerBase: 'Local customers, neighborhood community',
      marketReach: 'Single city or neighborhood',
      fundingStage: ['Self-funded', 'Friends & family'],
      typicalCompanies: ['Local restaurants', 'Independent retailers', 'Professional services firms', 'Local service providers']
    },
    indicators: {
      websiteSignals: [
        'Physical address prominently displayed',
        'Google Maps integration',
        'Local phone number',
        'Hours of operation',
        'Service area defined',
        'Local SEO focus'
      ],
      contentSignals: [
        'Community involvement',
        'Local event participation',
        'Neighborhood focus',
        'Personal owner story',
        'Local news mentions'
      ],
      socialProof: [
        'Google Business reviews',
        'Yelp ratings',
        'Local awards',
        'BBB membership',
        'Chamber of Commerce',
        'Neighborhood testimonials'
      ],
      pricingSignals: [
        'Service-based pricing',
        'Quote-based for services',
        'Menu/catalog pricing',
        'Local competitive pricing',
        'Cash/check accepted'
      ]
    },
    aiQueryContext: 'When comparing against local competitors, focus on reputation, proximity, personal service, community involvement, and local expertise. Local buyers prioritize trust, convenience, and supporting local businesses.'
  }
};

// ================================================================
// CLASSIFICATION FUNCTIONS
// ================================================================

/**
 * Classify a competitor into a tier based on signals
 */
export function classifyCompetitor(signals: {
  revenue?: number;
  employees?: number;
  customerCount?: number;
  hasFreeTriad?: boolean;
  hasPublicPricing?: boolean;
  hasEnterpriseFeatures?: boolean;
  isLocal?: boolean;
  websiteSignals?: string[];
}): TierClassificationResult {
  const scores: Record<CompetitorTier, { score: number; indicators: string[] }> = {
    enterprise: { score: 0, indicators: [] },
    'mid-market': { score: 0, indicators: [] },
    smb: { score: 0, indicators: [] },
    local: { score: 0, indicators: [] }
  };

  // Revenue-based classification
  if (signals.revenue !== undefined) {
    if (signals.revenue >= 100000000) {
      scores.enterprise.score += 40;
      scores.enterprise.indicators.push('Revenue $100M+');
    } else if (signals.revenue >= 10000000) {
      scores['mid-market'].score += 40;
      scores['mid-market'].indicators.push('Revenue $10M-$100M');
    } else if (signals.revenue >= 1000000) {
      scores.smb.score += 40;
      scores.smb.indicators.push('Revenue $1M-$10M');
    } else {
      scores.local.score += 40;
      scores.local.indicators.push('Revenue <$1M');
    }
  }

  // Employee-based classification
  if (signals.employees !== undefined) {
    if (signals.employees >= 1000) {
      scores.enterprise.score += 30;
      scores.enterprise.indicators.push('1000+ employees');
    } else if (signals.employees >= 100) {
      scores['mid-market'].score += 30;
      scores['mid-market'].indicators.push('100-1000 employees');
    } else if (signals.employees >= 10) {
      scores.smb.score += 30;
      scores.smb.indicators.push('10-100 employees');
    } else {
      scores.local.score += 30;
      scores.local.indicators.push('<10 employees');
    }
  }

  // Customer count
  if (signals.customerCount !== undefined) {
    if (signals.customerCount >= 10000) {
      scores.enterprise.score += 15;
      scores.enterprise.indicators.push('10,000+ customers');
    } else if (signals.customerCount >= 1000) {
      scores['mid-market'].score += 15;
      scores['mid-market'].indicators.push('1,000-10,000 customers');
    } else if (signals.customerCount >= 100) {
      scores.smb.score += 15;
      scores.smb.indicators.push('100-1,000 customers');
    } else {
      scores.local.score += 15;
      scores.local.indicators.push('<100 customers');
    }
  }

  // Pricing signals
  if (signals.hasPublicPricing === false) {
    scores.enterprise.score += 10;
    scores.enterprise.indicators.push('No public pricing');
  } else if (signals.hasPublicPricing === true && signals.hasFreeTriad) {
    scores.smb.score += 10;
    scores.smb.indicators.push('Public pricing + free trial');
  }

  // Enterprise features
  if (signals.hasEnterpriseFeatures) {
    scores.enterprise.score += 10;
    scores['mid-market'].score += 5;
    scores.enterprise.indicators.push('Enterprise features available');
  }

  // Local signals
  if (signals.isLocal) {
    scores.local.score += 50;
    scores.local.indicators.push('Local business indicators');
  }

  // Check website signals
  if (signals.websiteSignals) {
    for (const signal of signals.websiteSignals) {
      const signalLower = signal.toLowerCase();

      if (signalLower.includes('fortune 500') || signalLower.includes('enterprise')) {
        scores.enterprise.score += 5;
        scores.enterprise.indicators.push(signal);
      }
      if (signalLower.includes('free trial') || signalLower.includes('freemium')) {
        scores.smb.score += 5;
        scores.smb.indicators.push(signal);
      }
      if (signalLower.includes('local') || signalLower.includes('neighborhood')) {
        scores.local.score += 5;
        scores.local.indicators.push(signal);
      }
    }
  }

  // Find winning tier
  const sortedTiers = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score);

  const [winningTier, winningData] = sortedTiers[0];
  const totalScore = Object.values(scores).reduce((sum, t) => sum + t.score, 0);
  const confidence = totalScore > 0
    ? Math.min(winningData.score / totalScore, 0.99)
    : 0.25;

  // Get alternatives
  const alternatives = sortedTiers
    .slice(1)
    .filter(([_, data]) => data.score > 0)
    .map(([tier, data]) => ({
      tier: tier as CompetitorTier,
      confidence: totalScore > 0 ? data.score / totalScore : 0.25
    }));

  return {
    tier: winningTier as CompetitorTier,
    confidence: Math.round(confidence * 100) / 100,
    matchedIndicators: winningData.indicators,
    suggestedAlternatives: alternatives.length > 0 ? alternatives : undefined
  };
}

/**
 * Get tier definition by tier ID
 */
export function getTierDefinition(tier: CompetitorTier): TierDefinition {
  return TIER_DEFINITIONS[tier];
}

/**
 * Get all tier definitions
 */
export function getAllTierDefinitions(): TierDefinition[] {
  return Object.values(TIER_DEFINITIONS);
}

/**
 * Get AI query context for a tier
 */
export function getTierQueryContext(tier: CompetitorTier): string {
  return TIER_DEFINITIONS[tier].aiQueryContext;
}

/**
 * Get tier indicators for detection
 */
export function getTierIndicators(tier: CompetitorTier): TierIndicators {
  return TIER_DEFINITIONS[tier].indicators;
}

/**
 * Get tier characteristics
 */
export function getTierCharacteristics(tier: CompetitorTier): TierCharacteristics {
  return TIER_DEFINITIONS[tier].characteristics;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: CompetitorTier): string {
  return TIER_DEFINITIONS[tier].name;
}

/**
 * Get all tier IDs
 */
export function getAllTierIds(): CompetitorTier[] {
  return ['enterprise', 'mid-market', 'smb', 'local'];
}

/**
 * Build competitor context for prompts
 */
export function buildCompetitorTierContext(competitors: CompetitorProfile[]): string {
  if (competitors.length === 0) {
    return '';
  }

  const byTier = new Map<CompetitorTier, CompetitorProfile[]>();

  competitors.forEach(comp => {
    const existing = byTier.get(comp.tier) || [];
    existing.push(comp);
    byTier.set(comp.tier, existing);
  });

  const lines = ['**Competitive Landscape:**'];

  for (const tier of getAllTierIds()) {
    const tierCompetitors = byTier.get(tier);
    if (tierCompetitors && tierCompetitors.length > 0) {
      lines.push(`\n*${getTierDisplayName(tier)} Competitors:*`);
      tierCompetitors.forEach(comp => {
        lines.push(`- ${comp.name}${comp.url ? ` (${comp.url})` : ''}`);
      });
    }
  }

  return lines.join('\n');
}

/**
 * Validate tier ID
 */
export function isValidTier(tier: string): tier is CompetitorTier {
  return getAllTierIds().includes(tier as CompetitorTier);
}
