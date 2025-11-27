/**
 * Recommendations Engine
 *
 * Phase 1, Week 1, Day 3
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4.5
 *
 * Generates actionable improvement recommendations based on
 * score analysis and industry context.
 */

import { Result, Ok, Err } from '../result';
import { AppError, ValidationError } from '../errors';
import { apiLogger } from '../logger';
import type {
  ScoreResult,
  CategoryScore,
  ScoreCategory,
  ScoreGrade,
} from '../score-calculator';
import type { IndustryDetection } from '../ai/schemas';
import type {
  Recommendation,
  RecommendationPriority,
  RecommendationCategory,
} from '../ai/schemas';

// ================================================================
// TYPES
// ================================================================

/**
 * Input for generating recommendations
 */
export interface RecommendationsInput {
  /** Brand name */
  brandName: string;
  /** Brand URL */
  brandUrl: string;
  /** Score result from calculator */
  scoreResult: ScoreResult;
  /** Industry detection result */
  industryDetection: IndustryDetection;
  /** Maximum recommendations to generate */
  maxRecommendations?: number;
  /** Include effort estimates */
  includeEffortEstimates?: boolean;
}

/**
 * Generated recommendations result
 */
export interface RecommendationsResult {
  /** List of prioritized recommendations */
  recommendations: Recommendation[];
  /** Quick wins (high impact, low effort) */
  quickWins: Recommendation[];
  /** Summary of the recommendations */
  summary: string;
  /** Current score */
  currentScore: number;
  /** Projected score after implementing all recommendations */
  projectedScore: number;
  /** Identified strengths */
  strengths: string[];
  /** Identified weaknesses */
  weaknesses: string[];
  /** Total estimated effort in hours */
  totalEstimatedEffort: number;
  /** Recommendations by category */
  byCategory: Record<RecommendationCategory, Recommendation[]>;
  /** Generation timestamp */
  generatedAt: string;
}

/**
 * Recommendation template
 */
interface RecommendationTemplate {
  id: string;
  title: string;
  description: string;
  rationale: string;
  category: RecommendationCategory;
  basePriority: RecommendationPriority;
  baseImpact: number;
  baseEffortHours: number;
  actionItems: string[];
  resources?: Array<{ name: string; url?: string; type: 'tool' | 'article' | 'service' | 'template' }>;
  example?: string;
  successMetrics?: string[];
  /** Conditions for triggering this recommendation */
  triggers: RecommendationTrigger[];
  /** Industry applicability (empty = all industries) */
  industries?: string[];
}

/**
 * Trigger conditions for recommendations
 */
interface RecommendationTrigger {
  type: 'category_score' | 'mention_rate' | 'sentiment' | 'position' | 'attribute_missing' | 'competitor_gap';
  category?: ScoreCategory;
  threshold?: number;
  operator?: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  sentiment?: 'positive' | 'neutral' | 'negative' | 'mixed';
  attribute?: string;
}

// ================================================================
// RECOMMENDATION TEMPLATES
// ================================================================

/**
 * Core recommendation templates
 */
