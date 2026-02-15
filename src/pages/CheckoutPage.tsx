import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectCartItems, selectCartTotals } from '@/features/cart/selectors';
import { selectIsBuyer, selectAuthUser } from '@/features/auth/selectors';
import { clearCart } from '@/features/cart/cartSlice';
import { addOrder } from '@/features/orders/ordersSlice';
import { addToast } from '@/features/ui/uiSlice';
import { Button, Input } from '@/components/ui';
import { formatCurrency } from '@/utils/currency';

interface FormErrors { fullName?: string; email?: string; address?: string; city?: string; zip?: string; country?: string }

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const items = useAppSelector(selectCartItems);
  const totals = useAppSelector(selectCartTotals);
  const isBuyer = useAppSelector(selectIsBuyer);
  const authUser = useAppSelector(selectAuthUser);
  const [form, setForm] = useState({
    fullName: '',
    email: authUser?.email ?? '',
    address: '',
    city: '',
    zip: '',
    country: '',
    shippingMethod: 'standard',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.zip.trim()) e.zip = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const orderId = `ORD-${Date.now()}`;
    const orderItems = items.map((i) => ({
      artId: i.artId,
      title: i.art.title,
      quantity: i.quantity,
      price: i.art.price * i.quantity,
    }));
    dispatch(
      addOrder({
        orderId,
        userId: authUser?.role === 'buyer' ? authUser.userId : null,
        email: form.email.trim(),
        items: orderItems,
        total: totals.total,
        currency: 'USD',
        shippingAddress: {
          fullName: form.fullName.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          zip: form.zip.trim(),
          country: form.country.trim(),
        },
      })
    );
    dispatch(clearCart());
    dispatch(addToast({ message: 'Order placed!', type: 'success' }));
    navigate(`/order-success?orderId=${orderId}`);
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">Your cart is empty</h1>
        <Link to="/explore" className="mt-6 inline-block"><Button>Continue Shopping</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white sm:text-3xl">Checkout</h1>

      {isBuyer && authUser && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-primary-900 dark:text-white">Checking out as {authUser.email}</p>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">Your order will be linked to your account.</p>
        </div>
      )}
      {!isBuyer && (
        <div className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm font-medium text-primary-900 dark:text-white">Checking out as guest</p>
          <p className="mt-1 text-sm text-primary-600 dark:text-primary-400">
            You can place your order without an account, or{' '}
            <Link to="/login?from=checkout" className="font-medium text-accent-600 hover:underline dark:text-accent-400">log in</Link>
            {' '}/{' '}
            <Link to="/register?from=checkout" className="font-medium text-accent-600 hover:underline dark:text-accent-400">register</Link>
            {' '}to save your details and track orders.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold">Shipping Address</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} error={errors.fullName} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
              <div className="sm:col-span-2"><Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} error={errors.address} /></div>
              <Input label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} error={errors.city} />
              <Input label="ZIP" value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} error={errors.zip} />
              <Input label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} error={errors.country} />
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold">Shipping Method</h2>
            <div className="mt-4 space-y-2">
              <label className="flex items-center gap-3 rounded-lg border p-4"><input type="radio" name="shipping" checked={form.shippingMethod === 'standard'} onChange={() => setForm({ ...form, shippingMethod: 'standard' })} /><span>Standard — $25 (14 days)</span></label>
              <label className="flex items-center gap-3 rounded-lg border p-4"><input type="radio" name="shipping" checked={form.shippingMethod === 'express'} onChange={() => setForm({ ...form, shippingMethod: 'express' })} /><span>Express — $55 (5 days)</span></label>
            </div>
          </div>
          <div className="rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold">Payment</h2>
            <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">Payment placeholder. No real payment.</p>
          </div>
        </div>
        <div>
          <div className="sticky top-24 rounded-xl border bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="font-semibold">Order Summary</h2>
            <div className="mt-4 space-y-2">
              {items.map((item) => <div key={item.artId} className="flex justify-between text-sm"><span className="truncate pr-2">{item.art.title} × {item.quantity}</span><span>{formatCurrency(item.art.price * item.quantity)}</span></div>)}
              <div className="flex justify-between text-sm pt-2 border-t"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span>Shipping</span><span>{formatCurrency(totals.shipping)}</span></div>
              <div className="flex justify-between text-sm"><span>Tax</span><span>{formatCurrency(totals.tax)}</span></div>
              <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
            </div>
            <Button type="submit" fullWidth size="lg" className="mt-6">Place Order</Button>
            <Link to="/cart" className="mt-4 block text-center text-sm text-primary-600 hover:text-accent-600">Back to cart</Link>
          </div>
        </div>
      </form>
    </div>
  );
}
