/**
 * RLHF Monthly Report CRON Endpoint
 * Phase 4, Week 8 - RLHF & Feedback Loop Checklist
 *
 * Generates and distributes monthly RLHF improvement reports.
 * Scheduled to run on the 1st of each month.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateMonthlyReport,
  formatReportAsMarkdown,
  formatReportAsJSON,
} from '@/lib/rlhf/monthly-report';
import { supabase } from '@/lib/supabase';

// Verify CRON secret for security
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();

  try {
    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const { month, year, format = 'json' } = body;

    console.log('Starting RLHF monthly report generation...');

    // Generate the report
    const report = await generateMonthlyReport(month, year);

    // Format output
    let formattedReport: string;
    if (format === 'markdown') {
      formattedReport = formatReportAsMarkdown(report);
    } else {
      formattedReport = formatReportAsJSON(report);
    }

    // Log execution
    await supabase.from('cron_executions').insert({
      job_name: 'rlhf-monthly-report',
      status: 'success',
      execution_time: Date.now() - startTime,
      metadata: {
        reportId: report.id,
        period: report.metrics.period,
        feedbackCount: report.metrics.feedbackSummary.totalFeedback,
        highlightsCount: report.highlights.length,
        actionItemsCount: report.actionItems.length,
      },
    });

    // Send notifications if configured
    await sendReportNotifications(report);

    console.log(`RLHF report generated successfully: ${report.id}`);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      generatedAt: report.generatedAt,
      summary: {
        period: report.metrics.period,
        totalFeedback: report.metrics.feedbackSummary.totalFeedback,
        positiveRate: report.metrics.feedbackSummary.positiveRate,
        scoreAccuracy: report.metrics.accuracyMetrics.scoreAccuracy,
        highlightsCount: report.highlights.length,
        actionItemsCount: report.actionItems.length,
      },
      report: format === 'full' ? report : undefined,
      markdown: format === 'markdown' ? formattedReport : undefined,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error generating RLHF report:', error);

    // Log failure
    await supabase.from('cron_executions').insert({
      job_name: 'rlhf-monthly-report',
      status: 'error',
      execution_time: Date.now() - startTime,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    return NextResponse.json(
      {
        error: 'Failed to generate RLHF report',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Verify authentication
  if (!verifyCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Get the latest report
  const { data, error } = await supabase
    .from('rlhf_monthly_reports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch latest report', details: error.message },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'No reports found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    report: data,
  });
}

// Helper function to send notifications
async function sendReportNotifications(report: any): Promise<void> {
  // Check if email notifications are configured
  const notifyEmail = process.env.RLHF_REPORT_EMAIL;
  const slackWebhook = process.env.RLHF_SLACK_WEBHOOK;

  if (notifyEmail) {
    // Send email notification (implementation depends on email service)
    console.log(`Would send report to: ${notifyEmail}`);
  }

  if (slackWebhook) {
    try {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `RLHF Monthly Report Generated`,
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: 'RLHF Monthly Report',
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*Report ID:*\n${report.id}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Generated:*\n${new Date(report.generatedAt).toLocaleDateString()}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Feedback Count:*\n${report.metrics.feedbackSummary.totalFeedback}`,
                },
                {
                  type: 'mrkdwn',
                  text: `*Positive Rate:*\n${report.metrics.feedbackSummary.positiveRate.toFixed(1)}%`,
                },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Highlights:*\n${report.highlights.slice(0, 3).map((h: string) => `• ${h}`).join('\n')}`,
              },
            },
          ],
        }),
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }
}

// Export config for Vercel CRON
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
