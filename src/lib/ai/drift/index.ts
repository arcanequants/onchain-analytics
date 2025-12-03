/**
 * Semantic Drift Detector
 *
 * Phase 2, Week 3, Day 5
 * Detects semantic drift in AI model outputs over time
 */

// ================================================================
// TYPES
// ================================================================

export type DriftSeverity = 'none' | 'minor' | 'moderate' | 'significant' | 'critical';
export type DriftType =
  | 'semantic_shift'
  | 'format_change'
  | 'length_change'
  | 'sentiment_shift'
  | 'vocabulary_change'
  | 'structure_change';

export interface DriftMetric {
  type: DriftType;
  value: number; // 0-1, higher = more drift
  threshold: number;
  exceeded: boolean;
  description: string;
}

export interface DriftAnalysis {
  hasDrift: boolean;
  severity: DriftSeverity;
  overallScore: number; // 0-1
  metrics: DriftMetric[];
  summary: string;
  recommendations: string[];
  timestamp: Date;
}

export interface ResponseSnapshot {
  id: string;
  promptId: string;
  provider: string;
  model: string;
  prompt: string;
  response: string;
  tokens: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DriftConfig {
  // Thresholds for each metric type
  thresholds: {
    semantic: number;
    format: number;
    length: number;
    sentiment: number;
    vocabulary: number;
    structure: number;
  };
  // Minimum samples required for comparison
  minSamples: number;
  // Time window for comparison (ms)
  comparisonWindow: number;
  // Weights for combining metrics
  weights: {
    semantic: number;
    format: number;
    length: number;
    sentiment: number;
    vocabulary: number;
    structure: number;
  };
}

// ================================================================
// CONSTANTS
// ================================================================

const DEFAULT_CONFIG: DriftConfig = {
  thresholds: {
    semantic: 0.3,
    format: 0.25,
    length: 0.4,
    sentiment: 0.35,
    vocabulary: 0.3,
    structure: 0.25,
  },
  minSamples: 5,
  comparisonWindow: 7 * 24 * 60 * 60 * 1000, // 7 days
  weights: {
    semantic: 0.25,
    format: 0.15,
    length: 0.1,
    sentiment: 0.2,
    vocabulary: 0.15,
    structure: 0.15,
  },
};

const SEVERITY_THRESHOLDS: Record<DriftSeverity, { min: number; max: number }> = {
  none: { min: 0, max: 0.1 },
  minor: { min: 0.1, max: 0.25 },
  moderate: { min: 0.25, max: 0.45 },
  significant: { min: 0.45, max: 0.65 },
  critical: { min: 0.65, max: 1 },
};

// ================================================================
// SEMANTIC DRIFT DETECTOR
// ================================================================

export class SemanticDriftDetector {
  private config: DriftConfig;
  private snapshots: Map<string, ResponseSnapshot[]> = new Map();

