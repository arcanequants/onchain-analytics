/**
 * Device Fingerprinting
 *
 * Phase 4, Week 8 Extended - Adversarial AI Security Checklist
 *
 * Features:
 * - Browser fingerprint generation
 * - Device identification
 * - Fraud detection signals
 * - Privacy-respecting implementation
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BrowserSignals {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  timezoneOffset: number;
  cookiesEnabled: boolean;
  doNotTrack: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  maxTouchPoints: number;
}

export interface CanvasFingerprint {
  hash: string;
  dataUrl?: string;
}

export interface WebGLInfo {
  vendor: string;
  renderer: string;
  version: string;
}

export interface AudioFingerprint {
  hash: string;
  sampleRate?: number;
}

export interface FontDetection {
  availableFonts: string[];
  hash: string;
}

export interface DeviceFingerprint {
  fingerprintId: string;
  browser: BrowserSignals;
  canvas?: CanvasFingerprint;
  webgl?: WebGLInfo;
  audio?: AudioFingerprint;
  fonts?: FontDetection;
  plugins: string[];
  confidence: number;
  createdAt: Date;
  lastSeenAt: Date;
  metadata?: Record<string, unknown>;
}

export interface FingerprintMatch {
  fingerprintId: string;
  similarity: number;
  isMatch: boolean;
  matchedSignals: string[];
  mismatchedSignals: string[];
}

export interface FraudSignals {
  isBot: boolean;
  isHeadless: boolean;
  isEmulator: boolean;
  isVirtualMachine: boolean;
  hasInconsistencies: boolean;
  riskScore: number;  // 0-100
  signals: string[];
}

// ============================================================================
// STORAGE
// ============================================================================

const fingerprintDatabase = new Map<string, DeviceFingerprint>();
const deviceHistory = new Map<string, string[]>();  // userId -> fingerprintIds

// ============================================================================
// FINGERPRINT GENERATION
// ============================================================================

/**
 * Hash function for fingerprint components
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate fingerprint ID from components
 */
function generateFingerprintId(components: Record<string, unknown>): string {
  const serialized = JSON.stringify(components, Object.keys(components).sort());
  return 'fp_' + hashString(serialized) + '_' + Date.now().toString(36);
}

/**
 * Parse user agent for key signals
 */
function parseUserAgent(ua: string): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  isMobile: boolean;
} {
  const result = {
    browser: 'unknown',
    browserVersion: '',
    os: 'unknown',
    osVersion: '',
    isMobile: false,
  };

  // Browser detection
  if (ua.includes('Firefox/')) {
    result.browser = 'Firefox';
    const match = ua.match(/Firefox\/(\d+\.\d+)/);
    if (match) result.browserVersion = match[1];
  } else if (ua.includes('Chrome/') && !ua.includes('Edg/')) {
    result.browser = 'Chrome';
    const match = ua.match(/Chrome\/(\d+\.\d+)/);
    if (match) result.browserVersion = match[1];
  } else if (ua.includes('Safari/') && !ua.includes('Chrome/')) {
    result.browser = 'Safari';
    const match = ua.match(/Version\/(\d+\.\d+)/);
    if (match) result.browserVersion = match[1];
  } else if (ua.includes('Edg/')) {
    result.browser = 'Edge';
    const match = ua.match(/Edg\/(\d+\.\d+)/);
    if (match) result.browserVersion = match[1];
  }

  // OS detection
  if (ua.includes('Windows NT')) {
    result.os = 'Windows';
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) result.osVersion = match[1];
  } else if (ua.includes('Mac OS X')) {
    result.os = 'macOS';
    const match = ua.match(/Mac OS X (\d+[._]\d+)/);
    if (match) result.osVersion = match[1].replace('_', '.');
  } else if (ua.includes('Linux')) {
    result.os = 'Linux';
  } else if (ua.includes('Android')) {
    result.os = 'Android';
    result.isMobile = true;
    const match = ua.match(/Android (\d+\.\d+)/);
    if (match) result.osVersion = match[1];
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    result.os = 'iOS';
    result.isMobile = true;
    const match = ua.match(/OS (\d+_\d+)/);
    if (match) result.osVersion = match[1].replace('_', '.');
  }

  return result;
}

/**
 * Create fingerprint from browser signals
 */
