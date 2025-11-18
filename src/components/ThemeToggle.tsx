'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/contexts/ThemeContext'

function ThemeToggleButton() {
  const { theme, hasOverride, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Current theme: ${theme}. Click to switch.`}
      title={hasOverride ? `${theme === 'dark' ? 'Dark' : 'Light'} mode (manually set for today)` : `${theme === 'dark' ? 'Dark' : 'Light'} mode (auto-detected)`}
    >
      {theme === 'dark' ? (
        // Sun icon - click to switch to light
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
      ) : (
        // Moon icon - click to switch to dark
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
      )}
      <span className="theme-toggle-label">
        {theme === 'dark' ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}

// Export with dynamic import to avoid SSR issues
const ThemeToggle = dynamic(() => Promise.resolve(ThemeToggleButton), {
  ssr: false,
})

export default ThemeToggle
