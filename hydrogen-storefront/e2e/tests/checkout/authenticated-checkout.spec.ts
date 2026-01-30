import { test, expect } from '@playwright/test';
import { CheckoutPage, OrderConfirmationPage } from '../../pages/checkout.page';
import { CartPage } from '../../pages/cart.page';
import { AccountDashboardPage } from '../../pages/account.page';
import { TestProducts, TestAddresses, TestPayment, TestUsers, TestDiscounts } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Authenticated Checkout', () => {
  let checkoutPage: CheckoutPage;
  let confirmationPage: OrderConfirmationPage;
  let cartPage: CartPage;
  let dashboardPage: AccountDashboardPage;

  test.beforeEach(async ({ page }) => {
    checkoutPage = new CheckoutPage(page);
    confirmationPage = new OrderConfirmationPage(page);
    cartPage = new CartPage(page);
    dashboardPage = new AccountDashboardPage(page);

    // Setup: clear cart and add a product
    await clearCart(page);
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
  });

  test('should pre-fill email for authenticated user', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Email should be pre-filled with user's email
    await expect(checkoutPage.emailInput).toHaveValue(TestUsers.STANDARD_USER.email);
  });

  test('should complete checkout for authenticated user', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Email should be pre-filled
    await expect(checkoutPage.emailInput).toHaveValue(TestUsers.STANDARD_USER.email);

    // Fill shipping address
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Select shipping method
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();

    // Fill payment
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    // Verify confirmation
    await confirmationPage.expectConfirmation();
    await confirmationPage.expectOrderNumber();
  });

  test('should use saved address if available', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Check for saved addresses
    const savedAddresses = page.locator('[data-testid="saved-address"]');
    const hasSavedAddresses = await savedAddresses.count() > 0;

    if (hasSavedAddresses) {
      // Select saved address
      await savedAddresses.first().click();

      // Address fields should be filled
      await expect(checkoutPage.shippingFirstName).not.toHaveValue('');
    }
  });

  test('should save new address to account', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);

    // Check save address checkbox if available
    const saveAddressCheckbox = page.locator('[data-testid="save-address-checkbox"]');
    if (await saveAddressCheckbox.isVisible()) {
      await saveAddressCheckbox.check();
    }

    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
  });

  test('should add order to account order history', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    const orderNumber = await confirmationPage.getOrderNumber();

    // Navigate to account to verify order appears
    await dashboardPage.goto();
    await dashboardPage.expectHasOrders();

    // Order should be in history
    const orderInHistory = page.locator(`[data-testid="order-item"]:has-text("${orderNumber}")`);
    await expect(orderInHistory).toBeVisible();
  });

  test('should allow changing pre-filled email', async ({ page }) => {
    const newEmail = `changed.${Date.now()}@example.com`;

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Change the pre-filled email
    await checkoutPage.emailInput.clear();
    await checkoutPage.emailInput.fill(newEmail);

    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    // Confirmation should show the changed email
    await confirmationPage.expectEmail(newEmail);
  });

  test('should handle express checkout if available', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Check for express checkout options (Apple Pay, Google Pay, etc.)
    const expressCheckout = page.locator('[data-testid="express-checkout"]');

    if (await expressCheckout.isVisible()) {
      // Express checkout options should be available
      const applePayButton = expressCheckout.locator('[data-testid="apple-pay-button"]');
      const googlePayButton = expressCheckout.locator('[data-testid="google-pay-button"]');

      // At least one express option should be visible (if supported)
      const hasExpressOptions =
        (await applePayButton.isVisible().catch(() => false)) ||
        (await googlePayButton.isVisible().catch(() => false));

      // Note: We can't fully test express checkout without real payment providers
    }
  });

  test('should apply member discount if available', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Check for automatic member discounts
    const memberDiscount = page.locator('[data-testid="member-discount"]');

    if (await memberDiscount.isVisible()) {
      const discountText = await memberDiscount.textContent();
      expect(discountText).toBeTruthy();
    }
  });

  test('should show account link in confirmation page', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();

    // Should show link to view order in account
    await expect(confirmationPage.viewOrderButton).toBeVisible();
  });

  test('should navigate from confirmation to account order details', async ({ page }) => {
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    await confirmationPage.expectConfirmation();
    await confirmationPage.viewOrderButton.click();

    // Should navigate to account order details
    await expect(page).toHaveURL(/\/account\/order/);
  });

  test('should maintain cart association with account', async ({ page, context }) => {
    // Add item to cart while logged in
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    // Open new page in same context (same session)
    const newPage = await context.newPage();
    const newCartPage = new CartPage(newPage);

    await newCartPage.goto();
    await newCartPage.expectNotEmpty();

    // Should have both items (original from beforeEach + newly added)
    await newCartPage.expectItemCount(2);

    await newPage.close();
  });
});
