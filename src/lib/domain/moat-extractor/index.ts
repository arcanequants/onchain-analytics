/**
 * Moat Extractor Module
 * Phase 1, Week 2, Day 6 - Domain Tasks
 *
 * Extracts and analyzes competitive moats (unique selling points)
 * from brand descriptions, websites, and market positioning.
 */

// ================================================================
// TYPES
// ================================================================

export type MoatCategory =
  | 'network-effects'
  | 'switching-costs'
  | 'cost-advantages'
  | 'intangible-assets'
  | 'efficient-scale'
  | 'data-moat'
  | 'technology'
  | 'brand'
  | 'regulatory'
  | 'ecosystem';

export type MoatStrength = 'strong' | 'moderate' | 'weak' | 'potential';

export interface Moat {
  category: MoatCategory;
  name: string;
  description: string;
  strength: MoatStrength;
  evidence: string[];
  durability: 'long-term' | 'medium-term' | 'short-term';
  threats: string[];
}

export interface MoatAnalysis {
  brandName: string;
  industrySlug: string;
  overallMoatScore: number;
  moats: Moat[];
  weaknesses: string[];
  competitivePosition: 'dominant' | 'strong' | 'moderate' | 'weak' | 'vulnerable';
  sustainabilityOutlook: string;
  recommendations: string[];
}

export interface MoatSignal {
  signal: string;
  category: MoatCategory;
  strengthIndicator: MoatStrength;
  weight: number;
}

export interface ExtractionInput {
  brandName: string;
  industrySlug: string;
  description?: string;
  features?: string[];
  customerCount?: number;
  marketShare?: number;
  yearsInBusiness?: number;
  patents?: number;
  integrations?: number;
  userGeneratedContent?: boolean;
  apiAvailable?: boolean;
  dataAdvantage?: boolean;
  regulatoryApprovals?: string[];
  brandRecognition?: 'high' | 'medium' | 'low';
  pricingPower?: boolean;
}

// ================================================================
// MOAT CATEGORY DEFINITIONS
// ================================================================

