/**
 * Test utilities barrel export.
 * Import all utilities from this file for convenience.
 */

export {
  clearCart,
  clearCartStorage,
  addToCart,
  getCartState,
  waitForCartState,
  updateCartItemQuantity,
  removeCartItem,
  applyDiscountCode,
} from './cart-helpers';

export type { CartItem, CartState } from './cart-helpers';

export {
  login,
  logout,
  register,
  isAuthenticated,
  saveAuthState,
  createGuestState,
  createAuthenticatedState,
  requestPasswordReset,
  updateProfile,
} from './auth-helpers';

export type { AuthUser } from './auth-helpers';

export {
  initiateCheckout,
  fillContactInfo,
  fillShippingAddress,
  selectShippingMethod,
  fillPaymentInfo,
  continueToNextStep,
  completeOrder,
  completeGuestCheckout,
  verifyOrderConfirmation,
  getCurrentCheckoutStep,
  applyCheckoutDiscount,
} from './checkout-helpers';

export type { ShippingAddress, PaymentInfo, CheckoutStep } from './checkout-helpers';
