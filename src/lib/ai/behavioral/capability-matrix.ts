/**
 * Capability Tracking Matrix
 *
 * Phase 4, Week 8 Extended - LLM Behavioral Research Checklist
 *
 * Features:
 * - Track capabilities per model (knowledge, reasoning, multimodal)
 * - Capability scoring and comparison
 * - Capability-based routing
 * - Strength/weakness profiles
 */

// ============================================================================
// TYPES
// ============================================================================

export type CapabilityDomain =
  | 'knowledge'           // Factual knowledge
  | 'reasoning'           // Logical reasoning
  | 'creativity'          // Creative generation
  | 'coding'              // Code generation/analysis
  | 'math'                // Mathematical reasoning
  | 'multilingual'        // Non-English capabilities
  | 'multimodal'          // Image/audio understanding
  | 'long_context'        // Long document handling
  | 'instruction_following' // Following complex instructions
  | 'safety';             // Safe/responsible outputs

export type CapabilityLevel = 'none' | 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface CapabilityScore {
  domain: CapabilityDomain;
  level: CapabilityLevel;
  score: number;          // 0-100
  confidence: number;     // 0-1, based on test coverage
  benchmarks: string[];   // Which benchmarks support this
  lastUpdated: Date;
}

export interface ModelCapabilityProfile {
  providerId: string;
  modelId: string;
  modelVersion: string;
  capabilities: CapabilityScore[];
  overallScore: number;
  strengths: CapabilityDomain[];
  weaknesses: CapabilityDomain[];
  bestUseCases: string[];
  limitations: string[];
  lastAssessed: Date;
}

export interface CapabilityComparison {
  models: string[];
  byDomain: Record<CapabilityDomain, Record<string, number>>;
  winner: Record<CapabilityDomain, string>;
  recommendations: Record<string, string[]>;
}

export interface CapabilityRequirement {
  domain: CapabilityDomain;
  minimumLevel: CapabilityLevel;
  minimumScore: number;
  weight: number;  // Importance for this task
}

// ============================================================================
// LEVEL DEFINITIONS
// ============================================================================

const LEVEL_SCORES: Record<CapabilityLevel, { min: number; max: number }> = {
  none: { min: 0, max: 20 },
  basic: { min: 20, max: 40 },
  intermediate: { min: 40, max: 60 },
  advanced: { min: 60, max: 80 },
  expert: { min: 80, max: 100 },
};

/**
 * Convert score to level
 */
export function scoreToLevel(score: number): CapabilityLevel {
  for (const [level, range] of Object.entries(LEVEL_SCORES) as Array<[CapabilityLevel, { min: number; max: number }]>) {
    if (score >= range.min && score < range.max) {
      return level;
    }
  }
  return score >= 80 ? 'expert' : 'none';
}

/**
 * Convert level to minimum score
 */
export function levelToMinScore(level: CapabilityLevel): number {
  return LEVEL_SCORES[level].min;
}

// ============================================================================
// DEFAULT PROFILES
// ============================================================================

