/**
 * Schema Analyzer Tests
 * Phase 1, Week 1, Day 5 - KG: Schema.org extractor
 */

import { describe, it, expect } from 'vitest';
import { SchemaAnalyzer, analyzeSchemaQuality } from './schema-analyzer';
import { extractSchemasFromHtml } from './schema-extractor';
import type { SchemaExtractionResult } from './types';

describe('SchemaAnalyzer', () => {
  const analyzer = new SchemaAnalyzer();

  describe('Category Analysis', () => {
    it('should analyze schema presence', () => {
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
              { "@type": "WebPage", "name": "Home" }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const presenceCategory = analysis.categories.find(
        (c) => c.name === 'Schema Presence'
      );

      expect(presenceCategory).toBeDefined();
      expect(presenceCategory!.score).toBeGreaterThan(15);
      expect(presenceCategory!.details).toContain('Organization schema present');
      expect(presenceCategory!.details).toContain('WebSite schema present');
      expect(presenceCategory!.details).toContain('WebPage schema present');
    });

    it('should analyze schema completeness', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Complete Company",
            "url": "https://example.com",
            "logo": "https://example.com/logo.png",
            "description": "A complete company description",
            "sameAs": ["https://twitter.com/company", "https://linkedin.com/company"]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const completenessCategory = analysis.categories.find(
        (c) => c.name === 'Schema Completeness'
      );

      expect(completenessCategory).toBeDefined();
      expect(completenessCategory!.score).toBeGreaterThan(5);
      expect(completenessCategory!.details).toContain('Organization has name');
      expect(completenessCategory!.details).toContain('Organization has logo');
    });

    it('should analyze schema validity', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Valid Company",
            "url": "https://example.com"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const validityCategory = analysis.categories.find(
        (c) => c.name === 'Schema Validity'
      );

      expect(validityCategory).toBeDefined();
      expect(validityCategory!.score).toBeGreaterThan(0);
    });

    it('should analyze rich results potential', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                "itemListElement": [
                  { "@type": "ListItem", "position": 1, "name": "Home" }
                ]
              },
              {
                "@type": "FAQPage",
                "mainEntity": [
                  {
                    "@type": "Question",
                    "name": "What is this?",
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": "This is an answer"
                    }
                  }
                ]
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const richResultsCategory = analysis.categories.find(
        (c) => c.name === 'Rich Results Potential'
      );

      expect(richResultsCategory).toBeDefined();
      expect(richResultsCategory!.score).toBeGreaterThan(5);
      expect(richResultsCategory!.details).toContain('Breadcrumbs rich result eligible');
      expect(richResultsCategory!.details).toContain('FAQ rich result eligible');
    });
  });

  describe('Recommendations', () => {
    it('should recommend adding Organization when missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "WebPage", "name": "Home" }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const orgRecommendation = analysis.recommendations.find(
        (r) => r.message.includes('Organization')
      );

      expect(orgRecommendation).toBeDefined();
      expect(orgRecommendation!.priority).toBe('high');
    });

    it('should recommend adding WebSite when missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Organization", "name": "Test" }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const wsRecommendation = analysis.recommendations.find(
        (r) => r.message.includes('WebSite')
      );

      expect(wsRecommendation).toBeDefined();
      expect(wsRecommendation!.priority).toBe('high');
    });

    it('should recommend adding breadcrumbs when missing', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              { "@type": "Organization", "name": "Test" },
              { "@type": "WebSite", "name": "Site" }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const bcRecommendation = analysis.recommendations.find(
        (r) => r.message.includes('BreadcrumbList')
      );

      expect(bcRecommendation).toBeDefined();
      expect(bcRecommendation!.priority).toBe('medium');
    });

    it('should recommend adding logo to Organization', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Organization",
            "name": "Test Company",
            "url": "https://example.com"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const logoRecommendation = analysis.recommendations.find(
        (r) => r.message.includes('logo')
      );

      expect(logoRecommendation).toBeDefined();
      expect(logoRecommendation!.priority).toBe('medium');
    });
  });

  describe('Rich Result Eligibility', () => {
    it('should check Breadcrumb eligibility', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://example.com" },
              { "@type": "ListItem", "position": 2, "name": "Products", "item": "https://example.com/products" }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const bcEligibility = analysis.richResults.find((r) => r.type === 'Breadcrumbs');

      expect(bcEligibility).toBeDefined();
      expect(bcEligibility!.eligible).toBe(true);
      expect(bcEligibility!.googleDocsUrl).toBeDefined();
    });

    it('should check FAQ eligibility', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Question 1",
                "acceptedAnswer": { "@type": "Answer", "text": "Answer 1" }
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const faqEligibility = analysis.richResults.find((r) => r.type === 'FAQ');

      expect(faqEligibility).toBeDefined();
      expect(faqEligibility!.eligible).toBe(true);
    });

    it('should check Product eligibility', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
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

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const productEligibility = analysis.richResults.find((r) => r.type === 'Product');

      expect(productEligibility).toBeDefined();
      expect(productEligibility!.eligible).toBe(true);
    });

    it('should mark Product as ineligible when missing required fields', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "description": "A product without name or image"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const productEligibility = analysis.richResults.find((r) => r.type === 'Product');

      expect(productEligibility).toBeDefined();
      expect(productEligibility!.eligible).toBe(false);
    });

    it('should check Organization/Logo eligibility', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
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

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const orgEligibility = analysis.richResults.find((r) => r.type === 'Organization/Logo');

      expect(orgEligibility).toBeDefined();
      expect(orgEligibility!.eligible).toBe(true);
    });

    it('should check Sitelinks Searchbox eligibility', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "WebSite",
            "name": "Test Site",
            "url": "https://example.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://example.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      const searchboxEligibility = analysis.richResults.find(
        (r) => r.type === 'Sitelinks Searchbox'
      );

      expect(searchboxEligibility).toBeDefined();
      expect(searchboxEligibility!.eligible).toBe(true);
    });
  });

  describe('AI Perception Metrics', () => {
    it('should calculate brand identity score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Organization",
            "name": "AI Perception Company",
            "description": "We help brands understand AI perception",
            "logo": "https://example.com/logo.png",
            "slogan": "Know how AI sees you",
            "sameAs": ["https://twitter.com/example", "https://linkedin.com/company/example"]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.aiPerception.brandIdentityScore).toBeGreaterThan(50);
      expect(analysis.aiPerception.findings).toContain(
        'Organization entity provides brand identity foundation'
      );
      expect(analysis.aiPerception.findings).toContain(
        'Brand description available for AI understanding'
      );
    });

    it('should calculate business info score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@type": "Organization",
            "name": "Complete Business",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Main St",
              "addressLocality": "San Francisco",
              "addressRegion": "CA"
            },
            "telephone": "+1-555-123-4567",
            "email": "contact@example.com",
            "foundingDate": "2020-01-01"
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.aiPerception.businessInfoScore).toBeGreaterThan(30);
      expect(analysis.aiPerception.findings).toContain(
        'Physical/business address structured'
      );
      expect(analysis.aiPerception.findings).toContain(
        'Contact information structured'
      );
    });

    it('should calculate content context score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              { "@type": "WebSite", "name": "Test Site" },
              { "@type": "WebPage", "name": "Home" },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [{ "@type": "ListItem", "position": 1 }]
              },
              {
                "@type": "FAQPage",
                "mainEntity": []
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.aiPerception.contentContextScore).toBeGreaterThan(40);
      expect(analysis.aiPerception.findings).toContain(
        'Navigation context via breadcrumbs'
      );
      expect(analysis.aiPerception.findings).toContain(
        'FAQ content easily parseable by AI'
      );
    });

    it('should calculate social proof score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": 150
              },
              {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5"
                },
                "author": { "@type": "Person", "name": "John" },
                "reviewBody": "Great product!"
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.aiPerception.socialProofScore).toBeGreaterThan(50);
      expect(analysis.aiPerception.findings).toContain(
        'Reviews provide social proof signals'
      );
      expect(analysis.aiPerception.findings).toContain(
        'Aggregate rating summarizes customer sentiment'
      );
    });

    it('should calculate overall AI readiness score', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              {
                "@type": "Organization",
                "name": "AI Ready Company",
                "description": "Full schema implementation",
                "logo": "https://example.com/logo.png",
                "sameAs": ["https://twitter.com/example"],
                "address": { "@type": "PostalAddress" },
                "telephone": "+1-555-123-4567"
              },
              { "@type": "WebSite", "name": "Test Site" },
              { "@type": "WebPage", "name": "Home" },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [{ "@type": "ListItem", "position": 1 }]
              },
              { "@type": "AggregateRating", "ratingValue": "4.5" }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.aiPerception.aiReadinessScore).toBeGreaterThan(40);
    });
  });

  describe('Overall Score', () => {
    it('should calculate overall score from categories', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@graph": [
              {
                "@type": "Organization",
                "name": "Test",
                "url": "https://example.com",
                "logo": "logo.png"
              },
              { "@type": "WebSite", "name": "Site" },
              { "@type": "WebPage", "name": "Page" },
              {
                "@type": "BreadcrumbList",
                "itemListElement": [{ "@type": "ListItem", "position": 1 }]
              }
            ]
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.overallScore).toBeGreaterThan(30);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
    });

    it('should give low score for minimal schemas', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Thing" }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzer.analyze(extraction);

      expect(analysis.overallScore).toBeLessThan(50);
    });
  });

  describe('Convenience Function', () => {
    it('should analyze via analyzeSchemaQuality function', () => {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          { "@type": "Organization", "name": "Test" }
          </script>
        </head>
        <body></body>
        </html>
      `;

      const extraction = extractSchemasFromHtml(html, 'https://example.com');
      const analysis = analyzeSchemaQuality(extraction);

      expect(analysis).toBeDefined();
      expect(analysis.overallScore).toBeDefined();
      expect(analysis.categories).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      expect(analysis.richResults).toBeDefined();
      expect(analysis.aiPerception).toBeDefined();
    });
  });

  describe('Empty/Error Cases', () => {
    it('should handle extraction with no schemas', () => {
      const emptyResult: SchemaExtractionResult = {
        url: 'https://example.com',
        extractedAt: new Date(),
        success: false,
        schemas: [],
        errors: [],
        summary: {
          totalSchemas: 0,
          schemasByType: {},
          sourcesFound: [],
          hasOrganization: false,
          hasWebSite: false,
          hasWebPage: false,
          hasProduct: false,
          hasBreadcrumbs: false,
          hasFAQ: false,
          hasReviews: false,
          hasLocalBusiness: false,
          hasArticle: false,
          hasEvent: false,
          qualityScore: 0,
        },
      };

      const analysis = analyzer.analyze(emptyResult);

      // With no schemas, only validity category gives base score (25), others are 0
      // Overall score is weighted average, so it will be low but not necessarily 0
      expect(analysis.overallScore).toBeLessThan(30);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });
});
