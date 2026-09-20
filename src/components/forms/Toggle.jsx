import { Switch as ShadcnSwitch } from '../ui/switch';
import { cn } from '../../lib/utils';

export default function Toggle({ label, checked, onChange, disabled = false, className, id }) {
  const switchId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('inline-flex items-center gap-3 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      {label && (
        <label htmlFor={switchId} className="text-body text-neutral-900 cursor-pointer select-none">
          {label}
        </label>
      )}
      <ShadcnSwitch
        id={switchId}
        checked={checked}
        onCheckedChange={(val) => onChange && onChange(val)}
        disabled={disabled}
      />
    </div>
  );
}
