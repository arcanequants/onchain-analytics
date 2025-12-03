/**
 * Dimensional Model for Analytics
 *
 * Phase 4, Week 8 Extended - Data Engineering Checklist
 *
 * Features:
 * - Star schema design
 * - Fact and dimension tables
 * - Slowly changing dimensions (SCD Type 2)
 * - Aggregation layers
 */

// ============================================================================
// TYPES - DIMENSION TABLES
// ============================================================================

/**
 * Dimension: Brand
 * Slowly Changing Dimension Type 2
 */
export interface DimBrand {
  brandKey: number;           // Surrogate key
  brandId: string;            // Natural key
  brandName: string;
  displayName: string;
  industry: string;
  industryCode: string;       // NAICS code
  subIndustry?: string;
  companySize: 'startup' | 'smb' | 'mid_market' | 'enterprise' | 'unknown';
  headquarters?: string;
  foundedYear?: number;
  website?: string;
  isActive: boolean;
  // SCD Type 2 fields
  effectiveDate: Date;
  expirationDate: Date | null;
  isCurrent: boolean;
  version: number;
}

/**
 * Dimension: Provider
 */
export interface DimProvider {
  providerKey: number;
  providerId: string;
  providerName: string;
  displayName: string;
  providerType: 'llm' | 'search' | 'embedding' | 'hybrid';
  tier: 'premium' | 'standard' | 'free';
  defaultModel?: string;
  capabilities: string[];
  isActive: boolean;
}

/**
 * Dimension: Time
 */
export interface DimTime {
  timeKey: number;            // YYYYMMDDHH format
  fullDate: Date;
  year: number;
  quarter: number;
  month: number;
  monthName: string;
  week: number;
  dayOfMonth: number;
  dayOfWeek: number;
  dayName: string;
  hour: number;
  isWeekend: boolean;
  isBusinessHour: boolean;
  fiscalYear?: number;
  fiscalQuarter?: number;
}

/**
 * Dimension: Query
 */
export interface DimQuery {
  queryKey: number;
  queryHash: string;
  queryTemplate: string;
  queryCategory: string;
  queryIntent: string;
  queryLanguage: string;
  queryComplexity: 'simple' | 'moderate' | 'complex';
  hasComparison: boolean;
  hasRecommendation: boolean;
}

/**
 * Dimension: User
 */
export interface DimUser {
  userKey: number;
  userId: string;
  userTier: 'free' | 'pro' | 'enterprise';
  accountCreatedDate: Date;
  industry?: string;
  companySize?: string;
  country?: string;
  isActive: boolean;
}

/**
 * Dimension: Geography
 */
export interface DimGeography {
  geoKey: number;
  country: string;
  countryCode: string;
  region: string;
  city?: string;
  timezone: string;
  continent: string;
}

// ============================================================================
// TYPES - FACT TABLES
// ============================================================================

/**
 * Fact: Brand Perception Scores
 * Grain: One row per brand, provider, time period
 */
export interface FactBrandPerception {
  perceptionKey: number;
  brandKey: number;
  providerKey: number;
  timeKey: number;
  queryKey: number;
  // Measures
  visibilityScore: number;      // 0-100
  sentimentScore: number;       // -100 to 100
  accuracyScore: number;        // 0-100
  recommendationScore: number;  // 0-100
  overallScore: number;         // 0-100
  // Additional measures
  mentionCount: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  competitorMentionCount: number;
  // Metadata
  confidence: number;
  sampleSize: number;
  processingTimeMs: number;
}

/**
 * Fact: API Usage
 * Grain: One row per API call
 */
export interface FactAPIUsage {
  usageKey: number;
  userKey: number;
  providerKey: number;
  timeKey: number;
  geoKey: number;
  // Measures
  requestCount: number;
  successCount: number;
  errorCount: number;
  latencyMs: number;
  tokensUsed: number;
  costUSD: number;
  // Flags
  wasCached: boolean;
  wasRateLimited: boolean;
}

/**
 * Fact: User Engagement
 * Grain: One row per user session
 */
export interface FactUserEngagement {
  engagementKey: number;
  userKey: number;
  timeKey: number;
  geoKey: number;
  // Measures
  sessionDurationSeconds: number;
  pageViews: number;
  queriesRun: number;
  reportsGenerated: number;
  brandsAnalyzed: number;
  featuresUsed: number;
  // Conversion
  convertedToProTrial: boolean;
  convertedToPaid: boolean;
}

// ============================================================================
// TYPES - AGGREGATION TABLES
// ============================================================================

/**
 * Aggregate: Daily Brand Summary
 */
