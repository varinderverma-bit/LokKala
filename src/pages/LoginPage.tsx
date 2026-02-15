import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch } from '@/app/hooks';
import { loginAsArtist, loginAsBuyer } from '@/features/auth/authSlice';
import { addToast } from '@/features/ui/uiSlice';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { Button, Input } from '@/components/ui';

type LoginMode = 'artist' | 'buyer';

/** Mock login: accepts any email + password and assigns role based on path. */
function useLoginMode(): LoginMode {
  const location = useLocation();
  const path = location.pathname;
  return path.startsWith('/login/artist') ? 'artist' : 'buyer';
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const mode = useLoginMode();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    const userId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const token = `mock-token-${userId}`;

    if (mode === 'artist') {
      dispatch(loginAsArtist({ userId, email: email.trim(), token }));
      dispatch(addToast({ message: 'Welcome back, artist!', type: 'success' }));
      navigate('/add-art');
    } else {
      dispatch(loginAsBuyer({ userId, email: email.trim(), token }));
      dispatch(addToast({ message: 'Welcome back!', type: 'success' }));
      const from = new URLSearchParams(location.search).get('from');
      navigate(from === 'checkout' ? '/checkout' : '/');
    }
  };

  const isArtist = mode === 'artist';

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-primary-200 bg-white p-8 dark:border-gray-700 dark:bg-gray-800">
        <h1 className="font-display text-2xl font-bold text-primary-900 dark:text-white">
          {isArtist ? 'Artist login' : 'Buyer login'}
        </h1>
        <p className="mt-2 text-sm text-primary-600 dark:text-primary-400">
          {isArtist
            ? 'Sign in to list your art and manage your portfolio.'
            : 'Sign in to save your details and view order history.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            placeholder="••••••••"
            required
          />
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" fullWidth size="lg">
            Sign in
          </Button>
        </form>

        <SocialLoginButtons
          mode={isArtist ? 'login-artist' : 'login-buyer'}
          onSuccess={() => {
            if (isArtist) navigate('/add-art');
            else {
              const from = new URLSearchParams(location.search).get('from');
              navigate(from === 'checkout' ? '/checkout' : '/');
            }
          }}
        />

        {!isArtist && (
          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Don&apos;t have an account?{' '}
              <Link
                to={`/register${location.search ? `?${location.search}` : ''}`}
                className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
              >
                Register
              </Link>
            </p>
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Or{' '}
              <Link
                to="/checkout"
                className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400"
              >
                continue as guest
              </Link>{' '}
              at checkout.
            </p>
          </div>
        )}

        {isArtist && (
          <p className="mt-6 text-center text-sm text-primary-600 dark:text-primary-400">
            Are you a buyer?{' '}
            <Link to="/login" className="font-medium text-accent-600 hover:text-accent-700 dark:text-accent-400">
              Buyer login
            </Link>
          </p>
        )}
      </div>

      {!isArtist && (
        <p className="mt-6 text-center text-sm text-primary-600 dark:text-primary-400">
          Artists: <Link to="/login/artist" className="font-medium text-accent-600 dark:text-accent-400">Artist login</Link>
        </p>
      )}
    </div>
  );
}
