/**
 * Robots.txt Generator
 *
 * Phase 4, Week 8, Day 2
 * Dynamic robots.txt for SEO
 */

import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://aiperception.io';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
          '/billing/',
          '/settings/',
          '/private/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/ai-perception/',
          '/faq',
          '/glossary',
          '/help/',
          '/pricing',
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/dashboard/',
        ],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: [
          '/',
          '/ai-perception/',
          '/faq',
          '/glossary',
          '/help/',
        ],
      },
      {
        userAgent: 'Claude-Web',
        allow: [
          '/',
          '/ai-perception/',
          '/faq',
          '/glossary',
          '/help/',
        ],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
        ],
      },
      {
        userAgent: 'PerplexityBot',
        allow: [
          '/',
          '/ai-perception/',
          '/faq',
          '/glossary',
          '/help/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
