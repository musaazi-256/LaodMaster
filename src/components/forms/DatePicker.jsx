import { Calendar } from 'lucide-react';
import { cx } from '../../lib/cx';

export default function DatePicker({
  label,
  value,
  onChange,
  error,
  disabled = false,
  className,
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={inputId} className="text-label text-neutral-900">
          {label}
        </label>
      )}
      <div className="relative">
        <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
        <input
          id={inputId}
          type="date"
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={cx(
            'w-full h-12 rounded-input border bg-white pl-10 pr-3.5 text-body text-neutral-900 outline-none transition-colors duration-fast focus:border-green-500 focus:ring-2 focus:ring-green-500/20',
            error ? 'border-red-500' : 'border-neutral-200',
            disabled && 'bg-neutral-50 text-neutral-500 cursor-not-allowed'
          )}
          {...props}
        />
      </div>
      {error && <span className="text-small text-red-500">{error}</span>}
    </div>
  );
}
