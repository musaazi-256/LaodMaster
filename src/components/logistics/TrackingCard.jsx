import { Phone, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Avatar from '../identity/Avatar';
import RatingStars from '../identity/RatingStars';
import IconButton from '../actions/IconButton';
import { Card } from '../ui/card';

export default function TrackingCard({ driver, statusText, etaMinutes, distanceKm, onCall, onChat, className }) {
  return (
    <Card className={cn('bg-white border border-neutral-200 shadow-2 p-4 flex flex-col gap-4', className)}>
      <div className="flex flex-col gap-0.5">
        <span className="text-h4 text-neutral-900">{statusText}</span>
        {(etaMinutes != null || distanceKm != null) && (
          <span className="text-body-sm text-neutral-500">
            {etaMinutes != null && `${etaMinutes} min`}
            {etaMinutes != null && distanceKm != null && ' · '}
            {distanceKm != null && `${distanceKm} km`}
          </span>
        )}
      </div>

      {driver && (
        <div className="flex items-center gap-3">
          <Avatar src={driver.photo} name={driver.name} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label text-neutral-900 truncate">{driver.name}</span>
            <RatingStars rating={driver.rating} count={driver.tripCount} />
            <span className="text-small text-neutral-500 truncate">
              {driver.vehicleModel} · {driver.plateNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <IconButton icon={Phone} label="Call driver" variant="secondary" onClick={onCall} />
            <IconButton icon={MessageCircle} label="Chat with driver" variant="secondary" onClick={onChat} />
          </div>
        </div>
      )}
    </Card>
  );
}
