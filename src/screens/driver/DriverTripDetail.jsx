import { useNavigate, useParams } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import RouteLine from '../../components/logistics/RouteLine';
import FareBreakdown from '../../components/logistics/FareBreakdown';
import StatusBadge from '../../components/admin/StatusBadge';
import ErrorState from '../../components/feedback/ErrorState';
import { formatUGX } from '../../lib/format';

export default function DriverTripDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { driver, getTruckTier } = useAppState();
  const trip = driver.trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <ScreenFrame title="Trip" onBack={() => navigate('/driver/trips')}>
        <ErrorState title="Trip not found" />
      </ScreenFrame>
    );
  }

  const tier = getTruckTier(trip.truckTierId);
  const earnings = Math.round(trip.fare * 0.85);
  const commission = trip.fare - earnings;

  return (
    <ScreenFrame title="Trip earnings" onBack={() => navigate('/driver/trips')}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-small text-neutral-500">{trip.date}</span>
          <StatusBadge tone="success" label={trip.status} />
        </div>
        <div className="rounded-card border border-neutral-200 bg-white p-4">
          <RouteLine originLabel={trip.origin} destinationLabel={trip.destination} />
        </div>
        {tier && (
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-neutral-500">Truck</span>
            <span className="text-neutral-900 font-medium">{tier.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-neutral-500">Customer</span>
          <span className="text-neutral-900 font-medium">{trip.customerName}</span>
        </div>
        <FareBreakdown
          items={[{ label: 'Trip fare', amount: trip.fare }, { label: 'LoadMastr commission', amount: -commission }]}
          total={earnings}
          disclaimer={`You earned ${formatUGX(earnings)} from this trip.`}
        />
      </div>
    </ScreenFrame>
  );
}
