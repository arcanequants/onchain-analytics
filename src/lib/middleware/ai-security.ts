/**
 * AI Security Middleware
 *
 * RED TEAM AUDIT FIX: HIGH-003, HIGH-008
 * Integrates jailbreak detection and canary tokens into AI request flow
 *
 * Features:
 * - Input sanitization
 * - Jailbreak detection
 * - Prompt injection prevention
 * - Canary token tracking
 * - Response validation
 * - Audit logging
 */

import {
  sanitizeUserInput,
  containsInjectionAttempt,
  getHighestSeverity,
  type SanitizationResult,
} from '@/lib/ai/prompt-sanitizer';

import {
  protectConversation,
  detectExtractionAttempt,
  detectPromptLeakage,
  sanitizeResponse,
  generateCanaryToken,
  type ExtractionDetectionResult,
  type ProtectedConversation,
} from '@/lib/ai/prompt-protection';

// ============================================================================
// TYPES
// ============================================================================

export interface AISecurityConfig {
  enableSanitization?: boolean;
  enableJailbreakDetection?: boolean;
  enablePromptProtection?: boolean;
  enableCanaryTokens?: boolean;
  enableResponseValidation?: boolean;
  enableAuditLogging?: boolean;
  strictMode?: boolean;
  maxInputLength?: number;
}

export interface SecurityCheckResult {
  allowed: boolean;
  sanitizedInput: string;
  warnings: string[];
  blockedReasons: string[];
  securityScore: number;
  canaryToken?: string;
  metrics: SecurityMetrics;
}

export interface SecurityMetrics {
  inputLength: number;
  sanitizationApplied: boolean;
  jailbreakAttemptDetected: boolean;
  extractionAttemptDetected: boolean;
  injectionPatternsFound: number;
  processingTimeMs: number;
}

export interface SecureAIRequest {
  originalInput: string;
  protectedSystemPrompt: string;
  sanitizedUserMessage: string;
  canaryToken?: string;
  securityMetadata: SecurityMetadata;
}

export interface SecurityMetadata {
  inputHash: string;
  timestamp: string;
  securityChecks: {
    sanitization: 'passed' | 'modified' | 'blocked';
    jailbreak: 'passed' | 'warned' | 'blocked';
    extraction: 'passed' | 'warned' | 'blocked';
  };
  warnings: string[];
}

