import { cx } from '../../lib/cx';

export default function RouteLine({ originLabel, destinationLabel, className }) {
  return (
    <div className={cx('flex gap-3', className)}>
      <div className="flex flex-col items-center pt-1">
        <span className="h-2.5 w-2.5 rounded-pill bg-green-500 ring-4 ring-green-100 flex-shrink-0" />
        <span className="w-0.5 flex-1 min-h-[20px] border-l-2 border-dashed border-neutral-200 my-1" />
        <span className="h-2.5 w-2.5 rounded-[3px] bg-neutral-900 flex-shrink-0" />
      </div>
      <div className="flex flex-col justify-between py-0.5 min-w-0">
        <span className="text-body-sm text-neutral-900 truncate">{originLabel}</span>
        <span className="text-body-sm text-neutral-900 truncate">{destinationLabel}</span>
      </div>
    </div>
  );
}
