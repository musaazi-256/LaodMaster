import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MapPin, Target, Check, Search, X, Clock, LocateFixed } from 'lucide-react';
import { useAppState } from '../../state/AppStateContext';
import MapCanvas from '../../components/logistics/MapCanvas';
import { LOCATION_SUGGESTIONS } from '../../mock-data/users';
import { cn } from '../../lib/utils';

const RECENT_DESTINATIONS = [
  { label: 'Entebbe, kitooro', subtitle: 'Entebbe, Uganda' },
  { label: 'Kira, Bulindo', subtitle: 'Kira Municipality, Uganda' },
  { label: 'Kasubi, Dam', subtitle: 'Kampala, Uganda' },
  { label: 'Entebbe, kitooro', subtitle: 'Entebbe, Uganda' },
];

const SEARCH_SUGGESTIONS_EXTENDED = [
  ...LOCATION_SUGGESTIONS,
  { id: 'ext-1', label: 'Garden City Mall', subtitle: 'Yusuf Lule Road, Kampala' },
  { id: 'ext-2', label: 'Acacia Mall', subtitle: 'Kisementi, Kampala' },
  { id: 'ext-3', label: 'Ntinda Shopping Centre', subtitle: 'Ntinda Road, Kampala' },
  { id: 'ext-4', label: 'Entebbe International Airport', subtitle: 'Entebbe, Wakiso' },
  { id: 'ext-5', label: 'Nakawa Market', subtitle: 'Nakawa, Kampala' },
  { id: 'ext-6', label: 'Kira Road Police Station', subtitle: 'Kira Road, Kampala' },
  { id: 'ext-7', label: 'Naalya Quality Shopping Mall', subtitle: 'Naalya, Kampala' },
];

