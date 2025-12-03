# CDN Cache Configuration Guide

## Overview

This guide documents CDN caching strategies for AI Perception using Vercel Edge Network to achieve >80% cache hit rate on static content.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Request                                 │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Vercel Edge Network                              │
│                     (300+ PoPs Globally)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐            │
│  │ Edge Cache   │   │ Edge Cache   │   │ Edge Cache   │            │
│  │   (SFO)      │   │   (NYC)      │   │   (LHR)      │            │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘            │
│         │                  │                  │                     │
│         └──────────────────┼──────────────────┘                     │
│                            │                                        │
│                            ▼                                        │
│                  ┌──────────────────┐                               │
│                  │  Origin Server   │                               │
│                  │  (Vercel Lambda) │                               │
│                  └──────────────────┘                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Cache Headers Strategy

### 1. Static Assets (Build-time)

Files in `/public` and Next.js build outputs:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        // Static assets with hash in filename
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public static files
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Fonts
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 2. API Responses

```typescript
// src/lib/cache/headers.ts

export const CACHE_STRATEGIES = {
  // No caching - dynamic data
  NONE: 'private, no-cache, no-store, must-revalidate',

  // Short cache - frequently updated
  SHORT: 'public, max-age=60, stale-while-revalidate=300',

  // Medium cache - moderate updates
  MEDIUM: 'public, max-age=3600, stale-while-revalidate=86400',

  // Long cache - rarely changes
  LONG: 'public, max-age=86400, stale-while-revalidate=604800',

  // Immutable - never changes
  IMMUTABLE: 'public, max-age=31536000, immutable',
};

export function setCacheHeaders(
  response: Response,
  strategy: keyof typeof CACHE_STRATEGIES
): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', CACHE_STRATEGIES[strategy]);
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
```

### 3. Page-Specific Caching

```typescript
// src/app/pricing/page.tsx
export const revalidate = 3600; // Revalidate every hour

// src/app/blog/[slug]/page.tsx
export const revalidate = 86400; // Revalidate daily

// src/app/results/[id]/page.tsx
export const revalidate = 0; // No cache, dynamic
```

## Cache Key Configuration

### 1. URL-Based Keys

```typescript
// vercel.json
{
  "cacheGroup": {
    "pages": {
      "path": [
        "/(.*)"
      ],
      "key": [
        "host",
        "path",
        "query.v" // Include version query param
      ]
    }
  }
}
```

### 2. Vary Headers

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const response = NextResponse.next();

  // Vary cache by these headers
  response.headers.set('Vary', 'Accept-Encoding, Accept-Language');

  return response;
}
```

## Content Types and TTLs

| Content Type | TTL | Stale-While-Revalidate | Strategy |
|--------------|-----|------------------------|----------|
| Static JS/CSS | 1 year | N/A | Immutable |
| Images | 1 day | 7 days | Long |
| Fonts | 1 year | N/A | Immutable |
| HTML pages | 1 hour | 1 day | Medium |
| API - Health | 1 min | 5 min | Short |
| API - Analysis | 0 | N/A | None |
| API - Static data | 1 hour | 1 day | Medium |
| JSON-LD | 1 hour | 1 day | Medium |
| Sitemap | 1 day | 7 days | Long |
| Robots.txt | 1 day | 7 days | Long |

## Implementation

### 1. Static Page Caching

```typescript
// src/app/page.tsx (Landing Page)
import { headers } from 'next/headers';

export const revalidate = 3600; // ISR every hour

export default async function HomePage() {
  // This page is statically generated and cached at edge
  return (
    <main>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </main>
  );
}
```

### 2. API Route Caching

```typescript
// src/app/api/industries/route.ts

export async function GET() {
  const industries = await getIndustries();

  return Response.json(industries, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, max-age=86400',
    },
  });
}
```

### 3. Dynamic Routes with Static Params

```typescript
// src/app/ai-perception/[industry]/page.tsx

export async function generateStaticParams() {
  const industries = await getIndustries();
  return industries.map(i => ({ industry: i.slug }));
}

export const revalidate = 86400; // Daily

