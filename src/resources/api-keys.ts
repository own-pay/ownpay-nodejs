/**
 * OwnPay Node.js SDK - API Keys Resource
 *
 * Handles API key generation, listing, and revocation.
 *
 * Note: API key operations require both 'write' and 'admin' scopes,
 * and must include the X-Super-Admin-Email header.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  GenerateApiKeyParams,
  ApiKey,
  GeneratedApiKey,
  ApiKeyScope,
  RequestOptions,
} from '../core/types.js';
import { ValidationError, PermissionError } from '../core/errors.js';

/**
 * Resource for managing API keys.
 *
 * @example
 * ```typescript
 * // List API keys
 * const keys = await client.apiKeys.list();
 *
 * // Generate a new key
 * const newKey = await client.apiKeys.generate({
 *   name: 'Production Key',
 *   scopes: ['read', 'write'],
 * });
 *
 * // Revoke a key
 * await client.apiKeys.revoke(keyId);
 * ```
 */
export class ApiKeysResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Lists all API keys for the authenticated merchant.
   *
   * Note: Requires API key with 'write' and 'admin' scopes.
   *
   * @param options - Optional request options (must include superAdminEmail header)
   * @returns Array of API key metadata
   *
   * @example
   * ```typescript
   * const keys = await client.apiKeys.list({
   *   headers: { 'X-Super-Admin-Email': 'admin@example.com' },
   * });
   * ```
   */
  async list(options?: RequestOptions): Promise<ApiKey[]> {
    this.ensureAdminHeaders(options);

    const response = await this.client.request<ApiResponse<ApiKey[]>>({
      method: 'GET',
      path: '/api-keys',
      options,
    });

    return response.data || [];
  }

  /**
   * Generates a new API key.
   *
   * Note: Requires API key with 'write' and 'admin' scopes.
   * The actual key is only shown once in the response.
   *
   * @param params - Key generation parameters
   * @param options - Optional request options (must include superAdminEmail header)
   * @returns Generated API key (store securely, cannot be retrieved again)
   *
   * @example
   * ```typescript
   * const result = await client.apiKeys.generate({
   *   name: 'My App Key',
   *   scopes: ['read', 'write'],
   * }, {
   *   headers: { 'X-Super-Admin-Email': 'admin@example.com' },
   * });
   *
   * // IMPORTANT: Store this key securely!
   * console.log(result.key); // 'op_xxxxx...'
   * console.log(result.warning); // 'Store this key securely...'
   * ```
   */
  async generate(
    params?: GenerateApiKeyParams,
    options?: RequestOptions
  ): Promise<GeneratedApiKey> {
    this.ensureAdminHeaders(options);

    const body: Record<string, unknown> = {};

    if (params?.name) body.name = params.name;
    if (params?.scopes) {
      this.validateScopes(params.scopes);
      body.scopes = params.scopes;
    }

    const response = await this.client.request<ApiResponse<GeneratedApiKey>>({
      method: 'POST',
      path: '/api-keys',
      body,
      options,
    });

    return response.data;
  }

  /**
   * Revokes an API key by ID.
   *
   * Note: Requires API key with 'write' and 'admin' scopes.
   *
   * @param keyId - The API key ID to revoke
   * @param options - Optional request options (must include superAdminEmail header)
   *
   * @example
   * ```typescript
   * await client.apiKeys.revoke(123, {
   *   headers: { 'X-Super-Admin-Email': 'admin@example.com' },
   * });
   * ```
   */
  async revoke(keyId: number, options?: RequestOptions): Promise<void> {
    this.ensureAdminHeaders(options);

    if (!keyId || typeof keyId !== 'number' || keyId <= 0) {
      throw new ValidationError('Valid API key ID is required', [
        { code: 'REQUIRED', message: 'Valid API key ID is required', field: 'id' },
      ]);
    }

    await this.client.request<ApiResponse<unknown>>({
      method: 'DELETE',
      path: `/api-keys/${keyId}`,
      options,
    });
  }

  /**
   * Ensures the X-Super-Admin-Email header is present.
   */
  private ensureAdminHeaders(options?: RequestOptions): void {
    const email = options?.headers?.['X-Super-Admin-Email'];
    if (!email) {
      throw new PermissionError(
        'API key operations require the X-Super-Admin-Email header. ' +
        'Pass it in options.headers["X-Super-Admin-Email"].'
      );
    }
  }

  /**
   * Validates API key scopes.
   */
  private validateScopes(scopes: ApiKeyScope[]): void {
    const allowed: ApiKeyScope[] = ['read', 'write', 'admin'];
    for (const scope of scopes) {
      if (!allowed.includes(scope)) {
        throw new ValidationError(
          `Invalid scope: ${scope}. Allowed: ${allowed.join(', ')}`,
          [{ code: 'INVALID_SCOPE', message: `Invalid scope: ${scope}`, field: 'scopes' }]
        );
      }
    }
  }
}
