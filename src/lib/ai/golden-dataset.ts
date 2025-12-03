/**
 * Golden Dataset for AI Response Testing
 *
 * Phase 1, Week 2, Day 5
 *
 * A curated set of test cases with known-good expected outputs
 * for validating AI model responses across providers.
 *
 * Used for:
 * - Regression testing
 * - Model comparison
 * - Quality assurance
 * - Benchmark scoring
 */

// ================================================================
// TYPES
// ================================================================

export type GoldenTestCategory =
  | 'brand_recognition'
  | 'industry_classification'
  | 'sentiment_analysis'
  | 'recommendation_quality'
  | 'factual_accuracy'
  | 'citation_accuracy'
  | 'competitive_positioning'
  | 'content_extraction';

export type TestDifficulty = 'easy' | 'medium' | 'hard';

export interface GoldenTestCase {
  id: string;
  category: GoldenTestCategory;
  difficulty: TestDifficulty;
  name: string;
  description: string;
  input: GoldenTestInput;
  expectedOutput: GoldenExpectedOutput;
  metadata: GoldenTestMetadata;
}

export interface GoldenTestInput {
  /** Brand or URL being analyzed */
  brand?: string;
  url?: string;
  /** Query to AI */
  query: string;
  /** Context or additional data */
  context?: Record<string, unknown>;
}

export interface GoldenExpectedOutput {
  /** Expected mentions or recognition */
  shouldMentionBrand?: boolean;
  /** Expected sentiment range */
  sentimentRange?: { min: number; max: number };
  /** Required keywords in response */
  requiredKeywords?: string[];
  /** Forbidden keywords (hallucination indicators) */
  forbiddenKeywords?: string[];
  /** Expected industry classification */
  expectedIndustry?: string;
  /** Expected competitive position */
  competitivePosition?: 'leader' | 'challenger' | 'follower' | 'niche';
  /** Minimum confidence score */
  minConfidence?: number;
  /** Expected facts that should be present */
  expectedFacts?: string[];
  /** Custom validation function (stringified) */
  customValidation?: string;
}

export interface GoldenTestMetadata {
  /** When this test was created */
  createdAt: string;
  /** Last verification date */
  lastVerified: string;
  /** Human-verified accuracy */
  humanVerified: boolean;
  /** Notes about the test */
  notes?: string;
  /** Tags for filtering */
  tags: string[];
}

export interface GoldenDatasetStats {
  totalTests: number;
  byCategory: Record<GoldenTestCategory, number>;
  byDifficulty: Record<TestDifficulty, number>;
  verifiedCount: number;
}

// ================================================================
// GOLDEN DATASET
// ================================================================

