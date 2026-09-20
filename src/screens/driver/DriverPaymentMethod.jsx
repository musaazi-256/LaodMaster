import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import Tabs from '../../components/navigation/Tabs';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import TextField from '../../components/forms/TextField';
import Button from '../../components/actions/Button';
import { useToast } from '../../components/feedback/ToastProvider';

export default function DriverPaymentMethod() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [type, setType] = useState('momo');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [bankAccount, setBankAccount] = useState('');

  function handleSave(e) {
    e.preventDefault();
    showToast('Payout method saved', 'success');
    navigate('/driver/menu');
  }

  return (
    <ScreenFrame title="Payout method" onBack={() => navigate(-1)}>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <Tabs
          variant="pill"
          value={type}
          onChange={setType}
          items={[{ value: 'momo', label: 'Mobile Money' }, { value: 'bank', label: 'Bank account' }]}
        />
        {type === 'momo' ? (
          <PhoneField
            value={phone}
            countryCode={country.code}
            onCountryChange={setCountry}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          />
        ) : (
          <TextField label="Bank account number" placeholder="Enter account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
        )}
        <Button type="submit" size="lg" fullWidth>
          Save payout method
        </Button>
      </form>
    </ScreenFrame>
  );
}
