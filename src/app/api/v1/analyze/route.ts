/**
 * Analysis API Route - v1
 *
 * Phase 2, Week 3, Day 5
 * POST /api/v1/analyze - Start a new AI perception analysis (versioned)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { validateUrl, type URLValidationResult } from '@/lib/security/url-validator';
import {
  withVersioning,
  versionedResponse,
  versionedError,
  type APIVersion,
} from '@/lib/api/versioning';

// ================================================================
// TYPES & VALIDATION
// ================================================================

const AnalyzeOptionsSchema = z.object({
  providers: z.array(z.enum(['openai', 'anthropic', 'google', 'perplexity'])).default(['openai', 'anthropic']),
  queryBudget: z.number().int().min(5).max(50).default(20),
  includeCompetitors: z.boolean().default(true),
  includeKnowledgeGraph: z.boolean().default(false),
  webhookUrl: z.string().url().optional(),
});

const AnalyzeRequestSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  brandName: z.string().min(1).max(100).optional(),
  industry: z.string().optional(),
  options: AnalyzeOptionsSchema.optional(),
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

// ================================================================
// IN-MEMORY ANALYSIS STORE (for MVP - replace with DB later)
// ================================================================

interface AnalysisRecord {
  id: string;
  url: string;
  brandName?: string;
  industry?: string;
  options: AnalyzeOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  resultId?: string;
  error?: string;
}

// Simple in-memory store - will be replaced with Supabase
const analysisStore = new Map<string, AnalysisRecord>();

// Internal helpers (not exported - Next.js 15 doesn't allow non-route exports)
function getAnalysisV1(id: string): AnalysisRecord | undefined {
  return analysisStore.get(id);
}

function updateAnalysisV1(id: string, updates: Partial<AnalysisRecord>): void {
  const existing = analysisStore.get(id);
  if (existing) {
    analysisStore.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
}

// ================================================================
// V1 RESPONSE TYPES
// ================================================================

interface V1AnalyzeResponse {
  id: string;
  url: string;
  brandName?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  links: {
    self: string;
    progress: string;
    results: string;
    cancel: string;
  };
  createdAt: string;
  estimatedCompletionTime: string;
}

// ================================================================
// ROUTE HANDLER
// ================================================================

async function handleAnalyze(
  request: NextRequest,
  version: APIVersion
): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Validate request
    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();
      return versionedError(
        'Invalid request',
        'VALIDATION_ERROR',
        version,
        400,
        { fieldErrors: errors.fieldErrors }
      );
    }

    const { url, brandName, industry, options } = parseResult.data;

    // Validate URL for SSRF protection
    const urlValidation: URLValidationResult = validateUrl(url);
    if (!urlValidation.isValid) {
      return versionedError(
        urlValidation.error || 'Invalid URL',
        'INVALID_URL',
        version,
        400
      );
    }

    // Generate unique analysis ID
    const analysisId = `ana_${nanoid(12)}`;

    // Parse options with defaults
    const parsedOptions = AnalyzeOptionsSchema.parse(options ?? {});

    // Create analysis record
    const now = new Date().toISOString();
    const analysisRecord: AnalysisRecord = {
      id: analysisId,
      url: urlValidation.normalizedUrl || url,
      brandName,
      industry,
      options: parsedOptions,
      status: 'pending',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    // Store analysis (in-memory for now)
    analysisStore.set(analysisId, analysisRecord);

    // Build V1 response
    const baseUrl = new URL(request.url).origin;
    const responseData: V1AnalyzeResponse = {
      id: analysisId,
      url: analysisRecord.url,
      brandName: analysisRecord.brandName,
      status: 'pending',
      progress: 0,
      links: {
        self: `${baseUrl}/api/v1/analyze/${analysisId}`,
        progress: `${baseUrl}/api/v1/analyze/${analysisId}/progress`,
        results: `${baseUrl}/api/v1/analyze/${analysisId}/results`,
        cancel: `${baseUrl}/api/v1/analyze/${analysisId}/cancel`,
      },
      createdAt: now,
      estimatedCompletionTime: new Date(Date.now() + 60000).toISOString(), // ~1 minute
    };

    return versionedResponse(responseData, version, 202);
  } catch (error) {
    console.error('Analysis API error:', error);

    return versionedError(
      'Internal server error',
      'INTERNAL_ERROR',
      version,
      500
    );
  }
}

// ================================================================
// EXPORTS
// ================================================================

export const POST = withVersioning(handleAnalyze);

// OPTIONS (CORS preflight)
import { createPreflightResponse } from '@/lib/security/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createPreflightResponse(origin);
}
