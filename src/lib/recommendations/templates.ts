/**
 * Recommendation Templates Library
 *
 * Phase 2, Week 3, Day 5
 * Extended templates for industry-specific and specialized recommendations
 */

// ================================================================
// TYPES
// ================================================================

export type TemplateCategory =
  | 'content'
  | 'technical-seo'
  | 'authority'
  | 'entity-seo'
  | 'citations'
  | 'social-proof'
  | 'structured-data'
  | 'brand-mentions'
  | 'competitive'
  | 'local-seo'
  | 'crisis-management';

export type TemplateIndustry =
  | 'saas'
  | 'fintech'
  | 'ecommerce'
  | 'healthtech'
  | 'marketing'
  | 'legal'
  | 'real-estate'
  | 'education'
  | 'hospitality'
  | 'manufacturing'
  | 'professional-services'
  | 'all';

export type TemplatePriority = 'critical' | 'high' | 'medium' | 'low';

export type TemplateEffort = 'quick-win' | 'short-term' | 'medium-term' | 'long-term';

export interface RecommendationTemplate {
  id: string;
  title: string;
  description: string;
  rationale: string;
  category: TemplateCategory;
  priority: TemplatePriority;
  effort: TemplateEffort;
  estimatedHours: number;
  estimatedImpact: number; // 1-30
  industries: TemplateIndustry[];
  actionItems: string[];
  resources?: TemplateResource[];
  successMetrics?: string[];
  prerequisites?: string[];
  relatedTemplates?: string[];
  tags: string[];
}

export interface TemplateResource {
  name: string;
  url?: string;
  type: 'tool' | 'article' | 'service' | 'template' | 'guide';
  description?: string;
}

// ================================================================
// QUICK WIN TEMPLATES
// ================================================================

export const QUICK_WIN_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'qw-schema-organization',
    title: 'Add Organization Schema to Homepage',
    description: 'Implement JSON-LD Organization schema markup on your homepage with complete company information including logo, social profiles, and contact details.',
    rationale: 'Organization schema helps AI systems quickly identify and understand your brand entity, improving accuracy in AI responses.',
    category: 'structured-data',
    priority: 'high',
    effort: 'quick-win',
    estimatedHours: 2,
    estimatedImpact: 15,
    industries: ['all'],
    actionItems: [
      'Add Organization schema JSON-LD to homepage head',
      'Include name, logo, description, and foundingDate',
      'Add sameAs links to all official social profiles',
      'Include contactPoint with phone and email',
      'Validate with Google Rich Results Test',
    ],
    resources: [
      { name: 'Schema.org Organization', url: 'https://schema.org/Organization', type: 'guide' },
      { name: 'Rich Results Test', url: 'https://search.google.com/test/rich-results', type: 'tool' },
    ],
    successMetrics: ['Valid schema in search console', 'Rich results appearing'],
    tags: ['schema', 'quick-win', 'structured-data', 'brand-identity'],
  },
  {
    id: 'qw-google-business',
    title: 'Optimize Google Business Profile',
    description: 'Fully complete and optimize your Google Business Profile with accurate information, photos, and regular posts.',
    rationale: 'Google Business Profile data feeds directly into AI knowledge graphs and is frequently cited by AI assistants.',
    category: 'entity-seo',
    priority: 'critical',
    effort: 'quick-win',
    estimatedHours: 3,
    estimatedImpact: 18,
    industries: ['all'],
    actionItems: [
      'Claim and verify Google Business Profile',
      'Complete all business information fields',
      'Add high-quality photos and logo',
      'Set up products/services listing',
      'Enable messaging and respond promptly',
      'Post weekly updates',
    ],
    successMetrics: ['100% profile completion', 'Regular engagement metrics'],
    tags: ['google', 'local', 'quick-win', 'brand-presence'],
  },
  {
    id: 'qw-faq-schema',
    title: 'Add FAQ Schema to Support Pages',
    description: 'Implement FAQ schema markup on existing FAQ and support pages to improve visibility in AI-generated answers.',
    rationale: 'FAQs with schema markup are prime sources for AI assistants when answering specific questions about your product or service.',
    category: 'structured-data',
    priority: 'high',
    effort: 'quick-win',
    estimatedHours: 2,
    estimatedImpact: 12,
    industries: ['all'],
    actionItems: [
      'Identify pages with Q&A content',
      'Convert to proper FAQ format if needed',
      'Add FAQPage schema markup',
      'Test with Rich Results Test',
      'Monitor appearance in search results',
    ],
    successMetrics: ['FAQ rich results appearing', 'Increased organic traffic'],
    tags: ['schema', 'faq', 'quick-win', 'ai-answers'],
  },
  {
    id: 'qw-meta-descriptions',
    title: 'Optimize Meta Descriptions for AI',
    description: 'Rewrite meta descriptions to be more conversational and information-rich, as AI systems often use them for context.',
    rationale: 'Well-written meta descriptions provide concise brand information that AI models use for snippets and recommendations.',
    category: 'technical-seo',
    priority: 'medium',
    effort: 'quick-win',
    estimatedHours: 4,
    estimatedImpact: 8,
    industries: ['all'],
    actionItems: [
      'Audit existing meta descriptions',
      'Rewrite to include key brand differentiators',
      'Use natural, conversational language',
      'Include relevant keywords naturally',
      'Keep between 150-160 characters',
    ],
    successMetrics: ['Improved CTR', 'Better AI snippets'],
    tags: ['seo', 'meta', 'quick-win', 'optimization'],
  },
];