export function createFingerprint(
  signals: Partial<BrowserSignals>,
  options?: {
    canvas?: CanvasFingerprint;
    webgl?: WebGLInfo;
    audio?: AudioFingerprint;
    fonts?: FontDetection;
    plugins?: string[];
  }
): DeviceFingerprint {
  const browser: BrowserSignals = {
    userAgent: signals.userAgent || '',
    language: signals.language || 'en',
    languages: signals.languages || [],
    platform: signals.platform || '',
    screenResolution: signals.screenResolution || '',
    colorDepth: signals.colorDepth || 24,
    timezone: signals.timezone || '',
    timezoneOffset: signals.timezoneOffset || 0,
    cookiesEnabled: signals.cookiesEnabled ?? true,
    doNotTrack: signals.doNotTrack ?? false,
    hardwareConcurrency: signals.hardwareConcurrency,
    deviceMemory: signals.deviceMemory,
    maxTouchPoints: signals.maxTouchPoints || 0,
  };

  const now = new Date();
  const fingerprintId = generateFingerprintId({
    ua: browser.userAgent,
    lang: browser.language,
    screen: browser.screenResolution,
    tz: browser.timezone,
    canvas: options?.canvas?.hash,
    webgl: options?.webgl?.renderer,
  });

  const fingerprint: DeviceFingerprint = {
    fingerprintId,
    browser,
    canvas: options?.canvas,
    webgl: options?.webgl,
    audio: options?.audio,
    fonts: options?.fonts,
    plugins: options?.plugins || [],
    confidence: calculateConfidence(browser, options),
    createdAt: now,
    lastSeenAt: now,
  };

  fingerprintDatabase.set(fingerprintId, fingerprint);

  return fingerprint;
}

/**
 * Calculate fingerprint confidence based on available signals
 */
function calculateConfidence(
  browser: BrowserSignals,
  options?: {
    canvas?: CanvasFingerprint;
    webgl?: WebGLInfo;
    audio?: AudioFingerprint;
    fonts?: FontDetection;
  }
): number {
  let confidence = 0;
  let maxConfidence = 0;

  // Browser signals (30%)
  maxConfidence += 30;
  if (browser.userAgent) confidence += 10;
  if (browser.screenResolution) confidence += 5;
  if (browser.timezone) confidence += 5;
  if (browser.languages.length > 0) confidence += 5;
  if (browser.hardwareConcurrency) confidence += 5;

  // Canvas (25%)
  maxConfidence += 25;
  if (options?.canvas?.hash) confidence += 25;

  // WebGL (20%)
  maxConfidence += 20;
  if (options?.webgl?.renderer) confidence += 20;

  // Audio (15%)
  maxConfidence += 15;
  if (options?.audio?.hash) confidence += 15;

  // Fonts (10%)
  maxConfidence += 10;
  if (options?.fonts?.availableFonts?.length) confidence += 10;

  return Math.round((confidence / maxConfidence) * 100);
}

// ============================================================================
// FINGERPRINT MATCHING
// ============================================================================

/**
 * Compare two fingerprints
 */
