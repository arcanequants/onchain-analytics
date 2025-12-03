/**
 * Response Drift Detection
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Detect semantic drift over time
 * - Monitor response distribution changes
 * - Alert on significant model behavior changes
 * - Track provider-specific drift patterns
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ResponseSnapshot {
  id: string;
  timestamp: Date;
  provider: string;
  query: string;
  queryHash: string;
  response: string;
  score?: number;
  sentiment: number;
  tokens: number;
  keyTerms: string[];
  structure: ResponseStructure;
}

export interface ResponseStructure {
  wordCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  paragraphCount: number;
  hasList: boolean;
  hasNumbers: boolean;
  hasQuotes: boolean;
}

export type DriftType =
  | 'semantic'       // Meaning/content changed
  | 'sentiment'      // Tone changed
  | 'structural'     // Format changed
  | 'score'          // Numeric scores changed
  | 'vocabulary'     // Word usage changed
  | 'length';        // Response length changed

export interface DriftSignal {
  type: DriftType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  baseline: number;
  current: number;
  changePercent: number;
  confidence: number;
  description: string;
}

export interface DriftAnalysis {
  queryHash: string;
  provider: string;
  period: {
    baseline: { start: Date; end: Date };
    current: { start: Date; end: Date };
  };
  signals: DriftSignal[];
  overallDriftScore: number;  // 0-100, higher = more drift
  driftDetected: boolean;
  driftSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

export interface DriftAlert {
  id: string;
  timestamp: Date;
  provider: string;
  queryHash: string;
  signals: DriftSignal[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  acknowledged: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const DRIFT_THRESHOLDS = {
  semantic: {
    low: 0.15,
    medium: 0.25,
    high: 0.35,
    critical: 0.50,
  },
  sentiment: {
    low: 0.10,
    medium: 0.20,
    high: 0.30,
    critical: 0.50,
  },
  score: {
    low: 5,       // Points difference
    medium: 10,
    high: 15,
    critical: 25,
  },
  length: {
    low: 0.15,    // Percentage change
    medium: 0.30,
    high: 0.50,
    critical: 1.00,
  },
  vocabulary: {
    low: 0.20,
    medium: 0.35,
    high: 0.50,
    critical: 0.70,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate hash for query normalization
 */
export function hashQuery(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  // Simple hash - in production use proper hashing
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `q_${Math.abs(hash).toString(36)}`;
}

/**
 * Extract key terms from text
 */
function extractKeyTerms(text: string): string[] {
  const stopwords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'and', 'or', 'but', 'in', 'on', 'at',
    'to', 'for', 'of', 'with', 'by', 'from', 'this', 'that', 'these', 'those',
    'it', 'its', 'as', 'so', 'than', 'very', 'just', 'also', 'now',
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));

  // Get unique terms sorted by frequency
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([term]) => term);
}

/**
 * Analyze response structure
 */
function analyzeStructure(text: string): ResponseStructure {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : 0,
    paragraphCount: paragraphs.length,
    hasList: /^\s*[-*•]\s/m.test(text) || /^\s*\d+[.)]\s/m.test(text),
    hasNumbers: /\b\d+(?:\.\d+)?%?\b/.test(text),
    hasQuotes: /"[^"]+"/.test(text) || /'[^']+'/.test(text),
  };
}

/**
 * Simple sentiment score
 */
function calculateSentiment(text: string): number {
  const positive = ['good', 'great', 'excellent', 'best', 'recommend', 'amazing', 'wonderful', 'strong', 'positive'];
  const negative = ['bad', 'poor', 'worst', 'terrible', 'avoid', 'weak', 'negative', 'disappointing', 'fail'];

  const words = text.toLowerCase().split(/\s+/);
  let score = 0;

  for (const word of words) {
    if (positive.some(p => word.includes(p))) score += 0.1;
    if (negative.some(n => word.includes(n))) score -= 0.1;
  }

  return Math.max(-1, Math.min(1, score));
}