  constructor(config: Partial<DriftConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...config.thresholds },
      weights: { ...DEFAULT_CONFIG.weights, ...config.weights },
    };
  }

  // ================================================================
  // SNAPSHOT MANAGEMENT
  // ================================================================

  addSnapshot(snapshot: ResponseSnapshot): void {
    const key = this.getSnapshotKey(snapshot.promptId, snapshot.provider, snapshot.model);
    const existing = this.snapshots.get(key) || [];
    existing.push(snapshot);

    // Keep only snapshots within comparison window
    const cutoff = Date.now() - this.config.comparisonWindow;
    const filtered = existing.filter((s) => s.timestamp.getTime() > cutoff);

    this.snapshots.set(key, filtered);
  }

  getSnapshots(promptId: string, provider: string, model: string): ResponseSnapshot[] {
    const key = this.getSnapshotKey(promptId, provider, model);
    return this.snapshots.get(key) || [];
  }

  private getSnapshotKey(promptId: string, provider: string, model: string): string {
    return `${promptId}:${provider}:${model}`;
  }

  // ================================================================
  // DRIFT DETECTION
  // ================================================================

  analyze(
    current: ResponseSnapshot,
    baseline?: ResponseSnapshot[]
  ): DriftAnalysis {
    const snapshots = baseline || this.getSnapshots(
      current.promptId,
      current.provider,
      current.model
    );

    // Not enough samples for comparison
    if (snapshots.length < this.config.minSamples) {
      return {
        hasDrift: false,
        severity: 'none',
        overallScore: 0,
        metrics: [],
        summary: `Insufficient samples for drift detection (${snapshots.length}/${this.config.minSamples})`,
        recommendations: ['Continue collecting baseline samples'],
        timestamp: new Date(),
      };
    }

    // Calculate metrics
    const metrics: DriftMetric[] = [
      this.calculateSemanticDrift(current, snapshots),
      this.calculateFormatDrift(current, snapshots),
      this.calculateLengthDrift(current, snapshots),
      this.calculateSentimentDrift(current, snapshots),
      this.calculateVocabularyDrift(current, snapshots),
      this.calculateStructureDrift(current, snapshots),
    ];

    // Calculate overall score
    const overallScore = this.calculateOverallScore(metrics);
    const severity = this.scoreToSeverity(overallScore);
    const hasDrift = metrics.some((m) => m.exceeded);

    // Generate summary and recommendations
    const summary = this.generateSummary(metrics, severity);
    const recommendations = this.generateRecommendations(metrics);

    return {
      hasDrift,
      severity,
      overallScore,
      metrics,
      summary,
      recommendations,
      timestamp: new Date(),
    };
  }

  // ================================================================
  // METRIC CALCULATIONS
  // ================================================================

  private calculateSemanticDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    // Calculate cosine similarity using simple TF-IDF approximation
    const currentWords = this.tokenize(current.response);
    const baselineWords = baseline.flatMap((s) => this.tokenize(s.response));

    const similarity = this.calculateJaccardSimilarity(currentWords, baselineWords);
    const drift = 1 - similarity;

    return {
      type: 'semantic_shift',
      value: drift,
      threshold: this.config.thresholds.semantic,
      exceeded: drift > this.config.thresholds.semantic,
      description: `Semantic similarity: ${(similarity * 100).toFixed(1)}%`,
    };
  }

  private calculateFormatDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    // Detect format patterns (JSON, markdown, lists, etc.)
    const currentFormat = this.detectFormat(current.response);
    const baselineFormats = baseline.map((s) => this.detectFormat(s.response));

    const commonFormat = this.getMostCommon(baselineFormats);
    const formatMatch = currentFormat === commonFormat ? 0 : 1;

    return {
      type: 'format_change',
      value: formatMatch,
      threshold: this.config.thresholds.format,
      exceeded: formatMatch > this.config.thresholds.format,
      description: formatMatch === 0
        ? `Format consistent: ${currentFormat}`
        : `Format changed: ${commonFormat} -> ${currentFormat}`,
    };
  }

  private calculateLengthDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    const currentLength = current.response.length;
    const baselineLengths = baseline.map((s) => s.response.length);

    const avgLength = baselineLengths.reduce((a, b) => a + b, 0) / baselineLengths.length;
    const stdDev = Math.sqrt(
      baselineLengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / baselineLengths.length
    );

    // Calculate z-score
    const zScore = stdDev > 0 ? Math.abs(currentLength - avgLength) / stdDev : 0;
    // Normalize to 0-1 range
    const drift = Math.min(zScore / 3, 1);

    return {
      type: 'length_change',
      value: drift,
      threshold: this.config.thresholds.length,
      exceeded: drift > this.config.thresholds.length,
      description: `Length: ${currentLength} chars (avg: ${avgLength.toFixed(0)}, deviation: ${(drift * 100).toFixed(1)}%)`,
    };
  }

  private calculateSentimentDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    const currentSentiment = this.analyzeSentiment(current.response);
    const baselineSentiments = baseline.map((s) => this.analyzeSentiment(s.response));

    const avgSentiment = baselineSentiments.reduce((a, b) => a + b, 0) / baselineSentiments.length;
    const drift = Math.abs(currentSentiment - avgSentiment) / 2; // Normalize 0-1

    return {
      type: 'sentiment_shift',
      value: drift,
      threshold: this.config.thresholds.sentiment,
      exceeded: drift > this.config.thresholds.sentiment,
      description: `Sentiment: ${this.sentimentToLabel(currentSentiment)} (drift: ${(drift * 100).toFixed(1)}%)`,
    };
  }

  private calculateVocabularyDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    const currentVocab = new Set(this.tokenize(current.response));
    const baselineVocab = new Set(baseline.flatMap((s) => this.tokenize(s.response)));

    // Calculate vocabulary overlap
    const intersection = new Set([...currentVocab].filter((x) => baselineVocab.has(x)));
    const union = new Set([...currentVocab, ...baselineVocab]);

    const overlap = intersection.size / union.size;
    const drift = 1 - overlap;

    // Count new terms
    const newTerms = [...currentVocab].filter((x) => !baselineVocab.has(x));

    return {
      type: 'vocabulary_change',
      value: drift,
      threshold: this.config.thresholds.vocabulary,
      exceeded: drift > this.config.thresholds.vocabulary,
      description: `Vocabulary overlap: ${(overlap * 100).toFixed(1)}%, ${newTerms.length} new terms`,
    };
  }

  private calculateStructureDrift(
    current: ResponseSnapshot,
    baseline: ResponseSnapshot[]
  ): DriftMetric {
    const currentStructure = this.analyzeStructure(current.response);
    const baselineStructures = baseline.map((s) => this.analyzeStructure(s.response));

    // Compare structural features
    let totalDiff = 0;
    let featureCount = 0;

    for (const [key, value] of Object.entries(currentStructure)) {
      const baselineAvg = baselineStructures.reduce((sum, s) => sum + (s[key] || 0), 0) / baselineStructures.length;
      const maxVal = Math.max(value, baselineAvg, 1);
      totalDiff += Math.abs(value - baselineAvg) / maxVal;
      featureCount++;
    }

    const drift = featureCount > 0 ? totalDiff / featureCount : 0;

    return {
      type: 'structure_change',
      value: drift,
      threshold: this.config.thresholds.structure,
      exceeded: drift > this.config.thresholds.structure,
      description: `Structure drift: ${(drift * 100).toFixed(1)}%`,
    };
  }

  // ================================================================
  // HELPER METHODS
  // ================================================================

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2);
  }

  private calculateJaccardSimilarity(a: string[], b: string[]): number {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private detectFormat(text: string): string {
    if (text.startsWith('{') || text.startsWith('[')) return 'json';
    if (text.includes('```')) return 'markdown_code';
    if (/^#{1,6}\s/m.test(text)) return 'markdown_headers';
    if (/^[-*]\s/m.test(text)) return 'bullet_list';
    if (/^\d+\.\s/m.test(text)) return 'numbered_list';
    if (text.includes('<') && text.includes('>')) return 'html';
    return 'plain_text';
  }

  private getMostCommon<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    let maxCount = 0;
    let mostCommon = arr[0];
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = item;
      }
    }
    return mostCommon;
  }

  private analyzeSentiment(text: string): number {
    const positive = ['great', 'excellent', 'good', 'best', 'amazing', 'love', 'recommend', 'perfect', 'awesome'];
    const negative = ['bad', 'terrible', 'worst', 'poor', 'awful', 'hate', 'avoid', 'disappointing', 'fail'];

    const words = this.tokenize(text);
    let score = 0;

    for (const word of words) {
      if (positive.includes(word)) score += 1;
      if (negative.includes(word)) score -= 1;
    }

    // Normalize to -1 to 1
    const normalized = Math.max(-1, Math.min(1, score / Math.max(words.length * 0.1, 1)));
    return normalized;
  }

  private sentimentToLabel(score: number): string {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  private analyzeStructure(text: string): Record<string, number> {
    return {
      paragraphs: (text.match(/\n\n/g) || []).length + 1,
      sentences: (text.match(/[.!?]+/g) || []).length,
      bulletPoints: (text.match(/^[-*]\s/gm) || []).length,
      numberedItems: (text.match(/^\d+\.\s/gm) || []).length,
      headings: (text.match(/^#{1,6}\s/gm) || []).length,
      codeBlocks: (text.match(/```/g) || []).length / 2,
      links: (text.match(/\[.*?\]\(.*?\)/g) || []).length,
    };
  }

  private calculateOverallScore(metrics: DriftMetric[]): number {
    let weightedSum = 0;
    let totalWeight = 0;

    const typeToWeight: Record<DriftType, number> = {
      semantic_shift: this.config.weights.semantic,
      format_change: this.config.weights.format,
      length_change: this.config.weights.length,
      sentiment_shift: this.config.weights.sentiment,
      vocabulary_change: this.config.weights.vocabulary,
      structure_change: this.config.weights.structure,
    };

    for (const metric of metrics) {
      const weight = typeToWeight[metric.type] || 0.1;
      weightedSum += metric.value * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  private scoreToSeverity(score: number): DriftSeverity {
    for (const [severity, range] of Object.entries(SEVERITY_THRESHOLDS)) {
      if (score >= range.min && score < range.max) {
        return severity as DriftSeverity;
      }
    }
    return 'critical';
  }

  private generateSummary(metrics: DriftMetric[], severity: DriftSeverity): string {
    const exceeded = metrics.filter((m) => m.exceeded);

    if (exceeded.length === 0) {
      return 'No significant drift detected. Model outputs are consistent with baseline.';
    }

    const types = exceeded.map((m) => m.type.replace(/_/g, ' ')).join(', ');
    return `${severity.charAt(0).toUpperCase() + severity.slice(1)} drift detected in: ${types}. ${exceeded.length} of ${metrics.length} metrics exceeded thresholds.`;
  }

  private generateRecommendations(metrics: DriftMetric[]): string[] {
    const recommendations: string[] = [];
    const exceeded = metrics.filter((m) => m.exceeded);

    for (const metric of exceeded) {
      switch (metric.type) {
        case 'semantic_shift':
          recommendations.push('Review prompt for ambiguity that could cause varied interpretations');
          recommendations.push('Consider adding few-shot examples to anchor semantic consistency');
          break;
        case 'format_change':
          recommendations.push('Add explicit format instructions to the prompt');
          recommendations.push('Use structured output (JSON schema) to enforce format');
          break;
        case 'length_change':
          recommendations.push('Specify expected output length in the prompt');
          recommendations.push('Use max_tokens parameter to control response length');
          break;
        case 'sentiment_shift':
          recommendations.push('Review prompt for tone guidance');
          recommendations.push('Check if model updates affected sentiment handling');
          break;
        case 'vocabulary_change':
          recommendations.push('Define key terminology in the prompt');
          recommendations.push('Check for model version changes that may affect vocabulary');
          break;
        case 'structure_change':
          recommendations.push('Provide explicit structure template in the prompt');
          recommendations.push('Use XML or JSON tags to enforce structure');
          break;
      }
    }

    // General recommendations
    if (exceeded.length > 2) {
      recommendations.push('Consider evaluating alternative model versions');
      recommendations.push('Schedule prompt review and optimization');
    }

    return [...new Set(recommendations)];
  }
}

// ================================================================
// SINGLETON
// ================================================================

let detector: SemanticDriftDetector | null = null;

export function getDriftDetector(config?: Partial<DriftConfig>): SemanticDriftDetector {
  if (!detector) {
    detector = new SemanticDriftDetector(config);
  }
  return detector;
}

// ================================================================
// CONVENIENCE FUNCTIONS
// ================================================================

export function trackResponse(snapshot: ResponseSnapshot): void {
  getDriftDetector().addSnapshot(snapshot);
}

export function detectDrift(
  current: ResponseSnapshot,
  baseline?: ResponseSnapshot[]
): DriftAnalysis {
  return getDriftDetector().analyze(current, baseline);
}
