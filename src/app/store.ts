import { configureStore } from '@reduxjs/toolkit';
import { artApi } from '@/api/artApi';
import catalogReducer from '@/features/catalog/catalogSlice';
import cartReducer from '@/features/cart/cartSlice';
import userReducer from '@/features/user/userSlice';
import uiReducer from '@/features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    [artApi.reducerPath]: artApi.reducer,
    catalog: catalogReducer,
    cart: cartReducer,
    user: userReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(artApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
