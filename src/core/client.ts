/**
 * OwnPay Node.js SDK - HTTP Client
 *
 * Core HTTP client that handles all API communication.
 * Uses native fetch API with retry logic, timeout handling, and error classification.
 */

import type {
  OwnPayConfig,
  RequestOptions,
  RequestConfig,
  HttpMethod,
} from './types.js';
import {
  OwnPayError,
  NetworkError,
  AbortError,
  createErrorFromResponse,
} from './errors.js';
import {
  isValidApiKeyFormat,
  buildQueryString,
  sleep,
  calculateBackoff,
  generateUUID,
} from './utils.js';

/**
 * Default configuration values.
 */
const DEFAULT_CONFIG = {
  BASE_URL: 'https://api.ownpay.com',
  TIMEOUT: 30000,
  MAX_RETRIES: 2,
  API_VERSION: 'v1',
  USER_AGENT: 'OwnPay-NodeJS/1.0.0',
} as const;

/**
 * HTTP status codes that are eligible for automatic retry.
 */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

/**
 * Core HTTP client for the OwnPay API.
 *
 * Handles authentication, request signing, retry logic, and error handling.
 * All API resource classes use this client internally.
 *
 * @internal
 */
export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly apiVersion: string;
  private readonly defaultHeaders: Record<string, string>;

  constructor(config: OwnPayConfig) {
    // Validate API key format
    if (!isValidApiKeyFormat(config.apiKey)) {
      throw new OwnPayError(
        'Invalid API key format. API key must start with "op_" and be at least 12 characters.',
        'INVALID_CONFIG'
      );
    }

    this.apiKey = config.apiKey;
    this.baseUrl = (config.baseUrl || DEFAULT_CONFIG.BASE_URL).replace(/\/+$/, '');
    this.timeout = config.timeout ?? DEFAULT_CONFIG.TIMEOUT;
    this.maxRetries = config.maxRetries ?? DEFAULT_CONFIG.MAX_RETRIES;
    this.apiVersion = config.apiVersion ?? DEFAULT_CONFIG.API_VERSION;

    this.defaultHeaders = {
      'User-Agent': DEFAULT_CONFIG.USER_AGENT,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  /**
   * Makes an HTTP request to the OwnPay API.
   *
   * @param config - Request configuration
   * @returns Parsed API response
   */
  async request<T>(config: RequestConfig): Promise<T> {
    const { method, path, query, body, options } = config;
    let lastError: OwnPayError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.executeRequest<T>(method, path, query, body, options);
      } catch (error) {
        if (error instanceof OwnPayError) {
          lastError = error;

          // Don't retry if:
          // 1. Not a retryable error
          // 2. Request was aborted
          // 3. This was the last attempt
          if (
            error instanceof AbortError ||
            !this.isRetryableError(error) ||
            attempt === this.maxRetries
          ) {
            throw error;
          }

          // Calculate backoff delay
          const retryAfter = 'retryAfter' in error
            ? (error as { retryAfter?: number }).retryAfter
            : undefined;
          const delay = retryAfter
            ? retryAfter * 1000
            : calculateBackoff(attempt);

          await sleep(delay);
          continue;
        }

        // Non-OwnPay errors are not retryable
        throw error;
      }
    }

    // This should never be reached, but TypeScript needs it
    throw lastError || new NetworkError('Request failed after all retries');
  }

  /**
   * Executes a single HTTP request.
   */
  private async executeRequest<T>(
    method: HttpMethod,
    path: string,
    query?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = this.buildUrl(path, query);
    const headers = this.buildHeaders(options);
    const timeout = options?.timeout ?? this.timeout;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Combine external signal with our timeout signal
    const { signal, cleanup } = options?.signal
      ? this.combineSignals(options.signal, controller.signal)
      : { signal: controller.signal, cleanup: () => {} };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);
      cleanup();

      // Parse response body
      const responseText = await response.text();
      let responseData: Record<string, unknown>;

      try {
        responseData = JSON.parse(responseText) as Record<string, unknown>;
      } catch {
        // If response is not JSON, create a generic error
        throw new NetworkError(
          `Invalid JSON response from API: ${responseText.slice(0, 200)}`
        );
      }

      // Handle error responses
      if (!response.ok) {
        throw createErrorFromResponse(
          response.status,
          responseData as unknown as Parameters<typeof createErrorFromResponse>[1]
        );
      }

      // Return the parsed response
      return responseData as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      cleanup();

      // Handle abort errors (works across all Node.js versions >= 18)
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AbortError('Request timed out');
      }

      // Re-throw OwnPay errors
      if (error instanceof OwnPayError) {
        throw error;
      }

      // Handle network errors (TypeError from undici, or errors with cause)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network request failed', error);
      }

      // Handle undici's other network error shapes (e.g., ENOTFOUND, ECONNREFUSED)
      if (error instanceof Error && 'cause' in error) {
        throw new NetworkError(error.message, error);
      }

      // Wrap unknown errors
      if (error instanceof Error) {
        throw new NetworkError(error.message, error);
      }

      throw new NetworkError('Unknown network error');
    }
  }

  /**
   * Builds the full request URL.
   */
  private buildUrl(
    path: string,
    query?: Record<string, string | number | boolean | undefined>
  ): string {
    const basePath = `/api/${this.apiVersion}`;
    const fullPath = path.startsWith('/') ? path : `/${path}`;
    const queryString = query ? buildQueryString(query) : '';
    return `${this.baseUrl}${basePath}${fullPath}${queryString}`;
  }

  /**
   * Builds request headers including authentication.
   */
  private buildHeaders(options?: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Request-ID': generateUUID(),
    };

    // Add idempotency key if provided
    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    // Add custom headers
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  /**
   * Combines two abort signals (external + timeout).
   * Returns a combined signal and a cleanup function to remove listeners.
   */
  private combineSignals(
    external: AbortSignal,
    timeout: AbortSignal
  ): { signal: AbortSignal; cleanup: () => void } {
    const controller = new AbortController();
    const onAbort = () => controller.abort();

    if (external.aborted || timeout.aborted) {
      controller.abort();
      return { signal: controller.signal, cleanup: () => {} };
    }

    external.addEventListener('abort', onAbort, { once: true });
    timeout.addEventListener('abort', onAbort, { once: true });

    const cleanup = () => {
      external.removeEventListener('abort', onAbort);
      timeout.removeEventListener('abort', onAbort);
    };

    return { signal: controller.signal, cleanup };
  }

  /**
   * Determines if an error is eligible for retry.
   */
  private isRetryableError(error: OwnPayError): boolean {
    // Network errors are retryable
    if (error instanceof NetworkError) return true;

    // Check status code
    if (error.status && RETRYABLE_STATUS_CODES.has(error.status)) {
      return true;
    }

    return false;
  }
}
