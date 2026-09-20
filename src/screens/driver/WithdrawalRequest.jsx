import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TextField from '../../components/forms/TextField';
import Dropdown from '../../components/forms/Dropdown';
import Button from '../../components/actions/Button';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';

// The actual payout rail (bank/mobile-money settlement) is simulated — no real bank
// integration — but the resulting debit is a real, persisted transaction against the
// driver's real wallet balance.
export default function WithdrawalRequest() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { driver } = useAppState();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('momo');
  const [submitting, setSubmitting] = useState(false);

  if (!driver.profile) return null;

  const numericAmount = Number(amount) || 0;
  const canSubmit = numericAmount > 0 && numericAmount <= driver.profile.walletBalance;

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await driver.withdraw(numericAmount, method === 'momo' ? 'MTN Mobile Money' : 'Bank account');
    setSubmitting(false);
    showToast(`Withdrawal of ${formatUGX(numericAmount)} requested`, 'success');
    navigate('/driver/earnings');
  }

  return (
    <ScreenFrame title="Withdraw funds" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-body-sm text-neutral-500">Available balance: {formatUGX(driver.profile.walletBalance)}</p>
        <TextField label="Amount (UGX)" placeholder="e.g. 100000" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} />
        <Dropdown
          label="Withdraw to"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          options={[{ value: 'momo', label: 'MTN Mobile Money' }, { value: 'bank', label: 'Bank account' }]}
        />
        <Button type="submit" size="lg" fullWidth disabled={!canSubmit} loading={submitting}>
          Request withdrawal
        </Button>
      </form>
    </ScreenFrame>
  );
}
