import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Info } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import Button from '../../components/actions/Button';

export default function ForgotPasswordRequest() {
  const navigate = useNavigate();
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/auth/forgot-password/otp');
    }, 600);
  }

  return (
    <ScreenFrame transparent title="Reset password" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-2">
        {/* Top Lock Badge Illustration */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center pt-2 pb-1 text-center">
          <div className="w-24 h-24 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mb-4 shadow-1">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700">
              <Lock size={32} />
            </span>
          </div>
          <h1 className="text-[24px] font-bold text-neutral-900 leading-tight">Reset your password</h1>
          <p className="text-body-sm text-neutral-500 text-center max-w-sm mt-1.5 leading-relaxed">
            Enter the phone number linked to your account. We&apos;ll send you a one-time code to reset your password.
          </p>
        </div>

        {/* Phone Field */}
        <PhoneField
          value={phone}
          countryCode={country.code}
          onCountryChange={setCountry}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
        />

        {/* Send Code Primary Action Button */}
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={phone.length !== 9}>
          Send code
        </Button>

        {/* Bottom SMS Callout Box */}
        <div className="bg-green-50/70 border border-green-200 rounded-card p-4 flex items-start gap-3 mt-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500 text-white flex-shrink-0 mt-0.5">
            <Info size={16} />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 text-body-sm">Didn&apos;t receive the code?</span>
            <span className="text-small text-neutral-600 leading-relaxed mt-0.5">
              Check your SMS messages or make sure your number is correct.
            </span>
          </div>
        </div>
      </form>
    </ScreenFrame>
  );
}
