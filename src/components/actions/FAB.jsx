import { Button as ShadcnButton } from '../ui/button';
import { cn } from '../../lib/utils';

export default function FAB({ icon: Icon, label, className, ...props }) {
  return (
    <ShadcnButton
      type="button"
      aria-label={label}
      className={cn(
        'h-14 w-14 rounded-pill bg-green-500 hover:bg-green-700 text-white shadow-3 p-0 flex items-center justify-center',
        className
      )}
      {...props}
    >
      <Icon size={22} />
    </ShadcnButton>
  );
}
