import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const variants = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-600',
  secondary: 'bg-primary-200 text-primary-900 hover:bg-primary-300 dark:bg-primary-700 dark:text-primary-100',
  outline: 'border-2 border-primary-400 text-primary-800 hover:bg-primary-100 dark:border-primary-600 dark:hover:bg-primary-800',
  ghost: 'text-primary-800 hover:bg-primary-100 dark:text-primary-200 dark:hover:bg-primary-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-base', lg: 'px-6 py-3 text-lg' };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
);
Button.displayName = 'Button';
