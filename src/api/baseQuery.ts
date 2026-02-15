import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { simulateApiCall } from './mockApiConfig';
import { regions, artists, artItems } from './mockDb';
import type { ArtListQuery, PaginatedResponse } from '@/types';
import type { ArtItem } from '@/types';

export type MockBaseQueryArg = { type: string; [key: string]: unknown };

export const mockBaseQuery: BaseQueryFn<
  MockBaseQueryArg,
  unknown,
  { status?: number; data?: string }
> = async (arg) => {
  return simulateApiCall(() => {
    const { type, ...params } = arg;
    switch (type) {
      case 'getRegions':
        return { data: [...regions] };
      case 'getRegionById': {
        const r = regions.find((x) => x.id === params.id);
        if (!r) return { error: { status: 404, data: 'Not found' } };
        return { data: r };
      }
      case 'getArtists':
        return { data: [...artists] };
      case 'getArtistById': {
        const a = artists.find((x) => x.id === params.id);
        if (!a) return { error: { status: 404, data: 'Not found' } };
        return { data: a };
      }
      case 'getArtistArt':
        return { data: artItems.filter((a) => a.artistId === params.artistId) };
      case 'getArtList': {
        const q = params.query as ArtListQuery;
        const result = filterSortArt(q);
        return { data: result };
      }
      case 'getArtById': {
        const a = artItems.find((x) => x.id === params.id);
        if (!a) return { error: { status: 404, data: 'Not found' } };
        return { data: a };
      }
      case 'getRecommendations': {
        const art = artItems.find((x) => x.id === params.artId);
        let recs: ArtItem[] = art
          ? artItems.filter((a) => a.id !== art.id && (a.regionId === art.regionId || a.artistId === art.artistId)).slice(0, 4)
          : [];
        if (recs.length < 4) {
          recs = [...recs, ...artItems.filter((a) => !recs.find((r) => r.id === a.id)).slice(0, 4 - recs.length)];
        }
        return { data: recs };
      }
      default:
        return { error: { status: 400, data: 'Unknown' } };
    }
  });
};

function filterSortArt(q: ArtListQuery): PaginatedResponse<ArtItem> {
  const { search, regionIds, sort = 'popular', page = 1, pageSize = 12 } = q;
  let list = [...artItems];
  if (search?.trim()) {
    const s = search.toLowerCase();
    list = list.filter((a) => a.title.toLowerCase().includes(s) || a.tags.some((t) => t.toLowerCase().includes(s)));
  }
  if (regionIds?.length) list = list.filter((a) => regionIds.includes(a.regionId));
  if (sort === 'newest') list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  else if (sort === 'price_asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price_desc') list.sort((a, b) => b.price - a.price);
  else list.sort((a, b) => b.popularityScore - a.popularityScore);
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return { items: list.slice(start, start + pageSize), total, page, pageSize, totalPages };
}
