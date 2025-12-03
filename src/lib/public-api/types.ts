/**
 * Public API Types
 *
 * Type definitions for the public API endpoints
 *
 * Phase 2, Week 8, Day 1
 */

import { z } from 'zod';

// ================================================================
// PAGINATION
// ================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ================================================================
// SCORES API
// ================================================================

export const ScoreQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  brandId: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  maxScore: z.coerce.number().min(0).max(100).optional(),
  grade: z.enum(['excellent', 'good', 'average', 'poor', 'critical']).optional(),
  since: z.string().datetime().optional(),
});

export type ScoreQueryParams = z.infer<typeof ScoreQuerySchema>;

export const CreateScoreSchema = z.object({
  brandName: z.string().min(1).max(200),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  competitors: z.array(z.string()).max(10).optional(),
});

export type CreateScoreInput = z.infer<typeof CreateScoreSchema>;

export interface PublicScoreResponse {
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
  createdAt: string;
  updatedAt: string;
}

export interface ScoreHistoryResponse {
  id: string;
  brandId: string;
  score: number;
  grade: string;
  createdAt: string;
  changeFromPrevious: number | null;
}

// ================================================================
// BRANDS API
// ================================================================

export const BrandQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  industry: z.string().optional(),
  hasScore: z.coerce.boolean().optional(),
});

export type BrandQueryParams = z.infer<typeof BrandQuerySchema>;

export const CreateBrandSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  logo: z.string().url().optional(),
  competitors: z.array(z.string()).max(10).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateBrandInput = z.infer<typeof CreateBrandSchema>;

export const UpdateBrandSchema = CreateBrandSchema.partial();

export type UpdateBrandInput = z.infer<typeof UpdateBrandSchema>;

export interface PublicBrandResponse {
  id: string;
  name: string;
  description: string | null;
  website: string | null;
  industry: string | null;
  logo: string | null;
  latestScore: number | null;
  latestGrade: string | null;
  scoreCount: number;
  createdAt: string;
  updatedAt: string;
}

// ================================================================
// LEADERBOARDS API
// ================================================================

export const LeaderboardQuerySchema = z.object({
  industry: z.string().optional(),
  timeframe: z.enum(['7d', '30d', '90d', 'all']).default('30d'),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type LeaderboardQueryParams = z.infer<typeof LeaderboardQuerySchema>;

export interface LeaderboardEntryResponse {
  rank: number;
  brandId: string;
  brandName: string;
  industry: string | null;
  score: number;
  grade: string;
  changeFromPrevious: number | null;
  previousRank: number | null;
}

export interface LeaderboardResponse {
  industry: string | null;
  timeframe: string;
  entries: LeaderboardEntryResponse[];
  updatedAt: string;
}

// ================================================================
// WEBHOOKS API
// ================================================================

export const WebhookQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z.coerce.boolean().optional(),
});

export type WebhookQueryParams = z.infer<typeof WebhookQuerySchema>;

export const CreateWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'score.created',
    'score.updated',
    'brand.created',
    'brand.updated',
    'brand.deleted',
    'alert.triggered',
    'report.generated',
    'webhook.test',
  ])).min(1),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWebhookInput = z.infer<typeof CreateWebhookSchema>;

export const UpdateWebhookSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum([
    'score.created',
    'score.updated',
    'brand.created',
    'brand.updated',
    'brand.deleted',
    'alert.triggered',
    'report.generated',
    'webhook.test',
  ])).min(1).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateWebhookInput = z.infer<typeof UpdateWebhookSchema>;

export interface PublicWebhookResponse {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  description: string | null;
  lastTriggeredAt: string | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryResponse {
  id: string;
  webhookId: string;
  eventType: string;
  status: 'success' | 'failed' | 'retrying' | 'sending';
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
  attemptCount: number;
  createdAt: string;
  completedAt: string | null;
}

// ================================================================
// API KEYS API
// ================================================================

export const ApiKeyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
  isActive: z.coerce.boolean().optional(),
});

export type ApiKeyQueryParams = z.infer<typeof ApiKeyQuerySchema>;

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.enum([
    'read:scores',
    'write:scores',
    'read:brands',
    'write:brands',
    'read:leaderboards',
    'read:webhooks',
    'write:webhooks',
    'read:reports',
    'write:reports',
    'admin',
  ])).min(1).optional(),
  expiresInDays: z.number().int().positive().max(365).optional(),
  rateLimit: z.number().int().positive().max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;

export const UpdateApiKeySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissions: z.array(z.enum([
    'read:scores',
    'write:scores',
    'read:brands',
    'write:brands',
    'read:leaderboards',
    'read:webhooks',
    'write:webhooks',
    'read:reports',
    'write:reports',
    'admin',
  ])).min(1).optional(),
  isActive: z.boolean().optional(),
  rateLimit: z.number().int().positive().max(10000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateApiKeyInput = z.infer<typeof UpdateApiKeySchema>;

export interface PublicApiKeyResponse {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCreatedResponse extends PublicApiKeyResponse {
  /** The full API key - only returned once at creation */
  key: string;
}

// ================================================================
// ANALYSIS API
// ================================================================

export const AnalyzeSchema = z.object({
  brandName: z.string().min(1).max(200),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  competitors: z.array(z.string()).max(10).optional(),
  providers: z.array(z.enum(['openai', 'anthropic', 'google', 'perplexity', 'gemini'])).optional(),
  queryTypes: z.array(z.enum([
    'recommendation',
    'comparison',
    'evaluation',
    'alternatives',
    'use_case',
    'feature',
    'review',
    'general',
  ])).optional(),
  depth: z.enum(['quick', 'standard', 'comprehensive']).default('standard'),
});

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;

export interface AnalysisStatusResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep: string | null;
  brandName: string;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

export interface AnalysisResultResponse {
  id: string;
  brandId: string;
  brandName: string;
  score: PublicScoreResponse;
  insights: {
    key: string[];
    improvements: string[];
  };
  providers: {
    name: string;
    score: number;
    mentionRate: number;
  }[];
  completedAt: string;
}

// ================================================================
// ERROR RESPONSES
// ================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  meta: {
    requestId: string;
    timestamp: string;
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  PaginationSchema,
  ScoreQuerySchema,
  CreateScoreSchema,
  BrandQuerySchema,
  CreateBrandSchema,
  UpdateBrandSchema,
  LeaderboardQuerySchema,
  WebhookQuerySchema,
  CreateWebhookSchema,
  UpdateWebhookSchema,
  ApiKeyQuerySchema,
  CreateApiKeySchema,
  UpdateApiKeySchema,
  AnalyzeSchema,
};
