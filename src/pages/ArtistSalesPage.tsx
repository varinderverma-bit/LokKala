import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsArtist } from '@/features/auth/selectors';
import { Button } from '@/components/ui';

/** Mock: in a real app, sales would come from backend (orders containing this artist's items). */
export function ArtistSalesPage() {
  const isArtist = useAppSelector(selectIsArtist);

  if (!isArtist) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Past sales</h1>
        <p className="mt-4 text-primary-600 dark:text-primary-400">
          Artist login required to view your sales.
        </p>
        <Link to="/login/artist" className="mt-6 inline-block">
          <Button>Artist login</Button>
        </Link>
      </div>
    );
  }

  const orders = useAppSelector((state) => state.orders);
  const artistSubmittedIds = useAppSelector((state) =>
    state.submittedArt.map((a) => a.id)
  );
  const sales = orders.filter((order) =>
    order.items.some((item) => artistSubmittedIds.includes(item.artId))
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">
        Past sales
      </h1>
      <p className="mt-2 text-primary-600 dark:text-primary-400">
        Orders that include your listed art. When the backend is connected, sales will sync here.
      </p>

      {sales.length === 0 ? (
        <div className="mt-12 rounded-xl border border-primary-200 bg-primary-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-lg text-primary-600 dark:text-primary-400">
            No sales yet. Orders containing your art will appear here.
          </p>
          <Link to="/add-art" className="mt-6 inline-block">
            <Button>List your art</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {sales.map((order) => (
            <li
              key={order.orderId}
              className="rounded-xl border border-primary-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-semibold text-primary-900 dark:text-white">
                  {order.orderId}
                </span>
                <span className="text-sm text-primary-600 dark:text-primary-400">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-primary-700 dark:text-primary-300">
                {order.items
                  .filter((item) => artistSubmittedIds.includes(item.artId))
                  .map((item) => (
                    <li key={item.artId}>
                      {item.title} × {item.quantity}
                    </li>
                  ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
