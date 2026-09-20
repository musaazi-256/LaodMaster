import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

export default function ErrorState({ title = 'Something went wrong', description, action, className }) {
  return (
    <Card className={cn('flex flex-col items-center justify-center text-center px-6 py-12 border-neutral-200 bg-white', className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500 mb-4">
        <AlertTriangle size={26} />
      </span>
      <h3 className="text-h4 text-neutral-900 mb-1">{title}</h3>
      {description && <p className="text-body-sm text-neutral-500 max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}
