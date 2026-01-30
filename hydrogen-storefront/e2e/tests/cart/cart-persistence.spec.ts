import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { ProductPage } from '../../pages/product.page';
import { TestProducts } from '../../fixtures/test-data';
import { clearCart, addToCart, getCartState } from '../../utils/cart-helpers';

test.describe('Cart Persistence', () => {
  let cartPage: CartPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    productPage = new ProductPage(page);
    await clearCart(page);
  });

  test('should persist cart across page navigation', async ({ page }) => {
    // Add item to cart
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 2);

    // Navigate to different pages
    await page.goto('/');
    await page.goto('/collections/all');
    await page.goto('/about');

    // Check cart still has item
    await cartPage.goto();
    await cartPage.expectNotEmpty();
    await cartPage.expectItemCount(1);

    const item = await cartPage.getItemByIndex(0);
    await item.expectQuantity(2);
  });

  test('should persist cart after page refresh', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 3);

    await cartPage.goto();
    const initialState = await getCartState(page);

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify cart state is the same
    const afterRefreshState = await getCartState(page);
    expect(afterRefreshState.totalQuantity).toBe(initialState.totalQuantity);
    expect(afterRefreshState.items.length).toBe(initialState.items.length);
  });

  test('should persist cart in new browser tab', async ({ page, context }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    // Open cart in a new tab
    const newTab = await context.newPage();
    const newTabCartPage = new CartPage(newTab);

    await newTabCartPage.goto();
    await newTabCartPage.expectNotEmpty();
    await newTabCartPage.expectItemCount(1);

    await newTab.close();
  });

  test('should persist complex cart state with multiple items', async ({ page }) => {
    // Add multiple items with different quantities
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 2);
    await addToCart(
      page,
      TestProducts.MULTI_VARIANT_HOODIE.handle,
      TestProducts.MULTI_VARIANT_HOODIE.variants[0].id,
      1
    );
    await addToCart(page, TestProducts.LIMITED_STOCK_ITEM.handle, TestProducts.LIMITED_STOCK_ITEM.variantId, 1);

    const initialState = await getCartState(page);

    // Close and reopen browser (simulated by clearing page and navigating back)
    await page.goto('about:blank');
    await page.waitForTimeout(500);

    // Navigate back to cart
    await cartPage.goto();

    // Verify state persisted
    const afterState = await getCartState(page);
    expect(afterState.items.length).toBe(initialState.items.length);
    expect(afterState.totalQuantity).toBe(initialState.totalQuantity);
  });

  test('should clear cart when clearCart is called', async ({ page }) => {
    // Add items
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    // Clear cart
    await clearCart(page);

    // Verify cart is empty
    await cartPage.goto();
    await cartPage.expectEmpty();
  });

  test('should not lose cart when navigating using browser back button', async ({ page }) => {
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCart();

    // Navigate to cart
    await cartPage.goto();
    await cartPage.expectNotEmpty();

    // Navigate to homepage
    await page.goto('/');

    // Go back to cart
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // Cart should still have the item
    await cartPage.expectNotEmpty();
  });

  test('should maintain cart during checkout abandonment', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 2);

    // Start checkout
    await cartPage.goto();
    await cartPage.proceedToCheckout();

    // Abandon checkout by navigating away
    await page.goto('/');

    // Cart should still have items
    await cartPage.goto();
    await cartPage.expectNotEmpty();
    const item = await cartPage.getItemByIndex(0);
    await item.expectQuantity(2);
  });

  test('should show correct cart count across all pages', async ({ page }) => {
    const cartCount = page.locator('[data-testid="cart-count"]');

    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId, 3);

    // Check cart count on various pages
    const pagesToCheck = ['/', '/collections/all', '/products/' + TestProducts.MULTI_VARIANT_HOODIE.handle];

    for (const pagePath of pagesToCheck) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      await expect(cartCount).toHaveText('3');
    }
  });
});
