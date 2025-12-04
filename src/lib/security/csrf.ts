/**
 * CSRF Protection Module
 *
 * RED TEAM AUDIT FIX: MEDIUM-002
 * Implements CSRF token generation and validation
 *
 * Features:
 * - Double-submit cookie pattern
 * - Token generation using Web Crypto API
 * - SameSite cookie configuration
 * - Origin validation
 * - Referer header validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// ============================================================================
// TYPES
// ============================================================================

export interface CSRFConfig {
  cookieName?: string;
  headerName?: string;
  tokenLength?: number;
  cookieOptions?: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    path?: string;
    maxAge?: number;
  };
  allowedOrigins?: string[];
  excludedPaths?: string[];
  excludedMethods?: string[];
}

export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
  token?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_CONFIG: Required<CSRFConfig> = {
  cookieName: '__csrf_token',
  headerName: 'x-csrf-token',
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 86400, // 24 hours
  },
  allowedOrigins: [],
  excludedPaths: ['/api/webhooks', '/api/cron'],
  excludedMethods: ['GET', 'HEAD', 'OPTIONS'],
};

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a token for comparison (timing-safe)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// ORIGIN VALIDATION
// ============================================================================

/**
 * Validate request origin
 */
function validateOrigin(
  request: NextRequest,
  allowedOrigins: string[]
): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // If no origin header (same-origin request), check referer
  if (!origin) {
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host !== host) {
          return { valid: false, error: 'Invalid referer' };
        }
      } catch {
        return { valid: false, error: 'Malformed referer header' };
      }
    }
    // No origin or referer - could be same-origin, allow but log
    return { valid: true };
  }

  // Check if origin matches host
  try {
    const originUrl = new URL(origin);

    // Allow same-origin
    if (originUrl.host === host) {
      return { valid: true };
    }

    // Check against allowed origins
    if (allowedOrigins.length > 0) {
      const isAllowed = allowedOrigins.some((allowed) => {
        if (allowed.startsWith('*.')) {
          // Wildcard subdomain match
          const domain = allowed.substring(2);
          return originUrl.host.endsWith(domain);
        }
        return originUrl.origin === allowed || originUrl.host === allowed;
      });

      if (isAllowed) {
        return { valid: true };
      }
    }

    return { valid: false, error: `Origin ${origin} not allowed` };
  } catch {
    return { valid: false, error: 'Malformed origin header' };
  }
}

// ============================================================================
// CSRF VALIDATION
// ============================================================================

/**
 * Validate CSRF token from request
 */
export async function validateCSRFToken(
  request: NextRequest,
  config: CSRFConfig = {}
): Promise<CSRFValidationResult> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Check if method is excluded
  if (mergedConfig.excludedMethods.includes(request.method.toUpperCase())) {
    return { valid: true };
  }

  // Check if path is excluded
  const pathname = new URL(request.url).pathname;
  if (mergedConfig.excludedPaths.some((path) => pathname.startsWith(path))) {
    return { valid: true };
  }

  // Validate origin first
  const originValidation = validateOrigin(request, mergedConfig.allowedOrigins);
  if (!originValidation.valid) {
    return { valid: false, error: originValidation.error };
  }

  // Get token from cookie
  const cookieToken = request.cookies.get(mergedConfig.cookieName)?.value;
  if (!cookieToken) {
    return { valid: false, error: 'CSRF cookie not found' };
  }

  // Get token from header
  const headerToken = request.headers.get(mergedConfig.headerName);
  if (!headerToken) {
    // Also check form data for non-API requests
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') ||
        contentType.includes('multipart/form-data')) {
      // Token might be in form body - this requires body parsing
      // For now, require header token for all mutating requests
      return { valid: false, error: 'CSRF token header required' };
    }
    return { valid: false, error: 'CSRF token header not found' };
  }

  // Compare tokens (timing-safe)
  const cookieHash = await hashToken(cookieToken);
  const headerHash = await hashToken(headerToken);

  if (!timingSafeEqual(cookieHash, headerHash)) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true, token: cookieToken };
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * CSRF protection middleware wrapper
 */
export function withCSRFProtection<T extends Request>(
  handler: (request: T) => Promise<NextResponse>,
  config: CSRFConfig = {}
): (request: T) => Promise<NextResponse> {
  return async (request: T): Promise<NextResponse> => {
    const nextRequest = request as unknown as NextRequest;

    const validation = await validateCSRFToken(nextRequest, config);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: 'CSRF validation failed',
          },
        },
        { status: 403 }
      );
    }

    return handler(request);
  };
}

/**
 * Set CSRF cookie in response
 */
export function setCSRFCookie(
  response: NextResponse,
  config: CSRFConfig = {}
): { response: NextResponse; token: string } {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const token = generateCSRFToken(mergedConfig.tokenLength);

  response.cookies.set(mergedConfig.cookieName, token, {
    httpOnly: mergedConfig.cookieOptions.httpOnly,
    secure: mergedConfig.cookieOptions.secure,
    sameSite: mergedConfig.cookieOptions.sameSite,
    path: mergedConfig.cookieOptions.path,
    maxAge: mergedConfig.cookieOptions.maxAge,
  });

  return { response, token };
}

// ============================================================================
// CLIENT-SIDE HELPER (for API routes that need to provide token)
// ============================================================================

/**
 * API route to get a new CSRF token
 * Should be called on page load for forms
 */
export async function getCSRFTokenHandler(
  request: NextRequest,
  config: CSRFConfig = {}
): Promise<NextResponse> {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const token = generateCSRFToken(mergedConfig.tokenLength);

  const response = NextResponse.json({ token });

  response.cookies.set(mergedConfig.cookieName, token, {
    httpOnly: mergedConfig.cookieOptions.httpOnly,
    secure: mergedConfig.cookieOptions.secure,
    sameSite: mergedConfig.cookieOptions.sameSite,
    path: mergedConfig.cookieOptions.path,
    maxAge: mergedConfig.cookieOptions.maxAge,
  });

  return response;
}

// ============================================================================
// REACT HOOK SUPPORT
// ============================================================================

/**
 * Generate client-side script for CSRF token handling
 * Can be included in a script tag or used in React components
 */
export const CSRF_CLIENT_SCRIPT = `
(function() {
  // Fetch CSRF token on page load
  async function fetchCSRFToken() {
    try {
      const response = await fetch('/api/csrf-token', { credentials: 'include' });
      const data = await response.json();
      window.__CSRF_TOKEN__ = data.token;
    } catch (e) {
      console.error('Failed to fetch CSRF token:', e);
    }
  }

  // Intercept fetch to add CSRF header
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    // Add CSRF header for mutating requests
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      options.headers = options.headers || {};
      if (window.__CSRF_TOKEN__) {
        options.headers['x-csrf-token'] = window.__CSRF_TOKEN__;
      }
    }

    return originalFetch.call(this, url, options);
  };

  // Fetch token on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchCSRFToken);
  } else {
    fetchCSRFToken();
  }
})();
`;

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateCSRFToken,
  validateCSRFToken,
  withCSRFProtection,
  setCSRFCookie,
  getCSRFTokenHandler,
  CSRF_CLIENT_SCRIPT,
};
