/**
 * Prompt Sanitizer - Security Module
 *
 * Phase 1, Week 1, Day 3
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4
 *
 * Security features:
 * - Prompt injection prevention
 * - Special character escaping
 * - Length enforcement
 * - Dangerous pattern detection
 */

import { z } from 'zod';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Maximum lengths for different input types
 */
export const MAX_LENGTHS = {
  brandName: 100,
  description: 2000,
  title: 200,
  url: 2048,
  industry: 100,
  userInput: 5000,
} as const;

/**
 * Patterns that indicate potential prompt injection attempts
 */
const INJECTION_PATTERNS = [
  // Direct instruction overrides - more flexible patterns
  /ignore\s+.*\s*(instructions?|prompts?|rules?)/i,
  /disregard\s+.*\s*(instructions?|prompts?|rules?)/i,
  /forget\s+.*\s*(instructions?|prompts?|everything)/i,

  // Role manipulation
  /you\s+are\s+now/i,
  /you\s+are\s+actually/i,
  /pretend\s+(you|to\s+be)/i,
  /act\s+as\s+(if|a)/i,
  /roleplay\s+as/i,
  /simulate\s+being/i,

  // System prompt extraction - more patterns
  /what\s+(is|are)\s+your\s+(system\s+)?prompt/i,
  /show\s+(me\s+)?your\s+(system\s+)?(prompt|instructions)/i,
  /reveal\s+(your\s+)?(system\s+)?(instructions|prompt)/i,
  /print\s+(your\s+)?(system\s+)?(prompt|initial)/i,
  /output\s+(your\s+)?(system\s+)?(prompt|message|instructions)/i,

  // Jailbreak attempts
  /dan\s*,?\s*(mode|a\s+helpful)/i,
  /developer\s+mode/i,
  /jailbreak/i,
  /bypass\s+(your\s+)?(safety|filter|restriction)/i,
  /override\s+(your\s+)?(safety|filter|restriction)/i,

  // Code execution attempts
  /```\s*(python|javascript|bash|sh|exec)/i,
  /eval\s*\(/i,
  /exec\s*\(/i,
  /__import__/i,
  /subprocess/i,
  /os\.system/i,

  // Data exfiltration attempts
  /send\s+(this|data|information)\s+to/i,
  /http:\/\/|https:\/\/\S+\.(php|asp|cgi)/i,
  /webhook/i,

  // Delimiter manipulation
  /\[\[system\]\]/i,
  /\[\[user\]\]/i,
  /\[\[assistant\]\]/i,
  /<\|system\|>/i,
  /<\|user\|>/i,
  /<\|assistant\|>/i,
  /###\s*system/i,
  /###\s*instruction/i,
];

/**
 * Characters that should be escaped or removed
 */
const DANGEROUS_CHARS = [
  '\x00', // Null byte
  '\x08', // Backspace
  '\x0B', // Vertical tab
  '\x0C', // Form feed
  '\x1B', // Escape
  '\x7F', // Delete
];

/**
 * Unicode categories to filter (invisible/formatting characters)
 */
const INVISIBLE_CHAR_REGEX = /[\u200B-\u200D\u2060\u2061\u2062\u2063\u2064\uFEFF\u00AD]/g;

// ================================================================
// TYPES
// ================================================================

export interface SanitizationResult {
  sanitized: string;
  wasModified: boolean;
  issues: SanitizationIssue[];
}

export interface SanitizationIssue {
  type: 'injection_attempt' | 'length_exceeded' | 'dangerous_chars' | 'invisible_chars' | 'html_stripped';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export type InputType = keyof typeof MAX_LENGTHS;

// ================================================================
// SANITIZATION FUNCTIONS
// ================================================================

/**
 * Remove dangerous/invisible characters from input
 */
function removeDangerousChars(input: string): { result: string; removed: boolean } {
  let result = input;
  let removed = false;

  // Remove null bytes and control characters
  for (const char of DANGEROUS_CHARS) {
    if (result.includes(char)) {
      result = result.split(char).join('');
      removed = true;
    }
  }

  // Remove invisible Unicode characters
  if (INVISIBLE_CHAR_REGEX.test(result)) {
    result = result.replace(INVISIBLE_CHAR_REGEX, '');
    removed = true;
  }

  return { result, removed };
}

/**
 * Strip HTML tags from input
 */
function stripHtml(input: string): { result: string; stripped: boolean } {
  const htmlRegex = /<[^>]*>/g;
  const stripped = htmlRegex.test(input);
  const result = input.replace(htmlRegex, '');
  return { result, stripped };
}

/**
 * Escape special characters that could be used for injection
 */
function escapeSpecialChars(input: string): string {
  return input
    // Escape backticks (code blocks)
    .replace(/`/g, "'")
    // Escape brackets that could be delimiter manipulation
    .replace(/\[\[/g, '[ [')
    .replace(/\]\]/g, '] ]')
    // Escape angle brackets with pipes
    .replace(/<\|/g, '< |')
    .replace(/\|>/g, '| >')
    // Escape triple hashes that could be section markers
    .replace(/###/g, '# # #');
}

