/**
 * Tests for HTTP client
 */

import { describe, it, expect } from 'vitest';
import { HttpClient } from '../src/core/client.js';
import { OwnPayError } from '../src/core/errors.js';

describe('HttpClient', () => {
  describe('constructor', () => {
    it('should accept valid API key', () => {
      expect(() => new HttpClient({ apiKey: 'op_abcdefgh12345678' })).not.toThrow();
    });

    it('should reject invalid API key format', () => {
      expect(() => new HttpClient({ apiKey: 'invalid' })).toThrow(OwnPayError);
      expect(() => new HttpClient({ apiKey: 'op_short' })).toThrow(OwnPayError);
      expect(() => new HttpClient({ apiKey: '' })).toThrow(OwnPayError);
    });

    it('should accept custom configuration', () => {
      expect(() =>
        new HttpClient({
          apiKey: 'op_abcdefgh12345678',
          baseUrl: 'https://custom.api.com',
          timeout: 60000,
          maxRetries: 5,
        })
      ).not.toThrow();
    });
  });

  describe('buildUrl', () => {
    it('should build correct URL with default base', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      // Access private method via any for testing
      const url = (client as any).buildUrl('/payments');
      expect(url).toBe('https://api.ownpay.com/api/v1/payments');
    });

    it('should build URL with query parameters', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      const url = (client as any).buildUrl('/transactions', { page: 1, status: 'completed' });
      expect(url).toContain('page=1');
      expect(url).toContain('status=completed');
    });

    it('should handle custom base URL', () => {
      const client = new HttpClient({
        apiKey: 'op_abcdefgh12345678',
        baseUrl: 'https://custom.domain.com',
      });
      const url = (client as any).buildUrl('/payments');
      expect(url).toBe('https://custom.domain.com/api/v1/payments');
    });

    it('should handle trailing slashes in base URL', () => {
      const client = new HttpClient({
        apiKey: 'op_abcdefgh12345678',
        baseUrl: 'https://custom.domain.com/',
      });
      const url = (client as any).buildUrl('/payments');
      expect(url).toBe('https://custom.domain.com/api/v1/payments');
    });
  });

  describe('buildHeaders', () => {
    it('should include Authorization header', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      const headers = (client as any).buildHeaders();
      expect(headers['Authorization']).toBe('Bearer op_abcdefgh12345678');
    });

    it('should include User-Agent header', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      const headers = (client as any).buildHeaders();
      expect(headers['User-Agent']).toBe('OwnPay-NodeJS/1.0.0');
    });

    it('should include X-Request-ID header', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      const headers = (client as any).buildHeaders();
      expect(headers['X-Request-ID']).toBeDefined();
    });

    it('should include Idempotency-Key when provided', () => {
      const client = new HttpClient({ apiKey: 'op_abcdefgh12345678' });
      const headers = (client as any).buildHeaders({
        idempotencyKey: 'test-key-123',
      });
      expect(headers['Idempotency-Key']).toBe('test-key-123');
    });

    it('should merge custom headers', () => {
      const client = new HttpClient({
        apiKey: 'op_abcdefgh12345678',
        headers: { 'X-Custom': 'value' },
      });
      const headers = (client as any).buildHeaders();
      expect(headers['X-Custom']).toBe('value');
    });
  });
});
