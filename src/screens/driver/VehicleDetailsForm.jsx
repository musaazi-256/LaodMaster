import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import TextField from '../../components/forms/TextField';
import Dropdown from '../../components/forms/Dropdown';
import Button from '../../components/actions/Button';
import { TRUCK_TIERS } from '../../mock-data/truckTiers';
import { useAppState } from '../../state/AppStateContext';

export default function VehicleDetailsForm() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  const [make, setMake] = useState('');
  const [plate, setPlate] = useState('');
  const [tierId, setTierId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canContinue = make && plate && tierId;

  async function handleContinue() {
    setSubmitting(true);
    await driver.registerVehicle({ vehicleModel: make, plateNumber: plate, truckTierId: tierId });
    navigate('/driver/register/documents');
  }

  return (
    <ScreenFrame
      title="Vehicle details"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth disabled={!canContinue} loading={submitting} onClick={handleContinue}>
          Continue
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <p className="text-body-sm text-neutral-500">Tell us about the truck you'll be driving on LoadMastr.</p>
        <TextField label="Vehicle make & model" placeholder="e.g. Isuzu NPR" value={make} onChange={(e) => setMake(e.target.value)} />
        <TextField label="Number plate" placeholder="e.g. UAW 123X" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
        <Dropdown
          label="Truck category"
          placeholder="Select truck category"
          value={tierId}
          onChange={(e) => setTierId(e.target.value)}
          options={TRUCK_TIERS.map((t) => ({ value: t.id, label: `${t.name} · ${t.tonnageRange}` }))}
        />
      </div>
    </ScreenFrame>
  );
}
