/**
 * AI Dependencies Allowlist
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - Approved AI packages and versions
 * - Model allowlist management
 * - API endpoint verification
 * - Supply chain security for AI
 */

// ============================================================================
// TYPES
// ============================================================================

export type PackageStatus = 'approved' | 'pending' | 'deprecated' | 'blocked';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AllowedPackage {
  name: string;
  approvedVersions: string[];  // Semver ranges
  minVersion?: string;
  maxVersion?: string;
  status: PackageStatus;
  riskLevel: RiskLevel;
  securityNotes?: string;
  lastReviewed: Date;
  reviewedBy: string;
  alternatives?: string[];
  usageGuidelines?: string;
}

export interface AllowedModel {
  provider: string;
  modelId: string;
  displayName: string;
  status: PackageStatus;
  riskLevel: RiskLevel;
  maxInputTokens?: number;
  maxOutputTokens?: number;
  allowedUseCases: string[];
  blockedUseCases?: string[];
  costPerToken?: { input: number; output: number };
  securityNotes?: string;
  lastReviewed: Date;
}

export interface AllowedEndpoint {
  provider: string;
  endpoint: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE')[];
  status: PackageStatus;
  riskLevel: RiskLevel;
  rateLimitRpm?: number;
  requiresAuth: boolean;
  securityNotes?: string;
}

export interface ValidationResult {
  allowed: boolean;
  status: PackageStatus;
  riskLevel: RiskLevel;
  reason: string;
  recommendations?: string[];
}

// ============================================================================
// APPROVED AI PACKAGES
// ============================================================================

