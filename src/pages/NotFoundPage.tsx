import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
      <h1 className="font-display text-6xl font-bold text-primary-200 dark:text-primary-700">404</h1>
      <h2 className="mt-4 font-display text-xl font-semibold text-primary-900 dark:text-white">Page not found</h2>
      <p className="mt-2 text-center text-primary-600 dark:text-primary-400">The page you're looking for doesn't exist.</p>
      <div className="mt-8 flex gap-4">
        <Link to="/"><Button>Home</Button></Link>
        <Link to="/explore"><Button variant="outline">Explore</Button></Link>
      </div>
    </div>
  );
}
