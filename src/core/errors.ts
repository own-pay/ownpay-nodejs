/**
 * OwnPay Node.js SDK - Error Classes
 *
 * Comprehensive error hierarchy for the OwnPay API.
 * Each error class provides specific context for different failure scenarios.
 */

import type { ApiErrorDetail } from './types.js';

/**
 * Base error class for all OwnPay SDK errors.
 * Provides common properties and methods for error handling.
 */
export class OwnPayError extends Error {
  /** The error type identifier */
  readonly type: string;
  /** HTTP status code (if applicable) */
  readonly status: number | undefined;
  /** Unique request identifier for debugging */
  readonly requestId: string | undefined;
  /** Raw error response from the API */
  readonly rawResponse: unknown;

  constructor(
    message: string,
    type: string,
    status?: number,
    requestId?: string,
    rawResponse?: unknown
  ) {
    super(message);
    this.name = 'OwnPayError';
    this.type = type;
    this.status = status;
    this.requestId = requestId;
    this.rawResponse = rawResponse;

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Returns a JSON representation of the error for logging.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      status: this.status,
      requestId: this.requestId,
    };
  }
}

/**
 * Thrown when API authentication fails (401).
 * Indicates an invalid, missing, or revoked API key.
 */
export class AuthenticationError extends OwnPayError {
  constructor(message: string, requestId?: string, rawResponse?: unknown) {
    super(message, 'AUTHENTICATION_ERROR', 401, requestId, rawResponse);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the API key lacks required permissions (403).
 * Indicates insufficient scope (e.g., read-only key attempting a write operation).
 */
export class PermissionError extends OwnPayError {
  constructor(message: string, requestId?: string, rawResponse?: unknown) {
    super(message, 'PERMISSION_ERROR', 403, requestId, rawResponse);
    this.name = 'PermissionError';
  }
}

/**
 * Thrown when a requested resource is not found (404).
 */
export class NotFoundError extends OwnPayError {
  /** The resource type that was not found */
  readonly resource: string | undefined;
  /** The identifier that was searched for */
  readonly resourceId: string | undefined;

  constructor(
    message: string,
    resource?: string,
    resourceId?: string,
    requestId?: string,
    rawResponse?: unknown
  ) {
    super(message, 'NOT_FOUND', 404, requestId, rawResponse);
    this.name = 'NotFoundError';
    this.resource = resource;
    this.resourceId = resourceId;
  }
}

/**
 * Thrown when request validation fails (422).
 * Contains structured error details for each invalid field.
 */
export class ValidationError extends OwnPayError {
  /** Array of individual validation errors */
  readonly errors: ApiErrorDetail[];

  constructor(
    message: string,
    errors: ApiErrorDetail[],
    requestId?: string,
    rawResponse?: unknown
  ) {
    super(message, 'VALIDATION_ERROR', 422, requestId, rawResponse);
    this.name = 'ValidationError';
    this.errors = errors;
  }

  /**
   * Returns errors grouped by field name.
   */
  getFieldErrors(): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};
    for (const error of this.errors) {
      const field = error.field || '_general';
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(error.message);
    }
    return fieldErrors;
  }

  /**
   * Returns the first error message for a specific field.
   */
  getFirstFieldError(field: string): string | undefined {
    const error = this.errors.find((e) => e.field === field);
    return error?.message;
  }
}

/**
 * Thrown when the API rate limit is exceeded (429).
 * Includes retry-after information when available.
 */
export class RateLimitError extends OwnPayError {
  /** Seconds to wait before retrying */
  readonly retryAfter: number | undefined;

  constructor(
    message: string,
    retryAfter?: number,
    requestId?: string,
    rawResponse?: unknown
  ) {
    super(message, 'RATE_LIMIT_ERROR', 429, requestId, rawResponse);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when an idempotency key conflict occurs (409).
 * Indicates a request with the same key is still processing.
 */
export class IdempotencyError extends OwnPayError {
  constructor(message: string, requestId?: string, rawResponse?: unknown) {
    super(message, 'IDEMPOTENCY_ERROR', 409, requestId, rawResponse);
    this.name = 'IdempotencyError';
  }
}

/**
 * Thrown when the API returns a server error (500, 502, 503, 504).
 */
export class ApiError extends OwnPayError {
  /** The error code from the API */
  readonly errorCode: string | undefined;

  constructor(
    message: string,
    errorCode?: string,
    status: number = 500,
    requestId?: string,
    rawResponse?: unknown
  ) {
    super(message, 'API_ERROR', status, requestId, rawResponse);
    this.name = 'ApiError';
    this.errorCode = errorCode;
  }
}

/**
 * Thrown when a network error occurs (connection failure, timeout, etc.).
 */
export class NetworkError extends OwnPayError {
  /** The underlying cause */
  override readonly cause: Error | undefined;

  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR');
    this.name = 'NetworkError';
    this.cause = cause;
  }
}

/**
 * Thrown when a request is aborted (via AbortSignal or timeout).
 */
export class AbortError extends OwnPayError {
  constructor(message: string = 'Request was aborted') {
    super(message, 'ABORT_ERROR');
    this.name = 'AbortError';
  }
}

/**
 * Thrown when webhook signature verification fails.
 */
export class WebhookVerificationError extends OwnPayError {
  constructor(message: string) {
    super(message, 'WEBHOOK_VERIFICATION_ERROR');
    this.name = 'WebhookVerificationError';
  }
}

/**
 * Creates the appropriate error class from an API error response.
 *
 * @internal
 */
export function createErrorFromResponse(
  status: number,
  body: {
    error?: string;
    errors?: ApiErrorDetail[];
    request_id?: string;
    [key: string]: unknown;
  }
): OwnPayError {
  const message = body.error || 'An unexpected error occurred';
  const requestId = body.request_id;
  const errors = body.errors || [];
  const rawResponse = body;

  switch (status) {
    case 401:
      return new AuthenticationError(message, requestId, rawResponse);

    case 403:
      return new PermissionError(message, requestId, rawResponse);

    case 404:
      return new NotFoundError(message, undefined, undefined, requestId, rawResponse);

    case 409:
      return new IdempotencyError(message, requestId, rawResponse);

    case 422:
      return new ValidationError(message, errors, requestId, rawResponse);

    case 429: {
      // Extract retry-after from response if available
      const retryAfter = body.retry_after;
      return new RateLimitError(
        message,
        typeof retryAfter === 'number' ? retryAfter : undefined,
        requestId,
        rawResponse
      );
    }

    default:
      if (status >= 500) {
        const errorCode = errors[0]?.code;
        return new ApiError(message, errorCode, status, requestId, rawResponse);
      }

      return new OwnPayError(message, 'UNKNOWN_ERROR', status, requestId, rawResponse);
  }
}
