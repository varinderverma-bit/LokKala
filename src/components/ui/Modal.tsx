import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export function Modal({ isOpen, onClose, title, children, className }: { isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode; className?: string }) {
  const onEscape = useCallback((e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }, [onClose]);
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', onEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onEscape]);
  if (!isOpen) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className={cn('relative z-10 w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-xl', className)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">×</button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}
