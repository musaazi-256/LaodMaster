import { Wifi, Signal, Truck } from 'lucide-react';

export default function DeviceStatusBar({ platform = 'ios', transparent = true }) {
  const bgClass = transparent ? 'bg-transparent text-neutral-900' : 'bg-white text-neutral-900';

  if (platform === 'android') {
    return (
      <div className={`w-full h-9 ${bgClass} text-[11px] font-medium px-4 flex items-center justify-between select-none absolute top-0 inset-x-0 z-30 shrink-0 pointer-events-none`}>
        {/* Left: Time & Notification Icon */}
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight text-neutral-900">10:00</span>
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500 text-white p-0.5">
            <Truck size={10} />
          </span>
        </div>

        {/* Center: Punch hole camera */}
        <div className="absolute left-1/2 -translate-x-1/2 top-2 w-3.5 h-3.5 bg-neutral-900 rounded-full border border-neutral-800 shadow-inner flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-black rounded-full opacity-60" />
        </div>

        {/* Right: Network & Battery */}
        <div className="flex items-center gap-1.5 text-neutral-700">
          <Wifi size={12} />
          <span className="text-[10px] font-mono font-semibold text-neutral-800">5G</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-neutral-700">95%</span>
            <div className="w-4 h-2.5 border border-neutral-800 rounded-[2px] p-[1px] flex items-center">
              <div className="h-full bg-neutral-900 w-[85%] rounded-[1px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS Default
  return (
    <div className={`w-full h-11 ${bgClass} text-[12px] font-semibold px-6 flex items-center justify-between select-none absolute top-0 inset-x-0 z-30 shrink-0 pointer-events-none`}>
      {/* Left: Time */}
      <div className="w-16 flex items-center">
        <span className="text-neutral-900 font-semibold">9:41</span>
      </div>

      {/* Center: Dynamic Island */}
      <div className="w-[110px] h-7 bg-neutral-950 rounded-full shadow-sm flex items-center justify-between px-2.5 border border-neutral-900 pointer-events-auto">
        <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-700 flex items-center justify-center">
          <div className="w-1 h-1 bg-blue-500 rounded-full" />
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* Right: Icons */}
      <div className="w-16 flex items-center justify-end gap-1.5 text-neutral-800">
        <Signal size={12} />
        <Wifi size={12} />
        <div className="w-5 h-2.5 border border-neutral-800 rounded-[3px] p-[1px] relative flex items-center">
          <div className="h-full bg-neutral-900 w-[75%] rounded-[1px]" />
          <div className="absolute -right-1 top-0.5 w-[2px] h-1 bg-neutral-800 rounded-r-[1px]" />
        </div>
      </div>
    </div>
  );
}
