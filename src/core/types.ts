/**
 * OwnPay Node.js SDK - Type Definitions
 *
 * Comprehensive type definitions for the OwnPay Payment Gateway API.
 * All types are derived from the actual PHP API controllers.
 */

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration options for the OwnPay client.
 */
export interface OwnPayConfig {
  /** API key starting with 'op_' prefix */
  apiKey: string;
  /** Base URL for the API (default: auto-detect from API key) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
  /** Maximum number of retry attempts (default: 2) */
  maxRetries?: number;
  /** Custom headers to include in all requests */
  headers?: Record<string, string>;
  /** API version (default: 'v1') */
  apiVersion?: string;
}

/**
 * Request options that can be passed per-request.
 */
export interface RequestOptions {
  /** Idempotency key for safe request retries */
  idempotencyKey?: string;
  /** Custom headers for this specific request */
  headers?: Record<string, string>;
  /** Request timeout override in milliseconds */
  timeout?: number;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
}

// ============================================================================
// API Response Envelope
// ============================================================================

/**
 * Standard success response from the OwnPay API.
 */
export interface ApiResponse<T = unknown> {
  /** Always true for successful responses */
  success: true;
  /** Response data payload */
  data: T;
  /** Optional pagination or metadata */
  meta?: PaginationMeta;
}

/**
 * Standard error response from the OwnPay API.
 */
export interface ApiErrorResponse {
  /** Always false for error responses */
  success: false;
  /** Human-readable error message */
  error: string;
  /** Structured error details */
  errors: ApiErrorDetail[];
  /** Unique request identifier for debugging */
  request_id: string;
}

/**
 * Individual error detail in an error response.
 */
export interface ApiErrorDetail {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Optional field name that caused the error */
  field?: string | null;
}

/**
 * Pagination metadata for list endpoints.
 */
export interface PaginationMeta {
  /** Current page number */
  page: number;
  /** Items per page */
  per_page: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  total_pages: number;
}

// ============================================================================
// Payment Types
// ============================================================================

/**
 * Parameters for creating a payment intent.
 */
export interface CreatePaymentParams {
  /** Payment amount (positive number) */
  amount: string | number;
  /** 3-letter ISO currency code (e.g., 'BDT', 'USD') */
  currency: string;
  /** Webhook notification URL */
  callback_url?: string;
  /** Success redirect URL */
  redirect_url?: string;
  /** Cancel redirect URL */
  cancel_url?: string;
  /** Customer email address */
  customer_email?: string;
  /** Customer full name (max 150 characters) */
  customer_name?: string;
  /** Customer phone number (max 30 characters) */
  customer_phone?: string;
  /** Merchant reference identifier */
  reference?: string;
  /** Preferred payment gateway slug */
  gateway?: string;
  /** Custom key-value metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Payment intent returned after creation.
 */
export interface PaymentIntent {
  /** Unique payment identifier (UUID) */
  payment_id: string;
  /** Payment intent token for checkout */
  token: string;
  /** URL to redirect customer for payment */
  checkout_url: string;
  /** Current payment status */
  status: PaymentStatus;
}

/**
 * Detailed payment information.
 */
export interface Payment {
  /** Transaction ID (null if no transaction yet) */
  id: number | null;
  /** OwnPay transaction reference (e.g., 'OP-XXXX') */
  trx_id: string | null;
  /** Gateway transaction ID */
  gateway_trx_id: string | null;
  /** Payment amount */
  amount: string | null;
  /** Currency code */
  currency: string | null;
  /** Processing fee */
  fee: string;
  /** Current status */
  status: string | null;
  /** Payment gateway used */
  gateway: string | null;
  /** Payment method */
  method: string | null;
  /** Merchant reference */
  reference: string | null;
  /** Creation timestamp */
  created_at: string | null;
  /** Completion timestamp */
  completed_at: string | null;
  /** Customer information (if available) */
  customer?: CustomerSummary;
}

/**
 * Customer summary attached to a payment.
 */
export interface CustomerSummary {
  /** Customer name */
  name: string | null;
  /** Customer email */
  email: string | null;
}

/**
 * Possible payment statuses.
 */
export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// ============================================================================
// Transaction Types
// ============================================================================

/**
 * Parameters for listing transactions.
 */
export interface ListTransactionsParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 25, max: 100) */
  per_page?: number;
  /** Filter by status */
  status?: string;
  /** Filter by gateway slug */
  gateway?: string;
  /** Filter from date (ISO format) */
  from?: string;
  /** Filter to date (ISO format) */
  to?: string;
}

