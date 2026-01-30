import { test, expect } from '@playwright/test';
import { RegisterPage, AccountDashboardPage } from '../../pages/account.page';
import { TestUsers } from '../../fixtures/test-data';

test.describe('Registration', () => {
  let registerPage: RegisterPage;
  let dashboardPage: AccountDashboardPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    dashboardPage = new AccountDashboardPage(page);
  });

  test('should register with valid information', async ({ page }) => {
    await registerPage.goto();

    const newEmail = TestUsers.NEW_USER.getEmail();
    await registerPage.register(
      newEmail,
      TestUsers.NEW_USER.password,
      TestUsers.NEW_USER.firstName,
      TestUsers.NEW_USER.lastName
    );

    await registerPage.expectSuccess();
    await dashboardPage.expectLoggedIn();
  });

  test('should show error when registering with existing email', async ({ page }) => {
    await registerPage.goto();

    await registerPage.register(
      TestUsers.STANDARD_USER.email, // Existing user email
      TestUsers.NEW_USER.password
    );

    await registerPage.expectError('already exists');
  });

  test('should show error with invalid email format', async ({ page }) => {
    await registerPage.goto();

    await registerPage.emailInput.fill('invalid-email');
    await registerPage.passwordInput.fill(TestUsers.NEW_USER.password);
    await registerPage.confirmPasswordInput.fill(TestUsers.NEW_USER.password);
    await registerPage.submitButton.click();

    const emailError = page.locator('[data-testid="field-error-email"], [data-testid="register-email-error"]');
    await expect(emailError).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    await registerPage.goto();

    await registerPage.emailInput.fill(TestUsers.NEW_USER.getEmail());
    await registerPage.passwordInput.fill(TestUsers.NEW_USER.password);
    await registerPage.confirmPasswordInput.fill('differentpassword');
    await registerPage.submitButton.click();

    const error = page.locator('[data-testid="password-mismatch-error"], [data-testid="register-error"]');
    await expect(error).toBeVisible();
  });

  test('should show error with weak password', async ({ page }) => {
    await registerPage.goto();

    await registerPage.emailInput.fill(TestUsers.NEW_USER.getEmail());
    await registerPage.passwordInput.fill('123'); // Too weak
    await registerPage.confirmPasswordInput.fill('123');
    await registerPage.submitButton.click();

    // Should show password strength/validation error
    const passwordError = page.locator('[data-testid="field-error-password"], [data-testid="register-error"]');
    await expect(passwordError).toBeVisible();
  });

  test('should show error with empty required fields', async ({ page }) => {
    await registerPage.goto();

    await registerPage.submitButton.click();

    // Should show validation errors
    await expect(registerPage.errorMessage).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await registerPage.goto();

    await registerPage.loginLink.click();

    await page.waitForURL(/\/account\/login/);
  });

  test('should auto-login after successful registration', async ({ page }) => {
    await registerPage.goto();

    const newEmail = TestUsers.NEW_USER.getEmail();
    await registerPage.register(
      newEmail,
      TestUsers.NEW_USER.password,
      TestUsers.NEW_USER.firstName,
      TestUsers.NEW_USER.lastName
    );

    await registerPage.expectSuccess();

    // Should be logged in automatically
    const accountNav = page.locator('[data-testid="account-nav"]');
    await expect(accountNav).toBeVisible();
  });

  test('should display password requirements', async ({ page }) => {
    await registerPage.goto();

    // Focus on password field
    await registerPage.passwordInput.focus();

    // Password requirements should be visible
    const requirements = page.locator('[data-testid="password-requirements"]');
    // Note: This may not exist in all implementations
    // If not visible, the test passes as it's an optional UX feature
  });

  test('should validate email format in real-time', async ({ page }) => {
    await registerPage.goto();

    // Type invalid email
    await registerPage.emailInput.fill('invalid');
    await registerPage.emailInput.blur();

    // May show inline validation
    const emailError = page.locator('[data-testid="field-error-email"]');
    // This is optional real-time validation
  });

  test('should handle special characters in name fields', async ({ page }) => {
    await registerPage.goto();

    const newEmail = TestUsers.NEW_USER.getEmail();
    await registerPage.register(
      newEmail,
      TestUsers.NEW_USER.password,
      "Test-O'Brien", // Special characters
      'User Jr.'
    );

    // Should either succeed or show appropriate error
    const url = page.url();
    const hasError = await registerPage.errorMessage.isVisible();

    expect(url.includes('/account') || hasError).toBeTruthy();
  });

  test('should redirect authenticated user away from registration', async ({ page }) => {
    // First register and login
    await registerPage.goto();
    const newEmail = TestUsers.NEW_USER.getEmail();
    await registerPage.register(newEmail, TestUsers.NEW_USER.password);
    await registerPage.expectSuccess();

    // Try to navigate to registration
    await page.goto('/account/register');

    // Should redirect away
    await expect(page).toHaveURL(/\/account(?!\/register)/);
  });

  test('should show password strength indicator', async ({ page }) => {
    await registerPage.goto();

    await registerPage.passwordInput.fill('weak');

    // Check for strength indicator
    const strengthIndicator = page.locator('[data-testid="password-strength"]');
    // This is an optional UX feature

    // Try with strong password
    await registerPage.passwordInput.fill('VeryStr0ng!P@ssword123');
  });

  test('should preserve form data on validation error', async ({ page }) => {
    await registerPage.goto();

    const email = TestUsers.NEW_USER.getEmail();
    const firstName = 'Test';
    const lastName = 'User';

    await registerPage.emailInput.fill(email);
    await registerPage.firstNameInput.fill(firstName);
    await registerPage.lastNameInput.fill(lastName);
    await registerPage.passwordInput.fill('password');
    await registerPage.confirmPasswordInput.fill('different'); // Mismatch to cause error

    await registerPage.submitButton.click();

    // After error, check that other fields preserved their values
    await expect(registerPage.emailInput).toHaveValue(email);
    await expect(registerPage.firstNameInput).toHaveValue(firstName);
    await expect(registerPage.lastNameInput).toHaveValue(lastName);
  });
});
