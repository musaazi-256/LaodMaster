const RADII = [
  { name: 'button / input', className: 'rounded-button' },
  { name: 'card', className: 'rounded-card' },
  { name: 'pill', className: 'rounded-pill' },
];

export default function RadiusScale() {
  return (
    <div className="flex flex-wrap gap-5">
      {RADII.map((r) => (
        <div key={r.name} className="flex flex-col items-center gap-2">
          <div className={`h-16 w-16 bg-green-100 border-2 border-green-500 ${r.className}`} />
          <span className="text-small text-neutral-500">{r.name}</span>
        </div>
      ))}
    </div>
  );
}
