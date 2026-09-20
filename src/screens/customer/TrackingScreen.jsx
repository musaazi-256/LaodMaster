import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Share2,
  ShieldAlert,
  Star,
  FileText,
  Clock,
  Navigation,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { TRACKING_STATES } from '../../state/AppStateContext';
import MapCanvas from '../../components/logistics/MapCanvas';
import { useToast } from '../../components/feedback/ToastProvider';
import { cn } from '../../lib/utils';

const STATUS_TEXT = {
  searching: 'Searching for drivers…',
  driver_assigned: 'Driver assigned',
  driver_approaching: 'Driver is on the way',
  driver_arrived: 'Driver arrived at pickup',
  trip_started: 'Trip started',
  en_route: 'Cargo in transit',
  near_destination: 'Nearing destination',
  arrived: 'Arrived at destination',
  completed: 'Trip completed',
};

const STEP_LABELS = [
  { key: 'driver_assigned', label: 'Assigned' },
  { key: 'driver_approaching', label: 'Approaching' },
  { key: 'en_route', label: 'En Route' },
  { key: 'completed', label: 'Delivered' },
];

export default function TrackingScreen() {
  const navigate = useNavigate();
  const { id } = useParams();
  const showToast = useToast();
  const [trip, setTrip] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const leavingRef = useRef(false);

  useEffect(() => {
    let alive = true;
    function load() {
      api
        .getTrip(id)
        .then((r) => alive && setTrip(r.trip))
        .catch(() => alive && setNotFound(true));
    }
    load();
    const timer = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (notFound && !leavingRef.current) navigate('/customer', { replace: true });
  }, [notFound, navigate]);

  if (!trip) {
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#50BB7F] border-t-transparent rounded-full animate-spin" />
          <span className="text-[13px] font-medium text-slate-500">Loading trip details...</span>
        </div>
      </div>
    );
  }

  const isPrePickup = ['searching', 'driver_assigned', 'driver_approaching'].includes(trip.trackingState);
  const isArrivedPickup = trip.trackingState === 'driver_arrived';
  const isEnRoute = ['trip_started', 'en_route', 'near_destination', 'arrived'].includes(trip.trackingState);
  const isComplete = trip.trackingState === 'completed';

  const driver = trip.driver || {
    name: 'David Mukasa',
    phone: '+256 772 123456',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    rating: 4.9,
    tripCount: 142,
    vehicleModel: 'Isuzu Elf 3 Ton',
    plateNumber: 'UBK 842X',
  };

  function handleViewReceipt() {
    leavingRef.current = true;
    navigate(`/customer/trips/${trip.id}`);
  }

  async function handleCancel() {
    leavingRef.current = true;
    await api.cancelTrip(trip.id);
    navigate('/customer');
  }

  async function handleAdvance() {
    const idx = TRACKING_STATES.indexOf(trip.trackingState);
    const next = TRACKING_STATES[Math.min(idx + 1, TRACKING_STATES.length - 1)];
    await api.updateTracking(trip.id, next);
    setTrip((t) => ({ ...t, trackingState: next }));
    showToast(`Simulated status: ${STATUS_TEXT[next] || next}`, 'info');
  }

  function handleShareTracking() {
    if (navigator.share) {
      navigator.share({
        title: 'LoadMastr Delivery Tracking',
        text: `Track my LoadMastr shipment live: ${trip.origin} -> ${trip.destination}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      showToast('Tracking link copied to clipboard!', 'success');
    }
  }

  // Calculate current progress index for 4-step bar
  let activeStepIdx = 0;
  if (trip.trackingState === 'driver_approaching' || trip.trackingState === 'driver_arrived') activeStepIdx = 1;
  else if (isEnRoute) activeStepIdx = 2;
  else if (isComplete) activeStepIdx = 3;

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col justify-between overflow-hidden font-sans bg-slate-100">
      {/* BACKGROUND MAP CANVAS */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          state={trip.trackingState}
          originLabel={trip.origin}
          destinationLabel={trip.destination}
          fullBleed
          visiblePadding={{ top: 140, bottom: 310, left: 24, right: 24 }}
        />
      </div>

      {/* TOP HEADER & FLOATING ROUTE SUMMARY CARD */}
      <div className="relative z-20 pt-12 px-4 flex flex-col gap-3 pointer-events-none">
        {/* Header Bar */}
        <div className="flex items-center justify-between pointer-events-auto">
          <button
            type="button"
            onClick={() => navigate('/customer')}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col text-right">
            <span className="text-[17px] font-extrabold text-[#020617] leading-tight tracking-tight">
              {STATUS_TEXT[trip.trackingState] || 'Live Tracking'}
            </span>
            <span className="text-[11.5px] font-medium text-[#64748B]">
              Order #{trip.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Floating Route Summary Card */}
        <div className="w-full bg-white/95 backdrop-blur-md shadow-md rounded-[18px] border border-neutral-200/80 p-3 flex items-center justify-between gap-2 pointer-events-auto mt-1">
          {/* Pickup Segment */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#059447] bg-white flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#059447]" />
            </div>
            <div className="flex flex-col truncate text-left">
              <span className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-wider leading-none">
                Pickup
              </span>
              <span className="text-[12.5px] font-bold text-[#0F172A] truncate leading-tight mt-0.5">
                {trip.origin}
              </span>
            </div>
          </div>

          {/* Vertical Divider */}
          <div className="w-[1px] h-6 bg-neutral-200 shrink-0" />

          {/* Drop-off Segment */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E11D48] bg-white flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E11D48]" />
            </div>
            <div className="flex flex-col truncate text-left">
              <span className="text-[9.5px] font-semibold text-[#64748B] uppercase tracking-wider leading-none">
                Destination
              </span>
              <span className="text-[12.5px] font-bold text-[#0F172A] truncate leading-tight mt-0.5">
                {trip.destination}
              </span>
            </div>
          </div>

          {/* Active Status Badge Chip */}
          <span className="px-2.5 py-1 rounded-full text-[10.5px] font-extrabold uppercase bg-emerald-50 text-[#059447] border border-emerald-200 shrink-0 ml-1">
            {isComplete ? 'Done' : isEnRoute ? 'En Route' : 'Approaching'}
          </span>
        </div>
      </div>

      {/* MAP OVERLAY FLOATING STATUS PILL */}
      <div className="relative z-20 px-4 mb-2 pointer-events-none">
        <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md shadow-md rounded-full border border-neutral-200/80 px-3.5 py-2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059447] shrink-0">
            {isArrivedPickup ? (
              <KeyRound size={15} />
            ) : isComplete ? (
              <CheckCircle2 size={15} />
            ) : (
              <Clock size={15} />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#0F172A] leading-tight">
              {isArrivedPickup
                ? 'Load Verification PIN: 4892'
                : isComplete
                ? 'Trip Completed'
                : isEnRoute
                ? `ETA ~${trip.etaMinutes ?? 18} mins remaining`
                : `Driver ETA ~${trip.etaMinutes ?? 3} mins`}
            </span>
            <span className="text-[10.5px] font-normal text-[#64748B] leading-tight">
              {isArrivedPickup
                ? 'Share this PIN code with the driver to start trip'
                : isComplete
                ? 'Cargo delivered safely'
                : isEnRoute
                ? `${trip.distanceKm ?? 14} km remaining to destination`
                : 'Driver is approaching your pickup spot'}
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET ORDER & DRIVER CARD */}
      <div className="relative z-20 w-full max-w-md mx-auto bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-5 pb-6 flex flex-col gap-4 border-t border-neutral-200/80 shrink-0">
        {/* DRAG HANDLE PILL */}
        <div className="w-[52px] h-[5px] bg-[#475569]/30 rounded-full mx-auto" />

        {/* DRIVER INFO CARD */}
        {driver && (
          <div className="bg-[#F8FAFC] rounded-[20px] p-3.5 border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={driver.photo}
                  alt={driver.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#059447] border-2 border-white" />
              </div>
              <div className="flex flex-col text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[14px] font-bold text-[#0F172A] truncate">
                    {driver.name}
                  </span>
                  <span className="text-[11px] font-semibold text-[#059447] bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.2 shrink-0">
                    ★ {driver.rating}
                  </span>
                </div>
                <span className="text-[12px] font-medium text-[#64748B] truncate mt-0.5">
                  {driver.vehicleModel} · <strong className="text-[#0F172A] font-bold">{driver.plateNumber}</strong>
                </span>
              </div>
            </div>

            {/* Call & Chat Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => showToast(`Calling ${driver.name} (${driver.phone})…`, 'info')}
                className="w-9 h-9 rounded-full bg-[#E8F7EF] hover:bg-[#d5f2e2] text-[#059447] border border-[#50BB7F]/30 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Call driver"
                title="Call driver"
              >
                <Phone size={16} />
              </button>
              <button
                type="button"
                onClick={() => showToast('Opening message chat…', 'info')}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Message driver"
                title="Message driver"
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        )}

        {/* 4-STEP TIMELINE BAR */}
        <div className="flex items-center justify-between px-2 pt-1">
          {STEP_LABELS.map((step, idx) => {
            const isDone = idx <= activeStepIdx;
            const isCurrent = idx === activeStepIdx;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                {/* Connecting Line */}
                {idx > 0 && (
                  <div
                    className={cn(
                      'absolute top-[7px] -left-[50%] right-[50%] h-[3px] rounded-full transition-colors z-0',
                      idx <= activeStepIdx ? 'bg-[#059447]' : 'bg-slate-200'
                    )}
                  />
                )}
                {/* Step Circle Node */}
                <div
                  className={cn(
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-all',
                    isDone
                      ? 'border-[#059447] bg-[#059447] text-white'
                      : 'border-slate-300 bg-white text-transparent',
                    isCurrent && 'ring-4 ring-emerald-100 scale-110'
                  )}
                >
                  {isDone && <CheckCircle2 size={10} strokeWidth={3} />}
                </div>
                <span
                  className={cn(
                    'text-[10px] font-semibold mt-1.5 transition-colors',
                    isCurrent ? 'text-[#059447]' : isDone ? 'text-[#0F172A]' : 'text-slate-400'
                  )}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* STATE ACTION BUTTONS */}
        <div className="flex flex-col gap-2 pt-1">
          {isComplete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleViewReceipt}
                className="flex-1 h-11 bg-[#059447] hover:bg-[#047857] text-white font-semibold text-[14px] rounded-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <FileText size={16} />
                <span>View receipt</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('Rate & Tip driver opened', 'info')}
                className="h-11 px-4 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-semibold text-[13.5px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <Star size={16} className="fill-amber-400 text-amber-400" />
                <span>Rate driver</span>
              </button>
            </div>
          ) : isEnRoute ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareTracking}
                className="flex-1 h-11 bg-[#059447] hover:bg-[#047857] text-white font-semibold text-[14px] rounded-[12px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
              >
                <Share2 size={16} />
                <span>Share tracking</span>
              </button>
              <button
                type="button"
                onClick={() => showToast('Support line: +256 800 100 200', 'info')}
                className="h-11 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[13px] rounded-[12px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <ShieldAlert size={16} />
                <span>Support</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full h-11 bg-white hover:bg-rose-50 active:scale-[0.99] border border-rose-300 text-rose-600 rounded-[12px] font-bold text-[14px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <X size={16} />
              <span>Cancel trip</span>
            </button>
          )}

          {/* DEV STATE SIMULATOR BAR */}
          {!isComplete && (
            <button
              type="button"
              onClick={handleAdvance}
              className="w-full py-1.5 mt-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 border border-dashed border-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-slate-50/50"
            >
              <RefreshCw size={12} className="animate-spin duration-3000" />
              <span>Dev: simulate next tracking state ({trip.trackingState})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
