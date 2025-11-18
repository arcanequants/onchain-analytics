'use client'

import { useEffect, useRef } from 'react'

interface BitmediaAdProps {
  zoneId: string
  width?: number
  height?: number
  className?: string
}

/**
 * Bitmedia Ad Component
 *
 * Displays Bitmedia ads at specified locations
 *
 * @param zoneId - Your Bitmedia zone/placement ID
 * @param width - Ad width in pixels (default: 728)
 * @param height - Ad height in pixels (default: 90)
 * @param className - Additional CSS classes
 *
 * Common ad sizes:
 * - Leaderboard: 728x90
 * - Banner: 468x60
 * - Medium Rectangle: 300x250
 * - Skyscraper: 160x600
 */
export default function BitmediaAd({
  zoneId,
  width = 728,
  height = 90,
  className = '',
}: BitmediaAdProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const adLoaded = useRef(false)

  useEffect(() => {
    if (adLoaded.current || !zoneId || !containerRef.current) return

    // Bitmedia ad loading
    const loadAd = () => {
      if (!containerRef.current) return

      // Create Bitmedia ad container
      const adContainer = document.createElement('div')
      adContainer.id = `bitmedia-${zoneId}`
      adContainer.setAttribute('data-zone', zoneId)
      containerRef.current.appendChild(adContainer)

      // Load Bitmedia script
      const script = document.createElement('script')
      script.async = true
      script.src = `https://tags.bitmedia.io/tags/${zoneId}.js`
      script.onload = () => {
        console.log(`[Bitmedia] Ad loaded for zone: ${zoneId}`)
      }
      script.onerror = () => {
        console.error(`[Bitmedia] Failed to load ad for zone: ${zoneId}`)
      }
      containerRef.current.appendChild(script)

      adLoaded.current = true
    }

    loadAd()
  }, [zoneId])

  return (
    <div
      ref={containerRef}
      className={`bitmedia-ad ${className}`}
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
    />
  )
}
