import { Wallet, Plus } from 'lucide-react';
import { formatUGX } from '../../lib/format';
import { Card } from '../ui/card';
import Button from '../actions/Button';

export default function WalletCard({ balance = 0, onTopUp }) {
  return (
    <Card className="bg-green-700 text-white p-5 flex flex-col gap-4 border-none shadow-md">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-body-sm text-green-100">
          <Wallet size={16} /> Wallet balance
        </span>
      </div>
      <span className="text-h1">{formatUGX(balance)}</span>
      {onTopUp && (
        <Button
          type="button"
          onClick={onTopUp}
          className="self-start inline-flex items-center gap-1.5 bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-colors duration-fast h-9 px-3 text-label"
        >
          <Plus size={14} /> Top up
        </Button>
      )}
    </Card>
  );
}
