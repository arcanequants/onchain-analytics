/**
 * Web Application Firewall (WAF) Rules
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - AI-specific WAF rules
 * - Request filtering and validation
 * - Response sanitization
 * - Configurable rule sets
 */

// ============================================================================
// TYPES
// ============================================================================

export type RuleAction = 'block' | 'allow' | 'log' | 'challenge' | 'throttle';

export type RuleCategory =
  | 'ai_security'
  | 'rate_limiting'
  | 'injection'
  | 'xss'
  | 'bot_protection'
  | 'geo_blocking'
  | 'custom';

export interface WAFRule {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  enabled: boolean;
  priority: number;  // Lower = higher priority
  action: RuleAction;
  conditions: RuleCondition[];
  exceptions?: RuleException[];
  rateLimit?: RateLimitConfig;
  metadata?: Record<string, unknown>;
}

export interface RuleCondition {
  field: 'path' | 'query' | 'body' | 'header' | 'ip' | 'user_agent' | 'method';
  operator: 'equals' | 'contains' | 'regex' | 'starts_with' | 'ends_with' | 'in_list';
  value: string | string[];
  negated?: boolean;
}

export interface RuleException {
  field: string;
  value: string;
  reason: string;
}

export interface RateLimitConfig {
  requests: number;
  windowSeconds: number;
  burstSize?: number;
}

export interface WAFResult {
  allowed: boolean;
  matchedRules: MatchedRule[];
  action: RuleAction;
  reason?: string;
  ruleId?: string;
  shouldChallenge: boolean;
  headers?: Record<string, string>;
}

export interface MatchedRule {
  ruleId: string;
  ruleName: string;
  action: RuleAction;
  matchedConditions: string[];
}

export interface RequestContext {
  path: string;
  method: string;
  query?: Record<string, string>;
  body?: string;
  headers: Record<string, string>;
  ip: string;
  userAgent?: string;
  userId?: string;
}

// ============================================================================
// AI-SPECIFIC WAF RULES
// ============================================================================

