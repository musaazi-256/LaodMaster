import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import { formatUGX } from '../../lib/format';
import Button from '../../components/actions/Button';
import EmptyState from '../../components/feedback/EmptyState';

export default function CashDueTracker() {
  const navigate = useNavigate();
  const { driver } = useAppState();

  if (!driver.profile) return null;
  const cashDue = driver.profile.cashDue;

  return (
    <ScreenFrame
      title="Cash due"
      onBack={() => navigate(-1)}
      footer={cashDue > 0 ? <Button size="lg" fullWidth>Clear cash due</Button> : null}
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-card bg-amber-500/5 border border-amber-500/20 p-5 text-center">
          <p className="text-body-sm text-neutral-500">Total cash due to LoadMastr</p>
          <p className="text-h1 text-neutral-900 mt-1">{formatUGX(cashDue)}</p>
        </div>
        <p className="text-body-sm text-neutral-500">
          This is the commission owed from trips where customers paid you directly in cash. Clear it via mobile money to keep receiving trip requests.
        </p>
        {cashDue === 0 && <EmptyState title="Nothing due right now" description="Every trip so far has been settled through the app." />}
      </div>
    </ScreenFrame>
  );
}
