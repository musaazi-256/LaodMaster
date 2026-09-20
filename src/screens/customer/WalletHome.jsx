import { useNavigate } from 'react-router-dom';
import { ArrowDownToLine, ArrowUpFromLine, Plus, Smartphone, CreditCard, Landmark, Wallet, History } from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { CUSTOMER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import { formatUGX } from '../../lib/format';
import TransactionRow from '../../components/payments/TransactionRow';

const METHOD_ICONS = { momo: Smartphone, card: CreditCard, bank: Landmark, wallet: Wallet };

function Header() {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-h3 text-neutral-900">Wallet</p>
    </div>
  );
}

export default function WalletHome() {
  const navigate = useNavigate();
  const { customer } = useAppState();

  return (
    <TabScreen header={<Header />} navItems={CUSTOMER_NAV_ITEMS}>
      <div className="flex flex-col gap-5">
        <div className="rounded-card bg-green-700 text-white p-5 flex flex-col gap-4">
          <span className="text-body-sm text-green-100">Wallet balance</span>
          <span className="text-h1">{formatUGX(customer.wallet)}</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => navigate('/customer/wallet/deposit')}
              className="inline-flex items-center justify-center gap-1.5 rounded-button bg-white text-green-700 hover:bg-green-50 transition-colors duration-fast h-9 px-3 text-label font-medium"
            >
              <ArrowDownToLine size={14} /> Deposit
            </button>
            <button
              type="button"
              onClick={() => navigate('/customer/wallet/withdraw')}
              className="inline-flex items-center justify-center gap-1.5 rounded-button border border-white/30 bg-white/10 text-white hover:bg-white/20 transition-colors duration-fast h-9 px-3 text-label"
            >
              <ArrowUpFromLine size={14} /> Withdraw
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => navigate('/customer/wallet/add-method')}
            className="flex flex-col items-start gap-2 rounded-card border border-neutral-200 bg-white p-3.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-green-50 text-green-700">
              <Plus size={16} />
            </span>
            <span className="text-body-sm text-neutral-900">Add payment method</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/customer/wallet/transactions')}
            className="flex flex-col items-start gap-2 rounded-card border border-neutral-200 bg-white p-3.5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-neutral-100 text-neutral-600">
              <History size={16} />
            </span>
            <span className="text-body-sm text-neutral-900">Transaction history</span>
          </button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-label text-neutral-900">Payment methods</p>
          </div>
          {customer.paymentMethods.length > 0 ? (
            <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
              {customer.paymentMethods.map((m) => {
                const Icon = METHOD_ICONS[m.type] || Wallet;
                return (
                <div key={m.id} className="flex items-center gap-3 px-3.5 py-3">
                  <Icon size={16} className="text-neutral-500" />
                  <span className="flex flex-col min-w-0 flex-1">
                    <span className="text-body-sm text-neutral-900 truncate">{m.label}</span>
                    <span className="text-small text-neutral-500 truncate">{m.detail}</span>
                  </span>
                  {m.isDefault && <span className="text-small font-medium text-green-700 bg-green-100 rounded-pill px-2 py-0.5">Default</span>}
                </div>
                );
              })}
            </div>
          ) : (
            <p className="text-body-sm text-neutral-500 rounded-card border border-dashed border-neutral-200 p-3.5">
              No payment methods saved yet.
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-label text-neutral-900">Recent activity</p>
            <button type="button" onClick={() => navigate('/customer/wallet/transactions')} className="text-body-sm text-green-700 font-medium">
              See all
            </button>
          </div>
          <div className="flex flex-col divide-y divide-neutral-200">
            {customer.transactions.slice(0, 3).map((t) => (
              <TransactionRow key={t.id} {...t} onClick={() => navigate(`/customer/wallet/transactions/${t.id}`)} />
            ))}
          </div>
        </div>
      </div>
    </TabScreen>
  );
}
