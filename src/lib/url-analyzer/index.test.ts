/**
 * URL Analyzer Tests
 *
 * Phase 1, Week 1, Day 2
 * Tests for URL analysis service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeUrl, UrlAnalysisRequestSchema } from './index';

// ================================================================
// MOCK HTML TEMPLATES
// ================================================================

const MINIMAL_HTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Page</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
`;

const FULL_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acme Corp | Enterprise Solutions</title>
  <meta name="description" content="Acme Corp provides enterprise solutions for modern businesses.">
  <meta name="generator" content="Next.js">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://acme.com/">
  <link rel="icon" href="/favicon.ico">

  <!-- Open Graph -->
  <meta property="og:title" content="Acme Corp - Enterprise Solutions">
  <meta property="og:description" content="Leading provider of enterprise solutions.">
  <meta property="og:image" content="https://acme.com/og-image.png">
  <meta property="og:url" content="https://acme.com/">
  <meta property="og:site_name" content="Acme Corp">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="en_US">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@acmecorp">
  <meta name="twitter:creator" content="@acmecorp">
  <meta name="twitter:title" content="Acme Corp">
  <meta name="twitter:description" content="Enterprise solutions for modern businesses.">
  <meta name="twitter:image" content="https://acme.com/twitter-image.png">

  <!-- Schema.org -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Acme Corporation",
    "description": "Leading enterprise solutions provider",
    "url": "https://acme.com",
    "logo": "https://acme.com/logo.png",
    "foundingDate": "2010",
    "sameAs": [
      "https://linkedin.com/company/acmecorp",
      "https://twitter.com/acmecorp",
      "https://facebook.com/acmecorp"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US",
      "addressRegion": "CA",
      "addressLocality": "San Francisco"
    }
  }
  </script>
</head>
<body>
  <header>
    <a href="https://linkedin.com/company/acmecorp">LinkedIn</a>
    <a href="https://github.com/acmecorp">GitHub</a>
  </header>
  <main>
    <h1>Welcome to Acme Corp</h1>
  </main>
</body>
</html>
`;

const ECOMMERCE_HTML = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>TiendaOnline - Compra los mejores productos</title>
  <meta name="description" content="Tu tienda online de confianza con los mejores precios.">
  <link rel="canonical" href="https://tiendaonline.com/">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

  <meta property="og:site_name" content="TiendaOnline">
  <meta property="og:type" content="website">

  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": ["Organization", "Store"],
    "name": "TiendaOnline",
    "url": "https://tiendaonline.com",
    "sameAs": [
      "https://instagram.com/tiendaonline",
      "https://youtube.com/@tiendaonline"
    ]
  }
  </script>
</head>
<body>
  <h1>Bienvenido</h1>
</body>
</html>
`;

// ================================================================
// MOCK FETCH
// ================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockFetchResponse(html: string, options: Partial<Response> = {}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers({
      'content-type': 'text/html; charset=utf-8',
      'content-length': String(html.length),
    }),
    text: async () => html,
    ...options,
  } as Response);
}

// ================================================================
// TESTS
// ================================================================

describe('analyzeUrl', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('URL validation', () => {
    it('should reject invalid URLs', async () => {
      const result = await analyzeUrl('not-a-url');
      expect(result.ok).toBe(false);
      // Error message can vary, just check it's an error
    });

    it('should reject private IP addresses', async () => {
      const result = await analyzeUrl('http://192.168.1.1');
      expect(result.ok).toBe(false);
    });

    it('should reject localhost', async () => {
      const result = await analyzeUrl('http://localhost:3000');
      expect(result.ok).toBe(false);
    });

    it('should accept valid HTTPS URLs', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');
      expect(result.ok).toBe(true);
    });

    it('should accept HTTP URLs', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('http://example.com');
      // HTTP is accepted (though HTTPS is preferred)
      expect(result.ok).toBe(true);
    });
  });

  describe('basic metadata extraction', () => {
    it('should extract title', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.title).toBe('Test Page');
      }
    });

    it('should extract description', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.description).toContain('enterprise solutions');
      }
    });

    it('should extract canonical URL', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com/page');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.canonicalUrl).toBe('https://acme.com/');
      }
    });

    it('should extract favicon', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.favicon).toContain('favicon');
      }
    });

    it('should extract language', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.language).toBe('en');
      }
    });

    it('should extract charset', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.charset).toBe('UTF-8');
      }
    });

    it('should extract generator', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.generator).toBe('Next.js');
      }
    });

    it('should extract robots directives', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.robotsDirectives).toContain('index');
        expect(result.value.metadata.robotsDirectives).toContain('follow');
      }
    });
  });

  describe('Open Graph extraction', () => {
    it('should extract all OG properties', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const og = result.value.metadata.openGraph;
        expect(og.title).toBe('Acme Corp - Enterprise Solutions');
        expect(og.description).toContain('enterprise solutions');
        expect(og.image).toBe('https://acme.com/og-image.png');
        expect(og.url).toBe('https://acme.com/');
        expect(og.siteName).toBe('Acme Corp');
        expect(og.type).toBe('website');
        expect(og.locale).toBe('en_US');
      }
    });

    it('should handle missing OG data', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.openGraph.title).toBeUndefined();
        expect(result.value.warnings).toContain('No Open Graph metadata found');
      }
    });
  });

  describe('Twitter Card extraction', () => {
    it('should extract all Twitter Card properties', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const tc = result.value.metadata.twitterCard;
        expect(tc.card).toBe('summary_large_image');
        expect(tc.site).toBe('@acmecorp');
        expect(tc.creator).toBe('@acmecorp');
        expect(tc.title).toBe('Acme Corp');
      }
    });
  });

  describe('Schema.org extraction', () => {
    it('should extract Organization schema', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schema = result.value.metadata.schemaOrg;
        expect(schema.types).toContain('Organization');
        expect(schema.name).toBe('Acme Corporation');
        expect(schema.description).toContain('enterprise');
        expect(schema.url).toBe('https://acme.com');
        expect(schema.logo).toBe('https://acme.com/logo.png');
        expect(schema.foundingDate).toBe('2010');
      }
    });

    it('should extract sameAs social links', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schema = result.value.metadata.schemaOrg;
        expect(schema.sameAs).toContain('https://linkedin.com/company/acmecorp');
        expect(schema.sameAs).toContain('https://twitter.com/acmecorp');
      }
    });

    it('should extract address', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const address = result.value.metadata.schemaOrg.address;
        expect(address?.country).toBe('US');
        expect(address?.region).toBe('CA');
        expect(address?.locality).toBe('San Francisco');
      }
    });

    it('should handle multiple schema types', async () => {
      mockFetchResponse(ECOMMERCE_HTML);
      const result = await analyzeUrl('https://tiendaonline.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const schema = result.value.metadata.schemaOrg;
        expect(schema.types).toContain('Organization');
        expect(schema.types).toContain('Store');
      }
    });

    it('should handle missing Schema.org', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.schemaOrg.types).toHaveLength(0);
        expect(result.value.warnings).toContain('No Schema.org structured data found');
      }
    });
  });

  describe('social profile extraction', () => {
    it('should extract profiles from Schema.org sameAs', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const social = result.value.metadata.socialProfiles;
        expect(social.linkedin).toContain('linkedin.com');
        expect(social.twitter).toContain('twitter.com');
        expect(social.facebook).toContain('facebook.com');
      }
    });

    it('should extract profiles from HTML links', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const social = result.value.metadata.socialProfiles;
        expect(social.github).toContain('github.com');
      }
    });

    it('should handle various social platforms', async () => {
      mockFetchResponse(ECOMMERCE_HTML);
      const result = await analyzeUrl('https://tiendaonline.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        const social = result.value.metadata.socialProfiles;
        expect(social.instagram).toContain('instagram.com');
        expect(social.youtube).toContain('youtube.com');
      }
    });
  });

  describe('brand detection', () => {
    it('should extract brand from Schema.org name', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://acme.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.brandName).toBe('Acme Corporation');
      }
    });

    it('should extract brand from OG site_name', async () => {
      mockFetchResponse(ECOMMERCE_HTML);
      const result = await analyzeUrl('https://tiendaonline.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.brandName).toBe('TiendaOnline');
      }
    });

    it('should extract brand from title with separator', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>MyBrand | Home Page</title></head>
        <body></body>
        </html>
      `;
      mockFetchResponse(html);
      const result = await analyzeUrl('https://mybrand.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.brandName).toBe('MyBrand');
      }
    });

    it('should clean brand name suffixes', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {"@type": "Organization", "name": "Startup Inc."}
          </script>
        </head>
        <body></body>
        </html>
      `;
      mockFetchResponse(html);
      const result = await analyzeUrl('https://startup.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.brandName).toBe('Startup');
      }
    });

    it('should fallback to domain name', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://coolcompany.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Brand name should be derived from domain
        expect(result.value.metadata.brandName?.toLowerCase()).toContain('cool');
      }
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      } as Response);

      const result = await analyzeUrl('https://example.com/notfound');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('404');
      }
    });

    it('should handle server errors with retry flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers(),
      } as Response);

      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(false);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('Network error');
      }
    });

    it('should handle timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await analyzeUrl('https://slow-site.com');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toContain('timeout');
      }
    });
  });

  describe('warnings', () => {
    it('should warn about missing structured data', async () => {
      const html = '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>';
      mockFetchResponse(html);

      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Should have warnings about missing metadata
        expect(result.value.warnings.length).toBeGreaterThan(0);
      }
    });

    it('should warn about missing title', async () => {
      const html = '<!DOCTYPE html><html><head></head><body></body></html>';
      mockFetchResponse(html);

      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.warnings).toContain('Page has no title');
      }
    });

    it('should warn about missing description', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.warnings).toContain('Page has no meta description');
      }
    });
  });

  describe('performance', () => {
    it('should track fetch duration', async () => {
      mockFetchResponse(MINIMAL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.fetchDurationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track content length', async () => {
      mockFetchResponse(FULL_HTML);
      const result = await analyzeUrl('https://example.com');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.metadata.contentLength).toBeGreaterThan(0);
      }
    });
  });
});

describe('UrlAnalysisRequestSchema', () => {
  it('should accept valid URLs', () => {
    expect(() => UrlAnalysisRequestSchema.parse({ url: 'https://example.com' })).not.toThrow();
  });

  it('should reject invalid URLs', () => {
    expect(() => UrlAnalysisRequestSchema.parse({ url: 'not-a-url' })).toThrow();
  });

  it('should reject missing URL', () => {
    expect(() => UrlAnalysisRequestSchema.parse({})).toThrow();
  });
});
