/**
 * Crisis Detection System
 *
 * Phase 2, Week 3, Day 5
 * Monitors AI perception for potential reputation crises
 */

// ================================================================
// TYPES
// ================================================================

export type CrisisSeverity = 'low' | 'medium' | 'high' | 'critical';
export type CrisisCategory =
  | 'negative_sentiment'
  | 'misinformation'
  | 'competitor_attack'
  | 'visibility_drop'
  | 'hallucination'
  | 'controversy'
  | 'brand_confusion'
  | 'outdated_info';

export interface CrisisIndicator {
  category: CrisisCategory;
  severity: CrisisSeverity;
  score: number; // 0-100
  confidence: number; // 0-1
  description: string;
  evidence: string[];
  affectedProviders: string[];
  detectedAt: Date;
}

export interface CrisisAlert {
  id: string;
  brandName: string;
  analysisId: string;
  indicators: CrisisIndicator[];
  overallSeverity: CrisisSeverity;
  overallScore: number;
  summary: string;
  recommendedActions: string[];
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrisisThresholds {
  sentimentThreshold: number; // Below this = concern
  visibilityDropThreshold: number; // % drop that triggers alert
  misinformationConfidence: number; // Confidence level for misinformation
  mentionPositionThreshold: number; // Position in list that's concerning
  competitorMentionRatio: number; // Competitor mentions vs brand
}

export interface CrisisDetectionResult {
  hasCrisis: boolean;
  indicators: CrisisIndicator[];
  overallSeverity: CrisisSeverity;
  overallScore: number;
  summary: string;
  recommendedActions: string[];
}

export interface AnalysisData {
  brandName: string;
  analysisId: string;
  overallScore: number;
  previousScore?: number;
  providerScores: Record<string, number>;
  sentimentScores: Record<string, number>;
  mentionPositions: Record<string, number | null>;
  competitorMentions: Record<string, string[]>;
  detectedMisinformation: Array<{
    claim: string;
    provider: string;
    confidence: number;
  }>;
  hallucinations: Array<{
    type: string;
    content: string;
    provider: string;
  }>;
}

// ================================================================
// CONSTANTS
// ================================================================

const DEFAULT_THRESHOLDS: CrisisThresholds = {
  sentimentThreshold: -0.3,
  visibilityDropThreshold: 20,
  misinformationConfidence: 0.7,
  mentionPositionThreshold: 5,
  competitorMentionRatio: 2,
};

const SEVERITY_SCORES: Record<CrisisSeverity, { min: number; max: number }> = {
  low: { min: 0, max: 25 },
  medium: { min: 26, max: 50 },
  high: { min: 51, max: 75 },
  critical: { min: 76, max: 100 },
};

const CATEGORY_WEIGHTS: Record<CrisisCategory, number> = {
  misinformation: 1.5,
  hallucination: 1.4,
  controversy: 1.3,
  competitor_attack: 1.2,
  negative_sentiment: 1.1,
  visibility_drop: 1.0,
  brand_confusion: 0.9,
  outdated_info: 0.8,
};

// ================================================================
// CRISIS DETECTOR CLASS
// ================================================================

export class CrisisDetector {
  private thresholds: CrisisThresholds;

