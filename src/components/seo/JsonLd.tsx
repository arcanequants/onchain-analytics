/**
 * JSON-LD Structured Data Components
 *
 * Phase 1, Week 1, Day 1
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.27
 *
 * Implements Schema.org structured data for:
 * - SoftwareApplication (main site)
 * - Organization (provider/company)
 * - FAQPage (FAQ sections)
 * - WebApplication (dashboard)
 */

import React from 'react';

// ================================================================
// TYPES
// ================================================================

export interface OrganizationData {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  foundingDate?: string;
  founders?: Array<{
    name: string;
    url?: string;
  }>;
  contactPoint?: {
    email?: string;
    telephone?: string;
    contactType?: string;
  };
}

export interface SoftwareApplicationData {
  name: string;
  description: string;
  applicationCategory: 'BusinessApplication' | 'DeveloperApplication' | 'UtilitiesApplication';
  operatingSystem?: string;
  offers?: {
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
    bestRating?: number;
    worstRating?: number;
  };
  provider: OrganizationData;
  screenshot?: string;
  featureList?: string[];
  releaseNotes?: string;
  softwareVersion?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQPageData {
  items: FAQItem[];
}

export interface WebPageData {
  name: string;
  description: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  breadcrumb?: Array<{
    name: string;
    url: string;
  }>;
}

// ================================================================
// CONSTANTS
// ================================================================

export const DEFAULT_ORGANIZATION: OrganizationData = {
  name: 'AI Perception Engineering Agency',
  url: 'https://aiperception.io',
  logo: 'https://aiperception.io/logo.png',
  description:
    'We help brands understand and improve how AI models like ChatGPT, Claude, and Gemini perceive and recommend them.',
  sameAs: [
    'https://twitter.com/aiperception',
    'https://linkedin.com/company/aiperception',
    'https://github.com/aiperception',
  ],
  foundingDate: '2024',
  contactPoint: {
    email: 'hello@aiperception.io',
    contactType: 'customer service',
  },
};

export const DEFAULT_SOFTWARE_APPLICATION: SoftwareApplicationData = {
  name: 'AI Perception',
  description:
    'Discover how AI models like ChatGPT, Claude, and Gemini perceive your brand. Get actionable recommendations to improve your AI visibility and get recommended more often.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    price: '0',
    priceCurrency: 'USD',
  },
  provider: DEFAULT_ORGANIZATION,
  featureList: [
    'AI Perception Score (0-100)',
    'Multi-provider analysis (OpenAI, Anthropic, Google, Perplexity)',
    'Competitor comparison',
    'Actionable recommendations',
    'Industry benchmarking',
    'Historical tracking',
  ],
};

// ================================================================
// JSON-LD GENERATORS
// ================================================================

/**
 * Generate Organization JSON-LD
 */
export function generateOrganizationJsonLd(org: OrganizationData = DEFAULT_ORGANIZATION): object {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: org.name,
    url: org.url,
  };

  if (org.logo) {
    jsonLd.logo = org.logo;
  }

  if (org.description) {
    jsonLd.description = org.description;
  }

  if (org.sameAs && org.sameAs.length > 0) {
    jsonLd.sameAs = org.sameAs;
  }

  if (org.foundingDate) {
    jsonLd.foundingDate = org.foundingDate;
  }

  if (org.founders && org.founders.length > 0) {
    jsonLd.founder = org.founders.map((founder) => ({
      '@type': 'Person',
      name: founder.name,
      ...(founder.url && { url: founder.url }),
    }));
  }

  if (org.contactPoint) {
    jsonLd.contactPoint = {
      '@type': 'ContactPoint',
      contactType: org.contactPoint.contactType || 'customer service',
      ...(org.contactPoint.email && { email: org.contactPoint.email }),
      ...(org.contactPoint.telephone && { telephone: org.contactPoint.telephone }),
    };
  }

  return jsonLd;
}

/**
 * Generate SoftwareApplication JSON-LD
 */
export function generateSoftwareApplicationJsonLd(
  app: SoftwareApplicationData = DEFAULT_SOFTWARE_APPLICATION
): object {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: app.name,
    description: app.description,
    applicationCategory: app.applicationCategory,
    operatingSystem: app.operatingSystem || 'Web',
  };

  if (app.offers) {
    jsonLd.offers = {
      '@type': 'Offer',
      price: app.offers.price,
      priceCurrency: app.offers.priceCurrency,
    };
  }

  if (app.aggregateRating) {
    jsonLd.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: app.aggregateRating.ratingValue,
      ratingCount: app.aggregateRating.ratingCount,
      bestRating: app.aggregateRating.bestRating || 5,
      worstRating: app.aggregateRating.worstRating || 1,
    };
  }

  jsonLd.provider = generateOrganizationJsonLd(app.provider);

  if (app.screenshot) {
    jsonLd.screenshot = app.screenshot;
  }

  if (app.featureList && app.featureList.length > 0) {
    jsonLd.featureList = app.featureList;
  }

  if (app.releaseNotes) {
    jsonLd.releaseNotes = app.releaseNotes;
  }

  if (app.softwareVersion) {
    jsonLd.softwareVersion = app.softwareVersion;
  }

  return jsonLd;
}

/**
 * Generate FAQPage JSON-LD
 */