// ================================================================
// CONTENT TEMPLATES
// ================================================================

export const CONTENT_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'cnt-pillar-content',
    title: 'Create Pillar Content Strategy',
    description: 'Develop comprehensive pillar pages that serve as definitive resources for your core topics, supported by cluster content.',
    rationale: 'Pillar content establishes topical authority that AI models recognize, increasing likelihood of brand recommendation for related queries.',
    category: 'content',
    priority: 'high',
    effort: 'long-term',
    estimatedHours: 80,
    estimatedImpact: 25,
    industries: ['saas', 'marketing', 'fintech', 'education'],
    actionItems: [
      'Identify 3-5 core topics for your brand',
      'Create comprehensive pillar pages (3000+ words)',
      'Develop supporting cluster content',
      'Implement topic cluster internal linking',
      'Add schema markup for articles',
      'Update quarterly with new information',
    ],
    prerequisites: ['Keyword research completed', 'Content team capacity'],
    relatedTemplates: ['cnt-thought-leadership', 'cnt-glossary'],
    successMetrics: ['Top 10 rankings for pillar topics', 'Increased time on page'],
    tags: ['content-strategy', 'pillar', 'authority', 'topical'],
  },
  {
    id: 'cnt-glossary',
    title: 'Build Industry Glossary',
    description: 'Create a comprehensive glossary of industry terms that AI models can reference when defining concepts.',
    rationale: 'Glossaries are frequently cited by AI when explaining industry terminology, positioning your brand as an authority.',
    category: 'content',
    priority: 'medium',
    effort: 'medium-term',
    estimatedHours: 30,
    estimatedImpact: 15,
    industries: ['all'],
    actionItems: [
      'Compile list of 50+ industry terms',
      'Write clear, authoritative definitions',
      'Add DefinedTerm schema markup',
      'Create individual pages for major terms',
      'Link glossary terms throughout site content',
    ],
    successMetrics: ['Definitions appearing in AI responses', 'Organic traffic to glossary'],
    tags: ['glossary', 'definitions', 'authority', 'educational'],
  },
  {
    id: 'cnt-comparison-hub',
    title: 'Create Comparison Content Hub',
    description: 'Build a dedicated section comparing your solution to alternatives and competitors.',
    rationale: 'Comparison queries are among the most common AI questions. Owning this content increases competitive visibility.',
    category: 'competitive',
    priority: 'high',
    effort: 'medium-term',
    estimatedHours: 40,
    estimatedImpact: 20,
    industries: ['saas', 'fintech', 'ecommerce'],
    actionItems: [
      'Identify top 10 competitors and alternatives',
      'Create individual vs pages for each',
      'Build feature comparison tables',
      'Include honest pros and cons',
      'Add CompareAction schema markup',
      'Keep updated with competitor changes',
    ],
    successMetrics: ['Rankings for vs queries', 'Mentions in comparison AI responses'],
    tags: ['comparison', 'competitive', 'vs-pages', 'alternatives'],
  },
  {
    id: 'cnt-data-journalism',
    title: 'Launch Data Journalism Initiative',
    description: 'Publish original research, surveys, and data-driven content that becomes a citable source.',
    rationale: 'Original data and statistics are highly valued by AI models and frequently cited in responses.',
    category: 'authority',
    priority: 'high',
    effort: 'long-term',
    estimatedHours: 100,
    estimatedImpact: 28,
    industries: ['saas', 'fintech', 'marketing', 'real-estate'],
    actionItems: [
      'Conduct annual industry survey',
      'Publish quarterly data reports',
      'Create shareable infographics',
      'Add Dataset schema markup',
      'Pitch findings to industry press',
      'Update stats annually',
    ],
    prerequisites: ['Research budget', 'Data collection capability'],
    successMetrics: ['Citations in media', 'Backlinks from data usage', 'AI citing statistics'],
    tags: ['data', 'research', 'statistics', 'original-content'],
  },
];

