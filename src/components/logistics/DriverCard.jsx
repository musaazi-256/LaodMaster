import { Phone, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import Avatar from '../identity/Avatar';
import RatingStars from '../identity/RatingStars';
import IconButton from '../actions/IconButton';
import { Card } from '../ui/card';

export default function DriverCard({ driver, showActions = true, onCall, onChat, density = 'standard', className }) {
  return (
    <Card className={cn('flex items-center gap-3 border border-neutral-200 bg-white p-4', className)}>
      <Avatar src={driver.photo} name={driver.name} size={density === 'compact' ? 'sm' : 'md'} />
      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-label text-neutral-900 truncate">{driver.name}</span>
        <RatingStars rating={driver.rating} count={driver.tripCount} />
        <span className="text-small text-neutral-500 truncate">
          {driver.vehicleModel} · {driver.plateNumber}
        </span>
      </div>
      {showActions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <IconButton icon={Phone} label="Call driver" variant="secondary" onClick={onCall} />
          <IconButton icon={MessageCircle} label="Chat with driver" variant="secondary" onClick={onChat} />
        </div>
      )}
    </Card>
  );
}
