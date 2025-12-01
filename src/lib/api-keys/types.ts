/**
 * API Key Types
 *
 * Type definitions for API key management
 *
 * Phase 2, Week 8, Day 1
 */

// ================================================================
// API KEY
// ================================================================

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: ApiKeyPermission[];
  rateLimit: number;
  rateLimitPeriod: RateLimitPeriod;
  isActive: boolean;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyCreate {
  userId: string;
  name: string;
  permissions?: ApiKeyPermission[];
  expiresInDays?: number;
  rateLimit?: number;
  metadata?: Record<string, unknown>;
}

export interface ApiKeyCreated {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
  permissions: ApiKeyPermission[];
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyUpdate {
  name?: string;
  permissions?: ApiKeyPermission[];
  isActive?: boolean;
  rateLimit?: number;
  metadata?: Record<string, unknown>;
}

// ================================================================
// PERMISSIONS
// ================================================================

export const API_KEY_PERMISSIONS = [
  'read:scores',
  'write:scores',
  'read:brands',
  'write:brands',
  'read:leaderboards',
  'read:webhooks',
  'write:webhooks',
  'read:reports',
  'write:reports',
  'admin',
] as const;

export type ApiKeyPermission = (typeof API_KEY_PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<ApiKeyPermission, string> = {
  'read:scores': 'Read Scores',
  'write:scores': 'Create/Update Scores',
  'read:brands': 'Read Brands',
  'write:brands': 'Create/Update Brands',
  'read:leaderboards': 'Read Leaderboards',
  'read:webhooks': 'Read Webhooks',
  'write:webhooks': 'Manage Webhooks',
  'read:reports': 'Read Reports',
  'write:reports': 'Generate Reports',
  'admin': 'Full Admin Access',
};

export const DEFAULT_PERMISSIONS: ApiKeyPermission[] = [
  'read:scores',
  'read:brands',
  'read:leaderboards',
];

// ================================================================
// RATE LIMITING
// ================================================================

export type RateLimitPeriod = 'minute' | 'hour' | 'day';

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  period: RateLimitPeriod;
}

export const RATE_LIMIT_PERIODS_MS: Record<RateLimitPeriod, number> = {
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

// ================================================================
// API KEY USAGE
// ================================================================

export interface ApiKeyUsage {
  keyId: string;
  date: Date;
  requestCount: number;
  successCount: number;
  errorCount: number;
  rateLimitHits: number;
  topEndpoints: EndpointUsage[];
}

export interface EndpointUsage {
  endpoint: string;
  method: string;
  count: number;
}

// ================================================================
// VALIDATION
// ================================================================

export interface ApiKeyValidation {
  valid: boolean;
  keyId?: string;
  userId?: string;
  permissions?: ApiKeyPermission[];
  rateLimit?: RateLimitInfo;
  error?: string;
}

// ================================================================
// CONSTANTS
// ================================================================

export const API_KEY_PREFIX = 'aip_';
export const API_KEY_LENGTH = 32;
export const MAX_KEYS_PER_USER = 10;
export const DEFAULT_RATE_LIMIT = 1000;
export const DEFAULT_RATE_LIMIT_PERIOD: RateLimitPeriod = 'day';
export const DEFAULT_EXPIRY_DAYS = 365;