export const MOAT_CATEGORIES: Record<MoatCategory, {
  name: string;
  description: string;
  examples: string[];
  industryRelevance: Record<string, number>;
}> = {
  'network-effects': {
    name: 'Network Effects',
    description: 'Value increases as more users join the platform',
    examples: ['Social networks', 'Marketplaces', 'Payment networks', 'Communication tools'],
    industryRelevance: {
      saas: 0.7,
      fintech: 0.8,
      ecommerce: 0.9,
      marketing: 0.5,
      healthcare: 0.3,
      'real-estate': 0.6,
      legal: 0.2,
      education: 0.6,
      hospitality: 0.7,
      restaurant: 0.5
    }
  },
  'switching-costs': {
    name: 'Switching Costs',
    description: 'High costs for customers to switch to competitors',
    examples: ['Data migration', 'Workflow disruption', 'Learning curve', 'Integration dependencies'],
    industryRelevance: {
      saas: 0.9,
      fintech: 0.7,
      ecommerce: 0.4,
      marketing: 0.6,
      healthcare: 0.8,
      'real-estate': 0.3,
      legal: 0.5,
      education: 0.4,
      hospitality: 0.2,
      restaurant: 0.1
    }
  },
  'cost-advantages': {
    name: 'Cost Advantages',
    description: 'Lower costs than competitors due to scale or efficiency',
    examples: ['Economies of scale', 'Proprietary processes', 'Geographic advantages', 'Vertical integration'],
    industryRelevance: {
      saas: 0.6,
      fintech: 0.7,
      ecommerce: 0.9,
      marketing: 0.5,
      healthcare: 0.5,
      'real-estate': 0.4,
      legal: 0.3,
      education: 0.6,
      hospitality: 0.7,
      restaurant: 0.6
    }
  },
  'intangible-assets': {
    name: 'Intangible Assets',
    description: 'Patents, trademarks, and proprietary knowledge',
    examples: ['Patents', 'Trade secrets', 'Proprietary algorithms', 'Exclusive licenses'],
    industryRelevance: {
      saas: 0.6,
      fintech: 0.7,
      ecommerce: 0.4,
      marketing: 0.5,
      healthcare: 0.9,
      'real-estate': 0.3,
      legal: 0.4,
      education: 0.5,
      hospitality: 0.3,
      restaurant: 0.4
    }
  },
  'efficient-scale': {
    name: 'Efficient Scale',
    description: 'Market size limits profitable competition',
    examples: ['Natural monopolies', 'Niche dominance', 'Geographic exclusivity', 'Regulatory barriers'],
    industryRelevance: {
      saas: 0.5,
      fintech: 0.6,
      ecommerce: 0.4,
      marketing: 0.4,
      healthcare: 0.7,
      'real-estate': 0.6,
      legal: 0.5,
      education: 0.5,
      hospitality: 0.5,
      restaurant: 0.4
    }
  },
  'data-moat': {
    name: 'Data Moat',
    description: 'Proprietary data that improves product/service over time',
    examples: ['User behavior data', 'Training data for ML', 'Industry benchmarks', 'Exclusive datasets'],
    industryRelevance: {
      saas: 0.8,
      fintech: 0.9,
      ecommerce: 0.8,
      marketing: 0.9,
      healthcare: 0.7,
      'real-estate': 0.6,
      legal: 0.4,
      education: 0.7,
      hospitality: 0.6,
      restaurant: 0.5
    }
  },
  technology: {
    name: 'Technology Advantage',
    description: 'Superior technology that is difficult to replicate',
    examples: ['Proprietary algorithms', 'Infrastructure advantages', 'AI/ML capabilities', 'Technical debt of competitors'],
    industryRelevance: {
      saas: 0.9,
      fintech: 0.8,
      ecommerce: 0.6,
      marketing: 0.7,
      healthcare: 0.7,
      'real-estate': 0.4,
      legal: 0.5,
      education: 0.7,
      hospitality: 0.4,
      restaurant: 0.3
    }
  },
  brand: {
    name: 'Brand Power',
    description: 'Strong brand recognition and customer loyalty',
    examples: ['Brand recognition', 'Trust', 'Emotional connection', 'Premium positioning'],
    industryRelevance: {
      saas: 0.6,
      fintech: 0.8,
      ecommerce: 0.7,
      marketing: 0.7,
      healthcare: 0.8,
      'real-estate': 0.6,
      legal: 0.7,
      education: 0.8,
      hospitality: 0.9,
      restaurant: 0.9
    }
  },
  regulatory: {
    name: 'Regulatory Moat',
    description: 'Regulatory approvals or compliance barriers',
    examples: ['Licenses', 'Certifications', 'Compliance requirements', 'Government contracts'],
    industryRelevance: {
      saas: 0.4,
      fintech: 0.9,
      ecommerce: 0.3,
      marketing: 0.3,
      healthcare: 0.9,
      'real-estate': 0.5,
      legal: 0.8,
      education: 0.6,
      hospitality: 0.4,
      restaurant: 0.4
    }
  },
  ecosystem: {
    name: 'Ecosystem Lock-in',
    description: 'Comprehensive ecosystem that increases stickiness',
    examples: ['Integration marketplace', 'Developer community', 'Partner network', 'Content ecosystem'],
    industryRelevance: {
      saas: 0.9,
      fintech: 0.7,
      ecommerce: 0.8,
      marketing: 0.8,
      healthcare: 0.5,
      'real-estate': 0.5,
      legal: 0.4,
      education: 0.6,
      hospitality: 0.6,
      restaurant: 0.5
    }
  }
};

// ================================================================
// MOAT SIGNALS DATABASE
// ================================================================

