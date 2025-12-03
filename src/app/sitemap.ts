/**
 * Dynamic Sitemap Generator
 *
 * Phase 4, Week 8, Day 2
 * Generates sitemap.xml with all static and dynamic pages
 */

import { MetadataRoute } from 'next';

// ================================================================
// TYPES
// ================================================================

type ChangeFrequency = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';

interface SitemapEntry {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

// ================================================================
// CONSTANTS
// ================================================================

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiperception.io';

/**
 * Industry verticals for programmatic pages
 */
const INDUSTRIES = [
  'saas',
  'ecommerce',
  'fintech',
  'healthcare',
  'education',
  'real-estate',
  'legal',
  'marketing',
  'consulting',
  'manufacturing',
  'retail',
  'hospitality',
  'insurance',
  'logistics',
  'media',
  'nonprofit',
  'automotive',
  'energy',
  'telecom',
  'cybersecurity',
];

/**
 * Major cities for location pages
 */
const CITIES = [
  'new-york',
  'los-angeles',
  'chicago',
  'houston',
  'phoenix',
  'san-francisco',
  'seattle',
  'boston',
  'miami',
  'denver',
  'austin',
  'atlanta',
  'london',
  'toronto',
  'sydney',
  'singapore',
  'berlin',
  'paris',
  'amsterdam',
  'dubai',
];

// ================================================================
// STATIC PAGES
// ================================================================

function getStaticPages(): SitemapEntry[] {
  return [
    // Core pages
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/glossary`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.6,
    },

    // Legal pages
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },

    // Auth pages
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}

// ================================================================
// PROGRAMMATIC SEO PAGES
// ================================================================

function getIndustryPages(): SitemapEntry[] {
  return INDUSTRIES.map((industry) => ({
    url: `${BASE_URL}/ai-perception/${industry}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as ChangeFrequency,
    priority: 0.8,
  }));
}

function getLocationPages(): SitemapEntry[] {
  const pages: SitemapEntry[] = [];

  for (const industry of INDUSTRIES) {
    for (const city of CITIES) {
      pages.push({
        url: `${BASE_URL}/ai-perception/${industry}/${city}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as ChangeFrequency,
        priority: 0.7,
      });
    }
  }

  return pages;
}

// ================================================================
// DYNAMIC PAGES (from database)
// ================================================================

async function getAnalysisPages(): Promise<SitemapEntry[]> {
  // In production, fetch from database
  // For now, return empty array - these will be added when analyses are public
  return [];

  // Example implementation:
  // const supabase = createClient();
  // const { data: analyses } = await supabase
  //   .from('analyses')
  //   .select('id, updated_at')
  //   .eq('public', true)
  //   .order('updated_at', { ascending: false })
  //   .limit(1000);
  //
  // return (analyses || []).map(analysis => ({
  //   url: `${BASE_URL}/results/${analysis.id}`,
  //   lastModified: analysis.updated_at,
  //   changeFrequency: 'weekly',
  //   priority: 0.6,
  // }));
}

async function getHelpArticles(): Promise<SitemapEntry[]> {
  // Help article slugs - in production, fetch from CMS or database
  const articles = [
    'getting-started',
    'understanding-scores',
    'improving-ai-perception',
    'competitor-analysis',
    'monitoring-setup',
    'api-integration',
    'billing-faq',
    'best-practices',
    'case-studies',
    'troubleshooting',
  ];

  return articles.map((slug) => ({
    url: `${BASE_URL}/help/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as ChangeFrequency,
    priority: 0.6,
  }));
}

// ================================================================
// MAIN SITEMAP FUNCTION
// ================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Collect all pages
  const [analysisPages, helpArticles] = await Promise.all([
    getAnalysisPages(),
    getHelpArticles(),
  ]);

  const allPages: SitemapEntry[] = [
    ...getStaticPages(),
    ...getIndustryPages(),
    ...getLocationPages(),
    ...analysisPages,
    ...helpArticles,
  ];

  // Convert to Next.js sitemap format
  return allPages.map((page) => ({
    url: page.url,
    lastModified: page.lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}

// ================================================================
// UTILITIES
// ================================================================

/**
 * Get total number of sitemap entries
 */
export function getSitemapStats(): {
  static: number;
  industries: number;
  locations: number;
  total: number;
} {
  return {
    static: getStaticPages().length,
    industries: INDUSTRIES.length,
    locations: INDUSTRIES.length * CITIES.length,
    total: getStaticPages().length + INDUSTRIES.length + INDUSTRIES.length * CITIES.length,
  };
}

/**
 * Get all industries
 */
export function getIndustries(): string[] {
  return INDUSTRIES;
}

/**
 * Get all cities
 */
export function getCities(): string[] {
  return CITIES;
}
