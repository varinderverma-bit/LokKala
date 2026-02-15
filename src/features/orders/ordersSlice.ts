import { createSlice } from '@reduxjs/toolkit';
import type { Order, OrderItem } from '@/types';

const initialState: Order[] = [];

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    addOrder: (
      state,
      action: {
        payload: {
          orderId: string;
          userId: string | null;
          email: string;
          items: OrderItem[];
          total: number;
          currency: string;
          shippingAddress: Order['shippingAddress'];
        };
      }
    ) => {
      state.unshift({
        ...action.payload,
        status: 'CREATED',
        createdAt: new Date().toISOString(),
      });
    },
    setOrderStatus: (
      state,
      action: { payload: { orderId: string; status: string } }
    ) => {
      const order = state.find((o) => o.orderId === action.payload.orderId);
      if (order) order.status = action.payload.status;
    },
  },
});

export const { addOrder, setOrderStatus } = ordersSlice.actions;
export default ordersSlice.reducer;
