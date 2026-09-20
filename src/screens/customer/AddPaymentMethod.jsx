import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, CreditCard, Landmark } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import Tabs from '../../components/navigation/Tabs';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import TextField from '../../components/forms/TextField';
import Dropdown from '../../components/forms/Dropdown';
import Button from '../../components/actions/Button';
import { useToast } from '../../components/feedback/ToastProvider';

const TYPES = [
  { value: 'momo', label: 'Mobile Money', icon: Smartphone },
  { value: 'card', label: 'Card', icon: CreditCard },
  { value: 'bank', label: 'Bank', icon: Landmark },
];

const BANKS = [
  { value: 'stanbic', label: 'Stanbic Bank Uganda' },
  { value: 'centenary', label: 'Centenary Bank' },
  { value: 'dfcu', label: 'DFCU Bank' },
  { value: 'absa', label: 'Absa Bank Uganda' },
  { value: 'equity', label: 'Equity Bank' },
];

export default function AddPaymentMethod() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { customer } = useAppState();
  const [type, setType] = useState('momo');
  const [saving, setSaving] = useState(false);

  // Mobile Money
  const [provider, setProvider] = useState('mtn');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');

  // Card
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Bank
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const canSubmit =
    (type === 'momo' && phone.length === 9) ||
    (type === 'card' && cardNumber.replace(/\s/g, '').length === 16 && cardExpiry.length === 5 && cardCvv.length === 3 && cardName) ||
    (type === 'bank' && bank && accountNumber.length >= 8);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);

    let payload;
    if (type === 'momo') {
      payload = { type: 'momo', label: provider === 'mtn' ? 'MTN Mobile Money' : 'Airtel Money', detail: `${country.dialCode} ${phone}` };
    } else if (type === 'card') {
      const last4 = cardNumber.replace(/\s/g, '').slice(-4);
      payload = { type: 'card', label: `Card •••• ${last4}`, detail: `Expires ${cardExpiry}` };
    } else {
      payload = { type: 'bank', label: BANKS.find((b) => b.value === bank)?.label ?? 'Bank account', detail: `Acct •••• ${accountNumber.slice(-4)}` };
    }

    await customer.addPaymentMethod(payload);
    showToast('Payment method added', 'success');
    navigate('/customer/wallet');
  }

  return (
    <ScreenFrame title="Add payment method" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Tabs variant="pill" value={type} onChange={setType} items={TYPES.map(({ value, label }) => ({ value, label }))} />

        {type === 'momo' && (
          <>
            <Tabs
              variant="underline"
              value={provider}
              onChange={setProvider}
              items={[
                { value: 'mtn', label: 'MTN Mobile Money' },
                { value: 'airtel', label: 'Airtel Money' },
              ]}
            />
            <PhoneField
              value={phone}
              countryCode={country.code}
              onCountryChange={setCountry}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
            />
          </>
        )}

        {type === 'card' && (
          <>
            <TextField
              label="Card number"
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              value={cardNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
                setCardNumber(digits.replace(/(\d{4})(?=\d)/g, '$1 '));
              }}
            />
            <TextField label="Name on card" placeholder="e.g. John Ssebunya" value={cardName} onChange={(e) => setCardName(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Expiry"
                placeholder="MM/YY"
                inputMode="numeric"
                value={cardExpiry}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setCardExpiry(digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits);
                }}
              />
              <TextField
                label="CVV"
                placeholder="123"
                inputMode="numeric"
                type="password"
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
              />
            </div>
          </>
        )}

        {type === 'bank' && (
          <>
            <Dropdown label="Bank" placeholder="Select your bank" value={bank} onChange={(e) => setBank(e.target.value)} options={BANKS} />
            <TextField
              label="Account number"
              placeholder="Enter account number"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            />
          </>
        )}

        <Button type="submit" size="lg" fullWidth disabled={!canSubmit} loading={saving}>
          Save payment method
        </Button>
      </form>
    </ScreenFrame>
  );
}
