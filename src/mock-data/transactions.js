export const TRANSACTIONS = [
  {
    id: 'txn-5001',
    direction: 'debit',
    title: 'Trip to Entebbe',
    subtitle: '2 Sep 2026 · MTN Mobile Money',
    amount: 120000,
    status: 'success',
  },
  {
    id: 'txn-5002',
    direction: 'credit',
    title: 'Wallet top-up',
    subtitle: '30 Aug 2026 · Airtel Money',
    amount: 200000,
    status: 'success',
  },
  {
    id: 'txn-5003',
    direction: 'debit',
    title: 'Trip to Mukono',
    subtitle: '28 Aug 2026 · Wallet',
    amount: 95000,
    status: 'pending',
  },
  {
    id: 'txn-5004',
    direction: 'credit',
    title: 'Refund — Trip cancelled',
    subtitle: '25 Aug 2026',
    amount: 42000,
    status: 'refunded',
  },
  {
    id: 'txn-5005',
    direction: 'debit',
    title: 'Trip to Jinja',
    subtitle: '20 Aug 2026 · MTN Mobile Money',
    amount: 310000,
    status: 'failed',
  },
];

export const PAYMENT_METHODS = [
  { id: 'pm-1', type: 'momo', label: 'MTN Mobile Money', detail: '+256 772 345 678', isDefault: true },
  { id: 'pm-2', type: 'momo', label: 'Airtel Money', detail: '+256 701 223 344', isDefault: false },
  { id: 'pm-3', type: 'wallet', label: 'LoadMastr Wallet', detail: 'Balance: UGX 245,000', isDefault: false },
];
