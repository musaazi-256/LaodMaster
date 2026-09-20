import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import TextField from '../../components/forms/TextField';
import Button from '../../components/actions/Button';

export default function ForgotPasswordOTP() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate('/auth/forgot-password/reset');
    }, 600);
  }

  return (
    <ScreenFrame title="Enter code" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-body-sm text-neutral-500">
          We sent a 4-digit code to your phone via SMS. Enter it below to continue.
        </p>
        <TextField
          label="Verification code"
          placeholder="1234"
          inputMode="numeric"
          maxLength={4}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="[&_input]:tracking-[0.5em] [&_input]:text-h3"
        />
        <button type="button" className="text-body-sm text-green-700 font-medium self-start">
          Resend code
        </button>
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={code.length !== 4}>
          Verify code
        </Button>
      </form>
    </ScreenFrame>
  );
}
