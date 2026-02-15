import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQuery } from './baseQuery';
import type { ArtListQuery, PaginatedResponse } from '@/types';
import type { Region, Artist, ArtItem } from '@/types';

export const artApi = createApi({
  reducerPath: 'artApi',
  baseQuery,
  tagTypes: ['Regions', 'Region', 'Artists', 'Artist', 'ArtList', 'Art', 'Recommendations'],
  endpoints: (builder) => ({
    getRegions: builder.query<Region[], void>({ query: () => ({ type: 'getRegions' }), providesTags: ['Regions'] }),
    getRegionById: builder.query<Region, string>({ query: (id) => ({ type: 'getRegionById', id }), providesTags: (_r, _e, id) => [{ type: 'Region', id }] }),
    getArtists: builder.query<Artist[], void>({ query: () => ({ type: 'getArtists' }), providesTags: ['Artists'] }),
    getArtistById: builder.query<Artist, string>({ query: (id) => ({ type: 'getArtistById', id }), providesTags: (_r, _e, id) => [{ type: 'Artist', id }] }),
    getArtistArt: builder.query<ArtItem[], string>({ query: (artistId) => ({ type: 'getArtistArt', artistId }), providesTags: (_r, _e, id) => [{ type: 'Artist', id }] }),
    getArtList: builder.query<PaginatedResponse<ArtItem>, ArtListQuery>({ query: (query) => ({ type: 'getArtList', query }), providesTags: ['ArtList'] }),
    getArtById: builder.query<ArtItem, string>({ query: (id) => ({ type: 'getArtById', id }), providesTags: (_r, _e, id) => [{ type: 'Art', id }] }),
    getRecommendations: builder.query<ArtItem[], string>({ query: (artId) => ({ type: 'getRecommendations', artId }), providesTags: (_r, _e, id) => [{ type: 'Recommendations', id }] }),
  }),
});

export const {
  useGetRegionsQuery,
  useGetRegionByIdQuery,
  useGetArtistsQuery,
  useGetArtistByIdQuery,
  useGetArtistArtQuery,
  useGetArtListQuery,
  useGetArtByIdQuery,
  useGetRecommendationsQuery,
} = artApi;
