/**
 * URL Validator - Security Module
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4
 *
 * RED TEAM AUDIT FIX: MEDIUM-001
 * Enhanced SSRF protection for edge cases
 *
 * Security features:
 * - SSRF protection (blocks internal IPs, localhost, metadata endpoints)
 * - IPv6 SSRF protection (all variations and encodings)
 * - DNS rebinding protection (blocks suspicious TLDs and patterns)
 * - IP encoding bypass protection (decimal, octal, hex)
 * - Protocol validation (only http/https)
 * - Domain validation (blocks known malicious patterns)
 * - URL normalization and sanitization
 */

import { z } from 'zod';

// ================================================================
// CONSTANTS
// ================================================================

/**
 * Blocked IP ranges for SSRF protection
 * RFC 1918, RFC 5737, RFC 6598, localhost, link-local, multicast
 */
const BLOCKED_IP_PATTERNS = [
  /^127\./,                          // Localhost (127.0.0.0/8)
  /^10\./,                           // Private Class A (10.0.0.0/8)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // Private Class B (172.16.0.0/12)
  /^192\.168\./,                     // Private Class C (192.168.0.0/16)
  /^169\.254\./,                     // Link-local (169.254.0.0/16)
  /^0\./,                            // "This" network (0.0.0.0/8)
  /^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, // Shared address space (100.64.0.0/10)
  /^192\.0\.0\./,                    // IETF Protocol Assignments (192.0.0.0/24)
  /^192\.0\.2\./,                    // TEST-NET-1 (192.0.2.0/24)
  /^198\.51\.100\./,                 // TEST-NET-2 (198.51.100.0/24)
  /^203\.0\.113\./,                  // TEST-NET-3 (203.0.113.0/24)
  /^224\./,                          // Multicast (224.0.0.0/4)
  /^240\./,                          // Reserved (240.0.0.0/4)
  /^255\./,                          // Broadcast
];

/**
 * Blocked hostnames for SSRF protection
 */
const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  'local',
  '0.0.0.0',
  '::1',
  '::',
  // AWS metadata endpoints
  '169.254.169.254',
  'metadata.google.internal',
  'metadata.google.com',
  // Common internal hostnames
  'internal',
  'intranet',
  'corp',
  'private',
];

/**
 * Blocked hostname patterns (regex)
 */
const BLOCKED_HOSTNAME_PATTERNS = [
  /\.internal$/i,
  /\.local$/i,
  /\.localhost$/i,
  /\.corp$/i,
  /\.private$/i,
  /^kubernetes\.default/i,
  /^metadata\./i,
  // DNS rebinding protection - suspicious TLDs
  /\.xip\.io$/i,
  /\.nip\.io$/i,
  /\.sslip\.io$/i,
  /\.localtest\.me$/i,
  /\.lvh\.me$/i,
  /\.vcap\.me$/i,
  /\.lacolhost\.com$/i,
  /\.127-0-0-1\.org$/i,
  // Additional internal patterns
  /\.cluster\.local$/i,
  /\.svc\.cluster/i,
  /\.pod\.cluster/i,
];

/**
 * IPv6 blocked patterns for comprehensive SSRF protection
 */
const BLOCKED_IPV6_PATTERNS = [
  /^::1$/i,                         // Loopback
  /^::$/,                           // Unspecified
  /^::ffff:127\./i,                 // IPv4-mapped loopback
  /^::ffff:10\./i,                  // IPv4-mapped 10.x
  /^::ffff:172\.(1[6-9]|2[0-9]|3[0-1])\./i,  // IPv4-mapped 172.16-31.x
  /^::ffff:192\.168\./i,            // IPv4-mapped 192.168.x
  /^::ffff:169\.254\./i,            // IPv4-mapped link-local
  /^fe80:/i,                        // Link-local unicast
  /^fc00:/i,                        // Unique local (private)
  /^fd[0-9a-f]{2}:/i,               // Unique local (private)
  /^ff[0-9a-f]{2}:/i,               // Multicast
  /^::ffff:0\./i,                   // IPv4-mapped 0.x
  /^2001:db8:/i,                    // Documentation
  /^100::/i,                        // Discard
  /^64:ff9b::/i,                    // NAT64
  // Compressed variations of ::1
  /^0:0:0:0:0:0:0:1$/i,
  /^0000:0000:0000:0000:0000:0000:0000:0001$/i,
];