const MOAT_SIGNALS: MoatSignal[] = [
  // Network Effects
  { signal: 'marketplace', category: 'network-effects', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'two-sided platform', category: 'network-effects', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'user community', category: 'network-effects', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'viral growth', category: 'network-effects', strengthIndicator: 'moderate', weight: 0.7 },
  { signal: 'network effect', category: 'network-effects', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'more users', category: 'network-effects', strengthIndicator: 'moderate', weight: 0.5 },

  // Switching Costs
  { signal: 'data migration', category: 'switching-costs', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'workflow', category: 'switching-costs', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'integration', category: 'switching-costs', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'api', category: 'switching-costs', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'embedded', category: 'switching-costs', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'system of record', category: 'switching-costs', strengthIndicator: 'strong', weight: 0.9 },

  // Cost Advantages
  { signal: 'lowest price', category: 'cost-advantages', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'economies of scale', category: 'cost-advantages', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'vertical integration', category: 'cost-advantages', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'automation', category: 'cost-advantages', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'efficiency', category: 'cost-advantages', strengthIndicator: 'moderate', weight: 0.5 },

  // Intangible Assets
  { signal: 'patent', category: 'intangible-assets', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'proprietary', category: 'intangible-assets', strengthIndicator: 'moderate', weight: 0.7 },
  { signal: 'trade secret', category: 'intangible-assets', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'exclusive', category: 'intangible-assets', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'trademark', category: 'intangible-assets', strengthIndicator: 'moderate', weight: 0.5 },

  // Data Moat
  { signal: 'ai', category: 'data-moat', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'machine learning', category: 'data-moat', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'data-driven', category: 'data-moat', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'analytics', category: 'data-moat', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'insights', category: 'data-moat', strengthIndicator: 'weak', weight: 0.4 },
  { signal: 'benchmark', category: 'data-moat', strengthIndicator: 'moderate', weight: 0.6 },

  // Technology
  { signal: 'technology leader', category: 'technology', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'innovative', category: 'technology', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'cutting-edge', category: 'technology', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'first-mover', category: 'technology', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'platform', category: 'technology', strengthIndicator: 'moderate', weight: 0.6 },

  // Brand
  { signal: 'trusted', category: 'brand', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'leading', category: 'brand', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'established', category: 'brand', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'premium', category: 'brand', strengthIndicator: 'strong', weight: 0.7 },
  { signal: 'reputation', category: 'brand', strengthIndicator: 'moderate', weight: 0.6 },

  // Regulatory
  { signal: 'compliance', category: 'regulatory', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'certified', category: 'regulatory', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'licensed', category: 'regulatory', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'regulated', category: 'regulatory', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'fda approved', category: 'regulatory', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'hipaa', category: 'regulatory', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'soc 2', category: 'regulatory', strengthIndicator: 'moderate', weight: 0.5 },

  // Ecosystem
  { signal: 'ecosystem', category: 'ecosystem', strengthIndicator: 'strong', weight: 0.9 },
  { signal: 'app store', category: 'ecosystem', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'marketplace', category: 'ecosystem', strengthIndicator: 'strong', weight: 0.8 },
  { signal: 'partner', category: 'ecosystem', strengthIndicator: 'moderate', weight: 0.6 },
  { signal: 'integration', category: 'ecosystem', strengthIndicator: 'moderate', weight: 0.5 },
  { signal: 'developer', category: 'ecosystem', strengthIndicator: 'moderate', weight: 0.6 }
];

// ================================================================
// EXTRACTION FUNCTIONS
// ================================================================

/**
 * Extract moats from text description
 */
export function extractMoatsFromText(
  text: string,
  industrySlug: string
): { category: MoatCategory; signals: string[]; strength: MoatStrength }[] {
  const textLower = text.toLowerCase();
  const found: Map<MoatCategory, { signals: string[]; totalWeight: number }> = new Map();

  for (const signal of MOAT_SIGNALS) {
    if (textLower.includes(signal.signal)) {
      const existing = found.get(signal.category) || { signals: [], totalWeight: 0 };
      existing.signals.push(signal.signal);
      existing.totalWeight += signal.weight;
      found.set(signal.category, existing);
    }
  }

  return Array.from(found.entries()).map(([category, data]) => {
    const industryRelevance = MOAT_CATEGORIES[category].industryRelevance[industrySlug] || 0.5;
    const adjustedWeight = data.totalWeight * industryRelevance;

    let strength: MoatStrength;
    if (adjustedWeight >= 1.5) strength = 'strong';
    else if (adjustedWeight >= 0.8) strength = 'moderate';
    else if (adjustedWeight >= 0.4) strength = 'weak';
    else strength = 'potential';

    return {
      category,
      signals: data.signals,
      strength
    };
  });
}

/**
 * Extract moats from structured input
 */
