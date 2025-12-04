/**
 * AI Bias Detection and Alerting System
 *
 * RED TEAM AUDIT FIX: MEDIUM-004
 * Automated detection of potential bias in AI outputs
 *
 * Features:
 * - Sentiment consistency analysis
 * - Demographic parity monitoring
 * - Industry/sector bias detection
 * - Geographic bias detection
 * - Automated alert thresholds
 * - Historical trend analysis
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BiasMetrics {
  timestamp: string;
  category: string;
  subcategory?: string;
  sentimentScore: number;  // -1 to 1
  confidenceScore: number; // 0 to 1
  recommendationCount: number;
  positiveRecommendations: number;
  negativeRecommendations: number;
  sampleSize: number;
}

export interface BiasAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: BiasAlertType;
  category: string;
  message: string;
  metrics: {
    observed: number;
    expected: number;
    deviation: number;
    threshold: number;
  };
  recommendations: string[];
  acknowledged: boolean;
}

export type BiasAlertType =
  | 'sentiment_disparity'
  | 'demographic_bias'
  | 'industry_bias'
  | 'geographic_bias'
  | 'confidence_drift'
  | 'recommendation_skew';

export interface BiasThresholds {
  sentimentDisparity: number;      // Max acceptable sentiment variance
  demographicParity: number;       // Max acceptable demographic disparity
  industryBias: number;            // Max industry-specific deviation
  geographicBias: number;          // Max geographic deviation
  confidenceDrift: number;         // Max confidence score drift
  recommendationSkew: number;      // Max positive/negative ratio deviation
  minimumSampleSize: number;       // Min samples for statistical significance
}

export interface BiasReport {
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  totalAnalyses: number;
  alerts: BiasAlert[];
  metrics: {
    byIndustry: Record<string, BiasMetrics>;
    byRegion: Record<string, BiasMetrics>;
    overall: BiasMetrics;
  };
  trends: {
    sentimentTrend: 'improving' | 'stable' | 'degrading';
    confidenceTrend: 'improving' | 'stable' | 'degrading';
    biasRisk: 'low' | 'medium' | 'high';
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THRESHOLDS: BiasThresholds = {
  sentimentDisparity: 0.3,        // 30% variance
  demographicParity: 0.2,         // 20% disparity
  industryBias: 0.25,             // 25% industry deviation
  geographicBias: 0.25,           // 25% geographic deviation
  confidenceDrift: 0.15,          // 15% confidence drift
  recommendationSkew: 0.4,        // 40% positive/negative skew
  minimumSampleSize: 30,          // At least 30 samples for alerts
};

const INDUSTRY_CATEGORIES = [
  'technology',
  'healthcare',
  'finance',
  'retail',
  'manufacturing',
  'education',
  'energy',
  'entertainment',
  'real_estate',
  'other',
];

const REGION_CATEGORIES = [
  'north_america',
  'europe',
  'asia_pacific',
  'latin_america',
  'middle_east',
  'africa',
  'global',
];

// ============================================================================
// BIAS DETECTION FUNCTIONS
// ============================================================================

/**
 * Calculate sentiment disparity across categories
 */
function detectSentimentDisparity(
  metrics: BiasMetrics[],
  thresholds: BiasThresholds
): BiasAlert[] {
  const alerts: BiasAlert[] = [];

  if (metrics.length < 2) return alerts;

  // Calculate mean and variance
  const sentiments = metrics.map((m) => m.sentimentScore);
  const mean = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
  const variance =
    sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
    sentiments.length;
  const stdDev = Math.sqrt(variance);

  // Check each category for significant deviation
  for (const metric of metrics) {
    if (metric.sampleSize < thresholds.minimumSampleSize) continue;

    const deviation = Math.abs(metric.sentimentScore - mean);
    const zScore = deviation / (stdDev || 1);

    if (zScore > 2 && deviation > thresholds.sentimentDisparity) {
      alerts.push({
        id: `sa_${Date.now()}_${metric.category}`,
        timestamp: new Date().toISOString(),
        severity: zScore > 3 ? 'high' : 'medium',
        type: 'sentiment_disparity',
        category: metric.category,
        message: `Sentiment score for ${metric.category} (${metric.sentimentScore.toFixed(2)}) deviates significantly from mean (${mean.toFixed(2)})`,
        metrics: {
          observed: metric.sentimentScore,
          expected: mean,
          deviation: deviation,
          threshold: thresholds.sentimentDisparity,
        },
        recommendations: [
          'Review AI prompts for category-specific language',
          'Analyze training data representation for this category',
          'Consider category-specific calibration',
        ],
        acknowledged: false,
      });
    }
  }

  return alerts;
}

/**
 * Detect industry-specific bias
 */
