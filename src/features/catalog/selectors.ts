import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { buildQueryFromFilters } from '@/utils/query';

export const selectCatalogFilters = (state: RootState) => state.catalog;
export const selectQueryFromFilters = createSelector([selectCatalogFilters], (f) => buildQueryFromFilters(f));
