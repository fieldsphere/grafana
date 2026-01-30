import { Page, expect } from '@playwright/test';
import { TestAddresses, TestPayment } from '../fixtures/test-data';

/**
 * Checkout helper utilities for managing checkout flow in E2E tests.
 */

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  stateCode?: string;
  zip: string;
  country: string;
  countryCode: string;
  phone?: string;
}

export interface PaymentInfo {
  number: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  name: string;
}

export type CheckoutStep = 'information' | 'shipping' | 'payment' | 'confirmation';

/**
 * Initiates checkout from the cart page.
 */
export async function initiateCheckout(page: Page): Promise<void> {
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  const checkoutButton = page.locator('[data-testid="checkout-button"]');
  await expect(checkoutButton).toBeEnabled({ timeout: 5_000 });
  await checkoutButton.click();

  // Wait for checkout page to load
  await page.waitForURL(/\/checkout/, { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Fills the contact/information step of checkout.
 */
export async function fillContactInfo(
  page: Page,
  email: string,
  phone?: string
): Promise<void> {
  const emailInput = page.locator('[data-testid="checkout-email"]');
  await emailInput.fill(email);

  if (phone) {
    const phoneInput = page.locator('[data-testid="checkout-phone"]');
    await phoneInput.fill(phone);
  }
}

/**
 * Fills the shipping address step of checkout.
 */
export async function fillShippingAddress(
  page: Page,
  address: ShippingAddress
): Promise<void> {
  await page.locator('[data-testid="shipping-firstname"]').fill(address.firstName);
  await page.locator('[data-testid="shipping-lastname"]').fill(address.lastName);
  await page.locator('[data-testid="shipping-address1"]').fill(address.address1);

  if (address.address2) {
    await page.locator('[data-testid="shipping-address2"]').fill(address.address2);
  }

  await page.locator('[data-testid="shipping-city"]').fill(address.city);

  // Handle country selection
  const countrySelect = page.locator('[data-testid="shipping-country"]');
  await countrySelect.selectOption({ value: address.countryCode });

  // Handle state/province if applicable
  if (address.stateCode) {
    const stateSelect = page.locator('[data-testid="shipping-state"]');
    await stateSelect.selectOption({ value: address.stateCode });
  }

  await page.locator('[data-testid="shipping-zip"]').fill(address.zip);

  if (address.phone) {
    await page.locator('[data-testid="shipping-phone"]').fill(address.phone);
  }
}

/**
 * Selects a shipping method.
 */
export async function selectShippingMethod(
  page: Page,
  methodIndex: number = 0
): Promise<void> {
  // Wait for shipping methods to load
  const shippingMethods = page.locator('[data-testid="shipping-method"]');
  await expect(shippingMethods.first()).toBeVisible({ timeout: 10_000 });

  // Select the specified shipping method
  await shippingMethods.nth(methodIndex).click();
}

/**
 * Fills payment information.
 * Note: This handles test payment scenarios - in real tests,
 * you may need to handle iframes for payment providers.
 */
export async function fillPaymentInfo(
  page: Page,
  payment: PaymentInfo
): Promise<void> {
  // Handle potential iframe for payment
  const paymentFrame = page.frameLocator('[data-testid="payment-iframe"]');
  
  // Try iframe first, fallback to direct selectors
  try {
    const cardNumberInFrame = paymentFrame.locator('[data-testid="card-number"]');
    if (await cardNumberInFrame.isVisible({ timeout: 2000 })) {
      await cardNumberInFrame.fill(payment.number);
      await paymentFrame.locator('[data-testid="card-expiry"]').fill(
        `${payment.expMonth}/${payment.expYear.slice(-2)}`
      );
      await paymentFrame.locator('[data-testid="card-cvv"]').fill(payment.cvv);
      await paymentFrame.locator('[data-testid="card-name"]').fill(payment.name);
      return;
    }
  } catch {
    // Continue to direct selectors
  }

  // Direct selectors (no iframe)
  await page.locator('[data-testid="card-number"]').fill(payment.number);
  await page.locator('[data-testid="card-expiry"]').fill(
    `${payment.expMonth}/${payment.expYear.slice(-2)}`
  );
  await page.locator('[data-testid="card-cvv"]').fill(payment.cvv);
  await page.locator('[data-testid="card-name"]').fill(payment.name);
}

/**
 * Continues to the next checkout step.
 */
export async function continueToNextStep(page: Page): Promise<void> {
  const continueButton = page.locator('[data-testid="checkout-continue"]');
  await expect(continueButton).toBeEnabled();
  await continueButton.click();
  await page.waitForLoadState('networkidle');
}

/**
 * Completes the order by submitting payment.
 */
export async function completeOrder(page: Page): Promise<string> {
  const payButton = page.locator('[data-testid="place-order-button"]');
  await expect(payButton).toBeEnabled({ timeout: 10_000 });
  await payButton.click();

  // Wait for order confirmation
  await page.waitForURL(/\/order\/|\/checkout\/thank-you/, { timeout: 30_000 });

  // Get order number
  const orderNumber = page.locator('[data-testid="order-number"]');
  await expect(orderNumber).toBeVisible({ timeout: 10_000 });

  return await orderNumber.textContent() || '';
}

/**
 * Completes full guest checkout flow.
 */
export async function completeGuestCheckout(
  page: Page,
  email: string,
  address: ShippingAddress = TestAddresses.US_SHIPPING,
  payment: PaymentInfo = TestPayment.VALID_CARD
): Promise<string> {
  // Start checkout
  await initiateCheckout(page);

  // Fill contact info
  await fillContactInfo(page, email, address.phone);

  // Fill shipping address
  await fillShippingAddress(page, address);

  // Continue to shipping methods
  await continueToNextStep(page);

  // Select shipping method
  await selectShippingMethod(page, 0);

  // Continue to payment
  await continueToNextStep(page);

  // Fill payment
  await fillPaymentInfo(page, payment);

  // Complete order
  return await completeOrder(page);
}

/**
 * Verifies order confirmation page details.
 */
export async function verifyOrderConfirmation(
  page: Page,
  expectedDetails: {
    email?: string;
    orderNumber?: string;
    productTitles?: string[];
  }
): Promise<void> {
  // Verify we're on confirmation page
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();

  if (expectedDetails.email) {
    const confirmationEmail = page.locator('[data-testid="confirmation-email"]');
    await expect(confirmationEmail).toContainText(expectedDetails.email);
  }

  if (expectedDetails.orderNumber) {
    const orderNumber = page.locator('[data-testid="order-number"]');
    await expect(orderNumber).toContainText(expectedDetails.orderNumber);
  }

  if (expectedDetails.productTitles) {
    for (const title of expectedDetails.productTitles) {
      const productItem = page.locator(`[data-testid="order-item"]:has-text("${title}")`);
      await expect(productItem).toBeVisible();
    }
  }
}

/**
 * Gets the current checkout step.
 */
export async function getCurrentCheckoutStep(page: Page): Promise<CheckoutStep> {
  const url = page.url();

  if (url.includes('thank-you') || url.includes('/order/')) {
    return 'confirmation';
  }
  if (url.includes('payment')) {
    return 'payment';
  }
  if (url.includes('shipping')) {
    return 'shipping';
  }
  return 'information';
}

/**
 * Applies a discount code during checkout.
 */
export async function applyCheckoutDiscount(page: Page, code: string): Promise<boolean> {
  const discountInput = page.locator('[data-testid="checkout-discount-input"]');
  const applyButton = page.locator('[data-testid="checkout-apply-discount"]');

  await discountInput.fill(code);
  await applyButton.click();

  await page.waitForLoadState('networkidle');

  const discountApplied = page.locator('[data-testid="checkout-discount-applied"]');
  return await discountApplied.isVisible();
}
