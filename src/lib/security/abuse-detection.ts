/**
 * Abuse Detection System
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - Detect abuse patterns (spam, scraping, rate abuse)
 * - Track user behavior anomalies
 * - Implement reputation scoring
 * - Auto-ban malicious actors
 */

// ============================================================================
// TYPES
// ============================================================================

export type AbuseType =
  | 'rate_abuse'         // Exceeding rate limits
  | 'scraping'           // Automated scraping behavior
  | 'spam'               // Repetitive/spammy requests
  | 'credential_stuffing'// Multiple auth attempts
  | 'enumeration'        // Resource enumeration attempts
  | 'dos_attempt'        // Denial of service patterns
  | 'bot_behavior'       // Non-human interaction patterns
  | 'content_abuse';     // Inappropriate content generation attempts

export type ActionTaken =
  | 'none'
  | 'warn'
  | 'throttle'
  | 'captcha'
  | 'temp_ban'
  | 'permanent_ban';

export interface AbuseSignal {
  type: AbuseType;
  score: number;         // 0-100
  confidence: number;    // 0-1
  evidence: string[];
  timestamp: Date;
}

export interface UserBehavior {
  userId: string;
  ipAddress: string;
  sessionId?: string;
  requestCount: number;
  uniqueQueries: number;
  avgRequestInterval: number;  // ms between requests
  minRequestInterval: number;
  errorCount: number;
  firstSeen: Date;
  lastSeen: Date;
  signals: AbuseSignal[];
}

export interface ReputationScore {
  userId: string;
  score: number;           // 0-100, higher = more trusted
  factors: {
    accountAge: number;
    verifiedEmail: boolean;
    payingCustomer: boolean;
    previousAbuse: number;
    successfulRequests: number;
    failedRequests: number;
  };
  tier: 'trusted' | 'normal' | 'suspicious' | 'banned';
  lastUpdated: Date;
}

export interface AbuseDetectionResult {
  isAbusive: boolean;
  overallScore: number;
  signals: AbuseSignal[];
  recommendedAction: ActionTaken;
  reason: string;
  userId?: string;
  ipAddress?: string;
}

