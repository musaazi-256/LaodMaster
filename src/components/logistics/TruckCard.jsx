import { Check, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatUGX } from '../../lib/format';
import { TRUCK_ILLUSTRATIONS } from '../../assets/trucks';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

export default function TruckCard({
  tier,
  selected = false,
  disabled = false,
  recommended = false,
  estimatedFare,
  onSelect,
  density = 'standard',
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={disabled ? undefined : onSelect}
      className={cn(
        'w-full flex items-center gap-3 border-2 bg-white text-left transition-colors duration-fast cursor-pointer',
        density === 'compact' ? 'p-2.5' : 'p-3.5',
        selected ? 'border-green-500 bg-green-50' : 'border-neutral-200 hover:border-neutral-500/40',
        disabled && 'opacity-40 cursor-not-allowed hover:border-neutral-200'
      )}
    >
      <img
        src={TRUCK_ILLUSTRATIONS[tier.id]}
        alt={tier.name}
        className={cn('flex-shrink-0', density === 'compact' ? 'h-12 w-12' : 'h-16 w-16')}
      />
      <span className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="flex items-center gap-1.5">
          <span className="text-label text-neutral-900">{tier.name}</span>
          {recommended && (
            <Badge variant="success" className="gap-0.5 px-1.5 py-0.5 text-small">
              <Star size={10} className="fill-current" /> Recommended
            </Badge>
          )}
        </span>
        <span className="text-small text-neutral-500">{tier.tonnageRange}</span>
        {density !== 'compact' && <span className="text-small text-neutral-500">{tier.description}</span>}
      </span>
      <span className="flex flex-col items-end gap-1.5 flex-shrink-0">
        {estimatedFare != null && <span className="text-label text-neutral-900">{formatUGX(estimatedFare)}</span>}
        <span
          className={cn(
            'flex h-5 w-5 items-center justify-center rounded-full border-2',
            selected ? 'border-green-500 bg-green-500' : 'border-neutral-200'
          )}
        >
          {selected && <Check size={12} className="text-white" strokeWidth={3} />}
        </span>
      </span>
    </Card>
  );
}
