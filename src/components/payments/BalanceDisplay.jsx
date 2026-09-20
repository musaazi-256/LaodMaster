import { cx } from '../../lib/cx';
import { formatUGX } from '../../lib/format';

export default function BalanceDisplay({ label = 'Wallet balance', amount, size = 'lg', className }) {
  return (
    <div className={cx('flex flex-col gap-1', className)}>
      <span className="text-body-sm text-neutral-500">{label}</span>
      <span className={cx(size === 'lg' ? 'text-h1' : 'text-h2', 'text-neutral-900')}>
        {formatUGX(amount)}
      </span>
    </div>
  );
}
