import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? 'Unknown';

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">✓</div>
      <h1 className="mt-6 font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Thank you for your order!</h1>
      <p className="mt-2 text-primary-600 dark:text-primary-400">Order <span className="font-mono font-semibold">{orderId}</span> has been placed.</p>
      <div className="mt-8 rounded-xl border bg-primary-50 p-6 text-left dark:border-gray-700 dark:bg-gray-800">
        <h2 className="font-semibold">Next steps</h2>
        <ul className="mt-4 space-y-2 text-sm text-primary-700 dark:text-primary-300">
          <li>• Confirmation email (mock)</li>
          <li>• Artist prepares your artwork</li>
          <li>• Tracking when shipped</li>
        </ul>
      </div>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Link to={`/orders/${orderId}`}><Button>View order</Button></Link>
        <Link to="/orders"><Button variant="secondary">My orders</Button></Link>
        <Link to="/explore"><Button variant="outline">Continue Shopping</Button></Link>
      </div>
    </div>
  );
}
