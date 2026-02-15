import { createSlice } from '@reduxjs/toolkit';

export type AuthRole = 'guest' | 'buyer' | 'artist';

export interface AuthUser {
  userId: string;
  email: string;
  role: AuthRole;
  token?: string;
}

interface AuthState {
  user: AuthUser | null;
  isGuestCheckout: boolean;
}

const initialState: AuthState = {
  user: null,
  isGuestCheckout: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginAsArtist: (
      state,
      action: { payload: { userId: string; email: string; token?: string } }
    ) => {
      state.user = {
        userId: action.payload.userId,
        email: action.payload.email,
        role: 'artist',
        token: action.payload.token,
      };
      state.isGuestCheckout = false;
    },
    loginAsBuyer: (
      state,
      action: { payload: { userId: string; email: string; token?: string } }
    ) => {
      state.user = {
        userId: action.payload.userId,
        email: action.payload.email,
        role: 'buyer',
        token: action.payload.token,
      };
      state.isGuestCheckout = false;
    },
    registerBuyer: (
      state,
      action: { payload: { userId: string; email: string; token?: string } }
    ) => {
      state.user = {
        userId: action.payload.userId,
        email: action.payload.email,
        role: 'buyer',
        token: action.payload.token,
      };
      state.isGuestCheckout = false;
    },
    logout: (state) => {
      state.user = null;
      state.isGuestCheckout = false;
    },
    continueAsGuest: (state) => {
      state.user = null;
      state.isGuestCheckout = true;
    },
  },
});

export const { loginAsArtist, loginAsBuyer, registerBuyer, logout, continueAsGuest } =
  authSlice.actions;
export default authSlice.reducer;
