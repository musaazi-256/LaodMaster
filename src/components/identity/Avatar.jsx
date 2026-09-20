import { User } from 'lucide-react';
import { Avatar as ShadcnAvatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { cn } from '../../lib/utils';

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-small',
  md: 'h-11 w-11 text-label',
  lg: 'h-16 w-16 text-h4',
};

export default function Avatar({ src, name, size = 'md', className }) {
  const initials = name
    ?.split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ShadcnAvatar className={cn(SIZE_CLASSES[size], className)}>
      {src && <AvatarImage src={src} alt={name || 'Avatar'} />}
      <AvatarFallback>
        {initials || <User size={size === 'sm' ? 14 : size === 'lg' ? 26 : 18} />}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}
