import { ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { Badge } from '../ui/badge';

const STATUS = {
  verified: { icon: ShieldCheck, label: 'Verified driver', variant: 'success' },
  pending: { icon: Clock, label: 'Pending verification', variant: 'warning' },
  unverified: { icon: ShieldAlert, label: 'Unverified', variant: 'secondary' },
};

export default function DriverVerificationBadge({ status = 'verified', className }) {
  const { icon: Icon, label, variant } = STATUS[status] || STATUS.verified;

  return (
    <Badge variant={variant} className={className}>
      <Icon size={13} className="mr-1" />
      {label}
    </Badge>
  );
}