const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  // ============ CONTENT RECOMMENDATIONS ============
  {
    id: 'content-thought-leadership',
    title: 'Develop Thought Leadership Content',
    description: 'Create authoritative, in-depth content that positions your brand as an industry expert. This includes whitepapers, research reports, and comprehensive guides.',
    rationale: 'AI models favor brands that are cited as authoritative sources. Thought leadership content increases the likelihood of being recommended.',
    category: 'content',
    basePriority: 'high',
    baseImpact: 20,
    baseEffortHours: 40,
    actionItems: [
      'Identify 3-5 key topics where your brand has unique expertise',
      'Create a quarterly content calendar for thought leadership pieces',
      'Develop at least one comprehensive industry report or whitepaper',
      'Publish original research or case studies',
      'Syndicate content across industry publications',
    ],
    resources: [
      { name: 'Content Strategy Guide', type: 'article' },
      { name: 'Industry Research Tools', type: 'tool' },
    ],
    successMetrics: [
      'Increase in brand mentions in AI responses',
      'Growth in organic search traffic',
      'Improvement in visibility score',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 60, operator: 'lt' },
    ],
  },
  {
    id: 'content-use-case-pages',
    title: 'Create Use Case Specific Landing Pages',
    description: 'Build dedicated landing pages for each major use case your product/service addresses. This helps AI models understand and recommend you for specific queries.',
    rationale: 'AI assistants match user queries to specific use cases. Dedicated pages increase relevance signals.',
    category: 'content',
    basePriority: 'medium',
    baseImpact: 15,
    baseEffortHours: 20,
    actionItems: [
      'Map top 10 use cases based on customer feedback',
      'Create SEO-optimized landing pages for each use case',
      'Include customer testimonials and case studies',
      'Add structured data (JSON-LD) for use cases',
      'Link use case pages from main navigation',
    ],
    resources: [
      { name: 'Landing Page Templates', type: 'template' },
    ],
    successMetrics: [
      'Improved mention rate in use-case specific queries',
      'Higher conversion from organic traffic',
    ],
    triggers: [
      { type: 'category_score', category: 'relevance', threshold: 65, operator: 'lt' },
    ],
  },
  {
    id: 'content-comparison-pages',
    title: 'Create Comparison and Alternative Pages',
    description: 'Develop comparison pages showing your product vs competitors. This captures "vs" and "alternative to" searches that AI models frequently answer.',
    rationale: 'Many AI queries ask for comparisons or alternatives. Own this narrative with factual, balanced comparison content.',
    category: 'content',
    basePriority: 'high',
    baseImpact: 18,
    baseEffortHours: 15,
    actionItems: [
      'Identify top 5 competitors based on market research',
      'Create individual comparison landing pages',
      'Include feature comparison tables',
      'Highlight unique differentiators honestly',
      'Add schema markup for comparison content',
    ],
    successMetrics: [
      'Improved positioning in comparison queries',
      'Increase in competitive visibility score',
    ],
    triggers: [
      { type: 'category_score', category: 'competitive', threshold: 55, operator: 'lt' },
    ],
  },
  {
    id: 'content-faq-expansion',
    title: 'Expand FAQ and Knowledge Base',
    description: 'Create comprehensive FAQ pages that answer common questions in natural language. AI models often pull from FAQ sections for direct answers.',
    rationale: 'Well-structured FAQs increase the chance of being cited in AI responses to common questions.',
    category: 'content',
    basePriority: 'medium',
    baseImpact: 12,
    baseEffortHours: 10,
    actionItems: [
      'Analyze customer support tickets for common questions',
      'Create FAQ sections for each product/service',
      'Use natural question-and-answer format',
      'Add FAQ schema markup (JSON-LD)',
      'Group FAQs by category for easy navigation',
    ],
    resources: [
      { name: 'FAQ Schema Generator', type: 'tool' },
    ],
    successMetrics: [
      'Featured in AI question-answering',
      'Reduced support ticket volume',
    ],
    triggers: [
      { type: 'category_score', category: 'coverage', threshold: 60, operator: 'lt' },
    ],
  },

  // ============ TECHNICAL SEO RECOMMENDATIONS ============
  {
    id: 'tech-schema-markup',
    title: 'Implement Comprehensive Schema Markup',
    description: 'Add structured data (JSON-LD) across your website including Organization, Product, FAQ, Review, and Article schemas.',
    rationale: 'Schema markup helps AI models understand your content structure and extract relevant information more accurately.',
    category: 'structured-data',
    basePriority: 'critical',
    baseImpact: 25,
    baseEffortHours: 15,
    actionItems: [
      'Implement Organization schema on homepage',
      'Add Product schema to product pages',
      'Include Review/AggregateRating schema',
      'Add FAQ schema to help pages',
      'Implement BreadcrumbList for navigation',
      'Validate with Google Rich Results Test',
    ],
    resources: [
      { name: 'Schema.org Documentation', url: 'https://schema.org', type: 'article' },
      { name: 'JSON-LD Playground', type: 'tool' },
    ],
    successMetrics: [
      'Valid structured data in search console',
      'Rich results in search snippets',
    ],
    triggers: [
      { type: 'attribute_missing', attribute: 'structured-data' },
      { type: 'category_score', category: 'visibility', threshold: 70, operator: 'lt' },
    ],
  },
  {
    id: 'tech-site-performance',
    title: 'Optimize Website Performance',
    description: 'Improve page load speed and Core Web Vitals. Fast, accessible websites are more likely to be crawled and indexed by AI training pipelines.',
    rationale: 'Technical performance affects crawlability and the overall quality signal of your website.',
    category: 'technical-seo',
    basePriority: 'medium',
    baseImpact: 10,
    baseEffortHours: 25,
    actionItems: [
      'Audit Core Web Vitals (LCP, FID, CLS)',
      'Optimize images and implement lazy loading',
      'Minimize JavaScript and CSS',
      'Implement CDN for global delivery',
      'Enable browser caching',
    ],
    resources: [
      { name: 'PageSpeed Insights', url: 'https://pagespeed.web.dev', type: 'tool' },
      { name: 'Core Web Vitals Guide', type: 'article' },
    ],
    successMetrics: [
      'Green scores on Core Web Vitals',
      'Improved crawl efficiency',
    ],
    triggers: [
      { type: 'category_score', category: 'visibility', threshold: 50, operator: 'lt' },
    ],
  },

  // ============ AUTHORITY RECOMMENDATIONS ============
  {
    id: 'authority-expert-profiles',
    title: 'Build Expert Profiles and E-E-A-T Signals',
    description: 'Create detailed author profiles for content creators showing expertise, credentials, and authority signals.',
    rationale: 'AI models evaluate content quality based on author expertise (E-E-A-T). Strong profiles boost credibility.',
    category: 'authority',
    basePriority: 'high',
    baseImpact: 18,
    baseEffortHours: 12,
    actionItems: [
      'Create detailed author bio pages',
      'Link to external credentials (LinkedIn, academic profiles)',
      'Add Person schema markup for authors',
      'Include author bylines on all content',
      'Highlight relevant experience and certifications',
    ],
    successMetrics: [
      'Improved authority score',
      'Content cited as authoritative source',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 55, operator: 'lt' },
    ],
  },
  {
    id: 'authority-backlink-building',
    title: 'Strategic Backlink Acquisition',
    description: 'Build high-quality backlinks from authoritative industry sources, publications, and directories.',
    rationale: 'External links from trusted sources signal authority to both search engines and AI training models.',
    category: 'authority',
    basePriority: 'medium',
    baseImpact: 22,
    baseEffortHours: 80,
    actionItems: [
      'Identify top industry publications for guest posting',
      'Create linkable assets (tools, calculators, research)',
      'Pursue industry awards and certifications',
      'Get listed in relevant business directories',
      'Build relationships with industry influencers',
    ],
    resources: [
      { name: 'Backlink Analysis Tools', type: 'tool' },
      { name: 'Guest Posting Guide', type: 'article' },
    ],
    successMetrics: [
      'Increase in domain authority',
      'More referring domains',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 50, operator: 'lt' },
    ],
  },

  // ============ BRAND MENTIONS RECOMMENDATIONS ============
  {
    id: 'mentions-pr-campaign',
    title: 'Launch Digital PR Campaign',
    description: 'Execute a PR strategy to get your brand mentioned in news outlets, industry blogs, and online publications.',
    rationale: 'Frequent brand mentions across reputable sources train AI models to recognize and recommend your brand.',
    category: 'brand-mentions',
    basePriority: 'high',
    baseImpact: 20,
    baseEffortHours: 60,
    actionItems: [
      'Develop newsworthy story angles',
      'Build media list of relevant journalists',
      'Create press releases for key announcements',
      'Pitch expert commentary on industry trends',
      'Monitor and respond to PR opportunities',
    ],
    resources: [
      { name: 'HARO (Help A Reporter Out)', type: 'service' },
      { name: 'PR Distribution Services', type: 'service' },
    ],
    successMetrics: [
      'Increase in brand mentions',
      'Media coverage in target publications',
    ],
    triggers: [
      { type: 'mention_rate', threshold: 0.4, operator: 'lt' },
    ],
  },
  {
    id: 'mentions-industry-presence',
    title: 'Strengthen Industry Association Presence',
    description: 'Join and actively participate in industry associations, directories, and professional networks.',
    rationale: 'Industry association memberships provide trusted citations and mentions that AI models consider authoritative.',
    category: 'brand-mentions',
    basePriority: 'medium',
    baseImpact: 12,
    baseEffortHours: 20,
    actionItems: [
      'Join relevant industry associations',
      'Get listed in professional directories',
      'Participate in industry events as speaker',
      'Contribute to association publications',
      'Maintain updated directory listings',
    ],
    successMetrics: [
      'Listed in top industry directories',
      'Active association memberships',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 60, operator: 'lt' },
    ],
  },

  // ============ SOCIAL PROOF RECOMMENDATIONS ============
  {
    id: 'social-review-strategy',
    title: 'Implement Review Generation Strategy',
    description: 'Systematically collect and showcase customer reviews across platforms (G2, Capterra, Trustpilot, Google).',
    rationale: 'Positive reviews are a strong signal for AI recommendations. More reviews = more training data about your brand.',
    category: 'social-proof',
    basePriority: 'high',
    baseImpact: 18,
    baseEffortHours: 15,
    actionItems: [
      'Set up profiles on major review platforms',
      'Create automated review request flows',
      'Respond to all reviews (positive and negative)',
      'Showcase reviews on your website',
      'Add Review schema markup',
    ],
    resources: [
      { name: 'Review Platform List', type: 'article' },
      { name: 'Review Request Templates', type: 'template' },
    ],
    successMetrics: [
      'Increase in review volume',
      'Improvement in average rating',
    ],
    triggers: [
      { type: 'sentiment', sentiment: 'neutral' },
      { type: 'sentiment', sentiment: 'negative' },
      { type: 'category_score', category: 'sentiment', threshold: 65, operator: 'lt' },
    ],
  },
  {
    id: 'social-case-studies',
    title: 'Develop Customer Success Stories',
    description: 'Create detailed case studies showcasing customer success with measurable results.',
    rationale: 'Case studies provide concrete evidence of value that AI models can cite when recommending solutions.',
    category: 'social-proof',
    basePriority: 'medium',
    baseImpact: 15,
    baseEffortHours: 30,
    actionItems: [
      'Identify top 10 customer success stories',
      'Create detailed case study pages',
      'Include specific metrics and outcomes',
      'Add customer testimonial videos',
      'Optimize case studies for search',
    ],
    successMetrics: [
      'Published case studies',
      'Case studies cited in AI responses',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 60, operator: 'lt' },
    ],
  },

  // ============ CITATIONS RECOMMENDATIONS ============
  {
    id: 'citations-wikipedia',
    title: 'Establish Wikipedia Presence',
    description: 'Work towards establishing a Wikipedia page or being cited as a source in relevant Wikipedia articles.',
    rationale: 'Wikipedia is a primary training source for AI models. Being cited in Wikipedia significantly boosts AI recognition.',
    category: 'citations',
    basePriority: 'medium',
    baseImpact: 25,
    baseEffortHours: 40,
    actionItems: [
      'Assess Wikipedia notability requirements',
      'Build third-party citations required for notability',
      'Create Wikipedia drafts following guidelines',
      'Contribute to industry topic Wikipedia pages',
      'Monitor and maintain Wikipedia presence',
    ],
    resources: [
      { name: 'Wikipedia Notability Guidelines', type: 'article' },
    ],
    successMetrics: [
      'Wikipedia page created/maintained',
      'Citations in relevant articles',
    ],
    triggers: [
      { type: 'category_score', category: 'visibility', threshold: 60, operator: 'lt' },
      { type: 'mention_rate', threshold: 0.5, operator: 'lt' },
    ],
  },
  {
    id: 'citations-educational-content',
    title: 'Create Citable Educational Content',
    description: 'Develop research, statistics, and educational content that other websites and AI models will cite.',
    rationale: 'Original research and statistics are frequently cited by AI when answering factual questions.',
    category: 'citations',
    basePriority: 'high',
    baseImpact: 20,
    baseEffortHours: 50,
    actionItems: [
      'Conduct original industry research',
      'Publish annual industry reports',
      'Create data visualizations and infographics',
      'Track citation metrics',
      'Promote research to journalists and bloggers',
    ],
    successMetrics: [
      'Research cited by external sources',
      'Backlinks from citations',
    ],
    triggers: [
      { type: 'category_score', category: 'authority', threshold: 55, operator: 'lt' },
    ],
  },

  // ============ ENTITY SEO RECOMMENDATIONS ============
  {
    id: 'entity-knowledge-graph',
    title: 'Establish Knowledge Graph Entity',
    description: 'Ensure your brand is recognized as an entity in Google\'s Knowledge Graph through consistent NAP and brand signals.',
    rationale: 'Knowledge Graph entities are primary sources for AI assistants answering brand-related queries.',
    category: 'entity-seo',
    basePriority: 'critical',
    baseImpact: 28,
    baseEffortHours: 25,
    actionItems: [
      'Claim and optimize Google Business Profile',
      'Ensure consistent NAP across all platforms',
      'Link to official social profiles',
      'Create Wikidata entry if eligible',
      'Implement Organization schema with sameAs links',
    ],
    resources: [
      { name: 'Knowledge Graph Optimization Guide', type: 'article' },
      { name: 'Wikidata Entry Guidelines', type: 'article' },
    ],
    successMetrics: [
      'Brand appears in Knowledge Graph',
      'Rich brand panel in search results',
    ],
    triggers: [
      { type: 'category_score', category: 'visibility', threshold: 65, operator: 'lt' },
    ],
  },
];

