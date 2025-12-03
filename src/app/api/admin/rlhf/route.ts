/**
 * Admin RLHF API
 * Phase 4, Week 9 - Admin API Endpoints
 *
 * Returns RLHF (Reinforcement Learning from Human Feedback) metrics.
 * Since RLHF tables don't exist yet, returns empty/demo data.
 */

import { NextRequest, NextResponse } from 'next/server';

// This API consolidates data for calibration, corrections, and metrics pages

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'all';

  try {
    // Since RLHF tables don't exist yet, return empty/demo data
    const now = new Date().toISOString();

    // Calibration data - simulates score calibration per industry
    const calibrations = {
      industries: [],
      stats: {
        totalIndustries: 0,
        wellCalibrated: 0,
        needsAttention: 0,
        totalSamples: 0,
        avgMae: 0,
      },
      adjustments: [],
    };

    // Corrections data - simulates human corrections to AI outputs
    const corrections = {
      items: [],
      stats: {
        totalCorrections: 0,
        pendingReview: 0,
        applied: 0,
        rejected: 0,
      },
      recentActivity: [],
    };

    // Metrics data - simulates RLHF training metrics
    const metrics = {
      overview: {
        totalFeedback: 0,
        averageRating: 0,
        modelAccuracy: 0,
        lastTraining: null,
      },
      trends: [],
      byCategory: [],
      rewardSignals: [],
    };

    // Return based on type parameter
    if (type === 'calibration') {
      return NextResponse.json(calibrations);
    } else if (type === 'corrections') {
      return NextResponse.json(corrections);
    } else if (type === 'metrics') {
      return NextResponse.json(metrics);
    }

    // Return all data
    return NextResponse.json({
      calibrations,
      corrections,
      metrics,
      status: 'no_data',
      message: 'RLHF tables not configured. Showing empty state.',
      timestamp: now,
    });

  } catch (err) {
    console.error('Admin RLHF API error:', err);
    return NextResponse.json({
      calibrations: { industries: [], stats: {}, adjustments: [] },
      corrections: { items: [], stats: {}, recentActivity: [] },
      metrics: { overview: {}, trends: [], byCategory: [], rewardSignals: [] },
      error: 'Failed to fetch RLHF data',
    }, { status: 500 });
  }
}
