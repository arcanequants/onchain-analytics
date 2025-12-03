/**
 * Preference Pairs API Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Allows:
 * - Creating explicit preference pairs from user comparisons
 * - Retrieving preference pairs for training exports
 * - Getting statistics on collected pairs
 *
 * Target: 1,000+ preference pairs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPairConstructor, type PreferencePair } from '@/lib/rlhf/pair-constructor';
import { supabase } from '@/lib/supabase';

// ============================================================================
// POST: Create explicit preference pair
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      analysisAId,
      analysisBId,
      preferred,
      userId,
      context,
    } = body;

    // Validate required fields
    if (!analysisAId || !analysisBId || !preferred) {
      return NextResponse.json(
        { error: 'Missing required fields: analysisAId, analysisBId, preferred' },
        { status: 400 }
      );
    }

    // Validate preference value
    if (!['a', 'b', 'tie'].includes(preferred)) {
      return NextResponse.json(
        { error: 'Invalid preference value. Must be "a", "b", or "tie"' },
        { status: 400 }
      );
    }

    // Validate analyses are different
    if (analysisAId === analysisBId) {
      return NextResponse.json(
        { error: 'Cannot compare an analysis to itself' },
        { status: 400 }
      );
    }

    const constructor = createPairConstructor();

    // Create the explicit preference pair
    const pairId = await constructor.createExplicitPair(
      analysisAId,
      analysisBId,
      preferred,
      userId || null,
      context || {}
    );

    // Get updated stats
    const stats = await constructor.getStats();

    return NextResponse.json({
      success: true,
      pairId,
      message: 'Preference pair created successfully',
      stats: {
        totalPairs: stats.total,
        targetMet: stats.total >= 1000,
        progress: Math.min(100, Math.round((stats.total / 1000) * 100)),
      },
    });
  } catch (error) {
    console.error('Error creating preference pair:', error);
    return NextResponse.json(
      {
        error: 'Failed to create preference pair',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET: Retrieve preference pairs
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const action = searchParams.get('action') || 'stats';
  const minQuality = parseFloat(searchParams.get('minQuality') || '0');
  const limit = parseInt(searchParams.get('limit') || '100', 10);
  const onlyUnused = searchParams.get('onlyUnused') === 'true';
  const industryId = searchParams.get('industryId');
  const format = searchParams.get('format') || 'json';

  try {
    const constructor = createPairConstructor();

    switch (action) {
      case 'stats': {
        // Return statistics
        const stats = await constructor.getStats();

        return NextResponse.json({
          success: true,
          stats: {
            totalPairs: stats.total,
            bySource: stats.bySource,
            byPreferred: stats.byPreferred,
            highQuality: stats.highQuality,
            usedInTraining: stats.usedInTraining,
            availableForTraining: stats.total - stats.usedInTraining,
            avgConfidence: Math.round(stats.avgConfidence * 100) / 100,
          },
          target: {
            required: 1000,
            current: stats.total,
            met: stats.total >= 1000,
            progress: Math.min(100, Math.round((stats.total / 1000) * 100)),
          },
        });
      }

      case 'export': {
        // Export pairs for training
        const pairs = await constructor.getTrainingPairs({
          minQualityScore: minQuality > 0 ? minQuality : undefined,
          limit: Math.min(limit, 10000),
          onlyUnused,
          industryId: industryId || undefined,
        });

        if (format === 'csv') {
          // Format as CSV for ML training
          const csvHeader =
            'analysis_a_id,analysis_b_id,preferred,confidence,source,is_high_quality';
          const csvRows = pairs.map(
            (p) =>
              `${p.analysisAId},${p.analysisBId},${p.preferred},${p.confidence},${p.source},${p.isHighQuality}`
          );
          const csv = [csvHeader, ...csvRows].join('\n');

          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="preference_pairs_${Date.now()}.csv"`,
            },
          });
        }

        if (format === 'jsonl') {
          // Format as JSONL for ML training
          const jsonl = pairs
            .map((p) =>
              JSON.stringify({
                chosen: p.preferred === 'a' ? p.analysisAId : p.analysisBId,
                rejected:
                  p.preferred === 'a' ? p.analysisBId : p.analysisAId,
                preferred: p.preferred,
                confidence: p.confidence,
                source: p.source,
              })
            )
            .join('\n');

          return new NextResponse(jsonl, {
            headers: {
              'Content-Type': 'application/jsonl',
              'Content-Disposition': `attachment; filename="preference_pairs_${Date.now()}.jsonl"`,
            },
          });
        }

        // Default JSON format
        return NextResponse.json({
          success: true,
          count: pairs.length,
          pairs,
        });
      }

      case 'sample': {
        // Get a random sample for labeling UI
        const { data: sample } = await supabase
          .from('preference_pairs')
          .select('*')
          .limit(limit)
          .order('created_at', { ascending: false });

        return NextResponse.json({
          success: true,
          count: sample?.length || 0,
          sample: sample || [],
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error getting preference pairs:', error);
    return NextResponse.json(
      {
        error: 'Failed to get preference pairs',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH: Mark pairs as used in training
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pairIds, batchId } = body;

    if (!pairIds || !Array.isArray(pairIds) || pairIds.length === 0) {
      return NextResponse.json(
        { error: 'pairIds must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!batchId || typeof batchId !== 'string') {
      return NextResponse.json(
        { error: 'batchId must be a non-empty string' },
        { status: 400 }
      );
    }

    const constructor = createPairConstructor();
    await constructor.markPairsAsUsed(pairIds, batchId);

    return NextResponse.json({
      success: true,
      message: `Marked ${pairIds.length} pairs as used in training batch ${batchId}`,
    });
  } catch (error) {
    console.error('Error marking pairs as used:', error);
    return NextResponse.json(
      {
        error: 'Failed to mark pairs as used',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Export config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
