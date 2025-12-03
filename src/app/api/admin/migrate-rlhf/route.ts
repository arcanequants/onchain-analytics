/**
 * Admin Migration Endpoint - RLHF Tables
 *
 * One-time endpoint to create RLHF tables.
 * Should be removed after migration is applied.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create tables one by one using Supabase's raw query capability
    const tables = [
      // 1. user_feedback
      `CREATE TABLE IF NOT EXISTS user_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        analysis_id UUID,
        brand_name VARCHAR(255),
        brand_domain VARCHAR(255),
        feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'rating', 'correction')),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        ai_score INTEGER,
        user_expected_score INTEGER,
        feedback_reason TEXT,
        user_id UUID,
        session_id VARCHAR(255),
        page_context VARCHAR(100),
        ai_model_version VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 2. score_corrections
      `CREATE TABLE IF NOT EXISTS score_corrections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        brand_domain VARCHAR(255) NOT NULL,
        industry VARCHAR(100),
        original_score INTEGER NOT NULL,
        corrected_score INTEGER,
        correction_type VARCHAR(50) NOT NULL,
        correction_reason TEXT NOT NULL,
        evidence_urls TEXT[],
        status VARCHAR(20) DEFAULT 'pending',
        priority VARCHAR(10) DEFAULT 'medium',
        submitted_by UUID,
        submitted_by_email VARCHAR(255),
        reviewed_by UUID,
        reviewed_at TIMESTAMPTZ,
        review_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 3. preference_pairs
      `CREATE TABLE IF NOT EXISTS preference_pairs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_name VARCHAR(255) NOT NULL,
        prompt_context TEXT,
        output_a_score INTEGER NOT NULL,
        output_a_reasoning TEXT,
        output_a_model VARCHAR(50),
        output_b_score INTEGER NOT NULL,
        output_b_reasoning TEXT,
        output_b_model VARCHAR(50),
        preferred VARCHAR(1) CHECK (preferred IN ('A', 'B', 'T')),
        preference_strength VARCHAR(10),
        preference_reason TEXT,
        pair_type VARCHAR(20) DEFAULT 'explicit',
        annotator_id UUID,
        confidence_score DECIMAL(3,2),
        validated BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 4. calibration_data
      `CREATE TABLE IF NOT EXISTS calibration_data (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        industry VARCHAR(100) NOT NULL,
        predicted_score INTEGER NOT NULL,
        actual_score DECIMAL(5,2) NOT NULL,
        sample_count INTEGER DEFAULT 1,
        mae DECIMAL(5,2),
        rmse DECIMAL(5,2),
        r2_score DECIMAL(4,3),
        brier_score DECIMAL(4,3),
        adjustment_factor DECIMAL(4,3) DEFAULT 1.000,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 5. calibration_adjustments
      `CREATE TABLE IF NOT EXISTS calibration_adjustments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        industry VARCHAR(100) NOT NULL,
        old_factor DECIMAL(4,3) NOT NULL,
        new_factor DECIMAL(4,3) NOT NULL,
        reason TEXT NOT NULL,
        adjusted_by UUID,
        adjustment_type VARCHAR(20) DEFAULT 'manual',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`,

      // 6. rlhf_training_runs
      `CREATE TABLE IF NOT EXISTS rlhf_training_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        model_version VARCHAR(50) NOT NULL,
        base_model VARCHAR(100),
        feedback_samples INTEGER DEFAULT 0,
        preference_pairs INTEGER DEFAULT 0,
        corrections_applied INTEGER DEFAULT 0,
        accuracy_before DECIMAL(4,3),
        accuracy_after DECIMAL(4,3),
        precision_score DECIMAL(4,3),
        recall_score DECIMAL(4,3),
        f1_score DECIMAL(4,3),
        status VARCHAR(20) DEFAULT 'pending',
        error_message TEXT,
        started_at TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`
    ];

    const results: { table: string; success: boolean; error?: string }[] = [];

    // We can't run raw SQL directly, but we can check if tables exist
    // and create them via the Supabase dashboard or use a different approach

    // For now, let's just verify connectivity and return table definitions
    // that need to be run in Supabase SQL Editor

    // Check if tables already exist
    const tableChecks = [
      'user_feedback',
      'score_corrections',
      'preference_pairs',
      'calibration_data',
      'calibration_adjustments',
      'rlhf_training_runs'
    ];

    const existingTables: string[] = [];
    const missingTables: string[] = [];

    for (const tableName of tableChecks) {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error?.code === '42P01') {
        // Table doesn't exist
        missingTables.push(tableName);
      } else {
        existingTables.push(tableName);
      }
    }

    return NextResponse.json({
      status: missingTables.length === 0 ? 'all_tables_exist' : 'tables_missing',
      existingTables,
      missingTables,
      message: missingTables.length === 0
        ? 'All RLHF tables already exist!'
        : `Missing tables: ${missingTables.join(', ')}. Please run the SQL migration in Supabase Dashboard.`,
      sqlFile: 'supabase/migrations/20241203_rlhf_tables.sql'
    });

  } catch (err) {
    console.error('Migration check error:', err);
    return NextResponse.json({
      error: 'Failed to check migration status',
      details: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to check/apply RLHF migration',
    instructions: [
      '1. POST to this endpoint to check table status',
      '2. If tables are missing, copy SQL from supabase/migrations/20241203_rlhf_tables.sql',
      '3. Run the SQL in Supabase Dashboard > SQL Editor'
    ]
  });
}