export default async function IndustryPage({ params }) {
  // Pre-rendered and cached at edge
}
```

## Vercel Edge Config for Cache Rules

```json
// vercel.json
{
  "headers": [
    {
      "source": "/api/health",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60, stale-while-revalidate=300"
        }
      ]
    },
    {
      "source": "/api/industries",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, stale-while-revalidate=86400"
        }
      ]
    },
    {
      "source": "/(.*).svg",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Cache Invalidation

### 1. On-Demand Revalidation

```typescript
// src/app/api/revalidate/route.ts

import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  const { path, tag, secret } = await request.json();

  // Verify secret
  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (path) {
    revalidatePath(path);
    return Response.json({ revalidated: path, now: Date.now() });
  }

  if (tag) {
    revalidateTag(tag);
    return Response.json({ revalidated: tag, now: Date.now() });
  }

  return Response.json({ error: 'Path or tag required' }, { status: 400 });
}
```

### 2. Automatic Invalidation on Deploy

Vercel automatically invalidates edge cache on new deployments.

### 3. Tag-Based Invalidation

```typescript
// src/lib/db/industries.ts

export async function getIndustries() {
  const { data } = await db
    .from('industries')
    .select('*')
    .order('name');

  // Tag for cache invalidation
  unstable_cache(
    async () => data,
    ['industries'],
    { tags: ['industries'], revalidate: 3600 }
  );

  return data;
}
```

## Monitoring Cache Performance

### 1. Vercel Analytics

Access via Vercel Dashboard → Analytics → Edge Requests

Key metrics:
- Cache Hit Rate
- Cache Miss Rate
- Edge Latency
- Origin Latency

### 2. Custom Logging

```typescript
// src/middleware.ts

export function middleware(request: Request) {
  const cacheStatus = request.headers.get('x-vercel-cache');

  // Log cache status for analysis
  console.log(JSON.stringify({
    path: request.nextUrl.pathname,
    cache: cacheStatus, // HIT, MISS, STALE, PRERENDER
    timestamp: Date.now(),
  }));

  return NextResponse.next();
}
```

### 3. Cache Hit Rate Dashboard

```typescript
// src/app/admin/cache-metrics/page.tsx

export default async function CacheMetricsPage() {
  const metrics = await getVercelAnalytics();

  return (
    <div>
      <MetricCard
        title="Cache Hit Rate"
        value={`${metrics.cacheHitRate}%`}
        target={80}
      />
      <MetricCard
        title="Edge Latency P50"
        value={`${metrics.edgeLatencyP50}ms`}
        target={50}
      />
    </div>
  );
}
```

## Optimization Checklist

### Build Optimizations
- [x] Enable Next.js output file tracing
- [x] Use `next/image` for automatic image optimization
- [x] Bundle analyze to reduce JS size
- [x] Tree-shaking enabled

### Cache Configuration
- [x] Static assets with immutable cache
- [x] ISR for semi-dynamic pages
- [x] Stale-while-revalidate for freshness
- [x] Edge caching for API routes

### Headers
- [x] Proper Cache-Control headers
- [x] CDN-Cache-Control for edge
- [x] Vary headers for content negotiation
- [x] ETag support

### Monitoring
- [x] Cache hit rate tracking
- [x] Origin latency monitoring
- [x] Alerting on cache degradation

## Target Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Cache Hit Rate (Static) | >95% | TBD |
| Cache Hit Rate (Overall) | >80% | TBD |
| Edge Latency P50 | <50ms | TBD |
| Edge Latency P99 | <200ms | TBD |
| Origin Requests | <20% | TBD |

## Troubleshooting

### Low Cache Hit Rate

1. Check `Cache-Control` headers in response
2. Verify cookies aren't preventing caching
3. Check `Vary` headers aren't too broad
4. Ensure query params are consistent

### Stale Content

1. Verify revalidation is configured
2. Check revalidation API is working
3. Review ISR intervals
4. Test on-demand revalidation

### High Origin Load

1. Increase cache TTLs
2. Add stale-while-revalidate
3. Pre-render more pages statically
4. Add Redis caching layer
