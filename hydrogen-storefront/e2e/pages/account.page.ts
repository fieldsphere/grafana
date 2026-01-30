import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Account-related pages.
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="login-email"]');
    this.passwordInput = page.locator('[data-testid="login-password"]');
    this.submitButton = page.locator('[data-testid="login-submit"]');
    this.errorMessage = page.locator('[data-testid="login-error"]');
    this.forgotPasswordLink = page.locator('[data-testid="forgot-password-link"]');
    this.registerLink = page.locator('[data-testid="register-link"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccess(): Promise<void> {
    await this.page.waitForURL(/\/account(?!\/login)/, { timeout: 15_000 });
  }
}

export class RegisterPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="register-email"]');
    this.passwordInput = page.locator('[data-testid="register-password"]');
    this.confirmPasswordInput = page.locator('[data-testid="register-password-confirm"]');
    this.firstNameInput = page.locator('[data-testid="register-firstname"]');
    this.lastNameInput = page.locator('[data-testid="register-lastname"]');
    this.submitButton = page.locator('[data-testid="register-submit"]');
    this.errorMessage = page.locator('[data-testid="register-error"]');
    this.loginLink = page.locator('[data-testid="login-link"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account/register');
    await this.page.waitForLoadState('networkidle');
  }

  async register(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.confirmPasswordInput.fill(password);

    if (firstName) {
      await this.firstNameInput.fill(firstName);
    }
    if (lastName) {
      await this.lastNameInput.fill(lastName);
    }

    await this.submitButton.click();
  }

  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectSuccess(): Promise<void> {
    await this.page.waitForURL(/\/account(?!\/register)/, { timeout: 15_000 });
  }
}

export class AccountDashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly orderHistory: Locator;
  readonly addressBook: Locator;
  readonly profileSection: Locator;
  readonly editProfileButton: Locator;
  readonly logoutButton: Locator;
  readonly noOrdersMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('[data-testid="welcome-message"]');
    this.orderHistory = page.locator('[data-testid="order-history"]');
    this.addressBook = page.locator('[data-testid="address-book"]');
    this.profileSection = page.locator('[data-testid="profile-section"]');
    this.editProfileButton = page.locator('[data-testid="edit-profile-button"]');
    this.logoutButton = page.locator('[data-testid="logout-button"]');
    this.noOrdersMessage = page.locator('[data-testid="no-orders-message"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account');
    await this.page.waitForLoadState('networkidle');
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.page.waitForURL('/');
  }

  async getOrders(): Promise<Locator> {
    return this.orderHistory.locator('[data-testid="order-item"]');
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.welcomeMessage).toBeVisible();
  }

  async expectHasOrders(): Promise<void> {
    const orders = await this.getOrders();
    await expect(orders.first()).toBeVisible();
  }

  async expectNoOrders(): Promise<void> {
    await expect(this.noOrdersMessage).toBeVisible();
  }
}

export class ProfileEditPage {
  readonly page: Page;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.firstNameInput = page.locator('[data-testid="profile-firstname"]');
    this.lastNameInput = page.locator('[data-testid="profile-lastname"]');
    this.emailInput = page.locator('[data-testid="profile-email"]');
    this.phoneInput = page.locator('[data-testid="profile-phone"]');
    this.saveButton = page.locator('[data-testid="profile-save"]');
    this.cancelButton = page.locator('[data-testid="profile-cancel"]');
    this.successMessage = page.locator('[data-testid="profile-success"]');
    this.errorMessage = page.locator('[data-testid="profile-error"]');
  }

  async updateFirstName(name: string): Promise<void> {
    await this.firstNameInput.fill(name);
  }

  async updateLastName(name: string): Promise<void> {
    await this.lastNameInput.fill(name);
  }

  async updatePhone(phone: string): Promise<void> {
    await this.phoneInput.fill(phone);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectSaveSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible();
  }

  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}

export class PasswordRecoveryPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationMessage: Locator;
  readonly errorMessage: Locator;
  readonly backToLoginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('[data-testid="recover-email"]');
    this.submitButton = page.locator('[data-testid="recover-submit"]');
    this.confirmationMessage = page.locator('[data-testid="recover-confirmation"]');
    this.errorMessage = page.locator('[data-testid="recover-error"]');
    this.backToLoginLink = page.locator('[data-testid="back-to-login"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/account/recover');
    await this.page.waitForLoadState('networkidle');
  }

  async requestReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectConfirmation(): Promise<void> {
    await expect(this.confirmationMessage).toBeVisible({ timeout: 10_000 });
  }

  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }
}
