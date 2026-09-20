import { Checkbox as ShadcnCheckbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';

export default function Checkbox({ label, checked, onChange, disabled = false, className, id }) {
  const checkboxId = id || (typeof label === 'string' ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={cn('inline-flex items-center gap-2.5 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <ShadcnCheckbox
        id={checkboxId}
        checked={checked}
        onCheckedChange={(val) => onChange && onChange({ target: { checked: Boolean(val) } })}
        disabled={disabled}
      />
      {label && (
        <label htmlFor={checkboxId} className="text-body text-neutral-900 cursor-pointer select-none">
          {label}
        </label>
      )}
    </div>
  );
}
