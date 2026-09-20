import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScreenFrame from '../layout/ScreenFrame';
import Toggle from '../../components/forms/Toggle';

export default function Settings() {
  const navigate = useNavigate();
  const [pushNotifications, setPushNotifications] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);

  return (
    <ScreenFrame title="Settings" onBack={() => navigate(-1)}>
      <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-body-sm text-neutral-900">Push notifications</span>
          <Toggle checked={pushNotifications} onChange={setPushNotifications} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-body-sm text-neutral-900">SMS trip alerts</span>
          <Toggle checked={smsAlerts} onChange={setSmsAlerts} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-body-sm text-neutral-900">Share location with driver</span>
          <Toggle checked={locationSharing} onChange={setLocationSharing} />
        </div>
      </div>
    </ScreenFrame>
  );
}
