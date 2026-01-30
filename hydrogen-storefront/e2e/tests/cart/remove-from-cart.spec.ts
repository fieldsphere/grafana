import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { TestProducts } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Remove from Cart', () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    await clearCart(page);
  });

  test('should remove single item from cart', async ({ page }) => {
    // Add item first
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.expectNotEmpty();

    // Remove the item
    const item = await cartPage.getItemByIndex(0);
    await item.remove();

    // Verify cart is empty
    await cartPage.expectEmpty();
  });

  test('should remove one of multiple items from cart', async ({ page }) => {
    // Add two different items
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    await cartPage.goto();
    await cartPage.expectItemCount(2);

    // Remove first item
    const item = await cartPage.getItemByIndex(0);
    await item.remove();

    // Should still have one item
    await cartPage.expectItemCount(1);
  });

  test('should update subtotal after removing item', async ({ page }) => {
    // Add two items
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    await cartPage.goto();
    const initialSubtotal = await cartPage.getSubtotal();

    // Remove first item
    const firstItem = await cartPage.getItemByIndex(0);
    const firstItemPrice = await firstItem.getPrice();
    await firstItem.remove();

    // Verify subtotal decreased
    const newSubtotal = await cartPage.getSubtotal();
    expect(newSubtotal).toBeLessThan(initialSubtotal);
    expect(newSubtotal).toBeCloseTo(initialSubtotal - firstItemPrice, 2);
  });

  test('should show empty cart message after removing all items', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.removeAllItems();

    await expect(cartPage.emptyCartMessage).toBeVisible();
    await expect(cartPage.checkoutButton).not.toBeVisible();
  });

  test('should update cart count in header after removing item', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    await cartPage.goto();
    const cartCount = page.locator('[data-testid="cart-count"]');
    await expect(cartCount).toHaveText('2');

    // Remove one item
    const item = await cartPage.getItemByIndex(0);
    await item.remove();

    // Cart count should update
    await expect(cartCount).toHaveText('1');
  });

  test('should persist removal after page refresh', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);

    await cartPage.goto();
    await cartPage.expectItemCount(2);

    // Remove an item
    const item = await cartPage.getItemByIndex(0);
    await item.remove();
    await cartPage.expectItemCount(1);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Item should still be removed
    await cartPage.expectItemCount(1);
  });

  test('should show continue shopping link when cart is empty', async ({ page }) => {
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);

    await cartPage.goto();
    await cartPage.removeAllItems();

    await expect(cartPage.continueShoppingLink).toBeVisible();
  });

  test('should handle removing item while another removal is in progress', async ({ page }) => {
    // Add multiple items
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
    await addToCart(page, TestProducts.MULTI_VARIANT_HOODIE.handle, TestProducts.MULTI_VARIANT_HOODIE.variants[0].id);
    await addToCart(page, TestProducts.LIMITED_STOCK_ITEM.handle, TestProducts.LIMITED_STOCK_ITEM.variantId);

    await cartPage.goto();
    await cartPage.expectItemCount(3);

    // Click remove on multiple items quickly
    const removeButtons = page.locator('[data-testid="cart-item-remove"]');
    await removeButtons.nth(0).click();
    await removeButtons.nth(1).click();

    // Wait for updates to complete
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle');

    // At least one item should be removed, cart should be in valid state
    const count = await cartPage.getItemCount();
    expect(count).toBeLessThanOrEqual(2);
  });
});
