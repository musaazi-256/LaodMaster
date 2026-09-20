import { X } from 'lucide-react';
import { cx } from '../../lib/cx';
import IconButton from '../actions/IconButton';

export default function BottomSheet({ open, onClose, title, children, className }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-neutral-900/40" onClick={onClose} />
      <div
        className={cx(
          'relative w-full max-w-md bg-white rounded-t-[24px] shadow-3 px-5 pt-3 pb-6 max-h-[85vh] overflow-y-auto',
          'animate-[slideUp_225ms_ease-out]',
          className
        )}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-neutral-200" />
        {(title || onClose) && (
          <div className="flex items-center justify-between mb-3">
            {title && <h2 className="text-h4 text-neutral-900">{title}</h2>}
            {onClose && <IconButton icon={X} label="Close" variant="ghost" size="sm" onClick={onClose} />}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
