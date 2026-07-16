/**
 * OwnPay Node.js SDK - Refunds Resource
 *
 * Handles refund creation and retrieval.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  CreateRefundParams,
  ListRefundsParams,
  Refund,
  PaginatedList,
  RequestOptions,
} from '../core/types.js';
import { ValidationError } from '../core/errors.js';
import { isPositiveNumber } from '../core/utils.js';

/**
 * Resource for managing refunds.
 *
 * @example
 * ```typescript
 * // Create a full refund
 * const refund = await client.refunds.create({
 *   transaction_id: 'OP-ABC123',
 *   reason: 'Customer request',
 * });
 *
 * // Create a partial refund
 * const refund = await client.refunds.create({
 *   transaction_id: 'OP-ABC123',
 *   amount: '50.00',
 *   reason: 'Partial refund',
 * });
 * ```
 */
export class RefundsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Creates a new refund for a transaction.
   *
   * @param params - Refund creation parameters
   * @param options - Optional request options
   * @returns Created refund details
   *
   * @example
   * ```typescript
   * const refund = await client.refunds.create({
   *   transaction_id: 'OP-ABC123',
   *   amount: '25.00',
   *   reason: 'Item returned',
   * });
   *
   * console.log(refund.status); // 'pending' or 'completed'
   * ```
   */
  async create(
    params: CreateRefundParams,
    options?: RequestOptions
  ): Promise<Refund> {
    this.validateCreateParams(params);

    const body: Record<string, unknown> = {};

    // Accept either transaction_id or trx_id
    if (params.transaction_id !== undefined) {
      body.transaction_id = params.transaction_id;
    } else if (params.trx_id !== undefined) {
      body.trx_id = params.trx_id;
    }

    if (params.amount !== undefined) {
      body.amount = String(params.amount);
    }
    if (params.reason !== undefined) {
      body.reason = params.reason;
    }

    const response = await this.client.request<ApiResponse<Refund>>({
      method: 'POST',
      path: '/refunds',
      body,
      options,
    });

    return response.data;
  }

  /**
   * Lists refunds with optional filtering and pagination.
   *
   * @param params - Optional filter and pagination parameters
   * @param options - Optional request options
   * @returns Paginated list of refunds
   *
   * @example
   * ```typescript
   * const result = await client.refunds.list({
   *   status: 'completed',
   *   page: 1,
   *   per_page: 25,
   * });
   *
   * for (const refund of result.items) {
   *   console.log(`${refund.uuid}: ${refund.amount}`);
   * }
   * ```
   */
  async list(
    params?: ListRefundsParams,
    options?: RequestOptions
  ): Promise<PaginatedList<Refund>> {
    const query: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) query.page = params.page;
    if (params?.per_page !== undefined) query.per_page = params.per_page;
    if (params?.status) query.status = params.status;
    if (params?.trx_id) query.trx_id = params.trx_id;
    if (params?.transaction_id) query.transaction_id = params.transaction_id;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;

    const response = await this.client.request<ApiResponse<Refund[]>>({
      method: 'GET',
      path: '/refunds',
      query,
      options,
    });

    return {
      items: response.data || [],
      meta: response.meta || {
        page: params?.page || 1,
        per_page: params?.per_page || 25,
        total: 0,
        total_pages: 0,
      },
    };
  }

  /**
   * Retrieves a single refund by transaction reference.
   *
   * @param trxId - Transaction ID (OwnPay reference or gateway ID)
   * @param options - Optional request options
   * @returns Refund details
   *
   * @example
   * ```typescript
   * const refund = await client.refunds.get('OP-ABC123');
   * ```
   */
  async get(trxId: string, options?: RequestOptions): Promise<Refund> {
    if (!trxId || typeof trxId !== 'string' || trxId.trim() === '') {
      throw new ValidationError('Transaction ID is required', [
        { code: 'REQUIRED', message: 'Transaction ID is required', field: 'trx_id' },
      ]);
    }

    const response = await this.client.request<ApiResponse<Refund>>({
      method: 'GET',
      path: `/refunds/${encodeURIComponent(trxId.trim())}`,
      options,
    });

    return response.data;
  }

  /**
   * Validates refund creation parameters.
   */
  private validateCreateParams(params: CreateRefundParams): void {
    const errors: { code: string; message: string; field: string }[] = [];

    // Must have either transaction_id or trx_id
    if (
      (params.transaction_id === undefined || params.transaction_id === null) &&
      (params.trx_id === undefined || params.trx_id === null)
    ) {
      errors.push({
        code: 'REQUIRED',
        message: 'transaction_id or trx_id is required',
        field: 'transaction_id',
      });
    }

    // Validate amount if provided
    if (params.amount !== undefined && params.amount !== null) {
      if (!isPositiveNumber(params.amount)) {
        errors.push({
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive number',
          field: 'amount',
        });
      }
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