const DEFAULT_PROFILES: ModelCapabilityProfile[] = [
  {
    providerId: 'openai',
    modelId: 'gpt-4-turbo',
    modelVersion: '2024-01',
    capabilities: [
      { domain: 'knowledge', level: 'expert', score: 90, confidence: 0.95, benchmarks: ['MMLU', 'TriviaQA'], lastUpdated: new Date() },
      { domain: 'reasoning', level: 'expert', score: 88, confidence: 0.92, benchmarks: ['ARC', 'HellaSwag'], lastUpdated: new Date() },
      { domain: 'creativity', level: 'advanced', score: 78, confidence: 0.85, benchmarks: ['HumanEval'], lastUpdated: new Date() },
      { domain: 'coding', level: 'expert', score: 85, confidence: 0.90, benchmarks: ['HumanEval', 'MBPP'], lastUpdated: new Date() },
      { domain: 'math', level: 'advanced', score: 75, confidence: 0.88, benchmarks: ['GSM8K', 'MATH'], lastUpdated: new Date() },
      { domain: 'multilingual', level: 'advanced', score: 72, confidence: 0.80, benchmarks: ['MGSM'], lastUpdated: new Date() },
      { domain: 'multimodal', level: 'advanced', score: 80, confidence: 0.85, benchmarks: ['MMMU', 'VQA'], lastUpdated: new Date() },
      { domain: 'long_context', level: 'expert', score: 85, confidence: 0.90, benchmarks: ['LongBench'], lastUpdated: new Date() },
      { domain: 'instruction_following', level: 'expert', score: 92, confidence: 0.95, benchmarks: ['IFEval'], lastUpdated: new Date() },
      { domain: 'safety', level: 'advanced', score: 78, confidence: 0.85, benchmarks: ['TruthfulQA'], lastUpdated: new Date() },
    ],
    overallScore: 82,
    strengths: ['knowledge', 'reasoning', 'instruction_following', 'coding'],
    weaknesses: ['multilingual'],
    bestUseCases: ['Complex analysis', 'Code generation', 'Long-form content'],
    limitations: ['May be verbose', 'Occasional hallucinations on recent events'],
    lastAssessed: new Date(),
  },
  {
    providerId: 'anthropic',
    modelId: 'claude-3-opus',
    modelVersion: '2024-02',
    capabilities: [
      { domain: 'knowledge', level: 'expert', score: 88, confidence: 0.93, benchmarks: ['MMLU', 'TriviaQA'], lastUpdated: new Date() },
      { domain: 'reasoning', level: 'expert', score: 92, confidence: 0.95, benchmarks: ['ARC', 'HellaSwag'], lastUpdated: new Date() },
      { domain: 'creativity', level: 'expert', score: 85, confidence: 0.88, benchmarks: ['Creative Writing'], lastUpdated: new Date() },
      { domain: 'coding', level: 'expert', score: 88, confidence: 0.92, benchmarks: ['HumanEval', 'MBPP'], lastUpdated: new Date() },
      { domain: 'math', level: 'expert', score: 82, confidence: 0.90, benchmarks: ['GSM8K', 'MATH'], lastUpdated: new Date() },
      { domain: 'multilingual', level: 'advanced', score: 75, confidence: 0.82, benchmarks: ['MGSM'], lastUpdated: new Date() },
      { domain: 'multimodal', level: 'advanced', score: 78, confidence: 0.85, benchmarks: ['MMMU'], lastUpdated: new Date() },
      { domain: 'long_context', level: 'expert', score: 95, confidence: 0.98, benchmarks: ['LongBench'], lastUpdated: new Date() },
      { domain: 'instruction_following', level: 'expert', score: 90, confidence: 0.94, benchmarks: ['IFEval'], lastUpdated: new Date() },
      { domain: 'safety', level: 'expert', score: 92, confidence: 0.95, benchmarks: ['TruthfulQA', 'BBQ'], lastUpdated: new Date() },
    ],
    overallScore: 86,
    strengths: ['reasoning', 'safety', 'long_context', 'coding'],
    weaknesses: ['multilingual'],
    bestUseCases: ['Nuanced analysis', 'Long document processing', 'Safety-critical applications'],
    limitations: ['Can be overly cautious', 'May refuse edge cases'],
    lastAssessed: new Date(),
  },
  {
    providerId: 'google',
    modelId: 'gemini-1.5-pro',
    modelVersion: '2024-02',
    capabilities: [
      { domain: 'knowledge', level: 'advanced', score: 82, confidence: 0.88, benchmarks: ['MMLU'], lastUpdated: new Date() },
      { domain: 'reasoning', level: 'advanced', score: 80, confidence: 0.85, benchmarks: ['ARC'], lastUpdated: new Date() },
      { domain: 'creativity', level: 'advanced', score: 75, confidence: 0.82, benchmarks: ['Creative Writing'], lastUpdated: new Date() },
      { domain: 'coding', level: 'advanced', score: 78, confidence: 0.85, benchmarks: ['HumanEval'], lastUpdated: new Date() },
      { domain: 'math', level: 'advanced', score: 78, confidence: 0.85, benchmarks: ['GSM8K'], lastUpdated: new Date() },
      { domain: 'multilingual', level: 'expert', score: 88, confidence: 0.92, benchmarks: ['MGSM', 'XLSum'], lastUpdated: new Date() },
      { domain: 'multimodal', level: 'expert', score: 92, confidence: 0.95, benchmarks: ['MMMU', 'VQA', 'DocVQA'], lastUpdated: new Date() },
      { domain: 'long_context', level: 'expert', score: 98, confidence: 0.98, benchmarks: ['LongBench', 'Needle'], lastUpdated: new Date() },
      { domain: 'instruction_following', level: 'advanced', score: 78, confidence: 0.82, benchmarks: ['IFEval'], lastUpdated: new Date() },
      { domain: 'safety', level: 'advanced', score: 75, confidence: 0.80, benchmarks: ['TruthfulQA'], lastUpdated: new Date() },
    ],
    overallScore: 82,
    strengths: ['multimodal', 'long_context', 'multilingual'],
    weaknesses: ['safety', 'instruction_following'],
    bestUseCases: ['Multimodal tasks', 'Very long documents', 'Non-English content'],
    limitations: ['May be less precise on complex instructions'],
    lastAssessed: new Date(),
  },
  {
    providerId: 'perplexity',
    modelId: 'sonar-large',
    modelVersion: '2024-01',
    capabilities: [
      { domain: 'knowledge', level: 'expert', score: 92, confidence: 0.95, benchmarks: ['Real-time search'], lastUpdated: new Date() },
      { domain: 'reasoning', level: 'advanced', score: 75, confidence: 0.80, benchmarks: ['ARC'], lastUpdated: new Date() },
      { domain: 'creativity', level: 'intermediate', score: 55, confidence: 0.70, benchmarks: [], lastUpdated: new Date() },
      { domain: 'coding', level: 'intermediate', score: 58, confidence: 0.75, benchmarks: ['HumanEval'], lastUpdated: new Date() },
      { domain: 'math', level: 'intermediate', score: 55, confidence: 0.72, benchmarks: ['GSM8K'], lastUpdated: new Date() },
      { domain: 'multilingual', level: 'intermediate', score: 60, confidence: 0.75, benchmarks: [], lastUpdated: new Date() },
      { domain: 'multimodal', level: 'none', score: 0, confidence: 1.0, benchmarks: [], lastUpdated: new Date() },
      { domain: 'long_context', level: 'intermediate', score: 55, confidence: 0.70, benchmarks: [], lastUpdated: new Date() },
      { domain: 'instruction_following', level: 'advanced', score: 72, confidence: 0.80, benchmarks: [], lastUpdated: new Date() },
      { domain: 'safety', level: 'advanced', score: 70, confidence: 0.78, benchmarks: [], lastUpdated: new Date() },
    ],
    overallScore: 59,
    strengths: ['knowledge'],
    weaknesses: ['multimodal', 'creativity', 'coding'],
    bestUseCases: ['Current events', 'Fact-checking', 'Research with citations'],
    limitations: ['No image support', 'Limited creative tasks'],
    lastAssessed: new Date(),
  },
];