export const AI_SECURITY_RULES: WAFRule[] = [
  // Block known jailbreak patterns
  {
    id: 'ai-001',
    name: 'Block DAN Jailbreak',
    description: 'Block requests containing DAN jailbreak patterns',
    category: 'ai_security',
    enabled: true,
    priority: 1,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: '\\b(DAN|do\\s+anything\\s+now)\\b' },
    ],
  },
  {
    id: 'ai-002',
    name: 'Block Prompt Injection',
    description: 'Block requests attempting prompt injection',
    category: 'ai_security',
    enabled: true,
    priority: 1,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: 'ignore\\s+(all\\s+)?previous\\s+instructions?' },
    ],
  },
  {
    id: 'ai-003',
    name: 'Block System Prompt Extraction',
    description: 'Block attempts to extract system prompts',
    category: 'ai_security',
    enabled: true,
    priority: 2,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: '(reveal|show|print|output)\\s+(your\\s+)?system\\s+prompt' },
    ],
  },
  {
    id: 'ai-004',
    name: 'Block Role Manipulation',
    description: 'Block attempts to change AI role/persona',
    category: 'ai_security',
    enabled: true,
    priority: 3,
    action: 'log', // Log instead of block to reduce false positives
    conditions: [
      { field: 'body', operator: 'regex', value: 'you\\s+are\\s+now\\s+(a|an)\\s+' },
    ],
  },
  {
    id: 'ai-005',
    name: 'Block Developer Mode',
    description: 'Block attempts to enable developer/admin mode',
    category: 'ai_security',
    enabled: true,
    priority: 1,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: '(developer|admin|sudo|root)\\s+mode' },
    ],
  },
  {
    id: 'ai-006',
    name: 'Detect Encoding Attacks',
    description: 'Detect base64/hex encoded potential attacks',
    category: 'ai_security',
    enabled: true,
    priority: 4,
    action: 'challenge',
    conditions: [
      { field: 'body', operator: 'regex', value: '[A-Za-z0-9+/]{50,}={0,2}' }, // Long base64
    ],
  },

  // Rate limiting for AI endpoints
  {
    id: 'ai-rate-001',
    name: 'AI Endpoint Rate Limit',
    description: 'Rate limit AI analysis endpoints',
    category: 'rate_limiting',
    enabled: true,
    priority: 5,
    action: 'throttle',
    conditions: [
      { field: 'path', operator: 'starts_with', value: '/api/ai/' },
    ],
    rateLimit: {
      requests: 60,
      windowSeconds: 60,
      burstSize: 10,
    },
  },
  {
    id: 'ai-rate-002',
    name: 'Query API Rate Limit',
    description: 'Rate limit brand query endpoints',
    category: 'rate_limiting',
    enabled: true,
    priority: 5,
    action: 'throttle',
    conditions: [
      { field: 'path', operator: 'starts_with', value: '/api/query' },
    ],
    rateLimit: {
      requests: 100,
      windowSeconds: 60,
      burstSize: 20,
    },
  },

  // Bot protection
  {
    id: 'bot-001',
    name: 'Block Empty User Agent',
    description: 'Block requests without user agent',
    category: 'bot_protection',
    enabled: true,
    priority: 10,
    action: 'block',
    conditions: [
      { field: 'user_agent', operator: 'equals', value: '' },
    ],
    exceptions: [
      { field: 'path', value: '/api/health', reason: 'Health check endpoint' },
    ],
  },
  {
    id: 'bot-002',
    name: 'Challenge Suspicious Bots',
    description: 'Challenge requests from known bot user agents',
    category: 'bot_protection',
    enabled: true,
    priority: 8,
    action: 'challenge',
    conditions: [
      { field: 'user_agent', operator: 'regex', value: '(curl|wget|python-requests|scrapy|httpclient)' },
    ],
    exceptions: [
      { field: 'header', value: 'X-API-Key', reason: 'Authenticated API access' },
    ],
  },

  // Injection protection
  {
    id: 'inj-001',
    name: 'Block SQL Injection',
    description: 'Block potential SQL injection attempts',
    category: 'injection',
    enabled: true,
    priority: 1,
    action: 'block',
    conditions: [
      { field: 'query', operator: 'regex', value: '(union\\s+select|drop\\s+table|;\\s*delete|\\bor\\b\\s+1\\s*=\\s*1)' },
    ],
  },
  {
    id: 'inj-002',
    name: 'Block NoSQL Injection',
    description: 'Block potential NoSQL injection attempts',
    category: 'injection',
    enabled: true,
    priority: 1,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: '\\$where|\\$gt|\\$lt|\\$ne|\\$regex' },
    ],
  },

  // XSS protection
  {
    id: 'xss-001',
    name: 'Block Script Tags',
    description: 'Block requests containing script tags',
    category: 'xss',
    enabled: true,
    priority: 2,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: '<script[^>]*>' },
    ],
  },
  {
    id: 'xss-002',
    name: 'Block Event Handlers',
    description: 'Block requests with inline event handlers',
    category: 'xss',
    enabled: true,
    priority: 2,
    action: 'block',
    conditions: [
      { field: 'body', operator: 'regex', value: 'on(load|error|click|mouseover)\\s*=' },
    ],
  },
];

// ============================================================================
// RATE LIMITER
// ============================================================================

interface RateLimitEntry {
  count: number;
  windowStart: number;
  burstRemaining: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    entry = {
      count: 0,
      windowStart: now,
      burstRemaining: config.burstSize || config.requests,
    };
  }

  entry.count++;

  const resetAt = entry.windowStart + windowMs;
  const remaining = Math.max(0, config.requests - entry.count);

  // Allow burst
  if (entry.count > config.requests && entry.burstRemaining > 0) {
    entry.burstRemaining--;
    rateLimitStore.set(key, entry);
    return { allowed: true, remaining: entry.burstRemaining, resetAt };
  }

  const allowed = entry.count <= config.requests;
  rateLimitStore.set(key, entry);

  return { allowed, remaining, resetAt };
}

// ============================================================================
// RULE EVALUATION
// ============================================================================

/**
 * Check if a condition matches
 */
function evaluateCondition(
  condition: RuleCondition,
  context: RequestContext
): boolean {
  let fieldValue: string | undefined;

  switch (condition.field) {
    case 'path':
      fieldValue = context.path;
      break;
    case 'query':
      fieldValue = context.query ? JSON.stringify(context.query) : '';
      break;
    case 'body':
      fieldValue = context.body;
      break;
    case 'header':
      fieldValue = Object.values(context.headers).join(' ');
      break;
    case 'ip':
      fieldValue = context.ip;
      break;
    case 'user_agent':
      fieldValue = context.userAgent;
      break;
    case 'method':
      fieldValue = context.method;
      break;
  }

  if (fieldValue === undefined) fieldValue = '';

  let matches = false;
  const testValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      matches = fieldValue === testValue;
      break;
    case 'contains':
      matches = fieldValue.toLowerCase().includes((testValue as string).toLowerCase());
      break;
    case 'regex':
      try {
        const regex = new RegExp(testValue as string, 'i');
        matches = regex.test(fieldValue);
      } catch {
        matches = false;
      }
      break;
    case 'starts_with':
      matches = fieldValue.startsWith(testValue as string);
      break;
    case 'ends_with':
      matches = fieldValue.endsWith(testValue as string);
      break;
    case 'in_list':
      matches = Array.isArray(testValue) && testValue.includes(fieldValue);
      break;
  }

  return condition.negated ? !matches : matches;
}

