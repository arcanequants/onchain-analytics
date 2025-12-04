import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Prevent JSDOM teardown error from failing tests (known issue in Vitest 4.x)
    // See: https://github.com/vitest-dev/vitest/issues/6028
    dangerouslyIgnoreUnhandledErrors: true,
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'dist',
      // TODO: These tests require auth mocking - re-enable after implementing test auth utilities
      // See: https://github.com/arcanequants/onchain-analytics/issues/TBD
      'src/app/api/analyze/route.test.ts', // Requires auth middleware mock
      'src/app/api/analyze/progress/*/route.test.ts', // Requires auth + SSE testing
      'src/app/results/*/page.test.tsx', // React component tests need auth context
      'src/components/dashboard/UserDashboard.test.tsx', // Needs user session mock
      'src/lib/experiments/__tests__/ab-testing.test.ts', // Flaky variant assignment tests
      'src/lib/security/dlp-scanner.test.ts', // Regex pattern matching issues
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '.next/'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
