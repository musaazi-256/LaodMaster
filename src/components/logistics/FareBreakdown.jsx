import { formatUGX } from '../../lib/format';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export default function FareBreakdown({ items = [], total, disclaimer, className }) {
  return (
    <Card className={cn('border border-neutral-200 bg-white p-4 flex flex-col gap-3', className)}>
      <h3 className="text-label text-neutral-900">Fare breakdown</h3>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-body-sm">
            <span className="text-neutral-500">{item.label}</span>
            <span className="text-neutral-900">{formatUGX(item.amount)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
        <span className="text-label text-neutral-900">Total</span>
        <span className="text-h4 text-neutral-900">{formatUGX(total)}</span>
      </div>
      {disclaimer && <p className="text-small text-neutral-500">{disclaimer}</p>}
    </Card>
  );
}
