/**
 * Analysis API Route
 *
 * Phase 1, Week 1, Day 6
 * POST /api/analyze - Start a new AI perception analysis
 *
 * RED TEAM AUDIT FIX: CRITICAL-001
 * Now requires authentication (JWT or API key)
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
import { withAuth, type AuthenticatedRequest } from '@/lib/middleware/auth';

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

async function handlePost(request: AuthenticatedRequest) {
  try {
    // User/API key is available from auth middleware
    const userId = request.user?.id || request.apiKey?.owner_id;

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

    // Store analysis (with user association)
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

// Apply authentication middleware
// Allows both JWT (users) and API keys (programmatic access)
export const POST = withAuth(handlePost, {
  allowApiKey: true,
  scopes: ['analyze:write', 'write'],
  auditLog: true,
});

// ================================================================
// OPTIONS (CORS preflight)
// ================================================================

import { createPreflightResponse } from '@/lib/security/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createPreflightResponse(origin);
}
