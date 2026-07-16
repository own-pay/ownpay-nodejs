/**
 * Tests for webhook signature verification
 */

import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  verifyWebhookSignature,
  generateSignature,
  parseWebhookPayload,
} from '../src/webhooks/verify.js';
import { WebhookVerificationError } from '../src/core/errors.js';

describe('Webhook Verification', () => {
  const secret = 'whsec_test_secret_key_12345';
  const payload = JSON.stringify({
    event: 'payment.completed',
    transaction_id: 'OP-ABC123',
    amount: '100.00',
    currency: 'BDT',
    status: 'completed',
  });

  const validSignature = createHmac('sha256', secret).update(payload).digest('hex');
  const validTimestamp = String(Math.floor(Date.now() / 1000));

  describe('generateSignature', () => {
    it('should generate HMAC-SHA256 signature', () => {
      const signature = generateSignature(payload, secret);
      expect(signature).toBe(validSignature);
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should generate consistent signatures', () => {
      const sig1 = generateSignature(payload, secret);
      const sig2 = generateSignature(payload, secret);
      expect(sig1).toBe(sig2);
    });

    it('should throw for missing payload', () => {
      expect(() => generateSignature('', secret)).toThrow(WebhookVerificationError);
    });

    it('should throw for missing secret', () => {
      expect(() => generateSignature(payload, '')).toThrow(WebhookVerificationError);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const result = verifyWebhookSignature({
        payload,
        signature: validSignature,
        secret,
      });

      expect(result).toBe(true);
    });

    it('should verify valid signature with timestamp', () => {
      const result = verifyWebhookSignature({
        payload,
        signature: validSignature,
        secret,
        timestamp: validTimestamp,
      });

      expect(result).toBe(true);
    });

    it('should reject invalid signature', () => {
      expect(() =>
        verifyWebhookSignature({
          payload,
          signature: 'invalid_signature',
          secret,
        })
      ).toThrow(WebhookVerificationError);
    });

    it('should reject tampered payload', () => {
      const tamperedPayload = payload.replace('100.00', '999.99');
      expect(() =>
        verifyWebhookSignature({
          payload: tamperedPayload,
          signature: validSignature,
          secret,
        })
      ).toThrow(WebhookVerificationError);
    });

    it('should reject wrong secret', () => {
      expect(() =>
        verifyWebhookSignature({
          payload,
          signature: validSignature,
          secret: 'wrong_secret',
        })
      ).toThrow(WebhookVerificationError);
    });

    it('should throw for missing payload', () => {
      expect(() =>
        verifyWebhookSignature({
          payload: '',
          signature: validSignature,
          secret,
        })
      ).toThrow('payload is required');
    });

    it('should throw for missing signature', () => {
      expect(() =>
        verifyWebhookSignature({
          payload,
          signature: '',
          secret,
        })
      ).toThrow('signature is required');
    });

    it('should throw for missing secret', () => {
      expect(() =>
        verifyWebhookSignature({
          payload,
          signature: validSignature,
          secret: '',
        })
      ).toThrow('secret is required');
    });

    it('should reject expired timestamp', () => {
      const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600); // 10 minutes ago

      expect(() =>
        verifyWebhookSignature({
          payload,
          signature: validSignature,
          secret,
          timestamp: oldTimestamp,
          tolerance: 300, // 5 minutes
        })
      ).toThrow('too old');
    });

    it('should accept timestamp within tolerance', () => {
      const recentTimestamp = String(Math.floor(Date.now() / 1000) - 60); // 1 minute ago

      const result = verifyWebhookSignature({
        payload,
        signature: validSignature,
        secret,
        timestamp: recentTimestamp,
        tolerance: 300,
      });

      expect(result).toBe(true);
    });

    it('should handle Buffer payload', () => {
      const bufferPayload = Buffer.from(payload);

      const result = verifyWebhookSignature({
        payload: bufferPayload,
        signature: validSignature,
        secret,
      });

      expect(result).toBe(true);
    });

    it('should handle millisecond timestamp', () => {
      const msTimestamp = String(Date.now());

      const result = verifyWebhookSignature({
        payload,
        signature: validSignature,
        secret,
        timestamp: msTimestamp,
      });

      expect(result).toBe(true);
    });
  });

  describe('parseWebhookPayload', () => {
    it('should parse valid JSON string', () => {
      const result = parseWebhookPayload(payload);
      expect(result).toEqual(JSON.parse(payload));
    });

    it('should parse Buffer payload', () => {
      const buffer = Buffer.from(payload);
      const result = parseWebhookPayload(buffer);
      expect(result).toEqual(JSON.parse(payload));
    });

    it('should throw for invalid JSON', () => {
      expect(() => parseWebhookPayload('invalid json')).toThrow(WebhookVerificationError);
    });
  });
});
