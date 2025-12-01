/**
 * Contrastive Explainer Tests
 *
 * @module governance/contrastive-explainer.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ContrastiveExplainer,
  ExplanationRequest,
  quickContrastiveExplanation,
  formatDifferentiatingFactors,
  DifferentiatingFactor
} from './contrastive-explainer';

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn().mockResolvedValue({ data: 'test-explanation-id', error: null }),
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

describe('ContrastiveExplainer', () => {
  let explainer: ContrastiveExplainer;

  beforeEach(() => {
    explainer = new ContrastiveExplainer(
      'https://test.supabase.co',
      'test-key'
    );
  });

  describe('explain', () => {
    it('should generate a contrastive explanation', async () => {
      const request: ExplanationRequest = {
        decisionId: 'decision-123',
        decisionType: 'risk_assessment',
        actualOutcome: {
          label: 'High Risk',
          value: { score: 85 },
          confidence: 0.92
        },
        contrastOutcome: {
          label: 'Medium Risk',
          value: { score: 50 },
          confidence: 0.07
        },
        inputData: {
          transaction_volume: 500000,
          wallet_age_days: 30,
          unique_protocols: 3
        },
        featureImportance: {
          transaction_volume: 0.45,
          wallet_age_days: 0.35,
          unique_protocols: 0.20
        }
      };

      const explanation = await explainer.explain(request);

      expect(explanation.decisionId).toBe('decision-123');
      expect(explanation.actualOutcome.label).toBe('High Risk');
      expect(explanation.contrastOutcome.label).toBe('Medium Risk');
      expect(explanation.explanationType).toBe('scoring');
      expect(explanation.differentiatingFactors.length).toBeGreaterThan(0);
      expect(explanation.summary).toContain('High Risk');
      expect(explanation.summary).toContain('Medium Risk');
    });

    it('should select best contrast when not provided', async () => {
      const request: ExplanationRequest = {
        decisionId: 'decision-456',
        decisionType: 'wallet_classification',
        actualOutcome: {
          label: 'Whale',
          value: { type: 'whale' },
          confidence: 0.88
        },
        alternatives: [
          { label: 'Retail', value: { type: 'retail' }, confidence: 0.08 },
          { label: 'Institutional', value: { type: 'institutional' }, confidence: 0.04 }
        ],
        inputData: {
          total_value_usd: 5000000,
          avg_transaction_size: 100000
        }
      };

      const explanation = await explainer.explain(request);

      // Should select 'Retail' as contrast (highest confidence alternative)
      expect(explanation.contrastOutcome.label).toBe('Retail');
    });

    it('should throw error when no contrast available', async () => {
      const request: ExplanationRequest = {
        decisionId: 'decision-789',
        decisionType: 'risk_assessment',
        actualOutcome: {
          label: 'Low Risk',
          value: { score: 20 },
          confidence: 0.95
        },
        inputData: {}
      };

      await expect(explainer.explain(request)).rejects.toThrow(
        'No contrast outcome available'
      );
    });

    it('should generate counterfactuals for significant factors', async () => {
      const request: ExplanationRequest = {
        decisionId: 'decision-cf',
        decisionType: 'alert_trigger',
        actualOutcome: {
          label: 'Alert Triggered',
          value: { triggered: true },
          confidence: 0.99
        },
        contrastOutcome: {
          label: 'No Alert',
          value: { triggered: false },
          confidence: 0.01
        },
        inputData: {
          metric_value: 150,
          threshold: 100
        },
        featureImportance: {
          metric_value: 0.8,
          threshold: 0.2
        }
      };

      const explanation = await explainer.explain(request);

      expect(explanation.counterfactuals).toBeDefined();
      expect(explanation.counterfactuals!.length).toBeGreaterThan(0);

      const cf = explanation.counterfactuals![0];
      expect(cf.changesRequired.length).toBeGreaterThan(0);
      expect(cf.description).toContain('metric_value');
    });

    it('should infer correct explanation type from decision type', async () => {
      const testCases = [
        { decisionType: 'risk_assessment', expectedType: 'scoring' },
        { decisionType: 'wallet_classification', expectedType: 'classification' },
        { decisionType: 'token_recommendation', expectedType: 'recommendation' },
        { decisionType: 'alert_trigger', expectedType: 'threshold' },
        { decisionType: 'protocol_ranking', expectedType: 'ranking' }
      ];

      for (const tc of testCases) {
        const request: ExplanationRequest = {
          decisionId: `decision-${tc.decisionType}`,
          decisionType: tc.decisionType,
          actualOutcome: { label: 'A', value: {}, confidence: 0.8 },
          contrastOutcome: { label: 'B', value: {}, confidence: 0.2 },
          inputData: { test: 1 }
        };

        const explanation = await explainer.explain(request);
        expect(explanation.explanationType).toBe(tc.expectedType);
      }
    });
  });

  describe('explainWhyNot', () => {
    it('should generate why-not explanation from cache', async () => {
      // First, add an explanation to cache via explain()
      const request: ExplanationRequest = {
        decisionId: 'cached-decision',
        decisionType: 'risk_assessment',
        actualOutcome: { label: 'High Risk', value: {}, confidence: 0.9 },
        contrastOutcome: { label: 'Low Risk', value: {}, confidence: 0.1 },
        inputData: { volume: 1000000 }
      };

      await explainer.explain(request);

      // Now explainWhyNot should find it in cache
      const explanation = await explainer.explainWhyNot(
        'cached-decision',
        'Low Risk',
        { volume: 1000000 },
        { volume: 0.7 }
      );

      expect(typeof explanation).toBe('string');
      expect(explanation.length).toBeGreaterThan(0);
    });
  });

  describe('recordFeedback', () => {
    it('should record positive feedback', async () => {
      const result = await explainer.recordFeedback(
        'explanation-123',
        true,
        'Very helpful explanation!'
      );

      expect(result).toBe(true);
    });

    it('should record negative feedback', async () => {
      const result = await explainer.recordFeedback(
        'explanation-456',
        false,
        'Did not understand the factors'
      );

      expect(result).toBe(true);
    });
  });

  describe('getUserExplanations', () => {
    it('should return empty array when no explanations', async () => {
      const explanations = await explainer.getUserExplanations('user-123');

      expect(Array.isArray(explanations)).toBe(true);
      expect(explanations.length).toBe(0);
    });
  });
});

describe('quickContrastiveExplanation', () => {
  it('should generate quick explanation', () => {
    const explanation = quickContrastiveExplanation(
      'Approved',
      'Rejected',
      [
        'Credit score above threshold',
        'Income verified',
        'No previous defaults'
      ]
    );

    expect(explanation).toContain('Approved');
    expect(explanation).toContain('Rejected');
    expect(explanation).toContain('Credit score above threshold');
    expect(explanation).toContain('Income verified');
  });

  it('should handle single reason', () => {
    const explanation = quickContrastiveExplanation(
      'High',
      'Low',
      ['Value exceeded threshold']
    );

    expect(explanation).toContain('Value exceeded threshold');
  });

  it('should handle empty reasons', () => {
    const explanation = quickContrastiveExplanation('A', 'B', []);

    expect(explanation).toContain('A');
    expect(explanation).toContain('B');
  });
});

describe('formatDifferentiatingFactors', () => {
  it('should format factors with support emoji', () => {
    const factors: DifferentiatingFactor[] = [
      {
        name: 'volume',
        actualValue: '100000',
        contrastValue: '50000',
        influence: 'strongly_supports',
        weight: 0.8,
        explanation: 'Volume supports high classification'
      }
    ];

    const formatted = formatDifferentiatingFactors(factors);

    expect(formatted[0]).toContain('volume');
    expect(formatted[0]).toContain('100000');
    expect(formatted[0]).toContain('80%');
  });

  it('should format factors with oppose emoji', () => {
    const factors: DifferentiatingFactor[] = [
      {
        name: 'age',
        actualValue: '10',
        contrastValue: '365',
        influence: 'strongly_opposes',
        weight: 0.6,
        explanation: 'Age opposes classification'
      }
    ];

    const formatted = formatDifferentiatingFactors(factors);

    expect(formatted[0]).toContain('age');
    expect(formatted[0]).toContain('10');
  });

  it('should format neutral factors', () => {
    const factors: DifferentiatingFactor[] = [
      {
        name: 'activity',
        actualValue: 'medium',
        contrastValue: 'medium',
        influence: 'neutral',
        weight: 0.3,
        explanation: 'Activity is neutral'
      }
    ];

    const formatted = formatDifferentiatingFactors(factors);

    expect(formatted[0]).toContain('activity');
    expect(formatted[0]).toContain('30%');
  });

  it('should handle empty factors', () => {
    const formatted = formatDifferentiatingFactors([]);
    expect(formatted).toEqual([]);
  });

  it('should format multiple factors', () => {
    const factors: DifferentiatingFactor[] = [
      {
        name: 'factor1',
        actualValue: 'a',
        contrastValue: 'b',
        influence: 'moderately_supports',
        weight: 0.7,
        explanation: ''
      },
      {
        name: 'factor2',
        actualValue: 'x',
        contrastValue: 'y',
        influence: 'weakly_opposes',
        weight: 0.2,
        explanation: ''
      }
    ];

    const formatted = formatDifferentiatingFactors(factors);

    expect(formatted.length).toBe(2);
    expect(formatted[0]).toContain('factor1');
    expect(formatted[1]).toContain('factor2');
  });
});

describe('DifferentiatingFactor analysis', () => {
  let explainer: ContrastiveExplainer;

  beforeEach(() => {
    explainer = new ContrastiveExplainer(
      'https://test.supabase.co',
      'test-key'
    );
  });

  it('should identify strongly supporting factors', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-strong',
      decisionType: 'risk_assessment',
      actualOutcome: { label: 'High', value: {}, confidence: 0.95 },
      contrastOutcome: { label: 'Low', value: {}, confidence: 0.05 },
      inputData: { critical_factor: 100 },
      featureImportance: { critical_factor: 0.9 }
    };

    const explanation = await explainer.explain(request);
    const strongFactors = explanation.differentiatingFactors.filter(
      f => f.influence === 'strongly_supports'
    );

    expect(strongFactors.length).toBeGreaterThan(0);
  });

  it('should handle mixed influence factors', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-mixed',
      decisionType: 'wallet_classification',
      actualOutcome: { label: 'Active', value: {}, confidence: 0.6 },
      contrastOutcome: { label: 'Inactive', value: {}, confidence: 0.4 },
      inputData: {
        transactions: 50,
        last_active: 30,
        balance: 1000
      },
      featureImportance: {
        transactions: 0.5,
        last_active: 0.3,
        balance: 0.2
      }
    };

    const explanation = await explainer.explain(request);

    expect(explanation.differentiatingFactors.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Counterfactual generation', () => {
  let explainer: ContrastiveExplainer;

  beforeEach(() => {
    explainer = new ContrastiveExplainer(
      'https://test.supabase.co',
      'test-key'
    );
  });

  it('should mark immutable features as not actionable', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-immutable',
      decisionType: 'risk_assessment',
      actualOutcome: { label: 'High', value: {}, confidence: 0.8 },
      contrastOutcome: { label: 'Low', value: {}, confidence: 0.2 },
      inputData: {
        wallet_age: 10,
        transaction_volume: 50000
      },
      featureImportance: {
        wallet_age: 0.6,
        transaction_volume: 0.4
      }
    };

    const explanation = await explainer.explain(request);

    const walletAgeCf = explanation.counterfactuals?.find(
      cf => cf.changesRequired[0]?.feature === 'wallet_age'
    );

    if (walletAgeCf) {
      expect(walletAgeCf.isActionable).toBe(false);
      expect(walletAgeCf.changesRequired[0].changeDifficulty).toBe('impossible');
    }
  });

  it('should calculate feasibility scores', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-feasibility',
      decisionType: 'token_recommendation',
      actualOutcome: { label: 'TokenA', value: {}, confidence: 0.75 },
      contrastOutcome: { label: 'TokenB', value: {}, confidence: 0.25 },
      inputData: {
        risk_tolerance: 'high',
        investment_amount: 10000
      },
      featureImportance: {
        risk_tolerance: 0.7,
        investment_amount: 0.5
      }
    };

    const explanation = await explainer.explain(request);

    for (const cf of explanation.counterfactuals || []) {
      expect(cf.feasibilityScore).toBeDefined();
      expect(cf.feasibilityScore).toBeGreaterThanOrEqual(0);
      expect(cf.feasibilityScore).toBeLessThanOrEqual(1);
    }
  });
});

describe('Explanation summary generation', () => {
  let explainer: ContrastiveExplainer;

  beforeEach(() => {
    explainer = new ContrastiveExplainer(
      'https://test.supabase.co',
      'test-key'
    );
  });

  it('should include confidence percentages', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-confidence',
      decisionType: 'risk_assessment',
      actualOutcome: { label: 'High', value: {}, confidence: 0.85 },
      contrastOutcome: { label: 'Low', value: {}, confidence: 0.15 },
      inputData: { factor: 100 }
    };

    const explanation = await explainer.explain(request);

    expect(explanation.summary).toContain('85%');
    expect(explanation.summary).toContain('15%');
  });

  it('should list key differentiating factors', async () => {
    const request: ExplanationRequest = {
      decisionId: 'test-factors',
      decisionType: 'wallet_classification',
      actualOutcome: { label: 'Whale', value: {}, confidence: 0.9 },
      contrastOutcome: { label: 'Retail', value: {}, confidence: 0.1 },
      inputData: {
        balance: 5000000,
        transaction_count: 500
      },
      featureImportance: {
        balance: 0.8,
        transaction_count: 0.5
      }
    };

    const explanation = await explainer.explain(request);

    expect(explanation.summary).toContain('Key differentiating factors');
    expect(explanation.summary).toContain('balance');
  });

  it('should use correct type-specific language', async () => {
    // Test classification type
    const classificationRequest: ExplanationRequest = {
      decisionId: 'test-type-1',
      decisionType: 'wallet_classification',
      actualOutcome: { label: 'Bot', value: {}, confidence: 0.8 },
      contrastOutcome: { label: 'Human', value: {}, confidence: 0.2 },
      inputData: { pattern: 'repetitive' }
    };

    const classExplanation = await explainer.explain(classificationRequest);
    expect(classExplanation.summary).toContain('classified');

    // Test recommendation type
    const recommendationRequest: ExplanationRequest = {
      decisionId: 'test-type-2',
      decisionType: 'token_recommendation',
      actualOutcome: { label: 'ETH', value: {}, confidence: 0.7 },
      contrastOutcome: { label: 'BTC', value: {}, confidence: 0.3 },
      inputData: { preference: 'defi' }
    };

    const recExplanation = await explainer.explain(recommendationRequest);
    expect(recExplanation.summary).toContain('recommended');
  });
});