export interface SecureAIResponse {
  content: string;
  wasModified: boolean;
  leakageDetected: boolean;
  canaryLeaked: boolean;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<AISecurityConfig> = {
  enableSanitization: true,
  enableJailbreakDetection: true,
  enablePromptProtection: true,
  enableCanaryTokens: true,
  enableResponseValidation: true,
  enableAuditLogging: true,
  strictMode: false,
  maxInputLength: 10000,
};

// ============================================================================
// SECURITY SCORING
// ============================================================================

function calculateSecurityScore(
  sanitizationResult: SanitizationResult,
  extractionResult: ExtractionDetectionResult | null,
  hasInjectionPatterns: boolean
): number {
  let score = 100;

  // Deduct for sanitization issues
  const severity = getHighestSeverity(sanitizationResult.issues);
  switch (severity) {
    case 'critical':
      score -= 40;
      break;
    case 'high':
      score -= 25;
      break;
    case 'medium':
      score -= 15;
      break;
    case 'low':
      score -= 5;
      break;
  }

  // Deduct for extraction attempts
  if (extractionResult?.isExtractionAttempt) {
    score -= Math.floor(extractionResult.confidence * 30);
  }

  // Deduct for injection patterns
  if (hasInjectionPatterns) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

// ============================================================================
// INPUT HASH (for audit logging)
// ============================================================================

async function hashInput(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}

// ============================================================================
// MAIN SECURITY CHECK
// ============================================================================

/**
 * Perform comprehensive security checks on AI input
 */
export async function checkAISecurity(
  userInput: string,
  config: AISecurityConfig = {}
): Promise<SecurityCheckResult> {
  const startTime = Date.now();
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const warnings: string[] = [];
  const blockedReasons: string[] = [];

  // Initialize metrics
  const metrics: SecurityMetrics = {
    inputLength: userInput.length,
    sanitizationApplied: false,
    jailbreakAttemptDetected: false,
    extractionAttemptDetected: false,
    injectionPatternsFound: 0,
    processingTimeMs: 0,
  };

  // Check input length
  if (userInput.length > mergedConfig.maxInputLength) {
    if (mergedConfig.strictMode) {
      blockedReasons.push(`Input exceeds maximum length of ${mergedConfig.maxInputLength}`);
    } else {
      warnings.push(`Input truncated from ${userInput.length} to ${mergedConfig.maxInputLength} characters`);
      userInput = userInput.substring(0, mergedConfig.maxInputLength);
    }
  }

  // Step 1: Sanitization
  let sanitizedInput = userInput;
  let sanitizationResult: SanitizationResult = {
    sanitized: userInput,
    wasModified: false,
    issues: [],
  };

  if (mergedConfig.enableSanitization) {
    sanitizationResult = sanitizeUserInput(userInput);
    sanitizedInput = sanitizationResult.sanitized;
    metrics.sanitizationApplied = sanitizationResult.wasModified;

    if (sanitizationResult.issues.length > 0) {
      const severity = getHighestSeverity(sanitizationResult.issues);
      if (severity === 'critical' && mergedConfig.strictMode) {
        blockedReasons.push('Critical sanitization issues detected');
      } else if (severity === 'critical' || severity === 'high') {
        warnings.push(`Sanitization applied: ${sanitizationResult.issues.length} issues found`);
      }
    }
  }

  // Step 2: Jailbreak/Injection Detection
  const hasInjectionPatterns = containsInjectionAttempt(sanitizedInput);
  metrics.injectionPatternsFound = hasInjectionPatterns ? 1 : 0;

  if (mergedConfig.enableJailbreakDetection && hasInjectionPatterns) {
    metrics.jailbreakAttemptDetected = true;
    if (mergedConfig.strictMode) {
      blockedReasons.push('Potential jailbreak/injection attempt detected');
    } else {
      warnings.push('Potential prompt manipulation detected and neutralized');
    }
  }

  // Step 3: Extraction Detection
  let extractionResult: ExtractionDetectionResult | null = null;

  if (mergedConfig.enablePromptProtection) {
    extractionResult = detectExtractionAttempt(sanitizedInput);
    metrics.extractionAttemptDetected = extractionResult.isExtractionAttempt;

    if (extractionResult.isExtractionAttempt) {
      if (extractionResult.recommendation === 'block') {
        blockedReasons.push('Prompt extraction attempt detected');
      } else if (extractionResult.recommendation === 'warn') {
        warnings.push('Suspicious prompt probing detected');
      }
    }
  }

  // Calculate security score
  const securityScore = calculateSecurityScore(
    sanitizationResult,
    extractionResult,
    hasInjectionPatterns
  );

  // Generate canary token if enabled
  let canaryToken: string | undefined;
  if (mergedConfig.enableCanaryTokens) {
    canaryToken = generateCanaryToken();
  }

  // Calculate processing time
  metrics.processingTimeMs = Date.now() - startTime;

  return {
    allowed: blockedReasons.length === 0,
    sanitizedInput,
    warnings,
    blockedReasons,
    securityScore,
    canaryToken,
    metrics,
  };
}

// ============================================================================
// SECURE REQUEST BUILDER
// ============================================================================

/**
 * Build a secure AI request with all protections applied
 */
export async function buildSecureAIRequest(
  systemPrompt: string,
  userInput: string,
  config: AISecurityConfig = {}
): Promise<SecureAIRequest | { error: string; blockedReasons: string[] }> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Perform security checks
  const securityCheck = await checkAISecurity(userInput, config);

  if (!securityCheck.allowed) {
    return {
      error: 'Request blocked by security checks',
      blockedReasons: securityCheck.blockedReasons,
    };
  }

  // Protect the conversation
  const protection = protectConversation(systemPrompt, securityCheck.sanitizedInput, {
    enableCanaryTokens: mergedConfig.enableCanaryTokens,
    enableExtractionDetection: mergedConfig.enablePromptProtection,
  });

  if (!protection.shouldProceed) {
    return {
      error: protection.warningMessage || 'Request blocked by prompt protection',
      blockedReasons: [protection.warningMessage || 'Prompt protection triggered'],
    };
  }

  // Build security metadata
  const inputHash = await hashInput(userInput);
  const securityMetadata: SecurityMetadata = {
    inputHash,
    timestamp: new Date().toISOString(),
    securityChecks: {
      sanitization: securityCheck.metrics.sanitizationApplied ? 'modified' : 'passed',
      jailbreak: securityCheck.metrics.jailbreakAttemptDetected ? 'warned' : 'passed',
      extraction: securityCheck.metrics.extractionAttemptDetected ? 'warned' : 'passed',
    },
    warnings: securityCheck.warnings,
  };

  return {
    originalInput: userInput,
    protectedSystemPrompt: protection.systemPrompt,
    sanitizedUserMessage: protection.userMessage,
    canaryToken: protection.canaryToken,
    securityMetadata,
  };
}

// ============================================================================
// RESPONSE VALIDATION
// ============================================================================

/**
 * Validate and sanitize AI response
 */
export function validateAIResponse(
  response: string,
  canaryToken?: string,
  config: AISecurityConfig = {}
): SecureAIResponse {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  let content = response;
  let wasModified = false;
  let leakageDetected = false;
  let canaryLeaked = false;

  if (mergedConfig.enableResponseValidation) {
    // Check for prompt leakage
    leakageDetected = detectPromptLeakage(response, canaryToken);

    // Check for canary token specifically
    if (canaryToken && response.includes(canaryToken)) {
      canaryLeaked = true;
    }

    // Sanitize if leakage detected
    if (leakageDetected) {
      const sanitized = sanitizeResponse(response, canaryToken);
      content = sanitized.sanitized;
      wasModified = sanitized.wasModified;
    }
  }

  return {
    content,
    wasModified,
    leakageDetected,
    canaryLeaked,
  };
}

// ============================================================================
// AUDIT LOGGING HELPER
// ============================================================================

export interface AISecurityAuditEvent {
  eventType: 'ai_request' | 'ai_response' | 'security_block';
  timestamp: string;
  inputHash: string;
  securityScore: number;
  checks: {
    sanitization: string;
    jailbreak: string;
    extraction: string;
  };
  warnings: string[];
  blockedReasons: string[];
  processingTimeMs: number;
  canaryToken?: string;
  responseLeakage?: boolean;
}

/**
 * Create audit event for logging
 */
export function createAuditEvent(
  request: SecureAIRequest,
  response?: SecureAIResponse,
  securityCheck?: SecurityCheckResult
): AISecurityAuditEvent {
  return {
    eventType: response ? 'ai_response' : 'ai_request',
    timestamp: new Date().toISOString(),
    inputHash: request.securityMetadata.inputHash,
    securityScore: securityCheck?.securityScore ?? 100,
    checks: request.securityMetadata.securityChecks,
    warnings: request.securityMetadata.warnings,
    blockedReasons: [],
    processingTimeMs: securityCheck?.metrics.processingTimeMs ?? 0,
    canaryToken: request.canaryToken,
    responseLeakage: response?.leakageDetected,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DEFAULT_CONFIG as AI_SECURITY_DEFAULT_CONFIG,
};

export default {
  checkAISecurity,
  buildSecureAIRequest,
  validateAIResponse,
  createAuditEvent,
};
