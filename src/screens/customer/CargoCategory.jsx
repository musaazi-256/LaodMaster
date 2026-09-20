import { useNavigate } from 'react-router-dom';
import { Package, Home, Boxes, Wheat, Sofa, MoreHorizontal } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';
import { useAppState } from '../../state/AppStateContext';
import Button from '../../components/actions/Button';
import { cx } from '../../lib/cx';

const CATEGORIES = [
  { id: 'general', label: 'General goods', icon: Package },
  { id: 'shifting', label: 'Shifting', icon: Home },
  { id: 'construction', label: 'Construction materials', icon: Boxes },
  { id: 'agriculture', label: 'Agricultural produce', icon: Wheat },
  { id: 'furniture', label: 'Furniture', icon: Sofa },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
];

export default function CargoCategory() {
  const navigate = useNavigate();
  const { customer } = useAppState();
  const { draft, updateDraft } = customer;

  return (
    <ScreenFrame
      title="What are you moving?"
      onBack={() => navigate(-1)}
      footer={
        <Button size="lg" fullWidth disabled={!draft.cargoCategory} onClick={() => navigate('/customer/request/disclaimer')}>
          Continue
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map(({ id, label, icon: Icon }) => {
          const selected = draft.cargoCategory === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => updateDraft({ cargoCategory: id })}
              className={cx(
                'flex flex-col items-start gap-3 rounded-card border-2 bg-white p-4 text-left transition-colors duration-fast',
                selected ? 'border-green-500 bg-green-50' : 'border-neutral-200 hover:border-neutral-500/40'
              )}
            >
              <span className={cx('flex h-10 w-10 items-center justify-center rounded-[8px]', selected ? 'bg-green-500 text-white' : 'bg-neutral-50 text-neutral-600')}>
                <Icon size={18} />
              </span>
              <span className="text-body-sm text-neutral-900">{label}</span>
            </button>
          );
        })}
      </div>
    </ScreenFrame>
  );
}
