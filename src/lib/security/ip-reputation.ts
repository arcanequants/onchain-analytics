/**
 * IP Reputation System
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - IP reputation scoring
 * - Threat intelligence integration
 * - Blocklist/allowlist management
 * - Abuse pattern detection
 */

// ============================================================================
// TYPES
// ============================================================================

export type ReputationScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type ThreatCategory =
  | 'clean'
  | 'suspicious'
  | 'spam'
  | 'bot'
  | 'proxy'
  | 'vpn'
  | 'tor'
  | 'datacenter'
  | 'bruteforce'
  | 'scanner'
  | 'malware'
  | 'phishing';

export type IPType = 'residential' | 'mobile' | 'datacenter' | 'proxy' | 'tor' | 'unknown';

export interface IPReputation {
  ip: string;
  score: ReputationScore;
  categories: ThreatCategory[];
  ipType: IPType;
  isBlocked: boolean;
  isAllowlisted: boolean;
  country?: string;
  asn?: number;
  asnOrg?: string;
  lastSeen: Date;
  firstSeen: Date;
  requestCount: number;
  abuseCount: number;
  metadata?: Record<string, unknown>;
}

export interface IPCheck {
  ip: string;
  allowed: boolean;
  reputation: IPReputation;
  reasons: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: 'allow' | 'challenge' | 'rate_limit' | 'block';
}

export interface IPStats {
  totalIPs: number;
  blockedIPs: number;
  allowlistedIPs: number;
  avgScore: number;
  byCategory: Record<ThreatCategory, number>;
  byType: Record<IPType, number>;
  recentAbuse: number;
}

// ============================================================================
// STORAGE
// ============================================================================

const ipDatabase = new Map<string, IPReputation>();
const blocklist = new Set<string>();
const allowlist = new Set<string>();
const requestLog = new Map<string, { count: number; firstSeen: Date; lastSeen: Date }>();

// Known threat patterns
const KNOWN_MALICIOUS_RANGES = [
  // Example ranges - in production, use threat intelligence feeds
  /^10\.0\.0\./,  // Reserved - should not appear publicly
  /^192\.168\./,  // Reserved - should not appear publicly
];

const DATACENTER_ASNS = new Set([
  14061,  // DigitalOcean
  16276,  // OVH
  24940,  // Hetzner
  63949,  // Linode
  20473,  // Vultr
  16509,  // Amazon AWS
  15169,  // Google Cloud
  8075,   // Microsoft Azure
]);

const TOR_EXIT_NODES = new Set<string>(); // Would be populated from Tor Project

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Parse IP address
 */
function parseIP(ip: string): { valid: boolean; normalized: string } {
  // IPv4 validation
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);

  if (match) {
    const octets = match.slice(1).map(Number);
    if (octets.every(o => o >= 0 && o <= 255)) {
      return { valid: true, normalized: ip };
    }
  }

  // IPv6 (simplified check)
  if (ip.includes(':')) {
    return { valid: true, normalized: ip.toLowerCase() };
  }

  return { valid: false, normalized: '' };
}

/**
 * Get or create IP reputation entry
 */
function getOrCreateReputation(ip: string): IPReputation {
  const existing = ipDatabase.get(ip);
  if (existing) {
    return existing;
  }

  const now = new Date();
  const reputation: IPReputation = {
    ip,
    score: 5,  // Neutral starting score
    categories: ['clean'],
    ipType: 'unknown',
    isBlocked: blocklist.has(ip),
    isAllowlisted: allowlist.has(ip),
    lastSeen: now,
    firstSeen: now,
    requestCount: 0,
    abuseCount: 0,
  };

  ipDatabase.set(ip, reputation);
  return reputation;
}

/**
 * Detect IP type from ASN
 */
function detectIPType(asn?: number): IPType {
  if (!asn) return 'unknown';
  if (DATACENTER_ASNS.has(asn)) return 'datacenter';
  // Would check against proxy/VPN databases
  return 'residential';
}

/**
 * Check if IP matches known malicious patterns
 */
function checkMaliciousPatterns(ip: string): ThreatCategory[] {
  const categories: ThreatCategory[] = [];

  for (const pattern of KNOWN_MALICIOUS_RANGES) {
    if (pattern.test(ip)) {
      categories.push('suspicious');
    }
  }

  if (TOR_EXIT_NODES.has(ip)) {
    categories.push('tor');
  }

  return categories;
}

// ============================================================================
// REPUTATION SCORING
// ============================================================================

/**
 * Calculate reputation score based on behavior
 */
