/**
 * OwnPay Node.js SDK - Webhooks Resource
 *
 * Handles webhook testing and delivery history.
 */

import { HttpClient } from '../core/client.js';
import type {
  ApiResponse,
  WebhookTestResult,
  WebhookDelivery,
  RequestOptions,
} from '../core/types.js';

/**
 * Resource for managing webhooks.
 *
 * @example
 * ```typescript
 * // Test webhook endpoint
 * const result = await client.webhooks.test();
 * console.log(result.status_code); // 200
 *
 * // List recent deliveries
 * const deliveries = await client.webhooks.deliveries();
 * ```
 */
export class WebhooksResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Sends a test webhook to the configured endpoint.
   *
   * @param options - Optional request options
   * @returns Test result with status code and response time
   *
   * @example
   * ```typescript
   * const result = await client.webhooks.test();
   *
   * if (result.status_code === 200) {
   *   console.log('Webhook endpoint is working!');
   * }
   * ```
   */
  async test(options?: RequestOptions): Promise<WebhookTestResult> {
    const response = await this.client.request<ApiResponse<WebhookTestResult>>({
      method: 'POST',
      path: '/webhooks/tests',
      options,
    });

    return response.data;
  }

  /**
   * Lists recent webhook deliveries.
   *
   * @param options - Optional request options
   * @returns Array of webhook delivery records
   *
   * @example
   * ```typescript
   * const deliveries = await client.webhooks.deliveries();
   *
   * for (const delivery of deliveries) {
   *   console.log(`${delivery.event}: ${delivery.status} (${delivery.status_code})`);
   * }
   * ```
   */
  async deliveries(options?: RequestOptions): Promise<WebhookDelivery[]> {
    const response = await this.client.request<ApiResponse<WebhookDelivery[]>>({
      method: 'GET',
      path: '/webhooks/deliveries',
      options,
    });

    return response.data || [];
  }
}
