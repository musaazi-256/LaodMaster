import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { Badge } from '../ui/badge';

const STATUS = {
  pending: { icon: Clock, label: 'Pending', variant: 'warning' },
  success: { icon: CheckCircle2, label: 'Successful', variant: 'success' },
  failed: { icon: XCircle, label: 'Failed', variant: 'destructive' },
  refunded: { icon: RotateCcw, label: 'Refunded', variant: 'info' },
};

export default function PaymentStatusBadge({ status = 'pending', className }) {
  const { icon: Icon, label, variant } = STATUS[status] || STATUS.pending;

  return (
    <Badge variant={variant} className={className}>
      <Icon size={13} className="mr-1" />
      {label}
    </Badge>
  );
}
