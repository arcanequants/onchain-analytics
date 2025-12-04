/**
 * Implicit Feedback API Route
 *
 * Handles implicit user behavior signals:
 * - Page views
 * - Scroll depth
 * - Dwell time
 * - Clicks
 * - Hovers
 * - Copy/share actions
 *
 * POST /api/feedback/implicit - Submit batch of implicit events
 *
 * @module app/api/feedback/implicit
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ============================================================================
// TYPES
// ============================================================================

const ImplicitEventTypeEnum = z.enum([
  'page_view',
  'scroll_depth',
  'dwell_time',
  'click',
  'hover',
  'copy',
  'share',
  'expand',
  'collapse',
  'tab_switch',
  'search',
  'filter',
]);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const ImplicitEventSchema = z.object({
  eventType: ImplicitEventTypeEnum,
  sessionId: z.string().min(1).max(100),
  userId: z.string().uuid().optional(),
  analysisId: z.string().uuid().optional(),
  timestamp: z.number().positive(),
  pageUrl: z.string().url().max(2000),
  pageType: z.string().max(50).optional(),
  elementId: z.string().max(200).optional(),
  elementType: z.string().max(50).optional(),
  elementLabel: z.string().max(200).optional(),
  value: z.number().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  viewportWidth: z.number().positive().optional(),
  viewportHeight: z.number().positive().optional(),
});

const ImplicitEventBatchSchema = z.object({
  events: z.array(ImplicitEventSchema).min(1).max(100),
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
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute (higher for implicit signals)

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

// Clean up old rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

function transformEventForDb(
  event: z.infer<typeof ImplicitEventSchema>,
  userAgent: string | null
) {
  return {
    session_id: event.sessionId,
    user_id: event.userId || null,
    event_type: event.eventType,
    element_id: event.elementId || null,
    element_type: event.elementType || null,
    element_label: event.elementLabel || null,
    value: event.value ?? null,
    page_url: event.pageUrl,
    page_type: event.pageType || null,
    analysis_id: event.analysisId || null,
    metadata: event.metadata || {},
    viewport_width: event.viewportWidth || null,
    viewport_height: event.viewportHeight || null,
    user_agent: userAgent,
    created_at: new Date(event.timestamp).toISOString(),
  };
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * POST /api/feedback/implicit
 * Submit batch of implicit events
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
    const validationResult = ImplicitEventBatchSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { events } = validationResult.data;
    const userAgent = request.headers.get('user-agent');

    // Transform events for database
    const dbEvents = events.map((event) => transformEventForDb(event, userAgent));

    // Insert events
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('implicit_feedback_events')
      .insert(dbEvents)
      .select('id');

    if (error) {
      console.error('[Implicit Feedback API] Insert error:', error);

      // Handle specific errors
      if (error.code === '23503') {
        // Foreign key violation - likely invalid analysis_id or user_id
        // Insert events without the invalid references
        const cleanedEvents = dbEvents.map((event) => ({
          ...event,
          analysis_id: null,
          user_id: null,
        }));

        const { error: retryError } = await supabase
          .from('implicit_feedback_events')
          .insert(cleanedEvents);

        if (retryError) {
          console.error('[Implicit Feedback API] Retry insert error:', retryError);
          return NextResponse.json(
            { error: 'Failed to store events' },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to store events' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        eventsStored: events.length,
        ids: data?.map((d) => d.id) || [],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[Implicit Feedback API] Error:', error);

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
 * OPTIONS handler for CORS preflight
 */
import { createPreflightResponse } from '@/lib/security/cors';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return createPreflightResponse(origin);
}
