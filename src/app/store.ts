import { configureStore } from '@reduxjs/toolkit';
import { artApi } from '@/api/artApi';
import catalogReducer from '@/features/catalog/catalogSlice';
import cartReducer from '@/features/cart/cartSlice';
import userReducer from '@/features/user/userSlice';
import uiReducer from '@/features/ui/uiSlice';
import submittedArtReducer from '@/features/submittedArt/submittedArtSlice';
import authReducer from '@/features/auth/authSlice';
import ordersReducer from '@/features/orders/ordersSlice';

export const store = configureStore({
  reducer: {
    [artApi.reducerPath]: artApi.reducer,
    catalog: catalogReducer,
    cart: cartReducer,
    user: userReducer,
    ui: uiReducer,
    submittedArt: submittedArtReducer,
    auth: authReducer,
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(artApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