// ================================================================
// INDUSTRY-SPECIFIC ADJUSTMENTS
// ================================================================

const INDUSTRY_PRIORITY_BOOSTS: Record<string, Record<string, number>> = {
  saas: {
    'tech-schema-markup': 10,
    'content-comparison-pages': 8,
    'social-review-strategy': 10,
  },
  fintech: {
    'authority-expert-profiles': 10,
    'tech-schema-markup': 8,
    'citations-educational-content': 10,
  },
  ecommerce: {
    'social-review-strategy': 12,
    'tech-site-performance': 10,
    'content-use-case-pages': 8,
  },
  healthtech: {
    'authority-expert-profiles': 15,
    'citations-educational-content': 12,
    'authority-backlink-building': 10,
  },
  marketing: {
    'content-thought-leadership': 10,
    'mentions-pr-campaign': 10,
    'social-case-studies': 8,
  },
};

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Generate unique recommendation ID
 */
function generateRecommendationId(): string {
  return `rec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Check if a trigger condition is met
 */
function checkTrigger(
  trigger: RecommendationTrigger,
  scoreResult: ScoreResult
): boolean {
  switch (trigger.type) {
    case 'category_score': {
      if (!trigger.category || trigger.threshold === undefined) return false;
      const category = scoreResult.categories.find(c => c.category === trigger.category);
      if (!category) return false;
      return compareValue(category.score, trigger.threshold, trigger.operator || 'lt');
    }

    case 'mention_rate': {
      if (trigger.threshold === undefined) return false;
      // Extract mention rate from provider scores
      const mentionRate = scoreResult.providerScores[0]?.mentionRate || 0;
      return compareValue(mentionRate, trigger.threshold, trigger.operator || 'lt');
    }

    case 'sentiment': {
      // Check if sentiment matches
      const overallGrade = scoreResult.overallGrade;
      if (trigger.sentiment === 'negative' && (overallGrade === 'poor' || overallGrade === 'critical')) {
        return true;
      }
      if (trigger.sentiment === 'neutral' && overallGrade === 'average') {
        return true;
      }
      // Check sentiment category specifically
      const sentimentCategory = scoreResult.categories.find(c => c.category === 'sentiment');
      if (sentimentCategory && sentimentCategory.grade === trigger.sentiment) {
        return true;
      }
      return false;
    }

    case 'position': {
      if (trigger.threshold === undefined) return false;
      const avgPosition = scoreResult.providerScores[0]?.averagePosition;
      if (avgPosition === null) return false;
      return compareValue(avgPosition, trigger.threshold, trigger.operator || 'gt');
    }

    case 'attribute_missing': {
      // Check if attribute is not in top attributes
      const insights = scoreResult.keyInsights.join(' ').toLowerCase();
      return !insights.includes(trigger.attribute?.toLowerCase() || '');
    }

    case 'competitor_gap': {
      // Check competitive score
      const competitiveCategory = scoreResult.categories.find(c => c.category === 'competitive');
      return competitiveCategory ? competitiveCategory.score < 60 : true;
    }

    default:
      return false;
  }
}

/**
 * Compare values with operator
 */
function compareValue(value: number, threshold: number, operator: string): boolean {
  switch (operator) {
    case 'lt': return value < threshold;
    case 'lte': return value <= threshold;
    case 'gt': return value > threshold;
    case 'gte': return value >= threshold;
    case 'eq': return value === threshold;
    default: return value < threshold;
  }
}

/**
 * Calculate priority based on score and industry
 */
function calculatePriority(
  template: RecommendationTemplate,
  scoreResult: ScoreResult,
  industry: string
): RecommendationPriority {
  let priorityScore = 0;

  // Base priority score
  const priorityMap: Record<RecommendationPriority, number> = {
    critical: 40,
    high: 30,
    medium: 20,
    low: 10,
  };
  priorityScore += priorityMap[template.basePriority];

  // Boost based on how many triggers are met
  let triggersMatched = 0;
  for (const trigger of template.triggers) {
    if (checkTrigger(trigger, scoreResult)) {
      triggersMatched++;
    }
  }
  priorityScore += triggersMatched * 10;

  // Industry-specific boost
  const industryBoosts = INDUSTRY_PRIORITY_BOOSTS[industry];
  if (industryBoosts && industryBoosts[template.id]) {
    priorityScore += industryBoosts[template.id];
  }

  // Low overall score = higher priority for all recommendations
  if (scoreResult.overallScore < 40) {
    priorityScore += 15;
  } else if (scoreResult.overallScore < 60) {
    priorityScore += 10;
  }

  // Map back to priority level
  if (priorityScore >= 50) return 'critical';
  if (priorityScore >= 35) return 'high';
  if (priorityScore >= 20) return 'medium';
  return 'low';
}

/**
 * Calculate estimated impact based on current score
 */
function calculateImpact(
  template: RecommendationTemplate,
  scoreResult: ScoreResult,
  industry: string
): number {
  let impact = template.baseImpact;

  // Higher impact for lower scores (more room for improvement)
  if (scoreResult.overallScore < 40) {
    impact *= 1.3;
  } else if (scoreResult.overallScore < 60) {
    impact *= 1.15;
  } else if (scoreResult.overallScore > 80) {
    impact *= 0.8; // Diminishing returns for high scorers
  }

  // Industry-specific adjustments
  const industryBoosts = INDUSTRY_PRIORITY_BOOSTS[industry];
  if (industryBoosts && industryBoosts[template.id]) {
    impact *= 1.1;
  }

  return Math.round(Math.min(30, Math.max(5, impact)));
}

/**
 * Personalize recommendation for brand
 */
function personalizeRecommendation(
  template: RecommendationTemplate,
  brandName: string,
  industry: string
): Recommendation {
  const id = generateRecommendationId();

  // Replace placeholders in text
  const personalize = (text: string): string => {
    return text
      .replace(/\{brand\}/g, brandName)
      .replace(/\{industry\}/g, industry);
  };

  return {
    id,
    title: personalize(template.title),
    description: personalize(template.description),
    rationale: personalize(template.rationale),
    priority: template.basePriority,
    category: template.category,
    estimatedImpact: template.baseImpact,
    estimatedEffortHours: template.baseEffortHours,
    actionItems: template.actionItems.map(personalize),
    resources: template.resources,
    example: template.example ? personalize(template.example) : undefined,
    successMetrics: template.successMetrics,
  };
}

/**
 * Sort recommendations by priority and impact
 */
function sortRecommendations(recommendations: Recommendation[]): Recommendation[] {
  const priorityOrder: RecommendationPriority[] = ['critical', 'high', 'medium', 'low'];

  return [...recommendations].sort((a, b) => {
    const priorityDiff = priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    if (priorityDiff !== 0) return priorityDiff;

    // Secondary sort by impact
    return b.estimatedImpact - a.estimatedImpact;
  });
}

/**
 * Identify quick wins (high impact, low effort)
 */
function identifyQuickWins(recommendations: Recommendation[]): Recommendation[] {
  return recommendations
    .filter(r => r.estimatedImpact >= 15 && r.estimatedEffortHours <= 20)
    .slice(0, 3);
}

/**
 * Extract strengths from score result
 */
function extractStrengths(scoreResult: ScoreResult): string[] {
  const strengths: string[] = [];

  for (const category of scoreResult.categories) {
    if (category.grade === 'excellent' || category.grade === 'good') {
      strengths.push(`Strong ${category.name.toLowerCase()}: ${category.score}/100`);
    }
  }

  // Add from insights
  const positiveInsights = scoreResult.keyInsights.filter(
    i => i.toLowerCase().includes('excellent') ||
         i.toLowerCase().includes('strong') ||
         i.toLowerCase().includes('good')
  );
  strengths.push(...positiveInsights.slice(0, 2));

  return [...new Set(strengths)].slice(0, 5);
}

/**
 * Extract weaknesses from score result
 */
function extractWeaknesses(scoreResult: ScoreResult): string[] {
  const weaknesses: string[] = [];

  for (const category of scoreResult.categories) {
    if (category.grade === 'poor' || category.grade === 'critical') {
      weaknesses.push(`Weak ${category.name.toLowerCase()}: ${category.score}/100`);
    }
  }

  // Add from improvement areas
  weaknesses.push(...scoreResult.improvementAreas.slice(0, 3));

  return [...new Set(weaknesses)].slice(0, 5);
}

/**
 * Generate summary text
 */
function generateSummary(
  scoreResult: ScoreResult,
  recommendations: Recommendation[],
  brandName: string
): string {
  const categoryFocus = recommendations
    .slice(0, 3)
    .map(r => r.category)
    .filter((v, i, a) => a.indexOf(v) === i);

  const focusAreas = categoryFocus.join(', ');
  const projectedImprovement = recommendations
    .slice(0, 5)
    .reduce((sum, r) => sum + r.estimatedImpact * 0.7, 0);

  if (scoreResult.overallScore >= 80) {
    return `${brandName} has excellent AI visibility. Focus on maintaining your position by staying current with ${focusAreas} improvements. Implementing our recommendations could increase your score by ${Math.round(projectedImprovement)} points.`;
  } else if (scoreResult.overallScore >= 60) {
    return `${brandName} has good AI visibility with room for improvement. Priority areas: ${focusAreas}. Implementing our top recommendations could increase your score by ${Math.round(projectedImprovement)} points.`;
  } else if (scoreResult.overallScore >= 40) {
    return `${brandName} has average AI visibility and requires focused improvement. We recommend prioritizing ${focusAreas}. Full implementation could boost your score by ${Math.round(projectedImprovement)} points.`;
  } else {
    return `${brandName} has low AI visibility and needs immediate attention. Critical focus areas: ${focusAreas}. Implementing these recommendations is essential for competitive positioning and could increase your score by ${Math.round(projectedImprovement)}+ points.`;
  }
}

/**
 * Calculate projected score
 */
function calculateProjectedScore(
  currentScore: number,
  recommendations: Recommendation[]
): number {
  // Take top recommendations and calculate combined impact
  // Apply diminishing returns
  let totalImpact = 0;
  const topRecs = recommendations.slice(0, 8);

  for (let i = 0; i < topRecs.length; i++) {
    // Each subsequent recommendation has diminishing impact
    const diminishingFactor = Math.pow(0.85, i);
    totalImpact += topRecs[i].estimatedImpact * diminishingFactor * 0.7;
  }

  return Math.min(100, Math.round(currentScore + totalImpact));
}

// ================================================================
// MAIN GENERATOR
// ================================================================

/**
 * Generate recommendations based on score analysis
 */
export function generateRecommendations(
  input: RecommendationsInput
): Result<RecommendationsResult, AppError> {
  const timer = apiLogger.time('recommendations.generate');

  try {
    const {
      brandName,
      brandUrl,
      scoreResult,
      industryDetection,
      maxRecommendations = 15,
      includeEffortEstimates = true,
    } = input;

    // Validate input
    if (!brandName || brandName.trim().length === 0) {
      return Err(new ValidationError('Brand name is required'));
    }

    if (!scoreResult) {
      return Err(new ValidationError('Score result is required'));
    }

    const industry = industryDetection.industry;

    // Filter templates based on industry applicability
    const applicableTemplates = RECOMMENDATION_TEMPLATES.filter(t => {
      if (!t.industries || t.industries.length === 0) return true;
      return t.industries.includes(industry);
    });

    // Score and filter templates based on triggers
    const scoredTemplates: Array<{
      template: RecommendationTemplate;
      relevanceScore: number;
    }> = [];

    for (const template of applicableTemplates) {
      let relevanceScore = 0;

      // Check each trigger
      for (const trigger of template.triggers) {
        if (checkTrigger(trigger, scoreResult)) {
          relevanceScore += 1;
        }
      }

      // Only include if at least one trigger matches
      if (relevanceScore > 0) {
        scoredTemplates.push({ template, relevanceScore });
      }
    }

    // Sort by relevance and limit
    scoredTemplates.sort((a, b) => b.relevanceScore - a.relevanceScore);
    const selectedTemplates = scoredTemplates.slice(0, maxRecommendations);

    // Generate recommendations from templates
    const recommendations: Recommendation[] = selectedTemplates.map(({ template }) => {
      const rec = personalizeRecommendation(template, brandName, industry);

      // Calculate dynamic priority and impact
      rec.priority = calculatePriority(template, scoreResult, industry);
      rec.estimatedImpact = calculateImpact(template, scoreResult, industry);

      if (!includeEffortEstimates) {
        rec.estimatedEffortHours = 0;
      }

      return rec;
    });

    // Sort recommendations
    const sortedRecommendations = sortRecommendations(recommendations);

    // Identify quick wins
    const quickWins = identifyQuickWins(sortedRecommendations);

    // Group by category
    const byCategory: Record<RecommendationCategory, Recommendation[]> = {
      'content': [],
      'technical-seo': [],
      'authority': [],
      'entity-seo': [],
      'citations': [],
      'social-proof': [],
      'structured-data': [],
      'brand-mentions': [],
    };

    for (const rec of sortedRecommendations) {
      if (!byCategory[rec.category]) {
        byCategory[rec.category] = [];
      }
      byCategory[rec.category].push(rec);
    }

    // Calculate totals
    const totalEstimatedEffort = sortedRecommendations.reduce(
      (sum, r) => sum + r.estimatedEffortHours,
      0
    );

    const result: RecommendationsResult = {
      recommendations: sortedRecommendations,
      quickWins,
      summary: generateSummary(scoreResult, sortedRecommendations, brandName),
      currentScore: scoreResult.overallScore,
      projectedScore: calculateProjectedScore(scoreResult.overallScore, sortedRecommendations),
      strengths: extractStrengths(scoreResult),
      weaknesses: extractWeaknesses(scoreResult),
      totalEstimatedEffort,
      byCategory,
      generatedAt: new Date().toISOString(),
    };

    timer.success({
      recommendationCount: sortedRecommendations.length,
      quickWinCount: quickWins.length,
      projectedScore: result.projectedScore,
    });

    return Ok(result);
  } catch (error) {
    timer.failure({
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return Err(new ValidationError(
      `Failed to generate recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
    ));
  }
}