export default function RequestEntry() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { customer } = useAppState();
  const { draft, updateDraft } = customer;

  // In-place Search Modal Drawer State
  const initialField = params.get('field');
  const [activeSearchField, setActiveSearchField] = useState(
    initialField === 'pickup' || initialField === 'destination' ? initialField : null
  );
  const [searchQuery, setSearchQuery] = useState('');

  // The map needs to know how much of its bottom edge this sheet actually covers so it can
  // keep pins clear of it — a hardcoded guess drifts out of sync the moment this card's
  // content changes (longer address text wrapping to a second line, an extra suggestion
  // row, etc.), silently leaving a selected destination's pin hidden under the sheet.
  // Measuring the real rendered height keeps the two in sync automatically.
  const sheetRef = useRef(null);
  const [sheetHeight, setSheetHeight] = useState(345);

  useEffect(() => {
    const el = sheetRef.current;
    if (!el) return undefined;
    const update = () => setSheetHeight(el.getBoundingClientRect().height);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Sync with URL params if field param changes
  useEffect(() => {
    const field = params.get('field');
    if (field === 'pickup' || field === 'destination') {
      setActiveSearchField(field);
    }
  }, [params]);

  const pickupText = draft.pickup?.label || '';
  const destinationText = draft.destination?.label || '';
  const canContinue = Boolean(pickupText && destinationText);

  function openSearch(field) {
    setActiveSearchField(field);
    setSearchQuery('');
  }

  function closeSearchDrawer() {
    setActiveSearchField(null);
    setSearchQuery('');
    if (params.get('field')) {
      setParams({});
    }
  }

  function selectLocation(loc) {
    if (activeSearchField) {
      updateDraft({ [activeSearchField]: loc });
    }
    closeSearchDrawer();
  }

  function handleRecentSelect(dest) {
    updateDraft({
      destination: { id: dest.label.toLowerCase().replace(/\s+/g, '-'), label: dest.label, subtitle: dest.subtitle },
    });
  }

  function handleContinue() {
    if (!pickupText) {
      openSearch('pickup');
    } else if (!destinationText) {
      openSearch('destination');
    } else {
      navigate('/customer/request/cargo');
    }
  }

  const filteredSuggestions = searchQuery
    ? SEARCH_SUGGESTIONS_EXTENDED.filter(
        (s) =>
          s.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.subtitle && s.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  return (
    <div className="relative w-full h-full min-h-0 flex flex-col justify-between overflow-hidden font-sans bg-slate-100">
      {/* BACKGROUND MAP CANVAS - Fills 100% viewport */}
      <div className="absolute inset-0 z-0">
        <MapCanvas
          state="idle"
          originLabel={pickupText}
          destinationLabel={destinationText || 'Destination'}
          fullBleed
          visiblePadding={{ top: 105, bottom: sheetHeight, left: 36, right: 36 }}
        />
      </div>

      {/* TOP FLOATING BACK BUTTON BELOW TRANSPARENT STATUS BAR */}
      <div className="relative z-20 pt-12 px-4 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={() => navigate('/customer')}
          className="w-10 h-10 rounded-full bg-white shadow-md border border-neutral-200/80 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer pointer-events-auto"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
        </button>
      </div>

      {/* BOTTOM SHEET ORDER CARD */}
      <div
        ref={sheetRef}
        className="relative z-20 w-full max-w-md mx-auto bg-white shadow-[0px_-8px_30px_rgba(0,0,0,0.12)] rounded-t-[28px] border-t border-neutral-200/80 pt-3 pb-6 px-6 flex flex-col gap-4 shrink-0"
      >
        {/* DRAG HANDLE PILL */}
        <div className="w-[52px] h-[5px] bg-[#475569]/30 rounded-full mx-auto" />

        {/* HEADER TITLE & SUBTITLE */}
        <div className="flex flex-col text-left">
          <h1 className="text-[21px] font-extrabold text-[#020617] leading-tight tracking-tight">
            Move anything, anywhere.
          </h1>
          <p className="text-[12px] font-normal text-[#64748B] leading-normal mt-0.5">
            Book a truck for your cargo, Fast, reliable and affordable
          </p>
        </div>

        {/* ROUTE CONNECTORS & INPUT STACK */}
        <div className="flex items-center gap-3 py-0.5">
          {/* VERTICAL CONNECTOR GRAPHIC */}
          <div className="flex flex-col items-center justify-between h-[98px] py-1 shrink-0">
            {/* Pickup Node (Green Ring with Inner Dot) */}
            <div className="w-[18px] h-[18px] rounded-full border-2 border-[#52C498] bg-white flex items-center justify-center shrink-0 shadow-2xs">
              <div className="w-[8px] h-[8px] rounded-full bg-[#52C498]" />
            </div>

            {/* Dashed Connecting Line */}
            <div className="w-0 h-[44px] border-l-2 border-dashed border-[#94A3B8]/60 my-0.5" />

            {/* Destination Node (Circle with Check Icon) */}
            <div
              className={cn(
                'w-[20px] h-[20px] rounded-full border flex items-center justify-center shrink-0 transition-colors',
                destinationText
                  ? 'border-[#52C498] bg-emerald-50 text-[#52C498]'
                  : 'border-[#94A3B8] bg-white text-[#94A3B8]'
              )}
            >
              <Check size={12} strokeWidth={2.5} />
            </div>
          </div>

          {/* INPUT CARDS STACK */}
          <div className="flex-1 flex flex-col gap-3">
            {/* PICKUP INPUT BOX */}
            <div
              onClick={() => openSearch('pickup')}
              className={cn(
                'h-[46px] px-3.5 py-1.5 bg-white rounded-[10px] border transition-all flex items-center justify-between cursor-pointer shadow-2xs group',
                pickupText
                  ? 'border-[#52C498] bg-emerald-50/20'
                  : 'border-[#E2E8F0] hover:border-[#52C498]'
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                <MapPin size={17} className={cn('shrink-0', pickupText ? 'text-[#52C498]' : 'text-[#94A3B8]')} />
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-normal text-[#64748B] leading-tight">
                    Where is the cargo?
                  </span>
                  <span
                    className={cn(
                      'text-[13px] font-semibold truncate leading-tight',
                      pickupText ? 'text-[#020617]' : 'text-[#94A3B8]'
                    )}
                  >
                    {pickupText || 'Enter pickup location'}
                  </span>
                </div>
              </div>

              {/* Crosshair Target Location Button (Use Current Location) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateDraft({
                    pickup: { id: 'current-loc', label: 'Ntinda, Kampala', subtitle: 'Current Location' },
                  });
                }}
                className="w-7 h-7 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg flex items-center justify-center text-[#64748B] hover:text-[#52C498] transition-colors shrink-0 ml-2 cursor-pointer"
                aria-label="Use current location"
                title="Use current location"
              >
                <Target size={14} />
              </button>
            </div>

            {/* DESTINATION INPUT BOX */}
            <div
              onClick={() => openSearch('destination')}
              className={cn(
                'h-[46px] px-3.5 py-1.5 bg-white rounded-[10px] border transition-all flex items-center justify-between cursor-pointer shadow-2xs group',
                destinationText
                  ? 'border-[#52C498] bg-emerald-50/20'
                  : 'border-[#E2E8F0] hover:border-[#52C498]'
              )}
            >
              <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                <MapPin size={17} className="text-[#94A3B8] shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="text-[10px] font-normal text-[#64748B] leading-tight">
                    Where is the cargo?
                  </span>
                  <span
                    className={cn(
                      'text-[13px] font-semibold truncate leading-tight',
                      destinationText ? 'text-[#020617]' : 'text-[#94A3B8]'
                    )}
                  >
                    {destinationText || 'Enter destination'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT DESTINATIONS SECTION */}
        <div className="flex flex-col gap-2 pt-0.5">
          <span className="text-[13px] font-bold text-[#020617] text-left">
            Recent destinations
          </span>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
            {RECENT_DESTINATIONS.map((dest, idx) => {
              const isSelected = destinationText.toLowerCase() === dest.label.toLowerCase();
              return (
                <button
                  key={`${dest.label}-${idx}`}
                  type="button"
                  onClick={() => handleRecentSelect(dest)}
                  className={cn(
                    'h-8 px-4 rounded-full text-[12px] font-medium flex items-center justify-center shrink-0 transition-all cursor-pointer border shadow-2xs',
                    isSelected
                      ? 'bg-emerald-50 border-[#52C498] text-[#047857]'
                      : 'bg-white border-[#E2E8F0] text-[#475569] hover:bg-neutral-50 hover:border-neutral-300'
                  )}
                >
                  {dest.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* PRIMARY CONTINUE BUTTON */}
        <button
          type="button"
          onClick={handleContinue}
          className="w-full h-[48px] bg-[#52C498] hover:bg-[#43b589] active:scale-[0.99] text-white font-semibold text-[15px] rounded-[12px] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer mt-1"
        >
          <span>Continue</span>
        </button>
      </div>

      {/* IN-PLACE LOCATION SEARCH DRAWER OVERLAY */}
      {activeSearchField && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop Click Dismiss */}
          <div className="flex-1 w-full" onClick={closeSearchDrawer} />

          {/* Location Search Sheet Modal */}
          <div className="relative z-50 w-full max-w-md mx-auto bg-white rounded-t-[28px] shadow-2xl p-5 flex flex-col gap-3 max-h-[82vh] animate-in slide-in-from-bottom duration-300 border-t border-neutral-200/80">
            {/* Drag Handle */}
            <div className="w-[52px] h-[5px] bg-[#475569]/30 rounded-full mx-auto mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeSearchDrawer}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-700 transition-colors"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-[17px] font-bold text-neutral-900">
                  {activeSearchField === 'pickup' ? 'Set pickup location' : 'Set drop-off location'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSearchDrawer}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input Field */}
            <div className="relative flex items-center mt-1">
              <Search size={18} className="absolute left-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder="Search for a location"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-9 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-[#52C498] text-[14px] text-neutral-900 outline-none transition-all placeholder:text-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-neutral-400 hover:text-neutral-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Use Current Location Button */}
            <button
              type="button"
              onClick={() => selectLocation({ id: 'current', label: 'Current location', subtitle: 'Using GPS' })}
              className="flex items-center gap-3 py-3 border-b border-neutral-100 text-left hover:bg-emerald-50/50 rounded-lg px-2 transition-colors group"
            >
              <span className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#52C498] shrink-0 group-hover:scale-105 transition-transform">
                <LocateFixed size={17} />
              </span>
              <span className="text-[14px] font-semibold text-[#52C498]">Use current location</span>
            </button>

            {/* Suggestions & Recent List */}
            <div className="flex-1 overflow-y-auto max-h-[38vh] flex flex-col gap-1 pt-1 no-scrollbar">
              {searchQuery ? (
                filteredSuggestions.length > 0 ? (
                  filteredSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => selectLocation(s)}
                      className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-neutral-50 rounded-lg text-left transition-colors"
                    >
                      <MapPin size={18} className="text-neutral-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-medium text-neutral-900 truncate">{s.label}</span>
                        {s.subtitle && <span className="text-[11.5px] text-neutral-500 truncate">{s.subtitle}</span>}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-[13px] text-neutral-400">
                    No matching locations found
                  </div>
                )
              ) : (
                <>
                  <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 pt-2">
                    Recent
                  </span>
                  {[
                    { id: 'rec-1', label: 'Garden City Mall', subtitle: 'Yusuf Lule Road, Kampala' },
                    { id: 'rec-2', label: 'Current location', subtitle: 'Using GPS' },
                    { id: 'rec-3', label: 'Entebbe International Airport', subtitle: 'Entebbe, Wakiso' },
                    { id: 'rec-4', label: 'Kira Road', subtitle: 'Kira, Wakiso' },
                  ].map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => selectLocation(loc)}
                      className="w-full flex items-center gap-3 py-2.5 px-2 hover:bg-neutral-50 rounded-lg text-left transition-colors"
                    >
                      <Clock size={17} className="text-neutral-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13.5px] font-medium text-neutral-900 truncate">{loc.label}</span>
                        {loc.subtitle && <span className="text-[11.5px] text-neutral-500 truncate">{loc.subtitle}</span>}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
