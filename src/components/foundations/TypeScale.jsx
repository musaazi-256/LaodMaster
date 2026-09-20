const STYLES = [
  { name: 'h1', className: 'text-h1' },
  { name: 'h2', className: 'text-h2' },
  { name: 'h3', className: 'text-h3' },
  { name: 'h4', className: 'text-h4' },
  { name: 'body', className: 'text-body' },
  { name: 'body-sm', className: 'text-body-sm' },
  { name: 'label', className: 'text-label' },
  { name: 'small', className: 'text-small' },
];

export default function TypeScale() {
  return (
    <div className="flex flex-col gap-3">
      {STYLES.map((s) => (
        <div key={s.name} className="flex items-baseline gap-4 border-b border-neutral-200 pb-3">
          <span className="w-20 flex-shrink-0 text-small text-neutral-500 font-mono">{s.name}</span>
          <span className={`${s.className} text-neutral-900`}>LoadMastr moves Uganda</span>
        </div>
      ))}
    </div>
  );
}
