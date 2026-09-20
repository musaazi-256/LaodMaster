import { FileText, Upload, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';

const STATUS = {
  empty: { icon: Upload, label: 'Tap to upload', className: 'text-neutral-500' },
  uploaded: { icon: FileText, label: 'Uploaded', className: 'text-neutral-900' },
  pending: { icon: Clock, label: 'Under review', className: 'text-amber-500' },
  verified: { icon: CheckCircle2, label: 'Verified', className: 'text-green-500' },
  rejected: { icon: XCircle, label: 'Rejected — re-upload', className: 'text-red-500' },
};

export default function DocumentUploadCard({ label, status = 'empty', fileName, onClick, className }) {
  const { icon: Icon, label: statusLabel, className: statusClass } = STATUS[status] || STATUS.empty;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 border border-dashed border-neutral-200 bg-white px-4 py-3.5 text-left transition-colors duration-fast hover:border-green-500 cursor-pointer',
        status !== 'empty' && 'border-solid',
        className
      )}
    >
      <span className={cn('flex h-10 w-10 items-center justify-center rounded-[8px] bg-neutral-50', statusClass)}>
        <Icon size={18} />
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-label text-neutral-900">{label}</span>
        <span className={cn('text-small truncate', statusClass)}>{fileName || statusLabel}</span>
      </span>
    </Card>
  );
}