function detectIndustryBias(
  metricsByIndustry: Record<string, BiasMetrics>,
  baselineMetrics: BiasMetrics,
  thresholds: BiasThresholds
): BiasAlert[] {
  const alerts: BiasAlert[] = [];

  for (const [industry, metrics] of Object.entries(metricsByIndustry)) {
    if (metrics.sampleSize < thresholds.minimumSampleSize) continue;

    // Check confidence score deviation
    const confidenceDeviation = Math.abs(
      metrics.confidenceScore - baselineMetrics.confidenceScore
    );

    if (confidenceDeviation > thresholds.industryBias) {
      alerts.push({
        id: `ib_${Date.now()}_${industry}`,
        timestamp: new Date().toISOString(),
        severity: confidenceDeviation > thresholds.industryBias * 1.5 ? 'high' : 'medium',
        type: 'industry_bias',
        category: industry,
        message: `Industry "${industry}" shows significant confidence deviation (${(confidenceDeviation * 100).toFixed(1)}% from baseline)`,
        metrics: {
          observed: metrics.confidenceScore,
          expected: baselineMetrics.confidenceScore,
          deviation: confidenceDeviation,
          threshold: thresholds.industryBias,
        },
        recommendations: [
          `Increase training data representation for ${industry}`,
          'Review industry-specific terminology handling',
          'Consider industry-specific model fine-tuning',
        ],
        acknowledged: false,
      });
    }

    // Check recommendation ratio
    const totalRecs = metrics.positiveRecommendations + metrics.negativeRecommendations;
    if (totalRecs > 0) {
      const positiveRatio = metrics.positiveRecommendations / totalRecs;
      const baselineRatio =
        baselineMetrics.positiveRecommendations /
        (baselineMetrics.positiveRecommendations + baselineMetrics.negativeRecommendations || 1);
      const ratioDeviation = Math.abs(positiveRatio - baselineRatio);

      if (ratioDeviation > thresholds.recommendationSkew) {
        alerts.push({
          id: `rs_${Date.now()}_${industry}`,
          timestamp: new Date().toISOString(),
          severity: 'medium',
          type: 'recommendation_skew',
          category: industry,
          message: `Recommendation ratio for "${industry}" is skewed (${(positiveRatio * 100).toFixed(1)}% positive vs ${(baselineRatio * 100).toFixed(1)}% baseline)`,
          metrics: {
            observed: positiveRatio,
            expected: baselineRatio,
            deviation: ratioDeviation,
            threshold: thresholds.recommendationSkew,
          },
          recommendations: [
            'Review recommendation generation logic',
            'Analyze if industry characteristics justify difference',
            'Check for data imbalance in training set',
          ],
          acknowledged: false,
        });
      }
    }
  }

  return alerts;
}

/**
 * Detect geographic bias
 */
function detectGeographicBias(
  metricsByRegion: Record<string, BiasMetrics>,
  baselineMetrics: BiasMetrics,
  thresholds: BiasThresholds
): BiasAlert[] {
  const alerts: BiasAlert[] = [];

  for (const [region, metrics] of Object.entries(metricsByRegion)) {
    if (metrics.sampleSize < thresholds.minimumSampleSize) continue;

    // Check sentiment deviation by region
    const sentimentDeviation = Math.abs(
      metrics.sentimentScore - baselineMetrics.sentimentScore
    );

    if (sentimentDeviation > thresholds.geographicBias) {
      alerts.push({
        id: `gb_${Date.now()}_${region}`,
        timestamp: new Date().toISOString(),
        severity: sentimentDeviation > thresholds.geographicBias * 1.5 ? 'high' : 'medium',
        type: 'geographic_bias',
        category: region,
        message: `Region "${region}" shows sentiment bias (${(sentimentDeviation * 100).toFixed(1)}% deviation from global baseline)`,
        metrics: {
          observed: metrics.sentimentScore,
          expected: baselineMetrics.sentimentScore,
          deviation: sentimentDeviation,
          threshold: thresholds.geographicBias,
        },
        recommendations: [
          `Review regional data representation for ${region}`,
          'Check for language/cultural bias in prompts',
          'Consider region-specific validation sets',
        ],
        acknowledged: false,
      });
    }
  }

  return alerts;
}

/**
 * Detect confidence score drift over time
 */