export const APPROVED_PACKAGES: AllowedPackage[] = [
  // OpenAI
  {
    name: 'openai',
    approvedVersions: ['>=4.0.0', '<5.0.0'],
    minVersion: '4.0.0',
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
    usageGuidelines: 'Use with rate limiting and cost controls',
  },
  // Anthropic
  {
    name: '@anthropic-ai/sdk',
    approvedVersions: ['>=0.20.0'],
    minVersion: '0.20.0',
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // Google AI
  {
    name: '@google/generative-ai',
    approvedVersions: ['>=0.1.0'],
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // LangChain
  {
    name: 'langchain',
    approvedVersions: ['>=0.1.0', '<1.0.0'],
    status: 'approved',
    riskLevel: 'medium',
    securityNotes: 'Verify all chain configurations. Disable arbitrary code execution.',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
    usageGuidelines: 'Do not use with untrusted inputs in agent mode',
  },
  {
    name: '@langchain/core',
    approvedVersions: ['>=0.1.0'],
    status: 'approved',
    riskLevel: 'medium',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // Vector stores
  {
    name: '@pinecone-database/pinecone',
    approvedVersions: ['>=2.0.0'],
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  {
    name: 'chromadb',
    approvedVersions: ['>=1.0.0'],
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // Tokenizers
  {
    name: 'tiktoken',
    approvedVersions: ['>=1.0.0'],
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  {
    name: 'gpt-tokenizer',
    approvedVersions: ['>=2.0.0'],
    status: 'approved',
    riskLevel: 'low',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // Embeddings
  {
    name: '@huggingface/inference',
    approvedVersions: ['>=2.0.0'],
    status: 'approved',
    riskLevel: 'medium',
    securityNotes: 'Only use with approved model IDs',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
  // Blocked packages
  {
    name: 'auto-gpt',
    approvedVersions: [],
    status: 'blocked',
    riskLevel: 'critical',
    securityNotes: 'Autonomous agents pose unacceptable security risks',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
    alternatives: ['langchain with supervised chains'],
  },
  {
    name: 'baby-agi',
    approvedVersions: [],
    status: 'blocked',
    riskLevel: 'critical',
    securityNotes: 'Autonomous agents pose unacceptable security risks',
    lastReviewed: new Date('2024-12-01'),
    reviewedBy: 'security-team',
  },
];

// ============================================================================
// APPROVED MODELS
// ============================================================================

export const APPROVED_MODELS: AllowedModel[] = [
  // OpenAI
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    costPerToken: { input: 0.005, output: 0.015 },
    lastReviewed: new Date('2024-12-01'),
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    costPerToken: { input: 0.00015, output: 0.0006 },
    lastReviewed: new Date('2024-12-01'),
  },
  {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 128000,
    maxOutputTokens: 4096,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  // Anthropic
  {
    provider: 'anthropic',
    modelId: 'claude-3-5-sonnet-20241022',
    displayName: 'Claude 3.5 Sonnet',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 200000,
    maxOutputTokens: 8192,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  {
    provider: 'anthropic',
    modelId: 'claude-3-opus-20240229',
    displayName: 'Claude 3 Opus',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 200000,
    maxOutputTokens: 4096,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  {
    provider: 'anthropic',
    modelId: 'claude-3-haiku-20240307',
    displayName: 'Claude 3 Haiku',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 200000,
    maxOutputTokens: 4096,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  // Google
  {
    provider: 'google',
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  {
    provider: 'google',
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 1000000,
    maxOutputTokens: 8192,
    allowedUseCases: ['analysis', 'recommendations', 'summarization'],
    lastReviewed: new Date('2024-12-01'),
  },
  // Perplexity
  {
    provider: 'perplexity',
    modelId: 'llama-3.1-sonar-large-128k-online',
    displayName: 'Sonar Large Online',
    status: 'approved',
    riskLevel: 'low',
    maxInputTokens: 128000,
    allowedUseCases: ['research', 'web-search', 'analysis'],
    lastReviewed: new Date('2024-12-01'),
  },
  // Deprecated models
  {
    provider: 'openai',
    modelId: 'gpt-3.5-turbo',
    displayName: 'GPT-3.5 Turbo',
    status: 'deprecated',
    riskLevel: 'medium',
    allowedUseCases: ['analysis'],
    blockedUseCases: ['sensitive-data'],
    securityNotes: 'Use newer models when possible',
    lastReviewed: new Date('2024-12-01'),
  },
];

// ============================================================================
// APPROVED ENDPOINTS
// ============================================================================

export const APPROVED_ENDPOINTS: AllowedEndpoint[] = [
  // OpenAI
  {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    methods: ['POST'],
    status: 'approved',
    riskLevel: 'low',
    rateLimitRpm: 500,
    requiresAuth: true,
  },
  {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/embeddings',
    methods: ['POST'],
    status: 'approved',
    riskLevel: 'low',
    rateLimitRpm: 1000,
    requiresAuth: true,
  },
  // Anthropic
  {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    methods: ['POST'],
    status: 'approved',
    riskLevel: 'low',
    rateLimitRpm: 500,
    requiresAuth: true,
  },
  // Google
  {
    provider: 'google',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    methods: ['POST'],
    status: 'approved',
    riskLevel: 'low',
    rateLimitRpm: 500,
    requiresAuth: true,
  },
  // Perplexity
  {
    provider: 'perplexity',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    methods: ['POST'],
    status: 'approved',
    riskLevel: 'low',
    rateLimitRpm: 100,
    requiresAuth: true,
  },
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a package is allowed
 */
export function validatePackage(name: string, version: string): ValidationResult {
  const pkg = APPROVED_PACKAGES.find(p => p.name === name);

  if (!pkg) {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: 'high',
      reason: 'Package not in allowlist',
      recommendations: ['Request security review for this package'],
    };
  }

  if (pkg.status === 'blocked') {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: pkg.riskLevel,
      reason: pkg.securityNotes || 'Package is blocked',
      recommendations: pkg.alternatives ? [`Consider: ${pkg.alternatives.join(', ')}`] : undefined,
    };
  }

  if (pkg.status === 'deprecated') {
    return {
      allowed: true,
      status: 'deprecated',
      riskLevel: pkg.riskLevel,
      reason: 'Package is deprecated',
      recommendations: pkg.alternatives ? [`Migrate to: ${pkg.alternatives.join(', ')}`] : undefined,
    };
  }

  // Check version constraints
  if (pkg.minVersion && compareVersions(version, pkg.minVersion) < 0) {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: 'high',
      reason: `Version ${version} is below minimum ${pkg.minVersion}`,
      recommendations: [`Upgrade to at least ${pkg.minVersion}`],
    };
  }

  if (pkg.maxVersion && compareVersions(version, pkg.maxVersion) > 0) {
    return {
      allowed: false,
      status: 'pending',
      riskLevel: 'medium',
      reason: `Version ${version} exceeds maximum ${pkg.maxVersion}`,
      recommendations: ['Request security review for newer version'],
    };
  }

  return {
    allowed: true,
    status: pkg.status,
    riskLevel: pkg.riskLevel,
    reason: 'Package is approved',
    recommendations: pkg.usageGuidelines ? [pkg.usageGuidelines] : undefined,
  };
}

/**
 * Check if a model is allowed
 */
export function validateModel(provider: string, modelId: string, useCase?: string): ValidationResult {
  const model = APPROVED_MODELS.find(m =>
    m.provider === provider && m.modelId === modelId
  );

  if (!model) {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: 'high',
      reason: 'Model not in allowlist',
      recommendations: ['Use an approved model or request security review'],
    };
  }

  if (model.status === 'blocked') {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: model.riskLevel,
      reason: model.securityNotes || 'Model is blocked',
    };
  }

  if (useCase && model.blockedUseCases?.includes(useCase)) {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: 'high',
      reason: `Model is blocked for use case: ${useCase}`,
    };
  }

  if (useCase && !model.allowedUseCases.includes(useCase)) {
    return {
      allowed: false,
      status: 'pending',
      riskLevel: 'medium',
      reason: `Use case '${useCase}' not in approved list`,
      recommendations: [`Approved use cases: ${model.allowedUseCases.join(', ')}`],
    };
  }

  if (model.status === 'deprecated') {
    const alternatives = APPROVED_MODELS
      .filter(m => m.provider === provider && m.status === 'approved')
      .map(m => m.modelId);

    return {
      allowed: true,
      status: 'deprecated',
      riskLevel: model.riskLevel,
      reason: 'Model is deprecated',
      recommendations: alternatives.length > 0
        ? [`Consider: ${alternatives.join(', ')}`]
        : undefined,
    };
  }

  return {
    allowed: true,
    status: model.status,
    riskLevel: model.riskLevel,
    reason: 'Model is approved',
  };
}

/**
 * Check if an endpoint is allowed
 */
export function validateEndpoint(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
): ValidationResult {
  const endpoint = APPROVED_ENDPOINTS.find(e =>
    url.startsWith(e.endpoint) && e.methods.includes(method)
  );

  if (!endpoint) {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: 'critical',
      reason: 'Endpoint not in allowlist',
      recommendations: ['Only use approved AI provider endpoints'],
    };
  }

  if (endpoint.status === 'blocked') {
    return {
      allowed: false,
      status: 'blocked',
      riskLevel: endpoint.riskLevel,
      reason: endpoint.securityNotes || 'Endpoint is blocked',
    };
  }

  return {
    allowed: true,
    status: endpoint.status,
    riskLevel: endpoint.riskLevel,
    reason: 'Endpoint is approved',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple semver comparison
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.replace(/[^0-9.]/g, '').split('.').map(Number);
  const parts2 = v2.replace(/[^0-9.]/g, '').split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }

  return 0;
}

/**
 * Get all approved packages
 */
export function getApprovedPackages(): AllowedPackage[] {
  return APPROVED_PACKAGES.filter(p => p.status === 'approved');
}

/**
 * Get all approved models
 */
export function getApprovedModels(): AllowedModel[] {
  return APPROVED_MODELS.filter(m => m.status === 'approved');
}

/**
 * Get approved models for a provider
 */
export function getApprovedModelsForProvider(provider: string): AllowedModel[] {
  return APPROVED_MODELS.filter(m =>
    m.provider === provider && m.status === 'approved'
  );
}

/**
 * Get blocked packages
 */
export function getBlockedPackages(): AllowedPackage[] {
  return APPROVED_PACKAGES.filter(p => p.status === 'blocked');
}

/**
 * Add or update a package in the allowlist
 */
export function updatePackage(pkg: AllowedPackage): void {
  const index = APPROVED_PACKAGES.findIndex(p => p.name === pkg.name);
  if (index >= 0) {
    APPROVED_PACKAGES[index] = pkg;
  } else {
    APPROVED_PACKAGES.push(pkg);
  }
}

/**
 * Add or update a model in the allowlist
 */
export function updateModel(model: AllowedModel): void {
  const index = APPROVED_MODELS.findIndex(m =>
    m.provider === model.provider && m.modelId === model.modelId
  );
  if (index >= 0) {
    APPROVED_MODELS[index] = model;
  } else {
    APPROVED_MODELS.push(model);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Validation
  validatePackage,
  validateModel,
  validateEndpoint,

  // Getters
  getApprovedPackages,
  getApprovedModels,
  getApprovedModelsForProvider,
  getBlockedPackages,

  // Management
  updatePackage,
  updateModel,

  // Data
  APPROVED_PACKAGES,
  APPROVED_MODELS,
  APPROVED_ENDPOINTS,
};
