/**
 * URL Analysis Service
 *
 * Phase 1, Week 1, Day 2
 * Based on EXECUTIVE-ROADMAP-BCG.md Section 2.110 (Data Engineering)
 *
 * Extracts metadata from URLs including:
 * - Brand/company name
 * - Page title and description
 * - Open Graph data
 * - Schema.org structured data
 * - Social profiles
 * - Favicon and logo
 */

import { z } from 'zod';
import { Result, Ok, Err } from '../result';
import { ValidationError, ExternalServiceError } from '../errors';
import { validateUrl, type URLValidationResult } from '../security/url-validator';
import { apiLogger } from '../logger';

// ================================================================
// TYPES
// ================================================================

export interface SocialProfiles {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
}

export interface SchemaOrgData {
  types: string[];
  name?: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  foundingDate?: string;
  address?: {
    country?: string;
    region?: string;
    locality?: string;
  };
}

export interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  siteName?: string;
  type?: string;
  locale?: string;
}

export interface TwitterCardData {
  card?: string;
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface ExtractedMetadata {
  // Basic info
  url: string;
  canonicalUrl?: string;
  title?: string;
  description?: string;
  favicon?: string;
  logo?: string;

  // Brand detection
  brandName?: string;
  tagline?: string;

  // Structured data
  openGraph: OpenGraphData;
  twitterCard: TwitterCardData;
  schemaOrg: SchemaOrgData;

  // Social profiles
  socialProfiles: SocialProfiles;

  // Technical info
  language?: string;
  charset?: string;
  generator?: string;
  robotsDirectives?: string[];

  // Performance hints
  fetchDurationMs: number;
  contentLength?: number;
  contentType?: string;
}

export interface UrlAnalysisResult {
  success: boolean;
  metadata: ExtractedMetadata;
  validation: URLValidationResult;
  warnings: string[];
}

// ================================================================
// CONSTANTS
// ================================================================

const USER_AGENT = 'AIPerceptionBot/1.0 (+https://aiperception.io/bot)';
const FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 5 * 1024 * 1024; // 5MB max

// Common brand name patterns to extract from domain
const BRAND_SUFFIXES_TO_REMOVE = [
  'inc', 'llc', 'ltd', 'co', 'corp', 'company', 'group',
  'io', 'ai', 'app', 'hq', 'team', 'labs', 'studio',
];

// Social media domain patterns
const SOCIAL_PATTERNS: Record<keyof SocialProfiles, RegExp> = {
  linkedin: /linkedin\.com\/(company|in)\/([^\/\?]+)/i,
  twitter: /(?:twitter|x)\.com\/([^\/\?]+)/i,
  facebook: /facebook\.com\/([^\/\?]+)/i,
  instagram: /instagram\.com\/([^\/\?]+)/i,
  youtube: /youtube\.com\/(?:c\/|channel\/|user\/|@)?([^\/\?]+)/i,
  github: /github\.com\/([^\/\?]+)/i,
};

// ================================================================
// HTML PARSING HELPERS
// ================================================================

/**
 * Extract content from meta tag
 */
function extractMetaContent(html: string, nameOrProperty: string): string | undefined {
  // Try name attribute
  const nameRegex = new RegExp(
    `<meta[^>]+name=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const nameMatch = html.match(nameRegex);
  if (nameMatch) return nameMatch[1];

  // Try content before name
  const reversedRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${nameOrProperty}["']`,
    'i'
  );
  const reversedMatch = html.match(reversedRegex);
  if (reversedMatch) return reversedMatch[1];

  // Try property attribute (for OG)
  const propertyRegex = new RegExp(
    `<meta[^>]+property=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`,
    'i'
  );
  const propertyMatch = html.match(propertyRegex);
  if (propertyMatch) return propertyMatch[1];

  // Try reversed property
  const reversedPropertyRegex = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${nameOrProperty}["']`,
    'i'
  );
  const reversedPropertyMatch = html.match(reversedPropertyRegex);
  if (reversedPropertyMatch) return reversedPropertyMatch[1];

  return undefined;
}

/**
 * Extract page title
 */
function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? decodeHtmlEntities(match[1].trim()) : undefined;
}

