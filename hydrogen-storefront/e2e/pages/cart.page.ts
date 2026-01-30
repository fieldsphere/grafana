import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the Cart page.
 * Provides a clean interface for cart interactions in tests.
 */
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly emptyCartMessage: Locator;
  readonly cartSubtotal: Locator;
  readonly cartTotal: Locator;
  readonly cartCount: Locator;
  readonly checkoutButton: Locator;
  readonly discountInput: Locator;
  readonly applyDiscountButton: Locator;
  readonly discountApplied: Locator;
  readonly discountError: Locator;
  readonly continueShoppingLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart-message"]');
    this.cartSubtotal = page.locator('[data-testid="cart-subtotal"]');
    this.cartTotal = page.locator('[data-testid="cart-total"]');
    this.cartCount = page.locator('[data-testid="cart-count"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.discountInput = page.locator('[data-testid="discount-code-input"]');
    this.applyDiscountButton = page.locator('[data-testid="apply-discount-button"]');
    this.discountApplied = page.locator('[data-testid="discount-applied"]');
    this.discountError = page.locator('[data-testid="discount-error"]');
    this.continueShoppingLink = page.locator('[data-testid="continue-shopping"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart');
    await this.page.waitForLoadState('networkidle');
  }

  async isEmpty(): Promise<boolean> {
    return await this.emptyCartMessage.isVisible();
  }

  async getItemCount(): Promise<number> {
    if (await this.isEmpty()) {
      return 0;
    }
    return await this.cartItems.count();
  }

  async getSubtotal(): Promise<number> {
    const text = await this.cartSubtotal.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async getTotal(): Promise<number> {
    const text = await this.cartTotal.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  getItem(variantId: string): CartItemComponent {
    return new CartItemComponent(
      this.page,
      this.page.locator(`[data-testid="cart-item"][data-variant-id="${variantId}"]`)
    );
  }

  async getItemByIndex(index: number): Promise<CartItemComponent> {
    return new CartItemComponent(this.page, this.cartItems.nth(index));
  }

  async removeAllItems(): Promise<void> {
    while (!(await this.isEmpty())) {
      const removeButton = this.cartItems.first().locator('[data-testid="cart-item-remove"]');
      await removeButton.click();
      await this.page.waitForResponse(
        (response) => response.url().includes('/cart') && response.status() === 200
      );
      await this.page.waitForTimeout(300);
    }
  }

  async applyDiscount(code: string): Promise<boolean> {
    await this.discountInput.fill(code);
    await this.applyDiscountButton.click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
    return await this.discountApplied.isVisible();
  }

  async proceedToCheckout(): Promise<void> {
    await expect(this.checkoutButton).toBeEnabled();
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/checkout/);
  }

  async expectEmpty(): Promise<void> {
    await expect(this.emptyCartMessage).toBeVisible();
  }

  async expectNotEmpty(): Promise<void> {
    await expect(this.cartItems.first()).toBeVisible();
  }

  async expectItemCount(count: number): Promise<void> {
    if (count === 0) {
      await this.expectEmpty();
    } else {
      await expect(this.cartItems).toHaveCount(count);
    }
  }
}

/**
 * Component for interacting with individual cart items.
 */
export class CartItemComponent {
  readonly page: Page;
  readonly container: Locator;
  readonly title: Locator;
  readonly price: Locator;
  readonly quantity: Locator;
  readonly quantityInput: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly removeButton: Locator;
  readonly variantInfo: Locator;

  constructor(page: Page, container: Locator) {
    this.page = page;
    this.container = container;
    this.title = container.locator('[data-testid="cart-item-title"]');
    this.price = container.locator('[data-testid="cart-item-price"]');
    this.quantity = container.locator('[data-testid="cart-item-quantity"]');
    this.quantityInput = container.locator('[data-testid="quantity-input"]');
    this.incrementButton = container.locator('[data-testid="quantity-increment"]');
    this.decrementButton = container.locator('[data-testid="quantity-decrement"]');
    this.removeButton = container.locator('[data-testid="cart-item-remove"]');
    this.variantInfo = container.locator('[data-testid="cart-item-variant"]');
  }

  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  async getPrice(): Promise<number> {
    const text = await this.price.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async getQuantity(): Promise<number> {
    const text = await this.quantity.textContent();
    return parseInt(text || '0', 10);
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(quantity.toString());
    await this.quantityInput.press('Enter');
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
  }

  async increment(): Promise<void> {
    await this.incrementButton.click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
  }

  async decrement(): Promise<void> {
    await this.decrementButton.click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
  }

  async remove(): Promise<void> {
    await this.removeButton.click();
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
  }

  async expectQuantity(quantity: number): Promise<void> {
    await expect(this.quantity).toHaveText(quantity.toString());
  }
}
