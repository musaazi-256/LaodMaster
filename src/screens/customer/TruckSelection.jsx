import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import TruckSelector from '../../components/logistics/TruckSelector';
import Button from '../../components/actions/Button';

const FARE_BY_TIER = { small: 40000, 'small-medium': 70000, medium: 120000, large: 240000, 'extra-large': 420000 };

export default function TruckSelection() {
  const navigate = useNavigate();
  const { customer } = useAppState();
  const { draft, updateDraft } = customer;

  return (
    <ScreenFrame
      title="Choose a truck"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth disabled={!draft.truckTierId} onClick={() => navigate('/customer/request/fare')}>
          Continue
        </Button>
      }
    >
      <TruckSelector
        selectedTierId={draft.truckTierId}
        onSelect={(tierId) => updateDraft({ truckTierId: tierId })}
        fareByTier={FARE_BY_TIER}
        recommendedTierId="small-medium"
      />
    </ScreenFrame>
  );
}
