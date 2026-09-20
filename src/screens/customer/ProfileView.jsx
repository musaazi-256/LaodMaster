import { useNavigate } from 'react-router-dom';
import { ChevronRight, Pencil, Settings, HelpCircle, LogOut, Trash2 } from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { CUSTOMER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import Avatar from '../../components/identity/Avatar';
import IconButton from '../../components/actions/IconButton';

function Header() {
  return (
    <div className="px-4 pt-5 pb-3 bg-white border-b border-neutral-200">
      <p className="text-h3 text-neutral-900">Profile</p>
    </div>
  );
}

const LINKS = [
  { to: '/customer/settings', icon: Settings, label: 'Settings' },
  { to: '/customer/help', icon: HelpCircle, label: 'Help & support' },
];

export default function ProfileView() {
  const navigate = useNavigate();
  const { customer, auth } = useAppState();
  const { profile } = customer;

  if (!profile) return null;

  function handleLogout() {
    auth.logout();
    navigate('/auth/login');
  }

  return (
    <TabScreen header={<Header />} navItems={CUSTOMER_NAV_ITEMS}>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3 rounded-card border border-neutral-200 bg-white p-4">
          <Avatar name={profile.name} size="lg" />
          <div className="flex flex-col min-w-0 flex-1">
            <p className="text-h4 text-neutral-900 truncate">{profile.name}</p>
            <p className="text-body-sm text-neutral-500 truncate">{profile.phone}</p>
          </div>
          <IconButton icon={Pencil} label="Edit profile" variant="secondary" onClick={() => navigate('/customer/profile/edit')} />
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

        <div className="flex flex-col divide-y divide-neutral-200 rounded-card border border-neutral-200 bg-white">
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 text-left">
            <LogOut size={17} className="text-neutral-600" />
            <span className="flex-1 text-body-sm text-neutral-900">Log out</span>
          </button>
          <button type="button" onClick={() => navigate('/auth/delete-account')} className="flex items-center gap-3 px-4 py-3.5 text-left">
            <Trash2 size={17} className="text-red-500" />
            <span className="flex-1 text-body-sm text-red-500">Delete account</span>
          </button>
        </div>
      </div>
    </TabScreen>
  );
}
