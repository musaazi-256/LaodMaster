import { useNavigate } from 'react-router-dom';
import { History, ArrowDownToLine } from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { DRIVER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import WalletCard from '../../components/payments/WalletCard';
import TransactionRow from '../../components/payments/TransactionRow';
import { formatUGX } from '../../lib/format';

function Header() {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-h3 text-neutral-900">Earnings</p>
    </div>
  );
}

export default function EarningsSummary() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  if (!driver.profile) return null;

  return (
    <TabScreen header={<Header />} navItems={DRIVER_NAV_ITEMS}>
      <div className="flex flex-col gap-5">
        <WalletCard balance={driver.profile.walletBalance} onTopUp={() => navigate('/driver/earnings/withdraw')} />

        <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-label text-neutral-900">Cash due</p>
            <p className="text-small text-neutral-500">From cash-paid trips</p>
          </div>
          <div className="text-right">
            <p className="text-h4 text-neutral-900">{formatUGX(driver.profile.cashDue)}</p>
            <button type="button" onClick={() => navigate('/driver/earnings/cash-due')} className="text-small text-green-700 font-medium">
              View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/driver/earnings/withdraw')}
            className="flex flex-col items-start gap-2 rounded-card border border-neutral-200 bg-white p-3.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-green-50 text-green-700">
              <ArrowDownToLine size={16} />
            </span>
            <span className="text-body-sm text-neutral-900">Withdraw funds</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/driver/earnings/transactions')}
            className="flex flex-col items-start gap-2 rounded-card border border-neutral-200 bg-white p-3.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-neutral-100 text-neutral-600">
              <History size={16} />
            </span>
            <span className="text-body-sm text-neutral-900">Transaction history</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-label text-neutral-900">Recent earnings</p>
            <button type="button" onClick={() => navigate('/driver/earnings/transactions')} className="text-body-sm text-green-700 font-medium">
              See all
            </button>
          </div>
          <div className="flex flex-col divide-y divide-neutral-200">
            {driver.transactions.slice(0, 3).map((t) => (
              <TransactionRow key={t.id} {...t} />
            ))}
          </div>
        </div>
      </div>
    </TabScreen>
  );
}