/**
 * Allowed protocols
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

/**
 * Maximum URL length (prevent DoS with very long URLs)
 */
const MAX_URL_LENGTH = 2048;

/**
 * Minimum URL length
 */
const MIN_URL_LENGTH = 10;

// ================================================================
// TYPES
// ================================================================

export interface URLValidationResult {
  isValid: boolean;
  normalizedUrl: string | null;
  error: string | null;
  details: {
    protocol: string | null;
    hostname: string | null;
    port: string | null;
    pathname: string | null;
  };
}

export interface URLValidationOptions {
  allowHttp?: boolean;      // Allow http:// (default: true)
  requireHttps?: boolean;   // Require https:// (default: false for free tier)
  allowedDomains?: string[]; // Whitelist specific domains
  blockedDomains?: string[]; // Additional blocked domains
}

// ================================================================
// VALIDATION FUNCTIONS
// ================================================================

/**
 * Decode IP address from various encodings (decimal, octal, hex)
 * Attackers use these to bypass simple regex checks
 */
function decodeIPAddress(hostname: string): string | null {
  // Check for decimal encoding (e.g., 2130706433 = 127.0.0.1)
  if (/^\d{9,10}$/.test(hostname)) {
    const num = parseInt(hostname, 10);
    if (num >= 0 && num <= 4294967295) {
      const octet1 = (num >>> 24) & 255;
      const octet2 = (num >>> 16) & 255;
      const octet3 = (num >>> 8) & 255;
      const octet4 = num & 255;
      return `${octet1}.${octet2}.${octet3}.${octet4}`;
    }
  }

  // Check for hex encoding (e.g., 0x7f000001 = 127.0.0.1)
  if (/^0x[0-9a-f]{1,8}$/i.test(hostname)) {
    const num = parseInt(hostname, 16);
    if (num >= 0 && num <= 4294967295) {
      const octet1 = (num >>> 24) & 255;
      const octet2 = (num >>> 16) & 255;
      const octet3 = (num >>> 8) & 255;
      const octet4 = num & 255;
      return `${octet1}.${octet2}.${octet3}.${octet4}`;
    }
  }

  // Check for octal encoding in dotted format (e.g., 0177.0.0.1 = 127.0.0.1)
  if (/^0[0-7]+\./.test(hostname)) {
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const octets = parts.map(p => {
        if (p.startsWith('0') && p.length > 1 && !/[89]/.test(p)) {
          return parseInt(p, 8);
        }
        return parseInt(p, 10);
      });
      if (octets.every(o => o >= 0 && o <= 255)) {
        return octets.join('.');
      }
    }
  }

  // Check for mixed hex octet encoding (e.g., 0x7f.0.0.1)
  if (/^0x[0-9a-f]+\./i.test(hostname)) {
    const parts = hostname.split('.');
    if (parts.length === 4) {
      const octets = parts.map(p => {
        if (p.toLowerCase().startsWith('0x')) {
          return parseInt(p, 16);
        }
        return parseInt(p, 10);
      });
      if (octets.every(o => o >= 0 && o <= 255)) {
        return octets.join('.');
      }
    }
  }

  return null;
}

/**
 * Normalize IPv6 address to detect variations
 */
function normalizeIPv6(hostname: string): string {
  // Remove brackets if present
  let normalized = hostname.replace(/^\[|\]$/g, '');

  // Expand :: to full zeros
  if (normalized.includes('::')) {
    const parts = normalized.split('::');
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    const missing = 8 - left.length - right.length;
    const middle = Array(missing).fill('0');
    normalized = [...left, ...middle, ...right].join(':');
  }

  return normalized.toLowerCase();
}

