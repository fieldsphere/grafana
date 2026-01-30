import { test, expect } from '@playwright/test';
import { CartPage } from '../pages/cart.page';
import { ProductPage } from '../pages/product.page';
import { CheckoutPage, OrderConfirmationPage } from '../pages/checkout.page';
import { TestProducts, TestAddresses, TestPayment } from '../fixtures/test-data';
import { clearCart, addToCart } from '../utils/cart-helpers';

/**
 * Critical user journey tests that must pass on all viewports.
 * These tests cover the most important e-commerce flows that directly
 * impact conversion rates.
 */

test.describe('Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await clearCart(page);
  });

  test('should complete basic add-to-cart and view cart flow', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    // Navigate to product
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await expect(productPage.title).toBeVisible();

    // Add to cart
    await productPage.addToCart();

    // View cart
    await cartPage.goto();
    await cartPage.expectNotEmpty();

    // Verify product in cart
    const item = await cartPage.getItemByIndex(0);
    const title = await item.getTitle();
    expect(title).toContain(TestProducts.BASIC_TSHIRT.title);
  });

  test('should complete full purchase flow', async ({ page }) => {
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);
    const confirmationPage = new OrderConfirmationPage(page);

    // Add product to cart
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    // Go to cart and checkout
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Fill checkout information
    const email = `critical.test.${Date.now()}@example.com`;
    await checkoutPage.fillContactInfo(email, TestAddresses.US_SHIPPING.phone);
    await checkoutPage.fillShippingAddress(TestAddresses.US_SHIPPING);
    await checkoutPage.continue();

    // Select shipping
    await checkoutPage.selectShippingMethod(0);
    await checkoutPage.continue();

    // Complete payment
    await checkoutPage.fillPayment(TestPayment.VALID_CARD);
    await checkoutPage.placeOrder();

    // Verify order confirmation
    await confirmationPage.expectConfirmation();
    await confirmationPage.expectOrderNumber();
    await confirmationPage.expectEmail(email);
  });

  test('should update cart quantity successfully', async ({ page }) => {
    const cartPage = new CartPage(page);

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    // Update quantity
    await item.setQuantity(3);
    await item.expectQuantity(3);

    // Verify subtotal updated
    const subtotal = await cartPage.getSubtotal();
    expect(subtotal).toBeCloseTo(TestProducts.BASIC_TSHIRT.price * 3, 2);
  });

  test('should remove item from cart successfully', async ({ page }) => {
    const cartPage = new CartPage(page);

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.expectNotEmpty();

    const item = await cartPage.getItemByIndex(0);
    await item.remove();

    await cartPage.expectEmpty();
  });

  test('should navigate product catalog and add variant to cart', async ({ page }) => {
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    // Navigate to product with variants
    await productPage.goto(TestProducts.MULTI_VARIANT_HOODIE.handle);
    await expect(productPage.title).toBeVisible();

    // Select specific variant
    const variant = TestProducts.MULTI_VARIANT_HOODIE.variants[1];
    await productPage.selectVariant(variant.id);

    // Add to cart
    await productPage.addToCart();

    // Verify correct variant in cart
    await cartPage.goto();
    const item = cartPage.getItem(variant.id);
    await expect(item.container).toBeVisible();
    await expect(item.variantInfo).toContainText(variant.size);
  });

  test('should persist cart across navigation', async ({ page }) => {
    const cartPage = new CartPage(page);

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    // Navigate around the site
    await page.goto('/');
    await page.goto('/collections/all');
    await page.goto(`/products/${TestProducts.MULTI_VARIANT_HOODIE.handle}`);

    // Return to cart
    await cartPage.goto();
    await cartPage.expectNotEmpty();
  });

  test('should show accurate cart count in header', async ({ page }) => {
    const cartCount = page.locator('[data-testid="cart-count"]');

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 2);

    await page.goto('/');
    await expect(cartCount).toHaveText('2');

    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    await page.goto('/');
    await expect(cartCount).toHaveText('3');
  });

  test('should handle checkout form validation', async ({ page }) => {
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Try to continue without filling required fields
    await checkoutPage.continue();

    // Should show validation errors
    await expect(checkoutPage.fieldErrors.first()).toBeVisible();
  });

  test('should display product information correctly', async ({ page }) => {
    const productPage = new ProductPage(page);

    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);

    // Verify essential product info is displayed
    await expect(productPage.title).toBeVisible();
    await expect(productPage.price).toBeVisible();
    await expect(productPage.addToCartButton).toBeVisible();

    const displayedTitle = await productPage.getTitle();
    expect(displayedTitle).toContain(TestProducts.BASIC_TSHIRT.title);

    const displayedPrice = await productPage.getPrice();
    expect(displayedPrice).toBe(TestProducts.BASIC_TSHIRT.price);
  });
});