/**
 * Get recommendation template by ID
 */
export function getRecommendationTemplate(id: string): RecommendationTemplate | undefined {
  return RECOMMENDATION_TEMPLATES.find(t => t.id === id);
}

/**
 * Get all recommendation categories
 */
export function getRecommendationCategories(): RecommendationCategory[] {
  return [
    'content',
    'technical-seo',
    'authority',
    'entity-seo',
    'citations',
    'social-proof',
    'structured-data',
    'brand-mentions',
  ];
}

/**
 * Filter recommendations by category
 */
export function filterByCategory(
  recommendations: Recommendation[],
  category: RecommendationCategory
): Recommendation[] {
  return recommendations.filter(r => r.category === category);
}

/**
 * Filter recommendations by priority
 */
export function filterByPriority(
  recommendations: Recommendation[],
  minPriority: RecommendationPriority
): Recommendation[] {
  const priorityOrder: RecommendationPriority[] = ['critical', 'high', 'medium', 'low'];
  const minIndex = priorityOrder.indexOf(minPriority);

  return recommendations.filter(r => {
    const recIndex = priorityOrder.indexOf(r.priority);
    return recIndex <= minIndex;
  });
}

// ================================================================
// EXPORTS
// ================================================================

export {
  RECOMMENDATION_TEMPLATES,
};

export default {
  generateRecommendations,
  getRecommendationTemplate,
  getRecommendationCategories,
  filterByCategory,
  filterByPriority,
  RECOMMENDATION_TEMPLATES,
};
