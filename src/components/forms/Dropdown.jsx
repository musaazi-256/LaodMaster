import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export default function Dropdown({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Select',
  error,
  disabled = false,
  className,
  id,
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  function handleValueChange(val) {
    if (onChange) {
      onChange({ target: { value: val } });
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={selectId} className="text-label text-neutral-900 font-medium">
          {label}
        </Label>
      )}
      <Select value={value || ''} onValueChange={handleValueChange} disabled={disabled}>
        <SelectTrigger id={selectId} className={cn(error && 'border-red-500 focus:ring-red-500')}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <span className="text-small text-red-500">{error}</span>}
    </div>
  );
}