/**
 * Extract canonical URL
 */
function extractCanonical(html: string): string | undefined {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  if (match) return match[1];

  const reversed = html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i);
  return reversed ? reversed[1] : undefined;
}

/**
 * Extract favicon URL
 */
function extractFavicon(html: string, baseUrl: string): string | undefined {
  // Try various favicon patterns
  const patterns = [
    /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i,
    /<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return resolveUrl(match[1], baseUrl);
    }
  }

  // Default to /favicon.ico
  try {
    const url = new URL(baseUrl);
    return `${url.origin}/favicon.ico`;
  } catch {
    return undefined;
  }
}

/**
 * Extract language
 */
function extractLanguage(html: string): string | undefined {
  const match = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  return match ? match[1].split('-')[0].toLowerCase() : undefined;
}

/**
 * Extract charset
 */
function extractCharset(html: string): string | undefined {
  const match = html.match(/<meta[^>]+charset=["']?([^"'\s>]+)/i);
  if (match) return match[1].toUpperCase();

  const contentType = html.match(/<meta[^>]+content=["'][^"']*charset=([^"'\s;]+)/i);
  return contentType ? contentType[1].toUpperCase() : undefined;
}

/**
 * Extract generator (CMS/framework)
 */
function extractGenerator(html: string): string | undefined {
  return extractMetaContent(html, 'generator');
}

/**
 * Extract robots directives
 */
function extractRobots(html: string): string[] {
  const robots = extractMetaContent(html, 'robots');
  if (!robots) return [];
  return robots.split(',').map(d => d.trim().toLowerCase());
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Resolve relative URL to absolute
 */
function resolveUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

// ================================================================
// STRUCTURED DATA EXTRACTION
// ================================================================

/**
 * Extract Open Graph data
 */
function extractOpenGraph(html: string): OpenGraphData {
  return {
    title: extractMetaContent(html, 'og:title'),
    description: extractMetaContent(html, 'og:description'),
    image: extractMetaContent(html, 'og:image'),
    url: extractMetaContent(html, 'og:url'),
    siteName: extractMetaContent(html, 'og:site_name'),
    type: extractMetaContent(html, 'og:type'),
    locale: extractMetaContent(html, 'og:locale'),
  };
}

/**
 * Extract Twitter Card data
 */
function extractTwitterCard(html: string): TwitterCardData {
  return {
    card: extractMetaContent(html, 'twitter:card'),
    site: extractMetaContent(html, 'twitter:site'),
    creator: extractMetaContent(html, 'twitter:creator'),
    title: extractMetaContent(html, 'twitter:title'),
    description: extractMetaContent(html, 'twitter:description'),
    image: extractMetaContent(html, 'twitter:image'),
  };
}

/**
 * Extract Schema.org JSON-LD data
 */
function extractSchemaOrg(html: string): SchemaOrgData {
  const result: SchemaOrgData = {
    types: [],
    sameAs: [],
  };

  // Find all JSON-LD scripts
  const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Extract @type
        if (item['@type']) {
          const types = Array.isArray(item['@type']) ? item['@type'] : [item['@type']];
          result.types.push(...types.filter((t: string) => !result.types.includes(t)));
        }

        // Extract common properties
        if (item.name && !result.name) result.name = item.name;
        if (item.description && !result.description) result.description = item.description;
        if (item.url && !result.url) result.url = item.url;
        if (item.logo) {
          result.logo = typeof item.logo === 'string' ? item.logo : item.logo.url;
        }
        if (item.foundingDate && !result.foundingDate) {
          result.foundingDate = item.foundingDate;
        }

        // Extract sameAs (social links)
        if (item.sameAs) {
          const sameAs = Array.isArray(item.sameAs) ? item.sameAs : [item.sameAs];
          for (const url of sameAs) {
            if (typeof url === 'string' && !result.sameAs!.includes(url)) {
              result.sameAs!.push(url);
            }
          }
        }

        // Extract address
        if (item.address && !result.address) {
          const addr = typeof item.address === 'string' ? {} : item.address;
          result.address = {
            country: addr.addressCountry,
            region: addr.addressRegion,
            locality: addr.addressLocality,
          };
        }
      }
    } catch {
      // Invalid JSON-LD, continue
    }
  }

  return result;
}

