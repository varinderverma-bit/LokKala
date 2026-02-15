import type { ArtListQuery } from '@/types';

export interface CatalogFilters {
  search: string;
  regionIds: string[];
  styles: string[];
  mediums: string[];
  minPrice: number | null;
  maxPrice: number | null;
  availability: string[];
  shippingFrom: string[];
  sort: 'popular' | 'newest' | 'price_asc' | 'price_desc';
  page: number;
  pageSize: number;
}

export function buildQueryFromFilters(filters: CatalogFilters): ArtListQuery {
  return {
    search: filters.search || undefined,
    regionIds: filters.regionIds.length ? filters.regionIds : undefined,
    styles: filters.styles.length ? filters.styles : undefined,
    mediums: filters.mediums.length ? filters.mediums : undefined,
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    availability: filters.availability.length ? (filters.availability as ArtListQuery['availability']) : undefined,
    shippingFrom: filters.shippingFrom.length ? filters.shippingFrom : undefined,
    sort: filters.sort,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}
