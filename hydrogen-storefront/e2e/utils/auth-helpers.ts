import { Page, BrowserContext, expect } from '@playwright/test';
import { TestUsers } from '../fixtures/test-data';

/**
 * Authentication helper utilities for managing user sessions in E2E tests.
 */

export interface AuthUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Logs in a user via the login form.
 */
export async function login(page: Page, user: AuthUser): Promise<void> {
  await page.goto('/account/login');
  await page.waitForLoadState('networkidle');

  // Fill login form
  await page.locator('[data-testid="login-email"]').fill(user.email);
  await page.locator('[data-testid="login-password"]').fill(user.password);

  // Submit form
  await page.locator('[data-testid="login-submit"]').click();

  // Wait for successful login redirect
  await page.waitForURL(/\/account(?!\/login)/, { timeout: 15_000 });

  // Verify user is logged in
  const accountNav = page.locator('[data-testid="account-nav"]');
  await expect(accountNav).toBeVisible({ timeout: 5_000 });
}

/**
 * Logs out the current user.
 */
export async function logout(page: Page): Promise<void> {
  // Click account menu
  const accountMenu = page.locator('[data-testid="account-menu"]');
  if (await accountMenu.isVisible()) {
    await accountMenu.click();
  }

  // Click logout
  const logoutButton = page.locator('[data-testid="logout-button"]');
  await logoutButton.click();

  // Wait for logout to complete
  await page.waitForURL('/', { timeout: 10_000 });

  // Verify user is logged out
  const loginLink = page.locator('[data-testid="login-link"]');
  await expect(loginLink).toBeVisible({ timeout: 5_000 });
}

/**
 * Registers a new user account.
 */
export async function register(page: Page, user: AuthUser): Promise<void> {
  await page.goto('/account/register');
  await page.waitForLoadState('networkidle');

  // Fill registration form
  await page.locator('[data-testid="register-email"]').fill(user.email);
  await page.locator('[data-testid="register-password"]').fill(user.password);
  await page.locator('[data-testid="register-password-confirm"]').fill(user.password);

  if (user.firstName) {
    await page.locator('[data-testid="register-firstname"]').fill(user.firstName);
  }
  if (user.lastName) {
    await page.locator('[data-testid="register-lastname"]').fill(user.lastName);
  }

  // Submit form
  await page.locator('[data-testid="register-submit"]').click();

  // Wait for successful registration
  await page.waitForURL(/\/account(?!\/register)/, { timeout: 15_000 });
}

/**
 * Checks if user is currently authenticated.
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const accountNav = page.locator('[data-testid="account-nav"]');
  return await accountNav.isVisible();
}

/**
 * Saves authenticated state for reuse across tests.
 */
export async function saveAuthState(
  context: BrowserContext,
  storageStatePath: string
): Promise<void> {
  await context.storageState({ path: storageStatePath });
}

/**
 * Creates a fresh browser context with guest (unauthenticated) state.
 */
export async function createGuestState(storageStatePath: string): Promise<void> {
  const fs = await import('fs');
  const guestState = {
    cookies: [],
    origins: [],
  };
  fs.writeFileSync(storageStatePath, JSON.stringify(guestState, null, 2));
}

/**
 * Creates authenticated state by logging in and saving.
 */
export async function createAuthenticatedState(
  page: Page,
  context: BrowserContext,
  user: AuthUser,
  storageStatePath: string
): Promise<void> {
  await login(page, user);
  await saveAuthState(context, storageStatePath);
}

/**
 * Requests password reset for a user.
 */
export async function requestPasswordReset(page: Page, email: string): Promise<void> {
  await page.goto('/account/recover');
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="recover-email"]').fill(email);
  await page.locator('[data-testid="recover-submit"]').click();

  // Wait for confirmation message
  const confirmMessage = page.locator('[data-testid="recover-confirmation"]');
  await expect(confirmMessage).toBeVisible({ timeout: 10_000 });
}

/**
 * Updates user profile information.
 */
export async function updateProfile(
  page: Page,
  updates: Partial<AuthUser & { phone?: string }>
): Promise<void> {
  await page.goto('/account');
  await page.waitForLoadState('networkidle');

  // Click edit profile
  await page.locator('[data-testid="edit-profile-button"]').click();

  // Update fields
  if (updates.firstName) {
    await page.locator('[data-testid="profile-firstname"]').fill(updates.firstName);
  }
  if (updates.lastName) {
    await page.locator('[data-testid="profile-lastname"]').fill(updates.lastName);
  }
  if (updates.phone) {
    await page.locator('[data-testid="profile-phone"]').fill(updates.phone);
  }

  // Save changes
  await page.locator('[data-testid="profile-save"]').click();

  // Wait for success message
  const successMessage = page.locator('[data-testid="profile-success"]');
  await expect(successMessage).toBeVisible({ timeout: 5_000 });
}
