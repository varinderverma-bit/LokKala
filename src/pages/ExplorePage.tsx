import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetArtListQuery, useGetRegionsQuery } from '@/api/artApi';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectQueryFromFilters } from '@/features/catalog/selectors';
import { setSearch, setRegionIds, setSort, setPage, resetFilters } from '@/features/catalog/catalogSlice';
import { ArtCard } from '@/features/catalog/components/ArtCard';
import { ArtCardSkeleton } from '@/features/catalog/components/ArtCardSkeleton';
import { Button, Input } from '@/components/ui';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
] as const;

export function ExplorePage() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const query = useAppSelector(selectQueryFromFilters);
  const [localSearch, setLocalSearch] = useState(query.search ?? '');

  const { data, isLoading, isFetching } = useGetArtListQuery(query);
  const { data: regions } = useGetRegionsQuery();

  useEffect(() => {
    const regionParam = searchParams.get('region');
    if (regionParam) dispatch(setRegionIds([regionParam]));
  }, [searchParams, dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setSearch(localSearch));
  };

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const currentPage = query.page ?? 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Explore Art</h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <aside className="w-full lg:w-64 flex-shrink-0">
          <form onSubmit={handleSearch} className="space-y-4">
            <Input type="search" placeholder="Search art..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} aria-label="Search" />
            <Button type="submit" variant="outline" fullWidth>Search</Button>
          </form>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-primary-900 dark:text-white">Region</h3>
            <div className="mt-2 space-y-2">
              {regions?.map((r) => (
                <label key={r.id} className="flex items-center gap-2">
                  <input type="checkbox" checked={query.regionIds?.includes(r.id) ?? false} onChange={(e) => dispatch(setRegionIds(e.target.checked ? [...(query.regionIds ?? []), r.id] : (query.regionIds ?? []).filter((id) => id !== r.id)))} className="rounded border-primary-300" />
                  <span className="text-sm text-primary-700 dark:text-primary-300">{r.name}</span>
                </label>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => dispatch(resetFilters())}>Reset filters</Button>
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-primary-600 dark:text-primary-400">{data ? `${data.total} results` : 'Loading...'}</p>
            <select value={query.sort ?? 'popular'} onChange={(e) => dispatch(setSort(e.target.value as typeof query.sort))} className="rounded-lg border border-primary-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800" aria-label="Sort by">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {(isLoading || isFetching) ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ArtCardSkeleton key={i} />)}</div>
          ) : items.length === 0 ? (
            <div className="mt-16 text-center">
              <p className="text-lg text-primary-600 dark:text-primary-400">No art found.</p>
              <Button variant="outline" className="mt-4" onClick={() => dispatch(resetFilters())}>Clear filters</Button>
            </div>
          ) : (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{items.map((art) => <ArtCard key={art.id} art={art} />)}</div>
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => dispatch(setPage(currentPage - 1))}>Previous</Button>
                  <span className="flex items-center px-4 text-sm text-primary-600 dark:text-primary-400">Page {currentPage} of {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => dispatch(setPage(currentPage + 1))}>Next</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
