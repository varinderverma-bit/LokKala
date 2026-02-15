import { createSlice } from '@reduxjs/toolkit';
import type { ArtItem, CartItem, ShippingOption } from '@/types';

const defaultShipping: ShippingOption[] = [
  { id: 'standard', label: 'Standard', price: 25, days: 14 },
  { id: 'express', label: 'Express', price: 55, days: 5 },
];

const initialState = { items: [] as CartItem[], shippingOptionId: 'standard' };

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: { payload: { art: ArtItem; quantity?: number } }) => {
      const { art, quantity = 1 } = action.payload;
      const ex = state.items.find((i) => i.artId === art.id);
      if (ex) ex.quantity += quantity;
      else state.items.push({ artId: art.id, quantity, art });
    },
    removeFromCart: (state, action: { payload: string }) => {
      state.items = state.items.filter((i) => i.artId !== action.payload);
    },
    updateQuantity: (state, action: { payload: { artId: string; quantity: number } }) => {
      const { artId, quantity } = action.payload;
      const item = state.items.find((i) => i.artId === artId);
      if (item) {
        if (quantity <= 0) state.items = state.items.filter((i) => i.artId !== artId);
        else item.quantity = quantity;
      }
    },
    setShippingOption: (state, action: { payload: string }) => {
      state.shippingOptionId = action.payload;
    },
    clearCart: () => initialState,
  },
});

export const { addToCart, removeFromCart, updateQuantity, setShippingOption, clearCart } = cartSlice.actions;
export const getShippingOptions = () => defaultShipping;
export default cartSlice.reducer;
