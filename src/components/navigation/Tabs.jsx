import { Tabs as ShadcnTabs, TabsList, TabsTrigger } from '../ui/tabs';
import { cn } from '../../lib/utils';

export default function Tabs({ items = [], value, onChange, variant = 'underline', className }) {
  if (variant === 'pill') {
    return (
      <ShadcnTabs value={value} onValueChange={(val) => onChange?.(val)} className={cn('w-full', className)}>
        <TabsList className="w-full flex">
          {items.map((item) => (
            <TabsTrigger key={item.value} value={item.value} className="flex-1">
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </ShadcnTabs>
    );
  }

  return (
    <div className={cn('flex items-center gap-5 border-b border-neutral-200', className)}>
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange?.(item.value)}
            className={cn(
              'text-label transition-colors duration-fast pb-2.5 border-b-2 -mb-px font-semibold',
              isActive
                ? 'border-green-500 text-green-700 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
