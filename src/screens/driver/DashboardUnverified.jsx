import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { DRIVER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import Button from '../../components/actions/Button';
import DriverVerificationBadge from '../../components/identity/DriverVerificationBadge';

function Header({ name }) {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-body-sm text-neutral-500">Welcome back,</p>
      <p className="text-h3 text-neutral-900">{name.split(' ')[0]}</p>
    </div>
  );
}

export default function DashboardUnverified() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  const isPending = driver.profile.verificationStatus === 'pending';

  return (
    <TabScreen header={<Header name={driver.profile.name} />} navItems={DRIVER_NAV_ITEMS}>
      <div className="flex flex-col gap-4">
        <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-pill bg-amber-500/10 text-amber-500 flex-shrink-0">
              <ShieldAlert size={18} />
            </span>
            <p className="text-label text-neutral-900">
              {isPending ? 'Your documents are being reviewed' : 'Account verification required'}
            </p>
          </div>
          <p className="text-body-sm text-neutral-600">
            {isPending
              ? "We'll notify you once your vehicle and documents are approved. This usually takes 24–48 hours."
              : "Complete your profile and register your truck to start receiving trip requests."}
          </p>
          {!isPending && (
            <Button size="md" onClick={() => navigate('/driver/register/vehicle')} className="self-start">
              Complete verification
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between rounded-card border border-neutral-200 bg-white p-4">
          <span className="text-body-sm text-neutral-900">Driver status</span>
          <DriverVerificationBadge status={isPending ? 'pending' : 'unverified'} />
        </div>

        <div className="rounded-card border border-neutral-200 bg-white p-4">
          <p className="text-label text-neutral-900 mb-1">Your truck</p>
          <p className="text-body-sm text-neutral-500">
            {driver.profile.vehicleModel ? `${driver.profile.vehicleModel} · ${driver.profile.plateNumber}` : 'Not registered yet'}
          </p>
        </div>
      </div>
    </TabScreen>
  );
}
