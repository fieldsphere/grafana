import { test, expect } from '@playwright/test';
import { AccountDashboardPage, ProfileEditPage } from '../../pages/account.page';
import { TestUsers } from '../../fixtures/test-data';

test.describe('Profile Management', () => {
  let dashboardPage: AccountDashboardPage;
  let profilePage: ProfileEditPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new AccountDashboardPage(page);
    profilePage = new ProfileEditPage(page);
    // Tests use authenticated storage state
  });

  test('should display user information on dashboard', async ({ page }) => {
    await dashboardPage.goto();

    await dashboardPage.expectLoggedIn();
    await expect(dashboardPage.welcomeMessage).toContainText(TestUsers.STANDARD_USER.firstName);
  });

  test('should navigate to profile edit page', async ({ page }) => {
    await dashboardPage.goto();

    await dashboardPage.editProfileButton.click();

    await expect(page).toHaveURL(/\/account\/profile|\/account\/edit/);
  });

  test('should update first name', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    const newFirstName = 'UpdatedFirst';
    await profilePage.updateFirstName(newFirstName);
    await profilePage.save();

    await profilePage.expectSaveSuccess();

    // Navigate back to dashboard to verify
    await dashboardPage.goto();
    await expect(dashboardPage.welcomeMessage).toContainText(newFirstName);

    // Reset to original
    await dashboardPage.editProfileButton.click();
    await profilePage.updateFirstName(TestUsers.STANDARD_USER.firstName);
    await profilePage.save();
  });

  test('should update last name', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    const newLastName = 'UpdatedLast';
    await profilePage.updateLastName(newLastName);
    await profilePage.save();

    await profilePage.expectSaveSuccess();

    // Reset
    await profilePage.updateLastName(TestUsers.STANDARD_USER.lastName);
    await profilePage.save();
  });

  test('should update phone number', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    const newPhone = '+14155559999';
    await profilePage.updatePhone(newPhone);
    await profilePage.save();

    await profilePage.expectSaveSuccess();
  });

  test('should show error for invalid phone format', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    await profilePage.updatePhone('invalid-phone');
    await profilePage.save();

    // Should show validation error
    const phoneError = page.locator('[data-testid="field-error-phone"], [data-testid="profile-error"]');
    await expect(phoneError).toBeVisible();
  });

  test('should cancel profile edit without saving', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    const originalName = await profilePage.firstNameInput.inputValue();
    await profilePage.updateFirstName('TemporaryName');
    await profilePage.cancel();

    // Navigate back to profile
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    // Name should be unchanged
    await expect(profilePage.firstNameInput).toHaveValue(originalName);
  });

  test('should logout from account dashboard', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.expectLoggedIn();

    await dashboardPage.logout();

    // Should be redirected to homepage or login
    await expect(page).toHaveURL(/^\/($|login)/);

    // Login link should be visible
    const loginLink = page.locator('[data-testid="login-link"]');
    await expect(loginLink).toBeVisible();
  });

  test('should show order history section', async ({ page }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.orderHistory).toBeVisible();
  });

  test('should show address book section', async ({ page }) => {
    await dashboardPage.goto();

    await expect(dashboardPage.addressBook).toBeVisible();
  });

  test('should handle empty order history', async ({ page }) => {
    await dashboardPage.goto();

    // Either show orders or empty message
    const hasOrders = await dashboardPage.orderHistory.locator('[data-testid="order-item"]').count() > 0;

    if (!hasOrders) {
      await dashboardPage.expectNoOrders();
    }
  });

  test('should validate required fields in profile edit', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    // Clear first name and try to save
    await profilePage.firstNameInput.clear();
    await profilePage.save();

    // Should show error
    await profilePage.expectError();
  });

  test('should persist profile changes after logout and login', async ({ page }) => {
    // Update profile
    await dashboardPage.goto();
    await dashboardPage.editProfileButton.click();

    const uniqueLastName = `Updated${Date.now()}`;
    await profilePage.updateLastName(uniqueLastName);
    await profilePage.save();
    await profilePage.expectSaveSuccess();

    // Logout
    await dashboardPage.goto();
    await dashboardPage.logout();

    // Login again
    await page.goto('/account/login');
    await page.locator('[data-testid="login-email"]').fill(TestUsers.STANDARD_USER.email);
    await page.locator('[data-testid="login-password"]').fill(TestUsers.STANDARD_USER.password);
    await page.locator('[data-testid="login-submit"]').click();
    await page.waitForURL(/\/account(?!\/login)/);

    // Verify change persisted
    await dashboardPage.editProfileButton.click();
    await expect(profilePage.lastNameInput).toHaveValue(uniqueLastName);

    // Reset
    await profilePage.updateLastName(TestUsers.STANDARD_USER.lastName);
    await profilePage.save();
  });
});
