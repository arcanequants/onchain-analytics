/**
 * Model Card Generator
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Generate standardized model cards for AI providers
 * - Document model characteristics and limitations
 * - Track model versions and updates
 * - Store evaluation results
 */

// ============================================================================
// TYPES
// ============================================================================

export interface ModelCard {
  // Identity
  modelId: string;
  provider: string;
  modelName: string;
  version: string;
  releaseDate?: Date;
  deprecationDate?: Date;
  status: 'active' | 'deprecated' | 'beta' | 'preview';

  // Description
  description: string;
  intendedUse: string[];
  outOfScopeUse: string[];

  // Technical Details
  architecture: {
    type: string;
    parameters?: string;
    contextWindow: number;
    trainingCutoff?: string;
    languages: string[];
  };

  // Capabilities
  capabilities: {
    textGeneration: boolean;
    codeGeneration: boolean;
    imageUnderstanding: boolean;
    functionCalling: boolean;
    jsonMode: boolean;
    streaming: boolean;
    systemPrompt: boolean;
  };

  // Pricing
  pricing: {
    inputCostPer1k: number;
    outputCostPer1k: number;
    currency: string;
    tier?: string;
  };

  // Performance
  performance: {
    avgLatencyMs: number;
    p95LatencyMs: number;
    tokensPerSecond: number;
    reliability: number;  // 0-100
  };

  // Evaluation
  evaluation: {
    benchmarks: BenchmarkResult[];
    internalTests: InternalTestResult[];
    lastEvaluated: Date;
  };

