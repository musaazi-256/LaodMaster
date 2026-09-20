import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TextField from '../../components/forms/TextField';
import PaymentMethodSelector from '../../components/payments/PaymentMethodSelector';
import Button from '../../components/actions/Button';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';
import { cx } from '../../lib/cx';

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

export default function DepositScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { customer } = useAppState();
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState(customer.paymentMethods.find((m) => m.isDefault)?.id ?? customer.paymentMethods[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);

  const numericAmount = Number(amount) || 0;
  const canSubmit = numericAmount > 0 && !!methodId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const method = customer.paymentMethods.find((m) => m.id === methodId);
    await customer.topUpWallet(numericAmount, method?.label ?? 'Mobile Money');
    setSubmitting(false);
    showToast(`${formatUGX(numericAmount)} added to your wallet`, 'success');
    navigate('/customer/wallet');
  }

  return (
    <ScreenFrame
      title="Deposit funds"
      onBack={() => navigate(-1)}
      footer={
        <Button type="submit" form="deposit-form" size="lg" fullWidth disabled={!canSubmit} loading={submitting}>
          Deposit {numericAmount > 0 ? formatUGX(numericAmount) : ''}
        </Button>
      }
    >
      <form id="deposit-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-body-sm text-neutral-500">Current balance: {formatUGX(customer.wallet)}</p>

        <TextField
          label="Amount (UGX)"
          placeholder="e.g. 50000"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
        />

        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((qa) => (
            <button
              key={qa}
              type="button"
              onClick={() => setAmount(String(qa))}
              className={cx(
                'rounded-pill px-3.5 py-1.5 text-label border transition-colors duration-fast',
                Number(amount) === qa ? 'bg-green-500 border-green-500 text-white' : 'border-neutral-200 text-neutral-700 hover:border-green-500'
              )}
            >
              {formatUGX(qa)}
            </button>
          ))}
        </div>

        <div>
          <p className="text-label text-neutral-900 mb-2.5">Deposit from</p>
          {customer.paymentMethods.length > 0 ? (
            <PaymentMethodSelector methods={customer.paymentMethods} selectedId={methodId} onSelect={setMethodId} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-neutral-500">You don't have a payment method saved yet.</p>
              <Button variant="secondary" icon={Plus} onClick={() => navigate('/customer/wallet/add-method')} className="self-start">
                Add payment method
              </Button>
            </div>
          )}
        </div>
      </form>
    </ScreenFrame>
  );
}