export const GOLDEN_DATASET: GoldenTestCase[] = [
  // ============================================================
  // BRAND RECOGNITION TESTS
  // ============================================================
  {
    id: 'br-001',
    category: 'brand_recognition',
    difficulty: 'easy',
    name: 'Major Tech Company Recognition',
    description: 'AI should correctly identify and describe Apple Inc.',
    input: {
      brand: 'Apple',
      query: 'What is Apple known for in the technology industry?',
    },
    expectedOutput: {
      shouldMentionBrand: true,
      requiredKeywords: ['iPhone', 'technology', 'hardware'],
      forbiddenKeywords: ['fruit', 'food'],
      expectedIndustry: 'Technology',
      minConfidence: 0.9,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['tech', 'fortune500', 'consumer'],
    },
  },
  {
    id: 'br-002',
    category: 'brand_recognition',
    difficulty: 'medium',
    name: 'B2B SaaS Brand Recognition',
    description: 'AI should recognize Salesforce as a CRM leader',
    input: {
      brand: 'Salesforce',
      query: 'What is Salesforce and what category does it lead in?',
    },
    expectedOutput: {
      shouldMentionBrand: true,
      requiredKeywords: ['CRM', 'cloud', 'enterprise'],
      expectedIndustry: 'Software',
      competitivePosition: 'leader',
      minConfidence: 0.85,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['saas', 'b2b', 'enterprise'],
    },
  },
  {
    id: 'br-003',
    category: 'brand_recognition',
    difficulty: 'hard',
    name: 'Niche B2B Company Recognition',
    description: 'AI should recognize lesser-known B2B companies',
    input: {
      brand: 'Datadog',
      query: 'What does Datadog do and who are its main competitors?',
    },
    expectedOutput: {
      shouldMentionBrand: true,
      requiredKeywords: ['monitoring', 'observability', 'cloud'],
      expectedIndustry: 'DevOps',
      minConfidence: 0.7,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['devops', 'monitoring', 'saas'],
    },
  },

  // ============================================================
  // INDUSTRY CLASSIFICATION TESTS
  // ============================================================
  {
    id: 'ic-001',
    category: 'industry_classification',
    difficulty: 'easy',
    name: 'E-commerce Classification',
    description: 'AI should classify Amazon as e-commerce/retail',
    input: {
      url: 'https://www.amazon.com',
      query: 'What industry does this website belong to?',
    },
    expectedOutput: {
      expectedIndustry: 'E-commerce',
      requiredKeywords: ['retail', 'shopping', 'marketplace'],
      minConfidence: 0.95,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['ecommerce', 'retail'],
    },
  },
  {
    id: 'ic-002',
    category: 'industry_classification',
    difficulty: 'medium',
    name: 'Fintech Classification',
    description: 'AI should classify Stripe as fintech/payments',
    input: {
      url: 'https://stripe.com',
      query: 'What industry category does Stripe operate in?',
    },
    expectedOutput: {
      expectedIndustry: 'Fintech',
      requiredKeywords: ['payments', 'financial', 'processing'],
      minConfidence: 0.85,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['fintech', 'payments'],
    },
  },
  {
    id: 'ic-003',
    category: 'industry_classification',
    difficulty: 'hard',
    name: 'Hybrid Industry Classification',
    description: 'AI should identify multi-industry companies correctly',
    input: {
      brand: 'Tesla',
      query: 'What industries does Tesla operate in?',
    },
    expectedOutput: {
      expectedIndustry: 'Automotive',
      requiredKeywords: ['automotive', 'energy', 'electric'],
      minConfidence: 0.8,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['automotive', 'energy', 'multi-industry'],
    },
  },

  // ============================================================
  // SENTIMENT ANALYSIS TESTS
  // ============================================================
  {
    id: 'sa-001',
    category: 'sentiment_analysis',
    difficulty: 'easy',
    name: 'Positive Brand Sentiment',
    description: 'AI should detect positive sentiment for highly-rated brands',
    input: {
      brand: 'Costco',
      query: 'What do customers think about Costco?',
    },
    expectedOutput: {
      sentimentRange: { min: 0.6, max: 1.0 },
      requiredKeywords: ['value', 'quality', 'membership'],
      minConfidence: 0.8,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['retail', 'positive-sentiment'],
    },
  },
  {
    id: 'sa-002',
    category: 'sentiment_analysis',
    difficulty: 'medium',
    name: 'Mixed Sentiment Analysis',
    description: 'AI should detect nuanced/mixed sentiment',
    input: {
      brand: 'Meta',
      query: 'What is the public perception of Meta (Facebook)?',
    },
    expectedOutput: {
      sentimentRange: { min: -0.3, max: 0.5 },
      requiredKeywords: ['privacy', 'social media'],
      minConfidence: 0.7,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['tech', 'mixed-sentiment', 'controversial'],
    },
  },

  // ============================================================
  // RECOMMENDATION QUALITY TESTS
  // ============================================================
  {
    id: 'rq-001',
    category: 'recommendation_quality',
    difficulty: 'easy',
    name: 'Product Recommendation - Clear Leader',
    description: 'AI should recommend market leaders for common queries',
    input: {
      query: 'What is the best CRM software for small businesses?',
    },
    expectedOutput: {
      requiredKeywords: ['HubSpot', 'Salesforce', 'CRM'],
      minConfidence: 0.85,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['recommendation', 'crm', 'smb'],
    },
  },
  {
    id: 'rq-002',
    category: 'recommendation_quality',
    difficulty: 'medium',
    name: 'Service Recommendation - Competitive Market',
    description: 'AI should provide balanced recommendations in competitive markets',
    input: {
      query: 'What are the best project management tools?',
    },
    expectedOutput: {
      requiredKeywords: ['project management'],
      minConfidence: 0.75,
      expectedFacts: [
        'Should mention multiple options',
        'Should discuss pros and cons',
      ],
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['recommendation', 'project-management'],
    },
  },

  // ============================================================
  // FACTUAL ACCURACY TESTS
  // ============================================================
  {
    id: 'fa-001',
    category: 'factual_accuracy',
    difficulty: 'easy',
    name: 'Company Founding Facts',
    description: 'AI should provide accurate founding information',
    input: {
      brand: 'Google',
      query: 'When was Google founded and by whom?',
    },
    expectedOutput: {
      requiredKeywords: ['1998', 'Larry Page', 'Sergey Brin', 'Stanford'],
      forbiddenKeywords: ['Microsoft', 'Apple'],
      minConfidence: 0.95,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['factual', 'history'],
    },
  },
  {
    id: 'fa-002',
    category: 'factual_accuracy',
    difficulty: 'hard',
    name: 'Complex Business Model Facts',
    description: 'AI should accurately describe complex business models',
    input: {
      brand: 'Uber',
      query: 'Explain Uber business model and revenue streams',
    },
    expectedOutput: {
      requiredKeywords: ['ride-sharing', 'platform', 'commission'],
      forbiddenKeywords: ['owns vehicles', 'employees drivers'],
      minConfidence: 0.8,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['business-model', 'complex'],
    },
  },

  // ============================================================
  // COMPETITIVE POSITIONING TESTS
  // ============================================================
  {
    id: 'cp-001',
    category: 'competitive_positioning',
    difficulty: 'medium',
    name: 'Market Leader Identification',
    description: 'AI should correctly identify market leaders',
    input: {
      query: 'Who is the leader in cloud infrastructure?',
    },
    expectedOutput: {
      requiredKeywords: ['AWS', 'Amazon Web Services', 'cloud'],
      competitivePosition: 'leader',
      minConfidence: 0.9,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['cloud', 'market-leader'],
    },
  },
  {
    id: 'cp-002',
    category: 'competitive_positioning',
    difficulty: 'hard',
    name: 'Challenger Brand Positioning',
    description: 'AI should recognize challenger brands correctly',
    input: {
      brand: 'AMD',
      query: 'How does AMD compare to Intel in the processor market?',
    },
    expectedOutput: {
      requiredKeywords: ['processor', 'CPU', 'competitor', 'Ryzen'],
      competitivePosition: 'challenger',
      minConfidence: 0.8,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['hardware', 'challenger'],
    },
  },

  // ============================================================
  // CONTENT EXTRACTION TESTS
  // ============================================================
  {
    id: 'ce-001',
    category: 'content_extraction',
    difficulty: 'easy',
    name: 'Homepage Content Extraction',
    description: 'AI should extract key information from homepage',
    input: {
      url: 'https://www.shopify.com',
      query: 'What services does this company offer based on their website?',
    },
    expectedOutput: {
      requiredKeywords: ['ecommerce', 'online store', 'sell'],
      expectedIndustry: 'E-commerce Platform',
      minConfidence: 0.85,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['content-extraction', 'ecommerce'],
    },
  },
  {
    id: 'ce-002',
    category: 'content_extraction',
    difficulty: 'medium',
    name: 'Value Proposition Extraction',
    description: 'AI should identify main value propositions',
    input: {
      url: 'https://notion.so',
      query: 'What is the main value proposition of Notion?',
    },
    expectedOutput: {
      requiredKeywords: ['workspace', 'notes', 'collaboration'],
      minConfidence: 0.8,
    },
    metadata: {
      createdAt: '2025-12-01',
      lastVerified: '2025-12-01',
      humanVerified: true,
      tags: ['content-extraction', 'value-prop'],
    },
  },
];

