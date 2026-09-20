import { cn } from '../../lib/utils';
import { RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

export default function Radio({ label, checked, onChange, disabled = false, name, className, id, value }) {
  const inputId = id || `radio-${name || 'opt'}-${value || label}`;

  return (
    <div className={cn('inline-flex items-center gap-2.5 cursor-pointer', disabled && 'cursor-not-allowed opacity-50', className)}>
      <RadioGroupItem
        id={inputId}
        value={value || String(checked)}
        checked={checked}
        onClick={() => onChange?.({ target: { checked: !checked, value } })}
        disabled={disabled}
      />
      {label && (
        <Label htmlFor={inputId} className="text-body text-neutral-900 cursor-pointer">
          {label}
        </Label>
      )}
    </div>
  );
}
