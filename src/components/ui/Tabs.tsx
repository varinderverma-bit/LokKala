import { cn } from '@/utils/cn';

export interface Tab { id: string; label: string; content: React.ReactNode }

export function Tabs({ tabs, activeTabId, onTabChange, className }: { tabs: Tab[]; activeTabId: string; onTabChange: (id: string) => void; className?: string }) {
  return (
    <div className={cn('w-full', className)} role="tablist">
      <div className="flex border-b dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTabId === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium',
              activeTabId === tab.id ? 'border-b-2 border-accent-600 text-accent-600 dark:border-accent-500' : 'text-primary-600 dark:text-primary-400'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-4">{tabs.find((t) => t.id === activeTabId)?.content}</div>
    </div>
  );
}
