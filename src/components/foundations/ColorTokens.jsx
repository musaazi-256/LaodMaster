const SWATCHES = [
  { name: 'green-50', className: 'bg-green-50', text: 'text-neutral-900' },
  { name: 'green-100', className: 'bg-green-100', text: 'text-neutral-900' },
  { name: 'green-500', className: 'bg-green-500', text: 'text-white' },
  { name: 'green-700', className: 'bg-green-700', text: 'text-white' },
  { name: 'neutral-50', className: 'bg-neutral-50', text: 'text-neutral-900' },
  { name: 'neutral-200', className: 'bg-neutral-200', text: 'text-neutral-900' },
  { name: 'neutral-500', className: 'bg-neutral-500', text: 'text-white' },
  { name: 'neutral-600', className: 'bg-neutral-600', text: 'text-white' },
  { name: 'neutral-900', className: 'bg-neutral-900', text: 'text-white' },
  { name: 'amber-500', className: 'bg-amber-500', text: 'text-white' },
  { name: 'red-500', className: 'bg-red-500', text: 'text-white' },
  { name: 'blue-500', className: 'bg-blue-500', text: 'text-white' },
];

export default function ColorTokens() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
      {SWATCHES.map((s) => (
        <div key={s.name} className={`${s.className} ${s.text} rounded-card h-20 flex items-end p-2.5 text-small font-medium`}>
          {s.name}
        </div>
      ))}
    </div>
  );
}