// ============================================================================
// STORAGE
// ============================================================================

const profileRegistry = new Map<string, ModelCapabilityProfile>();

// Initialize with defaults
DEFAULT_PROFILES.forEach(p => {
  profileRegistry.set(`${p.providerId}:${p.modelId}`, p);
});

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

/**
 * Get model profile
 */
export function getProfile(providerId: string, modelId: string): ModelCapabilityProfile | undefined {
  return profileRegistry.get(`${providerId}:${modelId}`);
}

/**
 * Get all profiles
 */
export function getAllProfiles(): ModelCapabilityProfile[] {
  return Array.from(profileRegistry.values());
}

/**
 * Update capability score
 */
export function updateCapability(
  providerId: string,
  modelId: string,
  domain: CapabilityDomain,
  score: number,
  benchmarks: string[] = []
): ModelCapabilityProfile | null {
  const key = `${providerId}:${modelId}`;
  const profile = profileRegistry.get(key);

  if (!profile) return null;

  const capabilityIndex = profile.capabilities.findIndex(c => c.domain === domain);

  if (capabilityIndex >= 0) {
    profile.capabilities[capabilityIndex] = {
      domain,
      level: scoreToLevel(score),
      score,
      confidence: Math.min(profile.capabilities[capabilityIndex].confidence + 0.05, 1),
      benchmarks: [...new Set([...profile.capabilities[capabilityIndex].benchmarks, ...benchmarks])],
      lastUpdated: new Date(),
    };
  } else {
    profile.capabilities.push({
      domain,
      level: scoreToLevel(score),
      score,
      confidence: 0.5,
      benchmarks,
      lastUpdated: new Date(),
    });
  }

  // Recalculate overall
  profile.overallScore = profile.capabilities.reduce((sum, c) => sum + c.score, 0) / profile.capabilities.length;
  profile.lastAssessed = new Date();

  // Update strengths/weaknesses
  const sorted = [...profile.capabilities].sort((a, b) => b.score - a.score);
  profile.strengths = sorted.slice(0, 3).map(c => c.domain);
  profile.weaknesses = sorted.slice(-2).filter(c => c.score < 70).map(c => c.domain);

  return profile;
}

/**
 * Get capability score
 */
export function getCapabilityScore(
  providerId: string,
  modelId: string,
  domain: CapabilityDomain
): number {
  const profile = getProfile(providerId, modelId);
  if (!profile) return 0;

  const capability = profile.capabilities.find(c => c.domain === domain);
  return capability?.score ?? 0;
}

// ============================================================================
// COMPARISON & ROUTING
// ============================================================================

/**
 * Compare models across capabilities
 */
