import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Toast } from '@/components/ui/Toast';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { removeToast } from '@/features/ui/uiSlice';

export function AppShell() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((s) => s.ui.toasts);
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-primary-900 dark:bg-gray-950 dark:text-primary-100">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => <Toast key={t.id} {...t} onDismiss={(id) => dispatch(removeToast(id))} />)}
      </div>
    </div>
  );
}
