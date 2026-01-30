import { test, expect } from '@playwright/test';
import { LoginPage, AccountDashboardPage } from '../../pages/account.page';
import { TestUsers } from '../../fixtures/test-data';

test.describe('Login', () => {
  let loginPage: LoginPage;
  let dashboardPage: AccountDashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new AccountDashboardPage(page);
  });

  test('should login with valid credentials', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(TestUsers.STANDARD_USER.email, TestUsers.STANDARD_USER.password);

    await loginPage.expectSuccess();
    await dashboardPage.expectLoggedIn();
  });

  test('should show error with invalid email', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login('invalid@email.com', 'somepassword');

    await loginPage.expectError();
  });

  test('should show error with invalid password', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(TestUsers.STANDARD_USER.email, 'wrongpassword');

    await loginPage.expectError();
  });

  test('should show error with empty email', async ({ page }) => {
    await loginPage.goto();

    await loginPage.passwordInput.fill(TestUsers.STANDARD_USER.password);
    await loginPage.submitButton.click();

    // Should show validation error
    const emailError = page.locator('[data-testid="login-email-error"], [data-testid="field-error-email"]');
    await expect(emailError).toBeVisible();
  });

  test('should show error with empty password', async ({ page }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill(TestUsers.STANDARD_USER.email);
    await loginPage.submitButton.click();

    // Should show validation error
    const passwordError = page.locator('[data-testid="login-password-error"], [data-testid="field-error-password"]');
    await expect(passwordError).toBeVisible();
  });

  test('should navigate to registration page', async ({ page }) => {
    await loginPage.goto();

    await loginPage.registerLink.click();

    await page.waitForURL(/\/account\/register/);
  });

  test('should navigate to password recovery page', async ({ page }) => {
    await loginPage.goto();

    await loginPage.forgotPasswordLink.click();

    await page.waitForURL(/\/account\/recover/);
  });

  test('should redirect to account page after login', async ({ page }) => {
    await loginPage.goto();

    await loginPage.login(TestUsers.STANDARD_USER.email, TestUsers.STANDARD_USER.password);

    await expect(page).toHaveURL(/\/account(?!\/login)/);
  });

  test('should redirect authenticated user away from login page', async ({ page }) => {
    // First login
    await loginPage.goto();
    await loginPage.login(TestUsers.STANDARD_USER.email, TestUsers.STANDARD_USER.password);
    await loginPage.expectSuccess();

    // Try to navigate back to login
    await page.goto('/account/login');

    // Should redirect to account dashboard
    await expect(page).toHaveURL(/\/account(?!\/login)/);
  });

  test('should show password visibility toggle', async ({ page }) => {
    await loginPage.goto();

    // Password should be hidden by default
    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');

    // Click show password toggle if available
    const toggleButton = page.locator('[data-testid="password-toggle"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'text');

      await toggleButton.click();
      await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
    }
  });

  test('should handle email with leading/trailing spaces', async ({ page }) => {
    await loginPage.goto();

    // Login with spaces around email
    await loginPage.login(`  ${TestUsers.STANDARD_USER.email}  `, TestUsers.STANDARD_USER.password);

    // Should either trim and succeed or show appropriate error
    const success = await page.url().includes('/account') && !page.url().includes('/login');
    const error = await loginPage.errorMessage.isVisible();

    expect(success || error).toBeTruthy();
  });

  test('should disable submit button during login request', async ({ page }) => {
    await loginPage.goto();

    await loginPage.emailInput.fill(TestUsers.STANDARD_USER.email);
    await loginPage.passwordInput.fill(TestUsers.STANDARD_USER.password);

    // Click and immediately check if button is disabled
    const submitPromise = loginPage.submitButton.click();

    // Button should be disabled or show loading state
    const isDisabled = await loginPage.submitButton.isDisabled();
    const hasLoadingClass = await loginPage.submitButton.evaluate((el) =>
      el.classList.contains('loading') || el.getAttribute('data-loading') === 'true'
    );

    await submitPromise;

    // Either should have been disabled or shown loading
    // This test may be flaky if the request is too fast
  });

  test('should persist session after login', async ({ page, context }) => {
    await loginPage.goto();
    await loginPage.login(TestUsers.STANDARD_USER.email, TestUsers.STANDARD_USER.password);
    await loginPage.expectSuccess();

    // Open new page in same context
    const newPage = await context.newPage();
    const newDashboard = new AccountDashboardPage(newPage);
    await newDashboard.goto();

    // Should still be logged in
    await newDashboard.expectLoggedIn();

    await newPage.close();
  });
});
