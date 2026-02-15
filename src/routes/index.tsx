import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { ExplorePage } from '@/pages/ExplorePage';
import { ArtDetailPage } from '@/pages/ArtDetailPage';
import { ArtistPage } from '@/pages/ArtistPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderSuccessPage } from '@/pages/OrderSuccessPage';
import { AboutPage } from '@/pages/AboutPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AddArtPage } from '@/pages/AddArtPage';
import { SubmittedArtListPage } from '@/pages/SubmittedArtListPage';
import { SubmittedArtDetailPage } from '@/pages/SubmittedArtDetailPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { MyOrdersPage } from '@/pages/MyOrdersPage';
import { OrderDetailPage } from '@/pages/OrderDetailPage';
import { ArtistSalesPage } from '@/pages/ArtistSalesPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppShell />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: 'explore', element: <ExplorePage /> },
      { path: 'art/:artId', element: <ArtDetailPage /> },
      { path: 'artist/:artistId', element: <ArtistPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: 'order-success', element: <OrderSuccessPage /> },
      { path: 'orders', element: <MyOrdersPage /> },
      { path: 'orders/:orderId', element: <OrderDetailPage /> },
      { path: 'artist/sales', element: <ArtistSalesPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'login/artist', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'add-art', element: <AddArtPage /> },
      { path: 'submitted-art', element: <SubmittedArtListPage /> },
      { path: 'submitted-art/:id', element: <SubmittedArtDetailPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <Navigate to="/404" replace /> },
    ],
  },
]);

export function Routes() {
  return <RouterProvider router={router} />;
}
