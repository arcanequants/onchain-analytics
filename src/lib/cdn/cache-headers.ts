/**
 * Cache Headers Utility
 *
 * Utilities for generating and managing HTTP cache headers
 *
 * Phase 3, Week 9, Day 1
 */

import type {
  CacheControl,
  CachePreset,
  AssetType,
  SecurityHeaders,
} from './types';
import {
  CACHE_PRESETS,
  ASSET_CONFIGS,
  DEFAULT_SECURITY_HEADERS,
} from './types';

// ================================================================
// CACHE-CONTROL HEADER BUILDER
// ================================================================

/**
 * Build Cache-Control header value from config
 */
export function buildCacheControl(control: CacheControl): string {
  const directives: string[] = [];

  // Add policy
  if (control.policy === 'no-cache') {
    directives.push('no-cache');
  } else if (control.policy === 'no-store') {
    directives.push('no-store');
  } else if (control.policy === 'public') {
    directives.push('public');
  } else if (control.policy === 'private') {
    directives.push('private');
  } else if (control.policy === 'immutable') {
    directives.push('public');
    directives.push('immutable');
  }

  // Add max-age
  if (control.maxAge > 0) {
    directives.push(`max-age=${control.maxAge}`);
  }

  // Add s-maxage for CDN
  if (control.policy === 'public' && control.maxAge > 0) {
    directives.push(`s-maxage=${control.maxAge}`);
  }

  // Add stale-while-revalidate
  if (control.staleWhileRevalidate && control.staleWhileRevalidate > 0) {
    directives.push(`stale-while-revalidate=${control.staleWhileRevalidate}`);
  }

  // Add stale-if-error
  if (control.staleIfError && control.staleIfError > 0) {
    directives.push(`stale-if-error=${control.staleIfError}`);
  }

  // Add must-revalidate
  if (control.mustRevalidate) {
    directives.push('must-revalidate');
  }

  // Add proxy-revalidate
  if (control.proxyRevalidate) {
    directives.push('proxy-revalidate');
  }

  return directives.join(', ');
}

/**
 * Parse Cache-Control header into config
 */
export function parseCacheControl(header: string): Partial<CacheControl> {
  const result: Partial<CacheControl> = {};
  const directives = header.split(',').map(d => d.trim().toLowerCase());

  for (const directive of directives) {
    if (directive === 'no-cache') {
      result.policy = 'no-cache';
    } else if (directive === 'no-store') {
      result.policy = 'no-store';
    } else if (directive === 'public') {
      result.policy = 'public';
    } else if (directive === 'private') {
      result.policy = 'private';
    } else if (directive === 'immutable') {
      result.policy = 'immutable';
    } else if (directive === 'must-revalidate') {
      result.mustRevalidate = true;
    } else if (directive === 'proxy-revalidate') {
      result.proxyRevalidate = true;
    } else if (directive.startsWith('max-age=')) {
      result.maxAge = parseInt(directive.split('=')[1], 10);
    } else if (directive.startsWith('stale-while-revalidate=')) {
      result.staleWhileRevalidate = parseInt(directive.split('=')[1], 10);
    } else if (directive.startsWith('stale-if-error=')) {
      result.staleIfError = parseInt(directive.split('=')[1], 10);
    }
  }

  return result;
}

// ================================================================
// PRESET HELPERS
// ================================================================

/**
 * Get cache control for a preset name
 */
export function getPresetCacheControl(presetName: keyof typeof CACHE_PRESETS): CacheControl {
  const preset = CACHE_PRESETS[presetName];
  if (!preset) {
    throw new Error(`Unknown cache preset: ${presetName}`);
  }
  return preset.control;
}

/**
 * Get cache control header for a preset
 */
export function getPresetCacheHeader(presetName: keyof typeof CACHE_PRESETS): string {
  return buildCacheControl(getPresetCacheControl(presetName));
}

/**
 * Get all available presets
 */
export function getAvailablePresets(): CachePreset[] {
  return Object.values(CACHE_PRESETS);
}

// ================================================================
// ASSET TYPE HELPERS
// ================================================================

/**
 * Detect asset type from file extension
 */
export function getAssetTypeFromExtension(extension: string): AssetType {
  const ext = extension.toLowerCase().startsWith('.')
    ? extension.toLowerCase()
    : `.${extension.toLowerCase()}`;

  for (const [type, config] of Object.entries(ASSET_CONFIGS)) {
    if (config.extensions.includes(ext)) {
      return type as AssetType;
    }
  }

  return 'other';
}

/**
 * Detect asset type from MIME type
 */
export function getAssetTypeFromMime(mimeType: string): AssetType {
  const mime = mimeType.toLowerCase().split(';')[0].trim();

  for (const [type, config] of Object.entries(ASSET_CONFIGS)) {
    if (config.mimeTypes.includes(mime)) {
      return type as AssetType;
    }
  }

  return 'other';
}

/**
 * Get cache control for asset type
 */
