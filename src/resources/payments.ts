/**
 * OwnPay Node.js SDK - Payments Resource
 *
 * Handles payment intent creation and retrieval.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  CreatePaymentParams,
  PaymentIntent,
  Payment,
  RequestOptions,
} from '../core/types.js';
import { ValidationError } from '../core/errors.js';
import { isPositiveNumber, isValidCurrencyCode, isValidUrl } from '../core/utils.js';

/**
 * Resource for managing payment intents.
 *
 * @example
 * ```typescript
 * const payment = await client.payments.create({
 *   amount: '100.00',
 *   currency: 'BDT',
 *   customer_email: 'user@example.com',
 * });
 * ```
 */
export class PaymentsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Creates a new payment intent.
   *
   * @param params - Payment creation parameters
   * @param options - Optional request options
   * @returns Created payment intent with checkout URL
   *
   * @example
   * ```typescript
   * const payment = await client.payments.create({
   *   amount: '100.00',
   *   currency: 'BDT',
   *   callback_url: 'https://example.com/webhook',
   *   redirect_url: 'https://example.com/success',
   *   customer_email: 'user@example.com',
   *   customer_name: 'John Doe',
   *   reference: 'ORDER-123',
   * });
   *
   * // Redirect customer to payment page
   * console.log(payment.checkout_url);
   * ```
   */
  async create(
    params: CreatePaymentParams,
    options?: RequestOptions
  ): Promise<PaymentIntent> {
    // Normalize currency before validation
    const normalizedParams: CreatePaymentParams = {
      ...params,
      currency: typeof params.currency === 'string' ? params.currency.toUpperCase() : params.currency,
    };

    // Validate required fields
    this.validateCreateParams(normalizedParams);

    // Sanitize and prepare the request body
    const body: Record<string, unknown> = {
      amount: String(params.amount),
      currency: normalizedParams.currency,
    };

    // Add optional fields (trimmed)
    if (params.callback_url) body.callback_url = params.callback_url.trim();
    if (params.redirect_url) body.redirect_url = params.redirect_url.trim();
    if (params.cancel_url) body.cancel_url = params.cancel_url.trim();
    if (params.customer_email) body.customer_email = params.customer_email.trim();
    if (params.customer_name) body.customer_name = params.customer_name.trim();
    if (params.customer_phone) body.customer_phone = params.customer_phone.trim();
    if (params.reference) body.reference = params.reference.trim();
    if (params.gateway) body.gateway = params.gateway.trim();
    if (params.metadata) body.metadata = params.metadata;

    const response = await this.client.request<ApiResponse<PaymentIntent>>({
      method: 'POST',
      path: '/payments',
      body,
      options,
    });

    return response.data;
  }

  /**
   * Retrieves a payment by its ID.
   *
   * @param paymentId - The payment UUID
   * @param options - Optional request options
   * @returns Payment details
   *
   * @example
   * ```typescript
   * const payment = await client.payments.get('pay_abc123...');
   * console.log(payment.status); // 'completed'
   * ```
   */
  async get(paymentId: string, options?: RequestOptions): Promise<Payment> {
    if (!paymentId || typeof paymentId !== 'string') {
      throw new ValidationError('Payment ID is required', [
        { code: 'REQUIRED', message: 'Payment ID is required', field: 'payment_id' },
      ]);
    }

    const response = await this.client.request<ApiResponse<Payment>>({
      method: 'GET',
      path: `/payments/${encodeURIComponent(paymentId.trim())}`,
      options,
    });

    return response.data;
  }

  /**
   * Validates payment creation parameters.
   */
  private validateCreateParams(params: CreatePaymentParams): void {
    const errors: { code: string; message: string; field: string }[] = [];

    // Validate amount
    if (!params.amount || !isPositiveNumber(params.amount)) {
      errors.push({
        code: 'INVALID_AMOUNT',
        message: 'Amount must be a positive number',
        field: 'amount',
      });
    }

    // Validate currency (already normalized to uppercase)
    if (!params.currency) {
      errors.push({
        code: 'INVALID_CURRENCY',
        message: 'Currency is required',
        field: 'currency',
      });
    } else if (!isValidCurrencyCode(params.currency)) {
      errors.push({
        code: 'INVALID_CURRENCY',
        message: 'Currency must be a valid 3-letter ISO code',
        field: 'currency',
      });
    }

    // Validate URLs if provided
    if (params.callback_url && !isValidUrl(params.callback_url)) {
      errors.push({
        code: 'INVALID_URL',
        message: 'callback_url must be a valid HTTP/HTTPS URL',
        field: 'callback_url',
      });
    }

    if (params.redirect_url && !isValidUrl(params.redirect_url)) {
      errors.push({
        code: 'INVALID_URL',
        message: 'redirect_url must be a valid HTTP/HTTPS URL',
        field: 'redirect_url',
      });
    }

    if (params.cancel_url && !isValidUrl(params.cancel_url)) {
      errors.push({
        code: 'INVALID_URL',
        message: 'cancel_url must be a valid HTTP/HTTPS URL',
        field: 'cancel_url',
      });
    }

    // Validate field lengths
    if (params.customer_name && params.customer_name.length > 150) {
      errors.push({
        code: 'INVALID_LENGTH',
        message: 'Customer name must be 150 characters or less',
        field: 'customer_name',
      });
    }

    if (params.customer_phone && params.customer_phone.length > 30) {
      errors.push({
        code: 'INVALID_LENGTH',
        message: 'Customer phone must be 30 characters or less',
        field: 'customer_phone',
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(
        errors[0]!.message,
        errors.map((e) => ({
          code: e.code,
          message: e.message,
          field: e.field,
        }))
      );
    }
  }
}