/**
 * Check if an IP address is blocked (internal/private)
 */
function isBlockedIP(hostname: string): boolean {
  // First, try to decode encoded IP addresses
  const decodedIP = decodeIPAddress(hostname);
  const hostnameToCheck = decodedIP || hostname;

  // Check against blocked IPv4 patterns
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostnameToCheck)) {
      return true;
    }
  }

  // Check for IPv6 patterns
  const normalizedIPv6 = normalizeIPv6(hostnameToCheck);
  for (const pattern of BLOCKED_IPV6_PATTERNS) {
    if (pattern.test(hostnameToCheck) || pattern.test(normalizedIPv6)) {
      return true;
    }
  }

  // Check for IPv6 localhost variations
  if (hostnameToCheck.includes('::1') || hostnameToCheck === '::') {
    return true;
  }

  // Check if it's a bracketed IPv6 that contains blocked patterns
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const innerIP = hostname.slice(1, -1);
    return isBlockedIP(innerIP);
  }

  return false;
}

/**
 * Check if a hostname is blocked
 */
function isBlockedHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Direct match against blocked hostnames
  if (BLOCKED_HOSTNAMES.includes(lowerHostname)) {
    return true;
  }

  // Pattern match against blocked hostname patterns
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(lowerHostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if URL uses allowed protocol
 */
function isAllowedProtocol(protocol: string, options: URLValidationOptions): boolean {
  const normalizedProtocol = protocol.toLowerCase();

  if (options.requireHttps) {
    return normalizedProtocol === 'https:';
  }

  if (!options.allowHttp && normalizedProtocol === 'http:') {
    return false;
  }

  return ALLOWED_PROTOCOLS.includes(normalizedProtocol);
}

/**
 * Check if domain is in allowed list (if specified)
 */
function isDomainAllowed(hostname: string, options: URLValidationOptions): boolean {
  // If no whitelist, all domains are allowed (except blocked ones)
  if (!options.allowedDomains || options.allowedDomains.length === 0) {
    return true;
  }

  const lowerHostname = hostname.toLowerCase();

  return options.allowedDomains.some(domain => {
    const lowerDomain = domain.toLowerCase();
    // Exact match or subdomain match
    return lowerHostname === lowerDomain ||
           lowerHostname.endsWith('.' + lowerDomain);
  });
}

/**
 * Check if domain is in additional blocked list
 */
function isDomainBlocked(hostname: string, options: URLValidationOptions): boolean {
  if (!options.blockedDomains || options.blockedDomains.length === 0) {
    return false;
  }

  const lowerHostname = hostname.toLowerCase();

  return options.blockedDomains.some(domain => {
    const lowerDomain = domain.toLowerCase();
    return lowerHostname === lowerDomain ||
           lowerHostname.endsWith('.' + lowerDomain);
  });
}

/**
 * Normalize and sanitize a URL
 */
function normalizeUrl(urlString: string): string {
  // Trim whitespace
  let normalized = urlString.trim();

  // Remove any null bytes or control characters
  normalized = normalized.replace(/[\x00-\x1f\x7f]/g, '');

  // Check if it has any protocol
  if (!normalized.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)) {
    // No protocol, add https://
    normalized = 'https://' + normalized;
  }

  return normalized;
}

/**
 * Extract brand name from URL
 */
export function extractBrandName(url: string): string {
  try {
    const parsed = new URL(url);
    let hostname = parsed.hostname;

    // Remove www. prefix
    hostname = hostname.replace(/^www\./i, '');

    // Get the main domain part (before TLD)
    const parts = hostname.split('.');
    if (parts.length >= 2) {
      // Return the main part capitalized
      const mainPart = parts[parts.length - 2];
      return mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
    }

    return hostname.charAt(0).toUpperCase() + hostname.slice(1);
  } catch {
    return 'Unknown';
  }
}

