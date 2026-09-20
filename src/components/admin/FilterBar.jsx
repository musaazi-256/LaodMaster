import { SlidersHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import SearchField from '../forms/SearchField';
import Button from '../actions/Button';

export default function FilterBar({ searchValue, onSearchChange, filters = [], onFilterChange, onOpenFilters, className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2.5', className)}>
      <SearchField
        placeholder="Search"
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onClear={() => onSearchChange?.('')}
        className="max-w-xs h-10"
      />
      {filters.map((filter) => (
        <select
          key={filter.id}
          value={filter.value ?? ''}
          onChange={(e) => onFilterChange?.(filter.id, e.target.value)}
          className="h-10 rounded-input border border-neutral-200 bg-white px-3 text-body-sm text-neutral-900 outline-none focus:border-green-500"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
      {onOpenFilters && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenFilters}
          className="h-10 px-3 text-neutral-600 border-neutral-200 hover:bg-neutral-50"
        >
          <SlidersHorizontal size={14} className="mr-1.5" /> Filters
        </Button>
      )}
    </div>
  );
}
