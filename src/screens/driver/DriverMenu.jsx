import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Truck, CreditCard, HelpCircle, LogOut } from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { DRIVER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import Avatar from '../../components/identity/Avatar';
import RatingStars from '../../components/identity/RatingStars';

function Header() {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-h3 text-neutral-900">More</p>
    </div>
  );
}

const LINKS = [
  { to: '/driver/profile', icon: User, label: 'Profile' },
  { to: '/driver/vehicle', icon: Truck, label: 'Vehicle details' },
  { to: '/driver/payment-method', icon: CreditCard, label: 'Payout method' },
  { to: '/driver/support', icon: HelpCircle, label: 'Help & support' },
];

export default function DriverMenu() {
  const navigate = useNavigate();
  const { driver, auth } = useAppState();
  const { profile } = driver;

  if (!profile) return null;

  function handleLogout() {
    auth.logout();
    navigate('/auth/login');
  }

  return (
    <TabScreen header={<Header />} navItems={DRIVER_NAV_ITEMS}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-card border border-neutral-200 bg-white p-4">
          <Avatar name={profile.name} size="lg" />
          <div className="flex flex-col min-w-0">
            <p className="text-h4 text-neutral-900 truncate">{profile.name}</p>
            <RatingStars rating={profile.rating} count={profile.tripCount} />
          </div>
        </div>

        <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
          {LINKS.map(({ to, icon: Icon, label }) => (
            <button key={to} type="button" onClick={() => navigate(to)} className="flex items-center gap-3 px-4 py-3.5 text-left">
              <Icon size={17} className="text-neutral-600" />
              <span className="flex-1 text-body-sm text-neutral-900">{label}</span>
              <ChevronRight size={16} className="text-neutral-500" />
            </button>
          ))}
        </div>

        <button type="button" onClick={handleLogout} className="flex items-center gap-3 rounded-card border border-neutral-200 bg-white px-4 py-3.5 text-left">
          <LogOut size={17} className="text-neutral-600" />
          <span className="text-body-sm text-neutral-900">Log out</span>
        </button>
      </div>
    </TabScreen>
  );
}
