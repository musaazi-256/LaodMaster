import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 h-full flex items-end">
            <div
              className="w-full rounded-t-[4px] bg-green-500 transition-all duration-standard"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: 4 }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        {data.map((d, i) => (
          <span key={i} className="flex-1 text-center text-small text-neutral-500 font-medium">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function LineChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100;
  const h = 100;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - (d.value / max) * h;
    return `${x},${y}`;
  });

  return (
    <div className="h-32">
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        <polyline points={points.join(' ')} fill="none" stroke="#50BB7F" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between mt-1.5">
        {data.map((d, i) => (
          <span key={i} className="text-small text-neutral-500 font-medium">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export default function ChartCard({ title, subtitle, type = 'bar', data = [], actions, className }) {
  return (
    <Card className={cn('p-4 flex flex-col gap-4 shadow-1', className)}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-label font-bold text-neutral-900">{title}</span>
          {subtitle && <span className="text-small text-neutral-500">{subtitle}</span>}
        </div>
        {actions}
      </div>
      {type === 'bar' ? <BarChart data={data} /> : <LineChart data={data} />}
    </Card>
  );
}
