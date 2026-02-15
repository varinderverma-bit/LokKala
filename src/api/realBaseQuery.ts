import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import { API_BASE_URL, lokkalaUrl } from './config';
import type { ArtItem, ArtListQuery, PaginatedResponse } from '@/types';
import { logger } from '@/utils/logger';

type RealQueryArg =
  | { type: 'getArtList'; query: ArtListQuery }
  | { type: 'getArtById'; id: string };

function mapBffItemToArtItem(item: Record<string, unknown>): ArtItem {
  const images = (item.images as string[]) || [];
  return {
    id: (item.id as string) || '',
    title: (item.title as string) || '',
    price: typeof item.price === 'number' ? item.price : 0,
    currency: (item.currency as string) || 'USD',
    images,
    regionId: (item.regionId as string) || '',
    artistId: (item.userId as string) || '',
    style: (item.style as string) || '',
    medium: (item.medium as string) || '',
    dimensions: (item.dimensions as string) || '',
    yearCreated: typeof item.yearCreated === 'number' ? item.yearCreated : new Date().getFullYear(),
    story: (item.story as string) || '',
    significance: Array.isArray(item.significance) ? (item.significance as string[]) : [],
    technique: (item.technique as string) || '',
    materials: (item.materials as string) || '',
    tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
    availability: (item.availability as ArtItem['availability']) || 'IN_STOCK',
    shippingFrom: (item.shippingFrom as string) || '',
    etaDays: typeof item.etaDays === 'number' ? item.etaDays : 14,
    popularityScore: typeof item.popularityScore === 'number' ? item.popularityScore : 0,
    createdAt: (item.createdAt as string) || new Date().toISOString(),
  };
}

export const realBaseQuery: BaseQueryFn<
  RealQueryArg,
  unknown,
  { status?: number; data?: string }
> = async (arg) => {
  if (!API_BASE_URL) {
    return { error: { status: 0, data: 'API_BASE_URL not configured' } };
  }
  const { type } = arg;
  try {
    if (type === 'getArtList') {
      const q = arg.query;
      const params = new URLSearchParams();
      if (q?.page) params.set('page', String(q.page));
      if (q?.pageSize) params.set('pageSize', String(q.pageSize));
      if (q?.regionIds?.[0]) params.set('regionId', q.regionIds[0]);
      const url = `${lokkalaUrl('/artifacts')}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.text();
        logger.error('API request failed', { url, status: res.status, type: 'getArtList', errorData });
        return { error: { status: res.status, data: errorData } };
      }
      const data = (await res.json()) as { items?: unknown[]; total?: number; page?: number; pageSize?: number; totalPages?: number };
      const items = (data.items || []).map(mapBffItemToArtItem);
      const result: PaginatedResponse<ArtItem> = {
        items,
        total: data.total ?? items.length,
        page: data.page ?? 1,
        pageSize: data.pageSize ?? 12,
        totalPages: data.totalPages ?? 1,
      };
      return { data: result };
    }
    if (type === 'getArtById') {
      const url = lokkalaUrl(`/artifacts/${arg.id}`);
      const res = await fetch(url);
      if (!res.ok) {
        const errorData = await res.text();
        if (res.status === 404) {
          logger.debug('Art not found', { id: arg.id });
          return { error: { status: 404, data: 'Not found' } };
        }
        logger.error('API request failed', { url, status: res.status, type: 'getArtById', id: arg.id, errorData });
        return { error: { status: res.status, data: errorData } };
      }
      const item = (await res.json()) as Record<string, unknown>;
      return { data: mapBffItemToArtItem(item) };
    }
    return { error: { status: 400, data: 'Unknown query type' } };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    logger.error('API request threw', { type, error: err.message, stack: err.stack });
    return { error: { status: 0, data: String(e) } };
  }
};
