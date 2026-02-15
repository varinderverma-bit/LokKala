import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui';
import { useGetRegionsQuery } from '@/api/artApi';

export function SubmittedArtDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: regions } = useGetRegionsQuery();
  const submission = useAppSelector((state) =>
    state.submittedArt.find((a) => a.id === id)
  );

  const regionName = regions?.find((r) => r.id === submission?.regionId)?.name ?? submission?.regionId;

  if (!submission) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
          Submission not found
        </h1>
        <Link to="/submitted-art" className="mt-6 inline-block">
          <Button>Back to community art</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className="aspect-square overflow-hidden rounded-xl bg-primary-100 dark:bg-gray-800">
            <img
              src={submission.imageUrl}
              alt={submission.title}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-primary-900 dark:text-white">
            {submission.title}
          </h1>
          <p className="mt-2 text-primary-600 dark:text-primary-400">
            by {submission.creatorName}
          </p>
          <p className="mt-1 text-sm text-primary-500 dark:text-primary-500">
            {submission.medium} · {submission.dimensions} · {submission.yearCreated}
          </p>
          {submission.technique && (
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
              <strong>Technique:</strong> {submission.technique}
            </p>
          )}
          {submission.materials && (
            <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
              <strong>Materials:</strong> {submission.materials}
            </p>
          )}
          {regionName && (
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
              <strong>Region:</strong> {regionName}
            </p>
          )}
          {submission.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {submission.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary-200 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-700 dark:text-primary-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 space-y-10">
        <section>
          <h2 className="font-display text-xl font-semibold text-primary-900 dark:text-white">
            Personal story
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-primary-700 dark:text-primary-300">
            {submission.personalStory}
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-primary-900 dark:text-white">
            Story of the region
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-primary-700 dark:text-primary-300">
            {submission.regionStory}
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-semibold text-primary-900 dark:text-white">
            What the painting signifies
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 text-primary-700 dark:text-primary-300">
            {submission.significance.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link to="/submitted-art">
          <Button variant="outline">Back to community art</Button>
        </Link>
        <Link to="/add-art">
          <Button variant="ghost">List another art</Button>
        </Link>
      </div>
    </div>
  );
}
