/**
 * OwnPay Node.js SDK - Utility Functions
 *
 * Internal helper functions used throughout the SDK.
 */

import { randomUUID, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';

/**
 * Generates a UUID v4 for idempotency keys and request tracking.
 * Uses node:crypto.randomUUID() which is available since Node.js 14.17.
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Validates that a string is a valid API key format.
 * API keys must start with 'op_' and be at least 12 characters.
 */
export function isValidApiKeyFormat(apiKey: string): boolean {
  return typeof apiKey === 'string' && apiKey.startsWith('op_') && apiKey.length >= 12;
}

/**
 * Validates that a string is a valid 3-letter ISO currency code.
 * Case-insensitive: 'bdt', 'BDT', 'Bdt' are all valid.
 */
export function isValidCurrencyCode(currency: string): boolean {
  return typeof currency === 'string' && /^[A-Z]{3}$/i.test(currency);
}

/**
 * Validates that a value is a positive number.
 */
export function isPositiveNumber(value: unknown): boolean {
  if (typeof value === 'number') {
    return value > 0 && Number.isFinite(value);
  }
  if (typeof value === 'string') {
    const num = Number(value);
    return !isNaN(num) && num > 0 && Number.isFinite(num);
  }
  return false;
}

/**
 * Validates that a string is a valid URL.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Builds a query string from a parameters object.
 * Filters out undefined and null values.
 */
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Sleeps for the specified number of milliseconds.
 * Used for retry backoff delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculates exponential backoff delay with jitter.
 *
 * @param attempt - The current retry attempt (0-based)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function calculateBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  // Add jitter (±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Truncates a string to a maximum length.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Safely parses a JSON string, returning undefined on failure.
 */
export function safeJsonParse<T = unknown>(json: string): T | undefined {
  try {
    return JSON.parse(json) as T;
  } catch {
    return undefined;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses Node.js native crypto.timingSafeEqual with length padding.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');

  // Pad both buffers to the same length to avoid length-based timing leaks
  const maxLen = Math.max(bufA.length, bufB.length);
  const paddedA = Buffer.alloc(maxLen);
  const paddedB = Buffer.alloc(maxLen);
  bufA.copy(paddedA);
  bufB.copy(paddedB);

  return cryptoTimingSafeEqual(paddedA, paddedB);
}

/**
 * Type guard to check if a value is a non-null object.
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Removes undefined values from an object.
 */
export function removeUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

/**
 * Trims a string value if it's a string, returns as-is otherwise.
 */
export function trimIfString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}
