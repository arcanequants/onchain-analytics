/**
 * Cookie Consent Banner Component
 *
 * GDPR/CCPA/ePrivacy Directive compliant cookie consent
 *
 * Compliance:
 * - GDPR Article 6(1)(a) - Consent
 * - ePrivacy Directive Article 5(3) - Cookie consent
 * - CCPA §1798.135 - Right to opt-out
 *
 * Features:
 * - Non-blocking bottom-right placement
 * - LocalStorage persistence (cookieConsent)
 * - Granular consent options (essential, analytics, marketing)
 * - WCAG AA accessible
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import './CookieBanner.css'

interface CookiePreferences {
  essential: boolean // Always true (required)
  analytics: boolean // Google Analytics 4
  marketing: boolean // Future: marketing cookies
}

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  })

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Show banner after 1 second delay (better UX)
      setTimeout(() => setIsVisible(true), 1000)
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent)
        setPreferences(saved)

        // Apply analytics consent
        if (saved.analytics && typeof window !== 'undefined') {
          // Enable Google Analytics (if gtag exists)
          if (window.gtag) {
            window.gtag('consent', 'update', {
              analytics_storage: 'granted',
            })
          }
        }
      } catch (e) {
        console.error('Failed to parse cookie consent:', e)
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
    }
    savePreferences(allAccepted)
    setIsVisible(false)
  }

  const handleSavePreferences = () => {
    savePreferences(preferences)
    setIsVisible(false)
  }

  const handleRejectAll = () => {
    const onlyEssential: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
    }
    savePreferences(onlyEssential)
    setIsVisible(false)
  }

  const savePreferences = (prefs: CookiePreferences) => {
    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(prefs))

    // Update Google Analytics consent
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied',
        ad_storage: prefs.marketing ? 'granted' : 'denied',
      })
    }

    // Set preferences state
    setPreferences(prefs)
  }

  if (!isVisible) return null

  return (
    <div className="cookie-banner" role="dialog" aria-labelledby="cookie-banner-title" aria-describedby="cookie-banner-desc">
      <div className="cookie-banner-content">
        <div className="cookie-banner-icon" aria-hidden="true">
          🍪
        </div>

        <div className="cookie-banner-text">
          <h2 id="cookie-banner-title" className="cookie-banner-title">
            Cookie Preferences
          </h2>
          <p id="cookie-banner-desc" className="cookie-banner-description">
            We use cookies to enhance your experience, analyze site traffic, and personalize content.
            You can manage your preferences or accept all cookies.
          </p>
          <p className="cookie-banner-links">
            <Link href="/privacy" className="cookie-banner-link">
              Privacy Policy
            </Link>
            {' | '}
            <Link href="/terms" className="cookie-banner-link">
              Terms of Service
            </Link>
          </p>
        </div>

        {!showPreferences ? (
          /* Simple View: Accept All / Manage Preferences / Reject All */
          <div className="cookie-banner-actions">
            <button
              className="cookie-btn cookie-btn-primary"
              onClick={handleAcceptAll}
              aria-label="Accept all cookies"
            >
              Accept All
            </button>
            <button
              className="cookie-btn cookie-btn-secondary"
              onClick={() => setShowPreferences(true)}
              aria-label="Manage cookie preferences"
            >
              Manage Preferences
            </button>
            <button
              className="cookie-btn cookie-btn-text"
              onClick={handleRejectAll}
              aria-label="Reject all non-essential cookies"
            >
              Reject All
            </button>
          </div>
        ) : (
          /* Detailed View: Granular Consent Controls */
          <div className="cookie-preferences">
            <div className="cookie-preference-item">
              <label className="cookie-preference-label">
                <input
                  type="checkbox"
                  checked={preferences.essential}
                  disabled
                  aria-label="Essential cookies (required)"
                  className="cookie-checkbox"
                />
                <span className="cookie-preference-name">
                  Essential Cookies
                  <span className="cookie-badge-required">Required</span>
                </span>
                <span className="cookie-preference-desc">
                  Necessary for authentication, security, and basic site functionality.
                </span>
              </label>
            </div>

            <div className="cookie-preference-item">
              <label className="cookie-preference-label">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences({ ...preferences, analytics: e.target.checked })
                  }
                  aria-label="Analytics cookies (optional)"
                  className="cookie-checkbox"
                />
                <span className="cookie-preference-name">Analytics Cookies</span>
                <span className="cookie-preference-desc">
                  Help us understand how visitors use our site (Google Analytics 4, anonymized IP).
                </span>
              </label>
            </div>

            <div className="cookie-preference-item">
              <label className="cookie-preference-label">
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences({ ...preferences, marketing: e.target.checked })
                  }
                  aria-label="Marketing cookies (optional)"
                  className="cookie-checkbox"
                />
                <span className="cookie-preference-name">Marketing Cookies</span>
                <span className="cookie-preference-desc">
                  Used for targeted advertising and promotional content (future use).
                </span>
              </label>
            </div>

            <div className="cookie-banner-actions">
              <button
                className="cookie-btn cookie-btn-primary"
                onClick={handleSavePreferences}
                aria-label="Save cookie preferences"
              >
                Save Preferences
              </button>
              <button
                className="cookie-btn cookie-btn-text"
                onClick={() => setShowPreferences(false)}
                aria-label="Go back to simple view"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// TypeScript declaration for gtag (Google Analytics)
declare global {
  interface Window {
    gtag?: (
      command: string,
      action: string,
      params: Record<string, string>
    ) => void
  }
}
