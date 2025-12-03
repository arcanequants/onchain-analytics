/**
 * Weekly Digest Email Templates
 *
 * Phase 2, Week 3, Day 5
 * Email templates for weekly AI perception reports
 */

// ================================================================
// TYPES
// ================================================================

export interface WeeklyDigestData {
  brandName: string;
  recipientName: string;
  recipientEmail: string;
  weekStartDate: Date;
  weekEndDate: Date;
  currentScore: number;
  previousScore: number;
  scoreChange: number;
  scoreTrend: 'up' | 'down' | 'stable';
  categoryScores: Array<{
    name: string;
    score: number;
    change: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  keyHighlights: string[];
  topRecommendations: Array<{
    title: string;
    priority: 'critical' | 'high' | 'medium';
    category: string;
  }>;
  competitorUpdates?: Array<{
    name: string;
    change: string;
  }>;
  newMentions?: number;
  dashboardUrl: string;
}

export interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
}

// ================================================================
// TEMPLATE HELPERS
// ================================================================

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function getTrendArrow(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}

function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '#22c55e';
    case 'down':
      return '#ef4444';
    default:
      return '#6b7280';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f59e0b';
    default:
      return '#3b82f6';
  }
}

// ================================================================
// EMAIL TEMPLATES
// ================================================================

/**
 * Generate weekly digest email
 */
