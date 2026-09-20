import { cn } from '../../lib/utils';
import { Skeleton } from '../ui/skeleton';

export default function SkeletonLoader({ variant = 'text', width, height, className }) {
  const shapeClass = {
    text: 'h-4 rounded-[4px]',
    title: 'h-6 rounded-[4px]',
    circle: 'rounded-full',
    rect: 'rounded-card',
  }[variant];

  return (
    <Skeleton
      className={cn(shapeClass, className)}
      style={{ width, height }}
    />
  );
}
