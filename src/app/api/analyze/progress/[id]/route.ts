/**
 * Analysis Progress SSE Endpoint
 *
 * Phase 1, Week 1, Day 6
 * GET /api/analyze/progress/[id] - Stream analysis progress via SSE
 */

import { NextRequest } from 'next/server';
import {
  createSSEStream,
  createSSEResponse,
  type AnalysisStage,
} from '@/lib/sse';
import { getAnalysis, updateAnalysis } from '@/lib/analysis/store';

// ================================================================
// TYPES
// ================================================================

interface RouteParams {
  params: Promise<{ id: string }>;
}

// ================================================================
// SIMULATED ANALYSIS (for MVP - will be replaced with real implementation)
// ================================================================

async function simulateAnalysis(
  analysisId: string,
  tracker: ReturnType<typeof createSSEStream>['tracker']
): Promise<void> {
  const stages: { stage: AnalysisStage; delay: number }[] = [
    { stage: 'fetching_url', delay: 800 },
    { stage: 'extracting_metadata', delay: 600 },
    { stage: 'detecting_industry', delay: 400 },
    { stage: 'generating_queries', delay: 300 },
    { stage: 'querying_openai', delay: 2000 },
    { stage: 'querying_anthropic', delay: 2000 },
    { stage: 'aggregating_results', delay: 400 },
    { stage: 'calculating_scores', delay: 300 },
    { stage: 'generating_recommendations', delay: 500 },
    { stage: 'finalizing', delay: 300 },
  ];

  for (const { stage, delay } of stages) {
    if (tracker.isAborted()) {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, delay));

    if (tracker.isAborted()) {
      return;
    }

    tracker.advanceTo(stage, { analysisId });
  }

  // Complete the analysis
  if (!tracker.isAborted()) {
    // Generate a result ID (in real implementation, this would be from DB)
    const resultId = `res_${analysisId.replace('ana_', '')}`;
    const redirectUrl = `/results/${resultId}`;

    // Update analysis record
    updateAnalysis(analysisId, {
      status: 'completed',
      resultId,
    });

    tracker.complete(resultId, redirectUrl);
  }
}

// ================================================================
// ROUTE HANDLER
// ================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  // Await params (Next.js 15 requirement)
  const { id: analysisId } = await params;

  // Validate analysis exists
  const analysis = getAnalysis(analysisId);
  if (!analysis) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Analysis not found',
        code: 'NOT_FOUND',
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if already completed
  if (analysis.status === 'completed' && analysis.resultId) {
    return new Response(
      JSON.stringify({
        success: true,
        status: 'completed',
        resultId: analysis.resultId,
        redirectUrl: `/results/${analysis.resultId}`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Check if failed
  if (analysis.status === 'failed') {
    return new Response(
      JSON.stringify({
        success: false,
        status: 'failed',
        error: analysis.error || 'Analysis failed',
        code: 'ANALYSIS_FAILED',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Create SSE stream
  const abortController = new AbortController();
  const { stream, tracker } = createSSEStream(analysisId, abortController.signal);

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    abortController.abort();
  });

  // Update analysis status
  updateAnalysis(analysisId, { status: 'processing' });

  // Start analysis in background
  simulateAnalysis(analysisId, tracker).catch((error) => {
    console.error('Analysis error:', error);
    updateAnalysis(analysisId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    tracker.reportError(
      error instanceof Error ? error.message : 'Analysis failed',
      'ANALYSIS_ERROR',
      false
    );
  });

  // Return SSE response
  return createSSEResponse(stream);
}

// ================================================================
// OPTIONS (CORS preflight)
// ================================================================

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
