import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Bell,
  ChevronDown,
  ChevronRight,
  Wallet,
  Clock,
  FileText,
  Star,
} from 'lucide-react';
import TabScreen from '../layout/TabScreen';
import { DRIVER_NAV_ITEMS } from '../layout/navItems';
import { useAppState } from '../../state/AppStateContext';
import Logo from '../../components/identity/Logo';
import Avatar from '../../components/identity/Avatar';
import { formatUGX } from '../../lib/format';
import { Card } from '../../components/ui/card';

export default function DashboardVerified() {
  const navigate = useNavigate();
  const { driver } = useAppState();
  const { profile, incomingRequest, activeTrip } = driver;

  useEffect(() => {
    if (incomingRequest) navigate('/driver/requests/incoming');
  }, [incomingRequest, navigate]);

  useEffect(() => {
    if (activeTrip) navigate('/driver/trip');
  }, [activeTrip, navigate]);

  if (!profile) return null;

  const firstName = profile.name ? profile.name.split(' ')[0] : 'Ahmed';
  const vehicleName = profile.vehicleModel ? `${profile.vehicleModel} · ${profile.plateNumber || 'UAW 123X'}` : 'Isuzu NPR · UAW 123X';

  const isOnline = Boolean(profile.isOnline);

  return (
    <TabScreen navItems={DRIVER_NAV_ITEMS}>
      <div className="flex flex-col gap-4 pb-2">
        {/* BRAND HEADER BAR */}
        <div className="flex items-center justify-between pt-1 pb-1">
          <Logo size="h-8" showTagline />

          {/* Notification Bell Badge */}
          <button
            type="button"
            onClick={() => navigate('/driver/support')}
            className="relative p-2 rounded-full border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-2xs">
              2
            </span>
          </button>
        </div>

        {/* USER GREETING & ONLINE STATUS ROW */}
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

          {/* Online / Offline Status Pill */}
          <button
            type="button"
            onClick={() => (isOnline ? driver.goOffline() : driver.goOnline())}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/80 border border-emerald-200/80 text-[12px] font-semibold text-neutral-800 shadow-2xs cursor-pointer hover:bg-emerald-100/70 transition-colors"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-neutral-400'}`} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            <ChevronDown size={13} className="text-neutral-500" />
          </button>
        </div>

        {/* STATUS TOGGLE HERO BANNER CARD */}
        <Card className={`relative p-5 text-white shadow-md transition-all duration-standard overflow-hidden border-none ${
          isOnline ? 'bg-gradient-to-r from-green-600 via-emerald-600 to-green-700' : 'bg-gradient-to-r from-neutral-800 to-neutral-900'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col max-w-[210px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-100">
                {isOnline ? "YOU'RE ONLINE" : "YOU'RE OFFLINE"}
              </span>
              <h2 className="text-[21px] font-black leading-tight mt-0.5">
                {isOnline ? 'Ready for trips' : 'Go online to receive trips'}
              </h2>
              <p className="text-[11.5px] text-green-100 font-medium mt-1 leading-snug">
                {isOnline
                  ? "We'll notify you when matching loads are nearby."
                  : 'Toggle switch to start receiving cargo requests.'}
              </p>
            </div>

            {/* iOS Style Large Toggle Switch */}
            <button
              type="button"
              onClick={() => (isOnline ? driver.goOffline() : driver.goOnline())}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-fast relative cursor-pointer flex-shrink-0 shadow-inner ${
                isOnline ? 'bg-white' : 'bg-neutral-700'
              }`}
              aria-label={isOnline ? 'Go offline' : 'Go online'}
            >
              <div
                className={`w-6 h-6 rounded-full shadow-md transition-transform duration-fast transform ${
                  isOnline ? 'translate-x-6 bg-green-600' : 'translate-x-0 bg-neutral-300'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* STATS ROW CARD (Trips, Earnings, Rating) */}
        <Card className="bg-white border border-neutral-200 p-3.5 grid grid-cols-3 divide-x divide-neutral-200 shadow-2xs">
          {/* Column 1: Trips */}
          <div className="flex flex-col items-start pr-2">
            <span className="text-[20px] font-extrabold text-neutral-900 leading-none">
              12
            </span>
            <span className="text-[10.5px] font-medium text-neutral-500 mt-1">
              Trips this week
            </span>
          </div>

          {/* Column 2: Earnings */}
          <div className="flex flex-col items-start px-3">
            <span className="text-[14.5px] font-extrabold text-neutral-900 leading-none truncate w-full">
              UGX 460,000
            </span>
            <span className="text-[10.5px] font-medium text-neutral-500 mt-1">
              Earnings
            </span>
          </div>

          {/* Column 3: Rating */}
          <div className="flex flex-col items-start pl-3">
            <div className="flex items-center gap-1">
              <span className="text-[18px] font-extrabold text-neutral-900 leading-none">
                4.8
              </span>
              <Star size={14} className="fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[10.5px] font-medium text-neutral-500 mt-1">
              Rating
            </span>
          </div>
        </Card>

        {/* VEHICLE VERIFICATION CARD */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => navigate('/driver/vehicle')}
          className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition-colors shadow-2xs"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-green-700 flex-shrink-0">
              <Truck size={18} />
            </span>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-bold text-neutral-900 leading-tight">
                Your truck is verified
              </span>
              <span className="text-[11px] text-neutral-600 font-medium mt-0.5">
                {vehicleName}
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="text-green-700 flex-shrink-0" />
        </Card>

        {/* QUICK ACTIONS GRID */}
        <div className="mt-0.5">
          <h3 className="text-[15px] font-extrabold text-neutral-900 tracking-tight mb-2.5">
            Quick actions
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {/* Action 1: Trip Requests */}
            <div
              onClick={() => navigate('/driver/requests/incoming')}
              className="bg-white border border-neutral-200 hover:border-green-500 rounded-card p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs hover:shadow-1 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-button bg-neutral-100 group-hover:bg-green-50 text-neutral-700 group-hover:text-green-700 transition-colors">
                <Truck size={20} />
              </span>
              <span className="text-[11px] font-semibold text-neutral-800 leading-tight mt-1.5">
                Trip Requests
              </span>
            </div>

            {/* Action 2: Earnings */}
            <div
              onClick={() => navigate('/driver/earnings')}
              className="bg-white border border-neutral-200 hover:border-green-500 rounded-card p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs hover:shadow-1 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-button bg-neutral-100 group-hover:bg-green-50 text-neutral-700 group-hover:text-green-700 transition-colors">
                <Wallet size={20} />
              </span>
              <span className="text-[11px] font-semibold text-neutral-800 leading-tight mt-1.5">
                Earnings
              </span>
            </div>

            {/* Action 3: Trip History */}
            <div
              onClick={() => navigate('/driver/trips')}
              className="bg-white border border-neutral-200 hover:border-green-500 rounded-card p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs hover:shadow-1 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-button bg-neutral-100 group-hover:bg-green-50 text-neutral-700 group-hover:text-green-700 transition-colors">
                <Clock size={20} />
              </span>
              <span className="text-[11px] font-semibold text-neutral-800 leading-tight mt-1.5">
                Trip History
              </span>
            </div>

            {/* Action 4: Documents */}
            <div
              onClick={() => navigate('/driver/register/documents')}
              className="bg-white border border-neutral-200 hover:border-green-500 rounded-card p-2.5 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-2xs hover:shadow-1 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-button bg-neutral-100 group-hover:bg-green-50 text-neutral-700 group-hover:text-green-700 transition-colors">
                <FileText size={20} />
              </span>
              <span className="text-[11px] font-semibold text-neutral-800 leading-tight mt-1.5">
                Documents
              </span>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY SECTION */}
        <div className="mt-0.5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[15px] font-extrabold text-neutral-900 tracking-tight">
              Recent activity
            </h3>
            <button
              type="button"
              onClick={() => navigate('/driver/trips')}
              className="text-[12px] font-semibold text-green-700 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Item 1: Completed */}
            <div
              onClick={() => navigate('/driver/trips')}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-card p-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-neutral-900">
                    Kampala → Entebbe
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Today, 2:30 PM
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-extrabold text-neutral-900">
                  {formatUGX(120000)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-green-700 border border-emerald-200 mt-0.5">
                  Completed
                </span>
              </div>
            </div>

            {/* Item 2: In progress */}
            <div
              onClick={() => navigate('/driver/trips')}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-card p-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-neutral-900">
                    Kampala → Kira
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Today, 11:10 AM
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-extrabold text-neutral-900">
                  {formatUGX(80000)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 mt-0.5">
                  In progress
                </span>
              </div>
            </div>

            {/* Item 3: Cancelled */}
            <div
              onClick={() => navigate('/driver/trips')}
              className="bg-white border border-neutral-200 hover:border-neutral-300 rounded-card p-3 flex items-center justify-between cursor-pointer transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-400 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-neutral-900">
                    Kampala → Nansana
                  </span>
                  <span className="text-[11px] text-neutral-500 font-medium mt-0.5">
                    Yesterday, 4:20 PM
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[13px] font-extrabold text-neutral-900">
                  {formatUGX(60000)}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 mt-0.5">
                  Cancelled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TabScreen>
  );
}
