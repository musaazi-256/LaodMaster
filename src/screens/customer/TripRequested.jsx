import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, CheckCircle2, X, Radar } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import MapCanvas from '../../components/logistics/MapCanvas';
import smallTruckFrontSide from '../../assets/trucks/Small truck front side.png';

export default function TripRequested() {
  const navigate = useNavigate();
  const { customer } = useAppState();
  const { activeTrip, draft, cancelTrip } = customer;

  useEffect(() => {
    if (!activeTrip && !draft.pickup?.label && !draft.destination?.label) {
      navigate('/customer', { replace: true });
      return undefined;
    }
    if (activeTrip && activeTrip.trackingState !== 'searching') {
      navigate(`/customer/tracking/${activeTrip.id}`, { replace: true });
    }
    return undefined;
  }, [activeTrip, draft, navigate]);

  function handleCancel() {
    if (activeTrip?.id) {
      cancelTrip(activeTrip.id);
    }
    navigate('/customer');
  }

  const originText = activeTrip?.origin || draft?.pickup?.label || 'Kira Road';
  const destinationText = activeTrip?.destination || draft?.destination?.label || 'Garden City Mall';

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col justify-between overflow-hidden font-sans bg-slate-100">
      {/* BACKGROUND MAP CANVAS */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          state="searching"
          originLabel={originText}
          destinationLabel={destinationText}
          fullBleed
          visiblePadding={{ top: 140, bottom: 270, left: 24, right: 24 }}
        />
      </div>

      {/* TOP HEADER & FLOATING ROUTE SUMMARY CARD */}
      <div className="relative z-20 pt-12 px-4 flex flex-col gap-3 pointer-events-none">
        {/* Header Bar */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={handleCancel}
            className="w-10 h-10 rounded-full bg-white shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col text-left">
            <h1 className="text-[20px] font-extrabold text-[#020617] leading-tight tracking-tight">
              Finding a truck
            </h1>
            <p className="text-[12.5px] font-normal text-[#64748B] leading-tight">
              We're searching for nearby trucks
            </p>
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
                Pickup location
              </span>
              <span className="text-[13px] font-bold text-[#0F172A] truncate leading-tight mt-0.5">
                {originText}
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
                Drop-off location
              </span>
              <span className="text-[13px] font-bold text-[#0F172A] truncate leading-tight mt-0.5">
                {destinationText}
              </span>
            </div>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            onClick={() => navigate('/customer/request')}
            className="w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors shrink-0 cursor-pointer ml-1"
            title="Edit location"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {/* MAP OVERLAY FLOATING STATUS RADAR PILL */}
      <div className="relative z-20 px-4 mb-2 pointer-events-none">
        <div className="inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md shadow-md rounded-full border border-neutral-200/80 px-3.5 py-2 pointer-events-auto">
          <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059447] shrink-0">
            <Radar size={15} className="animate-spin duration-3000" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[12px] font-bold text-[#0F172A] leading-tight">
              Searching within 10 km
            </span>
            <span className="text-[10.5px] font-normal text-[#64748B] leading-tight">
              Finding the best available trucks...
            </span>
          </div>
        </div>
      </div>

      {/* BOTTOM SHEET ORDER PANEL */}
      <div className="relative z-20 w-full max-w-md mx-auto bg-white rounded-t-[28px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] p-5 pb-6 flex flex-col gap-4 border-t border-neutral-200/80 shrink-0">
        {/* DRAG HANDLE PILL */}
        <div className="w-[52px] h-[5px] bg-[#475569]/30 rounded-full mx-auto" />

        {/* STATUS CARD */}
        <div className="bg-[#F8FAFC] rounded-[20px] p-4 border border-slate-100 flex items-start gap-4">
          {/* 3D Truck Illustration Badge */}
          <div className="w-18 h-18 rounded-full bg-[#E8F7EF] border border-[#50BB7F]/30 flex items-center justify-center shrink-0 relative overflow-hidden shadow-2xs">
            <img
              src={smallTruckFrontSide}
              alt="Searching Truck"
              className="w-12 h-12 object-contain animate-pulse"
            />
          </div>

          {/* Content & Progress Checklist */}
          <div className="flex flex-col flex-1 min-w-0 text-left">
            <h3 className="text-[16px] font-extrabold text-[#020617] leading-tight">
              Looking for nearby trucks...
            </h3>
            <p className="text-[11.5px] font-normal text-[#64748B] mt-0.5">
              This usually takes less than a minute.
            </p>

            {/* Checklist */}
            <div className="flex flex-col gap-1.5 mt-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A]">
                <CheckCircle2 size={14} className="text-[#059447] shrink-0" />
                <span>Checking available trucks</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A]">
                <CheckCircle2 size={14} className="text-[#059447] shrink-0" />
                <span>Finding the closest drivers</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0F172A]">
                <CheckCircle2 size={14} className="text-[#059447] shrink-0" />
                <span>Estimating arrival times</span>
              </div>
            </div>
          </div>
        </div>

        {/* CANCEL REQUEST BUTTON */}
        <button
          type="button"
          onClick={handleCancel}
          className="w-full h-12 bg-white hover:bg-rose-50 active:scale-[0.99] border border-rose-300 text-rose-600 rounded-[14px] font-bold text-[14.5px] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <X size={17} />
          <span>Cancel request</span>
        </button>
      </div>
    </div>
  );
}
