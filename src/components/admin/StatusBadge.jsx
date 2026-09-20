import { Badge as ShadcnBadge } from '../ui/badge';

const toneToVariant = {
  success: 'success',
  warning: 'warning',
  danger: 'destructive',
  info: 'info',
  neutral: 'secondary',
};

export default function StatusBadge({ label, tone = 'neutral', className }) {
  return (
    <ShadcnBadge variant={toneToVariant[tone] || 'secondary'} className={className}>
      {label}
    </ShadcnBadge>
  );
}