// ================================================================
// AUTHORITY TEMPLATES
// ================================================================

export const AUTHORITY_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'auth-expert-network',
    title: 'Build Expert Contributor Network',
    description: 'Develop a network of industry experts who contribute content, adding E-E-A-T signals.',
    rationale: 'Content from recognized experts carries more weight with AI models evaluating authority and trustworthiness.',
    category: 'authority',
    priority: 'high',
    effort: 'long-term',
    estimatedHours: 60,
    estimatedImpact: 22,
    industries: ['healthtech', 'fintech', 'legal', 'education'],
    actionItems: [
      'Identify 5-10 industry experts for collaboration',
      'Create detailed author profile pages',
      'Implement Person schema with credentials',
      'Link to external credibility sources',
      'Feature expert bylines prominently',
      'Cross-promote on expert channels',
    ],
    successMetrics: ['Expert content performance', 'Authority score improvement'],
    tags: ['experts', 'eeat', 'authority', 'contributors'],
  },
  {
    id: 'auth-certifications',
    title: 'Pursue Industry Certifications',
    description: 'Obtain and prominently display relevant industry certifications and trust badges.',
    rationale: 'Certifications provide verifiable trust signals that AI models use to assess credibility.',
    category: 'authority',
    priority: 'medium',
    effort: 'medium-term',
    estimatedHours: 40,
    estimatedImpact: 15,
    industries: ['all'],
    actionItems: [
      'Identify relevant industry certifications',
      'Complete certification requirements',
      'Display badges on homepage and footer',
      'Add certification to schema markup',
      'Include in company descriptions everywhere',
    ],
    successMetrics: ['Certifications obtained', 'Trust signal visibility'],
    tags: ['certifications', 'trust', 'badges', 'credibility'],
  },
  {
    id: 'auth-speaking-events',
    title: 'Establish Speaking Authority',
    description: 'Position company leaders as speakers at industry events and conferences.',
    rationale: 'Speaking engagements create citable references and establish expertise that AI models recognize.',
    category: 'authority',
    priority: 'medium',
    effort: 'long-term',
    estimatedHours: 50,
    estimatedImpact: 18,
    industries: ['saas', 'marketing', 'fintech', 'professional-services'],
    actionItems: [
      'Identify key industry conferences',
      'Submit speaker proposals',
      'Create speaker pages with Event schema',
      'Record and publish presentations',
      'Leverage speaking for PR and content',
    ],
    successMetrics: ['Speaking engagements secured', 'Mentions in event coverage'],
    tags: ['speaking', 'events', 'thought-leadership', 'visibility'],
  },
];

// ================================================================
// INDUSTRY-SPECIFIC TEMPLATES
// ================================================================

export const SAAS_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'saas-integration-pages',
    title: 'Create Integration Partner Pages',
    description: 'Build dedicated landing pages for each major integration, optimized for integration search queries.',
    rationale: 'Integration queries are common in SaaS. AI models often recommend tools based on integration capabilities.',
    category: 'content',
    priority: 'high',
    effort: 'medium-term',
    estimatedHours: 35,
    estimatedImpact: 18,
    industries: ['saas'],
    actionItems: [
      'List all integrations with partners',
      'Create individual integration pages',
      'Include SoftwareApplication schema',
      'Add integration documentation',
      'Cross-promote with partners',
    ],
    successMetrics: ['Integration page traffic', 'Partner referral increase'],
    tags: ['integrations', 'partnerships', 'saas', 'ecosystem'],
  },
  {
    id: 'saas-g2-capterra',
    title: 'Optimize Review Platform Presence',
    description: 'Maximize presence and reviews on G2, Capterra, and other SaaS review platforms.',
    rationale: 'Review platforms are primary sources for AI SaaS recommendations. High ratings directly influence AI suggestions.',
    category: 'social-proof',
    priority: 'critical',
    effort: 'medium-term',
    estimatedHours: 25,
    estimatedImpact: 25,
    industries: ['saas'],
    actionItems: [
      'Claim profiles on all major platforms',
      'Complete all profile information',
      'Implement review collection workflow',
      'Respond to all reviews',
      'Display badges on website',
      'Track competitor reviews',
    ],
    successMetrics: ['Review count growth', 'Rating improvement', 'Badge displays'],
    tags: ['reviews', 'g2', 'capterra', 'social-proof', 'saas'],
  },
];