  // Limitations
  limitations: string[];
  ethicalConsiderations: string[];
  biasAnalysis?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface BenchmarkResult {
  name: string;
  score: number;
  maxScore: number;
  percentile?: number;
  date: Date;
  notes?: string;
}

export interface InternalTestResult {
  testName: string;
  category: 'accuracy' | 'consistency' | 'safety' | 'latency' | 'cost';
  passed: boolean;
  score?: number;
  details?: string;
  date: Date;
}

export interface ModelComparison {
  models: ModelCard[];
  comparisonDate: Date;
  metrics: {
    metric: string;
    values: Record<string, number | string>;
    winner?: string;
  }[];
  recommendation?: string;
}

// ============================================================================
// MODEL REGISTRY
// ============================================================================

const modelCards = new Map<string, ModelCard>();

/**
 * Get model card ID
 */
function getModelCardId(provider: string, modelName: string): string {
  return `${provider.toLowerCase()}:${modelName.toLowerCase()}`;
}

/**
 * Create or update a model card
 */
export function upsertModelCard(card: Omit<ModelCard, 'modelId' | 'createdAt' | 'updatedAt'>): ModelCard {
  const modelId = getModelCardId(card.provider, card.modelName);
  const existingCard = modelCards.get(modelId);

  const fullCard: ModelCard = {
    ...card,
    modelId,
    createdAt: existingCard?.createdAt || new Date(),
    updatedAt: new Date(),
  };

  modelCards.set(modelId, fullCard);
  return fullCard;
}

/**
 * Get a model card
 */
export function getModelCard(provider: string, modelName: string): ModelCard | undefined {
  return modelCards.get(getModelCardId(provider, modelName));
}

/**
 * Get all model cards
 */
export function getAllModelCards(): ModelCard[] {
  return Array.from(modelCards.values());
}

/**
 * Get model cards by provider
 */
export function getModelCardsByProvider(provider: string): ModelCard[] {
  return Array.from(modelCards.values()).filter(
    c => c.provider.toLowerCase() === provider.toLowerCase()
  );
}

// ============================================================================
// DEFAULT MODEL CARDS
// ============================================================================

/**
 * Initialize default model cards for known providers
 */
export function initializeDefaultModelCards(): void {
  // OpenAI GPT-4 Turbo
  upsertModelCard({
    provider: 'OpenAI',
    modelName: 'gpt-4-turbo',
    version: '2024-04-09',
    releaseDate: new Date('2024-04-09'),
    status: 'active',
    description: 'Most capable GPT-4 model with vision capabilities and improved instruction following.',
    intendedUse: [
      'Complex reasoning tasks',
      'Content generation',
      'Code assistance',
      'Document analysis',
    ],
    outOfScopeUse: [
      'Medical diagnosis',
      'Legal advice',
      'Financial trading decisions',
    ],
    architecture: {
      type: 'Transformer (Decoder-only)',
      parameters: 'Undisclosed (~1.7T estimated)',
      contextWindow: 128000,
      trainingCutoff: '2023-12',
      languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'it', 'nl'],
    },
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      imageUnderstanding: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemPrompt: true,
    },
    pricing: {
      inputCostPer1k: 0.01,
      outputCostPer1k: 0.03,
      currency: 'USD',
      tier: 'premium',
    },
    performance: {
      avgLatencyMs: 1500,
      p95LatencyMs: 4000,
      tokensPerSecond: 40,
      reliability: 99.5,
    },
    evaluation: {
      benchmarks: [
        { name: 'MMLU', score: 86.4, maxScore: 100, date: new Date('2024-04-01') },
        { name: 'HumanEval', score: 87.1, maxScore: 100, date: new Date('2024-04-01') },
        { name: 'GSM8K', score: 92.0, maxScore: 100, date: new Date('2024-04-01') },
      ],
      internalTests: [
        { testName: 'Brand Perception Accuracy', category: 'accuracy', passed: true, score: 88, date: new Date() },
        { testName: 'Response Consistency', category: 'consistency', passed: true, score: 85, date: new Date() },
      ],
      lastEvaluated: new Date(),
    },
    limitations: [
      'May hallucinate facts or citations',
      'Knowledge cutoff limits current information',
      'Can be verbose in responses',
      'Occasional inconsistency in multi-turn conversations',
    ],
    ethicalConsiderations: [
      'May reflect biases present in training data',
      'Should not be used for high-stakes decisions without human review',
      'Privacy considerations for user data in prompts',
    ],
    createdBy: 'system',
  });

  // Anthropic Claude 3 Opus
  upsertModelCard({
    provider: 'Anthropic',
    modelName: 'claude-3-opus',
    version: '2024-02-29',
    releaseDate: new Date('2024-02-29'),
    status: 'active',
    description: 'Most intelligent Claude model with exceptional reasoning and analysis capabilities.',
    intendedUse: [
      'Complex analysis and research',
      'Nuanced content creation',
      'Advanced coding tasks',
      'Long document understanding',
    ],
    outOfScopeUse: [
      'Real-time safety-critical systems',
      'Autonomous decision-making',
      'Medical treatment recommendations',
    ],
    architecture: {
      type: 'Transformer (Constitutional AI)',
      parameters: 'Undisclosed',
      contextWindow: 200000,
      trainingCutoff: '2024-01',
      languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'it'],
    },
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      imageUnderstanding: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemPrompt: true,
    },
    pricing: {
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
      currency: 'USD',
      tier: 'premium',
    },
    performance: {
      avgLatencyMs: 2000,
      p95LatencyMs: 5000,
      tokensPerSecond: 35,
      reliability: 99.2,
    },
    evaluation: {
      benchmarks: [
        { name: 'MMLU', score: 86.8, maxScore: 100, date: new Date('2024-03-01') },
        { name: 'HumanEval', score: 84.9, maxScore: 100, date: new Date('2024-03-01') },
        { name: 'GSM8K', score: 95.0, maxScore: 100, date: new Date('2024-03-01') },
      ],
      internalTests: [
        { testName: 'Brand Perception Accuracy', category: 'accuracy', passed: true, score: 90, date: new Date() },
        { testName: 'Response Consistency', category: 'consistency', passed: true, score: 88, date: new Date() },
      ],
      lastEvaluated: new Date(),
    },
    limitations: [
      'Higher latency than smaller models',
      'More expensive per token',
      'May be overly cautious on edge cases',
    ],
    ethicalConsiderations: [
      'Trained with Constitutional AI for safety',
      'May refuse certain requests deemed potentially harmful',
      'Designed to be helpful, harmless, and honest',
    ],
    createdBy: 'system',
  });

  // Google Gemini Pro
  upsertModelCard({
    provider: 'Google',
    modelName: 'gemini-1.5-pro',
    version: '2024-05',
    releaseDate: new Date('2024-05-14'),
    status: 'active',
    description: 'Advanced multimodal model with massive context window and strong reasoning.',
    intendedUse: [
      'Long document analysis',
      'Multi-modal understanding',
      'Complex reasoning',
      'Code generation and review',
    ],
    outOfScopeUse: [
      'Autonomous systems',
      'Medical diagnosis',
      'Legal judgment',
    ],
    architecture: {
      type: 'Multimodal Transformer',
      parameters: 'Undisclosed',
      contextWindow: 1000000,
      trainingCutoff: '2024-03',
      languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'ko', 'pt', 'it', 'ar', 'hi'],
    },
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      imageUnderstanding: true,
      functionCalling: true,
      jsonMode: true,
      streaming: true,
      systemPrompt: true,
    },
    pricing: {
      inputCostPer1k: 0.00125,
      outputCostPer1k: 0.005,
      currency: 'USD',
      tier: 'standard',
    },
    performance: {
      avgLatencyMs: 1200,
      p95LatencyMs: 3500,
      tokensPerSecond: 50,
      reliability: 98.8,
    },
    evaluation: {
      benchmarks: [
        { name: 'MMLU', score: 85.9, maxScore: 100, date: new Date('2024-05-01') },
        { name: 'HumanEval', score: 71.9, maxScore: 100, date: new Date('2024-05-01') },
        { name: 'GSM8K', score: 91.7, maxScore: 100, date: new Date('2024-05-01') },
      ],
      internalTests: [
        { testName: 'Brand Perception Accuracy', category: 'accuracy', passed: true, score: 82, date: new Date() },
        { testName: 'Response Consistency', category: 'consistency', passed: true, score: 80, date: new Date() },
      ],
      lastEvaluated: new Date(),
    },
    limitations: [
      'Occasional grounding issues with factual claims',
      'May be inconsistent across long conversations',
      'API availability varies by region',
    ],
    ethicalConsiderations: [
      'Subject to Google AI Principles',
      'Safety filters may be more restrictive',
      'Usage subject to Gemini API terms',
    ],
    createdBy: 'system',
  });

  // Perplexity Sonar
  upsertModelCard({
    provider: 'Perplexity',
    modelName: 'sonar-large',
    version: '2024-09',
    status: 'active',
    description: 'Search-augmented LLM optimized for real-time information retrieval and synthesis.',
    intendedUse: [
      'Real-time information lookup',
      'Research and fact-checking',
      'Current events analysis',
      'Citation-backed responses',
    ],
    outOfScopeUse: [
      'Long-form creative writing',
      'Code execution',
      'Offline use cases',
    ],
    architecture: {
      type: 'RAG-enhanced LLM',
      parameters: 'Undisclosed',
      contextWindow: 128000,
      trainingCutoff: 'Real-time (with search)',
      languages: ['en', 'es', 'fr', 'de', 'zh', 'ja', 'pt'],
    },
    capabilities: {
      textGeneration: true,
      codeGeneration: true,
      imageUnderstanding: false,
      functionCalling: false,
      jsonMode: true,
      streaming: true,
      systemPrompt: true,
    },
    pricing: {
      inputCostPer1k: 0.001,
      outputCostPer1k: 0.001,
      currency: 'USD',
      tier: 'standard',
    },
    performance: {
      avgLatencyMs: 2500,
      p95LatencyMs: 6000,
      tokensPerSecond: 30,
      reliability: 98.5,
    },
    evaluation: {
      benchmarks: [
        { name: 'Freshness Score', score: 95, maxScore: 100, date: new Date() },
        { name: 'Citation Accuracy', score: 88, maxScore: 100, date: new Date() },
      ],
      internalTests: [
        { testName: 'Brand Perception Accuracy', category: 'accuracy', passed: true, score: 85, date: new Date() },
        { testName: 'Citation Verification', category: 'accuracy', passed: true, score: 88, date: new Date() },
      ],
      lastEvaluated: new Date(),
    },
    limitations: [
      'Dependent on search index quality',
      'May cite outdated sources',
      'Less capable for non-search tasks',
      'Higher latency due to search step',
    ],
    ethicalConsiderations: [
      'Citations may include biased sources',
      'Search results influence model output',
      'Real-time nature requires verification',
    ],
    createdBy: 'system',
  });
}

