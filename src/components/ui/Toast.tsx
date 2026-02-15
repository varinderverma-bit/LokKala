import { useEffect } from 'react';
import { cn } from '@/utils/cn';
import type { Toast as ToastType } from '@/features/ui/uiSlice';

const typeStyles = { success: 'bg-green-600 text-white', error: 'bg-red-600 text-white', info: 'bg-blue-600 text-white' };

export function Toast({ id, message, type, onDismiss, duration = 4000 }: ToastType & { onDismiss: (id: string) => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(t);
  }, [id, duration, onDismiss]);
  return (
    <div role="alert" className={cn('flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg', typeStyles[type])}>
      <span>{message}</span>
      <button type="button" onClick={() => onDismiss(id)} className="ml-2 rounded p-1 hover:bg-white/20" aria-label="Dismiss">×</button>
    </div>
  );
}
