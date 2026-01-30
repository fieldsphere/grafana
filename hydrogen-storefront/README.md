# Hydrogen Storefront E2E Tests

Comprehensive Playwright end-to-end test suite for Hydrogen storefront cart, account, and checkout flows.

## Features

- **Stable Test Data**: Consistent, predictable fixtures for reliable test execution
- **Cart State Reset**: Automatic cart clearing between test runs for isolation
- **Screenshots/Videos on Failure**: Automatic capture for debugging failed tests
- **HTML Reports**: Rich test reports with execution details
- **Low Flake Rates**: Retry logic, proper timeouts, and stable selectors

## Quick Start

### Prerequisites

- Node.js 18+
- A running Hydrogen storefront (default: `http://localhost:3000`)

### Installation

```sh
cd hydrogen-storefront
npm install
npx playwright install
```

### Running Tests

```sh
# Run all tests
npm test

# Run specific test suites
npm run test:cart       # Cart flow tests
npm run test:account    # Account flow tests
npm run test:checkout   # Checkout flow tests
npm run test:mobile     # Mobile viewport tests

# Interactive UI mode
npm run test:ui

# Debug mode
npm run test:debug

# Generate test code
npm run codegen
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STOREFRONT_URL` | Base URL of storefront | `http://localhost:3000` |
| `CI` | Set in CI environments | - |

## Test Architecture

```
e2e/
├── fixtures/           # Test data and fixtures
│   ├── test-data.ts   # Products, users, addresses, payment info
│   └── index.ts       # Barrel export
├── pages/             # Page Object Models
│   ├── cart.page.ts
│   ├── account.page.ts
│   ├── checkout.page.ts
│   ├── product.page.ts
│   └── index.ts
├── utils/             # Helper utilities
│   ├── cart-helpers.ts
│   ├── auth-helpers.ts
│   ├── checkout-helpers.ts
│   └── index.ts
├── tests/
│   ├── cart/          # Cart flow tests
│   ├── account/       # Account flow tests
│   ├── checkout/      # Checkout flow tests
│   └── critical-flows.spec.ts  # Critical user journeys
├── global-setup.ts    # Pre-test setup
└── global-teardown.ts # Post-test cleanup
```

## Test Coverage

### Cart Flows (27 tests)

| Feature | Tests | Status |
|---------|-------|--------|
| Add to cart | 8 | Covered |
| Update quantity | 10 | Covered |
| Remove from cart | 8 | Covered |
| Cart persistence | 10 | Covered |
| Discount codes | 10 | Covered |

### Account Flows (32 tests)

| Feature | Tests | Status |
|---------|-------|--------|
| Login | 13 | Covered |
| Registration | 13 | Covered |
| Profile management | 11 | Covered |
| Password recovery | 9 | Covered |

### Checkout Flows (34 tests)

| Feature | Tests | Status |
|---------|-------|--------|
| Guest checkout | 14 | Covered |
| Authenticated checkout | 11 | Covered |
| Payment methods | 14 | Covered |
| Edge cases | 12 | Covered |

### Critical Flows (9 tests)

Mobile-responsive tests covering essential user journeys.

## Coverage Gaps

The following areas are **not covered** by this test suite and may require additional testing:

### Not Covered

1. **Search Functionality**
   - Product search
   - Search filters and sorting
   - Search suggestions/autocomplete

2. **Wishlist/Favorites**
   - Adding items to wishlist
   - Wishlist management
   - Moving items from wishlist to cart

3. **Product Reviews**
   - Viewing reviews
   - Writing reviews
   - Review filtering

4. **Multi-currency/Localization**
   - Currency switching
   - Language switching
   - Locale-specific content

5. **Subscription Products**
   - Subscription checkout
   - Subscription management
   - Recurring payment flows

6. **Gift Cards**
   - Purchasing gift cards
   - Redeeming gift cards
   - Gift card balance checks

