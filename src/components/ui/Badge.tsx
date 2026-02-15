import { cn } from '@/utils/cn';

const variantClasses: Record<string, string> = {
  default: 'bg-primary-200 text-primary-800 dark:bg-primary-700 dark:text-primary-200',
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

export function Badge({ className, variant = 'default', ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variantClasses }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', variantClasses[variant], className)} {...props} />;
}
