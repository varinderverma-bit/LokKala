import { Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { selectCartCount } from '@/features/cart/selectors';
import { selectAuthUser, selectIsArtist, selectIsBuyer } from '@/features/auth/selectors';
import { logout } from '@/features/auth/authSlice';
import { toggleTheme } from '@/features/ui/uiSlice';

export function Navbar() {
  const dispatch = useAppDispatch();
  const cartCount = useAppSelector(selectCartCount);
  const theme = useAppSelector((s) => s.ui.theme);
  const user = useAppSelector(selectAuthUser);
  const isArtist = useAppSelector(selectIsArtist);
  const isBuyer = useAppSelector(selectIsBuyer);

  return (
    <nav className="sticky top-0 z-40 border-b border-primary-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95" role="navigation">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-xl font-bold text-primary-900 dark:text-white">Local Art</Link>
        <div className="flex items-center gap-2 sm:gap-4">
          <Link to="/explore" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">Explore</Link>
          <Link to="/submitted-art" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">Community</Link>
          {isArtist ? (
            <>
              <Link to="/add-art" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">List your art</Link>
              <Link to="/artist/sales" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">Sales</Link>
            </>
          ) : (
            <Link to="/login/artist" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">Artist login</Link>
          )}
          {isBuyer && (
            <Link to="/orders" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">My orders</Link>
          )}
          <Link to="/about" className="text-primary-700 hover:text-accent-600 dark:text-primary-300">About</Link>

          {user ? (
            <>
              <span className="hidden text-sm text-primary-600 dark:text-primary-400 sm:inline" title={user.email}>
                {user.role === 'artist' ? 'Artist' : user.email}
              </span>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400 dark:hover:text-accent-400"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-primary-700 hover:text-accent-600 dark:text-primary-300">Log in</Link>
              <Link to="/register" className="hidden text-sm text-primary-700 hover:text-accent-600 dark:text-primary-300 sm:inline">Register</Link>
            </>
          )}

          <button type="button" onClick={() => dispatch(toggleTheme())} className="rounded-lg p-2 text-primary-600 dark:text-primary-400" aria-label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <Link to="/cart" className="relative rounded-lg p-2 text-primary-600 dark:text-primary-400" aria-label={`Cart, ${cartCount} items`}>
            🛒
            {cartCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">{cartCount}</span>}
          </Link>
        </div>
      </div>
    </nav>
  );
}
