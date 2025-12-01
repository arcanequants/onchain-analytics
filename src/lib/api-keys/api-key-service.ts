/**
 * API Key Service
 *
 * Business logic for API key management, validation, and rate limiting
 *
 * Phase 2, Week 8, Day 1
 */

import * as crypto from 'crypto';
import {
  type ApiKey,
  type ApiKeyCreate,
  type ApiKeyCreated,
  type ApiKeyUpdate,
  type ApiKeyPermission,
  type ApiKeyValidation,
  type RateLimitInfo,
  type RateLimitPeriod,
  type ApiKeyUsage,
  API_KEY_PERMISSIONS,
  API_KEY_PREFIX,
  API_KEY_LENGTH,
  MAX_KEYS_PER_USER,
  DEFAULT_RATE_LIMIT,
  DEFAULT_RATE_LIMIT_PERIOD,
  DEFAULT_EXPIRY_DAYS,
  DEFAULT_PERMISSIONS,
  RATE_LIMIT_PERIODS_MS,
} from './types';

// ================================================================
// MOCK DATA STORE
// ================================================================

const mockApiKeys: Map<string, ApiKey> = new Map();
const mockRateLimits: Map<string, { count: number; resetAt: number }> = new Map();
const mockUsage: ApiKeyUsage[] = [];