// ================================================================
// SOCIAL PROFILE EXTRACTION
// ================================================================

/**
 * Extract social profiles from HTML
 */
function extractSocialProfiles(html: string, schemaOrg: SchemaOrgData): SocialProfiles {
  const profiles: SocialProfiles = {};

  // First, try Schema.org sameAs
  for (const url of schemaOrg.sameAs || []) {
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (pattern.test(url)) {
        profiles[platform as keyof SocialProfiles] = url;
      }
    }
  }

  // Then, scan HTML for social links
  const linkRegex = /href=["']([^"']+)["']/gi;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1];
    for (const [platform, pattern] of Object.entries(SOCIAL_PATTERNS)) {
      if (!profiles[platform as keyof SocialProfiles] && pattern.test(url)) {
        profiles[platform as keyof SocialProfiles] = url;
      }
    }
  }

  return profiles;
}

// ================================================================
// BRAND DETECTION
// ================================================================

/**
 * Extract brand name from various sources
 */
function extractBrandName(
  html: string,
  url: string,
  openGraph: OpenGraphData,
  schemaOrg: SchemaOrgData
): string | undefined {
  // Priority 1: Schema.org Organization/Brand name
  if (schemaOrg.name) {
    return cleanBrandName(schemaOrg.name);
  }

  // Priority 2: OG site_name
  if (openGraph.siteName) {
    return cleanBrandName(openGraph.siteName);
  }

  // Priority 3: Title before separator
  const title = extractTitle(html);
  if (title) {
    const separators = [' | ', ' - ', ' — ', ' · ', ' : '];
    for (const sep of separators) {
      if (title.includes(sep)) {
        const parts = title.split(sep);
        // Usually brand is first or last
        const first = parts[0].trim();
        const last = parts[parts.length - 1].trim();
        // Prefer shorter one as brand
        return first.length <= last.length ? cleanBrandName(first) : cleanBrandName(last);
      }
    }
  }

  // Priority 4: Domain name
  try {
    const parsed = new URL(url);
    let domain = parsed.hostname.replace(/^www\./, '');
    // Remove TLD
    domain = domain.split('.')[0];
    return cleanBrandName(domain);
  } catch {
    return undefined;
  }
}

/**
 * Clean up brand name
 */
function cleanBrandName(name: string): string {
  let cleaned = name.trim();

  // Remove common suffixes
  const lowerName = cleaned.toLowerCase();
  for (const suffix of BRAND_SUFFIXES_TO_REMOVE) {
    const pattern = new RegExp(`\\s*[,.]?\\s*${suffix}\\.?$`, 'i');
    cleaned = cleaned.replace(pattern, '');
  }

  // Capitalize first letter of each word
  cleaned = cleaned
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return cleaned.trim();
}

/**
 * Extract tagline/slogan
 */
function extractTagline(html: string, description?: string): string | undefined {
  // Try meta description if short enough
  if (description && description.length < 100 && !description.includes('.')) {
    return description;
  }

  // Try application-name
  const appName = extractMetaContent(html, 'application-name');
  if (appName && appName.length < 100) {
    return appName;
  }

  return undefined;
}

// ================================================================
// MAIN ANALYSIS FUNCTION
// ================================================================

/**
 * Analyze a URL and extract metadata
 */