// ============================================================================
// COMPARISON
// ============================================================================

/**
 * Compare multiple models
 */
export function compareModels(modelIds: string[]): ModelComparison {
  const models = modelIds
    .map(id => modelCards.get(id))
    .filter((m): m is ModelCard => m !== undefined);

  if (models.length < 2) {
    throw new Error('Need at least 2 models to compare');
  }

  const metrics: ModelComparison['metrics'] = [];

  // Context Window
  const contextValues: Record<string, number> = {};
  let maxContext = '';
  let maxContextValue = 0;
  for (const m of models) {
    contextValues[m.modelId] = m.architecture.contextWindow;
    if (m.architecture.contextWindow > maxContextValue) {
      maxContextValue = m.architecture.contextWindow;
      maxContext = m.modelId;
    }
  }
  metrics.push({
    metric: 'Context Window',
    values: contextValues,
    winner: maxContext,
  });

  // Input Cost
  const inputCostValues: Record<string, number> = {};
  let minCost = '';
  let minCostValue = Infinity;
  for (const m of models) {
    inputCostValues[m.modelId] = m.pricing.inputCostPer1k;
    if (m.pricing.inputCostPer1k < minCostValue) {
      minCostValue = m.pricing.inputCostPer1k;
      minCost = m.modelId;
    }
  }
  metrics.push({
    metric: 'Input Cost ($/1k)',
    values: inputCostValues,
    winner: minCost,
  });

  // Latency
  const latencyValues: Record<string, number> = {};
  let fastestModel = '';
  let fastestLatency = Infinity;
  for (const m of models) {
    latencyValues[m.modelId] = m.performance.avgLatencyMs;
    if (m.performance.avgLatencyMs < fastestLatency) {
      fastestLatency = m.performance.avgLatencyMs;
      fastestModel = m.modelId;
    }
  }
  metrics.push({
    metric: 'Avg Latency (ms)',
    values: latencyValues,
    winner: fastestModel,
  });

  // Reliability
  const reliabilityValues: Record<string, number> = {};
  let mostReliable = '';
  let highestReliability = 0;
  for (const m of models) {
    reliabilityValues[m.modelId] = m.performance.reliability;
    if (m.performance.reliability > highestReliability) {
      highestReliability = m.performance.reliability;
      mostReliable = m.modelId;
    }
  }
  metrics.push({
    metric: 'Reliability (%)',
    values: reliabilityValues,
    winner: mostReliable,
  });

  return {
    models,
    comparisonDate: new Date(),
    metrics,
    recommendation: `Based on the comparison, ${mostReliable.split(':')[0]} offers the best reliability, while ${minCost.split(':')[0]} is most cost-effective.`,
  };
}