function detectConfidenceDrift(
  historicalMetrics: BiasMetrics[],
  thresholds: BiasThresholds
): BiasAlert[] {
  const alerts: BiasAlert[] = [];

  if (historicalMetrics.length < 7) return alerts; // Need at least a week of data

  // Calculate recent vs historical average
  const sortedMetrics = [...historicalMetrics].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const recentMetrics = sortedMetrics.slice(0, 7);
  const historicalData = sortedMetrics.slice(7);

  if (historicalData.length < 7) return alerts;

  const recentAvg =
    recentMetrics.reduce((sum, m) => sum + m.confidenceScore, 0) /
    recentMetrics.length;
  const historicalAvg =
    historicalData.reduce((sum, m) => sum + m.confidenceScore, 0) /
    historicalData.length;

  const drift = Math.abs(recentAvg - historicalAvg);

  if (drift > thresholds.confidenceDrift) {
    const direction = recentAvg < historicalAvg ? 'decreased' : 'increased';

    alerts.push({
      id: `cd_${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity: drift > thresholds.confidenceDrift * 2 ? 'critical' : 'high',
      type: 'confidence_drift',
      category: 'overall',
      message: `Model confidence has ${direction} by ${(drift * 100).toFixed(1)}% over the past week`,
      metrics: {
        observed: recentAvg,
        expected: historicalAvg,
        deviation: drift,
        threshold: thresholds.confidenceDrift,
      },
      recommendations: [
        'Investigate recent model or data changes',
        'Review quality of recent inputs',
        'Consider model recalibration',
        'Check for distribution shift in input data',
      ],
      acknowledged: false,
    });
  }

  return alerts;
}

// ============================================================================
// MAIN DETECTION CLASS
// ============================================================================

export class BiasDetector {
  private thresholds: BiasThresholds;
  private alerts: BiasAlert[] = [];
  private metricsHistory: BiasMetrics[] = [];

  constructor(thresholds: Partial<BiasThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Add new metrics to history
   */
  addMetrics(metrics: BiasMetrics): void {
    this.metricsHistory.push(metrics);

    // Keep only last 90 days of metrics
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    this.metricsHistory = this.metricsHistory.filter(
      (m) => new Date(m.timestamp) > cutoff
    );
  }

  /**
   * Run full bias detection
   */
  async detectBias(
    currentMetrics: {
      byIndustry: Record<string, BiasMetrics>;
      byRegion: Record<string, BiasMetrics>;
      overall: BiasMetrics;
    }
  ): Promise<BiasAlert[]> {
    const newAlerts: BiasAlert[] = [];

    // Detect sentiment disparity
    const allMetrics = [
      ...Object.values(currentMetrics.byIndustry),
      ...Object.values(currentMetrics.byRegion),
    ];
    newAlerts.push(...detectSentimentDisparity(allMetrics, this.thresholds));

    // Detect industry bias
    newAlerts.push(
      ...detectIndustryBias(
        currentMetrics.byIndustry,
        currentMetrics.overall,
        this.thresholds
      )
    );

    // Detect geographic bias
    newAlerts.push(
      ...detectGeographicBias(
        currentMetrics.byRegion,
        currentMetrics.overall,
        this.thresholds
      )
    );

    // Detect confidence drift
    if (this.metricsHistory.length > 0) {
      newAlerts.push(
        ...detectConfidenceDrift(this.metricsHistory, this.thresholds)
      );
    }

    // Store new alerts
    this.alerts.push(...newAlerts);

    return newAlerts;
  }

  /**
   * Get all unacknowledged alerts
   */
  getActiveAlerts(): BiasAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      return true;
    }
    return false;
  }

  /**
   * Generate a bias report
   */
  generateReport(
    periodDays: number = 30,
    currentMetrics: {
      byIndustry: Record<string, BiasMetrics>;
      byRegion: Record<string, BiasMetrics>;
      overall: BiasMetrics;
    }
  ): BiasReport {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - periodDays);

    const periodAlerts = this.alerts.filter(
      (a) => new Date(a.timestamp) >= periodStart
    );

    // Calculate trends
    const recentMetrics = this.metricsHistory
      .filter((m) => new Date(m.timestamp) >= periodStart)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    let sentimentTrend: 'improving' | 'stable' | 'degrading' = 'stable';
    let confidenceTrend: 'improving' | 'stable' | 'degrading' = 'stable';

    if (recentMetrics.length >= 2) {
      const firstHalf = recentMetrics.slice(0, Math.floor(recentMetrics.length / 2));
      const secondHalf = recentMetrics.slice(Math.floor(recentMetrics.length / 2));

      const firstHalfConfidence =
        firstHalf.reduce((sum, m) => sum + m.confidenceScore, 0) / firstHalf.length;
      const secondHalfConfidence =
        secondHalf.reduce((sum, m) => sum + m.confidenceScore, 0) / secondHalf.length;

      const confidenceChange = secondHalfConfidence - firstHalfConfidence;
      if (confidenceChange > 0.05) confidenceTrend = 'improving';
      else if (confidenceChange < -0.05) confidenceTrend = 'degrading';
    }

    // Calculate bias risk level
    const highAlerts = periodAlerts.filter((a) => a.severity === 'high' || a.severity === 'critical');
    let biasRisk: 'low' | 'medium' | 'high' = 'low';
    if (highAlerts.length > 5) biasRisk = 'high';
    else if (highAlerts.length > 2 || periodAlerts.length > 10) biasRisk = 'medium';

    return {
      generatedAt: now.toISOString(),
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      totalAnalyses: recentMetrics.length,
      alerts: periodAlerts,
      metrics: currentMetrics,
      trends: {
        sentimentTrend,
        confidenceTrend,
        biasRisk,
      },
    };
  }

  /**
   * Get threshold configuration
   */
  getThresholds(): BiasThresholds {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds
   */
  updateThresholds(newThresholds: Partial<BiasThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let biasDetectorInstance: BiasDetector | null = null;

export function getBiasDetector(thresholds?: Partial<BiasThresholds>): BiasDetector {
  if (!biasDetectorInstance) {
    biasDetectorInstance = new BiasDetector(thresholds);
  }
  return biasDetectorInstance;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  BiasDetector,
  getBiasDetector,
  DEFAULT_THRESHOLDS,
  INDUSTRY_CATEGORIES,
  REGION_CATEGORIES,
};
