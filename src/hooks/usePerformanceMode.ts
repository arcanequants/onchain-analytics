'use client'

import { useState, useEffect } from 'react'

type PerformanceMode = 'high' | 'low' | 'detecting'

/**
 * Hook to detect user's hardware capabilities and return appropriate performance mode
 * - 'high': Modern hardware - enable all animations and features
 * - 'low': Old hardware - disable heavy animations to improve performance
 * - 'detecting': Still measuring performance
 */
export function usePerformanceMode(): PerformanceMode {
  const [mode, setMode] = useState<PerformanceMode>('detecting')

  useEffect(() => {
    // Check if we already detected performance mode in this session
    const cached = sessionStorage.getItem('performance-mode')
    if (cached === 'high' || cached === 'low') {
      setMode(cached as PerformanceMode)
      return
    }

    // Detect hardware capabilities
    const detectPerformance = () => {
      let score = 0
      const checks = []

      // Check 1: Hardware Concurrency (CPU cores)
      const cores = navigator.hardwareConcurrency || 2
      if (cores >= 4) {
        score += 3
        checks.push(`CPU cores: ${cores} (good)`)
      } else {
        checks.push(`CPU cores: ${cores} (limited)`)
      }

      // Check 2: Device Memory (if available)
      const memory = (navigator as any).deviceMemory
      if (memory !== undefined) {
        if (memory >= 4) {
          score += 3
          checks.push(`RAM: ${memory}GB (good)`)
        } else {
          checks.push(`RAM: ${memory}GB (limited)`)
        }
      }

      // Check 3: Performance timing - measure initial page load
      if (performance.timing) {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        if (loadTime > 0 && loadTime < 3000) {
          score += 2
          checks.push(`Page load: ${loadTime}ms (fast)`)
        } else if (loadTime >= 3000) {
          checks.push(`Page load: ${loadTime}ms (slow)`)
        }
      }

      // Check 4: Connection type (if available)
      const connection = (navigator as any).connection
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === '4g') {
          score += 1
          checks.push(`Connection: ${effectiveType} (good)`)
        } else {
          checks.push(`Connection: ${effectiveType} (limited)`)
        }
      }

      // Determine mode based on score
      // High mode: score >= 5 (modern hardware)
      // Low mode: score < 5 (old hardware)
      const detectedMode: PerformanceMode = score >= 5 ? 'high' : 'low'

      console.log('[Performance Detection]', {
        score,
        mode: detectedMode,
        checks,
      })

      // Cache the result for this session
      sessionStorage.setItem('performance-mode', detectedMode)
      setMode(detectedMode)
    }

    // Run detection after a short delay to not block initial render
    const timeout = setTimeout(detectPerformance, 100)

    return () => clearTimeout(timeout)
  }, [])

  return mode
}
