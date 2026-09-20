import { useNavigate, useParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import PaymentStatusBadge from '../../components/payments/PaymentStatusBadge';
import { formatUGX } from '../../lib/format';
import Button from '../../components/actions/Button';
import ErrorState from '../../components/feedback/ErrorState';

export default function TransactionDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { customer } = useAppState();
  const txn = customer.transactions.find((t) => t.id === id);

  if (!txn) {
    return (
      <ScreenFrame title="Transaction" onBack={() => navigate(-1)}>
        <ErrorState title="Transaction not found" />
      </ScreenFrame>
    );
  }

  const isCredit = txn.direction === 'credit';

  return (
    <ScreenFrame
      title="Transaction details"
      onBack={() => navigate(-1)}
      footer={txn.status === 'failed' ? <Button size="lg" fullWidth onClick={() => navigate('/customer/wallet/payment-failed')}>Retry payment</Button> : null}
    >
      <div className="flex flex-col items-center text-center gap-3 py-6">
        <span className={`flex h-14 w-14 items-center justify-center rounded-pill ${isCredit ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}>
          {isCredit ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
        </span>
        <p className="text-h2 text-neutral-900">
          {isCredit ? '+' : '-'}
          {formatUGX(txn.amount)}
        </p>
        <PaymentStatusBadge status={txn.status} />
      </div>

      <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-body-sm text-neutral-500">Description</span>
          <span className="text-body-sm text-neutral-900">{txn.title}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-body-sm text-neutral-500">Date & method</span>
          <span className="text-body-sm text-neutral-900">{txn.subtitle}</span>
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-body-sm text-neutral-500">Reference</span>
          <span className="text-body-sm text-neutral-900 font-mono">{txn.id.toUpperCase()}</span>
        </div>
      </div>
    </ScreenFrame>
  );
}
