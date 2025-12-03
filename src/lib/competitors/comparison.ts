/**
 * Competitor Comparison Module
 *
 * Phase 2, Week 3, Day 4
 *
 * Provides detailed comparison analysis between a brand and its competitors.
 * Generates actionable insights for competitive positioning.
 */

import {
  detectCompetitors,
  generateCompetitorComparison,
  type DetectedCompetitor,
  type DetectionOptions,
  type CompetitorComparison,
} from './index';
import type { CompetitorTier } from '../domain/competitor-tiers';

// ================================================================
// TYPES
// ================================================================

/**
 * Detailed competitor analysis
 */
export interface CompetitorAnalysis {
  /** Competitor info */
  competitor: DetectedCompetitor;
  /** Strength assessment */
  strengthAssessment: StrengthAssessment;
  /** Share of voice in the source */
  shareOfVoice: number;
  /** Positioning relative to brand */
  positioning: PositioningAnalysis;
  /** Recommendations for competing */
  recommendations: CompetitiveRecommendation[];
}

/**
 * Strength assessment dimensions
 */
export interface StrengthAssessment {
  /** Overall strength score (0-100) */
  overallStrength: number;
  /** Brand recognition strength */
  brandRecognition: number;
  /** AI mention frequency */
  aiMentionStrength: number;
  /** Sentiment strength */
  sentimentStrength: number;
  /** Market tier advantage */
  tierAdvantage: number;
}

/**
 * Positioning analysis
 */
export interface PositioningAnalysis {
  /** Relative position (ahead, even, behind) */
  position: 'ahead' | 'even' | 'behind';
  /** Positioning gap score (-100 to 100) */
  gapScore: number;
  /** Key differentiators */
  differentiators: string[];
  /** Overlap areas */
  overlapAreas: string[];
  /** Unique strengths of competitor */
  competitorStrengths: string[];
  /** Vulnerabilities to exploit */
  vulnerabilities: string[];
}

/**
 * Competitive recommendation
 */
export interface CompetitiveRecommendation {
  /** Recommendation type */
  type: 'differentiation' | 'head-to-head' | 'niche-focus' | 'content-gap' | 'sentiment-improvement';
  /** Priority */
  priority: 'high' | 'medium' | 'low';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Expected impact */
  expectedImpact: string;
  /** Action items */
  actionItems: string[];
}

/**
 * Full competitive landscape report
 */
export interface CompetitiveLandscapeReport {
  /** Brand being analyzed */
  brand: string;
  /** Brand's current position */
  brandPosition: BrandPosition;
  /** All competitor analyses */
  competitorAnalyses: CompetitorAnalysis[];
  /** Market summary */
  marketSummary: MarketSummary;
  /** Strategic recommendations */
  strategicRecommendations: CompetitiveRecommendation[];
  /** SWOT analysis */
  swotAnalysis: SWOTAnalysis;
  /** Report timestamp */
  generatedAt: string;
}

/**
 * Brand's current position
 */
export interface BrandPosition {
  /** Estimated tier */
  estimatedTier: CompetitorTier;
  /** Market share proxy (based on mentions) */
  marketShareProxy: number;
  /** Competitive strength (0-100) */
  competitiveStrength: number;
  /** Key strengths */
  strengths: string[];
  /** Key weaknesses */
  weaknesses: string[];
}

/**
 * Market summary
 */
export interface MarketSummary {
  /** Total competitors found */
  totalCompetitors: number;
  /** Competitors by tier */
  byTier: Record<CompetitorTier, number>;
  /** Market concentration */
  marketConcentration: 'fragmented' | 'moderate' | 'concentrated';
  /** Dominant players */
  dominantPlayers: string[];
  /** Emerging threats */
  emergingThreats: string[];
  /** Average sentiment */
  averageSentiment: number;
}

/**
 * SWOT Analysis
 */
export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

/**
 * Comparison options
 */
export interface ComparisonOptions extends DetectionOptions {
  /** Include detailed analysis */
  includeDetailedAnalysis?: boolean;
  /** Include SWOT */
  includeSwot?: boolean;
  /** Brand's known strengths */
  brandStrengths?: string[];
  /** Brand's known weaknesses */
  brandWeaknesses?: string[];
  /** Brand's estimated tier */
  brandTier?: CompetitorTier;
}

