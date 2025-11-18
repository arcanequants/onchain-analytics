'use client'

import dynamic from 'next/dynamic'
import { useTheme, type ThemeMode } from '@/contexts/ThemeContext'

function ThemeToggleButton() {
  const { mode, resolvedTheme, cycleMode } = useTheme()

  // Get icon and label based on current mode
  const getModeInfo = (currentMode: ThemeMode) => {
    switch (currentMode) {
      case 'auto':
        return {
          icon: (
            // Auto icon - sun/moon combined
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3V5M10 15V17M17 10H15M5 10H3M14.5 5.5L13.5 6.5M6.5 13.5L5.5 14.5M14.5 14.5L13.5 13.5M6.5 6.5L5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path
                d="M12 10a2 2 0 01-2 2v-4a2 2 0 012 2z"
                fill="currentColor"
              />
            </svg>
          ),
          label: 'Auto',
          title: `Auto mode (currently ${resolvedTheme})`
        }
      case 'dark':
        return {
          icon: (
            // Moon icon
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ),
          label: 'Dark',
          title: 'Dark mode'
        }
      case 'light':
        return {
          icon: (
            // Sun icon
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M10 2V4M10 16V18M18 10H16M4 10H2M15.657 4.343L14.243 5.757M5.757 14.243L4.343 15.657M15.657 15.657L14.243 14.243M5.757 5.757L4.343 4.343"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          ),
          label: 'Light',
          title: 'Light mode'
        }
    }
  }

  const modeInfo = getModeInfo(mode)

  return (
    <button
      onClick={cycleMode}
      className="theme-toggle"
      aria-label={`Theme: ${mode}. Click to cycle modes.`}
      title={modeInfo.title}
    >
      {modeInfo.icon}
      <span className="theme-toggle-label">
        {modeInfo.label}
      </span>
    </button>
  )
}

// Export with dynamic import to avoid SSR issues
const ThemeToggle = dynamic(() => Promise.resolve(ThemeToggleButton), {
  ssr: false,
})

export default ThemeToggle
