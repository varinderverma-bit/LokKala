import { forwardRef } from 'react';
import { cn } from '@/utils/cn';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }>(
  ({ className, label, error, id: idProp, ...props }, ref) => {
    const id = idProp ?? `input-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border px-4 py-2 bg-white dark:bg-gray-900 border-primary-300 dark:border-gray-600 focus:ring-2 focus:ring-accent-500 focus:outline-none',
            error && 'border-red-500',
            className
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
