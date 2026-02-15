import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui';

export function SubmittedArtListPage() {
  const submissions = useAppSelector((state) => state.submittedArt);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">
          Community submissions
        </h1>
        <Link to="/add-art">
          <Button>List your art</Button>
        </Link>
      </div>
      <p className="mt-2 text-primary-600 dark:text-primary-400">
        Art and stories shared by our community.
      </p>

      {submissions.length === 0 ? (
        <div className="mt-16 rounded-xl border border-primary-200 bg-primary-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-lg text-primary-600 dark:text-primary-400">
            No submissions yet. Be the first to share your artifact and story.
          </p>
          <Link to="/add-art" className="mt-6 inline-block">
            <Button size="lg">List your art</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {submissions.map((art) => (
            <Link
              key={art.id}
              to={`/submitted-art/${art.id}`}
              className="group block overflow-hidden rounded-xl bg-white shadow-md hover:shadow-lg dark:bg-gray-800"
            >
              <div className="aspect-square overflow-hidden bg-primary-100 dark:bg-gray-700">
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="font-display font-semibold text-primary-900 dark:text-white group-hover:text-accent-600">
                  {art.title}
                </h3>
                <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
                  {art.creatorName} · {art.medium}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
