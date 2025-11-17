/**
 * Integration Test Setup
 * Runs before all integration tests
 */

import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

// Verify required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'DATABASE_URL',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

console.log('✅ Integration test environment configured')
