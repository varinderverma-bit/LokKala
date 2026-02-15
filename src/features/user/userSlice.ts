import { createSlice } from '@reduxjs/toolkit';

const initialState = { followedArtistIds: [] as string[], recentlyViewedArtIds: [] as string[] };

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    toggleFollowArtist: (state, action: { payload: string }) => {
      const id = action.payload;
      const i = state.followedArtistIds.indexOf(id);
      if (i >= 0) state.followedArtistIds.splice(i, 1);
      else state.followedArtistIds.push(id);
    },
    addRecentlyViewed: (state, action: { payload: string }) => {
      const id = action.payload;
      state.recentlyViewedArtIds = [id, ...state.recentlyViewedArtIds.filter((x) => x !== id)].slice(0, 20);
    },
  },
});

export const { toggleFollowArtist, addRecentlyViewed } = userSlice.actions;
export default userSlice.reducer;
