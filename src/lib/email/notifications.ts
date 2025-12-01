/**
 * AI Perception Email Notifications
 *
 * Email templates for analysis-related notifications:
 * - Analysis complete
 * - Score changes (improvements and declines)
 * - Monitoring alerts
 * - Weekly digest
 *
 * Phase 2, Week 4, Day 4
 */

import { sendEmail } from '../resend';

// ================================================================
// TYPES
// ================================================================

export interface AnalysisResult {
  id: string;
  url: string;
  brandName: string;
  overallScore: number;
  previousScore?: number;
  providerScores: {
    provider: string;
    score: number;
  }[];
  topRecommendations: {
    title: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface ScoreChangeData {
  url: string;
  brandName: string;
  previousScore: number;
  currentScore: number;
  change: number;
  percentChange: number;
  analysisId: string;
}

export interface WeeklyDigestData {
  userName: string;
  totalAnalyses: number;
  averageScore: number;
  scoreChange: number;
  topPerformingUrl?: {
    url: string;
    brandName: string;
    score: number;
  };
  needsAttentionUrl?: {
    url: string;
    brandName: string;
    score: number;
  };
  industryComparison?: {
    yourAverage: number;
    industryAverage: number;
  };
}

// ================================================================
// CONSTANTS
// ================================================================

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://aiperception.io';
const SUPPORT_EMAIL = 'support@aiperception.io';

// ================================================================
// EMAIL STYLES
// ================================================================

const baseStyles = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
  }
  .container {
    max-width: 600px;
    margin: 40px auto;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .header {
    padding: 40px 30px;
    text-align: center;
  }
  .header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }
  .content {
    padding: 40px 30px;
  }
  .content p {
    margin: 0 0 20px 0;
    font-size: 16px;
    line-height: 1.6;
  }
  .button-container {
    text-align: center;
    margin: 30px 0;
  }
  .button {
    display: inline-block;
    color: white !important;
    padding: 14px 40px;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 16px;
  }
  .score-box {
    text-align: center;
    padding: 30px;
    background: #f8f9fa;
    border-radius: 8px;
    margin: 20px 0;
  }
  .score-value {
    font-size: 48px;
    font-weight: 700;
    margin: 0;
  }
  .score-label {
    font-size: 14px;
    color: #6c757d;
    margin-top: 5px;
  }
  .provider-list {
    margin: 20px 0;
  }
  .provider-item {
    display: flex;
    justify-content: space-between;
    padding: 12px 15px;
    background: #f8f9fa;
    border-radius: 6px;
    margin: 8px 0;
  }
  .recommendation {
    padding: 15px;
    border-left: 4px solid;
    margin: 12px 0;
    background: #f8f9fa;
    border-radius: 0 6px 6px 0;
  }
  .recommendation.high { border-color: #dc3545; }
  .recommendation.medium { border-color: #ffc107; }
  .recommendation.low { border-color: #28a745; }
  .footer {
    background: #f8f9fa;
    padding: 30px;
    text-align: center;
    color: #6c757d;
    font-size: 13px;
  }
  .footer p {
    margin: 5px 0;
  }
  @media only screen and (max-width: 600px) {
    .container {
      margin: 0;
      border-radius: 0;
    }
    .header, .content, .footer {
      padding: 30px 20px;
    }
  }
`;

// ================================================================
// HELPER FUNCTIONS
// ================================================================

function getScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#3B82F6'; // blue
  if (score >= 40) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Critical';
}

function formatProviderName(provider: string): string {
  const names: Record<string, string> = {
    openai: 'OpenAI (GPT)',
    anthropic: 'Anthropic (Claude)',
    google: 'Google (Gemini)',
    perplexity: 'Perplexity',
  };
  return names[provider.toLowerCase()] || provider;
}

// ================================================================
// EMAIL: ANALYSIS COMPLETE
// ================================================================

export async function sendAnalysisCompleteEmail(
  email: string,
  userName: string,
  analysis: AnalysisResult
) {
  const scoreColor = getScoreColor(analysis.overallScore);
  const scoreLabel = getScoreLabel(analysis.overallScore);
  const resultsUrl = `${SITE_URL}/results/${analysis.id}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analysis Complete - AI Perception</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}cc 100%); color: white;">
      <h1>Analysis Complete</h1>
    </div>
    <div class="content">
      <p>Hi ${userName || 'there'},</p>
      <p>Your AI perception analysis for <strong>${analysis.brandName}</strong> is ready!</p>

      <div class="score-box">
        <p class="score-value" style="color: ${scoreColor};">${analysis.overallScore}</p>
        <p class="score-label">${scoreLabel} - Overall AI Perception Score</p>
      </div>

      <h3 style="margin-top: 30px; margin-bottom: 15px;">Scores by AI Provider</h3>
      <div class="provider-list">
        ${analysis.providerScores
          .map(
            (p) => `
          <div class="provider-item">
            <span>${formatProviderName(p.provider)}</span>
            <strong style="color: ${getScoreColor(p.score)}">${p.score}/100</strong>
          </div>
        `
          )
          .join('')}
      </div>

      ${
        analysis.topRecommendations.length > 0
          ? `
        <h3 style="margin-top: 30px; margin-bottom: 15px;">Top Recommendations</h3>
        ${analysis.topRecommendations
          .slice(0, 3)
          .map(
            (r) => `
          <div class="recommendation ${r.priority}">
            <strong>${r.priority === 'high' ? '🔴' : r.priority === 'medium' ? '🟡' : '🟢'} ${r.title}</strong>
          </div>
        `
          )
          .join('')}
      `
          : ''
      }

      <div class="button-container">
        <a href="${resultsUrl}" class="button" style="background: ${scoreColor};">View Full Results</a>
      </div>

      <p style="font-size: 14px; color: #6c757d; margin-top: 30px;">
        Analyzed URL: <a href="${analysis.url}" style="color: ${scoreColor};">${analysis.url}</a>
      </p>

      <p style="margin-top: 30px;">
        Questions about your results? Reply to this email - we're here to help!
      </p>
    </div>
    <div class="footer">
      <p><strong>AI Perception</strong> - Know How AI Sees Your Brand</p>
      <p style="margin-top: 10px;">
        <a href="${SITE_URL}/dashboard" style="color: ${scoreColor}; text-decoration: none;">Dashboard</a> •
        <a href="${SITE_URL}/pricing" style="color: ${scoreColor}; text-decoration: none;">Upgrade</a> •
        <a href="${SITE_URL}/settings/notifications" style="color: ${scoreColor}; text-decoration: none;">Email Settings</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `Analysis Complete: ${analysis.brandName} scored ${analysis.overallScore}/100`,
    html,
    replyTo: SUPPORT_EMAIL,
  });
}

