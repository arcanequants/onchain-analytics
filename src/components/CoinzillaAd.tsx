'use client'

import { useEffect, useRef } from 'react'
import Script from 'next/script'

interface CoinzillaAdProps {
  zoneId: string
  width?: number
  height?: number
  className?: string
}

/**
 * Coinzilla Ad Component
 *
 * Displays Coinzilla ads at specified locations
 *
 * @param zoneId - Your Coinzilla zone ID (get from dashboard)
 * @param width - Ad width in pixels (default: 728)
 * @param height - Ad height in pixels (default: 90)
 * @param className - Additional CSS classes
 *
 * Common ad sizes:
 * - Leaderboard: 728x90
 * - Banner: 468x60
 * - Medium Rectangle: 300x250
 * - Skyscraper: 160x600
 * - Wide Skyscraper: 300x600
 */
export default function CoinzillaAd({
  zoneId,
  width = 728,
  height = 90,
  className = '',
}: CoinzillaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const adLoaded = useRef(false)

  useEffect(() => {
    if (adLoaded.current || !zoneId) return

    // Load ad after script is ready
    const loadAd = () => {
      if (typeof window !== 'undefined' && (window as any).coinzilla_display) {
        ;(window as any).coinzilla_display.push({
          zone_id: zoneId,
        })
        adLoaded.current = true
        console.log(`[Coinzilla] Ad loaded for zone: ${zoneId}`)
      }
    }

    // Try to load immediately or wait for script
    if ((window as any).coinzilla_display) {
      loadAd()
    } else {
      const timer = setTimeout(loadAd, 1000)
      return () => clearTimeout(timer)
    }
  }, [zoneId])

  return (
    <>
      <div
        ref={containerRef}
        className={`coinzilla-ad ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0, 0, 0, 0.02)',
          border: '1px solid var(--border-primary)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          id={`coinzilla-${zoneId}`}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Coinzilla ad serving script */}
      <Script
        id={`coinzilla-script-${zoneId}`}
        strategy="afterInteractive"
        src={`https://coinzillatag.com/lib/display.js`}
      />
    </>
  )
}