/**
 * Check for prompt injection patterns
 */
function detectInjectionPatterns(input: string): SanitizationIssue[] {
  const issues: SanitizationIssue[] = [];

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      issues.push({
        type: 'injection_attempt',
        description: `Potential prompt injection detected: ${pattern.source.substring(0, 50)}...`,
        severity: 'critical',
      });
    }
  }

  return issues;
}

/**
 * Normalize whitespace (collapse multiple spaces, trim)
 */
function normalizeWhitespace(input: string): string {
  return input
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();
}

/**
 * Truncate string to maximum length
 */
function truncateToLength(input: string, maxLength: number): { result: string; truncated: boolean } {
  if (input.length <= maxLength) {
    return { result: input, truncated: false };
  }
  return { result: input.substring(0, maxLength), truncated: true };
}

// ================================================================
// MAIN SANITIZATION FUNCTIONS
// ================================================================

/**
 * Sanitize a brand name for use in prompts
 *
 * @param brandName - The brand name to sanitize
 * @returns Sanitized brand name and any issues found
 */
export function sanitizeBrandName(brandName: string): SanitizationResult {
  const issues: SanitizationIssue[] = [];
  let result = brandName;
  let wasModified = false;

  // Check for injection patterns
  const injectionIssues = detectInjectionPatterns(result);
  if (injectionIssues.length > 0) {
    issues.push(...injectionIssues);
    // For brand names with injection attempts, we heavily sanitize
    result = result.replace(/[^a-zA-Z0-9\s\-_.&'áéíóúñüÁÉÍÓÚÑÜ]/g, '');
    wasModified = true;
  }

  // Remove dangerous characters
  const dangerousResult = removeDangerousChars(result);
  if (dangerousResult.removed) {
    result = dangerousResult.result;
    wasModified = true;
    issues.push({
      type: 'dangerous_chars',
      description: 'Dangerous characters removed',
      severity: 'medium',
    });
  }

  // Strip HTML
  const htmlResult = stripHtml(result);
  if (htmlResult.stripped) {
    result = htmlResult.result;
    wasModified = true;
    issues.push({
      type: 'html_stripped',
      description: 'HTML tags removed',
      severity: 'low',
    });
  }

  // Escape special characters
  const escaped = escapeSpecialChars(result);
  if (escaped !== result) {
    result = escaped;
    wasModified = true;
  }

  // Normalize whitespace
  result = normalizeWhitespace(result);

  // Truncate to max length
  const truncateResult = truncateToLength(result, MAX_LENGTHS.brandName);
  if (truncateResult.truncated) {
    result = truncateResult.result;
    wasModified = true;
    issues.push({
      type: 'length_exceeded',
      description: `Brand name truncated to ${MAX_LENGTHS.brandName} characters`,
      severity: 'low',
    });
  }

  return {
    sanitized: result,
    wasModified,
    issues,
  };
}

/**
 * Sanitize a description for use in prompts
 *
 * @param description - The description to sanitize
 * @returns Sanitized description and any issues found
 */
export function sanitizeDescription(description: string): SanitizationResult {
  const issues: SanitizationIssue[] = [];
  let result = description;
  let wasModified = false;

  // Check for injection patterns
  const injectionIssues = detectInjectionPatterns(result);
  if (injectionIssues.length > 0) {
    issues.push(...injectionIssues);
    // For descriptions with injection attempts, escape but don't fully strip
    result = escapeSpecialChars(result);
    wasModified = true;
  }

  // Remove dangerous characters
  const dangerousResult = removeDangerousChars(result);
  if (dangerousResult.removed) {
    result = dangerousResult.result;
    wasModified = true;
    issues.push({
      type: 'dangerous_chars',
      description: 'Dangerous characters removed',
      severity: 'medium',
    });
  }

  // Strip HTML
  const htmlResult = stripHtml(result);
  if (htmlResult.stripped) {
    result = htmlResult.result;
    wasModified = true;
    issues.push({
      type: 'html_stripped',
      description: 'HTML tags removed',
      severity: 'low',
    });
  }

  // Normalize whitespace (but preserve paragraph breaks)
  result = result
    .replace(/[ \t]+/g, ' ')  // Collapse spaces/tabs
    .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
    .trim();

  // Truncate to max length
  const truncateResult = truncateToLength(result, MAX_LENGTHS.description);
  if (truncateResult.truncated) {
    result = truncateResult.result;
    wasModified = true;
    issues.push({
      type: 'length_exceeded',
      description: `Description truncated to ${MAX_LENGTHS.description} characters`,
      severity: 'low',
    });
  }

  return {
    sanitized: result,
    wasModified,
    issues,
  };
}

/**
 * Sanitize user-provided input for prompts
 * Most restrictive sanitization
 *
 * @param input - The user input to sanitize
 * @param inputType - Type of input for length limits
 * @returns Sanitized input and any issues found
 */
export function sanitizeUserInput(
  input: string,
  inputType: InputType = 'userInput'
): SanitizationResult {
  const issues: SanitizationIssue[] = [];
  let result = input;
  let wasModified = false;

  // Check for injection patterns first
  const injectionIssues = detectInjectionPatterns(result);
  if (injectionIssues.length > 0) {
    issues.push(...injectionIssues);
    // Aggressive sanitization for injection attempts
    result = escapeSpecialChars(result);
    wasModified = true;
  }

  // Remove dangerous characters
  const dangerousResult = removeDangerousChars(result);
  if (dangerousResult.removed) {
    result = dangerousResult.result;
    wasModified = true;
    issues.push({
      type: 'dangerous_chars',
      description: 'Dangerous characters removed',
      severity: 'medium',
    });
  }

  // Remove invisible characters
  if (INVISIBLE_CHAR_REGEX.test(result)) {
    result = result.replace(INVISIBLE_CHAR_REGEX, '');
    wasModified = true;
    issues.push({
      type: 'invisible_chars',
      description: 'Invisible Unicode characters removed',
      severity: 'medium',
    });
  }

  // Strip HTML
  const htmlResult = stripHtml(result);
  if (htmlResult.stripped) {
    result = htmlResult.result;
    wasModified = true;
    issues.push({
      type: 'html_stripped',
      description: 'HTML tags removed',
      severity: 'low',
    });
  }

  // Escape special characters
  const escaped = escapeSpecialChars(result);
  if (escaped !== result) {
    result = escaped;
    wasModified = true;
  }

  // Normalize whitespace
  result = normalizeWhitespace(result);

  // Truncate to max length
  const maxLength = MAX_LENGTHS[inputType];
  const truncateResult = truncateToLength(result, maxLength);
  if (truncateResult.truncated) {
    result = truncateResult.result;
    wasModified = true;
    issues.push({
      type: 'length_exceeded',
      description: `Input truncated to ${maxLength} characters`,
      severity: 'low',
    });
  }

  return {
    sanitized: result,
    wasModified,
    issues,
  };
}

/**
 * Check if input contains potential injection attempts
 * Use this for validation without sanitization
 *
 * @param input - The input to check
 * @returns true if injection patterns detected
 */
export function containsInjectionAttempt(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Get severity level of all issues
 *
 * @param issues - Array of sanitization issues
 * @returns Highest severity level found
 */
export function getHighestSeverity(
  issues: SanitizationIssue[]
): 'none' | 'low' | 'medium' | 'high' | 'critical' {
  if (issues.length === 0) return 'none';

  const severityOrder = ['low', 'medium', 'high', 'critical'] as const;
  let highest = 0;

  for (const issue of issues) {
    const index = severityOrder.indexOf(issue.severity);
    if (index > highest) {
      highest = index;
    }
  }

  return severityOrder[highest];
}

// ================================================================
// ZOD SCHEMAS FOR VALIDATION
// ================================================================

/**
 * Zod schema for brand name with sanitization
 */
export const brandNameSchema = z
  .string()
  .min(1, 'Brand name is required')
  .max(MAX_LENGTHS.brandName, `Brand name must be ${MAX_LENGTHS.brandName} characters or less`)
  .transform((val) => sanitizeBrandName(val).sanitized);

/**
 * Zod schema for description with sanitization
 */
export const descriptionSchema = z
  .string()
  .max(MAX_LENGTHS.description, `Description must be ${MAX_LENGTHS.description} characters or less`)
  .transform((val) => sanitizeDescription(val).sanitized);

/**
 * Zod schema for user input with sanitization
 */
export const userInputSchema = z
  .string()
  .max(MAX_LENGTHS.userInput, `Input must be ${MAX_LENGTHS.userInput} characters or less`)
  .transform((val) => sanitizeUserInput(val).sanitized);

// ================================================================
// EXPORTS
// ================================================================

export default {
  sanitizeBrandName,
  sanitizeDescription,
  sanitizeUserInput,
  containsInjectionAttempt,
  getHighestSeverity,
  brandNameSchema,
  descriptionSchema,
  userInputSchema,
  MAX_LENGTHS,
};
