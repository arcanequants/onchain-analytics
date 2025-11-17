import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('Fear & Greed API Endpoints', () => {
  describe('GET /api/fear-greed', () => {
    it('should return current fear & greed index', async () => {
      const response = await fetch(`${BASE_URL}/api/fear-greed`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(data).toHaveProperty('value')
      expect(data).toHaveProperty('classification')
      expect(data.value).toBeGreaterThanOrEqual(0)
      expect(data.value).toBeLessThanOrEqual(100)
      expect(data.classification).toMatch(/extreme_fear|fear|neutral|greed|extreme_greed/)
    })

    it('should include timestamp', async () => {
      const response = await fetch(`${BASE_URL}/api/fear-greed`)
      const data = await response.json()

      expect(data).toHaveProperty('timestamp')
      expect(new Date(data.timestamp)).toBeInstanceOf(Date)
    })
  })

  describe('GET /api/fear-greed/history', () => {
    it('should return historical fear & greed data', async () => {
      const response = await fetch(`${BASE_URL}/api/fear-greed/history?days=7`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('value')
        expect(data[0]).toHaveProperty('classification')
        expect(data[0]).toHaveProperty('timestamp')
      }
    })

    it('should validate days parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/fear-greed/history?days=999`)

      // Should either limit to max days or return 400
      expect([200, 400]).toContain(response.status)
    })
  })
})
