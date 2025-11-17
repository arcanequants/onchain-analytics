import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

describe('Events API Endpoints', () => {
  describe('GET /api/events', () => {
    it('should return list of events', async () => {
      const response = await fetch(`${BASE_URL}/api/events`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      if (data.length > 0) {
        const event = data[0]
        expect(event).toHaveProperty('title')
        expect(event).toHaveProperty('event_type')
        expect(event).toHaveProperty('event_date')
        expect(event).toHaveProperty('importance')
      }
    })

    it('should filter by event type', async () => {
      const response = await fetch(`${BASE_URL}/api/events?type=unlock`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      data.forEach((event: any) => {
        expect(event.event_type).toBe('unlock')
      })
    })

    it('should filter by importance', async () => {
      const response = await fetch(`${BASE_URL}/api/events?importance=high`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })
  })

  describe('GET /api/events/upcoming', () => {
    it('should return only upcoming events', async () => {
      const response = await fetch(`${BASE_URL}/api/events/upcoming`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)

      const now = new Date()
      data.forEach((event: any) => {
        const eventDate = new Date(event.event_date)
        expect(eventDate >= now).toBe(true)
      })
    })

    it('should limit results with limit parameter', async () => {
      const limit = 5
      const response = await fetch(`${BASE_URL}/api/events/upcoming?limit=${limit}`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.length).toBeLessThanOrEqual(limit)
    })
  })

  describe('GET /api/events/analytics', () => {
    it('should return event analytics', async () => {
      const response = await fetch(`${BASE_URL}/api/events/analytics`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toBeDefined()
      expect(data).toHaveProperty('summary')
      expect(data).toHaveProperty('predictions')
    })

    it('should include AI predictions', async () => {
      const response = await fetch(`${BASE_URL}/api/events/analytics`)
      const data = await response.json()

      expect(data.predictions).toBeDefined()
      expect(Array.isArray(data.predictions)).toBe(true)

      if (data.predictions.length > 0) {
        const prediction = data.predictions[0]
        expect(prediction).toHaveProperty('event_title')
        expect(prediction).toHaveProperty('predicted_impact')
        expect(prediction).toHaveProperty('confidence')
      }
    })
  })

  describe('POST /api/events/submit', () => {
    it('should reject submission without required fields', async () => {
      const response = await fetch(`${BASE_URL}/api/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })

      expect(response.status).toBe(400)
    })

    it('should accept valid event submission', async () => {
      const submission = {
        title: 'Test Event',
        description: 'Test Description',
        event_type: 'mainnet',
        event_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        project_name: 'Test Project',
        project_symbol: 'TEST',
        submitted_by: 'test@example.com'
      }

      const response = await fetch(`${BASE_URL}/api/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      expect([200, 201]).toContain(response.status)
    })

    it('should validate email format', async () => {
      const submission = {
        title: 'Test Event',
        event_type: 'mainnet',
        event_date: new Date(Date.now() + 86400000).toISOString(),
        project_name: 'Test Project',
        submitted_by: 'invalid-email'
      }

      const response = await fetch(`${BASE_URL}/api/events/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission)
      })

      expect(response.status).toBe(400)
    })
  })
})