// ================================================================
// COMPARISON ANALYSIS
// ================================================================

/**
 * Generate comprehensive competitive landscape report
 */
export function analyzeCompetitiveLandscape(
  aiResponseText: string,
  brandName: string,
  options: ComparisonOptions = {}
): CompetitiveLandscapeReport {
  const {
    includeDetailedAnalysis = true,
    includeSwot = true,
    brandStrengths = [],
    brandWeaknesses = [],
    brandTier = 'mid-market',
    ...detectionOptions
  } = options;

  // Detect competitors from text
  const detectionResult = detectCompetitors(aiResponseText, {
    ...detectionOptions,
    excludeBrand: brandName,
  });

  const competitors = detectionResult.competitors;

  // Calculate brand's position
  const brandPosition = calculateBrandPosition(
    brandName,
    competitors,
    brandTier,
    brandStrengths,
    brandWeaknesses
  );

  // Analyze each competitor
  const competitorAnalyses = includeDetailedAnalysis
    ? competitors.map(comp => analyzeCompetitor(comp, brandPosition, competitors))
    : [];

  // Generate market summary
  const marketSummary = generateMarketSummary(competitors);

  // Generate SWOT
  const swotAnalysis = includeSwot
    ? generateSwotAnalysis(brandPosition, competitorAnalyses, marketSummary)
    : { strengths: [], weaknesses: [], opportunities: [], threats: [] };

  // Generate strategic recommendations
  const strategicRecommendations = generateStrategicRecommendations(
    brandPosition,
    competitorAnalyses,
    swotAnalysis
  );

  return {
    brand: brandName,
    brandPosition,
    competitorAnalyses,
    marketSummary,
    strategicRecommendations,
    swotAnalysis,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Compare brand directly with a specific competitor
 */
export function compareWithCompetitor(
  aiResponseText: string,
  brandName: string,
  competitorName: string,
  options: ComparisonOptions = {}
): CompetitorAnalysis | null {
  const detectionResult = detectCompetitors(aiResponseText, {
    ...options,
    knownCompetitors: [competitorName],
  });

  const competitor = detectionResult.competitors.find(
    c => c.normalizedName === competitorName.toLowerCase() || c.name === competitorName
  );

  if (!competitor) {
    return null;
  }

  const brandPosition = calculateBrandPosition(
    brandName,
    detectionResult.competitors,
    options.brandTier || 'mid-market',
    options.brandStrengths || [],
    options.brandWeaknesses || []
  );

  return analyzeCompetitor(competitor, brandPosition, detectionResult.competitors);
}

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function calculateBrandPosition(
  brandName: string,
  competitors: DetectedCompetitor[],
  brandTier: CompetitorTier,
  brandStrengths: string[],
  brandWeaknesses: string[]
): BrandPosition {
  // Calculate market share proxy based on competitor mentions
  const totalMentions = competitors.reduce((sum, c) => sum + c.frequency, 0);
  const marketShareProxy = totalMentions > 0 ? Math.min(100, 100 / (totalMentions + 1)) : 50;

  // Calculate competitive strength
  const tierStrength: Record<CompetitorTier, number> = {
    enterprise: 90,
    'mid-market': 60,
    smb: 40,
    local: 20,
  };

  const avgCompetitorTierStrength = competitors.reduce((sum, c) => {
    return sum + (c.tier ? tierStrength[c.tier] : 50);
  }, 0) / Math.max(1, competitors.length);

  const competitiveStrength = Math.round(
    (tierStrength[brandTier] + (100 - avgCompetitorTierStrength)) / 2
  );

  // Derive strengths and weaknesses
  const derivedStrengths = [...brandStrengths];
  const derivedWeaknesses = [...brandWeaknesses];

  if (brandTier === 'enterprise') {
    derivedStrengths.push('Enterprise-grade capabilities');
    derivedStrengths.push('Established market presence');
  }

  if (competitors.length < 3) {
    derivedStrengths.push('Limited direct competition');
  } else if (competitors.length > 10) {
    derivedWeaknesses.push('Highly competitive market');
  }

  return {
    estimatedTier: brandTier,
    marketShareProxy,
    competitiveStrength,
    strengths: derivedStrengths.slice(0, 5),
    weaknesses: derivedWeaknesses.slice(0, 5),
  };
}

function analyzeCompetitor(
  competitor: DetectedCompetitor,
  brandPosition: BrandPosition,
  allCompetitors: DetectedCompetitor[]
): CompetitorAnalysis {
  // Calculate strength assessment
  const strengthAssessment = calculateStrengthAssessment(competitor, allCompetitors);

  // Calculate share of voice
  const totalMentions = allCompetitors.reduce((sum, c) => sum + c.frequency, 0);
  const shareOfVoice = totalMentions > 0
    ? Math.round((competitor.frequency / totalMentions) * 100)
    : 0;

  // Analyze positioning
  const positioning = analyzePositioning(competitor, brandPosition);

  // Generate recommendations
  const recommendations = generateCompetitorRecommendations(
    competitor,
    positioning,
    strengthAssessment
  );

  return {
    competitor,
    strengthAssessment,
    shareOfVoice,
    positioning,
    recommendations,
  };
}

function calculateStrengthAssessment(
  competitor: DetectedCompetitor,
  allCompetitors: DetectedCompetitor[]
): StrengthAssessment {
  const maxFrequency = Math.max(...allCompetitors.map(c => c.frequency), 1);

  const brandRecognition = Math.round((competitor.frequency / maxFrequency) * 100);
  const aiMentionStrength = Math.min(100, competitor.frequency * 20);
  const sentimentStrength = Math.round((competitor.sentiment + 1) * 50); // Convert -1 to 1 → 0 to 100

  const tierStrength: Record<CompetitorTier, number> = {
    enterprise: 90,
    'mid-market': 60,
    smb: 40,
    local: 20,
  };
  const tierAdvantage = competitor.tier ? tierStrength[competitor.tier] : 50;

  const overallStrength = Math.round(
    (brandRecognition * 0.3 + aiMentionStrength * 0.3 + sentimentStrength * 0.2 + tierAdvantage * 0.2)
  );

  return {
    overallStrength,
    brandRecognition,
    aiMentionStrength,
    sentimentStrength,
    tierAdvantage,
  };
}

function analyzePositioning(
  competitor: DetectedCompetitor,
  brandPosition: BrandPosition
): PositioningAnalysis {
  const tierRank: Record<CompetitorTier, number> = {
    enterprise: 4,
    'mid-market': 3,
    smb: 2,
    local: 1,
  };

  const competitorTierRank = competitor.tier ? tierRank[competitor.tier] : 2;
  const brandTierRank = tierRank[brandPosition.estimatedTier];

  // Calculate gap score
  let gapScore = (brandTierRank - competitorTierRank) * 25;

  // Adjust based on sentiment
  gapScore += competitor.sentiment < 0 ? 10 : competitor.sentiment > 0.3 ? -10 : 0;

  // Adjust based on frequency
  if (competitor.frequency > 3) gapScore -= 10;
  if (competitor.frequency === 1) gapScore += 5;

  gapScore = Math.max(-100, Math.min(100, gapScore));

  const position: 'ahead' | 'even' | 'behind' =
    gapScore > 15 ? 'ahead' : gapScore < -15 ? 'behind' : 'even';

  // Derive differentiators and overlaps
  const differentiators: string[] = [];
  const overlapAreas: string[] = [];
  const competitorStrengths: string[] = [];
  const vulnerabilities: string[] = [];

  if (competitor.tier === 'enterprise' && brandPosition.estimatedTier !== 'enterprise') {
    competitorStrengths.push('Enterprise-scale resources');
    competitorStrengths.push('Established brand recognition');
  }

  if (competitor.sentiment < 0) {
    vulnerabilities.push('Negative customer sentiment');
  }

  if (competitor.frequency === 1) {
    vulnerabilities.push('Low AI visibility');
  }

  if (competitor.isDirect) {
    overlapAreas.push('Direct market competition');
  }

  if (competitor.industry) {
    overlapAreas.push(`${competitor.industry} industry`);
  }

  if (brandPosition.competitiveStrength > 60) {
    differentiators.push('Strong competitive position');
  }

  return {
    position,
    gapScore,
    differentiators,
    overlapAreas,
    competitorStrengths,
    vulnerabilities,
  };
}

function generateCompetitorRecommendations(
  competitor: DetectedCompetitor,
  positioning: PositioningAnalysis,
  strength: StrengthAssessment
): CompetitiveRecommendation[] {
  const recommendations: CompetitiveRecommendation[] = [];

  // High-frequency competitor
  if (competitor.frequency >= 3) {
    recommendations.push({
      type: 'head-to-head',
      priority: 'high',
      title: `Create ${competitor.name} vs Your Brand Comparison`,
      description: `${competitor.name} has high AI visibility. Create content that positions your brand alongside them.`,
      expectedImpact: 'Capture comparison search traffic and AI recommendations',
      actionItems: [
        `Create a detailed "${competitor.name} vs [Your Brand]" comparison page`,
        'Highlight your unique differentiators',
        'Include objective feature comparisons',
        'Add customer testimonials comparing both solutions',
      ],
    });
  }

  // Negative sentiment competitor
  if (competitor.sentiment < -0.2) {
    recommendations.push({
      type: 'differentiation',
      priority: 'high',
      title: `Capitalize on ${competitor.name}'s Weaknesses`,
      description: `${competitor.name} shows negative sentiment. Position your brand as the better alternative.`,
      expectedImpact: 'Capture dissatisfied customers',
      actionItems: [
        `Create "Alternative to ${competitor.name}" content`,
        'Address pain points mentioned about competitor',
        'Highlight your superior customer satisfaction',
        'Target competitor-related search queries',
      ],
    });
  }

  // Same tier competitor
  if (positioning.position === 'even') {
    recommendations.push({
      type: 'niche-focus',
      priority: 'medium',
      title: `Find Niche Differentiation from ${competitor.name}`,
      description: `You and ${competitor.name} are positioned similarly. Identify and own a specific niche.`,
      expectedImpact: 'Establish clear market differentiation',
      actionItems: [
        'Identify underserved customer segments',
        'Develop specialized features for your niche',
        'Create targeted content for your specific audience',
        'Build thought leadership in your specialty area',
      ],
    });
  }

  // Low visibility competitor
  if (strength.aiMentionStrength < 40) {
    recommendations.push({
      type: 'content-gap',
      priority: 'low',
      title: `Monitor ${competitor.name}'s Growth`,
      description: `${competitor.name} has low AI visibility but may be emerging. Monitor for growth.`,
      expectedImpact: 'Stay ahead of emerging competition',
      actionItems: [
        'Set up brand monitoring alerts',
        'Track their content and marketing initiatives',
        'Identify their target audience overlap',
        'Prepare response strategies if they gain traction',
      ],
    });
  }

  return recommendations;
}

function generateMarketSummary(competitors: DetectedCompetitor[]): MarketSummary {
  // Count by tier
  const byTier: Record<CompetitorTier, number> = {
    enterprise: 0,
    'mid-market': 0,
    smb: 0,
    local: 0,
  };

  for (const comp of competitors) {
    if (comp.tier) {
      byTier[comp.tier]++;
    }
  }

  // Determine market concentration
  const topCompetitorShare = competitors.length > 0
    ? competitors[0].frequency / Math.max(1, competitors.reduce((s, c) => s + c.frequency, 0))
    : 0;

  const marketConcentration: 'fragmented' | 'moderate' | 'concentrated' =
    topCompetitorShare > 0.5 ? 'concentrated' :
    topCompetitorShare > 0.25 ? 'moderate' : 'fragmented';

  // Identify dominant players and emerging threats
  const dominantPlayers = competitors
    .filter(c => c.frequency >= 3 || c.tier === 'enterprise')
    .slice(0, 5)
    .map(c => c.name);

  const emergingThreats = competitors
    .filter(c => c.sentiment > 0.3 && c.frequency >= 2)
    .slice(0, 3)
    .map(c => c.name);

  // Average sentiment
  const averageSentiment = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + c.sentiment, 0) / competitors.length
    : 0;

  return {
    totalCompetitors: competitors.length,
    byTier,
    marketConcentration,
    dominantPlayers,
    emergingThreats,
    averageSentiment: Math.round(averageSentiment * 100) / 100,
  };
}

function generateSwotAnalysis(
  brandPosition: BrandPosition,
  competitorAnalyses: CompetitorAnalysis[],
  marketSummary: MarketSummary
): SWOTAnalysis {
  const strengths = [...brandPosition.strengths];
  const weaknesses = [...brandPosition.weaknesses];
  const opportunities: string[] = [];
  const threats: string[] = [];

  // Derive opportunities from competitor weaknesses
  for (const analysis of competitorAnalyses) {
    if (analysis.positioning.vulnerabilities.length > 0) {
      opportunities.push(`Exploit ${analysis.competitor.name}'s vulnerabilities`);
    }
    if (analysis.competitor.sentiment < -0.2) {
      opportunities.push(`Capture dissatisfied ${analysis.competitor.name} customers`);
    }
  }

  // Market-based opportunities
  if (marketSummary.marketConcentration === 'fragmented') {
    opportunities.push('Fragmented market allows for consolidation');
  }

  // Threats from strong competitors
  for (const analysis of competitorAnalyses) {
    if (analysis.strengthAssessment.overallStrength > 70) {
      threats.push(`Strong competition from ${analysis.competitor.name}`);
    }
    if (analysis.positioning.position === 'behind') {
      threats.push(`${analysis.competitor.name} has superior market position`);
    }
  }

  // Emerging threats
  for (const threat of marketSummary.emergingThreats) {
    threats.push(`Emerging competitor: ${threat}`);
  }

  return {
    strengths: [...new Set(strengths)].slice(0, 5),
    weaknesses: [...new Set(weaknesses)].slice(0, 5),
    opportunities: [...new Set(opportunities)].slice(0, 5),
    threats: [...new Set(threats)].slice(0, 5),
  };
}

function generateStrategicRecommendations(
  brandPosition: BrandPosition,
  competitorAnalyses: CompetitorAnalysis[],
  swot: SWOTAnalysis
): CompetitiveRecommendation[] {
  const recommendations: CompetitiveRecommendation[] = [];

  // Based on competitive position
  if (brandPosition.competitiveStrength < 50) {
    recommendations.push({
      type: 'differentiation',
      priority: 'high',
      title: 'Strengthen Market Position',
      description: 'Your competitive strength is below average. Focus on differentiation.',
      expectedImpact: 'Improve market positioning and customer acquisition',
      actionItems: [
        'Identify and communicate unique value proposition',
        'Develop signature features competitors lack',
        'Build stronger brand recognition through PR',
        'Create comparison content against key competitors',
      ],
    });
  }

  // Based on opportunities
  if (swot.opportunities.length > 0) {
    recommendations.push({
      type: 'content-gap',
      priority: 'medium',
      title: 'Capitalize on Market Opportunities',
      description: `Multiple opportunities identified: ${swot.opportunities.slice(0, 2).join(', ')}`,
      expectedImpact: 'Capture market share from competitor weaknesses',
      actionItems: [
        'Create targeted campaigns for each opportunity',
        'Develop content addressing competitor pain points',
        'Build case studies from competitor switchers',
        'Monitor and quickly respond to market changes',
      ],
    });
  }

  // Based on threats
  if (swot.threats.length >= 3) {
    recommendations.push({
      type: 'head-to-head',
      priority: 'high',
      title: 'Address Competitive Threats',
      description: 'Multiple competitive threats require attention.',
      expectedImpact: 'Defend market position against strong competitors',
      actionItems: [
        'Strengthen customer retention programs',
        'Increase content velocity in key areas',
        'Build partnerships to strengthen position',
        'Consider pricing or packaging adjustments',
      ],
    });
  }

  // Aggregate competitor recommendations
  const allCompRecs = competitorAnalyses.flatMap(a => a.recommendations);
  const highPriorityRecs = allCompRecs.filter(r => r.priority === 'high');

  for (const rec of highPriorityRecs.slice(0, 2)) {
    recommendations.push(rec);
  }

  return recommendations.slice(0, 7);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  analyzeCompetitiveLandscape,
  compareWithCompetitor,
};
