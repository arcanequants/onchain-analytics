/**
 * Public API Controllers
 *
 * Business logic controllers for public API endpoints
 *
 * Phase 2, Week 8, Day 1
 */

import {
  type PaginatedResponse,
  type PublicScoreResponse,
  type ScoreHistoryResponse,
  type PublicBrandResponse,
  type LeaderboardResponse,
  type LeaderboardEntryResponse,
  type PublicWebhookResponse,
  type WebhookDeliveryResponse,
  type PublicApiKeyResponse,
  type ApiKeyCreatedResponse,
  type AnalysisStatusResponse,
  type AnalysisResultResponse,
  type ScoreQueryParams,
  type CreateScoreInput,
  type BrandQueryParams,
  type CreateBrandInput,
  type UpdateBrandInput,
  type LeaderboardQueryParams,
  type WebhookQueryParams,
  type CreateWebhookInput,
  type UpdateWebhookInput,
  type ApiKeyQueryParams,
  type CreateApiKeyInput,
  type UpdateApiKeyInput,
  type AnalyzeInput,
} from './types';

// ================================================================
// MOCK DATA STORES
// ================================================================

interface MockScore {
  id: string;
  brandId: string;
  brandName: string;
  overallScore: number;
  grade: string;
  categories: {
    visibility: number;
    sentiment: number;
    authority: number;
    relevance: number;
    competitive: number;
    coverage: number;
  };
  industry: string;
  benchmark: {
    averageScore: number;
    percentileRank: number;
    positionLabel: string;
  } | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockBrand {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  logo: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface MockAnalysis {
  id: string;
  brandId: string;
  brandName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string | null;
  userId: string;
  startedAt: Date;
  completedAt: Date | null;
  error: string | null;
  result: AnalysisResultResponse | null;
}

const mockScores: Map<string, MockScore> = new Map();
const mockBrands: Map<string, MockBrand> = new Map();
const mockAnalyses: Map<string, MockAnalysis> = new Map();

// Initialize some test data
function initMockData() {
  const industries = ['saas', 'fintech', 'ecommerce', 'healthtech', 'marketing'];
  const grades = ['excellent', 'good', 'average', 'poor', 'critical'];

  for (let i = 1; i <= 50; i++) {
    const brandId = `brand_${i}`;
    const industry = industries[i % industries.length];
    const score = Math.floor(Math.random() * 60) + 20;
    const gradeIndex = Math.floor((100 - score) / 20);

    const brand: MockBrand = {
      id: brandId,
      name: `Brand ${i}`,
      description: `Description for Brand ${i}`,
      website: `https://brand${i}.example.com`,
      industry,
      logo: null,
      userId: 'user-1',
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    };
    mockBrands.set(brandId, brand);

    const scoreId = `score_${i}`;
    const mockScore: MockScore = {
      id: scoreId,
      brandId,
      brandName: brand.name,
      overallScore: score,
      grade: grades[gradeIndex] || 'average',
      categories: {
        visibility: score + Math.floor(Math.random() * 10) - 5,
        sentiment: score + Math.floor(Math.random() * 10) - 5,
        authority: score + Math.floor(Math.random() * 10) - 5,
        relevance: score + Math.floor(Math.random() * 10) - 5,
        competitive: score + Math.floor(Math.random() * 10) - 5,
        coverage: score + Math.floor(Math.random() * 10) - 5,
      },
      industry,
      benchmark: {
        averageScore: 50,
        percentileRank: Math.floor((score / 100) * 100),
        positionLabel: score >= 60 ? 'Above Average' : 'Below Average',
      },
      userId: 'user-1',
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(),
    };
    mockScores.set(scoreId, mockScore);
  }
}

initMockData();

// ================================================================
// SCORES CONTROLLER
// ================================================================

export const ScoresController = {
  /**
   * List scores with filtering and pagination
   */
  async list(
    userId: string,
    params: ScoreQueryParams
  ): Promise<PaginatedResponse<PublicScoreResponse>> {
    let scores = Array.from(mockScores.values()).filter(s => s.userId === userId);

    // Apply filters
    if (params.brandId) {
      scores = scores.filter(s => s.brandId === params.brandId);
    }
    if (params.minScore !== undefined) {
      scores = scores.filter(s => s.overallScore >= params.minScore!);
    }
    if (params.maxScore !== undefined) {
      scores = scores.filter(s => s.overallScore <= params.maxScore!);
    }
    if (params.grade) {
      scores = scores.filter(s => s.grade === params.grade);
    }
    if (params.since) {
      const sinceDate = new Date(params.since);
      scores = scores.filter(s => s.createdAt >= sinceDate);
    }

    // Sort by creation date (newest first)
    scores.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Pagination
    const totalItems = scores.length;
    const totalPages = Math.ceil(totalItems / params.limit);
    const start = (params.page - 1) * params.limit;
    const paginatedScores = scores.slice(start, start + params.limit);

    return {
      items: paginatedScores.map(formatScore),
      pagination: {
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages,
        hasMore: params.page < totalPages,
      },
    };
  },

  /**
   * Get a single score by ID
   */
  async get(userId: string, scoreId: string): Promise<PublicScoreResponse | null> {
    const score = mockScores.get(scoreId);
    if (!score || score.userId !== userId) return null;
    return formatScore(score);
  },

  /**
   * Get score history for a brand
   */
  async getHistory(
    userId: string,
    brandId: string,
    limit: number = 10
  ): Promise<ScoreHistoryResponse[]> {
    const scores = Array.from(mockScores.values())
      .filter(s => s.userId === userId && s.brandId === brandId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);

    return scores.map((score, index) => {
      const previousScore = scores[index + 1];
      return {
        id: score.id,
        brandId: score.brandId,
        score: score.overallScore,
        grade: score.grade,
        createdAt: score.createdAt.toISOString(),
        changeFromPrevious: previousScore
          ? score.overallScore - previousScore.overallScore
          : null,
      };
    });
  },

  /**
   * Create a new score (trigger analysis)
   */
  async create(userId: string, input: CreateScoreInput): Promise<AnalysisStatusResponse> {
    const analysisId = `analysis_${Date.now().toString(36)}`;

    const analysis: MockAnalysis = {
      id: analysisId,
      brandId: '',
      brandName: input.brandName,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing',
      userId,
      startedAt: new Date(),
      completedAt: null,
      error: null,
      result: null,
    };

    mockAnalyses.set(analysisId, analysis);

    // Simulate async processing
    simulateAnalysis(analysisId);

    return {
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      currentStep: analysis.currentStep,
      brandName: analysis.brandName,
      startedAt: analysis.startedAt.toISOString(),
      completedAt: null,
      error: null,
    };
  },
};

// ================================================================
// BRANDS CONTROLLER
// ================================================================

export const BrandsController = {
  /**
   * List brands with filtering and pagination
   */
  async list(
    userId: string,
    params: BrandQueryParams
  ): Promise<PaginatedResponse<PublicBrandResponse>> {
    let brands = Array.from(mockBrands.values()).filter(b => b.userId === userId);

    // Apply filters
    if (params.search) {
      const search = params.search.toLowerCase();
      brands = brands.filter(b =>
        b.name.toLowerCase().includes(search) ||
        b.description?.toLowerCase().includes(search)
      );
    }
    if (params.industry) {
      brands = brands.filter(b => b.industry === params.industry);
    }

    // Sort by creation date
    brands.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Add score data and filter if needed
    let brandsWithScores = brands.map(brand => {
      const scores = Array.from(mockScores.values())
        .filter(s => s.brandId === brand.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const latestScore = scores[0];
      return {
        brand,
        latestScore: latestScore?.overallScore || null,
        latestGrade: latestScore?.grade || null,
        scoreCount: scores.length,
      };
    });

    if (params.hasScore !== undefined) {
      brandsWithScores = brandsWithScores.filter(b =>
        params.hasScore ? b.scoreCount > 0 : b.scoreCount === 0
      );
    }

    // Pagination
    const totalItems = brandsWithScores.length;
    const totalPages = Math.ceil(totalItems / params.limit);
    const start = (params.page - 1) * params.limit;
    const paginatedBrands = brandsWithScores.slice(start, start + params.limit);

    return {
      items: paginatedBrands.map(({ brand, latestScore, latestGrade, scoreCount }) => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        website: brand.website,
        industry: brand.industry,
        logo: brand.logo,
        latestScore,
        latestGrade,
        scoreCount,
        createdAt: brand.createdAt.toISOString(),
        updatedAt: brand.updatedAt.toISOString(),
      })),
      pagination: {
        page: params.page,
        limit: params.limit,
        totalItems,
        totalPages,
        hasMore: params.page < totalPages,
      },
    };
  },

  /**
   * Get a single brand by ID
   */
  async get(userId: string, brandId: string): Promise<PublicBrandResponse | null> {
    const brand = mockBrands.get(brandId);
    if (!brand || brand.userId !== userId) return null;

    const scores = Array.from(mockScores.values())
      .filter(s => s.brandId === brandId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const latestScore = scores[0];

    return {
      id: brand.id,
      name: brand.name,
      description: brand.description,
      website: brand.website,
      industry: brand.industry,
      logo: brand.logo,
      latestScore: latestScore?.overallScore || null,
      latestGrade: latestScore?.grade || null,
      scoreCount: scores.length,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    };
  },

  /**
   * Create a new brand
   */
  async create(userId: string, input: CreateBrandInput): Promise<PublicBrandResponse> {
    const brandId = `brand_${Date.now().toString(36)}`;

    const brand: MockBrand = {
      id: brandId,
      name: input.name,
      description: input.description || null,
      website: input.website || null,
      industry: input.industry || null,
      logo: input.logo || null,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockBrands.set(brandId, brand);

    return {
      id: brand.id,
      name: brand.name,
      description: brand.description,
      website: brand.website,
      industry: brand.industry,
      logo: brand.logo,
      latestScore: null,
      latestGrade: null,
      scoreCount: 0,
      createdAt: brand.createdAt.toISOString(),
      updatedAt: brand.updatedAt.toISOString(),
    };
  },

  /**
   * Update a brand
   */
  async update(
    userId: string,
    brandId: string,
    input: UpdateBrandInput
  ): Promise<PublicBrandResponse | null> {
    const brand = mockBrands.get(brandId);
    if (!brand || brand.userId !== userId) return null;

    Object.assign(brand, {
      ...input,
      updatedAt: new Date(),
    });

    mockBrands.set(brandId, brand);

    return this.get(userId, brandId);
  },

  /**
   * Delete a brand
   */
  async delete(userId: string, brandId: string): Promise<boolean> {
    const brand = mockBrands.get(brandId);
    if (!brand || brand.userId !== userId) return false;

    mockBrands.delete(brandId);

    // Also delete associated scores
    for (const [scoreId, score] of mockScores.entries()) {
      if (score.brandId === brandId) {
        mockScores.delete(scoreId);
      }
    }

    return true;
  },
};

// ================================================================
// LEADERBOARDS CONTROLLER
// ================================================================

export const LeaderboardsController = {
  /**
   * Get leaderboard
   */
  async get(params: LeaderboardQueryParams): Promise<LeaderboardResponse> {
    let scores = Array.from(mockScores.values());

    // Filter by industry if specified
    if (params.industry) {
      scores = scores.filter(s => s.industry === params.industry);
    }

    // Filter by timeframe
    const now = new Date();
    let sinceDate: Date;
    switch (params.timeframe) {
      case '7d':
        sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        sinceDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        sinceDate = new Date(0);
    }

    scores = scores.filter(s => s.createdAt >= sinceDate);

    // Get latest score per brand
    const latestByBrand = new Map<string, MockScore>();
    for (const score of scores) {
      const existing = latestByBrand.get(score.brandId);
      if (!existing || score.createdAt > existing.createdAt) {
        latestByBrand.set(score.brandId, score);
      }
    }

    // Sort by score and limit
    const sortedScores = Array.from(latestByBrand.values())
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, params.limit);

    const entries: LeaderboardEntryResponse[] = sortedScores.map((score, index) => ({
      rank: index + 1,
      brandId: score.brandId,
      brandName: score.brandName,
      industry: score.industry,
      score: score.overallScore,
      grade: score.grade,
      changeFromPrevious: null, // Would need historical data
      previousRank: null,
    }));

    return {
      industry: params.industry || null,
      timeframe: params.timeframe,
      entries,
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * Get available industries
   */
  async getIndustries(): Promise<string[]> {
    const industries = new Set<string>();
    for (const score of mockScores.values()) {
      if (score.industry) {
        industries.add(score.industry);
      }
    }
    return Array.from(industries).sort();
  },
};

// ================================================================
// ANALYSIS CONTROLLER
// ================================================================

export const AnalysisController = {
  /**
   * Start a new analysis
   */
  async start(userId: string, input: AnalyzeInput): Promise<AnalysisStatusResponse> {
    const analysisId = `analysis_${Date.now().toString(36)}`;

    // Check if brand exists
    let brandId = '';
    for (const brand of mockBrands.values()) {
      if (brand.name.toLowerCase() === input.brandName.toLowerCase() && brand.userId === userId) {
        brandId = brand.id;
        break;
      }
    }

    // Create brand if it doesn't exist
    if (!brandId) {
      brandId = `brand_${Date.now().toString(36)}`;
      mockBrands.set(brandId, {
        id: brandId,
        name: input.brandName,
        description: null,
        website: input.website || null,
        industry: input.industry || null,
        logo: null,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const analysis: MockAnalysis = {
      id: analysisId,
      brandId,
      brandName: input.brandName,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing',
      userId,
      startedAt: new Date(),
      completedAt: null,
      error: null,
      result: null,
    };

    mockAnalyses.set(analysisId, analysis);

    // Simulate async processing
    simulateAnalysis(analysisId);

    return {
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      currentStep: analysis.currentStep,
      brandName: analysis.brandName,
      startedAt: analysis.startedAt.toISOString(),
      completedAt: null,
      error: null,
    };
  },

  /**
   * Get analysis status
   */
  async getStatus(userId: string, analysisId: string): Promise<AnalysisStatusResponse | null> {
    const analysis = mockAnalyses.get(analysisId);
    if (!analysis || analysis.userId !== userId) return null;

    return {
      id: analysis.id,
      status: analysis.status,
      progress: analysis.progress,
      currentStep: analysis.currentStep,
      brandName: analysis.brandName,
      startedAt: analysis.startedAt.toISOString(),
      completedAt: analysis.completedAt?.toISOString() || null,
      error: analysis.error,
    };
  },

  /**
   * Get analysis result
   */
  async getResult(userId: string, analysisId: string): Promise<AnalysisResultResponse | null> {
    const analysis = mockAnalyses.get(analysisId);
    if (!analysis || analysis.userId !== userId) return null;
    if (analysis.status !== 'completed') return null;

    return analysis.result;
  },
};

// ================================================================
// HELPERS
// ================================================================

function formatScore(score: MockScore): PublicScoreResponse {
  return {
    id: score.id,
    brandId: score.brandId,
    brandName: score.brandName,
    overallScore: score.overallScore,
    grade: score.grade,
    categories: score.categories,
    industry: score.industry,
    benchmark: score.benchmark,
    createdAt: score.createdAt.toISOString(),
    updatedAt: score.updatedAt.toISOString(),
  };
}

function simulateAnalysis(analysisId: string): void {
  const analysis = mockAnalyses.get(analysisId);
  if (!analysis) return;

  const steps = [
    { step: 'Querying AI providers', progress: 20 },
    { step: 'Analyzing responses', progress: 40 },
    { step: 'Calculating scores', progress: 60 },
    { step: 'Generating insights', progress: 80 },
    { step: 'Finalizing', progress: 95 },
  ];

  let stepIndex = 0;

  const interval = setInterval(() => {
    const analysis = mockAnalyses.get(analysisId);
    if (!analysis) {
      clearInterval(interval);
      return;
    }

    if (stepIndex < steps.length) {
      analysis.status = 'processing';
      analysis.currentStep = steps[stepIndex].step;
      analysis.progress = steps[stepIndex].progress;
      stepIndex++;
    } else {
      // Complete the analysis
      analysis.status = 'completed';
      analysis.progress = 100;
      analysis.currentStep = null;
      analysis.completedAt = new Date();

      // Generate result
      const score = Math.floor(Math.random() * 40) + 40;
      const gradeIndex = Math.floor((100 - score) / 20);
      const grades = ['excellent', 'good', 'average', 'poor', 'critical'];

      // Create score record
      const scoreId = `score_${Date.now().toString(36)}`;
      const mockScore: MockScore = {
        id: scoreId,
        brandId: analysis.brandId,
        brandName: analysis.brandName,
        overallScore: score,
        grade: grades[gradeIndex] || 'average',
        categories: {
          visibility: score + Math.floor(Math.random() * 10) - 5,
          sentiment: score + Math.floor(Math.random() * 10) - 5,
          authority: score + Math.floor(Math.random() * 10) - 5,
          relevance: score + Math.floor(Math.random() * 10) - 5,
          competitive: score + Math.floor(Math.random() * 10) - 5,
          coverage: score + Math.floor(Math.random() * 10) - 5,
        },
        industry: 'saas',
        benchmark: {
          averageScore: 50,
          percentileRank: Math.floor((score / 100) * 100),
          positionLabel: score >= 60 ? 'Above Average' : 'Below Average',
        },
        userId: analysis.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockScores.set(scoreId, mockScore);

      analysis.result = {
        id: analysisId,
        brandId: analysis.brandId,
        brandName: analysis.brandName,
        score: formatScore(mockScore),
        insights: {
          key: [
            'Good visibility in recommendation queries',
            'Positive sentiment when mentioned',
            'Room for improvement in competitive positioning',
          ],
          improvements: [
            'Create more comparison content',
            'Increase presence in review queries',
            'Target specific use case scenarios',
          ],
        },
        providers: [
          { name: 'OpenAI', score: score + 5, mentionRate: 0.65 },
          { name: 'Anthropic', score: score - 3, mentionRate: 0.55 },
          { name: 'Google', score: score + 2, mentionRate: 0.60 },
        ],
        completedAt: analysis.completedAt!.toISOString(),
      };

      clearInterval(interval);
    }

    mockAnalyses.set(analysisId, analysis);
  }, 500);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  ScoresController,
  BrandsController,
  LeaderboardsController,
  AnalysisController,
};
