/**
 * Schema Extractor Tests
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SchemaExtractor,
  createSchemaExtractor,
  extractSchemasFromHtml,
} from './schema-extractor';

describe('SchemaExtractor', () => {
  let extractor: SchemaExtractor;

  beforeEach(() => {
    extractor = new SchemaExtractor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('JSON-LD Extraction', () => {
    it('should extract single JSON-LD schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test Company",
            "url": "https://example.com"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(1);
      expect(result.schemas[0].type).toBe('Organization');
      expect(result.schemas[0].source).toBe('json-ld');
      expect(result.schemas[0].raw.name).toBe('Test Company');
    });

    it('should extract multiple JSON-LD schemas', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test Company"
          }
          </script>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "Test Site",
            "url": "https://example.com"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(2);
      expect(result.schemas.map((s) => s.type)).toContain('Organization');
      expect(result.schemas.map((s) => s.type)).toContain('WebSite');
    });

    it('should extract schemas from @graph container', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "name": "Test Company"
              },
              {
                "@type": "WebSite",
                "name": "Test Site"
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(2);
    });

    it('should extract array of schemas', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          [
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Company 1"
            },
            {
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Company 2"
            }
          ]
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(2);
    });

    it('should handle invalid JSON-LD gracefully', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          { invalid json here }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.schemas.length).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].message).toContain('Invalid JSON-LD');
    });

    it('should handle empty JSON-LD script', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json"></script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.schemas.length).toBe(0);
    });
  });

  describe('Schema Validation', () => {
    it('should validate Organization schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test Company",
            "url": "https://example.com",
            "logo": "https://example.com/logo.png"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.schemas[0].valid).toBe(true);
    });

    it('should warn when Organization missing name', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://example.com"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      const warnings = result.errors.filter(
        (e) => e.severity === 'warning' && e.path === 'name'
      );
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should validate BreadcrumbList schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://example.com"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Products",
                "item": "https://example.com/products"
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.schemas[0].valid).toBe(true);
      expect(result.summary.hasBreadcrumbs).toBe(true);
    });

    it('should error when BreadcrumbList missing itemListElement', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      const errors = result.errors.filter(
        (e) => e.severity === 'error' && e.path === 'itemListElement'
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate Product schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "Test Product",
            "image": "https://example.com/product.jpg",
            "offers": {
              "@type": "Offer",
              "price": "99.99",
              "priceCurrency": "USD"
            }
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.schemas[0].valid).toBe(true);
      expect(result.summary.hasProduct).toBe(true);
    });

    it('should error when Product missing name', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Product",
            "image": "https://example.com/product.jpg"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.schemas[0].valid).toBe(false);
      const errors = result.errors.filter(
        (e) => e.severity === 'error' && e.path === 'name'
      );
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should validate Article schema', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "Test Article",
            "image": "https://example.com/article.jpg",
            "datePublished": "2024-01-01",
            "author": {
              "@type": "Person",
              "name": "John Doe"
            }
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.schemas[0].valid).toBe(true);
      expect(result.summary.hasArticle).toBe(true);
    });
  });

  describe('Summary Generation', () => {
    it('should generate accurate summary', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "Organization", "name": "Test" },
              { "@type": "WebSite", "name": "Test Site" },
              { "@type": "WebPage", "name": "Home" },
              { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1 }] },
              { "@type": "FAQPage", "mainEntity": [] },
              { "@type": "Product", "name": "Product" },
              { "@type": "AggregateRating", "ratingValue": "4.5" }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.summary.totalSchemas).toBe(7);
      expect(result.summary.hasOrganization).toBe(true);
      expect(result.summary.hasWebSite).toBe(true);
      expect(result.summary.hasWebPage).toBe(true);
      expect(result.summary.hasBreadcrumbs).toBe(true);
      expect(result.summary.hasFAQ).toBe(true);
      expect(result.summary.hasProduct).toBe(true);
      expect(result.summary.hasReviews).toBe(true);
      expect(result.summary.sourcesFound).toContain('json-ld');
    });

    it('should detect LocalBusiness as Organization', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Local Shop"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.summary.hasOrganization).toBe(true);
      expect(result.summary.hasLocalBusiness).toBe(true);
    });

    it('should detect BlogPosting as Article', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": "My Blog Post"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.summary.hasArticle).toBe(true);
    });

    it('should calculate quality score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              { "@type": "Organization", "name": "Test", "url": "https://example.com", "logo": "logo.png" },
              { "@type": "WebSite", "name": "Test Site" },
              { "@type": "BreadcrumbList", "itemListElement": [{ "@type": "ListItem", "position": 1 }] },
              { "@type": "FAQPage", "mainEntity": [] }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.summary.qualityScore).toBeGreaterThan(50);
    });
  });

  describe('Microdata Extraction', () => {
    it('should extract microdata when enabled', () => {
      const extractor = new SchemaExtractor({ extractMicrodata: true });

      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <div itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Test Company</span>
          </div>
        </body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBeGreaterThan(0);
      expect(result.schemas[0].source).toBe('microdata');
      expect(result.schemas[0].type).toBe('Organization');
    });

    it('should not extract microdata by default', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <div itemscope itemtype="https://schema.org/Organization">
            <span itemprop="name">Test Company</span>
          </div>
        </body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.schemas.length).toBe(0);
    });
  });

  describe('RDFa Extraction', () => {
    it('should extract RDFa when enabled', () => {
      const extractor = new SchemaExtractor({ extractRdfa: true });

      const html = `
        <!DOCTYPE html>
        <html>
        <body>
          <div typeof="https://schema.org/Organization">
            <span property="name">Test Company</span>
          </div>
        </body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBeGreaterThan(0);
      expect(result.schemas[0].source).toBe('rdfa');
      expect(result.schemas[0].type).toBe('Organization');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty HTML', () => {
      const result = extractor.extractFromHtml('', 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.schemas.length).toBe(0);
    });

    it('should handle HTML without schemas', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head><title>No Schemas</title></head>
        <body><p>Just plain HTML</p></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.schemas.length).toBe(0);
      expect(result.summary.qualityScore).toBe(0);
    });

    it('should reject oversized HTML', () => {
      const extractor = new SchemaExtractor({ maxHtmlSize: 100 });
      const html = 'x'.repeat(200);

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('exceeds maximum size');
    });

    it('should handle schemas with multiple types', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness"],
            "name": "Multi-Type Entity"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractor.extractFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas[0].type).toEqual(['Organization', 'LocalBusiness']);
    });
  });

  describe('Factory Functions', () => {
    it('should create extractor with custom config', () => {
      const extractor = createSchemaExtractor({
        validateSchemas: false,
        extractMicrodata: true,
      });

      expect(extractor).toBeInstanceOf(SchemaExtractor);
    });

    it('should extract schemas from HTML with convenience function', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Test"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const result = extractSchemasFromHtml(html, 'https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(1);
    });
  });

  describe('URL Fetching', () => {
    it('should handle fetch errors gracefully', async () => {
      // Mock fetch to fail
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await extractor.extractFromUrl('https://example.com');

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Network error');

      global.fetch = originalFetch;
    });

    it('should handle HTTP errors', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await extractor.extractFromUrl('https://example.com');

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('404');

      global.fetch = originalFetch;
    });

    it('should handle invalid content type', async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: () => Promise.resolve('{}'),
      });

      const result = await extractor.extractFromUrl('https://example.com');

      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Invalid content type');

      global.fetch = originalFetch;
    });

    it('should successfully fetch and extract', async () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {"@type": "Organization", "name": "Test"}
          </script>
        </head>
        <body></body>
        </html>
      `;

      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
        text: () => Promise.resolve(html),
      });

      const result = await extractor.extractFromUrl('https://example.com');

      expect(result.success).toBe(true);
      expect(result.schemas.length).toBe(1);

      global.fetch = originalFetch;
    });
  });
});
