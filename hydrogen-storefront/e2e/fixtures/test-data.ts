/**
 * Stable test data fixtures for Hydrogen storefront E2E tests.
 * 
 * These fixtures provide consistent, predictable data for testing
 * to ensure reliability and low flake rates.
 */

export const TestProducts = {
  /** A simple product that's always in stock */
  BASIC_TSHIRT: {
    id: 'gid://shopify/Product/1001',
    handle: 'basic-cotton-tshirt',
    title: 'Basic Cotton T-Shirt',
    price: 29.99,
    variantId: 'gid://shopify/ProductVariant/1001-M',
    sku: 'TSHIRT-BLK-M',
  },
  /** A product with multiple variants */
  MULTI_VARIANT_HOODIE: {
    id: 'gid://shopify/Product/1002',
    handle: 'premium-hoodie',
    title: 'Premium Hoodie',
    price: 79.99,
    variants: [
      { id: 'gid://shopify/ProductVariant/1002-S', size: 'S', color: 'Black' },
      { id: 'gid://shopify/ProductVariant/1002-M', size: 'M', color: 'Black' },
      { id: 'gid://shopify/ProductVariant/1002-L', size: 'L', color: 'Navy' },
    ],
  },
  /** A product with limited stock for edge case testing */
  LIMITED_STOCK_ITEM: {
    id: 'gid://shopify/Product/1003',
    handle: 'limited-edition-sneakers',
    title: 'Limited Edition Sneakers',
    price: 149.99,
    variantId: 'gid://shopify/ProductVariant/1003-10',
    availableStock: 3,
  },
  /** A digital product for download testing */
  DIGITAL_DOWNLOAD: {
    id: 'gid://shopify/Product/1004',
    handle: 'ebook-guide',
    title: 'E-Book Style Guide',
    price: 19.99,
    variantId: 'gid://shopify/ProductVariant/1004-1',
    isDigital: true,
  },
} as const;

export const TestUsers = {
  /** Standard test account with valid credentials */
  STANDARD_USER: {
    email: 'test.user@example.com',
    password: 'TestPassword123!',
    firstName: 'Test',
    lastName: 'User',
  },
  /** User for registration tests - email generated dynamically */
  NEW_USER: {
    getEmail: () => `newuser.${Date.now()}@example.com`,
    password: 'NewUserPass456!',
    firstName: 'New',
    lastName: 'Customer',
  },
  /** User with existing orders for order history testing */
  USER_WITH_ORDERS: {
    email: 'orders.test@example.com',
    password: 'OrdersPass789!',
    firstName: 'Orders',
    lastName: 'Tester',
  },
} as const;

export const TestAddresses = {
  /** Standard US shipping address */
  US_SHIPPING: {
    firstName: 'Test',
    lastName: 'User',
    address1: '123 Test Street',
    address2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    stateCode: 'CA',
    zip: '94102',
    country: 'United States',
    countryCode: 'US',
    phone: '+14155551234',
  },
  /** International shipping address */
  INTERNATIONAL_SHIPPING: {
    firstName: 'Test',
    lastName: 'International',
    address1: '456 Test Avenue',
    city: 'London',
    state: '',
    zip: 'SW1A 1AA',
    country: 'United Kingdom',
    countryCode: 'GB',
    phone: '+442071234567',
  },
  /** Address with special characters for validation testing */
  SPECIAL_CHARS_ADDRESS: {
    firstName: "Test-O'Brien",
    lastName: 'User Jr.',
    address1: '789 Test Blvd, Suite #100',
    city: 'Los Angeles',
    state: 'CA',
    stateCode: 'CA',
    zip: '90001',
    country: 'United States',
    countryCode: 'US',
  },
} as const;

export const TestPayment = {
  /** Valid test credit card */
  VALID_CARD: {
    number: '4242424242424242',
    expMonth: '12',
    expYear: '2030',
    cvv: '123',
    name: 'Test User',
  },
  /** Card that will be declined */
  DECLINED_CARD: {
    number: '4000000000000002',
    expMonth: '12',
    expYear: '2030',
    cvv: '123',
    name: 'Test User',
  },
  /** Card requiring 3D Secure authentication */
  SECURE_3D_CARD: {
    number: '4000000000003220',
    expMonth: '12',
    expYear: '2030',
    cvv: '123',
    name: 'Test User',
  },
} as const;

export const TestDiscounts = {
  /** Valid percentage discount code */
  PERCENTAGE_OFF: {
    code: 'TEST10OFF',
    type: 'percentage',
    value: 10,
  },
  /** Valid fixed amount discount code */
  FIXED_AMOUNT: {
    code: 'SAVE20',
    type: 'fixed',
    value: 20,
  },
  /** Free shipping discount code */
  FREE_SHIPPING: {
    code: 'FREESHIP',
    type: 'shipping',
    value: 0,
  },
  /** Expired discount code for error testing */
  EXPIRED_CODE: {
    code: 'EXPIRED2023',
    type: 'percentage',
    value: 15,
    isExpired: true,
  },
} as const;
