/**
 * CDN Integration Types
 *
 * Type definitions for CDN and static asset optimization
 *
 * Phase 3, Week 9, Day 1
 */

// ================================================================
// CDN CONFIGURATION
// ================================================================

export type CDNProvider = 'cloudflare' | 'vercel' | 'fastly' | 'akamai' | 'aws' | 'custom';

export interface CDNConfig {
  /** CDN provider */
  provider: CDNProvider;
  /** Base URL for CDN assets */
  baseUrl: string;
  /** Enable CDN */
  enabled: boolean;
  /** Default cache TTL in seconds */
  defaultTtl: number;
  /** Custom domain for CDN */
  customDomain?: string;
  /** API key/token for CDN management */
  apiKey?: string;
  /** Zone/Distribution ID */
  zoneId?: string;
}

export const DEFAULT_CDN_CONFIG: CDNConfig = {
  provider: 'vercel',
  baseUrl: '',
  enabled: true,
  defaultTtl: 31536000, // 1 year
};

// ================================================================
// CACHE CONTROL
// ================================================================

export type CachePolicy =
  | 'no-cache'
  | 'no-store'
  | 'public'
  | 'private'
  | 'immutable';

export interface CacheControl {
  /** Cache policy */
  policy: CachePolicy;
  /** Max age in seconds */
  maxAge: number;
  /** Stale while revalidate in seconds */
  staleWhileRevalidate?: number;
  /** Stale if error in seconds */
  staleIfError?: number;
  /** Must revalidate */
  mustRevalidate?: boolean;
  /** Proxy revalidate */
  proxyRevalidate?: boolean;
}

export interface CachePreset {
  name: string;
  description: string;
  control: CacheControl;
}

/**
 * Predefined cache presets for common scenarios
 */
export const CACHE_PRESETS: Record<string, CachePreset> = {
  // No caching
  noCache: {
    name: 'No Cache',
    description: 'Disable all caching',
    control: {
      policy: 'no-store',
      maxAge: 0,
    },
  },

  // API responses
  api: {
    name: 'API',
    description: 'API responses with short cache',
    control: {
      policy: 'private',
      maxAge: 0,
      staleWhileRevalidate: 60,
      mustRevalidate: true,
    },
  },

  // Static pages
  staticPage: {
    name: 'Static Page',
    description: 'Static pages with revalidation',
    control: {
      policy: 'public',
      maxAge: 3600, // 1 hour
      staleWhileRevalidate: 86400, // 1 day
    },
  },

  // Dynamic pages
  dynamicPage: {
    name: 'Dynamic Page',
    description: 'Dynamic pages with short cache',
    control: {
      policy: 'public',
      maxAge: 60, // 1 minute
      staleWhileRevalidate: 3600, // 1 hour
    },
  },

  // Images and media
  media: {
    name: 'Media',
    description: 'Images and media files',
    control: {
      policy: 'public',
      maxAge: 31536000, // 1 year
    },
  },

  // Immutable assets (hashed)
  immutable: {
    name: 'Immutable',
    description: 'Immutable assets with content hash',
    control: {
      policy: 'immutable',
      maxAge: 31536000, // 1 year
    },
  },

  // Fonts
  fonts: {
    name: 'Fonts',
    description: 'Web fonts',
    control: {
      policy: 'public',
      maxAge: 31536000, // 1 year
    },
  },

  // Scripts and styles
  assets: {
    name: 'Assets',
    description: 'JS and CSS files',
    control: {
      policy: 'public',
      maxAge: 604800, // 1 week
      staleWhileRevalidate: 86400, // 1 day
    },
  },
};

// ================================================================
// ASSET TYPES
// ================================================================

export type AssetType =
  | 'image'
  | 'script'
  | 'style'
  | 'font'
  | 'video'
  | 'audio'
  | 'document'
  | 'data'
  | 'other';

export interface AssetConfig {
  /** Asset type */
  type: AssetType;
  /** File extensions */
  extensions: string[];
  /** MIME types */
  mimeTypes: string[];
  /** Cache control */
  cache: CacheControl;
  /** Enable compression */
  compress: boolean;
  /** Enable optimization */
  optimize: boolean;
}

/**
 * Default asset configurations
 */
