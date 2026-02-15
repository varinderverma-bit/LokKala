import { createSlice } from '@reduxjs/toolkit';

export type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' };

const initialState = {
  theme: 'light' as 'light' | 'dark',
  modals: { inquiryArtistId: null as string | null },
  toasts: [] as Toast[],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: { payload: 'light' | 'dark' }) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    openInquiryModal: (state, action: { payload: string }) => {
      state.modals.inquiryArtistId = action.payload;
    },
    closeInquiryModal: (state) => {
      state.modals.inquiryArtistId = null;
    },
    addToast: (state, action: { payload: Omit<Toast, 'id'> }) => {
      state.toasts.push({ ...action.payload, id: `toast-${Date.now()}-${Math.random().toString(36).slice(2)}` });
    },
    removeToast: (state, action: { payload: string }) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { setTheme, toggleTheme, openInquiryModal, closeInquiryModal, addToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
