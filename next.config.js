const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // Enable XSS protection (legacy, but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer policy (privacy)
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions policy (restrict browser features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://coinzillatag.com https://cdn.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: http:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://vitals.vercel-insights.com wss://*.supabase.co https://*.alchemy.com https://*.infura.io https://mainnet.base.org https://arb1.arbitrum.io https://mainnet.optimism.io https://polygon-rpc.com",
              "frame-src 'self' https://www.google.com",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          },
          // Strict Transport Security (HTTPS only)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      },
      // Special headers for API routes
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production'
              ? 'https://onchain-analytics.vercel.app'
              : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Key'
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400'
          }
        ]
      }
    ]
  }
}

module.exports = withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "o-qp",
    project: "javascript-nextjs",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  }
)
