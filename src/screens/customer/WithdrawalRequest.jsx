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

// Simulated payout rail (no real bank/mobile-money settlement) — the debit itself is a
// real, persisted transaction against the customer's real wallet balance.
export default function WithdrawalRequest() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { customer } = useAppState();
  const payoutMethods = customer.paymentMethods.filter((m) => m.type !== 'card');
  const [amount, setAmount] = useState('');
  const [methodId, setMethodId] = useState(payoutMethods.find((m) => m.isDefault)?.id ?? payoutMethods[0]?.id ?? null);
  const [submitting, setSubmitting] = useState(false);

  const numericAmount = Number(amount) || 0;
  const canSubmit = numericAmount > 0 && numericAmount <= customer.wallet && !!methodId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    const method = payoutMethods.find((m) => m.id === methodId);
    await customer.withdraw(numericAmount, method?.label ?? 'Mobile Money');
    setSubmitting(false);
    showToast(`Withdrawal of ${formatUGX(numericAmount)} requested`, 'success');
    navigate('/customer/wallet');
  }

  return (
    <ScreenFrame
      title="Withdraw funds"
      onBack={() => navigate(-1)}
      footer={
        <Button type="submit" form="withdraw-form" size="lg" fullWidth disabled={!canSubmit} loading={submitting}>
          Withdraw {numericAmount > 0 ? formatUGX(numericAmount) : ''}
        </Button>
      }
    >
      <form id="withdraw-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-body-sm text-neutral-500">Available balance: {formatUGX(customer.wallet)}</p>

        <TextField
          label="Amount (UGX)"
          placeholder="e.g. 20000"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
          error={numericAmount > customer.wallet ? 'Amount exceeds your wallet balance' : undefined}
        />

        <div>
          <p className="text-label text-neutral-900 mb-2.5">Withdraw to</p>
          {payoutMethods.length > 0 ? (
            <PaymentMethodSelector methods={payoutMethods} selectedId={methodId} onSelect={setMethodId} />
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-body-sm text-neutral-500">
                Add a Mobile Money number or bank account to withdraw to — cards can't receive withdrawals.
              </p>
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
