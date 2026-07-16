/**
 * OwnPay Node.js SDK - Webhook Signature Verification
 *
 * Standalone utility for verifying OwnPay webhook signatures.
 * Uses HMAC-SHA256 for cryptographic verification.
 *
 * @module ownpay/webhooks
 */

import { createHmac, timingSafeEqual as cryptoTimingSafeEqual } from 'node:crypto';
import { WebhookVerificationError } from '../core/errors.js';
import type { WebhookVerificationParams } from '../core/types.js';

/**
 * Default tolerance for timestamp validation (5 minutes).
 */
const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Unix timestamps in seconds will be between ~0 and ~1e11 (year ~5138).
 * Timestamps above this threshold are assumed to be in milliseconds.
 */
const MILLISECOND_THRESHOLD = 1e12;

/**
 * Verifies an OwnPay webhook signature.
 *
 * This function verifies that the webhook payload was sent by OwnPay
 * and has not been tampered with. It supports optional timestamp
 * validation for replay attack protection.
 *
 * @param params - Verification parameters
 * @returns true if the signature is valid
 * @throws {WebhookVerificationError} If the signature is invalid
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature } from '@ownpay/nodejs/webhooks';
 *
 * // In your webhook handler
 * app.post('/webhook', (req, res) => {
 *   try {
 *     verifyWebhookSignature({
 *       payload: req.body,
 *       signature: req.headers['x-ownpay-signature'],
 *       secret: process.env.OWNPAY_WEBHOOK_SECRET,
 *       timestamp: req.headers['x-ownpay-timestamp'],
 *     });
 *
 *     // Signature is valid, process the webhook
 *     const event = JSON.parse(req.body);
 *     handleWebhookEvent(event);
 *
 *     res.status(200).json({ received: true });
 *   } catch (error) {
 *     res.status(400).json({ error: 'Invalid signature' });
 *   }
 * });
 * ```
 */
export function verifyWebhookSignature(params: WebhookVerificationParams): boolean {
  const { payload, signature, secret, timestamp, tolerance = DEFAULT_TOLERANCE_SECONDS } = params;

  // Validate required parameters
  if (!payload) {
    throw new WebhookVerificationError('Webhook payload is required');
  }

  if (!signature) {
    throw new WebhookVerificationError('Webhook signature is required');
  }

  if (!secret) {
    throw new WebhookVerificationError('Webhook secret is required');
  }

  // Convert payload to string if it's a Buffer
  const payloadStr = typeof payload === 'string' ? payload : payload.toString('utf-8');

  // Generate expected signature
  const expectedSignature = generateSignature(payloadStr, secret);

  // Verify signature using constant-time comparison
  if (!timingSafeCompare(signature, expectedSignature)) {
    throw new WebhookVerificationError(
      'Invalid webhook signature. The payload may have been tampered with.'
    );
  }

  // Verify timestamp if provided (replay attack protection)
  if (timestamp !== undefined && timestamp !== null) {
    verifyTimestamp(timestamp, tolerance);
  }

  return true;
}

/**
 * Generates an HMAC-SHA256 signature for a payload.
 *
 * @param payload - The payload string to sign
 * @param secret - The webhook secret key
 * @returns Hex-encoded signature
 *
 * @example
 * ```typescript
 * import { generateSignature } from '@ownpay/nodejs/webhooks';
 *
 * const signature = generateSignature('{"event":"payment.completed"}', 'whsec_...');
 * ```
 */
export function generateSignature(payload: string, secret: string): string {
  if (!payload || !secret) {
    throw new WebhookVerificationError('Payload and secret are required for signature generation');
  }

  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verifies that a webhook timestamp is within the acceptable tolerance.
 *
 * @param timestamp - The timestamp from the X-OwnPay-Timestamp header
 * @param tolerance - Maximum age in seconds (default: 300)
 * @throws {WebhookVerificationError} If the timestamp is too old or invalid
 */
function verifyTimestamp(timestamp: string | number, tolerance: number): void {
  // Validate tolerance is a finite positive number
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new WebhookVerificationError(
      `Invalid tolerance value: ${tolerance}. Must be a positive number.`
    );
  }

  let timestampSeconds: number;

  if (typeof timestamp === 'string') {
    timestampSeconds = parseInt(timestamp, 10);
    if (isNaN(timestampSeconds)) {
      throw new WebhookVerificationError('Invalid webhook timestamp format');
    }
  } else {
    timestampSeconds = timestamp;
  }

  // Validate timestamp is positive
  if (timestampSeconds <= 0) {
    throw new WebhookVerificationError('Webhook timestamp must be a positive number');
  }

  // Convert to seconds if it looks like milliseconds
  // Unix timestamps in seconds won't exceed ~1e11 until year ~5138
  if (timestampSeconds > MILLISECOND_THRESHOLD) {
    timestampSeconds = Math.floor(timestampSeconds / 1000);
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const age = Math.abs(currentTime - timestampSeconds);

  if (age > tolerance) {
    throw new WebhookVerificationError(
      `Webhook timestamp is too old. Age: ${age}s, Tolerance: ${tolerance}s. ` +
      'This may indicate a replay attack.'
    );
  }
}

/**
 * Performs constant-time string comparison to prevent timing attacks.
 * Uses Node.js native crypto.timingSafeEqual with length padding.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
function timingSafeCompare(a: string, b: string): boolean {
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
 * Parses a webhook payload from a raw request body.
 *
 * @param body - Raw request body (string or Buffer)
 * @returns Parsed webhook payload
 * @throws {WebhookVerificationError} If the payload is invalid JSON
 *
 * @example
 * ```typescript
 * import { parseWebhookPayload } from '@ownpay/nodejs/webhooks';
 *
 * const payload = parseWebhookPayload(req.body);
 * console.log(payload.event); // 'payment.completed'
 * ```
 */
export function parseWebhookPayload<T = Record<string, unknown>>(
  body: string | Buffer
): T {
  const bodyStr = typeof body === 'string' ? body : body.toString('utf-8');

  try {
    return JSON.parse(bodyStr) as T;
  } catch {
    throw new WebhookVerificationError('Invalid webhook payload: not valid JSON');
  }
}
