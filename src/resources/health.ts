/**
 * OwnPay Node.js SDK - Health Resource
 *
 * Handles system health check operations.
 */

import { HttpClient } from '../core/client.js';
import type { ApiResponse, HealthStatus, RequestOptions } from '../core/types.js';

/**
 * Resource for system health checks.
 *
 * @example
 * ```typescript
 * const health = await client.health.check();
 *
 * if (health.status === 'healthy') {
 *   console.log('System is operational');
 * }
 * ```
 */
export class HealthResource {
  constructor(private readonly client: HttpClient) {}

  /**
   * Performs a system health check.
   *
   * Returns detailed information about:
   * - System status (healthy/degraded)
   * - Database connectivity
   * - Mobile companion app status
   * - Active gateway count
   * - Customer count
   *
   * @param options - Optional request options
   * @returns Health status information
   *
   * @example
   * ```typescript
   * const health = await client.health.check();
   *
   * console.log(`Status: ${health.status}`);
   * console.log(`Version: ${health.version}`);
   * console.log(`Database: ${health.db}`);
   * console.log(`Active gateways: ${health.gateways}`);
   * console.log(`Total customers: ${health.customers}`);
   *
   * // Check mobile companion status
   * if (health.mobile.connected) {
   *   console.log(`Mobile devices: ${health.mobile.active_devices}`);
   * }
   * ```
   */
  async check(options?: RequestOptions): Promise<HealthStatus> {
    const response = await this.client.request<ApiResponse<HealthStatus>>({
      method: 'GET',
      path: '/health',
      options,
    });

    return response.data;
  }
}
