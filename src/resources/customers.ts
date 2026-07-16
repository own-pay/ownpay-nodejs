/**
 * OwnPay Node.js SDK - Customers Resource
 *
 * Handles customer creation and retrieval.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  CreateCustomerParams,
  ListCustomersParams,
  Customer,
  PaginatedList,
  RequestOptions,
} from '../core/types.js';
import { ValidationError } from '../core/errors.js';

/**
 * Resource for managing customers.
 *
 * @example
 * ```typescript
 * // Create a customer
 * const customer = await client.customers.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '+8801712345678',
 * });
 *
 * // Find customer by email
 * const customer = await client.customers.get('john@example.com');
 * ```
 */
export class CustomersResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Creates a new customer.
   *
   * @param params - Customer creation parameters
   * @param options - Optional request options
   * @returns Created customer with ID and UUID
   *
   * @example
   * ```typescript
   * const customer = await client.customers.create({
   *   name: 'Jane Smith',
   *   email: 'jane@example.com',
   *   phone: '+8801712345678',
   * });
   *
   * console.log(customer.id); // Internal ID
   * console.log(customer.uuid); // Public UUID
   * ```
   */
  async create(
    params: CreateCustomerParams,
    options?: RequestOptions
  ): Promise<Pick<Customer, 'id' | 'uuid'>> {
    this.validateCreateParams(params);

    const body: Record<string, unknown> = {
      name: params.name,
    };

    if (params.email) body.email = params.email;
    if (params.phone) body.phone = params.phone;

    const response = await this.client.request<ApiResponse<Pick<Customer, 'id' | 'uuid'>>>({
      method: 'POST',
      path: '/customers',
      body,
      options,
    });

    return response.data;
  }

  /**
   * Lists customers with pagination.
   *
   * @param params - Optional pagination parameters
   * @param options - Optional request options
   * @returns Paginated list of customers
   *
   * @example
   * ```typescript
   * const result = await client.customers.list({ page: 1, per_page: 50 });
   *
   * for (const customer of result.items) {
   *   console.log(`${customer.name}: ${customer.email}`);
   * }
   * ```
   */
  async list(
    params?: ListCustomersParams,
    options?: RequestOptions
  ): Promise<PaginatedList<Customer>> {
    const query: Record<string, string | number | boolean | undefined> = {};

    if (params?.page !== undefined) query.page = params.page;
    if (params?.per_page !== undefined) query.per_page = params.per_page;

    const response = await this.client.request<ApiResponse<Customer[]>>({
      method: 'GET',
      path: '/customers',
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
   * Retrieves a customer by email or phone number.
   *
   * The identifier is auto-detected:
   * - Contains '@' → treated as email
   * - Otherwise → treated as phone
   *
   * @param identifier - Customer email or phone number
   * @param options - Optional request options
   * @returns Customer details
   *
   * @example
   * ```typescript
   * // By email
   * const customer = await client.customers.get('john@example.com');
   *
   * // By phone
   * const customer = await client.customers.get('+8801712345678');
   * ```
   */
  async get(identifier: string, options?: RequestOptions): Promise<Customer> {
    if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
      throw new ValidationError('Identifier is required', [
        { code: 'REQUIRED', message: 'Email or phone identifier is required', field: 'identifier' },
      ]);
    }

    const response = await this.client.request<ApiResponse<Customer>>({
      method: 'GET',
      path: `/customers/${encodeURIComponent(identifier.trim())}`,
      options,
    });

    return response.data;
  }

  /**
   * Validates customer creation parameters.
   */
  private validateCreateParams(params: CreateCustomerParams): void {
    const errors: { code: string; message: string; field: string }[] = [];

    if (!params.name || typeof params.name !== 'string' || params.name.trim() === '') {
      errors.push({
        code: 'REQUIRED',
        message: 'Customer name is required',
        field: 'name',
      });
    }

    if (params.name && params.name.length > 150) {
      errors.push({
        code: 'INVALID_LENGTH',
        message: 'Customer name must be 150 characters or less',
        field: 'name',
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
