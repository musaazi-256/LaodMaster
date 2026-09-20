import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, Gift, Eye, EyeOff } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import TextField from '../../components/forms/TextField';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import Tabs from '../../components/navigation/Tabs';
import Button from '../../components/actions/Button';
import Checkbox from '../../components/forms/Checkbox';
import { useAppState } from '../../state/AppStateContext';
import Logo from '../../components/identity/Logo';

export default function SignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAppState();
  // Same defaulting pattern as Login.jsx: a role forwarded via router state (e.g. arriving
  // here from the driver pane's Splash screen) should win over the plain 'customer' default.
  const [role, setRole] = useState(location.state?.role || 'customer');
  const [name, setName] = useState('');
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = name && phone.length === 9 && password.length >= 6 && agreed;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    try {
      await auth.signup(role, { name, phone: `${country.dialCode}${phone}`, password, referralCode: referralCode || undefined });
      navigate(role === 'customer' ? '/customer' : '/driver');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScreenFrame transparent>
      <div className="relative min-h-full flex flex-col justify-between pb-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Top Brand Logo */}
          <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
            <Logo size="h-10" showTagline className="items-center text-center" />
          </div>

          {/* Title & Subtitle */}
          <div className="text-left mb-1">
            <h1 className="text-[24px] font-bold text-neutral-900 leading-tight">Join LoadMastr</h1>
            <p className="text-body-sm text-neutral-500 mt-0.5">Create your account to get started.</p>
          </div>

          {/* Role Switcher Pill */}
          <Tabs
            variant="pill"
            value={role}
            onChange={setRole}
            items={[
              { value: 'customer', label: 'Customer' },
              { value: 'driver', label: 'Driver' },
            ]}
          />

          {/* Full Name Input with User Icon */}
          <TextField
            label="Full name"
            placeholder="e.g. John Ssebunya"
            icon={User}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          {/* Phone Field with Country Selector */}
          <PhoneField
            value={phone}
            countryCode={country.code}
            onCountryChange={setCountry}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          />

          {/* Password Field with Lock Icon & Eye Toggle */}
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />

          {/* Referral Code Field with Gift Box Icon */}
          <TextField
            label="Referral code (optional)"
            placeholder="e.g. JOHN256"
            icon={Gift}
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
          />

          {/* Terms Checkbox */}
          <div className="flex items-start gap-2.5 mt-0.5">
            <Checkbox
              checked={agreed}
              onChange={() => setAgreed((a) => !a)}
              label={
                <span className="text-body-sm text-neutral-700 leading-snug">
                  I agree to the{' '}
                  <span className="text-green-700 font-semibold cursor-pointer hover:underline">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-green-700 font-semibold cursor-pointer hover:underline">
                    Privacy Policy
                  </span>
                </span>
              }
            />
          </div>

          {error && <p className="text-body-sm text-red-500 bg-red-50 p-2.5 rounded-button border border-red-200">{error}</p>}

          {/* Primary Action Button */}
          <Button type="submit" size="lg" fullWidth loading={auth.busy} disabled={!canSubmit}>
            Create account
          </Button>

          <p className="text-center text-body-sm text-neutral-500 mt-2">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-green-700 font-semibold hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </ScreenFrame>
  );
}