export function extractMoats(input: ExtractionInput): MoatAnalysis {
  const moats: Moat[] = [];
  const weaknesses: string[] = [];

  // Analyze based on input signals

  // Network Effects
  if (input.customerCount && input.customerCount > 10000) {
    const strength: MoatStrength = input.customerCount > 100000 ? 'strong' :
      input.customerCount > 50000 ? 'moderate' : 'weak';
    moats.push({
      category: 'network-effects',
      name: 'User Base Scale',
      description: `Large user base of ${input.customerCount.toLocaleString()} customers creates network value`,
      strength,
      evidence: [`${input.customerCount.toLocaleString()} customers`],
      durability: strength === 'strong' ? 'long-term' : 'medium-term',
      threats: ['Competitor growth', 'Market saturation', 'Churn']
    });
  }

  // Switching Costs
  if (input.integrations && input.integrations > 50) {
    const strength: MoatStrength = input.integrations > 200 ? 'strong' :
      input.integrations > 100 ? 'moderate' : 'weak';
    moats.push({
      category: 'switching-costs',
      name: 'Integration Ecosystem',
      description: `${input.integrations} integrations create high switching costs`,
      strength,
      evidence: [`${input.integrations} integrations available`],
      durability: 'long-term',
      threats: ['API standardization', 'Competitor integration parity']
    });
  }

  if (input.apiAvailable) {
    moats.push({
      category: 'switching-costs',
      name: 'API Lock-in',
      description: 'API availability enables deep workflow integration',
      strength: 'moderate',
      evidence: ['Public API available'],
      durability: 'medium-term',
      threats: ['Standardized APIs', 'Migration tools']
    });
  }

  // Data Moat
  if (input.dataAdvantage) {
    moats.push({
      category: 'data-moat',
      name: 'Proprietary Data',
      description: 'Unique data assets that improve product over time',
      strength: 'strong',
      evidence: ['Proprietary data collection'],
      durability: 'long-term',
      threats: ['Data privacy regulations', 'Competitor data collection']
    });
  }

  if (input.userGeneratedContent) {
    moats.push({
      category: 'data-moat',
      name: 'User Generated Content',
      description: 'User-created content compounds platform value',
      strength: 'moderate',
      evidence: ['User generated content platform'],
      durability: 'long-term',
      threats: ['Content portability', 'Platform competition']
    });
  }

  // Intangible Assets
  if (input.patents && input.patents > 0) {
    const strength: MoatStrength = input.patents > 50 ? 'strong' :
      input.patents > 10 ? 'moderate' : 'weak';
    moats.push({
      category: 'intangible-assets',
      name: 'Patent Portfolio',
      description: `${input.patents} patents protect key innovations`,
      strength,
      evidence: [`${input.patents} patents`],
      durability: 'medium-term',
      threats: ['Patent expiration', 'Design-around solutions', 'Patent challenges']
    });
  }

  // Brand
  if (input.brandRecognition === 'high') {
    moats.push({
      category: 'brand',
      name: 'Brand Recognition',
      description: 'Strong brand awareness and trust in market',
      strength: 'strong',
      evidence: ['High brand recognition'],
      durability: 'long-term',
      threats: ['Reputation damage', 'New entrant marketing']
    });
  } else if (input.brandRecognition === 'medium') {
    moats.push({
      category: 'brand',
      name: 'Brand Recognition',
      description: 'Moderate brand awareness in target market',
      strength: 'moderate',
      evidence: ['Medium brand recognition'],
      durability: 'medium-term',
      threats: ['Competitor branding', 'Market perception shifts']
    });
  }

  if (input.yearsInBusiness && input.yearsInBusiness > 10) {
    moats.push({
      category: 'brand',
      name: 'Established Track Record',
      description: `${input.yearsInBusiness} years of operating history`,
      strength: input.yearsInBusiness > 20 ? 'strong' : 'moderate',
      evidence: [`${input.yearsInBusiness} years in business`],
      durability: 'long-term',
      threats: ['Industry disruption', 'Perception of being outdated']
    });
  }

  // Regulatory
  if (input.regulatoryApprovals && input.regulatoryApprovals.length > 0) {
    const strength: MoatStrength = input.regulatoryApprovals.length > 3 ? 'strong' :
      input.regulatoryApprovals.length > 1 ? 'moderate' : 'weak';
    moats.push({
      category: 'regulatory',
      name: 'Regulatory Compliance',
      description: `Regulatory approvals: ${input.regulatoryApprovals.join(', ')}`,
      strength,
      evidence: input.regulatoryApprovals.map(r => `${r} compliance`),
      durability: 'long-term',
      threats: ['Regulatory changes', 'Competitor certification']
    });
  }

  // Market Share / Efficient Scale
  if (input.marketShare && input.marketShare > 30) {
    const strength: MoatStrength = input.marketShare > 50 ? 'strong' :
      input.marketShare > 40 ? 'moderate' : 'weak';
    moats.push({
      category: 'efficient-scale',
      name: 'Market Leadership',
      description: `${input.marketShare}% market share provides scale advantages`,
      strength,
      evidence: [`${input.marketShare}% market share`],
      durability: strength === 'strong' ? 'long-term' : 'medium-term',
      threats: ['Market disruption', 'New entrants', 'Antitrust concerns']
    });
  }

  // Pricing Power
  if (input.pricingPower) {
    moats.push({
      category: 'brand',
      name: 'Pricing Power',
      description: 'Ability to maintain premium pricing',
      strength: 'strong',
      evidence: ['Demonstrated pricing power'],
      durability: 'long-term',
      threats: ['Commoditization', 'Economic downturns']
    });
  }

  // Extract from description if provided
  if (input.description) {
    const textMoats = extractMoatsFromText(input.description, input.industrySlug);
    for (const tm of textMoats) {
      const exists = moats.some(m => m.category === tm.category);
      if (!exists) {
        moats.push({
          category: tm.category,
          name: MOAT_CATEGORIES[tm.category].name,
          description: `Detected from description: ${tm.signals.join(', ')}`,
          strength: tm.strength,
          evidence: tm.signals,
          durability: tm.strength === 'strong' ? 'long-term' : 'medium-term',
          threats: ['Requires deeper analysis']
        });
      }
    }
  }

  // Identify weaknesses
  const hasMoatCategory = (cat: MoatCategory) => moats.some(m => m.category === cat);

  if (!hasMoatCategory('network-effects') && !hasMoatCategory('switching-costs')) {
    weaknesses.push('Limited customer lock-in mechanisms');
  }
  if (!hasMoatCategory('data-moat') && !hasMoatCategory('technology')) {
    weaknesses.push('No clear technology or data advantage');
  }
  if (!hasMoatCategory('brand') && (!input.yearsInBusiness || input.yearsInBusiness < 5)) {
    weaknesses.push('Limited brand recognition or track record');
  }

  // Calculate overall score
  const moatScore = calculateMoatScore(moats, input.industrySlug);

  // Determine competitive position
  let competitivePosition: MoatAnalysis['competitivePosition'];
  if (moatScore >= 80) competitivePosition = 'dominant';
  else if (moatScore >= 60) competitivePosition = 'strong';
  else if (moatScore >= 40) competitivePosition = 'moderate';
  else if (moatScore >= 20) competitivePosition = 'weak';
  else competitivePosition = 'vulnerable';

  // Generate recommendations
  const recommendations = generateRecommendations(moats, weaknesses, input.industrySlug);

  return {
    brandName: input.brandName,
    industrySlug: input.industrySlug,
    overallMoatScore: moatScore,
    moats,
    weaknesses,
    competitivePosition,
    sustainabilityOutlook: generateSustainabilityOutlook(moats, competitivePosition),
    recommendations
  };
}