// ============================================================================
// RENDERING
// ============================================================================

/**
 * Render model card as markdown
 */
export function renderModelCardMarkdown(card: ModelCard): string {
  const lines: string[] = [
    `# Model Card: ${card.provider} ${card.modelName}`,
    '',
    `**Version:** ${card.version}`,
    `**Status:** ${card.status}`,
    card.releaseDate ? `**Release Date:** ${card.releaseDate.toISOString().split('T')[0]}` : '',
    '',
    '## Description',
    card.description,
    '',
    '## Intended Use',
    ...card.intendedUse.map(u => `- ${u}`),
    '',
    '## Architecture',
    `- **Type:** ${card.architecture.type}`,
    card.architecture.parameters ? `- **Parameters:** ${card.architecture.parameters}` : '',
    `- **Context Window:** ${card.architecture.contextWindow.toLocaleString()} tokens`,
    card.architecture.trainingCutoff ? `- **Training Cutoff:** ${card.architecture.trainingCutoff}` : '',
    `- **Languages:** ${card.architecture.languages.join(', ')}`,
    '',
    '## Capabilities',
    `| Capability | Supported |`,
    `|------------|-----------|`,
    `| Text Generation | ${card.capabilities.textGeneration ? '✓' : '✗'} |`,
    `| Code Generation | ${card.capabilities.codeGeneration ? '✓' : '✗'} |`,
    `| Image Understanding | ${card.capabilities.imageUnderstanding ? '✓' : '✗'} |`,
    `| Function Calling | ${card.capabilities.functionCalling ? '✓' : '✗'} |`,
    `| JSON Mode | ${card.capabilities.jsonMode ? '✓' : '✗'} |`,
    `| Streaming | ${card.capabilities.streaming ? '✓' : '✗'} |`,
    '',
    '## Pricing',
    `- **Input:** $${card.pricing.inputCostPer1k}/1K tokens`,
    `- **Output:** $${card.pricing.outputCostPer1k}/1K tokens`,
    '',
    '## Performance',
    `- **Avg Latency:** ${card.performance.avgLatencyMs}ms`,
    `- **P95 Latency:** ${card.performance.p95LatencyMs}ms`,
    `- **Tokens/sec:** ${card.performance.tokensPerSecond}`,
    `- **Reliability:** ${card.performance.reliability}%`,
    '',
    '## Limitations',
    ...card.limitations.map(l => `- ${l}`),
    '',
    '## Ethical Considerations',
    ...card.ethicalConsiderations.map(e => `- ${e}`),
    '',
    `---`,
    `*Last updated: ${card.updatedAt.toISOString()}*`,
  ];

  return lines.filter(l => l !== '').join('\n');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  upsertModelCard,
  getModelCard,
  getAllModelCards,
  getModelCardsByProvider,
  initializeDefaultModelCards,
  compareModels,
  renderModelCardMarkdown,
};
