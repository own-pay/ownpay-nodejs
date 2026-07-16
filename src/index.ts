/**
 * @ownpay/nodejs - Official Node.js SDK for the OwnPay Payment Gateway API
 *
 * A zero-dependency, TypeScript-first SDK for integrating with OwnPay.
 * Supports Node.js 18+ with native fetch API.
 *
 * @example
 * ```typescript
 * import OwnPay from '@ownpay/nodejs';
 *
 * const client = new OwnPay('op_your_api_key_here');
 *
 * // Create a payment
 * const payment = await client.payments.create({
 *   amount: '100.00',
 *   currency: 'BDT',
 *   customer_email: 'user@example.com',
 * });
 *
 * console.log(payment.checkout_url);
 * ```
 *
 * @module @ownpay/nodejs
 */

import { HttpClient } from './core/client.js';
import type { OwnPayConfig } from './core/types.js';
import { PaymentsResource } from './resources/payments.js';
import { TransactionsResource } from './resources/transactions.js';
import { RefundsResource } from './resources/refunds.js';
import { CustomersResource } from './resources/customers.js';
import { ApiKeysResource } from './resources/api-keys.js';
import { WebhooksResource } from './resources/webhooks.js';
import { HealthResource } from './resources/health.js';

/**
 * Main OwnPay client class.
 *
 * Provides access to all API resources through a single client instance.
 *
 * @example
 * ```typescript
 * // Initialize with API key
 * const client = new OwnPay('op_xxx...');
 *
 * // Initialize with options
 * const client = new OwnPay({
 *   apiKey: 'op_xxx...',
 *   timeout: 30000,
 *   maxRetries: 3,
 * });
 * ```
 */
export class OwnPay {
  /** HTTP client instance */
  private readonly client: HttpClient;

  /** Payment operations */
  public readonly payments: PaymentsResource;

  /** Transaction queries */
  public readonly transactions: TransactionsResource;

  /** Refund operations */
  public readonly refunds: RefundsResource;

  /** Customer management */
  public readonly customers: CustomersResource;

  /** API key management */
  public readonly apiKeys: ApiKeysResource;

  /** Webhook operations */
  public readonly webhooks: WebhooksResource;

  /** Health checks */
  public readonly health: HealthResource;

  /**
   * Creates a new OwnPay client instance.
   *
   * @param apiKeyOrConfig - API key string or configuration object
   *
   * @example
   * ```typescript
   * // Simple initialization
   * const client = new OwnPay('op_xxx...');
   *
   * // With configuration
   * const client = new OwnPay({
   *   apiKey: 'op_xxx...',
   *   baseUrl: 'https://custom.domain.com',
   *   timeout: 30000,
   *   maxRetries: 3,
   * });
   * ```
   */
  constructor(apiKeyOrConfig: string | OwnPayConfig) {
    // Handle string API key
    const config: OwnPayConfig =
      typeof apiKeyOrConfig === 'string'
        ? { apiKey: apiKeyOrConfig }
        : apiKeyOrConfig;

    // Create HTTP client
    this.client = new HttpClient(config);

    // Initialize resources
    this.payments = new PaymentsResource(this.client);
    this.transactions = new TransactionsResource(this.client);
    this.refunds = new RefundsResource(this.client);
    this.customers = new CustomersResource(this.client);
    this.apiKeys = new ApiKeysResource(this.client);
    this.webhooks = new WebhooksResource(this.client);
    this.health = new HealthResource(this.client);
  }
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export for CommonJS compatibility.
 *
 * @example
 * ```typescript
 * // ESM
 * import OwnPay from '@ownpay/nodejs';
 *
 * // CommonJS
 * const OwnPay = require('@ownpay/nodejs');
 * ```
 */
export default OwnPay;

// ============================================================================
// Named Exports
// ============================================================================

// Client
export { OwnPay as Client };

// Resources
export { PaymentsResource } from './resources/payments.js';
export { TransactionsResource } from './resources/transactions.js';
export { RefundsResource } from './resources/refunds.js';
export { CustomersResource } from './resources/customers.js';
export { ApiKeysResource } from './resources/api-keys.js';
export { WebhooksResource } from './resources/webhooks.js';
export { HealthResource } from './resources/health.js';

// Types
export type {
  // Configuration
  OwnPayConfig,
  RequestOptions,

  // API Response
  ApiResponse,
  ApiErrorResponse,
  ApiErrorDetail,
  PaginationMeta,
  PaginatedList,

  // Payment
  CreatePaymentParams,
  PaymentIntent,
  Payment,
  PaymentStatus,

  // Transaction
  ListTransactionsParams,
  Transaction,

  // Refund
  CreateRefundParams,
  ListRefundsParams,
  Refund,

  // Customer
  CreateCustomerParams,
  ListCustomersParams,
  Customer,
  CustomerSummary,

  // API Key
  GenerateApiKeyParams,
  ApiKey,
  GeneratedApiKey,
  ApiKeyScope,

  // Webhook
  WebhookTestResult,
  WebhookDelivery,
  WebhookPayload,
  WebhookVerificationParams,

  // Health
  HealthStatus,
} from './core/types.js';

// Errors
export {
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
} from './core/errors.js';

// Webhook utilities (re-exported for convenience)
export {
  verifyWebhookSignature,
  generateSignature,
  parseWebhookPayload,
} from './webhooks/verify.js';
