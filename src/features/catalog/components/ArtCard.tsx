import { Link } from 'react-router-dom';
import type { ArtItem } from '@/types';
import { Badge } from '@/components/ui';
import { formatCurrency } from '@/utils/currency';

const availabilityVariant: Record<string, 'success' | 'warning' | 'error'> = {
  IN_STOCK: 'success',
  LIMITED: 'warning',
  SOLD_OUT: 'error',
};

export function ArtCard({ art }: { art: ArtItem }) {
  return (
    <Link to={`/art/${art.id}`} className="group block rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-accent-500">
      <div className="relative aspect-square overflow-hidden bg-primary-100 dark:bg-gray-700">
        <img src={art.images[0]} alt={art.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
        <div className="absolute top-2 right-2">
          <Badge variant={availabilityVariant[art.availability] ?? 'default'}>{art.availability.replace('_', ' ')}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-display text-lg font-semibold text-primary-900 dark:text-white group-hover:text-accent-600">{art.title}</h3>
        <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">{art.style} · {art.medium}</p>
        <p className="mt-2 font-semibold text-accent-600 dark:text-accent-400">{formatCurrency(art.price, art.currency)}</p>
        <span className="mt-2 inline-block text-sm font-medium text-accent-600 group-hover:underline">View story →</span>
      </div>
    </Link>
  );
}