export const ASSET_CONFIGS: Record<AssetType, AssetConfig> = {
  image: {
    type: 'image',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg', '.ico'],
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'],
    cache: CACHE_PRESETS.media.control,
    compress: true,
    optimize: true,
  },
  script: {
    type: 'script',
    extensions: ['.js', '.mjs'],
    mimeTypes: ['application/javascript', 'text/javascript'],
    cache: CACHE_PRESETS.assets.control,
    compress: true,
    optimize: true,
  },
  style: {
    type: 'style',
    extensions: ['.css'],
    mimeTypes: ['text/css'],
    cache: CACHE_PRESETS.assets.control,
    compress: true,
    optimize: true,
  },
  font: {
    type: 'font',
    extensions: ['.woff', '.woff2', '.ttf', '.otf', '.eot'],
    mimeTypes: ['font/woff', 'font/woff2', 'font/ttf', 'font/otf'],
    cache: CACHE_PRESETS.fonts.control,
    compress: false, // Already compressed
    optimize: false,
  },
  video: {
    type: 'video',
    extensions: ['.mp4', '.webm', '.ogg', '.mov'],
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    cache: CACHE_PRESETS.media.control,
    compress: false,
    optimize: false,
  },
  audio: {
    type: 'audio',
    extensions: ['.mp3', '.wav', '.ogg', '.aac'],
    mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/aac'],
    cache: CACHE_PRESETS.media.control,
    compress: false,
    optimize: false,
  },
  document: {
    type: 'document',
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx'],
    mimeTypes: ['application/pdf', 'application/msword'],
    cache: CACHE_PRESETS.staticPage.control,
    compress: true,
    optimize: false,
  },
  data: {
    type: 'data',
    extensions: ['.json', '.xml', '.csv'],
    mimeTypes: ['application/json', 'application/xml', 'text/csv'],
    cache: CACHE_PRESETS.api.control,
    compress: true,
    optimize: false,
  },
  other: {
    type: 'other',
    extensions: [],
    mimeTypes: [],
    cache: CACHE_PRESETS.staticPage.control,
    compress: true,
    optimize: false,
  },
};

// ================================================================
// IMAGE OPTIMIZATION
// ================================================================

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png' | 'original';

export interface ImageOptimizationConfig {
  /** Enable image optimization */
  enabled: boolean;
  /** Default format */
  defaultFormat: ImageFormat;
  /** Quality (1-100) */
  quality: number;
  /** Max width */
  maxWidth: number;
  /** Max height */
  maxHeight: number;
  /** Generate responsive sizes */
  responsiveSizes: number[];
  /** Enable lazy loading */
  lazyLoad: boolean;
  /** Enable blur placeholder */
  blurPlaceholder: boolean;
}

export const DEFAULT_IMAGE_OPTIMIZATION: ImageOptimizationConfig = {
  enabled: true,
  defaultFormat: 'webp',
  quality: 80,
  maxWidth: 1920,
  maxHeight: 1080,
  responsiveSizes: [320, 640, 768, 1024, 1280, 1536, 1920],
  lazyLoad: true,
  blurPlaceholder: true,
};

// ================================================================
// CDN PURGE
// ================================================================

export type PurgeType = 'all' | 'url' | 'tag' | 'prefix';

export interface PurgeRequest {
  type: PurgeType;
  targets: string[];
}

export interface PurgeResult {
  success: boolean;
  purgedCount: number;
  targets: string[];
  timestamp: Date;
  error?: string;
}

// ================================================================
// SECURITY HEADERS
// ================================================================

export interface SecurityHeaders {
  /** Content Security Policy */
  contentSecurityPolicy?: string;
  /** X-Frame-Options */
  xFrameOptions?: 'DENY' | 'SAMEORIGIN';
  /** X-Content-Type-Options */
  xContentTypeOptions?: 'nosniff';
  /** Referrer-Policy */
  referrerPolicy?: string;
  /** Permissions-Policy */
  permissionsPolicy?: string;
  /** Strict-Transport-Security */
  strictTransportSecurity?: string;
}

export const DEFAULT_SECURITY_HEADERS: SecurityHeaders = {
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  strictTransportSecurity: 'max-age=31536000; includeSubDomains',
};

// ================================================================
// EXPORTS
// ================================================================

export default {
  DEFAULT_CDN_CONFIG,
  CACHE_PRESETS,
  ASSET_CONFIGS,
  DEFAULT_IMAGE_OPTIMIZATION,
  DEFAULT_SECURITY_HEADERS,
};
