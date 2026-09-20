import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import PhoneField, { COUNTRIES } from '../../components/forms/PhoneField';
import TextField from '../../components/forms/TextField';
import Tabs from '../../components/navigation/Tabs';
import Button from '../../components/actions/Button';
import Checkbox from '../../components/forms/Checkbox';
import { useAppState } from '../../state/AppStateContext';
import Logo from '../../components/identity/Logo';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAppState();
  const initialRole = location.state?.role || 'customer';
  const [role, setRole] = useState(initialRole);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phone, setPhone] = useState(initialRole === 'driver' ? '712345001' : '712345002');
  const [password, setPassword] = useState('pass123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  function handleRoleChange(newRole) {
    setRole(newRole);
    if (newRole === 'driver') {
      setPhone('712345001');
      setPassword('pass123');
    } else {
      setPhone('712345002');
      setPassword('pass123');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await auth.login(role, `${country.dialCode}${phone}`, password);
      const fromPath = location.state?.from;
      const target = (fromPath && !fromPath.startsWith('/auth'))
        ? fromPath
        : (role === 'customer' ? '/customer' : '/driver');
      navigate(target, { replace: true });
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
            <h1 className="text-[24px] font-bold text-neutral-900 leading-tight">Welcome back</h1>
            <p className="text-body-sm text-neutral-500 mt-0.5">Log in to continue with LoadMastr</p>
          </div>

          {/* Role Switcher Pill */}
          <Tabs
            variant="pill"
            value={role}
            onChange={handleRoleChange}
            items={[
              { value: 'customer', label: 'Customer' },
              { value: 'driver', label: 'Driver' },
            ]}
          />

          {/* Phone Field */}
          <PhoneField
            value={phone}
            countryCode={country.code}
            onCountryChange={setCountry}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
          />

          {/* Password Field with Left Lock & Right Eye Toggle */}
          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
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

          {/* Remember me & Forgot Password row */}
          <div className="flex items-center justify-between mt-0.5">
            <Checkbox
              label="Remember me"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
            />
            <Link to="/auth/forgot-password" className="text-body-sm text-green-700 font-semibold hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && <p className="text-body-sm text-red-500 bg-red-50 p-2.5 rounded-button border border-red-200">{error}</p>}

          {/* Primary Action Button */}
          <Button type="submit" size="lg" fullWidth loading={auth.busy}>
            Log in
          </Button>

          {/* Or Continue With Divider */}
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-medium text-neutral-400 uppercase tracking-wider absolute">
              or continue with
            </span>
          </div>

          {/* Social Logins */}
          <div className="flex flex-col gap-2.5 mt-1">
            {/* Google Button */}
            <button
              type="button"
              onClick={() => {
                setPhone('712345001');
                setPassword('pass123');
              }}
              className="w-full h-11 rounded-button border border-neutral-200 bg-white hover:bg-neutral-50 font-medium text-body-sm text-neutral-800 flex items-center justify-center gap-2.5 shadow-1 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={() => {
                setPhone('712345001');
                setPassword('pass123');
              }}
              className="w-full h-11 rounded-button border border-neutral-200 bg-white hover:bg-neutral-50 font-medium text-body-sm text-neutral-800 flex items-center justify-center gap-2.5 shadow-1 transition-all"
            >
              <svg className="w-4 h-4 fill-current text-neutral-900" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.84.13-9.64-1.97-14.41-6.35-3.17-2.76-7.04-7.4-11.61-13.92-6.54-9.37-11.75-19.82-15.64-31.36-3.89-11.54-5.84-22.75-5.84-33.63 0-14.49 3.69-26.6 11.07-36.33 7.38-9.73 16.71-14.7 27.99-14.92 4.96 0 10.15 1.17 15.58 3.51 5.43 2.34 9.4 3.51 11.91 3.51 2.25 0 6.13-1.12 11.64-3.37 5.51-2.25 10.51-3.33 15.01-3.24 10.5.53 19.38 4.54 26.64 12.04-9.45 5.75-14.07 13.88-13.86 24.39.21 8.24 3.42 15.35 9.63 21.33 6.21 5.98 13.68 9.35 22.41 10.11-2.58 7.57-5.9 15.11-9.97 22.62zM119.22 31.78c0-7.07 2.53-13.87 7.59-20.4 5.06-6.53 11.52-10.74 19.38-12.63.42 1.37.63 2.76.63 4.18 0 7.15-2.61 14.11-7.83 20.88-5.22 6.77-11.78 10.97-19.68 12.6-0.09-1.57-.09-3.11-.09-4.63z" />
              </svg>
              <span>Continue with Apple</span>
            </button>
          </div>

          <p className="text-center text-body-sm text-neutral-500 mt-2">
            New to LoadMastr?{' '}
            <Link to="/auth/signup" className="text-green-700 font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </ScreenFrame>
  );
}
