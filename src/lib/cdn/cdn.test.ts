/**
 * CDN Module Tests
 *
 * Phase 3, Week 9, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  buildCacheControl,
  parseCacheControl,
  getPresetCacheControl,
  getPresetCacheHeader,
  getAssetTypeFromExtension,
  getAssetTypeFromMime,
  getAssetCacheControl,
  buildSecurityHeaders,
  buildHeaders,
  generateNextHeaders,
  appendCacheBuster,
  generateContentHash,
} from './cache-headers';
import {
  CACHE_PRESETS,
  ASSET_CONFIGS,
  DEFAULT_SECURITY_HEADERS,
  DEFAULT_IMAGE_OPTIMIZATION,
} from './types';

// ================================================================
// CACHE CONTROL
// ================================================================

describe('buildCacheControl', () => {
  it('should build no-cache header', () => {
    const result = buildCacheControl({ policy: 'no-cache', maxAge: 0 });
    expect(result).toBe('no-cache');
  });

  it('should build no-store header', () => {
    const result = buildCacheControl({ policy: 'no-store', maxAge: 0 });
    expect(result).toBe('no-store');
  });

  it('should build public header with max-age', () => {
    const result = buildCacheControl({ policy: 'public', maxAge: 3600 });
    expect(result).toContain('public');
    expect(result).toContain('max-age=3600');
    expect(result).toContain('s-maxage=3600');
  });

  it('should build private header', () => {
    const result = buildCacheControl({ policy: 'private', maxAge: 300 });
    expect(result).toContain('private');
    expect(result).toContain('max-age=300');
    expect(result).not.toContain('s-maxage');
  });

  it('should build immutable header', () => {
    const result = buildCacheControl({ policy: 'immutable', maxAge: 31536000 });
    expect(result).toContain('public');
    expect(result).toContain('immutable');
    expect(result).toContain('max-age=31536000');
  });

  it('should include stale-while-revalidate', () => {
    const result = buildCacheControl({
      policy: 'public',
      maxAge: 3600,
      staleWhileRevalidate: 86400,
    });
    expect(result).toContain('stale-while-revalidate=86400');
  });

  it('should include stale-if-error', () => {
    const result = buildCacheControl({
      policy: 'public',
      maxAge: 3600,
      staleIfError: 86400,
    });
    expect(result).toContain('stale-if-error=86400');
  });

  it('should include must-revalidate', () => {
    const result = buildCacheControl({
      policy: 'private',
      maxAge: 0,
      mustRevalidate: true,
    });
    expect(result).toContain('must-revalidate');
  });

  it('should include proxy-revalidate', () => {
    const result = buildCacheControl({
      policy: 'public',
      maxAge: 3600,
      proxyRevalidate: true,
    });
    expect(result).toContain('proxy-revalidate');
  });
});

describe('parseCacheControl', () => {
  it('should parse no-cache', () => {
    const result = parseCacheControl('no-cache');
    expect(result.policy).toBe('no-cache');
  });

  it('should parse public with max-age', () => {
    const result = parseCacheControl('public, max-age=3600');
    expect(result.policy).toBe('public');
    expect(result.maxAge).toBe(3600);
  });

  it('should parse complex header', () => {
    const result = parseCacheControl(
      'public, max-age=3600, stale-while-revalidate=86400, must-revalidate'
    );
    expect(result.policy).toBe('public');
    expect(result.maxAge).toBe(3600);
    expect(result.staleWhileRevalidate).toBe(86400);
    expect(result.mustRevalidate).toBe(true);
  });

  it('should handle immutable', () => {
    const result = parseCacheControl('public, max-age=31536000, immutable');
    expect(result.policy).toBe('immutable');
    expect(result.maxAge).toBe(31536000);
  });
});

// ================================================================
// PRESETS
// ================================================================

describe('Presets', () => {
  describe('getPresetCacheControl', () => {
    it('should return preset config', () => {
      const result = getPresetCacheControl('api');
      expect(result.policy).toBe('private');
      expect(result.mustRevalidate).toBe(true);
    });

    it('should throw for unknown preset', () => {
      expect(() => getPresetCacheControl('unknown' as keyof typeof CACHE_PRESETS)).toThrow();
    });
  });

  describe('getPresetCacheHeader', () => {
    it('should return formatted header', () => {
      const result = getPresetCacheHeader('immutable');
      expect(result).toContain('public');
      expect(result).toContain('immutable');
    });
  });

  describe('CACHE_PRESETS', () => {
    it('should have required presets', () => {
      expect(CACHE_PRESETS.noCache).toBeDefined();
      expect(CACHE_PRESETS.api).toBeDefined();
      expect(CACHE_PRESETS.staticPage).toBeDefined();
      expect(CACHE_PRESETS.media).toBeDefined();
      expect(CACHE_PRESETS.immutable).toBeDefined();
    });

    it('should have descriptions for all presets', () => {
      for (const preset of Object.values(CACHE_PRESETS)) {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
      }
    });
  });
});

// ================================================================
// ASSET TYPES
// ================================================================

describe('Asset Types', () => {
  describe('getAssetTypeFromExtension', () => {
    it('should detect image types', () => {
      expect(getAssetTypeFromExtension('.jpg')).toBe('image');
      expect(getAssetTypeFromExtension('.png')).toBe('image');
      expect(getAssetTypeFromExtension('.webp')).toBe('image');
      expect(getAssetTypeFromExtension('svg')).toBe('image');
    });

    it('should detect script types', () => {
      expect(getAssetTypeFromExtension('.js')).toBe('script');
      expect(getAssetTypeFromExtension('.mjs')).toBe('script');
    });

    it('should detect style types', () => {
      expect(getAssetTypeFromExtension('.css')).toBe('style');
    });

    it('should detect font types', () => {
      expect(getAssetTypeFromExtension('.woff')).toBe('font');
      expect(getAssetTypeFromExtension('.woff2')).toBe('font');
      expect(getAssetTypeFromExtension('.ttf')).toBe('font');
    });

    it('should return other for unknown', () => {
      expect(getAssetTypeFromExtension('.xyz')).toBe('other');
    });

    it('should handle extensions without dot', () => {
      expect(getAssetTypeFromExtension('jpg')).toBe('image');
    });
  });

  describe('getAssetTypeFromMime', () => {
    it('should detect image types', () => {
      expect(getAssetTypeFromMime('image/jpeg')).toBe('image');
      expect(getAssetTypeFromMime('image/png')).toBe('image');
      expect(getAssetTypeFromMime('image/webp')).toBe('image');
    });

    it('should detect script types', () => {
      expect(getAssetTypeFromMime('application/javascript')).toBe('script');
      expect(getAssetTypeFromMime('text/javascript')).toBe('script');
    });

    it('should handle MIME with charset', () => {
      expect(getAssetTypeFromMime('application/json; charset=utf-8')).toBe('data');
    });

    it('should return other for unknown', () => {
      expect(getAssetTypeFromMime('application/octet-stream')).toBe('other');
    });
  });

  describe('getAssetCacheControl', () => {
    it('should return cache control for asset type', () => {
      const imageCache = getAssetCacheControl('image');
      expect(imageCache.policy).toBe('public');
      expect(imageCache.maxAge).toBe(31536000);
    });
  });

  describe('ASSET_CONFIGS', () => {
    it('should have all asset types', () => {
      expect(ASSET_CONFIGS.image).toBeDefined();
      expect(ASSET_CONFIGS.script).toBeDefined();
      expect(ASSET_CONFIGS.style).toBeDefined();
      expect(ASSET_CONFIGS.font).toBeDefined();
      expect(ASSET_CONFIGS.video).toBeDefined();
      expect(ASSET_CONFIGS.audio).toBeDefined();
      expect(ASSET_CONFIGS.document).toBeDefined();
      expect(ASSET_CONFIGS.data).toBeDefined();
      expect(ASSET_CONFIGS.other).toBeDefined();
    });

    it('should have compression settings', () => {
      expect(ASSET_CONFIGS.image.compress).toBe(true);
      expect(ASSET_CONFIGS.font.compress).toBe(false); // Fonts are pre-compressed
    });
  });
});

// ================================================================
// SECURITY HEADERS
// ================================================================

describe('Security Headers', () => {
  describe('buildSecurityHeaders', () => {
    it('should build default security headers', () => {
      const headers = buildSecurityHeaders();

      expect(headers['X-Frame-Options']).toBe('DENY');
      expect(headers['X-Content-Type-Options']).toBe('nosniff');
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    });

    it('should include HSTS', () => {
      const headers = buildSecurityHeaders();
      expect(headers['Strict-Transport-Security']).toContain('max-age=');
    });

    it('should allow custom CSP', () => {
      const headers = buildSecurityHeaders({
        contentSecurityPolicy: "default-src 'self'",
      });
      expect(headers['Content-Security-Policy']).toBe("default-src 'self'");
    });

    it('should allow overriding defaults', () => {
      const headers = buildSecurityHeaders({
        xFrameOptions: 'SAMEORIGIN',
      });
      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });
  });

  describe('DEFAULT_SECURITY_HEADERS', () => {
    it('should have recommended settings', () => {
      expect(DEFAULT_SECURITY_HEADERS.xFrameOptions).toBe('DENY');
      expect(DEFAULT_SECURITY_HEADERS.xContentTypeOptions).toBe('nosniff');
    });
  });
});

// ================================================================
// HEADERS BUILDER
// ================================================================

describe('buildHeaders', () => {
  it('should build headers with preset', () => {
    const headers = buildHeaders({ cache: 'api' });
    expect(headers['Cache-Control']).toContain('private');
  });

  it('should build headers with custom cache', () => {
    const headers = buildHeaders({
      cache: { policy: 'public', maxAge: 3600 },
    });
    expect(headers['Cache-Control']).toContain('max-age=3600');
  });

  it('should build headers with asset type', () => {
    const headers = buildHeaders({ assetType: 'image' });
    expect(headers['Cache-Control']).toContain('public');
  });

  it('should include security headers', () => {
    const headers = buildHeaders({ security: true });
    expect(headers['X-Frame-Options']).toBe('DENY');
  });

  it('should add ETag', () => {
    const headers = buildHeaders({ etag: 'abc123' });
    expect(headers['ETag']).toBe('"abc123"');
  });

  it('should handle quoted ETag', () => {
    const headers = buildHeaders({ etag: '"abc123"' });
    expect(headers['ETag']).toBe('"abc123"');
  });

  it('should add Last-Modified', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const headers = buildHeaders({ lastModified: date });
    expect(headers['Last-Modified']).toBe('Mon, 01 Jan 2024 00:00:00 GMT');
  });

  it('should add Vary', () => {
    const headers = buildHeaders({ vary: ['Accept', 'Accept-Encoding'] });
    expect(headers['Vary']).toBe('Accept, Accept-Encoding');
  });

  it('should merge custom headers', () => {
    const headers = buildHeaders({
      custom: { 'X-Custom': 'value' },
    });
    expect(headers['X-Custom']).toBe('value');
  });
});

// ================================================================
// NEXT.JS HELPERS
// ================================================================

describe('generateNextHeaders', () => {
  it('should generate headers config', () => {
    const headers = generateNextHeaders();
    expect(Array.isArray(headers)).toBe(true);
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should include static assets config', () => {
    const headers = generateNextHeaders();
    const staticConfig = headers.find(h => h.source.includes('_next/static'));
    expect(staticConfig).toBeDefined();
    expect(staticConfig?.headers.some(h => h.key === 'Cache-Control')).toBe(true);
  });

  it('should include API config', () => {
    const headers = generateNextHeaders();
    const apiConfig = headers.find(h => h.source.includes('/api/'));
    expect(apiConfig).toBeDefined();
  });

  it('should include security headers', () => {
    const headers = generateNextHeaders();
    const allRoutesConfig = headers.find(h => h.source === '/:path*');
    expect(allRoutesConfig).toBeDefined();
    expect(allRoutesConfig?.headers.some(h => h.key === 'X-Frame-Options')).toBe(true);
  });
});

// ================================================================
// URL HELPERS
// ================================================================

describe('URL Helpers', () => {
  describe('appendCacheBuster', () => {
    it('should append version parameter', () => {
      const result = appendCacheBuster('/image.png', '1.0.0');
      expect(result).toBe('/image.png?v=1.0.0');
    });

    it('should handle existing query params', () => {
      const result = appendCacheBuster('/image.png?size=large', '1.0.0');
      expect(result).toBe('/image.png?size=large&v=1.0.0');
    });
  });

  describe('generateContentHash', () => {
    it('should generate consistent hash', () => {
      const content = 'test content';
      const hash1 = generateContentHash(content);
      const hash2 = generateContentHash(content);
      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different content', () => {
      const hash1 = generateContentHash('content1');
      const hash2 = generateContentHash('content2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return string hash', () => {
      const hash = generateContentHash('test');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });
});

// ================================================================
// IMAGE OPTIMIZATION CONFIG
// ================================================================

describe('Image Optimization', () => {
  it('should have sensible defaults', () => {
    expect(DEFAULT_IMAGE_OPTIMIZATION.enabled).toBe(true);
    expect(DEFAULT_IMAGE_OPTIMIZATION.quality).toBeGreaterThan(0);
    expect(DEFAULT_IMAGE_OPTIMIZATION.quality).toBeLessThanOrEqual(100);
    expect(DEFAULT_IMAGE_OPTIMIZATION.lazyLoad).toBe(true);
  });

  it('should have responsive sizes', () => {
    expect(DEFAULT_IMAGE_OPTIMIZATION.responsiveSizes.length).toBeGreaterThan(0);
    expect(DEFAULT_IMAGE_OPTIMIZATION.responsiveSizes).toContain(1920);
  });
});
