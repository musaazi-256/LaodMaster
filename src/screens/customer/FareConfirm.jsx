import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import RouteLine from '../../components/logistics/RouteLine';
import FareBreakdown from '../../components/logistics/FareBreakdown';
import Button from '../../components/actions/Button';

export default function FareConfirm() {
  const navigate = useNavigate();
  const { customer, getTruckTier } = useAppState();
  const { draft, fareForDraft } = customer;
  const tier = getTruckTier(draft.truckTierId);
  const base = Math.round(fareForDraft * 0.7);
  const distanceFare = fareForDraft - base;

  return (
    <ScreenFrame
      title="Confirm fare"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth onClick={() => navigate('/customer/request/payment')}>
          Continue to payment
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-card border border-neutral-200 bg-white p-4">
          <RouteLine
            originLabel={draft.pickup?.label || 'Current location'}
            destinationLabel={draft.destination?.label || 'Destination'}
          />
        </div>

        {tier && (
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-neutral-500">Truck</span>
            <span className="text-neutral-900 font-medium">{tier.name} · {tier.tonnageRange}</span>
          </div>
        )}

        <FareBreakdown
          items={[
            { label: 'Base fare', amount: base },
            { label: 'Distance', amount: distanceFare },
          ]}
          total={fareForDraft}
          disclaimer="Loading and offloading costs are arranged separately with your driver."
        />
      </div>
    </ScreenFrame>
  );
}
