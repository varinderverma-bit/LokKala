import { createSlice } from '@reduxjs/toolkit';
import type { SubmittedArt } from '@/types';

const initialState: SubmittedArt[] = [];

const submittedArtSlice = createSlice({
  name: 'submittedArt',
  initialState,
  reducers: {
    addSubmission: (state, action: { payload: Omit<SubmittedArt, 'id' | 'createdAt'> }) => {
      const id = `submitted-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      state.push({
        ...action.payload,
        id,
        createdAt: new Date().toISOString(),
      });
    },
  },
});

export const { addSubmission } = submittedArtSlice.actions;
export default submittedArtSlice.reducer;