/**
 * Check if any exception applies
 */
function checkExceptions(
  exceptions: RuleException[] | undefined,
  context: RequestContext
): boolean {
  if (!exceptions || exceptions.length === 0) return false;

  for (const exception of exceptions) {
    if (exception.field === 'path' && context.path === exception.value) return true;
    if (exception.field === 'ip' && context.ip === exception.value) return true;
    if (exception.field === 'header' && context.headers[exception.value]) return true;
  }

  return false;
}

/**
 * Evaluate a single rule
 */
function evaluateRule(
  rule: WAFRule,
  context: RequestContext
): MatchedRule | null {
  if (!rule.enabled) return null;

  // Check exceptions first
  if (checkExceptions(rule.exceptions, context)) return null;

  // All conditions must match (AND logic)
  const matchedConditions: string[] = [];

  for (const condition of rule.conditions) {
    if (evaluateCondition(condition, context)) {
      matchedConditions.push(`${condition.field} ${condition.operator} ${condition.value}`);
    } else {
      return null; // One condition didn't match
    }
  }

  // Check rate limit if configured
  if (rule.rateLimit) {
    const rateLimitKey = `${rule.id}:${context.ip}`;
    const result = checkRateLimit(rateLimitKey, rule.rateLimit);

    if (!result.allowed) {
      matchedConditions.push(`Rate limit exceeded (${rule.rateLimit.requests}/${rule.rateLimit.windowSeconds}s)`);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        action: rule.action,
        matchedConditions,
      };
    }

    return null; // Rate limit not exceeded
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    action: rule.action,
    matchedConditions,
  };
}

// ============================================================================
// MAIN WAF FUNCTION
// ============================================================================

/**
 * Process request through WAF rules
 */
export function processRequest(
  context: RequestContext,
  customRules?: WAFRule[]
): WAFResult {
  const allRules = [...AI_SECURITY_RULES, ...(customRules || [])];

  // Sort by priority
  allRules.sort((a, b) => a.priority - b.priority);

  const matchedRules: MatchedRule[] = [];

  for (const rule of allRules) {
    const match = evaluateRule(rule, context);
    if (match) {
      matchedRules.push(match);

      // For block/challenge, stop processing
      if (match.action === 'block' || match.action === 'challenge') {
        break;
      }
    }
  }

  if (matchedRules.length === 0) {
    return {
      allowed: true,
      matchedRules: [],
      action: 'allow',
      shouldChallenge: false,
    };
  }

  // Determine final action (highest severity wins)
  const actionPriority: Record<RuleAction, number> = {
    block: 0,
    challenge: 1,
    throttle: 2,
    log: 3,
    allow: 4,
  };

  const finalAction = matchedRules.reduce(
    (prev, curr) => actionPriority[curr.action] < actionPriority[prev.action] ? curr : prev
  );

  const headers: Record<string, string> = {};

  if (finalAction.action === 'throttle') {
    headers['X-RateLimit-Limit'] = '60';
    headers['X-RateLimit-Remaining'] = '0';
    headers['Retry-After'] = '60';
  }

  return {
    allowed: finalAction.action !== 'block',
    matchedRules,
    action: finalAction.action,
    reason: `Matched rule: ${finalAction.ruleName}`,
    ruleId: finalAction.ruleId,
    shouldChallenge: finalAction.action === 'challenge',
    headers,
  };
}

/**
 * Get all enabled rules
 */
export function getEnabledRules(): WAFRule[] {
  return AI_SECURITY_RULES.filter(r => r.enabled);
}

/**
 * Get rule by ID
 */
export function getRule(ruleId: string): WAFRule | undefined {
  return AI_SECURITY_RULES.find(r => r.id === ruleId);
}

/**
 * Enable/disable a rule
 */
export function setRuleEnabled(ruleId: string, enabled: boolean): boolean {
  const rule = AI_SECURITY_RULES.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = enabled;
    return true;
  }
  return false;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  processRequest,
  getEnabledRules,
  getRule,
  setRuleEnabled,
  AI_SECURITY_RULES,
};