export function generateFAQPageJsonLd(faq: FAQPageData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

/**
 * Generate WebPage JSON-LD
 */
export function generateWebPageJsonLd(page: WebPageData): object {
  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: page.name,
    description: page.description,
    url: page.url,
  };

  if (page.datePublished) {
    jsonLd.datePublished = page.datePublished;
  }

  if (page.dateModified) {
    jsonLd.dateModified = page.dateModified;
  }

  if (page.breadcrumb && page.breadcrumb.length > 0) {
    jsonLd.breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: page.breadcrumb.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  return jsonLd;
}

/**
 * Generate WebSite JSON-LD
 */
export function generateWebSiteJsonLd(options?: {
  name?: string;
  url?: string;
  description?: string;
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options?.name || 'AI Perception',
    url: options?.url || 'https://aiperception.io',
    description:
      options?.description ||
      'Discover how AI models perceive your brand. Free AI visibility analysis.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://aiperception.io/analyze?url={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ================================================================
// REACT COMPONENTS
// ================================================================

interface JsonLdScriptProps {
  data: object;
}

/**
 * Base component for rendering JSON-LD script tag
 */
export function JsonLdScript({ data }: JsonLdScriptProps): React.ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data, null, 0),
      }}
    />
  );
}

/**
 * Organization JSON-LD Component
 */
export function OrganizationJsonLd({
  organization = DEFAULT_ORGANIZATION,
}: {
  organization?: OrganizationData;
}): React.ReactElement {
  return <JsonLdScript data={generateOrganizationJsonLd(organization)} />;
}

/**
 * SoftwareApplication JSON-LD Component
 */
export function SoftwareApplicationJsonLd({
  application = DEFAULT_SOFTWARE_APPLICATION,
}: {
  application?: SoftwareApplicationData;
}): React.ReactElement {
  return <JsonLdScript data={generateSoftwareApplicationJsonLd(application)} />;
}

/**
 * FAQPage JSON-LD Component
 */
export function FAQPageJsonLd({ items }: { items: FAQItem[] }): React.ReactElement {
  return <JsonLdScript data={generateFAQPageJsonLd({ items })} />;
}

/**
 * WebPage JSON-LD Component
 */
export function WebPageJsonLd({ page }: { page: WebPageData }): React.ReactElement {
  return <JsonLdScript data={generateWebPageJsonLd(page)} />;
}

/**
 * WebSite JSON-LD Component
 */
export function WebSiteJsonLd(props?: {
  name?: string;
  url?: string;
  description?: string;
}): React.ReactElement {
  return <JsonLdScript data={generateWebSiteJsonLd(props)} />;
}

/**
 * Combined JSON-LD for homepage - includes all primary schemas
 */
export function HomePageJsonLd(): React.ReactElement {
  return (
    <>
      <WebSiteJsonLd />
      <OrganizationJsonLd />
      <SoftwareApplicationJsonLd />
    </>
  );
}

// ================================================================
// FAQ DATA
// ================================================================

/**
 * Core FAQ items for the main FAQ page
 */
export const CORE_FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What is an AI Perception Score?',
    answer:
      'The AI Perception Score (0-100) measures how likely AI models like ChatGPT, Claude, and Gemini are to recommend your brand when users ask for recommendations in your industry. A higher score means better visibility in AI-generated responses.',
  },
  {
    question: 'How does GEO differ from SEO?',
    answer:
      'SEO (Search Engine Optimization) focuses on ranking in traditional search engines like Google. GEO (Generative Engine Optimization) focuses on being recommended by AI assistants and chatbots. While SEO targets keyword rankings, GEO targets being mentioned and recommended in AI-generated responses.',
  },
  {
    question: 'Which AI models do you analyze?',
    answer:
      "We analyze responses from four major AI models: OpenAI's ChatGPT (GPT-4), Anthropic's Claude, Google's Gemini, and Perplexity AI. These represent the most widely used AI assistants that influence purchasing decisions.",
  },
  {
    question: 'Is the free analysis really free?',
    answer:
      'Yes, the basic AI Perception Score analysis is completely free. You can analyze any website URL and get your score, industry benchmarks, and top recommendations. Premium features like competitor tracking, historical analysis, and detailed recommendations require a subscription.',
  },
  {
    question: 'How can I improve my AI Perception Score?',
    answer:
      'Key strategies include: adding Schema.org structured data to your website, getting mentioned in authoritative sources that AI trains on, creating FAQ content that AI can cite, building a presence in knowledge graphs like Wikidata, and ensuring your brand information is consistent across the web.',
  },
  {
    question: 'How often should I check my AI Perception Score?',
    answer:
      'AI models update regularly, and your competitors are constantly working to improve their visibility. We recommend checking your score weekly for active optimization campaigns, or monthly for general monitoring. Premium users get automated weekly reports and alerts for significant changes.',
  },
];

// ================================================================
// EXPORTS
// ================================================================

export default {
  // Generators
  generateOrganizationJsonLd,
  generateSoftwareApplicationJsonLd,
  generateFAQPageJsonLd,
  generateWebPageJsonLd,
  generateWebSiteJsonLd,

  // Components
  JsonLdScript,
  OrganizationJsonLd,
  SoftwareApplicationJsonLd,
  FAQPageJsonLd,
  WebPageJsonLd,
  WebSiteJsonLd,
  HomePageJsonLd,

  // Data
  DEFAULT_ORGANIZATION,
  DEFAULT_SOFTWARE_APPLICATION,
  CORE_FAQ_ITEMS,
};