export function compareModels(modelIds: Array<{ providerId: string; modelId: string }>): CapabilityComparison {
  const domains: CapabilityDomain[] = [
    'knowledge', 'reasoning', 'creativity', 'coding', 'math',
    'multilingual', 'multimodal', 'long_context', 'instruction_following', 'safety'
  ];

  const byDomain: Record<CapabilityDomain, Record<string, number>> = {} as any;
  const winner: Record<CapabilityDomain, string> = {} as any;
  const recommendations: Record<string, string[]> = {};

  // Initialize
  for (const domain of domains) {
    byDomain[domain] = {};
  }

  // Collect scores
  for (const { providerId, modelId } of modelIds) {
    const key = `${providerId}:${modelId}`;
    recommendations[key] = [];

    const profile = getProfile(providerId, modelId);
    if (!profile) continue;

    for (const domain of domains) {
      const capability = profile.capabilities.find(c => c.domain === domain);
      byDomain[domain][key] = capability?.score ?? 0;
    }
  }

  // Find winners
  for (const domain of domains) {
    let maxScore = -1;
    let winnerKey = '';

    for (const [key, score] of Object.entries(byDomain[domain])) {
      if (score > maxScore) {
        maxScore = score;
        winnerKey = key;
      }
    }

    winner[domain] = winnerKey;

    // Add recommendation to winner
    if (winnerKey && recommendations[winnerKey]) {
      recommendations[winnerKey].push(`Best for ${domain.replace('_', ' ')}`);
    }
  }

  return {
    models: modelIds.map(m => `${m.providerId}:${m.modelId}`),
    byDomain,
    winner,
    recommendations,
  };
}

/**
 * Find best model for requirements
 */
export function findBestModel(
  requirements: CapabilityRequirement[]
): { modelId: string; score: number; missingCapabilities: CapabilityDomain[] }[] {
  const profiles = getAllProfiles();
  const results: Array<{ modelId: string; score: number; missingCapabilities: CapabilityDomain[] }> = [];

  for (const profile of profiles) {
    const modelId = `${profile.providerId}:${profile.modelId}`;
    let totalWeight = 0;
    let weightedScore = 0;
    const missingCapabilities: CapabilityDomain[] = [];

    for (const req of requirements) {
      totalWeight += req.weight;

      const capability = profile.capabilities.find(c => c.domain === req.domain);
      const score = capability?.score ?? 0;

      if (score < req.minimumScore) {
        missingCapabilities.push(req.domain);
        weightedScore += (score / req.minimumScore) * req.weight * 0.5;  // Partial credit
      } else {
        weightedScore += req.weight * (score / 100);
      }
    }

    results.push({
      modelId,
      score: totalWeight > 0 ? (weightedScore / totalWeight) * 100 : 0,
      missingCapabilities,
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

/**
 * Get routing recommendation for task
 */
export function getRoutingRecommendation(
  taskDescription: string,
  requirements: CapabilityRequirement[]
): { primaryModel: string; fallbackModel: string; reason: string } {
  const ranked = findBestModel(requirements);

  if (ranked.length === 0) {
    return {
      primaryModel: 'openai:gpt-4-turbo',
      fallbackModel: 'anthropic:claude-3-opus',
      reason: 'No profiles available, using defaults',
    };
  }

  const primary = ranked[0];
  const fallback = ranked.length > 1 ? ranked[1] : ranked[0];

  let reason = `${primary.modelId} scores ${primary.score.toFixed(0)}% on requirements`;

  if (primary.missingCapabilities.length > 0) {
    reason += ` (weak in: ${primary.missingCapabilities.join(', ')})`;
  }

  return {
    primaryModel: primary.modelId,
    fallbackModel: fallback.modelId,
    reason,
  };
}

// ============================================================================
// CAPABILITY MATRIX VIEW
// ============================================================================

/**
 * Get full capability matrix for visualization
 */
export function getCapabilityMatrix(): {
  domains: CapabilityDomain[];
  models: Array<{
    id: string;
    name: string;
    scores: Record<CapabilityDomain, number>;
    overall: number;
  }>;
} {
  const domains: CapabilityDomain[] = [
    'knowledge', 'reasoning', 'creativity', 'coding', 'math',
    'multilingual', 'multimodal', 'long_context', 'instruction_following', 'safety'
  ];

  const models = getAllProfiles().map(profile => ({
    id: `${profile.providerId}:${profile.modelId}`,
    name: `${profile.providerId}/${profile.modelId}`,
    scores: Object.fromEntries(
      domains.map(d => [d, profile.capabilities.find(c => c.domain === d)?.score ?? 0])
    ) as Record<CapabilityDomain, number>,
    overall: profile.overallScore,
  }));

  return { domains, models };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Level utilities
  scoreToLevel,
  levelToMinScore,

  // Profile management
  getProfile,
  getAllProfiles,
  updateCapability,
  getCapabilityScore,

  // Comparison & routing
  compareModels,
  findBestModel,
  getRoutingRecommendation,

  // Visualization
  getCapabilityMatrix,

  // Constants
  LEVEL_SCORES,
  DEFAULT_PROFILES,
};
