import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Checkout pages.
 */
export class CheckoutPage {
  readonly page: Page;

  // Contact Information
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  // Shipping Address
  readonly shippingFirstName: Locator;
  readonly shippingLastName: Locator;
  readonly shippingAddress1: Locator;
  readonly shippingAddress2: Locator;
  readonly shippingCity: Locator;
  readonly shippingCountry: Locator;
  readonly shippingState: Locator;
  readonly shippingZip: Locator;
  readonly shippingPhone: Locator;

  // Shipping Methods
  readonly shippingMethods: Locator;
  readonly selectedShippingMethod: Locator;

  // Payment
  readonly cardNumber: Locator;
  readonly cardExpiry: Locator;
  readonly cardCvv: Locator;
  readonly cardName: Locator;
  readonly paymentIframe: Locator;

  // Discount
  readonly discountInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly discountApplied: Locator;
  readonly discountError: Locator;

  // Order Summary
  readonly orderSummary: Locator;
  readonly subtotal: Locator;
  readonly shippingCost: Locator;
  readonly tax: Locator;
  readonly total: Locator;

  // Navigation
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly placeOrderButton: Locator;

  // Errors
  readonly errorMessage: Locator;
  readonly fieldErrors: Locator;

  constructor(page: Page) {
    this.page = page;

    // Contact Information
    this.emailInput = page.locator('[data-testid="checkout-email"]');
    this.phoneInput = page.locator('[data-testid="checkout-phone"]');

    // Shipping Address
    this.shippingFirstName = page.locator('[data-testid="shipping-firstname"]');
    this.shippingLastName = page.locator('[data-testid="shipping-lastname"]');
    this.shippingAddress1 = page.locator('[data-testid="shipping-address1"]');
    this.shippingAddress2 = page.locator('[data-testid="shipping-address2"]');
    this.shippingCity = page.locator('[data-testid="shipping-city"]');
    this.shippingCountry = page.locator('[data-testid="shipping-country"]');
    this.shippingState = page.locator('[data-testid="shipping-state"]');
    this.shippingZip = page.locator('[data-testid="shipping-zip"]');
    this.shippingPhone = page.locator('[data-testid="shipping-phone"]');

    // Shipping Methods
    this.shippingMethods = page.locator('[data-testid="shipping-method"]');
    this.selectedShippingMethod = page.locator('[data-testid="shipping-method"][aria-checked="true"]');

    // Payment
    this.cardNumber = page.locator('[data-testid="card-number"]');
    this.cardExpiry = page.locator('[data-testid="card-expiry"]');
    this.cardCvv = page.locator('[data-testid="card-cvv"]');
    this.cardName = page.locator('[data-testid="card-name"]');
    this.paymentIframe = page.locator('[data-testid="payment-iframe"]');

    // Discount
    this.discountInput = page.locator('[data-testid="checkout-discount-input"]');
    this.applyDiscountButton = page.locator('[data-testid="checkout-apply-discount"]');
    this.discountApplied = page.locator('[data-testid="checkout-discount-applied"]');
    this.discountError = page.locator('[data-testid="checkout-discount-error"]');

    // Order Summary
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.subtotal = page.locator('[data-testid="checkout-subtotal"]');
    this.shippingCost = page.locator('[data-testid="checkout-shipping-cost"]');
    this.tax = page.locator('[data-testid="checkout-tax"]');
    this.total = page.locator('[data-testid="checkout-total"]');

    // Navigation
    this.continueButton = page.locator('[data-testid="checkout-continue"]');
    this.backButton = page.locator('[data-testid="checkout-back"]');
    this.placeOrderButton = page.locator('[data-testid="place-order-button"]');

    // Errors
    this.errorMessage = page.locator('[data-testid="checkout-error"]');
    this.fieldErrors = page.locator('[data-testid="field-error"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  async fillContactInfo(email: string, phone?: string): Promise<void> {
    await this.emailInput.fill(email);
    if (phone) {
      await this.phoneInput.fill(phone);
    }
  }

  async fillShippingAddress(address: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    countryCode: string;
    stateCode?: string;
    zip: string;
    phone?: string;
  }): Promise<void> {
    await this.shippingFirstName.fill(address.firstName);
    await this.shippingLastName.fill(address.lastName);
    await this.shippingAddress1.fill(address.address1);

    if (address.address2) {
      await this.shippingAddress2.fill(address.address2);
    }

    await this.shippingCity.fill(address.city);
    await this.shippingCountry.selectOption({ value: address.countryCode });

    if (address.stateCode) {
      await this.shippingState.selectOption({ value: address.stateCode });
    }

    await this.shippingZip.fill(address.zip);

    if (address.phone) {
      await this.shippingPhone.fill(address.phone);
    }
  }

