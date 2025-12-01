/**
 * URL Validator - Security Module
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.4
 *
 * Security features:
 * - SSRF protection (blocks internal IPs, localhost, metadata endpoints)
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
 * Check if an IP address is blocked (internal/private)
 */
function isBlockedIP(hostname: string): boolean {
  // Check against blocked IP patterns
  for (const pattern of BLOCKED_IP_PATTERNS) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  // Check for IPv6 localhost variations
  if (hostname.includes('::1') || hostname === '::') {
    return true;
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
