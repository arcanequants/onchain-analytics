/**
 * URL Validator Tests
 * Phase 1, Week 1, Day 1
 */

import { describe, it, expect } from 'vitest';
import { validateUrl, extractBrandName, urlSchema } from './url-validator';

describe('validateUrl', () => {
  describe('valid URLs', () => {
    it('should accept valid HTTPS URLs', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/');
    });

    it('should accept valid HTTP URLs by default', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should add https:// if protocol is missing', () => {
      const result = validateUrl('example.com');
      expect(result.isValid).toBe(true);
      expect(result.normalizedUrl).toBe('https://example.com/');
    });

    it('should accept URLs with paths', () => {
      const result = validateUrl('https://example.com/path/to/page');
      expect(result.isValid).toBe(true);
    });

    it('should accept URLs with query strings', () => {
      const result = validateUrl('https://example.com?foo=bar');
      expect(result.isValid).toBe(true);
    });

    it('should accept URLs with ports', () => {
      const result = validateUrl('https://example.com:8080');
      expect(result.isValid).toBe(true);
      expect(result.details.port).toBe('8080');
    });

    it('should accept subdomains', () => {
      const result = validateUrl('https://www.subdomain.example.com');
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid URLs', () => {
    it('should reject empty input', () => {
      const result = validateUrl('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is required');
    });

    it('should reject very short URLs', () => {
      const result = validateUrl('a.co');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is too short');
    });

    it('should reject very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2100);
      const result = validateUrl(longUrl);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('URL is too long (max 2048 characters)');
    });

    it('should reject invalid URL format', () => {
      const result = validateUrl('not a valid url at all');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });
  });

  describe('SSRF protection', () => {
    it('should block localhost', () => {
      const result = validateUrl('http://localhost');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This hostname is not allowed');
    });

    it('should block 127.0.0.1', () => {
      const result = validateUrl('http://127.0.0.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Internal IP addresses are not allowed');
    });

    it('should block private IP ranges (10.x.x.x)', () => {
      const result = validateUrl('http://10.0.0.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Internal IP addresses are not allowed');
    });

    it('should block private IP ranges (172.16.x.x)', () => {
      const result = validateUrl('http://172.16.0.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Internal IP addresses are not allowed');
    });

    it('should block private IP ranges (192.168.x.x)', () => {
      const result = validateUrl('http://192.168.1.1');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Internal IP addresses are not allowed');
    });

    it('should block AWS metadata endpoint', () => {
      const result = validateUrl('http://169.254.169.254');
      expect(result.isValid).toBe(false);
      // 169.254.x.x is in the link-local IP range, so it's blocked as internal IP
      expect(result.error).toBe('Internal IP addresses are not allowed');
    });

    it('should block .internal domains', () => {
      const result = validateUrl('https://api.internal');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This hostname is not allowed');
    });

    it('should block .local domains', () => {
      const result = validateUrl('https://server.local');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This hostname is not allowed');
    });
  });

  describe('protocol validation', () => {
    it('should reject ftp:// URLs', () => {
      const result = validateUrl('ftp://example.com');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('HTTP');
    });

    it('should reject file:// URLs', () => {
      const result = validateUrl('file:///etc/passwd');
      expect(result.isValid).toBe(false);
    });

    it('should reject javascript: URLs', () => {
      const result = validateUrl('javascript:alert(1)');
      expect(result.isValid).toBe(false);
    });

    it('should require HTTPS when option is set', () => {
      const result = validateUrl('http://example.com', { requireHttps: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Only HTTPS URLs are allowed');
    });
  });

  describe('domain whitelist/blocklist', () => {
    it('should allow domains in whitelist', () => {
      const result = validateUrl('https://example.com', {
        allowedDomains: ['example.com'],
      });
      expect(result.isValid).toBe(true);
    });

    it('should allow subdomains of whitelisted domains', () => {
      const result = validateUrl('https://www.example.com', {
        allowedDomains: ['example.com'],
      });
      expect(result.isValid).toBe(true);
    });

    it('should reject domains not in whitelist', () => {
      const result = validateUrl('https://other.com', {
        allowedDomains: ['example.com'],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Domain is not in the allowed list');
    });

    it('should block domains in blocklist', () => {
      const result = validateUrl('https://blocked.com', {
        blockedDomains: ['blocked.com'],
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('This domain is not allowed');
    });
  });
});

describe('extractBrandName', () => {
  it('should extract brand name from simple URL', () => {
    expect(extractBrandName('https://stripe.com')).toBe('Stripe');
  });

  it('should remove www prefix', () => {
    expect(extractBrandName('https://www.google.com')).toBe('Google');
  });

  it('should handle subdomains', () => {
    expect(extractBrandName('https://app.notion.so')).toBe('Notion');
  });

  it('should capitalize first letter', () => {
    expect(extractBrandName('https://airbnb.com')).toBe('Airbnb');
  });

  it('should return Unknown for invalid URLs', () => {
    expect(extractBrandName('not a url')).toBe('Unknown');
  });
});

describe('urlSchema (Zod)', () => {
  it('should validate and transform valid URLs', () => {
    const result = urlSchema.safeParse('example.com');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('https://example.com/');
    }
  });

  it('should reject invalid URLs', () => {
    const result = urlSchema.safeParse('localhost');
    expect(result.success).toBe(false);
  });
});
