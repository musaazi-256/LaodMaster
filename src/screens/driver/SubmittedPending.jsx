import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import Button from '../../components/actions/Button';

export default function SubmittedPending() {
  const navigate = useNavigate();

  return (
    <ScreenFrame title="Verification submitted">
      <div className="flex flex-col items-center text-center gap-4 pt-10">
        <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-amber-500/10 text-amber-500">
          <Clock size={30} />
        </span>
        <div>
          <p className="text-h3 text-neutral-900">Your documents are under review</p>
          <p className="text-body-sm text-neutral-500 mt-1 max-w-xs">
            An admin needs to review and approve your account before you can go online. Your
            dashboard will update automatically once that happens.
          </p>
        </div>
        <Button size="lg" onClick={() => navigate('/driver')}>
          Back to dashboard
        </Button>
      </div>
    </ScreenFrame>
  );
}
