import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-xl bg-white dark:bg-gray-800 shadow-md', className)} {...props} />
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('px-4 py-3 border-b dark:border-gray-700', className)} {...props} />
);
CardHeader.displayName = 'CardHeader';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-4', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('px-4 py-3 border-t dark:border-gray-700', className)} {...props} />
);
CardFooter.displayName = 'CardFooter';
