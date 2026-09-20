const STEPS = [4, 8, 12, 16, 24, 32, 40, 48, 64];

export default function SpacingScale() {
  return (
    <div className="flex flex-col gap-2.5">
      {STEPS.map((px) => (
        <div key={px} className="flex items-center gap-3">
          <span className="w-10 flex-shrink-0 text-small text-neutral-500 font-mono">{px}px</span>
          <div className="bg-green-500 h-3 rounded-[2px]" style={{ width: px }} />
        </div>
      ))}
    </div>
  );
}
