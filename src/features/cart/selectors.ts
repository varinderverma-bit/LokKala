import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { computeTotals } from '@/utils/cart';
import { getShippingOptions } from './cartSlice';

export const selectCartItems = (state: RootState) => state.cart.items;
export const selectShippingOptionId = (state: RootState) => state.cart.shippingOptionId;
export const selectCartCount = createSelector([selectCartItems], (items) => items.reduce((s, i) => s + i.quantity, 0));
export const selectCartTotals = createSelector([selectCartItems, selectShippingOptionId], (items, id) => {
  const opt = getShippingOptions().find((o) => o.id === id) ?? getShippingOptions()[0];
  return computeTotals(items, opt);
});
