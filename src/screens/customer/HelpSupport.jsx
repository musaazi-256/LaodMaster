import { useNavigate } from 'react-router-dom';
import { ChevronRight, MessageCircle, Phone, FileQuestion } from 'lucide-react';
import ScreenFrame from '../layout/ScreenFrame';

const ITEMS = [
  { icon: FileQuestion, label: 'Frequently asked questions' },
  { icon: MessageCircle, label: 'Chat with support' },
  { icon: Phone, label: 'Call support · 0800 100 200' },
];

export default function HelpSupport() {
  const navigate = useNavigate();

  return (
    <ScreenFrame title="Help & support" onBack={() => navigate(-1)}>
      <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
        {ITEMS.map(({ icon: Icon, label }) => (
          <button key={label} type="button" className="flex items-center gap-3 px-4 py-3.5 text-left">
            <Icon size={17} className="text-neutral-600" />
            <span className="flex-1 text-body-sm text-neutral-900">{label}</span>
            <ChevronRight size={16} className="text-neutral-500" />
          </button>
        ))}
      </div>
    </ScreenFrame>
  );
}