export function calculateReputationScore(ip: string): ReputationScore {
  const reputation = getOrCreateReputation(ip);
  let score = 5; // Start neutral

  // Allowlist boost
  if (reputation.isAllowlisted) {
    score += 3;
  }

  // Blocklist penalty
  if (reputation.isBlocked) {
    return 0;
  }

  // Request pattern analysis
  const log = requestLog.get(ip);
  if (log) {
    const hoursSinceFirst = (Date.now() - log.firstSeen.getTime()) / (1000 * 60 * 60);
    const requestsPerHour = log.count / Math.max(hoursSinceFirst, 1);

    // High request rate = suspicious
    if (requestsPerHour > 100) score -= 2;
    else if (requestsPerHour > 50) score -= 1;

    // Long history with no abuse = trustworthy
    if (hoursSinceFirst > 720 && reputation.abuseCount === 0) { // 30 days
      score += 2;
    }
  }

  // Abuse history
  if (reputation.abuseCount > 10) score -= 3;
  else if (reputation.abuseCount > 5) score -= 2;
  else if (reputation.abuseCount > 0) score -= 1;

  // IP type adjustments
  if (reputation.ipType === 'datacenter') score -= 1;
  if (reputation.ipType === 'tor') score -= 2;
  if (reputation.ipType === 'proxy') score -= 1;
  if (reputation.ipType === 'residential') score += 1;

  // Threat categories
  if (reputation.categories.includes('malware')) score -= 4;
  if (reputation.categories.includes('phishing')) score -= 4;
  if (reputation.categories.includes('bruteforce')) score -= 3;
  if (reputation.categories.includes('scanner')) score -= 2;
  if (reputation.categories.includes('bot')) score -= 1;

  // Clamp to valid range
  return Math.max(0, Math.min(10, Math.round(score))) as ReputationScore;
}

/**
 * Check IP and get recommendation
 */
export function checkIP(ip: string): IPCheck {
  const { valid, normalized } = parseIP(ip);

  if (!valid) {
    return {
      ip,
      allowed: false,
      reputation: getOrCreateReputation(ip),
      reasons: ['Invalid IP address format'],
      riskLevel: 'critical',
      recommendedAction: 'block',
    };
  }

  const reputation = getOrCreateReputation(normalized);
  const reasons: string[] = [];

  // Update reputation with current checks
  const maliciousCategories = checkMaliciousPatterns(normalized);
  if (maliciousCategories.length > 0) {
    reputation.categories = [...new Set([...reputation.categories, ...maliciousCategories])];
    reputation.categories = reputation.categories.filter(c => c !== 'clean');
  }

  reputation.score = calculateReputationScore(normalized);
  reputation.lastSeen = new Date();
  reputation.requestCount++;

  // Check blocklist
  if (blocklist.has(normalized)) {
    reasons.push('IP is on blocklist');
    return {
      ip: normalized,
      allowed: false,
      reputation,
      reasons,
      riskLevel: 'critical',
      recommendedAction: 'block',
    };
  }

  // Check allowlist
  if (allowlist.has(normalized)) {
    return {
      ip: normalized,
      allowed: true,
      reputation,
      reasons: ['IP is allowlisted'],
      riskLevel: 'low',
      recommendedAction: 'allow',
    };
  }

  // Determine risk level and action
  let riskLevel: 'low' | 'medium' | 'high' | 'critical';
  let recommendedAction: 'allow' | 'challenge' | 'rate_limit' | 'block';

  if (reputation.score <= 2) {
    riskLevel = 'critical';
    recommendedAction = 'block';
    reasons.push('Very low reputation score');
  } else if (reputation.score <= 4) {
    riskLevel = 'high';
    recommendedAction = 'challenge';
    reasons.push('Low reputation score');
  } else if (reputation.score <= 6) {
    riskLevel = 'medium';
    recommendedAction = 'rate_limit';
    reasons.push('Moderate reputation score');
  } else {
    riskLevel = 'low';
    recommendedAction = 'allow';
    reasons.push('Good reputation score');
  }

  // Add specific reasons
  if (reputation.ipType === 'datacenter') {
    reasons.push('Datacenter IP detected');
  }
  if (reputation.ipType === 'tor') {
    reasons.push('Tor exit node detected');
    riskLevel = 'high';
    recommendedAction = 'challenge';
  }
  if (reputation.abuseCount > 0) {
    reasons.push(`${reputation.abuseCount} previous abuse reports`);
  }

  return {
    ip: normalized,
    allowed: recommendedAction === 'allow' || recommendedAction === 'rate_limit',
    reputation,
    reasons,
    riskLevel,
    recommendedAction,
  };
}

// ============================================================================
// LIST MANAGEMENT
// ============================================================================

/**
 * Add IP to blocklist
 */
export function blockIP(ip: string, reason?: string): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  blocklist.add(normalized);
  allowlist.delete(normalized);

  const reputation = getOrCreateReputation(normalized);
  reputation.isBlocked = true;
  reputation.isAllowlisted = false;
  reputation.score = 0;

  if (reason) {
    reputation.metadata = { ...reputation.metadata, blockReason: reason };
  }
}

