import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TransactionRow from '../../components/payments/TransactionRow';
import EmptyState from '../../components/feedback/EmptyState';

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { customer } = useAppState();

  return (
    <ScreenFrame title="Transaction history" onBack={() => navigate(-1)}>
      {customer.transactions.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200">
          {customer.transactions.map((t) => (
            <TransactionRow key={t.id} {...t} onClick={() => navigate(`/customer/wallet/transactions/${t.id}`)} />
          ))}
        </div>
      )}
    </ScreenFrame>
  );
}
