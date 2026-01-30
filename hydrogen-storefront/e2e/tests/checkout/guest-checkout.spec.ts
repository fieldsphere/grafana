import { test, expect } from '@playwright/test';
import { CheckoutPage, OrderConfirmationPage } from '../../pages/checkout.page';
import { CartPage } from '../../pages/cart.page';
import { TestProducts, TestAddresses, TestPayment, TestDiscounts } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Guest Checkout', () => {
  let checkoutPage: CheckoutPage;
  let confirmationPage: OrderConfirmationPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    confirmationPage = new OrderConfirmationPage(page);
    cartPage = new CartPage(page);

    // Setup: clear cart and add a product
    await clearCart(page);
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
  });

  test('should complete guest checkout with valid information', async ({ page }) => {
    const guestEmail = `guest.${Date.now()}@example.com`;

    // Go to cart and proceed to checkout
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Fill contact info
    await checkoutPage.fillContactInfo(guestEmail, TestAddresses.US_SHIPPING.phone);

    // Fill shipping address
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);

    // Continue to shipping methods
    await checkoutPage.continue();

    // Select shipping method
    await checkoutPage.selectShippingMethod(0);

    // Continue to payment
    await checkoutPage.continue();

    // Fill payment
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);

    // Place order
    await checkoutPage.placeOrder();

    // Verify confirmation
    await confirmationPage.expectConfirmation();
    await confirmationPage.expectOrderNumber();
    await confirmationPage.expectEmail(guestEmail);
  });

  test('should show validation error for missing email', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Skip email, fill other fields
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Should show email validation error
    await checkoutPage.expectFieldError('email');
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('invalid-email', TestAddresses.US_SHIPPING.phone);
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Should show email validation error
    await checkoutPage.expectFieldError('email');
  });

  test('should show validation error for missing address fields', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');

    // Fill only some address fields
    await checkoutPage.shippingFirstName.fill('Test');
    // Missing other required fields

    await checkoutPage.continue();

    // Should show validation errors
    await expect(checkoutPage.fieldErrors.first()).toBeVisible();
  });

  test('should display shipping methods after address entry', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com', TestAddresses.US_SHIPPING.phone);
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Shipping methods should be visible
    await expect(checkoutPage.shippingMethods.first()).toBeVisible({ timeout: 10_000 });
  });

  test('should update total when shipping method is selected', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    const subtotalBefore = await checkoutPage.getSubtotal();
    await checkoutPage.selectShippingMethod(0);

    // Total should include shipping cost
    const totalAfter = await checkoutPage.getTotal();
    expect(totalAfter).toBeGreaterThanOrEqual(subtotalBefore);
  });

  test('should handle declined card gracefully', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();

    // Use declined card
    await checkoutPage.fillPayment(TestPayment.DECLINED_CARD);
    await checkoutPage.placeOrder();

    // Should show payment error
    await checkoutPage.expectError('declined');
  });

  test('should apply discount code during checkout', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    const subtotalBefore = await checkoutPage.getSubtotal();
    const applied = await checkoutPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);

    expect(applied).toBeTruthy();

    const totalAfter = await checkoutPage.getTotal();
    expect(totalAfter).toBeLessThan(subtotalBefore);
  });

  test('should show error for invalid discount code', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.discountInput.fill('INVALIDCODE');
    await checkoutPage.applyDiscountButton.click();

    await page.waitForLoadState('networkidle');

    await expect(checkoutPage.discountError).toBeVisible();
  });

  test('should navigate back from shipping to information step', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Wait for shipping step
    await expect(checkoutPage.shippingMethods.first()).toBeVisible();

    // Go back
    await checkoutPage.back();

    // Should be back at information step
    await checkoutPage.expectOnStep('information');
  });

  test('should preserve form data when navigating between steps', async ({ page }) => {
    const email = 'test@example.com';

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo(email);
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.back();
    await checkoutPage.back();

    // Email should still be filled
    await expect(checkoutPage.emailInput).toHaveValue(email);
    await expect(checkoutPage.shippingFirstName).toHaveValue(TestAddresses.US_SHIPPING.firstName);
  });

  test('should show order summary with correct items', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Order summary should show the product
    await expect(checkoutPage.orderSummary).toBeVisible();

    const orderItem = checkoutPage.orderSummary.locator('[data-testid="checkout-item"]');
    await expect(orderItem.first()).toContainText(TestProducts.BASIC_TSHIRT.title);
  });

  test('should handle international shipping address', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.INTERNATIONAL_SHIPPING);
    await checkoutPage.continue();

    // Should show international shipping options or error if not supported
    const hasShippingMethods = await checkoutPage.shippingMethods.first().isVisible().catch(() => false);
    const hasError = await checkoutPage.errorMessage.isVisible().catch(() => false);

    expect(hasShippingMethods || hasError).toBeTruthy();
  });

  test('should display correct total on confirmation page', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    await checkoutPage.selectShippingMethod(0);
    const totalAtCheckout = await checkoutPage.getTotal();

    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
    const confirmationTotal = await confirmationPage.getOrderTotal();

    expect(confirmationTotal).toBeCloseTo(totalAtCheckout, 2);
  });
});
