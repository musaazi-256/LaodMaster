import { RotateCcw } from 'lucide-react';
import { formatUGX } from '../../lib/format';
import PaymentStatusBadge from './PaymentStatusBadge';
import Button from '../actions/Button';
import { Card } from '../ui/card';

export default function RefundCard({ amount, reason, status = 'pending', onAction, actionLabel }) {
  return (
    <Card className="border border-neutral-200 bg-white p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-label text-neutral-900">
          <RotateCcw size={16} className="text-blue-500" />
          Refund
        </span>
        <PaymentStatusBadge status={status} />
      </div>
      <span className="text-h3 text-neutral-900">{formatUGX(amount)}</span>
      {reason && <p className="text-body-sm text-neutral-500">{reason}</p>}
      {onAction && (
        <Button variant="secondary" size="sm" onClick={onAction} className="self-start">
          {actionLabel || 'Process refund'}
        </Button>
      )}
    </Card>
  );
}