export const ECOMMERCE_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'ecom-product-schema',
    title: 'Implement Rich Product Schema',
    description: 'Add comprehensive Product schema with offers, reviews, and availability to all product pages.',
    rationale: 'Product schema enables AI shopping assistants to accurately recommend and compare your products.',
    category: 'structured-data',
    priority: 'critical',
    effort: 'medium-term',
    estimatedHours: 30,
    estimatedImpact: 25,
    industries: ['ecommerce'],
    actionItems: [
      'Audit current product schema coverage',
      'Add Product schema to all product pages',
      'Include AggregateRating from reviews',
      'Add Offer with price and availability',
      'Implement BreadcrumbList for categories',
    ],
    successMetrics: ['Product rich results', 'Shopping appearance'],
    tags: ['product', 'schema', 'ecommerce', 'shopping'],
  },
  {
    id: 'ecom-buying-guides',
    title: 'Create Product Buying Guides',
    description: 'Develop comprehensive buying guides that help customers choose the right products.',
    rationale: 'Buying guides are frequently referenced by AI when users ask for product recommendations.',
    category: 'content',
    priority: 'high',
    effort: 'medium-term',
    estimatedHours: 40,
    estimatedImpact: 20,
    industries: ['ecommerce'],
    actionItems: [
      'Identify top product categories',
      'Create in-depth buying guides',
      'Include comparison tables',
      'Add HowTo schema where applicable',
      'Link to relevant products naturally',
    ],
    successMetrics: ['Guide organic traffic', 'Conversion from guides'],
    tags: ['guides', 'content', 'ecommerce', 'buyer-journey'],
  },
];

export const HEALTHTECH_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'health-medical-review',
    title: 'Implement Medical Review Process',
    description: 'Establish and display a medical review process for all health-related content.',
    rationale: 'Health content requires strong E-E-A-T signals. Medical review adds critical credibility for AI evaluation.',
    category: 'authority',
    priority: 'critical',
    effort: 'long-term',
    estimatedHours: 80,
    estimatedImpact: 28,
    industries: ['healthtech'],
    actionItems: [
      'Establish medical advisory board',
      'Create review workflow for content',
      'Display reviewer credentials prominently',
      'Add MedicalWebPage schema',
      'Include last reviewed dates',
      'Link to medical credentials',
    ],
    successMetrics: ['All content medically reviewed', 'Improved trust metrics'],
    tags: ['medical', 'eeat', 'health', 'review-process'],
  },
];

// ================================================================
// CRISIS MANAGEMENT TEMPLATES
// ================================================================

export const CRISIS_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'crisis-reputation-repair',
    title: 'AI Reputation Repair Strategy',
    description: 'Systematic approach to correcting negative or inaccurate AI perceptions of your brand.',
    rationale: 'Negative AI perception can persist if not actively addressed through strategic content and citations.',
    category: 'crisis-management',
    priority: 'critical',
    effort: 'long-term',
    estimatedHours: 100,
    estimatedImpact: 30,
    industries: ['all'],
    actionItems: [
      'Document all inaccurate AI responses',
      'Create authoritative correction content',
      'Build positive citation sources',
      'Request corrections where possible',
      'Monitor AI responses weekly',
      'Build positive review pipeline',
    ],
    successMetrics: ['Reduction in negative mentions', 'Improved AI sentiment'],
    tags: ['crisis', 'reputation', 'correction', 'negative-press'],
  },
  {
    id: 'crisis-competitor-attack',
    title: 'Competitive Differentiation Defense',
    description: 'Counter negative competitive positioning in AI responses through strategic content.',
    rationale: 'When competitors are favored in AI responses, strategic differentiation content can shift perception.',
    category: 'competitive',
    priority: 'high',
    effort: 'medium-term',
    estimatedHours: 50,
    estimatedImpact: 22,
    industries: ['all'],
    actionItems: [
      'Analyze competitor AI mentions',
      'Identify differentiation gaps',
      'Create head-to-head comparison content',
      'Highlight unique strengths',
      'Build case studies showing advantages',
      'Target competitive keywords',
    ],
    successMetrics: ['Improved competitive positioning', 'More balanced AI comparisons'],
    tags: ['competitive', 'differentiation', 'positioning', 'defense'],
  },
];

// ================================================================
// LOCAL SEO TEMPLATES
// ================================================================

