import { useNavigate } from 'react-router-dom';
import {
  Bell,
  MapPin,
  ChevronDown,
  Search,
  Users,
  ChevronRight,
  Gift,
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { CUSTOMER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import { formatUGX } from '../../lib/format';
import Avatar from '../../components/identity/Avatar';
import MapCanvas from '../../components/logistics/MapCanvas';
import ETACard from '../../components/logistics/ETACard';
import DriverCard from '../../components/logistics/DriverCard';
import Button from '../../components/actions/Button';
import Logo from '../../components/identity/Logo';
import { Card } from '../../components/ui/card';

// Clean Truck Vector Illustrations for the 5 tiers
function TruckGraphic({ type = 'small' }) {
  if (type === 'small') {
    return (
      <svg className="w-16 h-12 text-neutral-800" viewBox="0 0 100 60" fill="none">
        <path d="M10 25h45v20H10z" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
        <path d="M55 30h20l8 8v7H55z" fill="#10B981" stroke="#047857" strokeWidth="2" />
        <circle cx="25" cy="47" r="6" fill="#1E293B" />
        <circle cx="68" cy="47" r="6" fill="#1E293B" />
      </svg>
    );
  }
  if (type === 'small-medium') {
    return (
      <svg className="w-16 h-12 text-neutral-800" viewBox="0 0 100 60" fill="none">
        <rect x="8" y="18" width="50" height="28" rx="2" fill="#F1F5F9" stroke="#334155" strokeWidth="2" />
        <path d="M58 26h22l8 8v12H58z" fill="#059669" stroke="#047857" strokeWidth="2" />
        <circle cx="22" cy="48" r="6" fill="#1E293B" />
        <circle cx="72" cy="48" r="6" fill="#1E293B" />
      </svg>
    );
  }
  if (type === 'medium') {
    return (
      <svg className="w-16 h-12 text-neutral-800" viewBox="0 0 100 60" fill="none">
        <rect x="6" y="14" width="55" height="32" rx="2" fill="#E2E8F0" stroke="#334155" strokeWidth="2" />
        <path d="M61 22h22l7 9v15H61z" fill="#10B981" stroke="#047857" strokeWidth="2" />
        <circle cx="20" cy="48" r="6" fill="#1E293B" />
        <circle cx="74" cy="48" r="6" fill="#1E293B" />
      </svg>
    );
  }
  if (type === 'large') {
    return (
      <svg className="w-16 h-12 text-neutral-800" viewBox="0 0 100 60" fill="none">
        <rect x="5" y="12" width="58" height="34" rx="2" fill="#CBD5E1" stroke="#334155" strokeWidth="2" />
        <path d="M63 20h22l8 10v16H63z" fill="#047857" stroke="#064E3B" strokeWidth="2" />
        <circle cx="18" cy="48" r="6.5" fill="#1E293B" />
        <circle cx="34" cy="48" r="6.5" fill="#1E293B" />
        <circle cx="76" cy="48" r="6.5" fill="#1E293B" />
      </svg>
    );
  }
  return (
    <svg className="w-16 h-12 text-neutral-800" viewBox="0 0 100 60" fill="none">
      <rect x="4" y="10" width="60" height="36" rx="2" fill="#10B981" stroke="#047857" strokeWidth="2" />
      <path d="M64 18h24l6 10v18H64z" fill="#047857" stroke="#064E3B" strokeWidth="2" />
      <circle cx="16" cy="48" r="6.5" fill="#1E293B" />
      <circle cx="32" cy="48" r="6.5" fill="#1E293B" />
      <circle cx="78" cy="48" r="6.5" fill="#1E293B" />
    </svg>
  );
}

const TRUCK_SIZES = [
  { id: 'small', label: 'Small', capacity: 'Up to 1 Ton', type: 'small' },
  { id: 'small-medium', label: 'Small-Medium', capacity: '1 – 3 Tons', type: 'small-medium' },
  { id: 'medium', label: 'Medium', capacity: '3 – 7 Tons', type: 'medium' },
  { id: 'large', label: 'Large', capacity: '7 – 12 Tons', type: 'large' },
  { id: 'xlarge', label: 'Extra Large', capacity: '12+ Tons', type: 'xlarge' },
];

export default function Home() {
  const navigate = useNavigate();
  const { customer } = useAppState();
  const { profile, activeTrip, resetDraft, updateDraft } = customer;
  const selectedLocation = 'Kampala';

  if (!profile) return null;

  function startRequest(mode = 'search', truckTierId = 'light_truck') {
    resetDraft();
    updateDraft({ mode, truckTierId });
    navigate('/customer/request');
  }

  const firstName = profile.name ? profile.name.split(' ')[0] : 'John';

  return (
    <TabScreen navItems={CUSTOMER_NAV_ITEMS}>
      {activeTrip ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-h3 text-neutral-900">
              {firstName}, your truck is on the way
            </p>
          </div>
          <MapCanvas state={activeTrip.trackingState} originLabel={activeTrip.origin} destinationLabel={activeTrip.destination} />
          {activeTrip.driver && <DriverCard driver={activeTrip.driver} onCall={() => {}} onChat={() => {}} />}
          <ETACard etaMinutes={activeTrip.etaMinutes} distanceKm={activeTrip.distanceKm} />
          <Button size="lg" fullWidth onClick={() => navigate(`/customer/tracking/${activeTrip.id}`)}>
            Track Trip
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 pb-2">
          {/* BRAND HEADER BAR */}
          <div className="flex items-center justify-between pt-1 pb-1">
            <Logo size="h-8" showTagline />

            {/* Notification Bell Badge */}
            <button
              type="button"
              onClick={() => navigate('/customer/help')}
              className="relative p-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-2xs">
                3
              </span>
            </button>
          </div>

          {/* USER GREETING & LOCATION ROW */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <Avatar name={profile.name} size="md" />
              <div className="flex flex-col">
                <span className="text-[12px] text-neutral-500 font-medium">Good morning,</span>
                <span className="text-[18px] font-extrabold text-neutral-900 leading-tight">
                  {firstName} 👋
                </span>
              </div>
            </div>

            {/* Location Picker Dropdown Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-[12px] font-semibold text-neutral-800 shadow-2xs cursor-pointer hover:bg-emerald-100/70 transition-colors">
              <MapPin size={13} className="text-green-700 fill-current" />
              <span>{selectedLocation}</span>
              <ChevronDown size={13} className="text-neutral-500" />
            </div>
          </div>

          {/* WALLET BALANCE & QUICK ACTIONS CARD (Wallet-First Architecture) */}
          <Card className="bg-gradient-to-r from-green-700 via-emerald-800 to-green-900 text-white p-4 flex flex-col gap-3.5 border-none shadow-md rounded-card">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-body-sm text-green-100 font-medium truncate">
                <Wallet size={16} className="shrink-0" /> Wallet Balance
              </span>
              <button
                type="button"
                onClick={() => navigate('/customer/wallet')}
                className="text-xs text-green-200 hover:text-white underline font-medium transition-colors shrink-0"
              >
                View details
              </button>
            </div>
            <span className="text-h1 font-extrabold tracking-tight">{formatUGX(customer.wallet || 0)}</span>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/customer/wallet/deposit')}
                className="bg-white text-green-800 hover:bg-green-50 font-semibold shadow-2xs"
              >
                <ArrowDownToLine size={14} className="mr-1.5" /> Deposit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/customer/wallet/withdraw')}
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-semibold"
              >
                <ArrowUpFromLine size={14} className="mr-1.5" /> Withdraw
              </Button>
            </div>
          </Card>

          {/* HERO BANNER CARD */}
          <div className="relative rounded-card bg-gradient-to-r from-emerald-50 via-green-50/80 to-emerald-100/70 border border-emerald-200/70 p-4 overflow-hidden shadow-2xs">
            <div className="relative z-10 max-w-[195px]">
              <span className="text-[9.5px] font-extrabold tracking-wider uppercase text-green-800">
                MOVE GOODS ANYWHERE
              </span>
              <h2 className="text-[18px] font-black text-neutral-900 leading-tight mt-1">
                Find the right truck for your cargo
              </h2>
              <p className="text-[11px] text-neutral-600 font-medium mt-1 leading-snug">
                Reliable trucks. Verified drivers. On-time delivery.
              </p>
            </div>
            {/* Truck Graphic Artwork on Right Side */}
            <div className="absolute -right-2 bottom-1 z-0 opacity-95 pointer-events-none scale-110">
              <svg width="145" height="95" viewBox="0 0 160 110" fill="none">
                <rect x="10" y="20" width="90" height="55" rx="4" fill="#FFFFFF" stroke="#334155" strokeWidth="2.5" />
                <path d="M100 35h32l14 16v24h-46z" fill="#10B981" stroke="#047857" strokeWidth="2.5" />
                <circle cx="32" cy="76" r="11" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
                <circle cx="118" cy="76" r="11" fill="#1E293B" stroke="#FFFFFF" strokeWidth="2" />
                <line x1="20" y1="35" x2="90" y2="35" stroke="#E2E8F0" strokeWidth="2" />
              </svg>
            </div>
          </div>

          {/* DUAL PRIMARY ACTION BUTTONS */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => startRequest('search')}
              className="h-12 rounded-button bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold text-body-sm flex items-center justify-center gap-2 shadow-1 transition-all duration-fast"
            >
              <Search size={18} />
              <span>Search Truck</span>
            </button>
            <button
              type="button"
              onClick={() => startRequest('match')}
              className="h-12 rounded-button bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-200 text-green-800 font-semibold text-body-sm flex items-center justify-center gap-2 transition-all duration-fast"
            >
              <Users size={18} />
              <span>Match Driver</span>
            </button>
          </div>

          {/* CHOOSE A TRUCK SIZE CAROUSEL SECTION */}
          <div className="mt-1">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-[15px] font-extrabold text-neutral-900 tracking-tight">
                Choose a truck size
              </h3>
              <button
                type="button"
                onClick={() => startRequest('search')}
                className="text-[12px] font-semibold text-green-700 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {TRUCK_SIZES.map((item) => (
                <div
                  key={item.id}
                  onClick={() => startRequest('search', item.id)}
                  className="w-[106px] flex-shrink-0 bg-white border border-neutral-200 hover:border-green-500 rounded-card p-2.5 flex flex-col items-center text-center cursor-pointer transition-all shadow-2xs hover:shadow-1 group"
                >
                  <div className="h-12 flex items-center justify-center transition-transform group-hover:scale-105">
                    <TruckGraphic type={item.type} />
                  </div>
                  <span className="text-[12px] font-bold text-neutral-900 leading-snug mt-1">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-medium text-neutral-500 mt-0.5">
                    {item.capacity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* WHERE ARE YOU GOING BANNER */}
          <div
            onClick={() => startRequest('search')}
            className="bg-white border border-neutral-200 hover:border-green-500 rounded-card p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-1"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 border border-emerald-100 text-green-700 flex-shrink-0">
                <MapPin size={18} />
              </span>
              <div className="flex flex-col">
                <span className="text-[13.5px] font-bold text-neutral-900 leading-tight">
                  Where are you going?
                </span>
                <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                  Set your pickup and drop-off location
                </span>
              </div>
            </div>
            <ChevronRight size={18} className="text-neutral-400 flex-shrink-0" />
          </div>

          {/* REFER & EARN BANNER */}
          <div
            onClick={() => navigate('/customer/help')}
            className="relative bg-gradient-to-r from-emerald-50/90 via-green-50 to-emerald-100/60 border border-emerald-200/80 rounded-card p-3.5 flex items-center justify-between cursor-pointer transition-all shadow-2xs hover:shadow-1 overflow-hidden"
          >
            <div className="flex items-center gap-3 z-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-emerald-200 text-green-700 flex-shrink-0 shadow-2xs">
                <Gift size={18} />
              </span>
              <div className="flex flex-col">
                <span className="text-[13.5px] font-bold text-neutral-900 leading-tight">
                  Refer & Earn
                </span>
                <span className="text-[11px] text-neutral-600 font-medium mt-0.5">
                  Invite friends and get rewards
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 z-10">
              <ChevronRight size={18} className="text-green-700 flex-shrink-0" />
            </div>
          </div>

          {/* RECENT DESTINATIONS SECTION */}
          <div className="mt-0.5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[15px] font-extrabold text-neutral-900 tracking-tight">
                Recent destinations
              </h3>
              <button
                type="button"
                onClick={() => startRequest('search')}
                className="text-[12px] font-semibold text-green-700 hover:underline"
              >
                See all
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4">
              {['Entebbe', 'Kira', 'Nansana', 'Mukono'].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => {
                    resetDraft();
                    updateDraft({ mode: 'search', destination: { label: city, subtitle: `${city}, Uganda` } });
                    navigate('/customer/request');
                  }}
                  className="bg-white border border-neutral-200 hover:bg-neutral-50 rounded-full px-3.5 py-1.5 text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-2xs transition-colors"
                >
                  <MapPin size={12} className="text-neutral-500 fill-current" />
                  <span>{city}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </TabScreen>
  );
}
