import { useNavigate, useParams } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import RouteLine from '../../components/logistics/RouteLine';
import FareBreakdown from '../../components/logistics/FareBreakdown';
import TripTimeline from '../../components/logistics/TripTimeline';
import StatusBadge from '../../components/admin/StatusBadge';
import ErrorState from '../../components/feedback/ErrorState';

const STATUS_TONE = { completed: 'success', cancelled: 'danger', 'en-route': 'info', accepted: 'info', requested: 'neutral' };

export default function TripDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { customer, getTruckTier } = useAppState();
  const trip = customer.trips.find((t) => t.id === id);

  if (!trip) {
    return (
      <ScreenFrame title="Trip" onBack={() => navigate('/customer/trips')}>
        <ErrorState title="Trip not found" description="This trip may have been removed." />
      </ScreenFrame>
    );
  }

  const tier = getTruckTier(trip.truckTierId);
  const base = Math.round(trip.fare * 0.7);

  return (
    <ScreenFrame title="Trip receipt" onBack={() => navigate('/customer/trips')}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-small text-neutral-500">{trip.date}</span>
          <StatusBadge tone={STATUS_TONE[trip.status] || 'neutral'} label={trip.status} />
        </div>

        <div className="rounded-card border border-neutral-200 bg-white p-4">
          <RouteLine originLabel={trip.origin} destinationLabel={trip.destination} />
        </div>

        {tier && (
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-neutral-500">Truck</span>
            <span className="text-neutral-900 font-medium">{tier.name} · {tier.tonnageRange}</span>
          </div>
        )}
        {trip.driverName && (
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-neutral-500">Driver</span>
            <span className="text-neutral-900 font-medium">{trip.driverName}</span>
          </div>
        )}

        <TripTimeline
          steps={[
            { label: 'Trip requested', completed: true },
            { label: 'Driver accepted', completed: true },
            { label: 'Trip completed', completed: trip.status === 'completed', active: trip.status !== 'completed' && trip.status !== 'cancelled' },
          ]}
        />

        <FareBreakdown
          items={[{ label: 'Base fare', amount: base }, { label: 'Distance', amount: trip.fare - base }]}
          total={trip.fare}
        />
      </div>
    </ScreenFrame>
  );
}
