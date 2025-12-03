/**
 * API Key Rotation Policy
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - Automated key rotation scheduling
 * - Grace period management
 * - Key versioning
 * - Rotation audit logging
 */

// ============================================================================
// TYPES
// ============================================================================

export type KeyStatus = 'active' | 'rotating' | 'deprecated' | 'revoked';
export type KeyType = 'primary' | 'secondary' | 'backup';
export type RotationReason = 'scheduled' | 'manual' | 'security_incident' | 'policy_change';

export interface APIKey {
  id: string;
  keyHash: string;  // Never store raw keys
  keyPrefix: string;  // For identification (e.g., "sk-...abc")
  provider: string;
  type: KeyType;
  status: KeyStatus;
  version: number;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  lastRotatedAt?: Date;
  rotationCount: number;
  metadata?: Record<string, unknown>;
}

export interface RotationPolicy {
  id: string;
  provider: string;
  maxAgeDays: number;
  gracePeriodHours: number;
  requireDualKey: boolean;
  autoRotate: boolean;
  notifyDaysBeforeExpiry: number[];
  lastUpdated: Date;
}

export interface RotationEvent {
  id: string;
  keyId: string;
  provider: string;
  reason: RotationReason;
  oldKeyVersion: number;
  newKeyVersion: number;
  initiatedBy: string;
  initiatedAt: Date;
  completedAt?: Date;
  success: boolean;
  errorMessage?: string;
  auditDetails: Record<string, unknown>;
}

export interface RotationStatus {
  provider: string;
  activeKeys: number;
  rotatingKeys: number;
  deprecatedKeys: number;
  nextRotation: Date | null;
  lastRotation: Date | null;
  complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  issues: string[];
}

// ============================================================================
// STORAGE
// ============================================================================

const apiKeys = new Map<string, APIKey>();
const rotationPolicies = new Map<string, RotationPolicy>();
const rotationEvents: RotationEvent[] = [];

// ============================================================================
// DEFAULT POLICIES
// ============================================================================

export const DEFAULT_POLICIES: RotationPolicy[] = [
  {
    id: 'policy_openai',
    provider: 'openai',
    maxAgeDays: 90,
    gracePeriodHours: 24,
    requireDualKey: true,
    autoRotate: true,
    notifyDaysBeforeExpiry: [30, 14, 7, 1],
    lastUpdated: new Date(),
  },
  {
    id: 'policy_anthropic',
    provider: 'anthropic',
    maxAgeDays: 90,
    gracePeriodHours: 24,
    requireDualKey: true,
    autoRotate: true,
    notifyDaysBeforeExpiry: [30, 14, 7, 1],
    lastUpdated: new Date(),
  },
  {
    id: 'policy_google',
    provider: 'google',
    maxAgeDays: 90,
    gracePeriodHours: 24,
    requireDualKey: false,
    autoRotate: true,
    notifyDaysBeforeExpiry: [30, 14, 7, 1],
    lastUpdated: new Date(),
  },
  {
    id: 'policy_perplexity',
    provider: 'perplexity',
    maxAgeDays: 90,
    gracePeriodHours: 24,
    requireDualKey: false,
    autoRotate: true,
    notifyDaysBeforeExpiry: [30, 14, 7, 1],
    lastUpdated: new Date(),
  },
];

