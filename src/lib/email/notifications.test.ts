/**
 * Email Notifications Tests
 *
 * Phase 2, Week 4, Day 4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendAnalysisCompleteEmail,
  sendScoreChangeEmail,
  sendWeeklyDigestEmail,
  sendMonitoringAlertEmail,
} from './notifications';
import type {
  AnalysisResult,
  ScoreChangeData,
  WeeklyDigestData,
  MonitoringAlertData,
} from './notifications';

// Mock the sendEmail function
vi.mock('../resend', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true, messageId: 'test-id' }),
}));

import { sendEmail } from '../resend';

// ================================================================
// TEST DATA
// ================================================================

const mockAnalysisResult: AnalysisResult = {
  id: 'analysis-123',
  url: 'https://example.com',
  brandName: 'Example Brand',
  overallScore: 75,
  providerScores: [
    { provider: 'openai', score: 78 },
    { provider: 'anthropic', score: 82 },
    { provider: 'google', score: 65 },
  ],
  topRecommendations: [
    { title: 'Improve structured data', priority: 'high' },
    { title: 'Add more citations', priority: 'medium' },
    { title: 'Update FAQ content', priority: 'low' },
  ],
};

const mockScoreChangeData: ScoreChangeData = {
  url: 'https://example.com',
  brandName: 'Example Brand',
  previousScore: 65,
  currentScore: 75,
  change: 10,
  percentChange: 15,
  analysisId: 'analysis-456',
};

const mockWeeklyDigestData: WeeklyDigestData = {
  userName: 'John',
  totalAnalyses: 15,
  averageScore: 72,
  scoreChange: 5,
  topPerformingUrl: {
    url: 'https://best.example.com',
    brandName: 'Best Brand',
    score: 92,
  },
  needsAttentionUrl: {
    url: 'https://low.example.com',
    brandName: 'Low Brand',
    score: 38,
  },
  industryComparison: {
    yourAverage: 72,
    industryAverage: 65,
  },
};

const mockMonitoringAlertData: MonitoringAlertData = {
  brandName: 'Example Brand',
  url: 'https://example.com',
  alertType: 'score_drop',
  message: 'Your score dropped by 15 points in the last 24 hours',
  severity: 'warning',
  analysisId: 'analysis-789',
};

// ================================================================
// ANALYSIS COMPLETE EMAIL TESTS
// ================================================================

describe('sendAnalysisCompleteEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send analysis complete email', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: expect.stringContaining('Analysis Complete'),
        html: expect.any(String),
      })
    );
  });

  it('should include brand name in subject', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Example Brand'),
      })
    );
  });

  it('should include score in subject', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('75/100'),
      })
    );
  });

  it('should include user name in HTML', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Hi John');
  });

  it('should include provider scores in HTML', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('OpenAI (GPT)');
    expect(call.html).toContain('Anthropic (Claude)');
    expect(call.html).toContain('Google (Gemini)');
  });

  it('should include recommendations in HTML', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Improve structured data');
    expect(call.html).toContain('Add more citations');
  });

  it('should handle analysis without recommendations', async () => {
    const analysisNoRecs = { ...mockAnalysisResult, topRecommendations: [] };
    await sendAnalysisCompleteEmail('test@example.com', 'John', analysisNoRecs);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should handle missing user name', async () => {
    await sendAnalysisCompleteEmail('test@example.com', '', mockAnalysisResult);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Hi there');
  });

  it('should include results URL in HTML', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain(`/results/${mockAnalysisResult.id}`);
  });
});

// ================================================================
// SCORE CHANGE EMAIL TESTS
// ================================================================

describe('sendScoreChangeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send score change email', async () => {
    await sendScoreChangeEmail('test@example.com', 'John', mockScoreChangeData);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should indicate improvement in subject for positive change', async () => {
    await sendScoreChangeEmail('test@example.com', 'John', mockScoreChangeData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Improved'),
      })
    );
  });

  it('should indicate alert in subject for negative change', async () => {
    const declineData = { ...mockScoreChangeData, change: -10, percentChange: -13 };
    await sendScoreChangeEmail('test@example.com', 'John', declineData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Alert'),
      })
    );
  });

  it('should include previous and current scores in HTML', async () => {
    await sendScoreChangeEmail('test@example.com', 'John', mockScoreChangeData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('65'); // previous
    expect(call.html).toContain('75'); // current
  });

  it('should include change amount in HTML', async () => {
    await sendScoreChangeEmail('test@example.com', 'John', mockScoreChangeData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('+10 points');
    expect(call.html).toContain('+15%');
  });

  it('should show encouragement for improvement', async () => {
    await sendScoreChangeEmail('test@example.com', 'John', mockScoreChangeData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Great work');
  });

  it('should show warning for decline', async () => {
    const declineData = {
      ...mockScoreChangeData,
      previousScore: 75,
      currentScore: 65,
      change: -10,
      percentChange: -13,
    };
    await sendScoreChangeEmail('test@example.com', 'John', declineData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Attention needed');
  });
});

// ================================================================
// WEEKLY DIGEST EMAIL TESTS
// ================================================================

describe('sendWeeklyDigestEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send weekly digest email', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should include average score in subject', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('72'),
      })
    );
  });

  it('should include user name in HTML', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Hi John');
  });

  it('should include total analyses in HTML', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('15');
  });

  it('should include top performing URL', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Top Performer');
    expect(call.html).toContain('Best Brand');
    expect(call.html).toContain('92');
  });

  it('should include needs attention URL', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Needs Attention');
    expect(call.html).toContain('Low Brand');
  });

  it('should include industry comparison', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Industry Comparison');
    expect(call.html).toContain('65'); // industry avg
  });

  it('should handle minimal data', async () => {
    const minimalData: WeeklyDigestData = {
      userName: 'Jane',
      totalAnalyses: 2,
      averageScore: 50,
      scoreChange: 0,
    };
    await sendWeeklyDigestEmail('test@example.com', minimalData);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should show positive trend emoji for improvements', async () => {
    await sendWeeklyDigestEmail('test@example.com', mockWeeklyDigestData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/📈/),
      })
    );
  });

  it('should show negative trend emoji for declines', async () => {
    const declineData = { ...mockWeeklyDigestData, scoreChange: -5 };
    await sendWeeklyDigestEmail('test@example.com', declineData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/📉/),
      })
    );
  });
});

// ================================================================
// MONITORING ALERT EMAIL TESTS
// ================================================================

describe('sendMonitoringAlertEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should send monitoring alert email', async () => {
    await sendMonitoringAlertEmail(
      'test@example.com',
      'John',
      mockMonitoringAlertData
    );

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should include brand name in subject', async () => {
    await sendMonitoringAlertEmail(
      'test@example.com',
      'John',
      mockMonitoringAlertData
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining('Example Brand'),
      })
    );
  });

  it('should include warning emoji for warning severity', async () => {
    await sendMonitoringAlertEmail(
      'test@example.com',
      'John',
      mockMonitoringAlertData
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/⚠️/),
      })
    );
  });

  it('should include critical emoji for critical severity', async () => {
    const criticalData = { ...mockMonitoringAlertData, severity: 'critical' as const };
    await sendMonitoringAlertEmail('test@example.com', 'John', criticalData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/🚨/),
      })
    );
  });

  it('should include info emoji for info severity', async () => {
    const infoData = { ...mockMonitoringAlertData, severity: 'info' as const };
    await sendMonitoringAlertEmail('test@example.com', 'John', infoData);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringMatching(/ℹ️/),
      })
    );
  });

  it('should include alert message in HTML', async () => {
    await sendMonitoringAlertEmail(
      'test@example.com',
      'John',
      mockMonitoringAlertData
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('Your score dropped by 15 points');
  });

  it('should include results URL in HTML', async () => {
    await sendMonitoringAlertEmail(
      'test@example.com',
      'John',
      mockMonitoringAlertData
    );

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain(`/results/${mockMonitoringAlertData.analysisId}`);
  });
});

// ================================================================
// EDGE CASES
// ================================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle excellent scores (80+)', async () => {
    const excellentAnalysis = { ...mockAnalysisResult, overallScore: 95 };
    await sendAnalysisCompleteEmail('test@example.com', 'John', excellentAnalysis);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('#10B981'); // green color
  });

  it('should handle critical scores (<40)', async () => {
    const lowAnalysis = { ...mockAnalysisResult, overallScore: 25 };
    await sendAnalysisCompleteEmail('test@example.com', 'John', lowAnalysis);

    const call = vi.mocked(sendEmail).mock.calls[0][0];
    expect(call.html).toContain('#EF4444'); // red color
  });

  it('should handle zero score change', async () => {
    const noChangeData = { ...mockScoreChangeData, change: 0, percentChange: 0 };
    await sendScoreChangeEmail('test@example.com', 'John', noChangeData);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should handle empty provider scores', async () => {
    const noProviders = { ...mockAnalysisResult, providerScores: [] };
    await sendAnalysisCompleteEmail('test@example.com', 'John', noProviders);

    expect(sendEmail).toHaveBeenCalledTimes(1);
  });

  it('should include reply-to email', async () => {
    await sendAnalysisCompleteEmail(
      'test@example.com',
      'John',
      mockAnalysisResult
    );

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        replyTo: expect.stringContaining('@'),
      })
    );
  });
});