/**
 * Calculate overall moat score
 */
function calculateMoatScore(moats: Moat[], industrySlug: string): number {
  if (moats.length === 0) return 0;

  let totalScore = 0;
  let totalWeight = 0;

  for (const moat of moats) {
    const categoryData = MOAT_CATEGORIES[moat.category];
    const industryRelevance = categoryData.industryRelevance[industrySlug] || 0.5;

    const strengthScore =
      moat.strength === 'strong' ? 100 :
        moat.strength === 'moderate' ? 70 :
          moat.strength === 'weak' ? 40 : 20;

    const durabilityMultiplier =
      moat.durability === 'long-term' ? 1.2 :
        moat.durability === 'medium-term' ? 1.0 : 0.8;

    const weight = industryRelevance;
    totalScore += strengthScore * durabilityMultiplier * weight;
    totalWeight += weight;
  }

  return Math.min(Math.round(totalScore / totalWeight), 100);
}

/**
 * Generate sustainability outlook
 */
function generateSustainabilityOutlook(
  moats: Moat[],
  position: MoatAnalysis['competitivePosition']
): string {
  const strongMoats = moats.filter(m => m.strength === 'strong').length;
  const longTermMoats = moats.filter(m => m.durability === 'long-term').length;

  if (position === 'dominant' && strongMoats >= 2) {
    return 'Strong long-term competitive position with multiple durable moats. Well-positioned to maintain market leadership.';
  }
  if (position === 'strong' && longTermMoats >= 1) {
    return 'Good competitive position with sustainable advantages. Should continue investing in moat reinforcement.';
  }
  if (position === 'moderate') {
    return 'Moderate competitive position with some defensible advantages. Needs investment to strengthen moats.';
  }
  return 'Competitive position needs strengthening. Focus on developing sustainable competitive advantages.';
}