// Initialize default policies
for (const policy of DEFAULT_POLICIES) {
  rotationPolicies.set(policy.provider, policy);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique ID
 */
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hash a key (simplified - use crypto in production)
 */
function hashKey(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Extract key prefix for identification
 */
function extractKeyPrefix(key: string): string {
  if (key.length <= 8) return key;
  return `${key.substring(0, 3)}...${key.substring(key.length - 4)}`;
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/**
 * Register a new API key
 */
export function registerKey(
  provider: string,
  rawKey: string,
  type: KeyType = 'primary',
  expiresInDays?: number
): APIKey {
  const policy = rotationPolicies.get(provider);
  const maxAgeDays = expiresInDays || policy?.maxAgeDays || 90;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + maxAgeDays * 24 * 60 * 60 * 1000);

  const key: APIKey = {
    id: generateId('key'),
    keyHash: hashKey(rawKey),
    keyPrefix: extractKeyPrefix(rawKey),
    provider,
    type,
    status: 'active',
    version: 1,
    createdAt: now,
    expiresAt,
    rotationCount: 0,
  };

  apiKeys.set(key.id, key);
  return key;
}

/**
 * Get active key for provider
 */
export function getActiveKey(provider: string, type?: KeyType): APIKey | undefined {
  for (const key of apiKeys.values()) {
    if (key.provider === provider &&
        key.status === 'active' &&
        (!type || key.type === type)) {
      return key;
    }
  }
  return undefined;
}

/**
 * Get all keys for provider
 */
export function getKeysForProvider(provider: string): APIKey[] {
  return Array.from(apiKeys.values()).filter(k => k.provider === provider);
}

/**
 * Update key last used time
 */
export function recordKeyUsage(keyId: string): void {
  const key = apiKeys.get(keyId);
  if (key) {
    key.lastUsedAt = new Date();
  }
}

/**
 * Revoke a key immediately
 */
export function revokeKey(keyId: string, reason: string, initiatedBy: string): RotationEvent {
  const key = apiKeys.get(keyId);
  if (!key) {
    throw new Error(`Key ${keyId} not found`);
  }

  key.status = 'revoked';

  const event: RotationEvent = {
    id: generateId('evt'),
    keyId,
    provider: key.provider,
    reason: 'security_incident',
    oldKeyVersion: key.version,
    newKeyVersion: key.version,
    initiatedBy,
    initiatedAt: new Date(),
    completedAt: new Date(),
    success: true,
    auditDetails: { reason },
  };

  rotationEvents.push(event);
  return event;
}

// ============================================================================
// ROTATION LOGIC
// ============================================================================

/**
 * Start key rotation process
 */
export function initiateRotation(
  keyId: string,
  newRawKey: string,
  reason: RotationReason,
  initiatedBy: string
): RotationEvent {
  const oldKey = apiKeys.get(keyId);
  if (!oldKey) {
    throw new Error(`Key ${keyId} not found`);
  }

  const policy = rotationPolicies.get(oldKey.provider);
  const gracePeriodMs = (policy?.gracePeriodHours || 24) * 60 * 60 * 1000;

  // Mark old key as rotating
  oldKey.status = 'rotating';

  // Create new key
  const now = new Date();
  const newKey: APIKey = {
    id: generateId('key'),
    keyHash: hashKey(newRawKey),
    keyPrefix: extractKeyPrefix(newRawKey),
    provider: oldKey.provider,
    type: oldKey.type,
    status: 'active',
    version: oldKey.version + 1,
    createdAt: now,
    expiresAt: new Date(now.getTime() + (policy?.maxAgeDays || 90) * 24 * 60 * 60 * 1000),
    lastRotatedAt: now,
    rotationCount: 0,
  };

  apiKeys.set(newKey.id, newKey);

  // Update old key expiry for grace period
  oldKey.expiresAt = new Date(now.getTime() + gracePeriodMs);

  const event: RotationEvent = {
    id: generateId('evt'),
    keyId: newKey.id,
    provider: oldKey.provider,
    reason,
    oldKeyVersion: oldKey.version,
    newKeyVersion: newKey.version,
    initiatedBy,
    initiatedAt: now,
    success: true,
    auditDetails: {
      oldKeyId: oldKey.id,
      newKeyId: newKey.id,
      gracePeriodHours: policy?.gracePeriodHours || 24,
    },
  };

  rotationEvents.push(event);
  return event;
}

/**
 * Complete rotation (after grace period)
 */
export function completeRotation(keyId: string): void {
  const key = apiKeys.get(keyId);
  if (key && key.status === 'rotating') {
    key.status = 'deprecated';
  }
}

/**
 * Check if key needs rotation
 */
export function needsRotation(keyId: string): {
  needsRotation: boolean;
  reason?: string;
  daysUntilExpiry?: number;
} {
  const key = apiKeys.get(keyId);
  if (!key) {
    return { needsRotation: false, reason: 'Key not found' };
  }

  if (key.status !== 'active') {
    return { needsRotation: false, reason: 'Key is not active' };
  }

  const now = new Date();
  const daysUntilExpiry = Math.ceil(
    (key.expiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
  );

  const policy = rotationPolicies.get(key.provider);
  const warningThreshold = policy?.notifyDaysBeforeExpiry[0] || 30;

  if (daysUntilExpiry <= 0) {
    return {
      needsRotation: true,
      reason: 'Key has expired',
      daysUntilExpiry: 0,
    };
  }

  if (daysUntilExpiry <= warningThreshold) {
    return {
      needsRotation: true,
      reason: `Key expires in ${daysUntilExpiry} days`,
      daysUntilExpiry,
    };
  }

  return {
    needsRotation: false,
    daysUntilExpiry,
  };
}

/**
 * Get keys due for rotation
 */
export function getKeysDueForRotation(): APIKey[] {
  const dueKeys: APIKey[] = [];

  for (const key of apiKeys.values()) {
    const { needsRotation: needs } = needsRotation(key.id);
    if (needs) {
      dueKeys.push(key);
    }
  }

  return dueKeys;
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

/**
 * Get rotation policy for provider
 */
export function getPolicy(provider: string): RotationPolicy | undefined {
  return rotationPolicies.get(provider);
}

/**
 * Update rotation policy
 */
export function updatePolicy(policy: Partial<RotationPolicy> & { provider: string }): RotationPolicy {
  const existing = rotationPolicies.get(policy.provider);

  const updated: RotationPolicy = {
    id: existing?.id || generateId('policy'),
    provider: policy.provider,
    maxAgeDays: policy.maxAgeDays ?? existing?.maxAgeDays ?? 90,
    gracePeriodHours: policy.gracePeriodHours ?? existing?.gracePeriodHours ?? 24,
    requireDualKey: policy.requireDualKey ?? existing?.requireDualKey ?? true,
    autoRotate: policy.autoRotate ?? existing?.autoRotate ?? true,
    notifyDaysBeforeExpiry: policy.notifyDaysBeforeExpiry ?? existing?.notifyDaysBeforeExpiry ?? [30, 14, 7, 1],
    lastUpdated: new Date(),
  };

  rotationPolicies.set(policy.provider, updated);
  return updated;
}

/**
 * Get all policies
 */
export function getAllPolicies(): RotationPolicy[] {
  return Array.from(rotationPolicies.values());
}

// ============================================================================
// COMPLIANCE & STATUS
// ============================================================================

/**
 * Get rotation status for provider
 */
export function getRotationStatus(provider: string): RotationStatus {
  const keys = getKeysForProvider(provider);
  const policy = getPolicy(provider);
  const issues: string[] = [];

  const activeKeys = keys.filter(k => k.status === 'active');
  const rotatingKeys = keys.filter(k => k.status === 'rotating');
  const deprecatedKeys = keys.filter(k => k.status === 'deprecated');

  // Check for issues
  if (activeKeys.length === 0) {
    issues.push('No active keys');
  }

  if (policy?.requireDualKey && activeKeys.length < 2) {
    issues.push('Dual key requirement not met');
  }

  // Find next rotation date
  let nextRotation: Date | null = null;
  for (const key of activeKeys) {
    const { needsRotation: needs, daysUntilExpiry } = needsRotation(key.id);
    if (needs && daysUntilExpiry !== undefined) {
      const rotationDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
      if (!nextRotation || rotationDate < nextRotation) {
        nextRotation = rotationDate;
      }
    }
  }

  // Check for expired keys
  const now = new Date();
  for (const key of activeKeys) {
    if (key.expiresAt < now) {
      issues.push(`Key ${key.keyPrefix} has expired`);
    }
  }

  // Find last rotation
  const providerEvents = rotationEvents
    .filter(e => e.provider === provider)
    .sort((a, b) => b.initiatedAt.getTime() - a.initiatedAt.getTime());
  const lastRotation = providerEvents[0]?.initiatedAt || null;

  // Determine compliance status
  let complianceStatus: 'compliant' | 'warning' | 'non_compliant';
  if (issues.length === 0) {
    complianceStatus = 'compliant';
  } else if (issues.some(i => i.includes('expired') || i.includes('No active'))) {
    complianceStatus = 'non_compliant';
  } else {
    complianceStatus = 'warning';
  }

  return {
    provider,
    activeKeys: activeKeys.length,
    rotatingKeys: rotatingKeys.length,
    deprecatedKeys: deprecatedKeys.length,
    nextRotation,
    lastRotation,
    complianceStatus,
    issues,
  };
}

/**
 * Get all providers status
 */
export function getAllProvidersStatus(): RotationStatus[] {
  const providers = new Set<string>();

  for (const key of apiKeys.values()) {
    providers.add(key.provider);
  }

  for (const policy of rotationPolicies.values()) {
    providers.add(policy.provider);
  }

  return Array.from(providers).map(p => getRotationStatus(p));
}

// ============================================================================
// AUDIT
// ============================================================================

/**
 * Get rotation events
 */
export function getRotationEvents(
  filter?: {
    provider?: string;
    keyId?: string;
    since?: Date;
    limit?: number;
  }
): RotationEvent[] {
  let events = [...rotationEvents];

  if (filter?.provider) {
    events = events.filter(e => e.provider === filter.provider);
  }

  if (filter?.keyId) {
    events = events.filter(e => e.keyId === filter.keyId);
  }

  if (filter?.since) {
    events = events.filter(e => e.initiatedAt >= filter.since!);
  }

  events.sort((a, b) => b.initiatedAt.getTime() - a.initiatedAt.getTime());

  if (filter?.limit) {
    events = events.slice(0, filter.limit);
  }

  return events;
}

/**
 * Generate rotation report
 */
export function generateRotationReport(): {
  generatedAt: Date;
  providers: RotationStatus[];
  upcomingRotations: Array<{ keyId: string; provider: string; daysUntil: number }>;
  recentEvents: RotationEvent[];
  recommendations: string[];
} {
  const providers = getAllProvidersStatus();
  const recommendations: string[] = [];

  // Check for issues across providers
  for (const status of providers) {
    if (status.complianceStatus === 'non_compliant') {
      recommendations.push(`CRITICAL: ${status.provider} is non-compliant: ${status.issues.join(', ')}`);
    } else if (status.complianceStatus === 'warning') {
      recommendations.push(`WARNING: ${status.provider}: ${status.issues.join(', ')}`);
    }
  }

  // Find upcoming rotations
  const upcomingRotations: Array<{ keyId: string; provider: string; daysUntil: number }> = [];
  for (const key of apiKeys.values()) {
    if (key.status === 'active') {
      const { daysUntilExpiry } = needsRotation(key.id);
      if (daysUntilExpiry !== undefined && daysUntilExpiry <= 30) {
        upcomingRotations.push({
          keyId: key.id,
          provider: key.provider,
          daysUntil: daysUntilExpiry,
        });
      }
    }
  }

  upcomingRotations.sort((a, b) => a.daysUntil - b.daysUntil);

  return {
    generatedAt: new Date(),
    providers,
    upcomingRotations,
    recentEvents: getRotationEvents({ limit: 10 }),
    recommendations,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Key management
  registerKey,
  getActiveKey,
  getKeysForProvider,
  recordKeyUsage,
  revokeKey,

  // Rotation
  initiateRotation,
  completeRotation,
  needsRotation,
  getKeysDueForRotation,

  // Policy
  getPolicy,
  updatePolicy,
  getAllPolicies,

  // Status
  getRotationStatus,
  getAllProvidersStatus,

  // Audit
  getRotationEvents,
  generateRotationReport,

  // Constants
  DEFAULT_POLICIES,
};
