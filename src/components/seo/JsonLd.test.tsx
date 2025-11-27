/**
 * JSON-LD Component Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect } from 'vitest';
import {
  generateOrganizationJsonLd,
  generateSoftwareApplicationJsonLd,
  generateFAQPageJsonLd,
  generateWebPageJsonLd,
  generateWebSiteJsonLd,
  DEFAULT_ORGANIZATION,
  DEFAULT_SOFTWARE_APPLICATION,
  CORE_FAQ_ITEMS,
  type OrganizationData,
  type SoftwareApplicationData,
  type FAQItem,
} from './JsonLd';

describe('generateOrganizationJsonLd', () => {
  it('should generate valid Organization schema with defaults', () => {
    const result = generateOrganizationJsonLd();

    expect(result).toHaveProperty('@context', 'https://schema.org');
    expect(result).toHaveProperty('@type', 'Organization');
    expect(result).toHaveProperty('name', DEFAULT_ORGANIZATION.name);
    expect(result).toHaveProperty('url', DEFAULT_ORGANIZATION.url);
  });

  it('should include logo when provided', () => {
    const org: OrganizationData = {
      ...DEFAULT_ORGANIZATION,
      logo: 'https://example.com/logo.png',
    };
    const result = generateOrganizationJsonLd(org) as Record<string, unknown>;

    expect(result.logo).toBe('https://example.com/logo.png');
  });

  it('should include sameAs array when provided', () => {
    const result = generateOrganizationJsonLd(DEFAULT_ORGANIZATION) as Record<string, unknown>;

    expect(Array.isArray(result.sameAs)).toBe(true);
    expect((result.sameAs as string[]).length).toBeGreaterThan(0);
  });

  it('should include founders when provided', () => {
    const org: OrganizationData = {
      ...DEFAULT_ORGANIZATION,
      founders: [
        { name: 'John Doe', url: 'https://johndoe.com' },
        { name: 'Jane Smith' },
      ],
    };
    const result = generateOrganizationJsonLd(org) as Record<string, unknown>;

    expect(Array.isArray(result.founder)).toBe(true);
    const founders = result.founder as Array<Record<string, unknown>>;
    expect(founders[0]).toHaveProperty('@type', 'Person');
    expect(founders[0]).toHaveProperty('name', 'John Doe');
    expect(founders[0]).toHaveProperty('url', 'https://johndoe.com');
    expect(founders[1]).not.toHaveProperty('url');
  });

  it('should include contactPoint when provided', () => {
    const result = generateOrganizationJsonLd(DEFAULT_ORGANIZATION) as Record<string, unknown>;

    expect(result.contactPoint).toBeDefined();
    const contact = result.contactPoint as Record<string, unknown>;
    expect(contact['@type']).toBe('ContactPoint');
    expect(contact.contactType).toBe('customer service');
  });
});

describe('generateSoftwareApplicationJsonLd', () => {
  it('should generate valid SoftwareApplication schema', () => {
    const result = generateSoftwareApplicationJsonLd();

    expect(result).toHaveProperty('@context', 'https://schema.org');
    expect(result).toHaveProperty('@type', 'SoftwareApplication');
    expect(result).toHaveProperty('name', DEFAULT_SOFTWARE_APPLICATION.name);
    expect(result).toHaveProperty('description');
    expect(result).toHaveProperty('applicationCategory', 'BusinessApplication');
    expect(result).toHaveProperty('operatingSystem', 'Web');
  });

  it('should include offers when provided', () => {
    const result = generateSoftwareApplicationJsonLd() as Record<string, unknown>;

    expect(result.offers).toBeDefined();
    const offers = result.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.price).toBe('0');
    expect(offers.priceCurrency).toBe('USD');
  });

  it('should include aggregateRating when provided', () => {
    const app: SoftwareApplicationData = {
      ...DEFAULT_SOFTWARE_APPLICATION,
      aggregateRating: {
        ratingValue: 4.8,
        ratingCount: 150,
      },
    };
    const result = generateSoftwareApplicationJsonLd(app) as Record<string, unknown>;

    expect(result.aggregateRating).toBeDefined();
    const rating = result.aggregateRating as Record<string, unknown>;
    expect(rating['@type']).toBe('AggregateRating');
    expect(rating.ratingValue).toBe(4.8);
    expect(rating.ratingCount).toBe(150);
    expect(rating.bestRating).toBe(5);
    expect(rating.worstRating).toBe(1);
  });

  it('should include provider as Organization', () => {
    const result = generateSoftwareApplicationJsonLd() as Record<string, unknown>;

    expect(result.provider).toBeDefined();
    const provider = result.provider as Record<string, unknown>;
    expect(provider['@type']).toBe('Organization');
    expect(provider.name).toBe(DEFAULT_ORGANIZATION.name);
  });

  it('should include featureList when provided', () => {
    const result = generateSoftwareApplicationJsonLd() as Record<string, unknown>;

    expect(Array.isArray(result.featureList)).toBe(true);
    expect((result.featureList as string[]).length).toBeGreaterThan(0);
  });

  it('should include screenshot when provided', () => {
    const app: SoftwareApplicationData = {
      ...DEFAULT_SOFTWARE_APPLICATION,
      screenshot: 'https://example.com/screenshot.png',
    };
    const result = generateSoftwareApplicationJsonLd(app) as Record<string, unknown>;

    expect(result.screenshot).toBe('https://example.com/screenshot.png');
  });
});

describe('generateFAQPageJsonLd', () => {
  const faqItems: FAQItem[] = [
    { question: 'What is AI Perception?', answer: 'It measures how AI models see your brand.' },
    { question: 'Is it free?', answer: 'Yes, the basic analysis is free.' },
  ];

  it('should generate valid FAQPage schema', () => {
    const result = generateFAQPageJsonLd({ items: faqItems });

    expect(result).toHaveProperty('@context', 'https://schema.org');
    expect(result).toHaveProperty('@type', 'FAQPage');
    expect(result).toHaveProperty('mainEntity');
  });

  it('should include all FAQ items as Question entities', () => {
    const result = generateFAQPageJsonLd({ items: faqItems }) as Record<string, unknown>;

    const mainEntity = result.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity.length).toBe(2);

    expect(mainEntity[0]['@type']).toBe('Question');
    expect(mainEntity[0].name).toBe('What is AI Perception?');
    expect(mainEntity[0].acceptedAnswer).toBeDefined();

    const answer = mainEntity[0].acceptedAnswer as Record<string, unknown>;
    expect(answer['@type']).toBe('Answer');
    expect(answer.text).toBe('It measures how AI models see your brand.');
  });

  it('should work with CORE_FAQ_ITEMS', () => {
    const result = generateFAQPageJsonLd({ items: CORE_FAQ_ITEMS }) as Record<string, unknown>;

    const mainEntity = result.mainEntity as Array<Record<string, unknown>>;
    expect(mainEntity.length).toBe(CORE_FAQ_ITEMS.length);
  });
});

describe('generateWebPageJsonLd', () => {
  it('should generate valid WebPage schema', () => {
    const result = generateWebPageJsonLd({
      name: 'About Us',
      description: 'Learn about our company',
      url: 'https://aiperception.io/about',
    });

    expect(result).toHaveProperty('@context', 'https://schema.org');
    expect(result).toHaveProperty('@type', 'WebPage');
    expect(result).toHaveProperty('name', 'About Us');
    expect(result).toHaveProperty('description', 'Learn about our company');
    expect(result).toHaveProperty('url', 'https://aiperception.io/about');
  });

  it('should include dates when provided', () => {
    const result = generateWebPageJsonLd({
      name: 'Blog Post',
      description: 'A blog post',
      url: 'https://aiperception.io/blog/post',
      datePublished: '2024-01-15',
      dateModified: '2024-01-20',
    }) as Record<string, unknown>;

    expect(result.datePublished).toBe('2024-01-15');
    expect(result.dateModified).toBe('2024-01-20');
  });

  it('should include breadcrumb when provided', () => {
    const result = generateWebPageJsonLd({
      name: 'Product Page',
      description: 'Our main product',
      url: 'https://aiperception.io/products/main',
      breadcrumb: [
        { name: 'Home', url: 'https://aiperception.io' },
        { name: 'Products', url: 'https://aiperception.io/products' },
        { name: 'Main Product', url: 'https://aiperception.io/products/main' },
      ],
    }) as Record<string, unknown>;

    expect(result.breadcrumb).toBeDefined();
    const breadcrumb = result.breadcrumb as Record<string, unknown>;
    expect(breadcrumb['@type']).toBe('BreadcrumbList');

    const items = breadcrumb.itemListElement as Array<Record<string, unknown>>;
    expect(items.length).toBe(3);
    expect(items[0].position).toBe(1);
    expect(items[0].name).toBe('Home');
    expect(items[2].position).toBe(3);
  });
});

describe('generateWebSiteJsonLd', () => {
  it('should generate valid WebSite schema with defaults', () => {
    const result = generateWebSiteJsonLd();

    expect(result).toHaveProperty('@context', 'https://schema.org');
    expect(result).toHaveProperty('@type', 'WebSite');
    expect(result).toHaveProperty('name', 'AI Perception');
    expect(result).toHaveProperty('url', 'https://aiperception.io');
  });

  it('should include SearchAction potential action', () => {
    const result = generateWebSiteJsonLd() as Record<string, unknown>;

    expect(result.potentialAction).toBeDefined();
    const action = result.potentialAction as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');

    const target = action.target as Record<string, unknown>;
    expect(target['@type']).toBe('EntryPoint');
    expect(target.urlTemplate).toContain('{search_term_string}');
  });

  it('should accept custom options', () => {
    const result = generateWebSiteJsonLd({
      name: 'Custom Site',
      url: 'https://custom.com',
      description: 'A custom description',
    }) as Record<string, unknown>;

    expect(result.name).toBe('Custom Site');
    expect(result.url).toBe('https://custom.com');
    expect(result.description).toBe('A custom description');
  });
});

describe('CORE_FAQ_ITEMS', () => {
  it('should contain required FAQ items', () => {
    expect(CORE_FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);

    const questions = CORE_FAQ_ITEMS.map((item) => item.question.toLowerCase());

    expect(questions.some((q) => q.includes('perception score'))).toBe(true);
    expect(questions.some((q) => q.includes('geo') || q.includes('seo'))).toBe(true);
    expect(questions.some((q) => q.includes('ai model'))).toBe(true);
  });

  it('should have non-empty answers', () => {
    CORE_FAQ_ITEMS.forEach((item) => {
      expect(item.question.length).toBeGreaterThan(10);
      expect(item.answer.length).toBeGreaterThan(20);
    });
  });
});

describe('DEFAULT_ORGANIZATION', () => {
  it('should have required fields', () => {
    expect(DEFAULT_ORGANIZATION.name).toBeDefined();
    expect(DEFAULT_ORGANIZATION.url).toBeDefined();
    expect(DEFAULT_ORGANIZATION.description).toBeDefined();
  });

  it('should have valid URL', () => {
    expect(DEFAULT_ORGANIZATION.url).toMatch(/^https?:\/\/.+/);
  });
});

describe('DEFAULT_SOFTWARE_APPLICATION', () => {
  it('should have required fields', () => {
    expect(DEFAULT_SOFTWARE_APPLICATION.name).toBeDefined();
    expect(DEFAULT_SOFTWARE_APPLICATION.description).toBeDefined();
    expect(DEFAULT_SOFTWARE_APPLICATION.applicationCategory).toBe('BusinessApplication');
    expect(DEFAULT_SOFTWARE_APPLICATION.provider).toBeDefined();
  });

  it('should have free tier offer', () => {
    expect(DEFAULT_SOFTWARE_APPLICATION.offers?.price).toBe('0');
    expect(DEFAULT_SOFTWARE_APPLICATION.offers?.priceCurrency).toBe('USD');
  });

  it('should have feature list', () => {
    expect(DEFAULT_SOFTWARE_APPLICATION.featureList).toBeDefined();
    expect(DEFAULT_SOFTWARE_APPLICATION.featureList!.length).toBeGreaterThan(0);
  });
});
