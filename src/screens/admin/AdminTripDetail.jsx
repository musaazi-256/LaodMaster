import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AdminPageHeader from '../layout/AdminPageHeader';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import RouteLine from '../../components/logistics/RouteLine';
import FareBreakdown from '../../components/logistics/FareBreakdown';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/actions/Button';
import ErrorState from '../../components/feedback/ErrorState';
import { api } from '../../lib/api';
import { getTruckTier } from '../../mock-data/truckTiers';

const STATUS_TONE = { completed: 'success', cancelled: 'danger', accepted: 'info', requested: 'neutral' };

export default function AdminTripDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    api.adminTrip(id)
      .then((r) => alive && setTrip(r.trip))
      .catch(() => alive && setNotFound(true));
    return () => { alive = false; };
  }, [id]);

  if (notFound) {
    return (
      <div>
        <AdminPageHeader title="Trip not found" />
        <div className="p-8"><ErrorState title="Trip not found" /></div>
      </div>
    );
  }
  if (!trip) return null;

  const tier = getTruckTier(trip.truckTierId);
  const base = Math.round(trip.fare * 0.7);

  return (
    <div>
      <AdminPageHeader
        title={`Trip ${trip.id}`}
        actions={<Button variant="secondary" onClick={() => navigate('/admin/trips')}>Back to trips</Button>}
      />
      <div className="p-8 flex flex-col gap-6 max-w-2xl">
        <Breadcrumbs items={[{ label: 'Trips', to: '/admin/trips' }, { label: trip.id }]} />

        <div className="flex items-center justify-between">
          <span className="text-body-sm text-neutral-500">{trip.date}</span>
          <StatusBadge tone={STATUS_TONE[trip.status]} label={trip.status} />
        </div>

        <div className="rounded-card border border-neutral-200 bg-white p-4">
          <RouteLine originLabel={trip.origin} destinationLabel={trip.destination} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-body-sm">
          <div>
            <p className="text-neutral-500">Customer</p>
            <p className="text-neutral-900 font-medium">{trip.customerName ?? '—'}</p>
          </div>
          <div>
            <p className="text-neutral-500">Driver</p>
            <p className="text-neutral-900 font-medium">{trip.driverName ?? 'Not yet assigned'}</p>
          </div>
          <div>
            <p className="text-neutral-500">Truck category</p>
            <p className="text-neutral-900 font-medium">{tier ? `${tier.name} · ${tier.tonnageRange}` : '—'}</p>
          </div>
        </div>

        <FareBreakdown items={[{ label: 'Base fare', amount: base }, { label: 'Distance', amount: trip.fare - base }]} total={trip.fare} />
      </div>
    </div>
  );
}
