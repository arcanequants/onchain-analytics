import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('Gas API Endpoints', () => {
  describe('GET /api/gas', () => {
    it('should return gas prices for all chains', async () => {
      const response = await fetch(`${BASE_URL}/api/gas`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)

      // Check structure of first gas price
      const gasPrice = data[0]
      expect(gasPrice).toHaveProperty('chain')
      expect(gasPrice).toHaveProperty('gas_price')
      expect(gasPrice).toHaveProperty('status')
      expect(gasPrice.status).toMatch(/low|medium|high/)
    })

    it('should filter by chain parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/gas?chain=ethereum`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          expect(item.chain).toBe('ethereum')
        })
      }
    })

    it('should return 400 for invalid chain', async () => {
      const response = await fetch(`${BASE_URL}/api/gas?chain=invalid`)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/gas/history', () => {
    it('should return historical gas prices', async () => {
      const response = await fetch(`${BASE_URL}/api/gas/history?chain=ethereum&hours=24`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(Array.isArray(data)).toBe(true)
    })

    it('should require chain parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/gas/history`)

      expect(response.status).toBe(400)
    })

    it('should validate hours parameter', async () => {
      const response = await fetch(`${BASE_URL}/api/gas/history?chain=ethereum&hours=999`)

      expect(response.status).toBe(400)
    })
  })

  describe('GET /api/gas/stats', () => {
    it('should return gas statistics', async () => {
      const response = await fetch(`${BASE_URL}/api/gas/stats?chain=ethereum`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(data).toHaveProperty('average')
      expect(data).toHaveProperty('min')
      expect(data).toHaveProperty('max')
    })
  })
})
