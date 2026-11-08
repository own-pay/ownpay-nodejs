# Contributing to ownpay-nodejs

Thank you for your interest in contributing to the OwnPay Node.js SDK! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive experience for everyone.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a branch for your changes
4. Make your changes
5. Push to your fork and submit a pull request

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher

### Installation

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/ownpay-nodejs.git
cd ownpay-nodejs

# Install dependencies
npm install

# Run type checking
npm run lint

# Run tests
npm test

# Build the package
npm run build
```

## Project Structure

```
ownpay-nodejs/
├── src/
│   ├── core/
│   │   ├── client.ts      # HTTP client with native fetch
│   │   ├── errors.ts      # Error hierarchy
│   │   ├── types.ts       # TypeScript type definitions
│   │   └── utils.ts       # Utility functions
│   ├── resources/
│   │   ├── payments.ts    # Payment operations
│   │   ├── transactions.ts
│   │   ├── refunds.ts
│   │   ├── customers.ts
│   │   ├── api-keys.ts
│   │   ├── webhooks.ts
│   │   └── health.ts
│   ├── webhooks/
│   │   ├── verify.ts      # Webhook signature verification
│   │   └── index.ts
│   └── index.ts           # Main entry point
├── tests/
│   ├── client.test.ts
│   ├── errors.test.ts
│   ├── utils.test.ts
│   └── webhooks.test.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## Making Changes

### Adding a New Resource

1. Create a new file in `src/resources/`
2. Define the resource class with proper TypeScript types
3. Export the resource from `src/index.ts`
4. Add tests in `tests/`

Example:

```typescript
// src/resources/example.ts
import { HttpClient } from '../core/client.js';
import type { ApiResponse, RequestOptions } from '../core/types.js';

export class ExampleResource {
  constructor(private readonly client: HttpClient) {}

  async get(id: string, options?: RequestOptions): Promise<Example> {
    const response = await this.client.request<ApiResponse<Example>>({
      method: 'GET',
      path: `/examples/${encodeURIComponent(id)}`,
      options,
    });
    return response.data;
  }
}
```

### Adding New Types

1. Add types to `src/core/types.ts`
2. Use descriptive JSDoc comments
3. Export the types from `src/index.ts`

### Adding New Error Types

1. Add error class to `src/core/errors.ts`
2. Extend `OwnPayError`
3. Export from `src/index.ts`

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Place tests in the `tests/` directory
- Name test files as `*.test.ts`
- Use descriptive test names
- Test both success and error cases

Example:

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should handle valid input', () => {
    expect(myFunction('valid')).toBe(true);
  });

  it('should throw on invalid input', () => {
    expect(() => myFunction('')).toThrow();
  });
});
```

## Code Style

### TypeScript

- Use strict TypeScript (`strict: true`)
- Provide explicit return types for public methods
- Use `readonly` for immutable properties
- Prefer `interface` over `type` for object shapes
- Use JSDoc comments for public APIs

### Naming Conventions

- **Classes**: PascalCase (`PaymentsResource`)
- **Methods**: camelCase (`create`, `getList`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_TIMEOUT`)
- **Interfaces**: PascalCase (`CreatePaymentParams`)
- **Files**: camelCase (`payments.ts`), index files as `index.ts`

### Formatting

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas in multi-line structures
- Keep lines under 100 characters when practical

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding or updating tests |
| `chore` | Maintenance tasks |
| `ci` | CI/CD changes |

### Examples

```
feat(payments): add support for partial refunds
fix(client): handle network timeout correctly
docs(readme): update installation instructions
test(webhooks): add signature verification tests
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass** (`npm test`)
4. **Ensure type checking passes** (`npm run lint`)
5. **Build the package** (`npm run build`)
6. **Write a clear PR description** explaining the changes

### PR Checklist

- [ ] Tests added/updated
- [ ] TypeScript types updated
- [ ] Documentation updated
- [ ] All tests passing
- [ ] Type checking passing
- [ ] Build successful

## Reporting Issues

### Bug Reports

Include:

- SDK version
- Node.js version
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages/logs

### Feature Requests

Include:

- Use case description
- Proposed API design
- Alternatives considered

## Release Process

Maintainers handle releases:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a GitHub Release
4. GitHub Actions automatically publishes to npm

## Questions?

- Open a [GitHub Issue](https://github.com/own-pay/ownpay-nodejs/issues)
- Check existing [Discussions](https://github.com/own-pay/ownpay-nodejs/discussions)

Thank you for contributing! 🎉
