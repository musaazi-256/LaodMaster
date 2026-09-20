import { Loader2 } from 'lucide-react';
import { Button as ShadcnButton } from '../ui/button';
import { cn } from '../../lib/utils';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  className,
  ...props
}) {
  const isDisabled = disabled || loading;

  const variantMap = {
    primary: 'default',
    secondary: 'outline',
    tertiary: 'ghost',
    danger: 'destructive',
  };

  const shadcnVariant = variantMap[variant] || variant;

  return (
    <ShadcnButton
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      variant={shadcnVariant}
      size={size}
      className={cn(fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 16} />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} />}
        </>
      )}
    </ShadcnButton>
  );
}