/**
 * Jaccard similarity between term sets
 */
function termSimilarity(terms1: string[], terms2: string[]): number {
  const set1 = new Set(terms1);
  const set2 = new Set(terms2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 1;
}

// ============================================================================
// SNAPSHOT MANAGEMENT
// ============================================================================

// In-memory storage (would be database in production)
const snapshots: ResponseSnapshot[] = [];
const MAX_SNAPSHOTS = 10000;

/**
 * Create a snapshot from a response
 */
export function createSnapshot(
  provider: string,
  query: string,
  response: string,
  score?: number
): ResponseSnapshot {
  const snapshot: ResponseSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    provider,
    query,
    queryHash: hashQuery(query),
    response,
    score,
    sentiment: calculateSentiment(response),
    tokens: response.split(/\s+/).length,
    keyTerms: extractKeyTerms(response),
    structure: analyzeStructure(response),
  };

  snapshots.push(snapshot);

  // Trim old snapshots
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.splice(0, snapshots.length - MAX_SNAPSHOTS);
  }

  return snapshot;
}

/**
 * Get snapshots for a query
 */
export function getSnapshots(
  queryHash: string,
  provider?: string,
  since?: Date
): ResponseSnapshot[] {
  return snapshots.filter(s =>
    s.queryHash === queryHash &&
    (!provider || s.provider === provider) &&
    (!since || s.timestamp >= since)
  );
}

// ============================================================================
// DRIFT DETECTION
// ============================================================================

/**
 * Calculate mean of numbers
 */