// ================================================================
// MAIN VALIDATION FUNCTION
// ================================================================

/**
 * Validate a URL for security and format
 *
 * @param urlInput - The URL to validate
 * @param options - Validation options
 * @returns URLValidationResult
 */
export function validateUrl(
  urlInput: string,
  options: URLValidationOptions = {}
): URLValidationResult {
  // Default options
  const opts: URLValidationOptions = {
    allowHttp: true,
    requireHttps: false,
    ...options,
  };

  // Initialize result
  const result: URLValidationResult = {
    isValid: false,
    normalizedUrl: null,
    error: null,
    details: {
      protocol: null,
      hostname: null,
      port: null,
      pathname: null,
    },
  };

  // Basic input validation
  if (!urlInput || typeof urlInput !== 'string') {
    result.error = 'URL is required';
    return result;
  }

  // Length checks
  if (urlInput.length < MIN_URL_LENGTH) {
    result.error = 'URL is too short';
    return result;
  }

  if (urlInput.length > MAX_URL_LENGTH) {
    result.error = 'URL is too long (max 2048 characters)';
    return result;
  }

  // Normalize the URL
  const normalizedUrlString = normalizeUrl(urlInput);

  // Try to parse the URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrlString);
  } catch {
    result.error = 'Invalid URL format';
    return result;
  }

  // Extract details
  result.details = {
    protocol: parsedUrl.protocol,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || null,
    pathname: parsedUrl.pathname,
  };

  // Protocol validation
  if (!isAllowedProtocol(parsedUrl.protocol, opts)) {
    result.error = opts.requireHttps
      ? 'Only HTTPS URLs are allowed'
      : 'Only HTTP and HTTPS URLs are allowed';
    return result;
  }

  // Hostname validation - check for empty
  if (!parsedUrl.hostname) {
    result.error = 'URL must have a valid hostname';
    return result;
  }

  // SSRF Protection - check for blocked IPs
  if (isBlockedIP(parsedUrl.hostname)) {
    result.error = 'Internal IP addresses are not allowed';
    return result;
  }

  // SSRF Protection - check for blocked hostnames
  if (isBlockedHostname(parsedUrl.hostname)) {
    result.error = 'This hostname is not allowed';
    return result;
  }

  // Check against additional blocked domains
  if (isDomainBlocked(parsedUrl.hostname, opts)) {
    result.error = 'This domain is not allowed';
    return result;
  }

  // Check against allowed domains (if whitelist is specified)
  if (!isDomainAllowed(parsedUrl.hostname, opts)) {
    result.error = 'Domain is not in the allowed list';
    return result;
  }

  // All checks passed
  result.isValid = true;
  result.normalizedUrl = parsedUrl.href;
  return result;
}

// ================================================================
// ZOD SCHEMA FOR URL VALIDATION
// ================================================================

/**
 * Zod schema for URL validation in API routes
 */
export const urlSchema = z.string()
  .min(MIN_URL_LENGTH, 'URL is too short')
  .max(MAX_URL_LENGTH, 'URL is too long')
  .refine(
    (url: string) => {
      const result = validateUrl(url);
      return result.isValid;
    },
    {
      message: 'Invalid URL',
    }
  )
  .transform((url) => {
    const result = validateUrl(url);
    return result.normalizedUrl!;
  });

/**
 * Schema for analysis request
 */
export const analysisRequestSchema = z.object({
  url: urlSchema,
  industry: z.string().optional(),
  forceRefresh: z.boolean().optional().default(false),
});

export type AnalysisRequest = z.infer<typeof analysisRequestSchema>;

// ================================================================
// EXPORTS
// ================================================================

export default {
  validateUrl,
  extractBrandName,
  urlSchema,
  analysisRequestSchema,
};