export function generateWeeklyDigest(data: WeeklyDigestData): EmailTemplate {
  const {
    brandName,
    recipientName,
    currentScore,
    previousScore,
    scoreChange,
    scoreTrend,
    categoryScores,
    keyHighlights,
    topRecommendations,
    competitorUpdates,
    newMentions,
    dashboardUrl,
    weekStartDate,
    weekEndDate,
  } = data;

  const subject = `${brandName} AI Perception Report: ${scoreTrend === 'up' ? '📈' : scoreTrend === 'down' ? '📉' : '→'} Score ${currentScore} (${scoreChange >= 0 ? '+' : ''}${scoreChange})`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly AI Perception Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
      <h1 style="color: white; margin: 0 0 10px 0; font-size: 24px;">Weekly AI Perception Report</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">${formatDateRange(weekStartDate, weekEndDate)}</p>
    </div>

    <!-- Greeting -->
    <div style="background-color: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <p style="color: #d1d5db; margin: 0;">Hi ${recipientName},</p>
      <p style="color: #d1d5db; margin: 10px 0 0 0;">Here's your weekly AI perception summary for <strong style="color: white;">${brandName}</strong>.</p>
    </div>

    <!-- Main Score -->
    <div style="background-color: #1f2937; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px;">
      <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase;">AI Perception Score</p>
      <div style="font-size: 64px; font-weight: bold; color: ${getScoreColor(currentScore)}; margin: 0;">
        ${currentScore}
      </div>
      <div style="display: inline-block; padding: 8px 16px; border-radius: 20px; background-color: ${getTrendColor(scoreTrend)}20; color: ${getTrendColor(scoreTrend)}; font-size: 16px; margin-top: 10px;">
        ${getTrendArrow(scoreTrend)} ${Math.abs(scoreChange)} points ${scoreTrend === 'up' ? 'improvement' : scoreTrend === 'down' ? 'decrease' : 'no change'}
      </div>
    </div>

    <!-- Category Breakdown -->
    <div style="background-color: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0 0 20px 0; font-size: 18px;">Category Breakdown</h2>
      ${categoryScores
        .map(
          (cat) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #374151;">
          <span style="color: #d1d5db;">${cat.name}</span>
          <div>
            <span style="color: white; font-weight: 600; margin-right: 8px;">${cat.score}</span>
            <span style="color: ${getTrendColor(cat.trend)}; font-size: 12px;">${getTrendArrow(cat.trend)} ${Math.abs(cat.change)}</span>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <!-- Key Highlights -->
    ${
      keyHighlights.length > 0
        ? `
    <div style="background-color: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Key Highlights</h2>
      ${keyHighlights
        .map(
          (highlight) => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
          <span style="color: #22c55e; margin-right: 10px;">✓</span>
          <span style="color: #d1d5db;">${highlight}</span>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- Top Recommendations -->
    ${
      topRecommendations.length > 0
        ? `
    <div style="background-color: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Top Recommendations</h2>
      ${topRecommendations
        .map(
          (rec) => `
        <div style="background-color: #374151; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; background-color: ${getPriorityColor(rec.priority)}20; color: ${getPriorityColor(rec.priority)};">${rec.priority}</span>
            <span style="color: #9ca3af; font-size: 12px; margin-left: 10px;">${rec.category}</span>
          </div>
          <p style="color: white; margin: 0; font-weight: 500;">${rec.title}</p>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- Competitor Updates -->
    ${
      competitorUpdates && competitorUpdates.length > 0
        ? `
    <div style="background-color: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0 0 15px 0; font-size: 18px;">Competitor Movement</h2>
      ${competitorUpdates
        .map(
          (comp) => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #374151;">
          <span style="color: #d1d5db;">${comp.name}</span>
          <span style="color: #9ca3af;">${comp.change}</span>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- CTA -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Full Report</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; border-top: 1px solid #374151;">
      <p style="color: #6b7280; font-size: 12px; margin: 0 0 10px 0;">
        You're receiving this because you're subscribed to weekly reports for ${brandName}.
      </p>
      <p style="color: #6b7280; font-size: 12px; margin: 0;">
        <a href="${dashboardUrl}/settings" style="color: #6366f1;">Manage preferences</a> ·
        <a href="${dashboardUrl}/unsubscribe" style="color: #6366f1;">Unsubscribe</a>
      </p>
      <p style="color: #4b5563; font-size: 11px; margin: 15px 0 0 0;">
        AI Perception Engineering · Powered by AI Intelligence
      </p>
    </div>

  </div>
</body>
</html>
  `.trim();

  const textContent = `
Weekly AI Perception Report for ${brandName}
${formatDateRange(weekStartDate, weekEndDate)}

Hi ${recipientName},

Here's your weekly AI perception summary for ${brandName}.

AI PERCEPTION SCORE: ${currentScore}
${getTrendArrow(scoreTrend)} ${Math.abs(scoreChange)} points ${scoreTrend === 'up' ? 'improvement' : scoreTrend === 'down' ? 'decrease' : 'no change'}

CATEGORY BREAKDOWN:
${categoryScores.map((cat) => `- ${cat.name}: ${cat.score} (${getTrendArrow(cat.trend)} ${Math.abs(cat.change)})`).join('\n')}

${keyHighlights.length > 0 ? `KEY HIGHLIGHTS:\n${keyHighlights.map((h) => `✓ ${h}`).join('\n')}` : ''}

${topRecommendations.length > 0 ? `TOP RECOMMENDATIONS:\n${topRecommendations.map((r) => `[${r.priority.toUpperCase()}] ${r.title}`).join('\n')}` : ''}

${competitorUpdates && competitorUpdates.length > 0 ? `COMPETITOR MOVEMENT:\n${competitorUpdates.map((c) => `- ${c.name}: ${c.change}`).join('\n')}` : ''}

View your full report: ${dashboardUrl}

---
You're receiving this because you're subscribed to weekly reports for ${brandName}.
Manage preferences: ${dashboardUrl}/settings
Unsubscribe: ${dashboardUrl}/unsubscribe

AI Perception Engineering
  `.trim();

  return {
    subject,
    htmlContent,
    textContent,
  };
}

/**
 * Generate score alert email (for significant changes)
 */
export function generateScoreAlert(data: {
  brandName: string;
  recipientName: string;
  currentScore: number;
  previousScore: number;
  changeType: 'increase' | 'decrease';
  changeAmount: number;
  possibleCauses: string[];
  dashboardUrl: string;
}): EmailTemplate {
  const {
    brandName,
    recipientName,
    currentScore,
    previousScore,
    changeType,
    changeAmount,
    possibleCauses,
    dashboardUrl,
  } = data;

  const isPositive = changeType === 'increase';
  const emoji = isPositive ? '📈' : '🚨';
  const subject = `${emoji} ${brandName}: AI Perception Score ${changeType === 'increase' ? 'jumped' : 'dropped'} ${changeAmount} points`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- Alert Header -->
    <div style="background-color: ${isPositive ? '#22c55e' : '#ef4444'}; border-radius: 12px 12px 0 0; padding: 20px; text-align: center;">
      <span style="font-size: 48px;">${emoji}</span>
      <h1 style="color: white; margin: 10px 0 0 0; font-size: 20px;">
        Score ${changeType === 'increase' ? 'Increase' : 'Decrease'} Alert
      </h1>
    </div>

    <!-- Score Change -->
    <div style="background-color: #1f2937; padding: 30px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px 0;">Your AI Perception Score changed from</p>
      <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
        <span style="font-size: 36px; color: #6b7280;">${previousScore}</span>
        <span style="font-size: 24px; color: ${isPositive ? '#22c55e' : '#ef4444'};">${isPositive ? '→' : '→'}</span>
        <span style="font-size: 48px; font-weight: bold; color: ${getScoreColor(currentScore)};">${currentScore}</span>
      </div>
      <p style="color: ${isPositive ? '#22c55e' : '#ef4444'}; font-size: 18px; margin: 15px 0 0 0;">
        ${isPositive ? '+' : '-'}${changeAmount} points
      </p>
    </div>

    <!-- Possible Causes -->
    ${
      possibleCauses.length > 0
        ? `
    <div style="background-color: #1f2937; border-radius: 0 0 12px 12px; padding: 20px; margin-bottom: 20px;">
      <h2 style="color: white; margin: 0 0 15px 0; font-size: 16px;">Possible Causes</h2>
      ${possibleCauses
        .map(
          (cause) => `
        <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
          <span style="color: #f59e0b; margin-right: 10px;">•</span>
          <span style="color: #d1d5db;">${cause}</span>
        </div>
      `
        )
        .join('')}
    </div>
    `
        : ''
    }

    <!-- CTA -->
    <div style="text-align: center; margin: 20px 0;">
      <a href="${dashboardUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Investigate Now</a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>This is an automated alert from AI Perception Engineering.</p>
    </div>

  </div>
</body>
</html>
  `.trim();

  const textContent = `
${emoji} AI Perception Score Alert for ${brandName}

Hi ${recipientName},

Your AI Perception Score has ${changeType === 'increase' ? 'increased' : 'decreased'} significantly.

Score Change: ${previousScore} → ${currentScore} (${isPositive ? '+' : '-'}${changeAmount} points)

${possibleCauses.length > 0 ? `Possible Causes:\n${possibleCauses.map((c) => `• ${c}`).join('\n')}` : ''}

Investigate now: ${dashboardUrl}

---
This is an automated alert from AI Perception Engineering.
  `.trim();

  return {
    subject,
    htmlContent,
    textContent,
  };
}

/**
 * Generate recommendation complete email
 */
export function generateRecommendationComplete(data: {
  brandName: string;
  recipientName: string;
  recommendationTitle: string;
  category: string;
  projectedImpact: number;
  dashboardUrl: string;
}): EmailTemplate {
  const { brandName, recipientName, recommendationTitle, category, projectedImpact, dashboardUrl } = data;

  const subject = `✅ ${brandName}: Recommendation completed - ${recommendationTitle}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <div style="background-color: #1f2937; border-radius: 12px; padding: 30px; text-align: center;">
      <span style="font-size: 48px;">✅</span>
      <h1 style="color: white; margin: 20px 0 10px 0; font-size: 20px;">Recommendation Completed!</h1>
      <p style="color: #d1d5db; margin: 0 0 20px 0;">${recommendationTitle}</p>

      <div style="background-color: #374151; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="color: #9ca3af; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase;">Projected Impact</p>
        <p style="color: #22c55e; margin: 0; font-size: 24px; font-weight: bold;">+${projectedImpact} points</p>
      </div>

      <p style="color: #9ca3af; font-size: 14px;">
        Great job, ${recipientName}! Your changes should reflect in your next score update.
      </p>

      <a href="${dashboardUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">View Progress</a>
    </div>

    <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
      <p>AI Perception Engineering</p>
    </div>

  </div>
</body>
</html>
  `.trim();

  const textContent = `
✅ Recommendation Completed for ${brandName}

Hi ${recipientName},

You've completed: ${recommendationTitle}
Category: ${category}
Projected Impact: +${projectedImpact} points

Great job! Your changes should reflect in your next score update.

View your progress: ${dashboardUrl}

---
AI Perception Engineering
  `.trim();

  return {
    subject,
    htmlContent,
    textContent,
  };
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateWeeklyDigest,
  generateScoreAlert,
  generateRecommendationComplete,
};