7. **Store Locator**
   - Finding nearby stores
   - Store availability checks
   - Click and collect

8. **Social Features**
   - Social login (Google, Facebook, Apple)
   - Social sharing
   - Referral programs

9. **Performance Testing**
   - Load time benchmarks
   - Concurrent user testing
   - API response times

10. **Accessibility Testing**
    - Screen reader compatibility
    - Keyboard navigation
    - Color contrast compliance

### Partially Covered

1. **Express Checkout** - Test stubs exist but require real payment provider integration
2. **3D Secure** - Basic handling, needs provider-specific testing
3. **International Shipping** - Address validation varies by region

## Reliability Features

### Test Isolation

Each test:
- Clears cart state before running
- Uses unique email addresses for user creation
- Does not depend on other tests' execution

### Retry Logic

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 1,
```

### Timeouts

```typescript
timeout: 60_000,           // Test timeout
expect.timeout: 15_000,    // Assertion timeout
actionTimeout: 15_000,     // Action timeout
navigationTimeout: 30_000, // Navigation timeout
```

### Failure Artifacts

On test failure, Playwright automatically captures:
- Screenshot of the page
- Video recording of the test
- Execution trace for debugging

## Adding New Tests

### 1. Create Page Object (if needed)

```typescript
// e2e/pages/new-feature.page.ts
import { Page, Locator, expect } from '@playwright/test';

export class NewFeaturePage {
  readonly page: Page;
  readonly someElement: Locator;

  constructor(page: Page) {
    this.page = page;
    this.someElement = page.locator('[data-testid="some-element"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/new-feature');
  }
}
```

### 2. Add Test Fixtures (if needed)

```typescript
// e2e/fixtures/test-data.ts
export const NewTestData = {
  ITEM_ONE: { id: '1', name: 'Test Item' },
} as const;
```

### 3. Write Tests

```typescript
// e2e/tests/new-feature/new-feature.spec.ts
import { test, expect } from '@playwright/test';
import { NewFeaturePage } from '../../pages/new-feature.page';

test.describe('New Feature', () => {
  test('should do something', async ({ page }) => {
    const featurePage = new NewFeaturePage(page);
    await featurePage.goto();
    await expect(featurePage.someElement).toBeVisible();
  });
});
```

### 4. Use Test IDs

Always use `data-testid` attributes for element selection:

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
const button = page.locator('[data-testid="submit-button"]');
```

## CI Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      
      - name: Install dependencies
        run: npm ci
        working-directory: hydrogen-storefront
      
      - name: Install Playwright
        run: npx playwright install --with-deps
        working-directory: hydrogen-storefront
      
      - name: Run E2E tests
        run: npm test
        working-directory: hydrogen-storefront
        env:
          STOREFRONT_URL: ${{ secrets.STOREFRONT_URL }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: hydrogen-storefront/playwright-report/
```

## Viewing Reports

After running tests, view the HTML report:

```sh
npm run test:report
```

Reports include:
- Test execution timeline
- Pass/fail status per test
- Screenshots and videos for failures
- Execution traces

## Troubleshooting

### Tests failing with timeout

1. Increase timeout in `playwright.config.ts`
2. Check if storefront is running
3. Verify `STOREFRONT_URL` is correct

### Flaky tests

1. Add explicit waits for dynamic content
2. Use `page.waitForLoadState('networkidle')`
3. Increase retry count for specific tests

### Authentication issues

1. Check auth storage state in `e2e/.auth/`
2. Verify test user credentials
3. Run global setup manually: `npx playwright test --project=setup`

## Directory Size

This directory and its contents have the following disk footprint (via `du -h`):

```text
16K     e2e/fixtures
4.0K    e2e/.auth
44K     e2e/pages
44K     e2e/tests/cart
44K     e2e/tests/checkout
36K     e2e/tests/account
136K    e2e/tests
32K     e2e/utils
244K    e2e
276K    hydrogen-storefront/
```

## License

MIT
