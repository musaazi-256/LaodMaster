import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { cn } from '../../lib/utils';

export default function TextField({
  label,
  helperText,
  error,
  success,
  disabled = false,
  readOnly = false,
  icon: Icon,
  rightElement,
  className,
  id,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const status = error ? 'error' : success ? 'success' : 'default';

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <Label htmlFor={inputId} className="text-label text-neutral-900 font-medium">
          {label}
        </Label>
      )}
      <div className="relative">
        {Icon && (
          <Icon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 z-10" />
        )}
        <Input
          id={inputId}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            Icon && 'pl-10',
            (rightElement || status === 'error' || status === 'success') && 'pr-10',
            status === 'error' && 'border-red-500 focus-visible:ring-red-500',
            status === 'success' && 'border-green-500 focus-visible:ring-green-500',
            readOnly && !disabled && 'bg-neutral-50 cursor-default'
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center z-10">
            {rightElement}
          </div>
        )}
        {!rightElement && status === 'error' && (
          <AlertCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 z-10" />
        )}
        {!rightElement && status === 'success' && (
          <CheckCircle2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 z-10" />
        )}
      </div>
      {(helperText || error) && (
        <span className={cn('text-small', error ? 'text-red-500' : 'text-neutral-500')}>
          {error || helperText}
        </span>
      )}
    </div>
  );
}
