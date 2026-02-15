import type { CartItem, ShippingOption } from '@/types';

export interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function computeTotals(items: CartItem[], shippingOption: ShippingOption | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.art.price * item.quantity, 0);
  const shipping = shippingOption?.price ?? 0;
  const tax = (subtotal + shipping) * 0.08;
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}