export function compareFingerprints(
  fp1: DeviceFingerprint,
  fp2: DeviceFingerprint
): FingerprintMatch {
  const matchedSignals: string[] = [];
  const mismatchedSignals: string[] = [];
  let similarityScore = 0;
  let totalWeight = 0;

  // User agent (weight: 15)
  totalWeight += 15;
  const ua1 = parseUserAgent(fp1.browser.userAgent);
  const ua2 = parseUserAgent(fp2.browser.userAgent);
  if (ua1.browser === ua2.browser && ua1.os === ua2.os) {
    similarityScore += 15;
    matchedSignals.push('browser_os');
  } else {
    mismatchedSignals.push('browser_os');
  }

  // Screen resolution (weight: 10)
  totalWeight += 10;
  if (fp1.browser.screenResolution === fp2.browser.screenResolution) {
    similarityScore += 10;
    matchedSignals.push('screen');
  } else {
    mismatchedSignals.push('screen');
  }

  // Timezone (weight: 10)
  totalWeight += 10;
  if (fp1.browser.timezone === fp2.browser.timezone) {
    similarityScore += 10;
    matchedSignals.push('timezone');
  } else {
    mismatchedSignals.push('timezone');
  }

  // Language (weight: 5)
  totalWeight += 5;
  if (fp1.browser.language === fp2.browser.language) {
    similarityScore += 5;
    matchedSignals.push('language');
  } else {
    mismatchedSignals.push('language');
  }

  // Hardware (weight: 10)
  totalWeight += 10;
  if (fp1.browser.hardwareConcurrency === fp2.browser.hardwareConcurrency &&
      fp1.browser.deviceMemory === fp2.browser.deviceMemory) {
    similarityScore += 10;
    matchedSignals.push('hardware');
  } else {
    mismatchedSignals.push('hardware');
  }

  // Canvas (weight: 25)
  if (fp1.canvas?.hash && fp2.canvas?.hash) {
    totalWeight += 25;
    if (fp1.canvas.hash === fp2.canvas.hash) {
      similarityScore += 25;
      matchedSignals.push('canvas');
    } else {
      mismatchedSignals.push('canvas');
    }
  }

  // WebGL (weight: 15)
  if (fp1.webgl?.renderer && fp2.webgl?.renderer) {
    totalWeight += 15;
    if (fp1.webgl.renderer === fp2.webgl.renderer) {
      similarityScore += 15;
      matchedSignals.push('webgl');
    } else {
      mismatchedSignals.push('webgl');
    }
  }

  // Audio (weight: 10)
  if (fp1.audio?.hash && fp2.audio?.hash) {
    totalWeight += 10;
    if (fp1.audio.hash === fp2.audio.hash) {
      similarityScore += 10;
      matchedSignals.push('audio');
    } else {
      mismatchedSignals.push('audio');
    }
  }

  const similarity = totalWeight > 0 ? (similarityScore / totalWeight) * 100 : 0;
  const isMatch = similarity >= 80;

  return {
    fingerprintId: fp2.fingerprintId,
    similarity: Math.round(similarity),
    isMatch,
    matchedSignals,
    mismatchedSignals,
  };
}

/**
 * Find matching fingerprints in database
 */
export function findMatchingFingerprints(
  fingerprint: DeviceFingerprint,
  minSimilarity: number = 80
): FingerprintMatch[] {
  const matches: FingerprintMatch[] = [];

  for (const stored of fingerprintDatabase.values()) {
    if (stored.fingerprintId === fingerprint.fingerprintId) continue;

    const match = compareFingerprints(fingerprint, stored);
    if (match.similarity >= minSimilarity) {
      matches.push(match);
    }
  }

  return matches.sort((a, b) => b.similarity - a.similarity);
}

// ============================================================================
// FRAUD DETECTION
// ============================================================================

/**
 * Detect fraud signals from fingerprint
 */
export function detectFraudSignals(fingerprint: DeviceFingerprint): FraudSignals {
  const signals: string[] = [];
  let riskScore = 0;

  const ua = fingerprint.browser.userAgent.toLowerCase();
  const parsedUA = parseUserAgent(fingerprint.browser.userAgent);

  // Bot detection
  let isBot = false;
  const botPatterns = [
    'bot', 'crawler', 'spider', 'scraper', 'headless',
    'phantom', 'selenium', 'puppeteer', 'playwright'
  ];
  for (const pattern of botPatterns) {
    if (ua.includes(pattern)) {
      isBot = true;
      signals.push(`Bot pattern detected: ${pattern}`);
      riskScore += 30;
      break;
    }
  }

  // Headless browser detection
  let isHeadless = false;
  if (ua.includes('headlesschrome') || ua.includes('headless')) {
    isHeadless = true;
    signals.push('Headless browser detected');
    riskScore += 25;
  }

  // Check for missing plugins (common in headless)
  if (fingerprint.plugins.length === 0 && parsedUA.browser === 'Chrome') {
    signals.push('No plugins detected (unusual for Chrome)');
    riskScore += 10;
  }

  // Emulator detection
  let isEmulator = false;
  if (fingerprint.browser.platform.toLowerCase().includes('linux') &&
      parsedUA.os === 'Android') {
    isEmulator = true;
    signals.push('Possible Android emulator');
    riskScore += 20;
  }

  // Virtual machine detection
  let isVirtualMachine = false;
  const vmRenderers = ['vmware', 'virtualbox', 'parallels', 'qemu'];
  const renderer = fingerprint.webgl?.renderer?.toLowerCase() || '';
  for (const vm of vmRenderers) {
    if (renderer.includes(vm)) {
      isVirtualMachine = true;
      signals.push(`VM detected: ${vm}`);
      riskScore += 15;
      break;
    }
  }

  // Consistency checks
  let hasInconsistencies = false;

  // Screen resolution consistency
  const [width, height] = fingerprint.browser.screenResolution.split('x').map(Number);
  if (width && height) {
    if (parsedUA.isMobile && width > 1920) {
      hasInconsistencies = true;
      signals.push('Mobile device with desktop resolution');
      riskScore += 15;
    }
  }

  // Touch points consistency
  if (parsedUA.isMobile && fingerprint.browser.maxTouchPoints === 0) {
    hasInconsistencies = true;
    signals.push('Mobile device with no touch support');
    riskScore += 10;
  }

  // Language consistency with timezone
  const lang = fingerprint.browser.language;
  const tz = fingerprint.browser.timezone;
  if (lang.startsWith('en') && tz.includes('Asia/')) {
    signals.push('Language/timezone mismatch (possible)');
    riskScore += 5;
  }

  // Hardware consistency
  if (fingerprint.browser.hardwareConcurrency === 1) {
    signals.push('Single core CPU (unusual for modern devices)');
    riskScore += 10;
  }

  // Canvas anomalies
  if (fingerprint.canvas?.hash === 'CANVAS_BLOCKED') {
    signals.push('Canvas fingerprinting blocked');
    riskScore += 5;  // Privacy-conscious users, not necessarily fraud
  }

  // Low confidence
  if (fingerprint.confidence < 50) {
    signals.push('Low fingerprint confidence');
    riskScore += 10;
  }

  return {
    isBot,
    isHeadless,
    isEmulator,
    isVirtualMachine,
    hasInconsistencies,
    riskScore: Math.min(100, riskScore),
    signals,
  };
}

