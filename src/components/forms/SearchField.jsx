import { Search, X } from 'lucide-react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

export default function SearchField({
  placeholder = 'Search',
  value,
  onChange,
  onClear,
  disabled = false,
  className,
  ...props
}) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search size={18} className="absolute left-3.5 text-neutral-400 z-10 pointer-events-none" />
      <Input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn('pl-10', value && onClear && 'pr-9')}
        {...props}
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute right-3 text-neutral-400 hover:text-neutral-700 z-10 p-1"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