export async function analyzeUrl(url: string): Promise<Result<UrlAnalysisResult, Error>> {
  const timer = apiLogger.time('analyzeUrl');
  const warnings: string[] = [];

  // Step 1: Validate URL
  const validation = validateUrl(url);
  if (!validation.isValid) {
    timer.failure(new ValidationError(validation.error || 'Invalid URL'));
    return Err(new ValidationError(validation.error || 'Invalid URL'));
  }

  const normalizedUrl = validation.normalizedUrl!;

  // Step 2: Fetch the page
  const fetchStart = Date.now();
  let html: string;
  let contentType: string | undefined;
  let contentLength: number | undefined;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = new ExternalServiceError(
        'url-fetch',
        `HTTP ${response.status}: ${response.statusText}`,
        response.status >= 500
      );
      timer.failure(error);
      return Err(error);
    }

    contentType = response.headers.get('content-type') || undefined;
    const lengthHeader = response.headers.get('content-length');
    contentLength = lengthHeader ? parseInt(lengthHeader, 10) : undefined;

    // Check if HTML
    if (contentType && !contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      warnings.push(`Content-Type is ${contentType}, expected HTML`);
    }

    // Check content length
    if (contentLength && contentLength > MAX_CONTENT_LENGTH) {
      const error = new ValidationError(`Content too large: ${contentLength} bytes`);
      timer.failure(error);
      return Err(error);
    }

    html = await response.text();

    // Double-check actual length
    if (html.length > MAX_CONTENT_LENGTH) {
      const error = new ValidationError(`Content too large: ${html.length} bytes`);
      timer.failure(error);
      return Err(error);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      const err = new ExternalServiceError('url-fetch', 'Request timeout', true);
      timer.failure(err);
      return Err(err);
    }
    const err = new ExternalServiceError(
      'url-fetch',
      error instanceof Error ? error.message : 'Failed to fetch URL',
      true
    );
    timer.failure(err);
    return Err(err);
  }

  const fetchDurationMs = Date.now() - fetchStart;

  // Step 3: Extract metadata
  const openGraph = extractOpenGraph(html);
  const twitterCard = extractTwitterCard(html);
  const schemaOrg = extractSchemaOrg(html);
  const socialProfiles = extractSocialProfiles(html, schemaOrg);

  const title = extractTitle(html);
  const description = extractMetaContent(html, 'description');
  const brandName = extractBrandName(html, normalizedUrl, openGraph, schemaOrg);
  const tagline = extractTagline(html, description);

  const metadata: ExtractedMetadata = {
    url: normalizedUrl,
    canonicalUrl: extractCanonical(html),
    title,
    description,
    favicon: extractFavicon(html, normalizedUrl),
    logo: schemaOrg.logo || openGraph.image,

    brandName,
    tagline,

    openGraph,
    twitterCard,
    schemaOrg,
    socialProfiles,

    language: extractLanguage(html),
    charset: extractCharset(html),
    generator: extractGenerator(html),
    robotsDirectives: extractRobots(html),

    fetchDurationMs,
    contentLength: contentLength || html.length,
    contentType,
  };

  // Add warnings for missing important data
  if (!brandName) warnings.push('Could not detect brand name');
  if (!title) warnings.push('Page has no title');
  if (!description) warnings.push('Page has no meta description');
  if (schemaOrg.types.length === 0) warnings.push('No Schema.org structured data found');
  if (!openGraph.title && !openGraph.description) warnings.push('No Open Graph metadata found');
  if (Object.keys(socialProfiles).length === 0) warnings.push('No social profiles detected');

  timer.success({ url: normalizedUrl, brandName, warnings: warnings.length });

  return Ok({
    success: true,
    metadata,
    validation,
    warnings,
  });
}

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

export const UrlAnalysisRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
});

export type UrlAnalysisRequest = z.infer<typeof UrlAnalysisRequestSchema>;

// ================================================================
// EXPORTS
// ================================================================

export default {
  analyzeUrl,
  UrlAnalysisRequestSchema,
};
