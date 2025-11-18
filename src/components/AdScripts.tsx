'use client'

import Script from 'next/script'
import { useEffect } from 'react'

/**
 * AdScripts Component
 *
 * Integrates advertising networks:
 * - Coinzilla (crypto-focused ad network)
 * - Bitmedia (Bitcoin & crypto advertising)
 *
 * Usage: Add this component to your layout or page
 */
export default function AdScripts() {
  useEffect(() => {
    // Initialize ad networks when component mounts
    console.log('[AdScripts] Ad networks initialized')
  }, [])

  return (
    <>
      {/* Coinzilla Ad Network */}
      <Script
        id="coinzilla-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.coinzilla_display = window.coinzilla_display || [];
            var c_d = window.coinzilla_display;
          `,
        }}
      />

      {/* Bitmedia Ad Network */}
      <Script
        id="bitmedia-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.bitmedia = window.bitmedia || [];
          `,
        }}
      />
    </>
  )
}
