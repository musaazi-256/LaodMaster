import { useNavigate } from 'react-router-dom';
import TabScreen from '../layout/TabScreen';
import { CUSTOMER_NAV_ITEMS } from '../layout/navItems';
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

export default function TripHistoryList() {
  const navigate = useNavigate();
  const { customer } = useAppState();

  return (
    <TabScreen header={<Header />} navItems={CUSTOMER_NAV_ITEMS}>
      {customer.trips.length === 0 ? (
        <EmptyState icon={Receipt} title="No trips yet" description="Your trip history will show up here." />
      ) : (
        <div className="flex flex-col gap-3">
          {customer.trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} status={trip.status} onClick={() => navigate(`/customer/trips/${trip.id}`)} />
          ))}
        </div>
      )}
    </TabScreen>
  );
}
