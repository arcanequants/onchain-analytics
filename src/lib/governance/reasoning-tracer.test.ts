/**
 * Reasoning Tracer Tests
 *
 * @module governance/reasoning-tracer.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ReasoningTracer,
  ReasoningTrace,
  quickReasoningTrace,
  formatStepsAsBullets
} from './reasoning-tracer';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: 'test-trace-id', error: null }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        }))
      }))
    }))
  }))
}));

describe('ReasoningTracer', () => {
  let tracer: ReasoningTracer;

  beforeEach(() => {
    tracer = new ReasoningTracer(
      'https://test.supabase.co',
      'test-key'
    );
  });

  describe('startTrace', () => {
    it('should create a trace builder', () => {
      const builder = tracer.startTrace('decision-123', 'risk_assessment');

      expect(builder).toBeDefined();
      expect(typeof builder.addObservation).toBe('function');
      expect(typeof builder.addInference).toBe('function');
      expect(typeof builder.addConclusion).toBe('function');
      expect(typeof builder.build).toBe('function');
    });

    it('should accept optional parameters', () => {
      const builder = tracer.startTrace('decision-456', 'classification', {
        modelId: 'model-v1',
        detailLevel: 'verbose',
        userId: 'user-123'
      });

      expect(builder).toBeDefined();
    });
  });

  describe('TraceBuilder', () => {
    it('should build a trace with multiple steps', async () => {
      const builder = tracer.startTrace('decision-789', 'risk_assessment');

      builder
        .addObservation('Data Collection', 'Gathered 50 transactions', '50 txs')
        .addPatternMatch('High Volume', 0.85, 'Matched whale pattern')
        .addCalculation('Risk Score', 'volume * 0.4 + age * 0.3', '72')
        .addComparison('Threshold Check', ['72', '50'], 'Above threshold')
        .addConclusion('High Risk Classification', 'high');

      const trace = await tracer.completeTrace(
        'decision-789',
        'High Risk',
        0.85,
        'After analyzing transaction patterns, determined high risk.',
        ['High transaction volume', 'New wallet', 'Single protocol usage'],
        'user-123'
      );

      expect(trace.decisionId).toBe('decision-789');
      expect(trace.finalOutcome).toBe('High Risk');
      expect(trace.finalConfidenceScore).toBe(0.85);
      expect(trace.steps.length).toBe(5);
    });

    it('should chain methods fluently', () => {
      const builder = tracer.startTrace('test-chain', 'test');

      const result = builder
        .addObservation('Step 1', 'First')
        .addInference('Step 2', 'Second', 'high')
        .addRuleApplication('Rule A', 'Applied');

      expect(result).toBe(builder); // Same instance returned
    });

    it('should add all step types', () => {
      const builder = tracer.startTrace('test-types', 'test');

      builder
        .addObservation('Observe', 'Observed data')
        .addInference('Infer', 'Made inference', 'high')
        .addRuleApplication('Apply Rule', 'Rule applied')
        .addComparison('Compare', ['A', 'B'], 'A wins')
        .addCalculation('Calculate', '2 + 2', '4')
        .addPatternMatch('Pattern', 0.9, 'Found pattern')
        .addExternalLookup('API', 'Got data')
        .addAssumption('Assume X', 'Historical data')
        .addUncertainty('Unknown factor', 'Limited data')
        .addConclusion('Final', 'very_high');

      // Build to verify all steps recorded
      builder.setOutcome('Test', 0.95);
      builder.setSummary('Test summary');
      const trace = builder.build();

      expect(trace.steps.length).toBe(10);
    });

    it('should throw if outcome not set', () => {
      const builder = tracer.startTrace('test-no-outcome', 'test');
      builder.addObservation('Step', 'Data');
      builder.setSummary('Summary');

      // @ts-expect-error - Testing internal build() call
      expect(() => builder.build()).toThrow('Outcome not set');
    });

    it('should throw if summary not set', () => {
      const builder = tracer.startTrace('test-no-summary', 'test');
      builder.addObservation('Step', 'Data');
      builder.setOutcome('Result', 0.8);

      // @ts-expect-error - Testing internal build() call
      expect(() => builder.build()).toThrow('Summary not set');
    });
  });

  describe('completeTrace', () => {
    it('should save trace to database', async () => {
      const builder = tracer.startTrace('save-test', 'classification');
      builder.addObservation('Step', 'Data');

      const trace = await tracer.completeTrace(
        'save-test',
        'Category A',
        0.88,
        'Classified as Category A based on features.'
      );

      expect(trace.id).toBe('test-trace-id');
      expect(trace.finalOutcome).toBe('Category A');
    });

    it('should throw for unknown decision', async () => {
      await expect(
        tracer.completeTrace('unknown-id', 'Outcome', 0.5, 'Summary')
      ).rejects.toThrow('No active trace found');
    });
  });

  describe('formatTrace', () => {
    it('should format trace as markdown', async () => {
      const builder = tracer.startTrace('format-test', 'recommendation');
      builder
        .addObservation('Analysis', 'Analyzed portfolio')
        .addComparison('Token Comparison', ['ETH', 'BTC', 'SOL'], 'ETH best match', [
          { option: 'BTC', whyNot: 'Lower DeFi exposure' },
          { option: 'SOL', whyNot: 'Higher risk profile' }
        ])
        .addConclusion('Recommend ETH', 'high');

      const trace = await tracer.completeTrace(
        'format-test',
        'ETH',
        0.82,
        'Based on your portfolio analysis, ETH is recommended.',
        ['Aligns with risk tolerance', 'DeFi exposure preferred']
      );

      const formatted = tracer.formatTrace(trace);

      expect(formatted).toContain('## Reasoning Trace');
      expect(formatted).toContain('ETH');
      expect(formatted).toContain('Key Points');
      expect(formatted).toContain('Aligns with risk tolerance');
      expect(formatted).toContain('Reasoning Steps');
      expect(formatted).toContain('Token Comparison');
      expect(formatted).toContain('BTC');
      expect(formatted).toContain('Lower DeFi exposure');
    });

    it('should include step icons', async () => {
      const builder = tracer.startTrace('icon-test', 'test');
      builder
        .addObservation('Observe', 'Data')
        .addCalculation('Calculate', '1+1', '2')
        .addConclusion('Done', 'high');

      const trace = await tracer.completeTrace(
        'icon-test',
        'Result',
        0.9,
        'Summary'
      );

      const formatted = tracer.formatTrace(trace);

      // Should contain emoji icons
      expect(formatted).toMatch(/[👁️🔢✅]/);
    });
  });

  describe('getUserTraces', () => {
    it('should return empty array for user with no traces', async () => {
      const traces = await tracer.getUserTraces('user-no-traces');
      expect(traces).toEqual([]);
    });
  });

  describe('recordView', () => {
    it('should record view without error', async () => {
      const result = await tracer.recordView('trace-123', 30);
      expect(result).toBe(true);
    });
  });
});

describe('quickReasoningTrace', () => {
  it('should create a quick trace', () => {
    const trace = quickReasoningTrace(
      'alert_decision',
      'Alert Triggered',
      [
        'Value exceeded threshold',
        'Pattern matches anomaly',
        'No recent similar activity'
      ],
      'high'
    );

    expect(trace.decisionType).toBe('alert_decision');
    expect(trace.finalOutcome).toBe('Alert Triggered');
    expect(trace.finalConfidence).toBe('high');
    expect(trace.steps.length).toBe(4); // 3 reasons + conclusion
  });

  it('should default to high confidence', () => {
    const trace = quickReasoningTrace(
      'test',
      'Result',
      ['Reason 1']
    );

    expect(trace.finalConfidence).toBe('high');
    expect(trace.finalConfidenceScore).toBe(0.85);
  });

  it('should handle different confidence levels', () => {
    const levels = ['very_high', 'high', 'moderate', 'low', 'very_low'] as const;
    const expectedScores = [0.95, 0.85, 0.65, 0.35, 0.15];

    levels.forEach((level, i) => {
      const trace = quickReasoningTrace('test', 'Result', ['R'], level);
      expect(trace.finalConfidenceScore).toBe(expectedScores[i]);
    });
  });

  it('should generate decision IDs with timestamp prefix', () => {
    const trace1 = quickReasoningTrace('test', 'A', ['R']);

    // Decision ID should start with 'quick-' prefix
    expect(trace1.decisionId).toMatch(/^quick-\d+$/);
  });
});

describe('formatStepsAsBullets', () => {
  it('should format steps as bullet points', () => {
    const trace: ReasoningTrace = {
      decisionId: 'test',
      decisionType: 'test',
      finalOutcome: 'Result',
      finalConfidence: 'high',
      finalConfidenceScore: 0.85,
      summaryText: 'Summary',
      steps: [
        {
          stepNumber: 1,
          type: 'observation',
          title: 'Data Collection',
          description: 'Gathered 100 records'
        },
        {
          stepNumber: 2,
          type: 'inference',
          title: 'Analysis',
          description: 'Found patterns',
          confidence: 'high'
        }
      ],
      detailLevel: 'standard'
    };

    const bullets = formatStepsAsBullets(trace);

    expect(bullets.length).toBe(2);
    expect(bullets[0]).toBe('Data Collection: Gathered 100 records');
    expect(bullets[1]).toBe('Analysis: Found patterns (high confidence)');
  });

  it('should handle empty steps', () => {
    const trace: ReasoningTrace = {
      decisionId: 'test',
      decisionType: 'test',
      finalOutcome: 'Result',
      finalConfidence: 'high',
      finalConfidenceScore: 0.85,
      summaryText: 'Summary',
      steps: [],
      detailLevel: 'standard'
    };

    const bullets = formatStepsAsBullets(trace);
    expect(bullets).toEqual([]);
  });
});

describe('Confidence level mapping', () => {
  let tracer: ReasoningTracer;

  beforeEach(() => {
    tracer = new ReasoningTracer('https://test.supabase.co', 'test-key');
  });

  it('should map score to very_high for 90%+', async () => {
    const builder = tracer.startTrace('conf-vh', 'test');
    builder.addObservation('Step', 'Data');

    const trace = await tracer.completeTrace('conf-vh', 'Result', 0.95, 'Summary');
    expect(trace.finalConfidence).toBe('very_high');
  });

  it('should map score to high for 75-90%', async () => {
    const builder = tracer.startTrace('conf-h', 'test');
    builder.addObservation('Step', 'Data');

    const trace = await tracer.completeTrace('conf-h', 'Result', 0.82, 'Summary');
    expect(trace.finalConfidence).toBe('high');
  });

  it('should map score to moderate for 50-75%', async () => {
    const builder = tracer.startTrace('conf-m', 'test');
    builder.addObservation('Step', 'Data');

    const trace = await tracer.completeTrace('conf-m', 'Result', 0.60, 'Summary');
    expect(trace.finalConfidence).toBe('moderate');
  });

  it('should map score to low for 25-50%', async () => {
    const builder = tracer.startTrace('conf-l', 'test');
    builder.addObservation('Step', 'Data');

    const trace = await tracer.completeTrace('conf-l', 'Result', 0.35, 'Summary');
    expect(trace.finalConfidence).toBe('low');
  });

  it('should map score to very_low for <25%', async () => {
    const builder = tracer.startTrace('conf-vl', 'test');
    builder.addObservation('Step', 'Data');

    const trace = await tracer.completeTrace('conf-vl', 'Result', 0.15, 'Summary');
    expect(trace.finalConfidence).toBe('very_low');
  });
});
