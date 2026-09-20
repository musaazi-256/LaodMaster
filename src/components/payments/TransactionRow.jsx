import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatUGX } from '../../lib/format';
import PaymentStatusBadge from './PaymentStatusBadge';

export default function TransactionRow({ direction = 'debit', title, subtitle, amount, status, onClick, className }) {
  const isCredit = direction === 'credit';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 py-3.5 text-left transition-colors duration-fast hover:bg-neutral-50 rounded-[8px] px-2 -mx-2',
        className
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
          isCredit ? 'bg-green-50 text-green-700' : 'bg-neutral-100 text-neutral-600'
        )}
      >
        {isCredit ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
      </span>
      <span className="flex flex-col min-w-0 flex-1">
        <span className="text-label text-neutral-900 truncate">{title}</span>
        <span className="text-small text-neutral-500 truncate">{subtitle}</span>
      </span>
      <span className="flex flex-col items-end gap-1">
        <span className={cn('text-label', isCredit ? 'text-green-700' : 'text-neutral-900')}>
          {isCredit ? '+' : '-'}
          {formatUGX(amount)}
        </span>
        {status && <PaymentStatusBadge status={status} />}
      </span>
    </button>
  );
}
