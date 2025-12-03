/**
 * Security Module Exports
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security
 */

export {
  // Jailbreak Detection
  JailbreakDetector,
  getJailbreakDetector,
  analyzeForJailbreak,
  isJailbreakAttempt,
  sanitizeInput,
  type DetectionPattern,
  type DetectionResult,
  type PatternMatch,
  type AttackCategory,
  type Severity,
  DETECTION_PATTERNS,
} from './jailbreak-detection';

export {
  // Canary Tokens
  CanaryTokenManager,
  getCanaryTokenManager,
  generateCanaryToken,
  type CanaryToken,
  type CanaryTokenType,
  type CanaryTriggerEvent,
  type TriggerContext,
  type CanaryConfig,
  type SystemPromptCanaries,
  CANARY_PHRASES,
  INVISIBLE_CHARS,
} from './canary-tokens';
