import { Check } from 'lucide-react';
import { cx } from '../../lib/cx';

export default function TripTimeline({ steps = [], className }) {
  return (
    <div className={cx('flex flex-col', className)}>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cx(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-pill border-2',
                  step.completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.active
                      ? 'border-green-500 text-green-500'
                      : 'border-neutral-200 text-neutral-200'
                )}
              >
                {step.completed ? (
                  <Check size={13} strokeWidth={3} />
                ) : (
                  <span className="h-2 w-2 rounded-pill bg-current" />
                )}
              </span>
              {!isLast && (
                <span className={cx('w-0.5 flex-1 min-h-[24px]', step.completed ? 'bg-green-500' : 'bg-neutral-200')} />
              )}
            </div>
            <div className={cx('flex flex-col pb-6', isLast && 'pb-0')}>
              <span className={cx('text-label', step.completed || step.active ? 'text-neutral-900' : 'text-neutral-500')}>
                {step.label}
              </span>
              {step.time && <span className="text-small text-neutral-500">{step.time}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
