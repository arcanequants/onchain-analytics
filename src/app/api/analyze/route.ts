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
import {
  AnalyzeOptionsSchema,
  setAnalysisSync as setAnalysis,
  type AnalysisRecord,
} from '@/lib/analysis/store';

// ================================================================
// TYPES & VALIDATION
// ================================================================

const AnalyzeRequestSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
  options: AnalyzeOptionsSchema.optional(),
});

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
    setAnalysis(analysisId, analysisRecord);

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

import { createPreflightResponse } from '@/lib/security/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createPreflightResponse(origin);
}
