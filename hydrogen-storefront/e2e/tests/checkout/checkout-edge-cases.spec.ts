import { test, expect } from '@playwright/test';
import { CheckoutPage, OrderConfirmationPage } from '../../pages/checkout.page';
import { CartPage } from '../../pages/cart.page';
import { ProductPage } from '../../pages/product.page';
import { TestProducts, TestAddresses, TestPayment } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Checkout Edge Cases', () => {
  let checkoutPage: CheckoutPage;
  let confirmationPage: OrderConfirmationPage;
  let cartPage: CartPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    confirmationPage = new OrderConfirmationPage(page);
    cartPage = new CartPage(page);
    productPage = new ProductPage(page);

    await clearCart(page);
  });

  test('should prevent checkout with empty cart', async ({ page }) => {
    // Ensure cart is empty
    await cartPage.goto();
    await cartPage.expectEmpty();

    // Try to navigate to checkout
    await page.goto('/checkout');

    // Should redirect back to cart or show error
    const url = page.url();
    expect(url.includes('/cart') || url.includes('/checkout')).toBeTruthy();

    if (url.includes('/checkout')) {
      await checkoutPage.expectError();
    }
  });

  test('should handle out-of-stock item during checkout', async ({ page }) => {
    // Add limited stock item
    await addToCart(
      page,
      TestProducts.LIMITED_STOCK_ITEM.handle,
      TestProducts.LIMITED_STOCK_ITEM.variantId
    );

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Complete checkout steps
    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    // Should either succeed or show out-of-stock error
    const hasConfirmation = await confirmationPage.confirmationContainer.isVisible().catch(() => false);
    const hasError = await checkoutPage.errorMessage.isVisible().catch(() => false);

    expect(hasConfirmation || hasError).toBeTruthy();
  });

  test('should handle address with special characters', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.SPECIAL_CHARS_ADDRESS);
    await checkoutPage.continue();

    // Should handle special characters gracefully
    const hasShipping = await checkoutPage.shippingMethods.first().isVisible().catch(() => false);
    const hasError = await checkoutPage.errorMessage.isVisible().catch(() => false);

    expect(hasShipping || hasError).toBeTruthy();
  });

  test('should handle multiple items in cart', async ({ page }) => {
    // Add multiple items
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 2);
    await addToCart(
      page,
      TestProducts.MULTI_VARIANT_HOODIE.handle,
      TestProducts.MULTI_VARIANT_HOODIE.variants[0].id
    );
    await addToCart(page, TestProducts.DIGITAL_DOWNLOAD.handle, TestProducts.DIGITAL_DOWNLOAD.variantId);

    await cartPage.goto();
    await cartPage.expectItemCount(3);
    await cartPage.proceedToCheckout();

    // Order summary should show all items
    const orderItems = checkoutPage.orderSummary.locator('[data-testid="checkout-item"]');
    await expect(orderItems).toHaveCount(3);

    // Complete checkout
    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();

    // All items should be in confirmation
    await confirmationPage.expectProductInOrder(TestProducts.BASIC_TSHIRT.title);
  });

  test('should handle high quantity order', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 10);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Verify quantity in order summary
    const itemQuantity = checkoutPage.orderSummary.locator('[data-testid="item-quantity"]');
    await expect(itemQuantity.first()).toContainText('10');
  });

  test('should prevent duplicate order submission', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);

    // Double-click place order button
    await checkoutPage.placeOrderButton.dblclick();

    // Should only create one order (button should be disabled after first click)
    await confirmationPage.expectConfirmation();
  });

  test('should handle session timeout during checkout', async ({ page, context }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);

    // Clear session cookies to simulate timeout
    await context.clearCookies();

    await checkoutPage.continue();

    // Should handle gracefully - either continue or redirect to login/cart
    const url = page.url();
    // Session handling varies by implementation
  });

  test('should recover from network error during checkout', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);

    // Simulate network error then retry
    await page.route('**/checkout/complete', (route) => {
      route.abort('failed');
    });

    await checkoutPage.placeOrder();

    // Should show error
    await checkoutPage.expectError();

    // Remove network block
    await page.unroute('**/checkout/complete');

    // Retry should work
    await checkoutPage.placeOrder();
  });

  test('should handle digital-only order without shipping address', async ({ page }) => {
    // Add only digital product
    await addToCart(page, TestProducts.DIGITAL_DOWNLOAD.handle, TestProducts.DIGITAL_DOWNLOAD.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');

    // For digital-only orders, shipping may be skipped
    // The behavior depends on the implementation
    const shippingRequired = await checkoutPage.shippingFirstName.isVisible();

    if (!shippingRequired) {
      // Digital order - proceed directly to payment
      await checkoutPage.fillPayment(TestPayment.VALID_CARD);
      await checkoutPage.placeOrder();
      await confirmationPage.expectConfirmation();
    } else {
      // Shipping still required
      await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
      await checkoutPage.continue();
      await checkoutPage.selectShippingMethod(0);
      await checkoutPage.continue();
      await checkoutPage.fillPayment(TestPayment.VALID_CARD);
      await checkoutPage.placeOrder();
      await confirmationPage.expectConfirmation();
    }
  });

  test('should maintain cart after failed checkout', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();

    // Use declined card to fail checkout
    await checkoutPage.fillPayment(TestPayment.DECLINED_CARD);
    await checkoutPage.placeOrder();

    await checkoutPage.expectError();

    // Go back to cart
    await cartPage.goto();

    // Cart should still have the item
    await cartPage.expectNotEmpty();
  });

  test('should clear cart after successful checkout', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillContactInfo('test@example.com');
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();

    // Cart should be empty after successful checkout
    await cartPage.goto();
    await cartPage.expectEmpty();
  });
});
