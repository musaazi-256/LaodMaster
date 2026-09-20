import { LocateFixed, MapPin, Clock } from 'lucide-react';
import { cx } from '../../lib/cx';
import SearchField from '../forms/SearchField';

export default function LocationPicker({
  searchValue,
  onSearchChange,
  suggestions = [],
  recentLocations = [],
  onSelectLocation,
  onUseCurrentLocation,
  className,
}) {
  const showSuggestions = searchValue?.length > 0;

  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <SearchField
        placeholder="Search for a location"
        value={searchValue}
        onChange={(e) => onSearchChange?.(e.target.value)}
        onClear={() => onSearchChange?.('')}
        autoFocus
      />

      <button
        type="button"
        onClick={onUseCurrentLocation}
        className="flex items-center gap-3 py-3.5 text-left border-b border-neutral-200"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-green-50 text-green-700 flex-shrink-0">
          <LocateFixed size={16} />
        </span>
        <span className="text-label text-green-700">Use current location</span>
      </button>

      <div className="flex-1 overflow-y-auto">
        {showSuggestions
          ? suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectLocation?.(s)}
                className="w-full flex items-center gap-3 py-3 text-left hover:bg-neutral-50 rounded-[8px] px-1"
              >
                <MapPin size={18} className="text-neutral-500 flex-shrink-0" />
                <span className="flex flex-col min-w-0">
                  <span className="text-body text-neutral-900 truncate">{s.label}</span>
                  {s.subtitle && <span className="text-small text-neutral-500 truncate">{s.subtitle}</span>}
                </span>
              </button>
            ))
          : recentLocations.length > 0 && (
              <>
                <span className="block pt-4 pb-1 text-small font-medium uppercase tracking-wide text-neutral-500">
                  Recent
                </span>
                {recentLocations.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectLocation?.(s)}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-neutral-50 rounded-[8px] px-1"
                  >
                    <Clock size={18} className="text-neutral-500 flex-shrink-0" />
                    <span className="flex flex-col min-w-0">
                      <span className="text-body text-neutral-900 truncate">{s.label}</span>
                      {s.subtitle && <span className="text-small text-neutral-500 truncate">{s.subtitle}</span>}
                    </span>
                  </button>
                ))}
              </>
            )}
      </div>
    </div>
  );
}
