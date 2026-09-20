import { MapPin } from 'lucide-react';
import { cn } from '../../lib/utils';
import Button from '../actions/Button';

export default function LocationField({
  type = 'pickup',
  label,
  value,
  placeholder = 'Select location',
  onClick,
  disabled = false,
  className,
}) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-start gap-3 h-14 rounded-input border-neutral-200 bg-white px-3.5 text-left hover:border-green-500 font-normal shadow-none',
        className
      )}
    >
      {type === 'pickup' ? (
        <span className="flex-shrink-0 h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-100" />
      ) : (
        <MapPin size={20} className="flex-shrink-0 text-neutral-900" />
      )}
      <span className="flex flex-col min-w-0 text-left">
        {label && <span className="text-small text-neutral-500">{label}</span>}
        <span className={cn('text-body truncate', value ? 'text-neutral-900' : 'text-neutral-500')}>
          {value || placeholder}
        </span>
      </span>
    </Button>
  );
}