// ================================================================
// DATASET UTILITIES
// ================================================================

/**
 * Get tests by category
 */
export function getTestsByCategory(category: GoldenTestCategory): GoldenTestCase[] {
  return GOLDEN_DATASET.filter(test => test.category === category);
}

/**
 * Get tests by difficulty
 */
export function getTestsByDifficulty(difficulty: TestDifficulty): GoldenTestCase[] {
  return GOLDEN_DATASET.filter(test => test.difficulty === difficulty);
}

/**
 * Get tests by tag
 */
export function getTestsByTag(tag: string): GoldenTestCase[] {
  return GOLDEN_DATASET.filter(test => test.metadata.tags.includes(tag));
}

/**
 * Get dataset statistics
 */
export function getDatasetStats(): GoldenDatasetStats {
  const stats: GoldenDatasetStats = {
    totalTests: GOLDEN_DATASET.length,
    byCategory: {} as Record<GoldenTestCategory, number>,
    byDifficulty: {} as Record<TestDifficulty, number>,
    verifiedCount: 0,
  };

  const categories: GoldenTestCategory[] = [
    'brand_recognition',
    'industry_classification',
    'sentiment_analysis',
    'recommendation_quality',
    'factual_accuracy',
    'citation_accuracy',
    'competitive_positioning',
    'content_extraction',
  ];

  const difficulties: TestDifficulty[] = ['easy', 'medium', 'hard'];

  // Initialize counts
  categories.forEach(cat => (stats.byCategory[cat] = 0));
  difficulties.forEach(diff => (stats.byDifficulty[diff] = 0));

  // Count
  GOLDEN_DATASET.forEach(test => {
    stats.byCategory[test.category]++;
    stats.byDifficulty[test.difficulty]++;
    if (test.metadata.humanVerified) {
      stats.verifiedCount++;
    }
  });

  return stats;
}

/**
 * Get a random subset of tests for quick validation
 */
export function getRandomTestSubset(count: number): GoldenTestCase[] {
  const shuffled = [...GOLDEN_DATASET].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, GOLDEN_DATASET.length));
}

/**
 * Get test by ID
 */
export function getTestById(id: string): GoldenTestCase | undefined {
  return GOLDEN_DATASET.find(test => test.id === id);
}

// ================================================================
// EXPORTS
// ================================================================

export default GOLDEN_DATASET;