/**
 * Transaction record.
 */
export interface Transaction {
  /** Internal transaction ID */
  id: number;
  /** OwnPay transaction reference */
  trx_id: string;
  /** Gateway transaction ID */
  gateway_trx_id: string | null;
  /** Transaction amount */
  amount: string;
  /** Currency code */
  currency: string;
  /** Processing fee */
  fee: string;
  /** Net amount after fees */
  net_amount: string | null;
  /** Transaction status */
  status: string;
  /** Gateway slug */
  gateway: string | null;
  /** Payment method */
  method: string | null;
  /** Merchant reference */
  reference: string | null;
  /** Creation timestamp */
  created_at: string;
  /** Last update timestamp */
  updated_at: string | null;
}

// ============================================================================
// Refund Types
// ============================================================================

/**
 * Parameters for creating a refund.
 */
export interface CreateRefundParams {
  /** Transaction ID or OwnPay reference */
  transaction_id?: string | number;
  /** OwnPay transaction reference */
  trx_id?: string | number;
  /** Refund amount (partial refund if less than original) */
  amount?: string | number;
  /** Reason for refund */
  reason?: string;
}

/**
 * Parameters for listing refunds.
 */
export interface ListRefundsParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 25, max: 100) */
  per_page?: number;
  /** Filter by status */
  status?: string;
  /** Filter by transaction reference */
  trx_id?: string;
  /** Filter by transaction ID */
  transaction_id?: string | number;
  /** Filter from date (ISO format) */
  from?: string;
  /** Filter to date (ISO format) */
  to?: string;
}

/**
 * Refund record.
 */
export interface Refund {
  /** Internal refund ID */
  id: number | null;
  /** Refund UUID */
  uuid: string | null;
  /** Associated transaction ID */
  transaction_id: number | null;
  /** OwnPay transaction reference */
  trx_id: string | null;
  /** Gateway transaction ID */
  gateway_trx_id: string | null;
  /** Refund amount */
  amount: string | null;
  /** Refund reason */
  reason: string | null;
  /** Refund status */
  status: string | null;
  /** Processing timestamp */
  processed_at: string | null;
  /** Creation timestamp */
  created_at: string | null;
}

// ============================================================================
// Customer Types
// ============================================================================

/**
 * Parameters for creating a customer.
 */
export interface CreateCustomerParams {
  /** Customer full name (required) */
  name: string;
  /** Customer email address */
  email?: string;
  /** Customer phone number */
  phone?: string;
}

/**
 * Parameters for listing customers.
 */
export interface ListCustomersParams {
  /** Page number (default: 1) */
  page?: number;
  /** Items per page (default: 25, max: 100) */
  per_page?: number;
}

/**
 * Customer record.
 */
export interface Customer {
  /** Internal customer ID */
  id: number;
  /** Customer UUID */
  uuid: string;
  /** Customer name */
  name: string | null;
  /** Customer email */
  email: string | null;
  /** Customer phone */
  phone: string | null;
  /** Masked email for display */
  email_masked?: string | null;
  /** Masked phone for display */
  phone_masked?: string | null;
  /** Creation timestamp */
  created_at: string;
}

// ============================================================================
// API Key Types
// ============================================================================

/**
 * Parameters for generating an API key.
 */
export interface GenerateApiKeyParams {
  /** Key name/label (default: 'Default') */
  name?: string;
  /** Key permission scopes (default: ['read', 'write']) */
  scopes?: ApiKeyScope[];
}

/**
 * API key permission scope.
 */