  async selectShippingMethod(index: number = 0): Promise<void> {
    await expect(this.shippingMethods.first()).toBeVisible({ timeout: 10_000 });
    await this.shippingMethods.nth(index).click();
  }

  async fillPayment(payment: {
    number: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    name: string;
  }): Promise<void> {
    // Check if payment is in iframe
    const iframe = this.page.frameLocator('[data-testid="payment-iframe"]');

    try {
      const cardInFrame = iframe.locator('[data-testid="card-number"]');
      if (await cardInFrame.isVisible({ timeout: 2000 })) {
        await cardInFrame.fill(payment.number);
        await iframe.locator('[data-testid="card-expiry"]').fill(
          `${payment.expMonth}/${payment.expYear.slice(-2)}`
        );
        await iframe.locator('[data-testid="card-cvv"]').fill(payment.cvv);
        await iframe.locator('[data-testid="card-name"]').fill(payment.name);
        return;
      }
    } catch {
      // Not in iframe, use direct selectors
    }

    await this.cardNumber.fill(payment.number);
    await this.cardExpiry.fill(`${payment.expMonth}/${payment.expYear.slice(-2)}`);
    await this.cardCvv.fill(payment.cvv);
    await this.cardName.fill(payment.name);
  }

  async applyDiscount(code: string): Promise<boolean> {
    await this.discountInput.fill(code);
    await this.applyDiscountButton.click();
    await this.page.waitForLoadState('networkidle');
    return await this.discountApplied.isVisible();
  }

  async continue(): Promise<void> {
    await expect(this.continueButton).toBeEnabled();
    await this.continueButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async back(): Promise<void> {
    await this.backButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async placeOrder(): Promise<void> {
    await expect(this.placeOrderButton).toBeEnabled({ timeout: 10_000 });
    await this.placeOrderButton.click();
  }

  async getTotal(): Promise<number> {
    const text = await this.total.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async getSubtotal(): Promise<number> {
    const text = await this.subtotal.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async expectOnStep(step: 'information' | 'shipping' | 'payment'): Promise<void> {
    const stepIndicator = this.page.locator(`[data-testid="checkout-step-${step}"][aria-current="step"]`);
    await expect(stepIndicator).toBeVisible();
  }

  async expectError(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async expectFieldError(fieldName: string): Promise<void> {
    const fieldError = this.page.locator(`[data-testid="field-error-${fieldName}"]`);
    await expect(fieldError).toBeVisible();
  }
}

export class OrderConfirmationPage {
  readonly page: Page;
  readonly confirmationContainer: Locator;
  readonly orderNumber: Locator;
  readonly confirmationEmail: Locator;
  readonly orderItems: Locator;
  readonly shippingAddress: Locator;
  readonly billingAddress: Locator;
  readonly paymentMethod: Locator;
  readonly orderTotal: Locator;
  readonly continueShoppingButton: Locator;
  readonly viewOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.confirmationContainer = page.locator('[data-testid="order-confirmation"]');
    this.orderNumber = page.locator('[data-testid="order-number"]');
    this.confirmationEmail = page.locator('[data-testid="confirmation-email"]');
    this.orderItems = page.locator('[data-testid="order-item"]');
    this.shippingAddress = page.locator('[data-testid="confirmation-shipping-address"]');
    this.billingAddress = page.locator('[data-testid="confirmation-billing-address"]');
    this.paymentMethod = page.locator('[data-testid="confirmation-payment-method"]');
    this.orderTotal = page.locator('[data-testid="confirmation-total"]');
    this.continueShoppingButton = page.locator('[data-testid="continue-shopping"]');
    this.viewOrderButton = page.locator('[data-testid="view-order"]');
  }

  async expectConfirmation(): Promise<void> {
    await expect(this.confirmationContainer).toBeVisible({ timeout: 30_000 });
  }

  async getOrderNumber(): Promise<string> {
    return (await this.orderNumber.textContent()) || '';
  }

  async expectOrderNumber(): Promise<void> {
    await expect(this.orderNumber).toBeVisible();
    const orderNum = await this.getOrderNumber();
    expect(orderNum.length).toBeGreaterThan(0);
  }

  async expectEmail(email: string): Promise<void> {
    await expect(this.confirmationEmail).toContainText(email);
  }

  async expectProductInOrder(productTitle: string): Promise<void> {
    const item = this.page.locator(`[data-testid="order-item"]:has-text("${productTitle}")`);
    await expect(item).toBeVisible();
  }

  async getOrderTotal(): Promise<number> {
    const text = await this.orderTotal.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }
}
