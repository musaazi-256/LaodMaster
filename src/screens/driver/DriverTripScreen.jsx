import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageCircle } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import MapCanvas from '../../components/logistics/MapCanvas';
import Avatar from '../../components/identity/Avatar';
import IconButton from '../../components/actions/IconButton';
import Button from '../../components/actions/Button';
import TopAppBar from '../../components/navigation/TopAppBar';
import { useToast } from '../../components/feedback/ToastProvider';
import { formatUGX } from '../../lib/format';

const PHASE_COPY = {
  navigate_to_pickup: { title: 'Head to pickup location', action: 'Arrived at pickup' },
  arrived_pickup: { title: 'Waiting at pickup', action: 'Start trip' },
  in_transit: { title: 'Trip in progress', action: 'Arrived at destination' },
  arrived_destination: { title: 'Arrived at destination', action: 'Complete trip' },
};

export default function DriverTripScreen() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { driver } = useAppState();
  const { activeTrip, advanceDriverPhase } = driver;

  useEffect(() => {
    if (!activeTrip) navigate('/driver', { replace: true });
  }, [activeTrip, navigate]);

  if (!activeTrip) return null;

  const copy = PHASE_COPY[activeTrip.phase];

  function handlePrimaryAction() {
    if (activeTrip.phase === 'arrived_destination') {
      navigate('/driver/trip/complete');
    } else {
      advanceDriverPhase();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopAppBar title="Active trip" />
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <MapCanvas state={activeTrip.trackingState} originLabel={activeTrip.origin} destinationLabel={activeTrip.destination} />

        <div className="flex items-center gap-3 rounded-card border border-neutral-200 bg-white p-4">
          <Avatar name={activeTrip.customer?.name} />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-label text-neutral-900 truncate">{activeTrip.customer?.name}</span>
            <span className="text-small text-neutral-500">Customer</span>
          </div>
          <div className="flex items-center gap-2">
            <IconButton icon={Phone} label="Call customer" variant="secondary" onClick={() => showToast('Calling customer…', 'info')} />
            <IconButton icon={MessageCircle} label="Chat with customer" variant="secondary" onClick={() => showToast('Opening chat…', 'info')} />
          </div>
        </div>

        <div className="flex items-center justify-between text-body-sm">
          <span className="text-neutral-500">Trip fare</span>
          <span className="text-neutral-900 font-medium">{formatUGX(activeTrip.fare)}</span>
        </div>
      </div>
      <div className="border-t border-neutral-200 bg-white px-4 py-3 flex flex-col gap-2">
        <p className="text-label text-neutral-900 text-center">{copy.title}</p>
        <Button size="lg" fullWidth onClick={handlePrimaryAction}>
          {copy.action}
        </Button>
      </div>
    </div>
  );
}