  constructor(thresholds: Partial<CrisisThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  // ================================================================
  // MAIN DETECTION
  // ================================================================

  detect(data: AnalysisData): CrisisDetectionResult {
    const indicators: CrisisIndicator[] = [];

    // Run all detection checks
    this.detectNegativeSentiment(data, indicators);
    this.detectVisibilityDrop(data, indicators);
    this.detectMisinformation(data, indicators);
    this.detectHallucinations(data, indicators);
    this.detectCompetitorAttack(data, indicators);
    this.detectBrandConfusion(data, indicators);
    this.detectOutdatedInfo(data, indicators);
    this.detectControversy(data, indicators);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(indicators);
    const overallSeverity = this.scoreToSeverity(overallScore);

    // Generate summary and actions
    const summary = this.generateSummary(data.brandName, indicators, overallSeverity);
    const recommendedActions = this.generateRecommendedActions(indicators);

    return {
      hasCrisis: indicators.length > 0 && overallScore >= 25,
      indicators,
      overallSeverity,
      overallScore,
      summary,
      recommendedActions,
    };
  }

  // ================================================================
  // DETECTION METHODS
  // ================================================================

  private detectNegativeSentiment(
    data: AnalysisData,
    indicators: CrisisIndicator[]
  ): void {
    const negativeSentiments: string[] = [];
    const affectedProviders: string[] = [];
    let worstSentiment = 0;

    for (const [provider, sentiment] of Object.entries(data.sentimentScores)) {
      if (sentiment < this.thresholds.sentimentThreshold) {
        negativeSentiments.push(`${provider}: ${sentiment.toFixed(2)}`);
        affectedProviders.push(provider);
        worstSentiment = Math.min(worstSentiment, sentiment);
      }
    }

    if (negativeSentiments.length > 0) {
      const score = Math.abs(worstSentiment) * 100;
      indicators.push({
        category: 'negative_sentiment',
        severity: this.scoreToSeverity(score),
        score,
        confidence: 0.85,
        description: `Negative sentiment detected across ${affectedProviders.length} AI provider(s)`,
        evidence: negativeSentiments,
        affectedProviders,
        detectedAt: new Date(),
      });
    }
  }

  private detectVisibilityDrop(
    data: AnalysisData,
    indicators: CrisisIndicator[]
  ): void {
    if (data.previousScore === undefined) return;

    const drop = data.previousScore - data.overallScore;
    if (drop >= this.thresholds.visibilityDropThreshold) {
      const score = Math.min(drop * 2, 100);
      indicators.push({
        category: 'visibility_drop',
        severity: this.scoreToSeverity(score),
        score,
        confidence: 0.95,
        description: `AI visibility dropped ${drop} points from previous analysis`,
        evidence: [
          `Previous score: ${data.previousScore}`,
          `Current score: ${data.overallScore}`,
          `Drop: ${drop} points (${((drop / data.previousScore) * 100).toFixed(1)}%)`,
        ],
        affectedProviders: Object.keys(data.providerScores),
        detectedAt: new Date(),
      });
    }
  }

  private detectMisinformation(
    data: AnalysisData,
    indicators: CrisisIndicator[]
  ): void {
    const highConfidenceMisinfo = data.detectedMisinformation.filter(
      (m) => m.confidence >= this.thresholds.misinformationConfidence
    );

    if (highConfidenceMisinfo.length > 0) {
      const avgConfidence =
        highConfidenceMisinfo.reduce((sum, m) => sum + m.confidence, 0) /
        highConfidenceMisinfo.length;
      const score = avgConfidence * 100;
      const affectedProviders = [...new Set(highConfidenceMisinfo.map((m) => m.provider))];

      indicators.push({
        category: 'misinformation',
        severity: this.scoreToSeverity(score * 1.5), // Weight misinformation higher
        score: score * 1.5,
        confidence: avgConfidence,
        description: `${highConfidenceMisinfo.length} instance(s) of potential misinformation detected`,
        evidence: highConfidenceMisinfo.map((m) => `[${m.provider}] "${m.claim}"`),
        affectedProviders,
        detectedAt: new Date(),
      });
    }
  }

  private detectHallucinations(
    data: AnalysisData,
    indicators: CrisisIndicator[]
  ): void {
    if (data.hallucinations.length > 0) {
      const affectedProviders = [...new Set(data.hallucinations.map((h) => h.provider))];
      const score = Math.min(data.hallucinations.length * 25, 100);

      indicators.push({
        category: 'hallucination',
        severity: this.scoreToSeverity(score),
        score,
        confidence: 0.75,
        description: `${data.hallucinations.length} AI hallucination(s) detected about your brand`,
        evidence: data.hallucinations.map(
          (h) => `[${h.provider}] ${h.type}: "${h.content.substring(0, 100)}..."`
        ),
        affectedProviders,
        detectedAt: new Date(),
      });
    }
  }

  private detectCompetitorAttack(
    data: AnalysisData,
    indicators: CrisisIndicator[]
  ): void {
    const competitorAnalysis: string[] = [];
    let concerningPatterns = 0;

    for (const [provider, competitors] of Object.entries(data.competitorMentions)) {
      const position = data.mentionPositions[provider];
      if (position === null) {
        // Brand not mentioned but competitors are
        if (competitors.length > 0) {
          concerningPatterns++;
          competitorAnalysis.push(
            `[${provider}] Brand not mentioned, but ${competitors.length} competitors listed: ${competitors.slice(0, 3).join(', ')}`
          );
        }
      } else if (position > this.thresholds.mentionPositionThreshold) {
        // Brand mentioned late
        if (competitors.length > 0) {
          concerningPatterns++;
          competitorAnalysis.push(
            `[${provider}] Brand at position ${position}, competitors leading: ${competitors[0]}`
          );
        }
      }
    }

    if (concerningPatterns >= 2) {
      const score = concerningPatterns * 30;
      indicators.push({
        category: 'competitor_attack',
        severity: this.scoreToSeverity(score),
        score,
        confidence: 0.7,
        description: 'Competitors consistently outranking brand across AI providers',
        evidence: competitorAnalysis,
        affectedProviders: Object.keys(data.competitorMentions),
        detectedAt: new Date(),
      });
    }
  }

  private detectBrandConfusion(
    _data: AnalysisData,
    _indicators: CrisisIndicator[]
  ): void {
    // TODO: Implement brand confusion detection
    // This would analyze if AI providers confuse the brand with similar names
    // or attribute incorrect products/services to the brand
  }

  private detectOutdatedInfo(
    _data: AnalysisData,
    _indicators: CrisisIndicator[]
  ): void {
    // TODO: Implement outdated info detection
    // This would check if AI responses contain outdated information
    // about products, leadership, locations, etc.
  }

  private detectControversy(
    _data: AnalysisData,
    _indicators: CrisisIndicator[]
  ): void {
    // TODO: Implement controversy detection
    // This would scan for mentions of controversies, lawsuits,
    // scandals, or other negative news associated with the brand
  }

  // ================================================================
  // SCORING & SEVERITY
  // ================================================================

  private calculateOverallScore(indicators: CrisisIndicator[]): number {
    if (indicators.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const indicator of indicators) {
      const weight = CATEGORY_WEIGHTS[indicator.category] * indicator.confidence;
      weightedSum += indicator.score * weight;
      totalWeight += weight;
    }

    return Math.min(Math.round(weightedSum / totalWeight), 100);
  }

  private scoreToSeverity(score: number): CrisisSeverity {
    if (score >= SEVERITY_SCORES.critical.min) return 'critical';
    if (score >= SEVERITY_SCORES.high.min) return 'high';
    if (score >= SEVERITY_SCORES.medium.min) return 'medium';
    return 'low';
  }

  // ================================================================
  // SUMMARY & ACTIONS
  // ================================================================

  private generateSummary(
    brandName: string,
    indicators: CrisisIndicator[],
    severity: CrisisSeverity
  ): string {
    if (indicators.length === 0) {
      return `No reputation concerns detected for ${brandName} at this time.`;
    }

    const severityText: Record<CrisisSeverity, string> = {
      low: 'minor concerns',
      medium: 'moderate concerns',
      high: 'significant concerns',
      critical: 'critical issues requiring immediate attention',
    };

    const categories = [...new Set(indicators.map((i) => i.category))];
    const categoryNames = categories
      .map((c) => c.replace(/_/g, ' '))
      .join(', ');

    return `${brandName} has ${severityText[severity]} related to: ${categoryNames}. ${indicators.length} indicator(s) detected across ${[...new Set(indicators.flatMap((i) => i.affectedProviders))].length} AI provider(s).`;
  }

  private generateRecommendedActions(indicators: CrisisIndicator[]): string[] {
    const actions: string[] = [];
    const categories = new Set(indicators.map((i) => i.category));

    // General actions
    if (indicators.some((i) => i.severity === 'critical' || i.severity === 'high')) {
      actions.push('Escalate to communications team immediately');
      actions.push('Prepare crisis communication statement');
    }

    // Category-specific actions
    if (categories.has('negative_sentiment')) {
      actions.push('Review recent press coverage and social media mentions');
      actions.push('Identify root cause of negative perception');
      actions.push('Develop positive content strategy to improve sentiment');
    }

    if (categories.has('misinformation')) {
      actions.push('Document specific misinformation claims with evidence');
      actions.push('Submit correction requests to AI providers');
      actions.push('Publish authoritative content addressing false claims');
      actions.push('Consider legal review if misinformation is damaging');
    }

    if (categories.has('hallucination')) {
      actions.push('Document hallucinations with screenshots');
      actions.push('Report factual errors to AI provider feedback channels');
      actions.push('Strengthen structured data on website (Schema.org)');
    }

    if (categories.has('visibility_drop')) {
      actions.push('Analyze recent website and content changes');
      actions.push('Review competitor activities');
      actions.push('Audit Schema.org markup and knowledge graph presence');
      actions.push('Check for technical SEO issues');
    }

    if (categories.has('competitor_attack')) {
      actions.push('Conduct competitive analysis');
      actions.push('Identify differentiation opportunities');
      actions.push('Strengthen brand authority signals');
    }

    // Always include monitoring action
    actions.push('Schedule follow-up analysis in 48-72 hours to track changes');

    return [...new Set(actions)]; // Remove duplicates
  }
}

// ================================================================
// ALERT MANAGER
// ================================================================

export class CrisisAlertManager {
  private alerts: Map<string, CrisisAlert> = new Map();
  private listeners: Array<(alert: CrisisAlert) => void> = [];

