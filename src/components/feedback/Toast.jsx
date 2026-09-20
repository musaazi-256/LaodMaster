import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cx } from '../../lib/cx';

const VARIANTS = {
  success: { icon: CheckCircle2, iconClass: 'text-green-500' },
  error: { icon: AlertCircle, iconClass: 'text-red-500' },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-500' },
  info: { icon: Info, iconClass: 'text-blue-500' },
};

export default function Toast({ variant = 'info', message, onClose, className }) {
  const { icon: Icon, iconClass } = VARIANTS[variant];

  return (
    <div
      role="status"
      className={cx(
        'flex items-center gap-2.5 rounded-card bg-neutral-900 text-white shadow-3 px-4 py-3.5 min-w-[280px] max-w-sm',
        className
      )}
    >
      <Icon size={18} className={iconClass} />
      <span className="flex-1 text-body-sm">{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="text-neutral-500 hover:text-white">
          <X size={16} />
        </button>
      )}
    </div>
  );
}
