import { MapPin, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatUGX } from '../../lib/format';
import { getTruckTier } from '../../mock-data/truckTiers';
import Button from '../actions/Button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const STATUS_STYLES = {
  requested: { label: 'Requested', variant: 'secondary' },
  accepted: { label: 'Accepted', variant: 'info' },
  'en-route': { label: 'En route', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

export default function TripCard({
  trip,
  surface = 'mobile',
  status = 'requested',
  density = 'standard',
  role = 'customer',
  onClick,
  onAction,
  actionLabel,
}) {
  const tier = getTruckTier(trip.truckTierId);
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.requested;
  const counterpart = role === 'customer' ? trip.driverName : trip.customerName;

  return (
    <Card
      onClick={onClick}
      className={cn(
        'transition-colors duration-fast border-neutral-200 bg-white',
        onClick && 'cursor-pointer hover:border-green-500/40',
        surface === 'desktop' ? 'p-4' : density === 'compact' ? 'p-3' : 'p-4',
        surface === 'desktop' && 'flex items-center justify-between gap-4'
      )}
    >
      <div className={cn('flex flex-col gap-2', surface === 'desktop' && 'flex-1 min-w-0')}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-label text-neutral-900 min-w-0 truncate">
            <MapPin size={14} className="text-green-500 flex-shrink-0" />
            {trip.origin}
            <ChevronRight size={13} className="text-neutral-500 flex-shrink-0" />
            {trip.destination}
          </span>
          {surface !== 'desktop' && (
            <Badge variant={statusStyle.variant} className="flex-shrink-0">
              {statusStyle.label}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-small text-neutral-500">
          {tier && <span>{tier.name} Truck</span>}
          {counterpart && (
            <>
              <span>·</span>
              <span>{counterpart}</span>
            </>
          )}
          {trip.date && (
            <>
              <span>·</span>
              <span>{trip.date}</span>
            </>
          )}
        </div>
      </div>

      <div className={cn('flex items-center justify-between', surface === 'desktop' ? 'flex-shrink-0 gap-4' : 'mt-3')}>
        <span className="text-h4 text-neutral-900">{formatUGX(trip.fare)}</span>
        {surface === 'desktop' && (
          <Badge variant={statusStyle.variant}>
            {statusStyle.label}
          </Badge>
        )}
        {onAction && (
          <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); onAction(); }}>
            {actionLabel || 'Track Trip'}
          </Button>
        )}
      </div>
    </Card>
  );
}
