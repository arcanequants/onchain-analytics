/**
 * Admin Data Quality API
 * Phase 4, Week 9 - Admin API Endpoints
 *
 * Returns data quality metrics by checking table statistics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface DataQualityRule {
  id: string;
  rule_code: string;
  rule_name: string;
  description: string;
  rule_type: string;
  target_table: string;
  target_column: string | null;
  severity: 'critical' | 'error' | 'warning' | 'info';
  check_frequency: string;
  is_enabled: boolean;
  last_check_at: string | null;
  last_status: 'pass' | 'fail' | 'error' | null;
  consecutive_failures: number;
  category: string;
}

interface DataQualitySummary {
  total_rules: number;
  passing_rules: number;
  failing_rules: number;
  error_rules: number;
  pass_rate: number;
  critical_failures: number;
  last_check: string | null;
}

// Tables to check for data quality
const TABLES_TO_CHECK = [
  'cron_executions',
  'audit_log',
  'feature_flags',
  'tickets',
];

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const rules: DataQualityRule[] = [];
    const results: Array<{ rule_code: string; status: string; rows_checked: number }> = [];
    let passingRules = 0;
    let failingRules = 0;
    let errorRules = 0;

    // Check each table
    for (let i = 0; i < TABLES_TO_CHECK.length; i++) {
      const table = TABLES_TO_CHECK[i];
      const ruleCode = `DQ${String(i + 1).padStart(3, '0')}`;

      try {
        // Check if table exists and has data
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          // Table doesn't exist or can't be accessed
          rules.push({
            id: `rule_${i}`,
            rule_code: ruleCode,
            rule_name: `${table}_accessible`,
            description: `Table ${table} should be accessible`,
            rule_type: 'accessibility',
            target_table: table,
            target_column: null,
            severity: 'error',
            check_frequency: 'hourly',
            is_enabled: true,
            last_check_at: new Date().toISOString(),
            last_status: 'error',
            consecutive_failures: 1,
            category: 'infrastructure',
          });
          errorRules++;
          results.push({ rule_code: ruleCode, status: 'error', rows_checked: 0 });
        } else {
          // Table exists
          const rowCount = count || 0;
          const hasData = rowCount > 0;

          rules.push({
            id: `rule_${i}`,
            rule_code: ruleCode,
            rule_name: `${table}_has_data`,
            description: `Table ${table} should contain data`,
            rule_type: 'completeness',
            target_table: table,
            target_column: null,
            severity: hasData ? 'info' : 'warning',
            check_frequency: 'hourly',
            is_enabled: true,
            last_check_at: new Date().toISOString(),
            last_status: hasData ? 'pass' : 'fail',
            consecutive_failures: hasData ? 0 : 1,
            category: 'data',
          });

          if (hasData) {
            passingRules++;
          } else {
            failingRules++;
          }

          results.push({ rule_code: ruleCode, status: hasData ? 'pass' : 'fail', rows_checked: rowCount });
        }
      } catch (err) {
        errorRules++;
        rules.push({
          id: `rule_${i}`,
          rule_code: ruleCode,
          rule_name: `${table}_check`,
          description: `Check table ${table}`,
          rule_type: 'accessibility',
          target_table: table,
          target_column: null,
          severity: 'error',
          check_frequency: 'hourly',
          is_enabled: true,
          last_check_at: new Date().toISOString(),
          last_status: 'error',
          consecutive_failures: 1,
          category: 'infrastructure',
        });
        results.push({ rule_code: ruleCode, status: 'error', rows_checked: 0 });
      }
    }

    // Add additional validation rules
    // Check cron execution success rate
    const { data: cronStats } = await supabase
      .from('cron_executions')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (cronStats) {
      const total = cronStats.length;
      const successful = cronStats.filter(c => c.status === 'success').length;
      const successRate = total > 0 ? (successful / total) * 100 : 100;

      rules.push({
        id: `rule_cron_success`,
        rule_code: 'DQ100',
        rule_name: 'cron_success_rate',
        description: 'Cron job success rate should be above 90%',
        rule_type: 'reliability',
        target_table: 'cron_executions',
        target_column: 'status',
        severity: successRate < 90 ? 'error' : 'info',
        check_frequency: 'hourly',
        is_enabled: true,
        last_check_at: new Date().toISOString(),
        last_status: successRate >= 90 ? 'pass' : 'fail',
        consecutive_failures: successRate < 90 ? 1 : 0,
        category: 'reliability',
      });

      if (successRate >= 90) {
        passingRules++;
      } else {
        failingRules++;
      }

      results.push({
        rule_code: 'DQ100',
        status: successRate >= 90 ? 'pass' : 'fail',
        rows_checked: total,
      });
    }

    const totalRules = rules.length;
    const passRate = totalRules > 0 ? (passingRules / totalRules) * 100 : 100;

    const summary: DataQualitySummary = {
      total_rules: totalRules,
      passing_rules: passingRules,
      failing_rules: failingRules,
      error_rules: errorRules,
      pass_rate: parseFloat(passRate.toFixed(2)),
      critical_failures: rules.filter(r => r.severity === 'critical' && r.last_status === 'fail').length,
      last_check: new Date().toISOString(),
    };

    return NextResponse.json({
      rules,
      results,
      summary,
      orphan_scans: [], // No orphan scan implementation yet
    });

  } catch (err) {
    console.error('Admin data-quality API error:', err);
    return NextResponse.json({
      rules: [],
      results: [],
      summary: {
        total_rules: 0,
        passing_rules: 0,
        failing_rules: 0,
        error_rules: 0,
        pass_rate: 0,
        critical_failures: 0,
        last_check: null,
      },
      orphan_scans: [],
      error: 'Failed to check data quality',
    }, { status: 500 });
  }
}
