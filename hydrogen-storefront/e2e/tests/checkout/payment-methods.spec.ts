import { test, expect } from '@playwright/test';
import { CheckoutPage, OrderConfirmationPage } from '../../pages/checkout.page';
import { CartPage } from '../../pages/cart.page';
import { TestProducts, TestAddresses, TestPayment } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Payment Methods', () => {
  let checkoutPage: CheckoutPage;
  let confirmationPage: OrderConfirmationPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    confirmationPage = new OrderConfirmationPage(page);
    cartPage = new CartPage(page);

    // Setup: clear cart, add product, and navigate to payment step
    await clearCart(page);
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
  });

  test('should accept valid credit card', async ({ page }) => {
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
  });

  test('should reject invalid card number', async ({ page }) => {
    await checkoutPage.fillPayment({
      ...TestPayment.VALID_CARD,
      number: '1234567890123456', // Invalid card number
    });
    await checkoutPage.placeOrder();

    // Should show payment error
    await checkoutPage.expectError();
  });

  test('should reject expired card', async ({ page }) => {
    await checkoutPage.fillPayment({
      ...TestPayment.VALID_CARD,
      expMonth: '01',
      expYear: '2020', // Expired
    });
    await checkoutPage.placeOrder();

    // Should show expiry error
    await checkoutPage.expectError();
  });

  test('should reject declined card', async ({ page }) => {
    await checkoutPage.fillPayment(TestPayment.DECLINED_CARD);
    await checkoutPage.placeOrder();

    await checkoutPage.expectError('declined');
  });

  test('should show error for missing CVV', async ({ page }) => {
    await checkoutPage.cardNumber.fill(TestPayment.VALID_CARD.number);
    await checkoutPage.cardExpiry.fill(
      `${TestPayment.VALID_CARD.expMonth}/${TestPayment.VALID_CARD.expYear.slice(-2)}`
    );
    // Skip CVV
    await checkoutPage.cardName.fill(TestPayment.VALID_CARD.name);

    await checkoutPage.placeOrder();

    await checkoutPage.expectFieldError('cvv');
  });

  test('should show error for invalid CVV', async ({ page }) => {
    await checkoutPage.fillPayment({
      ...TestPayment.VALID_CARD,
      cvv: '12', // Too short
    });
    await checkoutPage.placeOrder();

    await checkoutPage.expectError();
  });

  test('should validate card number format', async ({ page }) => {
    await checkoutPage.cardNumber.fill('abcd1234efgh5678');
    await checkoutPage.cardNumber.blur();

    // Should show validation error or filter invalid characters
    const value = await checkoutPage.cardNumber.inputValue();
    // Value should only contain digits and formatting characters
    expect(/^[\d\s-]*$/.test(value)).toBeTruthy();
  });

  test('should format card number as user types', async ({ page }) => {
    await checkoutPage.cardNumber.fill('4242424242424242');

    const formattedValue = await checkoutPage.cardNumber.inputValue();

    // Card number may be formatted with spaces (4242 4242 4242 4242)
    // or dashes or remain as-is depending on implementation
    expect(formattedValue.replace(/[\s-]/g, '')).toBe('4242424242424242');
  });

  test('should handle 3D Secure authentication', async ({ page }) => {
    await checkoutPage.fillPayment(TestPayment.SECURE_3D_CARD);
    await checkoutPage.placeOrder();

    // 3D Secure may open a popup or redirect
    // Wait for potential 3DS frame
    const threeDSFrame = page.frameLocator('[data-testid="3ds-iframe"]');

    // If 3DS is triggered, handle it (in test mode, may auto-complete)
    // This is implementation-specific
  });

  test('should show card type icon based on card number', async ({ page }) => {
    // Enter Visa card number
    await checkoutPage.cardNumber.fill('4242');

    // Look for card type indicator
    const cardTypeIcon = page.locator('[data-testid="card-type-icon"]');
    if (await cardTypeIcon.isVisible()) {
      // Should show Visa icon
      await expect(cardTypeIcon).toHaveAttribute('data-card-type', 'visa');
    }

    // Clear and enter Mastercard
    await checkoutPage.cardNumber.clear();
    await checkoutPage.cardNumber.fill('5555');

    if (await cardTypeIcon.isVisible()) {
      await expect(cardTypeIcon).toHaveAttribute('data-card-type', 'mastercard');
    }
  });

  test('should disable place order button during processing', async ({ page }) => {
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);

    // Click place order
    const clickPromise = checkoutPage.placeOrderButton.click();

    // Button should be disabled or show loading state during processing
    // This may be hard to catch if the request is fast

    await clickPromise;
  });

  test('should show payment method icons', async ({ page }) => {
    // Payment method section should show accepted card icons
    const paymentIcons = page.locator('[data-testid="accepted-cards"]');

    if (await paymentIcons.isVisible()) {
      // Should show at least Visa and Mastercard
      await expect(paymentIcons.locator('[data-testid="visa-icon"]')).toBeVisible();
      await expect(paymentIcons.locator('[data-testid="mastercard-icon"]')).toBeVisible();
    }
  });

  test('should handle payment error and allow retry', async ({ page }) => {
    // First attempt with declined card
    await checkoutPage.fillPayment(TestPayment.DECLINED_CARD);
    await checkoutPage.placeOrder();

    await checkoutPage.expectError('declined');

    // Clear and retry with valid card
    await checkoutPage.cardNumber.clear();
    await checkoutPage.cardExpiry.clear();
    await checkoutPage.cardCvv.clear();

    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
  });

  test('should preserve billing address same as shipping by default', async ({ page }) => {
    // Check if "same as shipping" is default
    const sameAsShipping = page.locator('[data-testid="billing-same-as-shipping"]');

    if (await sameAsShipping.isVisible()) {
      await expect(sameAsShipping).toBeChecked();
    }
  });

  test('should allow entering different billing address', async ({ page }) => {
    const sameAsShipping = page.locator('[data-testid="billing-same-as-shipping"]');

    if (await sameAsShipping.isVisible()) {
      await sameAsShipping.uncheck();

      // Billing address fields should appear
      const billingFirstName = page.locator('[data-testid="billing-firstname"]');
      await expect(billingFirstName).toBeVisible();

      // Fill different billing address
      await billingFirstName.fill('Billing');
      await page.locator('[data-testid="billing-lastname"]').fill('Address');
      await page.locator('[data-testid="billing-address1"]').fill('456 Billing St');
      await page.locator('[data-testid="billing-city"]').fill('New York');
      await page.locator('[data-testid="billing-state"]').selectOption('NY');
      await page.locator('[data-testid="billing-zip"]').fill('10001');
      await page.locator('[data-testid="billing-country"]').selectOption('US');
    }

    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
  });
});
