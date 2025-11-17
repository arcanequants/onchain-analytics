/**
 * Unit Tests for Rate Limiting
 *
 * Tests rate limit logic, IP extraction, CRON detection
 */

import { describe, it, expect, vi } from 'vitest'
import { getClientIP, isCronRequest } from './rate-limit'

describe('Rate Limiting Utils', () => {
  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1'
        }
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should handle single IP in x-forwarded-for', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1'
        }
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })

    it('should use cf-connecting-ip if x-forwarded-for missing', () => {
      const request = new Request('http://localhost', {
        headers: {
          'cf-connecting-ip': '203.0.113.1'
        }
      })

      const ip = getClientIP(request)
      expect(ip).toBe('203.0.113.1')
    })

    it('should use x-real-ip as fallback', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-real-ip': '198.51.100.1'
        }
      })

      const ip = getClientIP(request)
      expect(ip).toBe('198.51.100.1')
    })

    it('should return localhost if no headers present', () => {
      const request = new Request('http://localhost')

      const ip = getClientIP(request)
      expect(ip).toBe('127.0.0.1')
    })

    it('should prefer x-forwarded-for over other headers', () => {
      const request = new Request('http://localhost', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'cf-connecting-ip': '203.0.113.1',
          'x-real-ip': '198.51.100.1'
        }
      })

      const ip = getClientIP(request)
      expect(ip).toBe('192.168.1.1')
    })
  })

  describe('isCronRequest', () => {
    const originalEnv = process.env.CRON_SECRET

    afterEach(() => {
      process.env.CRON_SECRET = originalEnv
    })

    it('should return true for valid CRON request', () => {
      process.env.CRON_SECRET = 'test-secret-123'

      const request = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer test-secret-123'
        }
      })

      expect(isCronRequest(request)).toBe(true)
    })

    it('should return false for invalid CRON secret', () => {
      process.env.CRON_SECRET = 'test-secret-123'

      const request = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer wrong-secret'
        }
      })

      expect(isCronRequest(request)).toBe(false)
    })

    it('should return false if authorization header missing', () => {
      process.env.CRON_SECRET = 'test-secret-123'

      const request = new Request('http://localhost')

      expect(isCronRequest(request)).toBe(false)
    })

    it('should return false if CRON_SECRET not set', () => {
      delete process.env.CRON_SECRET

      const request = new Request('http://localhost', {
        headers: {
          'authorization': 'Bearer some-token'
        }
      })

      expect(isCronRequest(request)).toBe(false)
    })

    it('should reject non-Bearer authorization', () => {
      process.env.CRON_SECRET = 'test-secret-123'

      const request = new Request('http://localhost', {
        headers: {
          'authorization': 'Basic test-secret-123'
        }
      })

      expect(isCronRequest(request)).toBe(false)
    })
  })
})
