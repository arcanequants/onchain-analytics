/**
 * Perception Query Builder Tests
 *
 * Phase 1, Week 1, Day 2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateQueries,
  sortQueriesByPriority,
  filterByBudget,
  buildQueryPrompt,
  parseQueryResponse,
  aggregateResults,
  QUERY_TEMPLATES,
  INDUSTRY_USE_CASES,
  type PerceptionQuery,
  type QueryResult,
  type QueryIntent,
} from './index';
import type { IndustryDetection } from '../ai/schemas';

// ================================================================
// TEST DATA
// ================================================================

const mockIndustryDetection: IndustryDetection = {
  industry: 'saas',
  subIndustry: 'crm',
  country: 'US',
  entityType: 'business',
  competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
  confidence: 0.85,
  reasoning: 'CRM software indicators',
};

const mockQuery: PerceptionQuery = {
  id: 'pq_test123',
  query: "What's the best CRM software for sales teams?",
  intent: 'recommendation',
  priority: 'critical',
  industry: 'saas',
  targetBrand: 'TestCRM',
  expectedCompetitors: ['Salesforce', 'HubSpot'],
  variables: {
    brand: 'TestCRM',
    industry: 'saas',
    query: "What's the best CRM software for sales teams?",
  },
};

// ================================================================
// QUERY TEMPLATES TESTS
// ================================================================

describe('QUERY_TEMPLATES', () => {
  it('should have default templates for all intents', () => {
    const intents: QueryIntent[] = [
      'recommendation', 'comparison', 'evaluation', 'alternatives',
      'use_case', 'ranking', 'review', 'feature',
    ];

    for (const intent of intents) {
      expect(QUERY_TEMPLATES.default[intent]).toBeDefined();
      expect(QUERY_TEMPLATES.default[intent].length).toBeGreaterThan(0);
    }
  });

  it('should have SaaS-specific templates', () => {
    expect(QUERY_TEMPLATES.saas).toBeDefined();
    expect(QUERY_TEMPLATES.saas.recommendation).toBeDefined();
    expect(QUERY_TEMPLATES.saas.recommendation.length).toBeGreaterThan(0);
  });

  it('should have Fintech-specific templates', () => {
    expect(QUERY_TEMPLATES.fintech).toBeDefined();
    expect(QUERY_TEMPLATES.fintech.recommendation).toBeDefined();
  });

  it('should have E-commerce-specific templates', () => {
    expect(QUERY_TEMPLATES.ecommerce).toBeDefined();
    expect(QUERY_TEMPLATES.ecommerce.recommendation).toBeDefined();
  });

  it('should have templates with variable placeholders', () => {
    const template = QUERY_TEMPLATES.default.recommendation[0];
    expect(template).toContain('{');
    expect(template).toContain('}');
  });
});

describe('INDUSTRY_USE_CASES', () => {
  it('should have use cases for each major industry', () => {
    expect(INDUSTRY_USE_CASES.saas).toBeDefined();
    expect(INDUSTRY_USE_CASES.fintech).toBeDefined();
    expect(INDUSTRY_USE_CASES.ecommerce).toBeDefined();
    expect(INDUSTRY_USE_CASES.healthtech).toBeDefined();
    expect(INDUSTRY_USE_CASES.marketing).toBeDefined();
    expect(INDUSTRY_USE_CASES.default).toBeDefined();
  });

  it('should have at least 5 use cases per industry', () => {
    for (const [industry, useCases] of Object.entries(INDUSTRY_USE_CASES)) {
      expect(useCases.length).toBeGreaterThanOrEqual(5);
    }
  });
});

// ================================================================
// QUERY GENERATION TESTS
// ================================================================

describe('generateQueries', () => {
  it('should generate queries for a brand', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);

    expect(queries.length).toBeGreaterThan(0);
    expect(queries[0]).toHaveProperty('id');
    expect(queries[0]).toHaveProperty('query');
    expect(queries[0]).toHaveProperty('intent');
    expect(queries[0]).toHaveProperty('priority');
  });

  it('should include brand name in variables', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);

    for (const query of queries) {
      expect(query.targetBrand).toBe('TestCRM');
      expect(query.variables.brand).toBe('TestCRM');
    }
  });

  it('should use industry from detection', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);

    for (const query of queries) {
      expect(query.industry).toBe('saas');
    }
  });

  it('should include detected competitors', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);

    for (const query of queries) {
      expect(query.expectedCompetitors).toContain('Salesforce');
    }
  });

  it('should limit queries per intent based on options', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection, {
      queriesPerIntent: 1,
      intents: ['recommendation', 'comparison'],
    });

    const recommendationQueries = queries.filter(q => q.intent === 'recommendation');
    const comparisonQueries = queries.filter(q => q.intent === 'comparison');

    expect(recommendationQueries.length).toBeLessThanOrEqual(1);
    expect(comparisonQueries.length).toBeLessThanOrEqual(1);
  });

  it('should filter by minimum priority', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection, {
      minPriority: 'high',
    });

    for (const query of queries) {
      expect(['critical', 'high']).toContain(query.priority);
    }
  });

  it('should generate unique IDs for each query', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);
    const ids = queries.map(q => q.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should include custom competitors from options', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection, {
      competitors: ['CustomCompetitor'],
    });

    const hasCustomCompetitor = queries.some(
      q => q.expectedCompetitors.includes('CustomCompetitor')
    );
    expect(hasCustomCompetitor).toBe(true);
  });

  it('should use custom use cases when provided', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection, {
      customUseCases: ['custom workflow automation'],
    });

    // Queries should be generated (custom use cases enhance, not replace)
    expect(queries.length).toBeGreaterThan(0);
  });

  it('should handle unknown industry by using defaults', () => {
    const unknownIndustry: IndustryDetection = {
      ...mockIndustryDetection,
      industry: 'unknown-industry',
    };

    const queries = generateQueries('TestBrand', unknownIndustry);

    expect(queries.length).toBeGreaterThan(0);
  });
});

// ================================================================
// QUERY SORTING TESTS
// ================================================================

describe('sortQueriesByPriority', () => {
  it('should sort critical queries first', () => {
    const queries: PerceptionQuery[] = [
      { ...mockQuery, id: '1', priority: 'low' },
      { ...mockQuery, id: '2', priority: 'critical' },
      { ...mockQuery, id: '3', priority: 'medium' },
    ];

    const sorted = sortQueriesByPriority(queries);

    expect(sorted[0].priority).toBe('critical');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  it('should sort by intent type within same priority', () => {
    const queries: PerceptionQuery[] = [
      { ...mockQuery, id: '1', priority: 'high', intent: 'feature' },
      { ...mockQuery, id: '2', priority: 'high', intent: 'recommendation' },
      { ...mockQuery, id: '3', priority: 'high', intent: 'comparison' },
    ];

    const sorted = sortQueriesByPriority(queries);

    expect(sorted[0].intent).toBe('recommendation');
    expect(sorted[1].intent).toBe('comparison');
    expect(sorted[2].intent).toBe('feature');
  });

  it('should not modify original array', () => {
    const queries: PerceptionQuery[] = [
      { ...mockQuery, id: '1', priority: 'low' },
      { ...mockQuery, id: '2', priority: 'critical' },
    ];

    sortQueriesByPriority(queries);

    expect(queries[0].priority).toBe('low');
    expect(queries[1].priority).toBe('critical');
  });
});

// ================================================================
// BUDGET FILTERING TESTS
// ================================================================

describe('filterByBudget', () => {
  it('should limit queries to budget', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);
    const filtered = filterByBudget(queries, 3);

    expect(filtered.length).toBe(3);
  });

  it('should prioritize critical queries when limiting', () => {
    const queries: PerceptionQuery[] = [
      { ...mockQuery, id: '1', priority: 'low' },
      { ...mockQuery, id: '2', priority: 'critical' },
      { ...mockQuery, id: '3', priority: 'medium' },
      { ...mockQuery, id: '4', priority: 'high' },
    ];

    const filtered = filterByBudget(queries, 2);

    expect(filtered[0].priority).toBe('critical');
    expect(filtered[1].priority).toBe('high');
  });

  it('should return all queries if budget exceeds count', () => {
    const queries: PerceptionQuery[] = [
      { ...mockQuery, id: '1' },
      { ...mockQuery, id: '2' },
    ];

    const filtered = filterByBudget(queries, 10);

    expect(filtered.length).toBe(2);
  });

  it('should return empty array for zero budget', () => {
    const queries = generateQueries('TestCRM', mockIndustryDetection);
    const filtered = filterByBudget(queries, 0);

    expect(filtered.length).toBe(0);
  });
});

// ================================================================
// PROMPT BUILDING TESTS
// ================================================================

describe('buildQueryPrompt', () => {
  it('should include query in prompt', () => {
    const prompt = buildQueryPrompt(mockQuery);

    expect(prompt).toContain(mockQuery.query);
  });

  it('should include brand name in prompt', () => {
    const prompt = buildQueryPrompt(mockQuery);

    expect(prompt).toContain('TestCRM');
  });

  it('should include industry context', () => {
    const prompt = buildQueryPrompt(mockQuery);

    expect(prompt).toContain('saas');
  });

  it('should include CoT by default', () => {
    const prompt = buildQueryPrompt(mockQuery);

    expect(prompt).toContain('step by step');
  });

  it('should exclude CoT when disabled', () => {
    const prompt = buildQueryPrompt(mockQuery, { includeCoT: false });

    // Should still have content, just less verbose
    expect(prompt).toContain(mockQuery.query);
  });

  it('should include few-shot examples by default', () => {
    const prompt = buildQueryPrompt(mockQuery);

    expect(prompt).toContain('Example');
  });
});

// ================================================================
// RESPONSE PARSING TESTS
// ================================================================

describe('parseQueryResponse', () => {
  it('should detect brand mentioned', () => {
    const response = `For CRM software, I recommend:
    1. **TestCRM** - Great for sales teams
    2. Salesforce - Enterprise choice
    3. HubSpot - Good for marketing`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.brandMentioned).toBe(true);
    }
  });

  it('should detect brand not mentioned', () => {
    const response = `For CRM software, I recommend:
    1. Salesforce
    2. HubSpot
    3. Pipedrive`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.brandMentioned).toBe(false);
    }
  });

  it('should detect position in numbered list', () => {
    const response = `Here are my recommendations:
    1. Salesforce - Enterprise
    2. TestCRM - Great value
    3. HubSpot - Marketing focus`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mentionPosition).toBe(2);
    }
  });

  it('should detect first position', () => {
    const response = `Top picks:
    1. TestCRM - Best for small teams
    2. Salesforce - Enterprise`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mentionPosition).toBe(1);
    }
  });

  it('should detect positive sentiment', () => {
    const response = `TestCRM is an excellent choice with great features and outstanding support.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sentiment).toBe('positive');
    }
  });

  it('should detect negative sentiment', () => {
    const response = `TestCRM has poor documentation and limited features. I'd avoid it.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.sentiment).toBe('negative');
    }
  });

  it('should extract mention context', () => {
    const response = `When looking at CRM options, TestCRM stands out for its ease of use and affordable pricing compared to competitors.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.mentionContext).toBeTruthy();
      expect(result.value.mentionContext).toContain('TestCRM');
    }
  });

  it('should extract attributes mentioned', () => {
    const response = `TestCRM is user-friendly and offers great integrations. It's very affordable and has excellent customer support.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.attributesMentioned.length).toBeGreaterThan(0);
    }
  });

  it('should find competitor mentions', () => {
    const response = `TestCRM competes well against Salesforce and HubSpot in the CRM market.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.competitorsMentioned).toContain('Salesforce');
      expect(result.value.competitorsMentioned).toContain('HubSpot');
    }
  });

  it('should count total brand mentions', () => {
    const response = `Comparing CRM platforms: Salesforce leads the enterprise market, HubSpot dominates marketing automation, TestCRM is great for SMBs, and Pipedrive focuses on sales.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.totalMentions).toBeGreaterThanOrEqual(4);
    }
  });

  it('should include query in result', () => {
    const response = `TestCRM is a good choice.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.query).toBe(mockQuery.query);
    }
  });

  it('should include industry context', () => {
    const response = `TestCRM is a good choice.`;

    const result = parseQueryResponse(response, mockQuery);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.industryContext).toBe('saas');
    }
  });
});

// ================================================================
// RESULT AGGREGATION TESTS
// ================================================================

describe('aggregateResults', () => {
  const createMockResult = (overrides: Partial<QueryResult> = {}): QueryResult => ({
    query: mockQuery,
    provider: 'openai',
    rawResponse: 'Test response',
    parsed: {
      brandMentioned: true,
      mentionPosition: 1,
      totalMentions: 3,
      mentionContext: 'TestCRM is great',
      sentiment: 'positive',
      attributesMentioned: ['ease of use'],
      competitorsMentioned: ['Salesforce'],
      query: mockQuery.query,
      industryContext: 'saas',
      confidence: 0.8,
    },
    latencyMs: 500,
    tokensUsed: { input: 100, output: 200, total: 300 },
    estimatedCostUsd: 0.001,
    cached: false,
    ...overrides,
  });

  it('should calculate visibility score', () => {
    const results = [
      createMockResult(),
      createMockResult({ parsed: { ...createMockResult().parsed, mentionPosition: 2 } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.visibilityScore).toBeGreaterThan(0);
      expect(aggregation.value.visibilityScore).toBeLessThanOrEqual(100);
    }
  });

  it('should calculate mention rate', () => {
    const results = [
      createMockResult(),
      createMockResult({ parsed: { ...createMockResult().parsed, brandMentioned: false } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.mentionRate).toBe(0.5);
    }
  });

  it('should calculate average position', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, mentionPosition: 1 } }),
      createMockResult({ parsed: { ...createMockResult().parsed, mentionPosition: 3 } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.averagePosition).toBe(2);
    }
  });

  it('should aggregate sentiment as positive', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'positive' } }),
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'positive' } }),
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'neutral' } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.overallSentiment).toBe('positive');
    }
  });

  it('should aggregate sentiment as mixed', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'positive' } }),
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'negative' } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.overallSentiment).toBe('mixed');
    }
  });

  it('should extract top attributes', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, attributesMentioned: ['ease of use', 'pricing'] } }),
      createMockResult({ parsed: { ...createMockResult().parsed, attributesMentioned: ['ease of use', 'support'] } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.topAttributes).toContain('ease of use');
    }
  });

  it('should extract top competitors', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, competitorsMentioned: ['Salesforce', 'HubSpot'] } }),
      createMockResult({ parsed: { ...createMockResult().parsed, competitorsMentioned: ['Salesforce', 'Pipedrive'] } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.topCompetitors[0]).toBe('Salesforce');
    }
  });

  it('should include intent breakdown', () => {
    const results = [
      createMockResult({ query: { ...mockQuery, intent: 'recommendation' } }),
      createMockResult({ query: { ...mockQuery, intent: 'recommendation' } }),
      createMockResult({ query: { ...mockQuery, intent: 'comparison' } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.intentBreakdown.recommendation.count).toBe(2);
      expect(aggregation.value.intentBreakdown.comparison.count).toBe(1);
    }
  });

  it('should fail for empty results', () => {
    const aggregation = aggregateResults([]);

    expect(aggregation.ok).toBe(false);
  });

  it('should calculate confidence based on sample size', () => {
    const results = Array(10).fill(null).map(() => createMockResult());

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.confidence).toBeGreaterThan(0.5);
    }
  });

  it('should handle all negative sentiment', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'negative' } }),
      createMockResult({ parsed: { ...createMockResult().parsed, sentiment: 'negative' } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.overallSentiment).toBe('negative');
    }
  });

  it('should handle no positions', () => {
    const results = [
      createMockResult({ parsed: { ...createMockResult().parsed, mentionPosition: null } }),
      createMockResult({ parsed: { ...createMockResult().parsed, mentionPosition: null } }),
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      expect(aggregation.value.averagePosition).toBeNull();
    }
  });
});

// ================================================================
// VISIBILITY SCORE TESTS
// ================================================================

describe('visibility score calculation', () => {
  it('should give high score for 100% mention rate + position 1 + positive sentiment', () => {
    const results = [
      {
        query: mockQuery,
        provider: 'openai' as const,
        rawResponse: '',
        parsed: {
          brandMentioned: true,
          mentionPosition: 1,
          totalMentions: 1,
          mentionContext: '',
          sentiment: 'positive' as const,
          attributesMentioned: [],
          competitorsMentioned: [],
          query: '',
          industryContext: '',
          confidence: 0.9,
        },
        latencyMs: 0,
        tokensUsed: { input: 0, output: 0, total: 0 },
        estimatedCostUsd: 0,
        cached: false,
      },
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      // 60 (mention) + 25 (position) + 15 (sentiment) = 100
      expect(aggregation.value.visibilityScore).toBe(100);
    }
  });

  it('should give low score for 0% mention rate', () => {
    const results = [
      {
        query: mockQuery,
        provider: 'openai' as const,
        rawResponse: '',
        parsed: {
          brandMentioned: false,
          mentionPosition: null,
          totalMentions: 5,
          mentionContext: null,
          sentiment: null,
          attributesMentioned: [],
          competitorsMentioned: [],
          query: '',
          industryContext: '',
          confidence: 0.9,
        },
        latencyMs: 0,
        tokensUsed: { input: 0, output: 0, total: 0 },
        estimatedCostUsd: 0,
        cached: false,
      },
    ];

    const aggregation = aggregateResults(results);

    expect(aggregation.ok).toBe(true);
    if (aggregation.ok) {
      // 0 mentions = low score
      expect(aggregation.value.visibilityScore).toBeLessThan(20);
    }
  });
});
