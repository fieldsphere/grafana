import { Page, BrowserContext, expect } from '@playwright/test';

/**
 * Cart helper utilities for managing cart state in E2E tests.
 * Provides methods for cart reset, verification, and manipulation.
 */

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  title?: string;
  price?: number;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  totalQuantity: number;
}

/**
 * Clears the cart by removing all items.
 * Uses the storefront API to ensure complete cart reset.
 */
export async function clearCart(page: Page): Promise<void> {
  // Navigate to cart page
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  // Check if cart has items
  const emptyCartMessage = page.locator('[data-testid="empty-cart-message"]');
  const cartItems = page.locator('[data-testid="cart-item"]');

  if (await emptyCartMessage.isVisible()) {
    return; // Cart is already empty
  }

  // Remove all items from cart
  const removeButtons = page.locator('[data-testid="cart-item-remove"]');
  const count = await removeButtons.count();

  for (let i = count - 1; i >= 0; i--) {
    await removeButtons.nth(i).click();
    await page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
    // Wait for UI to update
    await page.waitForTimeout(500);
  }

  // Verify cart is empty
  await expect(emptyCartMessage).toBeVisible({ timeout: 10_000 });
}

/**
 * Clears cart state from browser storage directly.
 * Use this for faster cart reset when API calls are not needed.
 */
export async function clearCartStorage(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  
  // Clear localStorage cart data
  const pages = context.pages();
  for (const page of pages) {
    await page.evaluate(() => {
      localStorage.removeItem('cartId');
      localStorage.removeItem('cart');
      sessionStorage.removeItem('cartId');
      sessionStorage.removeItem('cart');
    });
  }
}

/**
 * Adds a product to the cart via the UI.
 */
export async function addToCart(
  page: Page,
  productHandle: string,
  variantId?: string,
  quantity: number = 1
): Promise<void> {
  // Navigate to product page
  await page.goto(`/products/${productHandle}`);
  await page.waitForLoadState('networkidle');

  // Select variant if specified
  if (variantId) {
    await page.locator(`[data-variant-id="${variantId}"]`).click();
  }

  // Set quantity if more than 1
  if (quantity > 1) {
    const quantityInput = page.locator('[data-testid="quantity-input"]');
    await quantityInput.fill(quantity.toString());
  }

  // Click add to cart
  const addButton = page.locator('[data-testid="add-to-cart-button"]');
  await expect(addButton).toBeEnabled();
  await addButton.click();

  // Wait for cart update
  await page.waitForResponse(
    (response) => response.url().includes('/cart') && response.status() === 200
  );

  // Verify cart count updated
  const cartCount = page.locator('[data-testid="cart-count"]');
  await expect(cartCount).toBeVisible({ timeout: 5_000 });
}

/**
 * Gets the current cart state from the page.
 */
export async function getCartState(page: Page): Promise<CartState> {
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  const items: CartItem[] = [];
  const cartItems = page.locator('[data-testid="cart-item"]');
  const count = await cartItems.count();

  for (let i = 0; i < count; i++) {
    const item = cartItems.nth(i);
    const productId = await item.getAttribute('data-product-id') || '';
    const variantId = await item.getAttribute('data-variant-id') || '';
    const quantityText = await item.locator('[data-testid="cart-item-quantity"]').textContent();
    const quantity = parseInt(quantityText || '0', 10);

    items.push({ productId, variantId, quantity });
  }

  const subtotalText = await page.locator('[data-testid="cart-subtotal"]').textContent();
  const subtotal = parseFloat(subtotalText?.replace(/[^0-9.]/g, '') || '0');

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return { items, subtotal, totalQuantity };
}

/**
 * Waits for cart to be in a specific state.
 */
export async function waitForCartState(
  page: Page,
  expectedState: Partial<CartState>,
  timeout: number = 10_000
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const currentState = await getCartState(page);

    let matches = true;

    if (expectedState.totalQuantity !== undefined) {
      matches = matches && currentState.totalQuantity === expectedState.totalQuantity;
    }

    if (expectedState.items !== undefined) {
      matches = matches && expectedState.items.length === currentState.items.length;
    }

    if (matches) {
      return;
    }

    await page.waitForTimeout(500);
  }

  throw new Error(`Cart did not reach expected state within ${timeout}ms`);
}

/**
 * Updates the quantity of a cart item.
 */
export async function updateCartItemQuantity(
  page: Page,
  variantId: string,
  newQuantity: number
): Promise<void> {
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  const item = page.locator(`[data-testid="cart-item"][data-variant-id="${variantId}"]`);
  await expect(item).toBeVisible();

  const quantityInput = item.locator('[data-testid="quantity-input"]');
  await quantityInput.fill(newQuantity.toString());
  await quantityInput.press('Enter');

  // Wait for cart update
  await page.waitForResponse(
    (response) => response.url().includes('/cart') && response.status() === 200
  );
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItem(page: Page, variantId: string): Promise<void> {
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  const item = page.locator(`[data-testid="cart-item"][data-variant-id="${variantId}"]`);
  await expect(item).toBeVisible();

  const removeButton = item.locator('[data-testid="cart-item-remove"]');
  await removeButton.click();

  // Wait for cart update
  await page.waitForResponse(
    (response) => response.url().includes('/cart') && response.status() === 200
  );

  // Verify item was removed
  await expect(item).not.toBeVisible({ timeout: 5_000 });
}

/**
 * Applies a discount code to the cart.
 */
export async function applyDiscountCode(page: Page, code: string): Promise<boolean> {
  await page.goto('/cart');
  await page.waitForLoadState('networkidle');

  const discountInput = page.locator('[data-testid="discount-code-input"]');
  const applyButton = page.locator('[data-testid="apply-discount-button"]');

  await discountInput.fill(code);
  await applyButton.click();

  // Wait for response
  await page.waitForResponse(
    (response) => response.url().includes('/cart') && response.status() === 200
  );

  // Check if discount was applied successfully
  const discountApplied = page.locator('[data-testid="discount-applied"]');
  const discountError = page.locator('[data-testid="discount-error"]');

  if (await discountApplied.isVisible()) {
    return true;
  }

  return false;
}
