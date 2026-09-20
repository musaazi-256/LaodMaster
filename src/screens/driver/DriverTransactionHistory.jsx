import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TransactionRow from '../../components/payments/TransactionRow';
import EmptyState from '../../components/feedback/EmptyState';

export default function DriverTransactionHistory() {
  const navigate = useNavigate();
  const { driver } = useAppState();

  return (
    <ScreenFrame title="Transaction history" onBack={() => navigate(-1)}>
      {driver.transactions.length === 0 ? (
        <EmptyState title="No transactions yet" />
      ) : (
        <div className="flex flex-col divide-y divide-neutral-200">
          {driver.transactions.map((t) => (
            <TransactionRow key={t.id} {...t} />
          ))}
        </div>
      )}
    </ScreenFrame>
  );
}
