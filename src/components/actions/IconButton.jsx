import { Button as ShadcnButton } from '../ui/button';
import { cn } from '../../lib/utils';

const VARIANT_MAP = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
};

const SIZE_CLASSES = {
  sm: 'h-8 w-8 rounded-pill p-0',
  md: 'h-10 w-10 rounded-pill p-0',
  lg: 'h-12 w-12 rounded-pill p-0',
};

const ICON_SIZE = { sm: 14, md: 18, lg: 20 };

export default function IconButton({
  icon: Icon,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className,
  ...props
}) {
  return (
    <ShadcnButton
      type="button"
      aria-label={label}
      disabled={disabled}
      variant={VARIANT_MAP[variant] || 'outline'}
      className={cn(SIZE_CLASSES[size], className)}
      {...props}
    >
      <Icon size={ICON_SIZE[size]} />
    </ShadcnButton>
  );
}