// ============================================================================
// USER TRACKING
// ============================================================================

/**
 * Associate fingerprint with user
 */
export function associateWithUser(userId: string, fingerprintId: string): void {
  const existing = deviceHistory.get(userId) || [];
  if (!existing.includes(fingerprintId)) {
    existing.push(fingerprintId);
    deviceHistory.set(userId, existing);
  }

  const fingerprint = fingerprintDatabase.get(fingerprintId);
  if (fingerprint) {
    fingerprint.lastSeenAt = new Date();
    fingerprint.metadata = { ...fingerprint.metadata, userId };
  }
}

/**
 * Get user's device history
 */
export function getUserDevices(userId: string): DeviceFingerprint[] {
  const fingerprintIds = deviceHistory.get(userId) || [];
  return fingerprintIds
    .map(id => fingerprintDatabase.get(id))
    .filter((fp): fp is DeviceFingerprint => fp !== undefined);
}

/**
 * Check if user is using new device
 */
export function isNewDevice(userId: string, fingerprint: DeviceFingerprint): boolean {
  const userDevices = getUserDevices(userId);
  if (userDevices.length === 0) return true;

  for (const device of userDevices) {
    const match = compareFingerprints(fingerprint, device);
    if (match.isMatch) return false;
  }

  return true;
}

/**
 * Get fingerprint by ID
 */
export function getFingerprint(fingerprintId: string): DeviceFingerprint | undefined {
  return fingerprintDatabase.get(fingerprintId);
}

/**
 * Get all fingerprints
 */
export function getAllFingerprints(): DeviceFingerprint[] {
  return Array.from(fingerprintDatabase.values());
}

/**
 * Delete fingerprint
 */
export function deleteFingerprint(fingerprintId: string): boolean {
  return fingerprintDatabase.delete(fingerprintId);
}

// ============================================================================
// CLIENT-SIDE COLLECTION SCRIPT
// ============================================================================

/**
 * Generate client-side collection script
 * This would be embedded in the page to collect fingerprint signals
 */
export function getCollectionScript(): string {
  return `
(function() {
  const signals = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    platform: navigator.platform,
    screenResolution: screen.width + 'x' + screen.height,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: navigator.deviceMemory,
    maxTouchPoints: navigator.maxTouchPoints || 0,
  };

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 0, 0);
    signals.canvas = canvas.toDataURL();
  } catch (e) {
    signals.canvas = 'CANVAS_BLOCKED';
  }

  // WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    signals.webgl = {
      vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),
    };
  } catch (e) {
    signals.webgl = null;
  }

  // Plugins
  signals.plugins = Array.from(navigator.plugins || []).map(p => p.name);

  return signals;
})();
  `;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Fingerprint creation
  createFingerprint,
  getFingerprint,
  getAllFingerprints,
  deleteFingerprint,

  // Matching
  compareFingerprints,
  findMatchingFingerprints,

  // Fraud detection
  detectFraudSignals,

  // User tracking
  associateWithUser,
  getUserDevices,
  isNewDevice,

  // Utilities
  getCollectionScript,
};
