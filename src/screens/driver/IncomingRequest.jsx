import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import Button from '../../components/actions/Button';
import RouteLine from '../../components/logistics/RouteLine';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';

export default function IncomingRequest() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { driver, getTruckTier } = useAppState();
  const { incomingRequest, activeTrip } = driver;

  useEffect(() => {
    if (!incomingRequest && !activeTrip) navigate('/driver', { replace: true });
    if (activeTrip) navigate('/driver/trip', { replace: true });
  }, [incomingRequest, activeTrip, navigate]);

  if (!incomingRequest) return null;

  const tier = getTruckTier(incomingRequest.truckTierId);

  async function accept() {
    try {
      await driver.acceptRequest();
      navigate('/driver/trip');
    } catch (err) {
      showToast(err.message, 'error');
      navigate('/driver');
    }
  }

  function decline() {
    driver.declineRequest();
    navigate('/driver');
  }

  return (
    <div className="flex flex-col h-full min-h-0 justify-end">
      <div className="flex-1 flex items-center justify-center bg-neutral-900/5">
        <div className="flex flex-col items-center gap-2 text-neutral-500">
          <MapPin size={28} />
          <p className="text-body-sm">New trip request nearby</p>
        </div>
      </div>
      <div className="rounded-t-[24px] bg-white shadow-3 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-h4 text-neutral-900">New trip request</p>
          {tier && <span className="text-small font-medium text-green-700 bg-green-100 rounded-pill px-2.5 py-1">{tier.name}</span>}
        </div>
        <RouteLine originLabel={incomingRequest.origin} destinationLabel={incomingRequest.destination} />
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-neutral-500">Distance to pickup</span>
          <span className="text-neutral-900 font-medium">{incomingRequest.distanceKm} km</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-body-sm text-neutral-500">Estimated fare</span>
          <span className="text-h3 text-neutral-900">{formatUGX(incomingRequest.fare)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger" size="lg" onClick={decline}>
            Decline
          </Button>
          <Button size="lg" onClick={accept}>
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