export const LOCAL_TEMPLATES: RecommendationTemplate[] = [
  {
    id: 'local-multi-location',
    title: 'Multi-Location Local Optimization',
    description: 'Optimize local presence for each business location with dedicated pages and profiles.',
    rationale: 'AI assistants frequently provide location-based recommendations. Local optimization ensures visibility.',
    category: 'local-seo',
    priority: 'high',
    effort: 'medium-term',
    estimatedHours: 40,
    estimatedImpact: 20,
    industries: ['hospitality', 'real-estate', 'professional-services', 'ecommerce'],
    actionItems: [
      'Create individual Google Business profiles per location',
      'Build location-specific landing pages',
      'Add LocalBusiness schema to each page',
      'Implement local content strategy',
      'Build local citations and directories',
      'Encourage location-specific reviews',
    ],
    successMetrics: ['Local pack visibility', 'Location page traffic'],
    tags: ['local', 'multi-location', 'google-business', 'citations'],
  },
];

// ================================================================
// TEMPLATE COLLECTIONS
// ================================================================

export const ALL_TEMPLATES: RecommendationTemplate[] = [
  ...QUICK_WIN_TEMPLATES,
  ...CONTENT_TEMPLATES,
  ...AUTHORITY_TEMPLATES,
  ...SAAS_TEMPLATES,
  ...ECOMMERCE_TEMPLATES,
  ...HEALTHTECH_TEMPLATES,
  ...CRISIS_TEMPLATES,
  ...LOCAL_TEMPLATES,
];

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: TemplateIndustry): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t =>
    t.industries.includes('all') || t.industries.includes(industry)
  );
}

/**
 * Get templates by effort level
 */
export function getTemplatesByEffort(effort: TemplateEffort): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t => t.effort === effort);
}

/**
 * Get quick wins
 */
export function getQuickWins(): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t => t.effort === 'quick-win');
}

/**
 * Get high-impact templates
 */
export function getHighImpactTemplates(minImpact: number = 20): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t => t.estimatedImpact >= minImpact);
}

/**
 * Search templates by tags
 */
export function searchTemplatesByTags(tags: string[]): RecommendationTemplate[] {
  return ALL_TEMPLATES.filter(t =>
    tags.some(tag => t.tags.includes(tag.toLowerCase()))
  );
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): RecommendationTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Get related templates
 */
export function getRelatedTemplates(templateId: string): RecommendationTemplate[] {
  const template = getTemplateById(templateId);
  if (!template) return [];

  // Get by related IDs
  const relatedIds = template.relatedTemplates || [];
  const byId = ALL_TEMPLATES.filter(t => relatedIds.includes(t.id));

  // Get by same category
  const byCategory = ALL_TEMPLATES.filter(
    t => t.id !== templateId && t.category === template.category
  ).slice(0, 3);

  // Get by shared tags
  const byTags = ALL_TEMPLATES.filter(
    t => t.id !== templateId && t.tags.some(tag => template.tags.includes(tag))
  ).slice(0, 3);

  // Combine and dedupe
  const all = [...byId, ...byCategory, ...byTags];
  const unique = all.filter((t, i) => all.findIndex(x => x.id === t.id) === i);

  return unique.slice(0, 5);
}

/**
 * Get template statistics
 */
export function getTemplateStats(): {
  total: number;
  byCategory: Record<string, number>;
  byIndustry: Record<string, number>;
  byEffort: Record<string, number>;
  averageImpact: number;
  averageHours: number;
} {
  const byCategory: Record<string, number> = {};
  const byIndustry: Record<string, number> = {};
  const byEffort: Record<string, number> = {};

  let totalImpact = 0;
  let totalHours = 0;

  for (const template of ALL_TEMPLATES) {
    // Category
    byCategory[template.category] = (byCategory[template.category] || 0) + 1;

    // Industries
    for (const industry of template.industries) {
      byIndustry[industry] = (byIndustry[industry] || 0) + 1;
    }

    // Effort
    byEffort[template.effort] = (byEffort[template.effort] || 0) + 1;

    totalImpact += template.estimatedImpact;
    totalHours += template.estimatedHours;
  }

  return {
    total: ALL_TEMPLATES.length,
    byCategory,
    byIndustry,
    byEffort,
    averageImpact: totalImpact / ALL_TEMPLATES.length,
    averageHours: totalHours / ALL_TEMPLATES.length,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ALL_TEMPLATES,
  QUICK_WIN_TEMPLATES,
  CONTENT_TEMPLATES,
  AUTHORITY_TEMPLATES,
  SAAS_TEMPLATES,
  ECOMMERCE_TEMPLATES,
  HEALTHTECH_TEMPLATES,
  CRISIS_TEMPLATES,
  LOCAL_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByIndustry,
  getTemplatesByEffort,
  getQuickWins,
  getHighImpactTemplates,
  searchTemplatesByTags,
  getTemplateById,
  getRelatedTemplates,
  getTemplateStats,
};
