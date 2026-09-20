import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from '../../lib/cx';
import IconButton from '../actions/IconButton';

export default function Pagination({ page = 1, totalPages = 1, onPageChange, className }) {
  return (
    <div className={cx('flex items-center justify-between', className)}>
      <span className="text-body-sm text-neutral-500">
        Page {page} of {totalPages}
      </span>
      <div className="flex items-center gap-1.5">
        <IconButton
          icon={ChevronLeft}
          label="Previous page"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
        />
        <IconButton
          icon={ChevronRight}
          label="Next page"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange?.(page + 1)}
        />
      </div>
    </div>
  );
}
