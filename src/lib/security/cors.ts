/**
 * CORS Configuration - Centralized Cross-Origin Resource Sharing
 *
 * Phase 4: Chaos Engineering - Secure CORS Configuration
 *
 * Purpose: Provide secure CORS headers for production while allowing
 * flexible development configuration.
 *
 * Security considerations:
 * - Production uses strict allowlist of known domains
 * - Development allows localhost variants
 * - Credentials require exact origin match (no wildcards)
 * - Preflight caching optimizes performance
 */

// ================================================================
// CONFIGURATION
// ================================================================

/**
 * Production allowed origins
 * Add your production domains here
 */
const PRODUCTION_ORIGINS = [
  'https://vectorialdata.com',
  'https://www.vectorialdata.com',
  'https://app.vectorialdata.com',
  'https://api.vectorialdata.com',
  // Vercel preview deployments
  /^https:\/\/.*-vectorialdata\.vercel\.app$/,
  /^https:\/\/vectorial-.*\.vercel\.app$/,
  /^https:\/\/onchain-analytics-.*\.vercel\.app$/,
];

/**
 * Development allowed origins
 */
const DEVELOPMENT_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3002',
  // Allow all localhost ports in development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

/**
 * Allowed HTTP methods for CORS
 */
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

/**
 * Allowed request headers
 */
const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-Request-ID',
  'X-Trace-ID',
  'X-API-Key',
  'Accept',
  'Accept-Language',
  'Cache-Control',
];

/**
 * Exposed response headers (readable by client)
 */
const EXPOSED_HEADERS = [
  'X-Request-ID',
  'X-Trace-ID',
  'X-RateLimit-Limit',
  'X-RateLimit-Remaining',
  'X-RateLimit-Reset',
  'Retry-After',
];

/**
 * Preflight cache duration in seconds
 */
const PREFLIGHT_CACHE_SECONDS = 86400; // 24 hours

// ================================================================
// HELPER FUNCTIONS
// ================================================================

/**
 * Check if we're in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): (string | RegExp)[] {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS;

  // Allow custom origins from environment variable
  const customOrigins = envOrigins
    ? envOrigins.split(',').map(o => o.trim()).filter(Boolean)
    : [];

  if (isProduction()) {
    return [...PRODUCTION_ORIGINS, ...customOrigins];
  }

  return [...DEVELOPMENT_ORIGINS, ...PRODUCTION_ORIGINS, ...customOrigins];
}

/**
 * Check if an origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    // Allow requests without Origin header (same-origin, server-to-server)
    return true;
  }

  const allowedOrigins = getAllowedOrigins();

  for (const allowed of allowedOrigins) {
    if (typeof allowed === 'string') {
      if (allowed === origin) return true;
    } else if (allowed instanceof RegExp) {
      if (allowed.test(origin)) return true;
    }
  }

  return false;
}

/**
 * Get CORS origin to return
 * Returns the exact origin if allowed (required for credentials)
 * Returns null if not allowed (client will see CORS error)
 */
export function getCorsOrigin(origin: string | null): string | null {
  if (!origin) return null;

  if (isOriginAllowed(origin)) {
    return origin; // Return exact origin for credentials support
  }

  return null;
}

// ================================================================
// CORS HEADERS
// ================================================================

export interface CorsHeaders {
  'Access-Control-Allow-Origin': string;
  'Access-Control-Allow-Methods': string;
  'Access-Control-Allow-Headers': string;
  'Access-Control-Expose-Headers': string;
  'Access-Control-Max-Age': string;
  'Access-Control-Allow-Credentials'?: string;
  Vary: string;
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(
  origin: string | null,
  options: {
    allowCredentials?: boolean;
    additionalExposedHeaders?: string[];
  } = {}
): CorsHeaders | null {
  const { allowCredentials = false, additionalExposedHeaders = [] } = options;

  const corsOrigin = getCorsOrigin(origin);

  // If origin not allowed, return null (will result in CORS error)
  if (origin && !corsOrigin) {
    return null;
  }

  const exposedHeaders = [...EXPOSED_HEADERS, ...additionalExposedHeaders];

  const headers: CorsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin || '*',
    'Access-Control-Allow-Methods': ALLOWED_METHODS.join(', '),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS.join(', '),
    'Access-Control-Expose-Headers': exposedHeaders.join(', '),
    'Access-Control-Max-Age': String(PREFLIGHT_CACHE_SECONDS),
    // Always include Vary: Origin to ensure proper caching
    Vary: 'Origin',
  };

  // Only add credentials header if both:
  // 1. Credentials are requested
  // 2. We have a specific origin (not wildcard)
  if (allowCredentials && corsOrigin) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}

/**
 * Get preflight (OPTIONS) response headers
 */
export function getPreflightHeaders(origin: string | null): Record<string, string> | null {
  const corsHeaders = getCorsHeaders(origin);

  if (!corsHeaders) {
    return null;
  }

  // Convert to plain object, filtering out undefined values
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(corsHeaders)) {
    if (value !== undefined) {
      headers[key] = value;
    }
  }
  return headers;
}

// ================================================================
// RESPONSE HELPERS
// ================================================================

/**
 * Add CORS headers to a Response
 */
export function addCorsHeaders(
  response: Response,
  origin: string | null,
  options: {
    allowCredentials?: boolean;
  } = {}
): Response {
  const corsHeaders = getCorsHeaders(origin, options);

  if (!corsHeaders) {
    // Origin not allowed - log warning in development
    if (!isProduction()) {
      console.warn(`[CORS] Rejected origin: ${origin}`);
    }
    return response;
  }

  // Clone response to add headers
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    newHeaders.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Create a preflight (OPTIONS) response
 */
export function createPreflightResponse(origin: string | null): Response {
  const headers = getPreflightHeaders(origin);

  if (!headers) {
    // Origin not allowed
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Create CORS error response (for logging/debugging)
 */
export function createCorsErrorResponse(origin: string | null): Response {
  const message = origin
    ? `Origin '${origin}' is not allowed by CORS policy`
    : 'Missing Origin header';

  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'CORS_ERROR',
        message,
      },
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// ================================================================
// EXPRESS-STYLE CORS OBJECT (for compatibility)
// ================================================================

/**
 * CORS configuration object for use with Next.js middleware or API routes
 */
export const corsConfig = {
  origin: (origin: string | null, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  methods: ALLOWED_METHODS,
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: EXPOSED_HEADERS,
  credentials: true,
  maxAge: PREFLIGHT_CACHE_SECONDS,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// ================================================================
// EXPORTS
// ================================================================

export {
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  EXPOSED_HEADERS,
  PREFLIGHT_CACHE_SECONDS,
};