export type ApiKeyScope = 'read' | 'write' | 'admin';

/**
 * API key metadata (without the actual key).
 */
export interface ApiKey {
  /** Internal key ID */
  id: number;
  /** Key name/label */
  name: string;
  /** Key prefix for identification */
  prefix: string | null;
  /** Key status */
  status: 'active' | 'revoked';
  /** Last usage timestamp */
  last_used: string | null;
  /** Expiration timestamp */
  expires_at: string | null;
  /** Creation timestamp */
  created_at: string;
}

/**
 * API key generation response (includes the actual key).
 */
export interface GeneratedApiKey {
  /** The actual API key (shown only once) */
  key: string;
  /** Key prefix for identification */
  prefix: string | null;
  /** Security warning */
  warning: string;
}

// ============================================================================
// Webhook Types
// ============================================================================

/**
 * Webhook test result.
 */
export interface WebhookTestResult {
  /** HTTP status code from the webhook endpoint */
  status_code: number | null;
  /** Response time in milliseconds */
  response_time_ms: number | null;
}

/**
 * Webhook delivery record.
 */
export interface WebhookDelivery {
  /** Delivery ID */
  id: number;
  /** Event name */
  event: string;
  /** Webhook URL */
  url: string;
  /** Delivery direction */
  direction: 'outbound' | 'inbound';
  /** HTTP status code */
  status_code: number | null;
  /** Response time in milliseconds */
  response_time_ms: number | null;
  /** Attempt number */
  attempt: number;
  /** Delivery status */
  status: string;
  /** Creation timestamp */
  created_at: string;
}

/**
 * Webhook event payload structure.
 */
export interface WebhookPayload {
  /** Event type (e.g., 'payment.completed') */
  event: string;
  /** OwnPay transaction reference */
  transaction_id: string;
  /** Gateway transaction ID */
  gateway_trx_id: string;
  /** Transaction amount */
  amount: string;
  /** Currency code */
  currency: string;
  /** Processing fee */
  fee: string;
  /** Gateway slug */
  gateway: string;
  /** Gateway type */
  gateway_type: string;
  /** Transaction status */
  status: string;
  /** Customer information */
  customer: {
    /** Customer name */
    name: string;
    /** Customer email */
    email: string;
    /** Customer phone */
    phone: string;
  };
  /** Custom metadata */
  metadata: Record<string, unknown>;
  /** Event timestamp (ISO format) */
  timestamp: string;
}

/**
 * Parameters for webhook signature verification.
 */
export interface WebhookVerificationParams {
  /** Raw request body (string or Buffer) */
  payload: string | Buffer;
  /** Signature from X-OwnPay-Signature header */
  signature: string;
  /** Webhook secret key */
  secret: string;
  /** Optional: timestamp from X-OwnPay-Timestamp header for replay protection */
  timestamp?: string | number;
  /** Optional: maximum age in seconds for replay protection (default: 300) */
  tolerance?: number;
}

// ============================================================================
// Health Types
// ============================================================================

/**
 * System health check response.
 */
export interface HealthStatus {
  /** Overall system status */
  status: 'healthy' | 'degraded';
  /** Application version */
  version: string;
  /** Database connection status */
  db: 'connected' | 'error';
  /** Mobile companion app status */
  mobile: {
    /** Whether any device is connected */
    connected: boolean;
    /** Number of active devices */
    active_devices: number;
  };
  /** Number of active payment gateways */
  gateways: number;
  /** Total customer count */
  customers: number;
  /** Server timestamp (ISO format) */
  time: string;
}

// ============================================================================
// Internal Types
// ============================================================================

/**
 * HTTP methods supported by the API.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Internal request configuration.
 */
export interface RequestConfig {
  /** HTTP method */
  method: HttpMethod;
  /** Request path (relative to base URL) */
  path: string;
  /** Query parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Request body (for POST/PUT/PATCH) */
  body?: unknown;
  /** Request options */
  options?: RequestOptions;
}

/**
 * Paginated list response.
 */
export interface PaginatedList<T> {
  /** Array of items */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}
