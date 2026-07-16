/**
 * Tests for error classes
 */

import { describe, it, expect } from 'vitest';
import {
  OwnPayError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  IdempotencyError,
  ApiError,
  NetworkError,
  AbortError,
  WebhookVerificationError,
  createErrorFromResponse,
} from '../src/core/errors.js';

describe('Error Classes', () => {
  describe('OwnPayError', () => {
    it('should create base error with all properties', () => {
      const error = new OwnPayError('Test error', 'TEST_ERROR', 400, 'req-123', { foo: 'bar' });

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('TEST_ERROR');
      expect(error.status).toBe(400);
      expect(error.requestId).toBe('req-123');
      expect(error.rawResponse).toEqual({ foo: 'bar' });
      expect(error.name).toBe('OwnPayError');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(OwnPayError);
    });

    it('should serialize to JSON correctly', () => {
      const error = new OwnPayError('Test', 'TEST', 400, 'req-123');
      const json = error.toJSON();

      expect(json).toEqual({
        name: 'OwnPayError',
        type: 'TEST',
        message: 'Test',
        status: 400,
        requestId: 'req-123',
      });
    });
  });

  describe('AuthenticationError', () => {
    it('should create with correct properties', () => {
      const error = new AuthenticationError('Invalid API key', 'req-123');

      expect(error.message).toBe('Invalid API key');
      expect(error.type).toBe('AUTHENTICATION_ERROR');
      expect(error.status).toBe(401);
      expect(error.name).toBe('AuthenticationError');
      expect(error).toBeInstanceOf(OwnPayError);
    });
  });

  describe('PermissionError', () => {
    it('should create with correct properties', () => {
      const error = new PermissionError('Insufficient scope', 'req-123');

      expect(error.type).toBe('PERMISSION_ERROR');
      expect(error.status).toBe(403);
      expect(error.name).toBe('PermissionError');
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource info', () => {
      const error = new NotFoundError('Not found', 'payment', 'pay-123', 'req-123');

      expect(error.type).toBe('NOT_FOUND');
      expect(error.status).toBe(404);
      expect(error.resource).toBe('payment');
      expect(error.resourceId).toBe('pay-123');
    });
  });

  describe('ValidationError', () => {
    it('should create with error details', () => {
      const errors = [
        { code: 'INVALID_AMOUNT', message: 'Amount required', field: 'amount' },
        { code: 'INVALID_CURRENCY', message: 'Currency required', field: 'currency' },
      ];
      const error = new ValidationError('Validation failed', errors, 'req-123');

      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(422);
      expect(error.errors).toHaveLength(2);
    });

    it('should group errors by field', () => {
      const errors = [
        { code: 'INVALID_AMOUNT', message: 'Must be positive', field: 'amount' },
        { code: 'INVALID_AMOUNT', message: 'Required', field: 'amount' },
        { code: 'INVALID_CURRENCY', message: 'Required', field: 'currency' },
      ];
      const error = new ValidationError('Failed', errors);

      const fieldErrors = error.getFieldErrors();
      expect(fieldErrors['amount']).toHaveLength(2);
      expect(fieldErrors['currency']).toHaveLength(1);
    });

    it('should get first error for a field', () => {
      const errors = [
        { code: 'INVALID_AMOUNT', message: 'Must be positive', field: 'amount' },
        { code: 'INVALID_AMOUNT', message: 'Required', field: 'amount' },
      ];
      const error = new ValidationError('Failed', errors);

      expect(error.getFirstFieldError('amount')).toBe('Must be positive');
      expect(error.getFirstFieldError('nonexistent')).toBeUndefined();
    });
  });

  describe('RateLimitError', () => {
    it('should create with retry-after', () => {
      const error = new RateLimitError('Too many requests', 30, 'req-123');

      expect(error.type).toBe('RATE_LIMIT_ERROR');
      expect(error.status).toBe(429);
      expect(error.retryAfter).toBe(30);
    });
  });

  describe('IdempotencyError', () => {
    it('should create with correct properties', () => {
      const error = new IdempotencyError('Conflict', 'req-123');

      expect(error.type).toBe('IDEMPOTENCY_ERROR');
      expect(error.status).toBe(409);
    });
  });

  describe('ApiError', () => {
    it('should create with error code', () => {
      const error = new ApiError('Server error', 'INTERNAL_ERROR', 500, 'req-123');

      expect(error.type).toBe('API_ERROR');
      expect(error.status).toBe(500);
      expect(error.errorCode).toBe('INTERNAL_ERROR');
    });
  });

  describe('NetworkError', () => {
    it('should create with cause', () => {
      const cause = new Error('Connection refused');
      const error = new NetworkError('Network failed', cause);

      expect(error.type).toBe('NETWORK_ERROR');
      expect(error.status).toBeUndefined();
      expect(error.cause).toBe(cause);
    });
  });

  describe('AbortError', () => {
    it('should create with default message', () => {
      const error = new AbortError();

      expect(error.type).toBe('ABORT_ERROR');
      expect(error.message).toBe('Request was aborted');
    });
  });

  describe('WebhookVerificationError', () => {
    it('should create with message', () => {
      const error = new WebhookVerificationError('Invalid signature');

      expect(error.type).toBe('WEBHOOK_VERIFICATION_ERROR');
      expect(error.message).toBe('Invalid signature');
    });
  });

  describe('createErrorFromResponse', () => {
    it('should create AuthenticationError for 401', () => {
      const error = createErrorFromResponse(401, {
        error: 'Invalid key',
        errors: [{ code: 'AUTH', message: 'Invalid key' }],
        request_id: 'req-123',
      });

      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.status).toBe(401);
    });

    it('should create ValidationError for 422', () => {
      const error = createErrorFromResponse(422, {
        error: 'Validation failed',
        errors: [
          { code: 'INVALID', message: 'Bad value', field: 'amount' },
        ],
        request_id: 'req-123',
      });

      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).errors).toHaveLength(1);
    });

    it('should create RateLimitError for 429', () => {
      const error = createErrorFromResponse(429, {
        error: 'Too many requests',
        errors: [],
        request_id: 'req-123',
        retry_after: 60,
      });

      expect(error).toBeInstanceOf(RateLimitError);
      expect((error as RateLimitError).retryAfter).toBe(60);
    });

    it('should create ApiError for 500', () => {
      const error = createErrorFromResponse(500, {
        error: 'Internal error',
        errors: [{ code: 'INTERNAL', message: 'Internal error' }],
        request_id: 'req-123',
      });

      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(500);
    });
  });
});
