import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('Health & Monitoring Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('status')
      expect(data.status).toBe('healthy')
    })

    it('should check database connectivity', async () => {
      const response = await fetch(`${BASE_URL}/api/health`)
      const data = await response.json()

      expect(data).toHaveProperty('database')
      expect(data.database).toBe('connected')
    })

    it('should return response time', async () => {
      const start = Date.now()
      const response = await fetch(`${BASE_URL}/api/health`)
      const duration = Date.now() - start

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(5000) // Should respond in < 5 seconds
    })
  })
})
