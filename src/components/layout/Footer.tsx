import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-primary-200 bg-primary-50 dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-5">
          <div className="md:col-span-2">
            <h3 className="font-display text-lg font-bold text-primary-900 dark:text-white">Local Art Marketplace</h3>
            <p className="mt-2 max-w-md text-sm text-primary-600 dark:text-primary-400">Discover art with a story. Direct from artists to buyers.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary-900 dark:text-white">Shop</h4>
            <ul className="mt-4 space-y-2">
              <li><Link to="/explore" className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400">Explore</Link></li>
              <li><Link to="/cart" className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400">Cart</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary-900 dark:text-white">Create</h4>
            <ul className="mt-4 space-y-2">
              <li><Link to="/add-art" className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400">List your art</Link></li>
              <li><Link to="/submitted-art" className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400">Community art</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary-900 dark:text-white">Company</h4>
            <ul className="mt-4 space-y-2">
              <li><Link to="/about" className="text-sm text-primary-600 hover:text-accent-600 dark:text-primary-400">About</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-8 border-t border-primary-200 pt-8 text-center text-sm text-primary-500 dark:border-gray-800 dark:text-primary-400">
          © {new Date().getFullYear()} Local Art Marketplace
        </p>
      </div>
    </footer>
  );
}
