import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';

export const selectFollowedArtistIds = (state: RootState) => state.user.followedArtistIds;
export const selectIsFollowingArtist = (artistId: string) =>
  createSelector([selectFollowedArtistIds], (ids) => ids.includes(artistId));
