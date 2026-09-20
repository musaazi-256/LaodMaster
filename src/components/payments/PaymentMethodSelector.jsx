import { Smartphone, CreditCard, Wallet, Landmark } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';

const ICONS = { momo: Smartphone, card: CreditCard, wallet: Wallet, bank: Landmark };

export default function PaymentMethodSelector({ methods = [], selectedId, onSelect, className }) {
  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      {methods.map((method) => {
        const Icon = ICONS[method.type] || Wallet;
        const isSelected = method.id === selectedId;
        return (
          <Card
            key={method.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect?.(method.id)}
            className={cn(
              'flex items-center gap-3 border-2 bg-white px-4 py-3.5 text-left transition-colors duration-fast cursor-pointer',
              isSelected ? 'border-green-500 bg-green-50' : 'border-neutral-200 hover:border-neutral-500/40'
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-neutral-50 text-neutral-900">
              <Icon size={18} />
            </span>
            <span className="flex flex-col min-w-0 flex-1">
              <span className="text-label text-neutral-900">{method.label}</span>
              <span className="text-small text-neutral-500 truncate">{method.detail}</span>
            </span>
            {method.isDefault && (
              <Badge variant="success" className="px-2 py-0.5">
                Default
              </Badge>
            )}
            <span
              className={cn(
                'flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center',
                isSelected ? 'border-green-500' : 'border-neutral-200'
              )}
            >
              {isSelected && <span className="h-2.5 w-2.5 rounded-full bg-green-500" />}
            </span>
          </Card>
        );
      })}
    </div>
  );
}
