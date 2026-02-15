import { Link } from 'react-router-dom';
import { useGetRegionsQuery, useGetArtListQuery } from '@/api/artApi';
import { Button } from '@/components/ui';
import { ArtCard } from '@/features/catalog/components/ArtCard';
import { ArtCardSkeleton } from '@/features/catalog/components/ArtCardSkeleton';

export function HomePage() {
  const { data: regions, isLoading: regionsLoading } = useGetRegionsQuery();
  const { data: artList, isLoading: artLoading } = useGetArtListQuery({ page: 1, pageSize: 6, sort: 'popular' });

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-100 to-accent-50 dark:from-primary-900 dark:to-accent-950 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-bold text-primary-900 dark:text-white sm:text-5xl lg:text-6xl">Discover Art With a Story</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-600 dark:text-primary-400">Direct from artists to buyers. Every piece carries the soul of its region.</p>
          <Link to="/explore" className="mt-8 inline-block"><Button size="lg">Explore Art</Button></Link>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Featured Regions</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {regionsLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-primary-200 dark:bg-gray-700" />)
              : regions?.slice(0, 4).map((r) => (
                  <Link key={r.id} to={`/explore?region=${r.id}`} className="group block overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg dark:bg-gray-800">
                    <div className="aspect-[4/3] overflow-hidden"><img src={r.heroImage} alt={r.name} className="h-full w-full object-cover group-hover:scale-105" /></div>
                    <div className="p-4">
                      <h3 className="font-display font-semibold text-primary-900 dark:text-white">{r.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-primary-600 dark:text-primary-400">{r.shortHistory}</p>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      <section className="bg-primary-50 py-16 dark:bg-gray-900 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Featured Art</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {artLoading ? Array.from({ length: 6 }).map((_, i) => <ArtCardSkeleton key={i} />) : artList?.items.map((art) => <ArtCard key={art.id} art={art} />)}
          </div>
          <div className="mt-10 text-center">
            <Link to="/explore"><Button variant="outline" size="lg">View All Art</Button></Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl text-center">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900"><span className="text-2xl font-bold text-accent-600 dark:text-accent-400">{n}</span></div>
                <h3 className="mt-4 font-semibold text-primary-900 dark:text-white">{['Discover', 'Connect', 'Own'][n - 1]}</h3>
                <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">Step {n} description.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-accent-600 py-16 dark:bg-accent-800 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">Join the Community</h2>
          <p className="mt-4 text-accent-100">Get stories from artists and new arrivals.</p>
          <form className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <input type="email" placeholder="Your email" className="w-full rounded-lg border-0 px-4 py-3 text-primary-900 sm:w-72" aria-label="Email" />
            <Button type="submit" variant="secondary" size="lg">Subscribe</Button>
          </form>
        </div>
      </section>
    </div>
  );
}
