import type { RootState } from '@/app/store';

export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectIsGuestCheckout = (state: RootState) => state.auth.isGuestCheckout;

export const selectIsArtist = (state: RootState) => state.auth.user?.role === 'artist';
export const selectIsBuyer = (state: RootState) => state.auth.user?.role === 'buyer';
export const selectIsLoggedIn = (state: RootState) => !!state.auth.user;
export const selectUserId = (state: RootState) => state.auth.user?.userId ?? null;
