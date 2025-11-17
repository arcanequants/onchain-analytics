/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          cyan: '#0ff',
          green: '#0f0',
          dark: '#000',
          darker: '#000408',
          grid: 'rgba(0, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        mono: ['"Courier New"', 'Courier', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan': 'scan 10s linear infinite',
        'grid-scroll': 'gridScroll 20s linear infinite',
        'float': 'float 15s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(0, 255, 255, 0.5)',
            borderColor: 'rgba(0, 255, 255, 0.5)',
          },
          '50%': {
            boxShadow: '0 0 40px rgba(0, 255, 255, 1)',
            borderColor: 'rgba(0, 255, 255, 1)',
          },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        gridScroll: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(50px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-100vh) rotate(360deg)' },
        },
      },
    },
  },
  plugins: [],
}

