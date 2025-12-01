/**
 * Analysis API Route
 *
 * Phase 1, Week 1, Day 6
 * POST /api/analyze - Start a new AI perception analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { validateUrl, type URLValidationResult } from '@/lib/security/url-validator';

// ================================================================
// TYPES & VALIDATION
// ================================================================

const AnalyzeOptionsSchema = z.object({
  providers: z.array(z.enum(['openai', 'anthropic'])).default(['openai', 'anthropic']),
  queryBudget: z.number().int().min(5).max(50).default(20),
  includeCompetitors: z.boolean().default(true),
});

const AnalyzeRequestSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  options: AnalyzeOptionsSchema.optional(),
});

type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

interface AnalyzeResponse {
  success: boolean;
  analysisId: string;
  progressUrl: string;
  message: string;
}

interface AnalyzeErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// ================================================================
// IN-MEMORY ANALYSIS STORE (for MVP - replace with DB later)
// ================================================================

type AnalyzeOptions = z.infer<typeof AnalyzeOptionsSchema>;

interface AnalysisRecord {
  id: string;
  url: string;
  options: AnalyzeOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
  resultId?: string;
  error?: string;
}

// Simple in-memory store - will be replaced with Supabase
const analysisStore = new Map<string, AnalysisRecord>();

// Export for use by progress endpoint
export function getAnalysis(id: string): AnalysisRecord | undefined {
  return analysisStore.get(id);
}

export function updateAnalysis(id: string, updates: Partial<AnalysisRecord>): void {
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
// ROUTE HANDLER
// ================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Validate request
    const parseResult = AnalyzeRequestSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();
      return NextResponse.json<AnalyzeErrorResponse>(
        {
          success: false,
          error: 'Invalid request',
          code: 'VALIDATION_ERROR',
          details: { fieldErrors: errors.fieldErrors },
        },
        { status: 400 }
      );
    }

    const { url, options } = parseResult.data;

    // Validate URL for SSRF protection
    const urlValidation: URLValidationResult = validateUrl(url);
    if (!urlValidation.isValid) {
      return NextResponse.json<AnalyzeErrorResponse>(
        {
          success: false,
          error: urlValidation.error || 'Invalid URL',
          code: 'INVALID_URL',
        },
        { status: 400 }
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
      options: parsedOptions,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    // Store analysis (in-memory for now)
    analysisStore.set(analysisId, analysisRecord);

    // Return success with progress URL
    const progressUrl = `/api/analyze/progress/${analysisId}`;

    return NextResponse.json<AnalyzeResponse>(
      {
        success: true,
        analysisId,
        progressUrl,
        message: 'Analysis started. Connect to progressUrl for real-time updates.',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Analysis API error:', error);

    return NextResponse.json<AnalyzeErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

// ================================================================
// OPTIONS (CORS preflight)
// ================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
