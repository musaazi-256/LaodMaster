import { useNavigate } from 'react-router-dom';
import { Info, Users, HandCoins } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import Button from '../../components/actions/Button';

export default function Disclaimer() {
  const navigate = useNavigate();

  return (
    <ScreenFrame
      title="Before you continue"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth onClick={() => navigate('/customer/request/trucks')}>
          I understand, continue
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-pill bg-amber-500/10 text-amber-500">
          <Info size={22} />
        </span>
        <p className="text-h4 text-neutral-900">Loading & offloading isn't included in the fare</p>
        <p className="text-body-sm text-neutral-500">
          The fare you'll see covers transport only. Manual labour for loading and offloading your cargo is arranged separately with the driver on-site.
        </p>

        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3 rounded-card border border-neutral-200 bg-white p-3.5">
            <Users size={18} className="text-neutral-600 flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-neutral-600">
              You can arrange your own loaders, or ask the driver to help for an additional on-site fee.
            </p>
          </div>
          <div className="flex items-start gap-3 rounded-card border border-neutral-200 bg-white p-3.5">
            <HandCoins size={18} className="text-neutral-600 flex-shrink-0 mt-0.5" />
            <p className="text-body-sm text-neutral-600">
              Loading costs are negotiated directly and are not processed through LoadMastr payments.
            </p>
          </div>
        </div>
      </div>
    </ScreenFrame>
  );
}
