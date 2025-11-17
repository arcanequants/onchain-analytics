/**
 * Unit Tests for Validation Schemas
 *
 * Tests all Zod schemas to ensure proper validation
 */

import { describe, it, expect } from 'vitest'
import {
  chainSchema,
  gasQuerySchema,
  gasDataSchema,
  apiKeySchema,
  emailSchema,
  eventSubmissionSchema,
  validateRequest,
  validateQuery,
  formatZodError
} from './validation'

describe('Validation Schemas', () => {
  describe('chainSchema', () => {
    it('should accept valid chain names', () => {
      expect(chainSchema.parse('ethereum')).toBe('ethereum')
      expect(chainSchema.parse('base')).toBe('base')
      expect(chainSchema.parse('arbitrum')).toBe('arbitrum')
      expect(chainSchema.parse('optimism')).toBe('optimism')
      expect(chainSchema.parse('polygon')).toBe('polygon')
    })

    it('should reject invalid chain names', () => {
      expect(() => chainSchema.parse('bitcoin')).toThrow()
      expect(() => chainSchema.parse('solana')).toThrow()
      expect(() => chainSchema.parse('')).toThrow()
    })
  })

  describe('gasQuerySchema', () => {
    it('should accept valid gas query params', () => {
      const result = gasQuerySchema.parse({
        chain: 'ethereum',
        limit: '10'
      })

      expect(result).toEqual({
        chain: 'ethereum',
        limit: 10
      })
    })

    it('should use defaults when params missing', () => {
      const result = gasQuerySchema.parse({})

      expect(result.limit).toBe(100)
      expect(result.chain).toBeUndefined()
    })

    it('should reject limit > 1000', () => {
      expect(() => gasQuerySchema.parse({ limit: '2000' })).toThrow()
    })

    it('should coerce string numbers to integers', () => {
      const result = gasQuerySchema.parse({ limit: '50' })
      expect(result.limit).toBe(50)
      expect(typeof result.limit).toBe('number')
    })
  })

  describe('gasDataSchema', () => {
    it('should accept valid gas data', () => {
      const validData = {
        chain: 'ethereum',
        gas_price: 25.5,
        block_number: 12345678,
        status: 'medium'
      }

      const result = gasDataSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('should accept EIP-1559 fields', () => {
      const validData = {
        chain: 'base',
        gas_price: 0.01,
        block_number: 123456,
        base_fee: 0.005,
        priority_fee: 0.005,
        status: 'low'
      }

      const result = gasDataSchema.parse(validData)
      expect(result.base_fee).toBe(0.005)
      expect(result.priority_fee).toBe(0.005)
    })

    it('should reject negative gas prices', () => {
      expect(() =>
        gasDataSchema.parse({
          chain: 'ethereum',
          gas_price: -5,
          block_number: 123,
          status: 'low'
        })
      ).toThrow()
    })

    it('should reject invalid status', () => {
      expect(() =>
        gasDataSchema.parse({
          chain: 'ethereum',
          gas_price: 25,
          block_number: 123,
          status: 'super-high'
        })
      ).toThrow()
    })
  })

  describe('apiKeySchema', () => {
    it('should accept valid API keys', () => {
      const validKey = 'sk_live_' + 'a'.repeat(32)
      expect(apiKeySchema.parse(validKey)).toBe(validKey)
    })

    it('should accept test API keys', () => {
      const testKey = 'sk_test_' + 'b'.repeat(32)
      expect(apiKeySchema.parse(testKey)).toBe(testKey)
    })

    it('should reject keys without sk_ prefix', () => {
      expect(() => apiKeySchema.parse('live_' + 'a'.repeat(32))).toThrow()
    })

    it('should reject keys that are too short', () => {
      expect(() => apiKeySchema.parse('sk_live_short')).toThrow()
    })

    it('should reject keys with invalid format', () => {
      expect(() => apiKeySchema.parse('sk_prod_' + 'a'.repeat(32))).toThrow()
    })
  })

  describe('emailSchema', () => {
    it('should accept valid emails', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com')
      expect(emailSchema.parse('test+tag@domain.co.uk')).toBe('test+tag@domain.co.uk')
    })

    it('should reject invalid emails', () => {
      expect(() => emailSchema.parse('notanemail')).toThrow()
      expect(() => emailSchema.parse('missing@domain')).toThrow()
      expect(() => emailSchema.parse('@domain.com')).toThrow()
    })
  })

  describe('eventSubmissionSchema', () => {
    it('should accept valid event submission', () => {
      const validSubmission = {
        title: 'Token Unlock Event',
        description: 'Major token unlock happening',
        event_type: 'unlock',
        event_date: new Date().toISOString(),
        project_name: 'Example Protocol',
        project_symbol: 'EXP',
        source_url: 'https://example.com/event',
        submitted_by: 'user@example.com'
      }

      const result = eventSubmissionSchema.parse(validSubmission)
      expect(result.title).toBe('Token Unlock Event')
    })

    it('should reject title that is too short', () => {
      expect(() =>
        eventSubmissionSchema.parse({
          title: 'Hi',
          event_type: 'unlock',
          event_date: new Date().toISOString(),
          project_name: 'Test',
          submitted_by: 'user@example.com'
        })
      ).toThrow()
    })

    it('should reject invalid event types', () => {
      expect(() =>
        eventSubmissionSchema.parse({
          title: 'Valid Title Here',
          event_type: 'invalid_type',
          event_date: new Date().toISOString(),
          project_name: 'Test',
          submitted_by: 'user@example.com'
        })
      ).toThrow()
    })

    it('should reject invalid email', () => {
      expect(() =>
        eventSubmissionSchema.parse({
          title: 'Valid Title',
          event_type: 'unlock',
          event_date: new Date().toISOString(),
          project_name: 'Test',
          submitted_by: 'not-an-email'
        })
      ).toThrow()
    })
  })

  describe('validateRequest', () => {
    it('should return success for valid data', () => {
      const result = validateRequest(emailSchema, 'test@example.com')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('test@example.com')
      }
    })

    it('should return error for invalid data', () => {
      const result = validateRequest(emailSchema, 'not-an-email')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })
  })

  describe('validateQuery', () => {
    it('should validate URL params correctly', () => {
      const params = {
        chain: 'ethereum',
        limit: '50'
      }

      const result = validateQuery(gasQuerySchema, params)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.chain).toBe('ethereum')
        expect(result.data.limit).toBe(50)
      }
    })

    it('should handle missing optional params', () => {
      const result = validateQuery(gasQuerySchema, {})

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(100) // default
      }
    })
  })

  describe('formatZodError', () => {
    it('should format Zod errors for API responses', () => {
      const result = validateRequest(emailSchema, 'invalid')

      if (!result.success) {
        const formatted = formatZodError(result.error)

        expect(formatted.message).toBe('Validation failed')
        expect(formatted.errors).toBeInstanceOf(Array)
        expect(formatted.errors.length).toBeGreaterThan(0)
        expect(formatted.errors[0]).toHaveProperty('field')
        expect(formatted.errors[0]).toHaveProperty('message')
      }
    })

    it('should include field path in error', () => {
      const result = validateRequest(gasDataSchema, {
        chain: 'ethereum',
        gas_price: -5, // invalid
        block_number: 123,
        status: 'low'
      })

      if (!result.success) {
        const formatted = formatZodError(result.error)
        const gasError = formatted.errors.find(e => e.field === 'gas_price')

        expect(gasError).toBeDefined()
        expect(gasError?.message).toContain('Too small')
      }
    })
  })
})
