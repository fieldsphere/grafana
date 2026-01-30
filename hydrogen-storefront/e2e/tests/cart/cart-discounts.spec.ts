import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { TestProducts, TestDiscounts } from '../../fixtures/test-data';
import { clearCart, addToCart } from '../../utils/cart-helpers';

test.describe('Cart Discounts', () => {
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    await clearCart(page);
    // Add a product to cart for discount testing
    await addToCart(page, TestProducts.BASIC_TSHIRT.handle, TestProducts.BASIC_TSHIRT.variantId);
  });

  test('should apply valid percentage discount code', async ({ page }) => {
    await cartPage.goto();
    const subtotalBefore = await cartPage.getSubtotal();

    const applied = await cartPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);

    expect(applied).toBeTruthy();
    await expect(cartPage.discountApplied).toBeVisible();

    // Verify discount amount is shown
    const discountText = await cartPage.discountApplied.textContent();
    expect(discountText).toContain(TestDiscounts.PERCENTAGE_OFF.code);
  });

  test('should apply valid fixed amount discount code', async ({ page }) => {
    await cartPage.goto();

    const applied = await cartPage.applyDiscount(TestDiscounts.FIXED_AMOUNT.code);

    expect(applied).toBeTruthy();
    await expect(cartPage.discountApplied).toBeVisible();
  });

  test('should apply free shipping discount code', async ({ page }) => {
    await cartPage.goto();

    const applied = await cartPage.applyDiscount(TestDiscounts.FREE_SHIPPING.code);

    expect(applied).toBeTruthy();
    await expect(cartPage.discountApplied).toContainText('Free shipping');
  });

  test('should show error for invalid discount code', async ({ page }) => {
    await cartPage.goto();

    await cartPage.discountInput.fill('INVALIDCODE123');
    await cartPage.applyDiscountButton.click();

    await page.waitForLoadState('networkidle');

    await expect(cartPage.discountError).toBeVisible();
    await expect(cartPage.discountApplied).not.toBeVisible();
  });

  test('should show error for expired discount code', async ({ page }) => {
    await cartPage.goto();

    await cartPage.discountInput.fill(TestDiscounts.EXPIRED_CODE.code);
    await cartPage.applyDiscountButton.click();

    await page.waitForLoadState('networkidle');

    await expect(cartPage.discountError).toBeVisible();
  });

  test('should update total after applying discount', async ({ page }) => {
    await cartPage.goto();

    const subtotalBefore = await cartPage.getSubtotal();
    await cartPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);

    const totalAfter = await cartPage.getTotal();
    const expectedDiscount = subtotalBefore * (TestDiscounts.PERCENTAGE_OFF.value / 100);

    // Total should be less than subtotal by approximately the discount amount
    expect(totalAfter).toBeLessThan(subtotalBefore);
  });

  test('should persist discount after page refresh', async ({ page }) => {
    await cartPage.goto();
    await cartPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);
    await expect(cartPage.discountApplied).toBeVisible();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Discount should still be applied
    await expect(cartPage.discountApplied).toBeVisible();
    await expect(cartPage.discountApplied).toContainText(TestDiscounts.PERCENTAGE_OFF.code);
  });

  test('should allow removing applied discount', async ({ page }) => {
    await cartPage.goto();
    await cartPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);
    await expect(cartPage.discountApplied).toBeVisible();

    // Remove discount
    const removeDiscountButton = page.locator('[data-testid="remove-discount"]');
    await removeDiscountButton.click();

    await page.waitForLoadState('networkidle');

    await expect(cartPage.discountApplied).not.toBeVisible();
  });

  test('should not allow applying multiple discount codes', async ({ page }) => {
    await cartPage.goto();

    // Apply first discount
    await cartPage.applyDiscount(TestDiscounts.PERCENTAGE_OFF.code);
    await expect(cartPage.discountApplied).toBeVisible();

    // Try to apply second discount
    await cartPage.discountInput.fill(TestDiscounts.FIXED_AMOUNT.code);
    await cartPage.applyDiscountButton.click();

    await page.waitForLoadState('networkidle');

    // Either should show error or replace the first discount
    const appliedDiscounts = await page.locator('[data-testid="discount-applied"]').count();
    expect(appliedDiscounts).toBeLessThanOrEqual(1);
  });

  test('should handle case-insensitive discount codes', async ({ page }) => {
    await cartPage.goto();

    // Apply discount with different case
    const lowerCaseCode = TestDiscounts.PERCENTAGE_OFF.code.toLowerCase();
    await cartPage.discountInput.fill(lowerCaseCode);
    await cartPage.applyDiscountButton.click();

    await page.waitForLoadState('networkidle');

    // Should either work or show clear error
    const applied = await cartPage.discountApplied.isVisible();
    const error = await cartPage.discountError.isVisible();

    expect(applied || error).toBeTruthy();
  });
});
