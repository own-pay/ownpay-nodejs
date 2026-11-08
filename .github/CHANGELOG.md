# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-16

### Added

- Initial release of @ownpay/nodejs SDK
- Zero external dependencies (uses Node.js native fetch API)
- TypeScript-first with comprehensive type definitions
- ESM + CJS dual package support
- Tree-shakeable modular exports

#### Core Features

- `OwnPay` client class with configurable options
- Automatic retry with exponential backoff for transient errors
- Request timeout handling with AbortController
- Idempotency key support for safe request retries
- Comprehensive error hierarchy for precise error handling

#### Resources

- **Payments**: Create payment intents, retrieve payment details
- **Transactions**: List and retrieve transactions with filtering/pagination
- **Refunds**: Create full/partial refunds, list and retrieve refund details
- **Customers**: Create customers, list and retrieve by email/phone
- **API Keys**: Generate, list, and revoke API keys (admin scope required)
- **Webhooks**: Test webhook endpoints, list delivery history
- **Health**: System health check endpoint

#### Webhook Utilities

- `verifyWebhookSignature()`: Verify HMAC-SHA256 webhook signatures
- `generateSignature()`: Generate webhook signatures for testing
- `parseWebhookPayload()`: Parse webhook request bodies
- Timestamp validation for replay attack protection

#### Error Types

- `AuthenticationError` (401)
- `PermissionError` (403)
- `NotFoundError` (404)
- `ValidationError` (422)
- `RateLimitError` (429)
- `IdempotencyError` (409)
- `ApiError` (5xx)
- `NetworkError`
- `AbortError`
- `WebhookVerificationError`

#### Documentation

- Comprehensive README with integration guide
- Full API reference with examples
- Webhook handling guide
- Error handling guide
- Troubleshooting section
