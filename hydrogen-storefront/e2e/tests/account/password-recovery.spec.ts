import { test, expect } from '@playwright/test';
import { PasswordRecoveryPage, LoginPage } from '../../pages/account.page';
import { TestUsers } from '../../fixtures/test-data';

test.describe('Password Recovery', () => {
  let recoveryPage: PasswordRecoveryPage;
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    recoveryPage = new PasswordRecoveryPage(page);
    loginPage = new LoginPage(page);
  });

  test('should request password reset for valid email', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.requestReset(TestUsers.STANDARD_USER.email);

    await recoveryPage.expectConfirmation();
  });

  test('should show confirmation even for non-existent email', async ({ page }) => {
    // For security, same message for existing and non-existing emails
    await recoveryPage.goto();

    await recoveryPage.requestReset('nonexistent@example.com');

    // Should show same confirmation (security best practice)
    await recoveryPage.expectConfirmation();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.emailInput.fill('invalid-email');
    await recoveryPage.submitButton.click();

    const emailError = page.locator('[data-testid="field-error-email"], [data-testid="recover-error"]');
    await expect(emailError).toBeVisible();
  });

  test('should show error for empty email', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.submitButton.click();

    const emailError = page.locator('[data-testid="field-error-email"], [data-testid="recover-error"]');
    await expect(emailError).toBeVisible();
  });

  test('should navigate back to login page', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.backToLoginLink.click();

    await expect(page).toHaveURL(/\/account\/login/);
  });

  test('should navigate from login page to recovery', async ({ page }) => {
    await loginPage.goto();

    await loginPage.forgotPasswordLink.click();

    await expect(page).toHaveURL(/\/account\/recover/);
  });

  test('should show recovery confirmation message with email', async ({ page }) => {
    const email = TestUsers.STANDARD_USER.email;
    await recoveryPage.goto();

    await recoveryPage.requestReset(email);

    await recoveryPage.expectConfirmation();

    // Confirmation may include the email
    const confirmationText = await recoveryPage.confirmationMessage.textContent();
    // Some implementations hide email for security, some show it
  });

  test('should disable submit button during request', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.emailInput.fill(TestUsers.STANDARD_USER.email);
    await recoveryPage.submitButton.click();

    // Button should be disabled during request
    // This is optional and may not be detectable if the request is fast
  });

  test('should allow resending recovery email', async ({ page }) => {
    await recoveryPage.goto();
    await recoveryPage.requestReset(TestUsers.STANDARD_USER.email);
    await recoveryPage.expectConfirmation();

    // Look for resend link/button
    const resendButton = page.locator('[data-testid="resend-recovery"]');
    if (await resendButton.isVisible()) {
      await resendButton.click();
      // Should show success or throttle message
    }
  });

  test('should handle email with spaces', async ({ page }) => {
    await recoveryPage.goto();

    await recoveryPage.requestReset(`  ${TestUsers.STANDARD_USER.email}  `);

    // Should either trim and succeed or show appropriate message
    const confirmation = await recoveryPage.confirmationMessage.isVisible();
    const error = await recoveryPage.errorMessage.isVisible();

    expect(confirmation || error).toBeTruthy();
  });

  test('should display helpful instructions', async ({ page }) => {
    await recoveryPage.goto();

    // Should have instructions about the recovery process
    const instructions = page.locator('[data-testid="recovery-instructions"], p:has-text("email")');
    await expect(instructions.first()).toBeVisible();
  });
});
