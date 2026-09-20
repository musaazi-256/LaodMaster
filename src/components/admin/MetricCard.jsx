import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export default function MetricCard({ label, value, icon: Icon, delta, deltaDirection = 'up', className }) {
  return (
    <Card className={cn('p-4 flex flex-col gap-2.5 shadow-1', className)}>
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-neutral-500 font-medium">{label}</span>
        {Icon && (
          <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-green-50 text-green-700">
            <Icon size={15} />
          </span>
        )}
      </div>
      <span className="text-h2 font-bold text-neutral-900 leading-none">{value}</span>
      {delta && (
        <Badge
          variant={deltaDirection === 'up' ? 'success' : 'destructive'}
          className="w-fit flex items-center gap-1 font-semibold text-small"
        >
          {deltaDirection === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta}
        </Badge>
      )}
    </Card>
  );
}
