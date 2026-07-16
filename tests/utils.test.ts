/**
 * Tests for utility functions
 */

import { describe, it, expect } from 'vitest';
import {
  generateUUID,
  isValidApiKeyFormat,
  isValidCurrencyCode,
  isPositiveNumber,
  isValidUrl,
  buildQueryString,
  calculateBackoff,
  truncate,
  safeJsonParse,
  timingSafeEqual,
  isObject,
  removeUndefined,
} from '../src/core/utils.js';

describe('Utility Functions', () => {
  describe('generateUUID', () => {
    it('should generate valid UUID v4 format', () => {
      const uuid = generateUUID();
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('isValidApiKeyFormat', () => {
    it('should accept valid API keys', () => {
      expect(isValidApiKeyFormat('op_abcdefgh12345678')).toBe(true);
      expect(isValidApiKeyFormat('op_test_key_12345')).toBe(true);
    });

    it('should reject invalid API keys', () => {
      expect(isValidApiKeyFormat('')).toBe(false);
      expect(isValidApiKeyFormat('invalid')).toBe(false);
      expect(isValidApiKeyFormat('op_short')).toBe(false);
      expect(isValidApiKeyFormat('pk_abcdefgh12345678')).toBe(false);
    });
  });

  describe('isValidCurrencyCode', () => {
    it('should accept valid currency codes', () => {
      expect(isValidCurrencyCode('BDT')).toBe(true);
      expect(isValidCurrencyCode('USD')).toBe(true);
      expect(isValidCurrencyCode('EUR')).toBe(true);
      // Case-insensitive: lowercase is also valid
      expect(isValidCurrencyCode('usd')).toBe(true);
      expect(isValidCurrencyCode('bdt')).toBe(true);
    });

    it('should reject invalid currency codes', () => {
      expect(isValidCurrencyCode('')).toBe(false);
      expect(isValidCurrencyCode('USDX')).toBe(false);
      expect(isValidCurrencyCode('US')).toBe(false);
      expect(isValidCurrencyCode('123')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should accept positive numbers', () => {
      expect(isPositiveNumber(100)).toBe(true);
      expect(isPositiveNumber(0.01)).toBe(true);
      expect(isPositiveNumber('100')).toBe(true);
      expect(isPositiveNumber('10.50')).toBe(true);
    });

    it('should reject non-positive values', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-100)).toBe(false);
      expect(isPositiveNumber('0')).toBe(false);
      expect(isPositiveNumber('-100')).toBe(false);
      expect(isPositiveNumber('abc')).toBe(false);
      expect(isPositiveNumber(null)).toBe(false);
      expect(isPositiveNumber(undefined)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('should accept valid HTTP/HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com:8080/path?query=1')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from params', () => {
      const qs = buildQueryString({ page: 1, per_page: 25, status: 'active' });
      expect(qs).toContain('page=1');
      expect(qs).toContain('per_page=25');
      expect(qs).toContain('status=active');
    });

    it('should skip undefined values', () => {
      const qs = buildQueryString({ page: 1, status: undefined });
      expect(qs).toBe('?page=1');
    });

    it('should return empty string for no params', () => {
      expect(buildQueryString({})).toBe('');
    });
  });

  describe('calculateBackoff', () => {
    it('should calculate exponential backoff', () => {
      const delay0 = calculateBackoff(0, 1000, 30000);
      const delay1 = calculateBackoff(1, 1000, 30000);
      const delay2 = calculateBackoff(2, 1000, 30000);

      // Should be approximately 1000, 2000, 4000 (with jitter)
      expect(delay0).toBeGreaterThan(750);
      expect(delay0).toBeLessThan(1250);
      expect(delay1).toBeGreaterThan(1500);
      expect(delay1).toBeLessThan(2500);
      expect(delay2).toBeGreaterThan(3000);
      expect(delay2).toBeLessThan(5000);
    });

    it('should respect max delay', () => {
      const delay = calculateBackoff(10, 1000, 5000);
      expect(delay).toBeLessThanOrEqual(5000);
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"key":"value"}')).toEqual({ key: 'value' });
      expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3]);
    });

    it('should return undefined for invalid JSON', () => {
      expect(safeJsonParse('invalid')).toBeUndefined();
      expect(safeJsonParse('{')).toBeUndefined();
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for equal strings', () => {
      expect(timingSafeEqual('hello', 'hello')).toBe(true);
      expect(timingSafeEqual('', '')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(timingSafeEqual('hello', 'world')).toBe(false);
      expect(timingSafeEqual('hello', 'hell')).toBe(false);
    });
  });

  describe('isObject', () => {
    it('should identify objects', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ key: 'value' })).toBe(true);
    });

    it('should reject non-objects', () => {
      expect(isObject(null)).toBe(false);
      expect(isObject([])).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe('removeUndefined', () => {
    it('should remove undefined values', () => {
      const result = removeUndefined({ a: 1, b: undefined, c: 'hello' });
      expect(result).toEqual({ a: 1, c: 'hello' });
    });

    it('should keep null values', () => {
      const result = removeUndefined({ a: null, b: undefined });
      expect(result).toEqual({ a: null });
    });
  });
});
