import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { registerBuyer } from '@/features/auth/authSlice';
import { addToast } from '@/features/ui/uiSlice';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Button, Input } from '@/components/ui';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const token = `mock-token-${userId}`;

    dispatch(registerBuyer({ userId, email: email.trim(), token }));
    dispatch(addToast({ message: 'Account created! Welcome.', type: 'success' }));
    const from = new URLSearchParams(location.search).get('from');
    navigate(from === 'checkout' ? '/checkout' : '/');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-primary-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
          Create account
        </h1>
        <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
          Register as a buyer to save your details and track orders.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth size="lg">
            Create account
          </Button>
        </form>

        <SocialLoginButtons
          mode="register"
          onSuccess={() => {
            const from = new URLSearchParams(location.search).get('from');
            navigate(from === 'checkout' ? '/checkout' : '/');
          }}
        />

        <p className="mt-6 text-center text-sm text-primary-600 dark:text-primary-400">
          Already have an account?{' '}
          <Link
            to={`/login${location.search ? `?${location.search}` : ''}`}
            className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
