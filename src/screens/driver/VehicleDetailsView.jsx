import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import VehicleVerificationBadge from '../../components/identity/VehicleVerificationBadge';
import { TRUCK_ILLUSTRATIONS } from '../../assets/trucks';

export default function VehicleDetailsView() {
  const navigate = useNavigate();
  const { driver, getTruckTier } = useAppState();
  const { profile } = driver;
  if (!profile) return null;
  const tier = getTruckTier(profile.truckTierId);

  return (
    <ScreenFrame title="Vehicle details" onBack={() => navigate(-1)}>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col items-center gap-2 rounded-card border border-neutral-200 bg-white p-6">
          {tier && <img src={TRUCK_ILLUSTRATIONS[tier.id]} alt={tier.name} className="h-24 w-24" />}
          <p className="text-h4 text-neutral-900">{profile.vehicleModel}</p>
          <VehicleVerificationBadge status={profile.vehicleVerificationStatus} />
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-body-sm text-neutral-500">Number plate</span>
            <span className="text-body-sm text-neutral-900 font-medium">{profile.plateNumber}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-body-sm text-neutral-500">Truck category</span>
            <span className="text-body-sm text-neutral-900 font-medium">{tier?.name} · {tier?.tonnageRange}</span>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
