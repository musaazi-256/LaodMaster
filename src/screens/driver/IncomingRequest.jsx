import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Check,
  Clock,
  Route,
  Truck,
  Navigation,
  Layers,
  Target,
  ChevronDown,
} from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import MapCanvas from '../../components/logistics/MapCanvas';
import Logo from '../../components/identity/Logo';
import { formatUGX } from '../../lib/format';
import { useToast } from '../../components/feedback/ToastProvider';

export default function IncomingRequest() {
  const navigate = useNavigate();
  const showToast = useToast();
  const { driver, getTruckTier } = useAppState();
  const { incomingRequest, activeTrip } = driver;

  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!incomingRequest && !activeTrip) navigate('/driver', { replace: true });
    if (activeTrip) navigate('/driver/trip', { replace: true });
  }, [incomingRequest, activeTrip, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      driver.declineRequest();
      navigate('/driver');
      return undefined;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, driver, navigate]);

  if (!incomingRequest) return null;

  const tier = getTruckTier(incomingRequest.truckTierId);

  async function accept() {
    try {
      await driver.acceptRequest();
      showToast('Trip request accepted!', 'success');
      navigate('/driver/trip');
    } catch (err) {
      showToast(err.message || 'Failed to accept trip', 'error');
      navigate('/driver');
    }
  }

  function decline() {
    driver.declineRequest();
    showToast('Request declined', 'info');
    navigate('/driver');
  }

  const originText = incomingRequest.origin || 'Entebbe International Airport';
  const destinationText = incomingRequest.destination || 'Kasenyi';
  const distanceText = incomingRequest.distanceKm ? `${incomingRequest.distanceKm} km` : '3.4 km';
  const etaText = '8–10 mins';
  const formattedTime = `00:${String(timeLeft).padStart(2, '0')}`;

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col justify-between overflow-hidden font-sans bg-slate-100">
      {/* BACKGROUND FULL-BLEED MAP CANVAS */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          state="driver_approaching"
          originLabel={originText}
          destinationLabel={destinationText}
          fullBleed
          visiblePadding={{ top: 120, bottom: 340, left: 24, right: 24 }}
        />
      </div>

      {/* TOP FLOATING HEADER BAR */}
      <div className="relative z-20 pt-10 px-4 flex items-center justify-between pointer-events-none">
        {/* Left: LoadMastr Driver Brand Logo */}
        <div className="bg-white/95 backdrop-blur-md shadow-md rounded-full px-3.5 py-1.5 border border-neutral-200/80 flex items-center gap-2 pointer-events-auto">
          <Logo size="h-6" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#059447] border-l border-neutral-200 pl-2">
            DRIVER
          </span>
        </div>

        {/* Right: Online Status Dropdown Pill */}
        <button
          type="button"
          onClick={() => driver.goOffline()}
          className="bg-white/95 backdrop-blur-md shadow-md rounded-full px-3 py-1.5 border border-neutral-200/80 flex items-center gap-2 pointer-events-auto text-[12px] font-bold text-neutral-800 hover:bg-neutral-50 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#059447] animate-pulse shrink-0" />
          <span>Online</span>
          <ChevronDown size={14} className="text-neutral-500" />
        </button>
      </div>

      {/* FLOATING MAP CONTROLS ON RIGHT EDGE */}
      <div className="absolute right-4 top-28 z-20 flex flex-col gap-2.5 pointer-events-none">
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-all pointer-events-auto cursor-pointer"
          title="Recenter Map"
        >
          <Navigation size={18} />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-all pointer-events-auto cursor-pointer"
          title="Map Layers"
        >
          <Layers size={18} />
        </button>
        <button
          type="button"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 transition-all pointer-events-auto cursor-pointer"
          title="My Location"
        >
          <Target size={18} />
        </button>
      </div>

      {/* BOTTOM SHEET TRIP REQUEST MODAL CARD */}
      <div className="relative z-20 w-full max-w-md mx-auto bg-white rounded-t-[28px] shadow-[0_-10px_35px_rgba(0,0,0,0.15)] p-5 pb-6 flex flex-col gap-4 border-t border-neutral-200/80 shrink-0">
        {/* DRAG HANDLE PILL */}
        <div className="w-[48px] h-[5px] bg-[#94A3B8]/40 rounded-full mx-auto" />

        {/* REQUEST HEADER & COUNTDOWN TIMER ROW */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-2">
              <h2 className="text-[22px] font-black text-[#0F172A] leading-tight tracking-tight">
                New trip request
              </h2>
              {tier && (
                <span className="text-[10.5px] font-bold text-[#059447] bg-[#E8F7EF] border border-[#50BB7F]/40 rounded-full px-2.5 py-0.5">
                  {tier.name}
                </span>
              )}
            </div>
            <p className="text-[12.5px] font-medium text-[#64748B] mt-0.5">
              A new delivery request is nearby
            </p>
          </div>

          {/* COUNTDOWN TIMER PILL */}
          <div className="flex flex-col items-end shrink-0">
            <div className="px-3 py-1.5 rounded-full bg-[#E8F7EF] border border-[#50BB7F]/40 flex items-center gap-1.5 text-[#059447] font-black text-[14px]">
              <Clock size={15} className="animate-pulse" />
              <span>{formattedTime}</span>
            </div>
            <span className="text-[10px] font-semibold text-[#94A3B8] mt-1">
              Expires in
            </span>
          </div>
        </div>

        {/* TRIP DETAILS CONTAINER CARD */}
        <div className="bg-[#F8FAFC] rounded-[20px] p-4 border border-slate-200/80 flex flex-col gap-3.5">
          {/* PICKUP & DROP-OFF TIMELINE */}
          <div className="flex flex-col gap-3 relative pl-1">
            {/* Pickup Node */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-5 h-5 rounded-full border-[2px] border-[#059447] bg-white flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-2xs p-[2px]">
                <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#059447] bg-white flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#059447]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] leading-none">
                  PICKUP
                </span>
                <span className="text-[14px] font-extrabold text-[#0F172A] leading-snug mt-0.5 truncate">
                  {originText}
                </span>
                <span className="text-[11.5px] font-medium text-[#64748B]">
                  Entebbe Rd, Kampala
                </span>
              </div>
            </div>

            {/* Dashed Connecting Line */}
            <div className="absolute left-[9.5px] top-[22px] bottom-[22px] w-[1.5px] border-l-2 border-dashed border-[#CBD5E1] z-0" />

            {/* Drop-off Node */}
            <div className="flex items-start gap-3 text-left">
              <div className="w-5 h-5 rounded-full border-[2px] border-[#1F2937] bg-white flex items-center justify-center shrink-0 mt-0.5 z-10 shadow-2xs p-[2px]">
                <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#1F2937] bg-white flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-[#1F2937]" />
                </div>
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#64748B] leading-none">
                  DROP-OFF
                </span>
                <span className="text-[14px] font-extrabold text-[#0F172A] leading-snug mt-0.5 truncate">
                  {destinationText}
                </span>
                <span className="text-[11.5px] font-medium text-[#64748B]">
                  Kasenyi, Kampala
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-slate-200/80 my-0.5" />

          {/* 2-COLUMN SPECS GRID (Distance to pickup & Estimated time) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Column 1: Distance to pickup */}
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#475569] shrink-0">
                <Route size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10.5px] font-semibold text-[#64748B] leading-tight truncate">
                  Distance to pickup
                </span>
                <span className="text-[15px] font-extrabold text-[#0F172A] leading-tight mt-0.5">
                  {distanceText}
                </span>
              </div>
            </div>

            {/* Column 2: Estimated pickup time */}
            <div className="flex items-center gap-2.5 text-left border-l border-slate-200/80 pl-3">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-[#475569] shrink-0">
                <Clock size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10.5px] font-semibold text-[#64748B] leading-tight truncate">
                  Estimated pickup time
                </span>
                <span className="text-[15px] font-extrabold text-[#0F172A] leading-tight mt-0.5">
                  {etaText}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full h-[1px] bg-slate-200/80 my-0.5" />

          {/* FARE ROW */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#64748B]">
              <Truck size={19} />
              <span className="text-[13px] font-semibold text-[#475569]">
                Estimated fare
              </span>
            </div>
            <span className="text-[21px] font-black text-[#059447] tracking-tight">
              {formatUGX(incomingRequest.fare)}
            </span>
          </div>
        </div>

        {/* ACTION BUTTONS ROW */}
        <div className="flex items-center gap-3 mt-1">
          {/* Decline Button */}
          <button
            type="button"
            onClick={decline}
            className="flex-1 h-13 rounded-[14px] bg-white hover:bg-rose-50 border border-rose-300 active:scale-[0.98] font-extrabold text-[15px] text-rose-600 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <X size={18} strokeWidth={2.5} />
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={accept}
            className="flex-1 h-13 rounded-[14px] bg-[#059447] hover:bg-[#047857] active:scale-[0.98] font-extrabold text-[15px] text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
          >
            <Check size={20} strokeWidth={2.5} />
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
