import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Product pages.
 */
export class ProductPage {
  readonly page: Page;
  readonly title: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly images: Locator;
  readonly mainImage: Locator;
  readonly variantSelectors: Locator;
  readonly quantityInput: Locator;
  readonly incrementButton: Locator;
  readonly decrementButton: Locator;
  readonly addToCartButton: Locator;
  readonly buyNowButton: Locator;
  readonly outOfStockMessage: Locator;
  readonly successMessage: Locator;
  readonly cartDrawer: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('[data-testid="product-title"]');
    this.price = page.locator('[data-testid="product-price"]');
    this.description = page.locator('[data-testid="product-description"]');
    this.images = page.locator('[data-testid="product-image"]');
    this.mainImage = page.locator('[data-testid="product-main-image"]');
    this.variantSelectors = page.locator('[data-testid="variant-selector"]');
    this.quantityInput = page.locator('[data-testid="quantity-input"]');
    this.incrementButton = page.locator('[data-testid="quantity-increment"]');
    this.decrementButton = page.locator('[data-testid="quantity-decrement"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart-button"]');
    this.buyNowButton = page.locator('[data-testid="buy-now-button"]');
    this.outOfStockMessage = page.locator('[data-testid="out-of-stock-message"]');
    this.successMessage = page.locator('[data-testid="add-to-cart-success"]');
    this.cartDrawer = page.locator('[data-testid="cart-drawer"]');
  }

  async goto(handle: string): Promise<void> {
    await this.page.goto(`/products/${handle}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getTitle(): Promise<string> {
    return (await this.title.textContent()) || '';
  }

  async getPrice(): Promise<number> {
    const text = await this.price.textContent();
    return parseFloat(text?.replace(/[^0-9.]/g, '') || '0');
  }

  async selectVariant(variantId: string): Promise<void> {
    const variantOption = this.page.locator(`[data-variant-id="${variantId}"]`);
    await variantOption.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectVariantByOption(optionName: string, value: string): Promise<void> {
    const optionSelector = this.page.locator(
      `[data-testid="variant-selector"][data-option="${optionName}"] [data-value="${value}"]`
    );
    await optionSelector.click();
    await this.page.waitForLoadState('networkidle');
  }

  async setQuantity(quantity: number): Promise<void> {
    await this.quantityInput.fill(quantity.toString());
  }

  async incrementQuantity(): Promise<void> {
    await this.incrementButton.click();
  }

  async decrementQuantity(): Promise<void> {
    await this.decrementButton.click();
  }

  async getQuantity(): Promise<number> {
    const value = await this.quantityInput.inputValue();
    return parseInt(value, 10);
  }

  async addToCart(): Promise<void> {
    await expect(this.addToCartButton).toBeEnabled();
    await this.addToCartButton.click();

    // Wait for cart update
    await this.page.waitForResponse(
      (response) => response.url().includes('/cart') && response.status() === 200
    );
  }

  async addToCartWithQuantity(quantity: number): Promise<void> {
    await this.setQuantity(quantity);
    await this.addToCart();
  }

  async buyNow(): Promise<void> {
    await expect(this.buyNowButton).toBeEnabled();
    await this.buyNowButton.click();
    await this.page.waitForURL(/\/checkout/);
  }

  async expectInStock(): Promise<void> {
    await expect(this.addToCartButton).toBeEnabled();
    await expect(this.outOfStockMessage).not.toBeVisible();
  }

  async expectOutOfStock(): Promise<void> {
    await expect(this.addToCartButton).toBeDisabled();
    await expect(this.outOfStockMessage).toBeVisible();
  }

  async expectAddToCartSuccess(): Promise<void> {
    await expect(this.successMessage).toBeVisible({ timeout: 5_000 });
  }

  async expectCartDrawerOpen(): Promise<void> {
    await expect(this.cartDrawer).toBeVisible({ timeout: 5_000 });
  }
}

export class ProductListPage {
  readonly page: Page;
  readonly products: Locator;
  readonly sortSelect: Locator;
  readonly filterContainer: Locator;
  readonly pagination: Locator;
  readonly noResultsMessage: Locator;
  readonly loadingIndicator: Locator;

  constructor(page: Page) {
    this.page = page;
    this.products = page.locator('[data-testid="product-card"]');
    this.sortSelect = page.locator('[data-testid="sort-select"]');
    this.filterContainer = page.locator('[data-testid="filter-container"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    this.noResultsMessage = page.locator('[data-testid="no-results"]');
    this.loadingIndicator = page.locator('[data-testid="loading"]');
  }

  async goto(collection?: string): Promise<void> {
    const url = collection ? `/collections/${collection}` : '/collections/all';
    await this.page.goto(url);
    await this.page.waitForLoadState('networkidle');
  }

  async getProductCount(): Promise<number> {
    return await this.products.count();
  }

  async clickProduct(index: number): Promise<void> {
    await this.products.nth(index).click();
    await this.page.waitForURL(/\/products\//);
  }

  async clickProductByTitle(title: string): Promise<void> {
    const product = this.products.filter({ hasText: title });
    await product.click();
    await this.page.waitForURL(/\/products\//);
  }

  async sortBy(option: string): Promise<void> {
    await this.sortSelect.selectOption({ label: option });
    await this.page.waitForLoadState('networkidle');
  }

  async applyFilter(filterName: string, value: string): Promise<void> {
    const filter = this.page.locator(`[data-testid="filter-${filterName}"]`);
    await filter.locator(`[data-value="${value}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPage(pageNumber: number): Promise<void> {
    await this.pagination.locator(`[data-page="${pageNumber}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectProducts(): Promise<void> {
    await expect(this.products.first()).toBeVisible();
  }

  async expectNoResults(): Promise<void> {
    await expect(this.noResultsMessage).toBeVisible();
  }
}