export interface AggDailyBrandSummary {
  brandKey: number;
  dateKey: number;        // YYYYMMDD
  // Aggregated scores (avg across providers)
  avgVisibilityScore: number;
  avgSentimentScore: number;
  avgAccuracyScore: number;
  avgRecommendationScore: number;
  avgOverallScore: number;
  // Score deltas vs previous day
  visibilityScoreDelta: number;
  sentimentScoreDelta: number;
  overallScoreDelta: number;
  // Counts
  totalMentions: number;
  totalQueries: number;
  uniqueProviders: number;
  // Rankings
  industryRank?: number;
  overallRank?: number;
}

/**
 * Aggregate: Weekly Provider Performance
 */
export interface AggWeeklyProviderPerformance {
  providerKey: number;
  weekKey: number;        // YYYYWW
  // Reliability
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  successRate: number;
  // Latency
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  // Cost
  totalCostUSD: number;
  avgCostPerRequest: number;
  // Quality
  avgQualityScore: number;
  consistencyScore: number;
}

// ============================================================================
// DIMENSION GENERATORS
// ============================================================================

/**
 * Generate time dimension for date range
 */
export function generateTimeDimension(startDate: Date, endDate: Date): DimTime[] {
  const dimensions: DimTime[] = [];
  const current = new Date(startDate);
  let timeKey = 1;

  while (current <= endDate) {
    for (let hour = 0; hour < 24; hour++) {
      const dateWithHour = new Date(current);
      dateWithHour.setHours(hour);

      const dayOfWeek = dateWithHour.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isBusinessHour = !isWeekend && hour >= 9 && hour < 17;

      dimensions.push({
        timeKey,
        fullDate: new Date(dateWithHour),
        year: dateWithHour.getFullYear(),
        quarter: Math.floor(dateWithHour.getMonth() / 3) + 1,
        month: dateWithHour.getMonth() + 1,
        monthName: dateWithHour.toLocaleString('en-US', { month: 'long' }),
        week: getWeekNumber(dateWithHour),
        dayOfMonth: dateWithHour.getDate(),
        dayOfWeek,
        dayName: dateWithHour.toLocaleString('en-US', { weekday: 'long' }),
        hour,
        isWeekend,
        isBusinessHour,
      });

      timeKey++;
    }

    current.setDate(current.getDate() + 1);
  }

  return dimensions;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Generate provider dimension
 */
export function generateProviderDimension(): DimProvider[] {
  return [
    {
      providerKey: 1,
      providerId: 'openai',
      providerName: 'OpenAI',
      displayName: 'OpenAI GPT-4',
      providerType: 'llm',
      tier: 'premium',
      defaultModel: 'gpt-4-turbo',
      capabilities: ['text', 'code', 'vision', 'function_calling'],
      isActive: true,
    },
    {
      providerKey: 2,
      providerId: 'anthropic',
      providerName: 'Anthropic',
      displayName: 'Claude 3',
      providerType: 'llm',
      tier: 'premium',
      defaultModel: 'claude-3-opus',
      capabilities: ['text', 'code', 'vision', 'function_calling'],
      isActive: true,
    },
    {
      providerKey: 3,
      providerId: 'google',
      providerName: 'Google',
      displayName: 'Gemini Pro',
      providerType: 'llm',
      tier: 'standard',
      defaultModel: 'gemini-1.5-pro',
      capabilities: ['text', 'code', 'vision'],
      isActive: true,
    },
    {
      providerKey: 4,
      providerId: 'perplexity',
      providerName: 'Perplexity',
      displayName: 'Perplexity Sonar',
      providerType: 'hybrid',
      tier: 'standard',
      defaultModel: 'sonar-large',
      capabilities: ['text', 'search', 'citations'],
      isActive: true,
    },
  ];
}

// ============================================================================
// SCD TYPE 2 OPERATIONS
// ============================================================================

/**
 * Insert new brand dimension record (SCD Type 2)
 */
export function insertBrandDimension(
  existingRecords: DimBrand[],
  newBrand: Omit<DimBrand, 'brandKey' | 'effectiveDate' | 'expirationDate' | 'isCurrent' | 'version'>
): DimBrand[] {
  const now = new Date();

  // Find current record for this brand
  const currentRecord = existingRecords.find(
    r => r.brandId === newBrand.brandId && r.isCurrent
  );

  // Check if anything changed
  if (currentRecord) {
    const hasChanges =
      currentRecord.brandName !== newBrand.brandName ||
      currentRecord.industry !== newBrand.industry ||
      currentRecord.companySize !== newBrand.companySize;

    if (!hasChanges) {
      return existingRecords; // No changes, return as-is
    }

    // Expire current record
    currentRecord.expirationDate = now;
    currentRecord.isCurrent = false;
  }

  // Get next surrogate key
  const maxKey = existingRecords.reduce((max, r) => Math.max(max, r.brandKey), 0);

  // Insert new record
  const newRecord: DimBrand = {
    ...newBrand,
    brandKey: maxKey + 1,
    effectiveDate: now,
    expirationDate: null,
    isCurrent: true,
    version: (currentRecord?.version || 0) + 1,
  };

  return [...existingRecords, newRecord];
}

/**
 * Get brand dimension at point in time
 */
export function getBrandAtPointInTime(
  records: DimBrand[],
  brandId: string,
  asOfDate: Date
): DimBrand | undefined {
  return records.find(
    r => r.brandId === brandId &&
         r.effectiveDate <= asOfDate &&
         (r.expirationDate === null || r.expirationDate > asOfDate)
  );
}

// ============================================================================
// AGGREGATION FUNCTIONS
// ============================================================================

/**
 * Compute daily brand summary from fact table
 */
export function computeDailyBrandSummary(
  facts: FactBrandPerception[],
  brands: DimBrand[],
  date: Date
): AggDailyBrandSummary[] {
  const dateKey = parseInt(
    `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  );

  // Group facts by brand
  const brandFacts = new Map<number, FactBrandPerception[]>();
  for (const fact of facts) {
    if (!brandFacts.has(fact.brandKey)) {
      brandFacts.set(fact.brandKey, []);
    }
    brandFacts.get(fact.brandKey)!.push(fact);
  }

  const summaries: AggDailyBrandSummary[] = [];

  for (const [brandKey, facts] of brandFacts) {
    if (facts.length === 0) continue;

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    summaries.push({
      brandKey,
      dateKey,
      avgVisibilityScore: avg(facts.map(f => f.visibilityScore)),
      avgSentimentScore: avg(facts.map(f => f.sentimentScore)),
      avgAccuracyScore: avg(facts.map(f => f.accuracyScore)),
      avgRecommendationScore: avg(facts.map(f => f.recommendationScore)),
      avgOverallScore: avg(facts.map(f => f.overallScore)),
      visibilityScoreDelta: 0, // Would compare to previous day
      sentimentScoreDelta: 0,
      overallScoreDelta: 0,
      totalMentions: facts.reduce((sum, f) => sum + f.mentionCount, 0),
      totalQueries: facts.length,
      uniqueProviders: new Set(facts.map(f => f.providerKey)).size,
    });
  }

  return summaries;
}

/**
 * Compute weekly provider performance
 */
export function computeWeeklyProviderPerformance(
  usageFacts: FactAPIUsage[],
  weekStart: Date
): AggWeeklyProviderPerformance[] {
  const weekKey = parseInt(
    `${weekStart.getFullYear()}${String(getWeekNumber(weekStart)).padStart(2, '0')}`
  );

  // Group by provider
  const providerUsage = new Map<number, FactAPIUsage[]>();
  for (const fact of usageFacts) {
    if (!providerUsage.has(fact.providerKey)) {
      providerUsage.set(fact.providerKey, []);
    }
    providerUsage.get(fact.providerKey)!.push(fact);
  }

  const performances: AggWeeklyProviderPerformance[] = [];

  for (const [providerKey, usage] of providerUsage) {
    const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0);
    const successfulRequests = usage.reduce((sum, u) => sum + u.successCount, 0);
    const failedRequests = usage.reduce((sum, u) => sum + u.errorCount, 0);

    const latencies = usage.map(u => u.latencyMs).sort((a, b) => a - b);
    const p50Index = Math.floor(latencies.length * 0.5);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);

    const totalCost = usage.reduce((sum, u) => sum + u.costUSD, 0);

    performances.push({
      providerKey,
      weekKey,
      totalRequests,
      successfulRequests,
      failedRequests,
      successRate: totalRequests > 0 ? successfulRequests / totalRequests : 1,
      avgLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50LatencyMs: latencies[p50Index] || 0,
      p95LatencyMs: latencies[p95Index] || 0,
      p99LatencyMs: latencies[p99Index] || 0,
      totalCostUSD: totalCost,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgQualityScore: 0, // Would need quality data
      consistencyScore: 0,
    });
  }

  return performances;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Dimension generators
  generateTimeDimension,
  generateProviderDimension,

  // SCD operations
  insertBrandDimension,
  getBrandAtPointInTime,

  // Aggregations
  computeDailyBrandSummary,
  computeWeeklyProviderPerformance,
};