/**
 * Remove IP from blocklist
 */
export function unblockIP(ip: string): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  blocklist.delete(normalized);

  const reputation = ipDatabase.get(normalized);
  if (reputation) {
    reputation.isBlocked = false;
    reputation.score = calculateReputationScore(normalized);
  }
}

/**
 * Add IP to allowlist
 */
export function allowlistIP(ip: string, reason?: string): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  allowlist.add(normalized);
  blocklist.delete(normalized);

  const reputation = getOrCreateReputation(normalized);
  reputation.isAllowlisted = true;
  reputation.isBlocked = false;

  if (reason) {
    reputation.metadata = { ...reputation.metadata, allowlistReason: reason };
  }
}

/**
 * Remove IP from allowlist
 */
export function removeFromAllowlist(ip: string): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  allowlist.delete(normalized);

  const reputation = ipDatabase.get(normalized);
  if (reputation) {
    reputation.isAllowlisted = false;
    reputation.score = calculateReputationScore(normalized);
  }
}

/**
 * Report abuse from IP
 */
export function reportAbuse(ip: string, category: ThreatCategory): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  const reputation = getOrCreateReputation(normalized);
  reputation.abuseCount++;

  if (!reputation.categories.includes(category)) {
    reputation.categories.push(category);
    reputation.categories = reputation.categories.filter(c => c !== 'clean');
  }

  reputation.score = calculateReputationScore(normalized);

  // Auto-block after threshold
  if (reputation.abuseCount >= 10) {
    blockIP(normalized, 'Automatic block: abuse threshold exceeded');
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Record request from IP
 */
export function recordRequest(ip: string): void {
  const { normalized } = parseIP(ip);
  if (!normalized) return;

  const now = new Date();
  const existing = requestLog.get(normalized);

  if (existing) {
    existing.count++;
    existing.lastSeen = now;
  } else {
    requestLog.set(normalized, { count: 1, firstSeen: now, lastSeen: now });
  }

  const reputation = getOrCreateReputation(normalized);
  reputation.requestCount++;
  reputation.lastSeen = now;
}

/**
 * Get IP statistics
 */
export function getIPStats(): IPStats {
  const stats: IPStats = {
    totalIPs: ipDatabase.size,
    blockedIPs: blocklist.size,
    allowlistedIPs: allowlist.size,
    avgScore: 0,
    byCategory: {
      clean: 0,
      suspicious: 0,
      spam: 0,
      bot: 0,
      proxy: 0,
      vpn: 0,
      tor: 0,
      datacenter: 0,
      bruteforce: 0,
      scanner: 0,
      malware: 0,
      phishing: 0,
    },
    byType: {
      residential: 0,
      mobile: 0,
      datacenter: 0,
      proxy: 0,
      tor: 0,
      unknown: 0,
    },
    recentAbuse: 0,
  };

  let totalScore = 0;
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const reputation of ipDatabase.values()) {
    totalScore += reputation.score;

    for (const category of reputation.categories) {
      stats.byCategory[category]++;
    }

    stats.byType[reputation.ipType]++;

    if (reputation.lastSeen.getTime() > oneDayAgo && reputation.abuseCount > 0) {
      stats.recentAbuse++;
    }
  }

  stats.avgScore = stats.totalIPs > 0 ? totalScore / stats.totalIPs : 0;

  return stats;
}

/**
 * Get reputation for specific IP
 */
export function getReputation(ip: string): IPReputation | undefined {
  const { normalized } = parseIP(ip);
  return ipDatabase.get(normalized);
}

/**
 * Get all blocked IPs
 */
export function getBlockedIPs(): string[] {
  return Array.from(blocklist);
}

/**
 * Get all allowlisted IPs
 */
export function getAllowlistedIPs(): string[] {
  return Array.from(allowlist);
}

/**
 * Clear old entries
 */
export function cleanupOldEntries(maxAgeDays: number = 90): number {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let removed = 0;

  for (const [ip, reputation] of ipDatabase.entries()) {
    if (reputation.lastSeen.getTime() < cutoff && !reputation.isBlocked && !reputation.isAllowlisted) {
      ipDatabase.delete(ip);
      requestLog.delete(ip);
      removed++;
    }
  }

  return removed;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Core
  checkIP,
  calculateReputationScore,
  getReputation,

  // List management
  blockIP,
  unblockIP,
  allowlistIP,
  removeFromAllowlist,

  // Abuse reporting
  reportAbuse,
  recordRequest,

  // Analytics
  getIPStats,
  getBlockedIPs,
  getAllowlistedIPs,
  cleanupOldEntries,
};