function mean(values: number[]): number {
  return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

/**
 * Detect drift between baseline and current snapshots
 */
export function detectDrift(
  queryHash: string,
  provider: string,
  baselinePeriod: { start: Date; end: Date },
  currentPeriod: { start: Date; end: Date }
): DriftAnalysis {
  const baseline = snapshots.filter(s =>
    s.queryHash === queryHash &&
    s.provider === provider &&
    s.timestamp >= baselinePeriod.start &&
    s.timestamp <= baselinePeriod.end
  );

  const current = snapshots.filter(s =>
    s.queryHash === queryHash &&
    s.provider === provider &&
    s.timestamp >= currentPeriod.start &&
    s.timestamp <= currentPeriod.end
  );

  const signals: DriftSignal[] = [];

  if (baseline.length < 2 || current.length < 2) {
    return {
      queryHash,
      provider,
      period: { baseline: baselinePeriod, current: currentPeriod },
      signals: [],
      overallDriftScore: 0,
      driftDetected: false,
      driftSeverity: 'none',
      recommendations: ['Insufficient data for drift analysis. Need at least 2 samples per period.'],
    };
  }

  // 1. Semantic Drift (key term similarity)
  const baselineTerms = baseline.flatMap(s => s.keyTerms);
  const currentTerms = current.flatMap(s => s.keyTerms);
  const termDrift = 1 - termSimilarity(baselineTerms, currentTerms);

  if (termDrift > DRIFT_THRESHOLDS.semantic.low) {
    signals.push({
      type: 'semantic',
      severity: getSeverity(termDrift, DRIFT_THRESHOLDS.semantic),
      metric: 'key_term_similarity',
      baseline: 1,
      current: 1 - termDrift,
      changePercent: termDrift * 100,
      confidence: Math.min(baseline.length, current.length) / 10,
      description: `Key vocabulary has changed by ${(termDrift * 100).toFixed(1)}%`,
    });
  }

  // 2. Sentiment Drift
  const baselineSentiment = mean(baseline.map(s => s.sentiment));
  const currentSentiment = mean(current.map(s => s.sentiment));
  const sentimentDrift = Math.abs(currentSentiment - baselineSentiment);

  if (sentimentDrift > DRIFT_THRESHOLDS.sentiment.low) {
    signals.push({
      type: 'sentiment',
      severity: getSeverity(sentimentDrift, DRIFT_THRESHOLDS.sentiment),
      metric: 'avg_sentiment',
      baseline: Math.round(baselineSentiment * 100) / 100,
      current: Math.round(currentSentiment * 100) / 100,
      changePercent: (sentimentDrift / Math.max(0.01, Math.abs(baselineSentiment))) * 100,
      confidence: 0.8,
      description: `Sentiment shifted from ${baselineSentiment > 0 ? 'positive' : 'negative'} (${baselineSentiment.toFixed(2)}) to ${currentSentiment.toFixed(2)}`,
    });
  }

  // 3. Score Drift (if applicable)
  const baselineScores = baseline.map(s => s.score).filter((s): s is number => s !== undefined);
  const currentScores = current.map(s => s.score).filter((s): s is number => s !== undefined);

  if (baselineScores.length > 0 && currentScores.length > 0) {
    const baselineAvgScore = mean(baselineScores);
    const currentAvgScore = mean(currentScores);
    const scoreDrift = Math.abs(currentAvgScore - baselineAvgScore);

    if (scoreDrift > DRIFT_THRESHOLDS.score.low) {
      signals.push({
        type: 'score',
        severity: getSeverity(scoreDrift, DRIFT_THRESHOLDS.score),
        metric: 'avg_score',
        baseline: Math.round(baselineAvgScore * 100) / 100,
        current: Math.round(currentAvgScore * 100) / 100,
        changePercent: (scoreDrift / baselineAvgScore) * 100,
        confidence: 0.9,
        description: `Average score changed from ${baselineAvgScore.toFixed(1)} to ${currentAvgScore.toFixed(1)}`,
      });
    }
  }

  // 4. Length Drift
  const baselineLength = mean(baseline.map(s => s.structure.wordCount));
  const currentLength = mean(current.map(s => s.structure.wordCount));
  const lengthChange = Math.abs(currentLength - baselineLength) / Math.max(1, baselineLength);

  if (lengthChange > DRIFT_THRESHOLDS.length.low) {
    signals.push({
      type: 'length',
      severity: getSeverity(lengthChange, DRIFT_THRESHOLDS.length),
      metric: 'avg_word_count',
      baseline: Math.round(baselineLength),
      current: Math.round(currentLength),
      changePercent: lengthChange * 100,
      confidence: 0.85,
      description: `Response length ${currentLength > baselineLength ? 'increased' : 'decreased'} by ${(lengthChange * 100).toFixed(1)}%`,
    });
  }

  // 5. Structural Drift
  const baselineListRatio = baseline.filter(s => s.structure.hasList).length / baseline.length;
  const currentListRatio = current.filter(s => s.structure.hasList).length / current.length;
  const structureChange = Math.abs(currentListRatio - baselineListRatio);

  if (structureChange > 0.3) {
    signals.push({
      type: 'structural',
      severity: structureChange > 0.7 ? 'high' : structureChange > 0.5 ? 'medium' : 'low',
      metric: 'list_usage',
      baseline: Math.round(baselineListRatio * 100),
      current: Math.round(currentListRatio * 100),
      changePercent: structureChange * 100,
      confidence: 0.7,
      description: `List formatting usage changed from ${(baselineListRatio * 100).toFixed(0)}% to ${(currentListRatio * 100).toFixed(0)}%`,
    });
  }

  // Calculate overall drift score
  const severityWeights: Record<string, number> = {
    low: 15,
    medium: 35,
    high: 60,
    critical: 100,
  };

  const overallDriftScore = signals.length > 0
    ? Math.min(100, signals.reduce((sum, s) => sum + severityWeights[s.severity], 0) / signals.length)
    : 0;

  // Determine overall severity
  let driftSeverity: 'none' | 'low' | 'medium' | 'high' | 'critical' = 'none';
  if (signals.some(s => s.severity === 'critical')) driftSeverity = 'critical';
  else if (signals.some(s => s.severity === 'high')) driftSeverity = 'high';
  else if (signals.some(s => s.severity === 'medium')) driftSeverity = 'medium';
  else if (signals.length > 0) driftSeverity = 'low';

  // Generate recommendations
  const recommendations: string[] = [];

  if (signals.some(s => s.type === 'score')) {
    recommendations.push('Score drift detected. Review if model updates or prompt changes occurred.');
  }
  if (signals.some(s => s.type === 'semantic')) {
    recommendations.push('Vocabulary drift detected. Consider re-validating prompt effectiveness.');
  }
  if (signals.some(s => s.type === 'sentiment')) {
    recommendations.push('Sentiment shift detected. Check for changes in brand perception or model behavior.');
  }
  if (signals.length === 0) {
    recommendations.push('No significant drift detected. Responses remain stable.');
  }

  return {
    queryHash,
    provider,
    period: { baseline: baselinePeriod, current: currentPeriod },
    signals,
    overallDriftScore: Math.round(overallDriftScore),
    driftDetected: signals.length > 0,
    driftSeverity,
    recommendations,
  };
}

/**
 * Get severity level based on value and thresholds
 */
function getSeverity(
  value: number,
  thresholds: { low: number; medium: number; high: number; critical: number }
): 'low' | 'medium' | 'high' | 'critical' {
  if (value >= thresholds.critical) return 'critical';
  if (value >= thresholds.high) return 'high';
  if (value >= thresholds.medium) return 'medium';
  return 'low';
}

// ============================================================================
// ALERTING
// ============================================================================

const driftAlerts: DriftAlert[] = [];

/**
 * Create drift alert if significant drift detected
 */
export function checkAndAlert(analysis: DriftAnalysis): DriftAlert | null {
  if (!analysis.driftDetected || analysis.driftSeverity === 'none') {
    return null;
  }

  // Only alert on medium+ severity
  if (analysis.driftSeverity === 'low') {
    return null;
  }

  const alert: DriftAlert = {
    id: `drift_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date(),
    provider: analysis.provider,
    queryHash: analysis.queryHash,
    signals: analysis.signals,
    severity: analysis.driftSeverity as 'low' | 'medium' | 'high' | 'critical',
    message: `${analysis.driftSeverity.toUpperCase()} drift detected for ${analysis.provider}: ${analysis.signals.map(s => s.type).join(', ')}`,
    acknowledged: false,
  };

  driftAlerts.push(alert);

  // Trim old alerts
  if (driftAlerts.length > 100) {
    driftAlerts.splice(0, driftAlerts.length - 100);
  }

  return alert;
}

/**
 * Get unacknowledged alerts
 */
export function getActiveAlerts(): DriftAlert[] {
  return driftAlerts.filter(a => !a.acknowledged);
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertId: string): boolean {
  const alert = driftAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick drift check for the last 24 hours vs previous week
 */
export function quickDriftCheck(queryHash: string, provider: string): DriftAnalysis {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return detectDrift(
    queryHash,
    provider,
    { start: oneWeekAgo, end: oneDayAgo },
    { start: oneDayAgo, end: now }
  );
}

/**
 * Get drift summary for display
 */
export function getDriftSummary(analysis: DriftAnalysis): string {
  if (!analysis.driftDetected) {
    return `No drift detected for ${analysis.provider}`;
  }

  const typeList = [...new Set(analysis.signals.map(s => s.type))].join(', ');
  return `${analysis.driftSeverity.toUpperCase()} drift: ${typeList} (score: ${analysis.overallDriftScore})`;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createSnapshot,
  getSnapshots,
  detectDrift,
  quickDriftCheck,
  checkAndAlert,
  getActiveAlerts,
  acknowledgeAlert,
  getDriftSummary,
  hashQuery,
  DRIFT_THRESHOLDS,
};
