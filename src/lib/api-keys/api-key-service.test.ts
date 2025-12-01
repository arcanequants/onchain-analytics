/**
 * API Key Service Tests
 *
 * Phase 2, Week 8, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  hashApiKey,
  extractKeyPrefix,
  isValidKeyFormat,
  createApiKey,
  getApiKey,
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
} from './api-key-service';
import { API_KEY_PREFIX, API_KEY_LENGTH } from './types';

// ================================================================
// KEY GENERATION TESTS
// ================================================================

describe('generateApiKey', () => {
  it('should generate a key with correct prefix', () => {
    const key = generateApiKey();
    expect(key.startsWith(API_KEY_PREFIX)).toBe(true);
  });

  it('should generate a key with correct length', () => {
    const key = generateApiKey();
    expect(key.length).toBe(API_KEY_PREFIX.length + API_KEY_LENGTH);
  });

  it('should generate unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey());
    }
    expect(keys.size).toBe(100);
  });
});

describe('hashApiKey', () => {
  it('should generate consistent hashes', () => {
    const key = 'aip_test123';
    const hash1 = hashApiKey(key);
    const hash2 = hashApiKey(key);

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different keys', () => {
    const hash1 = hashApiKey('aip_key1');
    const hash2 = hashApiKey('aip_key2');

    expect(hash1).not.toBe(hash2);
  });

  it('should generate 64 character hex hash', () => {
    const hash = hashApiKey('aip_test');
    expect(hash.length).toBe(64);
    expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
  });
});

describe('extractKeyPrefix', () => {
  it('should extract first 12 characters', () => {
    const key = 'aip_1234567890abcdef';
    const prefix = extractKeyPrefix(key);

    expect(prefix).toBe('aip_12345678');
    expect(prefix.length).toBe(12);
  });
});

describe('isValidKeyFormat', () => {
  it('should accept valid key format', () => {
    const key = generateApiKey();
    expect(isValidKeyFormat(key)).toBe(true);
  });

  it('should reject invalid prefix', () => {
    expect(isValidKeyFormat('invalid_' + 'a'.repeat(32))).toBe(false);
  });

  it('should reject short keys', () => {
    expect(isValidKeyFormat('aip_abc')).toBe(false);
  });

  it('should reject null/undefined', () => {
    expect(isValidKeyFormat(null as unknown as string)).toBe(false);
    expect(isValidKeyFormat(undefined as unknown as string)).toBe(false);
  });
});

// ================================================================
// API KEY MANAGEMENT TESTS
// ================================================================

describe('createApiKey', () => {
  it('should create an API key', async () => {
    const result = await createApiKey({
      userId: 'user-create-key',
      name: 'Test Key',
    });

    expect(result.id).toBeDefined();
    expect(result.key).toMatch(/^aip_/);
    expect(result.name).toBe('Test Key');
    expect(result.permissions).toBeDefined();
  });

  it('should return full key only on creation', async () => {
    const result = await createApiKey({
      userId: 'user-key-once',
      name: 'One Time Key',
    });

    expect(result.key.length).toBe(API_KEY_PREFIX.length + API_KEY_LENGTH);

    // Getting the key later should not return full key
    const retrieved = await getApiKey(result.id);
    expect(retrieved).not.toHaveProperty('key');
  });

  it('should set custom permissions', async () => {
    const result = await createApiKey({
      userId: 'user-permissions',
      name: 'Custom Permissions',
      permissions: ['read:scores', 'write:scores'],
    });

    expect(result.permissions).toContain('read:scores');
    expect(result.permissions).toContain('write:scores');
  });

  it('should reject invalid permissions', async () => {
    await expect(
      createApiKey({
        userId: 'user-invalid-perm',
        name: 'Invalid',
        permissions: ['invalid:permission' as any],
      })
    ).rejects.toThrow('Invalid permission');
  });

  it('should set expiry date', async () => {
    const result = await createApiKey({
      userId: 'user-expiry',
      name: 'Expiring Key',
      expiresInDays: 30,
    });

    expect(result.expiresAt).toBeDefined();
    const expectedExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(result.expiresAt!.getTime()).toBeCloseTo(expectedExpiry.getTime(), -4);
  });
});

describe('getApiKey', () => {
  it('should return key by ID', async () => {
    const key = await getApiKey('key_test123');

    expect(key).not.toBeNull();
    expect(key?.id).toBe('key_test123');
  });

  it('should return null for non-existent key', async () => {
    const key = await getApiKey('key_nonexistent');

    expect(key).toBeNull();
  });
});

describe('getUserApiKeys', () => {
  it('should return user keys', async () => {
    const keys = await getUserApiKeys('user-1');

    expect(Array.isArray(keys)).toBe(true);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.userId === 'user-1')).toBe(true);
  });

  it('should return empty array for user with no keys', async () => {
    const keys = await getUserApiKeys('user-no-keys');

    expect(keys).toEqual([]);
  });
});

describe('updateApiKey', () => {
  it('should update key name', async () => {
    const created = await createApiKey({
      userId: 'user-update',
      name: 'Original Name',
    });

    const updated = await updateApiKey(created.id, { name: 'New Name' });

    expect(updated?.name).toBe('New Name');
  });

  it('should update permissions', async () => {
    const created = await createApiKey({
      userId: 'user-update-perms',
      name: 'Update Perms',
      permissions: ['read:scores'],
    });

    const updated = await updateApiKey(created.id, {
      permissions: ['read:scores', 'read:brands'],
    });

    expect(updated?.permissions).toContain('read:brands');
  });

  it('should return null for non-existent key', async () => {
    const result = await updateApiKey('key_nonexistent', { name: 'New' });

    expect(result).toBeNull();
  });
});

describe('revokeApiKey', () => {
  it('should revoke key', async () => {
    const created = await createApiKey({
      userId: 'user-revoke',
      name: 'Revoke Me',
    });

    const revoked = await revokeApiKey(created.id);
    expect(revoked).toBe(true);

    const retrieved = await getApiKey(created.id);
    expect(retrieved).toBeNull();
  });

  it('should return false for non-existent key', async () => {
    const result = await revokeApiKey('key_nonexistent');

    expect(result).toBe(false);
  });
});

describe('deactivateApiKey / activateApiKey', () => {
  it('should deactivate key', async () => {
    const created = await createApiKey({
      userId: 'user-deactivate',
      name: 'Deactivate Me',
    });

    const deactivated = await deactivateApiKey(created.id);
    expect(deactivated?.isActive).toBe(false);
  });

  it('should activate key', async () => {
    const created = await createApiKey({
      userId: 'user-activate',
      name: 'Activate Me',
    });

    await deactivateApiKey(created.id);
    const activated = await activateApiKey(created.id);

    expect(activated?.isActive).toBe(true);
  });
});

// ================================================================
// VALIDATION TESTS
// ================================================================

describe('validateApiKey', () => {
  it('should validate valid key', async () => {
    const created = await createApiKey({
      userId: 'user-validate',
      name: 'Validate Me',
      permissions: ['read:scores'],
    });

    const result = await validateApiKey(created.key);

    expect(result.valid).toBe(true);
    expect(result.keyId).toBe(created.id);
    expect(result.userId).toBe('user-validate');
  });

  it('should reject invalid format', async () => {
    const result = await validateApiKey('invalid-key');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('format');
  });

  it('should reject non-existent key', async () => {
    const result = await validateApiKey(generateApiKey());

    expect(result.valid).toBe(false);
    expect(result.error).toContain('not found');
  });

  it('should check permissions', async () => {
    const created = await createApiKey({
      userId: 'user-check-perm',
      name: 'Limited Key',
      permissions: ['read:scores'],
    });

    const result = await validateApiKey(created.key, 'write:scores');

    expect(result.valid).toBe(false);
    expect(result.error).toContain('permissions');
  });

  it('should allow admin permission for any operation', async () => {
    const created = await createApiKey({
      userId: 'user-admin',
      name: 'Admin Key',
      permissions: ['admin'],
    });

    const result = await validateApiKey(created.key, 'write:scores');

    expect(result.valid).toBe(true);
  });

  it('should reject inactive key', async () => {
    const created = await createApiKey({
      userId: 'user-inactive',
      name: 'Inactive Key',
    });

    await deactivateApiKey(created.id);

    const result = await validateApiKey(created.key);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('inactive');
  });
});

// ================================================================
// PERMISSION HELPER TESTS
// ================================================================

describe('hasPermission', () => {
  it('should return true if has permission', () => {
    expect(hasPermission(['read:scores', 'write:scores'], 'read:scores')).toBe(true);
  });

  it('should return false if missing permission', () => {
    expect(hasPermission(['read:scores'], 'write:scores')).toBe(false);
  });

  it('should return true for admin', () => {
    expect(hasPermission(['admin'], 'write:scores')).toBe(true);
  });
});

describe('hasAnyPermission', () => {
  it('should return true if has any permission', () => {
    expect(hasAnyPermission(['read:scores'], ['read:scores', 'write:scores'])).toBe(true);
  });

  it('should return false if has none', () => {
    expect(hasAnyPermission(['read:brands'], ['read:scores', 'write:scores'])).toBe(false);
  });

  it('should return true for admin', () => {
    expect(hasAnyPermission(['admin'], ['read:scores', 'write:scores'])).toBe(true);
  });
});

describe('hasAllPermissions', () => {
  it('should return true if has all permissions', () => {
    expect(hasAllPermissions(['read:scores', 'write:scores'], ['read:scores', 'write:scores'])).toBe(true);
  });

  it('should return false if missing some', () => {
    expect(hasAllPermissions(['read:scores'], ['read:scores', 'write:scores'])).toBe(false);
  });

  it('should return true for admin', () => {
    expect(hasAllPermissions(['admin'], ['read:scores', 'write:scores'])).toBe(true);
  });
});

// ================================================================
// RATE LIMITING TESTS
// ================================================================

describe('checkRateLimit', () => {
  it('should return rate limit info', async () => {
    const created = await createApiKey({
      userId: 'user-rate-limit',
      name: 'Rate Limited Key',
      rateLimit: 100,
    });

    const apiKey = await getApiKey(created.id);
    const info = await checkRateLimit(apiKey!);

    expect(info.limit).toBe(100);
    expect(info.remaining).toBe(100);
    expect(info.reset).toBeDefined();
  });
});

describe('resetRateLimit', () => {
  it('should reset rate limit', async () => {
    const created = await createApiKey({
      userId: 'user-reset-limit',
      name: 'Reset Key',
      rateLimit: 10,
    });

    // Use some requests
    await validateApiKey(created.key);
    await validateApiKey(created.key);

    // Reset
    await resetRateLimit(created.id);

    // Check reset
    const apiKey = await getApiKey(created.id);
    const info = await checkRateLimit(apiKey!);

    expect(info.remaining).toBe(10);
  });
});

// ================================================================
// USAGE TRACKING TESTS
// ================================================================

describe('recordUsage', () => {
  it('should record usage', async () => {
    const created = await createApiKey({
      userId: 'user-record-usage',
      name: 'Usage Key',
    });

    await recordUsage(created.id, '/api/scores', 'POST', true);
    await recordUsage(created.id, '/api/scores', 'POST', true);
    await recordUsage(created.id, '/api/brands', 'GET', false);

    const stats = await getKeyUsageStats(created.id, 1);

    expect(stats.totalRequests).toBe(3);
    expect(stats.totalSuccess).toBe(2);
    expect(stats.totalErrors).toBe(1);
  });
});

describe('getKeyUsage', () => {
  it('should return usage for date range', async () => {
    const created = await createApiKey({
      userId: 'user-get-usage',
      name: 'Get Usage Key',
    });

    await recordUsage(created.id, '/api/test', 'GET', true);

    const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const usage = await getKeyUsage(created.id, startDate, endDate);

    expect(Array.isArray(usage)).toBe(true);
  });
});

describe('getKeyUsageStats', () => {
  it('should calculate success rate', async () => {
    const created = await createApiKey({
      userId: 'user-success-rate',
      name: 'Success Rate Key',
    });

    await recordUsage(created.id, '/api/test', 'GET', true);
    await recordUsage(created.id, '/api/test', 'GET', true);
    await recordUsage(created.id, '/api/test', 'GET', true);
    await recordUsage(created.id, '/api/test', 'GET', false);

    const stats = await getKeyUsageStats(created.id, 1);

    expect(stats.successRate).toBe(75);
  });
});

// ================================================================
// UTILITY TESTS
// ================================================================

describe('maskApiKey', () => {
  it('should mask API key', () => {
    const masked = maskApiKey('aip_1234567890abcdef12345678');

    expect(masked).toBe('aip_1234...5678');
    expect(masked).not.toContain('567890ab');
  });

  it('should handle short keys', () => {
    expect(maskApiKey('short')).toBe('****');
    expect(maskApiKey('')).toBe('****');
  });
});

describe('parseAuthorizationHeader', () => {
  it('should parse Bearer token', () => {
    const key = parseAuthorizationHeader('Bearer aip_testkey123');

    expect(key).toBe('aip_testkey123');
  });

  it('should parse direct API key', () => {
    const key = parseAuthorizationHeader('aip_testkey123');

    expect(key).toBe('aip_testkey123');
  });

  it('should return null for invalid header', () => {
    expect(parseAuthorizationHeader(null)).toBeNull();
    expect(parseAuthorizationHeader('')).toBeNull();
    expect(parseAuthorizationHeader('Invalid header')).toBeNull();
  });
});

describe('getExpiringKeys', () => {
  it('should return keys expiring soon', async () => {
    const created = await createApiKey({
      userId: 'user-expiring',
      name: 'Expiring Soon',
      expiresInDays: 5,
    });

    const expiring = await getExpiringKeys('user-expiring', 7);

    expect(expiring.length).toBeGreaterThan(0);
    expect(expiring.some((k) => k.id === created.id)).toBe(true);
  });

  it('should not return keys expiring later', async () => {
    const created = await createApiKey({
      userId: 'user-not-expiring',
      name: 'Not Expiring Soon',
      expiresInDays: 30,
    });

    const expiring = await getExpiringKeys('user-not-expiring', 7);

    expect(expiring.every((k) => k.id !== created.id)).toBe(true);
  });
});
