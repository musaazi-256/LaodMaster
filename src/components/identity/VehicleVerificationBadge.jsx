import { BadgeCheck, Clock, TriangleAlert } from 'lucide-react';
import { Badge } from '../ui/badge';

const STATUS = {
  verified: { icon: BadgeCheck, label: 'Vehicle verified', variant: 'success' },
  pending: { icon: Clock, label: 'Pending review', variant: 'warning' },
  unverified: { icon: TriangleAlert, label: 'Not registered', variant: 'secondary' },
};

export default function VehicleVerificationBadge({ status = 'verified', className }) {
  const { icon: Icon, label, variant } = STATUS[status] || STATUS.verified;

  return (
    <Badge variant={variant} className={className}>
      <Icon size={13} className="mr-1" />
      {label}
    </Badge>
  );
}