export interface BanRecord {
  id: string;
  userId?: string;
  ipAddress?: string;
  type: 'temp_ban' | 'permanent_ban';
  reason: string;
  abuseType: AbuseType;
  createdAt: Date;
  expiresAt?: Date;
  lifted: boolean;
  liftedAt?: Date;
  liftedBy?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const ABUSE_THRESHOLDS = {
  rateAbuse: {
    requestsPerMinute: 60,
    requestsPerHour: 500,
    requestsPerDay: 5000,
  },
  scraping: {
    uniqueQueriesPerHour: 100,
    minIntervalMs: 100,
    sequentialPatternThreshold: 0.8,
  },
  spam: {
    duplicateQueryThreshold: 0.7,
    repetitivePatternScore: 0.6,
  },
  reputation: {
    warningThreshold: 40,
    throttleThreshold: 30,
    captchaThreshold: 20,
    banThreshold: 10,
  },
};

// ============================================================================
// STORAGE (In-memory - would be Redis/DB in production)
// ============================================================================

const userBehaviors = new Map<string, UserBehavior>();
const reputationScores = new Map<string, ReputationScore>();
const banRecords = new Map<string, BanRecord>();
const requestLog: Array<{ userId: string; timestamp: Date; query: string }> = [];
const MAX_REQUEST_LOG = 100000;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get or create user behavior record
 */
function getOrCreateBehavior(userId: string, ipAddress: string): UserBehavior {
  const key = userId || ipAddress;
  let behavior = userBehaviors.get(key);

  if (!behavior) {
    behavior = {
      userId,
      ipAddress,
      requestCount: 0,
      uniqueQueries: 0,
      avgRequestInterval: Infinity,
      minRequestInterval: Infinity,
      errorCount: 0,
      firstSeen: new Date(),
      lastSeen: new Date(),
      signals: [],
    };
    userBehaviors.set(key, behavior);
  }

  return behavior;
}

/**
 * Calculate request rate for user
 */
function calculateRequestRate(userId: string, windowMs: number): number {
  const cutoff = new Date(Date.now() - windowMs);
  return requestLog.filter(
    r => r.userId === userId && r.timestamp >= cutoff
  ).length;
}

/**
 * Check for duplicate/similar queries
 */
function checkDuplicateQueries(userId: string, windowMs: number): number {
  const cutoff = new Date(Date.now() - windowMs);
  const recentQueries = requestLog
    .filter(r => r.userId === userId && r.timestamp >= cutoff)
    .map(r => r.query.toLowerCase().trim());

  if (recentQueries.length < 2) return 0;

  const queryCounts = new Map<string, number>();
  for (const q of recentQueries) {
    queryCounts.set(q, (queryCounts.get(q) || 0) + 1);
  }

  const maxDupes = Math.max(...queryCounts.values());
  return maxDupes / recentQueries.length;
}

/**
 * Check for sequential/enumeration patterns
 */
function checkSequentialPatterns(userId: string): number {
  const recentQueries = requestLog
    .filter(r => r.userId === userId)
    .slice(-20)
    .map(r => r.query);

  if (recentQueries.length < 5) return 0;

  // Look for numeric patterns (brand1, brand2, brand3...)
  let sequentialScore = 0;
  for (let i = 1; i < recentQueries.length; i++) {
    const prev = recentQueries[i - 1].match(/\d+/);
    const curr = recentQueries[i].match(/\d+/);

    if (prev && curr) {
      const prevNum = parseInt(prev[0]);
      const currNum = parseInt(curr[0]);
      if (currNum === prevNum + 1) {
        sequentialScore += 0.1;
      }
    }
  }

  return Math.min(1, sequentialScore);
}

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detect rate abuse
 */
function detectRateAbuse(behavior: UserBehavior): AbuseSignal | null {
  const key = behavior.userId || behavior.ipAddress;

  const perMinute = calculateRequestRate(key, 60 * 1000);
  const perHour = calculateRequestRate(key, 60 * 60 * 1000);

  let score = 0;
  const evidence: string[] = [];

  if (perMinute > ABUSE_THRESHOLDS.rateAbuse.requestsPerMinute) {
    score += 40;
    evidence.push(`${perMinute} requests/minute (limit: ${ABUSE_THRESHOLDS.rateAbuse.requestsPerMinute})`);
  }

  if (perHour > ABUSE_THRESHOLDS.rateAbuse.requestsPerHour) {
    score += 30;
    evidence.push(`${perHour} requests/hour (limit: ${ABUSE_THRESHOLDS.rateAbuse.requestsPerHour})`);
  }

  if (behavior.minRequestInterval < ABUSE_THRESHOLDS.scraping.minIntervalMs) {
    score += 20;
    evidence.push(`Min interval: ${behavior.minRequestInterval}ms (threshold: ${ABUSE_THRESHOLDS.scraping.minIntervalMs}ms)`);
  }

  if (score > 0) {
    return {
      type: 'rate_abuse',
      score: Math.min(100, score),
      confidence: 0.9,
      evidence,
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Detect scraping behavior
 */
function detectScraping(behavior: UserBehavior): AbuseSignal | null {
  const key = behavior.userId || behavior.ipAddress;

  let score = 0;
  const evidence: string[] = [];

  // Check unique queries per hour
  const recentUniqueQueries = new Set(
    requestLog
      .filter(r => r.userId === key && r.timestamp >= new Date(Date.now() - 60 * 60 * 1000))
      .map(r => r.query)
  ).size;

  if (recentUniqueQueries > ABUSE_THRESHOLDS.scraping.uniqueQueriesPerHour) {
    score += 35;
    evidence.push(`${recentUniqueQueries} unique queries/hour (threshold: ${ABUSE_THRESHOLDS.scraping.uniqueQueriesPerHour})`);
  }

  // Check sequential patterns
  const sequentialScore = checkSequentialPatterns(key);
  if (sequentialScore > ABUSE_THRESHOLDS.scraping.sequentialPatternThreshold) {
    score += 40;
    evidence.push(`Sequential pattern score: ${(sequentialScore * 100).toFixed(0)}%`);
  }

  // Check request interval consistency (bots are very regular)
  if (behavior.avgRequestInterval > 0 && behavior.avgRequestInterval < 5000) {
    const intervalVariance = Math.abs(behavior.avgRequestInterval - behavior.minRequestInterval);
    if (intervalVariance < 100) {
      score += 25;
      evidence.push(`Suspiciously consistent request intervals (variance: ${intervalVariance}ms)`);
    }
  }

  if (score > 0) {
    return {
      type: 'scraping',
      score: Math.min(100, score),
      confidence: 0.8,
      evidence,
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Detect spam behavior
 */
function detectSpam(behavior: UserBehavior): AbuseSignal | null {
  const key = behavior.userId || behavior.ipAddress;

  let score = 0;
  const evidence: string[] = [];

  // Check duplicate queries
  const dupeRatio = checkDuplicateQueries(key, 60 * 60 * 1000);
  if (dupeRatio > ABUSE_THRESHOLDS.spam.duplicateQueryThreshold) {
    score += 50;
    evidence.push(`${(dupeRatio * 100).toFixed(0)}% duplicate queries`);
  }

  // Check error rate
  if (behavior.requestCount > 10) {
    const errorRate = behavior.errorCount / behavior.requestCount;
    if (errorRate > 0.3) {
      score += 20;
      evidence.push(`High error rate: ${(errorRate * 100).toFixed(0)}%`);
    }
  }

  if (score > 0) {
    return {
      type: 'spam',
      score: Math.min(100, score),
      confidence: 0.75,
      evidence,
      timestamp: new Date(),
    };
  }

  return null;
}

/**
 * Detect bot behavior
 */
function detectBotBehavior(behavior: UserBehavior): AbuseSignal | null {
  let score = 0;
  const evidence: string[] = [];

  // Very fast requests
  if (behavior.minRequestInterval < 50) {
    score += 40;
    evidence.push(`Superhuman request speed: ${behavior.minRequestInterval}ms`);
  }

  // Consistent timing
  if (behavior.requestCount > 20 && behavior.avgRequestInterval > 0) {
    const variance = Math.abs(behavior.avgRequestInterval - behavior.minRequestInterval);
    if (variance < 50) {
      score += 30;
      evidence.push('Machine-like request timing consistency');
    }
  }

  // No natural pauses
  const sessionDuration = behavior.lastSeen.getTime() - behavior.firstSeen.getTime();
  if (sessionDuration > 30 * 60 * 1000 && behavior.requestCount > 100) {
    // 30+ minutes, 100+ requests with no pause
    score += 30;
    evidence.push('Extended session with no natural breaks');
  }

  if (score > 0) {
    return {
      type: 'bot_behavior',
      score: Math.min(100, score),
      confidence: 0.7,
      evidence,
      timestamp: new Date(),
    };
  }

  return null;
}

// ============================================================================
// REPUTATION MANAGEMENT
// ============================================================================

/**
 * Get or calculate reputation score
 */
export function getReputationScore(userId: string): ReputationScore {
  let reputation = reputationScores.get(userId);

  if (!reputation) {
    reputation = {
      userId,
      score: 50, // Default neutral
      factors: {
        accountAge: 0,
        verifiedEmail: false,
        payingCustomer: false,
        previousAbuse: 0,
        successfulRequests: 0,
        failedRequests: 0,
      },
      tier: 'normal',
      lastUpdated: new Date(),
    };
    reputationScores.set(userId, reputation);
  }

  return reputation;
}

/**
 * Update reputation score based on behavior
 */
export function updateReputation(
  userId: string,
  event: {
    type: 'success' | 'failure' | 'abuse' | 'verified';
    severity?: number;
  }
): ReputationScore {
  const reputation = getReputationScore(userId);

  switch (event.type) {
    case 'success':
      reputation.factors.successfulRequests++;
      reputation.score = Math.min(100, reputation.score + 0.1);
      break;

    case 'failure':
      reputation.factors.failedRequests++;
      reputation.score = Math.max(0, reputation.score - 0.5);
      break;

    case 'abuse':
      reputation.factors.previousAbuse++;
      const penalty = (event.severity || 50) / 5;
      reputation.score = Math.max(0, reputation.score - penalty);
      break;

    case 'verified':
      reputation.factors.verifiedEmail = true;
      reputation.score = Math.min(100, reputation.score + 10);
      break;
  }

  // Determine tier
  if (reputation.score >= 70) reputation.tier = 'trusted';
  else if (reputation.score >= 30) reputation.tier = 'normal';
  else if (reputation.score >= 10) reputation.tier = 'suspicious';
  else reputation.tier = 'banned';

  reputation.lastUpdated = new Date();
  reputationScores.set(userId, reputation);

  return reputation;
}

// ============================================================================
// BAN MANAGEMENT
// ============================================================================

/**
 * Check if user/IP is banned
 */
export function isBanned(userId?: string, ipAddress?: string): BanRecord | null {
  for (const [, ban] of banRecords) {
    if (ban.lifted) continue;

    if (ban.expiresAt && ban.expiresAt < new Date()) {
      ban.lifted = true;
      continue;
    }

    if ((userId && ban.userId === userId) || (ipAddress && ban.ipAddress === ipAddress)) {
      return ban;
    }
  }

  return null;
}

/**
 * Create a ban record
 */
export function createBan(
  options: {
    userId?: string;
    ipAddress?: string;
    type: 'temp_ban' | 'permanent_ban';
    reason: string;
    abuseType: AbuseType;
    durationMs?: number;
  }
): BanRecord {
  const ban: BanRecord = {
    id: `ban_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId: options.userId,
    ipAddress: options.ipAddress,
    type: options.type,
    reason: options.reason,
    abuseType: options.abuseType,
    createdAt: new Date(),
    expiresAt: options.type === 'temp_ban' && options.durationMs
      ? new Date(Date.now() + options.durationMs)
      : undefined,
    lifted: false,
  };

  banRecords.set(ban.id, ban);
  return ban;
}

/**
 * Lift a ban
 */
export function liftBan(banId: string, liftedBy: string): boolean {
  const ban = banRecords.get(banId);
  if (!ban) return false;

  ban.lifted = true;
  ban.liftedAt = new Date();
  ban.liftedBy = liftedBy;

  return true;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Record a request and detect abuse
 */
export function recordAndDetect(
  userId: string,
  ipAddress: string,
  query: string,
  options?: { isError?: boolean }
): AbuseDetectionResult {
  const key = userId || ipAddress;

  // Check for existing ban
  const existingBan = isBanned(userId, ipAddress);
  if (existingBan) {
    return {
      isAbusive: true,
      overallScore: 100,
      signals: [],
      recommendedAction: existingBan.type === 'permanent_ban' ? 'permanent_ban' : 'temp_ban',
      reason: `User is banned: ${existingBan.reason}`,
      userId,
      ipAddress,
    };
  }

  // Get/update behavior
  const behavior = getOrCreateBehavior(userId, ipAddress);
  const now = new Date();
  const interval = now.getTime() - behavior.lastSeen.getTime();

  behavior.requestCount++;
  if (options?.isError) behavior.errorCount++;
  behavior.lastSeen = now;
  behavior.minRequestInterval = Math.min(behavior.minRequestInterval, interval);

  if (behavior.avgRequestInterval === Infinity) {
    behavior.avgRequestInterval = interval;
  } else {
    behavior.avgRequestInterval = (behavior.avgRequestInterval + interval) / 2;
  }

  // Log request
  requestLog.push({ userId: key, timestamp: now, query });
  if (requestLog.length > MAX_REQUEST_LOG) {
    requestLog.splice(0, requestLog.length - MAX_REQUEST_LOG);
  }

  // Run detections
  const signals: AbuseSignal[] = [];

  const rateAbuse = detectRateAbuse(behavior);
  if (rateAbuse) signals.push(rateAbuse);

  const scraping = detectScraping(behavior);
  if (scraping) signals.push(scraping);

  const spam = detectSpam(behavior);
  if (spam) signals.push(spam);

  const bot = detectBotBehavior(behavior);
  if (bot) signals.push(bot);

  // Store signals
  behavior.signals = signals;

  // Calculate overall score
  const overallScore = signals.length > 0
    ? Math.min(100, signals.reduce((sum, s) => sum + s.score * s.confidence, 0) / signals.length)
    : 0;

  // Determine action
  let recommendedAction: ActionTaken = 'none';
  let reason = 'No abuse detected';

  const reputation = getReputationScore(userId || ipAddress);

  if (overallScore >= 70 || reputation.score < ABUSE_THRESHOLDS.reputation.banThreshold) {
    recommendedAction = 'temp_ban';
    reason = 'Severe abuse detected';
  } else if (overallScore >= 50 || reputation.score < ABUSE_THRESHOLDS.reputation.captchaThreshold) {
    recommendedAction = 'captcha';
    reason = 'Suspicious behavior - verification required';
  } else if (overallScore >= 30 || reputation.score < ABUSE_THRESHOLDS.reputation.throttleThreshold) {
    recommendedAction = 'throttle';
    reason = 'Rate limiting applied';
  } else if (overallScore > 0 || reputation.score < ABUSE_THRESHOLDS.reputation.warningThreshold) {
    recommendedAction = 'warn';
    reason = 'Behavior flagged for monitoring';
  }

  // Update reputation if abusive
  if (overallScore > 0) {
    updateReputation(userId || ipAddress, { type: 'abuse', severity: overallScore });
  } else {
    updateReputation(userId || ipAddress, { type: 'success' });
  }

  return {
    isAbusive: overallScore > 0,
    overallScore,
    signals,
    recommendedAction,
    reason,
    userId,
    ipAddress,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  recordAndDetect,
  getReputationScore,
  updateReputation,
  isBanned,
  createBan,
  liftBan,
  ABUSE_THRESHOLDS,
};
