import { test, expect } from '@playwright/test';
import { CartPage } from '../../pages/cart.page';
import { ProductPage } from '../../pages/product.page';
import { TestProducts } from '../../fixtures/test-data';
import { clearCart, getCartState } from '../../utils/cart-helpers';

test.describe('Add to Cart', () => {
  let cartPage: CartPage;
  let productPage: ProductPage;

  test.beforeEach(async ({ page }) => {
    cartPage = new CartPage(page);
    productPage = new ProductPage(page);
    // Reset cart state before each test for isolation
    await clearCart(page);
  });

  test('should add a single product to cart', async ({ page }) => {
    // Navigate to product
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);

    // Verify product page loaded
    await expect(productPage.title).toBeVisible();
    await productPage.expectInStock();

    // Add to cart
    await productPage.addToCart();

    // Verify cart updated
    await cartPage.goto();
    await cartPage.expectNotEmpty();
    await cartPage.expectItemCount(1);

    // Verify correct product was added
    const item = await cartPage.getItemByIndex(0);
    const title = await item.getTitle();
    expect(title).toContain(TestProducts.BASIC_TSHIRT.title);
  });

  test('should add product with specific quantity', async ({ page }) => {
    const quantity = 3;

    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCartWithQuantity(quantity);

    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    await item.expectQuantity(quantity);
  });

  test('should add multiple different products to cart', async ({ page }) => {
    // Add first product
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCart();

    // Add second product
    await productPage.goto(TestProducts.MULTI_VARIANT_HOODIE.handle);
    await productPage.addToCart();

    // Verify cart has both products
    await cartPage.goto();
    await cartPage.expectItemCount(2);
  });

  test('should add same product multiple times and combine quantities', async ({ page }) => {
    // Add product first time
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCart();

    // Add same product again
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCartWithQuantity(2);

    // Cart should have 1 line item with combined quantity
    await cartPage.goto();
    await cartPage.expectItemCount(1);

    const item = await cartPage.getItemByIndex(0);
    await item.expectQuantity(3);
  });

  test('should add product with selected variant', async ({ page }) => {
    const variant = TestProducts.MULTI_VARIANT_HOODIE.variants[1]; // Medium, Black

    await productPage.goto(TestProducts.MULTI_VARIANT_HOODIE.handle);
    await productPage.selectVariant(variant.id);
    await productPage.addToCart();

    await cartPage.goto();
    const item = cartPage.getItem(variant.id);
    await expect(item.container).toBeVisible();
    await expect(item.variantInfo).toContainText(variant.size);
  });

  test('should show success feedback after adding to cart', async ({ page }) => {
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCart();

    // Either success message or cart drawer should appear
    const successVisible = await productPage.successMessage.isVisible();
    const drawerVisible = await productPage.cartDrawer.isVisible();

    expect(successVisible || drawerVisible).toBeTruthy();
  });

  test('should update cart count in header after adding product', async ({ page }) => {
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);

    // Get initial cart count
    const cartCount = page.locator('[data-testid="cart-count"]');
    const initialCount = await cartCount.textContent().catch(() => '0');

    // Add to cart
    await productPage.addToCart();

    // Verify count increased
    await expect(cartCount).toBeVisible();
    const newCount = await cartCount.textContent();
    expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
  });

  test('should handle adding product with quantity near stock limit', async ({ page }) => {
    // Use limited stock item
    await productPage.goto(TestProducts.LIMITED_STOCK_ITEM.handle);

    // Try to add maximum available quantity
    await productPage.setQuantity(TestProducts.LIMITED_STOCK_ITEM.availableStock);
    await productPage.addToCart();

    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    const quantity = await item.getQuantity();
    expect(quantity).toBeLessThanOrEqual(TestProducts.LIMITED_STOCK_ITEM.availableStock);
  });

  test('should display correct price in cart after adding product', async ({ page }) => {
    await productPage.goto(TestProducts.BASIC_TSHIRT.handle);
    await productPage.addToCart();

    await cartPage.goto();
    const item = await cartPage.getItemByIndex(0);
    const price = await item.getPrice();

    // Price should match product price (allowing for formatting)
    expect(price).toBeCloseTo(TestProducts.BASIC_TSHIRT.price, 2);
  });
});
