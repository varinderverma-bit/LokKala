import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectCartItems, selectCartTotals, selectShippingOptionId } from '@/features/cart/selectors';
import { removeFromCart, updateQuantity, setShippingOption } from '@/features/cart/cartSlice';
import { getShippingOptions } from '@/features/cart/cartSlice';
import { Button, Input } from '@/components/ui';
import { formatCurrency } from '@/utils/currency';

export function CartPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartTotals);
  const shippingOptionId = useAppSelector(selectShippingOptionId);
  const shippingOptions = getShippingOptions();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Your cart is empty</h1>
        <Link to="/explore" className="mt-6 inline-block"><Button>Explore Art</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Shopping Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.artId} className="flex gap-4 rounded-xl border border-primary-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <img src={item.art.images[0]} alt={item.art.title} className="h-24 w-24 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <Link to={`/art/${item.artId}`} className="font-semibold text-primary-900 hover:text-accent-600 dark:text-white">{item.art.title}</Link>
                <p className="text-sm text-primary-600 dark:text-primary-400">{formatCurrency(item.art.price * item.quantity, item.art.currency)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" onClick={() => dispatch(updateQuantity({ artId: item.artId, quantity: item.quantity - 1 }))} className="h-8 w-8 rounded border" aria-label="Decrease">−</button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button type="button" onClick={() => dispatch(updateQuantity({ artId: item.artId, quantity: item.quantity + 1 }))} className="h-8 w-8 rounded border" aria-label="Increase">+</button>
                  <button type="button" onClick={() => dispatch(removeFromCart(item.artId))} className="ml-4 text-sm text-red-600 dark:text-red-400">Remove</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
          <div className="rounded-xl border border-primary-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold text-primary-900 dark:text-white">Order Summary</h2>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-primary-600 dark:text-primary-400">Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Shipping</p>
                {shippingOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2">
                    <input type="radio" name="shipping" checked={shippingOptionId === opt.id} onChange={() => dispatch(setShippingOption(opt.id))} className="rounded" />
                    <span className="text-sm">{opt.label} — {formatCurrency(opt.price)} ({opt.days} days)</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between text-sm"><span className="text-primary-600 dark:text-primary-400">Tax (est.)</span><span>{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t dark:border-gray-700"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
            </div>
            <div className="mt-6"><Input placeholder="Promo code" /><Button variant="outline" size="sm" className="mt-2">Apply</Button></div>
            <Link to="/checkout" className="mt-6 block"><Button fullWidth size="lg">Proceed to Checkout</Button></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