/**
 * Generate strategic recommendations
 */
function generateRecommendations(
  moats: Moat[],
  weaknesses: string[],
  industrySlug: string
): string[] {
  const recommendations: string[] = [];

  // Address weaknesses
  if (weaknesses.includes('Limited customer lock-in mechanisms')) {
    recommendations.push('Develop integration ecosystem or workflow embedding to increase switching costs');
  }
  if (weaknesses.includes('No clear technology or data advantage')) {
    recommendations.push('Invest in proprietary data collection and AI/ML capabilities');
  }
  if (weaknesses.includes('Limited brand recognition or track record')) {
    recommendations.push('Build brand through thought leadership, case studies, and customer advocacy');
  }

  // Reinforce existing moats
  const categories = new Set(moats.map(m => m.category));

  if (categories.has('network-effects')) {
    recommendations.push('Accelerate user acquisition to strengthen network effects');
  }
  if (categories.has('switching-costs')) {
    recommendations.push('Deepen integrations and become more embedded in customer workflows');
  }
  if (categories.has('data-moat')) {
    recommendations.push('Expand data collection and improve ML models to widen data advantage');
  }

  // Industry-specific recommendations
  const industryRecs: Record<string, string[]> = {
    saas: ['Build developer ecosystem', 'Create certification programs', 'Expand integration marketplace'],
    fintech: ['Pursue additional regulatory licenses', 'Build trust through security certifications', 'Develop exclusive data partnerships'],
    healthcare: ['Strengthen clinical evidence base', 'Pursue additional accreditations', 'Build provider network effects'],
    ecommerce: ['Invest in logistics capabilities', 'Build private label brands', 'Develop loyalty program'],
    marketing: ['Develop proprietary benchmarks', 'Build exclusive partnerships', 'Create certification programs']
  };

  if (industryRecs[industrySlug]) {
    recommendations.push(...industryRecs[industrySlug].slice(0, 2));
  }

  return recommendations.slice(0, 5);
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Get moat category details
 */
export function getMoatCategory(category: MoatCategory) {
  return MOAT_CATEGORIES[category];
}

/**
 * Get all moat categories
 */
export function getAllMoatCategories(): MoatCategory[] {
  return Object.keys(MOAT_CATEGORIES) as MoatCategory[];
}

/**
 * Get industry-relevant moat categories
 */
export function getRelevantMoatCategories(industrySlug: string): MoatCategory[] {
  return getAllMoatCategories()
    .filter(cat => (MOAT_CATEGORIES[cat].industryRelevance[industrySlug] || 0) >= 0.5)
    .sort((a, b) => {
      const relevanceA = MOAT_CATEGORIES[a].industryRelevance[industrySlug] || 0;
      const relevanceB = MOAT_CATEGORIES[b].industryRelevance[industrySlug] || 0;
      return relevanceB - relevanceA;
    });
}

/**
 * Compare moats between two brands
 */
export function compareMoats(
  analysis1: MoatAnalysis,
  analysis2: MoatAnalysis
): {
  leader: string;
  comparison: { category: MoatCategory; brand1Strength: MoatStrength | null; brand2Strength: MoatStrength | null }[];
  summary: string;
} {
  const allCategories = new Set([
    ...analysis1.moats.map(m => m.category),
    ...analysis2.moats.map(m => m.category)
  ]);

  const comparison = Array.from(allCategories).map(category => {
    const moat1 = analysis1.moats.find(m => m.category === category);
    const moat2 = analysis2.moats.find(m => m.category === category);
    return {
      category,
      brand1Strength: moat1?.strength || null,
      brand2Strength: moat2?.strength || null
    };
  });

  const leader = analysis1.overallMoatScore >= analysis2.overallMoatScore
    ? analysis1.brandName
    : analysis2.brandName;

  const diff = Math.abs(analysis1.overallMoatScore - analysis2.overallMoatScore);
  let summary: string;
  if (diff < 10) {
    summary = `${analysis1.brandName} and ${analysis2.brandName} have comparable competitive moats.`;
  } else if (analysis1.overallMoatScore > analysis2.overallMoatScore) {
    summary = `${analysis1.brandName} has stronger competitive moats than ${analysis2.brandName} (${diff} point advantage).`;
  } else {
    summary = `${analysis2.brandName} has stronger competitive moats than ${analysis1.brandName} (${diff} point advantage).`;
  }

  return { leader, comparison, summary };
}
