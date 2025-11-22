/**
 * Global Footer Component
 *
 * Legal compliance footer with AI-friendly structured data
 * Appears on all pages via layout.tsx
 *
 * Features:
 * - Semantic HTML5 (<footer>, <nav>) for AI discoverability
 * - JSON-LD structured data (schema.org)
 * - GDPR/CCPA compliant legal links
 * - Mobile-responsive 3-column layout
 * - WCAG AA accessibility (4.5:1 contrast)
 */

'use client'

import Link from 'next/link'
import Script from 'next/script'
import './Footer.css'

export default function Footer() {
  // JSON-LD structured data for AI agents and search engines
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vectorial Data",
    "alternateName": "Arcane Quants",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "description": "On-chain metrics, traditional finance data, and sports betting analytics oracle for humans, AI agents, and bots worldwide.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier available with paid upgrades"
    },
    "termsOfService": "https://www.vectorialdata.com/terms",
    "privacyPolicy": "https://www.vectorialdata.com/privacy",
    "provider": {
      "@type": "Organization",
      "name": "Vectorial Data",
      "legalName": "Vectorial Data (operating as Arcane Quants)",
      "url": "https://www.vectorialdata.com",
      "logo": "https://www.vectorialdata.com/logo.png",
      "foundingDate": "2025",
      "description": "Global oracle for blockchain analytics, TradFi data, and sports betting information"
    },
    "serviceType": [
      "Blockchain Analytics",
      "Cryptocurrency Market Data",
      "DeFi Protocol Analytics",
      "Sports Betting Information",
      "Financial Data API"
    ]
  }

  return (
    <>
      {/* JSON-LD Structured Data for AI Discoverability */}
      <Script
        id="footer-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <footer className="global-footer" role="contentinfo" aria-label="Site footer">
        <div className="footer-container">
          {/* Column 1: Brand & Description */}
          <div className="footer-column footer-brand">
            <div className="footer-logo">
              <Link href="/" aria-label="Vectorial Data home">
                <span className="logo-text">Vectorial Data</span>
              </Link>
            </div>
            <p className="footer-tagline">
              Global oracle for on-chain metrics, TradFi data, and sports betting analytics.
            </p>
            <p className="footer-mission">
              Serving humans, AI agents, and bots worldwide with verifiable, real-time financial intelligence.
            </p>
          </div>

          {/* Column 2: Legal & Compliance Navigation */}
          <div className="footer-column footer-legal">
            <h3 className="footer-heading">Legal & Privacy</h3>
            <nav aria-label="Legal navigation">
              <ul className="footer-links">
                <li>
                  <Link
                    href="/privacy"
                    rel="nofollow"
                    aria-label="Privacy Policy - GDPR and CCPA compliant"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    rel="nofollow"
                    aria-label="Terms of Service - User agreement"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <button
                    className="footer-link-button"
                    onClick={() => {
                      // Trigger cookie banner (if CookieBanner component is implemented)
                      if (typeof window !== 'undefined') {
                        window.localStorage.removeItem('cookieConsent')
                        window.location.reload()
                      }
                    }}
                    aria-label="Manage cookie preferences"
                  >
                    Cookie Preferences
                  </button>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Product & Support Links */}
          <div className="footer-column footer-product">
            <h3 className="footer-heading">Product</h3>
            <nav aria-label="Product navigation">
              <ul className="footer-links">
                <li>
                  <Link href="/about" aria-label="About Vectorial Data">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" aria-label="User dashboard">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" aria-label="Pricing plans">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:support@vectorialdata.com"
                    aria-label="Contact support via email"
                  >
                    Support
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Disclaimers */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Vectorial Data. All rights reserved.
            </p>
            <div className="footer-disclaimers">
              <span className="footer-disclaimer-badge" title="Not investment advice">
                ⚠️ Not Financial Advice
              </span>
              <span className="footer-disclaimer-badge" title="Not a gambling operator">
                ⚽ Not a Sportsbook
              </span>
              <span className="footer-disclaimer-badge" title="GDPR compliant">
                🇪🇺 GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
