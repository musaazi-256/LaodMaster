import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import TextField from '../../components/forms/TextField';
import Button from '../../components/actions/Button';
import { useToast } from '../../components/feedback/ToastProvider';

export default function ForgotPasswordReset() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 6 && password === confirm;

  function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast('Password reset successfully', 'success');
      navigate('/auth/login');
    }, 600);
  }

  return (
    <ScreenFrame title="Set new password" onBack={() => navigate(-1)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <TextField label="New password" type="password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField
          label="Confirm password"
          type="password"
          placeholder="Re-enter password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={mismatch ? 'Passwords do not match' : undefined}
        />
        <Button type="submit" size="lg" fullWidth loading={loading} disabled={!canSubmit}>
          Reset password
        </Button>
      </form>
    </ScreenFrame>
  );
}