export function getAssetCacheControl(assetType: AssetType): CacheControl {
  const config = ASSET_CONFIGS[assetType];
  return config ? config.cache : ASSET_CONFIGS.other.cache;
}

/**
 * Get cache header for asset type
 */
export function getAssetCacheHeader(assetType: AssetType): string {
  return buildCacheControl(getAssetCacheControl(assetType));
}

// ================================================================
// SECURITY HEADERS
// ================================================================

/**
 * Build security headers object
 */
export function buildSecurityHeaders(
  config: SecurityHeaders = DEFAULT_SECURITY_HEADERS
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.contentSecurityPolicy) {
    headers['Content-Security-Policy'] = config.contentSecurityPolicy;
  }

  if (config.xFrameOptions) {
    headers['X-Frame-Options'] = config.xFrameOptions;
  }

  if (config.xContentTypeOptions) {
    headers['X-Content-Type-Options'] = config.xContentTypeOptions;
  }

  if (config.referrerPolicy) {
    headers['Referrer-Policy'] = config.referrerPolicy;
  }

  if (config.permissionsPolicy) {
    headers['Permissions-Policy'] = config.permissionsPolicy;
  }

  if (config.strictTransportSecurity) {
    headers['Strict-Transport-Security'] = config.strictTransportSecurity;
  }

  return headers;
}

// ================================================================
// HEADER BUILDER
// ================================================================

export interface HeadersBuilderOptions {
  /** Cache preset or custom control */
  cache?: keyof typeof CACHE_PRESETS | CacheControl;
  /** Asset type for automatic cache */
  assetType?: AssetType;
  /** Include security headers */
  security?: boolean | Partial<SecurityHeaders>;
  /** ETag value */
  etag?: string;
  /** Last-Modified date */
  lastModified?: Date;
  /** Vary headers */
  vary?: string[];
  /** Custom headers */
  custom?: Record<string, string>;
}

/**
 * Build a complete set of HTTP headers
 */
export function buildHeaders(options: HeadersBuilderOptions): Record<string, string> {
  const headers: Record<string, string> = {};

  // Add cache control
  if (options.cache) {
    if (typeof options.cache === 'string') {
      headers['Cache-Control'] = getPresetCacheHeader(options.cache);
    } else {
      headers['Cache-Control'] = buildCacheControl(options.cache);
    }
  } else if (options.assetType) {
    headers['Cache-Control'] = getAssetCacheHeader(options.assetType);
  }

  // Add security headers
  if (options.security) {
    const securityConfig = options.security === true
      ? DEFAULT_SECURITY_HEADERS
      : { ...DEFAULT_SECURITY_HEADERS, ...options.security };
    Object.assign(headers, buildSecurityHeaders(securityConfig));
  }

  // Add ETag
  if (options.etag) {
    headers['ETag'] = options.etag.startsWith('"') ? options.etag : `"${options.etag}"`;
  }

  // Add Last-Modified
  if (options.lastModified) {
    headers['Last-Modified'] = options.lastModified.toUTCString();
  }

  // Add Vary
  if (options.vary && options.vary.length > 0) {
    headers['Vary'] = options.vary.join(', ');
  }

  // Add custom headers
  if (options.custom) {
    Object.assign(headers, options.custom);
  }

  return headers;
}

// ================================================================
// NEXT.JS HELPERS
// ================================================================

/**
 * Generate Next.js headers config for next.config.js
 */
export function generateNextHeaders(): Array<{
  source: string;
  headers: Array<{ key: string; value: string }>;
}> {
  return [
    // Static assets
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: getPresetCacheHeader('immutable') },
      ],
    },
    // Fonts
    {
      source: '/fonts/:path*',
      headers: [
        { key: 'Cache-Control', value: getPresetCacheHeader('fonts') },
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
    // Images
    {
      source: '/images/:path*',
      headers: [
        { key: 'Cache-Control', value: getPresetCacheHeader('media') },
      ],
    },
    // API routes
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: getPresetCacheHeader('api') },
      ],
    },
    // Security headers for all routes
    {
      source: '/:path*',
      headers: Object.entries(buildSecurityHeaders()).map(([key, value]) => ({
        key,
        value,
      })),
    },
  ];
}

// ================================================================
// URL HELPERS
// ================================================================

/**
 * Generate cache-busting URL with version/hash
 */
export function appendCacheBuster(url: string, version: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${version}`;
}

/**
 * Generate content hash for caching
 */
export function generateContentHash(content: string): string {
  // Simple hash for demonstration; use crypto in production
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ================================================================
// EXPORTS
// ================================================================

export default {
  buildCacheControl,
  parseCacheControl,
  getPresetCacheControl,
  getPresetCacheHeader,
  getAvailablePresets,
  getAssetTypeFromExtension,
  getAssetTypeFromMime,
  getAssetCacheControl,
  getAssetCacheHeader,
  buildSecurityHeaders,
  buildHeaders,
  generateNextHeaders,
  appendCacheBuster,
  generateContentHash,
};
