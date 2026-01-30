import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { ProductPage } from '../../pages/product.page';
import { TestProducts } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Update Cart', () => {
  let cartPage: CartPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    productPage = new ProductPage(page);
    // Reset cart and add a product for update tests
    await clearCart(page);
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
  });

  test('should update item quantity via input field', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    // Update quantity
    await item.setQuantity(5);

    // Verify update
    await item.expectQuantity(5);
  });

  test('should update item quantity via increment button', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    const initialQty = await item.getQuantity();
    await item.increment();

    await item.expectQuantity(initialQty + 1);
  });

  test('should update item quantity via decrement button', async ({ page }) => {
    // First set quantity to 3 so we can decrement
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    await item.setQuantity(3);
    await item.expectQuantity(3);

    // Decrement
    await item.decrement();
    await item.expectQuantity(2);
  });

  test('should update subtotal when quantity changes', async ({ page }) => {
    await cartPage.goto();
    const initialSubtotal = await cartPage.getSubtotal();

    const item = await cartPage.getItemByIndex(0);
    await item.setQuantity(3);

    const newSubtotal = await cartPage.getSubtotal();
    expect(newSubtotal).toBeCloseTo(initialSubtotal * 3, 2);
  });

  test('should prevent setting quantity to zero via input', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    // Try to set quantity to 0
    await item.setQuantity(0);

    // Either item should be removed or quantity should stay at 1
    const isEmpty = await cartPage.isEmpty();
    if (!isEmpty) {
      const qty = await item.getQuantity();
      expect(qty).toBeGreaterThanOrEqual(1);
    }
  });

  test('should prevent setting negative quantity', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    // Try to set negative quantity
    await item.quantityInput.fill('-5');
    await item.quantityInput.press('Enter');

    // Quantity should be clamped to valid value
    const qty = await item.getQuantity();
    expect(qty).toBeGreaterThanOrEqual(1);
  });

  test('should respect maximum quantity limits', async ({ page }) => {
    // Add limited stock item
    await addToCart(
      page,
      TestProducts.LIMITED_STOCK_ITEM.handle,
      TestProducts.LIMITED_STOCK_ITEM.variantId
    );

    await cartPage.goto();

    // Find the limited stock item
    const item = cartPage.getItem(TestProducts.LIMITED_STOCK_ITEM.variantId);

    // Try to exceed stock
    await item.setQuantity(100);

    // Quantity should be limited
    const qty = await item.getQuantity();
    expect(qty).toBeLessThanOrEqual(TestProducts.LIMITED_STOCK_ITEM.availableStock);
  });

  test('should persist quantity changes after page refresh', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    await item.setQuantity(4);
    await item.expectQuantity(4);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify quantity persisted
    const itemAfterRefresh = await cartPage.getItemByIndex(0);
    await itemAfterRefresh.expectQuantity(4);
  });

  test('should update cart count in header when quantity changes', async ({ page }) => {
    const cartCount = page.locator('[data-testid="cart-count"]');

    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    await item.setQuantity(5);

    // Cart count should reflect new quantity
    await expect(cartCount).toHaveText('5');
  });

  test('should handle rapid quantity updates gracefully', async ({ page }) => {
    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);

    // Rapidly increment
    for (let i = 0; i < 5; i++) {
      await item.incrementButton.click();
    }

    // Wait for all updates to complete
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // Final quantity should be correct
    const finalQty = await item.getQuantity();
    expect(finalQty).toBeGreaterThanOrEqual(1);
  });
});
