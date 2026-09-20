import { useNavigate } from 'react-router-dom';
import TabScreen from '../layout/TabScreen';
import { DRIVER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import TripCard from '../../components/logistics/TripCard';
import EmptyState from '../../components/feedback/EmptyState';
import { Receipt } from 'lucide-react';

function Header() {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-h3 text-neutral-900">Your trips</p>
    </div>
  );
}

export default function DriverTripHistoryList() {
  const navigate = useNavigate();
  const { driver } = useAppState();

  return (
    <TabScreen header={<Header />} navItems={DRIVER_NAV_ITEMS}>
      {driver.trips.length === 0 ? (
        <EmptyState icon={Receipt} title="No trips yet" description="Completed trips will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {driver.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} status={trip.status} role="driver" onClick={() => navigate(`/driver/trips/${trip.id}`)} />
          ))}
        </div>
      )}
    </TabScreen>
  );
}
