/**
 * OwnPay Node.js SDK - Transactions Resource
 *
 * Handles transaction listing and retrieval.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  ListTransactionsParams,
  Transaction,
  PaginatedList,
  RequestOptions,
} from '../core/types.js';
import { ValidationError } from '../core/errors.js';

/**
 * Resource for querying transactions.
 *
 * @example
 * ```typescript
 * // List transactions with filters
 * const result = await client.transactions.list({
 *   page: 1,
 *   per_page: 25,
 *   status: 'completed',
 * });
 *
 * console.log(result.items); // Transaction[]
 * console.log(result.meta.total); // Total count
 * ```
 */
export class TransactionsResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists transactions with optional filtering and pagination.
   *
   * @param params - Optional filter and pagination parameters
   * @param options - Optional request options
   * @returns Paginated list of transactions
   *
   * @example
   * ```typescript
   * // Get completed transactions from last 7 days
   * const result = await client.transactions.list({
   *   status: 'completed',
   *   from: '2024-01-01',
   *   to: '2024-01-07',
   *   per_page: 50,
   * });
   *
   * for (const txn of result.items) {
   *   console.log(`${txn.trx_id}: ${txn.amount} ${txn.currency}`);
   * }
   * ```
   */
  async list(
    params?: ListTransactionsParams,
    options?: RequestOptions
  ): Promise<PaginatedList<Transaction>> {
    const query: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) query.page = params.page;
    if (params?.per_page !== undefined) query.per_page = params.per_page;
    if (params?.status) query.status = params.status;
    if (params?.gateway) query.gateway = params.gateway;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;

    const response = await this.client.request<ApiResponse<Transaction[]>>({
      method: 'GET',
      path: '/transactions',
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
   * Retrieves a single transaction by ID.
   *
   * Accepts either an OwnPay transaction reference (e.g., 'OP-XXXX')
   * or a gateway transaction ID.
   *
   * @param trxId - Transaction ID (OwnPay reference or gateway ID)
   * @param options - Optional request options
   * @returns Transaction details
   *
   * @example
   * ```typescript
   * // By OwnPay reference
   * const txn = await client.transactions.get('OP-ABC123');
   *
   * // By gateway transaction ID
   * const txn = await client.transactions.get('gw_xyz789');
   * ```
   */
  async get(trxId: string, options?: RequestOptions): Promise<Transaction> {
    if (!trxId || typeof trxId !== 'string' || trxId.trim() === '') {
      throw new ValidationError('Transaction ID is required', [
        { code: 'REQUIRED', message: 'Transaction ID is required', field: 'trx_id' },
      ]);
    }

    const response = await this.client.request<ApiResponse<Transaction>>({
      method: 'GET',
      path: `/transactions/${encodeURIComponent(trxId.trim())}`,
      options,
    });

    return response.data;
  }
}