// ================================================================
// EMAIL: SCORE CHANGE ALERT
// ================================================================

export async function sendScoreChangeEmail(
  email: string,
  userName: string,
  data: ScoreChangeData
) {
  const isImprovement = data.change > 0;
  const changeColor = isImprovement ? '#10B981' : '#EF4444';
  const changeEmoji = isImprovement ? '📈' : '📉';
  const changeWord = isImprovement ? 'improved' : 'decreased';
  const resultsUrl = `${SITE_URL}/results/${data.analysisId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Score Change Alert - AI Perception</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, ${changeColor} 0%, ${changeColor}cc 100%); color: white;">
      <h1>${changeEmoji} Score ${isImprovement ? 'Improved' : 'Alert'}</h1>
    </div>
    <div class="content">
      <p>Hi ${userName || 'there'},</p>
      <p>Your AI perception score for <strong>${data.brandName}</strong> has ${changeWord}.</p>

      <div class="score-box" style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <div style="text-align: center;">
          <p style="font-size: 14px; color: #6c757d; margin: 0;">Previous</p>
          <p style="font-size: 32px; font-weight: 700; margin: 5px 0; color: #6c757d;">${data.previousScore}</p>
        </div>
        <div style="font-size: 24px;">→</div>
        <div style="text-align: center;">
          <p style="font-size: 14px; color: #6c757d; margin: 0;">Current</p>
          <p style="font-size: 32px; font-weight: 700; margin: 5px 0; color: ${getScoreColor(data.currentScore)};">${data.currentScore}</p>
        </div>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; padding: 8px 16px; background: ${changeColor}22; color: ${changeColor}; border-radius: 20px; font-weight: 600;">
          ${isImprovement ? '+' : ''}${data.change} points (${data.percentChange > 0 ? '+' : ''}${data.percentChange}%)
        </span>
      </div>

      ${
        isImprovement
          ? `
        <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; border-radius: 0 6px 6px 0; margin: 20px 0;">
          <strong style="color: #155724;">Great work!</strong>
          <p style="color: #155724; margin: 5px 0 0 0; font-size: 14px;">
            Your improvements are paying off. Keep up the good work!
          </p>
        </div>
      `
          : `
        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; border-radius: 0 6px 6px 0; margin: 20px 0;">
          <strong style="color: #721c24;">Attention needed</strong>
          <p style="color: #721c24; margin: 5px 0 0 0; font-size: 14px;">
            We recommend reviewing your AI perception strategy. Check your results for specific recommendations.
          </p>
        </div>
      `
      }

      <div class="button-container">
        <a href="${resultsUrl}" class="button" style="background: ${changeColor};">View Latest Results</a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        URL: <a href="${data.url}" style="color: #3B82F6;">${data.url}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>AI Perception</strong> - Know How AI Sees Your Brand</p>
      <p style="margin-top: 10px; font-size: 12px;">
        <a href="${SITE_URL}/settings/notifications" style="color: #6c757d; text-decoration: none;">Manage notification preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const subject = isImprovement
    ? `${changeEmoji} Score Improved: ${data.brandName} +${data.change} points!`
    : `${changeEmoji} Score Alert: ${data.brandName} ${data.change} points`;

  return sendEmail({
    to: email,
    subject,
    html,
    replyTo: SUPPORT_EMAIL,
  });
}

// ================================================================
// EMAIL: WEEKLY DIGEST
// ================================================================

export async function sendWeeklyDigestEmail(
  email: string,
  data: WeeklyDigestData
) {
  const scoreColor = getScoreColor(data.averageScore);
  const trendEmoji = data.scoreChange > 0 ? '📈' : data.scoreChange < 0 ? '📉' : '➡️';
  const dashboardUrl = `${SITE_URL}/dashboard`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly AI Perception Digest</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%); color: white;">
      <h1>Weekly Digest</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your AI Perception Summary</p>
    </div>
    <div class="content">
      <p>Hi ${data.userName || 'there'},</p>
      <p>Here's your weekly summary of how AI sees your brand:</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0;">
        <div class="score-box" style="margin: 0;">
          <p style="font-size: 36px; font-weight: 700; color: ${scoreColor}; margin: 0;">${data.averageScore}</p>
          <p class="score-label">Avg Score</p>
        </div>
        <div class="score-box" style="margin: 0;">
          <p style="font-size: 36px; font-weight: 700; color: #6366F1; margin: 0;">${data.totalAnalyses}</p>
          <p class="score-label">Analyses Run</p>
        </div>
      </div>

      <div style="text-align: center; margin: 20px 0;">
        <span style="font-size: 14px; color: #6c757d;">Week-over-week trend:</span>
        <span style="display: inline-block; padding: 6px 12px; background: ${data.scoreChange >= 0 ? '#d4edda' : '#f8d7da'}; color: ${data.scoreChange >= 0 ? '#155724' : '#721c24'}; border-radius: 15px; font-weight: 600; margin-left: 10px;">
          ${trendEmoji} ${data.scoreChange > 0 ? '+' : ''}${data.scoreChange} points
        </span>
      </div>

      ${
        data.topPerformingUrl
          ? `
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #155724;">🏆 Top Performer</p>
          <p style="margin: 0; font-size: 14px; color: #155724;">
            <strong>${data.topPerformingUrl.brandName}</strong> scored ${data.topPerformingUrl.score}/100
          </p>
        </div>
      `
          : ''
      }

      ${
        data.needsAttentionUrl
          ? `
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #856404;">⚠️ Needs Attention</p>
          <p style="margin: 0; font-size: 14px; color: #856404;">
            <strong>${data.needsAttentionUrl.brandName}</strong> scored ${data.needsAttentionUrl.score}/100
          </p>
        </div>
      `
          : ''
      }

      ${
        data.industryComparison
          ? `
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; font-weight: 600; color: #1565c0;">📊 Industry Comparison</p>
          <p style="margin: 0; font-size: 14px; color: #1565c0;">
            Your average: <strong>${data.industryComparison.yourAverage}</strong> |
            Industry average: <strong>${data.industryComparison.industryAverage}</strong>
            ${data.industryComparison.yourAverage > data.industryComparison.industryAverage ? ' 🎉' : ''}
          </p>
        </div>
      `
          : ''
      }

      <div class="button-container">
        <a href="${dashboardUrl}" class="button" style="background: #6366F1;">View Dashboard</a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6c757d;">
        Keep improving your AI perception to stay ahead of competitors!
      </p>
    </div>
    <div class="footer">
      <p><strong>AI Perception</strong> - Know How AI Sees Your Brand</p>
      <p style="margin-top: 10px; font-size: 12px;">
        <a href="${SITE_URL}/settings/notifications" style="color: #6c757d; text-decoration: none;">Unsubscribe from weekly digests</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `${trendEmoji} Your Weekly AI Perception Digest - Avg Score: ${data.averageScore}`,
    html,
    replyTo: SUPPORT_EMAIL,
  });
}

// ================================================================
// EMAIL: MONITORING ALERT
// ================================================================

export interface MonitoringAlertData {
  brandName: string;
  url: string;
  alertType: 'score_drop' | 'competitor_ahead' | 'new_hallucination' | 'rank_change';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  analysisId: string;
}

export async function sendMonitoringAlertEmail(
  email: string,
  userName: string,
  data: MonitoringAlertData
) {
  const severityConfig = {
    info: { color: '#3B82F6', emoji: 'ℹ️', bg: '#dbeafe' },
    warning: { color: '#F59E0B', emoji: '⚠️', bg: '#fef3c7' },
    critical: { color: '#EF4444', emoji: '🚨', bg: '#fee2e2' },
  };

  const config = severityConfig[data.severity];
  const resultsUrl = `${SITE_URL}/results/${data.analysisId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Monitoring Alert - AI Perception</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header" style="background: linear-gradient(135deg, ${config.color} 0%, ${config.color}cc 100%); color: white;">
      <h1>${config.emoji} Monitoring Alert</h1>
    </div>
    <div class="content">
      <p>Hi ${userName || 'there'},</p>
      <p>We detected something important about <strong>${data.brandName}</strong>:</p>

      <div style="background: ${config.bg}; padding: 20px; border-radius: 8px; border-left: 4px solid ${config.color}; margin: 20px 0;">
        <p style="margin: 0; color: ${config.color}; font-weight: 600;">${data.message}</p>
      </div>

      <div class="button-container">
        <a href="${resultsUrl}" class="button" style="background: ${config.color};">View Details</a>
      </div>

      <p style="font-size: 14px; color: #6c757d;">
        Monitored URL: <a href="${data.url}" style="color: #3B82F6;">${data.url}</a>
      </p>
    </div>
    <div class="footer">
      <p><strong>AI Perception</strong> - Know How AI Sees Your Brand</p>
      <p style="margin-top: 10px; font-size: 12px;">
        <a href="${SITE_URL}/settings/notifications" style="color: #6c757d; text-decoration: none;">Manage alert settings</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return sendEmail({
    to: email,
    subject: `${config.emoji} Alert: ${data.brandName} - ${data.message.slice(0, 50)}...`,
    html,
    replyTo: SUPPORT_EMAIL,
  });
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  sendAnalysisCompleteEmail,
  sendScoreChangeEmail,
  sendWeeklyDigestEmail,
  sendMonitoringAlertEmail,
};
