import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import Dropdown from '../../components/forms/Dropdown';
import Checkbox from '../../components/forms/Checkbox';
import Button from '../../components/actions/Button';
import { useAppState } from '../../state/AppStateContext';

const REASONS = [
  { value: 'not-using', label: "I'm not using LoadMastr anymore" },
  { value: 'found-alternative', label: 'I found another service' },
  { value: 'privacy', label: 'Privacy concerns' },
  { value: 'other', label: 'Other' },
];

export default function AccountDeletion() {
  const navigate = useNavigate();
  const { auth } = useAppState();
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    await auth.deleteAccount();
    navigate('/auth/login');
  }

  return (
    <ScreenFrame title="Delete account" onBack={() => navigate(-1)}>
      <div className="flex flex-col gap-5">
        <div className="rounded-card bg-red-500/5 border border-red-500/20 p-4 flex gap-3">
          <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
          <p className="text-body-sm text-neutral-600">
            This will permanently delete your LoadMastr account, trip history and saved payment methods. This cannot be undone.
          </p>
        </div>

        <Dropdown label="Why are you leaving?" placeholder="Select a reason" value={reason} onChange={(e) => setReason(e.target.value)} options={REASONS} />

        <Checkbox
          label="I understand this action is permanent and cannot be undone"
          checked={confirmed}
          onChange={() => setConfirmed((c) => !c)}
        />

        <Button variant="danger" size="lg" fullWidth disabled={!reason || !confirmed} loading={deleting} onClick={handleDelete}>
          Delete my account
        </Button>
        <Button variant="tertiary" size="lg" fullWidth onClick={() => navigate(-1)}>
          Cancel
        </Button>
      </div>
    </ScreenFrame>
  );
}
