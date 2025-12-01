/**
 * Explicit Feedback API Route
 *
 * Handles explicit user feedback submissions:
 * - Thumbs up/down
 * - Star ratings
 * - Text comments
 * - Score corrections/disputes
 *
 * POST /api/feedback - Submit feedback
 * GET /api/feedback - Get feedback for an analysis (requires auth)
 *
 * @module app/api/feedback
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

const FeedbackTypeEnum = z.enum([
  'thumbs_up',
  'thumbs_down',
  'rating',
  'text',
  'correction',
  'dispute',
]);

const FeedbackTargetEnum = z.enum([
  'analysis_score',
  'recommendation',
  'ai_response',
  'category_score',
  'overall_experience',
]);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const FeedbackSubmissionSchema = z.object({
  // Required fields
  feedbackType: FeedbackTypeEnum,
  target: FeedbackTargetEnum,

  // Context (at least one should be provided)
  analysisId: z.string().uuid().optional(),
  recommendationId: z.string().uuid().optional(),
  aiResponseId: z.string().uuid().optional(),

  // Feedback data (at least one must be present)
  rating: z.number().min(1).max(5).optional(),
  isPositive: z.boolean().optional(),
  comment: z.string().max(2000).optional(),

  // Correction data
  originalValue: z.record(z.string(), z.unknown()).optional(),
  suggestedValue: z.record(z.string(), z.unknown()).optional(),
  correctionReason: z.string().max(500).optional(),

  // Session context
  sessionId: z.string().optional(),
  pageUrl: z.string().url().optional(),

  // Additional context
  context: z.record(z.string(), z.unknown()).optional(),
}).refine(
  (data) => {
    // At least one feedback value must be present
    return (
      data.rating !== undefined ||
      data.isPositive !== undefined ||
      data.comment !== undefined ||
      data.suggestedValue !== undefined
    );
  },
  {
    message: 'At least one feedback value (rating, isPositive, comment, or suggestedValue) must be provided',
  }
).refine(
  (data) => {
    // At least one context ID should be provided
    return (
      data.analysisId !== undefined ||
      data.recommendationId !== undefined ||
      data.aiResponseId !== undefined
    );
  },
  {
    message: 'At least one context ID (analysisId, recommendationId, or aiResponseId) must be provided',
  }
);

const FeedbackQuerySchema = z.object({
  analysisId: z.string().uuid().optional().nullable(),
  limit: z.string().optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 10;
    return Math.min(Math.max(num, 1), 100);
  }),
  offset: z.string().optional().transform((val) => {
    const num = val ? parseInt(val, 10) : 0;
    return Math.max(num, 0);
  }),
});

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// RATE LIMITING
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST /api/feedback
 * Submit explicit feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate
    const validationResult = FeedbackSubmissionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const feedback = validationResult.data;

    // Get user ID from auth header if present
    let userId: string | null = null;
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id || null;
      } catch {
        // Continue without user ID - anonymous feedback is allowed
      }
    }

    // Insert feedback
    const supabase = getSupabaseClient();

    const insertData = {
      user_id: userId,
      analysis_id: feedback.analysisId || null,
      recommendation_id: feedback.recommendationId || null,
      ai_response_id: feedback.aiResponseId || null,
      feedback_type: feedback.feedbackType,
      target: feedback.target,
      rating: feedback.rating || null,
      is_positive: feedback.isPositive ?? null,
      comment: feedback.comment || null,
      original_value: feedback.originalValue || null,
      suggested_value: feedback.suggestedValue || null,
      correction_reason: feedback.correctionReason || null,
      session_id: feedback.sessionId || null,
      page_url: feedback.pageUrl || null,
      context: feedback.context || {},
      user_agent: request.headers.get('user-agent') || null,
    };

    const { data, error } = await supabase
      .from('user_feedback')
      .insert(insertData)
      .select('id, created_at')
      .single();

    if (error) {
      console.error('[Feedback API] Insert error:', error);

      // Handle specific errors
      if (error.code === '23503') {
        // Foreign key violation
        return NextResponse.json(
          { error: 'Invalid reference ID provided' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        feedbackId: data.id,
        createdAt: data.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Feedback API] Error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/feedback
 * Get feedback for an analysis (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth required
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = getSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const queryResult = FeedbackQuerySchema.safeParse({
      analysisId: searchParams.get('analysisId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: queryResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { analysisId, limit, offset } = queryResult.data;

    // Build query
    let query = supabase
      .from('user_feedback')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (analysisId) {
      query = query.eq('analysis_id', analysisId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('[Feedback API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