// Initialize test data
function initMockData() {
  const testKeyHash = hashApiKey('aip_test1234567890abcdef12345678');
  const testKey: ApiKey = {
    id: 'key_test123',
    userId: 'user-1',
    name: 'Test API Key',
    keyHash: testKeyHash,
    keyPrefix: 'aip_test1234',
    permissions: ['read:scores', 'read:brands'],
    rateLimit: 1000,
    rateLimitPeriod: 'day',
    isActive: true,
    lastUsedAt: null,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockApiKeys.set(testKey.id, testKey);
}

initMockData();

// ================================================================
// KEY GENERATION
// ================================================================

/**
 * Generate a new API key
 */
export function generateApiKey(): string {
  const randomBytes = crypto.randomBytes(API_KEY_LENGTH);
  return `${API_KEY_PREFIX}${randomBytes.toString('hex').slice(0, API_KEY_LENGTH)}`;
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Extract prefix from API key (for identification)
 */
export function extractKeyPrefix(key: string): string {
  return key.slice(0, 12);
}

/**
 * Validate API key format
 */
export function isValidKeyFormat(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  return key.startsWith(API_KEY_PREFIX) && key.length === API_KEY_PREFIX.length + API_KEY_LENGTH;
}

// ================================================================
// API KEY MANAGEMENT
// ================================================================

/**
 * Create a new API key
 */
export async function createApiKey(data: ApiKeyCreate): Promise<ApiKeyCreated> {
  // Check user limit
  const userKeys = await getUserApiKeys(data.userId);
  if (userKeys.length >= MAX_KEYS_PER_USER) {
    throw new Error(`Maximum API keys limit (${MAX_KEYS_PER_USER}) reached`);
  }

  // Generate the key
  const rawKey = generateApiKey();
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = extractKeyPrefix(rawKey);

  // Calculate expiry
  const expiresAt = data.expiresInDays
    ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const permissions = data.permissions || DEFAULT_PERMISSIONS;

  // Validate permissions
  if (!permissions.every((p) => API_KEY_PERMISSIONS.includes(p))) {
    throw new Error('Invalid permission');
  }

  const apiKey: ApiKey = {
    id: `key_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId: data.userId,
    name: data.name,
    keyHash,
    keyPrefix,
    permissions,
    rateLimit: data.rateLimit || DEFAULT_RATE_LIMIT,
    rateLimitPeriod: DEFAULT_RATE_LIMIT_PERIOD,
    isActive: true,
    lastUsedAt: null,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
    metadata: data.metadata,
  };

  mockApiKeys.set(apiKey.id, apiKey);

  return {
    id: apiKey.id,
    key: rawKey,
    keyPrefix,
    name: apiKey.name,
    permissions: apiKey.permissions,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

/**
 * Get API key by ID
 */
export async function getApiKey(keyId: string): Promise<ApiKey | null> {
  return mockApiKeys.get(keyId) || null;
}

/**
 * Get API key by hash (used for validation)
 */
export async function getApiKeyByHash(hash: string): Promise<ApiKey | null> {
  for (const [, key] of mockApiKeys) {
    if (key.keyHash === hash) {
      return key;
    }
  }
  return null;
}

/**
 * Get user's API keys
 */
export async function getUserApiKeys(userId: string): Promise<ApiKey[]> {
  return Array.from(mockApiKeys.values()).filter((k) => k.userId === userId);
}

/**
 * Update API key
 */
export async function updateApiKey(
  keyId: string,
  data: ApiKeyUpdate
): Promise<ApiKey | null> {
  const apiKey = await getApiKey(keyId);
  if (!apiKey) return null;

  if (data.permissions && !data.permissions.every((p) => API_KEY_PERMISSIONS.includes(p))) {
    throw new Error('Invalid permission');
  }

  const updated: ApiKey = {
    ...apiKey,
    ...data,
    updatedAt: new Date(),
  };

  mockApiKeys.set(keyId, updated);
  return updated;
}

/**
 * Revoke (delete) API key
 */
export async function revokeApiKey(keyId: string): Promise<boolean> {
  return mockApiKeys.delete(keyId);
}

/**
 * Deactivate API key (soft delete)
 */
export async function deactivateApiKey(keyId: string): Promise<ApiKey | null> {
  return updateApiKey(keyId, { isActive: false });
}

/**
 * Activate API key
 */
export async function activateApiKey(keyId: string): Promise<ApiKey | null> {
  return updateApiKey(keyId, { isActive: true });
}

// ================================================================
// VALIDATION
// ================================================================

/**
 * Validate API key and check permissions
 */
export async function validateApiKey(
  key: string,
  requiredPermission?: ApiKeyPermission
): Promise<ApiKeyValidation> {
  // Check format
  if (!isValidKeyFormat(key)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Find key by hash
  const keyHash = hashApiKey(key);
  const apiKey = await getApiKeyByHash(keyHash);

  if (!apiKey) {
    return { valid: false, error: 'API key not found' };
  }

  // Check if active
  if (!apiKey.isActive) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check expiry
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Check permission if required
  if (requiredPermission) {
    const hasPermission =
      apiKey.permissions.includes('admin') ||
      apiKey.permissions.includes(requiredPermission);

    if (!hasPermission) {
      return { valid: false, error: 'Insufficient permissions' };
    }
  }

  // Check rate limit
  const rateLimitInfo = await checkRateLimit(apiKey);
  if (rateLimitInfo.remaining <= 0) {
    return {
      valid: false,
      error: 'Rate limit exceeded',
      rateLimit: rateLimitInfo,
    };
  }

  // Update last used
  apiKey.lastUsedAt = new Date();
  mockApiKeys.set(apiKey.id, apiKey);

  // Increment rate limit counter
  await incrementRateLimit(apiKey);

  return {
    valid: true,
    keyId: apiKey.id,
    userId: apiKey.userId,
    permissions: apiKey.permissions,
    rateLimit: rateLimitInfo,
  };
}

/**
 * Check if key has specific permission
 */
export function hasPermission(
  permissions: ApiKeyPermission[],
  required: ApiKeyPermission
): boolean {
  return permissions.includes('admin') || permissions.includes(required);
}

/**
 * Check if key has any of the required permissions
 */
export function hasAnyPermission(
  permissions: ApiKeyPermission[],
  required: ApiKeyPermission[]
): boolean {
  if (permissions.includes('admin')) return true;
  return required.some((p) => permissions.includes(p));
}

/**
 * Check if key has all required permissions
 */
export function hasAllPermissions(
  permissions: ApiKeyPermission[],
  required: ApiKeyPermission[]
): boolean {
  if (permissions.includes('admin')) return true;
  return required.every((p) => permissions.includes(p));
}

// ================================================================
// RATE LIMITING
// ================================================================

/**
 * Check rate limit for API key
 */
export async function checkRateLimit(apiKey: ApiKey): Promise<RateLimitInfo> {
  const periodMs = RATE_LIMIT_PERIODS_MS[apiKey.rateLimitPeriod];
  const now = Date.now();

  const rateLimitKey = `${apiKey.id}:${Math.floor(now / periodMs)}`;
  const current = mockRateLimits.get(rateLimitKey);

  const count = current?.count || 0;
  const resetAt = current?.resetAt || now + periodMs;

  return {
    limit: apiKey.rateLimit,
    remaining: Math.max(0, apiKey.rateLimit - count),
    reset: new Date(resetAt),
    period: apiKey.rateLimitPeriod,
  };
}

/**
 * Increment rate limit counter
 */
async function incrementRateLimit(apiKey: ApiKey): Promise<void> {
  const periodMs = RATE_LIMIT_PERIODS_MS[apiKey.rateLimitPeriod];
  const now = Date.now();

  const rateLimitKey = `${apiKey.id}:${Math.floor(now / periodMs)}`;
  const current = mockRateLimits.get(rateLimitKey);

  if (current) {
    current.count++;
    mockRateLimits.set(rateLimitKey, current);
  } else {
    mockRateLimits.set(rateLimitKey, {
      count: 1,
      resetAt: now + periodMs,
    });
  }
}

/**
 * Reset rate limit for API key
 */
export async function resetRateLimit(keyId: string): Promise<void> {
  const prefix = `${keyId}:`;
  for (const key of mockRateLimits.keys()) {
    if (key.startsWith(prefix)) {
      mockRateLimits.delete(key);
    }
  }
}

// ================================================================
// USAGE TRACKING
// ================================================================

/**
 * Record API key usage
 */
export async function recordUsage(
  keyId: string,
  endpoint: string,
  method: string,
  success: boolean
): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let usage = mockUsage.find(
    (u) => u.keyId === keyId && u.date.getTime() === today.getTime()
  );

  if (!usage) {
    usage = {
      keyId,
      date: today,
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      rateLimitHits: 0,
      topEndpoints: [],
    };
    mockUsage.push(usage);
  }

  usage.requestCount++;
  if (success) {
    usage.successCount++;
  } else {
    usage.errorCount++;
  }

  // Update endpoint stats
  const endpointKey = `${method} ${endpoint}`;
  const existingEndpoint = usage.topEndpoints.find(
    (e) => e.endpoint === endpoint && e.method === method
  );

  if (existingEndpoint) {
    existingEndpoint.count++;
  } else {
    usage.topEndpoints.push({ endpoint, method, count: 1 });
  }

  // Keep only top 10 endpoints
  usage.topEndpoints.sort((a, b) => b.count - a.count);
  usage.topEndpoints = usage.topEndpoints.slice(0, 10);
}

/**
 * Get API key usage for a date range
 */
export async function getKeyUsage(
  keyId: string,
  startDate: Date,
  endDate: Date
): Promise<ApiKeyUsage[]> {
  return mockUsage.filter(
    (u) =>
      u.keyId === keyId &&
      u.date >= startDate &&
      u.date <= endDate
  );
}

/**
 * Get aggregate usage stats for an API key
 */
export async function getKeyUsageStats(
  keyId: string,
  days: number = 30
): Promise<{
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  avgRequestsPerDay: number;
  successRate: number;
}> {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const usage = await getKeyUsage(keyId, startDate, endDate);

  const totalRequests = usage.reduce((sum, u) => sum + u.requestCount, 0);
  const totalSuccess = usage.reduce((sum, u) => sum + u.successCount, 0);
  const totalErrors = usage.reduce((sum, u) => sum + u.errorCount, 0);

  return {
    totalRequests,
    totalSuccess,
    totalErrors,
    avgRequestsPerDay: totalRequests / (usage.length || 1),
    successRate: totalRequests > 0 ? (totalSuccess / totalRequests) * 100 : 0,
  };
}

// ================================================================
// UTILITIES
// ================================================================

/**
 * Mask API key for display
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 12) return '****';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Parse API key from Authorization header
 */
export function parseAuthorizationHeader(header: string | null): string | null {
  if (!header) return null;

  // Bearer token
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  // X-API-Key style
  if (header.startsWith(API_KEY_PREFIX)) {
    return header;
  }

  return null;
}

/**
 * Get expiring keys for a user (within days)
 */
export async function getExpiringKeys(
  userId: string,
  withinDays: number = 7
): Promise<ApiKey[]> {
  const userKeys = await getUserApiKeys(userId);
  const threshold = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);

  return userKeys.filter(
    (k) => k.isActive && k.expiresAt && k.expiresAt <= threshold
  );
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  isValidKeyFormat,
  createApiKey,
  getApiKey,
  getApiKeyByHash,
  getUserApiKeys,
  updateApiKey,
  revokeApiKey,
  deactivateApiKey,
  activateApiKey,
  validateApiKey,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkRateLimit,
  resetRateLimit,
  recordUsage,
  getKeyUsage,
  getKeyUsageStats,
  maskApiKey,
  parseAuthorizationHeader,
  getExpiringKeys,
};