  createAlert(
    data: AnalysisData,
    detection: CrisisDetectionResult
  ): CrisisAlert | null {
    if (!detection.hasCrisis) return null;

    const alert: CrisisAlert = {
      id: `crisis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brandName: data.brandName,
      analysisId: data.analysisId,
      indicators: detection.indicators,
      overallSeverity: detection.overallSeverity,
      overallScore: detection.overallScore,
      summary: detection.summary,
      recommendedActions: detection.recommendedActions,
      isAcknowledged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.alerts.set(alert.id, alert);
    this.notifyListeners(alert);

    return alert;
  }

  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;
    alert.updatedAt = new Date();

    return true;
  }

  getAlert(alertId: string): CrisisAlert | undefined {
    return this.alerts.get(alertId);
  }

  getActiveAlerts(): CrisisAlert[] {
    return Array.from(this.alerts.values()).filter((a) => !a.isAcknowledged);
  }

  onAlert(listener: (alert: CrisisAlert) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) this.listeners.splice(index, 1);
    };
  }

  private notifyListeners(alert: CrisisAlert): void {
    this.listeners.forEach((listener) => listener(alert));
  }
}

// ================================================================
// SINGLETON INSTANCES
// ================================================================

let detector: CrisisDetector | null = null;
let alertManager: CrisisAlertManager | null = null;

export function getCrisisDetector(
  thresholds?: Partial<CrisisThresholds>
): CrisisDetector {
  if (!detector) {
    detector = new CrisisDetector(thresholds);
  }
  return detector;
}

export function getCrisisAlertManager(): CrisisAlertManager {
  if (!alertManager) {
    alertManager = new CrisisAlertManager();
  }
  return alertManager;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

export function detectCrisis(data: AnalysisData): CrisisDetectionResult {
  return getCrisisDetector().detect(data);
}

export function createCrisisAlert(
  data: AnalysisData,
  detection: CrisisDetectionResult
): CrisisAlert | null {
  return getCrisisAlertManager().createAlert(data, detection);
}
