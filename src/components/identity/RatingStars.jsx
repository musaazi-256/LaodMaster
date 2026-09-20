import { Star } from 'lucide-react';
import { cx } from '../../lib/cx';

export default function RatingStars({ rating = 0, count, size = 14, showValue = true, className }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-body-sm text-neutral-600', className)}>
      <Star size={size} className="text-amber-500 fill-amber-500" />
      {showValue && <span className="font-medium text-neutral-900">{rating.toFixed(1)}</span>}
      {count != null && <span className="text-neutral-500">· {count} trips</span>}
    </span>
  );
}
