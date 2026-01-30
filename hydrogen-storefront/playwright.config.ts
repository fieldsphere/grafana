import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Hydrogen Storefront E2E tests.
 * 
 * Features:
 * - Screenshots and videos captured on failure
 * - HTML report generation
 * - Retry logic for flake reduction
 * - Proper timeouts for reliable test execution
 */

const DEFAULT_BASE_URL = process.env.STOREFRONT_URL || 'http://localhost:3000';

export const baseConfig: PlaywrightTestConfig = {
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: DEFAULT_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    // Global setup - resets test data state
    {
      name: 'setup',
      testDir: './e2e',
      testMatch: /global-setup\.ts/,
    },
    // Cart flow tests
    {
      name: 'cart',
      testDir: './e2e/tests/cart',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/guest.json',
      },
    },
    // Account flow tests (unauthenticated scenarios)
    {
      name: 'account-unauthenticated',
      testDir: './e2e/tests/account',
      testMatch: /.*\.(registration|login)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    // Account flow tests (authenticated scenarios)
    {
      name: 'account-authenticated',
      testDir: './e2e/tests/account',
      testIgnore: /.*\.(registration|login)\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/authenticated.json',
      },
    },
    // Checkout flow tests - guest checkout
    {
      name: 'checkout-guest',
      testDir: './e2e/tests/checkout',
      testMatch: /.*guest.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/guest.json',
      },
    },
    // Checkout flow tests - authenticated checkout
    {
      name: 'checkout-authenticated',
      testDir: './e2e/tests/checkout',
      testIgnore: /.*guest.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/authenticated.json',
      },
    },
    // Mobile viewport tests for critical flows
    {
      name: 'mobile-chrome',
      testDir: './e2e/tests',
      testMatch: /.*critical.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/guest.json',
      },
    },
    // Global teardown
    {
      name: 'teardown',
      testDir: './e2e',
      testMatch: /global-teardown\.ts/,
      dependencies: ['cart', 'account-authenticated', 'checkout-guest', 'checkout-authenticated'],
    },
  ],
};

export default defineConfig(baseConfig);
