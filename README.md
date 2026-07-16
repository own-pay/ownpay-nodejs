# ownpay-nodejs

[![npm version](https://img.shields.io/npm/v/ownpay-nodejs)](https://www.npmjs.com/package/ownpay-nodejs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

Official Node.js SDK for the [OwnPay](https://ownpay.com) Payment Gateway API. A zero-dependency, TypeScript-first SDK for seamless payment integration.

## Features

- 🚀 **Zero Dependencies** - Uses only Node.js native APIs (fetch, crypto)
- 📘 **TypeScript First** - Full type safety with comprehensive type definitions
- 🔄 **ESM + CJS** - Supports both ES Modules and CommonJS
- 🌲 **Tree-Shakeable** - Import only what you need
- 🔒 **Secure** - Built-in webhook signature verification with HMAC-SHA256
- ⚡ **High Performance** - Native fetch API with automatic retries
- 🛡️ **Error Handling** - Comprehensive error hierarchy for easy debugging
- 📝 **Idempotency** - Built-in support for safe request retries

## Requirements

- Node.js 18.0.0 or higher
- An OwnPay API key (starts with `op_`)

## Installation

```bash
npm install ownpay-nodejs
```

```bash
yarn add ownpay-nodejs
```

```bash
pnpm add ownpay-nodejs
```

## Quick Start

### Initialize the Client

```typescript
import OwnPay from 'ownpay-nodejs';

// Simple initialization
const client = new OwnPay('op_your_api_key_here');

// With configuration options
const client = new OwnPay({
  apiKey: 'op_your_api_key_here',
  timeout: 30000,        // Request timeout in ms (default: 30000)
  maxRetries: 2,         // Max retry attempts (default: 2)
  baseUrl: 'https://api.ownpay.com',  // Custom API URL (optional)
});
```

### Create a Payment

```typescript
const payment = await client.payments.create({
  amount: '100.00',
  currency: 'BDT',
  customer_email: 'customer@example.com',
  customer_name: 'John Doe',
  callback_url: 'https://your-app.com/webhook',
  redirect_url: 'https://your-app.com/success',
  cancel_url: 'https://your-app.com/cancel',
  reference: 'ORDER-12345',
  metadata: {
    order_id: '12345',
    product: 'Widget',
  },
});

console.log('Payment ID:', payment.payment_id);
console.log('Checkout URL:', payment.checkout_url);
console.log('Status:', payment.status);

// Redirect customer to payment.checkout_url
```

### Check Payment Status

```typescript
const paymentDetails = await client.payments.get('payment-uuid-here');

console.log('Status:', paymentDetails.status);
console.log('Amount:', paymentDetails.amount);
console.log('Currency:', paymentDetails.currency);

if (paymentDetails.status === 'completed') {
  console.log('Payment completed!');
}
```

## API Reference

### Payments

#### `client.payments.create(params, options?)`

Creates a new payment intent.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | `string \| number` | ✅ | Payment amount (positive number) |
| `currency` | `string` | ✅ | 3-letter ISO currency code (e.g., 'BDT', 'USD') |
| `callback_url` | `string` | ❌ | Webhook notification URL |
| `redirect_url` | `string` | ❌ | Success redirect URL |
| `cancel_url` | `string` | ❌ | Cancel redirect URL |
| `customer_email` | `string` | ❌ | Customer email address |
| `customer_name` | `string` | ❌ | Customer name (max 150 chars) |
| `customer_phone` | `string` | ❌ | Customer phone (max 30 chars) |
| `reference` | `string` | ❌ | Merchant reference ID |
| `gateway` | `string` | ❌ | Preferred payment gateway |
| `metadata` | `Record<string, unknown>` | ❌ | Custom key-value metadata |

**Returns:** `Promise<PaymentIntent>`

```typescript
interface PaymentIntent {
  payment_id: string;   // Unique payment UUID
  token: string;        // Payment intent token
  checkout_url: string; // URL for customer payment
  status: string;       // Current status
}
```

#### `client.payments.get(paymentId, options?)`

Retrieves payment details by ID.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `paymentId` | `string` | ✅ | Payment UUID |

**Returns:** `Promise<Payment>`

---

### Transactions

#### `client.transactions.list(params?, options?)`

Lists transactions with optional filtering and pagination.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | `number` | ❌ | Page number (default: 1) |
| `per_page` | `number` | ❌ | Items per page (default: 25, max: 100) |
| `status` | `string` | ❌ | Filter by status |
| `gateway` | `string` | ❌ | Filter by gateway |
| `from` | `string` | ❌ | Start date (ISO format) |
| `to` | `string` | ❌ | End date (ISO format) |

**Returns:** `Promise<PaginatedList<Transaction>>`

```typescript
const result = await client.transactions.list({
  page: 1,
  per_page: 50,
  status: 'completed',
  from: '2024-01-01',
  to: '2024-01-31',
});

console.log('Transactions:', result.items);
console.log('Total:', result.meta.total);
console.log('Pages:', result.meta.total_pages);
```

#### `client.transactions.get(trxId, options?)`

Retrieves a transaction by ID (OwnPay reference or gateway ID).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `trxId` | `string` | ✅ | Transaction ID (e.g., 'OP-ABC123') |

**Returns:** `Promise<Transaction>`

---

### Refunds

#### `client.refunds.create(params, options?)`

Creates a refund for a transaction.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `transaction_id` | `string \| number` | ✅* | Transaction ID |
| `trx_id` | `string \| number` | ✅* | OwnPay transaction reference |
| `amount` | `string \| number` | ❌ | Refund amount (partial refund) |
| `reason` | `string` | ❌ | Refund reason |

*Either `transaction_id` or `trx_id` is required

**Returns:** `Promise<Refund>`

```typescript
// Full refund
const refund = await client.refunds.create({
  transaction_id: 'OP-ABC123',
  reason: 'Customer request',
});

// Partial refund
const refund = await client.refunds.create({
  transaction_id: 'OP-ABC123',
  amount: '50.00',
  reason: 'Partial return',
});
```

#### `client.refunds.list(params?, options?)`

Lists refunds with optional filtering.

**Returns:** `Promise<PaginatedList<Refund>>`

#### `client.refunds.get(trxId, options?)`

Retrieves refund details by transaction reference.

**Returns:** `Promise<Refund>`

---

### Customers

#### `client.customers.create(params, options?)`

Creates a new customer.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ✅ | Customer name (max 150 chars) |
| `email` | `string` | ❌ | Email address |
| `phone` | `string` | ❌ | Phone number |

**Returns:** `Promise<{ id: number; uuid: string }>`

```typescript
const customer = await client.customers.create({
  name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+8801712345678',
});

console.log('Customer ID:', customer.id);
console.log('Customer UUID:', customer.uuid);
```

#### `client.customers.list(params?, options?)`

Lists customers with pagination.

**Returns:** `Promise<PaginatedList<Customer>>`

#### `client.customers.get(identifier, options?)`

Retrieves a customer by email or phone.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | `string` | ✅ | Email or phone number |

**Returns:** `Promise<Customer>`

```typescript
// By email
const customer = await client.customers.get('jane@example.com');

// By phone
const customer = await client.customers.get('+8801712345678');
```

---

### API Keys

> **Note:** API key operations require an API key with both `write` and `admin` scopes, and must include the `X-Super-Admin-Email` header.

#### `client.apiKeys.list(options?)`

Lists all API keys for the merchant.

**Returns:** `Promise<ApiKey[]>`

```typescript
const keys = await client.apiKeys.list({
  headers: { 'X-Super-Admin-Email': 'admin@example.com' },
});
```

#### `client.apiKeys.generate(params?, options?)`

Generates a new API key.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | `string` | ❌ | Key name/label |
| `scopes` | `string[]` | ❌ | Permission scopes: `['read', 'write', 'admin']` |

**Returns:** `Promise<GeneratedApiKey>`

```typescript
const result = await client.apiKeys.generate(
  {
    name: 'Production Key',
    scopes: ['read', 'write'],
  },
  {
    headers: { 'X-Super-Admin-Email': 'admin@example.com' },
  }
);

// IMPORTANT: Store this key securely! It cannot be retrieved again.
console.log('New API Key:', result.key);
console.log('Warning:', result.warning);
```

#### `client.apiKeys.revoke(keyId, options?)`

Revokes an API key.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyId` | `number` | ✅ | API key ID to revoke |

---

### Webhooks

#### `client.webhooks.test(options?)`

Sends a test webhook to the configured endpoint.

**Returns:** `Promise<WebhookTestResult>`

```typescript
const result = await client.webhooks.test();
console.log('Status Code:', result.status_code);
console.log('Response Time:', result.response_time_ms, 'ms');
```

#### `client.webhooks.deliveries(options?)`

Lists recent webhook deliveries.

**Returns:** `Promise<WebhookDelivery[]>`

---

### Health

#### `client.health.check(options?)`

Performs a system health check.

**Returns:** `Promise<HealthStatus>`

```typescript
const health = await client.health.check();

console.log('Status:', health.status);       // 'healthy' or 'degraded'
console.log('Version:', health.version);
console.log('Database:', health.db);         // 'connected' or 'error'
console.log('Gateways:', health.gateways);
console.log('Customers:', health.customers);
```

---

## Webhook Handling

### Verify Webhook Signatures

Always verify webhook signatures to ensure payloads are from OwnPay.

```typescript
import { verifyWebhookSignature } from 'ownpay-nodejs/webhooks';

// Express.js example
app.post('/webhook', (req, res) => {
  try {
    const signature = req.headers['x-ownpay-signature'];
    const timestamp = req.headers['x-ownpay-timestamp'];
    const payload = req.body; // Raw body (string or Buffer)

    verifyWebhookSignature({
      payload,
      signature,
      secret: process.env.OWNPAY_WEBHOOK_SECRET,
      timestamp,
      tolerance: 300, // 5 minutes (default)
    });

    // Signature is valid, process the event
    const event = JSON.parse(payload);
    handleWebhookEvent(event);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook verification failed:', error.message);
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

### Webhook Event Structure

```typescript
interface WebhookPayload {
  event: string;              // e.g., 'payment.completed'
  transaction_id: string;     // OwnPay transaction reference
  gateway_trx_id: string;     // Gateway transaction ID
  amount: string;             // Transaction amount
  currency: string;           // Currency code
  fee: string;                // Processing fee
  gateway: string;            // Gateway slug
  gateway_type: string;       // Gateway type
  status: string;             // Transaction status
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  metadata: Record<string, unknown>;
  timestamp: string;          // ISO timestamp
}
```

### Handle Different Event Types

```typescript
function handleWebhookEvent(event: WebhookPayload) {
  switch (event.event) {
    case 'payment.completed':
      console.log(`Payment ${event.transaction_id} completed`);
      // Fulfill order, send confirmation email, etc.
      break;

    case 'payment.failed':
      console.log(`Payment ${event.transaction_id} failed`);
      // Notify customer, retry logic, etc.
      break;

    case 'refund.completed':
      console.log(`Refund for ${event.transaction_id} completed`);
      // Update records, notify customer
      break;

    default:
      console.log(`Unhandled event: ${event.event}`);
  }
}
```

---

## Error Handling

The SDK provides a comprehensive error hierarchy for precise error handling.

```typescript
import OwnPay, {
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  IdempotencyError,
  ApiError,
  NetworkError,
  AbortError,
} from 'ownpay-nodejs';

try {
  const payment = await client.payments.create({
    amount: '100.00',
    currency: 'BDT',
  });
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Invalid or revoked API key
    console.error('Authentication failed:', error.message);
  } else if (error instanceof ValidationError) {
    // Invalid parameters
    console.error('Validation failed:', error.message);
    console.error('Field errors:', error.getFieldErrors());
  } else if (error instanceof NotFoundError) {
    // Resource not found
    console.error('Not found:', error.message);
  } else if (error instanceof RateLimitError) {
    // Rate limit exceeded
    console.error(`Rate limited. Retry after ${error.retryAfter} seconds`);
  } else if (error instanceof IdempotencyError) {
    // Duplicate request
    console.error('Idempotency conflict:', error.message);
  } else if (error instanceof ApiError) {
    // Server error (5xx)
    console.error('API error:', error.message, 'Status:', error.status);
  } else if (error instanceof NetworkError) {
    // Connection failure
    console.error('Network error:', error.message);
  } else if (error instanceof AbortError) {
    // Request timeout
    console.error('Request timed out');
  }
}
```

### Error Properties

All errors have these common properties:

| Property | Type | Description |
|----------|------|-------------|
| `message` | `string` | Human-readable error message |
| `type` | `string` | Error type identifier |
| `status` | `number` | HTTP status code (if applicable) |
| `requestId` | `string` | Request ID for debugging |
| `rawResponse` | `unknown` | Raw API response |

### Validation Errors

`ValidationError` provides additional methods:

```typescript
catch (error) {
  if (error instanceof ValidationError) {
    // Get all errors grouped by field
    const fieldErrors = error.getFieldErrors();
    // { amount: ['Must be positive'], currency: ['Required'] }

    // Get first error for a specific field
    const amountError = error.getFirstFieldError('amount');
  }
}
```

---

## Request Options

All resource methods accept an optional `RequestOptions` parameter:

```typescript
const payment = await client.payments.create(
  { amount: '100.00', currency: 'BDT' },
  {
    // Idempotency key for safe retries
    idempotencyKey: 'unique-key-123',

    // Custom headers for this request
    headers: {
      'X-Custom-Header': 'value',
    },

    // Request timeout override (ms)
    timeout: 60000,

    // AbortSignal for cancellation
    signal: AbortSignal.timeout(10000),
  }
);
```

### Idempotency

Use idempotency keys for POST requests to safely retry without creating duplicates:

```typescript
import { v4 as uuidv4 } from 'node:crypto';

const idempotencyKey = crypto.randomUUID();

const payment = await client.payments.create(
  { amount: '100.00', currency: 'BDT' },
  { idempotencyKey }
);

// Safe to retry with the same key if network error occurs
```

### Request Cancellation

Use `AbortSignal` to cancel long-running requests:

```typescript
const controller = new AbortController();

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const payment = await client.payments.create(
    { amount: '100.00', currency: 'BDT' },
    { signal: controller.signal }
  );
} catch (error) {
  if (error instanceof AbortError) {
    console.log('Request was cancelled');
  }
}
```

---

## Advanced Configuration

### Custom API URL

For self-hosted or white-label deployments:

```typescript
const client = new OwnPay({
  apiKey: 'op_your_key',
  baseUrl: 'https://your-domain.com',
});
```

### Environment Variables

Store your API key securely using environment variables:

```typescript
const client = new OwnPay(process.env.OWNPAY_API_KEY!);
```

### Custom Headers

Add custom headers to all requests:

```typescript
const client = new OwnPay({
  apiKey: 'op_your_key',
  headers: {
    'X-App-Version': '1.0.0',
    'X-Client-Id': 'your-app',
  },
});
```

---

## TypeScript Support

The SDK is built with TypeScript and provides comprehensive type definitions.

```typescript
import OwnPay from 'ownpay-nodejs';
import type {
  Payment,
  Transaction,
  Refund,
  Customer,
  WebhookPayload,
  CreatePaymentParams,
  ListTransactionsParams,
} from 'ownpay-nodejs';

// Types are automatically inferred
const client = new OwnPay('op_key');
const payment = await client.payments.create({
  amount: '100.00',
  currency: 'BDT',
});
// payment is typed as PaymentIntent
```

---

## CommonJS Support

The SDK supports CommonJS for backward compatibility:

```javascript
const OwnPay = require('ownpay-nodejs');

const client = new OwnPay('op_your_key');
```

---

## Tree-Shaking

Import only what you need for smaller bundle sizes:

```typescript
// Import only the client
import OwnPay from 'ownpay-nodejs';

// Import only webhook utilities
import { verifyWebhookSignature } from 'ownpay-nodejs/webhooks';

// Import specific types
import type { Payment, Transaction } from 'ownpay-nodejs';

// Import specific errors
import { ValidationError, AuthenticationError } from 'ownpay-nodejs';
```

---

## Retry Behavior

The SDK automatically retries failed requests for transient errors:

| Status Code | Retryable | Behavior |
|-------------|-----------|----------|
| 429 | ✅ | Respects `Retry-After` header |
| 500 | ✅ | Exponential backoff |
| 502 | ✅ | Exponential backoff |
| 503 | ✅ | Exponential backoff |
| 504 | ✅ | Exponential backoff |
| 401 | ❌ | Immediate failure |
| 403 | ❌ | Immediate failure |
| 404 | ❌ | Immediate failure |
| 422 | ❌ | Immediate failure |

### Configure Retries

```typescript
const client = new OwnPay({
  apiKey: 'op_your_key',
  maxRetries: 3,  // Default: 2
  timeout: 60000, // Default: 30000ms
});
```

---

## Examples

### Complete Payment Flow

```typescript
import OwnPay from 'ownpay-nodejs';

const client = new OwnPay(process.env.OWNPAY_API_KEY!);

async function createOrder(amount: string, customerEmail: string) {
  try {
    // 1. Create customer (optional)
    const customer = await client.customers.create({
      name: 'Customer',
      email: customerEmail,
    });

    // 2. Create payment
    const payment = await client.payments.create({
      amount,
      currency: 'BDT',
      customer_email: customerEmail,
      customer_name: 'Customer',
      callback_url: 'https://your-app.com/webhook',
      redirect_url: 'https://your-app.com/success',
      cancel_url: 'https://your-app.com/cancel',
      reference: `ORDER-${Date.now()}`,
      metadata: {
        customer_id: customer.uuid,
      },
    });

    // 3. Return checkout URL for customer redirect
    return {
      payment_id: payment.payment_id,
      checkout_url: payment.checkout_url,
    };
  } catch (error) {
    console.error('Order creation failed:', error);
    throw error;
  }
}

// Check payment status
async function checkPaymentStatus(paymentId: string) {
  const payment = await client.payments.get(paymentId);

  switch (payment.status) {
    case 'completed':
      return { success: true, message: 'Payment completed' };
    case 'pending':
      return { success: false, message: 'Payment pending' };
    case 'failed':
      return { success: false, message: 'Payment failed' };
    default:
      return { success: false, message: `Status: ${payment.status}` };
  }
}
```

### Express.js Webhook Handler

```typescript
import express from 'express';
import OwnPay, { verifyWebhookSignature } from 'ownpay-nodejs';

const app = express();
const client = new OwnPay(process.env.OWNPAY_API_KEY!);

// IMPORTANT: Use raw body for webhook verification
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const signature = req.headers['x-ownpay-signature'] as string;
    const timestamp = req.headers['x-ownpay-timestamp'] as string;

    // Verify signature
    verifyWebhookSignature({
      payload: req.body,
      signature,
      secret: process.env.OWNPAY_WEBHOOK_SECRET!,
      timestamp,
    });

    // Parse and handle event
    const event = JSON.parse(req.body.toString());

    switch (event.event) {
      case 'payment.completed':
        // Update order status, send confirmation, etc.
        console.log(`Payment completed: ${event.transaction_id}`);
        break;

      case 'payment.failed':
        // Handle failed payment
        console.log(`Payment failed: ${event.transaction_id}`);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Invalid webhook' });
  }
});

app.listen(3000);
```

### Transaction Reporting

```typescript
async function getTransactionReport(startDate: string, endDate: string) {
  const result = await client.transactions.list({
    from: startDate,
    to: endDate,
    per_page: 100,
  });

  const totalAmount = result.items.reduce(
    (sum, txn) => sum + parseFloat(txn.amount),
    0
  );

  const totalFees = result.items.reduce(
    (sum, txn) => sum + parseFloat(txn.fee),
    0
  );

  return {
    transactions: result.items,
    total: result.meta.total,
    totalAmount,
    totalFees,
    netAmount: totalAmount - totalFees,
  };
}
```

---

## Troubleshooting

### Common Issues

#### "Invalid API key format"

Ensure your API key starts with `op_` and is at least 12 characters long.

```typescript
// ❌ Wrong
const client = new OwnPay('sk_live_...');

// ✅ Correct
const client = new OwnPay('op_abcdef123456...');
```

#### "Authentication failed"

- Check that your API key is active and not revoked
- Ensure you're using the correct key for your environment (test/live)

#### "Insufficient scope"

Your API key doesn't have the required permissions:

- `read` scope: GET requests
- `write` scope: POST/PUT/PATCH/DELETE requests
- `admin` scope: API key management operations

#### "Webhook verification failed"

- Ensure you're using the raw request body (not parsed JSON)
- Check that the webhook secret matches your configuration
- Verify the timestamp is within the tolerance window

### Debug Mode

Enable debug logging by checking error details:

```typescript
try {
  await client.payments.create({ amount: '100.00', currency: 'BDT' });
} catch (error) {
  console.error('Error:', error.toJSON());
  // {
  //   name: 'ValidationError',
  //   type: 'VALIDATION_ERROR',
  //   message: '...',
  //   status: 422,
  //   requestId: 'req-...'
  // }
}
```

---

## API Reference Summary

| Resource | Methods |
|----------|---------|
| `client.payments` | `create()`, `get()` |
| `client.transactions` | `list()`, `get()` |
| `client.refunds` | `create()`, `list()`, `get()` |
| `client.customers` | `create()`, `list()`, `get()` |
| `client.apiKeys` | `list()`, `generate()`, `revoke()` |
| `client.webhooks` | `test()`, `deliveries()` |
| `client.health` | `check()` |

---

## Support

- 📧 Email: support@ownpay.com
- 📖 Documentation: https://docs.ownpay.com
- 🐛 Issues: https://github.com/own-pay/ownpay-nodejs/issues

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
