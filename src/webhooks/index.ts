/**
 * OwnPay Node.js SDK - Webhooks Module
 *
 * Standalone module for webhook signature verification.
 * Import from '@ownpay/nodejs/webhooks' for tree-shakeable webhook utilities.
 *
 * @example
 * ```typescript
 * import { verifyWebhookSignature, generateSignature } from '@ownpay/nodejs/webhooks';
 * ```
 */

export {
  verifyWebhookSignature,
  generateSignature,
  parseWebhookPayload,
} from './verify.js';

export type { WebhookVerificationParams, WebhookPayload } from '../core/types.js';
export { WebhookVerificationError } from '../core/errors.js';
