import { useParams, Link } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectUserId, selectIsBuyer } from '@/features/auth/selectors';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils/currency';

export function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const userId = useAppSelector(selectUserId);
  const isBuyer = useAppSelector(selectIsBuyer);
  const order = useAppSelector((state) =>
    state.orders.find((o) => o.orderId === orderId)
  );

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Order not found</h1>
        <Link to="/orders" className="mt-6 inline-block">
          <Button>Back to my orders</Button>
        </Link>
      </div>
    );
  }

  const isOwner = order.userId === null || (isBuyer && userId && order.userId === userId);
  if (!isOwner) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Access denied</h1>
        <p className="mt-4 text-primary-600 dark:text-primary-400">This order belongs to another account.</p>
        <Link to="/orders" className="mt-6 inline-block">
          <Button>My orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">
          Order {order.orderId}
        </h1>
        <span className="rounded-full bg-primary-200 px-3 py-1 text-sm font-medium text-primary-800 dark:bg-primary-700 dark:text-primary-200">
          {order.status}
        </span>
      </div>
      <p className="text-sm text-primary-600 dark:text-primary-400">
        Placed on {new Date(order.createdAt).toLocaleString()}
      </p>

      <div className="mt-8 rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-primary-900 dark:text-white">Items</h2>
        <ul className="mt-4 space-y-3">
          {order.items.map((item) => (
            <li
              key={`${item.artId}-${item.quantity}`}
              className="flex justify-between text-sm"
            >
              <span>
                {item.title} × {item.quantity}
              </span>
              <span>{formatCurrency(item.price, order.currency)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-primary-200 pt-4 dark:border-gray-700">
          <div className="flex justify-between font-semibold text-primary-900 dark:text-white">
            <span>Total</span>
            <span>{formatCurrency(order.total, order.currency)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold text-primary-900 dark:text-white">Shipping address</h2>
        <p className="mt-2 text-sm text-primary-700 dark:text-primary-300">
          {order.shippingAddress.fullName}
          <br />
          {order.shippingAddress.address}
          <br />
          {order.shippingAddress.city}, {order.shippingAddress.zip}
          <br />
          {order.shippingAddress.country}
        </p>
      </div>

      <div className="mt-8">
        <Link to="/orders">
          <Button variant="outline">Back to my orders</Button>
        </Link>
      </div>
    </div>
  );
}
