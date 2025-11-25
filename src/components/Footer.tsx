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
 *
 * Updated for AI Perception Engineering Agency
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
    "name": "AI Perception",
    "alternateName": "AI Perception Engineering Agency",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "description": "Discover how AI models like ChatGPT, Claude, Gemini and Perplexity perceive and recommend your brand. Get your AI Perception Score and actionable recommendations.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free analysis available with paid upgrades for monitoring"
    },
    "termsOfService": "https://www.vectorialdata.com/terms",
    "privacyPolicy": "https://www.vectorialdata.com/privacy",
    "provider": {
      "@type": "Organization",
      "name": "AI Perception",
      "legalName": "AI Perception Engineering Agency",
      "url": "https://www.vectorialdata.com",
      "foundingDate": "2025",
      "description": "AI Perception Engineering - helping businesses understand and improve how AI models perceive them"
    },
    "serviceType": [
      "AI Brand Analysis",
      "GEO - Generative Engine Optimization",
      "AI Recommendation Monitoring",
      "Brand Perception Intelligence",
      "Competitor AI Analysis"
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
              <Link href="/" aria-label="AI Perception home">
                <span className="logo-text">AI Perception</span>
              </Link>
            </div>
            <p className="footer-tagline">
              Discover how AI models perceive and recommend your brand.
            </p>
            <p className="footer-mission">
              Helping businesses understand their visibility in AI recommendations from ChatGPT, Claude, Gemini and Perplexity.
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
                  <Link href="/" aria-label="Analyze your brand">
                    Free Analysis
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" aria-label="Pricing plans">
                    Pricing
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hello@vectorialdata.com"
                    aria-label="Contact support via email"
                  >
                    Contact
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
              © {new Date().getFullYear()} AI Perception. All rights reserved.
            </p>
            <div className="footer-disclaimers">
              <span className="footer-disclaimer-badge" title="GDPR compliant">
                GDPR Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
