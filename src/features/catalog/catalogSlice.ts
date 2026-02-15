import { createSlice } from '@reduxjs/toolkit';
import type { CatalogFilters } from '@/utils/query';

const initialState: CatalogFilters = {
  search: '',
  regionIds: [],
  styles: [],
  mediums: [],
  minPrice: null,
  maxPrice: null,
  availability: [],
  shippingFrom: [],
  sort: 'popular',
  page: 1,
  pageSize: 12,
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSearch: (state, action: { payload: string }) => {
      state.search = action.payload;
      state.page = 1;
    },
    setRegionIds: (state, action: { payload: string[] }) => {
      state.regionIds = action.payload;
      state.page = 1;
    },
    setStyles: (state, action: { payload: string[] }) => {
      state.styles = action.payload;
      state.page = 1;
    },
    setMediums: (state, action: { payload: string[] }) => {
      state.mediums = action.payload;
      state.page = 1;
    },
    setPriceRange: (state, action: { payload: { min: number | null; max: number | null } }) => {
      state.minPrice = action.payload.min;
      state.maxPrice = action.payload.max;
      state.page = 1;
    },
    setAvailability: (state, action: { payload: string[] }) => {
      state.availability = action.payload;
      state.page = 1;
    },
    setShippingFrom: (state, action: { payload: string[] }) => {
      state.shippingFrom = action.payload;
      state.page = 1;
    },
    setSort: (state, action: { payload: CatalogFilters['sort'] }) => {
      state.sort = action.payload;
      state.page = 1;
    },
    setPage: (state, action: { payload: number }) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: { payload: number }) => {
      state.pageSize = action.payload;
      state.page = 1;
    },
    resetFilters: () => initialState,
  },
});

export const { setSearch, setRegionIds, setStyles, setMediums, setPriceRange, setAvailability, setShippingFrom, setSort, setPage, setPageSize, resetFilters } = catalogSlice.actions;
export default catalogSlice.reducer;
