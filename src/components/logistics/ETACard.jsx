import { Clock, Navigation } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export default function ETACard({ etaMinutes, distanceKm, label = 'Arriving in', className }) {
  return (
    <Card className={cn('flex items-center gap-4 border border-neutral-200 bg-white px-4 py-3.5', className)}>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50 text-green-700 flex-shrink-0">
        <Clock size={18} />
      </span>
      <div className="flex flex-col">
        <span className="text-small text-neutral-500">{label}</span>
        <span className="text-h4 text-neutral-900">{etaMinutes} min</span>
      </div>
      {distanceKm != null && (
        <span className="flex items-center gap-1 text-body-sm text-neutral-500 ml-auto">
          <Navigation size={14} />
          {distanceKm} km
        </span>
      )}
    </Card>
  );
}
