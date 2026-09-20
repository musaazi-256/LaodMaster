import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TextField from '../../components/forms/TextField';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import Button from '../../components/actions/Button';
import { useToast } from '../../components/feedback/ToastProvider';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { customer } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer.profile) {
      setName(customer.profile.name);
      setEmail(customer.profile.email || '');
      const fullPhone = customer.profile.phone || '';
      const matchedCountry = COUNTRIES.find((c) => fullPhone.startsWith(c.dialCode)) || COUNTRIES[0];
      setCountry(matchedCountry);
      setPhone(fullPhone.replace(/\D/g, '').slice(-9));
    }
  }, [customer.profile]);

  if (!customer.profile) return null;

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    await customer.updateProfile({ name, email, phone: `${country.dialCode}${phone}` });
    setSaving(false);
    showToast('Profile updated', 'success');
    navigate('/customer/profile');
  }

  return (
    <ScreenFrame title="Edit profile" onBack={() => navigate(-1)}>
      <form onSubmit={handleSave} className="flex flex-col gap-5">
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <PhoneField
          value={phone}
          countryCode={country.code}
          onCountryChange={setCountry}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
        />
        <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button type="submit" size="lg" fullWidth loading={saving}>
          Save changes
        </Button>
      </form>
    </ScreenFrame>
  );
}
