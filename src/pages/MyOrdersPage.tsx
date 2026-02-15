import { Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectUserId, selectIsBuyer } from '@/features/auth/selectors';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils/currency';

export function MyOrdersPage() {
  const userId = useAppSelector(selectUserId);
  const isBuyer = useAppSelector(selectIsBuyer);
  const allOrders = useAppSelector((state) => state.orders);
  const orders = isBuyer && userId ? allOrders.filter((o) => o.userId === userId) : [];

  if (!isBuyer) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">My orders</h1>
        <p className="mt-4 text-primary-600 dark:text-primary-400">
          Please log in as a buyer to see your orders.
        </p>
        <Link to="/login" className="mt-6 inline-block">
          <Button>Log in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">
        Order management
      </h1>
      <p className="mt-2 text-primary-600 dark:text-primary-400">
        View and track your orders.
      </p>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-xl border border-primary-200 bg-primary-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <p className="text-lg text-primary-600 dark:text-primary-400">
            You haven’t placed any orders yet.
          </p>
          <Link to="/explore" className="mt-6 inline-block">
            <Button>Browse art</Button>
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li key={order.orderId}>
              <Link
                to={`/orders/${order.orderId}`}
                className="block rounded-xl border border-primary-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono font-semibold text-primary-900 dark:text-white">
                    {order.orderId}
                  </span>
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-primary-600 dark:text-primary-400">
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {order.status}
                  </span>
                  <span className="font-semibold text-accent-600 dark:text-accent-400">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
